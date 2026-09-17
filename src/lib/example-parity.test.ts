import { expect, it } from 'vitest';
import { attention, embeddings } from '../../examples/attention.mjs';
import { cards, remember } from '../../examples/selective-state.mjs';
import { budget } from '../../examples/parameter-count.mjs';
import { attend, selectiveMemory, TOY_PROJECTIONS } from './sequence';
import { denseNetworkBudget } from './theory';

it('standalone attention agrees with the visual engine, including causal masking', () => {
  for (const causal of [false, true])
    for (let query = 0; query < embeddings.length; query++) {
      const actual = attention(embeddings, query, causal);
      const expected = attend(embeddings, query, TOY_PROJECTIONS, causal);
      expect(actual.weights).toEqual(expected.weights);
      expect(actual.output).toEqual(expected.output);
    }
});

it('standalone selective memory agrees with the animation at every step', () => {
  for (const gate of [0, 0.5, 1]) {
    expect(remember(cards, gate)).toEqual(
      selectiveMemory(
        cards.map((c) => ({ ...c, label: 'card' })),
        gate,
      ).map((s) => s.after),
    );
  }
});

it('standalone parameter budget agrees with the calculator for small and large models', () => {
  for (const width of [2, 32, 8192])
    for (const depth of [1, 3, 16]) {
      const expected = denseNetworkBudget(8, width, depth, 2);
      expect(budget(8, width, depth, 2).parameters).toBe(expected.totalParameters);
      expect(budget(8, width, depth, 2).float32Bytes).toBe(expected.float32Bytes);
    }
});
