# Recording outline: how a machine actually learns

Twelve short episodes, or a longer walkthrough with chapter markers. The progression starts before technical vocabulary and ends with a research-paper reading exercise. Start each episode with **Play & see**; treat **Follow the math** and **Read the code** as optional follow-ups. This is a recording guide for the interactive app, not a prerecorded video included in the repository.

Open the lab with `make run`. Use the top-bar presentation control, increase browser zoom if needed, and begin from a reset state. Pause before each change so the viewer can predict it. Keep each first explanation to one action and its consequence.

## Opening: what changed?

Show Pip, two seeds, the supplied answer of four drops, and its first guess. Keep the vocabulary ordinary: a question, an answer, and a dial. Let the viewer turn the dial, then reset for the programmed practice.

**Narration idea:** “The machine made a guess. One stored number changed. Let’s find out why—and what that does and does not tell us about the next guess.”

Keep three questions distinct throughout the course: how the numbers update, what behavior those numbers produce, and whether that behavior works on new examples. Use the searchable **Explain a word** dialog when a new term appears. Let a viewer explain the action before introducing its technical name.

## 1. What does learning change?

**Visual story:** Show **2 seeds → 4 drops**. Pip's first dial is 1, so it guesses 2 drops. Let the viewer press **Bigger dial** until the guess matches. Explain that the human chose those changes. Advance to the programmed practice: the dial resets to 1, and **Practice once** computes the change to 1.4. Repeating the instruction gets the guess closer to the supplied answer.

Next, hide the answer and try another seed count. The input and guess change; the saved dial stays still. Ask what practice left behind. After **The adjusted dial number.**, introduce input, target, weight, training, and inference using things already visible on screen.

**Math follow-up:** For one example, `guess = w × 2`, `error = guess − 4`, and `gradient = error × 2`. At `w = 1`, `new w = 1 − 0.1 × (−4) = 1.4`. This is one explicit choice of model, loss, and update rule.

**Code follow-up:** Run `node examples/learning-loop.mjs`. Point to the assignment that saves the new dial and the prediction function that only reads it.

**Slow down one update:** After **Practice once**, use the three receipt cards: **Guess**, **Compare**, and **Adjust & save**. **Replay this change** moves the highlight across that saved record; it does not run another update. Point to the dashed answer line in the cup and compare it with the water level.

**Give it back:** “Which action changes the recipe, and which action just uses it?” Pip is a character used to explain instructions; no little person or knowledgeable electricity lives inside the model.

## 2. One tiny learner

**Visual story:** With weight `0.5` and input `2`, read `2 × 0.5 = 1`, then compare the answer `4`. Ask whether increasing the weight will help. Move it manually, reset, and press **Train one step**. The weight becomes `1.2`.

**Math follow-up:** Select **Follow the math**. All three examples contribute to the gradient `−7`. Follow `0.5 − 0.1 × (−7) = 1.2` and the loss change `5.25 → approximately 1.49333`. Explain that the learning rate controls step size.

**Code follow-up:** Select **Read the code**, then run:

```sh
node examples/one-weight.mjs
```

**Give it back:** “What is the weight multiplying? What evidence told us which way to move it?”

## 3. The blindfolded hiker

**Visual story:** Let the viewer steer first. Then cover the hiker's eyes and explain the mapping: horizontal position is the weight; height is the loss; the slope is local information. Use **Next: feel the slope**, **Next: choose a step**, and **Take one step**. With the default bowl, weight `5`, and rate `0.3`, the next weight is `4.1`.

Finish the four stops before opening **Ready to experiment? Break the rule, then try alternatives.** Show an oversized step, then a landscape with several valleys. Compare gradient descent, momentum, random search, and grid search using the displayed calculations and number of loss evaluations. Ask what information each method uses.

**Math follow-up:** Differentiate `L(w) = 0.5(w − 2)²`, then substitute the current weight. Show how repeated multiplication gives an exact forecast for this particular bowl. State that its safe step-size range depends on this objective's curvature.

**Code follow-up:** Run `node examples/gradient-descent.mjs`, change the rate, and inspect the resulting trajectory.

**Give it back:** “Why does a direction still need a step size? Can this slope tell us about every other valley?” The hiker is an analogy for local calculation, not a thinking agent inside the model.

## 4. Follow one mistake

**Visual story:** Start with the two input values. Step through the mixing stations and the output, then reveal the target. With the default settings, the guess is `1.25` and the answer is `2`. Follow one highlighted connection backward through the error's dependencies.

At the weight-preview step, use **Preview +0.1 on one weight**. Follow the large cards from first weight to top mixture to guess to loss. The preview recomputes a finite change without changing the saved model. Open **Show this step’s calculation** to distinguish that experiment from the local derivative. The whole-network map is also optional.

At **Choose the adjustment**, ask whether the first weight should increase or decrease. Its gradient is `−0.375`. Choose **Increase**, then **Move the weights**. The first weight changes from `0.5` to `0.5375`; the whole update also adjusts the other parameters. Read the receipt after the change.

**Math follow-up:** Trace the product of local derivatives through one path. Explain the ReLU gate, a bias, and why all gradients use the same old network before any update is applied. Turn a gate off and inspect the zero derivative.

**Code follow-up:** Start with `node examples/backprop-step.mjs`. Then select **A complete XOR learner** and run `node examples/neural-network.mjs`. Follow its forward pass, mean loss, handwritten derivatives, and simultaneous update.

**Optional free lab:** Choose **Open the free network lab**. Compare a line and XOR, train, inspect a hidden unit, and disconnect it. Save an experiment before changing the seed or training conditions.

**Give it back:** “Backpropagation calculates how each parameter affects the loss. What separate rule uses those gradients to move the parameters?” The guided ReLU example and the free `tanh` network use different small models. The standalone XOR result fits four training patterns; it is not an unseen-data score.

## 5. Where do features come from?

**Visual story:** Begin with the four light cards. The bell rings for exactly one on light. Let the viewer answer the both-on case before showing any mixers. Meet the four mixers and select a card. Their responses are numbers; nobody has supplied labels for what those numbers should mean.

Ask how a mixer can receive advice without its own label. Trace the final error backward, then keep one card selected and step through the real practice checkpoints. Pale markers preserve the initial responses; solid markers show the current responses. The same card now produces a different internal message because the weights changed.

Before disconnecting a mixer, ask what could happen. Keep every other weight fixed and disconnect mixer 4, the default intervention chosen by measured loss impact. Compare average loss `approximately 0.0020 → 0.4095`. Reconnect it, try another unit, and inspect the four predictions. Finish by using the saved recipe again with no extra training updates.

**Math follow-up:** Follow `(p−t) × downstream weight × tanh slope × input` for all four cards. Average the derivatives at the old weights, update, then recompute a hidden response. Features emerge through this coupled optimization; they need not have everyday names.

**Code follow-up:** Run `node examples/learned-features.mjs`. This is the exact implementation imported by the lesson.

**Give it back:** “Which labels did we provide? Which internal numbers changed without their own labels? What did the disconnection actually test?” These four cards are the whole binary task, not a separate evaluation set. See [learned-features.md](learned-features.md).

## 6. When networks get deep

**Visual story:** Pass the number 1 through two multiply-and-add stations with positive ReLU gates. The values are `1 → 0.5 → 0.25`. Compare the result with target 1. Send derivative information backward, predict the weight direction, then apply one simultaneous update. Separate the values that move through the model from the parameters that stay in it.

Increase the chain to eight stations. On this positive path, each station passes half an input nudge onward: `0.5⁸ = 0.00390625`. Open the bypass. With the disclosed quarter-scaled branch, each local derivative becomes `1.125`, and the combined derivative grows to approximately `2.565785`. Let the evidence show that a direct route can help a signal pass while still allowing growth.

Try a negative input with and without a nonlinear gate. Explain that repeated affine transformations alone still collapse into one affine transformation. A gate changes the kind of function the model can express.

**Math follow-up:** Work backward through the saved forward values. Distinguish `dPrediction/dInput` from the loss derivative and from each parameter gradient. At a residual addition, derivative contributions follow both branches and add.

**Code follow-up:** Run `node examples/deep-network.mjs`. The complete program computes forward values, gradients, mean batch derivatives, and updates with no ML library.

**Give it back:** “Does a deeper route automatically learn a better rule? What changes when one derivative is zero?” This scalar chain isolates a mechanism; real wide networks mix vectors and have many interacting paths. See [deep-networks.md](deep-networks.md).

## 7. The shortcut detective

**Visual story:** Show the practice cards and ask which clue could help: shape or background. Press **Train on the practice examples**, then **Test the suspicious clue**. Keep the circle fixed and press **Change only the background**. Compare the familiar and swapped-background scores.

Choose **Try better practice**, then **Train with varied backgrounds**. Repeat the intervention and inspect the new measured result. Let the evidence explain why the earlier success was misleading.

**Math follow-up:** Identify the two supplied features, their scales, the logistic probability, and the regularized loss. Explain that these choices intentionally make a background shortcut attractive in the initial setup.

**Code follow-up:** Run `node examples/shortcut.mjs`. It uses a smaller explicit set of examples to show the same mechanism; its sample counts differ from the browser lab.

**Give it back:** “What did we hold fixed? What did we change? Why was that a better test than another familiar-looking example?” The model receives two numbers, not pixels; it does not discover shapes from images.

## 8. Can we know beforehand?

**Visual story:** Display `0 → 0`, `1 → 1`, and `2 → 2`. Ask for the answer at input `3` before showing a formula. Pick a guess, then **Open the two possible worlds**. Both rules fit the clues, but their next answers differ.

Move the probe across the observed points and beyond them. Select **Imagine measuring one more example**. A real new observation could rule out one proposed rule; it would not prove that only one rule fits all remaining unseen inputs.

**Math follow-up:** Open **Follow the math** for the separate objective `L(w) = 0.5(w − 3)²`. Compare the closed-form forecast with the actual update loop. Then explore the finite-class error bound, reading its assumptions before its result.

**Code follow-up:** Run `node examples/predict-before-training.mjs` to check the forecast and the two explicit rules.

**Give it back:** “Which part is a calculation we can solve, and which part needs more evidence?” More computation cannot choose between two observationally identical worlds without another assumption or observation. The conditional bound is not a direct accuracy forecast for any arbitrary neural network.

## 9. Attention & a backpack

**Visual story, attention:** Use the cards `Mia`, `cup`, `she`, and `it`. Ask from **she**, then step through the four moves: ask, compare, normalize, and **Carry information**. Point to the shares of the incoming messages. Ask from **it** and inspect the change.

**Math follow-up:** Map each card to its supplied vector. Show the query and key dot product, scaling, softmax, and weighted sum of values. The simple vectors and projections are hand chosen; this toy does not learn language or prove it has resolved a real sentence.

**Visual story, memory:** Switch to **Carry a tiny memory**. Read the marked `7`, then the distractions. At the default distraction gate, the stored number drifts. Close that gate to `0%`, empty the backpack, and read again. Add a second marked card and ask for the first number: the one-slot overwrite rule reveals its limitation.

**Code follow-up:** Run `node examples/attention.mjs` and `node examples/selective-state.mjs`. Explain how the displayed equations produce the observed messages and memory updates. Use the optional architecture comparison to connect these ingredients to larger systems.

**Give it back:** “What information is available now? What was mixed or overwritten?” The attention and selective-memory demonstrations are real calculations, but they are not complete Transformer or Mamba implementations. Use [the architecture notes](architectures.md) for the missing pieces and original papers.

## 10. From tiny to enormous

**Visual story:** Follow one route through the architecture schematics. Then change the dense-network depth and width and inspect how weights, biases, and parameter storage change. Switch between training and inference to distinguish changing parameters from using them.

**Math follow-up:** Count connections between adjacent layers, then add biases. Work through one setting before changing a slider. Explain the units in the Float32 estimate.

**Code follow-up:** Run `node examples/parameter-count.mjs` and compare the count with the same browser settings.

**Give it back:** “What can a parameter count tell us before training? What information is still missing?” The storage estimate covers parameters only, not total training memory, runtime, or model quality. The schematics do not establish an architecture winner.

## 11. From numbers to electricity

**Visual story:** Start with `00011000`. Explain the displayed place values and add them to obtain weight `1.5`. Step through **Read**, **Multiply**, **Measure loss**, **Find gradient**, and **Write**. The default update stores `00010100`, representing `1.25`.

Use the new weight for another update. Toggle a bit and watch its numerical meaning change; the leftmost bit has a negative contribution in this teaching format. Ask the viewer to predict the result before changing it.

**Math follow-up:** Show the signed integer divided by `16`, the derivative, and rounding on write. Find a small update that rounds back to the same stored number. State that intermediate arithmetic uses wider JavaScript numbers; only the stored weight is quantized in this demonstration.

**Code follow-up:** Select **Read the code** and copy the program for the current starting bits. It prints the loss, gradient, ideal update, stored value, and resulting bit pattern.

**Give it back:** “Which program instructions changed the number? What physically represents that number?” Moving packets illustrate information flow rather than individual electrons. Real circuits implement arithmetic using physical states; this is not a transistor-level simulation. Keep the physics-informed and quantum-computing discussion grounded in the distinctions in [physical-computation.md](physical-computation.md).

## 12. Read a research blueprint

**Visual story:** Use existing text to make next-token targets: `Mia → likes`, `likes → warm`, `warm → tea`. The text supplies the answer key. Then trace one route through token lookup, position information, masked attention, residual and normalization operations, the inner feed-forward network, repeated blocks, vocabulary scores, loss, and backward feedback.

Stop at each box and open **Inside this box: what enters, leaves, and learns?** Keep stored parameters separate from the activations computed for this input. During attention, choose a row and inspect its no-peeking mask. Compare known training text with generation, where the next token has to be produced before the following step.

Build the small blueprint from the stated brief. Try a head count that does not divide the width, read the shape error, and repair it. With width fixed, compare two and four heads: the per-head width changes, while this specified design's parameter count stays fixed. More input tokens change working arrays without creating more stored parameters.

At the loss stop, move the hypothetical correct-token probability. `−ln(p)` rewards assigning probability to the observed next token. Explicitly say that this slider measures a supplied probability; a language model is not training in this workshop.

**Math follow-up:** Trace the shape ledger and exact parameter ledger under their written assumptions. Account for biases, normalization scale and shift, learned positions, distinct block weights, and the untied vocabulary head. A different paper may use rotary positions, shared weights, different normalization, or different attention, changing the count.

**Code follow-up:** Run `node examples/read-architecture.mjs`. It audits dimensions, causal masks, parameter counts, shifted targets, and token loss. It does not implement the full decoder training process.

**Reading exercise:** Open the original Transformer or Mamba method section through the workshop. Find the familiar operation, then complete the seven-question worksheet: task, data, objective, changed operation and dimensions, ablations, evaluation, and costs. Ask the viewer to explain one box from a new figure, identify an unfamiliar part, and choose what to investigate next.

**Give it back:** “What does this box calculate, which numbers are learned, and what evidence supports the claimed improvement?” The course supplies a way into paper reading; a checkmark does not prove mastery and no short course covers every paper. Use [reading-papers.md](reading-papers.md) for assumptions, sources, and the worksheet.

## Closing: make one explanation your own

Return to Pip, a learned mixer, and one box in the paper blueprint. Ask the viewer what stayed after practice, why a hidden response changed without its own target, and how the larger box receives feedback. Then revisit the two possible rules to explain why fitting known answers cannot identify every future answer.

Invite one repeatable action: change a setting, predict the consequence, and check it. Use `make examples` to revisit the arithmetic without the website. Point to [theory.md](theory.md), [learned-features.md](learned-features.md), [deep-networks.md](deep-networks.md), [architectures.md](architectures.md), [physical-computation.md](physical-computation.md), [reading-papers.md](reading-papers.md), and [code-examples.md](code-examples.md) for derivations, scope, and source references.

## Recording notes

- Keep the first visual pass short. Let viewers pause and experiment before introducing calculus or source code. If they cannot predict the next small change, revisit that transition before adding another topic.
- Treat age labels and completion ticks as navigation aids, not guarantees of understanding. Observe a learner explaining an unfamiliar case to find missing bridges.
- Reset before each worked example. Record the dataset, seed, learning rate, and other settings when comparing measured results.
- Pause playback before reading arithmetic. Identify whether a panel shows the previous update or the next proposed update.
- Rehearse before promising a score or duration; use the actual result from the recorded setup.
- Keep captions away from graph axes and controls. Use browser zoom instead of shrinking a full desktop page into unreadable text.
- Show failed predictions and useful counterexamples as well as successful training.
- Place source links beside the relevant claim in the video description or companion notes.
