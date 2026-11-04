// 晶齒冰輪 / Crystal-Toothed Ice Wheel — pixel version of 00GameDevs "frost-wheel" (MIT)
PXFX.define({
  id: 'frost-wheel',
  loop: 3.2,
  beats: [{ t: .35, kind: 'cast', power: .6 }, { t: 1.5, kind: 'hit', power: 1.1 }],
  view: { r: 3.1, h: 2.4 },
  stage: { ground: 'teal' },
  palette: {
    ice: ['#3f5f8e', '#5c8bbb', '#8bc1ea', '#bde7ff', '#f0fbff'],
    frost: ['#5f95cf', '#83bde9', '#a9dfff', '#d2f0ff', '#f2fbff', '#ffffff'],
    stone: ['#3b4552', '#4f5b69', '#657281', '#7c8a98', '#95a3b0'],
  },
  timeline: [
    { t: [0, .35], zh: '成形：冰輪由一點彈出（超出約 20% 再回彈），原地由靜止開始越轉越快，同時向後退 0.2 蓄力', en: 'form: the wheel pops out of a point (about 20% overshoot) and spins up from rest on the spot while drawing back 0.2' },
    { t: [.35, 1.5], zh: '發射：起步一下急衝，之後以 ease-in 越飛越快撞向石柱；轉速同步加快（每秒約 1 → 3.5 圈），高速時冰齒外圈出現一圈霜色殘影環；身後霜點與短霜線受阻力向後漂並下沉', en: 'launch: a quick kick, then ease-in acceleration into the pillar; the spin speeds up with it (about 1 to 3.5 turns/s) and a frost blur ring appears around the teeth at speed; frost motes and streaks drift back with drag and sink' },
    { t: [1.5, 1.65], zh: '命中：首兩幀最大的白色閃光；面向飛行方向的霜環 ease-out-expo 急衝後減速、越擴越細；輪身變成半透明殘影並繼續減速旋轉 0.2 秒', en: 'hit: white flash biggest on the first two frames; a frost ring facing the flight shoots out with ease-out-expo, slows and thins; the wheel turns into a dithered ghost that keeps spinning down for 0.2 s' },
    { t: [1.5, 2.7], zh: '冰輪裂成 8 段弧形冰塊（各帶一根冰齒），沿旋轉切線方向甩出，水平受阻力減速、受重力落地滑停，翻滾逐漸變慢，最後急縮消失；另有 10 粒碎冰屑迸出', en: 'the wheel breaks into 8 curved ice segments (one tooth each) flung along the spin tangent; drag slows them, gravity drops them, they slide to rest, tumble slower and slower, then shrink away; 10 small ice chips burst out too' },
  ],
  layers: [
    { zh: '輪身：22 顆冰色實心球排成半徑 0.6 的圓環（球半徑 0.16），看起來像冰製圓環', en: 'rim: 22 solid ice spheres on a 0.6 radius circle (sphere radius 0.16), reading as an ice torus' },
    { zh: '冰齒：8 根向外的冰晶錐（長 0.44、寬 0.2），隨輪身一起轉', en: 'teeth: 8 outward ice spikes (0.44 long, 0.2 wide) turning with the rim' },
    { zh: '內圈冷光：輪內側一圈淡藍光環；高速殘影環：齒尖半徑的霜色光環，亮度隨轉速增加', en: 'inner glow: a faint blue light ring along the inside of the rim; speed blur: a frost light ring at the tooth tips, brighter the faster it spins' },
    { zh: '尾跡：30 粒霜點＋4 條短霜線，在經過的位置落下、受阻力漂移，越往後越低越淡', en: 'trail: 30 frost motes and 4 short frost streaks dropped where the wheel passed, drifting with drag, sinking and fading' },
    { zh: '碎片：8 段 3 球弧形冰塊帶阻力與重力翻滾，10 粒碎冰屑，3 團霜霧急速膨脹後抖色淡出', en: 'debris: 8 three-sphere arc segments tumbling with drag and gravity, 10 ice chips, 3 frost puffs that swell fast and fade with dither' },
  ],
  params: {
    teeth: { zh: '冰齒數量', en: 'teeth', min: 4, max: 14, step: 1, value: 8 },
    wheelSize: { zh: '冰輪大小', en: 'wheel size', min: .6, max: 1.3, step: .05, value: 1 },
    spin: { zh: '轉速', en: 'spin speed', min: 0, max: 3, step: .1, value: 1 },
    motes: { zh: '霜點數量', en: 'frost motes', min: 0, max: 60, step: 1, value: 30 },
  },
  draw(p, t) {
    const I = this.palette.ice, F = this.palette.frost, ST = this.palette.stone;
    const CAST = .35, HIT = 1.5, ws = p.param('wheelSize'), R = .6 * ws, cz = Math.max(1.1, R + .55), face = 2.2, hx = face - R - .2;
    const nT = Math.round(p.param('teeth')), spinK = p.param('spin'), X0 = -2.45, XB = X0 - .2;
    const br = .16 * (.6 + .4 * ws), tl = .44 * Math.sqrt(ws), tw = .2 * Math.sqrt(ws);
    p.pillar(2.55, 0, .7, 2.1, ST);

    // launch kick, then accelerate into the target
    const travel = f => .12 * p.easeOutCubic(f / .16) + .88 * Math.pow(p.clamp(f, 0, 1), 2.5);
    const xAt = tau => (tau < CAST ? p.lerp(X0, XB, p.easeOutCubic(tau / CAST)) : p.lerp(XB, hx, travel(p.ph(tau, CAST, HIT))));
    // spin angle: spins up from rest during the charge, then speeds up with the flight
    const thAt = tau => -spinK * (tau < CAST ? 6 * tau * tau / (2 * CAST) : 3 * CAST + 6 * (tau - CAST) + 9 * travel(p.ph(tau, CAST, HIT)));

    const wheel = (x, z, th, sc, o, blur) => {
      const nB = Math.round(22 * ws);
      for (let k = 0; k < nB; k++) {
        const a = th + k / nB * p.TAU;
        p.ball(x + Math.cos(a) * R * sc, 0, z + Math.sin(a) * R * sc, br * sc, I, Object.assign({ shadow: k % 4 === 0 }, o));
      }
      if (o.alpha != null) return;
      for (let k = 0; k < nT; k++) {
        const a = th + (k + .5) / nT * p.TAU, ca = Math.cos(a), sa = Math.sin(a), rr = (R + .24 * Math.sqrt(ws)) * sc;
        p.shard(x + ca * rr, 0, z + sa * rr, tl * sc, tw * sc, [ca, 0, sa], I, { back: .3, shadow: false });
      }
      p.ring(x, 0, z, (R - br - .01) * sc, .05, F, .6, { axis: [0, 1, 0] });
      if (blur > 0) p.ring(x, 0, z, (R + .46 * Math.sqrt(ws)) * sc, .06 * ws, F, blur, { axis: [0, 1, 0], fn: ang => .5 + .5 * Math.sin(ang * nT + th * 2) });
    };

    if (t < HIT) {
      const f = p.ph(t, CAST, HIT), x = xAt(t), v = (x - xAt(t - .03)) / .03;
      const sc = p.easeOutBack(p.ph(t, 0, .25), 2.6), omega = Math.abs(thAt(t) - thAt(t - .02)) / .02;
      // frost motes dropped where the wheel passed: drift with drag, sink
      const nM = Math.round(p.param('motes') * p.density);
      for (let e = 0; e < nM; e++) {
        const P = .65, age = (t / P + p.r(e, 1)) % 1, tb = t - age * P, a2 = age * P;
        if (tb < .1) continue;
        const ang = p.r(e, 2) * p.TAU, d = p.drag(1, 3, a2);
        p.dot(xAt(tb) - .3 - d * .7, Math.cos(ang) * (.3 + d * .3) * ws, cz + Math.sin(ang) * .45 * ws - .8 * a2 * a2, F, 1 - age * .8);
      }
      // short frost streaks, longer when fast
      const nS = Math.round(4 * p.density), slen = .25 + .07 * v;
      for (let s = 0; s < nS; s++) {
        const P = .45, age = (t / P + p.r(s, 3)) % 1, tb = t - age * P;
        if (tb < CAST) continue;
        const sx = xAt(tb) - .3 - p.drag(1.2, 3, age * P), sz = cz + (p.r(s, 4) - .5) * .7 * ws - age * .25;
        p.line([sx, (p.r(s, 5) - .5) * .4, sz], [sx - slen, (p.r(s, 5) - .5) * .4, sz], .05, F, .9 * (1 - age), { i1: 0 });
      }
      const blur = p.clamp((omega - 10) / 30, 0, .45);
      wheel(x, cz, thAt(t), sc, {}, blur);
      p.light(x, 0, cz, 1.5, F, .5 * Math.min(1, sc));
      return;
    }

    const a = t - HIT, thH = thAt(HIT), wEnd = Math.abs(thH - thAt(HIT - .02)) / .02;
    // flash: biggest on the first frames, collapses fast
    const fl = Math.pow(1 - p.ph(a, 0, .15), 3);
    if (fl > 0) p.glow(face - .1, 0, cz, .3 + .5 * fl, F, 1.6 * fl, { pow: 1.3 });
    // frost ring: shoots out, slows, thins
    const rk = p.ph(a, 0, .5);
    if (rk > 0 && rk < 1) p.ring(face - .15, 0, cz, (.2 + p.easeOutExpo(rk) * .95) * ws, .08 * Math.pow(1 - rk, 1.5) + .02, F, 1.1 * (1 - rk), { axis: [1, 0, 0] });
    // ghost of the whole wheel spinning down and fading
    const gh = 1 - p.ph(a, 0, .22);
    if (gh > 0) wheel(hx, cz, thH - Math.sign(spinK || 1) * wEnd * p.drag(1, 8, a), 1, { alpha: gh * .7, lit: .2 }, 0);
    // fragments flung along the spin tangent: drag, gravity, slide, slow tumble, shrink
    const G = 7, vt = Math.min(3, wEnd * R * .2);
    for (let fr = 0; fr < nT; fr++) {
      const phi = thH + (fr + .5) / nT * p.TAU, cp = Math.cos(phi), sp = Math.sin(phi);
      const vx = cp * 1.4 + sp * vt - .8, vy = (p.r(fr, 11) - .5) * 2, vz = sp * 1.4 - cp * vt + 1.4;
      const z0 = cz + sp * R, land = (vz + Math.sqrt(Math.max(0, vz * vz + 2 * G * Math.max(.1, z0 - .12)))) / G, tt = Math.min(a, land);
      const d = p.drag(1, 2.5, tt) + Math.exp(-2.5 * land) * p.drag(.4, 8, Math.max(0, a - land));
      const fx = hx + cp * R + vx * d, fy = vy * d, fz = Math.max(.12, z0 + vz * tt - G * tt * tt * .5);
      const shrink = 1 - p.easeInCubic(p.ph(a, .85 + p.r(fr, 12) * .3, 1.2 + p.r(fr, 12) * .3));
      if (shrink <= 0) continue;
      const rot = p.drag(1, 1.8, a), spin = phi + rot * (8 + p.r(fr, 13) * 6) * (fr % 2 ? 1 : -1), tilt = p.r(fr, 14) * .8 * Math.min(1, rot * 2);
      for (let k = -1; k <= 1; k++) {
        const b = spin + k * .26 / ws;
        const ox = Math.cos(b) * R - Math.cos(spin) * R, oz = Math.sin(b) * R - Math.sin(spin) * R;
        p.ball(fx + ox, fy + ox * tilt, fz + oz, br * .9 * shrink, I, { shadow: k === 0 });
      }
      p.shard(fx + Math.cos(spin) * .2, fy, fz + Math.sin(spin) * .2, tl * .7 * shrink, tw * .65 * shrink, [Math.cos(spin), tilt * .3, Math.sin(spin)], I, { back: .3, shadow: false });
    }
    // small ice chips: burst out fast, drag, gravity
    const nC = Math.round(10 * p.density);
    for (let c = 0; c < nC; c++) {
      const lf = .5 + p.r(c, 21) * .4, u = a / lf;
      if (u <= 0 || u >= 1) continue;
      const ang = p.r(c, 22) * p.TAU, s0 = 3 + p.r(c, 23) * 3, d = p.drag(s0, 4, a);
      const z = cz + (Math.sin(ang) * .9 + .4) * d - 4 * a * a;
      if (z < .03) continue;
      const th = c + a * 14;
      p.shard(face - .2 - (.5 + p.r(c, 24) * .6) * d, Math.cos(ang) * .9 * d, z, .12, .06, [Math.cos(th), .3, Math.sin(th)], I, { shadow: false });
    }
    // frost puffs: swell out fast, then hang and fade
    for (let s = 0; s < 3; s++) {
      const u = p.ph(a, .02 + s * .04, .8 + s * .1);
      if (u <= 0 || u >= 1) continue;
      const ang = s / 3 * p.TAU + .3, out = p.easeOutExpo(u);
      p.ball(face - .35 + Math.cos(ang) * .3 * (1 + out), Math.sin(ang) * .4 * (1 + out), cz + u * .45 + Math.sin(ang) * .15,
        .15 + out * .26, F, { alpha: (1 - u * u) * .75, rough: .4, lit: .3, shadow: false, seed: s });
    }
    const heat = 1 - p.ph(a, 0, 1.1);
    p.light(face - .3, 0, cz, 1.8, F, .8 * Math.max(fl, heat * heat * .75));
  },
});
