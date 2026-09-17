import { useState } from 'react';
import { denseNetworkBudget } from '../lib/theory';
import './theory.css';
import { CodeWalkthrough, ModeSwitcher, type LearningMode } from './LearningModes';
import countCode from '../../examples/parameter-count.mjs?raw';

type Architecture = 'Dense' | 'Transformer' | 'Mamba';
const architectureCopy: Record<
  Architecture,
  { title: string; simple: string; steps: string[]; math: string; detail: string }
> = {
  Dense: {
    title: 'Mix numbers. Bend the result. Repeat.',
    simple:
      'Each unit combines numbers from the previous layer. A nonlinear function lets the network build curved boundaries and patterns that a straight line cannot express.',
    steps: ['Input numbers', 'Weighted mixtures', 'Nonlinear features', 'Output'],
    math: 'h = ReLU(Wx + b)     →     y = Vh + c',
    detail:
      'W and V are tables of weights; b and c are biases. ReLU keeps positive numbers and replaces negative numbers with zero. In a fully connected layer, every output has a weight for every input. Without nonlinearities, stacked affine layers can collapse into one affine map.',
  },
  Transformer: {
    title: 'Let positions gather useful context.',
    simple:
      'Attention computes how much each allowed position contributes to another. Learned query and key vectors determine the mixture; value vectors carry the information being mixed.',
    steps: ['Token vectors', 'Queries · keys', 'Mix value vectors', 'Feed-forward block'],
    math: 'Attention(Q, K, V) = softmax(QKᵀ / √dₖ + mask)V',
    detail:
      'Q, K, and V come from learned projections of token representations. The mask can hide future positions in a causal language model. Feed-forward layers, residual connections, normalization, and position information also matter. An attention score is a mixing coefficient, not by itself a complete explanation of an answer.',
  },
  Mamba: {
    title: 'Carry a state. Update what matters.',
    simple:
      'A selective state-space block passes a compact numerical state along the sequence. Input-dependent updates control how previous information and the current input affect the next state.',
    steps: ['Current input', 'Select update', 'Change state', 'Read output'],
    math: 'hₜ = Āₜhₜ₋₁ + B̄ₜxₜ     →     yₜ = Cₜhₜ',
    detail:
      'This is a simplified state-space recurrence, not the complete Mamba block. Selection makes update quantities depend on the input; the full block also contains projections, convolution, and gating. Mamba uses an efficient scan during training. Its state is a learned numerical summary, not a transcript of every earlier token.',
  },
};

function bytesLabel(bytes: number) {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(2)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(2)} kB`;
  return `${bytes} bytes`;
}

export default function ScaleLesson() {
  const [mode, setMode] = useState<LearningMode>('visual');
  const [architecture, setArchitecture] = useState<Architecture>('Dense');
  const [activeStep, setActiveStep] = useState(0);
  const [widthPower, setWidthPower] = useState(5);
  const [depth, setDepth] = useState(3);
  const [lifecycleMode, setLifecycleMode] = useState<'training' | 'inference'>('training');
  const [answer, setAnswer] = useState<number | null>(null);
  const width = 2 ** widthPower;
  const inputs = 8;
  const outputs = 2;
  const {
    inputParameters,
    hiddenParameters,
    outputParameters,
    totalParameters: total,
    float32Bytes,
  } = denseNetworkBudget(inputs, width, depth, outputs);
  const copy = architectureCopy[architecture];
  const stepExplanation: Record<Architecture, string[]> = {
    Dense: [
      'Start with measured features, such as height and width, represented as numbers.',
      'Multiply each input by a learned weight, add the products, then add a bias.',
      'Apply a nonlinear function. Later layers combine these features into further features.',
      'The final layer produces the prediction. The loss compares it with the training target.',
    ],
    Transformer: [
      'Split the input into tokens and represent them with vectors and position information.',
      'Compare query and key vectors. Softmax turns the allowed scores into nonnegative weights that sum to one.',
      'Take a weighted sum of value vectors. Each position can now contain information from other allowed positions.',
      'Transform each position with a feed-forward network. Full models stack blocks with residual paths and normalization.',
    ],
    Mamba: [
      'Read the next input vector alongside the state carried from the previous position.',
      'Use the current input to determine selective state-update quantities.',
      'Combine the carried state with new input information. This is numerical arithmetic, not a conscious choice.',
      'Map the updated state to an output. Pass the state onward so later inputs can use its information.',
    ],
  };

  return (
    <div className={`theory-lesson scale-${mode}`}>
      <header className="lesson-heading">
        <p className="eyebrow">
          EXPERIMENT 07 <span> / </span> CHANGE THE SCALE
        </p>
        <h1>
          More weights.
          <br />
          <em>Same need for evidence.</em>
        </h1>
        <p>
          A million adjustable numbers do not introduce a hidden learner. They create a much larger
          computation—and many more interacting ways to represent patterns.
        </p>
      </header>
      <ModeSwitcher value={mode} onChange={setMode} />
      {mode === 'code' ? (
        <CodeWalkthrough
          title="Count weights and biases before training"
          code={countCode}
          steps={[
            {
              label: 'Count each connection and bias',
              explanation:
                'A dense layer from a inputs to b outputs uses a × b weights plus b biases. The +1 accounts for each output bias.',
              lines: countCode
                .split('\n')
                .flatMap((line, i) =>
                  line.includes('const inputLayer') ||
                  line.includes('const hiddenLayers') ||
                  line.includes('const outputLayer')
                    ? [i + 1]
                    : [],
                ),
            },
            {
              label: 'Add parameters and convert to bytes',
              explanation:
                'Float32 uses four bytes per parameter. This is storage, not training memory or a prediction of accuracy.',
              lines: countCode
                .split('\n')
                .flatMap((line, i) =>
                  line.includes('const parameters') || line.includes('float32Bytes') ? [i + 1] : [],
                ),
            },
            {
              label: 'Run both sizes without allocating a large model',
              explanation:
                'node examples/parameter-count.mjs prints 2,466 parameters for the default case. Arithmetic can count a billion-parameter model without constructing it.',
              lines: countCode
                .split('\n')
                .flatMap((line, i) => (line.includes('console.log') ? [i + 1] : [])),
            },
          ]}
        />
      ) : (
        <>
          <section className="panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Architecture explorer</span>
                <h3>Different ways to move information.</h3>
              </div>
              <span className="pill">A guided schematic</span>
            </div>
            <div className="theory-segmented" role="group" aria-label="Choose an architecture">
              {(['Dense', 'Transformer', 'Mamba'] as Architecture[]).map((item) => (
                <button
                  type="button"
                  key={item}
                  aria-pressed={architecture === item}
                  className={architecture === item ? 'active' : ''}
                  onClick={() => {
                    setArchitecture(item);
                    setActiveStep(0);
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="theory-architecture">
              <h3>{copy.title}</h3>
              <p>{copy.simple}</p>
              <div className="theory-flow" aria-label={`${architecture} computation steps`}>
                {copy.steps.map((step, index) => (
                  <button
                    type="button"
                    key={`${architecture}-${step}`}
                    className={`theory-flow-step ${activeStep === index ? 'active' : ''}`}
                    aria-pressed={activeStep === index}
                    onClick={() => setActiveStep(index)}
                  >
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <strong>{step}</strong>
                    {index < 3 && (
                      <span className="theory-flow-arrow" aria-hidden="true">
                        →
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="theory-step-detail" aria-live="polite">
                <span className="theory-step-number">{activeStep + 1}</span>
                <p>{stepExplanation[architecture][activeStep]}</p>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setActiveStep((activeStep + 1) % 4)}
                >
                  Next step <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
            <details className="theory-details">
              <summary>Open the mathematical view</summary>
              <div className="formula">{copy.math}</div>
              <p>{copy.detail}</p>
              <p>
                These are schematic mechanisms. This explorer does not train a Transformer or Mamba
                model. Architecture changes which computations are possible and how efficiently
                information flows; its name alone does not determine performance.
              </p>
            </details>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">A calculation you can trust</span>
                <h3>Count the adjustable numbers.</h3>
              </div>
              <span className="pill">Fully connected network</span>
            </div>
            <p>
              Keep 8 inputs and 2 outputs. Add wider or deeper hidden layers. Every connecting line
              needs a weight, and every hidden or output unit gets one bias.
            </p>
            <div className="lesson-grid theory-two-col">
              <div className="theory-controls">
                <label className="control-group" htmlFor="dense-width">
                  <span>
                    Units per hidden layer <strong>{width.toLocaleString()}</strong>
                  </span>
                  <input
                    id="dense-width"
                    type="range"
                    min="1"
                    max="13"
                    step="1"
                    value={widthPower}
                    aria-valuetext={`${width} units`}
                    onChange={(event) => setWidthPower(Number(event.target.value))}
                  />
                  <small>Each tick doubles the width: 2 to 8,192 units.</small>
                </label>
                <label className="control-group" htmlFor="dense-depth">
                  <span>
                    Hidden layers <strong>{depth}</strong>
                  </span>
                  <input
                    id="dense-depth"
                    type="range"
                    min="1"
                    max="16"
                    step="1"
                    value={depth}
                    onChange={(event) => setDepth(Number(event.target.value))}
                  />
                </label>
                <div className="theory-shape">
                  <span>8 inputs</span>
                  <span aria-hidden="true">→</span>
                  <strong>
                    {depth} × {width.toLocaleString()} hidden
                  </strong>
                  <span aria-hidden="true">→</span>
                  <span>2 outputs</span>
                </div>
              </div>
              <div className="theory-memory" aria-live="polite">
                <span className="eyebrow">Weights + biases</span>
                <strong className="theory-big-number">{total.toLocaleString()}</strong>
                <p>trainable parameters</p>
                <div className="theory-memory-divider" />
                <strong className="theory-memory-value">{bytesLabel(float32Bytes)}</strong>
                <p>to store them as Float32 (4 bytes each)</p>
                <small>
                  Decimal units: 1 MB = 1,000,000 bytes. Storage excludes gradients, optimizer
                  state, activations, and other runtime memory.
                </small>
              </div>
            </div>
            <details className="theory-details">
              <summary>Show the parameter calculation</summary>
              <p>
                A dense layer with a inputs and b outputs contains{' '}
                <strong>a × b weights + b biases = (a + 1)b parameters</strong>. Let w be the hidden
                width and d the number of hidden layers.
              </p>
              <div className="formula">
                P = (8 + 1)w + (d − 1)(w + 1)w + (w + 1) × 2<br />P ={' '}
                {inputParameters.toLocaleString()} + {hiddenParameters.toLocaleString()} +{' '}
                {outputParameters.toLocaleString()}
                <br />P = {total.toLocaleString()}
                <br />
                Float32 bytes = 4P = {(total * 4).toLocaleString()}
              </div>
              <p>
                There are d − 1 hidden-to-hidden connections. If d = 1, that middle term is zero.
                The calculator uses standard dense layers with separate biases. Transformer and
                Mamba counts need formulas for their own blocks.
              </p>
            </details>
          </section>

          <section className="panel">
            <h3>When does a weight actually change?</h3>
            <div
              className="theory-segmented"
              role="group"
              aria-label="Compare training and inference"
            >
              {(['training', 'inference'] as const).map((item) => (
                <button
                  type="button"
                  key={item}
                  className={lifecycleMode === item ? 'active' : ''}
                  aria-pressed={lifecycleMode === item}
                  onClick={() => setLifecycleMode(item)}
                >
                  {item === 'training' ? 'Training: adjust' : 'Inference: use'}
                </button>
              ))}
            </div>
            <div className="insight" aria-live="polite">
              {lifecycleMode === 'training' ? (
                <p>
                  <strong>Predict → measure loss → backpropagate → update.</strong> Backpropagation
                  calculates how each parameter affects the loss. The optimizer uses those gradients
                  to change parameters. Repeated small adjustments can build useful features.
                </p>
              ) : (
                <p>
                  <strong>Input → learned computation → output.</strong> In ordinary inference,
                  parameters stay fixed. Activations, attention caches, or recurrent states can
                  change as the input changes. Remembering context during a conversation is not
                  automatically another weight update.
                </p>
              )}
            </div>
            <details className="theory-details">
              <summary>Does one neuron mean one idea?</summary>
              <p>
                Sometimes individual units are interpretable, but there is no general one-neuron,
                one-concept rule. A feature can be spread across many units; a unit can participate
                in multiple features. Toy models demonstrate how sparse features can share
                representational directions, a phenomenon called superposition.
              </p>
              <p>
                We can inspect weights and activations, alter an internal signal, and test which
                behaviors change. Those experiments reveal mechanisms. A complete, reliable
                explanation of every behavior in a large trained model remains an open research
                challenge.
              </p>
            </details>
          </section>

          <section className="quiz theory-quiz" aria-labelledby="scale-quiz">
            <span className="eyebrow">Make it stick</span>
            <h3 id="scale-quiz">
              A chat model uses an earlier sentence. Did its weights necessarily change?
            </h3>
            <div className="theory-quiz-options">
              {[
                'Yes. Any remembered information changes weights.',
                'No. Its changing context can affect fixed-weight computation.',
              ].map((label, index) => (
                <button
                  type="button"
                  key={label}
                  className={`button ${answer === index ? 'primary' : ''}`}
                  aria-pressed={answer === index}
                  onClick={() => setAnswer(index)}
                >
                  {label}
                </button>
              ))}
            </div>
            {answer !== null && (
              <p role="status">
                {answer === 1
                  ? 'Right. Context, activations, and state can change while the trained parameters stay fixed.'
                  : 'Think of a calculator: a new input changes its answer without rewriting its rules. Ordinary inference also uses fixed parameters.'}
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
