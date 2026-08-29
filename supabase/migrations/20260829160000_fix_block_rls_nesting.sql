-- ============================================================
-- Fix an RLS-inside-RLS trap in the block visibility policies.
--
-- 20260829150000 inlined `exists (select 1 from public.blocked_users ...)`
-- into the conversations and messages policies. That subquery is itself
-- subject to blocked_users RLS, whose SELECT policy only exposes rows
-- where blocker_id = auth.uid(). A blocked user therefore could never
-- see the row naming them, the `not exists` was always true, and the
-- thread stayed visible -- the exact case the policy existed to cover.
--
-- The check has to run with RLS bypassed, so it moves into a
-- SECURITY DEFINER function.
-- ============================================================

create or replace function public.has_blocked(p_blocker uuid, p_blocked uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.blocked_users
     where blocker_id = p_blocker and blocked_id = p_blocked
  );
$$;

grant execute on function public.has_blocked(uuid, uuid) to authenticated;

drop policy if exists "Users read own conversations" on public.conversations;
create policy "Users read own conversations"
on public.conversations for select to authenticated
using (
  (buyer_user_id = auth.uid() or seller_user_id = auth.uid())
  and not public.has_blocked(
        case when buyer_user_id = auth.uid() then seller_user_id else buyer_user_id end,
        auth.uid()
      )
);

drop policy if exists "Users read own messages" on public.messages;
create policy "Users read own messages"
on public.messages for select to authenticated
using (
  exists (
    select 1 from public.conversations c
     where c.id = conversation_id
       and (c.buyer_user_id = auth.uid() or c.seller_user_id = auth.uid())
       and not public.has_blocked(
             case when c.buyer_user_id = auth.uid() then c.seller_user_id else c.buyer_user_id end,
             auth.uid()
           )
  )
);
