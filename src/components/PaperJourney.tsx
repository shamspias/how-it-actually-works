import { useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, Check, RotateCcw } from 'lucide-react';
import { CodeWalkthrough, ModeSwitcher, type LearningMode } from './LearningModes';
import {
  configurationError,
  defaultBlueprint,
  inspectBlueprint,
  nextTokenPairs,
  tokenLoss,
  trainingWords,
  type Blueprint,
} from '../lib/paper';
import code from '../../examples/read-architecture.mjs?raw';
import './paper.css';

const names = [
  'Read text',
  'Look up numbers',
  'Add position',
  'Gather context',
  'Add & normalize',
  'Mix & bend',
  'Repeat blocks',
  'Score words',
  'Measure mistake',
  'Send feedback',
];
const shortNames = [
  'Text',
  'Embedding',
  'Position',
  'Attention',
  'Add + norm',
  'Feed-forward',
  'Blocks',
  'Word scores',
  'Loss',
  'Backprop',
];
const codeLines = (start: string, end: string) => {
  const lines = code.split('\n');
  const from = lines.findIndex((line) => line.includes(start));
  const until = lines.findIndex((line, index) => index >= from && line.includes(end));
  return Array.from({ length: Math.max(1, until - from + 1) }, (_, index) => from + index + 1);
};
const number = (value: number) => value.toLocaleString('en-US');

function description(stage: number, c: Blueprint) {
  const shape = `${c.tokens} rows × ${c.width} numbers`;
  return [
    {
      title: 'A sentence already carries its practice answers.',
      text: 'Cover the word after “Mia.” Guess it, then uncover “likes” and compare. Repeat along the sentence. We call each text piece a token; this toy uses whole words, while real tokenizers often use word pieces. The existing next token supplies each practice answer.',
      input: 'A piece of existing text',
      output: `${c.tokens} input tokens and their next-token targets`,
      learns: 'The text is data. It is not a trainable weight.',
    },
    {
      title: 'Give each token a row of adjustable numbers.',
      text: 'An embedding is a lookup table. A token ID picks a row, like a library card finds a shelf. The numbers usually start with no useful meaning. Feedback can adjust them so useful distinctions become easier to make.',
      input: `${c.tokens} token IDs`,
      output: shape,
      learns: `${c.vocabulary} rows × ${c.width} numbers in the token table. Repeated tokens look up the same stored row.`,
    },
    {
      title: 'Tell the machine where each token sits.',
      text: 'A list of ingredients does not tell you their order. Add a position row so “Mia likes tea” and “tea likes Mia” can produce different computations. Our teaching model learns this position table.',
      input: shape,
      output: `${shape}; the shape stays the same`,
      learns: `${c.context} position rows × ${c.width} numbers. Other architectures encode position differently.`,
    },
    {
      title: 'Let each position gather earlier clues.',
      text: 'Every head makes queries, keys, and values, like the attention game. Each row mixes allowed value rows. A future word is covered: otherwise the machine could peek at the answer instead of learning to predict it.',
      input: shape,
      output: `${c.heads} heads of width ${c.width / c.heads}, joined back into ${shape}`,
      learns:
        'The Q, K, V and output projection weights and biases. Attention shares are computed afresh from the current input.',
    },
    {
      title: 'Keep the old message, then control its scale.',
      text: 'A residual connection adds the incoming message to the proposed change. Layer normalization then centers and rescales numbers within each token row. Its learned scale and shift can adjust the result. Neither operation guarantees easy training.',
      input: `Two arrays, each ${shape}`,
      output: shape,
      learns: `Addition stores no weights. This LayerNorm stores ${c.width} scale numbers and ${c.width} shifts.`,
    },
    {
      title: 'Use the same little network at every position.',
      text: 'The feed-forward network expands a row, bends it with ReLU, then brings it back to the original width. Every position uses the same weights in this block. Add another residual path and another normalization afterward.',
      input: `${c.width} numbers per row`,
      output: `${c.width} → ${c.hidden} → ${c.width} numbers per row`,
      learns:
        'Two weight tables and their biases, plus a second LayerNorm. This is the small neural network lesson inside a bigger machine.',
    },
    {
      title: 'Repeat the recipe, with different adjustable numbers.',
      text: 'Depth means processing a representation through more blocks. A later block receives the earlier block’s output. The recipe repeats, but each block here has its own weights. More blocks do not automatically mean better answers.',
      input: shape,
      output: `${shape} after ${c.blocks} blocks`,
      learns: `${c.blocks} separately trained sets of attention, feed-forward, and normalization parameters.`,
    },
    {
      title: 'Turn the last message into possible next words.',
      text: 'A learned output projection gives each vocabulary token a score called a logit. Softmax turns the scores into positive probabilities summing to one. These are predictions, not promises of truth.',
      input: shape,
      output: `${c.tokens} rows × ${c.vocabulary} vocabulary scores, then probabilities`,
      learns: `A separate ${c.width} × ${c.vocabulary} output table and ${c.vocabulary} biases. Some real models share this table with the embedding.`,
    },
    {
      title: 'Ask: how much probability did the real next word get?',
      text: 'The training target is the next token already present in the text. Cross-entropy gives a larger penalty when the correct token receives very little probability. Average these penalties over the chosen training positions.',
      input: 'Predicted probabilities and known next-token IDs',
      output: 'One number measuring the training mistake',
      learns: 'The loss formula itself has no trainable weights. It supplies the feedback signal.',
    },
    {
      title: 'One mistake sends feedback through the whole route.',
      text: 'Backpropagation follows the chain rule through every used operation. It computes how each adjustable number locally affects the loss. An optimizer then changes the parameters; the next prediction uses those changed numbers. That repeated process is learning.',
      input: 'Loss plus the saved values from the forward calculation',
      output: 'A gradient for each used parameter, then an optimizer update',
      learns:
        'Used embedding and position rows, all block parameters, and the output head can receive gradients. A gradient can be zero; discrete token IDs are not optimized.',
    },
  ][stage];
}

function ParameterLedger({ config }: { config: Blueprint }) {
  const result = inspectBlueprint(config);
  return (
    <div className="paper-ledger">
      <div className="paper-total">
        <span>Stored trainable numbers</span>
        <strong data-testid="paper-parameters">{number(result.parameters)}</strong>
        <span>for this precisely specified blueprint</span>
      </div>
      <div
        className="paper-table-scroll"
        tabIndex={0}
        aria-label="Parameter ledger, horizontally scrollable"
      >
        <table>
          <thead>
            <tr>
              <th scope="col">Where</th>
              <th scope="col">Count rule</th>
              <th scope="col">Numbers</th>
            </tr>
          </thead>
          <tbody>
            {result.ledger.map((row) => (
              <tr key={row.name}>
                <th scope="row">{row.name}</th>
                <td>
                  <code>{row.formula}</code>
                </td>
                <td>{number(row.count)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="paper-small">
        V = vocabulary, C = position capacity, d = width, f = feed-forward width, L = blocks. Heads
        split the fixed width; increasing heads alone adds no weights in this design. More input
        tokens change working arrays, not the stored parameter count.
      </p>
    </div>
  );
}

function BlueprintBuilder({
  config,
  onChange,
}: {
  config: Blueprint;
  onChange: (config: Blueprint) => void;
}) {
  const [draft, setDraft] = useState(config);
  const [checked, setChecked] = useState(false);
  const [prediction, setPrediction] = useState<string | null>(null);
  const error = configurationError(draft);
  return (
    <section className="paper-builder">
      <h3>Build a blueprint from a sentence.</h3>
      <p>
        Your brief: “Keep four numbers per token. Use two attention heads and two blocks. Expand
        each feed-forward row to eight numbers.” Match the controls, then try to break the shape
        rules.
      </p>
      <div className="paper-controls">
        {(
          [
            ['tokens', 'Input tokens (T)', [2, 3, 4, 5]],
            ['width', 'Numbers per token (d)', [4, 8, 16]],
            ['heads', 'Attention heads (h)', [1, 2, 3, 4]],
            ['hidden', 'Feed-forward width (f)', [8, 16, 32]],
            ['blocks', 'Blocks (L)', [1, 2, 3, 4]],
            ['vocabulary', 'Vocabulary size (V)', [8, 16, 32]],
            ['context', 'Position capacity (C)', [4, 8, 16]],
          ] as [keyof Blueprint, string, number[]][]
        ).map(([key, label, options]) => (
          <label key={key}>
            {label}
            <select
              aria-label={label}
              value={draft[key]}
              onChange={(event) => {
                setDraft({ ...draft, [key]: Number(event.target.value) });
                setChecked(false);
              }}
            >
              {options.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <button
        className="button primary"
        onClick={() => {
          setChecked(true);
          if (!error) onChange(draft);
        }}
      >
        Check and use this blueprint
      </button>
      <p
        className={`paper-builder-feedback ${checked && error ? 'paper-error' : ''}`}
        aria-live="polite"
      >
        {checked
          ? (error ??
            `Valid: ${draft.width} ÷ ${draft.heads} = ${draft.width / draft.heads} numbers per head. ${draft.width === 4 && draft.heads === 2 && draft.blocks === 2 && draft.hidden === 8 ? 'You matched the brief.' : 'This is a valid variation on the brief.'} The tutorial now uses your shapes.`)
          : 'Try three heads with width four. A shape error is a useful clue, not a failure.'}
      </p>
      <ParameterLedger config={config} />
      <div className="paper-question">
        <h3>Two heads → four heads, with width fixed. What changes?</h3>
        <div className="paper-answer-buttons">
          {['Twice as many stored parameters', 'Smaller heads; same parameter count'].map(
            (option) => (
              <button
                key={option}
                className="button"
                aria-pressed={prediction === option}
                onClick={() => setPrediction(option)}
              >
                {option}
              </button>
            ),
          )}
        </div>
        <p aria-live="polite">
          {prediction
            ? prediction.startsWith('Smaller')
              ? 'Yes. Each head gets a narrower slice. The total projection width stays d; the attention-score arrays do change.'
              : 'Try splitting four counters into two groups, then four groups. You still have four counters. Here the full projection tables keep the same size.'
            : 'Count the full Q, K, V tables before deciding.'}
        </p>
      </div>
    </section>
  );
}

function PaperReading() {
  const [paper, setPaper] = useState<'transformer' | 'mamba'>('transformer');
  const [checked, setChecked] = useState<Record<'transformer' | 'mamba', string[]>>({
    transformer: [],
    mamba: [],
  });
  const items = checked[paper];
  const questions = [
    'Task: What goes in, and what must come out?',
    'Data: Where do examples and targets come from?',
    'Objective: Which numerical mistake is minimized?',
    'New block: What operation changed, and what are its shapes?',
    'Ablation: Does removing the new part change the result?',
    'Evaluation: Which unseen data, metrics, baselines, and seeds?',
    'Cost: Parameters, training compute, activation memory, and inference time?',
  ];
  return (
    <section className="paper-reading">
      <h3>A familiar operation inside a real paper.</h3>
      <div className="paper-answer-buttons" role="group" aria-label="Paper to decode">
        <button
          className="button"
          aria-pressed={paper === 'transformer'}
          onClick={() => setPaper('transformer')}
        >
          Transformer paper
        </button>
        <button
          className="button"
          aria-pressed={paper === 'mamba'}
          onClick={() => setPaper('mamba')}
        >
          Mamba paper
        </button>
      </div>
      {paper === 'transformer' ? (
        <div className="paper-notation">
          <code>softmax(QKᵀ / √dₖ)V</code>
          <p>
            Compare queries with keys → scale scores → make shares → mix values. dₖ is the width of
            one key. Section 3.2 names an operation you already played with.
          </p>
          <p>
            The original paper has an encoder and decoder, cross-attention, and shared
            embedding/output weights. Our smaller decoder-only blueprint deliberately uses different
            assumptions.
          </p>
          <a href="https://arxiv.org/html/1706.03762v7#S3" target="_blank" rel="noreferrer">
            Read the Transformer architecture section ↗
          </a>
        </div>
      ) : (
        <div className="paper-notation">
          <code>hₜ = Āₜhₜ₋₁ + B̄ₜxₜ; yₜ = Cₜhₜ</code>
          <p>
            Carry earlier state → add selected new information → read an output. Section 3 develops
            selection: the input affects update quantities. The bars refer to a discretized state
            update.
          </p>
          <p>
            This recurrence is one mechanism inside Mamba. The full block also has projections,
            convolution, and gating, with a parallel scan for efficient computation. Our one-number
            memory game is an analogy, not that complete block.
          </p>
          <a href="https://arxiv.org/html/2312.00752v2#S3" target="_blank" rel="noreferrer">
            Read the Mamba method section ↗
          </a>
        </div>
      )}
      <h3>Your paper-reading worksheet</h3>
      <p>
        Pick a paper. Check an item after you can answer it in your own words. Checkmarks record
        your reading, not a test score. Each paper has its own checkmarks in this worksheet; leaving
        this view clears them.
      </p>
      <div className="paper-checklist">
        {questions.map((question) => (
          <label key={question}>
            <input
              type="checkbox"
              checked={items.includes(question)}
              onChange={() =>
                setChecked((current) => ({
                  ...current,
                  [paper]: current[paper].includes(question)
                    ? current[paper].filter((item) => item !== question)
                    : [...current[paper], question],
                }))
              }
            />
            <span>{question}</span>
          </label>
        ))}
      </div>
      <p className="paper-small">
        These tools help you start reading architectures. A new paper can still require new
        mathematics, experiments, and careful implementation. A parameter count predicts storage
        under assumptions, not accuracy or understanding.
      </p>
    </section>
  );
}

export default function PaperJourney() {
  const [mode, setMode] = useState<LearningMode>('visual');
  const [stage, setStage] = useState(0);
  const [config, setConfig] = useState<Blueprint>({ ...defaultBlueprint });
  const [targetProbability, setTargetProbability] = useState(0.25);
  const [training, setTraining] = useState(true);
  const [maskRow, setMaskRow] = useState(1);
  const [answer, setAnswer] = useState<string | null>(null);
  const result = inspectBlueprint(config);
  const scene = description(stage, config);
  const pairs = nextTokenPairs(trainingWords.slice(0, config.tokens + 1));
  const selectedRow = Math.min(maskRow, config.tokens - 1);
  const setScene = (next: number) => {
    setStage(next);
    setAnswer(null);
  };

  return (
    <div className="paper-journey">
      <header className="lesson-heading">
        <p className="eyebrow">
          THE RESEARCH BRIDGE <span> / </span> READ THE BLUEPRINT
        </p>
        <h1>
          A big model is a <em>route you can trace.</em>
        </h1>
        <p>
          You’re building a next-word guessing machine. Its practice text begins “Mia likes warm
          tea.” Mia is just a name in our example sentence. Follow the text through the boxes of a
          small Transformer blueprint, then use the same questions to read a research paper.
        </p>
      </header>
      <ModeSwitcher value={mode} onChange={setMode} />
      {mode === 'visual' && (
        <>
          <section className="guide-card paper-story">
            <div className="paper-story-top">
              <span className="guide-kicker">
                STOP {stage + 1} OF {names.length} · {names[stage].toUpperCase()}
              </span>
              <button
                className="button"
                onClick={() => {
                  setScene(0);
                  setTraining(true);
                }}
              >
                <RotateCcw size={15} />
                Restart route
              </button>
            </div>
            <nav className="paper-route" aria-label="Follow the language model route">
              {shortNames.map((name, index) => (
                <button
                  key={name}
                  aria-current={index === stage ? 'step' : undefined}
                  onClick={() => setScene(index)}
                >
                  <span>{index + 1}</span>
                  {name}
                </button>
              ))}
            </nav>
            <div className="paper-scene" key={stage}>
              <h2>{scene.title}</h2>
              <p className="paper-main-explanation">{scene.text}</p>
              {stage === 0 && (
                <div className="paper-token-game">
                  <span className="paper-label">EXISTING TEXT</span>
                  <div className="paper-tokens">
                    {trainingWords.slice(0, config.tokens + 1).map((word, index) => (
                      <span
                        key={index}
                        className={index === config.tokens ? 'paper-target-token' : ''}
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                  <div className="paper-pairs">
                    {pairs.map((pair, index) => (
                      <div key={index}>
                        <span>{pair.input}</span>
                        <ArrowRight size={17} />
                        <strong>{pair.target}</strong>
                        <small>next-token target</small>
                      </div>
                    ))}
                  </div>
                  <p>
                    The input at row 1 is “Mia”; its target is “likes”. Row 2 can read “Mia likes”;
                    its target is “warm”. Text provides the answer key. This is called{' '}
                    <strong>self-supervised learning</strong>.
                  </p>
                </div>
              )}
              {[1, 2, 4, 5, 6, 7].includes(stage) && (
                <div className="paper-shape-scene">
                  <div className="paper-representation">
                    <span className="paper-label">
                      {stage === 7 ? 'LAST REPRESENTATION' : 'WORKING MESSAGE'}
                    </span>
                    {pairs.map((pair, index) => (
                      <div className="paper-vector-row" key={index}>
                        <span>{pair.input}</span>
                        <div aria-label={`${config.width} representation numbers`}>
                          {Array.from({ length: config.width }, (_, column) => (
                            <i key={column} aria-hidden="true" />
                          ))}
                        </div>
                      </div>
                    ))}
                    <strong>
                      {config.tokens} rows × {config.width} numbers
                    </strong>
                  </div>
                  <ArrowRight className="paper-shape-arrow" size={26} />
                  <div className="paper-operation">
                    <span className="paper-label">
                      {stage === 1
                        ? 'A SHARED LOOKUP'
                        : stage === 2
                          ? 'ADD POSITION'
                          : stage === 4
                            ? 'SAME-SHAPED ADDITION'
                            : stage === 5
                              ? 'THE INNER NETWORK'
                              : stage === 6
                                ? 'SEPARATE BLOCK WEIGHTS'
                                : 'VOCABULARY PROJECTION'}
                    </span>
                    <strong>
                      {stage === 1
                        ? `${config.vocabulary} × ${config.width} stored table`
                        : stage === 2
                          ? `position row + token row`
                          : stage === 4
                            ? `x + attention(x)`
                            : stage === 5
                              ? `${config.width} → ${config.hidden} → ${config.width}`
                              : stage === 6
                                ? Array.from(
                                    { length: config.blocks },
                                    (_, i) => `Block ${i + 1}`,
                                  ).join(' → ')
                                : `${config.tokens} × ${config.vocabulary} scores`}
                    </strong>
                    <p>
                      {stage === 1
                        ? 'The table is a parameter. The selected rows are activations.'
                        : stage === 2
                          ? 'Addition preserves the array dimensions.'
                          : stage === 4
                            ? 'Then normalize within each row, with learned scale and shift.'
                            : stage === 5
                              ? 'Linear → ReLU → linear. Then add the residual and normalize.'
                              : stage === 6
                                ? 'Every block preserves the outer width so the next block fits.'
                                : 'One score for every possible next token, at each input position.'}
                    </p>
                  </div>
                </div>
              )}
              {stage === 3 && (
                <div className="paper-mask-lesson">
                  <div className="paper-answer-buttons">
                    <button
                      className="button"
                      aria-pressed={training}
                      onClick={() => setTraining(true)}
                    >
                      Training: existing text
                    </button>
                    <button
                      className="button"
                      aria-pressed={!training}
                      onClick={() => setTraining(false)}
                    >
                      Generating: future unknown
                    </button>
                  </div>
                  {training ? (
                    <>
                      <label className="paper-row-select">
                        Inspect attention from position
                        <select
                          aria-label="Inspect attention position"
                          value={selectedRow}
                          onChange={(e) => setMaskRow(Number(e.target.value))}
                        >
                          {pairs.map((pair, index) => (
                            <option key={index} value={index}>
                              {index + 1}: {pair.input}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="paper-tokens">
                        {pairs.map((pair, index) => (
                          <span
                            key={index}
                            className={
                              result.causalMask[selectedRow][index]
                                ? 'paper-visible-token'
                                : 'paper-covered-token'
                            }
                          >
                            {pair.input}
                            <small>
                              {result.causalMask[selectedRow][index] ? 'can read' : 'covered'}
                            </small>
                          </span>
                        ))}
                      </div>
                      <p>
                        All known training rows can be calculated in parallel within a layer, but
                        each row has its own no-peeking mask. The targets are shifted one place
                        forward.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="paper-tokens">
                        <span>Mia</span>
                        <span>likes</span>
                        <span className="paper-covered-token">
                          ?<small>must generate</small>
                        </span>
                      </div>
                      <p>
                        At generation time, the next token is not known. Predict one, append it,
                        then predict again. Implementations can cache earlier keys and values; the
                        weights usually stay fixed during this process.
                      </p>
                    </>
                  )}
                  <p className="paper-small">
                    For your configuration, one head has {config.width / config.heads} numbers per
                    token. All attention-score arrays together have shape {config.heads} ×{' '}
                    {config.tokens} × {config.tokens}.
                  </p>
                </div>
              )}
              {stage === 8 && (
                <div className="paper-loss-game">
                  <span className="paper-label">
                    SET A HYPOTHETICAL PREDICTION · NO LANGUAGE MODEL IS TRAINING HERE
                  </span>
                  <label>
                    Probability assigned to the correct next token:{' '}
                    <strong>{(100 * targetProbability).toFixed(0)}%</strong>
                    <input
                      aria-label="Correct-token probability"
                      type="range"
                      min="0.05"
                      max="1"
                      step="0.05"
                      value={targetProbability}
                      onChange={(e) => setTargetProbability(Number(e.target.value))}
                    />
                  </label>
                  <div className="paper-probability">
                    <span style={{ width: `${100 * targetProbability}%` }} />
                  </div>
                  <strong className="paper-loss-number" data-testid="paper-token-loss">
                    −ln({targetProbability.toFixed(2)}) = {tokenLoss(targetProbability).toFixed(3)}
                  </strong>
                  <p>
                    The leftover probability belongs to the other vocabulary tokens. Try 5%, then
                    80%. Rewarding the correct next word creates the pressure to find useful
                    patterns.
                  </p>
                </div>
              )}
              {stage === 9 && (
                <div className="paper-feedback-route">
                  <div>
                    <strong>Loss</strong>
                    <ArrowRight aria-hidden="true" />
                    <strong>Output table</strong>
                    <ArrowRight aria-hidden="true" />
                    <strong>{config.blocks} blocks</strong>
                    <ArrowRight aria-hidden="true" />
                    <strong>Embedding + position</strong>
                  </div>
                  <p>
                    Read the arrows as “feedback goes here”. Shared parameters collect gradient
                    contributions from all uses. Saved activations help compute gradients, but an
                    optimizer updates the parameters.
                  </p>
                  <div className="paper-update-rule">
                    old weights − learning rate × gradients → new weights
                  </div>
                  <p>
                    This is the same update as the tiny learner, with many connected paths. Useful
                    internal features can emerge because changes that help predict training targets
                    are reinforced. We do not hand-name what each feature must mean.
                  </p>
                </div>
              )}
              <details className="paper-inspector">
                <summary>Inside this box: what enters, leaves, and learns?</summary>
                <dl>
                  <div>
                    <dt>Goes in</dt>
                    <dd>{scene.input}</dd>
                  </div>
                  <div>
                    <dt>Comes out</dt>
                    <dd>{scene.output}</dd>
                  </div>
                  <div>
                    <dt>Can be learned</dt>
                    <dd>{scene.learns}</dd>
                  </div>
                </dl>
              </details>
              {(stage === 1 || stage === 9) && (
                <div className="paper-question">
                  <h3>Which numbers does the optimizer keep changing?</h3>
                  <div className="paper-answer-buttons">
                    {['The stored lookup and weight tables', 'Only today’s attention shares'].map(
                      (option) => (
                        <button
                          className="button"
                          key={option}
                          aria-pressed={answer === option}
                          onClick={() => setAnswer(option)}
                        >
                          {option}
                        </button>
                      ),
                    )}
                  </div>
                  <p aria-live="polite">
                    {answer
                      ? answer.startsWith('The stored')
                        ? 'Yes. The stored parameters persist between examples. Attention shares are activations recalculated from each input and those parameters.'
                        : 'Attention shares change when the input or weights change. The optimizer changes the underlying stored parameters, including the projections that produce those shares.'
                      : 'Think of adjustable recipe settings versus the meal made with today’s ingredients.'}
                  </p>
                </div>
              )}
            </div>
            <div className="paper-navigation">
              <button className="button" disabled={stage === 0} onClick={() => setScene(stage - 1)}>
                <ArrowLeft size={17} />
                Previous stop
              </button>
              <span>
                {stage + 1} / {names.length}
              </span>
              <button
                className="button primary"
                disabled={stage === names.length - 1}
                onClick={() => setScene(stage + 1)}
              >
                Next stop
                <ArrowRight size={17} />
              </button>
            </div>
          </section>
          <p className="paper-scope">
            A shape-and-feedback workshop, not a full language-model trainer. The colored squares
            show array dimensions, not measured features. Open the math view for the exact
            architecture assumptions.
          </p>
          <details className="panel paper-expansion">
            <summary>Challenge 1: build and repair a blueprint</summary>
            <BlueprintBuilder config={config} onChange={setConfig} />
          </details>
          <details className="panel paper-expansion">
            <summary>Challenge 2: find these operations in a real paper</summary>
            <PaperReading />
          </details>
        </>
      )}
      {mode === 'math' && (
        <>
          <section className="panel paper-math">
            <span className="eyebrow">WRITE DOWN THE ASSUMPTIONS FIRST</span>
            <h2>A small, specified decoder.</h2>
            <p>
              A decoder is a model that predicts the next token from the tokens so far. Here we
              trace one sequence, with no batch dimension shown. T = input token count, V =
              vocabulary size, C = position capacity, d = row width, h = heads, f = inner width, and
              L = blocks. We use learned token and absolute-position embeddings. Each of L separate
              blocks has biased causal self-attention, a residual plus LayerNorm, a biased ReLU
              feed-forward network, then a second residual plus LayerNorm. No final norm. A
              separate, untied vocabulary projection includes a bias. Dropout and cross-attention
              are omitted.
            </p>
            <div className="paper-equations">
              <code>X₀ = E[token IDs] + P[position IDs]</code>
              <code>Q = XWQ + bQ, K = XWK + bK, V = XWV + bV</code>
              <code>Qᵢ, Kᵢ, Vᵢ = head i’s d/h-column slices of Q, K, V</code>
              <code>headᵢ = softmax(QᵢKᵢᵀ / √(d/h) + causal mask)Vᵢ</code>
              <code>Y = LayerNorm(X + Concat(head₁, …, headₕ)WO + bO)</code>
              <code>Xnext = LayerNorm(Y + ReLU(YW₁ + b₁)W₂ + b₂)</code>
              <code>logits = XL Wvocab + bvocab</code>
              <code>loss = −(1/T) Σₜ ln pₜ(correct next token)</code>
            </div>
            <p>
              The full Q, K, and V tables each have T rows and d columns. Split the columns into h
              heads; each head compares and mixes only its own slices. Concatenation puts the heads’
              output columns side by side again. The causal mask is 0 for allowed entries and −∞ for
              forbidden ones, so softmax assigns forbidden entries zero probability.
            </p>
            <p data-testid="paper-head-calculation">
              In your blueprint: each head’s Qᵢ and Kᵢ has shape {config.tokens} ×{' '}
              {result.headWidth}. QᵢKᵢᵀ gives {config.tokens} × {config.tokens} scores, scaled by √
              {result.headWidth}. Mixing Vᵢ produces {config.tokens} × {result.headWidth} numbers
              per head. Join {config.heads} heads to recover {config.tokens} × {config.width}.
            </p>
            <details>
              <summary>What LayerNorm calculates</summary>
              <p>
                For one d-number row: compute its mean μ and variance σ². Each output is γⱼ(xⱼ −
                μ)/√(σ² + ε) + βⱼ, with a small fixed ε &gt; 0. Only γ and β are trainable: 2d
                numbers per norm, 4d per block. ReLU is max(0, x) and has no trainable numbers.
              </p>
            </details>
            <details>
              <summary>Where the gradient starts, and why it reaches an embedding</summary>
              <p>
                For mean token cross-entropy, ∂loss/∂logitₜⱼ = (pₜⱼ − 1[j = targetₜ])/T. Multiply
                this sensitivity through the local derivatives of the head, every block, and the
                embedding lookup. At a residual addition, the incoming gradient reaches both
                branches. If a shared parameter is used several times, add the contributions before
                the optimizer update.
              </p>
              <p>
                Backprop computes gradients; the optimizer applies them. A repeated recipe does not
                mean shared parameters across depth here. Weights are shared across token positions
                within each block. The chain rule alone does not guarantee convergence,
                generalization, or human-readable features.
              </p>
            </details>
          </section>
          <section className="panel paper-math">
            <BlueprintBuilder config={config} onChange={setConfig} />
            <p>
              <strong>Exact total:</strong> 2Vd + Cd + V + L(4d² + 2df + 9d + f). Changing to shared
              output weights, bias-free layers, rotary positions, grouped-query attention, gated
              feed-forward layers, or a different normalization changes this ledger.
            </p>
            <p>
              Float32 parameter storage is 4 × {number(result.parameters)} ={' '}
              {number(result.float32WeightBytes)} bytes. Training also needs working activations,
              gradients, and often optimizer state. This is not a training-memory estimate or a
              performance forecast.
            </p>
          </section>
          <section className="panel paper-math">
            <PaperReading />
          </section>
        </>
      )}
      {mode === 'code' && (
        <>
          <CodeWalkthrough
            title="Audit an architecture with plain JavaScript"
            code={code}
            steps={[
              {
                label: 'Specify the model before counting',
                explanation:
                  'Write down dimensions and architecture assumptions. A bare parameter count without these assumptions is ambiguous.',
                lines: codeLines('Teaching decoder:', 'export function inspectBlueprint'),
              },
              {
                label: 'Reject impossible shapes',
                explanation:
                  'Each head must have an integer width. Position lookup must stay inside its allocated table.',
                lines: codeLines('for (const name', 'position table capacity'),
              },
              {
                label: 'Count stored parameters once',
                explanation:
                  'The ledger includes biases and LayerNorm scale/shift. Positions reuse weights; separate depth blocks do not.',
                lines: codeLines('const ledger', 'const parameters'),
              },
              {
                label: 'Trace working arrays and the causal mask',
                explanation:
                  'These dimensions change with the input length. They describe activations, not extra trainable parameters.',
                lines: codeLines('activations:', 'export function nextTokenPairs'),
              },
              {
                label: 'Make labels from text, then measure a prediction',
                explanation:
                  'Shift text by one place to make targets. Negative log probability measures one token’s mistake. The program audits shapes and loss; it does not pretend to train the full decoder.',
                lines: codeLines('export function nextTokenPairs', 'if (typeof process'),
              },
            ]}
          />
          <p className="paper-scope">
            Run with <code>node examples/read-architecture.mjs</code> or include it in{' '}
            <code>make examples</code>. For a complete trained network with handwritten backprop,
            open the “Follow one mistake” code view.
          </p>
        </>
      )}
      <div className="paper-finish">
        <Check size={19} />
        <p>
          When a paper shows a large box, ask:{' '}
          <strong>
            what numbers enter, what operation happens, what is learned, and where does feedback
            come from?
          </strong>{' '}
          Then check its evidence on unseen data.
        </p>
        <ArrowDown size={18} aria-hidden="true" />
      </div>
    </div>
  );
}
