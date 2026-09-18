import { describe, expect, it } from 'vitest';
import {
  CARDS,
  buildFeatureStory,
  createLearner,
  featureVotes,
  learn,
  meanLoss,
  mostConsequentialUnit,
  mute,
  predict,
} from './features';
import { createNetwork, forward, trainStep, loss } from './network';

describe('learned feature experiment', () => {
  it('matches the existing independent network engine for initialization and a real update', () => {
    const featureModel = createLearner();
    const network = createNetwork(4, 42);
    expect(featureModel).toEqual({
      w1: network.w1,
      b1: network.b1,
      w2: network.w2,
      b2: network.b2,
    });
    expect(meanLoss(featureModel)).toBeCloseTo(loss(network, CARDS), 14);
    for (const card of CARDS)
      expect(predict(featureModel, card).p).toBeCloseTo(forward(network, card).prediction, 14);
    const actual = learn(featureModel).model;
    const expected = trainStep(network, CARDS, 0.5).network;
    expect(actual.w1).toEqual(expected.w1);
    expect(actual.b1).toEqual(expected.b1);
    expect(actual.w2).toEqual(expected.w2);
    expect(actual.b2).toEqual(expected.b2);
  });

  it('every analytic gradient agrees with an independent central difference', () => {
    const model = createLearner(17);
    const { gradient } = learn(model);
    const epsilon = 1e-5;
    const paths: Array<['w1', number, number] | ['b1' | 'w2', number] | ['b2']> = [['b2']];
    for (let j = 0; j < 4; j++) paths.push(['w1', j, 0], ['w1', j, 1], ['b1', j], ['w2', j]);
    for (const path of paths) {
      const left = structuredClone(model);
      const right = structuredClone(model);
      let expected = 0;
      if (path[0] === 'w1') {
        left.w1[path[1]][path[2]] -= epsilon;
        right.w1[path[1]][path[2]] += epsilon;
        expected = gradient.w1[path[1]][path[2]];
      } else if (path[0] === 'b2') {
        left.b2 -= epsilon;
        right.b2 += epsilon;
        expected = gradient.b2;
      } else {
        left[path[0]][path[1]] -= epsilon;
        right[path[0]][path[1]] += epsilon;
        expected = gradient[path[0]][path[1]];
      }
      expect((meanLoss(right) - meanLoss(left)) / (2 * epsilon)).toBeCloseTo(expected, 8);
    }
  });

  it('averages four chain-rule votes at the old weights without mutating those weights', () => {
    const model = createLearner();
    const saved = structuredClone(model);
    const { gradient } = learn(model);
    for (let unit = 0; unit < 4; unit++) {
      for (const input of [0, 1] as const) {
        const votes = featureVotes(model, unit, input);
        expect(votes.reduce((sum, vote) => sum + vote.gradient, 0) / CARDS.length).toBeCloseTo(
          gradient.w1[unit][input],
          14,
        );
      }
    }
    expect(model).toEqual(saved);
  });

  it('changes internal responses and learns all four binary cards reproducibly', () => {
    const frames = buildFeatureStory();
    expect(frames).toEqual(buildFeatureStory());
    expect(frames.map((frame) => frame.step)).toEqual([0, 1, 10, 50, 150, 400, 1000, 2400]);
    const before = frames[0].model;
    const after = frames.at(-1)!.model;
    expect(meanLoss(after)).toBeLessThan(0.003);
    for (const card of CARDS) {
      expect(predict(before, card).hidden).not.toEqual(predict(after, card).hidden);
      expect(Math.abs(predict(after, card).p - card.label)).toBeLessThan(0.01);
    }
  });

  it('disconnects exactly one learned contribution and measures its causal effect', () => {
    const trained = buildFeatureStory().at(-1)!.model;
    const saved = structuredClone(trained);
    const unit = mostConsequentialUnit(trained);
    expect(unit).toBe(3);
    const disconnected = mute(trained, unit);
    expect(disconnected.w1).toEqual(trained.w1);
    expect(disconnected.b1).toEqual(trained.b1);
    expect(disconnected.b2).toEqual(trained.b2);
    expect(disconnected.w2[unit]).toBe(0);
    expect(disconnected.w2.filter((_, index) => index !== unit)).toEqual(
      trained.w2.filter((_, index) => index !== unit),
    );
    expect(meanLoss(disconnected)).toBeGreaterThan(0.4);
    expect(CARDS.map((card) => predict(disconnected, card).p)).not.toEqual(
      CARDS.map((card) => predict(trained, card).p),
    );
    for (const card of CARDS)
      expect(predict(disconnected, card).hidden).toEqual(predict(trained, card).hidden);
    expect(trained).toEqual(saved);
    expect(() => mute(trained, -1)).toThrow(RangeError);
    expect(() => mute(trained, 4)).toThrow(RangeError);
  });

  it('using a saved model repeatedly leaves its weights unchanged', () => {
    const model = buildFeatureStory().at(-1)!.model;
    const saved = structuredClone(model);
    const expected = CARDS.map((card) => predict(model, card));
    for (let trial = 0; trial < 5; trial++)
      expect(CARDS.map((card) => predict(model, card))).toEqual(expected);
    expect(model).toEqual(saved);
  });
});
