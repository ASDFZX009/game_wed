// 殘影弧刃 / Afterimage Glaive — pixel version of 00GameDevs "shadow-glaive" (MIT)
PXFX.define({
  id: 'shadow-glaive',
  loop: 3.2,
  beats: [{ t: .25, kind: 'cast', power: .6 }, { t: 1.5, kind: 'hit', power: 1.1 }],
  view: { r: 3.1, h: 2.4 },
  stage: { ground: 'ash', tiles: true },
  palette: {
    blade: ['#4e3f80', '#7262a8', '#9a86cc', '#bfaee6', '#ece6fa'],
    shade: ['#5a3f9a', '#7a5ec0', '#a28bce', '#c8b6ea', '#ece4ff', '#ffffff'],
    smoke: ['#2a2238', '#3a3050', '#4e4266', '#62567c'],
  },
  timeline: [
    { t: [0, .25], zh: '現形：月牙刃由一點彈出（超出約 20% 再回彈），同時向後退 0.3 蓄勢', en: 'appear: the crescent pops out of a point (about 20% overshoot) while drawing back 0.3' },
    { t: [.25, 1.5], zh: '擲出：起步一下急衝，之後以 ease-in 越飛越快衝向木人，同時繞飛行軸翻轉並越翻越快；身後 3 個殘影（間隔 0.06 秒）隨速度拉開，白紫短橫線在經過處落下並受阻力漂移', en: 'throw: a quick kick, then ease-in acceleration into the dummy while rolling about the flight axis faster and faster; three afterimages 0.06 s apart spread out with speed, white-violet dashes drop where it passed and drift with drag' },
    { t: [1.5, 1.72], zh: '命中：首兩幀最大的紫白閃光；一道白色斬痕沿刃面方向 0.06 秒內拉滿，之後變細消失；暗紫煙團急速冒出', en: 'hit: violet-white flash biggest on the first two frames; a white slash line along the blade plane extends fully within 0.06 s, then thins out; dark violet smoke bursts out fast' },
    { t: [1.5, 2.5], zh: '刃身碎成 4 條細長碎片：高速向後迸出，受阻力減速、受重力下墜，旋轉逐漸變慢，最後以抖色急速消失', en: 'the blade breaks into 4 long slivers: they burst backwards fast, slow with drag, fall with gravity, spin down, then dissolve quickly through dither' },
  ],
  layers: [
    { zh: '刃身：實心月牙（外徑 0.62、覆蓋約 270°），中間最厚、兩端尖細；外緣一條白色高光線', en: 'blade: solid crescent (outer radius 0.62, about 270 degrees), thickest mid-way, tapering to points; white highlight line on the outer edge' },
    { zh: '殘影：同形狀的紫色發光面，亮度 0.62 / 0.45 / 0.32（每個 ×0.72，低亮度靠抖色變疏），越快間距越大', en: 'afterimages: same crescent as a violet emissive sheet at 0.62 / 0.45 / 0.32 intensity (x0.72 each, sparse dither when dim), spaced further apart the faster it flies' },
    { zh: '橫線：16 條長 0.12–0.3 的短光線，在經過的位置落下並受阻力向後漂', en: 'dashes: 16 short light dashes 0.12–0.3 long, dropped where the blade passed, drifting back with drag' },
    { zh: '斬痕：命中時一條寬 0.14 → 0 的白紫直線，方向沿刃面', en: 'slash: at the hit a white-violet line, 0.14 wide shrinking to 0, along the blade plane' },
    { zh: '碎片：4 段月牙碎塊＋各自一條紫色光邊，受阻力與重力下墜；煙：4 團暗紫色粗糙煙球，急速膨脹後上升並以抖色淡出；10 粒光點受阻力漂散', en: 'slivers: 4 crescent pieces, each with a violet light edge, falling with drag and gravity; smoke: 4 rough dark violet puffs that swell fast, rise and fade out with dither; 10 motes drifting with drag' },
  ],
  params: {
    afterimages: { zh: '殘影數量', en: 'afterimages', min: 0, max: 6, step: 1, value: 3 },
    bladeSize: { zh: '刃身大小', en: 'blade size', min: .6, max: 1.5, step: .05, value: 1 },
    roll: { zh: '翻轉速度', en: 'roll speed', min: 0, max: 2.5, step: .1, value: 1 },
    slivers: { zh: '碎片數量', en: 'slivers', min: 2, max: 8, step: 1, value: 4 },
  },
  draw(p, t) {
    const B = this.palette.blade, S = this.palette.shade, SM = this.palette.smoke;
    const CAST = .25, HIT = 1.5, bs = p.param('bladeSize'), RO = .62 * bs, hx = 2.12, hz = Math.max(1.05, .3 + RO);
    const TH0 = -.25 * Math.PI, TH1 = 1.25 * Math.PI, X0 = -2.35, XB = X0 - .3, XE = hx - .3 * bs;
    const nG = Math.round(p.param('afterimages')), rollK = p.param('roll'), nSl = Math.round(p.param('slivers'));
    p.dummy(2.45, 0);

    // crescent outline points in world space: plane spanned by +x and v = (0, -sin phi, cos phi); sc scales it
    const cres = (cx, cy, cz, phi, ta, tb, n, sc = 1) => {
      const vy = -Math.sin(phi), vz = Math.cos(phi), out = [], inn = [], R = RO * sc, off = .12 * bs * sc;
      for (let k = 0; k <= n; k++) {
        const th = p.lerp(ta, tb, k / n), w = .45 * Math.pow(Math.sin((th - TH0) / (TH1 - TH0) * Math.PI), .7);
        const u = Math.cos(th) * R, v = Math.sin(th) * R;
        out.push([cx + u, cy + (v - off) * vy, cz + (v - off) * vz]);
        inn.push([cx + u * (1 - w), cy + (v * (1 - w) - off) * vy, cz + (v * (1 - w) - off) * vz]);
      }
      return [out, inn];
    };
    const drawBlade = (pts, o, rim) => {
      const [out, inn] = pts;
      for (let k = 0; k < out.length - 1; k++) p.quad(out[k], out[k + 1], inn[k + 1], inn[k], B, o);
      if (rim > 0) p.trail(out, .05, .05, S, rim, rim * .8);
    };
    // launch kick, then accelerate; the roll speeds up with the flight
    const travel = f => .12 * p.easeOutCubic(f / .16) + .88 * Math.pow(p.clamp(f, 0, 1), 2.5);
    const flight = tt => {
      const k = travel(p.ph(tt, CAST, HIT));
      const x = tt < CAST ? p.lerp(X0, XB, p.easeOutCubic(tt / CAST)) : p.lerp(XB, XE, k);
      return [x, Math.sin(tt * 2.2) * .12, hz + Math.sin(tt * 3.1) * .08, rollK * (2.2 * tt + 4.5 * k)];
    };

    if (t < HIT) {
      const [x, y, z, phi] = flight(t), sc = p.easeOutBack(p.ph(t, 0, .2), 2.6);
      // dashes dropped where the blade passed: drift back with drag, fade
      const nD = Math.round(16 * p.density);
      for (let d = 0; d < nD; d++) {
        const P = .55, age = (t / P + p.r(d, 1)) % 1, tb = t - age * P;
        if (tb < CAST) continue;
        const q = flight(tb), dx = q[0] - .3 - p.drag(1.6, 3, age * P);
        const len = .12 + p.r(d, 2) * .18, dy = q[1] + (p.r(d, 3) - .5) * .8 * bs, dz = q[2] + (p.r(d, 4) - .5) * .7 * bs;
        p.line([dx, dy, dz], [dx - len, dy, dz], .04, S, (d % 3 ? .75 : 1.1) * (1 - age), { i1: .2 * (1 - age) });
      }
      // afterimages: fixed time lag, so they spread out as the blade speeds up
      for (let g = nG; g >= 1; g--) {
        const tt = t - g * .06;
        if (tt < CAST) continue;
        const [gx, gy, gz, gp] = flight(tt);
        const [go, gi] = cres(gx, gy, gz, gp, TH0, TH1, 12);
        p.ribbon(go, gi, (u, v) => .5 + .5 * v, S, .62 * Math.pow(.72, g - 1));
      }
      if (sc > .05) drawBlade(cres(x, y, z, phi, TH0, TH1, 14, sc), { lit: .2 }, 1.1);
      p.shadow(x, y, z, .35 * bs * sc);
      p.light(x, 0, z, 1.3, S, .5);
      return;
    }

    const a = t - HIT, [x0, y0, z0, phi0] = flight(HIT);
    // flash: biggest on the first frames, collapses fast
    const fl = Math.pow(1 - p.ph(a, 0, .14), 3);
    if (fl > 0) p.glow(hx - .05, 0, hz, .3 + .5 * fl, S, 1.6 * fl, { pow: 1.3 });
    // slash line along the blade plane: full length almost at once, then thins out
    const sl = Math.pow(1 - p.ph(a, 0, .22), 2);
    if (sl > 0) {
      const L = .85 * bs * p.easeOutExpo(p.ph(a, 0, .06)) + .05, vy = -Math.sin(phi0), vz = Math.cos(phi0);
      p.line([hx - .12, -vy * L, hz - vz * L], [hx - .12, vy * L, hz + vz * L], .14 * sl + .02, S, 1.4 * sl, { w1: .02 });
    }
    // slivers: burst back fast, drag, gravity, spin down, dissolve
    for (let s = 0; s < nSl; s++) {
      const ta = p.lerp(TH0, TH1, s / nSl), tb = p.lerp(TH0, TH1, (s + 1) / nSl);
      const [out, inn] = cres(x0, y0, z0, phi0, ta, tb, Math.max(2, Math.round(16 / nSl)));
      const c = out[out.length >> 1], vx = -1 - p.r(s, 21) * 1.5, vy = (p.r(s, 22) - .5) * 2.4, vz = .6 + p.r(s, 23) * 1.2;
      const d = p.drag(1, 3, a), spin = (p.r(s, 24) - .5) * 8 * p.drag(1, 2, a), cs = Math.cos(spin), sn = Math.sin(spin);
      const dz = vz * a - 3.5 * a * a;
      const tf = q => {
        const ox = q[0] - c[0], oz = q[2] - c[2];
        return [c[0] + ox * cs - oz * sn + vx * d, q[1] + vy * d, Math.max(.02, c[2] + ox * sn + oz * cs + dz)];
      };
      const fade = 1 - p.easeInCubic(p.ph(a, .25 + (s % 4) * .05, .85 + (s % 4) * .05));
      if (fade <= 0) continue;
      drawBlade([out.map(tf), inn.map(tf)], { alpha: fade }, .8 * fade);
    }
    // smoke: bursts out fast, then rises and thins
    for (let s = 0; s < 4; s++) {
      const u = p.ph(a, .02 + s * .03, .9 + s * .06);
      if (u <= 0 || u >= 1) continue;
      const ang = s / 4 * p.TAU + .6, out = p.easeOutExpo(u);
      p.ball(hx - .3 + Math.cos(ang) * .3 * (1 + out), Math.sin(ang) * .45 * (1 + out), hz + u * u * .8 + Math.sin(ang) * .15,
        .14 + out * .26, SM, { alpha: (1 - u * u) * .85, rough: .5, shadow: false, seed: s });
    }
    // drifting motes: fast out, drag
    const nM = Math.round(10 * p.density);
    for (let m = 0; m < nM; m++) {
      const u = p.ph(a, (m % 10) * .02, .7 + (m % 10) * .03);
      if (u <= 0 || u >= 1) continue;
      const ang = p.r(m, 31) * p.TAU, d = p.drag(3, 4.5, a);
      p.dot(hx - .2 - d * .5 * p.r(m, 32), Math.cos(ang) * d * .9, hz + Math.sin(ang) * d * .6 + u * .3, S, 1 - u);
    }
    p.light(hx, 0, hz, 1.6, S, .9 * Math.max(fl, .7 * (1 - p.ph(a, 0, .8))));
  },
});
