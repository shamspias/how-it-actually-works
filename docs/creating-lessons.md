# Creating the next lesson

A good lesson lets someone make a prediction, change something, and explain what happened. Begin with one mechanism: a capacitor charging, a memory cell retaining a bit, a microphone turning motion into a signal, or a weight moving after an error. The bigger system can come later.

## Start with a question you can test

Write one sentence describing the uncertainty: “Why does changing this number improve the guess?” is easier to build around than “Explain all of machine learning.” Then specify:

- **The learner's action:** move a slider, step a process, change one example, disconnect one component.
- **The observable consequence:** a value changes, a graph bends, an error grows, or a prediction flips.
- **The mechanism:** the smallest explicit calculation or state transition producing that consequence.
- **The boundary of the explanation:** which assumptions make it work, and what the simplification leaves out.

Begin with an action the learner already understands. Introduce its technical name after the learner can describe the action. [FirstSteps.tsx](../src/components/FirstSteps.tsx) does this with a watering dial: only after practice does it name input, target, weight, training, and inference.

Use a familiar analogy if it helps, then connect each part to a concrete quantity. Make clear where the analogy ends. A neuron is not a little person making a decision; a transistor sketch is not a complete circuit simulator.

## Build outward from inspectable code

Keep the calculation separate from its presentation. Existing examples are [the scalar learner](../src/lib/scalar.ts), [the network engine](../src/lib/network.ts), and [the attention and memory calculations](../src/lib/sequence.ts). The guided backpropagation, [feature-learning](../src/lib/features.ts), and [deep-network](../src/lib/deep.ts) lessons import their arithmetic from the same standalone programs shown in the code view. This makes the copyable calculation and the visual experiment agree by construction.

1. Put a small, documented engine in `src/lib/your-mechanism.ts`. State units, signs, initial conditions, and the meaning of every parameter.
2. Use seeded generation when randomness is part of the experiment. Record the seed and make reset return to a known state.
3. Return the intermediate values the learner needs to inspect. Preserve the old state if the UI explains a previous update.
4. Build `src/components/YourLesson.tsx` around those values. Derive graphs, counters, equations, and exports from the same state.
5. Give the chapter the three shared learning modes using `ModeSwitcher` from [LearningModes.tsx](../src/components/LearningModes.tsx): **Play & see**, **Follow the math**, and **Read the code**.
6. In the visual mode, reveal one action at a time: a prediction, a change, then a short explanation of its consequence. Aim for one question and at most two short paragraphs in the initial scene. Make deeper controls optional rather than showing every setting at once. A correct prediction is useful, but an incorrect prediction should explain which observation to revisit.
7. In the math mode, map every symbol to the visible mechanism. Show a worked calculation before introducing a general formula, and state where a derivative or guarantee applies.
8. In the code mode, use `CodeWalkthrough` to explain small groups of lines. Put complete runnable programs in `examples/`, load their actual source with `?raw`, and point learners to the exact command. A snippet that depends on undefined variables is not a standalone example.

New `examples/*.mjs` demonstrations are picked up by `make examples`; files ending in `.test.mjs` are excluded from that runner. Keep scripts suitable for direct Node execution with no ML packages. If a code example simplifies a larger browser experiment, explain the difference rather than implying their measured scores must match.

Avoid hardcoded “training” curves or percentages that merely imitate a process. A conceptual diagram can be static, but call it a schematic. If an approximation is useful, name it and explain its operating range.

For numerical work, guard invalid inputs and unstable states. Show a useful reset message rather than leaving `NaN` on screen. Stop animation timers when a lesson unmounts and pause playback when switching learning modes. Respect reduced-motion preferences and provide manual stepping. An animation should help a viewer follow the sequence; it should not change the underlying answer.

## Add the chapter to navigation

The current chapter registry lives in [src/App.tsx](../src/App.tsx). The implementation is intentionally small: a `chapters` array supplies the labels and hash routes, while rendering branches keyed by the stable chapter ID select components. Heavier chapters load lazily. Do not use a chapter’s numerical position as its component identity.

To extend it:

1. Import the new component and add a chapter entry with a unique, stable `id`, title, short description, reading time, and icon.
2. Add the component to the corresponding rendering branch. Check the previous/next flow and the direct `#chapter-id` URL.
3. Keep progress text, completion messages, and previous/next controls derived from `chapters.length`. The current course contains twelve chapters, grouped into starting with one change, building and testing patterns, and reading bigger machines.
4. Preserve saved progress. It now stores stable string IDs under `hiaw-progress-v2`; inserting a chapter must not change existing IDs. The `legacyIds` list maps numeric `hiaw-progress-v1` entries to their original five chapter IDs. Do not reorder that historical mapping when the current course changes. If you rename an ID, add and test an explicit migration.
5. Add a short transition explaining why this chapter follows the previous one. Update the README, relevant reference notes, browser tests, and recording outline. Check all three modes at the new hash route.
6. Add new vocabulary to [WordHelp.tsx](../src/components/WordHelp.tsx) when needed. Its searchable **Explain a word** dialog is a shared fallback, not a reason to fill the first scene with unexplained terms.

The current route order is:

```text
first-steps → one-weight → gradient-descent → neural-network
→ learned-features → deep-networks → shortcut → before-training
→ architectures → scale → physical → research-paper
```

For a new collection, such as computer hardware, give it a separate lesson list and route namespace. The sidebar's “on the workbench” entries are currently roadmap labels. Do not make a future collection look runnable until its first lesson exists.

## Make the experiment usable

Give every control a clear label and a sensible default. Someone should be able to get their first meaningful result with one obvious action. Keep reset visible and distinguish changing the experiment from changing its current state.

Use native buttons, inputs, selects, and expandable sections where possible. SVG diagrams need a title and description. If a point or node is selectable, provide a keyboard route to it; an HTML selector can complement the graphic. Do not communicate a class or state through color alone. Use text, shape, or line style as well.

Check narrow layouts, long labels, zoom, keyboard focus, and reduced-motion preferences. A detailed arithmetic table may scroll within its own container; the whole page should not require horizontal scrolling. A paused or completed state should be understandable without watching the preceding animation.

Make the math match the moment being described. A “last update” panel needs the weight, gradient, and learning rate from that update, even if the learner subsequently moves the rate slider. Rounded values should be identified as rounded. With multiple examples, distinguish a single-example derivative from the batch average used for training.

## Test the claim, then the interaction

Tests should catch mistakes in the mechanism, not repeat its source code in another spelling. Useful examples include:

- Compare an analytic gradient with an independent finite-difference calculation.
- Verify a hand-calculated first step and a known fixed point.
- Check conservation, bounds, dimensions, or units when the mechanism implies them.
- Confirm the same seed reproduces the same starting experiment.
- Show that a controlled intervention changes only the intended contribution.
- Verify that evaluation data never contribute to training gradients.

Add focused unit tests alongside the engine. Add browser coverage in `tests/` for the meaningful user journey: change a control, observe the calculation, reset, and navigate. Cover keyboard interaction, all three modes, and a phone-sized viewport. Verify that long code lines scroll inside their panel instead of widening the page. If the lesson exports data, test the contents rather than only checking that a file downloaded.

```sh
make examples
make test
make check
```

`make check` includes the production build and desktop/mobile Chromium checks. Inspect the actual visuals as well; passing tests alone does not show whether a learner can read the graph.

## Support the explanation

Add a short derivation or reference note to [theory.md](theory.md), [architectures.md](architectures.md), or [physical-computation.md](physical-computation.md), or create a collection-specific note when the topic changes. Add standalone programs to the index in [code-examples.md](code-examples.md). Prefer the original paper, textbook derivation, official technical documentation, or a component datasheet. Place the reference beside the claim it supports and explain in your own words.

Separate three kinds of statements:

| Statement                         | What the lesson should supply                                       |
| --------------------------------- | ------------------------------------------------------------------- |
| **Exact under stated conditions** | The assumptions, equation, and a derivation or supporting source.   |
| **Measured in this experiment**   | The actual setup, data, seed, procedure, and result.                |
| **Still uncertain or incomplete** | The missing information and what further evidence could resolve it. |

For a model-performance experiment, say how training, validation, and final test data are used. Looking repeatedly at a held-out score while choosing settings turns it into validation feedback. For architecture or hardware comparisons, state the scope of a count or estimate: parameter storage is not total runtime memory, and an ideal circuit equation is not every real component's behavior.

## Prepare a recording-friendly version

Use a clean reset state, hide navigation with presentation mode, and rehearse the exact actions. Pause before a change so viewers can predict it. Save the setup and output when the lesson supports export. Capture a short successful example and a revealing counterexample.

The current [video outline](video-outline.md) follows all twelve chapters, each with a short visual story and optional math and code follow-ups. A future lesson should work without narration first; narration can then draw attention to what the viewer can already inspect.

## Build a bridge to independent reading

A learner should finish a lesson with a question they can apply elsewhere. The learned-feature lesson asks whether a contribution actually matters and tests it by disconnecting an output weight. The deep-network lesson distinguishes a forward value from a derivative and tests a bypass. The paper workshop asks what enters each box, what leaves, what is stored, and how its parameters receive feedback.

Use the [paper-reading worksheet](reading-papers.md) as a transfer exercise: task, data, objective, new operation and dimensions, ablations, evaluation, and costs. The worksheet checkmarks record the reader’s work; they are not evidence of mastery. A matching parameter count is not proof of a correct implementation, and reproducing a result requires the paper’s data and training procedure as well.

Do not promise that covering terminology guarantees understanding of every paper or suits every age. Ask a learner to predict and explain a new case, observe where they struggle, and improve that transition. Automated tests validate calculations and interactions; learner feedback validates whether the explanation helps.
