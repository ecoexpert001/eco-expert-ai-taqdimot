// The docked vein: the six agents along the expertise process, grouped in its three stages.
import { agents, stages } from './data.js';
import { T } from './i18n.js';

const third = 100 / 3;
export const railX = (i) => (Math.floor(i / 2) + (i % 2 ? 0.72 : 0.28)) * third; // % of rail width
const GAP = 1.2; // % between stage segments

export function createRail(el) {
  let fills = [];
  let terms = [];
  let last = {};

  function render() {
    el.setAttribute('aria-label', T().ui.rail);
    el.innerHTML = `
      ${stages().map((s, k) => `
        <div class="vr-seg" style="left:${k * third + GAP / 2}%;width:${third - GAP}%">
          <span class="vr-stage">${s}</span>
          <i class="vr-line"><i class="vr-fill"></i></i>
        </div>`).join('')}
      ${agents().map((a, i) => `
        <div class="vr-t" style="left:${railX(i)}%">
          <span class="term"><i></i></span>
          <span class="lb"><span class="n mono">${a.n}</span>${a.name}</span>
        </div>`).join('')}`;
    fills = [...el.querySelectorAll('.vr-fill')];
    terms = [...el.querySelectorAll('.vr-t')];
  }

  // at: the agent on stage now (1-6); agents before it are marked as seen.
  function set({ show = false, at = 0 } = {}) {
    last = { show, at };
    el.classList.toggle('on', show);
    terms.forEach((t, i) => {
      t.classList.toggle('seen', i < at - 1);
      t.classList.toggle('now', i === at - 1);
      t.toggleAttribute('aria-current', i === at - 1);
    });
    const cur = at - 1;
    fills.forEach((f, k) => {
      const segStart = k * third + GAP / 2;
      const segW = third - GAP;
      let w = 0;
      if (cur >= 0 && Math.floor(cur / 2) > k) w = 100;
      else if (cur >= 0 && Math.floor(cur / 2) === k) w = ((railX(cur) - segStart) / segW) * 100;
      f.style.width = `${Math.max(0, Math.min(100, w))}%`;
    });
  }

  render();
  return {
    set,
    // Re-render in the current language, keeping the current state without the fill animation.
    relocalize() {
      render();
      fills.forEach((f) => { f.style.transition = 'none'; });
      set(last);
      requestAnimationFrame(() => fills.forEach((f) => { f.style.transition = ''; }));
    },
  };
}
