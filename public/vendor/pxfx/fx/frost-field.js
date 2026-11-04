// 六芒霜陣 / Sixfold Frost Sigil — pixel version of 00GameDevs "frost-field" (MIT)
PXFX.define({
  id: 'frost-field',
  loop: 4.4,
  beats: [{ t: .1, kind: 'cast', power: .6 }, { t: 1.3, kind: 'pulse', power: .55 }, { t: 2.3, kind: 'pulse', power: .55 }, { t: 3.2, kind: 'burst', power: .9 }],
  view: { r: 2.5, h: 1.9 },
  stage: { ground: 'slate' },
  palette: {
    ice: ['#4a6fc0', '#6aa2e0', '#9bdfff', '#c6f0ff', '#ecfbff', '#ffffff'],
    crystal: ['#5a78b8', '#7fa6d8', '#a8d8f5', '#d2f1ff', '#f6fdff'],
  },
  timeline: [
    { t: [0, .1], zh: '中心先閃一顆四角星（頭兩幀最大最亮，0.4 秒內收細）', en: 'a four-point star flashes at the centre, biggest on the first frames, shrinking within 0.4 s' },
    { t: [.1, .6], zh: '雪花法陣由中心彈出：0.5 秒內放大到約 110% 再回彈，同時由內向外畫出（中心六角→六臂雪花→六邊形→符文環→外齒圈），邊轉邊減速', en: 'the snowflake sigil pops out of the centre: scales to ~110% within 0.5 s and settles while drawing outward (hex hub, 6-arm snowflake, hexagon, rune band, toothed ring), spinning fast then slowing' },
    { t: [.4, 1], zh: '冰晶逐塊彈出：由地面急升到浮空高度（略衝過頭再回落），大小由 0 彈到 1', en: 'the ice crystals pop in one by one: they shoot up from the ground to their float height (slight overshoot, settle) and scale from 0 with a bounce' },
    { t: [1, 3.2], zh: '持續：冰晶浮動自轉；1.3、2.3 秒兩次寒潮：法陣瞬間變亮、一圈冷光環急衝到外圈後減速、冰晶一齊上彈並閃星；細雪緩緩落下', en: 'sustain: crystals bob and spin; two frost pulses at 1.3 and 2.3 s: the sigil flares, a cold ring shoots out to the rim and slows, every crystal jolts up and glints; fine snow drifts down' },
    { t: [3.2, 4.1], zh: '碎裂（爆發）：中心白閃，法陣裂成 24 片扇形以 ease-out-expo 急速滑開後減速並溶解，約 30 條冰屑先快後慢飛散再受重力落地，冰晶被彈起後收縮消失', en: 'shatter (burst): white flash at the centre, the sigil cracks into 24 wedges that shoot outward (ease-out-expo) and dissolve, ~30 ice slivers fly out fast, slow down and fall, the crystals are kicked up and shrink away' },
  ],
  layers: [
    { zh: '外圈（預設半徑 1.8）＋向外 90 根細齒、24 格方塊符文環（慢轉）、0.78 倍半徑圓', en: 'outer ring (default radius 1.8) with 90 fine outward teeth, band of 24 blocky runes (slow turn), circle at 0.78x radius' },
    { zh: '六邊形（外接 0.76 倍半徑）內嵌六臂雪花：每臂 3 對向外 50° 的分枝，由長到短；中心小六角＋白點', en: 'hexagon (0.76x radius) holding a 6-arm snowflake: 3 pairs of 50-degree side branches per arm, long to short; small hex hub with a white dot' },
    { zh: '地面冷光：法陣範圍內地面被染成冰藍，寒潮時更亮', en: 'frost light: the ground inside the sigil is tinted icy blue, brighter on each pulse' },
    { zh: '浮冰：7 塊細長雙錐冰晶（實體，有影子），長 0.5、高 0.45–1.05 上下浮動並自轉，旁邊有四角星閃光', en: 'floating ice: 7 slim bipyramid crystals (solid, cast shadows) 0.5 long, bobbing at 0.45–1.05 height and spinning, with four-point glints' },
    { zh: '寒潮環：每次一圈地面光環，寬 0.12→0.03，ease-out-expo 由 0.2 擴到外圈', en: 'pulse ring: one ground ring per pulse, 0.12 to 0.03 wide, ease-out-expo from 0.2 to the rim' },
    { zh: '碎裂：24 片扇形向外推開＋30 條短冰屑光線（阻力＋重力）飛散；16 粒冰塵閃爍並緩緩下落', en: 'shatter: 24 wedges pushed outward plus 30 short ice-sliver lines (drag + gravity); 16 ice-dust motes twinkle and drift down' },
  ],
  params: {
    radius: { zh: '法陣半徑', en: 'sigil radius', min: 1.2, max: 2.2, step: .05, value: 1.8 },
    crystals: { zh: '浮冰數量', en: 'floating crystals', min: 0, max: 14, step: 1, value: 7 },
    shards: { zh: '碎冰數量', en: 'shatter slivers', min: 0, max: 60, step: 1, value: 30 },
    spin: { zh: '法陣轉速', en: 'sigil spin', min: 0, max: 3, step: .1, value: 1 },
  },
  draw(p, t) {
    const C = this.palette.ice, X = this.palette.crystal, TAU = p.TAU, PULSES = [1.3, 2.3];
    const RW = p.param('radius'), k0 = RW / 1.8, spinK = p.param('spin');
    const end = p.ph(t, 3.2, 4.1), on = 1 - end;
    const star = Math.pow(1 - p.ph(t, 0, .4), 2);
    if (star > 0) { p.sparkle(0, 0, .06, 2 + 6 * star, C, 1.2 * star); p.glow(0, 0, .05, .3 * star + .05, C, star); }
    const sc = p.easeOutBack(p.ph(t, .1, .6), 1.8);                  // sigil scale: overshoots, settles
    if (sc <= .02 || end >= 1) return;
    const S = sc * k0, R = 1.8, reach = (R + .14) * p.easeOutCubic(p.ph(t, .1, .55));
    const spin = spinK * (.15 * t - .8 * (1 - p.easeOutCubic(p.ph(t, .1, 1.1)))), S6 = Math.PI / 3;
    const push = p.easeOutExpo(end * 1.4) * 1.1, fade = 1 - p.easeInCubic(p.ph(end, .25, 1));
    let flare = .7 * Math.pow(1 - p.ph(t, .1, .6), 3);
    for (const tp of PULSES) { const d = t - tp; if (d >= 0 && d < .7) flare = Math.max(flare, Math.pow(1 - d / .7, 3)); }
    const hexLine = (rho, ang, r, rot, w) => {          // hexagon outline via angle folding
      const a = ((ang - rot) % S6 + S6) % S6 - S6 / 2;
      return Math.abs(rho * Math.cos(a) - r * .866) < w;
    };
    // the sigil in its own unit space (radius 1.8)
    const sigil = (x, y, rho, ang) => {
      if (rho > reach) return 0;
      let v = Math.max(p.band(rho, R, .04), p.band(rho, R - .08, .025) * .7, p.band(rho, 1.4, .03) * .85);
      if (rho > R + .02 && rho < R + .13 && ((ang / TAU * 90 + 90) % 1) < .32) v = Math.max(v, rho < R + .08 ? .7 : .45);
      if (rho > 1.45 && rho < 1.68) {
        const a = ((ang + spin) / TAU % 1 + 1) % 1, cell = Math.floor(a * 24), u = a * 24 - cell;
        v = Math.max(v, p.rune(u * 1.25 - .12, (rho - 1.46) / .19, cell + 7) * .65);
      }
      if (hexLine(rho, ang, 1.36, Math.PI / 6, .028)) v = Math.max(v, .8);
      // snowflake: fold into one half-arm
      let a = ((ang % S6) + S6) % S6;
      if (a > S6 / 2) a = S6 - a;
      const px = rho * Math.cos(a), py = rho * Math.sin(a);
      if (px > .17 && px < 1.3 && py < .032 * (1.25 - px * .4)) v = Math.max(v, 1);
      for (const [b, L] of [[.5, .34], [.82, .26], [1.08, .16]]) {
        if (p.sdSeg(px, py, b, 0, b + L * .64, L * .77) < .024) v = Math.max(v, .9);
      }
      if (hexLine(rho, ang, .17, 0, .026)) v = Math.max(v, 1);
      if (rho < .05) v = 1;
      return v;
    };
    // shatter: each of 24 wedges slides out at its own speed
    const wedge = (x, y, rho, ang) => {
      x /= S; y /= S; rho /= S;
      if (end <= 0) return sigil(x, y, rho, ang) * (1 + .35 * flare);
      const k = Math.floor(((ang / TAU) + 1) % 1 * 24), d = push * (.5 + p.r(k, 31) * .9);
      const r0 = rho - d;
      if (r0 < 0) return 0;
      if (p.noise(x * 4 + k, y * 4) < p.easeIn(end) * 1.1) return 0;
      return sigil(x - Math.cos(ang) * d, y - Math.sin(ang) * d, r0, ang);
    };
    p.light(0, 0, .2, 2.4 * k0, C, (.4 + .3 * flare) * Math.min(1, sc) * fade);
    p.decal(0, 0, 0, (R + .14 + push * 1.4) * Math.max(S, k0), wedge, C, .95 * fade);
    // pulse rings: shoot out, thin and fade as they slow
    for (const tp of PULSES) {
      const u = (t - tp) / .7;
      if (u > 0 && u < 1) p.ring(0, 0, .03, (.2 + p.easeOutExpo(u) * 1.65) * k0, .12 * (1 - u) + .03, C, Math.pow(1 - u, 1.5) * 1.2);
    }
    // shatter flash: biggest on the first frames
    const bf = Math.pow(1 - p.ph(t, 3.2, 3.45), 2);
    if (end > 0 && bf > 0) {
      p.glow(0, 0, .2, (.3 + .6 * bf) * k0, C, 1.3 * bf, { pow: 1.4, flatten: .7 });
      p.ring(0, 0, .04, (.3 + p.easeOutExpo(p.ph(t, 3.2, 3.6)) * 2.1) * k0, .14 * bf + .03, C, bf * 1.3);
    }
    // floating crystals: pop up with overshoot, jolt on each pulse, kicked up and shrunk on the shatter
    const nX = p.param('crystals');
    for (let k = 0; k < nX; k++) {
      const ang = k / Math.max(1, nX) * TAU + .4 + p.r(k, 4) * .3, rad = (.55 + p.r(k, 1) * .85) * k0;
      const pop = p.ph(t, .4 + k * .06, .75 + k * .06), appear = p.easeOutBack(pop, 2.5);
      if (appear <= 0) continue;
      let jolt = 0;
      for (const tp of PULSES) { const d = t - tp - rad * .12; if (d >= 0 && d < .6) jolt = Math.max(jolt, p.easeOutCubic(d / .08) * Math.pow(1 - d / .6, 2)); }
      const z0 = .45 + p.r(k, 2) * .6, a = t - 3.2;
      let x = Math.cos(ang) * rad, y = Math.sin(ang) * rad, size = appear;
      let z = .08 + (z0 - .08) * p.easeOutBack(pop, 2) + Math.sin(t * 2 + k) * .07 + jolt * .22;
      if (a > 0) {                                                    // shatter: kicked up and out, then shrink away
        const out = p.drag(1.2, 4, a);
        x += Math.cos(ang) * out; y += Math.sin(ang) * out;
        z += p.drag(1.6, 4, a) - 3 * a * a;
        size *= 1 - p.easeInCubic(p.ph(a, 0, .5));
        if (size < .1 || z < .05) continue;
      }
      const sp = t * 1.6 + k + jolt * 2;
      p.shard(x, y, z, .5 * size, .17 * size, [Math.cos(sp) * .25, Math.sin(sp) * .25, 1], X, { spin: sp, back: .5, lit: .25 * jolt });
      const tw = Math.max(0, Math.sin(t * 3.1 + k * 2.3));
      if (end <= 0 && (tw > .7 || jolt > .3)) p.sparkle(x, y, z + .2, 2 + 2 * jolt, C, Math.max(tw, jolt));
    }
    // twinkling ice dust and falling snow
    const nD = Math.round(16 * p.density);
    for (let k = 0; k < nD; k++) {
      const ang = p.r(k, 11) * TAU, rad = p.r(k, 12) * 1.7 * k0, x = Math.cos(ang) * rad, y = Math.sin(ang) * rad;
      if (rad > reach * S) continue;
      const u = (t * (.2 + p.r(k, 14) * .1) + p.r(k, 13)) % 1, z = 1.5 - u * 1.4;
      const tw = Math.pow(Math.max(0, Math.sin(t * 5 + k * 1.7)), 6);
      p.dot(x + Math.sin(t + k) * .1, y, z, C, (.5 + .5 * tw + .5 * flare) * fade * Math.min(1, u * 5) * (1 - u));
      if (tw > .8 && k % 2) p.sparkle(x, y, z, 2, C, tw * fade);
    }
    // ice slivers flung out by the shatter: fast, drag, gravity
    const nS = Math.round(p.param('shards') * p.density);
    if (end > 0) for (let k = 0; k < nS; k++) {
      const a = t - 3.2, ang = p.r(k, 22) * TAU, r0 = (.3 + p.r(k, 23) * 1.4) * k0;
      const sp = 3 + p.r(k, 24) * 3, vz = 1.5 + p.r(k, 25) * 2;
      const rr = r0 + p.drag(sp, 3.5, a), z = .02 + p.drag(vz, 3, a) - 3.5 * a * a;
      if (z < 0) continue;
      const x = Math.cos(ang) * rr, y = Math.sin(ang) * rr, rot = ang + 1.3 + a * 9 * (p.r(k, 26) - .5);
      const L = .1 + p.r(k, 27) * .14;
      p.line([x, y, z], [x + Math.cos(rot) * L, y + Math.sin(rot) * L, z + L * .3 * Math.sin(a * 9)], .05, C, (1 - end) * 1.2);
    }
  },
});
