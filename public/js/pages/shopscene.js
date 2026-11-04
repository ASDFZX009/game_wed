// ฉากในร้านค้า (พิกเซลอาร์ตแนวเดียวกับหมู่บ้าน): ผนังไม้ ชั้นวางของ เคาน์เตอร์ พ่อค้า โคมไฟ แสงจากหน้าต่าง
// วาดด้วยโค้ดทั้งหมด · ใช้สไปรต์ร่วมกับ world.js
import { canvas, R, shade, hash, outline, charFrame, PROP, crystalSprite, ellipseShadow, VILLAGERS } from "./world.js";

const H = 100; // ความสูงฉาก (พิกเซลโลก)
const MERCHANT = VILLAGERS[1].look;

// ---------- หีบสมบัติพิกเซล (ใช้แทนไอคอนกล่องสุ่ม) ----------
const CHEST = {
  basic: { body: "#9a6236", dark: "#6a3e1e", band: "#7a7c88", bandHi: "#b4b6c0", lock: "#d8b040" },
  gold: { body: "#e0a830", dark: "#a8701a", band: "#fff0a0", bandHi: "#ffffff", lock: "#e84a4a" },
  profile: { body: "#6a3a9a", dark: "#40205e", band: "#f0c040", bandHi: "#fff0a0", lock: "#ff6ab0" },
};
const chestCache = new Map();
export function chestImg(kind, open = false) {
  const key = kind + open; if (chestCache.has(key)) return chestCache.get(key);
  const C = CHEST[kind] || CHEST.basic, [c, x] = canvas(26, 24);
  ellipseShadow(x, 13, 21, 24, 0.3);
  // ตัวหีบ
  R(x, 2, 11, 22, 10, C.body); R(x, 2, 11, 22, 1, shade(C.body, 0.25)); R(x, 2, 19, 22, 2, C.dark);
  for (let i = 0; i < 4; i++) R(x, 4 + i * 5, 13, 1, 6, C.dark);
  // ฝา
  if (open) { R(x, 3, 3, 20, 5, C.dark); R(x, 4, 7, 18, 4, "#fff6c0"); R(x, 6, 6, 14, 2, "#ffe070"); }
  else { R(x, 2, 5, 22, 6, C.body); R(x, 3, 4, 20, 1, C.body); R(x, 3, 4, 20, 2, shade(C.body, 0.35)); R(x, 2, 10, 22, 1, C.dark); }
  // แถบโลหะ + กุญแจ
  for (const bx of [4, 19]) { R(x, bx, open ? 11 : 4, 3, open ? 10 : 17, C.band); R(x, bx, open ? 11 : 4, 1, open ? 10 : 17, C.bandHi); }
  R(x, 11, 9, 4, 5, C.lock); R(x, 11, 9, 4, 1, shade(C.lock, 0.4)); R(x, 12, 11, 2, 2, "#2a1a10");
  if (kind === "profile") { R(x, 8, 6, 2, 2, "#ff9ad0"); R(x, 16, 6, 2, 2, "#9ae0ff"); }
  if (kind === "gold") { R(x, 7, 6, 1, 1, "#ffffff"); R(x, 20, 13, 1, 1, "#ffffff"); }
  const url = outline(c).c.toDataURL();
  chestCache.set(key, url); return url;
}

// ---------- ฉากพื้นหลัง (วาดใหม่เมื่อความกว้างเปลี่ยน) ----------
function bakeRoom(W, L) {
  const [c, x] = canvas(W, H);
  // ผนังไม้แนวตั้ง
  for (let X = 0; X < W; X++) { const p = Math.floor(X / 12), lx = X % 12, base = p % 2 ? [110, 68, 38] : [98, 60, 33];
    for (let Y = 0; Y < 66; Y++) { const g = hash(p, Math.floor(Y / 3), 5) < 0.12 && lx > 2 && lx < 10 ? 0.86 : 1, k = lx === 0 ? 0.55 : lx === 1 ? 1.12 : g;
      x.fillStyle = `rgb(${base[0] * k | 0},${base[1] * k | 0},${base[2] * k | 0})`; x.fillRect(X, Y, 1, 1); } }
  R(x, 0, 0, W, 5, "#2e1a0c"); R(x, 0, 5, W, 3, "#5a361c"); R(x, 0, 8, W, 1, "#3a2210"); // คานเพดาน
  for (let X = 18; X < W; X += 64) { R(x, X, 0, 5, 66, "#4a2c16"); R(x, X, 0, 1, 66, "#6a4224"); } // เสาไม้
  // หน้าต่าง
  const wx = L.win;
  if (wx) { R(x, wx - 2, 13, 40, 32, "#3a2210"); R(x, wx, 15, 36, 28, "#bfe6ff"); R(x, wx, 15, 36, 10, "#e4f4ff");
    R(x, wx, 33, 36, 10, "#9ad07a"); R(x, wx + 4, 30, 10, 5, "#6ab04c"); R(x, wx + 22, 29, 12, 6, "#58a040"); // ทิวเขาหญ้านอกหน้าต่าง
    R(x, wx + 17, 15, 2, 28, "#3a2210"); R(x, wx, 28, 36, 2, "#3a2210"); R(x, wx - 3, 44, 42, 3, "#7a4a24"); R(x, wx - 3, 44, 42, 1, "#9a6236");
    for (let i = 0; i < 3; i++) R(x, wx + 2 + i * 12, 41, 6, 3, ["#e84a6a", "#f6c840", "#9a6ae0"][i]); }
  // ชั้นวางของ
  const shelf = (y0, x0, x1, seed) => {
    for (let X = x0; X < x1; X += 11) { const h = hash(X, y0, seed), k = Math.floor(h * 7);
      if (k === 0) { R(x, X + 2, y0 - 9, 6, 9, "#3a6ad0"); R(x, X + 3, y0 - 8, 1, 7, "#7aa0f0"); R(x, X + 3, y0 - 11, 4, 2, "#c8a070"); } // ขวดยาฟ้า
      else if (k === 1) { R(x, X + 2, y0 - 8, 6, 8, "#d8453a"); R(x, X + 3, y0 - 7, 1, 6, "#f08a7a"); R(x, X + 3, y0 - 10, 4, 2, "#c8a070"); } // ขวดยาแดง
      else if (k === 2) { for (let b = 0; b < 4; b++) { const bh = 8 + (b % 2) * 2; R(x, X + b * 2 + 1, y0 - bh, 2, bh, ["#7a3a9a", "#2e7a4a", "#c0602a", "#2a4a8a"][b]); R(x, X + b * 2 + 1, y0 - bh + 2, 2, 1, "#e8d0a0"); } } // หนังสือ
      else if (k === 3) { R(x, X + 1, y0 - 7, 9, 7, "#c8955a"); R(x, X + 1, y0 - 7, 9, 2, "#e0b07a"); R(x, X + 1, y0 - 4, 9, 1, "#8a5a2e"); } // กล่อง
      else if (k === 4) { R(x, X + 2, y0 - 6, 7, 6, "#e8d8b0"); R(x, X + 3, y0 - 8, 5, 2, "#f6c840"); R(x, X + 4, y0 - 9, 1, 1, "#fff"); } // โถเหรียญ
      else if (k === 5) { R(x, X + 2, y0 - 5, 7, 5, "#c0603a"); R(x, X + 3, y0 - 9, 2, 4, "#3f8a2e"); R(x, X + 6, y0 - 10, 2, 5, "#58a83a"); R(x, X + 4, y0 - 11, 2, 2, "#f04a6a"); } // กระถาง
      else { R(x, X + 1, y0 - 4, 9, 4, "#f0e2c0"); R(x, X + 1, y0 - 4, 9, 1, "#fff6e0"); R(x, X + 8, y0 - 5, 2, 6, "#b08a5a"); } // ม้วนกระดาษ
    }
    R(x, x0 - 2, y0, x1 - x0 + 4, 3, "#8a5630"); R(x, x0 - 2, y0, x1 - x0 + 4, 1, "#b07a46"); R(x, x0 - 2, y0 + 3, x1 - x0 + 4, 1, "rgba(0,0,0,.35)");
    for (let X = x0 + 4; X < x1; X += 40) { R(x, X, y0 + 3, 2, 4, "#4a2c16"); R(x, X + 2, y0 + 3, 2, 2, "#4a2c16"); }
  };
  for (const [a, b] of L.shelves) { shelf(26, a, b, 1); shelf(46, a, b, 2); }
  // ผ้าธงประดับบนคาน
  for (let X = 4; X < W; X += 6) { const sag = Math.round(Math.sin((X / W) * Math.PI * 3) * 1.5); R(x, X, 10 + sag, 4, 3, ["#e84a4a", "#f6c840", "#4ab0e0", "#7ac040"][(X / 6 | 0) % 4]); R(x, X + 1, 13 + sag, 2, 1, "rgba(0,0,0,.2)"); }
  // พื้นไม้
  R(x, 0, 64, W, 3, "#3a2210"); R(x, 0, 64, W, 1, "#7a4a24");
  for (let Y = 67; Y < H; Y++) { const row = Math.floor((Y - 67) / 6), ly = (Y - 67) % 6;
    for (let X = 0; X < W; X++) { const seam = (X + row * 17) % 40 === 0; const base = row % 2 ? [168, 112, 62] : [154, 102, 56], k = ly === 5 || seam ? 0.62 : ly === 0 ? 1.12 : hash(X >> 2, Y, 7) < 0.1 ? 0.92 : 1, dk = 1 - (H - Y) * 0.003;
      x.fillStyle = `rgb(${base[0] * k * dk | 0},${base[1] * k * dk | 0},${base[2] * k * dk | 0})`; x.fillRect(X, Y, 1, 1); } }
  // พรม
  const rx = L.rug, rw = Math.min(110, W * 0.5);
  for (let Y = 80; Y < 97; Y++) for (let X = rx - rw / 2; X < rx + rw / 2; X++) { const e = Y === 80 || Y === 96 || X < rx - rw / 2 + 1 || X >= rx + rw / 2 - 1, e2 = Y === 82 || Y === 94 || X < rx - rw / 2 + 3 || X >= rx + rw / 2 - 3;
    R(x, X, Y, 1, 1, e ? "#5a1a1a" : e2 ? "#f0c040" : ((X + Y) % 6 === 0 ? "#e8a040" : "#a8302a")); }
  return c;
}

export function mountShopScene(host, { shirt = "#5b3df5", reduced = false, greet = [] } = {}) {
  const view = document.createElement("canvas"); view.className = "ss-canvas"; view.setAttribute("aria-hidden", "true");
  host.prepend(view);
  const bubble = host.querySelector(".ss-bubble");
  const keeper = { F: (dir) => charFrame(dir, 0, MERCHANT) }, heroFr = charFrame(3, 0, { shirt, pants: "#2a3550" });
  const cry = crystalSprite(3), barrel = PROP.barrel(), crate = PROP.crate(), pot = PROP.pot(0.1);
  const [buf, bx] = canvas(10, 10);
  let S = 3, W = 0, dpr = 1, bg = null, L = null, raf = 0, line = 0, lineT = 0;

  function layout() {
    const w = host.clientWidth; dpr = Math.min(2, window.devicePixelRatio || 1); S = w < 640 ? 2 : 3;
    W = Math.ceil(w / S); const h = H * S;
    const narrow = W < 260, cx = Math.round(narrow ? W * 0.64 : W * 0.4);
    L = { cx, win: W > 200 ? Math.round(W * (narrow ? 0.62 : 0.74)) : 0, rug: cx, shelves: narrow ? [[6, Math.round(W * 0.58) - 6]] : [[8, Math.round(W * 0.68)]], hero: Math.round(narrow ? cx - 30 : cx + 44) };
    if (W * 0.74 + 40 > W - 6) L.win = 0;
    bg = bakeRoom(W, L); buf.width = W; buf.height = H; bx.imageSmoothingEnabled = false;
    view.style.width = w + "px"; view.style.height = h + "px"; view.width = Math.round(w * dpr); view.height = Math.round(h * dpr);
    host.style.height = h + "px";
    placeBubble();
  }
  function placeBubble() { if (!bubble) return; bubble.style.left = `${(L.cx / W) * 100}%`; bubble.classList.toggle("narrow", W < 260); bubble.style.top = `${(33 / H) * 100}%`; }
  function say(i) { if (!bubble || !greet.length) return; line = (i + greet.length) % greet.length; bubble.textContent = greet[line]; bubble.classList.remove("pop"); void bubble.offsetWidth; bubble.classList.add("pop"); }

  function render(now) {
    const x = bx, t = reduced ? 0 : now / 1000, cx = L.cx;
    x.drawImage(bg, 0, 0);
    // แสงจากหน้าต่าง (ลำแสงเฉียง + ฝุ่นลอย)
    if (L.win) { x.globalCompositeOperation = "lighter"; x.fillStyle = "rgba(255,226,160,.07)";
      for (let k = 0; k < 2; k++) { x.beginPath(); x.moveTo(L.win + k * 18, 15); x.lineTo(L.win + 16 + k * 18, 15); x.lineTo(L.win - 30 + k * 18, H); x.lineTo(L.win - 58 + k * 18, H); x.fill(); }
      for (let i = 0; i < 14; i++) { const ph = (t * 0.05 + hash(i, 1, 9)) % 1, px = L.win + 30 - ph * 80 + Math.sin(t + i) * 3, py = 18 + ph * 70; x.fillStyle = `rgba(255,240,200,${0.35 * Math.abs(Math.sin(t * 1.5 + i))})`; x.fillRect(Math.round(px), Math.round(py), 1, 1); }
      x.globalCompositeOperation = "source-over"; }
    // ของประกอบบนพื้น
    const floorItem = (s, fx, fy) => x.drawImage(s.c, fx - s.ax, fy - s.ay);
    floorItem(barrel, 10, 74); floorItem(crate, 22, 77); floorItem(barrel, W - 14, 75); floorItem(pot, W - 30, 73);
    // แมวนอนบนลัง
    { const cX = 16, cY = 62 + (reduced ? 0 : (Math.sin(t * 1.2) > 0.6 ? 0 : 0)); R(x, cX - 1, cY - 1, 12, 7, "#2a1a10"); R(x, cX, cY, 10, 5, "#e8822e"); R(x, cX, cY, 10, 1, "#f4a050"); R(x, cX + 7, cY - 2, 4, 4, "#e8822e"); R(x, cX + 7, cY - 3, 1, 1, "#e8822e"); R(x, cX + 10, cY - 3, 1, 1, "#e8822e");
      R(x, cX + 8, cY, 2, 1, "#2a1a10"); R(x, cX - 2, cY + 3, 3, 2, "#e8822e"); if (!reduced && Math.floor(t / 2.4) % 3 === 0) R(x, cX + 12, cY - 6 - (t * 4 % 3), 3, 1, "#f6f0e0"); }
    // พ่อค้าหลังเคาน์เตอร์ (หันหาผู้เล่น)
    const kf = keeper.F(0), bob = reduced ? 0 : Math.sin(t * 2) > 0.7 ? 1 : 0;
    x.drawImage(kf.c, cx - kf.ax, 57 - kf.ay + bob);
    // เคาน์เตอร์
    const cw = 84, c0 = cx - cw / 2;
    R(x, c0 - 1, 52, cw + 2, 25, "#2a1608"); R(x, c0, 53, cw, 5, "#c8894a"); R(x, c0, 53, cw, 1, "#e8ad6a"); R(x, c0, 58, cw, 18, "#8a5230");
    for (let i = 0; i < 4; i++) { const px = c0 + 4 + i * 20; R(x, px, 61, 16, 12, "#7a4426"); R(x, px, 61, 16, 1, "#5a3018"); R(x, px, 61, 1, 12, "#5a3018"); R(x, px + 1, 72, 15, 1, "#a06a3c"); }
    R(x, c0, 76, cw, 2, "rgba(0,0,0,.3)");
    // ของบนเคาน์เตอร์: กองเหรียญ กล่องสุ่ม คริสตัล
    for (let i = 0; i < 3; i++) for (let j = 0; j <= i; j++) { R(x, c0 + 8 + i * 6, 50 - j * 2, 5, 2, "#f6c840"); R(x, c0 + 8 + i * 6, 50 - j * 2, 5, 1, "#fff0a0"); }
    const glint = !reduced && (t % 3) < 0.15; if (glint) { R(x, c0 + 13, 44, 1, 3, "#fff"); R(x, c0 + 12, 45, 3, 1, "#fff"); }
    R(x, c0 + cw - 32, 44, 14, 9, "#9a6236"); R(x, c0 + cw - 32, 44, 14, 3, "#c08048"); R(x, c0 + cw - 28, 46, 6, 2, "#f0c040"); R(x, c0 + cw - 33, 43, 16, 1, "#2a1608");
    const cyY = 40 + (reduced ? 0 : Math.round(Math.sin(t * 2) * 1.5)); x.drawImage(cry.c, c0 + cw - 9 - cry.ax, cyY - cry.ay);
    x.globalCompositeOperation = "lighter"; x.fillStyle = `rgba(170,255,100,${0.12 + 0.06 * Math.sin(t * 2.4)})`; x.beginPath(); x.arc(c0 + cw - 9, cyY, 8, 0, 7); x.fill(); x.globalCompositeOperation = "source-over";
    // ป้ายราคาห้อยหน้าเคาน์เตอร์
    R(x, cx - 9, 63, 18, 9, "#f0e2c0"); R(x, cx - 9, 63, 18, 1, "#2a1608"); R(x, cx - 9, 71, 18, 1, "#2a1608"); R(x, cx - 9, 63, 1, 9, "#2a1608"); R(x, cx + 8, 63, 1, 9, "#2a1608"); R(x, cx - 5, 66, 3, 3, "#f6c840"); R(x, cx, 67, 5, 1, "#5a3a20");
    // ผู้เล่นยืนหน้าร้าน
    ellipseShadow(x, L.hero, 95, 12); x.drawImage(heroFr.c, L.hero - heroFr.ax, 95 - heroFr.ay);
    // โคมแขวน
    x.globalCompositeOperation = "lighter";
    for (const lx of [Math.round(W * 0.2), Math.round(W * 0.58), Math.round(W * 0.9)]) { const a = 0.1 + (reduced ? 0 : 0.03 * Math.sin(t * 3 + lx)); x.fillStyle = `rgba(255,190,90,${a})`; x.beginPath(); x.arc(lx, 22, 18, 0, 7); x.fill(); x.beginPath(); x.arc(lx, 22, 9, 0, 7); x.fill(); }
    x.globalCompositeOperation = "source-over";
    for (const lx of [Math.round(W * 0.2), Math.round(W * 0.58), Math.round(W * 0.9)]) { R(x, lx, 8, 1, 10, "#2a1a10"); R(x, lx - 3, 17, 7, 2, "#2a1a10"); R(x, lx - 2, 19, 5, 6, "#ffe6a0"); R(x, lx - 2, 19, 2, 6, "#fff6d0"); R(x, lx - 3, 25, 7, 1, "#2a1a10"); }
    // ขยายภาพแบบพิกเซลคม
    const v = view.getContext("2d"); v.imageSmoothingEnabled = false; v.setTransform(1, 0, 0, 1, 0, 0);
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
  // แตะที่พ่อค้า = พูดประโยคถัดไป
  const onTap = (e) => { const r = view.getBoundingClientRect(), wx = (e.clientX - r.left) / S; if (Math.abs(wx - L.cx) < 30) { say(line + 1); lineT = performance.now(); } };
  view.addEventListener("pointerdown", onTap);
  return { destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); view.remove(); }, say };
}
