# From the small learner to an architecture paper

Open **Read the blueprint** (`#research-paper`). Start in **Play & see** and follow the ten stops. Each stop answers one question. The box inspector names what enters, what leaves, and which numbers can be learned. The two challenges let you repair a configuration and translate familiar operations into paper notation.

This workshop is a shape and feedback audit. It does not train a language model or promise that every paper will be easy afterward. The runnable program, `node examples/read-architecture.mjs`, calculates the same shapes, parameter ledger, causal mask, and token loss as the visual lesson.

## The idea connecting every stop

Consider the text `Mia likes warm tea`. A next-token training example uses inputs `Mia likes warm` and targets `likes warm tea`. A row can read its own input token and earlier tokens; it cannot read a future input token. The text supplies the answers without someone hand-labeling a feature called “grammar” or “meaning.” We call this self-supervision.

The model looks up adjustable token representations, adds position information, passes the representations through learned blocks, and predicts a probability distribution. A numerical loss evaluates how much probability went to each actual next token. Backpropagation computes local sensitivities through the operations. An optimizer changes the stored parameters. Repeating this cycle can make useful predictive features develop inside the model.

“Learned features” does not mean a person assigned a name to every number. It also does not establish that the model learned the intended rule or that a feature has a unique human explanation. Check behavior on held-out examples and intervene on suspected mechanisms. The earlier shortcut lesson demonstrates why a low training loss is insufficient.

## The teaching blueprint, fully specified

This is our small **decoder-only** design. It is not a replica of the original 2017 Transformer:

- One sequence of `T` tokens; the batch dimension is omitted.
- A vocabulary of `V` tokens, a representation width `d`, and `C` stored absolute-position rows.
- Learned token and position tables, added together.
- `L` separately parameterized blocks. Each has causal multi-head self-attention, a residual addition followed by LayerNorm, a two-layer ReLU feed-forward network, then a second residual addition and LayerNorm.
- `h` equal-width attention heads, with head width `d/h`; `d` must be divisible by `h`.
- Full-width Q/K/V and output projections, each with biases. Feed-forward inner width `f`, with biases in both projections.
- Each LayerNorm learns `d` scales and `d` shifts. Its mean and variance are calculated across one token row. Its fixed positive epsilon is not a parameter.
- A separate, **untied** vocabulary output matrix and output bias. No final normalization, cross-attention, or dropout.
- Token positions share each block’s weights. Different depth blocks have separate weights.

The default is `T=3, d=4, h=2, f=8, L=2, V=8, C=8`.

| Stored parameters               | Rule                                 | Default |
| ------------------------------- | ------------------------------------ | ------: |
| Token embeddings                | `Vd`                                 |      32 |
| Position embeddings             | `Cd`                                 |      32 |
| Q, K, V projections, all blocks | `3L(d²+d)`                           |     120 |
| Attention output projections    | `L(d²+d)`                            |      40 |
| Two LayerNorms per block        | `4Ld`                                |      32 |
| Feed-forward layers, all blocks | `L(2df+f+d)`                         |     152 |
| Untied vocabulary projection    | `dV+V`                               |      40 |
| **Total**                       | **`2Vd + Cd + V + L(4d²+2df+9d+f)`** | **448** |

These weights would take 1,792 bytes if each occupied exactly one Float32 slot. That counts weights only. It excludes activations, gradients, optimizer states, temporary buffers, implementation overhead, and caches.

The default representation shape is `3×4`; one head has shape `3×2`; all head score arrays have shape `2×3×3`; the expanded feed-forward array is `3×8`; logits have shape `3×8`. These are working arrays, often called **activations**. They are recomputed for each input, whereas parameters persist between examples.

Increasing the input sequence to five tokens keeps 448 parameters because the existing position table already holds eight rows. Increasing the position table itself from eight to sixteen rows adds 32 parameters. Changing from two to four heads keeps the total projection widths fixed and therefore keeps 448 parameters; each head becomes narrower. Adding a third separate block adds 172 parameters, for 620 total. None of these counts predicts accuracy.

Real papers can use tied embeddings, bias-free projections, rotary positions, grouped-query attention, a gated feed-forward network, other normalization, or shared depth weights. Rebuild the ledger from that paper’s actual choices.

## How the final error reaches the first representation

For target token index `y`, a single position’s loss is `−ln(p[y])`. A 25% correct-token probability gives about `1.3863`; 80% gives about `0.2231`. The slider sets hypothetical probabilities to reveal this relationship. They are not outputs of a trained decoder in this workshop.

For a mean over `T` positions, the logit derivative is:

```text
∂loss / ∂logit[t,j] = (p[t,j] − indicator(j = target[t])) / T
```

This starts the backward calculation through the output matrix, each block, and the input lookups. At a residual addition, the incoming derivative reaches both inputs. At a parameter reused across positions, gradient contributions add. Used lookup rows receive gradient contributions; some contributions can be zero. Discrete token IDs are not adjusted by the optimizer.

Backpropagation calculates sensitivities; an optimizer uses them to update parameters. A training step can be fully specified numerically even when its eventual generalization cannot be guaranteed. Large architectures still consist of explicit operations, but describing their useful internal algorithms is a further scientific problem.

## Training versus generation

In a stored training example, all input tokens and next-token targets are already available. The causal mask keeps a row from peeking at later inputs. Rows can therefore be evaluated in parallel within a layer, while layers still depend on previous layers.

When generating, a future token is unknown. The model predicts one token, appends the selected token, and continues. Earlier keys and values may be cached. Ordinary generation usually changes working activations and caches while keeping model parameters fixed. It is not automatically another training update.

## Open a real paper

For **Attention Is All You Need**, start at §3 and match these symbols: `Q` asks, `K` supplies comparison information, `V` carries values, `d_k` is one key’s width, and `softmax(QKᵀ/√d_k)V` mixes the value rows. The original architecture includes both an encoder and a decoder, an encoder–decoder attention sublayer, and shared embedding/output weights, so our ledger is deliberately different. [Original Transformer paper, §3](https://arxiv.org/html/1706.03762v7#S3)

For **Mamba**, start at §3 and trace the state recurrence: `h_t = Ā_t h_(t−1) + B̄_t x_t`, followed by an output readout. Input-dependent update quantities implement selection. The bars denote discretization. The full block also uses projections, convolution, gating, and an efficient scan; the earlier one-number memory game illustrates a selection idea rather than implementing that architecture. [Original Mamba paper, §3](https://arxiv.org/html/2312.00752v2#S3)

Those mappings identify familiar mechanisms, not universal equivalence between architectures. Inspect each paper’s definitions and tensor dimensions before substituting your intuition.

Use this worksheet while reading:

1. **Task:** What goes in, and what must come out? Write one example.
2. **Data:** How are examples and targets obtained? Could training and evaluation share leaked information?
3. **Objective:** Which scalar loss is optimized? Does improving it measure what you care about?
4. **New operation:** What changed? Write the input/output shapes, persistent parameters, temporary states, and gradient paths.
5. **Ablation:** What happens when the proposed part is removed or replaced, with other conditions comparable?
6. **Evaluation:** Which unseen data, metrics, baselines, and seeds support the claim? Is an improvement larger than the reported uncertainty?
7. **Cost:** Distinguish parameter storage, activation memory, training compute, and inference speed. A fast implementation and a lower operation count are related but different evidence.

An unanswered item tells you what to investigate next. It does not mean you failed to understand the whole paper.
