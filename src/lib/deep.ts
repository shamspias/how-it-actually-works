// Keep the browser, the runnable example, and the tests on the same arithmetic.
export { makeDeepNetwork, explainDeep, trainDeep } from '../../examples/deep-network.mjs';
import type { makeDeepNetwork } from '../../examples/deep-network.mjs';

export type DeepNetwork = ReturnType<typeof makeDeepNetwork>;
export type DeepActivation = DeepNetwork['activation'];

/** Collapse a chain of affine maps, including its optional identity bypasses. */
export function collapseLinear(model: DeepNetwork) {
  if (model.activation !== 'linear') {
    throw new RangeError('A nonlinear chain cannot generally collapse into one affine map.');
  }
  let slope = 1;
  let intercept = 0;
  const scale = model.residual ? 0.25 : 1;
  for (const layer of model.layers) {
    const factor = (model.residual ? 1 : 0) + scale * layer.weight;
    slope *= factor;
    intercept = factor * intercept + scale * layer.bias;
  }
  return { slope, intercept };
}
