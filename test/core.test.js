// ทดสอบฟังก์ชันหลัก: ตรวจคำตอบ สลับตัวอักษร และเขตเวลา
process.env.DB_FILE = require("path").join(require("os").tmpdir(), `eduplay-test-${process.pid}.db`);
const test = require("node:test");
const assert = require("node:assert");
const U = require("../server/util");
const { GAMES, QUIZZES } = require("../server/content");
const { cleanQuestions } = require("../server/routes/games");
const { cleanQuiz } = require("../server/routes/quizzes");
const { zonedToUtc } = require("../server/routes/classes");

test("ตรวจคำตอบคำถามทุกชนิด", () => {
  assert.equal(U.gradeQuestion({ type: "mcq", answer: 1, points: 2 }, 1).points, 2);
  assert.equal(U.gradeQuestion({ type: "multi", answers: [0, 2] }, [2, 0]).correct, true);
  assert.equal(U.gradeQuestion({ type: "multi", answers: [0, 2] }, [0]).correct, false);
  assert.equal(U.gradeQuestion({ type: "numeric", answer: 24, tolerance: 0 }, "24").correct, true);
  assert.equal(U.gradeQuestion({ type: "numeric", answer: 3.14, tolerance: 0.01 }, "3.141").correct, true);
  assert.equal(U.gradeQuestion({ type: "numeric", answer: 0 }, "").correct, false);
  assert.equal(U.gradeQuestion({ type: "short", accepted: ["Tokyo"] }, " tokyo ").correct, true);
  assert.equal(U.gradeQuestion({ type: "fill", blanks: ["ตะวันออก|east"] }, ["East"]).correct, true);
  assert.equal(U.gradeQuestion({ type: "wordbank", blanks: ["a", "b"] }, ["a", "b"]).correct, true);
  assert.equal(U.gradeQuestion({ type: "match", pairs: [["x", "1"], ["y", "2"]] }, { 0: "1", 1: "2" }).correct, true);
  assert.equal(U.gradeQuestion({ type: "order", items: ["a", "b"] }, ["b", "a"]).correct, false);
  assert.equal(U.gradeQuestion({ type: "essay", points: 5 }, "...").correct, null);
});

test("Word Scramble ไม่แสดงตัวอักษรเรียงตรงคำตอบ", () => {
  for (const w of ["dog", "cat", "book", "แมว", "ช้าง", "โรงเรียน"]) {
    for (let i = 0; i < 200; i++) assert.notEqual(U.shuffleDifferent(U.graphemes(w)).join(""), w);
  }
  assert.deepEqual(U.graphemes("ช้าง"), ["ช้", "า", "ง"]);
});

test("เนื้อหาตัวอย่างผ่านการตรวจของตัวสร้างทั้งหมด", () => {
  GAMES.filter((g) => g.template !== "lesson").forEach((g) => assert.doesNotThrow(() => cleanQuestions(g.template, g.questions), g.title));
  QUIZZES.forEach((q) => assert.doesNotThrow(() => cleanQuiz(q.questions), q.title));
});

test("แปลงเวลาไทยเป็น UTC และจัดกลุ่มรายวันตามเวลาไทย", () => {
  assert.equal(zonedToUtc("2026-11-04T17:00"), "2026-11-04T10:00:00.000Z");
  assert.equal(U.dayKey("2026-11-04T18:30:00Z"), "2026-11-05"); // 01:30 น. ของวันถัดไปในไทย
});

test("ร้านค้า: โอกาสกล่องสุ่มรวมได้ 100% และของตำนานได้จากกล่องเท่านั้น", () => {
  const shop = require("../server/shop");
  shop.BOXES.forEach((b) => assert.equal(Object.values(b.odds).reduce((s, v) => s + v, 0), 100, b.name));
  shop.CATALOG.filter((x) => x.rarity === "legendary").forEach((x) => assert.equal(x.boxOnly, true));
  shop.CATALOG.filter((x) => x.rarity !== "legendary" && x.type !== "pfp").forEach((x) => assert.ok(x.price > 0));
  shop.CATALOG.filter((x) => x.type === "pfp").forEach((x) => assert.equal(x.boxOnly, true)); // รูปโปรไฟล์ได้จากกล่องโปรไฟล์เท่านั้น
  // กล่องโปรไฟล์ให้แต่รูปโปรไฟล์ กล่องอื่นไม่มีรูปโปรไฟล์
  Object.keys(shop.RARITY).forEach((r) => { shop.boxPool(shop.BOXES.find((b) => b.id === "profile"), r).forEach((x) => assert.equal(x.type, "pfp")); shop.boxPool(shop.BOXES[0], r).forEach((x) => assert.notEqual(x.type, "pfp")); });
  assert.equal(new Set(shop.CATALOG.map((x) => x.id)).size, shop.CATALOG.length);
  // ทุกระดับที่มีโอกาส > 0 ต้องมีของให้สุ่ม
  shop.BOXES.forEach((b) => Object.entries(b.odds).forEach(([r, w]) => { if (w) assert.ok(shop.boxPool(b, r).length > 0, `${b.name} ${r}`); }));
});

test("บทเรียน: ทุกหมวดมีอย่างน้อย 4 บท ทุกรูปแบบ/ระดับ/จำนวนข้อสร้างชุดคำถามได้ และสร้างซ้ำจาก key ได้ผลเดิม", () => {
  const Ls = require("../server/lessons");
  const by = {}; Ls.LESSONS.forEach((l) => (by[l.cat] = (by[l.cat] || 0) + 1));
  ["math", "science", "thai", "english", "social", "health", "early", "brain", "general"].forEach((c) => assert.ok(by[c] >= 4, c));
  for (const L of Ls.LESSONS) for (const m of Ls.setupOf(L).modes) for (let level = 1; level <= 5; level++) for (const count of [6, 10, 15]) for (const set of [1, 4]) {
    const b = Ls.build(L, { level, mode: m.id, count, set }); const again = Ls.build(L, Ls.parseKey(L, b.key));
    assert.ok(b.questions.length > 0, `${L.id} ${b.key}`);
    assert.deepEqual(again.questions, b.questions, `${L.id} ${b.key}`);
    if (b.template === "mcq") b.questions.forEach((q) => { assert.ok(q.answer >= 0 && new Set(q.options).size === q.options.length, `${L.id} ${q.prompt}`); assert.ok(U.gradeGameQuestion("mcq", q, q.answer)); });
  }
});
