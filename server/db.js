// ฐานข้อมูล SQLite (ไฟล์เดียว) — สร้างตารางอัตโนมัติเมื่อเริ่มระบบ
const path = require("path");
const fs = require("fs");
const { DatabaseSync } = require("node:sqlite"); // SQLite ในตัวของ Node.js (ไม่ต้องคอมไพล์)

const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, "..", "data"));
fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_FILE = process.env.DB_FILE || path.join(DATA_DIR, "eduplay.db");

const db = new DatabaseSync(DB_FILE);
db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
// ทำหลายคำสั่งเป็นชุดเดียว (สำเร็จทั้งหมดหรือยกเลิกทั้งหมด)
db.transaction = (fn) => (...args) => {
  db.exec("BEGIN");
  try { const r = fn(...args); db.exec("COMMIT"); return r; } catch (e) { db.exec("ROLLBACK"); throw e; }
};

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','teacher','admin')),
  grade TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  xp INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS password_resets (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name_th TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📚'
);
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  template TEXT NOT NULL CHECK (template IN ('truefalse','match','order','scramble','mcq')),
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  age_min INTEGER NOT NULL DEFAULT 4,
  age_max INTEGER NOT NULL DEFAULT 18,
  difficulty TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy','medium','hard')),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public','private')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  time_limit_sec INTEGER,
  points_per_q INTEGER NOT NULL DEFAULT 100,
  pass_pct INTEGER NOT NULL DEFAULT 60,
  questions TEXT NOT NULL DEFAULT '[]',
  version INTEGER NOT NULL DEFAULT 1,
  plays INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS game_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  note TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS game_plays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assignment_id INTEGER REFERENCES assignments(id) ON DELETE SET NULL,
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  correct INTEGER NOT NULL,
  total INTEGER NOT NULL,
  xp INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS quizzes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  grade TEXT,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  difficulty TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy','medium','hard')),
  time_limit_min INTEGER,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public','private')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  show_answers TEXT NOT NULL DEFAULT 'after_submit' CHECK (show_answers IN ('after_submit','never')),
  shuffle_questions INTEGER NOT NULL DEFAULT 0,
  shuffle_options INTEGER NOT NULL DEFAULT 0,
  questions TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assignment_id INTEGER REFERENCES assignments(id) ON DELETE SET NULL,
  answers TEXT NOT NULL DEFAULT '{}',
  results TEXT NOT NULL DEFAULT '{}',
  score REAL NOT NULL DEFAULT 0,
  max_score REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','pending_review','graded')),
  started_at TEXT NOT NULL,
  submitted_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade TEXT,
  code TEXT NOT NULL UNIQUE,
  show_leaderboard INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS class_members (
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TEXT NOT NULL,
  PRIMARY KEY (class_id, user_id)
);
CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('game','quiz')),
  ref_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  open_at TEXT NOT NULL,
  due_at TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS badges (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, code)
);
CREATE TABLE IF NOT EXISTS activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  xp INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS live_rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  host_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pin TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'lobby',
  player_count INTEGER NOT NULL DEFAULT 0,
  results TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ai_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_plays_user ON game_plays(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON quiz_attempts(user_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity(user_id, created_at);
`);

// ย้ายข้อมูล: เพิ่มคอลัมน์ที่มาทีหลัง (ฐานข้อมูลเดิมยังใช้ได้)
const cols = db.prepare("PRAGMA table_info(users)").all().map((c) => c.name);
if (!cols.includes("prefs")) db.exec("ALTER TABLE users ADD COLUMN prefs TEXT NOT NULL DEFAULT '{}'");

const now = () => new Date().toISOString();
const J = (s, d) => { try { return JSON.parse(s); } catch { return d; } };

module.exports = { db, now, J, DB_FILE };
