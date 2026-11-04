// ฟังก์ชันกลาง: เวลาไทย, ตรวจคำตอบ, XP/ระดับ, เหรียญ
const crypto = require("crypto");
const { db, now, J } = require("./db");

const TZ = process.env.APP_TIMEZONE || "Asia/Bangkok";

// วันที่ (YYYY-MM-DD) ตามเขตเวลาของแอป — ใช้จัดกลุ่มรายวันในกราฟและนับวันต่อเนื่อง
function dayKey(d) {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(d));
  return p; // en-CA ให้รูปแบบ YYYY-MM-DD
}
function lastNDays(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(dayKey(Date.now() - i * 86400000));
  return out;
}
// รูปแบบวันที่สำหรับ CSV (ไทย)
function fmtTH(d) {
  if (!d) return "";
  return new Intl.DateTimeFormat("th-TH", { timeZone: TZ, day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(d));
}

const token = (n = 24) => crypto.randomBytes(n).toString("base64url");
function code6() {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += A[crypto.randomInt(A.length)];
  return s;
}

const { norm, gradeQuestion, answerText, gradeGameQuestion, gameAnswerText, shuffle, shuffleDifferent, graphemes } = require("./grading");

// ---------- XP / ระดับ ----------
const XP_PER_LEVEL = 100;
const levelOf = (xp) => Math.floor(xp / XP_PER_LEVEL) + 1;

function addXP(userId, xp, kind, title) {
  if (xp > 0) db.prepare("UPDATE users SET xp = xp + ? WHERE id = ?").run(xp, userId);
  db.prepare("INSERT INTO activity (user_id, kind, title, xp, created_at) VALUES (?,?,?,?,?)").run(userId, kind, title, xp, now());
}

// ---------- เหรียญรางวัล ----------
const BADGES = [
  { code: "FIRST_GAME", icon: "🎮", name: "เล่นเกมแรก", desc: "เล่นเกมจบครั้งแรก" },
  { code: "SCORE_500", icon: "⭐", name: "คะแนนครบ 500", desc: "ได้ 500 คะแนนขึ้นไปในเกมเดียว" },
  { code: "PERFECT", icon: "💯", name: "คะแนนเต็ม", desc: "ได้คะแนนเต็มในเกมหรือแบบทดสอบ" },
  { code: "STREAK_3", icon: "🔥", name: "เล่นต่อเนื่อง 3 วัน", desc: "เข้ามาเรียน 3 วันติดกัน" },
  { code: "EXPLORER", icon: "🧭", name: "นักสำรวจ", desc: "เล่นเกมไม่ซ้ำกัน 5 เกม" },
  { code: "QUIZ_5", icon: "📝", name: "นักทำแบบทดสอบ", desc: "ส่งแบบทดสอบ 5 ครั้ง" },
  { code: "STREAK_7", icon: "🏆", name: "เล่นต่อเนื่อง 7 วัน", desc: "เข้ามาเรียน 7 วันติดกัน" },
  { code: "LEVEL_5", icon: "🚀", name: "ถึงระดับ 5", desc: "สะสม XP ถึงระดับ 5" },
];

function streakDays(userId) {
  const rows = db.prepare("SELECT created_at FROM activity WHERE user_id = ? AND xp > 0").all(userId);
  const days = new Set(rows.map((r) => dayKey(r.created_at)));
  let n = 0;
  for (let i = 0; ; i++) {
    const k = dayKey(Date.now() - i * 86400000);
    if (days.has(k)) n++;
    else if (i === 0) continue; // วันนี้ยังไม่ได้เล่น ไม่ตัดสถิติ
    else break;
  }
  return n;
}

/** ตรวจและมอบเหรียญ (เรียกหลังบันทึกผล) → คืนรายการเหรียญใหม่ */
function checkBadges(userId, ctx = {}) {
  const have = new Set(db.prepare("SELECT code FROM badges WHERE user_id = ?").all(userId).map((r) => r.code));
  const earned = [];
  const give = (code) => {
    if (have.has(code)) return;
    db.prepare("INSERT OR IGNORE INTO badges (user_id, code, created_at) VALUES (?,?,?)").run(userId, code, now());
    have.add(code);
    earned.push(BADGES.find((b) => b.code === code));
  };
  const plays = db.prepare("SELECT COUNT(*) n, MAX(score) best, COUNT(DISTINCT game_id) uniq FROM game_plays WHERE user_id = ?").get(userId);
  if (plays.n > 0) give("FIRST_GAME");
  if ((plays.best || 0) >= 500) give("SCORE_500");
  if (plays.uniq >= 5) give("EXPLORER");
  // คะแนนเต็ม: ตอบถูกทุกข้อ (ดูจากผลจริง ไม่ใช่ตัวเลขคงที่)
  if (ctx.perfect) give("PERFECT");
  const perfectBefore = db.prepare("SELECT 1 FROM game_plays WHERE user_id = ? AND max_score > 0 AND score >= max_score LIMIT 1").get(userId)
    || db.prepare("SELECT 1 FROM quiz_attempts WHERE user_id = ? AND status = 'graded' AND max_score > 0 AND score >= max_score LIMIT 1").get(userId);
  if (perfectBefore) give("PERFECT");
  const q = db.prepare("SELECT COUNT(*) n FROM quiz_attempts WHERE user_id = ?").get(userId);
  if (q.n >= 5) give("QUIZ_5");
  const s = streakDays(userId);
  if (s >= 3) give("STREAK_3");
  if (s >= 7) give("STREAK_7");
  const u = db.prepare("SELECT xp FROM users WHERE id = ?").get(userId);
  if (u && levelOf(u.xp) >= 5) give("LEVEL_5");
  return earned.filter(Boolean);
}

function csv(rows) {
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + rows.map((r) => r.map(esc).join(",")).join("\r\n");
}

module.exports = {
  TZ, dayKey, lastNDays, fmtTH, token, code6, norm,
  gradeQuestion, answerText, gradeGameQuestion, gameAnswerText,
  XP_PER_LEVEL, levelOf, addXP, BADGES, checkBadges, streakDays, csv, shuffle, shuffleDifferent, graphemes, J,
};
