import { test, expect } from '@playwright/test';

test('the hiker learns the slope before making an exact calculated move', async ({ page }) => {
  await page.goto('/#gradient-descent');
  await expect(page.getByTestId('hiker-weight')).toHaveText('5');
  await page.getByRole('button', { name: 'Next: feel the slope' }).click();
  await page.getByRole('button', { name: 'Next: choose a step' }).click();
  await page.getByRole('button', { name: 'Take one step', exact: true }).click();
  await expect(page.getByTestId('hiker-weight')).toHaveText('4.1');
  await page.getByRole('button', { name: 'Follow the math', exact: true }).click();
  await expect(page.locator('.gradient-live-math')).toContainText('4.1');
  await page.getByRole('button', { name: 'Read the code', exact: true }).click();
  await expect(page.locator('.source-code')).toContainText('gradient');
});

test('backprop story waits for a decision, moves real weights, and reveals a complete learner', async ({
  page,
}) => {
  await page.goto('/#neural-network');
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: /^Next:/ }).click();
  await expect(page.locator('.guide-narration')).toContainText('-0.375');
  await page.getByRole('button', { name: 'Increase ↑', exact: true }).click();
  await expect(page.locator('.guide-feedback')).toContainText('Yes');
  await page.getByRole('button', { name: 'Move the weights', exact: true }).click();
  await expect(page.locator('.backprop-receipt')).toContainText('0.5375');
  await expect(page.locator('.backprop-receipt')).toContainText('0.28125');
  await page.getByRole('button', { name: 'Read the code', exact: true }).click();
  await page.getByRole('button', { name: 'A complete XOR learner', exact: true }).click();
  await expect(page.locator('.source-code')).toContainText('function gradients');
  await expect(page.locator('.code-explanation')).toContainText('tanh and sigmoid');
});

test('detective story changes one clue before changing the training data', async ({ page }) => {
  await page.goto('/#shortcut');
  await page.getByRole('button', { name: 'Train on the practice examples', exact: true }).click();
  await expect(page.getByTestId('detective-familiar')).toHaveText('97%');
  await page.getByRole('button', { name: 'Test the suspicious clue', exact: true }).click();
  await expect(page.getByTestId('detective-shifted')).toHaveText('5%');
  await page.getByRole('button', { name: 'Change only the background', exact: true }).click();
  await expect(page.locator('.detective-answer')).toContainText('Square');
  await page.getByRole('button', { name: 'Try better practice', exact: true }).click();
  await page.getByRole('button', { name: 'Train with varied backgrounds', exact: true }).click();
  await expect(page.getByTestId('detective-shifted')).toHaveText('100%');
  await expect(page.locator('.detective-answer')).toContainText('Circle');
});

test('the prediction game distinguishes a guess from new evidence', async ({ page }) => {
  await page.goto('/#before-training');
  await expect(page.getByRole('button', { name: 'Open the two possible worlds' })).toBeDisabled();
  await page.getByRole('button', { name: '3', exact: true }).click();
  await page.getByRole('button', { name: 'Open the two possible worlds' }).click();
  await expect(page.locator('.world-result')).toHaveText(['3.00', '7.50']);
  await page.getByRole('button', { name: 'Imagine measuring one more example' }).click();
  await expect(page.locator('.guide-narration')).toContainText('rules out A');
  await expect(page.locator('.new-clue')).toContainText('7.5');
});

test('attention routes information and its code is a complete runnable example', async ({
  page,
}) => {
  await page.goto('/#architectures');
  await page.getByRole('button', { name: 'Carry information', exact: false }).click();
  await expect(page.locator('.architecture-story')).toContainText('first number');
  await page.getByRole('button', { name: 'Person information', exact: true }).click();
  await expect(page.locator('.architecture-challenge')).toContainText('Yes');
  await page.getByRole('button', { name: 'Ask from card 4: it', exact: true }).click();
  await page.getByRole('button', { name: 'Carry information', exact: false }).click();
  await page.getByRole('button', { name: 'Object information', exact: true }).click();
  await expect(page.locator('.architecture-challenge')).toContainText('Yes');
  await page.getByRole('button', { name: 'Read the code', exact: true }).click();
  await expect(page.locator('.source-code')).toContainText('export const Wq');
  await expect(page.locator('.source-code')).toContainText('console.log');
});

test('the memory game demonstrates both retention and an overwrite limitation', async ({
  page,
}) => {
  await page.goto('/#architectures');
  await page.getByRole('button', { name: /Carry a tiny memory/ }).click();
  await page.locator('#noise-write-gate').fill('0');
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Read one card' }).click();
  await expect(page.locator('.architecture-challenge')).toContainText(
    'You kept the requested number',
  );
  await page.getByRole('checkbox', { name: /Add a second marked/ }).check();
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Read one card' }).click();
  await expect(page.locator('.architecture-challenge')).toContainText('replaced 7 with 4');
  await page.locator('#memory-question').selectOption('latest');
  await expect(page.locator('.architecture-challenge')).toContainText(
    'You kept the requested number',
  );
});

test('the electrical story writes the calculated bit pattern only at the write stage', async ({
  page,
}) => {
  await page.goto('/#physical');
  await expect(page.locator('.physical-circuit')).toHaveAttribute('aria-label', /00011000/);
  await page.getByRole('button', { name: '5 Write', exact: true }).click();
  await expect(page.locator('.physical-circuit')).toHaveAttribute('aria-label', /00010100/);
  await expect(page.locator('.physical-stage-explanation')).toContainText('1.25');
  await page.getByRole('button', { name: 'Use this weight for another update' }).click();
  await expect(page.locator('.physical-value-equation')).toContainText('1.25');
  await page.getByRole('button', { name: 'Reset to 1.5', exact: true }).click();
  await page.getByRole('button', { name: /Toggle bit 7,/ }).click();
  await expect(page.locator('.physical-value-equation')).toContainText('-6.5');
});

test('three modes remain usable on every chapter without horizontal page overflow', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const chapter of [
    'first-steps',
    'one-weight',
    'gradient-descent',
    'neural-network',
    'learned-features',
    'deep-networks',
    'shortcut',
    'before-training',
    'architectures',
    'scale',
    'physical',
  ]) {
    await page.goto(`/#${chapter}`);
    await expect(page.locator('main h1')).toBeVisible();
    for (const mode of ['Play & see', 'Follow the math', 'Read the code']) {
      await page.getByRole('button', { name: mode, exact: true }).click();
      await expect(page.getByRole('button', { name: mode, exact: true })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        `${chapter}: ${mode}`,
      ).toBe(true);
    }
  }
  expect(errors).toEqual([]);
});

test('existing completed chapters migrate by stable id when lessons are inserted', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('hiaw-progress-v1', '[0,1,4]'));
  await page.reload();
  const count = await page.locator('.chapter-link').count();
  await expect(page.locator('.course-progress')).toContainText(`3 / ${count}`);
  await expect(
    page.locator('.chapter-link').filter({ hasText: 'Follow one mistake' }).locator('.is-done'),
  ).toHaveCount(1);
  await expect(
    page.locator('.chapter-link').filter({ hasText: 'The blindfolded hiker' }).locator('.is-done'),
  ).toHaveCount(0);
});
