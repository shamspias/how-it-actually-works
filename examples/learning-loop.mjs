// Run: node examples/learning-loop.mjs
// Practice changes a dial. Prediction reads it. No ML library.
export const lesson = { input: 2, target: 4 };

export function predict(dial, input) {
  return dial * input;
}

export function practice(dial, input = lesson.input, target = lesson.target, rate = 0.1) {
  const guess = predict(dial, input);
  const error = guess - target;
  const loss = 0.5 * error ** 2;
  const gradient = error * input;
  const nextDial = dial - rate * gradient;
  return { dial, input, target, guess, error, loss, gradient, rate, nextDial };
}

if (typeof process !== 'undefined' && process.argv[1]?.endsWith('learning-loop.mjs')) {
  let dial = 1;
  for (let step = 0; step < 6; step++) {
    const receipt = practice(dial);
    console.log({ step: step + 1, ...receipt });
    dial = receipt.nextDial;
  }
  console.log('Keep the dial; predict for input 4:', predict(dial, 4));
  console.log('Prediction did not change the dial:', dial);
  console.log('This tiny model assumes output = dial × input. Fitting does not prove that rule.');
}
