// ตรวจคำตอบ สลับลำดับ และแยกตัวอักษร — โค้ดบริสุทธิ์ ใช้ได้ทั้งเซิร์ฟเวอร์และเบราว์เซอร์ (เวอร์ชันเล่นบนเว็บ)
const randInt = (n) => { const a = new Uint32Array(1); globalThis.crypto.getRandomValues(a); return a[0] % n; };

const norm = (s) => String(s ?? "").normalize("NFC").trim().toLowerCase().replace(/\s+/g, " ");
const sameSet = (a, b) => a.length === b.length && [...a].sort().join("|") === [...b].sort().join("|");

/** ตรวจคำถามแบบทดสอบ 1 ข้อ → { correct: true|false|null(รอตรวจ), points, max } */
function gradeQuestion(q, a) {
  const max = Number(q.points) || 1;
  let correct = false;
  switch (q.type) {
    case "mcq": correct = Number(a) === Number(q.answer); break;
    case "truefalse": correct = a === true || a === false ? a === q.answer : String(a) === String(q.answer); break;
    case "short": correct = (q.accepted || []).some((x) => norm(x) === norm(a)); break;
    case "numeric": {
      const v = Number(String(a ?? "").replace(/,/g, ""));
      correct = String(a ?? "").trim() !== "" && Number.isFinite(v) && Math.abs(v - Number(q.answer)) <= (Number(q.tolerance) || 0);
      break;
    }
    case "multi": correct = Array.isArray(a) && sameSet(a.map(Number), (q.answers || []).map(Number)); break;
    case "fill": {
      const arr = Array.isArray(a) ? a : [];
      correct = (q.blanks || []).every((alts, i) => String(alts).split("|").some((x) => norm(x) === norm(arr[i])));
      break;
    }
    case "wordbank": {
      const arr = Array.isArray(a) ? a : [];
      correct = (q.blanks || []).every((w, i) => norm(w) === norm(arr[i]));
      break;
    }
    case "match": {
      const m = a && typeof a === "object" ? a : {};
      correct = (q.pairs || []).every((p, i) => norm(m[i]) === norm(p[1]));
      break;
    }
    case "order": {
      const arr = Array.isArray(a) ? a : [];
      correct = arr.length === (q.items || []).length && arr.every((x, i) => norm(x) === norm(q.items[i]));
      break;
    }
    case "essay": return { correct: null, points: 0, max };
    default: correct = false;
  }
  return { correct, points: correct ? max : 0, max };
}

/** เฉลยแบบอ่านง่าย */
function answerText(q) {
  switch (q.type) {
    case "mcq": return q.options?.[q.answer] ?? "";
    case "truefalse": return q.answer ? "จริง" : "เท็จ";
    case "short": return (q.accepted || [])[0] ?? "";
    case "numeric": return String(q.answer) + (q.tolerance ? ` (±${q.tolerance})` : "") + (q.unit ? " " + q.unit : "");
    case "multi": return (q.answers || []).map((i) => q.options[i]).join(", ");
    case "fill": return (q.blanks || []).map((b) => String(b).split("|")[0]).join(" ; ");
    case "wordbank": return (q.blanks || []).join(" ; ");
    case "match": return (q.pairs || []).map((p) => `${p[0]} → ${p[1]}`).join(" ; ");
    case "order": return (q.items || []).join(" → ");
    default: return "";
  }
}

/** ตรวจข้อในเกม 1 ข้อ (ยกเว้นเกมจับคู่ซึ่งนับจากจำนวนครั้งที่พลิก) */
function gradeGameQuestion(template, q, a) {
  switch (template) {
    case "truefalse": return a === q.answer;
    case "mcq": return Number(a) === Number(q.answer);
    case "scramble": return norm(a).replace(/\s/g, "") === norm(q.word).replace(/\s/g, "");
    case "order": return Array.isArray(a) && a.length === q.items.length && a.every((x, i) => norm(x) === norm(q.items[i]));
    default: return false;
  }
}
function gameAnswerText(template, q) {
  switch (template) {
    case "truefalse": return q.answer ? "ถูก" : "ผิด";
    case "mcq": return q.options[q.answer];
    case "scramble": return q.word;
    case "order": return q.items.join(" → ");
    case "match": return `${q.a} ↔ ${q.b}`;
    default: return "";
  }
}

function shuffle(a) {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/** สลับลำดับ (รับประกันว่าไม่เหมือนลำดับเดิม ถ้าสลับได้) */
function shuffleDifferent(a) {
  if (a.length < 2 || new Set(a).size < 2) return [...a];
  let r;
  do r = shuffle(a); while (r.join("\u0000") === a.join("\u0000"));
  return r;
}

/** แยกตัวอักษรแบบรองรับภาษาไทย (สระ/วรรณยุกต์ติดกับพยัญชนะ) */
function graphemes(word) {
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    return [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(word)].map((s) => s.segment).filter((s) => s.trim());
  }
  return [...word].filter((s) => s.trim());
}


module.exports = { norm, gradeQuestion, answerText, gradeGameQuestion, gameAnswerText, shuffle, shuffleDifferent, graphemes, randInt };
