// ร้านค้าของตกแต่ง + กล่องสุ่ม
// เหรียญ (coins) ได้จากการเล่นเกม/ทำแบบทดสอบเท่านั้น ไม่มีการซื้อด้วยเงินจริง
const crypto = require("crypto");
const express = require("express");
const { db, now, J } = require("./db");
const { need } = require("./auth");

const RARITY = {
  common: { name: "ธรรมดา", price: 80, refund: 20 },
  rare: { name: "หายาก", price: 200, refund: 50 },
  epic: { name: "ล้ำค่า", price: 450, refund: 120 },
  legendary: { name: "ตำนาน", price: null, refund: 300 }, // ได้จากกล่องสุ่มเท่านั้น
};
const SLOTS = { avatar: "อวาตาร์", pfp: "รูปโปรไฟล์", frame: "กรอบรูป", title: "ฉายา", theme: "ธีมพิเศษ", sound: "เสียงนับคะแนน", effect: "เอฟเฟกต์ฉลอง", background: "พื้นหลัง" };

const I = (id, type, name, value, rarity, extra = {}) => ({ id, type, name, value, rarity, ...extra });
const CATALOG = [
  // อวาตาร์
  I("av-cat", "avatar", "แมวเหมียว", "🐱", "common"), I("av-dog", "avatar", "น้องหมา", "🐶", "common"), I("av-rabbit", "avatar", "กระต่าย", "🐰", "common"),
  I("av-frog", "avatar", "กบน้อย", "🐸", "common"), I("av-chick", "avatar", "ลูกเจี๊ยบ", "🐥", "common"), I("av-panda", "avatar", "แพนด้า", "🐼", "common"),
  I("av-fox", "avatar", "จิ้งจอก", "🦊", "rare"), I("av-lion", "avatar", "สิงโต", "🦁", "rare"), I("av-tiger", "avatar", "เสือ", "🐯", "rare"),
  I("av-koala", "avatar", "โคอาล่า", "🐨", "rare"), I("av-octo", "avatar", "ปลาหมึก", "🐙", "rare"),
  I("av-unicorn", "avatar", "ยูนิคอร์น", "🦄", "epic"), I("av-robot", "avatar", "หุ่นยนต์", "🤖", "epic"), I("av-alien", "avatar", "มนุษย์ต่างดาว", "👽", "epic"), I("av-dino", "avatar", "ไดโนเสาร์", "🦖", "epic"),
  I("av-dragon", "avatar", "มังกรทอง", "🐉", "legendary"), I("av-wizard", "avatar", "พ่อมดแห่งความรู้", "🧙", "legendary"), I("av-planet", "avatar", "ราชันดาวเสาร์", "🪐", "legendary"),
  // กรอบรูป
  I("fr-mint", "frame", "กรอบมิ้นต์", "mint", "common"), I("fr-sky", "frame", "กรอบฟ้าใส", "sky", "common"),
  I("fr-rainbow", "frame", "กรอบสายรุ้ง", "rainbow", "rare"), I("fr-fire", "frame", "กรอบเปลวไฟ", "fire", "rare"),
  I("fr-gold", "frame", "กรอบทองคำ", "gold", "epic"), I("fr-galaxy", "frame", "กรอบกาแล็กซีหมุนได้", "galaxy", "legendary"),
  // ฉายา
  I("ti-diligent", "title", "นักเรียนขยัน", "นักเรียนขยัน", "common"), I("ti-reader", "title", "นักอ่านตัวยง", "นักอ่านตัวยง", "common"),
  I("ti-thinker", "title", "ยอดนักคิด", "ยอดนักคิด", "rare"), I("ti-explorer", "title", "นักสำรวจ", "นักสำรวจ", "rare"),
  I("ti-genius", "title", "อัจฉริยะน้อย", "อัจฉริยะน้อย", "epic"), I("ti-math", "title", "เซียนคณิต", "เซียนคณิต", "epic"),
  I("ti-legend", "title", "ตำนานแห่ง QUIZ ODYSSEY", "ตำนานแห่ง QUIZ ODYSSEY", "legendary"),
  // ธีมพิเศษ (ใช้ในหน้าตั้งค่า)
  I("th-candy", "theme", "ธีมลูกกวาด", "candy", "rare", { colors: ["#a21caf", "#fb923c"] }),
  I("th-galaxy", "theme", "ธีมกาแล็กซี", "galaxy", "epic", { colors: ["#6d28d9", "#22d3ee"] }),
  I("th-gold", "theme", "ธีมทองคำ", "gold", "epic", { colors: ["#a16207", "#fbbf24"] }),
  I("th-aurora", "theme", "ธีมแสงเหนือ", "aurora", "legendary", { colors: ["#0e7490", "#a3e635"] }),
  // เอฟเฟกต์ฉลอง (พลุ)
  I("fx-stars", "effect", "พลุดาวระยิบ", "⭐✨🌟", "rare"), I("fx-hearts", "effect", "พลุหัวใจ", "💖💜💛", "rare"),
  I("fx-candy", "effect", "พลุลูกกวาด", "🍭🍬🧁", "epic"), I("fx-magic", "effect", "พลุสายรุ้งวิเศษ", "🌈🦄✨🎉", "legendary"),
  // พื้นหลัง
  I("bg-dots", "background", "ลายจุดน่ารัก", "dots", "common"), I("bg-stars", "background", "ลายดาวพราว", "stars", "rare"),
  I("bg-waves", "background", "ลายคลื่นทะเล", "waves", "epic"), I("bg-space", "background", "ห้วงอวกาศ", "space", "legendary"),
  // เสียงนับคะแนนตอนจบเกม (ไฟล์ใน public/sounds)
  I("snd-ka-ching", "sound", "แคชเชียร์ คา-ชิง", "ka-ching", "common", { icon: "💰" }), I("snd-register-open", "sound", "เปิดลิ้นชักเงิน", "register-open", "common", { icon: "🧾" }),
  I("snd-coins", "sound", "เหรียญหล่นบนจาน", "coins", "common", { icon: "🪙" }), I("snd-service-bell", "sound", "กริ่งเคาน์เตอร์", "service-bell", "rare", { icon: "🔔" }),
  I("snd-register-ding", "sound", "ลิ้นชักเงิน + ติ๊ง", "register-ding", "rare", { icon: "🛎️" }), I("snd-thank-you-bits", "sound", "Thank you for the bits", "thank-you-bits", "epic", { icon: "💎" }),
  // รูปโปรไฟล์วงกลม "ร่างเอ็มออนิว" (ไฟล์ใน public/pfp) ได้จากกล่องสุ่มโปรไฟล์เท่านั้น
  I("pf-robux", "pfp", "ร่างRoblox", "robux", "rare"),
  I("pf-kanjing", "pfp", "ร่างคันจริง", "kanjing", "rare"),
  I("pf-shibuden", "pfp", "ร่างชิบุเดน", "shibuden", "rare"),
  I("pf-darkpong", "pfp", "ร่างดาร์กพี่โป่งหินเหล็กไฟ", "darkpong", "epic"),
  I("pf-thong", "pfp", "ร่างทอง", "thong", "legendary"),
  I("pf-maan", "pfp", "ร่างมาร", "maan", "legendary"),
  I("pf-nosleep", "pfp", "ร่างยังไม่ได้นอน", "nosleep", "common"),
  I("pf-pakthong", "pfp", "ร่างระดับปักธง", "pakthong", "common"),
  I("pf-blindking", "pfp", "ร่างราชาตาบอด", "blindking", "epic"),
  I("pf-toilet", "pfp", "ร่างห้องน้ำมรณะ", "toilet", "epic"),
  I("pf-ompra", "pfp", "ร่างอมพระมาพูดก็ไม่เชื่อ", "ompra", "rare"),
  I("pf-magicprince", "pfp", "ร่างเจ้าชายเวทมนตร์", "magicprince", "epic"),
  I("pf-richboss", "pfp", "ร่างเสี่ยคนรวย2067", "richboss", "epic"),
  I("pf-blocky", "pfp", "ร่างเหลี่ยมจริงๆ", "blocky", "rare"),
  I("pf-coconat", "pfp", "ร่างโคโค่นัด", "coconat", "common"),
  I("pf-ij", "pfp", "ร่างปีศาจอุดร", "ij", "common"),
];
CATALOG.forEach((it) => { it.price = it.type === "pfp" ? null : RARITY[it.rarity].price; it.boxOnly = it.price == null; });
const BY_ID = Object.fromEntries(CATALOG.map((x) => [x.id, x]));

// กล่องสุ่ม: โอกาสได้ของแต่ละระดับ (เปิดเผยให้ผู้ใช้เห็น)
const BOXES = [
  { id: "basic", name: "กล่องสุ่มธรรมดา", icon: "🎁", price: 120, odds: { common: 60, rare: 28, epic: 10, legendary: 2 }, desc: "ลุ้นของทุกระดับ เปิดฟรีได้วันละ 1 ครั้ง" },
  { id: "gold", name: "กล่องสุ่มทองคำ", icon: "🏆", price: 350, odds: { common: 0, rare: 55, epic: 35, legendary: 10 }, desc: "ไม่มีของธรรมดา ลุ้นของตำนานได้มากขึ้น" },
];
BOXES.push({ id: "profile", name: "กล่องสุ่มโปรไฟล์", icon: "🎭", price: 200, pool: "pfp", odds: { common: 40, rare: 35, epic: 20, legendary: 5 }, desc: "ลุ้นรูปโปรไฟล์วงกลม “ร่างเอ็มออนิว” 16 ร่าง ใส่เป็นรูปโปรไฟล์ได้เลย" });
/** ของที่สุ่มได้จากกล่องนี้ ในระดับที่สุ่มได้ */
const boxPool = (box, rarity) => CATALOG.filter((x) => x.rarity === rarity && (box.pool ? x.type === box.pool : x.type !== "pfp"));
const BASE_PALETTES = ["violet", "ocean", "forest", "sunset", "sakura", "emerald"];
const PREMIUM_PALETTES = CATALOG.filter((x) => x.type === "theme").map((x) => x.value);

// ---------- ฐานข้อมูล ----------
const cols = db.prepare("PRAGMA table_info(users)").all().map((c) => c.name);
if (!cols.includes("coins")) {
  db.exec("ALTER TABLE users ADD COLUMN coins INTEGER NOT NULL DEFAULT 0");
  db.exec("UPDATE users SET coins = xp"); // ผู้ใช้เดิมได้เหรียญตั้งต้นเท่ากับ XP ที่สะสมไว้
}
if (!cols.includes("equipped")) db.exec("ALTER TABLE users ADD COLUMN equipped TEXT NOT NULL DEFAULT '{}'");
db.exec(`
CREATE TABLE IF NOT EXISTS user_items (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  source TEXT NOT NULL,
  acquired_at TEXT NOT NULL,
  PRIMARY KEY (user_id, item_id)
);
CREATE TABLE IF NOT EXISTS coin_tx (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_coin_tx_user ON coin_tx(user_id, created_at);
`);

function addCoins(userId, amount, reason, detail = "") {
  if (!amount) return;
  db.prepare("UPDATE users SET coins = coins + ? WHERE id = ?").run(amount, userId);
  db.prepare("INSERT INTO coin_tx (user_id, amount, reason, detail, created_at) VALUES (?,?,?,?,?)").run(userId, amount, reason, detail, now());
}
const owned = (userId) => new Set(db.prepare("SELECT item_id FROM user_items WHERE user_id=?").all(userId).map((r) => r.item_id));
const ownsSound = (userId, id) => id === "synth" || id === "custom" || owned(userId).has("snd-" + id);
const ownedIds = (userId) => [...owned(userId)];
const ownsTheme = (userId, palette) => BASE_PALETTES.includes(palette) || (PREMIUM_PALETTES.includes(palette) && owned(userId).has(CATALOG.find((x) => x.value === palette && x.type === "theme").id));

/** ของที่ใส่อยู่ → ค่าที่ใช้แสดงผล */
function equippedView(raw) {
  const e = J(raw || "{}", {});
  const out = {};
  Object.keys(SLOTS).forEach((s) => { if (e[s] && BY_ID[e[s]]?.type === s) out[s] = BY_ID[e[s]].value; });
  return out;
}
function dailyFreeAvailable(userId) {
  const { dayKey } = require("./util");
  const last = db.prepare("SELECT created_at FROM coin_tx WHERE user_id=? AND reason='free_box' ORDER BY id DESC LIMIT 1").get(userId);
  return !last || dayKey(last.created_at) !== dayKey(new Date());
}

function pickWeighted(odds) {
  const entries = Object.entries(odds).filter(([, w]) => w > 0);
  let r = crypto.randomInt(entries.reduce((s, [, w]) => s + w, 0));
  for (const [k, w] of entries) { if (r < w) return k; r -= w; }
  return entries[0][0];
}

// ---------- API ----------
const r = express.Router();

r.get("/", (req, res) => {
  const mine = req.user ? owned(req.user.id) : new Set();
  const eq = req.user ? J(db.prepare("SELECT equipped FROM users WHERE id=?").get(req.user.id).equipped, {}) : {};
  res.json({
    coins: req.user ? db.prepare("SELECT coins FROM users WHERE id=?").get(req.user.id).coins : null,
    slots: SLOTS, rarity: RARITY,
    items: CATALOG.map((x) => ({ ...x, owned: mine.has(x.id), equipped: eq[x.type] === x.id })),
    boxes: BOXES, freeBox: req.user ? dailyFreeAvailable(req.user.id) : false,
    history: req.user ? db.prepare("SELECT amount, reason, detail, created_at FROM coin_tx WHERE user_id=? ORDER BY id DESC LIMIT 12").all(req.user.id) : [],
  });
});

r.post("/buy", need(), (req, res) => {
  const it = BY_ID[req.body.itemId];
  if (!it) return res.status(404).json({ error: "ไม่พบสินค้านี้" });
  if (it.boxOnly) return res.status(400).json({ error: "ของชิ้นนี้ได้จากกล่องสุ่มเท่านั้น" });
  if (owned(req.user.id).has(it.id)) return res.status(400).json({ error: "คุณมีของชิ้นนี้แล้ว" });
  const buy = db.transaction(() => {
    const u = db.prepare("SELECT coins FROM users WHERE id=?").get(req.user.id);
    if (u.coins < it.price) throw Object.assign(new Error(`เหรียญไม่พอ (ต้องการ ${it.price} มี ${u.coins})`), { status: 400 });
    addCoins(req.user.id, -it.price, "buy", it.name);
    db.prepare("INSERT INTO user_items (user_id, item_id, source, acquired_at) VALUES (?,?,?,?)").run(req.user.id, it.id, "buy", now());
  });
  try { buy(); } catch (e) { return res.status(e.status || 500).json({ error: e.message }); }
  res.json({ ok: true, coins: db.prepare("SELECT coins FROM users WHERE id=?").get(req.user.id).coins });
});

r.post("/equip", need(), (req, res) => {
  const slot = req.body.slot;
  if (!SLOTS[slot] || slot === "theme" || slot === "sound") return res.status(400).json({ error: "ช่องนี้ใช้ไม่ได้" });
  const eq = J(db.prepare("SELECT equipped FROM users WHERE id=?").get(req.user.id).equipped, {});
  if (req.body.itemId) {
    const it = BY_ID[req.body.itemId];
    if (!it || it.type !== slot) return res.status(400).json({ error: "ของชิ้นนี้ใส่ช่องนี้ไม่ได้" });
    if (!owned(req.user.id).has(it.id)) return res.status(400).json({ error: "คุณยังไม่มีของชิ้นนี้" });
    eq[slot] = it.id;
  } else delete eq[slot];
  db.prepare("UPDATE users SET equipped=? WHERE id=?").run(JSON.stringify(eq), req.user.id);
  res.json({ ok: true, equipped: equippedView(JSON.stringify(eq)) });
});

r.post("/box", need(), (req, res) => {
  const box = BOXES.find((b) => b.id === req.body.boxId);
  if (!box) return res.status(404).json({ error: "ไม่พบกล่องนี้" });
  const free = !!req.body.free;
  if (free && (box.id !== "basic" || !dailyFreeAvailable(req.user.id))) return res.status(400).json({ error: "วันนี้เปิดกล่องฟรีไปแล้ว พรุ่งนี้มาใหม่นะ" });
  let result;
  const open = db.transaction(() => {
    const u = db.prepare("SELECT coins FROM users WHERE id=?").get(req.user.id);
    if (!free && u.coins < box.price) throw Object.assign(new Error(`เหรียญไม่พอ (ต้องการ ${box.price} มี ${u.coins})`), { status: 400 });
    if (free) db.prepare("INSERT INTO coin_tx (user_id, amount, reason, detail, created_at) VALUES (?,?,?,?,?)").run(req.user.id, 0, "free_box", box.name, now());
    else addCoins(req.user.id, -box.price, "box", box.name);
    const rarity = pickWeighted(box.odds);
    const pool = boxPool(box, rarity);
    const it = pool[crypto.randomInt(pool.length)];
    const dup = owned(req.user.id).has(it.id);
    if (dup) addCoins(req.user.id, RARITY[rarity].refund, "duplicate", it.name);
    else db.prepare("INSERT INTO user_items (user_id, item_id, source, acquired_at) VALUES (?,?,?,?)").run(req.user.id, it.id, "box", now());
    result = { item: it, rarity, rarityName: RARITY[rarity].name, duplicate: dup, refund: dup ? RARITY[rarity].refund : 0 };
  });
  try { open(); } catch (e) { return res.status(e.status || 500).json({ error: e.message }); }
  res.json({ ...result, coins: db.prepare("SELECT coins FROM users WHERE id=?").get(req.user.id).coins, freeBox: dailyFreeAvailable(req.user.id) });
});

module.exports = { router: r, addCoins, equippedView, ownsTheme, ownsSound, ownedIds, boxPool, CATALOG, BOXES, RARITY, SLOTS, BASE_PALETTES, PREMIUM_PALETTES };
