// 雷弧綻爆 / Lightning Arc Burst — pixel version of 00GameDevs "energy-burst" (MIT)
PXFX.define({
  id: 'energy-burst',
  loop: 1.9,
  beats: [{ t: .12, kind: 'burst', power: 1.1 }, { t: .96, kind: 'pulse', power: .4 }, { t: 1.38, kind: 'pulse', power: .3 }],
  view: { r: 2.3, h: 2.3 },
  stage: { ground: 'slate', tiles: true },
  palette: {
    arc: ['#3a3ab8', '#2f5fe8', '#2878ff', '#6aa8ff', '#b8dcff', '#ffffff'],
    halo: ['#2a46c8', '#2878ff', '#5a9cff', '#a8d0ff'],
  },
  timeline: [
    { t: [0, .12], zh: '蓄電：地面中心亮起藍白小核心，先略脹大再急縮成一點（ease-in-back）；腳下光圈加速向內收，8 粒光點被吸向中心', en: 'charge: a small blue-white core at ground level swells slightly, then snaps down to a point (ease-in-back); a ring under it accelerates inward and 8 motes are sucked into the centre' },
    { t: [.12, .2], zh: '爆發：前 2 幀最大最亮，大白閃光；10 道閃電以 ease-out-expo 在 0.04 秒內射到全長 1.45–2.2', en: 'burst: the first 2 frames are the biggest and brightest, a big white flash; 10 arcs shoot to full length 1.45–2.2 in 0.04 s with ease-out-expo' },
    { t: [.2, .6], zh: '閃電叢每 0.055 秒換一次形狀並隨機閃斷；地面光圈 ease-out-expo 擴到半徑 1.6、越擴越細，圈內地面染成淡藍；火花急射後受阻力減速', en: 'the arc bush re-jags every 0.055 s and flickers out at random; the ground ring races out to radius 1.6 (ease-out-expo) and thins, the floor inside is tinted blue; sparks shoot out, then slow under drag' },
    { t: [.55, .85], zh: '每條閃電各自縮短並急速熄滅（ease-in-cubic），只剩細碎火花', en: 'each arc shortens and snaps off (ease-in-cubic), leaving small sparks' },
    { t: [.96, 1.48], zh: '餘電：0.96 秒及 1.38 秒兩次短促的單條電弧閃現（脈衝），然後完全消失', en: 'residual charge: two brief single-arc flickers at 0.96 s and 1.38 s (pulses), then nothing' },
  ],
  layers: [
    { zh: '核心：半徑 0.12 白熱光球＋0.5 藍色光暈，爆發瞬間光暈放大到 1.5', en: 'core: radius-0.12 white-hot orb inside a 0.5 blue halo; the halo blows up to 1.5 on the burst frame' },
    { zh: '電弧：預設 10 條鋸齒閃電（5 層細分，每條 2 根分支），1 像素白芯＋4 倍寬淡藍光暈', en: 'arcs: 10 jagged bolts by default (5 subdivisions, 2 branches each), 1 px white core with a pale-blue halo 4x wider' },
    { zh: '方位平均分佈一圈，仰角 13°–48°，形成向上張開的電叢；長度乘以「電弧範圍」', en: 'evenly spread around the circle at 13°–48° elevation so they form an upward-opening bush; length scales with "arc reach"' },
    { zh: '地面光圈：亮環由半徑 0.25 以 ease-out-expo 擴到 1.6，寬度由 0.12 收到 0.025；圈內地面被藍光染色（不用實心填充）', en: 'ground ring: a bright ring racing from radius 0.25 to 1.6 with ease-out-expo, width shrinking 0.12 → 0.025; the floor inside is light-tinted blue, not filled' },
    { zh: '火花：預設 14 粒藍白像素，阻力曲線向外飛散並略受重力', en: 'sparks: 14 blue-white pixels by default, flying out on a drag curve with a little gravity' },
    { zh: '地面被染成藍色，強度跟隨電弧閃爍', en: 'the ground is tinted blue, pulsing with the arcs' },
  ],
  params: {
    arcs: { zh: '電弧數量', en: 'arc count', min: 3, max: 18, step: 1, value: 10 },
    reach: { zh: '電弧範圍', en: 'arc reach', min: .6, max: 1.5, step: .05, value: 1 },
    branches: { zh: '每條分支數', en: 'branches per arc', min: 0, max: 4, step: 1, value: 2 },
    sparks: { zh: '火花數量', en: 'spark count', min: 0, max: 36, step: 1, value: 14 },
  },
  draw(p, t) {
    const A = this.palette.arc, H = this.palette.halo, TAU = p.TAU;
    const BURST = .12, o = [0, 0, .08], step = Math.floor(t / .055);
    const nA = Math.round(p.param('arcs')), reach = p.param('reach'), nB = Math.round(p.param('branches'));
    let pulse = 0;
    // ----- charge: core swells then snaps to a point, ring and motes pulled in -----
    if (t < BURST) {
      const c = p.ph(t, 0, BURST), s = 1 - p.easeInBack(c, 2.4);
      p.glow(0, 0, .12, .35 * s + .08, H, .5 + .5 * c, { pow: 2 });
      p.orb(0, 0, .12, .03 + .1 * s, A, .7 + .3 * c);
      p.ring(0, 0, .02, .08 + .7 * (1 - p.easeInCubic(c)) * reach, .04, A, .5 + .5 * c);
      const nM = Math.round(8 * p.density);
      for (let k = 0; k < nM; k++) {
        const az = p.r(k, 20) * TAU, d = (.3 + 1.1 * (1 - p.easeInCubic(c))) * (.7 + p.r(k, 21) * .5) * reach;
        p.dot(Math.cos(az) * d, Math.sin(az) * d, .1 + p.r(k, 22) * .5 * (1 - c), A, .5 + .5 * c);
      }
      p.light(0, 0, .3, 1.2, H, .4 + .4 * c);
      return;
    }
    const a = t - BURST;
    // ----- burst flash: biggest and brightest on the first frames -----
    const fl = Math.pow(1 - p.ph(a, 0, .14), 2);
    const core = 1 - p.easeInCubic(p.ph(a, .3, .5));
    if (core > 0) {
      p.glow(0, 0, .12, (.5 + .55 * fl) * core, H, .9 * core + .5 * fl, { pow: 2.2 });
      if (fl > 0) p.glow(0, 0, .3, 1.3 * fl * reach, H, .4 * fl, { pow: 3 });
      p.orb(0, 0, .12, .12 * (1 + .6 * fl) * core, A, core);
    }
    // ----- main arc bush: shoots out (expo), flickers, shortens and snaps off -----
    for (let k = 0; k < nA; k++) {
      const az = k / nA * TAU + p.r(k, 1) * .45, el = .22 + p.r(k, 2) * .62, L = (1.45 + p.r(k, 3) * .75) * reach;
      const grow = p.easeOutExpo(p.ph(a, k * .002, .035 + k * .002));
      const endK = .45 + p.r(k, 4) * .25, life = 1 - p.easeInCubic(p.ph(a, endK - .2, endK));
      if (grow <= 0 || life <= 0) continue;
      if (a > .16 && p.r(k * 7 + step, 6) < .22) continue;            // random drop-outs = flicker
      const l = L * grow * (.55 + .45 * life), ce = Math.cos(el);
      const end = [Math.cos(az) * ce * l, Math.sin(az) * ce * l, .08 + Math.sin(el) * l];
      const I = (.45 + .65 * life) * (1 + .4 * fl);
      p.bolt(o, end, A, { seed: k * 17 + step, jag: .2, depth: 5, branches: nB, w: .045 * (1 + .5 * fl), I, glow: .3 * life * life + .2 * fl });
      pulse = Math.max(pulse, life);
    }
    // ----- residual flickers (pulse beats) -----
    const late = [[.96, 1.05, 3, 1.4], [1.38, 1.47, 7, 1.2]];
    for (const [a0, b0, k, Lr] of late) {
      if (t < a0 || t > b0) continue;
      const az = k / 10 * TAU + p.r(k, 1) * .45, el = .35, L = Lr * reach, f = Math.pow(1 - p.ph(t, a0, b0), 2);
      const end = [Math.cos(az) * Math.cos(el) * L, Math.sin(az) * Math.cos(el) * L, .08 + Math.sin(el) * L];
      p.bolt([Math.cos(az) * .15, Math.sin(az) * .15, .05], end, A, { seed: k * 31 + step, jag: .22, depth: 5, branches: Math.min(1, nB), w: .04, I: .5 + .5 * f, glow: .25 * f });
      pulse = Math.max(pulse, .5 * f + .2);
    }
    // ----- ground ring: races out, thins and fades; lit floor inside -----
    const rk = p.ph(a, 0, .62);
    if (rk < 1) {
      const R = (.25 + 1.35 * p.easeOutExpo(rk)) * reach, fade = Math.pow(1 - rk, 1.5);
      p.ring(0, 0, .02, R, .025 + .1 * (1 - rk), A, .95 * fade + .3 * fl);
      p.light(0, 0, 0, R * 1.1, H, .75 * fade);
    }
    // ----- sparks: fast out, drag, a little gravity -----
    const nS = Math.round(p.param('sparks') * p.density);
    for (let s = 0; s < nS; s++) {
      const t0 = p.r(s, 8) * .06, tt = a - t0, life = .35 + p.r(s, 9) * .3;
      if (tt <= 0 || tt >= life) continue;
      const u = tt / life, az = p.r(s, 10) * TAU, el = .1 + p.r(s, 12) * .9;
      const d = p.drag((4 + p.r(s, 11) * 4) * reach, 6, tt);
      const x = Math.cos(az) * Math.cos(el) * d, y = Math.sin(az) * Math.cos(el) * d, z = .1 + Math.sin(el) * d - 2.5 * tt * tt;
      if (z < .02) continue;
      p.dot(x, y, z, A, 1 - u * .6, tt < .06 ? 2 : 1);
    }
    p.light(0, 0, .3, 2.2 * Math.max(.8, reach), H, .85 * Math.max(core * (1 + .3 * fl), pulse * (.75 + .25 * p.r(step, 13))));
  },
});
