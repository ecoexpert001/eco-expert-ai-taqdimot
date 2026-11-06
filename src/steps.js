// The storyboard. Every claim and figure comes from the ECO-EXPERT.AI deck; sample content and
// stand-in data are labelled where they appear. Card text lives in src/lang/*.js under the step's id.
// layout: hero | center | top | side (default). map: camera + layer state. visual: right-hand visual and phase.
import { T } from './i18n.js';

const agent = (n) => ({ show: true, at: n });
// A dim backdrop under a step's visual: the lit border and the conclusion points stay above the veil.
const backdrop = (cam, extra = {}) => ({
  cam, sat: 0.9, mask: 0.6, uzb: 0.3, nb: 0.12, world: 0.08, dim: 0.72, drift: 0.12, dots: 0.32, ...extra,
});
const APPLICATION = backdrop('country');
const CONSULT = backdrop('consult');
const REVIEW = backdrop('tashkent', { dots: 0, uzb: 0.2 });
const LIBRARY = backdrop('library', { dots: 0, uzb: 0.2 });
const OVERSIGHT = backdrop('overview', { dots: 0.4 });
// Close-ups of the sample company in Chirchiq: real imagery, the protected zones over it.
const CLOSE = { sat: 1, mask: 0, uzb: 0, nb: 0, world: 0, dim: 0.18, drift: 0.1, zones: 1 };

const STORY = [
  // 1 — Opening
  { id: 'open', layout: 'hero', cue: true, card: { hero: true },
    map: { cam: 'globe', sat: 0.9, mask: 0.5, uzb: 1, nb: 0.3, world: 0.25, drift: 0.3 } },
  // 2 — The record the agents work on, landing on the map
  { id: 'record',
    map: { cam: 'country', stream: '#card-slot .card:last-child .fig', dots: 0.9, sat: 0.9, mask: 0.62, uzb: 0.85, nb: 0.2, world: 0.12, dim: 0.3, drift: 0 } },
  // 3 — The platform
  { id: 'platform', layout: 'top', visual: { type: 'vein', phase: 0 }, map: backdrop('country', { dim: 0.72, dots: 0 }) },

  // 4–7 — 01 ECO-INTAKE
  { id: 'in1', visual: { type: 'intake', phase: 0 }, rail: agent(1), map: APPLICATION },
  { id: 'in2', visual: { type: 'intake', phase: 1 }, rail: agent(1), map: APPLICATION },
  { id: 'in3', visual: { type: 'intake', phase: 2 }, rail: agent(1), map: APPLICATION },
  { id: 'inZone', block: 'facts', rail: agent(1), map: { ...CLOSE, cam: 'sample', zcheck: 'sample', legendZones: true } },

  // 8–10 — 02 ECO-CONSULT
  { id: 'co1', visual: { type: 'consult', phase: 0 }, rail: agent(2), map: CONSULT },
  { id: 'co2', visual: { type: 'consult', phase: 1 }, rail: agent(2), map: CONSULT },
  { id: 'co3', visual: { type: 'consult', phase: 2 }, rail: agent(2), map: CONSULT },

  // 11–12 — 03 ECO-COMPARE
  { id: 'cm1', visual: { type: 'compare', phase: 0 }, rail: agent(3), map: REVIEW },
  { id: 'cm2', visual: { type: 'compare', phase: 1 }, rail: agent(3), map: REVIEW },

  // 13–14 — 04 ECO-EXPERT COPILOT
  { id: 'cp1', visual: { type: 'copilot', phase: 0 }, rail: agent(4), map: LIBRARY },
  { id: 'cp2', visual: { type: 'copilot', phase: 1 }, rail: agent(4), map: LIBRARY },

  // 15–18 — 05 ECO-CONTROL
  { id: 'au1', visual: { type: 'audit', phase: 0 }, rail: agent(5), map: OVERSIGHT },
  { id: 'au2', visual: { type: 'audit', phase: 1 }, rail: agent(5), map: OVERSIGHT },
  { id: 'au3', visual: { type: 'audit', phase: 2 }, rail: agent(5), map: OVERSIGHT },
  { id: 'auZone', block: 'facts', rail: agent(5),
    map: { ...CLOSE, cam: 'area', dim: 0.24, sitesZ: 1, zcheck: 'area', legendZones: true } },

  // 19–24 — 06 ECO-MAP: the map itself
  { id: 'mp1', rail: agent(6),
    map: { cam: 'overview', sat: 0.9, mask: 0.62, uzb: 0.8, nb: 0.18, world: 0.1, dim: 0.35, drift: 0.12, dots: 0.85 } },
  { id: 'mp2', rail: agent(6),
    map: { cam: 'east', sat: 0.95, mask: 0.55, uzb: 0.85, nb: 0.25, world: 0.1, dim: 0.12, drift: 0.22, sites: 1, districts: 0.16 } },
  { id: 'mpZones', rail: agent(6),
    map: { legendZones: true, cam: 'zones', sat: 0.95, mask: 0.55, uzb: 0.85, nb: 0.25, world: 0.1, dim: 0.3, drift: 0.18, sitesZ: 0.85, zones: 1 } },
  { id: 'mpPlume', block: 'table', rail: agent(6),
    map: { ...CLOSE, cam: 'plume', dim: 0.22, zones: 0.85, plume: true, legendZones: true } },
  { id: 'mp3', rail: agent(6),
    map: { legend: true, cam: 'wide', sat: 0.95, mask: 0.55, uzb: 0.85, nb: 0.25, world: 0.1, dim: 0.22, drift: 0.22, sites: 0.6, districts: 0.3, columns: 1 } },
  { id: 'mp4', rail: agent(6),
    map: { legend: true, cam: 'regions', sat: 0.95, mask: 0.6, uzb: 0.9, nb: 0.25, world: 0.12, dim: 0.22, drift: 0.2, sites: 0.35, regions: 0.9, columns: 0.62 } },

  // 25–27 — A reliable foundation
  { id: 'prem', visual: { type: 'premise', phase: 0 }, map: backdrop('tashkent', { dots: 0, uzb: 0.2 }) },
  { id: 'laws', block: 'facts', visual: { type: 'laws', phase: 0 }, map: backdrop('country', { dots: 0.3 }) },
  { id: 'recap', layout: 'top', visual: { type: 'vein', phase: 1 }, map: backdrop('country', { dim: 0.72, dots: 0 }) },

  // 28 — Close
  { id: 'close', layout: 'center',
    map: { cam: 'globe', padTop: 0.4, sat: 0.9, mask: 0.5, uzb: 1, nb: 0.3, world: 0.25, dim: 0.25, drift: 0.3 } },
];

/** The steps with the card text of the current language. */
export function buildSteps() {
  const S = T().steps;
  return STORY.map((s) => {
    const txt = S[s.id] || {};
    const card = { ...(s.card || {}), ...txt };
    if (s.block === 'facts') card.block = { type: 'facts', rows: txt.rows };
    if (s.block === 'table') card.block = { type: 'table', ...txt.table };
    return { ...s, card };
  });
}
