import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cards, measure, update } from './error-and-gradient.mjs';

test('the same prediction error can require opposite updates or no update', () => {
  const results = cards.map(({ input, target }) => update(1, input, target));
  assert.deepEqual(
    results.map(({ before }) => before.error),
    [-2, -2, -2],
  );
  assert.deepEqual(
    results.map(({ before }) => before.gradient),
    [-4, 4, -0],
  );
  assert.deepEqual(
    results.map(({ after }) => after.weight),
    [1.4, 0.6, 1],
  );
  assert.ok(results[0].after.loss < results[0].before.loss);
  assert.ok(results[1].after.loss < results[1].before.loss);
  assert.equal(results[2].after.loss, results[2].before.loss);
});

test('each analytic gradient matches an independent central finite difference', () => {
  const h = 1e-5;
  for (const input of [-3, -2, 0, 0.5, 2]) {
    for (const weight of [-1.5, 0, 1, 2.5]) {
      for (const target of [-2, 0, 4]) {
        const independentLoss = (w) => 0.5 * (w * input - target) ** 2;
        const finite = (independentLoss(weight + h) - independentLoss(weight - h)) / (2 * h);
        assert.ok(Math.abs(measure(weight, input, target).gradient - finite) < 1e-7);
      }
    }
  }
});

test('a zero input prevents every weight from fitting a nonzero target', () => {
  for (const weight of [-1e6, -1, 0, 1, 1e6]) {
    const result = measure(weight, 0, 2);
    assert.equal(Math.abs(result.guess), 0);
    assert.equal(result.loss, 2);
    assert.equal(update(weight, 0, 2).after.weight, weight);
  }
});
