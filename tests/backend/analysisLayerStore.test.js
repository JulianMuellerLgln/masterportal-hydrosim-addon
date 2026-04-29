import { describe, expect, it, vi } from 'vitest';
import { createAnalysisLayerStore } from '../../src/analysisLayerStore.js';

function makeSnapshot(nx = 3, ny = 3, dx = 10, fill = 0.2) {
  return {
    meta: { nx, ny, dx, originLon: 9.7, originLat: 52.3 },
    depth: new Float32Array(nx * ny).fill(fill),
    bed: new Float32Array(nx * ny).fill(100)
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
});
