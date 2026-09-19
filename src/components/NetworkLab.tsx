import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  Download,
  Focus,
  Info,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  StepForward,
} from 'lucide-react';
import {
  ablateNetwork,
  accuracy,
  createDataset,
  createNetwork,
  forward,
  loss,
  parameterCount,
  traceExample,
  trainStep,
  type DatasetName,
  type Network,
  type Sample,
} from '../lib/network';

type Config = { dataset: DatasetName; hidden: number; seed: number; noise: number };
type HistoryPoint = { epoch: number; train: number; test: number };
const fmt = (value: number) => value.toFixed(4);
const percent = (value: number) => `${Math.round(value * 100)}%`;
const datasets: { id: DatasetName; title: string; subtitle: string; symbol: string }[] = [
  { id: 'line', title: 'A simple split', subtitle: 'Start here', symbol: '◩' },
  { id: 'xor', title: 'Opposite corners', subtitle: 'A hidden pattern', symbol: '▚' },
  { id: 'circle', title: 'Inside the circle', subtitle: 'A curved boundary', symbol: '◉' },
];

export default function NetworkLab() {
  const [config, setConfig] = useState<Config>({ dataset: 'xor', hidden: 8, seed: 42, noise: 0 });
  return (
    <>
      <div className="lesson-heading">
        <div className="eyebrow">
          EXPERIMENT 04 <span> / </span> CONNECT THE DOTS
        </div>
        <h1>
          A network comes <em>alive.</em>
        </h1>
        <p>
          A few numbers can learn a surprising pattern. Give them examples, press train, and look
          inside every prediction.
        </p>
      </div>
      <NetworkExperiment key={JSON.stringify(config)} config={config} onConfig={setConfig} />
    </>
  );
}

function NetworkExperiment({
  config,
  onConfig,
}: {
  config: Config;
  onConfig: (config: Config) => void;
}) {
  const trainData = useMemo(
    () => createDataset(config.dataset, 120, 123, config.noise),
    [config.dataset, config.noise],
  );
  const testData = useMemo(() => createDataset(config.dataset, 200, 987), [config.dataset]);
  const initial = useMemo(
    () => createNetwork(config.hidden, config.seed),
    [config.hidden, config.seed],
  );
  const [state, setState] = useState(() => ({
    network: initial,
    epoch: 0,
    history: [
      { epoch: 0, train: loss(initial, trainData), test: loss(initial, testData) },
    ] as HistoryPoint[],
    last: null as null | { before: Network; gradients: Network; rate: number },
  }));
  const [running, setRunning] = useState(false);
  const [rate, setRate] = useState(0.4);
  const [selected, setSelected] = useState(0);
  const [neuron, setNeuron] = useState(0);
  const [ablated, setAblated] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [notice, setNotice] = useState('');
  const viewedNetwork = useMemo(
    () => (ablated ? ablateNetwork(state.network, neuron) : state.network),
    [state.network, neuron, ablated],
  );
  const sample = (showTest ? testData : trainData)[selected];
  const trace = traceExample(viewedNetwork, sample);
  const current = state.history[state.history.length - 1];

  function advance(count: number) {
    setState((previous) => {
      let network = previous.network;
      let last = previous.last;
      const steps = Math.min(count, 2400 - previous.epoch);
      if (steps <= 0) return previous;
      for (let i = 0; i < steps; i++) {
        const result = trainStep(network, trainData, rate);
        last = { before: network, gradients: result.gradients, rate };
        network = result.network;
      }
      const epoch = previous.epoch + steps;
      return {
        network,
        epoch,
        last,
        history: [
          ...previous.history,
          { epoch, train: loss(network, trainData), test: loss(network, testData) },
        ],
      };
    });
  }
  useEffect(() => {
    if (!running || state.epoch >= 2400) return;
    const timer = window.setInterval(() => advance(12), 70);
    return () => window.clearInterval(timer);
    // The functional state update uses the latest network; a rate change recreates the timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, rate, state.epoch >= 2400]);

  function reset() {
    setRunning(false);
    setAblated(false);
    setNotice('');
    setState({
      network: initial,
      epoch: 0,
      history: [{ epoch: 0, train: loss(initial, trainData), test: loss(initial, testData) }],
      last: null,
    });
  }
  function exportExperiment() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            schemaVersion: 1,
            config,
            learningRate: rate,
            epoch: state.epoch,
            network: state.network,
            trainingData: trainData,
            heldOutData: testData,
            history: state.history,
            note: 'Full-batch gradient descent; tanh hidden units, sigmoid output, mean binary cross-entropy. History records displayed checkpoints, not every update. Ablation is a temporary view and is not exported.',
          },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learning-lab-${config.dataset}-seed-${config.seed}.json`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice('Experiment downloaded: weights, examples, settings, and measured history.');
  }

  return (
    <>
      <div className="experiment-banner">
        <span className="experiment-dot" />
        <span>
          <strong>Your mission</strong> Help a tiny network separate purple dots from green
          diamonds.
        </span>
        <span className="pill">REAL TRAINING · NO GPU</span>
      </div>
      <div className="network-workspace">
        <section className="panel network-settings" aria-labelledby="setup-title">
          <div className="panel-header">
            <h2 id="setup-title">
              <SlidersHorizontal size={17} /> Set the experiment
            </h2>
            <span className="step-tag">01</span>
          </div>
          <label className="control-label">What pattern should it learn?</label>
          <div className="dataset-options">
            {datasets.map((dataset) => (
              <button
                key={dataset.id}
                aria-pressed={config.dataset === dataset.id}
                className={`dataset-option ${config.dataset === dataset.id ? 'selected' : ''}`}
                onClick={() => onConfig({ ...config, dataset: dataset.id })}
              >
                <span className="dataset-symbol">{dataset.symbol}</span>
                <span>
                  <strong>{dataset.title}</strong>
                  <small>{dataset.subtitle}</small>
                </span>
              </button>
            ))}
          </div>
          <div className="control-group">
            <label htmlFor="hidden-units">
              Hidden neurons <strong>{config.hidden}</strong>
            </label>
            <input
              id="hidden-units"
              type="range"
              min="1"
              max="8"
              step="1"
              value={config.hidden}
              onChange={(e) => onConfig({ ...config, hidden: +e.target.value })}
            />
            <div className="range-ends">
              <span>One simple feature</span>
              <span>More ways to bend</span>
            </div>
          </div>
          <div className="control-group">
            <label htmlFor="network-rate">
              Learning rate <strong>{rate.toFixed(2)}</strong>
            </label>
            <input
              id="network-rate"
              type="range"
              min="0.01"
              max="1"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(+e.target.value)}
            />
            <small className="muted">How far to move each number per update.</small>
          </div>
          <div className="settings-row">
            <label htmlFor="label-noise">Wrong training labels</label>
            <select
              id="label-noise"
              value={config.noise}
              onChange={(e) => onConfig({ ...config, noise: +e.target.value })}
            >
              <option value="0">None</option>
              <option value="0.15">15% chance</option>
              <option value="0.35">35% chance</option>
            </select>
          </div>
          <div className="settings-row">
            <span>Starting numbers</span>
            <button
              className="text-button seed-button"
              onClick={() => onConfig({ ...config, seed: config.seed + 1 })}
            >
              Seed {config.seed} <RotateCcw size={12} />
            </button>
          </div>
          <p className="micro-note">
            Changing data, neuron count, or seed starts a fresh experiment. Only the learning rate
            can change mid-run.
          </p>
        </section>

        <section className="panel boundary-panel" aria-labelledby="boundary-title">
          <div className="panel-header">
            <div>
              <h2 id="boundary-title">The world it is learning</h2>
              <p className="muted">Background = the network’s current guess</p>
            </div>
            <span className="step-tag">02</span>
          </div>
          <div className="segmented" aria-label="Examples to display">
            <button
              aria-pressed={!showTest}
              onClick={() => {
                setShowTest(false);
                setSelected(0);
              }}
            >
              Training examples
            </button>
            <button
              aria-pressed={showTest}
              onClick={() => {
                setShowTest(true);
                setSelected(0);
              }}
            >
              Unseen examples
            </button>
          </div>
          <Boundary
            network={viewedNetwork}
            data={showTest ? testData : trainData}
            selected={selected}
            onSelect={setSelected}
          />
          <div className="plot-legend">
            <span>
              <i className="legend-dot purple" /> Purple · 0
            </span>
            <span>
              <i className="legend-diamond" /> Green · 1
            </span>
            <span className="muted">Click a point to inspect</span>
          </div>
          <div className="training-controls">
            <button
              className="button primary"
              onClick={() => {
                setAblated(false);
                setRunning(!running);
              }}
              disabled={state.epoch >= 2400}
            >
              {running && state.epoch < 2400 ? (
                <Pause size={16} />
              ) : (
                <Play size={16} fill="currentColor" />
              )}
              {running && state.epoch < 2400
                ? 'Pause training'
                : state.epoch >= 2400
                  ? 'Run complete'
                  : 'Train the network'}
            </button>
            <button
              className="icon-button bordered"
              aria-label="One network training step"
              disabled={running || state.epoch >= 2400}
              onClick={() => {
                setAblated(false);
                advance(1);
              }}
            >
              <StepForward size={18} />
            </button>
            <button className="icon-button bordered" aria-label="Reset network" onClick={reset}>
              <RotateCcw size={17} />
            </button>
          </div>
          <div className="epoch-row">
            <span>
              <span className={`status-dot ${running && state.epoch < 2400 ? 'live' : ''}`} />
              {running && state.epoch < 2400
                ? 'Learning from 120 examples'
                : state.epoch >= 2400
                  ? '2,400 updates completed'
                  : 'Ready when you are'}
            </span>
            <span>
              Update <strong data-testid="network-epoch">{state.epoch}</strong> / 2,400
            </span>
          </div>
        </section>

        <section className="panel inside-panel" aria-labelledby="inside-title">
          <div className="panel-header">
            <div>
              <h2 id="inside-title">Open the little black box</h2>
              <p className="muted">Two inputs → {config.hidden} neurons → one guess</p>
            </div>
            <span className="step-tag">03</span>
          </div>
          <NetworkDiagram
            network={viewedNetwork}
            sample={sample}
            activeNeuron={neuron}
            onNeuron={setNeuron}
          />
          <div className="wire-legend">
            <span>
              <i style={{ background: '#9279c6' }} /> Positive weight
            </span>
            <span>
              <i style={{ background: '#468d78' }} /> Negative weight
            </span>
          </div>
          <div className="prediction-card">
            <span>For this point, the network predicts</span>
            <strong className={trace.prediction >= 0.5 ? 'green-text' : 'purple-text'}>
              {percent(trace.prediction)} <small>green</small>
            </strong>
            <span>
              The supplied label is <b>{sample.label === 1 ? 'green ◆' : 'purple ●'}</b>.{' '}
              {config.noise > 0 && !showTest ? 'Training labels may be flipped.' : ''}
            </span>
          </div>
          <div className="neuron-inspector">
            <div>
              <Focus size={15} />
              <label htmlFor="neuron-inspect">Look at neuron</label>
              <select
                id="neuron-inspect"
                value={neuron}
                onChange={(e) => setNeuron(+e.target.value)}
              >
                {Array.from({ length: config.hidden }, (_, i) => (
                  <option key={i} value={i}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>
            <p>
              Activation <strong>{fmt(trace.hiddenActivations[neuron])}</strong>{' '}
              <span className="muted">·</span> output weight{' '}
              <strong>{fmt(viewedNetwork.w2[neuron])}</strong>
            </p>
            <button
              className={`button small ${ablated ? 'ablation-active' : ''}`}
              aria-pressed={ablated}
              onClick={() => {
                setRunning(false);
                setAblated(!ablated);
              }}
            >
              {ablated ? 'Reconnect this neuron' : 'Disconnect this neuron'}
            </button>
            <small className="muted">
              Pause and remove its contribution. Does the prediction change? Original weights are
              preserved.
            </small>
          </div>
        </section>
      </div>

      <div className="network-results">
        <section className="panel loss-panel">
          <div className="panel-header">
            <h2>Is it getting better?</h2>
            <span className="muted">Lower mistake score is better</span>
          </div>
          <LossChart history={state.history} />
          <div className="plot-legend">
            <span>
              <i className="legend-line purple" /> Training loss
            </span>
            <span>
              <i className="legend-line green" /> Unseen loss
            </span>
          </div>
        </section>
        <section className="panel metrics-panel">
          <div className="stat-grid">
            <div className="stat">
              <span>Training accuracy</span>
              <strong data-testid="training-accuracy">
                {percent(accuracy(viewedNetwork, trainData))}
              </strong>
              <small>Examples it learns from</small>
            </div>
            <div className="stat">
              <span>Unseen accuracy</span>
              <strong data-testid="unseen-accuracy">
                {percent(accuracy(viewedNetwork, testData))}
              </strong>
              <small>200 separate, clean examples</small>
            </div>
            <div className="stat">
              <span>Training loss</span>
              <strong>{fmt(loss(viewedNetwork, trainData))}</strong>
              <small>Mean binary cross-entropy</small>
            </div>
            <div className="stat">
              <span>Adjustable numbers</span>
              <strong>{parameterCount(config.hidden)}</strong>
              <small>All weights and biases</small>
            </div>
          </div>
          <p className="micro-note">
            {ablated
              ? 'Accuracy and training-loss numbers include the disconnection. Curves show the original training run.'
              : `Latest unseen loss: ${fmt(current.test)}. The unseen set never supplies a gradient. Because you can tune against it here, treat it as a validation set—not a final test.${config.noise > 0 ? ' With noisy training labels and clean unseen labels, their loss gap also reflects different label distributions.' : ''}`}
          </p>
        </section>
      </div>

      <div className="insight">
        <Info size={21} />
        <p>
          <strong>There is no little thinker inside.</strong> Each hidden neuron multiplies, adds,
          and bends a number with tanh; the output uses sigmoid. Training adjusts those multipliers
          to reduce mistakes. Useful behavior emerges from their combined calculation; one neuron
          need not mean one human idea.
        </p>
      </div>
      <details className="panel math-details">
        <summary>
          Follow one mistake backward{' '}
          <span>
            THE EXACT CALCULATION <ArrowDown size={15} />
          </span>
        </summary>
        <div className="details-body">
          <p>
            For the selected {showTest ? 'unseen' : 'training'} point, x = {fmt(sample.x)}, y ={' '}
            {fmt(sample.y)}, and label t = {sample.label}. Here y is the second coordinate, not the
            label. These numbers describe the{' '}
            <strong>current {ablated ? 'disconnected' : ''} network</strong>.{' '}
            {showTest
              ? 'This derivative is shown for explanation only; this point is never used to update weights.'
              : 'A training update averages derivatives over all 120 training points.'}
          </p>
          <div className="math-flow">
            <div>
              <span>1 · Predict</span>
              <code>h = tanh(wₓx + wᵧy + b)</code>
              <code>p = sigmoid(Σ vⱼhⱼ + c) = {fmt(trace.prediction)}</code>
            </div>
            <ArrowRight size={20} />
            <div>
              <span>2 · Measure the mistake</span>
              <code>L = −[t ln(p) + (1−t) ln(1−p)]</code>
              <code>L = {fmt(trace.exampleLoss)}</code>
            </div>
            <ArrowRight size={20} />
            <div>
              <span>3 · Send sensitivity backward</span>
              <code>∂L/∂z = p − t = {fmt(trace.outputError)}</code>
              <code>
                ∂L/∂v{neuron + 1} = (p−t)h = {fmt(trace.gradients.w2[neuron])}
              </code>
            </div>
          </div>
          <p>
            The hidden neuron gets its share through the chain rule:{' '}
            <code>∂L/∂wₓ = (p−t) × v × (1−h²) × x = {fmt(trace.gradients.w1[neuron][0])}</code>. The
            derivative tells us how a tiny change to this weight changes this mistake score, with
            all other weights fixed.
          </p>
          {state.last && (
            <div className="formula">
              <strong>Last actual update · output weight of neuron {neuron + 1}</strong>
              <p>
                {fmt(state.last.before.w2[neuron])} − {state.last.rate.toFixed(2)} ×{' '}
                {fmt(state.last.gradients.w2[neuron])} = {fmt(state.network.w2[neuron])}
              </p>
              <small>
                The displayed derivative is the batch average at the previous weights. The rate
                shown was used in this update; changing the slider affects the next update only.
              </small>
            </div>
          )}
          <p className="muted">
            A derivative is local guidance. It does not promise that a large jump improves the loss
            or that a lower training loss means better future predictions.
          </p>
        </div>
      </details>
      <div className="lab-takeaways">
        <div>
          <span className="eyebrow">TRY A SMALL EXPERIMENT</span>
          <h3>Change one thing. Follow the consequence.</h3>
          <p>
            Try one neuron on opposite corners, then eight. Add wrong labels. Change the seed. Watch
            how the learned boundary and unseen score respond.
          </p>
        </div>
        <button className="button" onClick={exportExperiment}>
          <Download size={16} /> Save experiment
        </button>
      </div>
      <p className="download-notice" role="status">
        {notice}
      </p>
    </>
  );
}

function Boundary({
  network,
  data,
  selected,
  onSelect,
}: {
  network: Network;
  data: Sample[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  const cells = useMemo(
    () =>
      Array.from({ length: 32 * 32 }, (_, index) => {
        const col = index % 32,
          row = Math.floor(index / 32);
        const p = forward(network, { x: (col + 0.5) / 16 - 1, y: 1 - (row + 0.5) / 16 }).prediction;
        const purple = [221, 211, 242],
          green = [190, 223, 207];
        const color = purple.map((value, i) => Math.round(value * (1 - p) + green[i] * p));
        return (
          <rect
            key={index}
            x={32 + col * 9}
            y={12 + row * 9}
            width="9.2"
            height="9.2"
            fill={`rgb(${color.join(',')})`}
          />
        );
      }),
    [network],
  );
  return (
    <svg
      className="boundary-svg"
      viewBox="0 0 344 334"
      role="group"
      aria-label="Network decision map. Select an example to inspect its prediction."
    >
      <title>Network predictions across two input coordinates</title>
      <desc>
        Purple circles have label zero. Green diamonds have label one. The background blends from
        purple to green as predicted probability of green increases.
      </desc>
      <defs>
        <clipPath id="boundary-clip">
          <rect x="32" y="12" width="288" height="288" rx="5" />
        </clipPath>
      </defs>
      <g clipPath="url(#boundary-clip)">
        {cells}
        <path d="M176 12V300 M32 156H320" stroke="#fff" strokeOpacity=".65" strokeDasharray="3 4" />
        {data.map((point, index) => {
          const x = 32 + (point.x + 1) * 144,
            y = 12 + (1 - point.y) * 144;
          return (
            <g
              key={index}
              className="data-point"
              role="button"
              tabIndex={index === selected ? 0 : -1}
              aria-label={`Example ${index + 1}: ${point.label ? 'green' : 'purple'}. Select with arrow keys.`}
              onClick={() => onSelect(index)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(index);
                }
                if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                  event.preventDefault();
                  const next =
                    (index + (event.key === 'ArrowRight' ? 1 : -1) + data.length) % data.length;
                  onSelect(next);
                  event.currentTarget.parentElement
                    ?.querySelectorAll<SVGElement>('.data-point')
                    [next]?.focus();
                }
              }}
            >
              {index === selected && (
                <circle cx={x} cy={y} r="9" fill="none" stroke="#293d35" strokeWidth="1.5" />
              )}
              {point.label ? (
                <rect
                  x={x - 3.6}
                  y={y - 3.6}
                  width="7.2"
                  height="7.2"
                  transform={`rotate(45 ${x} ${y})`}
                  fill="#34755f"
                  stroke="white"
                  strokeWidth="1.2"
                />
              ) : (
                <circle cx={x} cy={y} r="4.2" fill="#8560b5" stroke="white" strokeWidth="1.2" />
              )}
            </g>
          );
        })}
      </g>
      <g className="axis-label">
        <text x="32" y="317" textAnchor="middle">
          −1
        </text>
        <text x="176" y="317" textAnchor="middle">
          0
        </text>
        <text x="320" y="317" textAnchor="middle">
          1
        </text>
        <text x="176" y="332" textAnchor="middle">
          Input x
        </text>
        <text x="22" y="16" textAnchor="end">
          1
        </text>
        <text x="22" y="160" textAnchor="end">
          0
        </text>
        <text x="22" y="302" textAnchor="end">
          −1
        </text>
        <text x="9" y="156" transform="rotate(-90 9 156)" textAnchor="middle">
          Input y
        </text>
      </g>
    </svg>
  );
}

function NetworkDiagram({
  network,
  sample,
  activeNeuron,
  onNeuron,
}: {
  network: Network;
  sample: Sample;
  activeNeuron: number;
  onNeuron: (n: number) => void;
}) {
  const values = forward(network, sample);
  const neuronY = (index: number) =>
    network.hidden === 1 ? 136 : 42 + index * (188 / (network.hidden - 1));
  const lineColor = (weight: number) => (weight >= 0 ? '#9279c6' : '#468d78');
  return (
    <svg
      viewBox="0 0 300 266"
      className="network-svg"
      role="group"
      aria-label="Interactive neural network. Choose a hidden neuron to inspect."
    >
      <title>Actual weights and activations for the selected point</title>
      <g className="diagram-label">
        <text x="35" y="17" textAnchor="middle">
          INPUTS
        </text>
        <text x="150" y="17" textAnchor="middle">
          HIDDEN LAYER
        </text>
        <text x="265" y="17" textAnchor="middle">
          OUTPUT
        </text>
      </g>
      {network.w1.map((weights, i) => (
        <g key={i}>
          {weights.map((w, j) => (
            <line
              key={j}
              x1="49"
              y1={j === 0 ? 104 : 171}
              x2="136"
              y2={neuronY(i)}
              stroke={lineColor(w)}
              strokeWidth={Math.min(3, 0.5 + Math.abs(w) * 0.5)}
              opacity={i === activeNeuron ? 0.95 : 0.24}
            />
          ))}
          <line
            x1="164"
            y1={neuronY(i)}
            x2="247"
            y2="136"
            stroke={lineColor(network.w2[i])}
            strokeWidth={Math.min(4, 0.6 + Math.abs(network.w2[i]) * 0.6)}
            opacity={i === activeNeuron ? 0.95 : 0.24}
          />
        </g>
      ))}
      {[sample.x, sample.y].map((v, i) => (
        <g key={i}>
          <circle cx="35" cy={i === 0 ? 104 : 171} r="18" fill="#f3f4ef" stroke="#ccd5cb" />
          <text x="35" y={i === 0 ? 108 : 175} textAnchor="middle" className="node-value">
            {v.toFixed(1)}
          </text>
          <text x="35" y={i === 0 ? 81 : 202} textAnchor="middle" className="axis-label">
            {i === 0 ? 'x' : 'y'}
          </text>
        </g>
      ))}
      {values.hidden.map((v, i) => (
        <g
          key={i}
          role="button"
          tabIndex={0}
          className="neuron-node"
          aria-label={`Inspect neuron ${i + 1}, activation ${v.toFixed(3)}`}
          onClick={() => onNeuron(i)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onNeuron(i);
            }
          }}
        >
          <circle
            cx="150"
            cy={neuronY(i)}
            r="12"
            fill={
              v > 0
                ? `rgba(139,106,189,${0.15 + Math.abs(v) * 0.6})`
                : `rgba(59,132,104,${0.15 + Math.abs(v) * 0.6})`
            }
            stroke={i === activeNeuron ? '#273e34' : '#bfc5bc'}
            strokeWidth={i === activeNeuron ? 2 : 1}
          />
          <text x="150" y={neuronY(i) + 3.5} textAnchor="middle" className="node-value">
            {i + 1}
          </text>
        </g>
      ))}
      <circle
        cx="265"
        cy="136"
        r="22"
        fill={values.prediction >= 0.5 ? '#d6eadc' : '#e6ddf2'}
        stroke={values.prediction >= 0.5 ? '#58977b' : '#a084bc'}
      />
      <text x="265" y="140" textAnchor="middle" className="node-value">
        {percent(values.prediction)}
      </text>
      <text x="265" y="174" textAnchor="middle" className="axis-label">
        green
      </text>
      <text x="150" y="258" textAnchor="middle" className="axis-label">
        Thicker connection = larger |weight|
      </text>
    </svg>
  );
}

function LossChart({ history }: { history: HistoryPoint[] }) {
  const maxX = Math.max(100, history[history.length - 1].epoch),
    maxY = Math.max(0.8, ...history.flatMap((p) => [p.train, p.test])) * 1.1;
  const path = (key: 'train' | 'test') =>
    history
      .map(
        (p, index) =>
          `${index ? 'L' : 'M'}${40 + (p.epoch / maxX) * 440},${130 - (p[key] / maxY) * 112}`,
      )
      .join(' ');
  return (
    <svg
      className="loss-svg"
      viewBox="0 0 506 161"
      role="img"
      aria-label={`Measured loss over ${history[history.length - 1].epoch} training updates`}
    >
      <title>Training and unseen loss over time</title>
      {[0, 0.5, 1].map((t) => (
        <g key={t}>
          <line
            x1="40"
            y1={130 - t * 112}
            x2="480"
            y2={130 - t * 112}
            stroke="#e6e9e1"
            strokeDasharray="3 4"
          />
          <text x="30" y={134 - t * 112} textAnchor="end" className="axis-label">
            {(t * maxY).toFixed(1)}
          </text>
        </g>
      ))}
      <path d={path('train')} fill="none" stroke="#8b70bd" strokeWidth="2.5" />
      <path d={path('test')} fill="none" stroke="#3c8a6d" strokeWidth="2" strokeDasharray="5 3" />
      {history.length === 1 && (
        <circle cx="40" cy={130 - (history[0].train / maxY) * 112} r="3" fill="#8b70bd" />
      )}
      <text x="40" y="151" className="axis-label">
        0
      </text>
      <text x="260" y="151" textAnchor="middle" className="axis-label">
        Training updates
      </text>
      <text x="480" y="151" textAnchor="end" className="axis-label">
        {maxX}
      </text>
    </svg>
  );
}
