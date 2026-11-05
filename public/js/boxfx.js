// 🎁 ฉากเปิดกล่องสุ่มแบบเต็มจอ: หีบบินหมุนเข้ากลางจอ → สั่นแรงขึ้นพร้อมลำแสงพุ่งจากรูกุญแจ → ฝาระเบิดออก เสาแสงสีตามความหายาก
// → การ์ดโฮโลแกรมลอยขึ้นจากหีบแล้วกางออก (เปิดหลายกล่องได้) · แตะเพื่อข้าม · ลดการเคลื่อนไหว = ข้ามไปผลลัพธ์ทันที
import { html, raw } from "./core.js";
import { PB, hex, mix, ramp, pick, cylLight, sphereLight, clamp, hash, outline } from "./world/art.js";
import { playSound, getPrefs } from "./prefs.js";

export const RCOL = { common: ["#d8fff0", "#7fe0b0"], rare: ["#bfe4ff", "#3a9cff"], epic: ["#f0d0ff", "#b45cff"], legendary: ["#fff4b0", "#ffb020"] };
const BEAM = ["#ff6ae0", "#4ad8ff", "#6aff9a", "#ffd84a"];

// ---------- หีบความละเอียดสูง (ฐาน + ฝาแยกกัน) ----------
const KIND = {
  basic: { frame: "#b8c4d8", panel: [200, 150], horn: false, gem: "#6ad8ff" },
  gold: { frame: "#e8b840", panel: [300, 190], horn: true, gem: "#ff5a6a" },
  profile: { frame: "#f0a0c8", panel: [280, 230], horn: false, gem: "#ffd84a", wing: true },
};
const chestCache = new Map();
function pearl(x, y, W, H, hues, t = 0) { // แผงมุกรุ้งเรืองแสง
  const u = x / W, v = y / H, h = (hues[0] + (hues[1] - hues[0]) * (u * 0.6 + v * 0.4) + Math.sin(u * 9 + v * 5 + t) * 18) % 360;
  const k = 0.18 + 0.22 * (0.5 + 0.5 * Math.sin(u * 7 - v * 4)) + (hash(x >> 1, y >> 1, 3) - 0.5) * 0.06;
  const rgb = hslRGB(h, 1, 0.72); return mix([255, 255, 255], rgb, clamp(k - v * 0.08, 0.05, 0.5));
}
function hslRGB(h, s, l) { const a = s * Math.min(l, 1 - l), f = (n) => { const k = (n + h / 30) % 12; return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))); }; return [f(0), f(8), f(4)]; }
export function chestParts(kind) {
  if (chestCache.has(kind)) return chestCache.get(kind);
  const K = KIND[kind] || KIND.basic, F = ramp(hex(K.frame), 8, -0.75, 0.55), G = ramp(hex(K.gem), 5, -0.5, 0.5), W = 88;
  // ฐาน 88×44
  const base = new PB(W + 2, 46);
  for (let y = 0; y < 42; y++) for (let x = 2; x < W; x++) {
    const ex = Math.min(x - 2, W - 1 - x, y, 41 - y), strap = (x >= 12 && x < 19) || (x >= W - 19 && x < W - 12);
    if (ex < 5 || strap || y < 6) { let t = 0.55 + (ex === 0 ? -0.35 : ex === 1 ? 0.25 : 0) + (y < 2 ? 0.2 : 0) - (y > 37 ? 0.25 : 0) + (x < 6 ? 0.1 : x > W - 6 ? -0.15 : 0);
      if (strap) t = cylLight(((x >= W / 2 ? x - (W - 19) : x - 12) / 3.5) - 1) * 0.85 + 0.05; if ((x + y * 3) % 23 === 0 && ex >= 2) t += 0.25; base.set(x, y, pick(F, t)); }
    else base.set(x, y, pearl(x, y, W, 42, K.panel));
  }
  for (let y = 4; y < 40; y += 8) for (const sx of [14, 16, W - 17, W - 15]) base.set(sx, y, [255, 250, 220]);
  // แผ่นกุญแจ + รูกุญแจ
  const kx = W / 2, ky = 12;
  for (let y = ky - 2; y < ky + 18; y++) for (let x = kx - 9; x < kx + 9; x++) { const d = Math.abs(x + 0.5 - kx) / 9 + Math.max(0, y - ky - 10) / 9; if (d > 1.05) continue; base.set(x, y, pick(F, sphereLight((x - kx) / 9, (y - ky - 7) / 10) * 0.9 + 0.1)); }
  base.rect(kx - 2, ky + 3, 4, 5, [40, 20, 30]); base.rect(kx - 1, ky + 8, 2, 4, [40, 20, 30]); base.set(kx - 1, ky + 4, [255, 230, 255]);
  // ฝา 88×36 โค้ง
  const lid = new PB(W + 2, 38);
  for (let y = 0; y < 36; y++) for (let x = 2; x < W; x++) {
    const arch = Math.sqrt(Math.max(0, 1 - ((x + 0.5 - W / 2) / (W / 2 - 2)) ** 2)) * 14; if (y < 14 - arch) continue;
    const top = 14 - arch, ex = Math.min(x - 2, W - 1 - x, y - top, 35 - y), strap = (x >= 12 && x < 19) || (x >= W - 19 && x < W - 12);
    if (ex < 4 || strap || y > 30) { let t = 0.6 + (ex === 0 ? -0.35 : ex === 1 ? 0.3 : 0) - (y > 33 ? 0.3 : 0) + (x < W / 2 ? 0.08 : -0.08); if (strap) t = cylLight(((x >= W / 2 ? x - (W - 19) : x - 12) / 3.5) - 1) * 0.85 + 0.1; lid.set(x, y, pick(F, t)); }
    else lid.set(x, y, pearl(x, y + 20, W, 60, K.panel, 1.3));
  }
  // อัญมณีบนฝา
  for (let y = 22; y < 32; y++) for (let x = kx - 5; x < kx + 5; x++) { const d = Math.abs(x + 0.5 - kx) + Math.abs(y + 0.5 - 27); if (d < 5.5) lid.set(x, y, pick(G, 0.75 - (x - kx) * 0.06 - (y - 27) * 0.08)); }
  lid.set(kx - 2, 25, [255, 255, 255]);
  const out = { lid: outline(lid, 0, 0, -0.85), base: outline(base, 0, 0, -0.85), key: [kx + 1, ky + 6], horn: K.horn, wing: K.wing, F };
  // เขาโค้ง (หีบทอง) / ปีกเล็ก (หีบโปรไฟล์) — วาดแยกเป็นชั้นหลังฝา
  if (K.horn || K.wing) { const DW = W + 60, hp = new PB(DW, 56), cx = DW / 2;
    for (const sd of [-1, 1]) for (let i = 0; i <= 40; i++) { const t = i / 40;
      // เขาวัว: โผล่จากข้างฝา โค้งออกด้านนอกแล้วงอนขึ้น ปลายชี้เข้า · ปีก: กางออกเป็นแฉก
      const x = K.horn ? cx + sd * (W / 2 - 6 + Math.sin(t * Math.PI * 0.85) * 22 + t * 4) : cx + sd * (W / 2 - 4 + t * 26), y = K.horn ? 50 - t * 44 : 40 - Math.sin(t * Math.PI * 0.6) * 22;
      const w = K.horn ? (1 - t) * 5.5 + 1.2 : (1 - t * 0.6) * 6;
      for (let dy = -w; dy <= w; dy++) for (let dx = -w; dx <= w; dx++) if (dx * dx + dy * dy <= w * w) hp.set(Math.round(x + dx), Math.round(y + dy),
        K.horn ? pick(F, 0.72 - (dx * sd) / w * 0.35 + (t > 0.85 ? 0.15 : 0)) : mix([255, 255, 255], hslRGB(300 + t * 60, 1, 0.75), 0.35 + ((i % 8) < 2 ? 0.25 : 0))); }
    out.deco = outline(hp, 0, 0, -0.85); }
  chestCache.set(kind, out); return out;
}

// ---------- ฉาก ----------
export function playBoxOpening({ kind = "basic", title = "", results, renderCard, actions, reduced = false }) {
  const best = ["common", "rare", "epic", "legendary"].reduce((a, r) => (results.some((x) => x.rarity === r) ? r : a), "common");
  const [col1, col2] = RCOL[best], C = chestParts(kind);
  const el = document.createElement("div"); el.className = "bx"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", `เปิด${title}`);
  el.style.setProperty("--rc1", col1); el.style.setProperty("--rc2", col2);
  el.innerHTML = html`<div class="bx-dim"></div><canvas class="bx-fx" aria-hidden="true"></canvas>
    <div class="bx-chest" aria-hidden="true"><img class="bx-base" src="${C.base.c.toDataURL()}" alt=""><img class="bx-lid" src="${C.lid.c.toDataURL()}" alt="">${C.deco ? html`<img class="bx-deco" src="${C.deco.c.toDataURL()}" alt="">` : ""}</div>
    <div class="bx-cards ${results.length > 1 ? "multi" : ""}">${results.map((r, i) => html`<div class="bx-card r-${r.rarity}" style="--i:${i};--n:${results.length}">${raw(renderCard(r, i))}</div>`)}</div>
    <div class="bx-banner" role="status" aria-live="polite"></div>
    <div class="bx-actions"></div><p class="bx-skip">แตะเพื่อข้าม</p>`.s;
  document.body.appendChild(el); document.body.classList.add("bx-open");
  const cv = el.querySelector(".bx-fx"), x = cv.getContext("2d"), chest = el.querySelector(".bx-chest"), lid = el.querySelector(".bx-lid"), cards = [...el.querySelectorAll(".bx-card")];
  let W = 0, H = 0, dpr = 1, raf = 0, t0 = performance.now(), skipTo = 0, phase = 0, done = false, resolveFn;
  const S = () => Math.min(3.2, Math.max(1.6, Math.min(innerWidth / 260, innerHeight / 230))); // ขนาดพิกเซลของหีบ
  const resize = () => { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px"; chest.style.setProperty("--s", S()); };
  resize(); addEventListener("resize", resize);
  const center = () => [W / 2, H * (results.length > 1 && innerWidth < 640 ? 0.62 : 0.6)];
  const parts = [], sparks = [], beams = [];
  const T = { land: 0.6, shake: 0.8, burst: 2.05, cards: 2.25, end: 3.1 };
  const ease = (k) => 1 - Math.pow(1 - k, 3), back = (k) => 1 + 2.4 * Math.pow(k - 1, 3) + 1.4 * Math.pow(k - 1, 2);
  // ตำแหน่ง/หมุนของหีบตามเวลา
  function chestPose(t) {
    const [cx, cy] = center();
    if (t < T.land) { const k = t / T.land, e = back(Math.min(1, k)); return { x: W * 0.95 + (cx - W * 0.95) * e, y: H * 1.15 + (cy - H * 1.15) * e - Math.sin(k * Math.PI) * H * 0.18, r: (1 - ease(k)) * 720, sx: Math.cos(k * Math.PI * 3) * 0.5 + 0.5 + ease(k) * 0.5, sc: 0.35 + 0.75 * ease(k) }; }
    if (t < T.burst) { const k = (t - T.shake) / (T.burst - T.shake), amp = t < T.shake ? 0 : 2 + k * k * 12, f = 18 + k * 30;
      return { x: cx + Math.sin(t * f) * amp * 0.6, y: cy - Math.abs(Math.sin(t * f * 0.5)) * amp * 0.4, r: Math.sin(t * f * 1.3) * amp * 0.6, sx: 1, sc: 1.1 + (t < T.shake ? 0 : Math.sin(t * 9) * 0.02 + k * 0.08) }; }
    return { x: cx, y: cy, r: 0, sx: 1, sc: 1.1 };
  }
  function addBurst(cx, cy, n, c) { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = 120 + Math.random() * 520; parts.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 220, life: 0.9 + Math.random() * 0.8, t: 0, s: 2 + Math.random() * 4, c: Math.random() < 0.5 ? c : ["#ffffff", ...BEAM][(Math.random() * 5) | 0] }); } }
  function keyPos(p) { const s = S() * p.sc, bw = C.base.c.width * s; return [p.x - bw / 2 + C.key[0] * s, p.y - C.base.c.height * s + C.key[1] * s + 2]; }
  let lastBeam = -1, burstDone = false, cardsShown = false, prevT = 0;
  function frame(now) {
    if (done) return; raf = requestAnimationFrame(frame);
    let t = (now - t0) / 1000 + skipTo; const dt = Math.min(0.05, Math.max(0, t - prevT)); prevT = t;
    x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
    const p = chestPose(t), [cx, cy] = center(), s = S() * p.sc;
    chest.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -100%) rotate(${p.r}deg) scale(${p.sx * p.sc}, ${p.sc})`;
    chest.style.filter = t > T.shake && t < T.burst ? `brightness(${1 + ((t - T.shake) / (T.burst - T.shake)) * 0.6})` : "";
    x.globalCompositeOperation = "lighter";
    // หางตอนบิน
    if (t < T.land) for (let k = 1; k <= 5; k++) { const q = chestPose(Math.max(0, t - k * 0.03)); x.globalAlpha = 0.18 * (1 - k / 6); x.fillStyle = col1; x.beginPath(); x.ellipse(q.x, q.y - 40 * s / 3, 46 * s / 3 * q.sc, 34 * s / 3 * q.sc, 0, 0, 7); x.fill(); }
    x.globalAlpha = 1;
    // ออร่าใต้หีบ
    if (t > T.land * 0.8) { const a = Math.min(1, (t - T.land * 0.8) * 3), g = x.createRadialGradient(cx, cy - 30 * s, 10, cx, cy - 30 * s, 160 * s / 2); g.addColorStop(0, `rgba(255,255,255,${0.25 * a})`); g.addColorStop(0.4, hexA(col2, 0.18 * a)); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, W, H); }
    // ลำแสงจากรูกุญแจ (3 ครั้ง สีต่างกัน)
    if (t > T.shake && t < T.burst) { const slot = Math.floor((t - T.shake) / 0.36); if (slot !== lastBeam && slot < 3) { lastBeam = slot; const a = [Math.PI * 0.05, Math.PI * 0.92, Math.PI * 1.15][slot]; beams.push({ a, c: BEAM[slot % 3], t: 0 }); playTone(500 + slot * 160); } }
    const [kx, ky] = keyPos(p);
    for (const b of beams) { b.t += dt; if (b.t > 0.4) continue; const L = Math.min(1, b.t / 0.08) * Math.max(W, H) * 0.45, al = b.t < 0.25 ? 0.85 : 0.85 * (1 - (b.t - 0.25) / 0.15), w = 0.22;
      const g = x.createLinearGradient(kx, ky, kx + Math.cos(b.a) * L, ky + Math.sin(b.a) * L); g.addColorStop(0, hexA("#ffffff", al)); g.addColorStop(0.15, hexA(b.c, al)); g.addColorStop(1, hexA(b.c, 0));
      x.fillStyle = g; x.beginPath(); x.moveTo(kx, ky); x.lineTo(kx + Math.cos(b.a - w) * L, ky + Math.sin(b.a - w) * L); x.lineTo(kx + Math.cos(b.a + w) * L, ky + Math.sin(b.a + w) * L); x.closePath(); x.fill(); }
    // ระเบิดฝา
    if (t >= T.burst && !burstDone) { burstDone = true; addBurst(cx, cy - 40 * s / 2, best === "legendary" ? 110 : 70, col2); playSound("stamp"); el.classList.add("burst"); if (best === "legendary" || best === "epic") el.classList.add("quake"); }
    if (t >= T.burst) { const k = t - T.burst;
      lid.style.transform = `translate(${-k * 30}px, ${-Math.min(1, k * 2.4) * 260 + k * k * 120}px) rotate(${-k * 140}deg)`; lid.style.opacity = String(Math.max(0, 1 - k * 1.6));
      // เสาแสง
      const pw = 64 * s * (1 + Math.sin(t * 20) * 0.03), top = 0, bot = cy - 26 * s, al = Math.min(1, k * 6) * (k < 0.9 ? 1 : Math.max(0.35, 1 - (k - 0.9)));
      const g = x.createLinearGradient(0, top, 0, bot); g.addColorStop(0, hexA(col2, 0)); g.addColorStop(0.55, hexA(col2, 0.35 * al)); g.addColorStop(1, hexA(col1, 0.85 * al));
      x.fillStyle = g; x.beginPath(); x.moveTo(cx - pw * 0.25, top); x.lineTo(cx + pw * 0.25, top); x.lineTo(cx + pw / 2, bot); x.lineTo(cx - pw / 2, bot); x.fill();
      if (best === "legendary") { x.globalAlpha = 0.35 * al; for (let i = 0; i < 6; i++) { x.fillStyle = BEAM[i % 4]; x.fillRect(cx - pw / 2 + (i / 6) * pw + Math.sin(t * 6 + i) * 6, top, 3, bot); } x.globalAlpha = 1; }
      // วงคลื่นที่พื้น
      for (const d of [0, 0.25]) { const kk = k - d; if (kk < 0 || kk > 0.9) continue; const r = 40 + kk * 420 * (s / 3); x.strokeStyle = hexA("#ffffff", 0.7 * (1 - kk / 0.9)); x.lineWidth = 6 * (1 - kk / 0.9) + 1; x.beginPath(); x.ellipse(cx, cy - 4, r, r * 0.22, 0, 0, 7); x.stroke(); }
      const ring = x.createRadialGradient(cx, cy, 10, cx, cy, 110 * s / 2); ring.addColorStop(0, hexA("#ffffff", 0.5 * al)); ring.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = ring; x.beginPath(); x.ellipse(cx, cy - 4, 120 * s / 2, 30 * s / 2, 0, 0, 7); x.fill();
      if (k < 0.25) { x.globalCompositeOperation = "source-over"; x.fillStyle = `rgba(255,255,255,${0.75 * (1 - k / 0.25)})`; x.fillRect(0, 0, W, H); x.globalCompositeOperation = "lighter"; } }
    // ประกาย + และอนุภาค
    if (Math.random() < (t > T.land ? 0.35 : 0.1)) sparks.push({ x: cx + (Math.random() - 0.5) * W * 0.6, y: cy - Math.random() * H * 0.55, t: 0, s: 3 + Math.random() * 5 });
    for (let i = sparks.length - 1; i >= 0; i--) { const q = sparks[i]; q.t += dt; if (q.t > 0.7) { sparks.splice(i, 1); continue; } const a = Math.sin((q.t / 0.7) * Math.PI); x.fillStyle = `rgba(255,255,255,${a})`; x.fillRect(q.x - q.s, q.y - 1, q.s * 2 + 1, 2); x.fillRect(q.x - 1, q.y - q.s, 2, q.s * 2 + 1); }
    for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.t += dt; if (q.t > q.life) { parts.splice(i, 1); continue; } q.vy += 600 * dt; q.vx *= 0.985; q.x += q.vx * dt; q.y += q.vy * dt; x.globalAlpha = 1 - q.t / q.life; x.fillStyle = q.c; x.fillRect(q.x, q.y, q.s, q.s); }
    x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
    // การ์ดลอยขึ้นจากหีบ
    if (t >= T.cards && !cardsShown) { cardsShown = true; el.classList.add("cards"); const ch = cy - 40 * s / 2; cards.forEach((c) => { c.style.setProperty("--fromY", `${ch - H * 0.42}px`); }); playSound(best === "legendary" || best === "epic" ? "win" : "correct");
      el.querySelector(".bx-banner").innerHTML = html`${results.length > 1 ? `ได้ของ ${results.length} ชิ้น!` : `★ ${results[0].rarityName} ★`}`.s; }
    if (t >= T.end && phase === 0) { phase = 1; el.classList.add("final"); el.querySelector(".bx-skip").hidden = true; actions(el.querySelector(".bx-actions"), close); el.querySelector(".bx-actions button")?.focus(); }
  }
  const skip = () => { const t = (performance.now() - t0) / 1000 + skipTo; if (t < T.burst - 0.05) skipTo += T.burst - 0.05 - t; else if (t < T.end) skipTo += T.end - t; };
  el.addEventListener("pointerdown", (e) => { if (!e.target.closest(".bx-actions, .bx-card button")) skip(); });
  const onKey = (e) => { if (phase === 0 && (e.key === " " || e.key === "Enter" || e.key === "Escape")) { e.preventDefault(); skip(); } else if (phase === 1 && e.key === "Escape") close(); };
  addEventListener("keydown", onKey);
  function close() { if (done) return; done = true; cancelAnimationFrame(raf); removeEventListener("resize", resize); removeEventListener("keydown", onKey); el.classList.add("out"); document.body.classList.remove("bx-open"); setTimeout(() => el.remove(), 220); resolveFn?.(); }
  if (reduced) skipTo = T.end;
  raf = requestAnimationFrame(frame);
  return { close, done: new Promise((r) => (resolveFn = r)), el };
}
function hexA(h, a) { const [r, g, b] = hex(h); return `rgba(${r | 0},${g | 0},${b | 0},${clamp(a, 0, 1)})`; }
let actx = null;
function playTone(f) { try { if (!getPrefs().sound) return; actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const o = actx.createOscillator(), g = actx.createGain(); o.type = "triangle"; o.frequency.value = f; o.frequency.exponentialRampToValueAtTime(f * 1.6, actx.currentTime + 0.18); g.gain.value = 0.06; g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.25); o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + 0.26); } catch { /* ignore */ } }
