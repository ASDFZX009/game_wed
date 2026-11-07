// 🏠 ภายในบ้านวิชา (เปิดซ้อนบนหมู่บ้าน ไม่ต้องเปลี่ยนหน้า): แผนที่เรื่องราว → การ์ดด่าน → สู้บอส → กลับแผนที่
import { api, html, raw, toast } from "../core.js";
import { refreshMe } from "../app.js";
import { startGame } from "../game.js";
import { subjectSign } from "../world/signs.js";
import { STORY } from "../story.js";

const CAT_ORDER = ["math", "science", "thai", "english", "social", "health", "early", "brain", "general"];
const signCache = new Map();
const signURL = (id) => { if (!signCache.has(id)) { const s = subjectSign(id), c = document.createElement("canvas"); c.width = s.c.width; c.height = s.c.height; c.getContext("2d").drawImage(s.c, 0, 0); signCache.set(id, c.toDataURL()); } return signCache.get(id); };
// สายชั้น: เน้นด่านที่ตรงช่วงชั้นของผู้เล่น (ด่านอื่นจางลง แต่ยังเล่นได้)
// ชั้นเรียนของผู้เล่น: เลือกครั้งเดียว ใช้ทุกบ้าน → คำถามตรงชั้น (g0 อนุบาล · g1–g6 ป.1–ป.6 · g7–g12 ม.1–ม.6)
const GL = (g) => (g === 0 ? "อนุบาล" : g <= 6 ? `ป.${g}` : `ม.${g - 6}`);
// แบ่งตามชั้นชัดเจน: ต้องเลือกชั้นก่อนเล่น (ไม่มีตัวเลือก "ทุกชั้น") · แต่ละชั้นมีเส้นทางและดาวของตัวเอง
const TRACK_RANGE = { all: [0, 12], ...Object.fromEntries(Array.from({ length: 13 }, (_, g) => [`g${g}`, [g, g]])) };
let track = (() => { try { const t = localStorage.getItem("qo:track"); return /^g\d+$/.test(t || "") && TRACK_RANGE[t] ? t : "all"; } catch { return "all"; } })();
const trackPicked = () => track !== "all";
const setTrack = (t) => { track = t; try { localStorage.setItem("qo:track", t); } catch { /* ignore */ } };
// ปุ่มเลือกชั้น: อนุบาล · ประถม ป.1–ป.6 · มัธยม ม.1–ม.6
const gradeGrid = () => html`<div class="hz-grades">${[["", [0]], ["ประถม", [1, 2, 3, 4, 5, 6]], ["มัธยม", [7, 8, 9, 10, 11, 12]]].map(([lab, gs]) => html`<div class="hz-grow">${lab ? html`<small>${lab}</small>` : ""}${gs.map((g) => html`<button type="button" class="${track === `g${g}` ? "on" : ""}" data-track="g${g}" aria-pressed="${track === `g${g}`}">${GL(g)}</button>`)}</div>`)}</div>`;
const inTrack = (gr) => { const [a, b] = TRACK_RANGE[track] || TRACK_RANGE.all; return !gr || (gr[0] <= b && gr[1] >= a); };
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
    if (!trackPicked()) { // ยังไม่ได้เลือกชั้น → เลือกก่อน แล้วค่อยเปิดแผนที่ของชั้นนั้น
      body.innerHTML = html`<div class="hz-track ask"><p class="hz-ask">👋 เลือกชั้นเรียนของคุณก่อนเริ่ม — ด่านและคำถามทั้งหมดจะเป็นของชั้นนั้นเท่านั้น</p>${gradeGrid()}</div>`.s;
      body.querySelectorAll("[data-track]").forEach((b) => (b.onclick = () => { setTrack(b.dataset.track); showMap(); })); return;
    }
    body.innerHTML = '<div class="loading" aria-busy="true">กำลังเปิดแผนที่…</div>';
    try { plan = await api(`/api/story/${cat}?track=${track}`); } catch (e) { body.innerHTML = html`<div class="card center"><p>${e.message}</p></div>`.s; return; }
    titleEl.innerHTML = html`<img src="${signURL(cat)}" alt=""><b>${plan.house?.name || ""}</b><span class="hz-gtag">${plan.grade || ""}</span>`.s;
    const trackBox = html`<div class="hz-track"><span>🎓 ชั้นเรียนของฉัน: <b>${plan.grade}</b></span><button type="button" class="hz-chg" data-chg>เปลี่ยนชั้น</button>
      <div class="hz-gpick" hidden>${gradeGrid()}</div>
      <p class="hz-gnote">ทุกด่านในแผนที่นี้เป็นบทเรียนและคำถามของชั้น <b>${plan.grade}</b> เท่านั้น · บทหลัง ๆ ข้อเยอะขึ้นและมีจับเวลา · ดาวเก็บแยกตามชั้น</p></div>`;
    const bindTrack = () => {
      body.querySelector("[data-chg]")?.addEventListener("click", () => { const g = body.querySelector(".hz-gpick"); g.hidden = !g.hidden; });
      body.querySelectorAll("[data-track]").forEach((b) => (b.onclick = () => { setTrack(b.dataset.track); showMap(); }));
    };
    if (plan.empty) {
      progEl.innerHTML = "";
      body.innerHTML = html`${trackBox}<div class="card center hz-empty"><div style="font-size:2.4rem">📭</div>${cat === "early" ? html`<h3>บ้านปฐมวัยเป็นบ้านของอนุบาลและ ป.1</h3><p class="muted">บทเรียนชั้น ${plan.grade} อยู่ในบ้านวิชาอื่นครบทุกบ้าน — ลองบ้านคณิต วิทย์ ภาษาไทย ภาษาอังกฤษ ฯลฯ</p>` : html`<h3>บ้านนี้ยังไม่มีบทเรียนของชั้น ${plan.grade}</h3><p class="muted">ลองบ้านวิชาอื่น หรือเปลี่ยนชั้นเรียนด้านบน</p>`}</div>`.s;
      bindTrack(); return;
    }
    progEl.innerHTML = html`<span>★ ${plan.got}<small>/${plan.max}</small></span><span>ด่าน ${Math.min(plan.current, plan.total)}/${plan.total}</span>`.s;
    body.innerHTML = html`<div class="hz-intro"><span class="hz-villain">${{ math: "🧙‍♂️", science: "☁️", thai: "👻", english: "👸", social: "🦹", health: "👹", early: "🐱", brain: "🌑", general: "🦉" }[cat] || "👾"}</span><p>${plan.intro}</p></div>
      ${trackBox}
      ${plan.chapters.map((ch) => { const open = ch.stages.some((s) => s.unlocked); return html`<section class="hz-ch lv${ch.level} ${open ? "" : "locked"}">
        <header><h2>${ch.title}</h2><span class="hz-lv">${"●".repeat(ch.level)}${"○".repeat(5 - ch.level)} ${ch.levelName}</span></header>
        <p class="hz-chi">${open ? ch.intro : "🔒 ผ่านบทก่อนหน้าเพื่อเปิดบทนี้"}</p>
        <ol class="hz-path">${ch.stages.map((s, i) => html`<li class="hz-node ${s.boss ? "boss" : ""} ${s.unlocked ? "" : "lock"} ${s.n === plan.current ? "cur" : ""} ${s.stars ? "done" : ""} ${inTrack(s.gr) ? "" : "off"}" style="--i:${i}">
          <button type="button" data-n="${s.n}" ${s.unlocked ? "" : raw("disabled")} aria-label="ด่าน ${s.n} ${s.lesson}${s.boss ? " (บอส)" : ""} ${s.unlocked ? `${s.stars} ดาว` : "ล็อกอยู่"}">
            <span class="hz-num">${s.unlocked ? (s.boss ? "👑" : s.n) : "🔒"}</span><span class="hz-ic">${s.icon}</span></button>
          <span class="hz-name">${s.lesson}</span><span class="hz-gr">${s.grade || ""}</span>${s.unlocked ? stars(s.stars) : ""}</li>`)}</ol></section>`; })}`.s;
    bindTrack();
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
      <div class="hz-meta"><span>🎓 คำถามชั้น ${plan.grade || st.grade || "-"}</span><span>ความยาก ${chp.levelName}</span><span>${{ mcq: "🎯 ปรนัย", truefalse: "⚖️ ถูกหรือผิด", timed: "⏱️ ท้าเวลา" }[st.mode]}</span><span>${st.count} ข้อ</span></div>
      ${st.stars ? html`<p class="hz-best">ดีที่สุด ${stars(st.stars)} · เล่นซ้ำได้ คำถามจะไม่ซ้ำเดิมจนกว่าจะครบคลัง</p>` : html`<p class="hz-best">ได้อย่างน้อย ★ เพื่อเปิดด่านถัดไป</p>`}
      <div class="hz-act"><button type="button" class="btn btn-ghost" data-c>ปิด</button><button type="button" class="btn" data-go>⚔️ เข้าสู่ด่าน</button></div></div>`.s;
    el.querySelector(".hz-box").appendChild(sh);
    sh.querySelector("[data-c]").onclick = () => sh.remove(); sh.onclick = (e) => { if (e.target === sh) sh.remove(); };
    sh.querySelector("[data-go]").onclick = () => { sh.remove(); play(n); }; sh.querySelector("[data-go]").focus();
  }
  async function play(n) {
    stopGame?.(); stopGame = null; body.innerHTML = '<div class="loading" aria-busy="true">กำลังเตรียมด่าน…</div>';
    let data; try { data = await api(`/api/story/${cat}/${n}/play?track=${track}`); } catch (e) { toast(e.message, "bad"); return showMap(n); }
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
  const bodyEl = el.querySelector(".hz-body");
  const bindGrades = () => bodyEl.querySelectorAll("[data-track]").forEach((b) => (b.onclick = () => { setTrack(b.dataset.track); load(); }));
  function load() {
    if (!trackPicked()) { // เลือกชั้นก่อน → บ้านทุกหลังจะแสดงเฉพาะบทเรียนของชั้นนั้น
      bodyEl.innerHTML = html`<div class="hz-track ask"><p class="hz-ask">👋 เลือกชั้นเรียนของคุณก่อน — ทุกบ้านจะมีเฉพาะบทเรียนและคำถามของชั้นนั้น</p>${gradeGrid()}</div>`.s; bindGrades(); return;
    }
    bodyEl.innerHTML = '<div class="loading">กำลังโหลด…</div>';
    Promise.all(CAT_ORDER.map((c) => api(`/api/story/${c}?track=${track}`).catch(() => null))).then((plans) => { if (closed) return;
      const gName = GL(+track.slice(1));
      bodyEl.innerHTML = html`<div class="hz-track"><span>🎓 ชั้นเรียนของฉัน: <b>${gName}</b></span><button type="button" class="hz-chg" data-chg>เปลี่ยนชั้น</button><div class="hz-gpick" hidden>${gradeGrid()}</div></div>
        <p class="hz-pick-lead">เลือกบ้านแล้วออกผจญภัย — ทุกด่านเป็นบทเรียนของชั้น ${gName} · ยิ่งไปไกล ข้อยิ่งเยอะและมีจับเวลา</p><div class="hz-grid">${plans.map((P, i) => !P ? "" : P.empty
        ? html`<button type="button" class="hz-house empty" disabled><img src="${signURL(CAT_ORDER[i])}" alt=""><b>${P.house?.name}</b><span class="hz-sub">${CAT_ORDER[i] === "early" ? "🧸 บ้านของอนุบาล–ป.1" : `📭 ยังไม่มีบทเรียนของชั้น ${gName}`}</span></button>`
        : html`<button type="button" class="hz-house" data-cat="${CAT_ORDER[i]}">
      <img src="${signURL(CAT_ORDER[i])}" alt=""><b>${P.house?.name}</b><span class="hz-vil">ศัตรู: ${STORY[CAT_ORDER[i]].villain}</span>
      <span class="hz-bar"><i style="width:${(P.got / P.max) * 100}%"></i></span><span class="hz-sub">★ ${P.got}/${P.max} · ด่าน ${Math.min(P.current, P.total)}/${P.total}</span><span class="hz-sub">🎓 ${gName} · ${P.chapters[0].stages.length} บทเรียน</span></button>`)}</div>`.s;
      bodyEl.querySelector("[data-chg]").onclick = () => { const g = bodyEl.querySelector(".hz-gpick"); g.hidden = !g.hidden; };
      bindGrades();
      bodyEl.querySelectorAll("[data-cat]").forEach((b) => (b.onclick = () => close(b.dataset.cat)));
      bodyEl.querySelector("[data-cat]")?.focus(); });
  }
  load();
  return { close: () => close() };
}
