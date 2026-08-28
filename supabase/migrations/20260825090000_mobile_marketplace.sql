alter table public.ticket_listings
  add column if not exists allow_outside_college boolean not null default false,
  add column if not exists allow_outside_oxbridge boolean not null default false,
  add column if not exists preferred_contact_method text not null default 'Email';

create table if not exists public.buyer_posts (
  id uuid primary key default gen_random_uuid(),
  buyer_user_id uuid not null references auth.users(id) on delete cascade,
  buyer_email text not null,
  category text not null check (category in ('formal','coach_train','event')),
  ticket_type text not null,
  university text,
  college_id uuid references public.colleges(id),
  wanted_date date,
  origin_name text,
  destination_name text,
  budget_gbp numeric,
  quantity integer not null default 1 check (quantity > 0),
  notes text,
  preferred_contact_method text not null default 'Email',
  contact_value text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);
alter table public.buyer_posts enable row level security;
drop policy if exists "buyer posts public read" on public.buyer_posts;
drop policy if exists "buyer posts authenticated read" on public.buyer_posts;
create policy "buyer posts authenticated read" on public.buyer_posts for select to authenticated using (status='active' and expires_at > now());
drop policy if exists "buyer posts own insert" on public.buyer_posts;
create policy "buyer posts own insert" on public.buyer_posts for insert to authenticated with check (buyer_user_id=auth.uid());
drop policy if exists "buyer posts own update" on public.buyer_posts;
create policy "buyer posts own update" on public.buyer_posts for update to authenticated using (buyer_user_id=auth.uid());

create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  path text not null,
  user_id uuid references auth.users(id) on delete set null,
  viewed_at timestamptz not null default now()
);
alter table public.page_views enable row level security;
drop policy if exists "anyone records view" on public.page_views;
create policy "anyone records view" on public.page_views for insert with check (true);
