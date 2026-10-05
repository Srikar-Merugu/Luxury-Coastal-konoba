-- Konoba Plavi Kamen — Supabase schema.
--
-- Mirrors the shared starter (menu_categories, menu_items, opening_hours,
-- booking_requests, faqs, all keyed by site_id) and adds the konoba extras:
-- seasons (hours change through the year), catch_items + site_settings
-- (catch of the day, closed-for-the-season override) and admins.
--
-- Run once in the Supabase SQL editor, then run seed.sql.

create extension if not exists pgcrypto;

/* ---------- public content ---------- */

create table if not exists menu_categories (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  slug text not null,
  name_hr text not null, name_en text not null, name_de text not null,
  photo text not null default 'catch',
  sort int not null default 0,
  unique (site_id, slug)
);

create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  category_id uuid not null references menu_categories (id) on delete cascade,
  name_hr text not null, name_en text not null, name_de text not null,
  description_hr text not null default '', description_en text not null default '', description_de text not null default '',
  price text not null,                       -- "16" or "65/kg", EUR
  tags text[] not null default '{}',         -- vegan, vegetarian, gluten-free
  signature boolean not null default false,
  image text,                                -- photo key from lib/photos.ts
  sort int not null default 0
);

create table if not exists seasons (
  site_id text not null,
  id text not null,
  name_hr text not null, name_en text not null, name_de text not null,
  from_md text not null check (from_md ~ '^\d{2}-\d{2}$'),   -- MM-DD inclusive
  to_md text not null check (to_md ~ '^\d{2}-\d{2}$'),
  sort int not null default 0,
  primary key (site_id, id)
);

create table if not exists opening_hours (
  site_id text not null,
  season_id text not null,
  weekday int not null check (weekday between 0 and 6),     -- 0 = Sunday
  opens text check (opens ~ '^\d{2}:\d{2}$'),                -- null = closed that day
  closes text check (closes ~ '^\d{2}:\d{2}$'),
  primary key (site_id, season_id, weekday),
  foreign key (site_id, season_id) references seasons (site_id, id) on delete cascade
);

create table if not exists faqs (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  question_hr text not null, question_en text not null, question_de text not null,
  answer_hr text not null, answer_en text not null, answer_de text not null,
  sort int not null default 0
);

create table if not exists catch_items (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  name_hr text not null, name_en text not null, name_de text not null,
  how_hr text not null default '', how_en text not null default '', how_de text not null default '',
  price text not null,
  sold_out boolean not null default false,
  photo text not null default 'catch',
  sort int not null default 0
);

create table if not exists site_settings (
  site_id text primary key,
  catch_headline_hr text not null default '', catch_headline_en text not null default '', catch_headline_de text not null default '',
  catch_note_hr text not null default '', catch_note_en text not null default '', catch_note_de text not null default '',
  catch_by text not null default '',
  catch_updated_at timestamptz not null default now(),
  closed_override boolean not null default false,
  closed_note_hr text not null default '', closed_note_en text not null default '', closed_note_de text not null default ''
);

/* ---------- private ---------- */

create table if not exists booking_requests (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  date date not null,
  time text not null check (time ~ '^\d{2}:\d{2}$'),
  party_size int not null check (party_size between 1 and 60),
  seating text not null default 'any' check (seating in ('terrace', 'indoor', 'any')),
  large_group boolean not null default false,
  name text not null check (char_length(name) between 1 and 200),
  phone text not null check (char_length(phone) between 1 and 40),
  email text not null check (char_length(email) between 3 and 200),
  note text not null default '' check (char_length(note) <= 1000),
  locale text not null default 'en' check (locale in ('hr', 'en', 'de')),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'declined')),
  created_at timestamptz not null default now()
);
create index if not exists booking_requests_site_created on booking_requests (site_id, created_at desc);

-- Who may use /admin for which site. Add a row after creating the user in
-- Authentication → Users:  insert into admins values ('konoba', '<user uuid>');
create table if not exists admins (
  site_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (site_id, user_id)
);

create or replace function is_site_admin(site text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where site_id = site and user_id = auth.uid());
$$;

/* ---------- row level security ---------- */

alter table menu_categories  enable row level security;
alter table menu_items       enable row level security;
alter table seasons          enable row level security;
alter table opening_hours    enable row level security;
alter table faqs             enable row level security;
alter table catch_items      enable row level security;
alter table site_settings    enable row level security;
alter table booking_requests enable row level security;
alter table admins           enable row level security;

-- Anyone can read the public content; only that site's admins can change it.
do $$
declare t text;
begin
  foreach t in array array['menu_categories','menu_items','seasons','opening_hours','faqs','catch_items','site_settings'] loop
    execute format('drop policy if exists "public read" on %I', t);
    execute format('create policy "public read" on %I for select using (true)', t);
    execute format('drop policy if exists "admin write" on %I', t);
    execute format('create policy "admin write" on %I for all to authenticated using (is_site_admin(site_id)) with check (is_site_admin(site_id))', t);
  end loop;
end $$;

-- The public can only insert a new, pending request. Nobody reads bookings
-- without signing in as an admin of that site.
drop policy if exists "public insert" on booking_requests;
create policy "public insert" on booking_requests for insert to anon, authenticated
  with check (status = 'pending');
drop policy if exists "admin read" on booking_requests;
create policy "admin read" on booking_requests for select to authenticated using (is_site_admin(site_id));
drop policy if exists "admin update" on booking_requests;
create policy "admin update" on booking_requests for update to authenticated
  using (is_site_admin(site_id)) with check (is_site_admin(site_id));

drop policy if exists "own rows" on admins;
create policy "own rows" on admins for select to authenticated using (user_id = auth.uid());

-- Only signed-in users need the admin check (used by the policies above and /admin).
revoke execute on function is_site_admin(text) from public, anon;
grant execute on function is_site_admin(text) to authenticated;
