# Recording outline: how a machine actually learns

Eight short episodes, or a longer walkthrough with chapter markers. Start each episode with **Play & see**; treat **Follow the math** and **Read the code** as optional follow-ups. This is a recording guide for the interactive app, not a prerecorded video included in the repository.

Open the lab with `make run`. Use the top-bar presentation control, increase browser zoom if needed, and begin from a reset state. Pause before each change so the viewer can predict it. Keep each first explanation to one action and its consequence.

## Opening: what changed?

Show the first chapter's answer, guess, and gap. Drag the weight, then reset.

**Narration idea:** “The machine made a guess. One stored number changed. Let’s find out why—and what that does and does not tell us about the next guess.”

Keep three questions distinct throughout the course: how the numbers update, what behavior those numbers produce, and whether that behavior works on new examples.

## 1. One tiny learner

**Visual story:** With weight `0.5` and input `2`, read `2 × 0.5 = 1`, then compare the answer `4`. Ask whether increasing the weight will help. Move it manually, reset, and press **Train one step**. The weight becomes `1.2`.

**Math follow-up:** Select **Follow the math**. All three examples contribute to the gradient `−7`. Follow `0.5 − 0.1 × (−7) = 1.2` and the loss change `5.25 → approximately 1.49333`. Explain that the learning rate controls step size.

**Code follow-up:** Select **Read the code**, then run:

```sh
node examples/one-weight.mjs
```

**Give it back:** “What is the weight multiplying? What evidence told us which way to move it?”

## 2. The blindfolded hiker

**Visual story:** Let the viewer steer first. Then cover the hiker's eyes and explain the mapping: horizontal position is the weight; height is the loss; the slope is local information. Use **Next: feel the slope**, **Next: choose a step**, and **Take one step**. With the default bowl, weight `5`, and rate `0.3`, the next weight is `4.1`.

Finish the four stops before opening **Ready to experiment? Break the rule, then try alternatives.** Show an oversized step, then a landscape with several valleys. Compare gradient descent, momentum, random search, and grid search using the displayed calculations and number of loss evaluations. Ask what information each method uses.

**Math follow-up:** Differentiate `L(w) = 0.5(w − 2)²`, then substitute the current weight. Show how repeated multiplication gives an exact forecast for this particular bowl. State that its safe step-size range depends on this objective's curvature.

**Code follow-up:** Run `node examples/gradient-descent.mjs`, change the rate, and inspect the resulting trajectory.

**Give it back:** “Why does a direction still need a step size? Can this slope tell us about every other valley?” The hiker is an analogy for local calculation, not a thinking agent inside the model.

## 3. Follow one mistake

**Visual story:** Start with the two input values. Step through the mixing stations and the output, then reveal the target. With the default settings, the guess is `1.25` and the answer is `2`. Follow one highlighted connection backward through the error's dependencies.

At **Choose the adjustment**, ask whether the first weight should increase or decrease. Its gradient is `−0.375`. Choose **Increase**, then **Move the weights**. The first weight changes from `0.5` to `0.5375`; the whole update also adjusts the other parameters. Read the receipt after the change.

**Math follow-up:** Trace the product of local derivatives through one path. Explain the ReLU gate, a bias, and why all gradients use the same old network before any update is applied. Turn a gate off and inspect the zero derivative.

**Code follow-up:** Start with `node examples/backprop-step.mjs`. Then select **A complete XOR learner** and run `node examples/neural-network.mjs`. Follow its forward pass, mean loss, handwritten derivatives, and simultaneous update.

**Optional free lab:** Choose **Open the free network lab**. Compare a line and XOR, train, inspect a hidden unit, and disconnect it. Save an experiment before changing the seed or training conditions.

**Give it back:** “Backpropagation calculates how each parameter affects the loss. What separate rule uses those gradients to move the parameters?” The guided ReLU example and the free `tanh` network use different small models. The standalone XOR result fits four training patterns; it is not an unseen-data score.

## 4. The shortcut detective

**Visual story:** Show the practice cards and ask which clue could help: shape or background. Press **Train on the practice examples**, then **Test the suspicious clue**. Keep the circle fixed and press **Change only the background**. Compare the familiar and swapped-background scores.

Choose **Try better practice**, then **Train with varied backgrounds**. Repeat the intervention and inspect the new measured result. Let the evidence explain why the earlier success was misleading.

**Math follow-up:** Identify the two supplied features, their scales, the logistic probability, and the regularized loss. Explain that these choices intentionally make a background shortcut attractive in the initial setup.

**Code follow-up:** Run `node examples/shortcut.mjs`. It uses a smaller explicit set of examples to show the same mechanism; its sample counts differ from the browser lab.

**Give it back:** “What did we hold fixed? What did we change? Why was that a better test than another familiar-looking example?” The model receives two numbers, not pixels; it does not discover shapes from images.

## 5. Can we know beforehand?

**Visual story:** Display `0 → 0`, `1 → 1`, and `2 → 2`. Ask for the answer at input `3` before showing a formula. Pick a guess, then **Open the two possible worlds**. Both rules fit the clues, but their next answers differ.

Move the probe across the observed points and beyond them. Select **Imagine measuring one more example**. A real new observation could rule out one proposed rule; it would not prove that only one rule fits all remaining unseen inputs.

**Math follow-up:** Open **Follow the math** for the separate objective `L(w) = 0.5(w − 3)²`. Compare the closed-form forecast with the actual update loop. Then explore the finite-class error bound, reading its assumptions before its result.

**Code follow-up:** Run `node examples/predict-before-training.mjs` to check the forecast and the two explicit rules.

**Give it back:** “Which part is a calculation we can solve, and which part needs more evidence?” More computation cannot choose between two observationally identical worlds without another assumption or observation. The conditional bound is not a direct accuracy forecast for any arbitrary neural network.

## 6. Attention & a backpack

**Visual story, attention:** Use the cards `Mia`, `cup`, `she`, and `it`. Ask from **she**, then step through the four moves: ask, compare, normalize, and **Carry information**. Point to the shares of the incoming messages. Ask from **it** and inspect the change.

**Math follow-up:** Map each card to its supplied vector. Show the query and key dot product, scaling, softmax, and weighted sum of values. The simple vectors and projections are hand chosen; this toy does not learn language or prove it has resolved a real sentence.

**Visual story, memory:** Switch to **Carry a tiny memory**. Read the marked `7`, then the distractions. At the default distraction gate, the stored number drifts. Close that gate to `0%`, empty the backpack, and read again. Add a second marked card and ask for the first number: the one-slot overwrite rule reveals its limitation.

**Code follow-up:** Run `node examples/attention.mjs` and `node examples/selective-state.mjs`. Explain how the displayed equations produce the observed messages and memory updates. Use the optional architecture comparison to connect these ingredients to larger systems.

**Give it back:** “What information is available now? What was mixed or overwritten?” The attention and selective-memory demonstrations are real calculations, but they are not complete Transformer or Mamba implementations. Use [the architecture notes](architectures.md) for the missing pieces and original papers.

## 7. From tiny to enormous

**Visual story:** Follow one route through the architecture schematics. Then change the dense-network depth and width and inspect how weights, biases, and parameter storage change. Switch between training and inference to distinguish changing parameters from using them.

**Math follow-up:** Count connections between adjacent layers, then add biases. Work through one setting before changing a slider. Explain the units in the Float32 estimate.

**Code follow-up:** Run `node examples/parameter-count.mjs` and compare the count with the same browser settings.

**Give it back:** “What can a parameter count tell us before training? What information is still missing?” The storage estimate covers parameters only, not total training memory, runtime, or model quality. The schematics do not establish an architecture winner.

## 8. From numbers to electricity

**Visual story:** Start with `00011000`. Explain the displayed place values and add them to obtain weight `1.5`. Step through **Read**, **Multiply**, **Measure loss**, **Find gradient**, and **Write**. The default update stores `00010100`, representing `1.25`.

Use the new weight for another update. Toggle a bit and watch its numerical meaning change; the leftmost bit has a negative contribution in this teaching format. Ask the viewer to predict the result before changing it.

**Math follow-up:** Show the signed integer divided by `16`, the derivative, and rounding on write. Find a small update that rounds back to the same stored number. State that intermediate arithmetic uses wider JavaScript numbers; only the stored weight is quantized in this demonstration.

**Code follow-up:** Select **Read the code** and copy the program for the current starting bits. It prints the loss, gradient, ideal update, stored value, and resulting bit pattern.

**Give it back:** “Which program instructions changed the number? What physically represents that number?” Moving packets illustrate information flow rather than individual electrons. Real circuits implement arithmetic using physical states; this is not a transistor-level simulation. Keep the physics-informed and quantum-computing discussion grounded in the distinctions in [physical-computation.md](physical-computation.md).

## Closing: make one explanation your own

Return to the first weight update and the two possible hidden rules. Ask the viewer to explain why `0.5` became `1.2`, then why matching three answers cannot identify every future answer.

Invite one repeatable action: change a setting, predict the consequence, and check it. Use `make examples` to revisit the arithmetic without the website. Point to [theory.md](theory.md), [architectures.md](architectures.md), [physical-computation.md](physical-computation.md), and [code-examples.md](code-examples.md) for derivations, scope, and source references.

## Recording notes

- Keep the first visual pass short. Let viewers pause and experiment before introducing calculus or source code.
- Reset before each worked example. Record the dataset, seed, learning rate, and other settings when comparing measured results.
- Pause playback before reading arithmetic. Identify whether a panel shows the previous update or the next proposed update.
- Rehearse before promising a score or duration; use the actual result from the recorded setup.
- Keep captions away from graph axes and controls. Use browser zoom instead of shrinking a full desktop page into unreadable text.
- Show failed predictions and useful counterexamples as well as successful training.
- Place source links beside the relevant claim in the video description or companion notes.
