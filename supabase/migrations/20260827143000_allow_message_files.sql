-- Chat attachments remain private and participant-only, but may include common
-- document formats as well as images. Executables and archives are deliberately
-- excluded. The application also enforces this 15 MB limit before upload.
update storage.buckets
set
  public = false,
  file_size_limit = 15728640,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
where id = 'message-images';

comment on column public.messages.image_path is
  'Private message attachment path. Access is limited to conversation participants by storage RLS.';

comment on column public.messages.image_mime_type is
  'MIME type for a private image or supported document attachment.';
