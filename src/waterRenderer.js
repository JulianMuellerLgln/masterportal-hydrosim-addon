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

const MIN_DEPTH = 0.01;   // cells shallower than this are invisible

/** Linearly interpolate between two numbers. */
function lerp(a, b, t) { return a + (b - a) * t; }

/**
 * Maps water depth to an RGBA array [r,g,b,a] each in [0,1].
 */
function depthColor(h) {
  if (h < MIN_DEPTH)  return [0, 0, 0, 0];
  if (h < 0.5) {
    const t = h / 0.5;
    return [lerp(0.53, 0.12, t), lerp(0.80, 0.31, t), lerp(1.00, 0.78, t), lerp(0.35, 0.60, t)];
  }
  if (h < 2.0) {
    const t = (h - 0.5) / 1.5;
    return [lerp(0.12, 0.00, t), lerp(0.31, 0.08, t), lerp(0.78, 0.39, t), lerp(0.60, 0.85, t)];
  }
  return [0.00, 0.05, 0.30, 0.92];
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
function buildWaterPrimitive(h, zb, nx, ny, dx, originLon, originLat) {
  // Metres-per-degree conversion at this latitude
  const midLat = originLat + ((ny / 2) * dx / 111000);
  const mPerDegLat = 111000;
  const mPerDegLon = 111000 * Math.cos(midLat * Math.PI / 180);
  const dLon = dx / mPerDegLon;
  const dLat = dx / mPerDegLat;

  // Collect per-quad positions + colors into flattened arrays
  const positions = [];
  const colors    = [];

  function pushDeg(lon, lat, height) {
    const c = Cesium.Cartesian3.fromDegrees(lon, lat, height);
    positions.push(c.x, c.y, c.z);
  }

  for (let row = 0; row < ny - 1; row++) {
    for (let col = 0; col < nx - 1; col++) {
      const idx = row * nx + col;
      const depth = h[idx];
      if (!Number.isFinite(depth)) continue;
      if (depth < MIN_DEPTH) continue;

      const lon0 = originLon + col * dLon;
      const lat0 = originLat + row * dLat;
      const lon1 = lon0 + dLon;
      const lat1 = lat0 + dLat;

      // Place surface above terrain mesh using WASM bed elevation + water depth.
      const elev = zb[idx] + depth + 0.05;
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

      const [r, g, b, a] = depthColor(depth);
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
    update(wasmBuffer, hOff, zbOff, nx, ny, dx, originLon, originLat) {
      // Zero-copy view into WASM heap — no data transfer overhead
      const h = new Float32Array(wasmBuffer, hOff, nx * ny);
      const zb = new Float32Array(wasmBuffer, zbOff, nx * ny);

      const next = buildWaterPrimitive(h, zb, nx, ny, dx, originLon, originLat);

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
    upsertStaticLayer(id, h, zb, nx, ny, dx, originLon, originLat) {
      const old = staticLayers.get(id);
      remove(old);
      const next = buildWaterPrimitive(h, zb, nx, ny, dx, originLon, originLat);
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
