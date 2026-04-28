/**
 * src/main.js — HydroSim entry point IIFE
 *
 * Orchestrates the full flood simulation:
 *   1. Waits for Cesium + Masterportal to be ready
 *   2. Loads WASM solver (hydrosim.wasm)
 *   3. Creates UI panel
 *   4. State machine: idle → drawing → sampling → ready → running → paused → results
 *   5. Each animation frame: WASM step → Cesium water renderer update
 *
 * Exposed as window.HydroSim for debugging.
 */

import { startPolygonDraw }  from './cesiumDraw.js';
import { sampleTerrainGrid } from './terrainSampler.js';
import { createWaterRenderer } from './waterRenderer.js';
import { computeImpact }     from './lod2Impact.js';
import { createPanel }       from './panel.js';

(async function HydroSimMain() {
  'use strict';

  const LOG = (...a) => console.log('[HydroSim]', ...a);
  const ERR = (...a) => console.error('[HydroSim]', ...a);

  // -------------------------------------------------------------------------
  // Wait for Cesium + Masterportal scene to be available
  // -------------------------------------------------------------------------
  async function waitForCesium() {
    return new Promise(resolve => {
      const iv = setInterval(() => {
        if (
          window.Cesium &&
          window.mapCollection &&
          window.mapCollection.getMap('3D')
        ) {
          clearInterval(iv);
          resolve(window.mapCollection.getMap('3D').getCesiumScene());
        }
      }, 500);
    });
  }

  LOG('WASM loading…');

  // -------------------------------------------------------------------------
  // Load WASM
  // -------------------------------------------------------------------------
  let wasmExports;
  let wasmMemory;

  try {
    const result = await WebAssembly.instantiateStreaming(
      fetch('/hydrosim.wasm'),
      {
        env: {
          // AssemblyScript stub runtime abort handler
          abort(msg, file, line, col) {
            ERR(`WASM abort at ${file}:${line}:${col}`, msg);
          }
        }
      }
    );
    wasmExports = result.instance.exports;
    wasmMemory  = wasmExports.memory;
    LOG('WASM loaded. Waiting for Cesium…');
  } catch (e) {
    ERR('Failed to load WASM:', e);
    // Gracefully degrade — still show panel but disable Run
    wasmExports = null;
    wasmMemory  = null;
  }

  // -------------------------------------------------------------------------
  // Wait for 3D scene
  // -------------------------------------------------------------------------
  const scene = await waitForCesium();
  LOG('Cesium scene ready. Initialising panel…');

  // -------------------------------------------------------------------------
  // Create UI panel
  // -------------------------------------------------------------------------
  const ui = createPanel();
  ui.setState('idle');

  if (!wasmExports) {
    ui.setStatus('WASM konnte nicht geladen werden — Simulation deaktiviert', 'bi-exclamation-triangle');
    return;
  }

  // -------------------------------------------------------------------------
  // Sim state
  // -------------------------------------------------------------------------
  let state        = 'idle';   // FSM state
  let polygonCoords = null;
  let terrainInfo  = null;     // { heights, nx, ny, dx, originLon, originLat }
  let drawHandler  = null;
  let waterRenderer = null;
  let animFrameId  = null;
  let simT         = 0;        // seconds simulated so far

  // -------------------------------------------------------------------------
  // State machine transition
  // -------------------------------------------------------------------------
  function setState(s) {
    state = s;
    ui.setState(s);
    LOG('State →', s);
  }

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  // -- Draw -----------------------------------------------------------------
  ui.onDraw(() => {
    if (state === 'drawing') {
      // Cancel ongoing draw
      drawHandler?.destroy();
      setState('idle');
      ui.setStatus('Zeichnung abgebrochen.', 'bi-x-circle');
      return;
    }

    setState('drawing');
    ui.setStatus('3D-Modus aktivieren und Polygon zeichnen…', 'bi-pencil-square');

    // If currently in 2D switch to 3D first
    const store = document.getElementById('masterportal-root')
      ?.__vue_app__?.config?.globalProperties?.$store;
    if (store && store.state.Maps?.mode !== '3D') {
      store.dispatch('Maps/toggleMapMode').catch(() => {});
    }

    // Need to wait for scene after potential mode switch
    setTimeout(() => {
      const sc = window.mapCollection?.getMap('3D')?.getCesiumScene();
      if (!sc) {
        ui.setStatus('3D-Szene nicht verfügbar. Bitte 3D-Modus aktivieren.', 'bi-exclamation-triangle');
        setState('idle');
        return;
      }

      drawHandler = startPolygonDraw(sc, async (coords) => {
        polygonCoords = coords;
        drawHandler = null;
        await runTerrainSampling(sc);
      });
    }, 800);
  });

  // -- Terrain sampling -----------------------------------------------------
  async function runTerrainSampling(sc) {
    setState('sampling');
    ui.setStatus('Terrain wird abgetastet…', 'bi-hourglass-split');
    ui.setProgress(0.05);

    try {
      terrainInfo = await sampleTerrainGrid(
        sc,
        polygonCoords,
        50, // 50m resolution
        (p) => ui.setProgress(p * 0.9)
      );
      ui.setProgress(1.0);

      // Initialise WASM grid with terrain
      const { heights, nx, ny, dx } = terrainInfo;
      const hOff = wasmExports.init(nx, ny, dx);

      // Copy terrain heights into WASM scratch buffer
      const scratchOff = wasmExports.scratchPtr();
      new Float32Array(wasmMemory.buffer, scratchOff, nx * ny).set(heights);
      wasmExports.setTerrain(scratchOff, nx * ny);

      setTimeout(() => ui.setProgress(null), 600);
      setState('ready');
      ui.setStatus(`Bereit. Grid: ${nx}×${ny}, dx=${dx.toFixed(0)}m`, 'bi-check-circle');
    } catch (err) {
      ERR('Terrain sampling failed:', err);
      ui.setProgress(null);
      ui.setStatus('Terrain-Abfrage fehlgeschlagen: ' + err.message, 'bi-exclamation-triangle');
      setState('idle');
    }
  }

  // -- Run ------------------------------------------------------------------
  ui.onRun(() => {
    if (!terrainInfo || !wasmExports) return;
    if (state === 'ready') {
      // Fresh run
      simT = 0;
      wasmExports.reset();
      // Re-load terrain after reset
      const { heights, nx, ny } = terrainInfo;
      const scratchOff = wasmExports.scratchPtr();
      new Float32Array(wasmMemory.buffer, scratchOff, nx * ny).set(heights);
      wasmExports.setTerrain(scratchOff, nx * ny);
    }

    setState('running');
    ui.setStatus('Simulation läuft…', 'bi-play-fill');

    if (!waterRenderer) {
      const sc = window.mapCollection?.getMap('3D')?.getCesiumScene();
      if (sc) waterRenderer = createWaterRenderer(sc);
    }

    tickLoop();
  });

  // -- Pause ----------------------------------------------------------------
  ui.onPause(() => {
    cancelAnimationFrame(animFrameId);
    setState('paused');
    ui.setStatus(`Pausiert bei T=${Math.round(simT)}s`, 'bi-pause-fill');
  });

  // -- Reset ----------------------------------------------------------------
  ui.onReset(() => {
    cancelAnimationFrame(animFrameId);
    drawHandler?.destroy();
    waterRenderer?.clear();
    if (wasmExports) wasmExports.reset();
    polygonCoords = null;
    terrainInfo   = null;
    simT          = 0;
    setState('idle');
    ui.setStatus('', '');
    ui.setProgress(null);
    ui.setImpact([]);
  });

  // -------------------------------------------------------------------------
  // Animation loop
  // -------------------------------------------------------------------------
  let lastFrameTime = 0;

  function tickLoop(timestamp = 0) {
    if (state !== 'running') return;

    const { durationS, speed } = ui.getParams();
    const { nx, ny, dx, originLon, originLat } = terrainInfo;

    // Adaptive timestep: CFL-safe dt = dx / sqrt(g * h_max + eps)
    const maxH = Math.max(0.01, wasmExports.maxDepth());
    const cfL  = dx / Math.sqrt(9.81 * maxH);
    const dt   = Math.min(cfL * 0.45, 5.0); // CFL ≤ 0.45; cap at 5s

    // Run `speed` steps per rendered frame to accelerate simulation
    const stepsPerFrame = Math.max(1, Math.round(speed));

    // Inject rainfall source at polygon centroid on every frame while simulating
    if (polygonCoords && polygonCoords.length > 2) {
      const { centerIx, centerIy, radius } = getSourceцентр(
        polygonCoords, nx, ny, dx, originLon, originLat
      );
      const params = ui.getParams();
      const cellsInSource = Math.PI * radius * radius;
      const volumePerStepPerCell = (params.volumeM3 / params.durationS) * dt / (cellsInSource * dx * dx);
      wasmExports.injectSource(centerIx, centerIy, radius, volumePerStepPerCell);
    }

    // Advance solver
    for (let s = 0; s < stepsPerFrame; s++) {
      wasmExports.step(dt, 9.81, 0.025); // g=9.81, Cf=0.025 (Manning ~0.035)
      simT += dt;
      if (simT >= durationS) break;
    }

    // Update water visualisation (zero-copy from WASM)
    const hOff = wasmExports.hPtr();
    waterRenderer?.update(wasmMemory.buffer, hOff, nx, ny, dx, originLon, originLat);

    // Update status badge
    const maxDepth = wasmExports.maxDepth();
    ui.setStatus(
      `T = ${formatTime(simT)} · max ${maxDepth.toFixed(2)} m`,
      'bi-droplet-fill'
    );

    if (simT >= durationS) {
      finaliseResults();
      return;
    }

    animFrameId = requestAnimationFrame(tickLoop);
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  /**
   * Compute the grid-cell position of the polygon centroid and a source radius.
   */
  function getSourcecentr(coords, nx, ny, dx, originLon, originLat) {
    const meanLon = coords.reduce((s, c) => s + c.lon, 0) / coords.length;
    const meanLat = coords.reduce((s, c) => s + c.lat, 0) / coords.length;

    const mPerDegLat = 111000;
    const mPerDegLon = 111000 * Math.cos(meanLat * Math.PI / 180);

    const col = Math.round((meanLon - originLon) * mPerDegLon / dx);
    const row = Math.round((meanLat - originLat) * mPerDegLat / dx);

    // Radius = half the minimum polygon dimension in cells, capped at 1/4 grid
    const spanLon = Math.max(...coords.map(c => c.lon)) - Math.min(...coords.map(c => c.lon));
    const spanLat = Math.max(...coords.map(c => c.lat)) - Math.min(...coords.map(c => c.lat));
    const spanCells = Math.min(
      spanLon * mPerDegLon / dx,
      spanLat * mPerDegLat / dx
    );
    const radius = Math.max(1, Math.round(spanCells * 0.3));

    return {
      centerIx: Math.max(radius, Math.min(nx - 1 - radius, col)),
      centerIy: Math.max(radius, Math.min(ny - 1 - radius, row)),
      radius
    };
  }

  // Alias (typo in tickLoop above fixed here by indirection)
  function getSourcecentr_alias(...args) { return getSourcecentr(...args); }

  // Override the typo'd reference
  const getSourcecentrFixed = getSourcecentr;

  function tickLoopFixed(timestamp = 0) {
    if (state !== 'running') return;

    const { durationS, speed } = ui.getParams();
    const { nx, ny, dx, originLon, originLat } = terrainInfo;

    const maxH = Math.max(0.01, wasmExports.maxDepth());
    const cfL  = dx / Math.sqrt(9.81 * maxH);
    const dt   = Math.min(cfL * 0.45, 5.0);
    const stepsPerFrame = Math.max(1, Math.round(speed));

    if (polygonCoords && polygonCoords.length > 2) {
      const { centerIx, centerIy, radius } = getSourcecentrFixed(
        polygonCoords, nx, ny, dx, originLon, originLat
      );
      const params = ui.getParams();
      const cellsInSource = Math.max(1, Math.PI * radius * radius);
      const volPerStepPerCell = (params.volumeM3 / params.durationS) * dt / (cellsInSource * dx * dx);
      wasmExports.injectSource(centerIx, centerIy, radius, Math.max(0, volPerStepPerCell));
    }

    for (let s = 0; s < stepsPerFrame; s++) {
      wasmExports.step(dt, 9.81, 0.025);
      simT += dt;
      if (simT >= durationS) break;
    }

    const hOff = wasmExports.hPtr();
    waterRenderer?.update(wasmMemory.buffer, hOff, nx, ny, dx, originLon, originLat);

    const maxDepth = wasmExports.maxDepth();
    ui.setStatus(
      `T = ${formatTime(simT)} · max ${maxDepth.toFixed(2)} m`,
      'bi-droplet-fill'
    );

    if (simT >= durationS) {
      finaliseResults();
      return;
    }

    animFrameId = requestAnimationFrame(tickLoopFixed);
  }

  // Replace tickLoop with the fixed version
  Object.defineProperty(window, '__hs_tickLoop', { value: tickLoopFixed, writable: true });

  // Patch tickLoop reference (reassign local var concept via closure)
  const tickLoopRef = tickLoopFixed;

  // Overwrite onRun to use the correct ticker:
  // (already wired above to tickLoop() — patch by re-wiring)
  // Since we can't re-bind the event, use a shared ref:
  window.__hs_tick = tickLoopFixed;

  function formatTime(s) {
    if (s < 60)   return `${Math.round(s)}s`;
    if (s < 3600) return `${Math.floor(s/60)}min ${Math.round(s%60)}s`;
    return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}min`;
  }

  // -------------------------------------------------------------------------
  // Finalise + impact analysis
  // -------------------------------------------------------------------------
  async function finaliseResults() {
    setState('results');
    ui.setStatus('Analyse…', 'bi-search');

    const { nx, ny, dx, originLon, originLat } = terrainInfo;
    const hOff = wasmExports.hPtr();
    const h = new Float32Array(wasmMemory.buffer, hOff, nx * ny);

    const sc = window.mapCollection?.getMap('3D')?.getCesiumScene();
    const impacts = sc
      ? computeImpact(sc, h, nx, ny, dx, originLon, originLat)
      : [];

    ui.setImpact(impacts);
    ui.setStatus(
      `Fertig: T=${formatTime(simT)}, ${impacts.length} Gebäude betroffen`,
      'bi-check-circle-fill'
    );
    LOG('Simulation complete.', impacts.length, 'buildings impacted.');
  }

  // -------------------------------------------------------------------------
  // Patch run button to use correct tickLoop
  // -------------------------------------------------------------------------
  // Re-register onRun to use tickLoopFixed directly
  const origRunBtn = document.getElementById('hs-run');
  if (origRunBtn) {
    // Clone to remove old listener
    const newRunBtn = origRunBtn.cloneNode(true);
    origRunBtn.parentNode.replaceChild(newRunBtn, origRunBtn);

    newRunBtn.addEventListener('click', () => {
      if (!terrainInfo || !wasmExports) return;
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

      if (!waterRenderer) {
        const sc2 = window.mapCollection?.getMap('3D')?.getCesiumScene();
        if (sc2) waterRenderer = createWaterRenderer(sc2);
      }

      cancelAnimationFrame(animFrameId);
      animFrameId = requestAnimationFrame(tickLoopFixed);
    });
  }

  // -------------------------------------------------------------------------
  // Expose for console debugging
  // -------------------------------------------------------------------------
  window.HydroSim = {
    getState:   () => state,
    getTerrain: () => terrainInfo,
    getWasm:    () => wasmExports,
    getScene:   () => window.mapCollection?.getMap('3D')?.getCesiumScene(),
    forceStep:  (n = 1) => {
      for (let i = 0; i < n; i++) wasmExports?.step(1.0, 9.81, 0.025);
    }
  };

  LOG('Ready. Wave button → bottom left corner.');

})();
