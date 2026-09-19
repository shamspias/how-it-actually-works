# From one layer to a deep network

Open **When networks get deep** (`#deep-networks`). The visual story moves one parcel at a time, pauses for three decisions, updates actual parameters, then tries depth, a bypass, and a nonlinear gate. Every animation finishes; advancing is manual, and reduced-motion preferences are respected.

## What is actually computed

The browser imports `examples/deep-network.mjs`, the same complete program available in **Read the code**. Run it with:

```sh
node examples/deep-network.mjs
```

Each layer holds a scalar weight and bias. Without a bypass:

```text
a[0] = input
z[l] = w[l] * a[l-1] + b[l]
a[l] = activation(z[l])
prediction = a[last]
loss = (prediction - target)^2 / 2
```

The opening example has two ReLU layers, weights 0.5, biases 0, input 1, and target 1. ReLU keeps positive totals and maps negative totals to zero. The forward values are `1 → 0.5 → 0.25`. The error is −0.75 and loss is 0.28125.

The backward pass starts with `dLoss/dPrediction = prediction - target`, then works through the saved forward values in reverse. Both weight gradients are −0.375. The first bias gradient is −0.375; the second is −0.75. At learning rate 0.1, the next weights are both 0.5375 and the biases are 0.0375 and 0.075. The new prediction is 0.3840625 and loss is approximately 0.1896895. All parameters update from the same old-model snapshot.

A forward pass computes an answer. The update changes the stored parameters. A gradient is a rate of change, **not** a second prediction, a universal error signal, or an instruction understood by a neuron.

## What depth changes

On this positive-input path, eight ReLU layers with weight 0.5 have input-to-output derivative `0.5^8 = 0.00390625`. This displayed quantity is `dPrediction/dInput`; it is not a weight gradient or an accuracy score. Weight gradients also contain the loss derivative and the relevant layer input. Repeated local derivatives explain a mechanism by which early gradients can become very small or very large. ReLU changes derivative when a total crosses zero, and the lesson chooses derivative zero at the kink.

Without nonlinearities, repeated multiply-and-add operations collapse into one affine map. Nonlinear gates can create bends; with width and suitable parameters, layers can form increasingly useful combinations of features. Neither arbitrary depth nor a one-number chain guarantees expressive power or generalization. The scalar chain deliberately isolates one path. Wide networks carry vectors, use matrices to mix them, and sum derivative contributions where paths meet. See the authors’ [Deep Learning, chapter 6](https://www.deeplearningbook.org/contents/mlp.html) for the general feedforward and backpropagation treatment.

## The residual experiment

The optional bypass computes:

```text
a[l] = a[l-1] + 0.25 * activation(w[l] * a[l-1] + b[l])
d a[l] / d a[l-1] = 1 + 0.25 * activation'(z[l]) * w[l]
```

The factor 0.25 is a disclosed teaching choice. Standard residual notation is `x + F(x)`, and `F` can be a larger learned block. The direct derivative path adds 1; it does not guarantee stability or successful training. The lesson’s eight positive ReLU layers give `1.125^8 ≈ 2.565785`, demonstrating that the path can grow. Turning a ReLU branch off preserves the direct input path while that branch’s parameter gradients are zero. The original [ResNet paper](https://arxiv.org/abs/1512.03385) motivates learning residual functions and reports empirical improvements; this tiny scalar experiment is not a reproduction of that model or its results.

## Initialization, batches, and honest limits

Identical weights are useful here for arithmetic. In a wide network, symmetrically initialized units can receive identical updates and duplicate a feature; differing initial weights help break that symmetry. Initialization scale, activation, architecture, data, and optimizer all affect training. [Deep Learning, chapter 8](https://www.deeplearningbook.org/contents/optimization.html) discusses initialization and optimization difficulties, including vanishing and exploding gradients.

`trainDeep` accepts a batch of examples. It computes every example’s gradients at the same parameters, averages each parameter’s gradient, then makes one update. A batch improvement does not require every example to improve. The default executable trains on **one** pair. Its low practice loss is no evidence of unseen-example performance.

The controls reset weights to the chosen initial multiplier and biases to zero when the architecture changes. Changing the input keeps the existing parameters. “Train this chain once” changes all weights and biases. The sandbox stops additional updates after the loss becomes extremely large; that guard is a UI limit, not a learning algorithm.

## Checks

`src/lib/deep.test.ts` checks the opening arithmetic, simultaneous immutable updates, mean batch gradients, every weight/bias/input derivative by centered finite differences across all activation/bypass combinations, affine collapse, closed ReLU branches, shrinking/growing paths, and the one-example training loop. Browser tests should complete the story, check the displayed `0.003906` and `2.565785` sensitivities, switch all three views, and verify a 320-pixel viewport.
