(function(){"use strict";function ee(d){const r=new Cesium.PointPrimitiveCollection,o=new Cesium.PolylineCollection;d.scene.primitives.add(r),d.scene.primitives.add(o);let t=null,l=null;function u(n){n&&!n.isDestroyed()&&d.scene.primitives.remove(n)}function x(n){const c=Cesium.Cartographic.fromCartesian(n),i=d.scene.globe.getHeight(c),s=Number.isFinite(i)?i+.2:c.height;return Cesium.Cartesian3.fromRadians(c.longitude,c.latitude,s)}function v(n,c,i=10){const s=Cesium.Cartographic.fromCartesian(n),h=Cesium.Cartographic.fromCartesian(c),y=[];for(let g=0;g<=i;g++){const C=g/i,E=Cesium.Math.lerp(s.longitude,h.longitude,C),M=Cesium.Math.lerp(s.latitude,h.latitude,C),k=new Cesium.Cartographic(E,M),I=d.scene.globe.getHeight(k),f=Number.isFinite(I)?I+.25:Cesium.Math.lerp(s.height,h.height,C);y.push(Cesium.Cartesian3.fromRadians(E,M,f))}return y}function S(n){if(n.length<2)return[];const c=[];for(let i=0;i<n.length-1;i++){const s=v(n[i],n[i+1]);i>0&&s.shift(),c.push(...s)}return c}return{points:r,polys:o,updatePreview(n){if(o.removeAll(),u(t),u(l),t=null,l=null,n.length>=2){const c=[...n,n[0]],i=S(c);o.add({positions:i.length>0?i:c,width:2.5,material:Cesium.Material.fromType("Color",{color:Cesium.Color.fromCssColorString("#4af")}),loop:!1})}if(n.length>=3){const c=n.map(x),i=new Cesium.PolygonGeometry({polygonHierarchy:new Cesium.PolygonHierarchy(c),perPositionHeight:!0,vertexFormat:Cesium.PerInstanceColorAppearance.VERTEX_FORMAT});l=new Cesium.Primitive({geometryInstances:new Cesium.GeometryInstance({geometry:i,attributes:{color:Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.fromCssColorString("#4af").withAlpha(.22))}}),appearance:new Cesium.PerInstanceColorAppearance({translucent:!0,closed:!1}),asynchronous:!1}),d.scene.primitives.add(l)}},addPoint(n){r.add({position:n,color:Cesium.Color.fromCssColorString("#4af"),pixelSize:8,outlineColor:Cesium.Color.WHITE,outlineWidth:1})},destroy(){u(t),u(l),d.scene.primitives.remove(r),d.scene.primitives.remove(o)}}}function te(d,r){const o=[],t=d.canvas,l=ee({scene:d}),u=new Cesium.ScreenSpaceEventHandler(t);function x(i){let s=d.pickPosition(i.position);if(!s||!Cesium.defined(s)){const h=d.camera.getPickRay(i.position);s=d.globe.pick(h,d)}return s}function v(i){return i.map(s=>{const h=Cesium.Cartographic.fromCartesian(s);return{lon:Cesium.Math.toDegrees(h.longitude),lat:Cesium.Math.toDegrees(h.latitude)}})}function S(){if(o.length<3)return console.warn("[HydroSim] Need at least 3 vertices to form a polygon."),!1;const i=v(o);return u.destroy(),l.destroy(),t.style.cursor="",r(i),!0}t.style.cursor="crosshair",u.setInputAction(i=>{const s=x(i);s&&(o.push(s),l.addPoint(s),l.updatePreview(o))},Cesium.ScreenSpaceEventType.LEFT_CLICK),u.setInputAction(i=>{const s=x(i);s&&o.length>0&&Cesium.Cartesian3.distance(s,o[o.length-1])>.5&&(o.push(s),l.addPoint(s),l.updatePreview(o)),S()},Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);function n(){u.destroy(),l.destroy(),t.style.cursor=""}u.setInputAction(()=>{S()||n()},Cesium.ScreenSpaceEventType.RIGHT_CLICK),document.addEventListener("keydown",function i(s){s.key==="Escape"&&(n(),document.removeEventListener("keydown",i))});const c=u.destroy.bind(u);return u.destroy=()=>{c();try{l.destroy()}catch{}t.style.cursor=""},u}function ne(d,r){let o=1/0,t=-1/0,l=1/0,u=-1/0;for(const f of d)f.lon<o&&(o=f.lon),f.lon>t&&(t=f.lon),f.lat<l&&(l=f.lat),f.lat>u&&(u=f.lat);const x=(t-o)*.2,v=(u-l)*.2;o-=x,t+=x,l-=v,u+=v;const S=1/111e3,n=1/(111e3*Math.cos((l+u)/2*Math.PI/180)),c=r*S,i=r*n,s=Math.max(4,Math.round((u-l)/c)+1),h=Math.max(4,Math.round((t-o)/i)+1),y=Math.sqrt(120*120/(h*s)),g=Math.min(120,Math.max(4,Math.round(h*y))),C=Math.min(120,Math.max(4,Math.round(s*y))),E=(t-o)/(g-1),M=(u-l)/(C-1),k=[];for(let f=0;f<C;f++)for(let T=0;T<g;T++){const $=o+T*E,a=l+f*M;k.push(new Cesium.Cartographic(Cesium.Math.toRadians($),Cesium.Math.toRadians(a)))}const I=M*111e3;return{grid:k,nx:g,ny:C,dx:I,minLon:o,minLat:l}}async function ie(d,r,o=50,t){const{grid:l,nx:u,ny:x,dx:v,minLon:S,minLat:n}=ne(r,o);t&&t(.05);const c=await Cesium.sampleTerrainMostDetailed(d.terrainProvider,l);t&&t(.9);const i=c.map(g=>Number.isFinite(g.height)?g.height:0),s=Math.min(...i),h=i.map(g=>g-s),y=new Float32Array(h);return t&&t(1),console.log(`[HydroSim] Terrain sampled: ${u}×${x} grid, dx=${v.toFixed(1)}m, min=${s.toFixed(1)}m`),{heights:y,nx:u,ny:x,dx:v,originLon:S,originLat:n}}const Q=.01;function G(d,r,o){return d+(r-d)*o}function se(d){if(d<Q)return[0,0,0,0];if(d<.5){const r=d/.5;return[G(.53,.12,r),G(.8,.31,r),G(1,.78,r),G(.35,.6,r)]}if(d<2){const r=(d-.5)/1.5;return[G(.12,0,r),G(.31,.08,r),G(.78,.39,r),G(.6,.85,r)]}return[0,.05,.3,.92]}function oe(d,r,o,t,l,u,x){const v=x+t/2*l/111e3,S=111e3,n=111e3*Math.cos(v*Math.PI/180),c=l/n,i=l/S,s=[],h=[];function y(M,k,I){const f=Cesium.Cartesian3.fromDegrees(M,k,I);s.push(f.x,f.y,f.z)}for(let M=0;M<t-1;M++)for(let k=0;k<o-1;k++){const I=M*o+k,f=d[I];if(f<Q)continue;const T=u+k*c,$=x+M*i,a=T+c,z=$+i,F=r[I]+f+.05;y(T,$,F),y(a,$,F),y(a,z,F),y(T,$,F),y(a,z,F),y(T,z,F);const[K,V,j,U]=se(f),O=Math.round(K*255),X=Math.round(V*255),e=Math.round(j*255),p=Math.round(U*255);for(let b=0;b<6;b++)h.push(O,X,e,p)}if(s.length===0)return null;const g=new Float64Array(s),C=new Uint8Array(h),E=new Cesium.Geometry({attributes:{position:new Cesium.GeometryAttribute({componentDatatype:Cesium.ComponentDatatype.DOUBLE,componentsPerAttribute:3,values:g}),color:new Cesium.GeometryAttribute({componentDatatype:Cesium.ComponentDatatype.UNSIGNED_BYTE,componentsPerAttribute:4,normalize:!0,values:C})},primitiveType:Cesium.PrimitiveType.TRIANGLES,boundingSphere:Cesium.BoundingSphere.fromVertices(g)});return new Cesium.Primitive({geometryInstances:new Cesium.GeometryInstance({geometry:E}),appearance:new Cesium.PerInstanceColorAppearance({flat:!0,translucent:!0}),releaseGeometryInstances:!0,asynchronous:!1})}function re(d){let r=null;function o(t){t&&!t.isDestroyed()&&d.primitives.remove(t)}return{update(t,l,u,x,v,S,n,c){const i=new Float32Array(t,l,x*v),s=new Float32Array(t,u,x*v),h=oe(i,s,x,v,S,n,c);o(r),h&&d.primitives.add(h),r=h},clear(){o(r),r=null},destroy(){o(r),r=null}}}function ae(d){const r=Cesium.Cartographic.fromCartesian(d);return{lon:Cesium.Math.toDegrees(r.longitude),lat:Cesium.Math.toDegrees(r.latitude)}}function ce(d,r,o,t,l,u,x,v){const n=111e3*Math.cos((v+r)/2*Math.PI/180),c=Math.round((d-x)*n/u),i=Math.round((r-v)*111e3/u);return c<0||c>=t||i<0||i>=l?0:o[i*t+c]||0}function le(d){return Math.max(1,Math.round(d/4))}function de(d,r,o,t,l,u,x){var n;const v=[];let S=0;for(let c=0;c<d.primitives.length;c++){const i=d.primitives.get(c);if(!i||i.imageBasedLighting===void 0||!i.boundingSphere)continue;const s=(n=i.boundingSphere)==null?void 0:n.center;if(!s)continue;const{lon:h,lat:y}=ae(s),g=ce(h,y,r,o,t,l,u,x);if(g<.05)continue;const C=i.boundingSphere.radius||10,E=le(C),M=Math.min(5,C/20),k=g*E*M;v.push({id:`tileset-${c}-${S++}`,lon:h.toFixed(5),lat:y.toFixed(5),depth:Math.round(g*100)/100,floors:E,score:Math.round(k*10)/10,label:`Gebäude ~(${h.toFixed(3)}°, ${y.toFixed(3)}°)`})}return v.sort((c,i)=>i.score-c.score),v.slice(0,20)}const ue=`
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
`,pe=`
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
`;function me(){const d=document.createElement("style");d.textContent=ue,document.head.appendChild(d);const r=document.createElement("button");r.id="hydrosim-trigger",r.title="HydroSim — Hochwassersimulation",r.innerHTML='<i class="bi bi-water"></i>',document.body.appendChild(r);const o=document.createElement("div");o.id="hydrosim-panel",o.innerHTML=pe,document.body.appendChild(o);const t=a=>document.getElementById(a),l=t("hs-draw-btn"),u=t("hs-draw-label"),x=t("hs-draw-hint"),v=t("hs-run"),S=t("hs-pause"),n=t("hs-reset"),c=t("hs-status"),i=t("hs-progress"),s=t("hs-progress-bar"),h=t("hs-volume"),y=t("hs-duration"),g=t("hs-speed"),C=t("hs-vol-val"),E=t("hs-dur-val"),M=t("hs-speed-val"),k=t("hs-impact-section"),I=t("hs-impact-count"),f=t("hs-impact-tbody");let T="idle",$=!0;r.addEventListener("click",()=>{o.classList.toggle("visible")}),t("hs-close").addEventListener("click",()=>{o.classList.remove("visible")});for(const a of document.querySelectorAll(".hs-event-btn"))a.addEventListener("click",()=>{document.querySelectorAll(".hs-event-btn").forEach(z=>z.classList.remove("active")),a.classList.add("active")});return h.addEventListener("input",()=>{C.textContent=Number(h.value).toLocaleString("de-DE")}),y.addEventListener("input",()=>{E.textContent=y.value}),g.addEventListener("input",()=>{M.textContent=g.value}),{panel:o,trigger:r,getParams(){const a=document.querySelector(".hs-event-btn.active");return{volumeM3:Number(h.value),durationMin:Number(y.value),durationS:Number(y.value)*60,speed:Number(g.value),eventType:(a==null?void 0:a.dataset.event)||"rain"}},onDraw(a){l.addEventListener("click",a)},onRun(a){v.addEventListener("click",a)},onPause(a){S.addEventListener("click",a)},onReset(a){n.addEventListener("click",a)},setState(a){T=a,l.disabled=!$||["drawing","sampling","running"].includes(a),v.disabled=!$||!["ready","paused"].includes(a),S.disabled=a!=="running",n.disabled=a==="sampling",a==="drawing"?(u.textContent="Zeichnen…",l.classList.add("active"),x.style.display="block"):(u.textContent="Polygon zeichnen",l.classList.remove("active"),x.style.display="none"),a==="idle"&&k.classList.remove("visible"),a==="results"&&k.classList.add("visible")},setGate(a){$=!!a,this.setState(T)},setStatus(a,z="bi-info-circle"){c.innerHTML=a?`<i class="bi ${z}"></i> ${a}`:""},setProgress(a){a===null?(i.style.display="none",s.style.width="0%"):(i.style.display="block",s.style.width=`${Math.round(a*100)}%`)},setImpact(a){if(!a||a.length===0){I.textContent="0",f.innerHTML='<tr><td colspan="3" style="color:#607d8b;text-align:center">Keine Gebäude betroffen</td></tr>';return}I.textContent=a.length;const z=a[0].score;f.innerHTML=a.slice(0,10).map(F=>`<tr>
          <td><span class="hs-score-bar" style="width:${Math.round(F.score/z*60)}px"></span>${F.score}</td>
          <td>${F.depth} m</td>
          <td style="font-size:0.65rem">${F.lon}°<br>${F.lat}°</td>
        </tr>`).join("")}}}(async function(){const r=(...e)=>console.log("[HydroSim]",...e),o=(...e)=>console.error("[HydroSim]",...e);let t=null,l=null;function u(){var e,p,b,m;return((m=(b=(p=(e=window.mapCollection)==null?void 0:e.getMap)==null?void 0:p.call(e,"3D"))==null?void 0:b.getCesiumScene)==null?void 0:m.call(b))??null}function x(){var p,b,m,w,P,L;const e=(w=(m=(b=(p=document.getElementById("masterportal-root"))==null?void 0:p.__vue_app__)==null?void 0:b.config)==null?void 0:m.globalProperties)==null?void 0:w.$store;return((L=(P=e==null?void 0:e.state)==null?void 0:P.Maps)==null?void 0:L.mode)??null}async function v(){var p,b,m,w,P,L;const e=(w=(m=(b=(p=document.getElementById("masterportal-root"))==null?void 0:p.__vue_app__)==null?void 0:b.config)==null?void 0:m.globalProperties)==null?void 0:w.$store;if(!e)return!1;if(((L=(P=e.state)==null?void 0:P.Maps)==null?void 0:L.mode)==="3D")return!0;try{return await e.dispatch("Maps/activateMap3d"),!0}catch{try{return await e.dispatch("Maps/changeMapMode","3D"),!0}catch{return!1}}}async function S(){return new Promise(e=>{const p=setInterval(()=>{window.Cesium&&u()&&(clearInterval(p),e())},500)})}try{let e;try{e=await WebAssembly.instantiateStreaming(fetch("/hydrosim.wasm"),{env:{abort(p,b,m,w){o(`WASM abort at ${b}:${m}:${w}`,p)}}})}catch{const m=await(await fetch("/hydrosim.wasm")).arrayBuffer();e=await WebAssembly.instantiate(m,{env:{abort(w,P,L,D){o(`WASM abort at ${P}:${L}:${D}`,w)}}})}t=e.instance.exports,l=t.memory,r("WASM loaded.")}catch(e){o("WASM load failed:",e)}await S();const n=me();if(n.setState("idle"),!t){n.setStatus("WASM konnte nicht geladen werden — Simulation deaktiviert","bi-exclamation-triangle");return}let c="idle",i=null,s=null,h=null,y=null,g=null,C=0,E=0;const M=new Map,k=10,I=8e3;function f(e){c=e,n.setState(e),r("State ->",e)}function T(){if(!y){const e=u();e&&(y=re(e))}}function $(){const e=u(),p=e==null?void 0:e.camera;if(!p||!window.Cesium)return!1;const b=window.Cesium.Cartographic.fromCartesian(p.positionWC);return Number.isFinite(b.height)&&b.height<=I}function a(){const e=$();return n.setGate(e),!e&&c==="idle"&&n.setStatus(`Für HydroSim näher heranzoomen (Kamerahöhe < ${I} m).`,"bi-zoom-in"),e&&c==="idle"&&n.setStatus("Bereit — Polygon zeichnen um zu beginnen","bi-info-circle"),e}function z(){const e=u(),p=e==null?void 0:e.camera;if(!p||!window.Cesium)return 50;const m=window.Cesium.Cartographic.fromCartesian(p.positionWC).height;return Number.isFinite(m)?m<2500?20:m<5e3?30:50:50}async function F(e){f("sampling"),n.setStatus("Terrain wird abgetastet…","bi-hourglass-split"),n.setProgress(.05);try{const p=z();s=await ie(e,i,p,A=>n.setProgress(A*.9)),n.setProgress(1);const{heights:b,nx:m,ny:w,dx:P}=s;if(t.init(m,w,P)<0)throw new Error("WASM init failed: not enough memory for grid");l=t.memory;const D=t.scratchPtr();new Float32Array(l.buffer,D,m*w).set(b),t.setTerrain(D,m*w),setTimeout(()=>n.setProgress(null),500),f("ready"),n.setStatus(`Bereit. Grid: ${m}x${w}, dx=${P.toFixed(0)}m`,"bi-check-circle")}catch(p){o("Terrain sampling failed:",p),n.setProgress(null),f("idle"),n.setStatus("Terrain-Abfrage fehlgeschlagen: "+p.message,"bi-exclamation-triangle")}}function K(e,p,b,m,w,P){const L=e.reduce((_,J)=>_+J.lon,0)/e.length,D=e.reduce((_,J)=>_+J.lat,0)/e.length,A=111320,R=111320*Math.cos(D*Math.PI/180),Y=Math.round((L-w)*R/m),H=Math.round((D-P)*A/m),B=e.map(_=>_.lon),W=e.map(_=>_.lat),Z=(Math.max(...B)-Math.min(...B))*R/m,q=(Math.max(...W)-Math.min(...W))*A/m,N=Math.max(2,Math.round(Math.min(Z,q)*.25));return{cx:Math.max(N,Math.min(p-1-N,Y)),cy:Math.max(N,Math.min(b-1-N,H)),radius:N}}function V(){const e=n.getParams(),p=(i||[]).slice(0,12).map(m=>`${m.lon.toFixed(5)}:${m.lat.toFixed(5)}`).join("|");return`${s?`${s.nx}x${s.ny}@${Math.round(s.dx)}`:"nogrid"}|v=${e.volumeM3}|d=${e.durationS}|e=${e.eventType}|p=${p}`}function j(e,p,b,m,w,P,L){return new Promise(D=>{const A=()=>D(de(e,p,b,m,w,P,L));typeof window.requestIdleCallback=="function"?window.requestIdleCallback(A,{timeout:250}):setTimeout(A,0)})}async function U(){cancelAnimationFrame(g),g=null,f("results"),n.setProgress(null),n.setStatus("Berechne betroffene Gebäude…","bi-buildings");try{const{nx:e,ny:p,dx:b,originLon:m,originLat:w}=s,P=new Float32Array(l.buffer,t.hPtr(),e*p),L=u(),D=V();let A=M.get(D);if(!A&&(A=L?await j(L,P,e,p,b,m,w):[],M.set(D,A),M.size>k)){const R=M.keys().next().value;M.delete(R)}n.setImpact(A),n.setStatus(`Fertig · ${A.length} Gebäude betroffen`,"bi-check-circle")}catch(e){o("Impact analysis failed:",e),n.setStatus("Simulation beendet (Impact-Analyse fehlgeschlagen)","bi-exclamation-triangle")}}function O(){if(c!=="running"||!s)return;const e=n.getParams(),{nx:p,ny:b,dx:m,originLon:w,originLat:P}=s,L=t.maxDepth(),D=Number.isFinite(L)&&L>0?L:.01,A=Math.max(.01,D),R=Math.min(m/Math.sqrt(9.81*A)*.45,4),Y=Math.max(1,Math.round(e.speed));let H=null,B=0;if(i&&i.length>=3){H=K(i,p,b,m,w,P);const N=Math.max(1,Math.PI*H.radius*H.radius)*m*m,_=e.volumeM3/e.durationS;B=Math.max(0,_/N*R)}for(let q=0;q<Y&&(H&&t.injectSource(H.cx,H.cy,H.radius,B),t.step(R,9.81,.025),C+=R,!(C>=e.durationS));q++);E+=1,E%2===0&&(T(),y==null||y.update(l.buffer,t.hPtr(),t.zbPtr(),p,b,m,w,P));const W=t.maxDepth(),Z=Number.isFinite(W)&&W>=0?W:0;if(n.setProgress(Math.min(1,C/e.durationS)),n.setStatus(`T = ${Math.round(C)}s · max. Tiefe ${Z.toFixed(2)} m`,"bi-droplet-fill"),C>=e.durationS){U();return}g=requestAnimationFrame(O)}n.onDraw(async()=>{if(c==="drawing"){h==null||h.destroy(),h=null,f("idle"),n.setStatus("Zeichnung abgebrochen.","bi-x-circle");return}if(!["idle","ready","results"].includes(c)||!a())return;if(x()!=="3D"&&!await v()){n.setStatus("Bitte zuerst in den 3D-Modus wechseln.","bi-exclamation-triangle");return}const e=u();if(!e){n.setStatus("3D-Modus aktivieren und Polygon zeichnen…","bi-pencil-square");return}f("drawing"),n.setStatus("Klicken = Punkt setzen · Doppelklick = Fertig · Rechtsklick = Fertig/Abbruch","bi-pencil-square"),h=te(e,async p=>{h=null,i=p,await F(e)})}),n.onRun(()=>{if(a()&&!(!s||!t)&&["ready","paused"].includes(c)){if(c==="ready"){C=0,t.reset();const{heights:e,nx:p,ny:b}=s,m=t.scratchPtr();new Float32Array(l.buffer,m,p*b).set(e),t.setTerrain(m,p*b)}f("running"),n.setStatus("Simulation läuft…","bi-play-fill"),cancelAnimationFrame(g),g=requestAnimationFrame(O)}}),n.onPause(()=>{c==="running"&&(cancelAnimationFrame(g),g=null,f("paused"),n.setStatus(`Pausiert bei T=${Math.round(C)}s`,"bi-pause-fill"))}),n.onReset(()=>{cancelAnimationFrame(g),g=null,h==null||h.destroy(),h=null,y==null||y.clear(),t.reset(),i=null,s=null,C=0,f("idle"),n.setStatus("",""),n.setProgress(null),n.setImpact([])}),f("idle"),a();const X=setInterval(a,800);window.HydroSim={getState:()=>c,getTerrain:()=>s,getWasm:()=>t,getScene:u,stop:()=>{cancelAnimationFrame(g),g=null,f("paused")},destroy:()=>{clearInterval(X)}}})()})();
