import { expect, test } from '@playwright/test';

test('a facilitator can run a single-lens session and copy an anonymized summary', async ({ page }) => {
  await page.goto('./?interview');
  await expect(page.getByRole('heading', { name: 'Interview mode' })).toBeVisible();
  await page.getByRole('radio', { name: 'Vedic only' }).click();
  await page.getByRole('button', { name: 'Start a fresh session' }).click();
  await expect(page.getByText(/Interview \w{4} · Vedic only/)).toBeVisible();

  await page.getByRole('button', { name: 'Recurring patterns' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('radio', { name: 'Clarity' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'I understand' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('radio', { name: 'Just me for now' }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Vedic perspective')).toBeVisible();
  await expect(page.getByText('Western perspective')).toHaveCount(0);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('input[name="ob-step"]').nth(1).check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Save and go to Today' }).click();

  await expect(page.getByRole('heading', { name: 'Three quick questions' })).toBeVisible();
  for (const name of ['Accurate', 'Partly', 'Not yet']) await page.getByRole('radio', { name }).nth(['Accurate', 'Partly', 'Not yet'].indexOf(name)).click();
  await page.getByRole('button', { name: 'See the summary' }).click();
  const summary = await page.locator('pre').innerText();
  expect(summary).toMatch(/lens: vedic/);
  expect(summary).toMatch(/meaning: accurate\nfact: partly\nnext: not_yet/);
  expect(summary).not.toMatch(/Los Angeles|1994|patterns/i);
});
