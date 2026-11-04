// 沸泡毒陣 / Bubbling Venom Sigil — pixel version of 00GameDevs "venom-pool" (MIT)
PXFX.define({
  id: 'venom-pool',
  loop: 4.4,
  beats: [{ t: .1, kind: 'cast', power: .5 }, { t: 1.5, kind: 'pulse', power: .6 }, { t: 2.5, kind: 'pulse', power: .6 }, { t: 3.22, kind: 'burst', power: .7 }],
  view: { r: 2.2, h: 1.5 },
  stage: { ground: 'stone' },
  palette: {
    venom: ['#4f8a3a', '#72aa45', '#acdc6f', '#cdf09a', '#efffd0', '#ffffff'],
    pool: ['#3f6e3a', '#4f8a3a', '#72aa45', '#acdc6f'],
    mist: ['#a4c47a', '#c0dc98', '#dcefbc'],
  },
  timeline: [
    { t: [0, .6], zh: '幾顆毒泡先在地面冒起，毒池由 20% 大小急速鋪開成三瓣形（衝過頭約 8% 再縮回），雙線邊框亮起', en: 'a few bubbles bulge up first, the pool rushes out from 20% size into a three-lobed blob (overshooting ~8%, pulling back), its double rim lights' },
    { t: [.6, 3.2], zh: '持續：9 顆毒泡輪流鼓大（約 1.1–1.7 秒，先快後慢），破前 0.12 秒抖動，破掉時虛線波紋 ease-out-expo 急擴、4 滴毒液先快後慢彈出再受重力落下；兩顆大毒泡分別在 1.5、2.5 秒破裂：池面瞬間變亮，大波紋擴到 3 倍半徑，8 滴毒液＋一團毒霧噴起；毒霧起飛快、之後慢慢飄散', en: 'sustain: 9 bubbles take turns swelling (about 1.1–1.7 s, fast then slow), wobble for 0.12 s, then pop: a dashed ripple shoots out (ease-out-expo) and 4 drops fly out fast, slow and fall; two big bubbles pop at 1.5 and 2.5 s: the pool flashes, a big ripple runs out to 3x the radius, 8 drops and a mist puff burst up; mist lifts off fast, then drifts' },
    { t: [3.22, 4.1], zh: '收尾（爆發）：所有毒泡在 0.45 秒內接連破裂，毒池以 ease-out-expo 再擴大 20%，並以越來越快的噪聲侵蝕蒸發消失，毒霧淡出', en: 'end (burst): every bubble pops within 0.45 s, the pool spreads 20% wider (ease-out-expo) and evaporates through an accelerating noise dissolve, the mist fades' },
  ],
  layers: [
    { zh: '毒池：半徑約 1.15 的三瓣不規則形（3 次＋5 次餘弦起伏），亮色外框＋內側 0.14 第二道框，內部暗綠填色，中央 0.55 倍大小的虛線內框', en: 'pool: irregular three-lobed shape of radius ~1.15 (3rd + 5th harmonic wobble), bright rim plus a second rim 0.14 inside, dark green fill, dashed inner outline at 0.55 scale' },
    { zh: '池面紋：噪聲等高線做成的亮綠細紋，緩慢漂移，大泡破裂時變亮', en: 'surface: thin bright-green noise contour lines drifting slowly, flaring when a big bubble pops' },
    { zh: '毒泡：半透明半球（半徑 0.15–0.35，大泡 0.45），邊緣亮、頂部一點高光，破裂時消失', en: 'bubbles: translucent domes (radius 0.15–0.35, big ones 0.45) with a bright rim and a top highlight pixel, vanishing on the pop' },
    { zh: '破泡：一圈 8 段虛線波紋擴到 2.2 倍半徑，4 滴毒液帶阻力與重力彈起落下', en: 'pop: an 8-dash ripple ring expanding to 2.2x the bubble radius, 4 drops flicked up with drag and gravity' },
    { zh: '毒霧：5 團小而扁的淡黃綠光霧（半徑 0.26–0.38），由池面低處外飄上升；8 粒毒氣光點上升', en: 'mist: 5 small flat pale yellow-green glow puffs (radius 0.26–0.38) drifting out and up from just above the pool; 8 toxic motes rise' },
  ],
  params: {
    radius: { zh: '毒池半徑', en: 'pool radius', min: .8, max: 1.6, step: .05, value: 1.15 },
    bubbles: { zh: '毒泡數量', en: 'bubble count', min: 0, max: 18, step: 1, value: 9 },
    bubbleSize: { zh: '毒泡大小', en: 'bubble size', min: .5, max: 1.8, step: .05, value: 1 },
    mist: { zh: '毒霧數量', en: 'mist puffs', min: 0, max: 10, step: 1, value: 5 },
  },
  draw(p, t) {
    const C = this.palette.venom, PL = this.palette.pool, MI = this.palette.mist, TAU = p.TAU;
    const RP = p.param('radius'), kr = RP / 1.15, bs = p.param('bubbleSize');
    const grow = p.easeOutBack(p.ph(t, .1, .6), 1.6), end = p.ph(t, 3.2, 4.1), fade = 1 - p.easeInCubic(p.ph(end, .2, 1));
    if (t < .02 || fade < .05) return;
    const sc = (.2 + .8 * grow) * (1 + .2 * p.easeOutExpo(end)) * kr, eat = p.easeIn(end) * 1.1;
    const f = ang => sc * (1.15 + .2 * Math.cos(3 * ang + .6) + .08 * Math.cos(5 * ang + 2) + .03 * Math.sin(t * 2 + 3 * ang));
    const dis = (x, y) => end > 0 && p.noise(x * 3 / kr + 4, y * 3 / kr - 2) < eat;
    let flare = 0;
    for (const [tp, a] of [[1.5, 1], [2.5, 1], [3.22, .8]]) { const d = t - tp; if (d >= 0 && d < .6) flare = Math.max(flare, a * Math.pow(1 - d / .6, 3)); }

    p.light(0, 0, .3, 2 * kr, C, (.45 + .3 * flare) * Math.min(1, grow) * fade);
    if (grow > 0) {
      p.decal(0, 0, 0, sc * 1.45, (x, y, rho, ang) => {
        const R = f(ang);
        if (rho > R + .05 || dis(x, y)) return 0;
        if (Math.abs(rho - R) < .05) return 1;
        if (Math.abs(rho - (R - .14 * sc)) < .025) return .62;
        if (Math.abs(rho - R * .55) < .02 && ((ang / TAU * 16 + 16) % 1) < .55) return .55;
        const c = Math.abs(p.noise(x * 2.2 / kr + t * .25, y * 2.2 / kr - t * .15) - .5);
        if (c < .025) return .45 + .4 * flare;
        return .2 + .12 * flare;
      }, PL, fade);
    }
    // a bubble: swells fast then slow, wobbles just before the pop
    const dome = (x, y, r) => {
      if (r > .03) p.shell(x, y, 0, r, (nx, ny, nz, rim) => {
        if (nz > .82 && nx + ny < -.15) return 1;
        return rim > .45 ? .3 + (rim - .45) * 1.4 : .2;
      }, C, 1, { zmin: 0, back: .25 });
    };
    // a pop: ripple shoots out, drops fly out fast, slow down and fall
    const pop = (x, y, rmax, age, nDrop, reach, seed) => {
      const q = age / .45;
      if (q >= 1 && age > .7) return;
      if (q < 1 && fade > .2) p.ring(x, y, .02, rmax * (1 + p.easeOutExpo(q) * reach), .05 * (1 - q) + .02, C, Math.pow(1 - q, 1.5) * 1.2 * fade, { fn: a => (Math.cos(a * 8) > 0 ? 1 : 0) });
      for (let d = 0; d < nDrop; d++) {
        const da = d / nDrop * TAU + seed, sp = (1.4 + p.r(seed * 7 + d, 6)) * (.6 + .4 * rmax / .25), vz = 2 + p.r(seed * 7 + d, 7) * 1.2;
        const out = p.drag(sp, 5, age), z = .05 + p.drag(vz, 3, age) - 4.5 * age * age;
        if (z > 0) p.dot(x + Math.cos(da) * out, y + Math.sin(da) * out, z, C, 1, 2);
      }
    };
    const nB = Math.round(p.param('bubbles') * p.density);
    for (let k = 0; k < nB; k++) {
      const per = 1.1 + p.r(k, 1) * .6, ph = p.r(k, 2), cyc = Math.floor(t / per + ph);
      const start = cyc * per - ph * per;
      if (start < 0 && k > 3) continue;                            // only 4 bubbles in the very first wave
      const popAt = 3.22 + (k % 9) * .05;                          // end: everything pops
      const s = k * 37 + cyc, ang = p.r(s, 3) * TAU, rr = Math.sqrt(p.r(s, 4)) * .75;
      const x = Math.cos(ang) * f(ang) * rr, y = Math.sin(ang) * f(ang) * rr, rmax = (.15 + p.r(s, 5) * .2) * bs;
      let popT = start + per * .75;
      if (popT > popAt && start < popAt) popT = popAt;
      if (start >= popAt) continue;
      const age = t - start, pa = t - popT;
      if (pa < 0) {
        const u = age / (popT - start), wob = u > .88 ? .1 * Math.sin(age * 70) : 0;
        dome(x, y, rmax * p.easeOutCubic(u) * (1 + wob));
      } else pop(x, y, rmax, pa, Math.round(4 * p.density), 1.2, k);
    }
    // two big bubbles: slow swell, pop on the beats
    [[1.5, .38, -.22, 0], [2.5, -.42, .3, 1]].forEach(([tp, bx, by, i]) => {
      const x = bx * kr, y = by * kr, rmax = .45 * bs, t0 = tp - .9;
      if (t < t0 || t > tp + .8) return;
      if (t < tp) {
        const u = (t - t0) / .9, wob = u > .85 ? .08 * Math.sin(t * 60) : 0;
        dome(x, y, rmax * p.easeOutCubic(u) * (1 + wob));
      } else {
        const a = t - tp;
        pop(x, y, rmax, a, Math.round(8 * p.density), 2, 5 + i);
        const mu = p.ph(a, 0, .7);
        if (mu < 1) p.glow(x, y, .2 + p.easeOutCubic(mu) * .5, .3 + .25 * mu, MI, .5 * Math.pow(1 - mu, 1.5) * fade, { pow: 1, flatten: .6 });
      }
    });
    // mist puffs: lift off fast, then drift and thin out
    const nMi = Math.round(p.param('mist') * p.density);
    for (let m = 0; m < nMi; m++) {
      const u = (t * .2 + m / Math.max(1, nMi) + p.r(m, 9) * .1) % 1, e = p.easeOutCubic(u), ang = m * 2.6 + .4, rad = (.2 + e * .9) * kr;
      const I = .28 * (u < .12 ? u / .12 : Math.pow(1 - (u - .12) / .88, 1.5)) * Math.min(1, grow) * fade;
      if (I > .08) p.glow(Math.cos(ang) * rad, Math.sin(ang) * rad, .25 + e * .35, .26 + u * .12, MI, I, { pow: 1, flatten: .55 });
    }
    const nM = Math.round(8 * p.density);
    for (let m = 0; m < nM; m++) {
      const u = (t * .5 + p.r(m, 11)) % 1, ang = p.r(m, 12) * TAU, rad = p.r(m, 13) * .9 * kr;
      if (u < .85) p.dot(Math.cos(ang) * rad + Math.sin(u * 6 + m) * .08, Math.sin(ang) * rad, .1 + p.easeOutCubic(u) * 1.3, C, (1 - u) * Math.min(1, grow) * fade);
    }
  },
});
