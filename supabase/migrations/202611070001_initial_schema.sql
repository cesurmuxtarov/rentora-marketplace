-- RENTORA initial schema. Run through the Supabase migration workflow.
create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

create type public.user_role as enum ('renter','owner','admin');
create type public.listing_status as enum ('draft','pending_review','active','paused','rejected','archived');
create type public.booking_status as enum ('pending','confirmed','rejected','cancelled','active','completed','disputed');
create type public.payment_status as enum ('requires_payment','processing','authorized','paid','partially_refunded','refunded','failed','cancelled');
create type public.transaction_kind as enum ('rental','commission','deposit_hold','deposit_release','refund','owner_payout','delivery');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'renter',
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text, avatar_url text, city text default 'Bakı', bio text,
  identity_status text not null default 'unverified' check (identity_status in ('unverified','pending','verified','rejected')),
  rating numeric(3,2) not null default 0 check (rating between 0 and 5),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.categories (id uuid primary key default gen_random_uuid(), name_az text unique not null, slug text unique not null, icon text, active boolean not null default true, sort_order int not null default 0);
create table public.listings (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id), title text not null check (char_length(title) between 8 and 160),
  description text not null check (char_length(description) between 30 and 5000), city text not null, district text,
  daily_price numeric(12,2) not null check (daily_price > 0), deposit_amount numeric(12,2) not null default 0 check (deposit_amount >= 0),
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0), status public.listing_status not null default 'draft',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.listing_images (id uuid primary key default gen_random_uuid(), listing_id uuid not null references public.listings(id) on delete cascade, storage_path text not null, alt_text text, sort_order int not null default 0, unique(listing_id,sort_order));
create table public.favorites (user_id uuid not null references public.profiles(id) on delete cascade, listing_id uuid not null references public.listings(id) on delete cascade, created_at timestamptz not null default now(), primary key(user_id,listing_id));
create table public.bookings (
  id uuid primary key default gen_random_uuid(), listing_id uuid not null references public.listings(id), renter_id uuid not null references public.profiles(id),
  owner_id uuid not null references public.profiles(id), starts_on date not null, ends_on date not null, status public.booking_status not null default 'pending',
  daily_price numeric(12,2) not null check (daily_price > 0), rental_amount numeric(12,2) not null check (rental_amount >= 0),
  commission_rate numeric(5,2) not null check (commission_rate between 0 and 100), commission_amount numeric(12,2) not null check (commission_amount >= 0),
  deposit_amount numeric(12,2) not null check (deposit_amount >= 0), delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  total_amount numeric(12,2) not null check (total_amount >= 0), currency char(3) not null default 'AZN', cancellation_reason text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check (ends_on > starts_on), check (renter_id <> owner_id)
);
-- Confirmed/active rentals for one listing may not overlap.
alter table public.bookings add constraint no_overlapping_confirmed_bookings exclude using gist (listing_id with =, daterange(starts_on,ends_on,'[)') with &&) where (status in ('confirmed','active'));
create table public.payments (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id), provider text not null,
  provider_payment_id text, idempotency_key text not null unique, status public.payment_status not null default 'requires_payment',
  amount numeric(12,2) not null check (amount >= 0), currency char(3) not null default 'AZN', provider_payload jsonb not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(provider,provider_payment_id)
);
create table public.transactions (id uuid primary key default gen_random_uuid(), booking_id uuid references public.bookings(id), payment_id uuid references public.payments(id), user_id uuid references public.profiles(id), kind public.transaction_kind not null, amount numeric(12,2) not null, currency char(3) not null default 'AZN', status text not null, external_reference text, created_at timestamptz not null default now());
create table public.messages (id uuid primary key default gen_random_uuid(), booking_id uuid references public.bookings(id), sender_id uuid not null references public.profiles(id), recipient_id uuid not null references public.profiles(id), body text not null check (char_length(body) between 1 and 4000), read_at timestamptz, created_at timestamptz not null default now(), check(sender_id<>recipient_id));
create table public.reviews (id uuid primary key default gen_random_uuid(), booking_id uuid not null unique references public.bookings(id), author_id uuid not null references public.profiles(id), subject_id uuid not null references public.profiles(id), listing_id uuid not null references public.listings(id), rating int not null check(rating between 1 and 5), body text check(char_length(body)<=2000), created_at timestamptz not null default now(), check(author_id<>subject_id));
create table public.notifications (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, type text not null, title text not null, body text, data jsonb not null default '{}', read_at timestamptz, created_at timestamptz not null default now());
create table public.disputes (id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id), opened_by uuid not null references public.profiles(id), assigned_admin uuid references public.profiles(id), status text not null default 'open' check(status in ('open','investigating','resolved','closed')), reason text not null, resolution text, created_at timestamptz not null default now(), resolved_at timestamptz);
create table public.item_passports (id uuid primary key default gen_random_uuid(), listing_id uuid not null unique references public.listings(id) on delete cascade, serial_number text, condition_status text not null, audit_hash text, audit_data jsonb not null default '{}', last_audited_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.admin_settings (key text primary key, value jsonb not null, updated_by uuid references public.profiles(id), updated_at timestamptz not null default now());

create index listings_search_idx on public.listings using gin (to_tsvector('simple',title||' '||description));
create index listings_filter_idx on public.listings(status,category_id,city,daily_price);
create index bookings_renter_idx on public.bookings(renter_id,created_at desc);
create index bookings_owner_idx on public.bookings(owner_id,created_at desc);
create index messages_pair_idx on public.messages(sender_id,recipient_id,created_at desc);
create index notifications_unread_idx on public.notifications(user_id,created_at desc) where read_at is null;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin') $$;
create or replace function public.owns_booking(target uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.bookings where id=target and (renter_id=auth.uid() or owner_id=auth.uid())) $$;

alter table public.profiles enable row level security; alter table public.categories enable row level security; alter table public.listings enable row level security;
alter table public.listing_images enable row level security; alter table public.favorites enable row level security; alter table public.bookings enable row level security;
alter table public.payments enable row level security; alter table public.transactions enable row level security; alter table public.messages enable row level security;
alter table public.reviews enable row level security; alter table public.notifications enable row level security; alter table public.disputes enable row level security;
alter table public.item_passports enable row level security; alter table public.admin_settings enable row level security;

create policy "public profiles readable" on public.profiles for select using (true);
create policy "user updates own profile" on public.profiles for update using (id=auth.uid()) with check (id=auth.uid() and role=(select role from public.profiles where id=auth.uid()));
create policy "categories readable" on public.categories for select using (active or public.is_admin());
create policy "admins manage categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "active listings readable" on public.listings for select using (status='active' or owner_id=auth.uid() or public.is_admin());
create policy "owners create listings" on public.listings for insert with check (owner_id=auth.uid() and exists(select 1 from public.profiles where id=auth.uid() and role in ('owner','admin')));
create policy "owners update listings" on public.listings for update using (owner_id=auth.uid() or public.is_admin()) with check (owner_id=auth.uid() or public.is_admin());
create policy "listing images readable" on public.listing_images for select using (exists(select 1 from public.listings l where l.id=listing_id and (l.status='active' or l.owner_id=auth.uid() or public.is_admin())));
create policy "owners manage listing images" on public.listing_images for all using (exists(select 1 from public.listings l where l.id=listing_id and (l.owner_id=auth.uid() or public.is_admin()))) with check (exists(select 1 from public.listings l where l.id=listing_id and (l.owner_id=auth.uid() or public.is_admin())));
create policy "users manage favorites" on public.favorites for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "booking parties read" on public.bookings for select using (renter_id=auth.uid() or owner_id=auth.uid() or public.is_admin());
create policy "renters create bookings" on public.bookings for insert with check (renter_id=auth.uid() and owner_id=(select owner_id from public.listings where id=listing_id));
create policy "booking parties update" on public.bookings for update using (renter_id=auth.uid() or owner_id=auth.uid() or public.is_admin());
create policy "payment parties read" on public.payments for select using (public.owns_booking(booking_id) or public.is_admin());
create policy "transaction owner reads" on public.transactions for select using (user_id=auth.uid() or public.is_admin());
create policy "message parties read" on public.messages for select using (sender_id=auth.uid() or recipient_id=auth.uid() or public.is_admin());
create policy "message sender inserts" on public.messages for insert with check (sender_id=auth.uid() and public.owns_booking(booking_id));
create policy "recipient marks read" on public.messages for update using (recipient_id=auth.uid()) with check (recipient_id=auth.uid());
create policy "reviews readable" on public.reviews for select using (true);
create policy "completed renter reviews" on public.reviews for insert with check (author_id=auth.uid() and exists(select 1 from public.bookings b where b.id=booking_id and b.status='completed' and b.renter_id=auth.uid() and b.listing_id=listing_id));
create policy "users read notifications" on public.notifications for select using (user_id=auth.uid());
create policy "users mark notifications read" on public.notifications for update using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "dispute parties read" on public.disputes for select using (public.owns_booking(booking_id) or public.is_admin());
create policy "booking parties open dispute" on public.disputes for insert with check (opened_by=auth.uid() and public.owns_booking(booking_id));
create policy "admins resolve disputes" on public.disputes for update using (public.is_admin()) with check (public.is_admin());
create policy "passports readable for visible listings" on public.item_passports for select using (exists(select 1 from public.listings l where l.id=listing_id and (l.status='active' or l.owner_id=auth.uid() or public.is_admin())));
create policy "owners manage passports" on public.item_passports for all using (exists(select 1 from public.listings l where l.id=listing_id and (l.owner_id=auth.uid() or public.is_admin()))) with check (exists(select 1 from public.listings l where l.id=listing_id and (l.owner_id=auth.uid() or public.is_admin())));
create policy "admins manage settings" on public.admin_settings for all using (public.is_admin()) with check (public.is_admin());

-- Payments, transactions and server-authored notifications deliberately have no client INSERT policy.
-- They must be written by trusted Edge Functions/webhook handlers using the service role key.
insert into public.admin_settings(key,value) values ('commission_rate','{"percent":5.5}'::jsonb),('payment_mode','{"mode":"demo"}'::jsonb);
