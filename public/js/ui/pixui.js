// 🎨 ชุด UI พิกเซล 48px (วาดด้วยโค้ดทั้งหมด ไม่ใช้รูปจากที่อื่น)
// ไอคอนเมนู 48×48 · กรอบ 9 ช่อง (แผ่นกระดาษขอบไม้ / ปุ่มทอง / ช่องไม้ / ปุ่มน้ำเงิน) → ตัวแปร CSS บน :root
const C = {
  o: "#2a1608", o2: "#4a2a12",
  w0: "#4e2e14", w1: "#6e4422", w2: "#8f5d30", w3: "#b47c44", w4: "#d39b5c",
  p0: "#c9a86c", p1: "#e2c992", p2: "#f4e4bc", p3: "#fff6dc",
  g0: "#9a6a10", g1: "#c8961a", g2: "#f0b830", g3: "#ffd84a", g4: "#fff1a0",
  r0: "#7a1e1e", r1: "#b8352c", r2: "#e0573f", r3: "#ff8a6a",
  b0: "#173a6e", b1: "#2858a8", b2: "#3f86e0", b3: "#7cc0ff", b4: "#c6e6ff",
  e0: "#1f5a26", e1: "#2f8a36", e2: "#4cb84a", e3: "#8ee070",
  v0: "#3a1f6e", v1: "#5a34b0", v2: "#8a5ae0", v3: "#c49cff", v4: "#efe0ff",
  c0: "#0d5a6a", c1: "#1a9ab0", c2: "#45d6e6", c3: "#b8f6ff",
  k0: "#3a3f4a", k1: "#6a7280", k2: "#a2aab6", k3: "#d8dee6",
  wh: "#ffffff", pk: "#ff9ac0",
};

// ---------- ผ้าใบพิกเซล ----------
class Px {
  constructor(w = 48, h = 48) { this.w = w; this.h = h; this.d = new Array(w * h).fill(null); }
  set(x, y, c) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c; return this; }
  get(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.d[y * this.w + x] : null; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); return this; }
  // สี่เหลี่ยมมุมมน (ตัดมุม r พิกเซล)
  rr(x, y, w, h, r, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const dx = Math.max(0, r - i, i - (w - 1 - r)), dy = Math.max(0, r - j, j - (h - 1 - r)); if (dx * dx + dy * dy <= r * r + r * 0.4) this.set(x + i, y + j, c); } return this; }
  circ(cx, cy, r, c) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) this.set(cx + x, cy + y, c); return this; }
  ell(cx, cy, rx, ry, c) { for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1.02) this.set(cx + x, cy + y, c); return this; }
  ring(cx, cy, r0, r1, c) { for (let y = -r1; y <= r1; y++) for (let x = -r1; x <= r1; x++) { const d = x * x + y * y; if (d <= r1 * r1 + r1 * 0.6 && d > r0 * r0 + r0 * 0.6) this.set(cx + x, cy + y, c); } return this; }
  poly(pts, c) {
    const ys = pts.map((p) => p[1]), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
    for (let y = y0; y <= y1; y++) { const yc = y + 0.5, xs = [];
      for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + ((yc - ay) / (by - ay)) * (bx - ax)); }
      xs.sort((a, b) => a - b); for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.set(x, y, c); }
    return this;
  }
  line(x0, y0, x1, y1, c, t = 1) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) { const x = Math.round(x0 + ((x1 - x0) * i) / n), y = Math.round(y0 + ((y1 - y0) * i) / n); this.rect(x - ((t - 1) >> 1), y - ((t - 1) >> 1), t, t, c); } return this; }
  // เปลี่ยนสีเฉพาะพิกเซลที่มีอยู่แล้วตามเงื่อนไข (ใช้ทำแสง/เงา)
  tint(fn) { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const c = this.get(x, y); if (c) { const n = fn(x, y, c); if (n) this.set(x, y, n); } } return this; }
  // ขอบดำรอบรูป (ช่องว่างที่ติดกับพิกเซลทึบ)
  outline(c = C.o) { const add = []; for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (!this.get(x, y) && (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1))) add.push([x, y]); add.forEach(([x, y]) => this.set(x, y, c)); return this; }
  shadow(c = "rgba(0,0,0,.28)") { const s = []; for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.get(x, y) && !this.get(x + 1, y + 2) ) s.push([x + 1, y + 2]); s.forEach(([x, y]) => { if (!this.get(x, y)) this.set(x, y, c); }); return this; }
  url(k = 1) { const W = this.w * k, H = this.h * k, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d"), im = g.createImageData(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = this.d[((y / k) | 0) * this.w + ((x / k) | 0)]; if (c) im.data.set(rgba(c), (y * W + x) * 4); }
    g.putImageData(im, 0, 0); return cv.toDataURL(); }
}
const rgbaCache = new Map();
function rgba(c) { if (rgbaCache.has(c)) return rgbaCache.get(c); let v;
  if (c[0] === "#") v = [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16), 255];
  else { const m = c.match(/[\d.]+/g).map(Number); v = [m[0], m[1], m[2], Math.round((m[3] ?? 1) * 255)]; }
  rgbaCache.set(c, v); return v; }
const fin = (p) => p.outline().shadow();
const sparkle = (p, x, y, c = C.wh) => p.set(x, y, c).set(x - 1, y, c).set(x + 1, y, c).set(x, y - 1, c).set(x, y + 1, c);

// ---------- ไอคอน 48×48 ----------
const ICON = {
  home() { const p = new Px();
    p.rect(4, 41, 40, 4, C.e1).rect(4, 41, 40, 1, C.e2);
    p.rect(31, 7, 6, 12, C.k1).rect(31, 7, 6, 2, C.k2);
    p.rect(10, 21, 28, 21, C.p2).rect(30, 21, 8, 21, C.p1).rect(10, 21, 28, 2, C.p0);
    p.poly([[4, 23], [24, 5], [44, 23]], C.r1).poly([[8, 21], [24, 7], [24, 21]], C.r2).rect(4, 21, 40, 3, C.r0);
    for (let i = 0; i < 4; i++) p.line(10 + i * 4, 19 - i * 3, 13 + i * 4, 19 - i * 3, C.r3);
    p.rect(20, 29, 9, 13, C.w1).rect(21, 30, 7, 12, C.w2).rect(21, 30, 3, 12, C.w3).set(26, 36, C.g3);
    p.rect(12, 26, 6, 6, C.b2).rect(12, 26, 3, 3, C.b4).rect(14, 26, 1, 6, C.o2).rect(12, 28, 6, 1, C.o2);
    p.rect(31, 26, 5, 6, C.b1).rect(31, 26, 2, 3, C.b3).rect(33, 26, 1, 6, C.o2);
    return fin(p); },
  map() { const p = new Px();
    p.rect(8, 9, 32, 30, C.p2).rect(8, 9, 32, 2, C.p3).rect(34, 9, 6, 30, C.p1);
    p.rr(5, 6, 38, 5, 2, C.w3).rect(5, 9, 38, 2, C.w1).rr(5, 37, 38, 5, 2, C.w3).rect(5, 40, 38, 2, C.w1);
    p.rect(3, 7, 3, 3, C.g2).rect(42, 7, 3, 3, C.g2).rect(3, 38, 3, 3, C.g2).rect(42, 38, 3, 3, C.g2);
    p.ell(16, 20, 6, 4, C.e2).ell(15, 19, 3, 2, C.e3).ell(28, 30, 7, 4, C.e1).ell(27, 29, 3, 2, C.e2).ell(33, 17, 3, 2, C.b3);
    [[12, 31], [15, 29], [18, 27], [21, 25], [24, 23], [27, 21]].forEach(([x, y]) => p.rect(x, y, 2, 1, C.r1));
    p.line(29, 15, 33, 19, C.r1, 2).line(33, 15, 29, 19, C.r1, 2);
    return fin(p); },
  quiz() { const p = new Px();
    p.rect(9, 5, 26, 37, C.wh).rect(31, 5, 4, 37, C.p1).rect(9, 5, 26, 4, C.b2).rect(9, 5, 26, 1, C.b3);
    for (let i = 0; i < 4; i++) { const y = 14 + i * 7; p.rect(18, y, 12, 2, C.k2); p.rect(12, y - 1, 4, 4, i < 3 ? C.e1 : C.k3); if (i < 3) p.set(12, y, C.e3).set(13, y + 1, C.e3); }
    p.line(23, 44, 40, 27, C.g2, 4).line(24, 45, 41, 28, C.g1, 1).line(39, 26, 42, 23, C.pk, 4).line(21, 42, 23, 44, C.p1, 3).set(20, 45, C.o);
    return fin(p); },
  gacha() { const p = new Px();
    p.ring(24, 24, 15, 19, C.v1).ring(24, 24, 16, 18, C.v2).ring(24, 24, 11, 15, C.v0);
    p.circ(24, 24, 11, C.v1).circ(24, 24, 8, C.v2).circ(24, 24, 5, C.v3);
    p.poly([[24, 12], [27, 21], [36, 24], [27, 27], [24, 36], [21, 27], [12, 24], [21, 21]], C.g3).poly([[24, 15], [26, 22], [24, 24], [22, 22]], C.g4);
    [[24, 5], [43, 24], [24, 43], [5, 24]].forEach(([x, y]) => p.rect(x - 1, y - 1, 3, 3, C.g2));
    p.outline(); sparkle(p, 39, 9, C.g4); sparkle(p, 9, 39, C.v4); sparkle(p, 40, 40, C.wh);
    return p.shadow(); },
  fish() { const p = new Px();
    p.line(36, 2, 36, 15, C.k2).line(36, 15, 33, 18, C.k1, 2);
    p.ell(22, 29, 14, 9, C.b2).ell(20, 26, 10, 4, C.b3).ell(22, 33, 12, 4, C.b1);
    p.poly([[34, 29], [45, 20], [45, 38]], C.b1).poly([[36, 29], [43, 23], [43, 27]], C.b2);
    p.poly([[18, 21], [26, 15], [28, 21]], C.b1);
    p.circ(13, 27, 3, C.wh).circ(12, 27, 1, C.o);
    for (let i = 0; i < 3; i++) p.line(19 + i * 5, 25, 21 + i * 5, 33, C.b0);
    p.outline(); sparkle(p, 6, 12, C.b4); return p.shadow(); },
  book() { const p = new Px();
    p.rect(10, 7, 29, 35, C.p3).rect(10, 39, 29, 3, C.p1);
    p.rr(7, 5, 30, 35, 2, C.r1).rect(7, 5, 6, 35, C.r0).rect(13, 5, 24, 2, C.r2);
    p.rect(9, 9, 2, 3, C.g2).rect(9, 33, 2, 3, C.g2);
    p.poly([[24, 13], [26, 19], [32, 19], [27, 23], [29, 29], [24, 25], [19, 29], [21, 23], [16, 19], [22, 19]], C.g3).rect(23, 16, 2, 4, C.g4);
    p.rect(30, 38, 4, 9, C.b2).set(31, 46, null).set(32, 46, null);
    return fin(p); },
  shop() { const p = new Px();
    p.rect(8, 22, 32, 20, C.w2).rect(8, 22, 32, 3, C.w3).rect(10, 27, 28, 8, C.w0).rect(8, 38, 32, 4, C.w1);
    p.rect(9, 19, 2, 23, C.w1).rect(37, 19, 2, 23, C.w1);
    for (let i = 0; i < 6; i++) { const x = 4 + i * 7; p.rect(x, 8, 7, 10, i % 2 ? C.wh : C.r1); p.ell(x + 3, 18, 3, 2, i % 2 ? C.wh : C.r1); }
    p.rect(4, 6, 41, 3, C.r0);
    p.circ(17, 31, 4, C.g2).circ(17, 31, 2, C.g3).circ(27, 32, 3, C.e2).rect(26, 28, 2, 2, C.e1).circ(33, 31, 3, C.r2);
    return fin(p); },
  bag() { const p = new Px();
    p.line(17, 10, 17, 4, C.w1, 3).line(17, 4, 31, 4, C.w1, 3).line(31, 4, 31, 10, C.w1, 3);
    p.rr(9, 10, 30, 33, 6, C.e1).rr(11, 11, 22, 29, 5, C.e2).rect(33, 14, 4, 26, C.e0);
    p.rr(9, 10, 30, 13, 6, C.e0).rr(11, 11, 26, 10, 4, C.e1).rect(12, 12, 18, 2, C.e3);
    p.rect(22, 19, 5, 6, C.g2).rect(23, 20, 3, 4, C.g0);
    p.rr(15, 28, 18, 11, 3, C.e0).rr(16, 29, 16, 9, 3, C.e1).rect(16, 29, 16, 2, C.e2);
    return fin(p); },
  coin() { const p = new Px(); p.circ(24, 24, 19, C.g1).circ(23, 23, 17, C.g2).ring(23, 23, 11, 14, C.g1).circ(23, 23, 11, C.g3);
    p.rect(21, 15, 4, 17, C.g1).rect(17, 18, 12, 3, C.g1).rect(17, 26, 12, 3, C.g1).rect(12, 12, 4, 4, C.g4);
    return fin(p); },
  gem() { const p = new Px(); p.poly([[24, 44], [4, 18], [12, 6], [36, 6], [44, 18]], C.c1);
    p.poly([[12, 6], [36, 6], [44, 18], [4, 18]], C.c2).poly([[16, 6], [24, 18], [32, 6]], C.c3).poly([[24, 44], [4, 18], [24, 18]], C.c0);
    p.line(4, 18, 44, 18, C.c0); p.outline(); sparkle(p, 38, 9, C.wh); return p.shadow(); },
  star() { const p = new Px(); const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 9 : 21; pts.push([24 + Math.cos(a) * r, 25 + Math.sin(a) * r]); }
    p.poly(pts, C.g2).tint((x, y) => (y < 22 && x < 26 ? C.g3 : y > 32 ? C.g1 : null)).rect(19, 18, 3, 3, C.g4); return fin(p); },
  gear() { const p = new Px(); for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, x = 24 + Math.cos(a) * 17, y = 24 + Math.sin(a) * 17; p.circ(Math.round(x), Math.round(y), 5, C.k1); }
    p.circ(24, 24, 16, C.k1).circ(23, 23, 13, C.k2).circ(24, 24, 6, C.k0).circ(24, 24, 4, null);
    for (let y = 20; y <= 28; y++) for (let x = 20; x <= 28; x++) if ((x - 24) ** 2 + (y - 24) ** 2 <= 17) p.set(x, y, null);
    return fin(p); },
  lock() { const p = new Px(); p.ring(24, 19, 8, 13, C.k1).ring(24, 19, 9, 11, C.k2).rect(10, 20, 28, 4, null);
    p.rr(9, 21, 30, 23, 3, C.g1).rr(10, 22, 27, 20, 3, C.g2).rect(10, 22, 27, 3, C.g3).rect(22, 29, 4, 4, C.o).rect(23, 32, 2, 6, C.o); return fin(p); },
  shield() { const p = new Px(); p.poly([[24, 45], [8, 34], [7, 8], [24, 3], [41, 8], [40, 34]], C.b1).poly([[24, 41], [11, 32], [10, 10], [24, 6], [24, 41]], C.b2);
    p.poly([[24, 13], [26, 20], [33, 20], [27, 25], [29, 32], [24, 28], [19, 32], [21, 25], [15, 20], [22, 20]], C.g3); return fin(p); },
  help() { const p = new Px(); p.circ(24, 24, 20, C.b1).circ(23, 23, 18, C.b2).rect(15, 10, 6, 3, C.b3);
    p.rect(18, 13, 12, 4, C.wh).rect(28, 15, 4, 8, C.wh).rect(22, 22, 8, 4, C.wh).rect(22, 25, 4, 5, C.wh).rect(22, 33, 4, 4, C.wh); return fin(p); },
  face() { const p = new Px(); // หน้ากากละคร (หน้าตา)
    p.ell(24, 25, 17, 19, C.p3).ell(20, 20, 9, 8, C.wh).ell(24, 33, 15, 9, C.p2).rect(7, 22, 3, 8, C.p1);
    p.ell(17, 22, 4, 3, C.o).ell(31, 22, 4, 3, C.o).set(16, 21, C.wh).set(30, 21, C.wh);
    p.ell(14, 30, 3, 2, C.pk).ell(34, 30, 3, 2, C.pk);
    p.line(17, 33, 20, 36, C.r0, 2).line(20, 36, 28, 36, C.r0, 2).line(28, 36, 31, 33, C.r0, 2);
    p.poly([[10, 10], [24, 3], [38, 10], [34, 14], [14, 14]], C.v2).rect(22, 4, 4, 3, C.g3);
    return fin(p); },
  frame() { const p = new Px(); // กรอบรูป
    p.rect(5, 7, 38, 34, C.g1).rect(6, 8, 36, 32, C.g2).rect(6, 8, 36, 2, C.g4).rect(6, 38, 36, 2, C.g0);
    p.rect(11, 13, 26, 22, C.b3).rect(11, 26, 26, 9, C.e2).poly([[11, 35], [20, 22], [29, 35]], C.e1).poly([[22, 35], [30, 25], [37, 35]], C.e0).circ(31, 18, 3, C.g4);
    [[6, 8], [40, 8], [6, 37], [40, 37]].forEach(([x, y]) => p.rect(x, y, 2, 3, C.g4));
    return fin(p); },
  tag() { const p = new Px(); // ป้ายฉายา
    p.poly([[6, 24], [16, 11], [42, 11], [42, 37], [16, 37]], C.r1).poly([[8, 24], [17, 13], [40, 13], [40, 22], [10, 22]], C.r2).rect(16, 34, 26, 3, C.r0);
    p.circ(16, 24, 3, C.o2).circ(16, 24, 1, C.p3); p.rect(22, 19, 15, 3, C.g3).rect(22, 26, 11, 3, C.p2);
    return fin(p); },
  party() { const p = new Px(); // พลุ/เอฟเฟกต์
    p.poly([[6, 43], [14, 19], [30, 35]], C.v2).poly([[6, 43], [10, 31], [18, 39]], C.v1).line(11, 30, 22, 39, C.g3, 2).line(9, 36, 15, 41, C.g3, 2);
    [[26, 8, C.g3], [36, 14, C.c2], [40, 26, C.r2], [30, 20, C.e2], [20, 10, C.pk], [42, 6, C.g4]].forEach(([x, y, c]) => p.rect(x - 2, y - 2, 4, 4, c));
    p.line(18, 18, 26, 6, C.r2, 2).line(32, 30, 44, 22, C.b2, 2);
    p.outline(); sparkle(p, 36, 36, C.g4); return p.shadow(); },
  palette() { const p = new Px(); // จานสี (ธีม)
    p.ell(24, 25, 20, 16, C.w3).ell(22, 23, 16, 12, C.w4).circ(30, 33, 4, null);
    [[14, 18, C.r2], [23, 14, C.g3], [32, 17, C.b2], [37, 25, C.e2], [15, 28, C.v2]].forEach(([x, y, c]) => p.circ(x, y, 3, c).set(x - 1, y - 1, C.wh));
    p.line(30, 44, 43, 31, C.w1, 3).line(41, 33, 45, 29, C.k2, 3);
    return fin(p); },
  note() { const p = new Px(); // โน้ตเพลง (เสียง)
    p.ell(14, 37, 7, 5, C.b1).ell(34, 33, 7, 5, C.b1).ell(13, 36, 3, 2, C.b3).ell(33, 32, 3, 2, C.b3);
    p.rect(19, 10, 3, 27, C.b1).rect(39, 6, 3, 27, C.b1).poly([[19, 10], [42, 4], [42, 12], [19, 18]], C.b2).line(21, 11, 40, 6, C.b3);
    p.outline(); sparkle(p, 8, 10, C.g4); return p.shadow(); },
  chart() { const p = new Px(); // กราฟ (ความคืบหน้า)
    p.rect(5, 6, 38, 36, C.p3).rect(5, 6, 38, 4, C.k2).rect(9, 38, 31, 2, C.k1).rect(9, 12, 2, 28, C.k1);
    p.rect(14, 28, 6, 10, C.r2).rect(22, 21, 6, 17, C.g2).rect(30, 15, 6, 23, C.e2).rect(14, 28, 2, 10, C.r3).rect(22, 21, 2, 17, C.g4).rect(30, 15, 2, 23, C.e3);
    p.line(13, 24, 21, 18, C.b1, 2).line(21, 18, 29, 13, C.b1, 2).line(29, 13, 38, 9, C.b1, 2);
    return fin(p); },
};

// ---------- กรอบ 9 ช่อง (วาดหน่วยละ 1 แล้วขยาย ×2 → พิกเซลหนาเท่ากันทุกกรอบ) ----------
function frame(kind) {
  let p, slice;
  if (kind === "panel") { p = new Px(24, 24); slice = 6; // แผ่นกระดาษ ขอบไม้ หมุดทอง
    p.rect(0, 0, 24, 24, C.o).rect(1, 1, 22, 22, C.w2).rect(1, 1, 22, 1, C.w4).rect(1, 1, 1, 22, C.w3).rect(1, 22, 22, 1, C.w0).rect(22, 1, 1, 22, C.w1);
    p.rect(3, 3, 18, 18, C.o2).rect(4, 4, 16, 16, C.p2).rect(4, 4, 16, 1, C.p3).rect(4, 19, 16, 1, C.p1);
    [[2, 2], [21, 2], [2, 21], [21, 21]].forEach(([x, y]) => p.set(x, y, C.g3)); }
  else if (kind === "violet") { p = new Px(24, 24); slice = 6; // แผ่นเวทมนตร์สีม่วง (ประตูอัญเชิญ)
    p.rect(0, 0, 24, 24, C.o).rect(1, 1, 22, 22, C.v1).rect(1, 1, 22, 1, C.v3).rect(1, 1, 1, 22, C.v2).rect(1, 22, 22, 1, C.v0).rect(22, 1, 1, 22, C.v0);
    p.rect(3, 3, 18, 18, "#0c0a18").rect(4, 4, 16, 16, "#17132a").rect(4, 4, 16, 1, "#2a2250");
    [[2, 2], [21, 2], [2, 21], [21, 21]].forEach(([x, y]) => p.set(x, y, C.g3)); }
  else if (kind === "dark") { p = new Px(18, 18); slice = 5; // ช่องไม้เข้ม (แถบเมนู/ป้าย)
    p.rect(0, 0, 18, 18, C.o).rect(1, 1, 16, 16, C.w1).rect(1, 1, 16, 1, C.w3).rect(1, 16, 16, 1, C.w0).rect(3, 3, 12, 12, C.w0).rect(3, 3, 12, 1, "#3a2210");
    [[2, 2], [15, 2], [2, 15], [15, 15]].forEach(([x, y]) => p.set(x, y, C.g1)); }
  else if (["gold", "blue", "paper", "red", "green"].includes(kind)) { p = new Px(15, 15); slice = 5; // ปุ่ม: ขอบดำ มุมตัด ไฮไลต์บน เงาล่าง
    const K = { gold: [C.g4, C.g2, C.g1, C.g0], blue: [C.b3, C.b2, C.b1, C.b0], paper: [C.p3, C.p2, C.p1, C.p0], red: [C.r3, C.r2, C.r1, C.r0], green: [C.e3, C.e2, C.e1, C.e0] }[kind];
    p.rect(1, 0, 13, 15, C.o).rect(0, 1, 15, 13, C.o).rect(1, 1, 13, 13, K[1]).rect(1, 1, 13, 1, K[0]).rect(1, 2, 1, 8, K[0]).rect(1, 11, 13, 2, K[2]).rect(1, 13, 13, 1, K[3]); }
  else if (kind === "inset") { p = new Px(12, 12); slice = 3; // ช่องกรอก/ช่องเก็บของ (ลึกลงไป)
    p.rect(0, 0, 12, 12, C.o).rect(1, 1, 10, 10, C.p3).rect(1, 1, 10, 1, C.p0).rect(1, 1, 1, 10, C.p1); }
  else throw new Error("frame " + kind);
  return { url: p.url(2), slice: slice * 2 };
}

const cache = {};
export function pxIcon(name) { if (!cache[name]) cache[name] = ICON[name] ? ICON[name]().url() : ""; return cache[name]; }
export const pxImg = (name, size = 48, cls = "pxi") => `<img class="${cls}" src="${pxIcon(name)}" width="${size}" height="${size}" alt="" draggable="false">`;
export const PX_ICONS = Object.keys(ICON);

let installed = false;
/** ติดตั้งชุด UI: สร้างกรอบเป็นรูป แล้วใส่เป็นตัวแปร CSS · เปิดคลาส px48 บน <html> */
export function installPixelUI() {
  if (installed || typeof document === "undefined") return; installed = true;
  try {
    const r = document.documentElement;
    for (const k of ["panel", "violet", "dark", "gold", "blue", "paper", "red", "green", "inset"]) { const f = frame(k); r.style.setProperty(`--px-${k}`, `url("${f.url}")`); r.style.setProperty(`--px-${k}-s`, String(f.slice)); }
    for (const n of ["coin", "gem", "star"]) r.style.setProperty(`--pxi-${n}`, `url("${pxIcon(n)}")`);
    r.classList.add("px48");
  } catch (e) { console.warn("pixel ui", e); }
}
