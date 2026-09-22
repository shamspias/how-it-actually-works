import { useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { cards, measure, update } from '../../examples/error-and-gradient.mjs';
import source from '../../examples/error-and-gradient.mjs?raw';
import { CodeWalkthrough } from './LearningModes';
import './gradient-compass.css';

const fmt = (n: number) => Number(n.toFixed(3)).toString();
type Direction = 'up' | 'down' | 'stay';

const explanations = [
  'A bigger dial makes the guess bigger. That brings this low guess closer to its target.',
  'Multiplying by a negative input reverses the effect. A bigger dial makes the guess smaller, even farther below its target.',
  'Every dial value multiplied by zero gives zero. Turning this dial cannot move the guess at all.',
];

export default function GradientCompass() {
  const [cardIndex, setCardIndex] = useState(0);
  const [previewed, setPreviewed] = useState(false);
  const [choice, setChoice] = useState<Direction | null>(null);
  const [saved, setSaved] = useState(false);
  const { input, target } = cards[cardIndex];
  const { before, after } = update(1, input, target);
  const preview = measure(1.1, input, target);
  const shown = saved ? after : previewed ? preview : before;
  const correct: Direction = before.gradient < 0 ? 'up' : before.gradient > 0 ? 'down' : 'stay';
  const reset = (index = cardIndex) => {
    setCardIndex(index);
    setPreviewed(false);
    setChoice(null);
    setSaved(false);
  };
  const location = (value: number) => `${((value + 3) / 8) * 100}%`;

  return (
    <section className="panel gradient-compass" aria-labelledby="compass-title">
      <p className="eyebrow">ONE MISSING LINK · TRY THREE CARDS</p>
      <h2 id="compass-title">A low guess. Which way should the dial turn?</h2>
      <p>
        Here is a new number machine: <strong>guess = dial × input</strong>. All three cards start
        two units below their target. Discover why the same mistake can need different moves. The
        dial is our one saved weight.
      </p>
      <div className="compass-cards" role="group" aria-label="Choose a connection">
        {cards.map((card, index) => (
          <button key={card.name} aria-pressed={cardIndex === index} onClick={() => reset(index)}>
            <span>Card {index + 1}</span>
            <strong>{card.name}</strong>
            <small>
              input {card.input} · target {card.target}
            </small>
          </button>
        ))}
      </div>

      <div className="compass-machine" aria-label="The multiplication machine">
        <div className="compass-dial">
          <span>{saved ? 'Saved dial' : previewed ? 'Preview dial' : 'Saved dial'}</span>
          <div className="compass-dial-face" aria-hidden="true">
            <span style={{ transform: `rotate(${(shown.weight - 1) * 100}deg)` }} />
          </div>
          <strong data-testid="compass-shown-weight">{fmt(shown.weight)}</strong>
        </div>
        <div className="compass-operation">
          <span>Multiply by input</span>
          <strong>× {input}</strong>
          <ArrowRight aria-hidden="true" size={23} />
        </div>
        <div className="compass-output">
          <span>{saved ? 'New guess' : previewed ? 'Preview guess' : 'Starting guess'}</span>
          <strong data-testid="compass-guess">{fmt(shown.guess)}</strong>
          <small>target {target}</small>
        </div>
      </div>
      <div
        className="compass-number-line"
        role="img"
        aria-label={`Guess ${fmt(shown.guess)}. Target ${target}. Number line from minus 3 to 5.`}
      >
        <div className="compass-target" style={{ left: location(target) }}>
          <span>target {target}</span>
        </div>
        <div className="compass-guess" style={{ left: location(shown.guess) }}>
          <span>guess {fmt(shown.guess)}</span>
        </div>
        <span className="compass-low">−3</span>
        <span className="compass-high">5</span>
      </div>

      <div className="compass-step">
        <h3>1. Turn the dial up. What happens to the guess?</h3>
        <p>Test 1 → 1.1 without saving it. Watch the guess move against the target marker.</p>
        <button className="button" disabled={saved} onClick={() => setPreviewed(!previewed)}>
          {previewed ? 'Show the starting guess again' : 'Preview a bigger dial'}
        </button>
        {previewed && !saved && (
          <p className="compass-feedback" role="status">
            {explanations[cardIndex]} Guess {fmt(before.guess)} → {fmt(preview.guess)}; loss{' '}
            {fmt(before.loss)} → {fmt(preview.loss)}. The saved dial is still 1.
          </p>
        )}
      </div>

      {previewed && (
        <div className="compass-step">
          <h3>2. Choose the program’s next dial move.</h3>
          <p>
            The saved guess is {fmt(before.guess)}, but we need {target}. Which move does gradient
            descent make from the saved dial of 1?
          </p>
          <div className="compass-choices" role="group" aria-label="Choose the dial update">
            {(['up', 'down', 'stay'] as const).map((direction) => (
              <button
                className="button"
                key={direction}
                aria-pressed={choice === direction}
                disabled={saved}
                onClick={() => setChoice(direction)}
              >
                {direction === 'up'
                  ? 'Increase dial ↑'
                  : direction === 'down'
                    ? 'Decrease dial ↓'
                    : 'Keep dial unchanged'}
              </button>
            ))}
          </div>
          {choice && !saved && (
            <p className="compass-feedback" role="status">
              {choice === correct
                ? correct === 'stay'
                  ? 'Yes. This weight receives a zero gradient, even though the answer is wrong.'
                  : 'Yes. The useful dial direction depends on what the dial does to the guess.'
                : correct === 'stay'
                  ? 'Try again: any dial × 0 is still 0. Neither dial direction can help.'
                  : `Try again: ${explanations[cardIndex]} Choose the move that brings the guess closer.`}
            </p>
          )}
          {choice === correct && !saved && (
            <button className="button primary" onClick={() => setSaved(true)}>
              Calculate and save this update <ArrowRight size={16} />
            </button>
          )}
        </div>
      )}

      {saved && (
        <div className="compass-receipt" role="status">
          <h3>3. See exactly why this weight changed.</h3>
          <ol>
            <li>
              <strong>How wrong?</strong> Guess − target = {fmt(before.error)}. The guess was too
              low.
            </li>
            <li>
              <strong>What does this dial do?</strong> A tiny dial change is multiplied by {input}{' '}
              on its way to the guess.
            </li>
            <li>
              <strong>Combine both clues.</strong> Gradient = {fmt(before.error)} × {input} ={' '}
              {fmt(before.gradient)}.
            </li>
            <li>
              <strong>Save the update.</strong> 1 − 0.1 × ({fmt(before.gradient)}) ={' '}
              <strong>{fmt(after.weight)}</strong>.
            </li>
          </ol>
          <p>
            Guess: {fmt(before.guess)} → {fmt(after.guess)}. Loss: {fmt(before.loss)} →{' '}
            {fmt(after.loss)}.
          </p>
          <p>
            {correct === 'stay'
              ? 'More training of this dial cannot fix this card. The formula needs another way to move the answer: for example, an added offset called a bias. You will meet biases in the next lesson.'
              : 'Error tells us how wrong the guess is. A gradient tells us how this particular weight affects the mistake score. Those are different numbers.'}
          </p>
          <button className="text-button" onClick={() => reset((cardIndex + 1) % cards.length)}>
            {cardIndex < 2 ? 'Try the next connection' : 'Replay from card 1'}{' '}
            <ArrowRight size={15} />
          </button>
        </div>
      )}

      <details className="compass-more">
        <summary>Follow the calculation, then run the same code</summary>
        <div>
          <p>
            Call the dial w, the input x, the target y, and the guess p. For this machine only, p =
            wx and L = ½(p − y)². The half-squared loss counts misses in either direction.
          </p>
          <p>
            <code>dL/dw = (dL/dp) × (dp/dw) = (p − y) × x</code>
          </p>
          <p>
            Read dL/dp as “how the loss changes for a tiny change in the guess.” Read dp/dw as “how
            the guess changes for a tiny change in the dial.” Multiplying these local effects is the
            chain rule. Backpropagation applies that idea along the paths in a network.
          </p>
          <p>
            Our +0.1 preview is a finite trial, not the exact derivative. The update uses the
            derivative at the saved weight. A rate of 0.1 improves both connected cards here; other
            formulas and step sizes can behave differently. Zero gradient is not proof of a correct
            answer or a global minimum in a general network.
          </p>
          <p>
            Run all three cards yourself: <code>node examples/error-and-gradient.mjs</code>.
          </p>
          <CodeWalkthrough
            title="examples/error-and-gradient.mjs"
            code={source}
            steps={[
              {
                label: 'Same error, different paths',
                explanation:
                  'Only input and target differ. All cards start with weight 1 and error −2.',
                lines: [3, 4, 5, 6, 7],
              },
              {
                label: 'Find this weight’s effect',
                explanation:
                  'Multiply the output error by the local effect of this multiplication: the input. This is the exact gradient of this half-squared loss.',
                lines: [10, 11, 12, 13, 14],
              },
              {
                label: 'Make one update',
                explanation:
                  'Measure before, subtract learning rate × gradient, then measure again. The browser calls these same functions.',
                lines: [18, 19, 20, 21, 22],
              },
            ]}
          />
        </div>
      </details>
      <button className="text-button" onClick={() => reset()}>
        <RotateCcw size={14} /> Reset this card
      </button>
    </section>
  );
}
