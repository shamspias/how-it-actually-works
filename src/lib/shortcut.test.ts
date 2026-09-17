import { describe, expect, it } from 'vitest';
import {
  createShortcutData,
  emptyShortcutModel,
  predictShortcut,
  shortcutAccuracy,
  shortcutLoss,
  trainShortcut,
} from './shortcut';

describe('shortcut experiment', () => {
  it('generates deterministic fresh examples whose shape always determines the label', () => {
    const data = createShortcutData(144, 101, 0.95);
    expect(data).toEqual(createShortcutData(144, 101, 0.95));
    expect(data).not.toEqual(createShortcutData(144, 701, 0.95));
    for (const sample of data) {
      expect(sample.label).toBe(Number(sample.shape === 'circle'));
      expect(sample.label).toBe(Number(sample.shapeFeature > 0));
      expect(sample.background === 'mint').toBe(sample.backgroundFeature > 0);
    }
    const diverse = createShortcutData(144, 101, 0.5);
    expect(
      diverse.map(({ shape, label, shapeFeature }) => ({ shape, label, shapeFeature })),
    ).toEqual(data.map(({ shape, label, shapeFeature }) => ({ shape, label, shapeFeature })));
  });

  it('actually learns the biased shortcut, which fails under the background intervention', () => {
    const train = createShortcutData(144, 101, 0.95);
    const snapshot = structuredClone(train);
    const familiar = createShortcutData(300, 701, 0.95);
    const shifted = createShortcutData(300, 907, 0.05);
    const model = trainShortcut(train);
    expect(shortcutLoss(model, train)).toBeLessThan(shortcutLoss(emptyShortcutModel(), train));
    expect(shortcutAccuracy(model, familiar)).toBeGreaterThan(0.9);
    expect(shortcutAccuracy(model, shifted)).toBeLessThan(0.1);
    expect(predictShortcut(model, { shapeFeature: 0.35, backgroundFeature: 1 })).toBeGreaterThan(
      0.8,
    );
    expect(predictShortcut(model, { shapeFeature: 0.35, backgroundFeature: -1 })).toBeLessThan(0.2);
    expect(train).toEqual(snapshot);
    expect(model).toEqual(trainShortcut(train));
  });

  it('learns a shape-based prediction from diverse examples and survives the same intervention', () => {
    const train = createShortcutData(144, 101, 0.5);
    const model = trainShortcut(train);
    expect(shortcutLoss(model, train)).toBeLessThan(shortcutLoss(emptyShortcutModel(), train));
    expect(shortcutAccuracy(model, createShortcutData(300, 907, 0.05))).toBeGreaterThan(0.95);
    const mintCircle = predictShortcut(model, { shapeFeature: 0.35, backgroundFeature: 1 });
    const lavenderCircle = predictShortcut(model, { shapeFeature: 0.35, backgroundFeature: -1 });
    expect(mintCircle).toBeGreaterThan(0.5);
    expect(lavenderCircle).toBeGreaterThan(0.5);
    expect(Math.abs(mintCircle - lavenderCircle)).toBeLessThan(0.05);
  });

  it('uses the actual averaged BCE derivative for the first update', () => {
    const data = createShortcutData(9, 27, 0.8);
    const initial = emptyShortcutModel();
    const step = trainShortcut(data, 1);
    const epsilon = 1e-5;
    for (const key of ['shapeWeight', 'backgroundWeight', 'bias'] as const) {
      const gradient =
        (shortcutLoss({ ...initial, [key]: epsilon }, data) -
          shortcutLoss({ ...initial, [key]: -epsilon }, data)) /
        (2 * epsilon);
      expect(step[key]).toBeCloseTo(-0.15 * gradient, 9);
    }
    expect(trainShortcut(data, 0)).toEqual(initial);
  });

  it('rejects invalid dataset and training controls', () => {
    expect(() => createShortcutData(0, 1, 0.5)).toThrow();
    expect(() => createShortcutData(1, Infinity, 0.5)).toThrow();
    expect(() => createShortcutData(1, 1, 1.1)).toThrow();
    expect(() => trainShortcut([])).toThrow();
    expect(() => trainShortcut(createShortcutData(2, 1, 0.5), -1)).toThrow();
  });
});
