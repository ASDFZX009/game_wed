// 棘蔓綻冠 / Thornvine Blossom Crown — pixel version of 00GameDevs "thorn-crown" (MIT)
PXFX.define({
  id: 'thorn-crown',
  loop: 4.6,
  beats: [{ t: .02, kind: 'cast', power: .5 }, { t: .35, kind: 'burst', power: .75 }, { t: 1.2, kind: 'pulse', power: .55 }, { t: 2, kind: 'pulse', power: .45 }, { t: 2.8, kind: 'pulse', power: .45 }],
  view: { r: 2.3, h: 2.1 },
  stage: { ground: 'dirt' },
  palette: {
    glow: ['#3f9a6a', '#5fbf84', '#88d49a', '#bff0c8', '#ecffef', '#ffffff'],
    vine: ['#2e6a50', '#47905f', '#6cb57c', '#98dca6', '#c8f4cc'],
    leaf: ['#2f6a4a', '#4c9a60', '#88d49a', '#b6eeba', '#e4fbe2'],
    bloom: ['#5fbf84', '#a8e6b4', '#e2fbe4', '#fff6cc', '#ffffff'],
  },
  timeline: [
    { t: [0, .35], zh: '法陣由中心彈出（放大到約 110% 再回彈）；6 條藤蔓逐條貼地向外急伸（先快後慢）攤開成一圈葉環', en: 'the sigil pops out of the centre (to ~110%, then settles); 6 vines shoot out flat along the ground one after another (fast, then slowing) into a ring of leaves' },
    { t: [.35, .95], zh: '破土（爆發）：藤蔓逐條相隔 0.035 秒猛然抬起，0.35 秒內拱成冠形並衝過頭約 15% 再回彈定住；葉子沿途彈開，中心花苞彈開', en: 'eruption (burst): the vines snap up one after another 0.035 s apart, arching into the crown within 0.35 s, overshooting ~15% and springing back; leaves pop open along them, the centre bud pops open' },
    { t: [1.05, 3.2], zh: '1.2 秒藤尖花朵一齊彈開（由 0 放大並略超過）；1.2、2.0、2.8 秒三次綻放脈衝：花朵瞬間變亮再慢慢回落，藤蔓抖一下，每朵花噴出一小撮花粉（先快後慢、之後飄升）；其餘時間藤蔓隨風輕擺，花粉光點起飛快、之後慢慢上飄', en: 'at 1.2 s the tip blossoms pop open (scale from 0 with an overshoot); bloom pulses at 1.2, 2.0 and 2.8 s: blossoms flash and slowly dim, vines quiver, each blossom puffs a pinch of pollen (fast, then drifting up); in between the vines sway gently and pollen motes lift off fast and drift up' },
    { t: [3.2, 4.1], zh: '收尾：花朵急速收縮熄滅，藤蔓由尖端加速縮回地下，法陣淡出', en: 'end: blossoms shrink and go dark fast, the vines retract tip-first into the ground, accelerating, the sigil fades' },
  ],
  layers: [
    { zh: '地面法陣：半徑 1.5 外圈、五瓣星形曲線（半徑 0.75±0.35）、半徑 0.35 虛線圈、外圈內 5 個菱形點（大小跟隨藤蔓伸展距離）', en: 'ground sigil: outer ring at 1.5, five-lobed star curve (radius 0.75 ± 0.35), dashed circle at 0.35, 5 diamond marks inside the outer ring (scaled with the vine reach)' },
    { zh: '藤蔓：6 條實心圓管（粗 0.18→0.08 漸細），由半徑 0.3 附近長出，向外伸 1.25 並拱起，最高約 1.0–1.4，藤尖略下垂', en: 'vines: 6 solid tubes (0.18 tapering to 0.08) growing from radius ~0.3, reaching 1.25 outward in an arch that peaks at about 1.0–1.4 with a drooping tip' },
    { zh: '尖刺與葉：每條藤 4 根小三角刺、4 片菱形葉（長 0.42）左右交錯，葉片隨生長由 0 彈開', en: 'thorns and leaves: 4 small triangular thorns and 4 alternating diamond leaves (0.42 long) per vine; leaves pop open from 0 as the vine grows' },
    { zh: '花：藤尖 6 朵面向鏡頭的五瓣發光花（直徑 0.34），中心一朵 5 片實心花瓣的大花', en: 'flowers: 6 camera-facing glowing five-petal blossoms (0.34 wide) on the vine tips, plus a big centre flower of 5 solid petals' },
    { zh: '花粉：14 粒薄荷綠光點螺旋上飄；每次脈衝每朵花再噴 4 粒；地面被染成淡綠', en: 'pollen: 14 mint motes spiral upward; each pulse puffs 4 more from every blossom; the ground is tinted pale green' },
  ],
  params: {
    vines: { zh: '藤蔓數量', en: 'vine count', min: 3, max: 10, step: 1, value: 6 },
    height: { zh: '拱冠高度', en: 'arch height', min: .5, max: 1.6, step: .05, value: 1 },
    reach: { zh: '藤蔓伸展距離', en: 'vine reach', min: .7, max: 1.6, step: .05, value: 1.25 },
    leaves: { zh: '每藤葉片數', en: 'leaves per vine', min: 0, max: 6, step: 1, value: 4 },
  },
  draw(p, t) {
    const G = this.palette.glow, V = this.palette.vine, L = this.palette.leaf, BL = this.palette.bloom, TAU = p.TAU;
    const NV = Math.round(p.param('vines')), hK = p.param('height'), reach = p.param('reach'), nL = Math.round(p.param('leaves'));
    const PULSES = [1.2, 2, 2.8], ks = (reach + .28) / 1.53;
    const sc = p.easeOutBack(p.ph(t, .02, .4), 1.8), end = p.ph(t, 3.2, 4.1), fade = 1 - p.easeInCubic(p.ph(end, .2, 1));
    if (sc <= .02 || fade < .05) return;
    const rot = t * .2;
    let flare = 0;
    for (const tp of PULSES) { const d = t - tp; if (d >= 0 && d < .7) flare = Math.max(flare, Math.pow(1 - d / .7, 3)); }
    const erupt = Math.pow(1 - p.ph(t, .35, .8), 3) * (t >= .35 ? 1 : 0);

    p.light(0, 0, .3, 2.1 * ks, G, (.45 + .3 * Math.max(flare, erupt)) * Math.min(1, sc) * fade);
    const S = sc * ks, reveal = .2 + 1.4 * p.easeOutCubic(p.ph(t, .02, .32));
    p.decal(0, 0, 0, 1.56 * Math.max(S, ks), (x, y, rho, ang) => {
      rho /= S;
      if (rho > reveal) return 0;
      let v = Math.max(p.band(rho, 1.5, .035), p.band(rho, 1.42, .018) * .5);
      const f = .75 + .35 * Math.cos(5 * (ang - rot));
      if (Math.abs(rho - f) < .028) v = Math.max(v, .85);
      if (Math.abs(rho - .35) < .02 && ((ang / TAU * 20 + 20) % 1) < .5) v = Math.max(v, .6);
      const a5 = ((ang - rot - Math.PI / 5) % (TAU / 5) + TAU / 5) % (TAU / 5) - Math.PI / 5;
      if (Math.abs(rho - 1.25) + Math.abs(a5 * rho) < .06) v = Math.max(v, .9);
      return v * (1 + .3 * Math.max(flare, erupt));
    }, G, .9 * fade);

    // vines: unroll flat, snap up with overshoot, quiver on pulses, retract tip-first at the end
    const nP = Math.round(4 * p.density);
    for (let k = 0; k < NV; k++) {
      const ak = k / NV * TAU + .3, side = k % 2 ? 1 : -1, hk = .85 + p.r(k, 1) * .3, r0 = .28 + p.r(k, 2) * .12;
      const g = p.easeOutCubic(p.ph(t, .02 + k * .03, .3 + k * .03)) * (1 - p.easeInCubic(p.ph(t, 3.2 + k * .04, 3.7 + k * .04)));
      if (g <= .02) continue;
      let quiver = 0;
      for (const tp of PULSES) { const d = t - tp - k * .02; if (d > 0 && d < .6) quiver += Math.exp(-7 * d) * Math.sin(d * 38); }
      const lift = p.easeOutBack(p.ph(t, .35 + k * .035, .7 + k * .035), 2.2) + quiver * .06;
      const sway = Math.sin(t * 1.7 + k) * .08;
      const P = s => {
        const a = ak + side * .45 * s + sway * s, r = r0 + s * reach, z = hk * hK * 3.4 * s * (1 - .7 * s) * lift;
        return [Math.cos(a) * r, Math.sin(a) * r, Math.max(0, z) + .03];
      };
      const n = 8, smax = g;
      let prev = P(0);
      for (let i = 1; i <= n; i++) {
        const s = i / n * smax, q = P(s);
        p.capsule(prev, q, .09 - (s - smax / n) * .05, .09 - s * .05, V, { shadow: i % 3 === 0 });
        prev = q;
      }
      // thorns and leaves
      for (let j = 0; j < nL; j++) {
        const s = nL > 1 ? .22 + j * .63 / (nL - 1) : .5;
        if (s > smax - .05) break;
        const a = P(s), b = P(s + .02), T = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], tl = Math.hypot(...T) || 1;
        T[0] /= tl; T[1] /= tl; T[2] /= tl;
        const Sx = T[1], Sy = -T[0], sl = Math.hypot(Sx, Sy) || 1, sd = (j % 2 ? 1 : -1) * side;
        const open = p.easeOutBack(p.ph(smax, s + .05, s + .3), 2.5);
        // thorn: small triangle pointing up-out
        p.tri([a[0] - T[0] * .05, a[1] - T[1] * .05, a[2] - T[2] * .05], [a[0] + T[0] * .05, a[1] + T[1] * .05, a[2] + T[2] * .05],
          [a[0] - Sx / sl * sd * .02, a[1] - Sy / sl * sd * .02, a[2] + .13], V);
        if (open <= 0) continue;
        const Lw = .42 * open, D = [Sx / sl * sd * .8, Sy / sl * sd * .8, .45], m = [a[0] + D[0] * Lw * .5, a[1] + D[1] * Lw * .5, a[2] + D[2] * Lw * .5];
        const tip = [a[0] + D[0] * Lw, a[1] + D[1] * Lw, a[2] + D[2] * Lw], w = .13 * open;
        p.quad(a, [m[0] + T[0] * w, m[1] + T[1] * w, m[2] + T[2] * w], tip, [m[0] - T[0] * w, m[1] - T[1] * w, m[2] - T[2] * w], L, { shadow: false });
      }
      // blossom at the tip: pops open, flashes on each pulse, shrinks fast at the end
      const bloom = p.easeOutBack(p.ph(t, 1.05 + k * .025, 1.3 + k * .025), 3) * (1 - p.easeInCubic(p.ph(t, 3.2, 3.5)));
      if (bloom > .05 && smax > .9) {
        const tp = P(smax), pulse = .8 + .1 * Math.sin(t * 4 + k * 1.3) + .6 * flare;
        p.card(tp[0], tp[1], tp[2] + .08, .34 * bloom, .34 * bloom, (u, v) => {
          const r = Math.hypot(u, v), th = Math.atan2(v, u) + k;
          if (r < .28) return 1.1;
          return r < .62 + .38 * Math.cos(5 * th) ? .55 : 0;
        }, BL, pulse);
        p.glow(tp[0], tp[1], tp[2] + .08, .2 + .12 * flare, G, .4 * bloom * pulse);
        // pollen puff on each pulse: fast out, drag, then floats up
        PULSES.forEach((tq, i) => {
          const d = t - tq;
          if (d <= 0 || d >= 1) return;
          for (let q = 0; q < nP; q++) {
            const id = k * 40 + i * 9 + q, pa = p.r(id, 11) * TAU, out = p.drag(1.4 + p.r(id, 12), 5, d);
            p.dot(tp[0] + Math.cos(pa) * out, tp[1] + Math.sin(pa) * out, tp[2] + .1 + out * .4 + d * .35, G, (1 - d) * 1.1 * fade);
          }
        });
      }
    }
    // centre flower: 5 solid petals pop open, glowing heart
    const cf = p.easeOutBack(p.ph(t, .4, .8), 2.2) * (1 - p.easeInCubic(p.ph(t, 3.25, 3.75)));
    if (cf > .03) {
      for (let k = 0; k < 5; k++) {
        const a = k / 5 * TAU + rot, c = Math.cos(a), s = Math.sin(a), up = .55 - Math.min(1, cf) * .35, len = .38 * cf;
        const tip = [c * len * (1 - up * .5), s * len * (1 - up * .5), .1 + len * up * 1.4];
        p.quad([0, 0, .08], [c * len * .5 - s * .1 * cf, s * len * .5 + c * .1 * cf, .1 + len * up * .7], tip,
          [c * len * .5 + s * .1 * cf, s * len * .5 - c * .1 * cf, .1 + len * up * .7], L, { shadow: false, lit: .1 });
      }
      p.orb(0, 0, .2, .07 * Math.min(1, cf), BL, Math.min(1, cf) * fade * (1 + .4 * flare));
      p.glow(0, 0, .25, .35, G, (.45 + .3 * flare) * Math.min(1, cf));
    }
    // pollen: lift off fast, then drift
    const nM = Math.round(14 * p.density), lifted = Math.min(1, p.ph(t, .35, .8) * 1.5);
    for (let m = 0; m < nM; m++) {
      const u = (t * .3 + p.r(m, 5)) % 1, a = p.r(m, 6) * TAU + u * 2, r = (.3 + p.r(m, 7) * 1.1) * ks, z = .15 + p.easeOutCubic(u) * 1.9 * hK;
      if (u < .9) p.dot(Math.cos(a) * r, Math.sin(a) * r, z, G, (1 - u) * fade * lifted);
      if (m % 4 === 0 && u > .3 && u < .5) p.sparkle(Math.cos(a) * r, Math.sin(a) * r, z, 2, G, fade * lifted);
    }
  },
});
