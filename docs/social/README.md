# Instagram: @withintheoracle

Posts go out automatically through Meta's official Instagram API. No password is stored anywhere.

## How it works
- **Queue:** `public.social_posts` in Supabase. Each row: when to post (`scheduled_at`), the image (`https://withinoracle.app/social/<date>.jpg`), and the caption. Status: `queued` → `published` (with its `permalink`), or `held` (paused by hand), `failed` (after 3 tries, with `error`), `expired` (missed its moment by 18 hours; dated posts are not published late).
- **Publisher:** the `instagram-publish` edge function, run every 15 minutes by `pg_cron`. Each run posts at most one due post, sends approved comment replies, collects new comments into `social_comments`, and refreshes likes, comments, reach, and saves on recent posts.
- **Social manager:** a daily agent that follows `docs/social/MANAGER.md`: replies to comments, keeps 10+ days queued, reports weekly.
- **Token:** pasted once as the `INSTAGRAM_TOKEN` secret, then kept in `public.social_auth` and refreshed weekly, so it does not expire.
- **Content:** `docs/social/queue-<month>.json` (text) → `docs/social/render.mjs` (images, 1080×1350 JPEG into `app/public/social/`) → rows in `social_posts`. Every caption passes the content lint. `preview-<month>.png` shows the month at a glance.

## Pause or change a post
- Pause one: set its `status` to `held`. Pause everything: `select cron.unschedule('instagram-publish');`
- Change a caption: edit `caption` on a `queued` row.

## One-time setup (Maggie, about 15 minutes)
1. **Instagram app:** Settings → *Account type and tools* → *Switch to professional account* → Creator.
2. **developers.facebook.com** → *My Apps* → *Create app* → use case **"Manage messaging & content on Instagram"** → name it "Within publisher".
3. In the app: **Instagram → API setup with Instagram login → Generate access tokens → Add account** → log in as **withintheoracle** and allow. If it asks for a tester invite: *App roles → Roles → Add people → Instagram tester → withintheoracle*, then in Instagram *Settings → Website permissions → Apps and websites → Tester invites → Accept*.
4. Copy the token it shows and paste it in **Supabase → Edge Functions → Secrets** as `INSTAGRAM_TOKEN`. Never paste it in chat.

The first post goes out at the next scheduled time after the token is saved.
