// หมู่บ้านแห่งการเรียนรู้: แผนที่พิกเซลอาร์ตมุมมอง 2.5D มีตัวละครเดินเข้าบ้านตามวิชา
// วาดด้วยโค้ดทั้งหมด (ไม่มีไฟล์ภาพ) · คีย์บอร์ด: ลูกศร/WASD เดิน, E/Enter เข้าบ้าน · เมาส์/นิ้ว: แตะที่บ้านหรือพื้นเพื่อเดินไป

const T = 16, MW = 48, MH = 34; // ขนาดช่องและแผนที่ (ช่อง)
const POS_KEY = "eduplay:worldPos";

const PLACES = [
  { id: "math", name: "คณิตศาสตร์", ic: "🔢", x: 8, y: 4, roof: "#3a6ad0", wall: "#efe2c4", href: "/games?category=math" },
  { id: "science", name: "วิทยาศาสตร์", ic: "🔬", x: 21, y: 3, roof: "#1f9e86", wall: "#dfece6", href: "/games?category=science" },
  { id: "thai", name: "ภาษาไทย", ic: "📖", x: 34, y: 4, roof: "#c0392b", wall: "#f3e2b2", href: "/games?category=thai", thai: true },
  { id: "english", name: "ภาษาอังกฤษ", ic: "🔤", x: 4, y: 13, roof: "#7d3fa8", wall: "#ebdcf2", href: "/games?category=english" },
  { id: "social", name: "สังคมศึกษา", ic: "🌏", x: 39, y: 13, roof: "#d35400", wall: "#f2dcc6", href: "/games?category=social" },
  { id: "health", name: "สุขศึกษา", ic: "💪", x: 5, y: 23, roof: "#239b56", wall: "#f5f0e0", href: "/games?category=health" },
  { id: "early", name: "เด็กปฐมวัย", ic: "🧸", x: 13, y: 26, roof: "#f06aa8", wall: "#fff0d8", href: "/games?category=early" },
  { id: "brain", name: "ฝึกสมอง", ic: "🧠", x: 29, y: 26, roof: "#b8327a", wall: "#f2dbe8", href: "/games?category=brain" },
  { id: "general", name: "ความรู้ทั่วไป", ic: "💡", x: 37, y: 22, roof: "#e2b10e", wall: "#f8f0d2", href: "/games?category=general" },
  { id: "shop", name: "ร้านค้า", ic: "🛒", x: 21, y: 26, roof: "#b33939", wall: "#c58b55", href: "/shop", shop: true },
  { id: "dock", name: "ท่าเรือ · เกมตอบคำถาม", ic: "🎣", dock: true, x: 43, y: 26, href: "/quiz-game" },
];
const PLAZA = { x: 24, y: 15.5, r: 5.2 };

// ---------- เครื่องมือพิกเซล ----------
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const canvas = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d"); x.imageSmoothingEnabled = false; return [c, x]; };
const R = (x, X, Y, w, h, c) => { x.fillStyle = c; x.fillRect(Math.round(X), Math.round(Y), w, h); };
function shade(hex, k) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; const f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); return `rgb(${f(r)},${f(g)},${f(b)})`; }

// ---------- สร้างแผนที่ ----------
// พื้น: 0 หญ้า 1 ทางดิน 2 น้ำ 3 ท่าไม้ · block: เดินผ่านไม่ได้
function buildMap() {
  const ground = new Uint8Array(MW * MH), block = new Uint8Array(MW * MH);
  const at = (x, y) => y * MW + x, inb = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
  // บ่อน้ำมุมขวาล่าง
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const dx = (x - 44.5) / 5.6, dy = (y - 31) / 3.6; if (dx * dx + dy * dy < 1 + (hash(x, y, 3) - 0.5) * 0.25) { ground[at(x, y)] = 2; block[at(x, y)] = 1; } }
  // วงลานหิน (ทางดินเป็นวงแหวน)
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const d = Math.hypot(x + 0.5 - PLAZA.x, (y + 0.5 - PLAZA.y) * 1.15); if (d > 3.4 && d < 4.9) ground[at(x, y)] = 1; }
  // ทางดิน: หาเส้นทางสั้นสุดจากหน้าประตูไปยังวงลาน โดยอ้อมบ้านและน้ำ แล้วปูกว้าง 2 ช่อง
  const house = new Uint8Array(MW * MH);
  for (const p of PLACES) { p.ex = p.dock ? p.x + 1 : p.x + 2; p.ey = p.dock ? p.y : p.y + 4; // ช่องหน้าประตู
    if (!p.dock) for (let y = p.y - 1; y < p.y + 4; y++) for (let x = p.x - 1; x < p.x + 6; x++) if (inb(x, y)) house[at(x, y)] = 1; }
  const ring = (k) => ground[k] === 1;
  const carve = (sx, sy, goal) => {
    const prev = new Int32Array(MW * MH).fill(-1), q = [at(sx, sy)]; prev[q[0]] = q[0]; let end = -1;
    while (q.length) { const k = q.shift(); if (goal(k)) { end = k; break; } const x = k % MW, y = (k / MW) | 0;
      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) { const nx = x + dx, ny = y + dy; if (!inb(nx, ny)) continue; const nk = at(nx, ny);
        if (prev[nk] !== -1 || house[nk] || ground[nk] === 2) continue; prev[nk] = k; q.push(nk); } }
    for (let k = end; k >= 0 && k !== prev[k]; k = prev[k]) { const x = k % MW, y = (k / MW) | 0; ground[k] = 1; if (inb(x + 1, y) && !house[at(x + 1, y)] && ground[at(x + 1, y)] !== 2) ground[at(x + 1, y)] = 1; }
    ground[at(sx, sy)] = 1;
  };
  for (const p of PLACES) carve(p.ex, p.ey, ring);
  carve(Math.floor(PLAZA.x) - 1, MH - 1, ring); // ทางเข้าหมู่บ้านด้านใต้
  // บ้าน (5×4 ช่อง) กันทางเดิน
  for (const p of PLACES) { if (p.dock) continue; for (let y = p.y; y < p.y + 4; y++) for (let x = p.x; x < p.x + 5; x++) { block[at(x, y)] = 1; ground[at(x, y)] = 0; } }
  // ท่าเรือไม้ยื่นลงน้ำ
  const d = PLACES.find((p) => p.dock);
  for (let y = d.y + 1; y < d.y + 6; y++) for (let x = d.x + 1; x < d.x + 3; x++) if (inb(x, y)) { ground[at(x, y)] = 3; block[at(x, y)] = 0; }
  // หินตั้งรอบลาน + แท่งหินกลาง
  const stones = [];
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2 + 0.11; const sx = Math.round(PLAZA.x - 0.5 + Math.cos(a) * 6.1), sy = Math.round(PLAZA.y - 0.5 + Math.sin(a) * 5.3);
    if (!inb(sx, sy) || ground[at(sx, sy)] === 1) continue; stones.push({ x: sx, y: sy, h: 18 + Math.round(hash(sx, sy, 9) * 12), owl: i === 9 }); block[at(sx, sy)] = 1; }
  const mono = { x: Math.floor(PLAZA.x) - 1, y: Math.floor(PLAZA.y) };
  block[at(mono.x, mono.y)] = 1; block[at(mono.x + 1, mono.y)] = 1;
  // ต้นไม้: ขอบป่า + กลุ่มต้นไม้ (เว้นทาง บ้าน และน้ำ)
  const trees = [], free = (x, y, m) => { for (let j = -m; j <= m; j++) for (let i = -m; i <= m; i++) { if (!inb(x + i, y + j)) continue; const k = at(x + i, y + j); if (block[k] || ground[k]) return false; } return true; };
  const r = rng(20261105);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const edge = Math.min(x, y, MW - 1 - x, MH - 1 - y);
    const pPlace = edge < 2 ? 0.92 : edge < 3 ? 0.55 : 0.07;
    if (r() < pPlace && free(x, y, edge < 2 ? 0 : 1) && Math.hypot(x - PLAZA.x, (y - PLAZA.y) * 1.15) > 7.5) {
      trees.push({ x, y, kind: r() < 0.62 ? "pine" : r() < 0.6 ? "round" : "autumn", s: r() }); block[at(x, y)] = 1; }
  }
  // ทางออกด้านใต้ต้องโล่ง
  return { ground, block, stones, mono, trees, at, inb };
}

// ---------- สไปรต์ ----------
function treeSprite(kind, s) {
  const [c, x] = canvas(28, 40);
  R(x, 7, 37, 14, 3, "rgba(0,0,0,.28)"); R(x, 12, 30, 4, 8, "#5a3a22"); R(x, 12, 30, 1, 8, "#3e2716");
  if (kind === "pine") {
    const g = s < 0.5 ? ["#1f4d2e", "#2f6e3c", "#4a8f48"] : ["#245a34", "#367a42", "#58a050"];
    for (let i = 0; i < 4; i++) { const w = 8 + i * 5, y0 = 2 + i * 7; for (let j = 0; j < 9; j++) { const ww = Math.round(w * (j + 2) / 11); R(x, 14 - ww / 2, y0 + j, ww, 1, j < 2 ? g[2] : j < 6 ? g[1] : g[0]); } }
    R(x, 13, 1, 2, 2, g[2]);
  } else {
    const g = kind === "round" ? ["#2d6a33", "#3f8a3f", "#6ab04c", "#9ad06a"] : ["#a4511f", "#d07a32", "#eea050", "#f8cc80"];
    for (let y = 0; y < 30; y++) for (let xx = 0; xx < 28; xx++) { const dx = (xx - 13.5) / 12, dy = (y - 15) / 14; const d = dx * dx + dy * dy + (hash(xx, y, kind.length) - 0.5) * 0.18; if (d > 1) continue;
      const lit = -dx * 0.6 - dy * 0.8; R(x, xx, y, 1, 1, d > 0.82 ? g[0] : lit > 0.45 ? g[3] : lit > 0 ? g[2] : g[1]); }
  }
  return c;
}
function stoneSprite(h) {
  const [c, x] = canvas(14, h + 4); R(x, 1, h + 1, 12, 3, "rgba(0,0,0,.28)");
  for (let y = 0; y < h; y++) { const top = y < 3 ? 3 - y : 0; for (let xx = 1 + top; xx < 13 - top; xx++) { const edge = xx === 1 + top || xx === 12 - top || y === 0; R(x, xx, y + 1, 1, 1, edge ? "#3c3a40" : xx < 5 ? "#9a989e" : xx > 9 ? "#66646c" : "#827f88"); } }
  for (let i = 0; i < 9; i++) R(x, 2 + ((i * 5) % 9), 2 + ((i * 3) % 5), 2, 1, "#4f8a3c");
  return c;
}
function houseSprite(p) {
  const [c, x] = canvas(80, 72);
  const roof = p.roof, wall = p.wall;
  R(x, 4, 66, 76, 6, "rgba(0,0,0,.25)");
  // ผนัง
  for (let y = 34; y < 66; y++) R(x, 5, y, 70, 1, y % 5 === 0 ? shade(wall, -0.12) : wall);
  R(x, 5, 34, 3, 32, shade(wall, -0.25)); R(x, 72, 34, 3, 32, shade(wall, -0.3));
  if (p.shop) { for (let i = 0; i < 9; i++) R(x, 2 + i * 8.5, 30, 8, 8, i % 2 ? "#f6f0e8" : roof); R(x, 2, 38, 76, 1, "rgba(0,0,0,.3)"); }
  // หลังคา (มองเฉียง: ลาดหน้า + จั่ว)
  for (let y = 0; y < 34; y++) { const inset = Math.max(0, 8 - y); for (let xx = inset; xx < 80 - inset; xx++) {
    const row = Math.floor(y / 3), brick = ((xx + (row % 2) * 3) % 6 === 0) || y % 3 === 0;
    R(x, xx, y, 1, 1, y >= 31 ? shade(roof, -0.45) : y < 2 ? shade(roof, 0.35) : brick ? shade(roof, -0.18) : xx < 40 ? roof : shade(roof, -0.08)); } }
  R(x, 0, 33, 80, 2, shade(roof, -0.55));
  if (p.thai) { // ช่อฟ้าแบบไทย
    for (const sx of [3, 76]) { R(x, sx, 22, 2, 12, "#e8b830"); R(x, sx - (sx < 40 ? 1 : -1), 20, 2, 3, "#e8b830"); } R(x, 38, 0, 4, 3, "#e8b830"); }
  if (!p.shop) { R(x, 60, 2, 8, 10, "#7a5a4a"); R(x, 60, 2, 8, 2, "#5a3e30"); } // ปล่องไฟ
  // หน้าต่าง
  for (const wx of [12, 57]) { R(x, wx - 1, 40, 13, 12, "#4a3424"); R(x, wx, 41, 11, 10, "#9fd4f0"); R(x, wx, 41, 11, 3, "#cfeafa"); R(x, wx + 5, 41, 1, 10, "#4a3424"); R(x, wx, 46, 11, 1, "#4a3424");
    R(x, wx - 2, 52, 15, 2, shade(wall, -0.35)); for (let i = 0; i < 6; i++) R(x, wx + i * 2, 50, 1, 2, ["#e84a6a", "#f0c040", "#ffffff"][i % 3]); }
  // ประตู + ป้ายกลม
  R(x, 32, 44, 16, 22, "#4a2e1c"); R(x, 33, 45, 14, 21, "#8a5a32"); for (let y = 47; y < 66; y += 4) R(x, 33, y, 14, 1, "#6e4626");
  R(x, 44, 55, 2, 2, "#f0d060"); R(x, 30, 64, 20, 2, "#9a9890");
  for (let y = -8; y <= 8; y++) for (let xx = -8; xx <= 8; xx++) { const d = Math.hypot(xx, y); if (d < 8.6) R(x, 40 + xx, 26 + y, 1, 1, d > 7.4 ? "#3a2a1a" : d > 6.4 ? "#e8c070" : "#fff8e4"); }
  return c;
}
function dockSign() { // ป้ายพวงมาลัยเรือ
  const [c, x] = canvas(30, 40); R(x, 13, 22, 4, 18, "#5a3a22"); R(x, 8, 37, 14, 3, "rgba(0,0,0,.25)");
  for (let y = -13; y <= 13; y++) for (let xx = -13; xx <= 13; xx++) { const d = Math.hypot(xx, y * 1.15); if (d < 13.5) R(x, 15 + xx, 14 + y, 1, 1, d > 12 ? "#1e3a24" : "#2e5a32"); }
  for (let y = -9; y <= 9; y++) for (let xx = -11; xx <= 11; xx++) { const d = Math.hypot(xx / 1.2, y); if (d > 6.2 && d < 8) R(x, 15 + xx, 14 + y, 1, 1, "#9a6236"); }
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; for (let k = -11; k <= 11; k++) R(x, 15 + Math.round(Math.cos(a) * k), 14 + Math.round(Math.sin(a) * k * 0.8), 1, 1, "#a86e3c"); }
  return c;
}

// ตัวละคร: วาดด้วยสี่เหลี่ยม (ทิศ 0 ลง 1 ซ้าย 2 ขวา 3 ขึ้น) · เท้าอยู่ที่ (fx, fy)
function drawHero(x, fx, fy, dir, step, shirt) {
  const bob = step % 2 ? 1 : 0, X = Math.round(fx) - 6, Y = Math.round(fy) - 18 + bob;
  R(x, X + 1, Math.round(fy) - 1, 10, 2, "rgba(0,0,0,.28)");
  const legL = step === 1 ? -1 : 0, legR = step === 3 ? -1 : 0;
  R(x, X + 3, Y + 13, 3, 4 + legL, "#2a3550"); R(x, X + 6, Y + 13, 3, 4 + legR, "#2a3550");
  R(x, X + 3, Y + 16 + legL, 3, 2, "#3a2418"); R(x, X + 6, Y + 16 + legR, 3, 2, "#3a2418");
  R(x, X + 2, Y + 8, 8, 6, shirt); R(x, X + 2, Y + 12, 8, 1, shade(shirt, -0.35));
  const sw = step === 1 ? 1 : step === 3 ? -1 : 0;
  if (dir !== 1) R(x, X + 10, Y + 9 + sw, 2, 4, "#f2c49a"); if (dir !== 2) R(x, X, Y + 9 - sw, 2, 4, "#f2c49a");
  R(x, X + 2, Y + 1, 8, 7, "#f2c49a");
  R(x, X + 1, Y, 10, 3, "#3a2a20"); R(x, X + 1, Y + 3, 2, dir === 3 ? 5 : 3, "#3a2a20"); R(x, X + 9, Y + 3, 2, dir === 3 ? 5 : 3, "#3a2a20");
  if (dir === 3) R(x, X + 2, Y + 3, 8, 4, "#3a2a20");
  else { const ex = dir === 1 ? [3, 6] : dir === 2 ? [5, 8] : [4, 7]; ex.forEach((e) => R(x, X + e, Y + 4, 1, 2, "#1a1414")); R(x, X + 5 + (dir === 2 ? 1 : dir === 1 ? -1 : 0), Y + 6, 2, 1, "#c97a6a"); }
}
function drawFox(x, fx, fy, face, step) {
  const X = Math.round(fx), Y = Math.round(fy), f = face < 0 ? -1 : 1, P = (dx, dy, w, h, c) => R(x, f > 0 ? X + dx : X - dx - w, Y + dy, w, h, c);
  R(x, X - 7, Y - 1, 14, 2, "rgba(0,0,0,.25)");
  P(-9, -7, 6, 3, "#e0782a"); P(-11, -7, 3, 2, "#f6f0e6");             // หาง
  P(-4, -9, 9, 5, "#e8822e"); P(-3, -5, 7, 1, "#f6f0e6");              // ตัว
  P(-3, -4, 2, 3 - (step % 2), "#3a2418"); P(3, -4, 2, 3 - ((step + 1) % 2), "#3a2418");
  P(4, -12, 6, 5, "#e8822e"); P(8, -10, 3, 2, "#f6f0e6"); P(10, -10, 1, 1, "#1a1010"); P(7, -11, 1, 1, "#1a1010");
  P(4, -14, 2, 2, "#c0601e"); P(7, -14, 2, 2, "#c0601e");
}

// ---------- ฉากหลัง (วาดครั้งเดียว) ----------
function bakeGround(M) {
  const [c, x] = canvas(MW * T, MH * T);
  for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
    const g = M.ground[M.at(tx, ty)];
    for (let py = 0; py < T; py++) for (let px = 0; px < T; px++) {
      const X = tx * T + px, Y = ty * T + py, h = hash(X, Y, 1);
      let col;
      const pd = Math.hypot(X / T - PLAZA.x, (Y / T - PLAZA.y) * 1.15) + (hash(X, Y, 4) - 0.5) * 0.18;
      const inRing = pd > 3.55 && pd < 4.75, nearRing = pd > 3.2 && pd < 5.1;
      let gg = g;
      if (g === 1 && nearRing && !inRing) gg = 0;                     // ลานหิน: ใช้วงแหวนโค้งแทนช่องสี่เหลี่ยม
      if (g === 0 && inRing) gg = 1;
      if (gg === 1 && g === 1 && !nearRing) { // ขอบทางดินเหลื่อมเข้ากับหญ้า
        const edge = (dx, dy) => M.ground[M.at(Math.min(MW - 1, Math.max(0, tx + dx)), Math.min(MH - 1, Math.max(0, ty + dy)))] === 0;
        const e = Math.min(edge(-1, 0) ? px : 99, edge(1, 0) ? 15 - px : 99, edge(0, -1) ? py : 99, edge(0, 1) ? 15 - py : 99);
        if (e < 3 && hash(X, Y, 5) < (3 - e) / 3.2) gg = 0;
      }
      if (gg === 2) col = h < 0.06 ? "#3a82d0" : "#2f6fb7";
      else if (gg === 3) col = py % 4 === 0 ? "#5e3c20" : px === 0 || px === 15 ? "#6e4828" : h < 0.15 ? "#a8763e" : "#966432";
      else if (gg === 1) col = h < 0.12 ? "#a8613a" : h > 0.94 ? "#d89a68" : "#c47a4a";
      else col = h < 0.18 ? "#5a9a36" : h > 0.9 ? "#7cc04a" : "#6aaa3e";
      R(x, X, Y, 1, 1, col);
    }
    // ขอบทางดินกับหญ้าแบบเหลื่อม
    if (g === 1) for (let i = 0; i < 6; i++) { const px = Math.floor(hash(tx, ty, i) * 16), py = Math.floor(hash(ty, tx, i) * 16); R(x, tx * T + px, ty * T + py, 1, 1, "#5f9e38"); }
    if (g === 0 && hash(tx, ty, 7) < 0.22) { const px = 2 + Math.floor(hash(tx, ty, 8) * 12), py = 2 + Math.floor(hash(tx, ty, 9) * 12); R(x, tx * T + px, ty * T + py, 2, 2, ["#ffffff", "#f6d24a", "#f08ab0", "#9adcf0"][Math.floor(hash(tx, ty, 10) * 4)]); R(x, tx * T + px, ty * T + py + 2, 1, 2, "#3f7a2a"); }
    if (g === 0 && hash(tx, ty, 11) < 0.3) for (let i = 0; i < 3; i++) R(x, tx * T + 3 + i * 4, ty * T + 9 + (i % 2), 1, 3, "#4f8f2e");
    if (g === 2) { const n = M.ground[M.at(tx, Math.max(0, ty - 1))]; if (n !== 2 && n !== 3) R(x, tx * T, ty * T, T, 3, "#5a9ae0"); }
  }
  return c;
}

// ---------- หาเส้นทาง (BFS 4 ทิศ) ----------
function findPath(M, sx, sy, gx, gy) {
  if (!M.inb(gx, gy) || M.block[M.at(gx, gy)]) return null;
  const prev = new Int32Array(MW * MH).fill(-1), q = [M.at(sx, sy)]; prev[q[0]] = q[0];
  while (q.length) { const k = q.shift(), x = k % MW, y = (k / MW) | 0; if (x === gx && y === gy) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (!M.inb(nx, ny)) continue; const nk = M.at(nx, ny); if (prev[nk] !== -1 || M.block[nk]) continue; prev[nk] = k; q.push(nk); } }
  const goal = M.at(gx, gy); if (prev[goal] === -1) return null;
  const out = []; for (let k = goal; k !== M.at(sx, sy); k = prev[k]) out.push([k % MW, (k / MW) | 0]); return out.reverse();
}

// ---------- ติดตั้งบนหน้า ----------
export function mountWorld(host, { go, playerName = "นักผจญภัย", shirt = "#5b3df5", reduced = false }) {
  const M = buildMap();
  const ground = bakeGround(M);
  const sprites = new Map();
  const spr = (key, make) => sprites.get(key) || (sprites.set(key, make()), sprites.get(key));
  const objects = [];
  for (const t of M.trees) objects.push({ y: t.y * T + T, draw: (x) => x.drawImage(spr("t" + t.kind + (t.s < 0.5 ? 0 : 1), () => treeSprite(t.kind, t.s)), t.x * T - 6, t.y * T - 24) });
  for (const s of M.stones) objects.push({ y: s.y * T + T, draw: (x, now) => { x.drawImage(spr("s" + s.h, () => stoneSprite(s.h)), s.x * T + 1, s.y * T + T - s.h - 2);
    if (s.owl) { const ox = s.x * T + 3, oy = s.y * T + T - s.h - 9; R(x, ox, oy, 9, 9, "#7a5434"); R(x, ox + 1, oy + 3, 7, 6, "#a87a4e"); const blink = Math.floor(now / 1000) % 5 === 0 && now % 1000 < 140;
      R(x, ox + 1, oy + 2, 3, blink ? 1 : 3, "#f6c040"); R(x, ox + 5, oy + 2, 3, blink ? 1 : 3, "#f6c040"); R(x, ox + 4, oy + 5, 1, 2, "#e08a2a"); R(x, ox, oy - 1, 2, 2, "#7a5434"); R(x, ox + 7, oy - 1, 2, 2, "#7a5434"); } } });
  objects.push({ y: M.mono.y * T + T, draw: (x, now) => { const X = M.mono.x * T + 4, Y = M.mono.y * T + T - 40; R(x, X - 2, Y + 38, 28, 4, "rgba(0,0,0,.3)");
    for (let y = 0; y < 38; y++) { const top = y < 4 ? 4 - y : 0; for (let xx = top; xx < 24 - top; xx++) R(x, X + xx, Y + y, 1, 1, xx === top || xx === 23 - top || y === 0 ? "#34323a" : xx < 7 ? "#9a98a0" : xx > 17 ? "#605e68" : "#7e7b86"); }
    for (let i = 0; i < 8; i++) R(x, X + 3 + ((i * 7) % 17), Y + 2 + ((i * 5) % 6), 3, 1, "#4f8a3c");
    const glow = 0.55 + 0.45 * Math.sin(now / (reduced ? 1e9 : 500)); x.globalAlpha = glow;
    for (let k = 0; k < 4; k++) { const cx = X + 12, cy = Y + 8 + k * 7; for (let d = 0; d < 3; d++) { R(x, cx - 3 + d, cy + d, 1, 1, "#9ff6ff"); R(x, cx + 3 - d, cy + d, 1, 1, "#9ff6ff"); R(x, cx - 3 + d, cy - d + 6 - 6, 1, 1, "#9ff6ff"); } R(x, cx, cy - 1, 1, 1, "#dffcff"); R(x, cx, cy + 3, 1, 1, "#dffcff"); }
    x.globalAlpha = 1; } });
  for (const p of PLACES) {
    if (p.dock) { objects.push({ y: p.y * T + T, draw: (x) => x.drawImage(spr("dock", dockSign), (p.x - 1) * T + 1, p.y * T + T - 40) }); continue; }
    objects.push({ y: (p.y + 4) * T, draw: (x) => x.drawImage(spr("h" + p.id, () => houseSprite(p)), p.x * T, p.y * T - 4) });
  }

  // ตัวละคร (ตำแหน่งเท้า เป็นพิกเซลโลก)
  const saved = (() => { try { return sessionStorage.getItem(POS_KEY); } catch { return null; } })();
  const start = PLACES.find((p) => p.id === saved);
  const hero = { x: (start ? start.ex : Math.floor(PLAZA.x)) * T + 8, y: ((start ? start.ey : Math.floor(PLAZA.y) + 7) + 0.6) * T, dir: 0, step: 0, stepT: 0, path: null, target: null };
  const fox = { x: (PLAZA.x + 2) * T, y: (PLAZA.y + 2) * T, tx: 0, ty: 0, face: 1, step: 0, wait: 1 };
  const keys = new Set();
  const [buf, bx] = canvas(10, 10);
  const view = document.createElement("canvas");
  view.className = "world-canvas"; view.tabIndex = 0;
  view.setAttribute("role", "application");
  view.setAttribute("aria-label", "หมู่บ้านแห่งการเรียนรู้ ใช้ปุ่มลูกศรเดิน กด E เพื่อเข้าบ้าน หรือใช้ปุ่มลัดด้านล่างแผนที่");
  host.appendChild(view);
  const ui = document.createElement("div"); ui.className = "world-ui"; host.appendChild(ui);
  ui.innerHTML = `<div class="world-hint"><span class="wh-long">⌨️ ลูกศร / WASD เดิน · E เข้าบ้าน · 👆 แตะที่บ้านเพื่อเดินไปเข้า</span><span class="wh-short">👆 แตะพื้นเพื่อเดิน · แตะบ้านเพื่อเข้า</span></div><button type="button" class="world-enter" hidden></button><div class="world-fade"></div>`;
  const enterBtn = ui.querySelector(".world-enter"), fade = ui.querySelector(".world-fade");
  let S = 2, vw = 0, vh = 0, dpr = 1, cam = { x: 0, y: 0 }, near = null, leaving = false;

  function resize() {
    const w = host.clientWidth; dpr = Math.min(2, window.devicePixelRatio || 1);
    const h = w < 640 ? Math.min(Math.round(window.innerHeight * 0.62), 560) : Math.min(640, Math.max(420, Math.round(w * 0.56)));
    S = w >= 1500 ? 3 : 2; vw = Math.ceil(w / S); vh = Math.ceil(h / S);
    buf.width = vw; buf.height = vh; bx.imageSmoothingEnabled = false;
    view.style.width = w + "px"; view.style.height = h + "px"; view.width = Math.round(w * dpr); view.height = Math.round(h * dpr);
  }
  const ro = new ResizeObserver(resize); ro.observe(host); resize();

  const tileAt = (px, py) => [Math.floor(px / T), Math.floor(py / T)];
  const blocked = (px, py) => { const [tx, ty] = tileAt(px, py); return !M.inb(tx, ty) || M.block[M.at(tx, ty)]; };
  const solid = (x, y) => blocked(x - 4, y - 2) || blocked(x + 4, y - 2) || blocked(x - 4, y) || blocked(x + 4, y);
  function walkTo(tx, ty, place) { const [sx, sy] = tileAt(hero.x, hero.y - 1); const p = findPath(M, sx, sy, tx, ty); if (p) { hero.path = p; hero.target = place || null; } else if (place) hero.target = null; }
  function enter(p) {
    if (leaving) return; leaving = true;
    try { sessionStorage.setItem(POS_KEY, p.id); } catch { /* ignore */ }
    fade.classList.add("on"); setTimeout(() => go(p.href), reduced ? 0 : 320);
  }

  function update(dt, now) {
    let mx = 0, my = 0;
    if (keys.has("ArrowLeft") || keys.has("a")) mx -= 1; if (keys.has("ArrowRight") || keys.has("d")) mx += 1;
    if (keys.has("ArrowUp") || keys.has("w")) my -= 1; if (keys.has("ArrowDown") || keys.has("s")) my += 1;
    const speed = keys.has("Shift") ? 110 : 72;
    if (mx || my) hero.path = null, hero.target = null;
    else if (hero.path && hero.path.length) { const [tx, ty] = hero.path[0], gx = tx * T + 8, gy = ty * T + 10; const dx = gx - hero.x, dy = gy - hero.y, d = Math.hypot(dx, dy);
      if (d < 1.5) { hero.path.shift(); if (!hero.path.length) { hero.path = null; if (hero.target) { const t = hero.target; hero.target = null; hero.dir = 3; enter(t); } } } else { mx = dx / d; my = dy / d; } }
    const moving = !!(mx || my);
    if (moving) { const l = Math.hypot(mx, my) || 1, vx = mx / l * speed * dt, vy = my / l * speed * dt;
      if (!solid(hero.x + vx, hero.y)) hero.x += vx; if (!solid(hero.x, hero.y + vy)) hero.y += vy;
      hero.dir = Math.abs(mx) > Math.abs(my) ? (mx < 0 ? 1 : 2) : my < 0 ? 3 : 0;
      hero.stepT += dt; if (hero.stepT > 0.14) { hero.stepT = 0; hero.step = (hero.step + 1) % 4; } } else hero.step = 0;
    // หน้าประตู
    const [htx, hty] = tileAt(hero.x, hero.y - 1);
    const n = PLACES.find((p) => (htx === p.ex || htx === p.ex + (p.dock ? 1 : 0)) && (hty === p.ey || (p.dock && hty === p.ey + 1)));
    if (n !== near) { near = n; enterBtn.hidden = !n; if (n) enterBtn.textContent = `${n.ic} เข้า${n.dock ? "" : "บ้าน"}${n.name}`; }
    // สุนัขจิ้งจอกเดินเล่น
    fox.wait -= dt;
    if (fox.wait <= 0 && !fox.tx) { const a = Math.random() * Math.PI * 2, r = 2.5 + Math.random() * 1.6; fox.tx = (PLAZA.x + Math.cos(a) * r) * T; fox.ty = (PLAZA.y + Math.sin(a) * r * 0.85) * T + 8; }
    if (fox.tx) { const dx = fox.tx - fox.x, dy = fox.ty - fox.y, d = Math.hypot(dx, dy); if (d < 2) { fox.tx = 0; fox.wait = 1.5 + Math.random() * 3; } else { fox.x += dx / d * 26 * dt; fox.y += dy / d * 26 * dt; fox.face = dx < 0 ? -1 : 1; fox.stepT = (fox.stepT || 0) + dt; if (fox.stepT > 0.18) { fox.stepT = 0; fox.step++; } } }
    // กล้องตามตัวละคร
    cam.x = Math.max(0, Math.min(MW * T - vw, hero.x - vw / 2)); cam.y = Math.max(0, Math.min(MH * T - vh, hero.y - vh / 2 - 8));
    if (MW * T < vw) cam.x = (MW * T - vw) / 2; if (MH * T < vh) cam.y = (MH * T - vh) / 2;
  }

  function render(now) {
    const x = bx, cx = Math.round(cam.x), cy = Math.round(cam.y);
    R(x, 0, 0, vw, vh, "#22301c");
    x.drawImage(ground, -cx, -cy);
    x.save(); x.translate(-cx, -cy);
    // ประกายบนผิวน้ำ
    if (!reduced) for (let i = 0; i < 26; i++) { const wx = 39 * T + ((i * 53) % (9 * T)), wy = 28 * T + ((i * 37) % (6 * T)) + Math.sin(now / 600 + i) * 2; const [tx, ty] = tileAt(wx, wy); if (M.inb(tx, ty) && M.ground[M.at(tx, ty)] === 2) R(x, wx, wy, 3 + (i % 3), 1, "rgba(220,240,255,.55)"); }
    const list = objects.slice();
    list.push({ y: fox.y, draw: (c) => drawFox(c, fox.x, fox.y, fox.face, fox.step) });
    list.push({ y: hero.y, draw: (c) => drawHero(c, hero.x, hero.y, hero.dir, hero.step, shirt) });
    list.sort((a, b) => a.y - b.y);
    for (const o of list) o.draw(x, now);
    // หิ่งห้อย
    if (!reduced) for (let i = 0; i < 14; i++) { const t = now / 1000 + i * 7.3; const fx = PLAZA.x * T + Math.sin(t * 0.7 + i) * 70, fy = PLAZA.y * T + Math.cos(t * 0.5 + i * 2) * 50; x.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 2)); R(x, fx, fy, 1, 1, i % 2 ? "#bff8ff" : "#fff2a0"); }
    x.globalAlpha = 1; x.restore();
    // ขยายภาพแบบพิกเซลคม แล้ววาดป้ายตัวหนังสือที่ความละเอียดจริง
    const v = view.getContext("2d"); v.imageSmoothingEnabled = false;
    v.setTransform(1, 0, 0, 1, 0, 0); v.drawImage(buf, 0, 0, vw * S * dpr, vh * S * dpr);
    const k = S * dpr, fs = Math.round((S >= 3 ? 13 : 11) * dpr);
    v.font = `700 ${fs}px "Noto Sans Thai", system-ui, sans-serif`; v.textAlign = "center"; v.textBaseline = "middle";
    const tag = (label, wx, wy, bg, fg = "#fff") => { const X = (wx - cx) * k, Y = (wy - cy) * k; if (X < -200 || Y < -40 || X > view.width + 200 || Y > view.height + 40) return;
      const w = v.measureText(label).width + 12 * dpr, h = fs + 8 * dpr; v.fillStyle = bg; v.fillRect(Math.round(X - w / 2), Math.round(Y - h / 2), Math.round(w), Math.round(h));
      v.fillStyle = "rgba(0,0,0,.35)"; v.fillRect(Math.round(X - w / 2), Math.round(Y + h / 2), Math.round(w), Math.round(2 * dpr)); v.fillStyle = fg; v.fillText(label, X, Y + dpr); };
    for (const p of PLACES) {
      if (p.dock) { tag(`${p.ic} ${p.name}`, p.x * T, p.y * T - 30, near === p ? "#ffcf3a" : "rgba(20,40,24,.88)", near === p ? "#1a1420" : "#fff"); continue; }
      v.font = `${Math.round(9 * k)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`; v.fillText(p.ic, (p.x * T + 40 - cx) * k, (p.y * T + 22.5 - cy) * k);
      v.font = `700 ${fs}px "Noto Sans Thai", system-ui, sans-serif`;
      tag(p.name, p.x * T + 40, p.y * T - 12, near === p ? "#ffcf3a" : "rgba(24,18,30,.82)", near === p ? "#1a1420" : "#fff");
    }
    tag(playerName, hero.x, hero.y - 26, "rgba(91,61,245,.9)");
    if (near) tag(`กด E หรือแตะปุ่มด้านล่าง เพื่อเข้า`, near.dock ? near.x * T + 16 : near.x * T + 40, (near.dock ? near.y * T - 48 : near.y * T - 30), "rgba(255,255,255,.95)", "#1a1420");
  }

  // ---------- อินพุต ----------
  const onKey = (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (e.type === "keydown") {
      if ((k === "e" || k === "Enter" || k === " ") && near) { e.preventDefault(); enter(near); return; }
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "w", "a", "s", "d", "Shift"].includes(k)) { e.preventDefault(); keys.add(k); }
    } else keys.delete(k);
  };
  view.addEventListener("keydown", onKey); view.addEventListener("keyup", onKey);
  view.addEventListener("blur", () => keys.clear());
  view.addEventListener("pointerdown", (e) => {
    view.focus({ preventScroll: true });
    const r = view.getBoundingClientRect(), wx = (e.clientX - r.left) / S + cam.x, wy = (e.clientY - r.top) / S + cam.y;
    const house = PLACES.find((p) => p.dock ? wx >= p.x * T - 4 && wx < p.x * T + 40 && wy >= p.y * T - 30 && wy < (p.y + 6) * T : wx >= p.x * T && wx < (p.x + 5) * T && wy >= p.y * T - 14 && wy < (p.y + 4) * T);
    if (house) { if (near === house) enter(house); else walkTo(house.ex, house.ey, house); return; }
    walkTo(Math.floor(wx / T), Math.floor(wy / T));
  });
  enterBtn.addEventListener("click", () => near && enter(near));

  // ---------- ลูป ----------
  let raf = 0, last = performance.now(), visible = true;
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; }); io.observe(view);
  const loop = (now) => { raf = requestAnimationFrame(loop); if (!visible || document.hidden) { last = now; return; } const dt = Math.min(0.05, (now - last) / 1000); last = now; update(dt, now); render(now); };
  raf = requestAnimationFrame(loop);
  return {
    places: PLACES,
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); view.remove(); ui.remove(); },
    // สำหรับทดสอบ: ตรวจว่าทุกบ้านเดินไปถึงได้
    reachable() { const [sx, sy] = tileAt(hero.x, hero.y - 1); return PLACES.map((p) => ({ id: p.id, ok: !!findPath(M, sx, sy, p.ex, p.ey) || (sx === p.ex && sy === p.ey) })); },
    _hero: hero,
    walkToPlace(id) { const p = PLACES.find((x) => x.id === id); if (p) walkTo(p.ex, p.ey, p); },
  };
}
