// Right-hand visuals. Each one is a fixed drawing authored in rem (its SVG overlay counts in
// tenths of a rem), so traces always land on their terminals. A phase adds its animation to a
// GSAP timeline; jumping or going back rebuilds the template and fast-forwards the same
// timeline, so the animated and the static states never drift apart.
import { gsap } from 'gsap';
import { agents, stages } from './data.js';
import { icon } from './icons.js';
import { T } from './i18n.js';

const V = () => T().viz;

const q = (r, s) => r.querySelector(s);
const qa = (r, s) => [...r.querySelectorAll(s)];
const R = (v) => `${v}rem`;
const at = (x, y, w, h) => `left:${R(x)};top:${R(y)};${w != null ? `width:${R(w)};` : ''}${h != null ? `height:${R(h)};` : ''}`;
const mono = (v) => `<span class="mono">${v}</span>`;

function toEl(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function draw(tl, path, { d = 0.9, at: when, e = 'power2.inOut' } = {}) {
  const L = path.getTotalLength();
  tl.set(path, { strokeDasharray: `${L} ${L}`, strokeDashoffset: L, autoAlpha: 1 }, when);
  tl.to(path, { strokeDashoffset: 0, duration: d, ease: e }, '<');
}

const pop = (tl, els, when, o = {}) =>
  tl.fromTo(els, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.08, ...o }, when);
const popIn = (tl, els, when, stagger = 0.08) =>
  tl.fromTo(els, { autoAlpha: 0, scale: 0.3, transformOrigin: '50% 50%', smoothOrigin: false }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2.4)', stagger, transformOrigin: '50% 50%', smoothOrigin: false }, when);

// A circuit terminal from the logo: a ring with a white core. x, y in overlay units (0.1rem).
const tm = (x, y, cls = 'teal', r = 7) =>
  `<g transform="translate(${x} ${y})"><g class="tm ${cls}"><circle class="r" r="${r}"/><circle class="c" r="${(r * 0.42).toFixed(1)}"/></g></g>`;
// A trace: horizontal, a 45-degree run (steeper when the gap is short), horizontal.
function bend(x1, y1, x2, y2, lead = 0.5) {
  const dy = y2 - y1;
  const dx = x2 - x1;
  if (Math.abs(dy) < 0.5) return `M${x1} ${y1} H${x2}`;
  const diag = Math.max(0, Math.min(Math.abs(dy), Math.abs(dx) - 6));
  const sx = Math.sign(dx);
  const xa = x1 + sx * (Math.abs(dx) - diag) * lead;
  return `M${x1} ${y1} H${xa} L${xa + sx * diag} ${y2} H${x2}`;
}
// Placeholder lines for text the deck does not supply.
const lines = (n, cls = '') => Array.from({ length: n }, (_, i) => `<i class="ph ${cls}" style="width:${[92, 78, 86, 64, 88, 72, 58][i % 7]}%"></i>`).join('');
// The label travels with the visual through every phase: sample content says so where it appears.
const sample = (text, y, cls = '') => `<p class="smp ${cls}" style="${at(0, y, 46)}">${text}</p>`;
// Swap the first label for the later one as the visual gains what the later one names.
const relabel = (r, tl, when) => {
  tl.to(q(r, '.smp:not(.later)'), { autoAlpha: 0, duration: 0.3 }, when);
  tl.fromTo(q(r, '.smp.later'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, when + 0.3);
};

function viz(host, html, phases) {
  const el = toEl(html);
  host.appendChild(el);
  const original = el.innerHTML;
  const originalClass = el.className;
  const originalStyle = el.getAttribute('style') || '';
  let tl = null;
  let cur = -1;
  const build = (from, to, lead = 0) => {
    const t = gsap.timeline({ paused: true });
    if (lead) t.to({}, { duration: lead });
    for (let k = from; k <= to; k++) phases[k]?.(el, t);
    return t;
  };
  return {
    el,
    set(p, { instant = false, lead = 0 } = {}) {
      if (tl) {
        tl.progress(1, false);
        tl.kill();
        tl = null;
      }
      if (instant || p < cur) {
        el.innerHTML = original;
        el.className = originalClass;
        el.setAttribute('style', originalStyle);
        const t = build(0, p);
        t.progress(1, false);
        t.kill();
      } else if (p > cur) {
        tl = build(cur + 1, p, lead);
        tl.play();
      }
      cur = p;
    },
    destroy() {
      tl?.kill();
      el.remove();
    },
  };
}

/* ---------- The platform: the logo's leaf vein with six branches ---------- */
function vein(host) {
  const AGENTS = agents();
  const STAGES = stages();
  const W = 84;
  const H = 26;
  const Y = 14;
  const root = (i) => 5.5 + 13.2 * i;
  const tx = (i) => root(i) + 4.5;
  const ty = (i) => (i % 2 ? Y + 4.5 : Y - 4.5);
  const span = (k) => [root(2 * k) - 2.4, tx(2 * k + 1) + 4.2];
  return viz(host, `
  <div class="viz viz-vein" style="width:${R(W)};height:${R(H)}">
    ${STAGES.map((s, k) => {
      const [a, b] = span(k);
      return `<div class="vs" style="${at(a, 0, b - a)}"><span>${s}</span><i></i></div>`;
    }).join('')}
    <svg class="ov" viewBox="0 0 ${W * 10} ${H * 10}" aria-hidden="true">
      <path class="tr vein" d="M10 ${Y * 10} H${(W - 1) * 10}"/>
      ${AGENTS.map((_, i) => `<path class="tr br" d="M${root(i) * 10} ${Y * 10} L${tx(i) * 10} ${ty(i) * 10}"/>`).join('')}
      <g class="ends">${tm(10, Y * 10, 'teal', 4.5)}${tm((W - 1) * 10, Y * 10, 'teal', 4.5)}</g>
      <g class="ts">${AGENTS.map((_, i) => tm(tx(i) * 10, ty(i) * 10, 'teal', 11)).join('')}</g>
    </svg>
    ${AGENTS.map((a, i) => `
      <div class="vl ${i % 2 ? 'dn' : 'up'}" style="left:${R(tx(i))};top:${R(i % 2 ? ty(i) + 2 : ty(i) - 2)}">
        <div class="vl-in"><span class="vl-n mono">${a.n}</span><b>${a.name}</b><span class="vl-r">${a.role}</span><span class="vl-f">${a.fig}</span></div>
      </div>`).join('')}
  </div>`, [
    (r, tl) => {
      pop(tl, qa(r, '.vs'), 0, { stagger: 0.15 });
      draw(tl, q(r, '.vein'), { d: 1.7, at: 0.1 });
      popIn(tl, qa(r, '.ends .tm'), 0.1, 1.5);
      qa(r, '.br').forEach((p, i) => {
        const t = 0.25 + ((root(i) - 1) / (W - 2)) * 1.5;
        draw(tl, p, { d: 0.38, at: t, e: 'power2.out' });
        popIn(tl, qa(r, '.ts .tm')[i], t + 0.3);
        pop(tl, qa(r, '.vl-in')[i], t + 0.34);
      });
    },
    // The recap: each agent's figure from the deck joins its label.
    (r, tl) => {
      tl.call(() => r.classList.add('lit'));
      tl.fromTo(qa(r, '.vl-f'), { autoAlpha: 0, height: 0 }, { autoAlpha: 1, height: 'auto', duration: 0.7, ease: 'expo.out', stagger: 0.12 });
    },
  ]);
}

/* ---------- 01 ECO-INTAKE: 3–4 hours by hand, 90 seconds by the agent ---------- */
const IN_ST = ['leaf', 'leaf', 'amber', 'leaf', 'amber', 'leaf'];
const IN = { px: 1, py: 9.4, row0: 5.6, rowH: 3.3, mx: 20.5, sx: 27, sy: 14.6 };
const inRowY = (i) => IN.py + IN.row0 + IN.rowH * i + IN.rowH / 2;
const inDefY = (k) => IN.sy + 5.2 + 1.9 + 3.8 * k;

function intake(host) {
  const v = V();
  const IN_ROWS = v.inRows.map((l, i) => [l, IN_ST[i]]);
  const IN_DEFS = v.inDefs;
  const flagged = IN_ROWS.map((row, i) => [row, i]).filter(([row]) => row[1] === 'amber');
  return viz(host, `
  <div class="viz viz-intake" style="width:46rem;height:37rem">
    <div class="tbars" style="${at(0, 0, 46)}">
      <div class="tb hand"><span class="tb-l">${v.byHand}</span><span class="tb-track"><i class="tb-fill"></i><i class="tb-range"></i></span><span class="tb-v">${mono('3–4')} ${v.h}</span></div>
      <div class="tb ai"><span class="tb-l">ECO-INTAKE</span><span class="tb-track"><i class="tb-fill"></i></span><span class="tb-v">${mono('<span class="ctr">90</span>')} ${v.s}</span></div>
      <div class="tb-scale"><span class="tb-l"></span><span class="tb-ticks">${[0, 1, 2, 3, 4].map((h) => `<span>${h ? `${mono(h)} ${v.h}` : mono(0)}</span>`).join('')}</span><span class="tb-v"></span></div>
    </div>
    <i class="under u2" style="${at(IN.px + 1.2, IN.py - 1.2, 18, 26.4)}"></i>
    <i class="under u1" style="${at(IN.px + 0.6, IN.py - 0.6, 18, 26.4)}"></i>
    <article class="paper app" style="${at(IN.px, IN.py, 18, 26.4)}">
      <header class="pd-hd"><b class="pd-title">${v.application}</b><span class="pd-id">${v.appSub}</span></header>
      <ol class="pd-rows" style="top:${R(IN.row0)}">
        ${IN_ROWS.map(([l], i) => `<li style="height:${R(IN.rowH)}"><span class="pd-n mono">${i + 1}</span><span class="pd-l">${l}</span><i class="pd-rule"></i></li>`).join('')}
      </ol>
      <i class="beam"></i>
      <i class="hand-l"></i>
    </article>
    <svg class="ov" viewBox="0 0 460 370" aria-hidden="true">
      ${flagged.map(([, i], k) => `<path class="tr amber df" d="${bend((IN.mx + 0.8) * 10, inRowY(i) * 10, (IN.sx + 1.2) * 10, inDefY(k) * 10, 0.4)}"/>`).join('')}
      <g class="marks">${IN_ROWS.map(([, st], i) => tm(IN.mx * 10, inRowY(i) * 10, st)).join('')}</g>
    </svg>
    <div class="sheet defs" style="${at(IN.sx, IN.sy, 19)}">
      <header class="sheet-hd">${icon('clipboardList')}<div class="sh-t"><b>${v.defsTitle}</b><span>${v.defsBy}</span></div></header>
      <ol class="def-list">
        ${IN_DEFS.map(([t, s]) => `<li><span class="term amber"><i></i></span><div><b>${t}</b><span>${s}</span></div></li>`).join('')}
      </ol>
      <footer class="def-ft">${v.defsFt}</footer>
    </div>
    ${sample(v.inSmp, 36.1)}${sample(v.inSmp2, 36.1, 'later')}
  </div>`, [
    (r, tl) => {
      const T0 = 0.5; // let the platform vein leave first
      tl.set(qa(r, '.under, .app, .ov, .smp'), { x: R(12.4) }, 0);
      // The paper stack: the two sheets underneath slide in first, then the application settles on top.
      tl.fromTo(q(r, '.u2'), { autoAlpha: 0, x: R(22), rotation: 7, y: 40 }, { autoAlpha: 1, x: R(12.4), rotation: 0, y: 0, duration: 1.5, ease: 'expo.out' }, T0);
      tl.fromTo(q(r, '.u1'), { autoAlpha: 0, x: R(20), rotation: 4.5, y: 34 }, { autoAlpha: 1, x: R(12.4), rotation: 0, y: 0, duration: 1.5, ease: 'expo.out' }, T0 + 0.18);
      tl.fromTo(q(r, '.app'), { autoAlpha: 0, x: R(18), rotation: 2.5, y: 48, scale: 0.96 }, { autoAlpha: 1, x: R(12.4), rotation: 0, y: 0, scale: 1, duration: 1.7, ease: 'expo.out', transformOrigin: '50% 100%' }, T0 + 0.36);
      // The form is laid out section by section.
      tl.fromTo(q(r, '.app .pd-hd'), { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' }, T0 + 1.0);
      const rows = qa(r, '.pd-rows li');
      rows.forEach((li, i) => {
        const t = T0 + 1.25 + i * 0.24;
        tl.fromTo(li, { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'power3.out' }, t);
        tl.fromTo(q(li, '.pd-rule'), { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'power2.out', transformOrigin: '0 50%' }, t + 0.15);
      });
      // Time by hand: the bar fills slowly while a manual reading mark walks down the sections.
      const TB = T0 + 1.0;
      pop(tl, q(r, '.tb.hand'), TB);
      pop(tl, q(r, '.tb-scale'), TB + 0.1);
      tl.fromTo(q(r, '.tb.hand .tb-fill'), { scaleX: 0 }, { scaleX: 1, duration: 3.4, ease: 'power1.inOut', transformOrigin: '0 50%' }, TB + 0.4);
      tl.fromTo(q(r, '.tb.hand .tb-range'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, TB + 3.6);
      const hand = q(r, '.hand-l');
      const HR = T0 + 1.25 + rows.length * 0.24 + 0.3;
      tl.set(hand, { autoAlpha: 0, y: R(IN.row0) }, 0);
      tl.to(hand, { autoAlpha: 1, duration: 0.4 }, HR);
      rows.forEach((_, i) => tl.to(hand, { y: R(IN.row0 + IN.rowH * i), duration: 0.55, ease: 'power2.inOut' }, HR + 0.1 + i * 0.5));
      tl.to(hand, { autoAlpha: 0, duration: 0.5 }, HR + 0.2 + rows.length * 0.5);
      tl.fromTo(q(r, '.smp:not(.later)'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, T0 + 1.6);
    },
    (r, tl) => {
      tl.set(q(r, '.hand-l'), { autoAlpha: 0 }, 0);
      pop(tl, q(r, '.tb.ai'), 0);
      const ctr = q(r, '.ctr');
      const o = { v: 0 };
      const SWEEP = 2.4;
      tl.call(() => { ctr.textContent = '0'; }, null, 0);
      tl.set(q(r, '.beam'), { autoAlpha: 1, y: R(3.6) }, 0.4);
      tl.to(q(r, '.beam'), { y: R(23.4), duration: SWEEP, ease: 'none' }, 0.4);
      tl.fromTo(o, { v: 0 }, { v: 90, duration: SWEEP, ease: 'none', onUpdate: () => { ctr.textContent = Math.round(o.v); } }, 0.4);
      qa(r, '.marks .tm').forEach((g, i) => popIn(tl, g, 0.4 + Math.max(0, (SWEEP * (IN.row0 + IN.rowH * i + IN.rowH / 2 - 3.2 - 3.6)) / 19.8)));
      tl.to(q(r, '.beam'), { autoAlpha: 0, duration: 0.4 }, 0.4 + SWEEP);
    },
    (r, tl) => {
      tl.to(qa(r, '.under, .app, .ov, .smp'), { x: 0, duration: 1, ease: 'expo.inOut' }, 0);
      relabel(r, tl, 1.2);
      tl.fromTo(q(r, '.defs'), { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: 0.9, ease: 'expo.out' }, 0.55);
      qa(r, '.df').forEach((p, k) => draw(tl, p, { d: 0.8, at: 1.0 + k * 0.2 }));
      pop(tl, qa(r, '.def-list li'), 1.3, { stagger: 0.18 });
      pop(tl, q(r, '.def-ft'), 1.8);
    },
  ]);
}

/* ---------- 02 ECO-CONSULT: the same question, answered at any hour, in three languages ---------- */
const ASKS = [
  ['UZ', '02:14', 'Qaysi hujjatlarni topshirishim kerak?'],
  ['RU', '13:40', 'Сколько длится экспертиза?'],
  ['EN', '23:05', 'How is the fee paid?'],
];
const CS = { y: 1, w: 27.5, top: 5.4, step: 9.2, bus: 30.8, dx: 33, law: 5.2, res: 19, dh: 11.6 };
const chipY = (k) => CS.y + CS.top + CS.step * k + 3.4 + 3.3;

function consult(host) {
  const v = V();
  const CALLS = v.calls;
  const lawY = CS.law + CS.dh / 2;
  const resY = CS.res + CS.dh / 2;
  return viz(host, `
  <div class="viz viz-consult" style="width:46rem;height:37rem">
    <div class="sheet chat-sh" style="${at(0, CS.y, CS.w, 33.5)}">
      <header class="sheet-hd hd-calls">${icon('headset')}<div class="sh-t"><b>${v.opLine}</b><span>${v.opSub}</span></div><span class="chip">${v.queue}</span></header>
      <header class="sheet-hd hd-chat">${icon('messagesSquare')}<div class="sh-t"><b>ECO-CONSULT</b><span>${v.consultSub}</span></div><span class="chip teal">${mono('24/7')}</span></header>
      <ol class="calls">
        ${CALLS.map((c) => `<li>${icon('phone')}<span>${c}</span><span class="wait">${v.waiting}</span></li>`).join('')}
      </ol>
      <div class="chat">
        ${ASKS.map(([lang, time, text], k) => `
          <div class="ask" style="top:${R(CS.top + CS.step * k)}"><i class="scan"></i><span class="lang">${lang}</span><span>${text}</span><span class="time mono">${time}</span></div>
          <div class="ans" style="top:${R(CS.top + CS.step * k + 3.4)}">
            ${lines(2, 'teal')}
            <span class="ans-ft"><span class="time mono">${time}</span><span class="src">${icon('scale')}<span>${v.src}</span></span></span>
          </div>`).join('')}
      </div>
    </div>
    <svg class="ov" viewBox="0 0 460 370" aria-hidden="true">
      ${ASKS.map((_, k) => `<path class="tr lk" d="M213 ${chipY(k) * 10} H${CS.bus * 10}"/>`).join('')}
      <path class="tr lk bus" d="M${CS.bus * 10} ${lawY * 10} V${chipY(2) * 10}"/>
      <path class="tr lk" d="M${CS.bus * 10} ${lawY * 10} H${CS.dx * 10 - 14}"/>
      <path class="tr lk" d="M${CS.bus * 10} ${resY * 10} H${CS.dx * 10 - 14}"/>
      <g class="lk-ends">${ASKS.map((_, k) => tm(206, chipY(k) * 10, 'teal')).join('')}${tm(CS.dx * 10 - 7, lawY * 10, 'teal')}${tm(CS.dx * 10 - 7, resY * 10, 'teal')}</g>
      <g class="joints">${[lawY, resY, ...ASKS.map((_, k) => chipY(k))].map((y) => `<circle class="jn" cx="${CS.bus * 10}" cy="${y * 10}" r="2.6"/>`).join('')}</g>
    </svg>
    <article class="paper law" style="${at(CS.dx, CS.law, 12.5, CS.dh)}">
      <b class="pd-title">${v.law}</b><span class="pd-id">${v.lawNum}</span>${lines(4, 'ink')}
    </article>
    <article class="paper law" style="${at(CS.dx, CS.res, 12.5, CS.dh)}">
      <b class="pd-title">${v.resolution}</b><span class="pd-id">${v.cabinetNo}</span>${lines(3, 'ink')}
    </article>
    <p class="regs" style="${at(CS.dx, 32, 13)}">${icon('library')}${v.otherRegs}</p>
    ${sample(v.coSmp, 35.7)}${sample(v.coSmp2, 35.7, 'later')}
  </div>`, [
    (r, tl) => {
      tl.set(qa(r, '.hd-chat, .chat'), { autoAlpha: 0 }, 0);
      tl.set(qa(r, '.chat-sh, .smp'), { x: R(9.25) }, 0);
      tl.fromTo(q(r, '.chat-sh'), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out' }, 0);
      tl.fromTo(qa(r, '.calls li'), { autoAlpha: 0, y: -18 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.42 }, 0.4);
    },
    (r, tl) => {
      tl.to(qa(r, '.hd-calls, .calls'), { autoAlpha: 0, duration: 0.4 }, 0);
      relabel(r, tl, 0.2);
      tl.to(q(r, '.hd-chat'), { autoAlpha: 1, duration: 0.5 }, 0.3);
      tl.set(q(r, '.chat'), { autoAlpha: 1 }, 0.3);
      // The reading light passes over each question before its answer lands.
      qa(r, '.ask').forEach((a, k) => {
        const t = 0.5 + k * 1.1;
        tl.fromTo(a, { autoAlpha: 0, x: 20 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'expo.out' }, t);
        tl.fromTo(q(a, '.scan'), { xPercent: -100, autoAlpha: 1 }, { xPercent: 260, duration: 0.5, ease: 'power1.inOut' }, t + 0.15);
        tl.set(q(a, '.scan'), { autoAlpha: 0 }, t + 0.66);
        tl.fromTo(qa(r, '.ans')[k], { autoAlpha: 0, x: -20 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'expo.out' }, t + 0.62);
      });
      tl.set(qa(r, '.src'), { autoAlpha: 0 }, 0);
    },
    (r, tl) => {
      tl.to(qa(r, '.chat-sh, .smp'), { x: 0, duration: 1, ease: 'expo.inOut' }, 0);
      tl.fromTo(qa(r, '.law'), { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: 0.8, ease: 'expo.out', stagger: 0.15 }, 0.5);
      popIn(tl, qa(r, '.src'), 0.9, 0.15);
      qa(r, '.lk').forEach((p, i) => draw(tl, p, { d: 0.7, at: 1.2 + i * 0.12 }));
      popIn(tl, qa(r, '.lk-ends .tm'), 1.1, 0.06);
      popIn(tl, qa(r, '.jn'), 1.8, 0.05);
      pop(tl, q(r, '.regs'), 1.6);
    },
  ]);
}

/* ---------- 03 ECO-COMPARE: two stages of one company's conclusion, side by side ---------- */
const FIG_V = [['48.2', '61.5'], ['120', '120'], ['15.4', '15.4'], ['300', '150']];
const REQ_KEPT = [true, false];
const figsOf = () => V().figs.map((l, i) => [l, ...FIG_V[i]]);
const reqsOf = () => V().reqs.map((l, i) => [l, REQ_KEPT[i]]);
const CP = { y: 3.4, lx: 0.5, rx: 28, w: 17.5, h: 27 };
const figY = (i) => CP.y + 7.0 + 1.375 + 2.75 * i;
const reqY = (i) => CP.y + 20.1 + 1.375 + 2.75 * i;

function comparePaper(stage, right) {
  const v = V();
  const FIGS = figsOf();
  const REQS = reqsOf();
  const num = (x) => (T().code === 'en' ? x : x.replace('.', ','));
  return `
    <article class="paper cmp" style="${at(right ? CP.rx : CP.lx, CP.y, CP.w, CP.h)}">
      <header class="pd-hd"><b class="pd-title">${v.conclusion}</b><span class="pd-id">${v.stage} ${mono(stage)} · ${right ? v.nextStage : v.prevConcl}</span></header>
      <b class="pd-sec" style="top:${R(5.3)}">${v.projFigs}</b>
      ${FIGS.map(([l, a, b], i) => `<div class="pd-kv ${a !== b ? 'x' : ''}" style="top:${R(7.0 + 2.75 * i)}"><span class="pd-l">${l}</span><span class="v mono">${num(right ? b : a)}</span></div>`).join('')}
      <b class="pd-sec" style="top:${R(18.4)}">${v.expReqs}</b>
      ${REQS.map(([l, kept], i) => `<div class="pd-kv req ${!kept && right ? 'gone' : ''}" style="top:${R(20.1 + 2.75 * i)}"><span class="pd-n mono">${i + 1}</span><span class="pd-l">${!kept && right ? '' : l}</span>${!kept && right ? `<span class="chip amber nf">${v.notFulfilled}</span>` : ''}</div>`).join('')}
    </article>`;
}

function compare(host) {
  const v = V();
  const FIGS = figsOf();
  const REQS = reqsOf();
  const rows = [
    ...FIGS.map(([, a, b], i) => ({ y: figY(i), st: a === b ? 'leaf' : 'coral' })),
    ...REQS.map(([, kept], i) => ({ y: reqY(i), st: kept ? 'leaf' : 'amber' })),
  ];
  const L = (CP.lx + CP.w + 0.85) * 10;
  const Rx = (CP.rx - 0.85) * 10;
  return viz(host, `
  <div class="viz viz-compare" style="width:46rem;height:37rem">
    ${comparePaper(1, false)}
    ${comparePaper(2, true)}
    <i class="beam-x" style="${at(CP.lx, 0, 45)}"></i>
    <svg class="ov" viewBox="0 0 460 370" aria-hidden="true">
      ${rows.map((rw) => `<g class="pair ${rw.st}"><path class="tr ${rw.st} ${rw.st === 'amber' ? 'dash' : ''}" d="M${L + 7} ${rw.y * 10} H${Rx - 7}"/>${tm(L, rw.y * 10, rw.st)}${rw.st === 'amber' ? `<g transform="translate(${Rx} ${rw.y * 10})"><g class="tm amber open"><circle class="r" r="7"/></g></g>` : tm(Rx, rw.y * 10, rw.st)}${rw.st === 'coral' ? `<g transform="translate(${(L + Rx) / 2} ${rw.y * 10})"><g class="neq"><circle r="10"/><path d="M-4.5 -2.4 H4.5 M-4.5 2.4 H4.5 M2.6 -6 L-2.6 6"/></g></g>` : ''}</g>`).join('')}
    </svg>
    <div class="result" style="${at(0, 32.4, 46)}">
      <span class="chip coral">${icon('equalNot')}${v.mismatched}</span>
      <span class="chip amber">${icon('circleAlert')}${v.unfulfilled}</span>
      <span class="chip teal">${icon('timer')}${v.perCompare}</span>
    </div>
    ${sample(v.cmSmp, 35.6)}
  </div>`, [
    (r, tl) => {
      tl.fromTo(qa(r, '.cmp'), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.14 }, 0.1);
    },
    (r, tl) => {
      const beam = q(r, '.beam-x');
      const SWEEP = 2.4;
      const y0 = 5.4;
      const y1 = 27.6;
      tl.set(beam, { autoAlpha: 1, y: R(y0) }, 0.3);
      tl.to(beam, { y: R(y1), duration: SWEEP, ease: 'none' }, 0.3);
      qa(r, '.pair').forEach((g, i) => {
        const t = 0.3 + (SWEEP * (rows[i].y - 3 - y0)) / (y1 - y0);
        const path = q(g, '.tr');
        popIn(tl, qa(g, '.tm'), t, 0.12);
        if (path.classList.contains('dash')) tl.fromTo(path, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, t + 0.1);
        else draw(tl, path, { d: 0.35, at: t + 0.1 });
        if (rows[i].st !== 'leaf') {
          tl.call(() => qa(r, '.pd-kv').filter((_, k) => k % (FIGS.length + REQS.length) === i).forEach((kv) => kv.classList.add('lit')), null, t);
        }
        const neq = q(g, '.neq');
        if (neq) popIn(tl, neq, t + 0.3);
      });
      tl.to(beam, { autoAlpha: 0, duration: 0.4 }, 0.3 + SWEEP);
      tl.set(qa(r, '.nf'), { autoAlpha: 0 }, 0);
      popIn(tl, qa(r, '.nf'), 0.3 + (SWEEP * (reqY(1) - 3 - y0)) / (y1 - y0) + 0.3);
      pop(tl, qa(r, '.result .chip'), 0.4 + SWEEP, { stagger: 0.14 });
    },
  ]);
}

/* ---------- 04 ECO-EXPERT COPILOT: from the question to the article, with its source ---------- */
const CO = { cx: 27.5, sy: 2.6, step: 7.9, sp: 1.5, hit: [0, 8] };
const shelfY = (k) => CO.sy + CO.step * k;

function copilot(host) {
  const v = V();
  const SHELVES = v.shelves;
  const fresh = [[1, 3], [2, 7], [3, 1], [0, 10], [2, 2]];
  const srcY = 2.6 + 11.4 + 14.2 - 1.9;
  return viz(host, `
  <div class="viz viz-copilot" style="width:46rem;height:37rem">
    <div class="corpus" style="${at(CO.cx, 0, 18.5, 37)}">
    ${SHELVES.map((s, k) => `
      <div class="shelf" style="${at(0, shelfY(k), 18.5, 7)}">
        <span class="sh-l">${s}</span>
        <span class="spines">${Array.from({ length: 12 }, (_, i) => `<i class="sp ${fresh.some(([a, b]) => a === k && b === i) ? 'fr' : ''} ${k === CO.hit[0] && i === CO.hit[1] ? 'hit' : ''}"></i>`).join('')}</span>
      </div>`).join('')}
      <p class="ed-key" style="${at(0, 33.4, 18.5)}"><i class="sp new"></i>${v.newEd}</p>
    </div>
    <i class="sweep" style="${at(CO.cx - 1, 1.8, 2.6, 32.4)}"></i>
    <div class="sheet cop-sh" style="${at(0, 2.6, 24.5, 31.6)}">
      <header class="sheet-hd">${icon('bookOpen')}<div class="sh-t"><b>ECO-EXPERT COPILOT</b><span>${v.copSub}</span></div></header>
      <div class="ask" style="top:${R(5.6)}">${icon('user')}<span>${v.copAsk}</span></div>
      <div class="ans big" style="top:${R(11.4)}">
        <span class="ans-l">${v.answer}</span>
        ${lines(6, 'teal')}
        <span class="src">${icon('scrollText')}<span>${v.lawNo} <i class="redact w4"></i> · ${v.article} <i class="redact w2"></i></span></span>
      </div>
    </div>
    <article class="paper excerpt" style="${at(29.2, 11.2, 15.6, 15.4)}">
      <b class="pd-title">${v.law}</b>
      <span class="pd-id">${v.no} <i class="redact w4"></i> · ${v.article} <i class="redact w2"></i></span>
      ${lines(3, 'ink')}<i class="ph ink mark-l" style="width:94%"></i>${lines(3, 'ink')}
    </article>
    <svg class="ov" viewBox="0 0 460 370" aria-hidden="true">
      <path class="tr cite" d="${bend(278, 197, 237, srcY * 10, 0.55)}"/>
      <g class="cite-ends">${tm(285, 197, 'teal')}${tm(230, srcY * 10, 'teal')}</g>
    </svg>
    ${sample(v.cpSmp, 35.6)}${sample(v.cpSmp2, 35.6, 'later')}
  </div>`, [
    (r, tl) => {
      tl.set(q(r, '.corpus'), { x: R(-13.75) }, 0);
      tl.set(qa(r, '.smp'), { x: R(13.75) }, 0);
      qa(r, '.shelf').forEach((s, k) => {
        pop(tl, q(s, '.sh-l'), k * 0.16);
        tl.fromTo(qa(s, '.sp'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out', stagger: 0.025 }, k * 0.16 + 0.05);
      });
      // Regulations change: a few volumes are replaced by new editions.
      qa(r, '.sp.fr').forEach((sp, i) => {
        const t = 1.2 + i * 0.32;
        tl.to(sp, { y: -14, autoAlpha: 0, duration: 0.25, ease: 'power2.in' }, t);
        tl.call(() => sp.classList.add('new'), null, t + 0.26);
        tl.fromTo(sp, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35, ease: 'power3.out', immediateRender: false }, t + 0.27);
      });
      pop(tl, q(r, '.ed-key'), 1.3);
    },
    (r, tl) => {
      tl.to(q(r, '.corpus'), { x: 0, duration: 1, ease: 'expo.inOut' }, 0);
      tl.to(qa(r, '.smp'), { x: 0, duration: 1, ease: 'expo.inOut' }, 0);
      relabel(r, tl, 0.6);
      tl.fromTo(q(r, '.cop-sh'), { autoAlpha: 0, x: -24 }, { autoAlpha: 1, x: 0, duration: 0.8, ease: 'expo.out' }, 0.3);
      tl.set(qa(r, '.cop-sh .ans'), { autoAlpha: 0 }, 0);
      pop(tl, q(r, '.cop-sh .ask'), 0.5);
      const sw = q(r, '.sweep');
      tl.set(sw, { autoAlpha: 1, x: 0 }, 1.2);
      tl.to(sw, { x: R(17.4), duration: 1.2, ease: 'power1.inOut' }, 1.2);
      tl.to(sw, { autoAlpha: 0, duration: 0.3 }, 2.4);
      tl.call(() => q(r, '.sp.hit').classList.add('on'), null, 2.35);
      tl.to(q(r, '.sp.hit'), { y: -10, duration: 0.4, ease: 'power2.out' }, 2.4);
      tl.fromTo(q(r, '.excerpt'), { autoAlpha: 0, scale: 0.8, y: -40 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.8, ease: 'expo.out', transformOrigin: '70% 0%' }, 2.65);
      tl.fromTo(q(r, '.mark-l'), { backgroundSize: '0% 100%' }, { backgroundSize: '100% 100%', duration: 0.6, ease: 'power2.out' }, 3.2);
      // The library steps back while the found article is read.
      tl.to(qa(r, '.sh-l, .sp:not(.hit), .ed-key'), { opacity: 0.28, duration: 0.6, ease: 'power2.out' }, 2.6);
      popIn(tl, qa(r, '.cite-ends .tm')[0], 3.4);
      draw(tl, q(r, '.cite'), { d: 0.7, at: 3.5 });
      popIn(tl, qa(r, '.cite-ends .tm')[1], 4.1);
      tl.fromTo(q(r, '.cop-sh .ans'), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out' }, 3.8);
    },
  ]);
}

/* ---------- 05 ECO-CONTROL: a run of conclusions, analyzed, reported to management ---------- */
const AU = { x0: 0.5, y0: 3.6, cw: 5.4, ch: 7.8, gx: 6.2, gy: 8.6, rx: 28, ry: 3.6 };
const AU_ST = ['leaf', 'leaf', 'amber', 'leaf', 'leaf', 'leaf', 'leaf', 'coral', 'leaf', 'amber', 'leaf', 'leaf'];
const AU_FIND = [[2, 'deficiency'], [7, 'inconsistency'], [9, 'deficiency']];
const auX = (i) => AU.x0 + AU.gx * (i % 4);
const auY = (i) => AU.y0 + AU.gy * Math.floor(i / 4);
const auT = (i) => [auX(i) + AU.cw - 0.15, auY(i) + AU.ch - 0.15];
const auFindY = (k) => AU.ry + 15.8 + 1.5 + 3 * k;
const no = (i) => String(i + 1).padStart(2, '0');

function audit(host) {
  const v = V();
  // Routes along the gaps between sheets, so no trace crosses a sheet or another trace.
  const [t0, t1, t2] = AU_FIND.map(([i]) => auT(i));
  const fx = (AU.rx + 1) * 10;
  const routes = [
    `M${t0[0] * 10} ${t0[1] * 10} V${(AU.y0 + AU.ch + 0.4) * 10} H269 V${(auFindY(0) - 0.7) * 10} L276 ${auFindY(0) * 10} H${fx}`,
    `M${t1[0] * 10} ${t1[1] * 10} H258 V${(auFindY(1) - 0.7) * 10} L265 ${auFindY(1) * 10} H${fx}`,
    `M${t2[0] * 10} ${t2[1] * 10} V299 H251 V${(auFindY(2) - 0.7) * 10} L258 ${auFindY(2) * 10} H${fx}`,
  ];
  return viz(host, `
  <div class="viz viz-audit" style="width:46rem;height:37rem">
    <div class="grid" style="${at(0, 0, 25, 37)}">
      ${AU_ST.map((st, i) => `<article class="paper mini" style="${at(auX(i), auY(i), AU.cw, AU.ch)}"><span class="pd-id">${v.no} ${mono(no(i))}</span>${lines(5, 'ink')}<span class="term ${st}"><i></i></span></article>`).join('')}
      <i class="lens" style="${at(AU.x0 - 0.3, AU.y0 - 0.3, AU.cw + 0.6, AU.ch + 0.6)}"></i>
    </div>
    <svg class="ov" viewBox="0 0 460 370" aria-hidden="true">
      ${routes.map((d, k) => `<path class="tr ${AU_ST[AU_FIND[k][0]]} rt" d="${d}"/>`).join('')}
    </svg>
    <div class="sheet rep" style="${at(AU.rx, AU.ry, 18)}">
      <header class="sheet-hd">${icon('clipboardList')}<div class="sh-t"><b>${v.report}</b><span>${v.forMgmt}</span></div></header>
      <dl class="rep-kv">
        <div><dt>${v.analyzed}</dt><dd class="mono">12</dd></div>
        <div><dt>${v.withDef}</dt><dd class="mono">2</dd></div>
        <div><dt>${v.withInc}</dt><dd class="mono">1</dd></div>
      </dl>
      <b class="rep-sec">${v.findings}</b>
      <ol class="rep-find">
        ${AU_FIND.map(([i, t]) => `<li><span class="term ${AU_ST[i]}"><i></i></span><span>${v.no} ${mono(no(i))} · ${v[t]}</span></li>`).join('')}
      </ol>
    </div>
    ${sample(v.auSmp, 30.9)}
  </div>`, [
    (r, tl) => {
      tl.set(qa(r, '.grid, .smp'), { x: R(10.2) }, 0);
      tl.fromTo(qa(r, '.mini'), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out', stagger: { each: 0.06, from: 'random' } }, 0);
    },
    (r, tl) => {
      const lens = q(r, '.lens');
      const marks = qa(r, '.mini .term');
      tl.set(lens, { autoAlpha: 1, x: 0, y: 0 }, 0.2);
      AU_ST.forEach((_, i) => {
        const t = 0.25 + i * 0.22;
        tl.to(lens, { x: R(auX(i) - AU.x0), y: R(auY(i) - AU.y0), duration: 0.16, ease: 'power2.inOut' }, t);
        popIn(tl, marks[i], t + 0.14);
      });
      tl.to(lens, { autoAlpha: 0, duration: 0.3 }, 0.25 + AU_ST.length * 0.22);
    },
    (r, tl) => {
      tl.to(qa(r, '.grid, .smp'), { x: 0, duration: 1, ease: 'expo.inOut' }, 0);
      tl.fromTo(q(r, '.rep'), { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: 0.9, ease: 'expo.out' }, 0.5);
      pop(tl, qa(r, '.rep-kv > div'), 0.8, { stagger: 0.12 });
      qa(r, '.rt').forEach((p, k) => draw(tl, p, { d: 0.9, at: 1.2 + k * 0.2 }));
      pop(tl, q(r, '.rep-sec'), 1.2);
      pop(tl, qa(r, '.rep-find li'), 1.9, { stagger: 0.2 });
    },
  ]);
}

/* ---------- On-premise: everything runs inside the Center's own servers ---------- */
function premise(host) {
  const AGENTS = agents();
  const Y = 15.5;
  const root = (i) => 6.6 + 6.3 * i;
  const tx = (i) => root(i) + 3;
  const ty = (i) => (i % 2 ? Y + 3 : Y - 3);
  const veinD = `M40 ${Y * 10} H420`;
  return viz(host, `
  <div class="viz viz-premise" style="width:46rem;height:34rem">
    <div class="perim" style="${at(1, 4.5, 44, 22)}">
      <span class="perim-l">${icon('server')}${V().servers}</span>
      <span class="perim-lock">${icon('lock')}</span>
    </div>
    <svg class="ov" viewBox="0 0 460 340" aria-hidden="true">
      <path class="tr pv" d="${veinD}"/>
      ${AGENTS.map((_, i) => `<path class="tr pb" d="M${root(i) * 10} ${Y * 10} L${tx(i) * 10} ${ty(i) * 10}"/>`).join('')}
      <g class="pts">${AGENTS.map((_, i) => tm(tx(i) * 10, ty(i) * 10, 'teal', 8)).join('')}</g>
      <g class="pk">
        ${[0, -2, -4].map((b) => `<circle r="3.2"><animateMotion dur="6s" begin="${b}s" repeatCount="indefinite" path="${veinD}"/></circle>`).join('')}
        ${AGENTS.map((_, i) => `<circle r="2.6"><animateMotion dur="2.4s" begin="${-i * 0.37}s" repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;0.5;1" calcMode="linear" path="M${root(i) * 10} ${Y * 10} L${tx(i) * 10} ${ty(i) * 10}"/></circle>`).join('')}
      </g>
    </svg>
    ${AGENTS.map((a, i) => `<span class="pl ${i % 2 ? 'dn' : 'up'}" style="left:${R(tx(i))};top:${R(i % 2 ? ty(i) + 1.4 : ty(i) - 1.4)}"><span class="pl-in"><span class="mono">${a.n}</span>${a.name}</span></span>`).join('')}
  </div>`, [
    (r, tl) => {
      tl.fromTo(q(r, '.perim'), { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: 0.9, ease: 'expo.out' }, 0);
      draw(tl, q(r, '.pv'), { d: 1.2, at: 0.3 });
      qa(r, '.pb').forEach((p, i) => draw(tl, p, { d: 0.3, at: 0.45 + i * 0.16 }));
      popIn(tl, qa(r, '.pts .tm'), 0.7, 0.12);
      pop(tl, qa(r, '.pl-in'), 0.8, { stagger: 0.08 });
      tl.fromTo(q(r, '.pk'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 1.4);
      popIn(tl, q(r, '.perim-lock'), 1.2);
    },
  ]);
}

/* ---------- Legal basis: the two documents the platform rests on ---------- */
function laws(host) {
  const v = V();
  return viz(host, `
  <div class="viz viz-laws" style="width:46rem;height:34rem">
    <article class="paper lawdoc" style="${at(4, 2, 17, 24)}">
      <header class="pd-hd"><b class="pd-title">${v.law}</b><span class="pd-id">${v.lawOf}</span><span class="pd-no">${v.lawNum}</span></header>
      ${lines(9, 'ink')}
    </article>
    <article class="paper lawdoc" style="${at(25, 2, 17, 24)}">
      <header class="pd-hd"><b class="pd-title">${v.resolution}</b><span class="pd-id">${v.resOf}</span><span class="pd-no">${v.resNum}</span></header>
      ${lines(9, 'ink')}
    </article>
    <p class="regs" style="${at(4, 28.4, 38)}">${icon('library')}${v.andOther}</p>
  </div>`, [
    (r, tl) => {
      tl.fromTo(qa(r, '.lawdoc'), { autoAlpha: 0, y: 34 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.18 }, 0);
      pop(tl, q(r, '.regs'), 0.7);
    },
  ]);
}

export const VISUALS = { vein, intake, consult, compare, copilot, audit, premise, laws };
