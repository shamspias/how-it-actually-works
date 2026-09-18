/**
 * Watch hidden features learn, then remove a learned unit's contribution.
 * Run: node examples/learned-features.mjs
 * Complete 2 → 4 → 1 learner: only arrays, arithmetic, and Math.
 * These four binary cards are the entire task, not an unseen test set.
 */
export const CARDS = [
  { x: 0, y: 0, label: 0 },
  { x: 0, y: 1, label: 1 },
  { x: 1, y: 0, label: 1 },
  { x: 1, y: 1, label: 0 },
];
export function createLearner(seed = 42) {
  let state = seed >>> 0;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let v = state;
    v = Math.imul(v ^ (v >>> 15), v | 1);
    v ^= v + Math.imul(v ^ (v >>> 7), v | 61);
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  };
  return {
    w1: Array.from({ length: 4 }, () => [2 * random() - 1, 2 * random() - 1]),
    b1: [0, 0, 0, 0],
    w2: Array.from({ length: 4 }, () => (2 * random() - 1) * Math.sqrt(6 / 5)),
    b2: 0,
  };
}
export function predict(model, card) {
  const hidden = model.w1.map((row, j) =>
    Math.tanh(row[0] * card.x + row[1] * card.y + model.b1[j]),
  );
  const logit = hidden.reduce((sum, h, j) => sum + model.w2[j] * h, model.b2);
  const p = logit >= 0 ? 1 / (1 + Math.exp(-logit)) : Math.exp(logit) / (1 + Math.exp(logit));
  return { hidden, logit, p };
}
export function meanLoss(model) {
  return (
    CARDS.reduce((sum, card) => {
      const { logit: z } = predict(model, card);
      return sum + Math.max(z, 0) - card.label * z + Math.log1p(Math.exp(-Math.abs(z)));
    }, 0) / CARDS.length
  );
}
export function learn(model, rate = 0.5) {
  const gradient = {
    w1: [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    b1: [0, 0, 0, 0],
    w2: [0, 0, 0, 0],
    b2: 0,
  };
  // Every example votes using the SAME old weights. Then average the votes.
  for (const card of CARDS) {
    const { hidden, p } = predict(model, card);
    const error = (p - card.label) / CARDS.length;
    gradient.b2 += error;
    for (let j = 0; j < 4; j++) {
      gradient.w2[j] += error * hidden[j];
      // The chain rule gives credit without labels for the hidden units.
      const hiddenError = error * model.w2[j] * (1 - hidden[j] ** 2);
      gradient.w1[j][0] += hiddenError * card.x;
      gradient.w1[j][1] += hiddenError * card.y;
      gradient.b1[j] += hiddenError;
    }
  }
  const updated = {
    w1: model.w1.map((row, j) => row.map((w, i) => w - rate * gradient.w1[j][i])),
    b1: model.b1.map((b, j) => b - rate * gradient.b1[j]),
    w2: model.w2.map((w, j) => w - rate * gradient.w2[j]),
    b2: model.b2 - rate * gradient.b2,
  };
  return { model: updated, gradient };
}
export function mute(model, index) {
  if (!Number.isInteger(index) || index < 0 || index >= model.w2.length)
    throw new RangeError('Choose a hidden unit from 0 to 3.');
  // Change only its outgoing contribution. Keep all other weights fixed.
  return { ...model, w2: model.w2.map((weight, j) => (j === index ? 0 : weight)) };
}
if (typeof process !== 'undefined' && process.argv[1]?.endsWith('learned-features.mjs')) {
  let model = createLearner();
  console.log('Before learning:', meanLoss(model));
  for (let step = 0; step < 2400; step++) model = learn(model).model;
  console.log('After learning:', meanLoss(model));
  console.table(
    CARDS.map((card) => ({
      ...card,
      p: predict(model, card).p,
      hidden: predict(model, card).hidden,
    })),
  );
  console.table(model.w2.map((_, j) => ({ mutedUnit: j + 1, loss: meanLoss(mute(model, j)) })));
  console.log(
    'Hidden responses changed through final-answer errors; nobody labeled each hidden unit.',
  );
}
