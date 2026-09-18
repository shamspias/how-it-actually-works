import { expect, test } from '@playwright/test';

test('a deeper chain connects exact backpropagation to fading gradients, bypasses, and nonlinear gates', async ({
  page,
}) => {
  await page.goto('/#deep-networks');
  for (const name of ['Send through station 1', 'Send through station 2'])
    await page.getByRole('button', { name, exact: true }).click();
  await expect(page.getByTestId('deep-station-2')).toHaveText('0.25');
  await page.getByRole('button', { name: 'No, the dials stayed put', exact: true }).click();
  await page.getByRole('button', { name: 'Measure the miss', exact: true }).click();
  await expect(page.locator('.deep-path-receipt')).toContainText('0.28125');
  await page.getByRole('button', { name: 'Trace the effects backward', exact: true }).click();
  await page.getByRole('button', { name: 'Increase the weight', exact: true }).click();
  await page.getByRole('button', { name: 'Update all the dials', exact: true }).click();
  await expect(page.locator('.deep-update-receipt')).toContainText('0.18969');
  await page.getByRole('button', { name: 'Try eight stations', exact: true }).click();
  await expect(page.getByTestId('deep-input-sensitivity')).toHaveText('0.003906');
  await page.getByRole('button', { name: 'It shrinks', exact: true }).click();
  await page.getByRole('button', { name: 'Open a bypass', exact: true }).click();
  await expect(page.getByTestId('deep-input-sensitivity')).toHaveText('2.565785');
  await page.getByRole('button', { name: 'Why also use a gate?', exact: true }).click();
  await expect(page.locator('.deep-parcel-examples').locator('strong').first()).toHaveText('-0.25');
  await page.getByRole('button', { name: 'Add a ReLU gate', exact: true }).click();
  await expect(page.locator('.deep-parcel-examples').locator('strong').first()).toHaveText('0');
  await page.getByRole('button', { name: 'Put the pieces together', exact: true }).click();
  await expect(page.locator('.deep-understanding')).toContainText(
    'Backpropagation follows local effects',
  );
});

test('changing an advanced setup cannot leave the beginner story narrating different numbers', async ({
  page,
}) => {
  await page.goto('/#deep-networks');
  await page.getByRole('button', { name: 'Follow the math', exact: true }).click();
  await page.getByLabel('Stations (depth)').selectOption('8');
  await page.getByLabel('Starting multiplier').selectOption('1.5');
  await page.getByRole('button', { name: 'Play & see', exact: true }).click();
  await expect(page.locator('.deep-story')).toContainText('STOP 1 OF 10');
  await page.getByRole('button', { name: 'Send through station 1', exact: true }).click();
  await expect(page.getByTestId('deep-station-1')).toHaveText('0.5');
});
