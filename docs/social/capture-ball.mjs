// Captures the app's own crystal ball (the Oracle board) with a word inside, one image per queued post.
// Needs the built app served locally: `cd app && npm run build && npx vite preview --port 4173`.
// Usage: node docs/social/capture-ball.mjs docs/social/queue-2026-10.json docs/social/balls
import { mkdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { openBoard, shootBall } from './ball.mjs';

const [queueFile, outDir] = process.argv.slice(2);
const queue = JSON.parse(readFileSync(queueFile, 'utf8')).filter((p) => p.orb);
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const board = await openBoard(browser);
for (const p of queue) {
  await shootBall(board, p.orb, `${outDir}/${p.date}.png`);
  console.log('ball', p.date, p.orb);
}
await browser.close();
