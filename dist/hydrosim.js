(function(){"use strict";function Ce(s){const c=new Cesium.PointPrimitiveCollection,i=new Cesium.PolylineCollection;s.scene.primitives.add(c),s.scene.primitives.add(i);let t=null,r=null;function f(l){l&&!l.isDestroyed()&&s.scene.primitives.remove(l)}function w(l){const n=Cesium.Cartographic.fromCartesian(l),a=s.scene.globe.getHeight(n),d=Number.isFinite(a)?a+.2:n.height;return Cesium.Cartesian3.fromRadians(n.longitude,n.latitude,d)}function x(l,n,a=10){const d=Cesium.Cartographic.fromCartesian(l),p=Cesium.Cartographic.fromCartesian(n),b=[];for(let g=0;g<=a;g++){const S=g/a,P=Cesium.Math.lerp(d.longitude,p.longitude,S),A=Cesium.Math.lerp(d.latitude,p.latitude,S),k=new Cesium.Cartographic(P,A),I=s.scene.globe.getHeight(k),M=Number.isFinite(I)?I+.25:Cesium.Math.lerp(d.height,p.height,S);b.push(Cesium.Cartesian3.fromRadians(P,A,M))}return b}function L(l){if(l.length<2)return[];const n=[];for(let a=0;a<l.length-1;a++){const d=x(l[a],l[a+1]);a>0&&d.shift(),n.push(...d)}return n}return{points:c,polys:i,updatePreview(l){if(i.removeAll(),f(t),f(r),t=null,r=null,l.length>=2){const n=[...l,l[0]],a=L(n);i.add({positions:a.length>0?a:n,width:2.5,material:Cesium.Material.fromType("Color",{color:Cesium.Color.fromCssColorString("#4af")}),loop:!1})}if(l.length>=3){const n=l.map(w),a=new Cesium.PolygonGeometry({polygonHierarchy:new Cesium.PolygonHierarchy(n),perPositionHeight:!0,vertexFormat:Cesium.PerInstanceColorAppearance.VERTEX_FORMAT});r=new Cesium.Primitive({geometryInstances:new Cesium.GeometryInstance({geometry:a,attributes:{color:Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.fromCssColorString("#4af").withAlpha(.22))}}),appearance:new Cesium.PerInstanceColorAppearance({translucent:!0,closed:!1}),asynchronous:!1}),s.scene.primitives.add(r)}},addPoint(l){c.add({position:l,color:Cesium.Color.fromCssColorString("#4af"),pixelSize:8,outlineColor:Cesium.Color.WHITE,outlineWidth:1})},destroy(){f(t),f(r),s.scene.primitives.remove(c),s.scene.primitives.remove(i)}}}function we(s,c){const i=[],t=s.canvas,r=Ce({scene:s}),f=new Cesium.ScreenSpaceEventHandler(t);function w(a){let d=s.pickPosition(a.position);if(!d||!Cesium.defined(d)){const p=s.camera.getPickRay(a.position);d=s.globe.pick(p,s)}return d}function x(a){return a.map(d=>{const p=Cesium.Cartographic.fromCartesian(d);return{lon:Cesium.Math.toDegrees(p.longitude),lat:Cesium.Math.toDegrees(p.latitude)}})}function L(){if(i.length<3)return console.warn("[HydroSim] Need at least 3 vertices to form a polygon."),!1;const a=x(i);return f.destroy(),r.destroy(),t.style.cursor="",c(a),!0}t.style.cursor="crosshair",f.setInputAction(a=>{const d=w(a);d&&(i.push(d),r.addPoint(d),r.updatePreview(i))},Cesium.ScreenSpaceEventType.LEFT_CLICK),f.setInputAction(a=>{const d=w(a);d&&i.length>0&&Cesium.Cartesian3.distance(d,i[i.length-1])>.5&&(i.push(d),r.addPoint(d),r.updatePreview(i)),L()},Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);function l(){f.destroy(),r.destroy(),t.style.cursor=""}f.setInputAction(()=>{L()||l()},Cesium.ScreenSpaceEventType.RIGHT_CLICK),document.addEventListener("keydown",function a(d){d.key==="Escape"&&(l(),document.removeEventListener("keydown",a))});const n=f.destroy.bind(f);return f.destroy=()=>{n();try{r.destroy()}catch{}t.style.cursor=""},f}function Me(s,c){let i=1/0,t=-1/0,r=1/0,f=-1/0;for(const M of s)M.lon<i&&(i=M.lon),M.lon>t&&(t=M.lon),M.lat<r&&(r=M.lat),M.lat>f&&(f=M.lat);const w=(t-i)*.2,x=(f-r)*.2;i-=w,t+=w,r-=x,f+=x;const L=1/111e3,l=1/(111e3*Math.cos((r+f)/2*Math.PI/180)),n=c*L,a=c*l,d=Math.max(4,Math.round((f-r)/n)+1),p=Math.max(4,Math.round((t-i)/a)+1),b=Math.sqrt(120*120/(p*d)),g=Math.min(120,Math.max(4,Math.round(p*b))),S=Math.min(120,Math.max(4,Math.round(d*b))),P=(t-i)/(g-1),A=(f-r)/(S-1),k=[];for(let M=0;M<S;M++)for(let z=0;z<g;z++){const B=i+z*P,$=r+M*A;k.push(new Cesium.Cartographic(Cesium.Math.toRadians(B),Cesium.Math.toRadians($)))}const I=A*111e3;return{grid:k,nx:g,ny:S,dx:I,minLon:i,minLat:r}}async function Se(s,c,i=50,t){const{grid:r,nx:f,ny:w,dx:x,minLon:L,minLat:l}=Me(c,i);t&&t(.05);const n=await Cesium.sampleTerrainMostDetailed(s.terrainProvider,r);t&&t(.9);const a=n.map(g=>Number.isFinite(g.height)?g.height:0),d=Math.min(...a),p=a.map(g=>g-d),b=new Float32Array(p);return t&&t(1),console.log(`[HydroSim] Terrain sampled: ${f}×${w} grid, dx=${x.toFixed(1)}m, min=${d.toFixed(1)}m`),{heights:b,nx:f,ny:w,dx:x,originLon:L,originLat:l}}const ye=.01;function Q(s,c,i){return s+(c-s)*i}function Le(s){if(s<ye)return[0,0,0,0];if(s<.5){const c=s/.5;return[Q(.53,.12,c),Q(.8,.31,c),Q(1,.78,c),Q(.35,.6,c)]}if(s<2){const c=(s-.5)/1.5;return[Q(.12,0,c),Q(.31,.08,c),Q(.78,.39,c),Q(.6,.85,c)]}return[0,.05,.3,.92]}function ve(s,c,i,t,r,f,w){const x=w+t/2*r/111e3,L=111e3,l=111e3*Math.cos(x*Math.PI/180),n=r/l,a=r/L,d=[],p=[];function b(A,k,I){const M=Cesium.Cartesian3.fromDegrees(A,k,I);d.push(M.x,M.y,M.z)}for(let A=0;A<t-1;A++)for(let k=0;k<i-1;k++){const I=A*i+k,M=s[I];if(!Number.isFinite(M)||M<ye)continue;const z=f+k*n,B=w+A*a,$=z+n,Z=B+a,G=c[I]+M+.05;if(!Number.isFinite(G))continue;b(z,B,G),b($,B,G),b($,Z,G),b(z,B,G),b($,Z,G),b(z,Z,G);const[R,ie,te,ne]=Le(M),se=Math.round(R*255),J=Math.round(ie*255),O=Math.round(te*255),ae=Math.round(ne*255);for(let X=0;X<6;X++)p.push(se,J,O,ae)}if(d.length===0)return null;const g=new Float64Array(d),S=new Uint8Array(p),P=new Cesium.Geometry({attributes:{position:new Cesium.GeometryAttribute({componentDatatype:Cesium.ComponentDatatype.DOUBLE,componentsPerAttribute:3,values:g}),color:new Cesium.GeometryAttribute({componentDatatype:Cesium.ComponentDatatype.UNSIGNED_BYTE,componentsPerAttribute:4,normalize:!0,values:S})},primitiveType:Cesium.PrimitiveType.TRIANGLES,boundingSphere:Cesium.BoundingSphere.fromVertices(g)});return new Cesium.Primitive({geometryInstances:new Cesium.GeometryInstance({geometry:P}),appearance:new Cesium.PerInstanceColorAppearance({flat:!0,translucent:!0}),releaseGeometryInstances:!0,asynchronous:!1})}function Ae(s){let c=null;const i=new Map;function t(r){r&&!r.isDestroyed()&&s.primitives.remove(r)}return{update(r,f,w,x,L,l,n,a){const d=new Float32Array(r,f,x*L),p=new Float32Array(r,w,x*L),b=ve(d,p,x,L,l,n,a);t(c),b&&s.primitives.add(b),c=b},clear(){t(c),c=null},upsertStaticLayer(r,f,w,x,L,l,n,a){const d=i.get(r);t(d);const p=ve(f,w,x,L,l,n,a);p?(s.primitives.add(p),i.set(r,p)):i.delete(r)},removeStaticLayer(r){const f=i.get(r);t(f),i.delete(r)},clearStaticLayers(){for(const r of i.values())t(r);i.clear()},destroy(){t(c),c=null;for(const r of i.values())t(r);i.clear()}}}function ke(s){const c=Cesium.Cartographic.fromCartesian(s);return{lon:Cesium.Math.toDegrees(c.longitude),lat:Cesium.Math.toDegrees(c.latitude)}}function De(s,c,i,t,r,f,w,x){const l=111e3*Math.cos((x+c)/2*Math.PI/180),n=Math.round((s-w)*l/f),a=Math.round((c-x)*111e3/f);return n<0||n>=t||a<0||a>=r?0:i[a*t+n]||0}function Pe(s){return Math.max(1,Math.round(s/4))}function Fe(s,c,i,t,r,f,w){var l;const x=[];let L=0;for(let n=0;n<s.primitives.length;n++){const a=s.primitives.get(n);if(!a||a.imageBasedLighting===void 0||!a.boundingSphere)continue;const d=(l=a.boundingSphere)==null?void 0:l.center;if(!d)continue;const{lon:p,lat:b}=ke(d),g=De(p,b,c,i,t,r,f,w);if(g<.05)continue;const S=a.boundingSphere.radius||10,P=Pe(S),A=Math.min(5,S/20),k=g*P*A;x.push({id:`tileset-${n}-${L++}`,lon:p.toFixed(5),lat:b.toFixed(5),depth:Math.round(g*100)/100,floors:P,score:Math.round(k*10)/10,label:`Gebäude ~(${p.toFixed(3)}°, ${b.toFixed(3)}°)`})}return x.sort((n,a)=>a.score-n.score),x.slice(0,20)}function $e(s){if(!(s!=null&&s.primitives))return 0;let c=0;for(let i=0;i<s.primitives.length;i++){const t=s.primitives.get(i);!t||t.imageBasedLighting===void 0||t.boundingSphere&&(c+=1)}return c}const Ee=`
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
`,Ie=`
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
`;function ze(){const s=document.createElement("style");s.textContent=Ee,document.head.appendChild(s);const c=document.createElement("button");c.id="hydrosim-trigger",c.title="HydroSim — Hochwassersimulation",c.innerHTML='<i class="bi bi-water"></i>',document.body.appendChild(c);const i=document.createElement("div");i.id="hydrosim-panel",i.innerHTML=Ie,document.body.appendChild(i);const t=u=>document.getElementById(u),r=t("hs-draw-btn"),f=t("hs-draw-label"),w=t("hs-draw-hint"),x=t("hs-run"),L=t("hs-pause"),l=t("hs-reset"),n=t("hs-status"),a=t("hs-progress"),d=t("hs-progress-bar"),p=t("hs-volume"),b=t("hs-duration"),g=t("hs-speed"),S=t("hs-profile"),P=t("hs-profile-help"),A=t("hs-mode"),k=t("hs-mode-help"),I=t("hs-quality-note"),M=t("hs-vol-val"),z=t("hs-dur-val"),B=t("hs-speed-val"),$=t("hs-measure-pump"),Z=t("hs-measure-dike"),G=t("hs-measure-retention"),R=t("hs-measure-level"),ie=t("hs-measure-level-val"),te=t("hs-impact-section"),ne=t("hs-impact-count"),se=t("hs-impact-tbody"),J=t("hs-layer-strategy"),O=t("hs-layer-active"),ae=t("hs-layer-count"),X=t("hs-layer-clear"),me=t("hs-layer-clear-all"),pe=t("hs-export-geojson");let he="idle",oe=!0;return c.addEventListener("click",()=>{i.classList.toggle("visible")}),t("hs-close").addEventListener("click",()=>{i.classList.remove("visible")}),S.addEventListener("change",()=>{P.textContent=S.value==="advanced"?"Advanced: stabilere Extremereignisse, strengere Solver-Grenzen, Analysefokus.":"Standard für schnelle Szenarien. Advanced nutzt robuste Extrem-Defaults."}),A.addEventListener("change",()=>{k.textContent=A.value==="auto"?"Automatik wählt den Ereignistyp anhand von Volumen und Dauer.":`Manueller Modus: ${A.options[A.selectedIndex].text}`}),p.addEventListener("input",()=>{M.textContent=Number(p.value).toLocaleString("de-DE")}),b.addEventListener("input",()=>{z.textContent=b.value}),g.addEventListener("input",()=>{B.textContent=g.value}),R.addEventListener("input",()=>{ie.textContent=R.value}),{panel:i,trigger:c,getParams(){return{volumeM3:Number(p.value),durationMin:Number(b.value),durationS:Number(b.value)*60,speed:Number(g.value),profile:S.value||"standard",mode:A.value||"auto",measures:{pump:!!$.checked,dike:!!Z.checked,retention:!!G.checked,level:Number(R.value)/100}}},onDraw(u){r.addEventListener("click",u)},onRun(u){x.addEventListener("click",u)},onPause(u){L.addEventListener("click",u)},onReset(u){l.addEventListener("click",u)},onExport(u){pe.addEventListener("click",u)},onLayerClear(u){X.addEventListener("click",u)},onLayerClearAll(u){me.addEventListener("click",u)},onLayerActiveChange(u){O.addEventListener("change",u)},getLayerStrategy(){return J.value||"append"},getActiveLayerId(){return O.value||""},setAnalysisLayers(u,H){O.innerHTML="";for(const e of u){const o=document.createElement("option");o.value=e.id,o.textContent=e.label,H&&H===e.id&&(o.selected=!0),O.appendChild(o)}if(u.length===0){const e=document.createElement("option");e.value="",e.textContent="Keine Analyse vorhanden",O.appendChild(e)}ae.textContent=String(u.length),X.disabled=u.length===0,me.disabled=u.length===0},setQuality(u,H=""){const e=u==="analysis-3d"?"Qualitätsstufe: Analyse (3D)":"Qualitätsstufe: Vorschau (2D)";I.textContent=H?`${e} · ${H}`:e,I.style.color=u==="analysis-3d"?"#a5d6a7":"#ffcc80"},setState(u){he=u,r.disabled=!oe||["drawing","sampling","running"].includes(u),x.disabled=!oe||!["ready","paused"].includes(u),L.disabled=u!=="running",l.disabled=u==="sampling",u==="drawing"?(f.textContent="Zeichnen…",r.classList.add("active"),w.style.display="block"):(f.textContent="Polygon zeichnen",r.classList.remove("active"),w.style.display="none"),u==="idle"&&te.classList.remove("visible"),u==="results"&&te.classList.add("visible");const H=["ready","running","paused","results"].includes(u);pe.disabled=!H},setGate(u){oe=!!u,this.setState(he)},setStatus(u,H="bi-info-circle"){n.innerHTML=u?`<i class="bi ${H}"></i> ${u}`:""},setProgress(u){u===null?(a.style.display="none",d.style.width="0%"):(a.style.display="block",d.style.width=`${Math.round(u*100)}%`)},setImpact(u){if(!u||u.length===0){ne.textContent="0",se.innerHTML='<tr><td colspan="3" style="color:#607d8b;text-align:center">Keine Gebäude betroffen</td></tr>';return}ne.textContent=u.length;const H=u[0].score;se.innerHTML=u.slice(0,10).map(e=>`<tr>
          <td><span class="hs-score-bar" style="width:${Math.round(e.score/H*60)}px"></span>${e.score}</td>
          <td>${e.depth} m</td>
          <td style="font-size:0.65rem">${e.lon}°<br>${e.lat}°</td>
        </tr>`).join("")}}}const Te={standard:{maxInteractiveCameraHeightM:8e3,solver:{maxDepthForDt:4,minDepthForDt:.01,cfl:.45,dtCap:.5,targetSubstepDt:.1,maxSourceStepM:15e-5,maxDisplayDepth:20,baseFriction:.08,minFriction:.03,frictionBoost:{dike:.55,retention:.35,pump:.15}},modeFactors:{rain:{inflow:1,friction:1},flash:{inflow:1.2,friction:.95},river:{inflow:.9,friction:.85}}},advanced:{maxInteractiveCameraHeightM:8e3,solver:{maxDepthForDt:3,minDepthForDt:.02,cfl:.4,dtCap:.35,targetSubstepDt:.07,maxSourceStepM:12e-5,maxDisplayDepth:15,baseFriction:.09,minFriction:.04,frictionBoost:{dike:.6,retention:.4,pump:.18}},modeFactors:{rain:{inflow:1,friction:1},flash:{inflow:1.15,friction:1},river:{inflow:.88,friction:.9}}}};function xe(s){return Math.max(0,Math.min(1,Number.isFinite(s)?s:0))}function de(s){if(s.mode&&s.mode!=="auto")return s.mode;const c=s.volumeM3/Math.max(60,s.durationS);return c<150?"rain":c<900?"flash":"river"}function ue(s){const c=(s==null?void 0:s.profile)==="advanced"?"advanced":"standard";return Te[c]}function He(s,c){return!s||!c?!1:s.nx===c.nx&&s.ny===c.ny&&Math.round(s.dx*1e3)===Math.round(c.dx*1e3)}function Ne(s,c){for(let i=0;i<s.length;i++){const t=s[i],r=c[i];s[i]=Number.isFinite(t)&&Number.isFinite(r)?Math.max(t,r):Number.isFinite(t)?t:Number.isFinite(r)?r:0}}function Be(s,c=new Date){const i=String(c.getHours()).padStart(2,"0"),t=String(c.getMinutes()).padStart(2,"0");return`A${s} ${i}:${t}`}function Ge(s,c=()=>{}){const i=new Map;let t=null,r=1;function f(){return`analysis-${Date.now()}-${r++}`}function w(){return Array.from(i.values()).map(l=>({id:l.id,label:`${l.name} (${l.meta.nx}x${l.meta.ny})`}))}function x(){c(w(),t)}function L(l){s==null||s.upsertStaticLayer(l.id,l.depth,l.bed,l.meta.nx,l.meta.ny,l.meta.dx,l.meta.originLon,l.meta.originLat)}return{setActive(l){t=l&&i.has(l)?l:null,x()},getActiveId(){return t},getActiveLayer(){return t?i.get(t):null},getAll(){return i},upsertFromSnapshot(l,n){if(!l)return{merged:!1,created:!1};let a=t;const d=a&&i.has(a),p=n==="append"&&d&&He(i.get(a).meta,l.meta);if(n==="new"||!p){a=f();const g={id:a,name:Be(i.size+1),meta:l.meta,depth:new Float32Array(l.depth),bed:new Float32Array(l.bed)};return i.set(a,g),t=a,L(g),x(),{merged:!1,created:!0}}const b=i.get(a);return Ne(b.depth,l.depth),L(b),x(),{merged:!0,created:!1}},clearActive(){t&&(s==null||s.removeStaticLayer(t),i.delete(t),t=i.keys().next().value||null,x())},clearAll(){s==null||s.clearStaticLayers(),i.clear(),t=null,x()}}}(async function(){const c=(...e)=>console.log("[HydroSim]",...e),i=(...e)=>console.error("[HydroSim]",...e);let t=null,r=null;const f=new Map;function w(){var e,o,y,m;return((m=(y=(o=(e=window.mapCollection)==null?void 0:e.getMap)==null?void 0:o.call(e,"3D"))==null?void 0:y.getCesiumScene)==null?void 0:m.call(y))??null}function x(){var o,y,m,h,v,C;const e=(h=(m=(y=(o=document.getElementById("masterportal-root"))==null?void 0:o.__vue_app__)==null?void 0:y.config)==null?void 0:m.globalProperties)==null?void 0:h.$store;return((C=(v=e==null?void 0:e.state)==null?void 0:v.Maps)==null?void 0:C.mode)??null}async function L(){var o,y,m,h,v,C;const e=(h=(m=(y=(o=document.getElementById("masterportal-root"))==null?void 0:o.__vue_app__)==null?void 0:y.config)==null?void 0:m.globalProperties)==null?void 0:h.$store;if(!e)return!1;if(((C=(v=e.state)==null?void 0:v.Maps)==null?void 0:C.mode)==="3D")return!0;try{return await e.dispatch("Maps/activateMap3d"),!0}catch{try{return await e.dispatch("Maps/changeMapMode","3D"),!0}catch{return!1}}}async function l(){return new Promise(e=>{const o=setInterval(()=>{window.Cesium&&w()&&(clearInterval(o),e())},500)})}try{const e=`/hydrosim.wasm?v=${Date.now()}`;let o;try{o=await WebAssembly.instantiateStreaming(fetch(e,{cache:"no-store"}),{env:{abort(y,m,h,v){i(`WASM abort at ${m}:${h}:${v}`,y)}}})}catch{const h=await(await fetch(e,{cache:"no-store"})).arrayBuffer();o=await WebAssembly.instantiate(h,{env:{abort(v,C,F,D){i(`WASM abort at ${C}:${F}:${D}`,v)}}})}t=o.instance.exports,r=t.memory,c("WASM loaded.")}catch(e){i("WASM load failed:",e)}await l();const n=ze();if(n.setState("idle"),!t){n.setStatus("WASM konnte nicht geladen werden — Simulation deaktiviert","bi-exclamation-triangle");return}let a="idle",d=null,p=null,b=null,g=null,S=null,P=0,A=0;const k=new Map,I=10;function M(e,o,y,m){const h=Number.isFinite(e)?e:o,v=Math.min(y,Math.max(o,h));if(v!==h){const C=(f.get(m)||0)+1;f.set(m,C),(C===1||C%20===0)&&c(`Clamp ${m}: in=${h}, out=${v}, count=${C}`)}return v}function z(){return x()==="3D"?"analysis-3d":"preview-2d"}function B(e=""){n.setQuality(z(),e)}function $(e){a=e,n.setState(e),c("State ->",e)}function Z(){if(!g){const e=w();e&&(g=Ae(e))}}function G(){if(!p||!r||!t)return null;const{nx:e,ny:o,dx:y,originLon:m,originLat:h}=p,v=e*o,C=new Float32Array(r.buffer,t.hPtr(),v),F=new Float32Array(r.buffer,t.zbPtr(),v);return{meta:{nx:e,ny:o,dx:y,originLon:m,originLat:h},depth:new Float32Array(C),bed:new Float32Array(F)}}const R=Ge({upsertStaticLayer:(...e)=>g==null?void 0:g.upsertStaticLayer(...e),removeStaticLayer:e=>g==null?void 0:g.removeStaticLayer(e),clearStaticLayers:()=>g==null?void 0:g.clearStaticLayers()},(e,o)=>n.setAnalysisLayers(e,o));function ie(){const e=R.getActiveLayer(),o=e?{meta:e.meta,depth:e.depth}:G();if(!o){n.setStatus("Kein Ergebnis zum Export vorhanden.","bi-exclamation-circle");return}const{nx:y,ny:m,dx:h,originLon:v,originLat:C}=o.meta,F=o.depth,D=111e3,T=C+m/2*h/D,j=111e3*Math.cos(T*Math.PI/180),q=h/j,U=h/D,_=[],K=Math.max(1,Math.floor(Math.sqrt(y*m/9e3)));for(let Y=0;Y<m;Y+=K)for(let V=0;V<y;V+=K){const ce=F[Y*y+V];if(!Number.isFinite(ce)||ce<.05)continue;const le=v+(V+.5)*q,ee=C+(Y+.5)*U;_.push({type:"Feature",geometry:{type:"Point",coordinates:[le,ee]},properties:{depth_m:Math.round(ce*1e3)/1e3,row:Y,col:V,cell_m:Math.round(h*100)/100}})}const re={type:"FeatureCollection",properties:{generatedAt:new Date().toISOString(),nx:y,ny:m,dx:h,sourceLayer:(e==null?void 0:e.name)||"current-run",qualityFlag:z(),profile:n.getParams().profile||"standard",selectedMode:n.getParams().mode||"auto",resolvedMode:de(n.getParams()),durationS:n.getParams().durationS,volumeM3:n.getParams().volumeM3,measures:n.getParams().measures||{}},features:_},E=new Blob([JSON.stringify(re)],{type:"application/geo+json"}),N=URL.createObjectURL(E),W=document.createElement("a");W.href=N,W.download=`hydrosim-${(e==null?void 0:e.id)||"current"}-${Date.now()}.geojson`,document.body.appendChild(W),W.click(),W.remove(),setTimeout(()=>URL.revokeObjectURL(N),1e3),n.setStatus(`Export erstellt (${_.length} Features)`,"bi-download")}function te(){R.clearActive()}function ne(){R.clearAll()}function se(){const e=n.getParams(),o=ue(e),y=w(),m=y==null?void 0:y.camera;if(!m||!window.Cesium)return!1;const h=window.Cesium.Cartographic.fromCartesian(m.positionWC);return Number.isFinite(h.height)&&h.height<=o.maxInteractiveCameraHeightM}function J(){const e=se();return n.setGate(e),!e&&a==="idle"&&(B("3D für belastbare Analysen erforderlich"),n.setStatus(`Für HydroSim näher heranzoomen (Kamerahöhe < ${ue(n.getParams()).maxInteractiveCameraHeightM} m).`,"bi-zoom-in")),e&&a==="idle"&&(B("Analysemodus aktiv"),n.setStatus("Bereit — Polygon zeichnen um zu beginnen","bi-info-circle")),e}function O(){const e=w(),o=e==null?void 0:e.camera;if(!o||!window.Cesium)return 50;const m=window.Cesium.Cartographic.fromCartesian(o.positionWC).height;return Number.isFinite(m)?m<2500?20:m<5e3?30:50:50}function ae(e){const o=ue(n.getParams());return o.modeFactors[e]||o.modeFactors.rain}async function X(e){$("sampling"),n.setStatus("Terrain wird abgetastet…","bi-hourglass-split"),n.setProgress(.05);try{const o=O();p=await Se(e,d,o,D=>n.setProgress(D*.9)),n.setProgress(1);const{heights:y,nx:m,ny:h,dx:v}=p;if(t.init(m,h,v)<0)throw new Error("WASM init failed: not enough memory for grid");r=t.memory;const F=t.scratchPtr();new Float32Array(r.buffer,F,m*h).set(y),t.setTerrain(F,m*h),setTimeout(()=>n.setProgress(null),500),$("ready"),n.setStatus(`Bereit. Grid: ${m}x${h}, dx=${v.toFixed(0)}m`,"bi-check-circle")}catch(o){i("Terrain sampling failed:",o),n.setProgress(null),$("idle"),n.setStatus("Terrain-Abfrage fehlgeschlagen: "+o.message,"bi-exclamation-triangle")}}function me(e,o,y,m,h,v){const C=e.reduce((N,W)=>N+W.lon,0)/e.length,F=e.reduce((N,W)=>N+W.lat,0)/e.length,D=111320,T=111320*Math.cos(F*Math.PI/180),j=Math.round((C-h)*T/m),q=Math.round((F-v)*D/m),U=e.map(N=>N.lon),_=e.map(N=>N.lat),K=(Math.max(...U)-Math.min(...U))*T/m,re=(Math.max(..._)-Math.min(..._))*D/m,E=Math.max(2,Math.round(Math.min(K,re)*.25));return{cx:Math.max(E,Math.min(o-1-E,j)),cy:Math.max(E,Math.min(y-1-E,q)),radius:E}}function pe(){const e=n.getParams(),o=de(e),y=e.profile==="advanced"?"advanced":"standard",m=e.measures||{},h=(d||[]).slice(0,12).map(C=>`${C.lon.toFixed(5)}:${C.lat.toFixed(5)}`).join("|");return`${p?`${p.nx}x${p.ny}@${Math.round(p.dx)}`:"nogrid"}|v=${e.volumeM3}|d=${e.durationS}|m=${o}|pr=${y}|ml=${xe(m.level).toFixed(2)}|mp=${m.pump?1:0}|md=${m.dike?1:0}|mr=${m.retention?1:0}|p=${h}`}function he(e,o,y,m,h,v,C){return new Promise(F=>{const D=()=>F(Fe(e,o,y,m,h,v,C));typeof window.requestIdleCallback=="function"?window.requestIdleCallback(D,{timeout:250}):setTimeout(D,0)})}async function oe(){cancelAnimationFrame(S),S=null,$("results"),n.setProgress(null),n.setStatus("Berechne betroffene Gebäude…","bi-buildings");try{const{nx:e,ny:o,dx:y,originLon:m,originLat:h}=p,v=new Float32Array(r.buffer,t.hPtr(),e*o),C=w(),F=pe(),D=C?$e(C):0;let T=k.get(F);const j=!!T;if(!T&&(T=C?await he(C,v,e,o,y,m,h):[],k.set(F,T),k.size>I)){const _=k.keys().next().value;k.delete(_)}n.setImpact(T);const q=R.upsertFromSnapshot(G(),n.getLayerStrategy()),U=z()==="analysis-3d"?"Analyse (3D)":"Vorschau (2D)";if(D===0)n.setStatus(`Fertig · ${U} · keine LoD2-Gebäudelayer geladen (Impact = 0)${j?" · Cache-Hit":""}`,"bi-info-circle");else{const _=q.merged?"Layer ergänzt":q.created?"Layer neu":"Layer unverändert";n.setStatus(`Fertig · ${U} · ${T.length} Gebäude betroffen · ${_}${j?" · Cache-Hit":""}`,"bi-check-circle")}}catch(e){i("Impact analysis failed:",e),n.setStatus("Simulation beendet (Impact-Analyse fehlgeschlagen)","bi-exclamation-triangle")}}function u(){if(a!=="running"||!p)return;const e=n.getParams(),o=ue(e),y=de(e),m=ae(y),h=e.measures||{},v=xe(h.level),{nx:C,ny:F,dx:D,originLon:T,originLat:j}=p,q=t.maxDepth(),U=Number.isFinite(q)&&q>0?M(q,o.solver.minDepthForDt,o.solver.maxDepthForDt,"maxDepthForDt"):o.solver.minDepthForDt,_=Math.max(o.solver.minDepthForDt,U),K=Math.min(D/Math.sqrt(9.81*_)*o.solver.cfl,o.solver.dtCap),re=Math.max(1,Math.round(e.speed));let E=null,N=0;if(d&&d.length>=3){E=me(d,C,F,D,T,j);const ee=Math.max(1,Math.PI*E.radius*E.radius)*D*D,ge=e.volumeM3/Math.max(1,e.durationS),be=Math.max(.2,1-(h.pump?.35*v:0)-(h.retention?.25*v:0)-(h.dike?.1*v:0)),fe=ge*m.inflow*be;N=M(fe/ee*K,0,o.solver.maxSourceStepM,"sourceDepthStep")}const W=1+(h.dike?o.solver.frictionBoost.dike*v:0)+(h.retention?o.solver.frictionBoost.retention*v:0)+(h.pump?o.solver.frictionBoost.pump*v:0),Y=Math.max(o.solver.minFriction,o.solver.baseFriction*m.friction*W);for(let le=0;le<re;le++){const ee=Math.max(1,Math.ceil(K/o.solver.targetSubstepDt)),ge=K/ee,be=N/ee;for(let fe=0;fe<ee;fe++)E&&t.injectSource(E.cx,E.cy,E.radius,be),t.step(ge,9.81,Y);if(P+=K,P>=e.durationS)break}A+=1,A%2===0&&(Z(),g==null||g.update(r.buffer,t.hPtr(),t.zbPtr(),C,F,D,T,j));const V=t.maxDepth(),ce=Number.isFinite(V)&&V>=0?M(V,0,o.solver.maxDisplayDepth,"maxDisplayDepth"):0;if(n.setProgress(Math.min(1,P/e.durationS)),n.setStatus(`T = ${Math.round(P)}s · max. Tiefe ${ce.toFixed(2)} m`,"bi-droplet-fill"),P>=e.durationS){oe();return}S=requestAnimationFrame(u)}n.onDraw(async()=>{if(a==="drawing"){b==null||b.destroy(),b=null,$("idle"),n.setStatus("Zeichnung abgebrochen.","bi-x-circle");return}if(!["idle","ready","results"].includes(a)||!J())return;if(x()!=="3D"&&!await L()){n.setStatus("Bitte zuerst in den 3D-Modus wechseln.","bi-exclamation-triangle");return}const e=w();if(!e){n.setStatus("3D-Modus aktivieren und Polygon zeichnen…","bi-pencil-square");return}$("drawing"),n.setStatus("Klicken = Punkt setzen · Doppelklick = Fertig · Rechtsklick = Fertig/Abbruch","bi-pencil-square"),b=we(e,async o=>{b=null,d=o,await X(e)})}),n.onRun(()=>{if(!J()||!p||!t||!["ready","paused"].includes(a))return;if(a==="ready"){P=0,t.reset();const{heights:m,nx:h,ny:v}=p,C=t.scratchPtr();new Float32Array(r.buffer,C,h*v).set(m),t.setTerrain(C,h*v)}const e=de(n.getParams()),o=n.getParams().profile==="advanced"?"Advanced":"Standard",y=e==="flash"?"Sturzflut":e==="river"?"Fluss":"Starkregen";$("running"),n.setStatus(`Simulation läuft… (${o} · ${y})`,"bi-play-fill"),cancelAnimationFrame(S),S=requestAnimationFrame(u)}),n.onPause(()=>{a==="running"&&(cancelAnimationFrame(S),S=null,$("paused"),n.setStatus(`Pausiert bei T=${Math.round(P)}s`,"bi-pause-fill"))}),n.onReset(()=>{cancelAnimationFrame(S),S=null,b==null||b.destroy(),b=null,g==null||g.clear(),t.reset(),d=null,p=null,P=0,$("idle"),n.setStatus("",""),n.setProgress(null),n.setImpact([])}),n.onExport(()=>{ie()}),n.onLayerClear(()=>{te()}),n.onLayerClearAll(()=>{ne()}),n.onLayerActiveChange(()=>{R.setActive(n.getActiveLayerId()||null)}),$("idle"),J(),n.setAnalysisLayers([],null),B("3D für belastbare Analysen erforderlich");const H=setInterval(J,800);window.HydroSim={getState:()=>a,getTerrain:()=>p,getWasm:()=>t,getScene:w,stop:()=>{cancelAnimationFrame(S),S=null,$("paused")},destroy:()=>{clearInterval(H)}}})()})();
