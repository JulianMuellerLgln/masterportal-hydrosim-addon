function removePrimitive(scene, primitive) {
  if (primitive && !primitive.isDestroyed()) {
    scene.primitives.remove(primitive);
  }
}

function densifySegment(scene, start, end, steps = 12) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lon = Cesium.Math.lerp(start.lon, end.lon, t);
    const lat = Cesium.Math.lerp(start.lat, end.lat, t);
    const probe = Cesium.Cartographic.fromDegrees(lon, lat);
    const h = scene.globe.getHeight(probe);
    pts.push(Cesium.Cartesian3.fromDegrees(lon, lat, Number.isFinite(h) ? h + 0.35 : 0.35));
  }
  return pts;
}

function buildDrapedRing(scene, coords) {
  if (!Array.isArray(coords) || coords.length < 2) return [];
  const ring = [];
  for (let i = 0; i < coords.length; i++) {
    const start = coords[i];
    const end = coords[(i + 1) % coords.length];
    const segment = densifySegment(scene, start, end);
    if (i > 0) segment.shift();
    ring.push(...segment);
  }
  return ring;
}

export function createAoiOverlay(scene, options = {}) {
  const strokeColor = Cesium.Color.fromCssColorString(options.strokeColor || '#58d0ff');
  const fillColor = Cesium.Color.fromCssColorString(options.fillColor || '#58d0ff').withAlpha(
    Number.isFinite(options.fillAlpha) ? options.fillAlpha : 0.16
  );

  let outline = null;
  let fill = null;

  function clear() {
    removePrimitive(scene, outline);
    removePrimitive(scene, fill);
    outline = null;
    fill = null;
  }

  return {
    setPolygon(coords) {
      clear();
      if (!Array.isArray(coords) || coords.length < 3) return;

      const ring = buildDrapedRing(scene, coords);
      const surface = coords.map(coord => {
        const probe = Cesium.Cartographic.fromDegrees(coord.lon, coord.lat);
        const h = scene.globe.getHeight(probe);
        return Cesium.Cartesian3.fromDegrees(coord.lon, coord.lat, Number.isFinite(h) ? h + 0.3 : 0.3);
      });

      outline = new Cesium.PolylineCollection();
      outline.add({
        positions: ring,
        width: 3,
        material: Cesium.Material.fromType('Color', { color: strokeColor })
      });
      scene.primitives.add(outline);

      fill = new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
          geometry: new Cesium.PolygonGeometry({
            polygonHierarchy: new Cesium.PolygonHierarchy(surface),
            perPositionHeight: true,
            vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
          }),
          attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(fillColor)
          }
        }),
        appearance: new Cesium.PerInstanceColorAppearance({
          translucent: true,
          closed: false
        }),
        asynchronous: false
      });
      scene.primitives.add(fill);
    },
    clear,
    destroy() {
      clear();
    }
  };
}