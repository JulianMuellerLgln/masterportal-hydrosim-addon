/**
 * src/panel.js
 *
 * Vanilla HTML/CSS floating panel for the HydroSim flood simulation addon.
 *
 * Uses Bootstrap 5 classes and Bootstrap Icons already loaded by Masterportal.
 * No external dependencies at runtime.
 *
 * Exposes: createPanel() → { el, bind(stateRef) }
 *
 * The panel injects two DOM elements into document.body:
 *   1. #hydrosim-trigger  — small floating wave button (bottom-left)
 *   2. #hydrosim-panel    — main control panel (slides in from left)
 */

// ---------------------------------------------------------------------------
// CSS — injected once as a <style> tag
// ---------------------------------------------------------------------------
const PANEL_CSS = `
:root {
  --hs-accent: #d20f2a;
  --hs-accent-2: #b70d24;
  --hs-accent-soft: #f4c4cb;
}
#hydrosim-trigger {
  position: fixed;
  bottom: 100px;
  left: 16px;
  z-index: 800;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #1565c0;
  color: #fff;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  transition: background 0.2s;
}
#hydrosim-trigger:hover { background: #1976d2; }

#hydrosim-panel {
  position: fixed;
  bottom: 60px;
  left: 16px;
  z-index: 900;
  width: 320px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  background: rgba(18,18,28,0.94);
  color: #e8eaf6;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.6);
  display: none;
  flex-direction: column;
  padding: 0;
  backdrop-filter: blur(4px);
}
#hydrosim-panel.visible { display: flex; }

#hydrosim-header {
  background: var(--hs-accent);
  padding: 10px 14px;
  border-radius: 10px 10px 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  letter-spacing: 0.02em;
  font-size: 0.95rem;
}
#hydrosim-header button {
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0 4px;
  line-height: 1;
}

#hydrosim-body { padding: 12px 14px; }

.hs-section { margin-bottom: 12px; }
.hs-section-title {
  font-size: 0.70rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--hs-accent-soft);
  margin-bottom: 6px;
}

.hs-draw-btn {
  width: 100%;
  background: #4c1119;
  color: #fff;
  border: 1px solid var(--hs-accent);
  border-radius: 6px;
  padding: 7px 10px;
  cursor: pointer;
  font-size: 0.88rem;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.hs-draw-btn:hover:not(:disabled) { background: var(--hs-accent); }
.hs-draw-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.hs-draw-btn.active { background: #2e7d32; border-color: #43a047; }

.hs-mode-select {
  width: 100%;
  background: #263238;
  color: #fbe9ec;
  border: 1px solid #6d2b36;
  border-radius: 6px;
  padding: 7px 8px;
  font-size: 0.82rem;
}
.hs-mode-help {
  font-size: 0.70rem;
  color: #90a4ae;
  margin-top: 4px;
}
.hs-quality-note {
  font-size: 0.72rem;
  color: #ffcc80;
  margin-top: 6px;
  line-height: 1.3;
}

.hs-label {
  font-size: 0.78rem;
  color: #b0bec5;
  display: flex;
  justify-content: space-between;
  margin-bottom: 3px;
}
.hs-label span { color: #e3f2fd; font-weight: 500; }

input[type=range].hs-range {
  width: 100%;
  accent-color: var(--hs-accent);
  height: 4px;
  cursor: pointer;
}

.hs-controls { display: flex; gap: 6px; margin-top: 4px; }
.hs-btn {
  flex: 1;
  padding: 6px 8px;
  border-radius: 5px;
  border: none;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 500;
  transition: opacity 0.15s;
}
.hs-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.hs-btn-run   { background: var(--hs-accent); color: #fff; }
.hs-btn-pause { background: #e65100; color: #fff3e0; }
.hs-btn-reset { background: #37474f; color: #eceff1; }
.hs-btn-run:hover:not(:disabled)   { background: var(--hs-accent-2); }
.hs-btn-pause:hover:not(:disabled) { background: #bf360c; }
.hs-btn-reset:hover:not(:disabled) { background: #546e7a; }

#hs-status {
  font-size: 0.78rem;
  color: #80cbc4;
  min-height: 18px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0 2px;
}
#hs-progress {
  width: 100%;
  height: 4px;
  background: #263238;
  border-radius: 2px;
  overflow: hidden;
  display: none;
}
#hs-progress-bar {
  height: 100%;
  background: var(--hs-accent);
  width: 0%;
  transition: width 0.3s ease;
  border-radius: 2px;
}

#hs-impact-section { display: none; }
#hs-impact-section.visible { display: block; }
#hs-impact-table {
  width: 100%;
  font-size: 0.72rem;
  border-collapse: collapse;
  color: #cfd8dc;
}
#hs-impact-table th {
  color: var(--hs-accent-soft);
  text-align: left;
  font-weight: 500;
  padding: 3px 4px;
  border-bottom: 1px solid #37474f;
}
#hs-impact-table td {
  padding: 3px 4px;
  border-bottom: 1px solid #263238;
}
.hs-score-bar {
  display: inline-block;
  height: 8px;
  background: var(--hs-accent);
  border-radius: 2px;
  vertical-align: middle;
  margin-right: 4px;
}

#hs-measures-section {
  margin-top: 4px;
  border-top: 1px solid #263238;
  padding-top: 10px;
}
.hs-analysis-row {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}
.hs-analysis-select {
  width: 100%;
  background: #263238;
  color: #fbe9ec;
  border: 1px solid #6d2b36;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 0.78rem;
}
.hs-analysis-btn {
  width: 100%;
  background: #263238;
  color: #fff;
  border: 1px solid #6d2b36;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 0.78rem;
  cursor: pointer;
}
.hs-analysis-btn:hover:not(:disabled) {
  background: #3a1d24;
}
.hs-analysis-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.hs-measure-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 5px 0;
  font-size: 0.78rem;
  color: #cfd8dc;
}
.hs-measure-row input[type=checkbox] {
  accent-color: var(--hs-accent);
}
.hs-measure-help {
  font-size: 0.70rem;
  color: #90a4ae;
  margin-top: 4px;
}
`;

// ---------------------------------------------------------------------------
// HTML template
// ---------------------------------------------------------------------------
const PANEL_HTML = `
<div id="hydrosim-header">
  <span><i class="bi bi-water me-2"></i>Hochwassersimulation</span>
  <button id="hs-close" title="Schließen">×</button>
</div>
<div id="hydrosim-body">

  <!-- Draw section -->
  <div class="hs-section">
    <div class="hs-section-title">Überflutungsgebiet</div>
    <button id="hs-draw-btn" class="hs-draw-btn">
      <i class="bi bi-pencil-square"></i>
      <span id="hs-draw-label">Polygon zeichnen</span>
    </button>
    <div id="hs-draw-hint" style="font-size:0.70rem;color:#78909c;margin-top:4px;display:none">
      Klicken = Punkt setzen · Doppelklick = Fertig · Rechtsklick = Abbruch
    </div>
  </div>

  <!-- Mode -->
  <div class="hs-section">
    <div class="hs-section-title">Betriebsprofil</div>
    <select id="hs-profile" class="hs-mode-select">
      <option value="standard" selected>Standard</option>
      <option value="advanced">Advanced</option>
    </select>
    <div class="hs-mode-help" id="hs-profile-help">
      Standard für schnelle Szenarien. Advanced nutzt robuste Extrem-Defaults.
    </div>
  </div>

  <!-- Mode -->
  <div class="hs-section">
    <div class="hs-section-title">Modus</div>
    <select id="hs-mode" class="hs-mode-select">
      <option value="auto" selected>Automatik (empfohlen)</option>
      <option value="rain">Starkregen</option>
      <option value="flash">Sturzflut</option>
      <option value="river">Fluss</option>
    </select>
    <div class="hs-mode-help" id="hs-mode-help">
      Automatik wählt den Ereignistyp anhand von Volumen und Dauer.
    </div>
    <div class="hs-quality-note" id="hs-quality-note">
      Qualitätsstufe: Vorschau (2D)
    </div>
  </div>

  <!-- Water volume -->
  <div class="hs-section">
    <div class="hs-label">
      Wasservolumen
      <span><span id="hs-vol-val">50000</span> m³</span>
    </div>
    <input type="range" class="hs-range" id="hs-volume"
           min="1000" max="2000000" step="1000" value="50000">
  </div>

  <!-- Duration -->
  <div class="hs-section">
    <div class="hs-label">
      Ereignisdauer
      <span><span id="hs-dur-val">30</span> min</span>
    </div>
    <input type="range" class="hs-range" id="hs-duration"
           min="5" max="480" step="5" value="30">
  </div>

  <!-- Simulation speed -->
  <div class="hs-section">
    <div class="hs-label">
      Simulationsgeschwindigkeit
      <span><span id="hs-speed-val">8</span>×</span>
    </div>
    <input type="range" class="hs-range" id="hs-speed"
           min="1" max="60" step="1" value="8">
  </div>

  <!-- Controls -->
  <div class="hs-controls">
    <button class="hs-btn hs-btn-run"   id="hs-run"   disabled>
      <i class="bi bi-play-fill"></i> Starten
    </button>
    <button class="hs-btn hs-btn-pause" id="hs-pause" disabled>
      <i class="bi bi-pause-fill"></i> Pause
    </button>
    <button class="hs-btn hs-btn-reset" id="hs-reset">
      <i class="bi bi-arrow-counterclockwise"></i> Reset
    </button>
  </div>

  <!-- Progress & status -->
  <div id="hs-progress"><div id="hs-progress-bar"></div></div>
  <div id="hs-status"></div>

  <!-- Impact results -->
  <div id="hs-impact-section" class="hs-section">
    <div class="hs-section-title" style="margin-top:8px">
      <i class="bi bi-buildings"></i> Betroffene Gebäude
      <span id="hs-impact-count" style="color:#fff;margin-left:6px">—</span>
    </div>
    <table id="hs-impact-table">
      <thead>
        <tr>
          <th>Score</th>
          <th>Tiefe</th>
          <th>Position</th>
        </tr>
      </thead>
      <tbody id="hs-impact-tbody"></tbody>
    </table>
  </div>

  <!-- Measures -->
  <div id="hs-measures-section">
    <div class="hs-section-title">
      <i class="bi bi-shield-check"></i> Schutzmaßnahmen
    </div>
    <label class="hs-measure-row">
      <span><i class="bi bi-droplet-half"></i> Pumpen aktiv</span>
      <input id="hs-measure-pump" type="checkbox">
    </label>
    <label class="hs-measure-row">
      <span><i class="bi bi-bricks"></i> Mobile Deiche</span>
      <input id="hs-measure-dike" type="checkbox">
    </label>
    <label class="hs-measure-row">
      <span><i class="bi bi-tree"></i> Retentionsflächen</span>
      <input id="hs-measure-retention" type="checkbox">
    </label>
    <div class="hs-label" style="margin-top:6px">
      Maßnahmen-Intensität
      <span><span id="hs-measure-level-val">40</span>%</span>
    </div>
    <input type="range" class="hs-range" id="hs-measure-level"
           min="0" max="100" step="5" value="40">
    <div class="hs-measure-help">
      Wirkt auf Zuflussreduktion und Fließwiderstand in der Simulation.
    </div>
  </div>

  <div class="hs-section" style="margin-top:10px">
    <div class="hs-section-title">
      <i class="bi bi-layers"></i> Analyse-Layer
    </div>
    <div class="hs-label">
      Weitere Analyse
      <span><span id="hs-layer-count">0</span> Layer</span>
    </div>
    <select id="hs-layer-strategy" class="hs-analysis-select">
      <option value="append" selected>Zur aktiven Analyse hinzufügen</option>
      <option value="new">Neue Analyse-Layer erstellen</option>
    </select>
    <div class="hs-analysis-row">
      <select id="hs-layer-active" class="hs-analysis-select"></select>
      <button id="hs-layer-clear" class="hs-analysis-btn" title="Aktive Analyse entfernen">
        <i class="bi bi-trash"></i>
      </button>
      <button id="hs-layer-clear-all" class="hs-analysis-btn" title="Alle Analysen entfernen">
        <i class="bi bi-trash3"></i>
      </button>
    </div>
    <div class="hs-analysis-row">
      <button id="hs-export-geojson" class="hs-analysis-btn">
        <i class="bi bi-download"></i> Ergebnis als GeoJSON exportieren
      </button>
    </div>
  </div>

</div>
`;

// ---------------------------------------------------------------------------
// Panel factory
// ---------------------------------------------------------------------------

/**
 * Create and inject the panel.  Call once.
 * Returns { setStatus, setProgress, setImpact, setState } for the main module.
 */
export function createPanel() {
  // Inject CSS
  const style = document.createElement('style');
  style.textContent = PANEL_CSS;
  document.head.appendChild(style);

  // Trigger button
  const trigger = document.createElement('button');
  trigger.id = 'hydrosim-trigger';
  trigger.title = 'HydroSim — Hochwassersimulation';
  trigger.innerHTML = '<i class="bi bi-water"></i>';
  document.body.appendChild(trigger);

  // Panel container
  const panel = document.createElement('div');
  panel.id = 'hydrosim-panel';
  panel.innerHTML = PANEL_HTML;
  document.body.appendChild(panel);

  // Helper refs
  const $ = id => document.getElementById(id);
  const drawBtn     = $('hs-draw-btn');
  const drawLabel   = $('hs-draw-label');
  const drawHint    = $('hs-draw-hint');
  const runBtn      = $('hs-run');
  const pauseBtn    = $('hs-pause');
  const resetBtn    = $('hs-reset');
  const statusEl    = $('hs-status');
  const progressEl  = $('hs-progress');
  const progressBar = $('hs-progress-bar');
  const volSlider   = $('hs-volume');
  const durSlider   = $('hs-duration');
  const speedSlider = $('hs-speed');
  const profileSelect = $('hs-profile');
  const profileHelp = $('hs-profile-help');
  const modeSelect  = $('hs-mode');
  const modeHelp    = $('hs-mode-help');
  const qualityNote = $('hs-quality-note');
  const volVal      = $('hs-vol-val');
  const durVal      = $('hs-dur-val');
  const speedVal    = $('hs-speed-val');
  const measurePump = $('hs-measure-pump');
  const measureDike = $('hs-measure-dike');
  const measureRet  = $('hs-measure-retention');
  const measureLvl  = $('hs-measure-level');
  const measureLvlVal = $('hs-measure-level-val');
  const impactSec   = $('hs-impact-section');
  const impactCount = $('hs-impact-count');
  const impactTbody = $('hs-impact-tbody');
  const layerStrategy = $('hs-layer-strategy');
  const layerActive = $('hs-layer-active');
  const layerCount = $('hs-layer-count');
  const layerClear = $('hs-layer-clear');
  const layerClearAll = $('hs-layer-clear-all');
  const exportGeoJson = $('hs-export-geojson');
  let panelState    = 'idle';
  let gateEnabled   = true;

  // Toggle panel visibility
  trigger.addEventListener('click', () => {
    panel.classList.toggle('visible');
  });
  $('hs-close').addEventListener('click', () => {
    panel.classList.remove('visible');
  });

  profileSelect.addEventListener('change', () => {
    profileHelp.textContent = profileSelect.value === 'advanced'
      ? 'Advanced: stabilere Extremereignisse, strengere Solver-Grenzen, Analysefokus.'
      : 'Standard für schnelle Szenarien. Advanced nutzt robuste Extrem-Defaults.';
  });

  modeSelect.addEventListener('change', () => {
    modeHelp.textContent = modeSelect.value === 'auto'
      ? 'Automatik wählt den Ereignistyp anhand von Volumen und Dauer.'
      : `Manueller Modus: ${modeSelect.options[modeSelect.selectedIndex].text}`;
  });

  // Sliders
  volSlider.addEventListener('input', () => {
    volVal.textContent = Number(volSlider.value).toLocaleString('de-DE');
  });
  durSlider.addEventListener('input', () => {
    durVal.textContent = durSlider.value;
  });
  speedSlider.addEventListener('input', () => {
    speedVal.textContent = speedSlider.value;
  });
  measureLvl.addEventListener('input', () => {
    measureLvlVal.textContent = measureLvl.value;
  });

  // --- Public API returned to main.js ---

  return {
    panel,
    trigger,

    /** Get current parameter values from the panel. */
    getParams() {
      return {
        volumeM3:   Number(volSlider.value),
        durationMin: Number(durSlider.value),
        durationS:  Number(durSlider.value) * 60,
        speed:      Number(speedSlider.value),
        profile:    profileSelect.value || 'standard',
        mode:       modeSelect.value || 'auto',
        measures: {
          pump: !!measurePump.checked,
          dike: !!measureDike.checked,
          retention: !!measureRet.checked,
          level: Number(measureLvl.value) / 100
        }
      };
    },

    /** Register action callbacks. */
    onDraw(fn)  { drawBtn.addEventListener('click', fn); },
    onRun(fn)   { runBtn.addEventListener('click', fn); },
    onPause(fn) { pauseBtn.addEventListener('click', fn); },
    onReset(fn) { resetBtn.addEventListener('click', fn); },
    onExport(fn) { exportGeoJson.addEventListener('click', fn); },
    onLayerClear(fn) { layerClear.addEventListener('click', fn); },
    onLayerClearAll(fn) { layerClearAll.addEventListener('click', fn); },
    onLayerActiveChange(fn) { layerActive.addEventListener('change', fn); },

    getLayerStrategy() {
      return layerStrategy.value || 'append';
    },

    getActiveLayerId() {
      return layerActive.value || '';
    },

    setAnalysisLayers(layers, activeId) {
      layerActive.innerHTML = '';
      for (const layer of layers) {
        const opt = document.createElement('option');
        opt.value = layer.id;
        opt.textContent = layer.label;
        if (activeId && activeId === layer.id) opt.selected = true;
        layerActive.appendChild(opt);
      }
      if (layers.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'Keine Analyse vorhanden';
        layerActive.appendChild(opt);
      }
      layerCount.textContent = String(layers.length);
      layerClear.disabled = layers.length === 0;
      layerClearAll.disabled = layers.length === 0;
    },

    setQuality(quality, detail = '') {
      const qualityText = quality === 'analysis-3d'
        ? 'Qualitätsstufe: Analyse (3D)'
        : 'Qualitätsstufe: Vorschau (2D)';
      qualityNote.textContent = detail ? `${qualityText} · ${detail}` : qualityText;
      qualityNote.style.color = quality === 'analysis-3d' ? '#a5d6a7' : '#ffcc80';
    },

    /** Update the panel to reflect current simulation state. */
    setState(state) {
      // state: 'idle' | 'drawing' | 'sampling' | 'ready' | 'running' | 'paused' | 'results'
      panelState = state;
      drawBtn.disabled  = !gateEnabled || ['drawing', 'sampling', 'running'].includes(state);
      runBtn.disabled   = !gateEnabled || !['ready', 'paused'].includes(state);
      pauseBtn.disabled = state !== 'running';
      resetBtn.disabled = state === 'sampling';

      if (state === 'drawing') {
        drawLabel.textContent = 'Zeichnen…';
        drawBtn.classList.add('active');
        drawHint.style.display = 'block';
      } else {
        drawLabel.textContent = 'Polygon zeichnen';
        drawBtn.classList.remove('active');
        drawHint.style.display = 'none';
      }

      if (state === 'idle')    impactSec.classList.remove('visible');
      if (state === 'results') impactSec.classList.add('visible');

      const hasResult = ['ready', 'running', 'paused', 'results'].includes(state);
      exportGeoJson.disabled = !hasResult;
    },

    /** External gate control (e.g. camera-height dependent activation). */
    setGate(enabled) {
      gateEnabled = !!enabled;
      // Re-apply button enablement for current state.
      this.setState(panelState);
    },

    /** Set status text line. */
    setStatus(text, icon = 'bi-info-circle') {
      statusEl.innerHTML = text
        ? `<i class="bi ${icon}"></i> ${text}`
        : '';
    },

    /** Set progress bar (0–1).  Pass null to hide. */
    setProgress(pct) {
      if (pct === null) {
        progressEl.style.display = 'none';
        progressBar.style.width = '0%';
      } else {
        progressEl.style.display = 'block';
        progressBar.style.width = `${Math.round(pct * 100)}%`;
      }
    },

    /** Populate the impact results table. */
    setImpact(results) {
      if (!results || results.length === 0) {
        impactCount.textContent = '0';
        impactTbody.innerHTML = '<tr><td colspan="3" style="color:#607d8b;text-align:center">Keine Gebäude betroffen</td></tr>';
        return;
      }
      impactCount.textContent = results.length;
      const maxScore = results[0].score;
      impactTbody.innerHTML = results.slice(0, 10).map(r => {
        const barW = Math.round((r.score / maxScore) * 60);
        return `<tr>
          <td><span class="hs-score-bar" style="width:${barW}px"></span>${r.score}</td>
          <td>${r.depth} m</td>
          <td style="font-size:0.65rem">${r.lon}°<br>${r.lat}°</td>
        </tr>`;
      }).join('');
    }
  };
}
