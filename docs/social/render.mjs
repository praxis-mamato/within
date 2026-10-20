// Renders Instagram images (1080×1350 JPEG, the format Instagram's publishing API needs) for a queue file.
// Usage, with Playwright installed: node docs/social/render.mjs docs/social/queue-2026-10.json app/public/social [balls dir]
// With a balls dir (from capture-ball.mjs), each post leads with the app's crystal ball holding its word.
import { existsSync, readFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const [queueFile, outDir, ballsDir] = process.argv.slice(2);
const queue = JSON.parse(readFileSync(queueFile, 'utf8'));
mkdirSync(outDir, { recursive: true });
// Alchemical element glyphs are missing from most fonts: show the three signs instead.
const GLYPH = { '🜂': '♈︎ ♌︎ ♐︎', '🜃': '♉︎ ♍︎ ♑︎', '🜁': '♊︎ ♎︎ ♒︎', '🜄': '♋︎ ♏︎ ♓︎' };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Source+Sans+3:wght@400;600&display=block" rel="stylesheet">`;
for (const p of queue) {
  const ball = ballsDir && `${ballsDir}/${p.date}.png`;
  if (ball && existsSync(ball)) {
    const img = readFileSync(ball).toString('base64');
    await page.setContent(`<html><head>${FONTS}</head>
<body style="margin:0;width:1080px;height:1350px;overflow:hidden;font-family:'Source Sans 3',sans-serif;background:linear-gradient(180deg,#0b1030 0%,#0d1336 60%,#1a1530 100%);color:#fbf5ea;position:relative">
<img src="data:image/png;base64,${img}" style="position:absolute;left:90px;top:56px;width:900px;height:900px;border-radius:40px;box-shadow:0 30px 80px #0009">
<div style="position:absolute;left:80px;right:80px;top:1000px;text-align:center">
  <div style="color:#d9b26a;letter-spacing:.24em;font-size:26px;font-weight:600">${esc(p.kicker)}</div>
  <div style="margin-top:16px;font-family:'Cormorant Garamond',serif;font-weight:600;font-size:${p.title.length > 26 ? 66 : 80}px;line-height:1.02">${esc(p.title)}</div>
  <p style="margin:18px 0 0;font-size:31px;line-height:1.35;color:#e6dcf0">${esc(p.lines[0])}</p>
</div>
<div style="position:absolute;left:0;right:0;bottom:34px;text-align:center;letter-spacing:.3em;font-size:22px;color:#d9b26a">WITHIN · THE ORACLE · withinoracle.app</div>
</body></html>`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${outDir}/${p.date}.jpg`, type: 'jpeg', quality: 90 });
    console.log('rendered with ball', p.date);
    continue;
  }
  // The text presentation selector keeps symbols like ♏ gold instead of turning into emoji.
  const glyph = GLYPH[p.glyph] ?? `${p.glyph}\uFE0E`;
  await page.setContent(`<html><head><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Source+Sans+3:wght@400;600&display=block" rel="stylesheet"></head>
<body style="margin:0;width:1080px;height:1350px;overflow:hidden;font-family:'Source Sans 3',sans-serif;background:radial-gradient(ellipse at 50% 18%,#22306a 0%,#0d1336 55%,#070a1f 100%);color:#fbf5ea;position:relative">
<div style="position:absolute;inset:0;background-image:radial-gradient(#ffffff66 1.2px,transparent 1.2px),radial-gradient(#ffffff33 1px,transparent 1px);background-size:97px 89px,61px 53px;background-position:0 0,30px 20px;opacity:.5"></div>
<div style="position:absolute;inset:44px;border:2px solid rgba(233,201,135,.55);border-radius:36px"></div>
<div style="position:absolute;left:110px;right:110px;top:150px;text-align:center">
  <div style="font-size:${glyph.length > 2 ? 84 : 120}px;color:#e9c987;letter-spacing:.12em;line-height:1">${esc(glyph)}</div>
  <div style="margin-top:56px;color:#d9b26a;letter-spacing:.26em;font-size:30px;font-weight:600">${esc(p.kicker)}</div>
  <div style="margin-top:34px;font-family:'Cormorant Garamond',serif;font-weight:600;font-size:${p.title.length > 22 ? 104 : 124}px;line-height:1.02">${esc(p.title)}</div>
  <div style="margin:44px auto 0;width:120px;height:2px;background:#e9c987;opacity:.7"></div>
  ${p.lines.map((l) => `<p style="margin:34px 0 0;font-size:40px;line-height:1.38;color:#e6dcf0">${esc(l)}</p>`).join('')}
</div>
<div style="position:absolute;left:0;right:0;bottom:96px;text-align:center;letter-spacing:.3em;font-size:28px;color:#d9b26a">WITHIN · THE ORACLE</div>
<div style="position:absolute;left:0;right:0;bottom:60px;text-align:center;font-size:26px;color:#cdbfdc">withinoracle.app</div>
</body></html>`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outDir}/${p.date}.jpg`, type: 'jpeg', quality: 90 });
  console.log('rendered', p.date);
}
await browser.close();
