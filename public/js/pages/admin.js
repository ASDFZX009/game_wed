// หน้าผู้ดูแลระบบ
import { api, html, raw, toast, fmtDate, fmtDay, barChart, confirmBox, promptBox, formData } from "../core.js";
import { go } from "../app.js";

const ROLE_TH = { student: "นักเรียน", teacher: "ครู", admin: "ผู้ดูแล" };

export async function dashboard({ main }) {
  const d = await api("/api/admin/stats");
  main.innerHTML = html`<h1>แดชบอร์ดผู้ดูแลระบบ</h1>
    <div class="stats">
      <div class="stat"><div class="k">ผู้ใช้ทั้งหมด</div><div class="v">${d.users}</div><div class="s">ใหม่ 7 วัน: ${d.newUsers7}</div></div>
      <div class="stat"><div class="k">นักเรียน / ครู / ผู้ดูแล</div><div class="v">${d.students} / ${d.teachers} / ${d.admins}</div></div>
      <div class="stat"><div class="k">บัญชีใช้งานได้ / ถูกระงับ</div><div class="v">${d.active} / ${d.suspended}</div></div>
      <div class="stat"><div class="k">ห้องเรียน</div><div class="v">${d.classes}</div></div>
      <div class="stat"><div class="k">เกม (เผยแพร่)</div><div class="v">${d.games} (${d.gamesPublished})</div></div>
      <div class="stat"><div class="k">แบบทดสอบ (เผยแพร่)</div><div class="v">${d.quizzes} (${d.quizzesPublished})</div></div>
      <div class="stat"><div class="k">ห้องแข่งสด (เปิดอยู่)</div><div class="v">${d.liveRooms} (${d.liveOpen})</div></div>
      <div class="stat"><div class="k">การเล่นสะสม</div><div class="v">${d.plays + d.attempts}</div><div class="s">แบบทดสอบ ${d.attempts} · เกม ${d.plays}</div></div></div>
    <section class="card"><h2 style="margin-top:0">การใช้งาน 14 วันล่าสุด (ส่งแบบทดสอบ + เล่นเกม)</h2>${barChart(d.chart, { label: (r) => fmtDay(r.day), value: (r) => r.n, unit: "ครั้ง", title: "การใช้งานรายวัน" })}</section>
    <section class="card"><h2 style="margin-top:0">สถานะ AI ช่วยสร้างเนื้อหา</h2>${d.ai.enabled
      ? html`<p style="margin:0">✅ เปิดใช้งาน · ผู้ให้บริการ: ${d.ai.provider} · โมเดล: ${d.ai.model}</p>`
      : html`<p style="margin:0">⚠️ ยังไม่เปิดใช้ — ตั้งค่า <code>AI_PROVIDER</code>, <code>AI_API_KEY</code> (และ <code>AI_MODEL</code> ถ้าต้องการ) บนเซิร์ฟเวอร์แล้วเริ่มระบบใหม่ ${d.ai.urlOk === false ? "· AI_API_URL ต้องเป็น https" : ""}</p>`}</section>
    <h2>การดำเนินการของผู้ดูแลล่าสุด</h2>${d.audit.length ? html`<ul class="list">${d.audit.map((a) => html`<li><span class="grow"><b>${a.action}</b> <span class="small muted">${a.detail}</span></span><span class="small muted">${a.admin || "—"} · ${fmtDate(a.created_at)}</span></li>`)}</ul>` : html`<div class="empty">ยังไม่มีการดำเนินการ</div>`}`.s;
}

export async function users({ main, query }) {
  const q = query.get("q") || "", role = query.get("role") || "", page = query.get("page") || "1";
  const d = await api("/api/admin/users?" + new URLSearchParams({ q, role, page }));
  const sel = (a, b) => (a === b ? raw("selected") : "");
  main.innerHTML = html`<h1>ผู้ใช้</h1>
    <form class="row" id="uf" role="search"><input name="q" value="${q}" placeholder="ค้นหาอีเมล/ชื่อ" style="flex:1" aria-label="ค้นหา"><select name="role" style="width:auto" aria-label="บทบาท"><option value="">ทุกบทบาท</option>${Object.entries(ROLE_TH).map(([k, v]) => html`<option value="${k}" ${sel(k, role)}>${v}</option>`)}</select><button class="btn">ค้นหา</button></form>
    <div class="table-wrap" style="margin-top:14px"><table><thead><tr><th>ชื่อ</th><th>อีเมล</th><th>สถานะ</th><th>สมัครเมื่อ</th><th>จัดการ</th></tr></thead><tbody>
      ${d.users.map((u) => html`<tr><td>${u.display_name}</td><td>${u.email}</td><td><span class="badge ${u.status === "active" ? "badge-ok" : "badge-bad"}">${u.status === "active" ? "ใช้งานได้" : "ถูกระงับ"}</span></td><td>${fmtDate(u.created_at)}</td>
        <td><div class="row" style="flex-wrap:nowrap"><select data-role="${u.id}" style="width:auto;min-height:34px;padding:4px 8px" aria-label="บทบาทของ ${u.display_name}">${Object.entries(ROLE_TH).map(([k, v]) => html`<option value="${k}" ${sel(k, u.role)}>${v}</option>`)}</select>
          <button class="linkish small" data-status="${u.id}" data-to="${u.status === "active" ? "suspended" : "active"}">${u.status === "active" ? "ระงับ" : "เปิดใช้"}</button>
          <button class="linkish small" data-pw="${u.id}">ตั้งรหัสใหม่</button></div></td></tr>`)}</tbody></table></div>
    <p class="pager muted">หน้า ${d.page}/${d.pages} · ${d.total} บัญชี</p>`.s;
  main.querySelector("#uf").onsubmit = (e) => { e.preventDefault(); go("/admin/users?" + new URLSearchParams(formData(e.target))); };
  const patch = async (id, body, msg) => { try { await api(`/api/admin/users/${id}`, { method: "PATCH", body }); toast(msg); go(location.pathname + location.search, true); } catch (e) { toast(e.message, "bad"); go(location.pathname + location.search, true); } };
  main.querySelectorAll("[data-role]").forEach((s) => s.onchange = async () => { if (await confirmBox(`เปลี่ยนบทบาทเป็น “${ROLE_TH[s.value]}”?`)) patch(s.dataset.role, { role: s.value }, "เปลี่ยนบทบาทแล้ว"); else go(location.pathname + location.search, true); });
  main.querySelectorAll("[data-status]").forEach((b) => b.onclick = async () => { if (await confirmBox(b.dataset.to === "suspended" ? "ระงับบัญชีนี้? ผู้ใช้จะถูกออกจากระบบทันที" : "เปิดใช้บัญชีนี้?", "ยืนยัน", b.dataset.to === "suspended")) patch(b.dataset.status, { status: b.dataset.to }, "อัปเดตสถานะแล้ว"); });
  main.querySelectorAll("[data-pw]").forEach((b) => b.onclick = async () => { const pw = await promptBox("ตั้งรหัสผ่านใหม่ (อย่างน้อย 8 ตัว) แล้วแจ้งผู้ใช้", "รหัสผ่านใหม่"); if (pw) patch(b.dataset.pw, { password: pw }, "ตั้งรหัสผ่านใหม่แล้ว"); });
}

export async function content({ main, query }) {
  const kind = query.get("kind") === "game" ? "game" : "quiz", q = query.get("q") || "";
  const d = await api("/api/admin/content?" + new URLSearchParams({ kind, q }));
  main.innerHTML = html`<h1>ตรวจสอบเนื้อหาสาธารณะ</h1>
    <form class="row" id="cf" role="search"><select name="kind" style="width:auto" aria-label="ชนิด"><option value="quiz" ${kind === "quiz" ? raw("selected") : ""}>แบบทดสอบ</option><option value="game" ${kind === "game" ? raw("selected") : ""}>เกม</option></select>
      <input name="q" value="${q}" placeholder="ค้นหาชื่อ" style="flex:1" aria-label="ค้นหา"><button class="btn">ค้นหา</button></form>
    <p class="small muted">การถอดเนื้อหาจะเปลี่ยนเป็นส่วนตัว ไม่ลบ คะแนนนักเรียนและงานของเจ้าของยังอยู่ และระบบบันทึกเหตุผลไว้</p>
    ${d.items.length ? html`<ul class="list">${d.items.map((x) => html`<li><div class="grow"><b>${x.title}</b><div class="small muted">${x.description} · โดย ${x.owner || "—"} · ${fmtDate(x.created_at)}</div></div>
      <div class="actions"><a href="/${kind === "game" ? "games" : "quizzes"}/${x.id}">เปิดดู</a><button class="link-danger" data-un="${x.id}">ถอดออกจากสาธารณะ</button></div></li>`)}</ul>` : html`<div class="empty">ไม่พบเนื้อหา</div>`}`.s;
  main.querySelector("#cf").onsubmit = (e) => { e.preventDefault(); go("/admin/content?" + new URLSearchParams(formData(e.target))); };
  main.querySelectorAll("[data-un]").forEach((b) => b.onclick = async () => {
    const reason = await promptBox("เหตุผลในการถอดเนื้อหา", "เช่น เนื้อหาไม่ถูกต้อง");
    if (!reason) return;
    try { await api(`/api/admin/content/${kind}/${b.dataset.un}/unpublish`, { body: { reason } }); toast("ถอดออกจากสาธารณะแล้ว"); go(location.pathname + location.search, true); } catch (e) { toast(e.message, "bad"); }
  });
}

export async function categories({ main }) {
  const { categories } = await api("/api/admin/categories");
  main.innerHTML = html`<h1>หมวดหมู่</h1><div class="narrow" style="margin:0">
    <ul class="list">${categories.map((c) => html`<li><span class="grow">${c.icon} <b>${c.name_th}</b> / ${c.name_en} <span class="small muted">(${c.slug}) · ใช้อยู่ ${c.used}</span></span>
      <div class="actions"><button class="linkish" data-ren="${c.id}" data-th="${c.name_th}">เปลี่ยนชื่อ</button><button class="link-danger" data-del="${c.id}" data-used="${c.used}">ลบ</button></div></li>`)}</ul>
    <form class="card" id="nf" style="margin-top:16px"><h2 style="margin-top:0">เพิ่มหมวด</h2><div class="form-grid">
      <div><label for="c-s">slug <span class="muted small">(a-z, 0-9, -)</span></label><input id="c-s" name="slug" required pattern="[a-z0-9-]{2,30}"></div>
      <div><label for="c-i">ไอคอน</label><input id="c-i" name="icon" value="📚" maxlength="4"></div>
      <div><label for="c-th">ชื่อไทย</label><input id="c-th" name="nameTh" required></div><div><label for="c-en">English name</label><input id="c-en" name="nameEn" required></div></div>
      <button class="btn" style="margin-top:12px">เพิ่มหมวด</button></form></div>`.s;
  const reload = () => go(location.pathname, true);
  main.querySelector("#nf").onsubmit = async (e) => { e.preventDefault(); try { await api("/api/admin/categories", { body: formData(e.target) }); toast("เพิ่มหมวดแล้ว"); reload(); } catch (err) { toast(err.message, "bad"); } };
  main.querySelectorAll("[data-ren]").forEach((b) => b.onclick = async () => { const v = await promptBox(`ชื่อไทยใหม่ของ “${b.dataset.th}”`); if (v) { await api(`/api/admin/categories/${b.dataset.ren}`, { method: "PATCH", body: { nameTh: v } }); toast("เปลี่ยนชื่อแล้ว"); reload(); } });
  main.querySelectorAll("[data-del]").forEach((b) => b.onclick = async () => { if (!(await confirmBox(+b.dataset.used ? `หมวดนี้มีเกม ${b.dataset.used} เกม เกมจะกลายเป็น “ไม่ระบุหมวด” ต้องการลบหรือไม่?` : "ลบหมวดนี้?", "ลบ", true))) return; await api(`/api/admin/categories/${b.dataset.del}`, { method: "DELETE" }); toast("ลบหมวดแล้ว"); reload(); });
}
