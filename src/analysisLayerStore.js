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
      label: `${l.name} (${l.meta.nx}x${l.meta.ny})`
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
      layer.meta.originLat
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

    upsertFromSnapshot(snapshot, strategy) {
      if (!snapshot) return { merged: false, created: false };
      let targetId = activeAnalysisLayerId;
      const hasActive = targetId && analysisLayers.has(targetId);
      const canAppend = strategy === 'append' && hasActive
        && terrainCompatible(analysisLayers.get(targetId).meta, snapshot.meta);

      if (strategy === 'new' || !canAppend) {
        targetId = createLayerId();
        const layer = {
          id: targetId,
          name: createAnalysisLayerName(analysisLayers.size + 1),
          meta: snapshot.meta,
          depth: new Float32Array(snapshot.depth),
          bed: new Float32Array(snapshot.bed)
        };
        analysisLayers.set(targetId, layer);
        activeAnalysisLayerId = targetId;
        updateRenderer(layer);
        refreshUi();
        return { merged: false, created: true };
      }

      const layer = analysisLayers.get(targetId);
      mergeDepthBuffers(layer.depth, snapshot.depth);
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
