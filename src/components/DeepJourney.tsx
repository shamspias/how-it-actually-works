import { useMemo, useState } from 'react';
import { ArrowDown, ArrowRight, Package, RotateCcw } from 'lucide-react';
import {
  collapseLinear,
  explainDeep,
  makeDeepNetwork,
  trainDeep,
  type DeepActivation,
} from '../lib/deep';
import source from '../../examples/deep-network.mjs?raw';
import { CodeWalkthrough, ModeSwitcher, type LearningMode } from './LearningModes';
import './deep.css';

const number = (value: number) =>
  Math.abs(value) < 0.00001 && value !== 0
    ? value.toExponential(2)
    : Number(value.toFixed(6)).toString();
const codeLines = (...parts: string[]) =>
  source
    .split('\n')
    .flatMap((line, i) => (parts.some((part) => line.includes(part)) ? [i + 1] : []));

export default function DeepJourney() {
  const [mode, setMode] = useState<LearningMode>('visual');
  const [stage, setStage] = useState(0);
  const [model, setModel] = useState(() => makeDeepNetwork());
  const [choice, setChoice] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReturnType<typeof trainDeep> | null>(null);
  const [rate, setRate] = useState(0.1);
  const [probe, setProbe] = useState(1);
  const [gateOn, setGateOn] = useState(false);
  const [mathChanged, setMathChanged] = useState(false);
  const trace = useMemo(() => explainDeep(model, probe, 1), [model, probe]);
  const plain = explainDeep({ ...model, residual: false }, probe, 1);
  const visibleStations = stage === 0 ? 0 : stage === 1 ? 1 : model.layers.length;

  function reset() {
    setStage(0);
    setModel(makeDeepNetwork());
    setChoice(null);
    setReceipt(null);
    setProbe(1);
    setRate(0.1);
    setGateOn(false);
    setMathChanged(false);
  }
  function advance() {
    setStage(stage + 1);
    setChoice(null);
  }
  function rebuild(
    depth = model.layers.length,
    activation = model.activation,
    residual = model.residual,
    weight = model.layers[0].weight,
  ) {
    setModel(makeDeepNetwork(depth, activation, residual, weight));
    setReceipt(null);
    setChoice(null);
    if (mode === 'math') setMathChanged(true);
  }
  function update() {
    const step = trainDeep(model, [{ input: probe, target: 1 }], rate);
    setReceipt(step);
    setModel(step.model);
    if (mode === 'math') setMathChanged(true);
  }

  const titles = [
    'Pass one number through two stations.',
    'Station 1 changes the parcel’s number.',
    'Station 2 uses station 1’s answer.',
    'Now compare the guess with the answer.',
    'Trace how each dial affects the miss.',
    'The dials changed. That is the learning step.',
    'Eight stations can make an early nudge fade.',
    'A bypass adds another route.',
    'Why do stations need a gate?',
    'A deep network repeats these same operations.',
  ];
  const descriptions = [
    'A parcel carries a number, not a secret thought. Each station has an adjustable multiplier, called a weight, and an added offset, called a bias. Start with the number 1.',
    'Multiply 1 by 0.5, then add 0. That makes 0.5. The ReLU gate keeps positive numbers and replaces negative numbers with 0. So this parcel leaves with 0.5.',
    'Multiply the new number 0.5 by another 0.5, then add 0. The gate keeps 0.25. Two layers means two stations in a row. The last parcel is our guess.',
    'The guess is 0.25; this practice example’s answer is 1. The error is −0.75. Squaring it and dividing by 2 gives a loss of 0.28125. Loss is a score for this miss: smaller is better.',
    'If station 1’s output changes a tiny amount, station 2 passes on half that change. Work backward through these local effects. The first weight’s gradient is −0.375: a tiny increase in that weight would lower this example’s loss, locally.',
    receipt
      ? `Both weights moved from 0.5 to ${number(receipt.model.layers[0].weight)}. Each bias got its own update too. The same input now produces ${number(receipt.after[0].prediction)}, and the loss is ${number(receipt.afterLoss)}. This is what changed inside the program: its saved numbers.`
      : 'Training saves new weights and biases. A forward pass then uses those new numbers.',
    'Each station passes on half a tiny input change. Half of a half of a half keeps shrinking. Across eight stations, the final change is only 1/256 as large. Early weights can receive very small gradients for the same reason.',
    'A residual connection carries the incoming number straight around a station and adds the station’s change. This lesson scales that change by ¼. Its local derivative is now 1 + ¼ × 0.5 = 1.125. The direct route helps a change get through, but repeated 1.125 factors can also grow. A bypass is not a guarantee of easy training.',
    'Two multiply-and-add stations alone still make one straight rule. A nonlinear gate can add a bend. Try the buttons below: the negative input is what reveals the difference.',
    'More layers repeat mixing, gates, and sometimes extra routes. Forward passes compute useful intermediate numbers. Backpropagation measures how parameters affect the loss. An optimizer changes those parameters. Many practice examples can shape intermediate numbers that help with the task; whether they help on new examples must be tested.',
  ];

  const controls = (
    <div className="deep-controls">
      <label>
        Stations (depth)
        <select
          value={model.layers.length}
          onChange={(event) => rebuild(Number(event.target.value))}
        >
          {[2, 4, 8].map((depth) => (
            <option key={depth} value={depth}>
              {depth} stations
            </option>
          ))}
        </select>
      </label>
      <label>
        Gate (activation)
        <select
          value={model.activation}
          onChange={(event) => rebuild(model.layers.length, event.target.value as DeepActivation)}
        >
          <option value="relu">ReLU: zero negative totals</option>
          <option value="tanh">tanh: squash into −1 to 1</option>
          <option value="linear">No gate: keep the total</option>
        </select>
      </label>
      <label>
        Starting multiplier
        <select
          value={
            model.layers[0].weight === 0.5 || model.layers[0].weight === 1.5
              ? model.layers[0].weight
              : 'trained'
          }
          onChange={(event) =>
            rebuild(
              model.layers.length,
              model.activation,
              model.residual,
              Number(event.target.value),
            )
          }
        >
          <option value={0.5}>0.5: try shrinking</option>
          <option value={1.5}>1.5: try growing</option>
          {model.layers[0].weight !== 0.5 && model.layers[0].weight !== 1.5 && (
            <option value="trained" disabled>
              Changed by training
            </option>
          )}
        </select>
      </label>
      <label>
        Bypass
        <select
          value={String(model.residual)}
          onChange={(event) =>
            rebuild(model.layers.length, model.activation, event.target.value === 'true')
          }
        >
          <option value="false">Off: through each station</option>
          <option value="true">On: input + ¼ × station</option>
        </select>
      </label>
      <label>
        Input number
        <select
          value={probe}
          onChange={(event) => {
            setProbe(Number(event.target.value));
            setReceipt(null);
            if (mode === 'math') setMathChanged(true);
          }}
        >
          {[-1, 0, 1].map((value) => (
            <option value={value} key={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <label>
        Learning rate
        <select
          value={rate}
          onChange={(event) => {
            setRate(Number(event.target.value));
            if (mode === 'math') setMathChanged(true);
          }}
        >
          {[0.001, 0.01, 0.1].map((value) => (
            <option value={value} key={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
    </div>
  );

  const chain = (revealAll = false) => (
    <div className="deep-parcel-route" aria-label="Computed station values">
      <div className="deep-input">
        <Package size={24} aria-hidden="true" />
        <span>Input parcel</span>
        <strong>{probe}</strong>
      </div>
      <ol className="deep-stations">
        {trace.layers.map((layer, i) => {
          const revealed = revealAll || i < visibleStations;
          return (
            <li
              key={`${stage}-${i}`}
              className={`${revealed ? 'deep-station revealed' : 'deep-station'} ${!revealAll && (stage === 6 || stage === 7) ? 'deep-station-compact' : ''}`}
            >
              <span className="deep-station-name">STATION {i + 1}</span>
              <p>
                {revealed
                  ? `${number(layer.input)} × ${number(model.layers[i].weight)} + ${number(model.layers[i].bias)}`
                  : 'Waiting for its parcel'}
              </p>
              <div className="deep-gate">
                {model.activation === 'relu'
                  ? 'ReLU: keep positives'
                  : model.activation === 'tanh'
                    ? 'tanh: squash the total'
                    : 'No gate: keep the total'}
              </div>
              {model.residual && (
                <span className="deep-bypass">+ input via bypass · branch × ¼</span>
              )}
              <strong data-testid={`deep-station-${i + 1}`}>
                {revealed ? number(layer.output) : '?'}
              </strong>
              {(stage === 4 || stage >= 6 || revealAll) && (
                <div className="deep-local-effect">
                  Tiny input change × <b>{number(layer.localDerivative)}</b>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {(stage >= 3 || revealAll) && (
        <div className="deep-answer">
          <span>Guess / target</span>
          <strong>{number(trace.prediction)} / 1</strong>
          <span>
            Loss <b data-testid="deep-loss">{number(trace.loss)}</b>
          </span>
        </div>
      )}
    </div>
  );

  const pathProduct = (
    <div className="deep-path-receipt">
      <span>How much of a tiny input change reaches the guess?</span>
      <p>
        {trace.layers.map((layer) => number(layer.localDerivative)).join(' × ')}{' '}
        <b>
          = <output data-testid="deep-input-sensitivity">{number(trace.inputSensitivity)}</output>
        </b>
      </p>
      <small>
        This is d(guess)/d(input), not the error and not a weight gradient. A derivative describes a
        tiny local change; crossing a gate can change it.
      </small>
    </div>
  );

  return (
    <div className="deep-journey">
      <header className="lesson-heading">
        <p className="eyebrow">
          BUILD A DEEP NETWORK <span> / </span> ONE STATION AT A TIME
        </p>
        <h1>
          Small stations. <em>A longer chain.</em>
        </h1>
        <p>You already changed a weight. Now follow the same calculation through more layers.</p>
      </header>
      <ModeSwitcher
        value={mode}
        onChange={(value) => {
          if (value === 'visual' && mathChanged && stage < 9) reset();
          setMode(value);
        }}
      />

      {mode === 'visual' && (
        <section className="guide-card deep-story" data-stage={stage}>
          <span className="guide-kicker">
            STOP {stage + 1} OF {titles.length}
          </span>
          <h2>{titles[stage]}</h2>
          <p className="deep-story-description">{descriptions[stage]}</p>
          {stage < 8 && chain()}
          {stage === 2 && (
            <div className="guide-prompt">
              <p>
                <strong>Did passing the parcel change any weights?</strong>
              </p>
              <div>
                <button className="button" onClick={() => setChoice('yes')}>
                  Yes, it saw an input
                </button>
                <button className="button" onClick={() => setChoice('no')}>
                  No, the dials stayed put
                </button>
              </div>
              <p className="guide-feedback" role="status">
                {choice === 'yes'
                  ? 'Look at the multipliers: both are still 0.5. Computing an answer alone does not train these weights. Try again.'
                  : choice === 'no'
                    ? 'Exactly. A forward pass calculates; an update changes saved parameters.'
                    : 'Check the 0.5 on each station.'}
              </p>
            </div>
          )}
          {stage === 3 && (
            <div className="deep-path-receipt">
              <span>Score this particular miss</span>
              <p>
                (0.25 − 1)² ÷ 2 = <b>0.28125</b>
              </p>
              <small>
                The training program supplies the target and this scoring rule. A station does not
                know what “correct” means.
              </small>
            </div>
          )}
          {stage === 4 && (
            <>
              <div className="deep-backward">
                <ArrowDown size={20} aria-hidden="true" />
                <p>
                  Loss effect −0.75 × last weight 0.5 × both open gates (1 × 1) × first input 1 ={' '}
                  <strong>−0.375</strong>
                </p>
              </div>
              <div className="guide-prompt">
                <p>
                  <strong>
                    Subtract 0.1 × (−0.375) from 0.5. Which way does the first weight move?
                  </strong>
                </p>
                <div>
                  <button className="button" onClick={() => setChoice('up')}>
                    Increase the weight
                  </button>
                  <button className="button" onClick={() => setChoice('down')}>
                    Decrease the weight
                  </button>
                </div>
                <p className="guide-feedback" role="status">
                  {choice === 'up'
                    ? 'Yes: 0.5 − (−0.0375) = 0.5375. Each weight and bias gets its own gradient.'
                    : choice === 'down'
                      ? 'Subtracting a negative number adds a little. Try increasing it.'
                      : 'A negative gradient means a tiny increase lowers this loss locally.'}
                </p>
              </div>
            </>
          )}
          {stage === 5 && receipt && (
            <div className="deep-update-receipt" role="status">
              <div>
                <span>Loss before the update</span>
                <strong>{number(receipt.beforeLoss)}</strong>
              </div>
              <ArrowRight aria-hidden="true" />
              <div>
                <span>Loss after the update</span>
                <strong>{number(receipt.afterLoss)}</strong>
              </div>
              <p>
                Only one practice example. This improvement does not establish performance on new
                inputs.
              </p>
            </div>
          )}
          {(stage === 6 || stage === 7) && pathProduct}
          {stage === 6 && (
            <div className="guide-prompt">
              <p>
                <strong>
                  Through eight × 0.5 stations, does a tiny early change shrink or grow?
                </strong>
              </p>
              <div>
                <button className="button" onClick={() => setChoice('shrink')}>
                  It shrinks
                </button>
                <button className="button" onClick={() => setChoice('grow')}>
                  It grows
                </button>
              </div>
              <p className="guide-feedback" role="status">
                {choice === 'shrink'
                  ? 'Yes. 0.5⁸ = 0.00390625. This is one way gradients can vanish: become very small, not necessarily exactly zero.'
                  : choice === 'grow'
                    ? 'Multiply 0.5 by 0.5: 0.25. Keep going; each factor makes it smaller. Try again.'
                    : 'Each station passes on half the previous change.'}
              </p>
            </div>
          )}
          {stage === 7 && (
            <p className="deep-caution">
              Without the bypass: {number(plain.inputSensitivity)}. With it:{' '}
              {number(trace.inputSensitivity)}. These are sensitivities, not accuracy scores. Larger
              is not automatically better.
            </p>
          )}
          {stage === 8 && (
            <div className="deep-gate-game">
              <div
                className="deep-choice-row"
                role="group"
                aria-label="Compare a straight chain and a gated chain"
              >
                <button className="button" aria-pressed={!gateOn} onClick={() => setGateOn(false)}>
                  Only multiply and add
                </button>
                <button
                  className="button"
                  aria-pressed={gateOn}
                  onClick={() => {
                    setGateOn(true);
                    setChoice('gate');
                  }}
                >
                  Add a ReLU gate
                </button>
              </div>
              <div className="deep-parcel-examples">
                {[-1, 0, 1].map((input) => (
                  <div key={input}>
                    <span>Input {input}</span>
                    <ArrowDown aria-hidden="true" size={18} />
                    <strong>
                      {number(
                        explainDeep(makeDeepNetwork(2, gateOn ? 'relu' : 'linear'), input)
                          .prediction,
                      )}
                    </strong>
                  </div>
                ))}
              </div>
              <svg
                viewBox="0 0 320 150"
                role="img"
                aria-label={
                  gateOn
                    ? 'A bent rule: negative inputs give zero, positive inputs grow.'
                    : 'One straight line: every output is one quarter of its input.'
                }
              >
                <line x1="35" y1="75" x2="295" y2="75" stroke="#858d7b" />
                <line x1="165" y1="20" x2="165" y2="128" stroke="#858d7b" />
                <path
                  d={gateOn ? 'M45 75 L165 75 L285 30' : 'M45 120 L165 75 L285 30'}
                  fill="none"
                  stroke="#755098"
                  strokeWidth="4"
                />
                <text x="38" y="143">
                  −1
                </text>
                <text x="158" y="143">
                  0
                </text>
                <text x="280" y="143">
                  1
                </text>
                <text x="230" y="99">
                  input →
                </text>
                <text x="15" y="15">
                  guess
                </text>
              </svg>
              <p role="status">
                {gateOn
                  ? 'The negative parcel now becomes 0. The bend cannot be replaced by one straight rule for every input.'
                  : 'Both stations collapse to the single rule guess = 0.25 × input. Extra straight stations do not add a bend. Try the gate.'}
              </p>
            </div>
          )}
          {stage === 9 && (
            <>
              <div className="deep-understanding">
                <strong>Tell it back in your own words</strong>
                <p>
                  “A deep network learns when training changes its saved multipliers and offsets.
                  Its layers compute intermediate numbers. Backpropagation follows local effects
                  backward to guide those changes.”
                </p>
                <p>
                  A real network carries many numbers in parallel. Our one-number chain makes one
                  path visible; it cannot do everything a wider network can do.
                </p>
              </div>
              <details className="deep-experiment">
                <summary>Try changing the depth, gates, and bypass yourself</summary>
                {controls}
                {chain(true)}
                {pathProduct}
                <button
                  className="button primary"
                  disabled={!Number.isFinite(trace.loss) || trace.loss > 1e12}
                  onClick={update}
                >
                  Train this chain once
                </button>
                {receipt && (
                  <p role="status">
                    Mean practice loss: {number(receipt.beforeLoss)} → {number(receipt.afterLoss)}.{' '}
                    {receipt.afterLoss < receipt.beforeLoss
                      ? 'This step helped this example.'
                      : 'This step did not improve it. Try a smaller rate or a different configuration.'}
                  </p>
                )}
                {trace.loss > 1e12 && (
                  <p>
                    That chain has grown too large for this sandbox. Choose a starting multiplier to
                    rebuild it.
                  </p>
                )}
                <p>
                  Changing depth, gate, multiplier, or bypass rebuilds the stations with the chosen
                  multiplier and zero biases. Input and learning-rate changes keep the weights.
                  Training uses the same old parameters for every gradient.
                </p>
              </details>
            </>
          )}
          <div className="guide-controls">
            <button className="button" onClick={reset}>
              <RotateCcw size={15} />
              Restart the parcel story
            </button>
            {stage === 0 && (
              <button className="button primary" onClick={advance}>
                Send through station 1<ArrowRight size={16} />
              </button>
            )}
            {stage === 1 && (
              <button className="button primary" onClick={advance}>
                Send through station 2<ArrowRight size={16} />
              </button>
            )}
            {stage === 2 && (
              <button className="button primary" disabled={choice !== 'no'} onClick={advance}>
                Measure the miss
                <ArrowRight size={16} />
              </button>
            )}
            {stage === 3 && (
              <button className="button primary" onClick={advance}>
                Trace the effects backward
                <ArrowRight size={16} />
              </button>
            )}
            {stage === 4 && (
              <button
                className="button primary"
                disabled={choice !== 'up'}
                onClick={() => {
                  update();
                  advance();
                }}
              >
                Update all the dials
                <ArrowRight size={16} />
              </button>
            )}
            {stage === 5 && (
              <button
                className="button primary"
                onClick={() => {
                  rebuild(8, 'relu', false, 0.5);
                  advance();
                }}
              >
                Try eight stations
                <ArrowRight size={16} />
              </button>
            )}
            {stage === 6 && (
              <button
                className="button primary"
                disabled={choice !== 'shrink'}
                onClick={() => {
                  rebuild(8, 'relu', true, 0.5);
                  advance();
                }}
              >
                Open a bypass
                <ArrowRight size={16} />
              </button>
            )}
            {stage === 7 && (
              <button className="button primary" onClick={advance}>
                Why also use a gate?
                <ArrowRight size={16} />
              </button>
            )}
            {stage === 8 && (
              <button className="button primary" disabled={choice !== 'gate'} onClick={advance}>
                Put the pieces together
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </section>
      )}

      {mode === 'math' && (
        <div className="deep-math">
          <section className="guide-card">
            <span className="guide-kicker">THE SAME STATIONS, WRITTEN AS CALCULUS</span>
            <h2>A local effect at every step.</h2>
            <p>
              A derivative means “how fast would this quantity change if I nudged that quantity a
              tiny amount?” Use the controls to recompute every number.
            </p>
            <p className="deep-caution">
              If you change this setup during the unfinished visual story, returning to Play &amp;
              see restarts that story with its original numbers.
            </p>
            {controls}
            {chain(true)}
            {pathProduct}
          </section>
          <section className="guide-card">
            <h2>Forward: compute and remember.</h2>
            <p>
              Let a₀ = x be the input. At layer ℓ, zℓ = wℓaℓ₋₁ + bℓ. The gate φ makes aℓ = φ(zℓ).
              Here φ can be identity, ReLU, or tanh. For ReLU, φ′(z) = 1 for z &gt; 0 and 0 for z
              &lt; 0; we choose 0 at the kink. For tanh, φ′(z) = 1 − tanh²(z).
            </p>
            <p>
              With our scaled residual route, aℓ = aℓ₋₁ + ¼φ(zℓ). The ¼ is an explicit teaching
              choice, not a requirement of residual networks. The local input derivative becomes 1 +
              ¼φ′(zℓ)wℓ.
            </p>
            <div className="deep-path-receipt">
              <p>ŷ = aₗ. L = ½(ŷ − y)². dL/dŷ = ŷ − y = {number(trace.error)}.</p>
            </div>
          </section>
          <section className="guide-card">
            <h2>Backward: multiply along a path; add across paths.</h2>
            <p>
              Call δℓ = ∂L/∂aℓ the sensitivity of loss to a layer’s output. Without a bypass: ∂L/∂wℓ
              = δℓφ′(zℓ)aℓ₋₁, ∂L/∂bℓ = δℓφ′(zℓ), and δℓ₋₁ = δℓφ′(zℓ)wℓ.
            </p>
            <p>
              With the bypass, parameter gradients get a factor ¼. The input receives two
              contributions, so δℓ₋₁ = δℓ[1 + ¼φ′(zℓ)wℓ]. These are chain-rule calculations, not
              requests made by a neuron.
            </p>
            <div
              className="deep-table-scroll"
              role="region"
              aria-label="Gradients through the current layers"
              tabIndex={0}
            >
              <table>
                <caption>Gradients from the current network, before any update</caption>
                <thead>
                  <tr>
                    <th>Station</th>
                    <th>∂L/∂output</th>
                    <th>∂L/∂weight</th>
                    <th>∂L/∂bias</th>
                  </tr>
                </thead>
                <tbody>
                  {trace.layers.map((layer, i) => (
                    <tr key={i}>
                      <th>{i + 1}</th>
                      <td>{number(layer.outputGradient)}</td>
                      <td>{number(layer.weightGradient)}</td>
                      <td>{number(layer.biasGradient)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Update all parameters together using these old-network gradients: θnew = θold − η∇L. η
              is the learning rate. A finite step can fail to lower loss even when its direction is
              locally downhill.
            </p>
            <button
              className="button primary"
              disabled={!Number.isFinite(trace.loss) || trace.loss > 1e12}
              onClick={update}
            >
              Calculate one deep update
            </button>
            {receipt && (
              <p role="status">
                Loss {number(receipt.beforeLoss)} → {number(receipt.afterLoss)}.
              </p>
            )}
          </section>
          <section className="guide-card">
            <h2>Why nonlinear gates, width, and initialization matter.</h2>
            <p>
              Without gates, w₂(w₁x + b₁) + b₂ = (w₂w₁)x + (w₂b₁ + b₂): one affine rule, meaning a
              straight rule with an offset. This remains true for arbitrarily many affine layers.
            </p>
            {model.activation === 'linear' && (
              <p className="deep-caution">
                Your current chain collapses to ŷ = {number(collapseLinear(model).slope)}x +{' '}
                {number(collapseLinear(model).intercept)}.
              </p>
            )}
            <p>
              In a wider network, a layer holds several numbers: zℓ = Wℓaℓ₋₁ + bℓ. W is a table of
              weights. Every input mixes into several outputs. Backpropagation uses Wᵀ to collect
              downstream effects, and adds contributions wherever paths meet. Reused parameters also
              receive the sum of their contributions.
            </p>
            <p>
              Several perfectly symmetric units can compute the same feature and receive the same
              updates. Different initial weights help them start differently. Their scale matters
              too: repeated derivatives can shrink or grow. Our identical weights make arithmetic
              easy; they are not an initialization recipe for a wide network.
            </p>
            <p>
              A mini-batch is a small group of examples used for one update. This example file
              computes each example’s gradients at the same weights, averages them, then updates.
              Examples can disagree; an average improvement does not mean every example improves.
            </p>
          </section>
        </div>
      )}

      {mode === 'code' && (
        <CodeWalkthrough
          title="A complete deep chain, without a learning library"
          code={source}
          steps={[
            {
              label: 'Save adjustable numbers',
              explanation:
                'Every station has a weight and a bias. Depth is the number of stations. The constructor is deterministic so that the opening arithmetic is easy to check.',
              lines: codeLines('makeDeepNetwork', 'layers: Array.from'),
            },
            {
              label: 'Move values forward',
              explanation:
                'Multiply, add, apply a gate, and optionally add a bypass. Save intermediate values; the backward pass needs them.',
              lines: codeLines(
                'const sum =',
                'const activated =',
                'gateDerivative',
                'value = (model.residual',
              ),
            },
            {
              label: 'Return sensitivities backward',
              explanation:
                'Start with the loss derivative. Walk through the saved stations in reverse order. A weight gradient also multiplies by the input that weight saw.',
              lines: codeLines(
                'let sensitivity =',
                'for (let i = layers.length',
                'branchGradient',
                'layer.weightGradient =',
                'layer.biasGradient =',
                'layer.inputGradient =',
              ),
            },
            {
              label: 'Average, then update together',
              explanation:
                'For one example, the mean is that example. For a batch, average each parameter’s gradient. Build new parameters from the old snapshot, never partly updated values.',
              lines: codeLines(
                'const before =',
                'const gradients =',
                'before.reduce',
                'const next =',
                'weight: layer.weight -',
                'bias: layer.bias -',
              ),
            },
            {
              label: 'Run a real training loop',
              explanation:
                'The executable demo trains on one pair, then shows shrinking and residual paths. Low practice loss alone is not evidence of success on unseen inputs.',
              lines: codeLines(
                'if (typeof process',
                'for (let i = 0; i < 80',
                'console.log(',
                'for (const residual',
              ),
            },
          ]}
        />
      )}
      <aside className="guide-next-question">
        <h3>What to carry into a large architecture</h3>
        <p>
          Ask what numbers each block receives, what operation it computes, what it saves, and how
          derivatives return. Big diagrams combine these operations. The operation names change; the
          chain rule still connects them.
        </p>
        <p>
          Background:{' '}
          <a
            href="https://www.deeplearningbook.org/contents/mlp.html"
            target="_blank"
            rel="noreferrer"
          >
            Deep Learning, chapter 6
          </a>
          ,{' '}
          <a
            href="https://www.deeplearningbook.org/contents/optimization.html"
            target="_blank"
            rel="noreferrer"
          >
            chapter 8
          </a>
          , and the{' '}
          <a href="https://arxiv.org/abs/1512.03385" target="_blank" rel="noreferrer">
            original residual-network paper
          </a>
          .
        </p>
      </aside>
    </div>
  );
}
