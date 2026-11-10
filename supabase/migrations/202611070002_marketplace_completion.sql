-- Incremental completion layer for conversations, agreements, delivery, evidence, refunds and auditability.
alter type public.booking_status add value if not exists 'request_submitted';
alter type public.booking_status add value if not exists 'awaiting_owner';
alter type public.booking_status add value if not exists 'accepted';
alter type public.booking_status add value if not exists 'awaiting_payment';
alter type public.booking_status add value if not exists 'payment_completed';
alter type public.booking_status add value if not exists 'handover_pending';
alter type public.booking_status add value if not exists 'handover_completed';
alter type public.booking_status add value if not exists 'rental_active';
alter type public.booking_status add value if not exists 'return_pending';
alter type public.booking_status add value if not exists 'return_completed';
alter type public.booking_status add value if not exists 'deposit_refund_pending';
alter type public.booking_status add value if not exists 'deposit_refunded';

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.user_role not null,
  granted_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.availability (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  starts_on date not null,
  ends_on date not null,
  available boolean not null default true,
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  check (ends_on > starts_on)
);
create index availability_listing_dates_idx on public.availability(listing_id, starts_on, ends_on);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  subject text check (char_length(subject) <= 200),
  created_by uuid not null references public.profiles(id),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create table public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
alter table public.messages add column conversation_id uuid references public.conversations(id) on delete cascade;
alter table public.messages add column attachment_path text;
alter table public.messages add column attachment_type text check (attachment_type is null or attachment_type in ('image/jpeg','image/png','image/webp','application/pdf'));
create index messages_conversation_idx on public.messages(conversation_id, created_at);

create table public.booking_agreements (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  version int not null,
  proposed_by uuid not null references public.profiles(id),
  terms jsonb not null,
  renter_accepted_at timestamptz,
  owner_accepted_at timestamptz,
  superseded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (booking_id, version)
);
create table public.booking_events (
  id bigint generated always as identity primary key,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  from_status public.booking_status,
  to_status public.booking_status not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index booking_events_timeline_idx on public.booking_events(booking_id, created_at);

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  method text not null check (method in ('owner_delivery','renter_pickup','meeting_point')),
  address_text text,
  scheduled_at timestamptz,
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  handover_status text not null default 'pending' check (handover_status in ('pending','owner_confirmed','renter_confirmed','completed')),
  return_status text not null default 'pending' check (return_status in ('pending','owner_confirmed','renter_confirmed','completed')),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.item_condition_records (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  passport_id uuid not null references public.item_passports(id) on delete cascade,
  phase text not null check (phase in ('handover','return')),
  checklist jsonb not null default '{}',
  notes text check (char_length(notes) <= 3000),
  owner_confirmed_at timestamptz,
  renter_confirmed_at timestamptz,
  verification_code_hash text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (booking_id, phase)
);
create table public.item_condition_media (
  id uuid primary key default gen_random_uuid(),
  condition_record_id uuid not null references public.item_condition_records(id) on delete cascade,
  storage_path text not null,
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp')),
  file_size int not null check (file_size between 1 and 8388608),
  created_at timestamptz not null default now()
);

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id),
  payment_id uuid references public.payments(id),
  kind text not null check (kind in ('rental','deposit','delivery','full')),
  amount numeric(12,2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending','processing','completed','failed','cancelled')),
  provider_refund_id text unique,
  reason text,
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id),
  target_type text not null check (target_type in ('listing','profile','review','message','booking')),
  target_id uuid not null,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  assigned_admin uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  request_id text,
  created_at timestamptz not null default now()
);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id, created_at desc);

create or replace function public.has_role(required_role public.user_role)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.user_roles where user_id=auth.uid() and role=required_role) $$;

create or replace function public.is_conversation_participant(target uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.conversation_participants where conversation_id=target and user_id=auth.uid()) $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  insert into public.profiles(id, full_name) values (new.id, coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(coalesce(new.email,'İstifadəçi'),'@',1)));
  insert into public.user_roles(user_id, role) values (new.id, 'renter');
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.user_roles enable row level security;
alter table public.availability enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.booking_agreements enable row level security;
alter table public.booking_events enable row level security;
alter table public.deliveries enable row level security;
alter table public.item_condition_records enable row level security;
alter table public.item_condition_media enable row level security;
alter table public.refunds enable row level security;
alter table public.reports enable row level security;
alter table public.audit_logs enable row level security;

create policy "users read own roles" on public.user_roles for select using (user_id=auth.uid() or public.is_admin());
create policy "users enable owner role" on public.user_roles for insert with check (user_id=auth.uid() and role in ('renter','owner'));
create policy "admins manage roles" on public.user_roles for all using (public.is_admin()) with check (public.is_admin());
create policy "availability visible with listing" on public.availability for select using (exists(select 1 from public.listings l where l.id=listing_id and (l.status='active' or l.owner_id=auth.uid() or public.is_admin())));
create policy "owners manage availability" on public.availability for all using (exists(select 1 from public.listings l where l.id=listing_id and (l.owner_id=auth.uid() or public.is_admin()))) with check (exists(select 1 from public.listings l where l.id=listing_id and (l.owner_id=auth.uid() or public.is_admin())));
create policy "participants read conversations" on public.conversations for select using (public.is_conversation_participant(id) or public.is_admin());
create policy "authenticated create conversations" on public.conversations for insert with check (created_by=auth.uid());
create policy "participants read membership" on public.conversation_participants for select using (public.is_conversation_participant(conversation_id) or public.is_admin());
create policy "creator adds participants" on public.conversation_participants for insert with check (exists(select 1 from public.conversations c where c.id=conversation_id and c.created_by=auth.uid()));
create policy "participants read agreements" on public.booking_agreements for select using (public.owns_booking(booking_id) or public.is_admin());
create policy "participants propose agreements" on public.booking_agreements for insert with check (proposed_by=auth.uid() and public.owns_booking(booking_id));
create policy "participants accept agreements" on public.booking_agreements for update using (public.owns_booking(booking_id)) with check (public.owns_booking(booking_id));
create policy "participants read booking events" on public.booking_events for select using (public.owns_booking(booking_id) or public.is_admin());
create policy "participants read delivery" on public.deliveries for select using (public.owns_booking(booking_id) or public.is_admin());
create policy "participants update delivery" on public.deliveries for update using (public.owns_booking(booking_id) or public.is_admin()) with check (public.owns_booking(booking_id) or public.is_admin());
create policy "participants read condition records" on public.item_condition_records for select using (public.owns_booking(booking_id) or public.is_admin());
create policy "participants create condition records" on public.item_condition_records for insert with check (created_by=auth.uid() and public.owns_booking(booking_id));
create policy "participants confirm condition records" on public.item_condition_records for update using (public.owns_booking(booking_id)) with check (public.owns_booking(booking_id));
create policy "participants read condition media" on public.item_condition_media for select using (exists(select 1 from public.item_condition_records r where r.id=condition_record_id and (public.owns_booking(r.booking_id) or public.is_admin())));
create policy "participants add condition media" on public.item_condition_media for insert with check (exists(select 1 from public.item_condition_records r where r.id=condition_record_id and public.owns_booking(r.booking_id)));
create policy "participants read refunds" on public.refunds for select using (public.owns_booking(booking_id) or public.is_admin());
create policy "users create reports" on public.reports for insert with check (reporter_id=auth.uid());
create policy "users read own reports" on public.reports for select using (reporter_id=auth.uid() or public.is_admin());
create policy "admins manage reports" on public.reports for update using (public.is_admin()) with check (public.is_admin());
create policy "admins read audit logs" on public.audit_logs for select using (public.is_admin());

drop policy if exists "message parties read" on public.messages;
drop policy if exists "message sender inserts" on public.messages;
create policy "conversation participants read messages" on public.messages for select using ((conversation_id is not null and public.is_conversation_participant(conversation_id)) or sender_id=auth.uid() or recipient_id=auth.uid() or public.is_admin());
create policy "conversation participants send messages" on public.messages for insert with check (sender_id=auth.uid() and ((conversation_id is not null and public.is_conversation_participant(conversation_id)) or public.owns_booking(booking_id)));

-- Private buckets: signed URLs should be used for participant-only evidence and chat attachments.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
  ('avatars','avatars',true,5242880,array['image/jpeg','image/png','image/webp']),
  ('listing-images','listing-images',true,8388608,array['image/jpeg','image/png','image/webp']),
  ('message-attachments','message-attachments',false,8388608,array['image/jpeg','image/png','image/webp','application/pdf']),
  ('condition-evidence','condition-evidence',false,8388608,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;

create policy "users manage own avatar" on storage.objects for all to authenticated using (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text) with check (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "owners upload listing images" on storage.objects for insert to authenticated with check (bucket_id='listing-images' and exists(select 1 from public.listings l where l.id::text=(storage.foldername(name))[1] and l.owner_id=auth.uid()));
create policy "owners manage listing images" on storage.objects for delete to authenticated using (bucket_id='listing-images' and exists(select 1 from public.listings l where l.id::text=(storage.foldername(name))[1] and (l.owner_id=auth.uid() or public.is_admin())));
create policy "participants read chat attachments" on storage.objects for select to authenticated using (bucket_id='message-attachments' and public.is_conversation_participant(((storage.foldername(name))[1])::uuid));
create policy "participants upload chat attachments" on storage.objects for insert to authenticated with check (bucket_id='message-attachments' and public.is_conversation_participant(((storage.foldername(name))[1])::uuid));

-- Refunds, payment status, booking events, audit logs and server notifications intentionally have no client INSERT policy.
-- Trusted Edge Functions/webhook handlers must validate transitions and write them with the service role.
