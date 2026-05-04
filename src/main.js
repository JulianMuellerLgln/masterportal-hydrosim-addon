import { startPointDraw, startPolygonDraw, startPolylineDraw } from './cesiumDraw.js';
import { sampleTerrainGrid } from './terrainSampler.js';
import { createWaterRenderer } from './waterRenderer.js';
import { createImpactBoxRenderer } from './impactBoxRenderer.js';
import { createAoiOverlay } from './aoiOverlay.js';
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
  let impactBoxRenderer = null;
  let aoiOverlay = null;
  let animFrameId = null;
  let simT = 0;
  let frameCounter = 0;
  const impactCache = new Map();
  const IMPACT_CACHE_MAX = 10;
  let measureIdSeq = 1;
  let measurePointPrims = null;
  let measureLinePrims = null;
  const placedMeasures = {
    pump: [],
    dike: [],
    retention: []
  };
  const measureCells = {
    pump: [],
    dike: [],
    retention: []
  };
  let rescueHeatGrid = null;

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
    const scene = getScene();
    if (!scene) return;
    if (!waterRenderer) {
      waterRenderer = createWaterRenderer(scene);
    }
    if (!impactBoxRenderer) {
      impactBoxRenderer = createImpactBoxRenderer(scene);
    }
    if (!aoiOverlay) {
      aoiOverlay = createAoiOverlay(scene);
    }
  }

  function ensureMeasureOverlay() {
    const scene = getScene();
    if (!scene || !window.Cesium) return;
    if (!measurePointPrims) {
      measurePointPrims = new window.Cesium.PointPrimitiveCollection();
      scene.primitives.add(measurePointPrims);
    }
    if (!measureLinePrims) {
      measureLinePrims = new window.Cesium.PolylineCollection();
      scene.primitives.add(measureLinePrims);
    }
  }

  function toOverlayCartesian(coord) {
    const scene = getScene();
    const carto = window.Cesium.Cartographic.fromDegrees(coord.lon, coord.lat);
    const h = scene?.globe?.getHeight?.(carto);
    const z = Number.isFinite(h) ? (h + 1.0) : ((terrainInfo?.baseElevation || 0) + 1.0);
    return window.Cesium.Cartesian3.fromDegrees(coord.lon, coord.lat, z);
  }

  function redrawMeasureOverlay() {
    if (!window.Cesium) return;
    ensureMeasureOverlay();
    if (!measurePointPrims || !measureLinePrims) return;

    measurePointPrims.removeAll();
    measureLinePrims.removeAll();

    for (const pump of placedMeasures.pump) {
      measurePointPrims.add({
        position: toOverlayCartesian(pump.coord),
        pixelSize: 9,
        color: window.Cesium.Color.fromCssColorString('#00e5ff'),
        outlineColor: window.Cesium.Color.WHITE,
        outlineWidth: 1
      });
    }

    for (const dike of placedMeasures.dike) {
      if (!Array.isArray(dike.coords) || dike.coords.length < 2) continue;
      const linePositions = dike.coords.map(toOverlayCartesian);
      measureLinePrims.add({
        positions: linePositions,
        width: 3,
        material: window.Cesium.Material.fromType('Color', {
          color: window.Cesium.Color.fromCssColorString('#ffb300')
        }),
        loop: false
      });
    }

    for (const retention of placedMeasures.retention) {
      if (!Array.isArray(retention.coords) || retention.coords.length < 3) continue;
      const ring = retention.coords.map(toOverlayCartesian);
      ring.push(toOverlayCartesian(retention.coords[0]));
      measureLinePrims.add({
        positions: ring,
        width: 2,
        material: window.Cesium.Material.fromType('Color', {
          color: window.Cesium.Color.fromCssColorString('#7cb342')
        }),
        loop: false
      });
    }
  }

  function updateMeasureCounts() {
    ui.setMeasureCounts({
      pump: placedMeasures.pump.length,
      dike: placedMeasures.dike.length,
      retention: placedMeasures.retention.length
    });
  }

  function clearPlacedMeasures(statusText = '') {
    placedMeasures.pump.length = 0;
    placedMeasures.dike.length = 0;
    placedMeasures.retention.length = 0;
    measureCells.pump.length = 0;
    measureCells.dike.length = 0;
    measureCells.retention.length = 0;
    rescueHeatGrid = null;
    impactCache.clear();
    redrawMeasureOverlay();
    updateMeasureCounts();
    if (statusText) {
      ui.setStatus(statusText, 'bi-info-circle');
    }
  }

  function geoToCell(terrain, lon, lat) {
    if (!terrain) return null;
    const mPerDegLat = 111000;
    const midLat = terrain.originLat + (terrain.ny * terrain.dx / mPerDegLat) * 0.5;
    const mPerDegLon = 111000 * Math.cos(midLat * Math.PI / 180);
    const col = Math.round(((lon - terrain.originLon) * mPerDegLon) / terrain.dx);
    const row = Math.round(((lat - terrain.originLat) * mPerDegLat) / terrain.dx);
    if (!Number.isFinite(col) || !Number.isFinite(row)) return null;
    if (col < 0 || col >= terrain.nx || row < 0 || row >= terrain.ny) return null;
    return { col, row };
  }

  function cellToGeo(terrain, col, row) {
    const mPerDegLat = 111000;
    const midLat = terrain.originLat + (terrain.ny * terrain.dx / mPerDegLat) * 0.5;
    const mPerDegLon = 111000 * Math.cos(midLat * Math.PI / 180);
    return {
      lon: terrain.originLon + ((col + 0.5) * terrain.dx) / mPerDegLon,
      lat: terrain.originLat + ((row + 0.5) * terrain.dx) / mPerDegLat
    };
  }

  function bresenhamCells(a, b) {
    const out = [];
    let x0 = a.col;
    let y0 = a.row;
    const x1 = b.col;
    const y1 = b.row;
    const dx = Math.abs(x1 - x0);
    const sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0);
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;

    while (true) {
      out.push({ col: x0, row: y0 });
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
    return out;
  }

  function pointInPolygon(lon, lat, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lon;
      const yi = polygon[i].lat;
      const xj = polygon[j].lon;
      const yj = polygon[j].lat;
      const intersects = ((yi > lat) !== (yj > lat))
        && (lon < ((xj - xi) * (lat - yi)) / ((yj - yi) || 1e-9) + xi);
      if (intersects) inside = !inside;
    }
    return inside;
  }

  function rebuildMeasureCells() {
    measureCells.pump.length = 0;
    measureCells.dike.length = 0;
    measureCells.retention.length = 0;
    if (!terrainInfo) return;

    for (const pump of placedMeasures.pump) {
      const c = geoToCell(terrainInfo, pump.coord.lon, pump.coord.lat);
      if (!c) continue;
      measureCells.pump.push({
        id: pump.id,
        cx: c.col,
        cy: c.row,
        radius: 2
      });
    }

    const dikeSet = new Set();
    for (const dike of placedMeasures.dike) {
      if (!Array.isArray(dike.coords) || dike.coords.length < 2) continue;
      for (let i = 0; i < dike.coords.length - 1; i++) {
        const a = geoToCell(terrainInfo, dike.coords[i].lon, dike.coords[i].lat);
        const b = geoToCell(terrainInfo, dike.coords[i + 1].lon, dike.coords[i + 1].lat);
        if (!a || !b) continue;
        for (const c of bresenhamCells(a, b)) {
          dikeSet.add(c.row * terrainInfo.nx + c.col);
        }
      }
    }
    measureCells.dike.push(...Array.from(dikeSet));

    const retentionSet = new Set();
    for (const retention of placedMeasures.retention) {
      if (!Array.isArray(retention.coords) || retention.coords.length < 3) continue;
      for (let row = 0; row < terrainInfo.ny; row++) {
        for (let col = 0; col < terrainInfo.nx; col++) {
          const geo = cellToGeo(terrainInfo, col, row);
          if (pointInPolygon(geo.lon, geo.lat, retention.coords)) {
            retentionSet.add(row * terrainInfo.nx + col);
          }
        }
      }
    }
    measureCells.retention.push(...Array.from(retentionSet));
  }

  function serializeMeasureHash() {
    const pumpHash = placedMeasures.pump
      .slice(0, 20)
      .map(p => `${p.coord.lon.toFixed(5)}:${p.coord.lat.toFixed(5)}`)
      .join(',');
    const dikeHash = placedMeasures.dike
      .slice(0, 10)
      .map(d => d.coords.slice(0, 5).map(c => `${c.lon.toFixed(4)}:${c.lat.toFixed(4)}`).join(';'))
      .join('|');
    const retentionHash = placedMeasures.retention
      .slice(0, 10)
      .map(r => r.coords.slice(0, 5).map(c => `${c.lon.toFixed(4)}:${c.lat.toFixed(4)}`).join(';'))
      .join('|');
    return `pc=${placedMeasures.pump.length}:${pumpHash}|dc=${placedMeasures.dike.length}:${dikeHash}|rc=${placedMeasures.retention.length}:${retentionHash}`;
  }

  function applyInfluenceKernel(target, nx, ny, centerCol, centerRow, radiusCells, weight) {
    const r = Math.max(1, Math.round(radiusCells));
    const minCol = Math.max(0, centerCol - r);
    const maxCol = Math.min(nx - 1, centerCol + r);
    const minRow = Math.max(0, centerRow - r);
    const maxRow = Math.min(ny - 1, centerRow + r);
    const sigma = Math.max(1, r * 0.5);
    const inv2Sigma2 = 1 / (2 * sigma * sigma);

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const dc = col - centerCol;
        const dr = row - centerRow;
        const d2 = dc * dc + dr * dr;
        if (d2 > r * r) continue;
        const idx = row * nx + col;
        const influence = Math.exp(-d2 * inv2Sigma2) * weight;
        target[idx] = Math.max(target[idx], influence);
      }
    }
  }

  function buildRescueHeatGrid(h, u, v, nx, ny, level, pumps, dikeCells, retentionCells) {
    const cellCount = nx * ny;
    const support = new Float32Array(cellCount);
    const heat = new Float32Array(cellCount);

    for (const pump of pumps) {
      applyInfluenceKernel(support, nx, ny, pump.cx, pump.cy, 10, 0.95 * level);
    }
    for (const idx of dikeCells) {
      if (idx < 0 || idx >= cellCount) continue;
      const row = Math.floor(idx / nx);
      const col = idx - row * nx;
      applyInfluenceKernel(support, nx, ny, col, row, 5, 0.55 * level);
    }
    for (const idx of retentionCells) {
      if (idx < 0 || idx >= cellCount) continue;
      const row = Math.floor(idx / nx);
      const col = idx - row * nx;
      applyInfluenceKernel(support, nx, ny, col, row, 6, 0.70 * level);
    }

    for (let i = 0; i < cellCount; i++) {
      const depth = Number.isFinite(h[i]) ? h[i] : 0;
      if (depth <= 0.002) {
        heat[i] = 0;
        continue;
      }
      const ux = Number.isFinite(u[i]) ? u[i] : 0;
      const vy = Number.isFinite(v[i]) ? v[i] : 0;
      const speed = Math.sqrt(ux * ux + vy * vy);
      const depthRisk = Math.max(0, Math.min(1, depth / 1.8));
      const speedRisk = Math.max(0, Math.min(1, speed / 2.5));
      const hazard = depthRisk * 0.72 + speedRisk * 0.28;
      const mitigation = Math.max(0, Math.min(1, support[i]));
      heat[i] = Math.max(0, Math.min(1, hazard * (1 - 0.62 * mitigation)));
    }

    return heat;
  }

  function captureCurrentSnapshot(options = {}) {
    const includeRescueHeat = options.includeRescueHeat === true;
    if (!terrainInfo || !wasmMemory || !wasmExports) return null;
    const { nx, ny, dx, originLon, originLat, baseElevation = 0 } = terrainInfo;
    const n = nx * ny;
    const h = new Float32Array(wasmMemory.buffer, wasmExports.hPtr(), n);
    const zb = new Float32Array(wasmMemory.buffer, wasmExports.zbPtr(), n);
    const rescueHeat = includeRescueHeat && rescueHeatGrid && rescueHeatGrid.length === n
      ? new Float32Array(rescueHeatGrid)
      : null;
    return {
      meta: { nx, ny, dx, originLon, originLat, baseElevation },
      depth: new Float32Array(h),
      bed: new Float32Array(zb),
      rescueHeat
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
      rebuildMeasureCells();
      redrawMeasureOverlay();
      impactCache.clear();

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

  function adaptSourceToFlux(src, effectiveFluxM3ps, dt, dx, nx, ny, maxSourceStepM) {
    if (!src || !Number.isFinite(effectiveFluxM3ps) || effectiveFluxM3ps <= 0) {
      return { radius: src?.radius || 1, depthPerStep: 0 };
    }

    const maxRadiusByGrid = Math.max(1, Math.floor(Math.min(src.cx, nx - 1 - src.cx, src.cy, ny - 1 - src.cy)));
    const baseRadius = Math.max(1, Math.min(maxRadiusByGrid, src.radius));
    const targetVolumePerStep = effectiveFluxM3ps * dt;

    // Keep per-step source depth stable by increasing source area when needed.
    const minAreaForCap = targetVolumePerStep / Math.max(1e-8, maxSourceStepM);
    const minCellsForCap = Math.max(1, minAreaForCap / (dx * dx));
    const requiredRadius = Math.max(baseRadius, Math.ceil(Math.sqrt(minCellsForCap / Math.PI)));
    const radius = Math.min(maxRadiusByGrid, requiredRadius);

    const sourceAreaCells = Math.max(1, Math.PI * radius * radius);
    const sourceAreaM2 = sourceAreaCells * dx * dx;
    const depthPerStep = clampWithLog(
      (effectiveFluxM3ps / sourceAreaM2) * dt,
      0,
      maxSourceStepM,
      'sourceDepthStep'
    );

    return { radius, depthPerStep };
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
    const placedHash = serializeMeasureHash();
    return `${grid}|v=${params.volumeM3}|d=${params.durationS}|m=${mode}|pr=${profile}|ml=${clamp01(m.level).toFixed(2)}|mp=${m.pump ? 1 : 0}|md=${m.dike ? 1 : 0}|mr=${m.retention ? 1 : 0}|mh=${placedHash}|p=${poly}`;
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
      ensureRenderer();
      impactBoxRenderer?.update(impacts);
      const waterSnapshot = captureCurrentSnapshot({ includeRescueHeat: false });
      const rescueSnapshot = captureCurrentSnapshot({ includeRescueHeat: true });
      const layerResult = analysisStore.upsertFromSnapshot(
        waterSnapshot,
        ui.getLayerStrategy(),
        { kind: 'water', activate: true }
      );
      analysisStore.upsertFromSnapshot(
        rescueSnapshot,
        'new',
        { kind: 'rescue', activate: false }
      );
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

  function updateHydroVisualState(runtime) {
    const { nx, ny, dx, originLon, originLat, baseElevation = 0 } = terrainInfo;
    const cellCount = nx * ny;
    const h = new Float32Array(wasmMemory.buffer, wasmExports.hPtr(), cellCount);
    const u = new Float32Array(wasmMemory.buffer, wasmExports.uPtr(), cellCount);
    const v = new Float32Array(wasmMemory.buffer, wasmExports.vPtr(), cellCount);

    rescueHeatGrid = buildRescueHeatGrid(
      h,
      u,
      v,
      nx,
      ny,
      clamp01(ui.getParams().measures?.level),
      ui.getParams().measures?.pump ? measureCells.pump : [],
      ui.getParams().measures?.dike ? measureCells.dike : [],
      ui.getParams().measures?.retention ? measureCells.retention : []
    );

    ensureRenderer();
    waterRenderer?.update(
      wasmMemory.buffer,
      wasmExports.hPtr(),
      wasmExports.zbPtr(),
      wasmExports.uPtr(),
      wasmExports.vPtr(),
      nx,
      ny,
      dx,
      originLon,
      originLat,
      baseElevation,
      simT,
      rescueHeatGrid
    );

    const maxDepthRaw = wasmExports.maxDepth();
    const maxDepth = Number.isFinite(maxDepthRaw) && maxDepthRaw >= 0
      ? clampWithLog(maxDepthRaw, 0, runtime.solver.maxDisplayDepth, 'maxDisplayDepth')
      : 0;
    ui.setProgress(Math.min(1, simT / Math.max(1, ui.getParams().durationS)));
    ui.setStatus(`T = ${Math.round(simT)}s · max. Tiefe ${maxDepth.toFixed(2)} m`, 'bi-droplet-fill');
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
    const { nx, ny, dx, originLon, originLat, baseElevation = 0 } = terrainInfo;

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
      const fluxM3ps = params.volumeM3 / Math.max(1, params.durationS);
      const measureReduction = Math.max(
        0.20,
        1
          - (measures.pump ? 0.35 * level : 0)
          - (measures.retention ? 0.25 * level : 0)
          - (measures.dike ? 0.10 * level : 0)
      );
      const effectiveFlux = fluxM3ps * mf.inflow * measureReduction;
      const adapted = adaptSourceToFlux(
        src,
        effectiveFlux,
        dt,
        dx,
        nx,
        ny,
        runtime.solver.maxSourceStepM
      );
      src.radius = adapted.radius;
      depthPerStep = adapted.depthPerStep;
    }

    const activePumps = measures.pump ? measureCells.pump : [];
    const activeDikeCells = measures.dike ? measureCells.dike : [];
    const activeRetentionCells = measures.retention ? measureCells.retention : [];
    const cf = Math.max(runtime.solver.minFriction, runtime.solver.baseFriction * mf.friction);
    const pumpFluxTotal = (params.volumeM3 / Math.max(1, params.durationS)) * 0.30 * level;
    const pumpFluxPerMeasure = activePumps.length > 0 ? (pumpFluxTotal / activePumps.length) : 0;
    const dikeDamping = Math.max(0.05, 1 - (runtime.solver.frictionBoost.dike * level));
    const retentionDamping = Math.max(0.1, 1 - (runtime.solver.frictionBoost.retention * level * 0.8));
    const retentionDrainRate = 0.0008 * level;
    const cellCount = nx * ny;

    for (let i = 0; i < stepsPerFrame; i++) {
      const subSteps = Math.max(1, Math.ceil(dt / runtime.solver.targetSubstepDt));
      const dtSub = dt / subSteps;
      const srcSub = depthPerStep / subSteps;
      const pumpSinkSub = pumpFluxPerMeasure > 0
        ? adaptSourceToFlux(
          { cx: 0, cy: 0, radius: 2 },
          pumpFluxPerMeasure,
          dtSub,
          dx,
          nx,
          ny,
          runtime.solver.maxSourceStepM
        ).depthPerStep
        : 0;
      for (let s = 0; s < subSteps; s++) {
        if (src) {
          wasmExports.injectSource(src.cx, src.cy, src.radius, srcSub);
        }
        if (pumpSinkSub > 0) {
          for (const pump of activePumps) {
            wasmExports.injectSource(pump.cx, pump.cy, pump.radius, -pumpSinkSub);
          }
        }
        wasmExports.step(dtSub, 9.81, cf);

        if (activeDikeCells.length > 0 || activeRetentionCells.length > 0) {
          const h = new Float32Array(wasmMemory.buffer, wasmExports.hPtr(), cellCount);
          const u = new Float32Array(wasmMemory.buffer, wasmExports.uPtr(), cellCount);
          const v = new Float32Array(wasmMemory.buffer, wasmExports.vPtr(), cellCount);

          for (const idx of activeDikeCells) {
            if (idx < 0 || idx >= cellCount) continue;
            u[idx] *= dikeDamping;
            v[idx] *= dikeDamping;
          }

          if (retentionDrainRate > 0) {
            for (const idx of activeRetentionCells) {
              if (idx < 0 || idx >= cellCount) continue;
              const depth = h[idx];
              if (!Number.isFinite(depth) || depth <= 0) continue;
              h[idx] = Math.max(0, depth - (retentionDrainRate * dtSub));
              u[idx] *= retentionDamping;
              v[idx] *= retentionDamping;
            }
          }
        }
      }
      simT += dt;
      if (simT >= params.durationS) break;
    }

    frameCounter += 1;
    const finishedByDuration = simT >= params.durationS;
    const shouldRender = finishedByDuration
      || frameCounter === 1
      || (frameCounter % runtime.solver.renderEveryFrames) === 0;
    if (shouldRender) {
      updateHydroVisualState(runtime);
    }

    if (finishedByDuration) {
      if (!shouldRender) {
        updateHydroVisualState(runtime);
      }
      finishSimulation();
      return;
    }

    animFrameId = requestAnimationFrame(tickLoop);
  }

  function addPlacedMeasure(type, geometry) {
    const id = `${type}-${measureIdSeq++}`;
    if (type === 'pump') {
      placedMeasures.pump.push({ id, coord: geometry });
    } else if (type === 'dike') {
      placedMeasures.dike.push({ id, coords: geometry });
    } else if (type === 'retention') {
      placedMeasures.retention.push({ id, coords: geometry });
    }
    rebuildMeasureCells();
    redrawMeasureOverlay();
    impactCache.clear();
    updateMeasureCounts();
  }

  function handleMeasureDrawStart(statusText, startFn, onComplete) {
    if (state === 'running' || state === 'sampling') return;
    if (!applyInteractionGate()) return;
    const scene = getScene();
    if (!scene) {
      ui.setStatus('3D-Modus aktivieren, um Maßnahmen zu platzieren.', 'bi-exclamation-triangle');
      return;
    }

    const resumeState = terrainInfo ? 'ready' : 'idle';
    drawHandler?.destroy();
    setState('drawing');
    ui.setStatus(statusText, 'bi-geo-alt');

    drawHandler = startFn(scene, (coords) => {
      drawHandler = null;
      onComplete(coords);
      setState(resumeState);
    });
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
      ensureRenderer();
      aoiOverlay?.setPolygon(coords);
      clearPlacedMeasures('Maßnahmen wurden zurückgesetzt (neues Gebiet).');
      await runTerrainSampling(scene);
    });
  });

  ui.onPlacePump(() => {
    if (!polygonCoords || !terrainInfo) {
      ui.setStatus('Zuerst Polygon zeichnen und Terrain laden.', 'bi-exclamation-circle');
      return;
    }
    handleMeasureDrawStart(
      'Pumpe setzen: Klick = Position · Rechtsklick = Abbruch',
      startPointDraw,
      (coord) => {
        addPlacedMeasure('pump', coord);
        ui.setStatus('Pumpe platziert.', 'bi-check-circle');
      }
    );
  });

  ui.onPlaceDike(() => {
    if (!polygonCoords || !terrainInfo) {
      ui.setStatus('Zuerst Polygon zeichnen und Terrain laden.', 'bi-exclamation-circle');
      return;
    }
    handleMeasureDrawStart(
      'Deichlinie: Klick = Punkt · Doppelklick/Rechtsklick = Fertig',
      startPolylineDraw,
      (coords) => {
        if (!Array.isArray(coords) || coords.length < 2) {
          ui.setStatus('Deichlinie verworfen.', 'bi-info-circle');
          return;
        }
        addPlacedMeasure('dike', coords);
        ui.setStatus('Deichlinie platziert.', 'bi-check-circle');
      }
    );
  });

  ui.onPlaceRetention(() => {
    if (!polygonCoords || !terrainInfo) {
      ui.setStatus('Zuerst Polygon zeichnen und Terrain laden.', 'bi-exclamation-circle');
      return;
    }
    handleMeasureDrawStart(
      'Retentionsfläche: Klick = Punkt · Doppelklick = Fertig',
      startPolygonDraw,
      (coords) => {
        if (!Array.isArray(coords) || coords.length < 3) {
          ui.setStatus('Retentionsfläche verworfen.', 'bi-info-circle');
          return;
        }
        addPlacedMeasure('retention', coords);
        ui.setStatus('Retentionsfläche platziert.', 'bi-check-circle');
      }
    );
  });

  ui.onMeasureClearAll(() => {
    clearPlacedMeasures('Maßnahmen entfernt.');
  });

  ui.onRun(() => {
    if (!applyInteractionGate()) return;

    if (!terrainInfo || !wasmExports) return;
    if (!['ready', 'paused'].includes(state)) return;

    if (state === 'ready') {
      simT = 0;
      frameCounter = 0;
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
    impactBoxRenderer?.clear();
    wasmExports.reset();

    polygonCoords = null;
    terrainInfo = null;
    simT = 0;
    frameCounter = 0;
    rescueHeatGrid = null;
    clearPlacedMeasures();
    aoiOverlay?.clear();

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
  updateMeasureCounts();
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
