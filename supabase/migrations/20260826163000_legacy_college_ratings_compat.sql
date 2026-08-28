-- The production ratings table predates the current app and used `rating`
-- instead of `score`. Add the current columns without removing legacy data.
alter table public.college_ratings
  add column if not exists score integer,
  add column if not exists comment text,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'college_ratings' and column_name = 'rating'
  ) then
    execute 'update public.college_ratings set score = greatest(1, least(5, round(rating::numeric)::integer)) where score is null and rating is not null';
  elsif exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'college_ratings' and column_name = 'stars'
  ) then
    execute 'update public.college_ratings set score = greatest(1, least(5, round(stars::numeric)::integer)) where score is null and stars is not null';
  end if;
end;
$$;

alter table public.college_ratings drop constraint if exists college_ratings_score_check;
alter table public.college_ratings add constraint college_ratings_score_check
  check (score is null or score between 1 and 5);

-- Validate the complete admin snapshot during migration using the designated
-- administrator identity. This makes any further legacy-column mismatch fail
-- the migration immediately instead of producing another empty dashboard.
do $$
declare
  designated_admin_id uuid;
  snapshot jsonb;
begin
  select id into designated_admin_id
  from public.profiles
  where lower(email) = 'jiacheng.zheng@reuben.ox.ac.uk'
  limit 1;

  if designated_admin_id is not null then
    perform set_config('request.jwt.claim.sub', designated_admin_id::text, true);
    perform set_config('request.jwt.claims', jsonb_build_object('sub', designated_admin_id, 'role', 'authenticated')::text, true);
    snapshot := public.admin_dashboard_snapshot();
    if snapshot is null then raise exception 'Admin snapshot validation returned null'; end if;
  end if;
end;
$$;
