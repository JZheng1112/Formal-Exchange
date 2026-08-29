-- ============================================================
-- Close the secondary-verification hole.
--
-- verify_profile_email() granted is_verified, can_list_ticket and a
-- university from nothing but a string the client passed in. No email
-- was sent and no code was checked, so any account could type
-- anyone@ox.ac.uk in My Profile and immediately publish Formal
-- tickets. That bypassed the signup-path fix in
-- 20260829090000 entirely, and more cheaply -- it did not even
-- require receiving mail.
--
-- Verification now needs a one-time code delivered to the address
-- being claimed:
--   send-verification-code (edge fn) -> start_email_verification()
--   user reads the code                 (Resend)
--   client                           -> confirm_email_verification()
-- ============================================================

-- ---------- code store ----------

create table if not exists public.email_verification_codes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  email         text not null,
  code_hash     text not null,
  attempts      int  not null default 0,
  consumed_at   timestamptz,
  expires_at    timestamptz not null,
  created_at    timestamptz not null default now()
);

create index if not exists email_verification_codes_user_idx
  on public.email_verification_codes (user_id, created_at desc);

alter table public.email_verification_codes enable row level security;

-- No client policy at all: only SECURITY DEFINER functions and the
-- service role touch this table. A leaked code hash is worthless, but
-- there is no reason to expose it either.
revoke all on public.email_verification_codes from anon, authenticated;

-- pgcrypto provides digest(); Supabase ships it in the extensions schema.
create extension if not exists pgcrypto with schema extensions;

-- ---------- issue a code ----------
-- Called by the edge function, which owns delivery. Returns the plain
-- code so the function can put it in the email; it is never returned
-- to a browser because clients cannot execute this (see revoke below).

create or replace function public.start_email_verification(
  p_user_id uuid,
  p_email   text
) returns text language plpgsql security definer set search_path = public as $$
declare
  v_email  text := lower(trim(p_email));
  v_code   text;
  v_recent int;
begin
  if not public.is_acuk_domain(v_email) then
    raise exception 'Verification requires a UK academic email ending in .ac.uk.';
  end if;

  -- Someone else already proved they own this address.
  if exists (
    select 1 from public.profiles
     where lower(verification_email) = v_email
       and id <> p_user_id
       and is_verified
  ) then
    raise exception 'That address is already verified on another account.';
  end if;

  -- Throttle: 5 codes per user per hour.
  select count(*) into v_recent
    from public.email_verification_codes
   where user_id = p_user_id
     and created_at > now() - interval '1 hour';

  if v_recent >= 5 then
    raise exception 'Too many verification attempts. Please wait an hour and try again.';
  end if;

  v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');

  -- Supersede any code still outstanding for this user.
  update public.email_verification_codes
     set consumed_at = now()
   where user_id = p_user_id
     and consumed_at is null;

  insert into public.email_verification_codes (user_id, email, code_hash, expires_at)
  values (
    p_user_id,
    v_email,
    encode(extensions.digest(v_code || p_user_id::text, 'sha256'), 'hex'),
    now() + interval '15 minutes'
  );

  return v_code;
end;
$$;

-- ---------- redeem a code ----------

create or replace function public.confirm_email_verification(
  p_email text,
  p_code  text
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_uid    uuid := auth.uid();
  v_email  text := lower(trim(p_email));
  v_row    public.email_verification_codes;
  v_uni    text;
begin
  if v_uid is null then
    raise exception 'Please sign in first.';
  end if;

  select * into v_row
    from public.email_verification_codes
   where user_id = v_uid
     and email = v_email
     and consumed_at is null
   order by created_at desc
   limit 1;

  if v_row.id is null then
    raise exception 'No verification in progress for that address. Request a new code.';
  end if;

  if v_row.expires_at < now() then
    raise exception 'That code has expired. Request a new one.';
  end if;

  if v_row.attempts >= 5 then
    update public.email_verification_codes set consumed_at = now() where id = v_row.id;
    raise exception 'Too many incorrect attempts. Request a new code.';
  end if;

  if v_row.code_hash <> encode(extensions.digest(trim(p_code) || v_uid::text, 'sha256'), 'hex') then
    update public.email_verification_codes
       set attempts = attempts + 1
     where id = v_row.id;
    raise exception 'That code is not correct.';
  end if;

  -- Re-check the race: another account may have verified this address
  -- between the code being issued and redeemed.
  if exists (
    select 1 from public.profiles
     where lower(verification_email) = v_email
       and id <> v_uid
       and is_verified
  ) then
    raise exception 'That address is already verified on another account.';
  end if;

  update public.email_verification_codes set consumed_at = now() where id = v_row.id;

  v_uni := public.university_from_email(v_email);

  update public.profiles
     set is_verified        = true,
         verified_at        = now(),
         verification_email = v_email,
         university         = coalesce(v_uni, university),
         updated_at         = now()
   where id = v_uid;
end;
$$;

-- ---------- retire the unsafe entry point ----------
-- Kept as a stub rather than dropped so any client still shipping the
-- old build fails loudly instead of silently calling something absent.

create or replace function public.verify_profile_email(
  p_verification_email text
) returns void language plpgsql security definer set search_path = public as $$
begin
  raise exception 'This verification method has been withdrawn. Update the app and verify with the code emailed to your academic address.';
end;
$$;

-- ---------- execution rights ----------

revoke all on function public.start_email_verification(uuid, text)   from public, anon, authenticated;
revoke all on function public.confirm_email_verification(text, text) from public, anon;
grant execute on function public.confirm_email_verification(text, text) to authenticated;

-- ---------- revoke badges that were never actually proven ----------
-- A profile whose verification_email differs from its login email was
-- verified through the old no-proof path. The login-email cases are
-- already covered by auth.users.email_confirmed_at.

update public.profiles p
   set is_verified        = false,
       verified_at        = null,
       verification_email = null,
       updated_at         = now()
 where p.is_verified
   and p.verification_email is not null
   and lower(p.verification_email) <> lower(coalesce(p.email, ''))
   and not exists (
     select 1 from auth.users u
      where u.id = p.id
        and lower(u.email) = lower(p.verification_email)
        and u.email_confirmed_at is not null
   );
