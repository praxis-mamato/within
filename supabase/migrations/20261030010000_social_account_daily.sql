-- Instagram: the account's numbers per day (for the social manager's daily report), and optional tags
-- on posts (people tagged in the media, and collab invites), filled only for verified accounts.
create table if not exists public.social_account_daily (
  day date primary key,
  followers integer,
  following integer,
  media integer,
  reach integer,
  profile_views integer,
  follows integer,
  website_clicks integer,
  accounts_engaged integer,
  updated_at timestamptz not null default now()
);
alter table public.social_account_daily enable row level security;

alter table public.social_posts add column if not exists user_tags jsonb;
alter table public.social_posts add column if not exists collaborators text[];
