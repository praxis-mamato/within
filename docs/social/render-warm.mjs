// Warm "paper and line drawing" look (Maggie, Nov 23: "the graphics on social need to change").
// Usage: node docs/social/render-warm.mjs <posts.json> <outDir>
// Each post: { file, format: "feed" (1080×1350) | "story" (1080×1920), note, title, lines[], art: "fullmoon" }
import { readFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const [file, outDir] = process.argv.slice(2);
const posts = JSON.parse(readFileSync(file, 'utf8'));
mkdirSync(outDir, { recursive: true });
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const C = { paper: '#F4ECDF', ink: '#2A2630', soft: '#6B5F57', clay: '#C2603A', dusk: '#3E4E78', moon: '#FBF6EC' };
const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Caveat:wght@500;600&family=DM+Sans:wght@400;500&display=block" rel="stylesheet">`;

// A hand-drawn feel: a wobble filter on simple strokes.
const ART = {
  fullmoon: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 400 400">
  <defs><filter id="w"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="7"/></filter></defs>
  <g filter="url(#w)" fill="none" stroke="${C.ink}" stroke-width="4" stroke-linecap="round">
    <circle cx="200" cy="200" r="150" fill="${C.moon}"/>
    <circle cx="150" cy="150" r="26" fill="#EBE1CF" stroke-width="3"/>
    <circle cx="245" cy="135" r="13" fill="#EBE1CF" stroke-width="3"/>
    <circle cx="232" cy="238" r="34" fill="#EBE1CF" stroke-width="3"/>
    <circle cx="145" cy="255" r="11" fill="#EBE1CF" stroke-width="3"/>
    <circle cx="285" cy="200" r="8" fill="#EBE1CF" stroke-width="3"/>
    <path d="M30 70 l14 0 M37 63 l0 14" stroke="${C.clay}"/>
    <path d="M350 330 l12 0 M356 324 l0 12" stroke="${C.clay}"/>
    <path d="M360 60 l10 0 M365 55 l0 10" stroke="${C.dusk}"/>
    <path d="M40 330 q20 -8 34 6" stroke="${C.dusk}" stroke-width="3"/>
  </g></svg>`,
};

const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
for (const p of posts) {
  const story = p.format === 'story';
  const W = 1080, H = story ? 1920 : 1350, art = story ? 640 : 520;
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.setContent(`<html><head>${FONTS}</head>
<body style="margin:0;width:${W}px;height:${H}px;overflow:hidden;background:${C.paper};color:${C.ink};font-family:'DM Sans',sans-serif;position:relative">
<div style="position:absolute;inset:0;opacity:.35;background-image:radial-gradient(#00000014 1px,transparent 1px);background-size:6px 6px"></div>
<div style="position:absolute;left:0;right:0;top:${story ? 230 : 90}px;text-align:center">
  <div style="font-family:Caveat,cursive;font-size:${story ? 64 : 54}px;color:${C.clay};transform:rotate(-3deg)">${esc(p.note)}</div>
  <div style="margin-top:${story ? 30 : 14}px">${ART[p.art](art)}</div>
  <div style="margin:${story ? 50 : 26}px 90px 0;font-family:Fraunces,serif;font-weight:600;font-size:${story ? 104 : 92}px;line-height:1.02;letter-spacing:-.01em">${esc(p.title)}</div>
  ${p.lines.map((l, i) => `<p style="margin:${i ? 14 : 26}px 110px 0;font-size:${story ? 42 : 36}px;line-height:1.38;color:${i ? C.dusk : C.soft}">${esc(l)}</p>`).join('')}
</div>
<div style="position:absolute;left:0;right:0;bottom:${story ? 140 : 54}px;text-align:center;font-family:Fraunces,serif;font-size:30px;color:${C.soft}">within <span style="color:${C.clay}">·</span> withinoracle.app</div>
</body></html>`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/${p.file}.jpg`, type: 'jpeg', quality: 90 });
  await page.close();
  console.log('rendered', p.file);
}
await browser.close();
