// The emission plume of the sample company, carried by the wind (ECO-MAP).
// An approximate Gaussian plume: neutral air (Briggs rural, class D), wind 3 m/s, release at 10 m.
// Ground-level concentration peaks about 125 m downwind, falls to 10% of the peak near 0.8 km and
// to 2% near 2.1 km. The envelopes on the map are those contours; the particles drift inside them.
// It is an illustration of reach, not a regulatory dispersion calculation.

const H = 10; // release height, m
const sy = (x) => (0.08 * x) / Math.sqrt(1 + 0.0001 * x);
const sz = (x) => (0.06 * x) / Math.sqrt(1 + 0.0015 * x);
const g = (x) => (x <= 0 ? 0 : Math.exp(-(H * H) / (2 * sz(x) ** 2)) / (sy(x) * sz(x)));
let GMAX = 0;
for (let x = 5; x < 3000; x += 5) GMAX = Math.max(GMAX, g(x));
const REACH = 2200; // m, a little past the 2% contour

// Substances of the sample company (t / year) and their colours, matching the card's swatches.
export const SUBSTANCES = [
  { k: 'dust', t: 0.059, dark: '#e3c07a', light: '#a77a1f' },
  { k: 'no2', t: 0.024, dark: '#ff8a6e', light: '#c2452b' },
  { k: 'co', t: 0.06, dark: '#b7c7d6', light: '#52677a' },
  { k: 'so2', t: 0.012, dark: '#f4e06a', light: '#9a8a12' },
  { k: 'oth', t: 0.027, dark: '#c7a3f0', light: '#7a4fb5' },
];
const TOTAL = SUBSTANCES.reduce((a, s) => a + s.t, 0);

// Local metres <-> lng/lat around the site; x runs downwind, y to its left.
function frame([lng, lat], bearing) {
  const kx = 111320 * Math.cos((lat * Math.PI) / 180);
  const ky = 110540;
  const a = (bearing * Math.PI) / 180;
  const ux = Math.sin(a);
  const uy = Math.cos(a);
  return (x, y) => [lng + (x * ux - y * uy) / kx, lat + (x * uy + y * ux) / ky];
}

/** The plume envelopes (f = share of the peak), distance rings and their label points. */
export function plumeRings(site, windTo) {
  const at = frame(site, windTo);
  const features = [];
  for (const f of [0.02, 0.05, 0.1, 0.2, 0.5]) {
    const left = [];
    const right = [];
    for (let x = 20; x < 4000; x += 10) {
      const r = g(x) / (f * GMAX);
      if (r < 1) { if (left.length) break; continue; }
      const w = sy(x) * Math.sqrt(2 * Math.log(r));
      left.push(at(x, w));
      right.unshift(at(x, -w));
    }
    if (left.length > 2) features.push({ type: 'Feature', properties: { f }, geometry: { type: 'Polygon', coordinates: [[...left, ...right, left[0]]] } });
  }
  const rings = [500, 1000, 2000].map((d) => ({
    type: 'Feature', properties: { d },
    geometry: { type: 'LineString', coordinates: Array.from({ length: 73 }, (_, i) => { const t = (i / 72) * Math.PI * 2; return at(d * Math.cos(t), d * Math.sin(t)); }) },
  }));
  return {
    plume: { type: 'FeatureCollection', features },
    rings: { type: 'FeatureCollection', features: rings },
    labels: [500, 1000, 2000].map((d) => ({ d, at: at(d * Math.cos(0.42), d * Math.sin(0.42)) })),
    windAt: at(-520, -330),
  };
}

// Gaussian sample (Box-Muller).
const gauss = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());

export function createPlume(canvas, map, site, windTo) {
  const ctx = canvas.getContext('2d');
  const at = frame(site, windTo);
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0;
  let Hh = 0;
  let raf = 0;
  let running = false;
  let theme = 'dark';
  let last = 0;
  const P = [];
  const MAX = 850;
  // A soft round puff per substance and theme, drawn once and stamped for every particle.
  const SPR = {};
  function sprite(col) {
    if (SPR[col]) return SPR[col];
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const x = c.getContext('2d');
    const gr = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, col);
    gr.addColorStop(0.35, `${col}cc`);
    gr.addColorStop(1, `${col}00`);
    x.fillStyle = gr;
    x.fillRect(0, 0, 32, 32);
    SPR[col] = c;
    return c;
  }

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    Hh = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(Hh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // Ground metres per screen pixel near the site, for puff sizes that follow the map's zoom.
  function metresPerPixel() {
    const a = map.project(site);
    const b = map.project(at(100, 0));
    return 100 / Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
  }
  function pick() {
    let r = Math.random() * TOTAL;
    for (const s of SUBSTANCES) { r -= s.t; if (r <= 0) return s; }
    return SUBSTANCES[0];
  }
  function spawn(x0 = 0) {
    const s = pick();
    P.push({ x: x0, n: gauss(), m: gauss() * 0.35, ph: Math.random() * 6.28, s, v: 0.75 + Math.random() * 0.5, r: 1.2 + Math.random() * 1.6 });
  }

  function step(t) {
    raf = requestAnimationFrame(step);
    const dt = Math.min(0.05, (t - (last || t)) / 1000);
    last = t;
    // About 400 visual metres per second: the plume crosses its 2 km in five or six seconds.
    for (let k = 0; k < 5 && P.length < MAX; k++) spawn();
    ctx.clearRect(0, 0, W, Hh);
    ctx.globalCompositeOperation = 'source-over';
    const px = metresPerPixel();
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      p.x += 400 * p.v * dt * (0.55 + 0.45 * Math.min(1, p.x / 300));
      p.ph += dt * 1.7;
      if (p.x > REACH * (0.7 + 0.3 * Math.abs(Math.sin(p.ph * 0.1 + p.n)))) { P.splice(i, 1); continue; }
      const y = sy(p.x) * (p.n + 0.25 * Math.sin(p.ph)) + p.m * 6;
      const q = map.project(at(p.x, y));
      if (q.x < -20 || q.y < -20 || q.x > W + 20 || q.y > Hh + 20) continue;
      const c = Math.min(1, Math.sqrt(g(p.x) / GMAX) * 1.5) * Math.min(1, p.x / 60);
      ctx.globalAlpha = 0.55 * c;
      // Puffs grow as the plume widens: about a third of the local plume width, at least 5 px.
      const rad = Math.max(5, Math.min(26, (sy(p.x) * 0.55) / px)) * (0.7 + p.r * 0.25);
      ctx.drawImage(sprite(p.s[theme]), q.x - rad, q.y - rad, rad * 2, rad * 2);
    }
    ctx.globalAlpha = 1;
  }

  return {
    start(instant) {
      if (running) return;
      running = true;
      P.length = 0;
      // Pre-fill along the plume so a jump lands on a plume already in flight.
      if (instant || REDUCED) for (let k = 0; k < MAX * 0.8; k++) spawn(Math.random() * REACH * 0.9);
      canvas.style.opacity = '1';
      if (REDUCED) { last = 0; step(performance.now()); cancelAnimationFrame(raf); return; }
      last = 0;
      raf = requestAnimationFrame(step);
    },
    stop() {
      if (!running) return;
      running = false;
      canvas.style.opacity = '0';
      setTimeout(() => {
        if (running) return;
        cancelAnimationFrame(raf);
        P.length = 0;
        ctx.clearRect(0, 0, W, Hh);
      }, 900);
    },
    setTheme(t) { theme = t; },
  };
}
