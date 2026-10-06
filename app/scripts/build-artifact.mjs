// Builds a single self-contained HTML file for publishing as a hosted page.
// The host wraps the file in its own document skeleton, so this emits only
// the title, font link, inlined CSS, root element, and inlined JS.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const out = 'dist-artifact';
execSync(`npx vite build --mode artifact --outDir ${out} --emptyOutDir`, { stdio: 'inherit' });

const assets = join(out, 'assets');
const files = readdirSync(assets);
const css = files.filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(assets, f), 'utf8')).join('\n');
const js = files.filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(assets, f), 'utf8')).join('\n');
const html = readFileSync(join(out, 'index.html'), 'utf8');
const fonts = html.match(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>/)?.[0] ?? '';

const page = `<title>Within Prototype</title>
<meta name="robots" content="noindex" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
${fonts}
<style>${css}</style>
<div id="root"></div>
<script type="module">${js.replaceAll('</script', '<\\/script')}</script>
`;
writeFileSync(join(out, 'within-prototype.html'), page);
console.log(`wrote ${out}/within-prototype.html (${(page.length / 1024).toFixed(0)} KB)`);
