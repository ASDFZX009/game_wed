// ภาษาไทยและภาษาอังกฤษตามชั้นเรียน: ตารางข้อมูลรายชั้น + ตัวสร้างโจทย์ (สุ่มใหม่ทุกครั้ง)
const pk = (r, arr) => arr[Math.floor(r() * arr.length)];
const pickN = (r, arr, n, not) => { const out = []; const pool = arr.filter((x) => !not.includes(x)); while (out.length < n && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]); return out; };

// ================= ภาษาไทย =================
const CONS = "ก ไก่|ข ไข่|ฃ ขวด|ค ควาย|ฅ คน|ฆ ระฆัง|ง งู|จ จาน|ฉ ฉิ่ง|ช ช้าง|ซ โซ่|ฌ เฌอ|ญ หญิง|ฎ ชฎา|ฏ ปฏัก|ฐ ฐาน|ฑ มณโฑ|ฒ ผู้เฒ่า|ณ เณร|ด เด็ก|ต เต่า|ถ ถุง|ท ทหาร|ธ ธง|น หนู|บ ใบไม้|ป ปลา|ผ ผึ้ง|ฝ ฝา|พ พาน|ฟ ฟัน|ภ สำเภา|ม ม้า|ย ยักษ์|ร เรือ|ล ลิง|ว แหวน|ศ ศาลา|ษ ฤๅษี|ส เสือ|ห หีบ|ฬ จุฬา|อ อ่าง|ฮ นกฮูก".split("|").map((x) => x.split(" "));
const MID = "กจฎฏดตบปอ", HIGH = "ขฃฉฐถผฝศษสห";
const classOf = (c) => (MID.includes(c) ? "อักษรกลาง" : HIGH.includes(c) ? "อักษรสูง" : "อักษรต่ำ");
const MATRA = { "แม่กก": ["นก", "ผัก", "เมฆ", "สุข", "โรค", "เลข", "จักร"], "แม่กด": ["มด", "รถ", "กิจ", "พุธ", "อากาศ", "ประเทศ", "รส", "ตรวจ"], "แม่กบ": ["กบ", "ภาพ", "ลาภ", "กราฟ", "บาป", "รูป", "ยีราฟ"],
  "แม่กง": ["กาง", "ลิง", "ช้าง", "ลุง", "ทอง", "แตง"], "แม่กน": ["บ้าน", "คุณ", "พร", "ผล", "สูญ", "กุศล", "ปืน"], "แม่กม": ["ลม", "ส้ม", "ธรรม", "ชิม", "ขนม"], "แม่เกย": ["ยาย", "ขาย", "เลย", "ปุ๋ย", "สวย"], "แม่เกอว": ["แมว", "ข้าว", "เหว", "เปรี้ยว", "ขาว"], "แม่ ก กา": ["ปลา", "ตา", "มือ", "หู", "เสือ"] };
const DEAD = ["จด", "มด", "นก", "จับ", "เตะ", "ปะ", "ศพ", "เลข", "กิจ"], LIVE = ["นา", "ลม", "ขาว", "กิน", "ใจ", "ไป", "ทำ", "เรา", "ปลา"];
const CLF = [["ช้าง", "เชือก"], ["รถยนต์", "คัน"], ["บ้าน", "หลัง"], ["ปากกา", "ด้าม"], ["ดินสอ", "แท่ง"], ["หนังสือ", "เล่ม"], ["กระดาษ", "แผ่น"], ["เสื้อ", "ตัว"], ["ต้นไม้", "ต้น"], ["พระสงฆ์", "รูป"],
  ["แหวน", "วง"], ["เรือ", "ลำ"], ["ฟัน", "ซี่"], ["ขลุ่ย", "เลา"], ["ไข่", "ฟอง"], ["จดหมาย", "ฉบับ"], ["ถนน", "สาย"], ["ประตู", "บาน"], ["ดาว", "ดวง"], ["ลูกบอล", "ลูก"], ["กระดุม", "เม็ด"], ["ร่ม", "คัน"], ["ยักษ์", "ตน"], ["ตึก", "หลัง"], ["ผม", "เส้น"]];
const POS = { "คำนาม": ["แมว", "โรงเรียน", "ครู", "ดอกไม้", "ทะเล"], "คำกริยา": ["วิ่ง", "กิน", "เขียน", "นอน", "ร้องเพลง"], "คำวิเศษณ์": ["สวย", "เร็ว", "ใหญ่", "ร้อน", "เสมอ"], "คำสรรพนาม": ["ฉัน", "เขา", "เรา", "ท่าน", "เธอ"],
  "คำสันธาน": ["และ", "แต่", "หรือ", "เพราะ", "จึง"], "คำบุพบท": ["ใน", "บน", "ของ", "ใต้", "แก่"], "คำอุทาน": ["โอ๊ย", "ว้าว", "อุ๊ย", "เฮ้อ", "โธ่"] };
const ROYAL = [["กิน", "เสวย"], ["นอน", "บรรทม"], ["ไป", "เสด็จ"], ["พูด", "ตรัส"], ["อาบน้ำ", "สรงน้ำ"], ["เจ็บป่วย", "ประชวร"], ["ดู", "ทอดพระเนตร"], ["นั่ง", "ประทับ"], ["ให้", "พระราชทาน"],
  ["ผม", "พระเกศา"], ["ตา", "พระเนตร"], ["หู", "พระกรรณ"], ["มือ", "พระหัตถ์"], ["เท้า", "พระบาท"], ["ปาก", "พระโอษฐ์"], ["ฟัน", "พระทนต์"], ["จมูก", "พระนาสิก"], ["หน้า", "พระพักตร์"], ["ลูกชาย", "พระราชโอรส"], ["ลูกสาว", "พระราชธิดา"]];
const LOAN = [["คอมพิวเตอร์", "อังกฤษ"], ["ฟุตบอล", "อังกฤษ"], ["คุกกี้", "อังกฤษ"], ["เก้าอี้", "จีน"], ["ก๋วยเตี๋ยว", "จีน"], ["ตะหลิว", "จีน"], ["กุยช่าย", "จีน"], ["เสด็จ", "เขมร"], ["ถนน", "เขมร"], ["ตำรวจ", "เขมร"],
  ["บำเพ็ญ", "เขมร"], ["ศาสนา", "สันสกฤต"], ["กษัตริย์", "สันสกฤต"], ["ศึกษา", "สันสกฤต"], ["จิต", "บาลี"], ["วิชา", "บาลี"], ["สึนามิ", "ญี่ปุ่น"], ["ซูชิ", "ญี่ปุ่น"], ["ทุเรียน", "มลายู"], ["กำปั่น", "มลายู"]];
const IDIOM = [["น้ำขึ้นให้รีบตัก", "มีโอกาสดีควรรีบทำ"], ["ไก่ได้พลอย", "ได้ของมีค่าแต่ไม่รู้คุณค่า"], ["ตำน้ำพริกละลายแม่น้ำ", "ใช้จ่ายสิ้นเปลืองโดยไม่ได้ประโยชน์"], ["กระต่ายตื่นตูม", "ตกใจง่ายโดยไม่ไตร่ตรอง"],
  ["ขี่ช้างจับตั๊กแตน", "ลงทุนมากแต่ได้ผลน้อย"], ["ปิดทองหลังพระ", "ทำความดีโดยไม่หวังให้ใครเห็น"], ["น้ำร้อนปลาเป็น น้ำเย็นปลาตาย", "พูดจาอ่อนหวานได้ผลดีกว่าพูดแข็งกร้าว"], ["วัวหายล้อมคอก", "เกิดเรื่องแล้วจึงคิดป้องกัน"],
  ["เข้าเมืองตาหลิ่วต้องหลิ่วตาตาม", "ทำตัวให้เข้ากับสังคมที่ไปอยู่"], ["ชักใบให้เรือเสีย", "พูดหรือทำให้เรื่องออกนอกทาง"], ["ฆ่าควายเสียดายพริก", "ทำการใหญ่แต่ตระหนี่ในสิ่งเล็กน้อย"], ["หนีเสือปะจระเข้", "หนีภัยหนึ่งแต่ไปเจออีกภัยหนึ่ง"],
  ["กินบนเรือนขี้บนหลังคา", "เนรคุณผู้มีพระคุณ"], ["คางคกขึ้นวอ", "คนต่ำต้อยได้ดีแล้วลืมตัว"], ["สีซอให้ควายฟัง", "แนะนำสั่งสอนคนที่ไม่เข้าใจ ไม่เกิดประโยชน์"], ["ช้าเป็นการ นานเป็นคุณ", "ทำอย่างรอบคอบดีกว่ารีบร้อน"]];
const BUILD = { "คำซ้อน": ["บ้านเรือน", "เสื่อสาด", "ข้าวของ", "ทรัพย์สิน", "ถ้วยชาม", "เล็กน้อย"], "คำประสม": ["แม่น้ำ", "รถไฟ", "น้ำแข็ง", "ตู้เย็น", "ปากกา", "ลูกเสือ"], "คำซ้ำ": ["เด็ก ๆ", "ดี ๆ", "เร็ว ๆ", "ช้า ๆ", "เพื่อน ๆ"], "คำมูล": ["นาฬิกา", "กระดาษ", "มะม่วง", "ทะเล", "สับปะรด"] };
const PALI = { "คำสมาส": ["ราชการ", "ประวัติศาสตร์", "วิทยาศาสตร์", "สุขภาพ", "อุบัติเหตุ", "ภูมิศาสตร์"], "คำสนธิ": ["วิทยาลัย", "ธนาคาร", "มหัศจรรย์", "นโยบาย", "สุขาภิบาล", "ราชูปถัมภ์"], "คำประสม": ["ราชวัง", "พลเมือง", "รถยนต์", "ทุกข์ใจ"] };
const SANDHI = [["วิทยาลัย", "วิทยา + อาลัย"], ["ธนาคาร", "ธน + อาคาร"], ["มหัศจรรย์", "มหา + อัศจรรย์"], ["นโยบาย", "นย + อุบาย"], ["สุขาภิบาล", "สุข + อภิบาล"], ["ราชูปถัมภ์", "ราช + อุปถัมภ์"],
  ["หิมาลัย", "หิม + อาลัย"], ["ธรรมาสน์", "ธรรม + อาสน์"], ["กุศโลบาย", "กุศล + อุบาย"], ["ชลาลัย", "ชล + อาลัย"]];
const WORKS = [["พระอภัยมณี", "สุนทรภู่", "กลอนนิทาน"], ["นิราศภูเขาทอง", "สุนทรภู่", "กลอนนิราศ"], ["อิเหนา", "รัชกาลที่ 2", "บทละครใน"], ["มัทนะพาธา", "รัชกาลที่ 6", "บทละครพูดคำฉันท์"],
  ["สามก๊ก (ฉบับแปลภาษาไทยที่มีชื่อเสียง)", "เจ้าพระยาพระคลัง (หน)", "ร้อยแก้ว"], ["กาพย์เห่เรือ", "เจ้าฟ้าธรรมธิเบศร", "กาพย์เห่"], ["โคลงนิราศนรินทร์", "นายนรินทรธิเบศร์ (อิน)", "โคลงนิราศ"],
  ["ไตรภูมิพระร่วง", "พญาลิไท", "ร้อยแก้ว"], ["ลิลิตตะเลงพ่าย", "สมเด็จพระมหาสมณเจ้า กรมพระปรมานุชิตชิโนรส", "ลิลิต"], ["เงาะป่า", "รัชกาลที่ 5", "กลอนบทละคร"], ["สามัคคีเภทคำฉันท์", "ชิต บุรทัต", "คำฉันท์"]];

const TH = {
  0: [(r) => { const i = Math.floor(r() * 43); return { q: `พยัญชนะที่อยู่ถัดจาก “${CONS[i].join(" ")}” คือ`, a: CONS[i + 1].join(" "), w: pickN(r, CONS.map((c) => c.join(" ")), 3, [CONS[i + 1].join(" "), CONS[i].join(" ")]) }; }],
  1: [
    (r) => { const i = Math.floor(r() * 43); return { q: `พยัญชนะที่อยู่ถัดจาก “${CONS[i].join(" ")}” คือ`, a: CONS[i + 1].join(" "), w: pickN(r, CONS.map((c) => c.join(" ")), 3, [CONS[i + 1].join(" "), CONS[i].join(" ")]) }; },
    (r) => { const c = pk(r, CONS); return { q: `ตัวอักษร “${c[0]}” เรียกชื่อว่าอะไร`, a: `${c[0]} ${c[1]}`, w: pickN(r, CONS.filter((x) => x[0] !== c[0]).map((x) => `${c[0]} ${x[1]}`), 3, []) }; },
    (r) => { const c = pk(r, CONS); return { q: `ตัวอักษรที่เรียกชื่อว่า “… ${c[1]}” คือตัวใด`, a: c[0], w: pickN(r, CONS.map((x) => x[0]), 3, [c[0]]) }; },
  ],
  2: [(r) => { const [m, ws] = pk(r, Object.entries(MATRA)), w = pk(r, ws); return { q: `คำว่า “${w}” สะกดด้วยมาตราใด`, a: m, w: pickN(r, Object.keys(MATRA), 3, [m]) }; },
    (r) => { const c = pk(r, CONS); return { q: `“${c[0]} ${c[1]}” เป็นพยัญชนะตัวที่เท่าใด`, a: String(CONS.indexOf(c) + 1) }; }],
  3: [(r) => { const c = pk(r, CONS)[0]; return { q: `“${c}” เป็นอักษรหมู่ใด`, a: classOf(c), w: ["อักษรกลาง", "อักษรสูง", "อักษรต่ำ"].filter((x) => x !== classOf(c)) }; },
    (r) => { const dead = r() < 0.5, w = pk(r, dead ? DEAD : LIVE); return { q: `คำว่า “${w}” เป็นคำเป็นหรือคำตาย`, a: dead ? "คำตาย" : "คำเป็น", w: [dead ? "คำเป็น" : "คำตาย"], nofill: true }; },
    (r) => { const [m, ws] = pk(r, Object.entries(MATRA)), w = pk(r, ws); return { q: `คำว่า “${w}” สะกดด้วยมาตราใด`, a: m, w: pickN(r, Object.keys(MATRA), 3, [m]) }; }],
  4: [(r) => { const [n, c] = pk(r, CLF); return { q: `ลักษณนามของ “${n}” คือข้อใด`, a: c, w: pickN(r, [...new Set(CLF.map((x) => x[1]))], 3, [c, "ตัว"]) }; },
    (r) => { const [t, ws] = pk(r, Object.entries(POS)), w = pk(r, ws); return { q: `คำว่า “${w}” เป็นคำชนิดใด`, a: t, w: pickN(r, Object.keys(POS), 3, [t]) }; }],
  5: [(r) => { const [c, k] = pk(r, ROYAL); return { q: `คำราชาศัพท์ของ “${c}” (สำหรับพระมหากษัตริย์) คือ`, a: k, w: pickN(r, ROYAL.map((x) => x[1]), 3, [k]) }; },
    (r) => { const [c, k] = pk(r, ROYAL); return { q: `คำราชาศัพท์ “${k}” หมายถึงอะไร`, a: c, w: pickN(r, ROYAL.map((x) => x[0]), 3, [c]) }; },
    (r) => { const [n, c] = pk(r, CLF); return { q: `ลักษณนามของ “${n}” คือข้อใด`, a: c, w: pickN(r, [...new Set(CLF.map((x) => x[1]))], 3, [c, "ตัว"]) }; }],
  6: [(r) => { const [w, l] = pk(r, LOAN); return { q: `คำว่า “${w}” เป็นคำยืมจากภาษาใด`, a: l, w: pickN(r, [...new Set(LOAN.map((x) => x[1]))], 3, [l]) }; },
    (r) => { const [i, m] = pk(r, IDIOM); return { q: `สำนวน “${i}” หมายถึงข้อใด`, a: m, w: pickN(r, IDIOM.map((x) => x[1]), 3, [m]) }; }],
  7: [(r) => { const [t, ws] = pk(r, Object.entries(BUILD)), w = pk(r, ws); return { q: `คำว่า “${w}” สร้างคำแบบใด`, a: t, w: pickN(r, Object.keys(BUILD), 3, [t]) }; },
    (r) => { const [i, m] = pk(r, IDIOM); return { q: `ข้อใดคือสำนวนที่หมายถึง “${m}”`, a: i, w: pickN(r, IDIOM.map((x) => x[0]), 3, [i]) }; }],
  8: [(r) => { const [t, ws] = pk(r, Object.entries(PALI)), w = pk(r, ws); return { q: `คำว่า “${w}” สร้างคำแบบใด`, a: t, w: [...Object.keys(PALI).filter((x) => x !== t), "คำซ้อน"] }; },
    (r) => { const [w, l] = pk(r, LOAN); return { q: `คำว่า “${w}” เป็นคำยืมจากภาษาใด`, a: l, w: pickN(r, [...new Set(LOAN.map((x) => x[1]))], 3, [l]) }; }],
  9: [(r) => { const [w, s] = pk(r, SANDHI); return { q: `คำสนธิ “${w}” แยกได้เป็นคำใด`, a: s, w: pickN(r, SANDHI.map((x) => x[1]), 3, [s]) }; },
    (r) => { const [t, ws] = pk(r, Object.entries(PALI)), w = pk(r, ws); return { q: `คำว่า “${w}” สร้างคำแบบใด`, a: t, w: [...Object.keys(PALI).filter((x) => x !== t), "คำซ้อน"] }; }],
  10: [(r) => { const [t, a] = pk(r, WORKS); return { q: `“${t}” เป็นผลงานของใคร`, a, w: pickN(r, [...new Set(WORKS.map((x) => x[1]))], 3, [a]) }; }],
  11: [(r) => { const [t, , k] = pk(r, WORKS); return { q: `“${t}” แต่งด้วยคำประพันธ์ / เป็นวรรณกรรมประเภทใด`, a: k, w: pickN(r, [...new Set(WORKS.map((x) => x[2]))], 3, [k]) }; },
    (r) => { const [t, a] = pk(r, WORKS); return { q: `“${t}” เป็นผลงานของใคร`, a, w: pickN(r, [...new Set(WORKS.map((x) => x[1]))], 3, [a]) }; }],
  12: [(r) => { const [t, , k] = pk(r, WORKS); return { q: `“${t}” แต่งด้วยคำประพันธ์ / เป็นวรรณกรรมประเภทใด`, a: k, w: pickN(r, [...new Set(WORKS.map((x) => x[2]))], 3, [k]) }; },
    (r) => { const [w, s] = pk(r, SANDHI); return { q: `คำสนธิ “${w}” แยกได้เป็นคำใด`, a: s, w: pickN(r, SANDHI.map((x) => x[1]), 3, [s]) }; }],
};
function thaiGrade(g, r) { const list = TH[Math.max(0, Math.min(12, g))]; for (let t = 0; t < 8; t++) { const it = pk(r, list)(r); if (it && it.a && !(it.w || []).includes(it.a)) return it; } return null; }

// ================= ภาษาอังกฤษ: คำศัพท์รายชั้น =================
const EN = {
  0: "cat แมว|dog สุนัข|red สีแดง|blue สีน้ำเงิน|one หนึ่ง|two สอง|sun ดวงอาทิตย์|ball ลูกบอล|fish ปลา|bird นก",
  1: "cat แมว|dog สุนัข|bird นก|fish ปลา|duck เป็ด|red สีแดง|blue สีน้ำเงิน|green สีเขียว|yellow สีเหลือง|one หนึ่ง|three สาม|five ห้า|ten สิบ|apple แอปเปิล|banana กล้วย|egg ไข่|milk นม|book หนังสือ|pen ปากกา|bag กระเป๋า|hand มือ|eye ตา",
  2: "mother แม่|father พ่อ|sister พี่สาวหรือน้องสาว|brother พี่ชายหรือน้องชาย|baby ทารก|head ศีรษะ|nose จมูก|mouth ปาก|ear หู|leg ขา|rice ข้าว|water น้ำ|bread ขนมปัง|chicken ไก่|orange ส้ม|chair เก้าอี้|table โต๊ะ|door ประตู|window หน้าต่าง|bed เตียง|eleven สิบเอ็ด|twenty ยี่สิบ",
  3: "school โรงเรียน|teacher ครู|student นักเรียน|classroom ห้องเรียน|ruler ไม้บรรทัด|eraser ยางลบ|kitchen ห้องครัว|bathroom ห้องน้ำ|garden สวน|shirt เสื้อเชิ้ต|shoes รองเท้า|hat หมวก|Monday วันจันทร์|Sunday วันอาทิตย์|morning ตอนเช้า|night กลางคืน|happy มีความสุข|sad เศร้า|big ใหญ่|small เล็ก|tall สูง|short สั้น/เตี้ย",
  4: "weather สภาพอากาศ|rainy มีฝนตก|sunny มีแดดจัด|cloudy มีเมฆมาก|windy มีลมแรง|doctor หมอ|nurse พยาบาล|farmer ชาวนา|police ตำรวจ|cook พ่อครัวแม่ครัว|hospital โรงพยาบาล|market ตลาด|library ห้องสมุด|bank ธนาคาร|temple วัด|park สวนสาธารณะ|January มกราคม|March มีนาคม|December ธันวาคม|left ซ้าย|right ขวา|near ใกล้",
  5: "visit เยี่ยมชม|travel เดินทาง|borrow ยืม|return คืน|forget ลืม|remember จำได้|angry โกรธ|tired เหนื่อย|hungry หิว|thirsty กระหายน้ำ|excited ตื่นเต้น|bored เบื่อ|beautiful สวยงาม|dangerous อันตราย|expensive แพง|cheap ถูก|healthy มีสุขภาพดี|clean สะอาด|dirty สกปรก|early เช้า/ก่อนเวลา|late สาย|quiet เงียบ",
  6: "hobby งานอดิเรก|collect สะสม|swim ว่ายน้ำ|camping การตั้งแคมป์|ticket ตั๋ว|passport หนังสือเดินทาง|airport สนามบิน|luggage กระเป๋าเดินทาง|headache ปวดหัว|fever ไข้|medicine ยา|exercise ออกกำลังกาย|vegetable ผัก|breakfast อาหารเช้า|delicious อร่อย|festival เทศกาล|neighbor เพื่อนบ้าน|village หมู่บ้าน|country ประเทศ|famous มีชื่อเสียง|holiday วันหยุด|address ที่อยู่",
  7: "environment สิ่งแวดล้อม|pollution มลพิษ|recycle รีไซเคิล|plastic พลาสติก|forest ป่าไม้|energy พลังงาน|computer คอมพิวเตอร์|internet อินเทอร์เน็ต|password รหัสผ่าน|download ดาวน์โหลด|science วิทยาศาสตร์|history ประวัติศาสตร์|subject วิชา|homework การบ้าน|explain อธิบาย|describe บรรยาย|important สำคัญ|different แตกต่าง|similar คล้ายกัน|culture วัฒนธรรม|tradition ประเพณี|population ประชากร",
  8: "opinion ความคิดเห็น|advice คำแนะนำ|decision การตัดสินใจ|experience ประสบการณ์|knowledge ความรู้|success ความสำเร็จ|failure ความล้มเหลว|improve ปรับปรุง|protect ปกป้อง|prevent ป้องกัน|suggest แนะนำ|support สนับสนุน|community ชุมชน|government รัฐบาล|citizen พลเมือง|responsible มีความรับผิดชอบ|honest ซื่อสัตย์|patient อดทน|generous ใจกว้าง|confident มั่นใจ|curious อยากรู้อยากเห็น|polite สุภาพ",
  9: "analyze วิเคราะห์|compare เปรียบเทียบ|evaluate ประเมิน|research การวิจัย|evidence หลักฐาน|conclusion ข้อสรุป|solution ทางแก้ปัญหา|purpose จุดประสงค์|influence อิทธิพล|benefit ประโยชน์|disadvantage ข้อเสีย|increase เพิ่มขึ้น|decrease ลดลง|economy เศรษฐกิจ|resource ทรัพยากร|technology เทคโนโลยี|disaster ภัยพิบัติ|survive รอดชีวิต|achieve บรรลุผลสำเร็จ|challenge ความท้าทาย|average ค่าเฉลี่ย|percentage ร้อยละ",
  10: "accurate แม่นยำ|adequate เพียงพอ|alternative ทางเลือก|approach วิธีการ|assume สันนิษฐาน|consequence ผลที่ตามมา|contribute มีส่วนช่วย|crucial สำคัญยิ่ง|demonstrate แสดงให้เห็น|emphasize เน้นย้ำ|essential จำเป็นอย่างยิ่ง|estimate ประมาณการ|interpret ตีความ|maintain รักษาไว้|obtain ได้รับ|participate มีส่วนร่วม|perspective มุมมอง|reliable เชื่อถือได้|significant มีนัยสำคัญ|sufficient เพียงพอ|sustainable ยั่งยืน|vary แตกต่างกันไป",
  11: "abundant อุดมสมบูรณ์|acknowledge ยอมรับ|ambiguous กำกวม|anticipate คาดการณ์|coherent สอดคล้องเป็นเหตุเป็นผล|comprehensive ครอบคลุม|controversial เป็นที่ถกเถียง|deteriorate เสื่อมลง|diminish ลดน้อยลง|eliminate กำจัด|enhance เสริมให้ดีขึ้น|feasible เป็นไปได้|inevitable หลีกเลี่ยงไม่ได้|innovative เป็นนวัตกรรม|mitigate บรรเทา|negotiate เจรจาต่อรอง|persuade โน้มน้าว|phenomenon ปรากฏการณ์|reluctant ไม่เต็มใจ|scrutinize ตรวจสอบอย่างละเอียด|tremendous มหาศาล|vulnerable เปราะบาง",
  12: "advocate สนับสนุนอย่างเปิดเผย|alleviate บรรเทา|arbitrary ตามอำเภอใจ|articulate พูดได้ชัดเจน|compelling น่าเชื่อถือ ทรงพลัง|conscientious รอบคอบเอาใจใส่|discrepancy ความไม่ลงรอยกัน|empirical เชิงประจักษ์|exacerbate ทำให้แย่ลง|hypothesis สมมติฐาน|implication นัยยะ|meticulous พิถีพิถัน|paradigm กระบวนทัศน์|plausible ฟังดูมีเหตุผล|pragmatic ปฏิบัตินิยม เน้นใช้ได้จริง|prevalent แพร่หลาย|redundant ซ้ำซ้อนเกินจำเป็น|resilient ฟื้นตัวได้เร็ว|scrutiny การตรวจสอบอย่างละเอียด|subsequent ที่ตามมา|ubiquitous มีอยู่ทั่วไป|unprecedented ไม่เคยเกิดขึ้นมาก่อน",
};
const ENW = Object.fromEntries(Object.entries(EN).map(([g, s]) => [g, s.split("|").map((x) => { const i = x.indexOf(" "); return [x.slice(0, i), x.slice(i + 1)]; })]));
function englishGrade(g, r) {
  const list = ENW[Math.max(0, Math.min(12, g))], [en, th] = pk(r, list), k = r();
  if (k < 0.45) return { q: `“${en}” แปลว่าอะไร`, a: th, w: pickN(r, list.map((x) => x[1]), 3, [th]), mq: en, ma: th, scr: false };
  if (k < 0.85) return { q: `ข้อใดแปลว่า “${th}”`, a: en, w: pickN(r, list.map((x) => x[0]), 3, [en]), mq: th, ma: en, scr: /^[a-z]+$/i.test(en), sq: `เรียงตัวอักษรให้เป็นคำที่แปลว่า “${th}”` };
  const i = 1 + Math.floor(r() * (en.length - 2)); return { q: `เติมตัวอักษรที่หายไป: ${en.slice(0, i)}_${en.slice(i + 1)} (${th})`, a: en[i].toLowerCase(), w: pickN(r, "abcdefghiklmnoprstuwy".split(""), 3, [en[i].toLowerCase()]) };
}
module.exports = { thaiGrade, englishGrade, EN_WORDS: ENW, TH_DATA: { CONS, MATRA, CLF, POS, ROYAL, LOAN, IDIOM, BUILD, PALI, SANDHI, WORKS } };
