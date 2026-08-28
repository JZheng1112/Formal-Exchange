begin;

create or replace function public.validate_listing_prices()
returns trigger
language plpgsql
as $$
declare
  tier record;
  actual_guests integer;
  missing_guests integer;
  tier_price numeric;
  maximum numeric;
begin
  -- Coach/train, event and ride-share posts do not use college Formal
  -- face-value or guest under-occupancy rules. They may also be free.
  if coalesce(new.listing_category, 'formal') <> 'formal' then
    if coalesce(new.face_value_gbp, 0) < 0 or coalesce(new.asking_price_gbp, 0) < 0 then
      raise exception 'Listing prices cannot be negative';
    end if;
    new.underoccupancy_policy := case when new.can_split then 'not_applicable' else 'face_value' end;
    new.guest_underoccupancy_prices := '{}'::jsonb;
    return new;
  end if;

  if new.reference_student_price_gbp is null or new.reference_student_price_gbp <= 0 then
    raise exception 'A positive college student/member face value is required';
  end if;
  if new.student_listing_price_gbp > new.reference_student_price_gbp * 1.20 then
    raise exception 'Student/member asking price exceeds 120%% of face value';
  end if;

  if coalesce(new.guest_seats, 0) > 0 then
    if new.reference_guest_price_gbp is null or new.reference_guest_price_gbp <= 0 then
      raise exception 'A positive college guest face value is required';
    end if;
    if new.guest_listing_price_gbp > new.reference_guest_price_gbp * 1.20 then
      raise exception 'Normal guest asking price exceeds 120%% of face value';
    end if;
  end if;

  if new.can_split then
    new.underoccupancy_policy := 'not_applicable';
    new.guest_underoccupancy_prices := '{}'::jsonb;
    return new;
  end if;

  if new.underoccupancy_policy = 'tiered' and new.guest_seats > 1 then
    if jsonb_object_length(new.guest_underoccupancy_prices) <> new.guest_seats - 1 then
      raise exception 'Every smaller guest-group size requires a declared price';
    end if;
    for tier in select * from jsonb_each_text(new.guest_underoccupancy_prices)
    loop
      begin
        actual_guests := tier.key::integer;
        tier_price := tier.value::numeric;
      exception when others then
        raise exception 'Invalid under-occupancy price tier';
      end;
      if actual_guests < 1 or actual_guests >= new.guest_seats then
        raise exception 'Under-occupancy group size is outside the offered capacity';
      end if;
      missing_guests := new.guest_seats - actual_guests;
      maximum := new.reference_guest_price_gbp * (1 + missing_guests * 0.40);
      if tier_price <= 0 or tier_price > maximum then
        raise exception 'Price for % attending guests exceeds its £% maximum', actual_guests, round(maximum, 2);
      end if;
    end loop;
  else
    new.guest_underoccupancy_prices := '{}'::jsonb;
  end if;
  return new;
end;
$$;

comment on function public.validate_listing_prices() is
  'Applies Formal face-value and guest under-occupancy protections only to Formal listings; non-Formal travel, event and ride-share posts may be free.';

notify pgrst, 'reload schema';

commit;
