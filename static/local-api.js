// "เซิร์ฟเวอร์จำลอง" ในเบราว์เซอร์ สำหรับ QUIZ ODYSSEY เวอร์ชันเล่นบนเว็บ (ไม่ต้องมีเซิร์ฟเวอร์)
// ตอบ API ชุดเดียวกับเซิร์ฟเวอร์จริง เพื่อให้หน้าเว็บเดิมใช้ต่อได้ทั้งหมด
// ความคืบหน้าเก็บในเบราว์เซอร์ของผู้เล่น (และในบัญชี Claude ถ้าเปิดผ่าน artifact)
import DATA from "./data.json";
import G from "../server/grading.js";
import Lessons from "../server/lessons/index.js";
import * as J from "../public/js/journey.js";
import { storyPlan, STORY } from "../public/js/story.js";
const STORY_CATS = new Set(Object.keys(STORY));
import * as GA from "../public/gacha/data.js";

const TZ = "Asia/Bangkok";
const KEY = "eduplay-web:v1";
const WELCOME_COINS = 150;
const XP_PER_LEVEL = 100;
const now = () => new Date().toISOString();
const dayKey = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(d));
const err = (status, message) => Object.assign(new Error(message), { status });

// ---------- ข้อมูลเนื้อหา ----------
const CATS = DATA.categories; // [{slug,name,nameEn,icon}]
const catBy = Object.fromEntries(CATS.map((c) => [c.slug, c]));
const TEMPLATE_TH = { truefalse: "ถูก/ผิด", match: "จับคู่", order: "เรียงลำดับ", scramble: "เรียงคำ", mcq: "ปรนัย" };
const HOWTO = { truefalse: "ตัดสินว่าข้อความถูกหรือผิด", match: "พลิกการ์ดหาคู่ให้ครบ ยิ่งพลิกน้อยยิ่งได้คะแนนมาก", order: "เรียงรายการให้อยู่ในลำดับที่ถูกต้อง", scramble: "เรียงตัวอักษรให้เป็นคำที่ถูกต้อง", mcq: "เลือกคำตอบที่ถูกต้องทีละข้อ" };
const GAMES = DATA.games.map((g, i) => ({ ...g, id: i + 1, createdAt: new Date(Date.UTC(2026, 9, 1) + i * 3600000).toISOString() }));
// เวอร์ชันเว็บไม่มีครูตรวจ: ตัดข้ออัตนัยออก
const QUIZZES = DATA.quizzes.map((q, i) => ({
  ...q, id: i + 1, questions: q.questions.filter((x) => x.type !== "essay"),
  description: q.description.replace(" รวมข้ออัตนัยที่ครูตรวจเอง", "").replace("ครบ 10 ชนิด", "ครบ 9 ชนิด"),
}));
const BADGES = DATA.badges;
const CATALOG = DATA.shop.catalog, BOXES = DATA.shop.boxes, RARITY = DATA.shop.rarity, SLOTS = DATA.shop.slots;
const ITEM = Object.fromEntries(CATALOG.map((x) => [x.id, x]));

// ---------- ที่เก็บความคืบหน้า ----------
// ✨ อัญเชิญ: เพชรได้จากการตอบคำถามถูกเท่านั้น (ไม่มีการซื้อด้วยเงินจริง)
const freshGacha = () => ({ gems: 0, cnt: 0, pity: 0, own: {}, inv: {}, hist: [], party: null, tut: {}, gift: false });
const fresh = () => ({ v: 1, name: "นักผจญภัย", grade: "", xp: 0, coins: WELCOME_COINS, createdAt: now(), updatedAt: now(), seq: 1,
  plays: [], attempts: [], badges: {}, activity: [], items: {}, equipped: {}, prefs: {}, coinTx: [{ amount: WELCOME_COINS, reason: "welcome", detail: "ของขวัญต้อนรับ", at: now() }], lastFree: null, gamePlays: {}, stars: {}, bosses: {}, claimed: {}, rot: {}, seen: {}, gacha: freshGacha() });
let S = fresh();
let adminFlag = false; // ตรวจสิทธิ์จริงที่ Supabase (is_admin) แล้วจึงเปิด
let remote = null; // ที่เก็บในบัญชี Claude (artifact) ถ้ามี
try { const v = JSON.parse(localStorage.getItem(KEY) || "null"); if (v && v.v === 1) S = { ...fresh(), ...v }; } catch { /* โหมดส่วนตัว */ }
let saveTimer = null;
function localSave() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* ignore */ } }
function save() {
  S.updatedAt = now();
  localSave();
  if (remote) { clearTimeout(saveTimer); saveTimer = setTimeout(() => remote.set(S).catch(() => {}), 800); }
  if (cloud) { clearTimeout(cloudTimer); cloudTimer = setTimeout(pushCloud, 800); }
}

// ---------- บัญชีออนไลน์ (Supabase): ความคืบหน้าตามไปทุกเครื่อง ----------
let cloud = null, cloudUser = null, cloudTimer = null, cBusy = false, cAgain = false;
export const syncInfo = { at: null, error: null };
async function pushCloud() {
  clearTimeout(cloudTimer); cloudTimer = null;
  if (!cloud) return;
  if (cBusy) { cAgain = true; return; }
  cBusy = true;
  try { do { cAgain = false; await cloud.save(S); syncInfo.at = now(); syncInfo.error = null; } while (cAgain && cloud); }
  catch (e) { syncInfo.error = e.message; }
  finally { cBusy = false; }
}
const GUEST_KEY = "eduplay-web:guest"; // ความคืบหน้าตอนไม่ได้ล็อกอิน แยกไว้ ไม่ปนกับบัญชีใด
/** เข้าสู่ระบบแล้ว: ใช้ความคืบหน้าของบัญชีนั้น (บัญชีใหม่เริ่มจากศูนย์) */
export async function useCloud(store, user, displayName) {
  if (!S.owner) { try { localStorage.setItem(GUEST_KEY, JSON.stringify(S)); } catch { /* ignore */ } } // เก็บของผู้เล่นไม่ล็อกอินไว้ก่อน
  const theirs = await store.load();
  const prefs = S.prefs;
  let isNew = false;
  if (theirs && theirs.v === 1) {
    const mineIsNewer = S.owner === user.id && (S.updatedAt || "") > (theirs.updatedAt || ""); // เล่นออฟไลน์ไว้แล้วยังไม่ได้ส่ง
    if (!mineIsNewer) { S = { ...fresh(), ...theirs }; if (!S.prefs || !Object.keys(S.prefs).length) S.prefs = prefs; }
  } else if (S.owner !== user.id) {
    S = fresh(); S.prefs = prefs; // บัญชีใหม่: เริ่มต้นใหม่ คงไว้แค่หน้าตาเว็บที่ตั้งไว้ในเครื่องนี้
    if (displayName) S.name = displayName.slice(0, 40);
    isNew = true;
  }
  S.owner = user.id;
  cloud = store; cloudUser = user;
  const gifts = await receiveGifts(store);
  localSave();
  await pushCloud();
  if (gifts.length && store.claim) await store.claim(gifts.map((g) => g.id)).catch(() => {});
  return { isNew, gifts: gifts.filter((g) => g.name).map((g) => g.name) };
}
// ของขวัญจากแอดมิน: ใส่ลงกระเป๋า (ของที่มีแล้วข้าม) แล้วค่อยทำเครื่องหมายว่ารับแล้วหลังบันทึกขึ้นคลาวด์
async function receiveGifts(store) {
  if (!store.pending) return [];
  const list = await store.pending().catch(() => []), out = [];
  for (const g of list) { const it = ITEM[g.item_id], fresh = it && !S.items[it.id]; out.push({ id: g.id, name: fresh ? it.name : null });
    if (fresh) { S.items[it.id] = { source: "gift", at: now() }; S.activity.unshift({ kind: "gift", title: `ได้รับ “${it.name}” จากผู้ดูแล${g.note ? ` — ${g.note}` : ""}`, xp: 0, created_at: now() }); } }
  if (out.length) S.updatedAt = now();
  return out;
}
export function setAdmin(v) { adminFlag = !!v; }
/** ออกจากระบบ: เอาความคืบหน้าของบัญชีออกจากเครื่องนี้ แล้วกลับไปใช้ของผู้เล่นไม่ล็อกอิน */
export async function dropCloud() {
  adminFlag = false;
  if (cloudTimer || cAgain) await pushCloud().catch(() => {});
  cloud = null; cloudUser = null;
  const prefs = S.prefs;
  let guest = null;
  try { guest = JSON.parse(localStorage.getItem(GUEST_KEY) || "null"); } catch { /* ignore */ }
  S = guest && guest.v === 1 ? { ...fresh(), ...guest } : fresh();
  delete S.owner;
  S.prefs = prefs;
  localSave();
}
export const ownedByAccount = () => !!S.owner;
export const flushCloud = () => (cloudTimer ? pushCloud() : Promise.resolve());
addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flushCloud(); });
export function resetProgress() { const { prefs, owner } = S; S = fresh(); S.prefs = prefs; if (owner) S.owner = owner; save(); }
export function exportProgress() { return JSON.stringify(S); }
export function importProgress(text) { const v = JSON.parse(text); if (!v || v.v !== 1) throw new Error("ไฟล์ไม่ถูกต้อง"); const owner = S.owner; S = { ...fresh(), ...v, owner }; if (!owner) delete S.owner; save(); }

/** ถ้าเปิดผ่าน artifact ของ Claude: เก็บความคืบหน้ากับบัญชีผู้ใช้ด้วย (ข้ามเครื่องได้) */
export async function connectRemote(onLoaded) {
  try {
    if (!window.claude?.use) return;
    const timeout = new Promise((ok) => setTimeout(() => ok(null), 10000));
    const [db, user] = await Promise.race([Promise.all([window.claude.use("db"), window.claude.use("user")]), timeout.then(() => [null, null])]);
    if (!db || !user) return;
    const id = await user.id();
    const doc = db.collection("data/users/" + id).doc("progress");
    const snap = await doc.get();
    const data = snap?.data ? snap.data() : snap;
    const theirs = data && data.state ? JSON.parse(data.state) : null;
    let busy = false, again = false;
    const push = async () => { if (busy) { again = true; return; } busy = true; try { do { again = false; await doc.set({ state: JSON.stringify(S), updatedAt: S.updatedAt || "" }); } while (again); } finally { busy = false; } };
    remote = { set: () => push() };
    if (theirs && theirs.v === 1 && (theirs.updatedAt || "") > (S.updatedAt || "")) { S = { ...fresh(), ...theirs }; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* */ } onLoaded?.(); }
    else remote.set(S).catch(() => {});
  } catch { /* ไม่มีที่เก็บในบัญชี: ใช้ในเบราว์เซอร์อย่างเดียว */ }
}

// ---------- ช่วยเหลือ ----------
const equippedView = () => Object.fromEntries(Object.entries(S.equipped).filter(([s, id]) => ITEM[id]?.type === s).map(([s, id]) => [s, ITEM[id].value]));
const me = () => ({ id: 1, email: cloudUser?.email || "", cloud: !!cloudUser, admin: adminFlag && !!cloudUser, displayName: S.name, role: "student", grade: S.grade, xp: S.xp, coins: S.coins, prefs: S.prefs, equipped: equippedView(), owned: Object.keys(S.items), local: true,
  level: Math.floor(S.xp / XP_PER_LEVEL) + 1, xpPerLevel: XP_PER_LEVEL, stars: totalStars(), rewardsReady: rewardsReady(), gacha: gachaView() });

// ---------- ✨ อัญเชิญตัวละคร ----------
function GS() { if (!S.gacha || typeof S.gacha !== "object") S.gacha = freshGacha(); const g = S.gacha; for (const [k, v] of Object.entries(freshGacha())) if (g[k] === undefined) g[k] = v;
  for (const k of ["own", "inv", "tut"]) if (!g[k] || typeof g[k] !== "object") g[k] = {}; if (!Array.isArray(g.hist)) g.hist = []; if (!Number.isFinite(g.gems)) g.gems = 0; return g; }
function gachaView() { const g = GS(); return { gems: g.gems, cnt: g.cnt, pity: g.pity, own: { ...g.own }, inv: { ...g.inv }, hist: g.hist.slice(0, 60), party: g.own[g.party] != null ? g.party : null, tut: { ...g.tut }, gift: g.gift }; }
function addGems(n, why) { const g = GS(); g.gems = Math.max(0, g.gems + n); if (n) S.activity.unshift({ kind: "gems", title: `${n > 0 ? "+" : ""}${n} 💎 ${why}`, xp: 0, created_at: now() }); }
/** เพชรตอนจบด่าน: ตอบถูกข้อละ 10 + ชนะบอส 30 · โบนัสตัวละคร · เครื่องรางนำโชค ×2 */
function gameGems(correct, bossWin, heroId) {
  const g = GS(); if (!(correct > 0)) return null;
  const base = correct * GA.GEM.perGame + (bossWin ? GA.GEM.bossWin : 0);
  const hero = g.own[heroId] != null ? heroId : g.party, pct = hero && g.own[hero] != null ? GA.gemBonus(hero, g.own[hero]) : 0;
  const luck = (g.inv.luck || 0) > 0; if (luck) g.inv.luck--;
  const got = Math.round(base * (1 + pct) * (luck ? 2 : 1));
  addGems(got, "จากการตอบคำถาม"); return { got, base, pct: Math.round(pct * 100), luck, hero: hero || null, total: g.gems };
}
function addXP(xp, kind, title) { S.xp += xp; S.activity.unshift({ kind, title, xp, created_at: now() }); S.activity = S.activity.slice(0, 200); }
function addCoins(amount, reason, detail) { if (!amount && reason !== "free_box") return; S.coins += amount; S.coinTx.unshift({ amount, reason, detail, at: now() }); S.coinTx = S.coinTx.slice(0, 200); }
function streak() {
  const days = new Set(S.activity.filter((a) => a.xp > 0).map((a) => dayKey(a.created_at)));
  let n = 0;
  for (let i = 0; ; i++) { const k = dayKey(Date.now() - i * 86400000); if (days.has(k)) n++; else if (i === 0) continue; else break; }
  return n;
}
// ---------- เส้นทางความคืบหน้า: ดาว · ระดับที่ปลดล็อก · บอส · รางวัลสะสมดาว ----------
const starsOf = (gid) => S.stars[gid] || {};
const starSum = (o) => Object.values(o || {}).reduce((a, b) => a + (+b || 0), 0);
const totalStars = () => Object.values(S.stars).reduce((a, o) => a + starSum(o), 0);
const eliteUnlocked = () => totalStars() >= J.ELITE_AT;
const rewardsReady = () => { const t = totalStars(); return J.MILESTONES.filter((m) => t >= m.at && !S.claimed[m.at]).length; };
const lockedFor = (gid) => (adminFlag && cloudUser ? [] : J.lockedLevels(starsOf(gid)));
function checkBadges(perfect) {
  const earned = [];
  const give = (c) => { if (S.badges[c]) return; S.badges[c] = now(); earned.push(BADGES.find((b) => b.code === c)); };
  if (S.plays.length) give("FIRST_GAME");
  if (S.plays.some((p) => p.score >= 500)) give("SCORE_500");
  if (new Set(S.plays.map((p) => p.gameId)).size >= 5) give("EXPLORER");
  if (perfect || S.plays.some((p) => p.max && p.score >= p.max) || S.attempts.some((a) => a.max && a.score >= a.max)) give("PERFECT");
  if (S.attempts.length >= 5) give("QUIZ_5");
  const s = streak(); if (s >= 3) give("STREAK_3"); if (s >= 7) give("STREAK_7");
  if (Math.floor(S.xp / XP_PER_LEVEL) + 1 >= 5) give("LEVEL_5");
  return earned.filter(Boolean);
}
function gameRow(g) {
  const c = catBy[g.category];
  if (g.template === "lesson") { const L = Lessons.lessonById(g.lesson), su = Lessons.setupOf(L);
    return { id: g.id, title: g.title, description: g.description, template: "lesson", templateName: "บทเรียน", icon: L.icon,
      category: c ? { slug: c.slug, name: c.name, icon: c.icon } : null, ageMin: g.age[0], ageMax: g.age[1], grade: Lessons.gradeLabel(L.grade), difficulty: "all",
      visibility: "public", status: "published", timeLimitSec: null, pointsPerQ: 100, passPct: 60, plays: S.gamePlays[g.id] || 0,
      questionCount: su.size, generated: su.generated, modeCount: su.modes.length, modeNames: su.modes.map((m) => m.icon + " " + m.name), sets: su.sets, stars: { got: starSum(starsOf(g.id)), max: 15, byLevel: starsOf(g.id) }, version: 1, createdAt: g.createdAt, howTo: "เลือกระดับ รูปแบบการเล่น จำนวนข้อ และชุดคำถามได้ก่อนเริ่ม" }; }
  return { id: g.id, title: g.title, description: g.description, template: g.template, templateName: TEMPLATE_TH[g.template],
    category: c ? { slug: c.slug, name: c.name, icon: c.icon } : null, ageMin: g.age[0], ageMax: g.age[1], difficulty: g.difficulty,
    visibility: "public", status: "published", timeLimitSec: g.timeLimitSec || null, pointsPerQ: 100, passPct: 60, plays: S.gamePlays[g.id] || 0,
    questionCount: g.questions.length, version: 1, createdAt: g.createdAt, howTo: HOWTO[g.template] };
}
function quizRow(q) {
  return { id: q.id, title: q.title, description: q.description, grade: q.grade, difficulty: q.difficulty, timeLimitMin: null, visibility: "public", status: "published",
    showAnswers: "after_submit", questionCount: q.questions.length, totalPoints: q.questions.reduce((s, x) => s + (x.points || 1), 0), hasEssay: false };
}
const gameById = (id) => { const g = GAMES.find((x) => x.id === +id); if (!g) throw err(404, "ไม่พบเกมนี้"); return g; };
const quizById = (id) => { const q = QUIZZES.find((x) => x.id === +id); if (!q) throw err(404, "ไม่พบแบบทดสอบนี้"); return q; };

// สร้างชุดคำถามของบทเรียนจาก key (ระดับ.รูปแบบ.จำนวน.ชุด.seed) — สร้างซ้ำได้เหมือนเดิมทุกครั้ง จึงตรวจคำตอบได้โดยไม่ต้องเก็บสถานะ
// ชุดคำถามสร้างจากคีย์แบบกำหนดผลได้ → จำชุดล่าสุดไว้ (ตรวจคำตอบทุกข้อไม่ต้องสร้างชุดใหม่ทั้งชุด ซึ่งช้าบนมือถือ)
const SET_CACHE = new Map();
function lessonSet(g, key) {
  const ck = g.lesson + "|" + key; if (SET_CACHE.has(ck)) return SET_CACHE.get(ck);
  const L = Lessons.lessonById(g.lesson), set = Lessons.build(L, Lessons.parseKey(L, key));
  SET_CACHE.set(ck, set); if (SET_CACHE.size > 12) SET_CACHE.delete(SET_CACHE.keys().next().value); return set;
}
function playable(g) { return playableQs(g.template, g.questions); }
function playableQs(template, qs) {
  switch (template) {
    case "truefalse": return qs.map((q) => ({ prompt: q.prompt, image: q.image || null }));
    case "mcq": return qs.map((q) => ({ prompt: q.prompt, options: q.options, hint: q.hint || null, image: q.image || null }));
    case "order": return qs.map((q) => ({ prompt: q.prompt, items: G.shuffleDifferent(q.items), hint: q.hint || null }));
    case "scramble": return qs.map((q) => ({ prompt: q.prompt, tiles: G.shuffleDifferent(G.graphemes(q.word)), hint: q.hint || null }));
    case "match": { const cards = []; qs.forEach((p, i) => { cards.push({ pair: i, text: p.a }); cards.push({ pair: i, text: p.b }); }); return [{ cards: G.shuffle(cards), pairs: qs.length }]; }
  }
  return [];
}
function displayAnswer(x, a) {
  if (a === undefined || a === null || a === "") return "—";
  switch (x.type) {
    case "mcq": return x.options?.[a] ?? "—";
    case "multi": return (Array.isArray(a) ? a : []).map((i) => x.options[i]).join(", ") || "—";
    case "truefalse": return a === true ? "จริง" : a === false ? "เท็จ" : "—";
    case "fill": case "wordbank": return (Array.isArray(a) ? a : []).map((s) => s || "—").join(" ; ");
    case "match": return (x.pairs || []).map((p, i) => `${p[0]} → ${a[i] || "—"}`).join(" ; ");
    case "order": return (Array.isArray(a) ? a : []).join(" → ");
    default: return String(a);
  }
}
const TYPE_TH = { mcq: "ปรนัย", truefalse: "ถูก/ผิด", short: "คำตอบสั้น", fill: "เติมคำ", match: "จับคู่", order: "เรียงลำดับ", multi: "เลือกได้หลายข้อ", numeric: "ตอบเป็นตัวเลข", wordbank: "เติมคำจากคลังคำ" };
function attemptView(a) {
  const q = quizById(a.quizId);
  return { id: a.id, quizId: q.id, quizTitle: q.title, score: a.score, max: a.max, status: "graded", submittedAt: a.at,
    items: q.questions.map((x, i) => ({ index: i, type: x.type, typeName: TYPE_TH[x.type], prompt: x.prompt, points: x.points || 1,
      given: displayAnswer(x, a.answers[i]), result: a.results[i] || null, answer: G.answerText(x), explain: x.explain || null })) };
}
function freeAvailable() { return S.lastFree !== dayKey(new Date()); }
function pickWeighted(odds) {
  const e = Object.entries(odds).filter(([, w]) => w > 0);
  let r = G.randInt(e.reduce((s, [, w]) => s + w, 0));
  for (const [k, w] of e) { if (r < w) return k; r -= w; }
  return e[0][0];
}

// ---------- เส้นทาง API ----------
const routes = [];
const on = (method, pattern, fn) => routes.push({ method, re: new RegExp("^" + pattern.replace(/:(\w+)/g, "(?<$1>[^/]+)") + "$"), fn });

on("GET", "/api/auth/me", () => ({ user: me() }));
on("GET", "/api/config", () => ({ tz: TZ, baseUrl: location.origin, ai: { enabled: false }, local: true }));
on("GET", "/api/categories", () => ({ categories: CATS }));
on("PUT", "/api/auth/prefs", (_p, b) => { S.prefs = b || {}; const prem = CATALOG.find((x) => x.type === "theme" && x.value === S.prefs.palette); if (prem && !S.items[prem.id]) S.prefs.palette = "violet"; const ts = S.prefs.tickSound; if (ts && ts !== "synth" && ts !== "custom" && !S.items["snd-" + ts]) S.prefs.tickSound = "synth"; save(); return { ok: true, prefs: S.prefs }; });
on("PATCH", "/api/auth/account", (_p, b) => { const n = String(b.displayName || "").trim().slice(0, 40); if (!n) throw err(400, "กรุณาใส่ชื่อที่แสดง"); S.name = n; S.grade = String(b.grade || "").slice(0, 20); save(); return { ok: true }; });
on("GET", "/api/classes", () => ({ classes: [] }));

// เครื่องมือทดสอบของแอดมิน (บัญชีตัวเองเท่านั้น)
const needAdmin = () => { if (!adminFlag || !cloudUser) throw err(403, "ต้องเป็นผู้ดูแลระบบ"); };
on("POST", "/api/admin/unlock-all", () => { needAdmin(); let n = 0; for (const it of CATALOG) if (!S.items[it.id]) { S.items[it.id] = { source: "admin", at: now() }; n++; } save(); return { unlocked: n, total: CATALOG.length }; });
on("POST", "/api/admin/coins", (_p, b) => { needAdmin(); let n = Math.max(-1e6, Math.min(1e6, Math.round(+b.amount || 0))); if (S.coins + n < 0) n = -S.coins; addCoins(n, "admin", "ผู้ดูแลปรับเหรียญ"); save(); return { coins: S.coins }; });
on("GET", "/api/games/featured", () => ({ games: [...GAMES].sort((a, b) => (S.gamePlays[b.id] || 0) - (S.gamePlays[a.id] || 0) || a.id - b.id).slice(0, 6).map(gameRow), count: GAMES.length }));
on("GET", "/api/games", (_p, _b, q) => {
  let list = GAMES.filter((g) => {
    const t = (q.get("q") || "").toLowerCase();
    if (t && !(g.title.toLowerCase().includes(t) || g.description.toLowerCase().includes(t))) return false;
    if (q.get("category") && g.category !== q.get("category")) return false;
    if (q.get("difficulty") && g.difficulty !== "all" && g.difficulty !== q.get("difficulty")) return false;
    const age = +q.get("age"); if (age && !(g.age[0] <= age && g.age[1] >= age)) return false;
    return true;
  });
  const sort = q.get("sort") || "new";
  list.sort(sort === "popular" ? (a, b) => (S.gamePlays[b.id] || 0) - (S.gamePlays[a.id] || 0) || b.id - a.id : sort === "title" ? (a, b) => a.title.localeCompare(b.title, "th") : (a, b) => b.id - a.id);
  const page = Math.max(1, +q.get("page") || 1), per = 12;
  return { games: list.slice((page - 1) * per, page * per).map(gameRow), total: list.length, page, pages: Math.max(1, Math.ceil(list.length / per)) };
});
on("GET", "/api/games/:id/play", ({ id }, _b, q) => {
  const g = gameById(id);
  if (g.template === "lesson") {
    const L = Lessons.lessonById(g.lesson), locked = lockedFor(g.id), opts = { level: q.get("level"), mode: q.get("mode"), count: q.get("count"), set: q.get("set") ?? 1, seed: q.get("seed") };
    let built = Lessons.build(L, opts);
    if (locked.includes(built.level)) built = Lessons.build(L, { ...opts, level: Math.min(...locked) - 1 }); // ระดับที่ยังล็อกอยู่ → เล่นระดับสูงสุดที่เปิดแล้ว
    return { game: { ...gameRow(g), template: built.template, templateName: built.templateName, howTo: built.howTo, timeLimitSec: built.timeLimitSec, questionCount: built.questions.length },
      questions: playableQs(built.template, built.questions), preview: false, key: built.key,
      setup: { ...Lessons.setupOf(L), current: { level: built.level, mode: built.mode, count: built.count, set: built.set }, stars: starsOf(g.id), locked },
      boss: J.pickBoss(g.lesson, built.level, eliteUnlocked()) };
  }
  return { game: gameRow(g), questions: playable(g), preview: false };
});
on("POST", "/api/games/:id/check", ({ id }, b) => {
  const g = gameById(id); const set = g.template === "lesson" ? lessonSet(g, b.key) : null, tpl = set ? set.template : g.template;
  const q = (set ? set.questions : g.questions)[+b.index];
  if (!q) throw err(400, "ไม่พบข้อนี้");
  return { correct: G.gradeGameQuestion(tpl, q, b.answer), answer: G.gameAnswerText(tpl, q), explain: q.explain || null };
});
// 💡 การ์ดคำใบ้ / ลมพัดตัวลวง: บอกตัวเลือกที่ผิด 1 ข้อ (สุ่ม)
on("POST", "/api/games/:id/eliminate", ({ id }, b) => {
  const g = gameById(id); const set = g.template === "lesson" ? lessonSet(g, b.key) : null, tpl = set ? set.template : g.template;
  const q = (set ? set.questions : g.questions)[+b.index];
  if (!q || tpl !== "mcq" || !Array.isArray(q.options)) throw err(400, "ใช้กับข้อนี้ไม่ได้");
  const skip = new Set((b.skip || []).map(Number)), wrong = q.options.map((_, i) => i).filter((i) => !skip.has(i) && !G.gradeGameQuestion(tpl, q, i));
  if (wrong.length <= 1 && q.options.length - skip.size <= 2) throw err(400, "เหลือตัวเลือกน้อยแล้ว");
  return { wrong: wrong.length ? wrong[G.randInt(wrong.length)] : null };
});
on("POST", "/api/games/:id/finish", ({ id }, b) => {
  const g0 = gameById(id), set = g0.template === "lesson" ? lessonSet(g0, b.key) : null;
  const lvl = set ? set.level : 0, lvBefore = Math.floor(S.xp / XP_PER_LEVEL) + 1, lockBefore = set ? lockedFor(g0.id) : [], eliteBefore = eliteUnlocked();
  const g = set ? { ...g0, template: set.template, questions: set.questions } : g0; const qs = g.questions, ppq = 100;
  let correct = 0, score = 0, max = 0, review = []; const total = qs.length;
  if (g.template === "match") {
    const moves = Math.max(qs.length, +b.moves || 0), done = !!b.completed;
    max = ppq * qs.length;
    score = done ? Math.max(max / 2, max - Math.round((moves - qs.length) * ppq * 0.1)) : (+b.found || 0) * 50;
    correct = done ? qs.length : Math.min(qs.length, +b.found || 0);
    review = qs.map((q) => ({ prompt: q.a, correct: done, answer: G.gameAnswerText("match", q) }));
  } else {
    const ans = Array.isArray(b.answers) ? b.answers : [];
    max = ppq * total;
    review = qs.map((q, i) => { const ok = ans[i] != null && G.gradeGameQuestion(g.template, q, ans[i]); if (ok) correct++; return { prompt: q.prompt, correct: ok, answer: G.gameAnswerText(g.template, q), explain: q.explain || null }; });
    score = correct * ppq;
  }
  const perfect = max > 0 && score >= max;
  const xp = Math.round((score / Math.max(1, max)) * 50);
  S.plays.unshift({ id: S.seq++, gameId: g.id, score, max, correct, total, xp, at: now() });
  S.gamePlays[g.id] = (S.gamePlays[g.id] || 0) + 1;
  addXP(xp, "game", g.title); addCoins(xp, "game", g.title);
  // ดาว (เก็บค่าที่ดีที่สุดของแต่ละระดับ)
  const got = J.starsFor(score, max), byL = (S.stars[g0.id] = S.stars[g0.id] || {}), prevBest = byL[lvl] || 0;
  if (got > prevBest) byL[lvl] = got;
  if (b.story && Number.isInteger(b.storyG) && b.storyG >= 0 && b.storyG <= 12) { const GS2 = gStars(b.storyG), gb = (GS2[g0.id] = GS2[g0.id] || {}); if (got > (gb[lvl] || 0)) gb[lvl] = got; } // ดาวของเส้นทางชั้นนี้
  const unlockedNow = set ? lockBefore.filter((L) => !lockedFor(g0.id).includes(L)) : [];
  // บอส: นับการเผชิญหน้า ชนะเมื่อตอบถูกครบ (หลอดเลือดบอส = จำนวนข้อ)
  let boss = null; const BM = b.boss && J.BOSS_LIST.find((x) => x.id === b.boss.id);
  if (BM && ["mcq", "truefalse"].includes(g.template)) { const elite = !!b.boss.elite && eliteBefore, shiny = !!b.boss.shiny, rec = (S.bosses[BM.id] = S.bosses[BM.id] || { seen: 0, wins: 0, eliteWins: 0 }), win = correct === total && total > 0;
    rec.seen++; if (shiny) rec.shinySeen = (rec.shinySeen || 0) + 1; const first = win && !(elite ? rec.eliteWins : rec.wins); if (win) { if (elite) rec.eliteWins++; else rec.wins++; if (shiny) rec.shiny = (rec.shiny || 0) + 1; }
    // ปราบบอสหายาก/ร่างทองคำ → เหรียญโบนัส
    const bonus = win ? J.bossBonus(BM.rarity, shiny, elite) : 0; if (bonus) addCoins(bonus, "boss", `${shiny ? "✨ " : ""}${elite ? BM.elite : BM.name}`);
    boss = { id: BM.id, name: elite ? BM.elite : BM.name, elite, win, first, rarity: BM.rarity, shiny, bonus }; }
  const newBadges = checkBadges(perfect);
  const gems = gameGems(correct, !!boss?.win, b.hero);
  const lvAfter = Math.floor(S.xp / XP_PER_LEVEL) + 1;
  save();
  return { score, max, correct, total, passed: (score / Math.max(1, max)) * 100 >= 60, passPct: 60, perfect, review, saved: true, xp, coins: xp, newBadges, preview: false,
    stars: set ? { got, best: Math.max(got, prevBest), prevBest, level: lvl, levelName: Lessons.setupOf(Lessons.lessonById(g0.lesson)).levels[lvl - 1] } : null,
    unlockedLevel: !b.story && unlockedNow.length ? { level: unlockedNow[0], name: ["ง่ายมาก", "ง่าย", "ปานกลาง", "ยาก", "ยากมาก"][unlockedNow[0] - 1] } : null,
    levelUp: lvAfter > lvBefore ? { from: lvBefore, to: lvAfter, rank: J.rankOf(lvAfter) } : null,
    eliteNow: !eliteBefore && eliteUnlocked(), boss, gems, totalStars: totalStars(), rewardsReady: rewardsReady() };
});

on("GET", "/api/progress", () => {
  const t = totalStars(), lv = Math.floor(S.xp / XP_PER_LEVEL) + 1;
  const cats = CATS.map((c) => { const gs = GAMES.filter((g) => g.category === c.slug); return { slug: c.slug, name: c.name, icon: c.icon, got: gs.reduce((a, g) => a + starSum(starsOf(g.id)), 0), max: gs.length * 15, lessons: gs.length }; }).filter((c) => c.lessons);
  const lessons = GAMES.filter((g) => g.template === "lesson").map((g) => ({ id: g.id, title: g.title, icon: Lessons.lessonById(g.lesson).icon, category: g.category, got: starSum(starsOf(g.id)), byLevel: starsOf(g.id) }));
  return { level: lv, xp: S.xp, xpPerLevel: XP_PER_LEVEL, rank: J.rankOf(lv), stars: t, maxStars: lessons.length * 15, eliteUnlocked: eliteUnlocked(), eliteAt: J.ELITE_AT,
    milestones: J.MILESTONES.map((m) => ({ ...m, reached: t >= m.at, claimed: !!S.claimed[m.at] })), rewardsReady: rewardsReady(),
    bosses: (() => { const ch = J.bossChances(3), chB = J.bossChances(5, true); return J.BOSS_LIST.map((x) => ({ ...x, chance: ch[x.id], chanceHard: chB[x.id], rar: J.RARITY[x.rarity], bonus: J.bossBonus(x.rarity, false, false), seen: 0, wins: 0, eliteWins: 0, shiny: 0, ...(S.bosses[x.id] || {}) })); })(), cats, lessons };
});
on("POST", "/api/progress/claim", (_p, b) => {
  const m = J.MILESTONES.find((x) => x.at === +b.at); if (!m) throw err(404, "ไม่พบรางวัลนี้");
  if (totalStars() < m.at) throw err(400, `ต้องสะสมให้ครบ ${m.at} ดาวก่อน`); if (S.claimed[m.at]) throw err(400, "รับรางวัลนี้ไปแล้ว");
  S.claimed[m.at] = now(); addCoins(m.coins, "stars", `รางวัลสะสม ${m.at} ดาว`); S.activity.unshift({ kind: "reward", title: `รับรางวัล “${m.name}” (+${m.coins} เหรียญ)`, xp: 0, created_at: now() }); save();
  return { coins: S.coins, got: m.coins, rewardsReady: rewardsReady() };
});
// ---------- โหมดเรื่องราว ----------
const TRACK_RANGE = { all: [0, 12], ...Object.fromEntries(Array.from({ length: 13 }, (_, g) => [`g${g}`, [g, g]])) };
const gradeOfTrack = (t) => (/^g\d+$/.test(t || "") ? +t.slice(1) : -1);
const GL = (g) => (g === 0 ? "อนุบาล" : g <= 6 ? `ป.${g}` : `ม.${g - 6}`);
// ดาวของโหมดเรื่องราวแยกตามชั้น (เส้นทางของแต่ละชั้นมีด่านไม่เหมือนกัน) · เซฟเก่า: ยกดาวเดิมไปไว้ที่ชั้นแรกที่เปิด
function gStars(g) {
  if (!S.gstars || typeof S.gstars !== "object") S.gstars = {};
  const k = "g" + g; if (!S.gstars[k]) { S.gstars[k] = S.gstarsSeeded ? {} : JSON.parse(JSON.stringify(S.stars || {})); S.gstarsSeeded = true; }
  return S.gstars[k];
}
function planOf(cat, track = "all") {
  const tg = gradeOfTrack(track), [ta, tb] = TRACK_RANGE[track] || TRACK_RANGE.all, inTrack = (gr) => gr[0] <= tb && gr[1] >= ta;
  const c0 = catBy[cat], house = c0 ? { slug: c0.slug, name: c0.name, icon: c0.icon } : null;
  // เลือกชั้นแล้ว: เฉพาะบทเรียนที่มีคำถามของชั้นนั้นจริง ป้ายชั้นของทุกด่าน = ชั้นนั้น · ไม่ได้เลือก: ทุกบท เรียงตามช่วงชั้น
  const lessons = GAMES.filter((g) => g.template === "lesson" && g.category === cat).map((g, i) => { const L = Lessons.lessonById(g.lesson); return { gid: g.id, title: g.title, icon: L.icon, gr: L.grade, grade: Lessons.gradeLabel(L.grade), i, L }; })
    .filter((x) => tg < 0 || Lessons.hasGrade(x.L, tg)).map(({ L, ...x }) => (tg < 0 ? x : { ...x, gr: [tg, tg], grade: GL(tg) }))
    .sort((a, b) => a.gr[0] - b.gr[0] || a.gr[1] - b.gr[1] || a.i - b.i);
  if (!lessons.length) { if (tg < 0 || !STORY_CATS.has(cat)) throw err(404, "ไม่พบบ้านวิชานี้"); return { cat, empty: true, grade: GL(tg), house, chapters: [], total: 0, current: 0, got: 0, max: 0, gradeSpan: GL(tg) }; }
  const P = storyPlan(cat, lessons); if (!P) throw err(404, "ไม่พบบ้านวิชานี้");
  const SB = tg >= 0 ? gStars(tg) : S.stars;
  let prevOk = true, cur = null; const unlockAll = adminFlag && cloudUser;
  // สายชั้น: ด่านนอกสายไม่ขวางทาง (เล่นข้ามได้) · ด่านในสายต้องได้อย่างน้อย ★ เพื่อเปิดด่านถัดไป
  for (const ch of P.chapters) for (const st of ch.stages) { st.stars = (SB[st.gid] || {})[st.level] || 0; st.unlocked = prevOk || st.stars > 0 || !!unlockAll; st.inTrack = inTrack(st.gr); if (st.unlocked && !st.stars && !cur && st.inTrack) cur = st.n; if (st.inTrack) prevOk = st.stars > 0; }
  P.current = cur || P.total; P.gradeSpan = tg >= 0 ? GL(tg) : Lessons.gradeLabel([Math.min(...lessons.map((l) => l.gr[0])), Math.max(...lessons.map((l) => l.gr[1]))]); P.grade = tg >= 0 ? GL(tg) : null; P.got = P.chapters.reduce((a, c) => a + c.stages.reduce((b, x) => b + x.stars, 0), 0); P.max = P.total * 3;
  P.house = house;
  return P;
}
const stageOf = (P, n) => { for (const ch of P.chapters) for (const st of ch.stages) if (st.n === +n) return { ch, st }; throw err(404, "ไม่พบด่านนี้"); };
const qKey = (q) => { const t = String(q.prompt || q.a || "") + "|" + String(q.b || "") + "|" + String(q.options ? q.options[q.answer] : q.word ?? q.answer ?? ""); let h = 7; for (const c of t) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h.toString(36); };
on("GET", "/api/story/:cat", ({ cat }, _b, q) => planOf(cat, q.get("track") || "all"));
on("GET", "/api/story/:cat/:n/play", ({ cat, n }, _b, q) => {
  const P = planOf(cat, q.get("track") || "all"); if (P.empty) throw err(404, `บ้านนี้ยังไม่มีบทเรียนของชั้น ${P.grade}`); const { ch, st } = stageOf(P, n);
  if (!st.unlocked) throw err(403, "ด่านนี้ยังล็อกอยู่ ผ่านด่านก่อนหน้าก่อนนะ");
  const g = gameById(st.gid), L = Lessons.lessonById(g.lesson);
  const gG = gradeOfTrack(q.get("track")), sk = gG >= 0 ? `${g.lesson}@${gG}` : g.lesson; // ประวัติข้อที่เห็นแยกตามชั้น
  const rk = `${g.id}:${st.mode}` + (gG >= 0 ? `@${gG}` : ""), seen = new Set(S.seen[sk] || []);
  // เลือกหน้าต่างคำถามที่ "ยังไม่เคยเห็น" มากที่สุด (ลองหลายหน้าต่างถัดไป) → ไม่ซ้ำวนจนกว่าจะเล่นครบคลัง
  let best = null, bestNew = -1; const base = (S.rot[rk] || 0) + 1;
  for (let k = 0; k < 14; k++) { const b = Lessons.build(L, { level: st.level, mode: st.mode, count: st.count, set: Lessons.SETS + base + k, g: gG });
    const fresh = b.questions.filter((q) => !seen.has(qKey(q))).length; if (fresh > bestNew) { best = b; bestNew = fresh; S.rot[rk] = base + k; } if (fresh === b.questions.length) break; }
  if (bestNew === 0) S.seen[sk] = []; // เห็นครบคลังแล้ว → เริ่มรอบใหม่
  const arr = (S.seen[sk] = S.seen[sk] || []); for (const q of best.questions) arr.push(qKey(q)); if (arr.length > 600) arr.splice(0, arr.length - 600);
  SET_CACHE.set(g.lesson + "|" + best.key, best);
  save();
  const next = (() => { try { return stageOf(P, st.n + 1).st; } catch { return null; } })();
  return { game: { ...gameRow(g), template: best.template, templateName: best.templateName, howTo: best.howTo, timeLimitSec: best.timeLimitSec, questionCount: best.questions.length },
    questions: playableQs(best.template, best.questions), preview: false, key: best.key,
    boss: J.pickBoss(g.lesson + (st.boss ? "|boss" : ""), st.level, st.boss && ch.n >= 4 && eliteUnlocked(), { storyBoss: !!st.boss }),
    story: { cat, n: st.n, total: P.total, chapter: ch.n, chapterTitle: ch.title, chapterIntro: ch.intro, levelName: ch.levelName, line: st.line, boss: st.boss, villain: P.villain, house: P.house, prevStars: st.stars, g: gG, next: next ? { n: next.n, lesson: next.lesson } : null } };
});
on("GET", "/api/quizzes", (_p, _b, q) => {
  const t = (q.get("q") || "").toLowerCase();
  const list = QUIZZES.filter((x) => !t || x.title.toLowerCase().includes(t) || x.description.toLowerCase().includes(t));
  return { quizzes: list.map(quizRow), total: list.length, page: 1, pages: 1 };
});
on("GET", "/api/quizzes/attempt/:aid", ({ aid }) => { const a = S.attempts.find((x) => x.id === +aid); if (!a) throw err(404, "ไม่พบผลการทำ"); return { attempt: attemptView(a) }; });
on("GET", "/api/quizzes/:id", ({ id }, _b, q) => {
  const z = quizById(id);
  const out = { quiz: quizRow(z), canTake: true };
  if (q.get("start")) out.questions = z.questions.map((x, i) => {
    const base = { index: i, type: x.type, prompt: x.prompt, points: x.points || 1, image: x.image || null };
    const opts = (arr) => arr.map((t, k) => ({ k, t }));
    switch (x.type) {
      case "mcq": case "multi": return { ...base, options: opts(x.options) };
      case "fill": return { ...base, blanks: x.blanks.length };
      case "wordbank": return { ...base, blanks: x.blanks.length, bank: G.shuffle([...x.blanks, ...(x.distractors || [])]) };
      case "match": return { ...base, left: x.pairs.map((p) => p[0]), right: G.shuffle(x.pairs.map((p) => p[1])) };
      case "order": return { ...base, items: G.shuffleDifferent(x.items) };
      case "numeric": return { ...base, unit: x.unit || "" };
      default: return base;
    }
  });
  const last = S.attempts.find((a) => a.quizId === z.id);
  out.lastAttempt = last ? { id: last.id, score: last.score, max_score: last.max, status: "graded", submitted_at: last.at } : null;
  return out;
});
on("POST", "/api/quizzes/:id/submit", ({ id }, b) => {
  const z = quizById(id); const answers = b.answers || {};
  const results = {}; let score = 0, max = 0;
  z.questions.forEach((x, i) => { const g = G.gradeQuestion(x, answers[i]); max += g.max; score += g.points; results[i] = { correct: g.correct, points: g.points }; });
  const a = { id: S.seq++, quizId: z.id, answers, results, score, max, at: now() };
  S.attempts.unshift(a);
  const xp = Math.round((score / Math.max(1, max)) * 20);
  addXP(xp, "quiz", z.title); addCoins(xp, "quiz", z.title);
  const nOk = Object.values(results).filter((x) => x.correct).length, qg = nOk * GA.GEM.perQuiz; if (qg) addGems(qg, "จากแบบทดสอบ");
  const newBadges = checkBadges(max > 0 && score >= max);
  save();
  return { attempt: attemptView(a), xp, coins: xp, newBadges, pending: false, gems: qg ? { got: qg, total: GS().gems } : null };
});

on("GET", "/api/dashboard/student", () => {
  const qa = S.attempts.filter((a) => a.max > 0);
  const days = Array.from({ length: 7 }, (_, i) => dayKey(Date.now() - (6 - i) * 86400000));
  const by = Object.fromEntries(days.map((d) => [d, 0]));
  S.activity.forEach((a) => { const k = dayKey(a.created_at); if (k in by) by[k] += a.xp; });
  const recent = [...S.plays.map((p) => ({ kind: "game", title: gameById(p.gameId).title, refId: p.gameId, score: p.score, max: p.max, at: p.at })),
    ...S.attempts.map((a) => ({ kind: "quiz", title: quizById(a.quizId).title, refId: a.quizId, attemptId: a.id, score: a.score, max: a.max, pending: false, at: a.at }))]
    .sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
  const seen = new Map();
  S.plays.forEach((p) => { if (!seen.has(p.gameId)) seen.set(p.gameId, { id: p.gameId, title: gameById(p.gameId).title, plays: 0, last: p.score }); seen.get(p.gameId).plays++; });
  return { xp: S.xp, level: Math.floor(S.xp / XP_PER_LEVEL) + 1, xpPerLevel: XP_PER_LEVEL, streak: streak(), todo: [],
    stats: { quizzes: S.attempts.length, quizAvg: qa.length ? qa.reduce((s, a) => s + a.score / a.max, 0) / qa.length * 100 : null, games: S.plays.length, bestGame: Math.max(0, ...S.plays.map((p) => p.score)) },
    recent, recentGames: [...seen.values()].slice(0, 6), badges: BADGES.map((b) => ({ ...b, earned: !!S.badges[b.code], at: S.badges[b.code] || null })),
    xpChart: days.map((d) => ({ day: d, xp: by[d] })), activity: S.activity.slice(0, 10) };
});
on("GET", "/api/dashboard/profile", () => ({
  plays: S.plays.slice(0, 30).map((p) => ({ score: p.score, max_score: p.max, created_at: p.at, title: gameById(p.gameId).title, id: p.gameId })),
  quizzes: S.attempts.slice(0, 30).map((a) => ({ id: a.id, score: a.score, max_score: a.max, status: "graded", submitted_at: a.at, title: quizById(a.quizId).title })),
  badges: Object.keys(S.badges),
}));

on("GET", "/api/shop", () => ({
  coins: S.coins, slots: SLOTS, rarity: RARITY, boxes: BOXES, freeBox: freeAvailable(),
  items: CATALOG.map((x) => ({ ...x, owned: !!S.items[x.id], equipped: S.equipped[x.type] === x.id })),
  history: S.coinTx.slice(0, 12).map((h) => ({ amount: h.amount, reason: h.reason, detail: h.detail, created_at: h.at })),
}));
on("POST", "/api/shop/buy", (_p, b) => {
  const it = ITEM[b.itemId];
  if (!it) throw err(404, "ไม่พบสินค้านี้");
  if (it.boxOnly) throw err(400, "ของชิ้นนี้ได้จากกล่องสุ่มเท่านั้น");
  if (S.items[it.id]) throw err(400, "คุณมีของชิ้นนี้แล้ว");
  if (S.coins < it.price) throw err(400, `เหรียญไม่พอ (ต้องการ ${it.price} มี ${S.coins})`);
  addCoins(-it.price, "buy", it.name); S.items[it.id] = { source: "buy", at: now() }; save();
  return { ok: true, coins: S.coins };
});
on("POST", "/api/shop/equip", (_p, b) => {
  if (!SLOTS[b.slot] || b.slot === "theme" || b.slot === "sound") throw err(400, "ช่องนี้ใช้ไม่ได้");
  if (b.itemId) { const it = ITEM[b.itemId]; if (!it || it.type !== b.slot || !S.items[it.id]) throw err(400, "ใส่ของชิ้นนี้ไม่ได้"); S.equipped[b.slot] = it.id; }
  else delete S.equipped[b.slot];
  save(); return { ok: true, equipped: equippedView() };
});
// 💱 แลกเงินจากเกมตกปลา → เหรียญเกมหลัก (หักเงิน G ฝั่งเกมตกปลาก่อน แล้วจึงเรียก API นี้) · จำกัดต่อวัน
const XCH_CAP = 300;
const xchLeft = () => { const d = dayKey(new Date()); if (!S.xch || S.xch.day !== d) S.xch = { day: d, got: 0 }; return Math.max(0, XCH_CAP - S.xch.got); };
on("GET", "/api/exchange/fish", () => ({ rate: 5, cap: XCH_CAP, left: xchLeft(), coins: S.coins }));
on("POST", "/api/exchange/fish", (_p, b) => {
  const n = Math.floor(+b.coins || 0), left = xchLeft();
  if (!(n > 0)) throw err(400, "จำนวนไม่ถูกต้อง"); if (n > left) throw err(400, left ? `วันนี้แลกได้อีกไม่เกิน 🪙 ${left}` : "วันนี้แลกครบโควตาแล้ว");
  S.xch.got += n; addCoins(n, "exchange", `แลกจากเกมตกปลา ${n * 5} G`); S.activity.unshift({ kind: "exchange", title: `แลกเงินเกมตกปลา ${n * 5} G → 🪙 ${n}`, xp: 0, created_at: now() }); save();
  return { coins: S.coins, left: xchLeft(), got: n };
});

// ✨ อัญเชิญตัวละคร
on("GET", "/api/gacha", () => gachaView());
on("POST", "/api/gacha/starter", (_p, b) => {
  const g = GS(); if (!GA.STARTERS.includes(b.id)) throw err(400, "เลือกตัวละครเริ่มต้นไม่ถูกต้อง");
  if (!Object.keys(g.own).length) { g.own[b.id] = 0; g.party = b.id; g.hist.unshift(`★3 ${GA.RN[3]} · ${GA.ROSTER[b.id].n} · คู่หูคนแรก`); }
  if (!g.gift) { g.gift = true; addGems(GA.GEM.welcome, "ของขวัญต้อนรับ"); }
  save(); return gachaView();
});
on("POST", "/api/gacha/pull", (_p, b) => {
  const g = GS(), ticket = !!b.ticket, n = ticket ? 1 : +b.n === 10 ? 10 : 1;
  if (ticket) { if ((g.inv.shard || 0) < GA.SHARDS_PER_PULL) throw err(400, `ชิ้นส่วนดาวไม่พอ (ต้องการ ${GA.SHARDS_PER_PULL})`); g.inv.shard -= GA.SHARDS_PER_PULL; }
  else { const cost = GA.COST * n; if (g.gems < cost) throw err(400, `เพชรไม่พอ (ต้องการ ${cost.toLocaleString()} มี ${g.gems.toLocaleString()}) — ตอบคำถามให้ถูกเพื่อรับเพชรเพิ่ม`); g.gems -= cost; }
  const res = [];
  for (let i = 0; i < n; i++) res.push(GA.rollOnce(g, n === 10 && i === 9 && !res.some((r) => r.rar >= 4)));
  res.forEach((r, i) => {
    if (r.type === "ch") { const o = g.own[r.id]; r.isNew = o == null; r.dupMax = o === GA.MAX_STAGE; g.own[r.id] = o == null ? 0 : Math.min(GA.MAX_STAGE, o + 1); r.stage = g.own[r.id];
      if (r.dupMax) g.inv.shard = (g.inv.shard || 0) + 2; if (!g.party) g.party = r.id; }
    else if (r.it === "coin") addCoins(50, "gacha", "อัญเชิญได้เหรียญทอง");
    else g.inv[r.it] = (g.inv[r.it] || 0) + 1;
    g.hist.unshift(`${r.type === "ch" ? `★${r.rar} ${GA.RN[r.rar]} · ${GA.ROSTER[r.id].n}` : `★3 ${GA.ITEMS[r.it].n}`} · ครั้งที่ ${g.cnt - n + i + 1}`);
  });
  g.hist = g.hist.slice(0, 80);
  S.activity.unshift({ kind: "gacha", title: `อัญเชิญ ${n} ครั้ง${res.some((r) => r.rar === 5) ? " · ได้มิสติก ★5!" : ""}`, xp: 0, created_at: now() });
  save(); return { res, gacha: gachaView(), coins: S.coins };
});
on("POST", "/api/gacha/party", (_p, b) => { const g = GS(); if (g.own[b.id] == null) throw err(400, "ยังไม่มีตัวละครนี้"); g.party = b.id; save(); return gachaView(); });
on("POST", "/api/gacha/use", (_p, b) => { const g = GS(); if (!["hint", "pot"].includes(b.item)) throw err(400, "ใช้ไอเทมนี้ตอนสู้ไม่ได้"); if (!(g.inv[b.item] > 0)) throw err(400, "ไอเทมหมดแล้ว"); g.inv[b.item]--; save(); return gachaView(); });
on("POST", "/api/gacha/tut", (_p, b) => { const g = GS(); if (b.reset) g.tut = {}; else for (const k of [b.key, ...(Array.isArray(b.keys) ? b.keys : [])]) if (/^[a-z]{2,16}$/.test(k || "")) g.tut[k] = now(); save(); return gachaView(); });
on("POST", "/api/shop/box", (_p, b) => {
  const box = BOXES.find((x) => x.id === b.boxId);
  if (!box) throw err(404, "ไม่พบกล่องนี้");
  const free = !!b.free;
  if (free && (box.id !== "basic" || !freeAvailable())) throw err(400, "วันนี้เปิดกล่องฟรีไปแล้ว พรุ่งนี้มาใหม่นะ");
  if (!free && S.coins < box.price) throw err(400, `เหรียญไม่พอ (ต้องการ ${box.price} มี ${S.coins})`);
  if (free) { S.lastFree = dayKey(new Date()); addCoins(0, "free_box", box.name); } else addCoins(-box.price, "box", box.name);
  const rarity = pickWeighted(box.odds);
  const pool = CATALOG.filter((x) => x.rarity === rarity && (box.pool ? x.type === box.pool : x.type !== "pfp"));
  const it = pool[G.randInt(pool.length)];
  const dup = !!S.items[it.id];
  if (dup) addCoins(RARITY[rarity].refund, "duplicate", it.name); else S.items[it.id] = { source: "box", at: now() };
  save();
  return { item: it, rarity, rarityName: RARITY[rarity].name, duplicate: dup, refund: dup ? RARITY[rarity].refund : 0, coins: S.coins, freeBox: freeAvailable() };
});

/** ตัวแทน fetch: เรียกด้วย path และ opts แบบเดียวกับ api() ใน core.js */
export async function localApi(path, opts = {}) {
  const url = new URL(path, "http://local");
  const method = opts.method || (opts.body !== undefined ? "POST" : "GET");
  for (const r of routes) {
    if (r.method !== method) continue;
    const m = r.re.exec(url.pathname);
    if (m) return JSON.parse(JSON.stringify(r.fn(m.groups || {}, opts.body || {}, url.searchParams)));
  }
  throw err(404, "ฟีเจอร์นี้มีเฉพาะเวอร์ชันเต็ม (ที่มีเซิร์ฟเวอร์)");
}
