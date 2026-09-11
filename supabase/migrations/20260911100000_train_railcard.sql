-- ============================================================
-- Railcard requirement on train tickets.
--
-- A ticket bought with a Railcard discount is only valid when the
-- traveller carries that same Railcard, and inspectors do check. A buyer
-- without one would be fined and the ticket voided, so the seller has to
-- say up front whether the ticket carries a discount and which card it
-- needs. Nullable: coach tickets and older listings leave it unset.
--
-- Values: 'none' (full-price ticket), or the card family that must be
-- shown on board — '16-25', '26-30', 'network', 'two-together',
-- 'senior', 'disabled', 'other'.
-- ============================================================

alter table public.ticket_listings
  add column if not exists railcard text;

alter table public.ticket_listings
  drop constraint if exists ticket_listings_railcard_check;

alter table public.ticket_listings
  add constraint ticket_listings_railcard_check
  check (railcard is null or railcard in (
    'none', '16-25', '26-30', 'network', 'two-together', 'senior', 'disabled', 'other'
  ));
