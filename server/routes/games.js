// เกม: คลังเกม เล่นเกม ตรวจคำตอบ บันทึกผล และตัวสร้างเกมของครู
const express = require("express");
const { db, now, J } = require("../db");
const { need } = require("../auth");
const U = require("../util");

const r = express.Router();
const TEMPLATES = ["truefalse", "match", "order", "scramble", "mcq"];
const TEMPLATE_TH = { truefalse: "ถูก/ผิด", match: "จับคู่", order: "เรียงลำดับ", scramble: "เรียงคำ", mcq: "ปรนัย" };
const HOWTO = {
  truefalse: "ตัดสินว่าข้อความถูกหรือผิด",
  match: "พลิกการ์ดหาคู่ให้ครบ ยิ่งพลิกน้อยยิ่งได้คะแนนมาก",
  order: "เรียงรายการให้อยู่ในลำดับที่ถูกต้อง",
  scramble: "เรียงตัวอักษรให้เป็นคำที่ถูกต้อง",
  mcq: "เลือกคำตอบที่ถูกต้องทีละข้อ",
};
const PAGE = 12;

function gameRow(g) {
  const cat = g.category_id ? db.prepare("SELECT slug, name_th, icon FROM categories WHERE id = ?").get(g.category_id) : null;
  const qs = J(g.questions, []);
  return {
    id: g.id, title: g.title, description: g.description, template: g.template, templateName: TEMPLATE_TH[g.template],
    category: cat ? { slug: cat.slug, name: cat.name_th, icon: cat.icon } : null,
    ageMin: g.age_min, ageMax: g.age_max, difficulty: g.difficulty, visibility: g.visibility, status: g.status,
    timeLimitSec: g.time_limit_sec, pointsPerQ: g.points_per_q, passPct: g.pass_pct, plays: g.plays,
    questionCount: qs.length, version: g.version, updatedAt: g.updated_at, createdAt: g.created_at,
    ownerId: g.owner_id, howTo: HOWTO[g.template],
  };
}

function assignedTo(userId, kind, refId) {
  return db.prepare(`SELECT a.id FROM assignments a JOIN class_members m ON m.class_id = a.class_id
    WHERE m.user_id = ? AND a.kind = ? AND a.ref_id = ?`).get(userId, kind, refId);
}
function canPlay(g, user) {
  if (!g) return false;
  if (g.status === "published" && g.visibility === "public") return true;
  if (user && (user.role === "admin" || user.id === g.owner_id)) return true;
  return !!(user && g.status === "published" && assignedTo(user.id, "game", g.id));
}
const canEdit = (g, user) => g && user && (user.role === "admin" || user.id === g.owner_id);

// ---------- คลังเกม ----------
r.get("/", (req, res) => {
  const { q = "", category = "", difficulty = "", age = "", sort = "new" } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const where = ["g.status='published'", "g.visibility='public'"];
  const args = [];
  if (q) { where.push("(g.title LIKE ? OR g.description LIKE ?)"); args.push(`%${q}%`, `%${q}%`); }
  if (category) { where.push("c.slug = ?"); args.push(category); }
  if (["easy", "medium", "hard"].includes(difficulty)) { where.push("g.difficulty = ?"); args.push(difficulty); }
  if (age && !isNaN(+age)) { where.push("g.age_min <= ? AND g.age_max >= ?"); args.push(+age, +age); }
  const order = sort === "popular" ? "g.plays DESC, g.id DESC" : sort === "title" ? "g.title COLLATE NOCASE" : "g.created_at DESC, g.id DESC";
  const base = `FROM games g LEFT JOIN categories c ON c.id = g.category_id WHERE ${where.join(" AND ")}`;
  const total = db.prepare(`SELECT COUNT(*) n ${base}`).get(...args).n;
  const rows = db.prepare(`SELECT g.* ${base} ORDER BY ${order} LIMIT ? OFFSET ?`).all(...args, PAGE, (page - 1) * PAGE);
  res.json({ games: rows.map(gameRow), total, page, pages: Math.max(1, Math.ceil(total / PAGE)) });
});

r.get("/featured", (_req, res) => {
  const rows = db.prepare("SELECT * FROM games WHERE status='published' AND visibility='public' ORDER BY plays DESC, id LIMIT 6").all();
  const count = db.prepare("SELECT COUNT(*) n FROM games WHERE status='published' AND visibility='public'").get().n;
  res.json({ games: rows.map(gameRow), count });
});

// ---------- เล่นเกม ----------
function playable(g) {
  const qs = J(g.questions, []);
  switch (g.template) {
    case "truefalse": return qs.map((q) => ({ prompt: q.prompt, image: q.image || null }));
    case "mcq": return qs.map((q) => ({ prompt: q.prompt, options: q.options, hint: q.hint || null, image: q.image || null }));
    case "order": return qs.map((q) => ({ prompt: q.prompt, items: U.shuffleDifferent(q.items), hint: q.hint || null }));
    case "scramble": return qs.map((q) => ({ prompt: q.prompt, tiles: U.shuffleDifferent(U.graphemes(q.word)), hint: q.hint || null, length: U.graphemes(q.word).length }));
    case "match": {
      const cards = [];
      qs.forEach((p, i) => { cards.push({ pair: i, text: p.a }); cards.push({ pair: i, text: p.b }); });
      return [{ cards: U.shuffle(cards), pairs: qs.length }];
    }
  }
  return [];
}

r.get("/:id/play", (req, res) => {
  const g = db.prepare("SELECT * FROM games WHERE id = ?").get(req.params.id);
  if (!canPlay(g, req.user)) return res.status(404).json({ error: "ไม่พบเกมนี้" });
  res.json({ game: gameRow(g), questions: playable(g), preview: g.status !== "published" });
});

r.post("/:id/check", (req, res) => {
  const g = db.prepare("SELECT * FROM games WHERE id = ?").get(req.params.id);
  if (!canPlay(g, req.user) || g.template === "match") return res.status(404).json({ error: "ไม่พบเกมนี้" });
  const q = J(g.questions, [])[+req.body.index];
  if (!q) return res.status(400).json({ error: "ไม่พบข้อนี้" });
  res.json({ correct: U.gradeGameQuestion(g.template, q, req.body.answer), answer: U.gameAnswerText(g.template, q), explain: q.explain || null });
});

r.post("/:id/finish", (req, res) => {
  const g = db.prepare("SELECT * FROM games WHERE id = ?").get(req.params.id);
  if (!canPlay(g, req.user)) return res.status(404).json({ error: "ไม่พบเกมนี้" });
  const qs = J(g.questions, []);
  const ppq = g.points_per_q;
  let correct = 0, score = 0, max = 0, total = qs.length;
  let review = [];
  if (g.template === "match") {
    const moves = Math.max(qs.length, parseInt(req.body.moves) || 0);
    const done = !!req.body.completed;
    max = ppq * qs.length;
    const extra = moves - qs.length;
    // ครบทุกคู่: เริ่มที่คะแนนเต็ม หักคะแนนทุกครั้งที่พลิกเกิน (ขั้นต่ำครึ่งหนึ่ง)
    score = done ? Math.max(Math.round(max / 2), max - Math.round(extra * ppq * 0.1)) : 0;
    correct = done ? qs.length : Math.min(qs.length, parseInt(req.body.found) || 0);
    if (!done) score = correct * Math.round(ppq / 2);
    review = qs.map((q) => ({ prompt: q.a, correct: done, answer: U.gameAnswerText("match", q) }));
  } else {
    const ans = Array.isArray(req.body.answers) ? req.body.answers : [];
    max = ppq * total;
    review = qs.map((q, i) => {
      const ok = ans[i] !== undefined && ans[i] !== null && U.gradeGameQuestion(g.template, q, ans[i]);
      if (ok) correct++;
      return { prompt: q.prompt, correct: ok, answer: U.gameAnswerText(g.template, q), explain: q.explain || null };
    });
    score = correct * ppq;
  }
  const pct = max ? (score / max) * 100 : 0;
  const passed = pct >= g.pass_pct;
  const perfect = max > 0 && score >= max;
  const out = { score, max, correct, total, passed, passPct: g.pass_pct, perfect, review, saved: false, xp: 0, newBadges: [] };

  const isPreview = g.status !== "published";
  if (req.user && !isPreview) {
    const xp = Math.round((score / Math.max(1, max)) * 50);
    let assignmentId = null;
    if (req.body.assignmentId) {
      const a = db.prepare(`SELECT a.id FROM assignments a JOIN class_members m ON m.class_id=a.class_id WHERE a.id=? AND m.user_id=? AND a.kind='game' AND a.ref_id=?`).get(req.body.assignmentId, req.user.id, g.id);
      assignmentId = a ? a.id : null;
    }
    db.prepare("INSERT INTO game_plays (game_id,user_id,assignment_id,score,max_score,correct,total,xp,created_at) VALUES (?,?,?,?,?,?,?,?,?)")
      .run(g.id, req.user.id, assignmentId, score, max, correct, total, xp, now());
    U.addXP(req.user.id, xp, "game", g.title);
    require("../shop").addCoins(req.user.id, xp, "game", g.title); // ได้เหรียญเท่ากับ XP
    out.newBadges = U.checkBadges(req.user.id, { perfect });
    out.saved = true; out.xp = xp; out.coins = xp;
  }
  if (!isPreview) db.prepare("UPDATE games SET plays = plays + 1 WHERE id = ?").run(g.id);
  out.preview = isPreview;
  res.json(out);
});

// ---------- ตัวสร้างเกม (ครู) ----------
function cleanQuestions(template, qs) {
  if (!Array.isArray(qs)) throw new Error("รูปแบบคำถามไม่ถูกต้อง");
  const s = (v, n = 300) => String(v ?? "").trim().slice(0, n);
  const img = (v) => (typeof v === "string" && /^data:image\/(png|jpeg|webp|svg\+xml);base64,/.test(v) && v.length < 220000 ? v : null);
  const out = qs.map((q, i) => {
    const n = `ข้อ ${i + 1}: `;
    switch (template) {
      case "truefalse":
        if (!s(q.prompt)) throw new Error(n + "ยังไม่ได้ใส่โจทย์");
        return { prompt: s(q.prompt), answer: !!q.answer, explain: s(q.explain) || undefined, image: img(q.image) || undefined };
      case "mcq": {
        const opts = (q.options || []).map((o) => s(o, 150)).filter(Boolean);
        if (!s(q.prompt)) throw new Error(n + "ยังไม่ได้ใส่โจทย์");
        if (opts.length < 2) throw new Error(n + "ต้องมีตัวเลือกอย่างน้อย 2 ตัว");
        const ans = Math.min(Math.max(0, parseInt(q.answer) || 0), opts.length - 1);
        return { prompt: s(q.prompt), options: opts, answer: ans, hint: s(q.hint) || undefined, explain: s(q.explain) || undefined, image: img(q.image) || undefined };
      }
      case "order": {
        const items = (q.items || []).map((o) => s(o, 120)).filter(Boolean);
        if (!s(q.prompt)) throw new Error(n + "ยังไม่ได้ใส่โจทย์");
        if (items.length < 2) throw new Error(n + "ต้องมีอย่างน้อย 2 รายการ");
        return { prompt: s(q.prompt), items, hint: s(q.hint) || undefined };
      }
      case "scramble": {
        const word = s(q.word, 40);
        if (U.graphemes(word).length < 2) throw new Error(n + "คำตอบต้องยาวอย่างน้อย 2 ตัวอักษร");
        return { prompt: s(q.prompt) || "เรียงตัวอักษรให้เป็นคำ", word, hint: s(q.hint) || undefined };
      }
      case "match":
        if (!s(q.a) || !s(q.b)) throw new Error(n + "ต้องใส่ทั้งสองฝั่งของคู่");
        return { a: s(q.a, 60), b: s(q.b, 60) };
    }
    throw new Error("ชนิดเกมไม่ถูกต้อง");
  });
  if (!out.length) throw new Error("ต้องมีคำถามอย่างน้อย 1 ข้อ");
  if (template === "match" && out.length < 2) throw new Error("เกมจับคู่ต้องมีอย่างน้อย 2 คู่");
  if (out.length > 60) throw new Error("มีคำถามได้ไม่เกิน 60 ข้อ");
  return out;
}

function readMeta(b) {
  const catId = b.categorySlug ? db.prepare("SELECT id FROM categories WHERE slug = ?").get(b.categorySlug)?.id ?? null : null;
  const ageMin = Math.max(1, Math.min(99, parseInt(b.ageMin) || 4));
  const ageMax = Math.max(ageMin, Math.min(99, parseInt(b.ageMax) || 18));
  const tl = parseInt(b.timeLimitSec);
  return {
    title: String(b.title || "").trim().slice(0, 120), description: String(b.description || "").trim().slice(0, 500),
    category_id: catId, age_min: ageMin, age_max: ageMax,
    difficulty: ["easy", "medium", "hard"].includes(b.difficulty) ? b.difficulty : "easy",
    visibility: b.visibility === "public" ? "public" : "private",
    time_limit_sec: tl > 0 ? Math.min(3600, tl) : null,
    points_per_q: Math.max(10, Math.min(200, parseInt(b.pointsPerQ) || 100)),
    pass_pct: Math.max(0, Math.min(100, b.passPct === "" || b.passPct == null ? 60 : parseInt(b.passPct))),
  };
}

r.get("/mine/list", need("teacher"), (req, res) => {
  const rows = db.prepare("SELECT * FROM games WHERE owner_id = ? ORDER BY updated_at DESC").all(req.user.id);
  res.json({ games: rows.map((g) => ({ ...gameRow(g), assigned: db.prepare("SELECT COUNT(*) n FROM assignments WHERE kind='game' AND ref_id=?").get(g.id).n })) });
});

r.get("/:id/edit", need("teacher"), (req, res) => {
  const g = db.prepare("SELECT * FROM games WHERE id = ?").get(req.params.id);
  if (!canEdit(g, req.user)) return res.status(404).json({ error: "ไม่พบเกมนี้" });
  const versions = db.prepare("SELECT version, note, created_at FROM game_versions WHERE game_id = ? ORDER BY version DESC").all(g.id);
  const cat = g.category_id ? db.prepare("SELECT slug FROM categories WHERE id=?").get(g.category_id)?.slug : "";
  res.json({ game: { ...gameRow(g), categorySlug: cat || "" }, questions: J(g.questions, []), versions });
});

r.post("/", need("teacher"), (req, res) => {
  try {
    const b = req.body || {};
    if (!TEMPLATES.includes(b.template)) throw new Error("กรุณาเลือกชนิดเกม");
    const m = readMeta(b);
    if (!m.title) throw new Error("กรุณาใส่ชื่อเกม");
    const qs = cleanQuestions(b.template, b.questions);
    const t = now();
    const info = db.prepare(`INSERT INTO games (owner_id,title,description,template,category_id,age_min,age_max,difficulty,visibility,status,time_limit_sec,points_per_q,pass_pct,questions,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,'draft',?,?,?,?,?,?)`).run(req.user.id, m.title, m.description, b.template, m.category_id, m.age_min, m.age_max, m.difficulty, m.visibility, m.time_limit_sec, m.points_per_q, m.pass_pct, JSON.stringify(qs), t, t);
    db.prepare("INSERT INTO game_versions (game_id,version,note,created_at) VALUES (?,?,?,?)").run(info.lastInsertRowid, 1, `สร้างเกม (${qs.length} ข้อ)`, t);
    res.json({ id: info.lastInsertRowid });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

r.put("/:id", need("teacher"), (req, res) => {
  try {
    const g = db.prepare("SELECT * FROM games WHERE id = ?").get(req.params.id);
    if (!canEdit(g, req.user)) return res.status(404).json({ error: "ไม่พบเกมนี้" });
    const m = readMeta(req.body || {});
    if (!m.title) throw new Error("กรุณาใส่ชื่อเกม");
    const qs = cleanQuestions(g.template, req.body.questions);
    const changes = [];
    if (m.title !== g.title) changes.push("ชื่อ");
    if (m.description !== g.description) changes.push("คำอธิบาย");
    if (JSON.stringify(qs) !== g.questions) changes.push(`คำถาม (${qs.length} ข้อ)`);
    if (m.time_limit_sec !== g.time_limit_sec || m.points_per_q !== g.points_per_q || m.pass_pct !== g.pass_pct) changes.push("เวลา/คะแนน");
    if (m.visibility !== g.visibility) changes.push(m.visibility === "public" ? "เปิดสาธารณะ" : "เปลี่ยนเป็นส่วนตัว");
    if (m.category_id !== g.category_id || m.age_min !== g.age_min || m.age_max !== g.age_max || m.difficulty !== g.difficulty) changes.push("หมวด/อายุ/ความยาก");
    const t = now();
    const v = changes.length ? g.version + 1 : g.version;
    db.prepare(`UPDATE games SET title=?,description=?,category_id=?,age_min=?,age_max=?,difficulty=?,visibility=?,time_limit_sec=?,points_per_q=?,pass_pct=?,questions=?,version=?,updated_at=? WHERE id=?`)
      .run(m.title, m.description, m.category_id, m.age_min, m.age_max, m.difficulty, m.visibility, m.time_limit_sec, m.points_per_q, m.pass_pct, JSON.stringify(qs), v, t, g.id);
    if (changes.length) db.prepare("INSERT INTO game_versions (game_id,version,note,created_at) VALUES (?,?,?,?)").run(g.id, v, "แก้ไข: " + changes.join(", "), t);
    res.json({ ok: true, version: v });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

r.post("/:id/status", need("teacher"), (req, res) => {
  const g = db.prepare("SELECT * FROM games WHERE id = ?").get(req.params.id);
  if (!canEdit(g, req.user)) return res.status(404).json({ error: "ไม่พบเกมนี้" });
  const st = req.body.status === "published" ? "published" : "draft";
  const v = g.version + 1;
  db.prepare("UPDATE games SET status=?, version=?, updated_at=? WHERE id=?").run(st, v, now(), g.id);
  db.prepare("INSERT INTO game_versions (game_id,version,note,created_at) VALUES (?,?,?,?)").run(g.id, v, st === "published" ? "เผยแพร่" : "ยกเลิกเผยแพร่", now());
  res.json({ ok: true });
});

r.post("/:id/duplicate", need("teacher"), (req, res) => {
  const g = db.prepare("SELECT * FROM games WHERE id = ?").get(req.params.id);
  if (!g || !(canEdit(g, req.user) || (g.status === "published" && g.visibility === "public"))) return res.status(404).json({ error: "ไม่พบเกมนี้" });
  const t = now();
  const info = db.prepare(`INSERT INTO games (owner_id,title,description,template,category_id,age_min,age_max,difficulty,visibility,status,time_limit_sec,points_per_q,pass_pct,questions,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,'private','draft',?,?,?,?,?,?)`).run(req.user.id, g.title + " (สำเนา)", g.description, g.template, g.category_id, g.age_min, g.age_max, g.difficulty, g.time_limit_sec, g.points_per_q, g.pass_pct, g.questions, t, t);
  db.prepare("INSERT INTO game_versions (game_id,version,note,created_at) VALUES (?,?,?,?)").run(info.lastInsertRowid, 1, `ทำสำเนาจาก “${g.title}”`, t);
  res.json({ id: info.lastInsertRowid });
});

r.delete("/:id", need("teacher"), (req, res) => {
  const g = db.prepare("SELECT * FROM games WHERE id = ?").get(req.params.id);
  if (!canEdit(g, req.user)) return res.status(404).json({ error: "ไม่พบเกมนี้" });
  db.prepare("DELETE FROM assignments WHERE kind='game' AND ref_id=?").run(g.id);
  db.prepare("DELETE FROM games WHERE id = ?").run(g.id);
  res.json({ ok: true });
});

module.exports = { router: r, gameRow, canPlay, TEMPLATE_TH, assignedTo, cleanQuestions };
