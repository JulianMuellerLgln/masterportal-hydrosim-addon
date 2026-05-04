import { createAnalysisLayerName, mergeDepthBuffers, terrainCompatible } from './simCore.js';

export function createAnalysisLayerStore(renderer, onChange = () => {}) {
  const analysisLayers = new Map();
  let activeAnalysisLayerId = null;
  let analysisCounter = 1;

  function createLayerId() {
    return `analysis-${Date.now()}-${analysisCounter++}`;
  }

  function asUiLayers() {
    return Array.from(analysisLayers.values()).map(l => ({
      id: l.id,
      label: `${l.name} · ${l.kind === 'rescue' ? 'Rettungs-Heatmap' : 'Wasser'} (${l.meta.nx}x${l.meta.ny})`
    }));
  }

  function refreshUi() {
    onChange(asUiLayers(), activeAnalysisLayerId);
  }

  function updateRenderer(layer) {
    renderer?.upsertStaticLayer(
      layer.id,
      layer.depth,
      layer.bed,
      layer.meta.nx,
      layer.meta.ny,
      layer.meta.dx,
      layer.meta.originLon,
      layer.meta.originLat,
      layer.meta.baseElevation || 0,
      layer.rescueHeat || null
    );
  }

  return {
    setActive(id) {
      activeAnalysisLayerId = id && analysisLayers.has(id) ? id : null;
      refreshUi();
    },

    getActiveId() {
      return activeAnalysisLayerId;
    },

    getActiveLayer() {
      return activeAnalysisLayerId ? analysisLayers.get(activeAnalysisLayerId) : null;
    },

    getAll() {
      return analysisLayers;
    },

    upsertFromSnapshot(snapshot, strategy, options = {}) {
      if (!snapshot) return { merged: false, created: false };
      const kind = options.kind === 'rescue' ? 'rescue' : 'water';
      const activate = options.activate !== false;
      let targetId = activeAnalysisLayerId;
      const hasActive = targetId && analysisLayers.has(targetId);
      const canAppend = strategy === 'append' && hasActive
        && analysisLayers.get(targetId).kind === kind
        && terrainCompatible(analysisLayers.get(targetId).meta, snapshot.meta);

      if (strategy === 'new' || !canAppend) {
        targetId = createLayerId();
        const layerName = createAnalysisLayerName(analysisLayers.size + 1);
        const layer = {
          id: targetId,
          name: layerName,
          kind,
          meta: snapshot.meta,
          depth: new Float32Array(snapshot.depth),
          bed: new Float32Array(snapshot.bed),
          rescueHeat: snapshot.rescueHeat ? new Float32Array(snapshot.rescueHeat) : null
        };
        analysisLayers.set(targetId, layer);
        if (activate) {
          activeAnalysisLayerId = targetId;
        }
        updateRenderer(layer);
        refreshUi();
        return { merged: false, created: true };
      }

      const layer = analysisLayers.get(targetId);
      mergeDepthBuffers(layer.depth, snapshot.depth);
      if (snapshot.rescueHeat) {
        if (!layer.rescueHeat || layer.rescueHeat.length !== snapshot.rescueHeat.length) {
          layer.rescueHeat = new Float32Array(snapshot.rescueHeat);
        } else {
          mergeDepthBuffers(layer.rescueHeat, snapshot.rescueHeat);
        }
      }
      updateRenderer(layer);
      refreshUi();
      return { merged: true, created: false };
    },

    clearActive() {
      if (!activeAnalysisLayerId) return;
      renderer?.removeStaticLayer(activeAnalysisLayerId);
      analysisLayers.delete(activeAnalysisLayerId);
      activeAnalysisLayerId = analysisLayers.keys().next().value || null;
      refreshUi();
    },

    clearAll() {
      renderer?.clearStaticLayers();
      analysisLayers.clear();
      activeAnalysisLayerId = null;
      refreshUi();
    }
  };
}
