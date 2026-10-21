// Runs @withintheoracle through Meta's official Instagram API (Instagram Login), every 15 minutes by pg_cron
// with the key stored in social_auth: publishes the next due post, sends the replies the social manager
// approved, collects new comments, and refreshes each recent post's likes, comments, reach, and saves.
// The access token comes from the INSTAGRAM_TOKEN secret the first time, then lives in social_auth and is
// refreshed weekly so it does not expire. Nothing here logs or returns the token.
import { admin, json } from '../_shared/clients.ts';

const GRAPH = 'https://graph.instagram.com/v21.0';
const DAY = 86400000;
/** A dated post that missed its moment by more than this is not published late ("TODAY · OCT 23" on Oct 25). */
const STALE_MS = 18 * 3600000;

// The token may have been saved as INSTAGRAM_TOKEN or with other spacing or capitals.
const envToken = Object.entries(Deno.env.toObject()).find(([n, v]) => /instagram/i.test(n) && /^(IG|EAA)\w{20,}/.test(v.trim()))?.[1]?.trim();

const clean = (s: string, token: string) => s.split(token).join('[token]').slice(0, 500);

async function graph(path: string, token: string, init?: RequestInit & { form?: Record<string, string> }) {
  const url = new URL(`${path.startsWith('http') ? '' : GRAPH}${path}`);
  let body: URLSearchParams | undefined;
  if (init?.form) body = new URLSearchParams({ ...init.form, access_token: token });
  else url.searchParams.set('access_token', token);
  const res = await fetch(url, { method: body ? 'POST' : 'GET', body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(clean(data.error?.message ?? `HTTP ${res.status}`, token));
  return data;
}

Deno.serve(async (req) => {
  const { data: auth } = await admin.from('social_auth').select('*').eq('id', 1).maybeSingle();
  if (!auth || req.headers.get('x-cron-key') !== auth.cron_key) return json({ error: 'Not allowed.' }, 403);

  let token: string | undefined = auth.token ?? envToken;
  if (!token) return json({ status: 'waiting for the Instagram token' });

  // Keep the 60-day token alive: refresh weekly (Instagram allows it once a token is a day old).
  if (!auth.refreshed_at || Date.now() - new Date(auth.refreshed_at).getTime() > 7 * DAY) {
    try {
      const r = await graph(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token`, token);
      if (r.access_token) token = r.access_token;
      await admin.from('social_auth').update({ token, refreshed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', 1);
    } catch (e) {
      // Too new to refresh, or already refreshed: keep using it, and store it the first time.
      if (!auth.token) await admin.from('social_auth').update({ token, updated_at: new Date().toISOString() }).eq('id', 1);
      console.warn('token refresh skipped:', e instanceof Error ? e.message : e);
    }
  }

  let igUser = auth.ig_user_id as string | null;
  if (!igUser) {
    try {
      const me = await graph('/me?fields=user_id,username', token);
      igUser = me.user_id ?? me.id;
      await admin.from('social_auth').update({ ig_user_id: igUser, username: me.username ?? null, updated_at: new Date().toISOString() }).eq('id', 1);
    } catch (e) {
      return json({ error: `Could not read the Instagram account: ${e instanceof Error ? e.message : e}` }, 502);
    }
  }

  const report: Record<string, unknown> = { account: auth.username ?? igUser };
  const tok = token;

  // 1. Publish the next due post. Posts that missed their moment are set aside, not published late.
  await admin.from('social_posts').update({ status: 'expired' }).eq('status', 'queued').is('container_id', null).lt('scheduled_at', new Date(Date.now() - STALE_MS).toISOString());
  // Every day gets a reel (from 16:30 UTC) and a feed post (from 23:00 UTC). If the queue has none for the day,
  // or it failed, the next held evergreen one (evergreen = true) goes out instead.
  const now = new Date();
  const dayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  for (const [kind, hours] of [['REELS', 16.5], ['IMAGE', 23]] as const) {
    if (now.getTime() < dayStart + hours * 3600000) continue;
    const { count } = await admin
      .from('social_posts')
      .select('id', { count: 'exact', head: true })
      .eq('media_type', kind)
      .in('status', ['queued', 'publishing', 'published'])
      .gte('scheduled_at', new Date(dayStart).toISOString())
      .lt('scheduled_at', new Date(dayStart + DAY).toISOString());
    if (count) continue;
    const { data: spare } = await admin.from('social_posts').select('id').eq('media_type', kind).eq('status', 'held').eq('evergreen', true).order('id').limit(1).maybeSingle();
    if (spare) {
      await admin.from('social_posts').update({ status: 'queued', scheduled_at: now.toISOString() }).eq('id', spare.id);
      report[`evergreen_${kind.toLowerCase()}`] = spare.id;
    } else report[`no_${kind.toLowerCase()}_today`] = true;
  }
  const { data: post } = await admin.from('social_posts').select('*').eq('status', 'queued').lte('scheduled_at', new Date().toISOString()).order('scheduled_at').limit(1).maybeSingle();
  if (post) {
    await admin.from('social_posts').update({ status: 'publishing' }).eq('id', post.id);
    try {
      let container = post.container_id as string | null;
      if (!container) {
        const kind = post.media_type ?? 'IMAGE';
        const form: Record<string, string> = {};
        if (kind === 'REELS') Object.assign(form, { media_type: 'REELS', video_url: post.video_url, share_to_feed: 'true', ...(post.cover_url ? { cover_url: post.cover_url } : {}) });
        else if (kind === 'STORIES') Object.assign(form, { media_type: 'STORIES', ...(post.video_url ? { video_url: post.video_url } : { image_url: post.image_url }) });
        else if (kind === 'CAROUSEL') {
          // Each slide is its own container first; the carousel holds them (up to 10).
          const ids: string[] = [];
          for (const url of (post.children ?? []).slice(0, 10)) ids.push((await graph(`/${igUser}/media`, tok, { form: { image_url: url, is_carousel_item: 'true' } })).id);
          Object.assign(form, { media_type: 'CAROUSEL', children: ids.join(',') });
        } else form.image_url = post.image_url;
        if (kind !== 'STORIES' && post.caption) form.caption = post.caption;
        container = (await graph(`/${igUser}/media`, tok, { form })).id as string;
        await admin.from('social_posts').update({ container_id: container }).eq('id', post.id);
      }
      // Instagram fetches and processes the media. Video can take minutes: if it isn't ready, try again next run.
      let ready = false;
      for (let i = 0; i < 6; i++) {
        const st = await graph(`/${container}?fields=status_code`, tok);
        if (st.status_code === 'FINISHED') {
          ready = true;
          break;
        }
        if (st.status_code === 'ERROR' || st.status_code === 'EXPIRED') {
          await admin.from('social_posts').update({ container_id: null }).eq('id', post.id);
          throw new Error(`Instagram could not process the media (${st.status_code}).`);
        }
        await new Promise((r) => setTimeout(r, 4000));
      }
      if (!ready) {
        await admin.from('social_posts').update({ status: 'queued' }).eq('id', post.id);
        report.processing = post.id;
      } else {
        const published = await graph(`/${igUser}/media_publish`, tok, { form: { creation_id: container } });
        const info = await graph(`/${published.id}?fields=permalink`, tok).catch(() => ({}));
        await admin.from('social_posts').update({ status: 'published', media_id: published.id, permalink: info.permalink ?? null, published_at: new Date().toISOString(), error: null }).eq('id', post.id);
        report.published = info.permalink ?? published.id;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await admin.from('social_posts').update({ status: post.attempts + 1 >= 3 ? 'failed' : 'queued', attempts: post.attempts + 1, error: msg }).eq('id', post.id);
      console.error('instagram publish failed:', msg);
      report.publish_error = msg;
    }
  }

  // 2. Send the replies the social manager approved (a few per run).
  const { data: replies } = await admin.from('social_comments').select('id, reply').eq('reply_status', 'approved').not('reply', 'is', null).limit(5);
  let sent = 0;
  for (const c of replies ?? []) {
    try {
      const r = await graph(`/${c.id}/replies`, tok, { form: { message: c.reply } });
      await admin.from('social_comments').update({ reply_status: 'sent', reply_id: r.id ?? null, replied_at: new Date().toISOString(), error: null }).eq('id', c.id);
      sent++;
    } catch (e) {
      await admin.from('social_comments').update({ reply_status: 'failed', error: e instanceof Error ? e.message : String(e) }).eq('id', c.id);
    }
  }
  report.replies_sent = sent;

  // 3. Collect new comments on posts from the last three weeks (not our own).
  const since = new Date(Date.now() - 21 * DAY).toISOString();
  const { data: recent } = await admin.from('social_posts').select('id, media_id, media_type, metrics_at').eq('status', 'published').gte('published_at', since);
  let fresh = 0;
  for (const p of recent ?? []) {
    if (!p.media_id) continue;
    try {
      const list = await graph(`/${p.media_id}/comments?fields=id,text,username,timestamp&limit=50`, tok);
      const rows = (list.data ?? [])
        .filter((c: { username?: string }) => c.username !== auth.username)
        .map((c: { id: string; text?: string; username?: string; timestamp?: string }) => ({ id: c.id, media_id: p.media_id, username: c.username ?? null, text: c.text ?? '', commented_at: c.timestamp ?? null }));
      if (rows.length) {
        const { data: added } = await admin.from('social_comments').upsert(rows, { onConflict: 'id', ignoreDuplicates: true }).select('id');
        fresh += added?.length ?? 0;
      }
    } catch (e) {
      console.warn('comment sync skipped:', e instanceof Error ? e.message : e);
    }
    // 4. Refresh how the post is doing, every six hours.
    if (!p.metrics_at || Date.now() - new Date(p.metrics_at).getTime() > 6 * 3600000) {
      try {
        const m = await graph(`/${p.media_id}?fields=like_count,comments_count`, tok);
        const metrics = p.media_type === 'REELS' ? 'reach,saved,shares,views,ig_reels_avg_watch_time' : p.media_type === 'STORIES' ? 'reach,shares,views' : 'reach,saved,shares,views';
        const ins = await graph(`/${p.media_id}/insights?metric=${metrics}`, tok).catch(() => ({ data: [] }));
        const val = (name: string) => ins.data?.find((x: { name: string }) => x.name === name)?.values?.[0]?.value ?? null;
        await admin.from('social_posts').update({ likes: m.like_count ?? null, comments: m.comments_count ?? null, reach: val('reach'), saves: val('saved'), shares: val('shares'), plays: val('views'), avg_watch_ms: val('ig_reels_avg_watch_time'), metrics_at: new Date().toISOString() }).eq('id', p.id);
      } catch (e) {
        console.warn('metrics skipped:', e instanceof Error ? e.message : e);
      }
    }
  }
  report.new_comments = fresh;
  return json(report);
});
