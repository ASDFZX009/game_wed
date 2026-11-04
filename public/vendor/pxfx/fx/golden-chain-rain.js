// 金鏈驟雨 / Golden Chain Rain — pixel version of 00GameDevs "golden-chain-rain" (MIT)
PXFX.define({
  id: 'golden-chain-rain',
  loop: 5.6,
  // the first landing of each wave lands hard; the final wave is a tighter volley
  beats: [{ t: .45, kind: 'hit', power: .8 }, { t: 1.35, kind: 'hit', power: .85 }, { t: 2.25, kind: 'hit', power: 1.1 }],
  view: { r: 2.4, h: 2.7 },
  stage: { ground: 'slate', tiles: true },
  palette: {
    gold: ['#8a5c1a', '#b8821e', '#e0aa36', '#ffd166', '#ffeaa8', '#fffbe8'],
    metal: ['#7a5418', '#a8781e', '#d8a432', '#ffd166', '#fff3c0'],
  },
  timeline: [
    { t: [0, .45], zh: '第一波：空中 5 個金色波紋環先彈開（過衝約 30%）、發射前一下收緊，0.15 秒後金鏈從上方不同方向斜射落下：起步輕推一下，之後急加速，0.3 秒內插地；越快箭頭後的速度線越長', en: 'wave 1: 5 golden ripple rings pop open in the air (~30% overshoot) and pinch tight just before launch; 0.15 s later the chains shoot down diagonally: a small kick, then hard acceleration, landing within 0.3 s; the speed streak behind each arrowhead grows with speed' },
    { t: [.45, .9], zh: '插地（0.45 秒命中拍）：箭頭像彈簧般先插深到約 0.17 再回彈到 0.13，鏈身左右晃動並快速衰減；白金閃光在前 2 幀最大，碎光先快後慢（阻力）並受重力下墜，一圈地面衝擊環急速擴張後變細，6 道裂縫在 0.2 秒內迸開', en: 'contact (hit beat at 0.45 s): each arrowhead springs in to about 0.17 deep and settles at 0.13 while the chain whips sideways and damps out fast; a white-gold flash is biggest on the first 2 frames, sparks fly fast then slow (drag) and fall, a ground shock ring shoots out and thins, 6 fissures crack open within 0.2 s' },
    { t: [.9, 2.6], zh: '第二、三波：1.35 秒、2.25 秒再各落 5 條，交叉成網；第三波落點間隔減半，像一輪齊射；鏈身有亮光由上往下流動', en: 'waves 2 and 3: 5 more chains land from 1.35 s and 2.25 s, crossing into a net; the third wave lands twice as tightly, like a volley; bright highlights flow down each chain' },
    { t: [1.15, 4.2], zh: '侵蝕：每條鏈開始飛行 1 秒後由上往下逐節碎散成發光碎屑，碎散先慢後急，最後箭頭也碎掉', en: 'erosion: 1 s after each launch the chain crumbles link by link from the top into glowing chips, slowly at first then rushing down, the arrowhead last' },
    { t: [2.6, 5.6], zh: '餘光：裂縫柔光持續，碎片沿裂縫緩緩上浮；每道裂縫在最後 0.5 秒急速收熄', en: 'afterglow: the fissures keep glowing while chips drift slowly up along them; each fissure snaps shut in its last 0.5 s' },
  ],
  layers: [
    { zh: '鎖鏈：每 0.12 一節，「O」節用 3×3 亮塊、「|」節用 2×2 暗金，底下一條細金線', en: 'chain: a link every 0.12; "O" links as 3x3 bright blocks, "|" links as 2x2 dark gold, over a thin gold line' },
    { zh: '流光：一段亮帶沿鏈由源頭流向箭頭，每 0.5 秒一次', en: 'flow: a bright band runs down each chain from source to arrow every 0.5 s' },
    { zh: '箭頭：金色實體三稜錐（長 0.48、寬 0.2），尖端朝飛行方向；飛行時尾端拖一道速度線，長 0.3→1.5 隨速度增長', en: 'arrowhead: solid gold three-sided bipyramid (0.48 long, 0.2 wide) pointing along the flight; a speed streak behind it grows from 0.3 to 1.5 long with speed' },
    { zh: '源頭金水：鏈從空中一圈小波紋光環中伸出，光環 easeOutBack 彈開、發射後急縮消失', en: 'source water: each chain emerges from a small rippling ring of light in the air that pops open with ease-out-back and collapses after launch' },
    { zh: '地裂：每個落點 6 道鋸齒狀發光裂縫，長 0.3–0.6，以 ease-out-expo 在 0.2 秒內迸開，剛裂開時最亮，持續約 2.6 秒', en: 'fissures: 6 jagged glowing cracks per contact, 0.3–0.6 long, bursting open with ease-out-expo in 0.2 s, brightest when fresh, lasting about 2.6 s' },
    { zh: '衝擊：落點白閃光 0.12 秒內收縮；地面衝擊環半徑 0.08→0.6、越擴越細', en: 'impact: a white flash at the contact collapses within 0.12 s; a ground shock ring from 0.08 to 0.6 radius, thinning as it grows' },
    { zh: '碎片：每個落點 8 道帶阻力與重力的金色碎光；侵蝕時逐節剝落的光屑；裂縫上 5 粒慢慢上浮的金點', en: 'chips: 8 gold spark streaks per contact with drag and gravity, glowing flakes peeling off the eroding links, 5 gold motes rising slowly from each crack' },
  ],
  params: {
    chains: { zh: '每波鎖鏈數', en: 'chains per wave', min: 1, max: 8, step: 1, value: 5 },
    slant: { zh: '落下斜度', en: 'fall slant', min: 0, max: 1.6, step: .1, value: 1 },
    crackLength: { zh: '地裂長度', en: 'crack length', min: .4, max: 2, step: .1, value: 1 },
    sparks: { zh: '落地碎光數', en: 'contact sparks', min: 0, max: 20, step: 1, value: 8 },
  },
  // chain layout for the current knobs (cached per chains/slant pair); randoms keyed by wave*8 + index
  chains(p) {
    const n = Math.max(1, Math.round(p.param('chains'))), sl = p.param('slant'), key = n + ':' + sl;
    if (this._chKey === key) return this._ch;
    const out = [];
    for (let w = 0; w < 3; w++) {
      const st = Math.min(.12, .32 / Math.max(1, n - 1)) * (w === 2 ? .5 : 1);
      for (let j = 0; j < n; j++) {
        const k = w * 8 + j, ta = p.r(k, 1) * p.TAU, tr = .35 + p.r(k, 2) * 1.05;
        const T = [Math.cos(ta) * tr, Math.sin(ta) * tr, 0];
        const sa = (j / n) * p.TAU + w * .7 + p.r(k, 3) * .6, sd = (1.3 + p.r(k, 4) * .7) * sl;
        const S = [T[0] + Math.cos(sa) * sd, T[1] + Math.sin(sa) * sd, 3.1 + p.r(k, 5) * .4];
        const d = [T[0] - S[0], T[1] - S[1], T[2] - S[2]], L = Math.hypot(d[0], d[1], d[2]);
        out.push({ T, S, d: d.map(v => v / L), L, at: .15 + w * .9 + j * st, k });
      }
    }
    this._chKey = key;
    return (this._ch = out);
  },
  draw(p, t) {
    const G = this.palette.gold, M = this.palette.metal;
    const TRAVEL = .3, ERODE0 = 1.0, ERODE1 = 1.6;
    const crack = p.param('crackLength'), nS = Math.round(p.param('sparks') * p.density), nM = Math.round(5 * p.density);
    for (const c of this.chains(p)) {
      const a = t - c.at;
      if (a < -.15) continue;
      // cracks, chips and contact burst (they outlive the chain)
      if (a >= TRAVEL) this.ground(p, c, a - TRAVEL, G, crack, nS, nM);
      if (a > ERODE1 + .3) continue;
      // source ripple: pops open with overshoot, pinches tight right before launch, flares and collapses after
      const pop = p.easeOutBack(p.ph(a, -.15, -.04), 2.4), pinch = a < 0 ? p.smooth(-.06, 0, a) : Math.max(0, 1 - a / .06);
      const gone = 1 - p.easeInCubic(p.ph(a, .3, .65)), srcR = (.13 + .04 * Math.sin(a * 20)) * pop * (1 - .4 * pinch) * gone;
      if (srcR > .01) p.ring(c.S[0], c.S[1], c.S[2], srcR, .04, G, (.7 + .5 * pinch) * gone, { axis: c.d });
      if (a < 0) continue;
      // flight: a small kick out of the ring, then hard acceleration into the ground
      const u = a / TRAVEL, la = a - TRAVEL;
      const head = a < TRAVEL ? .1 * p.easeOutCubic(u / .2) + .9 * p.easeInCubic(u) : 1;
      const pen = a < TRAVEL ? 0 : .13 * p.spring(la, 4, 9);       // springs in deeper, then settles
      const tipS = head * c.L + pen;                                // distance of the arrow tip from the source
      const er = p.easeIn(p.ph(a, ERODE0, ERODE1));                  // erosion front, 0 = source .. 1 = tip
      const wob = a > TRAVEL ? Math.exp(-la * 8) * Math.sin(la * 40) * .11 : 0;
      const side = [-c.d[1], c.d[0], 0];
      const at = s => {
        const q = s / c.L, bow = Math.sin(q * Math.PI) * wob;
        return [c.S[0] + c.d[0] * s + side[0] * bow, c.S[1] + c.d[1] * s + side[1] * bow, c.S[2] + c.d[2] * s];
      };
      // links
      const SP = .12, n = Math.floor((tipS - .2) / SP), flow = ((a * 2) % 1) * c.L;
      for (let i = 0; i <= n; i++) {
        const s = i * SP, q = s / c.L;
        if (q < er) continue;
        const P = at(s), near = er > 0 ? Math.max(0, 1 - (q - er) * 12) : 0;
        const lit = Math.max(0, 1 - Math.abs(s - flow) / .25);
        const big = p.mode === '2d' ? 2 : 3;
        if (i % 2 === 0) p.dot(P[0], P[1], P[2], G, .47 + .53 * Math.max(lit, near), big);
        else p.dot(P[0], P[1], P[2], G, .3 + .5 * lit, 2);
        if (near > .6 && i % 3 === 0) {                      // flakes peeling off the erosion front
          const f = (a * 3 + i * .37) % 1;
          p.dot(P[0] + f * .15, P[1] - f * .1, P[2] + f * .3, G, .8 * (1 - f));
        }
      }
      if (n > 0 && er < 1) p.line(at(Math.max(er * c.L, 0)), at(n * SP), .05, G, .2);
      // arrowhead
      if (er < .97) {
        const tip = at(tipS), ctr = [tip[0] - c.d[0] * .24, tip[1] - c.d[1] * .24, tip[2] - c.d[2] * .24];
        p.shard(ctr[0], ctr[1], ctr[2], .48, .2, c.d, M, { back: .22, spin: c.k * .7, sides: 3, lit: .15, shadow: tip[2] > .05 });
        if (a < TRAVEL) {                                    // speed streak, longer as the arrow speeds up
          const len = .3 + 1.2 * u * u;
          p.line(ctr, [ctr[0] - c.d[0] * len, ctr[1] - c.d[1] * len, ctr[2] - c.d[2] * len], .1 + .08 * u, G, .45 + .45 * u, { w1: .02, i1: 0, pow: 2 });
        }
        if (er > .8) p.sparkle(ctr[0], ctr[1], ctr[2], 2, G, 1);
      }
    }
  },
  ground(p, c, a, G, crack, nS, nM) {
    const life = 2.6, fade = 1 - p.easeInCubic(p.ph(a, life - .5, life));
    if (fade <= 0) return;
    const [x, y] = c.T, open = p.easeOutExpo(p.ph(a, 0, .2)), hot = Math.pow(1 - p.ph(a, 0, .4), 2);
    const ends = [];
    for (let f = 0; f < 6; f++) {
      const ang = f / 6 * p.TAU + p.r(c.k, 10 + f) * .7, len = (.3 + p.r(c.k, 20 + f) * .3) * open * crack;
      const kx = .5 + (p.r(c.k, 30 + f) - .5) * .3, jog = (p.r(c.k, 40 + f) - .5) * .5;
      const m = [x + Math.cos(ang + jog * .5) * len * kx, y + Math.sin(ang + jog * .5) * len * kx, .01];
      const e = [x + Math.cos(ang) * len, y + Math.sin(ang) * len, .01];
      p.line([x, y, .01], m, .05, G, (.9 + .4 * hot) * fade, { w1: .035 });
      p.line(m, e, .035, G, (.7 + .4 * hot) * fade, { w1: .01, i1: .3 * fade });
      ends.push(e);
    }
    // motes rising slowly along the cracks
    if (a > .2) for (let k = 0; k < nM; k++) {
      const e = ends[k % 6], v = (a * .5 + p.r(c.k * 16 + k, 50)) % 1;
      p.dot(p.lerp(x, e[0], .4 + v * .4), p.lerp(y, e[1], .4 + v * .4), .05 + v * .55, G, (1 - v) * fade);
    }
    p.light(x, y, 0, .7, G, (.5 + .7 * hot) * fade);
    if (a < .6) {                                            // contact burst: biggest on the first frames
      for (let s = 0; s < nS; s++) {
        const key = c.k * 32 + s, life = .28 + p.r(key, 62) * .3;
        if (a > life) continue;
        const ang = p.r(key, 59) * p.TAU, sp = 4 + p.r(key, 60) * 2.6, vz = 3.4 + p.r(key, 61) * 2.4;
        const a0 = Math.max(0, a - .06);
        const d = p.drag(sp, 5, a), d0 = p.drag(sp, 5, a0);
        const h = p.drag(vz, 5, a) - 7 * a * a, h0 = p.drag(vz, 5, a0) - 7 * a0 * a0;
        if (h <= 0) continue;
        const cs = Math.cos(ang), sn = Math.sin(ang);
        p.line([x + cs * d, y + sn * d, h], [x + cs * d0, y + sn * d0, Math.max(0, h0)], .05, G, 1.1 - a / life * .7, { w1: .02 });
      }
      const fl = Math.pow(1 - p.ph(a, 0, .12), 2);
      if (fl > 0) { p.glow(x, y, .12, .18 + .3 * fl, G, 1.5 * fl); p.sparkle(x, y, .15, 4 * fl, G, fl); }
      const ru = p.ph(a, 0, .38);                           // ground shock ring: shoots out, thins
      if (ru < 1) p.ring(x, y, .02, .08 + p.easeOutExpo(ru) * .52 * Math.sqrt(crack), .07 * (1 - ru) + .015, G, .95 * (1 - ru));
    }
  },
});
