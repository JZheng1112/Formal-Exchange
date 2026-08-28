alter table public.ticket_listings
  add column if not exists listing_category text not null default 'formal',
  add column if not exists ticket_type text,
  add column if not exists campus text,
  add column if not exists origin_name text,
  add column if not exists destination_name text,
  add column if not exists arrival_time time,
  add column if not exists duration_minutes integer,
  add column if not exists operator_name text,
  add column if not exists service_number text,
  add column if not exists venue_name text,
  add column if not exists ticket_quantity integer,
  add column if not exists face_value_gbp numeric,
  add column if not exists asking_price_gbp numeric,
  add column if not exists transfer_deadline timestamptz;

alter table public.ticket_listings drop constraint if exists ticket_listings_listing_category_check;
alter table public.ticket_listings add constraint ticket_listings_listing_category_check check (listing_category in ('formal', 'coach_train', 'event'));
alter table public.ticket_listings drop constraint if exists ticket_listings_campus_check;
alter table public.ticket_listings add constraint ticket_listings_campus_check check (campus is null or campus in ('Oxford', 'Cambridge'));
alter table public.ticket_listings drop constraint if exists ticket_listings_duration_minutes_check;
alter table public.ticket_listings add constraint ticket_listings_duration_minutes_check check (duration_minutes is null or duration_minutes > 0);
alter table public.ticket_listings drop constraint if exists ticket_listings_ticket_quantity_check;
alter table public.ticket_listings add constraint ticket_listings_ticket_quantity_check check (ticket_quantity is null or ticket_quantity > 0);

update public.ticket_listings l set campus = c.university from public.colleges c where l.college_id = c.id and l.campus is null;
create index if not exists ticket_listings_category_campus_status_idx on public.ticket_listings (listing_category, campus, status);
