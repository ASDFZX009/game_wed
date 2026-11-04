// 電漿尖矢 / Plasma Dart — pixel version of 00GameDevs "plasma-bolt" (MIT)
PXFX.define({
  id: 'plasma-bolt',
  loop: 3,
  beats: [{ t: .22, kind: 'cast', power: .6 }, { t: 1.5, kind: 'hit', power: 1 }],
  view: { r: 3.1, h: 2.4 },
  stage: { ground: 'slate', tiles: true },
  palette: {
    plasma: ['#3054c0', '#3b86e6', '#73e3ff', '#a6f0ff', '#dcfaff', '#ffffff'],
    arc: ['#4a4cc4', '#4f7ee8', '#73c8ff', '#b4ecff'],
    stone: ['#3e4250', '#525767', '#686e7e', '#7f8596', '#989eae'],
  },
  timeline: [
    { t: [0, .22], zh: '蓄能：起點一顆電漿光點帶超出回彈地彈出，3 道短電弧劈啪閃動，火花螺旋吸入；發射前 0.08 秒一下收細', en: 'charge: a plasma point pops in with overshoot, 3 short arcs crackle, sparks spiral in; it snaps smaller in the last 0.08 s' },
    { t: [.22, 1.5], zh: '發射：起步一下急衝（0.2 秒走 12% 路程），之後以 ease-in 越飛越快撞向石柱；速度越快矢身、光暈與電絲拉得越長（電絲每 0.1 秒重新抖動），沿途掉落受阻力減速的火花', en: 'launch: a quick kick (12% of the way in 0.2 s), then ease-in acceleration into the pillar; the faster it goes the longer the head, halo and strands stretch (strands re-jag every 0.1 s); sparks shed behind and slow with drag' },
    { t: [1.5, 1.66], zh: '命中：首兩幀最大最亮的白色閃光＋4 道星芒，0.16 秒內急速收縮；電絲在 0.15 秒內壓縮進接觸點', en: 'hit: white flash with 4 star rays, biggest on the first two frames, collapsing within 0.16 s; the strands squeeze into the contact point within 0.15 s' },
    { t: [1.5, 2.2], zh: '柱面縱向電弧 0.08 秒內急伸到全長（略為超出再回彈），之後收窄成一條直線並以 ease-in 熄滅；面向飛行方向的震波環 ease-out-expo 擴張、越擴越細', en: 'vertical arcs on the pillar face shoot to full length within 0.08 s (slight overshoot), then narrow into one line and die with ease-in; a shock ring facing the flight expands with ease-out-expo, thinning as it grows' },
    { t: [1.5, 2.3], zh: '藍白火花高速向後迸出，受阻力減速並受重力落下，拖出短光痕；地面藍光淡出', en: 'blue-white sparks burst backwards fast, lose speed to drag and fall with gravity, leaving short streaks; ground light fades' },
  ],
  layers: [
    { zh: '矢頭：前尖後粗的白色錐形光線＋白熱小點，外圍一層淡藍光暈；長度隨速度由 0.55 倍拉長到 1.5 倍', en: 'head: tapered white cone of light with a white-hot point inside a pale blue halo; length stretches from 0.55x to 1.5x with speed' },
    { zh: '電絲：6 條由矢尖拉出的折線，長 1.6–2.4，中段向外鼓出 0.12–0.42，越往後越暗越細，長度隨速度伸長', en: 'strands: 6 jagged polylines from the tip, bulging 0.12–0.42 mid-way, 1.6–2.4 long and stretching with speed, thinner and dimmer towards the tail' },
    { zh: '速度線：3 條貼近軸線的淡藍直線，長度隨速度變化（最長約 2.4）', en: 'speed lines: 3 faint straight blue lines close to the axis, length follows speed (up to about 2.4)' },
    { zh: '尾跡火花：10 粒 1 像素光點，在經過的位置落下、受阻力向後漂並下墜淡出', en: 'trail sparks: 10 single-pixel motes dropped where the dart passed, drifting back with drag, sinking and fading' },
    { zh: '命中：4 道星芒＋縱向電弧扇＋面向飛行方向的震波環＋柱面接觸光斑＋14 粒帶阻力與重力的火花短線', en: 'impact: 4 star rays, vertical arc fan, shock ring facing the flight, contact glow on the pillar face, 14 spark streaks with drag and gravity' },
  ],
  params: {
    strands: { zh: '電絲數量', en: 'lightning strands', min: 2, max: 10, step: 1, value: 6 },
    trailLength: { zh: '電絲拖尾長度', en: 'trail length', min: .4, max: 2, step: .1, value: 1 },
    impactArcs: { zh: '命中電弧數量', en: 'impact arcs', min: 2, max: 12, step: 1, value: 6 },
    sparks: { zh: '火花數量', en: 'spark count', min: 0, max: 40, step: 1, value: 14 },
  },
  draw(p, t) {
    const C = this.palette.plasma, A = this.palette.arc, ST = this.palette.stone;
    const CAST = .22, HIT = 1.5, X0 = -2.7, hx = 2.18, hz = 1.0;
    const nStr = Math.round(p.param('strands')), tl = p.param('trailLength');
    p.pillar(2.55, 0, .7, 2.1, ST);

    // launch kick, then accelerate into the target
    const travel = f => .12 * p.easeOutCubic(f / .16) + .88 * Math.pow(p.clamp(f, 0, 1), 2.5);
    const posAt = tau => p.lerp(X0, hx, travel(p.ph(tau, CAST, HIT)));

    // strands from the tip backwards; squash (0..1) compresses them into the head
    const strands = (x, z, I, squash, fseed, len) => {
      for (let s = 0; s < nStr; s++) {
        const phi = s / nStr * p.TAU + p.r(s, 1) * .8 + Math.sin(t * 3 + s) * .3;
        const amp = (.12 + p.r(s, 2) * .3) * (1 - squash * .6), L = (1.6 + p.r(s, 3) * .8) * (1 - squash) * len;
        if (L < .04) continue;
        const pts = [];
        for (let k = 0; k <= 9; k++) {
          const u = k / 9, j = k === 0 ? 0 : (p.r(k + s * 11, fseed) - .5) * .16;
          const rad = amp * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.15)), .7) + j;
          const ang = phi + (p.r(k * 3 + s, fseed + 5) - .5) * .5;
          pts.push([x - u * L, Math.cos(ang) * rad, z + Math.sin(ang) * rad * .85]);
        }
        p.trail(pts, s < 2 ? .07 : .05, .02, s < 2 ? C : A, I * (s < 2 ? 1.05 : .9), I * .12);
      }
    };

    if (t < HIT) {
      const fseed = Math.floor(t * 10), z = hz;
      if (t < CAST) {
        // charge: pop in with overshoot, crackle, then snap smaller right before the release
        const c = t / CAST, size = c < .64 ? p.easeOutBack(c / .64, 2.4) : 1 - .55 * p.easeInCubic((c - .64) / .36);
        const nIn = Math.round(8 * p.density);
        for (let e = 0; e < nIn; e++) {
          const u = (c * 1.6 + p.r(e, 41)) % 1, ang = p.r(e, 42) * p.TAU + u * 2.5, rad = .7 * (1 - p.easeInCubic(u));
          p.dot(X0 + Math.cos(ang) * rad * .4, Math.cos(ang) * rad, z + Math.sin(ang) * rad * .8, C, .4 + .7 * u);
        }
        for (let b = 0; b < 3; b++) {
          const ang = p.r(b, fseed + 3) * p.TAU, len = .3 * size;
          p.bolt([X0, 0, z], [X0 - .1, Math.cos(ang) * len, z + Math.sin(ang) * len], A, { seed: fseed * 3 + b, jag: .1, depth: 2, w: .03, I: .9, glow: .12 });
        }
        p.glow(X0, 0, z, .42 * size, C, .85);
        p.orb(X0, 0, z, .09 * size, C, 1);
        p.light(X0, 0, z, 1.2, C, .55 * size);
        return;
      }
      const x = posAt(t), v = (x - posAt(t - .03)) / .03, sp = Math.min(1.3, v / 8);
      const st = .55 + .75 * sp, grow = Math.min(1, (t - CAST) * 6);
      // speed lines
      for (let s = 0; s < 3; s++) {
        const oy = (s - 1) * .07, oz = (p.r(s, 4) - .5) * .1;
        p.line([x - .25, oy, z + oz], [x - .25 - 1.8 * st * grow * tl, oy, z + oz], .03, A, .4 + .3 * sp, { i1: 0 });
      }
      strands(x, z, grow, 1 - grow, fseed, (.45 + .6 * sp) * tl);
      // head, smeared along the velocity
      p.line([x - st, 0, z], [x + .2, 0, z], .2, A, .45, { w1: .36, i1: .6, pow: 2 });
      p.line([x - .8 * st, 0, z], [x + .26, 0, z], .2, C, 1, { w1: .03, i1: 1.3 });
      p.orb(x + .05, 0, z, .07, C, 1);
      // sparks dropped where the dart passed: drift back with drag, sink
      const nE = Math.round(10 * p.density);
      for (let e = 0; e < nE; e++) {
        const P = .45, age = ((t - CAST) / P + p.r(e, 6)) % 1, tb = t - age * P, a2 = age * P;
        if (tb < CAST) continue;
        p.dot(posAt(tb) - .3 - p.drag(1.4, 4, a2), (p.r(e, 7) - .5) * .5 * (.3 + age), z + (p.r(e, 8) - .5) * .3 - 1.6 * a2 * a2, C, .95 * (1 - age));
      }
      p.light(x, 0, z, 1.5, C, .7);
      return;
    }

    const a = t - HIT, fseed = Math.floor(t * 12);
    // strands squeeze into the contact point
    const col = 1 - p.easeOutCubic(p.ph(a, 0, .15));
    if (col > 0) {
      strands(hx, hz, col, 1 - col, fseed, tl);
      p.line([hx - .5 * col, 0, hz], [hx + .02, 0, hz], .15, C, 1.1 * col);
    }
    // flash and star rays: biggest on the first frames, collapse fast
    const fl = Math.pow(1 - p.ph(a, 0, .16), 3);
    if (fl > 0) {
      p.glow(hx - .05, 0, hz, .35 + .75 * fl, C, 1.7 * fl, { pow: 1.3 });
      for (let r = 0; r < 4; r++) {
        const ang = r / 4 * p.TAU + .785, len = (.6 + p.r(r, 9) * .5) * (.3 + fl);
        p.line([hx - .05, 0, hz], [hx - .15, Math.cos(ang) * len, hz + Math.sin(ang) * len], .1, C, 1.3 * fl, { w1: .01, i1: .3 });
      }
    }
    // shock ring facing the flight: shoots out, slows, thins
    const rk = p.ph(a, 0, .42);
    if (rk > 0 && rk < 1) p.ring(hx - .12, 0, hz, .15 + p.easeOutExpo(rk) * .75, .08 * Math.pow(1 - rk, 1.5) + .02, C, 1.1 * (1 - rk), { axis: [1, 0, 0] });
    // vertical arc fan on the pillar face: snaps to length (overshoot), then narrows into a line and dies
    const nA = Math.round(p.param('impactArcs'));
    const life = 1 - p.easeInCubic(p.ph(a, .1, .72)), reach = p.easeOutBack(p.ph(a, 0, .08), 2);
    if (life > 0) {
      const spread = 1 - p.easeOutCubic(p.ph(a, .12, .6)), crackle = fseed % 2 ? 1 : .8;
      for (let b = 0; b < nA; b++) {
        const up = b % 2 === 0 ? 1 : -1, len = (.7 + p.r(b, 21) * .55) * reach;
        const end = [hx - .08 - p.r(b, 22) * .15 * spread, (p.r(b, 23) - .5) * .7 * spread, Math.max(.05, hz + up * len)];
        p.bolt([hx - .04, 0, hz], end, b < 2 ? C : A, { seed: fseed * 7 + b, jag: .08 + .1 * spread, depth: 4, w: .05, I: (b < 2 ? 1.15 : .95) * life * crackle, glow: .2 });
      }
      p.glow(hx - .02, 0, hz, .3, C, .9 * life);
    }
    // sparks: fast out, drag, gravity, short streaks
    const nS = Math.round(p.param('sparks') * p.density);
    for (let s = 0; s < nS; s++) {
      const lf = .45 + p.r(s, 31) * .4, u = a / lf;
      if (u <= 0 || u >= 1) continue;
      const ang = p.r(s, 32) * p.TAU, sp = 4 + p.r(s, 33) * 4;
      const dx = -(.4 + p.r(s, 34) * .8), dy = Math.cos(ang) * .9, dz = Math.sin(ang) * .9 + .35;
      const at = tt => { const d = p.drag(sp, 5, tt); return [hx - .05 + dx * d, dy * d, hz + dz * d - 3.5 * tt * tt]; };
      const q = at(a), q0 = at(Math.max(0, a - .04));
      if (q[2] < 0) continue;
      p.line(q, q0, .04, C, 1.1 - u * .7);
    }
    const heat = 1 - p.ph(a, 0, .9);
    p.light(hx, 0, hz, 2, C, .95 * Math.max(fl, heat * heat * .85));
  },
});
