-- ============================================================
-- Seed test listings for jiacheng.zheng@ndm.ox.ac.uk
-- Run this in Supabase SQL Editor (as postgres/service_role)
-- Dates: 2026-09-25 to 2026-10-05
-- ============================================================

do $$
declare
  v_user_id uuid;
  v_email text := 'jiacheng.zheng@ndm.ox.ac.uk';
  v_ox_college uuid;
  v_cam_college uuid;
begin
  -- Find the user
  select id into v_user_id from auth.users where email = v_email;
  if v_user_id is null then
    raise exception 'User % not found. Please register first.', v_email;
  end if;

  -- Pick one Oxford and one Cambridge college
  select id into v_ox_college from public.colleges where university = 'Oxford' limit 1;
  select id into v_cam_college from public.colleges where university = 'Cambridge' limit 1;

  -- Disable user triggers on ticket_listings (guard + price validation)
  alter table public.ticket_listings disable trigger user;

  -- Clean up any partial inserts from previous runs
  delete from public.ticket_listings
    where seller_user_id = v_user_id
      and notes_en in (
        '3-course dinner with wine. Beautiful candlelit hall. Vegetarian and vegan options available.',
        'Special Guest Night with 4-course meal and port. Halal, vegetarian, and gluten-free options available upon request.',
        'Return ticket, valid for any Oxford Tube service. Departs every 15 mins.',
        'Off-peak single. Must travel on specified train. e-ticket will be transferred.',
        'Dress code: smart casual. Bring your university card for entry.',
        'Open to all freshers and returning students. Black tie dress code.',
        'Departing around 6am. Flexible by 30 minutes. WhatsApp group will be created for coordination.',
        'Leaving at 3pm sharp. Message me to coordinate pickup location.'
      );

  -- ==================== FORMAL LISTINGS ====================

  -- 1. Oxford Hall Formal
  insert into public.ticket_listings (
    seller_user_id, seller_contact_email, listing_category, content_language,
    ticket_type, campus, college_id, formal_type, dress_code,
    formal_date, formal_time, includes_guest,
    student_seats, guest_seats, remaining_student_seats, remaining_guest_seats,
    ticket_quantity, allow_separate_sale, can_split,
    student_listing_price_gbp, guest_listing_price_gbp,
    reference_student_price_gbp, reference_guest_price_gbp,
    face_value_gbp, asking_price_gbp,
    needs_host_escort, allow_outside_college, allow_outside_oxbridge,
    entry_requirements, id_requirement, transfer_confirmed,
    vegan_available, vegetarian_available, halal_available, gluten_free_available,
    notes, notes_en,
    preferred_contact_method, transaction_mode, payment_method, status,
    open_to_swap
  ) values (
    v_user_id, v_email, 'formal', 'en',
    'Hall Formal', 'Oxford', v_ox_college, 'Hall Formal', 'Smart',
    '2026-09-27', '19:30', true,
    2, 1, 2, 1,
    3, true, true,
    14.50, 17.50,
    12.50, 15.00,
    12.50, 14.50,
    true, true, true,
    'University or government photo ID', 'University card', true,
    true, true, false, false,
    '3-course dinner with wine. Beautiful candlelit hall. Vegetarian and vegan options available.',
    '3-course dinner with wine. Beautiful candlelit hall. Vegetarian and vegan options available.',
    'In-app message', 'private', 'Private contact', 'active',
    false
  );

  -- 2. Cambridge Guest Night
  insert into public.ticket_listings (
    seller_user_id, seller_contact_email, listing_category, content_language,
    ticket_type, campus, college_id, formal_type, dress_code,
    formal_date, formal_time, includes_guest,
    student_seats, guest_seats, remaining_student_seats, remaining_guest_seats,
    ticket_quantity, allow_separate_sale, can_split,
    student_listing_price_gbp, guest_listing_price_gbp,
    reference_student_price_gbp, reference_guest_price_gbp,
    face_value_gbp, asking_price_gbp,
    needs_host_escort, allow_outside_college, allow_outside_oxbridge,
    entry_requirements, id_requirement, transfer_confirmed,
    vegan_available, vegetarian_available, halal_available, gluten_free_available,
    notes, notes_en,
    preferred_contact_method, transaction_mode, payment_method, status,
    open_to_swap
  ) values (
    v_user_id, v_email, 'formal', 'en',
    'Guest Night', 'Cambridge', v_cam_college, 'Guest Night', 'Smart',
    '2026-10-02', '19:00', true,
    1, 2, 1, 2,
    3, false, false,
    20.00, 23.00,
    18.00, 20.00,
    18.00, 20.00,
    true, true, true,
    'Must be accompanied by host at all times', 'University card', true,
    false, true, true, true,
    'Special Guest Night with 4-course meal and port. Halal, vegetarian, and gluten-free options available upon request.',
    'Special Guest Night with 4-course meal and port. Halal, vegetarian, and gluten-free options available upon request.',
    'Email', 'private', 'Private contact', 'active',
    true
  );

  -- ==================== COACH/TRAIN LISTINGS ====================

  -- 3. Coach: Oxford → London
  insert into public.ticket_listings (
    seller_user_id, seller_contact_email, listing_category, content_language,
    ticket_type, campus, college_id, formal_type, dress_code,
    formal_date, formal_time,
    origin_name, destination_name, arrival_date, arrival_time, duration_minutes,
    operator_name,
    ticket_quantity, student_listing_price_gbp, asking_price_gbp, face_value_gbp,
    reference_student_price_gbp,
    student_seats, guest_seats, remaining_student_seats, remaining_guest_seats,
    includes_guest, allow_separate_sale, can_split,
    allow_outside_college, allow_outside_oxbridge, transfer_confirmed,
    notes, notes_en,
    preferred_contact_method, transaction_mode, payment_method, status,
    open_to_swap
  ) values (
    v_user_id, v_email, 'coach_train', 'en',
    'Coach', 'Oxford', v_ox_college, 'Special Formal', 'Casual',
    '2026-09-28', '08:00',
    'Oxford Gloucester Green', 'London Victoria', '2026-09-28', '09:40', 100,
    'Oxford Tube',
    2, 8.00, 8.00, 10.00,
    10.00,
    2, 0, 2, 0,
    false, true, true,
    true, true, true,
    'Return ticket, valid for any Oxford Tube service. Departs every 15 mins.',
    'Return ticket, valid for any Oxford Tube service. Departs every 15 mins.',
    'In-app message', 'private', 'Private contact', 'active',
    false
  );

  -- 4. Train: Cambridge → London
  insert into public.ticket_listings (
    seller_user_id, seller_contact_email, listing_category, content_language,
    ticket_type, campus, college_id, formal_type, dress_code,
    formal_date, formal_time,
    origin_name, destination_name, arrival_date, arrival_time, duration_minutes,
    operator_name,
    ticket_quantity, student_listing_price_gbp, asking_price_gbp, face_value_gbp,
    reference_student_price_gbp,
    student_seats, guest_seats, remaining_student_seats, remaining_guest_seats,
    includes_guest, allow_separate_sale, can_split,
    allow_outside_college, allow_outside_oxbridge, transfer_confirmed,
    notes, notes_en,
    preferred_contact_method, transaction_mode, payment_method, status,
    open_to_swap
  ) values (
    v_user_id, v_email, 'coach_train', 'en',
    'Train', 'Cambridge', v_cam_college, 'Special Formal', 'Casual',
    '2026-10-01', '14:30',
    'Cambridge Station', 'London Kings Cross', '2026-10-01', '15:20', 50,
    'Greater Anglia',
    1, 12.50, 12.50, 18.00,
    18.00,
    1, 0, 1, 0,
    false, false, false,
    true, true, true,
    'Off-peak single. Must travel on specified train. e-ticket will be transferred.',
    'Off-peak single. Must travel on specified train. e-ticket will be transferred.',
    'In-app message', 'private', 'Private contact', 'active',
    false
  );

  -- ==================== EVENT LISTINGS ====================

  -- 5. Event (admission): Oxford Welcome Drinks
  insert into public.ticket_listings (
    seller_user_id, seller_contact_email, listing_category, content_language,
    ticket_type, campus, college_id, formal_type, dress_code,
    formal_date, formal_time,
    event_kind, event_name, event_name_en,
    event_description, event_description_en,
    ticket_quantity, student_listing_price_gbp, asking_price_gbp, face_value_gbp,
    reference_student_price_gbp,
    student_seats, guest_seats, remaining_student_seats, remaining_guest_seats,
    includes_guest, allow_separate_sale, can_split,
    allow_outside_college, allow_outside_oxbridge, transfer_confirmed,
    notes, notes_en,
    preferred_contact_method, transaction_mode, payment_method, status,
    open_to_swap
  ) values (
    v_user_id, v_email, 'event', 'en',
    'Other event', 'Oxford', v_ox_college, 'Special Formal', 'Casual',
    '2026-10-03', '20:00',
    'admission', 'Michaelmas Welcome Drinks', 'Michaelmas Welcome Drinks',
    'Welcome party for Michaelmas term. Live music, cocktails, and canapés in the college garden.', 'Welcome party for Michaelmas term. Live music, cocktails, and canapés in the college garden.',
    2, 15.00, 15.00, 20.00,
    20.00,
    2, 0, 2, 0,
    false, true, true,
    true, true, true,
    'Dress code: smart casual. Bring your university card for entry.',
    'Dress code: smart casual. Bring your university card for entry.',
    'In-app message', 'private', 'Private contact', 'active',
    false
  );

  -- 6. Event (admission): Cambridge Freshers Gala
  insert into public.ticket_listings (
    seller_user_id, seller_contact_email, listing_category, content_language,
    ticket_type, campus, college_id, formal_type, dress_code,
    formal_date, formal_time,
    event_kind, event_name, event_name_en,
    event_description, event_description_en,
    ticket_quantity, student_listing_price_gbp, asking_price_gbp, face_value_gbp,
    reference_student_price_gbp,
    student_seats, guest_seats, remaining_student_seats, remaining_guest_seats,
    includes_guest, allow_separate_sale, can_split,
    allow_outside_college, allow_outside_oxbridge, transfer_confirmed,
    notes, notes_en,
    preferred_contact_method, transaction_mode, payment_method, status,
    open_to_swap
  ) values (
    v_user_id, v_email, 'event', 'en',
    'Other event', 'Cambridge', v_cam_college, 'Special Formal', 'Casual',
    '2026-09-30', '18:00',
    'admission', 'Freshers Week Gala Dinner', 'Freshers Week Gala Dinner',
    'A grand welcome dinner for all freshers. Three courses with college wine and entertainment.', 'A grand welcome dinner for all freshers. Three courses with college wine and entertainment.',
    3, 25.00, 25.00, 30.00,
    30.00,
    3, 0, 3, 0,
    false, true, true,
    true, true, true,
    'Open to all freshers and returning students. Black tie dress code.',
    'Open to all freshers and returning students. Black tie dress code.',
    'Email', 'private', 'Private contact', 'active',
    false
  );

  -- 7. Event (airport_ride_share): Oxford → Heathrow
  insert into public.ticket_listings (
    seller_user_id, seller_contact_email, listing_category, content_language,
    ticket_type, campus, college_id, formal_type, dress_code,
    formal_date, formal_time,
    event_kind, event_name, event_name_en,
    event_description, event_description_en,
    origin_name, destination_name,
    ticket_quantity, student_listing_price_gbp, asking_price_gbp, face_value_gbp,
    reference_student_price_gbp,
    student_seats, guest_seats, remaining_student_seats, remaining_guest_seats,
    includes_guest, allow_separate_sale, can_split,
    allow_outside_college, allow_outside_oxbridge, transfer_confirmed,
    notes, notes_en,
    preferred_contact_method, transaction_mode, payment_method, status,
    open_to_swap
  ) values (
    v_user_id, v_email, 'event', 'en',
    'Airport ride-share', 'Oxford', v_ox_college, 'Special Formal', 'Casual',
    '2026-10-05', '06:00',
    'airport_ride_share', 'Ride share to Heathrow', 'Ride share to Heathrow',
    'Sharing a taxi from central Oxford to Heathrow Terminal 5. Splitting fare 3 ways.',
    'Sharing a taxi from central Oxford to Heathrow Terminal 5. Splitting fare 3 ways.',
    'Oxford City Centre', 'Heathrow Airport T5',
    3, 20.00, 20.00, null,
    0,
    3, 0, 3, 0,
    false, true, true,
    true, true, true,
    'Departing around 6am. Flexible by 30 minutes. WhatsApp group will be created for coordination.',
    'Departing around 6am. Flexible by 30 minutes. WhatsApp group will be created for coordination.',
    'WhatsApp', 'private', 'Private contact', 'active',
    false
  );

  -- 8. Event (airport_ride_share): Cambridge → Stansted
  insert into public.ticket_listings (
    seller_user_id, seller_contact_email, listing_category, content_language,
    ticket_type, campus, college_id, formal_type, dress_code,
    formal_date, formal_time,
    event_kind, event_name, event_name_en,
    event_description, event_description_en,
    origin_name, destination_name,
    ticket_quantity, student_listing_price_gbp, asking_price_gbp, face_value_gbp,
    reference_student_price_gbp,
    student_seats, guest_seats, remaining_student_seats, remaining_guest_seats,
    includes_guest, allow_separate_sale, can_split,
    allow_outside_college, allow_outside_oxbridge, transfer_confirmed,
    notes, notes_en,
    preferred_contact_method, transaction_mode, payment_method, status,
    open_to_swap
  ) values (
    v_user_id, v_email, 'event', 'en',
    'Airport ride-share', 'Cambridge', v_cam_college, 'Special Formal', 'Casual',
    '2026-09-25', '15:00',
    'airport_ride_share', 'Ride share to Stansted', 'Ride share to Stansted',
    'Sharing an Uber from Cambridge to Stansted Airport. 2 seats available, cost split equally.',
    'Sharing an Uber from Cambridge to Stansted Airport. 2 seats available, cost split equally.',
    'Cambridge City Centre', 'Stansted Airport',
    2, 15.00, 15.00, null,
    0,
    2, 0, 2, 0,
    false, true, true,
    true, true, true,
    'Leaving at 3pm sharp. Message me to coordinate pickup location.',
    'Leaving at 3pm sharp. Message me to coordinate pickup location.',
    'In-app message', 'private', 'Private contact', 'active',
    false
  );

  -- Re-enable user triggers
  alter table public.ticket_listings enable trigger user;

  raise notice 'Successfully inserted 8 test listings for %', v_email;
end $$;
