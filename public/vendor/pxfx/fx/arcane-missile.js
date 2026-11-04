// 符晶飛彈 / Runic Crystal Missiles — pixel version of 00GameDevs "arcane-missile" (MIT)
PXFX.define({
  id: 'arcane-missile',
  loop: 3.2,
  beats: [{ t: .25, kind: 'cast', power: .6 }, { t: 1.5, kind: 'hit', power: 1 }],
  view: { r: 3.1, h: 2.4 },
  stage: { ground: 'void', tiles: true },
  palette: {
    arcane: ['#6a46b8', '#8e62dc', '#c99aff', '#dfc2ff', '#f4e8ff', '#ffffff'],
    crystal: ['#3e2a6e', '#5e40a0', '#8a66d0', '#b88cf4', '#e6d2ff'],
    stone: ['#4a4560', '#635c7c', '#7d7696', '#9890ae', '#b4adc6'],
  },
  timeline: [
    { t: [0, .25], zh: '聚集：三顆紫水晶擠在起點緊密繞圈，越轉越快，並向後退 0.12 蓄力', en: 'gather: three violet crystals huddle at the start in a tight spin that keeps speeding up, drawing back 0.12' },
    { t: [.25, .47], zh: '發射：三晶一下彈開成半徑 0.28 的螺旋（超出約 20% 再回彈），起步一下急衝', en: 'release: the crystals spring apart into a helix of radius 0.28 (about 20% overshoot) with a quick forward kick' },
    { t: [.47, 1.5], zh: '三晶互相繞圈前進，以 ease-in 越飛越快、繞圈也越轉越快（每秒約 1 → 4 圈）；光點螺旋尾隨速度拉長，沿途掉落彈出的小符文', en: 'the crystals orbit each other while accelerating with ease-in, the orbit also speeds up (about 1 to 4 turns/s); the dotted helix trails stretch with speed, small runes pop out along the way' },
    { t: [1.35, 1.5], zh: '最後 0.15 秒三晶收攏到同一接觸點', en: 'in the last 0.15 s the three converge on one contact point' },
    { t: [1.5, 2.6], zh: '命中：首兩幀最大的紫白閃光，光環 ease-out-expo 急衝後減速變細；7 個方塊符文彈出放大、急速向外飛散後減速漂浮、閃爍並急縮消失；火花受阻力減速；螺旋尾由後往前消失', en: 'hit: violet-white flash biggest on the first two frames, a ring shoots out with ease-out-expo, slowing and thinning; 7 blocky runes pop up, fly out fast then hover, blink and shrink away; sparks slow with drag; trails vanish tail-first' },
  ],
  layers: [
    { zh: '水晶：3 顆實心紫色雙錐（長 0.32、寬 0.15），尖端朝向螺旋切線，尖端一個白色四角星', en: 'crystals: 3 solid violet bipyramids (0.32 x 0.15) pointing along the helix tangent, white four-point sparkle at each tip' },
    { zh: '螺旋尾：每顆 18 節、長約 0.7 秒軌跡的細光線，前亮後暗，加速時自然拉長；上面散佈每 2 幀換位的白色光點', en: 'helix trails: 18-segment thin lines covering the last 0.7 s of each path, bright to dim, stretching naturally as they accelerate; sprinkled with white dots that reshuffle every 2 frames' },
    { zh: '符文：5×5 方塊字形卡片（約 0.2 大小），飛行時從尾跡彈出上浮，命中時一次爆出 7 個', en: 'runes: 5x5 blocky glyph cards (about 0.2), popping out of the trails and floating up in flight, 7 burst out at the hit' },
    { zh: '命中火花：10 條紫白短光痕，高速射出後受阻力減速', en: 'impact sparks: 10 short violet-white streaks, fast out then slowed by drag' },
    { zh: '地面：紫光跟隨彈群，命中處留下淡出的光圈', en: 'ground: violet light follows the swarm, a fading glow pool at the hit' },
  ],
  params: {
    missiles: { zh: '飛彈數量', en: 'missile count', min: 1, max: 6, step: 1, value: 3 },
    helixRadius: { zh: '螺旋半徑', en: 'helix radius', min: .1, max: .5, step: .02, value: .28 },
    orbitSpeed: { zh: '繞圈速度', en: 'orbit speed', min: .3, max: 2, step: .1, value: 1 },
    runes: { zh: '命中符文數量', en: 'impact runes', min: 0, max: 14, step: 1, value: 7 },
  },
  draw(p, t) {
    const A = this.palette.arcane, CR = this.palette.crystal, ST = this.palette.stone;
    const CAST = .25, HIT = 1.5, hx = 2.18, hz = 1.0, X0 = -2.6, XB = X0 - .12;
    const n = Math.round(p.param('missiles')), R0 = p.param('helixRadius'), os = p.param('orbitSpeed');
    p.pillar(2.55, 0, .7, 2.1, ST);

    // launch kick, then accelerate into the target
    const travel = f => .12 * p.easeOutCubic(f / .16) + .88 * Math.pow(p.clamp(f, 0, 1), 2.5);
    // helix position of missile i at time tau: the orbit speeds up with the flight
    const pos = (i, tau) => {
      tau = Math.max(0, Math.min(HIT, tau));
      const k = travel(p.ph(tau, CAST, HIT));
      const x = tau < CAST ? p.lerp(X0, XB, p.easeOutCubic(tau / CAST)) : p.lerp(XB, hx, k);
      const ang = os * (5 * tau + 10 * k + 4 * p.easeInCubic(Math.min(1, tau / CAST))) + i / n * p.TAU;
      const open = tau < CAST ? .3 * p.easeOutCubic(tau / CAST) : .3 + .7 * p.easeOutBack(p.ph(tau, CAST, CAST + .22), 2.8);
      const rad = R0 * open * (1 - p.easeIn(p.ph(tau, HIT - .15, HIT)));
      return [x, Math.cos(ang) * rad, hz + Math.sin(ang) * rad];
    };
    const tc = Math.min(t, HIT), fade = t < HIT ? 1 : 1 - p.ph(t, HIT, HIT + .5), fseed = Math.floor(t * 10);

    // trails (clipped at the tail end after the hit)
    for (let i = 0; i < n; i++) {
      const pts = [], tail = t > HIT ? (t - HIT) * 1.2 : 0;
      for (let k = 0; k <= 18; k++) {
        const tau = tc - k * .04 * (1 - tail / .7);
        if (tau < 0 || tail >= .7) break;
        pts.push(pos(i, tau));
      }
      if (pts.length > 1) {
        p.trail(pts, .07, .03, A, 1 * fade, .2 * fade);
        for (let k = 1; k < pts.length; k++) {
          if (p.r(k * 3 + i, fseed) < .45) continue;
          const q = pts[k], j = (p.r(k + i * 7, fseed + 2) - .5) * .14;
          p.dot(q[0], q[1] + j, q[2] - j, A, (1.2 - k / 20) * fade);
        }
      }
    }
    // runes shed during flight: pop out with overshoot, float up, shrink away
    if (t < HIT) {
      for (let r = 0; r < 4; r++) {
        const born = .35 + r * .27, u = (t - born) / .5;
        if (u <= 0 || u >= 1) continue;
        const q = pos(r % n, born), sz = .18 * p.easeOutBack(Math.min(1, u / .25), 2.5) * (1 - p.easeInCubic(p.ph(u, .7, 1)));
        if (sz < .02) continue;
        p.card(q[0], q[1], q[2] + p.easeOutCubic(u) * .25, sz, sz, (a, b) => p.rune(a * .5 + .5, b * .5 + .5, r + 3), A, .85);
      }
    }
    // crystals
    if (t < HIT) {
      for (let i = 0; i < n; i++) {
        const q = pos(i, t), q2 = pos(i, t - .03);
        const dir = [q[0] - q2[0] + 1e-3, q[1] - q2[1], q[2] - q2[2]];
        p.shard(q[0], q[1], q[2], .32, .15, dir, CR, { back: .6, spin: t * 6 + i, shadow: i === 0 });
        p.sparkle(q[0] + .14, q[1], q[2], 1, A, 1);
      }
      const c = pos(0, t), gather = t < CAST ? p.easeInCubic(t / CAST) : 0;
      if (gather > 0) p.glow(c[0], 0, hz, .2 + .2 * gather, A, .5 + .6 * gather);
      p.light(c[0], 0, hz, 1.4, A, .6);
      return;
    }

    const a = t - HIT;
    // flash: biggest on the first frames, collapses fast
    const fl = Math.pow(1 - p.ph(a, 0, .15), 3);
    if (fl > 0) p.glow(hx - .05, 0, hz, .3 + .5 * fl, A, 1.7 * fl, { pow: 1.2 });
    // ring: shoots out, slows, thins
    const rk = p.ph(a, 0, .45);
    if (rk > 0 && rk < 1) p.ring(hx - .15, 0, hz, .15 + p.easeOutExpo(rk) * .75, .08 * Math.pow(1 - rk, 1.5) + .02, A, 1.1 * (1 - rk), { axis: [1, 0, 0] });
    // rune burst: pop up, fly out fast, hover, blink, shrink away
    const nR = Math.round(p.param('runes') * p.density);
    for (let r = 0; r < nR; r++) {
      const t0 = .01 + (r % 7) * .02, u = p.ph(a, t0, .85 + (r % 7) * .04);
      if (u <= 0 || u >= 1) continue;
      const ang = r * 2.39996 + .4, sp = .7 + p.r(r, 41) * .5, e = p.easeOutExpo(u);
      const x = hx - .2 - e * (.3 + p.r(r, 42) * .4), y = Math.cos(ang) * e * sp, z = hz + Math.sin(ang) * e * sp * .8 + u * u * .3;
      const blink = (Math.floor(t * 12) + r) % 4 === 0 ? .5 : 1;
      const sz = .22 * p.easeOutBack(p.ph(a, t0, t0 + .12), 2.5) * (1 - p.easeInCubic(p.ph(u, .75, 1)));
      if (sz < .02) continue;
      p.card(x, y, z, sz, sz, (a2, b2) => p.rune(a2 * .5 + .5, b2 * .5 + .5, r + 11), A, blink);
      p.dot(x, y, z - .16, A, .6 * (1 - u));
    }
    // sparks: fast out, drag
    const nS = Math.round(10 * p.density);
    for (let s = 0; s < nS; s++) {
      const lf = .3 + p.r(s, 51) * .3, u = a / lf;
      if (u <= 0 || u >= 1) continue;
      const ang = p.r(s, 52) * p.TAU, sp = 4 + p.r(s, 53) * 3, dx = -(.3 + p.r(s, 54) * .7);
      const at = tt => { const d = p.drag(sp, 6, tt); return [hx - .1 + dx * d, Math.cos(ang) * d, hz + Math.sin(ang) * d * .8]; };
      p.line(at(a), at(Math.max(0, a - .04)), .04, A, 1.1 * (1 - u));
    }
    const heat = 1 - p.ph(a, 0, .9);
    p.light(hx, 0, hz, 1.8, A, .9 * Math.max(fl, heat * heat * .8));
  },
});
