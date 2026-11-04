// 蓄能光炮 / Charged Light Cannon — pixel version of 00GameDevs "charged-beam" (MIT)
PXFX.define({
  id: 'charged-beam',
  loop: 4.6,
  beats: [
    { t: 1.6, kind: 'cast', power: 1 }, { t: 1.72, kind: 'hit', power: 1.2 },
    { t: 2.4, kind: 'pulse', power: .55 }, { t: 3.1, kind: 'pulse', power: .55 },
  ],
  view: { r: 3.1, h: 2.4 },
  stage: { ground: 'ash', tiles: true },
  palette: {
    light: ['#b06a2e', '#d8963e', '#f6c76c', '#ffe0a0', '#fff4da', '#ffffff'],
    crystal: ['#4e3420', '#7a5228', '#b07c34', '#e8b45a', '#fff0c0'],
    stone: ['#4a4450', '#605a66', '#78727e', '#918a94', '#aaa3ab'],
  },
  timeline: [
    { t: [0, 1.4], zh: '蓄力：水晶前方的聚光點由小變大，20 道火花沿螺線以 ease-in 越吸越快撞入聚光點，3 條弧線繞著聚光點越轉越快並收緊，水晶自轉加速，地面金光漸亮', en: 'charge: the focus point in front of the crystal swells, 20 sparks spiral in with ease-in, faster and faster, 3 arcs orbit it ever faster and tighten, the crystal spins up, golden ground light builds' },
    { t: [1.4, 1.6], zh: '壓縮：發射前 0.2 秒聚光點以 ease-in 急縮到約一半大小、弧線收得最緊', en: 'compress: in the last 0.2 s before firing the focus shrinks to about half with ease-in, the arcs pull in tightest' },
    { t: [1.6, 1.72], zh: '發射：聚光點白閃（首兩幀最大），光環 ease-out-expo 急速擴張；粗光束前端以 ease-in 加速，0.12 秒打到石柱', en: 'fire: white flash at the focus (biggest on the first two frames), a ring bursts out with ease-out-expo; the thick beam head accelerates with ease-in and hits the pillar in 0.12 s' },
    { t: [1.72, 3.7], zh: '持續：三層粗光束（外暈／金色／白芯），光團每 0.12 秒由聚光點射出並加速向前滾，令光束忽粗忽細；到達瞬間與 2.4、3.1 秒兩下湧動時光束瞬間變粗變亮再三次方衰減，命中點彈出大震波環、火花噴得更急；命中大光環呼吸，每 0.35 秒擴出一圈越擴越細的小環', en: 'sustain: three-layer beam (halo / gold / white core); a bulge leaves the focus every 0.12 s and accelerates along it so the width swells and pinches; on arrival and in surges at 2.4 and 3.1 s the beam thickens and brightens at once with cubic decay, a big shock ring bursts at the hit and the sparks spray harder; a large ring breathes at the hit and a thinning small ring bursts every 0.35 s' },
    { t: [3.7, 4.1], zh: '停止：聚光點以 ease-in 急縮熄滅，光束尾端加速收向石柱；尾端到達時命中大光環最後 ease-out-expo 擴張並淡出', en: 'stop: the focus collapses with ease-in, the beam tail accelerates into the pillar; when it arrives the big impact ring expands one last time with ease-out-expo and fades' },
  ],
  layers: [
    { zh: '光源：石台座上浮著一顆金色水晶，前方 0.1 處為聚光點（白熱球，半徑 0.03 → 0.14，發射前縮到 0.07）', en: 'source: a golden crystal floating above a stone plinth, focus point 0.1 in front (white-hot orb, radius 0.03 to 0.14, shrinking to 0.07 just before firing)' },
    { zh: '吸入火花：20 條短光線沿螺線由半徑 1.0–1.4 以 ease-in 吸向聚光點，週期 0.6 秒', en: 'inflow sparks: 20 short streaks spiralling in with ease-in from radius 1.0–1.4 to the focus, 0.6 s cycle' },
    { zh: '繞行弧線：3 條 140° 的弧，軸向各自旋轉，轉速隨蓄力增加，半徑 0.42 → 0.3', en: 'orbit arcs: 3 arcs of 140 degrees on rotating axes, spinning faster as the charge builds, radius 0.42 to 0.3' },
    { zh: '光束：寬 0.5 外暈（亮度 0.45）＋寬 0.24 金色層＋寬 0.09 白芯；半徑 0.22 的光團每 0.12 秒一個、0.5 秒內加速跑完全程', en: 'beam: 0.5-wide halo (0.45) + 0.24-wide gold layer + 0.09-wide white core; bulges of radius 0.22, one every 0.12 s, accelerating along the full length in 0.5 s' },
    { zh: '命中：半徑 0.45 光暈＋半徑約 0.75 的面向光束大光環＋週期小光環＋湧動震波環＋18 粒帶阻力與重力的火花', en: 'impact: 0.45 radius glow, a large ring of about 0.75 facing the beam, periodic small rings, surge shock rings, 18 sparks with drag and gravity' },
  ],
  params: {
    beamWidth: { zh: '光束粗細', en: 'beam width', min: .5, max: 1.8, step: .05, value: 1 },
    chargeSparks: { zh: '蓄力火花數量', en: 'charge sparks', min: 0, max: 40, step: 1, value: 20 },
    orbitArcs: { zh: '繞行弧線數量', en: 'orbit arcs', min: 0, max: 6, step: 1, value: 3 },
    impactSparks: { zh: '命中火花數量', en: 'impact sparks', min: 0, max: 40, step: 1, value: 18 },
  },
  draw(p, t) {
    const Lg = this.palette.light, CR = this.palette.crystal, ST = this.palette.stone;
    const FX = -2.1, TX = 2.18, hz = 1.0, FIRE = 1.6, HEAD = 1.72, OFF = 3.7, END = 4.1, SURGES = [2.4, 3.1];
    const bw = p.param('beamWidth'), nArc = Math.round(p.param('orbitArcs'));
    const ch = p.ph(t, 0, FIRE), ch3 = ch * ch * ch;
    p.pillar(2.55, 0, .7, 2.1, ST);
    p.box(-2.75, -.2, 0, -2.35, .2, .74, ST);
    p.shard(-2.52, 0, hz + Math.sin(t * 2.4) * .03, .64, .3, [1, 0, 0], CR, { back: .5, spin: t + 5 * ch3 + (t > FIRE ? (t - FIRE) * 4 : 0) });

    // surge envelope: sharp attack, slow cubic decay; the arrival is the biggest
    const surgeAt = tt => {
      let s = tt >= HEAD ? Math.pow(1 - p.ph(tt, HEAD, HEAD + .35), 3) : 0;
      for (const tp of SURGES) { const d = tt - tp; if (d >= 0 && d < .5) s = Math.max(s, .75 * Math.pow(1 - d / .5, 3)); }
      return s;
    };
    const sg = t < OFF ? surgeAt(t) : 0;
    const on = t < OFF ? 1 : 1 - p.easeInCubic(p.ph(t, OFF, OFF + .18));
    // focus orb and orbit arcs
    if (on > 0) {
      const size = t < 1.4 ? .03 + .11 * Math.pow(t / 1.4, 1.5) : t < FIRE ? .14 - .07 * p.easeInCubic(p.ph(t, 1.4, FIRE)) : .12 + .02 * Math.sin(t * 30) + .05 * sg;
      p.glow(FX, 0, hz, (.18 + .24 * Math.min(1, ch * 1.2)) * on, Lg, (.3 + .45 * ch) * on);
      p.orb(FX, 0, hz, size * on, Lg, 1);
      const squeeze = p.easeInCubic(p.ph(t, 1.4, FIRE)) * (t < FIRE ? 1 : 0);
      for (let k = 0; k < nArc; k++) {
        const rot = t * (2.5 + k * .7) + 6 * ch3 + k * 2, rad = .42 - .1 * ch - .08 * squeeze;
        const ax = [Math.cos(rot) * .5, Math.sin(rot), .7 - (k % 3) * .3], a0 = t * (5 - (k % 3)) + 12 * ch3 + k * 2.1;
        p.ring(FX, 0, hz, rad, .04, Lg, (.5 + .6 * ch) * on * (t < FIRE ? 1 : .75), { axis: ax, a0, a1: a0 + 2.45, fn: (q, u) => Math.sin(u * Math.PI) });
      }
      p.light(FX, 0, hz, 1.2 + ch * .6, Lg, (.25 + .45 * ch) * on);
    }
    // inflow sparks during the charge: spiral in with ease-in, faster and faster
    if (t < FIRE) {
      const nS = Math.round(p.param('chargeSparks') * p.density);
      for (let s = 0; s < nS; s++) {
        const P = .6, ph = p.r(s, 1) * P, cyc = Math.floor((t + ph) / P), age = ((t + ph) % P) / P, born = t - age * P;
        if (born < .05 || born + P > FIRE + .05) continue;
        const th = p.r(s + cyc * 20, 2) * p.TAU, el = (p.r(s + cyc * 20, 3) - .5) * 2.4, r0 = 1 + p.r(s, 4) * .4;
        const e = p.easeInCubic(age), rad = r0 * (1 - e), sw = th + e * 2.5, tl = 1.1 + .4 * e;
        const dir = [Math.cos(sw) * Math.cos(el) * .6 - .4, Math.sin(sw) * Math.cos(el), Math.sin(el)];
        const q = [FX + dir[0] * rad, dir[1] * rad, hz + dir[2] * rad], q2 = [FX + dir[0] * rad * tl, dir[1] * rad * tl, hz + dir[2] * rad * tl];
        p.line(q, q2, .04, Lg, .4 + .8 * age, { i1: .1 });
      }
    }
    // fire flash and ring: biggest on the first frames
    const ff = p.ph(t, FIRE, FIRE + .4);
    if (ff > 0 && ff < 1) {
      const k3 = Math.pow(1 - ff, 3);
      p.glow(FX, 0, hz, .2 + .6 * k3, Lg, 1.6 * k3, { pow: 1.3 });
      p.ring(FX + .05, 0, hz, .2 + p.easeOutExpo(ff) * .8, .08 * Math.pow(1 - ff, 1.5) + .02, Lg, 1.1 * (1 - ff), { axis: [1, 0, 0] });
    }
    // beam: head accelerates into the pillar, tail retracts with ease-in
    const head = p.lerp(FX, TX, p.easeIn(p.ph(t, FIRE, HEAD)));
    const tail = p.lerp(FX, TX, p.easeInCubic(p.ph(t, OFF, END)));
    if (t > FIRE && t < END && head - tail > .02) {
      const fl = 1 + Math.sin(t * 41) * .06;
      p.line([tail, 0, hz], [head, 0, hz], .5 * bw * (fl + .6 * sg), Lg, .42 + .2 * sg, { pow: 2 });
      p.line([tail, 0, hz], [head, 0, hz], .24 * bw * (fl + .45 * sg), Lg, .85);
      p.line([tail, 0, hz], [head, 0, hz], .09 * bw * (1 + .3 * sg), Lg, 1.4 + .3 * sg);
      // bulges: one every 0.12 s, accelerating down the beam in 0.5 s
      for (let n = Math.max(0, Math.floor((t - FIRE - .5) / .12)); FIRE + n * .12 <= t; n++) {
        const u = (t - FIRE - n * .12) / .5;
        if (u >= 1) continue;
        const x = p.lerp(FX, TX, .2 * u + .8 * u * u);
        if (x < tail || x > head) continue;
        p.glow(x, 0, hz, .22 * bw * (1 + .3 * sg), Lg, .6);
      }
      for (let k = 0; k < 7; k++) p.light(p.lerp(tail, head, (k + .5) / 7), 0, hz, 1.1, Lg, .45 + .2 * sg);
    }
    // impact
    const hit = p.env(t, HEAD - .02, HEAD, END - .05, END + .15);
    if (hit > 0) {
      p.glow(TX - .12, 0, hz, .45 * bw * (1 + .8 * sg), Lg, (1.2 + .8 * sg) * hit, { pow: 1.4 });
      p.ring(TX - .12, 0, hz, (.72 + .05 * Math.sin(t * 7) + .15 * sg) * Math.sqrt(bw), .05, Lg, .7 * hit, { axis: [1, 0, 0] });
      const u = ((t - HEAD) / .35) % 1;
      if (t > HEAD) p.ring(TX - .1, 0, hz, .2 + p.easeOutExpo(u) * .55, .07 * Math.pow(1 - u, 1.5) + .02, Lg, (1 - u) * hit, { axis: [1, 0, 0] });
      p.light(TX - .3, 0, hz, 1.9, Lg, (.8 + .3 * sg) * hit);
    }
    // surge shock rings
    for (const tp of [HEAD, ...SURGES]) {
      const u = p.ph(t, tp, tp + .5);
      if (u <= 0 || u >= 1) continue;
      p.ring(TX - .15, 0, hz, (.4 + p.easeOutExpo(u) * 1.0) * Math.sqrt(bw), .1 * Math.pow(1 - u, 1.5) + .02, Lg, 1.2 * (1 - u), { axis: [1, 0, 0] });
    }
    // last expanding ring after the stop
    const lr = p.ph(t, END - .05, END + .4);
    if (lr > 0 && lr < 1) p.ring(TX - .12, 0, hz, (.75 + p.easeOutExpo(lr) * .5) * Math.sqrt(bw), .07 * Math.pow(1 - lr, 1.5) + .02, Lg, .9 * (1 - lr), { axis: [1, 0, 0] });
    // impact sparks: fast out (harder in a surge), drag, gravity
    const nI = Math.round(p.param('impactSparks') * p.density);
    for (let s = 0; s < nI; s++) {
      const P = .55, ph = p.r(s, 11) * P, cyc = Math.floor((t + ph) / P), age = ((t + ph) % P) / P, born = t - age * P;
      if (born < HEAD || born > END - .05) continue;
      const a = age * P, k = cyc * 18 + s, boost = 1 + 1.2 * surgeAt(born);
      const sp = (3 + p.r(k, 15) * 3) * boost, dx = -.4 - p.r(k, 12) * 1.2, dy = (p.r(k, 13) - .5) * 2, dz = .6 + p.r(k, 14) * 2;
      const nn = Math.hypot(dx, dy, dz);
      const at = tt => { const d = p.drag(sp, 4, tt) / nn; return [TX - .1 + dx * d, dy * d, hz + dz * d - 3.5 * tt * tt]; };
      const q = at(a);
      if (q[2] < 0) continue;
      p.line(q, at(Math.max(0, a - .04)), .04, Lg, 1.1 * (1 - age));
    }
  },
});
