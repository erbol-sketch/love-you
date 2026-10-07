/* Частицы: пыль, звёзды, искры, сердечки + салют */
export function initFx(cv) {
  const ctx = cv.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W, H, P = [], T = 0, mode = 0, raf = 0;
  const small = window.innerWidth < 700;
  const GOLD = '230,194,124', ROSE = '243,201,208';

  /* ---- салют ---- */
  const COLORS = ['230,194,124', '243,201,208', '255,243,220', '255,120,150', '255,170,90'];
  let R = [], S = [], fw = false;
  const timers = [];

  function launch() {
    R.push({
      x: W * (0.12 + Math.random() * 0.76),
      y: H + 10,
      ty: H * (0.12 + Math.random() * 0.38),
      vy: -(H / 110 + Math.random() * 2),
      c: COLORS[(Math.random() * COLORS.length) | 0],
    });
  }
  function explode(x, y, c) {
    const heartShape = Math.random() < 0.25;
    const n = small ? 55 : 90;
    const sp = 2 + Math.random() * 2.5;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      let vx, vy, col = Math.random() < 0.7 ? c : COLORS[(Math.random() * COLORS.length) | 0];
      if (heartShape) {
        const k = sp / 14;
        vx = 16 * Math.pow(Math.sin(a), 3) * k;
        vy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * k;
        col = ROSE;
      } else {
        const s = sp * (0.6 + Math.random() * 0.6);
        vx = Math.cos(a + Math.random() * 0.1) * s;
        vy = Math.sin(a + Math.random() * 0.1) * s;
      }
      S.push({ x, y, vx, vy, life: 1, d: 0.008 + Math.random() * 0.01, c: col, r: 1.2 + Math.random() });
    }
  }
  function fwStep() {
    if (fw && Math.random() < (small ? 0.025 : 0.04)) launch();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = R.length - 1; i >= 0; i--) {
      const r = R[i];
      r.y += r.vy;
      ctx.fillStyle = `rgba(${r.c},.9)`;
      ctx.shadowBlur = 12; ctx.shadowColor = `rgb(${r.c})`;
      ctx.beginPath(); ctx.arc(r.x, r.y, 2, 0, 6.3); ctx.fill();
      ctx.shadowBlur = 0;
      if (r.y <= r.ty) { explode(r.x, r.y, r.c); R.splice(i, 1); }
    }
    for (let i = S.length - 1; i >= 0; i--) {
      const s = S[i];
      s.x += s.vx; s.y += s.vy;
      s.vx *= 0.985; s.vy = s.vy * 0.985 + 0.04;
      s.life -= s.d;
      if (s.life <= 0) { S.splice(i, 1); continue; }
      ctx.fillStyle = `rgba(${s.c},${s.life})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.3); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ---- остальное ---- */
  function rs() {
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function mk(t, init) {
    const p = { t, x: Math.random() * W, y: init ? Math.random() * H : H + 20, ph: Math.random() * 6.28, c: Math.random() < .7 ? GOLD : ROSE, vx: 0, vy: 0, r: 1 };
    if (t == 0) { p.r = Math.random() * 1.6 + .4; p.vy = -(Math.random() * .18 + .04); p.vx = (Math.random() - .5) * .1; }
    if (t == 1) { p.r = Math.random() * 1.1 + .3; p.y = Math.random() * H; }
    if (t == 2) { p.r = Math.random() * 1.8 + .6; p.vy = -(Math.random() * 1.3 + .5); p.vx = (Math.random() - .5) * .7; }
    if (t == 3) { p.r = Math.random() * 5 + 4; p.vy = -(Math.random() * .6 + .3); p.vx = (Math.random() - .5) * .3; p.c = ROSE; }
    return p;
  }
  function heart(x, y, s) {
    ctx.beginPath(); ctx.moveTo(x, y + s * .35);
    ctx.bezierCurveTo(x - s, y - s * .3, x - s * .5, y - s, x, y - s * .45);
    ctx.bezierCurveTo(x + s * .5, y - s, x + s, y - s * .3, x, y + s * .35);
    ctx.fill();
  }
  function burst(k = 140) {
    for (let i = 0; i < k; i++) {
      const p = mk(i % 6 == 0 ? 3 : 2);
      p.y = H * (.6 + Math.random() * .5); p.vy *= 1.6; P.push(p);
    }
  }
  function init() {
    rs(); P = [];
    for (let i = 0; i < (small ? 35 : 70); i++) P.push(mk(0, 1));
    for (let i = 0; i < (small ? 35 : 70); i++) P.push(mk(1, 1));
  }
  function loop() {
    T += .016; ctx.clearRect(0, 0, W, H);
    if (mode && Math.random() < .5) P.push(mk(2));
    if (mode && Math.random() < .05) P.push(mk(3));
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; p.x += p.vx; p.y += p.vy;
      let a;
      if (p.t == 0) a = .25 + .3 * Math.sin(T + p.ph);
      else if (p.t == 1) a = .15 + .5 * Math.abs(Math.sin(T * .7 + p.ph));
      else a = Math.max(0, Math.min(1, p.y / H * 1.5)) * .85;
      if (p.y < -20 || a <= 0 && p.t > 1) {
        if (p.t < 2) { p.y = H + 20; p.x = Math.random() * W; } else P.splice(i, 1);
        continue;
      }
      ctx.fillStyle = `rgba(${p.c},${Math.max(0, a)})`;
      if (p.t == 3) heart(p.x, p.y, p.r);
      else {
        ctx.shadowBlur = p.t == 2 ? 10 : 0; ctx.shadowColor = `rgb(${GOLD})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.3); ctx.fill(); ctx.shadowBlur = 0;
      }
    }
    fwStep();
    raf = requestAnimationFrame(loop);
  }

  window.addEventListener('resize', rs);
  init(); loop();

  return {
    burst,
    setMode: (m) => { mode = m; },
    fireworks: (on) => { fw = on; },
    volley: (k = 5) => { for (let i = 0; i < k; i++) timers.push(setTimeout(launch, i * 250)); },
    destroy: () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', rs);
    },
  };
}