import { describe, expect, it } from 'vitest';
import { scalarExamples, scalarGradient, scalarLoss, scalarStep } from './scalar';

describe('the tiny machine’s actual training calculation', () => {
  it('uses every example for the exact initial update', () => {
    const step = scalarStep(0.5, 0.1);
    expect(step.examples.map((item) => item.prediction)).toEqual([0.5, 1, 1.5]);
    expect(step.examples.map((item) => item.error)).toEqual([-1.5, -3, -4.5]);
    expect(step.lossBefore).toBe(5.25);
    expect(step.gradient).toBe(-7);
    expect(step.weightAfter).toBeCloseTo(1.2, 12);
    expect(step.lossAfter).toBeCloseTo(1.4933333333333334, 12);
  });

  it.each([-1, 0.5, 1.7, 2, 4])('matches a finite-difference derivative at w=%s', (weight) => {
    const h = 1e-5;
    const numericalDerivative = (scalarLoss(weight + h) - scalarLoss(weight - h)) / (2 * h);
    expect(scalarGradient(weight)).toBeCloseTo(numericalDerivative, 7);
  });

  it('finds the exact rule and stays there', () => {
    let weight = 0.5;
    for (let index = 0; index < 40; index += 1) weight = scalarStep(weight, 0.1).weightAfter;
    expect(weight).toBeCloseTo(2, 9);
    expect(scalarLoss(weight)).toBeLessThan(1e-16);
    expect(scalarStep(2, 0.1).weightAfter).toBe(2);
    expect(scalarExamples(2).every((item) => item.error === 0)).toBe(true);
  });

  it('rejects invalid or numerically unsafe updates', () => {
    expect(() => scalarStep(Number.NaN, 0.1)).toThrow(RangeError);
    expect(() => scalarStep(1, 0)).toThrow(RangeError);
    expect(() => scalarStep(1, Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => scalarStep(1e7, 1)).toThrow(RangeError);
  });
});
