-- ============================================================
-- Tie .ac.uk auto-verification to actual email confirmation.
--
-- Before this migration, trg_auto_verify_acuk fired on profile
-- INSERT and trusted the email domain alone. Because
-- handle_new_user creates the profile the moment auth.users is
-- inserted -- i.e. before the user opens the confirmation link --
-- anyone could register fake@ox.ac.uk and immediately receive a
-- verified badge plus Formal-listing rights without ever proving
-- they own the address.
--
-- After this migration a profile is only marked verified once
-- auth.users.email_confirmed_at is set.
--
-- Entitlements (unchanged in intent, now correctly gated):
--   *.ac.uk confirmed          -> verified badge
--   *.ox.ac.uk / *.cam.ac.uk   -> verified badge + may publish Formal
--   anything else              -> no badge, no Formal
-- Non-Formal listings (coach, train, event, ride-share) stay open
-- to every account with can_list_ticket.
-- ============================================================

-- ---------- helpers ----------

create or replace function public.is_acuk_domain(p_email text)
returns boolean language sql immutable as $$
  select case
    when p_email is null then false
    else lower(split_part(p_email, '@', 2)) = 'ac.uk'
      or lower(split_part(p_email, '@', 2)) like '%.ac.uk'
  end;
$$;

create or replace function public.university_from_email(p_email text)
returns text language sql immutable as $$
  select case
    when p_email is null then null
    when lower(split_part(p_email, '@', 2)) = 'ox.ac.uk'
      or lower(split_part(p_email, '@', 2)) like '%.ox.ac.uk' then 'Oxford'
    when lower(split_part(p_email, '@', 2)) = 'cam.ac.uk'
      or lower(split_part(p_email, '@', 2)) like '%.cam.ac.uk' then 'Cambridge'
    else null
  end;
$$;

-- ---------- 1. profile insert: verify only if already confirmed ----------

create or replace function public.auto_verify_acuk()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_confirmed boolean;
begin
  if not public.is_acuk_domain(new.email) then
    return new;
  end if;

  -- Covers projects where email confirmation is disabled, in which case
  -- auth.users arrives already confirmed. When confirmation is required
  -- this is false at signup and the auth.users trigger below takes over.
  select (u.email_confirmed_at is not null)
    into v_confirmed
    from auth.users u
   where u.id = new.id;

  if coalesce(v_confirmed, false) then
    new.is_verified        := true;
    new.verified_at        := now();
    new.verification_email := lower(new.email);
    new.university         := coalesce(new.university, public.university_from_email(new.email));
  end if;

  return new;
end;
$$;

-- ---------- 2. email confirmation grants verification ----------

create or replace function public.sync_verification_on_confirm()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is null then
    return new;
  end if;

  -- Only act on the null -> not-null transition.
  if tg_op = 'UPDATE' and old.email_confirmed_at is not null then
    return new;
  end if;

  if not public.is_acuk_domain(new.email) then
    return new;
  end if;

  update public.profiles
     set is_verified        = true,
         verified_at        = coalesce(verified_at, now()),
         verification_email = coalesce(verification_email, lower(new.email)),
         university         = coalesce(university, public.university_from_email(new.email)),
         updated_at         = now()
   where id = new.id;

  return new;
end;
$$;

-- Named to sort after on_auth_user_created so the profile row exists first.
drop trigger if exists z_sync_verification_on_confirm_ins on auth.users;
create trigger z_sync_verification_on_confirm_ins
  after insert on auth.users
  for each row execute function public.sync_verification_on_confirm();

drop trigger if exists z_sync_verification_on_confirm_upd on auth.users;
create trigger z_sync_verification_on_confirm_upd
  after update of email_confirmed_at on auth.users
  for each row execute function public.sync_verification_on_confirm();

-- ---------- 3. revoke badges never backed by a confirmed email ----------

update public.profiles p
   set is_verified = false,
       verified_at = null,
       updated_at  = now()
  from auth.users u
 where u.id = p.id
   and p.is_verified
   and u.email_confirmed_at is null
   -- keep manual/secondary verifications done through verify_profile_email
   and (p.verification_email is null or lower(p.verification_email) = lower(p.email));

-- ---------- 4. restate the Formal-listing guard ----------
-- Unchanged in behaviour; rewritten to use the shared helpers so the
-- Oxford/Cambridge rule lives in exactly one place.

create or replace function public.guard_marketplace_write()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_profile public.profiles;
  v_email   text;
begin
  select * into v_profile from public.profiles where id = auth.uid();

  if v_profile.id is null then
    raise exception 'Profile not found. Please complete registration first.';
  end if;

  if v_profile.account_status = 'suspended' then
    raise exception 'Your account is suspended: %',
      coalesce(v_profile.suspension_reason, 'Contact support.');
  end if;

  if tg_table_name = 'ticket_listings' then
    if not v_profile.can_list_ticket then
      raise exception 'Your account does not have listing permission. Contact support.';
    end if;

    if coalesce(new.listing_category, 'formal') = 'formal' then
      if not v_profile.is_verified then
        raise exception 'Formal tickets require a confirmed Oxford or Cambridge email. Open the verification link we emailed you, then try again.';
      end if;

      v_email := coalesce(v_profile.verification_email, v_profile.email, '');

      if public.university_from_email(v_email) is null then
        raise exception 'Only verified Oxford or Cambridge accounts may publish Formal tickets. Other .ac.uk accounts can still post buyer requests, travel tickets and events.';
      end if;
    end if;
  end if;

  return new;
end;
$$;
