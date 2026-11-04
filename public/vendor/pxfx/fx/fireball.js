// 熾焰火球 / Blazing Fireball — pixel version of 00GameDevs "fireball" (MIT)
PXFX.define({
  id: 'fireball',
  loop: 3.2,
  beats: [{ t: .25, kind: 'cast', power: .7 }, { t: 1.7, kind: 'hit', power: 1 }],
  view: { r: 3.1, h: 2.4 },
  stage: { ground: 'stone', tiles: true },
  palette: {
    fire: ['#a32a1c', '#d8471f', '#ff823e', '#ffb45e', '#ffe39a', '#fffbe8'],
    smoke: ['#3a3340', '#524850', '#6c6064', '#877a78', '#a0928a'],
    stone: ['#4a4552', '#625c69', '#7b7480', '#958d96', '#aea6ab'],
  },
  timeline: [
    { t: [0, .25], zh: '蓄力：火球先脹大再一下收細', en: 'charge: the ball swells, then snaps smaller' },
    { t: [.25, 1.7], zh: '發射：起步一下急衝，之後越飛越快撞向石柱，速度越快火尾越長，沿途掉火星', en: 'launch: a quick kick, then accelerates into the pillar; the tail lengthens with speed, embers drop' },
    { t: [1.7, 1.85], zh: '命中：白熱閃光＋星芒', en: 'impact: white-hot flash with star rays' },
    { t: [1.71, 2.4], zh: '弧環急速彈出再減速、火星先快後慢（阻力）並受重力下墜、碎石彈起落地', en: 'arc ring shoots out then drifts, sparks fly fast then slow (drag) and fall, rocks bounce' },
    { t: [2, 3.2], zh: '煙團上升變淡，地面留下漸暗焦痕', en: 'smoke puffs rise and thin out, scorch cracks fade on the ground' },
  ],
  layers: [
    { zh: '核心：白熱火球（orb），外層橙色光暈，每 2 幀輕微抖動', en: 'core: white-hot orb inside an orange halo, jitters slightly every 2 frames' },
    { zh: '火尾：12 節逐漸縮小的光團，帶噪聲擺動，尾端轉深紅', en: 'tail: 12 shrinking glow blobs with noisy sway, tip fades to deep red' },
    { zh: '火舌：3 條向後彎的細線，長度閃爍', en: 'flame licks: 3 thin lines curling backwards, flickering length' },
    { zh: '命中閃光：大光暈＋8 道星芒線，0.15 秒內收縮', en: 'impact flash: big halo plus 8 star-ray lines, collapses within 0.15 s' },
    { zh: '弧環：垂直於飛行方向的光環，擴張時變細', en: 'arc ring: a ring facing the flight direction, thins as it grows' },
    { zh: '火星：20 粒帶重力的短線，碎石：8 塊低多邊形岩石', en: 'sparks: 20 gravity streaks; debris: 8 low-poly rocks' },
    { zh: '煙：6 團抖色透明的煙球，上升時用 Bayer 抖色淡出', en: 'smoke: 6 puffs that rise and fade out with Bayer-dither transparency' },
    { zh: '地面：火光照亮地面，命中後留下發紅裂紋貼花', en: 'ground: firelight pools on the ground, glowing crack decal after impact' },
  ],
  params: {
    tailLength: { zh: '火尾長度', en: 'tail length', min: .4, max: 2, step: .1, value: 1 },
    sparks: { zh: '火星數量', en: 'spark count', min: 0, max: 48, step: 1, value: 22 },
    debris: { zh: '碎石數量', en: 'debris count', min: 0, max: 20, step: 1, value: 8 },
    ringSize: { zh: '弧環大小', en: 'arc ring size', min: .5, max: 2, step: .1, value: 1 },
  },
  draw(p, t) {
    const F = this.palette.fire, SM = this.palette.smoke, ST = this.palette.stone;
    const HIT = 1.7, hx = 2.05, hz = 1.0, X0 = -2.7, tail = p.param('tailLength');
    p.pillar(2.55, 0, .7, 2.1, ST);

    if (t < HIT) {
      // charge for 0.25 s (the ball swells, then snaps smaller), then launch: a kick, then accelerate into the pillar
      const charge = p.ph(t, 0, .25), fly = p.ph(t, .25, HIT);
      const k = .12 * p.easeOutCubic(fly / .18) + .88 * p.easeInCubic(fly);
      const x = p.lerp(X0, hx, k), z = hz + Math.sin(t * 7) * .04, speed = .12 / .18 * (fly < .18 ? 1 : 0) + 2.6 * fly * fly;
      const swell = charge < 1 ? 1 + .55 * Math.sin(charge * Math.PI) : 1;
      const jit = (Math.floor(t * 15) % 2) * .03;
      const stretch = Math.min(1, t * 3) * (.75 + speed * .35) * tail;      // the tail lengthens with speed
      for (let s = 12; s >= 1; s--) {
        const back = s * .15 * stretch;
        const sway = (p.noise(s * .7, t * 6) - .5) * .22 * s / 12;
        p.glow(x - back, sway * .6, z + sway, (.42 - s * .025) * swell, F, .95 - s * .065);
      }
      for (let f = 0; f < 3; f++) {
        const len = (.7 + Math.sin(t * 19 + f * 2.1) * .2) * (.6 + speed * .3) * tail, a = (f - 1) * .5;
        p.line([x - .15, 0, z + a * .2], [x - .15 - len, Math.sin(a) * .25, z + a * .35 + .1], .16, F, .75, { w1: .02, i1: .15 });
      }
      p.glow(x, 0, z, (.62 + jit) * swell, F, .7);
      p.orb(x, 0, z, .22 * swell, F, 1);
      const embers = Math.round(8 * p.density);
      for (let e = 0; e < embers; e++) {
        const age = (t * 2.2 + p.r(e, 1)) % 1, ex = x - .3 - p.drag(2.2, 2.5, age) - p.r(e, 2) * .3;
        p.dot(ex, (p.r(e, 3) - .5) * .5, z - age * age * .9 + (p.r(e, 4) - .5) * .3, F, .7 * (1 - age));
      }
      p.light(x, 0, z, 1.6, F, .75);
      return;
    }

    const a = t - HIT;
    // flash and star rays: biggest on the first frames, collapse fast
    const fl = Math.pow(1 - p.ph(a, 0, .18), 2);
    if (fl > 0) {
      p.glow(hx, 0, hz, .5 + fl * .8, F, 1.5 * fl, { pow: 1.4 });
      for (let r = 0; r < 8; r++) {
        const ang = r / 8 * p.TAU + .3, len = (1.1 + p.r(r, 9) * 1.1) * (.3 + fl);
        p.line([hx, 0, hz], [hx - .2, Math.cos(ang) * len, hz + Math.sin(ang) * len], .12, F, 1.2 * fl, { w1: .01, i1: .35 });
      }
    }
    // arc ring facing the flight direction: shoots out, then drifts
    const rk = p.ph(a, .01, .55), rs = p.param('ringSize');
    if (rk > 0 && rk < 1) p.ring(hx - .25, 0, hz, (.3 + p.easeOutExpo(rk) * 1.5) * rs, .16 * Math.pow(1 - rk, 1.5) + .03, F, 1 - rk * .8, { axis: [1, 0, 0], fn: ang => .55 + .45 * Math.cos(ang * 3 + 1) });
    // sparks: fast out, drag, gravity
    const nS = Math.round(p.param('sparks') * p.density);
    for (let s = 0; s < nS; s++) {
      const life = .35 + p.r(s, 1) * .45, u = a / life;
      if (u <= 0 || u >= 1) continue;
      const ang = p.r(s, 2) * p.TAU, sp = 4 + p.r(s, 3) * 4;
      const dx = -(.5 + p.r(s, 4)), dy = Math.cos(ang) * .8, dz = Math.sin(ang) * .8 + .4;
      const d = p.drag(sp, 5, a), dPrev = p.drag(sp, 5, Math.max(0, a - .05));
      const x = hx + dx * d, y = dy * d, z = hz + dz * d - 3 * a * a;
      const xp = hx + dx * dPrev, yp = dy * dPrev, zp = hz + dz * dPrev - 3 * (a - .05) * (a - .05);
      if (z < 0) continue;
      p.line([x, y, z], [xp, yp, zp], .05, F, 1 - u * .7);
    }
    // debris rocks with one bounce
    const nD = Math.round(p.param('debris') * p.density);
    for (let d = 0; d < nD; d++) {
      const vx = -.6 - p.r(d, 11) * 1.4, vy = (p.r(d, 12) - .5) * 2.4, vz = 1.2 + p.r(d, 13) * 1.6, g = 6;
      let tt = a, x = hx + vx * tt, y = vy * tt, z = hz + vz * tt - g * tt * tt * .5;
      const land = (vz + Math.sqrt(vz * vz + 2 * g * hz)) / g;
      if (tt > land) { const b = tt - land; x = hx + vx * land + vx * .4 * b; y = vy * land + vy * .4 * b; z = Math.max(0, vz * .3 * b - g * b * b * .5); }
      if (a > 1.25) continue;
      p.rock(x, y, z + .06, .07 + p.r(d, 14) * .06, ST, d);
    }
    // smoke: puffs out fast, then hangs and rises slowly
    for (let s = 0; s < 6; s++) {
      const u = p.ph(a, .06 + s * .04, 1.3 + s * .05);
      if (u <= 0 || u >= 1) continue;
      const ang = s / 6 * p.TAU, out = p.easeOutExpo(u);
      p.ball(hx - .3 + Math.cos(ang) * .35 * (1 + out), Math.sin(ang) * .5 * (1 + out), hz + .1 + u * u * 1.1 + Math.sin(ang) * .2,
        .22 + out * .3, SM, { alpha: 1 - u * u, rough: .5, shadow: false, seed: s });
    }
    // fireball embers left on the impact face, then scorch cracks
    const heat = 1 - p.ph(a, .1, 1.45);
    p.glow(hx + .1, 0, hz, .7, F, .9 * heat * heat);
    p.decal(2.1, 0, 0, 1.1, (x, y, rho, ang) => {
      const crack = Math.abs(Math.sin(ang * 5 + p.noise(rho * 4, ang) * 2.4));
      return crack < .14 && rho > .12 ? (1 - rho / 1.1) * .9 : rho < .35 ? .35 * (1 - rho / .35) : 0;
    }, F, heat * .8);
    p.light(hx, 0, hz, 2.2, F, .9 * Math.max(fl, heat * .7));
  },
});
