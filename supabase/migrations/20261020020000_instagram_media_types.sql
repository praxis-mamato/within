-- Reels, carousels and stories for @withintheoracle, with their own numbers.
alter table public.social_posts
  add column if not exists media_type text not null default 'IMAGE' check (media_type in ('IMAGE', 'REELS', 'CAROUSEL', 'STORIES')),
  add column if not exists video_url text,
  add column if not exists cover_url text,
  add column if not exists children jsonb,
  add column if not exists plays integer,
  add column if not exists shares integer,
  add column if not exists avg_watch_ms integer;
alter table public.social_posts alter column image_url drop not null, alter column caption drop not null;
alter table public.social_posts drop constraint if exists social_posts_scheduled_at_key;
create unique index if not exists social_posts_slot on public.social_posts (scheduled_at, media_type);
