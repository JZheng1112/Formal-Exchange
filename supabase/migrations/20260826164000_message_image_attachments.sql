alter table public.messages
  add column if not exists image_path text,
  add column if not exists image_mime_type text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'message-images',
  'message-images',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Message participants upload images') then
    create policy "Message participants upload images" on storage.objects for insert to authenticated
      with check (
        bucket_id = 'message-images'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Message participants read images') then
    create policy "Message participants read images" on storage.objects for select to authenticated
      using (
        bucket_id = 'message-images'
        and exists (
          select 1
          from public.messages m
          join public.conversations c on c.id = m.conversation_id
          where m.image_path = storage.objects.name
            and (
              c.buyer_user_id = auth.uid()
              or c.seller_user_id = auth.uid()
              or lower(c.seller_email) = lower(coalesce(auth.jwt()->>'email', ''))
            )
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Message image owners delete images') then
    create policy "Message image owners delete images" on storage.objects for delete to authenticated
      using (bucket_id = 'message-images' and owner_id = auth.uid()::text);
  end if;
end;
$$;

create index if not exists messages_image_path_idx on public.messages(image_path) where image_path is not null;
