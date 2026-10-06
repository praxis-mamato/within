-- Subscription status: the only per-person record Within keeps on its servers
-- besides the sign-in identity. No birth data, journal, or readings live here.
create table if not exists public.entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status text not null default 'none'
    check (status in ('none', 'active', 'trialing', 'past_due', 'canceled')),
  plan text check (plan in ('monthly', 'yearly')),
  source text check (source in ('stripe', 'app_store', 'play_store')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.entitlements enable row level security;

-- People can read their own status. Only server functions (service role) can write.
create policy "read own entitlement" on public.entitlements
  for select to authenticated using ((select auth.uid()) = user_id);

comment on table public.entitlements is 'Subscription status per user. Written only by the stripe-webhook and create-checkout functions.';
