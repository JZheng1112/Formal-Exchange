-- ============================================================
-- Refine what a block hides.
--
-- The first cut hid the conversation from both sides, which takes the
-- blocker's own message history away from them -- the record they may
-- need precisely because the other person behaved badly.
--
-- Messaging stays mutually closed (the trigger is unchanged). What
-- changes is visibility:
--   blocker  keeps the thread, read-only, and can unblock
--   blocked  no longer sees the thread at all
-- Listings stay mutually hidden: someone who blocked a user has said
-- they do not want that person's content either.
-- ============================================================

drop policy if exists "Users read own conversations" on public.conversations;
create policy "Users read own conversations"
on public.conversations for select to authenticated
using (
  (buyer_user_id = auth.uid() or seller_user_id = auth.uid())
  and not exists (
    select 1 from public.blocked_users b
     where b.blocked_id = auth.uid()
       and b.blocker_id = case
             when buyer_user_id = auth.uid() then seller_user_id
             else buyer_user_id
           end
  )
);

-- Messages follow their conversation, so a hidden thread hides its
-- contents too rather than leaving readable orphans.
drop policy if exists "Users read own messages" on public.messages;
create policy "Users read own messages"
on public.messages for select to authenticated
using (
  exists (
    select 1 from public.conversations c
     where c.id = conversation_id
       and (c.buyer_user_id = auth.uid() or c.seller_user_id = auth.uid())
       and not exists (
         select 1 from public.blocked_users b
          where b.blocked_id = auth.uid()
            and b.blocker_id = case
                  when c.buyer_user_id = auth.uid() then c.seller_user_id
                  else c.buyer_user_id
                end
       )
  )
);
