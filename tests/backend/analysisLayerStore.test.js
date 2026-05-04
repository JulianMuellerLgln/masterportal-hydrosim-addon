import { describe, expect, it, vi } from 'vitest';
import { createAnalysisLayerStore } from '../../src/analysisLayerStore.js';

function makeSnapshot(nx = 3, ny = 3, dx = 10, fill = 0.2) {
  return {
    meta: { nx, ny, dx, originLon: 9.7, originLat: 52.3 },
    depth: new Float32Array(nx * ny).fill(fill),
    bed: new Float32Array(nx * ny).fill(100),
    rescueHeat: null
  };
}

describe('analysisLayerStore', () => {
  it('creates new layer and refreshes UI', () => {
    const renderer = { upsertStaticLayer: vi.fn(), removeStaticLayer: vi.fn(), clearStaticLayers: vi.fn() };
    const onChange = vi.fn();
    const store = createAnalysisLayerStore(renderer, onChange);

    const result = store.upsertFromSnapshot(makeSnapshot(), 'new');

    expect(result.created).toBe(true);
    expect(renderer.upsertStaticLayer).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalled();
    expect(store.getActiveLayer()).toBeTruthy();
  });

  it('appends into active compatible layer', () => {
    const renderer = { upsertStaticLayer: vi.fn(), removeStaticLayer: vi.fn(), clearStaticLayers: vi.fn() };
    const store = createAnalysisLayerStore(renderer);

    store.upsertFromSnapshot(makeSnapshot(), 'new');
    const result = store.upsertFromSnapshot(makeSnapshot(3, 3, 10, 0.6), 'append');

    expect(result.merged).toBe(true);
    const active = store.getActiveLayer();
    expect(active.depth[0]).toBeCloseTo(0.6, 6);
  });

  it('falls back to new layer when append terrain is incompatible', () => {
    const renderer = { upsertStaticLayer: vi.fn(), removeStaticLayer: vi.fn(), clearStaticLayers: vi.fn() };
    const store = createAnalysisLayerStore(renderer);

    store.upsertFromSnapshot(makeSnapshot(3, 3, 10, 0.2), 'new');
    const result = store.upsertFromSnapshot(makeSnapshot(4, 3, 10, 0.4), 'append');

    expect(result.created).toBe(true);
    expect(store.getAll().size).toBe(2);
  });

  it('clears active and all layers', () => {
    const renderer = { upsertStaticLayer: vi.fn(), removeStaticLayer: vi.fn(), clearStaticLayers: vi.fn() };
    const store = createAnalysisLayerStore(renderer);

    store.upsertFromSnapshot(makeSnapshot(), 'new');
    const activeId = store.getActiveId();
    store.clearActive();
    expect(renderer.removeStaticLayer).toHaveBeenCalledWith(activeId);

    store.upsertFromSnapshot(makeSnapshot(), 'new');
    store.upsertFromSnapshot(makeSnapshot(), 'new');
    store.clearAll();
    expect(renderer.clearStaticLayers).toHaveBeenCalledTimes(1);
    expect(store.getAll().size).toBe(0);
  });

  it('creates dedicated rescue layer without changing active layer when activate is false', () => {
    const renderer = { upsertStaticLayer: vi.fn(), removeStaticLayer: vi.fn(), clearStaticLayers: vi.fn() };
    const store = createAnalysisLayerStore(renderer);

    store.upsertFromSnapshot(makeSnapshot(3, 3, 10, 0.3), 'new', { kind: 'water', activate: true });
    const activeBefore = store.getActiveId();
    const rescue = makeSnapshot(3, 3, 10, 0.25);
    rescue.rescueHeat = new Float32Array(9).fill(0.7);
    store.upsertFromSnapshot(rescue, 'new', { kind: 'rescue', activate: false });

    expect(store.getAll().size).toBe(2);
    expect(store.getActiveId()).toBe(activeBefore);
  });

  it('merges rescue heat values with append strategy on active rescue layer', () => {
    const renderer = { upsertStaticLayer: vi.fn(), removeStaticLayer: vi.fn(), clearStaticLayers: vi.fn() };
    const store = createAnalysisLayerStore(renderer);

    const s1 = makeSnapshot(3, 3, 10, 0.2);
    s1.rescueHeat = new Float32Array(9).fill(0.3);
    store.upsertFromSnapshot(s1, 'new', { kind: 'rescue', activate: true });

    const s2 = makeSnapshot(3, 3, 10, 0.5);
    s2.rescueHeat = new Float32Array(9).fill(0.8);
    const result = store.upsertFromSnapshot(s2, 'append', { kind: 'rescue', activate: true });

    expect(result.merged).toBe(true);
    const active = store.getActiveLayer();
    expect(active.kind).toBe('rescue');
    expect(active.rescueHeat[0]).toBeCloseTo(0.8, 6);
  });
});
