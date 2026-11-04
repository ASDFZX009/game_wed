// สไปรต์วัตถุในหมู่บ้าน (ความละเอียดสูง): ต้นไม้ บ้าน เนินหิน รั้ว ดอกไม้ ของประกอบฉาก เสาคริสตัล
// ทุกฟังก์ชันคืน { c: canvas, ax, ay } โดย (ax, ay) คือจุดที่วัตถุแตะพื้น
import { T, PB, PAL, rng, hash, vnoise, fbm, clamp, hex, mix, mul, tone, ramp, pick, sphereLight, cylLight, outline, blob, cylinder, bloom } from "./art.js";
import { grassRGB } from "./ground.js";

// ใบไม้ทีละใบ (ตารางสุ่ม) → ค่าแสงเล็ก ๆ ในใบ และขอบใบ
function leaf(x, y, s, cw = 5, ch = 4) {
  const cy = Math.floor(y / ch), off = Math.floor(hash(cy, 3, s) * cw), cx = Math.floor((x + off) / cw);
  let lx = ((x + off) - cx * cw) / cw - 0.5; const ly = (y - cy * ch) / ch - 0.5;
  if (hash(cx, cy, s + 1) < 0.5) lx = -lx;
  const e = Math.abs(lx) * 1.1 + Math.abs(ly) * 1.3;
  return { shade: -(lx * 0.8 + ly * 1.1), edge: e > 0.62 ? 1 : 0 };
}

// ---------- ต้นไม้ใบกว้าง (แอปเปิล/เขียว/ใบไม้เปลี่ยนสี) ----------
export function broadTree(kind, seed) {
  const W = 124, H = 156, pb = new PB(W, H), r = rng(seed * 7919 + 13), cxT = 62;
  const P = kind === "autumn" ? PAL.autumn : seed % 2 ? PAL.leafB : PAL.leaf, B = PAL.bark;
  const lean = (r() - 0.5) * 10;
  // ลำต้นบิดเล็กน้อย โคนบานเป็นราก
  for (let y = 66; y < 152; y++) {
    const t = (y - 66) / 86, cx = cxT + lean * (1 - t) + Math.sin(t * 4.2 + seed) * 2.4;
    const hw = 4 + t * 4.2 + (t > 0.84 ? (t - 0.84) * 70 * (1 + 0.4 * Math.sin(y)) : 0);
    for (let x = Math.floor(cx - hw - 1); x <= cx + hw + 1; x++) {
      const u = (x + 0.5 - cx) / hw; if (Math.abs(u) > 1) continue;
      let l = cylLight(u) * 0.95 + (vnoise(x * 0.8, y * 0.11, seed) - 0.5) * 0.4 - (1 - t) * 0.3;
      if (hash(x >> 1, y >> 2, seed) < 0.05) l -= 0.3;
      pb.set(x, y, pick(B, l));
    }
  }
  const branch = (x0, y0, x1, y1, w0) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
    for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, w = Math.max(1.2, w0 * (1 - t * 0.65));
      for (let dx = -Math.ceil(w); dx <= Math.ceil(w); dx++) for (let dy = 0; dy <= 1; dy++) { const u = dx / w; if (Math.abs(u) > 1) continue; pb.set(x + dx, y + dy, pick(B, cylLight(u) * 0.8 - 0.2)); } } };
  branch(cxT + lean * 0.5, 92, 34, 62, 3.6); branch(cxT + lean * 0.5, 88, 92, 58, 3.4); branch(cxT + lean * 0.7, 80, cxT + 4, 46, 3);
  // ทรงพุ่ม: ก้อนใบหลายก้อนเรียงเป็นโดม วาดจากหลังไปหน้า
  const blobs = [[cxT, 48, 32, 27]];
  for (let i = 0; i < 18; i++) { const a = r() * Math.PI * 2, d = 0.3 + r() * 0.7; const rr = 11 + r() * 10; blobs.push([cxT + Math.cos(a) * d * 38, 50 + Math.sin(a) * d * 28 - 2, rr, rr * 0.86]); }
  blobs.sort((a, b) => a[1] - b[1]);
  for (const [bx, by, rx, ry] of blobs) for (let y = Math.floor(by - ry - 2); y <= by + ry + 2; y++) for (let x = Math.floor(bx - rx - 2); x <= bx + rx + 2; x++) {
    const nx = (x + 0.5 - bx) / rx, ny = (y + 0.5 - by) / ry, lf = leaf(x, y, seed);
    const d = Math.sqrt(nx * nx + ny * ny) + lf.edge * 0.1 + (hash(x, y, seed + 5) - 0.5) * 0.1;
    if (d > 1 || y < 0) continue;
    const gx = clamp((x - cxT) / 50, -1, 1), gy = clamp((y - 50) / 42, -1, 1);
    let t = sphereLight(nx * 0.9, ny * 0.9) * 0.42 + sphereLight(gx * 0.85, gy * 0.85) * 0.5 + lf.shade * 0.2 - lf.edge * 0.16 - 0.04 - (y > 68 ? (y - 68) * 0.012 : 0);
    if (d > 0.84) t -= 0.16;
    pb.set(x, y, pick(P, t));
  }
  if (kind === "apple") for (let i = 0, n = 0; i < 80 && n < 16; i++) { // ลูกแอปเปิล
    const x = Math.floor(cxT - 36 + r() * 72), y = Math.floor(22 + r() * 52); if (pb.alpha(x, y) < 255 || pb.alpha(x + 2, y + 2) < 255) continue;
    pb.set(x + 1, y, [200, 40, 36]); pb.rect(x, y + 1, 3, 1, [176, 30, 30]); pb.set(x + 1, y + 2, [110, 16, 18]); pb.set(x, y + 1, [255, 120, 100]); pb.set(x + 1, y + 1, [214, 52, 44]); n++;
  }
  return outline(pb, cxT, 151);
}
// ---------- สน ----------
export function pineTree(seed) {
  const W = 76, H = 156, pb = new PB(W, H), cx = 38;
  cylinder(pb, cx - 4, 130, 8, 22, PAL.bark, { seed });
  for (let k = 5; k >= 0; k--) {
    const top = 4 + k * 20, bot = top + 36 + k * 2;
    for (let y = top; y < bot; y++) { const t = (y - top) / (bot - top), hw = (5 + k * 5.2) * (0.22 + 0.78 * t);
      for (let x = Math.floor(cx - hw); x <= cx + hw; x++) { const u = (x + 0.5 - cx) / hw; if (Math.abs(u) > 1) continue;
        if (t > 0.78 && (y - top) > (bot - top) - 1 - Math.abs(Math.sin((x - cx) * 0.55 + k)) * 6) continue; // ปลายกิ่งหยัก
        const needle = ((x * 2 + y) % 5 === 0 ? 0.14 : 0) + (hash(x, y, seed) - 0.5) * 0.18;
        const l = cylLight(u) * 0.75 + (t - 0.4) * 0.25 - (t < 0.25 ? 0.22 : 0) + needle;
        pb.set(x, y, pick(PAL.pine, l)); } }
  }
  return outline(pb, cx, 151);
}
// ---------- พุ่มไม้ / ดอกไม้ ----------
export function bush(seed, flowers) {
  const pb = new PB(46, 36), r = rng(seed + 99);
  for (let i = 0; i < 5; i++) { const bx = 10 + r() * 26, by = 14 + r() * 10, rr = 8 + r() * 5;
    for (let y = Math.floor(by - rr); y <= by + rr; y++) for (let x = Math.floor(bx - rr); x <= bx + rr; x++) {
      const nx = (x + 0.5 - bx) / rr, ny = (y + 0.5 - by) / (rr * 0.85), lf = leaf(x, y, seed, 4, 3), d = Math.sqrt(nx * nx + ny * ny) + lf.edge * 0.12;
      if (d > 1 || y > 32) continue;
      pb.set(x, y, pick(PAL.leafB, sphereLight(nx, ny) * 0.6 + lf.shade * 0.22 + 0.12 - lf.edge * 0.15 - (y > 26 ? 0.2 : 0))); } }
  if (flowers) { const c = hex(flowers); for (let i = 0; i < 40; i++) { const x = 4 + Math.floor(r() * 36), y = 4 + Math.floor(r() * 22); if (pb.alpha(x, y) && pb.alpha(x + 2, y + 2) && r() < 0.45) bloom(pb, x, y, c); } }
  return outline(pb, 23, 32);
}
export function flowerPatch(seed, color) {
  const pb = new PB(38, 28), r = rng(seed + 7), c = hex(color);
  for (let i = 0; i < 4; i++) blob(pb, 8 + r() * 22, 18 + r() * 5, 7, 5, PAL.leafB, { jag: 0.4, seed: seed + i, bias: 0.1 });
  for (let i = 0; i < 10; i++) { const x = 5 + Math.floor(r() * 26), y = 6 + Math.floor(r() * 12); pb.rect(x + 1, y + 3, 1, 4, PAL.leafB[3]); bloom(pb, x, y, c); bloom(pb, x, y, c); }
  return outline(pb, 19, 25);
}
export function lavender(seed) {
  const pb = new PB(32, 34), r = rng(seed + 3);
  blob(pb, 16, 26, 12, 6, PAL.leafB, { jag: 0.5, seed, bias: 0.05 });
  for (let i = 0; i < 9; i++) { const x = 5 + Math.floor(r() * 22), h = 10 + Math.floor(r() * 10);
    for (let y = 0; y < h; y++) pb.set(x, 28 - y, PAL.leafB[4]);
    for (let y = 0; y < 7; y++) { const yy = 28 - h + y; pb.set(x, yy, tone([150, 110, 210], y < 2 ? 0.3 : -y * 0.05)); if (y % 2) pb.set(x - 1, yy, [120, 84, 180]); else pb.set(x + 1, yy, [176, 140, 230]); } }
  return outline(pb, 16, 30);
}
// ---------- เนินหญ้ายกสูง หน้าผาหิน ----------
export function plateau(w, h, seed) {
  const RH = 26, W = w * T, H = h * T + RH, pb = new PB(W, H), top = h * T;
  // หน้าผาหิน (เซลล์โวโรนอย = ก้อนหิน)
  const pts = []; for (let gy = -1; gy <= 3; gy++) for (let gx = -1; gx <= Math.ceil(W / 12) + 1; gx++) pts.push([gx * 12 + hash(gx, gy, seed) * 12, top - 6 + gy * 10 + hash(gx, gy, seed + 1) * 10, hash(gx, gy, seed + 2)]);
  for (let y = top - 6; y < H; y++) for (let x = 0; x < W; x++) {
    let d1 = 1e9, d2 = 1e9, best = null; for (const p of pts) { const dd = (x - p[0]) ** 2 + ((y - p[1]) * 1.25) ** 2; if (dd < d1) { d2 = d1; d1 = dd; best = p; } else if (dd < d2) d2 = dd; }
    const edge = Math.sqrt(d2) - Math.sqrt(d1), nx = clamp((x - best[0]) / 9, -1, 1), ny = clamp((y - best[1]) / 8, -1, 1);
    let t = sphereLight(nx * 0.8, ny * 0.8) * 0.7 + 0.12 + (best[2] - 0.5) * 0.25 + (hash(x, y, seed) - 0.5) * 0.08 - (y - top) * 0.008;
    if (edge < 1.6) t -= 0.45;
    if (x < 2 || x > W - 3) t -= 0.25;
    pb.set(x, y, pick(PAL.rock, t));
    if (best[2] < 0.25 && ny < -0.2 && hash(x >> 1, y >> 1, seed + 4) < 0.5) pb.set(x, y, tone([86, 110, 40], ny));
  }
  // หญ้าด้านบน (ยกสูงจึงโดนแดดกว่า) ขอบเป็นกอ
  for (let y = 0; y < top + 6; y++) for (let x = 0; x < W; x++) {
    const ex = Math.min(x, W - 1 - x), jag = vnoise(x / 3, y / 3, seed) * 4;
    if (y < 2 + jag * 0.6 || ex < jag * 0.5) continue;
    const hang = 2 + vnoise(x / 2.5, 9, seed) * 6;
    if (y >= top - 2 && y - (top - 2) > hang) continue;
    let c = grassRGB(x + seed * 37, y + seed * 53, 0.08);
    if (y < 5 + jag * 0.6 || ex < 2 + jag * 0.5) c = tone(c, 0.22);
    if (y >= top - 2) c = tone(c, -0.35 - (y - top) * 0.04);
    pb.set(x, y, c);
  }
  return outline(pb, 0, H - 2, -0.7);
}
// ---------- รั้วไม้ ----------
const FENCE = ["#3a3028", "#54483a", "#706250", "#8c7c66", "#a8987e", "#c4b498"].map(hex);
export function fence(n) {
  const W = n * T, pb = new PB(W, 44);
  for (const ry of [14, 30]) for (let x = 0; x < W; x++) for (let y = 0; y < 4; y++) pb.set(x, ry + y, pick(FENCE, (y === 0 ? 0.8 : 0.45) + (vnoise(x / 4, ry, 3) - 0.5) * 0.3));
  for (let x0 = 1; x0 < W - 4; x0 += 8) { const post = x0 % 32 < 8, w = post ? 7 : 5, tip = post ? 2 : 4;
    for (let y = 4; y < 41; y++) for (let x = 0; x < w; x++) { const fromTop = y - 4; if (fromTop < tip && Math.abs(x - (w - 1) / 2) > fromTop * 0.9) continue;
      pb.set(x0 + x, y, pick(FENCE, (x === 0 ? 0.85 : x === w - 1 ? 0.2 : 0.55) + (hash(x0, y >> 2, 5) - 0.5) * 0.25 - (y > 36 ? 0.2 : 0))); } }
  return outline(pb, 0, 40);
}
// ---------- ของประกอบฉาก ----------
export const PROP = {
  barrel() { const pb = new PB(26, 34), Wd = PAL.wood;
    for (let y = 4; y < 32; y++) { const t = (y - 4) / 28, w = 18 + Math.sin(t * Math.PI) * 5, x0 = 13 - w / 2;
      for (let x = Math.floor(x0); x < x0 + w; x++) { const u = (x + 0.5 - 13) / (w / 2); let l = cylLight(u); if ((x - Math.floor(x0)) % 4 === 0) l -= 0.15;
        const hoop = (y >= 7 && y <= 8) || (y >= 26 && y <= 27); pb.set(x, y, hoop ? pick(PAL.iron, l + 0.1) : pick(Wd, l * 0.9 + (hash(x, y >> 2, 4) - 0.5) * 0.1)); } }
    for (let y = 1; y < 7; y++) for (let x = 3; x < 23; x++) { const nx = (x - 12.5) / 10, ny = (y - 3.5) / 3; if (nx * nx + ny * ny > 1) continue; pb.set(x, y, nx * nx + ny * ny > 0.62 ? Wd[3] : pick(Wd, 0.72 + (x % 4 === 0 ? -0.1 : 0))); }
    return outline(pb, 13, 31); },
  crate() { const pb = new PB(30, 30), Wd = PAL.wood;
    for (let y = 2; y < 10; y++) for (let x = 1; x < 29; x++) pb.set(x, y, pick(Wd, 0.8 + ((y - 2) % 4 === 3 ? -0.2 : 0) + (hash(x >> 2, y, 2) - 0.5) * 0.1));
    for (let y = 10; y < 28; y++) for (let x = 1; x < 29; x++) { const frame = x < 4 || x > 25 || y < 12 || y > 25, brace = Math.abs((x - 1) - (27 - (y - 10)) * 27 / 17) < 2.2;
      let l = frame ? 0.5 : brace ? 0.62 : 0.4 - ((y - 12) % 5 === 4 ? 0.18 : 0); l += (x < 4 ? 0.12 : 0) + (hash(x >> 2, y, 3) - 0.5) * 0.08; pb.set(x, y, pick(Wd, l)); }
    for (const [x, y] of [[2, 11], [26, 11], [2, 25], [26, 25]]) pb.set(x, y, PAL.iron[4]);
    return outline(pb, 15, 27); },
  lamp() { const pb = new PB(18, 66);
    cylinder(pb, 7, 18, 4, 44, PAL.iron); pb.rect(4, 60, 10, 4, PAL.iron[2]); pb.rect(4, 60, 10, 1, PAL.iron[4]);
    pb.rect(2, 1, 14, 4, PAL.iron[2]); pb.rect(3, 0, 12, 1, PAL.iron[4]); pb.rect(8, -1, 2, 2, PAL.iron[3]);
    for (let y = 5; y < 17; y++) for (let x = 3; x < 15; x++) { const d = Math.hypot(x - 8.5, y - 11) / 7; pb.set(x, y, mix([255, 248, 200], [240, 168, 64], clamp(d, 0, 1))); }
    for (const x of [3, 8, 14]) pb.rect(x, 5, 1, 12, PAL.iron[1]); pb.rect(3, 16, 12, 2, PAL.iron[2]);
    return outline(pb, 9, 63); },
  pot(v) { const pb = new PB(26, 36), C = ramp([190, 96, 58], 7, -0.7, 0.5);
    for (let y = 20; y < 34; y++) { const t = (y - 20) / 14, w = 18 - t * 5, x0 = 13 - w / 2; for (let x = Math.floor(x0); x < x0 + w; x++) pb.set(x, y, pick(C, cylLight((x + 0.5 - 13) / (w / 2)) - t * 0.1)); }
    for (let x = 3; x < 23; x++) for (let y = 17; y < 21; y++) pb.set(x, y, pick(C, cylLight((x - 12.5) / 10) + (y === 17 ? 0.25 : 0)));
    for (let i = 0; i < 4; i++) blob(pb, 8 + i * 3.5, 12 - (i % 2) * 3, 6, 5, PAL.leafB, { jag: 0.4, seed: i + 5, bias: 0.1 });
    const fc = hex(v < 0.33 ? "#e84a6a" : v < 0.66 ? "#f6c840" : "#b070e0"); for (const [x, y] of [[5, 5], [12, 2], [17, 7], [9, 9], [15, 11]]) bloom(pb, x, y, fc);
    return outline(pb, 13, 33); },
  sign() { const pb = new PB(40, 52), Wd = PAL.wood; cylinder(pb, 18, 10, 5, 40, Wd, { bias: -0.1 });
    const board = (y0, x0, x1, dir) => { for (let y = y0; y < y0 + 11; y++) for (let x = x0; x < x1; x++) pb.set(x, y, pick(Wd, (y === y0 ? 0.85 : 0.6) - (y === y0 + 10 ? 0.3 : 0) + (vnoise(x / 3, y, 6) - 0.5) * 0.25));
      for (let k = 0; k < 6; k++) for (let y = y0 + k; y < y0 + 11 - k; y++) pb.set(dir > 0 ? x1 + k : x0 - 1 - k, y, pick(Wd, 0.5));
      pb.rect(x0 + 4, y0 + 4, x1 - x0 - 8, 1, Wd[1]); pb.rect(x0 + 4, y0 + 7, (x1 - x0) / 2, 1, Wd[1]); };
    board(5, 3, 30, 1); board(21, 10, 37, -1); return outline(pb, 20, 49); },
  tent(v) { const pb = new PB(78, 72), A = hex(v < 0.5 ? "#c8402e" : "#2f6aa8"), CR = hex("#efe2c4"), Wd = PAL.wood;
    for (const x0 of [4, 70]) cylinder(pb, x0, 16, 4, 54, Wd, { bias: -0.05 });
    for (let y = 44; y < 66; y++) for (let x = 6; x < 72; x++) pb.set(x, y, pick(Wd, (y < 47 ? 0.8 : 0.42) - ((x - 6) % 16 === 0 ? 0.2 : 0) + (hash(x >> 2, y, 7) - 0.5) * 0.1 - (y > 62 ? 0.15 : 0)));
    const prod = [[200, 40, 36], [240, 150, 40], [110, 170, 60], [214, 170, 100], [200, 40, 36], [240, 150, 40]];
    for (let i = 0; i < 13; i++) { const c = prod[i % 6]; blob(pb, 11 + i * 4.8, 41 - (i % 2) * 2, 3.4, 3, ramp(c, 6, -0.6, 0.5), { seed: i }); }
    for (let y = 2; y < 30; y++) { const ins = Math.max(0, 8 - y * 1.1); for (let x = Math.round(ins); x < 78 - Math.round(ins); x++) { const stripe = Math.floor(x / 8) % 2 ? CR : A;
      let l = 0.62 - (y - 2) * 0.008 + (y < 5 ? 0.15 : 0); if (x % 8 === 0) l -= 0.1; pb.set(x, y, pick(ramp(stripe, 7, -0.7, 0.45), l)); } }
    for (let x = 0; x < 78; x++) { const k = x % 8, dip = 3 - Math.abs(k - 3.5) * 0.7; for (let y = 30; y < 30 + dip; y++) pb.set(x, y, pick(ramp(Math.floor(x / 8) % 2 ? CR : A, 7, -0.7, 0.45), 0.4)); }
    for (let y = 33; y < 44; y++) for (let x = 6; x < 72; x++) { const c = pb.get(x, y); if (c) pb.shade(x, y, -0.3 + (y - 33) * 0.02); }
    return outline(pb, 39, 69); },
};
// ---------- บ้าน (โครงไม้ผนังปูน หลังคาไม้มุงเกล็ด ฐานหิน) ----------
export const HOUSE = { W: 176, H: 186, ax: 8, ay: 180, emblem: [88, 54] };
export function house(p) {
  const { W, H } = HOUSE, pb = new PB(W, H), R = ramp(hex(p.roof), 9, -0.85, 0.5), Wd = PAL.wood, Pl = PAL.plaster, St = PAL.stone;
  const wx0 = 10, wx1 = 166, eave = 98, ridge = 16, base = 160;
  // ผนัง
  for (let y = eave; y < base; y++) for (let x = wx0; x < wx1; x++) {
    let c;
    if (p.thai) { const row = Math.floor((y - eave) / 7); c = pick(Wd, 0.55 + ((y - eave) % 7 === 6 ? -0.25 : 0) + (vnoise(x / 9, row * 3, 4) - 0.5) * 0.3 + (1 - x / W) * 0.1); }
    else c = pick(Pl, 0.68 + (fbm(x / 14, y / 14, 3) - 0.5) * 0.35 - (y > 146 ? (y - 146) * 0.02 : 0) + (1 - x / W) * 0.12 + (hash(x, y, 4) - 0.5) * 0.05);
    pb.set(x, y, c);
  }
  if (!p.thai) { // โครงไม้
    const beam = (x0, y0, w, h) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) pb.set(x, y, pick(Wd, 0.3 + (x === x0 ? 0.2 : 0) + (y === y0 ? 0.15 : 0) + (vnoise(x / 2, y / 6, 8) - 0.5) * 0.25)); };
    for (const x of [wx0, 54, 118, wx1 - 6]) beam(x, eave, 6, base - eave);
    beam(wx0, 128, wx1 - wx0, 5); beam(wx0, base - 4, wx1 - wx0, 4);
    for (const [x0, x1] of [[16, 54], [124, 160]]) for (let i = 0; i < 26; i++) { const t = i / 25, x = x0 + (x1 - x0) * t, y = base - 4 - t * 23; for (let k = 0; k < 4; k++) pb.set(x + k, y, pick(Wd, 0.36 + (k === 0 ? 0.15 : 0))); }
  }
  // หน้าต่างโค้ง + บานเกล็ด + กระบะดอกไม้
  const win = (x0) => { const y0 = 104, w = 26, h = 24, sh = hex(p.roof);
    for (let y = y0 - 3; y < y0 + h + 2; y++) for (let x = x0 - 3; x < x0 + w + 3; x++) { const arch = y < y0 + 8 ? Math.hypot(x + 0.5 - (x0 + w / 2), (y0 + 8) - y) > w / 2 + 3 : false; if (!arch) pb.set(x, y, pick(Wd, 0.25 + (x < x0 ? 0.15 : 0))); }
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { if (y < y0 + 8 && Math.hypot(x + 0.5 - (x0 + w / 2), (y0 + 8) - y) > w / 2) continue;
      let c = mix([24, 40, 56], [70, 96, 110], (y - y0) / h); if (Math.abs((x - x0) - (y - y0) * 0.8 - 4) < 2.5) c = tone(c, 0.45); if (x === x0 + 12 || y === y0 + 13) c = Wd[2]; pb.set(x, y, c); }
    for (const sx of [x0 - 12, x0 + w + 3]) for (let y = y0 - 2; y < y0 + h + 1; y++) for (let x = sx; x < sx + 9; x++) pb.set(x, y, pick(ramp(tone(sh, -0.2), 7, -0.7, 0.4), 0.5 + ((y - y0) % 4 === 0 ? -0.25 : 0) + (x === sx ? 0.15 : 0)));
    for (let y = y0 + h + 2; y < y0 + h + 8; y++) for (let x = x0 - 4; x < x0 + w + 4; x++) pb.set(x, y, pick(Wd, y === y0 + h + 2 ? 0.75 : 0.42));
    const fl = [[220, 50, 60], [240, 140, 160], [250, 240, 230], [236, 190, 60]];
    for (let i = 0; i < 10; i++) { const fx = x0 - 3 + i * 3.2, fy = y0 + h - 3 - (i % 2) * 2; blob(pb, fx + 1, fy + 3, 2.5, 2, PAL.leafB, { seed: i, bias: 0.15 }); bloom(pb, Math.round(fx), Math.round(fy), fl[(i + x0) % 4]); }
  };
  win(26); win(124);
  // ประตูโค้ง
  { const x0 = 74, w = 28, y0 = 110;
    for (let y = y0 - 3; y < base + 1; y++) for (let x = x0 - 3; x < x0 + w + 3; x++) { if (y < y0 + 14 && Math.hypot(x + 0.5 - (x0 + w / 2), y0 + 14 - y) > w / 2 + 3) continue; pb.set(x, y, pick(St, 0.55 + (x < x0 ? 0.15 : 0) + (hash(x >> 2, y >> 2, 9) - 0.5) * 0.2)); }
    for (let y = y0; y < base; y++) for (let x = x0; x < x0 + w; x++) { if (y < y0 + 14 && Math.hypot(x + 0.5 - (x0 + w / 2), y0 + 14 - y) > w / 2) continue;
      const seam = (x - x0) % 7 === 0; pb.set(x, y, pick(Wd, 0.5 - (seam ? 0.25 : 0) + (x - x0 < 4 ? 0.1 : 0) + (vnoise(x / 2, y / 8, 10) - 0.5) * 0.25)); }
    for (const hy of [y0 + 14, base - 12]) pb.rect(x0 + 2, hy, 14, 2, PAL.iron[3]);
    pb.rect(x0 + w - 7, 136, 3, 3, [220, 180, 80]); }
  // ฐานหิน
  for (let y = base; y < 180; y++) { const row = Math.floor((y - base) / 7), off = (row % 2) * 7; for (let x = wx0 - 2; x < wx1 + 2; x++) {
    const sx = Math.floor((x + off) / 14), lx = (x + off) % 14, ly = (y - base) % 7, h = hash(sx, row, 11);
    const c = lx === 0 || ly === 6 ? St[1] : pick(St, 0.5 + (h - 0.5) * 0.35 + (ly < 2 ? 0.2 : 0) - (lx > 11 ? 0.18 : 0) + (1 - x / W) * 0.1);
    pb.set(x, y, mix(c, [140, 110, 80], 0.15)); } }
  for (let y = base; y < 166; y++) for (let x = 70; x < 106; x++) pb.set(x, y, pick(St, y === base ? 0.85 : 0.65)); // ขั้นบันได
  // เงาใต้ชายคา
  for (let y = eave; y < eave + 10; y++) for (let x = wx0; x < wx1; x++) pb.shade(x, y, -0.5 + (y - eave) * 0.05);
  // หลังคา
  for (let y = ridge; y < eave + 4; y++) { const t = (y - ridge) / (eave - ridge), xl = 30 - t * 28, xr = W - 30 + t * 28, row = Math.floor((y - ridge) / 8), ly = (y - ridge) % 8;
    for (let x = Math.floor(xl); x < xr; x++) {
      const off = (row % 2) * 6, sx = Math.floor((x + off) / 12), lx = (x + off) % 12, h = hash(sx, row, p.x * 7 + 3);
      let l = 0.6 + (h - 0.5) * 0.22 - (ly < 2 ? 0.32 : 0) + (ly === 7 ? 0.1 : 0) - (lx === 0 ? 0.2 : 0) - t * 0.08;
      if (x < xl + 5) l += 0.12; if (x > xr - 6) l -= 0.25;
      if (y >= eave) l = 0.1;
      if (hash(sx, row, 77) < 0.035 && !p.thai && ly > 1) { pb.set(x, y, mix(pick(R, l), [70, 92, 40], 0.45)); continue; } // ตะไคร่
      pb.set(x, y, pick(R, l)); } }
  for (let x = 30; x < W - 30; x++) for (let y = ridge - 5; y < ridge + 1; y++) pb.set(x, y, pick(R, y === ridge - 5 ? 0.7 : 0.25 + (x % 10 === 0 ? -0.15 : 0)));
  if (p.thai) { // ป้านลมทองและช่อฟ้า
    const gold = ramp([226, 176, 50], 6, -0.6, 0.5);
    for (let y = ridge - 4; y < eave + 2; y++) { const t = (y - ridge) / (eave - ridge), xl = 30 - t * 28, xr = W - 30 + t * 28; for (let k = 0; k < 3; k++) { pb.set(xl + k, y, gold[3 + (k === 0 ? 1 : 0)]); pb.set(xr - 1 - k, y, gold[2]); } }
    for (const [sx, d] of [[30, -1], [W - 31, 1]]) for (let i = 0; i < 14; i++) { const a = i / 13, x = sx + d * Math.sin(a * 2.2) * 8, y = ridge - 4 - a * 14 + Math.max(0, a - 0.7) * 20; pb.rect(Math.round(x), Math.round(y), 3, 2, gold[i > 10 ? 5 : 3]); }
  }
  if (!p.shop) { // ปล่องไฟหิน
    for (let y = 2; y < 46; y++) for (let x = 128; x < 146; x++) { const row = Math.floor(y / 6), lx = (x + (row % 2) * 5) % 10; pb.set(x, y, lx === 0 || y % 6 === 5 ? St[1] : pick(St, 0.55 + (x < 132 ? 0.15 : x > 142 ? -0.2 : 0) + (hash(x >> 2, row, 12) - 0.5) * 0.2)); }
    pb.rect(126, 0, 22, 4, St[2]); pb.rect(126, 0, 22, 1, St[5]);
  }
  if (p.shop) { // กันสาดลายทางหน้าร้าน
    const A = hex(p.roof), CR = hex("#efe2c4");
    for (let y = eave + 2; y < eave + 16; y++) for (let x = wx0 - 6; x < wx1 + 6; x++) { const s = Math.floor((x - wx0) / 10) % 2 ? CR : A; pb.set(x, y, pick(ramp(s, 7, -0.7, 0.45), 0.62 - (y - eave) * 0.015)); }
    for (let x = wx0 - 6; x < wx1 + 6; x++) { const k = (x - wx0 + 60) % 10, dip = 4 - Math.abs(k - 4.5) * 0.8, s = Math.floor((x - wx0) / 10) % 2 ? CR : A; for (let y = eave + 16; y < eave + 16 + dip; y++) pb.set(x, y, pick(ramp(s, 7, -0.7, 0.45), 0.4)); }
  }
  // ป้ายวงกลมบนหลังคา (ไอคอนวิชาวาดทับด้วยตัวอักษรความละเอียดสูง)
  { const [cx, cy] = HOUSE.emblem; for (let y = cy - 19; y <= cy + 19; y++) for (let x = cx - 19; x <= cx + 19; x++) { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
    if (d > 18.5) continue; const nx = (x - cx) / 18, ny = (y - cy) / 18; pb.set(x, y, d > 16.5 ? pick(Wd, 0.2) : d > 14 ? pick(ramp([226, 176, 70], 6, -0.6, 0.5), sphereLight(nx, ny)) : pick(Pl, 0.85 + sphereLight(nx, ny) * 0.2)); } }
  return outline(pb, HOUSE.ax, HOUSE.ay, -0.78);
}
// ---------- ป้ายพวงมาลัยเรือ (ท่าเรือ) ----------
export function dockSign() {
  const pb = new PB(60, 82), Wd = PAL.wood; cylinder(pb, 27, 44, 7, 36, Wd);
  blob(pb, 30, 28, 26, 26, ramp([46, 90, 50], 7, -0.7, 0.4), { bias: 0.05 });
  for (let y = 0; y < 58; y++) for (let x = 0; x < 60; x++) { const d = Math.hypot(x + 0.5 - 30, (y + 0.5 - 28) * 1.1); if (d > 13 && d < 17) pb.set(x, y, pick(Wd, 0.55 + sphereLight((x - 30) / 18, (y - 28) / 18) * 0.4)); }
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; for (let k = 0; k < 22; k++) pb.set(30 + Math.round(Math.cos(a) * k), 28 + Math.round(Math.sin(a) * k * 0.9), pick(Wd, k > 18 ? 0.75 : 0.5)); }
  blob(pb, 30, 28, 4, 4, Wd, { bias: 0.1 });
  return outline(pb, 30, 79);
}
// ---------- เสาหินพันเถาวัลย์ + คริสตัล ----------
export function pillar(W, H, seed, big) {
  const MG = 8, cw = W + MG * 2, pb = new PB(cw, H + 2), cx = cw / 2, St = PAL.stone;
  const capH = big ? 18 : 12, baseH = big ? 16 : 10, sw = W - (big ? 20 : 12);
  const st = (x, fx, extra = 0) => pick(St, (fx < 0.25 ? 0.78 : fx > 0.75 ? 0.32 : 0.58) + extra + (hash(x, seed, 3) - 0.5) * 0.06);
  for (let y = H - baseH; y < H; y++) for (let x = MG; x < MG + W; x++) { const r = y - (H - baseH), fx = (x - MG) / W; pb.set(x, y, st(x, fx, r < 3 ? 0.25 : r > baseH - 3 ? -0.2 : (hash(x >> 3, r >> 2, seed) - 0.5) * 0.15)); }
  for (let y = capH; y < H - baseH; y++) for (let x = cx - sw / 2; x < cx + sw / 2; x++) { const r = y - capH, fx = (x - (cx - sw / 2)) / sw, row = Math.floor(r / 14);
    const joint = r % 14 === 13 || ((x - (cx - sw / 2) + (row % 2) * 8) % 16 === 0 && big);
    pb.set(x, y, joint ? St[1] : st(x, fx, (vnoise(x / 3, y / 3, seed) - 0.5) * 0.2)); }
  for (let y = capH; y < capH + 4; y++) for (let x = cx - sw / 2; x < cx + sw / 2; x++) pb.shade(x, y, -0.45);
  for (let y = 3; y < capH; y++) for (let x = MG + 2; x < MG + W - 2; x++) { const r = y - 3, fx = (x - MG) / W; pb.set(x, y, st(x, fx, r < 3 ? 0.3 : y === capH - 1 ? -0.3 : 0)); }
  const pw = big ? 20 : 12; pb.rect(cx - pw / 2, 0, pw, 3, St[6]); pb.rect(cx - pw / 2, 2, pw, 1, St[3]);
  for (let i = 0; i < 6; i++) { const x = cx - sw / 2 + 3 + Math.floor(hash(i, seed, 71) * (sw - 6)), y = capH + 8 + Math.floor(hash(seed, i, 72) * (H - baseH - capH - 20)); for (let k = 0; k < 7; k++) pb.set(x + (k >> 1) * (i % 2 ? 1 : -1), y + k, St[1]); }
  for (let x = MG + 2; x < MG + W - 2; x++) { if (hash(x, seed, 73) < 0.4) pb.rect(x, 3, 1, 1 + (hash(x, 1, 74) < 0.4 ? 2 : 0), PAL.leafB[5]); if (hash(x, seed, 75) < 0.35) pb.set(x, H - baseH, PAL.leafB[4]); }
  for (let x = MG + 4; x < MG + W - 4; x += 3) if (hash(x, seed, 76) < 0.45) { const Ln = 3 + Math.floor(hash(x, 2, 77) * (big ? 14 : 8)); for (let k = 0; k < Ln; k++) pb.set(x, capH + k, PAL.leafB[3]); bloom(pb, x - 1, capH + Ln - 1, [120, 190, 70]); }
  for (let sI = 0; sI < (big ? 2 : 1); sI++) for (let y = capH - 2; y < H - baseH + 3; y++) { // เถาวัลย์เกลียว
    const a = y * (big ? 0.1 : 0.15) + seed * 1.7 + sI * Math.PI, sn = Math.sin(a), front = Math.cos(a) > -0.2, vx = Math.round(cx + sn * (sw / 2 + 2) - 2);
    if (front) for (let k = 0; k < 4; k++) pb.set(vx + k, y, PAL.leafB[k === 0 ? 6 : k === 3 ? 2 : 4]); else if (Math.abs(sn) > 0.8) pb.rect(vx + (sn > 0 ? 2 : 0), y, 2, 1, PAL.leafB[1]);
    if (front && (y + sI * 5) % 7 === 0) { const lx = vx + (sn > 0 ? 4 : -6); blob(pb, lx + 3, y, 3.5, 2.5, PAL.leafB, { seed: y, bias: 0.15 }); }
  }
  return outline(pb, cx, H - 1, -0.7);
}
export function crystal(s) {
  const h = Math.round(s * 1.8), pb = new PB(s * 2 + 2, h * 2 + 2), G = ramp([90, 220, 60], 8, -0.7, 0.75);
  for (let dy = -h; dy <= h; dy++) { const hw = s * (1 - Math.abs(dy) / h); for (let dx = -Math.floor(hw); dx <= hw; dx++) {
    const upper = dy < h * 0.2; let t = upper ? (dx < -hw * 0.3 ? 0.95 : dx < hw * 0.15 ? 0.72 : 0.5) : (dx < 0 ? 0.42 : 0.22);
    if (Math.abs(dx) < 1 && upper) t = 0.85; if (Math.abs(dy - h * 0.2) < 0.6) t = 1;
    pb.set(s + 1 + dx, h + 1 + dy, pick(G, t)); } }
  pb.set(s - Math.max(1, s >> 1) + 1, h - (h >> 1), [255, 255, 255]); pb.set(s - Math.max(1, s >> 1) + 1, h - (h >> 1) + 1, [255, 255, 255]);
  return outline(pb, s + 1, h + 1, -0.75);
}
