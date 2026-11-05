// 👹 บอสในฉากต่อสู้ — พิกเซลอาร์ตแนวดาร์กแฟนตาซี วาดด้วยโค้ดทั้งหมด (ออกแบบใหม่เอง)
// ทุกตัวมี 3 เฟรม (ผ้าคลุม/ชายผ้าพลิ้ว) + จุดเรืองแสง (ตา อักขระ อาวุธ) ที่ฉากต่อสู้นำไปวาดแสงซ้อนแบบ additive
import { PB, PAL, hex, ramp, pick, blob, outline, hash, mix, tone, clamp, cylLight } from "./world/art.js";

// ---------- เครื่องมือวาด ----------
function scan(pts) {
  let y0 = Infinity, y1 = -Infinity; for (const [, y] of pts) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const rows = [];
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) { const yc = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
      if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + ((yc - ay) / (by - ay)) * (bx - ax)); }
    xs.sort((a, b) => a - b); for (let k = 0; k + 1 < xs.length; k += 2) rows.push([y, xs[k], xs[k + 1]]); }
  return rows;
}
// เติมรูปหลายเหลี่ยม: แรเงาทรงกระบอกตามความกว้างแต่ละแถว + รอยพับผ้า + ไล่สีบนลงล่าง + dither
function fill(pb, pts, R, o = {}) {
  const { bias = 0, fold = 0, foldAmp = 0.2, skew = 0, vg = 0, noise = 0.05, seed = 1, rim = 0.12, dither = 0.018 } = o;
  const rows = scan(pts); if (!rows.length) return;
  const ymin = rows[0][0], ymax = rows[rows.length - 1][0], span = Math.max(1, ymax - ymin);
  for (const [y, a, b] of rows) { const mid = (a + b) / 2, hw = Math.max(1, (b - a) / 2);
    for (let x = Math.ceil(a - 0.5); x <= Math.floor(b - 0.5); x++) { const u = clamp((x + 0.5 - mid) / hw, -1, 1);
      let t = (cylLight(u) - 0.45) * 1.15 + 0.4 + bias + vg * (0.5 - (y - ymin) / span);
      if (fold) t -= foldAmp * Math.pow(0.5 + 0.5 * Math.sin(x * fold + y * skew + seed), 3);
      if (rim && (x - a < 1.2 || b - x < 1.2)) t -= rim;
      t += (hash(x, y, seed) - 0.5) * noise + ((x + y) & 1 ? dither : -dither);
      pb.set(x, y, pick(R, t)); } }
}
// ขอบผ้าขาดรุ่ยตามแนวเส้น (ยื่นลงด้านล่าง) — ph ทำให้แต่ละเฟรมพลิ้วต่างกัน
function jag(x0, y0, x1, y1, len, seed, ph = 0, step = 4) {
  const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / step)), pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n, r = hash(i, seed, 7), w = Math.sin(ph + i * 0.8) * len * 0.18;
    pts.push([x0 + (x1 - x0) * t + w * 0.4, y0 + (y1 - y0) * t + (i % 2 ? len * (0.45 + r * 0.55) : len * r * 0.2) + w]); }
  return pts;
}
// เส้นหนา (แขนขา เขา ไม้เท้า) แรเงาด้านซ้ายสว่าง
function stroke(pb, x0, y0, x1, y1, w0, w1, R, bias = 0) {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2) + 1;
  for (let i = 0; i <= n; i++) { const t = i / n, cx = x0 + (x1 - x0) * t, cy = y0 + (y1 - y0) * t, r = (w0 + (w1 - w0) * t) / 2;
    for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) { const dx = (x + 0.5 - cx) / Math.max(0.5, r), dy = (y + 0.5 - cy) / Math.max(0.5, r);
      if (dx * dx + dy * dy > 1.05) continue; pb.set(x, y, pick(R, 0.55 - dx * 0.35 - dy * 0.15 + bias)); } }
}
const glowPx = (pb, x, y, c) => { pb.set(x, y, mix(c, [255, 255, 255], 0.55)); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) pb.set(x + dx, y + dy, mix(c, [255, 255, 255], 0.15)); };
const bright = (c) => mix(c, [255, 255, 255], 0.25);

// ---------- 1) ผู้คุมวิญญาณไร้หน้า: ผ้าคลุมหัวลอยตัว ใบหน้ามืดสนิทมีแต่ตาเรือง ถือโคมวิญญาณ ----------
function warden(col, ph) {
  const W = 124, H = 136, pb = new PB(W, H), R = ramp([50, 40, 86], 9, -0.9, 0.32), Rm = ramp([68, 54, 108], 9, -0.88, 0.36), G = hex(col), Gl = bright(G);
  const Au = ramp([214, 160, 56], 6, -0.6, 0.45), Sk = ramp([168, 178, 214], 6, -0.6, 0.35), Fe = PAL.iron;
  const sw = (k) => Math.sin(ph + k) * 1.6;
  // ตัวเสื้อคลุม (ชายขาดรุ่ย พลิ้ว)
  fill(pb, [[60, 5], [68, 8], [77, 17], [81, 31], [84, 40], [92, 50], [99, 72], [107 + sw(1), 100], [116 + sw(2), 116], ...jag(116 + sw(2), 116, 6 + sw(3), 116, 17, 3, ph, 3.2), [14 + sw(3), 100], [22, 72], [28, 50], [36, 40], [40, 31], [44, 17], [52, 8]],
    R, { fold: 0.55, skew: 0.06, foldAmp: 0.28, vg: 0.25, seed: 3 });
  // ขอบผ้าคลุมหัว + ช่องหน้ามืด
  fill(pb, [[60, 14], [72, 19], [76, 32], [71, 44], [60, 49], [49, 44], [44, 32], [48, 19]], R, { bias: 0.28, rim: 0, seed: 4 });
  fill(pb, [[60, 17], [70, 22], [73, 32], [69, 42], [60, 46], [51, 42], [47, 32], [50, 22]], ramp([34, 26, 56], 5, -0.95, -0.2), { bias: -0.35, rim: 0, seed: 5 });
  for (let y = 22; y < 45; y++) for (let x = 50; x < 71; x++) { const d = ((x - 60) / 9.5) ** 2 + ((y - 34) / 11) ** 2; if (d < 0.75) pb.set(x, y, mix([6, 4, 14], [22, 16, 40], d)); }
  for (const ex of [55, 65]) { pb.rect(ex - 1, 32, 4, 2, Gl); pb.set(ex, 32, [255, 255, 255]); pb.set(ex + 1, 32, mix(Gl, [255, 255, 255], 0.5)); pb.rect(ex - 1, 34, 4, 1, tone(G, -0.4), 140); }
  // ผ้าคลุมไหล่ (ซ้อนอีกชั้น)
  fill(pb, [[47, 41], [60, 48], [73, 41], [84, 46], [94, 57], [98 + sw(4), 70], ...jag(98 + sw(4), 70, 22 + sw(5), 70, 12, 9, ph, 3.4), [26, 58], [36, 46]], Rm, { fold: 0.7, skew: 0.1, foldAmp: 0.25, bias: 0.06, seed: 9 });
  // แนวกระดุมทอง + ตราอักขระที่อก
  for (let y = 70; y < 116; y++) { pb.set(60, y, R[0]); if (y % 3) { pb.set(58, y, pick(Au, 0.65)); pb.set(62, y, pick(Au, 0.35)); } }
  for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) { const d = Math.abs(x) + Math.abs(y); if (d <= 4) pb.set(60 + x, 58 + y, d === 4 ? Au[1] : d === 3 ? pick(Au, 0.7 - x * 0.06) : d >= 2 ? tone(G, -0.2) : Gl); }
  // แขนซ้าย (ยื่นกรงเล็บ) — ฝั่งที่หันหาผู้เล่น
  fill(pb, [[34, 50], [45, 56], [47, 76], [43, 92], [28, 96], [19, 90], [23, 70]], Rm, { fold: 0.8, foldAmp: 0.22, bias: 0.04, seed: 12 });
  blob(pb, 30, 97, 6, 4, Sk, { bias: 0.05 });
  for (let i = 0; i < 4; i++) stroke(pb, 26 + i * 3, 99, 21 + i * 2.6, 109 + (i % 2) * 2, 2, 1, Sk, 0.05);
  // แขนขวาถือโคมวิญญาณ
  fill(pb, [[86, 50], [98, 60], [104, 78], [100, 90], [88, 92], [82, 76], [80, 58]], Rm, { fold: 0.8, foldAmp: 0.22, bias: -0.1, seed: 14 });
  blob(pb, 95, 93, 5, 3, Sk, { bias: -0.1 });
  for (let y = 95; y < 102; y++) pb.set(96, y, y % 2 ? Fe[4] : Fe[2]);
  pb.rect(91, 102, 11, 2, Fe[3]); pb.rect(92, 101, 9, 1, Fe[5]);
  for (let y = 104; y < 117; y++) for (let x = 91; x < 102; x++) { const fr = x === 91 || x === 101 || x === 96 || y === 110; const d = Math.hypot(x - 96, y - 110) / 7;
    pb.set(x, y, fr ? Fe[x < 96 ? 4 : 2] : mix([255, 255, 255], G, clamp(d * 1.3, 0, 1))); }
  pb.rect(91, 117, 11, 2, Fe[2]);
  return { s: outline(pb, 60, H, -0.85), glow: [[55, 32, 7], [65, 32, 7], [60, 58, 10], [96, 110, 20], [30, 104, 6]] };
}

// ---------- 2) อัศวินหนามเงา: เกราะเหล็ก เขาหนาม ผ้าคลุมขาดกางเหมือนปีก ปักดาบใหญ่ ----------
function knight(col, ph) {
  const W = 160, H = 140, pb = new PB(W, H), cx = 82, G = hex(col), Gl = bright(G);
  const C = ramp([40, 44, 64], 9, -0.9, 0.34), St = ramp([104, 112, 134], 9, -0.86, 0.52), Bl = ramp([46, 72, 130], 9, -0.86, 0.42), Le = ramp([92, 66, 50], 7, -0.8, 0.38);
  const Bn = ramp([214, 200, 172], 6, -0.75, 0.3), Sc = ramp([196, 196, 204], 6, -0.7, 0.3), Au = ramp([214, 160, 56], 6, -0.6, 0.45);
  const fl = (k) => Math.sin(ph + k) * 2.4;
  // ผ้าคลุมกางสองข้าง (อยู่หลังสุด)
  const wingL = [[cx - 8, 38], [cx - 26, 40], [cx - 44, 46], [cx - 60, 58], [cx - 72 + fl(0), 74 + fl(1)], [cx - 77 + fl(0), 86 + fl(1)], ...jag(cx - 76 + fl(0), 88 + fl(1), cx - 18, 108, 16, 11, ph, 3.6), [cx - 14, 70]];
  fill(pb, wingL, C, { fold: 0.5, skew: -0.42, foldAmp: 0.36, bias: 0.02, seed: 21, vg: 0.35 });
  fill(pb, wingL.map(([x, y]) => [2 * cx - x, y]), C, { fold: 0.5, skew: 0.42, foldAmp: 0.36, bias: -0.16, seed: 22, vg: 0.35 });
  // ขาและรองเท้า (ยืนกางขา)
  fill(pb, [[cx - 18, 98], [cx - 8, 100], [cx - 12, 122], [cx - 25, 122]], St, { seed: 30 }); blob(pb, cx - 14, 102, 6, 4, St, { bias: 0.05 });
  fill(pb, [[cx - 26, 119], [cx - 10, 119], [cx - 9, 135], [cx - 36, 135], [cx - 33, 128]], Le, { seed: 31, bias: -0.05 });
  fill(pb, [[cx + 8, 98], [cx + 18, 98], [cx + 24, 122], [cx + 11, 122]], St, { seed: 32, bias: -0.12 }); blob(pb, cx + 13, 101, 6, 4, St, { bias: -0.1 });
  fill(pb, [[cx + 10, 119], [cx + 25, 119], [cx + 30, 135], [cx + 9, 135]], Le, { seed: 33, bias: -0.15 });
  // กระโปรงผ้าคลุมสีน้ำเงิน
  fill(pb, [[cx - 20, 76], [cx + 18, 76], [cx + 25, 96], ...jag(cx + 27, 97, cx - 27, 97, 12, 5, ph, 3.6), [cx - 27, 96]], Bl, { fold: 0.75, foldAmp: 0.3, skew: 0.12, seed: 34 });
  // ลำตัวเกราะ + เข็มขัด
  fill(pb, [[cx - 16, 44], [cx + 16, 44], [cx + 20, 58], [cx + 16, 78], [cx - 16, 78], [cx - 20, 58]], St, { seed: 35 });
  for (let y = 46; y < 76; y++) { pb.set(cx - 1, y, St[7]); pb.set(cx + 1, y, St[2]); }
  for (let y = 58; y < 78; y += 6) for (let x = cx - 15; x < cx + 16; x++) pb.set(x, y, tone(pb.get(x, y) || St[3], -0.35));
  pb.rect(cx - 19, 76, 38, 5, Le[2]); pb.rect(cx - 19, 76, 38, 1, Le[4]); pb.rect(cx - 3, 75, 7, 7, Au[2]); pb.rect(cx - 2, 76, 5, 5, Au[4]); pb.rect(cx - 1, 77, 3, 3, Le[1]);
  // อักขระหนามเรืองแสงที่อก
  for (let k = -5; k <= 5; k++) { glowPx(pb, cx, 60 + k, G); if (Math.abs(k) < 4) glowPx(pb, cx + k, 60, G); }
  // ผ้าพันคอ + บ่าเกราะมีหนาม
  blob(pb, cx, 43, 15, 6, Sc, { jag: 0.35, seed: 4, bias: 0.05 });
  for (const [sx, b] of [[cx - 18, 0.06], [cx + 18, -0.14]]) { blob(pb, sx, 48, 11, 8, St, { bias: b }); for (let i = 0; i < 3; i++) stroke(pb, sx - 5 + i * 5, 42, sx - 7 + i * 5 - (sx < cx ? 2 : -2), 36 - (i === 1 ? 2 : 0), 2.6, 0.8, St, b + 0.1); for (let x = sx - 9; x <= sx + 9; x++) pb.set(x, 50, tone(pb.get(x, 50) || St[3], -0.3)); }
  // หมวกเหล็ก + เขาหนามโค้ง + ช่องตาเรือง
  for (const s of [-1, 1]) { let px = cx + s * 7, py = 26; // เขาโค้งแบบเขาวัวออกข้างแล้วงอนขึ้น
    for (let i = 0; i < 12; i++) { const a = -0.25 - i * 0.16, nx = px + s * Math.cos(a) * 2.6, ny = py + Math.sin(a) * 2.6; stroke(pb, px, py, nx, ny, 5.2 - i * 0.38, 4.8 - i * 0.38, Bn, s > 0 ? -0.18 : 0.02); px = nx; py = ny; } }
  blob(pb, cx, 29, 10, 12, St, { bias: 0.05 }); pb.rect(cx - 9, 30, 19, 3, [14, 14, 22]);
  for (const ex of [cx - 4, cx + 4]) { pb.rect(ex - 1, 31, 3, 1, Gl); pb.set(ex, 31, [255, 255, 255]); }
  for (let y = 20; y < 40; y++) pb.set(cx, y, St[7]);
  // แขนซ้ายจับด้ามดาบที่ปักพื้น
  fill(pb, [[cx - 24, 46], [cx - 16, 52], [cx - 30, 66], [cx - 38, 62]], St, { seed: 40 });
  // ดาบใหญ่
  fill(pb, [[cx - 42, 65], [cx - 33, 65], [cx - 34, 128], [cx - 37.5, 136], [cx - 41, 128]], St, { bias: 0.1, rim: 0.2, seed: 41 });
  for (let y = 68; y < 126; y++) pb.set(cx - 37, y, St[8]);
  for (let y = 72; y < 122; y += 7) glowPx(pb, cx - 38, y, G);
  pb.rect(cx - 49, 62, 24, 3, St[3]); pb.rect(cx - 49, 62, 24, 1, St[6]); pb.rect(cx - 51, 61, 3, 5, Au[3]); pb.rect(cx - 27, 61, 3, 5, Au[2]);
  for (let y = 48; y < 62; y++) pb.rect(cx - 39, y, 3, 1, y % 3 ? Le[3] : Le[1]); blob(pb, cx - 38, 47, 3, 3, Au);
  blob(pb, cx - 36, 62, 5, 5, St, { bias: -0.05 });
  // แขนขวากำหมัดข้างลำตัว
  fill(pb, [[cx + 16, 46], [cx + 24, 50], [cx + 28, 74], [cx + 20, 78], [cx + 16, 60]], St, { bias: -0.15, seed: 42 }); blob(pb, cx + 24, 78, 5, 5, St, { bias: -0.15 });
  return { s: outline(pb, cx, H - 4, -0.85), glow: [[cx - 4, 31, 6], [cx + 4, 31, 6], [cx, 60, 11], [cx - 38, 96, 14]] };
}

// ---------- 3) นักบวชเขากวางแห่งป่าลึก: หน้ากากกะโหลก เขากวางแตกกิ่ง ผ้าคลุมมอสขาดรุ่ย ไม้เท้าคริสตัล ----------
function druid(col, ph) {
  const W = 150, H = 146, pb = new PB(W, H), cx = 78, G = hex(col), Gl = bright(G);
  const Mo = ramp([66, 86, 56], 9, -0.88, 0.38), Ro = ramp([88, 66, 52], 9, -0.86, 0.38), Bn = ramp([232, 220, 192], 7, -0.7, 0.25), An = ramp([176, 156, 124], 6, -0.75, 0.3), Wd = PAL.bark, Sk = ramp([120, 98, 82], 6, -0.6, 0.3);
  const fl = (k) => Math.sin(ph + k) * 1.8;
  // เขากวางแตกกิ่ง (วาดก่อนให้อยู่หลังหัว)
  const branch = (x, y, a, len, w, d, s) => { const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len; stroke(pb, x, y, x2, y2, w, Math.max(1, w * 0.7), An, s > 0 ? -0.12 : 0.02);
    if (d > 0) { branch(x2, y2, a - s * 0.42, len * 0.72, w * 0.72, d - 1, s); if (d > 1) branch(x + (x2 - x) * 0.55, y + (y2 - y) * 0.55, a + s * 0.7, len * 0.55, w * 0.6, d - 2, s); } };
  branch(cx - 5, 22, -2.25, 14, 3.6, 3, -1); branch(cx + 5, 22, -0.89, 14, 3.6, 3, 1);
  // ชุดยาว + รากไม้ที่ชาย
  fill(pb, [[cx - 14, 52], [cx + 14, 52], [cx + 26, 92], [cx + 32 + fl(1), 130], ...jag(cx + 34 + fl(1), 131, cx - 34 + fl(2), 131, 9, 3, ph, 3.4), [cx - 32 + fl(2), 130], [cx - 26, 92]], Ro, { fold: 0.6, foldAmp: 0.3, skew: 0.04, vg: 0.2, seed: 50 });
  for (const [rx, s] of [[cx - 22, -1], [cx - 6, -1], [cx + 10, 1], [cx + 24, 1]]) stroke(pb, rx, 132, rx + s * 7, 139, 2.4, 1, Wd, 0);
  // ฮู้ดมอสหลังหัว
  blob(pb, cx, 32, 13, 15, Mo, { jag: 0.3, seed: 6, bias: -0.15 });
  // ผ้าคลุมไหล่มอส ขอบเป็นเส้นพู่ขาดรุ่ย
  const top = []; for (let k = 0; k <= 14; k++) { const a = Math.PI + (k / 14) * Math.PI; top.push([cx + Math.cos(a) * 40, 64 + Math.sin(a) * 24 - (k % 2 ? 2 : 0)]); }
  fill(pb, [...top, ...jag(cx + 42 + fl(3), 66, cx - 42 + fl(4), 66, 24, 13, ph, 3.2)], Mo, { fold: 1.15, skew: 0.22, foldAmp: 0.34, noise: 0.14, vg: 0.25, seed: 51 });
  for (let i = 0; i < 70; i++) { const x = cx - 38 + Math.floor(hash(i, 1, 51) * 76), y = 44 + Math.floor(hash(i, 2, 51) * 40); if (pb.alpha(x, y)) pb.set(x, y, hash(i, 3, 51) < 0.5 ? Mo[7] : PAL.leafB[6]); }
  // เครื่องรางกระดูกห้อย
  for (const [hx, ln] of [[cx - 22, 10], [cx - 8, 15], [cx + 12, 12], [cx + 26, 8]]) { for (let y = 0; y < ln; y++) pb.set(hx, 80 + y, Wd[2]); blob(pb, hx, 81 + ln, 2, 3, Bn); }
  // หน้ากากกะโหลก
  blob(pb, cx, 32, 8, 10, Bn, { bias: 0.05 }); fill(pb, [[cx - 5, 36], [cx + 5, 36], [cx + 3, 48], [cx - 3, 48]], Bn, { bias: -0.02, rim: 0.15, seed: 52 });
  for (const ex of [cx - 4, cx + 4]) { pb.rect(ex - 2, 31, 4, 4, [26, 16, 18]); pb.set(ex - 1, 32, Gl); pb.set(ex, 32, [255, 255, 255]); pb.set(ex - 1, 33, tone(G, -0.2)); }
  pb.set(cx - 1, 45, [60, 40, 40]); pb.set(cx + 1, 45, [60, 40, 40]); for (let x = cx - 2; x <= cx + 2; x++) pb.set(x, 47, Bn[2]);
  // แขนซ้ายจับไม้เท้า
  fill(pb, [[cx - 30, 56], [cx - 18, 64], [cx - 34, 80], [cx - 42, 76]], Mo, { fold: 1, foldAmp: 0.2, seed: 53 });
  // ไม้เท้าบิดเกลียวกับคริสตัล
  for (let y = 22; y < 142; y++) { const x = cx - 40 + Math.round(Math.sin(y / 7) * 1.2); for (let k = -1; k <= 1; k++) pb.set(x + k, y, pick(Wd, 0.55 - k * 0.25 + (((y + k) % 5) === 0 ? -0.2 : 0))); }
  stroke(pb, cx - 41, 24, cx - 48, 10, 2.4, 1, Wd, 0); stroke(pb, cx - 39, 24, cx - 33, 9, 2.4, 1, Wd, -0.1); stroke(pb, cx - 40, 22, cx - 41, 6, 1.6, 1, Wd, 0);
  for (let y = 6; y < 22; y++) { const hw = 5 - Math.abs(y - 13) * 0.6; for (let x = Math.round(cx - 40 - hw); x <= cx - 40 + hw; x++) { const u = (x - (cx - 40)) / Math.max(1, hw); pb.set(x, y, mix([255, 255, 255], G, clamp(0.25 + u * 0.4 + (y - 6) / 30, 0, 1))); } }
  blob(pb, cx - 40, 78, 4, 4, Sk, { bias: 0.05 });
  // แขนขวาแบมือ มีลูกแก้วพลังลอยเหนือมือ
  fill(pb, [[cx + 18, 58], [cx + 28, 62], [cx + 36, 80], [cx + 28, 84]], Mo, { fold: 1, foldAmp: 0.2, bias: -0.12, seed: 54 }); blob(pb, cx + 33, 84, 4, 3, Sk, { bias: -0.1 });
  for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) { const d = Math.hypot(x, y) / 4.5; if (d < 1) pb.set(cx + 34 + x, 74 + y, mix([255, 255, 255], G, clamp(d * 1.2, 0, 1))); }
  return { s: outline(pb, cx, H - 6, -0.85), glow: [[cx - 4, 32, 6], [cx + 4, 32, 6], [cx - 40, 13, 18], [cx + 34, 74, 14]] };
}

function build(fn, col, extra) {
  const fr = [0, 2.1, 4.2].map((ph) => fn(col, ph));
  const { ax, ay } = fr[0].s; return { frames: fr.map((f) => f.s.c), ax, ay, glow: fr[0].glow.map(([x, y, r]) => [x + 1, y + 1, r]), color: hex(col), ...extra };
}
export const BOSSES = [
  { id: "warden", name: "ผู้คุมวิญญาณไร้หน้า", make: (c) => build(warden, c, { hit: 72, shw: 26, float: 4 }) },
  { id: "knight", name: "อัศวินหนามเงา", make: (c) => build(knight, c, { hit: 74, shw: 44, float: 0 }) },
  { id: "druid", name: "นักบวชเขากวางแห่งป่าลึก", make: (c) => build(druid, c, { hit: 72, shw: 38, float: 0 }) },
];
