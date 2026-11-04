// 星環聚爆 / Astral Ring Detonation — pixel version of 00GameDevs "astral-convergence" (MIT)
PXFX.define({
  id: 'astral-convergence',
  loop: 3.2,
  beats: [{ t: .02, kind: 'cast', power: .5 }, { t: 1.05, kind: 'burst', power: 1.3 }],
  view: { r: 2.1, h: 2.5 },
  stage: { ground: 'void' },
  palette: {
    star: ['#5b4fb0', '#7f72d8', '#a196f0', '#c1b8ff', '#e6e1ff', '#ffffff'],
    dim: ['#4a3f98', '#6a5ec8', '#9a8fe8'],
  },
  timeline: [
    { t: [0, .2], zh: '離地 1.15 處的星球籠以 ease-out-back 彈出（5 條大圓環，半徑 1.15，略衝過頭再回彈），環上 10 顆星以連線相接，外圍一層星塵', en: 'a star cage pops in 1.15 above the ground with ease-out-back (5 great-circle rings, radius 1.15, overshoot and settle); 10 stars on the rings joined by constellation lines; a shell of star dust around it' },
    { t: [.12, 1.05], zh: '聚攏：籠子先微微向外張（ease-in-back）再加速向中心收縮到半徑 0.18；各環轉速越來越快，中心光越來越亮', en: 'gathering: the cage first eases slightly outward (ease-in-back), then accelerates inward to radius 0.18; each ring spins faster and faster and the centre brightens' },
    { t: [1.05, 1.11], zh: '聚爆：前 2 幀最大最亮，中心大白閃＋8 道星芒', en: 'detonation: the first 2 frames are the biggest and brightest, a big white flash with 8 star rays' },
    { t: [1.05, 1.5], zh: '水平衝擊環與地面光環以 ease-out-expo 急擴、越擴越細', en: 'a horizontal shock ring and a ground ring race out with ease-out-expo, thinning as they grow' },
    { t: [1.05, 1.85], zh: '10 片菱形星芒帶尾跡急射而出、受阻力減速並淡出', en: '10 diamond star-shards shoot out with trails, slow under drag and fade' },
    { t: [1.1, 3.0], zh: '一團星點球由半徑 0.25 急擴到 1.7 後慢慢飄散、略往下沉，閃爍後急速收走', en: 'a ball of star dots bursts from radius 0.25 to 1.7, then drifts and sinks slightly, twinkling, and snaps away at the end' },
  ],
  layers: [
    { zh: '星環：預設 5 條 1 像素粗的發光圓環，法線方向各異並隨時間加速旋轉', en: 'rings: 5 glowing circles by default, 1 px thick, each with its own tilted normal that spins faster over time' },
    { zh: '星：每環 2 顆 4 角星（像素十字＋菱形卡片），沿環滑動，彼此以暗線連成星座', en: 'stars: 2 four-point stars per ring (pixel cross plus diamond card) sliding along the ring, linked by dim constellation lines' },
    { zh: '星塵：40 粒像素分佈在外層球殼上閃爍，隨籠子一起收縮', en: 'star dust: 40 pixels on an outer spherical shell, twinkling, shrinking with the cage' },
    { zh: '星芒碎片：預設 10 片，兩段漸粗再漸細的線組成的長菱形，後面拖一條細尾跡', en: 'star shards: 10 by default, long diamonds built from two tapered segments, each dragging a thin trail' },
    { zh: '餘輝：預設 60 粒星點組成的球殼向外擴散閃爍，大小乘以「爆炸範圍」；地面淡紫色光', en: 'afterglow: a 60-dot spherical shell by default, expanding and twinkling, scaled by "blast radius"; pale lavender ground light' },
  ],
  params: {
    rings: { zh: '星環數量', en: 'ring count', min: 2, max: 8, step: 1, value: 5 },
    shards: { zh: '星芒碎片數量', en: 'star shards', min: 0, max: 20, step: 1, value: 10 },
    afterglow: { zh: '餘輝星點數量', en: 'afterglow dots', min: 0, max: 120, step: 1, value: 60 },
    blastRadius: { zh: '爆炸範圍', en: 'blast radius', min: .6, max: 1.4, step: .05, value: 1 },
  },
  draw(p, t) {
    const S = this.palette.star, DM = this.palette.dim, TAU = p.TAU;
    const C = [0, 0, 1.15], BOOM = 1.05, nR = Math.round(p.param('rings')), BR = p.param('blastRadius');
    const basis = n => {
      const l = Math.hypot(n[0], n[1], n[2]) || 1, x = n[0] / l, y = n[1] / l, z = n[2] / l;
      const a = Math.abs(z) > .9 ? [1, 0, 0] : [0, 0, 1];
      let e1 = [y * a[2] - z * a[1], z * a[0] - x * a[2], x * a[1] - y * a[0]];
      const l1 = Math.hypot(e1[0], e1[1], e1[2]) || 1; e1 = e1.map(v => v / l1);
      return [e1, [y * e1[2] - z * e1[1], z * e1[0] - x * e1[2], x * e1[1] - y * e1[0]]];
    };
    const star = (u, v) => { const a = Math.abs(u), b = Math.abs(v); return a * 3.5 + b < 1 || b * 3.5 + a < 1 ? 1 : a + b < .45 ? .8 : 0; };
    // ----- converging cage: pops in, eases out, then accelerates inward while spinning up -----
    if (t < BOOM) {
      const g = p.ph(t, .12, BOOM), sh = p.easeInBack(g, 1.3), R = 1.15 * (1 - .84 * sh), app = p.easeOutBack(p.ph(t, 0, .2), 2);
      const I = Math.min(1, p.ph(t, 0, .08) * 2) * (1 + .4 * g * g);
      const spinX = g * g * g * 6;                                            // extra angle: spin speeds up into the boom
      const stars = [];
      for (let k = 0; k < nR; k++) {
        const th = .35 + k * 2.75 / nR + t * (.6 + k * .15) + spinX * (1 + k * .2), ph = k * 6.3 / nR + t * (.4 + .1 * k) + spinX * .5;
        const axis = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];
        p.ring(C[0], C[1], C[2], R * app, .045, S, I * .95, { axis });
        const [e1, e2] = basis(axis);
        for (let j = 0; j < 2; j++) {
          const a = j * Math.PI + k + t * (1.4 + k * .3) + spinX * 2, ca = Math.cos(a) * R * app, sa = Math.sin(a) * R * app;
          stars.push([C[0] + e1[0] * ca + e2[0] * sa, C[1] + e1[1] * ca + e2[1] * sa, C[2] + e1[2] * ca + e2[2] * sa]);
        }
      }
      for (let k = 0; k < stars.length; k++) {
        const a = stars[k], b = stars[(k * 3 + 1) % stars.length];
        p.line(a, b, .02, DM, .55 * I);
      }
      stars.forEach((s, k) => {
        p.card(s[0], s[1], s[2], .2, .2, star, S, I);
        p.sparkle(s[0], s[1], s[2], 1 + (k % 2), S, I);
      });
      const nD = Math.round(40 * p.density);
      for (let k = 0; k < nD; k++) {
        const y = 1 - (k + .5) / nD * 2, rr = Math.sqrt(1 - y * y), a = k * 2.39996 + t * .5 + spinX;
        const Rd = (R * 1.3 + .08) * app, tw = .45 + .55 * Math.max(0, Math.sin(t * 9 + k * 1.7));
        p.dot(C[0] + Math.cos(a) * rr * Rd, C[1] + Math.sin(a) * rr * Rd, C[2] + y * Rd, S, I * tw * .9);
      }
      p.glow(C[0], C[1], C[2], .2 + .3 * g * g, S, .5 + .7 * g * g * g);
    }
    // ----- detonation -----
    const a = t - BOOM;
    if (a >= 0) {
      const fl = Math.pow(1 - p.ph(a, 0, .18), 2);
      if (fl > 0) {
        p.glow(C[0], C[1], C[2], (.25 + .9 * fl) * BR, S, 1.5 * fl, { pow: 1.6 });
        p.orb(C[0], C[1], C[2], .16 * fl + .02, S, fl);
        for (let r = 0; r < 8; r++) {
          const ang = r / 8 * TAU + .2, len = (.9 + p.r(r, 20) * .8) * (.3 + fl) * BR, c = Math.cos(ang);
          p.line(C, [C[0] + c * len * .6, C[1] - c * len * .6, C[2] + Math.sin(ang) * len], .1, S, 1.3 * fl, { w1: .01, i1: .4 });
        }
      }
      const rk = p.ph(a, 0, .5);
      if (rk < 1) {
        const e = p.easeOutExpo(rk), w = .02 + .09 * Math.pow(1 - rk, 2), f = Math.pow(1 - rk, 1.5);
        p.ring(C[0], C[1], C[2], (.2 + 1.6 * e) * BR, w, S, 1.2 * f);
        p.ring(0, 0, .02, (.2 + 1.4 * e) * BR, w, DM, f);
      }
      // diamond shards: shoot out, drag, fade
      const nS = Math.round(p.param('shards') * p.density);
      for (let k = 0; k < nS; k++) {
        const life = .7 + p.r(k, 1) * .2, u = a / life;
        if (u >= 1) continue;
        const az = k / nS * TAU + p.r(k, 2) * .5, el = (p.r(k, 3) - .35) * 1.3;
        const d = [Math.cos(el) * Math.cos(az), Math.cos(el) * Math.sin(az), Math.sin(el)];
        const dist = .15 + p.drag(9 * BR, 5, a), len = .38 * (1 + .6 * fl);
        const P0 = q => [C[0] + d[0] * q, C[1] + d[1] * q, C[2] + d[2] * q];
        const I = 1 - u * u * u;
        p.line(P0(dist - len * .5), P0(dist), .005, S, I, { w1: .1 });
        p.line(P0(dist), P0(dist + len * .5), .1, S, I, { w1: .005 });
        p.line(P0(Math.max(0, dist - len * 1.6 - .6 * fl)), P0(dist - len * .5), .01, DM, .1, { i1: .6 * I });
      }
      // expanding dot sphere: bursts out, drifts, sinks, snaps away
      const nA = Math.round(p.param('afterglow') * p.density);
      const sp = p.ph(a, .02, 1.9), fade = 1 - p.easeInCubic(p.ph(a, .9, 1.9));
      if (sp > 0 && fade > 0 && nA > 0) {
        const Rd = (.25 + 1.2 * p.easeOutExpo(p.ph(a, .02, .7)) + .25 * sp) * BR;
        for (let k = 0; k < nA; k++) {
          const y = 1 - (k + .5) / nA * 2, rr = Math.sqrt(1 - y * y), ang = k * 2.39996 + a * .4;
          const jit = .85 + p.r(k, 4) * .3, tw = Math.max(0, Math.sin(a * 11 + k * 2.3));
          const zz = C[2] + y * Rd * jit - sp * sp * .25;
          if (zz < .02) continue;
          p.dot(C[0] + Math.cos(ang) * rr * Rd * jit, C[1] + Math.sin(ang) * rr * Rd * jit, zz, S, fade * (.35 + .65 * tw));
        }
      }
    }
    const gl = t < BOOM ? .3 + .5 * Math.pow(p.ph(t, 0, BOOM), 3) : 1.2 * Math.pow(1 - p.ph(t, BOOM, 2.6), 2);
    p.light(0, 0, C[2], 1.8 * Math.max(1, BR), S, gl * p.easeOutCubic(p.ph(t, 0, .2)));
  },
});
