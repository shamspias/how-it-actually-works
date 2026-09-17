/**
 * A complete 2 → 4 → 1 XOR network, with handwritten backpropagation.
 * Run: node examples/neural-network.mjs
 * No neural-network package: the model uses only numbers, arrays, and Math.
 * JavaScript Number uses double precision; this is not the 8-bit hardware toy.
 */
import { pathToFileURL } from 'node:url';

// XOR means "one input is 1, but not both." All four binary cases are shown.
export const XOR_DATA = [
  { input: [0, 0], target: 0 },
  { input: [0, 1], target: 1 },
  { input: [1, 0], target: 1 },
  { input: [1, 1], target: 0 },
];

export function createNetwork(seed = 42) {
  if (!Number.isSafeInteger(seed)) throw new RangeError('Seed must be an integer.');
  let state = seed >>> 0;
  const random = () => {
    // A small seeded generator makes this teaching experiment repeatable.
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  // Different starting weights break symmetry between the four hidden units.
  const weight = (fanIn, fanOut) => (2 * random() - 1) * Math.sqrt(6 / (fanIn + fanOut));
  return {
    w1: Array.from({ length: 4 }, () => [weight(2, 4), weight(2, 4)]),
    b1: [0, 0, 0, 0],
    w2: Array.from({ length: 4 }, () => weight(4, 1)),
    b2: 0,
  };
}

export function sigmoid(z) {
  // This form also behaves well for large negative numbers.
  if (z >= 0) return 1 / (1 + Math.exp(-z));
  const exponential = Math.exp(z);
  return exponential / (1 + exponential);
}

export function forward(network, input) {
  // a_j = w_j0*x0 + w_j1*x1 + b_j; h_j = tanh(a_j).
  const hidden = network.w1.map((row, j) =>
    Math.tanh(row[0] * input[0] + row[1] * input[1] + network.b1[j]),
  );
  // z = sum_j(v_j*h_j) + c; p = sigmoid(z).
  const logit = hidden.reduce((sum, h, j) => sum + network.w2[j] * h, network.b2);
  return { hidden, logit, probability: sigmoid(logit) };
}

function validateData(data) {
  if (!Array.isArray(data) || data.length === 0)
    throw new RangeError('Provide at least one example.');
  for (const { input, target } of data) {
    if (
      !Array.isArray(input) ||
      input.length !== 2 ||
      input.some((value) => !Number.isFinite(value)) ||
      (target !== 0 && target !== 1)
    ) {
      throw new RangeError('Each example needs two finite inputs and a target of 0 or 1.');
    }
  }
}

export function loss(network, data = XOR_DATA) {
  validateData(data);
  // BCE = -t*ln(p) - (1-t)*ln(1-p).
  // Its equivalent logit form avoids log(0) when p rounds to an endpoint.
  return (
    data.reduce((sum, { input, target }) => {
      const { logit: z } = forward(network, input);
      return sum + Math.max(z, 0) - target * z + Math.log1p(Math.exp(-Math.abs(z)));
    }, 0) / data.length
  );
}

export function gradients(network, data = XOR_DATA) {
  validateData(data);
  const gradient = {
    w1: Array.from({ length: 4 }, () => [0, 0]),
    b1: [0, 0, 0, 0],
    w2: [0, 0, 0, 0],
    b2: 0,
  };
  for (const { input, target } of data) {
    const { hidden, probability } = forward(network, input);
    // BCE + sigmoid simplify to dL/dz = p - t.
    // Divide by n because the objective is the MEAN example loss.
    const outputGradient = (probability - target) / data.length;
    gradient.b2 += outputGradient; // dz/dc = 1
    for (let j = 0; j < 4; j++) {
      gradient.w2[j] += outputGradient * hidden[j]; // dz/dv_j = h_j
      // dL/da_j = (dL/dz) * (dz/dh_j) * tanh'(a_j).
      // dz/dh_j = v_j and tanh'(a_j) = 1 - h_j².
      const hiddenGradient = outputGradient * network.w2[j] * (1 - hidden[j] ** 2);
      gradient.b1[j] += hiddenGradient; // da_j/db_j = 1
      gradient.w1[j][0] += hiddenGradient * input[0]; // da_j/dw_j0 = x0
      gradient.w1[j][1] += hiddenGradient * input[1]; // da_j/dw_j1 = x1
    }
  }
  // Every derivative used the same old weights. Nothing has changed yet.
  return gradient;
}

export function trainStep(network, data = XOR_DATA, rate = 0.5) {
  if (!Number.isFinite(rate) || rate <= 0)
    throw new RangeError('Use a finite positive learning rate.');
  const gradient = gradients(network, data);
  // Apply w_new = w_old - learningRate * gradient to all 17 parameters.
  // Return new arrays so the original network remains available to inspect.
  return {
    w1: network.w1.map((row, j) => row.map((w, i) => w - rate * gradient.w1[j][i])),
    b1: network.b1.map((b, j) => b - rate * gradient.b1[j]),
    w2: network.w2.map((w, j) => w - rate * gradient.w2[j]),
    b2: network.b2 - rate * gradient.b2,
  };
}

export function train({ seed = 42, steps = 8000, rate = 0.5, data = XOR_DATA } = {}) {
  if (!Number.isSafeInteger(steps) || steps < 0)
    throw new RangeError('Steps must be a nonnegative integer.');
  let network = createNetwork(seed);
  const initialLoss = loss(network, data);
  for (let step = 0; step < steps; step++) network = trainStep(network, data, rate);
  return { network, initialLoss, finalLoss: loss(network, data) };
}

export function runDemo() {
  const before = createNetwork(42);
  const result = train();
  console.log('Handwritten XOR network: 2 inputs → 4 tanh units → 1 sigmoid output');
  console.log('17 parameters; seed 42; 8,000 full-batch updates; learning rate 0.5');
  console.log(`Mean loss: ${result.initialLoss.toFixed(6)} → ${result.finalLoss.toFixed(6)}`);
  console.log('input   target   before P(1)   after P(1)   class');
  for (const { input, target } of XOR_DATA) {
    const oldProbability = forward(before, input).probability;
    const probability = forward(result.network, input).probability;
    console.log(
      `${input.join(',')}       ${target}       ${oldProbability.toFixed(6)}       ${probability.toFixed(6)}       ${Number(probability >= 0.5)}`,
    );
  }
  console.log(
    'All four binary inputs were training data. This demonstrates fitting XOR, not unseen-data performance.',
  );
  return result;
}

// Importing this file exposes the functions without starting a training run.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) runDemo();
