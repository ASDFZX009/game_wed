// 🗺️ เส้นทางความคืบหน้า (ใช้ร่วมกันระหว่างหน้าเว็บและ API ในเครื่อง)
// ดาว 1–3 ต่อบทเรียนต่อระดับ · ระดับยาก/ยากมากปลดล็อกเมื่อได้ดาวที่ระดับก่อนหน้า · สะสมดาวรับรางวัล · สมุดล่าบอส · ยศตามเลเวล

export const STAR_RULE = [[1, 1], [0.8, 2], [0.6, 1]]; // [สัดส่วนคะแนน, ดาว] — เต็ม = 3 ดาว
export function starsFor(score, max) { if (!max) return 0; const p = score / max; return p >= 1 ? 3 : p >= 0.8 ? 2 : p >= 0.6 ? 1 : 0; }

// ระดับ 1–3 เปิดตั้งแต่แรก ระดับ 4 ต้องมีดาวที่ระดับ 3, ระดับ 5 ต้องมีดาวที่ระดับ 4
export const OPEN_LEVELS = 3;
export function lockedLevels(byLevel = {}) { const out = []; for (let L = OPEN_LEVELS + 1; L <= 5; L++) if (!(byLevel[L - 1] > 0)) out.push(L); return out; }

// รางวัลสะสมดาว (กดรับที่สมุดผจญภัย)
export const MILESTONES = [
  { at: 3, coins: 30, icon: "🎁", name: "ก้าวแรกของนักผจญภัย" },
  { at: 10, coins: 60, icon: "🎁", name: "นักล่าดาวมือใหม่" },
  { at: 20, coins: 100, icon: "👑", name: "ปลดล็อกบอสร่างจ้าว", elite: true },
  { at: 35, coins: 150, icon: "🎁", name: "ผู้พิชิตหลายแดน" },
  { at: 50, coins: 200, icon: "💎", name: "นักสะสมดาวตัวยง" },
  { at: 75, coins: 300, icon: "💎", name: "ดาวเต็มย่าม" },
  { at: 100, coins: 400, icon: "🏆", name: "ร้อยดาวแห่งโอดิสซีย์" },
  { at: 150, coins: 600, icon: "🏆", name: "ผู้ไขปริศนาทั้งปวง" },
  { at: 250, coins: 1000, icon: "🌟", name: "ตำนานนักผจญภัย" },
];
export const ELITE_AT = MILESTONES.find((m) => m.elite).at;

// ยศตามเลเวลผู้เล่น
export const RANKS = [[1, "นักผจญภัยฝึกหัด", "🪵"], [3, "นักสำรวจ", "🧭"], [5, "อัศวินความรู้", "🛡️"], [8, "ปราชญ์ผู้กล้า", "📜"], [12, "ผู้พิทักษ์ปัญญา", "🔮"], [18, "ตำนานแห่งโอดิสซีย์", "🌟"]];
export function rankOf(level) { let r = RANKS[0]; for (const x of RANKS) if (level >= x[0]) r = x; return { name: r[1], icon: r[2], next: RANKS.find((x) => x[0] > level)?.[0] || null }; }

// บอส (id ต้องตรงกับ bosses.js) — แต่ละตัวมีระดับความหายาก สกิลประจำตัว (trait) และชุดท่าโจมตีของตัวเอง
export const RARITY = {
  common: { name: "ทั่วไป", icon: "⚪", color: "#c8ccd8", bonus: 0, lv: 0 },
  rare: { name: "หายาก", icon: "🔷", color: "#4aa8ff", bonus: 15, lv: 3 },
  epic: { name: "หายากมาก", icon: "🔮", color: "#c070ff", bonus: 35, lv: 6 },
  legend: { name: "ตำนาน", icon: "🌟", color: "#ffb020", bonus: 80, lv: 10 },
};
export const SHINY = { chance: 0.03, bonus: 30, name: "ร่างทองคำ" };
export const BOSS_LIST = [
  { id: "warden", rarity: "common", name: "ผู้คุมวิญญาณไร้หน้า", elite: "จ้าวผู้คุมวิญญาณ", lore: "เฝ้าห้องสมุดร้างพร้อมโคมวิญญาณ กลัวคนที่ตอบคำถามได้ถูกต้อง",
    trait: { id: "soul", name: "ดูดวิญญาณ", desc: "ตอบผิด → บอสดูดพลังฟื้นเลือด 1 ช่อง" }, skills: ["ดูดวิญญาณ", "ใบมีดเงา", "หลุมดำกลืนแสง"] },
  { id: "knight", rarity: "common", name: "อัศวินหนามเงา", elite: "จ้าวอัศวินหนามเงา", lore: "อัศวินที่ลืมทุกอย่างที่เคยเรียน ดาบใหญ่ของเขาเรืองแสงเมื่อเจอคำตอบผิด",
    trait: { id: "shield", name: "โล่หนาม", desc: "เลือดเหลือครึ่ง → ตั้งโล่หนาม ต้องตอบถูกเพื่อทุบโล่ให้แตก" }, skills: ["อสนีฟาดดาบ", "ลำแสงดาบหนาม", "ระเบิดเกราะสายฟ้า"] },
  { id: "druid", rarity: "common", name: "นักบวชเขากวางแห่งป่าลึก", elite: "จ้าวนักบวชป่าลึก", lore: "ผู้ซ่อนความรู้ไว้ในรากไม้ ต้องตอบให้ถูกเท่านั้นเขาจึงยอมถอย",
    trait: { id: "vines", name: "เถาวัลย์พันการ์ด", desc: "ตอบผิด → การ์ดข้อถัดไปโดนเถาวัลย์พัน ต้องรอแกะออกครู่หนึ่ง" }, skills: ["มงกุฎหนามรัด", "สายพิษกัดกร่อน", "บ่อพิษเดือด"] },
  { id: "wraith", rarity: "rare", name: "วิญญาณกะโหลกเขาแกะ", elite: "จ้าววิญญาณเขาแกะ", lore: "ถือตะเกียงนำทางวิญญาณหลงทาง หมอกของมันทำให้มองไม่เห็นสกิลบนการ์ด",
    trait: { id: "fog", name: "หมอกวิญญาณ", desc: "ตอบผิด → หมอกบังสกิลบนการ์ดข้อถัดไป (ยังเห็นคำตอบ)" }, skills: ["หมอกเยือกแข็ง", "เศษกระดูกน้ำแข็ง", "ฝนวิญญาณ"] },
  { id: "reaper", rarity: "rare", name: "นักบวชเงาไม้เท้ากะโหลก", elite: "จ้าวนักบวชเงา", lore: "สะสมวิญญาณจากคำตอบที่ผิด ครบสามดวงเมื่อไรจะร่ายเพลิงพิพากษา",
    trait: { id: "souls", name: "เก็บวิญญาณ", desc: "ทุกครั้งที่ตอบผิดเก็บวิญญาณ 1 ดวง ครบ 3 ดวง → ปล่อยท่าไม้ตาย" }, skills: ["ลูกไฟนรก", "คลื่นเพลิงพิพากษา", "วงเพลิงยมโลก"] },
  { id: "lich", rarity: "epic", name: "จอมเวทชาดผู้หลับใหล", elite: "จ้าวจอมเวทชาด", lore: "หลับอยู่ในหอคอยมาพันปี ลูกแก้วในมือบิดมิติจนการ์ดสลับที่กันเอง",
    trait: { id: "shuffle", name: "บิดมิติ", desc: "ตอบผิด → การ์ดข้อถัดไปสลับตำแหน่งวนไปมา" }, skills: ["ขีปนาวุธรูน", "จักรมิติ", "โซ่ทองตรึงวิญญาณ"] },
  { id: "shade", rarity: "legend", name: "จ้าวปีกราตรี", elite: "ราชันปีกราตรี", lore: "ปรากฏตัวเฉพาะคืนที่ไร้ดาว หายตัวไปมาทุกเทิร์น พบเจอได้ยากที่สุด",
    trait: { id: "blink", name: "หายตัว", desc: "หายตัวย้ายที่ทุกข้อ และโกรธจัดเร็วกว่าตัวอื่น (เลือดเหลือครึ่ง)" }, skills: ["ใบมีดราตรี", "สายฟ้าม่วง", "กวาดดาบราตรี"] },
];
export const bossInfo = (id) => BOSS_LIST.find((b) => b.id === id) || null;
// น้ำหนักโอกาสพบตามระดับความยาก (ยิ่งยาก ยิ่งเจอตัวหายาก) · ด่านบอสประจำบทเพิ่มโอกาสตัวหายากมาก/ตำนาน
export function rarityWeights(level = 2, storyBoss = false) {
  const L = Math.max(1, Math.min(5, +level || 2)), w = { common: 60, rare: 18 + 2 * L, epic: 4 + 1.2 * L, legend: 0.8 + 0.5 * L };
  if (storyBoss) { w.epic *= 1.4; w.legend *= 2; }
  return w;
}
// โอกาส (%) ที่จะพบบอสแต่ละตัว
export function bossChances(level = 3, storyBoss = false) {
  const w = rarityWeights(level, storyBoss), sum = Object.values(w).reduce((a, b) => a + b, 0), out = {};
  for (const b of BOSS_LIST) out[b.id] = (w[b.rarity] / sum / BOSS_LIST.filter((x) => x.rarity === b.rarity).length) * 100;
  return out;
}
function hashStr(s) { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; }
// สุ่มบอสที่จะพบในการเล่นครั้งนี้ — ระดับ 4–5 และปลดล็อกร่างจ้าวแล้ว → เป็นร่างจ้าว · มีโอกาสเล็กน้อยเป็นร่างทองคำ
export function pickBoss(lessonKey, level = 2, eliteUnlocked = false, { storyBoss = false, rand = Math.random } = {}) {
  const force = globalThis.__qoForceBoss; // ใช้ในสคริปต์ทดสอบเท่านั้น
  if (force && bossInfo(force.id)) { const b = bossInfo(force.id), elite = !!eliteUnlocked && level >= 4; return { id: b.id, name: elite ? b.elite : b.name, elite, shiny: !!force.shiny, rarity: b.rarity, lv: 3 + level * 6 + RARITY[b.rarity].lv + (elite ? 10 : 0) }; }
  const w = rarityWeights(level, storyBoss), sum = Object.values(w).reduce((a, b) => a + b, 0);
  let r = rand() * sum, rarity = "common"; for (const [k, v] of Object.entries(w)) { if (r < v) { rarity = k; break; } r -= v; }
  const pool = BOSS_LIST.filter((b) => b.rarity === rarity), b = pool[Math.floor(rand() * pool.length) % pool.length], elite = !!eliteUnlocked && level >= 4, shiny = rand() < SHINY.chance;
  return { id: b.id, name: elite ? b.elite : b.name, elite, shiny, rarity, lv: 3 + level * 6 + (hashStr(lessonKey + "lv") % 5) + RARITY[rarity].lv + (elite ? 10 : 0) };
}
// รางวัลเหรียญพิเศษเมื่อปราบบอส (ตามความหายาก + ร่างทองคำ + ร่างจ้าว)
export function bossBonus(rarity, shiny, elite) { return Math.round(((RARITY[rarity]?.bonus || 0) + (shiny ? SHINY.bonus : 0)) * (elite ? 1.5 : 1)); }
