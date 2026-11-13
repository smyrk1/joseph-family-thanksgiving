-- Joseph Family Thanksgiving 2026
-- Run this entire file in Supabase Dashboard > SQL Editor.
-- Public access is intentional: guests do not need accounts.
-- Public visitors can read the menu, RSVPs and claims; they can add RSVPs
-- and claim an unclaimed dish. They cannot edit/delete other people's records.

create extension if not exists pgcrypto;

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  sort_order integer not null default 0,
  active boolean not null default true
);

create table if not exists public.dish_claims (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null unique references public.menu_items(id),
  guest_name text not null check (char_length(trim(guest_name)) between 2 and 80),
  created_at timestamptz not null default now()
);

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null check (char_length(trim(guest_name)) between 2 and 80),
  attending boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.menu_items enable row level security;
alter table public.dish_claims enable row level security;
alter table public.rsvps enable row level security;

drop policy if exists "Anyone can view active menu" on public.menu_items;
create policy "Anyone can view active menu"
on public.menu_items for select to anon, authenticated
using (active = true);

drop policy if exists "Anyone can view dish claims" on public.dish_claims;
create policy "Anyone can view dish claims"
on public.dish_claims for select to anon, authenticated
using (true);

drop policy if exists "Anyone can view RSVPs" on public.rsvps;
create policy "Anyone can view RSVPs"
on public.rsvps for select to anon, authenticated
using (true);

drop policy if exists "Anyone can submit RSVP" on public.rsvps;
create policy "Anyone can submit RSVP"
on public.rsvps for insert to anon, authenticated
with check (char_length(trim(guest_name)) between 2 and 80);

grant select on public.menu_items to anon, authenticated;
grant select on public.dish_claims to anon, authenticated;
grant select, insert on public.rsvps to anon, authenticated;

-- The unique menu_item_id constraint prevents two guests claiming the same dish.
-- This RPC validates input and inserts atomically.
create or replace function public.claim_dish(p_menu_item_id uuid, p_guest_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_name text := trim(p_guest_name);
  new_claim public.dish_claims;
begin
  if clean_name is null or char_length(clean_name) < 2 or char_length(clean_name) > 80 then
    raise exception 'Enter a name between 2 and 80 characters.';
  end if;

  if not exists (
    select 1 from public.menu_items
    where id = p_menu_item_id and active = true
  ) then
    raise exception 'That menu item is not available.';
  end if;

  insert into public.dish_claims(menu_item_id, guest_name)
  values (p_menu_item_id, clean_name)
  on conflict (menu_item_id) do nothing
  returning * into new_claim;

  if new_claim.id is null then
    raise exception 'This dish has already been claimed. Please choose another.';
  end if;

  return jsonb_build_object(
    'id', new_claim.id,
    'menu_item_id', new_claim.menu_item_id,
    'guest_name', new_claim.guest_name,
    'created_at', new_claim.created_at
  );
end;
$$;

revoke all on function public.claim_dish(uuid, text) from public;
grant execute on function public.claim_dish(uuid, text) to anon, authenticated;

-- Starter menu. Items previously removed from the family menu are intentionally omitted.
insert into public.menu_items (name, category, sort_order) values
  ('Southern Fried Chicken', 'Main Dishes', 1),
  ('Baked Macaroni & Cheese', 'Side Dishes', 2),
  ('Mashed Potatoes', 'Side Dishes', 3),
  ('Candied Yams', 'Side Dishes', 4),
  ('Green Beans', 'Side Dishes', 5),
  ('Collard Greens', 'Side Dishes', 6),
  ('Southern Cabbage', 'Side Dishes', 7),
  ('Deviled Eggs', 'Sides & Extras', 8),
  ('Southern Potato Salad', 'Sides & Extras', 9),
  ('Broccoli Salad', 'Sides & Extras', 10),
  ('Sweet Potato Pie', 'Desserts', 11),
  ('Pecan Pie', 'Desserts', 12),
  ('Banana Pudding', 'Desserts', 13),
  ('Peach Cobbler', 'Desserts', 14),
  ('Homemade Lemonade', 'Drinks', 15),
  ('Sweet Tea', 'Drinks', 16),
  ('Apple Cider', 'Drinks', 17)
on conflict (name) do nothing;

-- Enable Supabase Realtime for immediate cross-device updates.
do $$
begin
  alter publication supabase_realtime add table public.dish_claims;
exception when duplicate_object then null;
when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.rsvps;
exception when duplicate_object then null;
when undefined_object then null;
end $$;
