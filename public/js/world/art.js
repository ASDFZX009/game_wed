// ชุดเครื่องมือวาดพิกเซลอาร์ตความละเอียดสูง (แนว HD-2D) — วาดด้วยโค้ดทั้งหมด ไม่ใช้ไฟล์ภาพ
// แสงหลัก: แดดเย็นส่องมาจาก "หน้า-ซ้าย-บน" → ด้านซ้าย/ด้านหน้าของวัตถุสว่าง เงาทอดไปทางขวาบน

export const T = 32; // พิกเซลโลกต่อ 1 ช่อง

// ---------- สุ่ม/นอยส์ ----------
export function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
export function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export const fbm = (x, y, s) => vnoise(x, y, s) * 0.55 + vnoise(x * 2.03, y * 2.03, s + 7) * 0.3 + vnoise(x * 4.1, y * 4.1, s + 13) * 0.15;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// ---------- สี ----------
export const hex = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
export const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const css = (c, a = 1) => (a >= 1 ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`);
// ปรับแสง: ค่าลบ = มืดลงและอมฟ้าม่วง (เงา) · ค่าบวก = สว่างขึ้นและอมเหลืองอุ่น (โดนแดด)
export function tone(c, k) {
  if (k < 0) { const t = Math.min(1, -k); return [c[0] * (1 - t * 0.78) + 18 * t, c[1] * (1 - t * 0.74) + 16 * t, c[2] * (1 - t * 0.6) + 40 * t]; }
  const t = Math.min(1, k); return [c[0] + (255 - c[0]) * t * 0.85, c[1] + (244 - c[1]) * t * 0.8, c[2] + (190 - c[2]) * t * 0.55];
}
export const ramp = (base, n = 7, lo = -0.75, hi = 0.6) => Array.from({ length: n }, (_, i) => tone(base, lo + ((hi - lo) * i) / (n - 1)));
export const pick = (r, t) => r[clamp(Math.round(t * (r.length - 1)), 0, r.length - 1)];
// ทิศแสง (พิกัดภาพ: x ขวา, y ลง, z เข้าหาผู้ชม)
export const L = [-0.55, -0.3, 0.78];
export const sphereLight = (nx, ny) => { const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)); return clamp(L[0] * nx + L[1] * ny + L[2] * nz, 0, 1); };
export const cylLight = (u) => clamp(L[0] * u + L[2] * Math.sqrt(Math.max(0, 1 - u * u)) + 0.1, 0, 1);

export const canvas = (w, h) => { const c = document.createElement("canvas"); c.width = Math.max(1, w); c.height = Math.max(1, h); const x = c.getContext("2d", { willReadFrequently: true }); x.imageSmoothingEnabled = false; return [c, x]; };

// ---------- บัฟเฟอร์พิกเซล ----------
export class PB {
  constructor(w, h) { this.w = w | 0; this.h = h | 0; this.d = new Uint8ClampedArray(this.w * this.h * 4); }
  set(x, y, c, a = 255) {
    x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const d = this.d, i = (y * this.w + x) * 4;
    if (a >= 255 || d[i + 3] === 0) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = a >= 255 ? 255 : a; return; }
    const s = a / 255; d[i] = d[i] * (1 - s) + c[0] * s; d[i + 1] = d[i + 1] * (1 - s) + c[1] * s; d[i + 2] = d[i + 2] * (1 - s) + c[2] * s; d[i + 3] = Math.max(d[i + 3], a);
  }
  get(x, y) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null; const i = (y * this.w + x) * 4; return this.d[i + 3] ? [this.d[i], this.d[i + 1], this.d[i + 2]] : null; }
  alpha(x, y) { x |= 0; y |= 0; return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.d[(y * this.w + x) * 4 + 3]; }
  rect(x, y, w, h, c, a = 255) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c, a); }
  shade(x, y, k) { const c = this.get(x, y); if (c) { const i = ((y | 0) * this.w + (x | 0)) * 4, n = tone(c, k); this.d[i] = n[0]; this.d[i + 1] = n[1]; this.d[i + 2] = n[2]; } }
  canvas() { const [c, x] = canvas(this.w, this.h); x.putImageData(new ImageData(this.d, this.w, this.h), 0, 0); return c; }
}
// เส้นขอบแบบ "sel-out": ใช้สีเข้มของพิกเซลข้าง ๆ แทนสีดำ ให้ดูนุ่มแบบเกม HD-2D
export function outline(pb, ax, ay, k = -0.82) {
  const o = new PB(pb.w + 2, pb.h + 2);
  for (let y = 0; y < pb.h; y++) for (let x = 0; x < pb.w; x++) { const i = (y * pb.w + x) * 4, a = pb.d[i + 3]; if (!a) continue; const j = ((y + 1) * o.w + x + 1) * 4; o.d[j] = pb.d[i]; o.d[j + 1] = pb.d[i + 1]; o.d[j + 2] = pb.d[i + 2]; o.d[j + 3] = a; }
  const src = (x, y) => (pb.alpha(x, y) >= 170 ? pb.get(x, y) : null);
  for (let y = -1; y <= pb.h; y++) for (let x = -1; x <= pb.w; x++) {
    if (pb.alpha(x, y) >= 170) continue;
    const n = src(x, y + 1) || src(x + 1, y) || src(x - 1, y) || src(x, y - 1);
    if (n) o.set(x + 1, y + 1, tone(n, k));
  }
  return { c: o.canvas(), ax: ax + 1, ay: ay + 1 };
}
export const plain = (pb, ax, ay) => ({ c: pb.canvas(), ax, ay });

// ---------- รูปทรงพื้นฐานพร้อมแสงเงา ----------
export function blob(pb, cx, cy, rx, ry, R, { jag = 0, seed = 0, rim = 0.86, bias = 0 } = {}) {
  for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++) for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) {
    const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry, d = Math.sqrt(nx * nx + ny * ny) + (jag ? (hash(x, y, seed) - 0.5) * jag : 0);
    if (d > 1) continue;
    let t = sphereLight(nx * 0.95, ny * 0.95) + bias + (hash(x, y, seed + 3) - 0.5) * 0.08;
    if (d > rim) t -= 0.25;
    pb.set(x, y, pick(R, t));
  }
}
export function cylinder(pb, x0, y0, w, h, R, { stripe = 0, seed = 0, bias = 0 } = {}) {
  for (let x = 0; x < w; x++) { const u = (x + 0.5) / w * 2 - 1, l = cylLight(u) + bias;
    for (let y = 0; y < h; y++) { let t = l + (hash(x0 + x, (y0 + y) >> 2, seed) - 0.5) * 0.06; if (stripe && x % stripe === 0) t -= 0.18; pb.set(x0 + x, y0 + y, pick(R, t)); } }
}
// ดอกไม้เล็ก 3×3 มีไฮไลต์
export function bloom(pb, x, y, c) { const R = ramp(c, 5, -0.6, 0.5); pb.set(x + 1, y, R[3]); pb.set(x, y + 1, R[2]); pb.set(x + 1, y + 1, R[4]); pb.set(x + 2, y + 1, R[1]); pb.set(x + 1, y + 2, R[1]); pb.set(x, y, R[2], 140); pb.set(x + 2, y, R[2], 140); }

// ---------- จานสี ----------
export const PAL = {
  leaf: ["#141f0e", "#1f3014", "#2e4419", "#3f5a1f", "#567426", "#728f31", "#94a83f", "#bcc35a", "#dcd77c"].map(hex),
  leafB: ["#101c10", "#1a2c16", "#26401d", "#355724", "#486e2b", "#5f8835", "#7ea241", "#a4bd55", "#cad770"].map(hex),
  autumn: ["#2a1208", "#4a1e0c", "#6e2e10", "#954214", "#ba5c1a", "#d47c24", "#e69e38", "#f2c058", "#fadc84"].map(hex),
  pine: ["#0b1712", "#11231a", "#183222", "#20412b", "#2c5434", "#3c6a40", "#55824c", "#78a05e", "#a4c27a"].map(hex),
  bark: ["#1e130c", "#2e1d11", "#432a17", "#5a3a20", "#734c2b", "#8e6238", "#ab7c4a", "#c89a64"].map(hex),
  rock: ["#2a1a12", "#41291c", "#5a3b28", "#744e35", "#8e6444", "#a87b56", "#c19670", "#d8b48e"].map(hex),
  stone: ["#2a2826", "#3e3b37", "#55514b", "#6e6a62", "#89847a", "#a49f94", "#bdb8ab", "#d6d1c4"].map(hex),
  wood: ["#24150b", "#38220f", "#4f3116", "#68421e", "#825629", "#9c6b36", "#b88748", "#d2a464"].map(hex),
  plaster: ["#5a4a36", "#7a6648", "#9a845e", "#b8a074", "#cdb88a", "#ddc99c", "#e9d9b0", "#f4e8c8"].map(hex),
  iron: ["#141418", "#22222a", "#33333c", "#474752", "#5e5e6a", "#7c7c88"].map(hex),
};
