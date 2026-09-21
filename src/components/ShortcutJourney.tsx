import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, FlaskConical, RotateCcw } from 'lucide-react';
import {
  createShortcutData,
  emptyShortcutModel,
  predictShortcut,
  shortcutAccuracy,
  trainShortcut,
} from '../lib/shortcut';
import { CodeWalkthrough, ModeSwitcher, type LearningMode } from './LearningModes';
import ShortcutLab from './ShortcutLab';
import source from '../../examples/shortcut.mjs?raw';

export default function ShortcutJourney() {
  const [mode, setMode] = useState<LearningMode>('visual');
  const [stage, setStage] = useState(0);
  const [model, setModel] = useState(emptyShortcutModel);
  const [swapped, setSwapped] = useState(false);
  const [diverse, setDiverse] = useState(false);
  const [lab, setLab] = useState(false);
  const [guess, setGuess] = useState<'shape' | 'background' | null>(null);
  const test = useMemo(() => createShortcutData(300, 907, 0.05), []);
  const familiar = useMemo(() => createShortcutData(300, 701, 0.95), []);
  const probability = predictShortcut(model, {
    shapeFeature: 0.35,
    backgroundFeature: swapped ? -1 : 1,
  });
  const score = (p: number) => `${Math.round(p * 100)}%`;
  function train(varied = false) {
    setModel(trainShortcut(createShortcutData(144, 101, varied ? 0.5 : 0.95)));
    setDiverse(varied);
  }
  function reset() {
    setStage(0);
    setModel(emptyShortcutModel());
    setSwapped(false);
    setDiverse(false);
    setGuess(null);
  }
  const titles = [
    'These practice cards teach two clues at once.',
    'It learned to answer. What clue did it use?',
    'Change the background. Keep the circle.',
    'Teach the lesson you actually meant.',
  ];
  const notes = [
    'A label is the answer we supply below each card. Circles usually sit on mint; squares usually sit on lavender. The answer always names the shape. But both shape and background are useful clues in practice. Which do you think the model will rely on?',
    'The model really ran 600 updates. It gets most familiar examples right. That score cannot tell us whether it followed shape, color, or a mixture. We need a new experiment.',
    `The label is still circle. Only its background changes. The model currently assigns ${score(probability)} to circle. If the guess changes with the background, that gives evidence the background affects its decision.`,
    'Mix the backgrounds in the practice examples. Now color is unreliable and shape remains useful. Retraining this toy model makes shape the useful clue. This is a controlled result, not a guarantee for every model.',
  ];
  if (lab)
    return (
      <>
        <div className="lesson-mode-context">
          <button className="button" onClick={() => setLab(false)}>
            <ArrowLeft size={16} />
            Back to the detective story
          </button>
        </div>
        <ShortcutLab />
      </>
    );
  return (
    <div className="shortcut-journey">
      <header className="lesson-heading">
        <p className="eyebrow">
          EXPERIMENT 07 <span> / </span> THE SHORTCUT DETECTIVE
        </p>
        <h1>
          Right answer.
          <br />
          <em>Which clue?</em>
        </h1>
        <p>
          You’re the detective. A card-sorting program must answer “circle” or “square.” Its
          practice cards have colored backgrounds too. Train it, then change only the background to
          find out which clue its answer depends on.
        </p>
      </header>
      <ModeSwitcher value={mode} onChange={setMode} />
      {mode === 'visual' && (
        <section className="guide-card">
          <span className="guide-kicker">CLUE {stage + 1} OF 4</span>
          <h2>{titles[stage]}</h2>
          {stage === 0 ? (
            <>
              <div className="detective-cards">
                {[true, false, true, false].map((circle, i) => (
                  <div key={i}>
                    <Picture circle={circle} mint={circle} />
                    <span>label: {circle ? 'circle' : 'square'}</span>
                  </div>
                ))}
              </div>
              <div className="guide-prompt">
                <p>Which clue would you investigate?</p>
                <div>
                  <button
                    className="button"
                    aria-pressed={guess === 'shape'}
                    onClick={() => setGuess('shape')}
                  >
                    The shape
                  </button>
                  <button
                    className="button"
                    aria-pressed={guess === 'background'}
                    onClick={() => setGuess('background')}
                  >
                    The background
                  </button>
                </div>
                <p className="guide-feedback">
                  {guess
                    ? 'Both clues could help on these examples. Let’s train, then test which one matters.'
                    : 'You do not need to guess correctly. You need a test.'}
                </p>
              </div>
            </>
          ) : (
            <div className="detective-probe">
              <div>
                <Picture circle mint={!swapped} />
                <span>The real label stays: circle</span>
              </div>
              <ArrowRight size={30} />
              <div className="detective-answer" aria-live="polite">
                <span>THE MODEL’S GUESS</span>
                <strong>{probability >= 0.5 ? 'Circle' : 'Square'}</strong>
                <p>
                  <b>{score(probability)}</b> model’s circle score
                </p>
              </div>
            </div>
          )}
          {stage >= 1 && (
            <div className="detective-scores">
              <div>
                <span>Fresh, familiar examples</span>
                <strong data-testid="detective-familiar">
                  {score(shortcutAccuracy(model, familiar))}
                </strong>
              </div>
              {stage >= 2 && (
                <div>
                  <span>Fresh, swapped-background examples</span>
                  <strong data-testid="detective-shifted">
                    {score(shortcutAccuracy(model, test))}
                  </strong>
                </div>
              )}
            </div>
          )}
          <div className="guide-narration">
            <span className="guide-number">{stage + 1}</span>
            <p>{notes[stage]}</p>
          </div>
          {stage >= 2 && (
            <button className="button" onClick={() => setSwapped(!swapped)}>
              Change only the background
              <ArrowRight size={16} />
            </button>
          )}
          {stage === 3 && (
            <div className="guide-prompt">
              <p>
                {diverse
                  ? 'After varied practice, the circle stays a circle even when its background changes. Try it.'
                  : 'The first training set made background a shortcut. Let’s change the examples, then run the same learning rule.'}
              </p>
              <button className="button primary" onClick={() => train(!diverse)}>
                {diverse ? 'Return to biased training' : 'Train with varied backgrounds'}
              </button>
            </div>
          )}
          <div className="guide-controls">
            <button className="button" onClick={reset}>
              <RotateCcw size={15} />
              Restart investigation
            </button>
            <div className="guide-dots" role="group" aria-label={`Clue ${stage + 1} of 4`}>
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={i === stage ? 'current' : i < stage ? 'past' : ''} />
              ))}
            </div>
            {stage < 3 && (
              <button
                className="button primary"
                onClick={() => {
                  if (stage === 0) train();
                  setStage(stage + 1);
                }}
              >
                {stage === 0
                  ? 'Train on the practice examples'
                  : stage === 1
                    ? 'Test the suspicious clue'
                    : 'Try better practice'}
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </section>
      )}
      {mode === 'math' && (
        <div className="math-story">
          <section className="panel">
            <h2>A score rewards the answer, not your intended reason.</h2>
            <p>
              This model gets two supplied measurements, shape and background. The illustrations are
              not pixels the model recognizes. It computes z = wₛs + w꜀c + b, then p(circle) =
              1/(1+e⁻ᶻ).
            </p>
            <div className="formula">
              <code>J = mean binary cross-entropy + 0.025/2 × (wₛ² + w꜀²)</code>
              <code>∂J/∂wⱼ = mean((p − label) × featureⱼ) + 0.025wⱼ</code>
              <code>wⱼ ← wⱼ − 0.15 × ∂J/∂wⱼ</code>
            </div>
            <p>
              Shape measurements have magnitude 0.25–0.45; color measurements have magnitude
              0.9–1.1. The penalty makes a larger-scale clue attractive when it agrees with labels.
              This deliberate setup makes the shortcut visible. Rescaling features or changing
              regularization can change the outcome.
            </p>
            <p>
              Training uses 144 generated examples; each displayed evaluation uses 300 different
              examples that never contribute gradients. The familiar world pairs colors with labels
              95% of the time; the changed world does so only 5%. Varied training pairs them 50% of
              the time.
            </p>
            <button className="button" onClick={() => setLab(true)}>
              Inspect every coefficient and contribution
              <ArrowRight size={16} />
            </button>
          </section>
        </div>
      )}
      {mode === 'code' && (
        <CodeWalkthrough
          title="A small shortcut experiment in plain JavaScript"
          code={source}
          steps={[
            {
              label: 'Give the model two possible clues',
              explanation:
                'This compact code version uses fixed rows instead of the visual lab’s 144 random examples. Shape signs always reveal the label. Biased training pairs shape and color; diverse training breaks that pairing.',
              lines: source
                .split('\n')
                .flatMap((line, i) =>
                  line.includes('const biased') ||
                  line.includes('const diverse') ||
                  line.includes('const changedWorld')
                    ? [i + 1]
                    : [],
                ),
            },
            {
              label: 'Learn coefficients with the same supervised rule',
              explanation:
                'Prediction minus label supplies the output derivative. Multiply by each feature, average, add the weight penalty, and take a step.',
              lines: source
                .split('\n')
                .flatMap((line, i) =>
                  line.includes('const p') ||
                  line.includes('const error') ||
                  line.includes('ds +=') ||
                  line.includes('shapeWeight -=')
                    ? [i + 1]
                    : [],
                ),
            },
            {
              label: 'Test a changed world',
              explanation:
                'Run node examples/shortcut.mjs. The two training recipes produce different predictions for the same swapped-color examples.',
              lines: source
                .split('\n')
                .flatMap((line, i) => (line.includes('console.log') ? [i + 1] : [])),
            },
          ]}
        />
      )}
      <div className="backprop-lab-invitation">
        <div>
          <h3>Want all the knobs and numbers?</h3>
          <p>The full lab lets you inspect the exact feature contributions.</p>
        </div>
        <button className="button" onClick={() => setLab(true)}>
          <FlaskConical size={16} />
          Open the shortcut lab
        </button>
      </div>
    </div>
  );
}

function Picture({ circle, mint }: { circle: boolean; mint: boolean }) {
  return (
    <svg
      viewBox="0 0 180 150"
      role="img"
      aria-label={`${circle ? 'Circle' : 'Square'} on ${mint ? 'mint' : 'lavender'}`}
    >
      <rect
        width="180"
        height="150"
        rx="19"
        fill={mint ? '#dcebdc' : '#e9e0f2'}
        style={{ transition: 'fill .6s' }}
      />
      {circle ? (
        <circle cx="90" cy="75" r="37" fill="#fffefa" stroke="#45603d" strokeWidth="4" />
      ) : (
        <rect
          x="54"
          y="39"
          width="72"
          height="72"
          rx="3"
          fill="#fffefa"
          stroke="#45603d"
          strokeWidth="4"
        />
      )}
    </svg>
  );
}
