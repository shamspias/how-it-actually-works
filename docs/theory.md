# What can we know before training?

These notes support chapters 5 and 7 of the interactive lab. For the live attention and memory experiments, see [the architecture notes](architectures.md); for the physical bit update, see [physical computation](physical-computation.md). The experiments are intentionally small enough to inspect. They distinguish exact mathematical claims from empirical findings and open questions.

The reusable calculations live in [`src/lib/theory.ts`](../src/lib/theory.ts). Their tests compare a closed-form prediction with actual iterative updates, verify convergence and divergence regimes, count a real tiny network's stored parameters, and check the unseen-input counterexample. Run `npm test -- src/lib/theory.test.ts` to verify them.

## An exactly solvable training run

For `L(w) = 0.5(w - 3)^2`, ordinary gradient descent with constant learning rate `η` gives:

```text
gradient = w - 3
w[t+1] = w[t] - η(w[t] - 3)
w[t+1] - 3 = (1 - η)(w[t] - 3)
w[n] = 3 + (w[0] - 3)(1 - η)^n
```

The lab starts at `w[0] = 0`. It evaluates the last formula and, independently, runs the update loop. These agree up to floating-point rounding. For this particular objective, convergence to 3 occurs for `0 < η < 2`; `η = 0` stays put, `η = 2` oscillates, and `η > 2` diverges. This learning-rate range is not a rule for arbitrary networks.

More complex training remains a specified numerical computation. A useful closed form need not exist, and evaluating that computation may require essentially running training. Choices such as initialization, example order, optimizer, precision, and implementation affect the trajectory. Understanding the numerical update rule is separate from understanding which features a trained network represents. [Goodfellow, Bengio, and Courville, Deep Learning, chapter 8](https://www.deeplearningbook.org/contents/optimization.html).

## Why a perfect fit does not identify the world

The ambiguity experiment uses original explicit functions:

```text
A(x) = x
B(x) = x + 0.75x(x - 1)(x - 2)
```

They agree at observed inputs 0, 1, and 2 because the added product is zero there. At 3 their predictions are 3 and 7.5. They also disagree at most unobserved points between the examples. The experiment does not train two networks or claim either rule is the actual data-generating process. It proves that these observations alone do not uniquely determine an unseen answer. Assumptions and further observations can distinguish the possibilities. Generalization theory formalizes assumptions relating observed and future examples. [Deep Learning, chapter 5](https://www.deeplearningbook.org/contents/ml.html).

## A real, conditional pre-training calculation

For a finite set of `M` fixed candidate classifiers and `n` independent, identically distributed training examples, with right/wrong loss in `[0, 1]`, Hoeffding's inequality plus a union bound gives:

```text
P(any candidate has |true error - training error| > ε)
    ≤ 2M exp(-2nε²)

ε = sqrt(ln(2M/δ) / (2n))
```

With probability at least `1 - δ` over the dataset, this error gap is at most ε simultaneously for every candidate. It therefore also covers selecting a candidate using those data. The app fixes `M = 100` and `δ = 0.05` and lets the learner change n. At n = 1,000, ε is about 0.0644, or 6.44 percentage points.

The candidate set must be fixed independently of the sampled data. Training and future data must follow the assumed common distribution. This does not predict the training error, certify an individual future example, or directly apply with `M = 100` to an unrestricted continuously parameterized network. Other hypothesis classes require suitable capacity measures and bounds, and a bound may be too loose to guide a practical choice. The finite-class uniform-convergence proof appears in [Shalev-Shwartz and Ben-David, Understanding Machine Learning, chapter 4](https://www.cs.huji.ac.il/w~shais/UnderstandingMachineLearning/understanding-machine-learning-theory-algorithms.pdf).

Empirical scaling laws fit observed relationships among model size, dataset size, compute, and loss. They support forecasts within a studied regime, rather than universal guarantees for an arbitrary architecture and dataset. Pilot runs are useful for testing whether a forecast transfers to a new setting. [Kaplan et al., Scaling Laws for Neural Language Models (2020)](https://arxiv.org/abs/2001.08361).

## Architecture schematics

- **Dense:** each output combines every input with a weight and a bias, then may apply a nonlinear activation. Stacking only affine maps still gives an affine map. [Deep Learning, chapter 6](https://www.deeplearningbook.org/contents/mlp.html).
- **Transformer:** scaled dot-product attention mixes value vectors using weights computed from queries and keys; a mask restricts allowed positions. Complete blocks also include feed-forward transformations and other components. The schematic is not a complete implementation. [Vaswani et al., Attention Is All You Need (2017)](https://arxiv.org/abs/1706.03762).
- **Mamba:** input-dependent selective state-space updates combine a carried state with input information. The displayed recurrence omits surrounding projections, local convolution, gating, and implementation details. Efficient scan computation is part of the training implementation. It is not a simulation of a full Mamba block. [Gu and Dao, Mamba: Linear-Time Sequence Modeling with Selective State Spaces (2023)](https://arxiv.org/abs/2312.00752).

These schematics explain computation paths. They do not compare benchmark quality or claim one architecture is universally better.

## Exact dense parameter and memory count

For an affine dense layer with a inputs and b outputs, the number of parameters is `ab + b = (a + 1)b`. For the lab's 8 inputs, d hidden layers of width w, and 2 outputs:

```text
P = (8 + 1)w + (d - 1)(w + 1)w + (w + 1)2
Float32 parameter storage = 4P bytes
```

The middle term vanishes when d = 1. Every non-input unit has its own bias. Counts do not include parameter sharing, embeddings, normalization, or different block types. Memory units are decimal: kB = 1,000 bytes, MB = 1,000,000 bytes, GB = 1,000,000,000 bytes. The reported storage includes weights and biases only; gradients, optimizer state, activations, attention caches, and runtime overhead require additional memory. The calculator is arithmetic, not a prediction of speed, total GPU memory, or accuracy.

## Features, neurons, and inference

In ordinary inference, trained parameters remain fixed while activations and context-dependent state change. Updating weights during further training or adaptation is a separate operation.

A learned feature need not correspond to exactly one neuron. Some units are interpretable; features can also span many units, and units can participate in multiple features. Experiments on toy models demonstrate superposition under specific conditions. Those toy results motivate research; they are not a proof of the complete internal organization of every large model. [Elhage et al., Toy Models of Superposition (2022)](https://transformer-circuits.pub/2022/toy_model/index.html).

The lab's claim is therefore deliberately limited: the update mechanisms are explicit; interpreting a large system's learned computation and predicting its performance on an incompletely known world remain different challenges. Testing estimates behavior on sampled data and does not establish correctness for all possible future inputs.
