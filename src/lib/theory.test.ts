import { describe, expect, it } from 'vitest';
import { createNetwork } from './network';
import {
  AMBIGUITY_INPUTS,
  curvedRule,
  denseNetworkBudget,
  finiteClassErrorBound,
  predictQuadraticWeight,
  quadraticTrajectory,
  straightRule,
} from './theory';

describe('an exactly predictable training problem', () => {
  it('matches a hand-calculated training path', () => {
    expect(quadraticTrajectory(0, 3, 0.5, 3)).toEqual([0, 1.5, 2.25, 2.625]);
    expect(predictQuadraticWeight(0, 3, 0.5, 3)).toBe(2.625);
  });

  it.each([0, 0.05, 0.35, 1, 1.5, 2, 2.2])(
    'predicts independent updates with learning rate %s',
    (rate) => {
      for (const [initial, target] of [
        [0, 3],
        [-4, 2],
        [5, -2],
      ]) {
        const trajectory = quadraticTrajectory(initial, target, rate, 16);
        for (let steps = 0; steps <= 16; steps++) {
          expect(predictQuadraticWeight(initial, target, rate, steps)).toBeCloseTo(
            trajectory[steps],
            10,
          );
        }
      }
    },
  );

  it('distinguishes no learning, one-step convergence, oscillation, and divergence', () => {
    expect(quadraticTrajectory(0, 3, 0, 3)).toEqual([0, 0, 0, 0]);
    expect(quadraticTrajectory(0, 3, 1, 3)).toEqual([0, 3, 3, 3]);
    expect(quadraticTrajectory(0, 3, 2, 4)).toEqual([0, 6, 0, 6, 0]);
    const divergent = quadraticTrajectory(0, 3, 2.2, 16);
    for (let i = 1; i < divergent.length; i++) {
      expect(Math.abs(divergent[i] - 3)).toBeGreaterThan(Math.abs(divergent[i - 1] - 3));
    }
  });

  it.each([0.1, 0.35, 1.5, 1.9])(
    'shrinks squared error in the stated convergence range at rate %s',
    (rate) => {
      const weights = quadraticTrajectory(0, 3, rate, 16);
      for (let i = 1; i < weights.length; i++) {
        expect((weights[i] - 3) ** 2).toBeLessThan((weights[i - 1] - 3) ** 2);
      }
    },
  );

  it('handles zero steps and a weight already at the optimum', () => {
    expect(quadraticTrajectory(-2, 3, 0.5, 0)).toEqual([-2]);
    expect(predictQuadraticWeight(-2, 3, 0.5, 0)).toBe(-2);
    expect(quadraticTrajectory(3, 3, 1.5, 5)).toEqual([3, 3, 3, 3, 3, 3]);
  });

  it('rejects undefined training inputs and numerical overflow', () => {
    for (const calculate of [predictQuadraticWeight, quadraticTrajectory]) {
      expect(() => calculate(NaN, 3, 0.1, 1)).toThrow(RangeError);
      expect(() => calculate(0, Infinity, 0.1, 1)).toThrow(RangeError);
      expect(() => calculate(0, 3, -0.1, 1)).toThrow(RangeError);
      expect(() => calculate(0, 3, 0.1, -1)).toThrow(RangeError);
      expect(() => calculate(0, 3, 0.1, 0.5)).toThrow(RangeError);
      expect(() => calculate(0, 3, Infinity, 1)).toThrow(RangeError);
      expect(() => calculate(0, 3, 1e200, 3)).toThrow(RangeError);
    }
  });
});

describe('finite observations do not identify an unseen answer', () => {
  it('fits every observed training pair under both possible worlds', () => {
    for (const input of AMBIGUITY_INPUTS) {
      expect(straightRule(input)).toBe(input);
      expect(curvedRule(input)).toBe(input);
    }
  });

  it('disagrees both between observations and beyond them', () => {
    expect(straightRule(0.5)).toBe(0.5);
    expect(curvedRule(0.5)).toBe(0.78125);
    expect(straightRule(3)).toBe(3);
    expect(curvedRule(3)).toBe(7.5);
  });
});

describe('bias-inclusive dense model storage', () => {
  it('matches the actual parameter arrays of the one-hidden-layer lab network', () => {
    for (const hidden of [1, 2, 4, 8]) {
      const network = createNetwork(hidden, 42);
      const storedValues = [...network.w1.flat(), ...network.b1, ...network.w2, network.b2];
      const budget = denseNetworkBudget(2, hidden, 1, 1);
      expect(budget.totalParameters).toBe(storedValues.length);
      expect(budget.hiddenParameters).toBe(0);
      expect(budget.float32Bytes).toBe(new Float32Array(storedValues).byteLength);
    }
  });

  it('counts hand-enumerated weights and biases across three hidden layers', () => {
    // 8→2→2→2→2 has 16+4+4+4 weights and 2+2+2+2 biases.
    expect(denseNetworkBudget(8, 2, 3, 2)).toEqual({
      inputParameters: 18,
      hiddenParameters: 12,
      outputParameters: 6,
      totalParameters: 36,
      float32Bytes: 144,
    });
  });

  it('keeps a billion-parameter budget as arithmetic without allocating weights', () => {
    const budget = denseNetworkBudget(8, 8192, 16, 2);
    expect(budget.totalParameters).toBe(1_006_845_954);
    expect(budget.float32Bytes).toBe(4_027_383_816);
  });

  it('rejects impossible dimensions and budgets outside precise integer arithmetic', () => {
    expect(() => denseNetworkBudget(8, 0, 3, 2)).toThrow(RangeError);
    expect(() => denseNetworkBudget(8, 2, 0, 2)).toThrow(RangeError);
    expect(() => denseNetworkBudget(8, 2.5, 3, 2)).toThrow(RangeError);
    expect(() => denseNetworkBudget(8, 2, 3, Infinity)).toThrow(RangeError);
    expect(() => denseNetworkBudget(8, Number.MAX_SAFE_INTEGER, 3, 2)).toThrow(RangeError);
  });
});

describe('a conditional finite-class error bound', () => {
  it('returns the stated 95% error-gap radius for 100 fixed candidates', () => {
    expect(finiteClassErrorBound(100, 1000, 0.05)).toBeCloseTo(0.0643974, 7);
  });

  it('narrows with data and widens with more candidates or greater confidence', () => {
    const base = finiteClassErrorBound(100, 1000, 0.05);
    expect(finiteClassErrorBound(100, 4000, 0.05)).toBeCloseTo(base / 2, 12);
    expect(finiteClassErrorBound(1000, 1000, 0.05)).toBeGreaterThan(base);
    expect(finiteClassErrorBound(100, 1000, 0.01)).toBeGreaterThan(base);
  });

  it('does not present a vacuous bound as an accuracy forecast', () => {
    // The mathematical gap radius can exceed the entire [0,1] loss range.
    expect(finiteClassErrorBound(100, 1, 0.05)).toBeGreaterThan(1);
    expect(() => finiteClassErrorBound(100, 0, 0.05)).toThrow(RangeError);
    expect(() => finiteClassErrorBound(0, 1000, 0.05)).toThrow(RangeError);
    expect(() => finiteClassErrorBound(100, 1000, 0)).toThrow(RangeError);
    expect(() => finiteClassErrorBound(100, 1000, 1)).toThrow(RangeError);
  });
});
