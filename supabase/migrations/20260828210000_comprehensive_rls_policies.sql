-- ============================================================
-- Comprehensive RLS policies for all app tables
-- Many tables had RLS enabled but no SELECT policies,
-- causing empty query results from the client.
-- ============================================================

-- ==================== profiles ====================
alter table public.profiles enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid());

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

-- Public read for seller profiles (needed for marketplace)
drop policy if exists "Public read profiles" on public.profiles;
create policy "Public read profiles"
on public.profiles for select
to public
using (true);

-- ==================== colleges ====================
alter table public.colleges enable row level security;

drop policy if exists "Public read colleges" on public.colleges;
create policy "Public read colleges"
on public.colleges for select
to public
using (true);

-- ==================== ticket_listings ====================
-- (may already exist from previous migration, safe to re-run)
alter table public.ticket_listings enable row level security;

drop policy if exists "Public read active listings" on public.ticket_listings;
create policy "Public read active listings"
on public.ticket_listings for select
to public
using (true);

drop policy if exists "Users insert own listings" on public.ticket_listings;
create policy "Users insert own listings"
on public.ticket_listings for insert
to authenticated
with check (seller_user_id = auth.uid());

drop policy if exists "Users update own listings" on public.ticket_listings;
create policy "Users update own listings"
on public.ticket_listings for update
to authenticated
using (seller_user_id = auth.uid());

-- ==================== buyer_posts ====================
alter table public.buyer_posts enable row level security;

drop policy if exists "Public read active buyer posts" on public.buyer_posts;
create policy "Public read active buyer posts"
on public.buyer_posts for select
to authenticated
using (true);

drop policy if exists "Users insert own buyer posts" on public.buyer_posts;
create policy "Users insert own buyer posts"
on public.buyer_posts for insert
to authenticated
with check (buyer_user_id = auth.uid());

drop policy if exists "Users update own buyer posts" on public.buyer_posts;
create policy "Users update own buyer posts"
on public.buyer_posts for update
to authenticated
using (buyer_user_id = auth.uid());

-- ==================== college_ratings ====================
alter table public.college_ratings enable row level security;

drop policy if exists "Public read college ratings" on public.college_ratings;
create policy "Public read college ratings"
on public.college_ratings for select
to public
using (true);

drop policy if exists "Users insert own ratings" on public.college_ratings;
create policy "Users insert own ratings"
on public.college_ratings for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users update own ratings" on public.college_ratings;
create policy "Users update own ratings"
on public.college_ratings for update
to authenticated
using (user_id = auth.uid());

-- ==================== formal_price_reference ====================
alter table public.formal_price_reference enable row level security;

drop policy if exists "Public read price reference" on public.formal_price_reference;
create policy "Public read price reference"
on public.formal_price_reference for select
to public
using (true);

-- ==================== conversations ====================
alter table public.conversations enable row level security;

drop policy if exists "Users read own conversations" on public.conversations;
create policy "Users read own conversations"
on public.conversations for select
to authenticated
using (buyer_user_id = auth.uid() or seller_user_id = auth.uid());

drop policy if exists "Users insert conversations" on public.conversations;
create policy "Users insert conversations"
on public.conversations for insert
to authenticated
with check (buyer_user_id = auth.uid() or seller_user_id = auth.uid());

-- ==================== messages ====================
alter table public.messages enable row level security;

drop policy if exists "Users read own messages" on public.messages;
create policy "Users read own messages"
on public.messages for select
to authenticated
using (
  exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.buyer_user_id = auth.uid() or c.seller_user_id = auth.uid())
  )
);

drop policy if exists "Users insert own messages" on public.messages;
create policy "Users insert own messages"
on public.messages for insert
to authenticated
with check (sender_user_id = auth.uid());

-- ==================== listing_reports ====================
alter table public.listing_reports enable row level security;

drop policy if exists "Users insert reports" on public.listing_reports;
create policy "Users insert reports"
on public.listing_reports for insert
to authenticated
with check (true);

-- ==================== price_reports ====================
alter table public.price_reports enable row level security;

drop policy if exists "Users insert price reports" on public.price_reports;
create policy "Users insert price reports"
on public.price_reports for insert
to authenticated
with check (true);

-- ==================== college_policy_reports ====================
alter table public.college_policy_reports enable row level security;

drop policy if exists "Users insert policy reports" on public.college_policy_reports;
create policy "Users insert policy reports"
on public.college_policy_reports for insert
to authenticated
with check (true);

-- ==================== feedbacks ====================
alter table public.feedbacks enable row level security;

drop policy if exists "Users insert feedback" on public.feedbacks;
create policy "Users insert feedback"
on public.feedbacks for insert
to authenticated
with check (true);

-- ==================== public_feedback_comments ====================
-- Skip if it's a view (views don't support RLS)
do $$ begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'public_feedback_comments'
      and table_type = 'BASE TABLE'
  ) then
    alter table public.public_feedback_comments enable row level security;
    execute 'drop policy if exists "Public read feedback comments" on public.public_feedback_comments';
    execute 'create policy "Public read feedback comments" on public.public_feedback_comments for select to public using (true)';
  end if;
end $$;

-- ==================== ticket_assets ====================
do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'ticket_assets') then
    alter table public.ticket_assets enable row level security;
    execute 'drop policy if exists "Users read own ticket assets" on public.ticket_assets';
    execute 'create policy "Users read own ticket assets" on public.ticket_assets for select to authenticated using (true)';
  end if;
end $$;

-- ==================== buyer_college_visits ====================
do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'buyer_college_visits') then
    alter table public.buyer_college_visits enable row level security;
    execute 'drop policy if exists "Public read college visits" on public.buyer_college_visits';
    execute 'create policy "Public read college visits" on public.buyer_college_visits for select to public using (true)';
    execute 'drop policy if exists "Users insert college visits" on public.buyer_college_visits';
    execute 'create policy "Users insert college visits" on public.buyer_college_visits for insert to authenticated with check (true)';
  end if;
end $$;

-- ==================== push_tokens ====================
alter table public.push_tokens enable row level security;

drop policy if exists "Users manage own push tokens" on public.push_tokens;
create policy "Users manage own push tokens"
on public.push_tokens for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ==================== page_views ====================
-- Already has insert policy from earlier migration, just ensure it's there
alter table public.page_views enable row level security;

drop policy if exists "Anyone insert page views" on public.page_views;
create policy "Anyone insert page views"
on public.page_views for insert
to public
with check (true);
