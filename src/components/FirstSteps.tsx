import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Droplets,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sprout,
} from 'lucide-react';
import { practice, predict } from '../../examples/learning-loop.mjs';
import code from '../../examples/learning-loop.mjs?raw';
import {
  CodeWalkthrough,
  ModeSwitcher,
  useReducedMotion,
  type LearningMode,
} from './LearningModes';
import './first-steps.css';

const number = (x: number) => Number(x.toFixed(3)).toString();
const stops = [
  'Show an example',
  'You move the dial',
  'Let the program practice',
  'Use what stayed',
  'Tell the story back',
];

export default function FirstSteps() {
  const [mode, setMode] = useState<LearningMode>('visual');
  const [stage, setStage] = useState(0);
  const [dial, setDial] = useState(1);
  const [input, setInput] = useState(4);
  const [steps, setSteps] = useState(0);
  const [receipt, setReceipt] = useState<ReturnType<typeof practice> | null>(null);
  const [choice, setChoice] = useState<'dial' | 'answer' | 'electricity' | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [receiptFocus, setReceiptFocus] = useState(2);
  const [replaying, setReplaying] = useState(false);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (!replaying || mode !== 'visual' || stage !== 2 || !receipt) return;
    if (receiptFocus >= 2) {
      setReplaying(false);
      return;
    }
    const timer = window.setTimeout(() => setReceiptFocus((focus) => focus + 1), 1400);
    return () => window.clearTimeout(timer);
  }, [replaying, receiptFocus, receipt, mode, stage]);
  const shownInput = stage === 3 ? input : 2;
  const guess = predict(dial, shownInput);
  const current = practice(dial);
  function resetPractice() {
    setDial(1);
    setSteps(0);
    setReceipt(null);
    setReceiptFocus(2);
    setReplaying(false);
  }
  function reset() {
    setStage(0);
    resetPractice();
    setChoice(null);
    setRevealed(false);
    setInput(4);
  }
  function move(next: number) {
    setReplaying(false);
    if (next <= 2 && next !== stage) resetPractice();
    setStage(next);
    setRevealed(false);
  }
  function changeMode(next: LearningMode) {
    setReplaying(false);
    if (next === 'visual' && stage < 2 && receipt) resetPractice();
    setMode(next);
  }
  function train() {
    const step = practice(dial);
    setReceipt(step);
    setDial(step.nextDial);
    setSteps(steps + 1);
    setReceiptFocus(2);
    setReplaying(false);
  }
  const titles = [
    'Pip needs a little practice.',
    'Help Pip turn the dial.',
    'Now let the instructions try.',
    'A new question. The same dial.',
    'What did practice leave behind?',
  ];
  const stories = [
    'Our job: 2 drops for every seed. Pip can multiply by a saved dial, but its first guess is too small.',
    'Turn the dial until 2 seeds get 4 drops. This time, you choose the number.',
    'Press Practice once. The instructions compare the guess with the answer, then save a small dial change.',
    'Choose a new number of seeds. The question changes. The saved dial stays still.',
    'Practice changed something we can keep. Choose what is still inside Pip.',
  ];
  const receiptChange = receipt ? receipt.nextDial - receipt.dial : 0;
  const receiptNotes = receipt
    ? [
        `Before this practice: ${receipt.input} seeds × dial ${number(receipt.dial)} = ${number(receipt.guess)} drops.`,
        receipt.error === 0
          ? `The guess already matches the supplied answer: ${number(receipt.target)} drops.`
          : `The supplied answer is ${number(receipt.target)} drops. This guess is ${number(Math.abs(receipt.error))} drops too ${receipt.error < 0 ? 'small' : 'large'}.`,
        `The rule calculated a dial change of ${receiptChange >= 0 ? '+' : ''}${number(receiptChange)}. Saved dial: ${number(receipt.nextDial)}. New guess: ${number(predict(receipt.nextDial, receipt.input))} drops.`,
      ]
    : [];
  return (
    <div className={`first-steps ${reducedMotion ? 'first-reduced-motion' : ''}`}>
      <header className="lesson-heading">
        <p className="eyebrow">START HERE / NO NEW WORDS YET</p>
        <h1>
          What does <em>“learning” change?</em>
        </h1>
        <p>Teach Pip one tiny job. Find what stays after practice.</p>
      </header>
      <ModeSwitcher value={mode} onChange={changeMode} />
      {mode === 'visual' && (
        <section className="first-card" aria-label="Pip’s watering workbench">
          <div className="first-card-top">
            <div className="first-step-trail" aria-label={`Small step ${stage + 1} of 5`}>
              <span className="eyebrow">STEP {stage + 1} OF 5</span>
              <span className="first-progress-dots" aria-hidden="true">
                {stops.map((stop, i) => (
                  <i key={stop} className={i === stage ? 'current' : i < stage ? 'done' : ''} />
                ))}
              </span>
            </div>
            <button className="text-button" onClick={reset}>
              <RotateCcw size={14} /> Start again
            </button>
          </div>
          <div className="first-workbench">
            <div className="first-guidance">
              <h2>{titles[stage]}</h2>
              <p className="first-story" aria-live="polite">
                {stories[stage]}
              </p>
              {stage === 0 && (
                <div className="first-answer">
                  <div className="first-answer-icon">
                    <Droplets size={23} aria-hidden="true" />
                  </div>
                  <div>
                    <span>THE ANSWER WE SUPPLY</span>
                    <strong>2 seeds need 4 drops.</strong>
                    <p>Pip guessed {number(guess)}. Can you help?</p>
                  </div>
                </div>
              )}
              {stage === 1 && (
                <div className="first-action">
                  <div className="first-dial-buttons">
                    <button
                      className="button"
                      disabled={dial <= 0}
                      onClick={() => setDial(Math.max(0, dial - 0.5))}
                    >
                      <Minus size={17} /> Smaller dial
                    </button>
                    <button
                      className="button"
                      disabled={dial >= 3}
                      onClick={() => setDial(Math.min(3, dial + 0.5))}
                    >
                      <Plus size={17} /> Bigger dial
                    </button>
                  </div>
                  <p role="status" className={dial === 2 ? 'first-success' : ''}>
                    {dial === 2
                      ? 'That matches! Dial 2 makes 2 seeds → 4 drops.'
                      : guess < 4
                        ? 'We need 4 drops. The guess is still too small. Which button helps?'
                        : 'That is more than 4 drops. Try a smaller dial.'}
                  </p>
                </div>
              )}
              {stage === 2 && (
                <div className="first-action">
                  <button
                    className="button primary first-practice-button"
                    onClick={train}
                    disabled={steps >= 12}
                  >
                    Practice once <ArrowRight size={17} />
                  </button>
                  <p role="status">
                    {receipt
                      ? `Practice ${steps}: dial ${number(receipt.dial)} → ${number(receipt.nextDial)}. See what changed below.`
                      : 'We reset the dial to 1. Nothing changes until you run a practice step.'}
                  </p>
                  {steps >= 3 && (
                    <p className="first-win">
                      <Check size={15} aria-hidden="true" />
                      The gap is shrinking. The instructions stay the same.
                    </p>
                  )}
                </div>
              )}
              {stage === 3 && (
                <div className="first-action">
                  <div role="group" aria-label="Try an input without training">
                    {[1, 3, 4, 5].map((x) => (
                      <button
                        className="button"
                        key={x}
                        aria-pressed={input === x}
                        onClick={() => {
                          setInput(x);
                          setRevealed(false);
                        }}
                      >
                        {x} seeds
                      </button>
                    ))}
                  </div>
                  <p>
                    <strong>Dial stays {number(dial)}.</strong> Only the input and guess change.
                  </p>
                  <button className="text-button" onClick={() => setRevealed(!revealed)}>
                    {revealed ? 'Hide the teacher’s answer' : 'Check the teacher’s answer'}
                  </button>
                  {revealed && (
                    <p role="status">
                      Our watering rule gives {2 * input} drops. Pip guesses {number(guess)}. This
                      checks this example; it does not prove every future answer.
                    </p>
                  )}
                </div>
              )}
              {stage === 4 && (
                <div className="first-action">
                  <div className="first-choices">
                    {(
                      [
                        ['dial', 'The adjusted dial number.'],
                        ['answer', 'The answer to every possible question.'],
                        ['electricity', 'Electricity that knows what plants want.'],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        className="button"
                        aria-pressed={choice === id}
                        key={id}
                        onClick={() => setChoice(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p role="status">
                    {choice === 'dial'
                      ? 'Yes. The stored number changed, so the same multiplication can give better guesses. The data and the chosen update rule caused the change.'
                      : choice === 'answer'
                        ? 'We did not list every answer. One shared multiplier is used again for each input.'
                        : choice === 'electricity'
                          ? 'The circuitry follows instructions. The supplied answers tell the program what counts as a mistake.'
                          : 'Choose an explanation. You can always go back and try again.'}
                  </p>
                </div>
              )}
              <div className="first-step-footer">
                {stage < 4 && (
                  <button
                    className="button primary"
                    disabled={(stage === 1 && dial !== 2) || (stage === 2 && steps === 0)}
                    onClick={() => move(stage + 1)}
                  >
                    Next: {stops[stage + 1]} <ArrowRight size={16} />
                  </button>
                )}
                <button
                  className="first-back text-button"
                  disabled={stage === 0}
                  onClick={() => move(stage - 1)}
                >
                  <ArrowLeft size={14} /> Back one step
                </button>
              </div>
            </div>
            <div className="first-demonstration">
              {stage < 4 ? (
                <>
                  <div className="pip-scene-caption">
                    <Sprout size={15} aria-hidden="true" />
                    <span>PIP’S LITTLE WATERING STATION</span>
                  </div>
                  <div
                    className="pip-machine"
                    role="group"
                    aria-label={`${shownInput} seeds times dial ${number(dial)} gives ${number(guess)} drops`}
                  >
                    <div className="pip-input">
                      <span>SEEDS IN</span>
                      <div className="pip-seed-tray" aria-hidden="true">
                        <div className="pip-seeds">
                          {Array.from({ length: shownInput }, (_, i) => (
                            <i key={i} />
                          ))}
                        </div>
                        <div className="pip-tray-line" />
                      </div>
                      <strong>{shownInput} seeds</strong>
                    </div>
                    <ArrowRight className="pip-arrow" size={19} aria-hidden="true" />
                    <div
                      className={`pip-robot ${receipt && stage === 2 ? 'pip-practicing' : ''}`}
                      key={steps}
                    >
                      <span className="pip-antenna" aria-hidden="true" />
                      <div className="pip-face" aria-hidden="true">
                        <i />
                        <i />
                        <span />
                      </div>
                      <span>SAVED DIAL</span>
                      <div className="pip-dial">
                        <i
                          style={{ transform: `rotate(${dial * 65 - 90}deg)` }}
                          aria-hidden="true"
                        />
                        <strong data-testid="pip-dial">{number(dial)}</strong>
                      </div>
                      <small>multiply by this</small>
                    </div>
                    <ArrowRight className="pip-arrow" size={19} aria-hidden="true" />
                    <div className="pip-output">
                      <span>WATER GUESS</span>
                      <div className="pip-glass-wrap" aria-hidden="true">
                        <div className="pip-glass">
                          <i style={{ height: `${Math.max(0, Math.min(100, guess * 10))}%` }} />
                          {stage < 3 && <span className="pip-goal-line" />}
                        </div>
                        {stage < 3 && <span className="pip-goal-label">4</span>}
                      </div>
                      <strong data-testid="pip-guess">{number(guess)} drops</strong>
                    </div>
                  </div>
                  <div className="pip-equation">
                    {shownInput} seeds <span>×</span> dial {number(dial)} <span>=</span>{' '}
                    {number(guess)} drops
                  </div>
                  <div className="pip-scene-note">
                    {stage < 3 ? (
                      <>
                        <i aria-hidden="true" />
                        Dashed line: the answer, 4 drops.
                      </>
                    ) : (
                      <>Same dial. A different question.</>
                    )}
                  </div>
                </>
              ) : (
                <div className="pip-remember">
                  <div className="pip-face" aria-hidden="true">
                    <i />
                    <i />
                    <span />
                  </div>
                  <span>WHAT STAYED AFTER PRACTICE</span>
                  <strong>The saved dial: {number(dial)}</strong>
                  <p>One number now affects every new guess.</p>
                  <span className="pip-memory-chip" aria-hidden="true">
                    × {number(dial)}
                  </span>
                </div>
              )}
            </div>
          </div>
          {stage === 2 && receipt && (
            <section className="pip-receipt" aria-label="What changed in the last practice">
              <div className="pip-receipt-header">
                <div>
                  <span className="eyebrow">A RECORD OF THE STEP THAT JUST RAN</span>
                  <h3>What changed in practice {steps}?</h3>
                </div>
                <button
                  className="text-button"
                  onClick={() => {
                    if (replaying) setReplaying(false);
                    else {
                      setReceiptFocus(0);
                      setReplaying(true);
                    }
                  }}
                >
                  {replaying ? <Pause size={15} /> : <Play size={15} />}
                  {replaying ? 'Pause replay' : 'Replay this change'}
                </button>
              </div>
              <div
                className="pip-receipt-stops"
                role="group"
                aria-label="Inspect this practice step"
              >
                <button
                  aria-pressed={receiptFocus === 0}
                  onClick={() => {
                    setReplaying(false);
                    setReceiptFocus(0);
                  }}
                >
                  <span>
                    <i>1</i> Guess
                  </span>
                  <strong data-testid="pip-receipt-before-guess">
                    {number(receipt.guess)} drops
                  </strong>
                  <small>
                    {receipt.input} seeds × old dial {number(receipt.dial)}
                  </small>
                </button>
                <button
                  aria-pressed={receiptFocus === 1}
                  onClick={() => {
                    setReplaying(false);
                    setReceiptFocus(1);
                  }}
                >
                  <span>
                    <i>2</i> Compare
                  </span>
                  <strong>
                    {number(Math.abs(receipt.error))}{' '}
                    {receipt.error < 0 ? 'too few' : receipt.error > 0 ? 'too many' : 'difference'}
                  </strong>
                  <small>Supplied answer: {number(receipt.target)} drops</small>
                </button>
                <button
                  aria-pressed={receiptFocus === 2}
                  onClick={() => {
                    setReplaying(false);
                    setReceiptFocus(2);
                  }}
                >
                  <span>
                    <i>3</i> Adjust & save
                  </span>
                  <strong data-testid="pip-receipt-dial">
                    {number(receipt.dial)} → {number(receipt.nextDial)}
                  </strong>
                  <small>New guess: {number(predict(receipt.nextDial, receipt.input))} drops</small>
                </button>
              </div>
              <p className="pip-receipt-caption" role="status">
                {receiptNotes[receiptFocus]}
              </p>
              <details className="pip-receipt-math">
                <summary>Why this amount of change?</summary>
                <p>
                  The instructions use the difference, the input, and a small step size. Here is the
                  arithmetic from this saved step:
                </p>
                <div>
                  <code>
                    difference: {number(receipt.guess)} − {number(receipt.target)} ={' '}
                    {number(receipt.error)}
                  </code>
                  <code>
                    sensitivity: {number(receipt.error)} × {receipt.input} ={' '}
                    {number(receipt.gradient)}
                  </code>
                  <code>
                    new dial: {number(receipt.dial)} − {receipt.rate} × ({number(receipt.gradient)})
                    = {number(receipt.nextDial)}
                  </code>
                </div>
                <p>
                  “Sensitivity” tells us how a tiny dial change affects the mistake score. The next
                  lessons show why this rule works. It does not simply store the teacher’s answer.
                </p>
              </details>
            </section>
          )}
          {stage === 4 && choice === 'dial' && (
            <div className="first-word-map">
              <h3>Now we can name what you already did.</h3>
              <dl>
                <div>
                  <dt>Input</dt>
                  <dd>The number of seeds.</dd>
                </div>
                <div>
                  <dt>Label / target</dt>
                  <dd>The supplied correct water amount.</dd>
                </div>
                <div>
                  <dt>Weight / parameter</dt>
                  <dd>The saved dial.</dd>
                </div>
                <div>
                  <dt>Training</dt>
                  <dd>Practice that changes the dial.</dd>
                </div>
                <div>
                  <dt>Inference</dt>
                  <dd>Using the saved dial to make a guess.</dd>
                </div>
              </dl>
              <p>
                The model is the calculation with its stored dial. In bigger models, many stored
                numbers work together.
              </p>
            </div>
          )}
        </section>
      )}
      {mode === 'math' && (
        <section className="panel first-math">
          <h2>Put numbers on the action you just saw.</h2>
          <p>
            The model is ŷ = wx. Here x = 2, the target y = 4, and w is the saved dial. ŷ means “the
            guess,” not the supplied answer.
          </p>
          <ol>
            <li>
              <strong>Guess:</strong> ŷ = {number(dial)} × 2 = {number(current.guess)}.
            </li>
            <li>
              <strong>Error:</strong> e = ŷ − y = {number(current.error)}. Its sign tells us above
              or below.
            </li>
            <li>
              <strong>Loss:</strong> L = e² / 2 = {number(current.loss)}. Squaring makes either kind
              of miss count.
            </li>
            <li>
              <strong>Sensitivity:</strong> dL/dw = (dL/de)(de/dŷ)(dŷ/dw) = e × 1 × x ={' '}
              {number(current.gradient)}.
            </li>
            <li>
              <strong>Update:</strong> w′ = w − 0.1 × dL/dw = {number(current.nextDial)}.
            </li>
          </ol>
          <p>
            The derivative measures how loss responds to a tiny dial change. The next chapters let
            you feel that slope and follow it backward through several operations.
          </p>
          <button className="button primary" onClick={train}>
            Calculate this practice step
          </button>
          {stage < 2 && (
            <p>Returning to the opening visual steps resets the dial to 1 for that exercise.</p>
          )}
          <p>
            For this single example, d²L/dw² = x² = 4. The chosen rate 0.1 makes the distance from w
            = 2 shrink by a factor of 0.6 each step. This fact belongs to this small model and
            objective.
          </p>
          <details>
            <summary>Who decided what the program should learn?</summary>
            <p>
              We supplied the example, the model ŷ = wx, the loss, and the update rule. We did not
              insert “set w = 2” into the training code. Training computes a value that fits the
              supplied target. The family ŷ = wx is itself an assumption: one observed pair does not
              prove it is the world's rule.
            </p>
          </details>
        </section>
      )}
      {mode === 'code' && (
        <CodeWalkthrough
          title="The whole practice loop, in ordinary instructions"
          code={code}
          steps={[
            {
              label: 'Separate a question from its answer',
              explanation:
                'The example supplies input 2 and target 4. A target is used while practicing; predicting a new input does not require its answer.',
              lines: code
                .split('\n')
                .flatMap((line, i) => (line.includes('export const lesson') ? [i + 1] : [])),
            },
            {
              label: 'Prediction reads a dial',
              explanation:
                'Multiplication uses the stored number. Calling predict does not assign a new dial. A request to make a guess is different from an instruction to train.',
              lines: code
                .split('\n')
                .flatMap((line, i) => (line.includes('return dial * input') ? [i + 1] : [])),
            },
            {
              label: 'Practice computes a replacement',
              explanation:
                'Error, loss, and derivative are explicit arithmetic. nextDial is a computed proposal, not an answer secretly put into the code.',
              lines: code
                .split('\n')
                .flatMap((line, i) =>
                  /const (error|loss|gradient|nextDial)/.test(line) ? [i + 1] : [],
                ),
            },
            {
              label: 'The assignment is what persists',
              explanation:
                'The loop keeps the new dial for the next example. After the loop, predictions read that learned number. This distinction still matters in a very large network.',
              lines: code
                .split('\n')
                .flatMap((line, i) =>
                  line.includes('dial = receipt.nextDial') || line.includes('predict(dial, 4)')
                    ? [i + 1]
                    : [],
                ),
            },
          ]}
        />
      )}
      <details className="first-boundary">
        <summary>Where this story ends</summary>
        <p>
          Pip is an illustration, not a person inside the computer. This first model can only
          multiply one input by one number. It cannot choose the watering task, invent the targets,
          or handle every plant. Later lessons investigate many weights, learned features, uncertain
          predictions, and real architecture diagrams.
        </p>
      </details>
    </div>
  );
}
