-- Add verification, contact email, and avatar fields to profiles
alter table public.profiles
  add column if not exists is_verified boolean not null default false,
  add column if not exists verified_at timestamptz,
  add column if not exists verification_email text,
  add column if not exists contact_email text,
  add column if not exists avatar_url text;

-- Auto-verify users who registered with ac.uk emails
update public.profiles
set is_verified = true,
    verified_at = created_at,
    verification_email = email
where email like '%.ac.uk'
  and is_verified = false;

-- Trigger: auto-set is_verified on insert if email ends with .ac.uk
create or replace function public.auto_verify_acuk()
returns trigger language plpgsql security definer as $$
begin
  if new.email is not null and lower(new.email) like '%.ac.uk' then
    new.is_verified := true;
    new.verified_at := now();
    new.verification_email := new.email;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_auto_verify_acuk on public.profiles;
create trigger trg_auto_verify_acuk
  before insert on public.profiles
  for each row execute function public.auto_verify_acuk();

-- Update guard_marketplace_write to check is_verified + oxbridge email
-- instead of just checking email domain directly for formal listings
create or replace function public.guard_marketplace_write()
returns trigger language plpgsql security definer as $$
declare
  v_profile public.profiles;
begin
  select * into v_profile
    from public.profiles
   where id = auth.uid();

  if v_profile.id is null then
    raise exception 'Profile not found. Please complete registration first.';
  end if;

  if v_profile.account_status = 'suspended' then
    raise exception 'Your account is suspended: %', coalesce(v_profile.suspension_reason, 'Contact support.');
  end if;

  -- For ticket_listings table: check formal listing permission
  if tg_table_name = 'ticket_listings' then
    if not v_profile.can_list_ticket then
      raise exception 'Your account does not have listing permission. Contact support.';
    end if;

    -- Formal listings require verified Oxbridge email
    if coalesce(new.listing_category, 'formal') = 'formal' then
      if not v_profile.is_verified then
        raise exception 'Formal tickets require a verified Oxford or Cambridge institutional email. Please verify your account in My Profile.';
      end if;
      declare
        v_domain text := lower(split_part(coalesce(v_profile.verification_email, v_profile.email, ''), '@', 2));
      begin
        if not (v_domain = 'ox.ac.uk' or v_domain like '%.ox.ac.uk'
             or v_domain = 'cam.ac.uk' or v_domain like '%.cam.ac.uk') then
          raise exception 'Only verified Oxford or Cambridge accounts may publish Formal tickets.';
        end if;
      end;
    end if;
  end if;

  return new;
end;
$$;

-- RPC: verify a profile with an ac.uk email (used after email code confirmation)
create or replace function public.verify_profile_email(
  p_verification_email text
) returns void language plpgsql security definer as $$
declare
  v_domain text;
begin
  v_domain := lower(split_part(p_verification_email, '@', 2));

  if not (v_domain = 'ac.uk' or v_domain like '%.ac.uk') then
    raise exception 'Verification requires a UK academic email ending in .ac.uk.';
  end if;

  update public.profiles
  set is_verified = true,
      verified_at = now(),
      verification_email = lower(p_verification_email),
      can_list_ticket = case
        when v_domain = 'ox.ac.uk' or v_domain like '%.ox.ac.uk'
          or v_domain = 'cam.ac.uk' or v_domain like '%.cam.ac.uk'
        then true
        else can_list_ticket
      end,
      university = case
        when v_domain = 'ox.ac.uk' or v_domain like '%.ox.ac.uk' then 'Oxford'
        when v_domain = 'cam.ac.uk' or v_domain like '%.cam.ac.uk' then 'Cambridge'
        else university
      end,
      updated_at = now()
  where id = auth.uid();
end;
$$;

-- Update admin_dashboard_snapshot to include new fields
-- (The existing RPC already does SELECT * so new columns are included)
