export const RUNTIME_PROFILE = {
  standard: {
    maxInteractiveCameraHeightM: 8000,
    solver: {
      renderEveryFrames: 2,
      maxDepthForDt: 4,
      minDepthForDt: 0.01,
      cfl: 0.55,
      dtCap: 0.65,
      targetSubstepDt: 0.1,
      maxSourceStepM: 0.00022,
      maxDisplayDepth: 20,
      baseFriction: 0.045,
      minFriction: 0.015,
      frictionBoost: { dike: 0.55, retention: 0.35, pump: 0.15 }
    },
    modeFactors: {
      rain: { inflow: 1.0, friction: 1.0 },
      flash: { inflow: 1.35, friction: 0.8 },
      river: { inflow: 1.0, friction: 0.75 }
    }
  },
  advanced: {
    maxInteractiveCameraHeightM: 8000,
    solver: {
      renderEveryFrames: 2,
      maxDepthForDt: 3,
      minDepthForDt: 0.02,
      cfl: 0.5,
      dtCap: 0.5,
      targetSubstepDt: 0.07,
      maxSourceStepM: 0.0002,
      maxDisplayDepth: 15,
      baseFriction: 0.05,
      minFriction: 0.02,
      frictionBoost: { dike: 0.6, retention: 0.4, pump: 0.18 }
    },
    modeFactors: {
      rain: { inflow: 1.0, friction: 1.0 },
      flash: { inflow: 1.3, friction: 0.82 },
      river: { inflow: 0.98, friction: 0.78 }
    }
  }
};

export function clamp01(v) {
  return Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
}

export function resolveEventMode(params) {
  if (params.mode && params.mode !== 'auto') return params.mode;
  const intensity = params.volumeM3 / Math.max(60, params.durationS);
  if (intensity < 110) return 'rain';
  if (params.durationS >= 3 * 3600 && intensity < 280) return 'river';
  return 'flash';
}

export function getRuntimeProfile(params) {
  const key = params?.profile === 'advanced' ? 'advanced' : 'standard';
  return RUNTIME_PROFILE[key];
}

export function terrainCompatible(a, b) {
  if (!a || !b) return false;
  return a.nx === b.nx
    && a.ny === b.ny
    && Math.round(a.dx * 1000) === Math.round(b.dx * 1000);
}

export function mergeDepthBuffers(baseDepth, nextDepth) {
  for (let i = 0; i < baseDepth.length; i++) {
    const a = baseDepth[i];
    const b = nextDepth[i];
    baseDepth[i] = Number.isFinite(a) && Number.isFinite(b)
      ? Math.max(a, b)
      : (Number.isFinite(a) ? a : (Number.isFinite(b) ? b : 0));
  }
}

export function createAnalysisLayerName(index, now = new Date()) {
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `A${index} ${hh}:${mm}`;
}
