// แข่งสด: สร้างห้อง (ครู), หน้าควบคุมของโฮสต์, เข้าร่วมด้วย PIN และหน้าผู้เล่น
import { api, html, raw, state, toast, confetti, confirmBox, busy } from "../core.js";
import { go, onLeave } from "../app.js";
import { playSound } from "../prefs.js";

const SHAPES = ["▲", "◆", "●", "■", "★", "✚"];
const sock = () => window.io({ transports: ["websocket", "polling"] });

export async function createRoom({ main }) {
  const { quizzes } = await api("/api/dashboard/assignable");
  main.innerHTML = html`<div class="narrow"><h1>จัดการแข่งขันสด</h1>
    <form class="card" id="lf"><label for="lq">เลือกแบบทดสอบ</label>
      <select id="lq" name="quizId" required>${quizzes.map((q) => html`<option value="${q.id}">${q.title} (${q.questionCount} ข้อ)</option>`)}</select>
      <p class="small muted">ใช้ได้กับคำถามแบบ ปรนัย ถูก/ผิด เลือกได้หลายข้อ คำตอบสั้น และตัวเลข (ชนิดอื่นจะถูกข้าม) · ข้อละ 20 วินาที · ตอบถูกได้ 500–1000 คะแนนตามความเร็ว</p>
      <label class="check"><input type="checkbox" name="allowGuests" checked> อนุญาตผู้เล่นที่ไม่ได้สมัครสมาชิก</label><br>
      <label class="check"><input type="checkbox" name="teamMode"> โหมดทีม (แดง/น้ำเงิน)</label><br>
      <label class="check"><input type="checkbox" name="showLeaderboard" checked> แสดงอันดับให้ผู้เล่น <span class="muted small">(ปิดเพื่อลดการแข่งขัน)</span></label>
      <button class="btn btn-block" style="margin-top:12px">สร้างห้อง</button></form>
    ${!quizzes.length ? html`<div class="empty">ยังไม่มีแบบทดสอบที่เผยแพร่ <a href="/teacher/quizzes/new">สร้างแบบทดสอบ</a></div>` : ""}</div>`.s;
  const f = main.querySelector("#lf");
  f.onsubmit = async (e) => {
    e.preventDefault();
    try {
      const r = await api("/api/live", { body: { quizId: +f.quizId.value, allowGuests: f.allowGuests.checked, teamMode: f.teamMode.checked, showLeaderboard: f.showLeaderboard.checked } });
      go(`/teacher/live/${r.pin}`);
    } catch (err) { toast(err.message, "bad"); }
  };
}

function leaderboardHtml(lb, meId) {
  if (!lb || !lb.length) return html`<p class="muted">ยังไม่มีคะแนน</p>`;
  return html`<ol class="list" style="padding:0">${lb.map((p) => html`<li ${p.id === meId ? raw('style="background:var(--brand-soft);font-weight:700"') : ""}><span class="grow">${p.rank}. ${p.name}${p.team ? html` <span class="badge" style="background:${p.team === "red" ? "#c62f45" : "#1d5fd6"};color:#fff">${p.team === "red" ? "แดง" : "น้ำเงิน"}</span>` : ""}</span><b>${p.score.toLocaleString("th-TH")}</b></li>`)}</ol>`;
}
function teamsHtml(t) {
  if (!t) return "";
  return html`<div class="teams" style="margin:12px 0"><div class="team red">ทีมแดง<br>${t.red.score.toLocaleString("th-TH")}</div><div class="team blue">ทีมน้ำเงิน<br>${t.blue.score.toLocaleString("th-TH")}</div></div>`;
}
function countdown(el, endsAt) {
  const t = () => { if (!el.isConnected) return clearInterval(id); el.textContent = `⏱ ${Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))}`; };
  const id = setInterval(t, 200); t();
  return () => clearInterval(id);
}

// ---------- โฮสต์ ----------
export async function hostPage({ main, params }) {
  const info = await api(`/api/live/room/${params.pin}`);
  if (!info.host) throw Object.assign(new Error("ไม่พบห้อง"), { status: 404 });
  const s = sock();
  let stopTimer = () => {};
  onLeave(() => { stopTimer(); s.disconnect(); });
  const top = html`<div class="row between"><h1 style="margin:0">${info.title} <span class="muted small">PIN ${info.pin}</span></h1><span class="muted" id="pc">ผู้เล่น 0</span></div>`;
  main.innerHTML = html`${top}<div id="stage" style="margin-top:14px"></div>`.s;
  const stage = main.querySelector("#stage");
  const emit = (ev, d = {}) => new Promise((res) => s.emit(ev, d, res));

  const lobby = (players = [], locked = false) => {
    main.querySelector("#pc").textContent = `ผู้เล่น ${players.length}`;
    stage.innerHTML = html`<div class="grid-2"><div class="card center">
        <div class="muted">เข้าร่วมที่ <b>${info.joinBase}/join</b></div><div class="pin-big">${info.pin}</div>
        <img class="qr" src="${info.qr}" alt="QR สำหรับเข้าร่วมห้อง ${info.pin}">
        ${info.localWarning ? html`<div class="note small" style="text-align:left">⚠️ ลิงก์นี้ใช้ได้เฉพาะเครื่องนี้ (localhost) มือถือนักเรียนจะเข้าไม่ได้
          ${info.lanUrls.length ? html`<br>ให้ครูเปิดหน้านี้ผ่าน ${info.lanUrls.map((u) => html`<a href="${u}${location.pathname}">${u}</a> `)} แทน (ต้องอยู่ Wi-Fi เดียวกัน)` : ""} หรือตั้งค่า <code>PUBLIC_BASE_URL</code></div>` : ""}
        ${info.skipped ? html`<p class="small muted">ข้าม ${info.skipped} ข้อที่เป็นชนิดที่แข่งสดไม่รองรับ</p>` : ""}</div>
      <div class="card"><div class="row"><button class="btn" id="start" ${players.length ? "" : raw("disabled")}>▶ เริ่มเกม</button><button class="btn btn-ghost" id="lock">${locked ? "🔓 เปิดรับผู้เล่น" : "🔒 ปิดรับผู้เล่น"}</button><button class="btn btn-ghost" id="close">ปิดห้อง</button></div>
        ${players.length ? html`<div class="players" style="margin-top:14px">${players.map((p) => html`<span class="player-chip ${p.team || ""} ${p.connected ? "" : "off"}">${p.name}<button data-kick="${p.id}" aria-label="เชิญ ${p.name} ออก" title="เชิญออก">✕</button></span>`)}</div>` : html`<p class="muted">รอผู้เล่นเข้าร่วม… ให้นักเรียนสแกน QR หรือเปิด ${info.joinBase}/join แล้วใส่ PIN</p>`}</div></div>`.s;
    stage.querySelector("#start").onclick = () => emit("host:start");
    stage.querySelector("#lock").onclick = () => emit("host:lock");
    stage.querySelector("#close").onclick = async () => { if (await confirmBox("ปิดห้องนี้? ผู้เล่นทุกคนจะออกจากห้อง", "ปิดห้อง", true)) { await emit("host:close"); go("/teacher/live"); } };
    stage.querySelectorAll("[data-kick]").forEach((b) => b.onclick = () => emit("host:kick", { playerId: b.dataset.kick }));
  };
  const question = (q, answered = 0, total = 0) => {
    stopTimer();
    stage.innerHTML = html`<div class="card"><div class="row between"><span class="muted">ข้อ ${q.index + 1}/${q.total}</span><span class="timer" id="t">${q.paused ? "⏸ หยุดชั่วคราว" : ""}</span><span class="muted" id="ans">ตอบแล้ว ${answered}/${total}</span></div>
      <div class="live-big">${q.prompt}</div>${q.image ? html`<img class="q-img" src="${q.image}" alt="">` : ""}</div>
      ${q.options ? html`<div class="live-opts" style="margin-top:12px">${q.options.map((o, i) => html`<div class="live-opt c${i % 6}"><span class="sh">${SHAPES[i % 6]}</span>${o}</div>`)}</div>` : html`<div class="card center muted" style="margin-top:12px">${q.type === "numeric" ? "ผู้เล่นพิมพ์คำตอบเป็นตัวเลข" : "ผู้เล่นพิมพ์คำตอบสั้น"}</div>`}
      <div class="row" style="justify-content:center;margin-top:14px"><button class="btn btn-ghost" id="pause">${q.paused ? "▶ ทำต่อ" : "⏸ หยุดชั่วคราว"}</button><button class="btn btn-ghost" id="skip">ข้าม/เฉลยข้อนี้ ⏭</button></div>`.s;
    if (!q.paused) stopTimer = countdown(stage.querySelector("#t"), q.endsAt);
    stage.querySelector("#pause").onclick = () => emit(q.paused ? "host:resume" : "host:pause");
    stage.querySelector("#skip").onclick = () => emit("host:skip");
  };
  let currentQ = null;
  const reveal = (r) => {
    stopTimer();
    const q = currentQ;
    stage.innerHTML = html`<div class="card"><span class="muted">ข้อ ${r.index + 1}/${r.total}</span><div class="live-big">${q?.prompt || ""}</div></div>
      ${q?.options ? html`<div class="live-opts" style="margin-top:12px">${q.options.map((o, i) => html`<div class="live-opt c${i % 6} ${r.correctOptions.includes(i) ? "" : "dim"}"><span class="sh">${SHAPES[i % 6]}</span>${o}<span class="cnt">${r.distribution?.[i] ?? 0} ${r.correctOptions.includes(i) ? "✔" : ""}</span></div>`)}</div>` : ""}
      <p class="center" style="font-size:1.1rem">เฉลย: <b>${r.answer}</b> · ตอบ ${r.answered} คน</p>${r.explain ? html`<p class="center muted">💡 ${r.explain}</p>` : ""}
      ${teamsHtml(r.teams)}<div class="card">${leaderboardHtml(r.leaderboard.slice(0, 10))}</div>
      <div class="row" style="justify-content:center;margin-top:14px"><button class="btn btn-lg" id="next">${r.last ? "🏁 ดูผลสุดท้าย" : "ข้อถัดไป ▶"}</button></div>`.s;
    stage.querySelector("#next").onclick = () => emit("host:next");
  };
  const end = (r) => {
    stopTimer();
    const lb = r.leaderboard;
    const top3 = [lb[1], lb[0], lb[2]];
    stage.innerHTML = html`<h2 class="center">🏆 ผลการแข่งขัน</h2>
      ${lb.length ? html`<div class="podium">${top3.map((p, i) => p ? html`<div class="p"><div><b>${p.name}</b></div><div class="small muted">${p.score.toLocaleString("th-TH")}</div><div class="blk" style="height:${[90, 130, 70][i]}px">${p.rank}</div></div>` : "")}</div>` : ""}
      ${teamsHtml(r.teams)}<div class="card">${leaderboardHtml(lb)}</div>
      <div class="row" style="justify-content:center;margin-top:14px"><a class="btn" href="/api/live/${r.id}/results.csv" download>⬇ ส่งออก CSV</a><a class="btn btn-ghost" href="/teacher/live">จัดห้องใหม่</a></div>`.s;
    confetti();
  };

  s.on("connect", async () => {
    const r = await emit("host:attach", { pin: params.pin });
    if (r.error) { stage.innerHTML = html`<div class="card">${r.error}</div>`.s; return; }
    if (r.status === "lobby") lobby(r.players, r.locked);
    else if (r.question) { currentQ = r.question; question(r.question, r.answered, r.players.length); }
    else if (r.status === "ended") end({ leaderboard: r.leaderboard, teams: r.teams, id: info.id });
    main.querySelector("#pc").textContent = `ผู้เล่น ${r.players.length}`;
  });
  let lastPlayers = [];
  s.on("room:lobby", (d) => { lastPlayers = d.players; main.querySelector("#pc").textContent = `ผู้เล่น ${d.players.length}`; if (d.status === "lobby") lobby(d.players, d.locked); });
  s.on("q:start", (q) => { currentQ = q; question(q, 0, lastPlayers.length); });
  s.on("q:progress", (p) => { const el = stage.querySelector("#ans"); if (el) el.textContent = `ตอบแล้ว ${p.answered}/${p.total}`; });
  s.on("room:paused", () => { if (currentQ) { currentQ.paused = true; question(currentQ, 0, lastPlayers.length); } });
  s.on("room:resumed", (d) => { if (currentQ) { currentQ.paused = false; currentQ.endsAt = d.endsAt; question(currentQ, 0, lastPlayers.length); } });
  s.on("q:reveal", reveal);
  s.on("room:end", end);
}

// ---------- เข้าร่วมด้วย PIN ----------
export function joinPage({ main, query }) {
  const pin = (query.get("pin") || "").replace(/\D/g, "").slice(0, 6);
  main.innerHTML = html`<div class="narrower"><div class="card center"><h1>เข้าร่วมเกม</h1>
    <form id="jf"><label for="pin" class="sr-only">PIN 6 หลัก</label><input id="pin" class="pin-input" inputmode="numeric" maxlength="6" placeholder="ใส่ PIN 6 หลัก" value="${pin}" autocomplete="off">
    <p class="err" id="err" role="alert"></p><button class="btn btn-block btn-lg" id="go" ${pin.length === 6 ? "" : raw("disabled")}>ไป</button></form></div></div>`.s;
  const input = main.querySelector("#pin"), btn = main.querySelector("#go");
  input.oninput = () => { input.value = input.value.replace(/\D/g, "").slice(0, 6); btn.disabled = input.value.length !== 6; };
  main.querySelector("#jf").onsubmit = async (e) => {
    e.preventDefault();
    try { await api(`/api/live/room/${input.value}`); go(`/play/${input.value}`); }
    catch (err) { main.querySelector("#err").textContent = err.message; }
  };
  input.focus();
}

// ---------- ผู้เล่น ----------
export async function playerPage({ main, params }) {
  const pin = params.pin;
  const info = await api(`/api/live/room/${pin}`).catch(() => null);
  if (!info) { main.innerHTML = html`<div class="narrower card center"><p>ไม่พบห้องนี้ หรือห้องปิดไปแล้ว</p><a class="btn" href="/join">ใส่ PIN ใหม่</a></div>`.s; return; }
  const key = `live:${pin}`;
  let me = null, answeredIdx = -1;
  try { me = JSON.parse(sessionStorage.getItem(key) || "null"); } catch { /* ignore */ }
  const s = sock();
  let stopTimer = () => {};
  onLeave(() => { stopTimer(); s.disconnect(); });
  const shell = (body) => {
    main.innerHTML = html`<div class="narrow" style="max-width:640px"><div class="card row between" style="padding:10px 16px"><span>👤 ${me?.name || ""}${me?.team ? html` <span class="badge" style="background:${me.team === "red" ? "#c62f45" : "#1d5fd6"};color:#fff">${me.team === "red" ? "ทีมแดง" : "ทีมน้ำเงิน"}</span>` : ""}</span>
      <span><b id="score">${(me?.score || 0).toLocaleString("th-TH")}</b> คะแนน${me?.rank ? html` · #${me.rank}` : ""}</span></div><div id="pstage" style="margin-top:14px">${body}</div></div>`.s;
    return main.querySelector("#pstage");
  };
  const save = () => sessionStorage.setItem(key, JSON.stringify(me));
  const emit = (ev, d = {}) => new Promise((res) => s.emit(ev, d, res));

  const askName = (msg = "") => {
    main.innerHTML = html`<div class="narrower"><div class="card"><h1 class="center" style="font-size:1.3rem">เข้าร่วมห้อง ${pin}</h1><p class="center muted small">${info.title}</p>
      <form id="nf">${state.me ? html`<p class="small muted">เข้าร่วมในชื่อ <b>${state.me.displayName}</b> หรือตั้งชื่อเล่นใหม่</p>` : ""}
        <label for="nick">ชื่อเล่น</label><input id="nick" maxlength="20" value="${state.me?.displayName || ""}" required autocomplete="off">
        <p class="err" role="alert">${msg}</p><button class="btn btn-block btn-lg">เข้าร่วม</button></form></div></div>`.s;
    const f = main.querySelector("#nf");
    f.onsubmit = async (e) => {
      e.preventDefault();
      const b = f.querySelector("button"); busy(b, true, "กำลังเข้าร่วม…");
      const r = await emit("player:join", { pin, nickname: f.nick.value });
      if (r.error) { if (r.needLogin) return go(`/login?next=/play/${pin}`); busy(b, false); f.querySelector(".err").textContent = r.error; return; }
      me = { token: r.token, name: r.name, team: r.team, score: 0 }; save();
      waiting();
    };
    f.nick.focus();
  };
  const waiting = (count) => shell(html`<div class="card center" style="padding:30px"><div style="font-size:2.6rem">🎉</div><h2 style="margin:.2em 0">คุณอยู่ในห้องแล้ว</h2><p class="muted" id="wc">รอครูเริ่มเกม…${count ? ` (${count} คน)` : ""}</p></div>`);
  const question = (q, answered) => {
    stopTimer();
    const st = shell(html`<div class="row between muted small"><span>ข้อ ${q.index + 1}/${q.total}</span><span class="timer" id="t">${q.paused ? "⏸" : ""}</span></div>
      <div class="card center" style="margin:10px 0"><div class="live-big" style="margin:0">${q.prompt}</div>${q.image ? html`<img class="q-img" src="${q.image}" alt="" style="margin-top:10px">` : ""}</div><div id="ansbox"></div>`);
    if (!q.paused) stopTimer = countdown(st.querySelector("#t"), q.endsAt);
    const box = st.querySelector("#ansbox");
    const sent = () => { box.innerHTML = html`<div class="card center" style="padding:24px">✅ ส่งคำตอบแล้ว รอผล…</div>`.s; };
    if (answered) return sent();
    if (q.paused) { box.innerHTML = html`<div class="card center muted">⏸ ครูหยุดเกมชั่วคราว</div>`.s; return; }
    const submit = async (answer) => {
      box.querySelectorAll("button,input").forEach((x) => x.disabled = true);
      const r = await emit("player:answer", { answer });
      if (r.error) { toast(r.error, "bad"); box.querySelectorAll("button,input").forEach((x) => x.disabled = false); return; }
      answeredIdx = q.index;
      sent(); // ยังไม่รู้ผล/คะแนน จนกว่าครูจะเฉลย
    };
    if (q.type === "mcq" || q.type === "truefalse") {
      box.innerHTML = html`<div class="live-opts">${q.options.map((o, i) => html`<button class="live-opt c${i % 6}" data-i="${i}"><span class="sh">${SHAPES[i % 6]}</span>${o}</button>`)}</div>`.s;
      box.querySelectorAll("[data-i]").forEach((b) => b.onclick = () => submit(q.type === "truefalse" ? +b.dataset.i === 0 : +b.dataset.i));
    } else if (q.type === "multi") {
      const picked = new Set();
      box.innerHTML = html`<p class="small muted center">เลือกได้หลายข้อ แล้วกดส่ง</p><div class="live-opts">${q.options.map((o, i) => html`<button class="live-opt c${i % 6}" data-i="${i}" aria-pressed="false"><span class="sh">${SHAPES[i % 6]}</span>${o}</button>`)}</div>
        <button class="btn btn-block btn-lg" id="send" style="margin-top:12px" disabled>ส่งคำตอบ</button>`.s;
      box.querySelectorAll("[data-i]").forEach((b) => b.onclick = () => { const i = +b.dataset.i; picked.has(i) ? picked.delete(i) : picked.add(i); b.classList.toggle("sel", picked.has(i)); b.setAttribute("aria-pressed", picked.has(i)); box.querySelector("#send").disabled = !picked.size; });
      box.querySelector("#send").onclick = () => submit([...picked]);
    } else {
      box.innerHTML = html`<form class="row" id="sf"><input id="sa" ${q.type === "numeric" ? raw('inputmode="decimal"') : ""} placeholder="${q.type === "numeric" ? "ตอบเป็นตัวเลข" : "พิมพ์คำตอบ"}" style="flex:1" autocomplete="off" aria-label="คำตอบ" required>${q.unit ? html`<span class="muted">${q.unit}</span>` : ""}<button class="btn">ส่ง</button></form>`.s;
      box.querySelector("#sf").onsubmit = (e) => { e.preventDefault(); const v = box.querySelector("#sa").value.trim(); if (v) submit(v); };
      box.querySelector("#sa").focus();
    }
  };
  const reveal = (r) => {
    stopTimer();
    me.score = r.you.score; me.rank = r.you.rank; save();
    const y = r.you;
    playSound(y.correct ? "correct" : "wrong");
    shell(html`<div class="card center" style="padding:24px"><div style="font-size:3rem">${y.correct ? "✅" : y.answered ? "❌" : "⌛"}</div>
      <h2 style="margin:.2em 0">${y.correct ? `ถูกต้อง! +${y.gained.toLocaleString("th-TH")}` : y.answered ? "ยังไม่ถูก" : "ไม่ได้ตอบทันเวลา"}</h2><p class="muted">เฉลย: ${r.answer}</p></div>
      ${teamsHtml(r.teams)}${r.leaderboard ? html`<div class="card" style="margin-top:12px">${leaderboardHtml(r.leaderboard)}</div>` : ""}<p class="center muted small">รอครูไปข้อถัดไป…</p>`);
  };
  const end = (r) => {
    stopTimer();
    me.score = r.you.score; me.rank = r.you.rank; save();
    if (r.you.rank && r.you.rank <= 3) confetti();
    playSound("win");
    shell(html`<div class="card center" style="padding:24px"><div style="font-size:3rem">🏁</div><h2 style="margin:.2em 0">จบเกม</h2>
      <p style="font-size:1.2rem">คุณได้ ${r.you.score.toLocaleString("th-TH")} คะแนน${r.you.rank ? ` · อันดับ ${r.you.rank}` : ""}</p></div>
      ${teamsHtml(r.teams)}${r.leaderboard ? html`<div class="card" style="margin-top:12px">${leaderboardHtml(r.leaderboard)}</div>` : ""}
      <a class="btn btn-ghost btn-block" href="/join" style="margin-top:12px">เล่นห้องอื่น</a>`);
    sessionStorage.removeItem(key);
  };

  s.on("connect", async () => {
    if (!me?.token) return askName();
    const r = await emit("player:join", { pin, token: me.token });
    if (r.error) { sessionStorage.removeItem(key); me = null; return askName(r.error); }
    me = { ...me, name: r.name, team: r.team, score: r.score }; save();
    if (r.question) { if (r.answered) answeredIdx = r.question.index; question(r.question, r.answered); } else waiting();
  });
  s.on("room:lobby", (d) => { const el = main.querySelector("#wc"); if (el) el.textContent = `รอครูเริ่มเกม… (${d.players.length} คน)`; });
  s.on("q:start", (q) => question(q, false));
  s.on("room:paused", () => { const b = main.querySelector("#ansbox"); stopTimer(); const t = main.querySelector("#t"); if (t) t.textContent = "⏸"; if (b && !b.textContent.includes("ส่งคำตอบแล้ว")) b.innerHTML = html`<div class="card center muted">⏸ ครูหยุดเกมชั่วคราว</div>`.s; });
  s.on("room:resumed", (q) => question(q, answeredIdx === q.index));
  s.on("q:reveal", reveal);
  s.on("room:end", end);
  s.on("room:kicked", () => { sessionStorage.removeItem(key); main.innerHTML = html`<div class="narrower card center"><p>ครูเชิญคุณออกจากห้อง</p><a class="btn" href="/join">กลับ</a></div>`.s; s.disconnect(); });
  s.on("room:closed", () => { sessionStorage.removeItem(key); main.innerHTML = html`<div class="narrower card center"><p>ครูปิดห้องแล้ว</p><a class="btn" href="/join">กลับ</a></div>`.s; s.disconnect(); });
}
