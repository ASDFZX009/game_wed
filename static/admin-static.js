// หน้าผู้ดูแลระบบ (เวอร์ชันเว็บ): ดูผู้เล่นทั้งหมด ส่งของในร้านให้ผู้เล่น และเครื่องมือทดสอบบัญชีตัวเอง
// สิทธิ์ตรวจจริงที่ Supabase (ฟังก์ชัน is_admin / admin_* ใน supabase/schema.sql) หน้านี้แค่แสดงผล
import { api, html, raw, state, toast, fmtDate, esc } from "../public/js/core.js";
import * as C from "./cloud.js";
import DATA from "./data.json";

const CATALOG = DATA.shop.catalog, SLOTS = DATA.shop.slots, RARITY = DATA.shop.rarity;
const levelOf = (xp) => Math.floor((xp || 0) / 100) + 1;

export async function adminPage({ main, go, refreshMe }) {
  if (!state.me?.cloud) { main.innerHTML = html`<div class="card center narrow"><h1>🛡️ ผู้ดูแลระบบ</h1><p>เข้าสู่ระบบด้วยบัญชีแอดมินก่อน</p><a class="btn" href="/login?next=/admin">🔐 เข้าสู่ระบบ</a></div>`.s; return; }
  if (!state.me.admin) {
    main.innerHTML = html`<div class="card narrow"><h1>🛡️ ผู้ดูแลระบบ</h1><p>บัญชี <b>${state.me.email}</b> ยังไม่ใช่ผู้ดูแลระบบ</p>
      <ol class="small"><li>เปิด Supabase → SQL Editor แล้วรันไฟล์ <code>supabase/schema.sql</code> อีกครั้ง (มีส่วนแอดมินเพิ่มมา รันซ้ำได้)</li>
      <li>รันไฟล์ <code>supabase/make-admin.sql</code> โดยใส่อีเมล <b>${state.me.email}</b></li><li>กลับมาโหลดหน้านี้ใหม่</li></ol></div>`.s;
    return;
  }
  let players = [], q = "", err = null;
  const load = async () => { try { players = (await C.adminListPlayers()) || []; err = null; } catch (e) { err = e.message; } };
  const render = () => {
    const list = players.filter((p) => !q || `${p.display_name || ""} ${p.email || ""}`.toLowerCase().includes(q.toLowerCase()));
    main.innerHTML = html`<h1>🛡️ ผู้ดูแลระบบ</h1>
      <section class="card adm-self"><h2 style="margin-top:0">🧪 เครื่องมือทดสอบ (บัญชีของฉัน)</h2>
        <p class="small muted">ใช้ลองของในร้านได้ทุกชิ้น มีผลเฉพาะบัญชี ${state.me.email}</p>
        <div class="row"><button class="btn" id="aUnlock">🔓 ปลดล็อกของทั้งหมด (${CATALOG.length} ชิ้น)</button>
          <button class="btn btn-ghost" data-coins="10000">🪙 +10,000 เหรียญ</button><button class="btn btn-ghost" data-coins="1000">🪙 +1,000</button>
          <a class="btn btn-ghost" href="/bag">🎒 ไปที่กระเป๋า</a></div></section>
      <section class="card"><div class="row between"><h2 style="margin:0">👥 ผู้เล่นทั้งหมด <span class="muted small">(${players.length} บัญชี)</span></h2>
        <div class="row"><input id="aQ" placeholder="ค้นหาชื่อหรืออีเมล…" value="${q}" aria-label="ค้นหาผู้เล่น"><button class="btn btn-ghost btn-sm" id="aReload">↻ โหลดใหม่</button></div></div>
        ${err ? html`<div class="note">โหลดรายชื่อไม่ได้: ${err}</div>` : ""}
        <div class="adm-table" role="table" aria-label="ผู้เล่นทั้งหมด">
          <div class="adm-row adm-head" role="row"><span>ผู้เล่น</span><span>เลเวล / XP</span><span>🪙 เหรียญ</span><span>🎒 ของ</span><span>🎮 เล่น</span><span>ใช้งานล่าสุด</span><span></span></div>
          ${list.map((p) => html`<div class="adm-row" role="row">
            <span><b>${p.display_name || "—"}</b>${p.is_admin ? html` <span class="badge badge-brand">แอดมิน</span>` : ""}<br><span class="small muted">${p.email}</span></span>
            <span>Lv.${levelOf(p.xp)} <span class="small muted">· ${p.xp.toLocaleString("th-TH")} XP</span></span>
            <span>${p.coins.toLocaleString("th-TH")}</span><span>${p.items}</span><span>${p.plays}</span>
            <span class="small">${p.updated_at ? fmtDate(p.updated_at) : html`<span class="muted">ยังไม่เคยเล่น</span>`}</span>
            <span><button class="btn btn-sm" data-gift="${p.user_id}">🎁 ให้ของ</button></span></div>`)}
          ${!list.length && !err ? html`<p class="muted center">ไม่พบผู้เล่น</p>` : ""}
        </div>
        <p class="small muted" style="margin-bottom:0">ของที่ส่งให้ผู้เล่นจะเข้ากระเป๋าเมื่อผู้เล่นเปิดเว็บครั้งถัดไป (ถ้ามีของชิ้นนั้นอยู่แล้วจะข้าม)</p></section>`.s;
    main.querySelector("#aQ").oninput = (e) => { q = e.target.value; const pos = e.target.selectionStart; render(); const i = main.querySelector("#aQ"); i.focus(); i.setSelectionRange(pos, pos); };
    main.querySelector("#aReload").onclick = async () => { await load(); render(); };
    main.querySelector("#aUnlock").onclick = async () => { const r = await api("/api/admin/unlock-all", { body: {} }); await refreshMe(); toast(r.unlocked ? `ปลดล็อกเพิ่ม ${r.unlocked} ชิ้น ครบ ${r.total} ชิ้นแล้ว 🔓` : "มีของครบทุกชิ้นอยู่แล้ว"); };
    main.querySelectorAll("[data-coins]").forEach((b) => b.onclick = async () => { const r = await api("/api/admin/coins", { body: { amount: +b.dataset.coins } }); await refreshMe(); toast(`เหรียญตอนนี้ ${r.coins.toLocaleString("th-TH")} 🪙`); });
    main.querySelectorAll("[data-gift]").forEach((b) => b.onclick = () => giftDialog(players.find((p) => p.user_id === b.dataset.gift)));
  };
  function giftDialog(p) {
    const dlg = document.createElement("dialog"); dlg.className = "adm-dialog";
    const groups = Object.entries(SLOTS).map(([type, name]) => [name, CATALOG.filter((x) => x.type === type)]).filter(([, xs]) => xs.length);
    dlg.innerHTML = html`<form method="dialog" class="adm-gift"><h2 style="margin-top:0">🎁 ส่งของให้ ${p.display_name || p.email}</h2>
      <label>ของในร้าน<select id="gItem" required>${groups.map(([name, xs]) => html`<optgroup label="${name}">${xs.map((x) => html`<option value="${x.id}">${x.name} · ${RARITY[x.rarity]?.name || x.rarity}${x.boxOnly ? " (กล่องสุ่มเท่านั้น)" : ""}</option>`)}</optgroup>`)}</select></label>
      <label>ข้อความถึงผู้เล่น (ไม่บังคับ)<input id="gNote" maxlength="120" placeholder="เช่น รางวัลชนะเลิศประจำสัปดาห์"></label>
      <div class="row end"><button value="cancel" class="btn btn-ghost">ยกเลิก</button><button id="gSend" value="send" class="btn">ส่งของ</button></div></form>`.s;
    document.body.appendChild(dlg); dlg.showModal(); dlg.addEventListener("close", () => dlg.remove());
    dlg.querySelector("#gSend").onclick = async (e) => { e.preventDefault(); const item = dlg.querySelector("#gItem").value, note = dlg.querySelector("#gNote").value.trim();
      try { await C.adminGrant(p.user_id, item, note); toast(`ส่ง “${CATALOG.find((x) => x.id === item).name}” ให้ ${p.display_name || p.email} แล้ว 🎁`); dlg.close(); } catch (x) { toast(x.message, "bad"); } };
  }
  await load(); render();
}
