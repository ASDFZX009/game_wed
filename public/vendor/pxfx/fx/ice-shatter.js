// 裂晶霜爆 / Shattering Frostburst — pixel version of 00GameDevs "ice-shatter" (MIT)
PXFX.define({
  id: 'ice-shatter',
  loop: 2.8,
  beats: [{ t: 0, kind: 'cast', power: .5 }, { t: .35, kind: 'cast', power: .45 }, { t: .82, kind: 'burst', power: 1.2 }],
  view: { r: 2.4, h: 2.4 },
  stage: { ground: 'slate', tiles: true },
  palette: {
    ice: ['#3e5a8c', '#5e8cc0', '#8ec0e6', '#b8e5ff', '#e6f7ff', '#ffffff'],
    glint: ['#6e9cd0', '#9ccff0', '#cdeeff', '#ffffff'],
    mist: ['#8aa6c8', '#a6c2de', '#c2dcf0', '#dceefa'],
  },
  timeline: [
    { t: [0, .2], zh: '12 根冰錐由地面依次刺出，ease-out-back 衝過頭約 15% 再彈回；中央最高 1.9，外圍向外傾斜；霜環 ease-out-expo 急擴', en: '12 ice spikes stab up in quick sequence with ease-out-back, overshooting ~15% and settling; centre one 1.9 tall, outer ones lean out; a frost ring shoots out (ease-out-expo)' },
    { t: [.08, .8], zh: '霜霧團在冰錐底部鼓起', en: 'frost-mist puffs swell around the base' },
    { t: [.35, .82], zh: '裂紋蓄力：0.35 秒白色鋸齒裂紋一下亮起，由下往上爬滿冰錐並越閃越密；冰錐顫抖逐漸加劇，最後 0.12 秒先微脹再急縮（ease-in-back）', en: 'crack-up: at 0.35 s white zig-zag cracks flash on, climb the spikes and flicker faster; the spikes tremble harder, and in the last 0.12 s swell slightly then squeeze in (ease-in-back)' },
    { t: [.82, .9], zh: '碎裂：前 2 幀最大最亮，中心大白閃＋白色衝擊環', en: 'shatter: the first 2 frames are the biggest and brightest, a big white flash and a white shock ring' },
    { t: [.82, 1.6], zh: '每根冰錐碎成 3 塊旋轉冰晶，急射而出、受阻力減速、受重力落地；霜霧被衝擊向外推開', en: 'each spike breaks into 3 spinning crystals that shoot out, slow under drag and fall with gravity; the mist is blown outward' },
    { t: [1.5, 2.6], zh: '冰晶散落地面後縮小收走，霜霧最後消散', en: 'crystals lie scattered on the floor, then shrink away; the mist clears last' },
  ],
  layers: [
    { zh: '冰錐：預設 12 根 4 面雙錐晶體（寬 0.24–0.36），最寬處在底部 1/4，冰藍 6 階色階；高度乘以「冰錐高度」', en: 'spikes: 12 by default, 4-sided bipyramid crystals (0.24–0.36 wide), widest a quarter up from the base, 6-step ice-blue ramp; height scales with "spike height"' },
    { zh: '裂紋：每根冰錐 3 段折線白光，貼在面向鏡頭的一側，由根部向上延伸', en: 'cracks: a 3-segment white zig-zag on the camera-facing side of each spike, growing from the root upward' },
    { zh: '碎片：每根預設 3 塊小晶體（長 0.3–0.5），邊飛邊轉，落地後平躺', en: 'fragments: 3 small crystals per spike by default (0.3–0.5 long), spinning in flight, lying flat after landing' },
    { zh: '霜霧：預設 8 顆淡藍半透明粗糙球，碎裂後中心再加一團冷光', en: 'mist: 8 pale-blue translucent rough puffs by default, plus a cold glow in the centre after the shatter' },
    { zh: '地面：刺出與碎裂各一道霜環擴散、地面染成冰藍，碎片與冰錐上有四角星閃光', en: 'ground: a frost ring on the stab and another on the shatter, ice-blue light pool; four-point glints on spikes and fragments' },
  ],
  params: {
    spikes: { zh: '冰錐數量', en: 'spike count', min: 5, max: 16, step: 1, value: 12 },
    height: { zh: '冰錐高度', en: 'spike height', min: .6, max: 1.3, step: .05, value: 1 },
    fragments: { zh: '每根碎片數', en: 'fragments per spike', min: 1, max: 5, step: 1, value: 3 },
    mist: { zh: '霜霧數量', en: 'mist puffs', min: 0, max: 14, step: 1, value: 8 },
  },
  draw(p, t) {
    const P = this.palette, I = P.ice, G = P.glint, TAU = p.TAU;
    const BREAK = .82, CRACK = .35, nK = Math.round(p.param('spikes')), HS = p.param('height');
    // camera-facing direction (for drawing cracks on the near side of the crystals)
    const a0 = p.project(0, 0, 1), ax = p.project(1, 0, 1), ay = p.project(0, 1, 1), az0 = p.project(0, 0, 2);
    let cam = [0, 0, 1];
    if (a0 && ax && ay && az0) { const v = [ax[2] - a0[2], ay[2] - a0[2], az0[2] - a0[2]], l = Math.hypot(v[0], v[1], v[2]) || 1; cam = [v[0] / l, v[1] / l, v[2] / l]; }
    const spikes = [];
    for (let k = 0; k < nK; k++) {
      const az = k * 2.39996 + .3, tilt = k === 0 ? 0 : .15 + p.r(k, 1) * .55, br = k === 0 ? 0 : .1 + p.r(k, 2) * .38 * Math.sqrt(nK / 12);
      const L = (k === 0 ? 1.9 : 1.75 - tilt * 1.1 + p.r(k, 3) * .3) * HS, wid = (.24 + p.r(k, 4) * .12) * (.75 + .25 * HS);
      const dir = [Math.sin(tilt) * Math.cos(az), Math.sin(tilt) * Math.sin(az), Math.cos(tilt)];
      spikes.push({ az, tilt, br, L, wid, dir, base: [Math.cos(az) * br, Math.sin(az) * br, 0] });
    }
    // ----- spikes, before the break -----
    if (t < BREAK) {
      const cu = p.ph(t, CRACK, BREAK);                                       // crack-up progress
      const crack = t >= CRACK ? 1 : 0, snap = crack * Math.pow(1 - p.ph(t, CRACK, CRACK + .1), 2);
      const pulse = crack * (.55 + .45 * Math.sin(t * (30 + cu * 70)));
      const squeeze = 1 - .1 * p.easeInBack(p.ph(t, BREAK - .12, BREAK), 2.5);   // swell, then squeeze in
      const shake = cu * cu * .035;
      spikes.forEach((s, k) => {
        const g = p.easeOutBack(p.ph(t, k * .013, .12 + k * .013), 2.2);
        if (g <= 0) return;
        const jx = (p.r(k + Math.floor(t * 30) * 13, 9) - .5) * shake, jy = (p.r(k + Math.floor(t * 30) * 13, 10) - .5) * shake;
        const Lt = s.L * g * squeeze, len = Lt / .65, d = s.dir, bx = s.base[0] + jx, by = s.base[1] + jy;
        const c = [bx + d[0] * len * .15, by + d[1] * len * .15, d[2] * len * .15 - .04];
        p.shard(c[0], c[1], c[2], len, s.wid * (.5 + .5 * Math.min(1, g)) * (2 - squeeze), d, I, { back: .15, spin: k * .7, lit: .12 * pulse + .3 * snap + .25 * p.ph(t, BREAK - .12, BREAK) });
        if (crack) {
          const off = s.wid * .42, pts = [], climb = .3 + .7 * p.easeOutCubic(p.ph(cu, 0, .5));
          for (let j = 0; j <= 3; j++) {
            const f = (.08 + j * .2) * climb, side = (j % 2 ? 1 : -1) * s.wid * .18;
            pts.push([bx + d[0] * Lt * f + cam[0] * off + side * Math.cos(s.az + 1.57), by + d[1] * Lt * f + cam[1] * off + side * Math.sin(s.az + 1.57), d[2] * Lt * f + cam[2] * off]);
          }
          p.trail(pts, .045, .03, G, .6 + .5 * pulse + .6 * snap, .5 * pulse + .3 * snap);
        }
      });
      for (let k = 0; k < Math.min(5, nK >> 1); k++) {
        const s = spikes[k * 2 + 1], tw = p.env((t * 2.5 + k * .37) % 1, 0, .2, .3, .5);
        if (t > .2 && tw > 0) p.sparkle(s.base[0] + s.dir[0] * s.L * .7, s.base[1] + s.dir[1] * s.L * .7, s.dir[2] * s.L * .7, 3, G, tw);
      }
      if (snap > 0) p.glow(0, 0, .5 * HS, .45 * snap + .1, G, .45 * snap, { pow: 2.4 });
    }
    // ----- shatter flash + fragments -----
    const a = t - BREAK;
    if (a >= 0) {
      const fl = Math.pow(1 - p.ph(a, 0, .16), 2);
      if (fl > 0) {
        p.glow(0, 0, .7 * HS, (1.0 * fl + .25) * HS, G, 1.4 * fl, { pow: 1.9 });
        for (let r = 0; r < 8; r++) {
          const az = r / 8 * TAU + .4, el = p.r(r, 30) * 1.2 - .2, len = (1.2 + p.r(r, 31) * .8) * (.3 + fl) * HS;
          p.line([0, 0, .7 * HS], [Math.cos(az) * Math.cos(el) * len, Math.sin(az) * Math.cos(el) * len, Math.max(.05, .7 * HS + Math.sin(el) * len)], .12, G, 1.3 * fl, { w1: .01, i1: .4 });
        }
      }
      const rk = p.ph(a, 0, .5);
      if (rk < 1) p.ring(0, 0, .03, .3 + 1.7 * p.easeOutExpo(rk), .03 + .12 * Math.pow(1 - rk, 2), G, 1.1 * Math.pow(1 - rk, 1.5));
      const nF = Math.max(1, Math.round(p.param('fragments') * p.density));
      spikes.forEach((s, k) => {
        for (let j = 0; j < nF; j++) {
          const id = k * 11 + j, f = (j + .5) / nF, g = 7;
          const x0 = s.base[0] + s.dir[0] * s.L * f, y0 = s.base[1] + s.dir[1] * s.L * f, z0 = s.dir[2] * s.L * f;
          const out = 2.2 + p.r(id, 5) * 3.2, ca = Math.cos(s.az + (p.r(id, 6) - .5) * .8), sa = Math.sin(s.az + (p.r(id, 6) - .5) * .8);
          const vz = .8 + p.r(id, 7) * 2.4 + f;
          const land = (vz + Math.sqrt(vz * vz + 2 * g * z0)) / g;
          const tt = Math.min(a, land), slide = p.drag(.6, 8, Math.max(0, a - land));
          const h = p.drag(out, 2.4, tt) + slide;
          const x = x0 + ca * h, y = y0 + sa * h;
          const z = Math.max(.04, z0 + vz * tt - .5 * g * tt * tt);
          const gone = p.easeInCubic(p.ph(a, .95 + p.r(id, 8) * .4, 1.45 + p.r(id, 8) * .3));
          if (gone >= 1) continue;
          const landed = a >= land, spin = landed ? 0 : a * (6 + p.r(id, 9) * 8) * (1.6 - a);
          const dir = landed ? [ca, sa, .12] : [Math.cos(spin) * ca, Math.cos(spin) * sa, Math.sin(spin) + .2];
          const len = (.3 + p.r(id, 10) * .2) * (1 - gone) * Math.sqrt(HS);
          p.shard(x, y, z + (landed ? .02 : 0), len, len * .45, dir, I, { back: .5, spin: id, shadow: gone < .5, lit: .4 * fl });
          if (!landed && id % 4 === 0) p.sparkle(x, y, z + .1, 2, G, .8 * (1 - gone));
        }
      });
      const cg = Math.min(1, a / .05) * (1 - p.easeInCubic(p.ph(a, .2, 1.6)));
      if (cg > 0) p.glow(0, 0, .3, .5 * cg, P.glint, .5 * cg);
    }
    // ----- mist: swells at the base, blown outward by the shatter -----
    const nM = Math.round(p.param('mist') * p.density);
    for (let k = 0; k < nM; k++) {
      const u = p.ph(t, .08 + k * .02, 2.3 + p.r(k, 11) * .3);
      if (u <= 0 || u >= 1) continue;
      const ang = k / nM * TAU + .2, rr = .6 + p.r(k, 12) * .3 + p.drag(2.6, 3, a) + u * .2;
      const sz = (.15 + p.r(k, 13) * .1) * (.4 + .6 * p.easeOutCubic(Math.min(1, u * 5))) * (1 + u * .7) * (1 + .3 * p.easeOutExpo(p.ph(a, 0, .3)));
      p.ball(Math.cos(ang) * rr, Math.sin(ang) * rr, sz * .6 + u * .3, sz, P.mist, { alpha: .6 * (1 - u * u), rough: .45, shadow: false, seed: k, lit: .1 });
    }
    // ----- ground: frost ring on the stab -----
    const rk0 = p.ph(t, 0, .7);
    if (rk0 < 1) p.ring(0, 0, .03, .25 + 1.6 * p.easeOutExpo(rk0), .025 + .06 * (1 - rk0), G, .85 * Math.pow(1 - rk0, 1.5));
    p.light(0, 0, .3, 1.9, G, .7 * p.env(t, 0, .06, 1.6, 2.5) + (a >= 0 ? .5 * Math.pow(1 - p.ph(a, 0, .2), 2) : 0));
  },
});
