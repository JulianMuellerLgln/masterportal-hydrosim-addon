/**
 * src/terrainSampler.js
 *
 * Samples the DGM5 terrain mesh over a bounding-box grid covering the
 * user-drawn polygon, using Cesium.sampleTerrainMostDetailed().
 *
 * Returns { heights: Float32Array, nx, ny, dx, originLon, originLat }
 * where heights is in metres, row-major (y rows, x cols), and
 * values are relative (min height subtracted) so the WASM grid starts
 * with a sensible baseline.
 */

/**
 * Build a regular lon/lat grid of Cartographic objects covering the polygon
 * bounding box, at approximately `resolutionM` metres per cell.
 *
 * One degree of latitude ≈ 111 km.  One degree of longitude at 51°N ≈ 70 km.
 */
function buildGrid(coords, resolutionM) {
  let minLon = Infinity, maxLon = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;

  for (const c of coords) {
    if (c.lon < minLon) minLon = c.lon;
    if (c.lon > maxLon) maxLon = c.lon;
    if (c.lat < minLat) minLat = c.lat;
    if (c.lat > maxLat) maxLat = c.lat;
  }

  // Add 20% margin around polygon
  const marginLon = (maxLon - minLon) * 0.2;
  const marginLat = (maxLat - minLat) * 0.2;
  minLon -= marginLon;  maxLon += marginLon;
  minLat -= marginLat;  maxLat += marginLat;

  // Convert resolution in metres to degrees
  const degPerMeterLat = 1.0 / 111000.0;
  const degPerMeterLon = 1.0 / (111000.0 * Math.cos(((minLat + maxLat) / 2) * Math.PI / 180));

  const dLat = resolutionM * degPerMeterLat;
  const dLon = resolutionM * degPerMeterLon;

  const ny = Math.max(4, Math.round((maxLat - minLat) / dLat) + 1);
  const nx = Math.max(4, Math.round((maxLon - minLon) / dLon) + 1);

  // Cap at 120×120 = 14400 cells to keep terrain queries fast
  const scale = Math.sqrt((120 * 120) / (nx * ny));
  const nxCap = Math.min(120, Math.max(4, Math.round(nx * scale)));
  const nyCap = Math.min(120, Math.max(4, Math.round(ny * scale)));

  const actualDLon = (maxLon - minLon) / (nxCap - 1);
  const actualDLat = (maxLat - minLat) / (nyCap - 1);

  const grid = [];
  for (let row = 0; row < nyCap; row++) {
    for (let col = 0; col < nxCap; col++) {
      const lon = minLon + col * actualDLon;
      const lat = minLat + row * actualDLat;
      grid.push(new Cesium.Cartographic(
        Cesium.Math.toRadians(lon),
        Cesium.Math.toRadians(lat)
      ));
    }
  }

  // Actual cell size in metres (use latitude direction)
  const dxMetres = actualDLat * 111000;

  return { grid, nx: nxCap, ny: nyCap, dx: dxMetres, minLon, minLat };
}

/**
 * Sample terrain over the polygon bounding box.
 *
 * @param {Cesium.Scene} scene
 * @param {Array<{lon,lat}>} coords  WGS84 polygon vertices in degrees
 * @param {number} resolutionM       Desired grid cell size in metres (default 50)
 * @param {Function} onProgress      Optional progress callback (0..1)
 * @returns {Promise<{heights:Float32Array,nx,ny,dx,originLon,originLat}>}
 */
export async function sampleTerrainGrid(scene, coords, resolutionM = 50, onProgress) {
  const { grid, nx, ny, dx, minLon, minLat } = buildGrid(coords, resolutionM);

  if (onProgress) onProgress(0.05);

  // sampleTerrainMostDetailed uses the currently active terrain provider
  const sampled = await Cesium.sampleTerrainMostDetailed(
    scene.terrainProvider,
    grid
  );

  if (onProgress) onProgress(0.9);

  // Extract heights; fill NaN / undefined with 0
  const rawHeights = sampled.map(c => (Number.isFinite(c.height) ? c.height : 0));

  // Make relative: subtract minimum so the grid starts near 0
  const minH = Math.min(...rawHeights);
  const relativeHeights = rawHeights.map(h => h - minH);

  const heights = new Float32Array(relativeHeights);

  if (onProgress) onProgress(1.0);

  console.log(`[HydroSim] Terrain sampled: ${nx}×${ny} grid, dx=${dx.toFixed(1)}m, min=${minH.toFixed(1)}m`);

  return { heights, nx, ny, dx, originLon: minLon, originLat: minLat };
}
