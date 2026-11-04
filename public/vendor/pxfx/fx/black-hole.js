// 渦光黑洞 / Luminous Vortex Black Hole — pixel version of 00GameDevs "black-hole" (MIT)
PXFX.define({
  id: 'black-hole',
  loop: 6,
  // formation, a flare each time a pebble is swallowed (1.8, 2.9, 4.0), the final pinpoint burst
  beats: [
    { t: .15, kind: 'cast', power: .8 },
    { t: 1.8, kind: 'pulse', power: .45 }, { t: 2.9, kind: 'pulse', power: .45 }, { t: 4, kind: 'pulse', power: .5 },
    { t: 5.3, kind: 'burst', power: .9 },
  ],
  view: { r: 2.7, h: 2.7 },
  stage: { ground: 'sand', tiles: true },
  palette: {
    disk: ['#4b3aa8', '#9a46a8', '#e0663a', '#ffab42', '#ffd98a', '#fff6e0'],
    void: ['#040308', '#08060e', '#0d0a16', '#141020'],
    stone: ['#5a5464', '#736c7c', '#8e8794', '#a8a1aa', '#c2bcc0'],
    rock: ['#4a4038', '#625448', '#7c6a58', '#96806a'],
  },
  timeline: [
    { t: [0, .15], zh: '預兆：半空一點紫光，6 粒光點加速被吸進去', en: 'omen: a violet pinpoint in mid-air, 6 motes accelerate into it' },
    { t: [.15, .85], zh: '成形：黑芯一下彈開（超出約 15% 再回彈），吸積盤稍後由內向外彈出，背景同時被拉彎；盤的轉速由慢加快', en: 'form: the black core pops open (~15% overshoot, then settles), the accretion disk pops out a moment later and the scenery bends; the disk spins up from slow' },
    { t: [.85, 4.8], zh: '持續：橙白光帶沿對數螺線不停往內捲，石柱與地磚被拉成弧形；碎石由地面跳起後螺旋加速吸入，在 1.8、2.9、4.0 秒被吞時吸積盤爆亮一下（急升緩降），一圈細光環由盤緣急衝外擴', en: 'sustain: orange-white streams spiral inwards along log spirals, pillars and tiles curve around the hole; pebbles hop off the ground and spiral in faster and faster; when one is swallowed (1.8, 2.9, 4.0 s) the disk flares (sharp rise, slow decay) and a thin ring shoots out from its rim' },
    { t: [4.8, 5.3], zh: '收縮：盤與黑芯先微脹，再急速縮成一點（ease-in-back），越縮轉得越快，扭曲同步收回', en: 'collapse: disk and core swell slightly, then shrink to a point fast (ease-in-back), spinning faster as they shrink while the distortion relaxes' },
    { t: [5.3, 6], zh: '結束：首兩幀最亮的白色閃點與星芒急收，一圈細環 ease-out-expo 急衝外擴、越擴越細後消失', en: 'end: a white pinpoint flash and star, brightest on the first two frames, collapse fast while one thin ring shoots out with ease-out-expo, thinning until it vanishes' },
  ],
  layers: [
    { zh: '引力透鏡：以黑洞為中心半徑 1.75 的圓內，像素改取樣 θ − θE²/θ 的位置，再加越近越強的旋轉，石柱與地磚被彎成弧形；被吸進來的空白背景換成深紫星空，越近中心越暗', en: 'gravitational lens: inside a 1.75 radius around the hole each pixel samples theta - thetaE^2 / theta plus a swirl that grows towards the centre, bending pillars and tiles into arcs; empty sky pulled in becomes deep violet space with stars, darker towards the core' },
    { zh: '事件視界：半徑 0.32 的純黑球，外圍 1 像素白色光子環，上方加一道彎過頂部的亮弧（被透鏡折上去的盤背面）', en: 'event horizon: pure black sphere of radius 0.32 ringed by a 1 px white photon ring, with a bright arc bending over the top (the lensed far side of the disk)' },
    { zh: '吸積盤：水平環 0.42–0.98，三條螺旋光帶向內旋轉，內緣白熱、外緣轉紫藍；朝向鏡頭一側較亮', en: 'accretion disk: horizontal annulus 0.42–0.98 with three spiral bands turning inwards, white-hot at the inner edge, violet-blue at the outer edge; the approaching side is brighter' },
    { zh: '流光粒子：20 粒沿螺線內墜的光點，半徑按 u³ 收縮，越近越快，後半段拉成短線', en: 'infall motes: 20 motes on inward spirals whose radius shrinks as u^3, faster as they get closer, stretched into short streaks on the way in' },
    { zh: '碎石：6 塊小石由地面跳起、螺旋加速升起、縮小後被吞沒；地面被染成橙色', en: 'pebbles: 6 small rocks hop off the ground, spiral up faster and faster, shrink and disappear into the hole; the ground glows orange beneath' },
  ],
  params: {
    holeSize: { zh: '黑洞大小', en: 'hole size', min: .6, max: 1.4, step: .05, value: 1 },
    lens: { zh: '扭曲強度', en: 'lens distortion', min: 0, max: 2, step: .1, value: 1 },
    spin: { zh: '吸積盤轉速', en: 'disk spin', min: 0, max: 3, step: .1, value: 1 },
    motes: { zh: '流光粒子數量', en: 'infall motes', min: 0, max: 40, step: 1, value: 20 },
  },
  FLARES: [1.8, 2.9, 4],
  draw(p, t) {
    const D = this.palette.disk, V = this.palette.void, ST = this.palette.stone;
    p.pillar(-1.45, -.85, .42, 2.1, ST);
    p.pillar(.85, -1.5, .42, 2.4, ST);
    p.pillar(1.7, .35, .36, 1.3, ST);
    const CX = 0, CY = 0, CZ = 1.35, hs = p.param('holeSize'), S = p.param('spin');
    // the core pops open, the disk follows; at the end both swell a little, then collapse to a point
    const col = p.easeInBack(p.ph(t, 4.8, 5.3), 2.2);
    const grow = p.easeOutBack(p.ph(t, .15, .6), 2.2) * (1 - col), dgrow = p.easeOutBack(p.ph(t, .22, .85), 1.8) * (1 - col);
    // spin: eases up to speed after forming, whirls faster while collapsing
    const spin = S * (2.2 * (t - .5 * (1 - Math.exp(-t / .5))) + 2 * Math.pow(p.ph(t, 4.8, 5.3), 3));
    // flares when a pebble is swallowed: sharp attack, slow decay
    let flare = 0;
    for (const tp of this.FLARES) { const d = t - tp; if (d >= 0 && d < .7) flare = Math.max(flare, Math.pow(1 - d / .7, 3)); }
    // omen: motes rushing into a pinpoint
    if (t < .2) {
      const u = p.ph(t, 0, .15);
      p.dot(CX, CY, CZ, D, .6 + .4 * u, 2);
      for (let k = 0; k < 6; k++) {
        const a = k / 6 * p.TAU + .4, rr = .9 * (1 - p.easeInCubic(u)) + .05;
        if (u < 1) p.line([CX + Math.cos(a) * rr, CY + Math.sin(a) * rr, CZ], [CX + Math.cos(a) * (rr + .12 + .3 * u), CY + Math.sin(a) * (rr + .12 + .3 * u), CZ], .03, D, .5 + .5 * u, { i1: 0 });
      }
    }
    // pebbles: hop off the ground, then spiral up into the hole, faster and faster (drawn before the lens so they bend too)
    const nP = Math.round(6 * p.density);
    for (let k = 0; k < nP; k++) {
      const end = 1.8 + (k < 6 ? k * .55 : (k * .55 + .27) % 2.75), u = p.ph(t, end - 1.5, end);
      if (u <= 0 || u >= 1 || grow < .2) continue;
      const a0 = p.r(k, 1) * p.TAU, r0 = 1.4 + p.r(k, 2) * .6, rr = r0 * (1 - p.easeInCubic(u)), a = a0 + u * u * u * 6;
      const hop = .28 * Math.sin(Math.PI * Math.min(1, u / .3)) * (1 - u);
      p.rock(CX + Math.cos(a) * rr, CY + Math.sin(a) * rr, .05 + (CZ - .05) * p.easeInCubic(u) + hop, .09 * (1 - u * .8), this.palette.rock, k);
    }
    p.light(CX, CY, 0, 2.2 * hs, D, (.7 + .3 * flare) * Math.min(1, dgrow));
    if (grow > .01) {
      // gravitational lens + swirl over everything drawn so far; each swallow makes it gulp
      const L = p.param('lens') * (1 + .2 * flare), tE = .42 * grow * L, sw = 1.6 * grow * L;
      this.lens(p, CX, CY, CZ, 1.75 * hs, Math.min(1, grow), (dx, dy, rho) => {
        const edge = 1 - p.smooth(.55, 1, rho);
        if (edge <= 0) return null;
        const r = Math.max(rho, .04), a = sw * (1 - rho) * (1 - rho), c = Math.cos(a), s = Math.sin(a);
        const k = -tE * tE / r * edge;
        return [(dx * c - dy * s - dx) + dx / r * k, (dx * s + dy * c - dy) + dy / r * k];
      });
      const HR = .32 * grow * hs;
      p.ball(CX, CY, CZ, HR, V, { shadow: false, flat: true });
      // photon ring + lensed far side of the disk arching over the top
      p.card(CX, CY, CZ, HR * 3.4, HR * 3.4, (u, v) => {
        const rho = Math.hypot(u, v) * 1.7, ang = Math.atan2(v, u);
        const ring = p.band(rho, 1.06, .1);
        const arc = v > 0 ? p.band(rho, 1.32, .2) * (.5 + .5 * Math.sin(ang * 3 - spin * 2)) * Math.min(1, v * 3) : 0;
        const val = Math.max(ring, arc * .8);
        return val < .15 ? 0 : val;
      }, D, 1.1 * Math.min(1, grow) * (1 + .5 * flare));
      // accretion disk on a horizontal plane through the core
      if (dgrow > .02) {
        const R0 = .42 * dgrow * hs, R1 = .98 * dgrow * hs;
        p.decal(CX, CY, CZ, R1 * 1.05, (x, y, rho, ang) => {
          const r = rho / R1;
          if (rho < R0 * .9) return 0;
          const env = p.smooth(R0 * .9, R0 * 1.15, rho) * (1 - p.smooth(.82, 1.02, r));
          if (env <= 0) return 0;
          const adv = ang + Math.log(r + .12) * 2.4 + spin;
          const n = p.noise(Math.cos(adv) * 3 + 5, Math.sin(adv) * 3 + r * 4);
          const bands = Math.pow(.5 + .5 * Math.sin(adv * 3 + (n - .5) * 3), 2.5);
          const beam = 1 + .3 * Math.cos(ang + 2.4);
          const val = env * (.22 + .78 * bands) * (1.25 - .7 * r) * beam;
          return val < .16 ? 0 : val;
        }, D, Math.min(1, dgrow) * (1 + .6 * flare));
        // a thin ring shoots out from the rim on each flare, thinning as it grows
        for (const tp of this.FLARES) {
          const u = (t - tp) / .5;
          if (u <= 0 || u >= 1) continue;
          p.ring(CX, CY, CZ, R1 * (1 + p.easeOutExpo(u) * .85), .08 * Math.pow(1 - u, 2) + .015, D, .95 * Math.pow(1 - u, 2));
        }
      }
      // infall motes on spirals: radius shrinks as u^3, so they speed up as they get closer
      const nM = Math.round(p.param('motes') * p.density);
      for (let k = 0; k < nM; k++) {
        const per = 1.6 + p.r(k, 3), u = ((t + p.r(k, 4) * per) / per) % 1, u3 = u * u * u;
        const rr = (.3 + .85 * (1 - u3)) * dgrow * hs, a = p.r(k, 5) * p.TAU + spin + u3 * 8;
        const z = CZ + Math.sin(a * 2 + k) * .04;
        const x = CX + Math.cos(a) * rr, y = CY + Math.sin(a) * rr;
        p.dot(x, y, z, D, (.55 + .45 * u) * Math.min(1, dgrow));
        if (u > .45) {
          const back = .12 + .5 * u3, rb = rr + .25 * u3 * hs;
          p.line([x, y, z], [CX + Math.cos(a - back) * rb, CY + Math.sin(a - back) * rb, z], .03, D, .8 * Math.min(1, dgrow), { i1: .1 });
        }
      }
    }
    // final burst: pinpoint flash biggest on the first frames, one ring races out and thins
    const f = p.ph(t, 5.3, 5.9);
    if (f > 0 && f < 1) {
      const fl = Math.pow(1 - f, 3);
      p.glow(CX, CY, CZ, (.3 * fl + .08) * hs, D, 1.4 * fl, { pow: 1.4 });
      p.orb(CX, CY, CZ, .16 * fl * hs, D, 1);
      p.sparkle(CX, CY, CZ, Math.round(11 * fl + 1), D, Math.pow(1 - f, 1.5));
      p.ring(CX, CY, CZ, (.15 + p.easeOutExpo(f) * 1.5) * hs, .08 * Math.pow(1 - f, 2) + .015, D, .95 * Math.pow(1 - f, 1.5), { axis: [0, .35, 1] });
      p.light(CX, CY, 0, 1.6 * hs, D, .8 * Math.pow(1 - f, 2));
    }
  },
  // like p.warp, but lensed empty page turns into dark violet space with stars, and the view dims towards the core
  lens(p, x, y, z, R, grow, fn) {
    p.post(({ pix, W, H, kind, P, bayer }) => {
      const c = P(x, y, z), vr = .84 * grow;
      if (!c) return;
      const rp = R * c[3], cx = c[0], cy = c[1];
      if (!this._buf || this._buf.length !== pix.length) { this._buf = new Uint32Array(pix.length); this._kind = new Uint8Array(pix.length); }
      const src = this._buf, sk = this._kind;
      src.set(pix); sk.set(kind);
      const y0 = Math.max(0, Math.floor(cy - rp)), y1 = Math.min(H - 1, Math.ceil(cy + rp));
      const x0 = Math.max(0, Math.floor(cx - rp)), x1 = Math.min(W - 1, Math.ceil(cx + rp));
      for (let iy = y0; iy <= y1; iy++) for (let ix = x0; ix <= x1; ix++) {
        const dx = (ix + .5 - cx) / rp, dy = (iy + .5 - cy) / rp, rho = Math.sqrt(dx * dx + dy * dy);
        if (rho >= 1) continue;
        const o = fn(dx, dy, rho);
        if (!o) continue;
        const sx = Math.min(W - 1, Math.max(0, Math.round(ix + o[0] * rp))), sy = Math.min(H - 1, Math.max(0, Math.round(iy + o[1] * rp)));
        const j = sy * W + sx, dim = 1 - .55 * grow * Math.pow(Math.max(0, 1 - rho / .8), 1.5);
        let col = src[j], r = col & 255, g = col >> 8 & 255, b = col >> 16 & 255;
        if (!sk[j]) {
          if (rho < vr - .16 || (rho < vr && bayer(ix, iy) < (vr - rho) / .16)) {
            const h = p.r(sx * 7 + sy * 131, 3);
            if (h > .965) { r = 255; g = 240; b = 214; } else { r = 38; g = 28; b = 62; }
          } else { pix[iy * W + ix] = col; continue; }          // empty page outside the void stays as it is
        }
        pix[iy * W + ix] = (0xff000000 | (b * dim | 0) << 16 | (g * dim | 0) << 8 | (r * dim | 0)) >>> 0;
      }
    });
  },
});
