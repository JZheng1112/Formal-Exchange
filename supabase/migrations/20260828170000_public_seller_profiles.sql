-- RPC to fetch public seller profile info (bypasses RLS)
create or replace function public.get_seller_profiles(p_user_ids uuid[])
returns table (
  id uuid,
  full_name text,
  is_verified boolean,
  avatar_url text,
  university text
)
language sql
stable
security definer
as $$
  select p.id, p.full_name, p.is_verified, p.avatar_url, p.university
  from public.profiles p
  where p.id = any(p_user_ids)
    and p.account_status = 'active';
$$;

-- Single-user convenience wrapper
create or replace function public.get_seller_profile(p_user_id uuid)
returns table (
  id uuid,
  full_name text,
  is_verified boolean,
  avatar_url text,
  university text
)
language sql
stable
security definer
as $$
  select p.id, p.full_name, p.is_verified, p.avatar_url, p.university
  from public.profiles p
  where p.id = p_user_id
    and p.account_status = 'active';
$$;
