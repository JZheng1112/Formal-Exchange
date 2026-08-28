alter table public.ticket_listings
  add column if not exists event_name_zh text,
  add column if not exists event_description_zh text,
  add column if not exists dietary_note_zh text,
  add column if not exists notes_en text,
  add column if not exists notes_zh text;

alter table public.buyer_posts
  add column if not exists notes_zh text;

update public.ticket_listings set
  event_name_zh = coalesce(event_name_zh, case when content_language = 'zh' then event_name end),
  event_description_zh = coalesce(event_description_zh, case when content_language = 'zh' then event_description end),
  dietary_note_zh = coalesce(dietary_note_zh, case when content_language = 'zh' then dietary_note end),
  notes_en = coalesce(notes_en, case when content_language = 'en' then notes end),
  notes_zh = coalesce(notes_zh, case when content_language = 'zh' then notes end);

update public.buyer_posts set
  notes_zh = coalesce(notes_zh, case when content_language = 'zh' then notes end);

