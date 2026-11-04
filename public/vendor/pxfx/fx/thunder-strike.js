// 渦雷落擊 / Vortex Lightning Strike — pixel version of 00GameDevs "thunder-strike" (MIT)
PXFX.define({
  id: 'thunder-strike',
  loop: 2.1,
  beats: [{ t: 0, kind: 'cast', power: .5 }, { t: .22, kind: 'hit', power: 1.3 }, { t: 1.02, kind: 'pulse', power: .4 }, { t: 1.48, kind: 'pulse', power: .3 }],
  view: { r: 2.1, h: 3.2 },
  stage: { ground: 'slate', tiles: true },
  palette: {
    arc: ['#3a3ab8', '#2f5fe8', '#2878ff', '#6aa8ff', '#b8dcff', '#ffffff'],
    cloud: ['#2a3a9a', '#2f5fe8', '#5a9cff', '#a8d0ff', '#e6f4ff'],
  },
  timeline: [
    { t: [0, .12], zh: '離地 2.6 處的藍色雷渦以 ease-out-back 彈開（半徑 0.3→1.1，略衝過頭），旋轉越轉越快', en: 'a blue storm vortex 2.6 above the ground pops open with ease-out-back (radius 0.3 → 1.1, slight overshoot), spinning faster and faster' },
    { t: [.1, .22], zh: '主閃電由渦心向下劈，ease-in-cubic 加速，0.12 秒內撞到地面', en: 'the main bolt grows down from the vortex eye, accelerating (ease-in-cubic), and hits the ground in 0.12 s' },
    { t: [.22, .3], zh: '命中：前 2 幀最大最亮，閃電加粗、地面大白閃；光環 ease-out-expo 急擴並越擴越細；9 條電弧腳 0.06 秒內由落點射出，像蜘蛛腳向外彎落', en: 'impact: the first 2 frames are the biggest and brightest, the bolt thickens and the ground flashes white; a ring races out (ease-out-expo), thinning; 9 arc legs shoot from the impact point within 0.06 s and bend outward like spider legs' },
    { t: [.22, .62], zh: '主閃電每 0.05 秒換形並帶 4 根分支；火花急射後受阻力減速、受重力落下', en: 'the bolt re-jags every 0.05 s with 4 branches; sparks shoot out, slow under drag and fall with gravity' },
    { t: [.6, .75], zh: '閃電與雷渦一起急速塌縮熄滅（ease-in-cubic）', en: 'bolt and vortex collapse and switch off quickly together (ease-in-cubic)' },
    { t: [1.02, 1.56], zh: '地面殘電：1.02 秒及 1.48 秒兩次小電弧在落點閃現（脈衝），然後消失', en: 'residual charge: two small arc flickers at the impact point at 1.02 s and 1.48 s (pulses), then gone' },
  ],
  layers: [
    { zh: '雷渦：水平圓盤貼花，3 條螺旋臂＋波浪外緣，順時針加速旋轉，中心白熱光球；大小乘以「雷渦大小」', en: 'vortex: horizontal disc decal with 3 spiral arms and a wavy rim, spinning up, white-hot orb in the eye; scaled by "vortex size"' },
    { zh: '主閃電：一條 5 層細分的鋸齒線，1 像素白芯＋淡藍光暈，預設 4 根短分支；每隔一格多畫一條細副閃電', en: 'main bolt: one 5-level jagged line, 1 px white core with pale-blue halo, 4 short branches by default; a thin second bolt on every other step' },
    { zh: '電弧腳：預設 9 條由落點向外拱起再落地的抖動弧線（半徑 1.0–1.5，拱高 0.5–1.0）', en: 'arc legs: 9 by default, jittering arches that leave the impact point and land at radius 1.0–1.5, arching 0.5–1.0 high' },
    { zh: '落點：白熱光球、擴散光環、預設 16 粒彈跳火花、地面焦黑圈', en: 'impact: white-hot orb, expanding ring, 16 bouncing sparks by default, dark scorch blob' },
    { zh: '地面被藍光照亮，強度跟著閃電閃爍', en: 'blue light pool on the ground flickering with the bolt' },
  ],
  params: {
    vortexSize: { zh: '雷渦大小', en: 'vortex size', min: .6, max: 1.5, step: .05, value: 1 },
    branches: { zh: '閃電分支數', en: 'bolt branches', min: 0, max: 8, step: 1, value: 4 },
    legs: { zh: '電弧腳數量', en: 'arc legs', min: 0, max: 16, step: 1, value: 9 },
    sparks: { zh: '火花數量', en: 'spark count', min: 0, max: 40, step: 1, value: 16 },
  },
  draw(p, t) {
    const A = this.palette.arc, C = this.palette.cloud, TAU = p.TAU;
    const VZ = 2.6, HIT = .22, step = Math.floor(t / .05), VS = p.param('vortexSize');
    const nBr = Math.round(p.param('branches')), nL = Math.round(p.param('legs'));
    const a = t - HIT, fl = a >= 0 ? Math.pow(1 - p.ph(a, 0, .14), 2) : 0;
    // ----- vortex: pops open, spins up, collapses fast -----
    const vOpen = p.easeOutBack(p.ph(t, 0, .12), 1.8), vClose = 1 - p.easeInCubic(p.ph(t, .6, .75));
    const vo = Math.min(1, vOpen) * vClose;
    if (vo > 0) {
      const R = (.3 + .8 * vOpen) * vClose * VS, spin = t * 5 + t * t * 8;
      p.decal(0, 0, VZ, R * 1.12, (x, y, rho, ang) => {
        const f = rho / R;
        const rim = 1 + .09 * Math.sin(ang * 7 - t * 12);
        if (f > rim) return 0;
        let v = p.band(f, rim - .05, .07) * .9;
        const arm = Math.cos(3 * (ang - spin) + f * 8);
        if (arm > .55 && f > .2) v = Math.max(v, .75 * (1 - f * .4));
        v = Math.max(v, p.band(f, .55, .04) * .6, p.band(f, .3, .04) * .7);
        return Math.max(v, .22 * (1 - f));
      }, C, vo * (1 + .3 * fl));
      p.glow(0, 0, VZ, .45 * vo * Math.sqrt(VS), A, .95);
      p.orb(0, 0, VZ, .1, A, vo);
    }
    // ----- main bolt: accelerates down, thick on impact, collapses -----
    const down = p.easeInCubic(p.ph(t, .1, HIT));
    const strike = t >= .1 && t < .75 ? (t < .6 ? 1 : 1 - p.easeInCubic(p.ph(t, .6, .75))) : 0;
    const flick = a > .08 && p.r(step, 3) < .18 ? .55 : 1;
    if (strike > 0) {
      const bz = p.lerp(VZ, 0, down);
      p.bolt([0, 0, VZ], [0, 0, bz], A, { seed: step, jag: .2, depth: 5, branches: down >= 1 ? nBr : Math.min(1, nBr), w: .06 + .07 * fl, I: strike * flick * (1.15 + .5 * fl), glow: .3 + .3 * fl });
      if (down < 1) p.glow(0, 0, bz, .25, A, .9);                            // leading tip
      if (down >= 1 && t < .6 && step % 2) p.bolt([0, 0, VZ * .8], [.15, -.1, 0], A, { seed: step + 50, jag: .2, depth: 4, w: .03, I: .6, glow: .15 });
    }
    // ----- impact -----
    if (a >= 0) {
      const hit = 1 - p.easeInCubic(p.ph(a, .3, .52));
      if (hit > 0) {
        p.glow(0, 0, .12, (.75 + .4 * fl) * hit, A, hit * flick * (1 + .25 * fl), { pow: 2.4 });
        p.orb(0, 0, .1, .13 * (1 + .5 * fl), A, hit);
      }
      const rk = p.ph(a, 0, .45);
      if (rk < 1) p.ring(0, 0, .03, .2 + 1.3 * p.easeOutExpo(rk) * Math.sqrt(VS), .025 + .1 * Math.pow(1 - rk, 2), A, Math.pow(1 - rk, 1.5) * 1.1);
    }
    const legs = (n, R0, I, seed, grow) => {
      for (let k = 0; k < n; k++) {
        const az = k / n * TAU + p.r(k + seed, 1) * .5, R = R0 * (.8 + p.r(k + seed, 2) * .45), hgt = (.45 + p.r(k + seed, 3) * .4) * R0;
        const pts = [], ns = Math.max(2, Math.round(8 * grow));
        for (let s = 0; s <= ns; s++) {
          const u = s / 8, j = (p.r(k * 9 + s + step * 3 + seed, 4) - .5) * .12 * Math.sin(u * Math.PI);
          const d = R * u, z = .05 + Math.sin(u * Math.PI) * hgt * (1 - u * .35);
          pts.push([Math.cos(az + j) * d, Math.sin(az + j) * d, z + j * .5]);
        }
        if (p.r(k + step * 5 + seed, 5) < .2) continue;
        p.trail(pts, .045, .02, A, I, I * .5);
      }
    };
    if (a > 0 && a < .48) legs(nL, 1.2 * Math.sqrt(VS), (1 - p.easeInCubic(p.ph(a, .28, .48))) * (1 + .4 * fl), 0, p.easeOutExpo(p.ph(a, 0, .06)));
    if (t > 1.02 && t < 1.14) legs(Math.max(2, Math.round(nL * .67)), .7, .8 * Math.pow(1 - p.ph(t, 1.02, 1.14), .5) + .2, 40, 1);
    if (t > 1.48 && t < 1.56) legs(2, .8, .7, 80, 1);
    // ----- sparks: fast out, drag, gravity -----
    const nS = Math.round(p.param('sparks') * p.density);
    for (let s = 0; s < nS; s++) {
      const tau = a - .005 - p.r(s, 6) * .04, life = .4 + p.r(s, 7) * .3;
      if (tau <= 0 || tau >= life) continue;
      const az = p.r(s, 8) * TAU, sp = 3.5 + p.r(s, 9) * 4, vz = 2 + p.r(s, 10) * 2.5;
      const at = tt => { const d = p.drag(sp, 4, tt); return [Math.cos(az) * d, Math.sin(az) * d, .05 + p.drag(vz, 2, tt) - 5 * tt * tt]; };
      const h = at(tau), b = at(Math.max(0, tau - .035));
      if (h[2] < 0) continue;
      p.line(h, b, .04, A, 1 - tau / life);
    }
    // ----- scorch + light -----
    const sc = p.env(t, .25, .4, 1.25, 1.75);
    if (sc > .15) p.shadow(0, 0, 0, .45 * sc, 1);
    const lightI = Math.max(vo * .35, (a >= 0 ? 1 - p.ph(a, .3, .52) : 0) * flick * (1 + .4 * fl), t > 1.02 && t < 1.14 ? .5 : 0, t > 1.48 && t < 1.56 ? .35 : 0);
    p.light(0, 0, .4, 2.1, A, .9 * lightI);
  },
});
