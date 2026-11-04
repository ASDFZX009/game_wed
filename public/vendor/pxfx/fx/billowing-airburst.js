// 烈焰空爆 / Billowing Airburst — pixel version of 00GameDevs "billowing-airburst" (MIT)
PXFX.define({
  id: 'billowing-airburst',
  loop: 2.4,
  beats: [{ t: .08, kind: 'burst', power: 1.1 }],
  view: { r: 2.4, h: 2.9 },
  stage: { ground: 'stone', tiles: true },
  palette: {
    hot: ['#b8281a', '#e8461f', '#ff7a24', '#ffb050', '#ffe090'],
    fire: ['#7a1e1c', '#b8281a', '#e8461f', '#ff7a24', '#ffb050'],
    ember: ['#2a1c24', '#4a1e22', '#8a2618', '#d23a1c', '#ff6a2a'],
    char: ['#1f1b24', '#2d2731', '#3d3540', '#524852', '#6a5e66'],
    flash: ['#e8461f', '#ff7a24', '#ffb050', '#ffe3a0', '#fffbea', '#ffffff'],
  },
  timeline: [
    { t: [0, .08], zh: '預備：半空 1.3 高處一點白光迅速收縮成針尖', en: 'anticipation: a point of white light 1.3 up in the air shrinks to a pinprick' },
    { t: [.08, .24], zh: '起爆（burst）：首 2 幀白熱閃光最大最亮、0.16 秒內收縮消失；波浪形衝擊環以 ease-out-expo 急衝後減速，越擴越細越淡', en: 'detonation (burst): the white-hot flash is biggest and brightest on the first 2 frames and collapses within 0.16 s; a wavy shock ring shoots out with ease-out-expo, thinning and fading as it slows' },
    { t: [.08, .45], zh: '膨脹：9 顆火球簇以 ease-out-expo 在約 0.1 秒內脹到七成、0.3 秒內成形，表面有淡黃熱點；4 條粗煙尾急射 1.65 後減速；紅色火帶繞火球捲一圈且越轉越慢，火星帶阻力與重力四散並拖出速度線', en: 'swell: a cluster of 9 fire balls reaches ~70% size within ~0.1 s (ease-out-expo) and is fully formed by 0.3 s, with pale yellow hot spots; 4 thick smoke jets shoot out 1.65 then slow; a red ribbon of flame wraps the ball and spins down, sparks fly out with drag and gravity, trailing speed streaks' },
    { t: [.4, 1.2], zh: '冷卻：每顆球按各自時間由亮橙 → 橙紅 → 暗紅受光 → 炭黑換色，煙尾末端最先變黑；火球懸停後才開始慢慢上浮', en: 'cooling: each ball steps bright orange, orange-red, dark with a red-lit side, then charcoal at its own time; the jet tips go dark first; the cloud hangs, then starts to rise slowly' },
    { t: [1.2, 2.35], zh: '消散：黑煙慢慢上浮（先加速後減速）、變大，以 Bayer 抖色淡出至全空', en: 'disperse: the black smoke rises (eases in and out), swells and dithers away to nothing' },
  ],
  layers: [
    { zh: '火球：9 顆粗糙實心球（半徑 0.36–0.52），整體縮放 0.25 → 1.2（ease-out-expo）之後再以指數趨近大 20%；6 顆小淡黃熱點球嵌在表面，起爆後 0.37 秒前熄滅', en: 'fireball: 9 rough solid balls (radius 0.36–0.52), overall scale 0.25 to 1.2 with ease-out-expo, then an exponential approach to +20%; 6 small pale yellow hot-spot balls embedded in the surface, gone by 0.37 s after the burst' },
    { zh: '煙尾：4 條，每條 10 顆互相重疊、由粗到細（0.36 → 0.18，每顆隨機 ±35%）的球沿方向排開，ease-out-expo 0.35 秒內伸出到 1.65，帶正弦彎曲與隨機起伏', en: 'smoke jets: 4 chains of 10 overlapping balls tapering from 0.36 to 0.18 (each ±35%), extending to 1.65 within 0.35 s with ease-out-expo, with a sine bend and random lumps' },
    { zh: '冷卻換色：熱度 1 → 0 對應 5 套色階（淡黃白熱、橙、暗紅受光、炭黑），每顆球隨機提早或延後 0.2 秒', en: 'cooling: heat 1 to 0 maps onto 5 ramps (white-hot, orange, dark red-lit, charcoal), each ball offset randomly by up to 0.2 s' },
    { zh: '閃光與衝擊環：白熱發光球＋鏡頭朝向的波浪圓環（10 個起伏），環半徑 0.75 → 1.85', en: 'flash and shock ring: a white-hot glow plus a camera-facing wavy ring with 10 bumps, ring radius 0.75 to 1.85' },
    { zh: '火帶與火星：1 條繞火球外側、由粗變細的橙紅螺旋火帶；18 粒火星初速 3–5.5、阻力 2.6、重力下墜，拖速度線；地面被火光照亮', en: 'ribbon and sparks: one tapering orange-red spiral ribbon around the ball; 18 sparks with launch speed 3–5.5, drag 2.6 and gravity, trailing speed streaks; firelight on the ground' },
  ],
  params: {
    blastSize: { zh: '爆炸大小', en: 'blast size', min: .6, max: 1.3, step: .05, value: 1 },
    altitude: { zh: '爆炸高度', en: 'burst height', min: .7, max: 1.6, step: .05, value: 1.3 },
    jets: { zh: '煙尾數量', en: 'smoke jets', min: 0, max: 8, step: 1, value: 4 },
    sparks: { zh: '火星數量', en: 'spark count', min: 0, max: 40, step: 1, value: 18 },
  },
  // dithered smoke ball; the 2D view has no dither, so there the puff stays opaque and shrinks instead
  puff(p, x, y, z, r, ramp, alpha, seed, o) {
    if (alpha <= .02) return;
    if (p.mode === '2d') { if (alpha < .2) return; p.ball(x, y, z, r * (.45 + .55 * Math.min(1, alpha * 1.25)), ramp, Object.assign({ rough: .3, shadow: false, seed }, o)); return; }
    // one shared dither offset: overlapping puffs keep their holes aligned, so no false depth edges light up inside the cloud
    p.ball(x, y, z, r, ramp, Object.assign({ rough: .35, alpha, seed: 1 }, o));
  },
  draw(p, t) {
    const P = this.palette, B = .08, BS = p.param('blastSize'), CZ = p.param('altitude');
    // anticipation: a point of light pinches in before the blast
    if (t < B) {
      const u = t / B;
      p.glow(0, 0, CZ, (.45 - .3 * u) * BS, P.flash, .7 + .5 * u, { pow: 1.6 });
      p.orb(0, 0, CZ, (.12 - .07 * p.easeInCubic(u)) * BS, P.flash, 1);
      p.light(0, 0, CZ, 1.6, P.hot, .4 + .4 * u);
      return;
    }
    const a = t - B;
    const rampFor = h => (h > .78 ? P.hot : h > .55 ? P.fire : h > .3 ? P.ember : P.char);
    // pop out fast (ease-out-expo), hang (exponential approach), then rise easing in and out
    const sc = ((.25 + .95 * p.easeOutExpo(a / .3)) * (1 + .2 * (1 - Math.exp(-1.4 * Math.max(0, a - .3))))) * BS;
    const rise = .4 * p.ease(p.ph(a, .35, 2.25)) * BS;
    const fade = k => 1 - p.smooth(1.1 + p.r(k, 9) * .35, 1.95 + p.r(k, 9) * .25, a);
    const heatAt = (k, t0) => 1 - p.smooth(t0 + p.r(k, 8) * .2, t0 + .55 + p.r(k, 8) * .2, a);
    // main body
    for (let k = 0; k < 9; k++) {
      const ang = k / 9 * p.TAU * 2.1 + p.r(k, 1), el = (p.r(k, 2) - .4) * 1.6, d = k === 0 ? 0 : .38 + p.r(k, 3) * .14;
      const x = Math.cos(ang) * Math.cos(el) * d * sc, y = Math.sin(ang) * Math.cos(el) * d * sc, z = CZ + Math.sin(el) * d * sc + rise;
      const r = (.36 + p.r(k, 4) * .16) * sc, h = heatAt(k, .22);
      this.puff(p, x, y, z, r, rampFor(h), fade(k), k, { shadow: fade(k) > .75 });
      if (k < 6 && a < .37) {
        const hs = 1 - p.easeInCubic(p.ph(a, .17, .37)), b = p.r(k, 5) * p.TAU;
        p.ball(x + Math.cos(b) * r * .62, y + Math.sin(b) * r * .62, z + r * .5, r * .32 * hs + .02, P.flash, { lit: .4, shadow: false });
      }
    }
    // smoke jets: shoot out fast, then slow down (ease-out-expo)
    const nJ = Math.round(p.param('jets'));
    const len = 1.65 * p.easeOutExpo(p.ph(a, 0, .35)) * BS;
    for (let j = 0; j < nJ; j++) {
      const az = j * (j < 4 ? p.TAU / 4 : 2.39996) + .5 + (p.r(j, 11) - .5) * .9, el = (p.r(j, 12) - .45) * .8;
      const dir = [Math.cos(az) * Math.cos(el), Math.sin(az) * Math.cos(el), Math.sin(el)];
      const lj = len * (.85 + .3 * p.r(j, 13));
      for (let s = 0; s < 10; s++) {
        const u = (s + 1) / 10, k = 20 + j * 10 + s, d = .25 * sc + lj * u;
        const wob = (p.r(k, 1) - .5) * .22 * u + Math.sin(u * 5 + j) * .12 * u;
        const x = dir[0] * d + wob, y = dir[1] * d - wob, z = Math.max(.1, CZ + dir[2] * d + rise * (1 + u) + (p.r(k, 2) - .5) * .15 * u + .15 * u * u * p.ease(p.ph(a, .35, 2)));
        const r = (.36 - .18 * u) * (.65 + .7 * p.r(k, 3)) * (1 + .4 * p.ease(p.ph(a, .3, 2.1))) * BS;
        const h = heatAt(k, .15 - .12 * u);
        this.puff(p, x, y, z, r, rampFor(h), fade(k), k, { shadow: u < .5 && fade(k) > .75 });
      }
    }
    // flash: biggest and brightest on the first frames, collapses fast
    const fl = Math.pow(1 - p.ph(a, 0, .16), 2);
    if (fl > .02) {
      p.glow(0, 0, CZ, (.7 + .5 * fl) * BS, P.flash, 1.6 * fl, { pow: 1.4 });
      p.orb(0, 0, CZ, .45 * BS * (.5 + .5 * fl), P.flash, fl);
    }
    // wavy shock ring: shoots out, slows, thins and fades
    const rk = p.ph(a, 0, .26);
    if (rk > 0 && rk < 1) {
      const R0 = (.75 + p.easeOutExpo(rk) * 1.1) * BS, w = .07 * Math.pow(1 - rk, 1.5) + .025;
      p.card(0, 0, CZ, 2 * R0 * 1.2, 2 * R0 * 1.2, (u, v) => {
        const rho = Math.hypot(u, v) * 1.2, ang = Math.atan2(v, u), rr = .9 + .07 * Math.sin(ang * 10 + rk * 4);
        return Math.abs(rho - rr) < w ? 1 : 0;
      }, P.flash, .95 * Math.pow(1 - rk, 1.5));
    }
    // red flame ribbon wrapping the ball: whips round, then spins down (drag)
    const rb = p.env(a, 0, .08, .42, .87);
    if (rb > 0) {
      const pts = [], R = .95 * sc, spin = p.drag(7, 3.2, a);
      for (let i = 0; i <= 26; i++) {
        const ang = -.6 + i / 26 * 4.8 + spin;
        pts.push([Math.cos(ang) * R * (1 + .12 * Math.sin(ang * 3)), Math.sin(ang) * R * .55, CZ + rise + Math.sin(ang * 1.5) * R * .45]);
      }
      p.trail(pts, .15 * BS, .03, P.hot, rb, .4 * rb);
    }
    // sparks: fast out, drag, gravity, with a speed streak
    const nS = Math.round(p.param('sparks') * p.density), K = 2.6;
    for (let s = 0; s < nS; s++) {
      const life = .55 + p.r(s, 31) * .6, as = a - .02;
      if (as <= 0 || as > life) continue;
      const az = p.r(s, 32) * p.TAU, el = (p.r(s, 33) - .3) * 1.4, sp = (3 + p.r(s, 34) * 2.5) * Math.sqrt(BS);
      const dx = Math.cos(az) * Math.cos(el), dy = Math.sin(az) * Math.cos(el), dz = Math.sin(el);
      const pos = tt => { const d = p.drag(sp, K, tt); return [dx * d, dy * d, CZ + dz * d - 1.6 * tt * tt]; };
      const q = pos(as), q0 = pos(Math.max(0, as - .05));
      if (q[2] < 0) continue;
      const u = as / life;
      p.line(q, q0, .05, P.hot, 1 - u * .6, { i1: .25 });
      p.dot(q[0], q[1], q[2], P.flash, 1 - u * .5, s % 3 === 0 ? 2 : 1);
    }
    // firelight on the ground
    const heat = 1 - p.smooth(.07, .82, a);
    p.light(0, 0, CZ, 2.4 * BS, P.hot, Math.max(fl * 1.2, heat * .75));
  },
});
