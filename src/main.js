import { startPolygonDraw } from './cesiumDraw.js';
import { sampleTerrainGrid } from './terrainSampler.js';
import { createWaterRenderer } from './waterRenderer.js';
import { computeImpact, countLoadedTilesets } from './lod2Impact.js';
import { createPanel } from './panel.js';
import { createAnalysisLayerStore } from './analysisLayerStore.js';
import { clamp01, getRuntimeProfile, resolveEventMode } from './simCore.js';

(async function HydroSimMain() {
  'use strict';

  const LOG = (...a) => console.log('[HydroSim]', ...a);
  const ERR = (...a) => console.error('[HydroSim]', ...a);

  let wasmExports = null;
  let wasmMemory = null;
  const clampStats = new Map();

  function getScene() {
    return window.mapCollection?.getMap?.('3D')?.getCesiumScene?.() ?? null;
  }

  function getMapMode() {
    const store = document.getElementById('masterportal-root')
      ?.__vue_app__?.config?.globalProperties?.$store;
    return store?.state?.Maps?.mode ?? null;
  }

  async function ensure3DMode() {
    const store = document.getElementById('masterportal-root')
      ?.__vue_app__?.config?.globalProperties?.$store;
    if (!store) return false;
    if (store.state?.Maps?.mode === '3D') return true;
    try {
      await store.dispatch('Maps/activateMap3d');
      return true;
    } catch (_e) {
      try {
        await store.dispatch('Maps/changeMapMode', '3D');
        return true;
      } catch (_e2) {
        return false;
      }
    }
  }

  async function waitForCesium() {
    return new Promise(resolve => {
      const iv = setInterval(() => {
        if (window.Cesium && getScene()) {
          clearInterval(iv);
          resolve();
        }
      }, 500);
    });
  }

  try {
    const wasmUrl = `/hydrosim.wasm?v=${Date.now()}`;
    let result;
    try {
      result = await WebAssembly.instantiateStreaming(fetch(wasmUrl, { cache: 'no-store' }), {
        env: {
          abort(msg, file, line, col) {
            ERR(`WASM abort at ${file}:${line}:${col}`, msg);
          }
        }
      });
    } catch (_streamErr) {
      const resp = await fetch(wasmUrl, { cache: 'no-store' });
      const bytes = await resp.arrayBuffer();
      result = await WebAssembly.instantiate(bytes, {
        env: {
          abort(msg, file, line, col) {
            ERR(`WASM abort at ${file}:${line}:${col}`, msg);
          }
        }
      });
    }
    wasmExports = result.instance.exports;
    wasmMemory = wasmExports.memory;
    LOG('WASM loaded.');
  } catch (e) {
    ERR('WASM load failed:', e);
  }

  await waitForCesium();

  const ui = createPanel();
  ui.setState('idle');

  if (!wasmExports) {
    ui.setStatus('WASM konnte nicht geladen werden — Simulation deaktiviert', 'bi-exclamation-triangle');
    return;
  }

  let state = 'idle';
  let polygonCoords = null;
  let terrainInfo = null;
  let drawHandler = null;
  let waterRenderer = null;
  let animFrameId = null;
  let simT = 0;
  let frameCounter = 0;
  const impactCache = new Map();
  const IMPACT_CACHE_MAX = 10;

  function clampWithLog(v, min, max, key) {
    const safe = Number.isFinite(v) ? v : min;
    const out = Math.min(max, Math.max(min, safe));
    if (out !== safe) {
      const nextCount = (clampStats.get(key) || 0) + 1;
      clampStats.set(key, nextCount);
      if (nextCount === 1 || nextCount % 20 === 0) {
        LOG(`Clamp ${key}: in=${safe}, out=${out}, count=${nextCount}`);
      }
    }
    return out;
  }

  function getQualityFlag() {
    return getMapMode() === '3D' ? 'analysis-3d' : 'preview-2d';
  }

  function updateQualityUi(extra = '') {
    ui.setQuality(getQualityFlag(), extra);
  }

  function setState(next) {
    state = next;
    ui.setState(next);
    LOG('State ->', next);
  }

  function ensureRenderer() {
    if (!waterRenderer) {
      const scene = getScene();
      if (scene) waterRenderer = createWaterRenderer(scene);
    }
  }

  function captureCurrentSnapshot() {
    if (!terrainInfo || !wasmMemory || !wasmExports) return null;
    const { nx, ny, dx, originLon, originLat } = terrainInfo;
    const n = nx * ny;
    const h = new Float32Array(wasmMemory.buffer, wasmExports.hPtr(), n);
    const zb = new Float32Array(wasmMemory.buffer, wasmExports.zbPtr(), n);
    return {
      meta: { nx, ny, dx, originLon, originLat },
      depth: new Float32Array(h),
      bed: new Float32Array(zb)
    };
  }

  const analysisStore = createAnalysisLayerStore(
    {
      upsertStaticLayer: (...args) => waterRenderer?.upsertStaticLayer(...args),
      removeStaticLayer: (id) => waterRenderer?.removeStaticLayer(id),
      clearStaticLayers: () => waterRenderer?.clearStaticLayers()
    },
    (layers, activeId) => ui.setAnalysisLayers(layers, activeId)
  );

  function exportActiveAsGeoJson() {
    const layer = analysisStore.getActiveLayer();
    const source = layer ? {
      meta: layer.meta,
      depth: layer.depth
    } : captureCurrentSnapshot();
    if (!source) {
      ui.setStatus('Kein Ergebnis zum Export vorhanden.', 'bi-exclamation-circle');
      return;
    }

    const { nx, ny, dx, originLon, originLat } = source.meta;
    const h = source.depth;
    const mPerDegLat = 111000;
    const midLat = originLat + ((ny / 2) * dx / mPerDegLat);
    const mPerDegLon = 111000 * Math.cos(midLat * Math.PI / 180);
    const dLon = dx / mPerDegLon;
    const dLat = dx / mPerDegLat;
    const features = [];
    const step = Math.max(1, Math.floor(Math.sqrt((nx * ny) / 9000)));

    for (let row = 0; row < ny; row += step) {
      for (let col = 0; col < nx; col += step) {
        const depth = h[row * nx + col];
        if (!Number.isFinite(depth) || depth < 0.05) continue;
        const lon = originLon + (col + 0.5) * dLon;
        const lat = originLat + (row + 0.5) * dLat;
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lon, lat] },
          properties: {
            depth_m: Math.round(depth * 1000) / 1000,
            row,
            col,
            cell_m: Math.round(dx * 100) / 100
          }
        });
      }
    }

    const fc = {
      type: 'FeatureCollection',
      properties: {
        generatedAt: new Date().toISOString(),
        nx,
        ny,
        dx,
        sourceLayer: layer?.name || 'current-run',
        qualityFlag: getQualityFlag(),
        profile: ui.getParams().profile || 'standard',
        selectedMode: ui.getParams().mode || 'auto',
        resolvedMode: resolveEventMode(ui.getParams()),
        durationS: ui.getParams().durationS,
        volumeM3: ui.getParams().volumeM3,
        measures: ui.getParams().measures || {}
      },
      features
    };
    const blob = new Blob([JSON.stringify(fc)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hydrosim-${layer?.id || 'current'}-${Date.now()}.geojson`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    ui.setStatus(`Export erstellt (${features.length} Features)`, 'bi-download');
  }

  function clearActiveAnalysisLayer() {
    analysisStore.clearActive();
  }

  function clearAllAnalysisLayers() {
    analysisStore.clearAll();
  }

  function cameraHeightOk() {
    const params = ui.getParams();
    const runtime = getRuntimeProfile(params);
    const scene = getScene();
    const camera = scene?.camera;
    if (!camera || !window.Cesium) return false;
    const carto = window.Cesium.Cartographic.fromCartesian(camera.positionWC);
    return Number.isFinite(carto.height) && carto.height <= runtime.maxInteractiveCameraHeightM;
  }

  function applyInteractionGate() {
    const ok = cameraHeightOk();
    ui.setGate(ok);
    if (!ok && state === 'idle') {
      updateQualityUi('3D für belastbare Analysen erforderlich');
      ui.setStatus(
        `Für HydroSim näher heranzoomen (Kamerahöhe < ${getRuntimeProfile(ui.getParams()).maxInteractiveCameraHeightM} m).`,
        'bi-zoom-in'
      );
    }
    if (ok && state === 'idle') {
      updateQualityUi('Analysemodus aktiv');
      ui.setStatus('Bereit — Polygon zeichnen um zu beginnen', 'bi-info-circle');
    }
    return ok;
  }

  function samplingResolutionForCamera() {
    const scene = getScene();
    const camera = scene?.camera;
    if (!camera || !window.Cesium) return 50;
    const carto = window.Cesium.Cartographic.fromCartesian(camera.positionWC);
    const h = carto.height;
    if (!Number.isFinite(h)) return 50;
    if (h < 2500) return 20;
    if (h < 5000) return 30;
    return 50;
  }

  function modeFactors(mode) {
    const runtime = getRuntimeProfile(ui.getParams());
    return runtime.modeFactors[mode] || runtime.modeFactors.rain;
  }

  async function runTerrainSampling(scene) {
    setState('sampling');
    ui.setStatus('Terrain wird abgetastet…', 'bi-hourglass-split');
    ui.setProgress(0.05);

    try {
      const resM = samplingResolutionForCamera();
      terrainInfo = await sampleTerrainGrid(scene, polygonCoords, resM, p => ui.setProgress(p * 0.9));
      ui.setProgress(1.0);

      const { heights, nx, ny, dx } = terrainInfo;
      const hOff = wasmExports.init(nx, ny, dx);
      if (hOff < 0) {
        throw new Error('WASM init failed: not enough memory for grid');
      }

      wasmMemory = wasmExports.memory;
      const scratchOff = wasmExports.scratchPtr();
      new Float32Array(wasmMemory.buffer, scratchOff, nx * ny).set(heights);
      wasmExports.setTerrain(scratchOff, nx * ny);

      setTimeout(() => ui.setProgress(null), 500);
      setState('ready');
      ui.setStatus(`Bereit. Grid: ${nx}x${ny}, dx=${dx.toFixed(0)}m`, 'bi-check-circle');
    } catch (err) {
      ERR('Terrain sampling failed:', err);
      ui.setProgress(null);
      setState('idle');
      ui.setStatus('Terrain-Abfrage fehlgeschlagen: ' + err.message, 'bi-exclamation-triangle');
    }
  }

  function computeSourceCenter(coords, nx, ny, dx, originLon, originLat) {
    const lon = coords.reduce((s, c) => s + c.lon, 0) / coords.length;
    const lat = coords.reduce((s, c) => s + c.lat, 0) / coords.length;

    const mPerDegLat = 111320;
    const mPerDegLon = 111320 * Math.cos((lat * Math.PI) / 180);

    const cx = Math.round(((lon - originLon) * mPerDegLon) / dx);
    const cy = Math.round(((lat - originLat) * mPerDegLat) / dx);

    const lons = coords.map(c => c.lon);
    const lats = coords.map(c => c.lat);
    const spanX = ((Math.max(...lons) - Math.min(...lons)) * mPerDegLon) / dx;
    const spanY = ((Math.max(...lats) - Math.min(...lats)) * mPerDegLat) / dx;
    const radius = Math.max(2, Math.round(Math.min(spanX, spanY) * 0.25));

    return {
      cx: Math.max(radius, Math.min(nx - 1 - radius, cx)),
      cy: Math.max(radius, Math.min(ny - 1 - radius, cy)),
      radius
    };
  }

  function buildImpactCacheKey() {
    const params = ui.getParams();
    const mode = resolveEventMode(params);
    const profile = params.profile === 'advanced' ? 'advanced' : 'standard';
    const m = params.measures || {};
    const poly = (polygonCoords || [])
      .slice(0, 12)
      .map(p => `${p.lon.toFixed(5)}:${p.lat.toFixed(5)}`)
      .join('|');
    const grid = terrainInfo ? `${terrainInfo.nx}x${terrainInfo.ny}@${Math.round(terrainInfo.dx)}` : 'nogrid';
    return `${grid}|v=${params.volumeM3}|d=${params.durationS}|m=${mode}|pr=${profile}|ml=${clamp01(m.level).toFixed(2)}|mp=${m.pump ? 1 : 0}|md=${m.dike ? 1 : 0}|mr=${m.retention ? 1 : 0}|p=${poly}`;
  }

  function computeImpactAsync(scene, h, nx, ny, dx, originLon, originLat) {
    return new Promise(resolve => {
      const run = () => resolve(computeImpact(scene, h, nx, ny, dx, originLon, originLat));
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(run, { timeout: 250 });
      } else {
        setTimeout(run, 0);
      }
    });
  }

  async function finishSimulation() {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
    setState('results');
    ui.setProgress(null);
    ui.setStatus('Berechne betroffene Gebäude…', 'bi-buildings');

    try {
      const { nx, ny, dx, originLon, originLat } = terrainInfo;
      const h = new Float32Array(wasmMemory.buffer, wasmExports.hPtr(), nx * ny);
      const scene = getScene();
      const key = buildImpactCacheKey();
      const loadedTilesets = scene ? countLoadedTilesets(scene) : 0;
      let impacts = impactCache.get(key);
      const cacheHit = !!impacts;
      if (!impacts) {
        impacts = scene ? await computeImpactAsync(scene, h, nx, ny, dx, originLon, originLat) : [];
        impactCache.set(key, impacts);
        if (impactCache.size > IMPACT_CACHE_MAX) {
          const oldest = impactCache.keys().next().value;
          impactCache.delete(oldest);
        }
      }
      ui.setImpact(impacts);
      const layerResult = analysisStore.upsertFromSnapshot(captureCurrentSnapshot(), ui.getLayerStrategy());
      const quality = getQualityFlag() === 'analysis-3d' ? 'Analyse (3D)' : 'Vorschau (2D)';
      if (loadedTilesets === 0) {
        ui.setStatus(`Fertig · ${quality} · keine LoD2-Gebäudelayer geladen (Impact = 0)${cacheHit ? ' · Cache-Hit' : ''}`, 'bi-info-circle');
      } else {
        const layerTxt = layerResult.merged ? 'Layer ergänzt' : (layerResult.created ? 'Layer neu' : 'Layer unverändert');
        ui.setStatus(`Fertig · ${quality} · ${impacts.length} Gebäude betroffen · ${layerTxt}${cacheHit ? ' · Cache-Hit' : ''}`, 'bi-check-circle');
      }
    } catch (e) {
      ERR('Impact analysis failed:', e);
      ui.setStatus('Simulation beendet (Impact-Analyse fehlgeschlagen)', 'bi-exclamation-triangle');
    }
  }

  function tickLoop() {
    if (state !== 'running') return;
    if (!terrainInfo) return;

    const params = ui.getParams();
    const runtime = getRuntimeProfile(params);
    const mode = resolveEventMode(params);
    const mf = modeFactors(mode);
    const measures = params.measures || {};
    const level = clamp01(measures.level);
    const { nx, ny, dx, originLon, originLat } = terrainInfo;

    // Guard against non-finite solver outputs to keep dt and UI stable.
    const rawMaxDepth = wasmExports.maxDepth();
    const safeMaxDepth = Number.isFinite(rawMaxDepth) && rawMaxDepth > 0
      ? clampWithLog(rawMaxDepth, runtime.solver.minDepthForDt, runtime.solver.maxDepthForDt, 'maxDepthForDt')
      : runtime.solver.minDepthForDt;
    const maxH = Math.max(runtime.solver.minDepthForDt, safeMaxDepth);
    const dt = Math.min((dx / Math.sqrt(9.81 * maxH)) * runtime.solver.cfl, runtime.solver.dtCap);
    const stepsPerFrame = Math.max(1, Math.round(params.speed));

    let src = null;
    let depthPerStep = 0;
    if (polygonCoords && polygonCoords.length >= 3) {
      src = computeSourceCenter(polygonCoords, nx, ny, dx, originLon, originLat);
      const sourceAreaCells = Math.max(1, Math.PI * src.radius * src.radius);
      const sourceAreaM2 = sourceAreaCells * dx * dx;
      const fluxM3ps = params.volumeM3 / Math.max(1, params.durationS);
      const measureReduction = Math.max(
        0.20,
        1
          - (measures.pump ? 0.35 * level : 0)
          - (measures.retention ? 0.25 * level : 0)
          - (measures.dike ? 0.10 * level : 0)
      );
      const effectiveFlux = fluxM3ps * mf.inflow * measureReduction;
      depthPerStep = clampWithLog((effectiveFlux / sourceAreaM2) * dt, 0, runtime.solver.maxSourceStepM, 'sourceDepthStep');
    }

    const frictionBoost =
      1
      + (measures.dike ? runtime.solver.frictionBoost.dike * level : 0)
      + (measures.retention ? runtime.solver.frictionBoost.retention * level : 0)
      + (measures.pump ? runtime.solver.frictionBoost.pump * level : 0);
    const cf = Math.max(runtime.solver.minFriction, runtime.solver.baseFriction * mf.friction * frictionBoost);

    for (let i = 0; i < stepsPerFrame; i++) {
      const subSteps = Math.max(1, Math.ceil(dt / runtime.solver.targetSubstepDt));
      const dtSub = dt / subSteps;
      const srcSub = depthPerStep / subSteps;
      for (let s = 0; s < subSteps; s++) {
        if (src) {
          wasmExports.injectSource(src.cx, src.cy, src.radius, srcSub);
        }
        wasmExports.step(dtSub, 9.81, cf);
      }
      simT += dt;
      if (simT >= params.durationS) break;
    }

    frameCounter += 1;
    if (frameCounter % 2 === 0) {
      ensureRenderer();
      waterRenderer?.update(
        wasmMemory.buffer,
        wasmExports.hPtr(),
        wasmExports.zbPtr(),
        nx,
        ny,
        dx,
        originLon,
        originLat
      );
    }

    const maxDepthRaw = wasmExports.maxDepth();
    const maxDepth = Number.isFinite(maxDepthRaw) && maxDepthRaw >= 0
      ? clampWithLog(maxDepthRaw, 0, runtime.solver.maxDisplayDepth, 'maxDisplayDepth')
      : 0;
    ui.setProgress(Math.min(1, simT / params.durationS));
    ui.setStatus(`T = ${Math.round(simT)}s · max. Tiefe ${maxDepth.toFixed(2)} m`, 'bi-droplet-fill');

    if (simT >= params.durationS) {
      finishSimulation();
      return;
    }

    animFrameId = requestAnimationFrame(tickLoop);
  }

  ui.onDraw(async () => {
    if (state === 'drawing') {
      drawHandler?.destroy();
      drawHandler = null;
      setState('idle');
      ui.setStatus('Zeichnung abgebrochen.', 'bi-x-circle');
      return;
    }

    if (!['idle', 'ready', 'results'].includes(state)) return;

    if (!applyInteractionGate()) return;

    if (getMapMode() !== '3D') {
      const switched = await ensure3DMode();
      if (!switched) {
        ui.setStatus('Bitte zuerst in den 3D-Modus wechseln.', 'bi-exclamation-triangle');
        return;
      }
    }

    const scene = getScene();
    if (!scene) {
      ui.setStatus('3D-Modus aktivieren und Polygon zeichnen…', 'bi-pencil-square');
      return;
    }

    setState('drawing');
    ui.setStatus('Klicken = Punkt setzen · Doppelklick = Fertig · Rechtsklick = Fertig/Abbruch', 'bi-pencil-square');

    drawHandler = startPolygonDraw(scene, async coords => {
      drawHandler = null;
      polygonCoords = coords;
      await runTerrainSampling(scene);
    });
  });

  ui.onRun(() => {
    if (!applyInteractionGate()) return;

    if (!terrainInfo || !wasmExports) return;
    if (!['ready', 'paused'].includes(state)) return;

    if (state === 'ready') {
      simT = 0;
      wasmExports.reset();
      const { heights, nx, ny } = terrainInfo;
      const scratchOff = wasmExports.scratchPtr();
      new Float32Array(wasmMemory.buffer, scratchOff, nx * ny).set(heights);
      wasmExports.setTerrain(scratchOff, nx * ny);
    }

    const mode = resolveEventMode(ui.getParams());
    const profile = ui.getParams().profile === 'advanced' ? 'Advanced' : 'Standard';
    const modeLabel = mode === 'flash' ? 'Sturzflut' : mode === 'river' ? 'Fluss' : 'Starkregen';
    setState('running');
    ui.setStatus(`Simulation läuft… (${profile} · ${modeLabel})`, 'bi-play-fill');
    cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(tickLoop);
  });

  ui.onPause(() => {
    if (state !== 'running') return;
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
    setState('paused');
    ui.setStatus(`Pausiert bei T=${Math.round(simT)}s`, 'bi-pause-fill');
  });

  ui.onReset(() => {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
    drawHandler?.destroy();
    drawHandler = null;
    waterRenderer?.clear();
    wasmExports.reset();

    polygonCoords = null;
    terrainInfo = null;
    simT = 0;

    setState('idle');
    ui.setStatus('', '');
    ui.setProgress(null);
    ui.setImpact([]);
  });

  ui.onExport(() => {
    exportActiveAsGeoJson();
  });

  ui.onLayerClear(() => {
    clearActiveAnalysisLayer();
  });

  ui.onLayerClearAll(() => {
    clearAllAnalysisLayers();
  });

  ui.onLayerActiveChange(() => {
    analysisStore.setActive(ui.getActiveLayerId() || null);
  });

  setState('idle');
  applyInteractionGate();
  ui.setAnalysisLayers([], null);
  updateQualityUi('3D für belastbare Analysen erforderlich');
  const gateInterval = setInterval(applyInteractionGate, 800);

  window.HydroSim = {
    getState: () => state,
    getTerrain: () => terrainInfo,
    getWasm: () => wasmExports,
    getScene,
    stop: () => {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
      setState('paused');
    },
    destroy: () => {
      clearInterval(gateInterval);
    }
  };
})();
