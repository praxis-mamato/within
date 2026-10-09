-- Sessions with a human astrologer. A row is written when checkout starts and marked paid by the
-- Stripe webhook. The intake (questions, availability, and birth details only when the person ticks
-- the box to share them) is what the astrologer needs to prepare; people can read their own rows.
create table if not exists public.astrologer_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text,
  package_id text not null,
  amount integer not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'scheduled', 'completed', 'refunded', 'cancelled')),
  questions text,
  availability text,
  timezone text,
  birth_details text,
  stripe_session_id text unique,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
alter table public.astrologer_bookings enable row level security;
drop policy if exists "read own bookings" on public.astrologer_bookings;
create policy "read own bookings" on public.astrologer_bookings for select using (auth.uid() = user_id);
create index if not exists astrologer_bookings_status on public.astrologer_bookings (status, created_at desc);
