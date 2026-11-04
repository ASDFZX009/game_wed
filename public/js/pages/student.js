// หน้าของนักเรียน: แดชบอร์ด โปรไฟล์ ห้องเรียน ตั้งค่า
import { api, html, raw, state, toast, fmtDate, fmtDay, relTime, dueText, pct, barChart, formData, busy, confirmBox, levelInfo, avatar, titleTag } from "../core.js";
import { go, refreshMe } from "../app.js";
import * as T from "./teacher.js";
import { getPrefs, setPrefs, playSound, PALETTES, DEFAULTS } from "../prefs.js";

const KIND = { game: "เล่นเกม", quiz: "ส่งแบบทดสอบ" };
export function assignmentHref(a, classId) {
  return a.kind === "game" ? `/games/${a.refId}?assignment=${a.id}&class=${classId}` : `/quizzes/${a.refId}?assignment=${a.id}&class=${classId}`;
}

export async function dashboard({ main, me }) {
  if (me.role !== "student") return go("/teacher", true);
  const d = await api("/api/dashboard/student");
  const lv = levelInfo(d.xp, d.xpPerLevel);
  main.innerHTML = html`
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

export async function profile({ main, me }) {
  const d = await api("/api/dashboard/profile");
  const lv = levelInfo(me.xp);
  main.innerHTML = html`<div class="narrow"><div class="card"><div class="row" style="gap:16px;flex-wrap:nowrap">${avatar(me.equipped, "xl")}<div><h1 style="margin:0">${me.displayName}</h1>${titleTag(me.equipped)}</div></div>
      <div class="muted">${me.email} · ${{ student: "นักเรียน", teacher: "ครู", admin: "ผู้ดูแลระบบ" }[me.role]}${me.grade ? ` · ${me.grade}` : ""}</div>
      <p style="margin-bottom:0">ระดับ ${lv.level} · ${me.xp} XP · 🪙 ${me.coins || 0} · เหรียญรางวัล ${d.badges.length} อัน · <a href="/shop?tab=mine">ของสะสมของฉัน</a></p></div>
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
  const P = getPrefs();
  const shop = me ? await api("/api/shop").catch(() => null) : null;
  const ownedIds = new Set((shop?.items || []).filter((i) => i.owned).map((i) => i.id));
  const locked = (x) => x.premium && !ownedIds.has(x.premium);
  const seg = (key, opts) => html`<div class="seg" role="group" data-seg="${key}">${opts.map(([v, t]) => html`<button type="button" data-v="${v}" aria-pressed="${P[key] === v}">${t}</button>`)}</div>`;
  const sw = (key, title, desc) => html`<div class="set-row"><div class="t"><b id="l-${key}">${title}</b><span class="small muted">${desc}</span></div>
    <label class="switch"><input type="checkbox" data-sw="${key}" aria-labelledby="l-${key}" ${P[key] ? raw("checked") : ""}><span></span></label></div>`;
  main.innerHTML = html`<div class="narrow"><h1>ตั้งค่า</h1>
    <nav class="settings-nav" aria-label="หมวดการตั้งค่า"><a href="#s-look">🎨 ธีมและการแสดงผล</a><a href="#s-read">👓 การอ่านและการเข้าถึง</a><a href="#s-game">🎮 เกมและเสียง</a>${state.config.local ? "" : html`<a href="#s-app">📲 ติดตั้งแอป</a>`}${me ? html`<a href="#s-account">👤 ${state.config.local ? "ผู้เล่นและความคืบหน้า" : "บัญชี"}</a>` : ""}</nav>
    <p class="small muted">${state.config.local ? "การตั้งค่าจะบันทึกไว้ในเบราว์เซอร์นี้" : me ? "การตั้งค่าการแสดงผลจะบันทึกกับบัญชีของคุณ ใช้ได้ทุกเครื่องที่เข้าสู่ระบบ" : "การตั้งค่าจะบันทึกไว้ในเบราว์เซอร์นี้ — เข้าสู่ระบบเพื่อให้ตามไปทุกเครื่อง"} · มีผลทันทีที่เลือก</p>

    <section class="card" id="s-look"><h2 style="margin-top:0">🎨 ธีมและการแสดงผล</h2>
      <div class="preview" aria-hidden="true"><div class="ph"><b>ตัวอย่างธีม</b><div class="small" style="opacity:.9">เรียนสนุก เล่นได้จริง 🚀</div></div>
        <div class="pb"><div class="row"><span class="btn btn-sm">ปุ่มหลัก</span><span class="btn btn-sm btn-ghost">ปุ่มรอง</span><span class="badge badge-brand">ป้าย</span><span class="badge badge-ok">ถูกต้อง</span></div>
        <div class="progress" style="margin:0"><i style="width:65%"></i></div><div class="card" style="padding:10px 14px;box-shadow:none">การ์ดเนื้อหา · <a href="#s-look">ลิงก์</a> · <span class="muted">ข้อความรอง</span></div></div></div>
      <h3 style="margin-top:18px">ธีมสี</h3>
      <div class="palettes" role="radiogroup" aria-label="ธีมสี">${PALETTES.map((x) => html`<button type="button" class="pal" role="radio" data-pal="${x.id}" ${locked(x) ? raw('data-locked="1"') : ""} aria-checked="${P.palette === x.id}" ${locked(x) ? raw(`aria-label="${x.name} (ล็อกอยู่ ปลดล็อกได้ที่ร้านค้า)"`) : ""}>
        <div class="sw" style="background:linear-gradient(135deg, ${x.c[0]}, ${x.c[1]})${locked(x) ? ";filter:grayscale(.7);opacity:.6" : ""}">${locked(x) ? "🔒" : x.icon}</div><span class="ok">${P.palette === x.id ? "✓" : ""}</span><span class="nm">${x.name}${x.premium ? html` <span class="badge badge-warn">พิเศษ</span>` : ""}</span></button>`)}</div>
      <p class="small muted">ธีมพิเศษ 🔒 ปลดล็อกได้ที่ <a href="/shop">🛒 ร้านค้า</a> ด้วยเหรียญจากการเล่นเกม</p>
      <div class="set-row" style="margin-top:12px"><div class="t"><b>โหมดสี</b><span class="small muted">“ตามอุปกรณ์” จะเปลี่ยนตามการตั้งค่ามืด/สว่างของเครื่อง</span></div>${seg("mode", [["light", "☀️ สว่าง"], ["dark", "🌙 มืด"], ["auto", "🖥️ ตามอุปกรณ์"]])}</div>
      <div class="set-row"><div class="t"><b>ขนาดตัวอักษร</b><span class="small muted">ขยายทั้งหน้าเว็บ รวมเกมและแบบทดสอบ</span></div>${seg("fontSize", [["sm", "เล็ก"], ["md", "ปกติ"], ["lg", "ใหญ่"], ["xl", "ใหญ่มาก"]])}</div></section>

    <section class="card" id="s-read"><h2 style="margin-top:0">👓 การอ่านและการเข้าถึง</h2>
      ${sw("contrast", "ความต่างสีสูง", "ตัวอักษรรองเข้มขึ้น เส้นขอบชัดขึ้น อ่านง่ายในที่แสงจ้า")}
      ${sw("dyslexic", "เว้นระยะตัวอักษร", "เพิ่มระยะห่างระหว่างตัวอักษร คำ และบรรทัด ช่วยให้อ่านง่ายขึ้น")}
      <div class="set-row"><div class="t"><b>การเคลื่อนไหว</b><span class="small muted">ลดแอนิเมชันสำหรับผู้ที่ไวต่อการเคลื่อนไหว (ปิดพลุฉลองด้วย)</span></div>${seg("motion", [["auto", "ปกติ"], ["reduce", "ลดการเคลื่อนไหว"]])}</div></section>

    <section class="card" id="s-game"><h2 style="margin-top:0">🎮 เกมและเสียง</h2>
      <div class="set-row"><div class="t"><b id="l-sound">เสียงประกอบ</b><span class="small muted">เสียงเมื่อตอบถูก ตอบผิด พลิกการ์ด และจบเกม</span></div>
        <div class="row"><button type="button" class="btn btn-ghost btn-sm" id="testSound">🔊 ลองฟัง</button><label class="switch"><input type="checkbox" data-sw="sound" aria-labelledby="l-sound" ${P.sound ? raw("checked") : ""}><span></span></label></div></div>
      ${sw("haptics", "สั่นเมื่อตอบ (มือถือ)", "สั่นเบา ๆ เมื่อตอบถูก/ผิด — ใช้ได้กับมือถือ Android ส่วนใหญ่ (iPhone ไม่รองรับ)")}
      ${sw("confetti", "พลุฉลอง", "แสดงพลุกระดาษเมื่อได้คะแนนเต็มหรือติดอันดับ")}
      ${sw("autoNext", "ไปข้อถัดไปอัตโนมัติ", "หลังตอบ เกมจะไปข้อต่อไปเอง (ตอบถูก 1.2 วินาที ตอบผิด 2.5 วินาที)")}</section>

    <section class="card" id="s-app" ${state.config.local ? raw("hidden") : ""}><h2 style="margin-top:0">📲 ติดตั้งเป็นแอปบนมือถือ</h2><div id="installBox"></div></section>

    <p class="row end"><button class="btn btn-ghost btn-sm" id="resetPrefs">↺ คืนค่าการแสดงผลเริ่มต้น</button></p>

    ${state.config.local ? html`<section class="card" id="s-account"><h2 style="margin-top:0">👤 ผู้เล่นและความคืบหน้า</h2>
      <form id="lf"><label for="ln">ชื่อที่แสดง</label><div class="row"><input id="ln" name="displayName" value="${me.displayName}" maxlength="40" style="flex:1" required><button class="btn">บันทึก</button></div></form>
      <p class="small muted">ความคืบหน้า (XP เหรียญ ของสะสม) เก็บไว้ในเบราว์เซอร์นี้ — ถ้าล้างข้อมูลเบราว์เซอร์หรือเปลี่ยนเครื่องจะหายไป ใช้ “สำรอง” เพื่อย้ายไปเครื่องอื่นได้</p>
      <div class="row"><button class="btn btn-ghost btn-sm" id="exp">💾 สำรองความคืบหน้า</button><button class="btn btn-ghost btn-sm" id="imp">📥 กู้คืนจากข้อความสำรอง</button><button class="btn btn-danger btn-sm" id="wipe">🗑 เริ่มใหม่ทั้งหมด</button></div>
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
    : html`<div class="card center" id="s-account"><p>เข้าสู่ระบบเพื่อจัดการบัญชี และให้การตั้งค่าตามไปทุกเครื่อง</p><a class="btn" href="/login?next=/settings">เข้าสู่ระบบ</a> <a class="btn btn-ghost" href="/register">สมัครสมาชิก</a></div>`}</div>`.s;

  const refresh = () => {
    const p = getPrefs();
    main.querySelectorAll("[data-seg]").forEach((g) => g.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(p[g.dataset.seg] === b.dataset.v))));
    main.querySelectorAll("[data-pal]").forEach((b) => { const on = p.palette === b.dataset.pal; b.setAttribute("aria-checked", String(on)); b.querySelector(".ok").textContent = on ? "✓" : ""; });
    main.querySelectorAll("[data-sw]").forEach((c) => { c.checked = !!p[c.dataset.sw]; });
  };
  main.querySelectorAll("[data-seg] button").forEach((b) => b.onclick = () => { setPrefs({ [b.closest("[data-seg]").dataset.seg]: b.dataset.v }); refresh(); });
  main.querySelectorAll("[data-pal]").forEach((b) => b.onclick = () => { if (b.dataset.locked) { toast(me ? "ธีมนี้ยังล็อกอยู่ ไปปลดล็อกที่ร้านค้าได้เลย" : "เข้าสู่ระบบแล้วสะสมเหรียญเพื่อปลดล็อกธีมพิเศษ", "bad"); return; } setPrefs({ palette: b.dataset.pal }); refresh(); toast(`เปลี่ยนธีมเป็น “${PALETTES.find((x) => x.id === b.dataset.pal).name}”`); });
  main.querySelectorAll("[data-sw]").forEach((c) => c.onchange = () => { setPrefs({ [c.dataset.sw]: c.checked }); if (c.dataset.sw === "sound" && c.checked) playSound("correct"); });
  main.querySelector("#testSound").onclick = () => { if (!getPrefs().sound) return toast("เปิดสวิตช์เสียงก่อน", "bad"); playSound("correct"); setTimeout(() => playSound("wrong"), 450); setTimeout(() => playSound("win"), 1000); };
  const ib = main.querySelector("#installBox");
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (standalone) ib.innerHTML = html`<p style="margin:0">✅ คุณกำลังใช้ EduPlay แบบแอปอยู่แล้ว</p>`.s;
  else if (state.installPrompt) {
    ib.innerHTML = html`<div class="install-card"><span class="ic">🚀</span><div class="grow"><b>เพิ่ม EduPlay ลงหน้าจอโฮม</b><div class="small muted">เปิดได้เร็วเหมือนแอป เต็มจอ ไม่มีแถบเบราว์เซอร์</div></div><button class="btn" id="doInstall">ติดตั้ง</button></div>`.s;
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
