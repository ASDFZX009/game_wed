// 熔脈地裂 / Molten Vein Fissure — pixel version of 00GameDevs "magma-fissure" (MIT)
PXFX.define({
  id: 'magma-fissure',
  loop: 2.2,
  beats: [{ t: 0, kind: 'cast', power: .5 }, { t: .55, kind: 'burst', power: 1.0 }],
  view: { r: 2.5, h: 1.6 },
  stage: { ground: 'dirt', tiles: true },
  palette: {
    lava: ['#a8281f', '#e0461f', '#ff823e', '#ffb45e', '#ffe39a', '#fffbe8'],
    heat: ['#8a2a22', '#c8401c', '#ff823e'],
    rock: ['#2e2228', '#4a3434', '#6a4a40', '#8a6450', '#b08060'],
    smoke: ['#3c3238', '#54464a', '#6c5c5c', '#857470'],
  },
  timeline: [
    { t: [0, .55], zh: '裂縫由左端（x = −2.1）沿 +x 撕開：起步一下急裂，之後 ease-in-cubic 越裂越快衝到右端，裂口前端噴出岩漿點', en: 'the fissure tears along +x from x = −2.1: a quick initial jolt, then it accelerates (ease-in-cubic) to the far end; lava droplets spit from the advancing tip' },
    { t: [.55, .62], zh: '爆發：裂縫到達右端的一瞬，整條裂縫白熱閃亮（前 2 幀最亮最粗），岩漿沿全線向上噴濺', en: 'eruption: the moment the crack reaches the far end the whole rift flares white-hot (brightest and widest for the first 2 frames) and lava spatters up along its full length' },
    { t: [.05, 1.0], zh: '裂縫經過處石板 0.12 秒內被頂起 0.32–0.6（ease-out-back 衝過頭）、翻轉、停一下，再受重力砸回地面並輕彈一下，底下透出橙光', en: 'as the crack passes, slabs are punched up 0.32–0.6 within 0.12 s (ease-out-back overshoot), tilt, hang, then slam back down under gravity with a small bounce, glowing orange underneath' },
    { t: [.2, 1.4], zh: '裂縫兩側伸出短支裂；暗紅煙團由裂口急升後減速（阻力）並變大', en: 'short side cracks branch off; dark red-brown smoke puffs shoot up from the rift, slow down (drag) and swell' },
    { t: [.9, 1.85], zh: '熔光由黃白冷卻成暗紅，只剩零星火光後消失', en: 'the glow cools from yellow-white to dark red, a few sparks remain, then it is gone' },
  ],
  layers: [
    { zh: '主裂縫：鋸齒折線貼地，預設長 4.2、14 個頂點（約每 0.3 一個），1 像素白熱芯線＋0.24 寬橙色外光', en: 'main crack: a zig-zag polyline on the floor, 14 vertices over the default 4.2 length (one per 0.3), 1 px white-hot core inside a 0.24-wide orange glow' },
    { zh: '支裂：每個頂點 1 條 0.2–0.45 長（乘以「支裂長度」）的短裂紋，向兩側斜出', en: 'side cracks: one 0.2–0.45 branch per vertex (x "branch length"), slanting out to either side' },
    { zh: '石板：預設 13 塊低多邊形暗色岩石（半徑 0.16–0.25），沿裂縫左右交錯，頂起時下方有扁平橙色熱光', en: 'slabs: 13 dark low-poly rocks by default (radius 0.16–0.25) alternating either side of the crack, a flat orange heat glow underneath while lifted' },
    { zh: '岩漿點：裂口前端每次 3 粒帶重力的黃橙像素；爆發時預設 18 粒沿全線噴起，受阻力與重力落下', en: 'lava droplets: gravity pixels in yellow-orange spat from the crack tip; on the eruption 18 by default spatter up along the full length, slowed by drag and pulled down by gravity' },
    { zh: '煙：7 團半透明暗褐色粗糙煙球，急升後減速、變大並抖色淡出', en: 'smoke: 7 translucent dark-brown rough puffs that shoot up, slow down, swell and dither away' },
    { zh: '地面：沿裂縫三處橙色地面光，爆發時最亮，隨冷卻變暗', en: 'ground: orange light pools at three points along the crack, brightest on the eruption, dimming as it cools' },
  ],
  params: {
    length: { zh: '裂縫長度', en: 'fissure length', min: 1.6, max: 4.6, step: .1, value: 4.2 },
    slabs: { zh: '石板數量', en: 'slab count', min: 0, max: 22, step: 1, value: 13 },
    branches: { zh: '支裂長度', en: 'branch length', min: 0, max: 2, step: .1, value: 1 },
    lava: { zh: '爆發岩漿點數', en: 'eruption droplets', min: 0, max: 40, step: 1, value: 18 },
  },
  draw(p, t) {
    const P = this.palette, L = P.lava;
    const LEN = p.param('length'), N = Math.max(6, Math.round(14 * LEN / 4.2)), X0 = -LEN / 2, X1 = LEN / 2, REACH = .55, BL = p.param('branches');
    const prog = tt => .15 * p.easeOutCubic(p.ph(tt, 0, .12)) + .85 * p.easeInCubic(p.ph(tt, 0, REACH));
    const front = X0 + (X1 - X0) * prog(t);
    const reveal = x => {                                               // time the crack reaches x (inverse of prog)
      const f = p.clamp((x - X0) / (X1 - X0), 0, 1);
      let lo = 0, hi = REACH;
      for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; if (prog(m) < f) lo = m; else hi = m; }
      return hi;
    };
    const a = t - REACH, fl = a >= 0 ? Math.pow(1 - p.ph(a, 0, .2), 2) : 0;
    const pts = [];
    for (let i = 0; i < N; i++) pts.push([X0 + (X1 - X0) * i / (N - 1), ((p.r(i, 1) - .5) * .42 + Math.sin(i * 1.3) * .08) * Math.min(1, LEN / 4.2), .015]);
    const cool = x => { const b = t - reveal(x); return b < 0 ? 0 : Math.min(1, b * 12) * (1 - .55 * p.ph(b, .15, .9)) * (1 - p.ph(t, 1.1, 1.85)); };
    // ----- main crack -----
    for (let i = 0; i < N - 1; i++) {
      const s0 = pts[i], b0 = pts[i + 1];
      if (s0[0] >= front) break;
      const f = Math.min(1, (front - s0[0]) / (b0[0] - s0[0]));
      const b = [p.lerp(s0[0], b0[0], f), p.lerp(s0[1], b0[1], f), s0[2]];
      const h = cool((s0[0] + b[0]) / 2);
      if (h <= 0) continue;
      p.line(s0, b, (.24 * (.6 + .4 * h)) * (1 + .7 * fl), P.heat, .7 * h + .4 * fl);
      p.line(s0, b, .07 * (1 + .8 * fl), L, .45 + .65 * h + .6 * fl);
      // side branch from vertex i
      if (i > 0 && f >= 1 && BL > 0) {
        const side = p.r(i, 2) > .5 ? 1 : -1, len = (.2 + p.r(i, 3) * .25) * BL, ang = side * (1.0 + p.r(i, 4) * .7) + (p.r(i, 5) - .5) * .6;
        const bl = len * p.easeOutCubic((t - reveal(s0[0])) * 8);
        const c = [s0[0] + Math.cos(ang) * bl, s0[1] + Math.sin(ang) * bl, s0[2]];
        p.line(s0, c, .05, L, .3 + .55 * h + .3 * fl, { w1: .02, i1: .2 * h });
        if (i % 3 === 0) {
          const c2 = [c[0] + Math.cos(ang + side * .8) * bl * .5, c[1] + Math.sin(ang + side * .8) * bl * .5, s0[2]];
          p.line(c, c2, .03, L, .25 + .4 * h, { i1: .1 * h });
        }
      }
    }
    // crack tip spark
    if (t < REACH) {
      p.glow(front, 0, .08, .18, L, .9);
      for (let k = 0; k < 9; k++) {
        const ph = (t * 6 + k / 3) % 1, x = front - ph * .3, vz = 1.2 + p.r(k + Math.floor(t * 6 + k / 3) * 9, 6) * 1.5;
        const tt = ph * .35, z = vz * tt - 5 * tt * tt;
        if (z <= 0) continue;
        p.dot(x, (p.r(k, 7) - .5) * .5 * ph, z, L, 1 - ph * .5, k % 3 ? 1 : 2);
      }
    }
    // ----- eruption: lava spatters up along the whole rift -----
    if (a >= 0) {
      const nL = Math.round(p.param('lava') * p.density);
      for (let k = 0; k < nL; k++) {
        const tt = a - p.r(k, 20) * .05, life = .45 + p.r(k, 21) * .3;
        if (tt <= 0 || tt >= life) continue;
        const i = Math.floor(p.r(k, 22) * (N - 1)), u0 = p.r(k, 23), x0 = p.lerp(pts[i][0], pts[i + 1][0], u0), y0 = p.lerp(pts[i][1], pts[i + 1][1], u0);
        const vz = 3.5 + p.r(k, 24) * 3.5, vy = (p.r(k, 25) - .5) * 3;
        const at = q => [x0 + (p.r(k, 26) - .5) * p.drag(1, 3, q), y0 + p.drag(vy, 3, q), .05 + p.drag(vz, 2.5, q) - 4.5 * q * q];
        const hd = at(tt), tl = at(Math.max(0, tt - .045));
        if (hd[2] < 0) continue;
        p.line(hd, tl, .06, L, 1.1 - tt / life * .6, { w1: .03, i1: .5 });
      }
    }
    // ----- slabs: punched up (overshoot), hang, slam down with gravity, small bounce -----
    const nS = Math.round(p.param('slabs') * p.density);
    for (let k = 0; k < nS; k++) {
      const x = X0 + .15 + (X1 - X0 - .3) * (nS > 1 ? k / (nS - 1) : .5) + (p.r(k, 8) - .5) * .15, side = k % 2 ? 1 : -1;
      const y = (p.r(Math.round((x - X0) / (X1 - X0) * (N - 1)), 1) - .5) * .42 * Math.min(1, LEN / 4.2) + side * (.18 + p.r(k, 9) * .12);
      const b = t - reveal(x) - .02;
      if (b < 0) continue;
      const fade = 1 - p.ph(t, 1.35 + p.r(k, 11) * .2, 1.75 + p.r(k, 11) * .2);
      if (fade <= 0) continue;
      const top = .32 + p.r(k, 10) * .28;
      let lift;
      if (b < .12) lift = top * p.easeOutBack(b / .12, 2);
      else if (b < .32) lift = top;
      else if (b < .5) lift = top * (1 - p.easeInCubic((b - .32) / .18));
      else lift = Math.max(0, Math.sin(p.ph(b, .5, .62) * Math.PI)) * top * .12;
      const air = b < .5 ? 1 - p.ph(b, .32, .5) : 0, tilt = Math.sin(Math.PI * Math.min(1, b / .5)) * .5 * side;
      p.rock(x, y + tilt * .2, lift + .09, .16 + p.r(k, 12) * .09, P.rock, k * 7 + (b > .32 ? 1 : 0), { alpha: fade, shadow: fade > .5 });
      const hg = Math.min(1, b / .05) * air * cool(x);
      if (hg > .05) p.glow(x, y, .03, .18 * hg + .04, L, .7 * hg, { flatten: .6 });
    }
    // ----- smoke: shoots up, slows (drag), swells -----
    const nM = Math.round(7 * p.density);
    for (let k = 0; k < nM; k++) {
      const x = X0 + .4 + (LEN - .8) * (nM > 1 ? k / (nM - 1) : .5) + (p.r(k, 13) - .5) * .3;
      const t0 = reveal(x) + .1, u = p.ph(t, t0, t0 + 1.1);
      if (u <= 0 || u >= 1) continue;
      p.ball(x + u * .2, (p.r(k, 14) - .5) * .4, .15 + p.drag(2.6, 2.8, t - t0), (.14 + p.r(k, 15) * .08) * (1 + p.easeOutCubic(u) * 1.3), P.smoke,
        { alpha: .65 * (1 - u * u), rough: .5, shadow: false, seed: k });
    }
    // ----- leftover sparks while cooling -----
    const nK = Math.round(8 * p.density);
    for (let k = 0; k < nK; k++) {
      const u = p.ph(t, 1.0 + p.r(k, 16) * .5, 1.4 + p.r(k, 16) * .5);
      if (u <= 0 || u >= 1) continue;
      const x = X0 + .3 + p.r(k, 17) * (LEN - .6);
      p.dot(x, (p.r(k, 18) - .5) * .3, .05 + p.easeOutCubic(u) * .5, L, (1 - u) * .8);
    }
    // ----- light -----
    for (let k = 0; k < 3; k++) {
      const x = (k - 1) * LEN / 3, h = cool(x);
      if (h > 0) p.light(x, 0, .1, 1.1 * Math.max(.7, LEN / 4.2), L, .75 * h + .5 * fl);
    }
  },
});
