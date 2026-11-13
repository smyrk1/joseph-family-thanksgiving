-- Run this SQL in Supabase > SQL Editor.
create table if not exists public.thanksgiving_signups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  dish text not null,
  details text default '',
  guests integer not null default 1 check (guests between 1 and 10),
  created_at timestamptz not null default now()
);

alter table public.thanksgiving_signups enable row level security;

-- Public family sign-up: visitors can read the shared list and add a contribution.
create policy "Anyone can view family signups"
on public.thanksgiving_signups for select
to anon, authenticated
using (true);

create policy "Anyone can add a family signup"
on public.thanksgiving_signups for insert
to anon, authenticated
with check (
  length(trim(name)) between 1 and 100
  and length(trim(dish)) between 1 and 120
  and guests between 1 and 10
);
