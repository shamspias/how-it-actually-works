// Run: node examples/gradient-descent.mjs
// One example: input = 1, correct answer = 2, prediction = weight * input.
export function loss(weight) {
  return 0.5 * (weight - 2) ** 2;
}

export function slope(weight) {
  return weight - 2; // derivative of 0.5 * (weight - 2)^2
}

export function train(start = 5, rate = 0.3, steps = 20) {
  let weight = start;
  const history = [{ step: 0, weight, loss: loss(weight) }];
  for (let step = 1; step <= steps; step += 1) {
    const gradient = slope(weight);
    weight = weight - rate * gradient;
    history.push({ step, weight, loss: loss(weight) });
  }
  return history;
}

// Importing this file only defines functions. Running it prints the experiment.
if (
  typeof process !== 'undefined' &&
  process.argv[1] &&
  import.meta.url === new URL(process.argv[1], 'file:').href
) {
  console.table(train());
}
