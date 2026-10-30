-- Gift memberships: a one-time $100 payment buys one single-use code worth a year of full access.
-- The code is redeemed through the existing redeem-code function (an access code, 365 days, one use).
-- Created by the stripe-webhook when a gift checkout is paid; the buyer can read their own rows.
create table if not exists public.gifts (
  stripe_session_id text primary key,
  buyer_id uuid not null references auth.users (id) on delete cascade,
  code text not null,
  amount integer not null,
  created_at timestamptz not null default now()
);
alter table public.gifts enable row level security;
drop policy if exists "buyer reads own gifts" on public.gifts;
create policy "buyer reads own gifts" on public.gifts for select using (auth.uid() = buyer_id);
