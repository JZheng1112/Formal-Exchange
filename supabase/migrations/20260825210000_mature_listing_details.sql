alter table public.ticket_listings
  add column if not exists image_urls text[] not null default '{}',
  add column if not exists arrival_date date,
  add column if not exists event_name text,
  add column if not exists event_description text,
  add column if not exists event_kind text,
  add column if not exists entry_requirements text,
  add column if not exists id_requirement text,
  add column if not exists guest_name_required boolean not null default false,
  add column if not exists guest_name_deadline timestamptz,
  add column if not exists transfer_confirmed boolean not null default false;

alter table public.ticket_listings drop constraint if exists ticket_listings_event_kind_check;
alter table public.ticket_listings add constraint ticket_listings_event_kind_check
  check (event_kind is null or event_kind in ('admission','airport_ride_share'));

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do update set public = true;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Authenticated users upload listing images') then
    create policy "Authenticated users upload listing images" on storage.objects for insert to authenticated
      with check (bucket_id = 'listing-images');
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Public reads listing images') then
    create policy "Public reads listing images" on storage.objects for select to public
      using (bucket_id = 'listing-images');
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Owners delete listing images') then
    create policy "Owners delete listing images" on storage.objects for delete to authenticated
      using (bucket_id = 'listing-images' and owner_id = auth.uid()::text);
  end if;
end $$;
