// 捲葉風旋 / Leaf-Swept Vortex — pixel version of 00GameDevs "wind-vortex" (MIT)
PXFX.define({
  id: 'wind-vortex',
  loop: 5,
  beats: [{ t: .35, kind: 'cast', power: .8 }, { t: 1.5, kind: 'pulse', power: .45 }, { t: 2.3, kind: 'pulse', power: .6 }, { t: 3.05, kind: 'pulse', power: .4 }],
  view: { r: 2.2, h: 3.1 },
  stage: { ground: 'grass' },
  palette: {
    wind: ['#4a8691', '#68aaab', '#a4dfd1', '#c6efdf', '#ebfbf1', '#ffffff'],
    mist: ['#5d8191', '#74a2a6', '#8fc0b8', '#ade0d1', '#cdf0e3', '#effbf5'],
    leaf: ['#2d573b', '#467a3d', '#77a542', '#b2cd52', '#e2e388'],
  },
  timeline: [
    { t: [0, .35], zh: '蓄勢：地面捲起淡青霧，矮寬的碗形風帶慢慢轉動並略為收緊（約 15%），轉速由 0.15 倍加速到 0.5 倍', en: 'wind-up: teal mist lifts; a squat bowl of wind bands turns slowly and tightens ~15%, spin accelerating from 0.15x to 0.5x' },
    { t: [.35, 1], zh: '成形（cast）：漏斗在 0.6 秒內急速拉高（ease-out-back，高度先衝過頭約 8% 再回落），轉速在 0.06 秒內衝到 1.7 倍再於 1.1 秒內回落到 1 倍；地面一圈氣壓環以 ease-out-expo 急衝後減速，霧團先被吹開再被吸回', en: 'cast: the funnel whips up within 0.6 s (ease-out-back, ~8% height overshoot), spin jumps to 1.7x within 0.06 s and settles to 1x over 1.1 s; a pressure ring shoots across the ground (ease-out-expo), mist is blown out then sucked back' },
    { t: [1, 3.6], zh: '持續：風帶繞軸逆時針急轉並沿漏斗往上爬；1.5、2.3、3.05 秒各一陣強風：轉速瞬間加 80%（0.04 秒起，0.9 秒三次方衰減）、漏斗鼓脹 14%、頂部擺幅加大、地面再彈出一圈較小的氣壓環、葉片被甩向外側', en: 'sustain: bands spin counter-clockwise and climb; gusts at 1.5, 2.3 and 3.05 s: spin +80% (0.04 s attack, cubic decay over 0.9 s), the funnel bulges 14%, the top sways wider, a smaller ground ring pops out, leaves are thrown outward' },
    { t: [3.6, 4.8], zh: '收尾：轉速按指數衰減；漏斗底部加速離地，上半部先快後慢地攤平成一圈橫向風帶後迅速消失；葉片帶阻力甩出並下墜', en: 'end: spin decays exponentially; the base lifts off with acceleration, the top flattens fast then slower (ease-out) into one wide swirl and drops out quickly; leaves fly out with drag and fall' },
  ],
  layers: [
    { zh: '漏斗：半徑由底部 0.14 漸寬到頂部 1.15、高 2.75（可調高度、寬度）；軸線上半段畫圓搖擺 0.22', en: 'funnel: radius 0.14 at the base to 1.15 at the top, 2.75 tall (height and width are knobs); upper axis sways in a 0.22 circle' },
    { zh: '轉動：所有旋轉與上爬共用一條「轉速曲線」積分出的相位，不是固定角速度', en: 'motion: every spin and climb reads one phase integrated from the speed curve, never a fixed angular speed' },
    { zh: '風帶：13 條兩端尖的月牙形帶子（寬 0.2–0.4）貼著漏斗面，每條繞約 260 度、上升 0.45，互相重疊成實心漏斗；上緣亮白、下緣深青，背面一半亮度降到約 55%', en: 'bands: 13 crescent strips (0.2–0.4 wide) on the funnel surface, each wraps ~260° and rises 0.45, overlapping into a solid cone; bright top edge, dark teal lower lip, back half at ~55% brightness' },
    { zh: '風絲：5 條 1 像素細螺旋線在漏斗外側繞圈，前亮後暗', en: 'threads: 5 one-pixel spiral lines just outside the funnel, bright in front, dim behind' },
    { zh: '葉片：14 片小四邊形葉子（綠到黃 5 階）翻滾上升，明暗隨朝向閃動', en: 'leaves: 14 small quad leaves (green to yellow, 5 steps) tumble upward, shading flips as they turn' },
    { zh: '地面：16 團半埋地面的淡青霧球（以光照明暗＋Bayer 抖色透明畫出）繞底部旋轉，地上 3 圈斷續弧線轉動，氣壓環每次越擴越細，底部淡青地面光', en: 'ground: 16 teal mist balls (lit, Bayer-dithered see-through spheres) half sunk around the base, 3 broken arc rings turn, pressure rings thin as they grow, teal light pool under the base' },
  ],
  params: {
    funnelHeight: { zh: '漏斗高度', en: 'funnel height', min: .6, max: 1.15, step: .05, value: 1 },
    funnelWidth: { zh: '漏斗寬度', en: 'funnel width', min: .7, max: 1.3, step: .05, value: 1 },
    spin: { zh: '旋轉速度', en: 'spin speed', min: .3, max: 2, step: .1, value: 1 },
    leaves: { zh: '葉片數量', en: 'leaf count', min: 0, max: 40, step: 1, value: 14 },
  },
  CAST: .35, END: 3.6,
  GUSTS: [[1.5, .8], [2.3, 1], [3.05, .7]],
  // gust strength: sharp attack (0.04 s), slow cubic decay (0.9 s)
  gust(t) {
    let g = 0;
    for (const [tg, a] of this.GUSTS) {
      const d = t - tg;
      if (d >= 0 && d < .94) g = Math.max(g, a * Math.min(1, d / .04) * Math.pow(1 - Math.max(0, d - .04) / .9, 3));
    }
    return g;
  },
  // spin speed (x base): slow wind-up, whip at the cast with overshoot, gust kicks, exponential spin-down
  speed(t) {
    const C = this.CAST;
    let s;
    if (t < C) { const u = t / C; s = .15 + .35 * u * u; }
    else {
      const d = t - C, up = 1 - Math.pow(1 - Math.min(1, d / .3), 3);
      s = .5 + .5 * up + .7 * Math.min(1, d / .06) * Math.pow(1 - Math.min(1, Math.max(0, d - .06) / 1.1), 3);
    }
    s += .8 * this.gust(t);
    if (t > this.END) s *= .12 + .88 * Math.exp(-2.4 * (t - this.END));
    return s;
  },
  // spin phase = integral of the speed curve (numeric, so draw stays a pure function of t)
  phase(t) {
    const h = 1 / 120;
    let a = 0, x = 0;
    for (; x + h <= t; x += h) a += this.speed(x + h * .5) * h;
    return a + this.speed((x + t) * .5) * (t - x);
  },
  geo(p, t) {
    const C = this.CAST, hs = p.param('funnelHeight'), ws = p.param('funnelWidth');
    const g = t < C ? p.easeInCubic(t / C) : 0;                              // the bowl tightens before the whip
    const m = Math.max(0, p.easeOutBack(p.ph(t, C, C + .6), 1.6)), mc = Math.min(1, m);
    const e = p.ph(t, this.END, 4.7), eo = p.easeOutCubic(e), gu = this.gust(t);
    const H = p.lerp(1.25, 2.75, m) * hs;
    const rb = (p.lerp(1.0, .14, mc) * (1 - .15 * g) + eo * .55) * ws, rt = p.lerp(1.7, 1.15, m) * (1 - .12 * g) * (1 + eo * .7) * ws;
    const zmin = e * e * H * .78, lean = (.1 + .12 * mc + .14 * gu) * hs;
    const ax = z => {
      const k = Math.pow(Math.max(0, z) / H, 1.6);
      return [Math.cos(t * 1.25) * lean * k + Math.sin(t * .8) * .06 * mc, Math.sin(t * 1.25) * lean * k * .7];
    };
    const bulge = 1 + .14 * gu;
    const rad = z => (rb + (rt - rb) * Math.pow(p.clamp(z / H, 0, 1.2), 1.25)) * bulge;
    const on = p.ease(p.ph(t, 0, .3)) * (1 - p.easeInCubic(e));
    return { m: mc, e, eo, H, rb, rt, zmin, ax, rad, on, gu, ws, ph: this.phase(t), spin: p.param('spin') };
  },
  // crescent wind bands wrapped on the funnel surface
  bands(p, t, G, n, ramp, o) {
    const S = 18, climb = G.ph * o.climb * (.5 + .5 * G.spin), turn = G.ph * o.spin * G.spin;
    for (let k = 0; k < n; k++) {
      const f = ((k / n + climb + p.r(k, 7) * .05) % 1 + 1) % 1;
      const z0 = G.zmin + (f * 1.12 - .2) * (G.H - G.zmin);
      const span = o.span * (.8 + p.r(k, 1) * .4), rise = o.rise * G.H, a0 = p.r(k, 2) * p.TAU + turn;
      const L = [], R = [], I = [];
      const fade = p.env(f, 0, .12, .78, 1) * G.on;
      for (let s = 0; s <= S; s++) {
        const u = s / S, a = a0 + u * span, z = z0 + u * rise, zc = Math.max(0, z);
        const w = o.w * (.6 + .7 * zc / G.H), r0 = G.rad(zc), r1 = G.rad(zc + w);
        const c0 = G.ax(zc), c1 = G.ax(zc + w), ca = Math.cos(a), sa = Math.sin(a);
        L.push([c0[0] + ca * r0, c0[1] + sa * r0, zc]);
        R.push([c1[0] + ca * r1, c1[1] + sa * r1, zc + w]);
        const pp = p.project(c0[0] + ca * r0, c0[1] + sa * r0, zc), pc = p.project(c0[0], c0[1], zc);
        const front = pp && pc ? p.clamp(.5 + (pp[2] - pc[2]) / (r0 + .05) * .5, 0, 1) : .5;
        const inside = z < G.zmin || z > G.H + .05 ? 0 : 1;
        I.push(inside * fade * p.lerp(o.back, 1, front));
      }
      const gap = o.gap ? o.gap(k) : null, cut = p.mode === '2d' ? .1 : .03;   // the lowest ramp level never dithers below ~50 %, so drop faint values instead of drawing them
      p.ribbon(L, R, (u, v) => {
        const x = u * S, i0 = Math.min(S - 1, x | 0), ii = I[i0] + (I[i0 + 1] - I[i0]) * (x - i0);
        if (ii <= .01) return 0;
        const tp = Math.pow(Math.sin(Math.PI * u), .55), dv = (v - .5) * 2;
        if (Math.abs(dv) > tp) return 0;
        if (gap && gap(u, v) <= 0) return 0;
        const val = ii * (dv > tp * .45 ? o.hi : dv < -tp * .5 ? o.lo : o.mid);
        return val < cut ? 0 : val;
      }, ramp, 1);
    }
  },
  // see-through puff drawn as light: a lit sphere surface whose pixels survive where the Bayer threshold is below
  // alpha. (Solid balls with dithered alpha get a darkened rim around every hole, which turns pale fog grey.)
  // 2D has no dither, so there the puff is opaque and shrinks with alpha instead.
  mist(p, x, y, z, r, ramp, alpha, seed, lift = 0) {
    if (alpha <= .02) return;
    const flat = p.mode === '2d', bay = PXFX.bayerAt, off = (seed * 7) & 3;
    if (flat) { if (alpha < .25) return; r *= .45 + .55 * Math.min(1, alpha * 1.3); }
    p.shell(x, y, z, r, (nx, ny, nz) => {
      let l = (-.79 * nx + .07 * ny + .61 * nz) * .5 + .5 + lift;
      if (!flat) {
        const q = p.project(x + nx * r, y + ny * r, z + nz * r);
        if (!q) return 0;
        const ix = Math.floor(q[0]), iy = Math.floor(q[1]);
        if (bay(ix + off, iy + off) >= alpha) return 0;
        l += (p.r(ix * 13 + iy * 7, seed) - .5) * .22;
      }
      return .1 + .82 * p.clamp(l, 0, 1);
    }, ramp, 1, { back: 0 });
  },
  draw(p, t) {
    const WD = this.palette.wind, M = this.palette.mist, LF = this.palette.leaf;
    const G = this.geo(p, t), C = this.CAST, END = this.END, sp = .5 + .5 * G.spin;
    const mistOn = p.ease(p.ph(t, .05, .5)) * (1 - p.easeInCubic(p.ph(t, 3.8, 4.85)));
    // the cast blows the mist out (fast), then the funnel sucks it back
    const dc = t - C, blast = dc > 0 ? p.easeOutExpo(dc / .12) * Math.pow(Math.max(0, 1 - dc / 1), 2) : 0;
    // mist ring circling the base (see-through, dithered)
    const nM = Math.round(16 * p.density);
    if (mistOn > 0) for (let k = 0; k < nM; k++) {
      const ang = k * 2.39996 + G.ph * 1.1 * sp + p.r(k, 1) * .5;
      const r = (.26 + p.r(k, 3) * .2) * (.6 + .4 * mistOn);
      const rr = Math.min(1.85 - r * .6, ((.4 + p.r(k, 2) * .95) * (1 + (1 - G.m) * .3) * (1 + .45 * blast + .15 * G.gu) + G.eo * .7) * G.ws);   // stay on the island
      this.mist(p, Math.cos(ang) * rr, Math.sin(ang) * rr, -r * .25 + Math.sin(t * 3 + k) * .03, r, M,
        (.5 + .3 * p.r(k, 4)) * mistOn, k);
    }
    // leaves: tumbling quads riding the spiral; thrown outward by gusts, flung with drag at the end
    const nL = Math.round(p.param('leaves') * p.density), fling = t > END ? t - END : 0;
    for (let k = 0; k < nL; k++) {
      const u = ((G.ph * (.26 + p.r(k, 1) * .16) * sp + p.r(k, 2)) % 1 + 1) % 1;
      const vis = p.env(u, 0, .06, .88, 1) * (1 - G.e) * p.ph(t, C, C + .3);
      if (vis < .3) continue;
      const z = .1 + u * G.H * 1.02, thru = k % 4 === 0;
      const ang = p.r(k, 3) * p.TAU + G.ph * (3 + p.r(k, 4)) * G.spin + u * 5;
      const rr = G.rad(z) * (thru ? .2 + Math.abs(Math.sin(u * Math.PI * 2)) * .9 : 1.08 + p.r(k, 5) * .4)
        + .45 * G.gu * p.r(k, 5) + p.drag(2.4 * (.4 + p.r(k, 6)), 2.2, fling);
      const c = G.ax(z), x = c[0] + Math.cos(ang) * rr, y = c[1] + Math.sin(ang) * rr, zz = Math.max(.05, z - fling * fling * .9);
      const s = .1 + p.r(k, 7) * .05, ph = t * (5 + p.r(k, 8) * 4) * (1 + G.gu) + k;
      const d = [Math.cos(ph) * s, Math.sin(ph) * s, Math.sin(ph * .7) * s * .7];
      const q = [-Math.sin(ph) * s * .45, Math.cos(ph) * s * .45, Math.cos(ph * 1.3) * s * .3];
      p.quad([x + d[0], y + d[1], zz + d[2]], [x + q[0], y + q[1], zz + q[2]], [x - d[0], y - d[1], zz - d[2]], [x - q[0], y - q[1], zz - q[2]], LF);
    }
    // ground: light pool, turning broken arcs, pressure rings (cast + each gust): shoot out, then slow and thin
    p.light(0, 0, .1, 1.9 * G.ws, M, (.6 + .3 * G.gu) * mistOn);
    for (let i = 0; i < 3; i++) {
      const rr = Math.min(1.85, (.65 + i * .42 + G.eo * .4) * G.ws), a0 = G.ph * (2.6 - i * .5) * sp + i * 2;
      if (mistOn > .12) p.ring(0, 0, .02, rr, .035, WD, .42 * mistOn, { fn: a => (Math.sin(a * 2 + a0) > .35 ? 1 : 0) });
    }
    const rings = [[C, 1.55, .8, .9]].concat(this.GUSTS.map(([tg, a]) => [tg, 1.1 * a, .6, .6 * a]));
    for (const [tr, reach, dur, I] of rings) {
      const u = (t - tr) / dur;
      if (u <= 0 || u >= 1) continue;
      p.ring(0, 0, .03, Math.min(1.9, (.3 + p.easeOutExpo(u) * reach) * G.ws), .1 * Math.pow(1 - u, 1.5) + .02, WD, I * Math.pow(1 - u, 1.5), { fn: a => .6 + .4 * Math.sin(a * 5 + tr * 7) });
    }
    // funnel bands
    this.bands(p, t, G, 13, WD, { climb: .36, spin: 4.2, span: 4.6, rise: .16, w: .3, back: .45, hi: .74, mid: .52, lo: .3 });
    // wind threads: thin spirals just outside the funnel
    for (let k = 0; k < 5; k++) {
      const f = ((k / 5 + G.ph * .3 * sp) % 1 + 1) % 1, z0 = G.zmin + (f * 1.1 - .15) * (G.H - G.zmin);
      const a0 = p.r(k, 11) * p.TAU + G.ph * 5 * G.spin, fade = p.env(f, 0, .15, .75, 1) * G.on;
      if (fade <= 0) continue;
      let prev = null, prevI = 0;
      for (let s = 0; s <= 16; s++) {
        const u = s / 16, z = z0 + u * .55, a = a0 + u * 4.2;
        if (z < G.zmin || z > G.H) { prev = null; continue; }
        const c = G.ax(z), r = G.rad(z) * 1.14 + .04, pt = [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, z];
        const pp = p.project(pt[0], pt[1], pt[2]), pc = p.project(c[0], c[1], z);
        const front = pp && pc ? p.clamp(.5 + (pp[2] - pc[2]) / r * .5, 0, 1) : .5;
        const ii = fade * Math.sin(Math.PI * u) * p.lerp(.25, .85, front) * (1 + .4 * G.gu);
        if (prev && (p.mode !== '2d' || ii > .12)) p.line(prev, pt, .03, WD, prevI, { i1: ii });
        prev = pt; prevI = ii;
      }
    }
  },
});
