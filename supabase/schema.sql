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

/* ---------- seats left, owner push alerts ---------- */

alter table site_settings
  add column if not exists terrace_seats int not null default 40 check (terrace_seats between 0 and 500),
  add column if not exists indoor_seats int not null default 24 check (indoor_seats between 0 and 500),
  add column if not exists seating_minutes int not null default 120 check (seating_minutes between 30 and 360);

-- Seats taken per time and area for one day. Totals only, never guest details.
create or replace function slot_usage(site text, day date)
returns table (slot text, seating text, seats bigint)
language sql stable security definer set search_path = public as $$
  select time, seating, sum(party_size)
  from booking_requests
  where site_id = site and date = day and status <> 'declined'
  group by time, seating;
$$;
revoke execute on function slot_usage(text, date) from public;
grant execute on function slot_usage(text, date) to anon, authenticated;

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
alter table push_subscriptions enable row level security;
drop policy if exists "admin manages own" on push_subscriptions;
create policy "admin manages own" on push_subscriptions for all to authenticated
  using (is_site_admin(site_id) and user_id = auth.uid())
  with check (is_site_admin(site_id) and user_id = auth.uid());

-- Server-side settings nobody can read through the API (no policies)
create table if not exists private_config (key text primary key, value text not null);
alter table private_config enable row level security;

-- Push alerts: the booking-push edge function (supabase/functions/booking-push)
-- runs for every new request. VAPID keys live in private_config
-- (vapid_public, vapid_private, vapid_subject).
alter table booking_requests add column if not exists push_sent_at timestamptz;
create extension if not exists pg_net with schema extensions;
create or replace function notify_new_booking() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/booking-push',
    body := jsonb_build_object('booking_id', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer <anon key>')
  );
  return new;
end $$;
revoke execute on function notify_new_booking() from public, anon, authenticated;
drop trigger if exists booking_push on booking_requests;
create trigger booking_push after insert on booking_requests for each row execute function notify_new_booking();

/* ---------- ordering from the table (QR menu) ---------- */

create table if not exists table_orders (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  table_no int not null check (table_no between 1 and 200),
  items jsonb not null,
  note text not null default '' check (char_length(note) <= 300),
  total numeric(8,2) not null default 0,
  locale text not null default 'en' check (locale in ('hr','en','de')),
  status text not null default 'new' check (status in ('new','preparing','served','cancelled')),
  guest_token text not null,
  push_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists table_calls (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  table_no int not null check (table_no between 1 and 200),
  kind text not null check (kind in ('waiter','bill')),
  status text not null default 'open' check (status in ('open','done')),
  push_sent_at timestamptz,
  created_at timestamptz not null default now()
);
alter table table_orders enable row level security;
alter table table_calls enable row level security;
create policy "public insert" on table_orders for insert to anon, authenticated with check (status = 'new');
create policy "admin read" on table_orders for select to authenticated using (is_site_admin(site_id));
create policy "admin update" on table_orders for update to authenticated using (is_site_admin(site_id)) with check (is_site_admin(site_id));
create policy "public insert" on table_calls for insert to anon, authenticated with check (status = 'open');
create policy "admin read" on table_calls for select to authenticated using (is_site_admin(site_id));
create policy "admin update" on table_calls for update to authenticated using (is_site_admin(site_id)) with check (is_site_admin(site_id));

-- the guest's phone reads its own order status with its token
create or replace function order_status(order_id uuid, token text)
returns table (status text, items jsonb, total numeric, created_at timestamptz, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select status, items, total, created_at, updated_at from table_orders where id = order_id and guest_token = token;
$$;
revoke execute on function order_status(uuid, text) from public;
grant execute on function order_status(uuid, text) to anon, authenticated;
-- notify_table_event(): same pattern as notify_new_booking(), posting { order_id } / { call_id }
-- to the booking-push function; triggers order_push and call_push run it after insert.
