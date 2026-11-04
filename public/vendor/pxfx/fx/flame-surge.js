// 翻湧炎潮 / Surging Flame Tide — pixel version of 00GameDevs "flame-surge" (MIT)
PXFX.define({
  id: 'flame-surge',
  loop: 3.0,
  beats: [{ t: .1, kind: 'cast', power: .7 }, { t: .8, kind: 'pulse', power: .4 }, { t: 1.3, kind: 'pulse', power: .45 }, { t: 1.8, kind: 'pulse', power: .4 }],
  view: { r: 2.4, h: 2.4 },
  stage: { ground: 'ash', tiles: true },
  palette: {
    fire: ['#b8361c', '#e8581f', '#ff823e', '#ffb45e', '#ffe39a', '#fffbe8'],
    ember: ['#c8401c', '#ff823e', '#ffc46a', '#fff1c0'],
  },
  timeline: [
    { t: [0, .12], zh: '點火：一排火星沿弧線在地面由中間往兩側亮起', en: 'ignition: a row of sparks lights up along an arc on the ground, middle first' },
    { t: [.1, .45], zh: '9 道火舌由中間往兩側依次竄起，ease-out-back 衝高約 20% 再落回，排成向外張開的扇形，中間最高 1.4', en: '9 flame tongues shoot up from the middle outward with ease-out-back, overshooting ~20% before settling into an outward-opening fan, middle one 1.4 tall' },
    { t: [.6, 2.0], zh: '火牆持續翻湧：0.8、1.3、1.8 秒三次湧動（急升約 35% 再以三次方曲線慢慢回落），每次噴出一批火星；兩端火舌向後捲成鉤狀', en: 'the flame wall churns: three surges at 0.8, 1.3 and 1.8 s (a sharp ~35% jump, then a slow cubic fall-off), each throwing a batch of embers; the end tongues curl back into hooks' },
    { t: [2.0, 2.6], zh: '火舌被侵蝕成一塊塊火團，以 ease-in-cubic 急速塌縮熄滅', en: 'the tongues erode into separate blobs and collapse quickly (ease-in-cubic)' },
  ],
  layers: [
    { zh: '火舌：預設 9 張面向鏡頭的火焰卡片（寬 0.8，高 0.85–1.4），淚滴形輪廓＋2 層噪聲向上捲動，6 階火焰色階做出卡通色塊', en: 'tongues: 9 camera-facing flame cards by default (0.8 wide, 0.85–1.4 tall), teardrop outline with 2-octave noise scrolling up, 6-step fire ramp gives toon colour bands' },
    { zh: '扇形：火舌沿一條弧線排列（寬 2.4 × 扇形寬度），左右兩側往外傾斜 20°', en: 'fan: tongues sit on an arc (2.4 wide x fan width), the outer ones lean 20° outward' },
    { zh: '鉤狀火舌：兩端各一條會擺動的漸細光帶，往後上方捲曲', en: 'hooks: one swaying tapered light strip at each end, curling back and up' },
    { zh: '火星：預設 26 粒像素由火舌頂端急射向上、受阻力減速、左右擺動後消失，湧動時成批噴出', en: 'embers: 26 pixels by default shoot up from the tongue tips, slow under drag, sway and vanish; surges throw them in batches' },
    { zh: '地面：火光染橙，底部一條熱亮帶，湧動時變亮', en: 'ground: orange firelight pool and a hot band along the base, flaring on each surge' },
  ],
  params: {
    tongues: { zh: '火舌數量', en: 'flame tongues', min: 5, max: 15, step: 1, value: 9 },
    height: { zh: '火焰高度', en: 'flame height', min: .6, max: 1.5, step: .05, value: 1 },
    fanWidth: { zh: '扇形寬度', en: 'fan width', min: .6, max: 1.4, step: .05, value: 1 },
    embers: { zh: '火星數量', en: 'ember count', min: 0, max: 50, step: 1, value: 26 },
  },
  draw(p, t) {
    const F = this.palette.fire, EM = this.palette.ember;
    const N = Math.round(p.param('tongues')), HS = p.param('height'), FW = p.param('fanWidth');
    const fanX = s => s * 1.2 * FW, fanY = s => (-.25 + .55 * s * s) * FW;
    const end = p.ph(t, 2.0, 2.6);
    // surges: sharp attack, slow cubic decay
    let surge = 0;
    for (const ts of [.8, 1.3, 1.8]) { const d = t - ts; if (d >= 0 && d < .45) surge = Math.max(surge, Math.min(1, d / .04) * Math.pow(1 - d / .45, 3)); }
    // ignition sparks
    if (t < .3) {
      const nI = Math.round(16 * p.density);
      for (let k = 0; k < nI; k++) {
        const s = p.r(k, 9) * 2 - 1, on = p.env(t, Math.abs(s) * .06, Math.abs(s) * .06 + .03, .12 + Math.abs(s) * .06, .3);
        if (on <= 0) continue;
        p.dot(fanX(s) + (p.r(k, 1) - .5) * .2, fanY(s) + (p.r(k, 2) - .5) * .2, .05 + p.r(k + Math.floor(t * 20), 3) * .15, F, on, 1 + (k % 3 === 0 ? 1 : 0));
      }
    }
    // base heat band
    const base = p.env(t, .08, .2, 2.1, 2.6);
    // tongues: pop up with overshoot, surge, collapse fast
    let glowAll = 0;
    const W0 = .8 * p.clamp(2.4 * FW / Math.max(1, N - 1) / .3, .7, 1.3);
    for (let j = 0; j < N; j++) {
      const s = j / (N - 1) * 2 - 1, as = Math.abs(s);
      const g0 = p.ph(t, .1 + as * .18, .32 + as * .2), grow = p.easeOutBack(g0, 2.2);
      if (g0 <= 0) continue;
      const shrink = 1 - p.easeInCubic(p.ph(t, 2.0 + p.r(j, 4) * .25, 2.45 + p.r(j, 4) * .15));
      if (shrink <= 0) continue;
      const boil = 1 + .1 * Math.sin(t * 9 + j * 1.7) + .06 * Math.sin(t * 17 + j) + .38 * surge * (1 - .3 * as);
      const H = (1.4 - .55 * as) * HS * grow * boil * shrink, W = W0 * (.5 + .5 * Math.min(1, grow)) * (.6 + .4 * shrink) * (1 + .12 * surge);
      if (H < .05) continue;
      const x = fanX(s), y = fanY(s), lean = s * .45, seed = j * 3.1;
      const erode = end * 1.1;
      p.card(x, y, H * .47, W, H, (u, v) => {
        const h = (v + 1) * .5;
        const cx = lean * h * h + Math.sin(h * 5 - t * 7 + seed) * .12 * h;
        const hw = .92 * Math.pow(1 - h, .55) * Math.min(1, (h + .12) * 3.5);
        const d = Math.abs(u - cx) / (hw + 1e-3);
        if (d > 1.15) return 0;
        const n = p.fbm(u * 1.7 + seed, v * 1.3 - t * 3.6, 2);
        const val = (1 - d * d) * .62 + (n - .5) * 1.0 - h * .25 + .26 + .15 * surge - erode * (1 - n) * 1.4;
        return val < .12 ? 0 : val + (n > .68 && d < .5 ? .3 : 0);
      }, F, 1);
      glowAll = Math.max(glowAll, Math.min(1, grow) * shrink);
    }
    // curling hooks at both ends
    const hk = p.easeOutBack(p.ph(t, .3, .5), 1.8) * (1 - p.easeInCubic(p.ph(t, 1.95, 2.3)));
    if (hk > 0) {
      for (const side of [-1, 1]) {
        const pts = [], sw = Math.sin(t * 5 + side) * .12, r0 = .55 * (.35 + .65 * HS) * Math.sqrt(FW) * (1 + .15 * surge);
        for (let i = 0; i <= 7; i++) {
          const a = i / 7, ang = a * 2.2 * hk;
          const r = r0 * (1 - a * .35);
          const xx = fanX(side) + side * (.1 + Math.sin(ang) * r * .9), zz = .25 + (1 - Math.cos(ang)) * r * .5 + a * .55 * HS + sw * a;
          pts.push([xx - side * a * a * .35, fanY(side) - .05, zz]);
        }
        p.trail(pts, .3, .04, F, .95 * Math.min(1, hk), .5 * Math.min(1, hk));
      }
    }
    // embers: steady stream plus batches thrown by each surge; fast up, drag, sway
    const nE = Math.round(p.param('embers') * p.density);
    for (let k = 0; k < nE; k++) {
      const batch = k % 3 === 0 ? [.8, 1.3, 1.8][Math.floor(p.r(k, 10) * 3)] : -1;
      const tb = batch > 0 ? batch + p.r(k, 5) * .08 : .45 + p.r(k, 5) * 1.6, life = .7 + p.r(k, 6) * .5, tt = t - tb, u = tt / life;
      if (u <= 0 || u >= 1) continue;
      const s = p.r(k, 7) * 2 - 1, rise = p.drag((batch > 0 ? 4.5 : 3) * (.7 + .3 * HS), 3, tt);
      const x = fanX(s) + Math.sin(u * 6 + k) * .15 * u + s * p.drag(.8, 2, tt);
      const z = (1.1 - .4 * Math.abs(s)) * HS + rise;
      p.dot(x, fanY(s) + (p.r(k, 8) - .5) * .3, z, EM, (1 - u * u) * (Math.floor(t * 15 + k) % 4 ? 1 : .5), tt < .08 ? 2 : 1);
    }
    // ground
    if (base > 0) {
      for (let j = 0; j < 5; j++) {
        const s = j / 4 * 2 - 1;
        p.line([fanX(s) - .15 * FW, fanY(s), .03], [fanX(s) + .15 * FW, fanY(s), .03], .3 * base, F, (.55 + .3 * surge) * base);
      }
    }
    p.light(0, -.05, .5, 2.0 * Math.max(.8, FW), F, .75 * Math.max(glowAll * (.9 + .1 * Math.sin(t * 13) + .3 * surge), base * .5));
  },
});
