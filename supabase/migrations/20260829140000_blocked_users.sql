-- ============================================================
-- Blocking, for App Store guideline 1.2.
--
-- An app carrying user-generated content and direct messaging must let
-- a person stop an abusive user from reaching them. Reporting and
-- moderation already exist; blocking did not.
--
-- Blocking is one-directional and private: the blocked party is never
-- told. Enforcement is in the database, not the client, so an older
-- build cannot route around it.
-- ============================================================

create table if not exists public.blocked_users (
  id           uuid primary key default gen_random_uuid(),
  blocker_id   uuid not null references auth.users(id) on delete cascade,
  blocked_id   uuid not null references auth.users(id) on delete cascade,
  reason       text,
  created_at   timestamptz not null default now(),
  constraint blocked_users_unique unique (blocker_id, blocked_id),
  constraint blocked_users_not_self check (blocker_id <> blocked_id)
);

create index if not exists blocked_users_blocker_idx on public.blocked_users (blocker_id);
create index if not exists blocked_users_blocked_idx on public.blocked_users (blocked_id);

alter table public.blocked_users enable row level security;

-- You can see, create and remove only your own blocks. Nobody can read
-- the rows that name them, so a blocked user cannot discover the block.
drop policy if exists "Users read own blocks" on public.blocked_users;
create policy "Users read own blocks"
on public.blocked_users for select to authenticated
using (blocker_id = auth.uid());

drop policy if exists "Users create own blocks" on public.blocked_users;
create policy "Users create own blocks"
on public.blocked_users for insert to authenticated
with check (blocker_id = auth.uid());

drop policy if exists "Users remove own blocks" on public.blocked_users;
create policy "Users remove own blocks"
on public.blocked_users for delete to authenticated
using (blocker_id = auth.uid());

-- ---------- shared predicate ----------
-- True when either party has blocked the other. Blocking is one
-- directional as an action but mutual in effect: neither side should
-- keep talking once one of them has walked away.

create or replace function public.is_blocked_pair(p_a uuid, p_b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.blocked_users
     where (blocker_id = p_a and blocked_id = p_b)
        or (blocker_id = p_b and blocked_id = p_a)
  );
$$;

grant execute on function public.is_blocked_pair(uuid, uuid) to authenticated;

-- ---------- stop blocked messages at the database ----------

create or replace function public.guard_message_block()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_other uuid;
begin
  select case
           when c.buyer_user_id = new.sender_user_id then c.seller_user_id
           else c.buyer_user_id
         end
    into v_other
    from public.conversations c
   where c.id = new.conversation_id;

  if v_other is not null and public.is_blocked_pair(new.sender_user_id, v_other) then
    raise exception 'This conversation is closed because one of you blocked the other.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_message_block on public.messages;
create trigger trg_guard_message_block
  before insert on public.messages
  for each row execute function public.guard_message_block();

-- ---------- hide blocked people's conversations and listings ----------
-- Replaces the blanket participant policies so a blocked pair simply
-- stops seeing each other rather than seeing a dead thread.

drop policy if exists "Users read own conversations" on public.conversations;
create policy "Users read own conversations"
on public.conversations for select to authenticated
using (
  (buyer_user_id = auth.uid() or seller_user_id = auth.uid())
  and not public.is_blocked_pair(
        auth.uid(),
        case when buyer_user_id = auth.uid() then seller_user_id else buyer_user_id end
      )
);

drop policy if exists "Public read active listings" on public.ticket_listings;
create policy "Public read active listings"
on public.ticket_listings for select to public
using (
  auth.uid() is null
  or seller_user_id is null
  or not public.is_blocked_pair(auth.uid(), seller_user_id)
);

drop policy if exists "Public read active buyer posts" on public.buyer_posts;
create policy "Public read active buyer posts"
on public.buyer_posts for select to authenticated
using (
  buyer_user_id is null
  or not public.is_blocked_pair(auth.uid(), buyer_user_id)
);

-- ---------- convenience RPCs ----------

create or replace function public.block_user(p_blocked_id uuid, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'Please sign in first.';
  end if;
  if p_blocked_id = auth.uid() then
    raise exception 'You cannot block yourself.';
  end if;
  if not exists (select 1 from auth.users where id = p_blocked_id) then
    raise exception 'That user no longer exists.';
  end if;

  insert into public.blocked_users (blocker_id, blocked_id, reason)
  values (auth.uid(), p_blocked_id, nullif(trim(coalesce(p_reason, '')), ''))
  on conflict (blocker_id, blocked_id) do nothing;
end;
$$;

create or replace function public.unblock_user(p_blocked_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'Please sign in first.';
  end if;
  delete from public.blocked_users
   where blocker_id = auth.uid() and blocked_id = p_blocked_id;
end;
$$;

revoke all on function public.block_user(uuid, text) from public, anon;
revoke all on function public.unblock_user(uuid)     from public, anon;
grant execute on function public.block_user(uuid, text) to authenticated;
grant execute on function public.unblock_user(uuid)     to authenticated;
