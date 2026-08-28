begin;

alter table public.ticket_listings
  drop constraint if exists ticket_listings_underoccupancy_policy_check;

alter table public.ticket_listings
  add constraint ticket_listings_underoccupancy_policy_check
  check (
    underoccupancy_policy in (
      'face_value',
      'tiered',
      'not_applicable',
      'up_to_40_percent',
      'fixed_price'
    )
  );

comment on column public.ticket_listings.underoccupancy_policy is
  'For indivisible Formal groups: face_value or tiered. The price validator sets not_applicable when places may be sold separately. Legacy policy values remain readable.';

notify pgrst, 'reload schema';

commit;
