create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  user_type text not null default 'student' check (user_type in ('student', 'lecturer', 'admin')),
  institutional_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.admins (
  admin_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists public.books (
  book_id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  category text,
  description text,
  cover_url text,
  stock integer not null default 0,
  availability_status text not null default 'available' check (availability_status in ('available', 'borrowed', 'unavailable')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.borrowings (
  borrowing_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  book_id uuid not null references public.books(book_id) on delete restrict,
  admin_id uuid references public.admins(admin_id),
  borrow_date timestamptz default now(),
  due_date timestamptz,
  return_date timestamptz,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'borrowed', 'returned')),
  notes text,
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, name, email, user_type, institutional_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'user_type', 'student'),
    new.raw_user_meta_data->>'institutional_id'
  )
  on conflict (user_id) do update set
    name = excluded.name,
    email = excluded.email,
    user_type = excluded.user_type,
    institutional_id = excluded.institutional_id,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.admins where admin_id = auth.uid()
  );
$$;

create or replace function public.sync_admin_record()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_type = 'admin' then
    insert into public.admins (admin_id, name)
    values (new.user_id, new.name)
    on conflict (admin_id) do update set name = excluded.name;
  elsif exists (select 1 from public.admins where admin_id = new.user_id) then
    delete from public.admins where admin_id = new.user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_profile_admin_sync on public.profiles;
create trigger on_profile_admin_sync
after insert or update of user_type, name on public.profiles
for each row execute procedure public.sync_admin_record();

create or replace function public.approve_borrowing(p_borrowing_id uuid, p_admin_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_book_id uuid;
  v_stock integer;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  if p_admin_id is null or p_admin_id <> auth.uid() then
    raise exception 'Invalid admin session';
  end if;

  select status, book_id into v_status, v_book_id from public.borrowings where borrowing_id = p_borrowing_id for update;
  if not found then
    raise exception 'Borrowing record not found';
  end if;

  if v_status <> 'pending' then
    raise exception 'Only pending requests can be approved';
  end if;

  select stock into v_stock from public.books where book_id = v_book_id for update;
  if v_stock <= 0 then
    raise exception 'This book has no available copies';
  end if;

  update public.borrowings
    set admin_id = p_admin_id,
        due_date = coalesce(due_date, now() + interval '14 days'),
        status = 'approved'
    where borrowing_id = p_borrowing_id;

  update public.books
    set stock = stock - 1,
        availability_status = case when stock - 1 <= 0 then 'unavailable' else 'borrowed' end,
        updated_at = now()
    where book_id = v_book_id;

  return json_build_object('status', 'approved');
end;
$$;

create or replace function public.process_return(p_borrowing_id uuid, p_admin_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_book_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  if p_admin_id is null or p_admin_id <> auth.uid() then
    raise exception 'Invalid admin session';
  end if;

  select status, book_id into v_status, v_book_id from public.borrowings where borrowing_id = p_borrowing_id for update;
  if not found then
    raise exception 'Borrowing record not found';
  end if;

  if v_status = 'returned' then
    raise exception 'This borrowing has already been returned';
  end if;

  update public.borrowings
    set admin_id = p_admin_id,
        return_date = now(),
        status = 'returned'
    where borrowing_id = p_borrowing_id;

  update public.books
    set stock = stock + 1,
        availability_status = case when stock + 1 > 0 then 'available' else 'unavailable' end,
        updated_at = now()
    where book_id = v_book_id;

  return json_build_object('status', 'returned');
end;
$$;

create or replace function public.request_borrowing(p_user_id uuid, p_book_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock integer;
  v_status text;
  v_active_count integer;
begin
  if p_user_id is null or p_user_id <> auth.uid() then
    raise exception 'Member access required';
  end if;

  select stock, availability_status into v_stock, v_status from public.books where book_id = p_book_id for update;
  if not found then
    raise exception 'Book not found';
  end if;

  if v_stock <= 0 or v_status = 'unavailable' then
    raise exception 'The book is currently unavailable';
  end if;

  select count(*) into v_active_count
  from public.borrowings
  where user_id = p_user_id and book_id = p_book_id and status in ('pending', 'approved', 'borrowed');

  if v_active_count > 0 then
    raise exception 'You already have an active borrowing request for this book';
  end if;

  insert into public.borrowings (user_id, book_id, borrow_date, due_date, status)
  values (p_user_id, p_book_id, now(), now() + interval '14 days', 'pending');

  return json_build_object('status', 'pending');
end;
$$;

alter table public.profiles enable row level security;
alter table public.admins enable row level security;
alter table public.books enable row level security;
alter table public.borrowings enable row level security;

create policy "Profiles can read own record" on public.profiles
for select using (auth.uid() = user_id or public.is_admin());

create policy "Profiles can insert own record" on public.profiles
for insert with check (auth.uid() = user_id);

create policy "Profiles can update own record" on public.profiles
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Admins can view all profiles" on public.profiles
for select using (public.is_admin());

create policy "Admins can manage admins" on public.admins
for all using (public.is_admin()) with check (public.is_admin());

create policy "Books are visible to everyone" on public.books
for select using (true);

create policy "Only admins can create books" on public.books
for insert with check (public.is_admin());

create policy "Only admins can update books" on public.books
for update using (public.is_admin()) with check (public.is_admin());

create policy "Only admins can delete books" on public.books
for delete using (public.is_admin());

create policy "Members can view own borrowings" on public.borrowings
for select using (auth.uid() = user_id or public.is_admin());

create policy "Members can create borrow requests" on public.borrowings
for insert with check (auth.uid() = user_id and status = 'pending');

create policy "Only admins can update borrowing status" on public.borrowings
for update using (public.is_admin()) with check (public.is_admin());

create policy "Only admins can delete borrowings" on public.borrowings
for delete using (public.is_admin());
