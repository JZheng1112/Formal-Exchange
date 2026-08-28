create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.ticket_listings(id) on delete set null,
  subject text not null,
  buyer_user_id uuid not null references auth.users(id) on delete cascade,
  buyer_email text not null,
  seller_user_id uuid references auth.users(id) on delete set null,
  seller_email text not null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists conversations_listing_buyer_key
  on public.conversations(listing_id, buyer_user_id)
  where listing_id is not null;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  sender_email text not null,
  body text not null check (char_length(body) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.push_tokens (
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, token)
);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.push_tokens enable row level security;

create policy "participants read conversations" on public.conversations for select
  using (buyer_user_id = auth.uid() or seller_user_id = auth.uid() or lower(seller_email) = lower(coalesce(auth.jwt()->>'email','')));
create policy "buyers create conversations" on public.conversations for insert
  with check (buyer_user_id = auth.uid() and lower(buyer_email) = lower(coalesce(auth.jwt()->>'email','')));
create policy "participants update conversations" on public.conversations for update
  using (buyer_user_id = auth.uid() or seller_user_id = auth.uid() or lower(seller_email) = lower(coalesce(auth.jwt()->>'email','')));

create policy "participants read messages" on public.messages for select
  using (exists (select 1 from public.conversations c where c.id = conversation_id and (c.buyer_user_id = auth.uid() or c.seller_user_id = auth.uid() or lower(c.seller_email) = lower(coalesce(auth.jwt()->>'email','')))));
create policy "participants send messages" on public.messages for insert
  with check (sender_user_id = auth.uid() and exists (select 1 from public.conversations c where c.id = conversation_id and (c.buyer_user_id = auth.uid() or c.seller_user_id = auth.uid() or lower(c.seller_email) = lower(coalesce(auth.jwt()->>'email','')))));
create policy "participants mark messages read" on public.messages for update
  using (exists (select 1 from public.conversations c where c.id = conversation_id and (c.buyer_user_id = auth.uid() or c.seller_user_id = auth.uid() or lower(c.seller_email) = lower(coalesce(auth.jwt()->>'email','')))));

create policy "users manage own push tokens" on public.push_tokens for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists messages_conversation_created_idx on public.messages(conversation_id, created_at);
create index if not exists conversations_updated_idx on public.conversations(updated_at desc);
