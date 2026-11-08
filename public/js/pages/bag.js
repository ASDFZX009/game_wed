// กระเป๋าเก็บของ: เมนูแผ่นป้ายเฉียงรอบรูปโปรไฟล์ใหญ่ตรงกลาง กดหมวดเพื่อเลือกใส่/ใช้ของที่มี
import { api, html, raw, state, toast, avatar, titleTag } from "../core.js";
import { go, refreshMe } from "../app.js";
import { setPrefs, getPrefs, playTick, PALETTES } from "../prefs.js";
import { itemVisual } from "./shop.js";
import { pxImg } from "../ui/pixui.js";

const CATS = [
  { id: "face", side: "L", th: "หน้าตา", en: "FACE", ic: "🎭", px: "face", types: ["pfp", "avatar"], desc: "รูปโปรไฟล์จากกล่องสุ่มโปรไฟล์ และอวาตาร์" },
  { id: "frame", side: "L", th: "กรอบรูป", en: "FRAME", ic: "🖼️", px: "frame", types: ["frame"], desc: "กรอบรอบรูปโปรไฟล์" },
  { id: "title", side: "L", th: "ฉายา", en: "TITLE", ic: "🏷️", px: "tag", types: ["title"], desc: "ป้ายฉายาข้างชื่อ" },
  { id: "effect", side: "L", th: "เอฟเฟกต์", en: "EFFECT", ic: "🎉", px: "party", types: ["effect"], desc: "พลุตอนทำคะแนนได้ดี" },
  { id: "shop", side: "R", th: "ร้านค้า", en: "SHOP", ic: "🛒", px: "shop", href: "/shop", hot: true },
  { id: "theme", side: "R", th: "ธีม & พื้นหลัง", en: "THEME", ic: "🎨", px: "palette", types: ["theme", "background"], desc: "ธีมสีพิเศษและลายพื้นหลังเว็บ" },
  { id: "sound", side: "R", th: "เสียง", en: "SOUND", ic: "🎵", px: "note", types: ["sound"], desc: "เสียงตอนตัวเลขบวกขึ้นในหน้าสรุปผล" },
  { id: "stats", side: "R", th: "ความคืบหน้า", en: "STATUS", ic: "📊", px: "chart", href: "/dashboard" },
];

export async function bag({ main }) {
  if (!state.me) {
    main.innerHTML = html`<div class="card center narrow"><div style="font-size:3rem">🎒</div><h1>กระเป๋าเก็บของ</h1><p class="muted">เข้าสู่ระบบเพื่อดูของสะสมของคุณ</p><a class="btn" href="/login?next=/bag">เข้าสู่ระบบ</a></div>`.s;
    return;
  }
  let d = await api("/api/shop");
  const count = (c) => { const all = d.items.filter((x) => c.types.includes(x.type)); return [all.filter((x) => x.owned).length, all.length]; };

  const plate = (c, i) => {
    const [have, total] = c.types ? count(c) : [0, 0];
    return html`<button type="button" class="bh-plate ${c.hot ? "hot" : ""}" data-cat="${c.id}" style="--i:${i}">
      <span class="ic" aria-hidden="true">${raw(pxImg(c.px, 48))}</span><span class="th">${c.th}</span><span class="en" aria-hidden="true">${c.en}</span>
      ${c.types ? html`<span class="cnt">${have}/${total}</span>` : ""}</button>`;
  };
  const words = Array.from({ length: 28 }, (_, i) => `<span style="--x:${(i * 37) % 100}%;--y:${(i * 61) % 100}%;--s:${2.4 + (i % 5) * 1.1}rem">${["กระเป๋า", "BAG", "ของสะสม", "ITEM", "QUIZ ODYSSEY"][i % 5]}</span>`).join("");

  const draw = () => {
    const me = state.me, look = me.equipped || {};
    main.innerHTML = html`<section class="bag-hub" aria-labelledby="bh-title">
      <div class="bh-words" aria-hidden="true">${raw(words)}</div>
      <div class="bh-wedge" aria-hidden="true"></div>
      <a class="bh-back" href="/dashboard"><span aria-hidden="true">↩</span> กลับ</a>
      <a class="bh-coins" href="/shop" title="เหรียญของฉัน">${raw(pxImg("coin", 28))} <b>${d.coins.toLocaleString("th-TH")}</b></a>
      <h1 class="sr-only" id="bh-title">กระเป๋าเก็บของ</h1>
      <nav class="bh-col left" aria-label="หมวดของสะสม">${CATS.filter((c) => c.side === "L").map(plate)}</nav>
      <div class="bh-center">
        <div class="bh-figure"><div class="bh-burst" aria-hidden="true"></div>${avatar(look, "jumbo")}</div>
        <div class="bh-name"><b>${me.displayName}</b>${titleTag(look)}</div>
        <div class="bh-lv">ระดับ ${Math.floor((me.xp || 0) / 100) + 1} · ${(me.xp || 0).toLocaleString("th-TH")} XP · ของสะสม ${d.items.filter((x) => x.owned).length}/${d.items.length}</div>
      </div>
      <nav class="bh-col right" aria-label="เมนูอื่น">${CATS.filter((c) => c.side === "R").map(plate)}</nav>
    </section>`.s;
    main.querySelectorAll("[data-cat]").forEach((b) => b.onclick = () => {
      const c = CATS.find((x) => x.id === b.dataset.cat);
      if (c.href) return go(c.href);
      openCat(c);
    });
  };

  function openCat(c) {
    const dlg = document.createElement("dialog");
    dlg.className = "bag-dlg";
    document.body.appendChild(dlg);
    const fill = () => {
      const list = d.items.filter((x) => c.types.includes(x.type));
      const mine = list.filter((x) => x.owned);
      const p = getPrefs();
      const inUse = (it) => it.type === "theme" ? p.palette === it.value : it.type === "sound" ? p.tickSound === it.value : it.equipped;
      const card = (it) => html`<div class="bd-item r-${it.rarity} ${inUse(it) ? "on" : ""}">
        <span class="rar">${d.rarity[it.rarity].name}</span><div class="vis">${itemVisual(it)}</div><div class="nm">${it.name}</div>
        ${inUse(it)
          ? (["theme", "sound"].includes(it.type) ? html`<span class="bd-on">✓ ใช้อยู่</span>` : html`<button class="bd-btn ghost" data-off="${it.type}">✓ ใส่อยู่ · ถอด</button>`)
          : html`<button class="bd-btn" data-use="${it.id}">${it.type === "theme" || it.type === "sound" ? "ใช้" : "ใส่"}</button>`}</div>`;
      const extra = c.id === "sound" ? html`<div class="bd-item ${p.tickSound === "synth" || !p.tickSound ? "on" : ""}"><span class="rar">ฟรี</span><div class="vis"><button type="button" class="snd-prev" data-play="synth"><span>✨</span><b>▶</b></button></div><div class="nm">เลเวลอัป</div>
          ${p.tickSound === "synth" || !p.tickSound ? html`<span class="bd-on">✓ ใช้อยู่</span>` : html`<button class="bd-btn" data-synth="1">ใช้</button>`}</div>`
        : c.id === "theme" ? html`<div class="bd-item ${!PALETTES.find((x) => x.id === p.palette)?.premium ? "on" : ""}"><span class="rar">ฟรี</span><div class="vis"><span class="swatch" style="display:inline-block;background:linear-gradient(135deg,#5b3df5,#ff6fae)"></span></div><div class="nm">ธีมพื้นฐาน 6 สี</div><a class="bd-btn" href="/settings">เลือกในตั้งค่า</a></div>` : "";
      dlg.innerHTML = html`<div class="bd-head"><span class="ic" aria-hidden="true">${raw(pxImg(c.px, 48))}</span><div><h2>${c.th}</h2><p>${c.desc} · มี ${mine.length}/${list.length} ชิ้น</p></div>
        <button class="bd-x" aria-label="ปิด" id="bdX">✕</button></div>
        <div class="bd-body">${mine.length || extra ? html`<div class="bd-grid">${extra}${mine.map(card)}</div>` : ""}
          ${!mine.length ? html`<div class="bd-empty"><p>ยังไม่มีของในหมวดนี้</p></div>` : ""}
          ${mine.length < list.length ? html`<a class="bd-more" href="/shop">🛒 ยังขาดอีก ${list.length - mine.length} ชิ้น — ไปร้านค้า / เปิดกล่องสุ่ม ▶</a>` : html`<p class="bd-done">🏆 สะสมครบทุกชิ้นในหมวดนี้แล้ว!</p>`}</div>`.s;
      dlg.querySelector("#bdX").onclick = () => dlg.close();
      dlg.querySelectorAll("[data-play]").forEach((b) => b.onclick = () => playTick(0, b.dataset.play, true));
      dlg.querySelectorAll("a[href]").forEach((a) => a.addEventListener("click", () => dlg.close()));
      dlg.querySelector("[data-synth]")?.addEventListener("click", () => { setPrefs({ tickSound: "synth" }); playTick(0, "synth"); fill(); });
      dlg.querySelectorAll("[data-use]").forEach((b) => b.onclick = async () => {
        const it = d.items.find((x) => x.id === b.dataset.use);
        try {
          if (it.type === "theme") { setPrefs({ palette: it.value }); toast(`ใช้ “${it.name}” แล้ว 🎨`); }
          else if (it.type === "sound") { setPrefs({ tickSound: it.value }); playTick(0, it.value); toast(`ใช้เสียง “${it.name}” แล้ว 🎵`); }
          else {
            await api("/api/shop/equip", { body: { slot: it.type, itemId: it.id } });
            // ใส่รูปโปรไฟล์กับอวาตาร์พร้อมกันได้ แต่แสดงรูปโปรไฟล์ก่อน: เลือกอวาตาร์ = ถอดรูปโปรไฟล์ให้เห็นผลทันที
            if (it.type === "avatar" && state.me.equipped?.pfp) await api("/api/shop/equip", { body: { slot: "pfp", itemId: null } });
            toast(`ใส่ “${it.name}” แล้ว ✨`);
          }
          await reload(); fill();
        } catch (e) { toast(e.message, "bad"); }
      });
      dlg.querySelectorAll("[data-off]").forEach((b) => b.onclick = async () => { await api("/api/shop/equip", { body: { slot: b.dataset.off, itemId: null } }); toast("ถอดแล้ว"); await reload(); fill(); });
    };
    fill();
    dlg.addEventListener("close", () => { dlg.remove(); draw(); });
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    dlg.showModal();
    dlg.querySelector(".bd-btn, #bdX")?.focus();
  }
  const reload = async () => { d = await api("/api/shop"); await refreshMe(); };
  draw();
}
