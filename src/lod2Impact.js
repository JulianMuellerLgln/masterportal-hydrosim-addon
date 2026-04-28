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
    lat: Cesium.Math.toDegrees(carto.latitude)
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

  for (let i = 0; i < scene.primitives.length; i++) {
    const prim = scene.primitives.get(i);
    // Cesium3DTileset check: has imageBasedLighting, not a Primitive we added
    if (!prim || prim.imageBasedLighting === undefined) continue;
    // Skip our own water primitive (it has no boundingSphere at primitive level)
    if (!prim.boundingSphere) continue;

    const center = prim.boundingSphere?.center;
    if (!center) continue;

    const { lon, lat } = cartesianToLonLat(center);
    const depth = sampleDepth(lon, lat, h, nx, ny, dx, originLon, originLat);

    if (depth < 0.05) continue; // not in flood zone

    const radius = prim.boundingSphere.radius || 10;
    const floors = estimateFloors(radius);

    // Footprint factor: larger tilesets = more buildings
    const footprintFactor = Math.min(5.0, radius / 20);
    const score = depth * floors * footprintFactor;

    results.push({
      id:     `tileset-${i}-${idCounter++}`,
      lon:    lon.toFixed(5),
      lat:    lat.toFixed(5),
      depth:  Math.round(depth * 100) / 100,
      floors,
      score:  Math.round(score * 10) / 10,
      label:  `Gebäude ~(${lon.toFixed(3)}°, ${lat.toFixed(3)}°)`
    });
  }

  // Sort by descending score
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 20); // top 20
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
