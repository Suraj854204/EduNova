-- =====================================================================
-- EdTech CRM & Inquiry System : Supabase (PostgreSQL) schema
-- Run in Supabase Dashboard -> SQL Editor, or with: npm run db:init
-- Safe to run multiple times (idempotent).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- admins : accounts that can sign in to the dashboard (custom JWT auth)
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  id            uuid primary key default gen_random_uuid(),
  name          text        not null,
  email         text        not null,
  password_hash text        not null,           -- bcrypt hash, never plain text
  created_at    timestamptz not null default now()
);

create unique index if not exists admins_email_unique_idx
  on public.admins (lower(email));

-- ---------------------------------------------------------------------
-- inquiries : public form submissions
-- ---------------------------------------------------------------------
create table if not exists public.inquiries (
  id          uuid primary key default gen_random_uuid(),
  user_type   text        not null check (user_type in ('Parent', 'Student', 'School')),
  category    text        not null check (category in ('Scholarship', 'Concert', 'Admission', 'General Query')),
  name        text        not null check (char_length(name) between 2 and 100),
  email       text        not null check (char_length(email) <= 254),
  phone       text        not null check (char_length(phone) between 7 and 20),
  message     text        not null check (char_length(message) between 5 and 2000),
  status      text        not null default 'New' check (status in ('New', 'In Progress', 'Resolved')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);
create index if not exists inquiries_category_idx   on public.inquiries (category);
create index if not exists inquiries_user_type_idx  on public.inquiries (user_type);
create index if not exists inquiries_status_idx     on public.inquiries (status);
create index if not exists inquiries_phone_idx      on public.inquiries (phone);
create index if not exists inquiries_name_lower_idx on public.inquiries (lower(name));

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists inquiries_set_updated_at on public.inquiries;
create trigger inquiries_set_updated_at
  before update on public.inquiries
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Security: block Supabase's public REST (anon / authenticated keys).
-- Only our Express backend (direct Postgres connection) touches the data.
-- ---------------------------------------------------------------------
alter table public.admins    enable row level security;
alter table public.inquiries enable row level security;
