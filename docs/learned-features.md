# How does a network learn what to notice?

Open **Where do features come from?** (`#learned-features`). The small task has two lights and one bell. The bell should ring when exactly one light is on. The model receives two numbers, not pictures: off is 0 and on is 1.

The important distinction is between the **answer labels** we provide and the **hidden responses** we do not provide. Nobody labels hidden unit 1 “detect both lights.” The network receives only the four final answers. Backpropagation computes how changes to earlier weights would affect the final loss, and gradient descent changes those weights. As a result, the same input can produce a different internal representation. Hidden responses can become useful to the output without being human-named concepts. This is the learning-representations idea studied by [Rumelhart, Hinton, and Williams (1986)](https://www.nature.com/articles/323533a0).

## Six small discoveries

1. **Learn the bell rule yourself.** A prediction question checks that the task is understood before discussing the model.
2. **Meet four mixers.** A mixer is a hidden unit. Its response is a number between −1 and +1; its recipe consists of two input weights and a bias. Different initial weights break symmetry.
3. **Trace advice backward.** Only the final answer has a target label. The loss and chain rule supply a derivative for every hidden parameter.
4. **Keep the card fixed; watch the response change.** Pale markers retain the untrained responses. Solid markers and all four output predictions are recomputed at real training checkpoints. Checkpoints are not evenly spaced in training time.
5. **Disconnect one contribution.** Zero one outgoing weight without retraining. This tests whether that contribution matters to this fixed model on these cards. It does not assign a universal meaning to a neuron.
6. **Reuse the saved recipe.** A forward pass uses learned weights. Repeated predictions do not update them. Training requires a separate update operation.

The visual scene initially displays one task. Math and full source are separate, freely selectable views. Playback starts only when requested. Reduced-motion settings remove interpolated marker movement; manual checkpoint controls remain available.

## Exact experiment

The network has two inputs, four tanh hidden units, and one sigmoid output. It contains 17 trainable scalar parameters: eight input weights, four hidden biases, four output weights, and one output bias. Initialization uses a deterministic generator with seed 42 and Xavier-scaled uniform weights.

For one example:

```text
a_j = w_j1*x1 + w_j2*x2 + b_j
h_j = tanh(a_j)
z   = sum_j(v_j*h_j) + c
p   = sigmoid(z)
L   = -t*ln(p) - (1-t)*ln(1-p)

dL/dw_j1 = (p-t) * v_j * (1-h_j^2) * x1
```

The four examples supply four derivatives. The update averages those derivatives, evaluated at the **same old weights**, and updates every parameter together at learning rate 0.5. The math view displays each factor, the average, the resulting weight, and a newly computed hidden response. All intermediate arithmetic uses JavaScript double-precision numbers; displayed decimals are rounded.

BCE is evaluated from logits using `max(z,0) - t*z + log1p(exp(-abs(z)))`, which avoids taking a logarithm of a rounded probability of zero. Stable sigmoid branches avoid overflow for large negative logits.

At 2,400 updates the deterministic run reaches average BCE of approximately **0.002023**, with probabilities approximately **0.000289, 0.997747, 0.997717, and 0.003257** for cards `00`, `01`, `10`, and `11`. These are computed results, not scripted success percentages. The default intervention chooses the unit producing the greatest loss increase when disconnected; here that is unit 4, giving loss approximately **0.409495**. Every other unit can be tested too.

Nonlinear hidden transformations let a network express XOR; a single affine decision boundary cannot separate its two diagonal positive cases from its two negative cases. See the authors’ [Deep Learning chapter on feedforward networks](https://www.deeplearningbook.org/contents/mlp.html), including its XOR example.

## What this does and does not establish

This is the entire four-case binary task. Correct predictions here are **not an unseen-data accuracy estimate** and do not establish that the network learns a wider concept of lights or bells. There are no omitted binary combinations left to test, and continuous inputs outside those four cases need additional assumptions about their desired answers.

The activation display reports four actual hidden responses, not a projection of a high-dimensional research model. Watching them change establishes representation change. Intervening on an outgoing connection establishes an effect of that contribution under the stated intervention. Neither observation provides a complete semantic explanation of a large neural network.

A deeper model repeats and composes transformations. The same chain rule applies, but interactions, redundancy, distributed representations, optimization difficulties, and the evaluation distribution still matter. A useful internal feature need not correspond to a word, object, or single human idea. Two networks can represent the same function with different internal coordinates. The authors discuss these distinctions in [Deep Learning: Representation Learning](https://www.deeplearningbook.org/contents/representation.html).

## Run and inspect

```sh
node examples/learned-features.mjs
npm test -- src/lib/features.test.ts
```

`examples/learned-features.mjs` is complete and uses no machine-learning library. The browser imports its exact functions through `src/lib/features.ts`. The code view shows that same complete file. Tests compare it with the existing independent engine, check all 17 analytic derivatives using central finite differences, verify reproducible learning, verify intervention isolation, and confirm that inference leaves weights unchanged.
