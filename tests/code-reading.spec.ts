import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('every code lesson stacks source lines vertically and keeps the page within the viewport', async ({
  page,
}) => {
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
    'research-paper',
  ]) {
    await page.goto(`/#${chapter}`);
    await page.getByRole('button', { name: 'Read the code', exact: true }).click();
    const source = page.getByLabel('Runnable source code', { exact: true });
    await expect(source).toBeVisible();
    const rows = await source.locator('.source-line').evaluateAll((elements) =>
      elements.slice(0, 6).map((element) => {
        const rect = element.getBoundingClientRect();
        return { x: rect.x, top: rect.top, bottom: rect.bottom };
      }),
    );
    expect(rows.length, chapter).toBe(6);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].top, `${chapter}: source rows overlap`).toBeGreaterThanOrEqual(
        rows[i - 1].bottom - 1,
      );
      expect(rows[i].x, `${chapter}: source rows sit side by side`).toBe(rows[0].x);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      chapter,
    ).toBe(true);
  }
});

test('code navigation reveals its lines, and copy preserves the runnable source exactly', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/#first-steps');
  await page.getByRole('button', { name: 'Read the code', exact: true }).click();
  const source = page.getByLabel('Runnable source code', { exact: true });
  for (let i = 0; i < 3; i++)
    await page.getByRole('button', { name: 'Next part', exact: true }).click();
  await expect(page.locator('.code-explanation')).toContainText('The assignment is what persists');
  const placement = await source.evaluate((element) => {
    const viewport = element.getBoundingClientRect();
    const line = element.querySelector('.code-highlight')!.getBoundingClientRect();
    return {
      viewportTop: viewport.top,
      viewportBottom: viewport.bottom,
      lineTop: line.top,
      lineBottom: line.bottom,
    };
  });
  expect(placement.lineTop).toBeGreaterThanOrEqual(placement.viewportTop);
  expect(placement.lineBottom).toBeLessThanOrEqual(placement.viewportBottom);
  await page.getByRole('button', { name: 'Copy code', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Copied', exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    await readFile('examples/learning-loop.mjs', 'utf8'),
  );
});

test('a narrow code panel wraps long lines or scrolls them without widening the page', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/#first-steps');
  await page.getByRole('button', { name: 'Read the code', exact: true }).click();
  const source = page.getByLabel('Runnable source code', { exact: true });
  const wrap = page.getByRole('button', { name: 'Wrap lines', exact: true });
  await expect(wrap).toHaveAttribute('aria-pressed', 'true');
  expect(await source.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(
    true,
  );
  await wrap.click();
  await expect(wrap).toHaveAttribute('aria-pressed', 'false');
  expect(await source.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  await source.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => source.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await wrap.click();
  expect(await source.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(
    true,
  );
});
