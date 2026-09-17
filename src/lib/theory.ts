/** Small, inspectable calculations used by the prediction and scale lessons. */
export const AMBIGUITY_INPUTS = [0, 1, 2] as const;

function finite(value: number, name: string) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite.`);
}

function positiveInteger(value: number, name: string) {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a positive safe integer.`);
  }
}

function validateQuadratic(initial: number, target: number, rate: number, steps: number) {
  finite(initial, 'Initial weight');
  finite(target, 'Target');
  finite(rate, 'Learning rate');
  if (rate < 0) throw new RangeError('Learning rate must be nonnegative.');
  if (!Number.isSafeInteger(steps) || steps < 0) {
    throw new RangeError('Steps must be a nonnegative safe integer.');
  }
}

/** Closed form for gradient descent on L(w) = 1/2 (w - target)^2. */
export function predictQuadraticWeight(
  initial: number,
  target: number,
  rate: number,
  steps: number,
): number {
  validateQuadratic(initial, target, rate, steps);
  const predicted = target + (initial - target) * (1 - rate) ** steps;
  finite(predicted, 'Predicted weight');
  return predicted;
}

/** Independently run every gradient update; element zero is the initial weight. */
export function quadraticTrajectory(
  initial: number,
  target: number,
  rate: number,
  steps: number,
): number[] {
  validateQuadratic(initial, target, rate, steps);
  const weights = [initial];
  for (let step = 0; step < steps; step++) {
    const gradient = weights[step] - target;
    const next = weights[step] - rate * gradient;
    finite(next, 'Updated weight');
    weights.push(next);
  }
  return weights;
}

/** Both candidate worlds agree at every AMBIGUITY_INPUTS observation. */
export function straightRule(x: number): number {
  finite(x, 'Input');
  return x;
}

export function curvedRule(x: number): number {
  finite(x, 'Input');
  const result = x + 0.75 * x * (x - 1) * (x - 2);
  finite(result, 'Rule output');
  return result;
}

/**
 * Uniform true/empirical error gap for a finite fixed class and i.i.d. data.
 * Right/wrong loss is in [0,1]. Confidence is 1-delta over the sampled dataset.
 * This is a gap bound, not a prediction of training error or final accuracy.
 */
export function finiteClassErrorBound(candidates: number, samples: number, delta: number): number {
  positiveInteger(candidates, 'Candidate count');
  positiveInteger(samples, 'Sample count');
  finite(delta, 'Failure probability');
  if (delta <= 0 || delta >= 1)
    throw new RangeError('Failure probability must lie strictly between zero and one.');
  return Math.sqrt((Math.log(2) + Math.log(candidates) - Math.log(delta)) / (2 * samples));
}

/**
 * Fully connected inputs → d equal-width hidden layers → outputs.
 * Every hidden/output unit has a distinct bias. Float32 storage counts only
 * parameters, excluding gradients, optimizer state, activations and overhead.
 */
export function denseNetworkBudget(inputs: number, width: number, depth: number, outputs: number) {
  positiveInteger(inputs, 'Input count');
  positiveInteger(width, 'Hidden width');
  positiveInteger(depth, 'Hidden depth');
  positiveInteger(outputs, 'Output count');
  const inputParameters = (inputs + 1) * width;
  const hiddenParameters = (depth - 1) * (width + 1) * width;
  const outputParameters = (width + 1) * outputs;
  const totalParameters = inputParameters + hiddenParameters + outputParameters;
  const float32Bytes = totalParameters * 4;
  if (!Number.isSafeInteger(float32Bytes))
    throw new RangeError('The budget exceeds exact integer arithmetic.');
  return { inputParameters, hiddenParameters, outputParameters, totalParameters, float32Bytes };
}
