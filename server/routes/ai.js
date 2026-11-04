// AI ช่วยสร้างเนื้อหา — ใช้ได้เมื่อผู้ดูแลตั้งค่าคีย์ API แล้วเท่านั้น (ไม่มีเนื้อหาปลอม/จำลอง)
const express = require("express");
const { db, now } = require("../db");
const { need } = require("../auth");

const r = express.Router();
const LIMIT_PER_HOUR = 10;

function config() {
  const key = process.env.AI_API_KEY || "";
  const provider = (process.env.AI_PROVIDER || (key.startsWith("sk-ant-") ? "anthropic" : key ? "openai" : "")).toLowerCase();
  const url = process.env.AI_API_URL || (provider === "anthropic" ? "https://api.anthropic.com/v1/messages" : "https://api.openai.com/v1/chat/completions");
  const model = process.env.AI_MODEL || (provider === "anthropic" ? "claude-haiku-5-5" : "gpt-4o-mini");
  const urlOk = /^https:\/\//.test(url);
  return { enabled: !!key && ["anthropic", "openai"].includes(provider) && urlOk, key, provider, url, model, urlOk };
}
function status(forAdmin) {
  const c = config();
  return forAdmin ? { enabled: c.enabled, provider: c.provider || null, model: c.enabled ? c.model : null, urlOk: c.urlOk } : { enabled: c.enabled };
}

async function callModel(prompt) {
  const c = config();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 60000);
  try {
    let text;
    if (c.provider === "anthropic") {
      const resp = await fetch(c.url, {
        method: "POST", signal: ctrl.signal,
        headers: { "content-type": "application/json", "x-api-key": c.key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: c.model, max_tokens: 4000, messages: [{ role: "user", content: prompt }] }),
      });
      if (!resp.ok) throw new Error(`ผู้ให้บริการ AI ตอบกลับผิดพลาด (${resp.status})`);
      const j = await resp.json();
      text = (j.content || []).map((x) => x.text || "").join("");
    } else {
      const resp = await fetch(c.url, {
        method: "POST", signal: ctrl.signal,
        headers: { "content-type": "application/json", authorization: `Bearer ${c.key}` },
        body: JSON.stringify({ model: c.model, messages: [{ role: "user", content: prompt }], temperature: 0.7 }),
      });
      if (!resp.ok) throw new Error(`ผู้ให้บริการ AI ตอบกลับผิดพลาด (${resp.status})`);
      const j = await resp.json();
      text = j.choices?.[0]?.message?.content || "";
    }
    const s = text.indexOf("{"), e = text.lastIndexOf("}");
    if (s < 0 || e < s) throw new Error("AI ตอบกลับในรูปแบบที่อ่านไม่ได้ ลองใหม่อีกครั้ง");
    return JSON.parse(text.slice(s, e + 1));
  } catch (err) {
    if (err.name === "AbortError") throw new Error("AI ใช้เวลานานเกินไป ลองใหม่อีกครั้ง");
    throw err;
  } finally { clearTimeout(timer); }
}

const SCHEMAS = {
  mcq: '{"type":"mcq","prompt":"...","options":["...","...","...","..."],"answer":0,"explain":"..."}',
  truefalse: '{"type":"truefalse","prompt":"...","answer":true,"explain":"..."}',
  short: '{"type":"short","prompt":"...","accepted":["คำตอบหลัก","คำตอบอื่นที่ยอมรับ"],"explain":"..."}',
  multi: '{"type":"multi","prompt":"...","options":["...","...","...","..."],"answers":[0,2],"explain":"..."}',
  numeric: '{"type":"numeric","prompt":"...","answer":42,"tolerance":0,"unit":"","explain":"..."}',
};
const GAME_SCHEMAS = {
  mcq: '{"prompt":"...","options":["...","...","..."],"answer":0,"hint":"..."}',
  truefalse: '{"prompt":"...","answer":true,"explain":"..."}',
  scramble: '{"prompt":"คำใบ้","word":"คำตอบ","hint":"..."}',
  order: '{"prompt":"...","items":["ลำดับ 1","ลำดับ 2","ลำดับ 3","ลำดับ 4"]}',
  match: '{"a":"...","b":"..."}',
};

r.get("/status", need("teacher"), (req, res) => res.json(status(req.user.role === "admin")));

r.post("/generate", need("teacher"), async (req, res) => {
  if (!config().enabled) return res.status(503).json({ error: "ฟีเจอร์ AI ยังไม่เปิดใช้งาน" });
  const used = db.prepare("SELECT COUNT(*) n FROM ai_usage WHERE user_id=? AND created_at>=?").get(req.user.id, new Date(Date.now() - 3600000).toISOString()).n;
  if (used >= LIMIT_PER_HOUR) return res.status(429).json({ error: `ใช้ได้ ${LIMIT_PER_HOUR} ครั้งต่อชั่วโมง กรุณารอสักครู่` });
  const b = req.body || {};
  const topic = String(b.topic || "").trim().slice(0, 200);
  if (!topic) return res.status(400).json({ error: "กรุณาใส่หัวข้อ" });
  const count = Math.max(1, Math.min(20, parseInt(b.count) || 5));
  const lang = b.language === "en" ? "ภาษาอังกฤษ" : "ภาษาไทย";
  const grade = String(b.grade || "").slice(0, 20) || "ไม่ระบุ";
  const diff = { easy: "ง่าย", medium: "ปานกลาง", hard: "ยาก" }[b.difficulty] || "ง่าย";
  let prompt;
  if (b.target === "game") {
    const tpl = GAME_SCHEMAS[b.template] ? b.template : "mcq";
    prompt = `คุณเป็นครูผู้ออกข้อสอบสำหรับเด็ก สร้างเนื้อหาเกมการศึกษาแบบ "${tpl}" หัวข้อ "${topic}" ระดับชั้น ${grade} ความยาก${diff} จำนวน ${count} ${tpl === "match" ? "คู่" : "ข้อ"} เป็น${lang}
เนื้อหาต้องถูกต้องตามข้อเท็จจริงและเหมาะกับวัย ห้ามใส่ข้อมูลส่วนบุคคล
ตอบเป็น JSON เท่านั้น รูปแบบ {"title":"ชื่อเกม","description":"คำอธิบายสั้น","items":[${GAME_SCHEMAS[tpl]}, ...]}`;
  } else {
    const types = (Array.isArray(b.types) ? b.types : ["mcq"]).filter((t) => SCHEMAS[t]);
    if (!types.length) types.push("mcq");
    prompt = `คุณเป็นครูผู้ออกข้อสอบ สร้างคำถามแบบทดสอบหัวข้อ "${topic}" ระดับชั้น ${grade} ความยาก${diff} จำนวน ${count} ข้อ เป็น${lang}
ใช้ชนิดคำถามคละกันจาก: ${types.join(", ")} เนื้อหาต้องถูกต้องตามข้อเท็จจริง มีคำอธิบายเฉลยสั้น ๆ ห้ามใส่ข้อมูลส่วนบุคคล
ตอบเป็น JSON เท่านั้น รูปแบบ {"title":"ชื่อแบบทดสอบ","description":"คำอธิบายสั้น","items":[${types.map((t) => SCHEMAS[t]).join(", ")}, ...]}`;
  }
  db.prepare("INSERT INTO ai_usage (user_id, created_at) VALUES (?,?)").run(req.user.id, now());
  try {
    const out = await callModel(prompt);
    if (!Array.isArray(out.items) || !out.items.length) throw new Error("AI ไม่ได้ส่งคำถามกลับมา ลองใหม่อีกครั้ง");
    res.json({ title: String(out.title || topic).slice(0, 120), description: String(out.description || "").slice(0, 300), items: out.items.slice(0, count), model: config().model });
  } catch (e) {
    res.status(502).json({ error: e.message || "เรียกใช้ AI ไม่สำเร็จ" });
  }
});

module.exports = r;
module.exports.status = status;
