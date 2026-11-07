// 🏡 หมู่บ้านแห่งการเรียนรู้ โฉมใหม่ 64 พิกเซลต่อช่อง — ผังเดียวกับหมู่บ้านเดิม (pages/world.js) วาดใหม่ละเอียดขึ้น 2 เท่า
// ใช้ API เดียวกับ mountWorld เดิม (pause, setNight, setLook, destroy, walkToPlace …) · ซุ้มประตูโบราณพาไปหน้า ✨ อัญเชิญ
import { hash, clamp, canvas } from "../world/art.js";
import { subjectSign, drawSignFx, SIGN_FX } from "../world/signs.js";
import { foxFrame } from "../world/chars.js";
import { buildMap, findPath, PLACES, PLAZA, SPOTS, SUN, VILLAGERS } from "../pages/world.js";
import * as A from "./art.js";
import { makeTypeFn, bakeChunk } from "./ground.js";
import { loadSprites } from "../gacha-client.js";

export function mountWorld64(host, { go, playerName = "นักผจญภัย", reduced: reducedOpt = false, night: night0 = false, onHouse = null, heroId = "wayu" } = {}) {
const T = 64, SPR = () => globalThis.QO_SPR || {};
const reduced = reducedOpt; loadSprites();
const REG = { x0: 15, y0: 12, x1: 65, y1: 57 }; // พื้นที่ตัวอย่าง (ช่อง): ใจกลางหมู่บ้าน + ลานซุ้มประตูโบราณ
const inReg = (tx, ty, pad = 3) => tx > REG.x0 - pad && tx < REG.x1 + pad && ty > REG.y0 - pad && ty < REG.y1 + pad;
const M = buildMap(), typeAt = makeTypeFn(M, PLAZA);
const cache = new Map(), spr = (k, f) => cache.get(k) || (cache.set(k, f()), cache.get(k));
const SHADOW = "#16163a", SHADOW_A = 0.5;

// ---------- วัตถุในฉาก ----------
const objects = [], shadows = [], lamps = [], wins = [], glows = [];
const sil = (s) => s._sil || (s._sil = (() => { const [c, x] = canvas(s.c.width, s.c.height); x.drawImage(s.c, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = SHADOW; x.fillRect(0, 0, c.width, c.height); return c; })());
function add(s, bx, by, o = {}) {
  const dx = Math.round(bx - s.ax), dy = Math.round(by - s.ay), ob = { y: o.ysort ?? by, x0: dx, x1: dx + s.c.width, top: dy, bot: dy + s.c.height, s, dx, dy, extra: o.extra, kind: o.kind, ref: o.ref };
  objects.push(ob);
  if (o.shadow !== false) { const mode = o.shadow || "shear", lift = o.lift || 0, w = s.c.width, h = s.c.height;
    shadows.push({ s, dx, dy, foot: by, mode, lift, bb: mode === "shift" ? [dx - 8, dy - lift * SUN.ky - 8, dx + w + lift * SUN.kx + 8, dy + h + 8] : [dx - 16, by - h * SUN.ky - 20, dx + w + h * SUN.kx + 20, by + 20] }); }
  return ob;
}
for (const t of M.trees) { if (!inReg(t.x, t.y)) continue; add(t.kind === "pine" ? spr("pine" + t.v, () => A.pineTree(t.v * 31)) : spr(t.kind + t.v, () => A.broadTree(t.kind, t.v * 17 + t.kind.length)), t.x * T + 32, t.y * T + 58); }
const signImg = new Map();
for (const p of PLACES) {
  if (!inReg(p.x, p.y)) continue;
  if (p.dock) { add(spr("dock", A.dockSign), (p.x - 1) * T + 32, p.y * T + T - 4, { kind: "dock", ref: p }); continue; }
  const hs = spr("h" + p.id, () => A.house(p)), ho = add(hs, p.x * T, (p.y + 4) * T, { shadow: "shift", lift: 128, kind: "house", ref: p });
  const left = p.x * T - A.HOUSE.ax, top = (p.y + 4) * T - A.HOUSE.ay;
  wins.push([left + 78, top + 232], [left + 274, top + 232]);
  if (!p.shop && SIGN_FX[p.id]) { const sg = subjectSign(p.id), big = { c: A.scale2x(sg.c), ax: sg.ax * 2, ay: sg.ay * 2 }; signImg.set(p.id, big);
    ho.sign = { s: big, x: left + A.HOUSE.emblem[0], y: top + A.HOUSE.emblem[1] }; }
  else ho.sign = { shop: true, x: left + A.HOUSE.emblem[0], y: top + A.HOUSE.emblem[1] };
}
for (const h of M.plats) { if (!inReg(h.x, h.y)) continue; const P = spr(`plat${h.w}x${h.h}s${h.seed}`, () => A.plateau(h.w, h.h, h.seed)); add(P.s, h.x * T, (h.y + h.h) * T, { shadow: "shift", lift: 52 }); }
for (const f of M.fences) { if (!inReg(f.x, f.y)) continue; add(spr("fence" + f.len, () => A.fence(f.len)), f.x * T, f.y * T + 60); }
for (const p of M.props) {
  if (!inReg(p.x, p.y)) continue;
  const key = p.kind + (p.kind === "flowers" ? p.color : p.kind === "bush" ? (p.v < 0.5 ? p.color : "plain") + ((p.v * 9) | 0) % 3 : p.v < 0.5 ? 0 : 1);
  const s = spr(key, () => p.kind === "bush" ? A.bush(((p.v * 9) | 0) % 3, p.v < 0.5 ? p.color : null) : p.kind === "flowers" ? A.flowers(Math.floor(p.v * 9), p.color) : p.kind === "lavender" ? A.lavender(3) : A.PROP[p.kind](p.v));
  if (p.kind === "tent") add(s, (p.x + 1) * T, (p.y + 2) * T - 8);
  else { add(s, p.x * T + 32, p.y * T + 56); if (p.kind === "lamp") lamps.push([p.x * T + 32, p.y * T + 56 - 106]); }
}
// เสาหินพันเถาวัลย์ + คริสตัลลอย · เสาใหญ่กลางลานมีวงเวทใบไม้
const pillars = [];
function addPillar(P) { pillars.push(P); const s = spr(`pl${P.W}x${P.H}s${P.seed}`, () => A.pillar(P.W, P.H, P.seed, P.big)); P.o = add(s, P.bx, P.by, { kind: "pillar", ref: P }); }
M.stones.forEach((s, i) => { if (inReg(s.x, s.y)) addPillar({ bx: s.x * T + 32, by: s.y * T + T - 4, W: 60, H: (s.h + 20) * 2, seed: (s.x * 7 + s.y) % 5, owl: s.owl, i }); });
addPillar({ bx: M.mono.x * T + 64, by: M.mono.y * T + T - 8, W: 100, H: 260, seed: 3, big: true, i: 99 });
M.extras.pillars.forEach((q, i) => { if (inReg(q.x, q.y)) addPillar({ bx: q.x * T + 32, by: q.y * T + T - 4, W: 60, H: (q.h + 20) * 2, seed: (q.x + q.y) % 5, i: 60 + i, ruin: true }); });
// ซุ้มประตูโบราณ = ประตูอัญเชิญ
const G = A.gate(), gx = (SPOTS.arch.x + 2) * T, gy = (SPOTS.arch.y + 2) * T + 24, gateO = add(G.s, gx, gy, { kind: "gate" });
const gateFront = [SPOTS.arch.x + 2, SPOTS.arch.y + 3];
for (const [x, y] of [[34, 51], [35, 51], [38, 51], [39, 51], [34, 52], [35, 52], [38, 52], [39, 52], [36, 51], [37, 51]]) M.block[M.at(x, y)] = 1;
// ชาวบ้าน (ใช้ตัวละคร 64px ชุดเดียวกับประตูอัญเชิญ) · คนที่ยืนหน้าซุ้มประตู = มิระ
const CAST = ["prakai", "marina", "thara", "lumen", "fuka", "kage", "en", "veno", "pisa"];
const npcs = M.npcs.filter((n) => inReg(n.x, n.y, 0)).map((n, i) => { const atRuin = Math.abs(n.x - SPOTS.arch.x) < 8 && n.y > SPOTS.ruins.y - 4;
  return { id: atRuin ? "mira" : CAST[i % CAST.length], x: n.x * T + 32, y: n.y * T + 54, tip: atRuin ? "ซุ้มประตูนี้เชื่อมกับดวงดาว แตะที่ซุ้มประตูเพื่อเข้าไปอัญเชิญเพื่อนร่วมทีมได้เลย!" : n.tip, dir: 1, ph: i * 0.7 }; });
const NAMES = { mira: "มิระ", prakai: "ประกาย", marina: "มารีน่า", thara: "ธารา", lumen: "ลูเมน", fuka: "ฟูกะ", kage: "คาเงะ", en: "เอ็น", veno: "เวโน", pisa: "พิษา", wayu: "วายุ", salmon: "แซลม่อน", ryujin: "ริวจิน" };
const dust = [];
const fox = { x: (PLAZA.x + 2) * T, y: (PLAZA.y + 2) * T, tx: 0, ty: 0, face: 1, wait: 1 };
const foxS = [1, -1].flatMap((f) => [0, 1].map((st) => { const s = foxFrame(f, st); return { c: A.scale2x(s.c), ax: s.ax * 2, ay: s.ay * 2 }; }));
const hero = { id: heroId, x: (PLAZA.x + 0.5) * T, y: (PLAZA.y + 6.4) * T, dir: 1, path: null, goal: null, walk: 0 };
{ // จุดเริ่มต้น: ช่องทางเดินใกล้ลานกลางด้านใต้
  let b = null, bd = 1e9; for (let y = 0; y < M.MH; y++) for (let x = 0; x < M.MW; x++) { const k = M.at(x, y); if (M.ground[k] !== 1 || M.block[k]) continue; const d = Math.hypot(x - 42.5, y - 33.5); if (d < bd) { bd = d; b = [x, y]; } }
  if (b) { hero.x = b[0] * T + 32; hero.y = b[1] * T + 40; } }

// ---------- พื้น (อบเป็นชิ้น 256px ตามที่มองเห็น) ----------
const CH = 256, chunks = new Map();
function castShadow(x, s, dx, dy, foot, mode, lift, ox, oy) {
  const c = sil(s);
  if (mode === "shift") { x.setTransform(1, 0, 0, 1, lift * SUN.kx - ox, -lift * SUN.ky - oy); x.drawImage(c, dx, dy); }
  else { x.setTransform(1, 0, -SUN.kx, SUN.ky, SUN.kx * foot - ox, foot * (1 - SUN.ky) - oy); x.drawImage(c, dx, dy); }
  x.setTransform(1, 0, 0, 1, 0, 0);
}
function bake(cx, cy) {
  const X0 = cx * CH, Y0 = cy * CH, img = bakeChunk(M, PLAZA, typeAt, X0, Y0, CH, CH), [c, g] = canvas(CH, CH); g.putImageData(img, 0, 0);
  const [sl, sx] = canvas(CH + 16, CH + 16), ox = X0 - 8, oy = Y0 - 8;
  const hit = shadows.filter((o) => o.bb[2] > ox && o.bb[0] < ox + CH + 16 && o.bb[3] > oy && o.bb[1] < oy + CH + 16);
  for (const o of hit) castShadow(sx, o.s, o.dx, o.dy, o.foot, o.mode, o.lift, ox, oy);
  sx.fillStyle = SHADOW; sx.globalAlpha = 0.55; for (const o of hit) { const w = o.s.c.width * (o.mode === "shift" ? 0.9 : 0.42); sx.beginPath(); sx.ellipse(o.dx + o.s.ax - ox, o.foot - 4 - oy, w / 2, Math.min(18, w / 6), 0, 0, 7); sx.fill(); }
  g.globalAlpha = SHADOW_A; g.filter = "blur(1.5px)"; g.drawImage(sl, -8, -8); g.filter = "none"; g.globalAlpha = 1;
  chunks.set(cy * 1000 + cx, { c, used: performance.now() });
}
function ensureChunks(x0, y0, x1, y1, budget) {
  const t0 = performance.now(); let missing = 0;
  for (let cy = Math.floor(y0 / CH); cy <= Math.floor(y1 / CH); cy++) for (let cx = Math.floor(x0 / CH); cx <= Math.floor(x1 / CH); cx++) {
    const k = cy * 1000 + cx, ch = chunks.get(k); if (ch) { ch.used = performance.now(); continue; }
    if (performance.now() - t0 < budget) bake(cx, cy); else missing++; }
  if (chunks.size > 240) { const now = performance.now(), arr = [...chunks.entries()].filter((e) => now - e[1].used > 3000).sort((a, b) => a[1].used - b[1].used); for (let i = 0; i < Math.min(arr.length, chunks.size - 200); i++) chunks.delete(arr[i][0]); }
  return missing;
}

// ---------- พอร์ทัลในซุ้มประตู ----------
const { PW, PH, P0 } = G, [pc, pg] = canvas(PW, PH), pimg = pg.createImageData(PW, PH), pmask = new Uint8Array(PW * PH);
for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) pmask[y * PW + x] = G.hole(x + P0[0], y + P0[1]) ? 1 : 0;
const PCOL = [[8, 16, 40], [18, 70, 120], [36, 180, 205], [120, 250, 240], [180, 140, 255], [255, 255, 255]];
let open = 0, near = 0, pFrame = 0;
function drawPortal(t) {
  if (++pFrame % 2 && !reduced) return; const d = pimg.data, cx = PW / 2, cy = PH * 0.62;
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) { const i = y * PW + x, k = i * 4; if (!pmask[i]) { d[k + 3] = 0; continue; }
    const dx = (x - cx) / 78, dy = (y - cy) / 140, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx), sw = Math.sin(a * 3 + r * 9 - t * 2.6) * 0.5 + 0.5;
    let v = (sw * 0.55 + (1 - clamp(r, 0, 1)) * 0.55) * open + (1 - open) * (0.3 + Math.sin(a * 2 + r * 6 - t * 1.2) * 0.12 + near * 0.25);
    if (open < 0.3 && hash(x >> 1, (y + Math.floor(t * 20)) >> 1, 7) > 0.992) v = 1.1;
    if (open > 0.3 && hash(x, y, Math.floor(t * 6)) > 0.996) v = 1.2;
    const f = clamp(v, 0, 1.19) * (PCOL.length - 1) * 0.84, j = Math.floor(f), A0 = PCOL[j], B0 = PCOL[Math.min(PCOL.length - 1, j + 1)], u = f - j;
    d[k] = A0[0] + (B0[0] - A0[0]) * u; d[k + 1] = A0[1] + (B0[1] - A0[1]) * u; d[k + 2] = A0[2] + (B0[2] - A0[2]) * u; d[k + 3] = open > 0.05 ? Math.min(255, 120 + open * 200) : 70 + near * 110; }
  pg.putImageData(pimg, 0, 0);
}


// ---------- ✨ เอฟเฟกต์เดิมของหมู่บ้าน (ขยายเป็นสเกล 64px): เวทรอบเสาใหญ่ ประกายคริสตัล แสงโคม เงาเมฆ ----------
const LIME = "#c4ff78", AL = (x, a) => { x.globalAlpha = a < 0 ? 0 : a > 1 ? 1 : a; };
const GLOW = (() => { const [c, g] = canvas(128, 128), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,220,.9)"); gr.addColorStop(0.18, "rgba(210,255,140,.55)"); gr.addColorStop(0.5, "rgba(170,255,100,.18)"); gr.addColorStop(1, "rgba(150,255,90,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return c; })();
const LAMPGLOW = (() => { const [c, g] = canvas(128, 128), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,230,160,.8)"); gr.addColorStop(0.3, "rgba(255,190,90,.35)"); gr.addColorStop(1, "rgba(255,170,60,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return c; })();
const bigP = () => pillars.find((P) => P.big);
function swirl(x, t, front) { const P = bigP();
  for (const [ry0, rx, ry, sp, n] of [[32, 104, 32, 1.6, 3], [140, 76, 24, -2.1, 2]]) for (let k = 0; k < n; k++) { const a0 = t * sp + (k * Math.PI * 2) / n;
    for (let i = 0; i < 40; i++) { const a = a0 + (sp > 0 ? -1 : 1) * i * 0.034, sn = Math.sin(a); if ((sn >= 0) !== front) continue;
      const px = P.bx + Math.cos(a) * rx, py = P.by - ry0 + sn * ry, al = (1 - i / 40) * (front ? 1 : 0.55);
      AL(x, al); x.fillStyle = LIME; x.fillRect(Math.round(px), Math.round(py), i < 12 ? 9 : 5, i < 10 ? 5 : 3); if (i < 8) { x.fillStyle = "#f0ffc8"; x.fillRect(Math.round(px), Math.round(py), 4, 2); } } } }
function leaves(x, t, front) { const P = bigP();
  for (let i = 0; i < 12; i++) { const a = t * 0.9 + (i * Math.PI * 2) / 12, sn = Math.sin(a); if ((sn >= 0) !== front) continue;
    const h = (t * 36 + i * 52) % 240, px = Math.round(P.bx + Math.cos(a) * (96 - h * 0.24)), py = Math.round(P.by - 24 - h + sn * 28), fl = Math.floor(t * 4 + i) % 2;
    x.globalAlpha = Math.min(1, (240 - h) / 60) * (front ? 1 : 0.7);
    x.fillStyle = "#1e4a16"; x.fillRect(px - 2, py - 2, 14, 11); x.fillStyle = fl ? "#7cd44a" : "#5ab83a"; x.fillRect(px, py, 10, 7); x.fillStyle = "#d4ff98"; x.fillRect(px + (fl ? 0 : 6), py, 4, 3); x.fillStyle = "#3a8a2a"; x.fillRect(px + 2, py + 3, 6, 1); }
  x.globalAlpha = 1; }
function magicBack(x, t) { const P = bigP(), cx = P.bx, cy = P.by - 8;
  x.globalCompositeOperation = "lighter"; x.fillStyle = LIME;
  for (let i = 0; i < 140; i++) { const a = (i / 140) * Math.PI * 2, px = cx + Math.cos(a) * 124, py = cy + Math.sin(a) * 40; AL(x, 0.3 + 0.2 * Math.sin(t * 2 + i * 0.5)); x.fillRect(Math.round(px), Math.round(py), 5, 3); }
  for (let i = 0; i < 90; i++) { const a = (i / 90) * Math.PI * 2 - t * 0.6, px = cx + Math.cos(a) * 84, py = cy + Math.sin(a) * 26; if (i % 5 === 0) continue; AL(x, 0.34); x.fillRect(Math.round(px), Math.round(py), 3, 3); }
  swirl(x, t, false); x.globalAlpha = 1; x.globalCompositeOperation = "source-over"; leaves(x, t, false); }
const spark = (x, X, Y, k) => { if (k < 0.12) return; X = Math.round(X); Y = Math.round(Y); AL(x, k); x.fillStyle = "#ffffe6"; x.fillRect(X - 1, Y - 1, 4, 4); x.fillStyle = LIME;
  const Ln = k > 0.75 ? 10 : k > 0.4 ? 6 : 4; for (let i = 3; i <= Ln + 2; i++) { AL(x, k * (1 - i / (Ln + 3))); x.fillRect(X - i, Y, 2, 2); x.fillRect(X + i, Y, 2, 2); x.fillRect(X, Y - i, 2, 2); x.fillRect(X, Y + i, 2, 2); } };
function magicFront(x, t, V) {
  x.globalCompositeOperation = "lighter"; x.fillStyle = LIME;
  for (const P of pillars) { if (P.owl || P.bx < V.x - 160 || P.bx > V.x + V.w + 160 || P.by < V.y - 80 || P.by - P.H - 160 > V.y + V.h) continue;
    const qx = P.bx, qy = P.by - P.H - (P.big ? 68 : 44) + (reduced ? 0 : Math.round(Math.sin(t * 1.9 + P.i) * 6)), pulse = 0.75 + 0.25 * Math.sin(t * 2.4 + P.i), r = P.big ? 1.8 : 1;
    AL(x, 0.6 * pulse); const gs = 128 * r; x.drawImage(GLOW, qx - gs / 2, qy - gs / 2, gs, gs);
    for (let i = 0; i < (P.big ? 8 : 3); i++) { const a = hash(i, P.i, 81) * 6.28, d = (24 + hash(i, P.i, 82) * 40) * r; spark(x, qx + Math.cos(a) * d, qy + Math.sin(a) * d * 0.8 - 8, Math.max(0, Math.sin(t * (1.6 + hash(i, P.i, 83)) + i * 2.3))); } }
  const P = bigP();
  if (P.bx > V.x - 240 && P.bx < V.x + V.w + 240 && P.by > V.y - 80 && P.by - 480 < V.y + V.h) {
    x.fillStyle = LIME; for (let i = 0; i < 6; i++) { const lx = P.bx - 60 + i * 24 + Math.round(Math.sin(t + i) * 4), h = 72 + ((i * 46) % 56) + Math.sin(t * 3 + i * 1.7) * 24, al = 0.2 + 0.12 * Math.sin(t * 2.5 + i);
      for (let k = 0; k < h; k += 3) { AL(x, al * (1 - k / h)); x.fillRect(lx, P.by - 12 - k, 3, 3); } }
    for (let i = 0; i < 18; i++) { const ph = (t * 0.35 + hash(i, 1, 84)) % 1, mx = P.bx + (hash(i, 2, 84) - 0.5) * 200, my = P.by - 16 - ph * 280; spark(x, mx + Math.sin(t * 2 + i) * 8, my, (1 - ph) * 0.9 * Math.abs(Math.sin(t * 3 + i))); }
    swirl(x, t, true); }
  x.globalAlpha = 1; x.globalCompositeOperation = "source-over"; leaves(x, t, true);
  // แสงอุ่นรอบโคมไฟ + หิ่งห้อยรอบอัญมณีรูนของซุ้มประตู
  x.globalCompositeOperation = "lighter";
  for (const [lx2, ly2] of lamps) { if (lx2 < V.x - 120 || lx2 > V.x + V.w + 120 || ly2 < V.y - 120 || ly2 > V.y + V.h + 120) continue; x.globalAlpha = reduced ? 0.5 : 0.42 + 0.08 * Math.sin(t * 3.3 + lx2); x.drawImage(LAMPGLOW, lx2 - 80, ly2 - 80, 160, 160); }
  { const rx = gx, ry = gy - 338; x.globalAlpha = 0.35 + 0.2 * Math.sin(t * 2.4); x.drawImage(LAMPGLOW, rx - 60, ry - 60, 120, 120); x.fillStyle = "rgba(120,230,255,.9)";
    if (!reduced) for (let i = 0; i < 5; i++) { const t2 = t + i * 2.1, fx = rx + Math.sin(t2 * 0.9 + i) * 70, fy = ry + 60 + Math.cos(t2 * 0.7 + i * 2) * 50; x.globalAlpha = 0.5 + 0.5 * Math.sin(t2 * 3); x.fillRect(Math.round(fx), Math.round(fy), 4, 4); } }
  x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
  // เงาเมฆเคลื่อนผ่าน (กลางวัน)
  if (!reduced && !night) { x.fillStyle = "rgba(16,24,60,.10)"; for (let i = 0; i < 4; i++) { const ox = ((t * 44 + i * 1320) % (M.MW * T + 1600)) - 800, oy = (i * 760 + 320) % (M.MH * T);
    x.beginPath(); x.ellipse(ox, oy, 480, 208, 0, 0, 7); x.ellipse(ox + 280, oy + 80, 320, 160, 0, 0, 7); x.fill(); } }
}

// ---------- วาด ----------
host.classList.add("w64");
const cv = document.createElement("canvas"); cv.className = "world-canvas"; cv.tabIndex = 0; cv.setAttribute("role", "application"); cv.setAttribute("aria-label", "หมู่บ้านแห่งการเรียนรู้ ใช้ปุ่มลูกศรเดิน กด E เพื่อเข้าบ้าน หรือแตะที่บ้านเพื่อเดินไป");
const ui = document.createElement("div"); ui.className = "world-ui";
ui.innerHTML = '<div class="w-fx w-haze"></div><div class="w-fx w-rays"></div><div class="w-fx w-tilt top"></div><div class="w-fx w-tilt bot"></div><canvas class="world-labels w64-lbl" aria-hidden="true"></canvas><div class="world-hint"><span class="wh-long">⌨️ ลูกศร / WASD เดิน · E เข้าบ้าน · 👆 แตะที่บ้านเพื่อเดินไปเข้า · ✨ ซุ้มประตูโบราณ = ประตูอัญเชิญ</span><span class="wh-short">👆 แตะพื้นเพื่อเดิน · แตะบ้านเพื่อเข้า</span></div>';
host.append(cv, ui);
const lbl = ui.querySelector(".w64-lbl"), ctx = cv.getContext("2d"), lx = lbl.getContext("2d");
let VW = 0, VH = 0, DPR = 1, zoom = 1, fitAll = false, cam = { x: hero.x, y: hero.y }, night = night0, paused = false, alive = true, raf = 0;
function resize() { DPR = Math.min(2, devicePixelRatio || 1); VW = Math.max(1, host.clientWidth); VH = Math.max(1, host.clientHeight); for (const c of [cv, lbl]) { c.width = VW * DPR | 0; c.height = VH * DPR | 0; c.style.width = VW + "px"; c.style.height = VH + "px"; } setZoom(); }
function setZoom() { zoom = fitAll ? Math.min(VW / ((REG.x1 - REG.x0) * T), VH / ((REG.y1 - REG.y0) * T)) : VW < 700 ? 0.72 : VW < 1100 ? 0.9 : 1; }
const ro = new ResizeObserver(() => resize()); ro.observe(host);
const view = () => { const w = VW / zoom, h = VH / zoom, RW = (REG.x1 - REG.x0) * T, RH = (REG.y1 - REG.y0) * T; let x = cam.x - w / 2, y = cam.y - h / 2;
  x = w >= RW ? REG.x0 * T - (w - RW) / 2 : clamp(x, REG.x0 * T, REG.x1 * T - w); y = h >= RH ? REG.y0 * T - (h - RH) / 2 : clamp(y, REG.y0 * T, REG.y1 * T - h); return { x, y, w, h }; };
const im = (k) => { const s = SPR()[k]; if (!s) return null; let i = cache.get("img" + k); if (!i) { i = new Image(); i.src = s; cache.set("img" + k, i); } return i.complete ? i : null; };
function draw(now) {
  const t = now / 1000, V = view(), s = zoom * DPR;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#1a2410"; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(s, 0, 0, s, -V.x * s, -V.y * s); ctx.imageSmoothingEnabled = false;
  const RX0 = (REG.x0 - 2) * T, RY0 = (REG.y0 - 2) * T, RX1 = (REG.x1 + 2) * T, RY1 = (REG.y1 + 2) * T, cl = (a, b, c, d, bu) => ensureChunks(Math.max(a, RX0), Math.max(b, RY0), Math.min(c, RX1), Math.min(d, RY1), bu);
  cl(V.x, V.y, V.x + V.w, V.y + V.h, 1e9); // ที่มองเห็น: อบให้ครบทันที
  cl(V.x - 320, V.y - 320, V.x + V.w + 320, V.y + V.h + 320, 10); // รอบ ๆ: ทยอยอบล่วงหน้า
  for (let cy = Math.floor(V.y / CH); cy <= Math.floor((V.y + V.h) / CH); cy++) for (let cx = Math.floor(V.x / CH); cx <= Math.floor((V.x + V.w) / CH); cx++) { const ch = chunks.get(cy * 1000 + cx); if (ch) ctx.drawImage(ch.c, cx * CH, cy * CH); }
  // ระลอกน้ำ
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 90; i++) { const L = i < 40 ? M.shapes.lakes[0] : M.shapes.lakes[1], a = hash(i, 1, 40) * 6.28, r = Math.sqrt(hash(i, 2, 40)) * 0.8, x = (L.x + Math.cos(a) * r * L.rx) * T, y = (L.y + Math.sin(a) * r * L.ry) * T;
    if (x < V.x - 40 || x > V.x + V.w + 40 || y < V.y - 40 || y > V.y + V.h + 40 || typeAt(x | 0, y | 0) !== 2) continue; const ph = (t * 0.4 + hash(i, 3, 40)) % 1;
    ctx.fillStyle = `rgba(200,236,240,${Math.sin(ph * Math.PI) * 0.35})`; ctx.fillRect(Math.round(x + Math.sin(t + i) * 6), Math.round(y), 10 + (i % 3) * 6, 2); }
  // วงเวทรูนหน้าซุ้มประตู
  { const cx = gx, cy = gy + 30, a0 = 0.18 + near * 0.6 + open * 0.4; ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 0.38);
    for (const [r, n, dir] of [[112, 28, 1], [86, 6, -1], [60, 14, 1]]) { ctx.strokeStyle = `rgba(110,240,230,${a0})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke();
      for (let i = 0; i < n; i++) { const a = (i / n) * 6.283 + t * 0.35 * dir * (reduced ? 0 : 1); ctx.fillStyle = `rgba(200,255,250,${a0})`; ctx.fillRect(Math.round(Math.cos(a) * (r - 9)) - 3, Math.round(Math.sin(a) * (r - 9)) - 3, 6, 6); } }
    ctx.strokeStyle = `rgba(180,140,255,${a0 * 0.9})`; ctx.beginPath(); for (let i = 0; i <= 6; i++) { const a = (i * 2 / 6) * 6.283 - t * 0.2; i ? ctx.lineTo(Math.cos(a) * 86, Math.sin(a) * 86) : ctx.moveTo(Math.cos(a) * 86, Math.sin(a) * 86); } ctx.stroke(); ctx.restore(); }
  ctx.globalCompositeOperation = "source-over";
  if (bigP()) magicBack(ctx, reduced ? 1.3 : t);
  // วัตถุ + ตัวละคร เรียงตามความลึก
  const vis = objects.filter((o) => o.x1 > V.x - 20 && o.x0 < V.x + V.w + 20 && o.bot > V.y - 20 && o.top < V.y + V.h + 40);
  const list = [...vis, ...npcs.map((n) => ({ y: n.y, n })), { y: hero.y, n: hero, me: 1 }, { y: fox.y, fox: 1 }];
  list.sort((a, b) => a.y - b.y);
  const sh = (x, y, w) => { ctx.fillStyle = "rgba(22,22,58,.34)"; ctx.beginPath(); ctx.ellipse(x + 4, y - 2, w, w * 0.3, 0, 0, 7); ctx.fill(); };
  for (const it of list) {
    if (it.fox) { const f = foxS[(fox.face > 0 ? 0 : 2) + (fox.walk ? Math.floor(t * 8) % 2 : 0)]; sh(fox.x, fox.y, 24); ctx.drawImage(f.c, Math.round(fox.x - f.ax), Math.round(fox.y - f.ay)); continue; }
    if (it.n) { const c = it.n, walking = c === hero && c.walk, k = walking ? Math.floor(t * 9) % 4 : Math.floor(t * 5 + (c.ph || 0)) % 4, img = im(c.id + "_n" + k) || im(c.id + "_0");
      sh(c.x, c.y, walking ? 18 + Math.abs(Math.sin(t * 15)) * 4 : 22);
      if (img) { const ph = t * 15, hop = walking && !reduced ? -Math.abs(Math.sin(ph)) * 6 : 0, tilt = walking && !reduced ? Math.sin(ph) * 0.07 : 0, sq = walking && !reduced ? 1 + Math.abs(Math.cos(ph)) * 0.05 : 1;
        ctx.save(); ctx.translate(Math.round(c.x), Math.round(c.y + hop)); ctx.rotate(tilt); ctx.scale((c.dir < 0 ? -1 : 1) * sq, 1 / sq); ctx.drawImage(img, -32, -63); ctx.restore(); }
      if (walking && !reduced) { if (Math.random() < 0.35) dust.push({ x: c.x - c.dir * 10 + (Math.random() - 0.5) * 10, y: c.y - 2, t }); }
      continue; }
    const o = it;
    if (o.kind === "gate") { drawPortal(t); ctx.drawImage(pc, o.dx + P0[0], o.dy + P0[1]); }
    if (o.hover) { ctx.save(); ctx.filter = "brightness(1.12)"; ctx.drawImage(o.s.c, o.dx, o.dy); ctx.restore(); } else ctx.drawImage(o.s.c, o.dx, o.dy);
    if (o.kind === "house" && o.sign) { const S = o.sign, bob = reduced ? 0 : Math.round(Math.sin(t * 1.8 + o.ref.x) * 2);
      if (S.s) { ctx.drawImage(S.s.c, Math.round(S.x - S.s.ax), Math.round(S.y + 72 - S.s.ay + bob)); ctx.save(); ctx.scale(2, 2); drawSignFx(ctx, o.ref.id, S.x / 2, (S.y - 12 + bob) / 2, reduced ? 1.3 : t, o.hover, reduced); ctx.restore(); } }
    if (o.kind === "pillar") { const P = o.ref, bob = reduced ? 0 : Math.round(Math.sin(t * 1.9 + P.i) * 6);
      if (P.owl) { const ox = P.bx - 20, oy = P.by - P.H - 30, bl = Math.floor(t) % 5 === 0 && (t % 1) < 0.14; ctx.fillStyle = "#2a2030"; ctx.fillRect(ox - 3, oy - 3, 46, 44); ctx.fillStyle = "#7a5434"; ctx.fillRect(ox, oy, 40, 38); ctx.fillStyle = "#a87a4e"; ctx.fillRect(ox + 5, oy + 13, 30, 25);
        ctx.fillStyle = "#c89a6a"; for (let i = 0; i < 6; i++) ctx.fillRect(ox + 8 + (i % 3) * 9, oy + 20 + Math.floor(i / 3) * 7, 5, 3); ctx.fillStyle = "#f6c040"; ctx.fillRect(ox + 5, oy + 7, 12, bl ? 3 : 12); ctx.fillRect(ox + 23, oy + 7, 12, bl ? 3 : 12);
        ctx.fillStyle = "#1a1010"; if (!bl) { ctx.fillRect(ox + 9, oy + 11, 5, 6); ctx.fillRect(ox + 27, oy + 11, 5, 6); } ctx.fillStyle = "#e08a2a"; ctx.fillRect(ox + 18, oy + 19, 4, 7); ctx.fillStyle = "#7a5434"; ctx.fillRect(ox, oy - 5, 8, 8); ctx.fillRect(ox + 32, oy - 5, 8, 8); continue; }
      if (P.big) { ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.5 + 0.35 * Math.sin(t * (reduced ? 0 : 1.6)); ctx.fillStyle = "#b8ff7a"; const X = P.bx - 4, Y0 = P.by - P.H + 56;
        for (let k = 0; k < 4; k++) { const cy = Y0 + k * 36; for (let d = 0; d < 10; d++) { ctx.fillRect(X - 10 + d, cy + d, 3, 3); ctx.fillRect(X + 10 - d, cy + d, 3, 3); } }
        ctx.restore(); }
      const cs = spr("cry" + (P.big ? 26 : 14), () => A.crystal(P.big ? 26 : 14)), qx = P.bx, qy = P.by - P.H - (P.big ? 68 : 44) + bob;
      ctx.drawImage(cs.c, qx - cs.ax, qy - cs.ay); }
    if (o.kind === "gate") { ctx.save(); ctx.globalCompositeOperation = "lighter"; const rx = gx, ry = gy - 364 + 26, gl = ctx.createRadialGradient(rx, ry, 2, rx, ry, 40 + open * 30); gl.addColorStop(0, `rgba(120,240,255,${0.5 + 0.2 * Math.sin(t * 3)})`); gl.addColorStop(1, "rgba(120,240,255,0)"); ctx.fillStyle = gl; ctx.fillRect(rx - 80, ry - 80, 160, 160);
      { const k = 0.25 + near * 0.6 + open * 0.5 + 0.12 * Math.sin(t * 2.4); ctx.fillStyle = `rgba(140,255,245,${k})`; for (const [rx2, ry2] of G.runes) ctx.fillRect(o.dx + rx2 - 2, o.dy + ry2 - 2, 4, 4); }
      if (open > 0.05 || near > 0.05) { const k = Math.max(open, near * 0.4), g2 = ctx.createRadialGradient(gx, gy - 140, 10, gx, gy - 140, 220); g2.addColorStop(0, `rgba(80,220,230,${0.35 * k})`); g2.addColorStop(1, "rgba(80,220,230,0)"); ctx.fillStyle = g2; ctx.fillRect(gx - 240, gy - 380, 480, 480); }
      ctx.restore(); }
  }
  { const x0 = REG.x0 * T, y0 = REG.y0 * T, x1 = REG.x1 * T, y1 = REG.y1 * T, F = 140, C = "14,22,10";
    const band = (gx0, gy0, gx1, gy1, rx, ry, rw, rh) => { const g = ctx.createLinearGradient(gx0, gy0, gx1, gy1); g.addColorStop(0, `rgba(${C},0)`); g.addColorStop(1, `rgba(${C},.97)`); ctx.fillStyle = g; ctx.fillRect(rx, ry, rw, rh); };
    band(x0 + F * 0.4, 0, x0 - F, 0, x0 - F, V.y - 50, F * 1.4, V.h + 100); band(x1 - F * 0.4, 0, x1 + F, 0, x1 - F * 0.4, V.y - 50, F * 1.4, V.h + 100);
    band(0, y0 + F * 0.4, 0, y0 - F, V.x - 50, y0 - F, V.w + 100, F * 1.4); band(0, y1 - F * 0.4, 0, y1 + F, V.x - 50, y1 - F * 0.4, V.w + 100, F * 1.4);
    ctx.fillStyle = `rgb(${C})`; ctx.fillRect(V.x - 50, V.y - 50, x0 - F - V.x + 50, V.h + 100); ctx.fillRect(x1 + F, V.y - 50, V.x + V.w - x1, V.h + 100); ctx.fillRect(V.x - 50, V.y - 50, V.w + 100, y0 - F - V.y + 50); ctx.fillRect(V.x - 50, y1 + F, V.w + 100, V.y + V.h - y1); }
  for (let i = dust.length - 1; i >= 0; i--) { const d = dust[i], a = t - d.t; if (a > 0.6) { dust.splice(i, 1); continue; } ctx.fillStyle = `rgba(214,190,150,${0.55 * (1 - a / 0.6)})`; const r = 3 + a * 10; ctx.fillRect(Math.round(d.x - r / 2), Math.round(d.y - a * 14 - r / 2), Math.round(r), Math.round(r)); }
  if (bigP()) magicFront(ctx, reduced ? 1.3 : t, V);
  // ละอองแสง / หิ่งห้อย
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 90; i++) { const px = V.x + hash(i, 1, 99) * V.w, ph = (t * 0.05 + hash(i, 3, 99)) % 1, py = V.y + hash(i, 2, 99) * V.h - ph * 140, a = Math.sin(ph * Math.PI);
    ctx.fillStyle = night ? `rgba(200,255,140,${a * 0.9})` : `rgba(255,240,190,${a * 0.5})`; ctx.fillRect(Math.round(px + Math.sin(t * 0.7 + i) * 18), Math.round(py), 3, 3); }
  ctx.restore();
  // แสงเย็นสีทอง / กลางคืน (พิกัดหน้าจอ)
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (!night) { const g = ctx.createLinearGradient(0, 0, cv.width, cv.height); g.addColorStop(0, "rgba(255,206,130,.30)"); g.addColorStop(0.5, "rgba(255,196,120,.06)"); g.addColorStop(1, "rgba(70,40,120,.22)"); ctx.globalCompositeOperation = "soft-light"; ctx.fillStyle = g; ctx.fillRect(0, 0, cv.width, cv.height); ctx.globalCompositeOperation = "source-over"; }
  else { ctx.globalCompositeOperation = "multiply"; ctx.fillStyle = "rgb(64,74,148)"; ctx.fillRect(0, 0, cv.width, cv.height); ctx.globalCompositeOperation = "lighter"; ctx.setTransform(s, 0, 0, s, -V.x * s, -V.y * s);
    const glow = (x, y, r, c, a) => { if (x < V.x - r || x > V.x + V.w + r || y < V.y - r || y > V.y + V.h + r) return; const g = ctx.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, `rgba(${c},${a})`); g.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); };
    for (const [x, y] of lamps) glow(x, y, 120, "255,196,110", 0.6); for (const [x, y] of wins) glow(x, y, 54, "255,186,100", 0.7);
    for (const P of pillars) if (!P.owl) glow(P.bx, P.by - P.H - (P.big ? 68 : 44), P.big ? 120 : 70, "150,255,110", 0.5);
    for (const o of objects) if (o.kind === "house" && o.sign?.s) glow(o.sign.x, o.sign.y + 20, 90, "255,220,140", 0.35);
    glow(gx, gy - 170, 280, "90,230,240", 0.3 + open * 0.4 + near * 0.15); glow(gx, gy - 338, 80, "180,255,255", 0.6); ctx.setTransform(1, 0, 0, 1, 0, 0); }
  ctx.globalCompositeOperation = "source-over";
  // ป้ายชื่อ (ตัวอักษรคมชัด)
  lx.setTransform(1, 0, 0, 1, 0, 0); lx.clearRect(0, 0, lbl.width, lbl.height); lx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const toS = (x, y) => [(x - V.x) * zoom, (y - V.y) * zoom];
  lx.textAlign = "center"; lx.textBaseline = "middle";
  for (const o of vis) if (o.kind === "house") { const S = o.sign, [sx, sy] = toS(S.x, S.y + (S.shop ? 0 : 72 + 2 * 0 + 0)), bob = reduced ? 0 : Math.sin(t * 1.8 + o.ref.x) * 2 * zoom;
    if (S.s) { const pw = (S.s.c.width) * zoom, [px, py] = toS(S.x - S.s.ax + 106, S.y + 72 - S.s.ay + 136); lx.font = `800 ${Math.round(21 * zoom)}px Kanit, sans-serif`; lx.fillStyle = "#fff3d6"; lx.strokeStyle = "rgba(42,22,8,.9)"; lx.lineWidth = 4 * zoom; lx.strokeText(o.ref.name, px, py + bob); lx.fillText(o.ref.name, px, py + bob); }
    else { lx.font = `700 ${Math.round(34 * zoom)}px sans-serif`; lx.fillText(o.ref.ic, sx, sy); } }
  { const [sx, sy] = toS(gx, gy - 400); if (sy > -30 && sy < VH + 30) { lx.font = `800 ${Math.round(17 * zoom + 2)}px Kanit, sans-serif`; const tx = "✨ ซุ้มประตูโบราณ · ประตูอัญเชิญ", w = lx.measureText(tx).width + 22;
    lx.fillStyle = "rgba(8,26,40,.88)"; lx.fillRect(sx - w / 2, sy - 15, w, 30); lx.strokeStyle = `rgba(122,240,232,${0.7 + 0.3 * Math.sin(t * 3)})`; lx.lineWidth = 2; lx.strokeRect(sx - w / 2, sy - 15, w, 30); lx.fillStyle = "#d8fffb"; lx.fillText(tx, sx, sy + 1); } }
  { const [sx, sy] = toS(hero.x, hero.y - 80); lx.font = `700 ${Math.round(12 + zoom * 2)}px Kanit, sans-serif`; const w = lx.measureText(playerName).width + 14; lx.fillStyle = "#4a38c8"; lx.fillRect(sx - w / 2, sy - 10, w, 20); lx.fillStyle = "#fff"; lx.fillText(playerName, sx, sy + 1); }
  // ฟองคำพูดชาวบ้าน
  const nb = npcs.find((c) => Math.hypot(c.x - hero.x, c.y - hero.y) < 120);
  if (nb && !talking) { const [sx, sy] = toS(nb.x, nb.y - 76); lx.font = "600 13px 'Noto Sans Thai', Kanit, sans-serif"; const lines = wrap(lx, nb.tip, 220), w = Math.max(...lines.map((l) => lx.measureText(l).width)) + 20, h = lines.length * 18 + 26;
    lx.fillStyle = "#fffaf0"; lx.strokeStyle = "#2a1608"; lx.lineWidth = 2; lx.beginPath(); lx.roundRect(sx - w / 2, sy - h, w, h, 8); lx.fill(); lx.stroke();
    lx.fillStyle = "#6a3ad8"; lx.font = "800 12px Kanit, sans-serif"; lx.fillText(NAMES[nb.id] || "", sx, sy - h + 12); lx.fillStyle = "#2a1608"; lx.font = "600 13px 'Noto Sans Thai', Kanit, sans-serif"; lines.forEach((l, i) => lx.fillText(l, sx, sy - h + 30 + i * 18)); }
}
function wrap(g, text, maxW) { const out = []; let cur = ""; for (const ch of text) { if (g.measureText(cur + ch).width > maxW && /[\s่้๊๋ัิีึืุูำ็์]/.test(ch) === false) { out.push(cur); cur = ch; } else cur += ch; } if (cur) out.push(cur); return out; }

// ---------- เดิน ----------
const tileOf = (x, y) => [Math.floor(x / T), Math.floor((y - 8) / T)];
function nearestFree(tx, ty) { for (let r = 0; r < 5; r++) for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const x = tx + i, y = ty + j; if (M.inb(x, y) && !M.block[M.at(x, y)] && inReg(x, y, 0)) return [x, y]; } return null; }
function walkTo(tx, ty, goal = null) { const g = nearestFree(tx, ty), [sx, sy] = tileOf(hero.x, hero.y); if (!g) return; const p = findPath(M, sx, sy, g[0], g[1]); if (p) { hero.path = p; hero.goal = goal; if (!p.length && goal) arrive(goal); } }
function hitAt(wx, wy) {
  if (wx > gateO.x0 + 20 && wx < gateO.x1 - 20 && wy > gateO.top && wy < gateO.bot) return { kind: "gate" };
  for (const o of objects) if (o.kind === "dock" && wx > o.x0 && wx < o.x1 && wy > o.top && wy < o.bot) return { kind: "house", p: o.ref, o };
  for (const o of objects) if (o.kind === "house" && wx > o.x0 + 16 && wx < o.x1 - 16 && wy > o.top + 20 && wy < o.bot) return { kind: "house", p: o.ref, o };
  return null;
}
const screenToWorld = (cx, cy) => { const V = view(), r = cv.getBoundingClientRect(); return [V.x + (cx - r.left) / zoom, V.y + (cy - r.top) / zoom]; };
cv.addEventListener("pointerdown", (e) => {
  if (talking || paused) return; cv.focus({ preventScroll: true }); const [wx, wy] = screenToWorld(e.clientX, e.clientY), h = hitAt(wx, wy);
  if (h?.kind === "gate") walkTo(gateFront[0], gateFront[1], "gate");
  else if (h?.kind === "house") walkTo(h.p.ex, h.p.ey, h.p);
  else { const [tx, ty] = tileOf(wx, wy + 8); walkTo(tx, ty); }
});
cv.addEventListener("pointermove", (e) => { if (e.pointerType !== "mouse") return; const [wx, wy] = screenToWorld(e.clientX, e.clientY), h = hitAt(wx, wy); gateO.hover = h?.kind === "gate"; for (const o of objects) if (o.kind === "house") o.hover = h?.o === o; cv.style.cursor = h ? "pointer" : "default"; });
const keys = new Set();
const onKD = (e) => { if (talking || paused || document.querySelector(".tk") || e.target.matches?.("input, textarea, select")) return; const k = e.key.toLowerCase();
  if (["arrowleft", "arrowright", "arrowup", "arrowdown", "a", "d", "w", "s"].includes(k)) { keys.add(k); if (e.target === cv) e.preventDefault(); }
  if (k === "e" || k === "enter") { if (Math.hypot(hero.x - gx, hero.y - gy - 40) < 140) arrive("gate"); else { const p = PLACES.find((q) => inReg(q.x, q.y) && Math.hypot(hero.x - (q.ex * T + 32), hero.y - (q.ey * T + 40)) < 80); if (p) arrive(p); } } };
const onKU = (e) => keys.delete(e.key.toLowerCase());
addEventListener("keydown", onKD); addEventListener("keyup", onKU);
let last = 0;
function step(now) {
  const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now; const sp = 4.4 * T;
  let vx = 0, vy = 0;
  if (!talking && !paused) { if (keys.has("arrowleft") || keys.has("a")) vx--; if (keys.has("arrowright") || keys.has("d")) vx++; if (keys.has("arrowup") || keys.has("w")) vy--; if (keys.has("arrowdown") || keys.has("s")) vy++; }
  hero.walk = 0;
  if (vx || vy) { hero.path = null; const n = Math.hypot(vx, vy), nx = hero.x + (vx / n) * sp * dt, ny = hero.y + (vy / n) * sp * dt, ok = (x, y) => { const [a, b] = tileOf(x, y); return M.inb(a, b) && !M.block[M.at(a, b)] && inReg(a, b, 0); };
    if (ok(nx, ny)) { hero.x = nx; hero.y = ny; } else if (ok(nx, hero.y)) hero.x = nx; else if (ok(hero.x, ny)) hero.y = ny; hero.walk = 1; if (vx) hero.dir = vx; }
  else if (hero.path?.length) { const [tx, ty] = hero.path[0], X = tx * T + 32, Y = ty * T + 40, dx = X - hero.x, dy = Y - hero.y, d = Math.hypot(dx, dy);
    if (d < sp * dt) { hero.x = X; hero.y = Y; hero.path.shift(); if (!hero.path.length && hero.goal) { const g0 = hero.goal; hero.goal = null; arrive(g0); } } else { hero.x += (dx / d) * sp * dt; hero.y += (dy / d) * sp * dt; if (Math.abs(dx) > 2) hero.dir = dx > 0 ? 1 : -1; }
    hero.walk = 1; }
  // สุนัขจิ้งจอกเดินเล่นในลาน
  if (!reduced) { fox.wait -= dt; if (fox.wait <= 0) { if (!fox.tx) { const a = Math.random() * 6.28, r = 1.2 + Math.random() * 1.5; fox.tx = (PLAZA.x + Math.cos(a) * r * 2.6) * T; fox.ty = (PLAZA.y + Math.sin(a) * r * 2.2) * T; }
    const dx = fox.tx - fox.x, dy = fox.ty - fox.y, d = Math.hypot(dx, dy); fox.walk = d > 4; if (d > 4) { fox.x += (dx / d) * 90 * dt; fox.y += (dy / d) * 90 * dt; fox.face = dx > 0 ? 1 : -1; } else { fox.tx = 0; fox.wait = 1.5 + Math.random() * 3; } } }
  npcs.forEach((c) => (c.dir = hero.x < c.x ? -1 : 1));
  const dG = Math.hypot(hero.x - gx, hero.y - gy - 30); near += ((dG < 260 ? 1 - dG / 260 : 0) - near) * Math.min(1, dt * 4); if (!talking && open > 0) open = Math.max(0, open - dt * 0.8);
  if (!fitAll) { cam.x += (hero.x - cam.x) * Math.min(1, dt * 5); cam.y += (hero.y - 60 - cam.y) * Math.min(1, dt * 5); } else { cam.x = (REG.x0 + REG.x1) / 2 * T; cam.y = (REG.y0 + REG.y1) / 2 * T; }
  if (VW > 1) draw(now); if (alive) raf = requestAnimationFrame(step);
}

// ---------- ถึงที่หมาย ----------
async function arrive(goal) {
  if (talking) return;
  if (goal === "gate") { talking = true; hero.dir = 1;
    for (let i = 0; i < 34 && alive; i++) { open = Math.min(1, open + 0.05); if (i > 12) hero.y -= 2.2; await new Promise((r) => setTimeout(r, reduced ? 0 : 22)); }
    talking = false; hero.y = gy + 70; go?.("/gacha"); return; }
  if (!goal?.id) return;
  if (goal.dock) go?.(goal.href || "/quiz-game"); else if (goal.shop) go?.(goal.href || "/shop"); else if (onHouse) onHouse(goal.id); else go?.(goal.href);
}
let talking = false;
resize(); raf = requestAnimationFrame(step);
return {
  get online() { return null; },
  pause(v) { paused = !!v; keys.clear(); if (!v) cv.focus({ preventScroll: true }); },
  places: PLACES,
  setNight(v) { night = !!v; host.classList.toggle("w-is-night", night); },
  get night() { return night; },
  destroy() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); removeEventListener("keydown", onKD); removeEventListener("keyup", onKU); cv.remove(); ui.remove(); host.classList.remove("w64"); },
  reachable() { const [sx, sy] = tileOf(hero.x, hero.y); return PLACES.map((p) => ({ id: p.id, ok: !!findPath(M, sx, sy, p.ex, p.ey) })); },
  _hero: hero, _npcs: npcs, netRefresh() {},
  setLook(_l, name) { if (name) playerName = name; },
  setHero(id) { if (id) hero.id = id; },
  _walk(tx, ty) { walkTo(tx, ty); },
  walkToPlace(id) { const p = PLACES.find((x) => x.id === id); if (p) walkTo(p.ex, p.ey, p); },
  walkToGate() { walkTo(gateFront[0], gateFront[1], "gate"); },
  set(o) { if ("at" in o) { hero.x = o.at[0] * T + 32; hero.y = o.at[1] * T + 40; cam.x = hero.x; cam.y = hero.y - 60; hero.path = null; } if ("fit" in o) { fitAll = o.fit; setZoom(); } },
};
}
