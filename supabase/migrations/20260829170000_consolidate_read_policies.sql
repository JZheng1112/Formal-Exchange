-- ============================================================
-- Collapse duplicate SELECT policies so the block filter actually bites.
--
-- Permissive policies are OR'd. Today's migrations added block-aware
-- policies alongside pre-existing ones that grant the same rows without
-- any block check, so the older policy kept letting the row through and
-- blocking never hid anything. Tests 3 and 4 of the block suite failed
-- for this reason, not because the new predicates were wrong.
--
-- This also retires two policies added earlier today in
-- 20260828210000, which used `using (true)` on ticket_listings and an
-- unconstrained status on buyer_posts. Combined by OR, they exposed
-- draft, sold and expired rows to anyone. Sellers keep full sight of
-- their own rows through the dedicated owner policies.
--
-- One SELECT policy per audience per table from here.
-- ============================================================

-- ==================== conversations ====================
-- The legacy policy also matched a seller who has not registered yet, by
-- email. That branch is real and is preserved.

drop policy if exists "Users read own conversations"    on public.conversations;
drop policy if exists "participants read conversations" on public.conversations;

create policy "Participants read conversations"
on public.conversations for select to authenticated
using (
  (
    buyer_user_id = auth.uid()
    or seller_user_id = auth.uid()
    or lower(seller_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  and not public.has_blocked(
        case when buyer_user_id = auth.uid() then seller_user_id else buyer_user_id end,
        auth.uid()
      )
);

-- ==================== messages ====================

drop policy if exists "Users read own messages"    on public.messages;
drop policy if exists "participants read messages" on public.messages;

create policy "Participants read messages"
on public.messages for select to authenticated
using (
  exists (
    select 1 from public.conversations c
     where c.id = conversation_id
       and (
         c.buyer_user_id = auth.uid()
         or c.seller_user_id = auth.uid()
         or lower(c.seller_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
       )
       and not public.has_blocked(
             case when c.buyer_user_id = auth.uid() then c.seller_user_id else c.buyer_user_id end,
             auth.uid()
           )
  )
);

-- ==================== ticket_listings ====================
-- Browsing is public, so this policy stays open to anon. Sellers and
-- admins read their own rows through the policies left in place.

drop policy if exists "Public read active listings"        on public.ticket_listings;
drop policy if exists "public read active ticket listings" on public.ticket_listings;

create policy "Read active listings"
on public.ticket_listings for select to anon, authenticated
using (
  status = 'active'
  and (
    auth.uid() is null
    or seller_user_id is null
    or not public.is_blocked_pair(auth.uid(), seller_user_id)
  )
);

-- ==================== buyer_posts ====================

drop policy if exists "Public read active buyer posts"  on public.buyer_posts;
drop policy if exists "buyer posts authenticated read"  on public.buyer_posts;

create policy "Read active buyer posts"
on public.buyer_posts for select to authenticated
using (
  (
    (status = 'active' and expires_at > now())
    or buyer_user_id = auth.uid()
  )
  and (
    buyer_user_id is null
    or not public.is_blocked_pair(auth.uid(), buyer_user_id)
  )
);

-- ==================== duplicate write policies ====================
-- Same rule expressed twice; keep one of each so the intent is readable.

drop policy if exists "Users insert own buyer posts" on public.buyer_posts;
drop policy if exists "Users update own buyer posts" on public.buyer_posts;
