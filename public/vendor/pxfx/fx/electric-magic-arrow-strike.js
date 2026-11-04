// 金刃雷矢 / Golden-Bladed Lightning Arrow — pixel version of 00GameDevs "electric-magic-arrow-strike" (MIT)
PXFX.define({
  id: 'electric-magic-arrow-strike',
  loop: 4.2,
  beats: [{ t: .05, kind: 'cast', power: .4 }, { t: 1.1, kind: 'cast', power: .85 }, { t: 2.2, kind: 'hit', power: 1.15 }],
  view: { r: 3.1, h: 2.4 },
  stage: { ground: 'stone', tiles: true },
  palette: {
    volt: ['#b0702a', '#d89a36', '#ffd36a', '#ffe7a0', '#fff6dc', '#ffffff'],
    gold: ['#5e3c22', '#8e622c', '#c8963c', '#ffd36a', '#fff3c4'],
  },
  timeline: [
    { t: [0, .45], zh: '左方立起一個面向目標、略轉向鏡頭（35°）的金色法陣（半徑 0.6）：先由中心彈出放大（超出約 15% 再回彈），外圈、符文環、內圈以 ease-out-expo 依角度急速畫出', en: 'a golden sigil (radius 0.6) stands up on the left facing the target, yawed 35 degrees towards the viewer: it pops out from the centre with ~15% overshoot while outer ring, rune band and inner ring sweep in by angle with ease-out-expo' },
    { t: [.3, 1.1], zh: '蓄力：金箭在法陣中心成形並向後拉 0.3（像拉弓），4 道小電弧由法陣邊緣跳到箭身、越來越密，金色微粒向箭尖吸入，發射前箭身輕微顫動', en: 'charge: the golden arrow forms in the sigil centre and draws back 0.3 like a bowstring, 4 small arcs jump from the sigil rim to the shaft more and more often, golden motes are sucked into the tip, the shaft trembles just before release' },
    { t: [1.1, 1.45], zh: '發射：法陣一下閃亮，面向飛行方向的光環由法陣中心 ease-out-expo 急速擴張；法陣在 0.3 秒內向中心急縮消失', en: 'release: the sigil flares, a ring facing the flight bursts out of its centre with ease-out-expo; the sigil collapses into its centre within 0.3 s' },
    { t: [1.1, 2.2], zh: '金箭起步一下急衝，之後以 ease-in 越飛越快射向木人；兩條金白電弧纏繞箭身（每 2 幀重抖），身後金色光尾隨速度拉長，火花在經過處落下並受阻力漂移', en: 'the arrow kicks off, then accelerates with ease-in into the dummy; two gold-white arcs wrap the shaft (re-jagged every 2 frames), the golden streak behind stretches with speed, sparks drop where it passed and drift with drag' },
    { t: [2.2, 2.85], zh: '命中：首兩幀最大的白色閃光；7 道分岔雷電在 0.07 秒內炸開到全長成雷網，強弱閃爍後以 ease-in 熄滅', en: 'hit: white flash biggest on the first two frames; 7 branching bolts burst to full length within 0.07 s into a lightning web, flicker strong-weak, then die out with ease-in' },
    { t: [2.23, 3.4], zh: '兩道有缺口的細光環先後以 ease-out-expo 急衝後減速（一個正對飛行方向、一個斜放），越擴越細越淡', en: 'two broken thin rings shoot out one after the other with ease-out-expo, then slow (one facing the flight, one tilted), thinning and fading as they grow' },
    { t: [2.25, 4], zh: '金色微粒高速迸出後受阻力減速、漂浮閃爍並慢慢下沉淡出', en: 'golden motes burst out fast, slow down with drag, hover and twinkle, then slowly sink away' },
  ],
  layers: [
    { zh: '法陣：豎立的圓形貼片（雙外圈＋16 格方塊符文環＋內圈＋8 條刻度），符文環慢轉', en: 'sigil: upright disc decal (double outer ring, band of 16 blocky runes, inner ring, 8 ticks), rune band turns slowly' },
    { zh: '金箭：發光箭桿（長 1.1）＋箭頭 4 片十字排列的實心金刃（長 0.5、外伸 0.27）＋尾端 4 片小羽', en: 'arrow: glowing shaft (1.1 long), head of 4 solid golden blades in a cross (0.5 long, 0.27 reach), 4 small vanes at the tail' },
    { zh: '電弧：2 條沿箭身的鋸齒閃電＋外圍淡光暈；金色光尾長度隨速度由 0.5 拉長到 2.0', en: 'arcs: 2 jagged bolts along the shaft with a faint halo; golden streak stretching from 0.5 to 2.0 with speed' },
    { zh: '雷網：7 條長 0.8–1.4 的分岔閃電，主要向上下與後方', en: 'lightning web: 7 branching bolts 0.8–1.4 long, mostly up, down and backwards' },
    { zh: '光環：寬 0.03 的細環，用正弦切出 5 個缺口', en: 'rings: 0.03-wide thin rings cut into 5 gaps by a sine mask' },
    { zh: '微粒：24 粒金色 1 像素光點', en: 'motes: 24 golden single-pixel sparks' },
  ],
  params: {
    sigilSize: { zh: '法陣大小', en: 'sigil size', min: .6, max: 1.5, step: .05, value: 1 },
    webBolts: { zh: '雷網分岔數量', en: 'web bolts', min: 3, max: 14, step: 1, value: 7 },
    rings: { zh: '命中光環數量', en: 'impact rings', min: 0, max: 4, step: 1, value: 2 },
    motes: { zh: '金色微粒數量', en: 'golden motes', min: 0, max: 48, step: 1, value: 24 },
  },
  draw(p, t) {
    const V = this.palette.volt, G = this.palette.gold;
    const ss = p.param('sigilSize'), SX = -2.3, hz = 1.05, R = .6 * ss, YAW = .6, FIRE = 1.1, HIT = 2.2, cx = 2.12;
    const AX = SX + .55, XB = AX - .3;
    p.dummy(2.45, 0);
    const fseed = Math.floor(t * 15);

    // golden arrow, tip at x
    const arrow = (x, roll, I) => {
      for (let k = 0; k < 4; k++) {
        const a = roll + k * Math.PI / 2, ey = Math.cos(a), ez = Math.sin(a);
        p.tri([x + .05, 0, hz], [x - .36, ey * .06, hz + ez * .06], [x - .48, ey * .27, hz + ez * .27], G, { lit: .15 });
        p.tri([x + .05, 0, hz], [x - .48, ey * .27, hz + ez * .27], [x - .3, ey * .06, hz + ez * .06], G);
        p.tri([x - 1.05, ey * .03, hz + ez * .03], [x - 1.2, ey * .13, hz + ez * .13], [x - .9, ey * .03, hz + ez * .03], G);
      }
      p.line([x - 1.15, 0, hz], [x - .2, 0, hz], .1, V, .95 * I, { i1: 1.2 * I });
    };
    // launch kick, then accelerate into the dummy
    const travel = f => .14 * p.easeOutCubic(f / .14) + .86 * Math.pow(p.clamp(f, 0, 1), 2.2);
    const xAt = tau => p.lerp(XB, cx, travel(p.ph(tau, FIRE, HIT)));

    if (t < HIT) {
      // sigil: pops out of its centre, sweeps in by angle, flares at the release, then collapses into its centre
      const sweep = p.easeOutExpo(p.ph(t, .03, .5)), pop = p.easeOutBack(p.ph(t, .02, .3), 2.4);
      const shut = 1 - p.easeInCubic(p.ph(t, FIRE + .05, FIRE + .35)), sc = pop * shut, spin = t * .8;
      const flare = t >= FIRE ? Math.pow(1 - p.ph(t, FIRE, FIRE + .22), 3) : 0;
      if (sc > .02) {
        // the sigil faces the flight direction, yawed 35 degrees towards the viewer so it reads in every camera
        const Q = R * 1.2, corner = (a1, a2) => [SX - Math.sin(YAW) * a1, Math.cos(YAW) * a1, hz + a2];
        p.lquad(corner(-Q, -Q), corner(Q, -Q), corner(Q, Q), corner(-Q, Q), (u, v) => {
          const ly = (u - .5) * 2 * Q / sc, lz = (v - .5) * 2 * Q / sc, rho = Math.hypot(ly, lz), ang = Math.atan2(lz, ly);
          if (rho > R || (ang + Math.PI) / p.TAU > sweep) return 0;
          let val = Math.max(p.band(rho, R * .96, .025 * ss), p.band(rho, R * .88, .018 * ss) * .8, p.band(rho, R * .62, .02 * ss));
          if (rho > R * .66 && rho < R * .85) {
            const q = ((ang + spin) / p.TAU + 1) % 1, cell = Math.floor(q * 16), uu = q * 16 - cell;
            val = Math.max(val, p.rune(uu * 1.2 - .1, (rho - R * .67) / (R * .17), cell + 3) * .8);
          }
          if (rho < R * .58 && rho > R * .42 && Math.abs(Math.sin(ang * 4)) < .12) val = Math.max(val, .7);
          return val;
        }, V, (.85 + .15 * Math.sin(t * 20)) * Math.min(1, pop) + .9 * flare);
        p.light(SX + .3, 0, hz, 1.4 * ss, V, (.5 * sweep + .6 * flare) * Math.min(1, sc));
      }
      if (t < FIRE) {
        // charge: arrow forms and draws back like a bowstring, arcs jump in more and more often
        const ch = p.ph(t, .3, FIRE);
        if (ch > 0) {
          const ax = AX - .3 * p.easeOutCubic(ch) + (ch > .8 ? Math.sin(t * 90) * .015 : 0);
          arrow(ax, t * 2, ch);
          p.glow(ax - .5, 0, hz, .15 + ch * .15, V, .4 + ch * .5);
          for (let b = 0; b < 4; b++) {
            if (p.r(b, fseed) > .25 + .6 * ch) continue;
            const a = p.r(b * 5, fseed + 1) * p.TAU;
            p.bolt([SX - Math.sin(YAW) * Math.cos(a) * R * .95, Math.cos(YAW) * Math.cos(a) * R * .95, hz + Math.sin(a) * R * .95], [ax - .3 - p.r(b, fseed + 2) * .6, 0, hz], V, { seed: fseed * 4 + b, jag: .2, depth: 3, w: .035, I: .9 * ch, glow: .25 });
          }
          const nIn = Math.round(8 * p.density);
          for (let e = 0; e < nIn; e++) {
            const u = (t * 1.8 + p.r(e, 71)) % 1, ang = p.r(e, 72) * p.TAU, rad = R * 1.1 * (1 - p.easeInCubic(u));
            p.dot(ax - Math.sin(YAW) * Math.cos(ang) * rad, Math.cos(YAW) * Math.cos(ang) * rad, hz + Math.sin(ang) * rad, V, (.3 + .8 * u) * ch);
          }
        }
        return;
      }
      // release ring out of the sigil centre
      const rr = p.ph(t, FIRE, FIRE + .4);
      if (rr < 1) p.ring(SX + .1, 0, hz, (.15 + p.easeOutExpo(rr) * .8) * ss, .07 * Math.pow(1 - rr, 1.5) + .02, V, 1.2 * (1 - rr), { axis: [1, 0, 0] });
      // flight: kick, then accelerate; streak stretches with speed
      const x = xAt(t), v = (x - xAt(t - .03)) / .03, st = .4 + 1.6 * Math.min(1, v / 9), roll = t * 6;
      p.line([x - 1.1, 0, hz], [Math.max(SX, x - 1.1 - st), 0, hz], .1, V, .8, { i1: 0, w1: .02 });
      for (let b = 0; b < 2; b++) p.bolt([x - 1.2, 0, hz], [x + .02, 0, hz], V, { seed: fseed * 2 + b, jag: .12, depth: 4, w: .035, I: 1, glow: .3 });
      arrow(x, roll, 1);
      const nE = Math.round(12 * p.density);
      for (let e = 0; e < nE; e++) {
        const P = .4, age = (t / P + p.r(e, 3)) % 1, tb = t - age * P;
        if (tb < FIRE) continue;
        p.dot(xAt(tb) - 1 - p.drag(1.6, 4, age * P), (p.r(e, 4) - .5) * .4, hz + (p.r(e, 5) - .5) * .3 - age * age * .35, V, 1 - age);
      }
      p.light(x - .4, 0, hz, 1.6, V, .7);
      return;
    }

    const a = t - HIT, C = [cx, 0, hz];
    // flash: biggest on the first frames, collapses fast
    const fl = Math.pow(1 - p.ph(a, 0, .15), 3);
    if (fl > 0) p.glow(cx - .05, 0, hz, .35 + .6 * fl, V, 1.8 * fl, { pow: 1.3 });
    // lightning web: full length almost at once, flickers, dies with ease-in
    const nW = Math.round(p.param('webBolts'));
    const web = 1 - p.easeInCubic(p.ph(a, .18, .65)), reach = p.easeOutExpo(p.ph(a, 0, .07));
    if (web > 0) {
      const flick = fseed % 3 === 0 ? .65 : 1.1;
      for (let b = 0; b < nW; b++) {
        const ang = b * 2.39996 + .35 + (p.r(b, 51) - .5) * .5, len = (.8 + p.r(b, 52) * .6) * reach;
        const end = [cx - .15 - p.r(b, 53) * .4, Math.cos(ang) * len * .8, Math.max(.03, hz + Math.sin(ang) * len)];
        p.bolt(C, end, V, { seed: Math.floor(t * 12) * 9 + b, jag: .22, depth: 4, branches: b % 2 ? 1 : 2, w: .045, I: 1.15 * web * flick, glow: .3 });
      }
      p.glow(cx - .05, 0, hz, .3, V, web);
    }
    // broken rings: shoot out, slow, thin
    const nRg = Math.round(p.param('rings')), axes = [[1, 0, 0], [1, .55, .5], [1, -.55, .5], [1, .2, -.6]];
    for (let r = 0; r < nRg; r++) {
      const u = p.ph(a, .03 + r * .1, .8 + r * .15);
      if (u <= 0 || u >= 1) continue;
      p.ring(cx - .1, 0, hz, .3 + p.easeOutExpo(u) * (1.05 + r * .2), .06 * Math.pow(1 - u, 1.5) + .02, V, (1 - u) * 1.2,
        { axis: axes[r], fn: ang => (Math.sin(ang * 5 + r * 2) > -.45 ? 1 : 0) });
    }
    // motes: burst out fast, drag, hover, sink
    const nM = Math.round(p.param('motes') * p.density);
    for (let m = 0; m < nM; m++) {
      const u = p.ph(a, .02 + p.r(m, 61) * .1, 1.3 + p.r(m, 62) * .5);
      if (u <= 0 || u >= 1) continue;
      const ang = p.r(m, 63) * p.TAU, rad = p.drag(4 + p.r(m, 64) * 5, 5, a) * .9;
      const tw = (Math.floor(t * 10) + m) % 3 === 0 ? .5 : 1;
      p.dot(cx - .2 - p.r(m, 65) * .5, Math.cos(ang) * rad, hz + Math.sin(ang) * rad * .9 - u * u * .4, V, (1 - u) * tw);
    }
    p.light(cx, 0, hz, 2.2, V, Math.max(fl * 1.1, .9 * (1 - p.ph(a, 0, .8))));
  },
});
