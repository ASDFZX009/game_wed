// เครื่องเล่นเกม 5 แบบ: ถูก/ผิด, ปรนัย, เรียงลำดับ, เรียงคำ, จับคู่ (พลิกการ์ด)
import { api, html, raw, esc, toast, confetti, state } from "./core.js";
import { playSound, getPrefs } from "./prefs.js";
import { refreshMe } from "./app.js";

export function startGame(root, data, opts = {}) {
  const { game, questions } = data;
  const answers = [];
  let idx = 0, done = false, timerId = null, endsAt = null, locked = false;

  const finishPayload = { answers, assignmentId: opts.assignmentId || null };

  function header() {
    const total = game.template === "match" ? questions[0].pairs : questions.length;
    return html`<div class="play-head"><span id="g-count">${game.template === "match" ? "" : `ข้อ ${idx + 1}/${total}`}</span>
      ${game.timeLimitSec ? html`<span class="timer" id="g-timer" role="timer" aria-live="off">⏱ --:--</span>` : ""}</div>
      ${game.template !== "match" ? html`<div class="progress" aria-hidden="true"><i style="width:${(idx / total) * 100}%"></i></div>` : ""}`;
  }

  function tick() {
    const el = root.querySelector("#g-timer");
    if (!el || !endsAt) return;
    const s = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    el.textContent = `⏱ ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    el.classList.toggle("low", s <= 10);
    if (s <= 0) { toast("หมดเวลา!", "bad"); finish(); }
  }
  function startTimer() {
    if (!game.timeLimitSec) return;
    endsAt = Date.now() + game.timeLimitSec * 1000;
    timerId = setInterval(tick, 250);
  }
  const stop = () => { clearInterval(timerId); timerId = null; clearTimeout(autoTimer); };

  async function check(answer) {
    return api(`/api/games/${game.id}/check`, { body: { index: idx, answer } });
  }
  function feedbackHtml(r) {
    return html`<div class="feedback ${r.correct ? "ok" : "no"}" role="status">${r.correct ? "✅ ถูกต้อง!" : html`❌ ยังไม่ถูก — เฉลย: ${r.answer}`}
      ${r.explain ? html`<div class="small" style="font-weight:400;margin-top:4px">💡 ${r.explain}</div>` : ""}</div>
      <div class="row end" style="margin-top:12px"><button class="btn" id="g-next">${idx + 1 >= questions.length ? "ดูผลลัพธ์ 🏁" : "ข้อต่อไป ▶"}</button></div>`;
  }
  let autoTimer = null;
  function afterAnswer(card, r) {
    playSound(r.correct ? "correct" : "wrong");
    card.insertAdjacentHTML("beforeend", feedbackHtml(r).s);
    const nb = card.querySelector("#g-next");
    nb.focus();
    const next = () => { clearTimeout(autoTimer); if (done) return; idx++; idx >= questions.length ? finish() : renderQ(); };
    nb.onclick = next;
    if (getPrefs().autoNext) autoTimer = setTimeout(next, r.correct ? 1200 : 2500);
  }
  function hintBtn(q) {
    return q.hint ? html`<button class="linkish small" id="g-hint">💡 ขอใบ้</button>` : "";
  }
  function bindHint(card, q) {
    const b = card.querySelector("#g-hint");
    if (b) b.onclick = () => { b.replaceWith(Object.assign(document.createElement("div"), { className: "info small", textContent: "💡 " + q.hint })); };
  }

  function renderQ() {
    locked = false;
    const q = questions[idx];
    const t = game.template;
    let body;
    if (t === "truefalse") {
      body = html`<div class="tf"><button class="btn btn-lg" data-a="true">✔ ถูก</button><button class="btn btn-lg btn-no" data-a="false">✖ ผิด</button></div>`;
    } else if (t === "mcq") {
      body = html`<div class="opts">${q.options.map((o, i) => html`<button class="opt" data-i="${i}">${o}</button>`)}</div>`;
    } else if (t === "order") {
      body = html`<p class="muted small">กดลูกศรเพื่อสลับลำดับ แล้วกดยืนยัน</p><ol class="order-list" id="g-order"></ol>
        <div class="row" style="margin-top:12px"><button class="btn" id="g-submit">ยืนยันลำดับ</button></div>`;
    } else if (t === "scramble") {
      body = html`<p class="muted small">แตะตัวอักษรตามลำดับ (แตะในช่องคำตอบเพื่อเอาออก) หรือพิมพ์คำตอบ</p>
        <div class="answer-slot" id="g-slot" aria-label="คำตอบของคุณ"></div>
        <div class="tiles" id="g-tiles">${q.tiles.map((c, i) => html`<button class="tile" data-i="${i}">${c}</button>`)}</div>
        <div class="row"><input id="g-type" placeholder="หรือพิมพ์คำตอบที่นี่" aria-label="พิมพ์คำตอบ" style="flex:1;min-width:180px" autocomplete="off" autocapitalize="off" spellcheck="false">
        <button class="btn btn-ghost" id="g-clear">ล้าง</button><button class="btn" id="g-submit">ตอบ</button></div>`;
    }
    root.innerHTML = html`<div class="play">${introHead()}
      <div class="card" id="g-card">${header()}
        <div class="row between">${q.image ? "" : ""}<span></span>${hintBtn(q)}</div>
        ${q.image ? html`<img class="q-img" src="${q.image}" alt="ภาพประกอบโจทย์">` : ""}
        <div class="q-prompt">${q.prompt}</div>${body}</div></div>`.s;
    tick();
    const card = root.querySelector("#g-card");
    bindHint(card, q);

    if (t === "truefalse" || t === "mcq") {
      card.querySelectorAll(t === "mcq" ? ".opt" : ".tf .btn").forEach((b) => b.onclick = async () => {
        if (locked) return; locked = true;
        const a = t === "mcq" ? +b.dataset.i : b.dataset.a === "true";
        answers[idx] = a;
        card.querySelectorAll("button.opt, .tf .btn").forEach((x) => x.disabled = true);
        const r = await check(a).catch((e) => { toast(e.message, "bad"); return null; });
        if (!r) { locked = false; card.querySelectorAll("button.opt, .tf .btn").forEach((x) => x.disabled = false); return; }
        if (t === "mcq") {
          b.classList.add(r.correct ? "right" : "wrong");
          if (!r.correct) card.querySelectorAll(".opt").forEach((x) => { if (x.textContent.trim() === r.answer) x.classList.add("right"); });
        } else b.classList.add("picked");
        afterAnswer(card, r);
      });
    } else if (t === "order") {
      let items = [...q.items];
      const list = card.querySelector("#g-order");
      const draw = () => {
        list.innerHTML = items.map((it, i) => html`<li><span class="n">${i + 1}.</span><span class="t">${it}</span>
          <button class="icon-btn" data-up="${i}" aria-label="เลื่อนขึ้น" ${i === 0 ? raw("disabled") : ""}>↑</button>
          <button class="icon-btn" data-down="${i}" aria-label="เลื่อนลง" ${i === items.length - 1 ? raw("disabled") : ""}>↓</button></li>`.s).join("");
        list.querySelectorAll("[data-up]").forEach((b) => b.onclick = () => { const i = +b.dataset.up; [items[i - 1], items[i]] = [items[i], items[i - 1]]; draw(); list.querySelector(`[data-up="${i - 1}"]`)?.focus(); });
        list.querySelectorAll("[data-down]").forEach((b) => b.onclick = () => { const i = +b.dataset.down; [items[i + 1], items[i]] = [items[i], items[i + 1]]; draw(); list.querySelector(`[data-down="${i + 1}"]`)?.focus(); });
      };
      draw();
      card.querySelector("#g-submit").onclick = async (e) => {
        if (locked) return; locked = true; e.target.disabled = true;
        answers[idx] = items;
        const r = await check(items);
        const correctOrder = r.answer.split(" → ");
        list.querySelectorAll("li").forEach((li, i) => { li.classList.add(items[i] === correctOrder[i] ? "right" : "wrong"); li.querySelectorAll("button").forEach((b) => b.disabled = true); });
        afterAnswer(card, r);
      };
    } else if (t === "scramble") {
      const picked = [];
      const slot = card.querySelector("#g-slot"), tiles = card.querySelector("#g-tiles"), typed = card.querySelector("#g-type");
      const draw = () => {
        slot.innerHTML = picked.length ? picked.map((i, k) => `<button class="tile" data-k="${k}" aria-label="เอาออก ${esc(q.tiles[i])}">${esc(q.tiles[i])}</button>`).join("") : '<span class="muted small" style="padding:0 8px">ยังไม่ได้เลือกตัวอักษร</span>';
        tiles.querySelectorAll(".tile").forEach((b) => b.disabled = picked.includes(+b.dataset.i));
        slot.querySelectorAll("[data-k]").forEach((b) => b.onclick = () => { picked.splice(+b.dataset.k, 1); draw(); });
      };
      tiles.querySelectorAll(".tile").forEach((b) => b.onclick = () => { picked.push(+b.dataset.i); typed.value = ""; draw(); });
      card.querySelector("#g-clear").onclick = () => { picked.length = 0; typed.value = ""; draw(); };
      draw();
      const submit = async () => {
        if (locked) return;
        const a = typed.value.trim() || picked.map((i) => q.tiles[i]).join("");
        if (!a) return toast("ยังไม่ได้ใส่คำตอบ", "bad");
        locked = true;
        answers[idx] = a;
        card.querySelectorAll("button, input").forEach((x) => { if (x.id !== "g-hint") x.disabled = true; });
        afterAnswer(card, await check(a));
      };
      card.querySelector("#g-submit").onclick = submit;
      typed.onkeydown = (e) => { if (e.key === "Enter") submit(); };
    }
  }

  function renderMemory() {
    const { cards, pairs } = questions[0];
    let open = [], moves = 0, found = 0, busy = false;
    const doneSet = new Set();
    root.innerHTML = html`<div class="play">${introHead()}<div class="card" id="g-card">${header()}
      <div class="row between" style="margin-bottom:10px"><span class="muted" id="m-moves">พลิกแล้ว 0 ครั้ง</span><span class="muted" id="m-found">จับคู่ได้ 0/${pairs}</span></div>
      <div class="memory">${cards.map((c, i) => html`<button class="mcard" data-i="${i}" aria-label="การ์ดใบที่ ${i + 1}"><span class="in"><span class="f">?</span><span class="b">${c.text}</span></span></button>`)}</div></div></div>`.s;
    tick();
    const els = [...root.querySelectorAll(".mcard")];
    els.forEach((el) => el.onclick = () => {
      const i = +el.dataset.i;
      if (busy || doneSet.has(i) || open.includes(i)) return;
      el.classList.add("up"); el.setAttribute("aria-label", cards[i].text); playSound("flip");
      open.push(i);
      if (open.length === 2) {
        moves++;
        root.querySelector("#m-moves").textContent = `พลิกแล้ว ${moves} ครั้ง`;
        const [a, b] = open;
        if (cards[a].pair === cards[b].pair) {
          [a, b].forEach((k) => { doneSet.add(k); els[k].classList.add("done"); els[k].disabled = true; });
          found++; open = []; playSound("correct");
          root.querySelector("#m-found").textContent = `จับคู่ได้ ${found}/${pairs}`;
          if (found === pairs) setTimeout(() => finish({ moves, completed: true }), 500);
        } else {
          busy = true;
          setTimeout(() => { [a, b].forEach((k) => { els[k].classList.remove("up"); els[k].setAttribute("aria-label", `การ์ดใบที่ ${k + 1}`); }); open = []; busy = false; }, 850);
        }
      }
    });
    finishPayload.getMemory = () => ({ moves, found, completed: found === pairs });
  }

  function introHead() {
    return html`<h1>${game.title}</h1><p class="muted" style="margin:-.3em 0 .2em">${game.description}</p>
      <p class="small muted">วิธีเล่น: ${game.howTo}${game.template === "match" ? "" : ` · ข้อละ ${game.pointsPerQ} คะแนน`}</p>
      ${data.preview ? html`<div class="info small">👀 โหมดทดลองเล่น (ฉบับร่าง) — ไม่บันทึกผล</div>` : ""}`;
  }

  async function finish(extra) {
    if (done) return; done = true; stop();
    const body = { answers, assignmentId: finishPayload.assignmentId };
    if (game.template === "match") Object.assign(body, extra || finishPayload.getMemory?.() || {});
    let r;
    try { r = await api(`/api/games/${game.id}/finish`, { body }); }
    catch (e) { root.innerHTML = html`<div class="card center"><p>${e.message}</p></div>`.s; return; }
    if (r.saved) refreshMe().catch(() => {});
    if (r.perfect) confetti();
    playSound(r.passed ? "win" : "wrong");
    root.innerHTML = html`<div class="play">${introHead()}<div class="card">
      <p class="result-big">${r.perfect ? "🎉" : r.passed ? "👏" : "💪"} ${r.score} / ${r.max} คะแนน</p>
      <p>${r.passed ? html`<span class="badge badge-ok">✅ ผ่านเกณฑ์ (${r.passPct}%)</span>` : html`<span class="badge badge-bad">ยังไม่ผ่านเกณฑ์ (${r.passPct}%)</span>`}
        ${game.template === "match" ? html` · พลิก ${body.moves || 0} ครั้ง` : html` · ตอบถูก ${r.correct} จาก ${r.total}`}</p>
      ${r.newBadges.map((b) => html`<div class="new-badge"><span class="ic">${b.icon}</span><div><b>ได้รับเหรียญใหม่: ${b.name}</b><div class="small muted">${b.desc}</div></div></div>`)}
      <p class="small muted">${r.preview ? "โหมดทดลองเล่น — ไม่บันทึกผล" : r.saved ? `บันทึกผลแล้ว (+${r.xp} XP · +${r.coins} 🪙)` : html`คุณเล่นในฐานะผู้เยี่ยมชม ผลนี้จะไม่ถูกบันทึก — <a href="/login?next=${encodeURIComponent(location.pathname)}">เข้าสู่ระบบ</a> เพื่อสะสม XP`}</p>
      ${game.template !== "match" ? html`<details ${r.total <= 12 ? raw("open") : ""}><summary>ดูเฉลยทุกข้อ</summary><ul class="review">${r.review.map((x) => html`<li><span>${x.correct ? "✅" : "❌"}</span><span>${x.prompt} → <span class="muted">เฉลย: ${x.answer}</span></span></li>`)}</ul></details>` : ""}
      <div class="row" style="margin-top:14px"><button class="btn" id="g-again">🔁 เล่นอีกครั้ง</button><a class="btn btn-ghost" href="${opts.backHref || "/games"}">${opts.backText || "กลับคลังเกม"}</a></div>
      </div></div>`.s;
    root.querySelector("#g-again").onclick = () => opts.restart?.();
  }

  // หน้าเริ่ม
  root.innerHTML = html`<div class="play">${introHead()}
    <div class="card"><div class="row" style="gap:16px">
      <span class="badge badge-brand">${game.templateName}</span>
      <span class="muted small">${game.template === "match" ? `${questions[0].pairs} คู่` : `${questions.length} ข้อ`}</span>
      ${game.timeLimitSec ? html`<span class="muted small">⏱ เวลา ${Math.floor(game.timeLimitSec / 60)}:${String(game.timeLimitSec % 60).padStart(2, "0")} นาที</span>` : ""}
      <span class="muted small">ผ่านเมื่อได้ ${game.passPct}%</span></div>
      ${!state.me ? html`<p class="small muted">เล่นได้เลยโดยไม่ต้องสมัคร (ผลจะไม่ถูกบันทึก)</p>` : ""}
      <button class="btn btn-lg btn-block" id="g-start" style="margin-top:12px">▶ เริ่มเล่น</button></div></div>`.s;
  root.querySelector("#g-start").onclick = () => { startTimer(); game.template === "match" ? renderMemory() : renderQ(); };
  root.querySelector("#g-start").focus();
  return () => stop();
}
