import { startPolygonDraw } from './cesiumDraw.js';
import { sampleTerrainGrid } from './terrainSampler.js';
import { createWaterRenderer } from './waterRenderer.js';
import { computeImpact, countLoadedTilesets } from './lod2Impact.js';
import { createPanel } from './panel.js';

(async function HydroSimMain() {
  'use strict';

  const LOG = (...a) => console.log('[HydroSim]', ...a);
  const ERR = (...a) => console.error('[HydroSim]', ...a);

  let wasmExports = null;
  let wasmMemory = null;

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
  const MAX_INTERACTIVE_CAMERA_HEIGHT_M = 8000;

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

  function cameraHeightOk() {
    const scene = getScene();
    const camera = scene?.camera;
    if (!camera || !window.Cesium) return false;
    const carto = window.Cesium.Cartographic.fromCartesian(camera.positionWC);
    return Number.isFinite(carto.height) && carto.height <= MAX_INTERACTIVE_CAMERA_HEIGHT_M;
  }

  function applyInteractionGate() {
    const ok = cameraHeightOk();
    ui.setGate(ok);
    if (!ok && state === 'idle') {
      ui.setStatus(
        `Für HydroSim näher heranzoomen (Kamerahöhe < ${MAX_INTERACTIVE_CAMERA_HEIGHT_M} m).`,
        'bi-zoom-in'
      );
    }
    if (ok && state === 'idle') {
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

  function clamp01(v) {
    return Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
  }

  function resolveEventMode(params) {
    if (params.mode && params.mode !== 'auto') return params.mode;
    const intensity = params.volumeM3 / Math.max(60, params.durationS);
    if (intensity < 150) return 'rain';
    if (intensity < 900) return 'flash';
    return 'river';
  }

  function modeFactors(mode) {
    if (mode === 'flash') return { inflow: 1.20, friction: 0.95 };
    if (mode === 'river') return { inflow: 0.90, friction: 0.85 };
    return { inflow: 1.00, friction: 1.00 };
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
    const m = params.measures || {};
    const poly = (polygonCoords || [])
      .slice(0, 12)
      .map(p => `${p.lon.toFixed(5)}:${p.lat.toFixed(5)}`)
      .join('|');
    const grid = terrainInfo ? `${terrainInfo.nx}x${terrainInfo.ny}@${Math.round(terrainInfo.dx)}` : 'nogrid';
    return `${grid}|v=${params.volumeM3}|d=${params.durationS}|m=${mode}|ml=${clamp01(m.level).toFixed(2)}|mp=${m.pump ? 1 : 0}|md=${m.dike ? 1 : 0}|mr=${m.retention ? 1 : 0}|p=${poly}`;
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
      if (!impacts) {
        impacts = scene ? await computeImpactAsync(scene, h, nx, ny, dx, originLon, originLat) : [];
        impactCache.set(key, impacts);
        if (impactCache.size > IMPACT_CACHE_MAX) {
          const oldest = impactCache.keys().next().value;
          impactCache.delete(oldest);
        }
      }
      ui.setImpact(impacts);
      if (loadedTilesets === 0) {
        ui.setStatus('Fertig · keine LoD2-Gebäudelayer geladen (Impact = 0)', 'bi-info-circle');
      } else {
        ui.setStatus(`Fertig · ${impacts.length} Gebäude betroffen`, 'bi-check-circle');
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
    const mode = resolveEventMode(params);
    const mf = modeFactors(mode);
    const measures = params.measures || {};
    const level = clamp01(measures.level);
    const { nx, ny, dx, originLon, originLat } = terrainInfo;

    // Guard against non-finite solver outputs to keep dt and UI stable.
    const rawMaxDepth = wasmExports.maxDepth();
    const safeMaxDepth = Number.isFinite(rawMaxDepth) && rawMaxDepth > 0 ? Math.min(rawMaxDepth, 10) : 0.01;
    const maxH = Math.max(0.01, safeMaxDepth);
    const dt = Math.min((dx / Math.sqrt(9.81 * maxH)) * 0.45, 4.0);
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
      depthPerStep = Math.max(0, Math.min(0.01, (effectiveFlux / sourceAreaM2) * dt));
    }

    const frictionBoost =
      1
      + (measures.dike ? 0.55 * level : 0)
      + (measures.retention ? 0.35 * level : 0)
      + (measures.pump ? 0.15 * level : 0);
    const cf = Math.max(0.01, 0.025 * mf.friction * frictionBoost);

    for (let i = 0; i < stepsPerFrame; i++) {
      if (src) {
        wasmExports.injectSource(src.cx, src.cy, src.radius, depthPerStep);
      }
      wasmExports.step(dt, 9.81, cf);
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
    const maxDepth = Number.isFinite(maxDepthRaw) && maxDepthRaw >= 0 ? Math.min(maxDepthRaw, 99) : 0;
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
    const modeLabel = mode === 'flash' ? 'Sturzflut' : mode === 'river' ? 'Fluss' : 'Starkregen';
    setState('running');
    ui.setStatus(`Simulation läuft… (${modeLabel})`, 'bi-play-fill');
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

  setState('idle');
  applyInteractionGate();
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
