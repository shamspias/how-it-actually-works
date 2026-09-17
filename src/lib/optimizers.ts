/** One training example: prediction = weight, desired answer = 2. */
export type Landscape = 'bowl' | 'valleys';
export type SearchMethod = 'gradient' | 'momentum' | 'random' | 'grid';

export function hillLoss(weight: number, landscape: Landscape = 'bowl'): number {
  const error = weight - 2;
  return landscape === 'bowl'
    ? 0.5 * error * error
    : 0.08 * error * error + 1 - Math.cos(3 * error);
}

export function hillGradient(weight: number, landscape: Landscape = 'bowl'): number {
  return landscape === 'bowl' ? weight - 2 : 0.16 * (weight - 2) + 3 * Math.sin(3 * (weight - 2));
}

export interface SearchState {
  weight: number;
  velocity: number;
  steps: number;
  lossChecks: number;
  last: null | {
    before: number;
    proposal: number;
    gradient: number | null;
    accepted: boolean;
  };
}

export function startSearch(weight = 5): SearchState {
  if (!Number.isFinite(weight) || Math.abs(weight) > 1e6)
    throw new RangeError('Choose a finite starting weight.');
  return { weight, velocity: 0, steps: 0, lossChecks: 1, last: null };
}

/** Deterministic, repeatable random proposals, independent of global Math.random. */
function randomProposal(step: number): number {
  let bits = (step + 1 + 0x9e3779b9) >>> 0;
  bits = Math.imul(bits ^ (bits >>> 16), 0x21f0aaad);
  bits = Math.imul(bits ^ (bits >>> 15), 0x735a2d97);
  bits ^= bits >>> 15;
  return -2 + ((bits >>> 0) / 4294967296) * 8;
}

/** Gradient and momentum always take their proposed step; searches keep the best candidate. */
export function searchStep(
  state: SearchState,
  method: SearchMethod,
  rate: number,
  landscape: Landscape = 'bowl',
): SearchState {
  if (!Number.isFinite(rate) || rate <= 0 || rate > 3)
    throw new RangeError('Step size must be greater than 0 and at most 3.');
  const gradient =
    method === 'gradient' || method === 'momentum' ? hillGradient(state.weight, landscape) : null;
  const velocity = method === 'momentum' ? 0.7 * state.velocity + gradient! : 0;
  const proposal =
    method === 'random'
      ? randomProposal(state.steps)
      : method === 'grid'
        ? -2 + (state.steps % 41) * 0.2
        : state.weight - rate * (method === 'momentum' ? velocity : gradient!);
  if (!Number.isFinite(proposal) || Math.abs(proposal) > 1e6)
    throw new RangeError('These jumps grew too large. Restart with a smaller step size.');
  const accepted =
    gradient !== null || hillLoss(proposal, landscape) < hillLoss(state.weight, landscape);
  return {
    weight: accepted ? proposal : state.weight,
    velocity,
    steps: state.steps + 1,
    lossChecks: state.lossChecks + 1,
    last: { before: state.weight, proposal, gradient, accepted },
  };
}
