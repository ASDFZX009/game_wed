// "เซิร์ฟเวอร์จำลอง" ในเบราว์เซอร์ สำหรับ EduPlay เวอร์ชันเล่นบนเว็บ (ไม่ต้องมีเซิร์ฟเวอร์)
// ตอบ API ชุดเดียวกับเซิร์ฟเวอร์จริง เพื่อให้หน้าเว็บเดิมใช้ต่อได้ทั้งหมด
// ความคืบหน้าเก็บในเบราว์เซอร์ของผู้เล่น (และในบัญชี Claude ถ้าเปิดผ่าน artifact)
import DATA from "./data.json";
import G from "../server/grading.js";
import Lessons from "../server/lessons/index.js";

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
const fresh = () => ({ v: 1, name: "นักผจญภัย", grade: "", xp: 0, coins: WELCOME_COINS, createdAt: now(), updatedAt: now(), seq: 1,
  plays: [], attempts: [], badges: {}, activity: [], items: {}, equipped: {}, prefs: {}, coinTx: [{ amount: WELCOME_COINS, reason: "welcome", detail: "ของขวัญต้อนรับ", at: now() }], lastFree: null, gamePlays: {} });
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
  level: Math.floor(S.xp / XP_PER_LEVEL) + 1, xpPerLevel: XP_PER_LEVEL });
function addXP(xp, kind, title) { S.xp += xp; S.activity.unshift({ kind, title, xp, created_at: now() }); S.activity = S.activity.slice(0, 200); }
function addCoins(amount, reason, detail) { if (!amount && reason !== "free_box") return; S.coins += amount; S.coinTx.unshift({ amount, reason, detail, at: now() }); S.coinTx = S.coinTx.slice(0, 200); }
function streak() {
  const days = new Set(S.activity.filter((a) => a.xp > 0).map((a) => dayKey(a.created_at)));
  let n = 0;
  for (let i = 0; ; i++) { const k = dayKey(Date.now() - i * 86400000); if (days.has(k)) n++; else if (i === 0) continue; else break; }
  return n;
}
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
      category: c ? { slug: c.slug, name: c.name, icon: c.icon } : null, ageMin: g.age[0], ageMax: g.age[1], difficulty: "all",
      visibility: "public", status: "published", timeLimitSec: null, pointsPerQ: 100, passPct: 60, plays: S.gamePlays[g.id] || 0,
      questionCount: su.size, generated: su.generated, modeCount: su.modes.length, modeNames: su.modes.map((m) => m.icon + " " + m.name), sets: su.sets, version: 1, createdAt: g.createdAt, howTo: "เลือกระดับ รูปแบบการเล่น จำนวนข้อ และชุดคำถามได้ก่อนเริ่ม" }; }
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
function lessonSet(g, key) { const L = Lessons.lessonById(g.lesson); return Lessons.build(L, Lessons.parseKey(L, key)); }
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
    const L = Lessons.lessonById(g.lesson), built = Lessons.build(L, { level: q.get("level"), mode: q.get("mode"), count: q.get("count"), set: q.get("set") ?? 1, seed: q.get("seed") });
    return { game: { ...gameRow(g), template: built.template, templateName: built.templateName, howTo: built.howTo, timeLimitSec: built.timeLimitSec, questionCount: built.questions.length },
      questions: playableQs(built.template, built.questions), preview: false, key: built.key,
      setup: { ...Lessons.setupOf(L), current: { level: built.level, mode: built.mode, count: built.count, set: built.set } } };
  }
  return { game: gameRow(g), questions: playable(g), preview: false };
});
on("POST", "/api/games/:id/check", ({ id }, b) => {
  const g = gameById(id); const set = g.template === "lesson" ? lessonSet(g, b.key) : null, tpl = set ? set.template : g.template;
  const q = (set ? set.questions : g.questions)[+b.index];
  if (!q) throw err(400, "ไม่พบข้อนี้");
  return { correct: G.gradeGameQuestion(tpl, q, b.answer), answer: G.gameAnswerText(tpl, q), explain: q.explain || null };
});
on("POST", "/api/games/:id/finish", ({ id }, b) => {
  const g0 = gameById(id), set = g0.template === "lesson" ? lessonSet(g0, b.key) : null;
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
  const newBadges = checkBadges(perfect);
  save();
  return { score, max, correct, total, passed: (score / Math.max(1, max)) * 100 >= 60, passPct: 60, perfect, review, saved: true, xp, coins: xp, newBadges, preview: false };
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
  const newBadges = checkBadges(max > 0 && score >= max);
  save();
  return { attempt: attemptView(a), xp, coins: xp, newBadges, pending: false };
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
