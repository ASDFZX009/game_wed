const express = require("express");
const { db, now } = require("../db");
const A = require("../auth");
const { levelOf, XP_PER_LEVEL } = require("../util");

const r = express.Router();
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || ""));

r.get("/me", (req, res) => {
  const u = A.publicUser(req.user);
  if (u) Object.assign(u, { level: levelOf(u.xp), xpPerLevel: XP_PER_LEVEL });
  res.json({ user: u });
});

r.post("/register", (req, res) => {
  const { displayName, email, password, role } = req.body || {};
  const name = String(displayName || "").trim().slice(0, 60);
  if (!name) return res.status(400).json({ error: "กรุณาใส่ชื่อที่แสดง" });
  if (!emailOk(email)) return res.status(400).json({ error: "อีเมลไม่ถูกต้อง" });
  if (String(password || "").length < 8) return res.status(400).json({ error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" });
  if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) return res.status(409).json({ error: "อีเมลนี้มีผู้ใช้แล้ว" });
  const rl = role === "teacher" ? "teacher" : "student";
  const info = db.prepare("INSERT INTO users (email, password_hash, display_name, role, created_at) VALUES (?,?,?,?,?)")
    .run(String(email).trim(), A.hash(password), name, rl, now());
  A.startSession(res, req, info.lastInsertRowid);
  res.json({ ok: true, role: rl });
});

r.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  const key = `${req.ip}|${String(email).toLowerCase()}`;
  if (A.tooMany(key)) return res.status(429).json({ error: "ลองผิดหลายครั้งเกินไป กรุณารอ 15 นาที" });
  const u = db.prepare("SELECT * FROM users WHERE email = ?").get(String(email || "").trim());
  if (!u || !A.check(String(password || ""), u.password_hash)) {
    A.noteFail(key);
    return res.status(401).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
  }
  if (u.status !== "active") return res.status(403).json({ error: "บัญชีนี้ถูกระงับ กรุณาติดต่อผู้ดูแลระบบ" });
  A.startSession(res, req, u.id);
  res.json({ ok: true, role: u.role });
});

r.post("/logout", (req, res) => { A.endSession(res, req); res.json({ ok: true }); });

// ยังไม่มีระบบส่งอีเมล: แจ้งผู้ใช้ตามจริง และให้ครู/ผู้ดูแลตั้งรหัสใหม่ให้
r.post("/forgot", (_req, res) => {
  res.json({
    ok: true,
    message: "ระบบนี้ยังไม่ได้ตั้งค่าการส่งอีเมล กรุณาติดต่อครูหรือผู้ดูแลระบบเพื่อขอตั้งรหัสผ่านใหม่ (ผู้ดูแลทำได้ที่หน้า “ผู้ใช้”)",
  });
});

r.patch("/account", A.need(), (req, res) => {
  const name = String(req.body.displayName || "").trim().slice(0, 60);
  if (!name) return res.status(400).json({ error: "กรุณาใส่ชื่อที่แสดง" });
  const grade = String(req.body.grade || "").trim().slice(0, 20) || null;
  db.prepare("UPDATE users SET display_name = ?, grade = ? WHERE id = ?").run(name, grade, req.user.id);
  res.json({ ok: true });
});

// การตั้งค่าการแสดงผล (เก็บกับบัญชี เพื่อให้ตามไปทุกเครื่อง)
const PREFS = {
  mode: ["auto", "light", "dark"],
  palette: ["violet", "ocean", "forest", "sunset", "sakura", "emerald", "candy", "galaxy", "gold", "aurora"],
  fontSize: ["sm", "md", "lg", "xl"],
  motion: ["auto", "reduce"],
  sound: [true, false], haptics: [true, false], confetti: [true, false], autoNext: [true, false], contrast: [true, false], dyslexic: [true, false],
  tickSound: ["synth", "ka-ching", "register-ding", "register-open", "coins", "service-bell", "thank-you-bits", "custom"],
};
r.put("/prefs", A.need(), (req, res) => {
  const out = {};
  Object.entries(PREFS).forEach(([k, allowed]) => { if (allowed.includes(req.body?.[k])) out[k] = req.body[k]; });
  // ธีมพิเศษต้องซื้อหรือได้จากกล่องสุ่มก่อน
  if (out.palette && !require("../shop").ownsTheme(req.user.id, out.palette)) out.palette = "violet";
  db.prepare("UPDATE users SET prefs = ? WHERE id = ?").run(JSON.stringify(out), req.user.id);
  res.json({ ok: true, prefs: out });
});

r.post("/password", A.need(), (req, res) => {
  const { current, next } = req.body || {};
  if (!A.check(String(current || ""), req.user.password_hash)) return res.status(400).json({ error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
  if (String(next || "").length < 8) return res.status(400).json({ error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร" });
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(A.hash(next), req.user.id);
  db.prepare("DELETE FROM sessions WHERE user_id = ? AND token != ?").run(req.user.id, req.sid);
  res.json({ ok: true });
});

r.post("/delete", A.need(), (req, res) => {
  const { password, confirm } = req.body || {};
  if (confirm !== "DELETE") return res.status(400).json({ error: "กรุณาพิมพ์ DELETE เพื่อยืนยัน" });
  if (!A.check(String(password || ""), req.user.password_hash)) return res.status(400).json({ error: "รหัสผ่านไม่ถูกต้อง" });
  if (req.user.role === "admin" && db.prepare("SELECT COUNT(*) n FROM users WHERE role='admin'").get().n <= 1)
    return res.status(400).json({ error: "ลบผู้ดูแลระบบคนสุดท้ายไม่ได้" });
  const tx = db.transaction(() => {
    // เนื้อหาสาธารณะที่มีผลคะแนนผูกอยู่: ถอดจากสาธารณะและเก็บไว้แบบไม่ระบุเจ้าของ
    db.prepare("UPDATE games SET visibility='private' WHERE owner_id = ?").run(req.user.id);
    db.prepare("UPDATE quizzes SET visibility='private' WHERE owner_id = ?").run(req.user.id);
    db.prepare("DELETE FROM users WHERE id = ?").run(req.user.id);
  });
  tx();
  A.endSession(res, req);
  res.json({ ok: true });
});

module.exports = r;
