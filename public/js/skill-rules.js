// ⚔️ กติกาสกิลแบบ "เลือกสกิลก่อนตอบ" — ใช้ร่วมกันทั้งฉากต่อสู้ (หน้าเว็บ) และตอนบันทึกผล (ตัดสินว่าปราบบอสได้ไหม)
// เลือดบอส = จำนวนข้อ × 10 · ตอบถูกได้พลัง 1 (ถูกติดกันตั้งแต่ข้อที่ 2 ได้ 2) สูงสุด 5 · ตอบผิด: สกิลไม่ออก พลังไม่หาย คอมโบหาย
// ตอบถูกทุกข้อด้วยสกิลธรรมดาก็ปราบบอสได้เสมอ · สกิลแรงช่วยให้ปราบได้แม้พลาดบ้าง
export const PICK = { U: 10, EN_MAX: 5, cost: [0, 2, 5], dmg: [10, 25, 50] };
export const gainOf = (combo, fast = false) => (fast || combo >= 2 ? 2 : 1); // เพลิงปลุกพลัง (fast): ได้ 2 ทุกครั้ง

/** จำลองการต่อสู้จากผลตอบรายข้อ + สกิลที่เลือก → { hp, win } (สกิลที่พลังไม่พอ = สกิลธรรมดา)
 *  opt: { fast: เพลิงปลุกพลัง, acid: กรดเหนียวแน่น (พลาดครั้งแรกคอมโบไม่หาย), soul: บอสดูดวิญญาณ (+10 เมื่อตอบผิด), dark: กันดูดวิญญาณ } */
export function simPick(oks, skills, opt = {}) {
  const max = oks.length * PICK.U; let hp = max, en = 0, combo = 0, acidUsed = false;
  oks.forEach((ok, i) => {
    if (ok) { let s = [0, 1, 2].includes(+skills?.[i]) ? +skills[i] : 0; if (en < PICK.cost[s]) s = 0;
      en -= PICK.cost[s]; combo++; hp = Math.max(0, hp - PICK.dmg[s]); en = Math.min(PICK.EN_MAX, en + gainOf(combo, opt.fast)); }
    else { if (opt.acid && !acidUsed && combo > 0) acidUsed = true; else combo = 0; if (opt.soul && !opt.dark && hp > 0) hp = Math.min(max, hp + PICK.U); }
  });
  return { hp, win: oks.length > 0 && hp === 0 };
}
