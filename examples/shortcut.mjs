// Two supplied measurements, not a pixel recognizer. No imports.
// Run: node examples/shortcut.mjs
const sigmoid = (z) => 1 / (1 + Math.exp(-z));
// Each row is [shape measurement, color measurement, correct label].
const biased = [
  [0.35, 1, 1],
  [-0.35, -1, 0],
];
const diverse = [...biased, [0.35, -1, 1], [-0.35, 1, 0]];
const changedWorld = [
  [0.35, -1, 1],
  [-0.35, 1, 0],
];

function fit(data) {
  let shapeWeight = 0,
    colorWeight = 0,
    bias = 0;
  for (let step = 0; step < 600; step++) {
    let ds = 0.025 * shapeWeight,
      dc = 0.025 * colorWeight,
      db = 0;
    for (const [shape, color, label] of data) {
      const p = sigmoid(shapeWeight * shape + colorWeight * color + bias);
      const error = (p - label) / data.length;
      ds += error * shape;
      dc += error * color;
      db += error;
    }
    shapeWeight -= 0.15 * ds;
    colorWeight -= 0.15 * dc;
    bias -= 0.15 * db;
  }
  return (data) =>
    data.map(([shape, color]) => sigmoid(shapeWeight * shape + colorWeight * color + bias));
}
console.log('Biased training, swapped colors:', fit(biased)(changedWorld));
console.log('Diverse training, swapped colors:', fit(diverse)(changedWorld));
// Color has a larger scale and we penalize large weights. This deliberately
// makes color attractive when correlated; not a law that every model prefers it.
