import { describe, expect, it } from 'vitest';
import {
  clamp01,
  createAnalysisLayerName,
  getRuntimeProfile,
  mergeDepthBuffers,
  resolveEventMode,
  terrainCompatible
} from '../../src/simCore.js';

describe('simCore', () => {
  it('resolves automatic event mode by intensity', () => {
    expect(resolveEventMode({ mode: 'auto', volumeM3: 6000, durationS: 3600 })).toBe('rain');
    expect(resolveEventMode({ mode: 'auto', volumeM3: 200000, durationS: 600 })).toBe('flash');
    expect(resolveEventMode({ mode: 'auto', volumeM3: 2000000, durationS: 600 })).toBe('flash');
    expect(resolveEventMode({ mode: 'auto', volumeM3: 2000000, durationS: 4 * 3600 })).toBe('river');
  });

  it('respects manual event mode', () => {
    expect(resolveEventMode({ mode: 'flash', volumeM3: 1, durationS: 1 })).toBe('flash');
  });

  it('clamps measure level into [0,1]', () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(0.4)).toBe(0.4);
    expect(clamp01(2)).toBe(1);
  });

  it('returns runtime profiles for standard and advanced', () => {
    expect(getRuntimeProfile({ profile: 'standard' }).solver.dtCap).toBe(0.65);
    expect(getRuntimeProfile({ profile: 'advanced' }).solver.dtCap).toBe(0.5);
  });

  it('validates terrain compatibility', () => {
    const a = { nx: 10, ny: 20, dx: 4.001 };
    const b = { nx: 10, ny: 20, dx: 4.0012 };
    const c = { nx: 11, ny: 20, dx: 4.0012 };
    expect(terrainCompatible(a, b)).toBe(true);
    expect(terrainCompatible(a, c)).toBe(false);
  });

  it('merges depth arrays with max and finite fallback', () => {
    const base = new Float32Array([0.1, Number.NaN, 0.5]);
    const next = new Float32Array([0.2, 0.4, Number.NaN]);
    mergeDepthBuffers(base, next);
    expect(base[0]).toBeCloseTo(0.2, 6);
    expect(base[1]).toBeCloseTo(0.4, 6);
    expect(base[2]).toBeCloseTo(0.5, 6);
  });

  it('generates human-friendly layer names', () => {
    const name = createAnalysisLayerName(2, new Date('2026-01-01T09:07:00Z'));
    expect(name.startsWith('A2 ')).toBe(true);
  });
});
