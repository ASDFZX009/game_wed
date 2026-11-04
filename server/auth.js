// ระบบล็อกอินด้วยคุกกี้ session (เก็บในฐานข้อมูล)
const bcrypt = require("bcryptjs");
const { db, now } = require("./db");
const { token } = require("./util");

const COOKIE = "eduplay_sid";
const SESSION_DAYS = 30;

function parseCookies(header = "") {
  const out = {};
  header.split(";").forEach((p) => {
    const i = p.indexOf("=");
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

function userFromToken(t) {
  if (!t) return null;
  const row = db.prepare(`SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > ?`).get(t, now());
  if (!row || row.status !== "active") return null;
  return row;
}

function attachUser(req, _res, next) {
  req.sid = parseCookies(req.headers.cookie)[COOKIE];
  req.user = userFromToken(req.sid);
  next();
}

function startSession(res, req, userId) {
  const t = token(32);
  const exp = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?,?)").run(t, userId, exp);
  const secure = req.secure || req.headers["x-forwarded-proto"] === "https";
  res.setHeader("Set-Cookie", `${COOKIE}=${t}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure ? "; Secure" : ""}`);
}
function endSession(res, req) {
  if (req.sid) db.prepare("DELETE FROM sessions WHERE token = ?").run(req.sid);
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

const need = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "กรุณาเข้าสู่ระบบ" });
  if (roles.length && !roles.includes(req.user.role) && req.user.role !== "admin") return res.status(403).json({ error: "ไม่มีสิทธิ์เข้าถึง" });
  next();
};

const hash = (pw) => bcrypt.hashSync(pw, 10);
const check = (pw, h) => bcrypt.compareSync(pw, h);

// จำกัดการลองรหัสผ่าน (ต่อ IP+อีเมล)
const attempts = new Map();
function tooMany(key) {
  const t = Date.now();
  const a = (attempts.get(key) || []).filter((x) => t - x < 15 * 60000);
  attempts.set(key, a);
  return a.length >= 10;
}
const noteFail = (key) => attempts.set(key, [...(attempts.get(key) || []), Date.now()]);

function publicUser(u) {
  if (!u) return null;
  let prefs = {};
  try { prefs = JSON.parse(u.prefs || "{}"); } catch { /* ignore */ }
  const { equippedView } = require("./shop"); // โหลดตอนใช้ (เลี่ยงการอ้างอิงวน)
  return { id: u.id, email: u.email, displayName: u.display_name, role: u.role, grade: u.grade, xp: u.xp, coins: u.coins ?? 0, prefs, equipped: equippedView(u.equipped) };
}

module.exports = { attachUser, startSession, endSession, need, hash, check, tooMany, noteFail, publicUser, userFromToken, parseCookies, COOKIE };
