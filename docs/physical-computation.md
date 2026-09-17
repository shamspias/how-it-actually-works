# From a weight to a physical update

The physical-computation chapter connects a training equation to memory and arithmetic hardware. Its moving packets are a teaching schematic. They do not simulate individual electrons, transistor timing, a particular processor, or the electrical details of a real memory device.

## What represents a number?

In digital logic, a circuit interprets specified ranges of electrical voltage as logical low and high. Those states encode bits. Their meaning depends on an agreed representation: the same eight-bit pattern can be interpreted as an unsigned integer, a signed integer, or part of another format. There is no universal rule that one bit equals one volt. Input thresholds, output levels, and noise margins are properties of the actual circuit family. [Texas Instruments, Understanding and Interpreting Standard-Logic Data Sheets](https://www.ti.com/lit/an/szza036c/szza036c.pdf).

Transistors are organized into logic gates and larger circuits. Arithmetic units combine such circuits to manipulate encoded operands; control circuitry selects operations and routes their results. Registers retain working values. A program and its runtime determine which operations implement a model and its optimizer. [Intel, The Transistor, Explained](https://www.intel.com/content/www/us/en/newsroom/tech101/the-transistor-explained.html).

The lesson uses **signed two's-complement integers with four fractional bits**. It defines the representation explicitly, avoiding ambiguous fixed-point naming conventions:

```text
Unsigned byte u: 0 through 255
Signed integer q: u, if u < 128; otherwise u - 256
Represented weight w: q / 16

Range: -8 through 7.9375
Spacing: 1/16 = 0.0625
Bit place values: -8, 4, 2, 1, 1/2, 1/4, 1/8, 1/16
```

For example, `00011000` encodes integer 24, so it represents 1.5. `11111000` encodes unsigned 248, interpreted as signed -8, so it represents -0.5. Clicking a bit changes the weighted sum of those place values. This is a deliberately small teaching format, **not Float32**.

## Follow one update

The model is `prediction = w × x`, with input `x = 1`, target `t = 0.5`, loss `L = 0.5(prediction - t)^2`, and learning rate `η = 0.25`.

| Stage         | Calculation for the default weight | What the schematic represents                                           |
| ------------- | ---------------------------------- | ----------------------------------------------------------------------- |
| Read          | `00011000 → 24 / 16 → w = 1.5`     | Fetch the encoded weight into working storage.                          |
| Multiply      | `prediction = 1.5 × 1 = 1.5`       | Arithmetic circuits process input and weight values.                    |
| Measure loss  | `error = 1`; `L = 0.5 × 1² = 0.5`  | Evaluate the objective using the supplied target.                       |
| Find gradient | `dL/dw = error × x = 1`            | Evaluate the chain-rule derivative and propose `1.5 - 0.25 × 1 = 1.25`. |
| Write         | `1.25 × 16 = 20 → 00010100`        | Store the new encoded weight for subsequent predictions.                |

After this update, the loss on the same example is `0.5(1.25 - 0.5)^2 = 0.28125`. Both the original and updated weights fit exactly in the toy representation.

The illustration retains the original snapshot while you inspect the stages. The memory display changes at **Write**. **Replay this update** replays the same snapshot; **Use this weight for another update** starts a new calculation from the result. Changing the starting slider or a bit resets the stage sequence.

## Rounding is part of the mechanism

The interactive calculation uses JavaScript's wider arithmetic for intermediate values, then rounds the weight to the nearest multiple of 1/16 when writing it. `Math.round` resolves halfway cases toward positive infinity. The chosen input, target, and rate keep every permitted update within the signed eight-bit range, so this demonstration never needs to wrap or saturate an overflowing weight.

For a starting weight of `0.625`, the proposal is `0.59375`. That is halfway between `0.5625` and `0.625`, so this rounding rule writes `0.625` again. A nonzero mathematical gradient can therefore produce no change in a coarse stored representation. Real training systems choose numerical formats and may retain higher-precision copies of weights to help with update precision. [NVIDIA, Train With Mixed Precision](https://docs.nvidia.com/deeplearning/performance/mixed-precision-training/index.html).

The arithmetic and storage precision of this illustration are distinct from those in the standalone JavaScript neural-network example. That example uses JavaScript `Number`; the toy chapter quantizes its displayed stored weight deliberately.

## Where the learning happens

The learning mechanism is the organized process: data and targets, a chosen objective, an update algorithm, hardware executing its operations, and persistent changes to stored parameters. Electrical signals implement the process. Electricity alone does not identify the desired answers or invent the objective.

Ordinary inference uses stored trained parameters while activations and context-dependent state change. A weight update requires an additional training or adaptation operation. Memory is drawn as one box here, but actual execution uses registers, caches, and larger memories with hardware-specific storage and transfer mechanisms.

## Physics does not remove missing information

Semiconductor physics involves quantum mechanics. A conventional CPU or GPU uses those devices to execute a **classical digital computation**. This is a different claim from executing a quantum algorithm on qubits.

Quantum computation offers different algorithms for some problems. Whether it helps depends on the problem, algorithm, data access, and implementation; changing the computing substrate is not a general learning guarantee. [IBM Quantum Learning, Which problems are quantum computers good for?](https://quantum.cloud.ibm.com/learning/en/courses/quantum-computing-in-practice/applications-of-qc).

The unseen-data ambiguity in [the theory chapter](theory.md) is an information argument. If two possible worlds provide exactly the same available evidence, the learner receives no information distinguishing them. This argument still applies when the computation is faster or runs on different hardware. New measurements or justified assumptions can help distinguish the worlds.

Two useful research directions add structure in different ways:

- **Physics-informed learning** can incorporate equations, boundary conditions, or other physical knowledge into a model or its objective. Those constraints are extra assumptions and information. Their usefulness depends on whether they describe the actual problem and whether training solves the objective adequately. [Raissi, Perdikaris, and Karniadakis, Physics Informed Deep Learning, Part I](https://arxiv.org/abs/1711.10561).
- **Neuromorphic computing** explores implementations such as event-driven spiking networks and placing memory near computation. These choices change the operations, learning rules, and efficiency available to a system. They do not automatically establish an arbitrary model's future accuracy. [Intel, Neuromorphic Computing Research](https://www.intel.com/content/www/us/en/research/neuromorphic-computing.html).

The next useful question is concrete: which assumptions, measurements, circuits, or algorithms would resolve the uncertainty in this particular task?
