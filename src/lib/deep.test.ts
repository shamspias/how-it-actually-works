import { describe, expect, it } from 'vitest';
import { collapseLinear, explainDeep, makeDeepNetwork, trainDeep } from './deep';

describe('a trainable chain with exactly the lesson arithmetic', () => {
  it('matches every number in the opening two-station story', () => {
    const model = makeDeepNetwork();
    const step = trainDeep(model);
    expect(step.before[0].layers.map((layer) => layer.output)).toEqual([0.5, 0.25]);
    expect(step.beforeLoss).toBe(0.28125);
    expect(step.gradients).toEqual([
      { weight: -0.375, bias: -0.375 },
      { weight: -0.375, bias: -0.75 },
    ]);
    expect(step.model.layers).toEqual([
      { weight: 0.5375, bias: 0.037500000000000006 },
      { weight: 0.5375, bias: 0.07500000000000001 },
    ]);
    expect(step.afterLoss).toBeLessThan(step.beforeLoss);
    expect(model.layers.every((layer) => layer.weight === 0.5 && layer.bias === 0)).toBe(true);
  });

  for (const activation of ['linear', 'relu', 'tanh'] as const) {
    for (const residual of [false, true]) {
      it(`checks every weight, bias, and input derivative with ${activation}, residual=${residual}`, () => {
        const model = makeDeepNetwork(4, activation, residual, 0.7);
        model.layers.forEach((layer, i) => {
          layer.bias = 0.04 * (i + 1);
          layer.weight += i * 0.07;
        });
        const trace = explainDeep(model, 0.8, -0.2);
        const epsilon = 1e-5;
        for (let i = 0; i < model.layers.length; i++) {
          for (const key of ['weight', 'bias'] as const) {
            const plus = structuredClone(model),
              minus = structuredClone(model);
            plus.layers[i][key] += epsilon;
            minus.layers[i][key] -= epsilon;
            const difference =
              (explainDeep(plus, 0.8, -0.2).loss - explainDeep(minus, 0.8, -0.2).loss) /
              (2 * epsilon);
            expect(difference).toBeCloseTo(
              trace.layers[i][key === 'weight' ? 'weightGradient' : 'biasGradient'],
              7,
            );
          }
        }
        const plus = explainDeep(model, 0.8 + epsilon, -0.2),
          minus = explainDeep(model, 0.8 - epsilon, -0.2);
        expect((plus.loss - minus.loss) / (2 * epsilon)).toBeCloseTo(trace.inputGradient, 7);
        expect((plus.prediction - minus.prediction) / (2 * epsilon)).toBeCloseTo(
          trace.inputSensitivity,
          7,
        );
      });
    }
  }

  it('averages mini-batch gradients before a simultaneous update', () => {
    const model = makeDeepNetwork(3, 'tanh');
    const data = [
      { input: 1, target: 1 },
      { input: -2, target: 0.5 },
    ];
    const traces = data.map((row) => explainDeep(model, row.input, row.target));
    const step = trainDeep(model, data, 0.03);
    step.gradients.forEach((gradient, i) => {
      expect(gradient.weight).toBe(
        (traces[0].layers[i].weightGradient + traces[1].layers[i].weightGradient) / 2,
      );
      expect(step.model.layers[i].bias).toBe(model.layers[i].bias - 0.03 * gradient.bias);
    });
  });

  it('exhibits shrinking and growing paths without claiming residuals guarantee stability', () => {
    expect(explainDeep(makeDeepNetwork(8)).inputSensitivity).toBe(0.5 ** 8);
    expect(explainDeep(makeDeepNetwork(8, 'relu', false, 1.5)).inputSensitivity).toBe(1.5 ** 8);
    expect(explainDeep(makeDeepNetwork(8, 'relu', true)).inputSensitivity).toBe(1.125 ** 8);
  });

  it('preserves the bypass input path even when the ReLU branch is closed', () => {
    const model = makeDeepNetwork(2, 'relu', true);
    model.layers.forEach((layer) => {
      layer.bias = -10;
    });
    const trace = explainDeep(model);
    expect(trace.prediction).toBe(1);
    expect(trace.inputSensitivity).toBe(1);
    expect(
      trace.layers.every((layer) => layer.weightGradient === 0 && layer.biasGradient === 0),
    ).toBe(true);
    const without = explainDeep({ ...model, residual: false });
    expect(without.inputSensitivity === 0).toBe(true);
  });

  it('collapses affine layers, including offsets and residuals, for arbitrary inputs', () => {
    for (const residual of [false, true]) {
      const model = makeDeepNetwork(4, 'linear', residual, 0.7);
      model.layers.forEach((layer, i) => {
        layer.bias = i - 1;
      });
      const collapsed = collapseLinear(model);
      for (const input of [-3, 0, 2.4]) {
        expect(explainDeep(model, input).prediction).toBeCloseTo(
          collapsed.slope * input + collapsed.intercept,
          12,
        );
      }
    }
    expect(() => collapseLinear(makeDeepNetwork())).toThrow();
  });

  it('learns the practice example while retaining explicit limits and invalid-input checks', () => {
    let model = makeDeepNetwork();
    for (let i = 0; i < 80; i++) model = trainDeep(model).model;
    expect(explainDeep(model).loss).toBeLessThan(1e-8);
    expect(() => makeDeepNetwork(0)).toThrow();
    expect(() => trainDeep(model, [])).toThrow();
    expect(() => trainDeep(model, [{ input: 1, target: 1 }], Infinity)).toThrow();
    expect(() => explainDeep(model, NaN)).toThrow();
  });
});
