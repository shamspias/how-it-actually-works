# Follow the information: attention and memory

Open **Attention & a backpack** in the learning lab. Start with **Play & see**, play one story, then replay it in **Follow the math** and **Read the code**. The three views describe the same calculations. Changing views preserves your cards and controls.

This lesson asks a narrow question: **how can earlier information reach a later computation?** It demonstrates two mechanisms with inspectable numbers. It does not train a language model or reproduce an entire Transformer or Mamba architecture.

## Attention: four cards exchange information

Imagine the sentence “Mia picked up a cup. She smiled. It was warm.” A reader uses context to interpret “she” and “it”. Our four cards isolate a tiny part of that idea; they do not parse the sentence.

Every card has a hand-designed vector with four coordinates:

```text
[person information offered, object information offered,
 person information requested, object information requested]

Mia = [2, 0, 2, 0]
cup = [0, 2, 0, 2]
she = [0, 0, 2, 0]
it  = [0, 0, 0, 2]
```

These coordinate names are our teaching convention. A real learned embedding generally does not have such tidy human-readable coordinates. The toy does not learn names, gender, grammar, or pronoun resolution.

Three small projection matrices make each card’s question (**query**), address (**key**), and message (**value**). A matrix here is just a table of multipliers; each row multiplies matching input coordinates and adds them.

```text
Wq = [[0, 0, 1, 0], [0, 0, 0, 1]]
Wk = [[1, 0, 0, 0], [0, 1, 0, 0]]
Wv = [[0.5, 0, 0, 0], [0, 0.5, 0, 0]]

q = Wq × embedding
k = Wk × embedding
v = Wv × embedding
```

With “she” selected as the question:

1. Its query is `[2, 0]`.
2. Compare that query to each key. The score for Mia is `(2×2 + 0×0)/√2 = 2.828427…`; the other scores are zero.
3. Turn scores into shares using softmax: exponentiate each score and divide by their total. The resulting shares are approximately `[0.849389, 0.050204, 0.050204, 0.050204]`.
4. Multiply each value by its share and add: the output is approximately `[0.849389, 0.050204]`.

The first output coordinate carries more person information. Selecting “it” exchanges the roles: the result is approximately `[0.050204, 0.849389]`. The arithmetic changed because the input query changed; no parameter was trained or updated.

Softmax shares sum to one. The two output coordinates need not sum to one: they are a mixture of value vectors, and some cards have zero values. An attention share is a mixing coefficient, not a probability that a word is the correct answer and not a complete explanation of a model’s behavior.

The implementation subtracts the largest **allowed** score before exponentiating. This preserves the shares while avoiding overflow. A **causal mask** gives every future position zero share, then normalizes over the remaining positions. To make its effect obvious, place “she” in the first card, ask from it, and toggle the mask: when future cards are hidden, it cannot collect their information.

### From the toy to a Transformer

The original Transformer uses scaled dot-product attention, usually with several projection sets called heads. Position information, feed-forward layers, residual paths, and normalization complete the blocks. Its decoder masks future positions. Our scene computes one query row of one attention head and omits the rest. During training, gradients can pass through the attention operations into embeddings and projection weights. [Vaswani et al., _Attention Is All You Need_, sections 3.1–3.3](https://arxiv.org/abs/1706.03762).

The mathematical view includes the softmax derivative and the full per-card arithmetic. The code view displays the actual runnable example:

```sh
node examples/attention.mjs
node examples/attention.mjs --causal
```

## Selective memory: protect a number from distractions

Now imagine a backpack with one numerical memory slot. Read these cards in order:

```text
Remember 7 → Noise 2 → Noise 9 → Noise 1
```

For each card, the update is:

```text
gate = card.marked ? 1 : distractionGate
newMemory = (1 − gate) × oldMemory + gate × card.value
```

The marked flag is provided in the data. Our code supplies the gate rule by hand; it does not learn which inputs matter.

| Distraction gate | Memory after each card | What happened                               |
| ---------------- | ---------------------- | ------------------------------------------- |
| 0                | 7, 7, 7, 7             | Each distraction left the old number alone. |
| 0.5              | 7, 4.5, 6.75, 3.875    | Each distraction mixed halfway into memory. |
| 1                | 7, 2, 9, 1             | Every card replaced the old number.         |

The game asks you to protect 7. Closing the distraction gate solves that task. Then add a second marked card, “Remember 4”, and ask for the **first** marked number. This specific overwrite rule now fails even with a closed distraction gate: the second marked card replaces 7 with 4. Ask for the **latest** marked number and it succeeds.

This demonstrates a limitation of this update rule, not a theorem that every one-number mathematical state must fail every recall task. A different task may need a different update, more state, or direct access to earlier inputs. Finite precision also matters for what can reliably be retained.

For this recurrence, `∂newMemory/∂oldMemory = 1 − gate`. Three gates of 0.5 leave only `0.5³ = 12.5%` of the original signal’s contribution. That same product affects gradients flowing backward through these steps. The math view expands the actual update and these derivatives.

### From the toy to Mamba

Mamba uses selective state-space updates whose quantities depend on the current input. A compact discrete-time form is `hₜ = Āₜhₜ₋₁ + B̄ₜxₜ`, with output `yₜ = Cₜhₜ`. Its full block includes learned projections, a local convolution, gating, and an efficient scan implementation. The toy keeps only the idea of input-controlled retention and replacement; it does not implement Mamba’s discretization, vector state, learned selection, or complete block. The relationship between selective state updates and simple gates is discussed in section 3.5. [Gu and Dao, _Mamba: Linear-Time Sequence Modeling with Selective State Spaces_, sections 2–3](https://arxiv.org/abs/2312.00752).

Changing a carried state during an ordinary forward pass does not change the model’s trained parameters. Memory and learning are different operations, even when both change numbers inside the computer.

```sh
node examples/selective-state.mjs
```

## Choosing a mechanism is a testable hypothesis

The expandable comparison shows five information-flow designs: dense mixing, a sliding convolution, recurrent state, attention, and selective state. It is a mechanism guide rather than a benchmark ranking.

For a useful first experiment, contrast two tasks:

- **Exact recall:** retrieve a particular earlier marked value after many distractions.
- **Running average:** summarize every value seen so far.

They require different information. Choose a simple baseline, keep the evaluation data separate, and compare quality, memory use, and speed on the actual task. A larger architecture cannot reconstruct information that neither its inputs nor prior assumptions provide.

## Implementation and checks

- [`src/lib/sequence.ts`](../src/lib/sequence.ts) contains the interactive lesson’s validated arithmetic.
- [`src/lib/sequence.test.ts`](../src/lib/sequence.test.ts) checks a hand-computed attention result, causal masking, stable softmax, query-dependent routing, memory retention, leakage, and overwriting.
- [`examples/attention.mjs`](../examples/attention.mjs) and [`examples/selective-state.mjs`](../examples/selective-state.mjs) are small standalone JavaScript programs with no ML imports.
- [`src/components/ArchitectureJourney.tsx`](../src/components/ArchitectureJourney.tsx) renders the guided scenes and imports those complete examples for the code view.

The visual labels round numbers for readability; internal calculations use JavaScript numbers. These examples illustrate finite arithmetic and mechanisms, not language understanding, training performance, or a guarantee about an unseen dataset.

Continue with [the research blueprint workshop](reading-papers.md) to trace a complete specified decoder, distinguish parameters from activations, and count its layers. The preceding [deep-network lesson](deep-networks.md) makes residual paths and gradients inspectable.
