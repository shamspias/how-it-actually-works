import { expect, test } from '@playwright/test';

test('the first lesson separates a manual choice, a training update, and a frozen prediction', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'What does “learning” change?' })).toBeVisible();
  await page.getByRole('button', { name: 'Next: You move the dial' }).click();
  await expect(page.getByRole('button', { name: 'Next: Let the program practice' })).toBeDisabled();
  await page.getByRole('button', { name: 'Smaller dial' }).click();
  await expect(page.getByTestId('pip-guess')).toHaveText('1 drops');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Bigger dial' }).click();
  await expect(page.getByTestId('pip-guess')).toHaveText('4 drops');
  await page.getByRole('button', { name: 'Next: Let the program practice' }).click();
  await expect(page.getByTestId('pip-dial')).toHaveText('1');
  await page.getByRole('button', { name: 'Practice once', exact: true }).click();
  await expect(page.getByTestId('pip-dial')).toHaveText('1.4');
  for (let i = 0; i < 5; i++)
    await page.getByRole('button', { name: 'Practice once', exact: true }).click();
  await expect(page.getByTestId('pip-dial')).toHaveText('1.953');
  await page.getByRole('button', { name: 'Next: Use what stayed' }).click();
  await expect(page.getByTestId('pip-guess')).toHaveText('7.813 drops');
  await page.getByRole('button', { name: '5 seeds', exact: true }).click();
  await expect(page.getByTestId('pip-dial')).toHaveText('1.953');
  await page.getByRole('button', { name: 'Check the teacher’s answer' }).click();
  await expect(page.locator('.first-action')).toContainText('10 drops');
  await page.getByRole('button', { name: 'Next: Tell the story back' }).click();
  await page.getByRole('button', { name: 'The answer to every possible question.' }).click();
  await expect(page.locator('.first-action')).toContainText('We did not list every answer');
  await page.getByRole('button', { name: 'The adjusted dial number.' }).click();
  await expect(page.locator('.first-word-map')).toContainText('Inference');
  await page.getByRole('button', { name: 'Next lesson', exact: true }).click();
  await expect(page).toHaveURL(/#one-weight$/);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('hiaw-progress-v2') ?? '[]')),
  ).toContain('first-steps');
});

test('revisiting the manual dial remains solvable after practice in either view', async ({
  page,
}) => {
  await page.goto('/#first-steps');
  await page.getByRole('button', { name: 'Next: You move the dial' }).click();
  for (let i = 0; i < 2; i++) await page.getByRole('button', { name: 'Bigger dial' }).click();
  await page.getByRole('button', { name: 'Next: Let the program practice' }).click();
  for (let i = 0; i < 2; i++)
    await page.getByRole('button', { name: 'Practice once', exact: true }).click();
  await expect(page.getByTestId('pip-dial')).toHaveText('1.64');
  await page.getByRole('button', { name: 'Back one step' }).click();
  await expect(page.getByTestId('pip-dial')).toHaveText('1');
  await page.getByRole('button', { name: 'Bigger dial' }).click();
  await page.getByRole('button', { name: 'Follow the math', exact: true }).click();
  await page.getByRole('button', { name: 'Calculate this practice step' }).click();
  await page.getByRole('button', { name: 'Play & see', exact: true }).click();
  await expect(page.getByTestId('pip-dial')).toHaveText('1');
  for (let i = 0; i < 2; i++) await page.getByRole('button', { name: 'Bigger dial' }).click();
  await expect(page.getByTestId('pip-guess')).toHaveText('4 drops');
  await expect(page.getByRole('button', { name: 'Next: Let the program practice' })).toBeEnabled();
});

test('word help gives examples, searches, and returns focus without leaving the lesson', async ({
  page,
}) => {
  await page.goto('/#gradient-descent');
  await page.getByRole('button', { name: 'Explain a word', exact: true }).click();
  await page.getByRole('textbox', { name: 'Find a learning word' }).fill('backpropagation');
  await expect(page.locator('.word-definitions')).toContainText(
    'An efficient way to compute gradients',
  );
  await page.keyboard.press('Escape');
  await expect(page.locator('.word-help')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Explain a word', exact: true })).toBeFocused();
  await expect(page).toHaveURL(/#gradient-descent$/);
});

test('the practice receipt explains the actual old guess and saved update without training during replay', async ({
  page,
}) => {
  await page.goto('/#first-steps');
  await page.getByRole('button', { name: 'Next: You move the dial' }).click();
  await page.getByRole('button', { name: 'Bigger dial' }).click();
  await page.getByRole('button', { name: 'Bigger dial' }).click();
  await page.getByRole('button', { name: 'Next: Let the program practice' }).click();
  await page.getByRole('button', { name: 'Practice once', exact: true }).click();
  await expect(page.getByTestId('pip-receipt-before-guess')).toHaveText('2 drops');
  await expect(page.getByTestId('pip-receipt-dial')).toHaveText('1 → 1.4');
  await expect(page.locator('.pip-receipt-caption')).toContainText('New guess: 2.8 drops');
  await page.getByRole('button', { name: /^2 Compare/ }).click();
  await expect(page.locator('.pip-receipt-caption')).toContainText('2 drops too small');
  await page.getByText('Why this amount of change?', { exact: true }).click();
  await expect(page.locator('.pip-receipt-math')).toContainText('new dial: 1 − 0.1 × (-4) = 1.4');

  await page.getByRole('button', { name: 'Replay this change', exact: true }).click();
  await expect(page.getByRole('button', { name: /^1 Guess/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('button', { name: /^3 Adjust & save/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('button', { name: 'Replay this change', exact: true })).toBeVisible();
  await expect(page.getByTestId('pip-dial')).toHaveText('1.4');
  await expect(page.locator('.pip-receipt-header h3')).toHaveText('What changed in practice 1?');

  await page.getByRole('button', { name: 'Practice once', exact: true }).click();
  await expect(page.getByTestId('pip-receipt-before-guess')).toHaveText('2.8 drops');
  await expect(page.getByTestId('pip-receipt-dial')).toHaveText('1.4 → 1.64');
  await expect(page.locator('.pip-receipt-math')).toContainText(
    'new dial: 1.4 − 0.1 × (-2.4) = 1.64',
  );
});

test('receipt playback stops for manual inspection and mode changes, including a narrow reduced-motion view', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#first-steps');
  const firstAction = page.getByRole('button', { name: 'Next: You move the dial' });
  const box = await firstAction.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y + box!.height).toBeLessThan(900);
  await firstAction.click();
  for (let i = 0; i < 2; i++) await page.getByRole('button', { name: 'Bigger dial' }).click();
  await page.getByRole('button', { name: 'Next: Let the program practice' }).click();
  await page.getByRole('button', { name: 'Practice once', exact: true }).click();
  expect(
    await page
      .locator('.pip-glass > i')
      .evaluate((element) => getComputedStyle(element).transitionDuration),
  ).toBe('0s');
  await page.getByRole('button', { name: 'Replay this change', exact: true }).click();
  await page.getByRole('button', { name: /^2 Compare/ }).click();
  await expect(page.getByRole('button', { name: 'Replay this change', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^2 Compare/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Replay this change', exact: true }).click();
  await page.getByRole('button', { name: 'Follow the math', exact: true }).click();
  await page.getByRole('button', { name: 'Play & see', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Replay this change', exact: true })).toBeVisible();
  await expect(page.getByTestId('pip-dial')).toHaveText('1.4');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Back one step', exact: true }).click();
  await expect(page.getByTestId('pip-dial')).toHaveText('1');
  await expect(page.locator('.pip-receipt')).toHaveCount(0);
});
