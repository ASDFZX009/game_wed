// หน้าของนักเรียน: แดชบอร์ด โปรไฟล์ ห้องเรียน ตั้งค่า
import { api, html, raw, state, toast, fmtDate, fmtDay, relTime, dueText, pct, barChart, formData, busy, confirmBox, levelInfo } from "../core.js";
import { go, refreshMe } from "../app.js";
import * as T from "./teacher.js";

const KIND = { game: "เล่นเกม", quiz: "ส่งแบบทดสอบ" };
export function assignmentHref(a, classId) {
  return a.kind === "game" ? `/games/${a.refId}?assignment=${a.id}&class=${classId}` : `/quizzes/${a.refId}?assignment=${a.id}&class=${classId}`;
}

export async function dashboard({ main, me }) {
  if (me.role !== "student") return go("/teacher", true);
  const d = await api("/api/dashboard/student");
  const lv = levelInfo(d.xp, d.xpPerLevel);
  main.innerHTML = html`
    <section class="card"><div class="hello"><div><h1 style="margin:0">สวัสดี ${me.displayName} 👋</h1>
      <div class="muted">ระดับ ${lv.level} · ${d.xp} XP${d.streak ? html` · 🔥 เล่นต่อเนื่อง ${d.streak} วัน` : ""}</div></div></div>
      <div class="xpbar" role="progressbar" aria-valuemin="0" aria-valuemax="${lv.per}" aria-valuenow="${lv.into}" aria-label="ความคืบหน้าสู่ระดับถัดไป"><i style="width:${(lv.into / lv.per) * 100}%"></i></div>
      <div class="small muted">อีก ${lv.need} XP ถึงระดับ ${lv.level + 1}</div></section>
    <h2>งานที่ต้องทำ</h2>
    ${d.todo.length ? html`<ul class="list">${d.todo.map((a) => html`<li><div class="grow"><b>${a.title}</b><div class="small muted">${a.className} · ${a.kind === "game" ? "เกม" : "แบบทดสอบ"} · ${a.overdue ? html`<span class="badge badge-bad">${dueText(a.dueAt)}</span>` : dueText(a.dueAt)}</div></div>
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

export async function profile({ main, me }) {
  const d = await api("/api/dashboard/profile");
  const lv = levelInfo(me.xp);
  main.innerHTML = html`<div class="narrow"><div class="card"><h1 style="margin:0">${me.displayName}</h1>
      <div class="muted">${me.email} · ${{ student: "นักเรียน", teacher: "ครู", admin: "ผู้ดูแลระบบ" }[me.role]}${me.grade ? ` · ${me.grade}` : ""}</div>
      <p style="margin-bottom:0">ระดับ ${lv.level} · ${me.xp} XP · เหรียญ ${d.badges.length} เหรียญ</p></div>
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
      ${c.leaderboard.map((b) => html`<tr ${b.me ? raw('style="font-weight:700;background:var(--brand-soft)"') : ""}><td>${b.rank}</td><td>${b.name}${b.me ? " (คุณ)" : ""}</td><td class="num">${b.total}</td></tr>`)}</tbody></table></div>` : ""}
    <p style="margin-top:24px"><button class="link-danger" id="leave">ออกจากห้องเรียน</button></p></div>`.s;
  main.querySelector("#leave").onclick = async () => {
    if (!(await confirmBox("ต้องการออกจากห้องเรียนนี้หรือไม่? ผลงานเดิมยังอยู่ แต่จะไม่เห็นงานของห้องนี้อีก", "ออกจากห้อง", true))) return;
    await api(`/api/classes/${c.id}/members/${me.id}`, { method: "DELETE" });
    toast("ออกจากห้องเรียนแล้ว"); go("/classes");
  };
}

export async function settings({ main, me }) {
  main.innerHTML = html`<div class="narrow"><h1>ตั้งค่าบัญชี</h1><p class="muted">${me.email} · <a href="/privacy">นโยบายความเป็นส่วนตัว</a></p>
    <form class="card" id="pf"><h2 style="margin-top:0">ข้อมูลส่วนตัว</h2><p class="small muted">ใช้ชื่อเล่นได้ ไม่จำเป็นต้องใช้ชื่อจริง ชื่อนี้ครูและเพื่อนในห้องจะเห็น</p>
      <label for="dn">ชื่อที่แสดง</label><input id="dn" name="displayName" value="${me.displayName}" maxlength="60" required>
      <label for="gr">ระดับชั้น <span class="muted small">(ไม่บังคับ)</span></label><input id="gr" name="grade" value="${me.grade || ""}" maxlength="20" placeholder="เช่น ป.5">
      <div class="row" style="margin-top:12px"><button class="btn">บันทึก</button></div></form>
    <form class="card" id="pw"><h2 style="margin-top:0">เปลี่ยนรหัสผ่าน</h2>
      <label for="c1">รหัสผ่านปัจจุบัน</label><input id="c1" name="current" type="password" autocomplete="current-password" required>
      <label for="c2">รหัสผ่านใหม่ <span class="muted small">(อย่างน้อย 8 ตัว)</span></label><input id="c2" name="next" type="password" minlength="8" autocomplete="new-password" required>
      <div class="row" style="margin-top:12px"><button class="btn">เปลี่ยนรหัสผ่าน</button></div></form>
    <form class="card" id="del" style="border-color:var(--bad)"><h2 style="margin-top:0;color:var(--bad)">ลบบัญชีและข้อมูลของฉัน</h2>
      <p class="small">จะลบอีเมล ชื่อ คะแนน ประวัติการเล่น เหรียญ และการเป็นสมาชิกห้องเรียนทั้งหมดของคุณอย่างถาวร</p>
      <label for="d1">รหัสผ่านของคุณ</label><input id="d1" name="password" type="password" required>
      <label for="d2">พิมพ์ DELETE เพื่อยืนยัน</label><input id="d2" name="confirm" required autocomplete="off">
      <div class="row" style="margin-top:12px"><button class="btn btn-danger" disabled>ลบบัญชีถาวร</button></div></form></div>`.s;
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
