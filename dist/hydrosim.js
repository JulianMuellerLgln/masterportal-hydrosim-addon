(function(){"use strict";function K(u){const i=new Cesium.PointPrimitiveCollection,a=new Cesium.PolylineCollection;return u.scene.primitives.add(i),u.scene.primitives.add(a),{points:i,polys:a,updatePreview(n){if(a.removeAll(),n.length>=2){const t=[...n,n[0]];a.add({positions:t,width:2.5,material:Cesium.Material.fromType("Color",{color:Cesium.Color.fromCssColorString("#4af")}),loop:!1})}},addPoint(n){i.add({position:n,color:Cesium.Color.fromCssColorString("#4af"),pixelSize:8,outlineColor:Cesium.Color.WHITE,outlineWidth:1})},destroy(){u.scene.primitives.remove(i),u.scene.primitives.remove(a)}}}function V(u,i){const a=[],n=u.canvas,t=K({scene:u}),l=new Cesium.ScreenSpaceEventHandler(n);function s(p){let d=u.pickPosition(p.position);if(!d||!Cesium.defined(d)){const o=u.camera.getPickRay(p.position);d=u.globe.pick(o,u)}return d}n.style.cursor="crosshair",l.setInputAction(p=>{const d=s(p);d&&(a.push(d),t.addPoint(d),t.updatePreview(a))},Cesium.ScreenSpaceEventType.LEFT_CLICK),l.setInputAction(p=>{if(a.length>0&&a.pop(),t.addPoint(a[a.length-1]),a.length<3){console.warn("[HydroSim] Need at least 3 vertices to form a polygon.");return}const d=a.map(o=>{const C=Cesium.Cartographic.fromCartesian(o);return{lon:Cesium.Math.toDegrees(C.longitude),lat:Cesium.Math.toDegrees(C.latitude)}});l.destroy(),t.destroy(),n.style.cursor="",i(d)},Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);function h(){l.destroy(),t.destroy(),n.style.cursor=""}l.setInputAction(h,Cesium.ScreenSpaceEventType.RIGHT_CLICK),document.addEventListener("keydown",function p(d){d.key==="Escape"&&(h(),document.removeEventListener("keydown",p))});const v=l.destroy.bind(l);return l.destroy=()=>{v();try{t.destroy()}catch{}n.style.cursor=""},l}function U(u,i){let a=1/0,n=-1/0,t=1/0,l=-1/0;for(const w of u)w.lon<a&&(a=w.lon),w.lon>n&&(n=w.lon),w.lat<t&&(t=w.lat),w.lat>l&&(l=w.lat);const s=(n-a)*.2,h=(l-t)*.2;a-=s,n+=s,t-=h,l+=h;const v=1/111e3,p=1/(111e3*Math.cos((t+l)/2*Math.PI/180)),d=i*v,o=i*p,C=Math.max(4,Math.round((l-t)/d)+1),g=Math.max(4,Math.round((n-a)/o)+1),f=Math.sqrt(120*120/(g*C)),S=Math.min(120,Math.max(4,Math.round(g*f))),k=Math.min(120,Math.max(4,Math.round(C*f))),D=(n-a)/(S-1),$=(l-t)/(k-1),A=[];for(let w=0;w<k;w++)for(let r=0;r<S;r++){const e=a+r*D,c=t+w*$;A.push(new Cesium.Cartographic(Cesium.Math.toRadians(e),Cesium.Math.toRadians(c)))}const T=$*111e3;return{grid:A,nx:S,ny:k,dx:T,minLon:a,minLat:t}}async function Z(u,i,a=50,n){const{grid:t,nx:l,ny:s,dx:h,minLon:v,minLat:p}=U(i,a);n&&n(.05);const d=await Cesium.sampleTerrainMostDetailed(u.terrainProvider,t);n&&n(.9);const o=d.map(S=>Number.isFinite(S.height)?S.height:0),C=Math.min(...o),g=o.map(S=>S-C),f=new Float32Array(g);return n&&n(1),console.log(`[HydroSim] Terrain sampled: ${l}×${s} grid, dx=${h.toFixed(1)}m, min=${C.toFixed(1)}m`),{heights:f,nx:l,ny:s,dx:h,originLon:v,originLat:p}}const O=.05;function B(u,i,a){return u+(i-u)*a}function Y(u){if(u<O)return[0,0,0,0];if(u<.5){const i=u/.5;return[B(.53,.12,i),B(.8,.31,i),B(1,.78,i),B(.35,.6,i)]}if(u<2){const i=(u-.5)/1.5;return[B(.12,0,i),B(.31,.08,i),B(.78,.39,i),B(.6,.85,i)]}return[0,.05,.3,.92]}function J(u,i,a,n,t,l){const s=l+a/2*n/111e3,h=111e3,v=111e3*Math.cos(s*Math.PI/180),p=n/v,d=n/h,o=[],C=[];for(let k=0;k<a-1;k++)for(let D=0;D<i-1;D++){const $=u[k*i+D];if($<O)continue;const A=t+D*p,T=l+k*d,w=A+p,r=T+d,e=.3;o.push(...Cesium.Cartesian3.fromDegrees(A,T,e).toArray(),...Cesium.Cartesian3.fromDegrees(w,T,e).toArray(),...Cesium.Cartesian3.fromDegrees(w,r,e).toArray()),o.push(...Cesium.Cartesian3.fromDegrees(A,T,e).toArray(),...Cesium.Cartesian3.fromDegrees(w,r,e).toArray(),...Cesium.Cartesian3.fromDegrees(A,r,e).toArray());const[c,b,m,x]=Y($),y=Math.round(c*255),M=Math.round(b*255),P=Math.round(m*255),I=Math.round(x*255);for(let E=0;E<6;E++)C.push(y,M,P,I)}if(o.length===0)return null;const g=new Float64Array(o),f=new Uint8Array(C),S=new Cesium.Geometry({attributes:{position:new Cesium.GeometryAttribute({componentDatatype:Cesium.ComponentDatatype.DOUBLE,componentsPerAttribute:3,values:g}),color:new Cesium.GeometryAttribute({componentDatatype:Cesium.ComponentDatatype.UNSIGNED_BYTE,componentsPerAttribute:4,normalize:!0,values:f})},primitiveType:Cesium.PrimitiveType.TRIANGLES,boundingSphere:Cesium.BoundingSphere.fromVertices(Array.from({length:o.length/3},(k,D)=>new Cesium.Cartesian3(o[D*3],o[D*3+1],o[D*3+2])))});return new Cesium.Primitive({geometryInstances:new Cesium.GeometryInstance({geometry:S}),appearance:new Cesium.PerInstanceColorAppearance({flat:!0,translucent:!0}),releaseGeometryInstances:!0,asynchronous:!1})}function j(u){let i=null;function a(n){n&&!n.isDestroyed()&&u.primitives.remove(n)}return{update(n,t,l,s,h,v,p){const d=new Float32Array(n,t,l*s),o=J(d,l,s,h,v,p);a(i),o&&u.primitives.add(o),i=o},clear(){a(i),i=null},destroy(){a(i),i=null}}}function Q(u){const i=Cesium.Cartographic.fromCartesian(u);return{lon:Cesium.Math.toDegrees(i.longitude),lat:Cesium.Math.toDegrees(i.latitude)}}function X(u,i,a,n,t,l,s,h){const p=111e3*Math.cos((h+i)/2*Math.PI/180),d=Math.round((u-s)*p/l),o=Math.round((i-h)*111e3/l);return d<0||d>=n||o<0||o>=t?0:a[o*n+d]||0}function tt(u){return Math.max(1,Math.round(u/4))}function et(u,i,a,n,t,l,s){var p;const h=[];let v=0;for(let d=0;d<u.primitives.length;d++){const o=u.primitives.get(d);if(!o||o.imageBasedLighting===void 0||!o.boundingSphere)continue;const C=(p=o.boundingSphere)==null?void 0:p.center;if(!C)continue;const{lon:g,lat:f}=Q(C),S=X(g,f,i,a,n,t,l,s);if(S<.05)continue;const k=o.boundingSphere.radius||10,D=tt(k),$=Math.min(5,k/20),A=S*D*$;h.push({id:`tileset-${d}-${v++}`,lon:g.toFixed(5),lat:f.toFixed(5),depth:Math.round(S*100)/100,floors:D,score:Math.round(A*10)/10,label:`Gebäude ~(${g.toFixed(3)}°, ${f.toFixed(3)}°)`})}return h.sort((d,o)=>o.score-d.score),h.slice(0,20)}const nt=`
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
`,it=`
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
`;function st(){const u=document.createElement("style");u.textContent=nt,document.head.appendChild(u);const i=document.createElement("button");i.id="hydrosim-trigger",i.title="HydroSim — Hochwassersimulation",i.innerHTML='<i class="bi bi-water"></i>',document.body.appendChild(i);const a=document.createElement("div");a.id="hydrosim-panel",a.innerHTML=it,document.body.appendChild(a);const n=r=>document.getElementById(r),t=n("hs-draw-btn"),l=n("hs-draw-label"),s=n("hs-draw-hint"),h=n("hs-run"),v=n("hs-pause"),p=n("hs-reset"),d=n("hs-status"),o=n("hs-progress"),C=n("hs-progress-bar"),g=n("hs-volume"),f=n("hs-duration"),S=n("hs-speed"),k=n("hs-vol-val"),D=n("hs-dur-val"),$=n("hs-speed-val"),A=n("hs-impact-section"),T=n("hs-impact-count"),w=n("hs-impact-tbody");i.addEventListener("click",()=>{a.classList.toggle("visible")}),n("hs-close").addEventListener("click",()=>{a.classList.remove("visible")});for(const r of document.querySelectorAll(".hs-event-btn"))r.addEventListener("click",()=>{document.querySelectorAll(".hs-event-btn").forEach(e=>e.classList.remove("active")),r.classList.add("active")});return g.addEventListener("input",()=>{k.textContent=Number(g.value).toLocaleString("de-DE")}),f.addEventListener("input",()=>{D.textContent=f.value}),S.addEventListener("input",()=>{$.textContent=S.value}),{panel:a,trigger:i,getParams(){const r=document.querySelector(".hs-event-btn.active");return{volumeM3:Number(g.value),durationMin:Number(f.value),durationS:Number(f.value)*60,speed:Number(S.value),eventType:(r==null?void 0:r.dataset.event)||"rain"}},onDraw(r){t.addEventListener("click",r)},onRun(r){h.addEventListener("click",r)},onPause(r){v.addEventListener("click",r)},onReset(r){p.addEventListener("click",r)},setState(r){t.disabled=["drawing","sampling","running"].includes(r),h.disabled=!["ready","paused"].includes(r),v.disabled=r!=="running",p.disabled=r==="sampling",r==="drawing"?(l.textContent="Zeichnen…",t.classList.add("active"),s.style.display="block"):(l.textContent="Polygon zeichnen",t.classList.remove("active"),s.style.display="none"),r==="idle"&&A.classList.remove("visible"),r==="results"&&A.classList.add("visible")},setStatus(r,e="bi-info-circle"){d.innerHTML=r?`<i class="bi ${e}"></i> ${r}`:""},setProgress(r){r===null?(o.style.display="none",C.style.width="0%"):(o.style.display="block",C.style.width=`${Math.round(r*100)}%`)},setImpact(r){if(!r||r.length===0){T.textContent="0",w.innerHTML='<tr><td colspan="3" style="color:#607d8b;text-align:center">Keine Gebäude betroffen</td></tr>';return}T.textContent=r.length;const e=r[0].score;w.innerHTML=r.slice(0,10).map(c=>`<tr>
          <td><span class="hs-score-bar" style="width:${Math.round(c.score/e*60)}px"></span>${c.score}</td>
          <td>${c.depth} m</td>
          <td style="font-size:0.65rem">${c.lon}°<br>${c.lat}°</td>
        </tr>`).join("")}}}(async function(){const i=(...e)=>console.log("[HydroSim]",...e),a=(...e)=>console.error("[HydroSim]",...e);async function n(){return new Promise(e=>{const c=setInterval(()=>{window.Cesium&&window.mapCollection&&window.mapCollection.getMap("3D")&&(clearInterval(c),e(window.mapCollection.getMap("3D").getCesiumScene()))},500)})}i("WASM loading…");let t,l;try{t=(await WebAssembly.instantiateStreaming(fetch("/hydrosim.wasm"),{env:{abort(c,b,m,x){a(`WASM abort at ${b}:${m}:${x}`,c)}}})).instance.exports,l=t.memory,i("WASM loaded. Waiting for Cesium…")}catch(e){a("Failed to load WASM:",e),t=null,l=null}await n(),i("Cesium scene ready. Initialising panel…");const s=st();if(s.setState("idle"),!t){s.setStatus("WASM konnte nicht geladen werden — Simulation deaktiviert","bi-exclamation-triangle");return}let h="idle",v=null,p=null,d=null,o=null,C=null,g=0;function f(e){h=e,s.setState(e),i("State →",e)}s.onDraw(()=>{var c,b,m,x,y;if(h==="drawing"){d==null||d.destroy(),f("idle"),s.setStatus("Zeichnung abgebrochen.","bi-x-circle");return}f("drawing"),s.setStatus("3D-Modus aktivieren und Polygon zeichnen…","bi-pencil-square");const e=(x=(m=(b=(c=document.getElementById("masterportal-root"))==null?void 0:c.__vue_app__)==null?void 0:b.config)==null?void 0:m.globalProperties)==null?void 0:x.$store;e&&((y=e.state.Maps)==null?void 0:y.mode)!=="3D"&&e.dispatch("Maps/toggleMapMode").catch(()=>{}),setTimeout(()=>{var P,I;const M=(I=(P=window.mapCollection)==null?void 0:P.getMap("3D"))==null?void 0:I.getCesiumScene();if(!M){s.setStatus("3D-Szene nicht verfügbar. Bitte 3D-Modus aktivieren.","bi-exclamation-triangle"),f("idle");return}d=V(M,async E=>{v=E,d=null,await S(M)})},800)});async function S(e){f("sampling"),s.setStatus("Terrain wird abgetastet…","bi-hourglass-split"),s.setProgress(.05);try{p=await Z(e,v,50,P=>s.setProgress(P*.9)),s.setProgress(1);const{heights:c,nx:b,ny:m,dx:x}=p,y=t.init(b,m,x),M=t.scratchPtr();new Float32Array(l.buffer,M,b*m).set(c),t.setTerrain(M,b*m),setTimeout(()=>s.setProgress(null),600),f("ready"),s.setStatus(`Bereit. Grid: ${b}×${m}, dx=${x.toFixed(0)}m`,"bi-check-circle")}catch(c){a("Terrain sampling failed:",c),s.setProgress(null),s.setStatus("Terrain-Abfrage fehlgeschlagen: "+c.message,"bi-exclamation-triangle"),f("idle")}}s.onRun(()=>{var e,c;if(!(!p||!t)){if(h==="ready"){g=0,t.reset();const{heights:b,nx:m,ny:x}=p,y=t.scratchPtr();new Float32Array(l.buffer,y,m*x).set(b),t.setTerrain(y,m*x)}if(f("running"),s.setStatus("Simulation läuft…","bi-play-fill"),!o){const b=(c=(e=window.mapCollection)==null?void 0:e.getMap("3D"))==null?void 0:c.getCesiumScene();b&&(o=j(b))}k()}}),s.onPause(()=>{cancelAnimationFrame(C),f("paused"),s.setStatus(`Pausiert bei T=${Math.round(g)}s`,"bi-pause-fill")}),s.onReset(()=>{cancelAnimationFrame(C),d==null||d.destroy(),o==null||o.clear(),t&&t.reset(),v=null,p=null,g=0,f("idle"),s.setStatus("",""),s.setProgress(null),s.setImpact([])});function k(e=0){if(h!=="running")return;const{durationS:c,speed:b}=s.getParams(),{nx:m,ny:x,dx:y,originLon:M,originLat:P}=p,I=Math.max(.01,t.maxDepth()),E=y/Math.sqrt(9.81*I),F=Math.min(E*.45,5),W=Math.max(1,Math.round(b));if(v&&v.length>2){const{centerIx:z,centerIy:H,radius:L}=getSourceцентр(v,m,x,y,M,P),_=s.getParams(),R=Math.PI*L*L,q=_.volumeM3/_.durationS*F/(R*y*y);t.injectSource(z,H,L,q)}for(let z=0;z<W&&(t.step(F,9.81,.025),g+=F,!(g>=c));z++);const G=t.hPtr();o==null||o.update(l.buffer,G,m,x,y,M,P);const N=t.maxDepth();if(s.setStatus(`T = ${T(g)} · max ${N.toFixed(2)} m`,"bi-droplet-fill"),g>=c){w();return}C=requestAnimationFrame(k)}function D(e,c,b,m,x,y){const M=e.reduce((L,_)=>L+_.lon,0)/e.length,P=e.reduce((L,_)=>L+_.lat,0)/e.length,I=111e3,E=111e3*Math.cos(P*Math.PI/180),F=Math.round((M-x)*E/m),W=Math.round((P-y)*I/m),G=Math.max(...e.map(L=>L.lon))-Math.min(...e.map(L=>L.lon)),N=Math.max(...e.map(L=>L.lat))-Math.min(...e.map(L=>L.lat)),z=Math.min(G*E/m,N*I/m),H=Math.max(1,Math.round(z*.3));return{centerIx:Math.max(H,Math.min(c-1-H,F)),centerIy:Math.max(H,Math.min(b-1-H,W)),radius:H}}const $=D;function A(e=0){if(h!=="running")return;const{durationS:c,speed:b}=s.getParams(),{nx:m,ny:x,dx:y,originLon:M,originLat:P}=p,I=Math.max(.01,t.maxDepth()),E=y/Math.sqrt(9.81*I),F=Math.min(E*.45,5),W=Math.max(1,Math.round(b));if(v&&v.length>2){const{centerIx:z,centerIy:H,radius:L}=$(v,m,x,y,M,P),_=s.getParams(),R=Math.max(1,Math.PI*L*L),q=_.volumeM3/_.durationS*F/(R*y*y);t.injectSource(z,H,L,Math.max(0,q))}for(let z=0;z<W&&(t.step(F,9.81,.025),g+=F,!(g>=c));z++);const G=t.hPtr();o==null||o.update(l.buffer,G,m,x,y,M,P);const N=t.maxDepth();if(s.setStatus(`T = ${T(g)} · max ${N.toFixed(2)} m`,"bi-droplet-fill"),g>=c){w();return}C=requestAnimationFrame(A)}Object.defineProperty(window,"__hs_tickLoop",{value:A,writable:!0}),window.__hs_tick=A;function T(e){return e<60?`${Math.round(e)}s`:e<3600?`${Math.floor(e/60)}min ${Math.round(e%60)}s`:`${Math.floor(e/3600)}h ${Math.floor(e%3600/60)}min`}async function w(){var E,F;f("results"),s.setStatus("Analyse…","bi-search");const{nx:e,ny:c,dx:b,originLon:m,originLat:x}=p,y=t.hPtr(),M=new Float32Array(l.buffer,y,e*c),P=(F=(E=window.mapCollection)==null?void 0:E.getMap("3D"))==null?void 0:F.getCesiumScene(),I=P?et(P,M,e,c,b,m,x):[];s.setImpact(I),s.setStatus(`Fertig: T=${T(g)}, ${I.length} Gebäude betroffen`,"bi-check-circle-fill"),i("Simulation complete.",I.length,"buildings impacted.")}const r=document.getElementById("hs-run");if(r){const e=r.cloneNode(!0);r.parentNode.replaceChild(e,r),e.addEventListener("click",()=>{var c,b;if(!(!p||!t)){if(h==="ready"){g=0,t.reset();const{heights:m,nx:x,ny:y}=p,M=t.scratchPtr();new Float32Array(l.buffer,M,x*y).set(m),t.setTerrain(M,x*y)}if(f("running"),s.setStatus("Simulation läuft…","bi-play-fill"),!o){const m=(b=(c=window.mapCollection)==null?void 0:c.getMap("3D"))==null?void 0:b.getCesiumScene();m&&(o=j(m))}cancelAnimationFrame(C),C=requestAnimationFrame(A)}})}window.HydroSim={getState:()=>h,getTerrain:()=>p,getWasm:()=>t,getScene:()=>{var e,c;return(c=(e=window.mapCollection)==null?void 0:e.getMap("3D"))==null?void 0:c.getCesiumScene()},forceStep:(e=1)=>{for(let c=0;c<e;c++)t==null||t.step(1,9.81,.025)}},i("Ready. Wave button → bottom left corner.")})()})();
