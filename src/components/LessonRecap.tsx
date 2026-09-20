import { Lightbulb } from 'lucide-react';

const recaps: Record<string, { question: string; explanation: string }> = {
  'first-steps': {
    question: 'When Pip gets a new question, what stays the same?',
    explanation:
      'The saved dial stays the same. A new input gives a new guess. Only a practice update changes the dial.',
  },
  'gradient-descent': {
    question: 'Why can a small downhill step help, while a giant one goes wrong?',
    explanation:
      'The slope describes the ground near your feet. A small step uses that nearby clue. A giant step may jump past the low point or reach very different ground.',
  },
  'neural-network': {
    question: 'How can a mistake at the end help change a weight near the start?',
    explanation:
      'That weight affects a mixture, which affects the guess, which affects the mistake score. Backpropagation follows these links backward to calculate each weight’s effect. The update rule then changes the weights.',
  },
  'learned-features': {
    question: 'Who tells each hidden mixer what it should notice?',
    explanation:
      'We supply the final answers, not a separate answer for each mixer. The final mistake tells us how each weight affects the score. Changing those weights changes the messages inside, and some messages become useful to the final answer.',
  },
  'deep-networks': {
    question: 'What happens when every station passes on only half of a tiny change?',
    explanation:
      'The change shrinks again at every station: one half, one quarter, one eighth. Backpropagation also combines effects along paths. A bypass adds a direct route, but does not guarantee that learning will succeed.',
  },
  shortcut: {
    question: 'How could you check whether the model used the background?',
    explanation:
      'Keep the shape the same and change only its background. If the answer changes, the background affected this model’s answer. This tests a particular clue, not every possible explanation.',
  },
  'before-training': {
    question: 'Can two different rules give all the same practice answers?',
    explanation:
      'Yes. Matching the examples does not always tell us which rule is right elsewhere. A new observation or an extra assumption can help distinguish them. More calculation alone cannot supply a missing clue.',
  },
  architectures: {
    question: 'What is the difference between looking back and carrying a memory?',
    explanation:
      'Attention mixes information from the available word cards. A state update carries a compact memory onward and changes it with each new card. What is mixed, kept, or overwritten depends on the calculation.',
  },
  scale: {
    question: 'Does counting more weights tell us that a model will answer better?',
    explanation:
      'No. A count tells us how many numbers are stored. How well the model works also depends on the task, examples, training, and the questions used to test it.',
  },
  physical: {
    question: 'Does the electricity know which answer is right?',
    explanation:
      'No. Circuits follow program instructions to read numbers, calculate, and write new numbers. The examples and mistake rule define what the training program tries to improve.',
  },
  'research-paper': {
    question: 'What should you ask about an unfamiliar box in a model diagram?',
    explanation:
      'What goes in? What calculation happens? What comes out? Which numbers are learned, and how does the final mistake affect them? Then look for experiments that test the box’s claimed benefit.',
  },
};

export default function LessonRecap({ chapterId }: { chapterId: string }) {
  const recap = recaps[chapterId];
  if (!recap) return null;
  return (
    <section className="lesson-recap" aria-labelledby="recap-title">
      <div className="recap-icon">
        <Lightbulb size={24} aria-hidden="true" />
      </div>
      <div>
        <p className="eyebrow">A SMALL CHECK BEFORE YOU GO</p>
        <h2 id="recap-title">{recap.question}</h2>
        <p>Try saying it in your own words. You can revisit any step.</p>
        <details>
          <summary>Show a simple explanation</summary>
          <p>{recap.explanation}</p>
        </details>
      </div>
    </section>
  );
}
