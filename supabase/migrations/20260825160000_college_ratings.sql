create table if not exists public.college_ratings (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null check (score between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(college_id,user_id)
);
alter table public.college_ratings enable row level security;
drop policy if exists "ratings public read" on public.college_ratings;
create policy "ratings public read" on public.college_ratings for select using (true);
drop policy if exists "ratings own insert" on public.college_ratings;
create policy "ratings own insert" on public.college_ratings for insert to authenticated with check(user_id=auth.uid());
drop policy if exists "ratings own update" on public.college_ratings;
create policy "ratings own update" on public.college_ratings for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
