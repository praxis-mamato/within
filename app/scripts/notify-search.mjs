/**
 * Tells search engines the site changed. Runs in GitHub Actions after each push (search-notify.yml).
 * 1. Waits until Cloudflare is serving today's sitemap.
 * 2. IndexNow: notifies Bing, Yahoo, DuckDuckGo, Yandex, Seznam and Naver of every URL (no account needed;
 *    the key file in public/ proves we own the site).
 * 3. Google: resubmits the sitemap through the Search Console API, if GSC_SERVICE_ACCOUNT holds a
 *    service account's JSON key that was added as an Owner of the Search Console property.
 */
import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../.env.production', import.meta.url), 'utf8');
const SITE = (/^VITE_SITE_URL=(.+)$/m.exec(env)?.[1] ?? '').trim().replace(/\/?$/, '/');
const INDEXNOW_KEY = 'f064ef4c5ba58ab0b726e13ede8eddb3';
const today = new Date().toISOString().slice(0, 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function liveSitemap() {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`${SITE}sitemap.xml`, { headers: { 'cache-control': 'no-cache' } });
      const xml = await res.text();
      if (res.ok && xml.includes(`<lastmod>${today}</lastmod>`)) return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    } catch {
      // not deployed yet
    }
    console.log('Waiting for Cloudflare to serve the new sitemap…');
    await sleep(30000);
  }
  throw new Error(`The live sitemap at ${SITE}sitemap.xml never showed today's date. Check the Cloudflare deployment.`);
}

async function indexNow(urls) {
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: new URL(SITE).host, key: INDEXNOW_KEY, keyLocation: `${SITE}${INDEXNOW_KEY}.txt`, urlList: urls }),
  });
  console.log(`IndexNow: ${res.status} for ${urls.length} URLs`);
  if (res.status >= 400) throw new Error(`IndexNow rejected the submission: ${res.status} ${await res.text()}`);
}

async function googleToken(sa) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/webmasters', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
  const signature = createSign('RSA-SHA256').update(unsigned).sign(sa.private_key, 'base64url');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${signature}` }),
  });
  if (!res.ok) throw new Error(`Google sign-in failed: ${res.status}`);
  return (await res.json()).access_token;
}

async function googleSitemap() {
  const raw = process.env.GSC_SERVICE_ACCOUNT;
  if (!raw) return console.log('Google: skipped (no GSC_SERVICE_ACCOUNT secret yet).');
  const token = await googleToken(JSON.parse(raw));
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/sitemaps/${encodeURIComponent(`${SITE}sitemap.xml`)}`;
  const res = await fetch(url, { method: 'PUT', headers: { authorization: `Bearer ${token}` } });
  console.log(`Google: sitemap resubmitted (${res.status})`);
  if (!res.ok) throw new Error(`Google refused the sitemap: ${res.status} ${await res.text()}. Is the service account an Owner in Search Console?`);
}

const urls = await liveSitemap();
await indexNow(urls);
await googleSitemap();
