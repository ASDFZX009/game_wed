// พื้นผิวพื้นดิน: หญ้าโทนเขียวมะกอกเป็นกอ ทางดินส้มอิฐมีหินปู น้ำ ท่าไม้ — คำนวณทีละพิกเซล (วาดครั้งเดียว)
import { T, hash, vnoise, fbm, clamp, mix, mul, tone } from "./art.js";

// หญ้า: กอหญ้าเรียงแบบสุ่ม (ปลายสว่างอมเหลือง โคนเข้ม) + หย่อมแดด/ร่มขนาดใหญ่
const G_DARK = [34, 48, 18], G_MID = [78, 98, 32], G_LIT = [126, 142, 50], G_TIP = [190, 190, 102];
export function grassRGB(X, Y, lift = 0) {
  const big = fbm(X / 110, Y / 110, 11), clump = fbm(X / 13, Y / 9, 12), blade = vnoise(X / 1.9, Y / 3.3, 13), fine = hash(X, Y, 8);
  let t = 0.46 + (big - 0.5) * 0.55 + (clump - 0.5) * 0.5 + (blade - 0.5) * 0.34 + (fine - 0.5) * 0.08 + lift;
  // ปลายหญ้าโดนแดด / ร่องมืดระหว่างกอ
  if (blade > 0.7 && clump > 0.48) t += 0.16 + (blade - 0.7) * 0.6;
  if (clump < 0.32 && blade < 0.4) t -= 0.12;
  let c = t < 0.33 ? mix(G_DARK, G_MID, clamp(t / 0.33, 0, 1)) : t < 0.7 ? mix(G_MID, G_LIT, (t - 0.33) / 0.37) : mix(G_LIT, G_TIP, clamp((t - 0.7) / 0.32, 0, 1));
  const f = hash(X >> 1, Y >> 1, 9);
  if (f < 0.003 && t > 0.42) c = hash(X, Y, 10) < 0.5 ? [238, 234, 214] : [236, 210, 96];
  return c;
}
// ทางดิน: ส้มอิฐ มีหินแบนฝังเป็นช่วง ๆ
const D_DARK = [92, 56, 26], D_MID = [150, 98, 46], D_LIT = [190, 136, 70];
export function dirtRGB(X, Y, cobble = 0.35) {
  const n = fbm(X / 40, Y / 40, 21), m = vnoise(X / 6, Y / 6, 22);
  let c = mix(D_DARK, D_MID, clamp(0.55 + (n - 0.5) * 0.9 + (m - 0.5) * 0.25, 0, 1));
  const h = hash(X, Y, 23); if (h < 0.06) c = mul(c, 0.82); else if (h > 0.985) c = D_LIT;
  // หินปู (เซลล์สุ่ม 11×8)
  const cy = Math.floor(Y / 8), off = (cy & 1) * 5, cx = Math.floor((X + off) / 11), hv = hash(cx, cy, 24);
  if (hv < cobble) {
    const sx = cx * 11 - off + 2 + hash(cx, cy, 25) * 5, sy = cy * 8 + 2 + hash(cx, cy, 26) * 3, rx = 3 + hash(cx, cy, 27) * 2.2, ry = 2.2 + hash(cx, cy, 28) * 1.2;
    const nx = (X + 0.5 - sx) / rx, ny = (Y + 0.5 - sy) / ry, d = nx * nx + ny * ny;
    if (d < 1) { const base = mix([150, 112, 72], [176, 150, 116], hash(cx, cy, 29)); const l = -nx * 0.5 - ny * 0.7;
      c = l > 0.45 ? tone(base, 0.25) : d > 0.62 && nx + ny > 0.3 ? tone(base, -0.35) : base; }
    else if (d < 1.5 && ny > 0.2) c = mul(c, 0.8); // เงาใต้หิน
  }
  return c;
}
// น้ำ: ลึกตรงกลาง สว่างตรงขอบ มีระลอก
export function waterRGB(X, Y, depth) {
  let c = mix([22, 52, 70], [52, 104, 116], 1 - depth);
  const r = vnoise(X / 9, Y / 3.2, 31); if (r > 0.66) c = mix(c, [130, 180, 176], (r - 0.66) * 1.6); else if (r < 0.22) c = mul(c, 0.9);
  return c;
}

// ประกอบทั้งแผนที่ → canvas
export function bakeGround(M, PLAZA) {
  const W = M.MW * T, H = M.MH * T, type = new Uint8Array(W * H);
  // ชนิดพื้นรายพิกเซล (ขอบทางโค้งมนด้วยนอยส์ วงแหวนลานกลางเป็นวงกลมจริง)
  for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) {
    const tx = (X / T) | 0, ty = (Y / T) | 0, px = X % T, py = Y % T, g = M.ground[M.at(tx, ty)];
    let gg = g;
    if (g <= 1) {
      const pd = Math.hypot(X / T - PLAZA.x, (Y / T - PLAZA.y) * 1.15) + (vnoise(X / 5, Y / 5, 4) - 0.5) * 0.16;
      const inRing = pd > 3.5 && pd < 4.8, nearRing = pd > 3.1 && pd < 5.2;
      if (g === 1 && nearRing && !inRing) gg = 0;
      else if (g === 0 && inRing) gg = 1;
      else if (g === 1 && !nearRing) {
        const edge = (dx, dy) => M.ground[M.at(clamp(tx + dx, 0, M.MW - 1), clamp(ty + dy, 0, M.MH - 1))] === 0;
        const e = Math.min(edge(-1, 0) ? px : 99, edge(1, 0) ? T - 1 - px : 99, edge(0, -1) ? py : 99, edge(0, 1) ? T - 1 - py : 99);
        if (e < 7 && vnoise(X / 4, Y / 4, 5) * 7 > e + 1.5) gg = 0;
      }
    }
    type[Y * W + X] = gg;
  }
  const tp = (X, Y) => (X < 0 || Y < 0 || X >= W || Y >= H ? 0 : type[Y * W + X]);
  const img = new ImageData(W, H), D = img.data;
  const pc = { x: 44.5 * T, y: 31 * T };
  for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) {
    const t = type[Y * W + X]; let c;
    if (t === 0) {
      c = grassRGB(X, Y);
      // ขอบหญ้าที่ติดทางดินด้านล่าง: ปลายหญ้ารับแสง
      if (tp(X, Y + 1) === 1 || tp(X, Y + 2) === 1) c = tone(c, 0.2);
      else if (tp(X - 1, Y) === 1 || tp(X + 1, Y) === 1) c = mul(c, 0.85);
    } else if (t === 1) {
      const pd = Math.hypot(X / T - PLAZA.x, (Y / T - PLAZA.y) * 1.15);
      c = dirtRGB(X, Y, pd < 5.4 ? 0.62 : 0.3);
      let k = 1; while (k <= 14 && tp(X, Y - k) === 1) k++;
      if (k <= 14 && tp(X, Y - k) === 0) { // หญ้าห้อยลงขอบทาง + เงาใต้ขอบ
        const lip = 2 + Math.floor(vnoise(X / 2.5, 7, 32) * 4);
        if (k <= lip) c = mix(G_MID, G_DARK, k / (lip + 1)), c = (X + k) % 3 === 0 ? tone(c, 0.15) : c;
        else { const s = k - lip; if (s <= 8) c = mul(c, 0.66 + s * 0.042); }
      }
      if (tp(X, Y + 1) === 0 && hash(X, Y, 34) < 0.5) c = mix(G_MID, G_LIT, hash(X, Y, 35));
      else if (tp(X, Y + 2) === 0 && hash(X, Y, 36) < 0.25) c = G_MID;
      if (tp(X - 1, Y) === 0) c = mul(c, 0.74); else if (tp(X - 3, Y) === 0) c = mul(c, 0.86); else if (tp(X - 5, Y) === 0) c = mul(c, 0.94);
      if (tp(X + 1, Y) === 0 && hash(X, Y, 37) < 0.5) c = G_MID;
    } else if (t === 2) {
      const dp = clamp(Math.hypot((X - pc.x) / (5.6 * T), (Y - pc.y) / (3.6 * T)), 0, 1);
      c = waterRGB(X, Y, 1 - dp * dp);
      let k = 1; while (k <= 22 && tp(X, Y - k) === 2) k++;
      const ab = tp(X, Y - k);
      if (k <= 22 && (ab === 0 || ab === 1)) { // ตลิ่งหิน
        const lip = ab === 0 ? 3 : 0, s = k - lip;
        if (k <= lip) c = G_MID;
        else if (s <= 10) { const row = s > 5 ? 1 : 0, sx = Math.floor((X + row * 6) / 12), ly = (s - 1) % 5, lx = (X + row * 6) % 12;
          const base = mix([96, 78, 60], [150, 128, 100], hash(sx, row, 41)); c = lx === 0 || ly === 4 ? [40, 32, 26] : ly === 0 ? tone(base, 0.25) : lx > 9 ? tone(base, -0.3) : base; }
        else if (s <= 18) c = mul(c, 0.6 + (s - 10) * 0.05);
      } else if (ab === 3 && k <= 10) c = mul(c, 0.6);
      if ((tp(X, Y + 1) === 0 || tp(X - 1, Y) === 0 || tp(X + 1, Y) === 0) && hash(X, Y, 42) < 0.7) c = [200, 226, 220];
    } else { // ท่าไม้
      const py = Y % 8, h = hash(X >> 3, Y >> 3, 1), base = mix([120, 80, 44], [160, 112, 62], h);
      c = py === 7 ? [52, 32, 18] : py === 0 ? tone(base, 0.2) : (X % 64 === 0) ? mul(base, 0.6) : mul(base, 0.92 + vnoise(X / 6, Y, 3) * 0.16);
      if ((X & 31) === 2 && (py === 3 || py === 4)) c = [60, 60, 66];
    }
    const i = (Y * W + X) * 4; D[i] = c[0]; D[i + 1] = c[1]; D[i + 2] = c[2]; D[i + 3] = 255;
  }
  return { img, type, W, H };
}
