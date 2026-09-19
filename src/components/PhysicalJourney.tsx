import { useEffect, useState } from 'react';
import { ArrowRight, Cpu, Database, Pause, Play, RotateCcw, StepForward } from 'lucide-react';
import { CodeWalkthrough, ModeSwitcher, type LearningMode } from './LearningModes';
import './physical.css';

const SCALE = 16;
const RATE = 0.25;
const TARGET = 0.5;
const bitValues = [-8, 4, 2, 1, 0.5, 0.25, 0.125, 0.0625];
const stageNames = ['Read', 'Multiply', 'Measure loss', 'Find gradient', 'Write'];
const encode = (signed: number) => (signed + 256) % 256;
const decode = (word: number) => (word >= 128 ? word - 256 : word);
const bitString = (signed: number) => encode(signed).toString(2).padStart(8, '0');
const number = (value: number) => Number(value.toFixed(6)).toString();

export default function PhysicalJourney() {
  const [mode, setMode] = useState<LearningMode>('visual');
  const [startRaw, setStartRaw] = useState(24);
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [answer, setAnswer] = useState<number | null>(null);
  const weight = startRaw / SCALE;
  const prediction = weight * 1;
  const error = prediction - TARGET;
  const loss = 0.5 * error ** 2;
  const gradient = error * 1;
  const idealNext = weight - RATE * gradient;
  // Keep intermediates wider; quantize only when writing the 8-bit weight.
  // With x=1, target=0.5, and rate=0.25, all allowed starts stay in range.
  const nextRaw = Math.round(idealNext * SCALE);
  const nextWeight = nextRaw / SCALE;
  const memoryRaw = stage === 4 ? nextRaw : startRaw;
  const bits = bitString(startRaw);
  const nextBits = bitString(nextRaw);
  const nextLoss = 0.5 * (nextWeight - TARGET) ** 2;

  useEffect(() => {
    if (!playing || stage === 4) return;
    const timer = window.setTimeout(() => {
      setStage(stage + 1);
      if (stage === 3) setPlaying(false);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [playing, stage]);

  function changeStart(raw: number) {
    setStartRaw(raw);
    setStage(0);
    setPlaying(false);
  }

  function toggleBit(index: number) {
    changeStart(decode(encode(startRaw) ^ (1 << (7 - index))));
  }

  function playUpdate() {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (stage === 4) setStage(0);
    setPlaying(true);
  }

  const explanations = [
    `Read ${bits} from the weight's memory location. Under our encoding, this means ${startRaw} ÷ 16 = ${number(weight)}. Registers hold working copies for arithmetic.`,
    `An instruction makes arithmetic circuits multiply the stored weight by input 1: ${number(weight)} × 1 = ${number(prediction)}. The next circuits receive the resulting bit pattern.`,
    `Compare the prediction with the supplied answer 0.5. The error is ${number(error)}; half its square is ${number(loss)}. A target gives the program a criterion for improvement.`,
    `The program evaluates the derivative: (prediction − target) × input = ${number(gradient)}. It then calculates ${number(weight)} − 0.25 × ${number(gradient)} = ${number(idealNext)}.`,
    `Round to a multiple of 1/16 and store ${nextBits}: signed integer ${nextRaw}, weight ${number(nextWeight)}. ${nextRaw === startRaw ? 'This update rounds back to the same stored value.' : 'The stored bit pattern has changed. The next prediction will use this value.'}`,
  ];

  const code = `const scale = 16; // Four fractional bits.
const startWord = ${encode(startRaw)}; // Unsigned byte: ${bits}.
const signed = startWord >= 128 ? startWord - 256 : startWord;
const weight = signed / scale;
const input = 1;
const target = 0.5;
const prediction = weight * input;
const error = prediction - target;
const loss = 0.5 * error ** 2;
const gradient = error * input;
const idealNext = weight - 0.25 * gradient;
const nextRaw = Math.round(idealNext * scale);
const nextWord = (nextRaw + 256) % 256;
const bits = nextWord.toString(2).padStart(8, '0');
console.log({ weight, loss, gradient, idealNext, stored: nextRaw / scale, bits });`;

  return (
    <div className="physical-lesson">
      <header className="lesson-heading">
        <p className="eyebrow">EXPERIMENT 11 / FOLLOW THE ELECTRICITY</p>
        <h1>
          How does a weight become <em>electricity?</em>
        </h1>
        <p>
          A weight is a number with a physical representation. Watch a program read that
          representation, calculate an update, and write a new one.
        </p>
      </header>
      <ModeSwitcher
        value={mode}
        onChange={(value) => {
          setMode(value);
          setPlaying(false);
        }}
      />

      <section className="panel physical-encoding">
        <div className="panel-header">
          <div>
            <span className="eyebrow">ONE NUMBER, EIGHT BITS</span>
            <h2>A small memory you can touch.</h2>
          </div>
          <span className="pill">Toy fixed-point format</span>
        </div>
        <p>
          We use eight bits for a signed integer, then divide by 16. Click any bit or move the
          slider. Each column has a place value; the leftmost contributes <strong>−8</strong> when
          it is 1.
        </p>
        <div
          className="physical-bit-row"
          role="group"
          aria-label="Starting weight bits, most significant first"
        >
          {bits.split('').map((bit, index) => (
            <button
              type="button"
              key={index}
              className={`physical-bit ${bit === '1' ? 'on' : ''} ${index === 0 ? 'sign-bit' : ''}`}
              aria-label={`Toggle bit ${7 - index}, place value ${bitValues[index]}, currently ${bit}`}
              aria-pressed={bit === '1'}
              onClick={() => toggleBit(index)}
            >
              <span className="physical-bit-position">b{7 - index}</span>
              <span className="physical-voltage" aria-hidden="true">
                <i />
              </span>
              <strong>{bit}</strong>
              <small>{bitValues[index]}</small>
            </button>
          ))}
        </div>
        <div className="physical-encoding-caption">
          <span>Short / tall bars show logical low / high.</span>
          <span>Place values add up to the weight.</span>
        </div>
        <div className="physical-value-controls">
          <label className="control-group" htmlFor="physical-weight">
            <span>
              Starting weight <strong>{number(weight)}</strong>
            </span>
            <input
              id="physical-weight"
              type="range"
              min="-128"
              max="127"
              step="1"
              value={startRaw}
              aria-valuetext={`${number(weight)}, stored signed integer ${startRaw}`}
              onChange={(event) => changeStart(Number(event.target.value))}
            />
            <small>−8 to 7.9375, in steps of 0.0625</small>
          </label>
          <div className="physical-value-equation" aria-live="polite">
            <code>{bits}</code>
            <ArrowRight size={17} aria-hidden="true" />
            <span>{startRaw} ÷ 16</span>
            <strong>{number(weight)}</strong>
          </div>
        </div>
        <p className="physical-small-note">
          A real digital signal uses allowed voltage ranges for 0 and 1; there is no universal “1 =
          one volt.” This eight-bit teaching format is not Float32. The moving packets below show
          information flow, not individual electrons.
        </p>
      </section>

      <section className="panel physical-update">
        <div className="panel-header">
          <div>
            <span className="eyebrow">ONE COMPLETE WEIGHT UPDATE</span>
            <h2>Memory → arithmetic → memory.</h2>
          </div>
          <span className="pill">x = 1 · target = 0.5 · rate = 0.25</span>
        </div>
        <div className="physical-stage-list" role="group" aria-label="Inspect a computation stage">
          {stageNames.map((name, index) => (
            <button
              type="button"
              key={name}
              aria-pressed={stage === index}
              className={stage === index ? 'active' : ''}
              onClick={() => {
                setStage(index);
                setPlaying(false);
              }}
            >
              <span>{index + 1}</span>
              {name}
            </button>
          ))}
        </div>

        {mode === 'visual' && (
          <div className={`physical-board stage-${stage}`}>
            <svg
              viewBox="0 0 700 268"
              className="physical-circuit"
              role="img"
              aria-label={`Stage ${stage + 1}, ${stageNames[stage]}. Memory stores ${bitString(memoryRaw)}, representing ${number(memoryRaw / SCALE)}.`}
            >
              <defs>
                <marker
                  id="physical-arrow"
                  markerWidth="6"
                  markerHeight="6"
                  refX="5"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0 0L6 3L0 6Z" fill="#87988d" />
                </marker>
              </defs>
              <rect
                x="33"
                y="57"
                width="198"
                height="151"
                rx="16"
                className={`physical-chip ${stage === 0 || stage === 4 ? 'active' : ''}`}
              />
              <rect
                x="413"
                y="57"
                width="254"
                height="151"
                rx="16"
                className={`physical-chip ${stage > 0 && stage < 4 ? 'active' : ''}`}
              />
              <text x="132" y="90" className="physical-svg-label" textAnchor="middle">
                WEIGHT MEMORY
              </text>
              <text x="132" y="125" textAnchor="middle" className="physical-svg-bits">
                {bitString(memoryRaw)}
              </text>
              <text x="132" y="158" textAnchor="middle" className="physical-svg-value">
                w = {number(memoryRaw / SCALE)}
              </text>
              <text x="132" y="186" textAnchor="middle" className="physical-svg-note">
                {stage === 4 ? 'Updated stored value' : 'Original stored value'}
              </text>
              <text x="540" y="90" className="physical-svg-label" textAnchor="middle">
                CPU / GPU ARITHMETIC
              </text>
              <text x="540" y="126" textAnchor="middle" className="physical-svg-operation">
                {stage === 0
                  ? 'Load the operands'
                  : stage === 1
                    ? `${number(weight)} × 1`
                    : stage === 2
                      ? `½ × (${number(error)})²`
                      : stage === 3
                        ? 'w − rate × gradient'
                        : 'Encode the result'}
              </text>
              <text x="540" y="158" textAnchor="middle" className="physical-svg-value">
                {stage === 0
                  ? 'Working registers'
                  : stage === 1
                    ? `guess = ${number(prediction)}`
                    : stage === 2
                      ? `loss = ${number(loss)}`
                      : stage === 3
                        ? `next = ${number(idealNext)}`
                        : nextBits}
              </text>
              <text x="540" y="186" textAnchor="middle" className="physical-svg-note">
                Instructions select operations
              </text>
              <path d="M233 107H407" className="physical-wire" markerEnd="url(#physical-arrow)" />
              <path d="M412 165H237" className="physical-wire" markerEnd="url(#physical-arrow)" />
              <text x="322" y="91" textAnchor="middle" className="physical-svg-note">
                read bits →
              </text>
              <text x="322" y="190" textAnchor="middle" className="physical-svg-note">
                ← write bits
              </text>
              {stage === 0 && (
                <g className="physical-packet outbound">
                  <circle r="5" fill="#8a70c6" />
                </g>
              )}
              {stage === 4 && (
                <g className="physical-packet inbound">
                  <circle r="5" fill="#468a6b" />
                </g>
              )}
              <text x="350" y="247" textAnchor="middle" className="physical-svg-note">
                A schematic journey, slowed down so you can follow it.
              </text>
            </svg>
            <div className="physical-hardware-notes">
              <p>
                <Database size={17} />
                <span>Memory cells retain a physical state representing each stored bit.</span>
              </p>
              <p>
                <Cpu size={17} />
                <span>
                  Transistor circuits implement logic, addition, multiplication, and control.
                </span>
              </p>
            </div>
          </div>
        )}

        {mode === 'math' && (
          <div className="physical-math-grid">
            <div className={stage === 0 ? 'active' : ''}>
              <span>1 · Decode the stored weight</span>
              <code>w = signedInteger / 16</code>
              <strong>
                {startRaw} / 16 = {number(weight)}
              </strong>
            </div>
            <div className={stage === 1 ? 'active' : ''}>
              <span>2 · Predict</span>
              <code>ŷ = w × x</code>
              <strong>
                {number(weight)} × 1 = {number(prediction)}
              </strong>
            </div>
            <div className={stage === 2 ? 'active' : ''}>
              <span>3 · Measure loss</span>
              <code>L = ½(ŷ − target)²</code>
              <strong>
                ½ × ({number(error)})² = {number(loss)}
              </strong>
            </div>
            <div className={stage === 3 ? 'active' : ''}>
              <span>4 · Follow the chain rule</span>
              <code>dL/dw = (ŷ − target) × x</code>
              <strong>
                {number(error)} × 1 = {number(gradient)}
              </strong>
            </div>
            <div className={stage === 4 ? 'active' : ''}>
              <span>5 · Update and encode</span>
              <code>w* = w − 0.25 × gradient</code>
              <strong>
                w* = {number(idealNext)} → stored {number(nextWeight)}
              </strong>
            </div>
          </div>
        )}

        {mode === 'code' && (
          <CodeWalkthrough
            title="The same update, written as a small program"
            code={code}
            steps={[
              {
                label: 'Read and decode',
                explanation: `The unsigned byte ${encode(startRaw)} is interpreted as signed integer ${startRaw}, then divided by 16. The interpretation gives the bits their numerical meaning.`,
                lines: [1, 2, 3, 4],
              },
              {
                label: 'Multiply',
                explanation:
                  'The input and target are supplied data. Multiplication computes the guess from the current weight.',
                lines: [5, 6, 7],
              },
              {
                label: 'Measure loss',
                explanation:
                  'The objective turns the mismatch into a score. Electricity implements the calculation; the program specifies which score to calculate.',
                lines: [8, 9],
              },
              {
                label: 'Differentiate and update',
                explanation:
                  'For this one-weight squared loss, the chain rule is error times input. Subtract the scaled gradient to propose a new weight.',
                lines: [10, 11],
              },
              {
                label: 'Encode for storage',
                explanation:
                  'Round to the available grid, encode the signed integer as an unsigned byte, and display eight bits. Intermediate calculations here use JavaScript Number.',
                lines: [12, 13, 14],
              },
            ]}
          />
        )}

        <div className="physical-stage-explanation" aria-live="polite">
          <span>{String(stage + 1).padStart(2, '0')}</span>
          <div>
            <h3>{stageNames[stage]}</h3>
            <p>{explanations[stage]}</p>
          </div>
        </div>
        <div className="physical-play-controls">
          <button type="button" className="button primary" onClick={playUpdate}>
            {playing ? <Pause size={16} /> : <Play size={16} />}
            {playing ? 'Pause' : stage === 4 ? 'Replay this update' : 'Play update'}
          </button>
          <button
            type="button"
            className="button"
            disabled={stage === 4}
            onClick={() => {
              setPlaying(false);
              setStage(stage + 1);
            }}
          >
            <StepForward size={16} />
            Next stage
          </button>
          <button type="button" className="button" onClick={() => changeStart(24)}>
            <RotateCcw size={16} />
            Reset to 1.5
          </button>
          {stage === 4 && (
            <button type="button" className="text-button" onClick={() => changeStart(nextRaw)}>
              Use this weight for another update <ArrowRight size={15} />
            </button>
          )}
        </div>
        <div className="physical-result-row">
          <div>
            <span>Before storage</span>
            <code>{bits}</code>
            <strong>{number(weight)}</strong>
          </div>
          <ArrowRight size={20} />
          <div>
            <span>After the write</span>
            <code>{nextBits}</code>
            <strong>{number(nextWeight)}</strong>
          </div>
          <div className="physical-result-loss">
            <span>Loss before → after</span>
            <strong>
              {number(loss)} → {number(nextLoss)}
            </strong>
            <small>Both evaluated on this one example.</small>
          </div>
        </div>
        <p className="physical-small-note">
          The proposed update uses wider intermediate arithmetic. Writing rounds to the nearest
          1/16; halfway values round toward positive infinity here, following JavaScript Math.round.{' '}
          {idealNext !== nextWeight
            ? `The proposal ${number(idealNext)} becomes ${number(nextWeight)}. `
            : ''}
          The default update is exactly representable. This schematic omits caches, parallel
          execution, and the detailed transistor circuits.
        </p>
      </section>

      <section className="panel physical-meaning">
        <h2>Where is the “learning,” physically?</h2>
        <p>
          It is the entire organized process: stored examples and targets, a chosen loss, arithmetic
          circuits, instructions, and memory writes. Electricity carries and transforms the signals.
          It does not independently know which answer you wanted.
        </p>
        <div className="insight">
          <p>
            <strong>The key change is persistent.</strong> After the update, the next prediction
            reads the new weight. During ordinary inference, the computer reads trained weights
            without performing this optimizer update.
          </p>
        </div>
        <details>
          <summary>Does quantum physics explain the missing part?</summary>
          <p>
            Quantum physics helps explain semiconductor materials and transistor behavior. Ordinary
            CPU/GPU neural-network training uses those devices to implement classical digital
            arithmetic. That does not make its learning algorithm a quantum algorithm.
          </p>
          <p>
            Quantum computers can run different algorithms for some computational tasks. They do not
            automatically reveal missing labels or choose the true rule among worlds that give
            exactly the same supplied evidence. That limitation is about available information, not
            only calculation speed.
          </p>
        </details>
        <details>
          <summary>What about physics-informed and neuromorphic learning?</summary>
          <p>
            <strong>Physics-informed models</strong> can include known equations, conservation laws,
            and boundary conditions in a model or training objective. Useful extra knowledge can
            reduce ambiguity when it matches the problem. Incorrect assumptions or difficult
            optimization still matter.
          </p>
          <p>
            <strong>Neuromorphic hardware</strong> explores different implementations, including
            event-driven spiking networks and computation close to memory. Changing the hardware can
            change efficiency and suitable learning rules. It does not supply a universal guarantee
            of what any model will learn from any dataset.
          </p>
        </details>
        <details>
          <summary>Primary sources and next reading</summary>
          <ul className="physical-sources">
            <li>
              <a
                href="https://www.intel.com/content/www/us/en/newsroom/tech101/the-transistor-explained.html"
                target="_blank"
                rel="noreferrer"
              >
                Intel: how transistors form logic and arithmetic circuits
              </a>
            </li>
            <li>
              <a
                href="https://www.ti.com/lit/an/szza036c/szza036c.pdf"
                target="_blank"
                rel="noreferrer"
              >
                Texas Instruments: interpreting digital logic voltage specifications
              </a>
            </li>
            <li>
              <a
                href="https://docs.nvidia.com/deeplearning/performance/mixed-precision-training/index.html"
                target="_blank"
                rel="noreferrer"
              >
                NVIDIA: numerical precision, gradients, and weight updates
              </a>
            </li>
            <li>
              <a href="https://arxiv.org/abs/1711.10561" target="_blank" rel="noreferrer">
                Raissi et al.: physics-informed neural networks
              </a>
            </li>
            <li>
              <a
                href="https://www.intel.com/content/www/us/en/research/neuromorphic-computing.html"
                target="_blank"
                rel="noreferrer"
              >
                Intel: neuromorphic computation
              </a>
            </li>
            <li>
              <a
                href="https://quantum.cloud.ibm.com/learning/en/courses/quantum-computing-in-practice/applications-of-qc"
                target="_blank"
                rel="noreferrer"
              >
                IBM Quantum: matching algorithms to problems
              </a>
            </li>
          </ul>
        </details>
      </section>

      <section className="quiz physical-quiz">
        <span className="eyebrow">MAKE IT STICK</span>
        <h3>What changes when this training step finishes?</h3>
        <div>
          {[
            'The program writes a new encoded weight to memory.',
            'The electricity learns which answer is correct on its own.',
          ].map((label, index) => (
            <button
              type="button"
              key={label}
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
            {answer === 0
              ? 'Yes. Instructions and circuits compute the update; a memory write preserves the resulting weight. With limited precision, some tiny updates round back to the old value.'
              : 'The desired behavior comes from the data, objective, and update rule. Electrical signals implement those computations and the resulting memory write.'}
          </p>
        )}
      </section>
    </div>
  );
}
