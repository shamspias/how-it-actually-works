import { describe, expect, it } from 'vitest';
import { explain, initialNetwork, trainOneStep } from '../../examples/backprop-step.mjs';

describe('the exact example used in the animated tutorial', () => {
  it('matches a hand calculation and makes a simultaneous update', () => {
    const model = initialNetwork();
    const step = trainOneStep(model);
    expect(step.before.hidden).toEqual([1, 1.5]);
    expect(step.before.prediction).toBe(1.25);
    expect(step.before.loss).toBe(0.28125);
    expect(step.before.gradients.weights[0][0]).toBe(-0.375);
    expect(step.network.weights[0][0]).toBe(0.5375);
    expect(step.after.loss).toBeLessThan(step.before.loss);
    expect(model).toEqual(initialNetwork());
  });
  it('checks every path with independent finite differences', () => {
    const model = initialNetwork();
    const gradients = explain(model).gradients;
    const epsilon = 1e-5;
    for (const key of ['weights', 'biases', 'outputWeights', 'outputBias'] as const) {
      const values =
        key === 'weights'
          ? model.weights.flat()
          : key === 'outputBias'
            ? [model.outputBias]
            : model[key];
      values.forEach((_, index) => {
        const plus = structuredClone(model),
          minus = structuredClone(model);
        let gradient: number;
        if (key === 'weights') {
          const j = Math.floor(index / 2),
            i = index % 2;
          plus.weights[j][i] += epsilon;
          minus.weights[j][i] -= epsilon;
          gradient = gradients.weights[j][i];
        } else if (key === 'outputBias') {
          plus.outputBias += epsilon;
          minus.outputBias -= epsilon;
          gradient = gradients.outputBias;
        } else {
          plus[key][index] += epsilon;
          minus[key][index] -= epsilon;
          gradient = gradients[key][index];
        }
        expect((explain(plus).loss - explain(minus).loss) / (2 * epsilon)).toBeCloseTo(gradient, 7);
      });
    }
  });
  it('blocks the hidden path when its ReLU is off', () => {
    const model = initialNetwork();
    model.biases[0] = -10;
    const trace = explain(model);
    expect(trace.hidden[0]).toBe(0);
    expect(trace.gradients.weights[0].every((value: number) => value === 0)).toBe(true);
    expect(trace.gradients.outputWeights[0] === 0).toBe(true);
  });
});
