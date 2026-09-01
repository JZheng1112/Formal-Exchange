-- ============================================================
-- Saving a listing or a buyer request.
--
-- The detail screens carried a single flag icon in the corner, which
-- people read as "bookmark" and pressed expecting to save the ticket --
-- there was no save feature at all, so the only affordance up there was
-- a report. Saving now exists, which lets report go back to meaning
-- report.
--
-- One table for both kinds so the pages stay symmetrical.
-- ============================================================

create table if not exists public.saved_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  item_type  text not null check (item_type in ('listing', 'buyer_post')),
  item_id    uuid not null,
  created_at timestamptz not null default now(),
  constraint saved_items_unique unique (user_id, item_type, item_id)
);

create index if not exists saved_items_user_idx on public.saved_items (user_id, created_at desc);

alter table public.saved_items enable row level security;

-- A save is private: only its owner can see, add or remove it.
drop policy if exists "Users read own saves" on public.saved_items;
create policy "Users read own saves"
on public.saved_items for select to authenticated
using (user_id = auth.uid());

drop policy if exists "Users add own saves" on public.saved_items;
create policy "Users add own saves"
on public.saved_items for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users remove own saves" on public.saved_items;
create policy "Users remove own saves"
on public.saved_items for delete to authenticated
using (user_id = auth.uid());

create or replace function public.toggle_saved_item(
  p_item_type text,
  p_item_id   uuid
) returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_existing uuid;
begin
  if v_uid is null then
    raise exception 'Please sign in first.';
  end if;
  if p_item_type not in ('listing', 'buyer_post') then
    raise exception 'Unknown item type.';
  end if;

  select id into v_existing
    from public.saved_items
   where user_id = v_uid and item_type = p_item_type and item_id = p_item_id;

  if v_existing is not null then
    delete from public.saved_items where id = v_existing;
    return false;
  end if;

  insert into public.saved_items (user_id, item_type, item_id)
  values (v_uid, p_item_type, p_item_id);
  return true;
end;
$$;

revoke all on function public.toggle_saved_item(text, uuid) from public, anon;
grant execute on function public.toggle_saved_item(text, uuid) to authenticated;
