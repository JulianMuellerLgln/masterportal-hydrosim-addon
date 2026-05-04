/**
 * src/lod2Impact.js
 *
 * Analyses how many LoD2 building tilesets are within the flood zone and
 * computes an impact score for each.
 *
 * Phase 1 approach: bounding-sphere centre approximation.
 *   For each Cesium3DTileset loaded in the scene, convert the bounding sphere
 *   centre to geographic coords, look up the h-grid cell, and score by
 *     score = depth × estimatedFloors × footprintFactor
 *
 * Phase 2 (future): exact footprints via LGLN WFS + Cesium feature metadata.
 *
 * @returns {Array<ImpactEntry>} sorted by score descending
 *
 * ImpactEntry: { id, lon, lat, depth, floors, score, label }
 */

/**
 * Convert Cartesian3 to { lon, lat } in degrees.
 */
function cartesianToLonLat(cartesian) {
  const carto = Cesium.Cartographic.fromCartesian(cartesian);
  return {
    lon: Cesium.Math.toDegrees(carto.longitude),
    lat: Cesium.Math.toDegrees(carto.latitude),
    height: Number.isFinite(carto.height) ? carto.height : 0
  };
}

function offsetLonLat(lon, lat, eastM, northM) {
  const mPerDegLat = 111000;
  const mPerDegLon = 111000 * Math.cos(lat * Math.PI / 180);
  return {
    lon: lon + eastM / Math.max(1e-6, mPerDegLon),
    lat: lat + northM / mPerDegLat
  };
}

/**
 * Look up water depth [m] at a geographic coordinate using the h-grid.
 *
 * @param {number} lon          — degrees
 * @param {number} lat          — degrees
 * @param {Float32Array} h      — row-major depth array
 * @param {number} nx
 * @param {number} ny
 * @param {number} dx           — metres per cell
 * @param {number} originLon    — grid SW corner lon (degrees)
 * @param {number} originLat    — grid SW corner lat (degrees)
 * @returns {number} water depth in metres, or 0 if outside grid
 */
function sampleDepth(lon, lat, h, nx, ny, dx, originLon, originLat) {
  const mPerDegLat = 111000;
  const mPerDegLon = 111000 * Math.cos(((originLat + lat) / 2) * Math.PI / 180);

  const col = Math.round((lon - originLon) * mPerDegLon / dx);
  const row = Math.round((lat - originLat) * mPerDegLat / dx);

  if (col < 0 || col >= nx || row < 0 || row >= ny) return 0;
  return h[row * nx + col] || 0;
}

/**
 * Estimate floor count from the Cesium3DTileset bounding sphere radius.
 * Rough heuristic: a tileset covering a ~3m radius sphere = 1 floor average.
 */
function estimateFloors(radius) {
  // radius in metres; typical residential = 8–12m radius, 2–3 floors
  return Math.max(1, Math.round(radius / 4));
}

const tilesetCandidateCache = new WeakMap();

function getTilesetCandidates(scene) {
  if (!scene?.primitives) return [];
  const primitiveCount = scene.primitives.length;
  const cached = tilesetCandidateCache.get(scene);
  if (cached && cached.primitiveCount === primitiveCount) {
    return cached.items;
  }

  const items = [];
  for (let i = 0; i < primitiveCount; i++) {
    const prim = scene.primitives.get(i);
    if (!prim || prim.imageBasedLighting === undefined) continue;
    if (!prim.boundingSphere) continue;
    items.push({ index: i, prim });
  }

  tilesetCandidateCache.set(scene, {
    primitiveCount,
    items
  });
  return items;
}

/**
 * Compute building impact for all loaded LoD2 tilesets in the scene.
 *
 * @param {Cesium.Scene} scene
 * @param {Float32Array} h      — WASM h-grid (zero-copy view)
 * @param {number} nx
 * @param {number} ny
 * @param {number} dx
 * @param {number} originLon
 * @param {number} originLat
 * @returns {Array<ImpactEntry>}
 */
export function computeImpact(scene, h, nx, ny, dx, originLon, originLat) {
  const results = [];
  let idCounter = 0;

  const candidates = getTilesetCandidates(scene);
  for (const candidate of candidates) {
    const i = candidate.index;
    const prim = candidate.prim;

    const center = prim.boundingSphere?.center;
    if (!center) continue;

    const { lon, lat, height } = cartesianToLonLat(center);

    const radius = prim.boundingSphere.radius || 10;
    const footprintRadius = Math.max(4, Math.min(40, radius * 0.3));
    const offsets = [
      [0, 0],
      [footprintRadius * 0.4, 0],
      [-footprintRadius * 0.4, 0],
      [0, footprintRadius * 0.4],
      [0, -footprintRadius * 0.4],
      [footprintRadius * 0.8, 0],
      [-footprintRadius * 0.8, 0],
      [0, footprintRadius * 0.8],
      [0, -footprintRadius * 0.8],
      [footprintRadius * 0.55, footprintRadius * 0.55],
      [footprintRadius * 0.55, -footprintRadius * 0.55],
      [-footprintRadius * 0.55, footprintRadius * 0.55],
      [-footprintRadius * 0.55, -footprintRadius * 0.55]
    ];

    let wetSamples = 0;
    let maxDepth = 0;
    let depthSum = 0;
    for (const [eastM, northM] of offsets) {
      const p = offsetLonLat(lon, lat, eastM, northM);
      const d = sampleDepth(p.lon, p.lat, h, nx, ny, dx, originLon, originLat);
      if (d >= 0.003) {
        wetSamples += 1;
      }
      if (d > maxDepth) {
        maxDepth = d;
      }
      depthSum += d;
    }
    if (wetSamples === 0 || maxDepth < 0.003) continue;

    const meanDepth = depthSum / offsets.length;
    const wetFraction = wetSamples / offsets.length;
    const floors = estimateFloors(radius);

    // Footprint factor: larger tilesets = more buildings
    const footprintFactor = Math.min(5.0, radius / 20);
    const score = (0.65 * maxDepth + 0.35 * meanDepth) * floors * footprintFactor * (0.7 + wetFraction * 0.6);

    results.push({
      id:     `tileset-${i}-${idCounter++}`,
      lon:    lon.toFixed(5),
      lat:    lat.toFixed(5),
      depth:  Math.round(maxDepth * 100) / 100,
      meanDepth: Math.round(meanDepth * 100) / 100,
      wetFraction: Math.round(wetFraction * 100) / 100,
      floors,
      score:  Math.round(score * 10) / 10,
      footprintRadiusM: Math.round(footprintRadius),
      centerHeightM: Math.round(height),
      label:  `Gebäude ~(${lon.toFixed(3)}°, ${lat.toFixed(3)}°)`
    });
  }

  // Sort by descending score
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 20); // top 20
}

/** Count currently loaded Cesium3DTileset-like primitives in scene. */
export function countLoadedTilesets(scene) {
  return getTilesetCandidates(scene).length;
}

/**
 * Summarise impact results as a human-readable stats object.
 */
export function summariseImpact(results) {
  if (results.length === 0) return { count: 0, maxScore: 0, maxDepth: 0 };
  return {
    count:    results.length,
    maxScore: results[0].score,
    maxDepth: Math.max(...results.map(r => r.depth))
  };
}
