// ✨ ข้อมูลตัวละครอัญเชิญ 17 ตัว (ใช้ร่วมกัน: หน้าอัญเชิญ, ฉากต่อสู้ตอบคำถาม, ตัวจำลอง API ในเบราว์เซอร์)
// ภาพตัวละคร 64px อยู่ที่ gacha/sprites.js (ตัวแปร QO_SPR: id_0 ร่างปกติ, id_1 ร่างตื่นพลัง, id_n0-3 ท่ายืน, id_a0-3 ท่ายืนร่างตื่นพลัง)
// เพชร 💎 ได้จากการตอบคำถามถูกเท่านั้น ไม่มีการซื้อด้วยเงินจริง · อัตราการออกแสดงให้ผู้เล่นเห็นในหน้าอัญเชิญ

export const RN = { 3: "ธรรมดา", 4: "เลเจนดารี", 5: "มิสติก" };
export const COST = 160, PITY = 50, MAX_STAGE = 6;
export const STARTERS = ["thara", "wayu", "pisa", "prakai"];
export const GUIDE = "mira"; // ผู้นำทางในบทสอนเล่น

// ความสามารถติดตัว (ทำงานในฉากต่อสู้ตอบคำถาม)
export const PASSIVE = {
  shield: { n: "โล่สายน้ำ", d: "กันการโจมตีสวนของบอสได้ 1 ครั้งต่อด่าน" },
  wind: { n: "ลมพัดตัวลวง", d: "ทุก 3 ข้อ ลมพัดการ์ดคำตอบผิดทิ้ง 1 ใบ (ข้อที่มีตัวเลือก 3 ข้อขึ้นไป)" },
  acid: { n: "กรดเหนียวแน่น", d: "ตอบผิดครั้งแรกของด่าน คอมโบไม่หาย" },
  purify: { n: "แสงชำระ", d: "ไม่โดนคำสาปของบอส (หมอก เถาวัลย์ มิติบิดเบี้ยว)" },
  fast: { n: "เพลิงปลุกพลัง", d: "ตื่นพลังเมื่อคอมโบ 2 (ตัวอื่นต้องคอมโบ 3)" },
  gem: { n: "ล่าเพชร", d: "จบด่านได้เพชรเพิ่ม 30%" },
  dark: { n: "ม่านรัตติกาล", d: "บอสโกรธจัดแล้วสวนแค่ครั้งเดียว และบอสดูดวิญญาณฟื้นเลือดไม่ได้" },
};

// fx = สกิลที่สุ่มขึ้นการ์ดคำตอบ · ult = ท่าไม้ตายตอนร่างตื่นพลัง · hue = หมุนสีเอฟเฟกต์ให้เข้ากับธาตุ
// line = คำพูดตอนตื่นพลัง (แสดงในกล่องข้อความ)
const C = (n, r, t, el, ic, f, sk, col, sc, th, pas, fx, ult, hue, line) => ({ n, r, t, el, ic, f, sk, col, sc, th, pas, fx, ult, hue, line });
export const ROSTER = {
  // ★3 ธรรมดา
  thara: C("ธารา", 3, "นักเวทฝึกหัดแห่งสายน้ำ", "น้ำ", "💧", "ธาราประกายคลื่น", "ลูกแก้วน้ำกระเซ็น", "#7ac8ff", "#0a2a4a", "water", ["shield"],
    ["ice-shard", "frost-wheel", "tidal-surge"], "tidal-surge", 0, "สายน้ำเอ๋ย ช่วยฉันหน่อยนะ!"),
  wayu: C("วายุ", 3, "นักธนูสายลม", "ลม", "🍃", "ศรวายุพลิ้ว", "ศรลมหมุนวน", "#8af0b0", "#0a3a1a", "wind", ["wind"],
    ["spiral-gale", "wind-vortex", "dust-devil"], "wind-vortex", 0, "ลมพัดมาทางนี้แล้ว ยิงเลย!"),
  pisa: C("พิษา", 3, "นักเล่นแร่ฝึกหัด", "กรด", "🧪", "นักปรุงพิษเดือด", "ขวดกรดระเบิด", "#b0ff50", "#1a3a0a", "acid", ["acid"],
    ["venom-stream", "venom-pool", "thorn-crown"], "venom-pool", 0, "สูตรลับเดือดพล่านแล้ว!"),
  prakai: C("ประกาย", 3, "ภิกษุถือตะเกียงแสง", "แสง", "☀️", "ตะเกียงอรุณรุ่ง", "แสงตะเกียงชำระ", "#ffe070", "#4a3a10", "light", ["purify"],
    ["electric-magic-arrow-strike", "charged-beam", "golden-chain-rain"], "golden-chain-rain", 0, "แสงตะเกียงนำทางเราแล้ว!"),
  // ★4 เลเจนดารี
  kage: C("คาเงะ", 4, "คุโนอิจิอสูรสายฟ้า", "สายฟ้า", "⚡", "อสูรสายฟ้าเงา", "จักรอสนีเงา", "#c8a8ff", "#2a1a5a", "", ["gem"],
    ["plasma-bolt", "arc-ray", "thunder-strike"], "energy-burst", 300, "เงาสายฟ้า… ฟาด!"),
  en: C("เอ็น", 4, "ซามูไรเพลิงพิฆาต", "ไฟ", "🔥", "เพลิงสะบั้นฟ้า", "อิไอ·ดาบเพลิงสะบั้น", "#ffb070", "#4a1a0a", "", ["fast"],
    ["fireball", "flame-surge", "fire-explosion"], "fire-vortex", 0, "ดาบเพลิง… สะบั้น!"),
  marina: C("มารีน่า", 4, "อัศวินตรีศูลแห่งท้องทะเล", "น้ำ", "💧", "ราชินีกระแสคลื่น", "ตรีศูลคลื่นยักษ์", "#5ab8ff", "#0a2a5a", "water", ["shield"],
    ["ice-shard", "tidal-surge", "frost-lance-rain"], "tidal-surge", 0, "คลื่นยักษ์ จงตื่นขึ้น!"),
  fuka: C("ฟูกะ", 4, "นักระบำพัดสายลม", "ลม", "🍃", "ระบำพายุหยก", "พัดคู่พายุหมุน", "#7ae0c0", "#0a3a2a", "wind", ["wind"],
    ["spiral-gale", "wind-vortex", "billowing-airburst"], "wind-vortex", 0, "มาร่ายรำไปกับพายุกัน!"),
  lumen: C("ลูเมน", 4, "อัศวินโล่แสง", "แสง", "☀️", "อัศวินปีกอรุณ", "ค้อนแสงพิพากษา", "#ffd860", "#4a3a0a", "light", ["purify"],
    ["charged-beam", "electric-magic-arrow-strike", "golden-chain-rain"], "golden-chain-rain", 0, "ปีกแห่งอรุณ จงกางออก!"),
  veno: C("เวโน", 4, "นักล่ากรงเล็บพิษ", "กรด", "🧪", "อสูรกรดเขียว", "กรงเล็บกรดกัดกร่อน", "#9aff40", "#123a08", "acid", ["acid"],
    ["venom-stream", "thorn-crown", "venom-pool"], "venom-pool", 0, "กรงเล็บกรด… ฉีก!"),
  // ★5 มิสติก
  salmon: C("แซลม่อน", 5, "นักรบหอกวิญญาณ", "วิญญาณจักรวาล", "🌌", "วิญญาณจักรวาล", "ระเบิดดาราจักรวิญญาณ", "#7affd8", "#0a4a44", "", ["shield", "purify"],
    ["azure-sweep", "arcane-missile", "astral-convergence"], "astral-convergence", 80, "วิญญาณของฉันคือจักรวาลทั้งใบ!"),
  mira: C("มิระ", 5, "จอมเวทแห่งดวงดาว", "ดวงดาว", "✦", "ราตรีดวงดาว", "ดาวตกแห่งคำอธิษฐาน", "#ffe08a", "#4a3a10", "", ["purify", "gem"],
    ["arcane-missile", "astral-convergence", "starblade-cataclysm"], "starblade-cataclysm", 0, "ดวงดาวทั้งฟ้า จงฟังคำอธิษฐาน!"),
  ryujin: C("ริวจิน", 5, "อัศวินราชันมังกร", "มังกรเพลิง", "🐉", "ราชันมังกรเพลิง", "ดาบราชันมังกรผ่าปฐพี", "#ff7a50", "#4a1408", "", ["fast", "shield"],
    ["fireball", "magma-fissure", "flame-surge"], "magma-fissure", 0, "มังกรเพลิง… ผ่าปฐพี!"),
  mora: C("โมรา", 5, "เนโครแมนเซอร์หัวกะโหลก", "เนโครแมนเซอร์", "💀", "ราชินีปีกกระดูก", "อัญเชิญวิญญาณกระดูก", "#6affa8", "#0a2a1a", "necro", ["dark", "gem"],
    ["soul-siphon", "shadow-glaive", "arcane-missile"], "soul-siphon", 150, "วิญญาณทั้งหลาย ตื่นขึ้นมาช่วยข้า!"),
  nox: C("นอกซ์", 5, "อัศวินแห่งความมืด", "ความมืด", "🌑", "จ้าวรัตติกาล", "ดาบดับแสง", "#b080ff", "#1a0a3a", "dark", ["dark", "acid"],
    ["shadow-glaive", "arcane-missile", "black-hole"], "black-hole", 0, "ราตรีนิรันดร์… มาถึงแล้ว"),
  asura: C("อสุรา", 5, "นักดาบอัคคีมืด", "ไฟความมืด", "☄️", "อสูรเพลิงนิล", "ฟันเพลิงทมิฬ", "#d060ff", "#2a0640", "darkfire", ["fast", "dark"],
    ["fireball", "flame-surge", "fire-vortex"], "fire-explosion", 105, "เพลิงทมิฬ… เผาให้สิ้น!"),
  zephyrus: C("เซฟิรัส", 5, "จอมเวทพายุ", "พายุ", "🌪️", "จักรพรรดิพายุ", "พายุสายฟ้าหมุนฟ้า", "#ffe860", "#3a3008", "storm", ["wind", "gem"],
    ["spiral-gale", "thunder-strike", "arc-ray"], "energy-burst", 0, "ลมและสายฟ้า จงรวมเป็นหนึ่ง!"),
};
export const IDS = Object.keys(ROSTER);
export const POOL = { 5: IDS.filter((k) => ROSTER[k].r === 5), 4: IDS.filter((k) => ROSTER[k].r === 4), 3: IDS.filter((k) => ROSTER[k].r === 3) };
export const FEATURED = "salmon";

// ไอเทม ★3 จากการอัญเชิญ: ใช้ได้จริงในเกม
export const ITEMS = {
  coin: { n: "เหรียญทอง ×50", ic: "🪙", d: "ได้เหรียญ 50 ทันที (ใช้ในร้านค้า)" },
  hint: { n: "การ์ดคำใบ้", ic: "💡", d: "ใช้ตอนสู้บอส: ตัดการ์ดคำตอบผิดออก 1 ใบ" },
  pot: { n: "ยาฟื้นพลัง", ic: "🧪", d: "ใช้ตอนสู้บอส: กันการโจมตีสวนครั้งถัดไป" },
  shard: { n: "ชิ้นส่วนดาว", ic: "⭐", d: "สะสมครบ 10 ชิ้น แลกอัญเชิญฟรี 1 ครั้ง" },
  luck: { n: "เครื่องรางนำโชค", ic: "🍀", d: "ด่านถัดไปได้เพชร ×2 (ใช้อัตโนมัติ)" },
};
export const ITEM_KEYS = Object.keys(ITEMS);
export const SHARDS_PER_PULL = 10;

// อัตรา: มิสติก 2% (ตัวแนะนำครึ่งหนึ่ง) · เลเจนดารี 13% · ธรรมดา 85% (ตัวละคร 40% ไอเทม 45%)
export const RATES = { 5: 2, 4: 13, ch3: 40, item: 45 };
/** สุ่ม 1 ครั้ง (แก้ค่า pity/cnt ใน g) */
export function rollOnce(g, forceMin = false, rnd = Math.random) {
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  g.cnt = (g.cnt || 0) + 1; g.pity = (g.pity || 0) + 1;
  const r = rnd() * 100; let rar = r < RATES[5] ? 5 : r < RATES[5] + RATES[4] ? 4 : 3;
  if (g.pity >= PITY) rar = 5;
  if (forceMin && rar < 4) rar = 4;
  if (rar === 5) { g.pity = 0; return { type: "ch", id: rnd() < 0.5 ? FEATURED : pick(POOL[5].filter((k) => k !== FEATURED)), rar: 5 }; }
  if (rar === 4) return { type: "ch", id: pick(POOL[4]), rar: 4 };
  if (rnd() < RATES.ch3 / (RATES.ch3 + RATES.item)) return { type: "ch", id: pick(POOL[3]), rar: 3 };
  return { type: "it", it: pick(ITEM_KEYS), rar: 3 };
}

// เพชรที่ได้: ตอบถูกข้อละ 10 (แบบทดสอบข้อละ 5) · ปราบบอสได้ +30
export const GEM = { perGame: 10, perQuiz: 5, bossWin: 30, welcome: 1600 };
/** โบนัสเพชรของตัวละครที่ใช้: ล่าเพชร +30% · ขั้นพลังละ +5% */
export function gemBonus(id, stage = 0) {
  const c = ROSTER[id]; if (!c) return 0;
  return (c.pas.includes("gem") ? 0.3 : 0) + Math.max(0, Math.min(MAX_STAGE, stage)) * 0.05;
}
export const hasPas = (id, p) => !!ROSTER[id]?.pas.includes(p);
