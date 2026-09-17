import { describe, expect, it } from 'vitest';
import {
  ablateNetwork,
  accuracy,
  createDataset,
  createNetwork,
  forward,
  loss,
  parameterCount,
  traceExample,
  trainStep,
  type DatasetName,
  type Network,
  type Sample,
} from './network';

function flatten(network: Network): number[] {
  return [...network.w1.flat(), ...network.b1, ...network.w2, network.b2];
}

describe('deterministic examples and initialization', () => {
  it('repeats a seed without sharing mutable parameter arrays', () => {
    const first = createNetwork(5, 42);
    const second = createNetwork(5, 42);
    expect(first).toEqual(second);
    expect(first).not.toEqual(createNetwork(5, 43));
    first.w1[0][0] = 99;
    expect(second.w1[0][0]).not.toBe(99);
    expect(flatten(second)).toHaveLength(parameterCount(5));
    expect(parameterCount(5)).toBe(21);
  });

  it.each<DatasetName>(['line', 'xor', 'circle'])(
    'generates repeatable %s data with held-out seeds',
    (name) => {
      const train = createDataset(name, 100, 11);
      const heldOut = createDataset(name, 100, 12);
      expect(train).toEqual(createDataset(name, 100, 11));
      expect(train).not.toEqual(heldOut);
      const coordinates = new Set(train.map((sample) => `${sample.x},${sample.y}`));
      expect(heldOut.some((sample) => coordinates.has(`${sample.x},${sample.y}`))).toBe(false);
      for (const sample of [...train, ...heldOut]) {
        expect(sample.x).toBeGreaterThanOrEqual(-1);
        expect(sample.x).toBeLessThan(1);
        expect(sample.y).toBeGreaterThanOrEqual(-1);
        expect(sample.y).toBeLessThan(1);
        const expected =
          name === 'line'
            ? sample.x + sample.y > 0
            : name === 'xor'
              ? sample.x > 0 !== sample.y > 0
              : sample.x ** 2 + sample.y ** 2 < 0.5;
        expect(sample.label).toBe(Number(expected));
      }
    },
  );

  it('changes labels with noise while preserving coordinates and the clean dataset', () => {
    const clean = createDataset('xor', 100, 17);
    const original = structuredClone(clean);
    const noisy = createDataset('xor', 100, 17, 0.25);
    const flipped = createDataset('xor', 100, 17, 1);
    expect(noisy).toEqual(createDataset('xor', 100, 17, 0.25));
    expect(noisy).not.toEqual(clean);
    for (let i = 0; i < clean.length; i++) {
      expect([noisy[i].x, noisy[i].y]).toEqual([clean[i].x, clean[i].y]);
      expect(flipped[i]).toEqual({ ...clean[i], label: 1 - clean[i].label });
    }
    expect(clean).toEqual(original);
  });
});

describe('forward pass and numerical stability', () => {
  it('matches a hand-computable neuron and its full chain rule', () => {
    const network: Network = { hidden: 1, w1: [[0, 0]], b1: [0], w2: [2], b2: 0 };
    const sample: Sample = { x: 0.25, y: -0.5, label: 1 };
    const trace = traceExample(network, sample);
    expect(trace.hiddenPreactivations).toEqual([0]);
    expect(trace.hiddenActivations).toEqual([0]);
    expect(trace.hiddenContributions).toEqual([0]);
    expect(trace.logit).toBe(0);
    expect(trace.prediction).toBe(0.5);
    expect(trace.exampleLoss).toBeCloseTo(Math.log(2), 12);
    expect(trace.outputError).toBe(-0.5);
    expect(trace.hiddenDerivatives).toEqual([1]);
    expect(trace.hiddenErrors).toEqual([-1]);
    expect(trace.gradients.w1).toEqual([[-0.25, 0.5]]);
    expect(trace.gradients.b1).toEqual([-1]);
    expect(trace.gradients.w2[0]).toBeCloseTo(0);
    expect(trace.gradients.b2).toBe(-0.5);
  });

  it('computes stable BCE for confident correct and incorrect predictions', () => {
    const network: Network = { hidden: 1, w1: [[0, 0]], b1: [0], w2: [0], b2: 1000 };
    const positive: Sample = { x: 0, y: 0, label: 1 };
    const negative: Sample = { ...positive, label: 0 };
    expect(forward(network, positive).prediction).toBe(1);
    expect(loss(network, [positive])).toBe(0);
    expect(loss(network, [negative])).toBe(1000);
    network.b2 = -1000;
    expect(forward(network, positive).prediction).toBe(0);
    expect(loss(network, [negative])).toBe(0);
    expect(loss(network, [positive])).toBe(1000);
    expect(Number.isFinite(trainStep(network, [positive], 0.1).loss)).toBe(true);
  });
});

describe('backpropagation', () => {
  it('agrees with independently computed central finite differences for every parameter', () => {
    const network = createNetwork(3, 29);
    network.b1 = [0.1, -0.2, 0.3];
    network.b2 = -0.15;
    const data = createDataset('xor', 13, 47);
    const { gradients } = trainStep(network, data, 0.1);
    const epsilon = 1e-5;
    const check = (read: (n: Network) => number, write: (n: Network, value: number) => void) => {
      const plus = structuredClone(network);
      const minus = structuredClone(network);
      write(plus, read(network) + epsilon);
      write(minus, read(network) - epsilon);
      const numerical = (loss(plus, data) - loss(minus, data)) / (2 * epsilon);
      expect(read(gradients)).toBeCloseTo(numerical, 7);
    };
    for (let j = 0; j < network.hidden; j++) {
      for (let i = 0; i < 2; i++)
        check(
          (n) => n.w1[j][i],
          (n, value) => {
            n.w1[j][i] = value;
          },
        );
      check(
        (n) => n.b1[j],
        (n, value) => {
          n.b1[j] = value;
        },
      );
      check(
        (n) => n.w2[j],
        (n, value) => {
          n.w2[j] = value;
        },
      );
    }
    check(
      (n) => n.b2,
      (n, value) => {
        n.b2 = value;
      },
    );
  });

  it('averages same-state example gradients and returns an immutable simultaneous update', () => {
    const network = createNetwork(4, 9);
    const data = createDataset('line', 7, 71);
    const original = structuredClone({ network, data });
    const rate = 0.05;
    const result = trainStep(network, data, rate);
    const examples = data.map((sample) => flatten(traceExample(network, sample).gradients));
    const average = examples[0].map(
      (_, i) => examples.reduce((sum, values) => sum + values[i], 0) / examples.length,
    );
    const oldValues = flatten(network);
    flatten(result.gradients).forEach((gradient, i) =>
      expect(gradient).toBeCloseTo(average[i], 12),
    );
    flatten(result.network).forEach((value, i) =>
      expect(value).toBeCloseTo(oldValues[i] - rate * average[i], 12),
    );
    expect(result.loss).toBe(loss(result.network, data));
    expect(result.loss).toBeLessThan(loss(network, data));
    expect({ network, data }).toEqual(original);
    expect(result.network.w1[0]).not.toBe(network.w1[0]);
    expect(result.network.b1).not.toBe(network.b1);
    expect(result.network.w2).not.toBe(network.w2);
  });
});

describe('actual learning on unseen examples', () => {
  it.each<DatasetName>(['line', 'xor', 'circle'])(
    'learns %s without training on held-out points',
    (name) => {
      const train = createDataset(name, 160, 123);
      const heldOut = createDataset(name, 300, 987);
      const originalHeldOut = structuredClone(heldOut);
      let network = createNetwork(8, 42);
      const initialLoss = loss(network, train);
      for (let epoch = 0; epoch < 1800; epoch++) network = trainStep(network, train, 0.4).network;
      expect(loss(network, train)).toBeLessThan(initialLoss * 0.2);
      expect(accuracy(network, train)).toBeGreaterThan(0.95);
      expect(accuracy(network, heldOut)).toBeGreaterThan(0.9);
      expect(heldOut).toEqual(originalHeldOut);
    },
  );
});

describe('intervention and invalid inputs', () => {
  it('removes exactly the chosen contribution and preserves the original network', () => {
    const network = createNetwork(4, 19);
    const original = structuredClone(network);
    const sample: Sample = { x: 0.4, y: -0.7, label: 1 };
    const trace = traceExample(network, sample);
    const ablated = ablateNetwork(network, 2);
    expect(forward(ablated, sample).logit).toBeCloseTo(
      trace.logit - trace.hiddenContributions[2],
      12,
    );
    expect(ablated.w2[2]).toBe(0);
    expect(network).toEqual(original);
    ablated.w1[0][0] = 100;
    ablated.b1[0] = 100;
    expect(network).toEqual(original);
  });

  it('rejects malformed dimensions, examples, rates, seeds and noise', () => {
    const network = createNetwork(2, 1);
    const data = createDataset('line', 2, 1);
    expect(() => createNetwork(0, 1)).toThrow();
    expect(() => createNetwork(2.5, 1)).toThrow();
    expect(() => createNetwork(2, NaN)).toThrow();
    expect(() => parameterCount(-1)).toThrow();
    expect(() => createDataset('line', 0, 1)).toThrow();
    expect(() => createDataset('line', 10, 1, 1.1)).toThrow();
    expect(() => createDataset('line', 10, 1, NaN)).toThrow();
    expect(() => loss(network, [])).toThrow();
    expect(() => accuracy(network, [])).toThrow();
    expect(() => trainStep(network, [], 0.1)).toThrow();
    expect(() => trainStep(network, data, 0)).toThrow();
    expect(() => trainStep(network, data, Infinity)).toThrow();
    expect(() => forward(network, { x: NaN, y: 0 })).toThrow();
    expect(() => traceExample(network, { x: 0, y: 0, label: 2 as 0 })).toThrow();
    expect(() => forward({ ...network, w1: [[1]] }, data[0])).toThrow();
    expect(() => ablateNetwork(network, -1)).toThrow();
    expect(() => ablateNetwork(network, 2)).toThrow();
  });
});
