import { useEffect, useReducer, useState } from 'react';
import { ArrowLeft, ArrowRight, Footprints, Pause, Play, RotateCcw } from 'lucide-react';
import {
  hillGradient,
  hillLoss,
  searchStep,
  startSearch,
  type Landscape,
  type SearchMethod,
  type SearchState,
} from '../lib/optimizers';
import { CodeWalkthrough, ModeSwitcher, type LearningMode } from './LearningModes';
import gradientCode from '../../examples/gradient-descent.mjs?raw';
import GradientCompass from './GradientCompass';
import './gradient.css';

const fmt = (n: number) =>
  Math.abs(n) > 999 ? n.toExponential(2) : Number(n.toFixed(3)).toString();

function codeLines(from: string, through: string): number[] {
  const lines = gradientCode.split('\n');
  const start = lines.findIndex((line) => line.includes(from));
  const end = lines.findIndex((line, i) => i >= start && line.includes(through));
  return start < 0 || end < start
    ? []
    : Array.from({ length: end - start + 1 }, (_, i) => start + i + 1);
}

interface JourneyState {
  search: SearchState;
  running: boolean;
  trail: number[];
  notice: string;
}
type Action =
  | { type: 'reset'; weight?: number }
  | { type: 'guess'; delta: number }
  | { type: 'toggle' }
  | { type: 'pause' }
  | { type: 'step'; method: SearchMethod; rate: number; landscape: Landscape };
const fresh = (weight = 5): JourneyState => ({
  search: startSearch(weight),
  running: false,
  trail: [weight],
  notice: '',
});

function journeyReducer(state: JourneyState, action: Action): JourneyState {
  if (action.type === 'reset') return fresh(action.weight);
  if (action.type === 'toggle') return { ...state, running: !state.running };
  if (action.type === 'pause') return { ...state, running: false };
  if (action.type === 'guess') {
    const before = state.search.weight;
    const weight = Math.max(-2, Math.min(6, before + action.delta));
    return {
      ...fresh(weight),
      trail: [...state.trail, weight],
      notice:
        weight === before
          ? 'That is the edge of this practice area. Try the other way.'
          : hillLoss(weight) < hillLoss(before)
            ? `Yes! The mistake shrank from ${fmt(hillLoss(before))} to ${fmt(hillLoss(weight))}. You walked downhill.`
            : `The mistake grew from ${fmt(hillLoss(before))} to ${fmt(hillLoss(weight))}. That was uphill. Try the other way.`,
    };
  }
  try {
    const search = searchStep(state.search, action.method, action.rate, action.landscape);
    const loss = hillLoss(search.weight, action.landscape);
    const flat =
      (action.method === 'gradient' || action.method === 'momentum') &&
      Math.abs(hillGradient(search.weight, action.landscape)) < 1e-5 &&
      Math.abs(search.velocity) < 1e-4;
    const stop = loss > 1000 || flat || search.steps >= (action.method === 'grid' ? 41 : 80);
    const notice =
      loss > 1000
        ? 'The jumps are growing! We paused. Try a smaller step size.'
        : flat && loss > 0.001
          ? 'The ground here is almost flat, but another valley is lower. A local slope cannot see the whole landscape.'
          : flat
            ? 'Almost at the bottom. The answer is now almost 2. Smaller slopes naturally make smaller steps.'
            : search.steps >= 80
              ? '80 steps completed. Pause and inspect what changed.'
              : search.steps === 41 && action.method === 'grid'
                ? 'All 41 grid points checked. This grid happens to include the exact answer, 2.'
                : search.last && !search.last.accepted
                  ? `Tried ${fmt(search.last.proposal)}. Its mistake was worse, so we kept ${fmt(search.weight)}.`
                  : loss > hillLoss(state.search.weight, action.landscape)
                    ? 'This step increased the mistake. A downhill direction does not make every step size safe.'
                    : `Step ${search.steps}: the weight is ${fmt(search.weight)} and the mistake is ${fmt(loss)}.`;
    return {
      search,
      running: state.running && !stop,
      trail: [...state.trail, search.weight].slice(-81),
      notice,
    };
  } catch (error) {
    return {
      ...state,
      running: false,
      notice: error instanceof Error ? error.message : 'Restart to try again.',
    };
  }
}

const guide = [
  {
    title: 'First, you steer.',
    text: 'Our practice card says: input 1 should give answer 2. Move the hiker to change the weight. Which way makes the guess closer to 2?',
    next: 'Next: feel the slope',
  },
  {
    title: 'Now cover the hiker’s eyes.',
    text: 'You can see the whole hill. Our pretend hiker only feels the slope under their feet. If the ground rises to the right, walk left. The program calculates that local tilt from the mistake formula. With one weight, this slope is its gradient.',
    next: 'Next: choose a step',
  },
  {
    title: 'A direction is not a distance.',
    text: 'Knowing which way helps does not tell us how far to jump. The learning rate scales the slope to choose the move. Click Take one step: the program subtracts learning rate × slope from the saved weight.',
    next: 'Next: repeat the rule',
  },
  {
    title: 'Repeat the same tiny instruction.',
    text: 'Feel the slope. Take a small downhill step. Feel again. As the mistake shrinks, the slope flattens and the steps get smaller. That repeated change is this machine’s learning.',
    next: '',
  },
];

function Mountain({
  weight,
  trail,
  landscape,
  revealSlope,
  proposal,
}: {
  weight: number;
  trail: number[];
  landscape: Landscape;
  revealSlope: boolean;
  proposal?: number;
}) {
  const low = Math.min(-2, weight - 0.8, ...trail);
  const high = Math.max(6, weight + 0.8, ...trail);
  const maxLoss = Math.max(
    9,
    ...Array.from({ length: 201 }, (_, i) => hillLoss(low + (i * (high - low)) / 200, landscape)),
  );
  const x = (w: number) => 60 + ((w - low) / (high - low)) * 600;
  const y = (w: number) => 287 - (hillLoss(w, landscape) / maxLoss) * 188;
  const path = Array.from({ length: 241 }, (_, i) => {
    const w = low + (i * (high - low)) / 240;
    return `${i === 0 ? 'M' : 'L'} ${x(w)} ${y(w)}`;
  }).join(' ');
  const g = hillGradient(weight, landscape);
  const tangentWidth = Math.min(0.55, (high - low) / 12);
  const tangentY = (w: number) =>
    287 - ((hillLoss(weight, landscape) + g * (w - weight)) / maxLoss) * 188;
  return (
    <svg
      className="gradient-mountain"
      viewBox="0 0 720 354"
      role="img"
      aria-labelledby="hill-title hill-description"
    >
      <title id="hill-title">A hiker on the mistake landscape</title>
      <desc id="hill-description">
        Horizontal position is the weight. Height is the training mistake, called loss. Current
        weight {fmt(weight)}, loss {fmt(hillLoss(weight, landscape))}.{' '}
        {revealSlope ? `Slope ${fmt(g)}.` : ''} The lowest point is at weight 2.
      </desc>
      <defs>
        <linearGradient id="hill-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#b9cfad" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#e6efdc" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <text x="28" y="38" className="gradient-svg-note">
        HIGHER = BIGGER MISTAKE
      </text>
      <path d={`${path} L 660 298 L 60 298 Z`} fill="url(#hill-fill)" />
      <path d={path} fill="none" stroke="#668b5b" strokeWidth="3" />
      <line x1="60" x2="660" y1="299" y2="299" stroke="#b7c4ab" />
      {[low, 2, high].map((w) => (
        <g key={w}>
          <line x1={x(w)} x2={x(w)} y1="299" y2="305" stroke="#879a7b" />
          <text x={x(w)} y="321" textAnchor="middle" className="gradient-svg-number">
            {fmt(w)}
          </text>
        </g>
      ))}
      <text x="360" y="345" textAnchor="middle" className="gradient-svg-note">
        LEFT / RIGHT = CHANGE THE WEIGHT
      </text>
      <line x1={x(2)} x2={x(2)} y1={y(2) - 36} y2={y(2)} stroke="#527244" strokeWidth="2" />
      <path d={`M${x(2)},${y(2) - 36} l22,6 l-22,7 Z`} fill="#668b5b" />
      {trail.slice(0, -1).map((w, i) => (
        <circle
          key={i}
          cx={x(w)}
          cy={y(w)}
          r="3.5"
          fill="#947db4"
          opacity={0.2 + (i / trail.length) * 0.55}
        />
      ))}
      {proposal !== undefined && proposal >= low && proposal <= high && (
        <g>
          <circle
            cx={x(proposal)}
            cy={y(proposal)}
            r="9"
            fill="none"
            stroke="#b8784e"
            strokeWidth="2"
            strokeDasharray="3 3"
          />
          <text
            x={x(proposal)}
            y={y(proposal) - 16}
            textAnchor="middle"
            className="gradient-svg-number"
          >
            tried here
          </text>
        </g>
      )}
      {revealSlope && (
        <line
          x1={x(weight - tangentWidth)}
          y1={tangentY(weight - tangentWidth)}
          x2={x(weight + tangentWidth)}
          y2={tangentY(weight + tangentWidth)}
          stroke="#9270b7"
          strokeWidth="4"
          strokeLinecap="round"
        />
      )}
      <g
        className="gradient-hiker"
        style={{ transform: `translate(${x(weight)}px, ${y(weight)}px)` }}
      >
        <ellipse cy="2" rx="14" ry="4" fill="#365741" opacity="0.15" />
        <path
          d="M-7,-2 L-3,-20 L7,-2 M-3,-21 L-4,-42 M-4,-34 L-17,-25 M-4,-34 L13,-25"
          stroke="#344b3b"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="-4" cy="-53" r="11" fill="#dfb581" stroke="#344b3b" strokeWidth="2" />
        {revealSlope ? (
          <>
            <path d="M-15,-55 L7,-54" stroke="#82609e" strokeWidth="7" />
            <path d="M-14,-54 l-9,7 m10,-7 l-8,-7" stroke="#82609e" strokeWidth="3" />
          </>
        ) : (
          <>
            <circle cx="-7" cy="-54" r="1.5" fill="#293d35" />
            <circle cx="0" cy="-54" r="1.5" fill="#293d35" />
          </>
        )}
        <path d="M14,-28 L20,0" stroke="#9d7c54" strokeWidth="3" strokeLinecap="round" />
        <rect x="-21" y="-42" width="13" height="21" rx="5" fill="#b3c097" />
      </g>
      <text x="360" y="63" textAnchor="middle" className="gradient-svg-caption">
        {revealSlope
          ? Math.abs(g) < 0.001
            ? 'Almost flat here.'
            : g > 0
              ? 'Local downhill direction: left ←'
              : 'Local downhill direction: right →'
          : 'Where should the hiker go?'}
      </text>
    </svg>
  );
}

export default function GradientJourney() {
  const [mode, setMode] = useState<LearningMode>('visual');
  const [stage, setStage] = useState(0);
  const [rate, setRate] = useState(0.3);
  const [method, setMethod] = useState<SearchMethod>('gradient');
  const [landscape, setLandscape] = useState<Landscape>('bowl');
  const [state, dispatch] = useReducer(journeyReducer, undefined, () => fresh());
  const weight = state.search.weight;
  const gradient = hillGradient(weight, landscape);
  const slopeMethod = method === 'gradient' || method === 'momentum';
  const step = () => dispatch({ type: 'step', rate, method, landscape });

  useEffect(() => {
    if (!state.running) return;
    const timer = window.setInterval(
      () => dispatch({ type: 'step', rate, method, landscape }),
      1100,
    );
    return () => window.clearInterval(timer);
  }, [state.running, rate, method, landscape]);

  const reset = (all = false) => {
    dispatch({ type: 'reset' });
    if (all) {
      setStage(0);
      setRate(0.3);
      setMethod('gradient');
      setLandscape('bowl');
    }
  };
  const challenge = (kind: 'overshoot' | 'valleys') => {
    setMethod('gradient');
    setLandscape(kind === 'valleys' ? 'valleys' : 'bowl');
    setRate(kind === 'valleys' ? 0.08 : 2.5);
    dispatch({ type: 'reset', weight: kind === 'valleys' ? 4.5 : 5 });
  };
  const changeMode = (value: LearningMode) => {
    dispatch({ type: 'pause' });
    setMode(value);
  };

  return (
    <div className="gradient-lesson">
      <header className="lesson-heading">
        <p className="eyebrow">
          A GUIDED WALK <span>/</span> WHY WEIGHTS CHANGE
        </p>
        <h1>
          Learning is a trail of <em>smaller mistakes.</em>
        </h1>
        <p>
          Pip, our pretend watering program, used a saved number called a weight. Now picture one
          weight as a hiker’s position: changing the weight moves the hiker; a smaller mistake puts
          them lower on the hill. You will discover how the program chooses a direction.
        </p>
      </header>
      <ModeSwitcher value={mode} onChange={changeMode} />

      {mode === 'visual' && (
        <>
          <section className="panel gradient-game">
            <div className="gradient-guide-top">
              <span className="eyebrow">YOUR WALK · {stage + 1} OF 4</span>
              <button className="text-button" onClick={() => reset(true)}>
                <RotateCcw size={14} /> Replay tutorial
              </button>
            </div>
            <div
              className="gradient-progress"
              role="group"
              aria-label={`Tutorial step ${stage + 1} of 4`}
            >
              {guide.map((_, i) => (
                <span key={i} className={i <= stage ? 'filled' : ''} />
              ))}
            </div>
            <div className="gradient-story">
              <span className="gradient-step-number">{stage + 1}</span>
              <div>
                <h2>
                  {stage === 3 && !slopeMethod
                    ? 'Try guesses without feeling a slope.'
                    : guide[stage].title}
                </h2>
                <p>
                  {stage === 0 &&
                    `The machine multiplies 1 by its current weight, ${fmt(weight)}, so it guesses ${fmt(weight)}. `}
                  {stage === 3 && !slopeMethod
                    ? 'Check a candidate number. Score its mistake. Keep it only if it improves the best guess so far. The orange ring shows the candidate, even when the hiker stays put.'
                    : guide[stage].text}
                </p>
              </div>
            </div>
            <div className="gradient-mapping">
              <span>
                Hiker’s position = <strong>weight</strong>
              </span>
              <span>
                Height = <strong>mistake (loss)</strong>
              </span>
              <span>
                Flag = <strong>answer 2</strong>
              </span>
            </div>
            <Mountain
              weight={weight}
              trail={state.trail}
              landscape={landscape}
              revealSlope={stage > 0 && slopeMethod}
              proposal={!slopeMethod ? state.search.last?.proposal : undefined}
            />
            <div className="gradient-readings">
              <div>
                <span>Machine’s guess</span>
                <strong data-testid="hiker-weight">{fmt(weight)}</strong>
              </div>
              <div>
                <span>Mistake score</span>
                <strong>{fmt(hillLoss(weight, landscape))}</strong>
              </div>
              {stage > 0 && slopeMethod && (
                <div>
                  <span>Local slope</span>
                  <strong>{fmt(gradient)}</strong>
                </div>
              )}
            </div>
            <div className="gradient-controls">
              {stage === 0 ? (
                <>
                  <button
                    className="button"
                    onClick={() => dispatch({ type: 'guess', delta: -0.5 })}
                  >
                    <ArrowLeft size={17} /> Try walking left
                  </button>
                  <button
                    className="button"
                    onClick={() => dispatch({ type: 'guess', delta: 0.5 })}
                  >
                    Try walking right <ArrowRight size={17} />
                  </button>
                </>
              ) : stage === 1 ? (
                <p className="gradient-local-hint">
                  The purple line shows only the tilt at our feet.{' '}
                  {gradient > 0
                    ? 'Positive slope → subtract a little from the weight.'
                    : gradient < 0
                      ? 'Negative slope → add a little to the weight.'
                      : 'Zero slope → no gradient step.'}
                </p>
              ) : (
                <>
                  <button className="button primary" onClick={step} disabled={state.running}>
                    <Footprints size={17} /> {slopeMethod ? 'Take one step' : 'Try one candidate'}
                  </button>
                  {stage === 3 && (
                    <button className="button" onClick={() => dispatch({ type: 'toggle' })}>
                      {state.running ? <Pause size={16} /> : <Play size={16} />}
                      {state.running ? 'Pause walk' : 'Walk automatically'}
                    </button>
                  )}
                  <button className="button" onClick={() => reset()}>
                    <RotateCcw size={15} /> Restart walk
                  </button>
                </>
              )}
            </div>
            <p className="gradient-status" role="status">
              {state.notice ||
                (stage < 2
                  ? 'The flag marks the best weight for us to see. The update uses the current slope; it does not jump straight to the flag.'
                  : `Ready. Step size is ${rate}. Every click runs a real calculation.`)}
            </p>
            {stage >= 2 && slopeMethod && (
              <div className="gradient-next">
                <span>Next {method === 'momentum' ? 'momentum' : 'gradient'} step</span>
                <code>
                  {fmt(weight)} − {rate} ×{' '}
                  {fmt(method === 'momentum' ? 0.7 * state.search.velocity + gradient : gradient)} ={' '}
                  <strong>
                    {fmt(
                      weight -
                        rate *
                          (method === 'momentum'
                            ? 0.7 * state.search.velocity + gradient
                            : gradient),
                    )}
                  </strong>
                </code>
                <small>
                  {method === 'momentum'
                    ? 'old weight − step size × (0.7 × remembered slope + current slope)'
                    : 'old weight − step size × slope'}
                </small>
              </div>
            )}
            {stage < 3 && (
              <div className="gradient-guide-nav">
                {stage > 0 && (
                  <button
                    className="text-button"
                    onClick={() => {
                      dispatch({ type: 'pause' });
                      setStage(stage - 1);
                    }}
                  >
                    Back one idea
                  </button>
                )}
                <button className="button primary" onClick={() => setStage(stage + 1)}>
                  {guide[stage].next}
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
            {stage === 3 && (
              <div className="gradient-finished">
                <strong>You just learned gradient descent.</strong>
                <p>
                  “Gradient” means local slope. “Descent” means go downhill. The hiker is a picture
                  of arithmetic; the computer has no eyes, feelings, or intention.
                </p>
              </div>
            )}
          </section>

          {stage === 3 && <GradientCompass />}
          {stage === 3 && (
            <details className="panel gradient-challenges">
              <summary>Ready to experiment? Break the rule, then try alternatives.</summary>
              <div className="gradient-challenge-body">
                <p>
                  The easy bowl has one bottom. Real training can have many directions, flat areas,
                  noise, and several valleys. These little challenges show why the recipe needs
                  care.
                </p>
                <div className="gradient-controls">
                  <button className="button" onClick={() => challenge('overshoot')}>
                    Challenge: steps too big
                  </button>
                  <button className="button" onClick={() => challenge('valleys')}>
                    Challenge: a different valley
                  </button>
                  <button
                    className="button"
                    onClick={() => {
                      setLandscape('bowl');
                      setMethod('gradient');
                      setRate(0.3);
                      reset();
                    }}
                  >
                    Restore the easy bowl
                  </button>
                </div>
                <div className="gradient-settings">
                  <label>
                    How should we search?
                    <select
                      value={method}
                      onChange={(e) => {
                        setMethod(e.target.value as SearchMethod);
                        dispatch({ type: 'reset', weight: landscape === 'valleys' ? 4.5 : 5 });
                      }}
                    >
                      <option value="gradient">Gradient: feel this slope</option>
                      <option value="momentum">Momentum: remember past slopes</option>
                      <option value="random">Random: test scattered guesses</option>
                      <option value="grid">Grid: check every 0.2 from −2 to 6</option>
                    </select>
                  </label>
                  <label>
                    Step size: {rate}
                    <input
                      aria-label="Hiker step size"
                      type="range"
                      min="0.02"
                      max="2.6"
                      step="0.02"
                      value={rate}
                      disabled={!slopeMethod}
                      onChange={(e) => {
                        dispatch({ type: 'pause' });
                        setRate(Number(e.target.value));
                      }}
                    />
                  </label>
                </div>
                <p className="gradient-method-note">
                  {method === 'gradient'
                    ? 'Gradient descent: use the current local slope. Cheap when gradients are available, but a big jump can increase loss, and a flat local minimum need not be the lowest point.'
                    : method === 'momentum'
                      ? 'Momentum: keep 70% of the previous accumulated slope and add today’s slope. This can move against the current downhill arrow, cross shallow dips, or overshoot. It is not a guarantee of a better minimum.'
                      : method === 'random'
                        ? 'Random search: test a reproducible sequence of guesses between −2 and 6. Keep only improvements. No derivatives needed, but it spends trials without following a direction. Dashed orange circles are tested guesses.'
                        : 'Grid search: test 41 values from −2 to 6, one at a time. Keep the best. Here the grid includes 2 exactly. With 10 choices for each of 100 weights, a full grid would need 10¹⁰⁰ combinations.'}
                </p>
                <p className="muted">
                  {state.search.lossChecks} loss values checked, including the starting point.
                  Gradient methods also compute a derivative each step; this is not an equal-compute
                  benchmark.
                </p>
                {landscape === 'valleys' && (
                  <p className="insight">
                    This is a deliberately bumpy mathematical toy, not our original one-example
                    loss. Start at 4.5 and use small steps: you can stop in the right-hand valley
                    while the lowest valley at 2 remains unseen. A new starting point or broader
                    search may help; neither promises success for all problems.
                  </p>
                )}
                <p>
                  <strong>Do we always need gradient descent?</strong> No. This bowl has an exact
                  answer: set its slope to zero and solve w = 2. Trees can choose splits; random
                  search can try candidates; some small linear problems have direct solutions.
                  Gradient methods matter because one backward pass can efficiently calculate local
                  advice for millions of adjustable weights.
                </p>
              </div>
            </details>
          )}
        </>
      )}

      {mode === 'math' && (
        <section className="panel gradient-maths">
          <p className="eyebrow">SAME WALK · THE EXACT ARITHMETIC</p>
          <h2>Why does subtracting the slope help?</h2>
          <p>
            Our practice card contains input x = 1 and the expected answer, or target, y = 2. The
            adjustable weight is w. Multiply input by weight to predict: wx = w. The error is guess
            − answer, or w − 2. Square it so misses in either direction count, then divide by 2 to
            make the later arithmetic simpler.
          </p>
          <ol className="gradient-equations">
            <li>
              <strong>Score the mistake.</strong>
              <code>L(w) = ½(w − 2)²</code>
              <p>L is the loss: one number measuring error on this training example.</p>
            </li>
            <li>
              <strong>Measure how a tiny change affects that score.</strong>
              <code>dL/dw = ½ × 2(w − 2) × 1 = w − 2</code>
              <p>
                Read dL/dw as “how fast the loss changes when the weight moves a tiny amount.” This
                derivative is the hiker’s slope. The power rule turns the square into 2(w − 2); the
                chain rule also multiplies by the inside slope, 1.
              </p>
            </li>
            <li>
              <strong>Move opposite that change.</strong>
              <code>w_next = w − η(dL/dw)</code>
              <p>
                η, read “eta,” is the learning rate. Δ means “change in,” and ≈ means “approximately
                equal.” For a tiny displacement Δw, ΔL ≈ (dL/dw)Δw. Choosing Δw = −η(dL/dw) gives ΔL
                ≈ −η(dL/dw)² ≤ 0. This is a local approximation; large steps can break it.
              </p>
            </li>
          </ol>
          <div className="gradient-live-math">
            <h3>Your current numbers</h3>
            <p>
              {landscape === 'bowl'
                ? 'The one-example bowl is selected.'
                : 'The optional bumpy toy is selected: L = 0.08(w−2)² + 1 − cos(3(w−2)), so dL/dw = 0.16(w−2) + 3 sin(3(w−2)).'}
            </p>
            <code>
              At w = {fmt(weight)}, dL/dw = {fmt(gradient)}
            </code>
            <code>
              Finite difference ≈ [L(w + 0.001) − L(w − 0.001)] / 0.002 ={' '}
              {fmt(
                (hillLoss(weight + 0.001, landscape) - hillLoss(weight - 0.001, landscape)) / 0.002,
              )}
            </code>
            <p>
              The finite difference checks the slope by trying a weight just to the right and just
              to the left: change in height ÷ distance across. It should be close to the derivative
              above.
            </p>
            <code>
              Next gradient step = {fmt(weight)} − {rate} × {fmt(gradient)} ={' '}
              {fmt(weight - rate * gradient)}
            </code>
            <button
              className="button primary"
              onClick={() => {
                setMethod('gradient');
                dispatch({ type: 'step', method: 'gradient', rate, landscape });
              }}
            >
              Calculate that gradient step
            </button>
          </div>
          <h3>For this bowl, you can predict training exactly.</h3>
          <p>
            Subtract 2 from both sides of the update: w_next − 2 = (1 − η)(w − 2). Repeat it t
            times:
          </p>
          <div className="formula">
            <code>w_t = 2 + (1 − η)ᵗ(w₀ − 2)</code>
          </div>
          <p>
            Here w₀ is the starting weight, w_t is the weight after t updates, and the raised t
            means multiply the same factor t times. For this curvature, 0 &lt; η &lt; 2 converges; η
            = 1 solves it in one step; η = 2 bounces; η &gt; 2 diverges unless you already started
            at 2. Different loss curvature changes the safe interval. This exact calculation
            predicts this training loss, not performance on unseen real-world data.
          </p>
        </section>
      )}

      {mode === 'code' && (
        <div className="gradient-code">
          <div className="panel">
            <h2>The whole learning loop. No machine-learning library.</h2>
            <p>
              This standalone example reproduces the easy bowl with gradient descent, starting at 5.
              Run <code>node examples/gradient-descent.mjs</code>. Change <code>rate</code> to 2.5
              and inspect how the error grows.
            </p>
          </div>
          <CodeWalkthrough
            title="examples/gradient-descent.mjs"
            code={gradientCode}
            steps={[
              {
                label: 'Measure the mistake',
                explanation:
                  'This is the hill. Each candidate weight gets a height: half its squared distance from the training answer, 2.',
                lines: codeLines('export function loss', '}'),
              },
              {
                label: 'Feel the local slope',
                explanation:
                  'Differentiate the loss by hand. There is no hidden learner: for this bowl, the slope is simply weight minus 2.',
                lines: codeLines('export function slope', '}'),
              },
              {
                label: 'Change stored numbers',
                explanation:
                  'Subtract step size times gradient, then save the new weight and loss. Repeating these ordinary arithmetic instructions is training.',
                lines: codeLines('for (let step', 'history.push'),
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}
