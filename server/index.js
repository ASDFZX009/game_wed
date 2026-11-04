// QUIZ ODYSSEY — เซิร์ฟเวอร์หลัก
const path = require("path");
const fs = require("fs");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

// อ่านไฟล์ .env แบบง่าย (ถ้ามี)
const envFile = path.join(__dirname, "..", ".env");
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, "utf8").split(/\r?\n/).forEach((line) => {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  });
}

const { db } = require("./db");
const { attachUser } = require("./auth");
const U = require("./util");
const shop = require("./shop");
const seed = require("./seed");

seed.ensure();

const app = express();
app.set("trust proxy", true);
app.disable("x-powered-by");
app.use(express.json({ limit: "4mb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  next();
});
app.use(attachUser);

const games = require("./routes/games");
const quizzes = require("./routes/quizzes");
const classes = require("./routes/classes");
const live = require("./live");
const ai = require("./routes/ai");

app.get("/api/config", (req, res) => {
  res.json({ tz: U.TZ, baseUrl: live.baseUrl(req), ai: ai.status(false) });
});
app.get("/api/categories", (_req, res) => res.json({ categories: db.prepare("SELECT slug, name_th name, name_en nameEn, icon FROM categories ORDER BY name_th").all() }));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/games", games.router);
app.use("/api/quizzes", quizzes.router);
app.use("/api/classes", classes.router);
app.use("/api/dashboard", classes.dashboard);
app.use("/api/admin", require("./routes/admin"));
app.use("/api/ai", ai);
app.use("/api/shop", shop.router);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: false } });
live.setup(app, io);

app.use("/api", (_req, res) => res.status(404).json({ error: "ไม่พบ API นี้" }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.type === "entity.too.large" ? "ข้อมูลใหญ่เกินไป (รูปภาพรวมกันต้องไม่เกิน ~4 MB)" : "เกิดข้อผิดพลาดในระบบ" });
});

const pub = path.join(__dirname, "..", "public");
app.get("/sw.js", (_req, res) => { res.setHeader("Cache-Control", "no-cache"); res.sendFile(path.join(pub, "sw.js")); });
app.use("/icons", express.static(path.join(pub, "icons"), { maxAge: "7d" }));
app.use(express.static(pub, { index: false, maxAge: 0 })); // ตรวจไฟล์ใหม่ทุกครั้ง (ใช้ ETag) กันไฟล์เก่าค้างหลังอัปเดต
// SPA: ทุกเส้นทางที่ไม่ใช่ไฟล์ ให้ส่ง index.html
app.get("*", (_req, res) => res.sendFile(path.join(pub, "index.html")));

const PORT = parseInt(process.env.PORT) || 3100;
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`QUIZ ODYSSEY พร้อมใช้งานที่ http://localhost:${PORT}`);
    if (!process.env.PUBLIC_BASE_URL) console.log("หมายเหตุ: ยังไม่ได้ตั้ง PUBLIC_BASE_URL — ลิงก์แชร์/QR จะใช้ที่อยู่ที่ผู้ใช้เปิดเข้ามา");
  });
}

module.exports = { app, server };
