import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, FlaskConical, Pause, Play, RotateCcw } from 'lucide-react';
import { explain, initialNetwork, trainOneStep } from '../../examples/backprop-step.mjs';
import exampleCode from '../../examples/backprop-step.mjs?raw';
import xorCode from '../../examples/neural-network.mjs?raw';
import {
  CodeWalkthrough,
  ModeSwitcher,
  useReducedMotion,
  type LearningMode,
} from './LearningModes';
import NetworkLab from './NetworkLab';
import './backprop.css';

const n = (value: number) => Number(value.toFixed(5)).toString();
const stageNames = [
  'Read the inputs',
  'Make two mixtures',
  'Combine the mixtures',
  'Measure the miss',
  'Trace the mistake backward',
  'Choose the adjustment',
  'Try the new numbers',
];
type StepReceipt = ReturnType<typeof trainOneStep> & {
  firstWeightBefore: number;
  learningRate: number;
  practiceAnswer: number;
};

export default function BackpropJourney() {
  const [mode, setMode] = useState<LearningMode>('visual');
  const [fullCode, setFullCode] = useState(false);
  const [network, setNetwork] = useState(initialNetwork);
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(0.1);
  const [target, setTarget] = useState(2);
  const [choice, setChoice] = useState<'up' | 'down' | null>(null);
  const [receipt, setReceipt] = useState<StepReceipt | null>(null);
  const [round, setRound] = useState(0);
  const [lab, setLab] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const reducedMotion = useReducedMotion();
  const trace = useMemo(() => explain(network, [1, 2], target), [network, target]);
  const nudged = useMemo(() => {
    const preview = structuredClone(network);
    preview.weights[0][0] += 0.1;
    return explain(preview, [1, 2], target);
  }, [network, target]);

  useEffect(() => {
    if (!playing || stage >= 5 || mode !== 'visual' || lab) return;
    const timer = window.setTimeout(() => setStage(stage + 1), 6500);
    return () => window.clearTimeout(timer);
  }, [playing, stage, mode, lab]);
  function reset() {
    setNetwork(initialNetwork());
    setStage(0);
    setPlaying(false);
    setChoice(null);
    setReceipt(null);
    setRound(0);
    setShowNudge(false);
  }
  function next() {
    setShowNudge(false);
    if (stage < 5) setStage(stage + 1);
    else if (stage === 5) {
      const update = trainOneStep(network, rate, [1, 2], target);
      setReceipt({
        ...update,
        firstWeightBefore: network.weights[0][0],
        learningRate: rate,
        practiceAnswer: target,
      });
      setNetwork(update.network);
      setStage(6);
      setPlaying(false);
      setRound(round + 1);
    } else {
      setStage(0);
      setChoice(null);
      setReceipt(null);
    }
  }
  const g = trace.gradients.weights[0][0];
  const scenes = [
    {
      title: 'Start with two numbers.',
      text: `The network receives 1 and 2. This practice example has an answer of ${target}. First we will see what the network guesses with its current settings.`,
      action: 'Follow the inputs into the first mixing station.',
      calculation: `Inputs: x₁ = 1, x₂ = 2. Target: ${target}. The target is used to score the guess; it is not an input to these mixing stations.`,
    },
    {
      title: 'A weight controls how much gets through.',
      text: `The top station scales each input, then adds the pieces. A weight is the adjustable multiplier on one input. The station’s result is ${n(trace.hidden[0])}.`,
      action: 'Follow the two pieces below. The second station makes its own mixture.',
      calculation: `Top total: 1 × ${n(network.weights[0][0])} + 2 × ${n(network.weights[0][1])} + ${n(network.biases[0])} = ${n(trace.sums[0])}. Bottom total: 1 × ${n(network.weights[1][0])} + 2 × ${n(network.weights[1][1])} + ${n(network.biases[1])} = ${n(trace.sums[1])}. Each total passes through ReLU: keep positive totals; change negative totals to zero. A bias is the extra amount added before that gate.`,
    },
    {
      title: 'Mix the two results to make a guess.',
      text: `One final station combines the two mixtures. Its answer is ${n(trace.prediction)}. So far, we have only calculated: none of the weights have changed.`,
      action: 'Look at the guess. Next we will compare it with the practice answer.',
      calculation: `${n(trace.hidden[0])} × ${n(network.outputWeights[0])} + ${n(trace.hidden[1])} × ${n(network.outputWeights[1])} + ${n(network.outputBias)} = ${n(trace.prediction)}. The final station has its own two weights and a bias. This example uses no gate at the output.`,
    },
    {
      title: 'Compare the guess with the answer.',
      text: `The guess is ${n(trace.prediction)}; the answer is ${target}. We turn that miss into a score called loss. For this scoring rule, a smaller loss means a closer guess.`,
      action: 'Now ask: which setting could make this miss smaller?',
      calculation: `Error = guess − answer = ${n(trace.error)}. Loss = error² ÷ 2 = ${n(trace.loss)}. Squaring makes both overestimates and underestimates count as a positive miss. This is the height in the hiker lesson.`,
    },
    {
      title: 'Try changing just one dial.',
      text: 'A weight changes a mixture, the mixture changes the guess, and the guess changes the loss. Backpropagation calculates how strongly each dial affects that loss.',
      action: 'Preview a small increase. Watch the change travel through this one path.',
      calculation: `First-weight gradient = ${n(trace.error)} × ${n(network.outputWeights[0])} × ${trace.sums[0] > 0 ? '1' : '0'} × 1 = ${n(g)}. These factors are loss → guess, guess → top mixture, the ReLU gate’s local effect, and first input. The derivative describes a tiny local change; the +0.1 preview recomputes the actual finite change. Backpropagation gets derivatives by reusing these local effects, without testing every dial one at a time.`,
    },
    {
      title: 'Choose which way to turn the dial.',
      text: `The first weight’s gradient is ${n(g)}. ${g < 0 ? 'Its negative sign says a tiny increase would lower this loss.' : g > 0 ? 'Its positive sign says a tiny decrease would lower this loss.' : 'A zero gradient suggests no change to this weight.'} Now choose a direction.`,
      action: 'Make your prediction, then move all the weights once.',
      calculation: `New first weight = ${n(network.weights[0][0])} − ${rate} × (${n(g)}) = ${n(network.weights[0][0] - rate * g)}. We subtract learning rate × gradient. Each weight and bias gets its own gradient, calculated using the same old network. A finite step can still overshoot.`,
    },
    {
      title: 'This is the part where learning happens.',
      text: receipt
        ? `The program saved new weights and biases. The same inputs now give ${n(receipt.after.prediction)}. ${receipt.after.loss < receipt.before.loss ? 'That is closer to this example’s answer.' : 'This step did not improve the loss; a smaller learning rate may help.'}`
        : '',
      action:
        'The inputs stayed the same. The saved settings changed. That changes future guesses.',
      calculation: receipt
        ? `Loss: ${n(receipt.before.loss)} → ${n(receipt.after.loss)}. First weight: ${n(receipt.firstWeightBefore)} → ${n(receipt.network.weights[0][0])}, using learning rate ${receipt.learningRate} and practice answer ${receipt.practiceAnswer}. Every update used the same old snapshot. This is one practice example; performance on new examples still needs to be tested.`
        : '',
    },
  ];

  const closeUp = (
    <div className={`backprop-closeup backprop-closeup-${stage}`} key={stage}>
      {stage === 0 && (
        <>
          <p className="bp-focus-label">WHAT THE NETWORK RECEIVES</p>
          <div className="bp-value-pair">
            <div className="bp-big-value">
              <span>First input</span>
              <strong>1</strong>
            </div>
            <div className="bp-big-value">
              <span>Second input</span>
              <strong>2</strong>
            </div>
          </div>
          <p className="bp-answer-note">
            Practice answer: <strong>{target}</strong>. We keep this aside to check the guess later.
          </p>
        </>
      )}
      {stage === 1 && (
        <>
          <p className="bp-focus-label">ZOOM IN: THE TOP MIXING STATION</p>
          {[0, 1].map((i) => (
            <div className="bp-piece-row" key={i}>
              <span>
                <small>Input {i + 1}</small>
                <strong>{i + 1}</strong>
              </span>
              <span className="bp-operation">×</span>
              <span className="bp-dial">
                <small>Weight</small>
                <strong>{n(network.weights[0][i])}</strong>
              </span>
              <span className="bp-operation">=</span>
              <span>
                <small>This piece</small>
                <strong>{n((i + 1) * network.weights[0][i])}</strong>
              </span>
            </div>
          ))}
          <div className="bp-combined-value">
            <span>
              Add the pieces and bias {n(network.biases[0])}
              <small>Then keep positives; turn negatives into 0.</small>
            </span>
            <strong>{n(trace.hidden[0])}</strong>
          </div>
          <p className="bp-answer-note">
            The other station uses different weights and produces{' '}
            <strong>{n(trace.hidden[1])}</strong>. A station like this is also called a neuron.
          </p>
        </>
      )}
      {stage === 2 && (
        <>
          <p className="bp-focus-label">TWO MIXTURES BECOME ONE GUESS</p>
          <div className="bp-value-pair">
            {[0, 1].map((i) => (
              <div className="bp-big-value" key={i}>
                <span>{i === 0 ? 'Top' : 'Bottom'} mixture</span>
                <strong>{n(trace.hidden[i])}</strong>
                <small>
                  × weight {n(network.outputWeights[i])} ={' '}
                  {n(trace.hidden[i] * network.outputWeights[i])}
                </small>
              </div>
            ))}
          </div>
          <div className="bp-combined-value">
            <span>
              Add these two pieces<small>Plus the final bias: {n(network.outputBias)}</small>
            </span>
            <strong>{n(trace.prediction)}</strong>
          </div>
          <p className="bp-answer-note">
            This is a forward pass: turn the inputs into an answer using the current settings.
          </p>
        </>
      )}
      {stage === 3 && (
        <>
          <p className="bp-focus-label">HOW CLOSE WAS THE GUESS?</p>
          <div className="bp-value-pair">
            <div className="bp-big-value">
              <span>Network’s guess</span>
              <strong>{n(trace.prediction)}</strong>
            </div>
            <div className="bp-big-value bp-target-value">
              <span>Practice answer</span>
              <strong>{target}</strong>
            </div>
          </div>
          <div className="bp-miss">
            <span>Distance from the answer</span>
            <strong>{n(Math.abs(trace.error))}</strong>
          </div>
          <p className="bp-answer-note">
            Loss is the score we choose for this miss. Here it is <strong>{n(trace.loss)}</strong>.
            Zero means an exact match on this example.
          </p>
        </>
      )}
      {stage === 4 && (
        <>
          <p className="bp-focus-label">ONE DIAL. ONE CHAIN OF EFFECTS.</p>
          <button
            className="button bp-nudge-button"
            aria-pressed={showNudge}
            onClick={() => {
              setPlaying(false);
              setShowNudge(!showNudge);
            }}
          >
            {showNudge ? 'Undo the preview' : 'Preview +0.1 on one weight'}
          </button>
          <ol className="bp-nudge-path">
            {[
              {
                label: 'First weight',
                before: network.weights[0][0],
                after: network.weights[0][0] + 0.1,
                note: 'Scales the first input',
              },
              {
                label: 'Top mixture',
                before: trace.hidden[0],
                after: nudged.hidden[0],
                note: 'Feeds the final station',
              },
              {
                label: 'Guess',
                before: trace.prediction,
                after: nudged.prediction,
                note: 'Gets compared with the answer',
              },
              { label: 'Loss', before: trace.loss, after: nudged.loss, note: 'Scores the miss' },
            ].map((item, i) => (
              <li key={item.label} className={showNudge ? 'is-previewing' : ''}>
                <span className="bp-path-step">{i + 1}</span>
                <span className="bp-path-label">{item.label}</span>
                <div className="bp-path-values">
                  <strong>{n(item.before)}</strong>
                  {showNudge && (
                    <>
                      <ArrowRight size={16} aria-hidden="true" />
                      <strong>{n(item.after)}</strong>
                    </>
                  )}
                </div>
                <small>{item.note}</small>
              </li>
            ))}
          </ol>
          <p className="bp-preview-feedback" role="status" data-testid="bp-nudge-feedback">
            {showNudge
              ? `The preview loss ${nudged.loss < trace.loss ? 'fell' : nudged.loss > trace.loss ? 'rose' : 'stayed the same'}: ${n(trace.loss)} → ${n(nudged.loss)}. The saved first weight is still ${n(network.weights[0][0])}; this was a test of one dial.`
              : 'Only the first weight will be tested. All other weights, biases, and inputs stay fixed.'}
          </p>
        </>
      )}
      {stage === 5 && (
        <>
          <p className="bp-focus-label">A GRADIENT TELLS US A LOCAL DIRECTION</p>
          <div className="bp-value-pair">
            <div className="bp-big-value">
              <span>First weight now</span>
              <strong>{n(network.weights[0][0])}</strong>
            </div>
            <div className="bp-big-value bp-gradient-value">
              <span>Its loss gradient</span>
              <strong>{n(g)}</strong>
            </div>
          </div>
          <p className="bp-answer-note">
            A gradient measures how quickly the loss changes when this weight changes a tiny amount.
            Every weight gets its own gradient.
          </p>
        </>
      )}
      {stage === 6 && receipt && (
        <>
          <p className="bp-focus-label">SAME INPUTS. NEW SETTINGS.</p>
          <div className="bp-value-pair">
            <div className="bp-big-value">
              <span>Previous guess</span>
              <strong>{n(receipt.before.prediction)}</strong>
            </div>
            <div className="bp-big-value bp-target-value">
              <span>Guess after the update</span>
              <strong>{n(receipt.after.prediction)}</strong>
            </div>
          </div>
          <p className="bp-answer-note">
            The practice answer is still <strong>{receipt.practiceAnswer}</strong>. One successful
            update does not establish success on new examples.
          </p>
        </>
      )}
    </div>
  );

  if (lab)
    return (
      <>
        <div className="lesson-mode-context">
          <button className="button" onClick={() => setLab(false)}>
            <ArrowLeft size={16} />
            Back to the guided story
          </button>
          <span>Free lab · explore after the tutorial</span>
        </div>
        <NetworkLab />
      </>
    );

  return (
    <div className="backprop-journey">
      <header className="lesson-heading">
        <p className="eyebrow">
          EXPERIMENT 04 <span> / </span> FOLLOW ONE MISTAKE
        </p>
        <h1>
          A network is a <em>chain of effects.</em>
        </h1>
        <p>One example. Two little mixing stations. We will watch every move before adding more.</p>
      </header>
      <ModeSwitcher
        value={mode}
        onChange={(value) => {
          setMode(value);
          setPlaying(false);
          setShowNudge(false);
        }}
      />
      {mode === 'visual' && (
        <section className="guide-card">
          <div className="backprop-scene-heading">
            <span className="guide-kicker">
              STOP {stage + 1} OF 7 · {stageNames[stage].toUpperCase()}
            </span>
            <span className="pill">{round} WEIGHT UPDATES</span>
          </div>
          <div className="backprop-workbench">
            <div className="backprop-instructions">
              <div className="guide-narration backprop-narration" aria-live="polite">
                <span className="guide-number">{stage + 1}</span>
                <div>
                  <h2>{scenes[stage].title}</h2>
                  <p>{scenes[stage].text}</p>
                </div>
              </div>
              <p className="backprop-action">
                <ArrowRight size={17} aria-hidden="true" />
                {scenes[stage].action}
              </p>
              {stage === 5 && (
                <div className="guide-prompt">
                  <p>
                    Before pressing the button: should the highlighted weight increase or decrease?
                  </p>
                  <div>
                    <button
                      className="button"
                      aria-pressed={choice === 'up'}
                      onClick={() => setChoice('up')}
                    >
                      Increase ↑
                    </button>
                    <button
                      className="button"
                      aria-pressed={choice === 'down'}
                      onClick={() => setChoice('down')}
                    >
                      Decrease ↓
                    </button>
                  </div>
                  <p className="guide-feedback" role="status">
                    {choice
                      ? g === 0
                        ? 'Its gradient is zero. Neither direction is suggested by this local derivative.'
                        : (choice === 'up') === g < 0
                          ? 'Yes. Subtracting the signed gradient moves this weight in that direction.'
                          : 'Try the subtraction: new weight = old weight − step size × gradient.'
                      : 'A gradient is the slope of the loss with respect to this particular weight.'}
                  </p>
                </div>
              )}
              {stage === 6 && receipt && (
                <div className="backprop-receipt">
                  <div>
                    <span>First weight</span>
                    <strong>
                      {n(receipt.firstWeightBefore)} → {n(receipt.network.weights[0][0])}
                    </strong>
                  </div>
                  <div>
                    <span>Loss on this example</span>
                    <strong>
                      {n(receipt.before.loss)} → {n(receipt.after.loss)}
                    </strong>
                  </div>
                </div>
              )}
              <div className="guide-controls">
                <button className="button" onClick={reset}>
                  <RotateCcw size={15} />
                  Restart story
                </button>
                <div className="guide-dots" role="group" aria-label={`Stop ${stage + 1} of 7`}>
                  {stageNames.map((_, i) => (
                    <span key={i} className={i === stage ? 'current' : i < stage ? 'past' : ''} />
                  ))}
                </div>
                <button
                  className="button"
                  disabled={stage >= 5}
                  onClick={() => setPlaying(!playing)}
                >
                  {playing && stage < 5 ? <Pause size={15} /> : <Play size={15} />}
                  {playing && stage < 5 ? 'Pause story' : 'Play story'}
                </button>
                <button className="button primary" onClick={next}>
                  {stage < 5
                    ? 'Next: ' + stageNames[stage + 1]
                    : stage === 5
                      ? 'Move the weights'
                      : 'Follow another update'}
                  <ArrowRight size={15} />
                </button>
              </div>
              <p className="backprop-auto-note">
                The story pauses before changing a weight. You decide when to take the step.
              </p>
            </div>
            {closeUp}
          </div>
          <details className="backprop-detail" key={`calculation-${stage}`}>
            <summary>Show this step’s calculation</summary>
            <p>{scenes[stage].calculation}</p>
          </details>
          <details className="backprop-detail backprop-map" key={`map-${stage}`}>
            <summary>See how the whole network connects</summary>
            <p>
              The large cards above show the current step. This map puts that step back into the
              whole network.
            </p>
            <div className="backprop-scene">
              <svg viewBox="0 0 740 330" role="img" aria-labelledby="route-title route-desc">
                <title id="route-title">One example moves through a two-neuron network</title>
                <desc id="route-desc">
                  {scenes[stage].text} Purple paths carry values forward. Orange paths carry
                  gradients backward.
                </desc>
                <defs>
                  <marker
                    id="backprop-arrow"
                    markerWidth="7"
                    markerHeight="7"
                    refX="6"
                    refY="3.5"
                    orient="auto"
                  >
                    <path d="M0 0L7 3.5L0 7Z" fill="#9c87b5" />
                  </marker>
                </defs>
                <text x="64" y="30" className="bp-column" textAnchor="middle">
                  INPUTS
                </text>
                <text x="300" y="30" className="bp-column" textAnchor="middle">
                  HIDDEN: MIX + GATE
                </text>
                <text x="554" y="30" className="bp-column" textAnchor="middle">
                  GUESS
                </text>
                <text x="689" y="30" className="bp-column" textAnchor="middle">
                  MISTAKE
                </text>
                {[
                  [0, 0],
                  [0, 1],
                  [1, 0],
                  [1, 1],
                ].map(([i, j]) => {
                  const path = `M96 ${i === 0 ? 110 : 243} C165 ${i === 0 ? 110 : 243}, 204 ${j === 0 ? 110 : 243}, 254 ${j === 0 ? 110 : 243}`;
                  return (
                    <g key={`${i}-${j}`}>
                      <path
                        d={path}
                        fill="none"
                        stroke={stage === 4 && i === 0 && j === 0 ? '#c5834a' : '#c7bed5'}
                        strokeWidth={i === 0 && j === 0 ? 3 : 1.5}
                        markerEnd="url(#backprop-arrow)"
                      />
                      {stage === 1 && !reducedMotion && (
                        <circle r="5" fill="#80629f">
                          <animateMotion dur="1.6s" path={path} repeatCount="2" fill="freeze" />
                        </circle>
                      )}
                      {stage === 4 && i === 0 && j === 0 && !reducedMotion && (
                        <circle r="5" fill="#b9773a">
                          <animateMotion
                            dur="1.8s"
                            path="M254 110 C204 110,165 110,96 110"
                            repeatCount="2"
                            fill="freeze"
                          />
                        </circle>
                      )}
                    </g>
                  );
                })}
                {[0, 1].map((j) => {
                  const path = `M346 ${j === 0 ? 110 : 243} C427 ${j === 0 ? 110 : 243},452 174,518 174`;
                  return (
                    <g key={j}>
                      <path
                        d={path}
                        fill="none"
                        stroke={stage === 4 && j === 0 ? '#c5834a' : '#b5c8b3'}
                        strokeWidth="2"
                        markerEnd="url(#backprop-arrow)"
                      />
                      {stage === 2 && !reducedMotion && (
                        <circle r="5" fill="#608958">
                          <animateMotion dur="1.6s" path={path} repeatCount="2" fill="freeze" />
                        </circle>
                      )}
                      {stage === 4 && j === 0 && !reducedMotion && (
                        <circle r="5" fill="#b9773a">
                          <animateMotion
                            dur="1.8s"
                            path="M518 174 C452 174,427 110,346 110"
                            repeatCount="2"
                            fill="freeze"
                          />
                        </circle>
                      )}
                    </g>
                  );
                })}
                <path
                  d="M590 174H650"
                  stroke="#b5c8b3"
                  strokeWidth="2"
                  markerEnd="url(#backprop-arrow)"
                />
                {[1, 2].map((x, i) => (
                  <g key={x}>
                    <circle
                      cx="64"
                      cy={i === 0 ? 110 : 243}
                      r="31"
                      fill="#eef1e6"
                      stroke="#c7d3bf"
                    />
                    <text x="64" y={i === 0 ? 117 : 250} textAnchor="middle" className="bp-value">
                      {x}
                    </text>
                  </g>
                ))}
                {[0, 1].map((j) => (
                  <g key={j}>
                    <rect
                      x="254"
                      y={(j === 0 ? 110 : 243) - 33}
                      width="92"
                      height="66"
                      rx="18"
                      fill={stage === 4 && j === 0 ? '#fae9d8' : '#eee6f6'}
                      stroke={stage === 4 && j === 0 ? '#c5834a' : '#b29bc8'}
                      strokeWidth={stage === 1 || stage === 4 ? 2 : 1}
                    />
                    <text
                      x="300"
                      y={(j === 0 ? 110 : 243) + 5}
                      textAnchor="middle"
                      className="bp-value"
                    >
                      {stage >= 1 ? n(trace.hidden[j]) : '?'}
                    </text>
                    <text
                      x="300"
                      y={(j === 0 ? 110 : 243) + 50}
                      textAnchor="middle"
                      className="bp-label"
                    >
                      mixing station {j + 1}
                    </text>
                  </g>
                ))}
                <circle
                  cx="554"
                  cy="174"
                  r="36"
                  fill="#e3eddd"
                  stroke="#7b9a69"
                  opacity={stage >= 2 ? 1 : 0.35}
                />
                <text x="554" y="180" className="bp-value" textAnchor="middle">
                  {stage >= 2 ? n(trace.prediction) : '?'}
                </text>
                <text x="554" y="230" className="bp-label" textAnchor="middle">
                  target: {target}
                </text>
                <rect
                  x="650"
                  y="149"
                  width="78"
                  height="50"
                  rx="12"
                  fill="#f4eadf"
                  stroke="#c5a581"
                  opacity={stage >= 3 ? 1 : 0.35}
                />
                <text x="689" y="178" className="bp-small-value" textAnchor="middle">
                  {stage >= 3 ? n(trace.loss) : '?'}
                </text>
                <text x="689" y="219" className="bp-label" textAnchor="middle">
                  loss
                </text>
                <rect x="125" y="70" width="100" height="27" rx="7" fill="#f2edf8" />
                <text x="175" y="89" className="bp-weight" textAnchor="middle">
                  w = {n(network.weights[0][0])}
                </text>
                {stage >= 4 && stage < 6 && (
                  <>
                    <rect x="125" y="138" width="114" height="31" rx="7" fill="#f8e8d7" />
                    <text x="182" y="158" className="bp-weight" textAnchor="middle">
                      gradient {n(g)}
                    </text>
                    <text x="370" y="325" textAnchor="middle" className="bp-label">
                      ← Backward means calculating sensitivity. Inputs are not flowing backward.
                    </text>
                  </>
                )}
              </svg>
            </div>
          </details>
        </section>
      )}

      {mode === 'math' && (
        <div className="math-story">
          <section className="panel">
            <h2>The chain rule connects the cause to the mistake.</h2>
            <p>
              Use inputs x₁ = 1 and x₂ = 2. Each hidden station computes zⱼ = wⱼ₁x₁ + wⱼ₂x₂ + bⱼ,
              then hⱼ = max(0, zⱼ). The output is ŷ = v₁h₁ + v₂h₂ + c. The correct answer is t ={' '}
              {target}.
            </p>
            <div className="formula">
              <code>L = ½(ŷ − t)²</code>
              <code>∂L/∂ŷ = ŷ − t = {n(trace.error)}</code>
              <code>∂ŷ/∂h₁ = v₁ = {n(network.outputWeights[0])}</code>
              <code>
                ∂h₁/∂z₁ = {trace.sums[0] > 0 ? 1 : 0} (ReLU gate at z₁ = {n(trace.sums[0])})
              </code>
              <code>∂z₁/∂w₁₁ = x₁ = 1</code>
            </div>
            <p>
              Changing w₁₁ by a tiny amount affects the loss along this path. Multiply its four
              local sensitivities:
            </p>
            <div className="formula">
              <code>∂L/∂w₁₁ = (ŷ − t) × v₁ × ReLU′(z₁) × x₁ = {n(g)}</code>
              <code>
                new w₁₁ = {n(network.weights[0][0])} − {rate} × ({n(g)}) ={' '}
                {n(network.weights[0][0] - rate * g)}
              </code>
            </div>
            <p>
              With several paths, add their contributions. With a batch, average across examples.
              Backpropagation efficiently reuses these intermediate derivatives. Gradient descent is
              the separate rule that uses them to move weights.
            </p>
          </section>
          <section className="panel">
            <h2>Why a nonlinear gate? Why a bias?</h2>
            <p>
              A bias shifts the starting level even when inputs are zero. ReLU creates a bend: a
              negative sum becomes zero. Without nonlinear functions, stacking affine mixing
              stations still collapses to a single affine map. An inactive ReLU has zero derivative
              here and blocks this path’s weight update.
            </p>
            <div className="choice-buttons">
              <button
                className="button"
                onClick={() => {
                  const next = initialNetwork();
                  next.biases[0] = -10;
                  setNetwork(next);
                  setReceipt(null);
                  setStage(0);
                  setRound(0);
                }}
              >
                Turn off the top ReLU
              </button>
              <button className="button" onClick={reset}>
                Restore both stations
              </button>
            </div>
            <p aria-live="polite">
              Top activation: {n(trace.hidden[0])}. First-weight gradient: {n(g)}.
            </p>
            <label className="control-group" htmlFor="bp-rate">
              Step size η: {rate.toFixed(2)}
              <input
                id="bp-rate"
                type="range"
                min="0.01"
                max="1.5"
                step="0.01"
                value={rate}
                onChange={(e) => {
                  setRate(+e.target.value);
                  setReceipt(null);
                  setStage(0);
                }}
              />
            </label>
            <label htmlFor="bp-target">
              Training answer{' '}
              <select
                id="bp-target"
                value={target}
                onChange={(e) => {
                  setTarget(+e.target.value);
                  reset();
                }}
              >
                <option value="2">2 — above the starting guess</option>
                <option value="0">0 — below the starting guess</option>
              </select>
            </label>
            <p>
              Change the answer or step size, then return to Play & see. A step that is too large
              can increase the loss. At exactly zero, ReLU has no unique derivative; this
              implementation chooses zero.
            </p>
          </section>
        </div>
      )}
      {mode === 'code' && (
        <>
          <div className="choice-buttons">
            <button className="button" aria-pressed={!fullCode} onClick={() => setFullCode(false)}>
              One step, every detail
            </button>
            <button className="button" aria-pressed={fullCode} onClick={() => setFullCode(true)}>
              A complete XOR learner
            </button>
          </div>
          <CodeWalkthrough
            title={
              fullCode
                ? 'Train a complete XOR network with handwritten backpropagation'
                : 'The exact code driving this animation'
            }
            code={fullCode ? xorCode : exampleCode}
            steps={
              fullCode
                ? [
                    {
                      label: 'Start with examples and independent weights',
                      explanation:
                        'XOR asks whether exactly one bit is on. This separate 2–4–1 network uses tanh and sigmoid, not the two-ReLU demo. All four binary cases are training examples; this demonstrates fitting, not generalization.',
                      lines: xorCode
                        .split('\n')
                        .flatMap((line, i) =>
                          line.includes('export const XOR_DATA') ||
                          line.includes('export function createNetwork') ||
                          line.includes('w1:')
                            ? [i + 1]
                            : [],
                        ),
                    },
                    {
                      label: 'A forward pass is only arithmetic',
                      explanation:
                        'Make hidden weighted sums, bend them with tanh, mix them, and use sigmoid to produce a value between zero and one.',
                      lines: xorCode
                        .split('\n')
                        .flatMap((line, i) =>
                          line.includes('const hidden') ||
                          line.includes('Math.tanh') ||
                          line.includes('const logit') ||
                          line.includes('probability:')
                            ? [i + 1]
                            : [],
                        ),
                    },
                    {
                      label: 'Write backpropagation yourself',
                      explanation:
                        'For sigmoid plus binary cross-entropy, the output derivative is p − target. Multiply by output weights, tanh derivatives, and inputs; average across examples.',
                      lines: xorCode
                        .split('\n')
                        .flatMap((line, i) =>
                          line.includes('outputGradient') || line.includes('hiddenGradient')
                            ? [i + 1]
                            : [],
                        ),
                    },
                    {
                      label: 'Repeat and check real predictions',
                      explanation:
                        'Run node examples/neural-network.mjs. It executes 8,000 updates, prints before/after loss, and lists predictions for all four cases. node:url is a standard-library CLI guard, not an ML library.',
                      lines: xorCode
                        .split('\n')
                        .flatMap((line, i) =>
                          line.includes('export function train(') ||
                          line.includes('for (let step') ||
                          line.includes('console.log')
                            ? [i + 1]
                            : [],
                        ),
                    },
                  ]
                : [
                    {
                      label: 'Store the adjustable numbers',
                      explanation:
                        'The two rows are input weights. There are also hidden biases, two output weights, and an output bias. This exact file drives Play & see.',
                      lines: exampleCode
                        .split('\n')
                        .flatMap((line, i) =>
                          line.includes('initialNetwork') || line.includes('weights:')
                            ? [i + 1]
                            : [],
                        ),
                    },
                    {
                      label: 'Predict, then measure the miss',
                      explanation:
                        'Multiply and add, pass through ReLU, mix the results, and calculate half the squared error.',
                      lines: exampleCode
                        .split('\n')
                        .flatMap((line, i) =>
                          line.includes('const sums') ||
                          line.includes('const hidden') ||
                          line.includes('const prediction') ||
                          line.includes('const error') ||
                          line.includes('const loss')
                            ? [i + 1]
                            : [],
                        ),
                    },
                    {
                      label: 'Multiply local sensitivities',
                      explanation:
                        'The chain rule links the output error to each earlier weight. A closed ReLU gate contributes zero along that path.',
                      lines: exampleCode
                        .split('\n')
                        .flatMap((line, i) =>
                          line.includes('outputGradients') ||
                          line.includes('hiddenErrors') ||
                          line.includes('weightGradients') ||
                          line.includes('error * network') ||
                          line.includes('localError * input')
                            ? [i + 1]
                            : [],
                        ),
                    },
                    {
                      label: 'Update from one old snapshot',
                      explanation:
                        'All gradients use the same old weights. Only then do we subtract rate × gradient from each parameter. Run node examples/backprop-step.mjs to verify the first weight becomes 0.5375.',
                      lines: exampleCode
                        .split('\n')
                        .flatMap((line, i) =>
                          line.includes('const before') ||
                          line.includes('const next') ||
                          line.includes('rate *') ||
                          line.includes('console.log')
                            ? [i + 1]
                            : [],
                        ),
                    },
                  ]
            }
          />
        </>
      )}
      <div className="guide-next-question">
        <h3>What changes when there are millions of weights?</h3>
        <p>
          The same chain rule applies across a much bigger computation. More paths can form richer
          features. Knowing every arithmetic instruction still does not automatically tell us which
          human concepts the resulting computation represents.
        </p>
      </div>
      <div className="backprop-lab-invitation">
        <div>
          <h3>Ready to let it practice on lots of examples?</h3>
          <p>
            Open the free lab to train on patterns, compare unseen examples, and disconnect a
            neuron.
          </p>
        </div>
        <button
          className="button"
          onClick={() => {
            setPlaying(false);
            setLab(true);
          }}
        >
          <FlaskConical size={17} />
          Open the free network lab
        </button>
      </div>
    </div>
  );
}
