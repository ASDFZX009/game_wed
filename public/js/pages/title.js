// 🧭 หน้าเริ่มเกม (Title screen) — ฉากทุ่งหญ้าพิกเซล ขนนกเวทบินเขียนเส้นแสง → โลโก้ QUIZ ODYSSEY หล่นทีละตัว → เมนู → สร้างตัวละคร
// ได้แรงบันดาลใจจากหน้าเริ่มเกมแนวพิกเซลทั่วไป แต่ฉาก โลโก้ และลำดับทั้งหมดออกแบบใหม่เอง
import { html, raw } from "../core.js";
import { PB, PAL, hex, ramp, pick, blob, outline, canvas, hash, rng, vnoise, fbm, mix, tone, clamp } from "../world/art.js";
import { grassRGB, dirtRGB } from "../world/ground.js";
import { broadTree, pineTree, bush, flowerPatch, lavender } from "../world/sprites.js";
import { charFrame } from "../world/chars.js";
import { loadSkinFont } from "../prefs.js";
import { OPT, ROWS, DEFAULT, toLook, loadProfile, saveProfile, randomParts } from "../look.js";

const SEEN = "qo:titleSeen";
export const titleSeen = () => { try { return !!sessionStorage.getItem(SEEN); } catch { return true; } };

// ---------- ฉากทุ่งหญ้า (อบครั้งเดียวต่อขนาดจอ) ----------
function bakeMeadow(W, H, S) {
  const pb = new PB(W, H), pathX = (y) => W * 0.5 + Math.sin(y / 38) * W * 0.07 + Math.sin(y / 13) * 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = grassRGB(x * 1.3, y * 1.3); const m = fbm(x / 70, y / 70, 3); c = tone(c, (m - 0.5) * 0.42);
    const d = Math.abs(x - pathX(y)), pw = 8 + vnoise(x / 6, y / 6, 2) * 3;
    if (y > H * 0.5 && d < pw) c = d > pw - 1.6 ? tone(dirtRGB(x * 1.3, y * 1.3, 0.2), -0.25) : dirtRGB(x * 1.3, y * 1.3, 0.2);
    pb.set(x, y, c);
  }
  const c = pb.canvas(), g = c.getContext("2d"); g.imageSmoothingEnabled = false;
  const r = rng(W * 31 + H), items = [];
  const add = (s, x, y, sh = 0) => items.push({ s, x: Math.round(x), y: Math.round(y), sh });
  const edge = Math.max(70, W * 0.16);
  for (let y = -20; y < H + 120; y += 38 + r() * 20) { add(broadTree(r() < 0.3 ? "autumn" : "green", Math.floor(r() * 90)), r() * edge - 20, y, 34); add(broadTree("green", Math.floor(r() * 90)), W - r() * edge + 20, y + 18, 34); }
  for (let x = edge; x < W - edge; x += 60 + r() * 50) add(r() < 0.5 ? pineTree(Math.floor(r() * 40)) : broadTree("green", Math.floor(r() * 90)), x, 14 + r() * 26, 26);
  for (let i = 0; i < W / 24; i++) { const x = r() * W, y = H * 0.3 + r() * H * 0.75; if (Math.abs(x - pathX(y)) < 22) continue;
    const k = r(); add(k < 0.35 ? bush(Math.floor(r() * 30), r() < 0.4 ? "#e8603a" : null) : k < 0.7 ? flowerPatch(Math.floor(r() * 30), ["#f6c840", "#e84a6a", "#b070e0", "#fff4e0"][Math.floor(r() * 4)]) : lavender(Math.floor(r() * 30)), x, y, k < 0.35 ? 12 : 0); }
  items.sort((a, b) => a.y - b.y);
  for (const o of items) { if (o.sh) { g.fillStyle = "rgba(14,40,20,.3)"; g.beginPath(); g.ellipse(o.x + 6, o.y, o.sh, o.sh * 0.32, 0, 0, 7); g.fill(); } g.drawImage(o.s.c, o.x - o.s.ax, o.y - o.s.ay); }
  // ไล่แสงอุ่นจากมุมซ้ายบน + ขอบภาพมืด
  g.globalCompositeOperation = "soft-light"; let gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, "rgba(255,220,150,.55)"); gr.addColorStop(1, "rgba(40,60,120,.4)"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = "source-over"; gr = g.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.3, W / 2, H * 0.5, Math.max(W, H) * 0.75); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(6,14,28,.55)"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  return c;
}
// ขนนกเวท (ปากกาขนนก) — วาดแนวนอน หัวปากกาชี้ขวา
function quill() {
  const pb = new PB(46, 16), V = ramp([226, 238, 255], 6, -0.55, 0.2), Au = ramp([236, 186, 70], 6, -0.6, 0.45);
  for (let x = 0; x < 34; x++) { const w = Math.sin((x / 34) * Math.PI) * 6 + 1; for (let y = Math.round(8 - w); y <= 8 + w * 0.7; y++) { const notch = (x * 5 + y * 3) % 11 === 0 && Math.abs(y - 8) > 2;
    if (!notch) pb.set(x, y, pick(V, 0.75 - (y - 8) * 0.06 - (x < 6 ? 0.2 : 0) + (hash(x, y, 4) - 0.5) * 0.1)); } }
  for (let x = 2; x < 38; x++) pb.set(x, 8, x < 34 ? V[2] : Au[3]);
  for (let x = 34; x < 44; x++) { const w = Math.max(0, 2.2 - (x - 34) * 0.24); for (let y = Math.round(8 - w); y <= 8 + w; y++) pb.set(x, y, pick(Au, 0.7 - (y - 8) * 0.2)); }
  pb.set(43, 8, [255, 250, 220]);
  return outline(pb, 44, 8, -0.8);
}
// เข็มทิศพิกเซล (ใช้เป็นตราโลโก้)
function compass() {
  const pb = new PB(36, 36), Au = ramp([230, 176, 60], 7, -0.7, 0.45), Pa = ramp([244, 228, 188], 5, -0.4, 0.2);
  for (let y = 0; y < 36; y++) for (let x = 0; x < 36; x++) { const d = Math.hypot(x + 0.5 - 18, y + 0.5 - 18);
    if (d < 17) pb.set(x, y, d > 13.5 ? pick(Au, 0.65 - (x + y - 36) * 0.02) : pick(Pa, 0.6 - d * 0.02 - (x + y - 36) * 0.008)); }
  for (const [x, y] of [[18, 6], [18, 30], [6, 18], [30, 18]]) pb.rect(x - 1, y - 1, 2, 2, Au[1]);
  for (let i = 0; i < 11; i++) { const w = Math.max(0, 3 - i * 0.28); for (let x = Math.round(18 - w); x <= 17 + w; x++) { pb.set(x, 17 - i, x < 18 ? [232, 70, 60] : [170, 36, 36]); pb.set(x, 18 + i, x < 18 ? [200, 210, 230] : [120, 130, 150]); } }
  pb.rect(17, 17, 2, 2, Au[5]);
  return outline(pb, 18, 18, -0.8);
}

export function openTitle({ go, onEnter, reduced = false, me = null, startAt = "intro" } = {}) {
  const prof = loadProfile(); let parts = { ...DEFAULT, ...(prof?.parts || {}) }, from = "menu";
  const root = document.createElement("div"); root.className = "ti"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "QUIZ ODYSSEY หน้าเริ่มเกม");
  const letters = (w, o) => [...w].map((ch, i) => `<span class="l" style="--i:${i + o}">${ch}</span>`).join("");
  root.innerHTML = html`<canvas class="ti-bg" aria-hidden="true"></canvas>
    <div class="ti-logo"><div class="ti-title" role="heading" aria-level="1" aria-label="QUIZ ODYSSEY"><canvas class="ti-compass" aria-hidden="true"></canvas><span class="w" aria-hidden="true">${raw(letters("QUIZ", 0))}</span><span class="w" aria-hidden="true">${raw(letters("ODYSSEY", 4))}</span></div>
      <div class="ti-ribbon"><span>✦ ผจญภัยแห่งความรู้ ✦</span></div></div>
    <nav class="ti-menu" aria-label="เมนูหลัก">
      <button type="button" data-a="play">▶ เริ่มผจญภัย</button><button type="button" data-a="custom">🎨 แต่งตัวละคร</button><button type="button" data-a="settings">⚙️ ตั้งค่า</button></nav>
    <p class="ti-press" aria-hidden="true">แตะหน้าจอหรือกดปุ่มใดก็ได้</p>
    <button type="button" class="ti-skip">ข้าม ⏭</button>
    <section class="ti-cc" aria-labelledby="ccT" hidden>
      <h2 id="ccT" class="ti-cc-t">สร้างตัวละคร</h2>
      <div class="cc-box">
        <div class="cc-prev"><canvas id="ccPrev" width="60" height="70" aria-label="ตัวอย่างตัวละคร" role="img"></canvas>
          <div class="cc-rot"><button type="button" data-rot="1" aria-label="หมุนตัวละครไปทางซ้าย">⟲</button><button type="button" id="ccWalk" aria-pressed="true" aria-label="เดิน/หยุด">🚶</button><button type="button" data-rot="-1" aria-label="หมุนตัวละครไปทางขวา">⟳</button></div></div>
        <div class="cc-form">
          <label class="cc-row"><span>ชื่อ</span><input id="ccName" maxlength="16" autocomplete="off" placeholder="ตั้งชื่อนักผจญภัย…" value="${prof?.name || me?.displayName || ""}"></label>
          ${ROWS.map(([k, lb]) => html`<div class="cc-row" data-k="${k}"><span>${lb}</span><button type="button" class="cc-arr" data-d="-1" aria-label="${lb} ก่อนหน้า">◀</button><output aria-live="polite"></output><button type="button" class="cc-arr" data-d="1" aria-label="${lb} ถัดไป">▶</button></div>`)}
          <div class="cc-act"><button type="button" id="ccBack">⬅ กลับ</button><button type="button" id="ccRand">🎲 สุ่ม</button><button type="button" id="ccOk" class="pri">✔ ยืนยัน เข้าสู่หมู่บ้าน</button></div>
        </div></div></section>
    <div class="ti-black"></div>`.s;
  document.body.appendChild(root); document.body.classList.add("ti-open"); loadSkinFont("pixel");
  const bg = root.querySelector(".ti-bg"), ctx = bg.getContext("2d");
  { const cp = compass(), cc = root.querySelector(".ti-compass"); cc.width = cp.c.width; cc.height = cp.c.height; cc.getContext("2d").drawImage(cp.c, 0, 0); }
  const Q = quill();
  let S = 2, W = 0, H = 0, base = null, raf = 0, alive = true, stage = "intro", qT0 = 0, trailY = 0, timers = [];
  const petals = Array.from({ length: 26 }, (_, i) => ({ x: hash(i, 1, 3), y: hash(i, 2, 3), s: 0.4 + hash(i, 3, 3), c: ["#ffd6e6", "#fff4d0", "#f6c840", "#ffffff"][i % 4] }));

  function layout() {
    const vw = innerWidth, vh = innerHeight; S = vw < 700 ? 1 : vw > 1800 ? 3 : 2; W = Math.ceil(vw / S); H = Math.ceil(vh / S);
    bg.width = W; bg.height = H; bg.style.width = W * S + "px"; bg.style.height = H * S + "px"; base = bakeMeadow(W, H, S);
    const rb = root.querySelector(".ti-ribbon").getBoundingClientRect(); trailY = (rb.top + rb.height / 2) / S;
  }
  function draw(now) {
    const t = now / 1000; ctx.imageSmoothingEnabled = false; ctx.drawImage(base, 0, 0);
    // เงาเมฆเลื่อนผ่าน
    ctx.fillStyle = "rgba(10,30,40,.13)"; for (let i = 0; i < 3; i++) { const cx = ((i * 0.41 + (reduced ? 0 : t * 0.012)) % 1.4 - 0.2) * W, cy = H * (0.25 + i * 0.28); ctx.beginPath(); ctx.ellipse(cx, cy, W * 0.22, H * 0.12, 0.2, 0, 7); ctx.fill(); }
    // กลีบดอกไม้ปลิว
    if (!reduced) for (const p of petals) { const x = ((p.x + t * 0.025 * p.s) % 1) * (W + 20) - 10, y = ((p.y + t * 0.018 * p.s) % 1) * (H + 20) - 10 + Math.sin(t * 2 + p.x * 9) * 4; ctx.fillStyle = p.c; ctx.fillRect(Math.round(x), Math.round(y), Math.floor(t * 4 + p.x * 9) % 2 ? 2 : 1, 1); }
    // ขนนกเวทเขียนเส้นแสง
    if (qT0) { const k = clamp((now - qT0) / 1100, 0, 1), e = 1 - Math.pow(1 - k, 3), x0 = W * 0.14, x1 = W * 0.86, nx = -40 + (x1 + 40) * e, fade = clamp(1 - (now - qT0 - 1900) / 500, 0, 1);
      if (fade > 0) { ctx.globalCompositeOperation = "lighter";
        for (let x = x0; x < Math.min(nx, x1); x++) { const y = trailY + Math.sin(x / 16) * 1.5; ctx.fillStyle = `rgba(255,214,120,${0.75 * fade})`; ctx.fillRect(x, Math.round(y) - 1, 1, 3); ctx.fillStyle = `rgba(255,250,220,${fade})`; ctx.fillRect(x, Math.round(y), 1, 1); }
        for (let i = 0; i < 16; i++) { const px = x0 + hash(i, 7, 1) * (Math.min(nx, x1) - x0), py = trailY + 3 + ((t * 20 + i * 7) % 18); ctx.fillStyle = `rgba(255,236,160,${fade * (1 - ((t * 20 + i * 7) % 18) / 18)})`; ctx.fillRect(Math.round(px), Math.round(py), 1, 1); }
        ctx.globalCompositeOperation = "source-over";
        if (k < 1 && nx > -40) { const qs = S === 1 ? 1 : 2; ctx.drawImage(Q.c, Math.round(nx - Q.ax * qs), Math.round(trailY + Math.sin(nx / 16) * 1.5 - Q.ay * qs), Q.c.width * qs, Q.c.height * qs); } } }
  }
  const loop = (now) => { if (!alive) return; raf = requestAnimationFrame(loop); draw(now); };
  const later = (ms, f) => timers.push(setTimeout(f, ms));
  const setStage = (s) => { stage = s; root.dataset.stage = s; };

  // ---------- เมนู ----------
  const menu = root.querySelector(".ti-menu"), mBtns = [...menu.querySelectorAll("button")];
  const focusMenu = (i) => { mBtns.forEach((b, j) => b.classList.toggle("on", j === i)); mBtns[i].focus({ preventScroll: true }); };
  function toMenu() { timers.forEach(clearTimeout); timers = []; qT0 = qT0 || performance.now() - 5000; root.classList.add("s-logo", "s-ribbon"); setStage("menu"); root.querySelector(".ti-cc").hidden = true; menu.hidden = false; later(reduced ? 0 : 450, () => focusMenu(0)); }
  function skip() { if (stage === "intro" || stage === "logo") toMenu(); }
  menu.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; const a = b.dataset.a;
    if (a === "play") { if (loadProfile()) enter(); else openCC("play"); } else if (a === "custom") openCC("menu"); else if (a === "settings") { close(); go("/settings"); } });
  menu.addEventListener("mouseover", (e) => { const i = mBtns.indexOf(e.target.closest("button")); if (i >= 0) mBtns.forEach((b, j) => b.classList.toggle("on", j === i)); });

  // ---------- สร้างตัวละคร ----------
  const cc = root.querySelector(".ti-cc"), prev = cc.querySelector("#ccPrev"), px = prev.getContext("2d");
  let dirI = 0, walking = !reduced, frameCache = new Map(); const DIRS = [0, 1, 3, 2];
  function syncRows() {
    cc.querySelectorAll(".cc-row[data-k]").forEach((row) => { const k = row.dataset.k, [nm, val] = OPT[k][parts[k]];
      row.querySelector("output").innerHTML = (/^#/.test(val) ? `<i style="background:${val}"></i>` : "") + nm;
      row.classList.toggle("off", k === "headColor" && OPT.head[parts.head][1] === "none"); });
    frameCache = new Map();
  }
  function drawPrev(now) {
    const L = toLook(parts), step = walking ? [0, 1, 0, 3][Math.floor(now / 160) % 4] : 0, key = DIRS[dirI] + ":" + step;
    if (!frameCache.has(key)) frameCache.set(key, charFrame(DIRS[dirI], step, L));
    const f = frameCache.get(key); px.clearRect(0, 0, 60, 70); px.imageSmoothingEnabled = false;
    px.fillStyle = "rgba(20,30,60,.35)"; px.beginPath(); px.ellipse(30, 62, 13, 3.5, 0, 0, 7); px.fill();
    px.drawImage(f.c, Math.round(30 - f.ax), Math.round(63 - f.ay));
  }
  let ccRaf = 0; const ccLoop = (now) => { if (!alive || cc.hidden) return; ccRaf = requestAnimationFrame(ccLoop); drawPrev(now); };
  function openCC(src) { from = src; setStage("cc"); menu.hidden = true; cc.hidden = false; syncRows(); cancelAnimationFrame(ccRaf); ccRaf = requestAnimationFrame(ccLoop); cc.querySelector("#ccName").focus({ preventScroll: true }); }
  cc.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.d) { const k = b.closest(".cc-row").dataset.k, n = OPT[k].length; parts[k] = (parts[k] + +b.dataset.d + n) % n; syncRows(); }
    else if (b.dataset.rot) dirI = (dirI + +b.dataset.rot + 4) % 4;
    else if (b.id === "ccWalk") { walking = !walking; b.setAttribute("aria-pressed", walking); }
    else if (b.id === "ccRand") { parts = randomParts(); syncRows(); }
    else if (b.id === "ccBack") toMenu();
    else if (b.id === "ccOk") { saveProfile(cc.querySelector("#ccName").value, parts); enter(); } });

  // ---------- เข้าเกม / ปิด ----------
  let closed = false;
  function close() { if (closed) return; closed = true; alive = false; cancelAnimationFrame(raf); cancelAnimationFrame(ccRaf); timers.forEach(clearTimeout); removeEventListener("resize", onResize); removeEventListener("keydown", onKey, true);
    root.remove(); document.body.classList.remove("ti-open"); try { sessionStorage.setItem(SEEN, "1"); } catch { /* ignore */ } }
  function enter() { try { sessionStorage.setItem(SEEN, "1"); } catch { /* ignore */ } root.classList.add("out"); const p = loadProfile();
    setTimeout(() => { close(); onEnter?.(p); }, reduced ? 0 : 650); }

  function onKey(e) {
    if (closed) return; e.stopPropagation();
    if (stage === "intro" || stage === "logo") { e.preventDefault(); skip(); return; }
    if (stage === "menu") { const i = mBtns.findIndex((b) => b.classList.contains("on"));
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); focusMenu((i + (e.key === "ArrowDown" ? 1 : -1) + mBtns.length) % mBtns.length); } }
    else if (stage === "cc" && e.key === "Escape") { e.preventDefault(); toMenu(); }
  }
  const onResize = () => { layout(); };
  addEventListener("keydown", onKey, true); addEventListener("resize", onResize);
  root.addEventListener("pointerdown", (e) => { if ((stage === "intro" || stage === "logo") && !e.target.closest(".ti-skip")) skip(); });
  root.querySelector(".ti-skip").addEventListener("click", skip);

  layout(); raf = requestAnimationFrame(loop);
  if (reduced || startAt !== "intro") { toMenu(); if (startAt === "custom") openCC("menu"); }
  else { setStage("intro"); later(450, () => { qT0 = performance.now(); }); later(1500, () => { setStage("logo"); root.classList.add("s-logo"); }); later(2350, () => root.classList.add("s-ribbon")); later(3300, toMenu); }
  return { close, root };
}
