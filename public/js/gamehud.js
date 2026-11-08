// เมนูในเกม (HUD): ป้ายผู้เล่นมุมซ้ายบน · ปุ่มระบบมุมขวาบน · แถบช่องลัดด้านล่าง (แทนแถบเมนูเว็บเดิม)
import { html, raw } from "./core.js";
import { charFrame } from "./world/chars.js";
import { myLook } from "./look.js";
import { rankOf } from "./journey.js";
import { installPixelUI, pxImg } from "./ui/pixui.js";
installPixelUI();

// [ลิงก์, อีโมจิ (สำรอง), ชื่อ, ไอคอนพิกเซล 48px]
export const DOCK = [
  ["/", "🏡", "หมู่บ้าน", "home"], ["/games", "🗺️", "บ้านวิชา", "map"], ["/quizzes", "📝", "แบบทดสอบ", "quiz"], ["/gacha", "✨", "อัญเชิญ", "gacha"], ["/quiz-game", "🎣", "ตกปลา", "fish"],
  ["/dashboard", "📖", "สมุด", "book"], ["/shop", "🛒", "ร้านค้า", "shop"], ["/bag", "🎒", "กระเป๋า", "bag"],
];
// หน้าย่อยที่อยู่ใต้ช่องลัดเดียวกัน (เช่น ผลแบบทดสอบ → แบบทดสอบ · ตั้งค่า/โปรไฟล์ → สมุด)
const ALIAS = { "/attempts": "/quizzes", "/profile": "/dashboard" };
const isOn = (href, cur) => { const c = Object.entries(ALIAS).reduce((x, [k, v]) => (x === k || x.startsWith(k + "/") ? v : x), cur); return href === "/" ? c === "/" : c === href || c.startsWith(href + "/"); };

// รูปหน้าตัวละคร (ครอปหัว-ไหล่จากโมเดลตัวละครจริง)
let portraitKey = "", portraitUrl = "";
function portrait() {
  const brand = getComputedStyle(document.documentElement).getPropertyValue("--brand").trim();
  const L = myLook(/^#[0-9a-f]{6}$/i.test(brand) ? brand : "#5b3df5"), key = JSON.stringify(L);
  if (key === portraitKey && portraitUrl) return portraitUrl;
  try {
    const f = charFrame(0, 0, L, 0), c = document.createElement("canvas"); c.width = 30; c.height = 30;
    const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
    g.drawImage(f.c, f.ax - 15, f.ay - 58, 30, 30, 0, 0, 30, 30);
    portraitKey = key; portraitUrl = c.toDataURL();
  } catch { portraitUrl = ""; }
  return portraitUrl;
}

export function hudHtml({ me = {}, cur = "/", cloud = false, admin = false }) {
  const per = me.xpPerLevel || 100, into = (me.xp || 0) % per, rk = me.level != null ? rankOf(me.level) : null, img = portrait();
  return html`<div class="gh-top">
      <a href="/profile" class="gh-me" title="ตัวละครของฉัน">
        <span class="gh-face">${img ? html`<img src="${img}" alt="" width="30" height="30">` : "🧭"}${me.level != null ? html`<b class="gh-lv" aria-label="เลเวล ${me.level}">${me.level}</b>` : ""}</span>
        <span class="gh-info"><b class="gh-name">${me.displayName || "นักผจญภัย"}${me.cloud ? html` <span title="บันทึกในบัญชีออนไลน์" aria-label="บันทึกในบัญชีออนไลน์">☁️</span>` : ""}</b>
          ${rk ? html`<span class="gh-rank">${rk.icon} ${rk.name}</span><span class="gh-xp" role="progressbar" aria-label="XP สู่เลเวลถัดไป" aria-valuemin="0" aria-valuemax="${per}" aria-valuenow="${into}"><i style="width:${(into / per) * 100}%"></i></span>` : ""}</span>
      </a>
      <a href="/shop" class="gh-coins" title="เหรียญของฉัน · ไปร้านค้า">${raw(pxImg("coin", 26))} <b id="ghCoins">${(me.coins || 0).toLocaleString("th-TH")}</b></a>
      ${me.gacha ? html`<a href="/gacha" class="gh-coins gh-gems" data-tour="gacha" title="เพชรสำหรับอัญเชิญ · ได้จากการตอบคำถามถูก">${raw(pxImg("gem", 26))} <b id="ghGems">${(me.gacha.gems || 0).toLocaleString("th-TH")}</b></a>` : ""}
      ${me.stars != null ? html`<a href="/dashboard?j=1" class="gh-coins gh-stars" title="ดาวสะสม · เปิดสมุดผจญภัย">${raw(pxImg("star", 26))} <b>${me.stars}</b>${me.rewardsReady ? html`<em>🎁${me.rewardsReady}</em>` : ""}</a>` : ""}
      <div class="gh-sys">
        ${cloud && !me.cloud ? html`<a href="/login" class="gh-btn gh-login" title="เข้าสู่ระบบ">${raw(pxImg("lock", 30))}<span>เข้าสู่ระบบ</span></a>` : ""}
        ${admin ? html`<a href="/admin" class="gh-btn ${cur === "/admin" ? "on" : ""}" title="ผู้ดูแลระบบ" aria-label="ผู้ดูแลระบบ">${raw(pxImg("shield", 30))}</a>` : ""}
        <a href="/settings" class="gh-btn ${cur === "/settings" ? "on" : ""}" title="ตั้งค่า" aria-label="ตั้งค่า">${raw(pxImg("gear", 30))}</a>
      </div>
    </div>
    <nav class="gh-dock" aria-label="เมนูหลัก">${DOCK.map(([href, ic, t, px]) => html`<a href="${href}" class="gh-slot ${isOn(href, cur) ? "on" : ""}" ${isOn(href, cur) ? raw('aria-current="page"') : ""}><span class="i" aria-hidden="true">${raw(pxImg(px, 48))}</span><span class="t">${t}</span></a>`)}</nav>`;
}

// ผูกพฤติกรรม: บนหน้าหมู่บ้าน ปุ่ม "บ้านวิชา" เปิดตัวเลือกบ้านทันที · แถบบนมีพื้นหลังเมื่อเลื่อนหน้า
let scrollBound = false;
export function bindHud(root) {
  root.querySelector(".gh-dock")?.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]"); if (!a) return;
    if (document.body.classList.contains("home-world") && window.__qoHome) {
      const h = a.getAttribute("href");
      if (h === "/games") { e.preventDefault(); e.stopPropagation(); window.__qoHome.picker(); }
      else if (h === "/") { e.preventDefault(); e.stopPropagation(); window.__qoHome.closeAll(); }
    }
  }, true);
  if (!scrollBound) { scrollBound = true; const f = () => document.body.classList.toggle("gh-scrolled", window.scrollY > 8); window.addEventListener("scroll", f, { passive: true }); f(); }
}
