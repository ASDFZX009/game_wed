// QUIZ ODYSSEY เวอร์ชันเล่นบนเว็บ: ใช้หน้าเว็บชุดเดียวกับเวอร์ชันเต็ม แต่ทำงานในเบราว์เซอร์ล้วน
// เส้นทางใช้ #ชื่อ (เช่น #games, #game-5) เพื่อให้เปิดได้ทั้งบน GitHub Pages และ artifact
import { localApi, connectRemote, resetProgress, exportProgress, importProgress, useCloud, dropCloud, syncInfo, flushCloud, ownedByAccount, setAdmin } from "./local-api.js";
import { adminPage } from "./admin-static.js";
import * as C from "./cloud.js";
import { state, api, html, raw, toast, avatar, confirmBox, formData, busy, fmtDate } from "../public/js/core.js";
import { loadPrefs, setPrefs, isDark } from "../public/js/prefs.js";
import { loadProfile } from "../public/js/look.js";
import { pxPage } from "../public/js/pxpage.js";
import * as P from "../public/js/pages/public.js";
import * as S from "../public/js/pages/student.js";
import * as SH from "../public/js/pages/shop.js";
import * as BG from "../public/js/pages/bag.js";
import * as QG from "../public/js/pages/quizgame.js";

window.__LOCAL_API = localApi;

// ---------- เส้นทาง ----------
const ROUTES = [
  [/^\/$/, "", P.home], [/^\/games$/, "games", P.library], [/^\/games\/(\d+)$/, "game-$1", P.playGame, "id"],
  [/^\/quizzes$/, "quizzes", P.quizList], [/^\/quizzes\/(\d+)$/, "quiz-$1", P.quizPage, "id"], [/^\/attempts\/(\d+)$/, "attempt-$1", P.attemptPage, "id"],
  [/^\/dashboard$/, "dashboard", S.dashboard], [/^\/profile$/, "profile", S.profile], [/^\/shop$/, "shop", SH.shop], [/^\/bag$/, "bag", BG.bag], [/^\/quiz-game$/, "quiz-game", QG.quizGame],
  [/^\/settings$/, "prefs", S.settings], [/^\/admin$/, "admin", (ctx) => adminPage({ ...ctx, go, refreshMe })], [/^\/privacy$/, "privacy", privacyLocal],
  [/^\/login$/, "login", loginPage], [/^\/register$/, "register", registerPage], [/^\/forgot$/, "forgot", forgotPage], [/^\/reset-password$/, "reset-password", resetPage],
];
const HASH = [
  [/^$/, "/"], [/^games$/, "/games"], [/^game-(\d+)$/, "/games/$1"], [/^quizzes$/, "/quizzes"], [/^quiz-(\d+)$/, "/quizzes/$1"],
  [/^attempt-(\d+)$/, "/attempts/$1"], [/^dashboard$/, "/dashboard"], [/^profile$/, "/profile"], [/^shop$/, "/shop"], [/^bag$/, "/bag"], [/^quiz-game$/, "/quiz-game"], [/^prefs$/, "/settings"], [/^admin$/, "/admin"], [/^settings$/, "/settings"], [/^privacy$/, "/privacy"],
  [/^login$/, "/login"], [/^register$/, "/register"], [/^forgot$/, "/forgot"], [/^reset-password$/, "/reset-password"],
];
let pending = null; // ที่อยู่เต็ม (รวม ?query) ที่รอแสดง
// เก็บได้หลายตัว (หน้าเดียวอาจลงทะเบียนหลายอย่าง: ฉาก, คลาสของ body, ตัวจับเวลา)
let cleanups = [];
export function onLeave(fn) { cleanups.push(fn); }
export const homeFor = () => "/dashboard";
export async function refreshMe() { const { user } = await api("/api/auth/me"); state.me = user; loadPrefs(); renderNav(); }

function pathToHash(path) {
  const p = path.split("?")[0];
  for (const [re, name] of ROUTES) if (re.test(p)) return p.replace(re, name);
  return "full";
}
function hashToPath(h) {
  for (const [re, p] of HASH) if (re.test(h)) return h.replace(re, p);
  return h === "full" ? "/full" : "/";
}
export function go(path, _replace) {
  pending = path;
  const name = pathToHash(path);
  if (location.hash.slice(1) === name) render(); else location.hash = name;
}

async function render() {
  const cl = cleanups; cleanups = []; for (const fn of cl.reverse()) { try { fn(); } catch { /* ignore */ } }
  const h = decodeURIComponent(location.hash.slice(1));
  const full = pending && pathToHash(pending) === h ? pending : hashToPath(h);
  pending = null;
  const [path, qs] = full.split("?");
  const main = document.getElementById("app");
  document.body.classList.remove("menu-open");
  renderNav(path);
  window.scrollTo(0, 0);
  if (path === "/full") return fullOnly(main);
  const r = ROUTES.find(([re]) => re.test(path));
  if (!r) return P.notFound({ main });
  const m = r[0].exec(path);
  main.innerHTML = '<div class="loading" aria-busy="true">กำลังโหลด…</div>';
  try { await r[2]({ main, params: r[3] ? { [r[3]]: m[1] } : {}, query: new URLSearchParams(qs || ""), me: state.me }); }
  catch (e) { if (e.status === 404) P.notFound({ main }); else main.innerHTML = html`<div class="card center"><h2>เกิดข้อผิดพลาด</h2><p>${e.message}</p><a class="btn" href="/">กลับหน้าแรก</a></div>`.s; }
  document.title = (main.querySelector("h1")?.textContent?.trim() || "QUIZ ODYSSEY") + " · QUIZ ODYSSEY";
}

function fullOnly(main) {
  main.innerHTML = html`<div class="card center narrow" style="padding:30px"><div style="font-size:3rem">🏫</div><h1>มีในเวอร์ชันเต็ม</h1>
    <p class="muted">ห้องเรียน งานที่ครูมอบหมาย เครื่องมือครู และแข่งสดหลายเครื่อง ต้องใช้เวอร์ชันเต็มที่มีเซิร์ฟเวอร์</p>
    <p><a href="https://github.com/ASDFZX009/game_wed/tree/hamo-frontend">ดูวิธีติดตั้งเวอร์ชันเต็มบน GitHub</a></p><a class="btn" href="/games">กลับไปเล่นเกม</a></div>`.s;
}
function privacyLocal({ main }) {
  main.innerHTML = html`<article class="prose"><h1>ความเป็นส่วนตัว</h1>
    <p>QUIZ ODYSSEY เวอร์ชันเล่นบนเว็บ <b>ไม่ต้องสมัครสมาชิก ไม่ส่งข้อมูลไปที่เซิร์ฟเวอร์ใด</b> ความคืบหน้า (ชื่อที่ตั้ง XP เหรียญ ของสะสม และการตั้งค่า) เก็บไว้ในเบราว์เซอร์ของคุณเท่านั้น</p>
    ${state.config.cloud ? html`<p><b>ถ้าสมัครสมาชิก:</b> เราเก็บอีเมล ชื่อที่แสดง รหัสผ่าน (เข้ารหัสแบบทางเดียว อ่านกลับไม่ได้) และความคืบหน้าไว้ในฐานข้อมูล Supabase เพื่อให้เล่นต่อได้ทุกเครื่อง ผู้เล่นคนอื่นมองไม่เห็นข้อมูลของคุณ และลบบัญชีพร้อมข้อมูลทั้งหมดได้เองที่หน้า “ตั้งค่า”</p>` : ""}
    <ul><li>ไม่มีโฆษณา ไม่มีคุกกี้ติดตาม</li><li>ล้างข้อมูลเบราว์เซอร์แล้วความคืบหน้าจะหาย — สำรองได้ที่หน้า “ตั้งค่า”</li>
    <li>ถ้าเปิดผ่านลิงก์ artifact ของ Claude ความคืบหน้าจะเก็บในพื้นที่ส่วนตัวของบัญชี Claude ของคุณด้วย (คนอื่นมองไม่เห็น)</li>
    <li>ไม่มีการซื้อด้วยเงินจริง เหรียญได้จากการเล่นเท่านั้น</li></ul></article>`.s;
}

// ---------- เมนู ----------
function link(href, text, cur) {
  const on = href === "/" ? cur === "/" : cur === href || cur.startsWith(href + "/");
  return html`<a href="${href}" class="${on ? "active" : ""}" ${on ? raw('aria-current="page"') : ""}>${text}</a>`;
}
function renderNav(cur = "/") {
  const u = state.me || {};
  document.getElementById("nav").innerHTML = html`<div class="wrap topbar">
    <a href="/" class="logo" aria-label="QUIZ ODYSSEY หน้าแรก"><span aria-hidden="true">🧭</span> QUIZ ODYSSEY</a>
    <button class="hamburger" id="menuBtn" aria-label="เปิดเมนู" aria-expanded="false" aria-controls="menu"><span></span><span></span><span></span></button>
    <div class="menu" id="menu"><nav class="links" aria-label="เมนูหลัก">${link("/games", "คลังเกม", cur)}${link("/quizzes", "แบบทดสอบ", cur)}${link("/quiz-game", "🎣 เกมตอบคำถาม", cur)}${link("/dashboard", "📖 สมุดผจญภัย", cur)}${link("/shop", "🛒 ร้านค้า", cur)}${link("/bag", "🎒 กระเป๋า", cur)}</nav>
      <div class="nav-right">${state.config?.cloud && !u.cloud ? html`<a href="/login" class="btn btn-sm nav-login">🔐 เข้าสู่ระบบ</a>` : ""}${u.admin ? html`<a href="/admin" class="${cur === "/admin" ? "active" : ""}" title="ผู้ดูแลระบบ">🛡️ แอดมิน</a>` : ""}<a href="/shop" class="coins" title="เหรียญของฉัน">🪙 ${(u.coins || 0).toLocaleString("th-TH")}</a>
        <a href="/profile" class="me">${avatar(u.equipped)} <span class="ellipsis">${u.displayName || ""}</span>${u.cloud ? html`<span title="บันทึกในบัญชีออนไลน์" aria-label="บันทึกในบัญชีออนไลน์">☁️</span>` : ""}</a><a href="/settings">⚙️ ตั้งค่า</a>
        <button class="theme" id="themeBtn" aria-label="สลับโหมดมืด/สว่าง" title="สลับโหมดมืด/สว่าง">🌓</button></div></div></div>`.s;
  document.getElementById("menuBtn").onclick = () => { const o = document.body.classList.toggle("menu-open"); document.getElementById("menuBtn").setAttribute("aria-expanded", o); };
  document.getElementById("themeBtn").onclick = () => { setPrefs({ mode: isDark() ? "light" : "dark" }); };
  const items = [["/", "🏠", "หน้าแรก"], ["/games", "🎮", "คลังเกม"], ["/quizzes", "📝", "แบบทดสอบ"], ["/bag", "🎒", "กระเป๋า"], ["/shop", "🛒", "ร้านค้า"]];
  document.getElementById("bnav").innerHTML = items.map(([href, i, t]) => {
    const on = href === "/" ? cur === "/" : cur === href || cur.startsWith(href + "/");
    return html`<a href="${href}" class="${on ? "active" : ""}"><span class="i" aria-hidden="true">${i}</span>${t}</a>`.s;
  }).join("");
  document.body.classList.add("has-bottom-nav");
}

// ---------- บัญชีออนไลน์ ----------
const store = { load: C.loadProgress, save: C.saveProgress, pending: C.pendingGrants, claim: C.claimGrants };
// เข้าระบบแล้ว: ตรวจสิทธิ์แอดมินที่ Supabase และแจ้งของขวัญที่ได้รับ
async function connectAccount(u) { const r = await useCloud(store, u, C.displayNameOf(u)); setAdmin(await C.checkAdmin()); if (r.gifts?.length) setTimeout(() => toast(`🎁 ได้รับของขวัญจากผู้ดูแล: ${r.gifts.join(", ")} — ดูได้ในกระเป๋า`), 900); return r; }
const pwOk = (p) => p.length >= 8;
async function withBusy(btn, fn) { busy(btn, true); try { await fn(); } finally { if (btn.isConnected) busy(btn, false); } }
function authCard(main, title, body, foot = "") {
  pxPage(onLeave);
  main.innerHTML = html`<div class="narrower auth-wrap"><h1 class="px-sign">🧭 ${title}</h1><div class="card">
    ${raw(body.s || body)}</div>${raw(foot.s || foot)}</div>`.s;
}
function needCloud(main) {
  if (state.config.cloud) return false;
  authCard(main, "ระบบบัญชียังไม่เปิดใช้", html`<p class="muted">ตอนนี้เล่นได้เลยโดยไม่ต้องสมัคร ความคืบหน้าเก็บในเบราว์เซอร์นี้</p>
    <p class="small muted">สำหรับเจ้าของเว็บ: เปิดระบบบัญชีได้โดยเชื่อม Supabase ตามขั้นตอนใน README หัวข้อ “บัญชีผู้ใช้ (Supabase)”</p><a class="btn" href="/games">ไปเล่นเกม</a>`);
  return true;
}
// หลังเข้าสู่ระบบ/สร้างบัญชี: ยังไม่มีตัวละคร (หรือบัญชีใหม่) → หน้าสร้างตัวละคร แล้วเข้าหมู่บ้าน
function enterAfterAuth(isNew) {
  try { if (isNew || !loadProfile()) sessionStorage.setItem("qo:titleOpen", "custom"); sessionStorage.setItem("qo:titleSeen", "1"); } catch { /* ignore */ }
  go("/");
}
async function afterLogin(main) {
  const u = C.currentUser();
  const { isNew } = await connectAccount(u);
  await refreshMe();
  toast(isNew ? `สร้างบัญชีแล้ว ยินดีต้อนรับ ${state.me.displayName}! รับ 150 🪙 ต้อนรับ ☁️` : `ยินดีต้อนรับกลับ ${state.me.displayName} 👋`);
  enterAfterAuth(isNew);
}
function emailSent(main, email, kind) {
  authCard(main, kind === "reset" ? "ตรวจอีเมลของคุณ 📬" : "ยืนยันอีเมลอีกขั้นเดียว 📬", html`
    <p>เราส่งลิงก์ไปที่ <b>${email}</b> แล้ว${kind === "reset" ? " (ถ้าอีเมลนี้มีบัญชีอยู่)" : ""}</p>
    <ol class="small"><li>เปิดอีเมลจาก Supabase (ถ้าไม่เจอ ดูในโฟลเดอร์ <b>สแปม/โปรโมชัน</b>)</li>
      <li>กดลิงก์ในอีเมล ระบบจะพากลับมาที่เว็บนี้${kind === "reset" ? "เพื่อตั้งรหัสผ่านใหม่" : "และเข้าสู่ระบบให้อัตโนมัติ"}</li></ol>
    ${kind === "signup" ? html`<button class="btn btn-ghost btn-sm" id="resend">ส่งอีเมลยืนยันอีกครั้ง</button>` : ""}
    <p style="margin-top:14px"><a href="/login">กลับไปหน้าเข้าสู่ระบบ</a></p>`);
  const b = main.querySelector("#resend");
  if (b) b.onclick = () => withBusy(b, async () => { try { await C.resendConfirm(email); toast("ส่งอีเมลยืนยันอีกครั้งแล้ว"); } catch (e) { toast(e.message, "bad"); } });
}
function loginPage({ main, query }) {
  if (needCloud(main)) return;
  if (state.me?.cloud) return go("/dashboard", true);
  authCard(main, "เข้าสู่ระบบ", html`<form id="f" novalidate>
      <label for="e">อีเมล</label><input id="e" name="email" type="email" autocomplete="username" required value="${query.get("email") || ""}">
      <label for="p">รหัสผ่าน</label><input id="p" name="password" type="password" autocomplete="current-password" required>
      <p class="err" id="msg" role="alert" hidden></p>
      <button class="btn btn-block btn-lg" style="margin-top:12px">เข้าสู่ระบบ</button></form>
    <div class="row between small" style="margin-top:12px"><a href="/forgot">ลืมรหัสผ่าน?</a><a href="/register">ยังไม่มีบัญชี? <b>สมัครสมาชิก</b></a></div>`,
    html`<p class="small muted center" style="margin-top:12px">ความคืบหน้าแต่ละบัญชีแยกกัน ออกจากระบบแล้วกลับไปเล่นแบบไม่ล็อกอินต่อได้</p>`);
  const f = main.querySelector("#f"), msg = main.querySelector("#msg");
  f.onsubmit = (e) => {
    e.preventDefault();
    const d = formData(f);
    msg.hidden = true;
    if (!d.email || !d.password) { msg.textContent = "กรอกอีเมลและรหัสผ่าน"; msg.hidden = false; return; }
    withBusy(f.querySelector("button.btn"), async () => {
      try { await C.signIn(d); await afterLogin(main); }
      catch (er) {
        msg.textContent = er.message; msg.hidden = false;
        if (er.code === "email_not_confirmed") {
          const rb = Object.assign(document.createElement("button"), { type: "button", className: "btn btn-ghost btn-sm", textContent: "ส่งอีเมลยืนยันอีกครั้ง" });
          rb.onclick = () => withBusy(rb, async () => { try { await C.resendConfirm(d.email); toast("ส่งแล้ว ตรวจอีเมลได้เลย"); } catch (x) { toast(x.message, "bad"); } });
          msg.append(document.createElement("br"), rb);
        }
      }
    });
  };
  main.querySelector("#e").focus();
}
function registerPage({ main }) {
  if (needCloud(main)) return;
  if (state.me?.cloud) return go("/dashboard", true);
  authCard(main, "สมัครสมาชิก", html`<form id="f" novalidate>
      <label for="n">ชื่อที่แสดง <span class="muted small">(ไม่ต้องใช้ชื่อจริง)</span></label><input id="n" name="displayName" maxlength="40" required value="${state.me?.displayName && state.me.displayName !== "นักผจญภัย" ? state.me.displayName : ""}">
      <label for="e">อีเมล</label><input id="e" name="email" type="email" autocomplete="username" required>
      <label for="p">รหัสผ่าน <span class="muted small">(อย่างน้อย 8 ตัว)</span></label><input id="p" name="password" type="password" minlength="8" autocomplete="new-password" required>
      <label for="p2">พิมพ์รหัสผ่านอีกครั้ง</label><input id="p2" name="password2" type="password" autocomplete="new-password" required>
      <p class="err" id="msg" role="alert" hidden></p>
      <button class="btn btn-block btn-lg" style="margin-top:12px">สร้างบัญชี</button></form>
    <p class="small" style="margin-top:12px">มีบัญชีแล้ว? <a href="/login"><b>เข้าสู่ระบบ</b></a></p>`,
    html`<p class="small muted center" style="margin-top:12px">บัญชีใหม่เริ่มต้นใหม่ พร้อม 150 🪙 ต้อนรับ (ของที่เล่นแบบไม่ล็อกอินยังอยู่ในเครื่องนี้) · <a href="/privacy">ความเป็นส่วนตัว</a></p>`);
  const f = main.querySelector("#f"), msg = main.querySelector("#msg");
  const fail = (t) => { msg.textContent = t; msg.hidden = false; };
  f.onsubmit = (e) => {
    e.preventDefault();
    const d = formData(f);
    msg.hidden = true;
    d.displayName = (d.displayName || "").trim();
    if (!d.displayName) return fail("กรุณาใส่ชื่อที่แสดง");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email || "")) return fail("อีเมลไม่ถูกต้อง");
    if (!pwOk(d.password || "")) return fail("รหัสผ่านต้องมีอย่างน้อย 8 ตัว");
    if (d.password !== d.password2) return fail("รหัสผ่านสองช่องไม่ตรงกัน");
    withBusy(f.querySelector("button.btn"), async () => {
      try {
        const r = await C.signUp(d);
        if (r.session) await afterLogin(main); else emailSent(main, d.email, "signup");
      } catch (er) { fail(er.message); }
    });
  };
  main.querySelector("#n").focus();
}
function forgotPage({ main }) {
  if (needCloud(main)) return;
  authCard(main, "ลืมรหัสผ่าน", html`<p class="muted">ใส่อีเมลที่ใช้สมัคร เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้</p>
    <form id="f" novalidate><label for="e">อีเมล</label><input id="e" name="email" type="email" autocomplete="username" required>
    <p class="err" id="msg" role="alert" hidden></p><button class="btn btn-block" style="margin-top:12px">ส่งลิงก์ตั้งรหัสผ่านใหม่</button></form>
    <p class="small" style="margin-top:12px"><a href="/login">กลับไปหน้าเข้าสู่ระบบ</a></p>`);
  const f = main.querySelector("#f"), msg = main.querySelector("#msg");
  f.onsubmit = (e) => {
    e.preventDefault();
    const { email } = formData(f);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "")) { msg.textContent = "อีเมลไม่ถูกต้อง"; msg.hidden = false; return; }
    withBusy(f.querySelector("button.btn"), async () => { try { await C.sendReset(email); emailSent(main, email, "reset"); } catch (er) { msg.textContent = er.message; msg.hidden = false; } });
  };
}
function resetPage({ main }) {
  if (needCloud(main)) return;
  if (!C.currentUser()) {
    authCard(main, "ลิงก์หมดอายุ", html`<p class="muted">เปิดหน้านี้จากลิงก์ในอีเมลเท่านั้น หรือลิงก์อาจหมดอายุแล้ว</p><a class="btn" href="/forgot">ขอลิงก์ใหม่</a>`);
    return;
  }
  authCard(main, "ตั้งรหัสผ่านใหม่", html`<p class="muted">บัญชี: <b>${C.currentUser().email}</b></p><form id="f" novalidate>
      <label for="p">รหัสผ่านใหม่ <span class="muted small">(อย่างน้อย 8 ตัว)</span></label><input id="p" name="password" type="password" minlength="8" autocomplete="new-password" required>
      <label for="p2">พิมพ์อีกครั้ง</label><input id="p2" name="password2" type="password" autocomplete="new-password" required>
      <p class="err" id="msg" role="alert" hidden></p><button class="btn btn-block" style="margin-top:12px">บันทึกรหัสผ่านใหม่</button></form>`);
  const f = main.querySelector("#f"), msg = main.querySelector("#msg");
  f.onsubmit = (e) => {
    e.preventDefault();
    const d = formData(f);
    const fail = (t) => { msg.textContent = t; msg.hidden = false; };
    if (!pwOk(d.password || "")) return fail("รหัสผ่านต้องมีอย่างน้อย 8 ตัว");
    if (d.password !== d.password2) return fail("รหัสผ่านสองช่องไม่ตรงกัน");
    withBusy(f.querySelector("button.btn"), async () => { try { await C.updatePassword(d.password); toast("ตั้งรหัสผ่านใหม่แล้ว ✅"); go("/dashboard"); } catch (er) { fail(er.message); } });
  };
}
function bindCloudBox(main) {
  const box = main.querySelector("#cloudBox");
  if (!box || !state.config.cloud) return;
  const u = C.currentUser();
  if (!state.me?.cloud || !u) {
    box.innerHTML = html`<div class="cloud-card"><div class="ic">☁️</div><div><b>เก็บความคืบหน้าไว้ในบัญชี</b>
      <p class="small muted" style="margin:2px 0 8px">สมัครฟรี ความคืบหน้าเก็บในบัญชี เล่นต่อได้ทุกเครื่อง ไม่หายตอนล้างเบราว์เซอร์ (บัญชีใหม่เริ่มต้นใหม่ ของที่เล่นแบบไม่ล็อกอินยังอยู่ในเครื่องนี้)</p>
      <div class="row"><a class="btn btn-sm" href="/register">สมัครสมาชิก</a><a class="btn btn-ghost btn-sm" href="/login">เข้าสู่ระบบ</a></div></div></div>`.s;
    return;
  }
  const status = () => syncInfo.error ? html`<span style="color:var(--bad)">⚠️ บันทึกไม่สำเร็จ: ${syncInfo.error}</span>` : syncInfo.at ? html`บันทึกในบัญชีล่าสุด ${fmtDate(syncInfo.at)}` : html`เชื่อมต่อบัญชีแล้ว`;
  box.innerHTML = html`<div class="cloud-card on"><div class="ic">☁️</div><div style="flex:1;min-width:0"><b>เข้าสู่ระบบเป็น ${u.email}</b>
    <p class="small muted" style="margin:2px 0 8px" id="syncSt">${status()}</p>
    <div class="row"><button class="btn btn-ghost btn-sm" id="cSync">🔄 บันทึกตอนนี้</button><button class="btn btn-ghost btn-sm" id="cPw">🔑 เปลี่ยนรหัสผ่าน</button>
      <button class="btn btn-sm" id="cOut">🚪 ออกจากระบบ</button><button class="btn btn-danger btn-sm" id="cDel">ลบบัญชี</button></div>
    <div id="cPwBox"></div></div></div>`.s;
  main.querySelector("#cSync").onclick = (e) => withBusy(e.target, async () => { await flushCloud(); await store.save(JSON.parse(exportProgress())).then(() => { syncInfo.at = new Date().toISOString(); syncInfo.error = null; }).catch((x) => { syncInfo.error = x.message; }); main.querySelector("#syncSt").innerHTML = status().s; toast(syncInfo.error ? "บันทึกไม่สำเร็จ" : "บันทึกแล้ว ☁️", syncInfo.error ? "bad" : undefined); });
  main.querySelector("#cPw").onclick = () => {
    const pb = main.querySelector("#cPwBox");
    pb.innerHTML = html`<form id="pwf" class="stack" style="margin-top:10px" novalidate><label for="np">รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)</label><input id="np" name="password" type="password" minlength="8" autocomplete="new-password" required>
      <label for="np2">พิมพ์อีกครั้ง</label><input id="np2" name="password2" type="password" autocomplete="new-password" required><div class="row"><button class="btn btn-sm">บันทึก</button></div></form>`.s;
    const pf = pb.querySelector("#pwf");
    pf.onsubmit = (e) => { e.preventDefault(); const d = formData(pf); if (!pwOk(d.password || "")) return toast("รหัสผ่านต้องมีอย่างน้อย 8 ตัว", "bad"); if (d.password !== d.password2) return toast("รหัสผ่านสองช่องไม่ตรงกัน", "bad");
      withBusy(pf.querySelector("button"), async () => { try { await C.updatePassword(d.password); pb.innerHTML = ""; toast("เปลี่ยนรหัสผ่านแล้ว ✅"); } catch (x) { toast(x.message, "bad"); } }); };
    pb.querySelector("#np").focus();
  };
  main.querySelector("#cOut").onclick = (e) => withBusy(e.target, async () => { await dropCloud(); await C.signOut(); await refreshMe(); toast("ออกจากระบบแล้ว ความคืบหน้าอยู่ในบัญชีเรียบร้อย"); go("/"); });
  main.querySelector("#cDel").onclick = async () => {
    if (!(await confirmBox(`ลบบัญชี ${u.email} พร้อมความคืบหน้าทั้งหมดถาวร? กู้คืนไม่ได้`, "ลบบัญชีถาวร", true))) return;
    try { await C.deleteAccount(); await dropCloud(); await refreshMe(); toast("ลบบัญชีแล้ว"); go("/"); } catch (x) { toast(x.message, "bad"); }
  };
}
C.onAuthChange((u) => { // เซสชันหมดอายุระหว่างเล่น
  if (!u && state.me?.cloud) { dropCloud().then(refreshMe).then(() => { toast("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่", "bad"); go("/login"); }); }
});

// ---------- ตั้งค่า: ชื่อผู้เล่น สำรอง/กู้คืน เริ่มใหม่ ----------
window.__bindLocalSettings = (main) => {
  bindCloudBox(main);
  const box = main.querySelector("#ioBox");
  main.querySelector("#lf").onsubmit = async (e) => { e.preventDefault(); try { await api("/api/auth/account", { method: "PATCH", body: { displayName: e.target.displayName.value } }); await refreshMe(); toast("บันทึกชื่อแล้ว"); } catch (er) { toast(er.message, "bad"); } };
  main.querySelector("#exp").onclick = () => {
    box.innerHTML = html`<label for="expT">คัดลอกข้อความนี้ไปเก็บไว้ (เช่น ส่งให้ตัวเองในแชท)</label><textarea id="expT" rows="4" readonly>${exportProgress()}</textarea><button class="btn btn-sm" id="cp">📋 คัดลอก</button>`.s;
    box.querySelector("#cp").onclick = async () => { try { await navigator.clipboard.writeText(box.querySelector("#expT").value); toast("คัดลอกแล้ว"); } catch { box.querySelector("#expT").select(); toast("เลือกข้อความแล้ว กดคัดลอกได้เลย"); } };
  };
  main.querySelector("#imp").onclick = () => {
    box.innerHTML = html`<label for="impT">วางข้อความสำรอง</label><textarea id="impT" rows="4"></textarea><button class="btn btn-sm" id="doImp">กู้คืน</button>`.s;
    box.querySelector("#doImp").onclick = async () => { try { importProgress(box.querySelector("#impT").value.trim()); await refreshMe(); toast("กู้คืนความคืบหน้าแล้ว 🎉"); go("/dashboard"); } catch { toast("ข้อความสำรองไม่ถูกต้อง", "bad"); } };
  };
  main.querySelector("#wipe").onclick = async () => {
    if (!(await confirmBox("ลบความคืบหน้าทั้งหมด (XP เหรียญ ของสะสม) แล้วเริ่มใหม่? กู้คืนไม่ได้ถ้าไม่ได้สำรองไว้", "เริ่มใหม่", true))) return;
    resetProgress(); await refreshMe(); toast("เริ่มใหม่แล้ว"); go("/");
  };
};

// ---------- เริ่มต้น ----------
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[href]");
  if (!a || a.target || e.ctrlKey || e.metaKey || e.shiftKey) return;
  const href = a.getAttribute("href");
  if (href.startsWith("#") && href.length > 1 && document.getElementById(href.slice(1)) && !ROUTES.some(([, n]) => n === href.slice(1))) {
    e.preventDefault(); document.getElementById(href.slice(1)).scrollIntoView({ behavior: "smooth" }); return; // ลิงก์ภายในหน้า (เช่นหน้าตั้งค่า)
  }
  if (!href.startsWith("/") || href.startsWith("//")) return;
  e.preventDefault();
  go(href.startsWith("/api/") ? "/full" : href);
});
window.addEventListener("hashchange", () => {
  // ลิงก์จากอีเมลเปิดในแท็บที่เปิดเว็บไว้อยู่แล้ว: โหลดใหม่เพื่อรับโทเคน
  if (/(^|&)(access_token|error)=/.test(location.hash.slice(1))) return location.reload();
  render();
});
(async () => {
  const ci = await C.initCloud();
  state.config = { ...(await api("/api/config")), cloud: ci.enabled };
  if (ci.enabled && C.currentUser()) {
    try { await connectAccount(C.currentUser()); }
    catch (e) { if (!e.expired) toast("โหลดความคืบหน้าจากบัญชีไม่ได้: " + e.message, "bad"); }
  }
  else if (ownedByAccount()) await dropCloud(); // เซสชันหายไปแล้ว: ไม่แสดงความคืบหน้าของบัญชีค้างไว้
  state.me = (await api("/api/auth/me")).user;
  loadPrefs();
  if (ci.link?.error) { toast(ci.link.error, "bad"); location.hash = "login"; }
  else if (ci.link?.type === "recovery") location.hash = "reset-password";
  else if (ci.link) { toast(`ยืนยันอีเมลเรียบร้อย ยินดีต้อนรับ ${state.me.displayName}! ☁️`); enterAfterAuth(ci.link.type === "signup"); }
  render();
  if (!ci.enabled) connectRemote(async () => { await refreshMe(); render(); toast("โหลดความคืบหน้าจากบัญชีของคุณแล้ว"); });
})();
