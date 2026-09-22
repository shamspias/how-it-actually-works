// Run: node examples/error-and-gradient.mjs
// All three cards start with the same error: guess - target = -2.
export const cards = [
  { name: 'Same direction', input: 2, target: 4 },
  { name: 'Opposite direction', input: -2, target: 0 },
  { name: 'No connection', input: 0, target: 2 },
];

export function measure(weight, input, target) {
  const guess = weight * input;
  const error = guess - target;
  const loss = 0.5 * error ** 2;
  // Chain rule: loss changes with guess; guess changes with weight.
  const gradient = error * input;
  return { weight, guess, error, loss, gradient };
}

export function update(weight, input, target, rate = 0.1) {
  const before = measure(weight, input, target);
  const nextWeight = weight - rate * before.gradient;
  const after = measure(nextWeight, input, target);
  return { before, after };
}

// A preview measures a different weight. Only update returns the saved next step.
if (
  typeof process !== 'undefined' &&
  process.argv[1] &&
  import.meta.url === new URL(process.argv[1], 'file:').href
) {
  console.table(
    cards.map(({ name, input, target }) => {
      const { before, after } = update(1, input, target);
      return {
        name,
        input,
        error: before.error,
        gradient: before.gradient,
        oldWeight: before.weight,
        newWeight: after.weight,
        oldLoss: before.loss,
        newLoss: after.loss,
      };
    }),
  );
}
