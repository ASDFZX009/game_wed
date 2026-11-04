// 捲焰風旋 / Flame-Swept Vortex — pixel version of 00GameDevs "fire-vortex" (MIT)
PXFX.define({
  id: 'fire-vortex',
  loop: 5,
  beats: [{ t: .35, kind: 'cast', power: .9 }, { t: 1.5, kind: 'pulse', power: .5 }, { t: 2.3, kind: 'pulse', power: .7 }, { t: 3.05, kind: 'pulse', power: .5 }],
  view: { r: 2.2, h: 3.1 },
  stage: { ground: 'ash' },
  palette: {
    fire: ['#a3281c', '#d84a1f', '#ff884b', '#ffb46a', '#ffe29a', '#fff8e6'],
    smoke: ['#2c2430', '#46353a', '#694538', '#9c5a38', '#d0804a'],
    ember: ['#c8361c', '#ff6a2a', '#ffb050', '#fff0b0'],
  },
  timeline: [
    { t: [0, .35], zh: '蓄勢：地面冒出被火光染橙的煙，矮寬的碗形火帶慢慢轉動並略為收緊（約 15%），轉速由 0.15 倍加速到 0.5 倍', en: 'wind-up: smoke lit orange rises; a squat bowl of flame bands turns slowly and tightens ~15%, spin accelerating from 0.15x to 0.5x' },
    { t: [.35, 1], zh: '成形（cast）：火漏斗在 0.6 秒內急速拉高（ease-out-back，高度先衝過頭約 8% 再回落），轉速在 0.06 秒內衝到 1.7 倍再回落；地面一圈火環以 ease-out-expo 急衝後減速、越擴越細，一陣火星向外噴出', en: 'cast: the flame funnel whips up within 0.6 s (ease-out-back, ~8% overshoot), spin jumps to 1.7x within 0.06 s then settles; a ring of fire shoots across the ground (ease-out-expo, thinning) and a spray of embers bursts out' },
    { t: [1, 3.6], zh: '持續：12 條火帶急轉往上爬，上緣捲成火舌；1.5、2.3、3.05 秒各一陣強風：轉速瞬間加 80%（0.04 秒起，0.9 秒三次方衰減）、漏斗鼓脹 14%、內焰與地面火光猛然變亮再慢慢回落、火星甩得更遠', en: 'sustain: 12 flame bands spin and climb, their top edges curl into tongues; gusts at 1.5, 2.3 and 3.05 s: spin +80% (0.04 s attack, cubic decay over 0.9 s), the funnel bulges 14%, the inner heat and the firelight flare and then ease back, embers fly further' },
    { t: [3.6, 4.8], zh: '收尾：轉速按指數衰減；漏斗底部加速熄滅，上半部先快後慢地攤開成一圈橫向火帶、轉暗紅後迅速消失，煙團淡出', en: 'end: spin decays exponentially; the base goes out with acceleration, the top spreads fast then slower into a wide horizontal ring of flame, darkens to deep red and drops out; smoke fades' },
  ],
  layers: [
    { zh: '漏斗：半徑由底部 0.16 漸寬到頂部 1.1、高 2.7（可調高度、寬度），軸線上半段畫圓搖擺 0.2', en: 'funnel: radius 0.16 at the base to 1.1 at the top, 2.7 tall (height and width are knobs), upper axis sways in a 0.2 circle' },
    { zh: '轉動：所有旋轉與上爬共用一條「轉速曲線」積分出的相位，不是固定角速度', en: 'motion: every spin and climb reads one phase integrated from the speed curve, never a fixed angular speed' },
    { zh: '火帶：12 條寬 0.25–0.5 的月牙帶貼著漏斗面；下緣深紅、中段橙、上緣用雜訊切成鋸齒火舌並轉淡黃；背面 55% 亮度', en: 'flame bands: 12 crescent strips 0.25–0.5 wide on the funnel; deep red lower lip, orange body, top edge cut into noisy tongues that turn pale yellow; back half at 55%' },
    { zh: '內焰：沿軸線下三分之二放 4 團疊加光暈，令漏斗內部更熱更亮', en: 'inner heat: 4 additive glows along the lower two thirds of the axis make the inside of the funnel hotter' },
    { zh: '煙：16 團粗糙抖色煙球繞底部轉，暗面偏紫、受光面偏橙紅', en: 'smoke: 16 rough dithered balls circle the base, violet in shadow and orange-red where lit' },
    { zh: '火星：18 粒 1–2 像素火星沿切線甩出（帶阻力先快後慢）並上飄，甩出速度跟當刻轉速；地面一大片閃爍橙色火光，外圈 2 道暗紅弧線', en: 'embers: 18 sparks of 1–2 px fling out tangentially (fast, then slowed by drag) and drift up, launch speed follows the spin at birth; a big flickering orange light pool on the ground, 2 dark red arcs outside' },
  ],
  params: {
    funnelHeight: { zh: '漏斗高度', en: 'funnel height', min: .6, max: 1.15, step: .05, value: 1 },
    funnelWidth: { zh: '漏斗寬度', en: 'funnel width', min: .7, max: 1.3, step: .05, value: 1 },
    spin: { zh: '旋轉速度', en: 'spin speed', min: .3, max: 2, step: .1, value: 1 },
    embers: { zh: '火星數量', en: 'ember count', min: 0, max: 48, step: 1, value: 18 },
  },
  CAST: .35, END: 3.6,
  GUSTS: [[1.5, .8], [2.3, 1], [3.05, .75]],
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
    const rb = (p.lerp(1.05, .16, mc) * (1 - .15 * g) + eo * .55) * ws, rt = p.lerp(1.7, 1.1, m) * (1 - .12 * g) * (1 + eo * .7) * ws;
    const zmin = e * e * H * .8, lean = (.1 + .1 * mc + .14 * gu) * hs;
    const ax = z => {
      const k = Math.pow(Math.max(0, z) / H, 1.6);
      return [Math.cos(t * 1.3 + 2) * lean * k + Math.sin(t * .8) * .05 * mc, Math.sin(t * 1.3 + 2) * lean * k * .7];
    };
    const bulge = 1 + .14 * gu;
    const rad = z => (rb + (rt - rb) * Math.pow(p.clamp(z / H, 0, 1.2), 1.2)) * bulge;
    const on = p.ease(p.ph(t, 0, .3)) * (1 - p.easeInCubic(e));
    return { m: mc, e, eo, H, rb, rt, zmin, ax, rad, on, gu, ws, ph: this.phase(t), spin: p.param('spin') };
  },
  // flame bands wrapped on the funnel surface, top edge torn into tongues
  bands(p, t, G, n, ramp, o) {
    const S = 18, cut = p.mode === '2d' ? .1 : .03;   // the lowest ramp level never dithers below ~50 %, so drop faint values instead of drawing them
    const climb = G.ph * o.climb * (.5 + .5 * G.spin), turn = G.ph * o.spin * G.spin;
    for (let k = 0; k < n; k++) {
      const f = ((k / n + climb + p.r(k, 7) * .05) % 1 + 1) % 1;
      const z0 = G.zmin + (f * 1.12 - .2) * (G.H - G.zmin);
      const span = o.span * (.8 + p.r(k, 1) * .4), rise = o.rise * G.H, a0 = p.r(k, 2) * p.TAU + turn;
      const L = [], R = [], I = [];
      const fade = p.env(f, 0, .1, .8, 1) * G.on;
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
      const tf = Math.floor(t * 12);   // tongues re-roll 12 times a second
      p.ribbon(L, R, (u, v) => {
        const x = u * S, i0 = Math.min(S - 1, x | 0), ii = I[i0] + (I[i0 + 1] - I[i0]) * (x - i0);
        if (ii <= .01) return 0;
        const tp = Math.pow(Math.sin(Math.PI * u), .5), dv = (v - .5) * 2;
        const top = tp * (.35 + .75 * p.noise(u * 11 + k * 5.3, tf * .37 + k));
        if (dv < -tp || dv > top) return 0;
        const val = ii * (dv > top - .3 ? o.hi : dv < -tp * .45 ? o.lo : o.mid);
        return val < cut ? 0 : val;
      }, ramp, 1);
    }
  },
  // dithered smoke ball; the 2D view has no dither, so there the puff stays opaque and shrinks instead
  puff(p, x, y, z, r, ramp, alpha, seed, o) {
    if (alpha <= .02) return;
    if (p.mode === '2d') { if (alpha < .2) return; p.ball(x, y, z, r * (.45 + .55 * Math.min(1, alpha * 1.25)), ramp, Object.assign({ rough: .3, shadow: false, seed }, o)); return; }
    // one shared dither offset: overlapping puffs keep their holes aligned, so no false depth edges light up inside the cloud
    p.ball(x, y, z, r, ramp, Object.assign({ rough: .45, alpha, shadow: false, seed: 1 }, o));
  },
  draw(p, t) {
    const F = this.palette.fire, SM = this.palette.smoke, EM = this.palette.ember;
    const G = this.geo(p, t), C = this.CAST, sp = .5 + .5 * G.spin;
    const smokeOn = p.ease(p.ph(t, 0, .5)) * (1 - p.easeInCubic(p.ph(t, 3.9, 4.9)));
    const flick = .85 + .15 * p.noise(t * 9, 3), dc = t - C;
    const blast = dc > 0 ? p.easeOutExpo(dc / .12) * Math.pow(Math.max(0, 1 - dc / 1), 2) : 0;
    const heat = flick * (1 + .45 * G.gu + .5 * (dc > 0 ? Math.pow(Math.max(0, 1 - dc / .5), 3) : 0));   // flares on the cast and each gust
    // smoke at the base, lit from above by the flames; blown out by the cast, then sucked back
    const nS = Math.round(16 * p.density);
    for (let k = 0; k < nS; k++) {
      const ang = k * 2.39996 + G.ph * .9 * sp + p.r(k, 1) * .4;
      const r = (.26 + p.r(k, 3) * .2) * (.55 + .45 * smokeOn);
      const rr = Math.min(1.85 - r * .6, ((.35 + p.r(k, 2) * 1.1) * (1 + (1 - G.m) * .25) * (1 + .4 * blast + .12 * G.gu) + G.eo * .6) * G.ws);   // stay on the island
      this.puff(p, Math.cos(ang) * rr, Math.sin(ang) * rr, -r * .15 + Math.sin(t * 2.6 + k) * .04, r, SM,
        (.6 + .3 * p.r(k, 4)) * smokeOn, k, { lit: .12 * G.on * heat });
    }
    // ground firelight, scorched arcs, fire ring on the cast (shoots out, slows, thins)
    p.light(0, 0, .3, 2.1 * G.ws, F, .85 * G.on * heat + .2 * smokeOn);
    for (let i = 0; i < 2; i++) {
      const rr = Math.min(1.85, (1.0 + i * .5 + G.eo * .4) * G.ws), a0 = G.ph * (2.4 - i * .6) * sp + i * 2;
      if (smokeOn > .12) p.ring(0, 0, .02, rr, .04, F, .28 * smokeOn, { fn: a => (Math.sin(a * 2 + a0) > .4 ? 1 : 0) });
    }
    const rings = [[C, 1.55, .7, 1]].concat(this.GUSTS.map(([tg, a]) => [tg, 1.1 * a, .55, .6 * a]));
    for (const [tr, reach, dur, I] of rings) {
      const u = (t - tr) / dur;
      if (u <= 0 || u >= 1) continue;
      p.ring(0, 0, .03, Math.min(1.9, (.3 + p.easeOutExpo(u) * reach) * G.ws), .12 * Math.pow(1 - u, 1.5) + .02, F, I * Math.pow(1 - u, 1.5), { fn: a => .55 + .45 * p.noise(a * 3 + tr, t * 8) });
    }
    // embers flung tangentially: fast, slowed by drag; launch speed follows the spin when they leave
    const nE = Math.round(p.param('embers') * p.density);
    for (let k = 0; k < nE; k++) {
      const life = .7 + p.r(k, 1) * .5, u = ((t + p.r(k, 2) * life) / life) % 1;
      const born = t - u * life, age = u * life;
      if (born < C || born > 3.4) continue;
      const z0 = .3 + p.r(k, 3) * 2.2 * G.m * (G.H / 2.7), a0 = p.r(k, 4) * p.TAU + born * 4, c = G.ax(z0), r0 = G.rad(z0);
      const d = p.drag((2.4 + p.r(k, 5) * 1.6) * this.speed(born), 3, age);
      const x = c[0] + Math.cos(a0) * r0 - Math.sin(a0) * d, y = c[1] + Math.sin(a0) * r0 + Math.cos(a0) * d;
      p.dot(x, y, z0 + .9 * age / life, EM, 1 - u * .8, k % 3 === 0 ? 2 : 1);
    }
    // cast spray: embers burst out from the base with drag, then float up
    const nB = Math.round(p.param('embers') * .6 * p.density);
    if (dc > 0 && dc < 1.1) for (let k = 0; k < nB; k++) {
      const life = .6 + p.r(k, 51) * .5;
      if (dc > life) continue;
      const ang = k * 2.39996 + p.r(k, 52), v0 = 3.5 + p.r(k, 53) * 2.5, z0 = .15 + p.r(k, 54) * .5;
      const d = .2 + p.drag(v0, 4, dc), dp = .2 + p.drag(v0, 4, Math.max(0, dc - .05)), ca = Math.cos(ang), sa = Math.sin(ang), I = 1 - dc / life * .8;
      p.line([ca * dp, sa * dp, z0 + .6 * Math.max(0, dc - .05)], [ca * d, sa * d, z0 + .6 * dc], .04, EM, I * .5, { i1: I });   // smear along the velocity
      p.dot(ca * d, sa * d, z0 + .6 * dc, EM, I, k % 4 === 0 ? 2 : 1);
    }
    // inner heat along the axis
    if (p.mode !== '2d') for (let i = 0; i < 4; i++) {   // 2D draws every glow tail as a flat disc, so skip it there
      const z = G.zmin + (i + .6) / 6 * (G.H - G.zmin), c = G.ax(z);
      if (G.on > .12) p.glow(c[0], c[1], z, G.rad(z) * .7, F, .22 * G.on * heat);
    }
    this.bands(p, t, G, 12, F, { climb: .4, spin: 4.4, span: 4.4, rise: .16, w: .38, back: .55, hi: .78, mid: .56, lo: .34 });
  },
});
