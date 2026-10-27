-- ==============================================================================
-- MyLibrary Database Schema & Policies (Supabase / PostgreSQL)
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. ENUMS & CUSTOM TYPES
-- ------------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'loan_status') then
    create type loan_status as enum ('pending', 'active', 'overdue', 'rejected', 'returned');
  end if;
end
$$;

-- ------------------------------------------------------------------------------
-- 2. TABLES DEFINITIONS
-- ------------------------------------------------------------------------------

-- User Profiles (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  username text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Books (tracks physical inventory & Open Library work keys)
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  key text not null unique, -- Open Library work identifier, e.g. /works/OL12345W
  available_copies integer not null default 1 check (available_copies >= 0),
  popularity integer not null default 0 check (popularity >= 0),
  created_at timestamptz not null default now()
);

-- Loans (tracks book borrow requests, approvals, and physical returns)
create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  borrow_date date not null default current_date,
  due_date date,
  status loan_status not null default 'pending',
  request_code text not null,
  created_at timestamptz not null default now()
);

-- Wishlist (reading wishlist for unavailable/desired books)
create table if not exists public.wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint unique_user_wishlist_book unique(user_id, book_id)
);

-- Favorites (loved / starred books)
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  added_at timestamptz not null default now(),
  constraint unique_user_favorite_book unique(user_id, book_id)
);

-- ------------------------------------------------------------------------------
-- 3. INDEXES FOR PERFORMANCE
-- ------------------------------------------------------------------------------
create index if not exists idx_books_key on public.books(key);
create index if not exists idx_loans_user_id on public.loans(user_id);
create index if not exists idx_loans_status on public.loans(status);
create index if not exists idx_wishlist_user on public.wishlist(user_id);
create index if not exists idx_favorites_user on public.favorites(user_id);

-- ------------------------------------------------------------------------------
-- 4. RPC FUNCTIONS (Stored Procedures for Atomic Inventory Operations)
-- ------------------------------------------------------------------------------

-- Increments available copies when a borrowed book is returned
create or replace function public.increment_book_copies(book_id_input uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.books
  set available_copies = available_copies + 1
  where id = book_id_input;
end;
$$;

-- Decrements available copies and increments popularity count upon loan approval
create or replace function public.decrement_copies_and_increment_popularity(book_id_input uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.books
  set 
    available_copies = available_copies - 1,
    popularity = popularity + 1
  where id = book_id_input and available_copies > 0;

  if not found then
    raise exception 'Book is out of stock or does not exist.';
  end if;
end;
$$;

-- ------------------------------------------------------------------------------
-- 5. AUTOMATIC PROFILE TRIGGER ON SIGNUP
-- ------------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, username, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Enable RLS on all public tables
alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.loans enable row level security;
alter table public.wishlist enable row level security;
alter table public.favorites enable row level security;

-- PROFILES
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- BOOKS
create policy "Anyone can view book inventory"
  on public.books for select
  using (true);

create policy "Admins can manage book records"
  on public.books for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- LOANS
create policy "Users can view their own loans"
  on public.loans for select
  using (auth.uid() = user_id);

create policy "Admins can view all loans"
  on public.loans for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Users can request pending loans"
  on public.loans for insert
  with check (auth.uid() = user_id and status = 'pending');

create policy "Admins can update loan statuses"
  on public.loans for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- WISHLIST
create policy "Users can view their wishlist"
  on public.wishlist for select
  using (auth.uid() = user_id);

create policy "Users can insert into their wishlist"
  on public.wishlist for insert
  with check (auth.uid() = user_id);

create policy "Users can delete from their wishlist"
  on public.wishlist for delete
  using (auth.uid() = user_id);

-- FAVORITES
create policy "Users can view their favorites"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "Users can insert into their favorites"
  on public.favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can delete from their favorites"
  on public.favorites for delete
  using (auth.uid() = user_id);

