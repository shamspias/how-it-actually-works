import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import './word-help.css';

const words = [
  [
    'Pip / watering dial',
    'Pip is our pretend watering robot: a picture of a tiny computer program.',
    'You supply seed counts and water answers. Its saved dial is a number used to multiply the next seed count. Practice changes that number; Pip does not understand plants.',
  ],
  [
    'Input',
    'The information you give a model for one question.',
    'Two coordinates, an image converted to numbers, or the earlier tokens in a sentence.',
  ],
  [
    'Target / label',
    'The answer supplied for a practice example.',
    'A label can come from a person, a sensor, or the next word already present in text.',
  ],
  [
    'Model',
    'A chosen calculation together with the numbers it uses.',
    'A model might multiply an input by one saved weight, or use many connected layers.',
  ],
  [
    'Weight / parameter',
    'A stored number that training is allowed to adjust.',
    'A multiplier controls how much one input contributes. A bias is another adjustable number.',
  ],
  [
    'Bias',
    'A number added to a mixture before its next operation.',
    'In 2x + 3, the 3 shifts the result even when x is zero. This is distinct from social or statistical bias.',
  ],
  [
    'Prediction',
    'The answer the model computes for an input.',
    'A probability of 0.8 is a prediction, not a guarantee that the answer is correct.',
  ],
  [
    'Error / loss',
    'An error compares a guess with a target. A loss is the score the training rule tries to reduce.',
    'An error may be −2. Half its square is a loss of 2. Different tasks use different losses.',
  ],
  [
    'Training / learning',
    'Running updates that change the model’s stored parameters using an objective.',
    'Guess, measure a mistake, compute sensitivities, adjust parameters, repeat. There are also learning methods without gradients.',
  ],
  [
    'Inference',
    'Using the current model to make a prediction.',
    'Its temporary activations change with the question. Ordinary inference does not update trained weights.',
  ],
  [
    'Neuron / unit',
    'One small calculation that mixes inputs, usually followed by an activation function.',
    'It is not a person deciding an answer and need not represent one recognizable concept.',
  ],
  [
    'Activation',
    'A unit’s computed value for this input. An activation function is the rule that transforms its mixture.',
    'ReLU keeps positive values and outputs zero for negative values; tanh smoothly limits outputs between −1 and 1.',
  ],
  [
    'Feature / representation',
    'A computed description of an input that later calculations can use.',
    'Hidden-unit responses can become useful for a task as weights change. Their meanings are not automatically named.',
  ],
  [
    'Derivative / gradient',
    'A local sensitivity: how a tiny change in a parameter would affect the loss.',
    'The gradient contains one derivative per parameter. It is not the same quantity as the prediction error.',
  ],
  [
    'Chain rule',
    'Multiply sensitivities along a path, and add contributions from different paths.',
    'If a weight changes a mixture, which changes a guess, which changes a loss, connect those three effects.',
  ],
  [
    'Backpropagation',
    'An efficient way to compute gradients backward through a calculation.',
    'It shares intermediate results across paths. An optimizer then uses the gradients to update the weights.',
  ],
  [
    'Optimizer / learning rate',
    'The optimizer is the update rule. The learning rate controls the size of its adjustment.',
    'Gradient descent subtracts learning rate × gradient. A bigger step can overshoot.',
  ],
  [
    'Batch / epoch',
    'A batch groups examples for an update. An epoch is one pass through the training examples.',
    'Our full-batch toy loops use every example in one update. Real training often uses many smaller batches per epoch.',
  ],
  [
    'Initialization / seed',
    'Initialization chooses starting weights. A seed makes a random sequence repeatable.',
    'Different initial values can break symmetry between hidden units. A seed alone does not guarantee identical behavior across all hardware.',
  ],
  [
    'Generalization / overfitting',
    'Generalization means working on new examples. Overfitting means a good practice fit does not transfer well.',
    'Inspect a separate validation set while choosing settings; reserve an untouched test set for final evaluation.',
  ],
  [
    'Embedding / token',
    'A token is a piece of encoded input. An embedding maps its ID to a vector of numbers.',
    'Tokens need not be whole words. The ID itself is not a meaning or a numerical ranking.',
  ],
  [
    'Vector / matrix / tensor',
    'A vector is a list of numbers. A matrix is a table. A tensor is an array with some number of axes.',
    'A batch of B sequences, each with T positions and d features, can have shape B × T × d.',
  ],
  [
    'Attention / head',
    'Attention mixes value vectors using shares computed from queries and keys. A head has its own projections.',
    'The shares depend on the input; the projection weights are trained parameters. Several heads can mix information differently.',
  ],
  [
    'Mask / causal',
    'A mask blocks information from selected positions. A causal mask hides future tokens.',
    'When predicting the next token during training, the model must not peek at that answer.',
  ],
  [
    'Residual / skip connection',
    'Add a block’s input to its transformed output.',
    'The direct path also contributes a gradient. This can help optimization; it does not guarantee success.',
  ],
  [
    'Normalization',
    'Rescale values according to a specified rule.',
    'Layer normalization uses the current example’s feature statistics, then applies learned scale and shift. It is different from labeling data.',
  ],
  [
    'Logit / softmax',
    'Logits are unrestricted scores. Softmax converts a list of them into positive shares that sum to one.',
    'Language models can use these shares as next-token probabilities. High confidence can still be wrong.',
  ],
  [
    'State / Mamba',
    'State is a carried summary of earlier inputs. Mamba uses input-dependent selective state-space updates.',
    'Updating a temporary state while reading a sequence is different from training its parameters.',
  ],
  [
    'Architecture / hyperparameter',
    'Architecture specifies the connected operations. Hyperparameters configure the model or training process.',
    'Width, depth, and learning rate are chosen settings; a weight learned by an optimizer is a parameter.',
  ],
  [
    'Ablation / baseline',
    'An ablation removes or changes one part to test its effect. A baseline is a comparison system.',
    'A claimed improvement needs a fair comparison on the same task, data, and resource budget.',
  ],
];

export default function WordHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState('');
  useEffect(() => {
    if (open) ref.current?.showModal();
    else ref.current?.close();
  }, [open]);
  const found = words.filter((entry) =>
    entry.join(' ').toLowerCase().includes(query.toLowerCase().trim()),
  );
  return (
    <dialog
      ref={ref}
      className="word-help"
      aria-labelledby="word-help-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="word-help-top">
        <div>
          <p className="eyebrow">KEEP THE IDEA. LOOK UP THE WORD.</p>
          <h2 id="word-help-title">Explain a word.</h2>
        </div>
        <button className="icon-button" aria-label="Close word help" onClick={onClose}>
          <X size={21} />
        </button>
      </div>
      <p>
        You do not need to memorize these before you begin. Come back whenever a word gets in the
        way.
      </p>
      <label className="word-search">
        <Search size={19} />
        <span className="sr-only">Find a learning word</span>
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try weight, backpropagation, or tensor…"
        />
      </label>
      <p className="word-count" role="status">
        {found.length} explanations
      </p>
      <dl className="word-definitions">
        {found.map(([term, meaning, example]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>
              {meaning}
              <p>{example}</p>
            </dd>
          </div>
        ))}
      </dl>
      {!found.length && <p>Try a shorter word, or clear the search to browse the explanations.</p>}
    </dialog>
  );
}
