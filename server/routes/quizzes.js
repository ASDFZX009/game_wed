// แบบทดสอบ: คลัง ทำแบบทดสอบ ตรวจ ให้คะแนนข้ออัตนัย และตัวสร้างของครู
const express = require("express");
const { db, now, J } = require("../db");
const { need } = require("../auth");
const U = require("../util");
const { assignedTo } = require("./games");

const r = express.Router();
const TYPES = ["mcq", "truefalse", "short", "fill", "match", "order", "essay", "multi", "numeric", "wordbank"];
const TYPE_TH = {
  mcq: "ปรนัย", truefalse: "ถูก/ผิด", short: "คำตอบสั้น", fill: "เติมคำ", match: "จับคู่", order: "เรียงลำดับ",
  essay: "อัตนัย (ครูตรวจ)", multi: "เลือกได้หลายข้อ", numeric: "ตอบเป็นตัวเลข", wordbank: "เติมคำจากคลังคำ",
};

function quizRow(q) {
  const qs = J(q.questions, []);
  return {
    id: q.id, title: q.title, description: q.description, grade: q.grade, difficulty: q.difficulty,
    timeLimitMin: q.time_limit_min, visibility: q.visibility, status: q.status, showAnswers: q.show_answers,
    shuffleQuestions: !!q.shuffle_questions, shuffleOptions: !!q.shuffle_options,
    questionCount: qs.length, totalPoints: qs.reduce((s, x) => s + (Number(x.points) || 1), 0),
    hasEssay: qs.some((x) => x.type === "essay"), ownerId: q.owner_id, createdAt: q.created_at, updatedAt: q.updated_at,
  };
}
function canTake(q, user) {
  if (!q || !user) return false;
  if (user.role === "admin" || user.id === q.owner_id) return true;
  if (q.status !== "published") return false;
  return q.visibility === "public" || !!assignedTo(user.id, "quiz", q.id);
}
const canEdit = (q, user) => q && user && (user.role === "admin" || user.id === q.owner_id);
const attemptCount = (id) => db.prepare("SELECT COUNT(*) n FROM quiz_attempts WHERE quiz_id = ?").get(id).n;

r.get("/", (req, res) => {
  const q = String(req.query.q || "");
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const args = q ? [`%${q}%`, `%${q}%`] : [];
  const where = `status='published' AND visibility='public'` + (q ? " AND (title LIKE ? OR description LIKE ?)" : "");
  const total = db.prepare(`SELECT COUNT(*) n FROM quizzes WHERE ${where}`).get(...args).n;
  const rows = db.prepare(`SELECT * FROM quizzes WHERE ${where} ORDER BY created_at DESC, id DESC LIMIT 12 OFFSET ?`).all(...args, (page - 1) * 12);
  res.json({ quizzes: rows.map(quizRow), total, page, pages: Math.max(1, Math.ceil(total / 12)) });
});

// คำถามสำหรับผู้ทำ (ไม่มีเฉลย)
function forTaking(q) {
  const qs = J(q.questions, []);
  let list = qs.map((x, i) => {
    const base = { index: i, type: x.type, prompt: x.prompt, points: Number(x.points) || 1, image: x.image || null };
    const opts = (arr) => arr.map((t, k) => ({ k, t }));
    switch (x.type) {
      case "mcq": case "multi": {
        let o = opts(x.options || []);
        if (q.shuffle_options) o = U.shuffle(o);
        return { ...base, options: o };
      }
      case "fill": return { ...base, blanks: (x.blanks || []).length };
      case "wordbank": return { ...base, blanks: (x.blanks || []).length, bank: U.shuffle([...(x.blanks || []), ...(x.distractors || [])]) };
      case "match": return { ...base, left: (x.pairs || []).map((p) => p[0]), right: U.shuffle((x.pairs || []).map((p) => p[1])) };
      case "order": return { ...base, items: U.shuffleDifferent(x.items || []) };
      case "numeric": return { ...base, unit: x.unit || "" };
      default: return base;
    }
  });
  if (q.shuffle_questions) list = U.shuffle(list);
  return list;
}

r.get("/:id", (req, res) => {
  const q = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(req.params.id);
  const visible = q && (q.status === "published" && q.visibility === "public" || canTake(q, req.user));
  if (!visible) return res.status(404).json({ error: "ไม่พบแบบทดสอบนี้" });
  const out = { quiz: quizRow(q), canTake: canTake(q, req.user) };
  if (out.canTake && req.query.start) out.questions = forTaking(q);
  if (req.user) out.lastAttempt = db.prepare("SELECT id, score, max_score, status, submitted_at FROM quiz_attempts WHERE quiz_id=? AND user_id=? ORDER BY id DESC LIMIT 1").get(q.id, req.user.id) || null;
  res.json(out);
});

function attemptView(a, q, forTeacher) {
  const qs = J(q.questions, []);
  const ans = J(a.answers, {});
  const res = J(a.results, {});
  const show = forTeacher || q.show_answers === "after_submit";
  return {
    id: a.id, quizId: q.id, quizTitle: q.title, score: a.score, max: a.max_score, status: a.status, submittedAt: a.submitted_at,
    items: qs.map((x, i) => ({
      index: i, type: x.type, typeName: TYPE_TH[x.type], prompt: x.prompt, points: Number(x.points) || 1,
      given: displayAnswer(x, ans[i]), result: res[i] || null,
      answer: show && x.type !== "essay" ? U.answerText(x) : null, explain: show ? x.explain || null : null,
    })),
  };
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

r.post("/:id/submit", need(), (req, res) => {
  const q = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(req.params.id);
  if (!canTake(q, req.user)) return res.status(404).json({ error: "ไม่พบแบบทดสอบนี้" });
  const qs = J(q.questions, []);
  const answers = req.body.answers && typeof req.body.answers === "object" ? req.body.answers : {};
  const results = {};
  let score = 0, max = 0, pending = false;
  qs.forEach((x, i) => {
    const g = U.gradeQuestion(x, answers[i]);
    max += g.max;
    if (g.correct === null) { pending = true; results[i] = { correct: null, points: null }; }
    else { score += g.points; results[i] = { correct: g.correct, points: g.points }; }
  });
  let assignmentId = null;
  if (req.body.assignmentId) {
    const a = db.prepare(`SELECT a.id FROM assignments a JOIN class_members m ON m.class_id=a.class_id WHERE a.id=? AND m.user_id=? AND a.kind='quiz' AND a.ref_id=?`).get(req.body.assignmentId, req.user.id, q.id);
    assignmentId = a ? a.id : null;
  }
  const t = now();
  const started = typeof req.body.startedAt === "string" && !isNaN(Date.parse(req.body.startedAt)) ? new Date(req.body.startedAt).toISOString() : t;
  const info = db.prepare(`INSERT INTO quiz_attempts (quiz_id,user_id,assignment_id,answers,results,score,max_score,status,started_at,submitted_at) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(q.id, req.user.id, assignmentId, JSON.stringify(answers), JSON.stringify(results), score, max, pending ? "pending_review" : "graded", started, t);
  const xp = Math.round((score / Math.max(1, max)) * 20);
  U.addXP(req.user.id, xp, "quiz", q.title);
  require("../shop").addCoins(req.user.id, xp, "quiz", q.title);
  const newBadges = U.checkBadges(req.user.id, { perfect: !pending && max > 0 && score >= max });
  const a = db.prepare("SELECT * FROM quiz_attempts WHERE id = ?").get(info.lastInsertRowid);
  res.json({ attempt: attemptView(a, q, false), xp, coins: xp, newBadges, pending });
});

r.get("/attempt/:aid", need(), (req, res) => {
  const a = db.prepare("SELECT * FROM quiz_attempts WHERE id = ?").get(req.params.aid);
  const q = a && db.prepare("SELECT * FROM quizzes WHERE id = ?").get(a.quiz_id);
  if (!a || !q) return res.status(404).json({ error: "ไม่พบผลการทำ" });
  const teacher = canEdit(q, req.user);
  if (!teacher && a.user_id !== req.user.id) return res.status(404).json({ error: "ไม่พบผลการทำ" });
  const v = attemptView(a, q, teacher);
  v.student = db.prepare("SELECT display_name FROM users WHERE id=?").get(a.user_id)?.display_name;
  res.json({ attempt: v });
});

// ---------- ครู ----------
function cleanQuiz(qs) {
  if (!Array.isArray(qs) || !qs.length) throw new Error("ต้องมีคำถามอย่างน้อย 1 ข้อ");
  if (qs.length > 100) throw new Error("มีคำถามได้ไม่เกิน 100 ข้อ");
  const s = (v, n = 500) => String(v ?? "").trim().slice(0, n);
  const list = (a, n = 150) => (Array.isArray(a) ? a : []).map((x) => s(x, n)).filter(Boolean);
  return qs.map((x, i) => {
    const n = `ข้อ ${i + 1}: `;
    if (!TYPES.includes(x.type)) throw new Error(n + "ชนิดคำถามไม่ถูกต้อง");
    if (!s(x.prompt)) throw new Error(n + "ยังไม่ได้ใส่โจทย์");
    const base = { type: x.type, prompt: s(x.prompt, 1000), points: Math.max(1, Math.min(100, parseInt(x.points) || 1)), explain: s(x.explain) || undefined };
    switch (x.type) {
      case "mcq": {
        const options = list(x.options);
        if (options.length < 2) throw new Error(n + "ต้องมีตัวเลือกอย่างน้อย 2 ตัว");
        return { ...base, options, answer: Math.min(Math.max(0, parseInt(x.answer) || 0), options.length - 1) };
      }
      case "multi": {
        const options = list(x.options);
        if (options.length < 2) throw new Error(n + "ต้องมีตัวเลือกอย่างน้อย 2 ตัว");
        const answers = [...new Set((x.answers || []).map(Number).filter((k) => k >= 0 && k < options.length))];
        if (!answers.length) throw new Error(n + "ต้องเลือกคำตอบที่ถูกอย่างน้อย 1 ตัว");
        return { ...base, options, answers };
      }
      case "truefalse": return { ...base, answer: x.answer === true || x.answer === "true" };
      case "short": {
        const accepted = list(x.accepted);
        if (!accepted.length) throw new Error(n + "ต้องมีคำตอบที่ยอมรับอย่างน้อย 1 คำ");
        return { ...base, accepted };
      }
      case "numeric": {
        const v = Number(x.answer);
        if (!Number.isFinite(v)) throw new Error(n + "คำตอบต้องเป็นตัวเลข");
        return { ...base, answer: v, tolerance: Math.abs(Number(x.tolerance) || 0), unit: s(x.unit, 20) || undefined };
      }
      case "fill": case "wordbank": {
        const holes = (base.prompt.match(/___/g) || []).length;
        const blanks = list(x.blanks);
        if (!holes) throw new Error(n + "โจทย์ต้องมี ___ แทนช่องว่าง");
        if (blanks.length !== holes) throw new Error(n + `มีช่องว่าง ${holes} ช่อง แต่ใส่เฉลย ${blanks.length} ช่อง`);
        return x.type === "fill" ? { ...base, blanks } : { ...base, blanks, distractors: list(x.distractors) };
      }
      case "match": {
        const pairs = (x.pairs || []).map((p) => [s(p?.[0], 100), s(p?.[1], 100)]).filter((p) => p[0] && p[1]);
        if (pairs.length < 2) throw new Error(n + "ต้องมีอย่างน้อย 2 คู่");
        return { ...base, pairs };
      }
      case "order": {
        const items = list(x.items);
        if (items.length < 2) throw new Error(n + "ต้องมีอย่างน้อย 2 รายการ");
        return { ...base, items };
      }
      case "essay": return base;
    }
  });
}
function quizMeta(b) {
  const tl = parseInt(b.timeLimitMin);
  return {
    title: String(b.title || "").trim().slice(0, 120), description: String(b.description || "").trim().slice(0, 500),
    grade: String(b.grade || "").trim().slice(0, 20) || null,
    difficulty: ["easy", "medium", "hard"].includes(b.difficulty) ? b.difficulty : "easy",
    time_limit_min: tl > 0 ? Math.min(300, tl) : null, visibility: b.visibility === "public" ? "public" : "private",
    show_answers: b.showAnswers === "never" ? "never" : "after_submit",
    shuffle_questions: b.shuffleQuestions ? 1 : 0, shuffle_options: b.shuffleOptions ? 1 : 0,
  };
}

r.get("/mine/list", need("teacher"), (req, res) => {
  const rows = db.prepare("SELECT * FROM quizzes WHERE owner_id = ? ORDER BY updated_at DESC").all(req.user.id);
  res.json({ quizzes: rows.map((q) => ({ ...quizRow(q), attempts: attemptCount(q.id) })) });
});
r.get("/:id/edit", need("teacher"), (req, res) => {
  const q = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(req.params.id);
  if (!canEdit(q, req.user)) return res.status(404).json({ error: "ไม่พบแบบทดสอบนี้" });
  res.json({ quiz: quizRow(q), questions: J(q.questions, []), attempts: attemptCount(q.id), types: TYPE_TH });
});
r.post("/", need("teacher"), (req, res) => {
  try {
    const m = quizMeta(req.body || {});
    if (!m.title) throw new Error("กรุณาใส่ชื่อแบบทดสอบ");
    const qs = cleanQuiz(req.body.questions);
    const t = now();
    const info = db.prepare(`INSERT INTO quizzes (owner_id,title,description,grade,difficulty,time_limit_min,visibility,status,show_answers,shuffle_questions,shuffle_options,questions,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,'draft',?,?,?,?,?,?)`).run(req.user.id, m.title, m.description, m.grade, m.difficulty, m.time_limit_min, m.visibility, m.show_answers, m.shuffle_questions, m.shuffle_options, JSON.stringify(qs), t, t);
    res.json({ id: info.lastInsertRowid });
  } catch (e) { res.status(400).json({ error: e.message }); }
});
r.put("/:id", need("teacher"), (req, res) => {
  try {
    const q = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(req.params.id);
    if (!canEdit(q, req.user)) return res.status(404).json({ error: "ไม่พบแบบทดสอบนี้" });
    const m = quizMeta(req.body || {});
    if (!m.title) throw new Error("กรุณาใส่ชื่อแบบทดสอบ");
    let qs = q.questions;
    if (attemptCount(q.id) === 0) qs = JSON.stringify(cleanQuiz(req.body.questions));
    db.prepare(`UPDATE quizzes SET title=?,description=?,grade=?,difficulty=?,time_limit_min=?,visibility=?,show_answers=?,shuffle_questions=?,shuffle_options=?,questions=?,updated_at=? WHERE id=?`)
      .run(m.title, m.description, m.grade, m.difficulty, m.time_limit_min, m.visibility, m.show_answers, m.shuffle_questions, m.shuffle_options, qs, now(), q.id);
    res.json({ ok: true, questionsLocked: attemptCount(q.id) > 0 });
  } catch (e) { res.status(400).json({ error: e.message }); }
});
r.post("/:id/status", need("teacher"), (req, res) => {
  const q = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(req.params.id);
  if (!canEdit(q, req.user)) return res.status(404).json({ error: "ไม่พบแบบทดสอบนี้" });
  db.prepare("UPDATE quizzes SET status=?, updated_at=? WHERE id=?").run(req.body.status === "published" ? "published" : "draft", now(), q.id);
  res.json({ ok: true });
});
r.post("/:id/duplicate", need("teacher"), (req, res) => {
  const q = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(req.params.id);
  if (!q || !(canEdit(q, req.user) || (q.status === "published" && q.visibility === "public"))) return res.status(404).json({ error: "ไม่พบแบบทดสอบนี้" });
  const t = now();
  const info = db.prepare(`INSERT INTO quizzes (owner_id,title,description,grade,difficulty,time_limit_min,visibility,status,show_answers,shuffle_questions,shuffle_options,questions,created_at,updated_at)
    VALUES (?,?,?,?,?,?,'private','draft',?,?,?,?,?,?)`).run(req.user.id, q.title + " (สำเนา)", q.description, q.grade, q.difficulty, q.time_limit_min, q.show_answers, q.shuffle_questions, q.shuffle_options, q.questions, t, t);
  res.json({ id: info.lastInsertRowid });
});
r.delete("/:id", need("teacher"), (req, res) => {
  const q = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(req.params.id);
  if (!canEdit(q, req.user)) return res.status(404).json({ error: "ไม่พบแบบทดสอบนี้" });
  db.prepare("DELETE FROM assignments WHERE kind='quiz' AND ref_id=?").run(q.id);
  db.prepare("DELETE FROM quizzes WHERE id = ?").run(q.id);
  res.json({ ok: true });
});

function resultsData(q) {
  const qs = J(q.questions, []);
  const attempts = db.prepare(`SELECT a.*, u.display_name FROM quiz_attempts a JOIN users u ON u.id=a.user_id WHERE a.quiz_id=? ORDER BY a.submitted_at DESC`).all(q.id);
  const pending = [];
  attempts.forEach((a) => {
    const res = J(a.results, {}), ans = J(a.answers, {});
    qs.forEach((x, i) => {
      if (x.type === "essay" && res[i] && res[i].correct === null)
        pending.push({ attemptId: a.id, index: i, student: a.display_name, prompt: x.prompt, answer: ans[i] || "", max: Number(x.points) || 1 });
    });
  });
  // วิเคราะห์ความยากจากสถิติจริง (ต้องมีผู้ส่งอย่างน้อย 5 คน)
  let analysis = null;
  if (attempts.length >= 5) {
    analysis = qs.map((x, i) => {
      const graded = attempts.map((a) => J(a.results, {})[i]).filter((r) => r && r.correct !== null);
      const rate = graded.length ? graded.filter((r) => r.points >= (Number(x.points) || 1)).length / graded.length : null;
      let tip = "";
      if (rate !== null && rate < 0.3) tip = "ข้อนี้ยากเกินไป ลองทบทวนโจทย์หรือสอนเพิ่ม";
      else if (rate !== null && rate > 0.9) tip = "ข้อนี้ง่ายมาก อาจเพิ่มความท้าทาย";
      return { index: i, prompt: x.prompt, rate, tip };
    });
  }
  const scored = attempts.filter((a) => a.max_score > 0);
  return {
    quiz: quizRow(q), pending, analysis,
    count: attempts.length,
    avgPct: scored.length ? scored.reduce((s, a) => s + a.score / a.max_score, 0) / scored.length * 100 : null,
    attempts: attempts.map((a) => ({ id: a.id, student: a.display_name, score: a.score, max: a.max_score, status: a.status, submittedAt: a.submitted_at })),
  };
}
r.get("/:id/results", need("teacher"), (req, res) => {
  const q = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(req.params.id);
  if (!canEdit(q, req.user)) return res.status(404).json({ error: "ไม่พบแบบทดสอบนี้" });
  res.json(resultsData(q));
});
r.get("/:id/results.csv", need("teacher"), (req, res) => {
  const q = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(req.params.id);
  if (!canEdit(q, req.user)) return res.status(404).end();
  const d = resultsData(q);
  const rows = [["นักเรียน", "คะแนน", "เต็ม", "ร้อยละ", "สถานะ", "ส่งเมื่อ"]];
  d.attempts.forEach((a) => rows.push([a.student, a.score, a.max, a.max ? Math.round((a.score / a.max) * 100) : "", a.status === "pending_review" ? "รอครูตรวจ" : "ตรวจแล้ว", U.fmtTH(a.submittedAt)]));
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="quiz-${q.id}-results.csv"`);
  res.send(U.csv(rows));
});

r.post("/attempt/:aid/grade", need("teacher"), (req, res) => {
  const a = db.prepare("SELECT * FROM quiz_attempts WHERE id = ?").get(req.params.aid);
  const q = a && db.prepare("SELECT * FROM quizzes WHERE id = ?").get(a.quiz_id);
  if (!a || !canEdit(q, req.user)) return res.status(404).json({ error: "ไม่พบผลการทำ" });
  const qs = J(q.questions, []);
  const i = parseInt(req.body.index);
  const x = qs[i];
  if (!x || x.type !== "essay") return res.status(400).json({ error: "ข้อนี้ไม่ใช่ข้ออัตนัย" });
  const max = Number(x.points) || 1;
  const pts = Number(req.body.points);
  if (!Number.isFinite(pts) || pts < 0 || pts > max) return res.status(400).json({ error: `คะแนนต้องอยู่ระหว่าง 0–${max}` });
  const results = J(a.results, {});
  const before = results[i]?.points || 0;
  results[i] = { correct: pts >= max, points: pts, comment: String(req.body.comment || "").slice(0, 500) || undefined };
  const score = a.score - before + pts;
  const stillPending = qs.some((y, k) => y.type === "essay" && (!results[k] || results[k].correct === null));
  db.prepare("UPDATE quiz_attempts SET results=?, score=?, status=? WHERE id=?").run(JSON.stringify(results), score, stillPending ? "pending_review" : "graded", a.id);
  if (!stillPending) U.checkBadges(a.user_id, { perfect: score >= a.max_score });
  res.json({ ok: true, score, status: stillPending ? "pending_review" : "graded" });
});

module.exports = { router: r, quizRow, TYPE_TH, canTake, cleanQuiz };
