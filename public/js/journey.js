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

// บอส (ชื่อ/ลำดับต้องตรงกับ bosses.js)
export const BOSS_LIST = [
  { id: "warden", name: "ผู้คุมวิญญาณไร้หน้า", elite: "จ้าวผู้คุมวิญญาณ", lore: "เฝ้าห้องสมุดร้างพร้อมโคมวิญญาณ กลัวคนที่ตอบคำถามได้ถูกต้อง" },
  { id: "knight", name: "อัศวินหนามเงา", elite: "จ้าวอัศวินหนามเงา", lore: "อัศวินที่ลืมทุกอย่างที่เคยเรียน ดาบใหญ่ของเขาเรืองแสงเมื่อเจอคำตอบผิด" },
  { id: "druid", name: "นักบวชเขากวางแห่งป่าลึก", elite: "จ้าวนักบวชป่าลึก", lore: "ผู้ซ่อนความรู้ไว้ในรากไม้ ต้องตอบให้ถูกเท่านั้นเขาจึงยอมถอย" },
];
function hashStr(s) { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; }
// เลือกบอสของบทเรียน (คงที่ต่อบทเรียน) — ระดับ 4–5 และปลดล็อกร่างจ้าวแล้ว → เป็นร่างจ้าว
export function pickBoss(lessonKey, level = 2, eliteUnlocked = false) {
  const i = hashStr(lessonKey) % BOSS_LIST.length, b = BOSS_LIST[i], elite = !!eliteUnlocked && level >= 4;
  return { id: b.id, name: elite ? b.elite : b.name, elite, lv: 3 + level * 6 + (hashStr(lessonKey + "lv") % 5) + (elite ? 10 : 0) };
}
