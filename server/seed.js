// สร้างข้อมูลเริ่มต้น: หมวดหมู่ เกม แบบทดสอบ และ (ในโหมดสาธิต) บัญชีตัวอย่าง
const fs = require("fs");
const { db, now, DB_FILE } = require("./db");
const { hash } = require("./auth");
const U = require("./util");
const { CATEGORIES, GAMES, QUIZZES } = require("./content");

const demoMode = () => (process.env.SEED_DEMO ? process.env.SEED_DEMO === "1" : process.env.NODE_ENV !== "production");

function user(email, name, role, pw) {
  const ex = db.prepare("SELECT id FROM users WHERE email=?").get(email);
  if (ex) return ex.id;
  return db.prepare("INSERT INTO users (email,password_hash,display_name,role,created_at) VALUES (?,?,?,?,?)").run(email, hash(pw), name, role, now()).lastInsertRowid;
}

function ensure() {
  if (!db.prepare("SELECT COUNT(*) n FROM categories").get().n) {
    const ins = db.prepare("INSERT INTO categories (slug,name_th,name_en,icon) VALUES (?,?,?,?)");
    CATEGORIES.forEach((c) => ins.run(...c));
  }
  // ผู้ดูแลระบบจากตัวแปรแวดล้อม (สำหรับใช้งานจริง)
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) user(process.env.ADMIN_EMAIL, "ผู้ดูแลระบบ", "admin", process.env.ADMIN_PASSWORD);

  if (db.prepare("SELECT COUNT(*) n FROM games").get().n) return;
  const demo = demoMode();
  const owner = demo
    ? user("teacher@eduplay.local", "ครูตัวอย่าง", "teacher", "teacher1234")
    : user("content@eduplay.local", "ทีม EduPlay", "teacher", U.token(18));
  const catId = (slug) => db.prepare("SELECT id FROM categories WHERE slug=?").get(slug)?.id ?? null;
  const t0 = Date.now() - 20 * 86400000;
  const gameIds = {}, quizIds = {};
  GAMES.forEach((g, i) => {
    const t = new Date(t0 + i * 3600000).toISOString();
    const id = db.prepare(`INSERT INTO games (owner_id,title,description,template,category_id,age_min,age_max,difficulty,visibility,status,time_limit_sec,points_per_q,pass_pct,questions,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,'public','published',?,100,60,?,?,?)`).run(owner, g.title, g.description, g.template, catId(g.category), g.age[0], g.age[1], g.difficulty, g.timeLimitSec || null, JSON.stringify(g.questions), t, t).lastInsertRowid;
    db.prepare("INSERT INTO game_versions (game_id,version,note,created_at) VALUES (?,?,?,?)").run(id, 1, `สร้างเกม (${g.questions.length} ข้อ) และเผยแพร่`, t);
    gameIds[g.title] = id;
  });
  QUIZZES.forEach((q, i) => {
    const t = new Date(t0 + i * 3600000).toISOString();
    quizIds[q.title] = db.prepare(`INSERT INTO quizzes (owner_id,title,description,grade,category_id,difficulty,visibility,status,show_answers,questions,created_at,updated_at)
      VALUES (?,?,?,?,?,?,'public','published','after_submit',?,?,?)`).run(owner, q.title, q.description, q.grade, catId(q.category), q.difficulty, JSON.stringify(q.questions), t, t).lastInsertRowid;
  });
  if (!demo) return;

  // ---------- ข้อมูลสาธิต ----------
  user("admin@eduplay.local", "ผู้ดูแลตัวอย่าง", "admin", "admin1234");
  const me = user("student@eduplay.local", "นักเรียนตัวอย่าง", "student", "student1234");
  const kids = ["น้องบีม", "น้องเมย์", "น้องฟ้า", "น้องบอส", "น้องมิว"].map((n, i) => user(`demo-${i + 1}@eduplay.local`, n, "student", "demo1234"));
  const cls = db.prepare("INSERT INTO classes (teacher_id,name,grade,code,created_at) VALUES (?,?,?,?,?)").run(owner, "ห้อง ป.5/1", "ป.5", U.code6(), new Date(t0).toISOString()).lastInsertRowid;
  [me, ...kids].forEach((u) => db.prepare("INSERT INTO class_members (class_id,user_id,joined_at) VALUES (?,?,?)").run(cls, u, new Date(t0).toISOString()));
  const day = 86400000;
  const open = new Date(Date.now() - 6 * day).toISOString();
  const a1 = db.prepare("INSERT INTO assignments (class_id,kind,ref_id,title,open_at,due_at,created_at) VALUES (?,?,?,?,?,?,?)")
    .run(cls, "quiz", quizIds["แบบทดสอบรวมทุกชนิดคำถาม"], "แบบทดสอบรวมทุกชนิดคำถาม", open, new Date(Date.now() + 7 * day).toISOString(), open).lastInsertRowid;
  db.prepare("INSERT INTO assignments (class_id,kind,ref_id,title,open_at,due_at,created_at) VALUES (?,?,?,?,?,?,?)")
    .run(cls, "game", gameIds["ผลไม้รอบตัวเรา"], "เกมผลไม้รอบตัวเรา", open, new Date(Date.now() + 4 * day).toISOString(), open);
  db.prepare("INSERT INTO assignments (class_id,kind,ref_id,title,open_at,due_at,created_at) VALUES (?,?,?,?,?,?,?)")
    .run(cls, "quiz", quizIds["คณิตศาสตร์ ป.4: ทบทวน"], "ทบทวนคณิตศาสตร์", open, new Date(Date.now() + 3 * day).toISOString(), open);

  // ผลการทำแบบทดสอบของเพื่อน ๆ (ตรวจด้วยฟังก์ชันจริง)
  const quiz = db.prepare("SELECT * FROM quizzes WHERE id=?").get(quizIds["แบบทดสอบรวมทุกชนิดคำถาม"]);
  const qs = JSON.parse(quiz.questions);
  const good = { 0: 1, 1: true, 2: "Tokyo", 3: ["ตะวันออก", "ตะวันตก"], 4: { 0: "กรุงเทพมหานคร", 1: "โตเกียว", 2: "ปารีส" }, 5: ["มด", "แมว", "ม้า", "ช้าง"], 6: [0, 1, 4], 7: "24", 8: ["คาร์บอนไดออกไซด์", "แสงแดด"], 9: "ร่างกายต้องใช้น้ำในการทำงานของทุกระบบ ถ้าขาดน้ำจะอ่อนเพลีย" };
  const meh = { ...good, 0: 0, 4: { 0: "กรุงเทพมหานคร", 1: "ปารีส", 2: "โตเกียว" }, 6: [0, 4], 9: "เพราะร่างกายต้องการน้ำ" };
  [[kids[0], good, 2], [kids[1], meh, 3], [kids[2], meh, 4]].forEach(([uid, ans, ago]) => {
    const results = {}; let score = 0, max = 0;
    qs.forEach((x, i) => { const g = U.gradeQuestion(x, ans[i]); max += g.max; if (g.correct === null) results[i] = { correct: null, points: null }; else { score += g.points; results[i] = { correct: g.correct, points: g.points }; } });
    const t = new Date(Date.now() - ago * day).toISOString();
    db.prepare(`INSERT INTO quiz_attempts (quiz_id,user_id,assignment_id,answers,results,score,max_score,status,started_at,submitted_at) VALUES (?,?,?,?,?,?,?,'pending_review',?,?)`)
      .run(quiz.id, uid, a1, JSON.stringify(ans), JSON.stringify(results), score, max, t, t);
    const xp = Math.round((score / max) * 20);
    db.prepare("UPDATE users SET xp = xp + ? WHERE id=?").run(xp, uid);
    db.prepare("INSERT INTO activity (user_id,kind,title,xp,created_at) VALUES (?,?,?,?,?)").run(uid, "quiz", quiz.title, xp, t);
  });
  // ประวัติการเล่นเกมของนักเรียนตัวอย่าง (ย้อนหลังไม่กี่วัน)
  [["วิทย์ถูกหรือผิด", 13, 15, 3], ["ภูมิศาสตร์ไทย", 9, 12, 3], ["จับคู่สัตว์และเสียงร้อง", 8, 8, 2], ["บวกเลขง่าย ๆ", 12, 12, 1]].forEach(([title, c, n, ago]) => {
    const g = db.prepare("SELECT * FROM games WHERE id=?").get(gameIds[title]);
    const max = n * 100, score = title.startsWith("จับคู่") ? 740 : c * 100;
    const xp = Math.round((score / max) * 50);
    const t = new Date(Date.now() - ago * day).toISOString();
    db.prepare("INSERT INTO game_plays (game_id,user_id,score,max_score,correct,total,xp,created_at) VALUES (?,?,?,?,?,?,?,?)").run(g.id, me, score, max, c, n, xp, t);
    db.prepare("UPDATE games SET plays = plays + 1 WHERE id=?").run(g.id);
    db.prepare("UPDATE users SET xp = xp + ? WHERE id=?").run(xp, me);
    db.prepare("INSERT INTO activity (user_id,kind,title,xp,created_at) VALUES (?,?,?,?,?)").run(me, "game", g.title, xp, t);
  });
  U.checkBadges(me);
  console.log("สร้างข้อมูลสาธิตแล้ว — ครู: teacher@eduplay.local / teacher1234, นักเรียน: student@eduplay.local / student1234, ผู้ดูแล: admin@eduplay.local / admin1234");
}

if (require.main === module && process.argv.includes("--reset")) {
  db.close();
  [DB_FILE, DB_FILE + "-wal", DB_FILE + "-shm"].forEach((f) => fs.existsSync(f) && fs.unlinkSync(f));
  delete require.cache[require.resolve("./db")];
  console.log("ลบฐานข้อมูลเดิมแล้ว — เริ่มเซิร์ฟเวอร์ใหม่เพื่อสร้างข้อมูลเริ่มต้น");
}

module.exports = { ensure };
