// ⚔️ ตอบคำถามแบบการ์ดต่อสู้บอส: คำตอบแต่ละข้อเป็นการ์ดที่สุ่มสกิลมาให้ ตอบถูก → ตัวละครร่ายสกิลใส่บอส (หลอดเลือดบอส = จำนวนข้อ)
// ตอบผิด → บอสสวนกลับ · เปลี่ยนตัวละครได้ 5 แบบเพื่อดูสกิลต่างกัน
// เอฟเฟกต์สกิล: Pixel VFX Codex (MIT) github.com/888wing/pixel-vfx-codex — ดู public/vendor/pxfx/LICENSE
import "../vendor/pxfx/pxfx.js";
import "../vendor/pxfx/fx/fireball.js"; import "../vendor/pxfx/fx/fire-explosion.js"; import "../vendor/pxfx/fx/flame-surge.js"; import "../vendor/pxfx/fx/magma-fissure.js";
import "../vendor/pxfx/fx/fire-vortex.js"; import "../vendor/pxfx/fx/billowing-airburst.js";
import "../vendor/pxfx/fx/ice-shard.js"; import "../vendor/pxfx/fx/frost-wheel.js"; import "../vendor/pxfx/fx/ice-shatter.js"; import "../vendor/pxfx/fx/frost-lance-rain.js";
import "../vendor/pxfx/fx/tidal-surge.js"; import "../vendor/pxfx/fx/frost-field.js";
import "../vendor/pxfx/fx/plasma-bolt.js"; import "../vendor/pxfx/fx/arc-ray.js"; import "../vendor/pxfx/fx/thunder-strike.js"; import "../vendor/pxfx/fx/energy-burst.js";
import "../vendor/pxfx/fx/electric-magic-arrow-strike.js"; import "../vendor/pxfx/fx/charged-beam.js";
import "../vendor/pxfx/fx/spiral-gale.js"; import "../vendor/pxfx/fx/wind-vortex.js"; import "../vendor/pxfx/fx/thorn-crown.js"; import "../vendor/pxfx/fx/venom-stream.js";
import "../vendor/pxfx/fx/venom-pool.js"; import "../vendor/pxfx/fx/dust-devil.js";
import "../vendor/pxfx/fx/arcane-missile.js"; import "../vendor/pxfx/fx/shadow-glaive.js"; import "../vendor/pxfx/fx/astral-convergence.js"; import "../vendor/pxfx/fx/black-hole.js";
import "../vendor/pxfx/fx/soul-siphon.js"; import "../vendor/pxfx/fx/starblade-cataclysm.js"; import "../vendor/pxfx/fx/golden-chain-rain.js"; import "../vendor/pxfx/fx/azure-sweep.js";
import { html, raw, esc, toast } from "./core.js";
import { PB, PAL, hex, ramp, pick, blob, outline, canvas, hash, vnoise, mix, tone, sphereLight } from "./world/art.js";
import { grassRGB } from "./world/ground.js";
import { plateau, broadTree, bush } from "./world/sprites.js";
import { charFrame } from "./world/chars.js";
import { BOSSES } from "./bosses.js";

const PXFX = globalThis.PXFX;
const EL = {
  fire: { name: "เพลิง", color: "#e8582a", ic: "🔥" }, ice: { name: "น้ำแข็ง", color: "#3a9ae0", ic: "❄️" }, storm: { name: "สายฟ้า", color: "#e0a820", ic: "⚡" },
  nature: { name: "พงไพร", color: "#3caa4a", ic: "🌿" }, astral: { name: "ดารา", color: "#8a5ae0", ic: "🌌" },
};
const SKILLS = {
  fireball: ["ลูกไฟเพลิงกาฬ", "fire"], "fire-explosion": ["ระเบิดเพลิงขาว", "fire"], "flame-surge": ["คลื่นเพลิงคลั่ง", "fire"], "magma-fissure": ["รอยแยกลาวา", "fire"],
  "fire-vortex": ["พายุหมุนเพลิง", "fire"], "billowing-airburst": ["ระเบิดเพลิงกลางหาว", "fire"],
  "ice-shard": ["ศรผลึกน้ำแข็ง", "ice"], "frost-wheel": ["จักรน้ำแข็ง", "ice"], "ice-shatter": ["ระเบิดผลึกเยือกแข็ง", "ice"], "frost-lance-rain": ["ฝนหอกน้ำแข็ง", "ice"],
  "tidal-surge": ["คลื่นยักษ์ถาโถม", "ice"], "frost-field": ["วงเวทหกแฉกหิมะ", "ice"],
  "plasma-bolt": ["ศรพลาสมา", "storm"], "arc-ray": ["สายฟ้าแตกแขนง", "storm"], "thunder-strike": ["อสนีบาตฟาดลง", "storm"], "energy-burst": ["ระเบิดสายฟ้า", "storm"],
  "electric-magic-arrow-strike": ["ศรสายฟ้าทองคำ", "storm"], "charged-beam": ["ปืนใหญ่แสง", "storm"],
  "spiral-gale": ["หอกวายุหมุน", "nature"], "wind-vortex": ["พายุใบไม้", "nature"], "thorn-crown": ["มงกุฎหนาม", "nature"], "venom-stream": ["สายพิษกัดกร่อน", "nature"],
  "venom-pool": ["บ่อพิษเดือด", "nature"], "dust-devil": ["พายุทราย", "nature"],
  "arcane-missile": ["ขีปนาวุธรูน", "astral"], "shadow-glaive": ["ใบมีดเงา", "astral"], "astral-convergence": ["ระเบิดวงดารา", "astral"], "black-hole": ["หลุมดำ", "astral"],
  "soul-siphon": ["ดูดพลังวิญญาณ", "astral"], "starblade-cataclysm": ["ดาบดาราล้างโลก", "astral"], "golden-chain-rain": ["ฝนโซ่ทอง", "astral"], "azure-sweep": ["ดาบวงคราม", "astral"],
};
export const HEROES = [
  { id: "fire", name: "เปลวา", title: "นักเวทเพลิง", look: { shirt: "#c8402e", hair: "#f0a030", hat: "#6a241a", band: "#f0c040", pants: "#4a2a20" } },
  { id: "ice", name: "หิมะ", title: "จอมเวทน้ำแข็ง", look: { shirt: "#3a78c8", hair: "#e8f4ff", cap: "#1e4a8a", pants: "#2a3a5a" } },
  { id: "storm", name: "อสนี", title: "อัศวินสายฟ้า", look: { shirt: "#d8a828", hair: "#2a2a40", cap: "#4a4a6a", pants: "#3a3a48" } },
  { id: "nature", name: "พฤกษา", title: "ผู้พิทักษ์พงไพร", look: { shirt: "#3c8a3c", hair: "#7a4a1a", long: true, dress: "#2e6a2e" } },
  { id: "astral", name: "ดารา", title: "นักเวทเงา", look: { shirt: "#5a3a9a", hair: "#d8d0ff", hat: "#2a1a4a", band: "#c0a0ff", pants: "#2a2040" } },
];
const POOL = (el) => Object.entries(SKILLS).filter(([id, [, e]]) => e === el && PXFX.get(id)).map(([id]) => id);
const HERO_KEY = "qo:hero";

const CAT_COLOR = { math: "#4a7ad8", science: "#2fa88a", thai: "#d0503a", english: "#8a5ac8", social: "#d87a2a", health: "#3caa4a", early: "#e870a0", brain: "#b04a8a", general: "#d8a830" };

// ---------- ฉากหลัง ----------
function bakeStage(W, H, gy) {
  const pb = new PB(W, H);
  for (let y = 0; y < gy + 6; y++) { const t = y / gy, c = mix([110, 178, 232], [214, 236, 244], Math.min(1, t * 1.1)); for (let x = 0; x < W; x++) pb.set(x, y, c); }
  for (let i = 0; i < 7; i++) { const cx = (i * 97 + 30) % W, cy = 12 + (i * 37) % Math.max(10, gy * 0.45); for (let k = 0; k < 4; k++) blob(pb, cx + k * 11 - 16, cy + (k % 2) * 3, 12 - (k % 2) * 3, 7, ramp([255, 255, 255], 4, -0.25, 0.05), { bias: 0.25 }); }
  for (let x = 0; x < W; x++) { const hh = Math.round(gy - 10 - vnoise(x / 40, 1, 4) * 16); for (let y = hh; y < gy + 4; y++) pb.set(x, y, mix([128, 168, 120], [160, 196, 150], (y - hh) / 30)); }
  for (let y = gy; y < H; y++) for (let x = 0; x < W; x++) { let c = grassRGB(x * 1.6, y * 1.6); if (y < gy + 3) c = tone(c, 0.2); pb.set(x, y, c); }
  for (let y = gy + 10; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot((x - W * 0.52) / (W * 0.36), (y - H * 0.8) / ((H - gy) * 0.5)); if (d < 1 && vnoise(x / 5, y / 5, 9) * 0.4 + d < 1.05) pb.set(x, y, mix([150, 104, 52], [180, 132, 72], vnoise(x / 3, y / 3, 3))); }
  const c = pb.canvas(), x = c.getContext("2d");
  const isl = plateau(3, 1, 7), isl2 = plateau(2, 1, 3); x.globalAlpha = 0.85; x.drawImage(isl.c, W * 0.22, gy * 0.18, isl.c.width * 0.7, isl.c.height * 0.7); x.drawImage(isl2.c, W * 0.66, gy * 0.08, isl2.c.width * 0.6, isl2.c.height * 0.6); x.globalAlpha = 1;
  const tr = broadTree("green", 18); x.drawImage(tr.c, -40, gy - tr.ay + 18); const tr2 = broadTree("apple", 35); x.drawImage(tr2.c, W - 70, gy - tr2.ay + 14);
  const bs = bush(2, "#e8603a"); x.drawImage(bs.c, W * 0.08, H - 30); x.drawImage(bush(1, null).c, W * 0.82, H - 28);
  return c;
}

export function createBattle(host, { total, lesson, category, heroLook, onAnswer, onNext, onHintClick, reduced = false, getTimerHtml }) {
  let hs = 7; for (const ch of String(lesson || "x")) hs = (hs * 31 + ch.charCodeAt(0)) >>> 0;
  const r0 = hash(hs % 100003, 3, 5);
  const B = BOSSES[Math.floor(r0 * BOSSES.length)], bossColor = CAT_COLOR[category] || "#4a9ae0";
  const bossLv = 5 + Math.floor(hash(total, (lesson || "").length, 9) * 30);
  let heroI = Math.max(0, HEROES.findIndex((h) => h.id === (localStorage.getItem(HERO_KEY) || "fire")));
  const state = { hp: total, combo: 0, right: 0, busy: false, q: null, idx: 0, hurt: 0, bossHurt: 0, cast: 0, dead: 0 };
  host.innerHTML = html`<div class="bt">
    <div class="bt-stage" id="btStage"><canvas class="bt-bg"></canvas><canvas class="bt-fx" aria-hidden="true"></canvas>
      <div class="bt-hud">
        <div class="bt-plate hero"><span class="lv">ข้อ <b id="btN">1/${total}</b></span><b class="nm" id="btHeroName"></b><span class="combo" id="btCombo"></span>${raw(getTimerHtml ? getTimerHtml() : "")}</div>
        <div class="bt-plate boss"><span class="lv">Lv ${bossLv}</span><b class="nm">${B.name}</b>
          <div class="bt-hp" role="meter" aria-label="พลังชีวิตบอส" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${total}"><i id="btHpBar"></i>${raw(Array.from({ length: total - 1 }, (_, i) => `<s style="left:${((i + 1) / total) * 100}%"></s>`).join(""))}<em id="btHpTxt">${total}/${total}</em></div></div>
      </div>
      <div class="bt-q" id="btQ"></div>
      <div class="bt-pop" id="btPop" aria-live="polite"></div>
      <div class="bt-heroes" role="group" aria-label="เลือกตัวละคร">${HEROES.map((h, i) => html`<button type="button" class="bt-hero" data-h="${i}" title="${h.name} ${h.title}" aria-label="เปลี่ยนเป็น ${h.name} ${h.title}"><span>${EL[h.id].ic}</span></button>`)}</div>
    </div>
    <div class="bt-hand" id="btHand" role="group" aria-label="การ์ดคำตอบ"></div>
    <div class="bt-foot" id="btFoot"></div></div>`.s;
  const stage = host.querySelector("#btStage"), bg = host.querySelector(".bt-bg"), fxc = host.querySelector(".bt-fx"), hand = host.querySelector("#btHand"), foot = host.querySelector("#btFoot"), pop = host.querySelector("#btPop");
  const view = new PXFX.View(fxc, 240, 150); view.mode = "3d"; view.yaw = 0; view.pitch = 0.3; view.transparent = true; view.noProps = true; view.tune = { density: 1 };
  const boss = B.make(bossColor);
  const heroFrames = new Map(), hf = (dir, step) => { const k = heroI + ":" + dir + ":" + step; if (!heroFrames.has(k)) heroFrames.set(k, charFrame(dir, step, HEROES[heroI].look)); return heroFrames.get(k); };
  let S = 2, W = 0, H = 170, GY = 96, bgc = null, raf = 0, alive = true;
  const pos = () => ({ hx: Math.round(W * 0.2), bx: Math.round(W * 0.76), fy: H - 26 });

  function layout() {
    const w = stage.clientWidth || 800; S = w < 560 ? 1 : w < 900 ? 1.5 : 2;
    // จอแคบ: ย้ายป้ายคำถามออกไปไว้เหนือฉาก จะได้ไม่บังบอส
    const qEl = host.querySelector("#btQ"); if (w < 560) { if (qEl.parentNode === stage) stage.before(qEl); } else if (qEl.parentNode !== stage) stage.appendChild(qEl); W = Math.ceil(w / S); H = Math.round((w < 560 ? 262 : 190)); GY = Math.round(H * 0.5);
    bgc = bakeStage(W, H, GY); bg.width = W; bg.height = H; bg.style.width = w + "px"; bg.style.height = Math.round(H * S) + "px"; stage.style.height = Math.round(H * S) + "px";
  }
  // ---------- วาดฉาก (ตัวละคร บอส) ----------
  function draw(now) {
    const x = bg.getContext("2d"), t = now / 1000, { hx, bx, fy } = pos(); x.imageSmoothingEnabled = false;
    x.drawImage(bgc, 0, 0);
    const sh = (cx, cy, w) => { x.fillStyle = "rgba(20,24,50,.32)"; x.beginPath(); x.ellipse(cx + 6, cy, w, w * 0.22, 0, 0, 7); x.fill(); };
    // บอส (3 เฟรมผ้าพลิ้ว + แสงเรืองซ้อน)
    const bob = reduced ? 0 : Math.round(Math.sin(t * 2.2) * (boss.float ? 3 : 1.4)), knock = state.bossHurt > now ? 6 : 0, fade = state.dead ? Math.max(0, 1 - (now - state.dead) / 900) : 1;
    const fr = boss.frames[reduced ? 0 : Math.floor(t * 5) % boss.frames.length], ox = bx - boss.ax + knock, oy = fy - boss.ay - boss.float + bob + (state.dead ? (1 - fade) * 20 : 0);
    x.globalAlpha = fade; sh(bx, fy, boss.shw * (boss.float ? 0.8 + 0.1 * Math.sin(t * 2.2) : 1)); x.drawImage(fr, ox, oy);
    if (state.bossHurt > now && Math.floor(now / 60) % 2 === 0) { x.globalCompositeOperation = "lighter"; x.globalAlpha = 0.6; x.drawImage(fr, ox, oy); x.globalCompositeOperation = "source-over"; }
    x.globalCompositeOperation = "lighter"; const [gr, gg, gb] = boss.color;
    for (const [gx, gy, r] of boss.glow) { const a = (0.32 + (reduced ? 0 : 0.12 * Math.sin(t * 3 + gx))) * fade, g = x.createRadialGradient(ox + gx, oy + gy, 0, ox + gx, oy + gy, r);
      g.addColorStop(0, `rgba(${gr},${gg},${gb},${a})`); g.addColorStop(1, `rgba(${gr},${gg},${gb},0)`); x.fillStyle = g; x.fillRect(ox + gx - r, oy + gy - r, r * 2, r * 2); }
    if (!reduced) for (let i = 0; i < 7; i++) { const ph = (t * 0.35 + hash(i, 4, 7)) % 1, px = bx - 40 + hash(i, 5, 7) * 80 + Math.sin(t + i) * 4, py = fy - 10 - ph * 110;
      x.fillStyle = `rgba(${gr},${gg},${gb},${0.8 * Math.sin(ph * Math.PI) * fade})`; x.fillRect(Math.round(px), Math.round(py), 2, 2); }
    x.globalCompositeOperation = "source-over"; x.globalAlpha = 1;
    // ตัวละคร
    const casting = state.cast > now, hurt = state.hurt > now, step = casting ? 1 + (Math.floor(now / 120) % 2) * 2 : (reduced ? 0 : Math.floor(t * 1.5) % 2 ? 0 : 0);
    const f = hf(hurt ? 1 : 2, step), hxo = hurt ? -5 : casting ? 4 : 0;
    sh(hx, fy, 16); x.drawImage(f.c, hx - f.ax + hxo, fy - f.ay + (reduced ? 0 : Math.round(Math.sin(t * 3) * 0.6)));
    if (hurt && Math.floor(now / 70) % 2 === 0) { x.globalCompositeOperation = "source-atop"; x.fillStyle = "rgba(255,60,60,.5)"; x.fillRect(hx - 20, fy - 54, 40, 56); x.globalCompositeOperation = "source-over"; }
  }
  const loop = (now) => { if (!alive) return; raf = requestAnimationFrame(loop); draw(now); };

  // ---------- เล่นเอฟเฟกต์สกิล ----------
  let fxBusy = null;
  function playFx(id, { from, to, mirror = false, hue = 0, onHit }) {
    return new Promise((done) => {
      const def = PXFX.get(id); if (!def || reduced) { onHit?.(); setTimeout(done, reduced ? 250 : 0); return; }
      const tm = PXFX.timing(def), cat = (PXFX.get(id) && SKILL_CAT[id]) || "projectile";
      const hitAt = (tm.hits.find((h) => h.kind === "hit" || h.kind === "burst") || tm.hits[tm.hits.length - 1] || { d: tm.length * 0.45 }).d;
      view.hue = hue; view.camera(def);
      const proj = (X, Y, Z) => { view.P(X, Y, Z); return [mirror ? 240 - view.px : view.px, view.py]; };
      let k, left, top;
      if (cat === "projectile" || cat === "beam") { const a = proj(-2.7, 0, 0.9), b = proj(2.2, 0, 0.9); k = (to[0] - from[0]) / (b[0] - a[0]); left = from[0] - a[0] * k; top = from[1] - a[1] * k; }
      else { const c = proj(0, 0, 0); k = (28 * S) / (view.S || 30); left = to[0] - c[0] * k; top = to[2] - c[1] * k; }
      Object.assign(fxc.style, { left: left + "px", top: top + "px", width: 240 * k + "px", height: 150 * k + "px", transform: mirror ? "scaleX(-1)" : "none", display: "block" });
      cancelAnimationFrame(fxBusy);
      // แสดงผล/ปุ่มถัดไปได้เลยหลังโดนเป้าไม่นาน (หางเอฟเฟกต์เล่นต่อจนจบเอง) — สกิลยาว ๆ จะได้ไม่ต้องรอ
      const t0 = performance.now(), speed = 1.25; let hit = false, settled = false;
      const settle = () => { if (!settled) { settled = true; done(); } };
      const step = (now) => { const tau = ((now - t0) / 1000) * speed;
        if (!hit && tau >= hitAt) { hit = true; onHit?.(); }
        if (hit && tau >= Math.min(tm.length, hitAt + 0.6)) settle();
        if (tau >= tm.length || !alive) { fxc.style.display = "none"; if (!hit) onHit?.(); settle(); return; }
        view.renderAt(def, tau, tm); fxBusy = requestAnimationFrame(step); };
      fxBusy = requestAnimationFrame(step);
    });
  }
  // ภาพการ์ด: เฟรมตอนสกิลแรงสุด (เรนเดอร์ครั้งเดียวแล้วจำไว้)
  const artCache = new Map(), [artC] = canvas(240, 150), artView = new PXFX.View(artC, 240, 150);
  artView.mode = "3d"; artView.yaw = 0.3; artView.pitch = 0.35; artView.transparent = true; artView.noProps = true;
  function art(id) {
    if (artCache.has(id)) return artCache.get(id);
    let url = ""; try { const def = PXFX.get(id), tm = PXFX.timing(def), h = tm.hits.find((x) => x.kind === "hit" || x.kind === "burst") || { d: tm.length * 0.5 }; artView.renderAt(def, h.d + 0.08, tm, { noShake: true }); url = artC.toDataURL(); } catch { /* ignore */ }
    artCache.set(id, url); return url;
  }

  // ---------- คำถาม/การ์ด ----------
  function setHeroUI() {
    host.querySelector("#btHeroName").textContent = `${HEROES[heroI].name} · ${HEROES[heroI].title}`;
    host.querySelectorAll(".bt-hero").forEach((b, i) => { b.classList.toggle("on", i === heroI); b.setAttribute("aria-pressed", i === heroI ? "true" : "false"); });
  }
  function popText(text, cls, at) { const s = document.createElement("span"); s.className = "bt-num " + (cls || ""); s.textContent = text; s.style.left = at[0] + "px"; s.style.top = at[1] + "px"; pop.appendChild(s); setTimeout(() => s.remove(), 1400); }
  function setHp() { const bar = host.querySelector("#btHpBar"); bar.style.width = (state.hp / total) * 100 + "%"; host.querySelector("#btHpTxt").textContent = `${state.hp}/${total}`; host.querySelector(".bt-hp").setAttribute("aria-valuenow", state.hp); }
  function cards() {
    const q = state.q, pool = POOL(HEROES[heroI].id), sk = [...pool].sort(() => Math.random() - 0.5);
    const opts = q.options ? q.options.map((o, i) => ({ text: o, a: i })) : [{ text: "✔ ถูก", a: true }, { text: "✖ ผิด", a: false }];
    hand.innerHTML = opts.map((o, i) => { const id = sk[i % sk.length], [nm, el] = SKILLS[id], E = EL[el];
      return html`<button type="button" class="bc el-${el}" data-i="${i}" data-skill="${id}" style="--el:${E.color};--d:${(i - (opts.length - 1) / 2)}" aria-label="ตัวเลือก ${i + 1}: ${o.text} (สกิล ${nm})">
        <span class="bc-art" style="background-image:url('${art(id)}')"><span class="bc-ic">${E.ic}</span><span class="bc-key">${i + 1}</span></span>
        <span class="bc-type">${E.name}</span><span class="bc-name">${nm}</span>
        <span class="bc-ans">${o.text}</span><span class="bc-foot">${HEROES[heroI].name}</span></button>`.s; }).join("");
    hand.style.setProperty("--n", opts.length);
    hand.querySelectorAll(".bc").forEach((b) => b.onclick = () => pickCard(b, opts[+b.dataset.i].a));
  }
  async function pickCard(btn, a) {
    if (state.busy) return; state.busy = true;
    hand.querySelectorAll(".bc").forEach((b) => (b.disabled = true)); btn.classList.add("picked");
    const r = await onAnswer(a);
    if (!r) { state.busy = false; hand.querySelectorAll(".bc").forEach((b) => (b.disabled = false)); btn.classList.remove("picked"); return; }
    const { hx, bx, fy } = pos(), from = [hx * S + 14 * S, (fy - 24) * S], to = [bx * S, (fy - boss.hit) * S, fy * S];
    if (r.correct) {
      state.combo++; state.right++; btn.classList.add("right"); state.cast = performance.now() + 900;
      await playFx(btn.dataset.skill, { from, to, onHit: () => { state.hp = Math.max(0, state.hp - 1); setHp(); state.bossHurt = performance.now() + 420; stage.classList.remove("shake"); void stage.offsetWidth; stage.classList.add("shake");
        popText(state.combo >= 2 ? `-1  COMBO ×${state.combo}!` : "-1", "dmg", [to[0], to[1] - 40]); } });
    } else {
      state.combo = 0; btn.classList.add("wrong");
      hand.querySelectorAll(".bc").forEach((b) => { const o = state.q.options; const txt = o ? o[+b.dataset.i] : (+b.dataset.i === 0 ? "ถูก" : "ผิด"); if ((o && txt === r.answer) || (!o && r.answer === txt)) b.classList.add("right"); });
      popText("พลาด!", "miss", [to[0], to[1] - 40]);
      await playFx("fireball", { from: [to[0] - 30 * S, from[1]], to: [from[0], from[1]], mirror: true, hue: 250, onHit: () => { state.hurt = performance.now() + 500; popText("โดนสวน!", "hurt", [from[0], from[1] - 30]); stage.classList.remove("shake"); void stage.offsetWidth; stage.classList.add("shake"); } });
    }
    host.querySelector("#btCombo").textContent = state.combo >= 2 ? `🔥 คอมโบ ${state.combo}` : "";
    const last = state.idx + 1 >= total;
    if (last && state.hp === 0) { state.dead = performance.now(); popText("ชนะ! 🏆", "win", [to[0], to[1] - 70]); }
    foot.innerHTML = html`<div class="bt-fb ${r.correct ? "ok" : "no"}" role="status">${r.correct ? `✅ ถูกต้อง! ${HEROES[heroI].name}ใช้ “${SKILLS[btn.dataset.skill][0]}”` : html`❌ ยังไม่ถูก — เฉลย: <b>${r.answer}</b>`}
      ${r.explain ? html`<div class="small" style="font-weight:400;margin-top:4px">💡 ${r.explain}</div>` : ""}</div>
      <button class="btn bt-next" id="g-next">${last ? (state.hp === 0 ? "ปราบบอสสำเร็จ! ดูผลลัพธ์ 🏆" : "ดูผลลัพธ์ 🏁") : "ข้อต่อไป ▶"}</button>`.s;
    const nb = foot.querySelector("#g-next"); nb.focus({ preventScroll: true }); nb.onclick = () => { foot.innerHTML = ""; onNext(); };
    state.after?.(r); state.busy = false;
  }
  function ask(idx, q) {
    state.idx = idx; state.q = q; foot.innerHTML = "";
    host.querySelector("#btN").textContent = `${idx + 1}/${total}`;
    host.querySelector("#btQ").innerHTML = html`${q.image ? html`<img src="${q.image}" alt="ภาพประกอบโจทย์">` : ""}<div class="bt-qt">${q.prompt}</div>${q.hint ? html`<button class="linkish small" id="g-hint">💡 ขอใบ้</button>` : ""}`.s;
    const hb = host.querySelector("#g-hint"); if (hb) hb.onclick = () => { hb.replaceWith(Object.assign(document.createElement("div"), { className: "small bt-hint", textContent: "💡 " + q.hint })); onHintClick?.(); };
    cards();
    hand.querySelector(".bc")?.focus({ preventScroll: true });
  }
  host.querySelectorAll(".bt-hero").forEach((b) => b.onclick = () => { heroI = +b.dataset.h; try { localStorage.setItem(HERO_KEY, HEROES[heroI].id); } catch { /* ignore */ } setHeroUI(); if (!state.busy && state.q && !foot.innerHTML) cards(); toast(`เปลี่ยนเป็น ${HEROES[heroI].name} ${HEROES[heroI].title} ${EL[HEROES[heroI].id].ic}`); });
  const onKey = (e) => { if (e.target.matches("input, textarea")) return; const n = +e.key; if (n >= 1 && n <= 4 && !state.busy) hand.querySelector(`.bc[data-i="${n - 1}"]:not([disabled])`)?.click(); };
  document.addEventListener("keydown", onKey);
  const ro = new ResizeObserver(() => layout()); ro.observe(stage);
  layout(); setHeroUI(); setHp(); raf = requestAnimationFrame(loop);
  return { ask, destroy() { alive = false; cancelAnimationFrame(raf); cancelAnimationFrame(fxBusy); ro.disconnect(); document.removeEventListener("keydown", onKey); }, get bossHp() { return state.hp; }, state };
}
// ประเภทเอฟเฟกต์ (ยิงจากตัวละครไปหาบอส หรือเกิดที่ตัวบอส)
const SKILL_CAT = {
  fireball: "projectile", "plasma-bolt": "projectile", "ice-shard": "projectile", "arcane-missile": "projectile", "frost-wheel": "projectile", "shadow-glaive": "projectile",
  "spiral-gale": "projectile", "electric-magic-arrow-strike": "projectile", "arc-ray": "beam", "charged-beam": "beam", "soul-siphon": "beam", "venom-stream": "beam", "starblade-cataclysm": "beam",
};
