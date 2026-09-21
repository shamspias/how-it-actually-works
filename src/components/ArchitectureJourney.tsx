import { useEffect, useState } from 'react';
import { ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';
import { ModeSwitcher, CodeWalkthrough, type LearningMode } from './LearningModes';
import {
  attend,
  MEMORY_CARDS,
  selectiveMemory,
  TOY_PROJECTIONS,
  WORD_CARDS,
  type AttentionTrace,
  type WordCard,
} from '../lib/sequence';
import './architecture.css';
import attentionCode from '../../examples/attention.mjs?raw';
import memoryCode from '../../examples/selective-state.mjs?raw';
import { useReducedMotion } from './LearningModes';

const format = (value: number) => value.toFixed(3);
const vector = (values: readonly number[]) => `[${values.map(format).join(', ')}]`;
const attentionStages = [
  'Pick a question',
  'Compare the cards',
  'Share the attention',
  'Carry information',
];
const sourceLines = (source: string, fragments: string[]) =>
  source
    .split('\n')
    .flatMap((line, i) => (fragments.some((fragment) => line.includes(fragment)) ? [i + 1] : []));
const attentionCodeSteps = [
  {
    label: 'Make Q, K, V',
    explanation:
      'A projection is a table of multiplications and additions. The question (Q), address (K), and message (V) come from the same input cards. Wq, Wk, Wv are the tables shown in the math view.',
    lines: sourceLines(attentionCode, [
      'const query',
      'const keys',
      'const values',
      'export const W',
    ]),
  },
  {
    label: 'Compare',
    explanation:
      'Multiply matching Q and K coordinates, add them, and divide by the square root of the number of coordinates. One score per card.',
    lines: sourceLines(attentionCode, ['const scores']),
  },
  {
    label: 'Normalize',
    explanation:
      'Hide future cards if causal is true. Subtracting the largest allowed score keeps exp safe from overflow. Divide by the sum to get shares adding to one.',
    lines: sourceLines(attentionCode, [
      'const allowed',
      'const max',
      'const exp',
      'const sum',
      'const weights',
    ]),
  },
  {
    label: 'Mix messages',
    explanation:
      'For each output coordinate, multiply every value by its share and add. That is the complete computation of this tiny attention head.',
    lines: sourceLines(attentionCode, ['const output', 'values.reduce', 'return {']),
  },
];
const memoryCodeSteps = [
  {
    label: 'Start empty',
    explanation: 'Our entire memory is one number. Zero means no value has been written yet.',
    lines: sourceLines(memoryCode, ['let state', 'const trace']),
  },
  {
    label: 'Read a card',
    explanation:
      'Each card carries a number and a marked flag. The flag controls the gate. We supplied this rule by hand; a trained model would learn how inputs control its update.',
    lines: sourceLines(memoryCode, ['for (const card', 'const gate']),
  },
  {
    label: 'Keep + write',
    explanation:
      'A gate of zero keeps all old memory. A gate of one replaces it completely. A value between them blends old and new.',
    lines: sourceLines(memoryCode, ['const retained', 'const written', 'state = retained']),
  },
  {
    label: 'Pass it on',
    explanation:
      'The new number becomes the next step’s old number. Recording trace is for our animation; the recurrence itself needs only state.',
    lines: sourceLines(memoryCode, ['trace.push', 'return trace']),
  },
];

function AttentionScene({
  words,
  queryIndex,
  trace,
  stage,
}: {
  words: WordCard[];
  queryIndex: number;
  trace: AttentionTrace;
  stage: number;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <svg
      className="architecture-scene"
      viewBox="0 0 760 340"
      role="img"
      aria-label={`Attention step ${stage + 1}: ${attentionStages[stage]}. Query ${words[queryIndex]}. ${stage === 3 ? `Mixed output ${vector(trace.output)}.` : ''}`}
    >
      <defs>
        <marker
          id="attention-arrow"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 6 3 L 0 6 z" fill="currentColor" />
        </marker>
      </defs>
      <text x="380" y="25" textAnchor="middle" className="architecture-svg-caption">
        {stage < 2
          ? 'Each card offers an address and a message'
          : 'Thicker lines carry a larger share'}
      </text>
      {words.map((word, index) => {
        const x = 95 + index * 190;
        const enabled = trace.allowed[index];
        const width = stage < 2 ? 2 : 1 + trace.weights[index] * 13;
        return (
          <g key={`${index}-${word}`}>
            {stage > 0 && (
              <path
                d={stage === 3 ? `M${x},125 Q${x},207 380,247` : `M380,247 Q${x},207 ${x},125`}
                fill="none"
                stroke={enabled ? '#6e8c60' : '#bbc1b9'}
                strokeWidth={width}
                strokeDasharray={enabled ? undefined : '5 6'}
                markerEnd={enabled ? 'url(#attention-arrow)' : undefined}
                className={enabled ? `architecture-flow architecture-flow-${stage}` : ''}
              />
            )}
            {stage === 3 && enabled && !reducedMotion && (
              <circle r="6" fill="#8771b4" className="architecture-message-dot">
                <animateMotion
                  dur={`${1.8 + index * 0.2}s`}
                  repeatCount="2"
                  fill="freeze"
                  path={`M${x},125 Q${x},207 380,247`}
                />
              </circle>
            )}
            <rect
              x={x - 76}
              y="45"
              width="152"
              height="80"
              rx="15"
              fill={queryIndex === index ? '#e9e1f3' : '#fffefa'}
              stroke={enabled ? '#9eb68c' : '#cbd0c6'}
              strokeWidth="2"
            />
            <text x={x} y="78" textAnchor="middle" className="architecture-card-word">
              {word}
            </text>
            <text x={x} y="104" textAnchor="middle" className="architecture-svg-small">
              {!enabled && stage > 0
                ? 'future: hidden'
                : stage === 0
                  ? `card ${index + 1}`
                  : stage === 1
                    ? `score ${format(trace.scores[index])}`
                    : `${(100 * trace.weights[index]).toFixed(1)}% share`}
            </text>
            {stage === 3 && (
              <text x={x} y="148" textAnchor="middle" className="architecture-svg-small">
                value {vector(trace.values[index])}
              </text>
            )}
          </g>
        );
      })}
      <rect
        x="239"
        y="247"
        width="282"
        height="78"
        rx="18"
        fill="#e9e1f3"
        stroke="#ac98ca"
        strokeWidth="2"
      />
      <text x="380" y="277" textAnchor="middle" className="architecture-card-word">
        {stage === 3 ? `Context for ${words[queryIndex]}` : `${words[queryIndex]} asks`}
      </text>
      <text x="380" y="304" textAnchor="middle" className="architecture-svg-small">
        {stage === 3 ? vector(trace.output) : `question ${vector(trace.query)}`}
      </text>
    </svg>
  );
}

function AttentionMath({
  words,
  queryIndex,
  trace,
}: {
  words: WordCard[];
  queryIndex: number;
  trace: AttentionTrace;
}) {
  const maximum = Math.max(...trace.scores.filter((_, index) => trace.allowed[index]));
  const exponentials = trace.scores.map((score, index) =>
    trace.allowed[index] ? Math.exp(score - maximum) : 0,
  );
  const denominator = exponentials.reduce((sum, value) => sum + value, 0);
  return (
    <div className="architecture-math">
      <h3>Follow one real calculation.</h3>
      <p>
        A vector is just a list of numbers. Our question has two numbers:{' '}
        <strong>{vector(trace.query)}</strong>. Compare it with each card’s two-number key.
      </p>
      <div
        className="architecture-table-scroll"
        role="region"
        aria-label="Attention scores and message shares"
        tabIndex={0}
      >
        <table>
          <caption>
            Query: {words[queryIndex]}. All displayed decimals are rounded; calculations use full
            precision.
          </caption>
          <thead>
            <tr>
              <th>Card / key</th>
              <th>Multiply, add, scale</th>
              <th>Share</th>
              <th>Value × share</th>
            </tr>
          </thead>
          <tbody>
            {words.map((word, index) => (
              <tr key={index}>
                <th>
                  {word}
                  <small>{vector(trace.keys[index])}</small>
                </th>
                <td>
                  ({trace.query[0]} × {trace.keys[index][0]} + {trace.query[1]} ×{' '}
                  {trace.keys[index][1]}) / √2 = {format(trace.scores[index])}
                </td>
                <td>
                  {trace.allowed[index]
                    ? `${format(exponentials[index])} / ${format(denominator)} = ${format(trace.weights[index])}`
                    : '0 (future hidden)'}
                </td>
                <td>
                  {vector(trace.values[index])} × {format(trace.weights[index])} ={' '}
                  {vector(trace.contributions[index])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="architecture-formula">
        Output = add the last column = <strong>{vector(trace.output)}</strong>
      </div>
      <p>
        “Softmax” names the share calculation: exponentiate each allowed score, then divide by their
        total. We first subtract the largest score ({format(maximum)}) from all allowed scores. This
        gives the same shares and avoids overflow.
      </p>
      <details className="architecture-details">
        <summary>Where did the numbers come from? Open every projection.</summary>
        <p>
          Each toy embedding is [person offered, object offered, person requested, object
          requested]. These coordinate meanings and all projection weights were chosen by us.
        </p>
        <div className="architecture-formula">
          {words.map((word) => `${word}: ${vector(WORD_CARDS[word])}`).join('\n')}
          <br />
          Wq = [[0,0,1,0], [0,0,0,1]]
          <br />
          Wk = [[1,0,0,0], [0,1,0,0]]
          <br />
          Wv = [[0.5,0,0,0], [0,0.5,0,0]]
          <br />q = Wq × embedding; k = Wk × embedding; v = Wv × embedding
        </div>
        <p>
          For Mia, [2,0,2,0] becomes q = [2,0], k = [2,0], v = [1,0]. In a trained Transformer,
          embeddings and these matrices are learned and their coordinates usually have no simple
          named meaning.
        </p>
      </details>
      <details className="architecture-details">
        <summary>The general formula, and how this could learn</summary>
        <div className="architecture-formula">
          sⱼ = q · kⱼ / √d
          <br />
          αⱼ = exp(sⱼ) / Σₖ exp(sₖ)
          <br />o = Σⱼ αⱼvⱼ
          <br />
          ∂αᵢ/∂sⱼ = αᵢ(δᵢⱼ − αⱼ)
        </div>
        <p>
          d is the key length. δᵢⱼ is 1 when i = j, otherwise 0. The derivative tells
          backpropagation how a score changes every share. Gradients then flow through the dot
          products into Q/K/V projections and embeddings; an optimizer updates those weights. This
          scene only runs a forward pass.
        </p>
      </details>
    </div>
  );
}

export default function ArchitectureJourney() {
  const reducedMotion = useReducedMotion();
  const [mode, setMode] = useState<LearningMode>('visual');
  const [mechanism, setMechanism] = useState<'attention' | 'memory'>('attention');
  const [words, setWords] = useState<WordCard[]>(['Mia', 'cup', 'she', 'it']);
  const [queryIndex, setQueryIndex] = useState(2);
  const [causal, setCausal] = useState(false);
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [guess, setGuess] = useState<'person' | 'object' | null>(null);
  const [noiseGate, setNoiseGate] = useState(0.5);
  const [extraMemory, setExtraMemory] = useState(false);
  const [memoryQuestion, setMemoryQuestion] = useState<'first' | 'latest'>('first');
  const [memoryStep, setMemoryStep] = useState(0);
  const [memoryPlaying, setMemoryPlaying] = useState(false);
  const trace = attend(
    words.map((word) => WORD_CARDS[word]),
    queryIndex,
    TOY_PROJECTIONS,
    causal,
  );
  const memoryInputs = extraMemory
    ? [...MEMORY_CARDS, { label: 'Remember 4', value: 4, marked: true }]
    : MEMORY_CARDS;
  const memoryTrace = selectiveMemory(memoryInputs, noiseGate);
  const currentMemory = memoryStep > 0 ? memoryTrace[memoryStep - 1] : null;
  const targetMemory = extraMemory && memoryQuestion === 'latest' ? 4 : 7;
  const memoryDone = memoryStep === memoryTrace.length;
  const memoryCorrect =
    currentMemory !== null && Math.abs(currentMemory.after - targetMemory) < 1e-9;
  const strongest =
    trace.output[0] > trace.output[1]
      ? 'person'
      : trace.output[0] < trace.output[1]
        ? 'object'
        : 'tie';

  useEffect(() => {
    if (!playing || mode !== 'visual' || mechanism !== 'attention') return;
    const timer = window.setTimeout(() => {
      if (stage < 3) setStage(stage + 1);
      else setPlaying(false);
    }, 2300);
    return () => window.clearTimeout(timer);
  }, [playing, stage, mode, mechanism]);

  useEffect(() => {
    if (!memoryPlaying || mechanism !== 'memory' || mode === 'code') return;
    const timer = window.setTimeout(() => {
      if (memoryStep < memoryInputs.length) setMemoryStep(memoryStep + 1);
      else setMemoryPlaying(false);
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [memoryPlaying, memoryStep, memoryInputs.length, mechanism, mode]);

  function resetAttention() {
    setStage(0);
    setPlaying(false);
    setGuess(null);
  }
  function resetMemory() {
    setMemoryStep(0);
    setMemoryPlaying(false);
  }

  const explanations = [
    `Start with “${words[queryIndex]}”. Its question is ${vector(trace.query)}. The first coordinate asks for person information; the second asks for object information. Click another card’s “Ask” button to change the question.`,
    'Compare the question with every allowed card’s address. Matching coordinates multiply to give a larger score. No word understands another word here: the numbers determine the matches.',
    'Turn the scores into shares that add up to 100%. This is softmax. A bigger score gets a bigger share, but allowed smaller scores usually still contribute.',
    `Bring back each card’s message, multiplied by its share. Add the messages. The result is ${vector(trace.output)}: the first number carries person information, the second object information. This mixture can go into the next layer.`,
  ];

  return (
    <div className="architecture-journey">
      <header className="lesson-heading">
        <p className="eyebrow">
          EXPERIMENT 09 <span> / </span> ATTENTION & MEMORY
        </p>
        <h1>
          How does “it”
          <br />
          <em>find its context?</em>
        </h1>
        <p>
          “Mia picked up a cup. She smiled. It was warm.” You use earlier words to understand “she”
          and “it”. Let’s build two tiny ways to carry earlier information, one move at a time.
        </p>
      </header>
      <ModeSwitcher
        value={mode}
        onChange={(value) => {
          setMode(value);
          setPlaying(false);
          setMemoryPlaying(false);
        }}
      />
      <div className="architecture-tabs" role="group" aria-label="Choose a sequence mechanism">
        <button
          type="button"
          aria-pressed={mechanism === 'attention'}
          onClick={() => {
            setMechanism('attention');
            setMemoryPlaying(false);
          }}
        >
          <span>01</span>
          <strong>Look back at the cards</strong>
          <small>Attention → Transformer</small>
        </button>
        <button
          type="button"
          aria-pressed={mechanism === 'memory'}
          onClick={() => {
            setMechanism('memory');
            setPlaying(false);
          }}
        >
          <span>02</span>
          <strong>Carry a tiny memory</strong>
          <small>Selection → toward Mamba</small>
        </button>
      </div>

      {mechanism === 'attention' ? (
        <section className="panel architecture-panel" aria-label="Attention tutorial">
          <div className="panel-header">
            <div>
              <p className="eyebrow">YOUR MISSION</p>
              <h3>Let one word borrow information.</h3>
            </div>
            <span className="pill">4 moves · real arithmetic</span>
          </div>
          <p>
            Mia is the person in our little story; the cup is an object. We give each word card
            numbers for those clues. Start with the purple “she” card and press{' '}
            <strong>Play the attention story</strong>. Then ask from “it” and compare.
          </p>
          <p className="architecture-scope">
            A query (Q) is the requesting card’s numerical question. A key (K) is a card’s numerical
            address. A value (V) is the message it can send. We chose these numbers to make the
            mechanism visible; this exercise mixes information, without training the words.
          </p>
          <div className="architecture-word-controls">
            {words.map((word, index) => (
              <div key={index} className={queryIndex === index ? 'selected' : ''}>
                <label htmlFor={`attention-word-${index}`}>Card {index + 1}</label>
                <select
                  id={`attention-word-${index}`}
                  value={word}
                  onChange={(event) => {
                    const next = [...words];
                    next[index] = event.target.value as WordCard;
                    setWords(next);
                    resetAttention();
                  }}
                >
                  {Object.keys(WORD_CARDS).map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <button
                  type="button"
                  aria-pressed={queryIndex === index}
                  aria-label={`Ask from card ${index + 1}: ${word}`}
                  onClick={() => {
                    setQueryIndex(index);
                    resetAttention();
                  }}
                >
                  Ask from {word}
                </button>
              </div>
            ))}
          </div>
          <label className="architecture-toggle">
            <input
              type="checkbox"
              checked={causal}
              onChange={(event) => {
                setCausal(event.target.checked);
                resetAttention();
              }}
            />
            Hide future cards (causal mask)
            <span>Only cards at or before the question may contribute.</span>
          </label>
          {mode === 'visual' && (
            <>
              <div className="architecture-stage-list" aria-label="Attention story progress">
                {attentionStages.map((title, index) => (
                  <button
                    key={title}
                    type="button"
                    className={stage === index ? 'active' : ''}
                    aria-pressed={stage === index}
                    onClick={() => {
                      setStage(index);
                      setPlaying(false);
                    }}
                  >
                    <span>{index + 1}</span>
                    {title}
                  </button>
                ))}
              </div>
              <AttentionScene words={words} queryIndex={queryIndex} trace={trace} stage={stage} />
              <div className="architecture-story" aria-live="polite">
                <span>{stage + 1}</span>
                <div>
                  <h3>{attentionStages[stage]}</h3>
                  <p>{explanations[stage]}</p>
                </div>
              </div>
              <div className="architecture-actions">
                <button
                  type="button"
                  className="button primary"
                  onClick={() => {
                    if (stage === 3) setStage(0);
                    setPlaying(!playing);
                  }}
                >
                  {playing ? <Pause size={16} /> : <Play size={16} />}
                  {playing ? 'Pause attention story' : 'Play the attention story'}
                </button>
                <button
                  type="button"
                  className="button"
                  disabled={stage === 3}
                  onClick={() => {
                    setPlaying(false);
                    setStage(stage + 1);
                  }}
                >
                  One attention move <ChevronRight size={16} />
                </button>
                <button
                  type="button"
                  className="button"
                  aria-label="Restart attention story"
                  onClick={resetAttention}
                >
                  <RotateCcw size={16} />
                  Restart
                </button>
              </div>
              {stage === 3 && (
                <div className="architecture-challenge">
                  <strong>Your turn: which information came through more strongly?</strong>
                  <div className="architecture-actions">
                    {(['person', 'object'] as const).map((answer) => (
                      <button
                        type="button"
                        className="button"
                        key={answer}
                        aria-pressed={guess === answer}
                        onClick={() => setGuess(answer)}
                      >
                        {answer === 'person' ? 'Person information' : 'Object information'}
                      </button>
                    ))}
                  </div>
                  {guess && (
                    <p role="status">
                      {strongest === 'tie'
                        ? 'This time they are equal. The two output numbers tie; a mixture need not pick one winner.'
                        : guess === strongest
                          ? 'Yes. Follow the bigger output number back along the thicker line. You can change a card and see the result change without any training.'
                          : 'Look at the two output numbers. The first carries person information; the second carries object information. Follow the larger one.'}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
          {mode === 'math' && <AttentionMath words={words} queryIndex={queryIndex} trace={trace} />}
          {mode === 'code' && (
            <>
              <CodeWalkthrough
                title="One attention head, written by hand"
                code={attentionCode}
                steps={attentionCodeSteps}
              />
              <p className="architecture-run">
                Run the complete example: <code>node examples/attention.mjs</code>. It prints
                projections, scores, shares, and the output. Add <code>--causal</code> to mask
                future cards.
              </p>
            </>
          )}
          <p className="architecture-scope">
            <strong>What is real here?</strong> The attention arithmetic.{' '}
            <strong>What did we supply?</strong> All word vectors and projection weights, including
            their person/object meanings. This toy has not learned language, gender, or grammar.
            Attention shares alone are not a full explanation of a model’s answer.
          </p>
          <details className="architecture-details">
            <summary>How does this become a Transformer?</summary>
            <p>
              Repeat this attention calculation from every token, usually with several sets of
              projections called heads. Add position information, residual paths, normalization, and
              a small feed-forward network at each position. Stack blocks. A final projection
              produces output scores.
            </p>
            <div className="architecture-blocks">
              <span>Token + position</span>
              <span>Attention + add</span>
              <span>Normalize</span>
              <span>Feed-forward + add</span>
              <span>Normalize</span>
            </div>
            <p>
              The original Transformer used this normalization order; many later models normalize
              before each sublayer. During training, a prediction loss sends gradients through all
              these pieces. During ordinary inference, their trained weights remain fixed while
              context changes.
            </p>
          </details>
        </section>
      ) : (
        <section className="panel architecture-panel" aria-label="Selective memory tutorial">
          <div className="panel-header">
            <div>
              <p className="eyebrow">YOUR MISSION</p>
              <h3>Keep 7 safe while noise goes past.</h3>
            </div>
            <span className="pill">One memory slot</span>
          </div>
          <p>
            In this second game, the program reads cards one at a time. Its “backpack” is one saved
            working number, called state. A marked card says “remember 7”; other cards are
            distractions. Control the gate: how much should each distraction replace that number?
            Changing state while reading is different from training weights.
          </p>
          <label className="control-group" htmlFor="noise-write-gate">
            <span>
              Distraction write gate <strong>{Math.round(noiseGate * 100)}%</strong>
            </span>
            <input
              id="noise-write-gate"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={noiseGate}
              onChange={(event) => {
                setNoiseGate(Number(event.target.value));
                resetMemory();
              }}
            />
            <small>0%: keep the old number. 100%: replace it with every distraction.</small>
          </label>
          <label className="architecture-toggle">
            <input
              type="checkbox"
              checked={extraMemory}
              onChange={(event) => {
                setExtraMemory(event.target.checked);
                resetMemory();
              }}
            />
            Add a second marked card: “Remember 4”
          </label>
          {extraMemory && (
            <label className="architecture-question" htmlFor="memory-question">
              At the end, ask for
              <select
                id="memory-question"
                value={memoryQuestion}
                onChange={(event) => setMemoryQuestion(event.target.value as 'first' | 'latest')}
              >
                <option value="first">the FIRST marked number (7)</option>
                <option value="latest">the LATEST marked number (4)</option>
              </select>
            </label>
          )}
          {mode !== 'code' && (
            <>
              <div className="architecture-memory-tape" aria-label="Memory input sequence">
                {memoryInputs.map((card, index) => (
                  <div
                    key={card.label}
                    className={`${card.marked ? 'marked' : ''} ${memoryStep === index + 1 ? 'current' : ''} ${memoryStep > index ? 'read' : ''}`}
                  >
                    <small>{memoryStep > index ? 'read' : `card ${index + 1}`}</small>
                    <strong>{card.value}</strong>
                    <span>{card.marked ? 'remember' : 'noise'}</span>
                  </div>
                ))}
              </div>
              {mode === 'visual' ? (
                <svg
                  key={memoryStep}
                  className="architecture-memory-scene"
                  viewBox="0 0 760 265"
                  role="img"
                  aria-label={
                    currentMemory
                      ? `Previous memory ${format(currentMemory.before)}; write gate ${currentMemory.gate}; new memory ${format(currentMemory.after)}`
                      : 'An empty backpack: memory starts at zero'
                  }
                >
                  <path d="M190,144 H570" fill="none" stroke="#bbc9b0" strokeWidth="8" />
                  {currentMemory && !reducedMotion && (
                    <circle r="9" fill="#8670b5" className="architecture-message-dot">
                      <animateMotion
                        dur="1.4s"
                        repeatCount="1"
                        path="M190,144 H570"
                        fill="freeze"
                      />
                    </circle>
                  )}
                  <g>
                    <rect
                      x="70"
                      y="88"
                      width="155"
                      height="130"
                      rx="25"
                      fill="#e8efe2"
                      stroke="#87a375"
                      strokeWidth="3"
                    />
                    <path
                      d="M115,88 V70 Q147,37 180,70 V88"
                      fill="none"
                      stroke="#87a375"
                      strokeWidth="5"
                    />
                    <text
                      x="147"
                      y="145"
                      textAnchor="middle"
                      className="architecture-memory-number"
                    >
                      {format(currentMemory?.before ?? 0)}
                    </text>
                    <text x="147" y="184" textAnchor="middle" className="architecture-svg-small">
                      old memory
                    </text>
                  </g>
                  <g>
                    <circle
                      cx="380"
                      cy="144"
                      r="52"
                      fill="#fffefa"
                      stroke="#ac98ca"
                      strokeWidth="3"
                    />
                    <path
                      d="M353,123 L407,165"
                      fill="none"
                      stroke="#8670b5"
                      strokeWidth="8"
                      transform={`rotate(${(currentMemory?.gate ?? 0) * -70} 380 144)`}
                    />
                    <text x="380" y="53" textAnchor="middle" className="architecture-svg-caption">
                      {currentMemory?.label ?? 'Waiting for the first card'}
                    </text>
                    <text x="380" y="221" textAnchor="middle" className="architecture-svg-small">
                      write gate: {Math.round((currentMemory?.gate ?? 0) * 100)}%
                    </text>
                  </g>
                  <g className={currentMemory ? 'architecture-memory-pulse' : ''}>
                    <rect
                      x="535"
                      y="88"
                      width="155"
                      height="130"
                      rx="25"
                      fill="#e9e1f3"
                      stroke="#ac98ca"
                      strokeWidth="3"
                    />
                    <path
                      d="M580,88 V70 Q612,37 645,70 V88"
                      fill="none"
                      stroke="#ac98ca"
                      strokeWidth="5"
                    />
                    <text
                      x="612"
                      y="145"
                      textAnchor="middle"
                      className="architecture-memory-number"
                    >
                      {format(currentMemory?.after ?? 0)}
                    </text>
                    <text x="612" y="184" textAnchor="middle" className="architecture-svg-small">
                      new memory
                    </text>
                  </g>
                </svg>
              ) : (
                <div className="architecture-math">
                  <h3>One update, fully expanded.</h3>
                  <div className="architecture-formula">
                    g = marked ? 1 : distraction gate
                    <br />
                    hₜ = (1 − g)hₜ₋₁ + gxₜ
                    <br />
                    {currentMemory
                      ? `h = (1 − ${currentMemory.gate}) × ${format(currentMemory.before)} + ${currentMemory.gate} × ${currentMemory.value}\n  = ${format(currentMemory.retained)} + ${format(currentMemory.written)}\n  = ${format(currentMemory.after)}`
                      : 'h₀ = 0. Read the first card to calculate h₁.'}
                  </div>
                  <p>
                    h means memory, x means the current card’s number, and g is the write gate. t
                    counts time steps. The gate determines how much old information survives.
                  </p>
                  <details className="architecture-details">
                    <summary>The derivative explains why memory can fade</summary>
                    <div className="architecture-formula">
                      ∂hₜ/∂hₜ₋₁ = 1 − gₜ
                      <br />
                      ∂hₜ/∂gₜ = xₜ − hₜ₋₁
                      <br />
                      ∂hₜ/∂hₛ = ∏ᵤ₌ₛ₊₁ᵗ (1 − gᵤ)
                    </div>
                    <p>
                      With three distraction gates of 0.5, only 0.5³ = 12.5% of the original signal
                      remains. A closed gate (g = 0) preserves it. The same multiplications affect a
                      gradient travelling backward in this recurrence.
                    </p>
                  </details>
                </div>
              )}
              <div className="architecture-story" aria-live="polite">
                <span>{memoryStep}</span>
                <div>
                  <h3>{currentMemory?.label ?? 'The backpack starts empty.'}</h3>
                  <p>
                    {currentMemory
                      ? `Keep ${format(currentMemory.retained)} from the old memory. Write ${format(currentMemory.written)} from this card. The backpack now holds ${format(currentMemory.after)}.`
                      : 'Read the marked 7 first. Then follow the three distractions. Try to finish with exactly 7.'}
                  </p>
                </div>
              </div>
              <div className="architecture-actions">
                <button
                  type="button"
                  className="button primary"
                  onClick={() => {
                    if (memoryDone) setMemoryStep(0);
                    setMemoryPlaying(!memoryPlaying);
                  }}
                >
                  {memoryPlaying ? <Pause size={16} /> : <Play size={16} />}
                  {memoryPlaying ? 'Pause memory story' : 'Play the memory story'}
                </button>
                <button
                  type="button"
                  className="button"
                  disabled={memoryDone}
                  onClick={() => {
                    setMemoryPlaying(false);
                    setMemoryStep(memoryStep + 1);
                  }}
                >
                  Read one card <ChevronRight size={16} />
                </button>
                <button type="button" className="button" onClick={resetMemory}>
                  <RotateCcw size={16} />
                  Empty backpack
                </button>
              </div>
              {memoryDone && (
                <div
                  className={`architecture-challenge ${memoryCorrect ? 'success' : ''}`}
                  role="status"
                >
                  <strong>
                    {memoryCorrect
                      ? 'You kept the requested number!'
                      : `We wanted ${targetMemory}, but got ${format(currentMemory?.after ?? 0)}.`}
                  </strong>
                  <p>
                    {memoryCorrect
                      ? 'Now add a second marked card and ask for the first one. What must a memory keep for that harder task?'
                      : extraMemory && noiseGate === 0 && memoryQuestion === 'first'
                        ? 'The second marked card replaced 7 with 4. This one-slot overwrite rule cannot retrieve both marked values. It needs a different memory design or a different task.'
                        : 'Distractions wrote into the backpack. Move their gate to 0% and replay. Closing that gate keeps the marked number safe.'}
                  </p>
                </div>
              )}
            </>
          )}
          {mode === 'code' && (
            <>
              <CodeWalkthrough
                title="A complete scalar memory with plain loops"
                code={memoryCode}
                steps={memoryCodeSteps}
              />
              <p className="architecture-run">
                Run <code>node examples/selective-state.mjs</code> to compare gates 0, 0.5, and 1,
                then see the one-slot overwrite failure.
              </p>
            </>
          )}
          <p className="architecture-scope">
            <strong>Mamba-inspired, deliberately tiny:</strong> this is a hand-designed scalar gated
            recurrence, not a complete Mamba implementation. Nothing is trained in this scene. A
            changing state is different from changing a learned weight.
          </p>
          <details className="architecture-details">
            <summary>The bridge to an actual selective state-space model</summary>
            <p>
              Mamba uses a larger numerical state and makes update quantities depend on the input.
              This is related to our gate controlling what survives. The full block also has learned
              projections, a local convolution, and gating; it is not just this backpack rule.
            </p>
            <div className="architecture-formula">
              hₜ = Āₜhₜ₋₁ + B̄ₜxₜ
              <br />
              yₜ = Cₜhₜ
            </div>
            <p>
              The bars indicate discrete-time update quantities. Mamba obtains them from state-space
              parameters and an input-dependent step size. A hardware-aware scan computes the
              recurrence efficiently during training. For a fixed state size, its carried state does
              not grow with sequence length. Whether it preserves the information your task needs
              must be tested.
            </p>
          </details>
        </section>
      )}
      <ArchitectureAlternatives />
      <p className="architecture-source">
        Read the original mechanisms:{' '}
        <a href="https://arxiv.org/abs/1706.03762" target="_blank" rel="noreferrer">
          Attention Is All You Need
        </a>{' '}
        ·{' '}
        <a href="https://arxiv.org/abs/2312.00752" target="_blank" rel="noreferrer">
          Mamba
        </a>
        . Model details and the limits of these toys: <code>docs/architectures.md</code>.
      </p>
    </div>
  );
}

const alternatives = {
  Dense: {
    metaphor: 'A mixing bowl',
    mechanism:
      'Every input can contribute to every output. Weights control each contribution; nonlinearities let layers build more than straight-line rules.',
    try: 'A small table of measured features. Begin with a small network and a simpler baseline.',
    cost: 'A plain fixed-size dense input does not automatically share a rule across positions.',
    formula: 'h = ReLU(Wx + b)',
  },
  CNN: {
    metaphor: 'A magnifying glass that slides',
    mechanism:
      'The same small set of weights looks at neighboring pixels or time steps. Sliding it reuses a local pattern detector.',
    try: 'Images, audio, or other data where nearby measurements form repeating patterns.',
    cost: 'One small window sees only nearby inputs. Wider context needs larger windows, more layers, or another mechanism.',
    formula: 'y[t] = Σⱼ filter[j] × x[t + j]',
  },
  RNN: {
    metaphor: 'A notebook passed along',
    mechanism:
      'Combine the current input with a carried state. Repeat the same update at every time step.',
    try: 'A stream that arrives in order. Gated RNNs, such as LSTMs and GRUs, give the update more control.',
    cost: 'Earlier information must survive inside a limited state. Long chains can weaken or amplify gradients.',
    formula: 'hₜ = tanh(Wₓxₜ + Wₕhₜ₋₁ + b)',
  },
  Transformer: {
    metaphor: 'Cards that exchange messages',
    mechanism:
      'Queries and keys determine how to mix values from allowed positions. Feed-forward networks then transform the mixed information.',
    try: 'Tasks needing flexible access to different parts of the available context.',
    cost: 'Full attention computes pairwise scores: doubling sequence length roughly quadruples their count. Its context cache also grows with sequence length.',
    formula: 'Attention(Q,K,V) = softmax(QKᵀ / √d + mask)V',
  },
  Mamba: {
    metaphor: 'A selective memory carried along',
    mechanism:
      'An input-dependent state update carries information through a sequence. The selected update changes what persists.',
    try: 'Sequence tasks where a bounded carried state and efficient processing are useful.',
    cost: 'The state must preserve whatever the task will later ask for. A compact state is not a transcript of all inputs.',
    formula: 'hₜ = Āₜhₜ₋₁ + B̄ₜxₜ; yₜ = Cₜhₜ',
  },
};

function ArchitectureAlternatives() {
  const [choice, setChoice] = useState<keyof typeof alternatives>('Transformer');
  const copy = alternatives[choice];
  return (
    <details className="panel architecture-details architecture-alternatives">
      <summary>What else can move information? Compare five designs.</summary>
      <div
        className="architecture-choice"
        role="group"
        aria-label="Compare architecture alternatives"
      >
        {(Object.keys(alternatives) as (keyof typeof alternatives)[]).map((name) => (
          <button
            type="button"
            className="button"
            key={name}
            aria-pressed={choice === name}
            onClick={() => setChoice(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <h3>{copy.metaphor}</h3>
      <p>{copy.mechanism}</p>
      <ArchitectureMiniature choice={choice} />
      <div className="architecture-comparison">
        <p>
          <strong>A reason to try it</strong>
          {copy.try}
        </p>
        <p>
          <strong>A tradeoff to test</strong>
          {copy.cost}
        </p>
      </div>
      <div className="architecture-formula">{copy.formula}</div>
      <p>
        These are starting hypotheses, not a ranking. Use the same held-out examples and compare
        accuracy, memory, and speed. A more complicated architecture cannot add information missing
        from the data.
      </p>
      <details className="architecture-details">
        <summary>What about hybrids and more advanced designs?</summary>
        <p>
          You can combine these ideas: local convolution followed by attention, attention blocks
          mixed with state-space blocks, or different feed-forward experts selected by a router.
          Each adds a design choice to measure. First ask what information the task needs, where it
          lives, and how your design lets that information reach the answer.
        </p>
        <p>
          A useful experiment: test exact recall of a far-away marked value, then test a running
          average. Those tasks need different kinds of memory. A benchmark result on one does not
          prove superiority on the other.
        </p>
      </details>
    </details>
  );
}

function ArchitectureMiniature({ choice }: { choice: keyof typeof alternatives }) {
  const positions = [60, 180, 300, 420, 540];
  return (
    <svg
      className="architecture-miniature"
      viewBox="0 0 600 155"
      role="img"
      aria-label={`${choice} information flow schematic; these dots show connections, not a trained model`}
    >
      {positions.map((x, index) => (
        <g key={x}>
          {(choice === 'Dense' || choice === 'Transformer') &&
            positions.map((other) => (
              <line
                key={other}
                x1={x}
                y1="35"
                x2={other}
                y2="115"
                stroke="#b6c5a9"
                strokeWidth={choice === 'Transformer' && index === 2 ? 3 : 1}
                opacity="0.6"
              />
            ))}
          {choice === 'CNN' &&
            positions
              .filter((_, j) => Math.abs(index - j) <= 1)
              .map((other) => (
                <line
                  key={other}
                  x1={x}
                  y1="35"
                  x2={other}
                  y2="115"
                  stroke="#6f8a60"
                  strokeWidth="2"
                />
              ))}
          {(choice === 'RNN' || choice === 'Mamba') && (
            <>
              <line x1={x} y1="35" x2={x} y2="115" stroke="#b6c5a9" strokeWidth="2" />
              {index < 4 && (
                <path
                  d={`M${x + 15},115 H${positions[index + 1] - 15}`}
                  stroke="#8e76b7"
                  strokeWidth={choice === 'Mamba' ? 5 : 2}
                />
              )}
            </>
          )}
          <circle cx={x} cy="35" r="14" fill="#e8efe2" stroke="#839d70" />
          <text x={x} y="40" textAnchor="middle" fontSize="13">
            {index + 1}
          </text>
          <circle cx={x} cy="115" r="16" fill="#e9e1f3" stroke="#ac98ca" />
        </g>
      ))}
      <text x="300" y="151" textAnchor="middle" fontSize="12">
        {choice === 'CNN'
          ? 'Reuse the same local filter'
          : choice === 'Mamba'
            ? 'Input-dependent updates carry a state →'
            : choice === 'RNN'
              ? 'Pass the state forward →'
              : choice === 'Transformer'
                ? 'Mix messages using input-dependent shares'
                : 'Every input connects to every output'}
      </text>
    </svg>
  );
}
