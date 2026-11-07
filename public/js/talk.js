// 💬 กล่องข้อความแบบเกม: รูปตัวละครมุมซ้ายล่าง ป้ายชื่อ ข้อความพิมพ์ทีละตัว
// ปุ่ม: ⏩ ข้าม · ▶ อัตโนมัติ · 📜 ประวัติ · แตะ/คลิก/Enter/Space = ไปต่อ
// ใช้: await talk([{ who: "mira", text: "สวัสดี *นักผจญภัย*!" }, { who: "mira", text: "เลือกเลย", choices: [{ label: "ก", value: 1 }] }])
//   - *คำ* = เน้นสีตามตัวละคร · spot: "ตัวเลือก CSS" = วงไฟชี้ปุ่มบนจอ · form: "a" = ร่างตื่นพลัง
import { loadSprites, frameUrl, ROSTER } from "./gacha-client.js";
import { getPrefs, playSound } from "./prefs.js";

const reduced = () => getPrefs().motion === "reduce" || matchMedia("(prefers-reduced-motion: reduce)").matches;
const LOG = []; // ประวัติข้อความของรอบนี้ (เปิดดูย้อนหลังได้)
let autoOn = false; try { autoOn = localStorage.getItem("qo:talk-auto") === "1"; } catch { /* ignore */ }

function richText(el, text, col) {
  el.textContent = "";
  String(text).split(/(\*[^*]+\*)/).forEach((part) => {
    if (/^\*[^*]+\*$/.test(part)) { const b = document.createElement("b"); b.textContent = part.slice(1, -1); b.style.color = col; el.appendChild(b); }
    else if (part) el.appendChild(document.createTextNode(part));
  });
}
const nameOf = (l) => l.name || ROSTER[l.who]?.n || "";
const colOf = (l) => l.color || ROSTER[l.who]?.col || "#9ad0ff";

/**
 * แสดงบทสนทนา คืนค่าที่ผู้เล่นเลือก (ถ้ามีตัวเลือก) หรือ null เมื่อจบ/กดข้าม
 * @param {Array} lines
 * @param {{dim?:boolean, canSkip?:boolean}} opts
 */
export async function talk(lines, { dim = true, canSkip = true } = {}) {
  await loadSprites();
  const box = document.createElement("div");
  box.className = "tk" + (dim ? " dim" : "");
  box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "บทสนทนา");
  box.innerHTML = `<div class="tk-spot" hidden></div>
    <div class="tk-wrap">
      <div class="tk-pt" aria-hidden="true"><i class="tk-slash"></i><img class="tk-img" alt=""></div>
      <div class="tk-panel">
        <div class="tk-name"><span></span></div>
        <div class="tk-body"><p class="tk-text" aria-live="polite"></p><div class="tk-choices" role="group"></div><span class="tk-more" aria-hidden="true">▼</span></div>
      </div>
      <div class="tk-ctrl">
        ${canSkip ? '<button type="button" class="tk-b" data-k="skip" aria-label="ข้ามบทสนทนาทั้งหมด">⏩ ข้าม</button>' : ""}
        <button type="button" class="tk-b" data-k="auto" aria-pressed="false">▶ อัตโนมัติ</button>
        <button type="button" class="tk-b" data-k="log">📜 ประวัติ</button>
      </div>
    </div>
    <div class="tk-log" hidden><div class="tk-log-in"><h3>📜 ประวัติบทสนทนา</h3><div class="tk-log-list"></div><button type="button" class="tk-b" data-k="logx">ปิด</button></div></div>`;
  document.body.appendChild(box);
  const $ = (s) => box.querySelector(s);
  const img = $(".tk-img"), txt = $(".tk-text"), nm = $(".tk-name span"), ch = $(".tk-choices"), more = $(".tk-more"), spot = $(".tk-spot"), pt = $(".tk-pt");
  const autoBtn = box.querySelector('[data-k="auto"]');
  const setAuto = () => { autoBtn.classList.toggle("on", autoOn); autoBtn.setAttribute("aria-pressed", String(autoOn)); autoBtn.textContent = autoOn ? "⏸ อัตโนมัติ" : "▶ อัตโนมัติ"; };
  setAuto();
  let aniT = 0, typeT = 0, autoT = 0, done = null, typing = false, fullText = "", cur = null, logOpen = false;
  const prevFocus = document.activeElement;
  requestAnimationFrame(() => box.classList.add("on"));

  const finishType = () => { clearInterval(typeT); typing = false; richText(txt, fullText, colOf(cur)); box.classList.add("ready"); armAuto(); };
  const armAuto = () => { clearTimeout(autoT); if (autoOn && !cur?.choices && !logOpen) autoT = setTimeout(() => advance(), 1100 + fullText.length * 28); };
  function placeSpot(sel) {
    const el = sel && document.querySelector(sel);
    if (!el) { spot.hidden = true; return; }
    const r = el.getBoundingClientRect(); if (!r.width) { spot.hidden = true; return; }
    Object.assign(spot.style, { left: r.left - 8 + "px", top: r.top - 8 + "px", width: r.width + 16 + "px", height: r.height + 16 + "px" }); spot.hidden = false;
  }
  function show(l) {
    cur = l; box.classList.remove("ready"); clearTimeout(autoT);
    const col = colOf(l); box.style.setProperty("--tc", col);
    nm.textContent = nameOf(l); $(".tk-name").hidden = !nameOf(l);
    clearInterval(aniT);
    if (l.who && ROSTER[l.who]) { pt.hidden = false; const f = l.form === "a" ? "_a" : "_n"; let k = 0; img.src = frameUrl(l.who + f + "0"); img.alt = nameOf(l);
      if (!reduced()) aniT = setInterval(() => { k = (k + 1) % 4; img.src = frameUrl(l.who + f + k); }, 180);
      pt.classList.remove("in"); void pt.offsetWidth; pt.classList.add("in"); }
    else pt.hidden = true;
    box.classList.toggle("noface", pt.hidden);
    placeSpot(l.spot);
    fullText = l.text; LOG.push({ n: nameOf(l), t: l.text, c: col }); if (LOG.length > 120) LOG.shift();
    ch.innerHTML = ""; more.hidden = !!l.choices;
    if (reduced()) finishType();
    else { typing = true; let i = 0; const chars = [...String(l.text).replace(/\*/g, "")]; txt.textContent = "";
      typeT = setInterval(() => { i += 2; txt.textContent = chars.slice(0, i).join(""); if (i % 14 === 0) playSound("flip"); if (i >= chars.length) finishType(); }, 28); }
    if (l.choices) {
      const mk = (c, i) => { const b = document.createElement("button"); b.type = "button"; b.className = "tk-ch" + (c.cls ? " " + c.cls : "");
        if (c.who && ROSTER[c.who]) { const im = document.createElement("img"); im.src = frameUrl(c.who + "_n0"); im.alt = ""; b.appendChild(im); }
        const sp = document.createElement("span"); sp.className = "tk-ch-t"; const st = document.createElement("b"); st.textContent = c.label; sp.appendChild(st);
        if (c.sub) { const sm = document.createElement("small"); sm.textContent = c.sub; sp.appendChild(sm); }
        b.appendChild(sp); b.style.setProperty("--cc", c.who ? ROSTER[c.who]?.col : col);
        b.onclick = (e) => { e.stopPropagation(); if (typing) finishType(); end(c.value); };
        b.dataset.i = i; return b; };
      l.choices.forEach((c, i) => ch.appendChild(mk(c, i)));
      setTimeout(() => ch.querySelector("button")?.focus({ preventScroll: true }), 30);
    } else setTimeout(() => box.querySelector(".tk-panel").focus({ preventScroll: true }), 30);
  }
  let i = 0;
  function advance() { if (logOpen || cur?.choices) return; if (typing) return finishType(); i++; if (i >= lines.length) end(null); else show(lines[i]); }
  function end(v) { clearInterval(aniT); clearInterval(typeT); clearTimeout(autoT); removeEventListener("keydown", onKey, true); removeEventListener("resize", onRs);
    box.classList.remove("on"); box.classList.add("off"); setTimeout(() => box.remove(), reduced() ? 0 : 220); try { prevFocus?.focus?.({ preventScroll: true }); } catch { /* ignore */ } done(v); }
  const onKey = (e) => {
    if (logOpen) { if (e.key === "Escape") { e.preventDefault(); toggleLog(false); } return; }
    if (e.target.closest?.(".tk-ctrl, .tk-choices")) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); advance(); }
    else if (e.key === "Escape" && canSkip && !cur?.choices) { e.preventDefault(); end(null); }
  };
  const onRs = () => placeSpot(cur?.spot);
  function toggleLog(on) { logOpen = on; const lg = $(".tk-log"); lg.hidden = !on; clearTimeout(autoT);
    if (on) { const list = $(".tk-log-list"); list.innerHTML = ""; LOG.forEach((m) => { const d = document.createElement("div"); const b = document.createElement("b"); b.textContent = m.n || "—"; b.style.color = m.c; const p = document.createElement("p"); p.textContent = m.t.replace(/\*/g, ""); d.append(b, p); list.appendChild(d); }); list.scrollTop = list.scrollHeight; lg.querySelector("button").focus(); }
    else armAuto(); }
  box.addEventListener("click", (e) => {
    const k = e.target.closest(".tk-b")?.dataset.k;
    if (k === "skip") { e.stopPropagation(); if (cur?.choices) { const c = cur.choices.find((x) => x.def) || cur.choices[0]; end(c.value); } else end(null); return; }
    if (k === "auto") { e.stopPropagation(); autoOn = !autoOn; try { localStorage.setItem("qo:talk-auto", autoOn ? "1" : "0"); } catch { /* ignore */ } setAuto(); if (autoOn && !typing) armAuto(); else clearTimeout(autoT); return; }
    if (k === "log") { e.stopPropagation(); toggleLog(true); return; }
    if (k === "logx") { e.stopPropagation(); toggleLog(false); return; }
    if (e.target.closest(".tk-log")) return;
    advance();
  });
  $(".tk-panel").tabIndex = -1;
  addEventListener("keydown", onKey, true); addEventListener("resize", onRs);
  return new Promise((ok) => { done = ok; show(lines[0]); });
}

/** ตะโกนสั้น ๆ ไม่ขวางการเล่น (เช่น ตอนตื่นพลัง) — หายไปเอง */
export function shout(who, text, { form = "a", ms = 1700, host = document.body } = {}) {
  const c = ROSTER[who]; if (!c) return;
  const el = document.createElement("div"); el.className = "tk-shout" + (reduced() ? " still" : ""); el.style.setProperty("--tc", c.col); el.setAttribute("role", "status");
  const im = document.createElement("img"); im.src = frameUrl(who + (form === "a" ? "_1" : "_0")); im.alt = "";
  const p = document.createElement("div"); p.className = "tk-shout-p"; const b = document.createElement("b"); b.textContent = c.n; const t = document.createElement("span"); t.textContent = text; p.append(b, t);
  el.append(im, p); host.appendChild(el); setTimeout(() => el.remove(), ms);
}
