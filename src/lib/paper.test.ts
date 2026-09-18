import { describe, expect, it } from 'vitest';
import { defaultBlueprint, inspectBlueprint, nextTokenPairs, tokenLoss } from './paper';

describe('specified decoder blueprint', () => {
  it('counts the complete tiny model by hand, including biases and two norms', () => {
    const result = inspectBlueprint();
    expect(result.ledger.map((row) => row.count)).toEqual([32, 32, 120, 40, 32, 152, 40]);
    expect(result.parameters).toBe(448);
    expect(result.headWidth).toBe(2);
    expect(result.float32WeightBytes).toBe(1792);
  });
  it('counts a one-dimensional single block without special-case assumptions', () => {
    const result = inspectBlueprint({
      tokens: 1,
      width: 1,
      heads: 1,
      hidden: 1,
      blocks: 1,
      vocabulary: 1,
      context: 1,
    });
    expect(result.parameters).toBe(20); // 1 + 1 + 6 + 2 + 4 + 4 + 2
  });
  it('reuses parameters across positions and partitions heads at fixed total width', () => {
    const longer = inspectBlueprint({ ...defaultBlueprint, tokens: 5, heads: 4 });
    expect(longer.parameters).toBe(448);
    expect(longer.activations.representations).toEqual([5, 4]);
    expect(longer.activations.perHead).toEqual([5, 1]);
    expect(longer.activations.attentionScores).toEqual([4, 5, 5]);
    expect(longer.activations.logits).toEqual([5, 8]);
    expect(inspectBlueprint({ ...defaultBlueprint, blocks: 3 }).parameters).toBe(620);
    expect(inspectBlueprint({ ...defaultBlueprint, context: 16 }).parameters).toBe(480);
  });
  it('rejects impossible splits, unsupported positions, and invalid integers', () => {
    expect(() => inspectBlueprint({ ...defaultBlueprint, heads: 3 })).toThrow('evenly');
    expect(() => inspectBlueprint({ ...defaultBlueprint, tokens: 9 })).toThrow('capacity');
    expect(() => inspectBlueprint({ ...defaultBlueprint, hidden: 0 })).toThrow('positive');
    expect(() => inspectBlueprint({ ...defaultBlueprint, width: 2.5 })).toThrow('integer');
    expect(() => inspectBlueprint({ ...defaultBlueprint, blocks: Infinity })).toThrow();
    expect(() => inspectBlueprint({ ...defaultBlueprint, width: 2 ** 30 })).toThrow(
      'exact integer',
    );
  });
  it('constructs next-token labels without exposing future positions to attention', () => {
    expect(nextTokenPairs(['Mia', 'likes', 'tea'])).toEqual([
      { input: 'Mia', target: 'likes' },
      { input: 'likes', target: 'tea' },
    ]);
    expect(inspectBlueprint().causalMask).toEqual([
      [true, false, false],
      [true, true, false],
      [true, true, true],
    ]);
    expect(() => nextTokenPairs(['Mia'])).toThrow('two');
  });
  it('rewards assigning more probability to the correct token', () => {
    expect(tokenLoss(0.25)).toBeCloseTo(1.38629436112);
    expect(tokenLoss(0.8)).toBeLessThan(tokenLoss(0.2));
    expect(tokenLoss(1)).toBeCloseTo(0);
    for (const invalid of [0, -1, 1.1, NaN]) expect(() => tokenLoss(invalid)).toThrow();
  });
});
