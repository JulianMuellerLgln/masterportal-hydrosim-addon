(function(){"use strict";function X(d){const r=new Cesium.PointPrimitiveCollection,o=new Cesium.PolylineCollection;d.scene.primitives.add(r),d.scene.primitives.add(o);let e=null,c=null;function u(t){t&&!t.isDestroyed()&&d.scene.primitives.remove(t)}function C(t){const a=Cesium.Cartographic.fromCartesian(t),i=d.scene.globe.getHeight(a),s=Number.isFinite(i)?i+.2:a.height;return Cesium.Cartesian3.fromRadians(a.longitude,a.latitude,s)}function v(t,a,i=10){const s=Cesium.Cartographic.fromCartesian(t),p=Cesium.Cartographic.fromCartesian(a),g=[];for(let f=0;f<=i;f++){const w=f/i,D=Cesium.Math.lerp(s.longitude,p.longitude,w),P=Cesium.Math.lerp(s.latitude,p.latitude,w),y=new Cesium.Cartographic(D,P),I=d.scene.globe.getHeight(y),x=Number.isFinite(I)?I+.25:Cesium.Math.lerp(s.height,p.height,w);g.push(Cesium.Cartesian3.fromRadians(D,P,x))}return g}function S(t){if(t.length<2)return[];const a=[];for(let i=0;i<t.length-1;i++){const s=v(t[i],t[i+1]);i>0&&s.shift(),a.push(...s)}return a}return{points:r,polys:o,updatePreview(t){if(o.removeAll(),u(e),u(c),e=null,c=null,t.length>=2){const a=[...t,t[0]],i=S(a);o.add({positions:i.length>0?i:a,width:2.5,material:Cesium.Material.fromType("Color",{color:Cesium.Color.fromCssColorString("#4af")}),loop:!1})}if(t.length>=3){const a=t.map(C),i=new Cesium.PolygonGeometry({polygonHierarchy:new Cesium.PolygonHierarchy(a),perPositionHeight:!0,vertexFormat:Cesium.PerInstanceColorAppearance.VERTEX_FORMAT});c=new Cesium.Primitive({geometryInstances:new Cesium.GeometryInstance({geometry:i,attributes:{color:Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.fromCssColorString("#4af").withAlpha(.22))}}),appearance:new Cesium.PerInstanceColorAppearance({translucent:!0,closed:!1}),asynchronous:!1}),d.scene.primitives.add(c)}},addPoint(t){r.add({position:t,color:Cesium.Color.fromCssColorString("#4af"),pixelSize:8,outlineColor:Cesium.Color.WHITE,outlineWidth:1})},destroy(){u(e),u(c),d.scene.primitives.remove(r),d.scene.primitives.remove(o)}}}function Y(d,r){const o=[],e=d.canvas,c=X({scene:d}),u=new Cesium.ScreenSpaceEventHandler(e);function C(i){let s=d.pickPosition(i.position);if(!s||!Cesium.defined(s)){const p=d.camera.getPickRay(i.position);s=d.globe.pick(p,d)}return s}function v(i){return i.map(s=>{const p=Cesium.Cartographic.fromCartesian(s);return{lon:Cesium.Math.toDegrees(p.longitude),lat:Cesium.Math.toDegrees(p.latitude)}})}function S(){if(o.length<3)return console.warn("[HydroSim] Need at least 3 vertices to form a polygon."),!1;const i=v(o);return u.destroy(),c.destroy(),e.style.cursor="",r(i),!0}e.style.cursor="crosshair",u.setInputAction(i=>{const s=C(i);s&&(o.push(s),c.addPoint(s),c.updatePreview(o))},Cesium.ScreenSpaceEventType.LEFT_CLICK),u.setInputAction(i=>{const s=C(i);s&&o.length>0&&Cesium.Cartesian3.distance(s,o[o.length-1])>.5&&(o.push(s),c.addPoint(s),c.updatePreview(o)),S()},Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);function t(){u.destroy(),c.destroy(),e.style.cursor=""}u.setInputAction(()=>{S()||t()},Cesium.ScreenSpaceEventType.RIGHT_CLICK),document.addEventListener("keydown",function i(s){s.key==="Escape"&&(t(),document.removeEventListener("keydown",i))});const a=u.destroy.bind(u);return u.destroy=()=>{a();try{c.destroy()}catch{}e.style.cursor=""},u}function Z(d,r){let o=1/0,e=-1/0,c=1/0,u=-1/0;for(const x of d)x.lon<o&&(o=x.lon),x.lon>e&&(e=x.lon),x.lat<c&&(c=x.lat),x.lat>u&&(u=x.lat);const C=(e-o)*.2,v=(u-c)*.2;o-=C,e+=C,c-=v,u+=v;const S=1/111e3,t=1/(111e3*Math.cos((c+u)/2*Math.PI/180)),a=r*S,i=r*t,s=Math.max(4,Math.round((u-c)/a)+1),p=Math.max(4,Math.round((e-o)/i)+1),g=Math.sqrt(120*120/(p*s)),f=Math.min(120,Math.max(4,Math.round(p*g))),w=Math.min(120,Math.max(4,Math.round(s*g))),D=(e-o)/(f-1),P=(u-c)/(w-1),y=[];for(let x=0;x<w;x++)for(let A=0;A<f;A++){const T=o+A*D,l=c+x*P;y.push(new Cesium.Cartographic(Cesium.Math.toRadians(T),Cesium.Math.toRadians(l)))}const I=P*111e3;return{grid:y,nx:f,ny:w,dx:I,minLon:o,minLat:c}}async function J(d,r,o=50,e){const{grid:c,nx:u,ny:C,dx:v,minLon:S,minLat:t}=Z(r,o);e&&e(.05);const a=await Cesium.sampleTerrainMostDetailed(d.terrainProvider,c);e&&e(.9);const i=a.map(f=>Number.isFinite(f.height)?f.height:0),s=Math.min(...i),p=i.map(f=>f-s),g=new Float32Array(p);return e&&e(1),console.log(`[HydroSim] Terrain sampled: ${u}×${C} grid, dx=${v.toFixed(1)}m, min=${s.toFixed(1)}m`),{heights:g,nx:u,ny:C,dx:v,originLon:S,originLat:t}}const U=.01;function H(d,r,o){return d+(r-d)*o}function Q(d){if(d<U)return[0,0,0,0];if(d<.5){const r=d/.5;return[H(.53,.12,r),H(.8,.31,r),H(1,.78,r),H(.35,.6,r)]}if(d<2){const r=(d-.5)/1.5;return[H(.12,0,r),H(.31,.08,r),H(.78,.39,r),H(.6,.85,r)]}return[0,.05,.3,.92]}function ee(d,r,o,e,c,u,C){const v=C+e/2*c/111e3,S=111e3,t=111e3*Math.cos(v*Math.PI/180),a=c/t,i=c/S,s=[],p=[];function g(P,y,I){const x=Cesium.Cartesian3.fromDegrees(P,y,I);s.push(x.x,x.y,x.z)}for(let P=0;P<e-1;P++)for(let y=0;y<o-1;y++){const I=P*o+y,x=d[I];if(x<U)continue;const A=u+y*a,T=C+P*i,l=A+a,z=T+i,F=r[I]+x+.05;g(A,T,F),g(l,T,F),g(l,z,F),g(A,T,F),g(l,z,F),g(A,z,F);const[W,O,n,m]=Q(x),b=Math.round(W*255),h=Math.round(O*255),M=Math.round(n*255),L=Math.round(m*255);for(let k=0;k<6;k++)p.push(b,h,M,L)}if(s.length===0)return null;const f=new Float64Array(s),w=new Uint8Array(p),D=new Cesium.Geometry({attributes:{position:new Cesium.GeometryAttribute({componentDatatype:Cesium.ComponentDatatype.DOUBLE,componentsPerAttribute:3,values:f}),color:new Cesium.GeometryAttribute({componentDatatype:Cesium.ComponentDatatype.UNSIGNED_BYTE,componentsPerAttribute:4,normalize:!0,values:w})},primitiveType:Cesium.PrimitiveType.TRIANGLES,boundingSphere:Cesium.BoundingSphere.fromVertices(f)});return new Cesium.Primitive({geometryInstances:new Cesium.GeometryInstance({geometry:D}),appearance:new Cesium.PerInstanceColorAppearance({flat:!0,translucent:!0}),releaseGeometryInstances:!0,asynchronous:!1})}function te(d){let r=null;function o(e){e&&!e.isDestroyed()&&d.primitives.remove(e)}return{update(e,c,u,C,v,S,t,a){const i=new Float32Array(e,c,C*v),s=new Float32Array(e,u,C*v),p=ee(i,s,C,v,S,t,a);o(r),p&&d.primitives.add(p),r=p},clear(){o(r),r=null},destroy(){o(r),r=null}}}function ne(d){const r=Cesium.Cartographic.fromCartesian(d);return{lon:Cesium.Math.toDegrees(r.longitude),lat:Cesium.Math.toDegrees(r.latitude)}}function ie(d,r,o,e,c,u,C,v){const t=111e3*Math.cos((v+r)/2*Math.PI/180),a=Math.round((d-C)*t/u),i=Math.round((r-v)*111e3/u);return a<0||a>=e||i<0||i>=c?0:o[i*e+a]||0}function se(d){return Math.max(1,Math.round(d/4))}function oe(d,r,o,e,c,u,C){var t;const v=[];let S=0;for(let a=0;a<d.primitives.length;a++){const i=d.primitives.get(a);if(!i||i.imageBasedLighting===void 0||!i.boundingSphere)continue;const s=(t=i.boundingSphere)==null?void 0:t.center;if(!s)continue;const{lon:p,lat:g}=ne(s),f=ie(p,g,r,o,e,c,u,C);if(f<.05)continue;const w=i.boundingSphere.radius||10,D=se(w),P=Math.min(5,w/20),y=f*D*P;v.push({id:`tileset-${a}-${S++}`,lon:p.toFixed(5),lat:g.toFixed(5),depth:Math.round(f*100)/100,floors:D,score:Math.round(y*10)/10,label:`Gebäude ~(${p.toFixed(3)}°, ${g.toFixed(3)}°)`})}return v.sort((a,i)=>i.score-a.score),v.slice(0,20)}const re=`
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
`,ae=`
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
`;function ce(){const d=document.createElement("style");d.textContent=re,document.head.appendChild(d);const r=document.createElement("button");r.id="hydrosim-trigger",r.title="HydroSim — Hochwassersimulation",r.innerHTML='<i class="bi bi-water"></i>',document.body.appendChild(r);const o=document.createElement("div");o.id="hydrosim-panel",o.innerHTML=ae,document.body.appendChild(o);const e=l=>document.getElementById(l),c=e("hs-draw-btn"),u=e("hs-draw-label"),C=e("hs-draw-hint"),v=e("hs-run"),S=e("hs-pause"),t=e("hs-reset"),a=e("hs-status"),i=e("hs-progress"),s=e("hs-progress-bar"),p=e("hs-volume"),g=e("hs-duration"),f=e("hs-speed"),w=e("hs-vol-val"),D=e("hs-dur-val"),P=e("hs-speed-val"),y=e("hs-impact-section"),I=e("hs-impact-count"),x=e("hs-impact-tbody");let A="idle",T=!0;r.addEventListener("click",()=>{o.classList.toggle("visible")}),e("hs-close").addEventListener("click",()=>{o.classList.remove("visible")});for(const l of document.querySelectorAll(".hs-event-btn"))l.addEventListener("click",()=>{document.querySelectorAll(".hs-event-btn").forEach(z=>z.classList.remove("active")),l.classList.add("active")});return p.addEventListener("input",()=>{w.textContent=Number(p.value).toLocaleString("de-DE")}),g.addEventListener("input",()=>{D.textContent=g.value}),f.addEventListener("input",()=>{P.textContent=f.value}),{panel:o,trigger:r,getParams(){const l=document.querySelector(".hs-event-btn.active");return{volumeM3:Number(p.value),durationMin:Number(g.value),durationS:Number(g.value)*60,speed:Number(f.value),eventType:(l==null?void 0:l.dataset.event)||"rain"}},onDraw(l){c.addEventListener("click",l)},onRun(l){v.addEventListener("click",l)},onPause(l){S.addEventListener("click",l)},onReset(l){t.addEventListener("click",l)},setState(l){A=l,c.disabled=!T||["drawing","sampling","running"].includes(l),v.disabled=!T||!["ready","paused"].includes(l),S.disabled=l!=="running",t.disabled=l==="sampling",l==="drawing"?(u.textContent="Zeichnen…",c.classList.add("active"),C.style.display="block"):(u.textContent="Polygon zeichnen",c.classList.remove("active"),C.style.display="none"),l==="idle"&&y.classList.remove("visible"),l==="results"&&y.classList.add("visible")},setGate(l){T=!!l,this.setState(A)},setStatus(l,z="bi-info-circle"){a.innerHTML=l?`<i class="bi ${z}"></i> ${l}`:""},setProgress(l){l===null?(i.style.display="none",s.style.width="0%"):(i.style.display="block",s.style.width=`${Math.round(l*100)}%`)},setImpact(l){if(!l||l.length===0){I.textContent="0",x.innerHTML='<tr><td colspan="3" style="color:#607d8b;text-align:center">Keine Gebäude betroffen</td></tr>';return}I.textContent=l.length;const z=l[0].score;x.innerHTML=l.slice(0,10).map(F=>`<tr>
          <td><span class="hs-score-bar" style="width:${Math.round(F.score/z*60)}px"></span>${F.score}</td>
          <td>${F.depth} m</td>
          <td style="font-size:0.65rem">${F.lon}°<br>${F.lat}°</td>
        </tr>`).join("")}}}(async function(){const r=(...n)=>console.log("[HydroSim]",...n),o=(...n)=>console.error("[HydroSim]",...n);let e=null,c=null;function u(){var n,m,b,h;return((h=(b=(m=(n=window.mapCollection)==null?void 0:n.getMap)==null?void 0:m.call(n,"3D"))==null?void 0:b.getCesiumScene)==null?void 0:h.call(b))??null}function C(){var m,b,h,M,L,k;const n=(M=(h=(b=(m=document.getElementById("masterportal-root"))==null?void 0:m.__vue_app__)==null?void 0:b.config)==null?void 0:h.globalProperties)==null?void 0:M.$store;return((k=(L=n==null?void 0:n.state)==null?void 0:L.Maps)==null?void 0:k.mode)??null}async function v(){var m,b,h,M,L,k;const n=(M=(h=(b=(m=document.getElementById("masterportal-root"))==null?void 0:m.__vue_app__)==null?void 0:b.config)==null?void 0:h.globalProperties)==null?void 0:M.$store;if(!n)return!1;if(((k=(L=n.state)==null?void 0:L.Maps)==null?void 0:k.mode)==="3D")return!0;try{return await n.dispatch("Maps/activateMap3d"),!0}catch{try{return await n.dispatch("Maps/changeMapMode","3D"),!0}catch{return!1}}}async function S(){return new Promise(n=>{const m=setInterval(()=>{window.Cesium&&u()&&(clearInterval(m),n())},500)})}try{let n;try{n=await WebAssembly.instantiateStreaming(fetch("/hydrosim.wasm"),{env:{abort(m,b,h,M){o(`WASM abort at ${b}:${h}:${M}`,m)}}})}catch{const h=await(await fetch("/hydrosim.wasm")).arrayBuffer();n=await WebAssembly.instantiate(h,{env:{abort(M,L,k,E){o(`WASM abort at ${L}:${k}:${E}`,M)}}})}e=n.instance.exports,c=e.memory,r("WASM loaded.")}catch(n){o("WASM load failed:",n)}await S();const t=ce();if(t.setState("idle"),!e){t.setStatus("WASM konnte nicht geladen werden — Simulation deaktiviert","bi-exclamation-triangle");return}let a="idle",i=null,s=null,p=null,g=null,f=null,w=0,D=0;const P=8e3;function y(n){a=n,t.setState(n),r("State ->",n)}function I(){if(!g){const n=u();n&&(g=te(n))}}function x(){const n=u(),m=n==null?void 0:n.camera;if(!m||!window.Cesium)return!1;const b=window.Cesium.Cartographic.fromCartesian(m.positionWC);return Number.isFinite(b.height)&&b.height<=P}function A(){const n=x();return t.setGate(n),!n&&a==="idle"&&t.setStatus(`Für HydroSim näher heranzoomen (Kamerahöhe < ${P} m).`,"bi-zoom-in"),n&&a==="idle"&&t.setStatus("Bereit — Polygon zeichnen um zu beginnen","bi-info-circle"),n}function T(){const n=u(),m=n==null?void 0:n.camera;if(!m||!window.Cesium)return 50;const h=window.Cesium.Cartographic.fromCartesian(m.positionWC).height;return Number.isFinite(h)?h<2500?20:h<5e3?30:50:50}async function l(n){y("sampling"),t.setStatus("Terrain wird abgetastet…","bi-hourglass-split"),t.setProgress(.05);try{const m=T();s=await J(n,i,m,_=>t.setProgress(_*.9)),t.setProgress(1);const{heights:b,nx:h,ny:M,dx:L}=s;if(e.init(h,M,L)<0)throw new Error("WASM init failed: not enough memory for grid");c=e.memory;const E=e.scratchPtr();new Float32Array(c.buffer,E,h*M).set(b),e.setTerrain(E,h*M),setTimeout(()=>t.setProgress(null),500),y("ready"),t.setStatus(`Bereit. Grid: ${h}x${M}, dx=${L.toFixed(0)}m`,"bi-check-circle")}catch(m){o("Terrain sampling failed:",m),t.setProgress(null),y("idle"),t.setStatus("Terrain-Abfrage fehlgeschlagen: "+m.message,"bi-exclamation-triangle")}}function z(n,m,b,h,M,L){const k=n.reduce((G,j)=>G+j.lon,0)/n.length,E=n.reduce((G,j)=>G+j.lat,0)/n.length,_=111320,$=111320*Math.cos(E*Math.PI/180),N=Math.round((k-M)*$/h),K=Math.round((E-L)*_/h),R=n.map(G=>G.lon),q=n.map(G=>G.lat),V=(Math.max(...R)-Math.min(...R))*$/h,le=(Math.max(...q)-Math.min(...q))*_/h,B=Math.max(2,Math.round(Math.min(V,le)*.25));return{cx:Math.max(B,Math.min(m-1-B,N)),cy:Math.max(B,Math.min(b-1-B,K)),radius:B}}function F(){cancelAnimationFrame(f),f=null,y("results"),t.setProgress(null),t.setStatus("Berechne betroffene Gebäude…","bi-buildings");try{const{nx:n,ny:m,dx:b,originLon:h,originLat:M}=s,L=new Float32Array(c.buffer,e.hPtr(),n*m),k=u(),E=k?oe(k,L,n,m,b,h,M):[];t.setImpact(E),t.setStatus(`Fertig · ${E.length} Gebäude betroffen`,"bi-check-circle")}catch(n){o("Impact analysis failed:",n),t.setStatus("Simulation beendet (Impact-Analyse fehlgeschlagen)","bi-exclamation-triangle")}}function W(){if(a!=="running"||!s)return;const n=t.getParams(),{nx:m,ny:b,dx:h,originLon:M,originLat:L}=s,k=Math.max(.01,e.maxDepth()),E=Math.min(h/Math.sqrt(9.81*k)*.45,4),_=Math.max(1,Math.round(n.speed));let $=null,N=0;if(i&&i.length>=3){$=z(i,m,b,h,M,L);const q=Math.max(1,Math.PI*$.radius*$.radius)*h*h,V=n.volumeM3/n.durationS;N=Math.max(0,V/q*E)}for(let R=0;R<_&&($&&e.injectSource($.cx,$.cy,$.radius,N),e.step(E,9.81,.025),w+=E,!(w>=n.durationS));R++);D+=1,D%2===0&&(I(),g==null||g.update(c.buffer,e.hPtr(),e.zbPtr(),m,b,h,M,L));const K=e.maxDepth();if(t.setProgress(Math.min(1,w/n.durationS)),t.setStatus(`T = ${Math.round(w)}s · max. Tiefe ${K.toFixed(2)} m`,"bi-droplet-fill"),w>=n.durationS){F();return}f=requestAnimationFrame(W)}t.onDraw(async()=>{if(a==="drawing"){p==null||p.destroy(),p=null,y("idle"),t.setStatus("Zeichnung abgebrochen.","bi-x-circle");return}if(!["idle","ready","results"].includes(a)||!A())return;if(C()!=="3D"&&!await v()){t.setStatus("Bitte zuerst in den 3D-Modus wechseln.","bi-exclamation-triangle");return}const n=u();if(!n){t.setStatus("3D-Modus aktivieren und Polygon zeichnen…","bi-pencil-square");return}y("drawing"),t.setStatus("Klicken = Punkt setzen · Doppelklick = Fertig · Rechtsklick = Fertig/Abbruch","bi-pencil-square"),p=Y(n,async m=>{p=null,i=m,await l(n)})}),t.onRun(()=>{if(A()&&!(!s||!e)&&["ready","paused"].includes(a)){if(a==="ready"){w=0,e.reset();const{heights:n,nx:m,ny:b}=s,h=e.scratchPtr();new Float32Array(c.buffer,h,m*b).set(n),e.setTerrain(h,m*b)}y("running"),t.setStatus("Simulation läuft…","bi-play-fill"),cancelAnimationFrame(f),f=requestAnimationFrame(W)}}),t.onPause(()=>{a==="running"&&(cancelAnimationFrame(f),f=null,y("paused"),t.setStatus(`Pausiert bei T=${Math.round(w)}s`,"bi-pause-fill"))}),t.onReset(()=>{cancelAnimationFrame(f),f=null,p==null||p.destroy(),p=null,g==null||g.clear(),e.reset(),i=null,s=null,w=0,y("idle"),t.setStatus("",""),t.setProgress(null),t.setImpact([])}),y("idle"),A();const O=setInterval(A,800);window.HydroSim={getState:()=>a,getTerrain:()=>s,getWasm:()=>e,getScene:u,stop:()=>{cancelAnimationFrame(f),f=null,y("paused")},destroy:()=>{clearInterval(O)}}})()})();
