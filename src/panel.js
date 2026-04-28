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
  background: #1565c0;
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
  color: #90caf9;
  margin-bottom: 6px;
}

.hs-draw-btn {
  width: 100%;
  background: #0d47a1;
  color: #fff;
  border: 1px solid #1565c0;
  border-radius: 6px;
  padding: 7px 10px;
  cursor: pointer;
  font-size: 0.88rem;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.hs-draw-btn:hover:not(:disabled) { background: #1976d2; }
.hs-draw-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.hs-draw-btn.active { background: #2e7d32; border-color: #43a047; }

.hs-event-btns { display: flex; gap: 5px; }
.hs-event-btn {
  flex: 1;
  padding: 5px 4px;
  font-size: 0.75rem;
  border-radius: 5px;
  border: 1px solid #37474f;
  background: #263238;
  color: #cfd8dc;
  cursor: pointer;
  text-align: center;
  transition: background 0.18s;
}
.hs-event-btn.active { background: #1565c0; border-color: #1976d2; color: #fff; }
.hs-event-btn:hover:not(.active) { background: #37474f; }

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
  accent-color: #42a5f5;
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
.hs-btn-run   { background: #1b5e20; color: #c8e6c9; }
.hs-btn-pause { background: #e65100; color: #fff3e0; }
.hs-btn-reset { background: #37474f; color: #eceff1; }
.hs-btn-run:hover:not(:disabled)   { background: #2e7d32; }
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
  background: #42a5f5;
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
  color: #90caf9;
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
  background: #1565c0;
  border-radius: 2px;
  vertical-align: middle;
  margin-right: 4px;
}

#hs-phase3-section {
  margin-top: 4px;
  border-top: 1px solid #263238;
  padding-top: 10px;
  opacity: 0.5;
}
.hs-phase3-notice {
  font-size: 0.72rem;
  color: #90a4ae;
  font-style: italic;
  text-align: center;
  padding: 4px 0;
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

  <!-- Event type -->
  <div class="hs-section">
    <div class="hs-section-title">Ereignistyp</div>
    <div class="hs-event-btns">
      <button class="hs-event-btn active" data-event="rain">
        <i class="bi bi-cloud-rain"></i> Starkregen
      </button>
      <button class="hs-event-btn" data-event="flash">
        <i class="bi bi-lightning"></i> Sturzflut
      </button>
      <button class="hs-event-btn" data-event="river">
        <i class="bi bi-tsunami"></i> Fluss
      </button>
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

  <!-- Phase 3 stub -->
  <div id="hs-phase3-section">
    <div class="hs-section-title">
      <i class="bi bi-shield-check"></i> Schutzmaßnahmen
    </div>
    <div class="hs-phase3-notice">
      Verfügbar in Phase 3 — Pumpen, Deiche, Renaturierung
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
  const volVal      = $('hs-vol-val');
  const durVal      = $('hs-dur-val');
  const speedVal    = $('hs-speed-val');
  const impactSec   = $('hs-impact-section');
  const impactCount = $('hs-impact-count');
  const impactTbody = $('hs-impact-tbody');

  // Toggle panel visibility
  trigger.addEventListener('click', () => {
    panel.classList.toggle('visible');
  });
  $('hs-close').addEventListener('click', () => {
    panel.classList.remove('visible');
  });

  // Event type buttons
  for (const btn of document.querySelectorAll('.hs-event-btn')) {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.hs-event-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  }

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

  // --- Public API returned to main.js ---

  return {
    panel,
    trigger,

    /** Get current parameter values from the panel. */
    getParams() {
      const activeEvent = document.querySelector('.hs-event-btn.active');
      return {
        volumeM3:   Number(volSlider.value),
        durationMin: Number(durSlider.value),
        durationS:  Number(durSlider.value) * 60,
        speed:      Number(speedSlider.value),
        eventType:  activeEvent?.dataset.event || 'rain'
      };
    },

    /** Register action callbacks. */
    onDraw(fn)  { drawBtn.addEventListener('click', fn); },
    onRun(fn)   { runBtn.addEventListener('click', fn); },
    onPause(fn) { pauseBtn.addEventListener('click', fn); },
    onReset(fn) { resetBtn.addEventListener('click', fn); },

    /** Update the panel to reflect current simulation state. */
    setState(state) {
      // state: 'idle' | 'drawing' | 'sampling' | 'ready' | 'running' | 'paused' | 'results'
      drawBtn.disabled  = ['drawing', 'sampling', 'running'].includes(state);
      runBtn.disabled   = !['ready', 'paused'].includes(state);
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
