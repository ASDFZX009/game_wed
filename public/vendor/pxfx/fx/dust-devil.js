// 飛砂風旋 / Sand-Swept Vortex — pixel version of 00GameDevs "dust-devil" (MIT)
PXFX.define({
  id: 'dust-devil',
  loop: 5,
  beats: [{ t: .35, kind: 'cast', power: .85 }, { t: 1.45, kind: 'pulse', power: .45 }, { t: 2.25, kind: 'pulse', power: .6 }, { t: 3, kind: 'pulse', power: .45 }],
  view: { r: 2.2, h: 3.1 },
  stage: { ground: 'dirt' },
  palette: {
    sand: ['#8c6b52', '#b08b62', '#dcbb87', '#ebd2a2', '#f7e8c8', '#fffaee'],
    dust: ['#6b5560', '#8c7268', '#b0946f', '#d2b585', '#ead3a6'],
    haze: ['#a08672', '#c2a67e', '#dcc398', '#efdcb7'],
    grit: ['#4e3f45', '#6e5a52', '#93795f', '#b89c78', '#d9c3a0'],
  },
  timeline: [
    { t: [0, .35], zh: '蓄勢：地面揚起沙塵，矮寬的碗形沙帶慢慢轉動並略為收緊（約 15%），轉速由 0.15 倍加速到 0.5 倍', en: 'wind-up: dust lifts off the ground; a squat bowl of sand bands turns slowly and tightens ~15%, spin accelerating from 0.15x to 0.5x' },
    { t: [.35, 1], zh: '成形（cast）：漏斗在 0.6 秒內急速拉高（ease-out-back，高度先衝過頭約 8% 再回落），轉速在 0.06 秒內衝到 1.7 倍再回落；底部沙雲被吹開再吸回，一圈碎石帶阻力向外飛出、受重力落地；地面彈出一圈氣壓環（ease-out-expo，越擴越細）', en: 'cast: the funnel whips up within 0.6 s (ease-out-back, ~8% overshoot), spin jumps to 1.7x within 0.06 s then settles; the base cloud is blown out and sucked back, a ring of pebbles flies out with drag and drops under gravity; a pressure ring shoots across the ground (ease-out-expo, thinning)' },
    { t: [1, 3.6], zh: '持續：帶缺口的沙帶交錯急轉往上爬，透過缺口看得見中空的內壁；1.45、2.25、3 秒各一陣強風：轉速瞬間加 80%（0.04 秒起，0.9 秒三次方衰減）、漏斗鼓脹 14%、頂部沙雲被推開、地面再彈出一圈較小的氣壓環', en: 'sustain: broken sand bands spin and climb, the hollow inside shows through the gaps; gusts at 1.45, 2.25 and 3 s: spin +80% (0.04 s attack, cubic decay over 0.9 s), the funnel bulges 14%, the crown clouds are pushed out, a smaller ground ring pops out' },
    { t: [3.6, 4.8], zh: '收尾：轉速按指數衰減；漏斗由下往上加速鬆開，頂部先快後慢地攤開並迅速消失；地面沙塵向外攤開再以抖色消失，砂石帶阻力甩出、受重力落地', en: 'end: spin decays exponentially; the funnel loosens bottom-up with acceleration, the top spreads fast then slower and drops out; the ground cloud spreads and dithers away, grit flies out with drag and falls' },
  ],
  layers: [
    { zh: '漏斗：半徑由底部 0.18 漸寬到頂部 1.0、高 2.7（可調高度、寬度），軸線上半段畫圓搖擺 0.2', en: 'funnel: radius 0.18 at the base to 1.0 at the top, 2.7 tall (height and width are knobs), upper axis sways in a 0.2 circle' },
    { zh: '轉動：所有旋轉與上爬共用一條「轉速曲線」積分出的相位，不是固定角速度', en: 'motion: every spin and climb reads one phase integrated from the speed curve, never a fixed angular speed' },
    { zh: '沙帶：11 條兩端尖的寬帶（0.25–0.45）貼著漏斗面，每條繞約 250 度；用雜訊挖出 2–3 個缺口；上緣淺米色、下緣深褐，背面 50% 亮度', en: 'bands: 11 wide crescent strips (0.25–0.45) on the funnel, each wraps ~250°; noise cuts 2–3 holes in each; pale beige top edge, dark brown lower lip, back half at 50%' },
    { zh: '底部沙雲：18 團粗糙抖色沙球（半徑 0.3–0.5）繞底部轉，半埋地面；頂部 10 團較淡、互相重疊的沙雲（半徑 0.3–0.45）繞頂緣轉成雲冠', en: 'base cloud: 18 rough dithered sand balls (radius 0.3–0.5) circle the base, half sunk; 10 thinner overlapping puffs (radius 0.3–0.45) circle the top rim as a cloud crown' },
    { zh: '砂石：23 粒（約 4 成為低多邊形小石塊，其餘 1 像素沙粒）沿外圈螺旋上升；成形時另有約 8 顆碎石向外拋出', en: 'grit: 23 bits (~40% small low-poly pebbles, the rest one-pixel grains) spiral up the outside; about 8 more pebbles are thrown out at the cast' },
    { zh: '地面：2 圈斷續褐色弧線轉動，氣壓環每次越擴越細，底部淡沙色地面光', en: 'ground: 2 broken brown arc rings turn, pressure rings thin as they grow, faint sand-coloured light pool under the base' },
  ],
  params: {
    funnelHeight: { zh: '漏斗高度', en: 'funnel height', min: .6, max: 1.15, step: .05, value: 1 },
    funnelWidth: { zh: '漏斗寬度', en: 'funnel width', min: .7, max: 1.3, step: .05, value: 1 },
    spin: { zh: '旋轉速度', en: 'spin speed', min: .3, max: 2, step: .1, value: 1 },
    grit: { zh: '砂石數量', en: 'grit count', min: 0, max: 60, step: 1, value: 23 },
  },
  CAST: .35, END: 3.6,
  GUSTS: [[1.45, .8], [2.25, 1], [3, .75]],
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
    const H = p.lerp(1.3, 2.7, m) * hs;
    const rb = (p.lerp(1.0, .18, mc) * (1 - .15 * g) + eo * .6) * ws, rt = p.lerp(1.65, 1.0, m) * (1 - .12 * g) * (1 + eo * .6) * ws;
    const zmin = e * e * H * .8, lean = (.08 + .12 * mc + .14 * gu) * hs;
    const ax = z => {
      const k = Math.pow(Math.max(0, z) / H, 1.5);
      return [Math.cos(t * 1.1 + 1) * lean * k + Math.sin(t * .9) * .05 * mc, Math.sin(t * 1.1 + 1) * lean * k * .8];
    };
    const bulge = 1 + .14 * gu;
    const rad = z => (rb + (rt - rb) * Math.pow(p.clamp(z / H, 0, 1.2), 1.15)) * bulge;
    const on = p.ease(p.ph(t, 0, .3)) * (1 - p.easeInCubic(e));
    return { m: mc, e, eo, H, rb, rt, zmin, ax, rad, on, gu, ws, ph: this.phase(t), spin: p.param('spin') };
  },
  // crescent bands wrapped on the funnel surface; o.gap(k) returns a (u, v) => keep mask
  bands(p, t, G, n, ramp, o) {
    const S = 18, cut = p.mode === '2d' ? .1 : .03;   // the lowest ramp level never dithers below ~50 %, so drop faint values instead of drawing them
    const climb = G.ph * o.climb * (.5 + .5 * G.spin), turn = G.ph * o.spin * G.spin;
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
      const gap = o.gap ? o.gap(k) : null;
      p.ribbon(L, R, (u, v) => {
        const x = u * S, i0 = Math.min(S - 1, x | 0), ii = I[i0] + (I[i0 + 1] - I[i0]) * (x - i0);
        if (ii <= .01) return 0;
        const tp = Math.pow(Math.sin(Math.PI * u), .55), dv = (v - .5) * 2;
        if (Math.abs(dv) > tp) return 0;
        if (gap && !gap(u, v)) return 0;
        const val = ii * (dv > tp * .45 ? o.hi : dv < -tp * .5 ? o.lo : o.mid);
        return val < cut ? 0 : val;
      }, ramp, 1);
    }
  },
  // dithered dust ball; the 2D view has no dither, so there the puff stays opaque and shrinks instead
  puff(p, x, y, z, r, ramp, alpha, seed, o) {
    if (alpha <= .02) return;
    if (p.mode === '2d') { if (alpha < .2) return; p.ball(x, y, z, r * (.45 + .55 * Math.min(1, alpha * 1.25)), ramp, Object.assign({ rough: .3, shadow: false, seed }, o)); return; }
    // one shared dither offset: overlapping puffs keep their holes aligned, so no false depth edges light up inside the cloud
    p.ball(x, y, z, r, ramp, Object.assign({ rough: .45, alpha, shadow: false, seed: 1 }, o));
  },
  draw(p, t) {
    const SD = this.palette.sand, D = this.palette.dust, HZ = this.palette.haze, GR = this.palette.grit;
    const G = this.geo(p, t), C = this.CAST, END = this.END, sp = .5 + .5 * G.spin;
    const dustOn = p.ease(p.ph(t, 0, .5)) * (1 - p.easeInCubic(p.ph(t, 3.9, 4.9)));
    const spread = 1 + p.easeOutCubic(p.ph(t, 3.7, 4.9)) * .45;
    // the cast blows the base cloud out (fast), then the funnel sucks it back
    const dc = t - C, blast = dc > 0 ? p.easeOutExpo(dc / .12) * Math.pow(Math.max(0, 1 - dc / 1), 2) : 0;
    // base cloud
    const nB = Math.round(18 * p.density);
    for (let k = 0; k < nB; k++) {
      const ang = k * 2.39996 + G.ph * .8 * sp + p.r(k, 1) * .4;
      const r = (.3 + p.r(k, 3) * .2) * (.55 + .45 * dustOn);
      const rr = Math.min(1.85 - r * .6, (.3 + p.r(k, 2) * 1.2) * (1 + (1 - G.m) * .25) * spread * (1 + .4 * blast + .12 * G.gu) * G.ws);   // stay on the island
      this.puff(p, Math.cos(ang) * rr, Math.sin(ang) * rr, -r * .2 + Math.sin(t * 2.4 + k) * .04, r, D, (.6 + .3 * p.r(k, 4)) * dustOn, k);
    }
    // dust clouds riding the top rim, pushed out by gusts
    const topOn = p.mode === '2d' ? 0 : G.m * G.on;   // no translucency in 2D: a solid crown would hide the funnel
    const nT = Math.round(10 * p.density);
    for (let k = 0; k < nT; k++) {
      const ang = k * 2.39996 + G.ph * 1.4 * sp, z = G.H * (.86 + .1 * p.r(k, 6)) + Math.sin(t * 2 + k) * .06, c = G.ax(z), rr = G.rad(z) * (1.05 + .2 * p.r(k, 7) + .25 * G.gu);
      this.puff(p, c[0] + Math.cos(ang) * rr, c[1] + Math.sin(ang) * rr, z, (.3 + p.r(k, 5) * .14) * (.6 + .4 * topOn), HZ, .4 * topOn, k + 20, { lit: .15 });
    }
    // pebbles and grains spiralling up the outside; flung out with drag and dropped at the end
    const nG = Math.round(p.param('grit') * p.density), fling = t > END ? t - END : 0;
    for (let k = 0; k < nG; k++) {
      const u = ((G.ph * (.3 + p.r(k, 1) * .2) * sp + p.r(k, 2)) % 1 + 1) % 1;
      const vis = p.env(u, 0, .05, .9, 1) * p.ph(t, C, C + .3);
      if (vis < .3) continue;
      let z = .08 + u * G.H;
      const ang = p.r(k, 3) * p.TAU + G.ph * (3.4 + p.r(k, 4)) * G.spin + u * 4;
      const rr = Math.min(1.9, G.rad(z) * (1.1 + p.r(k, 5) * .45) + .3 * G.gu * p.r(k, 6) + p.drag(2.2 * (.4 + p.r(k, 6)), 2.4, fling));   // lands on the island
      z = Math.max(.04, z - fling * fling * 2.8);
      const c = G.ax(z), x = c[0] + Math.cos(ang) * rr, y = c[1] + Math.sin(ang) * rr;
      if (k % 5 < 2) p.rock(x, y, z, .05 + p.r(k, 7) * .03, GR, k, { shadow: z > .1 });
      else p.dot(x, y, z, SD, .55 + p.r(k, 8) * .3);
    }
    // pebbles kicked out by the cast: fast, slowed by drag, falling under gravity, resting until the dust fades
    const nK = Math.round(p.param('grit') * .35 * p.density);
    if (dc > 0 && dustOn > .2) for (let k = 0; k < nK; k++) {
      const ang = k * 2.39996 + p.r(k, 41), v0 = 2.4 + p.r(k, 42) * 1.6, vz = 1.6 + p.r(k, 43) * 1.4, tt = Math.max(0, dc - p.r(k, 44) * .05);
      const d = Math.min(1.8, .3 * G.ws + p.drag(v0, 3, tt)), z = Math.max(0, .1 + vz * tt - 5 * tt * tt);
      p.rock(Math.cos(ang) * d, Math.sin(ang) * d, z + .04, .045 + p.r(k, 45) * .03, GR, k + 60, { shadow: z > .05 });
    }
    // ground marks and pressure rings (cast + each gust): shoot out, then slow and thin
    p.light(0, 0, .1, 1.8 * G.ws, D, (.45 + .2 * G.gu) * dustOn);
    for (let i = 0; i < 2; i++) {
      const rr = Math.min(1.85, (.9 + i * .5) * spread * G.ws), a0 = G.ph * (2.2 - i * .6) * sp + i * 2.5;
      if (dustOn > .12) p.ring(0, 0, .02, rr, .04, SD, .3 * dustOn, { fn: a => (Math.sin(a * 2 + a0) > .4 ? 1 : 0) });
    }
    const rings = [[C, 1.55, .8, .8]].concat(this.GUSTS.map(([tg, a]) => [tg, 1.1 * a, .6, .55 * a]));
    for (const [tr, reach, dur, I] of rings) {
      const u = (t - tr) / dur;
      if (u <= 0 || u >= 1) continue;
      p.ring(0, 0, .03, Math.min(1.9, (.3 + p.easeOutExpo(u) * reach) * G.ws), .1 * Math.pow(1 - u, 1.5) + .02, SD, I * Math.pow(1 - u, 1.5), { fn: a => .6 + .4 * Math.sin(a * 5 + tr * 7) });
    }
    // sand bands with holes
    const gap = k => (u, v) => p.noise(u * 5 + k * 3.7, v * 1.3 + G.ph * .9 + k) > .27;
    this.bands(p, t, G, 11, SD, { climb: .38, spin: 4, span: 4.4, rise: .17, w: .34, back: .5, hi: .72, mid: .5, lo: .3, gap });
  },
});
