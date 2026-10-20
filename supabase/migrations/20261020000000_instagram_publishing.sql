-- Instagram (@withintheoracle) publishing: a queue of posts and the token, both service-role only.
-- The instagram-publish function runs every 15 minutes (pg_cron + pg_net) and posts what is due.
create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists public.social_posts (
  id bigint generated always as identity primary key,
  scheduled_at timestamptz not null unique,
  image_url text not null check (image_url like 'https://%'),
  caption text not null check (char_length(caption) <= 2200),
  status text not null default 'queued' check (status in ('queued', 'publishing', 'published', 'failed', 'held', 'expired')),
  container_id text,
  media_id text,
  permalink text,
  error text,
  attempts int not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.social_posts enable row level security;

create table if not exists public.social_auth (
  id int primary key default 1 check (id = 1),
  token text,
  refreshed_at timestamptz,
  ig_user_id text,
  username text,
  cron_key text not null default encode(gen_random_bytes(24), 'hex'),
  updated_at timestamptz not null default now()
);
alter table public.social_auth enable row level security;
insert into public.social_auth (id) values (1) on conflict (id) do nothing;

select cron.schedule('instagram-publish', '*/15 * * * *', $job$
  select net.http_post(
    url := 'https://lykmusmsfwvaeqxtsbrc.supabase.co/functions/v1/instagram-publish',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-key', (select cron_key from public.social_auth where id = 1)),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
$job$);
