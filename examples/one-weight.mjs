// Three examples. One multiplier. No imports.
// Run: node examples/one-weight.mjs
const data = [
  [1, 2],
  [2, 4],
  [3, 6],
];
let weight = 0.5;
const learningRate = 0.1;

for (let step = 0; step < 8; step++) {
  let loss = 0;
  let gradient = 0;
  for (const [input, answer] of data) {
    const guess = weight * input;
    const error = guess - answer;
    loss += (0.5 * error * error) / data.length;
    // Chain rule: d(half error²)/d(weight) = error × input.
    gradient += (error * input) / data.length;
  }
  const next = weight - learningRate * gradient;
  console.log({ step, weight, loss, gradient, next });
  weight = next;
}
