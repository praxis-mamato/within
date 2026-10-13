-- Affiliate links (?ref=code). Partners are added by the owner; each paid invoice in a referred
-- member's first year earns the partner share_pct of it. Readable only with the service role.
create table if not exists public.affiliates (
  code text primary key check (code ~ '^[a-z0-9-]{2,32}$'),
  name text not null check (char_length(name) <= 80),
  share_pct integer not null default 30 check (share_pct between 0 and 50),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.affiliate_earnings (
  invoice_id text primary key,
  affiliate_code text not null references public.affiliates (code),
  subscription_id text not null,
  amount_paid integer not null,
  commission integer not null,
  paid_at timestamptz not null,
  payout_id text,
  created_at timestamptz not null default now()
);
alter table public.affiliates enable row level security;
alter table public.affiliate_earnings enable row level security;
