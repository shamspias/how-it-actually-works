import { useEffect, useState } from 'react';
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
  return (
    <div className="learning-mode-bar">
      <span>CHOOSE YOUR WAY IN</span>
      <div className="learning-modes" role="group" aria-label="How would you like to learn?">
        {(
          [
            { id: 'visual', label: 'Play & see', icon: Gamepad2 },
            { id: 'math', label: 'Follow the math', icon: Sigma },
            { id: 'code', label: 'Read the code', icon: Code2 },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button key={id} aria-pressed={value === id} onClick={() => onChange(id)}>
            <Icon size={17} />
            {label}
          </button>
        ))}
      </div>
      <p>Same idea. Three ways to understand it.</p>
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
  const current = steps[Math.min(step, steps.length - 1)];
  const fileName = code.match(/Run: node (?:examples\/)?([^\s]+)/)?.[1] ?? 'learning-example.mjs';
  useEffect(() => {
    setStep(0);
    setCopied(false);
    setCopyError(false);
  }, [code]);
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
      <pre className="source-code" tabIndex={0} aria-label="Runnable source code">
        <code>
          {code
            .trimEnd()
            .split('\n')
            .map((line, index) => (
              <span
                key={index}
                className={current?.lines.includes(index + 1) ? 'code-highlight' : ''}
              >
                <span className="line-number" aria-hidden="true">
                  {index + 1}
                </span>
                <span>{line || ' '}</span>
                {'\n'}
              </span>
            ))}
        </code>
      </pre>
      <p className="code-note">
        <BookOpen size={16} />
        Highlighted lines belong to the current explanation. Save the complete code as {
          fileName
        }{' '}
        and run: node {fileName}.
      </p>
      {copyError && (
        <p role="status">Clipboard access is unavailable. Select the code above to copy it.</p>
      )}
    </section>
  );
}
