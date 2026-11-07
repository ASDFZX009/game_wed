// 🎨 หมู่บ้านโฉมใหม่ 64 พิกเซลต่อช่อง: วาดใหม่ทุกชิ้นด้วยรายละเอียด 2 เท่า โดยคงหน้าตาเดิมของหมู่บ้าน
import { PB, ramp, pick, hex, mix, mul, tone, hash, vnoise, fbm, clamp, sphereLight, cylLight, blob, outline, cylinder, PAL } from "../world/art.js";
import { grassRGB } from "./ground.js";

export const T = 64;
export const R = (h, n = 8, lo = -0.8, hi = 0.45) => ramp(typeof h === "string" ? hex(h) : h, n, lo, hi);
const inPoly = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
export function poly(pb, P, f) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of P) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  for (let y = Math.floor(y0); y <= y1; y++) for (let x = Math.floor(x0); x <= x1; x++) if (inPoly(x + 0.5, y + 0.5, P)) { const v = f(x, y); if (v) pb.set(x, y, v); } }
const line = (pb, x0, y0, x1, y1, c, w = 1) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)) + 1; for (let i = 0; i <= n; i++) { const t = i / n; pb.rect(Math.round(x0 + (x1 - x0) * t - w / 2), Math.round(y0 + (y1 - y0) * t - w / 2), w, w, typeof c === "function" ? c(t) : c); } };
// ดอกไม้เล็ก 5×5 (กลีบ 4 + เกสร) สำหรับงาน 64px
export function flower(pb, x, y, c, big = false) { const F = R(c, 6, -0.6, 0.5);
  pb.set(x + 1, y, F[4]); pb.set(x, y + 1, F[3]); pb.set(x + 2, y + 1, F[2]); pb.set(x + 1, y + 2, F[1]); pb.set(x + 1, y + 1, [255, 236, 140]);
  if (big) { pb.set(x + 1, y - 1, F[5]); pb.set(x - 1, y + 1, F[3]); pb.set(x + 3, y + 1, F[2]); pb.set(x + 1, y + 3, F[1]); } }
const Wd = PAL.wood || R("#8a5a32", 8, -0.8, 0.45), St = PAL.stone, Lf = PAL.leafB, Ir = R("#3e3e4a", 7, -0.6, 0.45), Pl = R("#efe2c6", 8, -0.7, 0.3);
// ขยาย 2 เท่าแบบ Scale2x (ขอบเฉียงเนียนขึ้น ยังคงความเป็นพิกเซล) — ใช้กับป้ายวิชาที่มีลายละเอียด
export function scale2x(src) {
  const w = src.width, h = src.height, s = src.getContext("2d").getImageData(0, 0, w, h).data, c = document.createElement("canvas"); c.width = w * 2; c.height = h * 2;
  const g = c.getContext("2d"), o = g.createImageData(w * 2, h * 2), d = o.data, P = (x, y) => { x = clamp(x, 0, w - 1); y = clamp(y, 0, h - 1); return (y * w + x) * 4; };
  const eq = (a, b) => s[a] === s[b] && s[a + 1] === s[b + 1] && s[a + 2] === s[b + 2] && s[a + 3] === s[b + 3];
  const put = (X, Y, a) => { const k = (Y * w * 2 + X) * 4; d[k] = s[a]; d[k + 1] = s[a + 1]; d[k + 2] = s[a + 2]; d[k + 3] = s[a + 3]; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const E = P(x, y), B = P(x, y - 1), D = P(x - 1, y), F = P(x + 1, y), H = P(x, y + 1);
    let e0 = E, e1 = E, e2 = E, e3 = E; if (!eq(B, H) && !eq(D, F)) { if (eq(D, B)) e0 = D; if (eq(B, F)) e1 = F; if (eq(D, H)) e2 = D; if (eq(H, F)) e3 = F; }
    put(x * 2, y * 2, e0); put(x * 2 + 1, y * 2, e1); put(x * 2, y * 2 + 1, e2); put(x * 2 + 1, y * 2 + 1, e3); }
  g.putImageData(o, 0, 0); return c;
}

// ---------- 🏠 บ้านวิชา (โครงไม้ผนังปูน หลังคาเกล็ด ฐานหิน) ----------
export const HOUSE = { W: 352, H: 372, ax: 16, ay: 360, emblem: [176, 108] };
export function house(p) {
  const { W, H } = HOUSE, pb = new PB(W, H), Rf = R(p.roof, 10, -0.88, 0.5), wx0 = 20, wx1 = 332, eave = 196, ridge = 32, base = 320;
  // ผนังปูน (หรือฝาไม้สำหรับบ้านไทย)
  for (let y = eave; y < base; y++) for (let x = wx0; x < wx1; x++) {
    let c;
    if (p.thai) { const row = Math.floor((y - eave) / 13), ly = (y - eave) % 13; c = pick(Wd, 0.55 + (ly === 12 ? -0.32 : ly === 0 ? 0.12 : 0) + (vnoise(x / 18, row * 3, 4) - 0.5) * 0.3 + (Math.sin(x * 0.4 + row) > 0.92 ? -0.08 : 0) + (1 - x / W) * 0.12); }
    else c = pick(Pl, 0.7 + (fbm(x / 26, y / 26, 3) - 0.5) * 0.3 + (vnoise(x / 5, y / 5, 9) - 0.5) * 0.08 - (y > 292 ? (y - 292) * 0.011 : 0) + (1 - x / W) * 0.12 + (hash(x, y, 4) - 0.5) * 0.04);
    pb.set(x, y, c);
  }
  if (!p.thai) { // โครงไม้ลายเสี้ยน
    const beam = (x0, y0, w, h) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) pb.set(x, y, pick(Wd, 0.3 + (x === x0 || x === x0 + 1 ? 0.22 : 0) + (y === y0 ? 0.15 : 0) - (x >= x0 + w - 2 ? 0.15 : 0) + (vnoise(x / 2.2, y / 14, 8) - 0.5) * 0.3)); };
    for (const x of [wx0, 108, 236, wx1 - 12]) beam(x, eave, 12, base - eave);
    beam(wx0, 254, wx1 - wx0, 10); beam(wx0, base - 8, wx1 - wx0, 8);
    for (const [x0, x1] of [[32, 108], [248, 320]]) for (let i = 0; i < 52; i++) { const t = i / 51, x = x0 + (x1 - x0) * t, y = base - 8 - t * 46; for (let k = 0; k < 8; k++) pb.set(x + k, y, pick(Wd, 0.34 + (k < 2 ? 0.16 : k > 6 ? -0.12 : 0))); }
    for (const [x, y] of [[26, 262], [114, 262], [242, 262], [326, 262], [26, 204], [326, 204]]) { pb.rect(x, y, 3, 3, Ir[2]); pb.set(x, y, Ir[5]); }
  }
  // หน้าต่างโค้ง กระจกสะท้อนฟ้า บานเกล็ด และกระบะดอกไม้
  const win = (x0) => { const y0 = 208, w = 52, h = 48, sh = R(tone(hex(p.roof), -0.15), 8, -0.75, 0.4);
    for (let y = y0 - 6; y < y0 + h + 4; y++) for (let x = x0 - 6; x < x0 + w + 6; x++) { const arch = y < y0 + 16 ? Math.hypot(x + 0.5 - (x0 + w / 2), (y0 + 16) - y) > w / 2 + 6 : false; if (!arch) pb.set(x, y, pick(Wd, 0.22 + (x < x0 - 3 ? 0.18 : 0) + (y < y0 ? 0.08 : 0))); }
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { if (y < y0 + 16 && Math.hypot(x + 0.5 - (x0 + w / 2), (y0 + 16) - y) > w / 2) continue;
      let c = mix([28, 46, 66], [84, 116, 132], (y - y0) / h); const s = (x - x0) - (y - y0) * 0.8; if (s > 4 && s < 11) c = tone(c, 0.5); if (s > 14 && s < 17) c = tone(c, 0.3);
      if (Math.abs(x - x0 - w / 2) < 1.5 || Math.abs(y - y0 - 26) < 1.5) c = Wd[2]; pb.set(x, y, c); }
    for (const sx of [x0 - 24, x0 + w + 6]) for (let y = y0 - 4; y < y0 + h + 2; y++) for (let x = sx; x < sx + 18; x++) pb.set(x, y, pick(sh, 0.55 + ((y - y0) % 7 === 0 ? -0.3 : (y - y0) % 7 === 1 ? 0.12 : 0) + (x === sx || x === sx + 1 ? 0.15 : x > sx + 15 ? -0.15 : 0)));
    for (let y = y0 + h + 4; y < y0 + h + 16; y++) for (let x = x0 - 8; x < x0 + w + 8; x++) pb.set(x, y, pick(Wd, y < y0 + h + 6 ? 0.78 : 0.42 - (y - y0 - h) * 0.01 + ((x - x0) % 14 === 0 ? -0.12 : 0)));
    const fl = ["#e83a4a", "#f090b0", "#fff4ea", "#f4c040", "#c070e0"];
    for (let i = 0; i < 16; i++) { const fx = x0 - 6 + i * 4, fy = y0 + h - 2 - (i % 3) * 3; blob(pb, fx + 2, fy + 6, 4.5, 3.5, Lf, { seed: i + x0, bias: 0.12 }); }
    for (let i = 0; i < 14; i++) flower(pb, x0 - 5 + i * 4.6 | 0, y0 + h - 4 - ((i * 7) % 4), fl[(i + x0) % 5], i % 3 === 0);
  };
  win(52); win(248);
  // ประตูโค้งไม้ บานพับเหล็ก มือจับทองเหลือง
  { const x0 = 148, w = 56, y0 = 220;
    for (let y = y0 - 6; y < base + 2; y++) for (let x = x0 - 6; x < x0 + w + 6; x++) { if (y < y0 + 28 && Math.hypot(x + 0.5 - (x0 + w / 2), y0 + 28 - y) > w / 2 + 6) continue;
      const a = Math.atan2(y0 + 28 - y, x + 0.5 - x0 - w / 2), blk = y < y0 + 28 ? Math.floor(a * 4) : Math.floor((y - y0) / 14); pb.set(x, y, pick(St, 0.52 + (x < x0 ? 0.16 : 0) + (hash(blk, x < x0 + w / 2 ? 1 : 2, 9) - 0.5) * 0.2 + ((y - y0) % 14 === 0 && y > y0 + 28 ? -0.3 : 0))); }
    for (let y = y0; y < base; y++) for (let x = x0; x < x0 + w; x++) { if (y < y0 + 28 && Math.hypot(x + 0.5 - (x0 + w / 2), y0 + 28 - y) > w / 2) continue;
      const seam = (x - x0) % 14 === 0; pb.set(x, y, pick(Wd, 0.48 - (seam ? 0.28 : 0) + ((x - x0) % 14 === 1 ? 0.12 : 0) + (x - x0 < 6 ? 0.1 : 0) + (vnoise(x / 2, y / 16, 10) - 0.5) * 0.28)); }
    for (const hy of [y0 + 30, base - 24]) { pb.rect(x0 + 3, hy, 30, 4, Ir[2]); pb.rect(x0 + 3, hy, 30, 1, Ir[4]); pb.rect(x0 + 30, hy - 1, 4, 6, Ir[1]); }
    pb.rect(x0 + w - 13, 268, 6, 6, [214, 170, 70]); pb.set(x0 + w - 12, 269, [255, 230, 150]); }
  // ฐานหิน + บันได
  for (let y = base; y < 360; y++) { const row = Math.floor((y - base) / 13), off = (row % 2) * 14; for (let x = wx0 - 4; x < wx1 + 4; x++) {
    const sx = Math.floor((x + off) / 28), lx = (x + off) % 28, ly = (y - base) % 13, h = hash(sx, row, 11);
    let c = lx === 0 || ly === 12 ? St[1] : pick(St, 0.5 + (h - 0.5) * 0.32 + (ly < 3 ? 0.22 : 0) - (lx > 23 ? 0.2 : 0) + (1 - x / W) * 0.1 + (vnoise(x / 4, y / 4, 13) - 0.5) * 0.12);
    if (ly > 9 && hash(sx, row, 15) < 0.3 && vnoise(x / 5, y, 16) > 0.5) c = mix(c, [74, 98, 40], 0.6);
    pb.set(x, y, mix(c, [150, 118, 86], 0.14)); } }
  for (let y = base; y < 334; y++) for (let x = 138; x < 214; x++) pb.set(x, y, pick(St, y < base + 3 ? 0.88 : 0.62 + (x < 142 ? 0.1 : 0)));
  // เงาใต้ชายคา
  for (let y = eave; y < eave + 22; y++) for (let x = wx0; x < wx1; x++) pb.shade(x, y, -0.55 + (y - eave) * 0.025);
  // หลังคากระเบื้องเกล็ดปลา (มีตะไคร่ประปราย)
  for (let y = ridge; y < eave + 8; y++) { const t = (y - ridge) / (eave - ridge), xl = 60 - t * 56, xr = W - 60 + t * 56, row = Math.floor((y - ridge) / 15), ly = (y - ridge) % 15;
    for (let x = Math.floor(xl); x < xr; x++) {
      const off = (row % 2) * 12, sx = Math.floor((x + off) / 24), lx = (x + off) % 24, h = hash(sx, row, p.x * 7 + 3), round = Math.abs(lx - 11.5) / 12;
      let l = 0.62 + (h - 0.5) * 0.2 - (ly < 3 ? 0.34 : 0) + (ly > 12 - round * round * 6 ? -0.22 : 0) + (ly === 13 ? 0.06 : 0) - (lx === 0 ? 0.22 : 0) + (lx === 1 ? 0.06 : 0) - t * 0.08 - round * 0.05;
      if (x < xl + 10) l += 0.14; if (x > xr - 12) l -= 0.28;
      if (y >= eave) l = 0.08 + (y - eave) * 0.02;
      if (hash(sx, row, 77) < 0.05 && !p.thai && ly > 3 && y < eave) { pb.set(x, y, mix(pick(Rf, l), [74, 100, 42], 0.5 + vnoise(x / 3, y / 3, 5) * 0.3)); continue; }
      pb.set(x, y, pick(Rf, l)); } }
  for (let x = 60; x < W - 60; x++) for (let y = ridge - 10; y < ridge + 2; y++) pb.set(x, y, pick(Rf, y < ridge - 8 ? 0.75 : 0.3 + (x % 20 < 2 ? -0.18 : 0) + (y < ridge - 5 ? 0.15 : 0)));
  if (p.thai) { const gold = R([226, 176, 50], 7, -0.6, 0.55);
    for (let y = ridge - 8; y < eave + 4; y++) { const t = (y - ridge) / (eave - ridge), xl = 60 - t * 56, xr = W - 60 + t * 56; for (let k = 0; k < 6; k++) { pb.set(xl + k, y, gold[k < 2 ? 5 : 3]); pb.set(xr - 1 - k, y, gold[k < 2 ? 3 : 2]); } }
    for (const [sx, d] of [[60, -1], [W - 61, 1]]) for (let i = 0; i < 28; i++) { const a = i / 27, x = sx + d * Math.sin(a * 2.2) * 16, y = ridge - 8 - a * 28 + Math.max(0, a - 0.7) * 40; pb.rect(Math.round(x), Math.round(y), 5, 4, gold[i > 21 ? 6 : 4]); } }
  if (!p.shop) { for (let y = 4; y < 92; y++) for (let x = 256; x < 292; x++) { const row = Math.floor(y / 11), lx = (x + (row % 2) * 9) % 18; pb.set(x, y, lx === 0 || y % 11 === 10 ? St[1] : pick(St, 0.55 + (x < 263 ? 0.16 : x > 285 ? -0.22 : 0) + (hash((x + (row % 2) * 9) / 18 | 0, row, 12) - 0.5) * 0.2)); }
    pb.rect(252, 0, 44, 8, St[2]); pb.rect(252, 0, 44, 2, St[6]); pb.rect(258, 8, 32, 3, St[1]); }
  if (p.shop) { const A = hex(p.roof), CR = hex("#efe2c4");
    for (let y = eave + 4; y < eave + 32; y++) for (let x = wx0 - 12; x < wx1 + 12; x++) { const s = Math.floor((x - wx0) / 20) % 2 ? CR : A; pb.set(x, y, pick(R(s, 8, -0.7, 0.45), 0.66 - (y - eave) * 0.012 + ((x - wx0) % 20 === 0 ? -0.1 : 0))); }
    for (let x = wx0 - 12; x < wx1 + 12; x++) { const k = (x - wx0 + 120) % 20, dip = 8 - Math.abs(k - 9.5) * 0.8, s = Math.floor((x - wx0) / 20) % 2 ? CR : A; for (let y = eave + 32; y < eave + 32 + dip; y++) pb.set(x, y, pick(R(s, 8, -0.7, 0.45), 0.42)); } }
  // ป้ายวงกลมบนหลังคา
  { const [cx, cy] = HOUSE.emblem; for (let y = cy - 38; y <= cy + 38; y++) for (let x = cx - 38; x <= cx + 38; x++) { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
    if (d > 37) continue; const nx = (x - cx) / 36, ny = (y - cy) / 36; pb.set(x, y, d > 33 ? pick(Wd, 0.2 + sphereLight(nx, ny) * 0.2) : d > 28 ? pick(R([226, 176, 70], 7, -0.6, 0.55), sphereLight(nx, ny)) : pick(Pl, 0.82 + sphereLight(nx, ny) * 0.2)); } }
  return outline(pb, HOUSE.ax, HOUSE.ay, -0.8);
}

// ---------- 🍎 ของประกอบฉาก ----------
export const PROP = {
  tent(v) { const pb = new PB(156, 144), A = hex(v < 0.5 ? "#c8402e" : "#2f6aa8"), CR = hex("#efe2c4");
    for (const x0 of [8, 140]) cylinder(pb, x0, 32, 8, 108, Wd, { bias: -0.05 });
    for (let y = 88; y < 132; y++) for (let x = 12; x < 144; x++) pb.set(x, y, pick(Wd, (y < 94 ? 0.82 : 0.42) - ((x - 12) % 32 === 0 ? 0.22 : 0) + ((y - 94) % 12 === 0 && y > 94 ? -0.15 : 0) + (vnoise(x / 3, y / 10, 7) - 0.5) * 0.2 - (y > 124 ? 0.18 : 0)));
    const prod = [[200, 40, 36], [240, 150, 40], [110, 170, 60], [214, 170, 100], [230, 200, 60], [150, 60, 140]];
    for (let r = 0; r < 2; r++) for (let i = 0; i < 18; i++) { const c = prod[(i + r * 3) % 6]; blob(pb, 20 + i * 6.8 + r * 3, 82 - r * 6 - (i % 2) * 2, 4.6, 4.2, ramp(c, 7, -0.6, 0.55), { seed: i + r * 30 }); }
    for (let i = 0; i < 18; i++) { const x = 21 + i * 6.8 | 0; pb.set(x, 74 - (i % 2) * 2, [255, 255, 240]); pb.set(x + 1, 71 - (i % 2) * 2, Lf[5]); }
    for (let y = 4; y < 60; y++) { const ins = Math.max(0, 16 - y * 1.1); for (let x = Math.round(ins); x < 156 - Math.round(ins); x++) { const stripe = Math.floor(x / 16) % 2 ? CR : A;
      let l = 0.64 - (y - 4) * 0.006 + (y < 10 ? 0.16 : 0); if (x % 16 === 0) l -= 0.12; if (x % 16 === 1) l += 0.05; pb.set(x, y, pick(R(stripe, 8, -0.7, 0.45), l + (vnoise(x / 6, y / 3, 3) - 0.5) * 0.06)); } }
    for (let x = 0; x < 156; x++) { const k = x % 16, dip = 6 - Math.abs(k - 7.5) * 0.7; for (let y = 60; y < 60 + dip; y++) pb.set(x, y, pick(R(Math.floor(x / 16) % 2 ? CR : A, 8, -0.7, 0.45), 0.4)); }
    for (let y = 66; y < 88; y++) for (let x = 12; x < 144; x++) { if (pb.get(x, y)) pb.shade(x, y, -0.32 + (y - 66) * 0.012); }
    return outline(pb, 78, 138); },
  lamp() { const pb = new PB(36, 132);
    cylinder(pb, 14, 36, 8, 88, Ir); for (let y = 52; y < 120; y += 22) pb.rect(13, y, 10, 3, Ir[5]);
    pb.rect(8, 118, 20, 8, Ir[2]); pb.rect(8, 118, 20, 2, Ir[5]); pb.rect(5, 124, 26, 5, Ir[1]);
    pb.rect(4, 4, 28, 7, Ir[2]); pb.rect(6, 1, 24, 3, Ir[4]); pb.rect(16, -1, 4, 3, Ir[3]);
    for (let y = 11; y < 34; y++) for (let x = 6; x < 30; x++) { const d = Math.hypot(x - 17.5, y - 21) / 14; pb.set(x, y, mix([255, 250, 214], [240, 160, 60], clamp(d, 0, 1))); }
    for (const x of [6, 17, 29]) pb.rect(x, 11, 2, 23, Ir[1]); pb.rect(6, 32, 24, 4, Ir[2]); pb.rect(9, 36, 18, 3, Ir[3]);
    return outline(pb, 18, 127); },
  barrel() { const pb = new PB(52, 68);
    for (let y = 8; y < 64; y++) { const t = (y - 8) / 56, w = 36 + Math.sin(t * Math.PI) * 10, x0 = 26 - w / 2;
      for (let x = Math.floor(x0); x < x0 + w; x++) { const u = (x + 0.5 - 26) / (w / 2); let l = cylLight(u); if ((x - Math.floor(x0)) % 7 === 0) l -= 0.16;
        const hoop = (y >= 14 && y <= 17) || (y >= 52 && y <= 55); pb.set(x, y, hoop ? pick(Ir, l + 0.1 + (y === 14 || y === 52 ? 0.2 : 0)) : pick(Wd, l * 0.9 + (vnoise(x / 2, y / 9, 4) - 0.5) * 0.18)); } }
    for (let y = 2; y < 14; y++) for (let x = 6; x < 46; x++) { const nx = (x - 25.5) / 20, ny = (y - 7.5) / 6; if (nx * nx + ny * ny > 1) continue; pb.set(x, y, nx * nx + ny * ny > 0.66 ? Wd[3] : pick(Wd, 0.74 + (x % 7 === 0 ? -0.12 : 0))); }
    return outline(pb, 26, 62); },
  crate() { const pb = new PB(60, 60);
    for (let y = 4; y < 20; y++) for (let x = 2; x < 58; x++) pb.set(x, y, pick(Wd, 0.82 + ((y - 4) % 8 === 7 ? -0.22 : 0) + (vnoise(x / 3, y / 2, 2) - 0.5) * 0.14));
    for (let y = 20; y < 56; y++) for (let x = 2; x < 58; x++) { const frame = x < 8 || x > 51 || y < 24 || y > 51, brace = Math.abs((x - 2) - (54 - (y - 20)) * 54 / 34) < 4;
      let l = frame ? 0.52 : brace ? 0.64 : 0.4 - ((y - 24) % 9 === 8 ? 0.18 : 0); l += (x < 8 ? 0.12 : 0) + (vnoise(x / 2, y / 8, 3) - 0.5) * 0.14; pb.set(x, y, pick(Wd, l)); }
    for (const [x, y] of [[4, 22], [53, 22], [4, 51], [53, 51]]) { pb.rect(x, y, 3, 3, Ir[3]); pb.set(x, y, Ir[6]); }
    return outline(pb, 30, 55); },
  pot(v) { const pb = new PB(52, 72), C = ramp([190, 96, 58], 8, -0.7, 0.5);
    for (let y = 40; y < 68; y++) { const t = (y - 40) / 28, w = 36 - t * 10, x0 = 26 - w / 2; for (let x = Math.floor(x0); x < x0 + w; x++) pb.set(x, y, pick(C, cylLight((x + 0.5 - 26) / (w / 2)) - t * 0.1 + (hash(x, y, 3) - 0.5) * 0.05)); }
    for (let x = 6; x < 46; x++) for (let y = 34; y < 42; y++) pb.set(x, y, pick(C, cylLight((x - 25.5) / 20) + (y < 36 ? 0.25 : 0)));
    for (let i = 0; i < 6; i++) blob(pb, 12 + i * 5.6, 24 - (i % 2) * 6, 10, 8, Lf, { jag: 0.4, seed: i + 5, bias: 0.1 });
    const fc = v < 0.33 ? "#e84a6a" : v < 0.66 ? "#f6c840" : "#b070e0"; for (const [x, y] of [[8, 10], [22, 4], [34, 12], [16, 18], [30, 22], [40, 18], [12, 26]]) flower(pb, x, y, fc, true);
    return outline(pb, 26, 66); },
  sign() { const pb = new PB(80, 104); cylinder(pb, 36, 20, 10, 80, Wd, { bias: -0.1 });
    const board = (y0, x0, x1, dir) => { for (let y = y0; y < y0 + 22; y++) for (let x = x0; x < x1; x++) pb.set(x, y, pick(Wd, (y < y0 + 2 ? 0.86 : 0.6) - (y > y0 + 19 ? 0.3 : 0) + (vnoise(x / 6, y / 2, 6) - 0.5) * 0.25));
      for (let k = 0; k < 12; k++) for (let y = y0 + k; y < y0 + 22 - k; y++) pb.set(dir > 0 ? x1 + k : x0 - 1 - k, y, pick(Wd, 0.5));
      pb.rect(x0 + 8, y0 + 8, x1 - x0 - 16, 2, Wd[1]); pb.rect(x0 + 8, y0 + 14, (x1 - x0) / 2, 2, Wd[1]); };
    board(10, 6, 60, 1); board(42, 20, 74, -1); return outline(pb, 40, 98); },
};
export function fence(n) {
  const W = n * T, pb = new PB(W, 88), F = R("#8c7c66", 8, -0.75, 0.42);
  for (const ry of [28, 60]) for (let x = 0; x < W; x++) for (let y = 0; y < 8; y++) pb.set(x, ry + y, pick(F, (y < 2 ? 0.82 : 0.46 - y * 0.02) + (vnoise(x / 8, ry, 3) - 0.5) * 0.3));
  for (let x0 = 2; x0 < W - 8; x0 += 16) { const post = x0 % 64 < 16, w = post ? 14 : 10, tip = post ? 4 : 8;
    for (let y = 8; y < 82; y++) for (let x = 0; x < w; x++) { const fromTop = y - 8; if (fromTop < tip && Math.abs(x - (w - 1) / 2) > fromTop * 0.9) continue;
      pb.set(x0 + x, y, pick(F, (x < 2 ? 0.86 : x >= w - 2 ? 0.2 : 0.56) + (vnoise(x0 + x / 3, y / 8, 5) - 0.5) * 0.24 - (y > 72 ? 0.22 : 0))); }
    if (post) { pb.rect(x0 + 5, 31, 3, 3, Ir[2]); pb.rect(x0 + 5, 63, 3, 3, Ir[2]); } }
  return outline(pb, 0, 80);
}
export function bush(seed, color) {
  const pb = new PB(76, 60);
  for (const [x, y, r] of [[22, 38, 18], [52, 38, 18], [37, 26, 20], [37, 42, 18], [14, 44, 11], [62, 44, 11]]) blob(pb, x, y, r, r * 0.82, Lf, { jag: 0.38, seed: seed * 9 + x, bias: (37 - x) * 0.004 + (30 - y) * 0.005 });
  for (let i = 0; i < 60; i++) { const x = hash(i, 1, seed) * 76 | 0, y = hash(i, 2, seed) * 56 | 0; if (pb.alpha(x, y) && pb.alpha(x, y - 3)) pb.set(x, y, Lf[(x + y) % 2 ? 7 : 2]); }
  if (color) for (let i = 0; i < 12; i++) { const x = 8 + hash(i, 3, seed) * 60 | 0, y = 10 + hash(i, 4, seed) * 38 | 0; if (pb.alpha(x, y)) flower(pb, x, y, color, true); }
  return outline(pb, 38, 56);
}
export function flowers(seed, color) {
  const pb = new PB(64, 44);
  for (let i = 0; i < 26; i++) { const x = 4 + hash(i, 1, seed) * 54 | 0, y = 10 + hash(i, 2, seed) * 26 | 0, h = 6 + (hash(i, 5, seed) * 6 | 0);
    for (let k = 0; k < h; k++) pb.set(x + (k > h / 2 && i % 2 ? 1 : 0), y + k, Lf[3 + (k % 2)]); if (i % 3 === 0) { pb.set(x - 1, y + h - 3, Lf[5]); pb.set(x - 2, y + h - 4, Lf[5]); }
    flower(pb, x - 1, y - 2, i % 5 === 0 ? "#fff4e8" : color, i % 2 === 0); }
  return outline(pb, 32, 40);
}
export function lavender(seed) {
  const pb = new PB(60, 64), Lv = R("#9a6ad8", 7, -0.6, 0.55);
  for (let i = 0; i < 16; i++) { const bx = 8 + i * 2.9 + (hash(i, 1, seed) - 0.5) * 4, top = 6 + Math.floor(hash(i, 2, seed) * 16), lean = (i - 8) * 0.35;
    for (let y = top; y < 60; y++) { const t = (y - top) / (60 - top), x = Math.round(bx + lean * (1 - t)); pb.set(x, y, Lf[3 + (i % 2)]);
      if (y < top + 16 && (y - top) % 3 !== 2) { pb.set(x - 1, y, Lv[3 + ((y + i) % 2)]); pb.set(x + 1, y, Lv[2]); pb.set(x, y, Lv[4]); } } }
  return outline(pb, 30, 60);
}

// ---------- 🌳 ต้นไม้ ----------
export function broadTree(kind, seed) {
  const W = 156, H = 196, pb = new PB(W, H), rnd = (k) => hash(seed, k, 77), cx = 78, base = 188;
  const L = kind === "autumn" ? PAL.autumn : kind === "apple" ? PAL.leaf : Lf, Bk = PAL.bark;
  for (let y = 100; y < base; y++) { const w = 10 + Math.max(0, y - 160) * 0.55; for (let x = -w; x <= w; x++) pb.set(cx + x, y, pick(Bk, cylLight(x / w) * 0.85 + (Math.sin(y * 0.42 + x * 0.25) > 0.78 ? -0.22 : 0) + (vnoise((cx + x) / 2, y / 7, seed) - 0.5) * 0.2)); }
  for (const s of [-1, 1]) for (let i = 0; i < 20; i++) pb.rect(Math.round(cx + s * (9 + i * 1.05)), base - 4 + Math.round(i * 0.15), 3, 4 - (i > 14), Bk[2 + (i % 3)]);
  for (const [a, l] of [[-0.95, 34], [0.85, 38], [-0.25, 26]]) for (let i = 0; i < l; i++) pb.rect(Math.round(cx + Math.sin(a) * i), Math.round(124 - Math.cos(a) * i * 0.8), Math.max(2, 6 - (i / l) * 4) | 0, 4, Bk[3 + (i % 2)]);
  const cl = [];
  for (let i = 0; i < 16; i++) { const a = rnd(i) * Math.PI * 2, r = Math.sqrt(rnd(i + 40)) * 0.88; cl.push([cx + Math.cos(a) * r * 50, 70 + Math.sin(a) * r * 38, 21 + rnd(i + 80) * 12]); }
  cl.push([cx, 42, 30], [cx - 30, 76, 26], [cx + 32, 78, 26], [cx, 96, 26]); cl.sort((p, q) => p[1] - q[1]);
  for (const [x, y, r] of cl) blob(pb, x, y, r, r * 0.86, L, { jag: 0.3, seed: seed + (x | 0), bias: -0.04 + (cx - x) * 0.0018 + (66 - y) * 0.0034 });
  // ช่อใบเล็ก ๆ ที่ขอบพุ่ม (ให้ดูเป็นใบไม้จริง ไม่ใช่ก้อนกลม)
  for (let i = 0; i < 110; i++) { const a = rnd(i + 200) * Math.PI * 2, r = 0.82 + rnd(i + 300) * 0.22, x = cx + Math.cos(a) * 64 * r, y = 70 + Math.sin(a) * 52 * r;
    if (!pb.alpha(x | 0, y | 0) && !pb.alpha((x + (cx - x) * 0.12) | 0, (y + (70 - y) * 0.12) | 0)) continue; const lt = (cx - x) * 0.005 + (70 - y) * 0.007 + 0.5;
    for (let k = 0; k < 3; k++) pb.set((x + Math.cos(a) * k) | 0, (y + Math.sin(a) * k) | 0, pick(L, clamp(lt, 0.1, 0.9))); }
  for (let i = 0; i < 160; i++) { const x = hash(i, 1, seed) * W | 0, y = hash(i, 2, seed) * 130 | 0; if (!pb.alpha(x, y)) continue; const up = (cx - x) * 0.004 + (60 - y) * 0.006 + 0.5; pb.set(x, y, pick(L, up > 0.62 ? 0.9 : 0.12)); }
  if (kind === "apple") for (let i = 0; i < 16; i++) { const x = 36 + hash(i, 4, seed) * 84 | 0, y = 40 + hash(i, 5, seed) * 72 | 0; if (pb.alpha(x, y) && pb.alpha(x + 4, y + 4)) { blob(pb, x + 2, y + 2, 3.2, 3.2, R("#d83828", 6, -0.6, 0.5), { seed: i }); pb.set(x + 1, y + 1, [255, 190, 170]); } }
  return outline(pb, cx, base, -0.86);
}
export function pineTree(seed) {
  const W = 120, H = 232, pb = new PB(W, H), cx = 60, base = 224, P = PAL.pine;
  for (let y = 176; y < base; y++) for (let x = -7; x <= 7; x++) pb.set(cx + x, y, pick(PAL.bark, cylLight(x / 7) * 0.8 + (vnoise(x, y / 5, seed) - 0.5) * 0.2));
  for (let k = 0; k < 6; k++) { const ty = 14 + k * 28, by = ty + 56 + k * 4, hw = 18 + k * 8.4;
    for (let y = ty; y < by; y++) { const t = (y - ty) / (by - ty), w = hw * (0.18 + t * 0.82) + Math.sin(y * 0.9 + k) * 2; for (let x = -w; x <= w; x++) { const u = x / w, edge = t > 0.86 && hash(Math.round(x / 4), k, seed) > 0.5;
      if (edge && t > 0.92) continue; pb.set(cx + x, y, pick(P, 0.2 + cylLight(u) * 0.55 + (t > 0.8 ? -0.18 : 0) + (1 - t) * 0.12 + (vnoise((cx + x) / 3, y / 2, seed + k) - 0.5) * 0.18)); } } }
  for (let i = 0; i < 80; i++) { const x = hash(i, 1, seed) * W | 0, y = 10 + hash(i, 2, seed) * 190 | 0; if (pb.alpha(x, y) && x < cx) pb.set(x, y, P[7]); }
  pb.rect(cx - 1, 6, 3, 10, P[5]);
  return outline(pb, cx, base, -0.86);
}
// เนินหญ้ายกสูงหน้าผาหิน
export function plateau(w, h, seed) {
  const RH = 52, W = w * T, Hh = h * T + RH, pb = new PB(W, Hh), top = h * T;
  const pts = []; for (let gy = -1; gy <= 3; gy++) for (let gx = -1; gx <= Math.ceil(W / 24) + 1; gx++) pts.push([gx * 24 + hash(gx, gy, seed) * 24, top - 12 + gy * 20 + hash(gx, gy, seed + 1) * 20, hash(gx, gy, seed + 2)]);
  for (let y = top - 12; y < Hh; y++) for (let x = 0; x < W; x++) {
    let d1 = 1e9, d2 = 1e9, best = null; for (const q of pts) { if (Math.abs(q[0] - x) > 40) continue; const dd = (x - q[0]) ** 2 + ((y - q[1]) * 1.25) ** 2; if (dd < d1) { d2 = d1; d1 = dd; best = q; } else if (dd < d2) d2 = dd; }
    const edge = Math.sqrt(d2) - Math.sqrt(d1), nx = clamp((x - best[0]) / 18, -1, 1), ny = clamp((y - best[1]) / 16, -1, 1);
    let t = sphereLight(nx * 0.8, ny * 0.8) * 0.7 + 0.12 + (best[2] - 0.5) * 0.25 + (vnoise(x / 3, y / 3, seed) - 0.5) * 0.12 - (y - top) * 0.004;
    if (edge < 2.4) t -= 0.42; if (x < 3 || x > W - 4) t -= 0.25;
    pb.set(x, y, pick(PAL.rock, t));
    if (best[2] < 0.25 && ny < -0.2 && vnoise(x / 3, y / 3, seed + 4) > 0.5) pb.set(x, y, tone([86, 110, 40], ny));
  }
  // หญ้าด้านบน (ยกสูงจึงโดนแดดกว่า) ขอบเป็นกอห้อยลงหน้าผา
  for (let y = 0; y < top + 12; y++) for (let x = 0; x < W; x++) {
    const ex = Math.min(x, W - 1 - x), jag = vnoise(x / 6, y / 6, seed) * 8;
    if (y < 4 + jag * 0.6 || ex < jag * 0.5) continue;
    const hang = 4 + vnoise(x / 5, 9, seed) * 12; if (y >= top - 4 && y - (top - 4) > hang) continue;
    let c = tone(grassRGB(x + seed * 74, y + seed * 106), 0.06);
    if (y < 10 + jag * 0.6 || ex < 4 + jag * 0.5) c = tone(c, 0.24);
    if (y >= top - 4) c = tone(c, -0.35 - (y - top) * 0.025);
    pb.set(x, y, c);
  }
  return { s: outline(pb, 0, Hh - 4, -0.7), top };
}

// ---------- 🗿 เสาหินพันเถาวัลย์ + คริสตัล ----------
export function pillar(W, H, seed, big) {
  const MG = 16, cw = W + MG * 2, pb = new PB(cw, H + 4), cx = cw / 2;
  const capH = big ? 36 : 24, baseH = big ? 32 : 20, sw = W - (big ? 40 : 24);
  const st = (x, fx, extra = 0) => pick(St, (fx < 0.22 ? 0.8 : fx > 0.78 ? 0.3 : 0.58 - (fx - 0.22) * 0.15) + extra + (hash(x, seed, 3) - 0.5) * 0.05);
  for (let y = H - baseH; y < H; y++) for (let x = MG; x < MG + W; x++) { const r = y - (H - baseH), fx = (x - MG) / W; pb.set(x, y, st(x, fx, r < 5 ? 0.25 : r > baseH - 5 ? -0.22 : (vnoise(x / 4, r / 4, seed) - 0.5) * 0.2)); }
  for (let y = capH; y < H - baseH; y++) for (let x = cx - sw / 2; x < cx + sw / 2; x++) { const r = y - capH, fx = (x - (cx - sw / 2)) / sw, row = Math.floor(r / 28);
    const joint = r % 28 >= 26 || ((x - (cx - sw / 2) + (row % 2) * 16) % 32 < 2 && big);
    pb.set(x, y, joint ? St[1] : st(x, fx, (vnoise(x / 5, y / 5, seed) - 0.5) * 0.22 + (r % 28 < 2 ? 0.12 : 0))); }
  for (let y = capH; y < capH + 8; y++) for (let x = cx - sw / 2; x < cx + sw / 2; x++) pb.shade(x, y, -0.45 + (y - capH) * 0.04);
  for (let y = 6; y < capH; y++) for (let x = MG + 4; x < MG + W - 4; x++) { const r = y - 6, fx = (x - MG) / W; pb.set(x, y, st(x, fx, r < 5 ? 0.3 : y >= capH - 2 ? -0.32 : 0)); }
  const pw = big ? 40 : 24; pb.rect(cx - pw / 2, 0, pw, 6, St[6]); pb.rect(cx - pw / 2, 4, pw, 2, St[3]);
  // รอยร้าว
  for (let i = 0; i < 7; i++) { let x = cx - sw / 2 + 6 + hash(i, seed, 71) * (sw - 12), y = capH + 14 + hash(seed, i, 72) * (H - baseH - capH - 40); for (let k = 0; k < 14; k++) { x += (hash(i, k, seed) - 0.5) * 2.4; y += 1; pb.set(x | 0, y | 0, St[1]); if (k % 4 === 0) pb.set((x | 0) + 1, y | 0, St[2]); } }
  // ตะไคร่ + ใบไม้ห้อย + เถาวัลย์เกลียว
  for (let x = MG + 4; x < MG + W - 4; x++) { if (hash(x, seed, 73) < 0.45) pb.rect(x, 6, 1, 1 + (hash(x, 1, 74) < 0.4 ? 4 : 1), Lf[5 + (x % 2)]); if (hash(x, seed, 75) < 0.35) pb.rect(x, H - baseH, 1, 2, Lf[4]); }
  for (let x = MG + 8; x < MG + W - 8; x += 5) if (hash(x, seed, 76) < 0.45) { const Ln = 6 + Math.floor(hash(x, 2, 77) * (big ? 28 : 16)); for (let k = 0; k < Ln; k++) pb.set(x + (k % 6 < 3 ? 0 : 1), capH + k, Lf[3]); blob(pb, x, capH + Ln, 3, 2.5, Lf, { seed: x, bias: 0.15 }); }
  for (let sI = 0; sI < (big ? 2 : 1); sI++) for (let y = capH - 4; y < H - baseH + 6; y++) {
    const a = y * (big ? 0.05 : 0.075) + seed * 1.7 + sI * Math.PI, sn = Math.sin(a), front = Math.cos(a) > -0.2, vx = Math.round(cx + sn * (sw / 2 + 4) - 4);
    if (front) for (let k = 0; k < 7; k++) pb.set(vx + k, y, Lf[k < 2 ? 6 : k > 5 ? 2 : 4]); else if (Math.abs(sn) > 0.8) pb.rect(vx + (sn > 0 ? 4 : 0), y, 3, 1, Lf[1]);
    if (front && (y + sI * 9) % 12 === 0) { const lx = vx + (sn > 0 ? 8 : -10); blob(pb, lx + 5, y, 6, 4, Lf, { seed: y, bias: 0.18 }); pb.set(lx + 3, y - 2, Lf[8]); }
  }
  return outline(pb, cx, H + 1, -0.72);
}
export function crystal(s) {
  const h = Math.round(s * 1.8), pb = new PB(s * 2 + 4, h * 2 + 4), G = ramp([90, 220, 60], 9, -0.7, 0.78);
  for (let dy = -h; dy <= h; dy++) { const hw = s * (1 - Math.abs(dy) / h); for (let dx = -Math.floor(hw); dx <= hw; dx++) {
    const upper = dy < h * 0.2; let t = upper ? (dx < -hw * 0.35 ? 0.96 : dx < hw * 0.1 ? 0.74 : 0.52) : (dx < -hw * 0.2 ? 0.46 : dx < hw * 0.3 ? 0.32 : 0.2);
    if (Math.abs(dx) < 1.2 && upper) t = 0.88; if (Math.abs(dy - h * 0.2) < 1) t = 1; t += (hash(dx, dy, s) - 0.5) * 0.05;
    pb.set(s + 2 + dx, h + 2 + dy, pick(G, t)); } }
  for (let k = 0; k < 4; k++) pb.set(s + 2 - (s >> 1) + (k >> 1), h + 2 - (h >> 1) + k, [255, 255, 255]);
  return outline(pb, s + 2, h + 2, -0.75);
}

// ---------- 🏛️ ซุ้มประตูโบราณ (ประตูอัญเชิญ): เสาหินสลักรูน ซุ้มโค้งครึ่งพัง เถาวัลย์ อัญมณีรูนบนหินหลักซุ้ม ----------
export function gate() {
  const W = 372, H = 372, pb = new PB(W, H), Sd = R("#c8b08a", 10, -0.85, 0.42), cx = 186, runes = [];
  const block = (x0, y0, w, h, b = 0, carve = false) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const x = x0 + i, y = y0 + j, e = i < 3 || j < 3 ? 0.24 : i >= w - 3 || j >= h - 3 ? -0.34 : 0;
    let t = 0.52 + b + e + (vnoise(x / 6, y / 6, 3) - 0.5) * 0.24 + (hash(x, y, 4) - 0.5) * 0.05 + (vnoise(x / 2, y / 2, 8) > 0.84 ? -0.18 : 0);
    if (carve && i > 8 && i < w - 9 && j > 6 && j < h - 7) t -= 0.16; pb.set(x, y, pick(Sd, t)); }
    if (carve) for (let r = 0; r < 2; r++) for (let i = 12; i < w - 12; i += 6) { const ry = y0 + 11 + r * 9, gx = x0 + i; if (hash(gx, ry, 5) < 0.62) { pb.rect(gx, ry, 3, 3, [70, 170, 180]); runes.push([gx + 1, ry + 1]); } } };
  // ฐาน 3 ขั้น
  for (const [w, y, h, b] of [[372, 344, 26, -0.1], [336, 322, 24, 0], [300, 302, 22, 0.08]]) for (let x = cx - w / 2; x < cx + w / 2; x += 34) block(Math.round(x), y, Math.min(34, cx + w / 2 - x), h, b + (hash(x, y, 1) - 0.5) * 0.12);
  // เสาซ้าย (สมบูรณ์) · เสาขวา (ยอดพัง)
  for (let r = 0; r < 5; r++) { block(40, 270 - r * 30, 68, 30, 0.08 - (r % 2) * 0.05, r % 2 === 1); block(264, 270 - r * 30, 68, 30, -0.12 - (r % 2) * 0.05, r % 2 === 1); }
  block(30, 278, 88, 24, 0.12); block(254, 278, 88, 24, -0.04);
  block(32, 134, 84, 18, 0.16); block(256, 134, 84, 18, -0.08); // บัวหัวเสา
  // ซุ้มโค้ง: ก้อนหินเรียงตามส่วนโค้ง (ด้านขวาหายไป 1 ก้อน)
  for (let k = 0; k <= 10; k++) { if (k === 8) continue; const a = Math.PI - (k / 10) * Math.PI, x = cx + Math.cos(a) * 112 - 21, y = 134 - Math.sin(a) * 104; block(Math.round(x), Math.round(y), 42, 32, 0.1 - k * 0.02 + (k === 5 ? 0.06 : 0)); }
  // หินหลักซุ้ม + อัญมณีรูน
  block(cx - 26, 6, 52, 40, 0.14);
  for (let y = -15; y <= 15; y++) for (let x = -15; x <= 15; x++) { const d = Math.abs(x) + Math.abs(y); if (d > 15) continue; pb.set(cx + x, 26 + y, d > 12 ? Sd[2] : d < 5 ? [236, 255, 255] : mix([50, 190, 225], [170, 245, 255], (15 - y) / 30 - d * 0.015)); }
  // ก้อนหินที่หล่นลงพื้น
  for (const [x, y, w, h] of [[296, 352, 34, 18], [236, 358, 26, 12], [334, 332, 30, 16], [10, 356, 28, 14]]) block(x, y, w, h, -0.08);
  // ช่องประตู (โปร่งใส: วาดพอร์ทัล/หมอกเวทด้านหลัง)
  const hole = (x, y) => x >= 108 && x < 264 && y < 302 && y > 134 - Math.sqrt(Math.max(0, 1 - ((x + 0.5 - cx) / 80) ** 2)) * 88;
  for (let y = 0; y < H; y++) for (let x = 108; x < 264; x++) if (hole(x, y)) pb.d[(y * W + x) * 4 + 3] = 0;
  for (let y = 40; y < 302; y++) for (let x = 108; x < 264; x++) if (hole(x, y) && (!hole(x - 10, y) || !hole(x, y - 10) || !hole(x + 6, y))) pb.set(x, y, pick(Sd, 0.16 + (x < cx ? 0.14 : 0) + (vnoise(x / 4, y / 4, 9) - 0.5) * 0.1));
  // รอยร้าว ตะไคร่ เถาวัลย์ห้อย
  for (let c = 0; c < 16; c++) { let x = 40 + hash(c, 1, 5) * 292, y = 30 + hash(c, 2, 5) * 280; for (let i = 0; i < 24; i++) { x += (hash(c, i, 6) - 0.5) * 3; y += 1.5; if (pb.alpha(x | 0, y | 0) > 200) pb.set(x | 0, y | 0, Sd[1]); } }
  for (let i = 0; i < 340; i++) { const x = hash(i, 1, 91) * W | 0, y = hash(i, 2, 91) * H | 0; if (!pb.alpha(x, y) || pb.alpha(x, y - 4)) continue; for (let k = 0; k < 8; k++) pb.set(x + k - 3, y + (k % 3 === 0 ? 1 : 0), Lf[4 + (k % 3)]); }
  for (const vx of [44, 62, 86, 112, 300, 318]) { let x = vx, y = 52 + hash(vx, 1, 2) * 50; for (let i = 0; i < 100; i++) { x += Math.sin(i * 0.28 + vx) * 0.9; y += 2.4; if (y > 296) break; if (pb.alpha(x | 0, y | 0)) { pb.rect(x | 0, y | 0, 2, 3, Lf[3]); if (i % 4 === 0) blob(pb, x + (i % 8 ? 4 : -4), y, 4.5, 3.2, Lf, { seed: i + vx, bias: 0.15 }); if (i % 13 === 0) flower(pb, (x + 3) | 0, (y - 1) | 0, "#f0a0d0"); } } }
  return { s: outline(pb, cx, 364, -0.86), hole, rune: [cx, 26], runes, P0: [108, 40], PW: 156, PH: 262 };
}
export function dockSign() {
  const pb = new PB(120, 164); cylinder(pb, 54, 88, 14, 72, Wd);
  blob(pb, 60, 56, 52, 52, ramp([46, 90, 50], 8, -0.7, 0.4), { bias: 0.05 });
  for (let y = 0; y < 116; y++) for (let x = 0; x < 120; x++) { const d = Math.hypot(x + 0.5 - 60, (y + 0.5 - 56) * 1.1); if (d > 26 && d < 34) pb.set(x, y, pick(Wd, 0.55 + sphereLight((x - 60) / 36, (y - 56) / 36) * 0.4)); }
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; for (let k = 0; k < 44; k++) pb.rect(60 + Math.round(Math.cos(a) * k), 56 + Math.round(Math.sin(a) * k * 0.9), 2, 2, pick(Wd, k > 36 ? 0.78 : 0.5)); }
  blob(pb, 60, 56, 8, 8, Wd, { bias: 0.1 });
  return outline(pb, 60, 158);
}
