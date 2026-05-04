/**
 * src/waterRenderer.js
 *
 * Real-time flood water visualisation using Cesium primitive geometry.
 *
 * Strategy: maintain a GeometryInstance-backed Primitive for the water surface.
 * Each frame, read the h[] grid from WASM memory (zero-copy Float32Array view),
 * tessellate all wet cells (h > THRESHOLD) into quads, colour by depth ramp,
 * and swap in a fresh Primitive.
 *
 * Depth colour ramp:
 *   0m → transparent
 *   0.1m → rgba(136,204,255, 0.45)   pale blue
 *   1m   → rgba( 30, 80,200, 0.72)   medium blue
 *   3m+  → rgba(  0, 20,100, 0.90)   deep cobalt
 */

const MIN_DEPTH = 0.003;   // keep very shallow sheets visible in client demos

/** Linearly interpolate between two numbers. */
function lerp(a, b, t) { return a + (b - a) * t; }

/**
 * Maps water depth to an RGBA array [r,g,b,a] each in [0,1].
 */
function depthColor(h, speed = 0) {
  if (h < MIN_DEPTH)  return [0, 0, 0, 0];
  const speedN = Math.max(0, Math.min(1, speed / 6));
  if (h < 0.5) {
    const t = h / 0.5;
    return [
      lerp(0.53, 0.12, t) + 0.04 * speedN,
      lerp(0.80, 0.31, t) + 0.02 * speedN,
      lerp(1.00, 0.78, t) + 0.14 * speedN,
      lerp(0.54, 0.76, t)
    ];
  }
  if (h < 2.0) {
    const t = (h - 0.5) / 1.5;
    return [
      lerp(0.12, 0.00, t) + 0.02 * speedN,
      lerp(0.31, 0.08, t) + 0.01 * speedN,
      lerp(0.78, 0.39, t) + 0.15 * speedN,
      lerp(0.74, 0.92, t)
    ];
  }
  return [0.01 + 0.02 * speedN, 0.08 + 0.01 * speedN, 0.38 + 0.16 * speedN, 0.93];
}

function blendRescueHeat(baseColor, rescueHeat = 0) {
  const heat = Math.max(0, Math.min(1, rescueHeat));
  if (heat <= 0) return baseColor;
  const hot = [1.0, 0.36, 0.06];
  const mix = Math.min(0.8, heat * 0.85);
  return [
    lerp(baseColor[0], hot[0], mix),
    lerp(baseColor[1], hot[1], mix),
    lerp(baseColor[2], hot[2], mix),
    Math.min(1.0, baseColor[3] + heat * 0.12)
  ];
}

/**
 * Build a Cesium.Primitive for all wet cells.
 *
 * @param {Float32Array} h        Row-major depth grid
 * @param {number}       nx       Grid width in cells
 * @param {number}       ny       Grid height in cells
 * @param {number}       dx       Cell size in metres
 * @param {number}       originLon  SW corner longitude in degrees
 * @param {number}       originLat  SW corner latitude in degrees
 * @returns {Cesium.Primitive|null}
 */
function buildWaterPrimitive(h, zb, u, v, nx, ny, dx, originLon, originLat, baseElevation = 0, simTimeS = 0, viewCulling = null, rescueHeat = null) {
  // Metres-per-degree conversion at this latitude
  const midLat = originLat + ((ny / 2) * dx / 111000);
  const mPerDegLat = 111000;
  const mPerDegLon = 111000 * Math.cos(midLat * Math.PI / 180);
  const dLon = dx / mPerDegLon;
  const dLat = dx / mPerDegLat;

  // Collect per-quad positions + colors into flattened arrays
  const positions = [];
  const colors    = [];

  const camCol = viewCulling ? viewCulling.col : null;
  const camRow = viewCulling ? viewCulling.row : null;
  const maxDistCellsSq = viewCulling ? viewCulling.maxDistCellsSq : null;

  function pushDeg(lon, lat, height) {
    const c = Cesium.Cartesian3.fromDegrees(lon, lat, height);
    positions.push(c.x, c.y, c.z);
  }

  for (let row = 0; row < ny - 1; row++) {
    for (let col = 0; col < nx - 1; col++) {
      if (maxDistCellsSq != null) {
        const dCol = col - camCol;
        const dRow = row - camRow;
        const distCellsSq = dCol * dCol + dRow * dRow;
        if (distCellsSq > maxDistCellsSq) continue;
      }

      const idx = row * nx + col;
      const depth = h[idx];
      if (!Number.isFinite(depth)) continue;
      if (depth < MIN_DEPTH) continue;
      const ux = Number.isFinite(u[idx]) ? u[idx] : 0;
      const vy = Number.isFinite(v[idx]) ? v[idx] : 0;
      const speed = Math.sqrt(ux * ux + vy * vy);

      const lon0 = originLon + col * dLon;
      const lat0 = originLat + row * dLat;
      const lon1 = lon0 + dLon;
      const lat1 = lat0 + dLat;

      // Place surface above terrain mesh using WASM bed elevation + water depth.
      const waveAmp = Math.min(0.08, 0.02 + depth * 0.08);
      const flowPhase = (ux * 0.06 + vy * 0.06) + (row + col) * 0.08;
      const wave = Math.sin(simTimeS * 2.2 + flowPhase) * waveAmp;
      const elev = baseElevation + zb[idx] + depth + 0.12 + wave;
      if (!Number.isFinite(elev)) continue;

      // Two triangles per quad (CCW winding, facing up)
      // Triangle 1: SW, SE, NE
      pushDeg(lon0, lat0, elev);
      pushDeg(lon1, lat0, elev);
      pushDeg(lon1, lat1, elev);
      // Triangle 2: SW, NE, NW
      pushDeg(lon0, lat0, elev);
      pushDeg(lon1, lat1, elev);
      pushDeg(lon0, lat1, elev);

      const baseColor = depthColor(depth, speed);
      const heat = rescueHeat && Number.isFinite(rescueHeat[idx]) ? rescueHeat[idx] : 0;
      const [r, g, b, a] = blendRescueHeat(baseColor, heat);
      const rc = Math.round(r * 255);
      const gc = Math.round(g * 255);
      const bc = Math.round(b * 255);
      const ac = Math.round(a * 255);
      // 6 vertices × 4 bytes each
      for (let v = 0; v < 6; v++) {
        colors.push(rc, gc, bc, ac);
      }
    }
  }

  if (positions.length === 0) return null;

  const posArr = new Float64Array(positions);
  const colArr = new Uint8Array(colors);

  const geometry = new Cesium.Geometry({
    attributes: {
      position: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.DOUBLE,
        componentsPerAttribute: 3,
        values: posArr
      }),
      color: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.UNSIGNED_BYTE,
        componentsPerAttribute: 4,
        normalize: true,
        values: colArr
      })
    },
    primitiveType: Cesium.PrimitiveType.TRIANGLES,
    boundingSphere: Cesium.BoundingSphere.fromVertices(posArr)
  });

  return new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({ geometry }),
    appearance: new Cesium.PerInstanceColorAppearance({
      flat: true,
      translucent: true
    }),
    releaseGeometryInstances: true,
    asynchronous: false   // build synchronously each frame
  });
}

/**
 * Create a water renderer bound to a Cesium scene.
 *
 * Returns { update(wasmMemory, hOff, nx, ny, dx, originLon, originLat),
 *           clear(), destroy() }
 */
export function createWaterRenderer(scene) {
  let current = null; // current Cesium.Primitive
  const staticLayers = new Map();

  function remove(p) {
    if (p && !p.isDestroyed()) {
      scene.primitives.remove(p);
    }
  }

  return {
    /**
     * Call each animation frame with fresh data from WASM.
     *
     * @param {ArrayBuffer} wasmBuffer — wasm.memory.buffer
     * @param {number}      hOff       — byte offset of h[] grid in WASM memory
     * @param {number}      nx
     * @param {number}      ny
     * @param {number}      dx         — metres per cell
     * @param {number}      originLon  — degrees
     * @param {number}      originLat  — degrees
     */
    update(wasmBuffer, hOff, zbOff, uOff, vOff, nx, ny, dx, originLon, originLat, baseElevation = 0, simTimeS = 0, rescueHeat = null) {
      // Zero-copy view into WASM heap — no data transfer overhead
      const h = new Float32Array(wasmBuffer, hOff, nx * ny);
      const zb = new Float32Array(wasmBuffer, zbOff, nx * ny);
      const u = new Float32Array(wasmBuffer, uOff, nx * ny);
      const v = new Float32Array(wasmBuffer, vOff, nx * ny);

      let viewCulling = null;
      try {
        const camera = scene?.camera;
        const cameraCart = camera?.positionWC;
        if (cameraCart) {
          const carto = Cesium.Cartographic.fromCartesian(cameraCart);
          const camLon = Cesium.Math.toDegrees(carto.longitude);
          const camLat = Cesium.Math.toDegrees(carto.latitude);
          const camHeight = Number.isFinite(carto.height) ? carto.height : 0;

          const mPerDegLat = 111000;
          const mPerDegLon = 111000 * Math.cos(((originLat + camLat) / 2) * Math.PI / 180);
          const camCol = (camLon - originLon) * mPerDegLon / dx;
          const camRow = (camLat - originLat) * mPerDegLat / dx;

          // Keep nearby detail while allowing wider radius when flying higher.
          const maxDistM = Math.max(1800, Math.min(12000, 2200 + camHeight * 0.35));
          const maxDistCells = maxDistM / dx;
          viewCulling = {
            col: camCol,
            row: camRow,
            maxDistCellsSq: maxDistCells * maxDistCells
          };
        }
      } catch (_e) {
        viewCulling = null;
      }

      const next = buildWaterPrimitive(h, zb, u, v, nx, ny, dx, originLon, originLat, baseElevation, simTimeS, viewCulling, rescueHeat);

      remove(current);
      if (next) {
        scene.primitives.add(next);
      }
      current = next;
    },

    /** Remove water layer without destroying the renderer. */
    clear() {
      remove(current);
      current = null;
    },

    /** Add or replace a persisted analysis layer primitive by ID. */
    upsertStaticLayer(id, h, zb, nx, ny, dx, originLon, originLat, baseElevation = 0, rescueHeat = null) {
      const old = staticLayers.get(id);
      remove(old);
      const still = new Float32Array(nx * ny);
      const next = buildWaterPrimitive(h, zb, still, still, nx, ny, dx, originLon, originLat, baseElevation, 0, null, rescueHeat);
      if (next) {
        scene.primitives.add(next);
        staticLayers.set(id, next);
      } else {
        staticLayers.delete(id);
      }
    },

    /** Remove one persisted analysis layer by ID. */
    removeStaticLayer(id) {
      const p = staticLayers.get(id);
      remove(p);
      staticLayers.delete(id);
    },

    /** Remove all persisted analysis layers. */
    clearStaticLayers() {
      for (const p of staticLayers.values()) {
        remove(p);
      }
      staticLayers.clear();
    },

    /** Fully tear down. */
    destroy() {
      remove(current);
      current = null;
      for (const p of staticLayers.values()) {
        remove(p);
      }
      staticLayers.clear();
    }
  };
}
