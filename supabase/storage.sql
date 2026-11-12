create schema if not exists storage;

create bucket if not exists book-covers with public;

create policy "Public access to book covers"
on storage.objects for select
using (bucket_id = 'book-covers');

create policy "Admin upload to book covers"
on storage.objects for insert
with check (bucket_id = 'book-covers' and public.is_admin());

create policy "Admin update book covers"
on storage.objects for update
using (bucket_id = 'book-covers' and public.is_admin())
with check (bucket_id = 'book-covers' and public.is_admin());

create policy "Admin delete book covers"
on storage.objects for delete
using (bucket_id = 'book-covers' and public.is_admin());
