/**
 * src/impactBoxRenderer.js
 *
 * Renders translucent 3D boxes at impacted building positions.
 * Input entries are taken from lod2Impact.js results.
 */

export function createImpactBoxRenderer(scene) {
  let currentFill = null;
  let currentOutline = null;

  function remove(p) {
    if (p && !p.isDestroyed()) {
      scene.primitives.remove(p);
    }
  }

  function buildBoxes(impacts) {
    if (!Array.isArray(impacts) || impacts.length === 0) return null;

    const camPos = scene?.camera?.positionWC || null;
    const maxDistM = 7000;
    const maxDistSq = maxDistM * maxDistM;

    const fillInstances = [];
    const outlineInstances = [];
    for (const it of impacts) {
      const lon = Number(it.lon);
      const lat = Number(it.lat);
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;

      const r = Math.max(5, Math.min(18, Number(it.footprintRadiusM) || 10));
      const floors = Math.max(1, Number(it.floors) || 1);
      const boxHeight = Math.max(5, Math.min(24, floors * 3.0));
      const centerHeightRaw = Number.isFinite(it.centerHeightM) ? Number(it.centerHeightM) : 0;
      const centerHeight = centerHeightRaw + boxHeight * 0.2;

      const center = Cesium.Cartesian3.fromDegrees(lon, lat, centerHeight);
      if (camPos) {
        const dSq = Cesium.Cartesian3.distanceSquared(center, camPos);
        if (dSq > maxDistSq) continue;
      }

      const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);
      const fillGeometry = Cesium.BoxGeometry.fromDimensions({
        dimensions: new Cesium.Cartesian3(r * 1.8, r * 1.8, boxHeight)
      });
      const outlineGeometry = Cesium.BoxOutlineGeometry.fromDimensions({
        dimensions: new Cesium.Cartesian3(r * 1.85, r * 1.85, boxHeight * 1.03)
      });

      const depth = Math.max(0, Number(it.depth) || 0);
      const alpha = Math.min(0.5, 0.2 + depth * 0.2);
      const fillColor = Cesium.Color.fromBytes(255, 96, 80, Math.round(alpha * 255));
      const outlineColor = Cesium.Color.fromBytes(255, 215, 0, 255);

      fillInstances.push(new Cesium.GeometryInstance({
        geometry: fillGeometry,
        modelMatrix,
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(fillColor)
        }
      }));

      outlineInstances.push(new Cesium.GeometryInstance({
        geometry: outlineGeometry,
        modelMatrix,
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(outlineColor)
        }
      }));
    }

    if (fillInstances.length === 0) return null;

    return {
      fill: new Cesium.Primitive({
        geometryInstances: fillInstances,
        appearance: new Cesium.PerInstanceColorAppearance({
          translucent: true,
          closed: true,
          flat: false
        }),
        asynchronous: false
      }),
      outline: new Cesium.Primitive({
        geometryInstances: outlineInstances,
        appearance: new Cesium.PerInstanceColorAppearance({
          translucent: false,
          closed: false,
          flat: true
        }),
        asynchronous: false
      })
    };
  }

  return {
    update(impacts) {
      remove(currentFill);
      remove(currentOutline);
      currentFill = null;
      currentOutline = null;

      const next = buildBoxes(impacts);
      if (next) {
        currentFill = next.fill;
        currentOutline = next.outline;
        scene.primitives.add(currentFill);
        scene.primitives.add(currentOutline);
      }
    },

    clear() {
      remove(currentFill);
      remove(currentOutline);
      currentFill = null;
      currentOutline = null;
    },

    destroy() {
      remove(currentFill);
      remove(currentOutline);
      currentFill = null;
      currentOutline = null;
    }
  };
}
