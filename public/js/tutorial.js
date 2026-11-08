// 🧭 บทสอนเล่น: เข้าเกมครั้งแรก (เลือกคู่หู + ของขวัญเพชร), สู้บอสครั้งแรก, เปิดประตูอัญเชิญครั้งแรก
// ผู้นำทาง = มิระ · เล่นซ้ำได้จากปุ่ม ❔ วิธีเล่น
import { api, state, toast } from "./core.js";
import { refreshMe } from "./app.js";
import { talk } from "./talk.js";
import { ROSTER, STARTERS, PASSIVE, GUIDE, GEM, COST } from "../gacha/data.js";
import { myGacha, needsStarter } from "./gacha-client.js";
import { loadProfile } from "./look.js";

const M = (text, extra = {}) => ({ who: GUIDE, text, ...extra });
const seen = (k) => !!myGacha()?.tut?.[k];
async function mark(...keys) { try { await api("/api/gacha/tut", { method: "POST", body: { keys } }); await refreshMe(); } catch { /* เวอร์ชันที่ไม่มีระบบนี้ */ } }
const pasText = (id) => ROSTER[id].pas.map((p) => `${PASSIVE[p].n}: ${PASSIVE[p].d}`).join(" · ");
export const hasGacha = () => !!myGacha();

/** เลือกคู่หูคนแรก + รับของขวัญเพชร (คืน id ที่เลือก) */
export async function pickStarter() {
  const id = await talk([M("ก่อนออกผจญภัย ต้องมี *คู่หู* ไปช่วยสู้บอสก่อน เลือกมา 1 คนเลย! (อัญเชิญเพิ่มทีหลังได้)", {
    choices: STARTERS.map((k) => ({ who: k, value: k, label: `${ROSTER[k].ic} ${ROSTER[k].n} · ธาตุ${ROSTER[k].el}`, sub: `${ROSTER[k].t} — ${pasText(k)}` })),
  })], { canSkip: false });
  const pick = id || STARTERS[0];
  await api("/api/gacha/starter", { method: "POST", body: { id: pick } });
  await refreshMe();
  await talk([{ who: pick, text: ROSTER[pick].line.replace(/!$/, "") + " ฝากตัวด้วยนะ! ไปสู้บอสด้วยกันเลย!" }]);
  return pick;
}

/** บทสอนเล่นตอนเข้าเกมครั้งแรก (หมู่บ้าน) */
export async function runIntro({ go, force = false } = {}) {
  if (!hasGacha() || (!force && seen("intro"))) return;
  const narrow = innerWidth < 760, who = loadProfile()?.name || state.me?.displayName || "";
  // ถามก่อน (เฉพาะครั้งแรกหลังสร้างตัวละคร): อยากฟังบทสอนเล่นไหม · เลือกข้ามได้ (ยังต้องเลือกคู่หู)
  if (!force) {
    const want = await talk([M(`ยินดีต้อนรับ${who ? ` *${who}*` : ""}! ฉันชื่อ *มิระ* ผู้นำทางในโลก *QUIZ ODYSSEY* อยากให้ฉันสอนวิธีเล่นก่อนไหม?`, { choices: [
      { value: "learn", label: "📖 สอนเล่นเลย (แนะนำ)", sub: "ประมาณ 1 นาที · หมู่บ้าน เพชร คู่หู การสู้บอส การอัญเชิญ" },
      { value: "skip", label: "⏩ ข้ามบทสอน", sub: "เล่นเป็นแล้ว · เปิดดูทีหลังได้ที่ปุ่ม ❔ วิธีเล่น", def: true },
    ] })], { canSkip: true });
    if (want !== "learn") {
      if (needsStarter()) await pickStarter();
      await mark("intro", "battle", "gacha");
      const g = myGacha();
      await talk([M(`โอเค! ตอนนี้มีเพชร *${(g?.gems || 0).toLocaleString("th-TH")}* เม็ด ไปอัญเชิญได้ที่ปุ่ม *✨ อัญเชิญ* ด้านล่าง ถ้าสงสัยอะไร กด *❔ วิธีเล่น* ได้ทุกเมื่อนะ`, { spot: "#wHelp" })]);
      return;
    }
  }
  await talk([
    M(force ? "สวัสดีอีกครั้ง! ฉัน *มิระ* จะเล่าให้ฟังใหม่ตั้งแต่ต้นนะ" : "เยี่ยม! งั้นมาเริ่มกันเลย ฉันจะเป็นผู้นำทางของเธอเอง"),
    M(narrow ? "ที่นี่คือ *หมู่บ้านแห่งการเรียนรู้* บ้านแต่ละหลังคือวิชาหนึ่งวิชา แตะที่บ้านแล้วตัวละครจะเดินไปเข้าเอง"
      : "ที่นี่คือ *หมู่บ้านแห่งการเรียนรู้* บ้านแต่ละหลังคือวิชาหนึ่งวิชา เดินด้วย *ลูกศร* หรือ *WASD* แล้วกด *E* เข้าบ้าน หรือคลิกที่บ้านก็ได้"),
    M("ในบ้านมีบทเรียนให้เลือก พอเริ่มเล่น *บอส* จะโผล่มา! ตอบคำถามถูก คู่หูของเธอจะร่ายสกิลโจมตีบอส"),
  ]);
  if (needsStarter()) await pickStarter();
  const g = myGacha();
  const go2 = await talk([
    M(`ตอบถูกจะได้ *เพชร 💎* (เกมข้อละ ${GEM.perGame} · ปราบบอสได้อีก ${GEM.bossWin}) เอาไปอัญเชิญเพื่อนร่วมทีมที่ *ประตูอัญเชิญ* ได้`, { spot: '[data-tour="gacha"]' }),
    M(`ตอนนี้เธอมีเพชร *${(g?.gems || 0).toLocaleString("th-TH")}* เม็ด${(g?.gems || 0) >= COST * 10 ? " พออัญเชิญ 10 ครั้งเลย!" : ""} อยากไปอัญเชิญเลยไหม?`, {
      choices: [{ value: "gacha", label: "✨ ไปอัญเชิญเลย!", def: false }, { value: "stay", label: "🏡 เดินเล่นในหมู่บ้านก่อน", def: true }],
    }),
  ]);
  await mark("intro");
  if (go2 === "gacha") go("/gacha");
  else await talk([M("ถ้าลืมวิธีเล่น กดปุ่ม *❔ วิธีเล่น* ได้ทุกเมื่อนะ ขอให้สนุก!", { spot: "#wHelp" })]);
}

/** ก่อนสู้บอสครั้งแรก */
export async function battleTips(heroId, { force = false } = {}) {
  if (!hasGacha() || (!force && seen("battle"))) return;
  const hid = ROSTER[heroId] ? heroId : STARTERS[0], c = ROSTER[hid];
  await talk([
    M("บอสมาแล้ว! ด้านบนคือ *คำถาม* ด้านล่างคือ *การ์ดคำตอบ* เลือกการ์ดที่ตอบถูกเพื่อโจมตีบอส", { spot: "#btHand" }),
    M(`ก่อนตอบ เลือก *สกิล* ในแถบเหนือการ์ดได้ สกิลแรงต้องใช้ *พลัง ⚡* — ตอบถูกได้พลัง 1 แต้ม ถูกติดกันได้ 2 แต้ม`, { spot: "#btSkills" }),
    M(`ตอบถูก *${c.n}* จะปล่อยสกิลที่เลือกใส่บอส · ตอบถูกครบทุกข้อชนะแน่นอน ส่วนสกิลแรงช่วยให้ชนะได้แม้พลาดบ้าง`, { spot: ".bt-plate.boss" }),
    M("ถ้าตอบผิด สกิลจะไม่ออก บอสจะโจมตีสวน และคอมโบหาย แต่ *พลังที่เก็บไว้ไม่หาย* อ่านเฉลยแล้วจำไว้ใช้ข้อต่อไปนะ"),
    M(`เก็บพลังครบ 5 แต้ม ใช้ท่าไม้ตาย *${c.sk}* ได้เลย!`),
    { who: hid, text: `ความสามารถติดตัวของฉัน: ${pasText(hid)}` },
    M("ปุ่มรูปตัวละครด้านซ้ายใช้สลับคู่หู ส่วน *💡 คำใบ้* กับ *🧪 ยา* จากการอัญเชิญ กดใช้ได้ที่แถบด้านบน", { spot: ".bt-heroes" }),
  ]);
  await mark("battle");
}

/** เปิดประตูอัญเชิญครั้งแรก */
export async function gachaTips({ force = false } = {}) {
  if (!hasGacha() || (!force && seen("gacha"))) return;
  await talk([
    M(`นี่คือ *ประตูอัญเชิญ* ใช้เพชร ${COST} เม็ดต่อครั้ง หรือ ${(COST * 10).toLocaleString("th-TH")} เม็ดต่อ 10 ครั้ง (การันตีเลเจนดารี ★4 ขึ้นไป 1 ใบ)`),
    M("ตอนวงเวทกำลังก่อตัว *แตะจอ 3 ครั้ง* เพื่อชาร์จพลัง ถ้าแสงเปลี่ยนเป็น *สีม่วง* หรือ *สีทอง* แปลว่ามีตัวหายากมาแน่!"),
    M("ตัวละครมี 3 ระดับ: *ธรรมดา ★3* · *เลเจนดารี ★4* · *มิสติก ★5* ได้ตัวซ้ำจะเพิ่ม *ขั้นพลัง* ทำให้ได้เพชรโบนัสมากขึ้น"),
    M("ดูตัวละครและตั้ง *คู่หู* ที่จะไปสู้บอสได้ที่แท็บ *ตัวละครของฉัน* · อัตราการออกของทุกตัวดูได้ที่ด้านล่างเสมอ"),
  ]);
  await mark("gacha");
}

/** ปุ่ม ❔ วิธีเล่น: เลือกหัวข้อที่อยากฟังอีกครั้ง */
export async function helpMenu({ go } = {}) {
  if (!hasGacha()) { toast("วิธีเล่น: เลือกบ้านวิชาในหมู่บ้าน แล้วตอบคำถามเพื่อสู้บอส"); return; }
  const k = await talk([M("อยากให้ฉันอธิบายเรื่องไหนอีกครั้ง?", { choices: [
    { value: "intro", label: "🏡 หมู่บ้านและเพชร", sub: "เริ่มต้นเล่น · วิธีได้เพชร" },
    { value: "battle", label: "⚔️ การสู้บอสตอบคำถาม", sub: "การ์ดคำตอบ · คอมโบ · ตื่นพลัง" },
    { value: "gacha", label: "✨ ประตูอัญเชิญ", sub: "อัญเชิญ · ระดับดาว · คู่หู" },
    { value: null, label: "ไม่เป็นไร ขอบคุณ", def: true, cls: "wide" },
  ] })]);
  if (k === "intro") await runIntro({ go, force: true });
  else if (k === "battle") await battleTips(myGacha()?.party, { force: true });
  else if (k === "gacha") { if (location.hash.includes("gacha") || location.pathname === "/gacha") await gachaTips({ force: true }); else go?.("/gacha?tips=1"); }
}
