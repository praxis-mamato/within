-- Clients choose their first live-reading time in the app. Readings are Mon, Wed and Fri at 12, 1 and
-- 2pm Mountain time. One booking per slot; the admin bot blocks slots that clash with the calendar.
alter table public.astrologer_bookings add column if not exists first_slot timestamptz, add column if not exists calendar_event_id text;
create unique index if not exists astrologer_bookings_one_per_slot on public.astrologer_bookings (first_slot) where first_slot is not null and status in ('paid', 'scheduled');
create table if not exists public.reading_blocks (slot timestamptz primary key, reason text not null default 'busy', created_at timestamptz not null default now());
alter table public.reading_blocks enable row level security;

create or replace function public.taken_reading_slots() returns setof timestamptz language sql stable security definer set search_path = public as $$
  select first_slot from astrologer_bookings where first_slot > now() and status in ('paid', 'scheduled')
  union select slot from reading_blocks where slot > now()
$$;

create or replace function public.pick_reading_slot(p_booking uuid, p_slot timestamptz) returns text language plpgsql security definer set search_path = public as $$
declare
  local_t timestamp := p_slot at time zone 'America/Denver';
begin
  if not exists (select 1 from astrologer_bookings where id = p_booking and user_id = auth.uid() and status = 'paid' and first_slot is null) then
    return 'not_allowed';
  end if;
  if extract(isodow from local_t) not in (1, 3, 5) or extract(hour from local_t) not in (12, 13, 14)
     or extract(minute from local_t) <> 0 or extract(second from local_t) <> 0
     or p_slot < now() + interval '20 hours' or p_slot > now() + interval '29 days' then
    return 'invalid';
  end if;
  if exists (select 1 from taken_reading_slots() t where t = p_slot) then
    return 'taken';
  end if;
  update astrologer_bookings set first_slot = p_slot where id = p_booking;
  return 'ok';
exception when unique_violation then
  return 'taken';
end
$$;

revoke all on function public.pick_reading_slot(uuid, timestamptz) from public, anon;
grant execute on function public.pick_reading_slot(uuid, timestamptz) to authenticated;
revoke all on function public.taken_reading_slots() from public;
grant execute on function public.taken_reading_slots() to anon, authenticated;
