import { expect, test } from '@playwright/test';

test('hidden features change during real training and a controlled ablation changes predictions', async ({
  page,
}) => {
  await page.goto('/#learned-features');
  await page.getByRole('button', { name: 'Ring the bell', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Meet the mixers', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Keep it quiet', exact: true }).click();
  await page.getByRole('button', { name: 'Meet the mixers', exact: true }).click();
  await page
    .getByRole('button', { name: 'Where does their advice come from?', exact: true })
    .click();
  await page.getByRole('button', { name: 'Trace the final error backward', exact: true }).click();
  await page.getByRole('button', { name: 'Watch real practice', exact: true }).click();
  await expect(page.getByTestId('feature-updates')).toHaveText('0');
  for (let i = 0; i < 7; i++)
    await page.getByRole('button', { name: 'Show next practice checkpoint' }).click();
  await expect(page.getByTestId('feature-updates')).toHaveText('2,400');
  await expect(page.getByTestId('feature-correct')).toHaveText('4 / 4');
  await page.getByRole('button', { name: 'Test a learned mixer', exact: true }).click();
  await expect(page.getByTestId('feature-ablation-loss')).toHaveText('0.0020');
  await page.getByRole('button', { name: 'Some answers could change', exact: true }).click();
  await page.getByRole('button', { name: 'Disconnect mixer 4', exact: true }).click();
  await expect(page.getByTestId('feature-ablation-loss')).toHaveText('0.4095');
  await page.getByRole('button', { name: 'Use the saved recipe', exact: true }).click();
  await page.getByRole('button', { name: 'Use the saved recipe again', exact: true }).click();
  await expect(
    page.locator('.feature-small-note').filter({ hasText: 'Extra predictions' }),
  ).toContainText('Extra predictions: 1. Extra training updates: 0.');
});
