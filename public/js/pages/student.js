// หน้าของนักเรียน: แดชบอร์ด โปรไฟล์ ห้องเรียน ตั้งค่า
import { api, html, raw, state, toast, fmtDate, fmtDay, relTime, dueText, pct, barChart, formData, busy, confirmBox, levelInfo, avatar, titleTag } from "../core.js";
import { go, refreshMe, onLeave } from "../app.js";
import { pxPage } from "../pxpage.js";
import { rankOf, SHINY } from "../journey.js";
import { BOSSES } from "../bosses.js";
import { charFrame } from "../world/chars.js";
import { myLook, loadProfile } from "../look.js";
import * as T from "./teacher.js";
import { getPrefs, setPrefs, playSound, playTick, ownsTick, getTickSound, setTickSound, TICK_MAX_BYTES, TICK_SOUNDS, SKINS, PALETTES, DEFAULTS } from "../prefs.js";

const KIND = { game: "เล่นเกม", quiz: "ส่งแบบทดสอบ" };
export function assignmentHref(a, classId) {
  return a.kind === "game" ? `/games/${a.refId}?assignment=${a.id}&class=${classId}` : `/quizzes/${a.refId}?assignment=${a.id}&class=${classId}`;
}

// ภาพตัวละครของผู้เล่น (ใช้ตัวที่แต่งไว้ที่หน้าเริ่มเกม)
function drawHero(cv) {
  const brand = getComputedStyle(document.documentElement).getPropertyValue("--brand").trim();
  const f = charFrame(0, 0, myLook(/^#[0-9a-f]{6}$/i.test(brand) ? brand : "#5b3df5")), x = cv.getContext("2d");
  cv.width = 52; cv.height = 72; x.imageSmoothingEnabled = false; x.fillStyle = "rgba(30,20,10,.3)"; x.beginPath(); x.ellipse(26, 68, 13, 3, 0, 0, 7); x.fill(); x.drawImage(f.c, Math.round(26 - f.ax), Math.round(69 - f.ay));
}
// ภาพบอสในสมุด (ยังไม่เคยเจอ = เงาดำ)
function drawBoss(cv, id, seen, elite) {
  const B = BOSSES.find((b) => b.id === id); if (!B) return; const b = B.make(elite ? "#ff3a4a" : "#6a9ae0"), fr = b.frames[0];
  cv.width = fr.width; cv.height = fr.height; const x = cv.getContext("2d"); x.drawImage(fr, 0, 0);
  if (!seen) { x.globalCompositeOperation = "source-in"; x.fillStyle = "#1a1020"; x.fillRect(0, 0, fr.width, fr.height); }
}

export async function dashboard(ctx) {
  const { main, me } = ctx;
  if (me.role !== "student") return go("/teacher", true);
  pxPage(onLeave);
  const [d, P] = await Promise.all([api("/api/dashboard/student"), api("/api/progress").catch(() => null)]);
  const lv = levelInfo(d.xp, d.xpPerLevel);
  if (P) return journey(ctx, d, P, lv);
  main.innerHTML = html`<h1 class="px-sign">📖 ความคืบหน้า</h1>
    <section class="card"><div class="hello"><div class="row" style="gap:14px;flex-wrap:nowrap"><a href="/shop" title="แต่งตัวที่ร้านค้า">${avatar(me.equipped, "lg")}</a><div><h1 style="margin:0">สวัสดี ${me.displayName} 👋</h1>
      <div class="muted">${titleTag(me.equipped)} ระดับ ${lv.level} · ${d.xp} XP${d.streak ? html` · 🔥 เล่นต่อเนื่อง ${d.streak} วัน` : ""}</div></div></div>
      <a class="coins" href="/shop" style="font-size:1.1rem;padding:8px 14px">🪙 ${(me.coins || 0).toLocaleString("th-TH")} · ไปร้านค้า</a></div>
      <div class="xpbar" role="progressbar" aria-valuemin="0" aria-valuemax="${lv.per}" aria-valuenow="${lv.into}" aria-label="ความคืบหน้าสู่ระดับถัดไป"><i style="width:${(lv.into / lv.per) * 100}%"></i></div>
      <div class="small muted">อีก ${lv.need} XP ถึงระดับ ${lv.level + 1}</div></section>
    ${state.config.local ? "" : html`<h2>งานที่ต้องทำ</h2>`}
    ${state.config.local ? "" : d.todo.length ? html`<ul class="list">${d.todo.map((a) => html`<li><div class="grow"><b>${a.title}</b><div class="small muted">${a.className} · ${a.kind === "game" ? "เกม" : "แบบทดสอบ"} · ${a.overdue ? html`<span class="badge badge-bad">${dueText(a.dueAt)}</span>` : dueText(a.dueAt)}</div></div>
      <a class="btn btn-sm" href="${assignmentHref(a, a.classId)}">ทำเลย</a></li>`)}</ul>` : html`<div class="empty">ไม่มีงานค้าง เยี่ยมมาก! 🎉</div>`}
    <div class="stats">
      <div class="stat"><div class="k">แบบทดสอบที่ส่งแล้ว</div><div class="v">${d.stats.quizzes}</div></div>
      <div class="stat"><div class="k">คะแนนเฉลี่ยแบบทดสอบ</div><div class="v">${pct(d.stats.quizAvg, 1)}</div></div>
      <div class="stat"><div class="k">จำนวนครั้งที่เล่นเกม</div><div class="v">${d.stats.games}</div></div>
      <div class="stat"><div class="k">คะแนนเกมสูงสุด</div><div class="v">${d.stats.bestGame}</div></div></div>
    <div class="grid-2"><section><h2>คะแนนล่าสุด</h2>${d.recent.length ? html`<ul class="list">${d.recent.map((r) => html`<li><span class="grow ellipsis">${r.kind === "game" ? "🎮" : "📝"} ${r.kind === "quiz" ? html`<a href="/attempts/${r.attemptId}">${r.title}</a>` : r.title}<div class="small muted">${relTime(r.at)}</div></span>
        <b>${r.kind === "quiz" ? html`${r.score}/${r.max}${r.pending ? " ⏳" : ""}` : `${r.score}`}</b></li>`)}</ul>` : html`<div class="empty">ยังไม่มีคะแนน ลอง<a href="/games">เล่นเกม</a>ดูสิ</div>`}</section>
      <section><h2>เกมที่เล่นล่าสุด</h2>${d.recentGames.length ? html`<ul class="list">${d.recentGames.map((g) => html`<li><a class="grow ellipsis" href="/games/${g.id}">${g.title}</a><span class="small muted">ล่าสุด ${g.last} · เล่น ${g.plays} ครั้ง</span></li>`)}</ul>` : html`<div class="empty">ยังไม่ได้เล่นเกม</div>`}</section></div>
    <h2>เหรียญรางวัล</h2><div class="badges">${d.badges.map((b) => html`<div class="bdg ${b.earned ? "" : "locked"}" title="${b.desc}"><div class="ic">${b.earned ? b.icon : "🔒"}</div><div class="n">${b.name}</div><div class="d">${b.earned ? `ได้รับ ${fmtDate(b.at, false)}` : b.desc}</div></div>`)}</div>
    <div class="grid-2" style="margin-top:8px"><section><h2>XP 7 วันล่าสุด</h2><div class="card">${barChart(d.xpChart, { label: (r) => fmtDay(r.day), value: (r) => r.xp, unit: "XP", title: "XP รายวัน 7 วันล่าสุด" })}</div></section>
      <section><h2>กิจกรรมล่าสุด</h2>${d.activity.length ? html`<ul class="list">${d.activity.map((a) => html`<li><span class="grow ellipsis">${KIND[a.kind] || a.kind}<span class="small muted"> · ${a.title}</span></span><span class="small">+${a.xp} XP · ${fmtDate(a.created_at)}</span></li>`)}</ul>` : html`<div class="empty">ยังไม่มีกิจกรรม</div>`}</section></div>`.s;
}

function journey(ctx, d, P, lv) {
  const { main, me } = ctx, rk = P.rank, nextRank = rk.next, prof = loadProfile();
  const pctStars = P.maxStars ? (P.stars / P.maxStars) * 100 : 0, lastAt = P.milestones[P.milestones.length - 1].at;
  main.innerHTML = html`<h1 class="px-sign">📖 สมุดผจญภัย</h1>
    <section class="card jr-hero">
      <div class="jr-ava"><canvas id="jrHero" aria-label="ตัวละครของฉัน" role="img"></canvas><a class="linkish small" href="/" id="jrEdit">🎨 แต่งตัวละคร</a></div>
      <div class="jr-who"><div class="jr-name">${prof?.name || me.displayName}</div><div class="jr-rank">${rk.icon} ${rk.name}${titleTag(me.equipped)}</div>
        <div class="jr-lv"><b>Lv ${P.level}</b><div class="xpbar" role="progressbar" aria-valuemin="0" aria-valuemax="${lv.per}" aria-valuenow="${lv.into}" aria-label="XP สู่เลเวลถัดไป"><i style="width:${(lv.into / lv.per) * 100}%"></i></div><span class="small">${lv.into}/${lv.per} XP</span></div>
        <p class="small muted" style="margin:4px 0 0">${nextRank ? `อีก ${nextRank - P.level} เลเวลจะได้ยศใหม่` : "ได้ยศสูงสุดแล้ว 🌟"} · ทุก ${lv.per} XP ขึ้น 1 เลเวล</p></div>
      <div class="jr-chips"><span class="jr-chip star">★ <b>${P.stars}</b><small>/${P.maxStars} ดาว</small></span><a class="jr-chip coin" href="/shop">🪙 <b>${(me.coins || 0).toLocaleString("th-TH")}</b><small>เหรียญ</small></a>
        <span class="jr-chip">🔥 <b>${d.streak || 0}</b><small>วันติดกัน</small></span><span class="jr-chip">🎮 <b>${d.stats.games}</b><small>ครั้งที่เล่น</small></span></div>
    </section>

    <h2 class="px-tab" id="journey">🎁 เส้นทางสะสมดาว</h2>
    <p class="small jr-note">ได้ดาวจากการเล่นบทเรียน: ผ่าน 60% = ★ · 80% = ★★ · เต็ม = ★★★ (เก็บผลที่ดีที่สุดของแต่ละระดับ) · ในบ้านวิชา ด่านถัดไปเปิดเมื่อได้อย่างน้อย ★ ในด่านก่อนหน้า</p>
    <div class="jr-track" role="list" style="--p:${Math.min(100, (P.stars / lastAt) * 100)}%"><div class="jr-line" aria-hidden="true"><i></i></div>
      ${P.milestones.map((m) => html`<div class="jr-ms ${m.claimed ? "done" : m.reached ? "ready" : ""}" role="listitem" style="--x:${(m.at / lastAt) * 100}%">
        <span class="ic" aria-hidden="true">${m.claimed ? "✅" : m.icon}</span><b>★ ${m.at}</b><span class="nm">${m.name}</span><span class="rw">🪙 ${m.coins}${m.elite ? " + 👑" : ""}</span>
        ${m.claimed ? html`<span class="st">รับแล้ว</span>` : m.reached ? html`<button class="btn btn-sm free" data-claim="${m.at}">รับรางวัล</button>` : html`<span class="st">อีก ${m.at - P.stars} ดาว</span>`}</div>`)}</div>

    <h2 class="px-tab">📖 สมุดล่าบอส</h2>
    <p class="small jr-note">ลดเลือดบอสให้หมดในโหมดปรนัย/ถูกผิด/ท้าเวลาเพื่อปราบบอส (ตอบถูกครบทุกข้อชนะแน่นอน) ${P.eliteUnlocked ? "· 👑 ร่างจ้าวปลดล็อกแล้ว พบได้ที่ระดับยากขึ้นไป" : `· 👑 ร่างจ้าวปลดล็อกเมื่อสะสมครบ ${P.eliteAt} ดาว`}</p>
    <p class="small jr-note">บอสแต่ละตัวมีความหายากต่างกัน ยิ่งเล่นระดับยาก (และด่านบอสประจำบท) ยิ่งมีโอกาสเจอตัวหายาก · ทุกตัวมีโอกาส ${Math.round(SHINY.chance * 100)}% ปรากฏเป็น ✨${SHINY.name} · ปราบตัวหายากได้เหรียญโบนัส</p>
    <div class="jr-bosses">${P.bosses.map((b) => html`<article class="jr-boss ${b.seen ? "" : "unseen"} rar-${b.rarity}" style="--rc:${b.rar?.color || "#ccc"}">
      <span class="jr-rar">${b.rar?.icon} ${b.rar?.name}</span>${b.shiny ? html`<span class="jr-shiny" title="ปราบร่างทองคำแล้ว ${b.shiny} ครั้ง">✨×${b.shiny}</span>` : ""}
      <canvas data-boss="${b.id}" data-seen="${b.seen ? 1 : 0}" aria-hidden="true"></canvas>
      <h3>${b.seen ? b.name : "??? ยังไม่เคยพบ"}</h3><p class="small">${b.seen ? b.lore : "เล่นบทเรียนต่าง ๆ เพื่อพบบอสตัวนี้"}</p>
      <div class="jr-trait"><b>✦ ${b.seen ? b.trait.name : "???"}</b><span>${b.seen ? b.trait.desc : "พบตัวจริงก่อนจึงจะรู้สกิล"}</span></div>
      ${b.seen ? html`<div class="jr-skills">${b.skills.map((k) => html`<i>${k}</i>`)}</div>` : ""}
      <div class="jr-odds">🎲 โอกาสพบ <b>${b.chance < 1 ? b.chance.toFixed(1) : Math.round(b.chance)}%</b> · ด่านบอสระดับยากมาก <b>${b.chanceHard < 1 ? b.chanceHard.toFixed(1) : Math.round(b.chanceHard)}%</b>${b.bonus ? html` · โบนัส 🪙 ${b.bonus}` : ""}</div>
      <div class="jr-bs"><span>⚔️ เผชิญ <b>${b.seen}</b></span><span>🏆 ชนะ <b>${b.wins}</b></span><span class="${P.eliteUnlocked ? "" : "lock"}">👑 ${P.eliteUnlocked ? html`ร่างจ้าว <b>${b.eliteWins}</b>` : "ล็อก"}</span></div></article>`)}</div>

    <h2 class="px-tab">🗺️ ดาวรายหมวด</h2>
    <div class="jr-cats">${P.cats.map((c) => html`<a class="jr-cat" href="/games?category=${c.slug}"><span class="ic">${c.icon}</span><span class="grow"><b>${c.name}</b><span class="jbar"><i style="width:${c.max ? (c.got / c.max) * 100 : 0}%"></i></span></span><span class="n">★ ${c.got}<small>/${c.max}</small></span></a>`)}</div>

    <h2 class="px-tab">🏅 เหรียญรางวัล</h2><div class="badges">${d.badges.map((b) => html`<div class="bdg ${b.earned ? "" : "locked"}" title="${b.desc}"><div class="ic">${b.earned ? b.icon : "🔒"}</div><div class="n">${b.name}</div><div class="d">${b.earned ? `ได้รับ ${fmtDate(b.at, false)}` : b.desc}</div></div>`)}</div>
    <div class="grid-2" style="margin-top:8px"><section><h2 class="px-tab">📈 XP 7 วันล่าสุด</h2><div class="card">${barChart(d.xpChart, { label: (r) => fmtDay(r.day), value: (r) => r.xp, unit: "XP", title: "XP รายวัน 7 วันล่าสุด" })}</div></section>
      <section><h2 class="px-tab">📜 กิจกรรมล่าสุด</h2>${d.activity.length ? html`<ul class="list">${d.activity.map((a) => html`<li><span class="grow ellipsis">${KIND[a.kind] || (a.kind === "reward" ? "รับรางวัล" : a.kind)}<span class="small muted"> · ${a.title}</span></span><span class="small">${a.xp ? `+${a.xp} XP · ` : ""}${fmtDate(a.created_at)}</span></li>`)}</ul>` : html`<div class="empty">ยังไม่มีกิจกรรม</div>`}</section></div>`.s;
  drawHero(main.querySelector("#jrHero"));
  main.querySelectorAll("canvas[data-boss]").forEach((cv) => drawBoss(cv, cv.dataset.boss, cv.dataset.seen === "1", false));
  main.querySelector("#jrEdit").onclick = (e) => { e.preventDefault(); try { sessionStorage.setItem("qo:titleOpen", "custom"); } catch { /* ignore */ } go("/"); };
  main.querySelectorAll("[data-claim]").forEach((b) => b.onclick = async () => {
    busy(b, true);
    try { const r = await api("/api/progress/claim", { body: { at: +b.dataset.claim } }); playSound("win"); toast(`ได้รับ 🪙 ${r.got} เหรียญ!`); await refreshMe(); dashboard({ ...ctx, me: state.me }); }
    catch (er) { toast(er.message, "bad"); busy(b, false); }
  });
  if (ctx.query?.get?.("j")) main.querySelector("#journey")?.scrollIntoView({ block: "start" });
}

export async function profile({ main, me }) {
  const d = await api("/api/dashboard/profile");
  pxPage(onLeave);
  const lv = levelInfo(me.xp);
  main.innerHTML = html`<div class="narrow"><h1 class="px-sign">🪪 โปรไฟล์นักผจญภัย</h1><div class="card"><div class="row" style="gap:16px;flex-wrap:nowrap">${avatar(me.equipped, "xl")}<div><h2 style="margin:0">${me.displayName}</h2>${titleTag(me.equipped)}</div></div>
      <div class="muted">${me.email} · ${{ student: "นักเรียน", teacher: "ครู", admin: "ผู้ดูแลระบบ" }[me.role]}${me.grade ? ` · ${me.grade}` : ""}</div>
      <p style="margin-bottom:0">Lv ${lv.level} · ${rankOf(lv.level).icon} ${rankOf(lv.level).name} · ${me.xp} XP${me.stars != null ? ` · ★ ${me.stars} ดาว` : ""} · 🪙 ${me.coins || 0} · เหรียญรางวัล ${d.badges.length} อัน · <a href="/shop?tab=mine">ของสะสมของฉัน</a></p></div>
    <p class="row" style="margin:12px 0 0"><a class="btn btn-sm" href="/dashboard">📖 เปิดสมุดผจญภัย</a><a class="btn btn-ghost btn-sm" href="/bag">🎒 กระเป๋า</a></p>
    <h2>ประวัติการเล่นเกม</h2>${d.plays.length ? html`<ul class="list">${d.plays.map((p) => html`<li><a class="grow ellipsis" href="/games/${p.id}">${p.title}</a><b>${p.score}</b><span class="small muted">${fmtDate(p.created_at)}</span></li>`)}</ul>` : html`<div class="empty">ยังไม่มีประวัติ</div>`}
    <h2>ประวัติแบบทดสอบ</h2>${d.quizzes.length ? html`<ul class="list">${d.quizzes.map((q) => html`<li><a class="grow ellipsis" href="/attempts/${q.id}">${q.title}</a><b>${q.score}/${q.max_score}${q.status === "pending_review" ? " ⏳" : ""}</b><span class="small muted">${fmtDate(q.submitted_at)}</span></li>`)}</ul>` : html`<div class="empty">ยังไม่มีประวัติ</div>`}</div>`.s;
}

export async function classes(ctx) {
  if (ctx.me.role !== "student") return T.teacherClasses(ctx);
  const { main } = ctx;
  const { classes } = await api("/api/classes");
  main.innerHTML = html`<div class="narrow"><h1>ห้องเรียน</h1>
    <form class="card" id="jf"><label for="code">รหัสห้องเรียน <span class="muted small">(6 ตัว จากครู)</span></label>
      <div class="row"><input id="code" name="code" maxlength="6" required style="flex:1;text-transform:uppercase;letter-spacing:.2em" autocomplete="off" placeholder="เช่น ABC123"><button class="btn">เข้าร่วม</button></div><p class="err" id="err" role="alert"></p></form>
    <h2>ห้องเรียนของฉัน</h2>${classes.length ? html`<div class="grid">${classes.map((c) => html`<a class="game-card" href="/classes/${c.id}"><span class="ic">🏫</span><h3>${c.name}</h3><span class="meta">ครู${c.teacher}${c.grade ? ` · ${c.grade}` : ""}</span>
      <p>${c.todo ? html`<span class="badge badge-warn">งานค้าง ${c.todo} ชิ้น</span>` : "ไม่มีงานค้าง"}</p></a>`)}</div>` : html`<div class="empty">ยังไม่ได้เข้าร่วมห้องเรียน ขอรหัสห้องจากครูแล้วกรอกด้านบน</div>`}</div>`.s;
  const f = main.querySelector("#jf");
  f.onsubmit = async (e) => {
    e.preventDefault();
    try { const r = await api("/api/classes/join", { body: { code: f.code.value } }); toast("เข้าร่วมห้องเรียนแล้ว"); go(`/classes/${r.id}`); }
    catch (err) { main.querySelector("#err").textContent = err.message; }
  };
}

export async function classPage(ctx) {
  const { main, params, me } = ctx;
  const c = await api(`/api/classes/${params.id}`);
  if (c.teacherView) return T.manageClass(ctx, c);
  const st = { todo: html`<span class="badge">ยังไม่ทำ</span>`, pending: html`<span class="badge badge-warn">รอครูตรวจ</span>`, done: html`<span class="badge badge-ok">เสร็จแล้ว</span>` };
  main.innerHTML = html`<div class="narrow"><h1>${c.name}</h1><p class="muted" style="margin-top:-.4em">ครู${c.teacher}${c.grade ? ` · ${c.grade}` : ""}</p>
    <h2>งานของฉัน</h2>${c.assignments.length ? html`<ul class="list">${c.assignments.map((a) => html`<li><div class="grow"><b>${a.title}</b>
      <div class="small muted">${a.kind === "game" ? "เกม" : "แบบทดสอบ"} · ${dueText(a.dueAt)}</div></div>
      <div class="row">${st[a.mine.status]}${a.mine.pct != null ? html`<b>${Math.round(a.mine.pct)}%</b>` : ""}
      <a class="btn btn-sm ${a.mine.status === "todo" ? "" : "btn-ghost"}" href="${assignmentHref(a, c.id)}">${a.mine.status === "todo" ? "ทำเลย" : "ทำอีกครั้ง"}</a></div></li>`)}</ul>` : html`<div class="empty">ยังไม่มีงานที่มอบหมาย</div>`}
    ${c.leaderboard ? html`<h2>อันดับในห้อง</h2><p class="small muted">คะแนนรวม = ผลรวมร้อยละของงานทุกชิ้น</p><div class="table-wrap"><table><thead><tr><th>อันดับ</th><th>ชื่อ</th><th class="num">คะแนนรวม</th></tr></thead><tbody>
      ${c.leaderboard.map((b) => html`<tr ${b.me ? raw('style="font-weight:700;background:var(--brand-soft)"') : ""}><td>${b.rank}</td><td>${avatar(b.look)} ${b.name}${b.me ? " (คุณ)" : ""}${titleTag(b.look)}</td><td class="num">${b.total}</td></tr>`)}</tbody></table></div>` : ""}
    <p style="margin-top:24px"><button class="link-danger" id="leave">ออกจากห้องเรียน</button></p></div>`.s;
  main.querySelector("#leave").onclick = async () => {
    if (!(await confirmBox("ต้องการออกจากห้องเรียนนี้หรือไม่? ผลงานเดิมยังอยู่ แต่จะไม่เห็นงานของห้องนี้อีก", "ออกจากห้อง", true))) return;
    await api(`/api/classes/${c.id}/members/${me.id}`, { method: "DELETE" });
    toast("ออกจากห้องเรียนแล้ว"); go("/classes");
  };
}

export async function settings({ main, me }) {
  const P = getPrefs(); pxPage(onLeave);
  const shop = me ? await api("/api/shop").catch(() => null) : null;
  const ownedIds = new Set((shop?.items || []).filter((i) => i.owned).map((i) => i.id));
  const locked = (x) => x.premium && !ownedIds.has(x.premium);
  const seg = (key, opts) => html`<div class="seg" role="group" data-seg="${key}">${opts.map(([v, t]) => html`<button type="button" data-v="${v}" aria-pressed="${P[key] === v}">${t}</button>`)}</div>`;
  // แต่ละแถว: ไอคอนใหญ่ + ชื่อสั้น + คำอธิบายบรรทัดเดียว (เด็กอ่านเข้าใจ) · แบ่งเป็น 3 แท็บ เห็นทีละแท็บ
  const row = (ic, title, desc, ctrl, id = "") => html`<div class="set-row st-row"><span class="st-ic" aria-hidden="true">${ic}</span><div class="t"><b ${id ? raw(`id="${id}"`) : ""}>${title}</b><span class="small muted">${desc}</span></div>${ctrl}</div>`;
  const sw = (key, ic, title, desc) => row(ic, title, desc, html`<label class="switch"><input type="checkbox" data-sw="${key}" aria-labelledby="l-${key}" ${P[key] ? raw("checked") : ""}><span></span></label>`, `l-${key}`);
  let tab = "sound"; try { tab = sessionStorage.getItem("qo:setTab") || "sound"; } catch { /* ignore */ }
  if (location.hash.includes("s-account")) tab = "me";
  const TABS = [["sound", "🔊", "เสียง"], ["look", "👀", "หน้าจอ"], ...(me ? [["me", "👤", state.config.local ? "ผู้เล่น" : "บัญชี"]] : [])];
  if (!TABS.some(([id]) => id === tab)) tab = "sound";
  main.innerHTML = html`<div class="narrow st-page"><h1 class="px-sign">⚙️ ตั้งค่า</h1>
    <nav class="st-tabs" role="tablist" aria-label="หมวดการตั้งค่า">${TABS.map(([id, ic, t]) => html`<button type="button" role="tab" class="st-tab" data-tab="${id}" id="tb-${id}" aria-controls="tp-${id}" aria-selected="${tab === id}"><span class="ic" aria-hidden="true">${ic}</span><span>${t}</span></button>`)}</nav>
    <p class="small muted st-note" ${tab === "me" ? raw("hidden") : ""}>✔️ กดเลือกแล้วใช้ได้ทันที ไม่ต้องกดบันทึก</p>

    <section class="card st-panel" role="tabpanel" id="tp-sound" aria-labelledby="tb-sound" ${tab === "sound" ? "" : raw("hidden")}>
      ${row("🔊", "เสียงประกอบ", html`เสียงตอนตอบถูก ตอบผิด และจบเกม <button type="button" class="linkish st-try" id="testSound">▶ ลองฟัง</button>`, html`<div class="row"><label class="switch"><input type="checkbox" data-sw="sound" aria-labelledby="l-sound" ${P.sound ? raw("checked") : ""}><span></span></label></div>`, "l-sound")}
      ${sw("autoGo", "⏭️", "ไปข้อต่อไปเอง", "ตอบแล้วรอสักครู่ เกมจะไปข้อใหม่ให้เอง")}
      ${sw("confetti", "🎉", "พลุฉลอง", "มีพลุกระดาษตอนได้คะแนนเต็ม")}
      ${sw("haptics", "📳", "สั่นเมื่อตอบ", "มือถือจะสั่นเบา ๆ (บางรุ่นไม่รองรับ)")}
      <details class="st-more"><summary>🎵 เลือกเสียงตอนนับคะแนน</summary>
        <p class="small muted" id="l-tick">เสียงที่ดังตอนตัวเลขคะแนนวิ่งขึ้นในหน้าสรุปผล — กดเพื่อฟังและเลือก</p>
        <div class="tick-grid" role="radiogroup" aria-labelledby="l-tick" id="tickGrid"></div>
        <div class="row small" style="margin-top:8px"><label class="btn btn-ghost btn-sm" style="cursor:pointer">📁 ใช้ไฟล์เสียงของฉัน<input type="file" id="tickFile" accept="audio/*" hidden></label>
          <span class="muted">เก็บไว้ในเครื่องนี้เท่านั้น</span></div></details></section>

    <section class="card st-panel" role="tabpanel" id="tp-look" aria-labelledby="tb-look" ${tab === "look" ? "" : raw("hidden")}>
      ${row("🌗", "สว่าง หรือ มืด", "“อัตโนมัติ” = ตามมือถือ/คอมของเรา", seg("mode", [["light", "☀️ สว่าง"], ["dark", "🌙 มืด"], ["auto", "🔄 อัตโนมัติ"]]))}
      ${row("🔠", "ขนาดตัวหนังสือ", "ตัวใหญ่ขึ้น อ่านง่ายขึ้น", seg("fontSize", [["sm", "เล็ก"], ["md", "ปกติ"], ["lg", "ใหญ่"], ["xl", "ใหญ่มาก"]]))}
      ${row("🐢", "ลดการเคลื่อนไหว", "หยุดภาพเคลื่อนไหวและพลุ ถ้ารู้สึกตาลาย", html`<label class="switch"><input type="checkbox" data-motionsw aria-labelledby="l-motion" ${P.motion === "reduce" ? raw("checked") : ""}><span></span></label>`, "l-motion")}
      <h3 class="st-h">🎨 สีของเกม</h3>
      <div class="palettes" role="radiogroup" aria-label="สีของเกม">${PALETTES.map((x) => html`<button type="button" class="pal" role="radio" data-pal="${x.id}" ${locked(x) ? raw('data-locked="1"') : ""} aria-checked="${P.palette === x.id}" ${locked(x) ? raw(`aria-label="${x.name} (ล็อกอยู่ ปลดล็อกได้ที่ร้านค้า)"`) : ""}>
        <div class="sw" style="background:linear-gradient(135deg, ${x.c[0]}, ${x.c[1]})${locked(x) ? ";filter:grayscale(.7);opacity:.6" : ""}">${locked(x) ? "🔒" : x.icon}</div><span class="ok">${P.palette === x.id ? "✓" : ""}</span><span class="nm">${x.name}</span></button>`)}</div>
      <p class="small muted">🔒 = ปลดล็อกได้ที่ <a href="/shop">🛒 ร้านค้า</a></p>
      <details class="st-more"><summary>🛠️ ตัวเลือกเพิ่มเติม</summary>
        ${sw("contrast", "🔳", "สีเข้มชัด", "ตัวหนังสือและขอบเข้มขึ้น เห็นชัดตอนแดดจ้า")}
        ${sw("dyslexic", "↔️", "ตัวหนังสือห่างขึ้น", "เว้นช่องระหว่างตัวอักษรให้อ่านง่าย")}
        <h3 class="st-h">หน้าตาเว็บ</h3>
        <p class="small muted" style="margin:0">แนะนำ “🧱 พิกเซลผจญภัย” — แบบอื่นจะไม่มีกรอบพิกเซลของเกม</p>
        <div class="skins" role="radiogroup" aria-label="หน้าตาเว็บ">${SKINS.map((x) => html`<button type="button" class="skin" role="radio" data-skin-id="${x.id}" aria-checked="${P.skin === x.id}">
          <div class="sk-mini sk-${x.id}" aria-hidden="true"><i class="t"></i><i class="c"></i><i class="b"></i></div>
          <span class="nm"><span>${x.icon} ${x.name}</span><span class="ok" aria-hidden="true">${P.skin === x.id ? "✓" : ""}</span></span><span class="ds">${x.desc}</span></button>`)}</div>
        <div id="s-app" ${state.config.local ? raw("hidden") : ""}><h3 class="st-h">📲 ติดตั้งเป็นแอป</h3><div id="installBox"></div></div>
        <p class="row end"><button class="btn btn-ghost btn-sm" id="resetPrefs">↺ กลับเป็นแบบเริ่มต้น</button></p></details></section>

    <section class="st-panel" role="tabpanel" id="tp-me" aria-labelledby="tb-me" ${tab === "me" ? "" : raw("hidden")}>
    ${state.config.local ? html`<section class="card" id="s-account"><h2 style="margin-top:0">👤 ผู้เล่น</h2>
      <div id="cloudBox"></div>
      <form id="lf"><label for="ln">ชื่อในเกม</label><div class="row"><input id="ln" name="displayName" value="${me.displayName}" maxlength="40" style="flex:1" required><button class="btn">บันทึก</button></div></form>
      <p class="small muted" ${me.cloud ? raw("hidden") : ""}>💡 ของในเกมเก็บไว้ในเครื่องนี้ ถ้าจะย้ายไปเล่นเครื่องอื่น กด “สำรอง” แล้วเก็บข้อความไว้</p>
      <div class="row"><button class="btn btn-ghost btn-sm" id="exp">💾 สำรอง</button><button class="btn btn-ghost btn-sm" id="imp">📥 กู้คืน</button><button class="btn btn-danger btn-sm" id="wipe">🗑 เริ่มใหม่ทั้งหมด</button></div>
      <div id="ioBox"></div></section>` : me ? html`<h2 id="s-account" style="margin-top:28px">👤 บัญชี</h2><p class="muted" style="margin-top:-.4em">${me.email} · <a href="/privacy">นโยบายความเป็นส่วนตัว</a></p>
    <form class="card" id="pf"><h3>ข้อมูลส่วนตัว</h3><p class="small muted">ใช้ชื่อเล่นได้ ไม่จำเป็นต้องใช้ชื่อจริง ชื่อนี้ครูและเพื่อนในห้องจะเห็น</p>
      <label for="dn">ชื่อที่แสดง</label><input id="dn" name="displayName" value="${me.displayName}" maxlength="60" required>
      <label for="gr">ระดับชั้น <span class="muted small">(ไม่บังคับ)</span></label><input id="gr" name="grade" value="${me.grade || ""}" maxlength="20" placeholder="เช่น ป.5">
      <div class="row" style="margin-top:12px"><button class="btn">บันทึก</button></div></form>
    <form class="card" id="pw"><h3>เปลี่ยนรหัสผ่าน</h3>
      <label for="c1">รหัสผ่านปัจจุบัน</label><input id="c1" name="current" type="password" autocomplete="current-password" required>
      <label for="c2">รหัสผ่านใหม่ <span class="muted small">(อย่างน้อย 8 ตัว)</span></label><input id="c2" name="next" type="password" minlength="8" autocomplete="new-password" required>
      <div class="row" style="margin-top:12px"><button class="btn">เปลี่ยนรหัสผ่าน</button></div></form>
    <form class="card" id="del" style="border-color:var(--bad)"><h3 style="color:var(--bad)">ลบบัญชีและข้อมูลของฉัน</h3>
      <p class="small">จะลบอีเมล ชื่อ คะแนน ประวัติการเล่น เหรียญ และการเป็นสมาชิกห้องเรียนทั้งหมดของคุณอย่างถาวร</p>
      <label for="d1">รหัสผ่านของคุณ</label><input id="d1" name="password" type="password" required>
      <label for="d2">พิมพ์ DELETE เพื่อยืนยัน</label><input id="d2" name="confirm" required autocomplete="off">
      <div class="row" style="margin-top:12px"><button class="btn btn-danger" disabled>ลบบัญชีถาวร</button></div></form>`
    : html`<div class="card center" id="s-account"><p>เข้าสู่ระบบเพื่อจัดการบัญชี และให้การตั้งค่าตามไปทุกเครื่อง</p><a class="btn" href="/login?next=/settings">เข้าสู่ระบบ</a> <a class="btn btn-ghost" href="/register">สมัครสมาชิก</a></div>`}</section>
    ${me ? "" : html`<div class="card center"><p>เข้าสู่ระบบเพื่อให้การตั้งค่าตามไปทุกเครื่อง</p><a class="btn" href="/login?next=/settings">เข้าสู่ระบบ</a> <a class="btn btn-ghost" href="/register">สมัครสมาชิก</a></div>`}</div>`.s;
  main.querySelectorAll("[data-tab]").forEach((b) => b.onclick = () => {
    tab = b.dataset.tab; try { sessionStorage.setItem("qo:setTab", tab); } catch { /* ignore */ }
    main.querySelectorAll("[data-tab]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
    main.querySelectorAll(".st-panel").forEach((x) => { x.hidden = x.id !== "tp-" + tab; }); main.querySelector(".st-note").hidden = tab === "me";
  });
  main.querySelector("[data-motionsw]").onchange = (e) => { setPrefs({ motion: e.target.checked ? "reduce" : "auto" }); };

  const refresh = () => {
    const p = getPrefs();
    main.querySelectorAll("[data-seg]").forEach((g) => g.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(p[g.dataset.seg] === b.dataset.v))));
    main.querySelectorAll("[data-pal]").forEach((b) => { const on = p.palette === b.dataset.pal; b.setAttribute("aria-checked", String(on)); b.querySelector(".ok").textContent = on ? "✓" : ""; });
    main.querySelectorAll("[data-sw]").forEach((c) => { c.checked = !!p[c.dataset.sw]; });
    main.querySelector("[data-motionsw]").checked = p.motion === "reduce";
  };
  main.querySelectorAll("[data-seg] button").forEach((b) => b.onclick = () => { setPrefs({ [b.closest("[data-seg]").dataset.seg]: b.dataset.v }); refresh(); });
  main.querySelectorAll("[data-skin-id]").forEach((b) => b.onclick = () => {
    setPrefs({ skin: b.dataset.skinId });
    main.querySelectorAll("[data-skin-id]").forEach((x) => { const on = x === b; x.setAttribute("aria-checked", String(on)); x.querySelector(".ok").textContent = on ? "✓" : ""; });
    const sk = SKINS.find((x) => x.id === b.dataset.skinId);
    toast(`เปลี่ยนสไตล์เป็น “${sk.name}” ${sk.icon}${sk.id === "neon" ? " (พื้นมืดเสมอ)" : sk.id === "sketch" ? " (พื้นสว่างเสมอ)" : ""}`);
  });
  main.querySelectorAll("[data-pal]").forEach((b) => b.onclick = () => { if (b.dataset.locked) { toast(me ? "ธีมนี้ยังล็อกอยู่ ไปปลดล็อกที่ร้านค้าได้เลย" : "เข้าสู่ระบบแล้วสะสมเหรียญเพื่อปลดล็อกธีมพิเศษ", "bad"); return; } setPrefs({ palette: b.dataset.pal }); refresh(); toast(`เปลี่ยนธีมเป็น “${PALETTES.find((x) => x.id === b.dataset.pal).name}”`); });
  main.querySelectorAll("[data-sw]").forEach((c) => c.onchange = () => { setPrefs({ [c.dataset.sw]: c.checked }); if (c.dataset.sw === "sound" && c.checked) playSound("correct"); });
  const drawTicks = () => {
    const sel = getPrefs().tickSound, hasFile = !!getTickSound();
    main.querySelector("#tickGrid").innerHTML = TICK_SOUNDS.filter((x) => x.id !== "custom" || hasFile).map((x) => { const lock = !ownsTick(x.id); return html`<button type="button" class="tick-opt ${lock ? "locked" : ""}" role="radio" data-tick="${x.id}" ${lock ? raw('data-locked="1"') : ""} aria-checked="${sel === x.id && !lock}">
      <span class="ic">${x.icon}</span><span class="nm">${x.name}${x.id === "synth" ? html`<small>ค่าเริ่มต้น</small>` : lock ? html`<small>🔒 ได้จากร้านค้า/กล่องสุ่ม · กดฟังตัวอย่าง</small>` : ""}</span><span class="pl" aria-hidden="true">${sel === x.id && !lock ? "✓" : lock ? "🔒" : "▶"}</span></button>`.s; }).join("")
      + (hasFile ? html`<button type="button" class="tick-del linkish small" id="tickDel">ลบไฟล์ของฉัน</button>`.s : "");
    main.querySelectorAll("[data-tick]").forEach((b) => b.onclick = () => {
      if (b.dataset.locked) { playTick(0, b.dataset.tick, true); toast("ตัวอย่างเสียง 🔒 — ได้เสียงนี้จากร้านค้าหรือกล่องสุ่ม แล้วเลือกใช้ได้ที่ 🎒 กระเป๋า"); return; }
      setPrefs({ tickSound: b.dataset.tick }); drawTicks();
      if (!getPrefs().sound) toast("เลือกแล้ว — เปิดสวิตช์เสียงประกอบเพื่อให้ได้ยิน", "bad"); else playTick(0, b.dataset.tick);
      main.querySelector(`[data-tick="${b.dataset.tick}"]`)?.focus();
    });
    const del = main.querySelector("#tickDel");
    if (del) del.onclick = () => { setTickSound(null); if (getPrefs().tickSound === "custom") setPrefs({ tickSound: "synth" }); drawTicks(); toast("ลบไฟล์แล้ว"); };
  };
  drawTicks();
  main.querySelector("#tickFile").onchange = (e) => {
    const f = e.target.files[0]; e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("audio/")) return toast("ต้องเป็นไฟล์เสียง เช่น .mp3 .wav .ogg", "bad");
    if (f.size > TICK_MAX_BYTES) return toast(`ไฟล์ใหญ่เกินไป (สูงสุด ${TICK_MAX_BYTES / 1024} KB) ควรเป็นเสียงสั้น ๆ ไม่เกิน 2–3 วินาที`, "bad");
    const rd = new FileReader();
    rd.onload = () => { try { setTickSound(rd.result); setPrefs({ tickSound: "custom" }); drawTicks(); toast("ตั้งเสียงแล้ว 🎵"); playTick(0, "custom"); } catch (err) { toast(err.message, "bad"); } };
    rd.onerror = () => toast("อ่านไฟล์ไม่สำเร็จ", "bad");
    rd.readAsDataURL(f);
  };
  main.querySelector("#testSound").onclick = () => { if (!getPrefs().sound) return toast("เปิดสวิตช์เสียงก่อน", "bad"); playSound("correct"); setTimeout(() => playSound("wrong"), 450); setTimeout(() => playSound("win"), 1000); };
  const ib = main.querySelector("#installBox");
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (standalone) ib.innerHTML = html`<p style="margin:0">✅ คุณกำลังใช้ QUIZ ODYSSEY แบบแอปอยู่แล้ว</p>`.s;
  else if (state.installPrompt) {
    ib.innerHTML = html`<div class="install-card"><span class="ic">🧭</span><div class="grow"><b>เพิ่ม QUIZ ODYSSEY ลงหน้าจอโฮม</b><div class="small muted">เปิดได้เร็วเหมือนแอป เต็มจอ ไม่มีแถบเบราว์เซอร์</div></div><button class="btn" id="doInstall">ติดตั้ง</button></div>`.s;
    ib.querySelector("#doInstall").onclick = async () => { const pr = state.installPrompt; pr.prompt(); const r = await pr.userChoice; if (r.outcome === "accepted") { state.installPrompt = null; ib.innerHTML = "<p>✅ กำลังติดตั้ง…</p>"; } };
  } else if (ios) ib.innerHTML = html`<p style="margin:0">บน iPhone/iPad: เปิดเว็บนี้ใน <b>Safari</b> → แตะปุ่ม <b>แชร์</b> (สี่เหลี่ยมมีลูกศรชี้ขึ้น) → เลือก <b>“เพิ่มไปยังหน้าจอโฮม”</b></p>`.s;
  else ib.innerHTML = html`<p style="margin:0">บน Android (Chrome): แตะเมนู <b>⋮</b> มุมขวาบน → เลือก <b>“ติดตั้งแอป”</b> หรือ <b>“เพิ่มลงในหน้าจอหลัก”</b><br><span class="small muted">หมายเหตุ: ต้องเปิดเว็บผ่าน https จึงจะติดตั้งได้</span></p>`.s;

  main.querySelector("#resetPrefs").onclick = async () => { if (!(await confirmBox("คืนค่าการแสดงผลทั้งหมดเป็นค่าเริ่มต้น?", "คืนค่า"))) return; setPrefs({ ...DEFAULTS }); refresh(); toast("คืนค่าเริ่มต้นแล้ว"); };
  if (state.config.local) { window.__bindLocalSettings?.(main); return; }
  if (!me) return;

  const pf = main.querySelector("#pf"), pw = main.querySelector("#pw"), del = main.querySelector("#del");
  pf.onsubmit = async (e) => { e.preventDefault(); try { await api("/api/auth/account", { method: "PATCH", body: formData(pf) }); await refreshMe(); toast("บันทึกแล้ว"); } catch (err) { toast(err.message, "bad"); } };
  pw.onsubmit = async (e) => { e.preventDefault(); try { await api("/api/auth/password", { body: formData(pw) }); pw.reset(); toast("เปลี่ยนรหัสผ่านแล้ว"); } catch (err) { toast(err.message, "bad"); } };
  const db = del.querySelector("button");
  del.oninput = () => { db.disabled = !(del.password.value && del.confirm.value === "DELETE"); };
  del.onsubmit = async (e) => {
    e.preventDefault();
    if (!(await confirmBox("ยืนยันการลบบัญชีถาวร? ข้อมูลทั้งหมดจะกู้คืนไม่ได้", "ลบบัญชี", true))) return;
    busy(db, true);
    try { await api("/api/auth/delete", { body: formData(del) }); state.me = null; toast("ลบบัญชีแล้ว"); go("/"); }
    catch (err) { toast(err.message, "bad"); busy(db, false); }
  };
}
