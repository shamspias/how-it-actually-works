import { expect, test } from '@playwright/test';

test('the paper route links shifted text targets, causal context, loss, and learned parameters', async ({
  page,
}) => {
  await page.goto('/#research-paper');
  await expect(page.locator('.paper-story')).toContainText(
    'A sentence already carries its practice answers',
  );
  for (let i = 0; i < 3; i++)
    await page.getByRole('button', { name: 'Next stop', exact: true }).click();
  await page.getByLabel('Inspect attention position').selectOption('0');
  await expect(page.locator('.paper-tokens .paper-visible-token')).toHaveCount(1);
  await expect(page.locator('.paper-tokens .paper-covered-token')).toHaveCount(2);
  await page.getByRole('button', { name: 'Generating: future unknown', exact: true }).click();
  await expect(page.locator('.paper-mask-lesson')).toContainText('the next token is not known');
  for (let i = 0; i < 5; i++)
    await page.getByRole('button', { name: 'Next stop', exact: true }).click();
  await expect(page.getByTestId('paper-token-loss')).toContainText('1.386');
  await page.getByRole('slider', { name: 'Correct-token probability' }).fill('0.8');
  await expect(page.getByTestId('paper-token-loss')).toContainText('0.223');
  await page.getByRole('button', { name: 'Next stop', exact: true }).click();
  await page.getByRole('button', { name: 'Only today’s attention shares', exact: true }).click();
  await expect(page.locator('.paper-story .paper-question')).toContainText('underlying stored parameters');
  await page
    .getByRole('button', { name: 'The stored lookup and weight tables', exact: true })
    .click();
  await expect(page.locator('.paper-story .paper-question')).toContainText('Yes. The stored parameters persist');
});

test('a blueprint rejects broken shapes and counts complete configurations instead of guessing performance', async ({
  page,
}) => {
  await page.goto('/#research-paper');
  await page.getByText('Challenge 1: build and repair a blueprint', { exact: true }).click();
  await expect(page.getByTestId('paper-parameters')).toHaveText('448');
  await page.getByLabel('Attention heads (h)', { exact: true }).selectOption('3');
  await page.getByRole('button', { name: 'Check and use this blueprint', exact: true }).click();
  await expect(page.locator('.paper-builder-feedback')).toContainText('cannot split evenly');
  await expect(page.getByTestId('paper-parameters')).toHaveText('448');
  await page.getByLabel('Attention heads (h)', { exact: true }).selectOption('4');
  await page.getByRole('button', { name: 'Check and use this blueprint', exact: true }).click();
  await expect(page.getByTestId('paper-parameters')).toHaveText('448');
  await page.getByLabel('Blocks (L)', { exact: true }).selectOption('3');
  await page.getByRole('button', { name: 'Check and use this blueprint', exact: true }).click();
  await expect(page.getByTestId('paper-parameters')).toHaveText('620');
  await page.getByRole('button', { name: 'Follow the math', exact: true }).click();
  await expect(page.getByTestId('paper-parameters')).toHaveText('620');
  await page.getByRole('button', { name: 'Mamba paper', exact: true }).click();
  await expect(page.locator('.paper-notation')).toContainText('state');
  await page.getByRole('button', { name: 'Read the code', exact: true }).click();
  await expect(page.locator('.source-code')).toContainText('function inspectBlueprint');
});
