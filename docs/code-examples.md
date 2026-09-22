# Run the calculations without the website

The `examples/` directory contains small JavaScript programs that show the arithmetic directly. Use the repository's recommended Node.js version, then run a file from the repository root:

```sh
node examples/neural-network.mjs
```

These examples need no Python installation, GPU, API key, or machine-learning package. The source uses ordinary numbers, arrays, and `Math`; some files also use Node's built-in facilities to print output or detect direct execution. The website's **Read the code** mode links the explanation to relevant source lines.

The reader shows the filename and numbered source lines, preserving indentation. Long lines wrap to fit a phone; turn **Wrap lines** off to scroll horizontally inside the code panel. **Next part** brings the explained lines into view. **Copy code** copies the complete original program with line breaks and without line numbers. **First time reading JavaScript?** explains the basic notation. Moving between explanations does not execute the program; run the shown command in your terminal to see its output.

![The code reader with numbered lines and a guided explanation](read-the-code.png)

## Choose one mechanism

| File                                                                     | Calculation to inspect                                                                       |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| [`one-weight.mjs`](../examples/one-weight.mjs)                           | A scalar prediction, loss, derivative, and weight update.                                    |
| [`gradient-descent.mjs`](../examples/gradient-descent.mjs)               | How a gradient and learning rate determine a downhill step.                                  |
| [`backprop-step.mjs`](../examples/backprop-step.mjs)                     | Local derivatives combined through the chain rule.                                           |
| [`neural-network.mjs`](../examples/neural-network.mjs)                   | A complete two-input, four-hidden-unit XOR network trained with handwritten backpropagation. |
| [`shortcut.mjs`](../examples/shortcut.mjs)                               | How a classifier can exploit a feature whose correlation changes.                            |
| [`predict-before-training.mjs`](../examples/predict-before-training.mjs) | A solvable training trajectory and the limits of what observations identify.                 |
| [`attention.mjs`](../examples/attention.mjs)                             | Attention scores, normalized mixing weights, and a weighted sum of values.                   |
| [`selective-state.mjs`](../examples/selective-state.mjs)                 | An explicitly simplified input-dependent state update.                                       |
| [`parameter-count.mjs`](../examples/parameter-count.mjs)                 | Dense weights, biases, and parameter-only storage.                                           |

Run all examples with:

```sh
make examples
```

Attention and selective-state examples demonstrate ingredients of architectures. They are not complete Transformer or Mamba implementations. The physical chapter's eight-bit update is a separate toy representation; ordinary JavaScript `Number` arithmetic in these programs uses double precision.

## Follow the new bridges

- [`error-and-gradient.mjs`](../examples/error-and-gradient.mjs) starts three cards with error −2 and computes gradients −4, +4, and 0. It powers the hiker chapter's dial experiment. Run `node --test examples/error-and-gradient.test.mjs` to compare its derivatives with finite differences and verify all three update directions.

- [`learning-loop.mjs`](../examples/learning-loop.mjs) separates prediction from the assignment that saves a training update. The same code drives Pip's opening game.
- [`learned-features.mjs`](../examples/learned-features.mjs) trains a 2 → 4 → 1 network, prints its changed hidden responses, and disconnects a unit to measure its effect. See [learned features](learned-features.md).
- [`deep-network.mjs`](../examples/deep-network.mjs) implements forward values, every weight and bias derivative, mean batch updates, nonlinear gates, and a scaled residual route. See [deep networks](deep-networks.md).
- [`read-architecture.mjs`](../examples/read-architecture.mjs) checks a specified decoder's shapes and parameter ledger, builds shifted text targets, and calculates next-token loss. It audits a blueprint; it does not train a language model. See [reading papers](reading-papers.md).

These examples also run through `make examples`. The gradient, feature, and deep lessons execute their example modules directly, so the displayed numbers and copyable code share the same calculation.

## Read the complete neural network

The XOR model has two inputs, four `tanh` hidden units, and one sigmoid output. It has 17 adjustable numbers: 8 input weights, 4 hidden biases, 4 output weights, and 1 output bias. All four possible binary inputs are training examples.

Read its functions in this order:

1. `createNetwork` chooses repeatable starting weights using a seed. Different hidden units start with different numbers.
2. `forward` computes hidden activations, the output logit, and a predicted probability.
3. `loss` evaluates mean binary cross-entropy using a numerically stable logit formula.
4. `gradients` applies the chain rule and averages derivatives over the four examples, using the same old network for every example.
5. `trainStep` applies all updates together and returns new arrays.
6. `train` repeats these steps; `runDemo` prints the measured result.

The important derivative paths are:

```text
hidden preactivation: a_j = w_j0*x0 + w_j1*x1 + b_j
hidden activation:    h_j = tanh(a_j)
output logit:         z = sum_j(v_j*h_j) + c
prediction:           p = sigmoid(z)

For one example with target t:
dL/dz    = p - t                         [sigmoid + cross-entropy]
dL/dv_j  = (p - t) * h_j                 [output weight]
dL/dc    = p - t                         [output bias]
dL/da_j  = (p - t) * v_j * (1 - h_j²)    [hidden preactivation]
dL/dw_ji = (p - t) * v_j * (1 - h_j²) * x_i
dL/db_j  = (p - t) * v_j * (1 - h_j²)
```

For a batch, average those example derivatives before applying `new = old - rate × gradient`. The code implements every term explicitly. [Deep Learning, chapter 6: Deep Feedforward Networks](https://www.deeplearningbook.org/contents/mlp.html).

## A measured run

With seed 42, 8,000 updates, and learning rate 0.5, the supplied implementation produces:

```text
Mean loss: 0.901819 → 0.000287
input   target   before P(1)   after P(1)   class
0,0       0       0.500000       0.000180       0
0,1       1       0.158097       0.999688       1
1,0       1       0.401852       0.999707       1
1,1       0       0.146075       0.000363       0
```

The output is measured, not a prerecorded curve used by the program. The seed makes runs repeatable in the same numerical environment; the last digits can vary with floating-point math implementations. All four binary patterns appeared in training, so this demonstrates fitting XOR. It is not an estimate of unseen-data performance.

## Check the derivatives yourself

Run the standalone example's tests with Node's built-in runner:

```sh
node --test examples/neural-network.test.mjs
```

The tests perturb each of the 17 parameters slightly in both directions and measure the resulting change in loss. These independent finite-difference slopes must agree with the handwritten derivatives. They also verify repeatable initialization, simultaneous updates, input preservation, numerical stability, and actual XOR convergence.

Use `make test` for the repository's numerical and example checks, and `make check` for those checks plus the site build and browser interactions. For the distinction between an exact update, a conditional bound, and an empirical performance estimate, continue with [theory.md](theory.md). Architecture scope is documented in [architectures.md](architectures.md), and the hardware representation in [physical-computation.md](physical-computation.md).
