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
  await page.getByRole('button', { name: 'Got it. Let’s keep going' }).click();
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
