-- Restore a full, multi-dimensional college review while preserving legacy
-- overall ratings. Existing rows remain valid and display as legacy reviews.
alter table public.college_ratings
  add column if not exists food_score integer,
  add column if not exists hall_score integer,
  add column if not exists atmosphere_score integer,
  add column if not exists hospitality_score integer,
  add column if not exists value_score integer,
  add column if not exists comment_language text not null default 'en',
  add column if not exists comment_en text,
  add column if not exists comment_zh text;

alter table public.college_ratings drop constraint if exists college_ratings_comment_language_check;
alter table public.college_ratings add constraint college_ratings_comment_language_check
  check (comment_language in ('en', 'zh'));

alter table public.college_ratings drop constraint if exists college_ratings_food_score_check;
alter table public.college_ratings add constraint college_ratings_food_score_check
  check (food_score is null or food_score between 1 and 5);
alter table public.college_ratings drop constraint if exists college_ratings_hall_score_check;
alter table public.college_ratings add constraint college_ratings_hall_score_check
  check (hall_score is null or hall_score between 1 and 5);
alter table public.college_ratings drop constraint if exists college_ratings_atmosphere_score_check;
alter table public.college_ratings add constraint college_ratings_atmosphere_score_check
  check (atmosphere_score is null or atmosphere_score between 1 and 5);
alter table public.college_ratings drop constraint if exists college_ratings_hospitality_score_check;
alter table public.college_ratings add constraint college_ratings_hospitality_score_check
  check (hospitality_score is null or hospitality_score between 1 and 5);
alter table public.college_ratings drop constraint if exists college_ratings_value_score_check;
alter table public.college_ratings add constraint college_ratings_value_score_check
  check (value_score is null or value_score between 1 and 5);

-- A member has one editable review per college. Legacy production data may
-- contain duplicates, so retain the newest row before enforcing uniqueness.
delete from public.college_ratings older
using public.college_ratings newer
where older.college_id = newer.college_id
  and older.user_id = newer.user_id
  and (
    coalesce(older.updated_at, older.created_at) < coalesce(newer.updated_at, newer.created_at)
    or (
      coalesce(older.updated_at, older.created_at) = coalesce(newer.updated_at, newer.created_at)
      and older.id::text < newer.id::text
    )
  );

create unique index if not exists college_ratings_college_user_unique
  on public.college_ratings (college_id, user_id);

create or replace function public.save_college_review(
  p_college_id uuid,
  p_food_score integer,
  p_hall_score integer,
  p_atmosphere_score integer,
  p_hospitality_score integer,
  p_value_score integer,
  p_comment text default null,
  p_comment_language text default 'en',
  p_comment_en text default null,
  p_comment_zh text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  overall_score integer;
begin
  if actor_id is null then
    raise exception 'Please log in to review a college' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.buyer_college_visits v
    where v.user_id = actor_id and v.college_id = p_college_id
  ) and not exists (
    select 1 from public.profiles p
    where p.id = actor_id and p.college_id = p_college_id
  ) then
    raise exception 'Add this college to your Visiting Record before reviewing it' using errcode = '42501';
  end if;
  if p_food_score not between 1 and 5
    or p_hall_score not between 1 and 5
    or p_atmosphere_score not between 1 and 5
    or p_hospitality_score not between 1 and 5
    or p_value_score not between 1 and 5 then
    raise exception 'Complete every rating from 1 to 5';
  end if;
  if char_length(coalesce(p_comment, '')) > 1200 then
    raise exception 'Comments must be 1,200 characters or fewer';
  end if;
  if p_comment_language not in ('en', 'zh') then raise exception 'Unsupported comment language'; end if;

  overall_score := round((p_food_score + p_hall_score + p_atmosphere_score + p_hospitality_score + p_value_score)::numeric / 5)::integer;

  insert into public.college_ratings (
    college_id, user_id, score, food_score, hall_score, atmosphere_score,
    hospitality_score, value_score, comment, comment_language, comment_en, comment_zh, updated_at
  ) values (
    p_college_id, actor_id, overall_score, p_food_score, p_hall_score,
    p_atmosphere_score, p_hospitality_score, p_value_score,
    nullif(trim(p_comment), ''), p_comment_language, nullif(trim(p_comment_en), ''), nullif(trim(p_comment_zh), ''), now()
  )
  on conflict (college_id, user_id) do update set
    score = excluded.score,
    food_score = excluded.food_score,
    hall_score = excluded.hall_score,
    atmosphere_score = excluded.atmosphere_score,
    hospitality_score = excluded.hospitality_score,
    value_score = excluded.value_score,
    comment = excluded.comment,
    comment_language = excluded.comment_language,
    comment_en = excluded.comment_en,
    comment_zh = excluded.comment_zh,
    updated_at = now();
end;
$$;

revoke all on function public.save_college_review(uuid, integer, integer, integer, integer, integer, text, text, text, text) from public;
grant execute on function public.save_college_review(uuid, integer, integer, integer, integer, integer, text, text, text, text) to authenticated;

drop policy if exists "ratings own delete" on public.college_ratings;
create policy "ratings own delete" on public.college_ratings for delete to authenticated
  using (user_id = auth.uid());

-- Permanent administrator deletion is separate from ordinary moderation
-- status changes. The deleted row is retained in the private audit log.
create or replace function public.admin_delete_marketplace_post(
  p_post_type text,
  p_post_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_post jsonb;
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  if p_post_type = 'ticket_listing' then
    select to_jsonb(l) into deleted_post
    from public.ticket_listings l where l.id = p_post_id;
    if deleted_post is null then raise exception 'Listing not found'; end if;

    -- Preserve existing conversations independently from the deleted post.
    update public.conversations set listing_id = null where listing_id = p_post_id;
    delete from public.ticket_listings where id = p_post_id;
  elsif p_post_type = 'buyer_post' then
    delete from public.buyer_posts b where b.id = p_post_id
      returning to_jsonb(b) into deleted_post;
    if deleted_post is null then raise exception 'Buyer request not found'; end if;
  else
    raise exception 'Unsupported post type';
  end if;

  insert into public.admin_audit_log(admin_user_id, action, entity_type, entity_id, details)
  values (auth.uid(), 'delete_permanently', p_post_type, p_post_id::text, deleted_post);
end;
$$;

revoke all on function public.admin_delete_marketplace_post(text, uuid) from public;
grant execute on function public.admin_delete_marketplace_post(text, uuid) to authenticated;
