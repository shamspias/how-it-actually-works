// A complete two-input, two-hidden-unit network. No libraries.
// Run: node examples/backprop-step.mjs
// This very file also drives the browser's guided backpropagation lesson.

export function initialNetwork() {
  return {
    weights: [
      [0.5, 0.25],
      [-0.5, 1],
    ],
    biases: [0, 0],
    outputWeights: [0.5, 0.5],
    outputBias: 0,
  };
}

/** @param {ReturnType<typeof initialNetwork>} network */
export function explain(network, inputs = [1, 2], target = 2) {
  // FORWARD: multiply, add, then apply ReLU (keep positives; zero negatives).
  const sums = network.weights.map((row, j) =>
    row.reduce((sum, weight, i) => sum + weight * inputs[i], network.biases[j]),
  );
  const hidden = sums.map((sum) => Math.max(0, sum));
  const prediction = hidden.reduce(
    (sum, value, j) => sum + value * network.outputWeights[j],
    network.outputBias,
  );
  const error = prediction - target;
  const loss = 0.5 * error ** 2;

  // BACKWARD: multiply the local sensitivities along each connection.
  // For loss = error²/2, d(loss)/d(prediction) = error.
  const outputGradients = hidden.map((value) => error * value);
  // ReLU derivative is 1 above zero and 0 below. We choose 0 at its kink.
  const hiddenErrors = sums.map((sum, j) => error * network.outputWeights[j] * (sum > 0 ? 1 : 0));
  const weightGradients = hiddenErrors.map((localError) =>
    inputs.map((input) => localError * input),
  );
  return {
    inputs,
    target,
    sums,
    hidden,
    prediction,
    error,
    loss,
    gradients: {
      weights: weightGradients,
      biases: hiddenErrors,
      outputWeights: outputGradients,
      outputBias: error,
    },
  };
}

/** @param {ReturnType<typeof initialNetwork>} network */
export function trainOneStep(network, rate = 0.1, inputs = [1, 2], target = 2) {
  if (!Number.isFinite(rate) || rate <= 0) throw new RangeError('Use a finite positive rate.');
  const before = explain(network, inputs, target);
  const g = before.gradients;
  // Update every parameter using the SAME old-network snapshot.
  const next = {
    weights: network.weights.map((row, j) => row.map((w, i) => w - rate * g.weights[j][i])),
    biases: network.biases.map((b, j) => b - rate * g.biases[j]),
    outputWeights: network.outputWeights.map((v, j) => v - rate * g.outputWeights[j]),
    outputBias: network.outputBias - rate * g.outputBias,
  };
  return { before, network: next, after: explain(next, inputs, target) };
}

if (typeof process !== 'undefined' && process.argv[1]?.endsWith('backprop-step.mjs')) {
  const step = trainOneStep(initialNetwork());
  console.log('Guess before:', step.before.prediction, 'loss:', step.before.loss);
  console.log('First weight gradient:', step.before.gradients.weights[0][0]);
  console.log('First weight:', 0.5, '→', step.network.weights[0][0]);
  console.log('Guess after:', step.after.prediction, 'loss:', step.after.loss);
}
