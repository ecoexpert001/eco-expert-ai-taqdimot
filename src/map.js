// The map stage: one MapLibre globe that every step re-aims. It carries the 18,000 conclusion
// points of the opening, the industrial sites and the district columns of ECO-MAP.
import * as maplibregl from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { gsap } from 'gsap';
import { TASHKENT, SAMPLE } from './data.js';
import { createStream } from './stream.js';
import { createPlume, plumeRings } from './plume.js';
import { T, getTheme } from './i18n.js';

maplibregl.setWorkerUrl(workerUrl);

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// ?still freezes the ambient sway (used for review captures).
const STILL = new URLSearchParams(window.location.search).has('still');
const abs = (p) => new URL(`${import.meta.env.BASE_URL}${p}`, window.location.href).href;
const COL = { teal: '#2e9c80', hi: '#6fd9bc', ground: '#05080c', core: '#effaf6' };
// Map paint that follows the theme: the night earth, or the same earth washed in daylight paper.
const PAL = {
  dark: { ground: '#05080c', mask: '#010305', hi: '#6fd9bc', line: '#8fb3c2', nb: '#9dbdca', bright: 0.8, sky: '#05080c', horizon: '#0c3a33', dots: '#6fd9bc', ink: '#ffffff' },
  light: { ground: '#eef2f1', mask: '#f3f6f5', hi: '#0b7a60', line: '#5d7783', nb: '#4e6874', bright: 1, sky: '#dce8e6', horizon: '#ffffff', dots: '#0f8a6c', ink: '#10343d' },
};
// The protected zones of the Center's KMZ files, one colour each.
const ZONE_COL = ['match', ['get', 'kind'], 'waterzone', '#4fb4ff', 'reservoir', '#2f7dff', 'groundwater', '#b58cff', 'forest', '#7ed36a', '#cccccc'];
const empty = () => ({ type: 'FeatureCollection', features: [] });
const polyF = (ring, properties = {}) => ({ type: 'Feature', properties, geometry: { type: 'Polygon', coordinates: [ring] } });
const pointsF = (pts) => ({
  type: 'FeatureCollection',
  features: pts.map((c) => ({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: c } })),
});

export const CAMERAS = {
  // The sample company in Chirchiq, close enough to read the 930 m to the river's zone.
  sample: { center: [69.5906, 41.4625], zoom: 14.15, pitch: 50, bearing: -14 },
  // The same company among its neighbours along the Chirchiq river (management check).
  area: { center: [69.585, 41.462], zoom: 12.1, pitch: 48, bearing: 12 },
  // The plume, heading east-south-east toward the river.
  plume: { center: [69.5968, 41.4596], zoom: 13.75, pitch: 56, bearing: 20 },
  // ECO-MAP's protected zones: Tashkent to the Fergana Valley, where the sites and the zones meet.
  zones: { center: [70.35, 40.95], zoom: 7.55, pitch: 52, bearing: 10 },
  // Low and tilted: the earth fills the frame and its limb arcs across the top.
  globe: { center: [65.5, 41], zoom: 4.2, pitch: 35, bearing: 0 },
  country: { center: [64.75, 41.15], zoom: 5.25, pitch: 30, bearing: -4 },
  // Management oversight: the whole country from above.
  overview: { center: [64.75, 41.3], zoom: 5.25, pitch: 8, bearing: 0 },
  // The Center's city, at night.
  tashkent: { center: [69.27, 41.3], zoom: 9.3, pitch: 56, bearing: 22 },
  // ECO-MAP: from Tashkent and Almalyk to the Fergana Valley, where the sites cluster.
  east: { center: [69.85, 40.9], zoom: 6.75, pitch: 60, bearing: 16 },
  // Backdrops for the second agent of each stage, so every agent run gets its own view.
  consult: { center: [67.4, 40.7], zoom: 5.6, pitch: 46, bearing: 24 },
  library: { center: [69.15, 41.2], zoom: 8.3, pitch: 42, bearing: -22 },
  // ECO-MAP: the whole country, oblique, every district's column standing right of the card
  // and above the rail.
  wide: { center: [64.9, 40.35], zoom: 5.3, pitch: 56, bearing: -8 },
  // ECO-MAP: the same frame turned a little, while the regions draw across the columns.
  regions: { center: [64.9, 40.35], zoom: 5.3, pitch: 56, bearing: -2 },
};

// Cameras are composed for 1920 x 1080. The type scales with the screen, the map does not,
// so shift every zoom by the screen's size relative to that reference.
const zoomShift = () => Math.log2(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));

function style() {
  return {
    version: 8,
    projection: { type: 'globe' },
    sky: {
      'sky-color': '#05080c',
      'horizon-color': '#0c3a33',
      'fog-color': '#05080c',
      'fog-ground-blend': 0.8,
      'horizon-fog-blend': 0.6,
      'sky-horizon-blend': 0.75,
      'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 0.9, 5, 0.6, 8, 0],
    },
    // Terrain is switched on after the first load: declaring it in the initial style
    // leaves the globe black (MapLibre 6 start-up race).
    sources: {
      sat: {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        maxzoom: 18,
      },
      dem: {
        type: 'raster-dem',
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        encoding: 'terrarium',
        tileSize: 256,
        maxzoom: 13,
      },
      world: { type: 'geojson', data: abs('data/world.geojson') },
      nb: { type: 'geojson', data: abs('data/neighbors.geojson') },
      uzb: { type: 'geojson', data: abs('data/uzb.geojson') },
      regions: { type: 'geojson', data: abs('data/regions.geojson') },
      districts: { type: 'geojson', data: abs('data/districts.geojson') },
      mask: { type: 'geojson', data: abs('data/mask.geojson') },
      veil: { type: 'geojson', data: polyF([[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]]) },
      dots: { type: 'geojson', data: empty() },
      sites: { type: 'geojson', data: empty() },
      columns: { type: 'geojson', data: empty() },
      zones: { type: 'geojson', data: abs('data/zones.geojson'), generateId: true },
      link: { type: 'geojson', data: empty() },
      plume: { type: 'geojson', data: empty() },
      rings: { type: 'geojson', data: empty() },
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': COL.ground } },
      {
        id: 'sat', type: 'raster', source: 'sat',
        paint: { 'raster-opacity': 0, 'raster-saturation': -0.34, 'raster-contrast': 0.08, 'raster-brightness-max': 0.8, 'raster-fade-duration': 280 },
      },
      { id: 'mask', type: 'fill', source: 'mask', paint: { 'fill-color': '#010305', 'fill-opacity': 0 } },
      { id: 'world-line', type: 'line', source: 'world', paint: { 'line-color': '#8fb3c2', 'line-width': 0.6, 'line-opacity': 0 } },
      { id: 'nb-line', type: 'line', source: 'nb', paint: { 'line-color': '#9dbdca', 'line-width': 0.9, 'line-opacity': 0 } },
      // Dims the ground behind a step's visual; everything above it stays lit.
      { id: 'veil', type: 'fill', source: 'veil', paint: { 'fill-color': COL.ground, 'fill-opacity': 0 } },
      {
        id: 'zones-fill', type: 'fill', source: 'zones', filter: ['!=', ['geometry-type'], 'Point'],
        paint: { 'fill-color': ZONE_COL, 'fill-opacity': 0 },
      },
      {
        id: 'zones-line', type: 'line', source: 'zones', filter: ['!=', ['geometry-type'], 'Point'],
        paint: {
          'line-color': ZONE_COL,
          // zoom must be the outer expression; the zone being measured to draws thicker.
          'line-width': ['interpolate', ['linear'], ['zoom'],
            5, ['case', ['boolean', ['feature-state', 'hit'], false], 1.6, 0.6],
            10, ['case', ['boolean', ['feature-state', 'hit'], false], 2.6, 1.2],
            13, ['case', ['boolean', ['feature-state', 'hit'], false], 3.6, 2]],
          'line-opacity': 0,
        },
      },
      {
        id: 'zones-pt', type: 'circle', source: 'zones', filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 3, 9, 6],
          'circle-color': ZONE_COL, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1,
          'circle-opacity': 0, 'circle-stroke-opacity': 0,
        },
      },
      {
        id: 'plume-fill', type: 'fill', source: 'plume',
        paint: { 'fill-color': ['interpolate', ['linear'], ['get', 'f'], 0.02, '#e8b04c', 0.2, '#ef8a5a', 0.5, '#ef5a43'], 'fill-opacity': 0 },
      },
      {
        id: 'rings', type: 'line', source: 'rings',
        paint: { 'line-color': '#ffffff', 'line-width': 1.2, 'line-dasharray': [2, 3], 'line-opacity': 0 },
      },
      { id: 'districts-line', type: 'line', source: 'districts', paint: { 'line-color': COL.hi, 'line-width': 0.5, 'line-opacity': 0 } },
      { id: 'regions-line', type: 'line', source: 'regions', paint: { 'line-color': COL.hi, 'line-width': 1.6, 'line-opacity': 0 } },
      { id: 'uzb-glow', type: 'line', source: 'uzb', paint: { 'line-color': COL.teal, 'line-width': 16, 'line-blur': 14, 'line-opacity': 0 } },
      { id: 'uzb-line', type: 'line', source: 'uzb', paint: { 'line-color': COL.hi, 'line-width': 1.6, 'line-opacity': 0 } },
      {
        id: 'dots', type: 'circle', source: 'dots',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 0.75, 5.6, 1.05, 7, 1.5, 10, 2.4],
          'circle-color': COL.hi,
          'circle-opacity': 0,
          'circle-blur': 0.15,
        },
      },
      {
        id: 'sites-glow', type: 'circle', source: 'sites',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 3, 7, 6, 10, 10],
          'circle-color': COL.teal, 'circle-blur': 1, 'circle-opacity': 0,
        },
      },
      {
        id: 'sites', type: 'circle', source: 'sites',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 0.9, 7, 1.7, 10, 3],
          'circle-color': COL.core,
          'circle-stroke-color': COL.hi,
          'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 5, 0.3, 8, 0.9],
          'circle-opacity': 0,
          'circle-stroke-opacity': 0,
        },
      },
      {
        id: 'sites-z', type: 'circle', source: 'sites',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 1.4, 8, 2.6, 11, 5, 13, 7],
          'circle-color': ['case', ['==', ['get', 'z'], 0], '#ef5a43', '#96c962'],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 5, 0.2, 11, 1.4],
          'circle-opacity': 0, 'circle-stroke-opacity': 0,
        },
      },
      {
        id: 'link-glow', type: 'line', source: 'link',
        paint: { 'line-color': '#ffffff', 'line-width': 7, 'line-blur': 5, 'line-opacity': 0 },
        layout: { 'line-cap': 'round' },
      },
      {
        id: 'link', type: 'line', source: 'link',
        paint: {
          'line-color': '#ffffff',
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.2, 13, 2.8], 'line-dasharray': [1.4, 1.2], 'line-opacity': 0,
        },
        layout: { 'line-cap': 'round' },
      },
      {
        id: 'columns', type: 'fill-extrusion', source: 'columns',
        paint: {
          'fill-extrusion-color': ['interpolate', ['linear'], ['get', 'k'], 0, '#1d6656', 0.45, '#36b08f', 1, '#b4f6e1'],
          'fill-extrusion-height': ['*', ['get', 'h'], ['coalesce', ['feature-state', 'g'], 0]],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0,
          'fill-extrusion-vertical-gradient': true,
        },
      },
    ],
  };
}

const DEF = {
  cam: null, camDur: null, sat: 0.9, mask: 0.5, uzb: 1, regions: 0, districts: 0, nb: 0.3, world: 0.2,
  dim: 0, drift: 0.3, dots: 0, stream: false, sites: 0, columns: 0, tashkent: false, legend: false, padTop: 0,
  zones: 0, sitesZ: 0, zcheck: false, plume: false, legendZones: false,
};
const fmtDist = (d) => {
  const M = T().map;
  if (d < 1000) return `${Math.round(d / 10) * 10} ${M.m}`;
  const v = (d / 1000).toFixed(d % 1000 ? 1 : 0);
  return `${T().code === 'en' ? v : v.replace('.', ',')} ${M.km}`;
};

// District columns: a 20-sided column on each district's interior point, height rising with
// the number of OpenStreetMap industrial sites in the district (square-root scale).
const COL_R = 6000; // metres
const COL_H = 170000; // metres for the busiest district
function columnRing([lng, lat], r = COL_R, n = 20) {
  const ring = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    ring.push([lng + (Math.cos(a) * r) / (111320 * Math.cos((lat * Math.PI) / 180)), lat + (Math.sin(a) * r) / 111320]);
  }
  return ring;
}

export function createMapStage(container, streamCanvas, sweepEl, legendEl, zonesLegendEl, plumeCanvas) {
  const map = new maplibregl.Map({
    container,
    style: style(),
    ...CAMERAS.globe,
    interactive: false,
    attributionControl: false,
    maxPitch: 80,
    fadeDuration: 0,
  });
  if (import.meta.env.DEV) window.__map = map;
  map.on('error', (e) => {
    const msg = String(e?.error?.message || e?.error || '');
    if (import.meta.env.DEV) (window.__mapErrs ||= []).push(msg);
    if (!/tile|fetch|load|Failed|NetworkError|AJAXError|404/i.test(msg)) console.warn('[map]', msg);
  });
  const stream = createStream(streamCanvas);

  // Markers: zero-size roots at the point; CSS places the content around it.
  function marker(html, lngLat, cls = '') {
    const el = document.createElement('div');
    el.className = `mk ${cls}`;
    el.innerHTML = `<div class="mk-in">${html}</div>`;
    const mk = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(lngLat).addTo(map);
    return { el, marker: mk, show: (on) => el.classList.toggle('on', !!on) };
  }
  const PULSE = '<span class="pulse"><span class="ring"></span><span class="ring r2"></span><span class="core"></span></span>';
  const tash = marker(`${PULSE}<span class="place"></span>`, TASHKENT, 'mk-place');
  // The sample company, the measured distance to its nearest protected zone, the plume's rings.
  const sample = marker(`${PULSE.replace('pulse', 'pulse warm')}<span class="place"></span>`, SAMPLE.site, 'mk-place mk-sample');
  const MID = [(SAMPLE.site[0] + SAMPLE.zoneAt[0]) / 2, (SAMPLE.site[1] + SAMPLE.zoneAt[1]) / 2];
  const distMk = marker('<span class="dist"></span>', MID, 'mk-dist');
  const zoneMk = marker('<span class="zone-l"></span>', SAMPLE.zoneAt, 'mk-zone');
  const RINGS = plumeRings(SAMPLE.site, SAMPLE.windTo);
  const ringMks = RINGS.labels.map((r) => ({ ...r, mk: marker('<span class="ring-l"></span>', r.at, 'mk-ring') }));
  const windMk = marker('<span class="wind-l"></span>', RINGS.windAt, 'mk-wind');
  const plume = plumeCanvas ? createPlume(plumeCanvas, map, SAMPLE.site, SAMPLE.windTo) : null;
  function labelMarkers() {
    const M = T().map;
    tash.el.querySelector('.place').textContent = M.tashkent;
    sample.el.querySelector('.place').textContent = M.sample;
    zoneMk.el.querySelector('.zone-l').textContent = `${M.zoneOf} · ${M.river}`;
    distMk.el.querySelector('.dist').textContent = fmtDist(SAMPLE.dist);
    windMk.el.querySelector('.wind-l').textContent = `${M.wind} · 3 ${M.m}/${T().viz.s}`;
    ringMks.forEach((r) => { r.mk.el.querySelector('.ring-l').textContent = fmtDist(r.d); });
  }
  labelMarkers();

  // Paint tweening through proxies, so repeated steps never fight each other.
  const prox = new Map();
  function paint(layer, prop, to, dur = 1.6) {
    if (to == null || !map.getLayer(layer)) return;
    const k = `${layer}|${prop}`;
    let o = prox.get(k);
    if (!o) {
      o = { v: Number(map.getPaintProperty(layer, prop) ?? 0) };
      prox.set(k, o);
    }
    gsap.killTweensOf(o);
    if (!dur) {
      o.v = to;
      map.setPaintProperty(layer, prop, to);
      return;
    }
    gsap.to(o, { v: to, duration: dur, ease: 'power2.inOut', onUpdate: () => map.setPaintProperty(layer, prop, o.v) });
  }

  // Camera flights, plus a slow bounded sway once a flight has landed.
  let flightEnd = 0;
  let drift = 0;
  const state = { cam: null, padKey: null };
  function fly(name, { instant, padLeft, padTop = 0, dur }) {
    const base = CAMERAS[name];
    const cam = { ...base, zoom: base.zoom + zoomShift() };
    const padding = { top: Math.round(window.innerHeight * padTop), bottom: 0, left: padLeft, right: 0 };
    swayBase = null;
    if (instant || REDUCED) {
      map.jumpTo({ ...cam, padding });
      flightEnd = 0;
      return;
    }
    const duration = dur ?? 4200;
    flightEnd = performance.now() + duration + 250;
    map.flyTo({ ...cam, padding, duration, curve: 1.3, essential: true });
  }

  let terrainOn = false;
  let swayBase = null;
  let swayStart = 0;
  requestAnimationFrame(function tick(t) {
    if (t <= flightEnd || (map.isMoving() && swayBase === null)) {
      swayBase = null;
    } else if (drift && terrainOn) {
      if (swayBase === null) {
        swayBase = map.getBearing();
        swayStart = t;
      }
      const amp = drift * 8; // degrees
      map.setBearing(swayBase + amp * Math.sin(((t - swayStart) / 46000) * Math.PI * 2));
    }
    requestAnimationFrame(tick);
  });

  // ---------- data ----------
  let DOTS = [];
  let COLS = [];
  let SZ = [];
  let SITES = [];
  const dataReady = Promise.all([
    fetch(abs('data/dots.json')).then((r) => r.json()),
    fetch(abs('data/sites.json')).then((r) => r.json()),
    fetch(abs('data/columns.json')).then((r) => r.json()),
    fetch(abs('data/sitezones.json')).then((r) => r.json()).catch(() => []),
  ]).then(([dots, sites, cols, sz]) => {
    DOTS = dots;
    SZ = sz;
    SITES = sites;
    const max = Math.max(...cols.map((c) => c.n));
    COLS = cols.map((c) => ({ ring: columnRing(c.at), at: c.at, k: Math.sqrt(c.n / max) }));
    return { dots, sites };
  });

  // ---------- the opening stream ----------
  let streamed = false;
  // Calls cb once the camera has landed and the view is drawn; returns a cancel function.
  function whenLanded(cb) {
    let h = 0;
    const t0 = performance.now();
    const check = () => {
      const now = performance.now();
      if (now > flightEnd && !map.isMoving() && (map.areTilesLoaded() || now - t0 > 1500)) cb();
      else h = requestAnimationFrame(check);
    };
    h = requestAnimationFrame(check);
    return () => cancelAnimationFrame(h);
  }
  let cancelStream = () => {};
  const unEmit = () => document.querySelectorAll('.emitting').forEach((e) => e.classList.remove('emitting'));
  // The points leave the figure on the card (s.stream is its selector) and land on their districts.
  function runStream(target, padLeft, from) {
    cancelStream();
    cancelStream = whenLanded(() => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const pts = DOTS.map((c) => {
        const p = map.project(c);
        return [p.x, p.y];
      });
      const fig = typeof from === 'string' ? document.querySelector(from) : null;
      const b = fig?.getBoundingClientRect();
      const cardRight = padLeft - W * 0.03;
      const box = b && b.width
        ? { x0: b.left, x1: b.right, y0: b.top + b.height * 0.22, y1: b.bottom - b.height * 0.22 }
        : { x0: cardRight - W * 0.12, x1: cardRight - W * 0.015, y0: H * 0.33, y1: H * 0.58 };
      fig?.classList.add('emitting');
      stream.play(pts, box, {
        onLand: () => {
          paint('dots', 'circle-opacity', target, 0);
          unEmit();
        },
      });
    });
  }
  function setDots(s, instant, padLeft) {
    const wantStream = s.stream && !instant && !REDUCED && !streamed;
    if (wantStream) {
      streamed = true;
      paint('dots', 'circle-opacity', 0, 0);
      runStream(s.dots, padLeft, s.stream);
      return;
    }
    cancelStream();
    unEmit();
    if (stream.running) stream.stop();
    if (s.stream) streamed = true;
    if (!s.stream && s.dots === 0) streamed = false; // replay when the opening is entered again
    paint('dots', 'circle-opacity', s.dots, instant ? 0 : 1.2);
  }

  // ---------- district columns ----------
  // The geometry is uploaded once at full height; each column's growth g (0-1) is feature
  // state, which MapLibre applies on the main thread without re-tiling the source.
  let colTween = null;
  let colsUp = false;
  let dropT = 0;
  let cancelRise = () => {};
  const grow = (f) => COLS.forEach((_, i) => map.setFeatureState({ source: 'columns', id: i }, { g: f(i) }));
  function setColumns(v, instant, padLeft) {
    colTween?.kill();
    cancelRise();
    clearTimeout(dropT);
    if (sweepEl) gsap.set(sweepEl, { autoAlpha: 0 });
    if (!v) {
      paint('columns', 'fill-extrusion-opacity', 0, instant ? 0 : 0.8);
      if (colsUp) dropT = setTimeout(() => grow(() => 0), instant ? 0 : 850);
      colsUp = false;
      return;
    }
    if (colsUp) {
      paint('columns', 'fill-extrusion-opacity', 0.9 * v, instant ? 0 : 0.6);
      return;
    }
    colsUp = true;
    if (instant || REDUCED) {
      paint('columns', 'fill-extrusion-opacity', 0.9 * v, 0);
      grow(() => 1);
      return;
    }
    // The reading light crosses the map from the card's edge; each district's column rises
    // as the light passes over it.
    grow(() => 0);
    cancelRise = whenLanded(() => {
      const W = window.innerWidth;
      const band = W * 0.16;
      const x0 = padLeft - band;
      const x1 = W + band * 0.5;
      const T = 2.6;
      const RISE = 0.9;
      const start = COLS.map((c) => (Math.min(1, Math.max(0, (map.project(c.at).x - x0) / (x1 - x0))) * T));
      const o = { t: 0 };
      const render = () => grow((i) => {
        const u = Math.min(1, Math.max(0, (o.t - start[i]) / RISE));
        return 1 - Math.pow(1 - u, 3);
      });
      paint('columns', 'fill-extrusion-opacity', 0.9 * v, 0.4);
      if (sweepEl) {
        gsap.fromTo(sweepEl, { x: x0 - band / 2, autoAlpha: 1 }, { x: x1 - band / 2, duration: T, ease: 'none' });
        gsap.to(sweepEl, { autoAlpha: 0, duration: 0.5, delay: T - 0.3 });
      }
      colTween = gsap.to(o, { t: T + RISE, duration: T + RISE, ease: 'none', onUpdate: render, onComplete: render });
    });
  }

  // ---------- protected zones: the distance from a site to its nearest zone ----------
  let linkTween = null;
  let zcheckState = false;
  let cancelLink = () => {};
  const lineF = (a, b, z) => ({ type: 'Feature', properties: { z }, geometry: { type: 'LineString', coordinates: [a, b] } });
  function linksFor(mode) {
    if (mode === 'sample') return [{ a: SAMPLE.site, b: SAMPLE.zoneAt, z: SAMPLE.dist }];
    // The area check: every site around the sample that lies outside a zone, joined to the nearest one.
    const out = [];
    SITES.forEach((c, i) => {
      const z = SZ[i];
      if (!z || z[0] === 0 || z[0] > 2500) return;
      if (Math.abs(c[0] - SAMPLE.site[0]) > 0.06 || Math.abs(c[1] - SAMPLE.site[1]) > 0.045) return;
      out.push({ a: c, b: [z[1], z[2]], z: z[0] });
    });
    return out;
  }
  function setZcheck(mode, instant) {
    linkTween?.kill();
    cancelLink();
    map.setFeatureState({ source: 'zones', id: SAMPLE.zoneId }, { hit: mode === 'sample' });
    zoneMk.show(mode === 'sample');
    if (!mode) {
      distMk.show(false);
      paint('link', 'line-opacity', 0, instant ? 0 : 0.6);
      paint('link-glow', 'line-opacity', 0, instant ? 0 : 0.6);
      zcheckState = false;
      return;
    }
    if (zcheckState === mode && !instant) return;
    zcheckState = mode;
    const links = linksFor(mode);
    const src = map.getSource('link');
    const drawTo = (u) => src.setData({
      type: 'FeatureCollection',
      features: links.map((l) => lineF(l.a, [l.a[0] + (l.b[0] - l.a[0]) * u, l.a[1] + (l.b[1] - l.a[1]) * u], l.z)),
    });
    distMk.show(false);
    paint('link', 'line-opacity', 1, 0);
    paint('link-glow', 'line-opacity', mode === 'sample' ? 0.35 : 0, 0);
    if (instant || REDUCED) {
      drawTo(1);
      distMk.show(mode === 'sample');
      return;
    }
    drawTo(0);
    // The measuring line runs out from the site once the camera has landed.
    cancelLink = whenLanded(() => {
      const o = { u: 0 };
      linkTween = gsap.to(o, {
        u: 1, duration: mode === 'sample' ? 1.6 : 2.2, ease: 'power2.inOut', delay: 0.4, onUpdate: () => drawTo(o.u),
        onComplete: () => distMk.show(mode === 'sample'),
      });
    });
  }

  // ---------- theme ----------
  function setTheme(theme) {
    const P = PAL[theme] || PAL.dark;
    const set = (l, p, v) => { if (map.getLayer(l)) map.setPaintProperty(l, p, v); };
    set('bg', 'background-color', P.ground);
    set('mask', 'fill-color', P.mask);
    set('veil', 'fill-color', P.ground);
    set('world-line', 'line-color', P.line);
    set('nb-line', 'line-color', P.nb);
    set('districts-line', 'line-color', P.hi);
    set('regions-line', 'line-color', P.hi);
    set('uzb-line', 'line-color', P.hi);
    set('dots', 'circle-color', P.dots);
    set('sat', 'raster-brightness-max', P.bright);
    set('rings', 'line-color', P.ink);
    set('link', 'line-color', P.ink);
    set('link-glow', 'line-color', theme === 'light' ? '#ffffff' : '#ffffff');
    try {
      map.setSky({
        'sky-color': P.sky, 'horizon-color': P.horizon, 'fog-color': P.sky,
        'fog-ground-blend': 0.8, 'horizon-fog-blend': 0.6, 'sky-horizon-blend': 0.75,
        'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 0.9, 5, 0.6, 8, 0],
      });
    } catch { /* sky not ready yet */ }
    plume?.setTheme(theme);
  }

  function applyNow(spec, { instant = false, padLeft = 0 } = {}) {
    const s = { ...DEF, ...spec };
    const padKey = `${Math.round(padLeft / 16)}|${s.padTop}`;
    if (s.cam && (s.cam !== state.cam || padKey !== state.padKey)) {
      fly(s.cam, { instant, padLeft, padTop: s.padTop, dur: s.camDur });
      state.cam = s.cam;
      state.padKey = padKey;
      state.padTop = s.padTop;
    }
    drift = REDUCED || STILL ? 0 : s.drift;
    const d = instant ? 0 : 1.6;
    paint('sat', 'raster-opacity', s.sat, d);
    paint('sat', 'raster-saturation', s.dim > 0 ? -0.6 : -0.34, d);
    paint('mask', 'fill-opacity', s.mask, d);
    paint('veil', 'fill-opacity', s.dim, d);
    paint('world-line', 'line-opacity', s.world, d);
    paint('nb-line', 'line-opacity', s.nb, d);
    paint('regions-line', 'line-opacity', s.regions, d);
    paint('districts-line', 'line-opacity', s.districts, d);
    paint('uzb-glow', 'line-opacity', s.uzb * 0.5, d);
    paint('uzb-line', 'line-opacity', s.uzb, d);
    paint('sites', 'circle-opacity', s.sites, d);
    paint('sites', 'circle-stroke-opacity', s.sites, d);
    paint('sites-glow', 'circle-opacity', s.sites * 0.35, d);
    setDots(s, instant, padLeft);
    setColumns(s.columns, instant, padLeft);
    // Zones and flagged sites leave quickly, before a long flight starts drawing new ground.
    const dz = s.zones ? d : (instant ? 0 : 0.6);
    const ds = s.sitesZ ? d : (instant ? 0 : 0.6);
    paint('zones-fill', 'fill-opacity', s.zones * 0.28, dz);
    paint('zones-line', 'line-opacity', s.zones * 0.95, dz);
    paint('zones-pt', 'circle-opacity', s.zones, dz);
    paint('zones-pt', 'circle-stroke-opacity', s.zones, dz);
    paint('sites-z', 'circle-opacity', s.sitesZ, ds);
    paint('sites-z', 'circle-stroke-opacity', s.sitesZ * 0.8, ds);
    paint('plume-fill', 'fill-opacity', s.plume ? 0.14 : 0, instant ? 0 : 2.4);
    paint('rings', 'line-opacity', s.plume ? 0.75 : 0, d);
    ringMks.forEach((r) => r.mk.show(s.plume));
    windMk.show(s.plume);
    if (s.plume) plume?.start(instant); else plume?.stop();
    setZcheck(s.zcheck, instant);
    sample.show(!!(s.zcheck || s.plume));
    tash.show(s.tashkent);
    legendEl?.classList.toggle('on', !!s.legend);
    zonesLegendEl?.classList.toggle('on', !!s.legendZones);
    zonesLegendEl?.classList.toggle('with-sites', !!s.sitesZ);
  }

  let loaded = false;
  let pending = null;
  const ready = new Promise((resolve) => {
    map.on('load', async () => {
      const { dots, sites } = await dataReady;
      map.getSource('dots').setData(pointsF(dots));
      // Each site carries its distance to the nearest protected zone (z, metres; 0 = inside).
      map.getSource('sites').setData({
        type: 'FeatureCollection',
        features: sites.map((c, i) => ({ type: 'Feature', properties: { z: SZ[i] ? SZ[i][0] : 99999 }, geometry: { type: 'Point', coordinates: c } })),
      });
      map.getSource('plume').setData(RINGS.plume);
      map.getSource('rings').setData(RINGS.rings);
      setTheme(getTheme());
      map.getSource('columns').setData({
        type: 'FeatureCollection',
        features: COLS.map((c, i) => ({ ...polyF(c.ring, { k: c.k, h: COL_H * c.k }), id: i })),
      });
      loaded = true;
      if (pending) applyNow(pending.spec, { ...pending.opts, instant: true });
      pending = null;
      // Terrain goes on only once the first view is fully drawn; enabling it earlier
      // leaves the boundary lines out of the terrain's draped texture.
      let fallback = 0;
      const enableTerrain = () => {
        if (terrainOn) return;
        clearTimeout(fallback);
        map.setTerrain({ source: 'dem', exaggeration: 1.35 });
        terrainOn = true;
      };
      map.once('idle', enableTerrain);
      fallback = setTimeout(enableTerrain, 6000);
      resolve(map);
    });
  });

  return {
    map,
    ready,
    apply(spec, opts) {
      if (!loaded) {
        pending = { spec, opts };
        return;
      }
      applyNow(spec, opts);
    },
    relocalize: labelMarkers,
    setTheme,
    // After a window resize: re-aim the current camera for the new screen size.
    refit(padLeft) {
      if (state.cam) fly(state.cam, { instant: true, padLeft, padTop: state.padTop || 0 });
      state.padKey = `${Math.round(padLeft / 16)}|${state.padTop || 0}`;
    },
  };
}
