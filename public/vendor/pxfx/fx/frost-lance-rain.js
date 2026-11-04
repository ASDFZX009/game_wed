// 霜矛落陣 / Falling Frost Spear Array — pixel version of 00GameDevs "frost-lance-rain" (MIT)
PXFX.define({
  id: 'frost-lance-rain',
  loop: 2.4,
  beats: [
    { t: .3, kind: 'hit', power: .6 }, { t: .44, kind: 'hit', power: .45 }, { t: .6, kind: 'hit', power: .5 }, { t: .72, kind: 'hit', power: .45 },
    { t: .86, kind: 'hit', power: .5 }, { t: 1.0, kind: 'hit', power: .5 }, { t: 1.16, kind: 'hit', power: .9 },
  ],
  view: { r: 2.3, h: 2.6 },
  stage: { ground: 'stone', tiles: true },
  palette: {
    ice: ['#3e5a8c', '#5e8cc0', '#8ec0e6', '#a9dfff', '#e2f6ff', '#ffffff'],
    frost: ['#5a8cc8', '#7ab8e8', '#a9dfff', '#e2f6ff', '#ffffff'],
  },
  timeline: [
    { t: [0, .86], zh: '7 支冰槍分 7 次（0、0.14、0.3、0.42、0.56、0.7、0.86 秒）由畫面上方垂直落下；超過 7 支時第 8 支起兩兩同時落下。每支下落 0.3 秒，越落越快（高度 ∝ 1 − u^2.5），速度越快冷光尾越長', en: '7 ice spears drop in 7 waves (0, 0.14, 0.3, 0.42, 0.56, 0.7, 0.86 s) from above the frame; above 7, extra spears land in pairs with the same waves. Each falls for 0.3 s, accelerating (height ∝ 1 − u^2.5), the cold streak lengthening with speed' },
    { t: [.3, 1.16], zh: '每支冰槍槍尖插進地面（0.3、0.44、0.6、0.72、0.86、1.0、1.16 秒，最後一支最重）：前 2 幀白閃最大，光環 ease-out-expo 急擴並越擴越細，六角形霜印 ease-out-back 彈出', en: 'each spear spikes into the ground (0.3, 0.44, 0.6, 0.72, 0.86, 1.0, 1.16 s, the last one hardest): the white flash is biggest on the first 2 frames, a ring races out (ease-out-expo) and thins, a hexagonal frost mark pops in (ease-out-back)' },
    { t: [.44, 1.4], zh: '插地 0.14 秒後冰槍碎成 7 塊小冰晶，急射而出、受阻力減速、受重力落地', en: '0.14 s after landing each spear breaks into 7 small crystals that shoot out, slow under drag and fall with gravity' },
    { t: [1.0, 2.25], zh: '霜印由外向內 ease-in-cubic 急縮變暗，逐一消失', en: 'the frost marks shrink inward (ease-in-cubic), dim and vanish one by one' },
  ],
  layers: [
    { zh: '冰槍：長 1.45、寬 0.25 的 4 面雙錐晶體，槍尖朝下，冰藍 6 階色階，在地上投下會移近的影子', en: 'spear: 4-sided bipyramid 1.45 long, 0.25 wide, tip down, 6-step ice-blue ramp, its shadow slides in on the ground' },
    { zh: '冷光尾：槍身上方的漸淡光線，長度隨速度由 0.3 拉長到 1.2', en: 'streak: a fading light line above the spear, stretching from 0.3 to 1.2 with speed' },
    { zh: '落點：白熱光球、半徑 0.15→0.6 的光環、四角星閃光', en: 'impact: white-hot orb, ring growing 0.15 → 0.6, four-point sparkle' },
    { zh: '霜印：半徑 0.42（乘以「霜印大小」）的六角形，外框亮、內部淡藍填色，中間一個小六角', en: 'frost mark: radius-0.42 hexagon (x "frost mark size") with a bright outline, pale-blue fill and a small inner hexagon' },
    { zh: '碎冰：每支預設 7 塊小晶體，帶阻力、重力與旋轉，落地後縮小消失', en: 'shards: 7 small crystals per spear by default, with drag, gravity and spin, shrinking away after landing' },
  ],
  params: {
    lances: { zh: '冰槍數量', en: 'spear count', min: 7, max: 14, step: 1, value: 7 },
    spread: { zh: '落點範圍', en: 'impact spread', min: .6, max: 1.4, step: .05, value: 1 },
    shards: { zh: '每支碎冰數', en: 'shards per spear', min: 0, max: 12, step: 1, value: 7 },
    markSize: { zh: '霜印大小', en: 'frost mark size', min: .5, max: 1.6, step: .05, value: 1 },
  },
  draw(p, t) {
    const P = this.palette, I = P.ice, FR = P.frost, TAU = p.TAU;
    const T0 = [0, .14, .3, .42, .56, .7, .86], FALL = .3, Z0 = 4.6, LEN = 1.45;
    const nL = Math.round(p.param('lances')), SP = p.param('spread'), MS = p.param('markSize');
    const nSh = Math.round(p.param('shards') * p.density);
    for (let k = 0; k < nL; k++) {
      const t0 = T0[k % 7], last = k % 7 === 6;
      const ang = k * 2.39996 + .6, rad = (k === 0 ? .2 : .55 + p.r(k, 1) * .95) * SP;
      const x = Math.cos(ang) * rad, y = Math.sin(ang) * rad * .85;
      const a = t - t0;
      if (a < 0) continue;
      const brk = FALL + .14;
      // falling (accelerating) / stuck spear
      if (a < brk) {
        const u = Math.min(1, a / FALL), speed = 2.5 * Math.pow(u, 1.5);           // d/du of u^2.5
        const tipZ = a < FALL ? Z0 * (1 - Math.pow(u, 2.5)) - .08 * u : -.1;
        const cz = tipZ + LEN * .5;
        p.shard(x, y, cz, LEN, .25, [0, 0, -1], I, { back: .55, spin: k * .4, lit: .18 + (a >= FALL ? .4 * (1 - (a - FALL) / .14) : 0) });
        if (a < FALL) p.line([x, y, cz + LEN * .55], [x, y, cz + LEN * .55 + .3 + .3 * speed], .07, FR, .6 + .15 * speed, { w1: .02, i1: 0 });
      }
      if (a < FALL) continue;
      const b = a - FALL, pw = last ? 1.4 : 1;
      // impact flash + ring + sparkle: biggest on the first frames
      const fl = Math.pow(1 - p.ph(b, 0, .16), 2);
      if (fl > 0) {
        p.glow(x, y, .1, (.25 + .4 * fl) * pw, FR, 1.4 * fl);
        p.sparkle(x, y, .3, 3 + Math.round(2 * fl), FR, fl);
      }
      const rk = p.ph(b, 0, .4);
      if (rk < 1) p.ring(x, y, .02, (.15 + .5 * p.easeOutExpo(rk)) * pw * Math.sqrt(MS), .02 + .07 * Math.pow(1 - rk, 2), FR, Math.pow(1 - rk, 1.5) + .3 * fl);
      // hex frost mark: pops in, holds, shrinks inward
      const shrink = p.easeInCubic(p.ph(b, .55, 1.35 - (k % 7) * .05));
      if (shrink < 1) {
        const R = .42 * MS * Math.max(0, p.easeOutBack(Math.min(1, b / .12), 2.2)) * (1 - .7 * shrink);
        if (R > .02) p.decal(x, y, 0, R * 1.05, (dx, dy, rho, an) => {
          const e = p.sdPoly(dx, dy, 6, R, .2);
          const inside = p.sdPoly(dx, dy, 6, R * .38, .2);
          const sec = ((an - .2) % (TAU / 6) + TAU / 6) % (TAU / 6) - TAU / 12;
          const pin = rho * Math.cos(sec) < R * .866;                    // inside the hexagon
          if (e < .035) return 1;
          if (inside < .025) return .8;
          return pin ? .38 : 0;
        }, FR, .95 * (1 - shrink) + .3 * fl);
      }
      // shatter: shoot out, drag, gravity, spin
      if (a < brk) continue;
      const c = a - brk;
      for (let j = 0; j < nSh; j++) {
        const id = k * 13 + j, az = j / nSh * TAU + p.r(id, 2), sp = 2 + p.r(id, 3) * 2.6, vz = 1.2 + p.r(id, 4) * 1.8, z0 = .15 + p.r(id, 5) * .6, g = 8;
        const tl = (vz + Math.sqrt(vz * vz + 2 * g * z0)) / g, tt = Math.min(c, tl);
        const gone = p.easeInCubic(p.ph(c, .3 + p.r(id, 6) * .2, .65 + p.r(id, 6) * .2));
        if (gone >= 1) continue;
        const h = p.drag(sp, 4, tt) + p.drag(.4, 8, Math.max(0, c - tl));
        const z = Math.max(.03, z0 + vz * tt - .5 * g * tt * tt), spin = c < tl ? c * 12 + id : id;
        const dir = c < tl ? [Math.cos(spin), Math.sin(spin) * .3, Math.sin(spin)] : [Math.cos(az), Math.sin(az), .1];
        p.shard(x + Math.cos(az) * h, y + Math.sin(az) * h, z, (.2 + p.r(id, 7) * .1) * (1 - gone), .1 * (1 - gone), dir, I, { back: .5, shadow: false });
      }
    }
    // cold light under the whole array
    p.light(0, 0, .2, 2.1 * Math.max(.8, SP), FR, .55 * p.env(t, .3, .4, 1.3, 2.2));
  },
});
