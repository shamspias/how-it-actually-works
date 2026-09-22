# Concept review: follow the cause of each change

Reviewed September 22, 2026. The aim is to help a newcomer explain a mechanism and predict a different case, rather than remember its name. This record covers the twelve implemented chapters; it does not claim to cover all of machine learning.

## The questions checked

| Chapter              | What the learner should be able to explain                      | Check or boundary                                                                                                                                                                                  |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pip's first practice | What changed after a mistake, and what stays saved?             | One update moves the dial 1 → 1.4. Replaying that receipt does not train again; prediction reuses a fixed dial.                                                                                    |
| One tiny learner     | How do several examples contribute to one move?                 | Mean gradient matches finite differences. Small rounded slopes are not called exactly zero.                                                                                                        |
| Blindfolded hiker    | Why does this weight need this direction and step size?         | Live narration follows manual moves. Equal errors produce opposite gradients or zero in the three-card experiment. Large steps can increase loss.                                                  |
| Follow one mistake   | How does an output mistake affect an earlier connection?        | Chain-rule derivatives agree with finite differences; updates use the old network. A closed ReLU offers the correct “Stay the same” answer.                                                        |
| Learned features     | How can hidden responses change without their own labels?       | The output objective supplies derivatives. A controlled disconnection measures a contribution. The saved recipe includes 12 weights and 5 biases; a model score is not measured correctness.       |
| Deep networks        | Why can a forward value and its sensitivity behave differently? | Linear, tanh, ReLU, and residual calculations have independent gradient checks. Architecture controls state when they rebuild weights and reset biases.                                            |
| Shortcut detective   | Can correct practice answers depend on an unreliable clue?      | Change only the background, then compare predictions. Separate evaluation examples never supply training gradients; inspecting them while tuning makes them validation feedback.                   |
| Before training      | What do known examples actually rule out?                       | Both explicit rules fit the first three clues; adding 3 → 7.5 rules out A. Closed-form trajectories and statistical bounds state their assumptions and do not guarantee arbitrary future accuracy. |
| Attention and memory | Which information is mixed or retained, and why?                | Masked shares exclude future positions. A later marked card overwrites earlier state even with distractions disabled. This simplified state is not a complete Mamba block.                         |
| Scale                | What grows when dimensions grow?                                | Count weights and biases, then parameter-only storage. Computed Q/K/V are distinct from learned projection matrices; softmax shares are distinct from raw scores.                                  |
| Physical computation | What physically represents a number, and what writes it?        | The toy fixed-point encoding separates calculation from memory write and exposes quantization. It is not a transistor simulator or a model of every training precision.                            |
| Research blueprint   | What enters and leaves each box?                                | Slice projected Q/K/V into heads before scaled attention; join outputs afterward. Shapes and parameter counts follow the selected assumptions. Paper worksheets keep separate checkmarks.          |

## The main addition

The [three-card experiment](../examples/error-and-gradient.mjs) addresses a tempting wrong rule: “the guess is low, so increase the weight.” Start with the same error and vary the route from the weight to the guess. The learner previews one change, chooses a direction, then reads the saved update. The number-line marker and dial animate real values; reduced-motion mode keeps the same result without movement.

The sequence connects a visible effect to the chain rule, then to backpropagation. The zero-input case also explains why more optimization cannot repair every model: this particular formula has no way to produce the requested answer. A bias would change what the model can express.

## Verification and its limits

`make check` runs the production build, numerical tests, standalone example tests, and desktop/mobile browser tests. New regression scenarios cover negative and zero inputs, a closed ReLU, tiny nonzero slopes, architecture rebuilds, new evidence, memory overwrites, head dimensions, and separate paper worksheets. Browser checks also cover the new experiment at 320 pixels wide with reduced motion.

Finite-difference checks compare analytic gradients with changes measured by perturbing parameters. Existing checks cover masks, reproducibility, immutable simultaneous updates, parameter counts, and actual loss reduction. These establish specific numerical and interaction properties; they do not prove that every learner understands the explanation.

For a learner check, pause before showing a result and ask:

1. Which number will change, and which numbers stay fixed?
2. What calculation or connection causes that change?
3. What would reverse the change or stop it?
4. Is the displayed result a calculation, a measurement, or a claim about unseen data?

If the learner cannot answer, return to the smallest visible change and revise that transition. No learner study has been conducted as part of this review.

The mathematical background is [Deep Learning, numerical computation](https://www.deeplearningbook.org/contents/numerical.html). The attention dimensions were cross-checked against [Attention Is All You Need, section 3.2](https://arxiv.org/html/1706.03762v7#S3.SS2); the selective-state boundary follows [Mamba, section 3](https://arxiv.org/html/2312.00752v2#S3). The repository's [theory](theory.md), [architecture](architectures.md), and [paper-reading](reading-papers.md) notes retain the assumptions for each demonstration.
