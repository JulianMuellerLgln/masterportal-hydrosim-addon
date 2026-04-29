import { startPolygonDraw } from './cesiumDraw.js';
import { sampleTerrainGrid } from './terrainSampler.js';
import { createWaterRenderer } from './waterRenderer.js';
import { computeImpact } from './lod2Impact.js';
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
    let result;
    try {
      result = await WebAssembly.instantiateStreaming(fetch('/hydrosim.wasm'), {
        env: {
          abort(msg, file, line, col) {
            ERR(`WASM abort at ${file}:${line}:${col}`, msg);
          }
        }
      });
    } catch (_streamErr) {
      const resp = await fetch('/hydrosim.wasm');
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

  async function runTerrainSampling(scene) {
    setState('sampling');
    ui.setStatus('Terrain wird abgetastet…', 'bi-hourglass-split');
    ui.setProgress(0.05);

    try {
      terrainInfo = await sampleTerrainGrid(scene, polygonCoords, 50, p => ui.setProgress(p * 0.9));
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

  function finishSimulation() {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
    setState('results');
    ui.setProgress(null);
    ui.setStatus('Berechne betroffene Gebäude…', 'bi-buildings');

    try {
      const { nx, ny, dx, originLon, originLat } = terrainInfo;
      const h = new Float32Array(wasmMemory.buffer, wasmExports.hPtr(), nx * ny);
      const scene = getScene();
      const impacts = scene ? computeImpact(scene, h, nx, ny, dx, originLon, originLat) : [];
      ui.setImpact(impacts);
      ui.setStatus(`Fertig · ${impacts.length} Gebäude betroffen`, 'bi-check-circle');
    } catch (e) {
      ERR('Impact analysis failed:', e);
      ui.setStatus('Simulation beendet (Impact-Analyse fehlgeschlagen)', 'bi-exclamation-triangle');
    }
  }

  function tickLoop() {
    if (state !== 'running') return;
    if (!terrainInfo) return;

    const params = ui.getParams();
    const { nx, ny, dx, originLon, originLat } = terrainInfo;

    const maxH = Math.max(0.01, wasmExports.maxDepth());
    const dt = Math.min((dx / Math.sqrt(9.81 * maxH)) * 0.45, 4.0);
    const stepsPerFrame = Math.max(1, Math.round(params.speed));

    if (polygonCoords && polygonCoords.length >= 3) {
      const src = computeSourceCenter(polygonCoords, nx, ny, dx, originLon, originLat);
      const sourceAreaCells = Math.max(1, Math.PI * src.radius * src.radius);
      const sourceAreaM2 = sourceAreaCells * dx * dx;
      const fluxM3ps = params.volumeM3 / params.durationS;
      const depthPerStep = (fluxM3ps / sourceAreaM2) * dt;
      wasmExports.injectSource(src.cx, src.cy, src.radius, Math.max(0, depthPerStep));
    }

    for (let i = 0; i < stepsPerFrame; i++) {
      wasmExports.step(dt, 9.81, 0.025);
      simT += dt;
      if (simT >= params.durationS) break;
    }

    ensureRenderer();
    waterRenderer?.update(wasmMemory.buffer, wasmExports.hPtr(), nx, ny, dx, originLon, originLat);

    const maxDepth = wasmExports.maxDepth();
    ui.setProgress(Math.min(1, simT / params.durationS));
    ui.setStatus(`T = ${Math.round(simT)}s · max. Tiefe ${maxDepth.toFixed(2)} m`, 'bi-droplet-fill');

    if (simT >= params.durationS) {
      finishSimulation();
      return;
    }

    animFrameId = requestAnimationFrame(tickLoop);
  }

  ui.onDraw(() => {
    if (state === 'drawing') {
      drawHandler?.destroy();
      drawHandler = null;
      setState('idle');
      ui.setStatus('Zeichnung abgebrochen.', 'bi-x-circle');
      return;
    }

    if (!['idle', 'ready', 'results'].includes(state)) return;

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

    setState('running');
    ui.setStatus('Simulation läuft…', 'bi-play-fill');
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
  ui.setStatus('Bereit — Polygon zeichnen um zu beginnen', 'bi-info-circle');

  window.HydroSim = {
    getState: () => state,
    getTerrain: () => terrainInfo,
    getWasm: () => wasmExports,
    getScene,
    stop: () => {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
      setState('paused');
    }
  };
})();
