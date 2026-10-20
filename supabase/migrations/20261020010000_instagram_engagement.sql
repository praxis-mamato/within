-- Comments on @withintheoracle posts, and the replies the social manager writes for them.
create table if not exists public.social_comments (
  id text primary key,
  media_id text not null,
  username text,
  text text not null,
  commented_at timestamptz,
  reply text check (reply is null or char_length(reply) <= 1000),
  reply_status text not null default 'new' check (reply_status in ('new', 'approved', 'sent', 'skipped', 'failed')),
  reply_id text,
  replied_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);
alter table public.social_comments enable row level security;
create index if not exists social_comments_status on public.social_comments (reply_status);

-- How each published post performed (refreshed by the publisher).
alter table public.social_posts add column if not exists likes int;
alter table public.social_posts add column if not exists comments int;
alter table public.social_posts add column if not exists reach int;
alter table public.social_posts add column if not exists saves int;
alter table public.social_posts add column if not exists metrics_at timestamptz;
