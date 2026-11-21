drop policy if exists "Authenticated users can upload question images" on storage.objects;
create policy "Platform owner can upload question images" on storage.objects for insert to authenticated with check (
  bucket_id = 'question-images'
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
);

drop policy if exists "Authenticated users can upload reference PDFs 12uck5f_0" on storage.objects;
create policy "Platform owner can upload reference PDFs" on storage.objects for insert to authenticated with check (
  bucket_id = 'reference-pdfs'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
);

drop policy if exists "Authenticated users can delete their reference PDF 12uck5f_0" on storage.objects;
create policy "Platform owner can delete reference PDFs" on storage.objects for delete to authenticated using (
  bucket_id = 'reference-pdfs'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
);

drop policy if exists "Authenticated users can delete their reference PDF 12uck5f_1" on storage.objects;
create policy "Platform owner can read reference PDFs" on storage.objects for select to authenticated using (
  bucket_id = 'reference-pdfs'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
);

update storage.buckets
set file_size_limit = 31457280,
    allowed_mime_types = array['application/pdf']::text[]
where id = 'reference-pdfs';
