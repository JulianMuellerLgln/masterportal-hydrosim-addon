/**
 * assembly/index.ts — AssemblyScript (WASM) Shallow Water Equations solver.
 *
 * Implements the 2D depth-averaged St. Venant equations on a regular Cartesian
 * grid using an explicit first-order upwind finite-difference scheme.
 *
 * Governing equations (simplified):
 *
 *   ∂h/∂t + ∂(hu)/∂x + ∂(hv)/∂y  = S(x,y)
 *   ∂(hu)/∂t + ∂/∂x(hu² + g·h²/2) = −g·h·∂zb/∂x − Cf·u·|U|
 *   ∂(hv)/∂t + ∂/∂y(hv² + g·h²/2) = −g·h·∂zb/∂y − Cf·v·|U|
 *
 * where:
 *   h   = water depth [m]
 *   u,v = depth-averaged velocity components [m/s]
 *   zb  = bed elevation [m]  (read from DGM5 terrain samples)
 *   S   = source term [m/s]  (rainfall / inflow / pump)
 *   Cf  = Manning-type friction coefficient
 *
 * Memory layout:  Four Float32 grids of nx×ny, stored row-major.
 *   h[]  — water depth
 *   u[]  — x-velocity
 *   v[]  — y-velocity
 *   zb[] — bed elevation (static once set)
 *
 * All pointer arithmetic is in cells; global WASM memory is used directly so
 * the JavaScript side can read results with a zero-copy Float32Array view.
 */

// ---------------------------------------------------------------------------
// Global grid state — allocated once via init()
// ---------------------------------------------------------------------------
let NX:    i32 = 0;
let NY:    i32 = 0;
let DX:    f32 = 50.0;  // grid cell size in metres

// Offsets (in bytes) into linear WASM heap for each grid array
// Layout: [ h | hn | u | un | v | vn | zb ]
let H_OFF:  i32 = 0;
let HN_OFF: i32 = 0;
let U_OFF:  i32 = 0;
let UN_OFF: i32 = 0;
let V_OFF:  i32 = 0;
let VN_OFF: i32 = 0;
let ZB_OFF: i32 = 0;

let SIM_T:     f32 = 0.0;  // elapsed simulation time in seconds
let MAX_DEPTH: f32 = 0.0;  // peak depth seen this step (exposed to JS)
const MAX_CELL_DEPTH: f32 = 30.0;
const MAX_VEL: f32 = 12.0;
const DRAINAGE_RATE: f32 = 0.000025;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

@inline
function idx(x: i32, y: i32): i32 { return y * NX + x; }

@inline
function fget(off: i32, x: i32, y: i32): f32 {
  return load<f32>(off + (idx(x, y) << 2));
}

@inline
function fset(off: i32, x: i32, y: i32, v: f32): void {
  store<f32>(off + (idx(x, y) << 2), v);
}

// ---------------------------------------------------------------------------
// Public exports
// ---------------------------------------------------------------------------

/**
 * Initialise the grid.  Must be called once before any other export.
 * Allocates 7 × nx×ny × 4 bytes in WASM linear memory starting at page 1
 * (leaves page 0 for AssemblyScript runtime header).
 *
 * Returns the byte offset of the h-grid so the JS side can create a
 * Float32Array view without copying data.
 */
export function init(nx: i32, ny: i32, dx: f32): i32 {
  NX = nx;
  NY = ny;
  DX = dx;
  SIM_T = 0.0;
  MAX_DEPTH = 0.0;

  const nCells: i32 = nx * ny;
  const gridBytes: i32 = nCells << 2; // × 4 bytes per f32

  // Layout in memory (offsets from 0):
  // The stub runtime uses no GC; we manually manage layout from a base offset.
  // Start at 4096 bytes (1 Wasm page = 64 KiB; page 0 is runtime, so use 4 KiB
  // offset to be safe with any runtime header).
  const BASE: i32 = 4096;

  // Ensure linear memory is large enough before touching any offsets.
  // Required bytes: BASE + 7 grids (h, hn, u, un, v, vn, zb).
  const requiredBytes: i32 = BASE + gridBytes * 7;
  const currentBytes: i32 = memory.size() << 16; // pages * 64 KiB
  if (requiredBytes > currentBytes) {
    const missingBytes: i32 = requiredBytes - currentBytes;
    const pagesNeeded: i32 = (missingBytes + 65535) >> 16;
    const grownFrom: i32 = memory.grow(pagesNeeded);
    if (grownFrom < 0) {
      // Signal allocation failure to JS caller.
      return -1;
    }
  }

  H_OFF  = BASE;
  HN_OFF = H_OFF  + gridBytes;
  U_OFF  = HN_OFF + gridBytes;
  UN_OFF = U_OFF  + gridBytes;
  V_OFF  = UN_OFF + gridBytes;
  VN_OFF = V_OFF  + gridBytes;
  ZB_OFF = VN_OFF + gridBytes;

  // Zero-initialise all grids (memory.fill is fastest)
  memory.fill(H_OFF,  0, gridBytes * 7);

  return H_OFF;
}

/**
 * Copy bed elevation data from a JS-owned buffer into the WASM zb[] grid.
 * The caller must pass a typed array of nx×ny f32 values in row-major order
 * normalised so that the minimum value is 0 (relative heights).
 *
 * This is done by first writing the values to a scratch area in WASM memory
 * starting at zbSrcPtr, then calling this function.  For simplicity, JS writes
 * directly to the WASM flat memory before calling setTerrain.
 *
 * @param zbSrcPtr  byte offset of source data already in WASM memory
 * @param len       number of f32 values (must equal nx*ny)
 */
export function setTerrain(zbSrcPtr: i32, len: i32): void {
  const bytes: i32 = len << 2;
  memory.copy(ZB_OFF, zbSrcPtr, bytes);
}

/**
 * Add a rainfall / inflow source centred on grid cell (cx, cy) with given
 * radius in cells.  volumePerStep [m] is added to h at each cell inside the
 * circle.  Negative values act as a sink (pump).
 *
 * Safe to call every frame; additive with other sources.
 */
export function injectSource(cx: i32, cy: i32, radius: i32, volumePerStep: f32): void {
  const r2: i32 = radius * radius;
  const x0: i32 = max(0, cx - radius);
  const x1: i32 = min(NX - 1, cx + radius);
  const y0: i32 = max(0, cy - radius);
  const y1: i32 = min(NY - 1, cy + radius);

  for (let y: i32 = y0; y <= y1; y++) {
    for (let x: i32 = x0; x <= x1; x++) {
      const dx_: i32 = x - cx;
      const dy_: i32 = y - cy;
      if (dx_ * dx_ + dy_ * dy_ <= r2) {
        const h: f32 = fget(H_OFF, x, y);
        fset(H_OFF, x, y, max(0.0, h + volumePerStep));
      }
    }
  }
}

/**
 * Advance the simulation by one time step dt [s].
 *
 * Using explicit first-order upwind scheme (stable when dt < dx / sqrt(g*h_max),
 * i.e. CFL condition ≤ 1).  g = gravitational acceleration, cf = friction coeff.
 *
 * Optimised hot path — called every animation frame from JS.
 */
export function step(dt: f32, g: f32, cf: f32): void {
  MAX_DEPTH = 0.0;

  const nx: i32 = NX;
  const ny: i32 = NY;
  const dx: f32 = DX;
  const invDx: f32 = 1.0 / dx;

  // -- Continuity + momentum update --
  for (let y: i32 = 1; y < ny - 1; y++) {
    for (let x: i32 = 1; x < nx - 1; x++) {
      const h:  f32 = fget(H_OFF, x,   y);
      const hW: f32 = fget(H_OFF, x-1, y);
      const hE: f32 = fget(H_OFF, x+1, y);
      const hS: f32 = fget(H_OFF, x,   y-1);
      const hN: f32 = fget(H_OFF, x,   y+1);

      const u:  f32 = fget(U_OFF, x,   y);
      const uW: f32 = fget(U_OFF, x-1, y);
      const v:  f32 = fget(V_OFF, x,   y);
      const vS: f32 = fget(V_OFF, x,   y-1);

      // Bed slope terms
      const zbC: f32 = fget(ZB_OFF, x,   y);
      const zbE: f32 = fget(ZB_OFF, x+1, y);
      const zbW: f32 = fget(ZB_OFF, x-1, y);
      const zbN: f32 = fget(ZB_OFF, x,   y+1);
      const zbS: f32 = fget(ZB_OFF, x,   y-1);

      const dzbdx: f32 = (zbE - zbW) * 0.5 * invDx;
      const dzbdy: f32 = (zbN - zbS) * 0.5 * invDx;

      // Upwind hu fluxes
      const huC: f32 = h * u;
      const huW: f32 = hW * uW;
      const dvFlux: f32 = h * v;
      const dvFluxS: f32 = hS * vS;

      // Continuity: dh/dt = -d(hu)/dx - d(hv)/dy
      let dq_x: f32;
      let dq_y: f32;
      if (u >= 0.0) {
        dq_x = (huC - huW) * invDx;
      } else {
        const huE: f32 = fget(H_OFF, x+1, y) * fget(U_OFF, x+1, y);
        dq_x = (huE - huC) * invDx;
      }
      if (v >= 0.0) {
        dq_y = (dvFlux - dvFluxS) * invDx;
      } else {
        const hvN: f32 = fget(H_OFF, x, y+1) * fget(V_OFF, x, y+1);
        dq_y = (hvN - dvFlux) * invDx;
      }

      let hn: f32 = h - dt * (dq_x + dq_y);
      if (!isFinite(hn)) hn = 0.0;
      // Simple drainage/infiltration term to avoid unrealistic long-term pooling.
      hn -= DRAINAGE_RATE * dt;
      if (hn < 0.0) hn = 0.0;
      if (hn > MAX_CELL_DEPTH) hn = MAX_CELL_DEPTH;

      // Momentum x:  d(hu)/dt = -d(hu²+gh²/2)/dx - g·h·dzb/dx - Cf·u·|U|
      const speed: f32 = Mathf.sqrt(u * u + v * v);
      const pres: f32 = 0.5 * g * h * h;
      const presW: f32 = 0.5 * g * hW * hW;
      let dpu_dx: f32;
      if (u >= 0.0) {
        dpu_dx = ((huC * u + pres) - (huW * uW + presW)) * invDx;
      } else {
        const huE2: f32 = fget(H_OFF, x+1, y) * fget(U_OFF, x+1, y);
        const uE:   f32 = fget(U_OFF, x+1, y);
        const hE2:  f32 = fget(H_OFF, x+1, y);
        const presE: f32 = 0.5 * g * hE2 * hE2;
        dpu_dx = ((huE2 * uE + presE) - (huC * u + pres)) * invDx;
      }
      let un: f32 = u - dt * (dpu_dx / (h + 1e-6) + g * dzbdx + cf * u * speed);
      if (!isFinite(un)) un = 0.0;
      if (un > MAX_VEL) un = MAX_VEL;
      if (un < -MAX_VEL) un = -MAX_VEL;
      // Dry cell: no velocity
      if (hn < 1e-4) un = 0.0;

      // Momentum y
      const hvC: f32 = h * v;
      const hvS2: f32 = hS * vS;
      const presS: f32 = 0.5 * g * hS * hS;
      let dpv_dy: f32;
      if (v >= 0.0) {
        dpv_dy = ((hvC * v + pres) - (hvS2 * vS + presS)) * invDx;
      } else {
        const hvN2: f32 = fget(H_OFF, x, y+1) * fget(V_OFF, x, y+1);
        const vN:   f32 = fget(V_OFF, x, y+1);
        const hN2:  f32 = fget(H_OFF, x, y+1);
        const presN: f32 = 0.5 * g * hN2 * hN2;
        dpv_dy = ((hvN2 * vN + presN) - (hvC * v + pres)) * invDx;
      }
      let vn: f32 = v - dt * (dpv_dy / (h + 1e-6) + g * dzbdy + cf * v * speed);
      if (!isFinite(vn)) vn = 0.0;
      if (vn > MAX_VEL) vn = MAX_VEL;
      if (vn < -MAX_VEL) vn = -MAX_VEL;
      if (hn < 1e-4) vn = 0.0;

      fset(HN_OFF, x, y, hn);
      fset(UN_OFF, x, y, un);
      fset(VN_OFF, x, y, vn);

      if (hn > MAX_DEPTH) MAX_DEPTH = hn;
    }
  }

  // Swap buffers: copy hn -> h, un -> u, vn -> v
  const nCells: i32 = nx * ny;
  const gridBytes: i32 = nCells << 2;
  memory.copy(H_OFF, HN_OFF, gridBytes);
  memory.copy(U_OFF, UN_OFF, gridBytes);
  memory.copy(V_OFF, VN_OFF, gridBytes);

  SIM_T += dt;
}

/** Returns the byte offset of the h[] grid in WASM linear memory.
 *  Use: new Float32Array(wasm.memory.buffer, hPtr(), nx*ny) */
export function hPtr(): i32 { return H_OFF; }

/** Returns byte offset of zb[] grid (bed elevation). */
export function zbPtr(): i32 { return ZB_OFF; }

/** Returns a scratch buffer offset suitable for passing terrain data in.
 *  Size: at least nx*ny*4 bytes.  Reuses HN_OFF (safe before first step). */
export function scratchPtr(): i32 { return HN_OFF; }

/** Elapsed simulation time in seconds. */
export function simTime(): f32 { return SIM_T; }

/** Maximum water depth observed in the last step(). */
export function maxDepth(): f32 { return MAX_DEPTH; }

/** Reset all state — keeps grid dimensions and terrain. */
export function reset(): void {
  const nCells: i32 = NX * NY;
  const gridBytes: i32 = nCells << 2;
  memory.fill(H_OFF,  0, gridBytes);  // h
  memory.fill(HN_OFF, 0, gridBytes);  // hn
  memory.fill(U_OFF,  0, gridBytes);  // u
  memory.fill(UN_OFF, 0, gridBytes);  // un
  memory.fill(V_OFF,  0, gridBytes);  // v
  memory.fill(VN_OFF, 0, gridBytes);  // vn
  SIM_T = 0.0;
  MAX_DEPTH = 0.0;
}

/** Grid width (cells). */
export function gridNx(): i32 { return NX; }

/** Grid height (cells). */
export function gridNy(): i32 { return NY; }

/** Build/version marker for runtime verification. */
export function apiVersion(): i32 { return 20260429; }

/** Cell size in metres. */
export function gridDx(): f32 { return DX; }
