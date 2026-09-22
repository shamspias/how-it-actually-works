import { expect, test } from '@playwright/test';

test('reading one paper does not mark another paper’s worksheet complete', async ({ page }) => {
  await page.goto('/#research-paper');
  await page
    .getByText('Challenge 2: find these operations in a real paper', { exact: true })
    .click();
  const task = page.getByRole('checkbox', { name: 'Task: What goes in, and what must come out?' });
  await task.check();
  await page.getByRole('button', { name: 'Mamba paper', exact: true }).click();
  await expect(task).not.toBeChecked();
  await page.getByRole('button', { name: 'Transformer paper', exact: true }).click();
  await expect(task).toBeChecked();
});

test('adding and removing evidence changes which mystery rules still fit', async ({ page }) => {
  await page.goto('/#before-training');
  await page.getByRole('button', { name: '3', exact: true }).click();
  await page.getByRole('button', { name: 'Open the two possible worlds' }).click();
  const worldA = page.locator('.possible-worlds > div').nth(0);
  const worldB = page.locator('.possible-worlds > div').nth(1);
  await expect(worldA).toContainText('All three original clues fit');
  await expect(worldB).toContainText('All three original clues fit');

  await page.getByRole('button', { name: 'Imagine measuring one more example' }).click();
  await expect(page.locator('.guide-card h2')).toHaveText(
    'One new clue separates these two rules.',
  );
  await expect(worldA).toContainText('Ruled out by the new clue');
  await expect(worldA).toContainText('the new observation says 7.5');
  await expect(worldB).toContainText('All four clues fit');
  await expect(page.locator('.guide-narration')).toContainText('other rules could still fit');

  await page.getByRole('button', { name: 'Remove the new clue' }).click();
  await expect(worldA).toContainText('All three original clues fit');
  await expect(worldA).not.toContainText('Ruled out');
  await expect(worldB).toContainText('All three original clues fit');
  await expect(page.locator('.new-clue')).toHaveCount(0);
});

test('memory feedback distinguishes a later overwrite from distracting inputs', async ({
  page,
}) => {
  await page.goto('/#architectures');
  await page.getByRole('button', { name: /Carry a tiny memory/ }).click();
  await page.getByRole('checkbox', { name: /Add a second marked/ }).check();
  await expect(page.locator('#noise-write-gate')).toHaveValue('0.5');
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Read one card' }).click();

  const outcome = page.locator('.architecture-challenge');
  await expect(outcome).toContainText('We wanted 7, but got 4.000');
  await expect(outcome).toContainText('final marked card overwrites 3.875 with 4');
  await expect(outcome).toContainText('Closing the distraction gate still cannot keep 7');

  // Closing the distraction gate preserves 7 only until the second marked card.
  await page.locator('#noise-write-gate').fill('0');
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Read one card' }).click();
  await expect(page.locator('.architecture-story')).toContainText('backpack now holds 7.000');
  await page.getByRole('button', { name: 'Read one card' }).click();
  await expect(outcome).toContainText('replaced 7 with 4');

  // Changing the question evaluates the same saved state; it does not retrain it.
  await page.locator('#memory-question').selectOption('latest');
  await expect(outcome).toContainText('You kept the requested number');
  await expect(outcome).toContainText('can answer “latest”');
  await page.getByRole('button', { name: 'Empty backpack' }).click();
  await expect(page.locator('.architecture-story')).toContainText('Your question asks for 4');
});

test('the blueprint splits full-width projections before calculating each attention head', async ({
  page,
}) => {
  await page.goto('/#research-paper');
  await page.getByRole('button', { name: 'Follow the math', exact: true }).click();
  await expect(page.locator('.paper-equations')).toContainText(
    'headᵢ = softmax(QᵢKᵢᵀ / √(d/h) + causal mask)Vᵢ',
  );
  const calculation = page.getByTestId('paper-head-calculation');
  await expect(calculation).toContainText('shape 3 × 2');
  await expect(calculation).toContainText('scaled by √2');
  await expect(calculation).toContainText('Join 2 heads to recover 3 × 4');
  await expect(page.getByTestId('paper-parameters')).toHaveText('448');

  await page.getByLabel('Attention heads (h)', { exact: true }).selectOption('4');
  await page.getByRole('button', { name: 'Check and use this blueprint', exact: true }).click();
  await expect(calculation).toContainText('shape 3 × 1');
  await expect(calculation).toContainText('scaled by √1');
  await expect(calculation).toContainText('Join 4 heads to recover 3 × 4');
  await expect(page.getByTestId('paper-parameters')).toHaveText('448');
});
