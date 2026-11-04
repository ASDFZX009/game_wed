// 旋流風矛 / Spiraling Wind Spear — pixel version of 00GameDevs "spiral-gale" (MIT)
PXFX.define({
  id: 'spiral-gale',
  loop: 3.2,
  beats: [{ t: .3, kind: 'cast', power: .6 }, { t: 1.5, kind: 'hit', power: 1 }],
  view: { r: 3.1, h: 2.4 },
  stage: { ground: 'dirt' },
  palette: {
    wind: ['#3f8a86', '#5fb0a0', '#8fd2bc', '#b4e5d5', '#e2fbf2', '#ffffff'],
    stone: ['#4a4a44', '#62625a', '#7c7b70', '#969486', '#b0ad9e'],
  },
  timeline: [
    { t: [0, .3], zh: '四條風帶由一點向後展開成紡錘形（長 0 → 2.1，超出約 15% 再回彈），越轉越快，矛身向後退 0.15 蓄勢', en: 'four wind bands unfurl backwards from one point into a spindle (length 0 to 2.1, about 15% overshoot), spinning up, drawing back 0.15' },
    { t: [.3, 1.5], zh: '發射：起步一下急衝，之後以 ease-in 越飛越快衝向石柱；紡錘轉速同步加快（每秒約 0.7 → 2 圈），速度越快紡錘拉得越長；風痕與光點在經過處落下、受阻力向後漂並變細變淡', en: 'launch: a quick kick, then ease-in acceleration into the pillar; the spin speeds up with it (about 0.7 to 2 turns/s) and the spindle stretches with speed; wind streaks and motes drop where it passed, drift back with drag, thin and fade' },
    { t: [1.5, 1.62], zh: '命中：紡錘由後向前以 ease-in 在 0.12 秒內壓縮進接觸點；首兩幀最大的白色閃光，風結彈出放大（超出再回彈）後 0.2 秒內急縮', en: 'hit: the spindle collapses tail-first into the contact point with ease-in within 0.12 s; white flash biggest on the first two frames, a wind knot pops out with overshoot, then snaps shut within 0.2 s' },
    { t: [1.5, 2.6], zh: '面向飛行方向的風環 ease-out-expo 急衝後減速變細；6 段捲曲風帶碎片從風結高速甩出後減速漂浮、自轉逐漸變慢、上升並變暗消失', en: 'a ring facing the flight shoots out with ease-out-expo, slowing and thinning; 6 curled wind-band pieces fling out fast, then hover, spin down, rise and dim to nothing' },
  ],
  layers: [
    { zh: '主體：4 條螺旋光帶貼在紡錘面上（最大半徑 0.52，前後兩端收尖），每條沿全長扭 1 圈，邊緣較亮', en: 'body: 4 helical light bands on a spindle surface (max radius 0.52, pinched at both ends), each twisting one full turn, brighter edges' },
    { zh: '矛尖：前端一個小白光點＋四角星', en: 'tip: a small white glow point with a four-point sparkle' },
    { zh: '尾流：2 條收窄的螺旋細線（長度隨速度）＋10 條短風痕＋14 粒光點，在經過處落下並受阻力漂移', en: 'wake: 2 narrowing spiral threads (length follows speed), 10 short wind streaks and 14 motes dropped along the path, drifting with drag' },
    { zh: '命中碎片：6 段 120° 的弧形風帶，隨機傾斜、自轉、向外向上飄', en: 'impact pieces: 6 arc-shaped band pieces of 120 degrees, randomly tilted, spinning, drifting out and up' },
  ],
  params: {
    bands: { zh: '風帶數量', en: 'wind bands', min: 2, max: 6, step: 1, value: 4 },
    spin: { zh: '旋轉速度', en: 'spin speed', min: 0, max: 3, step: .1, value: 1 },
    spearLength: { zh: '風矛長度', en: 'spear length', min: .6, max: 1.5, step: .05, value: 1 },
    pieces: { zh: '命中碎片數量', en: 'impact pieces', min: 0, max: 12, step: 1, value: 6 },
  },
  draw(p, t) {
    const Wd = this.palette.wind, ST = this.palette.stone;
    const CAST = .3, HIT = 1.5, face = 2.2, hz = 1.0, RM = .52, LEN = 2.1 * p.param('spearLength');
    const nB = Math.round(p.param('bands')), spinK = p.param('spin'), X0 = -3.4 + LEN, XB = X0 - .15, XE = face - .05;
    p.pillar(2.55, 0, .7, 2.1, ST);

    // launch kick, then accelerate into the target
    const travel = f => .12 * p.easeOutCubic(f / .16) + .88 * Math.pow(p.clamp(f, 0, 1), 2.5);
    const xAt = tau => (tau < CAST ? p.lerp(X0, XB, p.easeOutCubic(tau / CAST)) : p.lerp(XB, XE, travel(p.ph(tau, CAST, HIT))));
    const spinAt = tau => -spinK * (4 * Math.min(tau, HIT) + 1.5 * p.easeInCubic(Math.min(1, tau / CAST)) + 5 * travel(p.ph(tau, CAST, HIT)));

    // helical bands on a spindle: tip at x, length L, intensity I
    const spindle = (x, L, I, spin) => {
      for (let b = 0; b < nB; b++) {
        const left = [], right = [];
        for (let k = 0; k <= 20; k++) {
          const u = k / 20, prof = Math.pow(Math.sin(Math.PI * u), .8) * RM;
          const ang = b / nB * p.TAU + u * p.TAU + spin, da = .28 * 4 / Math.max(4, nB) * (.4 + .6 * prof / RM);
          const px = x - L * (1 - u);
          left.push([px, Math.cos(ang - da) * prof, hz + Math.sin(ang - da) * prof]);
          right.push([px, Math.cos(ang + da) * prof, hz + Math.sin(ang + da) * prof]);
        }
        p.ribbon(left, right, (u, v) => (.55 + .45 * Math.max(p.band(v, 0, .35), p.band(v, 1, .35))) * (.25 + .75 * u), Wd, I);
      }
    };

    if (t < HIT) {
      const x = xAt(t), v = (x - xAt(t - .03)) / .03, sp = Math.min(1.3, v / 8), spin = spinAt(t);
      const L = LEN * p.easeOutBack(p.ph(t, 0, .3), 2) * (1 + .18 * sp);
      // wake threads, longer when fast
      for (let w = 0; w < 2; w++) {
        const pts = [];
        for (let k = 0; k <= 10; k++) {
          const u = k / 10, ang = spin * .6 + w * Math.PI + u * 5, rad = .12 * (1 - u);
          pts.push([x - L - u * (.4 + 1.3 * sp) * Math.min(1, t * 3), Math.cos(ang) * rad, hz + Math.sin(ang) * rad]);
        }
        p.trail(pts, .05, .02, Wd, .7, 0);
      }
      // streaks and motes dropped along the path: drift back with drag
      const nS = Math.round(10 * p.density);
      for (let s = 0; s < nS; s++) {
        const P = .5, age = (t / P + p.r(s, 1)) % 1, tb = t - age * P;
        if (tb < CAST) continue;
        const sx = xAt(tb) - LEN * .5 - p.drag(2.2, 3, age * P), ang = p.r(s, 2) * p.TAU, rad = .25 + p.r(s, 3) * .25;
        p.line([sx, Math.cos(ang) * rad, hz + Math.sin(ang) * rad], [sx - .3 - p.r(s, 4) * .2, Math.cos(ang) * rad, hz + Math.sin(ang) * rad], .04, Wd, .8 * (1 - age), { i1: 0 });
      }
      const nM = Math.round(14 * p.density);
      for (let m = 0; m < nM; m++) {
        const P = .7, age = (t / P + p.r(m, 5)) % 1, tb = t - age * P;
        if (tb < CAST * .5) continue;
        const mx = xAt(tb) - LEN * .6 - p.drag(1.8, 3, age * P), ang = p.r(m, 6) * p.TAU;
        p.dot(mx, Math.cos(ang) * .4 * (1 - age * .5), hz + Math.sin(ang) * .35, Wd, 1 - age);
      }
      if (L > .02) spindle(x, L, .95, spin);
      p.glow(x, 0, hz, .18, Wd, .9);
      p.sparkle(x + .05, 0, hz, 2, Wd, 1);
      p.light(x - L * .4, 0, hz, 1.6, Wd, .45);
      return;
    }

    const a = t - HIT, spin = spinAt(HIT) - spinK * 6 * p.drag(1, 6, a);
    // collapse tail-first into the contact point
    const cmp = 1 - p.easeInCubic(p.ph(a, 0, .12));
    if (cmp > 0) spindle(face - .05, LEN * 1.15 * cmp, .95, spin);
    // flash: biggest on the first frames
    const fl = Math.pow(1 - p.ph(a, 0, .14), 3);
    if (fl > 0) p.glow(face - .15, 0, hz, .3 + .5 * fl, Wd, 1.5 * fl, { pow: 1.4 });
    // knot: pops out with overshoot, then snaps shut
    const kn = p.easeOutBack(p.ph(a, 0, .08), 3) * (1 - p.easeInCubic(p.ph(a, .18, .38)));
    if (kn > 0) {
      p.glow(face - .2, 0, hz, .45 * Math.min(1, kn), Wd, 1.2 * Math.min(1, kn), { pow: 1.4 });
      for (let k = 0; k < 3; k++) p.ring(face - .2, 0, hz, (.2 + k * .06) * kn, .05, Wd, Math.min(1, kn), { axis: [Math.cos(k * 2.1 + a * 9), Math.sin(k * 2.1 + a * 9), .6] });
    }
    // ring facing the flight: shoots out, slows, thins
    const rk = p.ph(a, .01, .5);
    if (rk > 0 && rk < 1) p.ring(face - .2, 0, hz, .25 + p.easeOutExpo(rk) * .95, .08 * Math.pow(1 - rk, 1.5) + .02, Wd, 1.1 * (1 - rk), { axis: [1, 0, 0] });
    // curled band pieces: fling out fast, hover, spin down, rise and fade
    const nP = Math.round(p.param('pieces') * p.density);
    for (let c = 0; c < nP; c++) {
      const t0 = .04 + (c % 6) * .02, u = p.ph(a, t0, 1 + (c % 6) * .05);
      if (u <= 0 || u >= 1) continue;
      const e = p.easeOutExpo(u), ang = c * 2.39996 + .3;
      const cx = face - .3 - e * (.4 + p.r(c, 11) * .7), cy = Math.cos(ang) * e * 1.1, cz = hz + Math.sin(ang) * e * .6 + u * u * .6;
      const ax = [p.r(c, 12) - .5, p.r(c, 13) - .5, .6 + p.r(c, 14)];
      const a0 = c + (14 + c) * p.drag(1, 2.5, a - t0), rad = .18 + e * .16;
      p.ring(cx, cy, cz, rad, .07, Wd, (1 - u * u) * 1.05, { axis: ax, a0, a1: a0 + 2.1, fn: (q, v) => .4 + .6 * Math.sin(v * Math.PI) });
    }
    // drifting motes: fast out, drag
    const nM = Math.round(10 * p.density);
    for (let m = 0; m < nM; m++) {
      const u = p.ph(a, .03 + (m % 10) * .015, .8 + (m % 10) * .03);
      if (u <= 0 || u >= 1) continue;
      const ang = p.r(m, 21) * p.TAU, d = p.drag(3.5, 4, a);
      p.dot(face - .3 - d * .5 * p.r(m, 22), Math.cos(ang) * d * .7, hz + Math.sin(ang) * d * .35 + u * .4, Wd, 1 - u);
    }
    p.light(face - .3, 0, hz, 1.6, Wd, .75 * Math.max(fl, .75 * (1 - p.ph(a, 0, .9))));
  },
});
