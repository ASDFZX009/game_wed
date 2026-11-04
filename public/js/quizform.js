// แสดงคำถามแบบทดสอบทั้ง 10 ชนิด และอ่านคำตอบกลับ
import { html, raw, esc } from "./core.js";

export const TYPE_TH = {
  mcq: "ปรนัย", truefalse: "ถูก/ผิด", short: "คำตอบสั้น", fill: "เติมคำ", match: "จับคู่", order: "เรียงลำดับ",
  essay: "อัตนัย", multi: "เลือกได้หลายข้อ", numeric: "ตัวเลข", wordbank: "เติมคำจากคลังคำ",
};

function promptWithBlanks(q, kind) {
  const parts = q.prompt.split("___");
  return parts.map((p, i) => {
    const t = esc(p);
    if (i === parts.length - 1) return t;
    return t + (kind === "fill"
      ? `<input data-blank="${i}" aria-label="ช่องว่างที่ ${i + 1}" autocomplete="off">`
      : `<button type="button" class="slot empty" data-slot="${i}" aria-label="ช่องว่างที่ ${i + 1}">ช่องที่ ${i + 1}</button>`);
  }).join("");
}

export function renderQuestion(q, n) {
  const name = `q${q.index}`;
  let body;
  switch (q.type) {
    case "mcq":
      body = html`${q.options.map((o) => html`<label class="choice"><input type="radio" name="${name}" value="${o.k}"> ${o.t}</label>`)}`; break;
    case "multi":
      body = html`<p class="small muted">เลือกได้มากกว่า 1 ข้อ</p>${q.options.map((o) => html`<label class="choice"><input type="checkbox" data-multi value="${o.k}"> ${o.t}</label>`)}`; break;
    case "truefalse":
      body = html`<label class="choice"><input type="radio" name="${name}" value="true"> จริง</label><label class="choice"><input type="radio" name="${name}" value="false"> เท็จ</label>`; break;
    case "short":
      body = html`<input data-short aria-label="คำตอบ" autocomplete="off">`; break;
    case "numeric":
      body = html`<div class="row"><input data-num inputmode="decimal" aria-label="คำตอบเป็นตัวเลข" style="max-width:220px" autocomplete="off">${q.unit ? html`<span class="muted">${q.unit}</span>` : ""}</div>`; break;
    case "essay":
      body = html`<textarea data-essay rows="5" aria-label="คำตอบ"></textarea>`; break;
    case "fill":
      body = html`<div class="fill-line">${raw(promptWithBlanks(q, "fill"))}</div>`; break;
    case "wordbank":
      body = html`<div class="fill-line">${raw(promptWithBlanks(q, "bank"))}</div><p class="small muted">แตะช่องว่างแล้วเลือกคำจากคลังคำ (แตะช่องที่เติมแล้วเพื่อเอาคำออก)</p>
        <div class="bank">${q.bank.map((w, i) => html`<button type="button" class="w" data-w="${i}">${w}</button>`)}</div>`; break;
    case "match":
      body = html`${q.left.map((l, i) => html`<div class="match-row"><span>${l}</span><span aria-hidden="true">→</span>
        <select data-match="${i}" aria-label="คู่ของ ${l}"><option value="">เลือก…</option>${q.right.map((r) => html`<option>${r}</option>`)}</select></div>`)}`; break;
    case "order":
      body = html`<p class="small muted">กดลูกศรเพื่อสลับลำดับ</p><ol class="order-list" data-order>${q.items.map((it) => html`<li data-v="${it}"><span class="t">${it}</span><button type="button" class="icon-btn" data-mv="-1" aria-label="เลื่อนขึ้น">↑</button><button type="button" class="icon-btn" data-mv="1" aria-label="เลื่อนลง">↓</button></li>`)}</ol>`; break;
  }
  const showPrompt = q.type !== "fill" && q.type !== "wordbank";
  return html`<section class="qcard" data-q="${q.index}" data-type="${q.type}">
    <div class="qh"><b>ข้อ ${n}</b><span>${TYPE_TH[q.type]} · ${q.points} คะแนน</span></div>
    ${q.image ? html`<img class="q-img" src="${q.image}" alt="ภาพประกอบโจทย์">` : ""}
    ${showPrompt ? html`<div class="qp">${q.prompt}</div>` : html`<div class="qp muted small">เติมคำในช่องว่าง</div>`}${body}</section>`;
}

export function bindQuestions(root) {
  root.querySelectorAll('[data-type="wordbank"]').forEach((sec) => {
    let active = 0;
    const slots = [...sec.querySelectorAll("[data-slot]")], words = [...sec.querySelectorAll("[data-w]")];
    const mark = () => slots.forEach((s, i) => s.style.outline = i === active ? "3px solid var(--accent)" : "");
    slots.forEach((s, i) => s.onclick = () => {
      if (s.dataset.word !== undefined) {
        words[+s.dataset.word].disabled = false;
        delete s.dataset.word; s.textContent = `ช่องที่ ${i + 1}`; s.classList.add("empty");
      }
      active = i; mark();
    });
    words.forEach((w) => w.onclick = () => {
      const s = slots[active] || slots.find((x) => x.dataset.word === undefined);
      if (!s) return;
      if (s.dataset.word !== undefined) words[+s.dataset.word].disabled = false;
      s.dataset.word = w.dataset.w; s.textContent = w.textContent; s.classList.remove("empty");
      w.disabled = true;
      const next = slots.findIndex((x) => x.dataset.word === undefined);
      active = next >= 0 ? next : active; mark();
    });
    mark();
  });
  root.querySelectorAll("[data-order]").forEach((ol) => {
    ol.addEventListener("click", (e) => {
      const b = e.target.closest("[data-mv]");
      if (!b) return;
      const li = b.closest("li"), dir = +b.dataset.mv;
      const sib = dir < 0 ? li.previousElementSibling : li.nextElementSibling;
      if (!sib) return;
      dir < 0 ? ol.insertBefore(li, sib) : ol.insertBefore(sib, li);
      li.querySelector(`[data-mv="${dir}"]`).focus();
    });
  });
}

export function readAnswers(root) {
  const out = {};
  root.querySelectorAll("[data-q]").forEach((sec) => {
    const i = sec.dataset.q, t = sec.dataset.type;
    let a = null;
    switch (t) {
      case "mcq": { const c = sec.querySelector("input:checked"); a = c ? +c.value : null; break; }
      case "truefalse": { const c = sec.querySelector("input:checked"); a = c ? c.value === "true" : null; break; }
      case "multi": a = [...sec.querySelectorAll("[data-multi]:checked")].map((c) => +c.value); break;
      case "short": a = sec.querySelector("[data-short]").value.trim(); break;
      case "numeric": a = sec.querySelector("[data-num]").value.trim(); break;
      case "essay": a = sec.querySelector("[data-essay]").value.trim(); break;
      case "fill": a = [...sec.querySelectorAll("[data-blank]")].map((x) => x.value.trim()); break;
      case "wordbank": a = [...sec.querySelectorAll("[data-slot]")].map((s) => (s.dataset.word !== undefined ? s.textContent : "")); break;
      case "match": a = Object.fromEntries([...sec.querySelectorAll("[data-match]")].map((s) => [s.dataset.match, s.value])); break;
      case "order": a = [...sec.querySelectorAll("li")].map((li) => li.dataset.v); break;
    }
    out[i] = a;
  });
  return out;
}

export function countUnanswered(answers) {
  return Object.values(answers).filter((a) => a === null || a === "" || (Array.isArray(a) && (!a.length || a.some((x) => x === ""))) || (a && typeof a === "object" && !Array.isArray(a) && Object.values(a).some((x) => !x))).length;
}
