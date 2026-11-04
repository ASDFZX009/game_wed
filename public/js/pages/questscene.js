// ฉากหน้าคลังเกม = "ลานกระดานภารกิจ" (พิกเซลอาร์ตแนวเดียวกับหมู่บ้าน/ร้านค้า): ท้องฟ้า เกาะลอย ต้นไม้ กระดานประกาศภารกิจ เจ้าหน้าที่กิลด์
import { PB, PAL, hash, vnoise, clamp, hex, mix, tone, ramp, pick, cylLight, outline, blob, cylinder, canvas } from "../world/art.js";
import { grassRGB, dirtRGB } from "../world/ground.js";
import { broadTree, pineTree, bush, flowerPatch, plateau, fence, PROP } from "../world/sprites.js";
import { charFrame } from "../world/chars.js";
import { VILLAGERS } from "./world.js";

const H = 190;
const CLERK = VILLAGERS[3].look; // ผู้เฒ่าผมขาว = เจ้าหน้าที่กิลด์
const PAPER = ["#f4e4bc", "#f0dcae", "#f8ecd0", "#ecd6a4"];
const SEAL = ["#4a7ad8", "#2fa88a", "#d0503a", "#8a5ac8", "#d87a2a", "#3caa4a", "#e870a0", "#b04a8a", "#d8a830"];

// กระดานประกาศ: เสาไม้ 2 ต้น + หลังคาเล็ก + แผ่นไม้ + กระดาษภารกิจปักหมุด
function questBoard(w) {
  const h = 120, pb = new PB(w, h), Wd = PAL.wood, Rf = ramp(hex("#9a3a2a"), 8, -0.8, 0.45);
  for (const x0 of [8, w - 16]) cylinder(pb, x0, 18, 8, h - 20, Wd, { bias: -0.05, seed: x0 });
  // หลังคา
  for (let y = 0; y < 16; y++) { const ins = Math.max(0, 12 - y); for (let x = ins; x < w - ins; x++) { let l = 0.62 - y * 0.02 + (y < 2 ? 0.2 : 0); if ((x + (y >> 2) * 3) % 7 === 0) l -= 0.15; pb.set(x, y, pick(Rf, l + (hash(x >> 2, y >> 2, 5) - 0.5) * 0.08)); } }
  for (let x = 0; x < w; x++) pb.set(x, 16, Rf[1]);
  // แผ่นกระดาน
  const bx0 = 4, bx1 = w - 4, by0 = 22, by1 = 94;
  for (let y = by0; y < by1; y++) for (let x = bx0; x < bx1; x++) { const fr = x < bx0 + 5 || x > bx1 - 6 || y < by0 + 5 || y > by1 - 6;
    let l = fr ? 0.7 - (y > by1 - 6 ? 0.25 : 0) + (x < bx0 + 5 ? 0.08 : 0) : 0.36 - ((y - by0) % 9 === 0 ? 0.12 : 0); pb.set(x, y, pick(Wd, l + (vnoise(x / 6, y / 1.5, 2) - 0.5) * 0.12)); }
  // ป้ายหัวกระดาน
  const hx0 = Math.round(w / 2 - 34), hx1 = Math.round(w / 2 + 34);
  for (let y = 12; y < 26; y++) for (let x = hx0; x < hx1; x++) pb.set(x, y, pick(Wd, (y === 12 ? 0.95 : 0.72) - (y === 25 ? 0.3 : 0) + (vnoise(x / 4, y, 8) - 0.5) * 0.1));
  for (let x = hx0 + 8; x < hx1 - 8; x += 1) if (x % 9 < 6) pb.set(x, 18 + (x % 2), Wd[1]);
  // กระดาษภารกิจ
  const cols = Math.max(3, Math.floor((bx1 - bx0 - 14) / 30)), cw = (bx1 - bx0 - 14) / cols;
  for (let r = 0; r < 2; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c, j = hash(i, 3, 11); if (j < 0.12) continue;
    const pw = 22 + Math.round(hash(i, 1, 11) * 4), ph = 26 + Math.round(hash(i, 2, 11) * 5);
    const px = Math.round(bx0 + 7 + c * cw + (cw - pw) / 2 + (j - 0.5) * 4), py = by0 + 8 + r * 34 + Math.round(hash(i, 4, 11) * 3);
    const P = ramp(hex(PAPER[i % 4]), 6, -0.45, 0.25);
    for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) { const curl = (x > pw - 4 && y > ph - 4 && x - (pw - 4) + y - (ph - 4) > 3); if (curl) continue;
      pb.set(px + x, py + y, pick(P, 0.62 - (y > ph - 3 ? 0.18 : 0) - (x > pw - 2 ? 0.12 : 0) + (hash(px + x, py + y, 7) - 0.5) * 0.06)); }
    for (let k = 0; k < 3; k++) for (let x = 3; x < pw - 4 - (k === 2 ? 6 : 0); x++) pb.set(px + x, py + 10 + k * 4, tone(hex("#7a5a3a"), (hash(x, k, i) - 0.5) * 0.3));
    const sc = hex(SEAL[i % SEAL.length]); for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) if (x * x + y * y <= 5) pb.set(px + pw - 7 + x, py + ph - 8 + y, tone(sc, x + y < 0 ? 0.2 : -0.15));
    pb.rect(px + Math.round(pw / 2) - 1, py + 1, 3, 3, [200, 40, 40]); pb.set(px + Math.round(pw / 2) - 1, py + 1, [255, 160, 150]);
  }
  return outline(pb, Math.round(w / 2), h - 2, -0.8);
}

function bakeYard(W, L) {
  const pb = new PB(W, H), gy = 96;
  for (let y = 0; y < gy; y++) { const c = mix([104, 172, 230], [212, 236, 246], Math.min(1, y / gy * 1.05)); for (let x = 0; x < W; x++) pb.set(x, y, c); }
  for (let x = 0; x < W; x++) { const hh = Math.round(gy - 14 - vnoise(x / 46, 1, 6) * 22); for (let y = hh; y < gy + 2; y++) pb.set(x, y, mix([120, 162, 128], [150, 190, 150], (y - hh) / 34)); }
  for (let x = 0; x < W; x++) { const hh = Math.round(gy - 4 - vnoise(x / 22, 3, 2) * 10); for (let y = hh; y < gy + 2; y++) pb.set(x, y, mix([96, 150, 80], [120, 170, 90], (y - hh) / 14)); }
  for (let y = gy; y < H; y++) for (let x = 0; x < W; x++) { let c = grassRGB(x * 1.5, y * 1.5); if (y < gy + 3) c = tone(c, 0.18); pb.set(x, y, c); }
  // ลานดินหน้ากระดาน
  for (let y = gy + 4; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot((x - L.board) / (W * 0.32 + 60), (y - (H - 18)) / 62); if (d < 1 && d + vnoise(x / 5, y / 5, 4) * 0.35 < 1.05) pb.set(x, y, dirtRGB(x * 1.3, y * 1.3, 0.25)); }
  const c = pb.canvas(), x = c.getContext("2d"); x.imageSmoothingEnabled = false;
  const isl = plateau(3, 1, 4); x.globalAlpha = 0.8; x.drawImage(isl.c, W * 0.62, 6, isl.c.width * 0.6, isl.c.height * 0.6);
  if (W > 520) { const i2 = plateau(2, 1, 9); x.drawImage(i2.c, W * 0.08, 18, i2.c.width * 0.5, i2.c.height * 0.5); } x.globalAlpha = 1;
  const put = (s, fx, fy) => x.drawImage(s.c, Math.round(fx - s.ax), Math.round(fy - s.ay));
  for (let i = 0; i < Math.ceil(W / 70); i++) { const t = pineTree(i * 3 + 1); x.globalAlpha = 0.9; put(t, i * 70 + 20 + hash(i, 2, 3) * 30, gy + 4); }
  x.globalAlpha = 1;
  put(broadTree("green", 12), 18, gy + 46); put(broadTree("apple", 31), W - 24, gy + 50);
  const fn = fence(Math.max(3, Math.floor(W / 64))); x.globalAlpha = 0.95; for (let fx = -10; fx < W; fx += fn.c.width) if (Math.abs(fx + fn.c.width / 2 - L.board) > L.bw / 2 + fn.c.width / 2 + 10) x.drawImage(fn.c, fx, gy + 4); x.globalAlpha = 1;
  put(bush(3, "#e8603a"), W * 0.06 + 30, H - 6); put(bush(5, null), W - 50, H - 4);
  put(flowerPatch(2, "#f6c840"), L.board - L.bw / 2 - 60, H - 30); put(flowerPatch(5, "#e84a6a"), L.board + L.bw / 2 + 50, H - 16);
  return c;
}

export function mountQuestScene(host, { shirt = "#5b3df5", reduced = false, greet = [] } = {}) {
  const view = document.createElement("canvas"); view.className = "qs-canvas"; view.setAttribute("aria-hidden", "true");
  host.prepend(view);
  const bubble = host.querySelector(".ss-bubble");
  const clerk = [charFrame(0, 0, CLERK), charFrame(0, 1, CLERK)], heroFr = [charFrame(3, 0, { shirt, pants: "#2a3550", hair: "#3a2a20" }), charFrame(3, 1, { shirt, pants: "#2a3550", hair: "#3a2a20" })];
  const lamp = PROP.lamp(), barrel = PROP.barrel(), crate = PROP.crate(), sign = PROP.sign();
  const [buf, bx] = canvas(10, 10);
  let S = 1.5, W = 0, dpr = 1, bg = null, board = null, L = null, raf = 0, line = 0, lineT = 0, smooth = false;

  function layout() {
    const w = host.clientWidth; dpr = Math.min(2, window.devicePixelRatio || 1); S = w < 640 ? 1 : 1.5;
    smooth = Math.abs(S * dpr - Math.round(S * dpr)) > 0.01;
    W = Math.ceil(w / S); const h = Math.round(H * S), narrow = W < 520;
    const bw = Math.min(260, Math.max(150, Math.round(W * 0.3)));
    L = { board: Math.round(narrow ? W * 0.6 : W * 0.56), bw, clerk: 0, hero: 0, narrow };
    L.clerk = L.board - bw / 2 - 26; L.hero = Math.min(W - 40, L.board + bw / 2 + 40);
    if (narrow) { L.clerk = L.board - bw / 2 - 18; L.hero = -100; }
    board = questBoard(bw); bg = bakeYard(W, L); buf.width = W; buf.height = H; bx.imageSmoothingEnabled = false;
    view.style.width = w + "px"; view.style.height = h + "px"; view.width = Math.round(w * dpr); view.height = Math.round(h * dpr);
    host.style.height = h + "px";
    if (bubble) { bubble.style.left = `${(Math.max(90 / S + 10, L.clerk) / W) * 100}%`; bubble.style.top = `${(108 / H) * 100}%`; }
  }
  function say(i) { if (!bubble || !greet.length) return; line = (i + greet.length) % greet.length; bubble.textContent = greet[line]; bubble.classList.remove("pop"); void bubble.offsetWidth; bubble.classList.add("pop"); }
  const put = (s, fx, fy) => bx.drawImage(s.c, Math.round(fx - s.ax), Math.round(fy - s.ay));
  const shadow = (cx, cy, rx) => { bx.fillStyle = "rgba(30,40,20,.32)"; bx.beginPath(); bx.ellipse(cx, cy, rx, rx * 0.3, 0, 0, 7); bx.fill(); };

  function render(now) {
    const x = bx, t = reduced ? 0 : now / 1000;
    x.drawImage(bg, 0, 0);
    // เมฆลอย
    for (let i = 0; i < 5; i++) { const cx = ((i * 211 + t * (4 + i)) % (W + 120)) - 60, cy = 14 + (i * 23) % 50; x.fillStyle = "rgba(255,255,255,.85)";
      x.fillRect(Math.round(cx), cy, 34, 6); x.fillRect(Math.round(cx) + 6, cy - 4, 20, 4); x.fillRect(Math.round(cx) + 4, cy + 6, 28, 2); }
    const by = H - 20;
    shadow(L.board + 10, by, L.bw / 2 + 6); put(board, L.board, by);
    put(lamp, L.board - L.bw / 2 - 52, by + 4); put(lamp, L.board + L.bw / 2 + 12, by + 4);
    if (!L.narrow) { put(barrel, 48, H - 14); put(crate, 74, H - 10); put(sign, W - 80, H - 10); }
    // แสงโคม
    x.globalCompositeOperation = "lighter";
    for (const lx of [L.board - L.bw / 2 - 52, L.board + L.bw / 2 + 12]) { x.fillStyle = `rgba(255,200,110,${0.08 + (reduced ? 0 : 0.03 * Math.sin(t * 3 + lx))})`; x.beginPath(); x.arc(lx, by - 52, 20, 0, 7); x.fill(); }
    x.globalCompositeOperation = "source-over";
    const step = reduced ? 0 : Math.floor(t * 1.4) % 2;
    shadow(L.clerk, by + 2, 10); put(clerk[Math.sin(t * 2) > 0.85 ? 1 : 0], L.clerk, by + 2);
    if (L.hero > 0) { shadow(L.hero, by + 6, 10); put(heroFr[step], L.hero, by + 6); }
    // ประกายเล็ก ๆ รอบกระดาน
    if (!reduced) for (let i = 0; i < 8; i++) { const ph = (t * 0.25 + hash(i, 5, 2)) % 1, px = L.board - L.bw / 2 + hash(i, 6, 2) * L.bw, py = by - 30 - ph * 80;
      x.fillStyle = `rgba(255,240,170,${0.7 * Math.sin(ph * Math.PI)})`; x.fillRect(Math.round(px), Math.round(py), 2, 2); }
    // ผีเสื้อ
    if (!reduced) for (let i = 0; i < 2; i++) { const px = (W * 0.2 + i * W * 0.55 + Math.sin(t * 0.7 + i) * 40), py = H - 50 + Math.sin(t * 1.3 + i * 2) * 14, f = Math.floor(t * 8 + i) % 2;
      x.fillStyle = i ? "#f6c840" : "#f080b0"; x.fillRect(Math.round(px) - 3, Math.round(py), 3, f ? 3 : 1); x.fillRect(Math.round(px) + 1, Math.round(py), 3, f ? 3 : 1); x.fillStyle = "#2a1a10"; x.fillRect(Math.round(px), Math.round(py), 1, 3); }
    const v = view.getContext("2d"); v.imageSmoothingEnabled = smooth; v.setTransform(1, 0, 0, 1, 0, 0);
    v.drawImage(buf, 0, 0, W * S * dpr, H * S * dpr);
    // โทนอุ่นนิด ๆ ให้เข้ากับหมู่บ้าน
    v.globalCompositeOperation = "soft-light"; v.fillStyle = "rgba(255,190,120,.18)"; v.fillRect(0, 0, view.width, view.height); v.globalCompositeOperation = "source-over";
  }

  let lastW = -1, visible = true;
  const ro = new ResizeObserver(() => { if (host.clientWidth !== lastW) { lastW = host.clientWidth; layout(); if (reduced) render(0); } }); ro.observe(host);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }); io.observe(view);
  lastW = host.clientWidth; layout(); say(0);
  const loop = (now) => { raf = requestAnimationFrame(loop); if (!visible || document.hidden) return;
    if (!reduced && greet.length > 1 && now - lineT > 6000) { if (lineT) say(line + 1); lineT = now; }
    render(now); };
  if (reduced) render(0); else raf = requestAnimationFrame(loop);
  const onTap = (e) => { const r = view.getBoundingClientRect(), wx = (e.clientX - r.left) / S; if (Math.abs(wx - L.clerk) < 50 || Math.abs(wx - L.board) < L.bw / 2) { say(line + 1); lineT = performance.now(); } };
  view.addEventListener("pointerdown", onTap);
  return { destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); view.remove(); }, say };
}
