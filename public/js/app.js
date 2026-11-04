// ตัวควบคุมหลัก: เส้นทาง (router), แถบเมนู, ธีม
import { state, api, html, raw, esc, toast, avatar } from "./core.js";
import * as P from "./pages/public.js";
import * as S from "./pages/student.js";
import * as T from "./pages/teacher.js";
import * as L from "./pages/live.js";
import * as A from "./pages/admin.js";
import * as SH from "./pages/shop.js";
import * as BG from "./pages/bag.js";
import * as QG from "./pages/quizgame.js";
import { loadPrefs, setPrefs, isDark } from "./prefs.js";

const routes = [
  ["/", P.home], ["/games", P.library], ["/games/:id", P.playGame], ["/quizzes", P.quizList], ["/quizzes/:id", P.quizPage],
  ["/attempts/:id", P.attemptPage], ["/join", L.joinPage], ["/play/:pin", L.playerPage],
  ["/login", P.login], ["/register", P.register], ["/forgot", P.forgot], ["/privacy", P.privacy],
  ["/dashboard", S.dashboard, "any"], ["/profile", S.profile, "any"], ["/settings", S.settings], ["/shop", SH.shop], ["/bag", BG.bag], ["/quiz-game", QG.quizGame],
  ["/classes", S.classes, "any"], ["/classes/:id", S.classPage, "any"],
  ["/teacher", T.dashboard, "teacher"], ["/assignments/:id", T.assignmentReport, "teacher"],
  ["/teacher/quizzes", T.myQuizzes, "teacher"], ["/teacher/quizzes/new", T.quizBuilder, "teacher"], ["/teacher/quizzes/:id/edit", T.quizBuilder, "teacher"],
  ["/teacher/quizzes/:id/results", T.quizResults, "teacher"],
  ["/teacher/games", T.myGames, "teacher"], ["/teacher/games/new", T.gameBuilder, "teacher"], ["/teacher/games/:id/edit", T.gameBuilder, "teacher"],
  ["/teacher/ai", T.aiPage, "teacher"], ["/teacher/live", L.createRoom, "teacher"], ["/teacher/live/:pin", L.hostPage, "teacher"],
  ["/admin", A.dashboard, "admin"], ["/admin/users", A.users, "admin"], ["/admin/content", A.content, "admin"], ["/admin/categories", A.categories, "admin"],
].map(([path, fn, guard]) => {
  const keys = [];
  const re = new RegExp("^" + path.replace(/:(\w+)/g, (_, k) => (keys.push(k), "([^/]+)")) + "/?$");
  return { re, keys, fn, guard };
});

export const homeFor = (u) => (!u ? "/" : u.role === "admin" ? "/admin" : u.role === "teacher" ? "/teacher" : "/dashboard");

let cleanup = null;
export function onLeave(fn) { cleanup = fn; }

export function go(path, replace = false) {
  if (replace) history.replaceState({}, "", path); else history.pushState({}, "", path);
  render();
}

export async function refreshMe() {
  const { user } = await api("/api/auth/me");
  state.me = user;
  loadPrefs();
  renderNav();
  renderBottomNav(location.pathname);
}

async function render() {
  if (cleanup) { try { cleanup(); } catch { /* ignore */ } cleanup = null; }
  const url = new URL(location.href);
  const path = url.pathname;
  const main = document.getElementById("app");
  closeMenu();
  let match = null;
  for (const r of routes) {
    const m = r.re.exec(path);
    if (m) { match = { r, params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) }; break; }
  }
  renderNav(path);
  renderBottomNav(path);
  if (!match) return P.notFound({ main });
  const { r, params } = match;
  if (r.guard && !state.me) return go(`/login?next=${encodeURIComponent(path + url.search)}`, true);
  if (r.guard === "teacher" && !["teacher", "admin"].includes(state.me.role)) return P.notFound({ main });
  if (r.guard === "admin" && state.me.role !== "admin") return P.notFound({ main });
  main.innerHTML = '<div class="loading" aria-busy="true">กำลังโหลด…</div>';
  window.scrollTo(0, 0);
  try {
    await r.fn({ main, params, query: url.searchParams, me: state.me });
  } catch (e) {
    if (e.status === 404) return P.notFound({ main });
    if (e.status === 401) return go(`/login?next=${encodeURIComponent(path)}`, true);
    main.innerHTML = html`<div class="card center"><h2>เกิดข้อผิดพลาด</h2><p>${e.message}</p><a class="btn" href="/">กลับหน้าแรก</a></div>`.s;
  }
  document.title = (document.querySelector("#app h1")?.textContent?.trim() || "QUIZ ODYSSEY") + " · QUIZ ODYSSEY";
}

// ---------- แถบเมนู ----------
function link(href, text, cur) {
  const active = ["/", "/teacher", "/admin"].includes(href) ? cur === href : cur === href || cur?.startsWith(href + "/");
  return html`<a href="${href}" class="${active ? "active" : ""}" ${active ? raw('aria-current="page"') : ""}>${text}</a>`;
}
function renderNav(cur = location.pathname) {
  const u = state.me;
  const nav = document.getElementById("nav");
  const main = [link("/games", "คลังเกม", cur), link("/quizzes", "แบบทดสอบ", cur), link("/quiz-game", "🎣 เกมตอบคำถาม", cur), link("/join", "เข้าร่วมเกม", cur), link("/shop", "🛒 ร้านค้า", cur), ...(u ? [link("/bag", "🎒 กระเป๋า", cur)] : [])];
  if (u) {
    main.push(link(u.role === "student" ? "/dashboard" : "/teacher", "แดชบอร์ด", cur));
    main.push(link("/classes", "ห้องเรียน", cur));
  }
  const tools = u && ["teacher", "admin"].includes(u.role) ? html`<div class="subnav" aria-label="เครื่องมือครู"><div class="wrap"><span class="muted">เครื่องมือครู:</span>
      ${link("/teacher/quizzes", "แบบทดสอบของฉัน", cur)} ${link("/teacher/games", "เกมของฉัน", cur)} ${link("/teacher/ai", "✨ AI ช่วยสร้าง", cur)} ${link("/teacher/live", "⚡ จัดแข่งสด", cur)}</div></div>` : "";
  const admin = u && u.role === "admin" ? html`<div class="subnav subnav-admin" aria-label="ผู้ดูแลระบบ"><div class="wrap"><span class="muted">🛡️ ผู้ดูแลระบบ:</span>
      ${link("/admin", "ภาพรวม", cur)} ${link("/admin/users", "ผู้ใช้", cur)} ${link("/admin/content", "ตรวจสอบเนื้อหา", cur)} ${link("/admin/categories", "หมวดหมู่", cur)}</div></div>` : "";
  const right = u
    ? html`<a href="/shop" class="coins" title="เหรียญของฉัน" aria-label="เหรียญ ${u.coins} เหรียญ">🪙 ${(u.coins || 0).toLocaleString("th-TH")}</a><a href="/profile" class="me" title="${u.displayName}">${avatar(u.equipped)} <span class="ellipsis">${u.displayName}</span></a><a href="/settings">ตั้งค่า</a><button class="linkish" id="logout">ออกจากระบบ</button>`
    : html`<a href="/settings" title="ตั้งค่าการแสดงผล" aria-label="ตั้งค่าการแสดงผล">⚙️ ตั้งค่า</a><a href="/login${cur && !["/login", "/register", "/"].includes(cur) ? `?next=${encodeURIComponent(cur)}` : ""}">เข้าสู่ระบบ</a><a href="/register" class="btn btn-sm">สมัคร</a>`;
  nav.innerHTML = html`<div class="wrap topbar">
      <a href="/" class="logo" aria-label="QUIZ ODYSSEY หน้าแรก"><span aria-hidden="true">🧭</span> QUIZ ODYSSEY</a>
      <button class="hamburger" id="menuBtn" aria-label="เปิดเมนู" aria-expanded="false" aria-controls="menu"><span></span><span></span><span></span></button>
      <div class="menu" id="menu">
        <nav class="links" aria-label="เมนูหลัก">${main}</nav>
        <div class="nav-right">${right}<button class="theme" id="themeBtn" aria-label="สลับโหมดมืด/สว่าง" title="สลับโหมดมืด/สว่าง">🌓</button></div>
      </div></div>${tools}${admin}`.s;
  document.getElementById("menuBtn").onclick = () => {
    const open = document.body.classList.toggle("menu-open");
    document.getElementById("menuBtn").setAttribute("aria-expanded", open);
  };
  document.getElementById("themeBtn").onclick = toggleTheme;
  const lo = document.getElementById("logout");
  if (lo) lo.onclick = async () => { await api("/api/auth/logout", { method: "POST" }); state.me = null; loadPrefs(); toast("ออกจากระบบแล้ว"); go("/"); };
}
// ---------- แถบเมนูด้านล่าง (มือถือ) ----------
function renderBottomNav(cur) {
  const u = state.me;
  const el = document.getElementById("bnav");
  if (!el) return;
  const items = !u ? [["/", "🏠", "หน้าแรก"], ["/games", "🎮", "คลังเกม"], ["/join", "⚡", "เข้าร่วม"], ["/shop", "🛒", "ร้านค้า"], ["/login", "👤", "เข้าระบบ"]]
    : u.role === "student" ? [["/dashboard", "🏠", "หน้าหลัก"], ["/games", "🎮", "คลังเกม"], ["/join", "⚡", "เข้าร่วม"], ["/bag", "🎒", "กระเป๋า"], ["/shop", "🛒", "ร้านค้า"]]
    : [["/teacher", "🏠", "แดชบอร์ด"], ["/classes", "🏫", "ห้องเรียน"], ["/teacher/quizzes", "📝", "แบบทดสอบ"], ["/teacher/games", "🎮", "เกม"], ["/teacher/live", "⚡", "แข่งสด"]];
  el.innerHTML = items.map(([href, i, t]) => {
    const on = ["/", "/teacher", "/dashboard"].includes(href) ? cur === href : cur === href || cur.startsWith(href + "/");
    return html`<a href="${href}" class="${on ? "active" : ""}" ${on ? raw('aria-current="page"') : ""}><span class="i" aria-hidden="true">${i}</span>${t}</a>`.s;
  }).join("");
  // ซ่อนระหว่างเล่นแข่งสด (กันแตะพลาด) และหน้ากรอก PIN/ล็อกอิน
  const hide = /^\/play\//.test(cur);
  document.body.classList.toggle("has-bottom-nav", !hide);
  document.body.classList.toggle("playing", hide);
}

function closeMenu() { document.body.classList.remove("menu-open"); document.getElementById("menuBtn")?.setAttribute("aria-expanded", "false"); }

// ---------- ธีม (ปุ่มลัดสลับมืด/สว่าง — ตั้งค่าละเอียดที่หน้า /settings) ----------
function toggleTheme() {
  setPrefs({ mode: isDark() ? "light" : "dark" });
  toast(isDark() ? "เปลี่ยนเป็นโหมดมืด 🌙" : "เปลี่ยนเป็นโหมดสว่าง ☀️");
}

// ---------- เริ่มต้น ----------
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[href]");
  if (!a || a.target || a.hasAttribute("download") || e.ctrlKey || e.metaKey || e.shiftKey) return;
  const href = a.getAttribute("href");
  if (!href.startsWith("/") || href.startsWith("/api/") || href.startsWith("//")) return;
  e.preventDefault();
  go(href);
});
window.addEventListener("popstate", render);

(async () => {
  loadPrefs(); // ใช้ค่าที่เก็บในเบราว์เซอร์ก่อน (กันหน้าจอกะพริบ)
  try {
    const [me, cfg] = await Promise.all([api("/api/auth/me"), api("/api/config")]);
    state.me = me.user; state.config = cfg;
  } catch { /* ออฟไลน์ */ }
  loadPrefs();
  render();
  // ติดตั้งเป็นแอป (PWA)
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
})();
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); state.installPrompt = e; });
window.addEventListener("appinstalled", () => { state.installPrompt = null; toast("ติดตั้ง QUIZ ODYSSEY แล้ว 🎉"); });

export { esc };
