// 🏞️ จุดชมวิวในแผนที่ที่ขยาย (พิกเซลอาร์ต HD-2D วาดด้วยโค้ด): กังหันลม · ศาลากลางน้ำ · ต้นไม้ยักษ์ · ซุ้มประตูโบราณ · หุ่นไล่กา · ฟาง
import { PB, PAL, hash, vnoise, fbm, clamp, hex, mix, tone, ramp, pick, cylLight, sphereLight, outline, blob, cylinder } from "./art.js";

const R = (h, n = 8, lo = -0.8, hi = 0.5) => ramp(hex(h), n, lo, hi);
function poly(pb, pts, Rp, bias = 0, vg = 0.15) {
  let y0 = Infinity, y1 = -Infinity; for (const [, y] of pts) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) { const yc = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + ((yc - ay) / (by - ay)) * (bx - ax)); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) { const a = xs[k], b = xs[k + 1], mid = (a + b) / 2, hw = Math.max(1, (b - a) / 2);
      for (let x = Math.ceil(a - 0.5); x <= Math.floor(b - 0.5); x++) pb.set(x, y, pick(Rp, cylLight(clamp((x + 0.5 - mid) / hw, -1, 1)) * 0.85 + bias - ((y - y0) / (y1 - y0 + 1)) * vg + (hash(x, y, 5) - 0.5) * 0.05)); } }
}
const line = (pb, x0, y0, x1, y1, c, w = 1) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2) + 1; for (let i = 0; i <= n; i++) { const t = i / n; pb.rect(Math.round(x0 + (x1 - x0) * t - (w - 1) / 2), Math.round(y0 + (y1 - y0) * t - (w - 1) / 2), w, w, c); } };

// ---------- กังหันลมหิน (ใบพัดแยกเป็นเฟรมหมุน) ----------
export function windmill() {
  const W = 124, H = 196, pb = new PB(W, H), St = PAL.stone, cx = 62;
  for (let y = 70; y < 190; y++) { const t = (y - 70) / 120, hw = 20 + t * 13; for (let x = Math.round(cx - hw); x < cx + hw; x++) {
    const u = (x + 0.5 - cx) / hw, row = Math.floor((y - 70) / 7), off = (row & 1) * 6, brick = (Math.floor((x + off) / 12) + row) & 3, mortar = (y - 70) % 7 === 6 || (x + off) % 12 === 0;
    pb.set(x, y, mortar ? St[1] : pick(St, cylLight(u) * 0.8 + 0.08 + brick * 0.04 + (vnoise(x / 4, y / 4, 3) - 0.5) * 0.12 - (y > 176 ? 0.12 : 0))); } }
  for (let y = 162; y < 190; y++) for (let x = cx - 8; x < cx + 8; x++) { const top = y < 168 && Math.hypot(x + 0.5 - cx, y - 168) > 8; if (top) continue; pb.set(x, y, pick(PAL.wood, 0.45 + ((x - cx + 8) % 5 === 0 ? -0.2 : 0) + (x < cx ? 0.1 : 0))); }
  pb.rect(cx + 4, 176, 2, 2, [220, 180, 80]);
  for (const wy of [100, 132]) { pb.rect(cx - 6, wy, 12, 14, [40, 30, 26]); pb.rect(cx - 5, wy + 1, 10, 12, [255, 214, 120]); pb.rect(cx - 1, wy + 1, 2, 12, [90, 60, 40]); pb.rect(cx - 5, wy + 6, 10, 2, [90, 60, 40]); pb.rect(cx - 7, wy + 14, 14, 2, St[5]); }
  const Rf = R("#9a3a2a", 9, -0.85, 0.45);
  for (let y = 30; y < 76; y++) { const t = (y - 30) / 46, hw = 6 + Math.sqrt(t) * 26; for (let x = Math.round(cx - hw); x < cx + hw; x++) { const u = (x + 0.5 - cx) / hw, sh = ((y - 30) % 6 === 5) ? -0.18 : 0;
    pb.set(x, y, pick(Rf, cylLight(u) * 0.85 + 0.1 + sh + ((x + (Math.floor((y - 30) / 6) & 1) * 3) % 7 === 0 ? -0.1 : 0))); } }
  pb.rect(cx - 34, 74, 68, 3, PAL.wood[2]); pb.rect(cx - 34, 74, 68, 1, PAL.wood[5]);
  line(pb, cx, 30, cx, 18, PAL.iron[3], 2); blob(pb, cx, 16, 3, 3, R("#e0b040", 6, -0.6, 0.5));
  return { s: outline(pb, cx, H - 4, -0.82), hub: [cx + 1, 63] };
}
// ใบพัด 4 แฉก (เฟรมหมุน 0–90°)
export function windmillSails(n = 8) {
  const S = 128, c = S / 2, out = [], Wd = PAL.wood, Cl = R("#f2e8d0", 6, -0.5, 0.25);
  for (let f = 0; f < n; f++) { const a = (f / n) * (Math.PI / 2), pb = new PB(S, S);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const dx = x + 0.5 - c, dy = y + 0.5 - c;
      for (let k = 0; k < 4; k++) { const ang = a + (k * Math.PI) / 2, ca = Math.cos(-ang), sa = Math.sin(-ang), u = dx * ca - dy * sa, v = dx * sa + dy * ca;
        if (u < 4 || u > 60) continue;
        if (Math.abs(v) <= 1.2) { pb.set(x, y, pick(Wd, 0.5 + (v < 0 ? 0.2 : -0.1))); break; }
        if (v > 1.2 && v < 13 && u > 14 && u < 58) { const lat = (Math.floor(u) % 9 === 0) || Math.abs(v - 7) < 0.6; pb.set(x, y, lat ? Wd[2] : pick(Cl, 0.55 + (v < 4 ? 0.15 : 0) - (u > 54 ? 0.15 : 0))); break; } } }
    blob(pb, c, c, 5, 5, R("#6a4a2a", 6, -0.6, 0.4)); pb.set(c - 1, c - 1, [220, 190, 140]);
    out.push(outline(pb, c, c, -0.85)); }
  return out;
}

// ---------- ศาลากลางทะเลสาบ ----------
export function gazebo() {
  const W = 136, H = 150, pb = new PB(W, H), cx = 68, Wd = PAL.wood, Rf = R("#2f7a8a", 9, -0.85, 0.45), Pi = R("#f0e8dc", 6, -0.6, 0.3), Rd = R("#b8302a", 6, -0.6, 0.45);
  for (let y = 124; y < 146; y++) { const hw = 60 - Math.max(0, y - 136) * 1.5; for (let x = Math.round(cx - hw); x < cx + hw; x++) pb.set(x, y, y < 127 ? Wd[6] : y > 138 ? pick(PAL.stone, 0.4 + (x % 9 === 0 ? -0.2 : 0)) : pick(Wd, 0.5 + ((y - 127) % 4 === 3 ? -0.25 : 0) + (x < cx ? 0.06 : 0))); }
  for (let i = 0; i < 3; i++) pb.rect(cx - 14, 146 - i * 0 + i, 28, 1, Wd[5 - i]);
  for (const px of [16, 42, 94, 120]) cylinder(pb, px - 3, 66, 7, 60, px < cx ? Rd : tone ? Rd : Rd, { bias: px > cx ? -0.15 : 0.05 });
  for (const [x0, x1] of [[19, 39], [97, 117]]) { for (let x = x0; x < x1; x++) { pb.set(x, 102, Wd[5]); pb.set(x, 112, Wd[2]); if ((x - x0) % 5 === 0) for (let y = 102; y < 113; y++) pb.set(x, y, Wd[4]); } }
  poly(pb, [[cx, 6], [cx + 30, 34], [cx + 70, 66], [cx + 62, 72], [cx - 62, 72], [cx - 70, 66], [cx - 30, 34]], Rf, 0.05, 0.25);
  for (let x = cx - 66; x < cx + 66; x++) { pb.set(x, 70, Rf[1]); pb.set(x, 71, Rd[2]); pb.set(x, 72, Rd[3]); if (x % 6 === 0) pb.set(x, 73, Rd[1]); }
  for (let k = 0; k < 7; k++) { const y = 18 + k * 7, hw = 10 + k * 8.5; for (let x = Math.round(cx - hw); x < cx + hw; x += 3) pb.set(x, y, Rf[2]); }
  poly(pb, [[cx - 72, 64], [cx - 76, 58], [cx - 66, 66]], Rf, 0.1); poly(pb, [[cx + 72, 64], [cx + 76, 58], [cx + 66, 66]], Rf, -0.1);
  line(pb, cx, 6, cx, -2 + 4, R("#e0b040", 6)[4], 2); blob(pb, cx, 3, 3, 3, R("#ffd84a", 6, -0.6, 0.6), { bias: 0.1 });
  for (const lx of [cx - 50, cx + 50]) { pb.rect(lx, 74, 1, 6, [60, 40, 30]); pb.rect(lx - 3, 80, 7, 9, [200, 50, 40]); pb.rect(lx - 2, 81, 5, 7, [255, 190, 90]); pb.rect(lx - 3, 89, 7, 1, [60, 40, 30]); }
  return { s: outline(pb, cx, H - 3, -0.82), lamps: [[cx - 50 + 1, 85], [cx + 50 + 1, 85]] };
}

// ---------- ต้นไม้ยักษ์ศักดิ์สิทธิ์ (พันผ้าสามสี) ----------
export function greatTree() {
  const W = 260, H = 290, pb = new PB(W, H), cx = 130, B = PAL.bark, L = PAL.leaf;
  // รากแผ่ + ลำต้น
  for (const [ex, ey, w] of [[cx - 70, 284, 10], [cx - 40, 286, 8], [cx + 42, 286, 9], [cx + 74, 282, 10], [cx - 12, 288, 6], [cx + 18, 288, 6]]) { const n = 26; for (let i = 0; i <= n; i++) { const t = i / n, x = cx + (ex - cx) * t, y = 250 + (ey - 250) * Math.pow(t, 0.7), r = (w * (1 - t * 0.7)) / 2 + 2;
    for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r) pb.set(Math.round(x + xx), Math.round(y + yy), pick(B, 0.5 - yy / r * 0.25 - (ex > cx ? 0.12 : 0))); } }
  for (let y = 150; y < 268; y++) { const t = (y - 150) / 118, hw = 22 + t * t * 18 + Math.sin(y / 9) * 2; for (let x = Math.round(cx - hw); x < cx + hw; x++) { const u = (x + 0.5 - cx) / hw;
    const groove = Math.sin(x * 0.55 + Math.sin(y / 11) * 3) > 0.75 ? -0.22 : 0; pb.set(x, y, pick(B, cylLight(u) * 0.75 + 0.1 + groove + (vnoise(x / 3, y / 6, 7) - 0.5) * 0.15)); } }
  // ผ้าสามสีพันรอบต้น
  for (const [y0, col] of [[214, "#d83a3a"], [221, "#f0c030"], [228, "#3a9a4a"]]) { const Rc = R(col, 6, -0.6, 0.4); for (let y = y0; y < y0 + 6; y++) { const t = (y - 150) / 118, hw = 22 + t * t * 18 + 1; for (let x = Math.round(cx - hw); x < cx + hw; x++) pb.set(x, y, pick(Rc, cylLight((x + 0.5 - cx) / hw) * 0.8 + 0.1 + (y === y0 ? 0.15 : 0))); } }
  for (const [x, y] of [[cx + 16, 232], [cx + 20, 232]]) line(pb, x, y, x + 6, y + 18, hex("#d83a3a"), 2);
  // กิ่งใหญ่
  for (const [ex, ey] of [[cx - 80, 108], [cx + 86, 102], [cx - 30, 70], [cx + 36, 74]]) { const n = 30; for (let i = 0; i <= n; i++) { const t = i / n, x = cx + (ex - cx) * t, y = 160 + (ey - 160) * t - Math.sin(t * Math.PI) * 10, r = 9 * (1 - t * 0.6);
    for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r) pb.set(Math.round(x + xx), Math.round(y + yy), pick(B, 0.45 - yy / r * 0.2)); } }
  // พุ่มใบหลายชั้น (หลังมืด → หน้าสว่าง)
  const clumps = []; for (let i = 0; i < 44; i++) { const a = hash(i, 1, 81) * Math.PI * 2, d = Math.sqrt(hash(i, 2, 81)); clumps.push([cx + Math.cos(a) * d * 104, 98 + Math.sin(a) * d * 72, 22 + hash(i, 3, 81) * 18]); }
  clumps.sort((p, q) => p[1] - q[1]);
  for (const [x, y, r] of clumps) blob(pb, x, y, r, r * 0.82, L, { jag: 0.35, seed: (x * 7 + y) | 0, bias: -0.18 + (98 - y) / 400 });
  for (let i = 0; i < 34; i++) { const a = hash(i, 4, 82) * Math.PI * 2, d = Math.sqrt(hash(i, 5, 82)) * 0.9; blob(pb, cx - 14 + Math.cos(a) * d * 84, 76 + Math.sin(a) * d * 52, 14 + hash(i, 6, 82) * 9, 12, L, { jag: 0.4, seed: i + 90, bias: 0.12 }); }
  for (let i = 0; i < 160; i++) { const x = 20 + hash(i, 7, 83) * 220 | 0, y = 26 + hash(i, 8, 83) * 150 | 0; if (pb.alpha(x, y) && pb.alpha(x, y - 2)) pb.set(x, y, hash(i, 9, 83) < 0.6 ? L[8] : [255, 220, 230]); }
  return { s: outline(pb, cx, H - 4, -0.82), glow: [[cx - 60, 120], [cx + 52, 110], [cx - 10, 60], [cx + 80, 150], [cx - 86, 150]] };
}

// ---------- ซุ้มประตูหินโบราณ (ครึ่งพัง มีเถาวัลย์) ----------
export function ruinArch() {
  const W = 140, H = 136, pb = new PB(W, H), St = R("#c8b08a", 8, -0.8, 0.4), Mo = PAL.leafB;
  const block = (x, y, w, h, b = 0) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const e = i === 0 || j === 0 ? 0.22 : i === w - 1 || j === h - 1 ? -0.3 : 0; pb.set(x + i, y + j, pick(St, 0.5 + b + e + (vnoise((x + i) / 3, (y + j) / 3, 9) - 0.5) * 0.18)); } };
  for (let r = 0; r < 9; r++) { block(14, 120 - r * 11, 26, 11, 0.05 - (r % 2) * 0.04); block(100, 120 - r * 11, 26, 11, -0.12 - (r % 2) * 0.04); }
  block(10, 124, 34, 8, 0.1); block(96, 124, 34, 8, -0.05);
  for (let k = 0; k < 7; k++) { const a = Math.PI - (k / 9) * Math.PI, x = 70 + Math.cos(a) * 44 - 9, y = 40 - Math.sin(a) * 30; block(Math.round(x), Math.round(y), 18, 14, 0.08 - k * 0.02); }
  block(96, 26, 26, 14, -0.1);
  for (const [x, y] of [[104, 18], [86, 116], [118, 118], [42, 122]]) block(x, y, 12, 9, -0.05);
  for (let i = 0; i < 70; i++) { const x = 10 + hash(i, 1, 91) * 120 | 0, y = 14 + hash(i, 2, 91) * 110 | 0; if (pb.alpha(x, y)) for (let k = 0; k < 4; k++) pb.set(x + (k % 2), y + k, Mo[3 + ((i + k) % 4)]); }
  for (let v = 0; v < 3; v++) { let x = 18 + v * 8, y = 20; for (let i = 0; i < 40; i++) { x += Math.sin(i * 0.5 + v) * 0.9; y += 2.2; if (pb.alpha(Math.round(x), Math.round(y))) { pb.set(Math.round(x), Math.round(y), Mo[4]); if (i % 4 === 0) pb.rect(Math.round(x) - 1, Math.round(y), 3, 2, Mo[6]); } } }
  pb.rect(66, 18, 8, 8, [70, 200, 220]); pb.rect(68, 20, 4, 4, [200, 255, 255]);
  return { s: outline(pb, 70, H - 4, -0.82), rune: [71, 23] };
}

// ---------- ของประกอบไร่ ----------
export function scarecrow() {
  const pb = new PB(44, 70), Wd = PAL.wood, Hy = R("#e0c060", 6, -0.6, 0.4);
  cylinder(pb, 20, 20, 4, 48, Wd); pb.rect(4, 30, 36, 4, Wd[4]); pb.rect(4, 30, 36, 1, Wd[6]);
  poly(pb, [[10, 30], [34, 30], [36, 52], [8, 52]], R("#3a6ab8", 6, -0.6, 0.4)); pb.rect(14, 38, 6, 6, R("#d8402a")[4]); pb.rect(28, 44, 5, 5, R("#e0c060")[3]);
  for (const x of [4, 40]) for (let k = 0; k < 4; k++) pb.set(x + (x < 20 ? -1 : 1) * (k % 2), 31 + k, Hy[4 - (k % 2)]);
  blob(pb, 22, 20, 9, 9, R("#c8a070", 6, -0.6, 0.4)); pb.rect(18, 18, 2, 2, [40, 30, 20]); pb.rect(24, 18, 2, 2, [40, 30, 20]); line(pb, 18, 24, 26, 24, [80, 50, 30]);
  poly(pb, [[4, 13], [40, 13], [22, 0]], Hy, 0.1); pb.rect(6, 12, 32, 3, Hy[2]);
  return outline(pb, 22, 66, -0.82);
}
// ฟางม้วนกลม (เห็นหน้าม้วนเป็นวงก้นหอย + ด้านข้างเป็นทรงกระบอก)
export function hayBale() {
  const pb = new PB(42, 34), Hy = R("#dcb458", 8, -0.75, 0.45);
  for (let y = 4; y < 32; y++) for (let x = 14; x < 40; x++) { const u = (y - 18) / 14; if (Math.abs(u) > 1) continue; pb.set(x, y, pick(Hy, cylLight(-u) * 0.7 + 0.05 + (Math.sin(x * 1.3 + y * 0.4) > 0.6 ? -0.15 : 0) + (hash(x, y, 4) - 0.5) * 0.1 - (x > 34 ? 0.1 : 0))); }
  for (let y = 4; y < 32; y++) for (let x = 2; x < 28; x++) { const dx = (x + 0.5 - 15) / 13, dy = (y + 0.5 - 18) / 14, d = Math.hypot(dx, dy); if (d > 1) continue;
    const ang = Math.atan2(dy, dx), spiral = Math.sin(d * 18 - ang * 1.0) > 0.3; pb.set(x, y, pick(Hy, sphereLight(dx * 0.7, dy * 0.7) * 0.6 + 0.3 + (spiral ? -0.18 : 0.04) - (d > 0.9 ? 0.2 : 0))); }
  for (const x of [22, 32]) for (let y = 5; y < 31; y++) if (pb.alpha(x, y) && x > 25) pb.set(x, y, [130, 80, 40]);
  return outline(pb, 21, 32, -0.82);
}
// โคมหิน
export function stoneLantern() {
  const pb = new PB(26, 46), St = PAL.stone;
  pb.rect(5, 40, 16, 5, St[3]); cylinder(pb, 10, 24, 6, 16, St); pb.rect(5, 20, 16, 4, St[5]); pb.rect(6, 11, 14, 9, St[2]); pb.rect(9, 13, 8, 5, [255, 210, 120]);
  poly(pb, [[2, 11], [24, 11], [13, 2]], St, 0.1); pb.rect(12, 0, 3, 3, St[4]);
  return { s: outline(pb, 13, 44, -0.82), light: [13, 15] };
}
