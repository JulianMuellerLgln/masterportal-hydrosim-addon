(function(){"use strict";function _e(s){const c=new Cesium.PointPrimitiveCollection,n=new Cesium.PolylineCollection;s.scene.primitives.add(c),s.scene.primitives.add(n);let t=null,r=null;function m(l){l&&!l.isDestroyed()&&s.scene.primitives.remove(l)}function v(l){const i=Cesium.Cartographic.fromCartesian(l),h=s.scene.globe.getHeight(i),p=Number.isFinite(h)?h+.2:i.height;return Cesium.Cartesian3.fromRadians(i.longitude,i.latitude,p)}function M(l,i,h=10){const p=Cesium.Cartographic.fromCartesian(l),b=Cesium.Cartographic.fromCartesian(i),w=[];for(let x=0;x<=h;x++){const A=x/h,$=Cesium.Math.lerp(p.longitude,b.longitude,A),D=Cesium.Math.lerp(p.latitude,b.latitude,A),L=new Cesium.Cartographic($,D),_=s.scene.globe.getHeight(L),k=Number.isFinite(_)?_+.25:Cesium.Math.lerp(p.height,b.height,A);w.push(Cesium.Cartesian3.fromRadians($,D,k))}return w}function P(l){if(l.length<2)return[];const i=[];for(let h=0;h<l.length-1;h++){const p=M(l[h],l[h+1]);h>0&&p.shift(),i.push(...p)}return i}return{points:c,polys:n,updatePreview(l){if(n.removeAll(),m(t),m(r),t=null,r=null,l.length>=2){const i=[...l,l[0]],h=P(i);n.add({positions:h.length>0?h:i,width:2.5,material:Cesium.Material.fromType("Color",{color:Cesium.Color.fromCssColorString("#4af")}),loop:!1})}if(l.length>=3){const i=l.map(v),h=new Cesium.PolygonGeometry({polygonHierarchy:new Cesium.PolygonHierarchy(i),perPositionHeight:!0,vertexFormat:Cesium.PerInstanceColorAppearance.VERTEX_FORMAT});r=new Cesium.Primitive({geometryInstances:new Cesium.GeometryInstance({geometry:h,attributes:{color:Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.fromCssColorString("#4af").withAlpha(.22))}}),appearance:new Cesium.PerInstanceColorAppearance({translucent:!0,closed:!1}),asynchronous:!1}),s.scene.primitives.add(r)}},addPoint(l){c.add({position:l,color:Cesium.Color.fromCssColorString("#4af"),pixelSize:8,outlineColor:Cesium.Color.WHITE,outlineWidth:1})},destroy(){m(t),m(r),s.scene.primitives.remove(c),s.scene.primitives.remove(n)}}}function We(s,c){const n=[],t=s.canvas,r=_e({scene:s}),m=new Cesium.ScreenSpaceEventHandler(t);function v(h){let p=s.pickPosition(h.position);if(!p||!Cesium.defined(p)){const b=s.camera.getPickRay(h.position);p=s.globe.pick(b,s)}return p}function M(h){return h.map(p=>{const b=Cesium.Cartographic.fromCartesian(p);return{lon:Cesium.Math.toDegrees(b.longitude),lat:Cesium.Math.toDegrees(b.latitude)}})}function P(){if(n.length<3)return console.warn("[HydroSim] Need at least 3 vertices to form a polygon."),!1;const h=M(n);return m.destroy(),r.destroy(),t.style.cursor="",c(h),!0}t.style.cursor="crosshair",m.setInputAction(h=>{const p=v(h);p&&(n.push(p),r.addPoint(p),r.updatePreview(n))},Cesium.ScreenSpaceEventType.LEFT_CLICK),m.setInputAction(h=>{const p=v(h);p&&n.length>0&&Cesium.Cartesian3.distance(p,n[n.length-1])>.5&&(n.push(p),r.addPoint(p),r.updatePreview(n)),P()},Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);function l(){m.destroy(),r.destroy(),t.style.cursor=""}m.setInputAction(()=>{P()||l()},Cesium.ScreenSpaceEventType.RIGHT_CLICK),document.addEventListener("keydown",function h(p){p.key==="Escape"&&(l(),document.removeEventListener("keydown",h))});const i=m.destroy.bind(m);return m.destroy=()=>{i();try{r.destroy()}catch{}t.style.cursor=""},m}function Ee(s,c){let n=s.pickPosition(c);if(!n||!Cesium.defined(n)){const t=s.camera.getPickRay(c);n=s.globe.pick(t,s)}return n}function $e(s){const c=Cesium.Cartographic.fromCartesian(s);return{lon:Cesium.Math.toDegrees(c.longitude),lat:Cesium.Math.toDegrees(c.latitude)}}function ct(s,c){const n=s.canvas,t=new Cesium.ScreenSpaceEventHandler(n);n.style.cursor="crosshair";function r(){n.style.cursor="",t.destroy()}return t.setInputAction(m=>{const v=Ee(s,m.position);if(!v)return;const M=$e(v);r(),c(M)},Cesium.ScreenSpaceEventType.LEFT_CLICK),t.setInputAction(()=>{r()},Cesium.ScreenSpaceEventType.RIGHT_CLICK),t}function lt(s,c){const n=[],t=s.canvas,r=_e({scene:s}),m=new Cesium.ScreenSpaceEventHandler(t);t.style.cursor="crosshair";function v(){try{r.destroy()}catch{}t.style.cursor="",m.destroy()}function M(){r.points.removeAll(),r.polys.removeAll();for(const P of n)r.addPoint(P);n.length>=2&&r.polys.add({positions:n,width:3,material:Cesium.Material.fromType("Color",{color:Cesium.Color.fromCssColorString("#ffb300")}),loop:!1})}return m.setInputAction(P=>{const l=Ee(s,P.position);l&&(n.push(l),M())},Cesium.ScreenSpaceEventType.LEFT_CLICK),m.setInputAction(P=>{const l=Ee(s,P.position);if(l&&n.length>0&&Cesium.Cartesian3.distance(l,n[n.length-1])>.5&&n.push(l),n.length>=2){const i=n.map($e);v(),c(i);return}v()},Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK),m.setInputAction(()=>{if(n.length>=2){const P=n.map($e);v(),c(P);return}v()},Cesium.ScreenSpaceEventType.RIGHT_CLICK),m}function ut(s,c){let n=1/0,t=-1/0,r=1/0,m=-1/0;for(const k of s)k.lon<n&&(n=k.lon),k.lon>t&&(t=k.lon),k.lat<r&&(r=k.lat),k.lat>m&&(m=k.lat);const v=(t-n)*.2,M=(m-r)*.2;n-=v,t+=v,r-=M,m+=M;const P=1/111e3,l=1/(111e3*Math.cos((r+m)/2*Math.PI/180)),i=c*P,h=c*l,p=Math.max(4,Math.round((m-r)/i)+1),b=Math.max(4,Math.round((t-n)/h)+1),w=Math.sqrt(120*120/(b*p)),x=Math.min(120,Math.max(4,Math.round(b*w))),A=Math.min(120,Math.max(4,Math.round(p*w))),$=(t-n)/(x-1),D=(m-r)/(A-1),L=[];for(let k=0;k<A;k++)for(let O=0;O<x;O++){const U=n+O*$,V=r+k*D;L.push(new Cesium.Cartographic(Cesium.Math.toRadians(U),Cesium.Math.toRadians(V)))}const _=D*111e3;return{grid:L,nx:x,ny:A,dx:_,minLon:n,minLat:r}}async function dt(s,c,n=50,t){const{grid:r,nx:m,ny:v,dx:M,minLon:P,minLat:l}=ut(c,n);t&&t(.05);const i=await Cesium.sampleTerrainMostDetailed(s.terrainProvider,r);t&&t(.9);const h=i.map(x=>Number.isFinite(x.height)?x.height:0),p=Math.min(...h),b=h.map(x=>x-p),w=new Float32Array(b);return t&&t(1),console.log(`[HydroSim] Terrain sampled: ${m}×${v} grid, dx=${M.toFixed(1)}m, min=${p.toFixed(1)}m`),{heights:w,nx:m,ny:v,dx:M,originLon:P,originLat:l,baseElevation:p}}const qe=.003;function oe(s,c,n){return s+(c-s)*n}function mt(s,c=0){if(s<qe)return[0,0,0,0];const n=Math.max(0,Math.min(1,c/6));if(s<.5){const t=s/.5;return[oe(.53,.12,t)+.04*n,oe(.8,.31,t)+.02*n,oe(1,.78,t)+.14*n,oe(.54,.76,t)]}if(s<2){const t=(s-.5)/1.5;return[oe(.12,0,t)+.02*n,oe(.31,.08,t)+.01*n,oe(.78,.39,t)+.15*n,oe(.74,.92,t)]}return[.01+.02*n,.08+.01*n,.38+.16*n,.93]}function ht(s,c=0){const n=Math.max(0,Math.min(1,c));if(n<=0)return s;const t=[1,.36,.06],r=Math.min(.8,n*.85);return[oe(s[0],t[0],r),oe(s[1],t[1],r),oe(s[2],t[2],r),Math.min(1,s[3]+n*.12)]}function Be(s,c,n,t,r,m,v,M,P,l=0,i=0,h=null,p=null){const b=P+m/2*v/111e3,w=111e3,x=111e3*Math.cos(b*Math.PI/180),A=v/x,$=v/w,D=[],L=[],_=h?h.col:null,k=h?h.row:null,O=h?h.maxDistCellsSq:null;function U(I,B,Z){const J=Cesium.Cartesian3.fromDegrees(I,B,Z);D.push(J.x,J.y,J.z)}for(let I=0;I<m-1;I++)for(let B=0;B<r-1;B++){if(O!=null){const Y=B-_,ye=I-k;if(Y*Y+ye*ye>O)continue}const Z=I*r+B,J=s[Z];if(!Number.isFinite(J)||J<qe)continue;const te=Number.isFinite(n[Z])?n[Z]:0,T=Number.isFinite(t[Z])?t[Z]:0,fe=Math.sqrt(te*te+T*T),ae=M+B*A,re=P+I*$,de=ae+A,me=re+$,ge=Math.min(.08,.02+J*.08),ve=te*.06+T*.06+(I+B)*.08,se=Math.sin(i*2.2+ve)*ge,ce=l+c[Z]+J+.12+se;if(!Number.isFinite(ce))continue;U(ae,re,ce),U(de,re,ce),U(de,me,ce),U(ae,re,ce),U(de,me,ce),U(ae,me,ce);const xe=mt(J,fe),Ce=p&&Number.isFinite(p[Z])?p[Z]:0,[he,be,Me,pe]=ht(xe,Ce),le=Math.round(he*255),f=Math.round(be*255),j=Math.round(Me*255),R=Math.round(pe*255);for(let Y=0;Y<6;Y++)L.push(le,f,j,R)}if(D.length===0)return null;const V=new Float64Array(D),Q=new Uint8Array(L),z=new Cesium.Geometry({attributes:{position:new Cesium.GeometryAttribute({componentDatatype:Cesium.ComponentDatatype.DOUBLE,componentsPerAttribute:3,values:V}),color:new Cesium.GeometryAttribute({componentDatatype:Cesium.ComponentDatatype.UNSIGNED_BYTE,componentsPerAttribute:4,normalize:!0,values:Q})},primitiveType:Cesium.PrimitiveType.TRIANGLES,boundingSphere:Cesium.BoundingSphere.fromVertices(V)});return new Cesium.Primitive({geometryInstances:new Cesium.GeometryInstance({geometry:z}),appearance:new Cesium.PerInstanceColorAppearance({flat:!0,translucent:!0}),releaseGeometryInstances:!0,asynchronous:!1})}function pt(s){let c=null;const n=new Map;function t(r){r&&!r.isDestroyed()&&s.primitives.remove(r)}return{update(r,m,v,M,P,l,i,h,p,b,w=0,x=0,A=null){const $=new Float32Array(r,m,l*i),D=new Float32Array(r,v,l*i),L=new Float32Array(r,M,l*i),_=new Float32Array(r,P,l*i);let k=null;try{const U=s==null?void 0:s.camera,V=U==null?void 0:U.positionWC;if(V){const Q=Cesium.Cartographic.fromCartesian(V),z=Cesium.Math.toDegrees(Q.longitude),I=Cesium.Math.toDegrees(Q.latitude),B=Number.isFinite(Q.height)?Q.height:0,Z=111e3,J=111e3*Math.cos((b+I)/2*Math.PI/180),te=(z-p)*J/h,T=(I-b)*Z/h,ae=Math.max(1800,Math.min(12e3,2200+B*.35))/h;k={col:te,row:T,maxDistCellsSq:ae*ae}}}catch{k=null}const O=Be($,D,L,_,l,i,h,p,b,w,x,k,A);t(c),O&&s.primitives.add(O),c=O},clear(){t(c),c=null},upsertStaticLayer(r,m,v,M,P,l,i,h,p=0,b=null){const w=n.get(r);t(w);const x=new Float32Array(M*P),A=Be(m,v,x,x,M,P,l,i,h,p,0,null,b);A?(s.primitives.add(A),n.set(r,A)):n.delete(r)},removeStaticLayer(r){const m=n.get(r);t(m),n.delete(r)},clearStaticLayers(){for(const r of n.values())t(r);n.clear()},destroy(){t(c),c=null;for(const r of n.values())t(r);n.clear()}}}function ft(s){let c=null,n=null;function t(m){m&&!m.isDestroyed()&&s.primitives.remove(m)}function r(m){var h;if(!Array.isArray(m)||m.length===0)return null;const v=((h=s==null?void 0:s.camera)==null?void 0:h.positionWC)||null,M=7e3,P=M*M,l=[],i=[];for(const p of m){const b=Number(p.lon),w=Number(p.lat);if(!Number.isFinite(b)||!Number.isFinite(w))continue;const x=Math.max(5,Math.min(18,Number(p.footprintRadiusM)||10)),A=Math.max(1,Number(p.floors)||1),$=Math.max(5,Math.min(24,A*3)),L=(Number.isFinite(p.centerHeightM)?Number(p.centerHeightM):0)+$*.2,_=Cesium.Cartesian3.fromDegrees(b,w,L);if(v&&Cesium.Cartesian3.distanceSquared(_,v)>P)continue;const k=Cesium.Transforms.eastNorthUpToFixedFrame(_),O=Cesium.BoxGeometry.fromDimensions({dimensions:new Cesium.Cartesian3(x*1.8,x*1.8,$)}),U=Cesium.BoxOutlineGeometry.fromDimensions({dimensions:new Cesium.Cartesian3(x*1.85,x*1.85,$*1.03)}),V=Math.max(0,Number(p.depth)||0),Q=Math.min(.5,.2+V*.2),z=Cesium.Color.fromBytes(255,96,80,Math.round(Q*255)),I=Cesium.Color.fromBytes(255,215,0,255);l.push(new Cesium.GeometryInstance({geometry:O,modelMatrix:k,attributes:{color:Cesium.ColorGeometryInstanceAttribute.fromColor(z)}})),i.push(new Cesium.GeometryInstance({geometry:U,modelMatrix:k,attributes:{color:Cesium.ColorGeometryInstanceAttribute.fromColor(I)}}))}return l.length===0?null:{fill:new Cesium.Primitive({geometryInstances:l,appearance:new Cesium.PerInstanceColorAppearance({translucent:!0,closed:!0,flat:!1}),asynchronous:!1}),outline:new Cesium.Primitive({geometryInstances:i,appearance:new Cesium.PerInstanceColorAppearance({translucent:!1,closed:!1,flat:!0}),asynchronous:!1})}}return{update(m){t(c),t(n),c=null,n=null;const v=r(m);v&&(c=v.fill,n=v.outline,s.primitives.add(c),s.primitives.add(n))},clear(){t(c),t(n),c=null,n=null},destroy(){t(c),t(n),c=null,n=null}}}function je(s,c){c&&!c.isDestroyed()&&s.primitives.remove(c)}function gt(s,c,n,t=12){const r=[];for(let m=0;m<=t;m++){const v=m/t,M=Cesium.Math.lerp(c.lon,n.lon,v),P=Cesium.Math.lerp(c.lat,n.lat,v),l=Cesium.Cartographic.fromDegrees(M,P),i=s.globe.getHeight(l);r.push(Cesium.Cartesian3.fromDegrees(M,P,Number.isFinite(i)?i+.35:.35))}return r}function bt(s,c){if(!Array.isArray(c)||c.length<2)return[];const n=[];for(let t=0;t<c.length;t++){const r=c[t],m=c[(t+1)%c.length],v=gt(s,r,m);t>0&&v.shift(),n.push(...v)}return n}function yt(s,c={}){const n=Cesium.Color.fromCssColorString(c.strokeColor||"#58d0ff"),t=Cesium.Color.fromCssColorString(c.fillColor||"#58d0ff").withAlpha(Number.isFinite(c.fillAlpha)?c.fillAlpha:.16);let r=null,m=null;function v(){je(s,r),je(s,m),r=null,m=null}return{setPolygon(M){if(v(),!Array.isArray(M)||M.length<3)return;const P=bt(s,M),l=M.map(i=>{const h=Cesium.Cartographic.fromDegrees(i.lon,i.lat),p=s.globe.getHeight(h);return Cesium.Cartesian3.fromDegrees(i.lon,i.lat,Number.isFinite(p)?p+.3:.3)});r=new Cesium.PolylineCollection,r.add({positions:P,width:3,material:Cesium.Material.fromType("Color",{color:n})}),s.primitives.add(r),m=new Cesium.Primitive({geometryInstances:new Cesium.GeometryInstance({geometry:new Cesium.PolygonGeometry({polygonHierarchy:new Cesium.PolygonHierarchy(l),perPositionHeight:!0,vertexFormat:Cesium.PerInstanceColorAppearance.VERTEX_FORMAT}),attributes:{color:Cesium.ColorGeometryInstanceAttribute.fromColor(t)}}),appearance:new Cesium.PerInstanceColorAppearance({translucent:!0,closed:!1}),asynchronous:!1}),s.primitives.add(m)},clear:v,destroy(){v()}}}function vt(s){const c=Cesium.Cartographic.fromCartesian(s);return{lon:Cesium.Math.toDegrees(c.longitude),lat:Cesium.Math.toDegrees(c.latitude),height:Number.isFinite(c.height)?c.height:0}}function Ct(s,c,n,t){const m=111e3*Math.cos(c*Math.PI/180);return{lon:s+n/Math.max(1e-6,m),lat:c+t/111e3}}function xt(s,c,n,t,r,m,v,M){const l=111e3*Math.cos((M+c)/2*Math.PI/180),i=Math.round((s-v)*l/m),h=Math.round((c-M)*111e3/m);return i<0||i>=t||h<0||h>=r?0:n[h*t+i]||0}function Mt(s){return Math.max(1,Math.round(s/4))}const Ke=new WeakMap;function Oe(s){if(!(s!=null&&s.primitives))return[];const c=s.primitives.length,n=Ke.get(s);if(n&&n.primitiveCount===c)return n.items;const t=[];for(let r=0;r<c;r++){const m=s.primitives.get(r);!m||m.imageBasedLighting===void 0||m.boundingSphere&&t.push({index:r,prim:m})}return Ke.set(s,{primitiveCount:c,items:t}),t}function wt(s,c,n,t,r,m,v){var i;const M=[];let P=0;const l=Oe(s);for(const h of l){const p=h.index,b=h.prim,w=(i=b.boundingSphere)==null?void 0:i.center;if(!w)continue;const{lon:x,lat:A,height:$}=vt(w),D=b.boundingSphere.radius||10,L=Math.max(4,Math.min(40,D*.3)),_=[[0,0],[L*.4,0],[-L*.4,0],[0,L*.4],[0,-L*.4],[L*.8,0],[-L*.8,0],[0,L*.8],[0,-L*.8],[L*.55,L*.55],[L*.55,-L*.55],[-L*.55,L*.55],[-L*.55,-L*.55]];let k=0,O=0,U=0;for(const[Z,J]of _){const te=Ct(x,A,Z,J),T=xt(te.lon,te.lat,c,n,t,r,m,v);T>=.003&&(k+=1),T>O&&(O=T),U+=T}if(k===0||O<.003)continue;const V=U/_.length,Q=k/_.length,z=Mt(D),I=Math.min(5,D/20),B=(.65*O+.35*V)*z*I*(.7+Q*.6);M.push({id:`tileset-${p}-${P++}`,lon:x.toFixed(5),lat:A.toFixed(5),depth:Math.round(O*100)/100,meanDepth:Math.round(V*100)/100,wetFraction:Math.round(Q*100)/100,floors:z,score:Math.round(B*10)/10,footprintRadiusM:Math.round(L),centerHeightM:Math.round($),label:`Gebäude ~(${x.toFixed(3)}°, ${A.toFixed(3)}°)`})}return M.sort((h,p)=>p.score-h.score),M.slice(0,20)}function St(s){return Oe(s).length}const Lt=`
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
.hs-layer-hint {
  margin-top: 6px;
  padding: 6px 8px;
  border-radius: 6px;
  background: #1e2a30;
  border: 1px solid #32434a;
  font-size: 0.71rem;
  color: #b0bec5;
  line-height: 1.35;
}
.hs-layer-hint.rescue {
  background: #2f2420;
  border-color: #7d4f2c;
  color: #ffd8b0;
}
.hs-layer-hint.water {
  background: #1e2a30;
  border-color: #35515d;
  color: #c5e3f3;
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
.hs-measure-actions {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 6px;
  margin-top: 6px;
}
.hs-measure-btn {
  background: #263238;
  color: #fff;
  border: 1px solid #6d2b36;
  border-radius: 6px;
  padding: 5px 8px;
  font-size: 0.74rem;
  cursor: pointer;
}
.hs-measure-btn:hover:not(:disabled) {
  background: #3a1d24;
}
.hs-measure-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.hs-measure-count {
  align-self: center;
  font-size: 0.72rem;
  color: #90a4ae;
  min-width: 54px;
  text-align: right;
}
`,Pt=`
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
    <div class="hs-measure-actions">
      <button id="hs-measure-pump-place" class="hs-measure-btn">
        <i class="bi bi-crosshair"></i> Pumpen platzieren
      </button>
      <span id="hs-measure-pump-count" class="hs-measure-count">0 gesetzt</span>
    </div>
    <label class="hs-measure-row">
      <span><i class="bi bi-bricks"></i> Mobile Deiche</span>
      <input id="hs-measure-dike" type="checkbox">
    </label>
    <div class="hs-measure-actions">
      <button id="hs-measure-dike-place" class="hs-measure-btn">
        <i class="bi bi-bezier2"></i> Deichlinie zeichnen
      </button>
      <span id="hs-measure-dike-count" class="hs-measure-count">0 gesetzt</span>
    </div>
    <label class="hs-measure-row">
      <span><i class="bi bi-tree"></i> Retentionsflächen</span>
      <input id="hs-measure-retention" type="checkbox">
    </label>
    <div class="hs-measure-actions">
      <button id="hs-measure-ret-place" class="hs-measure-btn">
        <i class="bi bi-bounding-box"></i> Fläche zeichnen
      </button>
      <span id="hs-measure-ret-count" class="hs-measure-count">0 gesetzt</span>
    </div>
    <div class="hs-label" style="margin-top:6px">
      Maßnahmen-Intensität
      <span><span id="hs-measure-level-val">40</span>%</span>
    </div>
    <input type="range" class="hs-range" id="hs-measure-level"
           min="0" max="100" step="5" value="40">
    <div class="hs-measure-help">
      Wirkt auf die Stärke platzierter Maßnahmen. Aktivierte, aber nicht platzierte Maßnahmen werden ignoriert.
    </div>
    <div class="hs-analysis-row" style="margin-top:8px">
      <button id="hs-measure-clear-all" class="hs-analysis-btn">
        <i class="bi bi-trash"></i> Maßnahmen zurücksetzen
      </button>
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
    <div id="hs-layer-hint" class="hs-layer-hint">
      Aktive Layer-Legende: Wasser zeigt Tiefe in Blau. Rettungs-Heatmap zeigt Priorität in warmen Farben.
    </div>
    <div class="hs-analysis-row">
      <button id="hs-export-geojson" class="hs-analysis-btn">
        <i class="bi bi-download"></i> Ergebnis als GeoJSON exportieren
      </button>
    </div>
  </div>

</div>
`;function kt(){const s=document.createElement("style");s.textContent=Lt,document.head.appendChild(s);const c=document.createElement("button");c.id="hydrosim-trigger",c.title="HydroSim — Hochwassersimulation",c.innerHTML='<i class="bi bi-water"></i>',document.body.appendChild(c);const n=document.createElement("div");n.id="hydrosim-panel",n.innerHTML=Pt,document.body.appendChild(n);const t=f=>document.getElementById(f),r=t("hs-draw-btn"),m=t("hs-draw-label"),v=t("hs-draw-hint"),M=t("hs-run"),P=t("hs-pause"),l=t("hs-reset"),i=t("hs-status"),h=t("hs-progress"),p=t("hs-progress-bar"),b=t("hs-volume"),w=t("hs-duration"),x=t("hs-speed"),A=t("hs-profile"),$=t("hs-profile-help"),D=t("hs-mode"),L=t("hs-mode-help"),_=t("hs-quality-note"),k=t("hs-vol-val"),O=t("hs-dur-val"),U=t("hs-speed-val"),V=t("hs-measure-pump"),Q=t("hs-measure-dike"),z=t("hs-measure-retention"),I=t("hs-measure-level"),B=t("hs-measure-level-val"),Z=t("hs-measure-pump-place"),J=t("hs-measure-dike-place"),te=t("hs-measure-ret-place"),T=t("hs-measure-clear-all"),fe=t("hs-measure-pump-count"),ae=t("hs-measure-dike-count"),re=t("hs-measure-ret-count"),de=t("hs-impact-section"),me=t("hs-impact-count"),ge=t("hs-impact-tbody"),ve=t("hs-layer-strategy"),se=t("hs-layer-active"),ce=t("hs-layer-count"),xe=t("hs-layer-clear"),Ce=t("hs-layer-clear-all"),he=t("hs-layer-hint"),be=t("hs-export-geojson");let Me="idle",pe=!0;c.addEventListener("click",()=>{n.classList.toggle("visible")}),t("hs-close").addEventListener("click",()=>{n.classList.remove("visible")}),A.addEventListener("change",()=>{$.textContent=A.value==="advanced"?"Advanced: stabilere Extremereignisse, strengere Solver-Grenzen, Analysefokus.":"Standard für schnelle Szenarien. Advanced nutzt robuste Extrem-Defaults."}),D.addEventListener("change",()=>{L.textContent=D.value==="auto"?"Automatik wählt den Ereignistyp anhand von Volumen und Dauer.":`Manueller Modus: ${D.options[D.selectedIndex].text}`});function le(){const f=se.options[se.selectedIndex],j=(f==null?void 0:f.textContent)||"",R=j.includes("Rettungs-Heatmap"),Y=j.includes("Wasser");if(he.classList.remove("rescue","water"),R){he.classList.add("rescue"),he.textContent="Aktive Layer-Legende: Rettungs-Heatmap. Warme Farben markieren hohe Rettungspriorität.";return}if(Y){he.classList.add("water"),he.textContent="Aktive Layer-Legende: Wasser. Blautöne zeigen Wassertiefe und Dynamik.";return}he.textContent="Aktive Layer-Legende: Keine Analyse ausgewählt."}return se.addEventListener("change",()=>{le()}),b.addEventListener("input",()=>{k.textContent=Number(b.value).toLocaleString("de-DE")}),w.addEventListener("input",()=>{O.textContent=w.value}),x.addEventListener("input",()=>{U.textContent=x.value}),I.addEventListener("input",()=>{B.textContent=I.value}),{panel:n,trigger:c,getParams(){return{volumeM3:Number(b.value),durationMin:Number(w.value),durationS:Number(w.value)*60,speed:Number(x.value),profile:A.value||"standard",mode:D.value||"auto",measures:{pump:!!V.checked,dike:!!Q.checked,retention:!!z.checked,level:Number(I.value)/100}}},onDraw(f){r.addEventListener("click",f)},onRun(f){M.addEventListener("click",f)},onPause(f){P.addEventListener("click",f)},onReset(f){l.addEventListener("click",f)},onExport(f){be.addEventListener("click",f)},onLayerClear(f){xe.addEventListener("click",f)},onLayerClearAll(f){Ce.addEventListener("click",f)},onLayerActiveChange(f){se.addEventListener("change",f)},onPlacePump(f){Z.addEventListener("click",f)},onPlaceDike(f){J.addEventListener("click",f)},onPlaceRetention(f){te.addEventListener("click",f)},onMeasureClearAll(f){T.addEventListener("click",f)},getLayerStrategy(){return ve.value||"append"},getActiveLayerId(){return se.value||""},setAnalysisLayers(f,j){se.innerHTML="";for(const R of f){const Y=document.createElement("option");Y.value=R.id,Y.textContent=R.label,j&&j===R.id&&(Y.selected=!0),se.appendChild(Y)}if(f.length===0){const R=document.createElement("option");R.value="",R.textContent="Keine Analyse vorhanden",se.appendChild(R)}ce.textContent=String(f.length),xe.disabled=f.length===0,Ce.disabled=f.length===0,le()},setQuality(f,j=""){const R=f==="analysis-3d"?"Qualitätsstufe: Analyse (3D)":"Qualitätsstufe: Vorschau (2D)";_.textContent=j?`${R} · ${j}`:R,_.style.color=f==="analysis-3d"?"#a5d6a7":"#ffcc80"},setState(f){Me=f,r.disabled=!pe||["drawing","sampling","running"].includes(f),M.disabled=!pe||!["ready","paused"].includes(f),P.disabled=f!=="running",l.disabled=f==="sampling";const j=!pe||["sampling","running"].includes(f);Z.disabled=j,J.disabled=j,te.disabled=j,T.disabled=j,f==="drawing"?(m.textContent="Zeichnen…",r.classList.add("active"),v.style.display="block"):(m.textContent="Polygon zeichnen",r.classList.remove("active"),v.style.display="none"),f==="idle"&&de.classList.remove("visible"),f==="results"&&de.classList.add("visible");const R=["ready","running","paused","results"].includes(f);be.disabled=!R},setGate(f){pe=!!f,this.setState(Me)},setStatus(f,j="bi-info-circle"){i.innerHTML=f?`<i class="bi ${j}"></i> ${f}`:""},setProgress(f){f===null?(h.style.display="none",p.style.width="0%"):(h.style.display="block",p.style.width=`${Math.round(f*100)}%`)},setImpact(f){if(!f||f.length===0){me.textContent="0",ge.innerHTML='<tr><td colspan="3" style="color:#607d8b;text-align:center">Keine Gebäude betroffen</td></tr>';return}me.textContent=f.length;const j=f[0].score;ge.innerHTML=f.slice(0,10).map(R=>`<tr>
          <td><span class="hs-score-bar" style="width:${Math.round(R.score/j*60)}px"></span>${R.score}</td>
          <td>${R.depth} m</td>
          <td style="font-size:0.65rem">${R.lon}°<br>${R.lat}°</td>
        </tr>`).join("")},setMeasureCounts(f={}){const j=Number.isFinite(f.pump)?f.pump:0,R=Number.isFinite(f.dike)?f.dike:0,Y=Number.isFinite(f.retention)?f.retention:0;fe.textContent=`${j} gesetzt`,ae.textContent=`${R} gesetzt`,re.textContent=`${Y} gesetzt`}}}const At={standard:{maxInteractiveCameraHeightM:8e3,solver:{renderEveryFrames:2,maxDepthForDt:4,minDepthForDt:.01,cfl:.55,dtCap:.65,targetSubstepDt:.1,maxSourceStepM:22e-5,maxDisplayDepth:20,baseFriction:.045,minFriction:.015,frictionBoost:{dike:.55,retention:.35,pump:.15}},modeFactors:{rain:{inflow:1,friction:1},flash:{inflow:1.35,friction:.8},river:{inflow:1,friction:.75}}},advanced:{maxInteractiveCameraHeightM:8e3,solver:{renderEveryFrames:2,maxDepthForDt:3,minDepthForDt:.02,cfl:.5,dtCap:.5,targetSubstepDt:.07,maxSourceStepM:2e-4,maxDisplayDepth:15,baseFriction:.05,minFriction:.02,frictionBoost:{dike:.6,retention:.4,pump:.18}},modeFactors:{rain:{inflow:1,friction:1},flash:{inflow:1.3,friction:.82},river:{inflow:.98,friction:.78}}}};function ze(s){return Math.max(0,Math.min(1,Number.isFinite(s)?s:0))}function Ae(s){if(s.mode&&s.mode!=="auto")return s.mode;const c=s.volumeM3/Math.max(60,s.durationS);return c<110?"rain":s.durationS>=3*3600&&c<280?"river":"flash"}function De(s){const c=(s==null?void 0:s.profile)==="advanced"?"advanced":"standard";return At[c]}function Dt(s,c){return!s||!c?!1:s.nx===c.nx&&s.ny===c.ny&&Math.round(s.dx*1e3)===Math.round(c.dx*1e3)}function Ue(s,c){for(let n=0;n<s.length;n++){const t=s[n],r=c[n];s[n]=Number.isFinite(t)&&Number.isFinite(r)?Math.max(t,r):Number.isFinite(t)?t:Number.isFinite(r)?r:0}}function Ft(s,c=new Date){const n=String(c.getHours()).padStart(2,"0"),t=String(c.getMinutes()).padStart(2,"0");return`A${s} ${n}:${t}`}function It(s,c=()=>{}){const n=new Map;let t=null,r=1;function m(){return`analysis-${Date.now()}-${r++}`}function v(){return Array.from(n.values()).map(l=>({id:l.id,label:`${l.name} · ${l.kind==="rescue"?"Rettungs-Heatmap":"Wasser"} (${l.meta.nx}x${l.meta.ny})`}))}function M(){c(v(),t)}function P(l){s==null||s.upsertStaticLayer(l.id,l.depth,l.bed,l.meta.nx,l.meta.ny,l.meta.dx,l.meta.originLon,l.meta.originLat,l.meta.baseElevation||0,l.rescueHeat||null)}return{setActive(l){t=l&&n.has(l)?l:null,M()},getActiveId(){return t},getActiveLayer(){return t?n.get(t):null},getAll(){return n},upsertFromSnapshot(l,i,h={}){if(!l)return{merged:!1,created:!1};const p=h.kind==="rescue"?"rescue":"water",b=h.activate!==!1;let w=t;const x=w&&n.has(w),A=i==="append"&&x&&n.get(w).kind===p&&Dt(n.get(w).meta,l.meta);if(i==="new"||!A){w=m();const D=Ft(n.size+1),L={id:w,name:D,kind:p,meta:l.meta,depth:new Float32Array(l.depth),bed:new Float32Array(l.bed),rescueHeat:l.rescueHeat?new Float32Array(l.rescueHeat):null};return n.set(w,L),b&&(t=w),P(L),M(),{merged:!1,created:!0}}const $=n.get(w);return Ue($.depth,l.depth),l.rescueHeat&&(!$.rescueHeat||$.rescueHeat.length!==l.rescueHeat.length?$.rescueHeat=new Float32Array(l.rescueHeat):Ue($.rescueHeat,l.rescueHeat)),P($),M(),{merged:!0,created:!1}},clearActive(){t&&(s==null||s.removeStaticLayer(t),n.delete(t),t=n.keys().next().value||null,M())},clearAll(){s==null||s.clearStaticLayers(),n.clear(),t=null,M()}}}(async function(){const c=(...e)=>console.log("[HydroSim]",...e),n=(...e)=>console.error("[HydroSim]",...e);let t=null,r=null;const m=new Map;function v(){var e,a,u,o;return((o=(u=(a=(e=window.mapCollection)==null?void 0:e.getMap)==null?void 0:a.call(e,"3D"))==null?void 0:u.getCesiumScene)==null?void 0:o.call(u))??null}function M(){var a,u,o,d,g,y;const e=(d=(o=(u=(a=document.getElementById("masterportal-root"))==null?void 0:a.__vue_app__)==null?void 0:u.config)==null?void 0:o.globalProperties)==null?void 0:d.$store;return((y=(g=e==null?void 0:e.state)==null?void 0:g.Maps)==null?void 0:y.mode)??null}async function P(){var a,u,o,d,g,y;const e=(d=(o=(u=(a=document.getElementById("masterportal-root"))==null?void 0:a.__vue_app__)==null?void 0:u.config)==null?void 0:o.globalProperties)==null?void 0:d.$store;if(!e)return!1;if(((y=(g=e.state)==null?void 0:g.Maps)==null?void 0:y.mode)==="3D")return!0;try{return await e.dispatch("Maps/activateMap3d"),!0}catch{try{return await e.dispatch("Maps/changeMapMode","3D"),!0}catch{return!1}}}async function l(){return new Promise(e=>{const a=setInterval(()=>{window.Cesium&&v()&&(clearInterval(a),e())},500)})}try{const e=`/hydrosim.wasm?v=${Date.now()}`;let a;try{a=await WebAssembly.instantiateStreaming(fetch(e,{cache:"no-store"}),{env:{abort(u,o,d,g){n(`WASM abort at ${o}:${d}:${g}`,u)}}})}catch{const d=await(await fetch(e,{cache:"no-store"})).arrayBuffer();a=await WebAssembly.instantiate(d,{env:{abort(g,y,C,F){n(`WASM abort at ${y}:${C}:${F}`,g)}}})}t=a.instance.exports,r=t.memory,c("WASM loaded.")}catch(e){n("WASM load failed:",e)}await l();const i=kt();if(i.setState("idle"),!t){i.setStatus("WASM konnte nicht geladen werden — Simulation deaktiviert","bi-exclamation-triangle");return}let h="idle",p=null,b=null,w=null,x=null,A=null,$=null,D=null,L=0,_=0;const k=new Map,O=10;let U=1,V=null,Q=null;const z={pump:[],dike:[],retention:[]},I={pump:[],dike:[],retention:[]};let B=null;function Z(e,a,u,o){const d=Number.isFinite(e)?e:a,g=Math.min(u,Math.max(a,d));if(g!==d){const y=(m.get(o)||0)+1;m.set(o,y),(y===1||y%20===0)&&c(`Clamp ${o}: in=${d}, out=${g}, count=${y}`)}return g}function J(){return M()==="3D"?"analysis-3d":"preview-2d"}function te(e=""){i.setQuality(J(),e)}function T(e){h=e,i.setState(e),c("State ->",e)}function fe(){const e=v();e&&(x||(x=pt(e)),A||(A=ft(e)),$||($=yt(e)))}function ae(){const e=v();!e||!window.Cesium||(V||(V=new window.Cesium.PointPrimitiveCollection,e.primitives.add(V)),Q||(Q=new window.Cesium.PolylineCollection,e.primitives.add(Q)))}function re(e){var g,y;const a=v(),u=window.Cesium.Cartographic.fromDegrees(e.lon,e.lat),o=(y=(g=a==null?void 0:a.globe)==null?void 0:g.getHeight)==null?void 0:y.call(g,u),d=Number.isFinite(o)?o+1:((b==null?void 0:b.baseElevation)||0)+1;return window.Cesium.Cartesian3.fromDegrees(e.lon,e.lat,d)}function de(){if(window.Cesium&&(ae(),!(!V||!Q))){V.removeAll(),Q.removeAll();for(const e of z.pump)V.add({position:re(e.coord),pixelSize:9,color:window.Cesium.Color.fromCssColorString("#00e5ff"),outlineColor:window.Cesium.Color.WHITE,outlineWidth:1});for(const e of z.dike){if(!Array.isArray(e.coords)||e.coords.length<2)continue;const a=e.coords.map(re);Q.add({positions:a,width:3,material:window.Cesium.Material.fromType("Color",{color:window.Cesium.Color.fromCssColorString("#ffb300")}),loop:!1})}for(const e of z.retention){if(!Array.isArray(e.coords)||e.coords.length<3)continue;const a=e.coords.map(re);a.push(re(e.coords[0])),Q.add({positions:a,width:2,material:window.Cesium.Material.fromType("Color",{color:window.Cesium.Color.fromCssColorString("#7cb342")}),loop:!1})}}}function me(){i.setMeasureCounts({pump:z.pump.length,dike:z.dike.length,retention:z.retention.length})}function ge(e=""){z.pump.length=0,z.dike.length=0,z.retention.length=0,I.pump.length=0,I.dike.length=0,I.retention.length=0,B=null,k.clear(),de(),me(),e&&i.setStatus(e,"bi-info-circle")}function ve(e,a,u){if(!e)return null;const o=111e3,d=e.originLat+e.ny*e.dx/o*.5,g=111e3*Math.cos(d*Math.PI/180),y=Math.round((a-e.originLon)*g/e.dx),C=Math.round((u-e.originLat)*o/e.dx);return!Number.isFinite(y)||!Number.isFinite(C)||y<0||y>=e.nx||C<0||C>=e.ny?null:{col:y,row:C}}function se(e,a,u){const d=e.originLat+e.ny*e.dx/111e3*.5,g=111e3*Math.cos(d*Math.PI/180);return{lon:e.originLon+(a+.5)*e.dx/g,lat:e.originLat+(u+.5)*e.dx/111e3}}function ce(e,a){const u=[];let o=e.col,d=e.row;const g=a.col,y=a.row,C=Math.abs(g-o),F=o<g?1:-1,E=-Math.abs(y-d),W=d<y?1:-1;let q=C+E;for(;u.push({col:o,row:d}),!(o===g&&d===y);){const S=2*q;S>=E&&(q+=E,o+=F),S<=C&&(q+=C,d+=W)}return u}function xe(e,a,u){let o=!1;for(let d=0,g=u.length-1;d<u.length;g=d++){const y=u[d].lon,C=u[d].lat,F=u[g].lon,E=u[g].lat;C>a!=E>a&&e<(F-y)*(a-C)/(E-C||1e-9)+y&&(o=!o)}return o}function Ce(){if(I.pump.length=0,I.dike.length=0,I.retention.length=0,!b)return;for(const u of z.pump){const o=ve(b,u.coord.lon,u.coord.lat);o&&I.pump.push({id:u.id,cx:o.col,cy:o.row,radius:2})}const e=new Set;for(const u of z.dike)if(!(!Array.isArray(u.coords)||u.coords.length<2))for(let o=0;o<u.coords.length-1;o++){const d=ve(b,u.coords[o].lon,u.coords[o].lat),g=ve(b,u.coords[o+1].lon,u.coords[o+1].lat);if(!(!d||!g))for(const y of ce(d,g))e.add(y.row*b.nx+y.col)}I.dike.push(...Array.from(e));const a=new Set;for(const u of z.retention)if(!(!Array.isArray(u.coords)||u.coords.length<3))for(let o=0;o<b.ny;o++)for(let d=0;d<b.nx;d++){const g=se(b,d,o);xe(g.lon,g.lat,u.coords)&&a.add(o*b.nx+d)}I.retention.push(...Array.from(a))}function he(){const e=z.pump.slice(0,20).map(o=>`${o.coord.lon.toFixed(5)}:${o.coord.lat.toFixed(5)}`).join(","),a=z.dike.slice(0,10).map(o=>o.coords.slice(0,5).map(d=>`${d.lon.toFixed(4)}:${d.lat.toFixed(4)}`).join(";")).join("|"),u=z.retention.slice(0,10).map(o=>o.coords.slice(0,5).map(d=>`${d.lon.toFixed(4)}:${d.lat.toFixed(4)}`).join(";")).join("|");return`pc=${z.pump.length}:${e}|dc=${z.dike.length}:${a}|rc=${z.retention.length}:${u}`}function be(e,a,u,o,d,g,y){const C=Math.max(1,Math.round(g)),F=Math.max(0,o-C),E=Math.min(a-1,o+C),W=Math.max(0,d-C),q=Math.min(u-1,d+C),S=Math.max(1,C*.5),H=1/(2*S*S);for(let N=W;N<=q;N++)for(let G=F;G<=E;G++){const X=G-o,K=N-d,ee=X*X+K*K;if(ee>C*C)continue;const ne=N*a+G,ie=Math.exp(-ee*H)*y;e[ne]=Math.max(e[ne],ie)}}function Me(e,a,u,o,d,g,y,C,F){const E=o*d,W=new Float32Array(E),q=new Float32Array(E);for(const S of y)be(W,o,d,S.cx,S.cy,10,.95*g);for(const S of C){if(S<0||S>=E)continue;const H=Math.floor(S/o),N=S-H*o;be(W,o,d,N,H,5,.55*g)}for(const S of F){if(S<0||S>=E)continue;const H=Math.floor(S/o),N=S-H*o;be(W,o,d,N,H,6,.7*g)}for(let S=0;S<E;S++){const H=Number.isFinite(e[S])?e[S]:0;if(H<=.002){q[S]=0;continue}const N=Number.isFinite(a[S])?a[S]:0,G=Number.isFinite(u[S])?u[S]:0,X=Math.sqrt(N*N+G*G),K=Math.max(0,Math.min(1,H/1.8)),ee=Math.max(0,Math.min(1,X/2.5)),ne=K*.72+ee*.28,ie=Math.max(0,Math.min(1,W[S]));q[S]=Math.max(0,Math.min(1,ne*(1-.62*ie)))}return q}function pe(e={}){const a=e.includeRescueHeat===!0;if(!b||!r||!t)return null;const{nx:u,ny:o,dx:d,originLon:g,originLat:y,baseElevation:C=0}=b,F=u*o,E=new Float32Array(r.buffer,t.hPtr(),F),W=new Float32Array(r.buffer,t.zbPtr(),F),q=a&&B&&B.length===F?new Float32Array(B):null;return{meta:{nx:u,ny:o,dx:d,originLon:g,originLat:y,baseElevation:C},depth:new Float32Array(E),bed:new Float32Array(W),rescueHeat:q}}const le=It({upsertStaticLayer:(...e)=>x==null?void 0:x.upsertStaticLayer(...e),removeStaticLayer:e=>x==null?void 0:x.removeStaticLayer(e),clearStaticLayers:()=>x==null?void 0:x.clearStaticLayers()},(e,a)=>i.setAnalysisLayers(e,a));function f(){const e=le.getActiveLayer(),a=e?{meta:e.meta,depth:e.depth}:pe();if(!a){i.setStatus("Kein Ergebnis zum Export vorhanden.","bi-exclamation-circle");return}const{nx:u,ny:o,dx:d,originLon:g,originLat:y}=a.meta,C=a.depth,F=111e3,E=y+o/2*d/F,W=111e3*Math.cos(E*Math.PI/180),q=d/W,S=d/F,H=[],N=Math.max(1,Math.floor(Math.sqrt(u*o/9e3)));for(let ne=0;ne<o;ne+=N)for(let ie=0;ie<u;ie+=N){const we=C[ne*u+ie];if(!Number.isFinite(we)||we<.05)continue;const Re=g+(ie+.5)*q,Ne=y+(ne+.5)*S;H.push({type:"Feature",geometry:{type:"Point",coordinates:[Re,Ne]},properties:{depth_m:Math.round(we*1e3)/1e3,row:ne,col:ie,cell_m:Math.round(d*100)/100}})}const G={type:"FeatureCollection",properties:{generatedAt:new Date().toISOString(),nx:u,ny:o,dx:d,sourceLayer:(e==null?void 0:e.name)||"current-run",qualityFlag:J(),profile:i.getParams().profile||"standard",selectedMode:i.getParams().mode||"auto",resolvedMode:Ae(i.getParams()),durationS:i.getParams().durationS,volumeM3:i.getParams().volumeM3,measures:i.getParams().measures||{}},features:H},X=new Blob([JSON.stringify(G)],{type:"application/geo+json"}),K=URL.createObjectURL(X),ee=document.createElement("a");ee.href=K,ee.download=`hydrosim-${(e==null?void 0:e.id)||"current"}-${Date.now()}.geojson`,document.body.appendChild(ee),ee.click(),ee.remove(),setTimeout(()=>URL.revokeObjectURL(K),1e3),i.setStatus(`Export erstellt (${H.length} Features)`,"bi-download")}function j(){le.clearActive()}function R(){le.clearAll()}function Y(){const e=i.getParams(),a=De(e),u=v(),o=u==null?void 0:u.camera;if(!o||!window.Cesium)return!1;const d=window.Cesium.Cartographic.fromCartesian(o.positionWC);return Number.isFinite(d.height)&&d.height<=a.maxInteractiveCameraHeightM}function ye(){const e=Y();return i.setGate(e),!e&&h==="idle"&&(te("3D für belastbare Analysen erforderlich"),i.setStatus(`Für HydroSim näher heranzoomen (Kamerahöhe < ${De(i.getParams()).maxInteractiveCameraHeightM} m).`,"bi-zoom-in")),e&&h==="idle"&&(te("Analysemodus aktiv"),i.setStatus("Bereit — Polygon zeichnen um zu beginnen","bi-info-circle")),e}function Ve(){const e=v(),a=e==null?void 0:e.camera;if(!a||!window.Cesium)return 50;const o=window.Cesium.Cartographic.fromCartesian(a.positionWC).height;return Number.isFinite(o)?o<2500?20:o<5e3?30:50:50}function Et(e){const a=De(i.getParams());return a.modeFactors[e]||a.modeFactors.rain}async function $t(e){T("sampling"),i.setStatus("Terrain wird abgetastet…","bi-hourglass-split"),i.setProgress(.05);try{const a=Ve();b=await dt(e,p,a,F=>i.setProgress(F*.9)),i.setProgress(1);const{heights:u,nx:o,ny:d,dx:g}=b;if(t.init(o,d,g)<0)throw new Error("WASM init failed: not enough memory for grid");r=t.memory;const C=t.scratchPtr();new Float32Array(r.buffer,C,o*d).set(u),t.setTerrain(C,o*d),Ce(),de(),k.clear(),setTimeout(()=>i.setProgress(null),500),T("ready"),i.setStatus(`Bereit. Grid: ${o}x${d}, dx=${g.toFixed(0)}m`,"bi-check-circle")}catch(a){n("Terrain sampling failed:",a),i.setProgress(null),T("idle"),i.setStatus("Terrain-Abfrage fehlgeschlagen: "+a.message,"bi-exclamation-triangle")}}function zt(e,a,u,o,d,g){const y=e.reduce((K,ee)=>K+ee.lon,0)/e.length,C=e.reduce((K,ee)=>K+ee.lat,0)/e.length,F=111320,E=111320*Math.cos(C*Math.PI/180),W=Math.round((y-d)*E/o),q=Math.round((C-g)*F/o),S=e.map(K=>K.lon),H=e.map(K=>K.lat),N=(Math.max(...S)-Math.min(...S))*E/o,G=(Math.max(...H)-Math.min(...H))*F/o,X=Math.max(2,Math.round(Math.min(N,G)*.25));return{cx:Math.max(X,Math.min(a-1-X,W)),cy:Math.max(X,Math.min(u-1-X,q)),radius:X}}function Qe(e,a,u,o,d,g,y){if(!e||!Number.isFinite(a)||a<=0)return{radius:(e==null?void 0:e.radius)||1,depthPerStep:0};const C=Math.max(1,Math.floor(Math.min(e.cx,d-1-e.cx,e.cy,g-1-e.cy))),F=Math.max(1,Math.min(C,e.radius)),W=a*u/Math.max(1e-8,y),q=Math.max(1,W/(o*o)),S=Math.max(F,Math.ceil(Math.sqrt(q/Math.PI))),H=Math.min(C,S),G=Math.max(1,Math.PI*H*H)*o*o,X=Z(a/G*u,0,y,"sourceDepthStep");return{radius:H,depthPerStep:X}}function Ht(){const e=i.getParams(),a=Ae(e),u=e.profile==="advanced"?"advanced":"standard",o=e.measures||{},d=(p||[]).slice(0,12).map(C=>`${C.lon.toFixed(5)}:${C.lat.toFixed(5)}`).join("|"),g=b?`${b.nx}x${b.ny}@${Math.round(b.dx)}`:"nogrid",y=he();return`${g}|v=${e.volumeM3}|d=${e.durationS}|m=${a}|pr=${u}|ml=${ze(o.level).toFixed(2)}|mp=${o.pump?1:0}|md=${o.dike?1:0}|mr=${o.retention?1:0}|mh=${y}|p=${d}`}function Tt(e,a,u,o,d,g,y){return new Promise(C=>{const F=()=>C(wt(e,a,u,o,d,g,y));typeof window.requestIdleCallback=="function"?window.requestIdleCallback(F,{timeout:250}):setTimeout(F,0)})}async function Rt(){cancelAnimationFrame(D),D=null,T("results"),i.setProgress(null),i.setStatus("Berechne betroffene Gebäude…","bi-buildings");try{const{nx:e,ny:a,dx:u,originLon:o,originLat:d}=b,g=new Float32Array(r.buffer,t.hPtr(),e*a),y=v(),C=Ht(),F=y?St(y):0;let E=k.get(C);const W=!!E;if(!E&&(E=y?await Tt(y,g,e,a,u,o,d):[],k.set(C,E),k.size>O)){const G=k.keys().next().value;k.delete(G)}i.setImpact(E),fe(),A==null||A.update(E);const q=pe({includeRescueHeat:!1}),S=pe({includeRescueHeat:!0}),H=le.upsertFromSnapshot(q,i.getLayerStrategy(),{kind:"water",activate:!0});le.upsertFromSnapshot(S,"new",{kind:"rescue",activate:!1});const N=J()==="analysis-3d"?"Analyse (3D)":"Vorschau (2D)";if(F===0)i.setStatus(`Fertig · ${N} · keine LoD2-Gebäudelayer geladen (Impact = 0)${W?" · Cache-Hit":""}`,"bi-info-circle");else{const G=H.merged?"Layer ergänzt":H.created?"Layer neu":"Layer unverändert";i.setStatus(`Fertig · ${N} · ${E.length} Gebäude betroffen · ${G}${W?" · Cache-Hit":""}`,"bi-check-circle")}}catch(e){n("Impact analysis failed:",e),i.setStatus("Simulation beendet (Impact-Analyse fehlgeschlagen)","bi-exclamation-triangle")}}function Ze(e){var H,N,G,X;const{nx:a,ny:u,dx:o,originLon:d,originLat:g,baseElevation:y=0}=b,C=a*u,F=new Float32Array(r.buffer,t.hPtr(),C),E=new Float32Array(r.buffer,t.uPtr(),C),W=new Float32Array(r.buffer,t.vPtr(),C);B=Me(F,E,W,a,u,ze((H=i.getParams().measures)==null?void 0:H.level),(N=i.getParams().measures)!=null&&N.pump?I.pump:[],(G=i.getParams().measures)!=null&&G.dike?I.dike:[],(X=i.getParams().measures)!=null&&X.retention?I.retention:[]),fe(),x==null||x.update(r.buffer,t.hPtr(),t.zbPtr(),t.uPtr(),t.vPtr(),a,u,o,d,g,y,L,B);const q=t.maxDepth(),S=Number.isFinite(q)&&q>=0?Z(q,0,e.solver.maxDisplayDepth,"maxDisplayDepth"):0;i.setProgress(Math.min(1,L/Math.max(1,i.getParams().durationS))),i.setStatus(`T = ${Math.round(L)}s · max. Tiefe ${S.toFixed(2)} m`,"bi-droplet-fill")}function Je(){if(h!=="running"||!b)return;const e=i.getParams(),a=De(e),u=Ae(e),o=Et(u),d=e.measures||{},g=ze(d.level),{nx:y,ny:C,dx:F,originLon:E,originLat:W,baseElevation:q=0}=b,S=t.maxDepth(),H=Number.isFinite(S)&&S>0?Z(S,a.solver.minDepthForDt,a.solver.maxDepthForDt,"maxDepthForDt"):a.solver.minDepthForDt,N=Math.max(a.solver.minDepthForDt,H),G=Math.min(F/Math.sqrt(9.81*N)*a.solver.cfl,a.solver.dtCap),X=Math.max(1,Math.round(e.speed));let K=null,ee=0;if(p&&p.length>=3){K=zt(p,y,C,F,E,W);const Fe=e.volumeM3/Math.max(1,e.durationS),Pe=Math.max(.2,1-(d.pump?.35*g:0)-(d.retention?.25*g:0)-(d.dike?.1*g:0)),ke=Fe*o.inflow*Pe,Ie=Qe(K,ke,G,F,y,C,a.solver.maxSourceStepM);K.radius=Ie.radius,ee=Ie.depthPerStep}const ne=d.pump?I.pump:[],ie=d.dike?I.dike:[],we=d.retention?I.retention:[],Re=Math.max(a.solver.minFriction,a.solver.baseFriction*o.friction),Ne=e.volumeM3/Math.max(1,e.durationS)*.3*g,Xe=ne.length>0?Ne/ne.length:0,Ye=Math.max(.05,1-a.solver.frictionBoost.dike*g),et=Math.max(.1,1-a.solver.frictionBoost.retention*g*.8),tt=8e-4*g,Le=y*C;for(let Fe=0;Fe<X;Fe++){const Pe=Math.max(1,Math.ceil(G/a.solver.targetSubstepDt)),ke=G/Pe,Ie=ee/Pe,it=Xe>0?Qe({cx:0,cy:0,radius:2},Xe,ke,F,y,C,a.solver.maxSourceStepM).depthPerStep:0;for(let ot=0;ot<Pe;ot++){if(K&&t.injectSource(K.cx,K.cy,K.radius,Ie),it>0)for(const Se of ne)t.injectSource(Se.cx,Se.cy,Se.radius,-it);if(t.step(ke,9.81,Re),ie.length>0||we.length>0){const Se=new Float32Array(r.buffer,t.hPtr(),Le),at=new Float32Array(r.buffer,t.uPtr(),Le),rt=new Float32Array(r.buffer,t.vPtr(),Le);for(const ue of ie)ue<0||ue>=Le||(at[ue]*=Ye,rt[ue]*=Ye);if(tt>0)for(const ue of we){if(ue<0||ue>=Le)continue;const Ge=Se[ue];!Number.isFinite(Ge)||Ge<=0||(Se[ue]=Math.max(0,Ge-tt*ke),at[ue]*=et,rt[ue]*=et)}}}if(L+=G,L>=e.durationS)break}_+=1;const nt=L>=e.durationS,st=nt||_===1||_%a.solver.renderEveryFrames===0;if(st&&Ze(a),nt){st||Ze(a),Rt();return}D=requestAnimationFrame(Je)}function He(e,a){const u=`${e}-${U++}`;e==="pump"?z.pump.push({id:u,coord:a}):e==="dike"?z.dike.push({id:u,coords:a}):e==="retention"&&z.retention.push({id:u,coords:a}),Ce(),de(),k.clear(),me()}function Te(e,a,u){if(h==="running"||h==="sampling"||!ye())return;const o=v();if(!o){i.setStatus("3D-Modus aktivieren, um Maßnahmen zu platzieren.","bi-exclamation-triangle");return}const d=b?"ready":"idle";w==null||w.destroy(),T("drawing"),i.setStatus(e,"bi-geo-alt"),w=a(o,g=>{w=null,u(g),T(d)})}i.onDraw(async()=>{if(h==="drawing"){w==null||w.destroy(),w=null,T("idle"),i.setStatus("Zeichnung abgebrochen.","bi-x-circle");return}if(!["idle","ready","results"].includes(h)||!ye())return;if(M()!=="3D"&&!await P()){i.setStatus("Bitte zuerst in den 3D-Modus wechseln.","bi-exclamation-triangle");return}const e=v();if(!e){i.setStatus("3D-Modus aktivieren und Polygon zeichnen…","bi-pencil-square");return}T("drawing"),i.setStatus("Klicken = Punkt setzen · Doppelklick = Fertig · Rechtsklick = Fertig/Abbruch","bi-pencil-square"),w=We(e,async a=>{w=null,p=a,fe(),$==null||$.setPolygon(a),ge("Maßnahmen wurden zurückgesetzt (neues Gebiet)."),await $t(e)})}),i.onPlacePump(()=>{if(!p||!b){i.setStatus("Zuerst Polygon zeichnen und Terrain laden.","bi-exclamation-circle");return}Te("Pumpe setzen: Klick = Position · Rechtsklick = Abbruch",ct,e=>{He("pump",e),i.setStatus("Pumpe platziert.","bi-check-circle")})}),i.onPlaceDike(()=>{if(!p||!b){i.setStatus("Zuerst Polygon zeichnen und Terrain laden.","bi-exclamation-circle");return}Te("Deichlinie: Klick = Punkt · Doppelklick/Rechtsklick = Fertig",lt,e=>{if(!Array.isArray(e)||e.length<2){i.setStatus("Deichlinie verworfen.","bi-info-circle");return}He("dike",e),i.setStatus("Deichlinie platziert.","bi-check-circle")})}),i.onPlaceRetention(()=>{if(!p||!b){i.setStatus("Zuerst Polygon zeichnen und Terrain laden.","bi-exclamation-circle");return}Te("Retentionsfläche: Klick = Punkt · Doppelklick = Fertig",We,e=>{if(!Array.isArray(e)||e.length<3){i.setStatus("Retentionsfläche verworfen.","bi-info-circle");return}He("retention",e),i.setStatus("Retentionsfläche platziert.","bi-check-circle")})}),i.onMeasureClearAll(()=>{ge("Maßnahmen entfernt.")}),i.onRun(()=>{if(!ye()||!b||!t||!["ready","paused"].includes(h))return;if(h==="ready"){L=0,_=0,t.reset();const{heights:o,nx:d,ny:g}=b,y=t.scratchPtr();new Float32Array(r.buffer,y,d*g).set(o),t.setTerrain(y,d*g)}const e=Ae(i.getParams()),a=i.getParams().profile==="advanced"?"Advanced":"Standard",u=e==="flash"?"Sturzflut":e==="river"?"Fluss":"Starkregen";T("running"),i.setStatus(`Simulation läuft… (${a} · ${u})`,"bi-play-fill"),cancelAnimationFrame(D),D=requestAnimationFrame(Je)}),i.onPause(()=>{h==="running"&&(cancelAnimationFrame(D),D=null,T("paused"),i.setStatus(`Pausiert bei T=${Math.round(L)}s`,"bi-pause-fill"))}),i.onReset(()=>{cancelAnimationFrame(D),D=null,w==null||w.destroy(),w=null,x==null||x.clear(),A==null||A.clear(),t.reset(),p=null,b=null,L=0,_=0,B=null,ge(),$==null||$.clear(),T("idle"),i.setStatus("",""),i.setProgress(null),i.setImpact([])}),i.onExport(()=>{f()}),i.onLayerClear(()=>{j()}),i.onLayerClearAll(()=>{R()}),i.onLayerActiveChange(()=>{le.setActive(i.getActiveLayerId()||null)}),T("idle"),me(),ye(),i.setAnalysisLayers([],null),te("3D für belastbare Analysen erforderlich");const Nt=setInterval(ye,800);window.HydroSim={getState:()=>h,getTerrain:()=>b,getWasm:()=>t,getScene:v,stop:()=>{cancelAnimationFrame(D),D=null,T("paused")},destroy:()=>{clearInterval(Nt)}}})()})();
