// 星劍焚界 / Starblade Cataclysm — pixel version of 00GameDevs "starblade-cataclysm" (MIT)
// The original runs 14 s; this loop compresses it to 7 s.
PXFX.define({
  id: 'starblade-cataclysm',
  loop: 7,
  beats: [{ t: .6, kind: 'cast', power: .8 }, { t: 3.6, kind: 'hit', power: 1.2 }, { t: 5.4, kind: 'burst', power: 1.1 }],
  view: { r: 3.0, h: 2.8 },
  stage: { ground: 'slate', tiles: true },
  palette: {
    gold: ['#c0682c', '#de922f', '#f4b941', '#ffd35a', '#ffeaa0', '#fffbe8'],
    core: ['#7a1a2a', '#a8242a', '#d0401f', '#f07a28', '#ffc060', '#fff3cc'],
    lava: ['#8e2020', '#c43c1c', '#ec6a22', '#ffa23a', '#ffe08a', '#fffbe8'],
    blade: ['#7a4a22', '#b07a30', '#e0b04a', '#ffd35a', '#fff0b4'],
    smoke: ['#4a4248', '#625a5e', '#7c7274', '#958a8a', '#aea2a0'],
    rock: ['#3e4150', '#545868', '#6a6e7e', '#838796', '#9fa2ae'],
  },
  timeline: [
    { t: [0, .6], zh: '金劍以抖色快速淡入，劍尖朝上；亮光由劍柄加速掃到劍尖，劍腳地面光環向內收縮蓄力', en: 'a golden sword dithers in fast, point up; a glint accelerates from hilt to tip while a ground ring at its foot contracts' },
    { t: [.6, 1.1], zh: '化星：劍尖先爆開，劍身由上而下先快後慢化成金色星粒，地面光環急速擴散', en: 'transformation: the tip bursts first and the blade dissolves top-down, fast then slowing, into gold star motes; the ground ring blasts outward' },
    { t: [.6, 2.4], zh: '星粒分成 4 股：先向外急彈，停一停，再加速收攏到劍上方的空中', en: '4 streams of stars kick outward, hang for a moment, then accelerate together into the air above the sword' },
    { t: [1.9, 2.9], zh: '四瓣核心彈出（超出約 15% 再回彈）：X 形 4 片星光花瓣、紅色火球核心、虛線光環', en: 'the four-petal core pops open with ~15% overshoot: 4 star membranes in an X, a red fireball heart, a dashed halo' },
    { t: [2.9, 3.6], zh: '蓄力：核心及花瓣向內收縮，8 道光芒由外向內加速收攏', en: 'charge: the heart and petals squeeze inward, 8 rays slide in from outside, accelerating' },
    { t: [3.6, 3.9], zh: '命中：核心瞬間脹大，光束射向地面；首幾幀光束最粗最亮，地面衝擊環急速擴散變細，火花高速噴出再被阻力拖慢', en: 'impact: the heart snaps big and the beam hits the ground; thickest and brightest on the first frames, a ground shock ring races out and thins, sparks burst out and drag to a stop' },
    { t: [3.6, 5.4], zh: '命中點先一下急衝，之後越掃越快向右掃過 2.9 單位，燒開發光熔岩裂谷，岩塊沿裂谷彈起', en: 'the hit point lurches, then sweeps right faster and faster over 2.9 units, burning a glowing lava trench; rocks pop up along it' },
    { t: [5.4, 6], zh: '裂谷爆開：光束熄滅，核心一閃後急縮消失；整條裂谷瞬間變寬變亮，熔岩柱沿裂谷噴起再落下，岩塊被拋起', en: 'rift burst: the beam cuts out, the core flashes and collapses; the whole trench widens and flares, lava jets spurt up along it and fall, rocks are thrown up' },
    { t: [6, 7], zh: '裂谷由黃轉暗紅冷卻，煙柱先快後慢上升變淡，岩塊加速沉回地面', en: 'the trench cools from yellow to dark red, smoke rises fast then slow and thins, rocks sink back' },
  ],
  layers: [
    { zh: '金劍：實心劍身（高 1.9，寬 0.14）、護手、劍柄、圓形柄頭，金色金屬漸層', en: 'sword: solid blade (1.9 tall, 0.14 wide), crossguard, grip and round pommel in a gold metal ramp' },
    { zh: '星粒：48 粒（每股 12 粒），沿二次曲線飛行（先急彈、後加速），拖尾長度跟速度成正比，部分為 4 角星', en: 'stars: 48 motes (12 per stream) on quadratic curves (kick out, then accelerate in), trails stretched by speed, some drawn as 4-point stars' },
    { zh: '四瓣核心：4 片淚滴形星膜（長 1.25）排成 X 形，亮邊＋顆粒填充；中心紅火球（半徑 0.42，邊緣亮）＋金色光暈＋8 道閃爍光芒', en: 'four-petal core: 4 teardrop star membranes (1.25 long) in an X, bright rim plus grainy fill; red fireball heart (radius 0.42, bright rim), gold halo, 8 flickering rays' },
    { zh: '光束：白熱核心線＋金色外層，由核心斜射到地面', en: 'beam: white-hot core line inside a gold band, slanting from the core to the ground' },
    { zh: '熔岩裂谷：地面上蜿蜒的鋸齒裂縫，中心亮黃、兩邊橙紅、旁邊細裂紋；越新越亮，爆開時寬度 1.6 倍', en: 'lava trench: a winding jagged crack, bright yellow centre, orange-red edges, fine side cracks; freshest part brightest, 1.6x wide at the burst' },
    { zh: '命中點：火光、火舌卡片、10 條帶阻力及重力的火花；裂谷兩旁 8 塊岩石彈起', en: 'hit point: fire glow, a flame card, 10 sparks with drag and gravity; 8 rocks pop up along both lips of the trench' },
    { zh: '熔岩柱：爆開時 12 道沿裂谷噴起的熔岩線，受重力落回', en: 'lava jets: 12 streaks spurt up along the trench at the burst and fall back with gravity' },
    { zh: '煙：裂谷上 6 團抖色煙球上升淡出', en: 'smoke: 6 dithered puffs rise off the trench and fade' },
  ],
  params: {
    beamWidth: { zh: '光束粗細', en: 'beam width', min: .5, max: 2, step: .1, value: 1 },
    sweepLength: { zh: '掃射距離', en: 'sweep length', min: 1, max: 2.9, step: .1, value: 2.9 },
    trenchWidth: { zh: '裂谷寬度', en: 'trench width', min: .5, max: 2, step: .1, value: 1 },
    stars: { zh: '星粒數量', en: 'star motes', min: 16, max: 96, step: 4, value: 48 },
  },
  draw(p, t) {
    const G = this.palette.gold, CO = this.palette.core, LV = this.palette.lava, BL = this.palette.blade;
    const SM = this.palette.smoke, RK = this.palette.rock;
    const SX = -2.25, C = [-1.05, 0, 2.05];
    const flat = p.mode === '2d', e1 = flat ? [1, 0, 0] : [.924, -.383, 0], nrm = flat ? [0, 1, 0] : [.383, .924, 0];             // petal plane (vertical, facing the viewer side)
    const PL = (a, r) => [C[0] + e1[0] * Math.cos(a) * r, C[1] + e1[1] * Math.cos(a) * r, C[2] + Math.sin(a) * r];
    const wob = x => Math.sin(x * 2.3 + .6) * .16;
    const TR = .6, FORM = 1.9, CH = 2.9, B0 = 3.6, B1 = 5.4;
    const bw = p.param('beamWidth'), SL = p.param('sweepLength'), tw = p.param('trenchWidth');
    const X0 = -.3, X1 = X0 + SL;

    // ----- sword: dither in, glint, dissolve from the tip down (fast first, slowing at the hilt) -----
    const dis = p.ph(t, TR, 1.1), cut = 1.9 * (1 - p.easeOutCubic(dis));
    if (cut > .02) {
      const al = p.easeOutCubic(p.ph(t, 0, .25)), o = { alpha: al };
      const top = Math.min(1.7, cut);
      if (top > .3) {
        p.box(SX - .07, -.025, .3, SX + .07, .025, top, BL, Object.assign({ shadow: false }, o));
        if (al > .5) for (let z = .3; z < top; z += .09) p.shadow(SX, 0, z, .08);
      }
      if (cut >= 1.9) {
        p.tri([SX - .07, .025, 1.7], [SX + .07, .025, 1.7], [SX, 0, 1.9], BL, o);
        p.tri([SX - .07, -.025, 1.7], [SX + .07, -.025, 1.7], [SX, 0, 1.9], BL, o);
      }
      if (cut > .3) p.box(SX - .22, -.05, .24, SX + .22, .05, .3, BL, o);
      if (cut > .24) p.box(SX - .03, -.03, .07, SX + .03, .03, .24, BL, Object.assign({ shadow: false }, o));
      if (cut > .1) p.ball(SX, 0, .06, .06, BL, o);
      const gl = p.easeIn(p.ph(t, .2, .5));
      if (gl > 0 && gl < 1) p.line([SX - .08, .04, .3 + gl * 1.5], [SX + .08, .04, .38 + gl * 1.5], .04, G, 1.2);
      if (t > TR) {
        p.line([SX - .09, 0, cut], [SX + .09, 0, cut], .05, G, 1.3);
        p.glow(SX, 0, cut, .17, G, .6);
      }
      p.light(SX, 0, .5, 1, G, .35 * al + .4 * p.ph(t, .3, TR));
    }
    // ground ring at the sword's foot: contracts while charging, blasts out on the transformation
    if (t > .25 && t < TR + .5) {
      const r = t < TR ? .9 - .75 * p.easeInCubic(p.ph(t, .25, TR)) : .15 + 1.6 * p.easeOutExpo(p.ph(t, TR, TR + .5));
      const u = t < TR ? 0 : p.ph(t, TR, TR + .5);
      p.ring(SX, 0, .02, r, .1 * Math.pow(1 - u, 1.5) + .025, G, (t < TR ? .4 + .6 * p.ph(t, .25, TR) : 1 - u));
    }
    if (t >= TR && t < TR + .2) {                                   // tip burst
      const f = Math.pow(1 - p.ph(t, TR, TR + .2), 2);
      p.glow(SX, 0, 1.75, .3 + .5 * f, G, 1.4 * f);
      p.sparkle(SX, 0, 1.75, Math.round(2 + 4 * f), G, f * 1.2);
    }

    // ----- star streams: kick out, hang, accelerate into the core -----
    const nStar = Math.round(p.param('stars') * p.density);
    const curve = u => .45 * p.easeOutCubic(u / .35) + .55 * u * u * u;
    for (let i = 0; i < nStar; i++) {
      const zz = .06 + (1 - i / nStar) * 1.84, tRel = TR + .5 * (1 - Math.cbrt(zz / 1.9));
      const u = (t - tRel) / 1.3;
      if (u < 0 || u >= 1) continue;
      const k = i % 4, ang = Math.PI / 4 + k * Math.PI / 2, jit = p.r(i, 3) - .5;
      const P0 = [SX + jit * .06, 0, zz], P1 = [SX + Math.cos(ang) * .75 + jit * .2, Math.sin(ang) * .45, 2.1 + jit * .3];
      const P2 = [C[0] + Math.cos(ang) * .3, Math.sin(ang) * .2, C[2] - .1];
      const bz = s => [0, 1, 2].map(c => (1 - s) * (1 - s) * P0[c] + 2 * (1 - s) * s * P1[c] + s * s * P2[c]);
      const q = bz(curve(u)), q0 = bz(curve(Math.max(0, u - .05))), twk = .6 + .4 * Math.sin(t * 13 + i * 2.1);
      p.line(q0, q, .02, G, .55 * twk);
      if (i % 5 === 0) p.sparkle(q[0], q[1], q[2], 1, G, twk);
      else p.dot(q[0], q[1], q[2], G, .75 + .35 * twk);
    }

    // ----- four-petal core: pops open, squeezes while charging, snaps big on the fire, collapses on the burst -----
    const formX = p.ph(t, FORM, 2.5), form = Math.max(0, p.easeOutBack(formX, 2)), formI = Math.min(1, formX * 2.5);
    const charge = t < B0 ? p.easeInCubic(p.ph(t, CH, B0)) : 0, release = t >= B0 ? Math.pow(1 - p.ph(t, B0, B0 + .3), 2) : 0;
    const collapse = p.easeInCubic(p.ph(t, B1 + .02, B1 + .3)), coreOn = formI * (1 - collapse);
    const flashOut = t >= B1 ? Math.pow(1 - p.ph(t, B1, B1 + .22), 2) : 0;
    if (coreOn > 0 || flashOut > 0) {
      const sway = Math.sin(t * 1.4) * .08, size = form * (1 - .15 * charge + .15 * release) * (1 - collapse);
      for (let k = 0; k < 4; k++) {
        const a = Math.PI / 4 + k * Math.PI / 2 + sway * (k % 2 ? 1 : -1), L = 1.25 * size, W = .27 * size;
        const d = [e1[0] * Math.cos(a), e1[1] * Math.cos(a), Math.sin(a)], pp = [e1[0] * -Math.sin(a), e1[1] * -Math.sin(a), Math.cos(a)];
        const at = (s, w) => [C[0] + d[0] * s + pp[0] * w, C[1] + d[1] * s + pp[1] * w, C[2] + d[2] * s + pp[2] * w];
        if (L > .35) p.lquad(at(.32, -W), at(L, -W), at(L, W), at(.24, W), (u, v) => {
          const w = Math.sin(Math.PI * Math.pow(u, .7)), dd = Math.abs(v - .5) * 2;
          if (dd > w) return 0;
          const grain = p.noise(u * 14 + k * 5, v * 6 + t * 2) > .7 ? .6 : 0;
          return dd > w - .2 ? 1 : .16 + grain;
        }, G, coreOn * (.95 + .3 * charge));
      }
      // drifting air stars round the core
      const nAir = Math.round(14 * p.density);
      for (let s = 0; s < nAir; s++) {
        const a = p.r(s, 21) * p.TAU + t * (.3 + p.r(s, 22) * .4), r = (.85 + p.r(s, 23) * .7) * form * (1 - .3 * charge);
        const q = PL(a, r), twk = .5 + .5 * Math.sin(t * 7 + s * 1.9);
        p.dot(q[0] + nrm[0] * (p.r(s, 24) - .5) * .4, q[1] + nrm[1] * (p.r(s, 24) - .5) * .4, q[2], G, (.5 + .5 * twk) * coreOn);
      }
      const R = .42 * form * (1 - .3 * charge + .3 * release) * (1 - collapse) + flashOut * .1;
      if (R > .02) {
        p.glow(C[0], C[1], C[2], (.7 + .25 * release) * coreOn + flashOut * .3, G, (.3 + .3 * charge + .4 * release) * coreOn + flashOut * .5);
        p.shell(C[0], C[1], C[2], R, (nx, ny, nz, rim) => .38 + rim * .75 + (p.noise(nx * 4 + t * 2, nz * 4 - t) - .5) * .5, CO, 1 + .5 * flashOut + .3 * charge, { back: 0 });
        p.ring(C[0], C[1], C[2], .62 * size, .04, G, .8 * coreOn, { axis: nrm, fn: a => (Math.sin(a * 6 + t * 4) > -.2 ? 1 : 0) });
      }
      // rays: slide inward while charging, flicker outward while the beam fires
      for (let k = 0; k < 8 && coreOn > 0; k++) {
        const a = k / 8 * p.TAU;
        if (t < B0 && charge > 0) {
          const ph = (t * 2.2 + p.r(k, 30)) % 1, r0 = R + .08 + (1 - p.easeIn(ph)) * .9;
          p.line(PL(a, r0 + .3), PL(a, r0), .03, G, Math.min(1, charge * 3) * coreOn, { i1: 1, w1: .02 });
        } else if (t >= B0 && t < B1) {
          const len = (.25 + p.r(k + Math.floor(t * 12) * 13, 31) * .3) * (1 + release);
          p.line(PL(a, R + .05), PL(a, R + .05 + len), .03, G, (.45 + .5 * release) * coreOn, { i1: 0 });
        }
      }
      p.light(C[0], 0, 1, 1.3, G, (.3 + .3 * charge) * coreOn);
    }
    // petals breaking into falling stars after the core collapses
    if (t > B1 && t < 6.4) {
      const f = p.ph(t, B1, 6.4), nF = Math.round(16 * p.density);
      for (let s = 0; s < nF; s++) {
        const a = Math.PI / 4 + (s % 4) * Math.PI / 2 + (p.r(s, 41) - .5) * .6, r = (.3 + p.r(s, 42) * .8) * (1 + p.drag(1.5, 4, t - B1));
        const q = PL(a, r);
        p.dot(q[0], q[1], q[2] - f * f * 1.4, G, (1 - f) * (.7 + .4 * p.r(s, 43)), s % 3 ? 1 : 2);
      }
    }

    // ----- beam sweep: a lurch, then faster and faster to the end of the trench -----
    const sx = p.ph(t, B0, B1), sweep = .2 * p.easeOutCubic(sx / .2) + .8 * sx * sx, gx = X0 + SL * sweep;
    const reach = t < B0 ? -99 : gx, a0 = t - B0;
    const st = a0 >= 0 ? Math.pow(1 - p.ph(a0, 0, .16), 2) : 0;
    if (t >= B0 && t < B1) {
      const Gp = [gx, wob(gx), 0];
      p.line(C, Gp, (.42 + st * .28) * bw, G, .55 + st * .3, { pow: 1.2 });
      p.line(C, Gp, .13 * Math.sqrt(bw) * (1 + st), G, 1.35);
      p.glow(Gp[0], Gp[1], .1, .55 + st * .35, LV, 1 + st * .4);
      p.card(Gp[0], Gp[1], .32, .5, .62, (u, v) => {                    // flame tongue at the hit
        const w = (1 - (v + 1) / 2) * .9 * (.8 + .2 * Math.sin(t * 30 + v * 4));
        return Math.abs(u + Math.sin(v * 3 + t * 20) * .15) < w ? (Math.abs(u) < w * .4 ? 1 : .6) : 0;
      }, LV, 1);
      const nS = Math.round(10 * p.density);
      for (let s = 0; s < nS; s++) {
        const life = .35 + p.r(s, 51) * .25, cyc = a0 / life + p.r(s, 52), k = Math.floor(cyc), u = cyc - k, sd = s * 7 + k;
        const vx = -.4 + p.r(sd, 53) * 1.6, vy = (p.r(sd, 54) - .5) * 2, vz = 1.6 + p.r(sd, 55) * 1.5, age = u * life;
        const d = p.drag(2, 3.5, age), dp = p.drag(2, 3.5, Math.max(0, age - .04));
        const x0 = X0 + SL * (.2 * p.easeOutCubic(Math.max(0, a0 - age) / 1.8 / .2) + .8 * ((Math.max(0, a0 - age) / 1.8) ** 2));
        const z = vz * d - 4.5 * age * age, zp = vz * dp - 4.5 * Math.max(0, age - .04) ** 2;
        if (z < 0) continue;
        p.line([x0 + vx * d, wob(x0) + vy * d, z], [x0 + vx * dp, wob(x0) + vy * dp, zp], .04, LV, 1 - u * .6);
      }
      p.light(gx, Gp[1], .3, 1.6, LV, .95 + st * .5);
    }
    // impact: ground shock ring and a spark burst where the beam lands
    if (a0 >= 0 && a0 < .6) {
      const u = p.ph(a0, 0, .5);
      if (u < 1) p.ring(X0, wob(X0), .03, .2 + p.easeOutExpo(u) * 1.5, .14 * Math.pow(1 - u, 1.5) + .025, G, 1.1 * (1 - u));
      const nB = Math.round(14 * p.density);
      for (let s = 0; s < nB; s++) {
        const life = .35 + p.r(s, 71) * .25;
        if (a0 > life) continue;
        const ang = p.r(s, 72) * p.TAU, sp = 5 + p.r(s, 73) * 5, d = p.drag(sp, 7, a0), dp = p.drag(sp, 7, Math.max(0, a0 - .04));
        const dir = [Math.cos(ang) * .8, Math.sin(ang) * .8, .5 + p.r(s, 74) * .6];
        const z = dir[2] * d - 4 * a0 * a0;
        if (z < 0) continue;
        p.line([X0 + dir[0] * d, wob(X0) + dir[1] * d, z], [X0 + dir[0] * dp, wob(X0) + dir[1] * dp, dir[2] * dp - 4 * Math.max(0, a0 - .04) ** 2], .045, G, 1.1 * (1 - a0 / life));
      }
    }

    // ----- lava trench -----
    const cool = 1 - p.ph(t, 5.8, 6.95), a5 = t - B1, erupt = a5 >= 0 ? Math.pow(1 - p.ph(a5, 0, .5), 2) : 0;
    if (t > B0 && cool > 0) {
      const Xc = (X0 + X1) / 2, R = Math.hypot(SL / 2 + .1, .3 + .35 * tw * 1.6);
      const widen = 1 + .6 * erupt;
      p.decal(Xc, 0, 0, R, (x, y) => {
        const wx = x + Xc;
        if (wx < X0 || wx > reach + .02) return 0;
        const d = Math.abs(y - wob(wx)), taper = Math.min(1, (wx - X0) / .25, (reach - wx) / .08 + .35);
        const w = (.11 + p.noise(wx * 4, 3.7) * .07) * tw * widen * Math.max(.2, taper);
        const hot = t < B1 ? p.clamp(1 - (reach - wx) / 2.2, .35, 1) : 1;
        if (d < w * .45) return (.75 + .3 * hot + .15 * erupt) * cool;
        if (d < w) return (.5 + .25 * hot + .2 * erupt) * cool;
        if (d < w + .16 * tw && p.noise(wx * 9, y * 9) > .7) return .38 * cool * hot;
        return 0;
      }, LV, .7 + .3 * cool);
      for (let k = 0; k < 6; k++) {
        const x = p.lerp(X0 + .2, X1 - .1, k / 5);
        if (x < reach) p.light(x, wob(x), .1, .8 + .5 * erupt, LV, (.55 + .5 * erupt) * cool);
      }
      // rocks pop up (overshoot) as the trench reaches them, are thrown on the burst, sink back at the end
      const nR = Math.round(8 * p.density);
      for (let k = 0; k < nR; k++) {
        const x = X0 + .15 + ((k * .618 + p.r(k, 61) * .1) % 1) * (SL - .3), side = k % 2 ? 1 : -1;
        if (x > reach) continue;
        const up = Math.max(0, p.easeOutBack(Math.min(1, (reach - x) / .3), 2.2)) * (1 - p.easeInCubic(p.ph(t, 6.3, 6.95)));
        const v = 1.2 + p.r(k, 64) * 1.2, jump = a5 > 0 ? Math.max(0, v * a5 - 4.5 * a5 * a5) : 0;
        p.rock(x, wob(x) + side * (.27 * Math.max(1, tw) + p.r(k, 62) * .08), -.12 + .16 * up + jump, .08 + p.r(k, 63) * .05, RK, k);
      }
      // smoke rising from the trench: fast, then slowing
      const nSm = Math.round(6 * p.density);
      for (let s = 0; s < nSm; s++) {
        const f = (s + .5) / nSm, x0 = X0 + .3 * Math.min(1, SL) + f * (SL - .5 * Math.min(1, SL)), tb = B0 + f * (B1 - B0);
        const u = p.ph(t, tb + .2, Math.min(tb + 2.2, 6.95));
        if (u <= 0 || u >= 1) continue;
        p.ball(x0 + u * .3, wob(x0) + .1, .25 + p.drag(3, 1.8, u * 2), .14 + u * .2, SM, { alpha: (1 - u) * .75, rough: .5, shadow: false, seed: s });
      }
    }
    // rift burst: lava jets spurt along the whole trench and fall back
    if (a5 >= 0 && a5 < 1.2) {
      const nJ = Math.round(12 * p.density);
      for (let j = 0; j < nJ; j++) {
        const x = X0 + .1 + p.r(j, 81) * (SL - .2), age = a5 - p.r(j, 82) * .08, v0 = 2.6 + p.r(j, 83) * 2.2;
        if (age <= 0) continue;
        const z = v0 * age - 5 * age * age, zp = v0 * Math.max(0, age - .05) - 5 * Math.max(0, age - .05) ** 2, y = wob(x) + (p.r(j, 84) - .5) * .2 * tw;
        if (z < 0) continue;
        p.line([x, y, z], [x, y, Math.max(0, zp - .05)], .07, LV, 1.1 * (1 - age / 1.2));
        p.dot(x, y, z, LV, 1, 2);
      }
      if (erupt > 0) for (let k = 0; k < 5; k++) { const x = X0 + (k + .5) / 5 * SL; p.glow(x, wob(x), .1, .2 + .25 * erupt, LV, .9 * erupt); }
    }
  },
});
