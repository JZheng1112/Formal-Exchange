alter table public.ticket_listings
  add column if not exists content_language text not null default 'en',
  add column if not exists event_name_en text,
  add column if not exists event_description_en text,
  add column if not exists dietary_note_en text;

alter table public.ticket_listings drop constraint if exists ticket_listings_content_language_check;
alter table public.ticket_listings add constraint ticket_listings_content_language_check
  check (content_language in ('en', 'zh'));

update public.ticket_listings
set
  event_name_en = coalesce(event_name_en, event_name),
  event_description_en = coalesce(event_description_en, event_description),
  dietary_note_en = coalesce(dietary_note_en, dietary_note)
where content_language = 'en';

alter table public.buyer_posts
  add column if not exists content_language text not null default 'en',
  add column if not exists notes_en text;

alter table public.buyer_posts drop constraint if exists buyer_posts_content_language_check;
alter table public.buyer_posts add constraint buyer_posts_content_language_check
  check (content_language in ('en', 'zh'));

update public.buyer_posts
set notes_en = coalesce(notes_en, notes)
where content_language = 'en';
