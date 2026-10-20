// The app's crystal ball (the Oracle board), photographed with any words inside.
// Needs the built app served locally: `cd app && npm run build && npx vite preview --port 4173`.

/** Opens the app with a sample chart and returns the board, ready for `shootBall`. */
export async function openBoard(browser) {
  const page = await browser.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
  page.setDefaultTimeout(15000);
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Begin' }).click();
  await page.locator('#ob-date').fill('1990-07-15');
  await page.locator('input[name=ob-tp]').first().check({ force: true });
  await page.locator('#ob-time').fill('09:30');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('#intro-q').fill('What am I moving through this year?');
  await page.getByRole('button', { name: 'Ask the Oracle' }).click();
  await page.waitForTimeout(9000);
  return page.locator('.oracle-board').first();
}

/** Writes `text` (lines split by `|`) inside the ball and saves a PNG. */
export async function shootBall(board, text, path) {
  await board.evaluate((el, lines) => {
    // The planets show today's sky, which would not match a post about another date: keep only the signs.
    el.querySelectorAll('.ob-planchette, .ob-spot[aria-label$=" today"]').forEach((n) => (n.style.display = 'none'));
    const overlay = el.querySelector('.ob-overlay');
    const texts = [...overlay.querySelectorAll('text')];
    const first = texts[0];
    texts.slice(1).forEach((t) => t.remove());
    const baseY = Number(first.getAttribute('y')) + (first.dataset.shift ? Number(first.dataset.shift) : 0);
    const shift = (lines.length - 1) * 9;
    first.dataset.shift = String(shift);
    lines.forEach((line, i) => {
      const t = i === 0 ? first : first.cloneNode();
      t.textContent = line;
      t.setAttribute('y', String(baseY - shift + i * 18));
      t.setAttribute('font-size', lines.some((l) => l.length > 9) ? '12.5' : '15');
      t.classList.remove('ob-reveal', 'ob-breathe');
      t.style.opacity = '1';
      if (i > 0) overlay.appendChild(t);
    });
  }, text.split('|'));
  await board.page().waitForTimeout(300);
  await board.screenshot({ path });
}
