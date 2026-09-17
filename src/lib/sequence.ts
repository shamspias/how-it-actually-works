/** Arithmetic for the tiny architecture lesson. No tensor or ML libraries. */
export type Vector = readonly number[];
export type Matrix = readonly Vector[];

function checkVector(vector: Vector, name: string) {
  if (!vector.length || vector.some((value) => !Number.isFinite(value))) {
    throw new RangeError(`${name} must be a nonempty vector of finite numbers.`);
  }
}

export function dot(left: Vector, right: Vector): number {
  checkVector(left, 'Left vector');
  checkVector(right, 'Right vector');
  if (left.length !== right.length) throw new RangeError('Vector dimensions must agree.');
  const result = left.reduce((total, value, index) => total + value * right[index], 0);
  if (!Number.isFinite(result)) throw new RangeError('Dot product overflowed.');
  return result;
}

/** Each matrix row produces one output coordinate: matrix × column vector. */
export function project(matrix: Matrix, vector: Vector): number[] {
  if (!matrix.length) throw new RangeError('Projection needs at least one row.');
  return matrix.map((row) => dot(row, vector));
}

/** Subtracting the largest score avoids exp(large positive number) overflow. */
export function softmax(scores: Vector, allowed: readonly boolean[] = scores.map(() => true)) {
  checkVector(scores, 'Scores');
  if (allowed.length !== scores.length || !allowed.some(Boolean)) {
    throw new RangeError('At least one score must be allowed; mask dimensions must agree.');
  }
  const maximum = Math.max(...scores.filter((_, index) => allowed[index]));
  const exponentials = scores.map((score, index) =>
    allowed[index] ? Math.exp(score - maximum) : 0,
  );
  const total = exponentials.reduce((sum, value) => sum + value, 0);
  return exponentials.map((value) => value / total);
}

export interface AttentionTrace {
  query: number[];
  keys: number[][];
  values: number[][];
  products: number[];
  scores: number[];
  allowed: boolean[];
  weights: number[];
  contributions: number[][];
  output: number[];
}

/** One query row of genuine scaled dot-product self-attention. */
export function attend(
  embeddings: Matrix,
  queryIndex: number,
  projections: { query: Matrix; key: Matrix; value: Matrix },
  causal = false,
): AttentionTrace {
  if (!Number.isInteger(queryIndex) || queryIndex < 0 || queryIndex >= embeddings.length) {
    throw new RangeError('Query index must select an input.');
  }
  const query = project(projections.query, embeddings[queryIndex]);
  const keys = embeddings.map((vector) => project(projections.key, vector));
  const values = embeddings.map((vector) => project(projections.value, vector));
  const products = keys.map((key) => dot(query, key));
  const scores = products.map((product) => product / Math.sqrt(query.length));
  const allowed = embeddings.map((_, index) => !causal || index <= queryIndex);
  const weights = softmax(scores, allowed);
  const contributions = values.map((value, index) =>
    value.map((coordinate) => coordinate * weights[index]),
  );
  const output = contributions[0].map((_, coordinate) =>
    contributions.reduce((sum, contribution) => sum + contribution[coordinate], 0),
  );
  return { query, keys, values, products, scores, allowed, weights, contributions, output };
}

// The first two coordinates offer information. The last two request it.
// These are chosen teaching numbers, NOT embeddings obtained by training.
export const WORD_CARDS = {
  Mia: [2, 0, 2, 0],
  Omar: [1.5, 0, 2, 0],
  cup: [0, 2, 0, 2],
  ball: [0, 1.5, 0, 2],
  she: [0, 0, 2, 0],
  it: [0, 0, 0, 2],
} satisfies Record<string, number[]>;
export type WordCard = keyof typeof WORD_CARDS;
export const TOY_PROJECTIONS = {
  query: [
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ],
  key: [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
  ],
  value: [
    [0.5, 0, 0, 0],
    [0, 0.5, 0, 0],
  ],
};

export interface MemoryInput {
  label: string;
  value: number;
  marked: boolean;
}
export interface MemoryTrace extends MemoryInput {
  before: number;
  gate: number;
  retained: number;
  written: number;
  after: number;
}

/** A scalar gated recurrence inspired by selection. This is NOT a Mamba block. */
export function selectiveMemory(
  inputs: readonly MemoryInput[],
  irrelevantGate: number,
  markedGate = 1,
  initial = 0,
): MemoryTrace[] {
  if (!Number.isFinite(initial)) throw new RangeError('Initial state must be finite.');
  if ([irrelevantGate, markedGate].some((gate) => !Number.isFinite(gate) || gate < 0 || gate > 1)) {
    throw new RangeError('Write gates must lie between zero and one.');
  }
  let state = initial;
  return inputs.map((input) => {
    if (!Number.isFinite(input.value)) throw new RangeError('Memory inputs must be finite.');
    const gate = input.marked ? markedGate : irrelevantGate;
    const before = state;
    const retained = (1 - gate) * before;
    const written = gate * input.value;
    state = retained + written;
    return { ...input, before, gate, retained, written, after: state };
  });
}

export const MEMORY_CARDS: MemoryInput[] = [
  { label: 'Remember 7', value: 7, marked: true },
  { label: 'Noise 2', value: 2, marked: false },
  { label: 'Noise 9', value: 9, marked: false },
  { label: 'Noise 1', value: 1, marked: false },
];
