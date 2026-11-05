// ตัวละครความละเอียดสูง (ทรงจิบิ): ทิศ 0 ลง 1 ซ้าย 2 ขวา 3 ขึ้น · ท่าเดิน 4 จังหวะ · แสงจากซ้ายหน้า
import { PB, hex, ramp, pick, sphereLight, cylLight, clamp, hash, outline, blob, canvas } from "./art.js";

const inE = (x, y, cx, cy, rx, ry) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
function fillE(pb, cx, cy, rx, ry, R, bias = 0, tex = 0, seed = 0) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
    if (!inE(x, y, cx, cy, rx, ry)) continue;
    pb.set(x, y, pick(R, sphereLight((x + 0.5 - cx) / rx * 0.9, (y + 0.5 - cy) / ry * 0.9) + bias + (tex ? (hash(x, 0, seed) - 0.5) * tex : 0)));
  }
}
function fillR(pb, x0, y0, w, h, R, bias = 0) { for (let x = 0; x < w; x++) { const l = cylLight((x + 0.5) / w * 2 - 1) + bias; for (let y = 0; y < h; y++) pb.set(x0 + x, y0 + y, pick(R, l - (y === h - 1 ? 0.15 : 0))); } }

// ---------- ตัวละครรุ่นใหม่ (สัดส่วนสูงขึ้น รายละเอียดมากขึ้น) 44×66 ----------
// pose: 0–3 = จังหวะหายใจตอนยืน (ไหล่/หัวขยับ ผม/ชายผ้าพลิ้ว) · +4 = กะพริบตา · step 1–4 = ท่าเดิน (step 0 = ยืน)
export const CHAR = { W: 44, H: 66, ax: 22, ay: 63 };
function trap(pb, cx, y0, y1, w0, w1, R, o = {}) { // เติมรูปทรงที่กว้างเปลี่ยนตามแถว (ลำตัว กระโปรง) แรเงาแบบทรงกระบอก + รอยพับ
  const { bias = 0, fold = 0, sway = 0, shift = 0 } = o;
  for (let y = y0; y < y1; y++) { const t = (y - y0) / Math.max(1, y1 - y0 - 1), w = w0 + (w1 - w0) * t, c = cx + shift + sway * t * t, a = c - w / 2;
    for (let x = Math.floor(a); x < a + w; x++) { const u = clamp((x + 0.5 - c) / (w / 2), -1, 1); let l = cylLight(u) * 0.9 + bias - t * 0.08;
      if (fold && Math.sin((x - c) * fold + 0.6) > 0.82 && t > 0.15) l -= 0.18; if (x < a + 1 || x > a + w - 1.5) l -= 0.15; pb.set(x, y, pick(R, l)); } }
}
function limb(pb, x0, y0, x1, y1, w, R, bias = 0) { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2) + 1;
  for (let i = 0; i <= n; i++) { const t = i / n, cx = x0 + (x1 - x0) * t, cy = y0 + (y1 - y0) * t; for (let y = Math.floor(cy - w / 2); y <= cy + w / 2; y++) for (let x = Math.floor(cx - w / 2); x <= cx + w / 2; x++) { const u = (x + 0.5 - cx) / (w / 2); if (Math.abs(u) > 1.05) continue; pb.set(x, y, pick(R, cylLight(u) * 0.9 + bias)); } } }

function drawChar(pb, dir, step, L, pose = 0) {
  const skin = ramp(hex(L.skin || "#f2c49a"), 7, -0.62, 0.35), hair = ramp(hex(L.hair || "#3a2a20"), 8, -0.65, 0.6);
  const shirt = ramp(hex(L.shirt || "#5b3df5"), 8, -0.7, 0.45), pants = ramp(hex(L.pants || "#2a3550"), 7, -0.65, 0.4), boots = ramp(hex(L.shoes || "#4a2c1c"), 6, -0.55, 0.4);
  const side = dir === 1, back = dir === 3, walk = step > 0, br = pose & 3, blink = (pose & 4) && !back;
  // จังหวะ: เดิน = ยุบ/ยืดตามก้าว · ยืน = หายใจ
  const bob = walk ? (step % 2 === 0 ? -1 : 0) : (br === 1 || br === 2 ? -1 : 0), sway = walk ? (step === 1 ? 1.5 : step === 3 ? -1.5 : 0) : [0, 0.8, 1.2, 0.5][br];
  const swing = walk ? (step === 1 ? 1 : step === 3 ? -1 : 0) : 0, cx = 22, hy = 17 + bob, ty = 30 + bob;
  const long = !!L.long, hairTips = (k) => sway * k;
  // ผมยาวด้านหลัง (อยู่หลังลำตัว)
  if (long) { const hb = back ? 0.1 : -0.12; trap(pb, cx + (side ? 4 : 0), hy + 2, hy + 30, side ? 14 : 22, side ? 12 : 24, hair, { bias: hb, fold: 1.1, sway: hairTips(2) }); }
  // ขา + รองเท้า
  const legY = 46 + bob, legLen = 12 - bob;
  const stride = walk ? [[-3, 1], [0, 0], [3, -1], [0, 0]][step - 1] : [0, 0];
  if (!L.dress) {
    if (side) { for (const [k, sgn] of [[0, 1], [1, -1]]) { const fx = cx + 1 + stride[0] * sgn * 1.4, lift = k === 0 && walk && step % 2 ? -1 : 0; limb(pb, cx + 1, legY, fx, legY + legLen + lift, 6, pants, k ? -0.15 : 0); trap(pb, fx - 1, legY + legLen + lift - 1, legY + legLen + lift + 4, 8, 9, boots, { bias: k ? -0.1 : 0.05 }); } }
    else for (const [lx, sgn] of [[cx - 4, 1], [cx + 4, -1]]) { const lift = walk ? (sgn * swing > 0 ? -2 : 0) : 0; limb(pb, lx, legY, lx, legY + legLen + lift, 7, pants, sgn > 0 ? 0.05 : -0.12); trap(pb, lx, legY + legLen + lift - 1, legY + legLen + lift + 4, 8, 8, boots, { bias: sgn > 0 ? 0.05 : -0.1 }); }
  } else { for (const [lx, sgn] of [[cx - 3, 1], [cx + 3, -1]]) { const lift = walk ? (sgn * swing > 0 ? -2 : 0) : 0; limb(pb, lx, legY + 4, lx, legY + legLen + lift, 4, skin); trap(pb, lx, legY + legLen + lift - 1, legY + legLen + lift + 4, 7, 7, boots); } }
  // แขนด้านหลัง (มุมข้าง)
  const armA = walk ? swing * 3 : 0;
  if (side) limb(pb, cx + 3, ty + 3, cx + 3 + armA, ty + 15, 5, shirt, -0.3);
  // ลำตัว (+ เข็มขัด)
  const tw = side ? 13 : 17;
  trap(pb, cx + (side ? 1 : 0), ty, legY + 1, tw, tw - 2, shirt, { bias: back ? -0.05 : 0, fold: 0.9 });
  for (let x = cx - tw / 2 + (side ? 1 : 0); x < cx + tw / 2 + (side ? 1 : 0); x++) { pb.set(x, legY - 3, pants[1]); pb.set(x, legY - 2, pants[2]); }
  if (!back && !side) { pb.rect(cx - 2, legY - 3, 4, 2, [214, 178, 88]); pb.set(cx - 1, legY - 3, [255, 236, 160]); }
  if (L.dress) { const D = ramp(hex(L.dress), 8, -0.7, 0.45); trap(pb, cx + (side ? 1 : 0), ty + 9, legY + 10, side ? 14 : 16, side ? 20 : 26, D, { fold: 0.75, sway: sway * 1.5 }); for (let x = cx - 12; x < cx + 13; x++) if (pb.get(x, legY + 9)) pb.set(x, legY + 9, D[1]); }
  if (L.apron && !back) { const A = ramp(hex(L.apron), 6, -0.45, 0.35); trap(pb, cx + (side ? -2 : 0), ty + 6, legY + 6, side ? 6 : 11, side ? 7 : 12, A, { bias: 0.05 }); pb.rect(cx - 6, ty + 6, 12, 1, A[1]); }
  // คอเสื้อ / ปก
  if (!back) { if (!side) { for (let k = 0; k < 4; k++) { pb.set(cx - 3 + k, ty + k, shirt[6]); pb.set(cx + 2 - k, ty + k, shirt[6]); } pb.rect(cx - 1, ty, 2, 4, skin[2]); } else pb.rect(cx - 3, ty, 4, 2, shirt[6]); }
  // แขนด้านหน้า + มือ
  if (side) { const ax = cx - 1 - armA; limb(pb, cx - 1, ty + 3, ax, ty + 14, 5, shirt, 0.1); limb(pb, ax, ty + 14, ax - 0.5, ty + 16, 4, skin, 0.1); }
  else for (const [sx, sgn] of [[cx - tw / 2 - 1.5, 1], [cx + tw / 2 + 1.5, -1]]) { const a = walk ? -sgn * swing * 2 : (br === 2 ? sgn * 0.3 : 0), hx = sx + a * (back ? -1 : 1);
    limb(pb, sx, ty + 2, hx, ty + 13, 5, shirt, sgn > 0 ? 0.08 : -0.2); limb(pb, hx, ty + 13, hx, ty + 16, 4.4, skin, sgn > 0 ? 0.05 : -0.15); }
  // คอ + หัว
  pb.rect(cx - 2 + (side ? -1 : 0), hy + 9, 5, 4, skin[1]);
  const fx = side ? cx - 1 : cx;
  fillE(pb, fx, hy, 10, 10.5, skin, 0.05);
  if (side) fillE(pb, fx - 8, hy + 2, 2.2, 2.4, skin, 0.1); // จมูก/แก้มด้านข้าง
  // หน้า
  if (!back) {
    const eyeY = hy + 1, eyes = side ? [fx - 6] : [fx - 5, fx + 3];
    for (const ex of eyes) { if (blink) { pb.rect(ex, eyeY + 2, 3, 1, [60, 36, 40]); continue; }
      pb.rect(ex, eyeY, 3, 4, [250, 248, 252]); pb.rect(ex + (side ? 0 : 1), eyeY + 1, 2, 3, [52, 34, 44]); pb.set(ex + (side ? 0 : 1), eyeY + 1, [255, 255, 255]); pb.rect(ex, eyeY - 1, 3, 1, hair[1]); }
    if (!side) { pb.set(fx - 7, eyeY + 5, [236, 140, 132]); pb.set(fx + 6, eyeY + 5, [236, 140, 132]); pb.set(fx - 1, eyeY + 5, skin[1]); }
    if (L.beard) { const Bd = ramp(hex(L.beard), 6, -0.5, 0.4); for (let y = hy + 5; y < hy + 13; y++) for (let x = fx - (side ? 9 : 7); x < fx + (side ? 2 : 8); x++) { const d = ((x + 0.5 - fx + (side ? 3 : 0)) / 8) ** 2 + ((y - hy - 4) / 9) ** 2; if (d < 1 && y > hy + 4 + Math.abs(x - fx) * 0.2) pb.set(x, y, pick(Bd, 0.6 - (y - hy - 5) * 0.05 + ((x + y) % 3 === 0 ? 0.12 : 0))); } }
    else pb.rect(side ? fx - 7 : fx - 1, hy + 6, side ? 2 : 3, 1, [168, 86, 82]);
  }
  // ผม: เส้นผมโค้งมีไฮไลต์ (แบบในตัวอย่าง) · ปลายผมพลิ้วตามจังหวะ
  for (let y = Math.floor(hy - 12); y <= hy + (long ? 10 : 6); y++) for (let x = fx - 13; x <= fx + 13; x++) {
    const nx = (x + 0.5 - fx) / 11.4, ny = (y + 0.5 - hy + 1.5) / 11; if (nx * nx + ny * ny > 1) continue;
    let cover;
    if (back) cover = true;
    else if (side) { cover = y < hy - 3 || x > fx + 1 - (y - hy) * 0.2 || (y < hy - 1 && x > fx - 6); }
    else { const fringe = hy - 4 + Math.round(Math.sin((x - fx) * 0.9) * 1.2) + (Math.abs(x - fx) > 7 ? 9 : 0); cover = y < fringe; }
    if (!cover) continue;
    const strand = Math.sin(Math.atan2(y - hy + 14, x - fx) * 9 + (x - fx) * 0.15) * 0.5 + 0.5;
    let t = sphereLight(nx * 0.9, ny * 0.9) * 0.75 + 0.12 + (strand > 0.78 ? 0.22 : strand < 0.18 ? -0.18 : 0) - (y > hy + 2 ? 0.12 : 0);
    pb.set(x + Math.round(y > hy ? hairTips(0.6) : 0), y, pick(hair, t));
  }
  if (!long && !back) for (const sx of side ? [fx + 6] : [fx - 10, fx + 9]) for (let y = hy - 2; y < hy + 6; y++) pb.set(sx + Math.round(hairTips(0.5) * (y - hy + 2) / 8), y, pick(hair, 0.4 - (y - hy) * 0.03));
  // หมวกปีกกว้าง / หมวกแก๊ป
  if (L.hat) { const H = ramp(hex(L.hat), 8, -0.65, 0.45), Bd = ramp(hex(L.band || "#a03a30"), 5, -0.5, 0.4);
    for (let y = hy - 9; y < hy - 4; y++) for (let x = fx - 17; x < fx + 18; x++) if (((x + 0.5 - fx) / 17) ** 2 + ((y + 0.5 - hy + 6.5) / 2.8) ** 2 <= 1) pb.set(x, y, pick(H, 0.68 - (y - hy + 9) * 0.1 + ((x * 3 + y) % 5 === 0 ? -0.1 : 0)));
    fillE(pb, fx, hy - 12, 9.5, 6.5, H, 0.05); pb.rect(fx - 9, hy - 9, 19, 2, Bd[2]); pb.rect(fx - 9, hy - 9, 19, 1, Bd[3]); }
  if (L.cap) { const C = ramp(hex(L.cap), 8, -0.65, 0.45); fillE(pb, fx, hy - 8, 11.5, 6.5, C, 0.05); pb.rect(fx - 1, hy - 14, 2, 2, C[6]);
    if (dir === 0) trap(pb, fx, hy - 3, hy - 1, 18, 16, C, { bias: -0.1 }); else if (side) trap(pb, fx - 9, hy - 4, hy - 2, 10, 8, C, { bias: -0.05 }); }
}
const flipX = (pb) => { const o = new PB(pb.w, pb.h); for (let y = 0; y < pb.h; y++) for (let x = 0; x < pb.w; x++) { const i = (y * pb.w + x) * 4, j = (y * pb.w + (pb.w - 1 - x)) * 4; for (let k = 0; k < 4; k++) o.d[j + k] = pb.d[i + k]; } return o; };
export function charFrame(dir, step, L, pose = 0) {
  let pb = new PB(CHAR.W, CHAR.H);
  drawChar(pb, dir === 2 ? 1 : dir, step, L, step ? pose & 4 : pose);
  if (dir === 2) pb = flipX(pb);
  return outline(pb, CHAR.ax, CHAR.ay, -0.8);
}
// จังหวะยืนนิ่ง: หายใจทุก ~1.6 วิ กะพริบตาเป็นพัก ๆ (seed ต่างกันต่อคน)
export function idlePose(t, seed = 0) { const br = Math.floor(t * 2.5 + seed) % 4, bl = ((t + seed * 1.37) % 3.7) < 0.14 ? 4 : 0; return br | bl; }
// สุนัขจิ้งจอกตัวน้อย
export function foxFrame(face, step) {
  let pb = new PB(50, 34); const O = ramp(hex("#e07a2a"), 7, -0.65, 0.45), Wt = ramp(hex("#f4ece0"), 5, -0.4, 0.3), Dk = [40, 26, 22];
  for (let i = 0; i < 16; i++) { const t = i / 15, x = 14 - t * 12, y = 20 - Math.sin(t * 2.6) * 7, r = 4 + Math.sin(t * Math.PI) * 3; blob(pb, x, y, r, r * 0.85, t > 0.78 ? Wt : O, { bias: 0.05 }); }
  blob(pb, 24, 21, 11, 7, O, { bias: 0.08 }); for (let x = 18; x < 32; x++) for (let y = 24; y < 28; y++) if (pb.alpha(x, y)) pb.set(x, y, pick(Wt, 0.5));
  const lg = [[16, step % 2 ? -2 : 0], [21, 0], [28, step % 2 ? 0 : -2], [32, 0]];
  for (const [x, lift] of lg) { pb.rect(x, 26 + lift, 3, 6, O[2]); pb.rect(x, 31 + lift, 3, 2, Dk); }
  blob(pb, 36, 14, 8, 7, O, { bias: 0.1 }); blob(pb, 43, 17, 4.5, 3, Wt, { bias: 0.1 }); pb.rect(46, 15, 2, 2, Dk);
  for (const ex of [31, 37]) for (let k = 0; k < 6; k++) pb.rect(ex + (k >> 1), 9 - k, 4 - (k >> 1), 1, k > 3 ? Dk : O[3]);
  pb.rect(38, 12, 2, 3, Dk); pb.set(38, 12, [255, 255, 255]);
  if (face < 0) pb = flipX(pb);
  return outline(pb, 25, 32, -0.8);
}
// เงาบนพื้นของตัวละคร (ยืดไปทางขวาบนตามทิศแดด)
export function silhouette(src) {
  const [c, x] = canvas(src.width, src.height); x.drawImage(src, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = "#000"; x.fillRect(0, 0, c.width, c.height); return c;
}
