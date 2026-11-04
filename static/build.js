// สร้าง QUIZ ODYSSEY เวอร์ชันเล่นบนเว็บเป็นไฟล์ HTML ไฟล์เดียว → docs/play/index.html
// ใช้: npm run build:web
const fs = require("fs");
const path = require("path");
const os = require("os");
const esbuild = require("esbuild");

const root = path.join(__dirname, "..");
process.env.DB_FILE = path.join(os.tmpdir(), `eduplay-build-${process.pid}.db`);

// 1) ดึงเนื้อหาจากฝั่งเซิร์ฟเวอร์ (แหล่งเดียวกัน)
const { CATEGORIES, GAMES, QUIZZES } = require("../server/content");
const { BADGES } = require("../server/util");
const shop = require("../server/shop");
const data = {
  categories: CATEGORIES.map(([slug, name, nameEn, icon]) => ({ slug, name, nameEn, icon })),
  games: GAMES, quizzes: QUIZZES, badges: BADGES,
  shop: { catalog: shop.CATALOG, boxes: shop.BOXES, rarity: shop.RARITY, slots: shop.SLOTS },
};
fs.writeFileSync(path.join(__dirname, "data.json"), JSON.stringify(data));

// 2) รวมโค้ดเป็นไฟล์เดียว (หน้าเว็บที่ import app.js จะใช้ app-static.js แทน)
const redirectApp = {
  name: "redirect-app",
  setup(b) { b.onResolve({ filter: /(^|\/)app\.js$/ }, (a) => (a.importer.includes(`${path.sep}public${path.sep}`) ? { path: path.join(__dirname, "app-static.js") } : undefined)); },
};
(async () => {
  const out = await esbuild.build({
    entryPoints: [path.join(__dirname, "app-static.js")], bundle: true, format: "iife", minify: true, write: false,
    target: ["es2020"], charset: "utf8", plugins: [redirectApp], legalComments: "none", logLevel: "warning",
  });
  const js = out.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
  const sdir = path.join(root, "public/sounds");
  const sounds = JSON.stringify(Object.fromEntries(fs.readdirSync(sdir).filter((f) => f.endsWith(".mp3"))
    .map((f) => [f.replace(/\.mp3$/, ""), "data:audio/mpeg;base64," + fs.readFileSync(path.join(sdir, f)).toString("base64")])));
  const pdir = path.join(root, "public/pfp");
  const pfps = JSON.stringify(Object.fromEntries(fs.readdirSync(pdir).filter((f) => f.endsWith(".jpg"))
    .map((f) => [f.replace(/\.jpg$/, ""), "data:image/jpeg;base64," + fs.readFileSync(path.join(pdir, f)).toString("base64")])));
  const css = fs.readFileSync(path.join(root, "public/css/app.css"), "utf8") + fs.readFileSync(path.join(root, "public/css/skins.css"), "utf8");

  // 3) ประกอบเป็น HTML ไฟล์เดียว
  const html = `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>QUIZ ODYSSEY — เกมการเรียนรู้</title>
<meta name="description" content="QUIZ ODYSSEY เวอร์ชันเล่นบนเว็บ: เกมการเรียนรู้ 19 เกม แบบทดสอบ XP เหรียญรางวัล ร้านค้า และกล่องสุ่ม เล่นได้ทันทีไม่ต้องสมัคร">
<meta name="theme-color" content="#5b3df5">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚀</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script>
try { var p = JSON.parse(localStorage.getItem("eduplay:prefs") || "{}"), r = document.documentElement;
  r.dataset.theme = p.mode && p.mode !== "auto" ? p.mode : ""; r.dataset.palette = p.palette || "violet"; r.dataset.font = p.fontSize || "md";
  r.dataset.motion = p.motion || "auto"; if (p.contrast) r.dataset.contrast = "high"; if (p.dyslexic) r.dataset.dyslexic = "1";
  r.dataset.skin = p.skin || "classic"; var F = {comic:"Kanit:wght@400;600;700;800",pixel:"Chakra+Petch:wght@400;600;700&family=Pixelify+Sans:wght@500;700",neon:"Chakra+Petch:wght@400;600;700",sketch:"Itim",glass:"Prompt:wght@400;500;600;700",clay:"Mitr:wght@400;500;600"}; if (F[p.skin]) { var l = document.createElement("link"); l.rel = "stylesheet"; l.id = "skin-font-" + p.skin; l.href = "https://fonts.googleapis.com/css2?family=" + F[p.skin] + "&display=swap"; document.head.appendChild(l); } } catch (e) {}
</script>
<style>${css}</style>
</head>
<body>
<a class="skip" href="#app">ข้ามไปยังเนื้อหา</a>
<header id="nav" class="nav"></header>
<main id="app" class="wrap" tabindex="-1"><div class="loading">กำลังโหลด…</div></main>
<nav class="bottom-nav" id="bnav" aria-label="เมนูลัด"></nav>
<footer class="foot wrap"><a href="/privacy">ความเป็นส่วนตัว</a><span>QUIZ ODYSSEY · เวอร์ชันเล่นบนเว็บ</span><a href="https://github.com/ASDFZX009/game_wed">GitHub</a></footer>
<script>window.__SOUND_DATA=${sounds};window.__PFP_DATA=${pfps}</script>
<script>${js}</script>
</body>
</html>
`;
  const dir = path.join(root, "docs", "play");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
  // 🎣 เกมตอบคำถาม (AWS Fishing) เป็นไฟล์แยก เปิดในกรอบจากหน้า #quiz-game
  fs.rmSync(path.join(dir, "fishing"), { recursive: true, force: true });
  fs.cpSync(path.join(root, "public/fishing"), path.join(dir, "fishing"), { recursive: true, filter: (f) => !/\.md$/.test(f) });
  try { fs.unlinkSync(process.env.DB_FILE); } catch { /* ignore */ }
  console.log(`สร้างแล้ว: docs/play/index.html (${(html.length / 1024).toFixed(0)} KB)`);
})();
