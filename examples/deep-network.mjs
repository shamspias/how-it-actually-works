// A complete trainable chain: forward, backward, mean gradient, update.
// Run: node examples/deep-network.mjs
// The browser lesson imports these exact functions. No ML libraries.

/** @typedef {'linear' | 'relu' | 'tanh'} Activation */
/** @typedef {{weight: number, bias: number}} Layer */
/** @typedef {{layers: Layer[], activation: Activation, residual: boolean}} DeepNetwork */

/** @param {number} depth @param {Activation} activation */
export function makeDeepNetwork(depth = 2, activation = 'relu', residual = false, weight = 0.5) {
  if (!Number.isInteger(depth) || depth < 1 || depth > 16) {
    throw new RangeError('Choose an integer depth from 1 to 16.');
  }
  if (!['linear', 'relu', 'tanh'].includes(activation) || !Number.isFinite(weight)) {
    throw new RangeError('Choose a supported activation and a finite weight.');
  }
  return {
    layers: Array.from({ length: depth }, () => ({ weight, bias: 0 })),
    activation,
    residual,
  };
}

/** @param {DeepNetwork} model */
export function explainDeep(model, input = 1, target = 1) {
  if (![input, target, ...model.layers.flatMap((l) => [l.weight, l.bias])].every(Number.isFinite)) {
    throw new RangeError('Inputs, targets, weights, and biases must be finite.');
  }
  const branchScale = model.residual ? 0.25 : 1;
  let value = input;
  // FORWARD: each station changes the number, then passes it onward.
  const layers = model.layers.map(({ weight, bias }) => {
    const previous = value;
    const sum = weight * previous + bias;
    const activated =
      model.activation === 'relu'
        ? Math.max(0, sum)
        : model.activation === 'tanh'
          ? Math.tanh(sum)
          : sum;
    // ReLU has a kink at zero; this program chooses derivative zero there.
    const gateDerivative =
      model.activation === 'relu'
        ? sum > 0
          ? 1
          : 0
        : model.activation === 'tanh'
          ? 1 - activated ** 2
          : 1;
    value = (model.residual ? previous : 0) + branchScale * activated;
    const localDerivative = (model.residual ? 1 : 0) + branchScale * gateDerivative * weight;
    return {
      input: previous,
      sum,
      activated,
      output: value,
      gateDerivative,
      localDerivative,
      outputGradient: 0,
      inputGradient: 0,
      weightGradient: 0,
      biasGradient: 0,
    };
  });
  const prediction = value;
  const error = prediction - target;
  const loss = error ** 2 / 2;
  // BACKWARD: a sensitivity is a rate of change, not another prediction.
  let sensitivity = error; // d(loss)/d(prediction) for this particular loss.
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i];
    layer.outputGradient = sensitivity;
    const branchGradient = sensitivity * branchScale * layer.gateDerivative;
    layer.weightGradient = branchGradient * layer.input;
    layer.biasGradient = branchGradient;
    layer.inputGradient = sensitivity * layer.localDerivative;
    sensitivity = layer.inputGradient;
  }
  return {
    input,
    target,
    prediction,
    error,
    loss,
    layers,
    inputGradient: sensitivity,
    inputSensitivity: layers.reduce((product, layer) => product * layer.localDerivative, 1),
  };
}

/** @param {DeepNetwork} model @param {{input: number, target: number}[]} examples */
export function trainDeep(model, examples = [{ input: 1, target: 1 }], rate = 0.1) {
  if (examples.length === 0 || !Number.isFinite(rate) || rate <= 0) {
    throw new RangeError('Use at least one example and a finite, positive learning rate.');
  }
  const before = examples.map(({ input, target }) => explainDeep(model, input, target));
  // MINI-BATCH: average each parameter's gradient over the SAME old model.
  const gradients = model.layers.map((_, i) => ({
    weight: before.reduce((sum, trace) => sum + trace.layers[i].weightGradient, 0) / before.length,
    bias: before.reduce((sum, trace) => sum + trace.layers[i].biasGradient, 0) / before.length,
  }));
  const next = {
    ...model,
    layers: model.layers.map((layer, i) => ({
      weight: layer.weight - rate * gradients[i].weight,
      bias: layer.bias - rate * gradients[i].bias,
    })),
  };
  const after = examples.map(({ input, target }) => explainDeep(next, input, target));
  return {
    model: next,
    gradients,
    before,
    after,
    beforeLoss: before.reduce((sum, trace) => sum + trace.loss, 0) / before.length,
    afterLoss: after.reduce((sum, trace) => sum + trace.loss, 0) / after.length,
  };
}

if (typeof process !== 'undefined' && process.argv[1]?.endsWith('deep-network.mjs')) {
  let model = makeDeepNetwork();
  const step = trainDeep(model);
  console.log('First step:', step.beforeLoss, '→', step.afterLoss);
  console.log('Updated weight and bias at every station:', step.model.layers);
  for (let i = 0; i < 80; i++) model = trainDeep(model).model;
  console.log('After 80 updates on ONE example:', explainDeep(model).prediction);
  console.log('This is practice loss, not evidence about unseen examples.');
  for (const residual of [false, true]) {
    const trace = explainDeep(makeDeepNetwork(8, 'relu', residual));
    console.log(
      residual ? 'With a scaled bypass:' : 'Without a bypass:',
      'd(prediction)/d(input) =',
      trace.inputSensitivity,
    );
  }
}
