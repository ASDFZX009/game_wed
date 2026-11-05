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
// ทุ่งดอกไม้เป็นแถว (ร่องดิน + กอดอกไม้สีต่างกันทีละแถว)
const F_COL = [[226, 64, 74], [246, 196, 60], [168, 98, 220], [240, 130, 180], [250, 246, 236], [240, 140, 50]];
export function farmRGB(X, Y) {
  const RH = 18, ry = Y % RH, row = Math.floor(Y / RH), col = F_COL[(row * 5 + 2) % 6];
  if (ry < 4) { const c = mix([70, 44, 26], [104, 68, 38], vnoise(X / 5, Y, 62)); return ry === 0 ? tone(c, 0.18) : ry === 3 ? mul(c, 0.78) : c; }
  let c = mix([34, 62, 22], [74, 108, 38], clamp(vnoise(X / 3, Y / 2, 63) * 0.7 + (ry - 4) / 26, 0, 1));
  if (hash(X >> 1, Y >> 1, 66) < 0.12) c = mix(c, [110, 150, 50], 0.5); // ใบ
  const i = Math.floor(X / 9), cx = i * 9 + 4.5 + (hash(i, row, 64) - 0.5) * 2, cy = row * RH + 10 + (hash(i, row, 65) - 0.5) * 3;
  const dx = X + 0.5 - cx, dy = Y + 0.5 - cy, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx), petal = 2.6 + Math.cos(a * 5 + i) * 0.9;
  if (d < 1.2) c = [255, 222, 90];
  else if (d < petal) c = dx + dy < -1 ? tone(col, 0.32) : dx + dy > 1.6 ? tone(col, -0.28) : col;
  else if (d < petal + 1.6 && dy > 0.5) c = mul(c, 0.68);
  return c;
}
// ลานหินโบราณ (แผ่นหินแบนวางเหลื่อม มีรอยร้าวและมอส)
export function flagRGB(X, Y) {
  const ry = Math.floor(Y / 14), off = (ry & 1) * 11, cx = Math.floor((X + off) / 22), lx = (X + off) % 22, ly = Y % 14, h = hash(cx, ry, 71);
  if (lx === 0 || ly === 0) return hash(X, Y, 75) < 0.5 ? [52, 70, 34] : [40, 52, 28];
  let c = mix([92, 98, 102], [146, 148, 142], h * 0.7 + vnoise(X / 7, Y / 7, 72) * 0.3);
  if (ly === 1 || lx === 1) c = tone(c, 0.2); else if (ly === 13 || lx === 21) c = tone(c, -0.3);
  if (vnoise(X / 4, Y / 4, 73) > 0.78) c = mix(c, [70, 98, 40], 0.65);
  if (hash(cx, ry, 74) < 0.3 && Math.abs(lx - 6 - (ly * 0.8 | 0)) < 1) c = tone(c, -0.45);
  return c;
}

// ชนิดพื้นรายพิกเซลทั้งแผนที่ (เร็ว: นอยส์เฉพาะใกล้ลานกลางและขอบทาง)
export function groundTypes(M, PLAZA) {
  const W = M.MW * T, H = M.MH * T, type = new Uint8Array(W * H);
  const SH = M.shapes || { lakes: [], island: null, flag: null };
  const lakeV = (X, Y) => { let v = 9; for (const L of SH.lakes) v = Math.min(v, Math.hypot((X / T - L.x) / L.rx, (Y / T - L.y) / L.ry)); return v; };
  const nearLake = (tx, ty) => SH.lakes.some((L) => Math.abs(tx + 0.5 - L.x) < L.rx + 2 && Math.abs(ty + 0.5 - L.y) < L.ry + 2);
  for (let ty = 0; ty < M.MH; ty++) for (let tx = 0; tx < M.MW; tx++) {
    const g0 = M.ground[M.at(tx, ty)];
    // ขอบทะเลสาบ / เกาะ / ลานหิน: คำนวณรายพิกเซลให้โค้งมน (แทนขอบเหลี่ยมตามช่อง)
    if ((g0 === 0 || g0 === 2) && nearLake(tx, ty) && !M.block2?.[M.at(tx, ty)]) {
      for (let py = 0; py < T; py++) for (let px = 0; px < T; px++) { const X = tx * T + px, Y = ty * T + py, n = (vnoise(X / 9, Y / 9, 51) - 0.5) * 0.12;
        let water = lakeV(X, Y) + n < 1; const I = SH.island; if (I && Math.hypot(X / T - I.x, (Y / T - I.y) * 1.2) + n * 2 < I.r) water = false;
        type[Y * W + X] = water ? 2 : g0 === 2 ? 0 : 0; }
      continue; }
    if (g0 === 5 && SH.flag) { const F = SH.flag;
      for (let py = 0; py < T; py++) for (let px = 0; px < T; px++) { const X = tx * T + px, Y = ty * T + py; type[Y * W + X] = Math.hypot((X / T - F.x) / F.rx, (Y / T - F.y) / F.ry) + (vnoise(X / 7, Y / 7, 52) - 0.5) * 0.18 < 1 ? 5 : 0; }
      continue; }
    const g = g0, nearPlaza = Math.abs(tx + 0.5 - PLAZA.x) < 6.5 && Math.abs(ty + 0.5 - PLAZA.y) < 6;
    const edgeOf = (dx, dy) => M.ground[M.at(clamp(tx + dx, 0, M.MW - 1), clamp(ty + dy, 0, M.MH - 1))] === 0;
    const pathEdge = g === 1 && (edgeOf(-1, 0) || edgeOf(1, 0) || edgeOf(0, -1) || edgeOf(0, 1));
    for (let py = 0; py < T; py++) for (let px = 0; px < T; px++) {
      const X = tx * T + px, Y = ty * T + py; let gg = g;
      if (g <= 1 && nearPlaza) {
        const pd = Math.hypot(X / T - PLAZA.x, (Y / T - PLAZA.y) * 1.15) + (vnoise(X / 5, Y / 5, 4) - 0.5) * 0.16, inRing = pd > 3.5 && pd < 4.8, nearRing = pd > 3.1 && pd < 5.2;
        if (g === 1 && nearRing && !inRing) gg = 0; else if (g === 0 && inRing) gg = 1;
        else if (g === 1 && !nearRing && pathEdge) { const e = Math.min(edgeOf(-1, 0) ? px : 99, edgeOf(1, 0) ? T - 1 - px : 99, edgeOf(0, -1) ? py : 99, edgeOf(0, 1) ? T - 1 - py : 99); if (e < 7 && vnoise(X / 4, Y / 4, 5) * 7 > e + 1.5) gg = 0; }
      } else if (pathEdge) { const e = Math.min(edgeOf(-1, 0) ? px : 99, edgeOf(1, 0) ? T - 1 - px : 99, edgeOf(0, -1) ? py : 99, edgeOf(0, 1) ? T - 1 - py : 99); if (e < 7 && vnoise(X / 4, Y / 4, 5) * 7 > e + 1.5) gg = 0; }
      type[Y * W + X] = gg;
    }
  }
  return { type, W, H };
}

// ระบายสีพื้นทีละแถวในสี่เหลี่ยมหนึ่ง (เรียกซ้ำได้จนครบ เพื่อแบ่งงานข้ามเฟรม)
export function groundBaker(M, PLAZA, G, X0, Y0, w, h) {
  const { type, W, H } = G, img = new ImageData(w, h), D = img.data;
  const tp = (X, Y) => (X < 0 || Y < 0 || X >= W || Y >= H ? 0 : type[Y * W + X]);
  const wd = (X, Y) => { const fx = X / T - 0.5, fy = Y / T - 0.5, x0 = Math.floor(fx), y0 = Math.floor(fy), u = fx - x0, v = fy - y0, s = (x, y) => (M.inb(x, y) ? M.wdist[M.at(x, y)] : 0);
    return s(x0, y0) * (1 - u) * (1 - v) + s(x0 + 1, y0) * u * (1 - v) + s(x0, y0 + 1) * (1 - u) * v + s(x0 + 1, y0 + 1) * u * v; };
  let row = 0;
  function px(X, Y) {
    const t = type[Y * W + X]; let c;
    if (t === 0) {
      c = grassRGB(X, Y);
      if (tp(X, Y + 1) === 1 || tp(X, Y + 2) === 1) c = tone(c, 0.2);
      else if (tp(X - 1, Y) === 1 || tp(X + 1, Y) === 1) c = mul(c, 0.85);
    } else if (t === 1) {
      const pd = Math.hypot(X / T - PLAZA.x, (Y / T - PLAZA.y) * 1.15);
      c = dirtRGB(X, Y, pd < 5.4 ? 0.62 : 0.3);
      let k = 1; while (k <= 14 && tp(X, Y - k) === 1) k++;
      if (k <= 14 && tp(X, Y - k) === 0) { const lip = 2 + Math.floor(vnoise(X / 2.5, 7, 32) * 4);
        if (k <= lip) c = mix(G_MID, G_DARK, k / (lip + 1)), c = (X + k) % 3 === 0 ? tone(c, 0.15) : c;
        else { const s = k - lip; if (s <= 8) c = mul(c, 0.66 + s * 0.042); } }
      if (tp(X, Y + 1) === 0 && hash(X, Y, 34) < 0.5) c = mix(G_MID, G_LIT, hash(X, Y, 35));
      else if (tp(X, Y + 2) === 0 && hash(X, Y, 36) < 0.25) c = G_MID;
      if (tp(X - 1, Y) === 0) c = mul(c, 0.74); else if (tp(X - 3, Y) === 0) c = mul(c, 0.86); else if (tp(X - 5, Y) === 0) c = mul(c, 0.94);
      if (tp(X + 1, Y) === 0 && hash(X, Y, 37) < 0.5) c = G_MID;
    } else if (t === 2) {
      const dp = clamp(wd(X, Y) / 3.6, 0, 1);
      c = waterRGB(X, Y, dp * (2 - dp));
      let k = 1; while (k <= 22 && tp(X, Y - k) === 2) k++;
      const ab = tp(X, Y - k);
      if (k <= 22 && ab !== 2 && ab !== 3) { const lip = ab === 0 ? 3 : 0, s = k - lip;
        if (k <= lip) c = G_MID;
        else if (s <= 10) { const r2 = s > 5 ? 1 : 0, sx = Math.floor((X + r2 * 6) / 12), ly = (s - 1) % 5, lx = (X + r2 * 6) % 12;
          const base = mix([96, 78, 60], [150, 128, 100], hash(sx, r2, 41)); c = lx === 0 || ly === 4 ? [40, 32, 26] : ly === 0 ? tone(base, 0.25) : lx > 9 ? tone(base, -0.3) : base; }
        else if (s <= 18) c = mul(c, 0.6 + (s - 10) * 0.05);
      } else if (ab === 3 && k <= 10) c = mul(c, 0.6);
      const sideG = (q) => q !== 2 && q !== 3;
      if ((sideG(tp(X, Y + 1)) || sideG(tp(X - 1, Y)) || sideG(tp(X + 1, Y))) && hash(X, Y, 42) < 0.7) c = [200, 226, 220];
    } else if (t === 3) { // ท่าไม้/สะพาน
      const py = Y % 8, h = hash(X >> 3, Y >> 3, 1), base = mix([120, 80, 44], [160, 112, 62], h);
      c = py === 7 ? [52, 32, 18] : py === 0 ? tone(base, 0.2) : (X % 64 === 0) ? mul(base, 0.6) : mul(base, 0.92 + vnoise(X / 6, Y, 3) * 0.16);
      if ((X & 31) === 2 && (py === 3 || py === 4)) c = [60, 60, 66];
    } else c = t === 4 ? farmRGB(X, Y) : flagRGB(X, Y);
    if (t >= 4) { let k = 1; while (k <= 3 && tp(X, Y - k) === t) k++; if (k <= 3 && tp(X, Y - k) === 0) c = mix(G_MID, G_DARK, k / 4); else if (tp(X, Y + 1) === 0) c = mul(c, 0.7); }
    return c;
  }
  return {
    img, done: false, x: X0, y: Y0, w, h,
    step(budgetMs = 1e9) { const t0 = performance.now();
      while (row < h) { const Y = Y0 + row; for (let i = 0; i < w; i++) { const c = px(X0 + i, Y), k = (row * w + i) * 4; D[k] = c[0]; D[k + 1] = c[1]; D[k + 2] = c[2]; D[k + 3] = 255; }
        row++; if ((row & 3) === 0 && performance.now() - t0 > budgetMs) break; }
      this.done = row >= h; return this.done; },
  };
}
