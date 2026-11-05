// ฉากในร้านค้า (พิกเซลอาร์ตความละเอียดสูงแนวเดียวกับหมู่บ้าน): ผนังไม้ ชั้นวางของ เคาน์เตอร์ พ่อค้า โคมไฟ แสงแดดจากหน้าต่าง
import { PB, PAL, hash, vnoise, clamp, hex, mix, mul, tone, ramp, pick, cylLight, sphereLight, outline, blob, cylinder, bloom, canvas } from "../world/art.js";
import { PROP, crystal } from "../world/sprites.js";
import { charFrame, idlePose } from "../world/chars.js";
import { VILLAGERS } from "./world.js";

const H = 200; // ความสูงฉาก (พิกเซลโลก)
const MERCHANT = VILLAGERS[1].look;

// ---------- หีบสมบัติ (ใช้แทนไอคอนกล่องสุ่ม) ----------
const CHEST = {
  basic: { body: "#9a6236", band: "#7a7c88", lock: "#d8b040" },
  gold: { body: "#d8a030", band: "#fff0a0", lock: "#e84a4a" },
  profile: { body: "#6a3a9a", band: "#f0c040", lock: "#ff6ab0" },
};
const chestCache = new Map();
export function chestImg(kind) {
  if (chestCache.has(kind)) return chestCache.get(kind);
  const C = CHEST[kind] || CHEST.basic, B = ramp(hex(C.body), 7, -0.7, 0.45), M = ramp(hex(C.band), 6, -0.6, 0.45), K = ramp(hex(C.lock), 5, -0.5, 0.4), pb = new PB(52, 46);
  for (let y = 40; y < 44; y++) for (let x = 4; x < 48; x++) pb.set(x, y, [0, 0, 0], 60);
  for (let y = 20; y < 40; y++) for (let x = 3; x < 49; x++) pb.set(x, y, pick(B, 0.45 + (y < 22 ? 0.25 : 0) - (y > 37 ? 0.2 : 0) + (x < 6 ? 0.15 : x > 45 ? -0.2 : 0) - ((x - 3) % 9 === 0 ? 0.15 : 0) + (vnoise(x / 3, y / 6, 2) - 0.5) * 0.15));
  for (let y = 6; y < 21; y++) { const t = (y - 6) / 15; for (let x = 3; x < 49; x++) { const arch = Math.sqrt(Math.max(0, 1 - ((x - 26) / 23) ** 2)) * 6; if (y < 12 - arch * 0.9) continue; pb.set(x, y, pick(B, 0.7 - t * 0.25 + (x < 7 ? 0.1 : x > 44 ? -0.2 : 0))); } }
  pb.rect(3, 19, 46, 2, B[1]);
  for (const bx of [8, 39]) for (let y = 5; y < 40; y++) for (let x = bx; x < bx + 5; x++) pb.set(x, y, pick(M, cylLight((x - bx) / 2.5 - 1) + (y < 7 ? 0.2 : 0)));
  for (let y = 16; y < 28; y++) for (let x = 21; x < 31; x++) pb.set(x, y, pick(K, sphereLight((x - 26) / 6, (y - 22) / 7) + 0.1));
  pb.rect(24, 21, 4, 4, [40, 24, 16]); pb.rect(25, 25, 2, 2, [40, 24, 16]);
  if (kind === "profile") { bloom(pb, 14, 10, [255, 150, 210]); bloom(pb, 34, 10, [150, 220, 255]); }
  if (kind === "gold") { pb.rect(15, 8, 2, 2, [255, 255, 255]); pb.rect(44, 26, 2, 2, [255, 255, 255]); }
  const url = outline(pb, 0, 0, -0.8).c.toDataURL();
  chestCache.set(kind, url); return url;
}

// ---------- พื้นหลังห้อง (วาดใหม่เมื่อความกว้างเปลี่ยน) ----------
function bakeRoom(W, L) {
  const pb = new PB(W, H), Wd = PAL.wood;
  // ผนังไม้แนวตั้ง แสงจากหน้าต่างด้านขวา
  for (let x = 0; x < W; x++) { const p = Math.floor(x / 22), lx = x % 22, base = p % 2 ? 0.5 : 0.44, win = L.win ? Math.max(0, 1 - Math.abs(x - L.win - 40) / 220) * 0.18 : 0;
    for (let y = 0; y < 132; y++) { let t = base + win + (vnoise(x / 2.5, y / 22, p) - 0.5) * 0.22 - (lx === 0 ? 0.3 : lx === 1 ? -0.12 : 0) - (y < 30 ? (30 - y) * 0.008 : 0);
      if ((lx === 4 || lx === 17) && (y % 44 === 20)) t = 0.9; pb.set(x, y, pick(Wd, t)); } }
  for (let y = 0; y < 18; y++) for (let x = 0; x < W; x++) pb.set(x, y, pick(Wd, y < 10 ? 0.12 : y === 10 ? 0.55 : 0.3 + (vnoise(x / 6, y, 3) - 0.5) * 0.2));
  for (let X = 36; X < W; X += 128) cylinder(pb, X, 0, 10, 132, Wd, { bias: -0.15, seed: X });
  // หน้าต่าง + วิวหญ้านอกบ้าน
  if (L.win) { const wx = L.win;
    pb.rect(wx - 6, 22, 82, 66, Wd[1]);
    for (let y = 26; y < 86; y++) for (let x = wx; x < wx + 70; x++) { let c = mix([196, 226, 240], [250, 232, 190], (y - 26) / 40); if (y > 62) c = mix([150, 168, 70], [104, 128, 46], (y - 62) / 24); if (y > 56 && y < 66 && Math.sin((x - wx) / 9) * 4 + 60 < y) c = [120, 140, 56]; pb.set(x, y, c); }
    blob(pb, wx + 16, 54, 11, 10, PAL.leaf, { jag: 0.4, seed: 4 }); pb.rect(wx + 15, 62, 3, 10, PAL.bark[3]);
    for (let y = 26; y < 86; y++) { pb.rect(wx + 34, y, 3, 1, Wd[2]); } pb.rect(wx, 54, 70, 3, Wd[2]);
    for (let y = 86; y < 92; y++) for (let x = wx - 8; x < wx + 78; x++) pb.set(x, y, pick(Wd, y === 86 ? 0.85 : 0.5));
    for (let i = 0; i < 3; i++) { const px = wx + 6 + i * 24; for (let y = 78; y < 86; y++) for (let x = px; x < px + 12; x++) pb.set(x, y, pick(ramp([190, 96, 58], 6, -0.6, 0.4), cylLight((x - px) / 6 - 1))); blob(pb, px + 6, 74, 7, 5, PAL.leafB, { jag: 0.4, seed: i, bias: 0.15 }); bloom(pb, px + 4, 70, [[230, 70, 90], [246, 200, 64], [176, 112, 224]][i]); } }
  // ชั้นวางของ
  const shelf = (y0, x0, x1, seed) => {
    for (let X = x0; X < x1 - 16; X += 20) { const k = Math.floor(hash(X, y0, seed) * 7), c = [[58, 106, 208], [216, 69, 58], [120, 72, 170], [60, 150, 90]][Math.floor(hash(X, 2, seed) * 4)];
      if (k <= 1) { for (let y = y0 - 18; y < y0; y++) for (let x = X + 4; x < X + 14; x++) { const liquid = y > y0 - 12; pb.set(x, y, liquid ? pick(ramp(c, 6, -0.6, 0.45), cylLight((x - X - 4) / 5 - 1)) : mix([200, 220, 230], [140, 160, 170], (x - X - 4) / 10)); }
        pb.rect(X + 7, y0 - 23, 4, 5, [200, 160, 110]); pb.rect(X + 5, y0 - 16, 2, 10, [255, 255, 255], 160); }
      else if (k === 2) { for (let b = 0; b < 4; b++) { const bh = 16 + (b % 2) * 4, bc = ramp([[122, 58, 154], [46, 122, 74], [192, 96, 42], [42, 74, 138]][b], 6, -0.6, 0.4); for (let y = y0 - bh; y < y0; y++) for (let x = X + 1 + b * 4; x < X + 5 + b * 4; x++) pb.set(x, y, pick(bc, cylLight((x - X - 1 - b * 4) / 2 - 1))); pb.rect(X + 1 + b * 4, y0 - bh + 4, 4, 2, [232, 208, 160]); } }
      else if (k === 3) { for (let y = y0 - 14; y < y0; y++) for (let x = X + 1; x < X + 18; x++) pb.set(x, y, pick(Wd, y < y0 - 10 ? 0.85 : 0.6 - ((y - y0) % 5 === 0 ? 0.2 : 0))); }
      else if (k === 4) { for (let y = y0 - 13; y < y0; y++) for (let x = X + 3; x < X + 16; x++) pb.set(x, y, mix([230, 220, 190], [200, 190, 160], (x - X) / 16)); for (let i = 0; i < 6; i++) blob(pb, X + 6 + (i % 3) * 3, y0 - 6 - (i >> 1) * 2, 2, 2, ramp([246, 200, 64], 5, -0.5, 0.5), { seed: i }); }
      else if (k === 5) { for (let y = y0 - 10; y < y0; y++) for (let x = X + 3; x < X + 16; x++) pb.set(x, y, pick(ramp([190, 96, 58], 6, -0.6, 0.4), cylLight((x - X - 3) / 6.5 - 1))); blob(pb, X + 9, y0 - 15, 7, 6, PAL.leafB, { jag: 0.4, seed: X, bias: 0.1 }); bloom(pb, X + 7, y0 - 20, [230, 70, 90]); }
      else { for (let y = y0 - 8; y < y0; y++) for (let x = X + 1; x < X + 18; x++) pb.set(x, y, pick(ramp([240, 226, 192], 5, -0.5, 0.3), cylLight((y - y0 + 8) / 4 - 1))); pb.rect(X + 15, y0 - 10, 3, 12, [176, 138, 90]); }
    }
    for (let y = y0; y < y0 + 6; y++) for (let x = x0 - 4; x < x1 + 4; x++) pb.set(x, y, pick(Wd, y === y0 ? 0.85 : y === y0 + 5 ? 0.2 : 0.6));
    for (let y = y0 + 6; y < y0 + 9; y++) for (let x = x0 - 4; x < x1 + 4; x++) pb.shade(x, y, -0.4);
    for (let X = x0 + 8; X < x1; X += 80) { pb.rect(X, y0 + 6, 4, 8, Wd[1]); pb.rect(X + 4, y0 + 6, 4, 4, Wd[1]); }
  };
  for (const [a, b] of L.shelves) { shelf(52, a, b, 1); shelf(92, a, b, 2); }
  // ธงประดับบนคาน
  for (let X = 6; X < W; X += 12) { const sag = Math.round(Math.sin((X / W) * Math.PI * 3) * 3), c = ramp([[232, 74, 74], [246, 200, 64], [74, 176, 224], [122, 192, 64]][(X / 12 | 0) % 4], 5, -0.5, 0.4);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8 - y; x++) pb.set(X + x + (y >> 1), 20 + sag + y, c[y < 2 ? 3 : 2]); }
  // พื้นไม้
  for (let y = 128; y < 134; y++) for (let x = 0; x < W; x++) pb.set(x, y, pick(Wd, y === 128 ? 0.7 : 0.15));
  for (let y = 134; y < H; y++) { const row = Math.floor((y - 134) / 12), ly = (y - 134) % 12;
    for (let x = 0; x < W; x++) { const seam = (x + row * 37) % 90 === 0; let t = 0.62 + (row % 2 ? 0.06 : 0) + (vnoise(x / 9, y / 2, row) - 0.5) * 0.2 - (ly === 11 || seam ? 0.35 : 0) + (ly === 0 ? 0.1 : 0) - (y - 134) * 0.004;
      if (L.win) t += Math.max(0, 1 - Math.abs(x - (L.win - 40 + (y - 134) * -0.6)) / 70) * 0.18; pb.set(x, y, pick(Wd, t)); } }
  // พรมลาย
  const rx = L.rug, rw = Math.min(220, W * 0.5);
  for (let y = 160; y < 194; y++) for (let x = Math.floor(rx - rw / 2); x < rx + rw / 2; x++) { const ex = Math.min(x - (rx - rw / 2), rx + rw / 2 - 1 - x, y - 160, 193 - y);
    const c = ex < 2 ? [90, 26, 26] : ex < 5 ? [232, 186, 70] : ((x + y) % 12 < 2 || (x - y) % 12 < 2) ? [222, 150, 64] : [168, 48, 42]; pb.set(x, y, mul(c, 0.9 + vnoise(x / 3, y / 3, 9) * 0.15)); }
  return pb.canvas();
}

export function mountShopScene(host, { shirt = "#5b3df5", look = null, reduced = false, greet = [] } = {}) {
  const view = document.createElement("canvas"); view.className = "ss-canvas"; view.setAttribute("aria-hidden", "true");
  host.prepend(view);
  const bubble = host.querySelector(".ss-bubble");
  const KF = new Map(), HF = new Map(), HL0 = look || { shirt, pants: "#2a3550", hair: "#3a2a20" };
  const keeperAt = (p) => KF.get(p) || (KF.set(p, charFrame(0, 0, MERCHANT, p)), KF.get(p)), heroAt = (p) => HF.get(p) || (HF.set(p, charFrame(3, 0, HL0, p)), HF.get(p));
  const cry = crystal(7), barrel = PROP.barrel(), crate = PROP.crate(), pot = PROP.pot(0.1);
  const [buf, bx] = canvas(10, 10);
  let S = 1.5, W = 0, dpr = 1, bg = null, L = null, raf = 0, line = 0, lineT = 0, smooth = false;

  function layout() {
    const w = host.clientWidth; dpr = Math.min(2, window.devicePixelRatio || 1); S = w < 640 ? 1 : 1.5;
    smooth = Math.abs(S * dpr - Math.round(S * dpr)) > 0.01;
    W = Math.ceil(w / S); const h = Math.round(H * S);
    const narrow = W < 520, cx = Math.round(narrow ? W * 0.64 : W * 0.4);
    L = { cx, win: W > 400 ? Math.round(W * (narrow ? 0.66 : 0.74)) : 0, rug: cx, shelves: narrow ? [[12, Math.round(W * 0.58) - 12]] : [[16, Math.round(W * 0.68)]], hero: Math.round(narrow ? cx - 60 : cx + 88) };
    if (L.win && L.win + 80 > W - 12) L.win = 0;
    bg = bakeRoom(W, L); buf.width = W; buf.height = H; bx.imageSmoothingEnabled = false;
    view.style.width = w + "px"; view.style.height = h + "px"; view.width = Math.round(w * dpr); view.height = Math.round(h * dpr);
    host.style.height = h + "px";
    if (bubble) { bubble.style.left = `${(L.cx / W) * 100}%`; bubble.style.top = `${(64 / H) * 100}%`; bubble.classList.toggle("narrow", narrow); }
  }
  function say(i) { if (!bubble || !greet.length) return; line = (i + greet.length) % greet.length; bubble.textContent = greet[line]; bubble.classList.remove("pop"); void bubble.offsetWidth; bubble.classList.add("pop"); }
  const put = (s, fx, fy) => bx.drawImage(s.c, Math.round(fx - s.ax), Math.round(fy - s.ay));

  function render(now) {
    const x = bx, t = reduced ? 0 : now / 1000, cx = L.cx;
    x.drawImage(bg, 0, 0);
    if (L.win) { x.globalCompositeOperation = "lighter"; x.fillStyle = "rgba(255,220,150,.08)";
      for (let k = 0; k < 2; k++) { x.beginPath(); x.moveTo(L.win + k * 36, 26); x.lineTo(L.win + 32 + k * 36, 26); x.lineTo(L.win - 60 + k * 36, H); x.lineTo(L.win - 116 + k * 36, H); x.fill(); }
      for (let i = 0; i < 18; i++) { const ph = (t * 0.05 + hash(i, 1, 9)) % 1, px = L.win + 60 - ph * 160 + Math.sin(t + i) * 6, py = 36 + ph * 140; x.fillStyle = `rgba(255,240,200,${0.35 * Math.abs(Math.sin(t * 1.5 + i))})`; x.fillRect(Math.round(px), Math.round(py), 2, 2); }
      x.globalCompositeOperation = "source-over"; }
    put(barrel, 20, 150); put(crate, 46, 154); put(barrel, W - 26, 152); put(pot, W - 58, 148);
    { const cX = 30, cY = 118, O = "#e8822e", D = "#2a1a10"; x.fillStyle = D; x.fillRect(cX - 2, cY - 2, 24, 13); x.fillStyle = O; x.fillRect(cX, cY, 20, 9); x.fillStyle = "#f4a050"; x.fillRect(cX, cY, 20, 2);
      x.fillStyle = O; x.fillRect(cX + 14, cY - 5, 8, 8); x.fillRect(cX + 14, cY - 7, 2, 2); x.fillRect(cX + 20, cY - 7, 2, 2); x.fillStyle = D; x.fillRect(cX + 16, cY, 4, 1); x.fillStyle = O; x.fillRect(cX - 5, cY + 5, 6, 3);
      if (!reduced && Math.floor(t / 2.4) % 3 === 0) { x.fillStyle = "#f6f0e0"; x.font = "bold 8px sans-serif"; x.fillText("z", cX + 24, cY - 10 - (t * 6 % 6)); } }
    const bob = reduced ? 0 : Math.sin(t * 2) > 0.7 ? 1 : 0;
    put(keeperAt(reduced ? 0 : idlePose(t, 1.3)), cx, 114);
    // เคาน์เตอร์
    const cw = 170, c0 = Math.round(cx - cw / 2), Wd = PAL.wood;
    x.fillStyle = "#1e1208"; x.fillRect(c0 - 2, 104, cw + 4, 52);
    x.fillStyle = "#c8894a"; x.fillRect(c0, 106, cw, 10); x.fillStyle = "#e8ad6a"; x.fillRect(c0, 106, cw, 2); x.fillStyle = "#8a5230"; x.fillRect(c0, 116, cw, 36);
    for (let i = 0; i < 4; i++) { const px = c0 + 8 + i * 40; x.fillStyle = "#74401f"; x.fillRect(px, 122, 34, 24); x.fillStyle = "#5a3018"; x.fillRect(px, 122, 34, 2); x.fillRect(px, 122, 2, 24); x.fillStyle = "#a06a3c"; x.fillRect(px + 2, 144, 32, 2); }
    x.fillStyle = "rgba(0,0,0,.3)"; x.fillRect(c0, 152, cw, 4);
    for (let i = 0; i < 3; i++) for (let j = 0; j <= i; j++) { x.fillStyle = "#c89a20"; x.fillRect(c0 + 16 + i * 12, 100 - j * 4, 10, 4); x.fillStyle = "#fff0a0"; x.fillRect(c0 + 16 + i * 12, 100 - j * 4, 10, 1); }
    if (!reduced && (t % 3) < 0.15) { x.fillStyle = "#fff"; x.fillRect(c0 + 27, 88, 2, 6); x.fillRect(c0 + 25, 90, 6, 2); }
    x.fillStyle = "#9a6236"; x.fillRect(c0 + cw - 64, 88, 28, 18); x.fillStyle = "#c08048"; x.fillRect(c0 + cw - 64, 88, 28, 5); x.fillStyle = "#f0c040"; x.fillRect(c0 + cw - 56, 92, 12, 4); x.fillStyle = "#2a1608"; x.fillRect(c0 + cw - 66, 86, 32, 2);
    const cyY = 80 + (reduced ? 0 : Math.round(Math.sin(t * 2) * 3)); put(cry, c0 + cw - 18, cyY);
    x.globalCompositeOperation = "lighter"; x.fillStyle = `rgba(170,255,100,${0.12 + 0.06 * Math.sin(t * 2.4)})`; x.beginPath(); x.arc(c0 + cw - 18, cyY, 16, 0, 7); x.fill(); x.globalCompositeOperation = "source-over";
    x.fillStyle = "#2a1608"; x.fillRect(cx - 19, 125, 38, 20); x.fillStyle = "#f0e2c0"; x.fillRect(cx - 17, 127, 34, 16); x.fillStyle = "#f6c840"; x.fillRect(cx - 11, 132, 6, 6); x.fillStyle = "#5a3a20"; x.fillRect(cx - 1, 134, 10, 2);
    // ผู้เล่นยืนหน้าร้าน (มีเงา)
    x.fillStyle = "rgba(20,20,50,.35)"; x.beginPath(); x.ellipse(L.hero + 6, 188, 16, 5, 0, 0, 7); x.fill();
    put(heroAt(reduced ? 0 : idlePose(t, 0)), L.hero, 190);
    // โคมแขวน
    const lampsX = [Math.round(W * 0.2), Math.round(W * 0.58), Math.round(W * 0.9)];
    x.globalCompositeOperation = "lighter";
    for (const lx of lampsX) { const a = 0.1 + (reduced ? 0 : 0.03 * Math.sin(t * 3 + lx)); x.fillStyle = `rgba(255,190,90,${a})`; x.beginPath(); x.arc(lx, 44, 36, 0, 7); x.fill(); x.beginPath(); x.arc(lx, 44, 18, 0, 7); x.fill(); }
    x.globalCompositeOperation = "source-over";
    for (const lx of lampsX) { x.fillStyle = "#2a1a10"; x.fillRect(lx, 16, 2, 20); x.fillRect(lx - 6, 34, 14, 4); x.fillStyle = "#ffe6a0"; x.fillRect(lx - 4, 38, 10, 12); x.fillStyle = "#fff6d0"; x.fillRect(lx - 4, 38, 4, 12); x.fillStyle = "#2a1a10"; x.fillRect(lx - 6, 50, 14, 2); }
    const v = view.getContext("2d"); v.imageSmoothingEnabled = smooth; v.setTransform(1, 0, 0, 1, 0, 0);
    v.drawImage(buf, 0, 0, W * S * dpr, H * S * dpr);
  }

  let lastW = -1, visible = true;
  const ro = new ResizeObserver(() => { if (host.clientWidth !== lastW) { lastW = host.clientWidth; layout(); } }); ro.observe(host);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }); io.observe(view);
  lastW = host.clientWidth; layout(); say(0);
  const loop = (now) => { raf = requestAnimationFrame(loop); if (!visible || document.hidden) return;
    if (!reduced && greet.length > 1 && now - lineT > 6000) { if (lineT) say(line + 1); lineT = now; }
    render(now); };
  if (reduced) render(0); else raf = requestAnimationFrame(loop);
  const onTap = (e) => { const r = view.getBoundingClientRect(), wx = (e.clientX - r.left) / S; if (Math.abs(wx - L.cx) < 60) { say(line + 1); lineT = performance.now(); } };
  view.addEventListener("pointerdown", onTap);
  return { destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); view.remove(); }, say };
}
