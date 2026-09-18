import { expect, it } from 'vitest';
import { practice, predict } from '../../examples/learning-loop.mjs';

it('connects the first practice action to an independently checked derivative', () => {
  const step = practice(1);
  expect(step.guess).toBe(2);
  expect(step.loss).toBe(2);
  expect(step.gradient).toBe(-4);
  expect(step.nextDial).toBe(1.4);
  const epsilon = 1e-5;
  const numerical = (practice(1 + epsilon).loss - practice(1 - epsilon).loss) / (2 * epsilon);
  expect(step.gradient).toBeCloseTo(numerical, 8);
});

it('practice changes the parameter while repeated predictions leave it alone', () => {
  let dial = 1;
  for (let i = 0; i < 6; i++) dial = practice(dial).nextDial;
  expect(dial).toBeCloseTo(1.953344, 8);
  const saved = dial;
  expect(predict(dial, 4)).toBeCloseTo(7.813376, 8);
  predict(dial, 1);
  predict(dial, 5);
  expect(dial).toBe(saved);
  expect(practice(dial).loss).toBeLessThan(practice(1).loss);
});
