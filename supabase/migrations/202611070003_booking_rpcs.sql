-- Server-authoritative booking operations. Kept in a separate migration so new enum values are committed first.
create or replace function public.create_booking_request(
  p_listing_id uuid,
  p_starts_on date,
  p_ends_on date,
  p_delivery_fee numeric default 0
) returns uuid
language plpgsql security definer set search_path=public
as $$
declare
  v_listing public.listings%rowtype;
  v_commission_rate numeric;
  v_days int;
  v_rental numeric;
  v_commission numeric;
  v_booking_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_ends_on <= p_starts_on then raise exception 'invalid_date_range'; end if;
  if p_delivery_fee < 0 then raise exception 'invalid_delivery_fee'; end if;

  select * into v_listing from public.listings where id=p_listing_id and status='active' for share;
  if not found then raise exception 'listing_not_available'; end if;
  if v_listing.owner_id=auth.uid() then raise exception 'owner_cannot_rent_own_listing'; end if;

  if exists(select 1 from public.availability a where a.listing_id=p_listing_id and not a.available and daterange(a.starts_on,a.ends_on,'[)') && daterange(p_starts_on,p_ends_on,'[)')) then
    raise exception 'dates_unavailable';
  end if;
  if exists(select 1 from public.bookings b where b.listing_id=p_listing_id and b.status in ('accepted','awaiting_payment','payment_completed','handover_pending','handover_completed','rental_active','return_pending','return_completed','deposit_refund_pending','confirmed','active') and daterange(b.starts_on,b.ends_on,'[)') && daterange(p_starts_on,p_ends_on,'[)')) then
    raise exception 'booking_overlap';
  end if;

  select coalesce((value->>'percent')::numeric,10) into v_commission_rate from public.admin_settings where key='commission_rate';
  v_commission_rate:=coalesce(v_commission_rate,10);
  v_days:=p_ends_on-p_starts_on;
  v_rental:=round(v_listing.daily_price*v_days,2);
  v_commission:=round(v_rental*v_commission_rate/100,2);

  insert into public.bookings(listing_id,renter_id,owner_id,starts_on,ends_on,status,daily_price,rental_amount,commission_rate,commission_amount,deposit_amount,delivery_fee,total_amount)
  values(p_listing_id,auth.uid(),v_listing.owner_id,p_starts_on,p_ends_on,'request_submitted',v_listing.daily_price,v_rental,v_commission_rate,v_commission,v_listing.deposit_amount,p_delivery_fee,v_rental+v_commission+v_listing.deposit_amount+p_delivery_fee)
  returning id into v_booking_id;
  insert into public.booking_events(booking_id,actor_id,to_status,metadata) values(v_booking_id,auth.uid(),'request_submitted',jsonb_build_object('source','create_booking_request'));
  return v_booking_id;
end;
$$;
revoke all on function public.create_booking_request(uuid,date,date,numeric) from public;
grant execute on function public.create_booking_request(uuid,date,date,numeric) to authenticated;

create or replace function public.transition_booking(p_booking_id uuid,p_to_status public.booking_status,p_note text default null)
returns void language plpgsql security definer set search_path=public
as $$
declare v public.bookings%rowtype; v_allowed boolean:=false;
begin
  select * into v from public.bookings where id=p_booking_id for update;
  if not found then raise exception 'booking_not_found'; end if;
  if auth.uid() not in (v.renter_id,v.owner_id) and not public.is_admin() then raise exception 'forbidden'; end if;

  v_allowed:=case
    when v.status in ('pending','request_submitted','awaiting_owner') and p_to_status in ('accepted','rejected','cancelled') then (auth.uid()=v.owner_id or p_to_status='cancelled' or public.is_admin())
    when v.status='accepted' and p_to_status in ('awaiting_payment','cancelled') then true
    when v.status='awaiting_payment' and p_to_status='cancelled' then true
    when v.status='payment_completed' and p_to_status in ('handover_pending','disputed') then true
    when v.status='handover_pending' and p_to_status in ('handover_completed','disputed') then true
    when v.status='handover_completed' and p_to_status in ('rental_active','disputed') then true
    when v.status='rental_active' and p_to_status in ('return_pending','disputed') then true
    when v.status='return_pending' and p_to_status in ('return_completed','disputed') then true
    when v.status='return_completed' and p_to_status in ('deposit_refund_pending','disputed') then true
    when v.status='deposit_refund_pending' and p_to_status in ('deposit_refunded','disputed') then public.is_admin()
    when v.status='deposit_refunded' and p_to_status='completed' then true
    when v.status='disputed' then public.is_admin()
    else false end;
  if not v_allowed then raise exception 'invalid_status_transition'; end if;
  -- paid/refund states are written only by trusted webhook/refund handlers.
  if p_to_status in ('payment_completed','deposit_refunded') and not public.is_admin() then raise exception 'trusted_handler_required'; end if;
  update public.bookings set status=p_to_status,updated_at=now() where id=p_booking_id;
  insert into public.booking_events(booking_id,actor_id,from_status,to_status,metadata) values(p_booking_id,auth.uid(),v.status,p_to_status,jsonb_build_object('note',p_note));
end;
$$;
revoke all on function public.transition_booking(uuid,public.booking_status,text) from public;
grant execute on function public.transition_booking(uuid,public.booking_status,text) to authenticated;
