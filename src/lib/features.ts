/** The lesson and the copyable standalone example execute the same arithmetic. */
import {
  CARDS as rawCards,
  createLearner,
  learn as rawLearn,
  meanLoss as rawMeanLoss,
  mute as rawMute,
  predict as rawPredict,
} from '../../examples/learned-features.mjs';

export { createLearner };
export type FeatureModel = ReturnType<typeof createLearner>;
export const CARDS = rawCards as { x: number; y: number; label: 0 | 1 }[];
export const predict: (
  model: FeatureModel,
  card: { x: number; y: number },
) => { hidden: number[]; logit: number; p: number } = rawPredict;
export const learn: (
  model: FeatureModel,
  rate?: number,
) => { model: FeatureModel; gradient: FeatureModel } = rawLearn;
export const meanLoss: (model: FeatureModel) => number = rawMeanLoss;
export const mute: (model: FeatureModel, index: number) => FeatureModel = rawMute;
export const FEATURE_CHECKPOINTS = [0, 1, 10, 50, 150, 400, 1000, 2400] as const;
export type FeatureFrame = { step: number; model: FeatureModel; loss: number };

export function buildFeatureStory(): FeatureFrame[] {
  let model = createLearner();
  let step = 0;
  return FEATURE_CHECKPOINTS.map((checkpoint) => {
    while (step < checkpoint) {
      model = learn(model).model;
      step++;
    }
    return { step, model, loss: meanLoss(model) };
  });
}

/** Select a useful default intervention, measured by loss, not a neuron name. */
export function mostConsequentialUnit(model: FeatureModel): number {
  const losses = model.w2.map((_, j) => meanLoss(mute(model, j)));
  return losses.indexOf(Math.max(...losses));
}

/** Each card's unaveraged chain-rule contribution to one input weight. */
export function featureVotes(model: FeatureModel, unit: number, input: 0 | 1) {
  return CARDS.map((card) => {
    const { p, hidden } = predict(model, card);
    const error = p - card.label;
    const downstream = model.w2[unit];
    const localSlope = 1 - hidden[unit] ** 2;
    const value = input === 0 ? card.x : card.y;
    return {
      error,
      downstream,
      localSlope,
      value,
      gradient: error * downstream * localSlope * value,
    };
  });
}
