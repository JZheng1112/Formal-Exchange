create or replace function public.admin_set_profile_role(
  p_profile_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_email text;
  target_role text;
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if p_role not in ('user', 'admin') then
    raise exception 'Unsupported role';
  end if;
  select lower(email), role into target_email, target_role
  from public.profiles where id = p_profile_id;
  if target_role is null then raise exception 'Profile not found'; end if;
  if p_profile_id = auth.uid() and p_role <> 'admin' then
    raise exception 'You cannot remove your own administrator access';
  end if;
  if target_email = 'jiacheng.zheng@reuben.ox.ac.uk' and p_role <> 'admin' then
    raise exception 'The designated administrator cannot be demoted';
  end if;
  update public.profiles
  set role = p_role,
      can_list_ticket = case when p_role = 'admin' then true else can_list_ticket end,
      account_status = case when p_role = 'admin' then 'active' else account_status end,
      suspension_reason = case when p_role = 'admin' then null else suspension_reason end,
      suspended_at = case when p_role = 'admin' then null else suspended_at end,
      updated_at = now()
  where id = p_profile_id;
  insert into public.admin_audit_log(admin_user_id, action, entity_type, entity_id, details)
  values (auth.uid(), 'set_role', 'profile', p_profile_id::text,
    jsonb_build_object('previous_role', target_role, 'new_role', p_role, 'email', target_email));
end;
$$;

revoke all on function public.admin_set_profile_role(uuid, text) from public;
grant execute on function public.admin_set_profile_role(uuid, text) to authenticated;
