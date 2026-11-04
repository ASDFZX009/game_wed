// หน้าของครู: แดชบอร์ด ห้องเรียน รายงาน ตัวสร้างแบบทดสอบ/เกม ตรวจอัตนัย AI
import { api, html, raw, esc, state, toast, fmtDate, fmtDay, dueText, pct, barChart, formData, busy, confirmBox, DIFF, thaiDateInput, bindThaiDate, readThaiDate, filePicker, readImage } from "../core.js";
import { go } from "../app.js";
import { TYPE_TH } from "../quizform.js";

const STATUS_TH = { done: "ส่งแล้ว", pending: "รอครูตรวจ", todo: "ยังไม่ส่ง", not_started: "ยังไม่เริ่ม" };
const STATUS_BADGE = { done: "badge-ok", pending: "badge-warn", todo: "", not_started: "" };

// ---------- แดชบอร์ดครู ----------
export async function dashboard({ main, me }) {
  const d = await api("/api/dashboard/teacher");
  const c = d.counts;
  main.innerHTML = html`<div class="row between"><h1>แดชบอร์ดครู</h1><div class="row"><a class="btn btn-sm" href="/teacher/quizzes/new">+ แบบทดสอบ</a><a class="btn btn-sm" href="/teacher/games/new">+ เกม</a><a class="btn btn-sm btn-ghost" href="/teacher/live">⚡ จัดแข่งสด</a></div></div>
    <div class="stats">
      <div class="stat"><div class="k">ห้องเรียน</div><div class="v">${c.classes}</div></div>
      <div class="stat"><div class="k">นักเรียน</div><div class="v">${c.students}</div></div>
      <div class="stat"><div class="k">แบบทดสอบ</div><div class="v">${c.quizzes}</div><div class="s">เผยแพร่ ${c.quizzesPublished}</div></div>
      <div class="stat"><div class="k">เกม</div><div class="v">${c.games}</div><div class="s">เผยแพร่ ${c.gamesPublished}</div></div></div>
    <div class="stats">
      <div class="stat"><div class="k">การส่งแบบทดสอบ (90 วัน)</div><div class="v">${c.quizSubs90}</div></div>
      <div class="stat"><div class="k">คะแนนเฉลี่ยทุกงาน</div><div class="v">${pct(c.avgPct, 1)}</div><div class="s">ร้อยละเฉลี่ยของทุกการส่งงานในห้องของคุณ</div></div>
      <div class="stat"><div class="k">ข้ออัตนัยรอตรวจ</div><div class="v">${c.pendingEssays}</div>${c.pendingEssays ? html`<a class="small" href="/teacher/quizzes/${c.pendingQuizId}/results">ไปตรวจ →</a>` : ""}</div></div>
    <section class="card"><h2 style="margin-top:0">การส่งงานที่มอบหมาย 14 วันล่าสุด</h2>${barChart(d.chart, { label: (r) => fmtDay(r.day), value: (r) => r.n, unit: "ครั้ง", title: "จำนวนการส่งงานต่อวัน" })}</section>
    <h2>งานที่ยังส่งไม่ครบ</h2>${d.incomplete.length ? html`<ul class="list">${d.incomplete.map((a) => html`<li><div class="grow"><a href="/assignments/${a.id}"><b>${a.title}</b></a><div class="small muted">${a.className} · ${dueText(a.dueAt)}</div></div><span>ส่งแล้ว ${a.submitted}/${a.total}</span></li>`)}</ul>` : html`<div class="empty">งานทั้งหมดส่งครบแล้ว</div>`}
    <h2>ความคืบหน้าแต่ละห้อง</h2>${d.classes.length ? html`<div class="table-wrap"><table><thead><tr><th>ห้อง</th><th class="num">นักเรียน</th><th class="num">งาน</th><th class="num">อัตราการส่ง</th><th class="num">คะแนนเฉลี่ยทุกงาน</th></tr></thead><tbody>
      ${d.classes.map((x) => html`<tr><td><a href="/classes/${x.id}">${x.name}</a></td><td class="num">${x.students}</td><td class="num">${x.assignments}</td><td class="num">${pct(x.submitRate, 1)}</td><td class="num">${pct(x.avgPct, 1)}</td></tr>`)}</tbody></table></div>` : html`<div class="empty"><a href="/classes">สร้างห้องเรียนแรก</a></div>`}
    <h2>การแข่งขันสดล่าสุด</h2>${d.live.length ? html`<ul class="list">${d.live.map((l) => html`<li><span class="grow">${l.title} · PIN ${l.pin}<div class="small muted">${fmtDate(l.createdAt)}</div></span><span>${l.players} คน · ${{ ended: "จบแล้ว", expired: "หมดอายุ", closed: "ปิดแล้ว", lobby: "รอผู้เล่น" }[l.status] || "กำลังเล่น"}</span>
      ${l.status === "ended" ? html`<a class="small" href="/api/live/${l.id}/results.csv" download>CSV</a>` : ""}</li>`)}</ul>` : html`<div class="empty">ยังไม่เคยจัดแข่งสด</div>`}`.s;
}

// ---------- ห้องเรียน ----------
export async function teacherClasses({ main }) {
  const { classes } = await api("/api/classes");
  main.innerHTML = html`<div class="narrow"><h1>ห้องเรียน</h1>
    <form class="card" id="cf"><div class="form-grid"><div><label for="cn">ชื่อห้องเรียน</label><input id="cn" name="name" required maxlength="80" placeholder="เช่น ห้อง ป.5/1"></div>
      <div><label for="cg">ระดับชั้น</label><input id="cg" name="grade" maxlength="20" placeholder="เช่น ป.5"></div></div>
      <div class="row" style="margin-top:12px"><button class="btn">+ สร้างห้องเรียน</button></div></form>
    <div class="grid" style="margin-top:16px">${classes.map((c) => html`<a class="game-card" href="/classes/${c.id}"><span class="ic">🏫</span><h3>${c.name}</h3>
      <span class="meta">${c.grade || ""}</span><p>นักเรียน ${c.students} คน · งาน ${c.assignments} ชิ้น · รหัส <b>${c.code}</b></p></a>`)}</div>
    ${!classes.length ? html`<div class="empty">ยังไม่มีห้องเรียน</div>` : ""}</div>`.s;
  const f = main.querySelector("#cf");
  f.onsubmit = async (e) => { e.preventDefault(); try { const r = await api("/api/classes", { body: formData(f) }); toast("สร้างห้องเรียนแล้ว"); go(`/classes/${r.id}`); } catch (err) { toast(err.message, "bad"); } };
}

export async function manageClass(ctx, c) {
  const { main } = ctx;
  const assignable = await api("/api/dashboard/assignable");
  main.innerHTML = html`<div class="row between"><h1>${c.name} ${c.grade ? html`<span class="muted small">${c.grade}</span>` : ""}</h1><a class="btn" href="/api/classes/${c.id}/report.csv" download>⬇ ส่งออกรายงาน CSV</a></div>
    <div class="stats"><div class="stat"><div class="k">นักเรียน</div><div class="v">${c.stats.students}</div></div><div class="stat"><div class="k">งาน</div><div class="v">${c.stats.assignments}</div></div>
      <div class="stat"><div class="k">อัตราการส่ง</div><div class="v">${pct(c.stats.submitRate, 1)}</div></div><div class="stat"><div class="k">คะแนนเฉลี่ยทุกงาน</div><div class="v">${pct(c.stats.avgPct, 1)}</div></div></div>
    <h2>งานที่มอบหมาย</h2>${c.assignments.length ? html`<ul class="list">${c.assignments.map((a) => html`<li><div class="grow"><a href="/assignments/${a.id}"><b>${a.title}</b></a>
      <div class="small muted">${a.kind === "game" ? "เกม" : "แบบทดสอบ"} · เปิด ${fmtDate(a.openAt)} · ${dueText(a.dueAt)}</div></div><span>ส่งแล้ว ${a.submitted}/${a.total}</span></li>`)}</ul>` : html`<div class="empty">ยังไม่มีงาน มอบหมายงานแรกด้านล่าง</div>`}
    ${c.grid.length && c.assignments.length ? html`<h2>ผลรายบุคคล (% คะแนน)</h2><div class="table-wrap"><table><thead><tr><th>นักเรียน</th>${c.assignments.map((a) => html`<th class="num">${a.title}</th>`)}</tr></thead><tbody>
      ${c.grid.map((r) => html`<tr><td>${r.name}</td>${r.cells.map((v) => html`<td class="num">${v == null ? "—" : `${v}%`}</td>`)}</tr>`)}</tbody></table></div>` : ""}
    <div class="grid-2" style="margin-top:20px">
      <section class="card"><h2 style="margin-top:0">รหัสเข้าห้อง</h2><div class="row"><span class="pin-big" style="font-size:2.2rem;letter-spacing:.15em" id="code">${c.code}</span><button class="btn btn-ghost btn-sm" id="regen">สร้างรหัสใหม่</button></div>
        <p class="small muted">นักเรียนใส่รหัสนี้ที่หน้า “ห้องเรียน” เพื่อเข้าร่วม</p>
        <form id="nf"><label for="nn">ชื่อห้อง</label><div class="row"><input id="nn" name="name" value="${c.name}" style="flex:1" required><button class="btn btn-ghost btn-sm">บันทึกชื่อ</button></div></form>
        <label class="check"><input type="checkbox" id="lb" ${c.showLeaderboard ? raw("checked") : ""}> แสดงอันดับในห้องให้นักเรียนเห็น <span class="muted small">(ปิดเพื่อลดการแข่งขัน)</span></label></section>
      <section class="card"><h2 style="margin-top:0">นักเรียน (${c.members.length})</h2>
        <form id="af" class="row"><input name="email" type="email" placeholder="อีเมลของนักเรียนที่สมัครแล้ว" style="flex:1" required aria-label="อีเมลนักเรียน"><button class="btn btn-sm">เพิ่ม</button></form>
        <div class="players" style="margin-top:12px">${c.members.map((m) => html`<span class="player-chip">${m.name}<button data-rm="${m.id}" aria-label="นำ ${m.name} ออกจากห้อง" title="นำออก">✕</button></span>`)}</div></section></div>
    <form class="card" id="asg" style="margin-top:16px"><h2 style="margin-top:0">มอบหมายงานใหม่</h2><div class="form-grid">
      <div><label for="ak">ประเภท</label><select id="ak" name="kind"><option value="quiz">แบบทดสอบ</option><option value="game">เกม</option></select></div>
      <div><label for="ar">เลือกงาน <span class="muted small">(ที่เผยแพร่แล้ว)</span></label><select id="ar" name="refId" required></select></div>
      <div class="full"><label for="at">ชื่องาน <span class="muted small">(ไม่ใส่ = ใช้ชื่อเดิม)</span></label><input id="at" name="title" maxlength="120"></div>
      <div>${thaiDateInput("openAt", "เปิดให้ทำ", "(ไม่กำหนด = ทันที)")}</div><div>${thaiDateInput("dueAt", "กำหนดส่ง", "(ไม่กำหนด = ไม่จำกัด)", 7)}</div></div>
      <div class="row" style="margin-top:12px"><button class="btn">มอบหมาย</button></div></form>
    <p style="margin-top:24px"><button class="link-danger" id="delc">ลบห้องเรียน</button></p>`.s;
  const reload = () => go(location.pathname, true);
  const ak = main.querySelector("#ak"), ar = main.querySelector("#ar");
  const fill = () => {
    const list = ak.value === "game" ? assignable.games : assignable.quizzes;
    ar.innerHTML = list.length ? list.map((x) => `<option value="${x.id}">${esc(x.title)}${x.ownerId === state.me.id ? "" : " (สาธารณะ)"}</option>`).join("") : '<option value="">— ยังไม่มีรายการที่เผยแพร่ —</option>';
  };
  ak.onchange = fill; fill();
  bindThaiDate(main);
  main.querySelector("#asg").onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target;
    try {
      await api(`/api/classes/${c.id}/assignments`, { body: { kind: ak.value, refId: +ar.value, title: f.title.value, openAt: readThaiDate(f, "openAt"), dueAt: readThaiDate(f, "dueAt") } });
      toast("มอบหมายงานแล้ว"); reload();
    } catch (err) { toast(err.message, "bad"); }
  };
  main.querySelector("#regen").onclick = async () => { if (!(await confirmBox("สร้างรหัสใหม่? รหัสเดิมจะใช้ไม่ได้อีก"))) return; const r = await api(`/api/classes/${c.id}/code`, { method: "POST" }); main.querySelector("#code").textContent = r.code; toast("สร้างรหัสใหม่แล้ว"); };
  main.querySelector("#nf").onsubmit = async (e) => { e.preventDefault(); try { await api(`/api/classes/${c.id}`, { method: "PATCH", body: { name: e.target.name.value } }); toast("บันทึกชื่อแล้ว"); reload(); } catch (err) { toast(err.message, "bad"); } };
  main.querySelector("#lb").onchange = async (e) => { await api(`/api/classes/${c.id}`, { method: "PATCH", body: { showLeaderboard: e.target.checked } }); toast(e.target.checked ? "เปิดการแสดงอันดับแล้ว" : "ปิดการแสดงอันดับแล้ว"); };
  main.querySelector("#af").onsubmit = async (e) => { e.preventDefault(); try { await api(`/api/classes/${c.id}/members`, { body: { email: e.target.email.value } }); toast("เพิ่มนักเรียนแล้ว"); reload(); } catch (err) { toast(err.message, "bad"); } };
  main.querySelectorAll("[data-rm]").forEach((b) => b.onclick = async () => { if (!(await confirmBox("นำนักเรียนคนนี้ออกจากห้อง?", "นำออก", true))) return; await api(`/api/classes/${c.id}/members/${b.dataset.rm}`, { method: "DELETE" }); reload(); });
  main.querySelector("#delc").onclick = async () => { if (!(await confirmBox("ลบห้องเรียนนี้ถาวร? งานที่มอบหมายจะถูกลบด้วย (ผลคะแนนของนักเรียนยังอยู่ในประวัติของนักเรียน)", "ลบห้องเรียน", true))) return; await api(`/api/classes/${c.id}`, { method: "DELETE" }); toast("ลบห้องเรียนแล้ว"); go("/classes"); };
}

export async function assignmentReport({ main, params }) {
  const d = await api(`/api/classes/assignments/${params.id}`);
  const a = d.assignment, s = d.stats;
  main.innerHTML = html`<a href="/classes/${a.classId}" class="small">← ${d.className}</a>
    <div class="row between"><h1>${a.title}</h1><a class="btn" href="/api/classes/assignments/${a.id}/report.csv" download>⬇ ส่งออก CSV</a></div>
    <p class="muted" style="margin-top:-.4em">${a.kind === "game" ? "เกม" : "แบบทดสอบ"}: ${a.refTitle} · เปิด ${fmtDate(a.openAt)} · ${dueText(a.dueAt)}</p>
    <div class="stats"><div class="stat"><div class="k">ส่งแล้ว</div><div class="v">${s.submitted}/${s.total}</div></div><div class="stat"><div class="k">อัตราการส่ง</div><div class="v">${pct(s.rate)}</div></div>
      <div class="stat"><div class="k">คะแนนเฉลี่ย</div><div class="v">${pct(s.avg)}</div></div><div class="stat"><div class="k">ต่ำสุด–สูงสุด</div><div class="v">${s.min == null ? "—" : `${Math.round(s.min)}–${Math.round(s.max)}%`}</div></div></div>
    <div class="table-wrap"><table><thead><tr><th>นักเรียน</th><th>สถานะ</th><th class="num">คะแนน</th><th>ส่งเมื่อ</th><th class="num">ครั้งที่ทำ</th><th></th></tr></thead><tbody>
      ${d.rows.map((r) => html`<tr><td>${r.name}</td><td><span class="badge ${STATUS_BADGE[r.status]}">${STATUS_TH[r.status]}</span></td><td class="num">${r.pct == null ? "—" : `${Math.round(r.pct)}%`}</td>
        <td>${r.at ? fmtDate(r.at) : "—"}</td><td class="num">${r.attempts || "—"}</td><td>${r.attemptId ? html`<a href="/attempts/${r.attemptId}">ดู</a>` : ""}</td></tr>`)}</tbody></table></div>
    ${a.kind === "quiz" ? html`<p><a href="/teacher/quizzes/${a.refId}/results">ดูรายละเอียดและตรวจข้ออัตนัย →</a></p>` : ""}
    <p style="margin-top:20px"><button class="link-danger" id="del">ลบงานนี้</button></p>`.s;
  main.querySelector("#del").onclick = async () => { if (!(await confirmBox("ลบงานนี้ออกจากห้องเรียน?", "ลบงาน", true))) return; await api(`/api/classes/assignments/${a.id}`, { method: "DELETE" }); toast("ลบงานแล้ว"); go(`/classes/${a.classId}`); };
}

// ---------- รายการแบบทดสอบ/เกมของฉัน ----------
function contentActions(kind, x) {
  const base = kind === "quiz" ? "/api/quizzes" : "/api/games";
  return { base, published: x.status === "published" };
}
async function bindListActions(main, kind) {
  const base = kind === "quiz" ? "/api/quizzes" : "/api/games";
  main.querySelectorAll("[data-act]").forEach((b) => b.onclick = async () => {
    const id = b.dataset.id, act = b.dataset.act;
    try {
      if (act === "publish" || act === "unpublish") { await api(`${base}/${id}/status`, { body: { status: act === "publish" ? "published" : "draft" } }); toast(act === "publish" ? "เผยแพร่แล้ว" : "ยกเลิกเผยแพร่แล้ว"); }
      if (act === "dup") { const r = await api(`${base}/${id}/duplicate`, { method: "POST" }); toast("ทำสำเนาแล้ว"); return go(`/teacher/${kind === "quiz" ? "quizzes" : "games"}/${r.id}/edit`); }
      if (act === "del") { if (!(await confirmBox("ลบถาวร? งานที่มอบหมายจากรายการนี้จะถูกลบด้วย", "ลบ", true))) return; await api(`${base}/${id}`, { method: "DELETE" }); toast("ลบแล้ว"); }
      go(location.pathname, true);
    } catch (e) { toast(e.message, "bad"); }
  });
}
export async function myQuizzes({ main }) {
  const { quizzes } = await api("/api/quizzes/mine/list");
  main.innerHTML = html`<div class="row between"><h1>แบบทดสอบของฉัน</h1><a class="btn" href="/teacher/quizzes/new">+ สร้างใหม่</a></div>
    ${quizzes.length ? html`<ul class="list">${quizzes.map((q) => html`<li><div class="grow"><a href="/teacher/quizzes/${q.id}/edit"><b>${q.title}</b></a>
      <div class="small muted"><span class="badge ${q.status === "published" ? "badge-ok" : ""}">${q.status === "published" ? "เผยแพร่แล้ว" : "ฉบับร่าง"}</span> ${q.visibility === "public" ? "สาธารณะ" : "ส่วนตัว"} · ${q.questionCount} ข้อ · ทำแล้ว ${q.attempts} ครั้ง · แก้ไข ${fmtDate(q.updatedAt)}</div></div>
      <div class="actions"><a href="/teacher/quizzes/${q.id}/results">ผลคะแนน</a>${q.status === "published" ? html`<a href="/quizzes/${q.id}">เปิดหน้าทำ</a><button class="linkish" data-act="unpublish" data-id="${q.id}">ยกเลิกเผยแพร่</button>` : html`<button class="linkish" data-act="publish" data-id="${q.id}">เผยแพร่</button>`}
      <button class="linkish" data-act="dup" data-id="${q.id}">ทำสำเนา</button><button class="link-danger" data-act="del" data-id="${q.id}">ลบ</button></div></li>`)}</ul>` : html`<div class="empty">ยังไม่มีแบบทดสอบ <a href="/teacher/quizzes/new">สร้างแบบทดสอบแรก</a> หรือ <a href="/teacher/ai">ให้ AI ช่วยร่าง</a></div>`}`.s;
  bindListActions(main, "quiz");
}
export async function myGames({ main }) {
  const { games } = await api("/api/games/mine/list");
  main.innerHTML = html`<div class="row between"><h1>เกมของฉัน</h1><a class="btn" href="/teacher/games/new">+ สร้างเกมใหม่</a></div>
    ${games.length ? html`<ul class="list">${games.map((g) => html`<li><div class="grow"><a href="/teacher/games/${g.id}/edit"><b>${g.title}</b></a>
      <div class="small muted">${g.templateName} · <span class="badge ${g.status === "published" ? "badge-ok" : ""}">${g.status === "published" ? "เผยแพร่แล้ว" : "ฉบับร่าง"}</span> ${g.visibility === "public" ? "สาธารณะ" : "ส่วนตัว"} · ${g.questionCount} ${g.template === "match" ? "คู่" : "ข้อ"} · เล่นแล้ว ${g.plays} ครั้ง · v${g.version}${g.assigned ? ` · มอบหมาย ${g.assigned}` : ""}</div></div>
      <div class="actions"><a href="/games/${g.id}">ทดลองเล่น</a>${g.status === "published" ? html`<button class="linkish" data-act="unpublish" data-id="${g.id}">ยกเลิกเผยแพร่</button>` : html`<button class="linkish" data-act="publish" data-id="${g.id}">เผยแพร่</button>`}
      <button class="linkish" data-act="dup" data-id="${g.id}">ทำสำเนา</button><button class="link-danger" data-act="del" data-id="${g.id}">ลบ</button></div></li>`)}</ul>` : html`<div class="empty">ยังไม่มีเกม <a href="/teacher/games/new">สร้างเกมแรก</a></div>`}`.s;
  bindListActions(main, "game");
}

// ---------- ตัวสร้างแบบทดสอบ ----------
const TYPE_DEFAULT = {
  mcq: () => ({ type: "mcq", prompt: "", options: ["", ""], answer: 0, points: 1 }),
  multi: () => ({ type: "multi", prompt: "", options: ["", "", ""], answers: [0], points: 2 }),
  truefalse: () => ({ type: "truefalse", prompt: "", answer: true, points: 1 }),
  short: () => ({ type: "short", prompt: "", accepted: [""], points: 1 }),
  numeric: () => ({ type: "numeric", prompt: "", answer: "", tolerance: 0, unit: "", points: 1 }),
  fill: () => ({ type: "fill", prompt: "", blanks: [], points: 1 }),
  wordbank: () => ({ type: "wordbank", prompt: "", blanks: [], distractors: [], points: 2 }),
  match: () => ({ type: "match", prompt: "จับคู่ให้ถูกต้อง", pairs: [["", ""], ["", ""]], points: 2 }),
  order: () => ({ type: "order", prompt: "", items: ["", "", ""], points: 2 }),
  essay: () => ({ type: "essay", prompt: "", points: 5 }),
};
const lines = (s) => String(s || "").split("\n").map((x) => x.trim()).filter(Boolean);

function qEditor(q, i, n, locked) {
  const dis = locked ? raw("disabled") : "";
  const opts = (key, multi) => html`${q.options.map((o, k) => html`<div class="opt-edit">
      <input type="${multi ? "checkbox" : "radio"}" name="ans${i}" data-k="${k}" aria-label="ตัวเลือกที่ถูก" ${(multi ? q.answers.includes(k) : q.answer === k) ? raw("checked") : ""} ${dis}>
      <input type="text" data-opt="${k}" value="${o}" placeholder="ตัวเลือกที่ ${k + 1}" aria-label="ตัวเลือกที่ ${k + 1}" ${dis}>
      <button type="button" class="icon-btn" data-delopt="${k}" aria-label="ลบตัวเลือก" ${q.options.length <= 2 || locked ? raw("disabled") : ""}>✕</button></div>`)}
    ${!locked ? html`<button type="button" class="linkish small" data-addopt>+ เพิ่มตัวเลือก</button>` : ""}<p class="small muted">${multi ? "ติ๊กทุกตัวเลือกที่ถูก" : "เลือกวงกลมหน้าตัวเลือกที่ถูก"}</p>`;
  let body = "";
  switch (q.type) {
    case "mcq": body = opts("answer", false); break;
    case "multi": body = opts("answers", true); break;
    case "truefalse": body = html`<label>เฉลย</label><select data-f="answer" ${dis}><option value="true" ${q.answer ? raw("selected") : ""}>จริง</option><option value="false" ${!q.answer ? raw("selected") : ""}>เท็จ</option></select>`; break;
    case "short": body = html`<label>คำตอบที่ยอมรับ <span class="muted small">(บรรทัดละหนึ่งคำตอบ ไม่สนตัวพิมพ์ใหญ่-เล็ก)</span></label><textarea data-f="accepted" rows="3" ${dis}>${(q.accepted || []).join("\n")}</textarea>`; break;
    case "numeric": body = html`<div class="form-grid"><div><label>คำตอบ (ตัวเลข)</label><input data-f="answer" inputmode="decimal" value="${q.answer}" ${dis}></div>
      <div><label>คลาดเคลื่อนได้ ±</label><input data-f="tolerance" inputmode="decimal" value="${q.tolerance || 0}" ${dis}></div><div><label>หน่วย <span class="muted small">(ไม่บังคับ)</span></label><input data-f="unit" value="${q.unit || ""}" ${dis}></div></div>`; break;
    case "fill": body = html`<label>เฉลยแต่ละช่อง <span class="muted small">(บรรทัดละหนึ่งช่อง ถ้ามีคำตอบที่ยอมรับหลายแบบ คั่นด้วย |)</span></label><textarea data-f="blanks" rows="3" ${dis}>${(q.blanks || []).join("\n")}</textarea>`; break;
    case "wordbank": body = html`<div class="form-grid"><div><label>คำที่ถูกแต่ละช่อง <span class="muted small">(บรรทัดละช่อง)</span></label><textarea data-f="blanks" rows="3" ${dis}>${(q.blanks || []).join("\n")}</textarea></div>
      <div><label>คำหลอก <span class="muted small">(บรรทัดละคำ)</span></label><textarea data-f="distractors" rows="3" ${dis}>${(q.distractors || []).join("\n")}</textarea></div></div>`; break;
    case "match": body = html`${q.pairs.map((p, k) => html`<div class="pair-edit"><input data-pa="${k}" value="${p[0]}" placeholder="ด้านซ้าย" aria-label="คู่ที่ ${k + 1} ซ้าย" ${dis}><span aria-hidden="true">→</span>
      <input data-pb="${k}" value="${p[1]}" placeholder="ด้านขวา" aria-label="คู่ที่ ${k + 1} ขวา" ${dis}><button type="button" class="icon-btn" data-delpair="${k}" aria-label="ลบคู่" ${q.pairs.length <= 2 || locked ? raw("disabled") : ""}>✕</button></div>`)}
      ${!locked ? html`<button type="button" class="linkish small" data-addpair>+ เพิ่มคู่</button>` : ""}`; break;
    case "order": body = html`<label>เรียงตามลำดับที่ถูกต้อง <span class="muted small">(บรรทัดละรายการ ผู้เล่นจะเห็นแบบสลับ)</span></label><textarea data-f="items" rows="4" ${dis}>${(q.items || []).join("\n")}</textarea>`; break;
    case "essay": body = html`<p class="small muted">ครูตรวจและให้คะแนนเองที่หน้า “ผลคะแนน”</p>`; break;
  }
  return html`<section class="card builder-q" data-qi="${i}"><div class="row between"><b>ข้อ ${i + 1} <span class="muted small">${TYPE_TH[q.type]}</span></b>
    ${!locked ? html`<div class="qtools"><button type="button" class="icon-btn" data-mv="-1" aria-label="เลื่อนข้อขึ้น" ${i === 0 ? raw("disabled") : ""}>↑</button><button type="button" class="icon-btn" data-mv="1" aria-label="เลื่อนข้อลง" ${i === n - 1 ? raw("disabled") : ""}>↓</button><button type="button" class="icon-btn" data-delq aria-label="ลบข้อนี้">🗑</button></div>` : ""}</div>
    <label>โจทย์ ${["fill", "wordbank"].includes(q.type) ? html`<span class="muted small">(ใช้ ___ แทนช่องว่าง)</span>` : ""}</label><textarea data-f="prompt" rows="2" ${dis}>${q.prompt}</textarea>
    ${body}
    <div class="form-grid"><div><label>คะแนน</label><input data-f="points" type="number" min="1" max="100" value="${q.points}" ${dis}></div>
      ${q.type !== "essay" ? html`<div><label>คำอธิบายเฉลย <span class="muted small">(ไม่บังคับ)</span></label><input data-f="explain" value="${q.explain || ""}" ${dis}></div>` : ""}</div></section>`;
}

function readQ(sec, q) {
  const f = (k) => sec.querySelector(`[data-f="${k}"]`)?.value ?? "";
  const o = { ...q, prompt: f("prompt"), points: +f("points") || 1 };
  if (q.type !== "essay") o.explain = f("explain");
  if (q.type === "mcq" || q.type === "multi") {
    o.options = [...sec.querySelectorAll("[data-opt]")].map((x) => x.value);
    const checked = [...sec.querySelectorAll("[data-k]")].filter((x) => x.checked).map((x) => +x.dataset.k);
    if (q.type === "mcq") o.answer = checked[0] ?? 0; else o.answers = checked;
  }
  if (q.type === "truefalse") o.answer = f("answer") === "true";
  if (q.type === "short") o.accepted = lines(f("accepted"));
  if (q.type === "numeric") { o.answer = f("answer"); o.tolerance = f("tolerance"); o.unit = f("unit"); }
  if (q.type === "fill") o.blanks = lines(f("blanks"));
  if (q.type === "wordbank") { o.blanks = lines(f("blanks")); o.distractors = lines(f("distractors")); }
  if (q.type === "match") o.pairs = [...sec.querySelectorAll("[data-pa]")].map((x, k) => [x.value, sec.querySelector(`[data-pb="${k}"]`).value]);
  if (q.type === "order") o.items = lines(f("items"));
  return o;
}

export async function quizBuilder({ main, params }) {
  let meta = { title: "", description: "", grade: "", difficulty: "easy", timeLimitMin: "", visibility: "private", showAnswers: "after_submit", shuffleQuestions: false, shuffleOptions: false };
  let questions = [TYPE_DEFAULT.mcq()];
  let locked = false, attempts = 0, fromAI = false, status = "draft";
  if (params.id) {
    const d = await api(`/api/quizzes/${params.id}/edit`);
    meta = { ...d.quiz, timeLimitMin: d.quiz.timeLimitMin || "" };
    questions = d.questions; attempts = d.attempts; locked = attempts > 0; status = d.quiz.status;
  } else {
    const draft = sessionStorage.getItem("aiDraft:quiz");
    if (draft) { const d = JSON.parse(draft); sessionStorage.removeItem("aiDraft:quiz"); meta.title = d.title; meta.description = d.description; questions = d.items.map(normalizeAI).filter(Boolean); fromAI = true; }
  }
  const sel = (a, b) => (a === b ? raw("selected") : "");
  main.innerHTML = html`<h1>${params.id ? "แก้ไขแบบทดสอบ" : "สร้างแบบทดสอบ"} ${params.id ? html`<span class="badge ${status === "published" ? "badge-ok" : ""}">${status === "published" ? "เผยแพร่แล้ว" : "ฉบับร่าง"}</span>` : ""}</h1>
    ${fromAI ? html`<div class="note">✨ เนื้อหานี้สร้างโดย AI และ<b>ยังไม่ได้บันทึก</b> — ตรวจสอบความถูกต้องและความเหมาะสมทุกข้อ แก้ไขตามต้องการ แล้วกด “บันทึก”</div>` : ""}
    ${locked ? html`<div class="note">⚠️ มีผู้ทำแบบทดสอบนี้แล้ว ${attempts} ครั้ง — แก้ไขรายละเอียดได้ แต่แก้คำถามไม่ได้ (เพื่อไม่ให้คะแนนเดิมเสียหาย) หากต้องการแก้คำถามให้ “ทำสำเนา”</div>` : ""}
    <form class="card" id="meta"><div class="form-grid">
      <div class="full"><label for="m-t">ชื่อแบบทดสอบ</label><input id="m-t" name="title" value="${meta.title}" required maxlength="120"></div>
      <div class="full"><label for="m-d">คำอธิบาย</label><textarea id="m-d" name="description" rows="2" maxlength="500">${meta.description}</textarea></div>
      <div><label for="m-g">ระดับชั้น</label><input id="m-g" name="grade" value="${meta.grade || ""}" maxlength="20" placeholder="เช่น ป.5"></div>
      <div><label for="m-df">ความยาก</label><select id="m-df" name="difficulty">${Object.entries(DIFF).map(([k, v]) => html`<option value="${k}" ${sel(k, meta.difficulty)}>${v}</option>`)}</select></div>
      <div><label for="m-tl">เวลา <span class="muted small">(นาที, เว้นว่าง = ไม่จำกัด)</span></label><input id="m-tl" name="timeLimitMin" type="number" min="1" max="300" value="${meta.timeLimitMin}"></div>
      <div><label for="m-v">การมองเห็น</label><select id="m-v" name="visibility"><option value="private" ${sel("private", meta.visibility)}>ส่วนตัว (เฉพาะงานที่มอบหมาย)</option><option value="public" ${sel("public", meta.visibility)}>สาธารณะ (แสดงในคลัง)</option></select></div>
      <div><label for="m-s">แสดงเฉลย</label><select id="m-s" name="showAnswers"><option value="after_submit" ${sel("after_submit", meta.showAnswers)}>หลังส่งคำตอบ</option><option value="never" ${sel("never", meta.showAnswers)}>ไม่แสดง</option></select></div>
      <div style="align-self:end"><label class="check"><input type="checkbox" name="shuffleQuestions" ${meta.shuffleQuestions ? raw("checked") : ""}> สุ่มลำดับข้อ</label><label class="check"><input type="checkbox" name="shuffleOptions" ${meta.shuffleOptions ? raw("checked") : ""}> สุ่มตัวเลือก</label></div></div></form>
    <div id="qs"></div>
    ${!locked ? html`<div class="row" style="margin-top:14px"><select id="newType" style="width:auto" aria-label="ชนิดคำถาม">${Object.entries(TYPE_TH).map(([k, v]) => html`<option value="${k}">${v}${["multi", "numeric", "wordbank"].includes(k) ? " ✨ใหม่" : ""}</option>`)}</select><button class="btn btn-ghost" id="addQ">+ เพิ่มคำถาม</button></div>` : ""}
    <div class="sticky-bar"><button class="btn" id="save">💾 บันทึก</button>${params.id ? html`<a class="btn btn-ghost" href="/teacher/quizzes/${params.id}/results">ดูผลคะแนน</a>` : ""}<span class="err" id="err" role="alert"></span></div>`.s;

  const box = main.querySelector("#qs");
  const sync = () => box.querySelectorAll("[data-qi]").forEach((sec) => { const i = +sec.dataset.qi; questions[i] = readQ(sec, questions[i]); });
  const draw = () => {
    box.innerHTML = questions.map((q, i) => qEditor(q, i, questions.length, locked).s).join("");
    box.querySelectorAll("[data-qi]").forEach((sec) => {
      const i = +sec.dataset.qi;
      const act = (sel, fn) => sec.querySelectorAll(sel).forEach((b) => b.onclick = () => { sync(); fn(b); draw(); });
      act("[data-mv]", (b) => { const j = i + +b.dataset.mv; [questions[i], questions[j]] = [questions[j], questions[i]]; });
      act("[data-delq]", () => questions.splice(i, 1));
      act("[data-addopt]", () => questions[i].options.push(""));
      act("[data-delopt]", (b) => { const k = +b.dataset.delopt; questions[i].options.splice(k, 1); if (questions[i].type === "mcq" && questions[i].answer >= questions[i].options.length) questions[i].answer = 0; if (questions[i].answers) questions[i].answers = questions[i].answers.filter((x) => x !== k).map((x) => (x > k ? x - 1 : x)); });
      act("[data-addpair]", () => questions[i].pairs.push(["", ""]));
      act("[data-delpair]", (b) => questions[i].pairs.splice(+b.dataset.delpair, 1));
    });
  };
  draw();
  main.querySelector("#addQ")?.addEventListener("click", () => { sync(); questions.push(TYPE_DEFAULT[main.querySelector("#newType").value]()); draw(); box.lastElementChild.querySelector("textarea")?.focus(); });
  main.querySelector("#save").onclick = async (e) => {
    sync();
    const m = formData(main.querySelector("#meta"));
    const err = main.querySelector("#err"); err.textContent = "";
    if (!m.title) { err.textContent = "กรุณาใส่ชื่อแบบทดสอบ"; return; }
    busy(e.target, true, "กำลังบันทึก…");
    try {
      const body = { ...m, questions };
      if (params.id) { const r = await api(`/api/quizzes/${params.id}`, { method: "PUT", body }); toast(r.questionsLocked ? "บันทึกรายละเอียดแล้ว (คำถามถูกล็อก)" : "บันทึกแล้ว"); go(location.pathname, true); }
      else { const r = await api("/api/quizzes", { body }); toast("สร้างแบบทดสอบแล้ว (ฉบับร่าง) — กด “เผยแพร่” ที่หน้ารายการเมื่อพร้อม"); go(`/teacher/quizzes/${r.id}/edit`, true); }
    } catch (ex) { err.textContent = ex.message; busy(e.target, false); }
  };
}
function normalizeAI(x) {
  if (!x || !TYPE_DEFAULT[x.type]) return null;
  const q = { ...TYPE_DEFAULT[x.type](), ...x };
  if (q.type === "numeric") q.answer = String(q.answer);
  if (q.type === "short" && !Array.isArray(q.accepted)) q.accepted = [String(q.accepted || "")];
  if ((q.type === "mcq" || q.type === "multi") && !Array.isArray(q.options)) return null;
  return q;
}

export async function quizResults({ main, params }) {
  const d = await api(`/api/quizzes/${params.id}/results`);
  main.innerHTML = html`<div class="row between"><h1>ผลคะแนน: ${d.quiz.title}</h1><a class="btn" href="/api/quizzes/${params.id}/results.csv" download>⬇ ส่งออก CSV</a></div>
    <p class="muted">ส่งแล้ว ${d.count} ครั้ง · คะแนนเฉลี่ย ${pct(d.avgPct, 1)} · ข้ออัตนัยรอตรวจ ${d.pending.length} ข้อ</p>
    <h2>รอตรวจ (อัตนัย)</h2>${d.pending.length ? d.pending.map((p) => html`<form class="card" data-grade="${p.attemptId}" data-index="${p.index}"><div class="small muted">${p.student}</div><b>${p.prompt}</b>
      <div class="info" style="white-space:pre-wrap">${p.answer || "(ไม่ได้ตอบ)"}</div>
      <div class="row"><input name="points" type="number" min="0" max="${p.max}" step="0.5" placeholder="คะแนน (เต็ม ${p.max})" style="width:170px" required aria-label="คะแนน">
      <input name="comment" placeholder="ความคิดเห็นถึงนักเรียน (ไม่บังคับ)" style="flex:1" aria-label="ความคิดเห็น"><button class="btn">บันทึกคะแนน</button></div></form>`) : html`<div class="empty">ไม่มีข้อที่รอตรวจ</div>`}
    <section class="card" style="margin-top:16px"><h2 style="margin-top:0">คำแนะนำการปรับความยาก <span class="muted small">(คำนวณจากสถิติจริง ไม่ได้ใช้ AI)</span></h2>
      ${d.analysis ? html`<div class="table-wrap"><table><thead><tr><th>ข้อ</th><th>โจทย์</th><th class="num">ตอบถูก</th><th>คำแนะนำ</th></tr></thead><tbody>${d.analysis.map((a) => html`<tr><td>${a.index + 1}</td><td>${a.prompt}</td><td class="num">${a.rate == null ? "—" : pct(a.rate * 100)}</td><td>${a.tip || "—"}</td></tr>`)}</tbody></table></div>`
        : html`<p class="muted small" style="margin:0">ต้องมีผู้ส่งอย่างน้อย 5 ครั้งจึงจะวิเคราะห์ได้ (ตอนนี้ ${d.count})</p>`}</section>
    <h2>การส่งทั้งหมด</h2>${d.attempts.length ? html`<div class="table-wrap"><table><thead><tr><th>นักเรียน</th><th class="num">คะแนน</th><th>สถานะ</th><th>ส่งเมื่อ</th><th></th></tr></thead><tbody>
      ${d.attempts.map((a) => html`<tr><td>${a.student}</td><td class="num">${a.score}/${a.max}</td><td><span class="badge ${a.status === "graded" ? "badge-ok" : "badge-warn"}">${a.status === "graded" ? "ตรวจแล้ว" : "รอตรวจ"}</span></td><td>${fmtDate(a.submittedAt)}</td><td><a href="/attempts/${a.id}">ดู</a></td></tr>`)}</tbody></table></div>` : html`<div class="empty">ยังไม่มีผู้ส่ง</div>`}`.s;
  main.querySelectorAll("[data-grade]").forEach((f) => f.onsubmit = async (e) => {
    e.preventDefault();
    try { await api(`/api/quizzes/attempt/${f.dataset.grade}/grade`, { body: { index: +f.dataset.index, points: +f.points.value, comment: f.comment.value } }); toast("บันทึกคะแนนแล้ว"); go(location.pathname, true); }
    catch (err) { toast(err.message, "bad"); }
  });
}

// ---------- ตัวสร้างเกม ----------
const TEMPLATES = { mcq: "ปรนัย (เลือกคำตอบ)", truefalse: "ถูก/ผิด", order: "เรียงลำดับ", scramble: "เรียงคำ (Word Scramble)", match: "จับคู่ (พลิกการ์ด)" };
const G_DEFAULT = {
  mcq: () => ({ prompt: "", options: ["", ""], answer: 0, hint: "" }),
  truefalse: () => ({ prompt: "", answer: true, explain: "" }),
  order: () => ({ prompt: "", items: ["", "", ""] }),
  scramble: () => ({ prompt: "", word: "", hint: "" }),
  match: () => ({ a: "", b: "" }),
};
function gEditor(t, q, i, n) {
  const tools = html`<div class="qtools"><button type="button" class="icon-btn" data-mv="-1" aria-label="เลื่อนขึ้น" ${i === 0 ? raw("disabled") : ""}>↑</button><button type="button" class="icon-btn" data-mv="1" aria-label="เลื่อนลง" ${i === n - 1 ? raw("disabled") : ""}>↓</button><button type="button" class="icon-btn" data-delq aria-label="ลบข้อนี้" ${n <= 1 ? raw("disabled") : ""}>🗑</button></div>`;
  if (t === "match") return html`<div class="pair-edit" data-qi="${i}"><input data-f="a" value="${q.a}" placeholder="การ์ด A" aria-label="คู่ที่ ${i + 1} การ์ด A"><span aria-hidden="true">↔</span><input data-f="b" value="${q.b}" placeholder="การ์ด B" aria-label="คู่ที่ ${i + 1} การ์ด B">${tools}</div>`;
  const img = (t === "mcq" || t === "truefalse") ? html`<div style="margin-top:8px">${q.image ? html`<img class="thumb" src="${q.image}" alt="ภาพประกอบ"> <button type="button" class="linkish small" data-delimg>ลบรูป</button>` : filePicker(`img${i}`, "เพิ่มรูปประกอบ (PNG/JPEG/WebP ไม่เกิน 150 KB)")}</div>` : "";
  let body = "";
  if (t === "mcq") body = html`${q.options.map((o, k) => html`<div class="opt-edit"><input type="radio" name="ga${i}" data-k="${k}" aria-label="ตัวเลือกที่ถูก" ${q.answer === k ? raw("checked") : ""}><input type="text" data-opt="${k}" value="${o}" placeholder="ตัวเลือกที่ ${k + 1}" aria-label="ตัวเลือกที่ ${k + 1}"><button type="button" class="icon-btn" data-delopt="${k}" aria-label="ลบตัวเลือก" ${q.options.length <= 2 ? raw("disabled") : ""}>✕</button></div>`)}
    <button type="button" class="linkish small" data-addopt>+ เพิ่มตัวเลือก</button><label>คำใบ้ <span class="muted small">(ไม่บังคับ)</span></label><input data-f="hint" value="${q.hint || ""}">`;
  if (t === "truefalse") body = html`<div class="form-grid"><div><label>เฉลย</label><select data-f="answer"><option value="true" ${q.answer ? raw("selected") : ""}>ถูก</option><option value="false" ${!q.answer ? raw("selected") : ""}>ผิด</option></select></div><div><label>คำอธิบาย <span class="muted small">(ไม่บังคับ)</span></label><input data-f="explain" value="${q.explain || ""}"></div></div>`;
  if (t === "order") body = html`<label>เรียงตามลำดับที่ถูกต้อง <span class="muted small">(บรรทัดละรายการ)</span></label><textarea data-f="items" rows="4">${(q.items || []).join("\n")}</textarea>`;
  if (t === "scramble") body = html`<div class="form-grid"><div><label>คำตอบ <span class="muted small">(ไทยหรืออังกฤษ)</span></label><input data-f="word" value="${q.word}"></div><div><label>คำใบ้ <span class="muted small">(ไม่บังคับ)</span></label><input data-f="hint" value="${q.hint || ""}"></div></div>`;
  return html`<section class="card builder-q" data-qi="${i}"><div class="row between"><b>ข้อ ${i + 1}</b>${tools}</div>
    <label>${t === "scramble" ? "คำใบ้/โจทย์" : "โจทย์"}</label><textarea data-f="prompt" rows="2">${q.prompt}</textarea>${body}${img}</section>`;
}
function readG(t, el, q) {
  const f = (k) => el.querySelector(`[data-f="${k}"]`)?.value ?? "";
  if (t === "match") return { a: f("a"), b: f("b") };
  const o = { ...q, prompt: f("prompt") };
  if (t === "mcq") { o.options = [...el.querySelectorAll("[data-opt]")].map((x) => x.value); o.answer = +([...el.querySelectorAll("[data-k]")].find((x) => x.checked)?.dataset.k || 0); o.hint = f("hint"); }
  if (t === "truefalse") { o.answer = f("answer") === "true"; o.explain = f("explain"); }
  if (t === "order") o.items = lines(f("items"));
  if (t === "scramble") { o.word = f("word"); o.hint = f("hint"); }
  return o;
}

export async function gameBuilder({ main, params }) {
  const { categories } = await api("/api/categories");
  let g = { title: "", description: "", template: "mcq", categorySlug: "", ageMin: 4, ageMax: 18, difficulty: "easy", visibility: "private", timeLimitSec: "", pointsPerQ: 100, passPct: 60 };
  let questions = [G_DEFAULT.mcq()], versions = [], fromAI = false;
  if (params.id) {
    const d = await api(`/api/games/${params.id}/edit`);
    g = { ...d.game, timeLimitSec: d.game.timeLimitSec || "" }; questions = d.questions; versions = d.versions;
  } else {
    const draft = sessionStorage.getItem("aiDraft:game");
    if (draft) { const d = JSON.parse(draft); sessionStorage.removeItem("aiDraft:game"); g.title = d.title; g.description = d.description; g.template = d.template; questions = d.items.map((x) => ({ ...G_DEFAULT[d.template](), ...x })); fromAI = true; }
  }
  const sel = (a, b) => (a === b ? raw("selected") : "");
  const shareUrl = params.id ? `${state.config.baseUrl || location.origin}/games/${params.id}` : "";
  main.innerHTML = html`<h1>${params.id ? html`แก้ไขเกม <span class="badge ${g.status === "published" ? "badge-ok" : ""}">${g.status === "published" ? "เผยแพร่แล้ว" : "ฉบับร่าง"}</span> <span class="muted small">v${g.version}</span>` : "สร้างเกม"}</h1>
    ${fromAI ? html`<div class="note">✨ เนื้อหานี้สร้างโดย AI และ<b>ยังไม่ได้บันทึก</b> — ตรวจสอบความถูกต้องทุกข้อ แก้ไขตามต้องการ แล้วกด “บันทึก”</div>` : ""}
    ${params.id && g.plays ? html`<div class="info small">ℹ️ มีผู้เล่นแล้ว ${g.plays} ครั้ง — แก้เกมได้ ผลคะแนนเดิมยังอยู่ แต่เกณฑ์/คำถามใหม่จะใช้กับการเล่นครั้งต่อไป</div>` : ""}
    <form class="card" id="meta"><div class="form-grid">
      <div class="full"><label for="g-t">ชื่อเกม</label><input id="g-t" name="title" value="${g.title}" required maxlength="120"></div>
      <div class="full"><label for="g-d">คำอธิบาย / วิธีเล่น</label><textarea id="g-d" name="description" rows="2" maxlength="500">${g.description}</textarea></div>
      <div><label for="g-tp">ชนิดเกม (แม่แบบ) ${params.id ? html`<span class="muted small">— เปลี่ยนไม่ได้</span>` : ""}</label><select id="g-tp" name="template" ${params.id ? raw("disabled") : ""}>${Object.entries(TEMPLATES).map(([k, v]) => html`<option value="${k}" ${sel(k, g.template)}>${v}</option>`)}</select></div>
      <div><label for="g-c">หมวดหมู่</label><select id="g-c" name="categorySlug"><option value="">ไม่ระบุ</option>${categories.map((c) => html`<option value="${c.slug}" ${sel(c.slug, g.categorySlug)}>${c.icon} ${c.name}</option>`)}</select></div>
      <div><label for="g-a1">อายุตั้งแต่ (ปี)</label><input id="g-a1" name="ageMin" type="number" min="1" max="99" value="${g.ageMin}"></div>
      <div><label for="g-a2">ถึง (ปี)</label><input id="g-a2" name="ageMax" type="number" min="1" max="99" value="${g.ageMax}"></div>
      <div><label for="g-df">ความยาก</label><select id="g-df" name="difficulty">${Object.entries(DIFF).map(([k, v]) => html`<option value="${k}" ${sel(k, g.difficulty)}>${v}</option>`)}</select></div>
      <div><label for="g-v">การมองเห็น</label><select id="g-v" name="visibility"><option value="private" ${sel("private", g.visibility)}>ส่วนตัว (เฉพาะฉัน/งานที่มอบหมาย)</option><option value="public" ${sel("public", g.visibility)}>สาธารณะ (แสดงในคลังเกม)</option></select></div></div>
      <h2>เวลา คะแนน และเงื่อนไขชนะ</h2><div class="form-grid">
      <div><label for="g-tl">เวลาทั้งเกม <span class="muted small">(วินาที, ว่าง = ไม่จำกัด)</span></label><input id="g-tl" name="timeLimitSec" type="number" min="10" max="3600" value="${g.timeLimitSec}"></div>
      <div><label for="g-p">คะแนนต่อข้อ <span class="muted small">(10–200)</span></label><input id="g-p" name="pointsPerQ" type="number" min="10" max="200" value="${g.pointsPerQ}"></div>
      <div><label for="g-pp">ผ่านเมื่อได้ ≥ (%)</label><input id="g-pp" name="passPct" type="number" min="0" max="100" value="${g.passPct}"></div></div>
      <p class="small muted">หมดเวลา = ข้อที่ยังไม่ตอบนับเป็นผิด · XP คิดตามสัดส่วนคะแนน (สูงสุด 50 XP ต่อครั้ง)</p></form>
    <h2 id="qh">${g.template === "match" ? "คู่การ์ด" : "คำถาม"}</h2><div id="qs"></div>
    <div class="row" style="margin-top:12px"><button class="btn btn-ghost" id="addQ">+ ${g.template === "match" ? "เพิ่มคู่" : "เพิ่มคำถาม"}</button></div>
    <div class="sticky-bar"><button class="btn" id="save">💾 บันทึก</button>
      ${params.id ? html`<a class="btn btn-ghost" href="/games/${params.id}">👀 ทดลองเล่น</a><button class="btn btn-ghost" id="pub">${g.status === "published" ? "ยกเลิกเผยแพร่" : "🚀 เผยแพร่"}</button><button class="btn btn-ghost" id="dup">ทำสำเนา</button>` : ""}
      <span class="err" id="err" role="alert"></span></div>
    ${params.id ? html`<section class="card" style="margin-top:16px"><h2 style="margin-top:0">แชร์</h2>
      <div class="row"><input id="share" value="${shareUrl}" readonly style="flex:1" aria-label="ลิงก์แชร์"><button class="btn btn-ghost" id="copy">คัดลอก</button></div>
      ${g.status !== "published" || g.visibility !== "public" ? html`<p class="small muted">ลิงก์นี้ใช้ได้กับทุกคนเมื่อเกม “เผยแพร่” และเป็น “สาธารณะ” (ตอนนี้เปิดได้เฉพาะคุณ${g.status === "published" ? " และนักเรียนที่ได้รับมอบหมาย" : ""})</p>` : ""}</section>
      <section class="card"><h2 style="margin-top:0">ประวัติการแก้ไข</h2><ul class="list">${versions.map((v) => html`<li><span><b>v${v.version}</b> ${v.note}</span><span class="small muted">${fmtDate(v.created_at)}</span></li>`)}</ul></section>
      <p><button class="link-danger" id="del">ลบเกม</button></p>` : ""}`.s;

  const box = main.querySelector("#qs");
  const tplSel = main.querySelector("#g-tp");
  const t = () => tplSel.value;
  const sync = () => box.querySelectorAll("[data-qi]").forEach((el) => { const i = +el.dataset.qi; questions[i] = readG(t(), el, questions[i]); });
  const draw = () => {
    box.innerHTML = questions.map((q, i) => gEditor(t(), q, i, questions.length).s).join("");
    box.querySelectorAll("[data-qi]").forEach((el) => {
      const i = +el.dataset.qi;
      const act = (s, fn) => el.querySelectorAll(s).forEach((b) => b.onclick = () => { sync(); fn(b); draw(); });
      act("[data-mv]", (b) => { const j = i + +b.dataset.mv; [questions[i], questions[j]] = [questions[j], questions[i]]; });
      act("[data-delq]", () => questions.splice(i, 1));
      act("[data-addopt]", () => questions[i].options.push(""));
      act("[data-delopt]", (b) => { questions[i].options.splice(+b.dataset.delopt, 1); if (questions[i].answer >= questions[i].options.length) questions[i].answer = 0; });
      act("[data-delimg]", () => { delete questions[i].image; });
      const fi = el.querySelector('input[type="file"]');
      if (fi) fi.onchange = async () => {
        const file = fi.files[0];
        if (!file) return;
        el.querySelector("[data-file-name]").textContent = file.name;
        try { sync(); questions[i].image = await readImage(file); draw(); } catch (e) { toast(e.message, "bad"); fi.value = ""; el.querySelector("[data-file-name]").textContent = "ยังไม่ได้เลือกไฟล์"; }
      };
    });
  };
  draw();
  tplSel.onchange = async () => {
    if (!(await confirmBox("เปลี่ยนชนิดเกมจะล้างคำถามที่ใส่ไว้ ต้องการเปลี่ยนหรือไม่?", "เปลี่ยน"))) { tplSel.value = g.template; return; }
    g.template = t(); questions = [G_DEFAULT[t()](), ...(t() === "match" ? [G_DEFAULT.match()] : [])];
    main.querySelector("#qh").textContent = t() === "match" ? "คู่การ์ด" : "คำถาม";
    main.querySelector("#addQ").textContent = t() === "match" ? "+ เพิ่มคู่" : "+ เพิ่มคำถาม";
    draw();
  };
  main.querySelector("#addQ").onclick = () => { sync(); questions.push(G_DEFAULT[t()]()); draw(); };
  main.querySelector("#save").onclick = async (e) => {
    sync();
    const m = formData(main.querySelector("#meta"));
    m.template = t();
    const err = main.querySelector("#err"); err.textContent = "";
    if (!m.title) { err.textContent = "กรุณาใส่ชื่อเกม"; return; }
    busy(e.target, true, "กำลังบันทึก…");
    try {
      if (params.id) { await api(`/api/games/${params.id}`, { method: "PUT", body: { ...m, questions } }); toast("บันทึกแล้ว"); go(location.pathname, true); }
      else { const r = await api("/api/games", { body: { ...m, questions } }); toast("สร้างเกมแล้ว (ฉบับร่าง)"); go(`/teacher/games/${r.id}/edit`, true); }
    } catch (ex) { err.textContent = ex.message; busy(e.target, false); }
  };
  if (params.id) {
    main.querySelector("#copy").onclick = async () => { try { await navigator.clipboard.writeText(shareUrl); toast("คัดลอกลิงก์แล้ว"); } catch { main.querySelector("#share").select(); toast("กด Ctrl+C เพื่อคัดลอก"); } };
    main.querySelector("#pub").onclick = async () => { await api(`/api/games/${params.id}/status`, { body: { status: g.status === "published" ? "draft" : "published" } }); toast(g.status === "published" ? "ยกเลิกเผยแพร่แล้ว" : "เผยแพร่แล้ว 🚀"); go(location.pathname, true); };
    main.querySelector("#dup").onclick = async () => { const r = await api(`/api/games/${params.id}/duplicate`, { method: "POST" }); toast("ทำสำเนาแล้ว"); go(`/teacher/games/${r.id}/edit`); };
    main.querySelector("#del").onclick = async () => { if (!(await confirmBox("ลบเกมนี้ถาวร?", "ลบเกม", true))) return; await api(`/api/games/${params.id}`, { method: "DELETE" }); toast("ลบเกมแล้ว"); go("/teacher/games"); };
  }
}

// ---------- AI ช่วยสร้าง ----------
export async function aiPage({ main, me }) {
  const st = await api("/api/ai/status");
  if (!st.enabled) {
    main.innerHTML = html`<div class="narrow"><h1>AI ช่วยสร้างเนื้อหา</h1><div class="card"><h2 style="margin-top:0">⚠️ ฟีเจอร์นี้ยังไม่เปิดใช้งาน</h2>
      <p>ระบบจะไม่สร้างเนื้อหาปลอมแทน ${me.role === "admin" ? "" : "กรุณาติดต่อผู้ดูแลระบบเพื่อเปิดใช้งาน"}</p>
      ${me.role === "admin" ? html`<p>ผู้ดูแลตั้งค่าตัวแปรต่อไปนี้บนเซิร์ฟเวอร์แล้วเริ่มระบบใหม่:</p><pre>AI_PROVIDER=anthropic   # หรือ openai
AI_API_KEY=&lt;คีย์ API&gt;
AI_MODEL=&lt;ชื่อโมเดล&gt;     # ไม่บังคับ
# AI_API_URL=https://...  # ไม่บังคับ ต้องเป็น https</pre><p class="small muted">คีย์เก็บไว้บนเซิร์ฟเวอร์เท่านั้น ไม่ถูกส่งไปที่เบราว์เซอร์ ดูรายละเอียดใน README</p>` : ""}
      <p class="small muted">ระหว่างนี้สร้างเนื้อหาเองได้ที่ <a href="/teacher/quizzes/new">ตัวสร้างแบบทดสอบ</a> และ <a href="/teacher/games/new">ตัวสร้างเกม</a></p></div></div>`.s;
    return;
  }
  main.innerHTML = html`<div class="narrow"><h1>AI ช่วยสร้างเนื้อหา</h1>
    <form class="card" id="af"><div class="form-grid">
      <div><label for="a-tg">สร้างเป็น</label><select id="a-tg" name="target"><option value="quiz">คำถามแบบทดสอบ</option><option value="game">เกม</option></select></div>
      <div id="a-kind"></div>
      <div class="full"><label for="a-t">หัวข้อ <span class="muted small">(เช่น “วัฏจักรของน้ำ”, “คำศัพท์ผลไม้ภาษาอังกฤษ”)</span></label><input id="a-t" name="topic" required maxlength="200"></div>
      <div><label for="a-g">ระดับชั้น</label><input id="a-g" name="grade" placeholder="เช่น ป.4" maxlength="20"></div>
      <div><label for="a-d">ความยาก</label><select id="a-d" name="difficulty">${Object.entries(DIFF).map(([k, v]) => html`<option value="${k}">${v}</option>`)}</select></div>
      <div><label for="a-n">จำนวน (1–20)</label><input id="a-n" name="count" type="number" min="1" max="20" value="8"></div>
      <div><label for="a-l">ภาษา</label><select id="a-l" name="language"><option value="th">ไทย</option><option value="en">อังกฤษ</option></select></div></div>
      <button class="btn btn-block" style="margin-top:14px">✨ สร้างด้วย AI</button>
      <p class="small muted">เนื้อหาถูกสร้างโดยโมเดลภาษา และอาจผิดพลาดหรือไม่เหมาะสม ต้องตรวจสอบก่อนใช้กับนักเรียนเสมอ · ไม่มีการบันทึกจนกว่าคุณจะกดบันทึกในหน้าตัวสร้าง · จำกัด 10 ครั้ง/ชั่วโมง · ห้ามใส่ข้อมูลส่วนบุคคลในหัวข้อ</p></form>
    <div id="out"></div></div>`.s;
  const f = main.querySelector("#af"), kind = main.querySelector("#a-kind");
  const drawKind = () => {
    kind.innerHTML = f.target.value === "game"
      ? html`<label for="a-tp">ชนิดเกม</label><select id="a-tp" name="template">${Object.entries(TEMPLATES).map(([k, v]) => html`<option value="${k}">${v}</option>`)}</select>`.s
      : html`<fieldset style="margin:0"><legend class="small">ชนิดคำถาม</legend>${[["mcq", "ปรนัย"], ["truefalse", "ถูก/ผิด"], ["short", "คำตอบสั้น"], ["multi", "เลือกหลายข้อ"], ["numeric", "ตัวเลข"]].map(([k, v], i) => html`<label class="check"><input type="checkbox" name="t_${k}" ${i === 0 ? raw("checked") : ""}> ${v}</label>`)}</fieldset>`.s;
  };
  f.target.onchange = drawKind; drawKind();
  f.onsubmit = async (e) => {
    e.preventDefault();
    const d = formData(f);
    const body = { target: d.target, topic: d.topic, grade: d.grade, difficulty: d.difficulty, count: d.count, language: d.language, template: d.template,
      types: Object.keys(d).filter((k) => k.startsWith("t_") && d[k]).map((k) => k.slice(2)) };
    const btn = f.querySelector("button"); busy(btn, true, "✨ กำลังสร้าง… (อาจใช้เวลาถึง 1 นาที)");
    const out = main.querySelector("#out");
    try {
      const r = await api("/api/ai/generate", { body });
      const items = r.items;
      out.innerHTML = html`<h2>ตัวอย่างที่ได้ (${items.length} รายการ) <span class="muted small">โมเดล: ${r.model}</span></h2>
        ${items.map((x, i) => html`<div class="qcard"><b>${i + 1}. ${x.prompt || `${x.a || ""} ↔ ${x.b || ""}`}</b>
          ${x.options ? html`<ul class="review">${x.options.map((o, k) => html`<li>${(x.answers ? x.answers.includes(k) : x.answer === k) ? "✅" : "▫️"} ${o}</li>`)}</ul>` : ""}
          ${x.type === "truefalse" || (body.target === "game" && body.template === "truefalse") ? html`<div class="small">เฉลย: ${x.answer ? "ถูก/จริง" : "ผิด/เท็จ"}</div>` : ""}
          ${x.accepted ? html`<div class="small">คำตอบ: ${[].concat(x.accepted).join(", ")}</div>` : ""}${x.word ? html`<div class="small">คำตอบ: ${x.word}</div>` : ""}
          ${x.items ? html`<div class="small">${x.items.join(" → ")}</div>` : ""}${x.type === "numeric" ? html`<div class="small">คำตอบ: ${x.answer} ${x.unit || ""}</div>` : ""}
          ${x.explain || x.hint ? html`<div class="small muted">💡 ${x.explain || x.hint}</div>` : ""}</div>`)}
        <div class="row" style="margin-top:14px"><button class="btn" id="use">ตรวจแก้ในตัวสร้าง${body.target === "game" ? "เกม" : "แบบทดสอบ"} →</button><button class="btn btn-ghost" id="drop">ทิ้ง</button></div>`.s;
      out.querySelector("#use").onclick = () => {
        sessionStorage.setItem(`aiDraft:${body.target}`, JSON.stringify({ title: r.title, description: r.description, items, template: body.template }));
        go(body.target === "game" ? "/teacher/games/new" : "/teacher/quizzes/new");
      };
      out.querySelector("#drop").onclick = () => { out.innerHTML = ""; };
    } catch (ex) { out.innerHTML = html`<div class="note">${ex.message}</div>`.s; }
    busy(btn, false);
  };
}
