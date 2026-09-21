import { useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import BeforeTraining from './BeforeTraining';
import { CodeWalkthrough, ModeSwitcher, type LearningMode } from './LearningModes';
import code from '../../examples/predict-before-training.mjs?raw';
import { curvedRule, straightRule } from '../lib/theory';

export default function PredictionJourney() {
  const [mode, setMode] = useState<LearningMode>('visual');
  const [guess, setGuess] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [extra, setExtra] = useState(false);
  const [probe, setProbe] = useState(3);
  return (
    <div className="prediction-journey">
      <header className="lesson-heading">
        <p className="eyebrow">
          EXPERIMENT 08 <span> / </span> THE MISSING CLUE
        </p>
        <h1>
          Can you predict <em>the hidden rule?</em>
        </h1>
        <p>
          You find a machine with its rule covered up. You can see three old questions and answers.
          Your job: guess its answer to a new question, then find out whether those clues were
          enough to know.
        </p>
      </header>
      <ModeSwitcher value={mode} onChange={setMode} />
      {mode === 'visual' && (
        <>
          <section className="guide-card">
            <span className="guide-kicker">{revealed ? 'THE REVEAL' : 'YOUR CLUES'}</span>
            <h2>
              {revealed
                ? 'Two possible rules. Exactly the same clues.'
                : 'A mystery machine showed you three answers.'}
            </h2>
            <div className="mystery-cards">
              {[0, 1, 2].map((x) => (
                <div key={x}>
                  <span>INPUT</span>
                  <strong>{x}</strong>
                  <ArrowRight size={20} />
                  <span>ANSWER</span>
                  <strong>{x}</strong>
                </div>
              ))}
              {extra && (
                <div className="new-clue">
                  <span>NEW INPUT</span>
                  <strong>3</strong>
                  <ArrowRight size={20} />
                  <span>ANSWER</span>
                  <strong>7.5</strong>
                </div>
              )}
            </div>
            {!revealed ? (
              <div className="guide-prompt">
                <p>
                  What would you predict for input <strong>3</strong>?
                </p>
                <div>
                  {[3, 7.5].map((value) => (
                    <button
                      className="button"
                      key={value}
                      aria-pressed={guess === value}
                      onClick={() => setGuess(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <p className="guide-feedback" aria-live="polite">
                  {guess === null
                    ? 'Take a guess. You do not need a formula yet.'
                    : `You guessed ${guess}. Keep that prediction in mind.`}
                </p>
                <button
                  className="button primary"
                  disabled={guess === null}
                  onClick={() => setRevealed(true)}
                >
                  Open the two possible worlds
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <>
                <div className="possible-worlds">
                  <div>
                    <span className="pill">WORLD A</span>
                    <h3>Return the input.</h3>
                    <p>
                      Every clue fits. At input 3, answer <strong>3</strong>.
                    </p>
                    <div className="world-result">{straightRule(probe).toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="pill">WORLD B</span>
                    <h3>Add a curve that passes through the clues.</h3>
                    <p>
                      Every clue fits. At input 3, answer <strong>7.5</strong>.
                    </p>
                    <div className="world-result">{curvedRule(probe).toFixed(2)}</div>
                  </div>
                </div>
                <label className="mystery-probe" htmlFor="mystery-probe">
                  Try another input: <strong>{probe.toFixed(2)}</strong>
                  <input
                    id="mystery-probe"
                    type="range"
                    min="0"
                    max="3"
                    step="0.05"
                    value={probe}
                    onChange={(e) => setProbe(+e.target.value)}
                  />
                </label>
                <div className="guide-narration">
                  <span className="guide-number">!</span>
                  <div>
                    <h3>
                      {extra
                        ? 'A new observation can rule out an explanation.'
                        : 'A perfect fit did not choose the world.'}
                    </h3>
                    <p>
                      {extra
                        ? 'Suppose a new measurement really gives 3 → 7.5. That rules out A. It supports B, but other rules could still fit all four observations. We keep testing.'
                        : `Your prediction ${guess} was compatible with one of these worlds. The three clues alone cannot choose between them. Extra computing power cannot tell us which unseen fact is true.`}
                    </p>
                  </div>
                </div>
                <div className="guide-controls">
                  <button
                    className="button"
                    onClick={() => {
                      setGuess(null);
                      setRevealed(false);
                      setExtra(false);
                      setProbe(3);
                    }}
                  >
                    <RotateCcw size={16} />
                    Play again
                  </button>
                  <button className="button primary" onClick={() => setExtra(!extra)}>
                    {extra ? 'Remove the new clue' : 'Imagine measuring one more example'}
                  </button>
                </div>
              </>
            )}
          </section>
          <div className="guide-next-question">
            <h3>Does that mean we cannot calculate anything beforehand?</h3>
            <p>
              We can calculate a lot: parameter counts, the next gradient step, and sometimes an
              entire training path. We can also bound errors under stated assumptions. Open Follow
              the math to calculate a complete training run before running it.
            </p>
            <button className="button" onClick={() => setMode('math')}>
              Show an exactly predictable training run
              <ArrowRight size={16} />
            </button>
          </div>
        </>
      )}
      {mode === 'math' && (
        <div className="embedded-lesson">
          <BeforeTraining />
        </div>
      )}
      {mode === 'code' && (
        <CodeWalkthrough
          title="Forecast the updates. Then test two possible worlds."
          code={code}
          steps={[
            {
              label: 'Solve a special case before running it',
              explanation:
                'For half squared error around 3, every step multiplies the distance to 3 by (1 − rate). Repeating that multiplication gives the forecast.',
              lines: code
                .split('\n')
                .flatMap((line, i) =>
                  line.includes('forecast') || line.includes('const target') ? [i + 1] : [],
                ),
            },
            {
              label: 'Run the loop independently',
              explanation:
                'Now actually execute gradient descent. Its final weight agrees with the forecast up to floating-point rounding.',
              lines: code
                .split('\n')
                .flatMap((line, i) =>
                  line.includes('weight') || line.includes('gradient') ? [i + 1] : [],
                ),
            },
            {
              label: 'Check why unseen performance needs assumptions',
              explanation:
                'Both explicit rules match all three given pairs. They disagree at 3. This is an information gap, not just a slow-computer problem.',
              lines: code
                .split('\n')
                .flatMap((line, i) =>
                  line.includes('ruleA') || line.includes('ruleB') || line.includes('input:')
                    ? [i + 1]
                    : [],
                ),
            },
          ]}
        />
      )}
    </div>
  );
}
