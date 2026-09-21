import { useEffect, useId, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Code2,
  Copy,
  Gamepad2,
  Sigma,
} from 'lucide-react';
import './learning.css';

export type LearningMode = 'visual' | 'math' | 'code';

export function ModeSwitcher({
  value,
  onChange,
}: {
  value: LearningMode;
  onChange: (value: LearningMode) => void;
}) {
  const hintId = useId();
  const hints: Record<LearningMode, string> = {
    visual: 'Start here. Try one small action, then watch what changes.',
    math: 'Connect the picture to numbers. Take one calculation at a time.',
    code: 'Follow the highlighted lines. The complete example is yours to run.',
  };
  return (
    <div className="learning-mode-bar">
      <div className="learning-modes" role="group" aria-label="How would you like to learn?">
        {(
          [
            { id: 'visual', label: 'Play & see', note: 'Try the idea', icon: Gamepad2 },
            { id: 'math', label: 'Follow the math', note: 'See the numbers', icon: Sigma },
            { id: 'code', label: 'Read the code', note: 'Build it yourself', icon: Code2 },
          ] as const
        ).map(({ id, label, note, icon: Icon }) => (
          <button
            key={id}
            aria-label={label}
            aria-pressed={value === id}
            aria-describedby={value === id ? hintId : undefined}
            onClick={() => onChange(id)}
          >
            <Icon size={20} aria-hidden="true" />
            <span>
              <strong>{label}</strong>
              <small>{note}</small>
            </span>
          </button>
        ))}
      </div>
      <p id={hintId}>{hints[value]}</p>
    </div>
  );
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const changed = () => setReduced(media.matches);
    media.addEventListener('change', changed);
    return () => media.removeEventListener('change', changed);
  }, []);
  return reduced;
}

export function CodeWalkthrough({
  title,
  code,
  steps,
}: {
  title: string;
  code: string;
  steps: { label: string; explanation: string; lines: number[] }[];
}) {
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [wrapLines, setWrapLines] = useState(true);
  const source = useRef<HTMLPreElement>(null);
  const current = steps[Math.min(step, steps.length - 1)];
  const fileName = code.match(/Run: node (?:examples\/)?([^\s]+)/)?.[1] ?? 'learning-example.mjs';
  const lines = code.trimEnd().split('\n');
  useEffect(() => {
    setStep(0);
    setCopied(false);
    setCopyError(false);
  }, [code]);
  useEffect(() => {
    const viewport = source.current;
    const highlighted = viewport?.querySelector<HTMLElement>('.code-highlight');
    if (!viewport || !highlighted) return;
    const panel = viewport.getBoundingClientRect();
    const line = highlighted.getBoundingClientRect();
    if (line.top >= panel.top + 16 && line.bottom <= panel.bottom - 16) return;
    // Scroll only the source viewport, keeping the explanation and page in place.
    viewport.scrollTop += line.top - panel.top - 16;
  }, [step, code, wrapLines]);
  return (
    <section className="panel code-walkthrough" aria-label={title}>
      <div className="panel-header">
        <div>
          <span className="eyebrow">NO MACHINE-LEARNING LIBRARY</span>
          <h2>{title}</h2>
        </div>
        <button
          className="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              setCopyError(false);
            } catch {
              setCopyError(true);
            }
          }}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied' : 'Copy code'}
        </button>
      </div>
      <div className="code-explanation" aria-live="polite">
        <span className="guide-number">{step + 1}</span>
        <div>
          <h3>{current?.label}</h3>
          <p>{current?.explanation}</p>
        </div>
      </div>
      <div className="code-step-controls">
        <button className="button" disabled={step === 0} onClick={() => setStep(step - 1)}>
          <ChevronLeft size={16} />
          Previous part
        </button>
        <span>
          {step + 1} / {steps.length}
        </span>
        <button
          className="button"
          disabled={step >= steps.length - 1}
          onClick={() => setStep(step + 1)}
        >
          Next part
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="code-editor">
        <div className="code-file-bar">
          <span>
            <Code2 size={16} aria-hidden="true" />
            <strong>{fileName}</strong>
          </span>
          <span className="code-language">JavaScript · {lines.length} lines</span>
          <button type="button" aria-pressed={wrapLines} onClick={() => setWrapLines(!wrapLines)}>
            Wrap lines
          </button>
        </div>
        <pre
          ref={source}
          className={`source-code ${wrapLines ? 'source-wrap' : ''}`}
          tabIndex={0}
          aria-label="Runnable source code"
        >
          <code>
            {lines.map((line, index) => (
              <span
                key={index}
                className={`source-line ${current?.lines.includes(index + 1) ? 'code-highlight' : ''}`}
              >
                <span className="line-number" aria-hidden="true">
                  {index + 1}
                </span>
                <span
                  className={`line-text ${line.trimStart().startsWith('//') ? 'code-comment' : ''}`}
                >
                  {line || ' '}
                </span>
              </span>
            ))}
          </code>
        </pre>
      </div>
      <p className="code-note">
        <BookOpen size={16} />
        Each numbered row is one source line. Wrap lines fits long lines to the screen. Next part
        brings its highlighted lines into view. Copy code keeps the original indentation and line
        breaks. Save the complete code as {fileName} and run: node {fileName}.
      </p>
      {copyError && (
        <p role="status">Clipboard access is unavailable. Select the code above to copy it.</p>
      )}
      <details className="code-reading-help">
        <summary>First time reading JavaScript?</summary>
        <p>
          Read from top to bottom. <code>//</code> starts a note for humans. <code>const</code>{' '}
          names a value; <code>let</code> names one we may replace later. A <code>function</code> is
          a reusable recipe, and <code>return</code> gives its result. Square brackets hold a list;
          a <code>for</code> loop repeats instructions.
        </p>
        <p>
          This panel explains the program; Next part moves the explanation, without running code. To
          execute it, install Node.js, save the copied text using the filename above, and run the
          shown command in a terminal. It prints the calculated results there.
        </p>
      </details>
    </section>
  );
}
