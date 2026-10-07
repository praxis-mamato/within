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
  await page.getByRole('button', { name: 'Start free' }).click();
  await expect(page.getByRole('heading', { name: 'What would you like help understanding?' })).toBeVisible();
  found.push(...(await audit(page, 'onboarding 1')));
  await page.getByRole('button', { name: 'Recurring patterns' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  found.push(...(await audit(page, 'onboarding 2')));
  await page.getByRole('radio', { name: 'Clarity' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('Help improve Within').click();
  found.push(...(await audit(page, 'onboarding 3')));
  await page.getByRole('button', { name: 'I understand' }).click();
  found.push(...(await audit(page, 'onboarding 4')));
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('radio', { name: 'Just me for now' }).check();
  found.push(...(await audit(page, 'onboarding 5')));
  await page.getByRole('button', { name: 'Continue' }).click();
  found.push(...(await audit(page, 'onboarding 6')));
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('input[name="ob-step"]').first().check();
  found.push(...(await audit(page, 'onboarding 7')));
  await page.getByRole('button', { name: 'Continue' }).click();
  found.push(...(await audit(page, 'onboarding 8')));
  await page.getByRole('button', { name: 'Save and go to Today' }).click();
  await expect(page).toHaveURL(/#\/today/);
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

const SCREENS = ['/interview', '/today', '/reflection/self', '/reflection/purpose', '/relationships', '/you/chart', '/you/reading', '/growth', '/settings', '/account'];

async function sideways(page: Page) {
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

test('text at 200% never makes a screen scroll sideways', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Start free' }).click();
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
