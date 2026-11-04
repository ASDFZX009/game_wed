// 翻浪衝潮 / Breaking Tidal Surge — pixel version of 00GameDevs "tidal-surge" (MIT)
PXFX.define({
  id: 'tidal-surge',
  loop: 3.2,
  beats: [{ t: .05, kind: 'cast', power: .5 }, { t: 1.3, kind: 'hit', power: 1.2 }],
  view: { r: 2.8, h: 1.9 },
  stage: { ground: 'sand' },
  palette: {
    water: ['#1f4a6e', '#2a7090', '#3f9cb4', '#66cddd', '#a8ecf0', '#effffd'],
    foam: ['#7aa8c0', '#b4d8e6', '#e2f4f8', '#ffffff'],
    spray: ['#3f9cb4', '#66cddd', '#a8ecf0', '#ffffff'],
  },
  timeline: [
    { t: [0, .45], zh: '水面在起點鼓起成小丘，ease-out-back 升到約 1.1（略衝過頭）並先向前推出 0.55', en: 'the water bulges into a mound at the origin, rising to ~1.1 with ease-out-back (slight overshoot) and pushing 0.55 forward' },
    { t: [.35, 1.3], zh: '水丘拉成新月形浪牆向前（+x）推進並向兩側張開，ease-in-cubic 越推越快；浪脊有 3–4 個尖峰，浪頭由 0.55 秒起加速向前捲曲', en: 'the mound stretches into a crescent wave wall that rolls forward (+x) and fans out, accelerating (ease-in-cubic); 3–4 peaks along the crest, the lip curls forward faster and faster from 0.55 s' },
    { t: [1.3, 1.36], zh: '拍落：浪唇在 1.3 秒砸到地面，前 2 幀沿浪前緣一條最亮最粗的白色水花線，9 道白色水柱（漸細光線頂著一顆泡沫球）沿前緣急噴而起', en: 'crash: the lip slams into the ground at 1.3 s; for the first 2 frames a thick, brightest white splash line runs along the wave front, and 9 white splash plumes (a tapered streak capped by a foam ball) shoot up along it' },
    { t: [1.3, 1.65], zh: '浪體 0.12 秒內塌到約一半高度，再以 ease-in-cubic 急速塌走；泡沫團被向前拋出、受阻力減速；水花向前上方炸開，受阻力與重力落下', en: 'the wave body drops to about half height within 0.12 s, then collapses away (ease-in-cubic); foam clumps are thrown forward and slow under drag; spray bursts forward and up, slowing under drag and falling with gravity' },
    { t: [1.7, 2.8], zh: '泡沫團散開、變灰並抖色淡出，地面濕痕消失', en: 'foam clumps spread, grey out and dither away; the wet sand dries' },
  ],
  layers: [
    { zh: '浪體：17 段弧 × 6 個剖面點的低多邊形曲面（長背坡、浪脊、向前捲出並砸到地面的浪唇）＋浪唇下 3 點內壁，平面著色，6 階青藍色階，背光面自動變深', en: 'wave body: low-poly surface of 17 arc steps x 6 profile points (long back slope, crest, a forward-curling lip that reaches the ground) plus a 3-point inner wall under the lip, flat-shaded on a 6-step teal ramp so faces away from the light go dark' },
    { zh: '新月形：浪沿圓心在後方 2.7 處、半徑由 1.0 推到約 3.2 的弧（張角 ±29° × 浪寬），浪寬約 1.4，兩端降低收尖；高度乘以「浪高」', en: 'crescent: the wave follows an arc centred 2.7 behind, radius 1.0 → ~3.2 (±29° x wave width span), about 1.4 wide, tapering to points at both ends; height scales with "wave height"' },
    { zh: '浪脊高光：沿浪脊一條白色光線；拍落時地面一條白色水花線，加 9 道漸細水柱急升（阻力）後落回', en: 'crest highlight: a white light line along the crest; on the crash, a white splash line on the ground and 9 tapered splash plumes that shoot up (drag) and fall back' },
    { zh: '泡沫：預設 14 顆白色實心粗糙球，ease-out-back 彈出在浪脊，拍落時被拋到前方地上再淡出', en: 'foam: 14 rough white solid balls by default pop onto the crest (ease-out-back), get thrown ahead onto the ground by the crash, then fade' },
    { zh: '水花：預設 24 粒青白像素，三分一在拍落前由浪脊飄出，其餘在拍落瞬間向前上方炸開', en: 'spray: 24 cyan-white pixels by default; a third drift off the crest before the crash, the rest burst forward and up on impact' },
    { zh: '地面：浪後方沙地被染濕（青色地面光），浪底下有陰影', en: 'ground: wet sand behind the wave (cyan ground light), shadow under the wave' },
  ],
  params: {
    waveWidth: { zh: '浪寬', en: 'wave width', min: .6, max: 1.5, step: .05, value: 1 },
    waveHeight: { zh: '浪高', en: 'wave height', min: .6, max: 1.4, step: .05, value: 1 },
    foam: { zh: '泡沫數量', en: 'foam clumps', min: 0, max: 28, step: 1, value: 14 },
    spray: { zh: '水花數量', en: 'spray drops', min: 0, max: 60, step: 1, value: 24 },
  },
  draw(p, t) {
    const P = this.palette, Wt = P.water, FO = P.foam;
    const flat = p.mode === '2d', OX = -2.7, NA = 16, CR = 1.3;              // 2D: narrower crescent so the curl profile reads side-on
    const WW = p.param('waveWidth'), HS = p.param('waveHeight'), PH = (flat ? .2 : .5) * WW;
    const a = t - CR, fl = a >= 0 ? Math.pow(1 - p.ph(a, 0, .14), 2) : 0;
    // advance: a push, then accelerate into the crash, then the whitewater slides on and slows
    const Rc = 1.0 + .55 + 1.65;
    const R = a < 0 ? 1.0 + .55 * p.easeOutCubic(p.ph(t, .05, .6)) + 1.65 * p.easeInCubic(p.ph(t, .35, CR)) : Rc + p.drag(1.4, 4, a);
    const H = 1.1 * HS * p.easeOutBack(p.ph(t, 0, .45), 1.6) * (1 + .12 * p.easeInCubic(p.ph(t, .5, CR))) * (a < 0 ? 1 : (1 - .55 * p.easeOutCubic(p.ph(a, 0, .12))) * (1 - p.easeInCubic(p.ph(a, .04, .36))));
    const curl = p.easeInCubic(p.ph(t, .55, CR)), w = .75 * (.8 + .2 * HS) * (.45 + .55 * p.ph(t, 0, .5)) * (1 - .35 * p.ph(t, CR, CR + .4));
    const span = PH * p.easeOutCubic(p.ph(t, .08, .7)) + .1;
    const at = (phi, s, z) => [OX + Math.cos(phi) * (R + s), Math.sin(phi) * (R + s), z];
    const hAt = k => {
      const phi = -span + 2 * span * k / NA, e = Math.abs(phi) / span, q = phi / PH;
      const peaks = Math.pow(Math.abs(Math.sin(q * 5.2 + 1.1 + t * .8)), 3);
      return [phi, Math.max(0, H) * (.62 + .5 * peaks) * (1 - e * e * e * e)];
    };
    const lipS = (.5 + .65 * curl) * w;
    // ----- wave body: back slope, crest, curling lip; inner wall under the lip -----
    if (H > .02) {
      const prof = (h, c) => [
        [-1.05 * w, 0], [-.6 * w, .42 * h], [-.22 * w, .84 * h], [.1 * w, h],
        [(.42 + .35 * c) * w, h * (.92 - .14 * c)], [(.5 + .65 * c) * w, h * (.66 - .6 * c)],
      ];
      const inner = (h, c) => [[(.3 + .2 * c) * w, h * (.8 - .1 * c)], [(.22 + .1 * c) * w, .42 * h], [.12 * w, 0]];
      const rowsO = [], rowsI = [];
      for (let k = 0; k <= NA; k++) {
        const [phi, h] = hAt(k);
        rowsO.push(prof(h, curl).map(([s, z]) => at(phi, s, z)));
        rowsI.push(inner(h, curl).map(([s, z]) => at(phi, s, z)));
        if (k % 3 === 1) { const c = at(phi, 0, 0); p.shadow(c[0], c[1], h * .4, Math.max(.15, h * .5)); }
      }
      for (let k = 0; k < NA; k++) {
        for (let j = 0; j < 5; j++) p.quad(rowsO[k][j], rowsO[k + 1][j], rowsO[k + 1][j + 1], rowsO[k][j + 1], Wt, { lit: flat ? -.05 : .1 });
        for (let j = 0; j < 2; j++) p.quad(rowsI[k][j], rowsI[k + 1][j], rowsI[k + 1][j + 1], rowsI[k][j + 1], Wt, { lit: flat ? -.3 : -.12 });
      }
      // crest highlight: white rim along the lip
      const crest = rowsO.map(r => [r[4][0], r[4][1], r[4][2] + .03]);
      p.trail(crest, .07, .07, P.spray, .95, .95);
    }
    // ----- crash: splash line along the front, biggest on the first frames -----
    if (a >= 0 && a < .3) {
      const pts = [], k1 = Math.pow(1 - a / .3, 1.5);
      for (let k = 0; k <= NA; k += 2) { const [phi] = hAt(k); pts.push(at(phi, lipS + .1 + p.drag(1.2, 6, a), .06 + .12 * fl)); }
      p.trail(pts, .12 + .2 * fl, .12 + .2 * fl, P.spray, .7 * k1 + .8 * fl, .7 * k1 + .8 * fl);
      p.light(OX + Math.cos(0) * (R + lipS), 0, .1, 1.6 * Math.sqrt(WW), P.spray, .9 * fl);
    }
    // splash plumes thrown up along the front: shoot up, slow, fall back
    if (a >= 0 && a < .6) {
      for (let k = 0; k < 9; k++) {
        const [phi] = hAt(1 + k * (NA - 2) / 8), tt = a - p.r(k, 30) * .03, top = .05 + p.drag((3.4 + p.r(k, 31) * 2.4) * HS, 3.5, tt) - 3 * tt * tt;
        if (tt <= 0 || top < .08) continue;
        const b0 = at(phi, lipS + .05 + p.drag(1.2, 6, tt), .03), b1 = at(phi, lipS + .1 + p.drag(1.5, 5, tt), top);
        const life = 1 - tt / .6;
        p.line(b0, b1, .2 * life + .06, P.spray, 1.2 * life + .5 * fl, { w1: .05, i1: .8 * life });
        p.ball(b1[0], b1[1], b1[2], (.07 + .08 * life) * Math.sqrt(HS), FO, { alpha: Math.min(1, life * 2), rough: .3, shadow: false, seed: k + 50, lit: .2 });
      }
    }
    // ----- foam: pops onto the crest, thrown ahead by the crash, settles and fades -----
    const nF = Math.round(p.param('foam') * p.density);
    for (let k = 0; k < nF; k++) {
      const appear = .75 + p.r(k, 1) * .4;
      if (t < appear) continue;
      const kk = (k + .5) / nF * NA, [phi, h] = hAt(kk);
      const fade = 1 - p.ph(t, 1.9 + p.r(k, 2) * .4, 2.55 + p.r(k, 2) * .45);
      if (fade <= 0) continue;
      const grow = p.easeOutBack(p.ph(t, appear, appear + .2), 2);
      const thrown = p.drag(1.5 + p.r(k, 3) * 1.4, 4, a);
      const s = lipS * .9 + thrown;
      const fall = p.easeInCubic(p.ph(t, CR - .05, CR + .2));
      const z = p.lerp(h * .9 + .05, .12, fall) + (a > 0 ? Math.max(0, 1.6 * a - 6 * a * a) * .3 : 0) + p.ph(t, 1.85, 2.8) * .2;
      const pos = at(phi + (p.r(k, 4) - .5) * .06, s, z);
      p.ball(pos[0], pos[1], pos[2], (.1 + p.r(k, 5) * .1) * Math.max(0, grow) * (1 + .6 * p.easeOutCubic(p.ph(t, 1.3, 2.6))) * Math.sqrt(HS), FO, { alpha: fade, rough: .4, seed: k, lit: .1 + .4 * fl });
    }
    // ----- spray: some off the crest before the crash, the rest burst on impact -----
    const nS = Math.round(p.param('spray') * p.density);
    for (let k = 0; k < nS; k++) {
      const pre = k % 3 === 0, t0 = pre ? .8 + p.r(k, 6) * .45 : CR + p.r(k, 6) * .05, tt = t - t0;
      if (tt <= 0 || tt > .75) continue;
      const kk = p.r(k, 7) * NA, [phi] = hAt(kk), h0 = pre ? hAt(kk)[1] : .1;
      const vs = (pre ? 1 + p.r(k, 8) * 1.4 : 3 + p.r(k, 8) * 3.5), vz = pre ? .8 + p.r(k, 9) * 1.4 : 2.2 + p.r(k, 9) * 3 * HS;
      const z = h0 + p.drag(vz, 2.5, tt) - 4.5 * tt * tt;
      if (z < 0) continue;
      const pos = at(phi, (pre ? w * .6 : lipS) + p.drag(vs, 3.5, tt), z);
      p.dot(pos[0], pos[1], pos[2], P.spray, 1 - tt / .75, pre ? (k % 4 ? 1 : 2) : (k % 3 === 1 ? 2 : 1));
    }
    // ----- wet sand -----
    const wet = p.env(t, .1, .5, 1.8, 2.8);
    if (wet > 0) for (let k = 0; k < 3; k++) {
      const phi = (k - 1) * .5 * span, rr = R * (.45 + .2 * k % 2);
      p.light(OX + Math.cos(phi) * rr, Math.sin(phi) * rr, 0, 1.2 + R * .25, P.spray, .55 * wet);
    }
  },
});
