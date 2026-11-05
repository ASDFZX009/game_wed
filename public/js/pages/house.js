// 🏠 ภายในบ้านวิชา (เปิดซ้อนบนหมู่บ้าน ไม่ต้องเปลี่ยนหน้า): แผนที่เรื่องราว → การ์ดด่าน → สู้บอส → กลับแผนที่
import { api, html, raw, toast } from "../core.js";
import { refreshMe } from "../app.js";
import { startGame } from "../game.js";
import { subjectSign } from "../world/signs.js";
import { STORY } from "../story.js";

const CAT_ORDER = ["math", "science", "thai", "english", "social", "health", "early", "brain", "general"];
const signCache = new Map();
const signURL = (id) => { if (!signCache.has(id)) { const s = subjectSign(id), c = document.createElement("canvas"); c.width = s.c.width; c.height = s.c.height; c.getContext("2d").drawImage(s.c, 0, 0); signCache.set(id, c.toDataURL()); } return signCache.get(id); };
const stars = (n) => html`<span class="hz-st" aria-label="${n} ดาว">${[1, 2, 3].map((i) => html`<i class="${i <= n ? "on" : ""}">★</i>`)}</span>`;

export function openHouse({ cat, onClose, onPlayState }) {
  const el = document.createElement("div"); el.className = "hz"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true");
  el.innerHTML = `<div class="hz-dim"></div><div class="hz-box"><div class="hz-top"><button type="button" class="hz-x" data-x>⬅ ออกจากบ้าน</button><div class="hz-title"></div><div class="hz-prog"></div></div><div class="hz-body"></div></div>`;
  document.body.appendChild(el); document.body.classList.add("hz-open");
  const body = el.querySelector(".hz-body"), titleEl = el.querySelector(".hz-title"), progEl = el.querySelector(".hz-prog");
  let stopGame = null, plan = null, closed = false;
  const close = () => { if (closed) return; closed = true; stopGame?.(); el.remove(); document.body.classList.remove("hz-open"); document.removeEventListener("keydown", onKey); onClose?.(); };
  const onKey = (e) => { if (e.key === "Escape" && !el.querySelector(".hz-sheet") && !stopGame) { e.preventDefault(); close(); } else if (e.key === "Escape" && el.querySelector(".hz-sheet")) { el.querySelector(".hz-sheet")?.remove(); } };
  document.addEventListener("keydown", onKey);
  el.querySelector("[data-x]").onclick = () => (stopGame ? showMap() : close());
  el.querySelector(".hz-dim").onclick = () => { if (!stopGame) close(); };

  async function showMap(focusN) {
    stopGame?.(); stopGame = null; onPlayState?.(false); el.classList.remove("playing"); el.querySelector("[data-x]").textContent = "⬅ ออกจากบ้าน";
    body.innerHTML = '<div class="loading" aria-busy="true">กำลังเปิดแผนที่…</div>';
    try { plan = await api(`/api/story/${cat}`); } catch (e) { body.innerHTML = html`<div class="card center"><p>${e.message}</p></div>`.s; return; }
    titleEl.innerHTML = html`<img src="${signURL(cat)}" alt=""><b>${plan.house?.name || ""}</b>`.s;
    progEl.innerHTML = html`<span>★ ${plan.got}<small>/${plan.max}</small></span><span>ด่าน ${Math.min(plan.current, plan.total)}/${plan.total}</span>`.s;
    body.innerHTML = html`<div class="hz-intro"><span class="hz-villain">${{ math: "🧙‍♂️", science: "☁️", thai: "👻", english: "👸", social: "🦹", health: "👹", early: "🐱", brain: "🌑", general: "🦉" }[cat] || "👾"}</span><p>${plan.intro}</p></div>
      ${plan.chapters.map((ch) => { const open = ch.stages.some((s) => s.unlocked); return html`<section class="hz-ch lv${ch.level} ${open ? "" : "locked"}">
        <header><h2>${ch.title}</h2><span class="hz-lv">${"●".repeat(ch.level)}${"○".repeat(5 - ch.level)} ${ch.levelName}</span></header>
        <p class="hz-chi">${open ? ch.intro : "🔒 ผ่านบทก่อนหน้าเพื่อเปิดบทนี้"}</p>
        <ol class="hz-path">${ch.stages.map((s, i) => html`<li class="hz-node ${s.boss ? "boss" : ""} ${s.unlocked ? "" : "lock"} ${s.n === plan.current ? "cur" : ""} ${s.stars ? "done" : ""}" style="--i:${i}">
          <button type="button" data-n="${s.n}" ${s.unlocked ? "" : raw("disabled")} aria-label="ด่าน ${s.n} ${s.lesson}${s.boss ? " (บอส)" : ""} ${s.unlocked ? `${s.stars} ดาว` : "ล็อกอยู่"}">
            <span class="hz-num">${s.unlocked ? (s.boss ? "👑" : s.n) : "🔒"}</span><span class="hz-ic">${s.icon}</span></button>
          <span class="hz-name">${s.lesson}</span>${s.unlocked ? stars(s.stars) : ""}</li>`)}</ol></section>`; })}`.s;
    body.querySelectorAll("[data-n]").forEach((b) => (b.onclick = () => sheet(+b.dataset.n)));
    const cur = body.querySelector(focusN ? `[data-n="${focusN}"]` : ".hz-node.cur button") || body.querySelector("[data-n]");
    cur?.scrollIntoView({ block: "center" }); cur?.focus({ preventScroll: true });
  }
  function sheet(n) {
    let st = null, chp = null; for (const ch of plan.chapters) for (const s of ch.stages) if (s.n === n) { st = s; chp = ch; }
    if (!st) return; el.querySelector(".hz-sheet")?.remove();
    const sh = document.createElement("div"); sh.className = "hz-sheet"; sh.setAttribute("role", "dialog"); sh.setAttribute("aria-label", `ด่าน ${n}`);
    sh.innerHTML = html`<div class="hz-card"><span class="hz-tag">${chp.title} · ด่าน ${n}${st.boss ? " · ด่านบอส" : ""}</span>
      <div class="hz-big">${st.icon}</div><h3>${st.lesson}</h3><p>${st.line}</p>
      <div class="hz-meta"><span>ความยาก ${chp.levelName}</span><span>${{ mcq: "🎯 ปรนัย", truefalse: "⚖️ ถูกหรือผิด", timed: "⏱️ ท้าเวลา" }[st.mode]}</span><span>${st.count} ข้อ</span></div>
      ${st.stars ? html`<p class="hz-best">ดีที่สุด ${stars(st.stars)} · เล่นซ้ำได้ คำถามจะไม่ซ้ำเดิมจนกว่าจะครบคลัง</p>` : html`<p class="hz-best">ได้อย่างน้อย ★ เพื่อเปิดด่านถัดไป</p>`}
      <div class="hz-act"><button type="button" class="btn btn-ghost" data-c>ปิด</button><button type="button" class="btn" data-go>⚔️ เข้าสู่ด่าน</button></div></div>`.s;
    el.querySelector(".hz-box").appendChild(sh);
    sh.querySelector("[data-c]").onclick = () => sh.remove(); sh.onclick = (e) => { if (e.target === sh) sh.remove(); };
    sh.querySelector("[data-go]").onclick = () => { sh.remove(); play(n); }; sh.querySelector("[data-go]").focus();
  }
  async function play(n) {
    stopGame?.(); stopGame = null; body.innerHTML = '<div class="loading" aria-busy="true">กำลังเตรียมด่าน…</div>';
    let data; try { data = await api(`/api/story/${cat}/${n}/play`); } catch (e) { toast(e.message, "bad"); return showMap(n); }
    el.classList.add("playing"); onPlayState?.(true); el.querySelector("[data-x]").textContent = "⬅ กลับแผนที่";
    body.innerHTML = '<div class="hz-game"></div>'; body.scrollTop = 0;
    stopGame = startGame(body.querySelector(".hz-game"), data, {
      restart: () => play(n), onBack: () => { refreshMe().catch(() => {}); showMap(n); }, backText: "🗺️ กลับแผนที่เรื่องราว",
      next: data.story.next ? () => play(data.story.next.n) : null,
    });
  }
  showMap();
  return { close, el };
}

// 🗺️ เลือกบ้านวิชาจากหน้าหลัก (ไม่ต้องเดินไปถึงบ้าน)
export function openPicker({ onPick, onClose }) {
  const el = document.createElement("div"); el.className = "hz hz-pick"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "เลือกบ้านวิชา");
  el.innerHTML = `<div class="hz-dim"></div><div class="hz-box"><div class="hz-top"><button type="button" class="hz-x" data-x>✖ ปิด</button><div class="hz-title"><b>🗺️ เลือกบ้านวิชา</b></div><div class="hz-prog"></div></div><div class="hz-body"><div class="loading">กำลังโหลด…</div></div></div>`;
  document.body.appendChild(el); document.body.classList.add("hz-open");
  let closed = false; const close = (picked) => { if (closed) return; closed = true; el.remove(); document.body.classList.remove("hz-open"); document.removeEventListener("keydown", onKey); onClose?.(picked || null); if (picked) onPick(picked); };
  const onKey = (e) => { if (e.key === "Escape") { e.preventDefault(); close(); } };
  document.addEventListener("keydown", onKey); el.querySelector("[data-x]").onclick = () => close(); el.querySelector(".hz-dim").onclick = () => close();
  Promise.all(CAT_ORDER.map((c) => api(`/api/story/${c}`).catch(() => null))).then((plans) => { if (closed) return;
    el.querySelector(".hz-body").innerHTML = html`<p class="hz-pick-lead">เลือกบ้านแล้วออกผจญภัยในเรื่องราวของแต่ละวิชา — ยิ่งไปไกล คำถามยิ่งยากขึ้น</p><div class="hz-grid">${plans.map((P, i) => P ? html`<button type="button" class="hz-house" data-cat="${CAT_ORDER[i]}">
      <img src="${signURL(CAT_ORDER[i])}" alt=""><b>${P.house?.name}</b><span class="hz-vil">ศัตรู: ${STORY[CAT_ORDER[i]].villain}</span>
      <span class="hz-bar"><i style="width:${(P.got / P.max) * 100}%"></i></span><span class="hz-sub">★ ${P.got}/${P.max} · ด่าน ${Math.min(P.current, P.total)}/${P.total}</span></button>` : "")}</div>`.s;
    el.querySelectorAll("[data-cat]").forEach((b) => (b.onclick = () => close(b.dataset.cat)));
    el.querySelector("[data-cat]")?.focus(); });
  return { close: () => close() };
}
