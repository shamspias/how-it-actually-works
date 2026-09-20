import { expect, test } from '@playwright/test';

test('a recap stays optional and next lesson records exploration separately from story steps', async ({
  page,
}) => {
  await page.goto('/#first-steps');
  await expect(page.locator('.lesson-position')).toHaveText('Lesson 01 / 12');
  await expect(page.getByRole('button', { name: 'Next: You move the dial' })).toBeVisible();
  await expect(page.locator('.next-lesson-preview')).toContainText('One tiny learner');
  const recap = page.locator('.lesson-recap');
  await expect(recap.locator('details p')).toBeHidden();
  await recap.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(recap.locator('details p')).toContainText('Only a practice update changes the dial');
  await page.getByRole('button', { name: 'Next lesson', exact: true }).click();
  await expect(page).toHaveURL(/#one-weight$/);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('hiaw-progress-v2') ?? '[]')),
  ).toEqual(['first-steps']);
  await page.goto('/#gradient-descent');
  await expect(page.locator('.lesson-recap h2')).toContainText('giant one goes wrong');
  await expect(page.locator('.lesson-recap details p')).toBeHidden();
  for (const chapter of [
    'learned-features',
    'architectures',
    'research-paper',
    'learned-features',
  ]) {
    await page.evaluate((id) => {
      window.location.hash = id;
    }, chapter);
    await expect(page).toHaveURL(new RegExp(`#${chapter}$`));
    await expect(page.locator('.lesson-recap')).toHaveCount(1);
    await expect(page.locator('.learning-bridge')).toHaveCount(1);
    await expect(page.locator('.lesson-recap details p')).toBeHidden();
  }
});
