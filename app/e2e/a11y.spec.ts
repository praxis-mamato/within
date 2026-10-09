import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Runs axe on every onboarding step and every main screen. Fails on serious or critical
 * WCAG 2.1 A/AA issues. Real-device VoiceOver and TalkBack passes are still needed (PRD §9).
 */
async function audit(page: Page, label: string) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(r.passes.length, `axe ran on ${label}`).toBeGreaterThan(0);
  const bad = r.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${label}: ${v.id} (${v.impact}) ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`);
  return bad;
}

async function onboard(page: Page, found: string[]) {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Welcome to the Oracle…' })).toBeVisible();
  found.push(...(await audit(page, 'intro: welcome')));
  await page.getByRole('button', { name: 'Begin' }).click();
  await expect(page.getByRole('heading', { name: 'Where your story begins' })).toBeVisible();
  found.push(...(await audit(page, 'intro: birth')));
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'What do you seek?' })).toBeVisible();
  found.push(...(await audit(page, 'intro: ask')));
  await page.getByLabel('Your question').fill('What’s my rising sign?');
  await page.getByRole('button', { name: 'Ask the Oracle' }).click();
  await expect(page).toHaveURL(/#\/oracle/);
}

test('onboarding and main screens have no serious accessibility issues', async ({ page }) => {
  const found: string[] = [];
  await onboard(page, found);
  for (const path of SCREENS) {
    await page.goto(`./#${path}`);
    await page.waitForLoadState('networkidle');
    found.push(...(await audit(page, path)));
  }
  expect(found, found.join('\n')).toEqual([]);
});

const SCREENS = ['/oracle', '/astrologer', '/moon-calendar', '/interview', '/today', '/reflection/self', '/reflection/purpose', '/relationships', '/you/chart', '/you/reading', '/growth', '/settings', '/account'];

async function sideways(page: Page) {
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

test('text at 200% never makes a screen scroll sideways', async ({ page }) => {
  await page.goto('./');
  const wide: string[] = [];
  if ((await sideways(page)) > 1) wide.push('onboarding');
  await onboard(page, []);
  for (const path of SCREENS) {
    await page.goto(`./#${path}`);
    await page.waitForLoadState('networkidle');
    const px = await sideways(page);
    if (px > 1) wide.push(`${path} (+${px}px)`);
  }
  expect(wide).toEqual([]);
});
