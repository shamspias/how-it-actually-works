import { describe, expect, it } from 'vitest';
import { hillGradient, hillLoss, searchStep, startSearch } from './optimizers';

describe('the blindfolded hiker uses actual optimization', () => {
  it.each(['bowl', 'valleys'] as const)(
    'checks the %s derivative by changing the input',
    (landscape) => {
      for (const weight of [-1.3, 0.4, 2, 4.5]) {
        const h = 1e-5;
        expect(hillGradient(weight, landscape)).toBeCloseTo(
          (hillLoss(weight + h, landscape) - hillLoss(weight - h, landscape)) / (2 * h),
          7,
        );
      }
    },
  );

  it('computes the visible first step and converges for a small enough step size', () => {
    let state = searchStep(startSearch(), 'gradient', 0.3);
    expect(state.weight).toBeCloseTo(4.1);
    expect(state.last?.gradient).toBe(3);
    expect(hillLoss(state.weight)).toBeCloseTo(2.205);
    for (let i = 0; i < 70; i += 1) state = searchStep(state, 'gradient', 0.3);
    expect(state.weight).toBeCloseTo(2, 9);
  });

  it('shows bouncing at rate 2 and growing errors above it', () => {
    const bounce = searchStep(startSearch(), 'gradient', 2);
    expect(bounce.weight).toBe(-1);
    expect(searchStep(bounce, 'gradient', 2).weight).toBe(5);
    const huge = searchStep(startSearch(), 'gradient', 2.5);
    expect(hillLoss(huge.weight)).toBeGreaterThan(hillLoss(5));
  });

  it('can settle in a higher valley, despite the lower valley at 2', () => {
    let state = startSearch(4.5);
    for (let i = 0; i < 120; i += 1) state = searchStep(state, 'gradient', 0.08, 'valleys');
    expect(Math.abs(hillGradient(state.weight, 'valleys'))).toBeLessThan(1e-9);
    expect(hillLoss(state.weight, 'valleys')).toBeGreaterThan(0.3);
    expect(hillLoss(2, 'valleys')).toBe(0);
  });

  it('momentum remembers previous slopes and can cross the bottom', () => {
    const first = searchStep(startSearch(), 'momentum', 0.3);
    const second = searchStep(first, 'momentum', 0.3);
    expect(first.weight).toBeCloseTo(4.1);
    expect(second.velocity).toBeCloseTo(4.2);
    expect(second.weight).toBeCloseTo(2.84);
    expect(searchStep(second, 'momentum', 0.3).weight).toBeLessThan(2);
  });

  it('grid search really checks candidates, and finds this grid-aligned optimum', () => {
    let state = startSearch();
    for (let i = 0; i < 41; i += 1) state = searchStep(state, 'grid', 0.3);
    expect(state.weight).toBe(2);
    expect(state.lossChecks).toBe(42);
    expect(state.last?.accepted).toBe(false);
  });

  it('random search is reproducible and never replaces its best loss with a worse one', () => {
    let state = startSearch();
    let previous = hillLoss(state.weight);
    const first = searchStep(state, 'random', 0.3);
    expect(searchStep(startSearch(), 'random', 0.3)).toEqual(first);
    for (let i = 0; i < 40; i += 1) {
      state = searchStep(state, 'random', 0.3);
      expect(hillLoss(state.weight)).toBeLessThanOrEqual(previous);
      previous = hillLoss(state.weight);
    }
    expect(previous).toBeLessThan(0.05);
  });

  it('rejects nonfinite weights and invalid rates instead of silently clipping learning', () => {
    expect(() => startSearch(Infinity)).toThrow(RangeError);
    expect(() => searchStep(startSearch(), 'gradient', 0)).toThrow(RangeError);
    expect(() => searchStep(startSearch(), 'gradient', NaN)).toThrow(RangeError);
    expect(() => searchStep(startSearch(1e6), 'gradient', 3)).toThrow(RangeError);
  });
});
