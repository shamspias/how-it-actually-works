import { expect, test } from '@playwright/test';

test('the tiny learner distinguishes a small gradient from an actual zero gradient', async ({
  page,
}) => {
  await page.goto('/#one-weight');
  await page.getByRole('slider', { name: 'Weight', exact: true }).fill('1.99');
  for (let i = 0; i < 9; i++)
    await page.getByRole('button', { name: 'Train one step', exact: true }).click();

  const gradient = Number(await page.locator('.tiny-gradient-value').innerText());
  expect(gradient).toBeLessThan(0);
  expect(Math.abs(gradient)).toBeLessThan(0.0005);
  await expect(page.locator('.tiny-weight-update')).toContainText('small, not zero');
  await expect(page.locator('.tiny-weight-update')).toContainText('tiny increase');

  await page.getByRole('slider', { name: 'Weight', exact: true }).fill('2');
  await expect(page.locator('.tiny-gradient-value')).toHaveText('0');
  await expect(page.locator('.tiny-weight-update')).toContainText(
    'A zero gradient means this weight stays put',
  );
});

test('the deep math controls explain when saved settings are rebuilt', async ({ page }) => {
  await page.goto('/#deep-networks');
  await page.getByRole('button', { name: 'Follow the math', exact: true }).click();
  await expect(page.locator('.deep-math')).toContainText('every bias resets to 0');
  await page.getByRole('button', { name: 'Calculate one deep update', exact: true }).click();
  await expect(page.locator('.deep-stations > li').first()).toContainText('1 × 0.5375 + 0.0375');

  await page.getByRole('combobox', { name: 'Learning rate', exact: true }).selectOption('0.01');
  await expect(page.locator('.deep-stations > li').first()).toContainText('1 × 0.5375 + 0.0375');
  await page.getByRole('combobox', { name: 'Stations (depth)', exact: true }).selectOption('4');
  await expect(page.locator('.deep-stations > li')).toHaveCount(4);
  for (const station of await page.locator('.deep-stations > li').all())
    await expect(station.locator('p')).toContainText('× 0.5375 + 0');
});

test('backprop has a correct choice when a closed gate makes one gradient zero', async ({
  page,
}) => {
  await page.goto('/#neural-network');
  await page.getByRole('button', { name: 'Follow the math', exact: true }).click();
  await page.getByRole('button', { name: 'Turn off the top ReLU', exact: true }).click();
  await page.getByRole('button', { name: 'Play & see', exact: true }).click();
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: /^Next:/ }).click();

  await page.getByRole('button', { name: 'Increase ↑', exact: true }).click();
  await expect(page.locator('.guide-feedback')).toContainText('choose Stay the same');
  await page.getByRole('button', { name: 'Stay the same', exact: true }).click();
  await expect(page.locator('.guide-feedback')).toContainText('Yes. Learning rate × 0 = 0');
  await page.getByRole('button', { name: 'Move the weights', exact: true }).click();

  await expect(page.locator('.backprop-receipt')).toContainText('0.5 → 0.5');
  const lossReceipt = page.locator('.backprop-receipt > div').filter({ hasText: 'Loss' });
  const losses = (await lossReceipt.locator('strong').innerText()).split('→').map(Number);
  expect(losses[1]).toBeLessThan(losses[0]);
  await expect(page.locator('.backprop-narration')).toContainText('closer');

  await page.getByRole('button', { name: 'Restart story', exact: true }).click();
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: /^Next:/ }).click();
  await page.getByRole('button', { name: 'Stay the same', exact: true }).click();
  await expect(page.locator('.guide-feedback')).toContainText('This gradient is not zero');
  await page.getByRole('button', { name: 'Increase ↑', exact: true }).click();
  await expect(page.locator('.guide-feedback')).toContainText('Yes');

  // A changed gate starts a fresh question, without grading the earlier choice.
  await page.getByRole('button', { name: 'Follow the math', exact: true }).click();
  await page.getByRole('button', { name: 'Turn off the top ReLU', exact: true }).click();
  await page.getByRole('button', { name: 'Play & see', exact: true }).click();
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: /^Next:/ }).click();
  await expect(page.locator('.guide-feedback')).toHaveText(
    'A gradient is the slope of the loss with respect to this particular weight.',
  );
});

test('the saved feature recipe names both weights and biases before reuse', async ({ page }) => {
  await page.goto('/#learned-features');
  await page.getByRole('button', { name: 'Keep it quiet', exact: true }).click();
  await page.getByRole('button', { name: 'Meet the mixers', exact: true }).click();
  await expect(page.locator('.feature-machine-output')).toContainText('MODEL’S RING SCORE');
  await expect(page.locator('.feature-small-note')).toContainText(
    'not a measured chance of being correct',
  );
  await page
    .getByRole('button', { name: 'Where does their advice come from?', exact: true })
    .click();
  await page.getByRole('button', { name: 'Trace the final error backward', exact: true }).click();
  await page.getByRole('button', { name: 'Watch real practice', exact: true }).click();
  for (let i = 0; i < 7; i++)
    await page.getByRole('button', { name: 'Show next practice checkpoint' }).click();
  await page.getByRole('button', { name: 'Test a learned mixer', exact: true }).click();
  await page.getByRole('button', { name: 'Some answers could change', exact: true }).click();
  await page.getByRole('button', { name: 'Disconnect mixer 4', exact: true }).click();
  await page.getByRole('button', { name: 'Use the saved recipe', exact: true }).click();

  await expect(page.locator('.feature-saved-recipe')).toContainText('Saved settings');
  await expect(page.locator('.feature-saved-recipe')).toContainText('17 numbers');
  await expect(page.locator('.feature-question')).toContainText('12 weights + 5 biases');
  await page.getByRole('button', { name: 'Changed weights and biases', exact: true }).click();
  await expect(page.locator('.feature-question [role="status"]')).toContainText('Yes');
  const savedPredictions = await page
    .locator('.feature-card-picker button > strong')
    .allTextContents();
  await page.getByRole('button', { name: 'Use the saved recipe again', exact: true }).click();
  await expect(page.locator('.feature-card-picker button > strong')).toHaveText(savedPredictions);
  await expect(page.locator('.feature-question')).toContainText('Extra training updates: 0');
});
