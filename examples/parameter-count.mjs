// Count a fully connected network without allocating its parameters.
// Run: node examples/parameter-count.mjs
export function budget(inputs = 8, width = 32, depth = 3, outputs = 2) {
  const inputLayer = (inputs + 1) * width;
  const hiddenLayers = (depth - 1) * (width + 1) * width;
  const outputLayer = (width + 1) * outputs;
  const parameters = inputLayer + hiddenLayers + outputLayer;
  return { inputLayer, hiddenLayers, outputLayer, parameters, float32Bytes: 4 * parameters };
}
if (typeof process !== 'undefined' && process.argv[1]?.endsWith('parameter-count.mjs')) {
  console.log('Small network:', budget());
  console.log('A much larger network:', budget(8, 8192, 16, 2));
  console.log('Storage counts only parameters, not activations, gradients, or optimizer state.');
}
