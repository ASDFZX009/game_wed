// Service worker: ทำให้ติดตั้งเป็นแอปได้ และเปิดหน้าหลักได้แม้เน็ตหลุดชั่วคราว
// ไม่เก็บข้อมูล API/คะแนนไว้ในเครื่อง (ข้อมูลต้องมาจากเซิร์ฟเวอร์เสมอ)
const CACHE = "eduplay-v3";
const SHELL = ["/", "/css/app.css", "/js/app.js", "/js/core.js", "/js/prefs.js", "/js/game.js", "/js/quizform.js",
  "/js/pages/public.js", "/js/pages/student.js", "/js/pages/teacher.js", "/js/pages/live.js", "/js/pages/admin.js", "/js/pages/shop.js",
  "/manifest.webmanifest", "/icons/icon-192.png", "/offline.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/socket.io")) return; // ข้อมูลสดเสมอ
  if (e.request.mode === "navigate") {
    // หน้าเว็บ: ลองเน็ตก่อน ถ้าไม่ได้ใช้ของที่เก็บไว้ หรือหน้าออฟไลน์
    e.respondWith(fetch(e.request).catch(async () => (await caches.match("/")) || caches.match("/offline.html")));
    return;
  }
  // ไฟล์ CSS/JS/รูป: ใช้ของใหม่จากเซิร์ฟเวอร์ก่อน (กันไฟล์เก่าค้างหลังอัปเดต) ถ้าออฟไลน์ใช้ของในเครื่อง
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request)));
});
