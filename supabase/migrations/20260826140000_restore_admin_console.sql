create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles
  add column if not exists account_status text not null default 'active',
  add column if not exists suspension_reason text,
  add column if not exists suspended_at timestamptz;

alter table public.profiles drop constraint if exists profiles_account_status_check;
alter table public.profiles add constraint profiles_account_status_check
  check (account_status in ('active', 'suspended'));

update public.profiles
set role = 'admin', can_list_ticket = true, account_status = 'active',
    suspension_reason = null, suspended_at = null, updated_at = now()
where lower(email) = 'jiacheng.zheng@reuben.ox.ac.uk';

create or replace function public.apply_designated_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if lower(coalesce(new.email, '')) = 'jiacheng.zheng@reuben.ox.ac.uk' then
    new.role := 'admin';
    new.can_list_ticket := true;
    new.account_status := 'active';
    new.suspension_reason := null;
    new.suspended_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists apply_designated_admin_on_profile on public.profiles;
create trigger apply_designated_admin_on_profile
before insert or update of email, role, can_list_ticket, account_status on public.profiles
for each row execute function public.apply_designated_admin();

alter table public.ticket_listings
  add column if not exists moderation_note text,
  add column if not exists moderated_at timestamptz,
  add column if not exists moderated_by uuid references auth.users(id) on delete set null;

alter table public.buyer_posts
  add column if not exists moderation_note text,
  add column if not exists moderated_at timestamptz,
  add column if not exists moderated_by uuid references auth.users(id) on delete set null;

alter table public.listing_reports
  add column if not exists admin_note text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null;

alter table public.price_reports
  add column if not exists status text not null default 'new',
  add column if not exists admin_note text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null;

alter table public.college_policy_reports
  add column if not exists status text not null default 'new',
  add column if not exists admin_note text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null;

alter table public.feedbacks
  add column if not exists status text not null default 'new',
  add column if not exists admin_note text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null;

create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  admin_user_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;
create index if not exists admin_audit_log_created_idx
  on public.admin_audit_log (created_at desc);

create or replace function public.admin_dashboard_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'generated_at', now(),
    'counts', jsonb_build_object(
      'page_views', (select count(*) from public.page_views),
      'views_30d', (select count(*) from public.page_views where viewed_at >= now() - interval '30 days'),
      'listings', (select count(*) from public.ticket_listings),
      'active_listings', (select count(*) from public.ticket_listings where status = 'active'),
      'buyer_requests', (select count(*) from public.buyer_posts),
      'active_buyer_requests', (select count(*) from public.buyer_posts where status = 'active' and expires_at > now()),
      'profiles', (select count(*) from public.profiles),
      'suspended_profiles', (select count(*) from public.profiles where account_status = 'suspended'),
      'listing_reports', (select count(*) from public.listing_reports where coalesce(status, 'new') in ('new', 'reviewing')),
      'price_reports', (select count(*) from public.price_reports where coalesce(status, 'new') in ('new', 'reviewing')),
      'policy_reports', (select count(*) from public.college_policy_reports where coalesce(status, 'new') in ('new', 'reviewing')),
      'feedback', (select count(*) from public.feedbacks where coalesce(status, 'new') in ('new', 'reviewing')),
      'conversations', (select count(*) from public.conversations),
      'messages', (select count(*) from public.messages),
      'college_ratings', (select count(*) from public.college_ratings)
    ),
    'daily_views', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.day)
      from (
        select viewed_at::date as day, count(*) as views,
          count(distinct user_id) filter (where user_id is not null) as signed_in_users
        from public.page_views
        where viewed_at >= current_date - interval '29 days'
        group by viewed_at::date
      ) x
    ), '[]'::jsonb),
    'path_views', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.views desc)
      from (
        select path, count(*) as views, max(viewed_at) as last_viewed_at
        from public.page_views
        group by path
        order by count(*) desc
        limit 100
      ) x
    ), '[]'::jsonb),
    'profiles', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.created_at desc)
      from (
        select p.id, p.email, p.full_name, p.university, p.college_id, p.role,
          p.can_list_ticket, p.overpricing_student_flags, p.overpricing_guest_flags,
          p.account_status, p.suspension_reason, p.suspended_at, p.created_at, p.updated_at,
          c.name as college_name
        from public.profiles p
        left join public.colleges c on c.id = p.college_id
        order by p.created_at desc
        limit 500
      ) x
    ), '[]'::jsonb),
    'listings', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.created_at desc)
      from (
        select l.id, l.seller_user_id, l.seller_contact_email, l.listing_category,
          l.ticket_type, l.formal_type, l.formal_date, l.formal_time, l.status,
          l.student_seats, l.guest_seats, l.student_listing_price_gbp,
          l.guest_listing_price_gbp, l.origin_name, l.destination_name,
          l.asking_price_gbp, l.created_at, l.moderation_note, l.moderated_at,
          c.name as college_name, c.university as college_university
        from public.ticket_listings l
        left join public.colleges c on c.id = l.college_id
        order by l.created_at desc
        limit 500
      ) x
    ), '[]'::jsonb),
    'buyer_posts', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.created_at desc)
      from (
        select b.id, b.buyer_user_id, b.buyer_email, b.category, b.ticket_type,
          b.university, b.wanted_date, b.origin_name, b.destination_name,
          b.budget_gbp, b.quantity, b.notes, b.status, b.created_at, b.expires_at,
          b.moderation_note, b.moderated_at, c.name as college_name
        from public.buyer_posts b
        left join public.colleges c on c.id = b.college_id
        order by b.created_at desc
        limit 500
      ) x
    ), '[]'::jsonb),
    'listing_reports', coalesce((
      select jsonb_agg(to_jsonb(r) order by r.created_at desc)
      from (select * from public.listing_reports order by created_at desc limit 300) r
    ), '[]'::jsonb),
    'price_reports', coalesce((
      select jsonb_agg(to_jsonb(r) order by r.created_at desc)
      from (select * from public.price_reports order by created_at desc limit 300) r
    ), '[]'::jsonb),
    'policy_reports', coalesce((
      select jsonb_agg(to_jsonb(r) order by r.created_at desc)
      from (select * from public.college_policy_reports order by created_at desc limit 300) r
    ), '[]'::jsonb),
    'feedback', coalesce((
      select jsonb_agg(to_jsonb(f) order by f.created_at desc)
      from (select * from public.feedbacks order by created_at desc limit 300) f
    ), '[]'::jsonb),
    'conversations', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.updated_at desc)
      from (
        select c.id, c.subject, c.listing_id, c.buyer_email, c.seller_email,
          c.is_demo, c.created_at, c.updated_at, count(m.id) as message_count,
          count(m.id) filter (where m.read_at is null) as unread_count
        from public.conversations c
        left join public.messages m on m.conversation_id = c.id
        group by c.id
        order by c.updated_at desc
        limit 200
      ) x
    ), '[]'::jsonb),
    'ratings', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.created_at desc)
      from (
        select r.id, r.college_id, r.user_id, r.score, r.comment, r.created_at,
          c.name as college_name, c.university
        from public.college_ratings r
        join public.colleges c on c.id = r.college_id
        order by r.created_at desc
        limit 300
      ) x
    ), '[]'::jsonb),
    'rating_summary', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.average_score desc, x.rating_count desc)
      from (
        select c.id as college_id, c.name as college_name, c.university,
          round(avg(r.score)::numeric, 2) as average_score, count(r.id) as rating_count
        from public.colleges c
        left join public.college_ratings r on r.college_id = c.id
        group by c.id, c.name, c.university
        having count(r.id) > 0
      ) x
    ), '[]'::jsonb),
    'visit_summary', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.visit_count desc)
      from (
        select c.id as college_id, c.name as college_name, c.university,
          count(v.college_id) as visit_count
        from public.colleges c
        left join public.buyer_college_visits v on v.college_id = c.id
        group by c.id, c.name, c.university
        having count(v.college_id) > 0
      ) x
    ), '[]'::jsonb),
    'audit_log', coalesce((
      select jsonb_agg(to_jsonb(a) order by a.created_at desc)
      from (select * from public.admin_audit_log order by created_at desc limit 200) a
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_dashboard_snapshot() from public;
grant execute on function public.admin_dashboard_snapshot() to authenticated;

create or replace function public.admin_set_listing_status(
  p_listing_id uuid,
  p_status text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode = '42501'; end if;
  if p_status not in ('active', 'removed', 'sold') then raise exception 'Unsupported listing status'; end if;
  update public.ticket_listings
  set status = p_status, moderation_note = nullif(trim(p_note), ''),
      moderated_at = now(), moderated_by = auth.uid(), updated_at = now()
  where id = p_listing_id;
  if not found then raise exception 'Listing not found'; end if;
  insert into public.admin_audit_log(admin_user_id, action, entity_type, entity_id, details)
  values (auth.uid(), 'set_status', 'ticket_listing', p_listing_id::text,
    jsonb_build_object('status', p_status, 'note', p_note));
end;
$$;

create or replace function public.admin_set_buyer_post_status(
  p_post_id uuid,
  p_status text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode = '42501'; end if;
  if p_status not in ('active', 'withdrawn', 'removed') then raise exception 'Unsupported buyer-post status'; end if;
  update public.buyer_posts
  set status = p_status, moderation_note = nullif(trim(p_note), ''),
      moderated_at = now(), moderated_by = auth.uid()
  where id = p_post_id;
  if not found then raise exception 'Buyer request not found'; end if;
  insert into public.admin_audit_log(admin_user_id, action, entity_type, entity_id, details)
  values (auth.uid(), 'set_status', 'buyer_post', p_post_id::text,
    jsonb_build_object('status', p_status, 'note', p_note));
end;
$$;

create or replace function public.admin_review_item(
  p_table text,
  p_id uuid,
  p_status text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected integer;
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode = '42501'; end if;
  if p_table not in ('listing_reports', 'price_reports', 'college_policy_reports', 'feedbacks') then
    raise exception 'Unsupported review type';
  end if;
  if p_status not in ('new', 'reviewing', 'resolved', 'dismissed') then
    raise exception 'Unsupported review status';
  end if;
  execute format(
    'update public.%I set status = $1, admin_note = nullif(trim($2), ''''), reviewed_at = now(), reviewed_by = auth.uid() where id = $3',
    p_table
  ) using p_status, p_note, p_id;
  get diagnostics affected = row_count;
  if affected = 0 then raise exception 'Review item not found'; end if;
  insert into public.admin_audit_log(admin_user_id, action, entity_type, entity_id, details)
  values (auth.uid(), 'review', p_table, p_id::text,
    jsonb_build_object('status', p_status, 'note', p_note));
end;
$$;

create or replace function public.admin_set_profile_permissions(
  p_profile_id uuid,
  p_can_list_ticket boolean,
  p_account_status text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_role text;
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode = '42501'; end if;
  if p_account_status not in ('active', 'suspended') then raise exception 'Unsupported account status'; end if;
  select role into target_role from public.profiles where id = p_profile_id;
  if target_role is null then raise exception 'Profile not found'; end if;
  if target_role = 'admin' and p_account_status = 'suspended' then
    raise exception 'Administrator accounts cannot be suspended here';
  end if;
  update public.profiles
  set can_list_ticket = p_can_list_ticket,
      account_status = p_account_status,
      suspension_reason = case when p_account_status = 'suspended' then nullif(trim(p_reason), '') else null end,
      suspended_at = case when p_account_status = 'suspended' then now() else null end,
      updated_at = now()
  where id = p_profile_id;
  insert into public.admin_audit_log(admin_user_id, action, entity_type, entity_id, details)
  values (auth.uid(), 'set_permissions', 'profile', p_profile_id::text,
    jsonb_build_object('can_list_ticket', p_can_list_ticket, 'account_status', p_account_status, 'reason', p_reason));
end;
$$;

create or replace function public.admin_set_feedback_visibility(
  p_feedback_id uuid,
  p_is_public boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode = '42501'; end if;
  update public.feedbacks set is_public = p_is_public where id = p_feedback_id;
  if not found then raise exception 'Feedback not found'; end if;
  insert into public.admin_audit_log(admin_user_id, action, entity_type, entity_id, details)
  values (auth.uid(), 'set_visibility', 'feedback', p_feedback_id::text,
    jsonb_build_object('is_public', p_is_public));
end;
$$;

create or replace function public.admin_delete_college_rating(p_rating_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_rating jsonb;
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode = '42501'; end if;
  delete from public.college_ratings where id = p_rating_id returning to_jsonb(college_ratings) into deleted_rating;
  if deleted_rating is null then raise exception 'Rating not found'; end if;
  insert into public.admin_audit_log(admin_user_id, action, entity_type, entity_id, details)
  values (auth.uid(), 'delete', 'college_rating', p_rating_id::text, deleted_rating);
end;
$$;

revoke all on function public.admin_set_listing_status(uuid, text, text) from public;
revoke all on function public.admin_set_buyer_post_status(uuid, text, text) from public;
revoke all on function public.admin_review_item(text, uuid, text, text) from public;
revoke all on function public.admin_set_profile_permissions(uuid, boolean, text, text) from public;
revoke all on function public.admin_set_feedback_visibility(uuid, boolean) from public;
revoke all on function public.admin_delete_college_rating(uuid) from public;
grant execute on function public.admin_set_listing_status(uuid, text, text) to authenticated;
grant execute on function public.admin_set_buyer_post_status(uuid, text, text) to authenticated;
grant execute on function public.admin_review_item(text, uuid, text, text) to authenticated;
grant execute on function public.admin_set_profile_permissions(uuid, boolean, text, text) to authenticated;
grant execute on function public.admin_set_feedback_visibility(uuid, boolean) to authenticated;
grant execute on function public.admin_delete_college_rating(uuid) to authenticated;

create or replace function public.guard_marketplace_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  actor_email text;
  actor_status text;
  actor_can_list boolean;
  actor_domain text;
begin
  if public.is_admin() then return new; end if;
  actor_id := case
    when tg_table_name = 'ticket_listings' then nullif(to_jsonb(new)->>'seller_user_id', '')::uuid
    when tg_table_name = 'buyer_posts' then nullif(to_jsonb(new)->>'buyer_user_id', '')::uuid
    when tg_table_name = 'conversations' then nullif(to_jsonb(new)->>'buyer_user_id', '')::uuid
    when tg_table_name = 'messages' then nullif(to_jsonb(new)->>'sender_user_id', '')::uuid
    else auth.uid()
  end;
  if actor_id is null then return new; end if;
  select email, account_status, can_list_ticket
    into actor_email, actor_status, actor_can_list
    from public.profiles where id = actor_id;
  if coalesce(actor_status, 'active') <> 'active' then
    raise exception 'This account is suspended. Contact support for help.' using errcode = '42501';
  end if;
  if tg_table_name = 'ticket_listings' then
    if coalesce(to_jsonb(new)->>'listing_category', 'formal') = 'formal' then
      if not coalesce(actor_can_list, false) then
        raise exception 'Formal-listing access is restricted for this account.' using errcode = '42501';
      end if;
      actor_domain := lower(split_part(coalesce(actor_email, ''), '@', 2));
      if not (actor_domain = 'ox.ac.uk' or actor_domain like '%.ox.ac.uk' or actor_domain = 'cam.ac.uk' or actor_domain like '%.cam.ac.uk') then
        raise exception 'Only verified Oxford or Cambridge accounts may publish Formal tickets.' using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_ticket_listing_write on public.ticket_listings;
create trigger guard_ticket_listing_write before insert or update on public.ticket_listings
for each row execute function public.guard_marketplace_write();
drop trigger if exists guard_buyer_post_write on public.buyer_posts;
create trigger guard_buyer_post_write before insert or update on public.buyer_posts
for each row execute function public.guard_marketplace_write();
drop trigger if exists guard_conversation_write on public.conversations;
create trigger guard_conversation_write before insert on public.conversations
for each row execute function public.guard_marketplace_write();
drop trigger if exists guard_message_write on public.messages;
create trigger guard_message_write before insert on public.messages
for each row execute function public.guard_marketplace_write();
