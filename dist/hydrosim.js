(function(){"use strict";function oe(a){const r=new Cesium.PointPrimitiveCollection,o=new Cesium.PolylineCollection;a.scene.primitives.add(r),a.scene.primitives.add(o);let t=null,l=null;function d(n){n&&!n.isDestroyed()&&a.scene.primitives.remove(n)}function M(n){const c=Cesium.Cartographic.fromCartesian(n),i=a.scene.globe.getHeight(c),s=Number.isFinite(i)?i+.2:c.height;return Cesium.Cartesian3.fromRadians(c.longitude,c.latitude,s)}function x(n,c,i=10){const s=Cesium.Cartographic.fromCartesian(n),p=Cesium.Cartographic.fromCartesian(c),v=[];for(let g=0;g<=i;g++){const C=g/i,I=Cesium.Math.lerp(s.longitude,p.longitude,C),S=Cesium.Math.lerp(s.latitude,p.latitude,C),A=new Cesium.Cartographic(I,S),F=a.scene.globe.getHeight(A),h=Number.isFinite(F)?F+.25:Cesium.Math.lerp(s.height,p.height,C);v.push(Cesium.Cartesian3.fromRadians(I,S,h))}return v}function k(n){if(n.length<2)return[];const c=[];for(let i=0;i<n.length-1;i++){const s=x(n[i],n[i+1]);i>0&&s.shift(),c.push(...s)}return c}return{points:r,polys:o,updatePreview(n){if(o.removeAll(),d(t),d(l),t=null,l=null,n.length>=2){const c=[...n,n[0]],i=k(c);o.add({positions:i.length>0?i:c,width:2.5,material:Cesium.Material.fromType("Color",{color:Cesium.Color.fromCssColorString("#4af")}),loop:!1})}if(n.length>=3){const c=n.map(M),i=new Cesium.PolygonGeometry({polygonHierarchy:new Cesium.PolygonHierarchy(c),perPositionHeight:!0,vertexFormat:Cesium.PerInstanceColorAppearance.VERTEX_FORMAT});l=new Cesium.Primitive({geometryInstances:new Cesium.GeometryInstance({geometry:i,attributes:{color:Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.fromCssColorString("#4af").withAlpha(.22))}}),appearance:new Cesium.PerInstanceColorAppearance({translucent:!0,closed:!1}),asynchronous:!1}),a.scene.primitives.add(l)}},addPoint(n){r.add({position:n,color:Cesium.Color.fromCssColorString("#4af"),pixelSize:8,outlineColor:Cesium.Color.WHITE,outlineWidth:1})},destroy(){d(t),d(l),a.scene.primitives.remove(r),a.scene.primitives.remove(o)}}}function re(a,r){const o=[],t=a.canvas,l=oe({scene:a}),d=new Cesium.ScreenSpaceEventHandler(t);function M(i){let s=a.pickPosition(i.position);if(!s||!Cesium.defined(s)){const p=a.camera.getPickRay(i.position);s=a.globe.pick(p,a)}return s}function x(i){return i.map(s=>{const p=Cesium.Cartographic.fromCartesian(s);return{lon:Cesium.Math.toDegrees(p.longitude),lat:Cesium.Math.toDegrees(p.latitude)}})}function k(){if(o.length<3)return console.warn("[HydroSim] Need at least 3 vertices to form a polygon."),!1;const i=x(o);return d.destroy(),l.destroy(),t.style.cursor="",r(i),!0}t.style.cursor="crosshair",d.setInputAction(i=>{const s=M(i);s&&(o.push(s),l.addPoint(s),l.updatePreview(o))},Cesium.ScreenSpaceEventType.LEFT_CLICK),d.setInputAction(i=>{const s=M(i);s&&o.length>0&&Cesium.Cartesian3.distance(s,o[o.length-1])>.5&&(o.push(s),l.addPoint(s),l.updatePreview(o)),k()},Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);function n(){d.destroy(),l.destroy(),t.style.cursor=""}d.setInputAction(()=>{k()||n()},Cesium.ScreenSpaceEventType.RIGHT_CLICK),document.addEventListener("keydown",function i(s){s.key==="Escape"&&(n(),document.removeEventListener("keydown",i))});const c=d.destroy.bind(d);return d.destroy=()=>{c();try{l.destroy()}catch{}t.style.cursor=""},d}function ae(a,r){let o=1/0,t=-1/0,l=1/0,d=-1/0;for(const h of a)h.lon<o&&(o=h.lon),h.lon>t&&(t=h.lon),h.lat<l&&(l=h.lat),h.lat>d&&(d=h.lat);const M=(t-o)*.2,x=(d-l)*.2;o-=M,t+=M,l-=x,d+=x;const k=1/111e3,n=1/(111e3*Math.cos((l+d)/2*Math.PI/180)),c=r*k,i=r*n,s=Math.max(4,Math.round((d-l)/c)+1),p=Math.max(4,Math.round((t-o)/i)+1),v=Math.sqrt(120*120/(p*s)),g=Math.min(120,Math.max(4,Math.round(p*v))),C=Math.min(120,Math.max(4,Math.round(s*v))),I=(t-o)/(g-1),S=(d-l)/(C-1),A=[];for(let h=0;h<C;h++)for(let T=0;T<g;T++){const H=o+T*I,E=l+h*S;A.push(new Cesium.Cartographic(Cesium.Math.toRadians(H),Cesium.Math.toRadians(E)))}const F=S*111e3;return{grid:A,nx:g,ny:C,dx:F,minLon:o,minLat:l}}async function ce(a,r,o=50,t){const{grid:l,nx:d,ny:M,dx:x,minLon:k,minLat:n}=ae(r,o);t&&t(.05);const c=await Cesium.sampleTerrainMostDetailed(a.terrainProvider,l);t&&t(.9);const i=c.map(g=>Number.isFinite(g.height)?g.height:0),s=Math.min(...i),p=i.map(g=>g-s),v=new Float32Array(p);return t&&t(1),console.log(`[HydroSim] Terrain sampled: ${d}×${M} grid, dx=${x.toFixed(1)}m, min=${s.toFixed(1)}m`),{heights:v,nx:d,ny:M,dx:x,originLon:k,originLat:n}}const se=.01;function N(a,r,o){return a+(r-a)*o}function le(a){if(a<se)return[0,0,0,0];if(a<.5){const r=a/.5;return[N(.53,.12,r),N(.8,.31,r),N(1,.78,r),N(.35,.6,r)]}if(a<2){const r=(a-.5)/1.5;return[N(.12,0,r),N(.31,.08,r),N(.78,.39,r),N(.6,.85,r)]}return[0,.05,.3,.92]}function de(a,r,o,t,l,d,M){const x=M+t/2*l/111e3,k=111e3,n=111e3*Math.cos(x*Math.PI/180),c=l/n,i=l/k,s=[],p=[];function v(S,A,F){const h=Cesium.Cartesian3.fromDegrees(S,A,F);s.push(h.x,h.y,h.z)}for(let S=0;S<t-1;S++)for(let A=0;A<o-1;A++){const F=S*o+A,h=a[F];if(!Number.isFinite(h)||h<se)continue;const T=d+A*c,H=M+S*i,E=T+c,q=H+i,$=r[F]+h+.05;if(!Number.isFinite($))continue;v(T,H,$),v(E,H,$),v(E,q,$),v(T,H,$),v(E,q,$),v(T,q,$);const[B,j,U,K]=le(h),f=Math.round(B*255),O=Math.round(j*255),_=Math.round(U*255),Z=Math.round(K*255);for(let J=0;J<6;J++)p.push(f,O,_,Z)}if(s.length===0)return null;const g=new Float64Array(s),C=new Uint8Array(p),I=new Cesium.Geometry({attributes:{position:new Cesium.GeometryAttribute({componentDatatype:Cesium.ComponentDatatype.DOUBLE,componentsPerAttribute:3,values:g}),color:new Cesium.GeometryAttribute({componentDatatype:Cesium.ComponentDatatype.UNSIGNED_BYTE,componentsPerAttribute:4,normalize:!0,values:C})},primitiveType:Cesium.PrimitiveType.TRIANGLES,boundingSphere:Cesium.BoundingSphere.fromVertices(g)});return new Cesium.Primitive({geometryInstances:new Cesium.GeometryInstance({geometry:I}),appearance:new Cesium.PerInstanceColorAppearance({flat:!0,translucent:!0}),releaseGeometryInstances:!0,asynchronous:!1})}function ue(a){let r=null;function o(t){t&&!t.isDestroyed()&&a.primitives.remove(t)}return{update(t,l,d,M,x,k,n,c){const i=new Float32Array(t,l,M*x),s=new Float32Array(t,d,M*x),p=de(i,s,M,x,k,n,c);o(r),p&&a.primitives.add(p),r=p},clear(){o(r),r=null},destroy(){o(r),r=null}}}function me(a){const r=Cesium.Cartographic.fromCartesian(a);return{lon:Cesium.Math.toDegrees(r.longitude),lat:Cesium.Math.toDegrees(r.latitude)}}function pe(a,r,o,t,l,d,M,x){const n=111e3*Math.cos((x+r)/2*Math.PI/180),c=Math.round((a-M)*n/d),i=Math.round((r-x)*111e3/d);return c<0||c>=t||i<0||i>=l?0:o[i*t+c]||0}function he(a){return Math.max(1,Math.round(a/4))}function fe(a,r,o,t,l,d,M){var n;const x=[];let k=0;for(let c=0;c<a.primitives.length;c++){const i=a.primitives.get(c);if(!i||i.imageBasedLighting===void 0||!i.boundingSphere)continue;const s=(n=i.boundingSphere)==null?void 0:n.center;if(!s)continue;const{lon:p,lat:v}=me(s),g=pe(p,v,r,o,t,l,d,M);if(g<.05)continue;const C=i.boundingSphere.radius||10,I=he(C),S=Math.min(5,C/20),A=g*I*S;x.push({id:`tileset-${c}-${k++}`,lon:p.toFixed(5),lat:v.toFixed(5),depth:Math.round(g*100)/100,floors:I,score:Math.round(A*10)/10,label:`Gebäude ~(${p.toFixed(3)}°, ${v.toFixed(3)}°)`})}return x.sort((c,i)=>i.score-c.score),x.slice(0,20)}function ge(a){if(!(a!=null&&a.primitives))return 0;let r=0;for(let o=0;o<a.primitives.length;o++){const t=a.primitives.get(o);!t||t.imageBasedLighting===void 0||t.boundingSphere&&(r+=1)}return r}const be=`
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
  background: var(--hs-accent);
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
#hydrosim-trigger:hover { background: var(--hs-accent-2); }

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
`,ve=`
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

</div>
`;function ye(){const a=document.createElement("style");a.textContent=be,document.head.appendChild(a);const r=document.createElement("button");r.id="hydrosim-trigger",r.title="HydroSim — Hochwassersimulation",r.innerHTML='<i class="bi bi-water"></i>',document.body.appendChild(r);const o=document.createElement("div");o.id="hydrosim-panel",o.innerHTML=ve,document.body.appendChild(o);const t=f=>document.getElementById(f),l=t("hs-draw-btn"),d=t("hs-draw-label"),M=t("hs-draw-hint"),x=t("hs-run"),k=t("hs-pause"),n=t("hs-reset"),c=t("hs-status"),i=t("hs-progress"),s=t("hs-progress-bar"),p=t("hs-volume"),v=t("hs-duration"),g=t("hs-speed"),C=t("hs-mode"),I=t("hs-mode-help"),S=t("hs-vol-val"),A=t("hs-dur-val"),F=t("hs-speed-val"),h=t("hs-measure-pump"),T=t("hs-measure-dike"),H=t("hs-measure-retention"),E=t("hs-measure-level"),q=t("hs-measure-level-val"),$=t("hs-impact-section"),B=t("hs-impact-count"),j=t("hs-impact-tbody");let U="idle",K=!0;return r.addEventListener("click",()=>{o.classList.toggle("visible")}),t("hs-close").addEventListener("click",()=>{o.classList.remove("visible")}),C.addEventListener("change",()=>{I.textContent=C.value==="auto"?"Automatik wählt den Ereignistyp anhand von Volumen und Dauer.":`Manueller Modus: ${C.options[C.selectedIndex].text}`}),p.addEventListener("input",()=>{S.textContent=Number(p.value).toLocaleString("de-DE")}),v.addEventListener("input",()=>{A.textContent=v.value}),g.addEventListener("input",()=>{F.textContent=g.value}),E.addEventListener("input",()=>{q.textContent=E.value}),{panel:o,trigger:r,getParams(){return{volumeM3:Number(p.value),durationMin:Number(v.value),durationS:Number(v.value)*60,speed:Number(g.value),mode:C.value||"auto",measures:{pump:!!h.checked,dike:!!T.checked,retention:!!H.checked,level:Number(E.value)/100}}},onDraw(f){l.addEventListener("click",f)},onRun(f){x.addEventListener("click",f)},onPause(f){k.addEventListener("click",f)},onReset(f){n.addEventListener("click",f)},setState(f){U=f,l.disabled=!K||["drawing","sampling","running"].includes(f),x.disabled=!K||!["ready","paused"].includes(f),k.disabled=f!=="running",n.disabled=f==="sampling",f==="drawing"?(d.textContent="Zeichnen…",l.classList.add("active"),M.style.display="block"):(d.textContent="Polygon zeichnen",l.classList.remove("active"),M.style.display="none"),f==="idle"&&$.classList.remove("visible"),f==="results"&&$.classList.add("visible")},setGate(f){K=!!f,this.setState(U)},setStatus(f,O="bi-info-circle"){c.innerHTML=f?`<i class="bi ${O}"></i> ${f}`:""},setProgress(f){f===null?(i.style.display="none",s.style.width="0%"):(i.style.display="block",s.style.width=`${Math.round(f*100)}%`)},setImpact(f){if(!f||f.length===0){B.textContent="0",j.innerHTML='<tr><td colspan="3" style="color:#607d8b;text-align:center">Keine Gebäude betroffen</td></tr>';return}B.textContent=f.length;const O=f[0].score;j.innerHTML=f.slice(0,10).map(_=>`<tr>
          <td><span class="hs-score-bar" style="width:${Math.round(_.score/O*60)}px"></span>${_.score}</td>
          <td>${_.depth} m</td>
          <td style="font-size:0.65rem">${_.lon}°<br>${_.lat}°</td>
        </tr>`).join("")}}}(async function(){const r=(...e)=>console.log("[HydroSim]",...e),o=(...e)=>console.error("[HydroSim]",...e);let t=null,l=null;function d(){var e,u,b,m;return((m=(b=(u=(e=window.mapCollection)==null?void 0:e.getMap)==null?void 0:u.call(e,"3D"))==null?void 0:b.getCesiumScene)==null?void 0:m.call(b))??null}function M(){var u,b,m,y,w,P;const e=(y=(m=(b=(u=document.getElementById("masterportal-root"))==null?void 0:u.__vue_app__)==null?void 0:b.config)==null?void 0:m.globalProperties)==null?void 0:y.$store;return((P=(w=e==null?void 0:e.state)==null?void 0:w.Maps)==null?void 0:P.mode)??null}async function x(){var u,b,m,y,w,P;const e=(y=(m=(b=(u=document.getElementById("masterportal-root"))==null?void 0:u.__vue_app__)==null?void 0:b.config)==null?void 0:m.globalProperties)==null?void 0:y.$store;if(!e)return!1;if(((P=(w=e.state)==null?void 0:w.Maps)==null?void 0:P.mode)==="3D")return!0;try{return await e.dispatch("Maps/activateMap3d"),!0}catch{try{return await e.dispatch("Maps/changeMapMode","3D"),!0}catch{return!1}}}async function k(){return new Promise(e=>{const u=setInterval(()=>{window.Cesium&&d()&&(clearInterval(u),e())},500)})}try{const e=`/hydrosim.wasm?v=${Date.now()}`;let u;try{u=await WebAssembly.instantiateStreaming(fetch(e,{cache:"no-store"}),{env:{abort(b,m,y,w){o(`WASM abort at ${m}:${y}:${w}`,b)}}})}catch{const y=await(await fetch(e,{cache:"no-store"})).arrayBuffer();u=await WebAssembly.instantiate(y,{env:{abort(w,P,L,D){o(`WASM abort at ${P}:${L}:${D}`,w)}}})}t=u.instance.exports,l=t.memory,r("WASM loaded.")}catch(e){o("WASM load failed:",e)}await k();const n=ye();if(n.setState("idle"),!t){n.setStatus("WASM konnte nicht geladen werden — Simulation deaktiviert","bi-exclamation-triangle");return}let c="idle",i=null,s=null,p=null,v=null,g=null,C=0,I=0;const S=new Map,A=10,F=8e3;function h(e){c=e,n.setState(e),r("State ->",e)}function T(){if(!v){const e=d();e&&(v=ue(e))}}function H(){const e=d(),u=e==null?void 0:e.camera;if(!u||!window.Cesium)return!1;const b=window.Cesium.Cartographic.fromCartesian(u.positionWC);return Number.isFinite(b.height)&&b.height<=F}function E(){const e=H();return n.setGate(e),!e&&c==="idle"&&n.setStatus(`Für HydroSim näher heranzoomen (Kamerahöhe < ${F} m).`,"bi-zoom-in"),e&&c==="idle"&&n.setStatus("Bereit — Polygon zeichnen um zu beginnen","bi-info-circle"),e}function q(){const e=d(),u=e==null?void 0:e.camera;if(!u||!window.Cesium)return 50;const m=window.Cesium.Cartographic.fromCartesian(u.positionWC).height;return Number.isFinite(m)?m<2500?20:m<5e3?30:50:50}function $(e){return Math.max(0,Math.min(1,Number.isFinite(e)?e:0))}function B(e){if(e.mode&&e.mode!=="auto")return e.mode;const u=e.volumeM3/Math.max(60,e.durationS);return u<150?"rain":u<900?"flash":"river"}function j(e){return e==="flash"?{inflow:1.2,friction:.95}:e==="river"?{inflow:.9,friction:.85}:{inflow:1,friction:1}}async function U(e){h("sampling"),n.setStatus("Terrain wird abgetastet…","bi-hourglass-split"),n.setProgress(.05);try{const u=q();s=await ce(e,i,u,D=>n.setProgress(D*.9)),n.setProgress(1);const{heights:b,nx:m,ny:y,dx:w}=s;if(t.init(m,y,w)<0)throw new Error("WASM init failed: not enough memory for grid");l=t.memory;const L=t.scratchPtr();new Float32Array(l.buffer,L,m*y).set(b),t.setTerrain(L,m*y),setTimeout(()=>n.setProgress(null),500),h("ready"),n.setStatus(`Bereit. Grid: ${m}x${y}, dx=${w.toFixed(0)}m`,"bi-check-circle")}catch(u){o("Terrain sampling failed:",u),n.setProgress(null),h("idle"),n.setStatus("Terrain-Abfrage fehlgeschlagen: "+u.message,"bi-exclamation-triangle")}}function K(e,u,b,m,y,w){const P=e.reduce((R,Y)=>R+Y.lon,0)/e.length,L=e.reduce((R,Y)=>R+Y.lat,0)/e.length,D=111320,z=111320*Math.cos(L*Math.PI/180),V=Math.round((P-y)*z/m),ee=Math.round((L-w)*D/m),Q=e.map(R=>R.lon),X=e.map(R=>R.lat),te=(Math.max(...Q)-Math.min(...Q))*z/m,G=(Math.max(...X)-Math.min(...X))*D/m,W=Math.max(2,Math.round(Math.min(te,G)*.25));return{cx:Math.max(W,Math.min(u-1-W,V)),cy:Math.max(W,Math.min(b-1-W,ee)),radius:W}}function f(){const e=n.getParams(),u=B(e),b=e.measures||{},m=(i||[]).slice(0,12).map(w=>`${w.lon.toFixed(5)}:${w.lat.toFixed(5)}`).join("|");return`${s?`${s.nx}x${s.ny}@${Math.round(s.dx)}`:"nogrid"}|v=${e.volumeM3}|d=${e.durationS}|m=${u}|ml=${$(b.level).toFixed(2)}|mp=${b.pump?1:0}|md=${b.dike?1:0}|mr=${b.retention?1:0}|p=${m}`}function O(e,u,b,m,y,w,P){return new Promise(L=>{const D=()=>L(fe(e,u,b,m,y,w,P));typeof window.requestIdleCallback=="function"?window.requestIdleCallback(D,{timeout:250}):setTimeout(D,0)})}async function _(){cancelAnimationFrame(g),g=null,h("results"),n.setProgress(null),n.setStatus("Berechne betroffene Gebäude…","bi-buildings");try{const{nx:e,ny:u,dx:b,originLon:m,originLat:y}=s,w=new Float32Array(l.buffer,t.hPtr(),e*u),P=d(),L=f(),D=P?ge(P):0;let z=S.get(L);if(!z&&(z=P?await O(P,w,e,u,b,m,y):[],S.set(L,z),S.size>A)){const V=S.keys().next().value;S.delete(V)}n.setImpact(z),D===0?n.setStatus("Fertig · keine LoD2-Gebäudelayer geladen (Impact = 0)","bi-info-circle"):n.setStatus(`Fertig · ${z.length} Gebäude betroffen`,"bi-check-circle")}catch(e){o("Impact analysis failed:",e),n.setStatus("Simulation beendet (Impact-Analyse fehlgeschlagen)","bi-exclamation-triangle")}}function Z(){if(c!=="running"||!s)return;const e=n.getParams(),u=B(e),b=j(u),m=e.measures||{},y=$(m.level),{nx:w,ny:P,dx:L,originLon:D,originLat:z}=s,V=t.maxDepth(),ee=Number.isFinite(V)&&V>0?Math.min(V,4):.01,Q=Math.max(.01,ee),X=Math.min(L/Math.sqrt(9.81*Q)*.45,.5),te=Math.max(1,Math.round(e.speed));let G=null,W=0;if(i&&i.length>=3){G=K(i,w,P,L,D,z);const Ce=Math.max(1,Math.PI*G.radius*G.radius)*L*L,we=e.volumeM3/Math.max(1,e.durationS),Me=Math.max(.2,1-(m.pump?.35*y:0)-(m.retention?.25*y:0)-(m.dike?.1*y:0)),Se=we*b.inflow*Me;W=Math.max(0,Math.min(2e-4,Se/Ce*X))}const R=1+(m.dike?.55*y:0)+(m.retention?.35*y:0)+(m.pump?.15*y:0),Y=Math.max(.02,.06*b.friction*R);for(let ie=0;ie<te&&(G&&t.injectSource(G.cx,G.cy,G.radius,W),t.step(X,9.81,Y),C+=X,!(C>=e.durationS));ie++);I+=1,I%2===0&&(T(),v==null||v.update(l.buffer,t.hPtr(),t.zbPtr(),w,P,L,D,z));const ne=t.maxDepth(),xe=Number.isFinite(ne)&&ne>=0?Math.min(ne,20):0;if(n.setProgress(Math.min(1,C/e.durationS)),n.setStatus(`T = ${Math.round(C)}s · max. Tiefe ${xe.toFixed(2)} m`,"bi-droplet-fill"),C>=e.durationS){_();return}g=requestAnimationFrame(Z)}n.onDraw(async()=>{if(c==="drawing"){p==null||p.destroy(),p=null,h("idle"),n.setStatus("Zeichnung abgebrochen.","bi-x-circle");return}if(!["idle","ready","results"].includes(c)||!E())return;if(M()!=="3D"&&!await x()){n.setStatus("Bitte zuerst in den 3D-Modus wechseln.","bi-exclamation-triangle");return}const e=d();if(!e){n.setStatus("3D-Modus aktivieren und Polygon zeichnen…","bi-pencil-square");return}h("drawing"),n.setStatus("Klicken = Punkt setzen · Doppelklick = Fertig · Rechtsklick = Fertig/Abbruch","bi-pencil-square"),p=re(e,async u=>{p=null,i=u,await U(e)})}),n.onRun(()=>{if(!E()||!s||!t||!["ready","paused"].includes(c))return;if(c==="ready"){C=0,t.reset();const{heights:b,nx:m,ny:y}=s,w=t.scratchPtr();new Float32Array(l.buffer,w,m*y).set(b),t.setTerrain(w,m*y)}const e=B(n.getParams()),u=e==="flash"?"Sturzflut":e==="river"?"Fluss":"Starkregen";h("running"),n.setStatus(`Simulation läuft… (${u})`,"bi-play-fill"),cancelAnimationFrame(g),g=requestAnimationFrame(Z)}),n.onPause(()=>{c==="running"&&(cancelAnimationFrame(g),g=null,h("paused"),n.setStatus(`Pausiert bei T=${Math.round(C)}s`,"bi-pause-fill"))}),n.onReset(()=>{cancelAnimationFrame(g),g=null,p==null||p.destroy(),p=null,v==null||v.clear(),t.reset(),i=null,s=null,C=0,h("idle"),n.setStatus("",""),n.setProgress(null),n.setImpact([])}),h("idle"),E();const J=setInterval(E,800);window.HydroSim={getState:()=>c,getTerrain:()=>s,getWasm:()=>t,getScene:d,stop:()=>{cancelAnimationFrame(g),g=null,h("paused")},destroy:()=>{clearInterval(J)}}})()})();
