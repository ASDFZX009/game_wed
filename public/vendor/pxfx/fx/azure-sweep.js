// 蒼刃迴斬 / Azure Blade Sweep — pixel version of 00GameDevs "azure-sweep" (MIT)
PXFX.define({
  id: 'azure-sweep',
  loop: 2,
  beats: [{ t: .57, kind: 'hit', power: 1 }],
  view: { r: 2.3, h: 1.7 },
  stage: { ground: 'stone', tiles: true },
  palette: {
    blade: ['#2b3a9c', '#2454d4', '#2878ff', '#5ea8ff', '#aee6ff', '#f2fcff'],
    cloth: ['#272a48', '#363d66', '#4a5684', '#62709c', '#8290b4'],
    steel: ['#4c5068', '#6e7490', '#9aa2ba', '#c8d0e0', '#eef2f8'],
  },
  timeline: [
    { t: [0, .38], zh: '起手（ease-in-back）：劍士持劍指向身後，再往後拉約一成弧長蓄力，拉到最後時劍尖閃出四角星光', en: 'wind-up (ease-in-back): the swordsman points the blade backwards, then draws it back about 10 % of the arc; a four-point glint flashes on the tip at full draw' },
    { t: [.38, .57], zh: '橫掃：刀光前端加速掃出，最後約 0.1 秒內掃過大半弧長（2–3 幀），在 0.57 秒以約 9 成弧長「命中」', en: 'sweep: the slash head accelerates; most of the arc appears in the last ~0.1 s (2–3 frames) and it connects at 0.57 s at about 90 % of the arc' },
    { t: [.57, .71], zh: '命中：停格，弧環外緣白閃、刀面加寬，光點沿切線甩出', en: 'contact: hit-stop; the rim flashes white, the face bulges wider, motes are flung off along the tangent' },
    { t: [.57, 1.02], zh: '餘勢：刀頭以 ease-out 慢慢推完最後一成弧長，弧環逐漸變細', en: 'follow-through: the head eases out over the last 10 % of the arc while the ring thins' },
    { t: [.69, 1.29], zh: '收尾：尾端以 ease-in 加速追上前端，弧環由尾到頭急縮並熄滅', en: 'close: the tail chases the head with an ease-in, so the arc shrinks faster and faster from tail to tip and goes out' },
    { t: [1.15, 1.75], zh: '劍士順勢轉回起手方向，甩出的光點受阻力減速後落地', en: 'the swordsman turns back to the start pose; flung motes slow down (drag) and drop' },
  ],
  layers: [
    { zh: '刀面：腰部高度的水平弧帶，預設外半徑 1.5、寬 0.55、弧長 300 度，兩端以 sin 曲線收尖；內側半透明藍、越近外緣越亮', en: 'blade face: horizontal arc band at waist height, default outer radius 1.5, width 0.55, 300 degree arc, both ends pinched by a sine taper; translucent blue inside, brighter towards the rim' },
    { zh: '亮刃：外緣 1–2 像素白色細線，外側再加一圈淡藍光暈；命中後 0.15 秒內白閃收回', en: 'edge: a 1–2 px white line on the outer rim with a faint blue halo outside; it flashes on contact and settles within 0.15 s' },
    { zh: '流線：刀面內 3 條細亮線，沿弧向前流動，只覆蓋弧的中段', en: 'streaks: 3 thin bright lines inside the face flowing along the arc, covering only its middle span' },
    { zh: '刀頭：前端四角星閃光；命中時約 10 粒光點沿切線甩出，先快後慢（阻力）並受重力下墜，帶短拖影', en: 'head: a four-point sparkle on the leading tip; on contact about 10 motes fly off along the tangent, fast then slow (drag), falling under gravity with short streaks' },
    { zh: '劍士：膠囊身體＋細長劍，劍尖始終對準刀光前端；地面被刀頭照亮，命中瞬間最亮', en: 'swordsman: capsule body with a long thin sword that always points at the slash head; the head lights the ground, brightest at contact' },
  ],
  params: {
    arc: { zh: '揮斬角度（度）', en: 'arc angle (deg)', min: 90, max: 340, step: 5, value: 300 },
    reach: { zh: '刀光半徑', en: 'slash radius', min: 1, max: 2, step: .05, value: 1.5 },
    width: { zh: '刀面寬度', en: 'blade face width', min: .2, max: .9, step: .05, value: .55 },
    motes: { zh: '甩出光點數量', en: 'flung motes', min: 0, max: 24, step: 1, value: 10 },
  },
  draw(p, t) {
    const B = this.palette.blade, CL = this.palette.cloth, ST = this.palette.steel;
    const W0 = .05, HIT = .57, CONTACT = .9, Z = .62, A0 = -2.35;
    const R = p.param('reach'), SPAN = p.param('arc') * Math.PI / 180, WID = Math.min(p.param('width'), R - .2);
    const a = t - HIT;
    // head progress along the arc: ease-in-back = draw back, then snap through most of the arc into the contact
    let head;
    if (t < HIT) head = CONTACT * p.easeInBack(p.ph(t, W0, HIT), 1.7);
    else head = CONTACT + (1 - CONTACT) * p.easeOutCubic(p.ph(a, 0, .45));
    const tail = a > 0 ? head * p.easeInCubic(p.ph(a, .12, .72)) : 0;
    // facing: the sword follows the slash head, then turns back to the start pose
    let face = A0 + SPAN * head;
    if (a > .58) {
      const k = p.ease(p.ph(a, .58, 1.18));
      face = A0 + SPAN + (SPAN >= Math.PI ? (p.TAU - SPAN) * k : -SPAN * k);
    }
    this.hero(p, face, R, CL, ST);

    // glint on the tip at full draw
    const g = p.env(t, .18, .26, .3, .38);
    if (g > 0) p.sparkle(Math.cos(face) * (R - .12), Math.sin(face) * (R - .12), Z, 3 * g, B, g);

    // flung motes: released along the arc at contact, fast then slow (drag), falling
    const nM = Math.round(p.param('motes') * p.density);
    for (let k = 0; k < nM; k++) {
      const age = a - p.r(k, 1) * .05, life = .35 + p.r(k, 2) * .3;
      if (age <= 0 || age >= life) continue;
      const am = A0 + SPAN * CONTACT * (.2 + .8 * p.r(k, 3)), c = Math.cos(am), s = Math.sin(am);
      const v0 = 2.5 + p.r(k, 4) * 2.5, out = (p.r(k, 5) - .3) * .5;
      const at = q => { const d = p.drag(v0, 7, q); return [c * (R + .04) + (-s + c * out) * d, s * (R + .04) + (c + s * out) * d, Z + (p.r(k, 6) - .5) * .2 - 2.2 * q * q]; };
      const P = at(age), Q = at(Math.max(0, age - .035)), u = age / life;
      if (P[2] < .02) continue;
      p.line(P, Q, .06, B, 1 - u * u * .8, { w1: .03, i1: .35 });
      if (k % 3 === 0) p.dot(P[0], P[1], P[2], B, 1 - u, 2);
    }

    if (head <= .01 || a > .74) return;
    const fade = 1 - p.easeInCubic(p.ph(a, .44, .74));
    const fl = a >= 0 ? Math.pow(1 - p.ph(a, 0, .15), 2) : 0;          // contact flash: biggest on the first frames
    const thin = (1 - .35 * p.ph(a, .08, .6)) * (1 + .22 * fl);
    const N = 56, outer = [], inner = [], halo = [], short = Math.min(1, (head - tail) * SPAN * .48);
    for (let k = 0; k <= N; k++) {
      const x = k / N, along = p.lerp(tail, head, x), an = A0 + along * SPAN, c = Math.cos(an), s = Math.sin(an);
      const tap = Math.pow(Math.max(0, Math.sin(x * Math.PI)), .45) * short * thin;
      outer.push([c * R, s * R, Z]);
      inner.push([c * (R - WID * tap), s * (R - WID * tap), Z + Math.sin(x * Math.PI) * .04]);
      halo.push([c * (R + (.16 + .12 * fl) * tap), s * (R + (.16 + .12 * fl) * tap), Z]);
    }
    const flow = t * 3.6;
    p.ribbon(outer, inner, (u, v) => {
      const ends = p.smooth(0, .035, u) * (1 - p.smooth(.985, 1, u));
      if (v < .1 + .08 * fl) return ends * (1 + .4 * fl);                 // white rim, wider on contact
      const stream = p.smooth(.15, .35, u) * (1 - p.smooth(.75, .95, u));
      const lines = (p.hard(v, .32, .035) + p.hard(v, .52, .03) + p.hard(v, .7, .03)) * stream;
      const grain = Math.sin(v * 40 + u * 9 - flow + Math.sin(u * 14) * .45) > .9 ? .12 : 0;
      return ends * (Math.max(.08 + .42 * Math.pow(1 - v, 1.4) + .2 * fl, lines * .62) + grain) * (1 - p.smooth(.85, 1, v) * .6);
    }, B, fade);
    p.ribbon(halo, outer, (u, v) => (.28 + .4 * fl) * v * p.smooth(0, .05, u) * (1 - p.smooth(.95, 1, u)), B, fade);
    // head sparkle and ground light, strongest at contact
    const ha = A0 + head * SPAN, hc = Math.cos(ha), hs = Math.sin(ha);
    if (a < .3) p.sparkle(hc * R, hs * R, Z, 3 + 3 * fl, B, fade);
    p.light(hc * R, hs * R, Z, 1.1 + .5 * fl, B, (.45 + .45 * fl) * fade);
  },
  // a small swordsman at the origin; ang = direction the sword points (radial), reach = slash radius
  hero(p, ang, reach, CL, ST) {
    const c = Math.cos(ang), s = Math.sin(ang), px = -s, py = c, L = reach - .12;
    p.capsule([px * .1, py * .1, .02], [px * .05, py * .05, .42], .055, .065, CL);
    p.capsule([-px * .1, -py * .1, .02], [-px * .05, -py * .05, .42], .055, .065, CL);
    p.capsule([0, 0, .42], [0, 0, .76], .13, .11, CL);
    p.ball(0, 0, .93, .1, ST, { lit: .1 });
    p.capsule([c * .06 + px * .1, s * .06 + py * .1, .74], [c * .3, s * .3, .62], .045, .04, CL, { shadow: false });
    p.capsule([c * .3 - px * .07, s * .3 - py * .07, .62], [c * .3 + px * .07, s * .3 + py * .07, .62], .03, .03, ST, { shadow: false });
    p.capsule([c * .32, s * .32, .62], [c * L, s * L, .62], .036, .022, ST, { shadow: false, lit: .35 });
  },
});
