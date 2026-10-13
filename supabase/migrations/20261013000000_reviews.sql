-- Reviews people write in the app. Anyone can submit; nothing is shown until the owner sets
-- approved = true (Supabase → Table editor → reviews), and only if the writer agreed to show it.
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 10 and 600),
  name text check (char_length(name) <= 40),
  consent_public boolean not null default false,
  free_access boolean not null default false,
  source text not null default 'web' check (source in ('web', 'android')),
  approved boolean not null default false
);
alter table public.reviews enable row level security;
create policy "anyone can submit a review for approval" on public.reviews
  for insert to anon, authenticated with check (approved = false);
create policy "approved public reviews are readable" on public.reviews
  for select to anon, authenticated using (approved and consent_public);
