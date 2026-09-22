import { expect, test } from '@playwright/test';

test('the hiker explains its current weight after a manual move', async ({ page }) => {
  await page.goto('/#gradient-descent');
  await page.getByRole('button', { name: 'Try walking left', exact: true }).click();
  await expect(page.locator('.gradient-story')).toContainText('current weight, 4.5');
  await expect(page.locator('.gradient-story')).toContainText('guesses 4.5');
});

test('equal errors need opposite weight moves or no move depending on the connection', async ({
  page,
}) => {
  await page.goto('/#gradient-descent');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: /^Next:/ }).click();
  const lab = page.getByRole('region', { name: 'A low guess. Which way should the dial turn?' });
  await lab.getByRole('button', { name: 'Preview a bigger dial', exact: true }).click();
  await expect(lab.locator('.compass-feedback')).toContainText('saved dial is still 1');
  await expect(lab.getByTestId('compass-guess')).toHaveText('2.2');
  await lab.getByRole('button', { name: 'Increase dial ↑', exact: true }).click();
  await lab.getByRole('button', { name: 'Calculate and save this update' }).click();
  await expect(lab.getByTestId('compass-shown-weight')).toHaveText('1.4');
  await expect(lab.locator('.compass-receipt')).toContainText('Loss: 2 → 0.72');

  await lab.getByRole('button', { name: 'Try the next connection' }).click();
  await expect(lab.getByTestId('compass-shown-weight')).toHaveText('1');
  await expect(lab.locator('.compass-receipt')).toHaveCount(0);
  await lab.getByRole('button', { name: 'Preview a bigger dial', exact: true }).click();
  await expect(lab.getByTestId('compass-guess')).toHaveText('-2.2');
  await lab.getByRole('button', { name: 'Increase dial ↑', exact: true }).click();
  await expect(lab.locator('.compass-feedback').last()).toContainText('Try again');
  await lab.getByRole('button', { name: 'Decrease dial ↓', exact: true }).click();
  await lab.getByRole('button', { name: 'Calculate and save this update' }).click();
  await expect(lab.getByTestId('compass-shown-weight')).toHaveText('0.6');
  await expect(lab.getByTestId('compass-guess')).toHaveText('-1.2');

  await lab.getByRole('button', { name: 'Try the next connection' }).click();
  await lab.getByRole('button', { name: 'Preview a bigger dial', exact: true }).click();
  await expect(lab.getByTestId('compass-guess')).toHaveText('0');
  await lab.getByRole('button', { name: 'Keep dial unchanged', exact: true }).click();
  await lab.getByRole('button', { name: 'Calculate and save this update' }).click();
  await expect(lab.getByTestId('compass-shown-weight')).toHaveText('1');
  await expect(lab.locator('.compass-receipt')).toContainText('Loss: 2 → 2');
  await expect(lab.locator('.compass-receipt')).toContainText('offset called a bias');

  await lab.getByText('Follow the calculation, then run the same code', { exact: true }).click();
  await expect(lab.locator('.source-code')).toContainText('const gradient = error * input');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  await lab.getByRole('button', { name: 'Reset this card' }).click();
  await expect(lab.locator('.compass-receipt')).toHaveCount(0);
});

test('the connection experiment remains usable at 320px with reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#gradient-descent');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: /^Next:/ }).click();
  const lab = page.locator('.gradient-compass');
  await lab.getByRole('button', { name: /Card 2/ }).click();
  await lab.getByRole('button', { name: 'Preview a bigger dial', exact: true }).click();
  await lab.getByRole('button', { name: 'Decrease dial ↓', exact: true }).click();
  await lab.getByRole('button', { name: 'Calculate and save this update' }).click();
  await expect(lab.locator('.compass-receipt')).toContainText('0.6');
  expect(
    await lab
      .locator('.compass-guess')
      .evaluate((element) => getComputedStyle(element).transitionDuration),
  ).toBe('0s');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
});
