// หน้าสาธารณะ: หน้าแรก คลังเกม เล่นเกม แบบทดสอบ เข้าสู่ระบบ/สมัคร นโยบาย 404
import { api, html, raw, state, toast, fmtDate, DIFF, formData, busy, confetti, confirmBox } from "../core.js";
import { go, refreshMe, homeFor, onLeave } from "../app.js";
import { startGame } from "../game.js";
import { renderQuestion, bindQuestions, readAnswers, countUnanswered } from "../quizform.js";

const TPL_IC = { truefalse: "⚖️", match: "🃏", order: "🔢", scramble: "🔤", mcq: "🎯" };

export function gameCard(g) {
  return html`<a class="game-card" href="/games/${g.id}">
    <span class="ic" aria-hidden="true">${g.category?.icon || TPL_IC[g.template]}</span>
    <span class="meta">${g.category ? g.category.name + " · " : ""}${g.templateName} · ${DIFF[g.difficulty]}</span>
    <h3>${g.title}</h3><p>${g.description}</p>
    <span class="meta">อายุ ${g.ageMin}–${g.ageMax} ปี · ${g.questionCount} ${g.template === "match" ? "คู่" : "ข้อ"} · เล่นแล้ว ${g.plays} ครั้ง</span></a>`;
}

export async function home({ main }) {
  const [{ games, count }, { categories }] = await Promise.all([api("/api/games/featured"), api("/api/categories")]);
  main.innerHTML = html`
    <section class="hero"><h1>เรียนสนุก เล่นได้จริง</h1>
      <p>มีเกมให้เล่น ${count} เกม ครอบคลุมทุกวิชา ลองเล่นได้ทันทีโดยไม่ต้องสมัคร ครูสร้างเกม มอบหมายงาน และจัดแข่งสดในห้องเรียนได้</p>
      <div class="row" style="margin-top:16px"><a class="btn btn-lg" href="/games">🎮 ดูคลังเกม</a><a class="btn btn-lg btn-ghost" href="/join">⚡ เข้าร่วมด้วย PIN</a></div>
      <div class="hero-art" aria-hidden="true"><span>🚀</span></div></section>
    <div class="features">
      <div class="feature"><div class="ic">🎯</div><b>เกม 5 แบบ</b><div class="small muted">ถูก/ผิด ปรนัย เรียงลำดับ เรียงคำ และพลิกการ์ดจับคู่</div></div>
      <div class="feature"><div class="ic">📝</div><b>คำถาม 10 ชนิด</b><div class="small muted">รวมเลือกหลายข้อ ตอบเป็นตัวเลข และเติมคำจากคลังคำ</div></div>
      <div class="feature"><div class="ic">⚡</div><b>แข่งสดในห้องเรียน</b><div class="small muted">สแกน QR เข้าร่วมจากมือถือ เห็นอันดับแบบเรียลไทม์</div></div>
      <div class="feature"><div class="ic">🏅</div><b>สะสม XP และเหรียญ</b><div class="small muted">เล่นต่อเนื่อง ได้คะแนนเต็ม ปลดล็อกเหรียญรางวัล</div></div>
    </div>
    <h2>เลือกตามวิชา</h2>
    <div class="chips">${categories.map((c) => html`<a class="chip" href="/games?category=${c.slug}" style="text-decoration:none">${c.icon} ${c.name}</a>`)}</div>
    <h2>เกมยอดนิยม</h2><div class="grid">${games.map(gameCard)}</div>
    <p class="center" style="margin-top:20px"><a class="btn btn-ghost" href="/games">ดูเกมทั้งหมด →</a></p>`.s;
}

export async function library({ main, query }) {
  const { categories } = await api("/api/categories");
  const f = { q: query.get("q") || "", category: query.get("category") || "", difficulty: query.get("difficulty") || "", age: query.get("age") || "", sort: query.get("sort") || "new", page: query.get("page") || "1" };
  const data = await api("/api/games?" + new URLSearchParams(f));
  const sel = (v, cur) => (v === cur ? raw("selected") : "");
  main.innerHTML = html`<h1>คลังเกม</h1>
    <form class="card filters" id="ff" role="search">
      <div class="grow"><label for="f-q" class="sr-only">ค้นหา</label><input id="f-q" name="q" value="${f.q}" placeholder="ค้นหาชื่อเกม…"></div>
      <div><label for="f-c" class="sr-only">หมวด</label><select id="f-c" name="category"><option value="">ทุกหมวด</option>${categories.map((c) => html`<option value="${c.slug}" ${sel(c.slug, f.category)}>${c.icon} ${c.name}</option>`)}</select></div>
      <div><label for="f-d" class="sr-only">ระดับ</label><select id="f-d" name="difficulty"><option value="">ทุกระดับ</option>${Object.entries(DIFF).map(([k, v]) => html`<option value="${k}" ${sel(k, f.difficulty)}>${v}</option>`)}</select></div>
      <div><label for="f-a" class="sr-only">อายุ</label><input id="f-a" name="age" type="number" min="1" max="99" value="${f.age}" placeholder="อายุ (ปี)"></div>
      <div><label for="f-s" class="sr-only">เรียงตาม</label><select id="f-s" name="sort"><option value="new" ${sel("new", f.sort)}>ใหม่ล่าสุด</option><option value="popular" ${sel("popular", f.sort)}>ยอดนิยม</option><option value="title" ${sel("title", f.sort)}>ชื่อ ก–ฮ</option></select></div>
      <button class="btn">ค้นหา</button></form>
    <p class="muted small" style="margin:14px 0 8px">พบ ${data.total} เกม</p>
    ${data.games.length ? html`<div class="grid">${data.games.map(gameCard)}</div>` : html`<div class="empty">ไม่พบเกมที่ตรงกับเงื่อนไข ลองล้างตัวกรอง</div>`}
    ${data.pages > 1 ? html`<nav class="pager" aria-label="หน้า">${+f.page > 1 ? html`<a class="btn btn-ghost btn-sm" href="/games?${new URLSearchParams({ ...f, page: +f.page - 1 })}">← ก่อนหน้า</a>` : ""}
      <span class="muted">หน้า ${data.page}/${data.pages}</span>${+f.page < data.pages ? html`<a class="btn btn-ghost btn-sm" href="/games?${new URLSearchParams({ ...f, page: +f.page + 1 })}">ถัดไป →</a>` : ""}</nav>` : ""}`.s;
  const form = main.querySelector("#ff");
  form.onsubmit = (e) => { e.preventDefault(); const d = formData(form); Object.keys(d).forEach((k) => !d[k] && delete d[k]); go("/games?" + new URLSearchParams(d)); };
  form.querySelectorAll("select").forEach((s) => s.onchange = () => form.requestSubmit());
}

export async function playGame({ main, params, query }) {
  const load = async () => {
    const data = await api(`/api/games/${params.id}/play`);
    const aid = query.get("assignment");
    const stop = startGame(main, data, {
      assignmentId: aid, restart: load,
      backHref: aid ? `/classes/${query.get("class") || ""}` : data.preview ? "/teacher/games" : "/games",
      backText: aid ? "กลับห้องเรียน" : data.preview ? "กลับเกมของฉัน" : "กลับคลังเกม",
    });
    onLeave(stop);
  };
  await load();
}

export async function quizList({ main, query }) {
  const q = query.get("q") || "", page = query.get("page") || "1";
  const d = await api("/api/quizzes?" + new URLSearchParams({ q, page }));
  main.innerHTML = html`<h1>แบบทดสอบ</h1>
    <form class="row" id="qf" role="search"><input name="q" value="${q}" placeholder="ค้นหาแบบทดสอบ…" style="flex:1" aria-label="ค้นหาแบบทดสอบ"><button class="btn">ค้นหา</button></form>
    <div class="grid" style="margin-top:16px">${d.quizzes.map((x) => html`<a class="game-card" href="/quizzes/${x.id}"><span class="ic">📝</span>
      <span class="meta">${x.grade || "ทุกระดับ"} · ${DIFF[x.difficulty]}</span><h3>${x.title}</h3><p>${x.description}</p>
      <span class="meta">${x.questionCount} ข้อ · ${x.totalPoints} คะแนน${x.timeLimitMin ? ` · ${x.timeLimitMin} นาที` : ""}</span></a>`)}</div>
    ${!d.quizzes.length ? html`<div class="empty">ไม่พบแบบทดสอบ</div>` : ""}
    ${d.pages > 1 ? html`<p class="pager"><span class="muted">หน้า ${d.page}/${d.pages}</span></p>` : ""}`.s;
  main.querySelector("#qf").onsubmit = (e) => { e.preventDefault(); go("/quizzes?q=" + encodeURIComponent(e.target.q.value)); };
}

export async function quizPage({ main, params, query }) {
  const info = await api(`/api/quizzes/${params.id}`);
  const z = info.quiz;
  const aid = query.get("assignment");
  const head = html`<h1>${z.title}</h1><p class="muted" style="margin-top:-.3em">${z.description}</p>
    <p class="small muted">${z.questionCount} ข้อ · ${z.totalPoints} คะแนน${z.timeLimitMin ? ` · เวลา ${z.timeLimitMin} นาที` : ""}${z.hasEssay ? " · มีข้ออัตนัยที่ครูตรวจเอง" : ""}</p>`;
  if (!state.me) {
    main.innerHTML = html`<div class="narrow">${head}<div class="card center"><p>เข้าสู่ระบบเพื่อทำแบบทดสอบและบันทึกคะแนน</p><a class="btn" href="/login?next=${encodeURIComponent(location.pathname + location.search)}">เข้าสู่ระบบ</a> <a class="btn btn-ghost" href="/register">สมัครสมาชิก</a></div></div>`.s;
    return;
  }
  if (!info.canTake) { main.innerHTML = html`<div class="narrow">${head}<div class="card">แบบทดสอบนี้ยังไม่เปิดให้ทำ</div></div>`.s; return; }
  main.innerHTML = html`<div class="narrow">${head}
    ${info.lastAttempt ? html`<div class="info small">ทำล่าสุดเมื่อ ${fmtDate(info.lastAttempt.submitted_at)} ได้ ${info.lastAttempt.score}/${info.lastAttempt.max_score} — <a href="/attempts/${info.lastAttempt.id}">ดูผล</a></div>` : ""}
    <button class="btn btn-lg btn-block" id="start">▶ เริ่มทำแบบทดสอบ</button></div>`.s;
  main.querySelector("#start").onclick = async () => {
    const d = await api(`/api/quizzes/${params.id}?start=1`);
    const started = new Date().toISOString();
    let timer = null;
    main.innerHTML = html`<div class="narrow">${head}
      ${z.timeLimitMin ? html`<div class="row end" style="position:sticky;top:70px;z-index:4"><span class="timer" id="qt">⏱</span></div>` : ""}
      <form id="qform" novalidate>${d.questions.map((q, i) => renderQuestion(q, i + 1))}
      <div class="sticky-bar"><span class="muted small" id="left"></span><button class="btn btn-lg" style="margin-left:auto">ส่งคำตอบ</button></div></form></div>`.s;
    const form = main.querySelector("#qform");
    bindQuestions(form);
    const submit = async (auto) => {
      const answers = readAnswers(form);
      const n = countUnanswered(answers);
      if (!auto && n && !(await confirmBox(`ยังไม่ได้ตอบ ${n} ข้อ ต้องการส่งเลยหรือไม่?`, "ส่งคำตอบ"))) return;
      clearInterval(timer);
      const btn = form.querySelector(".sticky-bar .btn");
      busy(btn, true, "กำลังส่ง…");
      try {
        const r = await api(`/api/quizzes/${params.id}/submit`, { body: { answers, assignmentId: aid, startedAt: started } });
        sessionStorage.setItem("lastQuizResult", JSON.stringify({ xp: r.xp, coins: r.coins, newBadges: r.newBadges }));
        refreshMe().catch(() => {});
        go(`/attempts/${r.attempt.id}${aid ? `?class=${query.get("class") || ""}` : ""}`, true);
      } catch (e) { toast(e.message, "bad"); busy(btn, false); }
    };
    form.onsubmit = (e) => { e.preventDefault(); submit(false); };
    if (z.timeLimitMin) {
      const end = Date.now() + z.timeLimitMin * 60000;
      const el = main.querySelector("#qt");
      const t = () => { const s = Math.max(0, Math.ceil((end - Date.now()) / 1000)); el.textContent = `⏱ ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; el.classList.toggle("low", s < 60); if (!s) { toast("หมดเวลา ระบบส่งคำตอบให้อัตโนมัติ", "bad"); submit(true); } };
      t(); timer = setInterval(t, 500);
      onLeave(() => clearInterval(timer));
    }
  };
}

export async function attemptPage({ main, params, query }) {
  const { attempt: a } = await api(`/api/quizzes/attempt/${params.id}`);
  let extra = null;
  try { extra = JSON.parse(sessionStorage.getItem("lastQuizResult") || "null"); sessionStorage.removeItem("lastQuizResult"); } catch { /* ignore */ }
  const pending = a.status === "pending_review";
  if (!pending && a.score >= a.max && extra) confetti();
  const cls = (r) => (!r || r.correct === null ? "wait" : r.correct ? "ok" : "no");
  main.innerHTML = html`<div class="narrow">
    <div class="card center"><h1 style="font-size:1.2rem">${a.quizTitle}</h1>${a.student && state.me?.role !== "student" ? html`<p class="muted">${a.student}</p>` : ""}
      <p class="result-big">${a.score} / ${a.max}</p>
      <p class="muted">${pending ? "⏳ มีข้ออัตนัยที่รอครูตรวจ คะแนนอาจเพิ่มขึ้น" : "ตรวจครบทุกข้อแล้ว"} · ส่งเมื่อ ${fmtDate(a.submittedAt)}</p>
      ${extra ? html`<p class="small">+${extra.xp} XP · +${extra.coins ?? extra.xp} 🪙</p>${extra.newBadges.map((b) => html`<div class="new-badge" style="justify-content:center"><span class="ic">${b.icon}</span><b>ได้รับเหรียญใหม่: ${b.name}</b></div>`)}` : ""}</div>
    ${a.items.map((it, i) => html`<div class="qcard res-item ${cls(it.result)}" style="margin-top:12px">
      <div class="qh"><b>ข้อ ${i + 1}. ${it.prompt}</b><span>${!it.result || it.result.correct === null ? "⏳" : it.result.correct ? "✅" : "❌"} ${it.result?.points ?? 0}/${it.points}</span></div>
      <div class="small" style="margin-top:6px">คำตอบ: ${it.given}</div>
      ${it.answer ? html`<div class="small muted">เฉลย: ${it.answer}</div>` : ""}
      ${it.explain ? html`<div class="small muted">💡 ${it.explain}</div>` : ""}
      ${it.result?.comment ? html`<div class="small info">💬 ครู: ${it.result.comment}</div>` : ""}</div>`)}
    <div class="row" style="justify-content:center;margin-top:18px">${query.get("class") ? html`<a class="btn" href="/classes/${query.get("class")}">กลับห้องเรียน</a>` : ""}
      <a class="btn btn-ghost" href="/quizzes">แบบทดสอบอื่น</a><a class="btn btn-ghost" href="/quizzes/${a.quizId}">ทำอีกครั้ง</a></div></div>`.s;
}

// ---------- บัญชี ----------
function authShell(main, title, body) {
  main.innerHTML = html`<div class="narrower"><h1 class="center">${title}</h1><div class="card">${body}</div></div>`.s;
}
export function login({ main, query }) {
  if (state.me) return go(homeFor(state.me), true);
  authShell(main, "เข้าสู่ระบบ", html`<form id="f"><label for="e">อีเมล</label><input id="e" name="email" type="email" autocomplete="username" required>
    <label for="p">รหัสผ่าน</label><input id="p" name="password" type="password" autocomplete="current-password" required>
    <p class="err" id="err" role="alert"></p><button class="btn btn-block">เข้าสู่ระบบ</button></form>
    <p class="center small" style="margin-bottom:0"><a href="/register${query.get("next") ? `?next=${encodeURIComponent(query.get("next"))}` : ""}">สมัครสมาชิก</a> · <a href="/forgot">ลืมรหัสผ่าน</a></p>`);
  const f = main.querySelector("#f");
  f.onsubmit = async (e) => {
    e.preventDefault();
    const b = f.querySelector("button"); busy(b, true, "กำลังเข้าสู่ระบบ…");
    try {
      await api("/api/auth/login", { body: formData(f) });
      await refreshMe();
      toast(`ยินดีต้อนรับ ${state.me.displayName}`);
      const next = query.get("next");
      go(next && next.startsWith("/") && !next.startsWith("//") ? next : homeFor(state.me), true);
    } catch (err) { main.querySelector("#err").textContent = err.message; busy(b, false); }
  };
}
export function register({ main, query }) {
  if (state.me) return go(homeFor(state.me), true);
  authShell(main, "สมัครสมาชิก", html`<form id="f"><label for="n">ชื่อที่แสดง <span class="muted small">(ไม่ต้องใช้ชื่อจริง)</span></label><input id="n" name="displayName" required maxlength="60">
    <label for="e">อีเมล</label><input id="e" name="email" type="email" autocomplete="username" required>
    <label for="p">รหัสผ่าน <span class="muted small">(อย่างน้อย 8 ตัว)</span></label><input id="p" name="password" type="password" minlength="8" autocomplete="new-password" required>
    <label for="r">ฉันเป็น</label><select id="r" name="role"><option value="student">นักเรียน</option><option value="teacher">ครู</option></select>
    <p class="small muted">การสมัครถือว่ายอมรับ <a href="/privacy">นโยบายความเป็นส่วนตัว</a> นักเรียนอายุต่ำกว่าเกณฑ์ควรได้รับความยินยอมจากผู้ปกครอง</p>
    <p class="err" id="err" role="alert"></p><button class="btn btn-block">สมัครสมาชิก</button></form>
    <p class="center small" style="margin-bottom:0"><a href="/login">มีบัญชีแล้ว? เข้าสู่ระบบ</a></p>`);
  const f = main.querySelector("#f");
  f.onsubmit = async (e) => {
    e.preventDefault();
    const b = f.querySelector("button"); busy(b, true, "กำลังสมัคร…");
    try {
      await api("/api/auth/register", { body: formData(f) });
      await refreshMe();
      toast("สมัครสมาชิกสำเร็จ 🎉");
      const next = query.get("next");
      go(next && next.startsWith("/") ? next : homeFor(state.me), true);
    } catch (err) { main.querySelector("#err").textContent = err.message; busy(b, false); }
  };
}
export function forgot({ main }) {
  authShell(main, "ลืมรหัสผ่าน", html`<form id="f"><label for="e">อีเมล</label><input id="e" name="email" type="email" required>
    <div id="msg" role="status"></div><button class="btn btn-block">ขอตั้งรหัสผ่านใหม่</button></form>
    <p class="center small" style="margin-bottom:0"><a href="/login">กลับไปหน้าเข้าสู่ระบบ</a></p>`);
  const f = main.querySelector("#f");
  f.onsubmit = async (e) => {
    e.preventDefault();
    const r = await api("/api/auth/forgot", { body: formData(f) });
    main.querySelector("#msg").innerHTML = html`<div class="note small">${r.message}</div>`.s;
  };
}

export function privacy({ main }) {
  main.innerHTML = html`<article class="prose"><h1>นโยบายความเป็นส่วนตัว</h1>
    <div class="note small">⚠️ ฉบับร่างสำหรับผู้ติดตั้งระบบ: อธิบายสิ่งที่ซอฟต์แวร์นี้ทำจริง ผู้ให้บริการควรให้ที่ปรึกษากฎหมายตรวจสอบ (เช่น PDPA และความยินยอมจากผู้ปกครองสำหรับเด็ก) และใส่ข้อมูลผู้ควบคุมข้อมูลก่อนเปิดใช้งานจริง</div>
    <h2>ข้อมูลที่เราเก็บ</h2><ul>
      <li>อีเมลและรหัสผ่าน (เก็บเฉพาะค่าแฮช ไม่เก็บรหัสผ่านจริง) เพื่อเข้าสู่ระบบ</li>
      <li>ชื่อที่แสดง (ตั้งเองได้ ไม่ต้องใช้ชื่อจริง) และระดับชั้น (ไม่บังคับ)</li>
      <li>ผลการเล่นเกม ผลแบบทดสอบ คำตอบ คะแนน XP เหรียญรางวัล และประวัติกิจกรรม</li>
      <li>การเป็นสมาชิกห้องเรียนและผลงานที่ได้รับมอบหมาย</li>
      <li>ผู้เล่นแข่งสดที่ไม่สมัครสมาชิก: เก็บเฉพาะชื่อเล่นที่ตั้งและคะแนนในห้องนั้น</li>
      <li>คุกกี้เพื่อการเข้าสู่ระบบเท่านั้น และการตั้งค่าธีมในเบราว์เซอร์ (ไม่มีคุกกี้โฆษณาหรือติดตามพฤติกรรม)</li></ul>
    <h2>ข้อมูลที่เราไม่เก็บ</h2><p>ชื่อจริง เบอร์โทร ที่อยู่ รูปภาพบุคคล หรือตำแหน่งที่ตั้ง ไม่มีโฆษณาหรือการวิเคราะห์ด้วยบริการภายนอก (ยกเว้นฟีเจอร์ AI ด้านล่าง ถ้าเปิดใช้)</p>
    <h2>ฟีเจอร์ AI ช่วยสร้างเนื้อหา (เฉพาะเมื่อผู้ให้บริการเปิดใช้)</h2><p>เมื่อครูใช้ “AI ช่วยสร้าง” ข้อความที่ครูพิมพ์ (หัวข้อ ระดับชั้น ความยาก จำนวนข้อ) จะถูกส่งไปยังผู้ให้บริการ AI ภายนอก <b>ระบบไม่ส่งข้อมูลนักเรียน คำตอบ คะแนน ชื่อ หรืออีเมลของใครไปยังผู้ให้บริการ AI</b> และไม่เก็บข้อความหัวข้อไว้ (เก็บเพียงจำนวนครั้งที่ใช้) ครูควรหลีกเลี่ยงการพิมพ์ข้อมูลส่วนบุคคลในหัวข้อ</p>
    <h2>ใครเห็นข้อมูลของคุณ</h2><ul>
      <li>ครูเจ้าของห้องเรียนเห็นชื่อที่แสดง อีเมล และคะแนนของนักเรียนในห้องของตน</li>
      <li>เพื่อนในห้องเห็นเพียงชื่อที่แสดงและคะแนนรวมบนอันดับ หากครูเปิดการแสดงอันดับ</li>
      <li>ผู้ดูแลระบบจัดการบัญชีและเนื้อหา และมีบันทึกการดำเนินการ</li>
      <li>เราไม่ขายหรือแบ่งปันข้อมูลของผู้ใช้ให้บุคคลภายนอก</li></ul>
    <h2>การเก็บรักษาและการลบ</h2><p>เก็บไว้จนกว่าคุณจะลบบัญชี ที่ “ตั้งค่า” คุณลบบัญชีได้ด้วยตนเอง ระบบจะลบอีเมล ชื่อ คะแนน ประวัติ เหรียญ และการเป็นสมาชิกห้องเรียนทั้งหมดอย่างถาวร ครูที่ลบบัญชี: ห้องเรียนที่สร้างจะถูกลบ เนื้อหาที่สร้างจะถูกถอดออกจากสาธารณะ</p>
    <h2>เด็กและเยาวชน</h2><p>ระบบออกแบบให้เก็บข้อมูลส่วนบุคคลน้อยที่สุด สถานศึกษาหรือผู้ให้บริการควรดำเนินการขอความยินยอมจากผู้ปกครองตามกฎหมายก่อนให้นักเรียนอายุต่ำกว่าเกณฑ์สมัครใช้งาน</p>
    <h2>ติดต่อ</h2><p class="muted">[ผู้ให้บริการระบุผู้ควบคุมข้อมูลและช่องทางติดต่อที่นี่]</p></article>`.s;
}

export function notFound({ main }) {
  main.innerHTML = html`<div class="card center" style="padding:40px 20px"><div style="font-size:3.5rem" aria-hidden="true">🔭</div><h1>ไม่พบหน้านี้</h1>
    <p class="muted">หน้าที่คุณหาอาจถูกย้าย ลบ หรือพิมพ์ที่อยู่ผิด</p><div class="row" style="justify-content:center"><a class="btn" href="/games">ไปคลังเกม</a><a class="btn btn-ghost" href="/">หน้าแรก</a></div></div>`.s;
  document.title = "ไม่พบหน้านี้ · EduPlay Universe";
}
