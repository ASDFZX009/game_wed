// ฟังก์ชันกลางฝั่งเบราว์เซอร์: เรียก API, สร้าง HTML อย่างปลอดภัย, วันที่ภาษาไทย, ตัวเลือกวันที่, แจ้งเตือน
export const state = { me: null, config: { tz: "Asia/Bangkok" } };

// ---------- HTML ที่ escape อัตโนมัติ ----------
class Raw { constructor(s) { this.s = s; } toString() { return this.s; } }
export const raw = (s) => new Raw(String(s ?? ""));
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const val = (v) => (v instanceof Raw ? v.s : Array.isArray(v) ? v.map(val).join("") : v === false || v == null ? "" : esc(v));
export function html(strings, ...vals) {
  let out = strings[0];
  vals.forEach((v, i) => { out += val(v) + strings[i + 1]; });
  return new Raw(out);
}

// ---------- API ----------
export async function api(path, opts = {}) {
  const o = { method: opts.method || (opts.body ? "POST" : "GET"), headers: {}, credentials: "same-origin" };
  if (opts.body !== undefined) { o.headers["Content-Type"] = "application/json"; o.body = JSON.stringify(opts.body); }
  const res = await fetch(path, o);
  let data = {};
  try { data = await res.json(); } catch { /* ไม่มีเนื้อหา */ }
  if (!res.ok) { const e = new Error(data.error || "เกิดข้อผิดพลาด กรุณาลองใหม่"); e.status = res.status; e.data = data; throw e; }
  return data;
}

// ---------- วันที่และตัวเลข (เวลาไทย) ----------
const tz = () => state.config.tz || "Asia/Bangkok";
export function fmtDate(d, withTime = true) {
  if (!d) return "—";
  const o = { timeZone: tz(), day: "numeric", month: "short", year: "numeric" };
  if (withTime) Object.assign(o, { hour: "2-digit", minute: "2-digit" });
  return new Intl.DateTimeFormat("th-TH", o).format(new Date(d));
}
export const fmtDay = (key) => new Intl.DateTimeFormat("th-TH", { timeZone: "UTC", day: "numeric", month: "short" }).format(new Date(key + "T00:00:00Z"));
export const fmtNum = (n) => (n == null ? "—" : Number(n).toLocaleString("th-TH"));
export const pct = (n, d = 0) => (n == null ? "—" : `${Number(n).toFixed(d)}%`);
export function relTime(d) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "เมื่อสักครู่";
  if (s < 3600) return `${Math.floor(s / 60)} นาทีที่แล้ว`;
  if (s < 86400) return `${Math.floor(s / 3600)} ชั่วโมงที่แล้ว`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} วันที่แล้ว`;
  return fmtDate(d, false);
}
export function dueText(d) {
  if (!d) return "ไม่มีกำหนดส่ง";
  const ms = new Date(d) - Date.now();
  if (ms < 0) return `เลยกำหนด (${fmtDate(d)})`;
  const days = Math.floor(ms / 86400000);
  return days >= 1 ? `ส่งภายใน ${fmtDate(d)} (อีก ${days} วัน)` : `ส่งภายใน ${fmtDate(d)} (วันนี้)`;
}

// ---------- ตัวเลือกวันที่และเวลาแบบไทย (แทน mm/dd/yyyy ของเบราว์เซอร์) ----------
const MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
export function thaiDateInput(name, label, hint, defaultDays = 0) {
  const y = new Date().getFullYear();
  const opt = (v, t) => `<option value="${v}">${t}</option>`;
  const days = Array.from({ length: 31 }, (_, i) => opt(i + 1, i + 1)).join("");
  const months = MONTHS.map((m, i) => opt(i + 1, m)).join("");
  const years = [y, y + 1].map((v) => opt(v, `พ.ศ. ${v + 543}`)).join("");
  const hours = Array.from({ length: 24 }, (_, i) => opt(i, String(i).padStart(2, "0"))).join("");
  const mins = ["00", "15", "30", "45"].map((m) => opt(m, m)).join("") + opt("59", "59");
  return html`<fieldset class="thai-date" data-name="${name}" data-days="${defaultDays}">
    <legend>${label} <span class="muted small">${hint || ""}</span></legend>
    <label class="check"><input type="checkbox" data-part="on"> กำหนดวันเวลา</label>
    <div class="thai-date-row" hidden>
      <select data-part="d" aria-label="วัน">${raw(days)}</select>
      <select data-part="m" aria-label="เดือน">${raw(months)}</select>
      <select data-part="y" aria-label="ปี">${raw(years)}</select>
      <span class="muted">เวลา</span>
      <select data-part="h" aria-label="ชั่วโมง">${raw(hours)}</select> :
      <select data-part="i" aria-label="นาที">${raw(mins)}</select> น.
    </div></fieldset>`;
}
export function bindThaiDate(root, defaults = {}) {
  root.querySelectorAll(".thai-date").forEach((fs) => {
    const on = fs.querySelector('[data-part="on"]'), row = fs.querySelector(".thai-date-row");
    const def = defaults[fs.dataset.name];
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz(), year: "numeric", month: "numeric", day: "numeric", hour: "numeric", hourCycle: "h23" })
      .formatToParts(def ? new Date(def) : new Date(Date.now() + (+fs.dataset.days || 0) * 86400000)).reduce((o, p) => (o[p.type] = p.value, o), {});
    fs.querySelector('[data-part="d"]').value = +parts.day;
    fs.querySelector('[data-part="m"]').value = +parts.month;
    fs.querySelector('[data-part="y"]').value = +parts.year;
    const endOfDay = !def && +fs.dataset.days > 0;
    fs.querySelector('[data-part="h"]').value = endOfDay ? 23 : +parts.hour;
    fs.querySelector('[data-part="i"]').value = endOfDay ? "59" : "00";
    on.onchange = () => { row.hidden = !on.checked; };
  });
}
/** คืนค่า "YYYY-MM-DDTHH:mm" ตามเวลาไทย หรือ null ถ้าไม่ได้กำหนด */
export function readThaiDate(root, name) {
  const fs = root.querySelector(`.thai-date[data-name="${name}"]`);
  if (!fs || !fs.querySelector('[data-part="on"]').checked) return null;
  const g = (p) => fs.querySelector(`[data-part="${p}"]`).value;
  const p2 = (v) => String(v).padStart(2, "0");
  const d = +g("d"), m = +g("m"), y = +g("y");
  const max = new Date(y, m, 0).getDate();
  return `${y}-${p2(m)}-${p2(Math.min(d, max))}T${p2(g("h"))}:${p2(g("i"))}`;
}

// ---------- ปุ่มเลือกไฟล์ภาษาไทย ----------
export function filePicker(id, label = "เลือกรูปภาพ", accept = "image/png,image/jpeg,image/webp") {
  return html`<span class="file-pick"><input type="file" id="${id}" accept="${accept}" class="sr-only"><label for="${id}" class="btn btn-ghost btn-sm">🖼️ ${label}</label> <span class="muted small" data-file-name>ยังไม่ได้เลือกไฟล์</span></span>`;
}
export function readImage(file, maxKB = 150) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return reject(new Error("รองรับเฉพาะ PNG, JPEG หรือ WebP"));
    if (file.size > maxKB * 1024) return reject(new Error(`ไฟล์ใหญ่เกิน ${maxKB} KB`));
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
    r.readAsDataURL(file);
  });
}

// ---------- แจ้งเตือน ----------
export function toast(msg, kind = "ok") {
  let box = document.getElementById("toasts");
  if (!box) { box = document.createElement("div"); box.id = "toasts"; box.setAttribute("role", "status"); box.setAttribute("aria-live", "polite"); document.body.appendChild(box); }
  const t = document.createElement("div");
  t.className = `toast toast-${kind}`;
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 300); }, 3200);
}
export function confirmBox(message, okText = "ยืนยัน", danger = false) {
  return new Promise((resolve) => {
    const d = document.createElement("dialog");
    d.className = "modal";
    d.innerHTML = html`<form method="dialog"><p>${message}</p><div class="row end"><button value="no" class="btn btn-ghost">ยกเลิก</button><button value="yes" class="btn ${danger ? "btn-danger" : ""}">${okText}</button></div></form>`.s;
    document.body.appendChild(d);
    d.addEventListener("close", () => { resolve(d.returnValue === "yes"); d.remove(); });
    d.showModal();
  });
}
export function promptBox(message, placeholder = "") {
  return new Promise((resolve) => {
    const d = document.createElement("dialog");
    d.className = "modal";
    d.innerHTML = html`<form method="dialog"><label>${message}<input name="v" placeholder="${placeholder}" required></label><div class="row end"><button value="no" formnovalidate class="btn btn-ghost">ยกเลิก</button><button value="yes" class="btn">ตกลง</button></div></form>`.s;
    document.body.appendChild(d);
    d.addEventListener("close", () => { resolve(d.returnValue === "yes" ? d.querySelector("input").value.trim() : null); d.remove(); });
    d.showModal();
  });
}

// ---------- กราฟแท่งแบบเรียบง่าย ----------
export function barChart(rows, { label = (r) => r.label, value = (r) => r.value, unit = "", title = "" } = {}) {
  const max = Math.max(1, ...rows.map(value));
  return html`<figure class="bars" aria-label="${title}">
    <div class="bars-plot">${rows.map((r) => {
      const v = value(r);
      return html`<div class="bar-col" title="${label(r)}: ${fmtNum(v)} ${unit}"><span class="bar-val">${v ? fmtNum(v) : ""}</span><div class="bar" style="height:${Math.max(v ? 4 : 1, (v / max) * 100)}%"></div><span class="bar-label">${label(r)}</span></div>`;
    })}</div></figure>`;
}

// ---------- พลุฉลอง ----------
export function confetti() {
  const r = document.documentElement.dataset;
  if (r.confetti === "off" || r.motion === "reduce" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = document.createElement("div");
  c.className = "confetti";
  const colors = ["#6d4aff", "#ff7ab6", "#ffd166", "#06d6a0", "#4cc9f0"];
  for (let i = 0; i < 80; i++) {
    const p = document.createElement("i");
    p.style.left = Math.random() * 100 + "vw";
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = Math.random() * 0.6 + "s";
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    c.appendChild(p);
  }
  document.body.appendChild(c);
  setTimeout(() => c.remove(), 3500);
}

export const DIFF = { easy: "ง่าย", medium: "ปานกลาง", hard: "ยาก" };
export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];
export function formData(form) {
  const o = {};
  new FormData(form).forEach((v, k) => { o[k] = typeof v === "string" ? v.trim() : v; });
  form.querySelectorAll('input[type="checkbox"][name]').forEach((c) => { o[c.name] = c.checked; });
  return o;
}
export function busy(btn, on, text) {
  if (!btn) return;
  if (on) { btn.dataset.label = btn.innerHTML; btn.disabled = true; btn.innerHTML = text || "กำลังทำงาน…"; }
  else { btn.disabled = false; if (btn.dataset.label) btn.innerHTML = btn.dataset.label; }
}
export const levelInfo = (xp, per = 100) => ({ level: Math.floor(xp / per) + 1, into: xp % per, need: per - (xp % per), per });
