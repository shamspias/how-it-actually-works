// A one-number selective memory. Inspired by selection, NOT a Mamba block.
// Run: node examples/selective-state.mjs
export const cards = [
  { value: 7, marked: true },
  { value: 2, marked: false },
  { value: 9, marked: false },
  { value: 1, marked: false },
];

export function remember(sequence = cards, noiseGate = 0) {
  let state = 0;
  const trace = [];
  for (const card of sequence) {
    // A supplied input flag decides what to write. No learned gate here.
    const gate = card.marked ? 1 : noiseGate;
    const retained = (1 - gate) * state;
    const written = gate * card.value;
    state = retained + written;
    trace.push(state);
  }
  return trace;
}

if (typeof process !== 'undefined' && process.argv[1]?.endsWith('selective-state.mjs')) {
  console.log('Ignore distractions:', remember(cards, 0));
  console.log('Half-write distractions:', remember(cards, 0.5));
  console.log('Replace with every distraction:', remember(cards, 1));
  console.log('Overwrite old marked value:', remember([...cards, { value: 4, marked: true }], 0));
}
