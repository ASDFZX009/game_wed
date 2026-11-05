// หน้าแนวพิกเซล (พื้นไม้ + กระดาษ) ให้เข้ากับหมู่บ้าน ร้านค้า และกระดานภารกิจ
import { loadSkinFont } from "./prefs.js";
export function pxPage(onLeave) {
  document.body.classList.add("quest-world", "px-page"); loadSkinFont("pixel");
  onLeave(() => document.body.classList.remove("quest-world", "px-page"));
}
