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

// ---------- 4) จอมเวทชาดผู้หลับใหล: เสื้อคลุมแดงชาดคอตั้งสูง มงกุฎอัญมณี หลับตาประสานมือกุมลูกแก้ว ลอยตัว ----------
function lich(col, ph) {
  const W = 128, H = 140, pb = new PB(W, H), cx = 64, G = hex(col), Gl = bright(G);
  const Rb = ramp([132, 40, 64], 9, -0.9, 0.34), Rd = ramp([96, 28, 52], 9, -0.92, 0.3), Tr = ramp([236, 128, 140], 6, -0.55, 0.3), Sk = ramp([150, 160, 214], 7, -0.7, 0.32);
  const Cap = ramp([70, 64, 140], 7, -0.8, 0.35), Au = ramp([214, 160, 56], 6, -0.6, 0.45), fl = (k) => Math.sin(ph + k) * 1.6;
  // คอเสื้อตั้งสูงด้านหลังหัว (บานออกเป็นปีก)
  for (const s of [-1, 1]) { const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([cx + s * (9 + t * 15 + Math.sin(t * Math.PI) * 4), 46 - t * 30 - Math.sin(t * Math.PI) * 2]); }
    pts.push([cx + s * 28, 14]); for (let i = 10; i >= 0; i--) { const t = i / 10; pts.push([cx + s * (16 + t * 13 + Math.sin(t * Math.PI) * 5), 50 - t * 34]); }
    fill(pb, s < 0 ? pts.reverse() : pts, Rd, { bias: s < 0 ? 0.14 : -0.1, seed: 60 + s, rim: 0.12, fold: 0.9, foldAmp: 0.18 });
    for (let i = 0; i <= 24; i++) { const t = i / 24; pb.set(Math.round(cx + s * (16 + t * 13 + Math.sin(t * Math.PI) * 5)), Math.round(50 - t * 34), Tr[s < 0 ? 4 : 2]); } }
  // ชุดยาวลากพื้น
  fill(pb, [[cx - 18, 46], [cx + 18, 46], [cx + 30, 80], [cx + 38 + fl(1), 118], [cx + 44 + fl(1), 132], ...jag(cx + 44 + fl(1), 132, cx - 44 + fl(2), 132, 6, 61, ph, 4), [cx - 44 + fl(2), 132], [cx - 38 + fl(2), 118], [cx - 30, 80]], Rb, { fold: 0.42, foldAmp: 0.32, skew: 0.03, vg: 0.25, seed: 62 });
  // แนวขอบชมพูกลางชุดและชายผ้า
  for (let y = 84; y < 132; y++) { const w = Math.round((y - 84) * 0.12); pb.set(cx - 1 - w, y, Tr[4]); pb.set(cx + 1 + w, y, Tr[2]); for (let x = cx - w; x <= cx + w; x++) pb.set(x, y, Rd[1]); }
  // แขนเสื้อกว้าง (ระฆัง) พับเข้าหามือกลางอก
  for (const s of [-1, 1]) fill(pb, [[cx + s * 16, 46], [cx + s * 30, 56], [cx + s * 44, 96 + fl(3)], [cx + s * 38, 102 + fl(3)], [cx + s * 10, 88], [cx + s * 6, 70]], Rb, { fold: 0.7, foldAmp: 0.28, skew: s * 0.2, bias: s < 0 ? 0.08 : -0.14, seed: 63 + s });
  for (const s of [-1, 1]) for (let i = 0; i < 40; i++) { const t = i / 39, x = cx + s * (44 - t * 34), y = 96 + fl(3) - t * 8 + t * t * 0; pb.set(Math.round(x), Math.round(y + 1), Tr[s < 0 ? 4 : 2]); }
  // มือประสาน + ลูกแก้ว
  blob(pb, cx - 7, 80, 5, 4, Sk, { bias: 0.08 }); blob(pb, cx + 7, 80, 5, 4, Sk, { bias: -0.08 });
  for (let y = -7; y <= 7; y++) for (let x = -7; x <= 7; x++) { const d = Math.hypot(x, y) / 7; if (d < 1) pb.set(cx + x, 72 + y, mix([255, 255, 255], G, clamp(d * 1.25 - (x + y < -4 ? 0.3 : 0), 0, 1))); }
  for (let k = 0; k < 10; k++) { const a = ph * 0.7 + (k / 10) * 6.28; pb.set(Math.round(cx + Math.cos(a) * 10), Math.round(72 + Math.sin(a) * 4), k % 2 ? Gl : G); }
  // ผ้าพันคอสีน้ำเงิน + หน้าซีด หลับตา
  blob(pb, cx, 46, 10, 5, Cap, { bias: -0.05 });
  blob(pb, cx, 33, 8, 10, Sk, { bias: 0.04 });
  for (const ex of [cx - 4, cx + 4]) { for (let i = -2; i <= 2; i++) pb.set(ex + i, 33 + (Math.abs(i) === 2 ? -1 : 0), Sk[0]); pb.set(ex, 34, tone(G, -0.2)); }
  pb.set(cx, 37, Sk[2]); pb.set(cx, 38, Sk[2]); for (let x = cx - 2; x <= cx + 2; x++) pb.set(x, 41, Sk[1]);
  // หมวกครอบ + มงกุฎทองฝังอัญมณี
  blob(pb, cx, 21, 10, 8, Cap, { bias: 0.05 });
  for (let y = 12; y < 30; y++) { pb.set(cx - 1, y, Tr[4]); pb.set(cx, y, Tr[5]); pb.set(cx + 1, y, Tr[3]); }
  for (let x = cx - 10; x <= cx + 10; x++) { const y = 25 - Math.round(Math.abs(x - cx) * 0.12); pb.set(x, y, pick(Au, 0.8 - (x - cx) * 0.03)); pb.set(x, y + 1, pick(Au, 0.4)); }
  for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) { const d = Math.abs(x) + Math.abs(y); if (d <= 3) pb.set(cx + x, 22 + y, d === 3 ? Au[1] : d === 2 ? tone(G, -0.25) : Gl); }
  return { s: outline(pb, cx, H - 4, -0.85), glow: [[cx, 72, 18], [cx, 22, 9], [cx - 4, 34, 4], [cx + 4, 34, 4]] };
}

// ---------- 5) วิญญาณกะโหลกเขาแกะ: ผ้าคลุมขาดรุ่ยปลิวไปด้านหลัง ไฟผีสีฟ้าหลังหัว ปลอกคอเชือกลูกปัด ถือตะเกียงไฟ ----------
function wraith(col, ph) {
  const W = 156, H = 142, pb = new PB(W, H), cx = 66, G = hex(col), Gl = bright(G);
  const Cl = ramp([52, 58, 84], 9, -0.92, 0.36), Cl2 = ramp([70, 78, 108], 9, -0.9, 0.38), Bn = ramp([226, 214, 186], 7, -0.72, 0.26), Hr = ramp([70, 52, 44], 7, -0.85, 0.3);
  const Rp = ramp([150, 112, 64], 6, -0.7, 0.35), Au = ramp([222, 176, 70], 6, -0.6, 0.45), Fe = PAL.iron, Fi = [255, 170, 60], fl = (k) => Math.sin(ph + k) * 2.4;
  // ไฟผีสีฟ้าพลิ้วจากหลังหัวไปทางขวา
  for (let i = 0; i < 46; i++) { const t = i / 45, bx = cx + 6 + t * 62, by = 22 - t * 10 + Math.sin(ph * 1.3 + t * 7) * 4 * t, r = (1 - t) * 9 + 2;
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const d = Math.hypot(x, y) / r; if (d < 1 && hash(Math.round(bx + x), Math.round(by + y), 77) > d * 0.7) pb.set(Math.round(bx + x), Math.round(by + y), mix([236, 255, 255], [96, 210, 220], clamp(d * 0.8 + t * 0.5, 0, 1))); } }
  // ผ้าคลุมใหญ่ ปลิวไปด้านขวาหลัง ขาดรุ่ยเป็นริ้ว
  fill(pb, [[cx - 4, 36], [cx + 20, 40], [cx + 52 + fl(0), 54], [cx + 76 + fl(1), 74], [cx + 84 + fl(2), 98], ...jag(cx + 84 + fl(2), 100, cx - 30 + fl(3), 132, 14, 81, ph, 3.4), [cx - 34 + fl(3), 116], [cx - 30, 84], [cx - 22, 52]], Cl, { fold: 0.36, skew: -0.16, foldAmp: 0.3, vg: 0.3, noise: 0.08, seed: 80 });
  for (let i = 0; i < 9; i++) { const sx = cx + 30 + i * 6 + fl(i), sy = 70 + i * 4; for (let k = 0; k < 18; k++) pb.set(Math.round(sx + k * 0.6), Math.round(sy + k), Cl[k % 3 ? 1 : 0]); }
  // ชั้นผ้าคลุมไหล่
  fill(pb, [[cx - 22, 46], [cx + 20, 44], [cx + 40 + fl(4), 62], ...jag(cx + 42 + fl(4), 64, cx - 30, 70, 12, 82, ph, 3.6), [cx - 30, 62]], Cl2, { fold: 0.9, skew: -0.3, foldAmp: 0.3, bias: 0.05, seed: 83 });
  // เขาแกะม้วนลงข้างหลัง (วาดก่อนหัว)
  for (const s of [-1, 1]) { let px = cx - 4 + s * 6, py = 20, a = -Math.PI / 2 - s * 0.6;
    for (let i = 0; i < 22; i++) { a += s * 0.3; const nx = px + Math.cos(a) * 2.4, ny = py + Math.sin(a) * 2.4; stroke(pb, px, py, nx, ny, 5.4 - i * 0.18, 5.2 - i * 0.18, Hr, s > 0 ? -0.15 : 0.05); px = nx; py = ny; }
    for (let i = 0; i < 6; i++) pb.set(Math.round(cx - 4 + s * (10 + i * 2)), 14 + i, Hr[5]); }
  // กะโหลก
  blob(pb, cx - 4, 28, 9, 10, Bn, { bias: 0.06 }); fill(pb, [[cx - 11, 31], [cx + 3, 31], [cx + 1, 42], [cx - 9, 42]], Bn, { bias: -0.02, rim: 0.14, seed: 84 });
  for (const ex of [cx - 8, cx]) { pb.rect(ex - 2, 26, 5, 5, [20, 16, 26]); pb.set(ex, 28, Gl); pb.set(ex + 1, 28, [255, 255, 255]); pb.set(ex, 29, tone(G, -0.3)); }
  pb.set(cx - 4, 34, [40, 30, 34]); pb.set(cx - 5, 35, [40, 30, 34]); pb.set(cx - 3, 35, [40, 30, 34]);
  for (let x = cx - 8; x <= cx; x++) { pb.set(x, 38, x % 2 ? Bn[5] : [60, 46, 46]); pb.set(x, 40, Bn[2]); }
  // ปลอกคอเชือก + ลูกปัดทอง
  for (let k = 0; k <= 28; k++) { const a = Math.PI * (k / 28), x = cx - 4 + Math.cos(a) * 18, y = 46 + Math.sin(a) * 6; blob(pb, x, y, 2.4, 2.4, Rp, { bias: (k % 3) * 0.1 - 0.1 }); if (k % 4 === 0) blob(pb, x, y + 2, 2, 2, Au, { bias: 0.1 }); }
  for (let k = 0; k < 4; k++) { const x = cx - 14 + k * 7; for (let y = 50; y < 56 + (k % 2) * 3; y++) pb.set(x, y, Rp[1]); blob(pb, x, 57 + (k % 2) * 3, 2, 2, k % 2 ? Bn : Au); }
  // แขนผอมยื่นถือตะเกียง (ด้านหน้า หันหาผู้เล่น)
  fill(pb, [[cx - 22, 58], [cx - 12, 62], [cx - 26, 84], [cx - 34, 80]], Cl2, { fold: 1, foldAmp: 0.2, bias: 0.05, seed: 85 });
  stroke(pb, cx - 30, 82, cx - 36, 88, 3, 2.4, Bn, 0.05); for (let i = 0; i < 3; i++) stroke(pb, cx - 37 + i, 88, cx - 40 + i * 2, 93, 1.6, 1, Bn, 0);
  for (let y = 90; y < 97; y++) pb.set(cx - 38, y, y % 2 ? Fe[4] : Fe[2]);
  pb.rect(cx - 44, 96, 13, 2, Fe[3]); pb.rect(cx - 43, 95, 11, 1, Fe[5]);
  for (let y = 98; y < 112; y++) for (let x = cx - 44; x < cx - 31; x++) { const fr = x === cx - 44 || x === cx - 32 || y === 104 && (x === cx - 44 || x === cx - 32); const d = Math.hypot(x - (cx - 38), y - 106) / 7;
    pb.set(x, y, fr ? Fe[x < cx - 38 ? 4 : 2] : mix([255, 250, 210], Fi, clamp(d * 1.2, 0, 1))); }
  pb.rect(cx - 44, 112, 13, 2, Fe[2]);
  return { s: outline(pb, cx, H - 4, -0.85), glow: [[cx - 8, 28, 6], [cx, 28, 6], [cx - 38, 105, 22], [cx + 30, 14, 16]] };
}

// ---------- 6) นักบวชเงาไม้เท้ากะโหลก: ผ้าคลุมเทาเข้ม หน้ามืดมีแต่ตาแดง ไม้เท้ากะโหลกมือหนึ่ง เปลวไฟในอีกมือ ----------
function reaper(col, ph) {
  const W = 146, H = 148, pb = new PB(W, H), cx = 78, G = hex(col), Gl = bright(G);
  const Rg = ramp([76, 72, 78], 10, -0.92, 0.36), Rh = ramp([96, 80, 70], 8, -0.88, 0.32), Bn = ramp([214, 200, 176], 7, -0.72, 0.26), Wd = ramp([120, 74, 40], 7, -0.8, 0.36), Au = ramp([214, 160, 56], 6, -0.6, 0.45);
  const fl = (k) => Math.sin(ph + k) * 1.8;
  // ไม้เท้า (ซ้าย) + กะโหลกบนยอด
  for (let y = 20; y < 144; y++) { const x = cx - 44 + Math.round(Math.sin(y / 9) * 1.2); for (let k = -1; k <= 1; k++) pb.set(x + k, y, pick(Wd, 0.55 - k * 0.25 + (y % 7 === 0 ? -0.25 : 0))); if (y % 11 === 0) pb.set(x - 2, y, Wd[1]); }
  blob(pb, cx - 44, 14, 9, 9, Bn, { bias: 0.06 }); fill(pb, [[cx - 50, 17], [cx - 38, 17], [cx - 40, 26], [cx - 48, 26]], Bn, { rim: 0.12, seed: 90 });
  for (const ex of [cx - 48, cx - 41]) pb.rect(ex - 1, 12, 4, 4, [30, 22, 22]); pb.set(cx - 44, 19, [40, 30, 30]); pb.set(cx - 45, 20, [40, 30, 30]);
  for (let x = cx - 48; x <= cx - 40; x++) pb.set(x, 23, x % 2 ? Bn[5] : [70, 56, 50]);
  // ชุดยาวทรงระฆัง ชายขาด
  fill(pb, [[cx - 14, 40], [cx + 14, 40], [cx + 28, 74], [cx + 40 + fl(1), 128], ...jag(cx + 42 + fl(1), 130, cx - 40 + fl(2), 130, 12, 91, ph, 3.6), [cx - 38 + fl(2), 128], [cx - 28, 74]], Rg, { fold: 0.55, foldAmp: 0.36, skew: 0.05, vg: 0.25, seed: 92 });
  for (let i = 0; i < 6; i++) { const x0 = cx - 26 + i * 10; for (let y = 78; y < 126; y++) pb.set(Math.round(x0 + (y - 78) * (i - 2.5) * 0.08), y, Rh[i % 2 ? 3 : 2]); }
  // ฮู้ดแหลม + ผ้าคลุมไหล่
  fill(pb, [[cx, 6], [cx + 12, 18], [cx + 18, 34], [cx + 30, 46], [cx + 34, 60], ...jag(cx + 34, 62, cx - 34, 62, 8, 93, ph, 4), [cx - 34, 60], [cx - 30, 46], [cx - 18, 34], [cx - 12, 18]], Rg, { fold: 0.8, foldAmp: 0.26, bias: 0.08, vg: 0.3, seed: 94 });
  fill(pb, [[cx, 16], [cx + 10, 26], [cx + 11, 40], [cx, 46], [cx - 11, 40], [cx - 10, 26]], ramp([24, 20, 26], 5, -0.95, -0.2), { bias: -0.4, rim: 0, seed: 95 });
  for (let y = 24; y < 44; y++) for (let x = cx - 9; x <= cx + 9; x++) { const d = ((x - cx) / 8.5) ** 2 + ((y - 34) / 10) ** 2; if (d < 0.8) pb.set(x, y, mix([4, 2, 6], [16, 12, 18], d)); }
  for (const ex of [cx - 4, cx + 4]) { pb.rect(ex - 1, 32, 3, 2, Gl); pb.set(ex, 32, [255, 255, 255]); }
  // ตราทองที่อก
  for (let x = -5; x <= 5; x++) { const y = 64 + Math.round(Math.abs(x) * 0.5); pb.set(cx + x, y, pick(Au, 0.7 - x * 0.05)); pb.set(cx + x, y + 1, Au[1]); }
  blob(pb, cx, 66, 3, 2, Au, { bias: 0.1 }); pb.set(cx, 66, tone(G, 0.3));
  // แขนซ้ายจับไม้เท้า
  fill(pb, [[cx - 24, 48], [cx - 14, 56], [cx - 34, 80], [cx - 42, 74]], Rg, { fold: 1, foldAmp: 0.22, bias: 0.04, seed: 96 });
  blob(pb, cx - 44, 80, 4, 5, Bn, { bias: 0.04 }); for (let i = 0; i < 3; i++) pb.set(cx - 41, 77 + i * 2, Bn[1]);
  // แขนขวาหงายมือ เปลวไฟลอย
  fill(pb, [[cx + 18, 48], [cx + 28, 56], [cx + 46, 86], [cx + 38, 92], [cx + 22, 72]], Rg, { fold: 1, foldAmp: 0.22, bias: -0.14, seed: 97 });
  blob(pb, cx + 44, 90, 5, 3, Bn, { bias: -0.1 });
  const fx = cx + 45, fy = 86, fh = 22 + fl(0) * 1.5;
  for (let y = 0; y < fh; y++) { const t = y / fh, hw = Math.sin((1 - t) * Math.PI * 0.9) * 8 * (1 - t * 0.4) + Math.sin(ph * 2 + y * 0.6) * 1.2 * t;
    for (let x = -hw; x <= hw; x++) { const u = Math.abs(x) / Math.max(1, hw); pb.set(Math.round(fx + x + Math.sin(ph + t * 4) * t * 3), Math.round(fy - y), mix([255, 248, 200], u > 0.6 || t > 0.6 ? [216, 52, 30] : [255, 140, 40], clamp(u * 0.9 + t * 0.7, 0, 1))); } }
  for (let i = 0; i < 9; i++) { const ex = fx - 6 + hash(i, 3, 98) * 14 + fl(i) * 2, ey = fy - fh - 2 - hash(i, 4, 98) * 16; pb.set(Math.round(ex), Math.round(ey), i % 2 ? [255, 120, 40] : [200, 40, 30]); }
  return { s: outline(pb, cx, H - 6, -0.85), glow: [[cx - 4, 32, 6], [cx + 4, 32, 6], [fx, fy - 10, 22], [cx - 44, 14, 10]] };
}

// ---------- 7) จ้าวปีกราตรี (ตำนาน): ปีศาจปีกค้างคาวขาดวิ่น เขาโค้งไปหน้า ตาม่วงเรือง หางปลายหอก ลอยเหนือพื้น ----------
function shade(col, ph) {
  const W = 190, H = 150, pb = new PB(W, H), cx = 96, G = hex(col), Gl = bright(G);
  const Bd = ramp([46, 36, 76], 10, -0.92, 0.36), Wm = ramp([84, 44, 104], 9, -0.9, 0.34), Bo = ramp([60, 50, 92], 8, -0.88, 0.4), Hn = ramp([150, 136, 168], 7, -0.8, 0.3), Cw = ramp([220, 210, 236], 5, -0.6, 0.2);
  const fl = (k) => Math.sin(ph + k) * 3;
  // ปีกสองข้าง: เยื่อปีก + กระดูกนิ้วปีก ขอบล่างเป็นลอนขาด
  for (const s of [-1, 1]) {
    const sh = [cx + s * 10, 52], tip = [cx + s * 88, 10 + fl(0)], elbow = [cx + s * 44, 22 + fl(0) * 0.5];
    const lows = [[cx + s * 86, 64 + fl(1)], [cx + s * 70, 54 + fl(1)], [cx + s * 62, 82 + fl(2)], [cx + s * 46, 66], [cx + s * 36, 92 + fl(2)], [cx + s * 24, 72], [cx + s * 14, 86]];
    const poly = [sh, elbow, tip, ...lows]; if (s < 0) poly.reverse();
    fill(pb, poly, Wm, { fold: 0.22, skew: s * 0.35, foldAmp: 0.16, bias: s < 0 ? 0.04 : -0.14, vg: 0.3, noise: 0.07, seed: 100 + s });
    for (let i = 0; i < 18; i++) { const a = hash(i, s + 5, 101), x = cx + s * (20 + a * 64), y = 30 + hash(i, s + 6, 101) * 40; if (pb.alpha(x, y)) pb.set(x, y, Wm[1]); }
    stroke(pb, sh[0], sh[1], elbow[0], elbow[1], 5, 4, Bo, 0.05); stroke(pb, elbow[0], elbow[1], tip[0], tip[1], 4, 1.5, Bo, 0);
    for (const [lx, ly] of [lows[1], lows[3], lows[5]]) stroke(pb, elbow[0], elbow[1], lx, ly, 2.6, 1.2, Bo, -0.05);
    for (let k = 0; k < 3; k++) pb.set(Math.round(elbow[0] + s * k), Math.round(elbow[1] - 3 - k), Cw[3]);
  }
  // หางปลายหอก
  { let px = cx + 4, py = 96, a = 1.2; for (let i = 0; i < 26; i++) { a -= 0.07; const nx = px + Math.cos(a) * 2.6, ny = py + Math.sin(a) * 2.6; stroke(pb, px, py, nx, ny, 5 - i * 0.14, 4.8 - i * 0.14, Bd, -0.05); px = nx; py = ny; }
    fill(pb, [[px - 2, py + 3], [px + 9, py - 6], [px + 4, py + 6], [px + 8, py + 12]], Bo, { bias: 0.1, rim: 0.1, seed: 102 }); pb.set(Math.round(px + 6), Math.round(py), Gl); }
  // ขาพับใต้ตัว + กรงเล็บ
  for (const [s, b] of [[-1, 0.05], [1, -0.12]]) { stroke(pb, cx + s * 8, 90, cx + s * 16, 104, 7, 5.6, Bd, b); stroke(pb, cx + s * 16, 104, cx + s * 10, 118, 5, 3.6, Bd, b);
    for (let i = 0; i < 3; i++) stroke(pb, cx + s * 10 - 3 + i * 3, 118, cx + s * 10 - 4 + i * 3.6, 124, 1.8, 0.8, Cw, 0); }
  // ลำตัวเกราะกระดูก
  fill(pb, [[cx - 19, 46], [cx + 19, 46], [cx + 15, 62], [cx + 8, 80], [cx + 9, 94], [cx - 9, 94], [cx - 8, 80], [cx - 15, 62]], Bd, { seed: 103, bias: 0.06 });
  for (let k = 0; k < 4; k++) { const y = 54 + k * 6; for (let x = cx - 14 + k * 2; x <= cx + 14 - k * 2; x++) if (Math.abs(x - cx) > 2) pb.set(x, y + Math.round(Math.abs(x - cx) * 0.25), tone(pb.get(x, y) || Bd[4], -0.45)); }
  for (const s of [-1, 1]) blob(pb, cx + s * 18, 50, 7, 6, Bo, { bias: s < 0 ? 0.12 : -0.1 });
  for (let k = -4; k <= 4; k++) { glowPx(pb, cx, 62 + k * 2, G); }
  fill(pb, [[cx - 12, 84], [cx + 12, 84], [cx + 16 + fl(3) * 0.5, 104], ...jag(cx + 18 + fl(3) * 0.5, 106, cx - 18 + fl(4) * 0.5, 106, 12, 107, ph, 3.4), [cx - 16 + fl(4) * 0.5, 104]], Wm, { fold: 0.9, foldAmp: 0.3, bias: -0.1, seed: 108 });
  for (let x = cx - 12; x <= cx + 12; x++) { pb.set(x, 84, Bo[5]); pb.set(x, 85, Bo[2]); }
  // แขนยาวยื่นกรงเล็บไปทางผู้เล่น
  stroke(pb, cx - 20, 52, cx - 34, 70, 6, 5, Bd, 0.08); stroke(pb, cx - 34, 70, cx - 46, 64, 5, 4, Bd, 0.08); blob(pb, cx - 34, 70, 3.5, 3.5, Bo, { bias: 0.1 });
  blob(pb, cx - 47, 64, 3.5, 3, Bd, { bias: 0.1 }); for (let i = 0; i < 4; i++) { const a = -0.9 + i * 0.5; stroke(pb, cx - 49, 64, cx - 49 + Math.cos(Math.PI + a) * 6, 64 + Math.sin(Math.PI + a) * 6, 1.8, 0.8, Cw, 0.05); }
  stroke(pb, cx + 20, 52, cx + 30, 72, 6, 5, Bd, -0.16); stroke(pb, cx + 30, 72, cx + 26, 86, 5, 4, Bd, -0.16);
  for (let i = 0; i < 3; i++) stroke(pb, cx + 24 + i * 2, 86, cx + 22 + i * 3, 92, 1.6, 0.8, Cw, 0);
  // หัว: เขาโค้งไปข้างหน้า ตาม่วงเรือง ปากเรืองแสง
  for (const s of [-1, 1]) { let px = cx + s * 7, py = 28, a = -Math.PI / 2 + s * 1.2; for (let i = 0; i < 10; i++) { a -= s * (i < 4 ? 0.05 : 0.2); const nx = px + Math.cos(a) * 2.4, ny = py + Math.sin(a) * 2.4; stroke(pb, px, py, nx, ny, 6 - i * 0.5, 5.6 - i * 0.5, Hn, s > 0 ? -0.15 : 0.05); px = nx; py = ny; } }
  fill(pb, [[cx - 9, 26], [cx + 9, 26], [cx + 11, 34], [cx + 6, 46], [cx, 49], [cx - 6, 46], [cx - 11, 34]], Bd, { bias: 0.1, rim: 0.12, seed: 106 });
  for (let x = cx - 8; x <= cx + 8; x++) pb.set(x, 30, tone(pb.get(x, 30) || Bd[5], -0.3));
  for (const s of [-1, 1]) { const ex = cx + s * 5; for (let i = 0; i < 4; i++) pb.set(ex + s * i, 32 + Math.round(i * 0.5), i < 2 ? [255, 255, 255] : Gl); pb.set(ex + s, 33, Gl); }
  for (let x = cx - 4; x <= cx + 4; x++) pb.set(x, 41, tone(G, -0.2)); for (const fx2 of [cx - 3, cx + 3]) { pb.set(fx2, 42, Cw[4]); pb.set(fx2, 43, Cw[3]); }
  // เศษผลึกรูนลอยรอบหัว
  for (let k = 0; k < 5; k++) { const a = ph * 0.6 + (k / 5) * 6.28, rx = cx + Math.cos(a) * 26, ry = 22 + Math.sin(a) * 6; for (const [dx, dy] of [[0, -2], [-1, 0], [0, 0], [1, 0], [0, 2], [0, -1], [0, 1]]) pb.set(Math.round(rx + dx), Math.round(ry + dy), dx || Math.abs(dy) === 2 ? G : Gl); }
  return { s: outline(pb, cx, H - 8, -0.85), glow: [[cx - 5, 33, 7], [cx + 5, 33, 7], [cx, 62, 14], [cx, 42, 8]] };
}

function build(fn, col, extra) {
  const fr = [0, 2.1, 4.2].map((ph) => fn(col, ph));
  const { ax, ay } = fr[0].s; return { frames: fr.map((f) => f.s.c), ax, ay, glow: fr[0].glow.map(([x, y, r]) => [x + 1, y + 1, r]), color: hex(col), ...extra };
}
export const BOSSES = [
  { id: "warden", name: "ผู้คุมวิญญาณไร้หน้า", make: (c) => build(warden, c, { hit: 72, shw: 26, float: 4 }) },
  { id: "knight", name: "อัศวินหนามเงา", make: (c) => build(knight, c, { hit: 74, shw: 44, float: 0 }) },
  { id: "druid", name: "นักบวชเขากวางแห่งป่าลึก", make: (c) => build(druid, c, { hit: 72, shw: 38, float: 0 }) },
  { id: "wraith", name: "วิญญาณกะโหลกเขาแกะ", make: (c) => build(wraith, c, { hit: 70, shw: 34, float: 5 }) },
  { id: "reaper", name: "นักบวชเงาไม้เท้ากะโหลก", make: (c) => build(reaper, c, { hit: 74, shw: 40, float: 0 }) },
  { id: "lich", name: "จอมเวทชาดผู้หลับใหล", make: (c) => build(lich, c, { hit: 72, shw: 32, float: 7 }) },
  { id: "shade", name: "จ้าวปีกราตรี", make: (c) => build(shade, c, { hit: 66, shw: 30, float: 3 }) },
];
