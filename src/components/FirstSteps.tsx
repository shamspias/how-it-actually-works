import { useState } from 'react';
import { ArrowLeft, ArrowRight, Minus, Plus, RotateCcw } from 'lucide-react';
import { practice, predict } from '../../examples/learning-loop.mjs';
import code from '../../examples/learning-loop.mjs?raw';
import { CodeWalkthrough, ModeSwitcher, type LearningMode } from './LearningModes';
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
  const shownInput = stage === 3 ? input : 2;
  const guess = predict(dial, shownInput);
  const current = practice(dial);
  function resetPractice() {
    setDial(1);
    setSteps(0);
    setReceipt(null);
  }
  function reset() {
    setStage(0);
    resetPractice();
    setChoice(null);
    setRevealed(false);
    setInput(4);
  }
  function move(next: number) {
    if (next <= 2 && next !== stage) resetPractice();
    setStage(next);
    setRevealed(false);
  }
  function changeMode(next: LearningMode) {
    if (next === 'visual' && stage < 2 && receipt) resetPractice();
    setMode(next);
  }
  function train() {
    const step = practice(dial);
    setReceipt(step);
    setDial(step.nextDial);
    setSteps(steps + 1);
  }
  const titles = [
    'Pip can multiply. Pip has not practiced yet.',
    'First, be the teacher yourself.',
    'Now the instructions move the dial.',
    'Hide the answer. Keep the dial.',
    'What did practice leave behind?',
  ];
  const stories = [
    `We want 2 drops of water for each seed. We show Pip 2 seeds and the answer: 4 drops. Its current dial is ${number(dial)}, so it guesses ${number(predict(dial, 2))} drops.`,
    'Your turn starts with the dial at 1. Turn it until 2 seeds give 4 drops. You are choosing the number here; Pip is not choosing it yet.',
    'This practice run starts with the dial reset to 1. Press Practice once. The program compares its guess with 4 and calculates a small change. Press again to repeat the same instructions.',
    'Asking a new question reads the saved dial. It does not turn it. Try different numbers of seeds and watch the dial stay still.',
    'After practice, the machine can reuse one changed number for different inputs. Choose what stayed in its memory.',
  ];
  return (
    <div className="first-steps">
      <header className="lesson-heading">
        <p className="eyebrow">START HERE / NO NEW WORDS YET</p>
        <h1>
          What does <em>“learning” change?</em>
        </h1>
        <p>
          Meet Pip, a pretend watering helper. Teach it one tiny job before we give anything a
          technical name.
        </p>
      </header>
      <ModeSwitcher value={mode} onChange={changeMode} />
      {mode === 'visual' && (
        <section className="first-card">
          <div className="first-card-top">
            <span className="eyebrow">SMALL STEP {stage + 1} OF 5</span>
            <button className="text-button" onClick={reset}>
              <RotateCcw size={15} /> Start again
            </button>
          </div>
          <h2>{titles[stage]}</h2>
          <p className="first-story" aria-live="polite">
            {stories[stage]}
          </p>
          {stage < 4 ? (
            <>
              <div
                className="pip-machine"
                aria-label={`${shownInput} seeds times dial ${number(dial)} gives ${number(guess)} drops`}
              >
                <div className="pip-input">
                  <span>WHAT GOES IN</span>
                  <div className="pip-seeds" aria-hidden="true">
                    {Array.from({ length: shownInput }, (_, i) => (
                      <i key={i} />
                    ))}
                  </div>
                  <strong>{shownInput} seeds</strong>
                </div>
                <ArrowRight className="pip-arrow" size={22} aria-hidden="true" />
                <div
                  className={`pip-robot ${receipt && stage === 2 ? 'pip-practicing' : ''}`}
                  key={steps}
                >
                  <div className="pip-face" aria-hidden="true">
                    <i />
                    <i />
                    <span />
                  </div>
                  <span>THE SAVED DIAL</span>
                  <strong data-testid="pip-dial">{number(dial)}</strong>
                  <small>multiply by this</small>
                </div>
                <ArrowRight className="pip-arrow" size={22} aria-hidden="true" />
                <div className="pip-output">
                  <span>PIP'S GUESS</span>
                  <div className="pip-glass" aria-hidden="true">
                    <i style={{ height: `${Math.min(100, (guess / 10) * 100)}%` }} />
                  </div>
                  <strong data-testid="pip-guess">{number(guess)} drops</strong>
                </div>
              </div>
              <div className="pip-equation">
                {shownInput} seeds × dial {number(dial)} = {number(guess)} drops
              </div>
            </>
          ) : (
            <div className="pip-remember">
              <div className="pip-face" aria-hidden="true">
                <i />
                <i />
                <span />
              </div>
              <strong>The saved dial: {number(dial)}</strong>
              <p>One number now affects every new guess.</p>
            </div>
          )}
          {stage === 0 && (
            <div className="first-answer">
              <span>THE TEACHER'S ANSWER</span>
              <strong>4 drops</strong>
              <p>Pip's guess and the supplied answer are different things.</p>
            </div>
          )}
          {stage === 1 && (
            <div className="first-action">
              <div>
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
              <p role="status">
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
              <button className="button primary" onClick={train} disabled={steps >= 12}>
                Practice once <ArrowRight size={17} />
              </button>
              <p role="status">
                {receipt
                  ? `Practice ${steps}: dial ${number(receipt.dial)} → ${number(receipt.nextDial)}. The new guess is ${number(guess)}; the supplied answer is still 4.`
                  : 'The target is 4. Nothing changes until an update runs.'}
              </p>
              {steps >= 3 && (
                <p className="first-win">
                  The gap is shrinking. It is the same comparison-and-change instruction each time.
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
                      : 'Choose an explanation. A wrong guess is useful evidence about what to revisit.'}
              </p>
              {choice === 'dial' && (
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
            </div>
          )}
          <div className="first-step-footer">
            <button className="button" disabled={stage === 0} onClick={() => move(stage - 1)}>
              <ArrowLeft size={16} /> Back one step
            </button>
            <span>{stage + 1} / 5</span>
            {stage < 4 && (
              <button
                className="button primary"
                disabled={(stage === 1 && dial !== 2) || (stage === 2 && steps === 0)}
                onClick={() => move(stage + 1)}
              >
                Next: {stops[stage + 1]} <ArrowRight size={16} />
              </button>
            )}
          </div>
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
