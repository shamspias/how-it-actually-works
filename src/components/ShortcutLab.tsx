import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  Check,
  FlaskConical,
  Info,
  Play,
  RefreshCw,
  Shuffle,
} from 'lucide-react';
import {
  createShortcutData,
  emptyShortcutModel,
  predictShortcut,
  shortcutAccuracy,
  shortcutLoss,
  SHORTCUT_PENALTY,
  SHORTCUT_RATE,
  SHORTCUT_STEPS,
  trainShortcut,
  type Background,
  type Shape,
  type ShortcutSample,
} from '../lib/shortcut';
import './shortcut.css';

const percentage = (value: number) => `${Math.round(value * 100)}%`;
const signed = (value: number) => `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(3)}`;

export default function ShortcutLab() {
  const [recipe, setRecipe] = useState<'biased' | 'diverse'>('biased');
  const [model, setModel] = useState(emptyShortcutModel);
  const [trained, setTrained] = useState(false);
  const [world, setWorld] = useState<'familiar' | 'shifted'>('familiar');
  const [shape, setShape] = useState<Shape>('circle');
  const [background, setBackground] = useState<Background>('mint');
  const [answer, setAnswer] = useState<'swap' | 'longer' | null>(null);
  const correlation = recipe === 'biased' ? 0.95 : 0.5;
  const trainingData = useMemo(() => createShortcutData(144, 101, correlation), [correlation]);
  const familiarData = useMemo(() => createShortcutData(300, 701, correlation), [correlation]);
  const shiftedData = useMemo(() => createShortcutData(300, 907, 0.05), []);
  const shapeFeature = shape === 'circle' ? 0.35 : -0.35;
  const backgroundFeature = background === 'mint' ? 1 : -1;
  const prediction = predictShortcut(model, { shapeFeature, backgroundFeature });
  const contributions = [
    {
      name: 'Shape clue',
      weight: model.shapeWeight,
      input: shapeFeature,
      value: model.shapeWeight * shapeFeature,
    },
    {
      name: 'Background clue',
      weight: model.backgroundWeight,
      input: backgroundFeature,
      value: model.backgroundWeight * backgroundFeature,
    },
    { name: 'Starting offset', weight: model.bias, input: 1, value: model.bias },
  ];
  const scale = Math.max(1, ...contributions.map((item) => Math.abs(item.value)));
  const scores = [
    {
      title: 'Training examples',
      subtitle: '144 pictures it learned from',
      score: shortcutAccuracy(model, trainingData),
      key: 'train',
    },
    {
      title: 'Familiar world',
      subtitle: '300 fresh, similar examples',
      score: shortcutAccuracy(model, familiarData),
      key: 'familiar',
    },
    {
      title: 'Changed world',
      subtitle: '300 fresh, mostly swapped colors',
      score: shortcutAccuracy(model, shiftedData),
      key: 'shifted',
    },
  ];
  const displayData = world === 'familiar' ? familiarData : shiftedData;

  function chooseRecipe(next: 'biased' | 'diverse') {
    if (next === recipe) return;
    setRecipe(next);
    setModel(emptyShortcutModel());
    setTrained(false);
  }

  return (
    <div className="shortcut-lesson">
      <div className="lesson-heading">
        <div className="eyebrow">
          EXPERIMENT 04 <span> / </span> QUESTION THE PATTERN
        </div>
        <h1>
          Right answer.
          <br />
          <em>Wrong reason?</em>
        </h1>
        <p>
          You teach it circles and squares. It discovers something easier. Change the background,
          and find out what the numbers really learned.
        </p>
      </div>
      <div className="experiment-banner">
        <span className="experiment-dot" />
        <span>
          <strong>Your mission</strong> Teach the shape. Then test the clue.
        </span>
        <span className="pill">A REAL SHORTCUT EXPERIMENT</span>
      </div>

      <div className="shortcut-workspace">
        <section className="panel shortcut-training" aria-labelledby="shortcut-data-title">
          <div className="panel-header">
            <h2 id="shortcut-data-title">
              <FlaskConical size={17} /> Choose its childhood
            </h2>
            <span className="step-tag">01</span>
          </div>
          <p className="muted">
            The label always names the shape. The background is an accidental clue.
          </p>
          <div className="segmented" aria-label="Training picture recipe">
            <button aria-pressed={recipe === 'biased'} onClick={() => chooseRecipe('biased')}>
              Biased examples
            </button>
            <button aria-pressed={recipe === 'diverse'} onClick={() => chooseRecipe('diverse')}>
              Diverse examples
            </button>
          </div>
          <div className="shortcut-recipe-note">
            {recipe === 'biased' ? (
              <>
                <strong>Almost always together.</strong> Circles usually have mint backgrounds;
                squares usually have lavender. The pairing has a 95% chance.
              </>
            ) : (
              <>
                <strong>Mix up the backgrounds.</strong> Each shape gets either color with a 50%
                chance. Shape stays useful; color loses its shortcut.
              </>
            )}
          </div>
          <div className="shortcut-training-grid">
            {trainingData.slice(0, 8).map((sample, index) => (
              <div className="shortcut-example" key={index}>
                <ShapePicture shape={sample.shape} background={sample.background} />
                <span>{sample.shape}</span>
              </div>
            ))}
          </div>
          <p className="micro-note">
            8 of 144 training examples. We supply two measured clues to the model: shape and
            background color.
          </p>
          <button
            className="button primary shortcut-train-button"
            onClick={() => {
              setModel(trainShortcut(trainingData));
              setTrained(true);
            }}
          >
            {trained ? <RefreshCw size={16} /> : <Play size={16} fill="currentColor" />}
            {trained ? 'Train again from zero' : 'Train on these examples'}
          </button>
          <p className="shortcut-training-status" role="status">
            {trained ? (
              <>
                <Check size={14} /> {SHORTCUT_STEPS} actual updates · objective{' '}
                {shortcutLoss(model, trainingData).toFixed(3)}
              </>
            ) : (
              'Three numbers start at zero. Nothing is learned yet.'
            )}
          </p>
        </section>

        <section className="panel shortcut-evaluation" aria-labelledby="shortcut-world-title">
          <div className="panel-header">
            <h2 id="shortcut-world-title">Now change the world</h2>
            <span className="step-tag">02</span>
          </div>
          <div className="shortcut-score-grid">
            {scores.map((item) => (
              <div
                key={item.key}
                className={`shortcut-score ${item.key === 'shifted' ? 'shortcut-score-shifted' : ''}`}
              >
                <span>{item.title}</span>
                <strong
                  className={trained && item.score < 0.5 ? 'shortcut-low-score' : ''}
                  data-testid={`shortcut-${item.key}-accuracy`}
                >
                  {trained ? percentage(item.score) : '—'}
                </strong>
                <small>{item.subtitle}</small>
              </div>
            ))}
          </div>
          <div className="segmented" aria-label="Evaluation world">
            <button aria-pressed={world === 'familiar'} onClick={() => setWorld('familiar')}>
              Familiar world
            </button>
            <button aria-pressed={world === 'shifted'} onClick={() => setWorld('shifted')}>
              <Shuffle size={14} /> Swap the backgrounds
            </button>
          </div>
          <div className="shortcut-test-grid">
            {displayData.slice(0, 6).map((sample, index) => {
              const guessedShape = predictShortcut(model, sample) >= 0.5 ? 'circle' : 'square';
              return (
                <div className="shortcut-example" key={index}>
                  <ShapePicture shape={sample.shape} background={sample.background} />
                  <span>{sample.shape}</span>
                  <small
                    className={
                      trained
                        ? guessedShape === sample.shape
                          ? 'shortcut-correct'
                          : 'shortcut-incorrect'
                        : 'muted'
                    }
                  >
                    {trained
                      ? `${guessedShape === sample.shape ? '✓' : '×'} guessed ${guessedShape}`
                      : 'Awaiting training'}
                  </small>
                </div>
              );
            })}
          </div>
          <div className="shortcut-result" role="status">
            {!trained ? (
              <>
                <strong>A high score is only part of the story.</strong> Train the model, then
                compare its two worlds.
              </>
            ) : recipe === 'biased' ? (
              <>
                <strong>Same task. Very different score.</strong> The background pairing mostly
                reverses in the changed world. The labels still follow shape, but this model leans
                on color.
              </>
            ) : (
              <>
                <strong>A better lesson in the data.</strong> Diverse backgrounds helped this model
                rely on shape. It now handles the swapped-color examples in this experiment.
              </>
            )}
          </div>
        </section>
      </div>

      <section className="panel shortcut-probe" aria-labelledby="shortcut-probe-title">
        <div className="panel-header">
          <div>
            <h2 id="shortcut-probe-title">Keep the shape. Change one clue.</h2>
            <p className="muted">
              An intervention: change only the background and measure the effect.
            </p>
          </div>
          <span className="step-tag">03</span>
        </div>
        <div className="shortcut-probe-grid">
          <div className="shortcut-probe-controls">
            <div className="segmented" aria-label="Probe shape">
              <button aria-pressed={shape === 'circle'} onClick={() => setShape('circle')}>
                Circle
              </button>
              <button aria-pressed={shape === 'square'} onClick={() => setShape('square')}>
                Square
              </button>
            </div>
            <div className="shortcut-probe-picture">
              <ShapePicture shape={shape} background={background} />
              <div>
                <span className="eyebrow">MODEL’S CHANCE OF CIRCLE</span>
                <strong data-testid="shortcut-probe-prediction">{percentage(prediction)}</strong>
                <span>
                  True label: <b>{shape}</b>
                </span>
              </div>
            </div>
            <button
              className="button"
              onClick={() => setBackground(background === 'mint' ? 'lavender' : 'mint')}
            >
              <Shuffle size={15} /> Change background <ArrowRight size={15} />
            </button>
            <p className="micro-note">
              Current color: {background}.{' '}
              {trained
                ? 'Did changing the color change the guess?'
                : 'Train first to give these clues learned weights.'}
            </p>
          </div>
          <div className="shortcut-contributions">
            <h3>What moves this prediction?</h3>
            <div className="shortcut-contribution-scale">
              <span>← toward square</span>
              <span>toward circle →</span>
            </div>
            {contributions.map((item) => (
              <div className="shortcut-contribution" key={item.name}>
                <div>
                  <span>{item.name}</span>
                  <strong>{signed(item.value)}</strong>
                </div>
                <div className="shortcut-contribution-track">
                  <i
                    style={{
                      left:
                        item.value >= 0 ? '50%' : `${50 - (Math.abs(item.value) / scale) * 48}%`,
                      width: `${(Math.abs(item.value) / scale) * 48}%`,
                    }}
                  />
                </div>
                <small>
                  {item.name === 'Starting offset'
                    ? `Bias = ${signed(item.weight)}`
                    : `Weight ${signed(item.weight)} × input ${signed(item.input)}`}
                </small>
              </div>
            ))}
            <div className="shortcut-total">
              <span>Add them, then apply sigmoid</span>
              <code>
                z = {signed(contributions.reduce((sum, item) => sum + item.value, 0))} →{' '}
                {percentage(prediction)}
              </code>
            </div>
          </div>
        </div>
      </section>

      <div className="insight">
        <Info size={21} />
        <p>
          <strong>
            The loss asks for correct labels. It does not ask for your intended reason.
          </strong>{' '}
          If an easy clue helps on the training examples, gradient descent can reward it. Testing a
          changed clue reveals a weakness that a familiar-world score can hide.
        </p>
      </div>
      <details className="panel math-details">
        <summary>
          Why this model takes the shortcut{' '}
          <span>
            THE EXACT MECHANISM <ArrowDown size={15} />
          </span>
        </summary>
        <div className="details-body">
          <p>
            This is logistic regression over <strong>two supplied measurements</strong>, not a
            vision system that reads these drawings. Circle is label 1; square is label 0. The shape
            measurement is positive for circles and negative for squares, with magnitude uniformly
            drawn from 0.25 to 0.45. Background is positive for mint and negative for lavender, with
            magnitude from 0.9 to 1.1. The drawings illustrate those clues. Our probe uses ±0.35 and
            ±1.
          </p>
          <div className="formula">
            <code>z = wₛ × shape + w꜀ × color + b</code>
            <code>p(circle) = sigmoid(z) = 1 / (1 + e⁻ᶻ)</code>
            <code>J = mean(−t ln p − (1−t) ln(1−p)) + λ/2 × (wₛ² + w꜀²)</code>
          </div>
          <p>
            Here λ = {SHORTCUT_PENALTY}. The extra term penalizes large weights. Color has a larger
            numerical scale, so it can move the prediction using a smaller weight. When color
            usually agrees with the label, this setup makes it an attractive shortcut.{' '}
            <strong>
              That is a deliberate modeling assumption, not a law that every model prefers color.
            </strong>{' '}
            Rescaling the features or changing the penalty can change the result.
          </p>
          <div className="formula">
            <code>∂J/∂wⱼ = mean((p−t) × inputⱼ) + λwⱼ</code>
            <code>wⱼ ← wⱼ − {SHORTCUT_RATE} × ∂J/∂wⱼ</code>
            <code>b ← b − {SHORTCUT_RATE} × mean(p−t)</code>
          </div>
          <p>
            All three parameters start at zero. Each of {SHORTCUT_STEPS} updates uses all 144
            training examples. The score shown next to the train button is the full penalized
            objective, not accuracy. With balanced colors, gradients from the color clue tend to
            cancel across examples while the shape clue remains consistent.
          </p>
          <p className="muted">
            Training seed: 101. Familiar evaluation seed: 701. Changed-world seed: 907. Both
            evaluation sets contain 300 independent fresh draws and never supply gradients. The
            changed world pairs color with the shape label only 5% of the time. Finite samples need
            not match these probabilities exactly. Repeatedly choosing settings using these scores
            makes them validation evidence; a final assessment needs untouched data from the
            intended setting.
          </p>
        </div>
      </details>

      <section className="panel shortcut-quiz" aria-labelledby="shortcut-quiz-title">
        <div>
          <span className="eyebrow">CHECK YOUR INTUITION</span>
          <h3 id="shortcut-quiz-title">A great familiar-world score. What would you check next?</h3>
        </div>
        <div className="shortcut-quiz-options">
          <button
            className={`button ${answer === 'swap' ? 'selected' : ''}`}
            aria-pressed={answer === 'swap'}
            onClick={() => setAnswer('swap')}
          >
            Swap backgrounds, keep the labels
          </button>
          <button
            className={`button ${answer === 'longer' ? 'selected' : ''}`}
            aria-pressed={answer === 'longer'}
            onClick={() => setAnswer('longer')}
          >
            Train longer on the same examples
          </button>
        </div>
        <p className="shortcut-quiz-feedback" role="status">
          {answer === 'swap'
            ? 'Exactly. Holding shape fixed while changing color tests whether predictions depend on that clue. It gives evidence of reliance, not a complete explanation of every model.'
            : answer === 'longer'
              ? 'More training could make the same shortcut more confident. First change the suspicious clue and check whether the answer follows it.'
              : 'Choose an experiment. A useful explanation should survive a test.'}
        </p>
      </section>
    </div>
  );
}

function ShapePicture({ shape, background }: Pick<ShortcutSample, 'shape' | 'background'>) {
  return (
    <svg
      viewBox="0 0 100 86"
      className="shortcut-shape-picture"
      role="img"
      aria-label={`${shape} on a ${background} background`}
    >
      <rect
        x="0"
        y="0"
        width="100"
        height="86"
        rx="9"
        fill={background === 'mint' ? '#dceadf' : '#e9e0f1'}
      />
      {shape === 'circle' ? (
        <circle cx="50" cy="43" r="23" fill="#fdfbf5" stroke="#405448" strokeWidth="3" />
      ) : (
        <rect
          x="28"
          y="21"
          width="44"
          height="44"
          rx="2"
          fill="#fdfbf5"
          stroke="#405448"
          strokeWidth="3"
        />
      )}
    </svg>
  );
}
