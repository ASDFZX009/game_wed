// 🪧 ป้ายประจำบ้านวิชา (พิกเซลอาร์ตความละเอียดสูง วาดด้วยโค้ด ไม่มีตัวหนังสือ)
// ป้ายไม้ + พุ่มใบไม้ + ไอคอนของวิชา · เอฟเฟกต์วงแสงหมุนและอนุภาคประจำวิชาวาดสดในหมู่บ้าน (drawSignFx)
import { PB, PAL, hex, ramp, pick, blob, outline, hash, mix, tone, clamp, cylLight, sphereLight } from "./art.js";

export const SIGN = { W: 104, H: 82 };
export const SIGN_FX = {
  math: { c: "#3a9aff", c2: "#9ad8ff", p: "spark" }, science: { c: "#3cd04a", c2: "#c8ff8a", p: "leaf" }, thai: { c: "#ff5aa8", c2: "#ffd0e8", p: "petal" },
  english: { c: "#3a6aff", c2: "#ff4a4a", p: "star" }, social: { c: "#ffa020", c2: "#ffe080", p: "spark" }, health: { c: "#3ce04a", c2: "#d0ffb0", p: "plus" },
  early: { c: "#ffc820", c2: "#ff8ac8", p: "cube" }, brain: { c: "#b05aff", c2: "#ffb0f0", p: "puzzle" }, general: { c: "#2ab8ff", c2: "#fff080", p: "bulb" },
};

// ---------- เครื่องมือวาด ----------
const R = (h, n = 7, lo = -0.75, hi = 0.5) => ramp(hex(h), n, lo, hi);
function poly(pb, pts, Rp, bias = 0) {
  let y0 = Infinity, y1 = -Infinity; for (const [, y] of pts) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) { const yc = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + ((yc - ay) / (by - ay)) * (bx - ax)); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) { const a = xs[k], b = xs[k + 1], mid = (a + b) / 2, hw = Math.max(1, (b - a) / 2);
      for (let x = Math.ceil(a - 0.5); x <= Math.floor(b - 0.5); x++) pb.set(x, y, pick(Rp, cylLight(clamp((x + 0.5 - mid) / hw, -1, 1)) * 0.85 + bias - (y - y0) / (y1 - y0 + 1) * 0.15)); } }
}
// กล่องนูน: ขอบบน/ซ้ายสว่าง ขอบล่าง/ขวามืด
function box(pb, x, y, w, h, Rp, bias = 0) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { let t = 0.55 + bias; if (j === 0 || i === 0) t += 0.25; else if (j === h - 1 || i === w - 1) t -= 0.3; else t += (cylLight((i + 0.5) / w * 2 - 1) - 0.6) * 0.3; pb.set(x + i, y + j, pick(Rp, t)); }
}
function line(pb, x0, y0, x1, y1, c, w = 1) { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2) + 1; for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; pb.rect(Math.round(x - (w - 1) / 2), Math.round(y - (w - 1) / 2), w, w, c); } }
function ell(pb, cx, cy, rx, ry, c, th = 1, a0 = 0, a1 = 6.3) { for (let a = a0; a < a1; a += 0.02) for (let k = 0; k < th; k++) pb.set(Math.round(cx + Math.cos(a) * (rx - k)), Math.round(cy + Math.sin(a) * (ry - k)), c); }
// ตัวอักษรพิกเซล 5×7 (ใช้บนบล็อกของเล่น ไม่ใช่ข้อความบนป้าย)
const GL = { A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"], B: ["11110", "10001", "11110", "10001", "10001", "10001", "11110"], C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  "ก": ["01110", "10001", "00001", "01001", "01001", "01001", "01001"], "ข": ["10010", "11010", "10010", "10010", "10010", "10010", "01100"], "อ": ["01110", "10001", "00001", "01101", "10101", "10001", "01110"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"], "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"], "×": ["00000", "10001", "01010", "00100", "01010", "10001", "00000"], 3: ["11110", "00001", "00001", "01110", "00001", "00001", "11110"] };
function glyph(pb, ch, x, y, c, s = 1) { const g = GL[ch]; if (!g) return; g.forEach((row, j) => [...row].forEach((v, i) => { if (v === "1") pb.rect(x + i * s, y + j * s, s, s, c); })); }
function tile(pb, x, y, ch, bg, fg) { box(pb, x, y, 13, 13, R(bg, 6, -0.6, 0.4)); glyph(pb, ch, x + 4, y + 3, hex(fg)); }
function star(pb, cx, cy, r, Rp) { const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } poly(pb, pts, Rp, 0.1); }
function bulb(pb, cx, cy, r) { blob(pb, cx, cy, r, r, R("#ffd84a", 7, -0.5, 0.6), { bias: 0.15 }); pb.set(cx - 2, cy - 2, [255, 255, 240]); pb.rect(cx - 1, cy - 1, 1, 3, [255, 240, 180]); box(pb, cx - Math.ceil(r * 0.55), cy + r - 1, Math.ceil(r * 1.1), Math.max(3, r * 0.6 | 0), R("#8a9ab0", 5, -0.5, 0.4)); }
function globe(pb, cx, cy, r) { blob(pb, cx, cy, r, r, R("#2a7ad8", 7, -0.6, 0.5), { bias: 0.05 });
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { if (x * x + y * y > r * r * 0.9) continue; const land = Math.sin((x + 3) * 0.55) + Math.cos(y * 0.7 + x * 0.2) > 0.6; if (land) pb.set(cx + x, cy + y, pick(R("#3caa4a", 6, -0.6, 0.4), sphereLight(x / r, y / r))); } }

// ---------- ไอคอนของแต่ละวิชา (พื้นที่ประมาณ x 8–96, y 0–56) ----------
const ICONS = {
  math(pb) {
    box(pb, 32, 6, 44, 30, PAL.wood); box(pb, 35, 9, 38, 24, R("#2a5a3a", 6, -0.6, 0.3), -0.1);
    glyph(pb, "+", 38, 12, [240, 250, 240]); glyph(pb, "=", 46, 12, [240, 250, 240]); glyph(pb, "×", 54, 12, [240, 250, 240]); glyph(pb, 3, 62, 12, [255, 220, 120]); line(pb, 38, 24, 68, 24, [200, 230, 200]);
    box(pb, 14, 24, 18, 24, R("#9aa6c8", 6, -0.6, 0.4)); box(pb, 16, 26, 14, 6, R("#c8f0d0", 4, -0.3, 0.2));
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) box(pb, 16 + i * 5, 34 + j * 4, 4, 3, R(i === 2 && j === 2 ? "#ff8a3a" : "#e8ecf4", 4, -0.5, 0.2));
    poly(pb, [[60, 28], [84, 50], [60, 50]], R("#ffc830", 7, -0.6, 0.5), 0.1); poly(pb, [[64, 38], [74, 47], [64, 47]], R("#b07a10", 4, -0.4, 0.2), -0.3);
    box(pb, 78, 2, 5, 15, R("#3a8aff", 6, -0.6, 0.5), 0.1); box(pb, 73, 7, 15, 5, R("#3a8aff", 6, -0.6, 0.5), 0.1);
  },
  science(pb) {
    blob(pb, 24, 38, 10, 10, R("#c8e8ff", 6, -0.4, 0.4), { bias: 0.2 }); blob(pb, 24, 41, 8, 7, R("#3a8aff", 7, -0.6, 0.5)); box(pb, 21, 18, 7, 12, R("#d8f0ff", 5, -0.4, 0.4), 0.1); pb.rect(20, 17, 9, 2, [180, 200, 220]);
    box(pb, 36, 12, 8, 36, R("#d8f0ff", 5, -0.4, 0.4), 0.1); box(pb, 37, 28, 6, 19, R("#3cd04a", 7, -0.6, 0.5)); pb.rect(35, 11, 10, 2, [180, 200, 220]);
    ell(pb, 56, 12, 12, 5, hex("#4a9aff"), 2); ell(pb, 56, 12, 5, 11, hex("#6ab8ff"), 2); blob(pb, 56, 12, 3, 3, R("#ff6a6a", 5, -0.5, 0.5));
    box(pb, 66, 46, 22, 5, R("#6a7088", 6, -0.6, 0.4)); line(pb, 76, 46, 72, 30, hex("#8a90a8"), 4); box(pb, 70, 12, 8, 20, R("#9aa0b8", 6, -0.6, 0.5)); box(pb, 68, 10, 12, 4, R("#4a5068", 5, -0.5, 0.4)); box(pb, 80, 30, 6, 4, R("#9aa0b8", 5, -0.5, 0.4));
  },
  thai(pb) {
    poly(pb, [[20, 34], [48, 28], [76, 34], [76, 52], [48, 47], [20, 52]], R("#6a3a9a", 6, -0.6, 0.4)); poly(pb, [[22, 32], [47, 27], [47, 46], [22, 50]], R("#f6ecd4", 6, -0.4, 0.3), 0.15); poly(pb, [[49, 27], [74, 32], [74, 50], [49, 46]], R("#f6ecd4", 6, -0.4, 0.3), 0.05);
    for (let k = 0; k < 4; k++) { line(pb, 26, 36 + k * 3.5, 43, 33 + k * 3.5, hex("#b8a888")); line(pb, 53, 33 + k * 3.5, 70, 36 + k * 3.5, hex("#b8a888")); }
    tile(pb, 22, 6, "ก", "#f0dcb0", "#6a3a1a"); tile(pb, 40, 2, "ข", "#f0dcb0", "#6a3a1a"); tile(pb, 82, 18, "อ", "#f0dcb0", "#6a3a1a");
    for (let i = 0; i < 12; i++) line(pb, 66 + i * 1.3, 30 - i * 2.2, 72 + i * 1.3, 30 - i * 2.2 + 4, pick(R("#ffc830", 6, -0.5, 0.5), 0.8 - i * 0.03)); line(pb, 64, 34, 84, 2, hex("#a87a20"));
    for (const [x, y] of [[12, 40], [88, 44], [16, 22]]) { for (let a = 0; a < 5; a++) blob(pb, x + Math.cos(a * 1.257) * 3, y + Math.sin(a * 1.257) * 3, 2.4, 2.4, R("#ff8ac0", 5, -0.4, 0.4)); blob(pb, x, y, 1.6, 1.6, R("#ffd84a", 4, -0.3, 0.4)); }
  },
  english(pb) {
    box(pb, 14, 10, 12, 40, R("#c89a5a", 6, -0.6, 0.4)); poly(pb, [[13, 10], [20, -1], [27, 10]], R("#5a4a6a", 6, -0.6, 0.4)); blob(pb, 20, 18, 4, 4, R("#fff4d8", 4, -0.3, 0.3)); line(pb, 20, 18, 20, 15, [40, 30, 30]); line(pb, 20, 18, 22, 18, [40, 30, 30]);
    for (let y = 26; y < 48; y += 5) pb.rect(16, y, 8, 2, hex("#7a5a3a"));
    tile(pb, 32, 4, "A", "#ff5a5a", "#ffffff"); tile(pb, 47, 2, "B", "#ffc830", "#5a3a00"); tile(pb, 62, 4, "C", "#3a8aff", "#ffffff");
    box(pb, 52, 26, 34, 22, R("#d8302a", 7, -0.6, 0.45)); for (let i = 0; i < 4; i++) box(pb, 55 + i * 7, 29, 5, 6, R("#cfe8ff", 4, -0.3, 0.3)); for (let i = 0; i < 4; i++) box(pb, 55 + i * 7, 38, 5, 5, R("#cfe8ff", 4, -0.3, 0.3));
    blob(pb, 58, 48, 3, 3, R("#2a2a30", 4, -0.3, 0.4)); blob(pb, 80, 48, 3, 3, R("#2a2a30", 4, -0.3, 0.4));
    box(pb, 30, 32, 20, 14, R("#2a3a8a", 5, -0.5, 0.3)); line(pb, 30, 32, 49, 45, [240, 240, 250], 2); line(pb, 49, 32, 30, 45, [240, 240, 250], 2); pb.rect(30, 38, 20, 3, [240, 240, 250]); pb.rect(38, 32, 4, 14, [240, 240, 250]); pb.rect(30, 39, 20, 1, [210, 40, 40]); pb.rect(39, 32, 2, 14, [210, 40, 40]);
  },
  social(pb) {
    globe(pb, 26, 24, 13); ell(pb, 26, 24, 16, 16, hex("#c89a3a"), 2); box(pb, 24, 40, 5, 6, R("#c89a3a", 5, -0.5, 0.4)); box(pb, 18, 45, 17, 4, R("#a87a2a", 5, -0.5, 0.4));
    poly(pb, [[42, 18], [57, 8], [72, 18]], R("#e8dcc0", 6, -0.6, 0.4)); box(pb, 43, 18, 29, 3, R("#d8ccb0", 5, -0.5, 0.3)); for (let i = 0; i < 4; i++) box(pb, 45 + i * 7, 22, 4, 20, R("#efe4c8", 5, -0.5, 0.3)); box(pb, 41, 42, 33, 5, R("#c8bca0", 5, -0.5, 0.3));
    blob(pb, 80, 40, 9, 9, R("#c89a3a", 6, -0.6, 0.4)); blob(pb, 80, 40, 7, 7, R("#f4ecd8", 5, -0.3, 0.3)); poly(pb, [[80, 33], [82, 40], [80, 47], [78, 40]], R("#d8402a", 4, -0.4, 0.4)); poly(pb, [[80, 40], [82, 40], [80, 47], [78, 40]], R("#4a6ad8", 4, -0.4, 0.4));
    blob(pb, 84, 10, 5, 5, R("#e8402a", 6, -0.6, 0.5)); poly(pb, [[80, 12], [88, 12], [84, 22]], R("#e8402a", 6, -0.6, 0.5)); blob(pb, 84, 9, 2, 2, R("#ffffff", 3, -0.2, 0));
  },
  health(pb) {
    const H = R("#ff3a4a", 8, -0.65, 0.5); blob(pb, 42, 16, 10, 10, H, { bias: 0.1 }); blob(pb, 58, 16, 10, 10, H); poly(pb, [[32.5, 19], [67.5, 19], [50, 38]], H);
    const pl = [[34, 20], [40, 20], [43, 13], [47, 27], [51, 17], [54, 20], [66, 20]]; for (let i = 0; i + 1 < pl.length; i++) line(pb, ...pl[i], ...pl[i + 1], [255, 255, 255], 2);
    box(pb, 12, 34, 5, 12, R("#4a4a58", 5, -0.5, 0.4)); box(pb, 28, 34, 5, 12, R("#4a4a58", 5, -0.5, 0.4)); box(pb, 17, 38, 11, 4, R("#9aa0b0", 5, -0.5, 0.4)); box(pb, 9, 36, 3, 8, R("#3a3a48", 4, -0.4, 0.3)); box(pb, 33, 36, 3, 8, R("#3a3a48", 4, -0.4, 0.3));
    blob(pb, 66, 42, 7, 7, R("#e8302a", 7, -0.6, 0.5), { bias: 0.1 }); line(pb, 66, 35, 67, 31, hex("#6a4a2a"), 2); blob(pb, 70, 32, 3, 2, R("#3caa4a", 4, -0.4, 0.4));
    box(pb, 78, 22, 10, 26, R("#6ab8ff", 6, -0.5, 0.5), 0.05); box(pb, 80, 18, 6, 5, R("#2a6ad8", 4, -0.4, 0.4)); pb.rect(79, 30, 8, 6, hex("#e8f4ff"));
    box(pb, 80, 0, 5, 14, R("#3ce04a", 6, -0.6, 0.5), 0.1); box(pb, 75, 5, 15, 5, R("#3ce04a", 6, -0.6, 0.5), 0.1);
  },
  early(pb) {
    const Rb = R("#ff5a5a", 4, -0.3, 0.3), cols = ["#ff5a5a", "#ffa030", "#ffe040", "#5ad05a", "#4a9aff", "#9a5ae0"];
    cols.forEach((c, i) => ell(pb, 62, 26, 22 - i * 2, 20 - i * 2, hex(c), 2, Math.PI, Math.PI * 2 + 0.02));
    blob(pb, 82, 25, 7, 4, R("#ffffff", 4, -0.3, 0.1), { bias: 0.3 }); blob(pb, 76, 26, 5, 3, R("#ffffff", 4, -0.3, 0.1), { bias: 0.3 });
    const Br = R("#b8743a", 7, -0.6, 0.45); blob(pb, 26, 36, 11, 12, Br); blob(pb, 26, 18, 9, 8, Br, { bias: 0.08 }); blob(pb, 18, 11, 4, 4, Br); blob(pb, 34, 11, 4, 4, Br); blob(pb, 26, 21, 4, 3, R("#e8c090", 4, -0.3, 0.3));
    pb.rect(23, 16, 2, 2, [30, 20, 20]); pb.rect(28, 16, 2, 2, [30, 20, 20]); pb.rect(25, 20, 3, 2, [40, 24, 20]); blob(pb, 17, 40, 4, 4, Br); blob(pb, 35, 40, 4, 4, Br); blob(pb, 26, 37, 6, 6, R("#e8c090", 4, -0.3, 0.3));
    box(pb, 52, 46, 14, 4, R("#a86a3a", 4, -0.4, 0.3)); box(pb, 58, 24, 3, 22, R("#d8b080", 4, -0.4, 0.3)); ["#4a9aff", "#5ad05a", "#ffe040", "#ff5a5a"].forEach((c, i) => blob(pb, 59.5, 42 - i * 5, 7 - i * 1.3, 2.6, R(c, 5, -0.5, 0.4)));
    box(pb, 70, 38, 11, 11, R("#4a9aff", 5, -0.5, 0.4)); box(pb, 81, 40, 9, 9, R("#ff5a5a", 5, -0.5, 0.4)); poly(pb, [[74, 38], [80, 30], [86, 38]], R("#ffe040", 5, -0.5, 0.4));
    void Rb;
  },
  brain(pb) {
    const Pk = R("#ff9ac0", 8, -0.6, 0.45); blob(pb, 40, 22, 13, 15, Pk, { bias: 0.08 }); blob(pb, 56, 22, 13, 15, Pk);
    for (let k = 0; k < 7; k++) { const y = 12 + k * 4; line(pb, 30 + (k % 2) * 3, y, 38 + (k % 3) * 2, y + 2, hex("#d8608a")); line(pb, 52 + (k % 3) * 2, y + 1, 62 - (k % 2) * 3, y + 2, hex("#d8608a")); } line(pb, 48, 8, 48, 36, hex("#c04a78"));
    bulb(pb, 76, 10, 7); for (const [a, b] of [[76, -1], [66, 4], [86, 4]]) pb.rect(a, b, 2, 2, [255, 240, 140]);
    const pz = (x, y, c) => { box(pb, x, y, 10, 10, R(c, 5, -0.5, 0.4)); blob(pb, x + 5, y - 1, 2.5, 2.5, R(c, 5, -0.5, 0.4)); blob(pb, x + 11, y + 5, 2.5, 2.5, R(c, 5, -0.5, 0.4)); };
    pz(10, 18, "#5ad05a"); pz(14, 34, "#4a9aff"); pz(26, 42, "#ffa030");
    const rc = ["#ff4a4a", "#ffe040", "#4a9aff", "#5ad05a", "#ffffff", "#ffa030"]; box(pb, 66, 30, 20, 18, R("#2a2a30", 4, -0.4, 0.3)); for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) box(pb, 67 + i * 6, 31 + j * 5.6 | 0, 5, 5, R(rc[(i + j * 2) % 6], 4, -0.4, 0.3));
  },
  general(pb) {
    poly(pb, [[12, 36], [36, 30], [60, 36], [60, 52], [36, 47], [12, 52]], R("#2a5aa8", 6, -0.6, 0.4)); poly(pb, [[14, 34], [35, 29], [35, 46], [14, 50]], R("#f6ecd4", 6, -0.4, 0.3), 0.15); poly(pb, [[37, 29], [58, 34], [58, 50], [37, 46]], R("#f6ecd4", 6, -0.4, 0.3), 0.05);
    for (let k = 0; k < 4; k++) { line(pb, 18, 37 + k * 3, 32, 34 + k * 3, hex("#8aa0c8")); line(pb, 40, 34 + k * 3, 54, 37 + k * 3, hex("#8aa0c8")); }
    bulb(pb, 38, 12, 8); for (const [a, b] of [[38, 0], [27, 6], [49, 6]]) pb.rect(a, b, 2, 2, [255, 240, 140]);
    globe(pb, 66, 20, 11); ell(pb, 60, 38, 7, 7, hex("#5a6a88"), 2); blob(pb, 60, 38, 5, 5, R("#c8e8ff", 4, -0.2, 0.4), { bias: 0.25 }); line(pb, 65, 43, 72, 50, hex("#7a5a3a"), 3);
    poly(pb, [[82, 8], [88, 18], [88, 40], [76, 40], [76, 18]], R("#f0f0f4", 6, -0.6, 0.4)); poly(pb, [[82, 6], [88, 18], [76, 18]], R("#e8402a", 5, -0.5, 0.4)); blob(pb, 82, 25, 3, 3, R("#4a9aff", 4, -0.4, 0.4));
    poly(pb, [[76, 32], [70, 44], [76, 40]], R("#e8402a", 4, -0.4, 0.3)); poly(pb, [[88, 32], [94, 44], [88, 40]], R("#e8402a", 4, -0.4, 0.3)); poly(pb, [[78, 40], [86, 40], [82, 50]], R("#ffa030", 5, -0.4, 0.5), 0.2);
  },
};

// ป้ายครบชุด: พุ่มใบไม้ด้านหลัง → ไอคอน → แผ่นป้ายไม้เปล่า + ดาวทองสองข้าง
export function subjectSign(id) {
  const pb = new PB(SIGN.W, SIGN.H), L = PAL.leafB;
  for (let i = 0; i < 9; i++) blob(pb, 12 + i * 10, 52 - (i % 2) * 5 - Math.sin(i) * 3, 10, 8, L, { jag: 0.35, seed: i * 7 + 3, bias: -0.05 });
  for (let i = 0; i < 14; i++) { const x = 8 + hash(i, 1, 4) * 88 | 0, y = 40 + hash(i, 2, 4) * 16 | 0; if (pb.alpha(x, y)) pb.set(x, y, L[7]); }
  (ICONS[id] || ICONS.general)(pb);
  const Wd = PAL.wood, px0 = 10, px1 = 94, py0 = 56, py1 = 78;
  for (let y = py0; y < py1; y++) for (let x = px0; x < px1; x++) { const edge = y === py0 || y === py1 - 1 || x === px0 || x === px1 - 1, bev = y === py0 + 1 || x === px0 + 1;
    const grain = Math.sin(x * 0.35 + Math.sin(y * 0.9) * 2) * 0.06 + (hash(x >> 2, y, 3) - 0.5) * 0.06;
    pb.set(x, y, edge ? Wd[1] : bev ? Wd[6] : pick(Wd, 0.62 + grain - (y - py0) * 0.012 - (y === py1 - 2 ? 0.2 : 0))); }
  box(pb, px0 + 6, py0 + 5, px1 - px0 - 12, py1 - py0 - 10, Wd, -0.12); // แผ่นกลางเว้าลงเล็กน้อย (เว้นว่าง ไม่มีตัวหนังสือ)
  for (const nx of [px0 + 3, px1 - 4]) for (const ny of [py0 + 3, py1 - 4]) { pb.set(nx, ny, [230, 210, 160]); pb.set(nx + 1, ny + 1, [90, 60, 30]); }
  const Au = R("#ffd030", 8, -0.6, 0.6); star(pb, px0 + 2, py0 + 11, 9, Au); star(pb, px1 - 3, py0 + 11, 9, Au);
  return outline(pb, SIGN.W / 2, SIGN.H, -0.82);
}

// อนุภาคเล็ก ๆ ประจำวิชา (ขนาด 5–7 px)
const PART = {};
function part(kind, c, c2) {
  const k = kind + c; if (PART[k]) return PART[k]; const pb = new PB(7, 7), C = hex(c), C2 = hex(c2), W = [255, 255, 255];
  if (kind === "spark") { pb.rect(3, 0, 1, 7, C); pb.rect(0, 3, 7, 1, C); pb.rect(2, 2, 3, 3, C2); pb.set(3, 3, W); }
  else if (kind === "leaf") { for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) if (Math.abs(x - y) <= 1 + (y > 1 && y < 5 ? 1 : 0)) pb.set(x, y, x > y ? C : C2); }
  else if (kind === "petal") { blob(pb, 3, 3, 3, 2.4, ramp(C, 4, -0.3, 0.4)); pb.set(2, 2, W); }
  else if (kind === "star") { for (let i = 0; i < 7; i++) { pb.set(3, i, i % 2 ? C2 : C); pb.set(i, 3, C); } pb.rect(2, 2, 3, 3, [255, 220, 80]); }
  else if (kind === "plus") { pb.rect(2, 0, 3, 7, C); pb.rect(0, 2, 7, 3, C); pb.rect(3, 1, 1, 5, C2); pb.rect(1, 3, 5, 1, C2); }
  else if (kind === "cube") { pb.rect(1, 1, 5, 5, C); pb.rect(1, 1, 5, 1, C2); pb.rect(1, 1, 1, 5, C2); pb.set(5, 5, tone(C, -0.4)); }
  else if (kind === "puzzle") { pb.rect(1, 2, 4, 4, C); pb.rect(2, 0, 2, 2, C); pb.rect(5, 3, 2, 2, C); pb.set(1, 2, C2); }
  else if (kind === "bulb") { blob(pb, 3, 2.6, 2.6, 2.6, ramp([255, 220, 80], 4, -0.3, 0.5)); pb.rect(2, 5, 3, 2, [150, 160, 180]); pb.set(2, 1, W); }
  return (PART[k] = pb.canvas());
}

// เอฟเฟกต์รอบป้าย: วงแสงหมุน 2 ชั้น + อนุภาคลอยขึ้น (x,y = กึ่งกลางป้าย) — วาดแบบ additive
export function drawSignFx(x, id, cx, cy, t, hot = false, reduced = false) {
  const F = SIGN_FX[id] || SIGN_FX.general, C = hex(F.c), C2 = hex(F.c2), boost = hot ? 1.6 : 1;
  x.save(); x.globalCompositeOperation = "lighter";
  const g = x.createRadialGradient(cx, cy, 6, cx, cy, 62); g.addColorStop(0, `rgba(${C.map((v) => v | 0)},${0.18 * boost})`); g.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = g; x.fillRect(cx - 64, cy - 64, 128, 128);
  for (let ring = 0; ring < 2; ring++) { const rx = 58 - ring * 8, ry = 18 + ring * 4, sp = (ring ? -1.3 : 1) * (reduced ? 0 : 1), off = ring * 2.1, col = ring ? C2 : C, oy = ring ? -6 : 10;
    for (let i = 0; i < 26; i++) { const a = t * sp * 1.4 + off + i * 0.075, k = i / 26, X = Math.round(cx + Math.cos(a) * rx), Y = Math.round(cy + oy + Math.sin(a) * ry);
      x.fillStyle = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${(0.15 + 0.75 * k) * boost * 0.8})`; const s = k > 0.85 ? 3 : 2; x.fillRect(X - (s >> 1), Y - (s >> 1), s, s); } }
  x.globalCompositeOperation = "source-over";
  const P = part(F.p, F.c, F.c2), n = hot ? 9 : 6;
  for (let i = 0; i < n; i++) { const ph = reduced ? hash(i, 2, 9) : (t * (0.18 + hash(i, 3, 9) * 0.12) + hash(i, 1, 9)) % 1, px = cx - 54 + hash(i, 4, 9) * 108 + Math.sin(t * 1.5 + i) * 5, py = cy + 30 - ph * 80;
    x.globalAlpha = Math.sin(ph * Math.PI) * 0.95; x.drawImage(P, Math.round(px - 3), Math.round(py - 3)); }
  x.globalAlpha = 1; x.restore();
}
