// One real scaled dot-product attention head. No ML imports.
// Run: node examples/attention.mjs [--causal]
// All embeddings/projections below are hand-designed teaching numbers.
export const embeddings = [
  [2, 0, 2, 0],
  [0, 2, 0, 2],
  [0, 0, 2, 0],
  [0, 0, 0, 2],
];
export const Wq = [
  [0, 0, 1, 0],
  [0, 0, 0, 1],
];
export const Wk = [
  [1, 0, 0, 0],
  [0, 1, 0, 0],
];
export const Wv = [
  [0.5, 0, 0, 0],
  [0, 0.5, 0, 0],
];

export function attention(xs = embeddings, queryIndex = 2, causal = false) {
  const dot = (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0);
  const project = (matrix, x) => matrix.map((row) => dot(row, x));
  const query = project(Wq, xs[queryIndex]);
  const keys = xs.map((x) => project(Wk, x));
  const values = xs.map((x) => project(Wv, x));
  const scores = keys.map((key) => dot(query, key) / Math.sqrt(query.length));
  const allowed = xs.map((_, j) => !causal || j <= queryIndex);
  // Stable softmax: exclude hidden positions before choosing the maximum.
  const max = Math.max(...scores.filter((_, j) => allowed[j]));
  const exp = scores.map((score, j) => (allowed[j] ? Math.exp(score - max) : 0));
  const sum = exp.reduce((a, b) => a + b, 0);
  const weights = exp.map((value) => value / sum);
  const output = values[0].map((_, d) =>
    values.reduce((total, value, j) => total + weights[j] * value[d], 0),
  );
  return { query, keys, values, scores, weights, output };
}

if (typeof process !== 'undefined' && process.argv[1]?.endsWith('attention.mjs')) {
  const causal = process.argv.includes('--causal');
  for (const [index, word] of [
    [2, 'she'],
    [3, 'it'],
  ]) {
    console.log(word, attention(embeddings, index, causal));
  }
  console.log('Forward computation only: these vectors have not learned language.');
}
