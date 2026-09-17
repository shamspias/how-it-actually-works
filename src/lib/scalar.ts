/** A deliberately small model whose complete training calculation fits on screen. */
export const SCALAR_INPUTS = [1, 2, 3] as const;
export const TARGET_WEIGHT = 2;
export const INITIAL_WEIGHT = 0.5;

export interface ScalarExample {
  input: number;
  target: number;
  prediction: number;
  error: number;
  squaredError: number;
  gradientContribution: number;
}

export interface ScalarStep {
  weightBefore: number;
  weightAfter: number;
  learningRate: number;
  lossBefore: number;
  lossAfter: number;
  gradient: number;
  examples: ScalarExample[];
}

export function scalarExamples(weight: number): ScalarExample[] {
  return SCALAR_INPUTS.map((input) => {
    const target = TARGET_WEIGHT * input;
    const prediction = weight * input;
    const error = prediction - target;
    return {
      input,
      target,
      prediction,
      error,
      squaredError: error ** 2,
      gradientContribution: error * input,
    };
  });
}

/** L(w) = (1 / 2n) Σ(wx − y)². The 1/2 makes its derivative simpler. */
export function scalarLoss(weight: number): number {
  return (
    scalarExamples(weight).reduce((sum, item) => sum + item.squaredError, 0) /
    (2 * SCALAR_INPUTS.length)
  );
}

/** dL/dw = (1 / n) Σ(wx − y)x. This is an exact full-batch gradient. */
export function scalarGradient(weight: number): number {
  return (
    scalarExamples(weight).reduce((sum, item) => sum + item.gradientContribution, 0) /
    SCALAR_INPUTS.length
  );
}

export function scalarStep(weight: number, learningRate: number): ScalarStep {
  if (!Number.isFinite(weight) || !Number.isFinite(learningRate) || learningRate <= 0) {
    throw new RangeError('The weight and positive learning rate must be finite.');
  }
  const gradient = scalarGradient(weight);
  const weightAfter = weight - learningRate * gradient;
  const lossAfter = scalarLoss(weightAfter);
  if (!Number.isFinite(lossAfter) || Math.abs(weightAfter) > 1_000_000) {
    throw new RangeError('The step grew too large. Reset and choose a smaller learning rate.');
  }
  return {
    weightBefore: weight,
    weightAfter,
    learningRate,
    lossBefore: scalarLoss(weight),
    lossAfter,
    gradient,
    examples: scalarExamples(weight),
  };
}
