// หน้าจอสรุปผลแบบเต็มจอหลังจบเกม: แถบเฉียง ดาวระเบิดคะแนน ตราแรงก์ ตัวเลขนับขึ้น
import { html, raw } from "./core.js";
import { playSound, playTick, getPrefs } from "./prefs.js";

const reduced = () => getPrefs().motion === "reduce" || (getPrefs().motion !== "full" && matchMedia("(prefers-reduced-motion: reduce)").matches);

export function rankOf(score, max, passed) {
  const p = max ? score / max : 0;
  if (p >= 1) return { r: "S", name: "ไร้ที่ติ" };
  if (p >= 0.85) return { r: "A", name: "ยอดเยี่ยม" };
  if (p >= 0.7) return { r: "B", name: "เก่งมาก" };
  if (passed) return { r: "C", name: "ผ่านฉลุย" };
  return { r: "D", name: "สู้ต่อไป" };
}

export function resultMeta(r) {
  const tone = r.perfect ? "win" : r.passed ? "pass" : "try";
  return { tone, rank: rankOf(r.score, r.max, r.passed),
    title: { win: ["ไร้ที่ติ", "สุดยอด!"], pass: ["ภารกิจ", "สำเร็จ!"], try: ["เกือบ", "แล้ว!"] }[tone],
    sub: { win: "ตอบถูกครบทุกข้อ ไม่มีพลาดเลย", pass: `ผ่านเกณฑ์ ${r.passPct}% แล้ว เก่งมาก`, try: `ต้องได้ ${r.passPct}% ถึงจะผ่าน ลองอีกรอบนะ` }[tone] };
}

export const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/**
 * แสดงหน้าจอผลลัพธ์ทับเนื้อหาใน host
 * @param {HTMLElement} host ที่สำหรับวาง (ถูกล้างเมื่อเปลี่ยนหน้า จึงไม่ค้าง)
 * @param {{r:object, game:object, moves?:number, seconds?:number, onAgain?:Function, onClose?:Function}} o
 */
export function showResultSplash(host, o) {
  const { r, game } = o;
  const { tone, rank, title, sub } = resultMeta(r);
  const pct = r.max ? Math.round((r.score / r.max) * 100) : 0;
  const isMatch = game.template === "match";
  const saved = !!r.saved;
  const stat = (cls, key, val, extra = "") => html`<div class="vs-stat ${cls}"><span class="k">${key}</span><b>${raw(val)}</b>${raw(extra)}</div>`;
  const sparkles = Array.from({ length: 14 }, (_, i) =>
    `<i class="vs-spark" style="left:${(i * 37 + 7) % 97}%;top:${(i * 53 + 11) % 93}%;--d:${(i % 7) * 0.35}s;font-size:${10 + (i % 4) * 6}px">✦</i>`).join("");

  const el = document.createElement("div");
  el.className = `vs vs-${tone}`;
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-labelledby", "vs-title");
  el.innerHTML = html`
    <div class="vs-bg" aria-hidden="true"></div>
    <div class="vs-shard s1" aria-hidden="true"></div><div class="vs-shard s2" aria-hidden="true"></div><div class="vs-shard s3" aria-hidden="true"></div>
    <div class="vs-sparks" aria-hidden="true">${raw(sparkles)}</div>
    <div class="vs-stage">
      <div class="vs-left">
        <p class="vs-game">${game.title}</p>
        <h2 class="vs-title" id="vs-title"><span class="w1">${title[0]}</span><span class="w2">${title[1]}</span></h2>
        <p class="vs-sub">${sub}</p>
        <div class="vs-hero">
          <div class="vs-burst" aria-label="ได้ ${r.score} จาก ${r.max} คะแนน"><div class="in"><b data-count="${r.score}">0</b><small>/ ${r.max} คะแนน</small></div></div>
          <div class="vs-rank vs-rank-${rank.r}" aria-label="แรงก์ ${rank.r} ${rank.name}"><b>${rank.r}</b><span>${rank.name}</span></div>
        </div>
      </div>
      <div class="vs-right">
        ${stat("acc", isMatch ? "พลิกการ์ด" : "ตอบถูก", isMatch ? `${o.moves || 0}<small> ครั้ง</small>` : `${r.correct}<small>/${r.total}</small>`,
          isMatch ? "" : `<i class="vs-bar"><i style="--p:${r.total ? Math.round((r.correct / r.total) * 100) : 0}%"></i></i>`)}
        ${stat("xp", "XP ที่ได้", saved ? `+<span data-count="${r.xp}">0</span>` : "—")}
        ${stat("coin", "🪙 เหรียญ", saved ? `+<span data-count="${r.coins || 0}">0</span>` : "—")}
        ${stat("time", "⏱ เวลา", o.seconds != null ? fmtTime(o.seconds) : "—", `<small class="pct">ความแม่น ${pct}%</small>`)}
        ${r.newBadges?.length ? html`<div class="vs-badges">${r.newBadges.map((b) => html`<div class="vs-badge"><span class="ic">${b.icon}</span><div><small>ปลดล็อกเหรียญใหม่!</small><b>${b.name}</b></div></div>`)}</div>` : ""}
        ${!saved ? html`<p class="vs-note">${r.preview ? "โหมดทดลองเล่น — ไม่บันทึกผล" : "เล่นแบบผู้เยี่ยมชม — เข้าสู่ระบบเพื่อสะสม XP และเหรียญ"}</p>` : ""}
        <div class="vs-actions">
          <button class="vs-btn" id="vs-next">ดูเฉลย &amp; สรุปผล ▶</button>
          <button class="vs-btn alt" id="vs-again">🔁 เล่นอีกครั้ง</button>
        </div>
      </div>
    </div>
    <p class="vs-hint" aria-hidden="true">แตะที่ว่าง หรือกด Enter เพื่อไปต่อ</p>`.s;
  host.appendChild(el);
  document.documentElement.classList.add("vs-open");

  // ตัวเลขนับขึ้นทีละตัว (คะแนน → XP → เหรียญ) พร้อมเสียงทุกครั้งที่ตัวเลขบวกขึ้น แล้วตามด้วยเหรียญรางวัลใหม่
  const counters = [...el.querySelectorAll("[data-count]")];
  const badges = [...el.querySelectorAll(".vs-badge")];
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(() => el.isConnected && fn(), ms));
  if (reduced()) counters.forEach((c) => (c.textContent = (+c.dataset.count).toLocaleString("th-TH")));
  else {
    const START = 550, DUR = 650, GAP = 160;
    counters.forEach((c) => (c.textContent = "0"));
    counters.forEach((c, i) => later(() => {
      const target = +c.dataset.count;
      if (target > 0) playTick(i);
      c.classList.add("vs-counting");
      const t0 = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - t0) / DUR), e = 1 - Math.pow(1 - k, 3);
        c.textContent = Math.round(target * e).toLocaleString("th-TH");
        if (k < 1 && el.isConnected) requestAnimationFrame(step); else c.classList.remove("vs-counting");
      };
      requestAnimationFrame(step);
    }, START + i * (DUR + GAP)));
    const after = START + counters.length * (DUR + GAP);
    badges.forEach((b, i) => { b.style.animationDelay = `${(after + i * 450) / 1000}s`; later(() => playTick(counters.length + i), after + i * 450 + 120); });
    later(() => playSound("stamp"), 1150);
  }

  const close = () => {
    if (!el.isConnected) return;
    timers.forEach(clearTimeout);
    document.removeEventListener("keydown", onKey);
    document.documentElement.classList.remove("vs-open");
    if (reduced()) { el.remove(); o.onClose?.(); return; }
    el.classList.add("vs-out");
    setTimeout(() => { el.remove(); o.onClose?.(); }, 260);
  };
  const onKey = (e) => {
    if (!el.isConnected) return document.removeEventListener("keydown", onKey);
    if (e.key === "Escape") { e.preventDefault(); close(); }
    if (e.key === "Tab") { // วนโฟกัสอยู่ในหน้าผลลัพธ์
      const f = [...el.querySelectorAll("button")]; const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  };
  document.addEventListener("keydown", onKey);
  el.querySelector("#vs-next").onclick = close;
  el.querySelector("#vs-again").onclick = () => { timers.forEach(clearTimeout); document.removeEventListener("keydown", onKey); document.documentElement.classList.remove("vs-open"); el.remove(); o.onAgain?.(); };
  el.addEventListener("click", (e) => { if (!e.target.closest(".vs-right, .vs-hero, button")) close(); });
  setTimeout(() => el.isConnected && el.querySelector("#vs-next").focus({ preventScroll: true }), reduced() ? 0 : 900);
  return close;
}
