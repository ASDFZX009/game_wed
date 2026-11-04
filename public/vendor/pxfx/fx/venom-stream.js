// 濺蝕毒流 / Corrosive Venom Jet — pixel version of 00GameDevs "venom-stream" (MIT)
PXFX.define({
  id: 'venom-stream',
  loop: 4,
  beats: [
    { t: .25, kind: 'cast', power: .6 }, { t: .42, kind: 'hit', power: .8 },
    { t: 1.15, kind: 'pulse', power: .5 }, { t: 1.85, kind: 'pulse', power: .6 }, { t: 2.5, kind: 'pulse', power: .6 },
  ],
  view: { r: 3.1, h: 2.2 },
  stage: { ground: 'dirt' },
  palette: {
    venom: ['#35603c', '#4f8a40', '#79b24e', '#acdc6f', '#d4f29a', '#f2ffd2'],
    toxic: ['#4f8a40', '#79b24e', '#acdc6f', '#d4f29a', '#f2ffd2'],
    crystal: ['#24502e', '#357a3a', '#5aa648', '#97d46a', '#d8f7a8'],
    stone: ['#4e4440', '#655953', '#7c6f67', '#94867c', '#ab9d92'],
  },
  timeline: [
    { t: [0, .25], zh: '蓄力：綠水晶一亮，水晶前的毒液球先脹大，發射前一刻壓扁縮細', en: 'charge: the green crystal flares, a venom ball in front of it swells, then squeezes small just before firing' },
    { t: [.25, .42], zh: '發射：毒流由水晶前噴出，越射越快，0.17 秒撞上木人', en: 'fire: the jet bursts out of the crystal, accelerating, and slams into the dummy in 0.17 s' },
    { t: [.42, .8], zh: '命中：12 團毒液向四面濺開，先快後慢再受重力落地；上下兩道新月形水花彈出（超出再回彈）', en: 'impact: 12 blobs splatter out fast, slow down and fall with gravity; two crescent splashes pop up and down with overshoot' },
    { t: [.8, 2.7], zh: '持續：雙股螺旋毒流不斷扭轉向前；1.15、1.85、2.5 秒各有一團鼓脹毒液加速沖到目標，水花瞬間濺高再回落；沿途滴下毒滴，落地彈出發光小水窪', en: 'sustain: the twin-strand jet twists forward; at 1.15, 1.85 and 2.5 s a gulp of venom races down the jet and the splash spikes, then settles; drops fall off and pop into glowing puddles' },
    { t: [2.7, 3], zh: '停止：毒流尾端加速追上目標，身後留下細小毒霧', en: 'stop: the jet tail accelerates into the target, leaving a fine toxic mist behind' },
    { t: [3, 4], zh: '水花急縮落下，地上水窪縮小消失，毒霧下沉', en: 'splashes collapse, puddles shrink away, the mist sinks' },
  ],
  layers: [
    { zh: '毒流：兩股實心液球鏈繞中軸螺旋（約 14 弧度一圈），半徑由 0.05 漸粗到 0.18，鼓脹紋向前流動', en: 'jet: two chains of solid liquid balls spiralling round the axis, radius 0.05 growing to 0.18, bulges flow forwards' },
    { zh: '鼓脹毒液：每次脈衝一團 1.8 倍粗的液球段，ease-in 加速由水晶沖到木人', en: 'gulp: a 1.8x thick section of the jet that accelerates (ease-in) from the crystal to the dummy on each pulse' },
    { zh: '毒滴：10 粒小液球由毒流脫落，水平速度受阻力減慢、帶重力落地，落點彈出直徑約 0.3 的發光綠水窪，1 秒內縮小消失', en: 'drops: 10 small liquid balls fall off the jet, horizontal speed lost to drag, gravity pulls them down; each pops a ~0.3 wide glowing puddle that shrinks away within 1 s' },
    { zh: '命中水花：上下兩道新月形液球弧，長度伸縮抖動，頂端甩出水滴', en: 'hit splash: two crescent arcs of liquid balls, up and down, flexing in length and flinging drops from their tips' },
    { zh: '濺射：命中時 12 團毒液、每次脈衝 6 團，向後方高速濺出再減速下墜', en: 'splatter: 12 blobs on the hit and 6 on each pulse, flung back fast, slowing and falling' },
    { zh: '毒霧：停止後沿原路線留下 16 個綠色像素點慢慢下沉淡出', en: 'mist: after the stop 16 green pixels hang along the old path, sinking and fading' },
    { zh: '道具：左邊石座上的綠水晶（施放源），右邊木人（目標）', en: 'props: green crystal on a stone pedestal at the left (source), training dummy at the right (target)' },
    { zh: '地面：沿毒流的黃綠色光照', en: 'ground: yellow-green light under the jet' },
  ],
  params: {
    jetWidth: { zh: '毒流粗細', en: 'jet width', min: .5, max: 1.8, step: .05, value: 1 },
    twist: { zh: '螺旋扭轉', en: 'twist rate', min: .3, max: 2, step: .1, value: 1 },
    drops: { zh: '毒滴數量', en: 'drop count', min: 0, max: 24, step: 1, value: 10 },
    splashSize: { zh: '水花大小', en: 'splash size', min: .5, max: 1.6, step: .05, value: 1 },
  },
  draw(p, t) {
    const V = this.palette.venom, X = this.palette.toxic, CR = this.palette.crystal, ST = this.palette.stone;
    const A = [-2.18, 0, 1.12], B = [2.1, 0, 1.0];
    const FIRE = .25, HIT = .42, STOP = 2.7, END = 3.0, GULPS = [1.15, 1.85, 2.5];
    const jw = p.param('jetWidth'), tw = p.param('twist'), ss = p.param('splashSize');
    p.box(-2.68, -.24, 0, -2.12, .24, .5, ST);
    const charge = Math.min(1, t / .1) * (1 - p.easeInCubic(p.ph(t, STOP, STOP + .3)));
    p.shard(-2.4, 0, .98, .6, .26, [0, 0, 1], CR, { sides: 5, spin: .3, back: .4, lit: .2 * charge });
    p.dummy(2.42, 0);

    const axis = u => [p.lerp(A[0], B[0], u), 0, p.lerp(A[2], B[2], u) + Math.sin(u * Math.PI) * .12];
    const head = p.easeIn(p.ph(t, FIRE, HIT)), tail = p.easeInCubic(p.ph(t, STOP, END));
    const live = t >= FIRE && head > tail + .01;
    const a = t - HIT, strike = a >= 0 ? Math.pow(1 - p.ph(a, 0, .14), 2) : 0;
    // gulps: a fat section racing down the jet, then the splash spikes (sharp attack, slow decay)
    let spike = 0;
    const gulpAt = [];
    for (const g of GULPS) {
      const x = p.ph(t, g - .35, g);
      if (x > 0 && x < 1) gulpAt.push(p.easeInCubic(x));
      const d = t - g;
      if (d >= 0 && d < .5) spike = Math.max(spike, Math.pow(1 - d / .5, 3));
    }
    if (charge > 0) { p.glow(A[0], 0, A[2], .16, X, .6 * charge); p.light(-2.4, 0, .6, 1, X, .5 * charge); }
    // charge ball: swells, then squeezes small right before the release
    if (t < FIRE + .05) {
      const c = p.ph(t, 0, FIRE), sw = c < .7 ? p.easeOutCubic(c / .7) : 1 - p.easeInCubic((c - .7) / .3) * .6;
      p.ball(A[0] + .05, 0, A[2], (.05 + .13 * sw) * jw, V, { shadow: false, lit: .1 });
    }

    // ----- jet: two strands of solid liquid balls twisting round the axis -----
    if (live) {
      const n = 46;
      for (let s = 0; s <= n; s++) {
        const u = tail + (head - tail) * s / n, c = axis(u);
        let bulge = 1 + .25 * Math.sin(u * 22 - t * 16);
        for (const g of gulpAt) bulge += .8 * Math.max(0, 1 - Math.abs(u - g) / .07);
        bulge += strike * .5 * Math.max(0, (u - .7) / .3);
        const rad = (.05 + .13 * u) * jw * bulge;
        const thin = Math.min(1, (head - u) / .05, (u - tail) / .05 + .3);
        for (let k = 0; k < 2; k++) {
          const ph = u * 14 * tw - t * 11 * tw + k * Math.PI;
          p.ball(c[0], Math.cos(ph) * rad * .75, c[2] + Math.sin(ph) * rad * .55, rad * .8 * thin + .02, V, { shadow: s % 6 === 0 && k === 0, lit: .05 });
        }
      }
      const s0 = axis(tail), s1 = axis(head);
      for (let k = 0; k < 6; k++) p.light(p.lerp(s0[0], s1[0], (k + .5) / 6), 0, .6, .8, X, .35);
    }

    // ----- drops falling off the jet (drag on the horizontal drift), puddles pop where they land -----
    const nD = Math.round(p.param('drops') * p.density);
    for (let d = 0; d < nD; d++) {
      const per = 1.1, off = p.r(d, 1) * per;
      for (let c = -1; c <= 0; c++) {
        const cyc = Math.floor((t + off) / per) + c, t0 = cyc * per - off;
        if (t0 < HIT || t0 > STOP) continue;
        const seed = d * 31 + cyc, u0 = .2 + p.r(seed, 2) * .65, s0 = axis(u0);
        const vx = 1.2 + p.r(seed, 3) * .8, vy = (p.r(seed, 4) - .5) * 1.4, vz = .3 + p.r(seed, 5) * .5, g = 5.5;
        const land = (vz + Math.sqrt(vz * vz + 2 * g * s0[2])) / g, age = t - t0;
        if (age < 0) continue;
        if (age < land) {
          const h = p.drag(1, 2.5, age);
          p.ball(s0[0] + vx * h, vy * h, s0[2] + vz * age - g * age * age / 2, .045 + p.r(seed, 6) * .03, V, { shadow: false });
        } else if (age < land + 1) {
          const f = age - land, h = p.drag(1, 2.5, land), lx = s0[0] + vx * h, ly = vy * h;
          const R = (.13 + p.r(seed, 7) * .08) * Math.max(0, p.easeOutBack(f / .15, 2.5)) * (1 - p.easeInCubic(p.ph(f, .5, 1))) * (1 - p.easeInCubic(p.ph(t, 3.5, 3.95)));
          if (R > .02) p.decal(lx, ly, 0, R * 1.05, (x, y, rho) => (rho < R ? (rho < R * .45 ? 1 : .6) : 0), X, .75 * (1 - f * .4));
        }
      }
    }

    // ----- splatter: a burst on the hit, a smaller one on each gulp; fast out, drag, gravity -----
    const splat = (t0, count, salt, pw) => {
      const age = t - t0;
      if (age < 0 || age > .9) return;
      for (let s = 0; s < count; s++) {
        const life = .45 + p.r(s, salt) * .35;
        if (age > life) continue;
        const ang = p.r(s, salt + 1) * p.TAU, sp = (4 + p.r(s, salt + 2) * 4) * pw * ss, d = p.drag(sp, 5.5, age);
        const x = B[0] - .2 - d * (.25 + p.r(s, salt + 3) * .45), y = Math.cos(ang) * d, z = B[2] + .1 + Math.sin(ang) * d * .55 + d * .25 - 4.5 * age * age;
        if (z < .03) continue;
        p.ball(x, y, z, (.06 + p.r(s, salt + 4) * .05) * (1 - age / life * .5) * Math.sqrt(ss), V, { shadow: false, lit: .1 });
      }
    };
    splat(HIT, Math.round(12 * p.density), 61, 1);
    GULPS.forEach((g, i) => splat(g, Math.round(6 * p.density), 71 + i * 7, .7));

    // ----- crescent splashes at the hit: pop out with overshoot, spike on each gulp, collapse at the end -----
    const open = a >= 0 ? Math.max(0, p.easeOutBack(p.ph(a, 0, .25), 2.6)) : 0;
    const hOn = open * (1 - p.easeInCubic(p.ph(t, END - .05, END + .25)));
    if (hOn > .02) {
      for (let k = 0; k < 2; k++) {
        const dir = k ? -1 : 1, len = ((k ? .62 : .72) + .16 * Math.sin(t * 9 + k * 2)) * hOn * ss * (1 + spike * .45 + strike * .3), curl = (.34 + .07 * Math.sin(t * 7 + k)) * ss;
        for (let s = 0; s <= 9; s++) {
          const v = s / 9;
          p.ball(B[0] - .2 - curl * Math.sin(v * Math.PI * .85), Math.sin(v * 2.2 + t * 3) * .06 + .05, Math.max(.04, B[2] + dir * len * v),
            (.11 * (1 - v) + .035) * (.6 + .4 * Math.min(1, hOn)) * Math.sqrt(ss), V, { shadow: false });
        }
        // a drop flung from the tip: fast, then slowing
        const u = (t * 1.6 + k * .5) % 1, z = B[2] + dir * (len + p.drag(1.6, 3, u)) - (dir > 0 ? u * u * .6 : 0);
        p.ball(B[0] - .25 - curl * .45, .05, Math.max(.05, z), .065 * (1 - u * .4), V, { shadow: false });
      }
      p.light(B[0] - .3, 0, .5, 1.1, X, (.6 + .3 * spike) * Math.min(1, hOn));
    }
    if (strike > 0) p.glow(B[0] - .2, 0, B[2], .3 + .4 * strike, X, 1.1 * strike);

    // ----- toxic mist left behind after the stop: sinks fast at first, then hangs -----
    if (t > STOP) {
      const m = p.drag(.6, 3, t - STOP);
      for (let k = 0; k < Math.round(16 * p.density); k++) {
        const u = p.r(k, 41) * .9, c = axis(u);
        if (u > tail) continue;
        const life = 1 - p.ph(t, STOP + u * .3, STOP + u * .3 + .8);
        p.dot(c[0] + (p.r(k, 42) - .5) * .3, (p.r(k, 43) - .5) * .4, c[2] + (p.r(k, 44) - .5) * .3 - m * .5, X, .7 * life);
      }
    }
  },
});
