import '@fontsource-variable/geologica';
import '@fontsource-variable/martian-mono';
import './styles.css';
import { createMapStage } from './map.js';
import { createRail } from './rail.js';
import { createEngine } from './engine.js';
import { buildSteps } from './steps.js';
import { icon } from './icons.js';
import { LANGS, LANG_ORDER, T, getLang, getTheme, onChange, setLang, cycleLang, toggleTheme } from './i18n.js';
import { gsap } from 'gsap';

// Review captures (?shot) run in software rendering: keep animations on the clock there.
if (new URLSearchParams(window.location.search).has('shot')) gsap.ticker.lagSmoothing(0);

const $ = (s) => document.querySelector(s);

// The on-screen controls: language and theme. Keys: L cycles the language, T switches the theme.
const ctl = $('#ctl');
ctl.innerHTML = `
  <div class="ctl-lang" role="group">${LANG_ORDER.map((l) => `<button type="button" data-lang="${l}">${LANGS[l].name}</button>`).join('')}</div>
  <button type="button" class="ctl-theme" data-theme-toggle><span class="t-dark">${icon('moon')}</span><span class="t-light">${icon('sun')}</span></button>`;
ctl.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.lang) setLang(b.dataset.lang);
  if ('themeToggle' in b.dataset) toggleTheme();
  b.blur();
});

function chrome() {
  const t = T();
  $('#cue').innerHTML = `<span>${t.ui.next}</span><span class="key">${icon('arrowRight')}</span>`;
  $('#credits').textContent = t.credits;
  $('#legend').innerHTML = `<i class="lg-col" aria-hidden="true"></i><span><b>${t.legend.colTitle}</b>${t.legend.colText}</span>`;
  const L = t.legend;
  $('#legend-zones').innerHTML = `
    <b>${L.zonesTitle}</b>
    <ul>
      <li><i class="lz water"></i>${L.water}</li>
      <li><i class="lz reservoir"></i>${L.reservoir}</li>
      <li><i class="lz groundwater"></i>${L.groundwater}</li>
      <li><i class="lz forest"></i>${L.forest}</li>
      <li class="lz-site"><i class="ls in"></i>${L.inside}</li>
      <li class="lz-site"><i class="ls out"></i>${L.outside}</li>
    </ul>`;
  ctl.querySelector('.ctl-lang').setAttribute('aria-label', t.ui.lang);
  ctl.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === getLang())));
  const tb = ctl.querySelector('.ctl-theme');
  tb.setAttribute('aria-label', t.ui.theme);
  tb.title = t.ui.theme;
}
chrome();

const mapApi = createMapStage($('#map'), $('#stream'), $('#mapsweep'), $('#legend'), $('#legend-zones'), $('#plume'));
const engine = createEngine({
  steps: buildSteps(),
  stage: $('#stage'),
  cardSlot: $('#card-slot'),
  visualSlot: $('#visual-slot'),
  rail: createRail($('#rail')),
  mapApi,
  count: $('#count'),
  cue: $('#cue'),
  mark: $('#mark'),
  onKey: (k) => {
    if (k === 'l' || k === 'L') cycleLang();
    else if (k === 't' || k === 'T') toggleTheme();
  },
});

let lastLang = getLang();
let lastTheme = getTheme();
onChange(({ lang, theme }) => {
  if (lang !== lastLang) {
    lastLang = lang;
    chrome();
    mapApi.relocalize();
    engine.refresh(buildSteps());
  }
  if (theme !== lastTheme) {
    lastTheme = theme;
    mapApi.setTheme(theme);
  }
});

const start = parseInt(window.location.hash.slice(1), 10);
engine.go(Number.isFinite(start) ? start - 1 : 0, { instant: Number.isFinite(start) && start > 1 });
if (import.meta.env.DEV) window.__engine = engine;
