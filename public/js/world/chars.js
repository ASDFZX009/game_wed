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

function drawChar(pb, dir, step, L) {
  const skin = ramp(hex(L.skin || "#f2c49a"), 6, -0.6, 0.35), hair = ramp(hex(L.hair || "#3a2a20"), 7, -0.6, 0.55);
  const shirt = ramp(hex(L.shirt || "#5b3df5"), 7, -0.65, 0.45), pants = ramp(hex(L.pants || "#2a3550"), 6, -0.6, 0.4), shoes = ramp(hex(L.shoes || "#3a2418"), 5, -0.5, 0.4);
  const side = dir === 1 || dir === 2, back = dir === 3, oy = step % 2 ? -1 : 0;
  // ผมยาวด้านหลัง
  if (L.long) fillR(pb, 8, 14 + oy, 16, back ? 20 : 15, hair, -0.1);
  // ขา + รองเท้า
  const legs = side ? [[13 + (step === 1 ? 3 : step === 3 ? -3 : 0), 0], [14 + (step === 1 ? -3 : step === 3 ? 3 : 0), 1]] : [[10, step === 1 ? -2 : 0], [17, step === 3 ? -2 : 0]];
  for (const [lx, lift] of legs) { const ly = 37 + oy + (side ? 0 : lift);
    if (!L.dress) fillR(pb, lx, ly, 5, 8, pants, side && lift ? -0.2 : 0); else fillR(pb, lx + 1, ly + 2, 3, 6, skin);
    fillR(pb, lx - (side && dir === 1 ? 1 : 0), ly + 7, 6, 3, shoes); }
  // ลำตัว
  const bx = side ? 10 : 8, bw = side ? 12 : 16;
  for (let y = 25; y < 39; y++) for (let x = bx; x < bx + bw; x++) { if ((y === 25 || y === 38) && (x === bx || x === bx + bw - 1)) continue; const u = (x + 0.5 - bx) / bw * 2 - 1; pb.set(x, y + oy, pick(shirt, cylLight(u) + (y < 27 ? 0.12 : 0) - (y > 35 ? 0.12 : 0))); }
  if (L.dress) for (let y = 33; y < 43; y++) { const ext = (y - 33) * 0.5; for (let x = Math.floor(bx - ext); x < bx + bw + ext; x++) pb.set(x, y + oy, pick(ramp(hex(L.dress), 7, -0.65, 0.45), cylLight((x + 0.5 - bx + ext) / (bw + ext * 2) * 2 - 1) - (y > 40 ? 0.2 : 0))); }
  if (L.apron && !back) fillR(pb, bx + 3, 28 + oy, bw - 6, 11, ramp(hex(L.apron), 6, -0.5, 0.4), 0.05);
  if (!back && !side) { pb.rect(14, 25 + oy, 4, 2, shirt[1]); } // คอเสื้อ
  pb.rect(bx, 35 + oy, bw, 1, shirt[1]);
  // แขน
  const sw = step === 1 ? 2 : step === 3 ? -2 : 0;
  if (!side) { fillR(pb, 5, 27 + oy + sw, 4, 9, shirt, 0.1); fillR(pb, 5, 35 + oy + sw, 4, 3, skin); fillR(pb, 23, 27 + oy - sw, 4, 9, shirt, -0.15); fillR(pb, 23, 35 + oy - sw, 4, 3, skin, -0.1); }
  else { const ax = dir === 1 ? 13 + sw : 15 - sw; fillR(pb, ax, 27 + oy, 4, 9, shirt, dir === 1 ? 0.05 : -0.1); fillR(pb, ax, 35 + oy, 4, 3, skin); }
  // หัว
  const hx = 16, hy = 15 + oy;
  fillE(pb, hx, hy + 1, 10, 9.5, skin, 0.05);
  // ผม
  for (let y = Math.floor(hy - 11); y <= hy + 9; y++) for (let x = 4; x < 28; x++) {
    if (!inE(x, y, hx, hy - 1, 11.5, 10.5)) continue;
    let cover;
    if (back) cover = true;
    else if (side) { const fx = dir === 1 ? x : 31 - x; cover = y < hy - 3 + (fx > 18 ? 9 : fx > 14 ? 2 : 0) - (hash(x, 0, 3) < 0.4 ? 1 : 0); }
    else cover = y < hy - 3 + (x < 8 || x > 23 ? 9 : 0) + ((x * 7) % 5 === 0 ? 2 : 0) - (hash(x, 1, 4) < 0.3 ? 1 : 0);
    if (!cover) continue;
    const t = sphereLight((x + 0.5 - hx) / 12, (y + 0.5 - hy + 2) / 11) + ((x * 3 + y) % 7 === 0 ? 0.12 : 0) - (y > hy + 4 ? 0.15 : 0);
    pb.set(x, y, pick(hair, t));
  }
  // หน้า
  if (!back) {
    const eyes = side ? [dir === 1 ? 9 : 21] : [11, 19];
    for (const ex of eyes) { pb.rect(ex, hy + 2, 2, 4, [36, 26, 30]); pb.set(ex, hy + 2, [250, 250, 255]); pb.set(ex + 1, hy + 5, [90, 70, 80]); }
    if (!side) { pb.set(9, hy + 6, [240, 150, 140]); pb.set(22, hy + 6, [240, 150, 140]); }
    if (L.beard) { for (let y = hy + 6; y < hy + 11; y++) for (let x = side ? (dir === 1 ? 7 : 14) : 10; x < (side ? (dir === 1 ? 18 : 25) : 22); x++) pb.set(x, y, pick(ramp(hex(L.beard), 5, -0.5, 0.4), 0.6 - (y - hy - 6) * 0.08)); }
    else pb.rect(side ? (dir === 1 ? 11 : 18) : 15, hy + 7, 3, 1, [170, 90, 80]);
  }
  // หมวก
  if (L.hat) { const H = ramp(hex(L.hat), 7, -0.6, 0.45); for (let y = hy - 6; y < hy - 2; y++) for (let x = 1; x < 31; x++) if (inE(x, y, 16, hy - 4, 15, 3)) pb.set(x, y, pick(H, 0.6 - (y - hy + 6) * 0.1));
    fillE(pb, 16, hy - 9, 9, 6, H, 0.05); pb.rect(8, hy - 6, 16, 2, ramp(hex(L.band || "#a03a30"), 5, -0.5, 0.4)[2]); }
  if (L.cap) { const C = ramp(hex(L.cap), 7, -0.6, 0.45); fillE(pb, 16, hy - 6, 11, 6, C, 0.05);
    if (dir === 0) pb.rect(7, hy - 2, 18, 2, C[1]); else if (dir === 1) pb.rect(2, hy - 3, 8, 2, C[1]); else if (dir === 2) pb.rect(22, hy - 3, 8, 2, C[1]); }
}
const flipX = (pb) => { const o = new PB(pb.w, pb.h); for (let y = 0; y < pb.h; y++) for (let x = 0; x < pb.w; x++) { const i = (y * pb.w + x) * 4, j = (y * pb.w + (pb.w - 1 - x)) * 4; for (let k = 0; k < 4; k++) o.d[j + k] = pb.d[i + k]; } return o; };
export function charFrame(dir, step, L) {
  let pb = new PB(32, 50);
  drawChar(pb, dir === 2 ? 1 : dir, step, L);
  if (dir === 2) pb = flipX(pb);
  return outline(pb, 16, 47, -0.8);
}
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
