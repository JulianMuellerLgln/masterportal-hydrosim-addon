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
  let drawLinePrimitive = null;
  let drawFillPrimitive = null;

  function removePrimitive(p) {
    if (p && !p.isDestroyed()) {
      viewer.scene.primitives.remove(p);
    }
  }

  function toDrapedPoint(cartesian) {
    const carto = Cesium.Cartographic.fromCartesian(cartesian);
    const h = viewer.scene.globe.getHeight(carto);
    const z = Number.isFinite(h) ? h + 0.2 : carto.height;
    return Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, z);
  }

  function densifyDrapedLine(segmentStart, segmentEnd, stepCount = 10) {
    const a = Cesium.Cartographic.fromCartesian(segmentStart);
    const b = Cesium.Cartographic.fromCartesian(segmentEnd);
    const pts = [];
    for (let i = 0; i <= stepCount; i++) {
      const t = i / stepCount;
      const lon = Cesium.Math.lerp(a.longitude, b.longitude, t);
      const lat = Cesium.Math.lerp(a.latitude, b.latitude, t);
      const probe = new Cesium.Cartographic(lon, lat);
      const h = viewer.scene.globe.getHeight(probe);
      const z = Number.isFinite(h) ? h + 0.25 : Cesium.Math.lerp(a.height, b.height, t);
      pts.push(Cesium.Cartesian3.fromRadians(lon, lat, z));
    }
    return pts;
  }

  function buildDrapedRing(positions) {
    if (positions.length < 2) return [];
    const ring = [];
    for (let i = 0; i < positions.length - 1; i++) {
      const dense = densifyDrapedLine(positions[i], positions[i + 1]);
      if (i > 0) dense.shift();
      ring.push(...dense);
    }
    return ring;
  }

  return {
    points,
    polys,
    updatePreview(positions) {
      // Remove old simple polyline and add fresh one
      polys.removeAll();
      removePrimitive(drawLinePrimitive);
      removePrimitive(drawFillPrimitive);
      drawLinePrimitive = null;
      drawFillPrimitive = null;

      if (positions.length >= 2) {
        const closed = [...positions, positions[0]];
        const ring = buildDrapedRing(closed);
        polyline = polys.add({
          positions: ring.length > 0 ? ring : closed,
          width: 2.5,
          material: Cesium.Material.fromType('Color', {
            color: Cesium.Color.fromCssColorString('#4af')
          }),
          loop: false
        });
      }

      if (positions.length >= 3) {
        const draped = positions.map(toDrapedPoint);
        const geometry = new Cesium.PolygonGeometry({
          polygonHierarchy: new Cesium.PolygonHierarchy(draped),
          perPositionHeight: true,
          vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
        });

        drawFillPrimitive = new Cesium.Primitive({
          geometryInstances: new Cesium.GeometryInstance({
            geometry,
            attributes: {
              color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                Cesium.Color.fromCssColorString('#4af').withAlpha(0.22)
              )
            }
          }),
          appearance: new Cesium.PerInstanceColorAppearance({
            translucent: true,
            closed: false
          }),
          asynchronous: false
        });
        viewer.scene.primitives.add(drawFillPrimitive);
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
      removePrimitive(drawLinePrimitive);
      removePrimitive(drawFillPrimitive);
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

function pickCartesian(scene, screenPos) {
  let pos = scene.pickPosition(screenPos);
  if (!pos || !Cesium.defined(pos)) {
    const ray = scene.camera.getPickRay(screenPos);
    pos = scene.globe.pick(ray, scene);
  }
  return pos;
}

function toCoord(position) {
  const carto = Cesium.Cartographic.fromCartesian(position);
  return {
    lon: Cesium.Math.toDegrees(carto.longitude),
    lat: Cesium.Math.toDegrees(carto.latitude)
  };
}

export function startPointDraw(scene, onComplete) {
  const canvas = scene.canvas;
  const handler = new Cesium.ScreenSpaceEventHandler(canvas);
  canvas.style.cursor = 'crosshair';

  function cleanup() {
    canvas.style.cursor = '';
    handler.destroy();
  }

  handler.setInputAction((click) => {
    const pos = pickCartesian(scene, click.position);
    if (!pos) return;
    const coord = toCoord(pos);
    cleanup();
    onComplete(coord);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  handler.setInputAction(() => {
    cleanup();
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

  return handler;
}

export function startPolylineDraw(scene, onComplete) {
  const positions = [];
  const canvas = scene.canvas;
  const preview = createPreviewEntities({ scene });
  const handler = new Cesium.ScreenSpaceEventHandler(canvas);
  canvas.style.cursor = 'crosshair';

  function cleanup() {
    try { preview.destroy(); } catch (_) {}
    canvas.style.cursor = '';
    handler.destroy();
  }

  function updateLinePreview() {
    preview.points.removeAll();
    preview.polys.removeAll();
    for (const pos of positions) {
      preview.addPoint(pos);
    }
    if (positions.length >= 2) {
      preview.polys.add({
        positions,
        width: 3,
        material: Cesium.Material.fromType('Color', {
          color: Cesium.Color.fromCssColorString('#ffb300')
        }),
        loop: false
      });
    }
  }

  handler.setInputAction((click) => {
    const pos = pickCartesian(scene, click.position);
    if (!pos) return;
    positions.push(pos);
    updateLinePreview();
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  handler.setInputAction((click) => {
    const pos = pickCartesian(scene, click.position);
    if (pos && positions.length > 0) {
      const d = Cesium.Cartesian3.distance(pos, positions[positions.length - 1]);
      if (d > 0.5) {
        positions.push(pos);
      }
    }
    if (positions.length >= 2) {
      const coords = positions.map(toCoord);
      cleanup();
      onComplete(coords);
      return;
    }
    cleanup();
  }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

  handler.setInputAction(() => {
    if (positions.length >= 2) {
      const coords = positions.map(toCoord);
      cleanup();
      onComplete(coords);
      return;
    }
    cleanup();
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

  return handler;
}
