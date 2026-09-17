/**
 * A deliberately small neural network with no ML library hiding the arithmetic.
 *
 * Two inputs → `hidden` tanh units → one sigmoid output. `w1[j][i]` connects
 * input i to hidden unit j; `w2[j]` connects hidden unit j to the output.
 * The output estimates P(label = 1), and training minimizes mean binary
 * cross-entropy with full-batch gradient descent. Every update is immutable.
 */
export type DatasetName = 'line' | 'xor' | 'circle';

export type Sample = { x: number; y: number; label: 0 | 1 };

export type Network = {
  hidden: number;
  w1: number[][];
  b1: number[];
  w2: number[];
  b2: number;
};

export type ExampleTrace = {
  inputs: [number, number];
  hiddenPreactivations: number[];
  hiddenActivations: number[];
  hiddenContributions: number[];
  logit: number;
  prediction: number;
  target: 0 | 1;
  exampleLoss: number;
  /** dL/dz at the output: sigmoid(z) − target, for sigmoid + BCE. */
  outputError: number;
  /** Local tanh derivatives: 1 − activation². */
  hiddenDerivatives: number[];
  /** dL/da_j, where a_j is the hidden preactivation. */
  hiddenErrors: number[];
  /** Single-example gradients at the supplied network, before an update. */
  gradients: Network;
};

function requireFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite.`);
}

function requirePositiveInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a positive integer.`);
  }
}

function seededRandom(seed: number): () => number {
  if (!Number.isSafeInteger(seed)) throw new RangeError('Seed must be an integer.');
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function validatePoint(sample: { x: number; y: number }): void {
  requireFinite(sample.x, 'Input x');
  requireFinite(sample.y, 'Input y');
}

function validateSample(sample: Sample): void {
  validatePoint(sample);
  if (sample.label !== 0 && sample.label !== 1) {
    throw new RangeError('A label must be 0 or 1.');
  }
}

function validateData(data: readonly Sample[]): void {
  if (data.length === 0) throw new RangeError('Provide at least one example.');
  data.forEach(validateSample);
}

function validateNetwork(network: Network): void {
  requirePositiveInteger(network.hidden, 'Hidden unit count');
  if (
    network.w1.length !== network.hidden ||
    network.b1.length !== network.hidden ||
    network.w2.length !== network.hidden
  ) {
    throw new RangeError('Network dimensions must match its hidden unit count.');
  }
  for (let j = 0; j < network.hidden; j++) {
    if (network.w1[j].length !== 2)
      throw new RangeError('Each hidden unit needs two input weights.');
    requireFinite(network.w1[j][0], 'Input weight');
    requireFinite(network.w1[j][1], 'Input weight');
    requireFinite(network.b1[j], 'Hidden bias');
    requireFinite(network.w2[j], 'Output weight');
  }
  requireFinite(network.b2, 'Output bias');
}

/** Four parameters per hidden unit (two input weights, bias, output weight), plus output bias. */
export function parameterCount(hidden: number): number {
  requirePositiveInteger(hidden, 'Hidden unit count');
  return 4 * hidden + 1;
}

/** Xavier uniform initialization breaks the symmetry between hidden units. */
export function createNetwork(hidden: number, seed: number): Network {
  requirePositiveInteger(hidden, 'Hidden unit count');
  const random = seededRandom(seed);
  const inputScale = Math.sqrt(6 / (2 + hidden));
  const outputScale = Math.sqrt(6 / (hidden + 1));
  return {
    hidden,
    w1: Array.from({ length: hidden }, () => [
      (2 * random() - 1) * inputScale,
      (2 * random() - 1) * inputScale,
    ]),
    b1: Array(hidden).fill(0),
    w2: Array.from({ length: hidden }, () => (2 * random() - 1) * outputScale),
    b2: 0,
  };
}

/**
 * Independent uniform samples in [-1, 1)². Use DIFFERENT seeds for training and
 * held-out data. These rules generate labels; the network is never given them.
 * `noise` independently flips a label with that probability. Coordinates do
 * not change when the noise slider changes, because its RNG is separate.
 */
export function createDataset(name: DatasetName, count: number, seed: number, noise = 0): Sample[] {
  requirePositiveInteger(count, 'Example count');
  requireFinite(noise, 'Label noise');
  if (noise < 0 || noise > 1) throw new RangeError('Label noise must be between 0 and 1.');
  if (!['line', 'xor', 'circle'].includes(name)) throw new RangeError('Unknown dataset.');
  const random = seededRandom(seed);
  const noiseRandom = seededRandom((seed >>> 0) ^ 0xa5a5a5a5);
  return Array.from({ length: count }, () => {
    const x = 2 * random() - 1;
    const y = 2 * random() - 1;
    let label: 0 | 1;
    if (name === 'line') label = x + y > 0 ? 1 : 0;
    else if (name === 'xor') label = x > 0 !== y > 0 ? 1 : 0;
    else label = x * x + y * y < 0.5 ? 1 : 0;
    if (noiseRandom() < noise) label = label === 0 ? 1 : 0;
    return { x, y, label };
  });
}

function sigmoid(value: number): number {
  if (value >= 0) return 1 / (1 + Math.exp(-value));
  const exp = Math.exp(value);
  return exp / (1 + exp);
}

/** BCE from logits avoids log(0) when floating-point sigmoid rounds to 0 or 1. */
function binaryCrossEntropy(logit: number, label: 0 | 1): number {
  return Math.max(logit, 0) - label * logit + Math.log1p(Math.exp(-Math.abs(logit)));
}

function forwardUnchecked(network: Network, sample: { x: number; y: number }) {
  const hidden = network.w1.map((weights, j) =>
    Math.tanh(weights[0] * sample.x + weights[1] * sample.y + network.b1[j]),
  );
  const logit = hidden.reduce((sum, value, j) => sum + value * network.w2[j], network.b2);
  return { hidden, logit, prediction: sigmoid(logit) };
}

export function forward(network: Network, sample: { x: number; y: number }) {
  validateNetwork(network);
  validatePoint(sample);
  return forwardUnchecked(network, sample);
}

function lossUnchecked(network: Network, data: readonly Sample[]): number {
  return (
    data.reduce(
      (sum, sample) =>
        sum + binaryCrossEntropy(forwardUnchecked(network, sample).logit, sample.label),
      0,
    ) / data.length
  );
}

export function loss(network: Network, data: readonly Sample[]): number {
  validateNetwork(network);
  validateData(data);
  return lossUnchecked(network, data);
}

/** Accuracy is a fraction in [0, 1], using a 0.5 probability threshold. */
export function accuracy(network: Network, data: readonly Sample[]): number {
  validateNetwork(network);
  validateData(data);
  return (
    data.reduce(
      (correct, sample) =>
        correct +
        Number(Number(forwardUnchecked(network, sample).prediction >= 0.5) === sample.label),
      0,
    ) / data.length
  );
}

function zeroGradients(hidden: number): Network {
  return {
    hidden,
    w1: Array.from({ length: hidden }, () => [0, 0]),
    b1: Array(hidden).fill(0),
    w2: Array(hidden).fill(0),
    b2: 0,
  };
}

/** Every chain-rule term for one example; no rounding is applied. */
export function traceExample(network: Network, sample: Sample): ExampleTrace {
  validateNetwork(network);
  validateSample(sample);
  const result = forwardUnchecked(network, sample);
  const outputError = result.prediction - sample.label;
  const hiddenDerivatives = result.hidden.map((value) => 1 - value * value);
  const hiddenErrors = hiddenDerivatives.map(
    (derivative, j) => outputError * network.w2[j] * derivative,
  );
  return {
    inputs: [sample.x, sample.y],
    hiddenPreactivations: network.w1.map(
      (weights, j) => weights[0] * sample.x + weights[1] * sample.y + network.b1[j],
    ),
    hiddenActivations: result.hidden,
    hiddenContributions: result.hidden.map((value, j) => value * network.w2[j]),
    logit: result.logit,
    prediction: result.prediction,
    target: sample.label,
    exampleLoss: binaryCrossEntropy(result.logit, sample.label),
    outputError,
    hiddenDerivatives,
    hiddenErrors,
    gradients: {
      hidden: network.hidden,
      w1: hiddenErrors.map((error) => [error * sample.x, error * sample.y]),
      b1: hiddenErrors,
      w2: result.hidden.map((value) => outputError * value),
      b2: outputError,
    },
  };
}

/**
 * One epoch: calculate every example's gradients using the SAME old weights,
 * average them, then update all parameters together: new = old − rate × grad.
 * Returned gradients describe the old network; returned loss describes the new.
 */
export function trainStep(
  network: Network,
  data: readonly Sample[],
  learningRate: number,
): { network: Network; loss: number; gradients: Network } {
  validateNetwork(network);
  validateData(data);
  requireFinite(learningRate, 'Learning rate');
  if (learningRate <= 0) throw new RangeError('Learning rate must be positive.');
  const gradients = zeroGradients(network.hidden);
  for (const sample of data) {
    const result = forwardUnchecked(network, sample);
    const outputError = (result.prediction - sample.label) / data.length;
    gradients.b2 += outputError;
    for (let j = 0; j < network.hidden; j++) {
      const activation = result.hidden[j];
      const hiddenError = outputError * network.w2[j] * (1 - activation * activation);
      gradients.w2[j] += outputError * activation;
      gradients.b1[j] += hiddenError;
      gradients.w1[j][0] += hiddenError * sample.x;
      gradients.w1[j][1] += hiddenError * sample.y;
    }
  }
  const updated: Network = {
    hidden: network.hidden,
    w1: network.w1.map((weights, j) =>
      weights.map((weight, i) => weight - learningRate * gradients.w1[j][i]),
    ),
    b1: network.b1.map((bias, j) => bias - learningRate * gradients.b1[j]),
    w2: network.w2.map((weight, j) => weight - learningRate * gradients.w2[j]),
    b2: network.b2 - learningRate * gradients.b2,
  };
  validateNetwork(updated);
  return { network: updated, loss: lossUnchecked(updated, data), gradients };
}

/**
 * Temporarily remove one hidden unit's contribution by zeroing its output
 * weight. This is an intervention for inference, not a unique explanation of
 * the learned representation. Further training can reactivate the unit.
 */
export function ablateNetwork(network: Network, index: number): Network {
  validateNetwork(network);
  if (!Number.isInteger(index) || index < 0 || index >= network.hidden) {
    throw new RangeError('Choose an existing hidden unit to ablate.');
  }
  return {
    hidden: network.hidden,
    w1: network.w1.map((weights) => [...weights]),
    b1: [...network.b1],
    w2: network.w2.map((weight, j) => (j === index ? 0 : weight)),
    b2: network.b2,
  };
}
