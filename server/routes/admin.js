// ผู้ดูแลระบบ: สถิติ ผู้ใช้ ตรวจสอบเนื้อหา หมวดหมู่ บันทึกการดำเนินการ
const express = require("express");
const { db, now } = require("../db");
const { need, hash } = require("../auth");
const U = require("../util");
const ai = require("./ai");

const r = express.Router();
r.use(need("admin"));
const isAdmin = (req, res, next) => (req.user.role === "admin" ? next() : res.status(403).json({ error: "ไม่มีสิทธิ์เข้าถึง" }));
r.use(isAdmin);

const log = (req, action, detail = "") => db.prepare("INSERT INTO audit_log (admin_id, action, detail, created_at) VALUES (?,?,?,?)").run(req.user.id, action, detail, now());

r.get("/stats", (_req, res) => {
  const c = (sql, ...a) => db.prepare(sql).get(...a).n;
  const days = U.lastNDays(14);
  const byDay = Object.fromEntries(days.map((d) => [d, 0]));
  const since = new Date(Date.now() - 15 * 86400000).toISOString();
  db.prepare("SELECT created_at t FROM game_plays WHERE created_at>=? UNION ALL SELECT submitted_at t FROM quiz_attempts WHERE submitted_at>=?").all(since, since)
    .forEach((x) => { const k = U.dayKey(x.t); if (k in byDay) byDay[k]++; });
  res.json({
    users: c("SELECT COUNT(*) n FROM users"), newUsers7: c("SELECT COUNT(*) n FROM users WHERE created_at>=?", new Date(Date.now() - 7 * 86400000).toISOString()),
    students: c("SELECT COUNT(*) n FROM users WHERE role='student'"), teachers: c("SELECT COUNT(*) n FROM users WHERE role='teacher'"), admins: c("SELECT COUNT(*) n FROM users WHERE role='admin'"),
    active: c("SELECT COUNT(*) n FROM users WHERE status='active'"), suspended: c("SELECT COUNT(*) n FROM users WHERE status='suspended'"),
    classes: c("SELECT COUNT(*) n FROM classes"),
    games: c("SELECT COUNT(*) n FROM games"), gamesPublished: c("SELECT COUNT(*) n FROM games WHERE status='published'"),
    quizzes: c("SELECT COUNT(*) n FROM quizzes"), quizzesPublished: c("SELECT COUNT(*) n FROM quizzes WHERE status='published'"),
    liveRooms: c("SELECT COUNT(*) n FROM live_rooms"), liveOpen: c("SELECT COUNT(*) n FROM live_rooms WHERE status IN ('lobby','question','reveal','paused')"),
    plays: c("SELECT COUNT(*) n FROM game_plays"), attempts: c("SELECT COUNT(*) n FROM quiz_attempts"),
    chart: days.map((d) => ({ day: d, n: byDay[d] })),
    audit: db.prepare("SELECT a.action, a.detail, a.created_at, u.display_name admin FROM audit_log a LEFT JOIN users u ON u.id=a.admin_id ORDER BY a.id DESC LIMIT 15").all(),
    ai: ai.status(true),
  });
});

r.get("/users", (req, res) => {
  const { q = "", role = "" } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const where = [], args = [];
  if (q) { where.push("(email LIKE ? OR display_name LIKE ?)"); args.push(`%${q}%`, `%${q}%`); }
  if (["student", "teacher", "admin"].includes(role)) { where.push("role=?"); args.push(role); }
  const w = where.length ? "WHERE " + where.join(" AND ") : "";
  const total = db.prepare(`SELECT COUNT(*) n FROM users ${w}`).get(...args).n;
  const users = db.prepare(`SELECT id, email, display_name, role, status, created_at, xp FROM users ${w} ORDER BY created_at DESC LIMIT 25 OFFSET ?`).all(...args, (page - 1) * 25);
  res.json({ users, total, page, pages: Math.max(1, Math.ceil(total / 25)) });
});

r.patch("/users/:id", (req, res) => {
  const u = db.prepare("SELECT * FROM users WHERE id=?").get(req.params.id);
  if (!u) return res.status(404).json({ error: "ไม่พบผู้ใช้" });
  if (u.id === req.user.id) return res.status(400).json({ error: "แก้ไขบัญชีของตัวเองที่หน้านี้ไม่ได้" });
  if (req.body.role && ["student", "teacher", "admin"].includes(req.body.role)) {
    db.prepare("UPDATE users SET role=? WHERE id=?").run(req.body.role, u.id);
    log(req, "เปลี่ยนบทบาทผู้ใช้", `${u.email}: ${u.role} → ${req.body.role}`);
  }
  if (req.body.status && ["active", "suspended"].includes(req.body.status)) {
    db.prepare("UPDATE users SET status=? WHERE id=?").run(req.body.status, u.id);
    if (req.body.status === "suspended") db.prepare("DELETE FROM sessions WHERE user_id=?").run(u.id);
    log(req, req.body.status === "suspended" ? "ระงับบัญชี" : "เปิดใช้บัญชี", u.email);
  }
  if (req.body.password) {
    if (String(req.body.password).length < 8) return res.status(400).json({ error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" });
    db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(hash(req.body.password), u.id);
    db.prepare("DELETE FROM sessions WHERE user_id=?").run(u.id);
    log(req, "ตั้งรหัสผ่านใหม่ให้ผู้ใช้", u.email);
  }
  res.json({ ok: true });
});

r.get("/content", (req, res) => {
  const kind = req.query.kind === "game" ? "game" : "quiz";
  const q = String(req.query.q || "");
  const table = kind === "game" ? "games" : "quizzes";
  const rows = db.prepare(`SELECT t.id, t.title, t.description, t.created_at, u.display_name owner FROM ${table} t LEFT JOIN users u ON u.id=t.owner_id
    WHERE t.status='published' AND t.visibility='public' ${q ? "AND t.title LIKE ?" : ""} ORDER BY t.created_at DESC LIMIT 100`).all(...(q ? [`%${q}%`] : []));
  res.json({ items: rows });
});
r.post("/content/:kind/:id/unpublish", (req, res) => {
  const table = req.params.kind === "game" ? "games" : "quizzes";
  const row = db.prepare(`SELECT id, title FROM ${table} WHERE id=?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: "ไม่พบเนื้อหา" });
  const reason = String(req.body.reason || "").trim().slice(0, 300);
  if (!reason) return res.status(400).json({ error: "กรุณาระบุเหตุผล" });
  db.prepare(`UPDATE ${table} SET visibility='private' WHERE id=?`).run(row.id);
  log(req, "ถอดเนื้อหาออกจากสาธารณะ", `${row.title} — เหตุผล: ${reason}`);
  res.json({ ok: true });
});

r.get("/categories", (_req, res) => {
  res.json({ categories: db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM games g WHERE g.category_id=c.id) used FROM categories c ORDER BY name_en`).all() });
});
r.post("/categories", (req, res) => {
  const slug = String(req.body.slug || "").trim().toLowerCase();
  const th = String(req.body.nameTh || "").trim(), en = String(req.body.nameEn || "").trim();
  if (!/^[a-z0-9-]{2,30}$/.test(slug)) return res.status(400).json({ error: "slug ใช้ได้เฉพาะ a-z, 0-9, - (2–30 ตัว)" });
  if (!th || !en) return res.status(400).json({ error: "กรุณาใส่ชื่อทั้งภาษาไทยและอังกฤษ" });
  if (db.prepare("SELECT 1 FROM categories WHERE slug=?").get(slug)) return res.status(409).json({ error: "มี slug นี้แล้ว" });
  db.prepare("INSERT INTO categories (slug, name_th, name_en, icon) VALUES (?,?,?,?)").run(slug, th, en, String(req.body.icon || "📚").slice(0, 4));
  log(req, "สร้างหมวดหมู่", `${th} (${slug})`);
  res.json({ ok: true });
});
r.patch("/categories/:id", (req, res) => {
  const c = db.prepare("SELECT * FROM categories WHERE id=?").get(req.params.id);
  if (!c) return res.status(404).json({ error: "ไม่พบหมวดหมู่" });
  const th = String(req.body.nameTh || c.name_th).trim(), en = String(req.body.nameEn || c.name_en).trim();
  db.prepare("UPDATE categories SET name_th=?, name_en=?, icon=? WHERE id=?").run(th, en, String(req.body.icon || c.icon).slice(0, 4), c.id);
  log(req, "เปลี่ยนชื่อหมวดหมู่", `${c.name_th} → ${th}`);
  res.json({ ok: true });
});
r.delete("/categories/:id", (req, res) => {
  const c = db.prepare("SELECT * FROM categories WHERE id=?").get(req.params.id);
  if (!c) return res.status(404).json({ error: "ไม่พบหมวดหมู่" });
  db.prepare("DELETE FROM categories WHERE id=?").run(c.id);
  log(req, "ลบหมวดหมู่", c.name_th);
  res.json({ ok: true });
});

module.exports = r;
