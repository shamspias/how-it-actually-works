import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bell, BellOff, Lightbulb, Pause, Play, RotateCcw } from 'lucide-react';
import {
  CodeWalkthrough,
  ModeSwitcher,
  useReducedMotion,
  type LearningMode,
} from './LearningModes';
import {
  CARDS,
  buildFeatureStory,
  featureVotes,
  learn,
  meanLoss,
  mostConsequentialUnit,
  mute,
  predict,
  type FeatureModel,
} from '../lib/features';
import source from '../../examples/learned-features.mjs?raw';
import './features.css';

const titles = [
  'Make the bell ring.',
  'Meet four little mixers.',
  'Who tells a mixer what to notice?',
  'Practice changes the messages inside.',
  'Does a learned mixer really matter?',
  'Keep the recipe. Use it again.',
];
const notes = [
  'These four cards are our answer key. Exactly one light on → ring. Both on or both off → quiet. Each light becomes a number: 0 means off, 1 means on. First learn our rule yourself.',
  'Inside the doorbell program are four mixers: tiny multiply-add-and-bend calculations, like the last lesson’s stations. Each has its own weights and bias. Select one to see the number it produces from the two lights.',
  'We label only the final answer: ring or quiet. There are no correct-answer labels for the four mixers in the middle.',
  'Keep the same light card selected. Practice changes the weights, so the same lights produce different numbers inside the program. We call these internal responses features. “Hidden” means between the input and answer; you can inspect them here.',
  'Let’s change one thing: disconnect one mixer from the final answer. Keep every other weight fixed. Then measure what changes.',
  'The saved weights and biases are the learned recipe. Weights multiply inputs; biases add an extra amount. Using these saved settings makes a guess. A new prediction alone does not change them.',
];
const signed = (value: number) => `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(3)}`;
const probability = (value: number) => `${(value * 100).toFixed(1)}%`;
const codeLines = (...fragments: string[]) =>
  source
    .split('\n')
    .flatMap((line, i) => (fragments.some((fragment) => line.includes(fragment)) ? [i + 1] : []));

export default function FeatureJourney() {
  const [mode, setMode] = useState<LearningMode>('visual');
  const [stage, setStage] = useState(0);
  const [cardIndex, setCardIndex] = useState(2);
  const [unit, setUnit] = useState(0);
  const [checkpoint, setCheckpoint] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ruleGuess, setRuleGuess] = useState<string | null>(null);
  const [creditGuess, setCreditGuess] = useState<string | null>(null);
  const [interventionGuess, setInterventionGuess] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [savedGuess, setSavedGuess] = useState<string | null>(null);
  const [uses, setUses] = useState(0);
  const reducedMotion = useReducedMotion();
  const frames = useMemo(buildFeatureStory, []);
  const start = frames[0].model;
  const trained = frames[frames.length - 1].model;
  const frame = frames[checkpoint];
  const current = stage < 3 ? start : stage === 3 ? frame.model : trained;
  const visible = stage === 4 && muted ? mute(trained, unit) : current;
  const response = predict(visible, CARDS[cardIndex]);
  const correct = CARDS.filter(
    (card) => Number(predict(visible, card).p >= 0.5) === card.label,
  ).length;
  const votes = featureVotes(frame.model, unit, 0);
  const gradient = votes.reduce((sum, vote) => sum + vote.gradient, 0) / CARDS.length;
  const nextModel = learn(frame.model).model;
  const firstResponse = predict(frame.model, CARDS[cardIndex]).hidden[unit];
  const nextResponse = predict(nextModel, CARDS[cardIndex]).hidden[unit];

  useEffect(() => {
    if (!playing || stage !== 3 || mode !== 'visual') return;
    const timer = window.setInterval(() => {
      setCheckpoint((previous) => Math.min(previous + 1, frames.length - 1));
    }, 1300);
    return () => window.clearInterval(timer);
  }, [playing, stage, mode, frames.length]);
  useEffect(() => {
    if (checkpoint === frames.length - 1) setPlaying(false);
  }, [checkpoint, frames.length]);

  function reset() {
    setStage(0);
    setCheckpoint(0);
    setPlaying(false);
    setUnit(0);
    setCardIndex(2);
    setRuleGuess(null);
    setCreditGuess(null);
    setInterventionGuess(null);
    setMuted(false);
    setSavedGuess(null);
    setUses(0);
  }
  function nextStage() {
    setPlaying(false);
    if (stage === 3) setUnit(mostConsequentialUnit(trained));
    setStage(Math.min(5, stage + 1));
  }
  const ready =
    stage === 0
      ? ruleGuess === 'quiet'
      : stage === 2
        ? creditGuess === 'errors'
        : stage === 3
          ? checkpoint === frames.length - 1
          : stage === 4
            ? muted
            : true;

  return (
    <div className={`lesson feature-journey ${reducedMotion ? 'feature-reduced-motion' : ''}`}>
      <header className="lesson-heading">
        <div className="eyebrow">THE MISSING MIDDLE · LEARNED FEATURES</div>
        <h1>How does a network learn what to notice?</h1>
        <p>
          You’re building a toy doorbell with two lights. It should ring when exactly one light is
          on. Can practice teach the little calculation stations inside it useful patterns, when we
          only supply the final ring-or-quiet answers?
        </p>
      </header>
      <ModeSwitcher
        value={mode}
        onChange={(value) => {
          setMode(value);
          setPlaying(false);
        }}
      />
      {mode === 'visual' && (
        <section className="guide-card feature-story" aria-label="Learned features story">
          <span className="guide-kicker">SMALL DISCOVERY {stage + 1} OF 6</span>
          <h2>{titles[stage]}</h2>
          <p>{notes[stage]}</p>
          {stage === 0 ? (
            <>
              <div className="feature-rule-cards">
                {CARDS.map((card, index) => (
                  <div className="feature-rule-card" key={index}>
                    <LightPair x={card.x} y={card.y} />
                    <span>
                      {card.x}, {card.y}
                    </span>
                    <div className="feature-label">
                      {card.label ? <Bell size={20} /> : <BellOff size={20} />}{' '}
                      {card.label ? 'Ring' : 'Quiet'}
                    </div>
                  </div>
                ))}
              </div>
              <div className="feature-question">
                <h3>Your turn: both lights are on. What should happen?</h3>
                <div className="choice-buttons">
                  <button
                    className="button"
                    aria-pressed={ruleGuess === 'ring'}
                    onClick={() => setRuleGuess('ring')}
                  >
                    Ring the bell
                  </button>
                  <button
                    className="button"
                    aria-pressed={ruleGuess === 'quiet'}
                    onClick={() => setRuleGuess('quiet')}
                  >
                    Keep it quiet
                  </button>
                </div>
                {ruleGuess && (
                  <p role="status">
                    {ruleGuess === 'quiet'
                      ? 'Yes. You know the rule. The network will get only these four example answers.'
                      : 'Count the on lights: two. Our rule rings only for exactly one. Try again.'}
                  </p>
                )}
              </div>
            </>
          ) : stage === 2 ? (
            <>
              <div className="feature-credit-loop" aria-label="The learning loop">
                <span>Two light numbers</span>
                <ArrowRight aria-hidden="true" size={18} />
                <span>Four mixers</span>
                <ArrowRight aria-hidden="true" size={18} />
                <span>A bell guess</span>
                <div className="feature-credit-return">
                  Wrong answer? Work backward: which small weight changes would reduce the mistake?
                </div>
              </div>
              <div className="feature-question">
                <h3>How can a mixer change without its own answer label?</h3>
                <div className="choice-buttons">
                  <button
                    className="button"
                    aria-pressed={creditGuess === 'labels'}
                    onClick={() => setCreditGuess('labels')}
                  >
                    Give each mixer a secret label
                  </button>
                  <button
                    className="button"
                    aria-pressed={creditGuess === 'errors'}
                    onClick={() => setCreditGuess('errors')}
                  >
                    Trace the final error backward
                  </button>
                </div>
                {creditGuess && (
                  <p role="status">
                    {creditGuess === 'errors'
                      ? 'Exactly. Backpropagation traces how each weight affected the error. The optimizer nudges those weights. Repeating across examples can build useful internal messages.'
                      : 'There are no mixer labels in this experiment. We can instead calculate how each weight affected the final error. Try the other answer.'}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              {stage === 4 && !interventionGuess ? (
                <div className="feature-question">
                  <h3>Before we disconnect it: what could happen?</h3>
                  <div className="choice-buttons">
                    <button className="button" onClick={() => setInterventionGuess('change')}>
                      Some answers could change
                    </button>
                    <button className="button" onClick={() => setInterventionGuess('same')}>
                      The mixers cannot affect answers
                    </button>
                  </div>
                </div>
              ) : null}
              <CardPicker
                selected={cardIndex}
                onChange={setCardIndex}
                model={visible}
                showAnswers={stage >= 3}
              />
              {stage !== 5 ? (
                <div className="feature-workbench">
                  <div className="feature-machine-input">
                    <span>THIS CARD</span>
                    <LightPair x={CARDS[cardIndex].x} y={CARDS[cardIndex].y} />
                    <strong>
                      {CARDS[cardIndex].x}, {CARDS[cardIndex].y}
                    </strong>
                  </div>
                  <ArrowRight className="feature-machine-arrow" size={22} aria-hidden="true" />
                  <div className="feature-mixers" role="group" aria-label="Select a hidden mixer">
                    {response.hidden.map((value: number, index: number) => (
                      <button
                        key={index}
                        className={`feature-mixer ${stage === 4 && muted && unit === index ? 'is-muted' : ''}`}
                        aria-pressed={unit === index}
                        onClick={() => {
                          setUnit(index);
                          setMuted(false);
                        }}
                        aria-label={`Inspect mixer ${index + 1}`}
                      >
                        <span>
                          MIXER {index + 1}
                          {stage === 4 && muted && unit === index ? ' · DISCONNECTED' : ''}
                        </span>
                        <ResponseBar
                          value={value}
                          previous={
                            stage >= 3 ? predict(start, CARDS[cardIndex]).hidden[index] : undefined
                          }
                        />
                        <strong>{signed(value)}</strong>
                      </button>
                    ))}
                  </div>
                  <ArrowRight className="feature-machine-arrow" size={22} aria-hidden="true" />
                  <div className="feature-machine-output">
                    <span>MODEL’S RING SCORE</span>
                    <strong data-testid="feature-probability">{probability(response.p)}</strong>
                    <span>{response.p >= 0.5 ? 'Ring' : 'Quiet'} at a 50% cutoff</span>
                  </div>
                </div>
              ) : (
                <div className="feature-use-machine">
                  <LightPair x={CARDS[cardIndex].x} y={CARDS[cardIndex].y} />
                  <ArrowRight aria-hidden="true" />
                  <span className="feature-saved-recipe">
                    Saved settings
                    <br />
                    <strong>17 numbers</strong>
                  </span>
                  <ArrowRight aria-hidden="true" />
                  <strong>{response.p >= 0.5 ? 'Ring' : 'Quiet'}</strong>
                </div>
              )}
              {stage === 1 && (
                <div className="feature-small-note">
                  Response means a number between −1 and +1. The middle mark is zero. Different
                  starting weights give the mixers different responses; none has a name like “both
                  lights.” The ring score is the model’s probability estimate for Ring, not a
                  measured chance of being correct.
                </div>
              )}
              {stage === 3 && (
                <>
                  <div className="feature-training-controls">
                    <button
                      className="button primary"
                      disabled={checkpoint === frames.length - 1 || playing}
                      onClick={() => setCheckpoint(checkpoint + 1)}
                    >
                      Show next practice checkpoint <ArrowRight size={16} />
                    </button>
                    <button
                      className="button"
                      disabled={checkpoint === frames.length - 1}
                      onClick={() => setPlaying(!playing)}
                    >
                      {playing ? <Pause size={16} /> : <Play size={16} />}
                      {playing ? 'Pause practice' : 'Play practice'}
                    </button>
                    <button
                      className="button"
                      onClick={() => {
                        setPlaying(false);
                        setCheckpoint(0);
                      }}
                    >
                      Rewind practice
                    </button>
                  </div>
                  <div className="feature-training-receipt" aria-live="polite">
                    <span>
                      Updates{' '}
                      <strong data-testid="feature-updates">{frame.step.toLocaleString()}</strong>
                    </span>
                    <span>
                      Average mistake <strong>{frame.loss.toFixed(4)}</strong>
                    </span>
                    <span>
                      Cards correct <strong data-testid="feature-correct">{correct} / 4</strong>
                    </span>
                  </div>
                  <div className="feature-small-note">
                    Pale marker: before practice. Solid marker: now. These are computed checkpoints,
                    spaced farther apart later. Each update uses all four cards; mistakes need not
                    fall at every step for every model.
                  </div>
                </>
              )}
              {stage === 4 && (
                <>
                  <div className="feature-training-controls">
                    <button
                      className="button primary"
                      disabled={!interventionGuess}
                      onClick={() => setMuted(!muted)}
                    >
                      {muted ? 'Reconnect' : 'Disconnect'} mixer {unit + 1}
                    </button>
                  </div>
                  <div className="feature-training-receipt" aria-live="polite">
                    <span>
                      All mixers: average mistake<strong>{meanLoss(trained).toFixed(4)}</strong>
                    </span>
                    <span>
                      {muted ? 'With this mixer disconnected' : 'Current average mistake'}
                      <strong data-testid="feature-ablation-loss">
                        {meanLoss(visible).toFixed(4)}
                      </strong>
                    </span>
                  </div>
                  {muted && (
                    <div className="feature-small-note">
                      Its response still exists, but the output cannot use it. The changed error is
                      evidence that its contribution mattered here. It does not give the mixer a
                      universal meaning.
                    </div>
                  )}
                </>
              )}
              {stage === 5 && (
                <div className="feature-question">
                  <p>
                    What are the 17 saved numbers? The four mixers each have 2 weights and 1 bias:
                    12 numbers. The final station has 4 weights and 1 bias: 5 more. Altogether, that
                    is 12 weights + 5 biases.
                  </p>
                  <h3>What did practice leave behind?</h3>
                  <div className="choice-buttons">
                    <button
                      className="button"
                      aria-pressed={savedGuess === 'weights'}
                      onClick={() => setSavedGuess('weights')}
                    >
                      Changed weights and biases
                    </button>
                    <button
                      className="button"
                      aria-pressed={savedGuess === 'labels'}
                      onClick={() => setSavedGuess('labels')}
                    >
                      A secret label for each mixer
                    </button>
                  </div>
                  {savedGuess && (
                    <p role="status">
                      {savedGuess === 'weights'
                        ? 'Yes. Each layer turns an input into numbers the next layer can use. Training adjusts those transformations together.'
                        : 'No hidden labels were supplied. Practice changed the weights and biases. Choose the saved recipe.'}
                    </p>
                  )}
                  <button className="button" onClick={() => setUses(uses + 1)}>
                    Use the saved recipe again
                  </button>
                  <div className="feature-small-note" aria-live="polite">
                    Extra predictions: {uses}. Extra training updates: 0. These are the four
                    practice cards, so this is no proof of performance on a wider world.
                  </div>
                </div>
              )}
            </>
          )}
          <div className="guide-controls">
            <button className="button" onClick={reset}>
              <RotateCcw size={15} />
              Restart feature story
            </button>
            <span className="feature-stage-count">{stage + 1} / 6</span>
            {stage < 5 && (
              <button className="button primary" disabled={!ready} onClick={nextStage}>
                {
                  [
                    'Meet the mixers',
                    'Where does their advice come from?',
                    'Watch real practice',
                    'Test a learned mixer',
                    'Use the saved recipe',
                  ][stage]
                }
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </section>
      )}
      {mode === 'math' && (
        <div className="math-story">
          <section className="panel">
            <span className="eyebrow">A FEATURE IS A COMPUTED RESPONSE</span>
            <h2>Same input, changed transformation.</h2>
            <p>
              A hidden feature hⱼ is a number computed from the input. Its input weights and bias
              control that number. The final loss trains those parameters even though hⱼ has no
              target label.
            </p>
            <div className="formula">
              <code>aⱼ = wⱼ₁x₁ + wⱼ₂x₂ + bⱼ</code>
              <code>hⱼ = tanh(aⱼ), z = Σⱼ vⱼhⱼ + c, p = sigmoid(z)</code>
              <code>L = −t ln(p) − (1−t) ln(1−p)</code>
            </div>
            <p>
              x₁ and x₂ are the two lights. j picks one of the four mixers. w and b are its weights
              and bias; v and c belong to the final answer station. t is our answer (1 for ring, 0
              for quiet); p is the model’s ring probability. Σ means add all four contributions.
              Sigmoid squeezes the final score into 0…1; ln is the natural logarithm used by this
              loss.
            </p>
            <p>
              tanh bends a sum into −1…+1. Without nonlinear operations between linear layers,
              stacking layers would still produce one affine transformation. A single affine
              decision boundary cannot solve XOR.
            </p>
          </section>
          <section className="panel">
            <h2>The final error reaches an earlier weight.</h2>
            <div className="formula">
              <code>∂L/∂wⱼ₁ = (p−t) × vⱼ × (1−hⱼ²) × x₁</code>
              <code>final error × downstream weight × local slope × input</code>
              <code>G = (g₁ + g₂ + g₃ + g₄) / 4</code>
              <code>wⱼ₁,new = wⱼ₁,old − 0.5G</code>
            </div>
            <label className="feature-select">
              Inspect hidden mixer
              <select value={unit} onChange={(event) => setUnit(Number(event.target.value))}>
                {[0, 1, 2, 3].map((index) => (
                  <option key={index} value={index}>
                    Mixer {index + 1}
                  </option>
                ))}
              </select>
            </label>
            <label className="feature-select">
              Training checkpoint
              <select
                value={checkpoint}
                onChange={(event) => setCheckpoint(Number(event.target.value))}
              >
                {frames.map((item, index) => (
                  <option key={item.step} value={index}>
                    {item.step} updates
                  </option>
                ))}
              </select>
            </label>
            <div
              className="feature-table-scroll"
              role="region"
              aria-label="Gradient contributions from the four examples"
              tabIndex={0}
            >
              <table className="feature-vote-table">
                <caption>Four unaveraged votes for mixer {unit + 1}’s first input weight</caption>
                <thead>
                  <tr>
                    <th>Card</th>
                    <th>p−t</th>
                    <th>vⱼ</th>
                    <th>1−hⱼ²</th>
                    <th>x₁</th>
                    <th>Product g</th>
                  </tr>
                </thead>
                <tbody>
                  {votes.map((vote, index) => (
                    <tr key={index}>
                      <th>
                        {CARDS[index].x}, {CARDS[index].y}
                      </th>
                      <td>{signed(vote.error)}</td>
                      <td>{signed(vote.downstream)}</td>
                      <td>{vote.localSlope.toFixed(3)}</td>
                      <td>{vote.value}</td>
                      <td>{signed(vote.gradient)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="formula">
              <code>G = {signed(gradient)}</code>
              <code>
                new w = {signed(frame.model.w1[unit][0])} − 0.5 × ({signed(gradient)}) ={' '}
                {signed(nextModel.w1[unit][0])}
              </code>
            </div>
            <p>
              One example can push against another. We average their derivatives, then update every
              parameter together using gradients at the old weights. A zero vote may mean the input
              was zero, not that the mixer is useless.
            </p>
          </section>
          <section className="panel">
            <h2>Now recompute the internal message.</h2>
            <CardPicker
              selected={cardIndex}
              onChange={setCardIndex}
              model={frame.model}
              showAnswers={false}
            />
            <div className="feature-change-equation">
              <span>
                Before this update<strong>{firstResponse.toFixed(6)}</strong>
              </span>
              <ArrowRight aria-hidden="true" />
              <span>
                After this update<strong>{nextResponse.toFixed(6)}</strong>
              </span>
            </div>
            <p>
              These are exact forward passes before and after the joint update, displayed to six
              decimals. This changed response is representation learning in a form we can inspect.
              Different weights can encode the same function, and a useful feature need not have an
              everyday name.
            </p>
            <p>
              A deeper network repeats this idea across more transformations. The chain rule
              multiplies local derivatives along paths and sums contributions where paths meet. It
              supplies sensitivity, not a guaranteed future result or a human explanation.
            </p>
          </section>
        </div>
      )}
      {mode === 'code' && (
        <CodeWalkthrough
          title="The exact feature learner running in this lesson"
          code={source}
          steps={[
            {
              label: 'Only the final answers are labeled',
              explanation:
                'The four cards contain two input numbers and one final bell label. There is no field that names what a hidden unit should learn.',
              lines: codeLines('export const CARDS', '{ x:'),
            },
            {
              label: 'Compute an internal representation',
              explanation:
                'Each row of w1 mixes the inputs. tanh bends that sum. The output combines all four resulting hidden numbers.',
              lines: codeLines('const hidden =', 'Math.tanh', 'const logit =', 'return { hidden'),
            },
            {
              label: 'Send the final error backward',
              explanation:
                'The derivative passes through the output weight and the tanh slope. Multiplying by an input tells us the sensitivity to that input weight. Every example contributes to the average.',
              lines: codeLines(
                'const error =',
                'const hiddenError =',
                'gradient.w1',
                'gradient.b1',
              ),
            },
            {
              label: 'Save new weights, then test an intervention',
              explanation:
                'All weights update together. mute sets one outgoing weight to zero without retraining anything. The final console tables measure the resulting predictions and loss.',
              lines: codeLines(
                'const updated =',
                'w - rate',
                'b - rate',
                'export function mute',
                'model.w2.map',
                'console.table',
              ),
            },
          ]}
        />
      )}
    </div>
  );
}

function LightPair({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="feature-lights"
      aria-label={`First light ${x ? 'on' : 'off'}, second light ${y ? 'on' : 'off'}`}
    >
      {[x, y].map((on, i) => (
        <span key={i} className={on ? 'is-on' : ''}>
          <Lightbulb size={25} aria-hidden="true" />
          <small>{on ? 'ON' : 'OFF'}</small>
        </span>
      ))}
    </div>
  );
}
function CardPicker({
  selected,
  onChange,
  model,
  showAnswers,
}: {
  selected: number;
  onChange: (index: number) => void;
  model: FeatureModel;
  showAnswers: boolean;
}) {
  return (
    <div className="feature-card-picker" role="group" aria-label="Choose a light card">
      {CARDS.map((card, index) => (
        <button
          key={index}
          aria-pressed={index === selected}
          onClick={() => onChange(index)}
          aria-label={`Inspect card ${card.x}, ${card.y}`}
        >
          <LightPair x={card.x} y={card.y} />
          <span>Answer: {card.label ? 'ring' : 'quiet'}</span>
          {showAnswers && <strong>{probability(predict(model, card).p)} ring</strong>}
        </button>
      ))}
    </div>
  );
}
function ResponseBar({ value, previous }: { value: number; previous?: number }) {
  return (
    <span className="feature-response-bar" aria-hidden="true">
      <i className="feature-zero" />
      {previous !== undefined && (
        <i className="feature-before-dot" style={{ left: `${50 + previous * 45}%` }} />
      )}
      <i className="feature-response-dot" style={{ left: `${50 + value * 45}%` }} />
    </span>
  );
}
