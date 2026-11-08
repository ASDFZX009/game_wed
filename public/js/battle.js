// ⚔️ ตอบคำถามแบบการ์ดต่อสู้บอส: คำตอบแต่ละข้อเป็นการ์ดที่สุ่มสกิลมาให้ ตอบถูก → ตัวละครร่ายสกิลใส่บอส (หลอดเลือดบอส = จำนวนข้อ)
// ตอบผิด → บอสสวนกลับ · ตัวละคร = คู่หูจากประตูอัญเชิญ (ภาพ 64px) แต่ละตัวมีสกิลตามธาตุ ความสามารถติดตัว และร่างตื่นพลังเมื่อคอมโบ
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
import { html, raw, esc, toast, api, state as appState, richQ, emojiOnly } from "./core.js";
import { ROSTER, PASSIVE, ITEMS as GITEMS, hasPas } from "../gacha/data.js";
import { myTeam, frameImg, frameUrl } from "./gacha-client.js";
import { shout } from "./talk.js";
import { PB, PAL, hex, ramp, pick, blob, outline, canvas, hash, vnoise, mix, tone, sphereLight } from "./world/art.js";
import { grassRGB } from "./world/ground.js";
import { plateau, broadTree, bush } from "./world/sprites.js";
import { BOSSES } from "./bosses.js";
import { PICK, gainOf } from "./skill-rules.js";
import { bossInfo, RARITY } from "./journey.js";

const PXFX = globalThis.PXFX;
// ภาพการ์ดสกิล: เก็บไว้ทั้งเกม (เดิมวาดใหม่ทุกครั้งที่เริ่มด่าน) · LITE = จำว่าเครื่องนี้ช้า ใช้โหมดเบาตั้งแต่ด่านถัดไปเลย
const artCache = new Map(); let artC = null, artView = null;
const LITE = { get on() { try { return sessionStorage.getItem("qo:lite") === "1"; } catch { return false; } }, set on(v) { try { sessionStorage.setItem("qo:lite", v ? "1" : "0"); } catch { /* ignore */ } } };
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
// สกิลของคู่หู (ใช้แค่ที่มีเอฟเฟกต์จริง)
const POOL = (id) => { const c = ROSTER[id]; const l = (c?.fx || []).filter((x) => PXFX.get(x)); return l.length ? l : ["fireball"]; };
const skillName = (id) => SKILLS[id]?.[0] || id;

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

// ท่าโจมตีสวนของบอสแต่ละตัว: ท่าปกติ · ท่าไม้ตาย (ตอนโกรธจัด/ครบเงื่อนไขสกิล) · ท่าพิเศษร่างจ้าว
const BOSS_ATK = {
  warden: { atk: [["soul-siphon", "ดูดวิญญาณ"], ["shadow-glaive", "ใบมีดเงา"]], ult: ["black-hole", "หลุมดำกลืนแสง"], elite: ["astral-convergence", "ดวงดาวดับสูญ"] },
  knight: { atk: [["thunder-strike", "อสนีฟาดดาบ"], ["charged-beam", "ลำแสงดาบหนาม"]], ult: ["energy-burst", "ระเบิดเกราะสายฟ้า"], elite: ["starblade-cataclysm", "ดาบดาราล้างโลก"] },
  druid: { atk: [["thorn-crown", "มงกุฎหนามรัด"], ["venom-stream", "สายพิษกัดกร่อน"], ["wind-vortex", "พายุใบไม้คม"]], ult: ["venom-pool", "บ่อพิษเดือด"], elite: ["magma-fissure", "รอยแยกรากเพลิง"] },
  wraith: { atk: [["frost-field", "หมอกเยือกแข็ง"], ["ice-shard", "เศษกระดูกน้ำแข็ง"]], ult: ["frost-lance-rain", "ฝนวิญญาณ"], elite: ["tidal-surge", "คลื่นวิญญาณถาโถม"] },
  reaper: { atk: [["fireball", "ลูกไฟนรก"], ["flame-surge", "คลื่นเพลิงพิพากษา"]], ult: ["fire-vortex", "วงเพลิงยมโลก"], elite: ["fire-explosion", "ระเบิดวิญญาณเพลิง"] },
  lich: { atk: [["arcane-missile", "ขีปนาวุธรูน"], ["frost-wheel", "จักรมิติ"], ["plasma-bolt", "ศรมิติ"]], ult: ["golden-chain-rain", "โซ่ทองตรึงวิญญาณ"], elite: ["astral-convergence", "ดวงดาวดับสูญ"] },
  shade: { atk: [["shadow-glaive", "ใบมีดราตรี"], ["arc-ray", "สายฟ้าม่วง"], ["spiral-gale", "พายุปีกราตรี"]], ult: ["azure-sweep", "กวาดดาบราตรี"], elite: ["black-hole", "ราตรีนิรันดร์"] },
};
const bossInfoOf = (id) => bossInfo(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function createBattle(host, { total, lesson, category, heroLook, onAnswer, onNext, onHintClick, reduced = false, getTimerHtml, autoNext = () => true, boss: bossInfo = null, playerLv = 1, onEliminate = null, skillMode = "card" }) {
  let hs = 7; for (const ch of String(lesson || "x")) hs = (hs * 31 + ch.charCodeAt(0)) >>> 0;
  const B = BOSSES.find((b) => b.id === bossInfo?.id) || BOSSES[hs % BOSSES.length], elite = !!bossInfo?.elite;
  const shiny = !!bossInfo?.shiny, info = bossInfoOf(B.id), trait = info?.trait?.id || "", rar = RARITY[info?.rarity] || RARITY.common;
  const bossColor = shiny ? "#ffd84a" : elite ? "#ff3a4a" : CAT_COLOR[category] || "#4a9ae0", bossName = (shiny ? "✨ " : "") + (bossInfo?.name || B.name);
  const AT = BOSS_ATK[B.id] || { atk: [["fireball", "ลูกไฟ"]], ult: ["fire-explosion", "ระเบิดเพลิง"] };
  const bossLv = bossInfo?.lv || 5 + (hs % 30), atkList = [...AT.atk, ...(elite && AT.elite ? [AT.elite] : [])].filter(([id]) => PXFX.get(id)), ult = PXFX.get(AT.ult?.[0]) ? AT.ult : atkList[0];
  const rageAt = trait === "blink" ? 0.5 : 0.3;
  const team = myTeam(); let heroId = team.party;
  const HC = () => ROSTER[heroId], has = (p) => hasPas(heroId, p);
  const inv = { ...(appState.me?.gacha?.inv || {}) };
  const state = { hp: total, combo: 0, right: 0, busy: false, q: null, idx: 0, hurt: 0, bossHurt: 0, cast: 0, dead: 0, charge: 0, windup: 0, lunge: 0, enraged: false, atkI: 0, debuff: null, souls: 0, shield: false, shieldUsed: false, blink: 0, bxOff: 0, awake: false, awakeAt: 0, guard: 0, acidUsed: false, hinted: false, blown: [] };
  const resetGuard = () => { state.guard = has("shield") ? 1 : 0; }; resetGuard();
  // ระบบสกิล: card = สกิลติดการ์ดคำตอบ (เดิม) · pick = เลือกสกิลก่อนตอบ ใช้พลัง · combo = สกิลแรงขึ้นตามคอมโบ · after = ตอบถูกแล้วค่อยเลือกสกิล
  // โหมดใหม่ใช้เลือดบอสเป็นแต้ม (ข้อละ 10) → ตอบถูกทุกข้อด้วยสกิลธรรมดาก็ชนะได้เสมอ สกิลแรงช่วยให้ชนะแม้พลาดบ้าง
  const SM = ["pick", "combo", "after"].includes(skillMode) ? skillMode : "card", PTS = SM !== "card", U = PTS ? PICK.U : 1, HPMAX = total * U, EN_MAX = PICK.EN_MAX;
  state.hp = HPMAX; state.en = 0; state.sel = 0; state.cd = 0; state.skLog = []; state.hp0Said = false;
  host.innerHTML = html`<div class="bt">
    <div class="bt-stage" id="btStage"><canvas class="bt-bg"></canvas><canvas class="bt-fx" aria-hidden="true"></canvas>
      <div class="bt-hud">
        <div class="bt-plate hero"><span class="lv">ข้อ <b id="btN">1/${total}</b> · ผู้เล่น Lv ${playerLv}</span><b class="nm" id="btHeroName"></b><span class="combo" id="btCombo"></span><span class="bt-guard" id="btGuard"></span>${raw(getTimerHtml ? getTimerHtml() : "")}</div>
        <div class="bt-plate boss ${elite ? "elite" : ""} ${shiny ? "shiny" : ""} rar-${info?.rarity || "common"}" style="--rc:${rar.color}"><span class="lv"><i class="bt-rar">${rar.icon} ${rar.name}</i>${elite ? "👑 ร่างจ้าว · " : ""}Lv ${bossLv}</span><b class="nm">${bossName}</b>
          ${info ? html`<span class="bt-trait" title="${info.trait.desc}">✦ ${info.trait.name}<em id="btSouls"></em></span>` : ""}
          <div class="bt-hp" role="meter" aria-label="พลังชีวิตบอส" aria-valuemin="0" aria-valuemax="${HPMAX}" aria-valuenow="${HPMAX}"><i id="btHpBar"></i>${raw(PTS ? "" : Array.from({ length: total - 1 }, (_, i) => `<s style="left:${((i + 1) / total) * 100}%"></s>`).join(""))}<em id="btHpTxt">${HPMAX}/${HPMAX}</em></div></div>
      </div>
      <span class="bt-items" id="btItems"><button type="button" class="bt-it" data-it="hint" title="${GITEMS.hint.d}" aria-label="ใช้การ์ดคำใบ้">💡<b>0</b></button><button type="button" class="bt-it" data-it="pot" title="${GITEMS.pot.d}" aria-label="ใช้ยาฟื้นพลัง">🧪<b>0</b></button></span>
      <div class="bt-q" id="btQ"></div>
      <div class="bt-pop" id="btPop" aria-live="polite"></div>
      <div class="bt-atk" id="btAtk" aria-live="polite"></div>
      <div class="bt-heroes" role="group" aria-label="เลือกคู่หู">${team.ids.slice(0, 8).map((id) => { const c = ROSTER[id]; return html`<button type="button" class="bt-hero r${c.r}" data-h="${id}" style="--hc:${c.col}" title="${c.n} · ${c.t} (ธาตุ${c.el})" aria-label="เปลี่ยนคู่หูเป็น ${c.n} ${c.t}"><img src="${frameUrl(id + "_0")}" alt=""><i>${c.ic}</i></button>`; })}</div>
    </div>
    <div class="bt-skills" id="btSkills" ${PTS ? "" : raw("hidden")} aria-live="polite"></div>
    <div class="bt-hand" id="btHand" role="group" aria-label="การ์ดคำตอบ"></div>
    <div class="bt-foot" id="btFoot"></div></div>`.s;
  const stage = host.querySelector("#btStage"), bg = host.querySelector(".bt-bg"), fxc = host.querySelector(".bt-fx"), hand = host.querySelector("#btHand"), foot = host.querySelector("#btFoot"), pop = host.querySelector("#btPop");
  const view = new PXFX.View(fxc, 240, 150); view.mode = "3d"; view.yaw = 0; view.pitch = 0.3; view.transparent = true; view.noProps = true; view.tune = { density: 1 };
  const boss = B.make(bossColor);
  if (shiny) boss.frames = boss.frames.map((f) => { const [c, g] = canvas(f.width, f.height); g.drawImage(f, 0, 0); g.globalCompositeOperation = "color"; g.fillStyle = "rgba(255,198,40,.9)"; g.fillRect(0, 0, f.width, f.height);
    g.globalCompositeOperation = "soft-light"; g.fillStyle = "rgba(255,240,180,.6)"; g.fillRect(0, 0, f.width, f.height); g.globalCompositeOperation = "destination-in"; g.drawImage(f, 0, 0); return c; });
  let S = 2, W = 0, H = 170, GY = 96, bgc = null, raf = 0, alive = true;
  const pos = () => ({ hx: Math.round(W * 0.2), bx: Math.round(W * 0.76) + state.bxOff, fy: H - (S === 1 ? 24 : 34) }); // ยกพื้นขึ้นเล็กน้อยบนจอใหญ่ ไม่ให้การ์ดบังวงเวทใต้เท้า

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
    const wind = state.windup > now ? 1 - (state.windup - now) / 450 : 0, lunge = state.lunge > now ? Math.sin((1 - (state.lunge - now) / 380) * Math.PI) : 0;
    const shake = state.enraged && !reduced && !state.dead ? Math.round(Math.sin(t * 40) * 0.6) : 0;
    const fr = boss.frames[reduced ? 0 : Math.floor(t * (state.enraged ? 8 : 5)) % boss.frames.length], ox = bx - boss.ax + knock + Math.round(wind * 5 - lunge * 14) + shake, oy = fy - boss.ay - boss.float + bob + (state.dead ? (1 - fade) * 20 : 0) - Math.round(wind * 2);
    // ออร่าร่างจ้าว / โกรธจัด
    if ((elite || state.enraged) && !state.dead) { const a = 0.22 + (reduced ? 0 : 0.08 * Math.sin(t * 4)), g = x.createRadialGradient(bx, fy - boss.hit, 4, bx, fy - boss.hit, boss.frames[0].width * 0.62);
      g.addColorStop(0, `rgba(255,40,60,${a})`); g.addColorStop(0.6, `rgba(120,0,30,${a * 0.6})`); g.addColorStop(1, "rgba(60,0,20,0)"); x.fillStyle = g; x.fillRect(bx - 120, fy - boss.hit - 120, 240, 240); }
    x.globalAlpha = fade; sh(bx, fy, boss.shw * (boss.float ? 0.8 + 0.1 * Math.sin(t * 2.2) : 1)); x.drawImage(fr, ox, oy);
    if (state.bossHurt > now && Math.floor(now / 60) % 2 === 0) { x.globalCompositeOperation = "lighter"; x.globalAlpha = 0.6; x.drawImage(fr, ox, oy); x.globalCompositeOperation = "source-over"; }
    if (wind > 0 && Math.floor(now / 70) % 2 === 0) { x.globalCompositeOperation = "lighter"; x.globalAlpha = 0.35 * wind; x.drawImage(fr, ox, oy); x.globalCompositeOperation = "source-over"; x.globalAlpha = fade; }
    if (wind > 0) { x.fillStyle = "#ff3a3a"; const ex = bx, ey = oy - 8 - Math.round(Math.abs(Math.sin(t * 12)) * 3); x.fillRect(ex - 2, ey - 12, 4, 8); x.fillRect(ex - 2, ey - 2, 4, 3); x.fillStyle = "#fff"; x.fillRect(ex - 1, ey - 11, 2, 6); }
    if (shiny && !reduced && !state.dead) { x.globalCompositeOperation = "lighter"; for (let i = 0; i < 6; i++) { const ph = (t * 0.8 + i / 6) % 1, sx2 = ox + hash(i, 9, 3) * fr.width, sy2 = oy + hash(i, 8, 3) * fr.height * 0.8;
        const a = Math.sin(ph * Math.PI); x.fillStyle = `rgba(255,236,150,${a})`; x.fillRect(Math.round(sx2), Math.round(sy2) - 2, 1, 5); x.fillRect(Math.round(sx2) - 2, Math.round(sy2), 5, 1); } x.globalCompositeOperation = "source-over"; }
    if (state.shield && !state.dead) { const cxs = bx, cys = fy - boss.hit, rx = boss.frames[0].width * 0.42, ry = boss.hit * 0.95, p2 = reduced ? 0 : t * 2;
      x.globalCompositeOperation = "lighter"; x.strokeStyle = `rgba(150,200,255,${0.45 + 0.15 * Math.sin(t * 5)})`; x.lineWidth = 1;
      x.beginPath(); for (let i = 0; i <= 6; i++) { const a = p2 * 0.2 + (i / 6) * Math.PI * 2, px = cxs + Math.cos(a) * rx, py = cys + Math.sin(a) * ry; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke();
      x.fillStyle = "rgba(120,170,255,.10)"; x.fill(); x.globalCompositeOperation = "source-over"; }
    if (state.blink > now && !reduced) { const k = (state.blink - now) / 600; x.globalCompositeOperation = "lighter"; x.globalAlpha = 0.5 * k; x.drawImage(fr, ox + 14 * k, oy); x.drawImage(fr, ox - 14 * k, oy); x.globalAlpha = 1; x.globalCompositeOperation = "source-over"; }
    x.globalCompositeOperation = "lighter"; const [gr, gg, gb] = boss.color;
    for (const [gx, gy, r] of boss.glow) { const a = (0.32 + (reduced ? 0 : 0.12 * Math.sin(t * 3 + gx))) * fade, g = x.createRadialGradient(ox + gx, oy + gy, 0, ox + gx, oy + gy, r);
      g.addColorStop(0, `rgba(${gr},${gg},${gb},${a})`); g.addColorStop(1, `rgba(${gr},${gg},${gb},0)`); x.fillStyle = g; x.fillRect(ox + gx - r, oy + gy - r, r * 2, r * 2); }
    if (!reduced) for (let i = 0; i < 7; i++) { const ph = (t * 0.35 + hash(i, 4, 7)) % 1, px = bx - 40 + hash(i, 5, 7) * 80 + Math.sin(t + i) * 4, py = fy - 10 - ph * 110;
      x.fillStyle = `rgba(${gr},${gg},${gb},${0.8 * Math.sin(ph * Math.PI) * fade})`; x.fillRect(Math.round(px), Math.round(py), 2, 2); }
    x.globalCompositeOperation = "source-over"; x.globalAlpha = 1;
    // ตัวละคร: วงเวทใต้เท้าตอนร่ายสกิล + ออร่าคอมโบ
    const casting = state.cast > now, hurt = state.hurt > now, charging = state.charge > now, step = casting ? 1 + (Math.floor(now / 120) % 2) * 2 : 0;
    const ec = hex(HC().col), [er, eg, eb] = ec;
    const ch = charging ? 1 - (state.charge - now) / 480 : casting ? 1 : 0, circ = Math.max(ch, state.cast > now ? (state.cast - now) / 900 : 0);
    if (circ > 0.02) { const rx = 26 * Math.min(1, circ * 1.6), ry = rx * 0.32, rot = t * 3;
      x.globalCompositeOperation = "lighter"; x.strokeStyle = `rgba(${er},${eg},${eb},${0.75 * circ})`; x.lineWidth = 1;
      x.beginPath(); x.ellipse(hx, fy, rx, ry, 0, 0, 7); x.stroke(); x.beginPath(); x.ellipse(hx, fy, rx * 0.66, ry * 0.66, 0, 0, 7); x.stroke();
      for (let i = 0; i < 8; i++) { const a = rot + (i / 8) * Math.PI * 2; x.fillStyle = `rgba(255,255,255,${0.8 * circ})`; x.fillRect(Math.round(hx + Math.cos(a) * rx * 0.83), Math.round(fy + Math.sin(a) * ry * 0.83), 1, 1); }
      for (let i = 0; i < 6; i++) { const ph = (t * 1.8 + i / 6) % 1; x.fillStyle = `rgba(${er},${eg},${eb},${(1 - ph) * circ})`; x.fillRect(Math.round(hx - 14 + ((i * 7) % 30)), Math.round(fy - ph * 56), 1, 2); }
      x.globalCompositeOperation = "source-over"; }
    // ออร่าคอมโบ / ร่างตื่นพลัง
    if ((state.combo >= 2 || state.awake) && !reduced) { x.globalCompositeOperation = "lighter"; const R = state.awake ? 44 : 32, g = x.createRadialGradient(hx, fy - 30, 2, hx, fy - 30, R);
      g.addColorStop(0, `rgba(${er},${eg},${eb},${(state.awake ? 0.32 : 0.16) + 0.07 * Math.sin(t * 9)})`); g.addColorStop(1, `rgba(${er},${eg},${eb},0)`); x.fillStyle = g; x.fillRect(hx - R, fy - 30 - R, R * 2, R * 2);
      if (state.awake) for (let i = 0; i < 10; i++) { const ph = (t * 0.9 + hash(i, 2, 5)) % 1, px = hx - 22 + hash(i, 3, 5) * 44; x.fillStyle = `rgba(${er},${eg},${eb},${Math.sin(ph * Math.PI)})`; x.fillRect(Math.round(px), Math.round(fy - 4 - ph * 70), 1, 3); }
      x.globalCompositeOperation = "source-over"; }
    if (state.guard > 0 && !state.dead) { x.globalCompositeOperation = "lighter"; x.strokeStyle = `rgba(140,210,255,${0.35 + 0.12 * Math.sin(t * 4)})`; x.lineWidth = 1; x.beginPath(); x.ellipse(hx, fy - 30, 24, 34, 0, 0, 7); x.stroke(); x.globalCompositeOperation = "source-over"; }
    // ตัวละคร 64px: ท่ายืน 4 เฟรม (ร่างตื่นพลังใช้ชุด _a)
    const fi = reduced ? 0 : Math.floor(t * 5.5) % 4, im = frameImg(heroId + (state.awake ? "_a" : "_n") + fi) || frameImg(heroId + (state.awake ? "_1" : "_0"));
    const hxo = hurt ? -6 : casting ? 5 : 0, lift = charging ? -Math.round(ch * 4) : 0;
    sh(hx, fy, 18);
    if (im && !(hurt && Math.floor(now / 70) % 2 === 0)) x.drawImage(im, Math.round(hx - 32 + hxo), Math.round(fy - 63 + lift));
    if (im && state.awakeAt > now - 500 && !reduced) { x.globalCompositeOperation = "lighter"; x.globalAlpha = 1 - (now - state.awakeAt) / 500; x.drawImage(im, Math.round(hx - 32), Math.round(fy - 63)); x.globalAlpha = 1; x.globalCompositeOperation = "source-over"; }
    if (charging) { x.globalCompositeOperation = "lighter"; const hx2 = hx + 16, hy2 = fy - 30 + lift, g = x.createRadialGradient(hx2, hy2, 0, hx2, hy2, 6 + ch * 7);
      g.addColorStop(0, `rgba(255,255,255,${0.9 * ch})`); g.addColorStop(0.4, `rgba(${er},${eg},${eb},${0.7 * ch})`); g.addColorStop(1, `rgba(${er},${eg},${eb},0)`); x.fillStyle = g; x.fillRect(hx2 - 16, hy2 - 16, 32, 32); x.globalCompositeOperation = "source-over"; }
  }
  // ความลื่น: เครื่องช้า (เฟรมเฉลี่ยเกิน ~22ms) → โหมดเบา วาดฉาก 30fps และเอฟเฟกต์ 20fps (ภาพพิกเซลดูไม่ต่าง แต่ไม่กระตุก)
  const perf = { lite: LITE.on, avg: 16.7, last: 0, n: 0, drawn: 0 };
  const loop = (now) => { if (!alive) return; raf = requestAnimationFrame(loop);
    if (perf.last) { const d = Math.min(100, now - perf.last); perf.avg += (d - perf.avg) * 0.08; if (++perf.n > 45 && !perf.lite && perf.avg > 22) { perf.lite = LITE.on = true; document.body.classList.add("fx-lite"); } }
    perf.last = now;
    if (perf.lite && now - perf.drawn < 31) return; perf.drawn = now; draw(now); };

  // ---------- เล่นเอฟเฟกต์สกิล ----------
  let fxBusy = null, fxLive = 0, fxWait = [];
  // รอให้เอฟเฟกต์ทุกตัวเล่นจนจบ (รวมหางเอฟเฟกต์) ก่อนเริ่มนับถอยหลังไปข้อถัดไป
  const fxIdle = () => (fxLive ? new Promise((r) => fxWait.push(r)) : Promise.resolve());
  const fxEnded = () => { fxLive = Math.max(0, fxLive - 1); if (!fxLive) { const w = fxWait; fxWait = []; w.forEach((f) => f()); } };
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
      cancelAnimationFrame(fxBusy); fxLive = 1;
      // แสดงผล/ปุ่มถัดไปได้เลยหลังโดนเป้าไม่นาน (หางเอฟเฟกต์เล่นต่อจนจบเอง) — สกิลยาว ๆ จะได้ไม่ต้องรอ
      const t0 = performance.now(), speed = 1.25; let hit = false, settled = false;
      const settle = () => { if (!settled) { settled = true; done(); } };
      let lastR = 0;
      const step = (now) => { const tau = ((now - t0) / 1000) * speed;
        if (!hit && tau >= hitAt) { hit = true; onHit?.(); }
        if (hit && tau >= Math.min(tm.length, hitAt + 0.6)) settle();
        if (tau >= tm.length || !alive) { fxc.style.display = "none"; if (!hit) onHit?.(); settle(); fxEnded(); return; }
        // เอฟเฟกต์เป็นฟังก์ชันของเวลา → ข้ามเฟรมได้โดยจังหวะไม่เพี้ยน: ปกติ 30fps · โหมดเบา 20fps
        if (now - lastR >= (perf.lite ? 48 : 31) || !lastR) { lastR = now; const r0 = performance.now(); view.renderAt(def, tau, tm); const rd = performance.now() - r0; if (rd > 14 && !perf.lite) { perf.slowFx = (perf.slowFx || 0) + 1; if (perf.slowFx > 6) { perf.lite = LITE.on = true; document.body.classList.add("fx-lite"); } } }
        fxBusy = requestAnimationFrame(step); };
      fxBusy = requestAnimationFrame(step);
    });
  }
  // ภาพการ์ด: เฟรมตอนสกิลแรงสุด (เรนเดอร์ครั้งเดียวแล้วจำไว้)
  function art(id, hue = 0) {
    if (!artView) { [artC] = canvas(240, 150); artView = new PXFX.View(artC, 240, 150); artView.mode = "3d"; artView.yaw = 0.3; artView.pitch = 0.35; artView.transparent = true; artView.noProps = true; }
    const key = id + "@" + hue; if (artCache.has(key)) return artCache.get(key);
    let url = ""; try { const def = PXFX.get(id), tm = PXFX.timing(def), h = tm.hits.find((x) => x.kind === "hit" || x.kind === "burst") || { d: tm.length * 0.5 }; artView.hue = hue; artView.renderAt(def, h.d + 0.08, tm, { noShake: true }); url = artC.toDataURL(); } catch { /* ignore */ }
    artCache.set(key, url); return url;
  }

  // ---------- คำถาม/การ์ด ----------
  const needCombo = () => (has("fast") ? 2 : 3);
  function setHeroUI() {
    const c = HC(); host.querySelector("#btHeroName").textContent = `${c.n}${state.awake ? " ✦ " + c.f : " · " + c.t}`;
    host.querySelector(".bt-plate.hero").style.setProperty("--hc", c.col);
    host.querySelectorAll(".bt-hero").forEach((b) => { const on = b.dataset.h === heroId; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
    host.querySelector("#btGuard").textContent = state.guard > 0 ? `🛡️×${state.guard}` : "";
    host.querySelectorAll(".bt-it").forEach((b) => { const k = b.dataset.it, n = inv[k] || 0; b.querySelector("b").textContent = n; b.hidden = !n && !(k === "hint" && has("wind"));
      b.disabled = !n || state.busy || (k === "hint" && (state.hinted || !state.q?.options || state.q.options.length - state.blown.length <= 2)); });
  }
  function popText(text, cls, at) { const s = document.createElement("span"); s.className = "bt-num " + (cls || ""); s.textContent = text; s.style.left = at[0] + "px"; s.style.top = at[1] + "px"; pop.appendChild(s); setTimeout(() => s.remove(), 1400); }
  function setHp() { const bar = host.querySelector("#btHpBar"); bar.style.width = (state.hp / HPMAX) * 100 + "%"; host.querySelector("#btHpTxt").textContent = `${state.hp}/${HPMAX}`; host.querySelector(".bt-hp").setAttribute("aria-valuenow", state.hp); }
  // ตัดการ์ดคำตอบผิดทิ้ง 1 ใบ (การ์ดคำใบ้ หรือ ลมพัดตัวลวง)
  async function blowCard(why) {
    if (!onEliminate || !state.q?.options) return false;
    const myQ = state.idx, wi = await onEliminate(state.blown); if (wi == null || state.idx !== myQ || state.busy) return false;
    const b = hand.querySelector(`.bc[data-oi="${wi}"]`); if (!b) return false;
    state.blown.push(wi); b.disabled = true; b.classList.add("blown"); b.setAttribute("aria-label", b.getAttribute("aria-label") + " (ถูกตัดออก: คำตอบผิด)");
    const r = b.getBoundingClientRect(), sr = stage.getBoundingClientRect(); popText(why, "heal", [r.left - sr.left + r.width / 2, Math.max(20, r.top - sr.top - 10)]);
    return true;
  }
  // ---------- สกิล (โหมดใหม่) ----------
  const skBox = host.querySelector("#btSkills");
  function SKS() { const c = HC(), p = POOL(heroId), p2 = p[1] || p[0];
    if (SM === "pick") return [{ id: p[0], n: skillName(p[0]), cost: PICK.cost[0], d: PICK.dmg[0] }, { id: p2, n: skillName(p2), cost: PICK.cost[1], d: PICK.dmg[1] }, { id: c.ult, n: c.sk, cost: PICK.cost[2], d: PICK.dmg[2], ult: true }];
    if (SM === "combo") return [{ id: p[0], n: skillName(p[0]), d: 10, at: 1 }, { id: p2, n: skillName(p2), d: 20, at: 2 }, { id: c.ult, n: c.sk, d: 40, at: 3, ult: true }];
    return [{ id: p[0], n: skillName(p[0]), d: 10 }, { id: p2, n: skillName(p2), d: 25, cd: 2 }, { id: c.ult, n: c.sk, d: 50, combo: 3, ult: true }]; }
  const comboTier = (n) => (n >= 3 ? 2 : n === 2 ? 1 : 0);
  function renderSkills() {
    if (!PTS) return; const L = SKS(), c = HC();
    if (SM === "pick") {
      if (state.en < L[state.sel].cost) state.sel = 0;
      skBox.innerHTML = html`<div class="sk-head"><span>⚡ พลัง</span><span class="sk-en" aria-label="พลัง ${state.en} จาก ${EN_MAX}">${raw(Array.from({ length: EN_MAX }, (_, i) => `<i class="${i < state.en ? "f" : ""}"></i>`).join(""))}</span><small>เลือกสกิลก่อน แล้วตอบให้ถูกเพื่อปล่อยสกิล</small></div>
        <div class="sk-row">${L.map((k, i) => html`<button type="button" class="sk-btn ${state.sel === i ? "on" : ""} ${state.en < k.cost ? "lock" : ""} ${k.ult ? "ult" : ""}" data-sk="${i}" style="--el:${c.col}" aria-pressed="${state.sel === i}">
          <img src="${art(k.id, c.hue)}" alt=""><b>${k.n}</b><span>${k.cost ? `⚡${k.cost}` : "ฟรี"} · ${k.d} ดาเมจ</span></button>`)}</div>`.s;
      skBox.querySelectorAll("[data-sk]").forEach((b) => (b.onclick = () => { const k = L[+b.dataset.sk]; if (state.busy) return;
        if (state.en < k.cost) { const r = b.getBoundingClientRect(), sr = stage.getBoundingClientRect(); popText(`ต้องมีพลัง ${k.cost}`, "miss", [r.left - sr.left + r.width / 2, Math.max(20, r.top - sr.top - 6)]); return; }
        state.sel = +b.dataset.sk; renderSkills(); }));
    } else if (SM === "combo") {
      const nx = comboTier(state.combo + 1);
      skBox.innerHTML = html`<div class="sk-head"><span>🔥 คอมโบ ${state.combo}</span><small>ตอบถูกติดกัน สกิลจะแรงขึ้นเอง</small></div>
        <div class="sk-row steps">${L.map((k, i) => html`<div class="sk-btn step ${i === nx ? "on" : ""} ${i < nx ? "done" : ""} ${k.ult ? "ult" : ""}" style="--el:${c.col}"><img src="${art(k.id, c.hue)}" alt=""><b>${k.n}</b><span>ถูก ${k.at}${k.at === 3 ? "+" : ""} ข้อติด · ${k.d}</span></div>`)}</div>`.s;
    } else { skBox.innerHTML = html`<div class="sk-head"><span>✨ สกิล</span><small>ตอบถูกแล้วเลือกสกิลที่จะใช้${state.cd ? ` · ${L[1].n} พร้อมอีก ${state.cd} ข้อ` : ""}</small></div>`.s; }
  }
  // โหมด after: ตอบถูกแล้วเด้งปุ่มเลือกสกิล → รอผู้เล่นกด
  function chooseSkill() {
    const L = SKS(), c = HC();
    return new Promise((ok) => {
      skBox.innerHTML = html`<div class="sk-head pop"><span>✅ ถูก! เลือกสกิล</span></div><div class="sk-row">${L.map((k, i) => { const lock = (k.cd && state.cd > 0) || (k.combo && state.combo < k.combo);
        return html`<button type="button" class="sk-btn ${k.ult ? "ult" : ""} ${lock ? "lock" : ""}" data-sk="${i}" style="--el:${c.col}" ${lock ? raw("disabled") : ""}><img src="${art(k.id, c.hue)}" alt=""><b>${k.n}</b><span>${k.d} ดาเมจ${k.cd ? (state.cd > 0 ? ` · รออีก ${state.cd} ข้อ` : " · พัก 2 ข้อ") : ""}${k.combo ? ` · คอมโบ ${k.combo}+` : ""}</span></button>`; })}</div>`.s;
      const bs = skBox.querySelectorAll("[data-sk]:not([disabled])"); bs[bs.length - 1]?.focus({ preventScroll: true });
      skBox.querySelectorAll("[data-sk]").forEach((b) => (b.onclick = () => { if (b.disabled) return; const k = L[+b.dataset.sk]; if (k.cd) state.cd = k.cd + 1; ok(k); }));
    });
  }
  function cards() {
    const q = state.q, c = HC(), awake = state.awake, pool = awake ? [c.ult] : POOL(heroId), sk = [...pool].sort(() => Math.random() - 0.5);
    let opts = (q.options ? q.options.map((o, i) => ({ text: o, a: i })) : [{ text: "✔ ถูก", a: true }, { text: "✖ ผิด", a: false }]).map((o, i) => ({ ...o, oi: i }));
    let deb = state.debuff; state.debuff = null;
    if (deb === "shuffle") { for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; } }
    hand.classList.toggle("fogged", deb === "fog"); hand.classList.toggle("warping", deb === "shuffle"); hand.classList.toggle("vined", deb === "vines"); hand.classList.toggle("awake", awake);
    stage.classList.toggle("fog", deb === "fog");
    hand.innerHTML = opts.map((o, i) => { const id = sk[i % sk.length], nm = awake ? c.sk : skillName(id);
      if (PTS) return html`<button type="button" class="bc plain el-${c.th || "x"}" data-i="${i}" data-oi="${o.oi}" style="--el:${c.col};--d:${(i - (opts.length - 1) / 2)}" aria-label="ตัวเลือก ${i + 1}: ${o.text}">
        <span class="bc-key">${i + 1}</span><span class="bc-ans ${emojiOnly(o.text) ? "emo" : ""}">${o.text}</span><span class="bc-foot">${c.ic} ${c.n}</span></button>`.s;
      return html`<button type="button" class="bc el-${c.th || "x"} ${awake ? "ult" : ""}" data-i="${i}" data-oi="${o.oi}" data-skill="${id}" style="--el:${c.col};--d:${(i - (opts.length - 1) / 2)}" aria-label="ตัวเลือก ${i + 1}: ${o.text} (สกิล ${nm})">
        <span class="bc-art" style="background-image:url('${art(id, c.hue)}')"><span class="bc-ic">${c.ic}</span><span class="bc-key">${i + 1}</span></span>
        <span class="bc-type">${awake ? "✦ ท่าไม้ตาย" : "ธาตุ" + c.el}</span><span class="bc-name">${nm}</span>
        <span class="bc-ans ${emojiOnly(o.text) ? "emo" : ""}">${o.text}</span><span class="bc-foot">${c.n}</span></button>`.s; }).join("");
    hand.style.setProperty("--n", opts.length);
    hand.querySelectorAll(".bc").forEach((b) => b.onclick = () => pickCard(b, opts[+b.dataset.i].a));
    if (deb === "vines") { hand.querySelectorAll(".bc").forEach((b) => (b.disabled = true)); state.vineT = setTimeout(() => { hand.classList.remove("vined"); hand.querySelectorAll(".bc").forEach((b) => (b.disabled = state.blown.includes(+b.dataset.oi))); hand.querySelector(".bc:not([disabled])")?.focus({ preventScroll: true }); }, reduced ? 600 : 1300); }
    // 🍃 ลมพัดตัวลวง: ทุก 3 ข้อ (ข้อที่ 3, 6, 9…)
    if (has("wind") && q.options && q.options.length >= 3 && state.idx % 3 === 2) setTimeout(() => blowCard("ลมพัดตัวลวง! 🍃"), reduced ? 100 : 700);
    renderSkills(); setHeroUI();
  }
  function heroSay(text, ok) {
    const c = HC();
    return html`<div class="bt-fb bt-say ${ok ? "ok" : "no"}" role="status" style="--hc:${c.col}"><img class="bt-say-face" src="${frameUrl(heroId + (state.awake ? "_1" : "_0"))}" alt=""><div class="bt-say-box"><b class="bt-say-name">${c.n}</b><div class="bt-say-t">${raw(text)}</div></div></div>`;
  }
  async function pickCard(btn, a) {
    if (state.busy) return; state.busy = true; setHeroUI();
    hand.querySelectorAll(".bc").forEach((b) => (b.disabled = true)); btn.classList.add("picked");
    const r = await onAnswer(a);
    if (!r) { state.busy = false; hand.querySelectorAll(".bc").forEach((b) => (b.disabled = state.blown.includes(+b.dataset.oi))); btn.classList.remove("picked"); setHeroUI(); return; }
    const { hx, bx, fy } = pos(), from = [hx * S + 16 * S, (fy - 30) * S], to = [bx * S, (fy - boss.hit) * S, fy * S];
    const c = HC(), wasAwake = state.awake; let saidUlt = false;
    let used = null, gain = 0;
    if (r.correct) {
      state.combo++; state.right++; btn.classList.add("right");
      // เลือกสกิลที่จะยิงตามโหมด
      if (SM === "pick") { if (state.en < SKS()[state.sel].cost) state.sel = 0; used = SKS()[state.sel]; state.skLog[state.idx] = state.sel; state.en -= used.cost; gain = gainOf(state.combo, has("fast")); state.en = Math.min(EN_MAX, state.en + gain); state.sel = 0; }
      else if (SM === "combo") used = SKS()[comboTier(state.combo)];
      else if (SM === "after") used = await chooseSkill();
      if (used?.ult) shout(heroId, c.line, { host: document.body });
      if (!reduced) { state.charge = performance.now() + 480; await sleep(480); }
      state.cast = performance.now() + 900; saidUlt = wasAwake || !!used?.ult;
      const dmg = used ? used.d : 1;
      await playFx(used ? used.id : btn.dataset.skill, { from, to, hue: c.hue, onHit: () => { state.hp = Math.max(0, state.hp - dmg); setHp(); state.bossHurt = performance.now() + 420; stage.classList.remove("shake"); void stage.offsetWidth; stage.classList.add("shake");
        popText(saidUlt ? `-${dmg}  ✦ ${used ? used.n : c.sk}!` : state.combo >= 2 ? `-${dmg}  COMBO ×${state.combo}!` : `-${dmg}`, saidUlt ? "dmg ult" : "dmg", [to[0], to[1] - 40]);
        if (state.shield) { state.shield = false; host.querySelector(".bt-plate.boss").classList.remove("shielded"); setTimeout(() => popText("โล่แตก! 💥", "rage", [to[0], to[1] - 76]), 200); }
        else if (trait === "shield" && !state.shieldUsed && state.hp > U && state.hp <= Math.ceil(HPMAX / 2)) { state.shieldUsed = true; state.shield = true; host.querySelector(".bt-plate.boss").classList.add("shielded"); setTimeout(() => popText("ตั้งโล่หนาม! 🛡️", "rage", [to[0], to[1] - 76]), 500); }
        if (!state.enraged && state.hp > 0 && state.hp <= Math.ceil(HPMAX * rageAt)) { state.enraged = true; setTimeout(() => popText("โกรธจัด! 😡", "rage", [to[0], to[1] - 76]), 350); host.querySelector(".bt-plate.boss").classList.add("rage"); } } });
      // 🌟 ตื่นพลัง: คอมโบครบ → แปลงร่าง ข้อถัดไปใช้ท่าไม้ตาย
      if (!PTS && !state.awake && state.combo >= needCombo() && state.idx + 1 < total && state.hp > 0) {
        state.awake = true; state.awakeAt = performance.now(); shout(heroId, c.line, { host: document.body });
        popText(`✦ ตื่นพลัง: ${c.f}!`, "win", [from[0] + 30, from[1] - 70]); stage.classList.add("awake"); setHeroUI();
      }
    } else {
      btn.classList.add("wrong");
      // 🧪 กรดเหนียวแน่น: พลาดครั้งแรกของด่าน คอมโบไม่หาย
      if (has("acid") && !state.acidUsed && state.combo > 0) { state.acidUsed = true; setTimeout(() => popText("กรดเหนียวแน่น! คอมโบยังอยู่ 🧪", "heal", [from[0] + 40, from[1] - 80]), 300); }
      else { state.combo = 0; if (state.awake) { state.awake = false; stage.classList.remove("awake"); } }
      hand.querySelectorAll(".bc").forEach((b) => { const o = state.q.options; const txt = o ? o[+b.dataset.oi] : (+b.dataset.oi === 0 ? "ถูก" : "ผิด"); if ((o && txt === r.answer) || (!o && r.answer === txt)) b.classList.add("right"); });
      popText("พลาด!", "miss", [to[0], to[1] - 40]);
      let useUlt = state.enraged;
      if (trait === "souls") { state.souls++; if (state.souls >= 3) { useUlt = true; state.souls = 0; setTimeout(() => popText("พิพากษา! 💀💀💀", "rage", [to[0], to[1] - 76]), 100); } host.querySelector("#btSouls").textContent = state.souls ? " " + "💀".repeat(state.souls) : ""; }
      const hits = state.enraged && !has("dark") ? 2 : 1;
      for (let h = 0; h < hits; h++) await bossAttack(from, to, h > 0, useUlt && h === 0);
      if (trait === "soul" && state.hp < HPMAX && !state.dead) { if (has("dark")) popText("ม่านรัตติกาลกันดูดวิญญาณ! 🌑", "heal", [to[0], to[1] - 60]); else { state.hp = Math.min(HPMAX, state.hp + U); setHp(); popText(`+${U} ดูดวิญญาณ`, "heal", [to[0], to[1] - 60]); } }
      if (["vines", "fog", "shuffle"].includes(trait) && state.idx + 1 < total) {
        if (has("purify")) popText("แสงชำระ! ไม่โดนคำสาป ✨", "heal", [from[0] + 40, from[1] - 60]);
        else { state.debuff = trait; popText(trait === "vines" ? "เถาวัลย์พันการ์ด! 🌿" : trait === "fog" ? "หมอกวิญญาณบังการ์ด! 🌫️" : "มิติบิดเบี้ยว! 🌀", "rage", [from[0] + 40, from[1] - 60]); } }
    }
    host.querySelector("#btCombo").textContent = state.combo >= 2 ? `🔥 คอมโบ ${state.combo}` : "";
    if (SM === "after" && state.cd > 0) state.cd--;
    const last = state.idx + 1 >= total;
    if (last && state.hp === 0) { state.dead = performance.now(); popText("ชนะ! 🏆", "win", [to[0], to[1] - 70]); }
    else if (PTS && state.hp === 0 && !state.hp0Said) { state.hp0Said = true; setTimeout(() => popText("บอสหมดแรง! ตอบให้ครบเพื่อเก็บดาว ⭐", "win", [to[0], to[1] - 70]), 300); }
    const say = r.correct ? `✅ ถูกต้อง! ${saidUlt ? `ท่าไม้ตาย “<b>${esc(used ? used.n : c.sk)}</b>”!` : `รับไป “<b>${esc(used ? used.n : skillName(btn.dataset.skill))}</b>”!`}${SM === "pick" ? ` <em>พลัง +${gain}</em>` : ""}${state.awakeAt > performance.now() - 3000 && state.awake && !wasAwake ? ` <em>ตื่นพลังแล้ว! ข้อหน้าใช้ท่าไม้ตาย</em>` : ""}`
      : `❌ ยังไม่ถูกนะ — เฉลย: <b>${esc(r.answer)}</b>${SM === "pick" ? ` <em>สกิลไม่ออก แต่พลังยังอยู่ ${state.en} แต้ม</em>` : SM === "combo" ? " <em>คอมโบเริ่มนับใหม่</em>" : ""}`;
    foot.innerHTML = html`${heroSay(say, r.correct)}${r.explain ? html`<div class="bt-explain small">💡 ${r.explain}</div>` : ""}
      <button class="btn bt-next" id="g-next">${last ? (state.hp === 0 ? "ปราบบอสสำเร็จ! ดูผลลัพธ์ 🏆" : "ดูผลลัพธ์ 🏁") : "ข้อต่อไป ▶"}</button>`.s;
    const nb = foot.querySelector("#g-next"); nb.focus({ preventScroll: true });
    const go = () => { clearTimeout(state.autoT); state.autoT = null; if (!nb.isConnected) return; foot.innerHTML = ""; onNext(); };
    nb.onclick = go;
    renderSkills(); state.after?.(r); state.busy = false; setHeroUI();
    if (autoNext()) autoGo(nb, go, r.correct ? 2200 : 3000);
  }
  // ไปข้อถัดไปเอง: รอสกิลเล่นจบ แล้วนับถอยหลัง 2–3 วินาที (แถบบนปุ่ม) · กด ⏸ เพื่ออ่านเฉลยนานขึ้นได้
  async function autoGo(nb, go, ms) {
    const myQ = state.idx; await fxIdle(); await sleep(reduced ? 0 : 120);
    if (!nb.isConnected || state.idx !== myQ) return;
    nb.classList.add("auto"); nb.style.setProperty("--auto", ms + "ms");
    const hold = document.createElement("button"); hold.type = "button"; hold.className = "btn btn-ghost bt-hold"; hold.textContent = "⏸ รอก่อน"; hold.setAttribute("aria-label", "หยุดไปข้อถัดไปอัตโนมัติ");
    hold.onclick = () => { clearTimeout(state.autoT); state.autoT = null; nb.classList.remove("auto"); hold.remove(); nb.focus({ preventScroll: true }); };
    nb.before(hold);
    state.autoT = setTimeout(go, ms);
  }
  // บอสโจมตีสวน: เงื้อ (มีเครื่องหมาย !) → พุ่งเข้าหา → ปล่อยท่า (สุ่มจากชุดท่าของบอส) · โล่สายน้ำ/ยาฟื้นพลังกันได้
  async function bossAttack(from, to, quick, isUlt = false) {
    const [id, nm] = isUlt ? ult : atkList[(state.atkI++ + (hs % 3)) % atkList.length] || ["fireball", "ลูกไฟ"];
    const atk = host.querySelector("#btAtk"); atk.textContent = `${quick ? "⚡ ซ้ำ! " : isUlt ? "☠️ ท่าไม้ตาย! " : ""}${bossName} ใช้ “${nm}”`; atk.classList.toggle("ult", isUlt); atk.classList.remove("on"); void atk.offsetWidth; atk.classList.add("on");
    if (!reduced) { state.windup = performance.now() + (quick ? 260 : 450); await sleep(quick ? 260 : 450); state.lunge = performance.now() + 380; }
    const blocked = state.guard > 0; if (blocked) { state.guard--; setHeroUI(); }
    const cat = SKILL_CAT[id] || "area", hero = [from[0] - 6 * S, from[1], pos().fy * S];
    const hitHero = () => { if (blocked) { popText("กันได้! 🛡️", "heal", [from[0], from[1] - 30]); return; }
      state.hurt = performance.now() + 500; popText(quick ? "โดนซ้ำ!" : "โดนสวน!", "hurt", [from[0], from[1] - 30]); stage.classList.remove("shake"); void stage.offsetWidth; stage.classList.add("shake"); };
    if (cat === "area") await playFx(id, { from: to, to: hero, hue: elite ? 330 : 0, onHit: hitHero });
    else await playFx(id, { from: [to[0] - 30 * S, from[1]], to: [from[0], from[1]], mirror: true, hue: elite ? 330 : 0, onHit: hitHero });
  }
  function ask(idx, q) {
    state.idx = idx; state.q = q; state.hinted = false; state.blown = []; foot.innerHTML = ""; clearTimeout(state.vineT); clearTimeout(state.autoT);
    if (trait === "blink" && idx > 0) { const opts2 = [-22, -10, 0, 10].filter((v) => v !== state.bxOff); state.bxOff = opts2[Math.floor(Math.random() * opts2.length)]; state.blink = performance.now() + 600; }
    host.querySelector("#btN").textContent = `${idx + 1}/${total}`;
    host.querySelector("#btQ").innerHTML = html`<span class="bt-qtag">❓ คำถามข้อ ${idx + 1}</span>${q.image ? html`<img src="${q.image}" alt="ภาพประกอบโจทย์">` : ""}<div class="bt-qt">${richQ(q.prompt)}</div>${q.hint ? html`<button class="linkish small" id="g-hint">💡 ขอใบ้</button>` : ""}`.s;
    const hb = host.querySelector("#g-hint"); if (hb) hb.onclick = () => { hb.replaceWith(Object.assign(document.createElement("div"), { className: "small bt-hint", textContent: "💡 " + q.hint })); onHintClick?.(); };
    cards();
    hand.querySelector(".bc")?.focus({ preventScroll: true });
  }
  // เปลี่ยนคู่หู (จำเป็นคู่หูหลักด้วย) — ระหว่างตื่นพลังเปลี่ยนแล้วร่างตื่นพลังจะหาย
  host.querySelectorAll(".bt-hero").forEach((b) => b.onclick = () => {
    if (state.busy || b.dataset.h === heroId) return;
    heroId = b.dataset.h; state.awake = false; stage.classList.remove("awake"); resetGuard(); state.acidUsed = false;
    if (!team.lent) api("/api/gacha/party", { method: "POST", body: { id: heroId } }).then((g) => { if (appState.me) appState.me.gacha = g; }).catch(() => {});
    if (state.q && !foot.innerHTML) cards(); else setHeroUI();
    const c = HC(); toast(`${c.ic} ${c.n} พร้อมสู้! · ${c.pas.map((p) => PASSIVE[p].n).join(" + ")}`);
    warmArts();
  });
  // 💡🧪 ไอเทมจากการอัญเชิญ
  host.querySelectorAll(".bt-it").forEach((b) => b.onclick = async () => {
    const k = b.dataset.it; if (state.busy || !(inv[k] > 0)) return;
    if (k === "hint" && (state.hinted || !state.q?.options)) return;
    b.disabled = true;
    try { const g = await api("/api/gacha/use", { method: "POST", body: { item: k } }); Object.assign(inv, g.inv); if (appState.me) appState.me.gacha = g; }
    catch (e) { toast(e.message, "bad"); setHeroUI(); return; }
    const { hx, fy } = pos();
    if (k === "pot") { state.guard++; popText("ยาฟื้นพลัง! กันการสวนครั้งถัดไป 🧪", "heal", [hx * S + 30, (fy - 80) * S]); }
    else { state.hinted = true; if (!(await blowCard("การ์ดคำใบ้! 💡"))) toast("ข้อนี้ตัดตัวเลือกไม่ได้", "bad"); }
    setHeroUI();
  });
  const onKey = (e) => { if (e.target.matches("input, textarea") || document.querySelector(".tk")) return; const n = +e.key; if (n >= 1 && n <= 4 && !state.busy) hand.querySelector(`.bc[data-i="${n - 1}"]:not([disabled])`)?.click(); };
  document.addEventListener("keydown", onKey);
  const ro = new ResizeObserver(() => layout()); ro.observe(stage);
  layout(); setHeroUI(); setHp(); raf = requestAnimationFrame(loop);
  // ระหว่างต่อสู้: ปิดชั้นเบลอ/ผสมสีของฉากหมู่บ้านด้านหลัง (กินแรงการ์ดจอทุกเฟรม ทำให้สกิลกระตุกบนมือถือ)
  document.body.classList.add("in-battle"); if (perf.lite) document.body.classList.add("fx-lite");
  // วาดภาพการ์ดสกิลของตัวละครล่วงหน้าตอนเครื่องว่าง (ไม่ไปกระตุกตอนการ์ดโผล่)
  const idle = globalThis.requestIdleCallback || ((f) => setTimeout(() => f({ timeRemaining: () => 8 }), 60));
  function warmArts() {
    const c = HC(), warm = [...POOL(heroId), c.ult].filter((id) => PXFX.get(id) && !artCache.has(id + "@" + c.hue));
    const warmStep = (dl) => { while (alive && warm.length && dl.timeRemaining() > 6) art(warm.shift(), c.hue); if (alive && warm.length) idle(warmStep); };
    if (warm.length) idle(warmStep);
  }
  warmArts();
  return { ask, skills: () => Array.from({ length: total }, (_, i) => state.skLog[i] ?? 0), skillMode: SM, destroy() { alive = false; document.body.classList.remove("in-battle", "fx-lite"); clearTimeout(state.vineT); clearTimeout(state.autoT); cancelAnimationFrame(raf); cancelAnimationFrame(fxBusy); ro.disconnect(); document.removeEventListener("keydown", onKey); }, get bossHp() { return state.hp; }, get heroId() { return team.lent ? null : heroId; }, state };
}
// ประเภทเอฟเฟกต์ (ยิงจากตัวละครไปหาบอส หรือเกิดที่ตัวบอส)
const SKILL_CAT = {
  fireball: "projectile", "plasma-bolt": "projectile", "ice-shard": "projectile", "arcane-missile": "projectile", "frost-wheel": "projectile", "shadow-glaive": "projectile",
  "spiral-gale": "projectile", "electric-magic-arrow-strike": "projectile", "arc-ray": "beam", "charged-beam": "beam", "soul-siphon": "beam", "venom-stream": "beam", "starblade-cataclysm": "beam",
};
