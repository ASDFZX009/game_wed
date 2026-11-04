// การตั้งค่าการแสดงผล: ธีมสี โหมดมืด ขนาดตัวอักษร การเคลื่อนไหว เสียง ฯลฯ
// ผู้เยี่ยมชม: เก็บในเบราว์เซอร์ · สมาชิก: เก็บกับบัญชี (ตามไปทุกเครื่อง)
import { state, api } from "./core.js";

export const DEFAULTS = { mode: "auto", palette: "violet", fontSize: "md", motion: "auto", sound: true, confetti: true, autoNext: false, contrast: false, dyslexic: false };

export const PALETTES = [
  { id: "violet", name: "ม่วงจักรวาล", icon: "🔮", c: ["#5b3df5", "#ff6fae"] },
  { id: "ocean", name: "ทะเลฟ้าใส", icon: "🌊", c: ["#0b63c5", "#22c3e6"] },
  { id: "forest", name: "ป่าเขียว", icon: "🌳", c: ["#15803d", "#84cc16"] },
  { id: "sunset", name: "พระอาทิตย์ตก", icon: "🌅", c: ["#c2410c", "#f59e0b"] },
  { id: "sakura", name: "ซากุระ", icon: "🌸", c: ["#be185d", "#f472b6"] },
  { id: "emerald", name: "มรกตใต้ทะเล", icon: "🐢", c: ["#0f766e", "#2dd4bf"] },
];

const KEY = "eduplay:prefs";
let current = { ...DEFAULTS };
let saveTimer = null;

function readLocal() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null");
    if (v) return v;
    const old = localStorage.getItem("theme"); // ค่าจากปุ่มสลับธีมรุ่นก่อน
    return old ? { mode: old } : {};
  } catch { return {}; }
}
function writeLocal(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* โหมดส่วนตัวบางเบราว์เซอร์ */ } }

export const getPrefs = () => ({ ...current });

/** โหลดค่า: บัญชีมาก่อน ถ้าไม่ได้ล็อกอินใช้ค่าในเบราว์เซอร์ */
export function loadPrefs() {
  const fromUser = state.me?.prefs && Object.keys(state.me.prefs).length ? state.me.prefs : null;
  const local = readLocal();
  current = { ...DEFAULTS, ...(fromUser || local) };
  applyPrefs(current);
  // ล็อกอินครั้งแรกบนบัญชีที่ยังไม่มีค่า: เก็บค่าที่ตั้งไว้ในเบราว์เซอร์นี้ไปกับบัญชี
  if (state.me && !fromUser && Object.keys(local).length) setPrefs({});
  return current;
}

export function applyPrefs(p = current) {
  const r = document.documentElement;
  r.dataset.theme = p.mode === "auto" ? "" : p.mode;
  r.dataset.palette = p.palette;
  r.dataset.font = p.fontSize;
  r.dataset.motion = p.motion;
  r.dataset.contrast = p.contrast ? "high" : "";
  r.dataset.dyslexic = p.dyslexic ? "1" : "";
  r.dataset.confetti = p.confetti ? "" : "off";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = (PALETTES.find((x) => x.id === p.palette) || PALETTES[0]).c[0];
}

/** เปลี่ยนค่าแล้วมีผลทันที และบันทึก (ถ้าเป็นสมาชิกจะส่งไปเก็บกับบัญชี) */
export function setPrefs(patch) {
  current = { ...current, ...patch };
  applyPrefs(current);
  writeLocal(current);
  if (state.me) {
    state.me.prefs = { ...current };
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => api("/api/auth/prefs", { method: "PUT", body: current }).catch(() => {}), 400);
  }
  return current;
}

export function isDark() {
  return current.mode === "dark" || (current.mode === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
}
export const reducedMotion = () => current.motion === "reduce" || matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- เสียงประกอบ (สร้างด้วย Web Audio ไม่ต้องโหลดไฟล์) ----------
let ctx = null;
function tone(freq, start, dur, type = "sine", vol = 0.12) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, ctx.currentTime + start);
  g.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + start); o.stop(ctx.currentTime + start + dur + 0.02);
}
export function playSound(kind) {
  if (!current.sound) return;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    if (kind === "correct") { tone(660, 0, 0.12); tone(880, 0.1, 0.18); }
    else if (kind === "wrong") { tone(220, 0, 0.22, "triangle"); tone(180, 0.12, 0.25, "triangle"); }
    else if (kind === "win") { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.22)); }
    else if (kind === "flip") tone(520, 0, 0.06, "square", 0.04);
    else if (kind === "tick") tone(1000, 0, 0.05, "square", 0.03);
  } catch { /* เบราว์เซอร์ไม่รองรับเสียง */ }
}
