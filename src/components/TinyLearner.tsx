import { useEffect, useReducer, useState, type CSSProperties } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  MousePointer2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  INITIAL_WEIGHT,
  scalarExamples,
  scalarLoss,
  scalarStep,
  type ScalarStep,
} from '../lib/scalar';
import './tiny.css';
import { CodeWalkthrough, ModeSwitcher, type LearningMode } from './LearningModes';
import tinyCode from '../../examples/one-weight.mjs?raw';

interface ModelState {
  weight: number;
  steps: number;
  lastStep: ScalarStep | null;
  running: boolean;
  notice: string;
}

type ModelAction =
  | { type: 'weight'; weight: number }
  | { type: 'step'; rate: number }
  | { type: 'toggle' }
  | { type: 'pause' }
  | { type: 'reset' };

const initialState: ModelState = {
  weight: INITIAL_WEIGHT,
  steps: 0,
  lastStep: null,
  running: false,
  notice: '',
};

function modelReducer(state: ModelState, action: ModelAction): ModelState {
  switch (action.type) {
    case 'weight':
      return { ...initialState, weight: action.weight };
    case 'pause':
      return { ...state, running: false };
    case 'reset':
      return initialState;
    case 'toggle':
      return { ...state, running: !state.running, notice: '' };
    case 'step': {
      try {
        const step = scalarStep(state.weight, action.rate);
        const converged = step.lossAfter < 1e-8;
        return {
          weight: step.weightAfter,
          steps: state.steps + 1,
          lastStep: step,
          running: state.running && !converged,
          notice: converged ? 'The guesses now closely match all three examples.' : '',
        };
      } catch (error) {
        return {
          ...state,
          running: false,
          notice: error instanceof Error ? error.message : 'Reset to try again.',
        };
      }
    }
  }
}

const number = (value: number, digits = 3) =>
  Math.abs(value) < 0.0005 ? '0' : Number(value.toFixed(digits)).toString();
const preciseLoss = (value: number) =>
  value === 0 ? '0.000' : value < 0.001 ? value.toExponential(1) : value.toFixed(3);
const signed = (value: number) => (value < 0 ? `(${number(value)})` : number(value));

function PredictionChart({
  weight,
  selectedIndex,
  onSelect,
}: {
  weight: number;
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const examples = scalarExamples(weight);
  const left = 54;
  const right = 618;
  const top = 23;
  const bottom = 280;
  const minY = weight < 0 ? Math.floor(weight * 3.3) : 0;
  const maxY = Math.max(8, Math.ceil(weight * 3.3));
  const x = (value: number) => left + (value / 3.5) * (right - left);
  const y = (value: number) => bottom - ((value - minY) / (maxY - minY)) * (bottom - top);
  const selected = examples[selectedIndex];
  const yTicks = Array.from({ length: 5 }, (_, index) => minY + (index * (maxY - minY)) / 4);

  return (
    <div className="tiny-plot-wrap">
      <div className="tiny-chart-legend">
        <span>
          <i className="target-dot" />
          The right answer
        </span>
        <span>
          <i className="prediction-dot" />
          Your machine’s guess
        </span>
      </div>
      <svg
        className="tiny-plot"
        viewBox="0 0 660 328"
        role="img"
        aria-labelledby="tiny-chart-title tiny-chart-description"
      >
        <title id="tiny-chart-title">A machine’s guesses compared with three correct answers</title>
        <desc id="tiny-chart-description">
          The input and target pairs are 1 and 2, 2 and 4, and 3 and 6. The machine currently
          multiplies each input by {number(weight)}. For input {selected.input}, its guess is{' '}
          {number(selected.prediction)} and the target is {selected.target}.
        </desc>
        <defs>
          <linearGradient id="tiny-error-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#b5a2ee" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#b5a2ee" stopOpacity="0.035" />
          </linearGradient>
        </defs>
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={left}
              x2={right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="#e9eae5"
              strokeDasharray="3 5"
            />
            <text x={left - 16} y={y(tick) + 4} textAnchor="end" className="tiny-axis-number">
              {number(tick, 1)}
            </text>
          </g>
        ))}
        {[0, 1, 2, 3].map((tick) => (
          <g key={tick}>
            <line x1={x(tick)} x2={x(tick)} y1={top} y2={bottom} stroke="#f0f0eb" />
            <text x={x(tick)} y={bottom + 22} textAnchor="middle" className="tiny-axis-number">
              {tick}
            </text>
          </g>
        ))}
        <path
          d={`M ${x(0)} ${y(0)} L ${x(3)} ${y(6)} L ${x(3)} ${y(weight * 3)} Z`}
          fill="url(#tiny-error-fill)"
        />
        <line x1={left} x2={right} y1={y(0)} y2={y(0)} stroke="#d8ddd4" />
        <line
          x1={x(0)}
          y1={y(0)}
          x2={x(3.3)}
          y2={y(6.6)}
          stroke="#5b967d"
          strokeWidth="2"
          strokeDasharray="6 7"
        />
        <line
          x1={x(0)}
          y1={y(0)}
          x2={x(3.3)}
          y2={y(weight * 3.3)}
          stroke="#8d70cc"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1={x(selected.input)}
          x2={x(selected.input)}
          y1={y(selected.target)}
          y2={y(selected.prediction)}
          stroke="#b9acd7"
          strokeWidth="2"
          strokeDasharray="3 4"
        />
        {examples.map((item, index) => (
          <g key={item.input} onClick={() => onSelect(index)} className="tiny-example-points">
            {index === selectedIndex && (
              <circle cx={x(item.input)} cy={y(item.target)} r="13" fill="#e9f2ea" />
            )}
            <circle
              cx={x(item.input)}
              cy={y(item.target)}
              r="5.5"
              fill="#589378"
              stroke="white"
              strokeWidth="2"
            />
            {index === selectedIndex && (
              <circle cx={x(item.input)} cy={y(item.prediction)} r="13" fill="#eee7f7" />
            )}
            <circle
              cx={x(item.input)}
              cy={y(item.prediction)}
              r="5.5"
              fill="#9777d2"
              stroke="white"
              strokeWidth="2"
            />
          </g>
        ))}
        <text x={left} y="12" className="tiny-axis-label">
          OUTPUT
        </text>
        <text x={right} y={bottom + 39} textAnchor="end" className="tiny-axis-label">
          INPUT
        </text>
        <g transform={`translate(${x(2.38)}, ${Math.max(top + 2, y(6.6) - 26)})`}>
          <rect width="106" height="25" rx="7" fill="#edf5ee" />
          <text x="53" y="17" textAnchor="middle" className="tiny-target-label">
            target = 2 × input
          </text>
        </g>
      </svg>
      <div className="tiny-example-selector">
        <span>Inspect an example</span>
        <div>
          {examples.map((item, index) => (
            <button
              key={item.input}
              className={selectedIndex === index ? 'selected' : ''}
              aria-pressed={selectedIndex === index}
              onClick={() => onSelect(index)}
            >
              Input {item.input}
              <ArrowRight size={11} />
              {item.target}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TinyLearner({ onContinue }: { onContinue: () => void }) {
  const [mode, setMode] = useState<LearningMode>('visual');
  const [model, dispatch] = useReducer(modelReducer, initialState);
  const [rate, setRate] = useState(0.1);
  const [selectedIndex, setSelectedIndex] = useState(1);
  const [answer, setAnswer] = useState<'smaller' | 'larger' | null>(null);
  const [showMath, setShowMath] = useState(false);
  const examples = scalarExamples(model.weight);
  const example = examples[selectedIndex];
  const loss = scalarLoss(model.weight);
  const calculation = model.lastStep ?? scalarStep(model.weight, rate);
  const improved =
    calculation.lossBefore > 0 ? (1 - calculation.lossAfter / calculation.lossBefore) * 100 : 0;

  useEffect(() => {
    if (!model.running) return;
    const timer = window.setInterval(() => dispatch({ type: 'step', rate }), 650);
    return () => window.clearInterval(timer);
  }, [model.running, rate]);

  function reset() {
    dispatch({ type: 'reset' });
    setRate(0.1);
  }

  return (
    <div className={`tiny-lesson mode-${mode}`}>
      <header className="lesson-heading tiny-heading">
        <div className="tiny-heading-top">
          <p className="eyebrow">
            EXPERIMENT 01 <span> / </span> START SMALL
          </p>
          <span className="tiny-duration">No experience needed</span>
        </div>
        <h1>
          How does a machine <span>learn?</span>
        </h1>
        <p>
          No magic. A guess, a mistake, and one small adjustment.
          <br className="tiny-desktop-break" /> Let’s see every part of it happen.
        </p>
      </header>
      <ModeSwitcher
        value={mode}
        onChange={(value) => {
          setMode(value);
          setShowMath(value === 'math');
          dispatch({ type: 'pause' });
        }}
      />
      {mode === 'code' ? (
        <CodeWalkthrough
          title="One weight, written completely from scratch"
          code={tinyCode}
          steps={[
            {
              label: 'Start with examples and a guess',
              explanation:
                'The data has inputs and the right answers. The machine only has one adjustable multiplier.',
              lines: tinyCode
                .split('\n')
                .flatMap((line, i) =>
                  line.includes('const data') ||
                  line.includes('let weight') ||
                  line.includes('const learningRate')
                    ? [i + 1]
                    : [],
                ),
            },
            {
              label: 'Measure the miss and its slope',
              explanation:
                'For every example, calculate a prediction, half squared error, and error × input. Averaging gives the exact batch loss and gradient.',
              lines: tinyCode
                .split('\n')
                .flatMap((line, i) =>
                  line.includes('const guess') ||
                  line.includes('const error') ||
                  line.includes('loss +=') ||
                  line.includes('gradient +=')
                    ? [i + 1]
                    : [],
                ),
            },
            {
              label: 'Move once, then repeat',
              explanation:
                'Subtract rate × gradient from the old weight. Run node examples/one-weight.mjs: the first new weight is 1.2.',
              lines: tinyCode
                .split('\n')
                .flatMap((line, i) =>
                  line.includes('const next') ||
                  line.includes('console.log') ||
                  line.includes('weight = next')
                    ? [i + 1]
                    : [],
                ),
            },
          ]}
        />
      ) : (
        <>
          <div className="tiny-story-strip" aria-label="The three steps of learning">
            <div>
              <span className="tiny-step-number">01</span>
              <p>
                <strong>Make a guess</strong>
                <span>Use a number called a weight.</span>
              </p>
            </div>
            <ArrowRight size={15} className="tiny-story-arrow" />
            <div>
              <span className="tiny-step-number">02</span>
              <p>
                <strong>Measure the miss</strong>
                <span>Compare it with the answer.</span>
              </p>
            </div>
            <ArrowRight size={15} className="tiny-story-arrow" />
            <div>
              <span className="tiny-step-number">03</span>
              <p>
                <strong>Adjust. Try again.</strong>
                <span>Let the mistake guide the change.</span>
              </p>
            </div>
          </div>

          <div className="tiny-workbench">
            <section className="panel tiny-chart-panel" aria-labelledby="tiny-chart-heading">
              <div className="tiny-panel-heading">
                <div>
                  <h2 id="tiny-chart-heading">Meet your tiny machine</h2>
                  <p>One input. One weight. One guess.</p>
                </div>
                <span className="tiny-live">
                  <i />
                  LIVE
                </span>
              </div>
              <div className="tiny-model-equation">
                <span className="tiny-equation-input">input</span>
                <span>×</span>
                <span className="tiny-equation-weight">
                  weight <b>{number(model.weight)}</b>
                </span>
                <span>=</span>
                <span className="tiny-equation-output">guess</span>
              </div>
              <PredictionChart
                weight={model.weight}
                selectedIndex={selectedIndex}
                onSelect={setSelectedIndex}
              />
              <div className="tiny-chart-caption">
                <MousePointer2 size={14} />
                <span>The green dots are examples. Move the purple line to match them.</span>
              </div>
            </section>

            <section className="panel tiny-controls-panel" aria-labelledby="tiny-controls-heading">
              <div className="tiny-panel-heading">
                <div>
                  <h2 id="tiny-controls-heading">You’re in control</h2>
                  <p>Try it by hand. Then let it learn.</p>
                </div>
              </div>
              <label className="tiny-slider-label" htmlFor="tiny-weight">
                <span>
                  The weight <span className="tiny-soft-label">w</span>
                </span>
                <output>{number(model.weight)}</output>
              </label>
              <input
                id="tiny-weight"
                aria-label="Weight"
                type="range"
                min="-1"
                max="4"
                step="0.01"
                value={model.weight}
                onChange={(event) =>
                  dispatch({ type: 'weight', weight: Number(event.target.value) })
                }
                style={
                  { '--range-progress': `${((model.weight + 1) / 5) * 100}%` } as CSSProperties
                }
              />
              <div className="tiny-slider-extents">
                <span>−1</span>
                <span>Drag to change the guess</span>
                <span>4</span>
              </div>
              <div className="tiny-selected-example">
                <div>
                  <span>FOR INPUT {example.input}</span>
                  <span>TARGET {example.target}</span>
                </div>
                <p>
                  {example.input} <span>×</span> <b>{number(model.weight)}</b> <span>=</span>{' '}
                  <strong>{number(example.prediction)}</strong>
                </p>
                <span>
                  {Math.abs(example.error) < 0.0005
                    ? 'That’s a match.'
                    : `The guess is ${number(Math.abs(example.error))} too ${example.error > 0 ? 'high' : 'low'}.`}
                </span>
              </div>
              <div className="tiny-control-divider" />
              <label className="tiny-slider-label tiny-rate-label" htmlFor="tiny-rate">
                <span>
                  Learning rate <span className="tiny-soft-label">step size</span>
                </span>
                <output>{rate.toFixed(2)}</output>
              </label>
              <input
                id="tiny-rate"
                aria-label="Learning rate"
                type="range"
                min="0.01"
                max="0.3"
                step="0.01"
                value={rate}
                onChange={(event) => {
                  setRate(Number(event.target.value));
                  dispatch({ type: 'pause' });
                }}
                style={{ '--range-progress': `${((rate - 0.01) / 0.29) * 100}%` } as CSSProperties}
              />
              <div className="tiny-slider-extents">
                <span>Smaller steps</span>
                <span>Bigger steps</span>
              </div>
              <button
                className="button primary tiny-train-button"
                onClick={() => dispatch({ type: 'step', rate })}
                disabled={model.running}
              >
                <Sparkles size={16} />
                Train one step
                <ArrowUpRight size={16} />
              </button>
              <div className="tiny-secondary-controls">
                <button
                  className="button tiny-auto-button"
                  onClick={() => dispatch({ type: 'toggle' })}
                >
                  {model.running ? <Pause size={14} /> : <Play size={14} />}
                  {model.running ? 'Pause' : 'Auto train'}
                </button>
                <button
                  className="button tiny-reset-button"
                  onClick={reset}
                  aria-label="Reset the tiny machine"
                >
                  <RotateCcw size={14} />
                  Reset
                </button>
              </div>
              <p className="tiny-no-black-box">Real calculations. Every change is inspectable.</p>
            </section>
          </div>

          <div className="tiny-results" aria-label="Current training results">
            <div className="tiny-result">
              <span>CURRENT WEIGHT</span>
              <strong>
                {model.weight.toFixed(3)}
                <small> aiming for 2</small>
              </strong>
              <span>A multiplier, not a thought.</span>
            </div>
            <div className="tiny-result">
              <span>
                MISTAKE SCORE <span className="tiny-result-alias">/ loss</span>
              </span>
              <strong>
                {preciseLoss(loss)}
                <span className="tiny-loss-indicator">
                  {loss < 0.001 ? <Check size={14} /> : <i />}
                  {loss < 0.001 ? 'Almost there' : 'Lower is better'}
                </span>
              </strong>
              <span>All 3 examples count.</span>
            </div>
            <div className="tiny-result">
              <span>TRAINING STEPS</span>
              <strong>
                {model.steps}
                <small> adjustments</small>
              </strong>
              <span>One step updates one weight.</span>
            </div>
          </div>
          {model.notice && (
            <p className="tiny-status" role="status">
              <Check size={15} />
              {model.notice}
            </p>
          )}

          <section className="tiny-under-hood" aria-labelledby="tiny-math-heading">
            <div className="tiny-math-summary">
              <div>
                <span className="tiny-math-icon">ƒ</span>
                <div>
                  <h2 id="tiny-math-heading">Nothing up its sleeve.</h2>
                  <p>
                    {model.lastStep
                      ? 'Here is exactly what the last training step did.'
                      : 'Here is exactly what the next training step will do.'}
                  </p>
                </div>
              </div>
              <button
                className="text-button tiny-math-toggle"
                aria-expanded={showMath}
                aria-controls="tiny-calculation"
                onClick={() => setShowMath(!showMath)}
              >
                {showMath ? 'Hide' : 'Show'} the math
                <ChevronDown size={16} className={showMath ? 'is-open' : ''} />
              </button>
            </div>
            <div className="tiny-weight-update">
              <div>
                <span>{model.lastStep ? 'BEFORE' : 'CURRENT'}</span>
                <b>{number(calculation.weightBefore)}</b>
              </div>
              <span className="tiny-update-operator">−</span>
              <div>
                <span>STEP SIZE</span>
                <b>{number(calculation.learningRate)}</b>
              </div>
              <span className="tiny-update-operator">×</span>
              <div>
                <span>GRADIENT</span>
                <b className="tiny-gradient-value">{number(calculation.gradient)}</b>
              </div>
              <ArrowRight size={19} className="tiny-update-arrow" />
              <div className="tiny-update-after">
                <span>{model.lastStep ? 'AFTER' : 'NEXT'}</span>
                <b>{number(calculation.weightAfter)}</b>
              </div>
              <p>
                {calculation.gradient < -0.0005
                  ? 'Negative slope? Subtracting it increases the weight.'
                  : calculation.gradient > 0.0005
                    ? 'Positive slope? Subtracting it decreases the weight.'
                    : 'A zero gradient means this weight stays put.'}
              </p>
            </div>
            {showMath && (
              <div id="tiny-calculation" className="tiny-calculation">
                <p className="tiny-calculation-context">
                  {model.lastStep ? `Snapshot of step ${model.steps}:` : 'Preview of one step:'} all
                  values below use <strong>w = {number(calculation.weightBefore)}</strong>.
                  Displayed numbers are rounded; training uses full precision.
                </p>
                <div className="tiny-math-table-wrap">
                  <table className="tiny-math-table">
                    <caption>Every training example contributes to this update</caption>
                    <thead>
                      <tr>
                        <th>Input x</th>
                        <th>Answer y</th>
                        <th>Guess w × x</th>
                        <th>Error = guess − y</th>
                        <th>Error²</th>
                        <th>Error × x</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculation.examples.map((item) => (
                        <tr key={item.input}>
                          <td>{item.input}</td>
                          <td>{item.target}</td>
                          <td>{number(item.prediction)}</td>
                          <td>{number(item.error)}</td>
                          <td>{number(item.squaredError)}</td>
                          <td>{number(item.gradientContribution)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="tiny-math-explanations">
                  <div>
                    <span className="tiny-math-count">1</span>
                    <h3>Turn misses into a score</h3>
                    <p>
                      Square each error so opposite misses don’t cancel. Average, then halve it to
                      simplify the derivative.
                    </p>
                    <code>L = (1 / 2n) Σ(wx − y)²</code>
                    <code>
                      = ({calculation.examples.map((item) => number(item.squaredError)).join(' + ')}
                      ) / 6 ≈ {preciseLoss(calculation.lossBefore)}
                    </code>
                  </div>
                  <div>
                    <span className="tiny-math-count">2</span>
                    <h3>Find the local slope</h3>
                    <p>
                      The chain rule connects the error to the weight. Multiply each error by its
                      input, then average.
                    </p>
                    <code>dL/dw = (1/n) Σ(wx − y) × x</code>
                    <code>
                      = (
                      {calculation.examples
                        .map((item) => signed(item.gradientContribution))
                        .join(' + ')}
                      ) / 3 ≈ {number(calculation.gradient)}
                    </code>
                  </div>
                  <div>
                    <span className="tiny-math-count">3</span>
                    <h3>Step downhill</h3>
                    <p>
                      Subtract the slope times the step size. Recalculate the guesses with this new
                      weight.
                    </p>
                    <code>w_new = w − rate × gradient</code>
                    <code>
                      = {number(calculation.weightBefore)} − {number(calculation.learningRate)} ×{' '}
                      {signed(calculation.gradient)} ≈ {number(calculation.weightAfter)}
                    </code>
                  </div>
                </div>
                <div className="tiny-chain-rule">
                  <strong>Zoom in on the chain rule</strong>
                  <p>
                    For a single example, let error e = wx − y and mistake ℓ = ½e². Then dℓ/de = e
                    and de/dw = x. Multiply along the path: <b>dℓ/dw = e × x.</b> Averaging these
                    paths gives the batch gradient above.
                  </p>
                </div>
                <div className="tiny-math-outcome">
                  <Check size={16} />
                  <span>
                    Mistake score: <b>{preciseLoss(calculation.lossBefore)}</b> →{' '}
                    <b>{preciseLoss(calculation.lossAfter)}</b>
                    {calculation.lossBefore > 0
                      ? ` (${number(Math.abs(improved), 1)}% ${improved >= 0 ? 'smaller' : 'larger'}).`
                      : '.'}{' '}
                    The machine used the examples and arithmetic; nobody handed the target weight to
                    its update rule.
                  </span>
                </div>
              </div>
            )}
          </section>

          <div className="tiny-bottom-grid">
            <section className="tiny-takeaway">
              <span className="tiny-card-eyebrow">
                <Sparkles size={14} />
                THE LITTLE BIG IDEA
              </span>
              <h2>
                Learning is changing numbers
                <br />
                to make fewer mistakes.
              </h2>
              <p>
                This weight is just a multiplier. The useful behavior comes from what that number{' '}
                <em>does</em> when an input passes through it.
              </p>
              <p className="tiny-takeaway-footnote">
                Bigger networks repeat this idea with many connected numbers. What those numbers
                collectively represent is the deeper question.
              </p>
            </section>
            <section className="tiny-quiz" aria-labelledby="tiny-quiz-heading">
              <span className="tiny-card-eyebrow">
                YOUR TURN <span> / </span> A 10-SECOND CHECK
              </span>
              <h2 id="tiny-quiz-heading">Which way should it move?</h2>
              <p>
                For input <b>3</b>, a model guesses <b>3</b>. The target is <b>6</b>. To get closer,
                its weight should become…
              </p>
              <div className="tiny-quiz-options">
                <button
                  className={answer === 'smaller' ? 'chosen incorrect' : ''}
                  onClick={() => setAnswer('smaller')}
                  aria-pressed={answer === 'smaller'}
                >
                  Smaller <span>↘</span>
                </button>
                <button
                  className={answer === 'larger' ? 'chosen correct' : ''}
                  onClick={() => setAnswer('larger')}
                  aria-pressed={answer === 'larger'}
                >
                  Larger <span>{answer === 'larger' ? <Check size={15} /> : '↗'}</span>
                </button>
              </div>
              <p
                className={`tiny-quiz-feedback ${answer === 'larger' ? 'correct' : ''}`}
                aria-live="polite"
              >
                {answer === 'larger'
                  ? 'Exactly. 3 × 1 = 3; increasing the weight toward 2 moves the guess toward 6.'
                  : answer === 'smaller'
                    ? 'Try again: a smaller multiplier would make the guess even lower.'
                    : 'Make a prediction before the machine does.'}
              </p>
            </section>
          </div>
          <div className="tiny-next">
            <div>
              <span>UP NEXT</span>
              <strong>How did it know which way to move?</strong>
              <p>Meet a blindfolded hiker and feel what a gradient does.</p>
            </div>
            <button className="button primary" onClick={onContinue}>
              Go a little deeper
              <ArrowRight size={17} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
