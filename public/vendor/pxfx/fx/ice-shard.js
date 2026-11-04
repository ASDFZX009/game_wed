// 霜晶飛矢 / Frostcrystal Dart — pixel version of 00GameDevs "ice-shard" (MIT)
PXFX.define({
  id: 'ice-shard',
  loop: 3.2,
  beats: [{ t: .3, kind: 'cast', power: .6 }, { t: 1.5, kind: 'hit', power: 1 }],
  view: { r: 3.1, h: 2.4 },
  stage: { ground: 'slate' },
  palette: {
    ice: ['#36457c', '#4f6dab', '#7aa2da', '#b3dcff', '#eef8ff'],
    frost: ['#6f98d8', '#92bdee', '#b3dcff', '#d8efff', '#f4fbff', '#ffffff'],
  },
  timeline: [
    { t: [0, .3], zh: '凝結：冰矢在起點由一點彈出成形（超出約 15% 再回彈），霜點螺旋吸入，矢身向後拉 0.25 蓄力；發射瞬間四片冰鰭一下張開', en: 'form: the dart pops out of a point with ~15% overshoot, frost motes spiral in, the body draws back 0.25; the four fins snap open at the release' },
    { t: [.3, 1.5], zh: '發射：起步一下急衝，之後以 ease-in 越飛越快撞向木人；越快自轉越快、霜光線越長，沿路掉落翻滾小冰塊與霜點', en: 'launch: a quick kick, then ease-in acceleration into the dummy; it rolls faster and the frost streak lengthens with speed, shedding tumbling chips and frost motes' },
    { t: [1.5, 1.65], zh: '命中：首兩幀最大的淡藍白閃光，0.15 秒內收縮；面向飛行方向的霜環 ease-out-expo 急衝後減速、越擴越細', en: 'hit: pale blue-white flash, biggest on the first two frames, collapsing within 0.15 s; a frost ring facing the flight shoots out with ease-out-expo, slows and thins' },
    { t: [1.5, 2.8], zh: '冰矢碎成 12 塊冰片：高速向後上方迸出，水平受阻力減速、受重力落地，彈一下滑行停住，翻滾逐漸變慢，最後 0.35 秒內急縮消失；地面霜花急速長出後淡出', en: 'the dart shatters into 12 shards: they burst back and up fast, lose horizontal speed to drag, fall, bounce once and slide to rest, tumbling slower and slower, then shrink away within 0.35 s; a frost patch spreads fast, then fades' },
  ],
  layers: [
    { zh: '主體：實心冰晶雙錐（長 1.4、寬 0.34）＋四片長 0.9、寬 0.17 的冰鰭，前向內收、尾端外張', en: 'body: solid ice bipyramid (1.4 long, 0.34 wide) plus four 0.9 x 0.17 fins angled in at the front, flared at the back' },
    { zh: '冰晶用 5 階冷色實體色階，邊緣自動加深，高光偏白', en: 'ice uses a 5-step cool solid ramp, darker edges, near-white highlights' },
    { zh: '矢尖：一個 2 像素臂長的白色四角星閃光', en: 'tip: a white four-point sparkle with 2 px arms' },
    { zh: '尾跡：6 塊翻滾小冰塊＋20 粒霜點在經過的位置落下並受阻力漂移；霜光線長度隨速度由 0.6 拉長到 2.0', en: 'trail: 6 tumbling ice chips and 20 frost motes dropped where the dart passed, drifting with drag; the frost streak stretches from 0.6 to 2.0 with speed' },
    { zh: '碎冰：12 塊帶阻力與重力翻滾的冰片，落地彈一下停住；3 團白色霜霧急速向外膨脹後以抖色淡出', en: 'debris: 12 shards tumbling with drag and gravity, one bounce, then rest; 3 white frost puffs swell out fast and fade with dither' },
  ],
  params: {
    shards: { zh: '碎冰數量', en: 'shard count', min: 4, max: 24, step: 1, value: 12 },
    fins: { zh: '冰鰭數量', en: 'fins', min: 0, max: 6, step: 1, value: 4 },
    spin: { zh: '自轉速度', en: 'roll speed', min: 0, max: 3, step: .1, value: 1 },
    ringSize: { zh: '霜環大小', en: 'frost ring size', min: .5, max: 2, step: .1, value: 1 },
  },
  draw(p, t) {
    const I = this.palette.ice, F = this.palette.frost;
    const CAST = .3, HIT = 1.5, hx = 2.12, hz = 1.0, X0 = -2.45, XB = X0 - .25, XE = hx - .55;
    const nF = Math.round(p.param('fins')), spinK = p.param('spin');
    p.dummy(2.45, 0);

    // launch kick, then accelerate into the target
    const travel = f => .12 * p.easeOutCubic(f / .16) + .88 * Math.pow(p.clamp(f, 0, 1), 2.5);
    const xAt = tau => (tau < CAST ? p.lerp(X0, XB, p.easeOutCubic(tau / CAST)) : p.lerp(XB, XE, travel(p.ph(tau, CAST, HIT))));
    const body = (x, z, sc, flare, roll) => {
      if (sc < .05) return;
      p.shard(x, 0, z, 1.4 * sc, .34 * sc, [1, 0, 0], I, { back: .55, spin: roll });
      for (let f = 0; f < nF; f++) {
        const a = roll + f / nF * p.TAU + Math.PI / 4, ca = Math.cos(a), sa = Math.sin(a), rr = .24 * sc;
        p.shard(x - .3 * sc, ca * rr, z + sa * rr, .9 * sc, .17 * sc, [1, -ca * flare, -sa * flare], I, { back: .5, spin: a, sides: 3, shadow: f === 0 });
      }
    };

    if (t < HIT) {
      const z = hz + Math.sin(t * 5) * .03;
      if (t < CAST) {
        // form: pop in with overshoot, draw back, fins snap open at the release
        const sc = p.easeOutBack(p.ph(t, 0, .2), 2.2), flare = .08 + .32 * p.easeOutBack(p.ph(t, .2, CAST), 3), x = xAt(t);
        const nIn = Math.round(10 * p.density);
        for (let e = 0; e < nIn; e++) {
          const u = (t / CAST * 1.4 + p.r(e, 41)) % 1, ang = p.r(e, 42) * p.TAU + u * 2.2, rad = .8 * (1 - p.easeInCubic(u));
          p.dot(x + .1 + Math.cos(ang) * rad * .5, Math.cos(ang) * rad, z + Math.sin(ang) * rad * .8, F, .45 + .6 * u);
        }
        body(x, z, sc, flare, spinK * 2 * t);
        p.sparkle(x + .62 * sc, 0, z, 2, F, sc);
        p.light(x, 0, z, 1.3, F, .45 * sc);
        return;
      }
      const f = p.ph(t, CAST, HIT), x = xAt(t), v = (x - xAt(t - .03)) / .03, sp = Math.min(1.3, v / 8), st = .45 + .85 * sp;
      const roll = spinK * (2 * t + 7 * travel(f));
      // frost streak: a faint pale line along the path, longer when fast
      p.line([x - .6, 0, z], [Math.max(-3, x - .6 - 1.5 * st), 0, z - .05], .12, F, .3 + .15 * sp, { i1: 0, w1: .04 });
      // frost motes dropped where the dart passed: drift with drag, sink
      const nM = Math.round(20 * p.density);
      for (let e = 0; e < nM; e++) {
        const P = .7, age = ((t - CAST) / P + p.r(e, 1)) % 1, tb = t - age * P, a2 = age * P;
        if (tb < CAST) continue;
        const ang = p.r(e, 2) * p.TAU, d = p.drag(.9, 3.5, a2);
        p.dot(xAt(tb) - .5 - d * .6, Math.cos(ang) * (.12 + d * .5), z + Math.sin(ang) * (.1 + d * .3) - .7 * a2 * a2, F, .85 * (1 - age));
      }
      // tumbling chips, also dropped along the path, falling with gravity
      const nC = Math.round(6 * p.density);
      for (let c = 0; c < nC; c++) {
        const P = .9, age = ((t - CAST) / P + p.r(c, 4)) % 1, tb = t - age * P, a2 = age * P;
        if (tb < CAST) continue;
        const cz = z + (p.r(c, 6) - .5) * .3 - 2.2 * a2 * a2;
        if (cz < .05) continue;
        const spc = (6 + c) * p.drag(1, 1.5, a2) * 3 + c;
        p.shard(xAt(tb) - .55 - p.drag(1, 3, a2) * .5, (p.r(c, 5) - .5) * .5 * (.3 + age), cz, .16 * (1 - age * .5), .08,
          [Math.cos(spc), Math.sin(spc * .7), Math.sin(spc)], I, { shadow: false });
      }
      body(x, z, 1, .4, roll);
      p.sparkle(x + .62, 0, z, 2, F, .9);
      p.light(x, 0, z, 1.4, F, .45);
      return;
    }

    const a = t - HIT;
    // flash: biggest on the first frames, collapses fast
    const fl = Math.pow(1 - p.ph(a, 0, .15), 3);
    if (fl > 0) p.glow(hx - .1, 0, hz, .35 + .6 * fl, F, 1.5 * fl, { pow: 1.4 });
    // frost ring: shoots out, slows, thins
    const rk = p.ph(a, 0, .5), rs = p.param('ringSize');
    if (rk > 0 && rk < 1) p.ring(hx - .2, 0, hz, (.2 + p.easeOutExpo(rk) * .8) * rs, .08 * Math.pow(1 - rk, 1.5) + .02, F, 1.1 * (1 - rk), { axis: [1, 0, 0], fn: ang => .5 + .5 * Math.abs(Math.cos(ang * 3)) });
    // shards: burst out fast, drag on the horizontal, gravity, one bounce, slide to rest, shrink away
    const G = 8, nS = Math.round(p.param('shards') * p.density);
    for (let s = 0; s < nS; s++) {
      const spd = 2.2 + p.r(s, 11) * 2.8, dir = (p.r(s, 12) - .5) * 2.6;
      const vx = -Math.cos(dir) * spd, vy = Math.sin(dir) * spd, vz = .8 + p.r(s, 13) * 2.4;
      const z0 = hz + (p.r(s, 14) - .5) * .4, land = (vz + Math.sqrt(vz * vz + 2 * G * (z0 - .04))) / G;
      const tt = Math.min(a, land), b = Math.max(0, a - land);
      const d = p.drag(1, 2.5, tt) + Math.exp(-2.5 * land) * p.drag(.5, 8, b);
      let z = z0 + vz * tt - G * tt * tt * .5;
      if (b > 0) { const vb = (G * land - vz) * .22; z = .04 + Math.max(0, vb * b - G * b * b * .5); }
      const shrink = 1 - p.easeInCubic(p.ph(a, .9 + p.r(s, 15) * .3, 1.25 + p.r(s, 15) * .3));
      if (shrink <= 0) continue;
      const rot = p.drag(1, 1.6, a), th = p.r(s, 16) * p.TAU + rot * (10 + p.r(s, 17) * 8), ph = p.r(s, 18) * 3 + rot * 6;
      const rest = b > .25;
      const dirv = rest ? [Math.cos(th), Math.sin(th), .12] : [Math.cos(th) * Math.cos(ph), Math.sin(th) * Math.cos(ph), Math.sin(ph)];
      p.shard(hx - .1 + vx * d, vy * d, Math.max(.04, z) + (rest ? .03 : 0), (.3 + p.r(s, 19) * .28) * shrink, (.15 + p.r(s, 20) * .08) * shrink, dirv, I, { spin: th, sides: s % 2 ? 3 : 4 });
    }
    // frost puffs: swell out fast, then hang and fade
    for (let s = 0; s < 3; s++) {
      const u = p.ph(a, .02 + s * .04, .8 + s * .1);
      if (u <= 0 || u >= 1) continue;
      const ang = s / 3 * p.TAU + .5, out = p.easeOutExpo(u);
      p.ball(hx - .3 + Math.cos(ang) * .25 * (1 + out), Math.sin(ang) * .4 * (1 + out), hz + u * .4 + Math.sin(ang) * .15,
        .14 + out * .26, I, { alpha: (1 - u * u) * .8, rough: .4, lit: .35, shadow: false, seed: s });
    }
    // frost patch on the ground: spreads fast, fades
    const fade = 1 - p.easeInCubic(p.ph(a, .6, 1.4)), grow = p.easeOutExpo(p.ph(a, .02, .45));
    if (fade > 0) {
      p.decal(hx - .45, 0, 0, .9, (x, y, rho, ang) => {
        const spoke = Math.abs(Math.sin(ang * 3 + .4));
        return rho < .9 * grow && (spoke < .1 || p.band(rho, .45, .04) > 0) ? (1 - rho / .9) * .9 : 0;
      }, F, fade * .8);
      p.light(hx - .3, 0, hz, 1.6, F, .75 * Math.max(fl, fade * .8));
    }
  },
});
