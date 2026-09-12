-- ============================================================
-- Durham, part 2 of 2: recognise the domains, seed the colleges.
--
-- Durham runs the same Formal culture as Oxbridge — gowned dinners,
-- guest places, college-set rules — so it needs no new concepts, only
-- an entry in the domain table and its colleges.
--
-- university_from_email is rewritten as a lookup rather than a chain of
-- CASE branches, so the next university is one row rather than an edit
-- to the matching logic. Both shapes are accepted for every entry: the
-- bare domain (durham.ac.uk) and a department or college prefix
-- (chads.durham.ac.uk), matching how ox.ac.uk has always worked.
-- ============================================================

create or replace function public.university_from_email(p_email text)
returns text language sql immutable as $$
  select u.name
    from (values
      ('ox.ac.uk',     'Oxford'),
      ('cam.ac.uk',    'Cambridge'),
      ('durham.ac.uk', 'Durham'),
      ('dur.ac.uk',    'Durham')   -- the older Durham domain, still issued
    ) as u(domain, name)
   where p_email is not null
     and (
       lower(split_part(p_email, '@', 2)) = u.domain
       -- the leading dot matters: it stops fakeox.ac.uk matching ox.ac.uk
       or lower(split_part(p_email, '@', 2)) like '%.' || u.domain
     )
   limit 1;
$$;

-- The guard already asks university_from_email rather than naming
-- universities itself, so only its message needed widening.
create or replace function public.guard_marketplace_write()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_profile public.profiles;
  v_email   text;
begin
  select * into v_profile from public.profiles where id = auth.uid();

  if v_profile.id is null then
    raise exception 'Profile not found. Please complete registration first.';
  end if;

  if v_profile.account_status = 'suspended' then
    raise exception 'Your account is suspended: %',
      coalesce(v_profile.suspension_reason, 'Contact support.');
  end if;

  if tg_table_name = 'ticket_listings' then
    if not v_profile.can_list_ticket then
      raise exception 'Your account does not have listing permission. Contact support.';
    end if;

    if coalesce(new.listing_category, 'formal') = 'formal' then
      if not v_profile.is_verified then
        raise exception 'Formal tickets require a confirmed university email. Open the verification link we emailed you, then try again.';
      end if;

      v_email := coalesce(v_profile.verification_email, v_profile.email, '');

      if public.university_from_email(v_email) is null then
        raise exception 'Formal tickets may only be published from a confirmed Oxford, Cambridge or Durham address. Other .ac.uk accounts can still post buyer requests, travel tickets and events.';
      end if;
    end if;
  end if;

  return new;
end;
$$;

-- ---------- the seventeen Durham colleges ----------
-- St Chad's and St John's are recognised colleges rather than maintained
-- ones, and Ustinov admits only postgraduates; neither distinction changes
-- how a Formal ticket is listed, so both are seeded as ordinary colleges.

insert into public.colleges (name, university, institution_type, active)
select v.name, 'Durham'::public.university_type, 'college'::public.institution_type, true
  from (values
    ('University College'),
    ('Hatfield College'),
    ('St Mary''s College'),
    ('St Chad''s College'),
    ('St John''s College'),
    ('St Aidan''s College'),
    ('Grey College'),
    ('Trevelyan College'),
    ('Van Mildert College'),
    ('Collingwood College'),
    ('Josephine Butler College'),
    ('John Snow College'),
    ('Stephenson College'),
    ('South College'),
    ('Ustinov College'),
    ('College of St Hild and St Bede'),
    ('St Cuthbert''s Society')
  ) as v(name)
 where not exists (
   select 1 from public.colleges c
    where c.name = v.name and c.university = 'Durham'::public.university_type
 );
