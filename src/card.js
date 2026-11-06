// The narrative panel: one heading, one or two sentences, optional evidence block, optional note.
import { icon } from './icons.js';

const LOGO = `${import.meta.env.BASE_URL}brand/eco-expert-ai.png`;

const BLOCKS = {
  // rows: [icon, html]
  facts: ({ rows = [] }) => `
    <ul class="facts">
      ${rows.map(([ic, html]) => `<li>${icon(ic)}<span>${html}</span></li>`).join('')}
    </ul>`,
  // The emissions of the plume step: a swatch per substance, matching its particles on the map.
  table: ({ head = [], rows = [] }) => `
    <table class="emis">
      <thead><tr><th></th>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(([k, name, ty, pk]) => `<tr class="${ty === '0' ? 'nil' : ''}"><td><i class="sw sw-${k}"></i></td><td>${name}</td><td class="mono">${ty}</td><td class="mono">${pk}</td></tr>`).join('')}</tbody>
    </table>`,
};

function hero(c) {
  // sig: one line ['a', 'b'] or explicit lines [['a', 'b'], ['c']]; separators only within a line.
  const lines = Array.isArray(c.sig[0]) ? c.sig : [c.sig];
  return `
    <img class="crest" data-in src="${LOGO}" alt="ECO-EXPERT.AI" />
    <h1 data-in>ECO-EXPERT.AI</h1>
    <p class="sub" data-in>${c.sub}</p>
    <p class="byline" data-in>${lines.map((l) => `<span class="bl">${l.map((s) => `<span>${s}</span>`).join('')}</span>`).join('')}</p>`;
}

export function renderCard(c = {}, layout = 'side') {
  const el = document.createElement('article');
  el.className = `card card--${layout}`;
  if (c.hero) {
    el.innerHTML = hero(c);
    return el;
  }
  const block = c.block ? BLOCKS[c.block.type](c.block) : '';
  el.innerHTML = `
    ${c.title ? `<h1 data-in>${c.title}</h1>` : ''}
    ${c.body ? `<p class="body" data-in>${c.body}</p>` : ''}
    ${block ? `<div class="block" data-in>${block}</div>` : ''}
    ${c.note ? `<p class="note" data-in>${c.note}</p>` : ''}`;
  return el;
}
