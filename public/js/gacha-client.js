// ✨ ตัวช่วยฝั่งหน้าเว็บสำหรับตัวละครอัญเชิญ: โหลดภาพ 64px, อ่านคู่หูปัจจุบัน
import { state } from "./core.js";
import { ROSTER, STARTERS } from "../gacha/data.js";

let sprP = null;
/** ที่อยู่โฟลเดอร์ gacha/ (เวอร์ชันเว็บไฟล์เดียวใช้ที่อยู่สัมพัทธ์ เวอร์ชันเซิร์ฟเวอร์ใช้ /gacha/) */
export const gachaBase = () => (state.config?.local ? "gacha/" : "/gacha/");
/** โหลดภาพตัวละครทั้งหมดครั้งเดียว (ไฟล์เดียวกับที่หน้าอัญเชิญใช้ เบราว์เซอร์จำไว้ให้) */
export function loadSprites() {
  if (globalThis.QO_SPR) return Promise.resolve(globalThis.QO_SPR);
  sprP = sprP || new Promise((ok) => {
    const s = document.createElement("script"); s.src = gachaBase() + "sprites.js"; s.async = true;
    s.onload = () => ok(globalThis.QO_SPR || {}); s.onerror = () => { sprP = null; ok({}); };
    document.head.appendChild(s);
  });
  return sprP;
}
const imgs = new Map();
/** ภาพ Image ของเฟรม (เช่น "thara_n0") — คืน null ถ้ายังโหลดไม่เสร็จ */
export function frameImg(key) {
  const SPR = globalThis.QO_SPR; if (!SPR?.[key]) return null;
  let im = imgs.get(key); if (!im) { im = new Image(); im.src = SPR[key]; imgs.set(key, im); }
  return im.complete && im.naturalWidth ? im : null;
}
export const frameUrl = (key) => globalThis.QO_SPR?.[key] || "";

/** สถานะอัญเชิญของผู้เล่น (มาจาก /api/auth/me) */
export const myGacha = () => state.me?.gacha || null;
/** ตัวละครที่ผู้เล่นมี (เรียง: คู่หูก่อน แล้วตามระดับดาว) — ถ้ายังไม่มีเลย ยืมตัวเริ่มต้นไปก่อน */
export function myTeam() {
  const g = myGacha(), own = g?.own || {};
  let ids = Object.keys(own).filter((k) => ROSTER[k]);
  if (!ids.length) return { ids: [STARTERS[0]], party: STARTERS[0], lent: true, stage: {} };
  ids.sort((a, b) => (b === g.party) - (a === g.party) || ROSTER[b].r - ROSTER[a].r || ids.indexOf(a) - ids.indexOf(b));
  return { ids, party: g.party && own[g.party] != null ? g.party : ids[0], lent: false, stage: own };
}
export const needsStarter = () => { const g = myGacha(); return !!g && !Object.keys(g.own || {}).length; };
export { ROSTER };
