// แข่งสดแบบเรียลไทม์ (Socket.IO)
// สำคัญ: คะแนนของผู้เล่นจะถูกส่งให้ผู้เล่นเฉพาะตอนเฉลยเท่านั้น (ไม่ส่งตอนรับคำตอบ)
const express = require("express");
const os = require("os");
const QRCode = require("qrcode");
const { db, now, J } = require("./db");
const { need, userFromToken, parseCookies, COOKIE } = require("./auth");
const U = require("./util");

const LIVE_TYPES = ["mcq", "truefalse", "multi", "short", "numeric"];
const DEFAULT_TIME = 20;
const rooms = new Map(); // pin -> room

function baseUrl(req) {
  const env = (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "");
  if (env) return env;
  const proto = String(req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http")).split(",")[0];
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}
function lanUrls(port) {
  const out = [];
  Object.values(os.networkInterfaces()).flat().forEach((i) => {
    if (i && i.family === "IPv4" && !i.internal) out.push(`http://${i.address}:${port}`);
  });
  return out;
}
const isLocalHost = (url) => /\/\/(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(url);

function newPin() {
  let p;
  do p = String(100000 + Math.floor(Math.random() * 900000)); while (rooms.has(p));
  return p;
}

function leaderboard(room) {
  const list = [...room.players.values()].filter((p) => !p.kicked).map((p) => ({ id: p.id, name: p.name, avatar: p.avatar, score: p.score, team: p.team }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  let rank = 0, prev = null;
  list.forEach((p, i) => { if (p.score !== prev) { rank = i + 1; prev = p.score; } p.rank = rank; });
  return list;
}
function teams(room) {
  if (!room.teamMode) return null;
  const t = { red: { score: 0, players: 0 }, blue: { score: 0, players: 0 } };
  room.players.forEach((p) => { if (!p.kicked && t[p.team]) { t[p.team].score += p.score; t[p.team].players++; } });
  return t;
}
function questionPublic(room) {
  const q = room.questions[room.index];
  const base = { index: room.index, total: room.questions.length, type: q.type, prompt: q.prompt, image: q.image || null, timeLimit: q.time, endsAt: room.endsAt, paused: room.paused, remainingMs: room.remainingMs };
  if (q.type === "mcq" || q.type === "multi") base.options = q.options;
  if (q.type === "truefalse") base.options = ["จริง", "เท็จ"];
  if (q.type === "numeric") base.unit = q.unit || "";
  return base;
}
function playerList(room) {
  return [...room.players.values()].filter((p) => !p.kicked).map((p) => ({ id: p.id, name: p.name, avatar: p.avatar, team: p.team, connected: p.connected }));
}
function persist(room) {
  db.prepare("UPDATE live_rooms SET status=?, player_count=?, results=? WHERE id=?")
    .run(room.status, [...room.players.values()].filter((p) => !p.kicked).length, room.status === "ended" ? JSON.stringify({ leaderboard: leaderboard(room), teams: teams(room) }) : null, room.id);
}

function setup(app, io) {
  // ห้องที่ค้างจากการรีสตาร์ตเซิร์ฟเวอร์ถือว่าหมดอายุ
  db.prepare("UPDATE live_rooms SET status='expired' WHERE status NOT IN ('ended','closed','expired')").run();

  const r = express.Router();
  r.post("/", need("teacher"), (req, res) => {
    const quiz = db.prepare("SELECT * FROM quizzes WHERE id=?").get(+req.body.quizId || 0);
    if (!quiz || (quiz.owner_id !== req.user.id && !(quiz.status === "published" && quiz.visibility === "public") && req.user.role !== "admin"))
      return res.status(404).json({ error: "ไม่พบแบบทดสอบ" });
    const questions = J(quiz.questions, []).filter((q) => LIVE_TYPES.includes(q.type)).map((q) => ({ ...q, time: DEFAULT_TIME }));
    if (!questions.length) return res.status(400).json({ error: "แบบทดสอบนี้ไม่มีคำถามที่ใช้แข่งสดได้ (รองรับ: ปรนัย, ถูก/ผิด, เลือกหลายข้อ, คำตอบสั้น, ตัวเลข)" });
    const pin = newPin();
    const info = db.prepare("INSERT INTO live_rooms (quiz_id, host_id, pin, status, created_at) VALUES (?,?,?,?,?)").run(quiz.id, req.user.id, pin, "lobby", now());
    rooms.set(pin, {
      id: info.lastInsertRowid, pin, hostId: req.user.id, title: quiz.title, questions, skipped: J(quiz.questions, []).length - questions.length,
      allowGuests: req.body.allowGuests !== false, teamMode: !!req.body.teamMode, showLeaderboard: req.body.showLeaderboard !== false,
      status: "lobby", locked: false, index: -1, endsAt: null, paused: false, remainingMs: null, timer: null,
      players: new Map(), answers: new Map(), nextTeam: "red", lastActive: Date.now(),
    });
    res.json({ id: info.lastInsertRowid, pin });
  });

  r.get("/room/:pin", async (req, res) => {
    const room = rooms.get(req.params.pin);
    if (!room) return res.status(404).json({ error: "ไม่พบห้องนี้ หรือห้องปิดไปแล้ว" });
    const out = { pin: room.pin, title: room.title, status: room.status, allowGuests: room.allowGuests, locked: room.locked };
    if (req.user && (req.user.id === room.hostId || req.user.role === "admin")) {
      const joinBase = baseUrl(req);
      const joinUrl = `${joinBase}/join?pin=${room.pin}`;
      out.host = true;
      out.id = room.id;
      out.joinUrl = joinUrl;
      out.joinBase = joinBase.replace(/^https?:\/\//, "");
      out.qr = await QRCode.toDataURL(joinUrl, { margin: 1, width: 320 });
      out.localWarning = isLocalHost(joinUrl);
      out.lanUrls = out.localWarning ? lanUrls(process.env.PORT || 3100) : [];
      out.skipped = room.skipped;
      out.teamMode = room.teamMode;
      out.showLeaderboard = room.showLeaderboard;
    }
    res.json(out);
  });

  r.get("/:id/results.csv", need("teacher"), (req, res) => {
    const row = db.prepare("SELECT l.*, q.title FROM live_rooms l JOIN quizzes q ON q.id=l.quiz_id WHERE l.id=?").get(req.params.id);
    if (!row || (row.host_id !== req.user.id && req.user.role !== "admin")) return res.status(404).end();
    const room = [...rooms.values()].find((x) => x.id === row.id);
    const lb = room ? leaderboard(room) : (J(row.results, {}).leaderboard || []);
    const rows = [["อันดับ", "ชื่อเล่น", "ทีม", "คะแนน"]];
    lb.forEach((p) => rows.push([p.rank, p.name, p.team ? (p.team === "red" ? "แดง" : "น้ำเงิน") : "", p.score]));
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="live-${row.pin}.csv"`);
    res.send(U.csv(rows));
  });
  app.use("/api/live", r);

  // ---------- Socket ----------
  const emitLobby = (room) => io.to(room.pin).emit("room:lobby", { players: playerList(room), locked: room.locked, status: room.status });
  const hostEmit = (room, ev, data) => io.to(`host:${room.pin}`).emit(ev, data);

  function startQuestion(room) {
    room.status = "question";
    room.answers = new Map();
    const q = room.questions[room.index];
    room.paused = false; room.remainingMs = null;
    room.endsAt = Date.now() + q.time * 1000;
    clearTimeout(room.timer);
    room.timer = setTimeout(() => reveal(room), q.time * 1000 + 300);
    io.to(room.pin).emit("q:start", questionPublic(room));
    hostEmit(room, "q:progress", { answered: 0, total: playerList(room).length });
    persist(room);
  }

  function reveal(room) {
    if (room.status !== "question" && room.status !== "paused") return;
    clearTimeout(room.timer);
    const q = room.questions[room.index];
    const dist = q.type === "mcq" || q.type === "multi" ? q.options.map(() => 0) : q.type === "truefalse" ? [0, 0] : null;
    // บวกคะแนนตอนเฉลยเท่านั้น
    room.players.forEach((p) => {
      const a = room.answers.get(p.id);
      p.lastCorrect = false; p.lastGained = 0;
      if (!a) return;
      if (dist) {
        if (q.type === "multi") (Array.isArray(a.answer) ? a.answer : []).forEach((k) => { if (dist[k] !== undefined) dist[k]++; });
        else if (q.type === "truefalse") dist[a.answer === true ? 0 : 1]++;
        else if (dist[a.answer] !== undefined) dist[a.answer]++;
      }
      if (a.correct) {
        const ratio = Math.max(0, Math.min(1, a.remainingMs / (q.time * 1000)));
        p.lastGained = Math.round(500 + 500 * ratio);
        p.score += p.lastGained;
        p.lastCorrect = true;
      }
    });
    room.status = "reveal";
    room.endsAt = null;
    const lb = leaderboard(room);
    const payload = {
      index: room.index, total: room.questions.length, answer: U.answerText(q),
      correctOptions: q.type === "mcq" ? [q.answer] : q.type === "multi" ? q.answers : q.type === "truefalse" ? [q.answer ? 0 : 1] : [],
      distribution: dist, answered: room.answers.size, explain: q.explain || null,
      teams: teams(room), last: room.index >= room.questions.length - 1,
    };
    hostEmit(room, "q:reveal", { ...payload, leaderboard: lb });
    room.players.forEach((p) => {
      if (!p.socketId || p.kicked) return;
      const me = lb.find((x) => x.id === p.id);
      io.to(p.socketId).emit("q:reveal", {
        ...payload, leaderboard: room.showLeaderboard ? lb.slice(0, 10) : null,
        you: { answered: room.answers.has(p.id), correct: p.lastCorrect, gained: p.lastGained, score: p.score, rank: me?.rank, team: p.team },
      });
    });
    persist(room);
  }

  function endGame(room) {
    clearTimeout(room.timer);
    room.status = "ended";
    const lb = leaderboard(room);
    hostEmit(room, "room:end", { leaderboard: lb, teams: teams(room), id: room.id });
    room.players.forEach((p) => {
      if (!p.socketId || p.kicked) return;
      const me = lb.find((x) => x.id === p.id);
      io.to(p.socketId).emit("room:end", { leaderboard: room.showLeaderboard ? lb : null, teams: teams(room), you: { score: p.score, rank: me?.rank, team: p.team } });
    });
    persist(room);
  }

  io.on("connection", (socket) => {
    const user = userFromToken(parseCookies(socket.handshake.headers.cookie)[COOKIE]);
    const getRoom = (pin) => { const r0 = rooms.get(String(pin)); if (r0) r0.lastActive = Date.now(); return r0; };
    const isHost = (room) => room && user && (user.id === room.hostId || user.role === "admin");

    socket.on("host:attach", ({ pin }, ack) => {
      const room = getRoom(pin);
      if (!isHost(room)) return ack?.({ error: "ไม่มีสิทธิ์ควบคุมห้องนี้" });
      socket.join(`host:${room.pin}`);
      socket.join(room.pin);
      socket.data.hostOf = room.pin;
      ack?.({ ok: true, status: room.status, players: playerList(room), locked: room.locked, question: room.status === "question" || room.status === "paused" ? questionPublic(room) : null, answered: room.answers.size, leaderboard: leaderboard(room), teams: teams(room) });
    });

    const hostAction = (name, fn) => socket.on(name, (data, ack) => {
      const room = getRoom(socket.data.hostOf);
      if (!isHost(room)) return ack?.({ error: "ไม่มีสิทธิ์" });
      fn(room, data || {});
      ack?.({ ok: true });
    });

    hostAction("host:start", (room) => {
      if (room.status !== "lobby" || !playerList(room).length) return;
      room.index = 0; startQuestion(room);
    });
    hostAction("host:next", (room) => {
      if (room.status !== "reveal") return;
      if (room.index >= room.questions.length - 1) return endGame(room);
      room.index++; startQuestion(room);
    });
    hostAction("host:skip", (room) => reveal(room));
    hostAction("host:pause", (room) => {
      if (room.status !== "question") return;
      clearTimeout(room.timer);
      room.remainingMs = Math.max(0, room.endsAt - Date.now());
      room.status = "paused"; room.paused = true; room.endsAt = null;
      io.to(room.pin).emit("room:paused", { remainingMs: room.remainingMs });
    });
    hostAction("host:resume", (room) => {
      if (room.status !== "paused") return;
      room.status = "question"; room.paused = false;
      room.endsAt = Date.now() + room.remainingMs;
      room.timer = setTimeout(() => reveal(room), room.remainingMs + 300);
      room.remainingMs = null;
      io.to(room.pin).emit("room:resumed", questionPublic(room));
    });
    hostAction("host:lock", (room) => { room.locked = !room.locked; emitLobby(room); });
    hostAction("host:kick", (room, d) => {
      const p = room.players.get(d.playerId);
      if (!p) return;
      p.kicked = true;
      if (p.socketId) io.to(p.socketId).emit("room:kicked");
      emitLobby(room);
    });
    hostAction("host:end", (room) => endGame(room));
    hostAction("host:close", (room) => {
      clearTimeout(room.timer);
      if (room.status !== "ended") room.status = "closed";
      persist(room);
      io.to(room.pin).emit("room:closed");
      rooms.delete(room.pin);
    });

    socket.on("player:join", ({ pin, nickname, token }, ack) => {
      const room = getRoom(pin);
      if (!room || ["closed", "expired"].includes(room.status)) return ack?.({ error: "ไม่พบห้องนี้ หรือห้องปิดไปแล้ว" });
      // กลับเข้าห้องเดิม (เช่น เน็ตหลุด)
      if (token) {
        const p = [...room.players.values()].find((x) => x.token === token);
        if (p && !p.kicked) {
          p.socketId = socket.id; p.connected = true;
          socket.join(room.pin); socket.data.player = { pin: room.pin, id: p.id };
          emitLobby(room);
          return ack?.({ ok: true, playerId: p.id, token: p.token, name: p.name, team: p.team, score: p.score, status: room.status, title: room.title,
            question: room.status === "question" || room.status === "paused" ? questionPublic(room) : null, answered: room.answers.has(p.id) });
        }
      }
      if (room.status !== "lobby") return ack?.({ error: "เกมเริ่มไปแล้ว เข้าร่วมเพิ่มไม่ได้" });
      if (room.locked) return ack?.({ error: "ครูปิดรับผู้เล่นแล้ว" });
      if (!room.allowGuests && !user) return ack?.({ error: "ห้องนี้ต้องเข้าสู่ระบบก่อนเข้าร่วม", needLogin: true });
      let name = String(user && !nickname ? user.display_name : nickname || "").trim().replace(/\s+/g, " ").slice(0, 20);
      if (!name) return ack?.({ error: "กรุณาใส่ชื่อเล่น" });
      const taken = new Set([...room.players.values()].filter((p) => !p.kicked).map((p) => p.name.toLowerCase()));
      if (taken.has(name.toLowerCase())) { let k = 2; while (taken.has(`${name} ${k}`.toLowerCase())) k++; name = `${name} ${k}`; }
      if (room.players.size >= 200) return ack?.({ error: "ห้องเต็มแล้ว" });
      const id = U.token(8);
      const team = room.teamMode ? room.nextTeam : null;
      if (room.teamMode) room.nextTeam = room.nextTeam === "red" ? "blue" : "red";
      const look = user ? require("./shop").equippedView(user.equipped) : {};
      const p = { id, token: U.token(16), name, team, score: 0, socketId: socket.id, connected: true, userId: user?.id || null, avatar: look.avatar || null };
      room.players.set(id, p);
      socket.join(room.pin);
      socket.data.player = { pin: room.pin, id };
      emitLobby(room);
      persist(room);
      ack?.({ ok: true, playerId: id, token: p.token, name, team, score: 0, status: room.status, title: room.title });
    });

    socket.on("player:answer", ({ answer }, ack) => {
      const sp = socket.data.player;
      const room = sp && getRoom(sp.pin);
      if (!room || room.status !== "question") return ack?.({ error: "หมดเวลาตอบข้อนี้แล้ว" });
      const p = room.players.get(sp.id);
      if (!p || p.kicked) return ack?.({ error: "ไม่ได้อยู่ในห้องนี้" });
      if (room.answers.has(p.id)) return ack?.({ error: "ส่งคำตอบไปแล้ว" });
      const q = room.questions[room.index];
      let a = answer;
      if (q.type === "truefalse") a = answer === true || answer === 0 || answer === "0" ? true : answer === false || answer === 1 || answer === "1" ? false : null;
      const g = U.gradeQuestion(q, a);
      room.answers.set(p.id, { answer: a, correct: !!g.correct, remainingMs: Math.max(0, room.endsAt - Date.now()) });
      ack?.({ received: true }); // ไม่บอกผลหรือคะแนนจนกว่าจะเฉลย
      const total = playerList(room).filter((x) => x.connected).length;
      hostEmit(room, "q:progress", { answered: room.answers.size, total: playerList(room).length });
      if (room.answers.size >= total) reveal(room); // ทุกคนตอบแล้ว เฉลยทันที
    });

    socket.on("disconnect", () => {
      const sp = socket.data.player;
      const room = sp && rooms.get(sp.pin);
      if (!room) return;
      const p = room.players.get(sp.id);
      if (p && p.socketId === socket.id) { p.connected = false; emitLobby(room); }
    });
  });

  // ล้างห้องที่ไม่มีการใช้งานเกิน 3 ชั่วโมง
  setInterval(() => {
    rooms.forEach((room, pin) => {
      if (Date.now() - room.lastActive > 3 * 3600000) {
        clearTimeout(room.timer);
        if (room.status !== "ended") { room.status = "expired"; persist(room); }
        rooms.delete(pin);
      }
    });
  }, 10 * 60000).unref();
}

module.exports = { setup, baseUrl, rooms };
