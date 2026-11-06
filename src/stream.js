// The opening stream: every conclusion point flies out from behind the card and lands on its
// place on the map. Drawn on a 2D canvas over the map while the camera holds still, then
// handed to the map's own circle layer so later camera moves keep every point registered.
export function createStream(canvas) {
  const ctx = canvas.getContext('2d');
  let raf = 0;
  let fadeT = 0;
  let W = 0;
  let H = 0;

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function clear() {
    ctx.clearRect(0, 0, W, H);
  }

  function stop() {
    cancelAnimationFrame(raf);
    clearTimeout(fadeT);
    raf = 0;
    canvas.style.transition = 'none';
    canvas.style.opacity = '0';
    canvas.style.zIndex = '';
    clear();
  }

  // targets: screen points [x, y]; emitter: { x0, x1, y0, y1 } screen box the points leave from.
  function play(targets, emitter, { onLand } = {}) {
    stop();
    const n = targets.length;
    const sx = new Float32Array(n);
    const sy = new Float32Array(n);
    const cx = new Float32Array(n);
    const cy = new Float32Array(n);
    const tx = new Float32Array(n);
    const ty = new Float32Array(n);
    const t0 = new Float32Array(n);
    const du = new Float32Array(n);
    // Seeded, so the stream looks the same at every rehearsal.
    let seed = 1036;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    let maxD = 1;
    const dist = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      sx[i] = emitter.x0 + rnd() * (emitter.x1 - emitter.x0);
      sy[i] = emitter.y0 + rnd() * (emitter.y1 - emitter.y0);
      [tx[i], ty[i]] = targets[i];
      dist[i] = Math.hypot(tx[i] - sx[i], ty[i] - sy[i]);
      if (dist[i] > maxD) maxD = dist[i];
    }
    let end = 0;
    for (let i = 0; i < n; i++) {
      const f = dist[i] / maxD;
      // Arc upward, then settle: the control point rides above the straight line.
      cx[i] = sx[i] + (tx[i] - sx[i]) * (0.35 + rnd() * 0.3);
      cy[i] = Math.min(sy[i], ty[i]) - H * (0.06 + rnd() * 0.16);
      t0[i] = f * 1.5 + rnd() * 0.55;
      du[i] = 0.95 + f * 0.75 + rnd() * 0.3;
      end = Math.max(end, t0[i] + du[i]);
    }
    canvas.style.transition = 'none';
    canvas.style.opacity = '1';
    canvas.style.zIndex = '11'; // over the card: the points leave the figure itself
    const start = performance.now();
    const frame = (now) => {
      const t = (now - start) / 1000;
      clear();
      ctx.globalCompositeOperation = 'lighter';
      // Landed points settle to the map layer's brightness; points in flight burn brighter.
      ctx.fillStyle = 'rgba(111, 217, 188, 0.5)';
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        if (t >= t0[i] + du[i]) ctx.rect(tx[i] - 0.85, ty[i] - 0.85, 1.7, 1.7);
      }
      ctx.fill();
      ctx.fillStyle = 'rgba(111, 217, 188, 0.9)';
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        if (t < t0[i] || t >= t0[i] + du[i]) continue;
        let u = (t - t0[i]) / du[i];
        if (u > 1) u = 1;
        const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
        const a = 1 - e;
        const x = a * a * sx[i] + 2 * a * e * cx[i] + e * e * tx[i];
        const y = a * a * sy[i] + 2 * a * e * cy[i] + e * e * ty[i];
        const s = 2.2;
        ctx.rect(x - s / 2, y - s / 2, s, s);
      }
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      if (t < end) {
        raf = requestAnimationFrame(frame);
        return;
      }
      raf = 0;
      onLand?.();
      canvas.style.transition = 'opacity 0.9s ease';
      canvas.style.opacity = '0';
      fadeT = setTimeout(() => {
        clear();
        canvas.style.zIndex = '';
      }, 950);
    };
    raf = requestAnimationFrame(frame);
  }

  return { play, stop, get running() { return raf !== 0; } };
}
