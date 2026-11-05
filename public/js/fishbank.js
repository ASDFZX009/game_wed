// 💱 แลกเงิน G จากเกมตกปลา (EduFishing) → เหรียญ 🪙 ของเกมหลัก
// ใช้ API ของเกมตกปลาในกรอบ (ถ้าเปิดอยู่) ไม่งั้นอ่าน/เขียนเซฟของเกมตกปลาในเบราว์เซอร์โดยตรง (โดเมนเดียวกัน)
import { api, html, toast } from "./core.js";
import { playSound } from "./prefs.js";

export const RATE = 5; // 5 G = 1 🪙
const SAVE_KEY = "awsfishing.save.v1";
let frameBank = null;
export const attachFrame = (frame) => { frameBank = () => { try { return frame.contentWindow?.QO_BANK || null; } catch { return null; } }; };
export const detachFrame = () => { frameBank = null; };
const bank = () => frameBank?.() || {
  balance() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); return s ? s.coins | 0 : 0; } catch { return 0; } },
  withdraw(n) { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); if (!s || (s.coins | 0) < n) return false; s.coins = (s.coins | 0) - n; localStorage.setItem(SAVE_KEY, JSON.stringify(s)); return true; } catch { return false; } },
  deposit(n) { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); if (s) { s.coins = (s.coins | 0) + n; localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } } catch { /* ignore */ } },
};
export const fishBalance = () => bank().balance();
export const hasFishSave = () => { try { return !!localStorage.getItem(SAVE_KEY) || !!frameBank?.(); } catch { return false; } };

/** เปิดหน้าต่างแลกเงิน · onDone(coinsGot) */
export async function openExchange({ onDone } = {}) {
  let info; try { info = await api("/api/exchange/fish"); } catch (e) { return toast(e.message, "bad"); }
  const dlg = document.createElement("dialog"); dlg.className = "xch";
  document.body.appendChild(dlg); dlg.addEventListener("close", () => dlg.remove());
  let pick = 0;
  const draw = () => {
    const g = fishBalance(), maxC = Math.max(0, Math.min(Math.floor(g / RATE), info.left));
    if (pick > maxC) pick = maxC;
    const opts = [10, 50, 100].filter((v) => v <= maxC);
    dlg.innerHTML = html`<div class="xch-box"><h2>💱 แลกเหรียญจากเกมตกปลา</h2>
      <div class="xch-wallets"><div class="xw fish"><span>🎣 เงินในเกมตกปลา</span><b>${g.toLocaleString("th-TH")} G</b></div><div class="xch-arrow" aria-hidden="true">➜</div>
        <div class="xw main"><span>🧭 เหรียญเกมหลัก</span><b>🪙 ${info.coins.toLocaleString("th-TH")}</b></div></div>
      <p class="xch-rate">อัตราแลก <b>${RATE} G = 🪙 1</b> · แลกได้อีกวันนี้ <b>🪙 ${info.left}</b> / ${info.cap}</p>
      ${maxC ? html`<div class="xch-chips" role="group" aria-label="จำนวนที่จะแลก">${opts.map((v) => html`<button type="button" class="${pick === v ? "on" : ""}" data-v="${v}">🪙 ${v}</button>`)}<button type="button" class="${pick === maxC ? "on" : ""}" data-v="${maxC}">ทั้งหมด 🪙 ${maxC}</button></div>
        <label class="xch-range"><span>เลือกเอง</span><input type="range" min="1" max="${maxC}" value="${pick || Math.min(10, maxC)}" id="xr"><output>🪙 ${pick || Math.min(10, maxC)}</output></label>
        <p class="xch-sum">ใช้ <b>${((pick || Math.min(10, maxC)) * RATE).toLocaleString("th-TH")} G</b> ได้ <b>🪙 ${pick || Math.min(10, maxC)}</b></p>`
      : html`<p class="xch-empty">${info.left <= 0 ? "วันนี้แลกครบโควตาแล้ว พรุ่งนี้มาใหม่นะ" : g < RATE ? "เงินในเกมตกปลายังไม่พอ ไปตกปลาขายก่อนนะ (ต้องมีอย่างน้อย " + RATE + " G)" : ""}</p>`}
      <div class="xch-act"><button type="button" class="btn btn-ghost" data-x>ปิด</button>${maxC ? html`<button type="button" class="btn" data-go>แลกเลย</button>` : html`<a class="btn" href="/quiz-game" data-x>🎣 ไปตกปลา</a>`}</div></div>`.s;
    if (!pick && maxC) pick = Math.min(10, maxC);
    dlg.querySelectorAll("[data-v]").forEach((b) => (b.onclick = () => { pick = +b.dataset.v; draw(); }));
    const r = dlg.querySelector("#xr"); if (r) r.oninput = () => { pick = +r.value; dlg.querySelector(".xch-range output").textContent = `🪙 ${pick}`; dlg.querySelector(".xch-sum").innerHTML = html`ใช้ <b>${(pick * RATE).toLocaleString("th-TH")} G</b> ได้ <b>🪙 ${pick}</b>`.s; dlg.querySelectorAll("[data-v]").forEach((b) => b.classList.toggle("on", +b.dataset.v === pick)); };
    dlg.querySelectorAll("[data-x]").forEach((b) => b.addEventListener("click", () => dlg.close()));
    dlg.querySelector("[data-go]")?.addEventListener("click", go);
  };
  async function go() {
    const coins = pick, g = coins * RATE, B = bank();
    if (!(coins > 0)) return;
    if (!B.withdraw(g)) { toast("เงินในเกมตกปลาไม่พอ", "bad"); return draw(); }
    try { const r = await api("/api/exchange/fish", { body: { coins } }); info = { ...info, coins: r.coins, left: r.left };
      playSound("win"); toast(`แลกแล้ว! ได้ 🪙 ${coins} (ใช้ ${g} G)`); onDone?.(coins); pick = 0; draw();
      const b = dlg.querySelector(".xw.main b"); b?.classList.add("pop"); }
    catch (e) { B.deposit(g); toast(e.message, "bad"); draw(); }
  }
  draw(); dlg.showModal();
}
