// ร้านค้าของตกแต่ง + กล่องสุ่ม
import { api, html, raw, state, toast, confetti, confirmBox, fmtDate, avatar, titleTag } from "../core.js";
import { go, refreshMe, onLeave } from "../app.js";
import { mountShopScene, chestImg } from "./shopscene.js";
import { playSound, setPrefs, getPrefs, playTick, reducedMotion, loadSkinFont } from "../prefs.js";

const TYPE_IC = { avatar: "🐱", pfp: "🎭", frame: "🖼️", title: "🏷️", theme: "🎨", sound: "🎵", effect: "🎉", background: "🌌" };
const REASON = { admin: "ผู้ดูแลระบบ", gift: "ของขวัญจากผู้ดูแล", game: "เล่นเกม", quiz: "ส่งแบบทดสอบ", buy: "ซื้อ", box: "เปิดกล่อง", duplicate: "ได้ของซ้ำ คืนเหรียญ", free_box: "เปิดกล่องฟรี" };

export function itemVisual(it, big = false) {
  switch (it.type) {
    case "pfp": return avatar({ pfp: it.value, frame: state.me?.equipped?.frame }, big ? "xl" : "lg");
    case "sound": return html`<button type="button" class="snd-prev ${big ? "big" : ""}" data-play="${it.value}" aria-label="ฟังเสียง ${it.name}"><span>${it.icon || "🎵"}</span><b>▶</b></button>`;
    case "avatar": return html`<span style="font-size:${big ? "4.4rem" : "2.8rem"}">${it.value}</span>`;
    case "frame": return avatar({ avatar: state.me?.equipped?.avatar || "🙂", frame: it.value }, big ? "xl" : "lg");
    case "title": return html`<span class="title-tag" style="font-size:${big ? "1.1rem" : ".9rem"}">${it.value}</span>`;
    case "theme": return html`<span class="swatch" style="display:inline-block;background:linear-gradient(135deg, ${it.colors[0]}, ${it.colors[1]})"></span>`;
    case "effect": return html`<span style="font-size:${big ? "2.6rem" : "1.8rem"};letter-spacing:.1em">${it.value}</span>`;
    case "background": return html`<span class="bg-prev ${it.value}"></span>`;
  }
  return "";
}

export async function shop({ main, query }) {
  let d = await api("/api/shop");
  let tab = query.get("tab") || "all";
  const me = state.me;

  const render = () => {
    const list = d.items.filter((x) => tab === "all" || (tab === "mine" ? x.owned : x.type === tab));
    const ownedCount = d.items.filter((x) => x.owned).length;
    const look = me?.equipped || {};
    const wallet = main.querySelector("#ssWallet");
    if (wallet) wallet.innerHTML = me ? html`${avatar(look, "lg")}<div><div class="nm">${me.displayName}</div><div class="amt" id="coinAmt">🪙 ${d.coins.toLocaleString("th-TH")}</div></div>`.s : html`<a href="/login?next=/shop">🔐 เข้าสู่ระบบ</a>`.s;
    body.innerHTML = html`
      ${!me ? html`<div class="note">👋 ดูของในร้านได้เลย — <a href="/login?next=/shop">เข้าสู่ระบบ</a> แล้วเล่นเกมเพื่อสะสมเหรียญมาแลกของ</div>` : ""}
      <details class="info small" style="margin-top:14px"><summary><b>ได้เหรียญ 🪙 จากไหน?</b></summary>
        <ul style="margin:6px 0 0"><li>เล่นเกมจบ 1 ครั้ง ได้สูงสุด 50 เหรียญ (ตามสัดส่วนคะแนน)</li><li>ส่งแบบทดสอบ ได้สูงสุด 20 เหรียญ</li><li>เปิดกล่องสุ่มธรรมดาฟรีวันละ 1 ครั้ง</li><li>ของที่ได้ทั้งหมดอยู่ใน <a href="/bag">🎒 กระเป๋า</a> เลือกใส่/ใช้ได้ที่นั่น</li><li>ได้ของซ้ำจากกล่องสุ่ม ระบบคืนเหรียญให้ (ธรรมดา 20 · หายาก 50 · ล้ำค่า 120 · ตำนาน 300)</li></ul>
        <p style="margin:6px 0 0">เหรียญแยกจาก XP — ใช้เหรียญซื้อของแล้วระดับ (Level) ไม่ลดลง · ไม่มีการซื้อเหรียญด้วยเงินจริง</p></details>

      <h2>🎁 กล่องสุ่ม</h2>
      <div class="boxes">${d.boxes.map((b) => html`<div class="lootbox ${b.id === "gold" ? "gold" : b.id === "profile" ? "profile" : ""}">
        <img class="big chest" src="${chestImg(b.id)}" alt="" aria-hidden="true"><h3>${b.name}</h3><p>${b.desc}</p>
        <div class="row">${b.id === "basic" && me && d.freeBox ? html`<button class="btn free" data-box="${b.id}" data-free="1">🎉 เปิดฟรีวันนี้!</button>` : ""}
          <button class="btn" data-box="${b.id}" ${!me ? raw("disabled") : ""}>เปิด 🪙 ${b.price}</button></div>
        <details><summary>ดูโอกาสที่จะได้ของแต่ละระดับ</summary><div class="odds">${Object.entries(b.odds).map(([k, v]) => html`<span>${d.rarity[k].name}</span><span style="opacity:.8">${d.items.filter((x) => x.rarity === k && (b.pool ? x.type === b.pool : x.type !== "pfp")).length} ชิ้น</span><b>${v}%</b>`)}</div></details></div>`)}</div>

      <div class="tabs" role="tablist">${[["all", "ทั้งหมด"], ...Object.entries(d.slots), ...(me ? [["mine", `ของฉัน (${ownedCount}/${d.items.length})`]] : [])].map(([k, v]) => html`<button class="chip" role="tab" data-tab="${k}" aria-pressed="${tab === k}">${TYPE_IC[k] || (k === "mine" ? "🎒" : "✨")} ${v}</button>`)}</div>
      ${list.length ? html`<div class="items">${list.map((it) => {
        let action;
        if (!me) action = it.boxOnly ? html`<span class="small muted">ได้จากกล่องสุ่ม</span>` : html`<span class="small"><b>🪙 ${it.price}</b></span>`;
        else if (it.owned) {
          if (it.type === "sound") action = getPrefs().tickSound === it.value ? html`<button class="btn btn-sm btn-ghost" disabled>✓ ใช้อยู่</button>` : html`<button class="btn btn-sm" data-usesound="${it.value}">ใช้เสียงนี้</button>`;
          else if (it.type === "theme") action = getPrefs().palette === it.value ? html`<button class="btn btn-sm btn-ghost" disabled>✓ ใช้อยู่</button>` : html`<button class="btn btn-sm" data-theme="${it.value}">ใช้ธีมนี้</button>`;
          else action = it.equipped ? html`<button class="btn btn-sm btn-ghost" data-unequip="${it.type}">✓ ใส่อยู่ (ถอด)</button>` : html`<button class="btn btn-sm" data-equip="${it.id}" data-slot="${it.type}">ใส่</button>`;
        } else if (it.boxOnly) action = html`<span class="small muted">🎁 ได้จากกล่องสุ่มเท่านั้น</span>`;
        else action = html`<button class="btn btn-sm ${d.coins < it.price ? "btn-ghost" : ""}" data-buy="${it.id}">ซื้อ 🪙 ${it.price}</button>`;
        return html`<div class="item r-${it.rarity} ${it.equipped || (it.owned && ((it.type === "theme" && getPrefs().palette === it.value) || (it.type === "sound" && getPrefs().tickSound === it.value))) ? "equipped" : ""}">
          <span class="rar">${d.rarity[it.rarity].name}</span><div class="vis">${itemVisual(it)}</div>
          <div class="nm">${it.name}</div><div class="small muted">${d.slots[it.type]}${it.owned ? " · มีแล้ว ✓" : ""}</div>${action}</div>`;
      })}</div>` : html`<div class="empty">${tab === "mine" ? "ยังไม่มีของ ลองเปิดกล่องสุ่มฟรีดูสิ!" : "ไม่มีสินค้าในหมวดนี้"}</div>`}
      ${me && d.history.length ? html`<h2>ประวัติเหรียญล่าสุด</h2><ul class="list">${d.history.map((h) => html`<li><span class="grow">${REASON[h.reason] || h.reason}<span class="small muted"> · ${h.detail}</span></span>
        <b style="color:${h.amount > 0 ? "var(--ok)" : h.amount < 0 ? "var(--bad)" : "var(--mute)"}">${h.amount > 0 ? "+" : ""}${h.amount}</b><span class="small muted">${fmtDate(h.created_at)}</span></li>`)}</ul>` : ""}`.s;
    bind();
  };

  const reload = async () => { d = await api("/api/shop"); await refreshMe(); render(); };

  function bind() {
    main.querySelectorAll("[data-tab]").forEach((b) => b.onclick = () => { tab = b.dataset.tab; if (!state.config.local) history.replaceState({}, "", `/shop${tab === "all" ? "" : `?tab=${tab}`}`); render(); });
    main.querySelectorAll("[data-buy]").forEach((b) => b.onclick = async () => {
      const it = d.items.find((x) => x.id === b.dataset.buy);
      if (d.coins < it.price) return toast(`เหรียญไม่พอ ต้องการอีก ${it.price - d.coins} เหรียญ — ไปเล่นเกมสะสมเพิ่มกัน!`, "bad");
      if (!(await confirmBox(`ซื้อ “${it.name}” ราคา 🪙 ${it.price}?`, "ซื้อเลย"))) return;
      try { await api("/api/shop/buy", { body: { itemId: it.id } }); playSound("win"); toast(`ได้ “${it.name}” แล้ว 🎉`); await reload(); }
      catch (e) { toast(e.message, "bad"); }
    });
    main.querySelectorAll("[data-equip]").forEach((b) => b.onclick = async () => { await api("/api/shop/equip", { body: { slot: b.dataset.slot, itemId: b.dataset.equip } }); toast("ใส่แล้ว ✨"); await reload(); });
    main.querySelectorAll("[data-unequip]").forEach((b) => b.onclick = async () => { await api("/api/shop/equip", { body: { slot: b.dataset.unequip, itemId: null } }); toast("ถอดแล้ว"); await reload(); });
    main.querySelectorAll("[data-theme]").forEach((b) => b.onclick = () => { setPrefs({ palette: b.dataset.theme }); toast("เปลี่ยนธีมแล้ว 🎨"); render(); });
    main.querySelectorAll("[data-box]").forEach((b) => b.onclick = () => openBox(b.dataset.box, !!b.dataset.free));
    main.querySelectorAll("[data-play]").forEach((b) => b.onclick = () => playTick(0, b.dataset.play, true));
    main.querySelectorAll("[data-usesound]").forEach((b) => b.onclick = () => { setPrefs({ tickSound: b.dataset.usesound }); playTick(0, b.dataset.usesound); toast("เปลี่ยนเสียงนับคะแนนแล้ว 🎵"); render(); });
  }

  async function openBox(boxId, free) {
    const box = d.boxes.find((x) => x.id === boxId);
    if (!free && d.coins < box.price) return toast(`เหรียญไม่พอ ต้องการ 🪙 ${box.price}`, "bad");
    if (!free && !(await confirmBox(`เปิด “${box.name}” ด้วย 🪙 ${box.price}?`, "เปิดกล่อง"))) return;
    const dlg = document.createElement("dialog");
    dlg.className = "boxmodal";
    dlg.innerHTML = html`<div class="reveal"><div class="inner"><div class="chest" aria-hidden="true"><img class="px-chest" src="${chestImg(box.id)}" alt=""></div><p class="muted">กำลังเปิดกล่อง…</p></div></div>`.s;
    document.body.appendChild(dlg);
    dlg.showModal();
    dlg.addEventListener("close", () => dlg.remove());
    let r;
    try { [r] = await Promise.all([api("/api/shop/box", { body: { boxId, free } }), new Promise((ok) => setTimeout(ok, 1400))]); }
    catch (e) { dlg.close(); return toast(e.message, "bad"); }
    const it = r.item;
    const full = d.items.find((x) => x.id === it.id) || it;
    dlg.innerHTML = html`<div class="reveal r-${r.rarity}"><div class="glow" aria-hidden="true"></div><div class="inner">
      <div class="rar-name">★ ${r.rarityName} ★</div><div class="prize">${itemVisual(full, true)}</div>
      <h2 style="margin:.3em 0 .1em">${it.name}</h2><p class="muted" style="margin:0">${d.slots[it.type]}</p>
      ${r.duplicate ? html`<p class="note small" style="text-align:left">มีของชิ้นนี้แล้ว — ได้คืน 🪙 ${r.refund}</p>` : html`<p class="small">เพิ่มเข้า “ของฉัน” แล้ว ✨</p>`}
      <div class="row" style="justify-content:center;margin-top:12px">
        ${!r.duplicate && !["theme", "sound"].includes(it.type) ? html`<button class="btn" id="eqNow">ใส่เลย</button>` : ""}${!r.duplicate && it.type === "theme" ? html`<button class="btn" id="thNow">ใช้ธีมนี้</button>` : ""}${!r.duplicate && it.type === "sound" ? html`<button class="btn" id="sndNow">ใช้เสียงนี้</button>` : ""}
        <button class="btn btn-ghost" id="ok">ปิด</button></div></div></div>`.s;
    playSound(r.rarity === "legendary" || r.rarity === "epic" ? "win" : "correct");
    if (["epic", "legendary"].includes(r.rarity)) confetti();
    dlg.querySelector("#ok").onclick = () => dlg.close();
    dlg.querySelector("#eqNow")?.addEventListener("click", async () => { await api("/api/shop/equip", { body: { slot: it.type, itemId: it.id } }); dlg.close(); toast("ใส่แล้ว ✨"); await reload(); });
    dlg.querySelector("#sndNow")?.addEventListener("click", async () => { setPrefs({ tickSound: it.value }); dlg.close(); await reload(); });
    dlg.querySelectorAll("[data-play]").forEach((b) => b.onclick = () => playTick(0, b.dataset.play, true));
    dlg.querySelector("#thNow")?.addEventListener("click", async () => { setPrefs({ palette: it.value }); dlg.close(); await reload(); });
    dlg.addEventListener("close", () => reload(), { once: true });
  }

  // โครงหน้า: ฉากในร้าน (สร้างครั้งเดียว) + เนื้อหาที่วาดใหม่ทุกครั้งที่ข้อมูลเปลี่ยน
  document.body.classList.add("shop-world"); loadSkinFont("pixel");
  main.innerHTML = html`<section class="shop-scene" aria-label="ในร้านค้า">
      <div class="ss-bubble" role="status" aria-live="polite"></div>
      <h1 class="ss-sign">🛒 ร้านค้า</h1>
      <a class="ss-back" href="/" id="ssBack">⬅ กลับหมู่บ้าน</a>
      <div class="ss-wallet" id="ssWallet"></div>
    </section><div class="shop-body" id="shopBody"></div>`.s;
  const body = main.querySelector("#shopBody");
  main.querySelector("#ssBack").addEventListener("click", () => { try { sessionStorage.setItem("eduplay:worldPos", "shop"); } catch { /* ignore */ } });
  const greet = [me ? `ยินดีต้อนรับ ${me.displayName}! เลือกดูของได้ตามสบายเลย` : "ยินดีต้อนรับสู่ร้านค้า! เลือกดูของได้ตามสบายเลย",
    ...(me && d.freeBox ? ["วันนี้เปิดกล่องสุ่มธรรมดาฟรีได้ 1 ครั้งนะ!"] : []), ...(!me ? ["เข้าสู่ระบบแล้วเล่นเกมสะสมเหรียญ มาแลกของที่ร้านได้นะ"] : []),
    "กล่องสุ่มโปรไฟล์มีรูปให้สะสมตั้ง 16 ร่างเลยนะ", "ของที่ได้แล้วไปเปลี่ยนใส่ได้ที่กระเป๋า"];
  const brand = getComputedStyle(document.documentElement).getPropertyValue("--brand").trim();
  const scene = mountShopScene(main.querySelector(".shop-scene"), { shirt: /^#[0-9a-f]{6}$/i.test(brand) ? brand : "#5b3df5", reduced: reducedMotion(), greet });
  onLeave(() => { scene.destroy(); document.body.classList.remove("shop-world"); });
  render();
}
