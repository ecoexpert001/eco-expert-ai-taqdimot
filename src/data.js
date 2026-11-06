// Facts from the ECO-EXPERT.AI deck. Names are fixed; roles and figures come from the current language.
import { T } from './i18n.js';

const NAMES = ['ECO-INTAKE', 'ECO-CONSULT', 'ECO-COMPARE', 'ECO-EXPERT COPILOT', 'ECO-CONTROL', 'ECO-MAP'];

export const stages = () => T().stages;
export const agents = () => NAMES.map((name, i) => ({ n: String(i + 1).padStart(2, '0'), name, ...T().agents[i] }));

// City-level position only; no office or server location is claimed.
export const TASHKENT = [69.2401, 41.2995];

// The sample company of the zone check and the plume: an OpenStreetMap industrial site in Chirchiq
// (sites.json index 4696), 930 m from the Chirchiq river water protection zone (zones.geojson feature 74).
export const SAMPLE = {
  site: [69.5852, 41.4636],
  zoneAt: [69.59596, 41.46141],
  zoneId: 74,
  dist: 930,
  windTo: 112, // degrees: the plume heads east-south-east (wind from the west-north-west)
};
