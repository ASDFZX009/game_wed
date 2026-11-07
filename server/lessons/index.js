// บทเรียน: คลังคำถาม 5 ระดับ (ง่ายมาก–ยากมาก) · หลายรูปแบบการเล่น · เลือกจำนวนข้อ 6/10/15 · ชุดคำถาม 4 ชุด + สุ่มใหม่
// โค้ดบริสุทธิ์ ใช้ได้ทั้งเซิร์ฟเวอร์ (Node) และเวอร์ชันเว็บ (รวมไฟล์ด้วย esbuild)
// การตรวจคำตอบไม่ต้องเก็บสถานะ: ส่ง "key" (ระดับ.รูปแบบ.จำนวน.ชุด.seed) กลับมา แล้วสร้างชุดคำถามเดิมซ้ำได้เสมอ

const LEVELS = ["ง่ายมาก", "ง่าย", "ปานกลาง", "ยาก", "ยากมาก"];
const MODES = {
  mcq: { name: "ปรนัย 4 ตัวเลือก", icon: "🎯", template: "mcq", howTo: "เลือกคำตอบที่ถูกต้องทีละข้อ" },
  truefalse: { name: "ถูกหรือผิด", icon: "⚖️", template: "truefalse", howTo: "ตัดสินว่าข้อความหรือคำตอบที่เห็นถูกหรือผิด" },
  timed: { name: "ท้าเวลา", icon: "⏱️", template: "mcq", howTo: "ปรนัยแบบจับเวลา ตอบให้ครบก่อนหมดเวลา!" },
  match: { name: "จับคู่พลิกการ์ด", icon: "🃏", template: "match", howTo: "พลิกการ์ดหาคู่คำถามกับคำตอบ ยิ่งพลิกน้อยยิ่งได้คะแนนมาก" },
  scramble: { name: "เรียงตัวอักษร", icon: "🔤", template: "scramble", howTo: "เรียงตัวอักษรให้เป็นคำตอบที่ถูกต้อง" },
  order: { name: "เรียงลำดับ", icon: "🔢", template: "order", howTo: "เรียงรายการให้อยู่ในลำดับที่ถูกต้อง" },
};
const COUNTS = [6, 10, 15], SETS = 4;
const SEC_PER_Q = [15, 13, 11, 10, 9];

// ---------- สุ่มแบบกำหนดผลได้ ----------
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const shuffle = (arr, r) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const graphemes = (s) => { try { return [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(s)].map((x) => x.segment); } catch { return [...s]; } };

// ---------- รวมคลังคำถามจากทุกหมวด ----------
// บทเรียนใหม่ต่อท้ายไว้ในไฟล์ extra.js เสมอ (ลำดับบทเรียน = รหัสเกม → ความคืบหน้าเดิมของผู้เล่นไม่เลื่อน)
const EXTRA = require("./extra");
const BANKS = [require("./math"), require("./science"), require("./thai"), require("./english"), require("./social"), require("./health"), require("./early"), require("./brain"), require("./general"), EXTRA];
const LESSONS = BANKS.flat();
const BY_ID = Object.fromEntries(LESSONS.map((l) => [l.id, l]));
// คำถามเพิ่มเติมของบทเรียนเดิม
const MORE = [require("./more1"), require("./more2"), require("./more3")]; // คลังคำถามเพิ่ม (บทที่ข้อน้อย)
for (const [id, add] of [EXTRA.ADD || {}, ...MORE].flatMap((o) => Object.entries(o))) { const L = BY_ID[id]; if (!L) throw new Error("ADD: ไม่พบบทเรียน " + id); for (const k of ["qa", "tf", "seq"]) if (add[k]) L[k] = (L[k] || []).concat(add[k]); }
// ช่วงชั้นของแต่ละบทเรียน: 0 = อนุบาล · 1–6 = ป.1–ป.6 · 7–12 = ม.1–ม.6
const GRADE = {
  "math-addsub": [1, 4], "math-muldiv": [2, 6], "math-frac": [4, 7], "math-geo": [3, 9], "math-word": [3, 9], "math-number": [4, 8], "math-algebra": [6, 9], "math-adv": [10, 12],
  "sci-life": [1, 6], "sci-body": [3, 9], "sci-space": [2, 9], "sci-matter": [3, 9], "sci-cell": [7, 12], "sci-chem": [7, 12], "sci-physics": [8, 12],
  "th-words": [1, 6], "th-sound": [1, 6], "th-spell": [2, 9], "th-royal": [4, 9], "th-idiom": [4, 9], "th-wordtype": [4, 9], "th-lit": [6, 12],
  "en-vocab": [1, 9], "en-opposite": [2, 7], "en-grammar": [4, 9], "en-verbs": [5, 9], "en-idiom": [7, 12], "en-adv": [9, 12],
  "soc-civic": [3, 9], "soc-geo": [4, 9], "soc-history": [4, 9], "soc-asean": [5, 9], "soc-econ": [5, 12], "soc-world": [6, 12],
  "hl-food": [1, 9], "hl-body": [1, 9], "hl-safety": [1, 9], "hl-sport": [3, 9],
  "early-count": [0, 1], "early-colors": [0, 1], "early-animals": [0, 1], "early-letters": [0, 1],
  "brain-odd": [1, 6], "brain-quick": [2, 9], "brain-logic": [2, 9], "brain-seq": [3, 9],
  "gen-animals": [1, 6], "gen-thailand": [2, 9], "gen-tech": [3, 9], "gen-world": [5, 12],
};
for (const L of LESSONS) L.grade = L.grade || GRADE[L.id] || [1, 12];
const G1 = (g) => (g === 0 ? "อนุบาล" : g <= 6 ? `ป.${g}` : `ม.${g - 6}`);
const gradeLabel = ([a, b]) => (a === b ? G1(a) : `${G1(a)}–${G1(b)}`);
// คำถามที่เคยอยู่ในบทเรียน "คลังรวม" ส่งไปบทเรียนหัวข้อที่ตรงเรื่องตามตาราง routes.js
const ROUTE = require("./routes");
const BAL = require("./balance"); // ตัวลวงที่ปรับให้ยาวใกล้เคียงคำตอบ (กันเดาจากความยาว)
const ROUTED_FISH = ["คณิต", "วิทย์", "ไทย", "อังกฤษ", "สังคม", "สุขศึกษา"];
const ROUTED_LEGACY = ["บวกเลขง่าย ๆ", "สูตรคูณแม่ 2–12", "เศษส่วนและทศนิยม", "วิทย์ถูกหรือผิด", "เรียงลำดับวิทยาศาสตร์"];
const FISH = require("./fishing");
const { LEGACY_GAMES } = require("./legacy");
const LEVEL_OF = { easy: 2, medium: 3, hard: 4 };

// แถวคลังคำถาม: [lv, คำถาม, คำตอบ, ตัวลวง..., "§คำอธิบาย"] → { lv, q, a, w, ex }
function qaRow(row, extra = {}) {
  const [lv, q, a, ...rest] = row; const w = [], o = { lv, q: String(q), a: String(a), ...extra };
  for (const x of rest) { if (typeof x === "string" && x.startsWith("§")) { if (x.length > 1) o.ex = x.slice(1); } else if (x && typeof x === "object") Object.assign(o, x); else if (x !== "" && x != null) w.push(String(x)); }
  o.w = w; return o;
}
const prepared = new Map();
function prep(L) {
  if (prepared.has(L.id)) return prepared.get(L.id);
  const qa = [], tf = [], seq = [];
  for (const row of L.qa || []) qa.push(qaRow(row));
  if (L.pairs) for (const [lv, x, y, ex] of L.pairs.list) {
    qa.push({ lv, q: L.pairs.q.replace("{x}", x), a: String(y), w: [], mq: x, ...(ex ? { ex } : {}) });
    if (L.pairs.rev) qa.push({ lv: Math.min(5, lv + (L.pairs.revLift ?? 1)), q: L.pairs.rev.replace("{y}", y), a: String(x), w: [], mq: String(y), ma: x, rev: true, ...(ex ? { ex } : {}) });
  }
  for (const [lv, s, t, ex] of L.tf || []) tf.push({ lv, s, t, ex });
  for (const [lv, q, items] of L.seq || []) seq.push({ lv, q, items });
  // คลังคำถามรายชั้น: byGrade.qa[ชั้น] = [[คำถาม, คำตอบ, ตัวลวง..., "§อธิบาย"]] · byGrade.tf[ชั้น] = [[ข้อความ, true/false, อธิบาย]]
  const lvOfGrade = (g) => { const [a, b] = L.grade || [1, 12]; return b === a ? 3 : Math.min(5, Math.max(1, 1 + Math.round(((g - a) / (b - a)) * 4))); };
  for (const [g, rows] of Object.entries(L.byGrade?.qa || {})) for (const row of rows) { const it = qaRow([lvOfGrade(+g), ...row]); it.gr = +g; qa.push(it); }
  for (const [g, rows] of Object.entries(L.byGrade?.tf || {})) for (const [s2, t, ex] of rows) tf.push({ lv: lvOfGrade(+g), s: s2, t, ex, gr: +g });
  const fishRow = (row) => { if (typeof row[2] === "boolean") tf.push({ lv: row[0], s: row[1], t: row[2], ex: row[3] || undefined }); else qa.push(qaRow(row)); };
  for (const key of L.fish || []) for (const row of FISH[key] || []) fishRow(row);
  for (const key of ROUTED_FISH) for (const row of FISH[key] || []) if (ROUTE[row[1]] === L.id) fishRow(row);
  const legacyList = [...(L.legacy || []).map((t) => [t, null]), ...ROUTED_LEGACY.map((t) => [t, L.id])];
  for (const [title, only] of legacyList) { const g = LEGACY_GAMES.find((x) => x.title === title); if (!g) continue; const lv = LEVEL_OF[g.difficulty] || 3;
    for (const q of g.questions) { if (only && ROUTE[q.prompt] !== only) continue;
      if (g.template === "mcq") qa.push({ lv, q: q.prompt, a: q.options[q.answer], w: q.options.filter((_, i) => i !== q.answer), ex: q.explain, hint: q.hint, img: q.image });
      else if (g.template === "truefalse") tf.push({ lv, s: q.prompt, t: q.answer, ex: q.explain });
      else if (g.template === "order") seq.push({ lv, q: q.prompt, items: q.items });
      else if (g.template === "scramble") qa.push({ lv, q: q.prompt, a: q.word, w: [], hint: q.hint });
      else if (g.template === "match" && L.legacyPair) qa.push({ lv, q: L.legacyPair.replace("{x}", q.a), a: q.b, w: [], mq: q.a });
    } }
  // ตัดข้อซ้ำ (คำถาม + คำตอบเดียวกันจากหลายแหล่ง)
  const uniq = (arr, key) => { const seen = new Set(); return arr.filter((x) => { const k = key(x); if (seen.has(k)) return false; seen.add(k); return true; }); };
  for (const it of qa) if (BAL[it.q]) it.w = BAL[it.q].slice();
  const P = { qa: uniq(qa, (x) => x.q + "|" + x.a), tf: uniq(tf, (x) => x.s), seq: uniq(seq, (x) => x.q) };
  P.matchable = P.qa.filter((i) => (i.mq || i.q).length <= 32 && (i.ma || i.a).length <= 26);
  P.scramble = P.qa.filter((i) => !/\s/.test(i.a) && graphemes(i.a).length >= 2 && graphemes(i.a).length <= 14 && !/^\d+$/.test(i.a) && /[A-Za-z฀-๿]/.test(i.a));
  P.modes = Object.keys(MODES).filter((m) => {
    if (L.modes && !L.modes.includes(m)) return false;
    if (m === "mcq" || m === "timed") return !!(L.gen || L.ggen || qa.length);
    if (m === "truefalse") return !!(L.gen || L.ggen || qa.length || tf.length);
    if (m === "match") return L.match !== false && !!(L.gen || L.ggen || P.matchable.length >= 6);
    if (m === "scramble") return !!L.scramble && (!!L.ggen || P.scramble.length >= 6);
    if (m === "order") return seq.length >= 3;
    return false;
  });
  // ทุกข้อมีชั้นเรียน (gr): ข้อที่ไม่ได้ระบุชั้น → เทียบจากช่วงชั้นของบทเรียนกับระดับความยาก
  { const [a, b] = L.grade || [1, 12]; for (const it of [...P.qa, ...P.tf, ...P.seq]) if (it.gr == null) it.gr = Math.round(a + (((it.lv || 3) - 1) / 4) * (b - a)); }
  P.size = L.gen || L.ggen ? 0 : P.qa.length + P.tf.length + P.seq.length;
  prepared.set(L.id, P); return P;
}

// ---------- ตัวลวง ----------
const isNum = (s) => /^-?\d[\d,]*(\.\d+)?$/.test(s);
function numDistractors(a, r, n) {
  const v = Number(a.replace(/,/g, "")), dec = (a.split(".")[1] || "").length, out = new Set();
  const step = dec ? Math.pow(10, -dec) : Math.max(1, Math.round(Math.abs(v) * 0.1));
  const cands = [v + step, v - step, v + 2 * step, v - 2 * step, v + 10 * (dec ? step : 1), v - 10 * (dec ? step : 1), v * 2, Math.round(v / 2), v + 1, v - 1];
  for (const c of shuffle(cands, r)) { if (out.size >= n) break; const f = dec ? c.toFixed(dec) : String(Math.round(c)); if (f !== a && !(v >= 0 && Number(f) < 0)) out.add(Number(f).toLocaleString("en-US", { maximumFractionDigits: dec }).replace(/,/g, a.includes(",") ? "," : "")); }
  return [...out];
}
// ตัวเลือกตัวเลข: เดิมตัวลวงมักอยู่ "รอบ ๆ" คำตอบ → คำตอบจึงเป็นค่ากลาง ๆ เกือบทุกข้อ (เดาได้)
// สุ่มตำแหน่งลำดับของคำตอบ (น้อยสุด…มากสุด) ให้เท่า ๆ กัน โดยเติมตัวลวงด้านที่ขาด
const NUM_FREE = /ใด|ไหน|มากที่สุด|น้อยที่สุด|มากกว่า|น้อยกว่า|ใกล้|ประมาณ|ปัด|คู่|คี่|ไม่|เฉพาะ|ระหว่าง/;
function balanceNum(item, ds, r) {
  const a = String(item.a), num = (x) => Number(String(x).replace(/,/g, "")), v = num(a);
  if (NUM_FREE.test(item.q) || ds.length !== 3 || !ds.every(isNum) || !Number.isFinite(v)) return ds;
  const dec = (a.split(".")[1] || "").length, comma = a.includes(",") || Math.abs(v) >= 10000;
  const fmt = (c) => Number(dec ? c.toFixed(dec) : Math.round(c)).toLocaleString("en-US", { maximumFractionDigits: dec, minimumFractionDigits: dec }).replace(/,/g, comma && a.includes(",") ? "," : "");
  const t = Math.floor(r() * 4), below = ds.filter((x) => num(x) < v), above = ds.filter((x) => num(x) > v);
  if (below.length === t) return ds;
  const step = dec ? Math.pow(10, -dec) : Math.max(1, Math.round(Math.abs(v) * 0.1));
  const near = (sg) => { const ks = shuffle([1, 2, 3], r).concat(shuffle([4, 5, 10], r)), c = ks.map((k) => v + sg * k * step); if (step > 1) c.push(v + sg); c.push(sg < 0 ? Math.round(v / 2) : v * 2); return c; };
  const B = shuffle(below, r).slice(0, t), A = shuffle(above, r).slice(0, 3 - t), have = new Set([a, ...B, ...A]);
  for (const [arr, want, sg] of [[B, t, -1], [A, 3 - t, 1]]) for (const c of near(sg)) { if (arr.length >= want) break; const f = fmt(c); if (have.has(f) || (v >= 0 && num(f) < 0) || num(f) === v) continue; have.add(f); arr.push(f); }
  return B.length + A.length === 3 ? [...B, ...A] : ds;
}
function distractors(item, P, r, n = 3) {
  const out = []; const seen = new Set([item.a]);
  for (const w of shuffle(item.w || [], r)) { if (out.length >= n) break; if (!seen.has(w)) { seen.add(w); out.push(w); } }
  if (out.length < n && isNum(item.a)) for (const w of numDistractors(item.a, r, n * 2)) { if (out.length >= n) break; if (!seen.has(w)) { seen.add(w); out.push(w); } }
  if (out.length < n) { // คำตอบของข้ออื่นในบทเรียนเดียวกัน (เลือกระดับใกล้เคียงและชนิดคำตอบเดียวกันก่อน)
    // ตัวลวงต้องเป็นภาษาเดียวกับคำตอบ (คำตอบอังกฤษ → ตัวลวงอังกฤษ) ไม่อย่างนั้นเดาถูกได้ทันที
    // ตัวลวงจากข้อของชั้นใกล้เคียงก่อน (ม.ปลาย ไม่ควรมีตัวลวงเป็นคำศัพท์ ป.1)
    const near = (x) => (x.gr != null && item.gr != null ? Math.abs(x.gr - item.gr) : Math.abs(x.lv - item.lv));
    const lat = (t) => /^[\x00-\x7F]*$/.test(String(t)) && /[a-z]/i.test(String(t)), al = lat(item.a);
    const same = P.qa.filter((x) => x !== item && !!x.rev === !!item.rev && isNum(x.a) === isNum(item.a) && lat(x.a) === al).sort((x, y) => near(x) - near(y) + (r() - 0.5) * 1.5);
    for (const x of same) { if (out.length >= n) break; if (!seen.has(x.a)) { seen.add(x.a); out.push(x.a); } }
  }
  return out;
}

// ---------- เลือกข้อตามระดับและชุด ----------
function pickLevel(pool, level, n, set, base, r) {
  const tiers = [];
  for (const it of pool) { const d = Math.abs((it.lv || 3) - level); (tiers[d] ||= []).push(it); }
  // โหมดเรื่องราว (ชุด > 4): หน้าต่างเลื่อนบนคลังรอบระดับนั้น (ระดับตรงก่อน แล้วระดับใกล้เคียง) → เล่นซ้ำได้ข้อใหม่จนกว่าจะครบคลัง
  if (set > SETS) {
    // ระดับตรง + ระดับติดกันเสมอ (±1) · ระดับห่างกว่านั้นเติมเฉพาะเมื่อคลังเล็ก · ตัดโจทย์ข้อความซ้ำออก
    const list = [], seenQ = new Set();
    for (let d = 0; d < tiers.length; d++) { if (!tiers[d]) continue; if (d >= 2 && list.length >= n * 4) break;
      for (const it of shuffle(tiers[d], rng(hashStr(base + "|w" + d)))) { const k = (it.q || it.s || it.mq || "") + "|" + (it.a ?? it.t ?? ""); if (seenQ.has(k)) continue; seenQ.add(k); list.push(it); } }
    if (!list.length) return [];
    const off = ((set - SETS - 1) * n) % list.length, out = [];
    for (let i = 0; i < Math.min(n, list.length); i++) out.push(list[(off + i) % list.length]);
    return shuffle(out, r);
  }
  const out = [];
  for (const tier of tiers) { if (!tier) continue; let t = shuffle(tier, set === 0 ? r : rng(hashStr(base + "|" + tier.length)));
    if (set > 0 && t.length > 0) { const off = ((set - 1) * n) % t.length; t = t.slice(off).concat(t.slice(0, off)); }
    for (const it of t) { if (out.length >= n) break; out.push(it); }
    if (out.length >= n) break; }
  return shuffle(out, r);
}

function setupOf(L) {
  const P = prep(L);
  return { levels: LEVELS, modes: P.modes.map((id) => ({ id, ...MODES[id] })), counts: COUNTS, sets: SETS, size: P.size, generated: !!L.gen };
}
function normOpts(L, o = {}) {
  const P = prep(L);
  const level = Math.min(5, Math.max(1, parseInt(o.level) || L.defaultLevel || 2));
  const mode = P.modes.includes(o.mode) ? o.mode : P.modes[0];
  const count = COUNTS.includes(+o.count) ? +o.count : 10;
  const set = Math.min(99999, Math.max(0, parseInt(o.set ?? 1) || 0)); // 1–4 = ชุดคำถามคงที่ · >4 = หน้าต่างหมุนเวียนของโหมดเรื่องราว (ไม่ซ้ำจนกว่าจะครบคลัง)
  const seed = set === 0 ? (parseInt(o.seed) || Math.floor(Math.random() * 1e9)) : 0;
  const g0 = parseInt(o.g), g = Number.isFinite(g0) && g0 >= 0 && g0 <= 12 ? g0 : -1; // ชั้นเรียนของผู้เล่น (0 อนุบาล · 1–6 ป. · 7–12 ม.) · −1 = ไม่ระบุ
  return { level, mode, count, set, seed, g };
}
const keyOf = (o) => [o.level, o.mode, o.count, o.set, o.seed].join(".") + (o.g >= 0 ? "." + o.g : "");
function parseKey(L, key) { const [level, mode, count, set, seed, g] = String(key || "").split("."); return normOpts(L, { level, mode, count, set, seed: seed || 1, g: g ?? -1 }); }
// ชั้นเป้าหมายของด่าน: บทที่ 1 ทบทวนชั้นก่อนหน้า · บทที่ 2–4 ชั้นของเรา · บทที่ 5 ท้าทายชั้นถัดไป (อยู่ในช่วงชั้นของบทเรียน)
const GRADE_SHIFT = [-1, 0, 0, 0, 1];
function targetGrade(L, o) { const [a, b] = L.grade || [1, 12]; if (o.g < 0) return Math.round(a + ((o.level - 1) / 4) * (b - a)); return Math.min(b, Math.max(a, o.g + GRADE_SHIFT[o.level - 1])); }

// คลังรวมของบ้านวิชาเดียวกัน (ใช้กับบทเรียนตามชั้นเรียน: ดึงข้อของบทอื่นที่ตรงชั้นมาเสริม → คำถามไม่ซ้ำนานขึ้น)
const catPools = new Map();
function catPool(L) {
  if (!catPools.has(L.cat)) { const qa = [], tf = []; for (const x of LESSONS) if (x.cat === L.cat && !x.gen && !x.ggen && !x.byGrade) { const P = prep(x), r = rng(hashStr("cp|" + x.id));
    // ข้อที่ไปใช้ในบทอื่น ต้องพกตัวลวงจากบทเรียนต้นทางไปด้วย (เช่น ข้อแบบคู่คำกลับด้านที่ไม่มีตัวลวงในตัว)
    qa.push(...P.qa.map((it) => ((it.w || []).length >= 3 ? it : { ...it, w: distractors(it, P, r) }))); tf.push(...P.tf); } catPools.set(L.cat, { qa, tf }); }
  return catPools.get(L.cat);
}
/** สร้างชุดคำถามตามตัวเลือก → { template, questions, timeLimitSec, key, ... } */
function build(L, opts) {
  const o = normOpts(L, opts), P = prep(L), M = MODES[o.mode], n = o.count;
  const r = rng(hashStr(`${L.id}|${keyOf(o)}`));
  let items;
  const tg = targetGrade(L, o);
  if (L.ggen && o.mode !== "order") {
    // บทเรียนสร้างโจทย์ตามชั้นเรียน: โจทย์ใหม่ทุกครั้งตามหลักสูตรของชั้นนั้น
    items = []; const seenQ = new Set(), cards = new Set();
    for (const g of [tg, tg - 1, tg + 1].filter((x) => x >= (L.grade || [0])[0] && x <= (L.grade || [0, 12])[1]))
      for (let tries = 0; items.length < n && tries < n * 50; tries++) { const it = L.ggen(g, r, o.level); if (!it) continue; it.lv = o.level; it.gr = g; it.w = it.w || [];
        const ca = it.ma || it.a, cq = it.mq || it.q; if (o.mode === "scramble" && !(it.scr && graphemes(it.a).length >= 3 && graphemes(it.a).length <= 12)) continue; if (o.mode === "match" && !it.mq) continue;
        if (seenQ.has(it.q + "|" + it.a) || (o.mode === "match" && (cards.has(ca) || cards.has(cq) || ca === cq))) continue; seenQ.add(it.q + "|" + it.a); cards.add(ca); cards.add(cq); items.push(it); if (items.length >= n) break; }
    const CP = catPool(L), sqa = P.qa.concat(CP.qa), stf = P.tf.concat(CP.tf);
    const stat = o.mode === "truefalse" ? stf.map((x) => ({ ...x, kind: "tf" })).concat(sqa) : o.mode === "mcq" || o.mode === "timed" ? sqa : [];
    if (stat.length >= 4 && items.length) { const pool = stat.filter((x) => Math.abs((x.gr ?? tg) - tg) <= 1).map((x) => ({ ...x, lv: Math.abs((x.gr ?? tg) - tg) })), k = Math.min(Math.round(n / 3), pool.length), extra = pickLevel(pool, 0, k, o.set, `${L.id}|${tg}|${o.mode}|s`, r);
      items = shuffle(items.slice(0, n - extra.length).concat(extra), r); }
  } else if (L.gen && o.mode !== "order" && o.mode !== "scramble") {
    items = []; const seenQ = new Set(), cards = new Set();
    // เลือกชั้นแล้ว → แปลงชั้นเป้าหมายเป็นระดับของตัวสร้างโจทย์ (ชั้นต่ำ = ง่าย · ชั้นสูง = ยาก)
    const glv = o.g >= 0 ? (() => { const [a, b] = L.grade || [1, 12]; return b === a ? o.level : Math.min(5, Math.max(1, 1 + Math.round(((tg - a) / (b - a)) * 4))); })() : o.level;
    // ถ้าระดับนี้สร้างโจทย์ไม่ซ้ำได้ไม่พอ (เช่น จับคู่ที่คำตอบซ้ำกันง่าย) ให้ขยับไปใช้ระดับข้างเคียง
    for (const lv of [glv, glv - 1, glv + 1, glv - 2, glv + 2].filter((x) => x >= 1 && x <= 5)) {
      for (let tries = 0; items.length < n && tries < n * 40; tries++) { const it = L.gen(lv, r); it.lv = lv; it.w = it.w || [];
        const ca = it.ma || it.a, cq = it.mq || it.q;
        if (seenQ.has(it.q) || (o.mode === "match" && (cards.has(ca) || cards.has(cq) || ca === cq))) continue; seenQ.add(it.q); cards.add(ca); cards.add(cq); items.push(it); }
      if (items.length >= n) break;
    }
    // บทเรียนสร้างโจทย์อัตโนมัติ: แทรกคำถามจากคลังที่ส่งมาจากบทเรียนคลังรวม (~ 1 ใน 4 ข้อ) ให้หลากหลายขึ้น
    const stat = o.mode === "truefalse" ? P.tf.map((x) => ({ ...x, kind: "tf" })).concat(P.qa) : o.mode === "mcq" || o.mode === "timed" ? P.qa : [];
    if (stat.length >= 4 && items.length) { const k = Math.min(Math.round(n / 4), stat.length), extra = pickLevel(stat, o.level, k, o.set, `${L.id}|${o.level}|${o.mode}|s`, r);
      items = shuffle(items.slice(0, n - extra.length).concat(extra), r); }
  } else {
    // บทเรียนตามชั้นเรียน (byGrade) + เลือกชั้นแล้ว → เสริมด้วยข้อของบทอื่นในบ้านเดียวกันที่ตรงชั้น (±1)
    const CP = L.byGrade && o.g >= 0 && (o.mode === "mcq" || o.mode === "timed" || o.mode === "truefalse") ? catPool(L) : null;
    const qa2 = CP ? P.qa.concat(CP.qa.filter((x) => Math.abs(x.gr - tg) <= 1)) : P.qa, tf2 = CP ? P.tf.concat(CP.tf.filter((x) => Math.abs(x.gr - tg) <= 1)) : P.tf;
    const pool = o.mode === "truefalse" ? tf2.map((x) => ({ ...x, kind: "tf" })).concat(qa2) : o.mode === "match" ? P.matchable : o.mode === "scramble" ? P.scramble : o.mode === "order" ? P.seq : qa2;
    let src = pool;
    if (o.mode === "match") { const seen = new Set(); src = shuffle(pool, rng(hashStr(L.id + "m"))).filter((x) => { const k = x.ma || x.a, k2 = x.mq || x.q; if (seen.has(k) || seen.has(k2)) return false; seen.add(k); seen.add(k2); return true; }); }
    items = o.g >= 0 ? pickLevel(src.map((x) => ({ ...x, lv: Math.abs((x.gr ?? tg) - tg) })), 0, n, o.set, `${L.id}|g${tg}|${o.mode}`, r) : pickLevel(src, o.level, n, o.set, `${L.id}|${o.level}|${o.mode}`, r);
  }
  const genP = L.gen || L.ggen ? { qa: items.concat(P.qa) } : P;
  const questions = items.map((it) => {
    if (o.mode === "mcq" || o.mode === "timed") {
      const opts2 = shuffle([it.a, ...balanceNum(it, distractors(it, genP, r), r)], r);
      return { prompt: it.q, options: opts2, answer: opts2.indexOf(it.a), ...(it.ex ? { explain: it.ex } : {}), ...(it.hint ? { hint: it.hint } : {}), ...(it.img ? { image: it.img } : {}) };
    }
    if (o.mode === "truefalse") {
      if (it.kind === "tf") return { prompt: it.s, answer: !!it.t, ...(it.ex ? { explain: it.ex } : {}) };
      const right = r() < 0.5, wrong = right ? null : distractors(it, genP, r, 1)[0];
      const cand = right || !wrong ? it.a : wrong;
      return { prompt: `${it.q}  ➜  ${cand}`, answer: cand === it.a, explain: cand === it.a ? (it.ex || `ถูกต้อง คำตอบคือ “${it.a}”`) : `คำตอบที่ถูกคือ “${it.a}”${it.ex ? " — " + it.ex : ""}` };
    }
    if (o.mode === "match") return { a: it.mq || it.q.replace(/\s*=\s*\?\s*$/, ""), b: it.ma || it.a };
    if (o.mode === "scramble") { const g = graphemes(it.a); return { prompt: it.sq || it.q, word: it.a, hint: it.hint || `มี ${g.length} ตัวอักษร ขึ้นต้นด้วย “${g[0]}”` }; }
    return { prompt: it.q, items: it.items };
  });
  return { ...o, key: keyOf(o), template: M.template, templateName: M.name, howTo: M.howTo, questions,
    timeLimitSec: o.mode === "timed" ? questions.length * SEC_PER_Q[o.level - 1] : null };
}

const lessonById = (id) => BY_ID[id] || null;
module.exports = { LESSONS, LEVELS, MODES, COUNTS, SETS, build, parseKey, setupOf, lessonById, prep, graphemes, gradeLabel, ROUTE, ROUTED_FISH, ROUTED_LEGACY };
