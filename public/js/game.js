// เครื่องเล่นเกม 5 แบบ: ถูก/ผิด, ปรนัย, เรียงลำดับ, เรียงคำ, จับคู่ (พลิกการ์ด)
import { api, html, raw, esc, toast, confetti, state, richQ, emojiOnly } from "./core.js";
import { playSound, getPrefs } from "./prefs.js";
import { refreshMe } from "./app.js";
import { showResultSplash, resultMeta, fmtTime } from "./result-splash.js";
import { createBattle } from "./battle.js";
import { reducedMotion } from "./prefs.js";
import { pickBoss, RARITY, bossInfo, SHINY } from "./journey.js";
import { loadSprites, needsStarter } from "./gacha-client.js";
import { battleTips, pickStarter } from "./tutorial.js";

// ป้ายแนะนำบอสก่อนสู้: ความหายาก + สกิลประจำตัว (+ ร่างทองคำ)
export function encounterHtml(boss) {
  const info = boss && bossInfo(boss.id); if (!info) return "";
  const R = RARITY[info.rarity];
  return html`<div class="st-enc rar-${info.rarity} ${boss.shiny ? "shiny" : ""}" style="--rc:${R.color}">
    ${info.rarity !== "common" || boss.shiny ? html`<div class="enc-alert">${boss.shiny ? `✨ พบ${SHINY.name}! โอกาสพบแค่ ${Math.round(SHINY.chance * 100)}%` : `${R.icon} พบบอส${R.name}!`}</div>` : ""}
    <div class="enc-row"><span class="enc-rar">${R.icon} ${R.name}</span><span class="enc-trait"><b>สกิลประจำตัว: ${info.trait.name}</b> — ${info.trait.desc}</span></div>
    ${R.bonus || boss.shiny ? html`<div class="enc-bonus">ปราบได้รับโบนัส 🪙 ${Math.round((R.bonus + (boss.shiny ? SHINY.bonus : 0)) * (boss.elite ? 1.5 : 1))}</div>` : ""}</div>`;
}
export function startGame(root, data, opts = {}) {
  const { game, questions } = data;
  const answers = [];
  let idx = 0, done = false, timerId = null, endsAt = null, locked = false;

  const finishPayload = { answers, assignmentId: opts.assignmentId || null };
  const key = data.key || null; // บทเรียน: ใช้ key สร้างชุดคำถามเดิมเพื่อตรวจคำตอบ

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
    return api(`/api/games/${game.id}/check`, { body: { index: idx, answer, key } });
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
    if (getPrefs().autoGo !== false) autoTimer = setTimeout(next, r.correct ? 2200 : 3000);
  }
  function hintBtn(q) {
    return q.hint ? html`<button class="linkish small" id="g-hint">💡 ขอใบ้</button>` : "";
  }
  function bindHint(card, q) {
    const b = card.querySelector("#g-hint");
    if (b) b.onclick = () => { b.replaceWith(Object.assign(document.createElement("div"), { className: "info small", textContent: "💡 " + q.hint })); };
  }

  // ⚔️ ปรนัยและถูก/ผิด: ตอบด้วยการ์ดสกิลโจมตีบอส (หลอดเลือดบอส = จำนวนข้อ)
  let battle = null, usedBattle = false, prepping = false, tipsShown = false;
  const boss = data.boss || pickBoss(game.title, data.setup?.current?.level || 2, false);
  function renderBattle() {
    usedBattle = true;
    if (!battle && (needsStarter() || !globalThis.QO_SPR)) {
      // ยังไม่มีคู่หู/ภาพตัวละคร: เลือกคู่หูก่อน แล้วค่อยเริ่มต่อสู้
      if (!prepping) { prepping = true; root.innerHTML = '<div class="loading" aria-busy="true">กำลังเรียกคู่หู…</div>';
        (async () => { await loadSprites(); if (needsStarter()) await pickStarter().catch(() => {}); prepping = false; if (!done) renderBattle(); })(); }
      return;
    }
    if (!battle) {
      root.innerHTML = html`<div class="play play-battle">${introHead(true)}<div id="g-battle"></div></div>`.s;
      battle = createBattle(root.querySelector("#g-battle"), {
        total: questions.length, lesson: game.title, category: game.category?.slug, reduced: reducedMotion(), boss, playerLv: state.me?.level || 1, skillMode: "pick",
        getTimerHtml: () => (game.timeLimitSec ? '<span class="timer" id="g-timer" role="timer" aria-live="off">⏱ --:--</span>' : ""),
        onAnswer: async (a) => { answers[idx] = a; const r = await check(a).catch((e) => { toast(e.message, "bad"); return null; }); if (r) playSound(r.correct ? "correct" : "wrong"); return r; },
        autoNext: () => getPrefs().autoGo !== false && !done,
        onNext: () => { clearTimeout(autoTimer); if (done) return; idx++; idx >= questions.length ? finish() : renderQ(); },
        onEliminate: (skip) => (game.template === "mcq" ? api(`/api/games/${game.id}/eliminate`, { body: { index: idx, key, skip } }).then((r) => r.wrong).catch(() => null) : Promise.resolve(null)),
      });
    }
    battle.ask(idx, questions[idx]); tick();
    if (!tipsShown) { tipsShown = true; battleTips(battle.heroId).catch(() => {}); }
  }
  function renderQ() {
    locked = false;
    const q = questions[idx];
    const t = game.template;
    if (t === "mcq" || t === "truefalse") return renderBattle();
    let body;
    if (t === "truefalse") {
      body = html`<div class="tf"><button class="btn btn-lg" data-a="true">✔ ถูก</button><button class="btn btn-lg btn-no" data-a="false">✖ ผิด</button></div>`;
    } else if (t === "mcq") {
      body = html`<div class="opts">${q.options.map((o, i) => html`<button class="opt ${emojiOnly(o) ? "emo" : ""}" data-i="${i}">${o}</button>`)}</div>`;
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
        <div class="q-prompt">${richQ(q.prompt)}</div>${body}</div></div>`.s;
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

  const story = data.story || null;
  function introHead(isBattle) {
    if (story) return html`<div class="st-head"><span class="st-ch">${story.house?.icon || "📖"} ${story.chapterTitle} · ด่าน ${story.n}/${story.total}</span>
      <h1>${story.boss ? "👑 " : ""}${game.title}</h1><p class="st-line">${story.line}</p>
      ${isBattle ? "" : html`<p class="small muted">ความยาก: ${story.levelName} · ${game.templateName} · ${questions.length} ข้อ${game.timeLimitSec ? ` · ⏱ ${Math.floor(game.timeLimitSec / 60)}:${String(game.timeLimitSec % 60).padStart(2, "0")}` : ""}</p>`}</div>`;
    const how = isBattle ? "⚔️ เลือกสกิลในแถบเหนือการ์ด แล้วเลือกการ์ดคำตอบที่ถูกเพื่อปล่อยสกิลใส่บอส — ลดเลือดบอสให้หมดเพื่อปราบ (กดเลข 1–4 ได้)" : game.howTo;
    return html`<h1>${game.title}</h1><p class="muted" style="margin:-.3em 0 .2em">${game.description}</p>
      <p class="small muted">วิธีเล่น: ${how}${game.template === "match" ? "" : ` · ข้อละ ${game.pointsPerQ} คะแนน`}</p>
      ${data.preview ? html`<div class="info small">👀 โหมดทดลองเล่น (ฉบับร่าง) — ไม่บันทึกผล</div>` : ""}`;
  }

  let t0 = 0;
  async function finish(extra) {
    if (done) return; done = true; stop(); const hero = battle?.heroId || null, skills = battle?.skillMode === "pick" ? battle.skills() : null; battle?.destroy(); battle = null;
    const body = { answers, assignmentId: finishPayload.assignmentId, key, ...(hero ? { hero } : {}), ...(usedBattle ? { boss: { id: boss.id, elite: boss.elite, shiny: !!boss.shiny }, ...(skills ? { skills, skillMode: "pick" } : {}) } : {}), ...(story ? { story: story.n, ...(Number.isInteger(story.g) && story.g >= 0 ? { storyG: story.g } : {}) } : {}) };
    if (game.template === "match") Object.assign(body, extra || finishPayload.getMemory?.() || {});
    let r;
    try { r = await api(`/api/games/${game.id}/finish`, { body }); }
    catch (e) { root.innerHTML = html`<div class="card center"><p>${e.message}</p></div>`.s; return; }
    if (r.saved) refreshMe().catch(() => {});
    const seconds = t0 ? (Date.now() - t0) / 1000 : null;
    playSound(r.passed ? "win" : "wrong");
    const m = resultMeta(r), isMatch = game.template === "match";
    const splash = () => showResultSplash(root, { r, game, moves: body.moves, seconds, onAgain: () => opts.restart?.(),
      onClose: () => root.querySelector(".rs")?.scrollIntoView({ block: "start", behavior: "smooth" }) });
    root.innerHTML = html`<div class="play">${introHead()}
      <section class="rs rs-${m.tone}" aria-labelledby="rs-title">
        <div class="rs-head">
          <div class="rs-left">
            <h2 class="rs-title" id="rs-title"><span class="w1">${m.title[0]}</span><span class="w2">${m.title[1]}</span></h2>
            <p class="rs-sub">${m.sub}</p>
          </div>
          <div class="rs-hero">
            <div class="vs-burst rs-burst"><div class="in"><b>${r.score.toLocaleString("th-TH")}</b><small>/ ${r.max} คะแนน</small></div></div>
            <div class="vs-rank vs-rank-${m.rank.r} rs-rank"><b>${m.rank.r}</b><span>${m.rank.name}</span></div>
          </div>
        </div>
        <div class="rs-chips">
          <span class="rs-chip">${isMatch ? html`🃏 พลิก <b>${body.moves || 0}</b> ครั้ง` : html`✅ ตอบถูก <b>${r.correct}/${r.total}</b>`}</span>
          ${r.saved ? html`<span class="rs-chip xp">⭐ <b>+${r.xp}</b> XP</span><span class="rs-chip coin">🪙 <b>+${r.coins || 0}</b> เหรียญ</span>` : ""}
          ${r.gems?.got ? html`<span class="rs-chip gem">💎 <b>+${r.gems.got}</b> เพชร</span>` : ""}
          ${seconds != null ? html`<span class="rs-chip">⏱ <b>${fmtTime(seconds)}</b></span>` : ""}
          <span class="rs-chip ${r.passed ? "ok" : "bad"}">${r.passed ? "ผ่านเกณฑ์" : "ยังไม่ผ่าน"} ${r.passPct}%</span>
        </div>
        ${progressBlock(r)}
        ${r.newBadges.length ? html`<div class="rs-badges">${r.newBadges.map((b) => html`<div class="vs-badge"><span class="ic">${b.icon}</span><div><small>ปลดล็อกเหรียญใหม่!</small><b>${b.name}</b><div class="small">${b.desc}</div></div></div>`)}</div>` : ""}
        ${!r.saved ? html`<p class="rs-note">${r.preview ? "โหมดทดลองเล่น — ไม่บันทึกผล" : html`คุณเล่นในฐานะผู้เยี่ยมชม ผลนี้จะไม่ถูกบันทึก — <a href="/login?next=${encodeURIComponent(location.pathname)}">เข้าสู่ระบบ</a> เพื่อสะสม XP`}</p>` : ""}
        ${!isMatch ? html`<details class="rs-review" ${r.total <= 12 ? raw("open") : ""}><summary>📖 ดูเฉลยทุกข้อ</summary>
          <ol class="rs-list">${r.review.map((x, i) => html`<li class="${x.correct ? "ok" : "bad"}"><span class="n">${i + 1}</span><span class="q">${x.prompt}</span><span class="a">${x.correct ? "✓" : "✗"} ${x.answer}</span></li>`)}</ol></details>` : ""}
        <div class="rs-actions">
          <button class="vs-btn" id="g-again">🔁 เล่นอีกครั้ง</button>
          <button class="vs-btn alt" id="g-replay">🎬 ดูฉากสรุปผลอีกครั้ง</button>
          ${story && opts.next && (r.stars?.got > 0 || story.prevStars > 0) && story.next ? html`<button class="vs-btn" id="g-nextstage">ด่านต่อไป ▶</button>` : ""}
          ${opts.onBack ? html`<button class="vs-btn alt" id="g-back">${opts.backText || "กลับ"}</button>` : html`<a class="vs-btn alt" href="${opts.backHref || "/games"}">${opts.backText || "กลับคลังเกม"}</a>`}
        </div>
      </section></div>`.s;
    root.querySelector("#g-again").onclick = () => opts.restart?.();
    root.querySelector("#g-back")?.addEventListener("click", () => opts.onBack());
    root.querySelector("#g-nextstage")?.addEventListener("click", () => opts.next());
    root.querySelector("#g-replay").onclick = splash;
    splash();
    if (r.perfect) setTimeout(() => confetti(), 1500);
  }

  // ความคืบหน้าหลังจบเกม: ดาว · ปลดล็อกระดับ · เลเวลอัป · บอส
  function progressBlock(r) {
    if (!r.stars && !r.levelUp && !r.boss) return "";
    const st = r.stars;
    return html`<div class="rs-prog">
      ${st ? html`<div class="rs-stars" aria-label="ได้ ${st.got} ดาว จาก 3 ที่ระดับ${st.levelName}">${[1, 2, 3].map((i) => html`<i class="${i <= st.got ? "on" : ""}" style="--i:${i}">★</i>`)}
        <span>${st.got > st.prevBest ? html`<b>สถิติใหม่!</b> ` : ""}ระดับ${st.levelName} · ดีที่สุด ${"★".repeat(st.best)}${"☆".repeat(3 - st.best)}</span></div>` : ""}
      <div class="rs-pops">
        ${r.unlockedLevel ? html`<span class="rs-pop unlock">🔓 ปลดล็อกระดับ <b>${r.unlockedLevel.name}</b> แล้ว!</span>` : ""}
        ${r.levelUp ? html`<span class="rs-pop lvup">🆙 เลเวลอัป! <b>Lv ${r.levelUp.from} → ${r.levelUp.to}</b> · ${r.levelUp.rank.icon} ${r.levelUp.rank.name}</span>` : ""}
        ${r.boss ? html`<span class="rs-pop ${r.boss.win ? "boss" : "bossl"}">${r.boss.win ? html`⚔️ ปราบ <b>${r.boss.shiny ? "✨ " : ""}${r.boss.name}</b> สำเร็จ!${r.boss.first ? " บันทึกลงสมุดล่าบอสแล้ว 📖" : ""}` : html`💀 ${r.boss.name} ยังรอดอยู่ — ตอบถูกให้มาก ๆ และใช้สกิลแรงเพื่อลดเลือดบอสให้หมด`}</span>` : ""}
        ${r.boss?.bonus ? html`<span class="rs-pop bonus rar-${r.boss.rarity}">${RARITY[r.boss.rarity]?.icon || "🪙"} โบนัสบอส${RARITY[r.boss.rarity]?.name || ""}${r.boss.shiny ? " · ร่างทองคำ" : ""} <b>+🪙 ${r.boss.bonus}</b></span>` : ""}
        ${r.eliteNow ? html`<span class="rs-pop elite">👑 ปลดล็อกบอสร่างจ้าว! พบได้ในระดับยากขึ้นไป</span>` : ""}
        ${r.rewardsReady ? html`<a class="rs-pop gift" href="/dashboard?j=1">🎁 มีรางวัลสะสมดาวรอรับ ${r.rewardsReady} ชิ้น — ไปที่สมุดผจญภัย</a>` : ""}
      </div></div>`;
  }

  // แผงเลือกบทเรียน: ระดับ · รูปแบบ · จำนวนข้อ · ชุดคำถาม
  function setupPanel() {
    const su = data.setup; if (!su) return "";
    const cur = su.current, isMatch = cur.mode === "match";
    const chip = (k, v, label, on, extra = "") => html`<button type="button" class="su-chip ${on ? "on" : ""}" data-k="${k}" data-v="${v}" aria-pressed="${on ? "true" : "false"}" ${raw(extra)}>${label}</button>`;
    return html`<div class="setup card" role="group" aria-label="ตั้งค่าก่อนเล่น">
      <div class="su-row"><b>ระดับ</b><div class="su-chips">${su.levels.map((n, i) => { const L = i + 1, lk = (su.locked || []).includes(L), got = (su.stars || {})[L] || 0;
        return lk ? html`<button type="button" class="su-chip locked" disabled title="ได้อย่างน้อย 1 ดาวที่ระดับ${su.levels[i - 1]}เพื่อปลดล็อก" aria-label="${n} (ล็อกอยู่)">🔒 ${n}</button>`
          : chip("level", L, html`<span class="lv lv${L}" aria-hidden="true">${"●".repeat(L)}</span> ${n}${su.stars ? html` <span class="got" aria-label="ได้ ${got} ดาว">${"★".repeat(got)}<s>${"☆".repeat(3 - got)}</s></span>` : ""}`, cur.level === L); })}</div></div>
      ${su.locked?.length ? html`<p class="su-lock small">🔒 ได้อย่างน้อย ⭐ 1 ดวงที่ระดับ “${su.levels[Math.min(...su.locked) - 2]}” เพื่อปลดล็อกระดับ “${su.levels[Math.min(...su.locked) - 1]}”</p>` : ""}
      <div class="su-row"><b>รูปแบบการเล่น</b><div class="su-chips">${su.modes.map((m) => chip("mode", m.id, `${m.icon} ${m.name}`, cur.mode === m.id, `title="${esc(m.howTo)}"`))}</div></div>
      <div class="su-row"><b>จำนวน${isMatch ? "คู่" : "ข้อ"}</b><div class="su-chips">${su.counts.map((c) => chip("count", c, `${c} ${isMatch ? "คู่" : "ข้อ"}`, cur.count === c))}</div></div>
      <div class="su-row"><b>ชุดคำถาม</b><div class="su-chips">${Array.from({ length: su.sets }, (_, i) => chip("set", i + 1, `ชุดที่ ${i + 1}`, cur.set === i + 1))}${chip("set", 0, "🎲 สุ่มชุดใหม่", cur.set === 0)}</div></div>
      <p class="small muted" style="margin:6px 0 0">${su.generated ? "บทเรียนนี้สร้างโจทย์ใหม่ตามระดับ ชุดที่ 1–4 จะได้โจทย์เดิมทุกครั้ง เหมาะกับการฝึกซ้ำ" : `คลังคำถาม ${su.size} ข้อ ชุดที่ 1–4 เป็นชุดตายตัว ถ้าระดับนั้นมีคำถามไม่พอจะเติมจากระดับใกล้เคียง`}</p></div>`;
  }
  // หน้าเริ่ม
  if (story) {
    root.innerHTML = html`<div class="play play-story">${introHead()}
      <div class="card st-start"><div class="st-vs"><span class="st-me">🧙 คุณ</span><b>VS</b><span class="st-boss">${story.boss ? "👑 " : "👾 "}${boss.shiny ? "✨ " : ""}${boss.name}<small>Lv ${boss.lv || "?"}</small></span></div>
        ${encounterHtml(boss)}
        <p class="small muted" style="margin:8px 0 0">${story.boss ? `ลดเลือดบอสประจำบทให้หมดเพื่อปราบ · ` : ""}ผ่าน 60% ได้ ★ · 80% ★★ · เต็ม ★★★ · ได้อย่างน้อย ★ เพื่อเปิดด่านถัดไป${story.prevStars ? ` · ดีที่สุดตอนนี้ ${"★".repeat(story.prevStars)}` : ""}</p>
        <button class="btn btn-lg btn-block" id="g-start" style="margin-top:12px">⚔️ เริ่มสู้!</button></div></div>`.s;
    root.querySelector("#g-start").onclick = () => { t0 = Date.now(); startTimer(); game.template === "match" ? renderMemory() : renderQ(); };
    root.querySelector("#g-start").focus({ preventScroll: true });
    return () => { stop(); battle?.destroy(); };
  }
  root.innerHTML = html`<div class="play">${introHead()}${setupPanel()}
    <div class="card"><div class="row" style="gap:16px">
      <span class="badge badge-brand">${game.templateName}</span>
      <span class="muted small">${game.template === "match" ? `${questions[0].pairs} คู่` : `${questions.length} ข้อ`}</span>
      ${game.timeLimitSec ? html`<span class="muted small">⏱ เวลา ${Math.floor(game.timeLimitSec / 60)}:${String(game.timeLimitSec % 60).padStart(2, "0")} นาที</span>` : ""}
      <span class="muted small">ผ่านเมื่อได้ ${game.passPct}%</span></div>
      ${!state.me ? html`<p class="small muted">เล่นได้เลยโดยไม่ต้องสมัคร (ผลจะไม่ถูกบันทึก)</p>` : ""}
      <button class="btn btn-lg btn-block" id="g-start" style="margin-top:12px">▶ เริ่มเล่น</button></div></div>`.s;
  root.querySelector("#g-start").onclick = () => { t0 = Date.now(); startTimer(); game.template === "match" ? renderMemory() : renderQ(); };
  root.querySelectorAll(".su-chip").forEach((b) => b.onclick = () => { if (b.classList.contains("on") && b.dataset.v !== "0") return; const k = b.dataset.k, v = b.dataset.k === "mode" ? b.dataset.v : +b.dataset.v; root.querySelectorAll(".su-chip").forEach((x) => x.disabled = true); opts.reconfigure?.({ [k]: v }); });
  (data.setup ? root.querySelector(".su-chip.on") || root.querySelector("#g-start") : root.querySelector("#g-start")).focus({ preventScroll: true });
  return () => { stop(); battle?.destroy(); };
}
