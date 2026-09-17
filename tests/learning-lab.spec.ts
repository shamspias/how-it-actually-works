import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function setRange(page: Page, id: string, value: string) {
  const input = page.locator(`#${id}`);
  await input.fill(value);
  await input.dispatchEvent('input');
  await input.dispatchEvent('change');
}

test('one training step matches the visible arithmetic, and reset restores the start', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'How does a machine learn?' })).toBeVisible();
  await expect(page.locator('.tiny-result').first()).toContainText('0.500');
  await page.getByRole('button', { name: 'Train one step' }).click();
  await expect(page.locator('.tiny-result').first()).toContainText('1.200');
  await expect(page.locator('.tiny-result').nth(1)).toContainText('1.493');
  await page.getByRole('button', { name: 'Show the math' }).click();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.locator('.tiny-calculation')).toContainText('w = 0.5');
  await setRange(page, 'tiny-rate', '0.2');
  await expect(page.locator('.tiny-weight-update')).toContainText('0.1');
  await page.getByRole('button', { name: 'Reset the tiny machine' }).click();
  await expect(page.locator('.tiny-result').first()).toContainText('0.500');
  await expect(page.locator('.tiny-result').nth(2)).toContainText('0 adjustments');
});

test('manual fitting, automatic training, pause, and recall feedback work', async ({ page }) => {
  await page.goto('/');
  await setRange(page, 'tiny-weight', '2');
  await expect(page.locator('.tiny-result').nth(1)).toContainText('0.000');
  await page.getByRole('button', { name: 'Reset the tiny machine' }).click();
  await page.getByRole('button', { name: 'Auto train' }).click();
  await expect
    .poll(async () =>
      Number(
        await page
          .locator('.tiny-result')
          .nth(2)
          .locator('strong')
          .textContent()
          .then((value) => value?.split(' ')[0]),
      ),
    )
    .toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const paused = await page.locator('.tiny-result').nth(2).textContent();
  await page.waitForTimeout(750);
  expect(await page.locator('.tiny-result').nth(2).textContent()).toBe(paused);
  await page.getByRole('button', { name: 'Larger' }).click();
  await expect(page.locator('.tiny-quiz-feedback')).toContainText('Exactly');
});

test('chapter navigation remembers completion, supports deep links and browser back', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Go a little deeper' }).click();
  await expect(page).toHaveURL(/#gradient-descent$/);
  expect(await page.evaluate(() => localStorage.getItem('hiaw-progress-v2'))).toBe(
    '["one-weight"]',
  );
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Learning is a trail of smaller mistakes.' }),
  ).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'How does a machine learn?' })).toBeVisible();
});

test('network training changes measured loss, pauses, and config changes reset it', async ({
  page,
}) => {
  await page.goto('/#neural-network');
  await page.getByRole('button', { name: 'Open the free network lab' }).click();
  const initialAccuracy = await page.getByTestId('training-accuracy').textContent();
  await page.getByRole('button', { name: 'Train the network', exact: true }).click();
  await expect
    .poll(async () => Number(await page.getByTestId('network-epoch').textContent()), {
      timeout: 15000,
    })
    .toBeGreaterThanOrEqual(180);
  await page.getByRole('button', { name: 'Pause training' }).click();
  const epoch = await page.getByTestId('network-epoch').textContent();
  await page.waitForTimeout(160);
  await expect(page.getByTestId('network-epoch')).toHaveText(epoch!);
  expect(await page.getByTestId('training-accuracy').textContent()).not.toBe(initialAccuracy);
  await page.getByRole('button', { name: 'Disconnect this neuron' }).click();
  await expect(page.getByRole('button', { name: 'Reconnect this neuron' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Reconnect this neuron' }).click();
  await page.getByRole('button', { name: 'Unseen examples', exact: true }).click();
  await page.getByRole('button', { name: /Inspect neuron 3,/ }).click();
  await expect(page.locator('#neuron-inspect')).toHaveValue('2');
  await page.getByRole('button', { name: /Inside the circle/ }).click();
  await expect(page.getByTestId('network-epoch')).toHaveText('0');
  await page.getByRole('button', { name: 'One network training step' }).click();
  await expect(page.getByTestId('network-epoch')).toHaveText('1');
  await page.getByRole('button', { name: 'Reset network' }).click();
  await expect(page.getByTestId('network-epoch')).toHaveText('0');
});

test('network exports the actual reproducible experiment', async ({ page }) => {
  await page.goto('/#neural-network');
  await page.getByRole('button', { name: 'Open the free network lab' }).click();
  await page.getByRole('button', { name: 'One network training step' }).click();
  await page.locator('summary').filter({ hasText: 'Follow one mistake backward' }).click();
  await expect(page.locator('.details-body')).toContainText('Last actual update');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save experiment' }).click();
  const download = await downloadEvent;
  const result = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(result.epoch).toBe(1);
  expect(result.config.seed).toBe(42);
  expect(result.network.w1).toHaveLength(8);
  expect(result.trainingData).toHaveLength(120);
  expect(result.heldOutData).toHaveLength(200);
  expect(result.history[1].train).toBeLessThan(result.history[0].train);
});

test('shortcut experiment exposes changed-world failure and diverse data recovery', async ({
  page,
}) => {
  await page.goto('/#shortcut');
  await page.getByRole('button', { name: 'Open the shortcut lab' }).click();
  await page.getByRole('button', { name: 'Train on these examples' }).click();
  await expect(page.getByTestId('shortcut-familiar-accuracy')).toHaveText('97%');
  await expect(page.getByTestId('shortcut-shifted-accuracy')).toHaveText('5%');
  const first = await page.getByTestId('shortcut-probe-prediction').textContent();
  await page.getByRole('button', { name: 'Change background' }).click();
  expect(await page.getByTestId('shortcut-probe-prediction').textContent()).not.toBe(first);
  await page.getByRole('button', { name: 'Diverse examples', exact: true }).click();
  await expect(page.getByTestId('shortcut-shifted-accuracy')).toHaveText('—');
  await page.getByRole('button', { name: 'Train on these examples' }).click();
  await expect(page.getByTestId('shortcut-shifted-accuracy')).toHaveText('100%');
});

test('the pretraining calculation agrees with updates and shows unseen ambiguity', async ({
  page,
}) => {
  await page.goto('/#before-training');
  await page.getByRole('button', { name: 'Follow the math', exact: true }).click();
  await setRange(page, 'future-rate', '1');
  await expect(page.locator('.theory-stats').first()).toContainText('3.0000');
  await expect(page.locator('.theory-stats').first().locator('strong')).toHaveText([
    '3.0000',
    '3.0000',
  ]);
  await setRange(page, 'future-rate', '2');
  await expect(page.locator('.theory-stats').first().locator('strong')).toHaveText([
    '0.0000',
    '0.0000',
  ]);
  await setRange(page, 'unseen-probe', '3');
  await expect(page.locator('.theory-stats').nth(1).locator('strong')).toHaveText(['3.00', '7.50']);
});

test('architecture explorer changes mechanism and counts real dense parameters', async ({
  page,
}) => {
  await page.goto('/#scale');
  await expect(page.locator('.theory-lesson')).toContainText('2,466');
  await page.getByRole('button', { name: 'Transformer', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Transformer', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Mamba', exact: true }).click();
  await expect(page.locator('.theory-architecture')).toContainText('state');
  await setRange(page, 'dense-depth', '1');
  await expect(page.locator('.theory-lesson')).toContainText('354');
});

test('all lessons fit the viewport without runtime errors or external requests', async ({
  page,
}) => {
  const errors: string[] = [];
  const external: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:4173') && !request.url().startsWith('data:'))
      external.push(request.url());
  });
  for (const hash of [
    'one-weight',
    'gradient-descent',
    'neural-network',
    'shortcut',
    'before-training',
    'architectures',
    'scale',
    'physical',
  ]) {
    await page.goto(`/#${hash}`);
    await expect(page.locator('main')).toBeVisible();
    const overflowing = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflowing, `horizontal overflow in ${hash}`).toBe(false);
  }
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test('sources dialog supports Escape and presentation mode hides navigation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open field notes and sources' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: 'Enter presentation mode' }).click();
  await expect(page.locator('.sidebar')).toBeHidden();
  await page.getByRole('button', { name: 'Exit presentation mode' }).click();
  if (await page.getByRole('button', { name: 'Open lesson menu' }).isVisible()) {
    await page.getByRole('button', { name: 'Open lesson menu' }).click();
    await expect(page.locator('.sidebar')).toBeInViewport();
    await page.getByRole('button', { name: /Can we know beforehand/ }).click();
    await expect(page).toHaveURL(/#before-training$/);
    await expect(page.locator('.sidebar')).not.toBeInViewport();
  }
});
