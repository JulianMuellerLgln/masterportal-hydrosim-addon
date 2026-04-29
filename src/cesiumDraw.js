/**
 * src/cesiumDraw.js
 *
 * Polygon draw tool using Cesium's ScreenSpaceEventHandler.
 *
 * Usage:
 *   const handler = startPolygonDraw(scene, (cartographics) => { ... });
 *   // later, to abort:
 *   handler.destroy();
 */

/**
 * Creates a live-preview polyline entity showing the in-progress polygon.
 * Returns a reference so we can destroy it when drawing ends.
 */
function createPreviewEntities(viewer) {
  // We use a DataSource-free approach: PointPrimitiveCollection + Polyline
  const points  = new Cesium.PointPrimitiveCollection();
  const polys   = new Cesium.PolylineCollection();
  viewer.scene.primitives.add(points);
  viewer.scene.primitives.add(polys);

  let polyline = null;

  return {
    points,
    polys,
    updatePreview(positions) {
      // Remove old polyline and add fresh one
      polys.removeAll();
      if (positions.length >= 2) {
        const closed = [...positions, positions[0]];
        polyline = polys.add({
          positions: closed,
          width: 2.5,
          material: Cesium.Material.fromType('Color', {
            color: Cesium.Color.fromCssColorString('#4af')
          }),
          loop: false
        });
      }
    },
    addPoint(position) {
      points.add({
        position,
        color: Cesium.Color.fromCssColorString('#4af'),
        pixelSize: 8,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 1
      });
    },
    destroy() {
      viewer.scene.primitives.remove(points);
      viewer.scene.primitives.remove(polys);
    }
  };
}

/**
 * Start an interactive polygon draw session on the Cesium scene.
 *
 * - LEFT_CLICK: add a vertex (snapped to terrain if available)
 * - RIGHT_CLICK / ESCAPE: cancel the current draw
 * - DOUBLE_CLICK: close polygon, fire onComplete(Cartographic[])
 *
 * @param {Cesium.Scene} scene   — Active Cesium scene
 * @param {Function}    onComplete — Called with Array<{lon, lat}> in degrees
 * @returns {Cesium.ScreenSpaceEventHandler} — destroy() it to cancel
 */
export function startPolygonDraw(scene, onComplete) {
  const positions = []; // Array<Cesium.Cartesian3>
  const canvas    = scene.canvas;

  // Grab the Cesium viewer from the scene (works with Masterportal's setup)
  const preview = createPreviewEntities({ scene });

  const handler = new Cesium.ScreenSpaceEventHandler(canvas);

  function pickPosition(click) {
    // Try terrain-aware pick first; fall back to globe ellipsoid
    let pos = scene.pickPosition(click.position);
    if (!pos || !Cesium.defined(pos)) {
      const ray = scene.camera.getPickRay(click.position);
      pos = scene.globe.pick(ray, scene);
    }
    return pos;
  }

  function toCoords(ps) {
    return ps.map(p => {
      const carto = Cesium.Cartographic.fromCartesian(p);
      return {
        lon: Cesium.Math.toDegrees(carto.longitude),
        lat: Cesium.Math.toDegrees(carto.latitude)
      };
    });
  }

  function tryComplete() {
    if (positions.length < 3) {
      console.warn('[HydroSim] Need at least 3 vertices to form a polygon.');
      return false;
    }
    const coords = toCoords(positions);
    handler.destroy();
    preview.destroy();
    canvas.style.cursor = '';
    onComplete(coords);
    return true;
  }

  // Cursor style: crosshair during draw
  canvas.style.cursor = 'crosshair';

  handler.setInputAction((click) => {
    const pos = pickPosition(click);
    if (!pos) return;
    positions.push(pos);
    preview.addPoint(pos);
    preview.updatePreview(positions);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  handler.setInputAction((click) => {
    // If the double-click happened on a new location, add it once.
    const pos = pickPosition(click);
    if (pos && positions.length > 0) {
      const d = Cesium.Cartesian3.distance(pos, positions[positions.length - 1]);
      if (d > 0.5) {
        positions.push(pos);
        preview.addPoint(pos);
        preview.updatePreview(positions);
      }
    }
    tryComplete();
  }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

  // Escape or right-click cancels
  function cancelDraw() {
    handler.destroy();
    preview.destroy();
    canvas.style.cursor = '';
  }

  handler.setInputAction(() => {
    if (!tryComplete()) cancelDraw();
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

  document.addEventListener('keydown', function onKey(e) {
    if (e.key === 'Escape') {
      cancelDraw();
      document.removeEventListener('keydown', onKey);
    }
  });

  // Override destroy so callers can cancel cleanly
  const origDestroy = handler.destroy.bind(handler);
  handler.destroy = () => {
    origDestroy();
    try { preview.destroy(); } catch(_) {}
    canvas.style.cursor = '';
  };

  return handler;
}
