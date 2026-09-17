import { describe, expect, it } from 'vitest';
import {
  attend,
  dot,
  MEMORY_CARDS,
  project,
  selectiveMemory,
  softmax,
  TOY_PROJECTIONS,
  WORD_CARDS,
} from './sequence';

describe('scaled dot-product attention', () => {
  it('matches an independently hand-computed attention row', () => {
    const identity = [
      [1, 0],
      [0, 1],
    ];
    const result = attend(
      [
        [1, 0],
        [0, 1],
      ],
      0,
      { query: identity, key: identity, value: identity },
    );
    const expectedFirst = Math.exp(1 / Math.sqrt(2)) / (Math.exp(1 / Math.sqrt(2)) + 1);
    expect(result.products).toEqual([1, 0]);
    expect(result.weights[0]).toBeCloseTo(expectedFirst, 13);
    expect(result.output[0]).toBeCloseTo(expectedFirst, 13);
    expect(result.output[1]).toBeCloseTo(1 - expectedFirst, 13);
  });

  it('causal masking forbids future values even when they match much better', () => {
    const identity = [
      [1, 0],
      [0, 1],
    ];
    const embeddings = [
      [1, 0],
      [10, 0],
    ];
    const projections = { query: identity, key: identity, value: identity };
    expect(attend(embeddings, 0, projections, false).output[0]).toBeGreaterThan(9);
    const causal = attend(embeddings, 0, projections, true);
    expect(causal.allowed).toEqual([true, false]);
    expect(causal.weights).toEqual([1, 0]);
    expect(causal.output).toEqual([1, 0]);
  });

  it('stays normalized with extreme scores, shifts, and masked maxima', () => {
    expect(softmax([10000, 10000])).toEqual([0.5, 0.5]);
    const reference = softmax([1, 2, 3]);
    softmax([10001, 10002, 10003]).forEach((value, index) =>
      expect(value).toBeCloseTo(reference[index], 13),
    );
    expect(softmax([10000, -10000], [false, true])).toEqual([0, 1]);
  });

  it('selected query changes the fixed toy routing without changing its weights', () => {
    const embeddings = [WORD_CARDS.Mia, WORD_CARDS.cup, WORD_CARDS.she, WORD_CARDS.it];
    const original = structuredClone(TOY_PROJECTIONS);
    const person = attend(embeddings, 2, TOY_PROJECTIONS);
    const object = attend(embeddings, 3, TOY_PROJECTIONS);
    expect(person.weights[0]).toBeGreaterThan(0.8);
    expect(object.weights[1]).toBeGreaterThan(0.8);
    expect(person.output[0]).toBeGreaterThan(person.output[1]);
    expect(object.output[1]).toBeGreaterThan(object.output[0]);
    expect(TOY_PROJECTIONS).toEqual(original);
  });

  it('rejects incompatible dimensions, empty/all-masked vectors and nonfinite values', () => {
    expect(() => dot([1], [1, 2])).toThrow();
    expect(() => project([], [1])).toThrow();
    expect(() => softmax([])).toThrow();
    expect(() => softmax([1], [false])).toThrow();
    expect(() => softmax([1], [true, false])).toThrow();
    expect(() => softmax([Infinity])).toThrow();
    expect(() => attend([[1]], 1, TOY_PROJECTIONS)).toThrow();
  });
});

describe('input-controlled scalar memory', () => {
  it('retains the marked value through distractors when their write gate is closed', () => {
    expect(selectiveMemory(MEMORY_CARDS, 0).map((step) => step.after)).toEqual([7, 7, 7, 7]);
  });

  it('matches a hand-computed recurrence when irrelevant inputs leak into memory', () => {
    const steps = selectiveMemory(MEMORY_CARDS, 0.5);
    expect(steps.map((step) => step.after)).toEqual([7, 4.5, 6.75, 3.875]);
    expect(steps[1]).toMatchObject({ before: 7, gate: 0.5, retained: 3.5, written: 1, after: 4.5 });
    expect(selectiveMemory(MEMORY_CARDS, 1).map((step) => step.after)).toEqual([7, 2, 9, 1]);
  });

  it('overwrites earlier marked content, exposing the one-slot memory tradeoff', () => {
    const inputs = [...MEMORY_CARDS, { label: 'Remember 4', value: 4, marked: true }];
    const original = structuredClone(inputs);
    expect(selectiveMemory(inputs, 0).at(-1)?.after).toBe(4);
    expect(inputs).toEqual(original);
  });

  it('validates finite initial values, gates and inputs', () => {
    expect(() => selectiveMemory(MEMORY_CARDS, -1)).toThrow();
    expect(() => selectiveMemory(MEMORY_CARDS, 0, 2)).toThrow();
    expect(() => selectiveMemory(MEMORY_CARDS, 0, 1, Infinity)).toThrow();
    expect(() => selectiveMemory([{ label: 'bad', marked: false, value: NaN }], 0)).toThrow();
  });
});
