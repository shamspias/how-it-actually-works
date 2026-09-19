import { useState } from 'react';
import {
  AMBIGUITY_INPUTS,
  curvedRule as ruleB,
  finiteClassErrorBound,
  predictQuadraticWeight,
  quadraticTrajectory,
  straightRule as ruleA,
} from '../lib/theory';
import './theory.css';

const display = (value: number) => (Math.abs(value) < 0.00005 ? '0.0000' : value.toFixed(4));

export default function BeforeTraining() {
  const [rate, setRate] = useState(0.35);
  const [steps, setSteps] = useState(8);
  const [probe, setProbe] = useState(2.7);
  const [answer, setAnswer] = useState<number | null>(null);
  const [sampleCount, setSampleCount] = useState(1000);
  const weights = quadraticTrajectory(0, 3, rate, steps);
  const predicted = predictQuadraticWeight(0, 3, rate, steps);
  const actual = weights[steps];
  const low = Math.min(-0.5, ...weights) - 0.4;
  const high = Math.max(3.8, ...weights) + 0.4;
  const plotX = (step: number) => 42 + (step / Math.max(steps, 1)) * 478;
  const plotY = (w: number) => 186 - ((w - low) / (high - low)) * 150;
  const ambX = (x: number) => 40 + (x / 3) * 475;
  const ambY = (y: number) => 203 - (y / 8) * 168;
  const pathFor = (fn: (x: number) => number) =>
    Array.from({ length: 101 }, (_, i) => {
      const x = (i * 3) / 100;
      return `${i ? 'L' : 'M'}${ambX(x)},${ambY(fn(x))}`;
    }).join(' ');
  const observed = AMBIGUITY_INPUTS.some((x) => Math.abs(probe - x) < 0.001);
  const gap = finiteClassErrorBound(100, sampleCount, 0.05);
  const behavior =
    rate === 0
      ? 'No step, no learning: the weight stays at zero.'
      : rate < 1
        ? 'Each step closes part of the remaining gap.'
        : rate === 1
          ? 'For this particular bowl, one step reaches the best weight exactly.'
          : rate < 2
            ? 'It overshoots, but the jumps shrink. The weight still approaches 3.'
            : rate === 2
              ? 'It bounces between 0 and 6 forever. The error does not shrink.'
              : 'The jumps grow. This learning rate is too large for this loss.';

  return (
    <div className="theory-lesson">
      <header className="lesson-heading">
        <p className="eyebrow">
          EXPERIMENT 08 <span> / </span> THE PREDICTION PUZZLE
        </p>
        <h1>
          Can we know <em>before we train?</em>
        </h1>
        <p>
          Sometimes, exactly. But knowing where a weight will land and knowing how well it will
          handle the world are two different questions.
        </p>
      </header>

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Experiment 01</span>
            <h3>Predict the future of one weight.</h3>
          </div>
          <span className="pill">An exact answer exists</span>
        </div>
        <p>
          Our model always guesses <strong>w</strong>. The only training answer is{' '}
          <strong>3</strong>. Start at zero and pull the guess toward 3. Change the step size and
          see whether our shortcut matches every update.
        </p>
        <div className="lesson-grid theory-two-col">
          <div>
            <svg
              viewBox="0 0 560 228"
              className="theory-chart"
              role="img"
              aria-label={`Weight over ${steps} training steps. Final weight ${display(actual)}; target weight 3.`}
            >
              {[0, 3].map((value) => (
                <g key={value}>
                  <line
                    x1="42"
                    x2="526"
                    y1={plotY(value)}
                    y2={plotY(value)}
                    className={value === 3 ? 'theory-target' : 'theory-gridline'}
                  />
                  <text x="30" y={plotY(value) + 4} textAnchor="end">
                    {value}
                  </text>
                </g>
              ))}
              <text x="43" y="17">
                weight
              </text>
              <text x="522" y="219" textAnchor="end">
                training steps →
              </text>
              <polyline
                points={weights.map((w, i) => `${plotX(i)},${plotY(w)}`).join(' ')}
                className="theory-line purple"
              />
              {weights.map((w, i) => (
                <circle
                  key={i}
                  cx={plotX(i)}
                  cy={plotY(w)}
                  r={i === steps ? 6 : 3.5}
                  className="theory-point"
                />
              ))}
              <text x="42" y="207" textAnchor="middle">
                0
              </text>
              {steps > 0 && (
                <text x="520" y="207" textAnchor="middle">
                  {steps}
                </text>
              )}
            </svg>
            <p className="theory-caption">
              <span className="theory-key purple" /> Weight after each update{' '}
              <span className="theory-key dashed" /> Best weight: 3
            </p>
          </div>
          <div className="theory-controls">
            <label className="control-group" htmlFor="future-rate">
              <span>
                Learning rate <strong>{rate.toFixed(2)}</strong>
              </span>
              <input
                id="future-rate"
                type="range"
                min="0"
                max="2.2"
                step="0.05"
                value={rate}
                onChange={(event) => setRate(Number(event.target.value))}
              />
              <small>Try 0.35, 1.00, and 2.10.</small>
            </label>
            <label className="control-group" htmlFor="future-steps">
              <span>
                Training steps <strong>{steps}</strong>
              </span>
              <input
                id="future-steps"
                type="range"
                min="0"
                max="16"
                step="1"
                value={steps}
                onChange={(event) => setSteps(Number(event.target.value))}
              />
            </label>
            <div className="stat-grid theory-stats" aria-live="polite">
              <div className="stat">
                <span>Formula predicts</span>
                <strong>{display(predicted)}</strong>
              </div>
              <div className="stat">
                <span>Updates produce</span>
                <strong>{display(actual)}</strong>
              </div>
            </div>
            <p className="insight">{behavior}</p>
          </div>
        </div>
        <details className="theory-details">
          <summary>Show the calculation I can do on paper</summary>
          <p>
            The loss is half the squared mistake. Its slope tells us how the loss changes when we
            nudge the weight.
          </p>
          <div className="formula">
            L(w) = ½(w − 3)²
            <br />
            slope = dL/dw = w − 3<br />
            wₜ₊₁ = wₜ − η(wₜ − 3)
          </div>
          <p>
            Subtract 3 on both sides: each update multiplies the distance from 3 by{' '}
            <strong>(1 − η)</strong>. Repeating that n times gives the shortcut below. η (eta) means
            learning rate; w₀ = 0.
          </p>
          <div className="formula">
            wₙ = 3 + (w₀ − 3)(1 − η)ⁿ
            <br />w{subscript(steps)} = 3 − 3 × (1 − {rate.toFixed(2)})<sup>{steps}</sup> ={' '}
            {display(predicted)}
          </div>
          <p>
            Here convergence requires |1 − η| &lt; 1, or 0 &lt; η &lt; 2. This limit belongs to this
            loss, not every network. The formula is exact in real arithmetic; computers may round
            the last digits.
          </p>
        </details>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Experiment 02</span>
            <h3>Same evidence. Different futures.</h3>
          </div>
          <span className="pill">The missing information</span>
        </div>
        <p>
          You have seen just three examples: <strong>0 → 0, 1 → 1, 2 → 2</strong>. Both of these
          rules get every example right. Move the probe between and beyond the dots.
        </p>
        <div className="lesson-grid theory-two-col">
          <div>
            <svg
              viewBox="0 0 560 245"
              className="theory-chart"
              role="img"
              aria-label={`Two rules agree at training inputs 0, 1, and 2. At x ${probe.toFixed(2)}, rule A predicts ${ruleA(probe).toFixed(2)}, rule B predicts ${ruleB(probe).toFixed(2)}.`}
            >
              {[0, 2, 4, 6, 8].map((tick) => (
                <g key={tick}>
                  <line
                    x1="40"
                    x2="520"
                    y1={ambY(tick)}
                    y2={ambY(tick)}
                    className="theory-gridline"
                  />
                  <text x="28" y={ambY(tick) + 4} textAnchor="end">
                    {tick}
                  </text>
                </g>
              ))}
              <text x="40" y="19">
                answer y
              </text>
              <path d={pathFor(ruleA)} className="theory-line purple" />
              <path d={pathFor(ruleB)} className="theory-line green" strokeDasharray="8 5" />
              <line x1={ambX(probe)} x2={ambX(probe)} y1="30" y2="204" className="theory-probe" />
              {AMBIGUITY_INPUTS.map((x) => (
                <g key={x}>
                  <circle
                    cx={ambX(x)}
                    cy={ambY(x)}
                    r="6"
                    fill="#253b36"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text x={ambX(x)} y="224" textAnchor="middle">
                    {x}
                  </text>
                </g>
              ))}
              <text x={ambX(3)} y="224" textAnchor="middle">
                3
              </text>
              <circle cx={ambX(probe)} cy={ambY(ruleA(probe))} r="6" className="theory-point" />
              <circle
                cx={ambX(probe)}
                cy={ambY(ruleB(probe))}
                r="6"
                fill="#39735b"
                stroke="white"
                strokeWidth="2"
              />
              <text x="520" y="242" textAnchor="end">
                input x →
              </text>
            </svg>
            <p className="theory-caption">
              <span className="theory-key purple" /> Rule A: straight{' '}
              <span className="theory-key green dashed" /> Rule B: curved{' '}
              <span className="theory-dot" /> Seen examples
            </p>
          </div>
          <div className="theory-controls">
            <label className="control-group" htmlFor="unseen-probe">
              <span>
                Try an input <strong>{probe.toFixed(2)}</strong>
              </span>
              <input
                id="unseen-probe"
                type="range"
                min="0"
                max="3"
                step="0.05"
                value={probe}
                onChange={(event) => setProbe(Number(event.target.value))}
              />
              <small>
                {observed
                  ? 'This is a training example. Both rules agree.'
                  : 'This input was never shown during training.'}
              </small>
            </label>
            <div className="stat-grid theory-stats" aria-live="polite">
              <div className="stat">
                <span>Rule A says</span>
                <strong>{ruleA(probe).toFixed(2)}</strong>
              </div>
              <div className="stat">
                <span>Rule B says</span>
                <strong>{ruleB(probe).toFixed(2)}</strong>
              </div>
            </div>
            <p className="insight">
              The examples alone cannot tell us which rule the world follows. More data and
              assumptions help. A preference for simple rules is also an assumption.
            </p>
          </div>
        </div>
        <details className="theory-details">
          <summary>Why this is a mathematical counterexample</summary>
          <div className="formula">
            A(x) = x<br />
            B(x) = x + 0.75x(x − 1)(x − 2)
          </div>
          <p>
            At x = 0, 1, or 2, one factor in the extra term is zero. So both rules fit perfectly. At
            x = 3, A gives 3 and B gives 7.5. A method given only those three examples cannot know
            which of these two possible worlds it lives in. This example compares explicit rules; it
            does not train two neural networks.
          </p>
        </details>
      </section>

      <section className="panel theory-planning">
        <h3>What can we calculate ahead of time?</h3>
        <div className="theory-three-cards">
          <div>
            <span className="theory-number">01</span>
            <h4>Exact mechanics</h4>
            <p>
              Parameter count, weight storage, and some simple training paths. Fix data order,
              initialization, and arithmetic to specify an update sequence.
            </p>
          </div>
          <div>
            <span className="theory-number">02</span>
            <h4>Conditional guarantees</h4>
            <p>
              Mathematics can bound errors under stated assumptions. A bound is a range with
              conditions, not a promise of a particular score.
            </p>
          </div>
          <div>
            <span className="theory-number">03</span>
            <h4>Measured forecasts</h4>
            <p>
              Small pilot runs and empirical scaling laws can estimate larger runs. A changed
              dataset or task can break the forecast.
            </p>
          </div>
        </div>
        <details className="theory-details">
          <summary>Try a real guarantee—with its assumptions visible</summary>
          <p>
            Suppose we choose among exactly <strong>100 fixed candidate classifiers</strong>,
            specified before seeing the data. Each makes a right/wrong prediction. Training examples
            are independent draws from the same distribution we will face later.
          </p>
          <label className="control-group" htmlFor="bound-samples">
            <span>
              Independent training examples <strong>{sampleCount.toLocaleString()}</strong>
            </span>
            <input
              id="bound-samples"
              type="range"
              min="100"
              max="10000"
              step="100"
              value={sampleCount}
              onChange={(event) => setSampleCount(Number(event.target.value))}
            />
          </label>
          <div className="formula">
            ε = √(ln(2 × 100 / 0.05) / (2 × {sampleCount})) = {gap.toFixed(4)}
          </div>
          <p aria-live="polite">
            With at least 95% probability over the random dataset, every candidate's true error
            differs from its training error by at most{' '}
            <strong>{(gap * 100).toFixed(1)} percentage points</strong>. This also covers a
            candidate selected using that dataset.
          </p>
          <p>
            This is the finite-class Hoeffding + union bound. It does not tell us the training error
            before training. A continuously parameterized network is not a set of just 100 fixed
            candidates; other capacity bounds are needed, and they can be loose. The
            same-distribution and independence assumptions matter.
          </p>
        </details>
        <p className="muted theory-bottom-note">
          We know the update rules. For large networks, computing the outcome can require doing the
          training. Understanding the resulting internal features is a separate research problem.
          Evaluation supplies evidence on sampled data, not proof of every future behavior.
        </p>
      </section>

      <section className="quiz theory-quiz" aria-labelledby="prediction-quiz">
        <span className="eyebrow">Make it stick</span>
        <h3 id="prediction-quiz">A model gets every training example right. What follows?</h3>
        <div className="theory-quiz-options">
          {[
            'It must get every new example right.',
            'It fits what it saw; new examples still need checking.',
          ].map((label, index) => (
            <button
              key={label}
              type="button"
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
              ? 'Exactly. Both rules above fit perfectly, yet they disagree on unseen inputs.'
              : 'Look at the two rules above: both have zero training error, but their new predictions disagree.'}
          </p>
        )}
      </section>
    </div>
  );
}

function subscript(value: number) {
  return String(value)
    .split('')
    .map((digit) => '₀₁₂₃₄₅₆₇₈₉'[Number(digit)])
    .join('');
}
