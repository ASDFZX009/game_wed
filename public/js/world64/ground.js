// 🌱 พื้นหมู่บ้าน 64px: หญ้าเป็นกอ ทางดินปูหินกลม ลานหินโบราณ น้ำ ท่าไม้ — ขอบทางโค้งมนแบบธรรมชาติ (ไม่เป็นเหลี่ยมตามช่อง)
import { hash, vnoise, fbm, clamp, mix, mul, tone } from "../world/art.js";
const T = 64;
const G_DARK = [30, 44, 16], G_MID = [74, 96, 30], G_LIT = [122, 140, 48], G_TIP = [196, 196, 104];
const D_DARK = [88, 54, 26], D_MID = [148, 96, 46], D_LIT = [192, 140, 74];

export function grassRGB(X, Y) {
  const big = fbm(X / 230, Y / 230, 11), clump = fbm(X / 28, Y / 20, 12), blade = vnoise(X / 2.4, Y / 6.2, 13), fine = hash(X, Y, 8);
  let t = 0.46 + (big - 0.5) * 0.55 + (clump - 0.5) * 0.5 + (blade - 0.5) * 0.3 + (fine - 0.5) * 0.06;
  if (blade > 0.72 && clump > 0.5) t += 0.14 + (blade - 0.72) * 0.6;
  if (clump < 0.32 && blade < 0.38) t -= 0.12;
  return t < 0.33 ? mix(G_DARK, G_MID, clamp(t / 0.33, 0, 1)) : t < 0.7 ? mix(G_MID, G_LIT, (t - 0.33) / 0.37) : mix(G_LIT, G_TIP, clamp((t - 0.7) / 0.32, 0, 1));
}
// ทางดิน + หินกลมฝัง (หินมีแสงจากซ้ายบน เงาด้านขวาล่าง)
export function dirtRGB(X, Y, cobble) {
  const n = fbm(X / 80, Y / 80, 21), m = vnoise(X / 12, Y / 12, 22);
  let c = mix(D_DARK, D_MID, clamp(0.56 + (n - 0.5) * 0.9 + (m - 0.5) * 0.25, 0, 1));
  const h = hash(X, Y, 23); if (h < 0.05) c = mul(c, 0.84); else if (h > 0.988) c = D_LIT;
  if (hash(X >> 1, Y >> 1, 26) > 0.985) c = tone(c, 0.3); // กรวดเม็ดเล็ก
  const cy = Math.floor(Y / 16), off = (cy & 1) * 11, cx = Math.floor((X + off) / 22), hv = hash(cx, cy, 24);
  if (hv < cobble) {
    const sx = cx * 22 - off + 4 + hash(cx, cy, 25) * 10, sy = cy * 16 + 4 + hash(cx, cy, 26) * 6, rx = 6 + hash(cx, cy, 27) * 4.4, ry = 4.4 + hash(cx, cy, 28) * 2.4;
    const nx = (X + 0.5 - sx) / rx, ny = (Y + 0.5 - sy) / ry, d = nx * nx + ny * ny;
    if (d < 1) { const base = mix([150, 112, 72], [182, 156, 120], hash(cx, cy, 29)), l = -nx * 0.5 - ny * 0.7 + (vnoise(X / 2, Y / 2, 30) - 0.5) * 0.3;
      c = l > 0.55 ? tone(base, 0.32) : l > 0.25 ? tone(base, 0.12) : d > 0.6 && nx + ny > 0.3 ? tone(base, -0.38) : base; }
    else if (d < 1.6 && ny > 0.15) c = mul(c, 0.78);
  }
  return c;
}
export function waterRGB(X, Y, depth, t = 0) {
  let c = mix([20, 48, 68], [56, 110, 120], 1 - depth);
  const r = vnoise(X / 18, Y / 6, 31); if (r > 0.66) c = mix(c, [136, 186, 182], (r - 0.66) * 1.5); else if (r < 0.22) c = mul(c, 0.9);
  return c;
}
// ลานหินโบราณ: แผ่นหินวางเหลื่อม ขอบลบมุม มีรอยร้าว มอสตามร่อง
export function flagRGB(X, Y) {
  const ry = Math.floor(Y / 28), off = (ry & 1) * 22, cx = Math.floor((X + off) / 44), lx = (X + off) % 44, ly = Y % 28, h = hash(cx, ry, 71);
  if (lx < 2 || ly < 2) return vnoise(X / 3, Y / 3, 75) < 0.5 ? [52, 72, 34] : [38, 50, 26];
  let c = mix([92, 98, 104], [150, 150, 144], h * 0.7 + vnoise(X / 12, Y / 12, 72) * 0.3);
  if (ly < 4 || lx < 4) c = tone(c, 0.22); else if (ly > 25 || lx > 41) c = tone(c, -0.3);
  c = tone(c, (vnoise(X / 3, Y / 3, 77) - 0.5) * 0.12);
  if (vnoise(X / 8, Y / 8, 73) > 0.76) c = mix(c, [70, 98, 40], 0.66);
  if (hash(cx, ry, 74) < 0.32 && Math.abs(lx - 12 - (ly * 0.8 | 0) - Math.sin(ly * 0.5) * 2) < 1) c = tone(c, -0.48);
  return c;
}

/** ชนิดพื้นรายพิกเซล: 0 หญ้า 1 ทางดิน 2 น้ำ 3 ท่าไม้ 5 ลานหิน */
export function makeTypeFn(M, PLAZA) {
  const SH = M.shapes, isPathT = (x, y) => (M.inb(x, y) ? (M.ground[M.at(x, y)] === 1 ? 1 : 0) : 0);
  const lakeV = (fx, fy) => { let v = 9; for (const L of SH.lakes) v = Math.min(v, Math.hypot((fx - L.x) / L.rx, (fy - L.y) / L.ry)); return v; };
  return (X, Y) => {
    const fx = X / T, fy = Y / T, tx = Math.floor(fx), ty = Math.floor(fy), g0 = M.inb(tx, ty) ? M.ground[M.at(tx, ty)] : 0, n = vnoise(X / 11, Y / 11, 51) - 0.5;
    if (g0 === 3) return 3;
    let water = lakeV(fx, fy) + n * 0.1 < 1; const I = SH.island; if (I && Math.hypot(fx - I.x, (fy - I.y) * 1.2) + n * 0.2 < I.r) water = false;
    if (water && g0 !== 1) return 2;
    if (SH.flag && (g0 === 5 || g0 === 0)) { const F = SH.flag; if (Math.hypot((fx - F.x) / F.rx, (fy - F.y) / F.ry) + n * 0.16 < 1) return 5; }
    // ทางเดิน: ค่าจากช่องรอบ ๆ แบบไล่ระดับ → มุมโค้ง ขอบเป็นธรรมชาติ
    const gx = fx - 0.5, gy = fy - 0.5, x0 = Math.floor(gx), y0 = Math.floor(gy), u = gx - x0, v = gy - y0, su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
    let p = isPathT(x0, y0) * (1 - su) * (1 - sv) + isPathT(x0 + 1, y0) * su * (1 - sv) + isPathT(x0, y0 + 1) * (1 - su) * sv + isPathT(x0 + 1, y0 + 1) * su * sv;
    p += n * 0.34 + (vnoise(X / 4, Y / 4, 5) - 0.5) * 0.1;
    const pd = Math.hypot(fx - PLAZA.x, (fy - PLAZA.y) * 1.15) + n * 0.22;
    if (pd < 5.4) { if (pd > 3.5 && pd < 4.8) return 1; if (pd > 3.1 && pd < 5.2) return 0; if (pd <= 3.1) return 0; }
    return p > 0.5 ? 1 : 0;
  };
}

/** ระบายสีพื้นของสี่เหลี่ยมหนึ่ง (ชิ้นแผนที่) → ImageData */
export function bakeChunk(M, PLAZA, typeAt, X0, Y0, w, h) {
  const MG = 26, W2 = w + MG * 2, H2 = h + MG * 2, tp = new Uint8Array(W2 * H2);
  for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) tp[y * W2 + x] = typeAt(X0 - MG + x, Y0 - MG + y);
  const ty = (X, Y) => { const x = X - X0 + MG, y = Y - Y0 + MG; return x < 0 || y < 0 || x >= W2 || y >= H2 ? 0 : tp[y * W2 + x]; };
  const wd = (X, Y) => { const fx = X / T - 0.5, fy = Y / T - 0.5, x0 = Math.floor(fx), y0 = Math.floor(fy), u = fx - x0, v = fy - y0, s = (x, y) => (M.inb(x, y) ? M.wdist[M.at(x, y)] : 0);
    return s(x0, y0) * (1 - u) * (1 - v) + s(x0 + 1, y0) * u * (1 - v) + s(x0, y0 + 1) * (1 - u) * v + s(x0 + 1, y0 + 1) * u * v; };
  const img = new ImageData(w, h), D = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const X = X0 + x, Y = Y0 + y, t = ty(X, Y); let c;
    if (t === 0) {
      c = grassRGB(X, Y);
      // หญ้าริมทาง: ด้านบนของทางโดนแดด ด้านข้างมีเงา
      if (ty(X, Y + 2) === 1 || ty(X, Y + 4) === 1) c = tone(c, 0.18); else if (ty(X - 2, Y) === 1 || ty(X + 2, Y) === 1) c = mul(c, 0.86);
      if (ty(X, Y + 1) === 5 || ty(X, Y + 3) === 5) c = tone(c, 0.12);
    } else if (t === 1) {
      const pd = Math.hypot(X / T - PLAZA.x, (Y / T - PLAZA.y) * 1.15);
      c = dirtRGB(X, Y, pd < 5.4 ? 0.64 : 0.34);
      // ขอบบน: กอหญ้าห้อยลงมาบนทาง + เงาใต้กอหญ้า
      let k = 1; while (k <= 24 && ty(X, Y - k) === 1) k++;
      if (k <= 24 && ty(X, Y - k) === 0) { const lip = 3 + Math.floor(vnoise(X / 4, 7, 32) * 8);
        if (k <= lip) { c = mix(G_MID, G_DARK, k / (lip + 1)); if ((X + k) % 3 === 0) c = tone(c, 0.16); }
        else { const s = k - lip; if (s <= 14) c = mul(c, 0.64 + s * 0.025); } }
      if (ty(X, Y + 1) === 0 && hash(X, Y, 34) < 0.55) c = mix(G_MID, G_LIT, hash(X, Y, 35));
      else if ((ty(X, Y + 2) === 0 || ty(X, Y + 3) === 0) && hash(X, Y, 36) < 0.28) c = G_MID;
      if (ty(X - 1, Y) === 0) c = mul(c, 0.72); else if (ty(X - 4, Y) === 0) c = mul(c, 0.84); else if (ty(X - 8, Y) === 0) c = mul(c, 0.93);
      if (ty(X + 1, Y) === 0 && hash(X, Y, 37) < 0.55) c = G_MID;
    } else if (t === 2) {
      const dp = clamp(wd(X, Y) / 3.6, 0, 1); c = waterRGB(X, Y, dp * (2 - dp));
      let k = 1; while (k <= 40 && ty(X, Y - k) === 2) k++;
      const ab = ty(X, Y - k);
      if (k <= 40 && ab !== 2 && ab !== 3) { const lip = ab === 0 ? 5 : 0, s = k - lip;
        if (k <= lip) c = G_MID;
        else if (s <= 20) { const r2 = s > 10 ? 1 : 0, sx = Math.floor((X + r2 * 12) / 24), ly = (s - 1) % 10, lx = (X + r2 * 12) % 24, base = mix([96, 78, 60], [154, 132, 104], hash(sx, r2, 41));
          c = lx < 2 || ly >= 8 ? [40, 32, 26] : ly < 2 ? tone(base, 0.28) : lx > 19 ? tone(base, -0.3) : tone(base, (vnoise(X / 3, Y / 3, 43) - 0.5) * 0.2); }
        else if (s <= 36) c = mul(c, 0.58 + (s - 20) * 0.026);
      } else if (ab === 3 && k <= 20) c = mul(c, 0.6);
      const side = (q) => q !== 2 && q !== 3;
      if ((side(ty(X, Y + 1)) || side(ty(X - 1, Y)) || side(ty(X + 1, Y))) && hash(X, Y, 42) < 0.7) c = [204, 228, 222];
      else if ((side(ty(X, Y + 3)) || side(ty(X - 3, Y)) || side(ty(X + 3, Y))) && hash(X, Y, 44) < 0.25) c = mix(c, [190, 220, 214], 0.5);
    } else if (t === 3) { const py = Y % 16, hh = hash(X >> 4, Y >> 4, 1), base = mix([120, 80, 44], [162, 114, 64], hh);
      c = py >= 14 ? [52, 32, 18] : py < 2 ? tone(base, 0.22) : X % 128 < 2 ? mul(base, 0.6) : mul(base, 0.9 + vnoise(X / 10, Y / 2, 3) * 0.18);
      if ((X & 63) >= 4 && (X & 63) < 7 && py > 5 && py < 9) c = [64, 64, 70];
    } else { c = flagRGB(X, Y); if (ty(X, Y - 3) === 0 || ty(X, Y - 6) === 0) c = mul(c, 0.72); }
    const i = (y * w + x) * 4; D[i] = c[0]; D[i + 1] = c[1]; D[i + 2] = c[2]; D[i + 3] = 255;
  }
  // กอหญ้ายาว (เส้นใบ) วาดทับทีละกอ — ทำให้หญ้าดูมีมิติ
  const put = (X, Y, c) => { const x = X - X0, y = Y - Y0; if (x < 0 || y < 0 || x >= w || y >= h) return; const i = (y * w + x) * 4; D[i] = c[0]; D[i + 1] = c[1]; D[i + 2] = c[2]; };
  const CS = 14;
  for (let cy = Math.floor((Y0 - 20) / CS); cy <= Math.floor((Y0 + h + 4) / CS); cy++) for (let cx = Math.floor((X0 - 8) / CS); cx <= Math.floor((X0 + w + 8) / CS); cx++) {
    const hv = hash(cx, cy, 91); if (hv > 0.55) continue; const bx = cx * CS + (hash(cx, cy, 92) * CS | 0), by = cy * CS + (hash(cx, cy, 93) * CS | 0);
    if (ty(bx, by) !== 0 || ty(bx, by - 8) !== 0) continue; const n = 3 + (hash(cx, cy, 94) * 4 | 0), lit = fbm(bx / 28, by / 20, 12);
    for (let b = 0; b < n; b++) { const lean = (b - (n - 1) / 2) * 0.55 + (hash(cx, cy, b) - 0.5) * 0.6, len = 5 + (hash(cx, b, 95) * 7 | 0);
      for (let k = 0; k < len; k++) { const X = Math.round(bx + b * 1.4 - n * 0.7 + lean * k * 0.5), Y = by - k, tt = k / len;
        put(X, Y, tt > 0.8 ? (lit > 0.5 ? G_TIP : G_LIT) : tt > 0.45 ? (lit > 0.45 ? G_LIT : G_MID) : tt > 0.2 ? G_MID : G_DARK); } }
    put(bx - 1, by + 1, G_DARK); put(bx + 1, by + 1, G_DARK);
  }
  // ดอกไม้ป่าเม็ดเล็ก
  for (let cy = Math.floor(Y0 / 40); cy <= Math.floor((Y0 + h) / 40); cy++) for (let cx = Math.floor(X0 / 40); cx <= Math.floor((X0 + w) / 40); cx++) {
    if (hash(cx, cy, 96) > 0.2) continue; const bx = cx * 40 + (hash(cx, cy, 97) * 36 | 0), by = cy * 40 + (hash(cx, cy, 98) * 36 | 0); if (ty(bx, by) !== 0) continue;
    const col = [[244, 240, 232], [246, 214, 90], [236, 120, 170], [180, 150, 240]][(hash(cx, cy, 99) * 4) | 0];
    for (const [dx, dy, k] of [[1, 0, 1], [0, 1, 0.85], [2, 1, 0.7], [1, 2, 0.6]]) put(bx + dx, by + dy, mul(col, k)); put(bx + 1, by + 1, [255, 230, 120]); put(bx + 1, by + 3, G_DARK);
  }
  return img;
}
