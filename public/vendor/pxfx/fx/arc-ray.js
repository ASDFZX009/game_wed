// 分岔雷流 / Forked Lightning Stream — pixel version of 00GameDevs "arc-ray" (MIT)
PXFX.define({
  id: 'arc-ray',
  loop: 3.6,
  beats: [
    { t: .28, kind: 'cast', power: .6 }, { t: .42, kind: 'hit', power: .9 },
    { t: 1.1, kind: 'pulse', power: .6 }, { t: 1.75, kind: 'pulse', power: .7 }, { t: 2.4, kind: 'pulse', power: .8 },
  ],
  view: { r: 3.1, h: 2.2 },
  stage: { ground: 'slate', tiles: true },
  palette: {
    arc: ['#4a3fc0', '#2f5ee6', '#2878ff', '#62a8ff', '#b4dcff', '#f4faff'],
    crystal: ['#2a3477', '#3550a8', '#4a7ed8', '#7fb6f4', '#c8e8ff'],
    stone: ['#3e4150', '#545868', '#6a6e7e', '#838796', '#9fa2ae'],
  },
  timeline: [
    { t: [0, .28], zh: '充電：水晶光暈先脹大，6 粒電光被加速吸入，發射前一刻光暈急縮成一點', en: 'charge: the crystal glow swells while 6 sparks are sucked in, accelerating; just before firing it snaps down to a point' },
    { t: [.28, .42], zh: '發射：主電弧由水晶射出，越伸越快，0.14 秒內撞上木人', en: 'fire: the main bolt leaves the crystal and accelerates, striking the dummy within 0.14 s' },
    { t: [.42, .9], zh: '命中：首兩幀最大的白熱閃光＋6 道星芒迅速收縮；光環急速擴張後減速變細；火花高速彈出再被阻力拖慢並下墜', en: 'impact: the biggest white-hot flash and 6 star rays on the first two frames, collapsing fast; a ring shoots out, slows and thins; sparks burst out fast, drag slows them, gravity pulls them down' },
    { t: [.42, 2.8], zh: '持續：主電弧每 0.07 秒重新分岔；1.1、1.75、2.4 秒各一次電湧，電弧瞬間變粗變亮、旁支全亮、命中點彈出小光環，之後慢慢回落', en: 'sustain: the main bolt re-forks every 0.07 s; surges at 1.1, 1.75 and 2.4 s make it thicken and flare instantly, light every side arc and pop a small ring at the hit, then ease back down' },
    { t: [2.8, 3.1], zh: '停止：電弧尾端由左向右加速收回木人，水晶熄滅', en: 'stop: the bolt tail retracts left to right, accelerating into the dummy; the crystal goes dark' },
    { t: [3.1, 3.6], zh: '命中耀光急縮熄滅，畫面清空', en: 'the hit flare collapses quickly, frame empty' },
  ],
  layers: [
    { zh: '主電弧：寬 2 像素的鋸齒閃電（5 層細分），外圍淡藍光暈，沿線有 3 條短分岔；電湧時寬度約 1.8 倍', en: 'main bolt: 2 px jagged lightning (5 subdivisions) with a pale blue halo and 3 short forks; about 1.8x wider during a surge' },
    { zh: '副電弧：4 條 1 像素細電弧，隨機出現及消失，起伏比主電弧大', en: 'side arcs: 4 thin 1 px arcs that pop in and out, more jagged than the main bolt' },
    { zh: '端點耀光：兩端白熱光點＋光暈，命中端射出 3 條上下方向的短電刺', en: 'end flares: white-hot dot plus halo at both ends, 3 short spikes up and down at the hit end' },
    { zh: '命中光環：面向電弧方向的圓環，半徑 0.2→1.2，ease-out-expo，越擴越細', en: 'impact ring: a ring facing along the bolt, radius 0.2→1.2 with ease-out-expo, thinning as it grows' },
    { zh: '火花：命中時一次噴出 14 條，之後每秒持續彈出；藍白短線，長度隨速度拉長，阻力減速＋重力', en: 'sparks: a burst of 14 at the hit, then a steady trickle; blue-white streaks stretched by speed, slowed by drag, pulled by gravity' },
    { zh: '道具：左邊石座上的藍水晶（施放源），右邊木人（目標）', en: 'props: blue crystal on a stone pedestal at the left (source), training dummy at the right (target)' },
    { zh: '地面：沿電弧的冷藍光照，兩端最亮，電湧時更亮', en: 'ground: cold blue light along the bolt, brightest at both ends and during surges' },
  ],
  params: {
    boltWidth: { zh: '電弧粗細', en: 'bolt width', min: .5, max: 2.5, step: .1, value: 1 },
    forks: { zh: '分岔數量', en: 'fork count', min: 0, max: 8, step: 1, value: 3 },
    sideArcs: { zh: '副電弧數量', en: 'side arcs', min: 0, max: 8, step: 1, value: 4 },
    sparks: { zh: '火花數量', en: 'spark count', min: 0, max: 40, step: 1, value: 14 },
  },
  draw(p, t) {
    const C = this.palette.arc, CR = this.palette.crystal, ST = this.palette.stone;
    const A = [-2.4, 0, 1.4], B = [2.12, 0, 1.0];
    const FIRE = .28, HIT = .42, STOP = 2.8, END = 3.1, SURGES = [1.1, 1.75, 2.4];
    const bw = p.param('boltWidth'), nFork = p.param('forks'), nSide = p.param('sideArcs');
    // props
    p.box(-2.68, -.24, 0, -2.12, .24, .5, ST);
    p.box(-2.6, -.16, .5, -2.2, .16, .62, ST);
    p.shard(-2.4, 0, .98, .62, .24, [0, 0, 1], CR, { sides: 4, spin: .4, back: .4, lit: .1 });
    p.dummy(2.42, 0);

    // surges: sharp attack, slow decay
    let surge = 0;
    for (const ts of SURGES) { const d = t - ts; if (d >= 0 && d < .5) surge = Math.max(surge, Math.pow(1 - d / .5, 3)); }
    const head = p.easeIn(p.ph(t, FIRE, HIT));                     // front of the bolt accelerates into the target
    const tail = p.easeInCubic(p.ph(t, STOP, END));                // the tail retracts faster and faster
    const live = t >= FIRE && head > tail + .02;
    const seed = Math.floor(t * 14);
    const P = u => [p.lerp(A[0], B[0], u), 0, p.lerp(A[2], B[2], u)];

    // charge: the glow swells while sparks are pulled in, then snaps small just before the release
    if (t < FIRE) {
      const c = t / FIRE, swell = c < .7 ? p.easeOutCubic(c / .7) : 1 - p.easeInCubic((c - .7) / .3) * .85;
      p.glow(A[0], 0, A[2], .12 + .3 * swell, C, .5 + .5 * swell);
      p.orb(A[0], 0, A[2], .03 + .05 * swell, C, 1);
      p.sparkle(A[0], 0, A[2], Math.round(1 + 3 * swell), C, .6 + .5 * swell);
      const nM = Math.round(6 * p.density);
      for (let m = 0; m < nM; m++) {
        const u = p.ph(c, p.r(m, 41) * .35, .95), ang = p.r(m, 42) * p.TAU, d = .7 * (1 - p.easeInCubic(u));
        if (u <= 0 || u >= 1) continue;
        const q = [A[0] + Math.cos(ang) * d * .5, Math.sin(ang) * d, A[2] + Math.sin(ang) * d * .6];
        p.line(q, [q[0] + Math.cos(ang) * .1 * (.3 + u), q[1] + Math.sin(ang) * .15 * (.3 + u), q[2] + Math.sin(ang) * .1 * (.3 + u)], .03, C, .9);
      }
      p.light(A[0], 0, .5, 1.1, C, .5 + .4 * swell);
    }
    // source crystal glow while firing
    const srcOn = t >= FIRE ? 1 - p.easeInCubic(p.ph(t, STOP, STOP + .2)) : 0;
    if (srcOn > 0) {
      const kick = Math.pow(1 - p.ph(t, FIRE, FIRE + .15), 2);
      p.glow(A[0], 0, A[2], .2 + (seed % 2) * .04 + kick * .3 + surge * .12, C, (.6 + kick * .6 + surge * .3) * srcOn);
      p.orb(A[0], 0, A[2], .05, C, srcOn);
      p.light(A[0], 0, .5, 1.3, C, (.7 + .3 * surge) * srcOn);
    }
    const a = t - HIT;                                              // time since the bolt struck
    const strike = a >= 0 ? Math.pow(1 - p.ph(a, 0, .12), 2) : 0;  // biggest on the first frames
    if (live) {
      const s0 = P(tail), s1 = P(head), boost = 1 + surge * .8 + strike * .7;
      const path = p.bolt(s0, s1, C, { seed, jag: .2, depth: 5, w: .06 * bw * boost, I: 1.15 + surge * .3, glow: .3 + surge * .15 });
      // short forks off the main bolt
      for (let k = 0; k < nFork; k++) {
        if (p.r(seed * 3 + k, 8) < .3 - surge * .3) continue;
        const from = path[Math.floor((.15 + p.r(seed * 3 + k, 9) * .7) * (path.length - 1))];
        const len = (.25 + p.r(seed * 3 + k, 10) * .35) * (1 + surge * .4), up = p.r(seed * 3 + k, 11) < .5 ? 1 : -1;
        p.bolt(from, [from[0] + len * .8, (p.r(seed * 3 + k, 12) - .5) * len, from[2] + up * len * .6], C, { seed: seed * 9 + k + 31, jag: .35, depth: 3, w: .025 * Math.sqrt(bw), I: .8, glow: 0 });
      }
      // thin side arcs: some pop in each re-fork, all of them during a surge
      for (let k = 0; k < nSide; k++) {
        if (p.r(seed * 5 + k, 3) < .35 - surge * .5) continue;
        const off = (p.r(seed * 5 + k, 4) - .5) * (.3 + k * .03);
        const a2 = [s0[0], off * .5, s0[2] + off * .4], b2 = [s1[0], -off * .5, s1[2] - off * .3];
        p.bolt(a2, b2, C, { seed: seed * 13 + k * 7 + 3, jag: .3, depth: 4, w: .02 * Math.sqrt(bw), I: .6 + surge * .3, glow: 0 });
      }
      p.glow(s1[0], 0, s1[2], .22, C, .8);                          // travelling / retracting front
      for (let k = 0; k < 7; k++) p.light(p.lerp(s0[0], s1[0], (k + .5) / 7), 0, .6, .9, C, .36 + surge * .2);
    }
    // hit flare: from the strike until the bolt is gone, then a fast collapse
    const hitOn = a >= 0 ? 1 - p.easeInCubic(p.ph(t, END - .05, END + .25)) : 0;
    if (hitOn > 0) {
      p.glow(B[0], 0, B[2], (.48 + strike * .5 + surge * .2) * (.4 + .6 * hitOn), C, (.85 + strike * .8 + surge * .3) * hitOn);
      p.orb(B[0], 0, B[2], .09 + strike * .08, C, hitOn);
      if (strike > 0) for (let r = 0; r < 6; r++) {                 // star rays, gone within 0.12 s
        const ang = r / 6 * p.TAU + .4, len = (.8 + p.r(r, 19) * .7) * (.35 + strike);
        p.line([B[0], 0, B[2]], [B[0] - .15, Math.cos(ang) * len, B[2] + Math.sin(ang) * len], .1, C, 1.3 * strike, { w1: .01, i1: .3 });
      }
      for (let k = 0; k < 3; k++) {
        const ang = Math.PI / 2 + (p.r(seed + k, 21) - .5) * 1.4 + (k === 2 ? Math.PI : 0);
        const len = (.28 + p.r(seed + k, 22) * .3) * (1 + surge * .6);
        p.bolt([B[0], 0, B[2]], [B[0] - .1, Math.cos(ang) * len * .4, B[2] + Math.sin(ang) * len], C, { seed: seed * 3 + k + 50, jag: .3, depth: 3, w: .02, I: .9 * hitOn, glow: 0 });
      }
      p.light(B[0], 0, .6, 1.4 + strike * .6, C, (.75 + strike * .4 + surge * .25) * hitOn);
    }
    // impact ring on the strike, small rings on each surge: shoot out, slow down, thin out
    const rings = [[HIT, 1.0, 1]].concat(SURGES.map(s => [s, .55, .7]));
    for (const [t0, size, I] of rings) {
      const u = p.ph(t, t0, t0 + .45);
      if (t < t0 || u >= 1) continue;
      p.ring(B[0] - .15, 0, B[2], .15 + p.easeOutExpo(u) * size, .12 * Math.pow(1 - u, 1.5) + .02, C, I * (1 - u), { axis: [1, 0, 0] });
    }
    // sparks: a burst at the strike, then a trickle while the bolt holds; fast out, drag, gravity
    const nS = Math.round(p.param('sparks') * p.density);
    const spark = (x0, vx, vy, vz, age, life, I) => {
      const u = age / life;
      if (u <= 0 || u >= 1) return;
      const d = p.drag(1, 6, age), dp = p.drag(1, 6, Math.max(0, age - .04));
      const x = x0 + vx * d, y = vy * d, z = B[2] + vz * d - 3 * age * age;
      if (z < 0) return;
      p.line([x, y, z], [x0 + vx * dp, vy * dp, B[2] + vz * dp - 3 * (age - .04) * (age - .04)], .04, C, I * (1 - u));
    };
    if (a >= 0) for (let s = 0; s < nS; s++) {
      const ang = p.r(s, 3) * p.TAU, sp = 4 + p.r(s, 4) * 5;
      spark(B[0] - .1, -sp * (.4 + p.r(s, 5) * .6), Math.cos(ang) * sp * .6, Math.sin(ang) * sp * .6 + 1, a, .3 + p.r(s, 1) * .35, 1);
    }
    if (a > .05 && t < STOP + .2) for (let s = 0; s < Math.ceil(nS * .6); s++) {
      const life = .3 + p.r(s, 11) * .25, cyc = (a - .05) / life + p.r(s, 12), k = Math.floor(cyc), sd = s * 17 + k;
      const ang = p.r(sd, 13) * p.TAU, sp = 2.5 + p.r(sd, 14) * 3;
      spark(B[0] - .1, -sp * (.4 + p.r(sd, 15) * .6), Math.cos(ang) * sp * .5, Math.sin(ang) * sp * .5 + .8, (cyc - k) * life, life, .85);
    }
  },
});
