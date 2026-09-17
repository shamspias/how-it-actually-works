import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createNetwork,
  forward,
  gradients,
  loss,
  train,
  trainStep,
  XOR_DATA,
} from './neural-network.mjs';

const flatten = (model) => [...model.w1.flat(), ...model.b1, ...model.w2, model.b2];

test('seeded initialization repeats without sharing mutable arrays', () => {
  const first = createNetwork(42);
  const second = createNetwork(42);
  assert.deepEqual(first, second);
  assert.notDeepEqual(first, createNetwork(43));
  assert.equal(flatten(first).length, 17);
  first.w1[0][0] = 999;
  assert.notEqual(second.w1[0][0], 999);
});

test('all 17 handwritten derivatives match independently measured loss slopes', () => {
  const network = createNetwork(19);
  network.b1 = [0.1, -0.2, 0.3, -0.1];
  network.b2 = 0.2;
  const analytic = gradients(network);
  const epsilon = 1e-5;
  const check = (read, write) => {
    const plus = structuredClone(network);
    const minus = structuredClone(network);
    write(plus, read(network) + epsilon);
    write(minus, read(network) - epsilon);
    const numerical = (loss(plus) - loss(minus)) / (2 * epsilon);
    assert.ok(
      Math.abs(read(analytic) - numerical) < 1e-7,
      `gradient ${read(analytic)} vs measured ${numerical}`,
    );
  };
  for (let j = 0; j < 4; j++) {
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

test('one step uses a mean gradient and does not mutate its starting state', () => {
  const network = createNetwork(42);
  const snapshot = structuredClone(network);
  const rate = 0.1;
  const batch = gradients(network);
  const individual = XOR_DATA.map((sample) => flatten(gradients(network, [sample])));
  const update = trainStep(network, XOR_DATA, rate);
  const old = flatten(network);
  flatten(batch).forEach((gradient, i) => {
    const average = individual.reduce((sum, row) => sum + row[i], 0) / XOR_DATA.length;
    assert.ok(Math.abs(gradient - average) < 1e-12);
    assert.ok(Math.abs(flatten(update)[i] - (old[i] - rate * gradient)) < 1e-12);
  });
  assert.deepEqual(network, snapshot);
  assert.notEqual(update.w1[0], network.w1[0]);
  assert.ok(loss(update) < loss(network));
});

test('the documented run actually learns all four XOR cases', () => {
  const result = train();
  assert.ok(result.finalLoss < 0.005, `final loss ${result.finalLoss}`);
  assert.ok(result.finalLoss < result.initialLoss / 100);
  for (const { input, target } of XOR_DATA) {
    const prediction = forward(result.network, input).probability;
    assert.equal(Number(prediction >= 0.5), target);
    assert.ok(target === 1 ? prediction > 0.99 : prediction < 0.01);
  }
});

test('BCE remains finite for extreme logits and malformed training inputs fail clearly', () => {
  const network = createNetwork();
  network.w2 = [0, 0, 0, 0];
  network.b2 = 1000;
  assert.equal(loss(network, [{ input: [0, 0], target: 1 }]), 0);
  assert.equal(loss(network, [{ input: [0, 0], target: 0 }]), 1000);
  assert.throws(() => loss(network, []), RangeError);
  assert.throws(() => loss(network, [{ input: [NaN, 0], target: 1 }]), RangeError);
  assert.throws(() => trainStep(network, XOR_DATA, 0), RangeError);
  assert.throws(() => train({ steps: -1 }), RangeError);
});
