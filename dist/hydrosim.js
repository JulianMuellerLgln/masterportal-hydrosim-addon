(function(){"use strict";function q(d){const i=new Cesium.PointPrimitiveCollection,n=new Cesium.PolylineCollection;return d.scene.primitives.add(i),d.scene.primitives.add(n),{points:i,polys:n,updatePreview(t){if(n.removeAll(),t.length>=2){const l=[...t,t[0]];n.add({positions:l,width:2.5,material:Cesium.Material.fromType("Color",{color:Cesium.Color.fromCssColorString("#4af")}),loop:!1})}},addPoint(t){i.add({position:t,color:Cesium.Color.fromCssColorString("#4af"),pixelSize:8,outlineColor:Cesium.Color.WHITE,outlineWidth:1})},destroy(){d.scene.primitives.remove(i),d.scene.primitives.remove(n)}}}function K(d,i){const n=[],t=d.canvas,l=q({scene:d}),p=new Cesium.ScreenSpaceEventHandler(t);function x(a){let r=d.pickPosition(a.position);if(!r||!Cesium.defined(r)){const h=d.camera.getPickRay(a.position);r=d.globe.pick(h,d)}return r}function y(a){return a.map(r=>{const h=Cesium.Cartographic.fromCartesian(r);return{lon:Cesium.Math.toDegrees(h.longitude),lat:Cesium.Math.toDegrees(h.latitude)}})}function L(){if(n.length<3)return console.warn("[HydroSim] Need at least 3 vertices to form a polygon."),!1;const a=y(n);return p.destroy(),l.destroy(),t.style.cursor="",i(a),!0}t.style.cursor="crosshair",p.setInputAction(a=>{const r=x(a);r&&(n.push(r),l.addPoint(r),l.updatePreview(n))},Cesium.ScreenSpaceEventType.LEFT_CLICK),p.setInputAction(a=>{const r=x(a);r&&n.length>0&&Cesium.Cartesian3.distance(r,n[n.length-1])>.5&&(n.push(r),l.addPoint(r),l.updatePreview(n)),L()},Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);function s(){p.destroy(),l.destroy(),t.style.cursor=""}p.setInputAction(()=>{L()||s()},Cesium.ScreenSpaceEventType.RIGHT_CLICK),document.addEventListener("keydown",function a(r){r.key==="Escape"&&(s(),document.removeEventListener("keydown",a))});const b=p.destroy.bind(p);return p.destroy=()=>{b();try{l.destroy()}catch{}t.style.cursor=""},p}function O(d,i){let n=1/0,t=-1/0,l=1/0,p=-1/0;for(const v of d)v.lon<n&&(n=v.lon),v.lon>t&&(t=v.lon),v.lat<l&&(l=v.lat),v.lat>p&&(p=v.lat);const x=(t-n)*.2,y=(p-l)*.2;n-=x,t+=x,l-=y,p+=y;const L=1/111e3,s=1/(111e3*Math.cos((l+p)/2*Math.PI/180)),b=i*L,a=i*s,r=Math.max(4,Math.round((p-l)/b)+1),h=Math.max(4,Math.round((t-n)/a)+1),g=Math.sqrt(120*120/(h*r)),f=Math.min(120,Math.max(4,Math.round(h*g))),S=Math.min(120,Math.max(4,Math.round(r*g))),M=(t-n)/(f-1),A=(p-l)/(S-1),k=[];for(let v=0;v<S;v++)for(let o=0;o<f;o++){const e=n+o*M,c=l+v*A;k.push(new Cesium.Cartographic(Cesium.Math.toRadians(e),Cesium.Math.toRadians(c)))}const I=A*111e3;return{grid:k,nx:f,ny:S,dx:I,minLon:n,minLat:l}}async function j(d,i,n=50,t){const{grid:l,nx:p,ny:x,dx:y,minLon:L,minLat:s}=O(i,n);t&&t(.05);const b=await Cesium.sampleTerrainMostDetailed(d.terrainProvider,l);t&&t(.9);const a=b.map(f=>Number.isFinite(f.height)?f.height:0),r=Math.min(...a),h=a.map(f=>f-r),g=new Float32Array(h);return t&&t(1),console.log(`[HydroSim] Terrain sampled: ${p}×${x} grid, dx=${y.toFixed(1)}m, min=${r.toFixed(1)}m`),{heights:g,nx:p,ny:x,dx:y,originLon:L,originLat:s}}const N=.01;function F(d,i,n){return d+(i-d)*n}function V(d){if(d<N)return[0,0,0,0];if(d<.5){const i=d/.5;return[F(.53,.12,i),F(.8,.31,i),F(1,.78,i),F(.35,.6,i)]}if(d<2){const i=(d-.5)/1.5;return[F(.12,0,i),F(.31,.08,i),F(.78,.39,i),F(.6,.85,i)]}return[0,.05,.3,.92]}function U(d,i,n,t,l,p,x){const y=x+t/2*l/111e3,L=111e3,s=111e3*Math.cos(y*Math.PI/180),b=l/s,a=l/L,r=[],h=[];function g(A,k,I){const v=Cesium.Cartesian3.fromDegrees(A,k,I);r.push(v.x,v.y,v.z)}for(let A=0;A<t-1;A++)for(let k=0;k<n-1;k++){const I=A*n+k,v=d[I];if(v<N)continue;const o=p+k*b,e=x+A*a,c=o+b,m=e+a,u=i[I]+v+.05;g(o,e,u),g(c,e,u),g(c,m,u),g(o,e,u),g(c,m,u),g(o,m,u);const[w,P,C,D]=V(v),$=Math.round(w*255),E=Math.round(P*255),_=Math.round(C*255),H=Math.round(D*255);for(let T=0;T<6;T++)h.push($,E,_,H)}if(r.length===0)return null;const f=new Float64Array(r),S=new Uint8Array(h),M=new Cesium.Geometry({attributes:{position:new Cesium.GeometryAttribute({componentDatatype:Cesium.ComponentDatatype.DOUBLE,componentsPerAttribute:3,values:f}),color:new Cesium.GeometryAttribute({componentDatatype:Cesium.ComponentDatatype.UNSIGNED_BYTE,componentsPerAttribute:4,normalize:!0,values:S})},primitiveType:Cesium.PrimitiveType.TRIANGLES,boundingSphere:Cesium.BoundingSphere.fromVertices(f)});return new Cesium.Primitive({geometryInstances:new Cesium.GeometryInstance({geometry:M}),appearance:new Cesium.PerInstanceColorAppearance({flat:!0,translucent:!0}),releaseGeometryInstances:!0,asynchronous:!1})}function Y(d){let i=null;function n(t){t&&!t.isDestroyed()&&d.primitives.remove(t)}return{update(t,l,p,x,y,L,s,b){const a=new Float32Array(t,l,x*y),r=new Float32Array(t,p,x*y),h=U(a,r,x,y,L,s,b);n(i),h&&d.primitives.add(h),i=h},clear(){n(i),i=null},destroy(){n(i),i=null}}}function Z(d){const i=Cesium.Cartographic.fromCartesian(d);return{lon:Cesium.Math.toDegrees(i.longitude),lat:Cesium.Math.toDegrees(i.latitude)}}function X(d,i,n,t,l,p,x,y){const s=111e3*Math.cos((y+i)/2*Math.PI/180),b=Math.round((d-x)*s/p),a=Math.round((i-y)*111e3/p);return b<0||b>=t||a<0||a>=l?0:n[a*t+b]||0}function J(d){return Math.max(1,Math.round(d/4))}function Q(d,i,n,t,l,p,x){var s;const y=[];let L=0;for(let b=0;b<d.primitives.length;b++){const a=d.primitives.get(b);if(!a||a.imageBasedLighting===void 0||!a.boundingSphere)continue;const r=(s=a.boundingSphere)==null?void 0:s.center;if(!r)continue;const{lon:h,lat:g}=Z(r),f=X(h,g,i,n,t,l,p,x);if(f<.05)continue;const S=a.boundingSphere.radius||10,M=J(S),A=Math.min(5,S/20),k=f*M*A;y.push({id:`tileset-${b}-${L++}`,lon:h.toFixed(5),lat:g.toFixed(5),depth:Math.round(f*100)/100,floors:M,score:Math.round(k*10)/10,label:`Gebäude ~(${h.toFixed(3)}°, ${g.toFixed(3)}°)`})}return y.sort((b,a)=>a.score-b.score),y.slice(0,20)}const tt=`
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
`,et=`
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
`;function nt(){const d=document.createElement("style");d.textContent=tt,document.head.appendChild(d);const i=document.createElement("button");i.id="hydrosim-trigger",i.title="HydroSim — Hochwassersimulation",i.innerHTML='<i class="bi bi-water"></i>',document.body.appendChild(i);const n=document.createElement("div");n.id="hydrosim-panel",n.innerHTML=et,document.body.appendChild(n);const t=o=>document.getElementById(o),l=t("hs-draw-btn"),p=t("hs-draw-label"),x=t("hs-draw-hint"),y=t("hs-run"),L=t("hs-pause"),s=t("hs-reset"),b=t("hs-status"),a=t("hs-progress"),r=t("hs-progress-bar"),h=t("hs-volume"),g=t("hs-duration"),f=t("hs-speed"),S=t("hs-vol-val"),M=t("hs-dur-val"),A=t("hs-speed-val"),k=t("hs-impact-section"),I=t("hs-impact-count"),v=t("hs-impact-tbody");i.addEventListener("click",()=>{n.classList.toggle("visible")}),t("hs-close").addEventListener("click",()=>{n.classList.remove("visible")});for(const o of document.querySelectorAll(".hs-event-btn"))o.addEventListener("click",()=>{document.querySelectorAll(".hs-event-btn").forEach(e=>e.classList.remove("active")),o.classList.add("active")});return h.addEventListener("input",()=>{S.textContent=Number(h.value).toLocaleString("de-DE")}),g.addEventListener("input",()=>{M.textContent=g.value}),f.addEventListener("input",()=>{A.textContent=f.value}),{panel:n,trigger:i,getParams(){const o=document.querySelector(".hs-event-btn.active");return{volumeM3:Number(h.value),durationMin:Number(g.value),durationS:Number(g.value)*60,speed:Number(f.value),eventType:(o==null?void 0:o.dataset.event)||"rain"}},onDraw(o){l.addEventListener("click",o)},onRun(o){y.addEventListener("click",o)},onPause(o){L.addEventListener("click",o)},onReset(o){s.addEventListener("click",o)},setState(o){l.disabled=["drawing","sampling","running"].includes(o),y.disabled=!["ready","paused"].includes(o),L.disabled=o!=="running",s.disabled=o==="sampling",o==="drawing"?(p.textContent="Zeichnen…",l.classList.add("active"),x.style.display="block"):(p.textContent="Polygon zeichnen",l.classList.remove("active"),x.style.display="none"),o==="idle"&&k.classList.remove("visible"),o==="results"&&k.classList.add("visible")},setStatus(o,e="bi-info-circle"){b.innerHTML=o?`<i class="bi ${e}"></i> ${o}`:""},setProgress(o){o===null?(a.style.display="none",r.style.width="0%"):(a.style.display="block",r.style.width=`${Math.round(o*100)}%`)},setImpact(o){if(!o||o.length===0){I.textContent="0",v.innerHTML='<tr><td colspan="3" style="color:#607d8b;text-align:center">Keine Gebäude betroffen</td></tr>';return}I.textContent=o.length;const e=o[0].score;v.innerHTML=o.slice(0,10).map(c=>`<tr>
          <td><span class="hs-score-bar" style="width:${Math.round(c.score/e*60)}px"></span>${c.score}</td>
          <td>${c.depth} m</td>
          <td style="font-size:0.65rem">${c.lon}°<br>${c.lat}°</td>
        </tr>`).join("")}}}(async function(){const i=(...e)=>console.log("[HydroSim]",...e),n=(...e)=>console.error("[HydroSim]",...e);let t=null,l=null;function p(){var e,c,m,u;return((u=(m=(c=(e=window.mapCollection)==null?void 0:e.getMap)==null?void 0:c.call(e,"3D"))==null?void 0:m.getCesiumScene)==null?void 0:u.call(m))??null}function x(){var c,m,u,w,P,C;const e=(w=(u=(m=(c=document.getElementById("masterportal-root"))==null?void 0:c.__vue_app__)==null?void 0:m.config)==null?void 0:u.globalProperties)==null?void 0:w.$store;return((C=(P=e==null?void 0:e.state)==null?void 0:P.Maps)==null?void 0:C.mode)??null}async function y(){var c,m,u,w,P,C;const e=(w=(u=(m=(c=document.getElementById("masterportal-root"))==null?void 0:c.__vue_app__)==null?void 0:m.config)==null?void 0:u.globalProperties)==null?void 0:w.$store;if(!e)return!1;if(((C=(P=e.state)==null?void 0:P.Maps)==null?void 0:C.mode)==="3D")return!0;try{return await e.dispatch("Maps/activateMap3d"),!0}catch{try{return await e.dispatch("Maps/changeMapMode","3D"),!0}catch{return!1}}}async function L(){return new Promise(e=>{const c=setInterval(()=>{window.Cesium&&p()&&(clearInterval(c),e())},500)})}try{let e;try{e=await WebAssembly.instantiateStreaming(fetch("/hydrosim.wasm"),{env:{abort(c,m,u,w){n(`WASM abort at ${m}:${u}:${w}`,c)}}})}catch{const u=await(await fetch("/hydrosim.wasm")).arrayBuffer();e=await WebAssembly.instantiate(u,{env:{abort(w,P,C,D){n(`WASM abort at ${P}:${C}:${D}`,w)}}})}t=e.instance.exports,l=t.memory,i("WASM loaded.")}catch(e){n("WASM load failed:",e)}await L();const s=nt();if(s.setState("idle"),!t){s.setStatus("WASM konnte nicht geladen werden — Simulation deaktiviert","bi-exclamation-triangle");return}let b="idle",a=null,r=null,h=null,g=null,f=null,S=0;function M(e){b=e,s.setState(e),i("State ->",e)}function A(){if(!g){const e=p();e&&(g=Y(e))}}async function k(e){M("sampling"),s.setStatus("Terrain wird abgetastet…","bi-hourglass-split"),s.setProgress(.05);try{r=await j(e,a,50,D=>s.setProgress(D*.9)),s.setProgress(1);const{heights:c,nx:m,ny:u,dx:w}=r;if(t.init(m,u,w)<0)throw new Error("WASM init failed: not enough memory for grid");l=t.memory;const C=t.scratchPtr();new Float32Array(l.buffer,C,m*u).set(c),t.setTerrain(C,m*u),setTimeout(()=>s.setProgress(null),500),M("ready"),s.setStatus(`Bereit. Grid: ${m}x${u}, dx=${w.toFixed(0)}m`,"bi-check-circle")}catch(c){n("Terrain sampling failed:",c),s.setProgress(null),M("idle"),s.setStatus("Terrain-Abfrage fehlgeschlagen: "+c.message,"bi-exclamation-triangle")}}function I(e,c,m,u,w,P){const C=e.reduce((z,R)=>z+R.lon,0)/e.length,D=e.reduce((z,R)=>z+R.lat,0)/e.length,$=111320,E=111320*Math.cos(D*Math.PI/180),_=Math.round((C-w)*E/u),H=Math.round((D-P)*$/u),T=e.map(z=>z.lon),G=e.map(z=>z.lat),W=(Math.max(...T)-Math.min(...T))*E/u,st=(Math.max(...G)-Math.min(...G))*$/u,B=Math.max(2,Math.round(Math.min(W,st)*.25));return{cx:Math.max(B,Math.min(c-1-B,_)),cy:Math.max(B,Math.min(m-1-B,H)),radius:B}}function v(){cancelAnimationFrame(f),f=null,M("results"),s.setProgress(null),s.setStatus("Berechne betroffene Gebäude…","bi-buildings");try{const{nx:e,ny:c,dx:m,originLon:u,originLat:w}=r,P=new Float32Array(l.buffer,t.hPtr(),e*c),C=p(),D=C?Q(C,P,e,c,m,u,w):[];s.setImpact(D),s.setStatus(`Fertig · ${D.length} Gebäude betroffen`,"bi-check-circle")}catch(e){n("Impact analysis failed:",e),s.setStatus("Simulation beendet (Impact-Analyse fehlgeschlagen)","bi-exclamation-triangle")}}function o(){if(b!=="running"||!r)return;const e=s.getParams(),{nx:c,ny:m,dx:u,originLon:w,originLat:P}=r,C=Math.max(.01,t.maxDepth()),D=Math.min(u/Math.sqrt(9.81*C)*.45,4),$=Math.max(1,Math.round(e.speed));let E=null,_=0;if(a&&a.length>=3){E=I(a,c,m,u,w,P);const G=Math.max(1,Math.PI*E.radius*E.radius)*u*u,W=e.volumeM3/e.durationS;_=Math.max(0,W/G*D)}for(let T=0;T<$&&(E&&t.injectSource(E.cx,E.cy,E.radius,_),t.step(D,9.81,.025),S+=D,!(S>=e.durationS));T++);A(),g==null||g.update(l.buffer,t.hPtr(),t.zbPtr(),c,m,u,w,P);const H=t.maxDepth();if(s.setProgress(Math.min(1,S/e.durationS)),s.setStatus(`T = ${Math.round(S)}s · max. Tiefe ${H.toFixed(2)} m`,"bi-droplet-fill"),S>=e.durationS){v();return}f=requestAnimationFrame(o)}s.onDraw(async()=>{if(b==="drawing"){h==null||h.destroy(),h=null,M("idle"),s.setStatus("Zeichnung abgebrochen.","bi-x-circle");return}if(!["idle","ready","results"].includes(b))return;if(x()!=="3D"&&!await y()){s.setStatus("Bitte zuerst in den 3D-Modus wechseln.","bi-exclamation-triangle");return}const e=p();if(!e){s.setStatus("3D-Modus aktivieren und Polygon zeichnen…","bi-pencil-square");return}M("drawing"),s.setStatus("Klicken = Punkt setzen · Doppelklick = Fertig · Rechtsklick = Fertig/Abbruch","bi-pencil-square"),h=K(e,async c=>{h=null,a=c,await k(e)})}),s.onRun(()=>{if(!(!r||!t)&&["ready","paused"].includes(b)){if(b==="ready"){S=0,t.reset();const{heights:e,nx:c,ny:m}=r,u=t.scratchPtr();new Float32Array(l.buffer,u,c*m).set(e),t.setTerrain(u,c*m)}M("running"),s.setStatus("Simulation läuft…","bi-play-fill"),cancelAnimationFrame(f),f=requestAnimationFrame(o)}}),s.onPause(()=>{b==="running"&&(cancelAnimationFrame(f),f=null,M("paused"),s.setStatus(`Pausiert bei T=${Math.round(S)}s`,"bi-pause-fill"))}),s.onReset(()=>{cancelAnimationFrame(f),f=null,h==null||h.destroy(),h=null,g==null||g.clear(),t.reset(),a=null,r=null,S=0,M("idle"),s.setStatus("",""),s.setProgress(null),s.setImpact([])}),M("idle"),s.setStatus("Bereit — Polygon zeichnen um zu beginnen","bi-info-circle"),window.HydroSim={getState:()=>b,getTerrain:()=>r,getWasm:()=>t,getScene:p,stop:()=>{cancelAnimationFrame(f),f=null,M("paused")}}})()})();
