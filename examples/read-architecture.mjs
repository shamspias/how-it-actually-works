// A shape and parameter audit, not a trained language model.
// Run: node examples/read-architecture.mjs
// Teaching decoder: learned positions; two post-residual LayerNorms per block;
// biased Q/K/V/output and ReLU feed-forward projections; untied vocabulary head.
// Each block has its own weights. No final normalization, dropout, or cross-attention.
export const defaultBlueprint = {
  tokens: 3,
  width: 4,
  heads: 2,
  hidden: 8,
  blocks: 2,
  vocabulary: 8,
  context: 8,
};

export function inspectBlueprint(config = defaultBlueprint) {
  const { tokens: T, width: d, heads: h, hidden: f, blocks: L, vocabulary: V, context: C } = config;
  for (const name of Object.keys(defaultBlueprint)) {
    if (!Number.isSafeInteger(config[name]) || config[name] < 1) {
      throw new Error(`${name} must be a positive safe integer.`);
    }
  }
  if (d % h !== 0) throw new Error('Width must divide evenly into attention heads.');
  if (T > C) throw new Error('Token count cannot exceed the position table capacity.');

  // Count stored trainable numbers, including every bias and LayerNorm scale/shift.
  const ledger = [
    { name: 'Token lookup table', formula: 'V × d', count: V * d },
    { name: 'Position lookup table', formula: 'C × d', count: C * d },
    {
      name: 'Q, K, V projections in all blocks',
      formula: 'L × 3(d² + d)',
      count: L * 3 * (d * d + d),
    },
    { name: 'Attention output projections', formula: 'L × (d² + d)', count: L * (d * d + d) },
    { name: 'Two LayerNorms per block', formula: 'L × 4d', count: L * 4 * d },
    {
      name: 'Feed-forward expand + contract',
      formula: 'L × (2df + f + d)',
      count: L * (2 * d * f + f + d),
    },
    { name: 'Separate vocabulary projection', formula: 'd × V + V', count: d * V + V },
  ];
  const parameters = ledger.reduce((sum, row) => sum + row.count, 0);
  if (!Number.isSafeInteger(parameters))
    throw new Error('Parameter count exceeds exact integer arithmetic.');
  return {
    headWidth: d / h,
    parameters,
    ledger,
    activations: {
      representations: [T, d],
      perHead: [T, d / h],
      attentionScores: [h, T, T],
      expanded: [T, f],
      logits: [T, V],
    },
    float32WeightBytes: 4 * parameters,
    // A training row can read itself and earlier inputs, never future inputs.
    causalMask: Array.from({ length: T }, (_, row) =>
      Array.from({ length: T }, (_, col) => col <= row),
    ),
  };
}

/** @param {string[]} words */
export function nextTokenPairs(words) {
  if (words.length < 2) throw new Error('Provide at least two tokens.');
  return words.slice(0, -1).map((token, index) => ({ input: token, target: words[index + 1] }));
}

export function tokenLoss(targetProbability) {
  if (!(targetProbability > 0 && targetProbability <= 1)) {
    throw new Error('Target probability must be greater than 0 and at most 1.');
  }
  return -Math.log(targetProbability);
}

if (typeof process !== 'undefined' && process.argv[1]?.endsWith('read-architecture.mjs')) {
  const model = inspectBlueprint();
  console.table(model.ledger);
  console.log('Total trainable numbers:', model.parameters);
  console.log('Array shapes, not trained predictions:', model.activations);
  console.log('Next-token labels:', nextTokenPairs(['Mia', 'likes', 'warm', 'tea']));
  console.log('Loss when the correct next token receives probability 0.25:', tokenLoss(0.25));
  console.log(
    'Twice as many heads, same width:',
    inspectBlueprint({ ...defaultBlueprint, heads: 4 }).parameters,
  );
  console.log(
    'A longer example, same stored weights:',
    inspectBlueprint({ ...defaultBlueprint, tokens: 5 }).parameters,
  );
}
