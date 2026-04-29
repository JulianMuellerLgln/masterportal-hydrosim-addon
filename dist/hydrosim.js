(function(){"use strict";function N(a){const r=new Cesium.PointPrimitiveCollection,o=new Cesium.PolylineCollection;return a.scene.primitives.add(r),a.scene.primitives.add(o),{points:r,polys:o,updatePreview(e){if(o.removeAll(),e.length>=2){const c=[...e,e[0]];o.add({positions:c,width:2.5,material:Cesium.Material.fromType("Color",{color:Cesium.Color.fromCssColorString("#4af")}),loop:!1})}},addPoint(e){r.add({position:e,color:Cesium.Color.fromCssColorString("#4af"),pixelSize:8,outlineColor:Cesium.Color.WHITE,outlineWidth:1})},destroy(){a.scene.primitives.remove(r),a.scene.primitives.remove(o)}}}function _(a,r){const o=[],e=a.canvas,c=N({scene:a}),d=new Cesium.ScreenSpaceEventHandler(e);function v(s){let l=a.pickPosition(s.position);if(!l||!Cesium.defined(l)){const m=a.camera.getPickRay(s.position);l=a.globe.pick(m,a)}return l}function i(s){return s.map(l=>{const m=Cesium.Cartographic.fromCartesian(l);return{lon:Cesium.Math.toDegrees(m.longitude),lat:Cesium.Math.toDegrees(m.latitude)}})}function g(){if(o.length<3)return console.warn("[HydroSim] Need at least 3 vertices to form a polygon."),!1;const s=i(o);return d.destroy(),c.destroy(),e.style.cursor="",r(s),!0}e.style.cursor="crosshair",d.setInputAction(s=>{const l=v(s);l&&(o.push(l),c.addPoint(l),c.updatePreview(o))},Cesium.ScreenSpaceEventType.LEFT_CLICK),d.setInputAction(s=>{const l=v(s);l&&o.length>0&&Cesium.Cartesian3.distance(l,o[o.length-1])>.5&&(o.push(l),c.addPoint(l),c.updatePreview(o)),g()},Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);function f(){d.destroy(),c.destroy(),e.style.cursor=""}d.setInputAction(()=>{g()||f()},Cesium.ScreenSpaceEventType.RIGHT_CLICK),document.addEventListener("keydown",function s(l){l.key==="Escape"&&(f(),document.removeEventListener("keydown",s))});const h=d.destroy.bind(d);return d.destroy=()=>{h();try{c.destroy()}catch{}e.style.cursor=""},d}function q(a,r){let o=1/0,e=-1/0,c=1/0,d=-1/0;for(const t of a)t.lon<o&&(o=t.lon),t.lon>e&&(e=t.lon),t.lat<c&&(c=t.lat),t.lat>d&&(d=t.lat);const v=(e-o)*.2,i=(d-c)*.2;o-=v,e+=v,c-=i,d+=i;const g=1/111e3,f=1/(111e3*Math.cos((c+d)/2*Math.PI/180)),h=r*g,s=r*f,l=Math.max(4,Math.round((d-c)/h)+1),m=Math.max(4,Math.round((e-o)/s)+1),y=Math.sqrt(120*120/(m*l)),b=Math.min(120,Math.max(4,Math.round(m*y))),C=Math.min(120,Math.max(4,Math.round(l*y))),x=(e-o)/(b-1),A=(d-c)/(C-1),S=[];for(let t=0;t<C;t++)for(let n=0;n<b;n++){const u=o+n*x,p=c+t*A;S.push(new Cesium.Cartographic(Cesium.Math.toRadians(u),Cesium.Math.toRadians(p)))}const P=A*111e3;return{grid:S,nx:b,ny:C,dx:P,minLon:o,minLat:c}}async function K(a,r,o=50,e){const{grid:c,nx:d,ny:v,dx:i,minLon:g,minLat:f}=q(r,o);e&&e(.05);const h=await Cesium.sampleTerrainMostDetailed(a.terrainProvider,c);e&&e(.9);const s=h.map(b=>Number.isFinite(b.height)?b.height:0),l=Math.min(...s),m=s.map(b=>b-l),y=new Float32Array(m);return e&&e(1),console.log(`[HydroSim] Terrain sampled: ${d}×${v} grid, dx=${i.toFixed(1)}m, min=${l.toFixed(1)}m`),{heights:y,nx:d,ny:v,dx:i,originLon:g,originLat:f}}const R=.05;function E(a,r,o){return a+(r-a)*o}function O(a){if(a<R)return[0,0,0,0];if(a<.5){const r=a/.5;return[E(.53,.12,r),E(.8,.31,r),E(1,.78,r),E(.35,.6,r)]}if(a<2){const r=(a-.5)/1.5;return[E(.12,0,r),E(.31,.08,r),E(.78,.39,r),E(.6,.85,r)]}return[0,.05,.3,.92]}function j(a,r,o,e,c,d){const v=d+o/2*e/111e3,i=111e3,g=111e3*Math.cos(v*Math.PI/180),f=e/g,h=e/i,s=[],l=[];for(let C=0;C<o-1;C++)for(let x=0;x<r-1;x++){const A=a[C*r+x];if(A<R)continue;const S=c+x*f,P=d+C*h,t=S+f,n=P+h,u=.3;s.push(...Cesium.Cartesian3.fromDegrees(S,P,u).toArray(),...Cesium.Cartesian3.fromDegrees(t,P,u).toArray(),...Cesium.Cartesian3.fromDegrees(t,n,u).toArray()),s.push(...Cesium.Cartesian3.fromDegrees(S,P,u).toArray(),...Cesium.Cartesian3.fromDegrees(t,n,u).toArray(),...Cesium.Cartesian3.fromDegrees(S,n,u).toArray());const[p,w,D,L]=O(A),M=Math.round(p*255),I=Math.round(w*255),F=Math.round(D*255),k=Math.round(L*255);for(let $=0;$<6;$++)l.push(M,I,F,k)}if(s.length===0)return null;const m=new Float64Array(s),y=new Uint8Array(l),b=new Cesium.Geometry({attributes:{position:new Cesium.GeometryAttribute({componentDatatype:Cesium.ComponentDatatype.DOUBLE,componentsPerAttribute:3,values:m}),color:new Cesium.GeometryAttribute({componentDatatype:Cesium.ComponentDatatype.UNSIGNED_BYTE,componentsPerAttribute:4,normalize:!0,values:y})},primitiveType:Cesium.PrimitiveType.TRIANGLES,boundingSphere:Cesium.BoundingSphere.fromVertices(Array.from({length:s.length/3},(C,x)=>new Cesium.Cartesian3(s[x*3],s[x*3+1],s[x*3+2])))});return new Cesium.Primitive({geometryInstances:new Cesium.GeometryInstance({geometry:b}),appearance:new Cesium.PerInstanceColorAppearance({flat:!0,translucent:!0}),releaseGeometryInstances:!0,asynchronous:!1})}function V(a){let r=null;function o(e){e&&!e.isDestroyed()&&a.primitives.remove(e)}return{update(e,c,d,v,i,g,f){const h=new Float32Array(e,c,d*v),s=j(h,d,v,i,g,f);o(r),s&&a.primitives.add(s),r=s},clear(){o(r),r=null},destroy(){o(r),r=null}}}function U(a){const r=Cesium.Cartographic.fromCartesian(a);return{lon:Cesium.Math.toDegrees(r.longitude),lat:Cesium.Math.toDegrees(r.latitude)}}function Y(a,r,o,e,c,d,v,i){const f=111e3*Math.cos((i+r)/2*Math.PI/180),h=Math.round((a-v)*f/d),s=Math.round((r-i)*111e3/d);return h<0||h>=e||s<0||s>=c?0:o[s*e+h]||0}function Z(a){return Math.max(1,Math.round(a/4))}function X(a,r,o,e,c,d,v){var f;const i=[];let g=0;for(let h=0;h<a.primitives.length;h++){const s=a.primitives.get(h);if(!s||s.imageBasedLighting===void 0||!s.boundingSphere)continue;const l=(f=s.boundingSphere)==null?void 0:f.center;if(!l)continue;const{lon:m,lat:y}=U(l),b=Y(m,y,r,o,e,c,d,v);if(b<.05)continue;const C=s.boundingSphere.radius||10,x=Z(C),A=Math.min(5,C/20),S=b*x*A;i.push({id:`tileset-${h}-${g++}`,lon:m.toFixed(5),lat:y.toFixed(5),depth:Math.round(b*100)/100,floors:x,score:Math.round(S*10)/10,label:`Gebäude ~(${m.toFixed(3)}°, ${y.toFixed(3)}°)`})}return i.sort((h,s)=>s.score-h.score),i.slice(0,20)}const J=`
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
`,Q=`
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
`;function ee(){const a=document.createElement("style");a.textContent=J,document.head.appendChild(a);const r=document.createElement("button");r.id="hydrosim-trigger",r.title="HydroSim — Hochwassersimulation",r.innerHTML='<i class="bi bi-water"></i>',document.body.appendChild(r);const o=document.createElement("div");o.id="hydrosim-panel",o.innerHTML=Q,document.body.appendChild(o);const e=n=>document.getElementById(n),c=e("hs-draw-btn"),d=e("hs-draw-label"),v=e("hs-draw-hint"),i=e("hs-run"),g=e("hs-pause"),f=e("hs-reset"),h=e("hs-status"),s=e("hs-progress"),l=e("hs-progress-bar"),m=e("hs-volume"),y=e("hs-duration"),b=e("hs-speed"),C=e("hs-vol-val"),x=e("hs-dur-val"),A=e("hs-speed-val"),S=e("hs-impact-section"),P=e("hs-impact-count"),t=e("hs-impact-tbody");r.addEventListener("click",()=>{o.classList.toggle("visible")}),e("hs-close").addEventListener("click",()=>{o.classList.remove("visible")});for(const n of document.querySelectorAll(".hs-event-btn"))n.addEventListener("click",()=>{document.querySelectorAll(".hs-event-btn").forEach(u=>u.classList.remove("active")),n.classList.add("active")});return m.addEventListener("input",()=>{C.textContent=Number(m.value).toLocaleString("de-DE")}),y.addEventListener("input",()=>{x.textContent=y.value}),b.addEventListener("input",()=>{A.textContent=b.value}),{panel:o,trigger:r,getParams(){const n=document.querySelector(".hs-event-btn.active");return{volumeM3:Number(m.value),durationMin:Number(y.value),durationS:Number(y.value)*60,speed:Number(b.value),eventType:(n==null?void 0:n.dataset.event)||"rain"}},onDraw(n){c.addEventListener("click",n)},onRun(n){i.addEventListener("click",n)},onPause(n){g.addEventListener("click",n)},onReset(n){f.addEventListener("click",n)},setState(n){c.disabled=["drawing","sampling","running"].includes(n),i.disabled=!["ready","paused"].includes(n),g.disabled=n!=="running",f.disabled=n==="sampling",n==="drawing"?(d.textContent="Zeichnen…",c.classList.add("active"),v.style.display="block"):(d.textContent="Polygon zeichnen",c.classList.remove("active"),v.style.display="none"),n==="idle"&&S.classList.remove("visible"),n==="results"&&S.classList.add("visible")},setStatus(n,u="bi-info-circle"){h.innerHTML=n?`<i class="bi ${u}"></i> ${n}`:""},setProgress(n){n===null?(s.style.display="none",l.style.width="0%"):(s.style.display="block",l.style.width=`${Math.round(n*100)}%`)},setImpact(n){if(!n||n.length===0){P.textContent="0",t.innerHTML='<tr><td colspan="3" style="color:#607d8b;text-align:center">Keine Gebäude betroffen</td></tr>';return}P.textContent=n.length;const u=n[0].score;t.innerHTML=n.slice(0,10).map(p=>`<tr>
          <td><span class="hs-score-bar" style="width:${Math.round(p.score/u*60)}px"></span>${p.score}</td>
          <td>${p.depth} m</td>
          <td style="font-size:0.65rem">${p.lon}°<br>${p.lat}°</td>
        </tr>`).join("")}}}(async function(){const r=(...t)=>console.log("[HydroSim]",...t),o=(...t)=>console.error("[HydroSim]",...t);let e=null,c=null;function d(){var t,n,u,p;return((p=(u=(n=(t=window.mapCollection)==null?void 0:t.getMap)==null?void 0:n.call(t,"3D"))==null?void 0:u.getCesiumScene)==null?void 0:p.call(u))??null}async function v(){return new Promise(t=>{const n=setInterval(()=>{window.Cesium&&d()&&(clearInterval(n),t())},500)})}try{let t;try{t=await WebAssembly.instantiateStreaming(fetch("/hydrosim.wasm"),{env:{abort(n,u,p,w){o(`WASM abort at ${u}:${p}:${w}`,n)}}})}catch{const p=await(await fetch("/hydrosim.wasm")).arrayBuffer();t=await WebAssembly.instantiate(p,{env:{abort(w,D,L,M){o(`WASM abort at ${D}:${L}:${M}`,w)}}})}e=t.instance.exports,c=e.memory,r("WASM loaded.")}catch(t){o("WASM load failed:",t)}await v();const i=ee();if(i.setState("idle"),!e){i.setStatus("WASM konnte nicht geladen werden — Simulation deaktiviert","bi-exclamation-triangle");return}let g="idle",f=null,h=null,s=null,l=null,m=null,y=0;function b(t){g=t,i.setState(t),r("State ->",t)}function C(){if(!l){const t=d();t&&(l=V(t))}}async function x(t){b("sampling"),i.setStatus("Terrain wird abgetastet…","bi-hourglass-split"),i.setProgress(.05);try{h=await K(t,f,50,M=>i.setProgress(M*.9)),i.setProgress(1);const{heights:n,nx:u,ny:p,dx:w}=h;if(e.init(u,p,w)<0)throw new Error("WASM init failed: not enough memory for grid");c=e.memory;const L=e.scratchPtr();new Float32Array(c.buffer,L,u*p).set(n),e.setTerrain(L,u*p),setTimeout(()=>i.setProgress(null),500),b("ready"),i.setStatus(`Bereit. Grid: ${u}x${p}, dx=${w.toFixed(0)}m`,"bi-check-circle")}catch(n){o("Terrain sampling failed:",n),i.setProgress(null),b("idle"),i.setStatus("Terrain-Abfrage fehlgeschlagen: "+n.message,"bi-exclamation-triangle")}}function A(t,n,u,p,w,D){const L=t.reduce((T,B)=>T+B.lon,0)/t.length,M=t.reduce((T,B)=>T+B.lat,0)/t.length,I=111320,F=111320*Math.cos(M*Math.PI/180),k=Math.round((L-w)*F/p),$=Math.round((M-D)*I/p),H=t.map(T=>T.lon),G=t.map(T=>T.lat),W=(Math.max(...H)-Math.min(...H))*F/p,te=(Math.max(...G)-Math.min(...G))*I/p,z=Math.max(2,Math.round(Math.min(W,te)*.25));return{cx:Math.max(z,Math.min(n-1-z,k)),cy:Math.max(z,Math.min(u-1-z,$)),radius:z}}function S(){cancelAnimationFrame(m),m=null,b("results"),i.setProgress(null),i.setStatus("Berechne betroffene Gebäude…","bi-buildings");try{const{nx:t,ny:n,dx:u,originLon:p,originLat:w}=h,D=new Float32Array(c.buffer,e.hPtr(),t*n),L=d(),M=L?X(L,D,t,n,u,p,w):[];i.setImpact(M),i.setStatus(`Fertig · ${M.length} Gebäude betroffen`,"bi-check-circle")}catch(t){o("Impact analysis failed:",t),i.setStatus("Simulation beendet (Impact-Analyse fehlgeschlagen)","bi-exclamation-triangle")}}function P(){if(g!=="running"||!h)return;const t=i.getParams(),{nx:n,ny:u,dx:p,originLon:w,originLat:D}=h,L=Math.max(.01,e.maxDepth()),M=Math.min(p/Math.sqrt(9.81*L)*.45,4),I=Math.max(1,Math.round(t.speed));if(f&&f.length>=3){const k=A(f,n,u,p,w,D),H=Math.max(1,Math.PI*k.radius*k.radius)*p*p,W=t.volumeM3/t.durationS/H*M;e.injectSource(k.cx,k.cy,k.radius,Math.max(0,W))}for(let k=0;k<I&&(e.step(M,9.81,.025),y+=M,!(y>=t.durationS));k++);C(),l==null||l.update(c.buffer,e.hPtr(),n,u,p,w,D);const F=e.maxDepth();if(i.setProgress(Math.min(1,y/t.durationS)),i.setStatus(`T = ${Math.round(y)}s · max. Tiefe ${F.toFixed(2)} m`,"bi-droplet-fill"),y>=t.durationS){S();return}m=requestAnimationFrame(P)}i.onDraw(()=>{if(g==="drawing"){s==null||s.destroy(),s=null,b("idle"),i.setStatus("Zeichnung abgebrochen.","bi-x-circle");return}if(!["idle","ready","results"].includes(g))return;const t=d();if(!t){i.setStatus("3D-Modus aktivieren und Polygon zeichnen…","bi-pencil-square");return}b("drawing"),i.setStatus("Klicken = Punkt setzen · Doppelklick = Fertig · Rechtsklick = Fertig/Abbruch","bi-pencil-square"),s=_(t,async n=>{s=null,f=n,await x(t)})}),i.onRun(()=>{if(!(!h||!e)&&["ready","paused"].includes(g)){if(g==="ready"){y=0,e.reset();const{heights:t,nx:n,ny:u}=h,p=e.scratchPtr();new Float32Array(c.buffer,p,n*u).set(t),e.setTerrain(p,n*u)}b("running"),i.setStatus("Simulation läuft…","bi-play-fill"),cancelAnimationFrame(m),m=requestAnimationFrame(P)}}),i.onPause(()=>{g==="running"&&(cancelAnimationFrame(m),m=null,b("paused"),i.setStatus(`Pausiert bei T=${Math.round(y)}s`,"bi-pause-fill"))}),i.onReset(()=>{cancelAnimationFrame(m),m=null,s==null||s.destroy(),s=null,l==null||l.clear(),e.reset(),f=null,h=null,y=0,b("idle"),i.setStatus("",""),i.setProgress(null),i.setImpact([])}),b("idle"),i.setStatus("Bereit — Polygon zeichnen um zu beginnen","bi-info-circle"),window.HydroSim={getState:()=>g,getTerrain:()=>h,getWasm:()=>e,getScene:d,stop:()=>{cancelAnimationFrame(m),m=null,b("paused")}}})()})();
