-- Ensure RLS is enabled and add proper policies for ticket_listings
alter table public.ticket_listings enable row level security;

-- Anyone (including anonymous) can read active listings
drop policy if exists "Public read active listings" on public.ticket_listings;
create policy "Public read active listings"
on public.ticket_listings for select
to public
using (true);

-- Authenticated users can insert their own listings
drop policy if exists "Users insert own listings" on public.ticket_listings;
create policy "Users insert own listings"
on public.ticket_listings for insert
to authenticated
with check (seller_user_id = auth.uid());

-- Authenticated users can update their own listings
drop policy if exists "Users update own listings" on public.ticket_listings;
create policy "Users update own listings"
on public.ticket_listings for update
to authenticated
using (seller_user_id = auth.uid());
