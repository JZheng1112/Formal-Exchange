-- ============================================================
-- Admin announcements.
--
-- A record of every broadcast, so the console can show what was sent,
-- to whom, and how many devices actually received it. The sending
-- itself happens in the send-announcement edge function, which is the
-- only thing allowed to write here.
-- ============================================================

create table if not exists public.announcements (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  body            text not null,
  -- 'all' reaches every registered account, 'verified' only confirmed
  -- academic ones, or a single university by name.
  audience        text not null default 'all',
  sent_by         uuid references auth.users(id) on delete set null,
  recipients      int  not null default 0,  -- accounts matched
  devices         int  not null default 0,  -- push tokens actually sent to
  created_at      timestamptz not null default now(),
  constraint announcements_audience_valid
    check (audience in ('all', 'verified', 'Oxford', 'Cambridge', 'Durham')),
  constraint announcements_title_len check (char_length(title) between 1 and 80),
  constraint announcements_body_len  check (char_length(body) between 1 and 400)
);

create index if not exists announcements_created_idx on public.announcements (created_at desc);

alter table public.announcements enable row level security;

-- Readable by signed-in members so the app can show an inbox of past
-- announcements; only the service role writes.
drop policy if exists "Members read announcements" on public.announcements;
create policy "Members read announcements"
on public.announcements for select to authenticated
using (true);

revoke insert, update, delete on public.announcements from anon, authenticated;

-- ---------- who an announcement reaches ----------
-- SECURITY DEFINER because the edge function needs the whole audience,
-- while profiles RLS deliberately limits what one member can read.

create or replace function public.announcement_audience(p_audience text)
returns table (user_id uuid) language sql stable security definer set search_path = public as $$
  select p.id
    from public.profiles p
   where p.account_status is distinct from 'suspended'
     and (
       p_audience = 'all'
       or (p_audience = 'verified' and p.is_verified)
       or p.university::text = p_audience
     );
$$;

revoke all on function public.announcement_audience(text) from public, anon, authenticated;
