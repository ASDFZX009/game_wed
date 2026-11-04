// ห้องเรียน งานที่มอบหมาย รายงาน แดชบอร์ดนักเรียน/ครู
const express = require("express");
const { db, now, J } = require("../db");
const { need } = require("../auth");
const U = require("../util");
const { gameRow } = require("./games");
const { quizRow } = require("./quizzes");

const r = express.Router();

// แปลง "YYYY-MM-DDTHH:mm" (เวลาตามเขตเวลาของแอป) → ISO UTC
function zonedToUtc(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(String(s || ""));
  if (!m) return null;
  const asUtc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: U.TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
    .formatToParts(new Date(asUtc)).map((p) => [p.type, p.value]));
  const shown = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return new Date(asUtc - (shown - asUtc)).toISOString();
}

const myClass = (id, user) => {
  const c = db.prepare("SELECT * FROM classes WHERE id = ?").get(id);
  return c && (c.teacher_id === user.id || user.role === "admin") ? c : null;
};
const isMember = (classId, userId) => !!db.prepare("SELECT 1 FROM class_members WHERE class_id=? AND user_id=?").get(classId, userId);
const members = (classId) => db.prepare(`SELECT u.id, u.display_name, u.email FROM class_members m JOIN users u ON u.id=m.user_id WHERE m.class_id=? ORDER BY u.display_name COLLATE NOCASE`).all(classId);

/** ผลของนักเรียน 1 คนในงาน 1 ชิ้น (ใช้ครั้งล่าสุด) → { status, pct, at, attempts } */
function resultFor(a, userId) {
  if (a.kind === "game") {
    const rows = db.prepare(`SELECT * FROM game_plays WHERE user_id=? AND game_id=? AND (assignment_id=? OR (assignment_id IS NULL AND created_at>=?)) ORDER BY id DESC`).all(userId, a.ref_id, a.id, a.open_at);
    if (!rows.length) return { status: "todo", pct: null, at: null, attempts: 0 };
    const r0 = rows[0];
    return { status: "done", pct: r0.max_score ? (r0.score / r0.max_score) * 100 : 0, at: r0.created_at, attempts: rows.length };
  }
  const rows = db.prepare(`SELECT * FROM quiz_attempts WHERE user_id=? AND quiz_id=? AND (assignment_id=? OR (assignment_id IS NULL AND submitted_at>=?)) ORDER BY id DESC`).all(userId, a.ref_id, a.id, a.open_at);
  if (!rows.length) return { status: "todo", pct: null, at: null, attempts: 0 };
  const r0 = rows[0];
  return { status: r0.status === "pending_review" ? "pending" : "done", pct: r0.max_score ? (r0.score / r0.max_score) * 100 : 0, at: r0.submitted_at, attempts: rows.length, attemptId: r0.id };
}
function assignmentInfo(a) {
  const ref = a.kind === "game" ? db.prepare("SELECT title FROM games WHERE id=?").get(a.ref_id) : db.prepare("SELECT title FROM quizzes WHERE id=?").get(a.ref_id);
  return { id: a.id, classId: a.class_id, kind: a.kind, refId: a.ref_id, title: a.title, refTitle: ref?.title || "(ถูกลบแล้ว)", openAt: a.open_at, dueAt: a.due_at, createdAt: a.created_at };
}

/** สถิติห้อง — ใช้สูตรเดียวกันทุกที่: คะแนนเฉลี่ย = ค่าเฉลี่ยร้อยละของทุกการส่งงาน (ครั้งล่าสุดของแต่ละคนในแต่ละงาน) */
function classStats(c) {
  const mem = members(c.id);
  const asg = db.prepare("SELECT * FROM assignments WHERE class_id=?").all(c.id);
  let done = 0, sum = 0, cnt = 0;
  asg.forEach((a) => mem.forEach((m) => {
    const r0 = resultFor(a, m.id);
    if (r0.status !== "todo") { done++; sum += r0.pct; cnt++; }
  }));
  const slots = asg.length * mem.length;
  return { students: mem.length, assignments: asg.length, submitted: done, slots, submitRate: slots ? (done / slots) * 100 : null, avgPct: cnt ? sum / cnt : null, sumPct: sum, cntPct: cnt };
}

// ---------- ครู: ห้องเรียน ----------
r.get("/", need(), (req, res) => {
  if (req.user.role === "student") {
    const rows = db.prepare(`SELECT c.*, u.display_name teacher FROM class_members m JOIN classes c ON c.id=m.class_id JOIN users u ON u.id=c.teacher_id WHERE m.user_id=? ORDER BY c.name`).all(req.user.id);
    return res.json({ classes: rows.map((c) => {
      const asg = db.prepare("SELECT * FROM assignments WHERE class_id=? AND open_at<=?").all(c.id, now());
      const todo = asg.filter((a) => resultFor(a, req.user.id).status === "todo").length;
      return { id: c.id, name: c.name, grade: c.grade, teacher: c.teacher, todo };
    }) });
  }
  const rows = db.prepare("SELECT * FROM classes WHERE teacher_id=? ORDER BY created_at DESC").all(req.user.id);
  res.json({ classes: rows.map((c) => ({ id: c.id, name: c.name, grade: c.grade, code: c.code, ...classStats(c) })) });
});

r.post("/", need("teacher"), (req, res) => {
  const name = String(req.body.name || "").trim().slice(0, 80);
  if (!name) return res.status(400).json({ error: "กรุณาใส่ชื่อห้องเรียน" });
  let code; do code = U.code6(); while (db.prepare("SELECT 1 FROM classes WHERE code=?").get(code));
  const info = db.prepare("INSERT INTO classes (teacher_id,name,grade,code,created_at) VALUES (?,?,?,?,?)").run(req.user.id, name, String(req.body.grade || "").trim().slice(0, 20) || null, code, now());
  res.json({ id: info.lastInsertRowid });
});

r.post("/join", need(), (req, res) => {
  const c = db.prepare("SELECT * FROM classes WHERE code = ?").get(String(req.body.code || "").trim().toUpperCase());
  if (!c) return res.status(404).json({ error: "ไม่พบห้องเรียนที่ใช้รหัสนี้" });
  if (c.teacher_id === req.user.id) return res.status(400).json({ error: "คุณเป็นครูของห้องนี้อยู่แล้ว" });
  db.prepare("INSERT OR IGNORE INTO class_members (class_id,user_id,joined_at) VALUES (?,?,?)").run(c.id, req.user.id, now());
  res.json({ id: c.id });
});

r.get("/:id", need(), (req, res) => {
  const c = db.prepare("SELECT c.*, u.display_name teacher FROM classes c JOIN users u ON u.id=c.teacher_id WHERE c.id=?").get(req.params.id);
  if (!c) return res.status(404).json({ error: "ไม่พบห้องเรียน" });
  const teacherView = c.teacher_id === req.user.id || req.user.role === "admin";
  if (!teacherView && !isMember(c.id, req.user.id)) return res.status(404).json({ error: "ไม่พบห้องเรียน" });
  const asg = db.prepare("SELECT * FROM assignments WHERE class_id=? ORDER BY COALESCE(due_at, '9999') , id").all(c.id);
  const mem = members(c.id);
  // อันดับ: รวมร้อยละของงานทุกชิ้น
  const board = mem.map((m) => ({ id: m.id, name: m.display_name, total: Math.round(asg.reduce((s, a) => s + (resultFor(a, m.id).pct || 0), 0)) }))
    .sort((a, b) => b.total - a.total);
  let rank = 0, prev = null;
  board.forEach((b, i) => { if (b.total !== prev) { rank = i + 1; prev = b.total; } b.rank = rank; });
  const out = { id: c.id, name: c.name, grade: c.grade, teacher: c.teacher, showLeaderboard: !!c.show_leaderboard, teacherView };
  if (teacherView) {
    Object.assign(out, {
      code: c.code, members: mem.map((m) => ({ id: m.id, name: m.display_name, email: m.email })),
      assignments: asg.map((a) => ({ ...assignmentInfo(a), submitted: mem.filter((m) => resultFor(a, m.id).status !== "todo").length, total: mem.length })),
      grid: mem.map((m) => ({ id: m.id, name: m.display_name, cells: asg.map((a) => { const r0 = resultFor(a, m.id); return r0.status === "todo" ? null : Math.round(r0.pct); }) })),
      leaderboard: board, stats: classStats(c),
    });
  } else {
    const visible = asg.filter((a) => a.open_at <= now());
    Object.assign(out, {
      assignments: visible.map((a) => ({ ...assignmentInfo(a), mine: resultFor(a, req.user.id) })),
      leaderboard: c.show_leaderboard ? board.map((b) => ({ rank: b.rank, name: b.name, total: b.total, me: b.id === req.user.id })) : null,
    });
  }
  res.json(out);
});

r.patch("/:id", need("teacher"), (req, res) => {
  const c = myClass(req.params.id, req.user);
  if (!c) return res.status(404).json({ error: "ไม่พบห้องเรียน" });
  const name = req.body.name !== undefined ? String(req.body.name).trim().slice(0, 80) : c.name;
  if (!name) return res.status(400).json({ error: "กรุณาใส่ชื่อห้องเรียน" });
  const show = req.body.showLeaderboard !== undefined ? (req.body.showLeaderboard ? 1 : 0) : c.show_leaderboard;
  db.prepare("UPDATE classes SET name=?, show_leaderboard=? WHERE id=?").run(name, show, c.id);
  res.json({ ok: true });
});
r.post("/:id/code", need("teacher"), (req, res) => {
  const c = myClass(req.params.id, req.user);
  if (!c) return res.status(404).json({ error: "ไม่พบห้องเรียน" });
  let code; do code = U.code6(); while (db.prepare("SELECT 1 FROM classes WHERE code=?").get(code));
  db.prepare("UPDATE classes SET code=? WHERE id=?").run(code, c.id);
  res.json({ code });
});
r.delete("/:id", need("teacher"), (req, res) => {
  const c = myClass(req.params.id, req.user);
  if (!c) return res.status(404).json({ error: "ไม่พบห้องเรียน" });
  db.prepare("DELETE FROM classes WHERE id=?").run(c.id);
  res.json({ ok: true });
});
r.post("/:id/members", need("teacher"), (req, res) => {
  const c = myClass(req.params.id, req.user);
  if (!c) return res.status(404).json({ error: "ไม่พบห้องเรียน" });
  const u = db.prepare("SELECT id, role FROM users WHERE email=?").get(String(req.body.email || "").trim());
  if (!u) return res.status(404).json({ error: "ไม่พบบัญชีที่ใช้อีเมลนี้ (นักเรียนต้องสมัครสมาชิกก่อน)" });
  db.prepare("INSERT OR IGNORE INTO class_members (class_id,user_id,joined_at) VALUES (?,?,?)").run(c.id, u.id, now());
  res.json({ ok: true });
});
r.delete("/:id/members/:uid", need(), (req, res) => {
  const self = +req.params.uid === req.user.id;
  const c = self ? db.prepare("SELECT * FROM classes WHERE id=?").get(req.params.id) : myClass(req.params.id, req.user);
  if (!c) return res.status(404).json({ error: "ไม่พบห้องเรียน" });
  db.prepare("DELETE FROM class_members WHERE class_id=? AND user_id=?").run(c.id, req.params.uid);
  res.json({ ok: true });
});

// ---------- งานที่มอบหมาย ----------
r.post("/:id/assignments", need("teacher"), (req, res) => {
  const c = myClass(req.params.id, req.user);
  if (!c) return res.status(404).json({ error: "ไม่พบห้องเรียน" });
  const kind = req.body.kind === "game" ? "game" : "quiz";
  const ref = kind === "game"
    ? db.prepare("SELECT * FROM games WHERE id=? AND status='published' AND (owner_id=? OR visibility='public')").get(req.body.refId, req.user.id)
    : db.prepare("SELECT * FROM quizzes WHERE id=? AND status='published' AND (owner_id=? OR visibility='public')").get(req.body.refId, req.user.id);
  if (!ref) return res.status(400).json({ error: kind === "game" ? "กรุณาเลือกเกมที่เผยแพร่แล้ว" : "กรุณาเลือกแบบทดสอบที่เผยแพร่แล้ว" });
  const openAt = req.body.openAt ? zonedToUtc(req.body.openAt) : now();
  const dueAt = req.body.dueAt ? zonedToUtc(req.body.dueAt) : null;
  if ((req.body.openAt && !openAt) || (req.body.dueAt && !dueAt)) return res.status(400).json({ error: "วันที่ไม่ถูกต้อง" });
  if (dueAt && dueAt <= openAt) return res.status(400).json({ error: "กำหนดส่งต้องอยู่หลังวันเปิดให้ทำ" });
  const title = String(req.body.title || "").trim().slice(0, 120) || ref.title;
  const info = db.prepare("INSERT INTO assignments (class_id,kind,ref_id,title,open_at,due_at,created_at) VALUES (?,?,?,?,?,?,?)").run(c.id, kind, ref.id, title, openAt, dueAt, now());
  res.json({ id: info.lastInsertRowid });
});

function assignmentReport(a) {
  const mem = members(a.class_id);
  const rows = mem.map((m) => {
    const r0 = resultFor(a, m.id);
    let status = r0.status;
    if (status === "todo" && a.kind === "quiz") status = "not_started";
    return { id: m.id, name: m.display_name, status, pct: r0.pct, at: r0.at, attempts: r0.attempts, attemptId: r0.attemptId || null };
  });
  const done = rows.filter((x) => x.status === "done" || x.status === "pending");
  const pcts = done.map((x) => x.pct);
  return {
    assignment: assignmentInfo(a), rows,
    stats: { submitted: done.length, total: rows.length, rate: rows.length ? (done.length / rows.length) * 100 : null,
      avg: pcts.length ? pcts.reduce((s, v) => s + v, 0) / pcts.length : null, min: pcts.length ? Math.min(...pcts) : null, max: pcts.length ? Math.max(...pcts) : null },
  };
}
const myAssignment = (id, user) => {
  const a = db.prepare("SELECT * FROM assignments WHERE id=?").get(id);
  return a && myClass(a.class_id, user) ? a : null;
};
r.get("/assignments/:aid", need("teacher"), (req, res) => {
  const a = myAssignment(req.params.aid, req.user);
  if (!a) return res.status(404).json({ error: "ไม่พบงานนี้" });
  const c = db.prepare("SELECT name FROM classes WHERE id=?").get(a.class_id);
  res.json({ ...assignmentReport(a), className: c.name });
});
r.get("/assignments/:aid/report.csv", need("teacher"), (req, res) => {
  const a = myAssignment(req.params.aid, req.user);
  if (!a) return res.status(404).end();
  const d = assignmentReport(a);
  const st = { done: "ส่งแล้ว", pending: "รอครูตรวจ", todo: "ยังไม่ส่ง", not_started: "ยังไม่เริ่ม" };
  const rows = [["นักเรียน", "สถานะ", "คะแนน (%)", "ส่งเมื่อ", "จำนวนครั้ง"]];
  d.rows.forEach((x) => rows.push([x.name, st[x.status], x.pct == null ? "" : Math.round(x.pct), U.fmtTH(x.at), x.attempts]));
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="assignment-${a.id}.csv"`);
  res.send(U.csv(rows));
});
r.delete("/assignments/:aid", need("teacher"), (req, res) => {
  const a = myAssignment(req.params.aid, req.user);
  if (!a) return res.status(404).json({ error: "ไม่พบงานนี้" });
  db.prepare("DELETE FROM assignments WHERE id=?").run(a.id);
  res.json({ ok: true });
});
r.get("/:id/report.csv", need("teacher"), (req, res) => {
  const c = myClass(req.params.id, req.user);
  if (!c) return res.status(404).end();
  const asg = db.prepare("SELECT * FROM assignments WHERE class_id=? ORDER BY id").all(c.id);
  const rows = [["นักเรียน", "อีเมล", ...asg.map((a) => a.title + " (%)")]];
  members(c.id).forEach((m) => rows.push([m.display_name, m.email, ...asg.map((a) => { const r0 = resultFor(a, m.id); return r0.status === "todo" ? "" : Math.round(r0.pct); })]));
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="class-${c.id}.csv"`);
  res.send(U.csv(rows));
});

// ---------- แดชบอร์ด ----------
const dashboard = express.Router();

dashboard.get("/student", need(), (req, res) => {
  const uid = req.user.id;
  const u = db.prepare("SELECT xp FROM users WHERE id=?").get(uid);
  const classes = db.prepare("SELECT class_id FROM class_members WHERE user_id=?").all(uid).map((r0) => r0.class_id);
  const todo = [];
  classes.forEach((cid) => {
    const cname = db.prepare("SELECT name FROM classes WHERE id=?").get(cid).name;
    db.prepare("SELECT * FROM assignments WHERE class_id=? AND open_at<=?").all(cid, now()).forEach((a) => {
      if (resultFor(a, uid).status === "todo") todo.push({ ...assignmentInfo(a), className: cname, overdue: !!(a.due_at && a.due_at < now()) });
    });
  });
  todo.sort((a, b) => (a.dueAt || "9999").localeCompare(b.dueAt || "9999"));
  const quizAgg = db.prepare("SELECT COUNT(*) n, AVG(score*1.0/max_score) avg FROM quiz_attempts WHERE user_id=? AND max_score>0").get(uid);
  const gameAgg = db.prepare("SELECT COUNT(*) n, MAX(score) best FROM game_plays WHERE user_id=?").get(uid);
  const plays = db.prepare(`SELECT p.*, g.title FROM game_plays p JOIN games g ON g.id=p.game_id WHERE p.user_id=? ORDER BY p.id DESC LIMIT 8`).all(uid)
    .map((p) => ({ kind: "game", title: p.title, refId: p.game_id, score: p.score, max: p.max_score, at: p.created_at }));
  const atts = db.prepare(`SELECT a.*, q.title FROM quiz_attempts a JOIN quizzes q ON q.id=a.quiz_id WHERE a.user_id=? ORDER BY a.id DESC LIMIT 8`).all(uid)
    .map((a) => ({ kind: "quiz", title: a.title, refId: a.quiz_id, attemptId: a.id, score: a.score, max: a.max_score, pending: a.status === "pending_review", at: a.submitted_at }));
  const recent = [...plays, ...atts].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
  const recentGames = db.prepare(`SELECT g.id, g.title, COUNT(*) n, MAX(p.id) last FROM game_plays p JOIN games g ON g.id=p.game_id WHERE p.user_id=? GROUP BY g.id ORDER BY last DESC LIMIT 6`).all(uid)
    .map((g) => ({ id: g.id, title: g.title, plays: g.n, last: db.prepare("SELECT score FROM game_plays WHERE id=?").get(g.last).score }));
  const have = Object.fromEntries(db.prepare("SELECT code, created_at FROM badges WHERE user_id=?").all(uid).map((b) => [b.code, b.created_at]));
  const days = U.lastNDays(7);
  const xpByDay = Object.fromEntries(days.map((d) => [d, 0]));
  db.prepare("SELECT xp, created_at FROM activity WHERE user_id=? AND created_at>=?").all(uid, new Date(Date.now() - 8 * 86400000).toISOString())
    .forEach((a) => { const k = U.dayKey(a.created_at); if (k in xpByDay) xpByDay[k] += a.xp; });
  res.json({
    xp: u.xp, level: U.levelOf(u.xp), xpPerLevel: U.XP_PER_LEVEL, streak: U.streakDays(uid),
    todo, stats: { quizzes: quizAgg.n, quizAvg: quizAgg.avg == null ? null : quizAgg.avg * 100, games: gameAgg.n, bestGame: gameAgg.best || 0 },
    recent, recentGames,
    badges: U.BADGES.map((b) => ({ ...b, earned: !!have[b.code], at: have[b.code] || null })),
    xpChart: days.map((d) => ({ day: d, xp: xpByDay[d] })),
    activity: db.prepare("SELECT kind, title, xp, created_at FROM activity WHERE user_id=? ORDER BY id DESC LIMIT 10").all(uid),
  });
});

dashboard.get("/profile", need(), (req, res) => {
  const uid = req.user.id;
  const plays = db.prepare(`SELECT p.score, p.max_score, p.created_at, g.title, g.id FROM game_plays p JOIN games g ON g.id=p.game_id WHERE p.user_id=? ORDER BY p.id DESC LIMIT 30`).all(uid);
  const quizzes = db.prepare(`SELECT a.id, a.score, a.max_score, a.status, a.submitted_at, q.title FROM quiz_attempts a JOIN quizzes q ON q.id=a.quiz_id WHERE a.user_id=? ORDER BY a.id DESC LIMIT 30`).all(uid);
  res.json({ plays, quizzes, badges: db.prepare("SELECT code FROM badges WHERE user_id=?").all(uid).map((b) => b.code) });
});

dashboard.get("/teacher", need("teacher"), (req, res) => {
  const uid = req.user.id;
  const cls = db.prepare("SELECT * FROM classes WHERE teacher_id=?").all(uid);
  const per = cls.map((c) => ({ id: c.id, name: c.name, ...classStats(c) }));
  const studentIds = new Set();
  cls.forEach((c) => members(c.id).forEach((m) => studentIds.add(m.id)));
  const sumPct = per.reduce((s, c) => s + c.sumPct, 0), cntPct = per.reduce((s, c) => s + c.cntPct, 0);
  const since = new Date(Date.now() - 90 * 86400000).toISOString();
  const myQuizIds = db.prepare("SELECT id FROM quizzes WHERE owner_id=?").all(uid).map((q) => q.id);
  const inQ = myQuizIds.length ? `(${myQuizIds.join(",")})` : "(NULL)";
  const subs90 = db.prepare(`SELECT COUNT(*) n FROM quiz_attempts WHERE quiz_id IN ${inQ} AND submitted_at>=?`).get(since).n;
  const pendingEssays = db.prepare(`SELECT COUNT(*) n FROM quiz_attempts WHERE quiz_id IN ${inQ} AND status='pending_review'`).get().n;
  const days = U.lastNDays(14);
  const byDay = Object.fromEntries(days.map((d) => [d, 0]));
  // นับการส่งงานด้วยกติกาเดียวกับรายงาน (รวมการทำที่ไม่ได้กดผ่านลิงก์งาน แต่ทำหลังเปิดงาน)
  const since14 = new Date(Date.now() - 15 * 86400000).toISOString();
  cls.forEach((c) => {
    const memIds = members(c.id).map((m) => m.id);
    if (!memIds.length) return;
    const inM = `(${memIds.join(",")})`;
    db.prepare("SELECT * FROM assignments WHERE class_id=?").all(c.id).forEach((a) => {
      const rows = a.kind === "game"
        ? db.prepare(`SELECT created_at t FROM game_plays WHERE game_id=? AND user_id IN ${inM} AND created_at>=? AND (assignment_id=? OR (assignment_id IS NULL AND created_at>=?))`).all(a.ref_id, since14, a.id, a.open_at)
        : db.prepare(`SELECT submitted_at t FROM quiz_attempts WHERE quiz_id=? AND user_id IN ${inM} AND submitted_at>=? AND (assignment_id=? OR (assignment_id IS NULL AND submitted_at>=?))`).all(a.ref_id, since14, a.id, a.open_at);
      rows.forEach((x) => { const k = U.dayKey(x.t); if (k in byDay) byDay[k]++; });
    });
  });
  const incomplete = [];
  cls.forEach((c) => db.prepare("SELECT * FROM assignments WHERE class_id=?").all(c.id).forEach((a) => {
    const mem = members(c.id);
    const n = mem.filter((m) => resultFor(a, m.id).status !== "todo").length;
    if (n < mem.length) incomplete.push({ ...assignmentInfo(a), className: c.name, submitted: n, total: mem.length });
  }));
  const pendingQuiz = db.prepare(`SELECT quiz_id FROM quiz_attempts WHERE quiz_id IN ${inQ} AND status='pending_review' LIMIT 1`).get();
  res.json({
    counts: {
      classes: cls.length, students: studentIds.size,
      quizzes: myQuizIds.length, quizzesPublished: db.prepare("SELECT COUNT(*) n FROM quizzes WHERE owner_id=? AND status='published'").get(uid).n,
      games: db.prepare("SELECT COUNT(*) n FROM games WHERE owner_id=?").get(uid).n, gamesPublished: db.prepare("SELECT COUNT(*) n FROM games WHERE owner_id=? AND status='published'").get(uid).n,
      quizSubs90: subs90, avgPct: cntPct ? sumPct / cntPct : null, pendingEssays, pendingQuizId: pendingQuiz?.quiz_id || null,
    },
    chart: days.map((d) => ({ day: d, n: byDay[d] })),
    incomplete, classes: per,
    live: db.prepare("SELECT l.*, q.title FROM live_rooms l JOIN quizzes q ON q.id=l.quiz_id WHERE l.host_id=? ORDER BY l.id DESC LIMIT 5").all(uid)
      .map((l) => ({ id: l.id, title: l.title, pin: l.pin, status: l.status, players: l.player_count, createdAt: l.created_at })),
  });
});

// รายการที่ครูเลือกมอบหมายได้
dashboard.get("/assignable", need("teacher"), (req, res) => {
  res.json({
    games: db.prepare("SELECT * FROM games WHERE status='published' AND (owner_id=? OR visibility='public') ORDER BY owner_id=? DESC, title").all(req.user.id, req.user.id).map(gameRow),
    quizzes: db.prepare("SELECT * FROM quizzes WHERE status='published' AND (owner_id=? OR visibility='public') ORDER BY owner_id=? DESC, title").all(req.user.id, req.user.id).map(quizRow),
  });
});

module.exports = { router: r, dashboard, zonedToUtc };
