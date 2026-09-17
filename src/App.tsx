import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Cpu,
  FlaskConical,
  Code,
  Layers3,
  Leaf,
  Lightbulb,
  Maximize2,
  Menu,
  Minimize2,
  Radio,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import TinyLearner from './components/TinyLearner';
const BackpropJourney = lazy(() => import('./components/BackpropJourney'));
const GradientJourney = lazy(() => import('./components/GradientJourney'));
const ArchitectureJourney = lazy(() => import('./components/ArchitectureJourney'));
const PhysicalJourney = lazy(() => import('./components/PhysicalJourney'));
const ShortcutJourney = lazy(() => import('./components/ShortcutJourney'));
const PredictionJourney = lazy(() => import('./components/PredictionJourney'));
const ScaleLesson = lazy(() => import('./components/ScaleLesson'));

const chapters = [
  {
    id: 'one-weight',
    title: 'One tiny learner',
    note: 'Make a guess. Move one number.',
    time: '5 min',
    icon: Sparkles,
  },
  {
    id: 'gradient-descent',
    title: 'The blindfolded hiker',
    note: 'Why a slope tells us where to go',
    time: '6 min',
    icon: Leaf,
  },
  {
    id: 'neural-network',
    title: 'Follow one mistake',
    note: 'Forward, backward, then adjust',
    time: '8 min',
    icon: Layers3,
  },
  {
    id: 'shortcut',
    title: 'The shortcut detective',
    note: 'Right answer. Which clue?',
    time: '5 min',
    icon: FlaskConical,
  },
  {
    id: 'before-training',
    title: 'Can we know beforehand?',
    note: 'A mystery with missing clues',
    time: '7 min',
    icon: CircleHelp,
  },
  {
    id: 'architectures',
    title: 'Attention & a backpack',
    note: 'How information finds its way',
    time: '8 min',
    icon: Layers3,
  },
  {
    id: 'scale',
    title: 'From tiny to enormous',
    note: 'Count what grows. Keep the idea.',
    time: '5 min',
    icon: Cpu,
  },
  {
    id: 'physical',
    title: 'From numbers to electricity',
    note: 'What physically changes?',
    time: '6 min',
    icon: Zap,
  },
];
const legacyIds = ['one-weight', 'neural-network', 'shortcut', 'before-training', 'scale'];

function chapterFromHash() {
  const index = chapters.findIndex((chapter) => `#${chapter.id}` === window.location.hash);
  return index < 0 ? 0 : index;
}

function readProgress(): string[] {
  try {
    const stored = localStorage.getItem('hiaw-progress-v2');
    if (stored !== null) {
      const value: unknown = JSON.parse(stored);
      return Array.isArray(value)
        ? [
            ...new Set(
              value.filter(
                (id): id is string =>
                  typeof id === 'string' && chapters.some((chapter) => chapter.id === id),
              ),
            ),
          ]
        : [];
    }
    const legacy: unknown = JSON.parse(localStorage.getItem('hiaw-progress-v1') ?? '[]');
    return Array.isArray(legacy)
      ? [
          ...new Set(
            legacy
              .filter((n): n is number => Number.isInteger(n) && n >= 0 && n < legacyIds.length)
              .map((n) => legacyIds[n]),
          ),
        ]
      : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [chapter, setChapter] = useState(chapterFromHash);
  const [completed, setCompleted] = useState(readProgress);
  const [menuOpen, setMenuOpen] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const content = useRef<HTMLElement>(null);

  useEffect(() => {
    const change = () => {
      setChapter(chapterFromHash());
      setMenuOpen(false);
    };
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  useEffect(() => {
    document.title = `${chapters[chapter].title} · How it actually works`;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [chapter]);
  useEffect(() => {
    if (sourcesOpen) dialog.current?.showModal();
    else dialog.current?.close();
  }, [sourcesOpen]);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  function navigate(index: number) {
    window.location.hash = chapters[index].id;
    setChapter(index);
    setMenuOpen(false);
    content.current?.focus({ preventScroll: true });
  }
  function complete() {
    const next = [...new Set([...completed, chapters[chapter].id])];
    setCompleted(next);
    try {
      localStorage.setItem('hiaw-progress-v2', JSON.stringify(next));
    } catch {
      /* Progress is optional in private browsers. */
    }
    if (chapter < chapters.length - 1) navigate(chapter + 1);
  }

  return (
    <div className={`app-shell ${presenting ? 'is-presenting' : ''}`}>
      <a
        className="skip-link"
        href="#lesson-content"
        onClick={(event) => {
          event.preventDefault();
          content.current?.focus();
          content.current?.scrollIntoView();
        }}
      >
        Skip to lesson
      </a>
      {menuOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close lesson menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`} aria-label="Course navigation">
        <a className="brand" href="#one-weight" onClick={() => navigate(0)}>
          <span className="brand-mark">
            <Layers3 size={27} strokeWidth={1.5} />
          </span>
          <span>
            how it actually
            <br />
            <strong>
              works<span className="brand-dot">.</span>
            </strong>
          </span>
        </a>
        <div className="sidebar-intro">A field guide for curious minds.</div>
        <div className="sidebar-label">THE COLLECTION</div>
        <div className="collection-current">
          <span className="collection-icon">
            <Sparkles size={19} />
          </span>
          <div>
            <strong>Machine learning</strong>
            <span>Open the black box</span>
          </div>
          <ChevronRight size={16} />
        </div>
        <div className="sidebar-label chapter-label">
          YOUR LEARNING PATH <span>01—{String(chapters.length).padStart(2, '0')}</span>
        </div>
        <nav className="chapter-nav">
          {chapters.map((item, i) => (
            <button
              key={item.id}
              onClick={() => navigate(i)}
              aria-current={chapter === i ? 'step' : undefined}
              className={`chapter-link ${chapter === i ? 'active' : ''}`}
            >
              <span className={`chapter-number ${completed.includes(item.id) ? 'is-done' : ''}`}>
                {completed.includes(item.id) ? <Check size={14} /> : `0${i + 1}`}
              </span>
              <span>
                <strong>{item.title}</strong>
                <small>{item.note}</small>
              </span>
            </button>
          ))}
        </nav>
        <div className="course-progress">
          <div>
            <span>Your discoveries</span>
            <span>
              {completed.length} / {chapters.length}
            </span>
          </div>
          <div className="progress-track">
            <span style={{ width: `${(completed.length / chapters.length) * 100}%` }} />
          </div>
          <small>Go at your own pace. Stay curious.</small>
        </div>
        <div className="sidebar-future">
          <div className="sidebar-label">ON THE WORKBENCH</div>
          <p>
            <Zap size={16} /> Electricity & everyday things <span>SOON</span>
          </p>
          <p>
            <Cpu size={16} /> Inside your computer <span>SOON</span>
          </p>
          <p>
            <Radio size={16} /> Signals, sound & connection <span>SOON</span>
          </p>
        </div>
        <button className="field-notes" onClick={() => setSourcesOpen(true)}>
          <BookOpen size={17} />
          <span>Field notes & sources</span>
          <ArrowRight size={15} />
        </button>
        <div className="sidebar-bottom">
          <span className="small-dot" /> Built for the joy of understanding.
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Open lesson menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Menu size={21} />
            </button>
            <span>The learning lab</span>
            <ChevronRight size={14} />
            <strong>Machine learning</strong>
          </div>
          <div className="topbar-actions">
            <span className="local-badge">
              <span /> Runs in your browser
            </span>
            <button
              className="icon-button"
              aria-label={presenting ? 'Exit presentation mode' : 'Enter presentation mode'}
              title="Presentation mode"
              onClick={() => {
                setPresenting(!presenting);
                setMenuOpen(false);
              }}
            >
              {presenting ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button
              className="icon-button"
              aria-label="Open field notes and sources"
              onClick={() => setSourcesOpen(true)}
            >
              <CircleHelp size={19} />
            </button>
          </div>
        </header>
        <main className="main-content" id="lesson-content" ref={content} tabIndex={-1}>
          <div className="course-kicker">
            <span>
              <span className="tiny-star">✳</span> LESS SCROLLING PAST. MORE LOOKING INSIDE.
            </span>
            <span className="reading-time">
              <BookOpen size={13} /> {chapters[chapter].time} of curiosity
            </span>
          </div>
          <Suspense fallback={<p role="status">Opening this discovery…</p>}>
            <div key={chapter} className="lesson-body">
              {chapter === 0 && <TinyLearner onContinue={complete} />}
              {chapter === 1 && <GradientJourney />}
              {chapter === 2 && <BackpropJourney />}
              {chapter === 3 && <ShortcutJourney />}
              {chapter === 4 && <PredictionJourney />}
              {chapter === 5 && <ArchitectureJourney />}
              {chapter === 6 && <ScaleLesson />}
              {chapter === 7 && <PhysicalJourney />}
            </div>
          </Suspense>
          {chapter > 0 && (
            <div className="lesson-navigation">
              <button className="text-button" onClick={() => navigate(chapter - 1)}>
                ← Previous discovery
              </button>
              <button className="button primary" onClick={complete}>
                {chapter === chapters.length - 1
                  ? completed.includes(chapters[chapter].id)
                    ? 'Course explored'
                    : 'Mark course explored'
                  : 'Got it. Let’s keep going'}
                {chapter === chapters.length - 1 ? <Check size={16} /> : <ArrowRight size={16} />}
              </button>
            </div>
          )}
          {chapter === chapters.length - 1 && completed.length === chapters.length && (
            <div className="insight completion-note">
              <Leaf size={22} />
              <p>
                You opened the box. Try explaining one weight update to someone else—then come back
                and change an assumption.
              </p>
            </div>
          )}
          <footer className="page-footer">
            <span>Curiosity is the only prerequisite.</span>
            <span>
              HOW IT ACTUALLY WORKS <span className="footer-star">✳</span> VOL. 01
            </span>
          </footer>
        </main>
      </div>

      <dialog
        ref={dialog}
        className="notes-dialog"
        onCancel={() => setSourcesOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setSourcesOpen(false);
        }}
        aria-labelledby="notes-title"
      >
        <div className="panel-header">
          <span className="eyebrow">THE OPEN NOTEBOOK</span>
          <button
            className="icon-button"
            aria-label="Close field notes"
            onClick={() => setSourcesOpen(false)}
          >
            <X size={21} />
          </button>
        </div>
        <h2 id="notes-title">Nothing up our sleeves.</h2>
        <p>
          Every plotted prediction comes from the small models in this repository. No AI service,
          account, or GPU is needed. Training runs on your device; only your chapter progress is
          saved locally.
        </p>
        <div className="insight">
          <Lightbulb size={21} />
          <p>
            A toy model makes the calculation visible. It does not prove how every large model
            behaves. Each lesson separates a calculation, an experiment, and an assumption.
          </p>
        </div>
        <h3>Follow the evidence</h3>
        <ul className="source-list">
          <li>
            <a
              href="https://www.deeplearningbook.org/contents/ml.html"
              target="_blank"
              rel="noreferrer"
            >
              Deep Learning · Learning and generalization ↗
            </a>
            <span>Training error, unseen examples, and assumptions.</span>
          </li>
          <li>
            <a
              href="https://www.deeplearningbook.org/contents/optimization.html"
              target="_blank"
              rel="noreferrer"
            >
              Deep Learning · Optimization ↗
            </a>
            <span>Gradients, updates, and the difficulty of training.</span>
          </li>
          <li>
            <a href="https://arxiv.org/abs/1611.03530" target="_blank" rel="noreferrer">
              Understanding deep learning requires rethinking generalization ↗
            </a>
            <span>Fitting labels does not by itself explain generalization.</span>
          </li>
          <li>
            <a
              href="https://transformer-circuits.pub/2022/toy_model/index.html"
              target="_blank"
              rel="noreferrer"
            >
              Toy Models of Superposition ↗
            </a>
            <span>Why a neuron need not correspond to one human concept.</span>
          </li>
          <li>
            <a href="https://arxiv.org/abs/1706.03762" target="_blank" rel="noreferrer">
              Attention Is All You Need ↗
            </a>
            <span>The original Transformer architecture.</span>
          </li>
          <li>
            <a href="https://arxiv.org/abs/2312.00752" target="_blank" rel="noreferrer">
              Mamba: Linear-Time Sequence Modeling ↗
            </a>
            <span>Selective state spaces for sequences.</span>
          </li>
        </ul>
        <div className="notes-end">
          <Code size={18} />
          <span>
            Read the implementation in <code>src/lib/</code> and the full explanation in{' '}
            <code>docs/theory.md</code>.
          </span>
        </div>
        <button
          className="button"
          onClick={() => {
            setSourcesOpen(false);
            window.print();
          }}
        >
          <ArrowDownToLine size={16} /> Print / save this lesson as PDF
        </button>
      </dialog>
    </div>
  );
}
