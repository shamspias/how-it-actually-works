// The visual lesson and runnable example use the same arithmetic.
export {
  inspectBlueprint,
  nextTokenPairs,
  tokenLoss,
  defaultBlueprint,
} from '../../examples/read-architecture.mjs';

export type Blueprint = {
  tokens: number;
  width: number;
  heads: number;
  hidden: number;
  blocks: number;
  vocabulary: number;
  context: number;
};

export const trainingWords = ['Mia', 'likes', 'warm', 'tea', 'today', '<end>'];

export function configurationError(config: Blueprint): string | null {
  if (config.width % config.heads !== 0) {
    return `${config.width} numbers cannot split evenly into ${config.heads} heads. Try 1, 2, or 4 heads for this width.`;
  }
  if (config.tokens > config.context)
    return 'This example needs more positions than the position table has.';
  return null;
}
