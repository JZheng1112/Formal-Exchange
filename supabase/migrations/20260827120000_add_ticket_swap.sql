alter table public.ticket_listings
  add column if not exists open_to_swap boolean not null default false;

create index if not exists ticket_listings_open_to_swap_active_idx
  on public.ticket_listings (open_to_swap, formal_date, formal_time)
  where status = 'active';

comment on column public.ticket_listings.open_to_swap is
  'Seller is open to discussing a direct ticket-for-ticket exchange. Any price difference is arranged privately.';
