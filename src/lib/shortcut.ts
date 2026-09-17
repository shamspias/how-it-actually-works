/** Two measured clues, not a pixel classifier: an intentionally confounded toy task. */
export type Shape = 'circle' | 'square';
export type Background = 'mint' | 'lavender';
export type ShortcutSample = {
  shape: Shape;
  background: Background;
  shapeFeature: number;
  backgroundFeature: number;
  label: 0 | 1;
};
export type ShortcutModel = { shapeWeight: number; backgroundWeight: number; bias: number };
export const SHORTCUT_STEPS = 600;
export const SHORTCUT_RATE = 0.15;
export const SHORTCUT_PENALTY = 0.025;
export const emptyShortcutModel = (): ShortcutModel => ({
  shapeWeight: 0,
  backgroundWeight: 0,
  bias: 0,
});

/** Independent draws: correlation is P(background agrees with the shape label). */
export function createShortcutData(
  count: number,
  seed: number,
  correlation: number,
): ShortcutSample[] {
  if (!Number.isSafeInteger(count) || count < 1)
    throw new RangeError('Example count must be a positive integer.');
  if (!Number.isSafeInteger(seed)) throw new RangeError('Seed must be an integer.');
  if (!Number.isFinite(correlation) || correlation < 0 || correlation > 1) {
    throw new RangeError('Correlation probability must lie between 0 and 1.');
  }
  let state = seed >>> 0;
  function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }
  return Array.from({ length: count }, () => {
    const label = random() < 0.5 ? 0 : 1;
    const shapeSign = label === 1 ? 1 : -1;
    const backgroundSign = random() < correlation ? shapeSign : -shapeSign;
    return {
      label,
      shape: label === 1 ? 'circle' : 'square',
      background: backgroundSign === 1 ? 'mint' : 'lavender',
      // The sign always reveals shape. Deliberately unequal feature scales,
      // plus L2 regularization, favor the larger feature when both correlate.
      shapeFeature: shapeSign * (0.25 + random() * 0.2),
      backgroundFeature: backgroundSign * (0.9 + random() * 0.2),
    };
  });
}

function sigmoid(logit: number): number {
  if (logit >= 0) return 1 / (1 + Math.exp(-logit));
  const exp = Math.exp(logit);
  return exp / (1 + exp);
}

export function predictShortcut(
  model: ShortcutModel,
  sample: Pick<ShortcutSample, 'shapeFeature' | 'backgroundFeature'>,
): number {
  return sigmoid(
    model.shapeWeight * sample.shapeFeature +
      model.backgroundWeight * sample.backgroundFeature +
      model.bias,
  );
}

function validateData(data: readonly ShortcutSample[]) {
  if (!data.length) throw new RangeError('Provide at least one training example.');
  for (const sample of data) {
    if (
      !Number.isFinite(sample.shapeFeature) ||
      !Number.isFinite(sample.backgroundFeature) ||
      (sample.label !== 0 && sample.label !== 1)
    ) {
      throw new RangeError('Examples need finite features and a binary label.');
    }
  }
}

/** Mean BCE + λ/2 × (shapeWeight² + backgroundWeight²). Bias is not penalized. */
export function shortcutLoss(model: ShortcutModel, data: readonly ShortcutSample[]): number {
  validateData(data);
  let total = 0;
  for (const sample of data) {
    const logit =
      model.shapeWeight * sample.shapeFeature +
      model.backgroundWeight * sample.backgroundFeature +
      model.bias;
    const signed = sample.label === 1 ? -logit : logit;
    total += Math.max(signed, 0) + Math.log1p(Math.exp(-Math.abs(signed)));
  }
  return (
    total / data.length +
    (SHORTCUT_PENALTY / 2) * (model.shapeWeight ** 2 + model.backgroundWeight ** 2)
  );
}

/** Always starts at zero; every displayed coefficient is obtained by these updates. */
export function trainShortcut(
  data: readonly ShortcutSample[],
  steps = SHORTCUT_STEPS,
): ShortcutModel {
  validateData(data);
  if (!Number.isSafeInteger(steps) || steps < 0)
    throw new RangeError('Steps must be a nonnegative integer.');
  const model = emptyShortcutModel();
  for (let step = 0; step < steps; step++) {
    let shapeGradient = 0;
    let backgroundGradient = 0;
    let biasGradient = 0;
    for (const sample of data) {
      const error = predictShortcut(model, sample) - sample.label;
      shapeGradient += error * sample.shapeFeature;
      backgroundGradient += error * sample.backgroundFeature;
      biasGradient += error;
    }
    model.shapeWeight -=
      SHORTCUT_RATE * (shapeGradient / data.length + SHORTCUT_PENALTY * model.shapeWeight);
    model.backgroundWeight -=
      SHORTCUT_RATE *
      (backgroundGradient / data.length + SHORTCUT_PENALTY * model.backgroundWeight);
    model.bias -= (SHORTCUT_RATE * biasGradient) / data.length;
  }
  return model;
}

export function shortcutAccuracy(model: ShortcutModel, data: readonly ShortcutSample[]): number {
  validateData(data);
  return (
    data.reduce(
      (correct, sample) =>
        correct + Number(Number(predictShortcut(model, sample) >= 0.5) === sample.label),
      0,
    ) / data.length
  );
}
