// Exact arithmetic can forecast this particular training process.
// Run: node examples/predict-before-training.mjs
const target = 3,
  initial = 0,
  rate = 0.35,
  steps = 8;
const forecast = target + (initial - target) * (1 - rate) ** steps;
let weight = initial;
for (let step = 0; step < steps; step++) {
  const gradient = weight - target; // loss = (weight-target)² / 2
  weight -= rate * gradient;
}
console.log('Forecast:', forecast, 'After actual updates:', weight);

// But three observations do not identify every unseen answer.
const ruleA = (x) => x;
const ruleB = (x) => x + 0.75 * x * (x - 1) * (x - 2);
for (const x of [0, 1, 2, 3]) {
  console.log({ input: x, ruleA: ruleA(x), ruleB: ruleB(x) });
}
// A and B fit the first three pairs. At input 3 they disagree.
// Faster hardware does not supply the missing observation or assumption.
