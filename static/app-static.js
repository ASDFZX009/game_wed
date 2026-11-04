// EduPlay เวอร์ชันเล่นบนเว็บ: ใช้หน้าเว็บชุดเดียวกับเวอร์ชันเต็ม แต่ทำงานในเบราว์เซอร์ล้วน
// เส้นทางใช้ #ชื่อ (เช่น #games, #game-5) เพื่อให้เปิดได้ทั้งบน GitHub Pages และ artifact
import { localApi, connectRemote, resetProgress, exportProgress, importProgress } from "./local-api.js";
import { state, api, html, raw, toast, avatar, confirmBox } from "../public/js/core.js";
import { loadPrefs, setPrefs, isDark } from "../public/js/prefs.js";
import * as P from "../public/js/pages/public.js";
import * as S from "../public/js/pages/student.js";
import * as SH from "../public/js/pages/shop.js";

window.__LOCAL_API = localApi;

// ---------- เส้นทาง ----------
const ROUTES = [
  [/^\/$/, "", P.home], [/^\/games$/, "games", P.library], [/^\/games\/(\d+)$/, "game-$1", P.playGame, "id"],
  [/^\/quizzes$/, "quizzes", P.quizList], [/^\/quizzes\/(\d+)$/, "quiz-$1", P.quizPage, "id"], [/^\/attempts\/(\d+)$/, "attempt-$1", P.attemptPage, "id"],
  [/^\/dashboard$/, "dashboard", S.dashboard], [/^\/profile$/, "profile", S.profile], [/^\/shop$/, "shop", SH.shop],
  [/^\/settings$/, "prefs", S.settings], [/^\/privacy$/, "privacy", privacyLocal],
];
const HASH = [
  [/^$/, "/"], [/^games$/, "/games"], [/^game-(\d+)$/, "/games/$1"], [/^quizzes$/, "/quizzes"], [/^quiz-(\d+)$/, "/quizzes/$1"],
  [/^attempt-(\d+)$/, "/attempts/$1"], [/^dashboard$/, "/dashboard"], [/^profile$/, "/profile"], [/^shop$/, "/shop"], [/^prefs$/, "/settings"], [/^settings$/, "/settings"], [/^privacy$/, "/privacy"],
];
let pending = null; // ที่อยู่เต็ม (รวม ?query) ที่รอแสดง
let cleanup = null;
export function onLeave(fn) { cleanup = fn; }
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
  if (cleanup) { try { cleanup(); } catch { /* ignore */ } cleanup = null; }
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
  document.title = (main.querySelector("h1")?.textContent?.trim() || "EduPlay") + " · EduPlay";
}

function fullOnly(main) {
  main.innerHTML = html`<div class="card center narrow" style="padding:30px"><div style="font-size:3rem">🏫</div><h1>มีในเวอร์ชันเต็ม</h1>
    <p class="muted">ห้องเรียน งานที่ครูมอบหมาย เครื่องมือครู แข่งสดหลายเครื่อง และระบบบัญชี ต้องใช้เวอร์ชันเต็มที่มีเซิร์ฟเวอร์</p>
    <p><a href="https://github.com/ASDFZX009/game_wed/tree/hamo-frontend">ดูวิธีติดตั้งเวอร์ชันเต็มบน GitHub</a></p><a class="btn" href="/games">กลับไปเล่นเกม</a></div>`.s;
}
function privacyLocal({ main }) {
  main.innerHTML = html`<article class="prose"><h1>ความเป็นส่วนตัว</h1>
    <p>EduPlay เวอร์ชันเล่นบนเว็บ <b>ไม่ต้องสมัครสมาชิก ไม่ส่งข้อมูลไปที่เซิร์ฟเวอร์ใด</b> ความคืบหน้า (ชื่อที่ตั้ง XP เหรียญ ของสะสม และการตั้งค่า) เก็บไว้ในเบราว์เซอร์ของคุณเท่านั้น</p>
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
    <a href="/" class="logo" aria-label="EduPlay หน้าแรก"><span aria-hidden="true">🚀</span> EduPlay</a>
    <button class="hamburger" id="menuBtn" aria-label="เปิดเมนู" aria-expanded="false" aria-controls="menu"><span></span><span></span><span></span></button>
    <div class="menu" id="menu"><nav class="links" aria-label="เมนูหลัก">${link("/games", "คลังเกม", cur)}${link("/quizzes", "แบบทดสอบ", cur)}${link("/dashboard", "ความคืบหน้า", cur)}${link("/shop", "🛒 ร้านค้า", cur)}</nav>
      <div class="nav-right"><a href="/shop" class="coins" title="เหรียญของฉัน">🪙 ${(u.coins || 0).toLocaleString("th-TH")}</a>
        <a href="/profile" class="me">${avatar(u.equipped)} <span class="ellipsis">${u.displayName || ""}</span></a><a href="/settings">⚙️ ตั้งค่า</a>
        <button class="theme" id="themeBtn" aria-label="สลับโหมดมืด/สว่าง" title="สลับโหมดมืด/สว่าง">🌓</button></div></div></div>`.s;
  document.getElementById("menuBtn").onclick = () => { const o = document.body.classList.toggle("menu-open"); document.getElementById("menuBtn").setAttribute("aria-expanded", o); };
  document.getElementById("themeBtn").onclick = () => { setPrefs({ mode: isDark() ? "light" : "dark" }); };
  const items = [["/", "🏠", "หน้าแรก"], ["/games", "🎮", "คลังเกม"], ["/quizzes", "📝", "แบบทดสอบ"], ["/dashboard", "📊", "ความคืบหน้า"], ["/shop", "🛒", "ร้านค้า"]];
  document.getElementById("bnav").innerHTML = items.map(([href, i, t]) => {
    const on = href === "/" ? cur === "/" : cur === href || cur.startsWith(href + "/");
    return html`<a href="${href}" class="${on ? "active" : ""}"><span class="i" aria-hidden="true">${i}</span>${t}</a>`.s;
  }).join("");
  document.body.classList.add("has-bottom-nav");
}

// ---------- ตั้งค่า: ชื่อผู้เล่น สำรอง/กู้คืน เริ่มใหม่ ----------
window.__bindLocalSettings = (main) => {
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
window.addEventListener("hashchange", render);
(async () => {
  state.config = await api("/api/config");
  state.me = (await api("/api/auth/me")).user;
  loadPrefs();
  render();
  connectRemote(async () => { await refreshMe(); render(); toast("โหลดความคืบหน้าจากบัญชีของคุณแล้ว"); });
})();
