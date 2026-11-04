// 暗能汲流 / Dark Energy Siphon — pixel version of 00GameDevs "soul-siphon" (MIT)
PXFX.define({
  id: 'soul-siphon',
  loop: 4.2,
  beats: [
    { t: .1, kind: 'cast', power: .5 }, { t: .35, kind: 'hit', power: .7 },
    { t: 1.25, kind: 'pulse', power: .6 }, { t: 1.89, kind: 'pulse', power: .6 }, { t: 2.53, kind: 'pulse', power: .7 }, { t: 3.17, kind: 'pulse', power: .6 },
  ],
  view: { r: 3.1, h: 2.2 },
  stage: { ground: 'ash', tiles: true },
  palette: {
    soul: ['#5e3c9e', '#7b56c8', '#a883e8', '#c8aaf5', '#ebe0ff', '#ffffff'],
    shade: ['#3b2a5a', '#4f3a78', '#674e96', '#8166b0', '#9c84c8'],
    amethyst: ['#3a2463', '#56378f', '#7a55c0', '#a585e4', '#d4c2fa'],
    stone: ['#3a3440', '#4c4554', '#5f5768', '#746b7c', '#8a8190'],
  },
  timeline: [
    { t: [0, .1], zh: '水晶外的虛線環彈出（超出再回彈）', en: 'the dashed ring round the crystal pops out with overshoot' },
    { t: [.1, .35], zh: '兩條波浪細線由水晶射出，越伸越快，0.25 秒勾住木人', en: 'two wavy threads shoot out of the crystal, accelerating, and hook the dummy within 0.25 s' },
    { t: [.35, .7], zh: '勾中：木人前虛線環彈出、木人身上閃光，6 團暗紫煙向外爆開再減速上升', en: 'latch: the dummy ring pops, the dummy flashes, 6 dark violet puffs blast outward, slow down and rise' },
    { t: [.35, 2.6], zh: '持續：每 0.16 秒一團魂魄由木人扯出，起步一下急拉、之後越飛越快衝入水晶，速度越快拖尾越長；每第 4 團為大魂魄，被吸入時水晶彈大、閃光並射出一圈光環（1.25、1.89、2.53、3.17 秒）', en: 'sustain: a wisp is torn off the dummy every 0.16 s with a jolt, then accelerates into the crystal, its tail stretching with speed; every 4th is a big soul whose absorption makes the crystal pop, flash and fire a ring (1.25, 1.89, 2.53, 3.17 s)' },
    { t: [2.6, 3.6], zh: '停止：不再產生新魂魄，剩下的繼續流完；細線由右向左跟隨最後一團魂魄消失', en: 'stop: no new wisps, the remaining ones finish the trip; the threads vanish right-to-left behind the last wisp' },
    { t: [3.6, 4.2], zh: '虛線環急縮熄滅，水晶回復暗色', en: 'the dashed rings collapse quickly, the crystal turns dark again' },
  ],
  layers: [
    { zh: '汲流線：2 條 1 像素淡紫波浪線（2.5 個波，兩端收窄），互相反相交纏', en: 'threads: 2 thin pale violet sine lines (2.5 waves, pinched at both ends), in opposite phase so they braid' },
    { zh: '魂魄：約 6 團同時在線上，白色圓頭（直徑 3–4 像素）＋5 節紫色尾巴，尾巴長度跟速度成正比；大魂魄頭部 1.6 倍', en: 'wisps: about 6 at a time, round white head (3-4 px) with a 5-step violet tail whose length follows the speed; big souls have a 1.6x head' },
    { zh: '虛線環：水晶外半徑 0.38、木人前半徑 0.22 的直立虛線環，慢轉', en: 'dashed rings: upright dashed rings, radius 0.38 around the crystal and 0.22 in front of the dummy, turning slowly' },
    { zh: '吸收光環：大魂魄到達時由水晶向外 ease-out-expo 擴散的光環＋四角星', en: 'absorb ring: when a big soul arrives a ring shoots out of the crystal (ease-out-expo) with a star glint' },
    { zh: '暗煙：勾中時 6 團爆開，之後持續有 5 團深紫抖色煙球由木人升起，先快後慢', en: 'dark smoke: 6 puffs burst out on the latch, then 5 deep violet dithered puffs keep rising off the dummy, fast then slow' },
    { zh: '道具：左邊石座上浮動的紫水晶（施放者），右邊木人（目標）', en: 'props: a floating amethyst over a stone plinth at the left (caster), training dummy at the right (target)' },
    { zh: '地面：沿汲流的紫色光照，水晶下最亮', en: 'ground: violet light along the stream, brightest under the crystal' },
  ],
  params: {
    strands: { zh: '汲流線數量', en: 'strands', min: 1, max: 3, step: 1, value: 2 },
    wispSize: { zh: '魂魄大小', en: 'wisp size', min: .6, max: 1.6, step: .05, value: 1 },
    waveAmp: { zh: '波浪幅度', en: 'wave amplitude', min: 0, max: 2, step: .1, value: 1 },
    smoke: { zh: '暗煙數量', en: 'smoke puffs', min: 0, max: 12, step: 1, value: 5 },
  },
  draw(p, t) {
    const S = this.palette.soul, SH = this.palette.shade, AM = this.palette.amethyst, ST = this.palette.stone;
    const A = [-2.3, 0, 1.2], B = [2.1, 0, 1.0];
    const SHOOT = .1, LATCH = .35, STOP = 2.6, TRAVEL = .9, GAP = .16;
    const nStr = Math.max(1, Math.round(p.param('strands'))), ws = p.param('wispSize'), amp = p.param('waveAmp');
    const jMax = Math.floor((STOP - LATCH) / GAP), lastArr = LATCH + jMax * GAP + TRAVEL;
    // travel curve: a jolt off the target, then accelerate into the crystal (0 -> 1 of the way)
    const k = x => .1 * p.easeOutCubic(x / .2) + .9 * x * x;
    const bob = Math.sin(t * 2.2) * .04;
    p.box(-2.58, -.24, 0, -2.02, .24, .5, ST);
    p.dummy(2.42, 0);

    // absorption: every wisp gives a flicker, every 4th (big soul) a hard pulse; sharp attack, slow decay
    let flick = 0, big = 0, bd = 9;
    for (let j = Math.max(0, Math.floor((t - TRAVEL - .6 - LATCH) / GAP)); j <= jMax; j++) {
      const d = t - (LATCH + j * GAP + TRAVEL);
      if (d < 0) break;
      if (j % 4 === 0 && d < .6) { big = Math.max(big, Math.pow(1 - d / .6, 3)); bd = Math.min(bd, d); }
      if (d < .12) flick = Math.max(flick, 1 - d / .12);
    }
    const pop = 1 + .3 * Math.exp(-bd * 7) * Math.cos(bd * 22);      // crystal swells on a big soul and springs back
    p.shard(A[0], 0, A[2] + bob, .6 * pop, .3 * pop, [0, 0, 1], AM, { sides: 5, spin: t * .8, back: .45, shadow: false, lit: .25 * Math.max(flick * .6, big) });
    p.shadow(A[0], 0, .9, .16);

    // braided wavy paths, u = 0 at the caster, 1 at the target
    const path = (s, u) => {
      const e = Math.sin(u * Math.PI) * amp, ph = u * Math.PI * 5 + s * p.TAU / Math.max(2, nStr) + t * 1.2;
      return [p.lerp(A[0] + .22, B[0], u), Math.sin(ph) * .34 * e, p.lerp(A[2], B[2], u) + Math.cos(ph) * .17 * e];
    };
    // alive part of the threads: shoots out from the crystal, dies right-to-left behind the last wisp
    const front = p.easeIn(p.ph(t, SHOOT, LATCH));
    const back = t > STOP + GAP ? p.clamp(1 - k(p.ph(t, lastArr - TRAVEL, lastArr)) + .04, 0, 1) : 1;
    const hi = Math.min(front, back);
    const ringA = Math.max(0, p.easeOutBack(p.ph(t, 0, .2), 2.4)), ringB = Math.max(0, p.easeOutBack(p.ph(t, LATCH, LATCH + .2), 2.4));
    const ringOff = 1 - p.easeInCubic(p.ph(t, lastArr + .1, lastArr + .4));
    const N = p.mode === '2d' ? [1, 1.6, 0] : [1, .42, 0], nl = Math.hypot(N[0], N[1]), ax = [N[0] / nl, N[1] / nl, 0];

    if (ringOff > 0) {
      p.ring(A[0], 0, A[2] + bob, .38 * ringA * ringOff * (1 + .2 * big), .035, S, (.9 + .3 * big) * Math.min(1, t / .05), { axis: ax, fn: a => (Math.sin(a * 7 + t * 3) > -.1 ? 1 : 0) });
      if (t >= LATCH) p.ring(B[0] - .05, 0, B[2], .22 * ringB * ringOff, .03, S, .8, { axis: ax, fn: a => (Math.sin(a * 5 - t * 4) > 0 ? 1 : 0) });
      p.light(A[0], 0, .5, 1.2, S, (.55 + .4 * big) * ringOff);
    }
    // threads
    if (t >= SHOOT && hi > .01) {
      for (let s = 0; s < nStr; s++) {
        let prev = null;
        const n = 28;
        for (let i = 0; i <= n; i++) {
          const q = path(s, hi * i / n);
          if (prev) p.line(prev, q, .025, S, .42);
          prev = q;
        }
      }
      if (t < LATCH) { const q = path(0, hi); p.glow(q[0], q[1], q[2], .14, S, .8); }
      for (let i = 0; i < 8; i++) p.light(p.lerp(A[0], B[0], hi * (i + .5) / 8), 0, .6, .8, S, .3);
    }
    // latch: flash on the dummy
    const lt = t - LATCH, strike = lt >= 0 ? Math.pow(1 - p.ph(lt, 0, .15), 2) : 0;
    if (strike > 0) { p.glow(B[0], 0, B[2], .3 + .4 * strike, S, 1.2 * strike); p.sparkle(B[0] - .1, 0, B[2], 3, S, strike); }
    // wisps
    const j0 = Math.max(0, Math.floor((t - LATCH - TRAVEL) / GAP)), j1 = Math.min(jMax, Math.floor((t - LATCH) / GAP));
    for (let j = j0; j <= j1; j++) {
      const age = t - LATCH - j * GAP, x = age / TRAVEL;
      if (x < 0 || x >= 1) continue;
      const s = j % nStr, wob = (p.r(j, 1) - .5) * .08, isBig = j % 4 === 0, sz = ws * (isBig ? 1.6 : 1);
      const at = xx => { const q = path(s, 1 - k(Math.max(0, xx))); q[2] += wob; return q; };
      const h = at(x), tail = [h];
      for (let i = 1; i <= 5; i++) tail.push(at(x - i * .035));
      const fadeIn = Math.min(1, x / .06);
      p.trail(tail, .19 * sz, .02, S, .85 * fadeIn, .35 * fadeIn);
      p.glow(h[0], h[1], h[2], .17 * sz, S, (.55 + (isBig ? .3 : 0)) * fadeIn);
      p.orb(h[0], h[1], h[2], .085 * sz, S, 1.1 * fadeIn);
    }
    if (flick > 0 || big > 0) p.sparkle(A[0] + .12, 0, A[2] + bob + .34, 2 + Math.round(3 * big), S, Math.max(flick * .8, big * 1.2));
    // big soul absorbed: a ring shoots out of the crystal, slows and thins
    for (let j = 0; j <= jMax; j += 4) {
      const u = p.ph(t, LATCH + j * GAP + TRAVEL, LATCH + j * GAP + TRAVEL + .45);
      if (u <= 0 || u >= 1) continue;
      p.ring(A[0], 0, A[2] + bob, .2 + p.easeOutExpo(u) * .8, .1 * Math.pow(1 - u, 1.5) + .02, S, 1 - u, { axis: ax });
    }
    // dark smoke: a burst on the latch, then a slow stream rising off the drained target
    const nB = Math.round(6 * p.density);
    for (let s = 0; s < nB && lt > 0; s++) {
      const u = p.ph(lt, 0, .7 + p.r(s, 11) * .4);
      if (u >= 1) continue;
      const ang = s / Math.max(1, nB) * p.TAU + p.r(s, 12), d = p.drag(2.4, 6, lt);
      p.ball(2.3 + Math.cos(ang) * .25 * d - .1 * d, Math.sin(ang) * .35 * d, B[2] + Math.sin(ang) * .2 * d + p.drag(.8, 2, lt),
        .1 + .1 * u, SH, { alpha: (1 - u) * .9, rough: .5, shadow: false, seed: s + 20 });
    }
    const drain = p.ph(t, LATCH, LATCH + .3) * (1 - p.ph(t, STOP, STOP + .6));
    const nS = Math.round(p.param('smoke') * p.density);
    for (let s = 0; s < nS; s++) {
      const per = 1.1, u = ((t + p.r(s, 5) * per) / per) % 1, ang = p.r(s, 6) * p.TAU;
      const a = drain * (1 - u) * p.ph(u, 0, .15);
      if (a <= .05) continue;
      p.ball(2.42 + Math.cos(ang) * .3, Math.sin(ang) * .3, .7 + p.drag(3, 2.6, u * per), .12 + u * .12, SH, { alpha: a, rough: .5, shadow: false, seed: s });
    }
  },
});
