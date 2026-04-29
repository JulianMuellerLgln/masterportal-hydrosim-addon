(function(){"use strict";function ge(d){const u=new Cesium.PointPrimitiveCollection,a=new Cesium.PolylineCollection;d.scene.primitives.add(u),d.scene.primitives.add(a);let t=null,i=null;function h(n){n&&!n.isDestroyed()&&d.scene.primitives.remove(n)}function L(n){const m=Cesium.Cartographic.fromCartesian(n),o=d.scene.globe.getHeight(m),r=Number.isFinite(o)?o+.2:m.height;return Cesium.Cartesian3.fromRadians(m.longitude,m.latitude,r)}function w(n,m,o=10){const r=Cesium.Cartographic.fromCartesian(n),y=Cesium.Cartographic.fromCartesian(m),f=[];for(let x=0;x<=o;x++){const M=x/o,T=Cesium.Math.lerp(r.longitude,y.longitude,M),A=Cesium.Math.lerp(r.latitude,y.latitude,M),I=new Cesium.Cartographic(T,A),z=d.scene.globe.getHeight(I),v=Number.isFinite(z)?z+.25:Cesium.Math.lerp(r.height,y.height,M);f.push(Cesium.Cartesian3.fromRadians(T,A,v))}return f}function S(n){if(n.length<2)return[];const m=[];for(let o=0;o<n.length-1;o++){const r=w(n[o],n[o+1]);o>0&&r.shift(),m.push(...r)}return m}return{points:u,polys:a,updatePreview(n){if(a.removeAll(),h(t),h(i),t=null,i=null,n.length>=2){const m=[...n,n[0]],o=S(m);a.add({positions:o.length>0?o:m,width:2.5,material:Cesium.Material.fromType("Color",{color:Cesium.Color.fromCssColorString("#4af")}),loop:!1})}if(n.length>=3){const m=n.map(L),o=new Cesium.PolygonGeometry({polygonHierarchy:new Cesium.PolygonHierarchy(m),perPositionHeight:!0,vertexFormat:Cesium.PerInstanceColorAppearance.VERTEX_FORMAT});i=new Cesium.Primitive({geometryInstances:new Cesium.GeometryInstance({geometry:o,attributes:{color:Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.fromCssColorString("#4af").withAlpha(.22))}}),appearance:new Cesium.PerInstanceColorAppearance({translucent:!0,closed:!1}),asynchronous:!1}),d.scene.primitives.add(i)}},addPoint(n){u.add({position:n,color:Cesium.Color.fromCssColorString("#4af"),pixelSize:8,outlineColor:Cesium.Color.WHITE,outlineWidth:1})},destroy(){h(t),h(i),d.scene.primitives.remove(u),d.scene.primitives.remove(a)}}}function be(d,u){const a=[],t=d.canvas,i=ge({scene:d}),h=new Cesium.ScreenSpaceEventHandler(t);function L(o){let r=d.pickPosition(o.position);if(!r||!Cesium.defined(r)){const y=d.camera.getPickRay(o.position);r=d.globe.pick(y,d)}return r}function w(o){return o.map(r=>{const y=Cesium.Cartographic.fromCartesian(r);return{lon:Cesium.Math.toDegrees(y.longitude),lat:Cesium.Math.toDegrees(y.latitude)}})}function S(){if(a.length<3)return console.warn("[HydroSim] Need at least 3 vertices to form a polygon."),!1;const o=w(a);return h.destroy(),i.destroy(),t.style.cursor="",u(o),!0}t.style.cursor="crosshair",h.setInputAction(o=>{const r=L(o);r&&(a.push(r),i.addPoint(r),i.updatePreview(a))},Cesium.ScreenSpaceEventType.LEFT_CLICK),h.setInputAction(o=>{const r=L(o);r&&a.length>0&&Cesium.Cartesian3.distance(r,a[a.length-1])>.5&&(a.push(r),i.addPoint(r),i.updatePreview(a)),S()},Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);function n(){h.destroy(),i.destroy(),t.style.cursor=""}h.setInputAction(()=>{S()||n()},Cesium.ScreenSpaceEventType.RIGHT_CLICK),document.addEventListener("keydown",function o(r){r.key==="Escape"&&(n(),document.removeEventListener("keydown",o))});const m=h.destroy.bind(h);return h.destroy=()=>{m();try{i.destroy()}catch{}t.style.cursor=""},h}function ye(d,u){let a=1/0,t=-1/0,i=1/0,h=-1/0;for(const v of d)v.lon<a&&(a=v.lon),v.lon>t&&(t=v.lon),v.lat<i&&(i=v.lat),v.lat>h&&(h=v.lat);const L=(t-a)*.2,w=(h-i)*.2;a-=L,t+=L,i-=w,h+=w;const S=1/111e3,n=1/(111e3*Math.cos((i+h)/2*Math.PI/180)),m=u*S,o=u*n,r=Math.max(4,Math.round((h-i)/m)+1),y=Math.max(4,Math.round((t-a)/o)+1),f=Math.sqrt(120*120/(y*r)),x=Math.min(120,Math.max(4,Math.round(y*f))),M=Math.min(120,Math.max(4,Math.round(r*f))),T=(t-a)/(x-1),A=(h-i)/(M-1),I=[];for(let v=0;v<M;v++)for(let P=0;P<x;P++){const W=a+P*T,F=i+v*A;I.push(new Cesium.Cartographic(Cesium.Math.toRadians(W),Cesium.Math.toRadians(F)))}const z=A*111e3;return{grid:I,nx:x,ny:M,dx:z,minLon:a,minLat:i}}async function ve(d,u,a=50,t){const{grid:i,nx:h,ny:L,dx:w,minLon:S,minLat:n}=ye(u,a);t&&t(.05);const m=await Cesium.sampleTerrainMostDetailed(d.terrainProvider,i);t&&t(.9);const o=m.map(x=>Number.isFinite(x.height)?x.height:0),r=Math.min(...o),y=o.map(x=>x-r),f=new Float32Array(y);return t&&t(1),console.log(`[HydroSim] Terrain sampled: ${h}×${L} grid, dx=${w.toFixed(1)}m, min=${r.toFixed(1)}m`),{heights:f,nx:h,ny:L,dx:w,originLon:S,originLat:n}}const pe=.01;function V(d,u,a){return d+(u-d)*a}function xe(d){if(d<pe)return[0,0,0,0];if(d<.5){const u=d/.5;return[V(.53,.12,u),V(.8,.31,u),V(1,.78,u),V(.35,.6,u)]}if(d<2){const u=(d-.5)/1.5;return[V(.12,0,u),V(.31,.08,u),V(.78,.39,u),V(.6,.85,u)]}return[0,.05,.3,.92]}function he(d,u,a,t,i,h,L){const w=L+t/2*i/111e3,S=111e3,n=111e3*Math.cos(w*Math.PI/180),m=i/n,o=i/S,r=[],y=[];function f(A,I,z){const v=Cesium.Cartesian3.fromDegrees(A,I,z);r.push(v.x,v.y,v.z)}for(let A=0;A<t-1;A++)for(let I=0;I<a-1;I++){const z=A*a+I,v=d[z];if(!Number.isFinite(v)||v<pe)continue;const P=h+I*m,W=L+A*o,F=P+m,J=W+o,D=u[z]+v+.05;if(!Number.isFinite(D))continue;f(P,W,D),f(F,W,D),f(F,J,D),f(P,W,D),f(F,J,D),f(P,J,D);const[Z,se,ie,j]=xe(v),ce=Math.round(Z*255),oe=Math.round(se*255),Y=Math.round(ie*255),K=Math.round(j*255);for(let X=0;X<6;X++)y.push(ce,oe,Y,K)}if(r.length===0)return null;const x=new Float64Array(r),M=new Uint8Array(y),T=new Cesium.Geometry({attributes:{position:new Cesium.GeometryAttribute({componentDatatype:Cesium.ComponentDatatype.DOUBLE,componentsPerAttribute:3,values:x}),color:new Cesium.GeometryAttribute({componentDatatype:Cesium.ComponentDatatype.UNSIGNED_BYTE,componentsPerAttribute:4,normalize:!0,values:M})},primitiveType:Cesium.PrimitiveType.TRIANGLES,boundingSphere:Cesium.BoundingSphere.fromVertices(x)});return new Cesium.Primitive({geometryInstances:new Cesium.GeometryInstance({geometry:T}),appearance:new Cesium.PerInstanceColorAppearance({flat:!0,translucent:!0}),releaseGeometryInstances:!0,asynchronous:!1})}function Ce(d){let u=null;const a=new Map;function t(i){i&&!i.isDestroyed()&&d.primitives.remove(i)}return{update(i,h,L,w,S,n,m,o){const r=new Float32Array(i,h,w*S),y=new Float32Array(i,L,w*S),f=he(r,y,w,S,n,m,o);t(u),f&&d.primitives.add(f),u=f},clear(){t(u),u=null},upsertStaticLayer(i,h,L,w,S,n,m,o){const r=a.get(i);t(r);const y=he(h,L,w,S,n,m,o);y?(d.primitives.add(y),a.set(i,y)):a.delete(i)},removeStaticLayer(i){const h=a.get(i);t(h),a.delete(i)},clearStaticLayers(){for(const i of a.values())t(i);a.clear()},destroy(){t(u),u=null;for(const i of a.values())t(i);a.clear()}}}function we(d){const u=Cesium.Cartographic.fromCartesian(d);return{lon:Cesium.Math.toDegrees(u.longitude),lat:Cesium.Math.toDegrees(u.latitude)}}function Me(d,u,a,t,i,h,L,w){const n=111e3*Math.cos((w+u)/2*Math.PI/180),m=Math.round((d-L)*n/h),o=Math.round((u-w)*111e3/h);return m<0||m>=t||o<0||o>=i?0:a[o*t+m]||0}function Le(d){return Math.max(1,Math.round(d/4))}function Se(d,u,a,t,i,h,L){var n;const w=[];let S=0;for(let m=0;m<d.primitives.length;m++){const o=d.primitives.get(m);if(!o||o.imageBasedLighting===void 0||!o.boundingSphere)continue;const r=(n=o.boundingSphere)==null?void 0:n.center;if(!r)continue;const{lon:y,lat:f}=we(r),x=Me(y,f,u,a,t,i,h,L);if(x<.05)continue;const M=o.boundingSphere.radius||10,T=Le(M),A=Math.min(5,M/20),I=x*T*A;w.push({id:`tileset-${m}-${S++}`,lon:y.toFixed(5),lat:f.toFixed(5),depth:Math.round(x*100)/100,floors:T,score:Math.round(I*10)/10,label:`Gebäude ~(${y.toFixed(3)}°, ${f.toFixed(3)}°)`})}return w.sort((m,o)=>o.score-m.score),w.slice(0,20)}function ke(d){if(!(d!=null&&d.primitives))return 0;let u=0;for(let a=0;a<d.primitives.length;a++){const t=d.primitives.get(a);!t||t.imageBasedLighting===void 0||t.boundingSphere&&(u+=1)}return u}const Ae=`
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
`,Pe=`
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
    </div>
    <div class="hs-analysis-row">
      <button id="hs-export-geojson" class="hs-analysis-btn">
        <i class="bi bi-download"></i> Ergebnis als GeoJSON exportieren
      </button>
    </div>
  </div>

</div>
`;function Fe(){const d=document.createElement("style");d.textContent=Ae,document.head.appendChild(d);const u=document.createElement("button");u.id="hydrosim-trigger",u.title="HydroSim — Hochwassersimulation",u.innerHTML='<i class="bi bi-water"></i>',document.body.appendChild(u);const a=document.createElement("div");a.id="hydrosim-panel",a.innerHTML=Pe,document.body.appendChild(a);const t=g=>document.getElementById(g),i=t("hs-draw-btn"),h=t("hs-draw-label"),L=t("hs-draw-hint"),w=t("hs-run"),S=t("hs-pause"),n=t("hs-reset"),m=t("hs-status"),o=t("hs-progress"),r=t("hs-progress-bar"),y=t("hs-volume"),f=t("hs-duration"),x=t("hs-speed"),M=t("hs-mode"),T=t("hs-mode-help"),A=t("hs-vol-val"),I=t("hs-dur-val"),z=t("hs-speed-val"),v=t("hs-measure-pump"),P=t("hs-measure-dike"),W=t("hs-measure-retention"),F=t("hs-measure-level"),J=t("hs-measure-level-val"),D=t("hs-impact-section"),Z=t("hs-impact-count"),se=t("hs-impact-tbody"),ie=t("hs-layer-strategy"),j=t("hs-layer-active"),ce=t("hs-layer-count"),oe=t("hs-layer-clear"),Y=t("hs-export-geojson");let K="idle",X=!0;return u.addEventListener("click",()=>{a.classList.toggle("visible")}),t("hs-close").addEventListener("click",()=>{a.classList.remove("visible")}),M.addEventListener("change",()=>{T.textContent=M.value==="auto"?"Automatik wählt den Ereignistyp anhand von Volumen und Dauer.":`Manueller Modus: ${M.options[M.selectedIndex].text}`}),y.addEventListener("input",()=>{A.textContent=Number(y.value).toLocaleString("de-DE")}),f.addEventListener("input",()=>{I.textContent=f.value}),x.addEventListener("input",()=>{z.textContent=x.value}),F.addEventListener("input",()=>{J.textContent=F.value}),{panel:a,trigger:u,getParams(){return{volumeM3:Number(y.value),durationMin:Number(f.value),durationS:Number(f.value)*60,speed:Number(x.value),mode:M.value||"auto",measures:{pump:!!v.checked,dike:!!P.checked,retention:!!W.checked,level:Number(F.value)/100}}},onDraw(g){i.addEventListener("click",g)},onRun(g){w.addEventListener("click",g)},onPause(g){S.addEventListener("click",g)},onReset(g){n.addEventListener("click",g)},onExport(g){Y.addEventListener("click",g)},onLayerClear(g){oe.addEventListener("click",g)},onLayerActiveChange(g){j.addEventListener("change",g)},getLayerStrategy(){return ie.value||"append"},getActiveLayerId(){return j.value||""},setAnalysisLayers(g,N){j.innerHTML="";for(const $ of g){const Q=document.createElement("option");Q.value=$.id,Q.textContent=$.label,N&&N===$.id&&(Q.selected=!0),j.appendChild(Q)}if(g.length===0){const $=document.createElement("option");$.value="",$.textContent="Keine Analyse vorhanden",j.appendChild($)}ce.textContent=String(g.length),oe.disabled=g.length===0,Y.disabled=g.length===0},setState(g){K=g,i.disabled=!X||["drawing","sampling","running"].includes(g),w.disabled=!X||!["ready","paused"].includes(g),S.disabled=g!=="running",n.disabled=g==="sampling",g==="drawing"?(h.textContent="Zeichnen…",i.classList.add("active"),L.style.display="block"):(h.textContent="Polygon zeichnen",i.classList.remove("active"),L.style.display="none"),g==="idle"&&D.classList.remove("visible"),g==="results"&&D.classList.add("visible");const N=["ready","running","paused","results"].includes(g);Y.disabled=!N},setGate(g){X=!!g,this.setState(K)},setStatus(g,N="bi-info-circle"){m.innerHTML=g?`<i class="bi ${N}"></i> ${g}`:""},setProgress(g){g===null?(o.style.display="none",r.style.width="0%"):(o.style.display="block",r.style.width=`${Math.round(g*100)}%`)},setImpact(g){if(!g||g.length===0){Z.textContent="0",se.innerHTML='<tr><td colspan="3" style="color:#607d8b;text-align:center">Keine Gebäude betroffen</td></tr>';return}Z.textContent=g.length;const N=g[0].score;se.innerHTML=g.slice(0,10).map($=>`<tr>
          <td><span class="hs-score-bar" style="width:${Math.round($.score/N*60)}px"></span>${$.score}</td>
          <td>${$.depth} m</td>
          <td style="font-size:0.65rem">${$.lon}°<br>${$.lat}°</td>
        </tr>`).join("")}}}(async function(){const u=(...e)=>console.log("[HydroSim]",...e),a=(...e)=>console.error("[HydroSim]",...e);let t=null,i=null;function h(){var e,s,p,c;return((c=(p=(s=(e=window.mapCollection)==null?void 0:e.getMap)==null?void 0:s.call(e,"3D"))==null?void 0:p.getCesiumScene)==null?void 0:c.call(p))??null}function L(){var s,p,c,l,b,C;const e=(l=(c=(p=(s=document.getElementById("masterportal-root"))==null?void 0:s.__vue_app__)==null?void 0:p.config)==null?void 0:c.globalProperties)==null?void 0:l.$store;return((C=(b=e==null?void 0:e.state)==null?void 0:b.Maps)==null?void 0:C.mode)??null}async function w(){var s,p,c,l,b,C;const e=(l=(c=(p=(s=document.getElementById("masterportal-root"))==null?void 0:s.__vue_app__)==null?void 0:p.config)==null?void 0:c.globalProperties)==null?void 0:l.$store;if(!e)return!1;if(((C=(b=e.state)==null?void 0:b.Maps)==null?void 0:C.mode)==="3D")return!0;try{return await e.dispatch("Maps/activateMap3d"),!0}catch{try{return await e.dispatch("Maps/changeMapMode","3D"),!0}catch{return!1}}}async function S(){return new Promise(e=>{const s=setInterval(()=>{window.Cesium&&h()&&(clearInterval(s),e())},500)})}try{const e=`/hydrosim.wasm?v=${Date.now()}`;let s;try{s=await WebAssembly.instantiateStreaming(fetch(e,{cache:"no-store"}),{env:{abort(p,c,l,b){a(`WASM abort at ${c}:${l}:${b}`,p)}}})}catch{const l=await(await fetch(e,{cache:"no-store"})).arrayBuffer();s=await WebAssembly.instantiate(l,{env:{abort(b,C,k,E){a(`WASM abort at ${C}:${k}:${E}`,b)}}})}t=s.instance.exports,i=t.memory,u("WASM loaded.")}catch(e){a("WASM load failed:",e)}await S();const n=Fe();if(n.setState("idle"),!t){n.setStatus("WASM konnte nicht geladen werden — Simulation deaktiviert","bi-exclamation-triangle");return}let m="idle",o=null,r=null,y=null,f=null,x=null,M=0,T=0;const A=new Map,I=10,z=8e3,v=new Map;let P=null,W=1;function F(e){m=e,n.setState(e),u("State ->",e)}function J(){if(!f){const e=h();e&&(f=Ce(e))}}function D(){const e=Array.from(v.values()).map(s=>({id:s.id,label:`${s.name} (${s.meta.nx}x${s.meta.ny})`}));n.setAnalysisLayers(e,P)}function Z(){return`analysis-${Date.now()}-${W++}`}function se(e,s){return!e||!s?!1:e.nx===s.nx&&e.ny===s.ny&&Math.round(e.dx*1e3)===Math.round(s.dx*1e3)}function ie(){if(!r||!i||!t)return null;const{nx:e,ny:s,dx:p,originLon:c,originLat:l}=r,b=e*s,C=new Float32Array(i.buffer,t.hPtr(),b),k=new Float32Array(i.buffer,t.zbPtr(),b);return{meta:{nx:e,ny:s,dx:p,originLon:c,originLat:l},depth:new Float32Array(C),bed:new Float32Array(k)}}function j(e){const s=ie();if(!s)return;J();let p=P;if(e==="new"||!p||!v.has(p)){p=Z();const l={id:p,name:`Analyse ${v.size+1}`,meta:s.meta,depth:s.depth,bed:s.bed};v.set(p,l),P=p,f==null||f.upsertStaticLayer(l.id,l.depth,l.bed,l.meta.nx,l.meta.ny,l.meta.dx,l.meta.originLon,l.meta.originLat),D();return}const c=v.get(p);if(!se(c.meta,s.meta)){const l=Z(),b={id:l,name:`Analyse ${v.size+1}`,meta:s.meta,depth:s.depth,bed:s.bed};v.set(l,b),P=l,f==null||f.upsertStaticLayer(b.id,b.depth,b.bed,b.meta.nx,b.meta.ny,b.meta.dx,b.meta.originLon,b.meta.originLat),D();return}for(let l=0;l<c.depth.length;l++){const b=c.depth[l],C=s.depth[l];c.depth[l]=Number.isFinite(b)&&Number.isFinite(C)?Math.max(b,C):Number.isFinite(b)?b:Number.isFinite(C)?C:0}f==null||f.upsertStaticLayer(c.id,c.depth,c.bed,c.meta.nx,c.meta.ny,c.meta.dx,c.meta.originLon,c.meta.originLat),D()}function ce(){const e=P?v.get(P):null,s=e?{meta:e.meta,depth:e.depth}:ie();if(!s){n.setStatus("Kein Ergebnis zum Export vorhanden.","bi-exclamation-circle");return}const{nx:p,ny:c,dx:l,originLon:b,originLat:C}=s.meta,k=s.depth,E=111e3,H=C+c/2*l/E,q=111e3*Math.cos(H*Math.PI/180),le=l/q,ae=l/E,G=[],re=Math.max(1,Math.floor(Math.sqrt(p*c/9e3)));for(let U=0;U<c;U+=re)for(let ee=0;ee<p;ee+=re){const te=k[U*p+ee];if(!Number.isFinite(te)||te<.05)continue;const ne=b+(ee+.5)*le,de=C+(U+.5)*ae;G.push({type:"Feature",geometry:{type:"Point",coordinates:[ne,de]},properties:{depth_m:Math.round(te*1e3)/1e3,row:U,col:ee,cell_m:Math.round(l*100)/100}})}const R={type:"FeatureCollection",properties:{generatedAt:new Date().toISOString(),nx:p,ny:c,dx:l,sourceLayer:(e==null?void 0:e.name)||"current-run"},features:G},O=new Blob([JSON.stringify(R)],{type:"application/geo+json"}),_=URL.createObjectURL(O),B=document.createElement("a");B.href=_,B.download=`hydrosim-${(e==null?void 0:e.id)||"current"}-${Date.now()}.geojson`,document.body.appendChild(B),B.click(),B.remove(),setTimeout(()=>URL.revokeObjectURL(_),1e3),n.setStatus(`Export erstellt (${G.length} Features)`,"bi-download")}function oe(){P&&(f==null||f.removeStaticLayer(P),v.delete(P),P=v.keys().next().value||null,D())}function Y(){const e=h(),s=e==null?void 0:e.camera;if(!s||!window.Cesium)return!1;const p=window.Cesium.Cartographic.fromCartesian(s.positionWC);return Number.isFinite(p.height)&&p.height<=z}function K(){const e=Y();return n.setGate(e),!e&&m==="idle"&&n.setStatus(`Für HydroSim näher heranzoomen (Kamerahöhe < ${z} m).`,"bi-zoom-in"),e&&m==="idle"&&n.setStatus("Bereit — Polygon zeichnen um zu beginnen","bi-info-circle"),e}function X(){const e=h(),s=e==null?void 0:e.camera;if(!s||!window.Cesium)return 50;const c=window.Cesium.Cartographic.fromCartesian(s.positionWC).height;return Number.isFinite(c)?c<2500?20:c<5e3?30:50:50}function g(e){return Math.max(0,Math.min(1,Number.isFinite(e)?e:0))}function N(e){if(e.mode&&e.mode!=="auto")return e.mode;const s=e.volumeM3/Math.max(60,e.durationS);return s<150?"rain":s<900?"flash":"river"}function $(e){return e==="flash"?{inflow:1.2,friction:.95}:e==="river"?{inflow:.9,friction:.85}:{inflow:1,friction:1}}async function Q(e){F("sampling"),n.setStatus("Terrain wird abgetastet…","bi-hourglass-split"),n.setProgress(.05);try{const s=X();r=await ve(e,o,s,E=>n.setProgress(E*.9)),n.setProgress(1);const{heights:p,nx:c,ny:l,dx:b}=r;if(t.init(c,l,b)<0)throw new Error("WASM init failed: not enough memory for grid");i=t.memory;const k=t.scratchPtr();new Float32Array(i.buffer,k,c*l).set(p),t.setTerrain(k,c*l),setTimeout(()=>n.setProgress(null),500),F("ready"),n.setStatus(`Bereit. Grid: ${c}x${l}, dx=${b.toFixed(0)}m`,"bi-check-circle")}catch(s){a("Terrain sampling failed:",s),n.setProgress(null),F("idle"),n.setStatus("Terrain-Abfrage fehlgeschlagen: "+s.message,"bi-exclamation-triangle")}}function Ee(e,s,p,c,l,b){const C=e.reduce((_,B)=>_+B.lon,0)/e.length,k=e.reduce((_,B)=>_+B.lat,0)/e.length,E=111320,H=111320*Math.cos(k*Math.PI/180),q=Math.round((C-l)*H/c),le=Math.round((k-b)*E/c),ae=e.map(_=>_.lon),G=e.map(_=>_.lat),re=(Math.max(...ae)-Math.min(...ae))*H/c,R=(Math.max(...G)-Math.min(...G))*E/c,O=Math.max(2,Math.round(Math.min(re,R)*.25));return{cx:Math.max(O,Math.min(s-1-O,q)),cy:Math.max(O,Math.min(p-1-O,le)),radius:O}}function Ie(){const e=n.getParams(),s=N(e),p=e.measures||{},c=(o||[]).slice(0,12).map(b=>`${b.lon.toFixed(5)}:${b.lat.toFixed(5)}`).join("|");return`${r?`${r.nx}x${r.ny}@${Math.round(r.dx)}`:"nogrid"}|v=${e.volumeM3}|d=${e.durationS}|m=${s}|ml=${g(p.level).toFixed(2)}|mp=${p.pump?1:0}|md=${p.dike?1:0}|mr=${p.retention?1:0}|p=${c}`}function De(e,s,p,c,l,b,C){return new Promise(k=>{const E=()=>k(Se(e,s,p,c,l,b,C));typeof window.requestIdleCallback=="function"?window.requestIdleCallback(E,{timeout:250}):setTimeout(E,0)})}async function $e(){cancelAnimationFrame(x),x=null,F("results"),n.setProgress(null),n.setStatus("Berechne betroffene Gebäude…","bi-buildings");try{const{nx:e,ny:s,dx:p,originLon:c,originLat:l}=r,b=new Float32Array(i.buffer,t.hPtr(),e*s),C=h(),k=Ie(),E=C?ke(C):0;let H=A.get(k);if(!H&&(H=C?await De(C,b,e,s,p,c,l):[],A.set(k,H),A.size>I)){const q=A.keys().next().value;A.delete(q)}n.setImpact(H),j(n.getLayerStrategy()),E===0?n.setStatus("Fertig · keine LoD2-Gebäudelayer geladen (Impact = 0)","bi-info-circle"):n.setStatus(`Fertig · ${H.length} Gebäude betroffen`,"bi-check-circle")}catch(e){a("Impact analysis failed:",e),n.setStatus("Simulation beendet (Impact-Analyse fehlgeschlagen)","bi-exclamation-triangle")}}function fe(){if(m!=="running"||!r)return;const e=n.getParams(),s=N(e),p=$(s),c=e.measures||{},l=g(c.level),{nx:b,ny:C,dx:k,originLon:E,originLat:H}=r,q=t.maxDepth(),le=Number.isFinite(q)&&q>0?Math.min(q,4):.01,ae=Math.max(.01,le),G=Math.min(k/Math.sqrt(9.81*ae)*.45,.5),re=Math.max(1,Math.round(e.speed));let R=null,O=0;if(o&&o.length>=3){R=Ee(o,b,C,k,E,H);const ne=Math.max(1,Math.PI*R.radius*R.radius)*k*k,de=e.volumeM3/Math.max(1,e.durationS),me=Math.max(.2,1-(c.pump?.35*l:0)-(c.retention?.25*l:0)-(c.dike?.1*l:0)),ue=de*p.inflow*me;O=Math.max(0,Math.min(15e-5,ue/ne*G))}const _=1+(c.dike?.55*l:0)+(c.retention?.35*l:0)+(c.pump?.15*l:0),B=Math.max(.03,.08*p.friction*_);for(let te=0;te<re;te++){const ne=Math.max(1,Math.ceil(G/.1)),de=G/ne,me=O/ne;for(let ue=0;ue<ne;ue++)R&&t.injectSource(R.cx,R.cy,R.radius,me),t.step(de,9.81,B);if(M+=G,M>=e.durationS)break}T+=1,T%2===0&&(J(),f==null||f.update(i.buffer,t.hPtr(),t.zbPtr(),b,C,k,E,H));const U=t.maxDepth(),ee=Number.isFinite(U)&&U>=0?Math.min(U,20):0;if(n.setProgress(Math.min(1,M/e.durationS)),n.setStatus(`T = ${Math.round(M)}s · max. Tiefe ${ee.toFixed(2)} m`,"bi-droplet-fill"),M>=e.durationS){$e();return}x=requestAnimationFrame(fe)}n.onDraw(async()=>{if(m==="drawing"){y==null||y.destroy(),y=null,F("idle"),n.setStatus("Zeichnung abgebrochen.","bi-x-circle");return}if(!["idle","ready","results"].includes(m)||!K())return;if(L()!=="3D"&&!await w()){n.setStatus("Bitte zuerst in den 3D-Modus wechseln.","bi-exclamation-triangle");return}const e=h();if(!e){n.setStatus("3D-Modus aktivieren und Polygon zeichnen…","bi-pencil-square");return}F("drawing"),n.setStatus("Klicken = Punkt setzen · Doppelklick = Fertig · Rechtsklick = Fertig/Abbruch","bi-pencil-square"),y=be(e,async s=>{y=null,o=s,await Q(e)})}),n.onRun(()=>{if(!K()||!r||!t||!["ready","paused"].includes(m))return;if(m==="ready"){M=0,t.reset();const{heights:p,nx:c,ny:l}=r,b=t.scratchPtr();new Float32Array(i.buffer,b,c*l).set(p),t.setTerrain(b,c*l)}const e=N(n.getParams()),s=e==="flash"?"Sturzflut":e==="river"?"Fluss":"Starkregen";F("running"),n.setStatus(`Simulation läuft… (${s})`,"bi-play-fill"),cancelAnimationFrame(x),x=requestAnimationFrame(fe)}),n.onPause(()=>{m==="running"&&(cancelAnimationFrame(x),x=null,F("paused"),n.setStatus(`Pausiert bei T=${Math.round(M)}s`,"bi-pause-fill"))}),n.onReset(()=>{cancelAnimationFrame(x),x=null,y==null||y.destroy(),y=null,f==null||f.clear(),t.reset(),o=null,r=null,M=0,F("idle"),n.setStatus("",""),n.setProgress(null),n.setImpact([])}),n.onExport(()=>{ce()}),n.onLayerClear(()=>{oe()}),n.onLayerActiveChange(()=>{P=n.getActiveLayerId()||null}),F("idle"),K(),D();const Te=setInterval(K,800);window.HydroSim={getState:()=>m,getTerrain:()=>r,getWasm:()=>t,getScene:h,stop:()=>{cancelAnimationFrame(x),x=null,F("paused")},destroy:()=>{clearInterval(Te)}}})()})();
