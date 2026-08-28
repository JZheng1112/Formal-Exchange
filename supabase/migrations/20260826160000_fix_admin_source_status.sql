-- Legacy report tables reuse source_status. Keep every existing value and add
-- the moderation workflow states required by the restored admin console.
alter type public.source_status add value if not exists 'new';
alter type public.source_status add value if not exists 'reviewing';
alter type public.source_status add value if not exists 'resolved';
alter type public.source_status add value if not exists 'dismissed';
