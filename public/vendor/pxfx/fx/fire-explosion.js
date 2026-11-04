// 白熱炎爆 / White-Hot Fireburst — pixel version of 00GameDevs "fire-explosion" (MIT)
PXFX.define({
  id: 'fire-explosion',
  loop: 2.8,
  beats: [{ t: 0, kind: 'burst', power: 1.2 }],
  view: { r: 2.35, h: 2.5 },
  stage: { ground: 'stone', tiles: true },
  palette: {
    fire: ['#a8281f', '#d8401f', '#ff5c26', '#ff9440', '#ffcf78', '#fff6dc'],
    hot: ['#ff9440', '#ffc46a', '#ffe7a8', '#fff6dc', '#ffffff'],
    flame: ['#a8281f', '#e0461f', '#ff5c26', '#ff9440', '#ffcf78'],
    ember: ['#2a2230', '#3a2c36', '#4e3236', '#c4441e', '#ff7a32'],
    smoke: ['#2a2530', '#39323c', '#4a424c', '#5d5560', '#716870'],
    dust: ['#6c6470', '#857c86', '#9d949c', '#b6aeb2', '#cec7c8'],
    halo: ['#ff7a32', '#ffa850', '#ffd890', '#fff6dc'],
  },
  timeline: [
    { t: [0, .06], zh: '起爆：前 2 幀最大最亮，半徑 1.9 的白熱閃光＋8 道星芒，火球一出現已有約 0.8 大小，整團純白', en: 'detonation: the first 2 frames are the biggest and brightest, a radius-1.9 white flash with 8 star rays; the fireball appears already ~0.8 in size, pure white' },
    { t: [0, .22], zh: '火球以 ease-out-expo 急脹到約 1.1，閃光在 0.16 秒內收縮消失', en: 'the fireball snaps out to ~1.1 with ease-out-expo; the flash collapses within 0.16 s' },
    { t: [.02, .55], zh: '火星帶煙跡急射而出、受阻力減速再受重力下墜；地面火浪急衝後減速並越擴越細；灰煙貼地滾出、先快後慢', en: 'sparks shoot out with smoke trails, slow down under drag and fall with gravity; ground fire ripples race out, slow down and thin as they grow; grey smoke rolls along the floor, fast then slow' },
    { t: [.15, 1.0], zh: '火球由下往上冷卻：白→橙→深灰煙團，受光面留下橙色裂邊；整團上升先快後慢', en: 'the fireball cools bottom-up: white → orange → dark smoke lobes with orange rims on the lit side; it rises fast, then slows' },
    { t: [.9, 1.75], zh: '煙團縮小並急速收走（ease-in-cubic），零星餘燼飄落', en: 'smoke lobes shrink and collapse quickly (ease-in-cubic); a few embers flutter down' },
    { t: [.85, 2.5], zh: '地面六角形熔岩裂紋 0.07 秒內亮起，長時間發光後迅速熄滅', en: 'a hexagonal lava-crack decal flares on within 0.07 s, glows for a long while, then dies quickly' },
  ],
  layers: [
    { zh: '火球：16 顆實心球（半徑 0.34–0.54 × 爆炸半徑）堆成半球形雲團，每顆依高度在 熱白／橙／餘燼／煙 四組色階之間切換', en: 'fireball: 16 solid lobes (radius 0.34–0.54 x blast radius) packed into a billowing dome; each lobe steps through hot-white, orange, ember and smoke ramps by its height' },
    { zh: '餘燼色階：暗面為深灰紫，受光面直接跳成橙色，做出煙團上的發光裂邊', en: 'ember ramp: dark violet-grey in shadow, jumps to orange on the lit side to fake glowing cracks on the smoke' },
    { zh: '起爆閃光：大光暈＋8 道星芒線，(1−進度)² 收縮', en: 'detonation flash: big halo plus 8 star-ray lines, shrinking with (1 − progress)²' },
    { zh: '火星：預設 14 粒，阻力減速＋重力的亮點，後方 5 節灰色煙跡，前 0.15 秒煙跡為橙色', en: 'sparks: 14 by default, drag + gravity dots with 5-segment grey smoke trails (orange for the first 0.15 s)' },
    { zh: '地面火浪：預設 3 條帶噪聲的同心波紋貼花，ease-out-expo 擴到半徑 1.9，越擴越細並淡出', en: 'ground fire ripples: 3 noisy concentric bands by default, ease-out-expo out to radius 1.9, thinning and fading' },
    { zh: '貼地煙環：預設 14 顆淺灰小煙球沿圓周以阻力曲線滾到半徑約 2，再抖色淡出', en: 'floor smoke ring: 14 light-grey puffs by default roll out on a drag curve to radius ~2 and dither away' },
    { zh: '焦痕：地面陰影圈＋半徑 0.95 的六角格裂紋，格線橙色發光', en: 'scorch: dark ground blob plus a radius-0.95 hex-cell crack pattern with orange glowing seams' },
    { zh: '光：起爆時地面被大範圍染成橙色，之後跟隨火浪與裂紋', en: 'light: a wide orange light pool at detonation, then following the ripples and cracks' },
  ],
  params: {
    blastRadius: { zh: '爆炸半徑', en: 'blast radius', min: .6, max: 1.4, step: .05, value: 1 },
    sparks: { zh: '火星數量', en: 'spark count', min: 0, max: 36, step: 1, value: 14 },
    ripples: { zh: '地面火浪圈數', en: 'fire ripples', min: 0, max: 5, step: 1, value: 3 },
    smokeRing: { zh: '貼地煙團數量', en: 'floor smoke puffs', min: 0, max: 28, step: 1, value: 14 },
  },
  draw(p, t) {
    const P = this.palette, F = P.fire;
    const TAU = p.TAU, B = p.param('blastRadius');
    // hex-cell distance to the cell border (pointy-top hexes of circumradius s)
    const hexEdge = (x, y, s) => {
      const q = (Math.sqrt(3) / 3 * x - y / 3) / s, r = (2 / 3 * y) / s, cy = -q - r;
      let rx = Math.round(q), ry = Math.round(cy), rz = Math.round(r);
      const dx = Math.abs(rx - q), dy = Math.abs(ry - cy), dz = Math.abs(rz - r);
      if (dx > dy && dx > dz) rx = -ry - rz; else if (dy <= dz) rz = -rx - ry;
      const px = Math.abs(x - s * Math.sqrt(3) * (rx + rz / 2)), py = Math.abs(y - s * 1.5 * rz);
      return s * .866 - Math.max(px, px * .5 + py * .866);
    };

    // ----- detonation flash: biggest and brightest on the first frames, collapses fast -----
    const fl = Math.pow(1 - p.ph(t, 0, .16), 2);
    const cz0 = .85 * B;
    if (fl > 0) {
      p.glow(0, 0, cz0, (.55 + .95 * fl) * B, P.halo, 1.5 * fl, { pow: 1.6 });
      for (let r = 0; r < 8; r++) {
        const az = r / 8 * TAU + .2, el = -.15 + p.r(r, 22) * 1.1, len = (1.5 + p.r(r, 21) * 1.0) * (.3 + fl) * B;
        const d = [Math.cos(az) * Math.cos(el), Math.sin(az) * Math.cos(el), Math.sin(el)];
        p.line([0, 0, cz0], [d[0] * len, d[1] * len, Math.max(.05, cz0 + d[2] * len)], .16 * B, P.hot, 1.4 * fl, { w1: .01, i1: .45 });
      }
    }

    // ----- billowing fireball: snaps out (expo), rises fast then slow, collapses at the end -----
    const E = (.62 + .48 * p.easeOutExpo(p.ph(t, 0, .22))) * B;
    const cz = cz0 + p.drag(1.1 * Math.sqrt(B), 1.6, t - .25);
    const spread = 1 + .3 * p.easeOutCubic(p.ph(t, .3, 1.7));
    const hot = 1 - p.ph(t, .04, .4);
    for (let k = 0; k < 16; k++) {
      const az = k * 2.39996 + p.r(k, 1) * .5, el = -.25 + p.r(k, 2) * 1.15, hf = (el + .25) / 1.15;
      const ce = Math.cos(el), dist = (.32 + p.r(k, 3) * .3) * E * spread;
      const x = Math.cos(az) * ce * dist, y = Math.sin(az) * ce * dist, z = cz + Math.sin(el) * dist;
      const gone = p.easeInCubic(p.ph(t, .95 + p.r(k, 6) * .25, 1.55 + p.r(k, 6) * .3));
      if (gone >= 1) continue;
      const rad = (.34 + p.r(k, 4) * .2) * E * (1 + .06 * Math.sin(t * 15 + k * 2)) * (1 - .35 * p.ph(t, 1.0, 1.8)) * (1 - .6 * gone);
      const heat = 1 - p.ph(t, .1 + hf * .22 + p.r(k, 5) * .08, .62 + hf * .45 + p.r(k, 5) * .1);
      const ramp = heat > .78 ? P.hot : heat > .52 ? P.flame : heat > .2 ? P.ember : P.smoke;
      p.ball(x, y, z + gone * .3, rad, ramp, { alpha: 1 - gone, rough: heat < .52 ? .25 : 0, seed: k, lit: heat > .78 ? .15 + .3 * fl : 0 });
    }
    if (hot > 0) p.glow(0, 0, cz, 1.3 * E * (.55 + .45 * hot), P.halo, .95 * hot * hot, { pow: 2.6 });

    // ----- ground fire ripples: shoot out (expo), thin and fade as they grow -----
    const nR = Math.round(p.param('ripples')), g = p.ph(t, .01, .58), rip = Math.pow(1 - g, 1.4);
    if (nR > 0 && g > 0 && rip > 0) {
      const R0 = (.55 + 1.35 * p.easeOutExpo(g)) * B, th = 1 - .6 * g, gap = .21 * (.7 + .3 * B);
      p.decal(0, 0, 0, R0 + .25 * B, (x, y, rho, ang) => {
        const d = R0 + (p.noise(ang * 2.2 + 3, rho * 1.5) - .5) * .45 * B - rho;
        if (d < -.02) return 0;
        if (d < .1 * th) return 1;
        for (let j = 1; j < nR; j++) {
          const c = j * gap + .04, w = .032 * th * (1 - j * .1);
          if (Math.abs(d - c) < w) return Math.max(.35, .85 - j * .15);
        }
        return 0;
      }, F, .95 * rip);
    }

    // ----- floor smoke ring: rolls out on a drag curve, dithers away -----
    const nP = Math.round(p.param('smokeRing') * p.density);
    for (let k = 0; k < nP; k++) {
      const u = p.ph(t, .06, 1.05 + p.r(k, 7) * .3);
      if (u <= 0 || u >= 1) continue;
      const a = k / nP * TAU + p.r(k, 8) * .4, rr = (.55 + p.drag(5.2, 3.4, t - .06)) * B;
      p.ball(Math.cos(a) * rr, Math.sin(a) * rr, .12 + p.easeOutCubic(u) * .3, (.16 + p.r(k, 9) * .08) * (.8 + p.easeOutCubic(u) * 1.3) * Math.sqrt(B), P.dust,
        { alpha: .85 * (1 - u * u), rough: .6, shadow: false, seed: k, lit: .15 });
    }

    // ----- sparks with smoke trails: fast out, drag, gravity -----
    const nS = Math.round(p.param('sparks') * p.density);
    for (let s = 0; s < nS; s++) {
      const t0 = .01 + p.r(s, 1) * .06, tau = t - t0, life = .6 + p.r(s, 2) * .45;
      if (tau <= 0 || tau >= life) continue;
      const az = p.r(s, 3) * TAU, el = .4 + p.r(s, 4) * .85, sp = (6 + p.r(s, 5) * 3.5) * Math.sqrt(B), g2 = 5.5;
      const dx = Math.cos(el) * Math.cos(az), dy = Math.cos(el) * Math.sin(az), dz = Math.sin(el);
      const sx = Math.cos(az) * .45 * B, sy = Math.sin(az) * .45 * B, sz = cz0 + .05;
      const at = tt => { const d = p.drag(sp, 3.4, tt); return [sx + dx * d, sy + dy * d, sz + dz * d - .5 * g2 * tt * tt]; };
      const pts = [];
      for (let j = 0; j < 6; j++) pts.push(at(Math.max(0, tau - j * .04)));
      const u = tau / life, head = pts[0];
      if (head[2] < 0) continue;
      p.trail(pts, .05, .02, tau < .15 ? F : P.dust, .85 * (1 - u), .1);
      p.dot(head[0], head[1], head[2], F, 1 - u * .4, tau < .12 ? 2 : 1);
    }

    // ----- falling embers: drift out, flutter down with gravity -----
    const nE = Math.round(14 * p.density);
    for (let e = 0; e < nE; e++) {
      const u = p.ph(t, .45 + p.r(e, 11) * .3, 1.4 + p.r(e, 12) * .4);
      if (u <= 0 || u >= 1) continue;
      const a = p.r(e, 13) * TAU + Math.sin(u * 7 + e) * .12, rr = (.5 + p.r(e, 14) * 1.1) * B + p.easeOutCubic(u) * .35;
      const z = 1.6 * (.5 + p.r(e, 15) * .6) * (1 - u * u) * (.6 + .4 * B) + .05;
      const fl2 = (Math.floor(t * 20 + e) % 3) ? 1 : .55;
      p.dot(Math.cos(a) * rr, Math.sin(a) * rr, z, F, (1 - u) * .9 * fl2);
    }

    // ----- scorch and hex lava cracks: flare on fast, hold, then die quickly -----
    const scorch = p.env(t, .4, .7, 2.0, 2.55);
    if (scorch > .1) p.shadow(0, 0, 0, .95 * B * Math.min(1, scorch + .3), 1);
    const crack = p.ph(t, .85, .92) * (1 - p.easeInCubic(p.ph(t, 1.0, 2.5)));
    if (crack > 0) {
      const CR = .98 * B;
      p.decal(0, 0, 0, CR, (x, y, rho) => {
        const w = (p.noise(x * 3 + 5, y * 3) - .5) * .08;
        const e = hexEdge(x + w, y - w, .2);
        if (e > .028) return 0;
        const fall = 1 - (rho / CR) * (rho / CR);
        return fall * (e < .014 ? 1 : .55);
      }, F, crack * (1.05 + .4 * Math.pow(1 - p.ph(t, .85, 1.2), 2)));
    }

    // ----- light -----
    p.light(0, 0, .8, 2.6 * Math.max(.7, B), F, Math.max(1.1 * fl, .95 * hot, .55 * rip, .4 * crack));
  },
});
