-- Evergreen posts: held spares the publisher uses when a day would otherwise have no reel or feed post.
alter table public.social_posts add column if not exists evergreen boolean not null default false;
