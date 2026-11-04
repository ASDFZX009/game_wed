// หมู่บ้านแห่งการเรียนรู้: แผนที่พิกเซลอาร์ตมุมมอง 2.5D (แนว HD-2D) มีตัวละครเดินเข้าบ้านตามวิชา
// วาดด้วยโค้ดทั้งหมด (ไม่มีไฟล์ภาพ) · คีย์บอร์ด: ลูกศร/WASD เดิน, Shift วิ่ง, E/Enter เข้าบ้าน · เมาส์/นิ้ว: แตะที่บ้านหรือพื้นเพื่อเดินไป
// ชั้นภาพ: พื้น (หญ้ายกสูงเหนือทางทราย) → วัตถุเรียงตามแนวลึก → เงาเมฆ/แสงไฟ → (CSS) เบลอขอบแบบ tilt-shift + ขอบมืด + แสงอุ่น → ป้ายความละเอียดสูง

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

// ชาวบ้าน: ยืนข้างทาง มีฟอง "…" เดินเข้าใกล้แล้วจะพูด
const VILLAGERS = [
  { at: [17, 9], look: { shirt: "#5f8f3a", pants: "#6a4a2a", hat: "#e8c46a", band: "#b0453a" }, tip: "บ้านคณิตศาสตร์กับวิทยาศาสตร์อยู่ทางทิศเหนือ ลองแวะไปดูสิ" },
  { at: [31, 18], look: { shirt: "#c0392b", hair: "#7a3a1a", apron: "#f2ead6", pants: "#4a3a2a" }, tip: "ร้านค้ามีกล่องสุ่มรูปโปรไฟล์ด้วยนะ ได้อะไรมาไปดูในกระเป๋าได้เลย" },
  { at: [40, 24], look: { shirt: "#3a7ab8", cap: "#2e4a6a", pants: "#3a3a48" }, tip: "ที่ท่าเรือมีเกมตกปลาตอบคำถาม ยิ่งออกทะเลลึก คำถามยิ่งยาก!" },
  { at: [19, 21], look: { shirt: "#7d5a9a", hair: "#d8d4cc", beard: "#e8e4dc", pants: "#4a4058" }, tip: "กด Shift ค้างไว้เพื่อวิ่ง หรือแตะที่บ้านเพื่อเดินไปเองก็ได้" },
  { at: [10, 18], look: { shirt: "#f0b030", hair: "#1e1a18", pants: "#2a5a8a" }, tip: "เล่นเกมจบแล้วได้เหรียญ เอาไปซื้อของแต่งตัวในร้านค้าได้นะ" },
  { at: [33, 11], look: { dress: "#e86a9a", shirt: "#f4a6c4", hair: "#5a2e1a", long: true }, tip: "แต่ละบ้านมีเกมของวิชานั้น ๆ เดินเข้าไปเลือกเล่นได้เลย" },
];

// ---------- เครื่องมือพิกเซล ----------
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const canvas = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d", { willReadFrequently: true }); x.imageSmoothingEnabled = false; return [c, x]; };
const R = (x, X, Y, w, h, c) => { x.fillStyle = c; x.fillRect(Math.round(X), Math.round(Y), w, h); };
function shade(hex, k) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; const f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); return `rgb(${f(r)},${f(g)},${f(b)})`; }
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const css = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
function vnoise(x, y, s) { // value noise นุ่ม ๆ สำหรับแต้มสีเป็นหย่อม
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
// ใส่เส้นขอบเข้ม 1px รอบสไปรต์ (ไม่นับเงาโปร่งแสง) แล้วคืน {c, ax, ay} จุดยึดเลื่อนตาม
function outline(src, ax = 0, ay = 0, col = [30, 24, 36]) {
  const w = src.width, h = src.height, [c, x] = canvas(w + 2, h + 2);
  const s = src.getContext("2d").getImageData(0, 0, w, h).data, out = x.createImageData(w + 2, h + 2), o = out.data;
  const A = (X, Y) => (X < 0 || Y < 0 || X >= w || Y >= h ? 0 : s[(Y * w + X) * 4 + 3]);
  for (let Y = 0; Y < h + 2; Y++) for (let X = 0; X < w + 2; X++) {
    const sx = X - 1, sy = Y - 1, a = A(sx, sy), k = (Y * (w + 2) + X) * 4;
    if (a < 160 && (A(sx - 1, sy) >= 160 || A(sx + 1, sy) >= 160 || A(sx, sy - 1) >= 160 || A(sx, sy + 1) >= 160)) { o[k] = col[0]; o[k + 1] = col[1]; o[k + 2] = col[2]; o[k + 3] = 255; continue; }
    if (a > 0) { const j = (sy * w + sx) * 4; o[k] = s[j]; o[k + 1] = s[j + 1]; o[k + 2] = s[j + 2]; o[k + 3] = a; }
  }
  x.putImageData(out, 0, 0);
  return { c, ax: ax + 1, ay: ay + 1 };
}
const ellipseShadow = (x, cx, cy, w, a = 0.3) => { x.fillStyle = `rgba(24,34,12,${a})`; x.fillRect(Math.round(cx - w / 2 + 2), Math.round(cy - 1), w - 4, 1); x.fillRect(Math.round(cx - w / 2), Math.round(cy), w, 2); x.fillRect(Math.round(cx - w / 2 + 2), Math.round(cy + 2), w - 4, 1); };

// ---------- สร้างแผนที่ ----------
// พื้น: 0 หญ้า 1 ทางดิน 2 น้ำ 3 ท่าไม้ · block: เดินผ่านไม่ได้
function buildMap() {
  const ground = new Uint8Array(MW * MH), block = new Uint8Array(MW * MH);
  const at = (x, y) => y * MW + x, inb = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
  // บ่อน้ำมุมขวาล่าง
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const dx = (x - 44.5) / 5.6, dy = (y - 31) / 3.6; if (dx * dx + dy * dy < 1 + (hash(x, y, 3) - 0.5) * 0.25) { ground[at(x, y)] = 2; block[at(x, y)] = 1; } }
  // วงลานหิน (ทางดินเป็นวงแหวน)
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const d = Math.hypot(x + 0.5 - PLAZA.x, (y + 0.5 - PLAZA.y) * 1.15); if (d > 3.4 && d < 4.9) ground[at(x, y)] = 1; }
  // ทางดิน: หาเส้นทางสั้นสุดจากหน้าประตูไปยังวงลาน โดยอ้อมบ้านและน้ำ แล้วปูกว้าง 2×2 ช่อง
  const house = new Uint8Array(MW * MH);
  for (const p of PLACES) { p.ex = p.dock ? p.x + 1 : p.x + 2; p.ey = p.dock ? p.y : p.y + 4; // ช่องหน้าประตู
    if (!p.dock) for (let y = p.y - 1; y < p.y + 4; y++) for (let x = p.x - 1; x < p.x + 6; x++) if (inb(x, y)) house[at(x, y)] = 1; }
  const ringMask = ground.slice(), ring = (k) => ringMask[k] === 1; // ทุกทางมุ่งสู่ลานกลาง (แผนผังแบบรัศมี)
  const paint = (x, y) => { if (inb(x, y) && !house[at(x, y)] && ground[at(x, y)] !== 2) ground[at(x, y)] = 1; };
  const carve = (sx, sy, goal) => {
    const prev = new Int32Array(MW * MH).fill(-1), q = [at(sx, sy)]; prev[q[0]] = q[0]; let end = -1;
    while (q.length) { const k = q.shift(); if (goal(k)) { end = k; break; } const x = k % MW, y = (k / MW) | 0;
      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) { const nx = x + dx, ny = y + dy; if (!inb(nx, ny)) continue; const nk = at(nx, ny);
        if (prev[nk] !== -1 || house[nk] || ground[nk] === 2) continue; prev[nk] = k; q.push(nk); } }
    for (let k = end; k >= 0 && k !== prev[k]; k = prev[k]) { const x = k % MW, y = (k / MW) | 0; ground[k] = 1; paint(x + 1, y); paint(x, y + 1); paint(x + 1, y + 1); }
    ground[at(sx, sy)] = 1;
  };
  carve(Math.floor(PLAZA.x) - 1, MH - 1, ring); // ทางเข้าหมู่บ้านด้านใต้
  for (const p of PLACES) carve(p.ex, p.ey, ring);
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

  // ---------- ของประกอบฉาก (วางบนหญ้าเท่านั้น จึงไม่ทับทางเดิน) ----------
  const props = [], hedges = [], npcs = [];
  const grassFree = (x, y) => inb(x, y) && ground[at(x, y)] === 0 && !block[at(x, y)];
  const nearPath = (x, y) => [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => inb(x + dx, y + dy) && ground[at(x + dx, y + dy)] === 1);
  const plazaD = (x, y) => Math.hypot(x + 0.5 - PLAZA.x, (y + 0.5 - PLAZA.y) * 1.15);
  const rectFree = (x, y, w, h) => { for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) { const X = x + i, Y = y + j, core = i >= 0 && j >= 0 && i < w && j < h;
    if (!inb(X, Y)) { if (core) return false; continue; } const k = at(X, Y); if (block[k]) return false; if (core && ground[k] !== 0) return false; } return true; };
  const mark = (x, y, w, h) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) block[at(x + i, y + j)] = 1; };
  const put = (kind, x, y, w = 1, h = 1) => { mark(x, y, w, h); props.push({ kind, x, y, w, h, v: hash(x, y, 70) }); };
  const spot = (x0, y0, ok) => { for (let r = 0; r < 6; r++) { let best = null, bd = 1e9;
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { if (Math.max(Math.abs(i), Math.abs(j)) !== r) continue; const x = x0 + i, y = y0 + j; if (!ok(x, y)) continue; const dd = i * i + j * j; if (dd < bd) { bd = dd; best = [x, y]; } }
    if (best) return best; } return null; };
  // ข้างบ้าน: ถัง ลัง กระถาง โคมไฟ
  const SETS = [["barrel", "crate"], ["pot", "lamp"], ["crate", "barrel"], ["lamp", "pot"], ["barrel", "pot"]];
  PLACES.forEach((p, i) => { if (p.dock) return; const [a, b] = SETS[i % SETS.length];
    if (grassFree(p.x - 1, p.y + 3)) put(a, p.x - 1, p.y + 3);
    if (grassFree(p.x + 5, p.y + 3)) put(b, p.x + 5, p.y + 3);
    if (i % 2 === 0 && grassFree(p.x + 5, p.y + 2)) put("crate", p.x + 5, p.y + 2);
    if (i % 2 === 1 && grassFree(p.x - 1, p.y + 2)) put("barrel", p.x - 1, p.y + 2);
  });
  // แผงตลาด (เต็นท์ผ้าใบ) รอบลาน
  for (const a of [0.42, 2.72, 3.62, 5.86, 1.62]) { const tx = Math.round(PLAZA.x - 1 + Math.cos(a) * 9.2), ty = Math.round(PLAZA.y - 1 + Math.sin(a) * 7.4); if (rectFree(tx, ty, 2, 2)) put("tent", tx, ty, 2, 2); }
  // โคมไฟรอบลาน + ป้ายทางเข้า
  for (const a of [0.95, 2.2, 4.05, 5.35]) { const s = spot(Math.round(PLAZA.x - 0.5 + Math.cos(a) * 7.4), Math.round(PLAZA.y - 0.5 + Math.sin(a) * 6.4), (x, y) => grassFree(x, y) && nearPath(x, y) && plazaD(x, y) > 6.6); if (s) put("lamp", s[0], s[1]); }
  { const s = spot(26, 23, (x, y) => grassFree(x, y) && nearPath(x, y)); if (s) put("sign", s[0], s[1]); }
  // แปลงพุ่มไม้ยกสูงหน้ากำแพงหิน
  const hr = rng(77);
  for (let n = 0, tries = 0; n < 9 && tries < 900; tries++) {
    const w = [2, 3, 3, 4, 5][Math.floor(hr() * 5)], h = 2, x = 3 + Math.floor(hr() * (MW - 6 - w)), y = 3 + Math.floor(hr() * (MH - 6 - h));
    if (plazaD(x + w / 2, y + h / 2) < 8.5 || Math.hypot(x + w / 2 - 44.5, y + h / 2 - 31) < 7.5 || !rectFree(x, y, w, h)) continue;
    mark(x, y, w, h); hedges.push({ x, y, w, h }); n++;
  }
  // พุ่มไม้เล็กเรียงข้างทาง
  for (let n = 0, tries = 0; n < 16 && tries < 900; tries++) { const x = 2 + Math.floor(hr() * (MW - 4)), y = 2 + Math.floor(hr() * (MH - 4));
    if (grassFree(x, y) && nearPath(x, y) && plazaD(x, y) > 7 && rectFree(x, y, 1, 1)) { put("bush", x, y); n++; } }
  // ชาวบ้าน
  for (const v of VILLAGERS) { const s = spot(v.at[0], v.at[1], (x, y) => grassFree(x, y) && nearPath(x, y) && rectFree(x, y, 1, 1)); if (s) { mark(s[0], s[1], 1, 1); npcs.push({ ...v, x: s[0], y: s[1], dir: 0 }); } }

  // ต้นไม้: ขอบป่า + กลุ่มต้นไม้ (เว้นทาง บ้าน น้ำ และของประกอบฉาก)
  const trees = [], free = (x, y, m) => { for (let j = -m; j <= m; j++) for (let i = -m; i <= m; i++) { if (!inb(x + i, y + j)) continue; const k = at(x + i, y + j); if (block[k] || ground[k]) return false; } return true; };
  const r = rng(20261105);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const edge = Math.min(x, y, MW - 1 - x, MH - 1 - y);
    const pPlace = edge < 2 ? 0.92 : edge < 3 ? 0.55 : 0.06;
    if (r() < pPlace && free(x, y, edge < 2 ? 0 : 1) && plazaD(x, y) > 7.5) {
      trees.push({ x, y, kind: r() < 0.45 ? "pine" : r() < 0.72 ? "round" : "autumn", s: r() }); block[at(x, y)] = 1; }
  }
  return { ground, block, stones, mono, trees, props, hedges, npcs, at, inb };
}

// ---------- สไปรต์ (ทุกตัวคืน {c, ax, ay} = จุดยึดที่โคน/เท้า) ----------
const PAL = {
  round: ["#1f4f26", "#2f7032", "#46923c", "#6db44c", "#9bd468"],
  round2: ["#22552a", "#347a36", "#4f9c40", "#7cc052", "#addc72"],
  autumn: ["#6e2e16", "#9a4a1e", "#c8702c", "#e89a48", "#f6c87a"],
};
function roundTree(kind, s) {
  const [c, x] = canvas(40, 50), pal = kind === "autumn" ? PAL.autumn : s < 0.5 ? PAL.round : PAL.round2;
  ellipseShadow(x, 20, 45, 26, 0.34);
  R(x, 17, 30, 6, 16, "#6a4428"); R(x, 17, 30, 2, 16, "#8a5a34"); R(x, 21, 30, 2, 16, "#4a2e1a"); R(x, 14, 44, 4, 2, "#5a3a22"); R(x, 22, 44, 4, 2, "#4a2e1a");
  const blobs = s < 0.5 ? [[20, 13, 11], [10, 21, 9], [30, 20, 9], [20, 27, 10], [12, 29, 7], [29, 30, 7]] : [[19, 12, 10], [28, 16, 9], [11, 19, 9], [21, 24, 11], [30, 28, 7], [11, 29, 7]];
  blobs.forEach(([bx, by, r], b) => { for (let y = by - r; y <= by + r; y++) for (let X = bx - r; X <= bx + r; X++) {
    const dx = (X - bx) / r, dy = (y - by) / r, d = dx * dx + dy * dy + (hash(X, y, b + 3) - 0.5) * 0.3; if (d > 1 || y < 0) continue;
    const lit = -dx * 0.55 - dy * 0.85 + (hash(X >> 1, y >> 1, 60 + b) - 0.5) * 0.55;
    R(x, X, y, 1, 1, pal[d > 0.78 ? 0 : lit > 0.8 ? 4 : lit > 0.25 ? 3 : lit > -0.35 ? 2 : 1]); } });
  for (let i = 0; i < 7; i++) R(x, 8 + Math.floor(hash(i, 1, kind.length) * 24), 6 + Math.floor(hash(i, 2, kind.length) * 20), 1, 1, pal[4]);
  return outline(c, 20, 46);
}
function pineTree(s) {
  const [c, x] = canvas(28, 42);
  ellipseShadow(x, 14, 39, 18, 0.34); R(x, 12, 31, 4, 9, "#5a3a22"); R(x, 12, 31, 1, 9, "#7a5232");
  const g = s < 0.5 ? ["#173f26", "#245a32", "#367a40", "#58a050"] : ["#1b4a2c", "#2a663a", "#3f8a46", "#68b05a"];
  for (let i = 0; i < 4; i++) { const w = 8 + i * 5, y0 = 2 + i * 7; for (let j = 0; j < 9; j++) { const ww = Math.round(w * (j + 2) / 11); for (let k = 0; k < ww; k++) { const X = Math.round(14 - ww / 2) + k, f = k / ww;
    R(x, X, y0 + j, 1, 1, j < 2 ? g[3] : f < 0.35 && j < 6 ? g[3] : f > 0.7 || j > 6 ? g[0] : j < 5 ? g[2] : g[1]); } } }
  R(x, 13, 0, 2, 3, g[3]);
  return outline(c, 14, 39);
}
function stoneSprite(h) {
  const [c, x] = canvas(14, h + 4); ellipseShadow(x, 7, h + 1, 14, 0.3);
  for (let y = 0; y < h; y++) { const top = y < 3 ? 3 - y : 0; for (let xx = 1 + top; xx < 13 - top; xx++) R(x, xx, y + 1, 1, 1, y === 0 ? "#b4b2b8" : xx < 5 ? "#a2a0a6" : xx > 9 ? "#66646c" : "#86838c"); }
  for (let i = 0; i < 4; i++) R(x, 2, 6 + i * 6, 10, 1, "rgba(40,36,44,.35)");
  for (let i = 0; i < 10; i++) R(x, 2 + ((i * 5) % 9), 2 + ((i * 3) % 5), 2, 1, i % 3 ? "#4f8a3c" : "#6fae4a");
  return outline(c, 7, h + 1);
}
function monoSprite() {
  const [c, x] = canvas(28, 44); ellipseShadow(x, 14, 41, 28, 0.32);
  for (let y = 0; y < 38; y++) { const top = y < 4 ? 4 - y : 0; for (let xx = top; xx < 24 - top; xx++) R(x, 2 + xx, 2 + y, 1, 1, y === 0 ? "#b0aeb8" : xx < 7 ? "#9a98a0" : xx > 17 ? "#5c5a64" : "#7e7b86"); }
  for (let i = 0; i < 8; i++) R(x, 5 + ((i * 7) % 17), 4 + ((i * 5) % 6), 3, 1, i % 2 ? "#4f8a3c" : "#6fae4a");
  return outline(c, 14, 40);
}
function houseSprite(p) {
  const [c, x] = canvas(80, 72);
  const roof = p.roof, wall = p.wall;
  R(x, 2, 66, 78, 6, "rgba(24,34,12,.32)");
  // ผนัง (แสงจากซ้ายบน)
  for (let y = 34; y < 66; y++) { R(x, 5, y, 70, 1, y % 5 === 0 ? shade(wall, -0.12) : wall); R(x, 52, y, 23, 1, y % 5 === 0 ? shade(wall, -0.2) : shade(wall, -0.08)); }
  R(x, 5, 34, 3, 32, shade(wall, 0.25)); R(x, 72, 34, 3, 32, shade(wall, -0.32));
  R(x, 5, 35, 70, 3, "rgba(0,0,0,.18)");
  // ฐานหิน
  for (let X = 5, i = 0; X < 75; i++) { const w = 5 + Math.floor(hash(i, 1, p.x) * 4); R(x, X, 60, Math.min(w, 75 - X) - 1, 6, hash(i, 2, p.y) < 0.5 ? "#a8a49a" : "#928e86"); R(x, X, 60, Math.min(w, 75 - X) - 1, 1, "#c8c4ba"); X += w; }
  if (p.shop) { for (let i = 0; i < 9; i++) { R(x, 2 + i * 8.5, 30, 8, 8, i % 2 ? "#f6f0e8" : roof); R(x, 2 + i * 8.5, 37, 8, 2, i % 2 ? "#d8d0c4" : shade(roof, -0.3)); } R(x, 2, 39, 76, 1, "rgba(0,0,0,.3)"); }
  // หลังคา (มองเฉียง: ลาดหน้า + จั่ว)
  for (let y = 0; y < 34; y++) { const inset = Math.max(0, 8 - y); for (let xx = inset; xx < 80 - inset; xx++) {
    const row = Math.floor(y / 3), brick = ((xx + (row % 2) * 3) % 6 === 0) || y % 3 === 0;
    R(x, xx, y, 1, 1, y >= 31 ? shade(roof, -0.45) : y < 2 ? shade(roof, 0.35) : brick ? shade(roof, -0.18) : xx < 28 ? shade(roof, 0.08) : xx < 54 ? roof : shade(roof, -0.1)); } }
  R(x, 0, 33, 80, 2, shade(roof, -0.55));
  if (p.thai) { for (const sx of [3, 76]) { R(x, sx, 22, 2, 12, "#e8b830"); R(x, sx - (sx < 40 ? 1 : -1), 20, 2, 3, "#e8b830"); } R(x, 38, 0, 4, 3, "#e8b830"); }
  if (!p.shop) { R(x, 60, 2, 8, 10, "#7a5a4a"); R(x, 60, 2, 8, 2, "#5a3e30"); R(x, 60, 2, 2, 10, "#9a7a68"); }
  // หน้าต่างไฟอุ่น + กระบะดอกไม้
  for (const wx of [12, 57]) { R(x, wx - 1, 40, 13, 12, "#4a3424"); R(x, wx, 41, 11, 10, "#ffe2a0"); R(x, wx, 41, 11, 3, "#fff4cc"); R(x, wx + 6, 44, 5, 7, "#f6c878"); R(x, wx + 5, 41, 1, 10, "#4a3424"); R(x, wx, 46, 11, 1, "#4a3424");
    R(x, wx - 2, 52, 15, 3, "#7a4a2a"); R(x, wx - 2, 52, 15, 1, "#9a6a40"); for (let i = 0; i < 7; i++) { R(x, wx - 1 + i * 2, 50, 2, 2, ["#e84a6a", "#f0c040", "#ffffff", "#c070e0"][i % 4]); R(x, wx - 1 + i * 2, 51, 1, 1, "#3f8a2e"); } }
  // ประตู + ป้ายกลม
  R(x, 32, 44, 16, 22, "#4a2e1c"); R(x, 33, 45, 14, 21, "#8a5a32"); R(x, 33, 45, 3, 21, "#a06c3c"); for (let y = 47; y < 66; y += 4) R(x, 33, y, 14, 1, "#6e4626");
  R(x, 44, 55, 2, 2, "#f0d060"); R(x, 29, 64, 22, 2, "#b8b4aa");
  for (let y = -8; y <= 8; y++) for (let xx = -8; xx <= 8; xx++) { const d = Math.hypot(xx, y); if (d < 8.6) R(x, 40 + xx, 26 + y, 1, 1, d > 7.4 ? "#3a2a1a" : d > 6.4 ? "#e8c070" : "#fff8e4"); }
  return outline(c, 0, 0);
}
function dockSign() { // ป้ายพวงมาลัยเรือ
  const [c, x] = canvas(30, 40); R(x, 13, 22, 4, 18, "#5a3a22"); ellipseShadow(x, 15, 38, 14, 0.3);
  for (let y = -13; y <= 13; y++) for (let xx = -13; xx <= 13; xx++) { const d = Math.hypot(xx, y * 1.15); if (d < 13.5) R(x, 15 + xx, 14 + y, 1, 1, d > 12 ? "#1e3a24" : xx + y < -6 ? "#3a6a3c" : "#2e5a32"); }
  for (let y = -9; y <= 9; y++) for (let xx = -11; xx <= 11; xx++) { const d = Math.hypot(xx / 1.2, y); if (d > 6.2 && d < 8) R(x, 15 + xx, 14 + y, 1, 1, "#9a6236"); }
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; for (let k = -11; k <= 11; k++) R(x, 15 + Math.round(Math.cos(a) * k), 14 + Math.round(Math.sin(a) * k * 0.8), 1, 1, "#a86e3c"); }
  return outline(c, 0, 0);
}
function hedgeSprite(w, h) {
  const W = w * T, top = h * T, WALL = 10, [c, x] = canvas(W, top + WALL + 3);
  R(x, 1, top + WALL, W - 2, 3, "rgba(24,34,12,.32)");
  for (let y = 0; y < WALL; y++) for (let X = 0; X < W; X++) { // กำแพงหิน
    const row = Math.floor(y / 5), off = row % 2 ? 4 : 0, sx = Math.floor((X + off) / 8), lx = (X + off) % 8, ly = y % 5, hv = hash(sx, row, 51 + w);
    let col = lx === 0 || ly === 4 ? [70, 64, 56] : mul(hv < 0.33 ? [156, 150, 138] : hv < 0.66 ? [132, 126, 116] : [172, 164, 150], ly === 0 ? 1.12 : lx === 7 || ly === 3 ? 0.84 : 1);
    if (X === W - 1 || X === W - 2) col = mul(col, 0.75);
    R(x, X, top + y, 1, 1, css(col));
  }
  for (let i = 0; i < w * 3; i++) R(x, Math.floor(hash(i, w, 52) * (W - 3)), top + Math.floor(hash(i, h, 53) * 4), 2 + (i % 2), 1, i % 2 ? "#5a9a3a" : "#447a2e");
  const pal = ["#24572a", "#33733a", "#4a9443", "#6cb650", "#98d26a"];
  for (let y = 0; y < top + 3; y++) for (let X = 0; X < W; X++) { // พุ่มไม้ด้านบน
    const bumpTop = Math.round(1.5 + Math.sin(X * 0.62 + w) * 1.5 + hash(X >> 1, 0, 54));
    if (y < bumpTop) continue;
    if (y >= top && hash(X, y, 55) > 0.55 - (y - top) * 0.18) continue; // ใบห้อยลงคลุมกำแพง
    const cy = Math.floor(y / 5), off = (cy & 1) * 3, cx = Math.floor((X + off) / 6), lx = (X + off) - cx * 6 - 2.5, ly = y - cy * 5 - 2, dd = Math.hypot(lx, ly * 1.2);
    let idx = dd > 2.9 ? 1 : lx + ly < -2 ? 4 : lx + ly < 0.5 ? 3 : 2;
    if (y < bumpTop + 2) idx = Math.min(4, idx + 1);
    if (y > top - 5) idx = Math.max(0, idx - 1); if (y >= top - 1) idx = 0;
    if (X === 0) idx = Math.min(idx + 1, 4); if (X >= W - 2) idx = Math.max(0, idx - 2);
    R(x, X, y, 1, 1, pal[idx]);
  }
  for (let i = 0; i < w * 2; i++) if (hash(i, w, 56) < 0.6) { const X = 3 + Math.floor(hash(i, 3, 57) * (W - 6)), Y = 4 + Math.floor(hash(i, 4, 58) * (top - 9)); R(x, X, Y, 2, 2, w % 2 ? "#f4f0e8" : "#f08ab0"); R(x, X, Y, 1, 1, "#fff"); }
  return outline(c, 0, 0);
}
const PROP = {
  barrel() { const [c, x] = canvas(12, 16); ellipseShadow(x, 6, 14, 12, 0.32);
    for (let y = 2; y < 15; y++) { const bul = y > 4 && y < 12 ? 0 : 1; for (let X = 1 + bul; X < 11 - bul; X++) R(x, X, y, 1, 1, X < 4 ? "#b57a42" : X > 8 ? "#6e4422" : "#93602f"); }
    for (const y of [5, 11]) R(x, 1, y, 10, 1, "#4a4048"); R(x, 2, 1, 8, 3, "#a87444"); R(x, 3, 2, 6, 1, "#7a4e28"); return outline(c, 6, 14); },
  crate() { const [c, x] = canvas(14, 15); ellipseShadow(x, 7, 13, 14, 0.32);
    R(x, 1, 1, 12, 4, "#d6a468"); R(x, 1, 1, 12, 1, "#ecc28a"); R(x, 1, 5, 12, 9, "#a5703c"); for (let i = 0; i < 3; i++) R(x, 1, 7 + i * 3, 12, 1, "#86562c");
    R(x, 1, 5, 2, 9, "#7a4c26"); R(x, 11, 5, 2, 9, "#7a4c26"); R(x, 1, 5, 12, 1, "#6e4422"); R(x, 3, 1, 1, 4, "#b88550"); R(x, 9, 1, 1, 4, "#b88550"); return outline(c, 7, 13); },
  pot() { const [c, x] = canvas(12, 18); ellipseShadow(x, 6, 16, 12, 0.3);
    for (let y = 10; y < 17; y++) { const ins = Math.floor((y - 10) / 3); R(x, 2 + ins, y, 8 - ins * 2, 1, "#c0603a"); R(x, 2 + ins, y, 2, 1, "#d8805a"); } R(x, 1, 9, 10, 2, "#a84c2c");
    R(x, 3, 3, 2, 7, "#3f8a2e"); R(x, 7, 2, 2, 8, "#3f8a2e"); R(x, 5, 5, 2, 5, "#58a83a"); R(x, 1, 6, 3, 2, "#58a83a"); R(x, 8, 5, 3, 2, "#58a83a");
    R(x, 2, 1, 3, 3, "#f04a6a"); R(x, 7, 0, 3, 3, "#f6c840"); R(x, 5, 3, 2, 2, "#ffffff"); R(x, 3, 1, 1, 1, "#ff98a8"); return outline(c, 6, 16); },
  lamp() { const [c, x] = canvas(10, 32); ellipseShadow(x, 5, 30, 10, 0.3);
    R(x, 4, 9, 2, 21, "#3a3040"); R(x, 4, 9, 1, 21, "#5a5060"); R(x, 2, 28, 6, 2, "#3a3040");
    R(x, 1, 1, 8, 2, "#2a2430"); R(x, 2, 3, 6, 6, "#ffe6a0"); R(x, 2, 3, 2, 6, "#fff6d0"); R(x, 2, 3, 6, 1, "#2a2430"); R(x, 2, 8, 6, 1, "#2a2430"); R(x, 4, 0, 2, 1, "#2a2430"); return outline(c, 5, 30); },
  sign() { const [c, x] = canvas(18, 24); ellipseShadow(x, 9, 22, 10, 0.3);
    R(x, 8, 6, 2, 17, "#6a4428"); R(x, 8, 6, 1, 17, "#8a5a34");
    R(x, 1, 3, 13, 6, "#b8844a"); R(x, 14, 4, 2, 4, "#b8844a"); R(x, 16, 5, 1, 2, "#b8844a"); R(x, 1, 3, 13, 1, "#d8a46a"); R(x, 3, 5, 8, 1, "#5a3a20"); R(x, 3, 7, 5, 1, "#5a3a20");
    R(x, 3, 11, 12, 5, "#a87440"); R(x, 1, 12, 2, 3, "#a87440"); R(x, 3, 11, 12, 1, "#c89458"); R(x, 5, 13, 8, 1, "#5a3a20"); return outline(c, 9, 22); },
  bush(v) { const [c, x] = canvas(18, 14); ellipseShadow(x, 9, 12, 16, 0.3); const pal = ["#24572a", "#33733a", "#4a9443", "#6cb650", "#98d26a"];
    for (const [bx, by, r] of [[6, 7, 5], [12, 7, 5], [9, 5, 5]]) for (let y = by - r; y <= by + r; y++) for (let X = bx - r; X <= bx + r; X++) { const dx = (X - bx) / r, dy = (y - by) / r, d = dx * dx + dy * dy; if (d > 1 || y > 12) continue; const lit = -dx * 0.6 - dy * 0.8 + (hash(X, y, 61) - 0.5) * 0.5; R(x, X, y, 1, 1, pal[d > 0.8 ? 0 : lit > 0.7 ? 4 : lit > 0.1 ? 3 : 2]); }
    if (v < 0.5) for (const [X, Y] of [[5, 6], [11, 5], [8, 9], [13, 9]]) R(x, X, Y, 2, 2, v < 0.25 ? "#e83a4a" : "#f4f0e8"); return outline(c, 9, 12); },
  tent(v) { const [c, x] = canvas(34, 34), A = v < 0.5 ? ["#d8453a", "#f4ece0"] : ["#2f7ac0", "#f4ece0"]; ellipseShadow(x, 17, 31, 32, 0.32);
    R(x, 2, 8, 2, 24, "#6a4428"); R(x, 30, 8, 2, 24, "#6a4428");
    R(x, 3, 20, 28, 9, "#9a6436"); R(x, 3, 20, 28, 2, "#c08a52"); R(x, 3, 28, 28, 1, "#6a4428"); // แผง
    for (let i = 0; i < 6; i++) { const gx = 5 + i * 4; R(x, gx, 17, 4, 4, ["#e83a3a", "#7ac040", "#f6c030", "#e8823a", "#c84a8a", "#7ac040"][i]); R(x, gx, 17, 2, 1, "rgba(255,255,255,.6)"); }
    for (let y = 2; y < 15; y++) { const ins = Math.max(0, 6 - y * 1.2); for (let X = Math.round(ins); X < 34 - Math.round(ins); X++) { const col = Math.floor(X / 4) % 2 ? A[1] : A[0]; R(x, X, y, 1, 1, y < 4 ? shade(col === A[0] ? A[0] : "#f4ece0", 0.15) : col); } }
    for (let X = 0; X < 34; X++) { const sc = Math.floor(X / 4) % 2 ? A[1] : A[0], dip = (X % 4 === 1 || X % 4 === 2) ? 2 : 1; R(x, X, 15, 1, dip, sc); R(x, X, 15 + dip, 1, 1, "rgba(0,0,0,.25)"); }
    return outline(c, 17, 31); },
};

// ตัวละคร: ทิศ 0 ลง 1 ซ้าย 2 ขวา 3 ขึ้น · วาดลงเฟรม 14×22 แล้วใส่ขอบ
function drawChar(x, X, Y, dir, step, L) {
  const skin = L.skin || "#f2c49a", hair = L.hair || "#3a2a20", pants = L.pants || "#2a3550", shoes = L.shoes || "#3a2418", shirt = L.shirt || "#5b3df5";
  const legL = step === 1 ? -1 : 0, legR = step === 3 ? -1 : 0;
  if (L.dress) { R(x, X + 3, Y + 15, 2, 2 + legL, skin); R(x, X + 7, Y + 15, 2, 2 + legR, skin); }
  else { R(x, X + 3, Y + 13, 3, 4 + legL, pants); R(x, X + 6, Y + 13, 3, 4 + legR, pants); R(x, X + 6, Y + 13, 1, 3, shade(pants, -0.3)); }
  R(x, X + 3, Y + 16 + legL, 3, 2, shoes); R(x, X + 6, Y + 16 + legR, 3, 2, shoes);
  R(x, X + 2, Y + 8, 8, 5, shirt); R(x, X + 2, Y + 8, 2, 5, shade(shirt, 0.2)); R(x, X + 8, Y + 8, 2, 5, shade(shirt, -0.22)); R(x, X + 2, Y + 12, 8, 1, shade(shirt, -0.35));
  if (L.dress) { R(x, X + 1, Y + 12, 10, 3, L.dress); R(x, X + 1, Y + 14, 10, 1, shade(L.dress, -0.3)); R(x, X + 1, Y + 12, 2, 3, shade(L.dress, 0.2)); }
  if (L.apron && dir !== 3) { R(x, X + 3, Y + 9, 6, 6, L.apron); R(x, X + 3, Y + 9, 6, 1, shade(L.apron, -0.18)); }
  const sw = step === 1 ? 1 : step === 3 ? -1 : 0;
  if (dir !== 1) { R(x, X + 10, Y + 9 + sw, 2, 3, shade(shirt, -0.1)); R(x, X + 10, Y + 12 + sw, 2, 1, skin); }
  if (dir !== 2) { R(x, X, Y + 9 - sw, 2, 3, shade(shirt, 0.1)); R(x, X, Y + 12 - sw, 2, 1, skin); }
  R(x, X + 2, Y + 1, 8, 7, skin); R(x, X + 8, Y + 2, 2, 6, shade(skin, -0.1));
  const hl = L.long ? 8 : dir === 3 ? 5 : 3;
  R(x, X + 1, Y, 10, 3, hair); R(x, X + 1, Y + 3, 2, hl, hair); R(x, X + 9, Y + 3, 2, hl, hair); R(x, X + 3, Y, 4, 1, shade(hair, 0.25));
  if (dir === 3) R(x, X + 2, Y + 3, 8, L.long ? 7 : 4, hair);
  else {
    const ex = dir === 1 ? [3, 6] : dir === 2 ? [5, 8] : [4, 7]; ex.forEach((e) => R(x, X + e, Y + 4, 1, 2, "#1a1414"));
    if (L.beard) R(x, X + 3, Y + 6, 6, 3, L.beard); else R(x, X + 5 + (dir === 2 ? 1 : dir === 1 ? -1 : 0), Y + 6, 2, 1, "#c97a6a");
    if (dir === 0) { R(x, X + 3, Y + 6, 1, 1, "#f0a090"); R(x, X + 8, Y + 6, 1, 1, "#f0a090"); }
  }
  if (L.hat) { R(x, X - 1, Y + 1, 14, 2, L.hat); R(x, X + 2, Y - 2, 8, 3, L.hat); R(x, X + 2, Y, 8, 1, L.band || shade(L.hat, -0.3)); R(x, X - 1, Y + 2, 14, 1, shade(L.hat, -0.25)); R(x, X + 3, Y - 2, 3, 1, shade(L.hat, 0.3)); }
  if (L.cap) { R(x, X + 1, Y - 1, 10, 3, L.cap); R(x, X + 2, Y - 1, 3, 1, shade(L.cap, 0.3));
    if (dir === 0) R(x, X + 2, Y + 2, 8, 1, shade(L.cap, -0.35)); else if (dir === 1) R(x, X - 1, Y + 1, 3, 1, shade(L.cap, -0.35)); else if (dir === 2) R(x, X + 10, Y + 1, 3, 1, shade(L.cap, -0.35)); }
}
function charFrame(dir, step, L) { const [c, x] = canvas(14, 22); drawChar(x, 1, 2 + (step % 2), dir, step, L); return outline(c, 7, 20); }
function foxFrame(face, step) {
  const [c, x] = canvas(26, 18), X = 13, Y = 16, f = face < 0 ? -1 : 1, P = (dx, dy, w, h, col) => R(x, f > 0 ? X + dx : X - dx - w, Y + dy, w, h, col);
  P(-9, -7, 6, 3, "#e0782a"); P(-11, -7, 3, 2, "#f6f0e6");
  P(-4, -9, 9, 5, "#e8822e"); P(-4, -9, 9, 1, "#f49a4a"); P(-3, -5, 7, 1, "#f6f0e6");
  P(-3, -4, 2, 3 - (step % 2), "#3a2418"); P(3, -4, 2, 3 - ((step + 1) % 2), "#3a2418");
  P(4, -12, 6, 5, "#e8822e"); P(8, -10, 3, 2, "#f6f0e6"); P(10, -10, 1, 1, "#1a1010"); P(7, -11, 1, 1, "#1a1010");
  P(4, -14, 2, 2, "#c0601e"); P(7, -14, 2, 2, "#c0601e");
  return outline(c, 13, 16);
}

// ---------- ฉากพื้น (วาดครั้งเดียว) ----------
const GR = { // หญ้าลายใบไม้: [ร่ม, แดด] × [ช่องว่าง, เงา, กลาง, สว่าง]
  shade: [[74, 146, 50], [52, 116, 40], [96, 170, 60], [134, 198, 80]],
  sun: [[98, 178, 62], [70, 146, 48], [126, 200, 74], [172, 224, 98]],
};
const LEAF = [[0, 3, 3, 0, 0], [3, 2, 2, 1, 0], [0, 2, 1, 1, 0], [0, 0, 1, 0, 0]];
function grassRGB(X, Y) {
  const n = vnoise(X / 26, Y / 26, 7), cy = Math.floor(Y / 4), off = (cy & 1) * 2 + (cy % 3), cx = Math.floor((X + off) / 5);
  let lx = X + off - cx * 5; const ly = Y - cy * 4, hv = hash(cx, cy, 21);
  if (hv < 0.5) lx = 4 - lx;
  let code = hv > 0.86 ? (hv > 0.95 ? 1 : 0) : LEAF[ly][lx];
  let c = mix(GR.shade[code], GR.sun[code], Math.min(1, Math.max(0, n * 1.5 - 0.25)));
  const sp = hash(X, Y, 33); if (sp < 0.003) c = [250, 250, 240]; else if (sp < 0.005) c = [250, 220, 90];
  return c;
}
function dirtRGB(X, Y) {
  const n = vnoise(X / 14, Y / 14, 8), h = hash(X, Y, 1);
  let c = mix([204, 166, 110], [226, 194, 142], n);
  if (h < 0.07) c = mul(c, 0.86); else if (h > 0.975) c = [240, 222, 182];
  return c;
}
function bakeGround(M) {
  const W = MW * T, H = MH * T, type = new Uint8Array(W * H);
  for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) {
    const tx = X >> 4, ty = Y >> 4, px = X & 15, py = Y & 15, g = M.ground[M.at(tx, ty)];
    let gg = g;
    if (g <= 1) {
      const pd = Math.hypot(X / T - PLAZA.x, (Y / T - PLAZA.y) * 1.15) + (hash(X >> 1, Y >> 1, 4) - 0.5) * 0.12;
      const inRing = pd > 3.55 && pd < 4.75, nearRing = pd > 3.1 && pd < 5.2;
      if (g === 1 && nearRing && !inRing) gg = 0;
      else if (g === 0 && inRing) gg = 1;
      else if (g === 1 && !nearRing) { // ขอบหญ้าเหลื่อมเข้าทางดินเป็นก้อน 2px
        const edge = (dx, dy) => M.ground[M.at(Math.min(MW - 1, Math.max(0, tx + dx)), Math.min(MH - 1, Math.max(0, ty + dy)))] === 0;
        const e = Math.min(edge(-1, 0) ? px : 99, edge(1, 0) ? 15 - px : 99, edge(0, -1) ? py : 99, edge(0, 1) ? 15 - py : 99);
        if (e < 3 && hash(X >> 1, Y >> 1, 5) < (3 - e) / 4) gg = 0;
      }
    }
    type[Y * W + X] = gg;
  }
  const tp = (X, Y) => (X < 0 || Y < 0 || X >= W || Y >= H ? 0 : type[Y * W + X]);
  const img = new ImageData(W, H), D = img.data;
  for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) {
    const t = type[Y * W + X]; let c;
    if (t === 0) {
      c = grassRGB(X, Y);
      if (tp(X, Y + 1) === 1 || tp(X, Y + 1) === 2) c = mix(c, [196, 238, 124], 0.55);       // ขอบบนของชั้นหญ้ารับแสง
      else if (tp(X - 1, Y) === 1 || tp(X + 1, Y) === 1) c = mul(c, 0.8);
    } else if (t === 1) {
      c = dirtRGB(X, Y);
      let k = 1; while (k <= 9 && tp(X, Y - k) === 1) k++;
      if (tp(X, Y - k) === 0 && k <= 9) { // หน้าตัดชั้นหญ้า: ปลายหญ้าห้อย → ดิน → เงาบนทราย
        const lip = 1 + (hash(X, 0, 31) < 0.45 ? 1 : 0) + (hash(X >> 1, 3, 32) < 0.22 ? 1 : 0);
        if (k <= lip) c = (X + k) % 3 ? [62, 128, 42] : [86, 156, 54];
        else if (k <= lip + 2) c = k === lip + 1 ? [112, 84, 50] : [90, 66, 40];
        else { const s = k - lip - 2; if (s <= 4) c = mul(c, [0.68, 0.76, 0.85, 0.93][s - 1]); }
      }
      if (tp(X, Y + 1) === 0 && hash(X, Y, 34) < 0.42) c = [72, 140, 48];                       // ยอดหญ้าโผล่ขึ้น
      else if (tp(X, Y + 2) === 0 && hash(X, Y, 35) < 0.12) c = [86, 156, 54];
      if (tp(X - 1, Y) === 0) c = mul(c, 0.78); else if (tp(X - 2, Y) === 0) c = mul(c, 0.88); else if (tp(X - 3, Y) === 0) c = mul(c, 0.95);
      if (tp(X + 1, Y) === 0) c = mul(c, 0.9);
    } else if (t === 2) {
      const dp = Math.min(1, Math.hypot((X / T - 44.5) / 5.6, (Y / T - 31) / 3.6));
      c = mix([34, 92, 160], [64, 146, 206], dp * dp);
      const rp = vnoise(X / 7, Y / 2.5, 9); if (rp > 0.68) c = mix(c, [120, 190, 232], 0.5); else if (rp < 0.2) c = mul(c, 0.92);
      let k = 1; while (k <= 12 && tp(X, Y - k) === 2) k++;
      const ab = tp(X, Y - k);
      if (k <= 12 && (ab === 0 || ab === 1)) { // ตลิ่ง: ปลายหญ้า → กำแพงหิน → เงาบนน้ำ
        const lip = ab === 0 ? 2 : 0, s = k - lip;
        if (k <= lip) c = [66, 132, 44];
        else if (s <= 5) { const st = hash(Math.floor((X + (s > 2 ? 3 : 0)) / 6), s > 2 ? 1 : 0, 41); c = (X + (s > 2 ? 3 : 0)) % 6 === 0 || s === 3 ? [72, 64, 56] : mul(st < 0.5 ? [150, 142, 128] : [128, 122, 112], s === 1 || s === 4 ? 1.12 : 1); }
        else if (s <= 9) c = mul(c, 0.62 + (s - 6) * 0.1);
      } else if (ab === 3 && k <= 5) c = mul(c, 0.62);
      if ((tp(X, Y + 1) === 0 || tp(X - 1, Y) === 0 || tp(X + 1, Y) === 0) && hash(X, Y, 42) < 0.75) c = [206, 234, 246];
    } else {
      const py = Y & 15, px = X & 15, h = hash(X, Y, 1);
      c = py % 4 === 0 ? [94, 60, 32] : px === 0 || px === 15 ? [110, 72, 40] : h < 0.15 ? [176, 124, 66] : py % 4 === 1 ? [184, 132, 72] : [156, 104, 52];
    }
    const i = (Y * W + X) * 4; D[i] = c[0]; D[i + 1] = c[1]; D[i + 2] = c[2]; D[i + 3] = 255;
  }
  const [cv, x] = canvas(W, H); x.putImageData(img, 0, 0);
  const isT = (X, Y, v) => tp(X, Y) === v;
  for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
    const g = M.ground[M.at(tx, ty)], blk = M.block[M.at(tx, ty)], bx = tx * T, by = ty * T;
    if (g === 1) for (let i = 0; i < 2; i++) { // ก้อนกรวด
      const X = bx + 2 + Math.floor(hash(tx, ty, 80 + i) * 12), Y = by + 2 + Math.floor(hash(ty, tx, 81 + i) * 12);
      if (hash(tx, ty, 82 + i) < 0.55 && isT(X, Y, 1) && isT(X + 2, Y + 1, 1)) { R(x, X, Y, 3, 2, "#a88e6c"); R(x, X, Y, 2, 1, "#d8c4a0"); R(x, X, Y + 2, 3, 1, "rgba(80,60,30,.35)"); }
    }
    if (g === 0 && !blk && hash(tx, ty, 40) < 0.075) { // กอดอกทิวลิป
      const col = [["#e83a4a", "#ff8a8a", "#a8202e"], ["#f6c840", "#fff09a", "#c8901c"], ["#f4f0ee", "#ffffff", "#c8c0c8"], ["#e870b0", "#ffb0d8", "#b03a7a"], ["#9a6ae0", "#c8a8ff", "#6a3ab0"]][Math.floor(hash(tx, ty, 41) * 5)];
      const n = 3 + Math.floor(hash(tx, ty, 42) * 3);
      for (let i = 0; i < n; i++) { const X = bx + 2 + Math.floor(hash(tx, ty, 43 + i) * 10), Y = by + 1 + Math.floor(hash(ty, tx, 44 + i) * 8);
        if (!isT(X + 1, Y + 6, 0) || !isT(X, Y, 0)) continue;
        R(x, X + 1, Y + 3, 1, 4, "#2f7a2a"); R(x, X + 2, Y + 5, 1, 1, "#4f9a3a"); R(x, X, Y + 5, 1, 1, "#4f9a3a");
        R(x, X, Y, 3, 3, col[0]); R(x, X, Y, 1, 1, col[1]); R(x, X + 1, Y - 1, 1, 1, col[0]); R(x, X, Y + 2, 3, 1, col[2]); R(x, X + 2, Y + 7, 1, 1, "rgba(20,40,10,.3)"); }
    } else if (g === 0 && !blk && hash(tx, ty, 45) < 0.05) { // หินเล็กในหญ้า
      const X = bx + 4 + Math.floor(hash(tx, ty, 46) * 8), Y = by + 5 + Math.floor(hash(tx, ty, 47) * 6);
      if (isT(X, Y, 0) && isT(X + 4, Y + 3, 0)) { R(x, X, Y + 3, 5, 1, "rgba(20,40,10,.35)"); R(x, X, Y, 5, 3, "#8e8a84"); R(x, X + 1, Y, 3, 1, "#c4c0b8"); R(x, X + 4, Y + 1, 1, 2, "#6a6660"); }
    }
  }
  for (let i = 0; i < 8; i++) { // ใบบัว
    const X = Math.round((40 + hash(i, 0, 90) * 9) * T), Y = Math.round((29 + hash(i, 1, 90) * 4) * T);
    if (!isT(X - 4, Y, 2) || !isT(X + 4, Y, 2) || !isT(X, Y - 3, 2) || !isT(X, Y + 3, 2)) continue;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -4; dx <= 4; dx++) { if ((dx / 4.5) ** 2 + (dy / 2.6) ** 2 > 1 || (dx > 0 && dy === 0)) continue; R(x, X + dx, Y + dy, 1, 1, dy < 0 ? "#6ab84a" : "#4f9a3c"); }
    R(x, X - 4, Y + 3, 9, 1, "rgba(10,40,70,.35)"); if (i % 3 === 0) { R(x, X - 1, Y - 2, 3, 2, "#f6a8c8"); R(x, X, Y - 3, 1, 1, "#fff"); }
  }
  return cv;
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

// ตัดบรรทัดภาษาไทย (ไม่มีช่องว่าง): ตัดตามความกว้าง โดยไม่แยกสระ/วรรณยุกต์ออกจากพยัญชนะ
function wrapText(ctx, text, maxW) {
  const lines = []; let cur = "";
  for (const ch of text) { const comb = /[ัิ-ฺ็-๎]/.test(ch);
    if (!comb && cur && ctx.measureText(cur + ch).width > maxW) { const sp = cur.lastIndexOf(" "); if (sp > cur.length * 0.5) { lines.push(cur.slice(0, sp)); cur = cur.slice(sp + 1); } else { lines.push(cur); cur = ""; } }
    cur += ch; }
  if (cur) lines.push(cur); return lines;
}

// ---------- ติดตั้งบนหน้า ----------
export function mountWorld(host, { go, playerName = "นักผจญภัย", shirt = "#5b3df5", reduced = false }) {
  const M = buildMap();
  const ground = bakeGround(M);
  const cache = new Map(), spr = (key, make) => cache.get(key) || (cache.set(key, make()), cache.get(key));
  const objects = [];
  const add = (s, bx, by, ysort, extra) => { const dx = Math.round(bx - s.ax), dy = Math.round(by - s.ay);
    objects.push({ y: ysort ?? by, x0: dx, x1: dx + s.c.width, top: dy, bot: dy + s.c.height, draw: (x, now) => { x.drawImage(s.c, dx, dy); if (extra) extra(x, now); } }); };
  for (const t of M.trees) { const v = t.s < 0.5 ? 0 : 1, bx = t.x * T + 8, by = t.y * T + 14;
    if (t.kind === "pine") add(spr("pine" + v, () => pineTree(t.s)), bx, by); else add(spr(t.kind + v, () => roundTree(t.kind, t.s)), bx, by); }
  for (const s of M.stones) { const bx = s.x * T + 8, by = s.y * T + T - 1;
    add(spr("s" + s.h, () => stoneSprite(s.h)), bx, by, by, s.owl ? (x, now) => { const ox = s.x * T + 3, oy = s.y * T + T - s.h - 9; R(x, ox - 1, oy - 1, 11, 11, "#2a2030"); R(x, ox, oy, 9, 9, "#7a5434"); R(x, ox + 1, oy + 3, 7, 6, "#a87a4e");
      const blink = Math.floor(now / 1000) % 5 === 0 && now % 1000 < 140; R(x, ox + 1, oy + 2, 3, blink ? 1 : 3, "#f6c040"); R(x, ox + 5, oy + 2, 3, blink ? 1 : 3, "#f6c040"); R(x, ox + 4, oy + 5, 1, 2, "#e08a2a"); R(x, ox, oy - 1, 2, 2, "#7a5434"); R(x, ox + 7, oy - 1, 2, 2, "#7a5434"); } : null); }
  { const bx = M.mono.x * T + 16, by = M.mono.y * T + T - 2, X = bx - 12, Y = by - 38;
    add(spr("mono", monoSprite), bx, by, by, (x, now) => { x.globalAlpha = 0.55 + 0.45 * Math.sin(now / (reduced ? 1e9 : 500));
      for (let k = 0; k < 4; k++) { const cx = X + 12, cy = Y + 8 + k * 7; for (let d = 0; d < 3; d++) { R(x, cx - 3 + d, cy + d, 1, 1, "#9ff6ff"); R(x, cx + 3 - d, cy + d, 1, 1, "#9ff6ff"); R(x, cx - 3 + d, cy - d, 1, 1, "#9ff6ff"); } R(x, cx, cy - 1, 1, 1, "#dffcff"); R(x, cx, cy + 3, 1, 1, "#dffcff"); }
      x.globalAlpha = 1; }); }
  for (const p of PLACES) {
    if (p.dock) { add(spr("dock", dockSign), (p.x - 1) * T + 1, p.y * T + T - 40, p.y * T + T); continue; }
    add(spr("h" + p.id, () => houseSprite(p)), p.x * T, p.y * T - 4, (p.y + 4) * T);
  }
  for (const h of M.hedges) add(spr(`hedge${h.w}x${h.h}`, () => hedgeSprite(h.w, h.h)), h.x * T, h.y * T - 10, (h.y + h.h) * T);
  const lamps = [];
  for (const p of M.props) {
    const s = spr(p.kind + (p.v < 0.5 ? 0 : 1), () => PROP[p.kind](p.v));
    if (p.kind === "tent") add(s, (p.x + 1) * T, (p.y + 2) * T - 2);
    else { add(s, p.x * T + 8, p.y * T + 14); if (p.kind === "lamp") lamps.push([p.x * T + 8, p.y * T + 14 - 25]); }
  }
  const frames = (key, L) => (dir, step) => spr(`${key}${dir}${step}`, () => charFrame(dir, step, L));
  const heroF = frames("hero", { shirt, pants: "#2a3550" });
  const npcs = M.npcs.map((n, i) => ({ ...n, fx: n.x * T + 8, fy: n.y * T + 13, F: frames("npc" + i, n.look), phase: i * 0.7 }));
  for (const n of npcs) objects.push({ y: n.fy, x0: n.fx - 9, x1: n.fx + 9, top: n.fy - 24, bot: n.fy + 3, draw: (x, now) => { ellipseShadow(x, n.fx, n.fy, 12); const f = n.F(n.dir, 0), b = !reduced && Math.sin(now / 700 + n.phase) > 0.6 ? 1 : 0; x.drawImage(f.c, n.fx - f.ax, n.fy - f.ay + b); } });

  // ตัวละคร (ตำแหน่งเท้า เป็นพิกเซลโลก)
  const saved = (() => { try { return sessionStorage.getItem(POS_KEY); } catch { return null; } })();
  const start = PLACES.find((p) => p.id === saved);
  const home = (() => { let b = [24, 20], bd = 1e9; for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const k = M.at(x, y); if (M.ground[k] !== 1 || M.block[k]) continue; const d = Math.hypot(x - 26.5, y - 22.5); if (d < bd) { bd = d; b = [x, y]; } } return b; })();
  const hero = { x: (start ? start.ex : home[0]) * T + 8, y: ((start ? start.ey : home[1]) + 0.6) * T, dir: 0, step: 0, stepT: 0, path: null, target: null };
  const fox = { x: (PLAZA.x + 2) * T, y: (PLAZA.y + 2) * T, tx: 0, ty: 0, face: 1, step: 0, wait: 1 };
  const keys = new Set();
  const [buf, bx] = canvas(10, 10);
  const view = document.createElement("canvas");
  view.className = "world-canvas"; view.tabIndex = 0;
  view.setAttribute("role", "application");
  view.setAttribute("aria-label", "หมู่บ้านแห่งการเรียนรู้ ใช้ปุ่มลูกศรเดิน กด E เพื่อเข้าบ้าน หรือใช้ปุ่มลัดด้านล่างแผนที่");
  host.appendChild(view);
  const ui = document.createElement("div"); ui.className = "world-ui"; host.appendChild(ui);
  ui.innerHTML = `<div class="w-fx w-tilt top"></div><div class="w-fx w-tilt bot"></div><div class="w-fx w-warm"></div><div class="w-fx w-vignette"></div><canvas class="world-labels" aria-hidden="true"></canvas>`
    + `<div class="world-hint"><span class="wh-long">⌨️ ลูกศร / WASD เดิน · Shift วิ่ง · E เข้าบ้าน · 👆 แตะที่บ้านเพื่อเดินไปเข้า</span><span class="wh-short">👆 แตะพื้นเพื่อเดิน · แตะบ้านเพื่อเข้า</span></div><button type="button" class="world-enter" hidden></button><div class="world-fade"></div>`;
  const enterBtn = ui.querySelector(".world-enter"), fade = ui.querySelector(".world-fade"), labels = ui.querySelector(".world-labels");
  let S = 2, vw = 0, vh = 0, dpr = 1, cam = { x: 0, y: 0 }, near = null, talk = null, leaving = false;

  function resize() {
    const w = host.clientWidth; dpr = Math.min(2, window.devicePixelRatio || 1);
    const h = w < 640 ? Math.min(Math.round(window.innerHeight * 0.62), 560) : Math.min(640, Math.max(420, Math.round(w * 0.56)));
    S = w >= 1500 ? 3 : 2; vw = Math.ceil(w / S); vh = Math.ceil(h / S);
    buf.width = vw; buf.height = vh; bx.imageSmoothingEnabled = false;
    for (const c of [view, labels]) { c.style.width = w + "px"; c.style.height = h + "px"; c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
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

  function update(dt) {
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
    // ชาวบ้านหันมาคุยเมื่อเข้าใกล้
    talk = null; let best = 34;
    for (const v of npcs) { const dx = hero.x - v.fx, dy = hero.y - v.fy, d = Math.hypot(dx, dy * 1.3);
      if (d < 46) v.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy < 0 ? 3 : 0; else v.dir = 0;
      if (d < best && !near) { best = d; talk = v; } }
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
    R(x, 0, 0, vw, vh, "#1f3a1a");
    x.drawImage(ground, -cx, -cy);
    x.save(); x.translate(-cx, -cy);
    // ประกายบนผิวน้ำ
    if (!reduced) for (let i = 0; i < 30; i++) { const wx = 39 * T + ((i * 53) % (9 * T)), wy = 28 * T + ((i * 37) % (6 * T)) + Math.sin(now / 600 + i) * 2; const [tx, ty] = tileAt(wx, wy);
      if (M.inb(tx, ty) && M.ground[M.at(tx, ty)] === 2) { x.globalAlpha = 0.35 + 0.35 * Math.sin(now / 400 + i * 1.7); R(x, wx, wy, 3 + (i % 3), 1, "#e8f6ff"); } }
    x.globalAlpha = 1;
    const list = objects.filter((o) => o.x1 >= cx && o.x0 <= cx + vw && o.bot >= cy && o.top <= cy + vh);
    list.push({ y: fox.y, draw: (c) => { ellipseShadow(c, fox.x, fox.y, 14, 0.26); const f = spr(`fox${fox.face}${fox.step % 2}`, () => foxFrame(fox.face, fox.step % 2)); c.drawImage(f.c, Math.round(fox.x) - f.ax, Math.round(fox.y) - f.ay); } });
    list.push({ y: hero.y, draw: (c) => { ellipseShadow(c, hero.x, hero.y, 12); const f = heroF(hero.dir, hero.step); c.drawImage(f.c, Math.round(hero.x) - f.ax, Math.round(hero.y) - f.ay); } });
    list.sort((a, b) => a.y - b.y);
    for (const o of list) o.draw(x, now);
    // แสงไฟโคมแบบเติมแสง
    x.globalCompositeOperation = "lighter";
    for (const [lx, ly] of lamps) { const a = reduced ? 0.12 : 0.1 + 0.03 * Math.sin(now / 300 + lx); x.fillStyle = `rgba(255,190,90,${a})`; x.beginPath(); x.arc(lx, ly, 14, 0, 7); x.fill(); x.beginPath(); x.arc(lx, ly, 8, 0, 7); x.fill(); }
    x.globalCompositeOperation = "source-over";
    if (!reduced) {
      // เงาเมฆเคลื่อนผ่าน
      x.fillStyle = "rgba(16,30,60,.10)";
      for (let i = 0; i < 3; i++) { const ox = ((now / 90 + i * 330) % (MW * T + 400)) - 200, oy = (i * 190 + 80) % (MH * T);
        x.beginPath(); x.ellipse(ox, oy, 120, 52, 0, 0, 7); x.ellipse(ox + 70, oy + 20, 80, 40, 0, 0, 7); x.fill(); }
      // ละอองเกสรลอยในแสงแดด
      for (let i = 0; i < 34; i++) { const t = now / 1000, px = cx + ((i * 97 + t * (6 + (i % 4) * 3)) % (vw + 20)) - 10, py = cy + ((i * 61 + Math.sin(t * 0.8 + i) * 12 + t * 3) % (vh + 10)) - 5;
        x.globalAlpha = 0.35 + 0.45 * Math.abs(Math.sin(t * 1.3 + i)); R(x, px, py, 1, 1, i % 3 ? "#fff6d0" : "#e8ffd0"); }
      x.globalAlpha = 1;
    }
    x.restore();
    // ขยายภาพแบบพิกเซลคม
    const v = view.getContext("2d"); v.imageSmoothingEnabled = false;
    v.setTransform(1, 0, 0, 1, 0, 0); v.drawImage(buf, 0, 0, vw * S * dpr, vh * S * dpr);
    // ป้ายตัวหนังสือ: วาดบนชั้นบนสุด จึงคมชัดแม้อยู่ในโซนเบลอ
    const g = labels.getContext("2d"); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, labels.width, labels.height);
    const k = S * dpr, fs = Math.round((S >= 3 ? 13 : 11) * dpr), F = `700 ${fs}px "Noto Sans Thai", system-ui, sans-serif`;
    g.font = F; g.textAlign = "center"; g.textBaseline = "middle";
    const sx = (wx) => (wx - cx) * k, sy = (wy) => (wy - cy) * k;
    const tag = (label, wx, wy, bg, fg = "#fff") => { const X = sx(wx), Y = sy(wy); if (X < -200 || Y < -40 || X > labels.width + 200 || Y > labels.height + 40) return;
      const w = g.measureText(label).width + 12 * dpr, h = fs + 8 * dpr; g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(Math.round(X - w / 2), Math.round(Y - h / 2 + 2 * dpr), Math.round(w), Math.round(h));
      g.fillStyle = bg; g.fillRect(Math.round(X - w / 2), Math.round(Y - h / 2), Math.round(w), Math.round(h)); g.fillStyle = fg; g.fillText(label, X, Y + dpr); };
    for (const p of PLACES) {
      if (p.dock) { tag(`${p.ic} ${p.name}`, p.x * T, p.y * T - 30, near === p ? "#ffcf3a" : "rgba(20,40,24,.88)", near === p ? "#1a1420" : "#fff"); continue; }
      g.font = `${Math.round(9 * k)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`; g.fillText(p.ic, sx(p.x * T + 40), sy(p.y * T + 22.5)); g.font = F;
      tag(p.name, p.x * T + 40, p.y * T - 12, near === p ? "#ffcf3a" : "rgba(24,18,30,.82)", near === p ? "#1a1420" : "#fff");
    }
    // ฟองคำพูดชาวบ้าน
    const bubble = (X, Y, lines, small) => { const pad = 7 * dpr, lh = fs * 1.35, w = Math.max(...lines.map((l) => g.measureText(l).width)) + pad * 2, h = lines.length * lh + pad * 1.4 - (small ? 4 * dpr : 0), L = Math.round(X - w / 2), Tp = Math.round(Y - h - 6 * dpr);
      g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(L + 2 * dpr, Tp + 2 * dpr, w, h); g.fillStyle = "#fffdf6"; g.fillRect(L, Tp, w, h); g.fillStyle = "#1a1420"; g.fillRect(L, Tp, w, 2 * dpr); g.fillRect(L, Tp + h - 2 * dpr, w, 2 * dpr); g.fillRect(L, Tp, 2 * dpr, h); g.fillRect(L + w - 2 * dpr, Tp, 2 * dpr, h);
      g.fillStyle = "#fffdf6"; g.beginPath(); g.moveTo(X - 5 * dpr, Tp + h - 2 * dpr); g.lineTo(X, Tp + h + 6 * dpr); g.lineTo(X + 5 * dpr, Tp + h - 2 * dpr); g.fill();
      g.fillStyle = "#1a1420"; lines.forEach((l, i) => g.fillText(l, X, Tp + pad * 0.7 + lh * (i + 0.5))); };
    for (const n of npcs) { const X = sx(n.fx), Y = sy(n.fy - 24); if (X < -60 || Y < -40 || X > labels.width + 60 || Y > labels.height + 60) continue;
      if (n === talk) { g.font = `600 ${fs}px "Noto Sans Thai", system-ui, sans-serif`; bubble(X, Y, wrapText(g, n.tip, Math.min(230 * dpr, labels.width * 0.6))); g.font = F; }
      else { // ฟอง "…" จุดกะพริบทีละจุด
        const lit = reduced ? 3 : 1 + (Math.floor(now / 400 + n.phase * 3) % 3), b = 2 * dpr, w = 26 * dpr, h = 14 * dpr, L = Math.round(X - w / 2), Tp = Math.round(Y - h - 6 * dpr - (reduced ? 0 : Math.sin(now / 500 + n.phase) * 2 * dpr));
        g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(L + b, Tp + b, w, h); g.fillStyle = "#1a1420"; g.fillRect(L - b, Tp - b, w + 2 * b, h + 2 * b); g.fillStyle = "#fffdf6"; g.fillRect(L, Tp, w, h);
        g.beginPath(); g.moveTo(X - 4 * dpr, Tp + h); g.lineTo(X, Tp + h + 5 * dpr); g.lineTo(X + 4 * dpr, Tp + h); g.fill();
        for (let d = 0; d < 3; d++) { g.fillStyle = d < lit ? "#1a1420" : "#c8c0c8"; g.fillRect(Math.round(L + 6 * dpr + d * 6 * dpr), Math.round(Tp + 6 * dpr), Math.round(3 * dpr), Math.round(3 * dpr)); } } }
    if (!talk) tag(playerName, hero.x, hero.y - 27, "rgba(91,61,245,.92)");
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
    // แตะชาวบ้าน: เดินไปยืนข้าง ๆ
    const npc = npcs.find((n) => Math.abs(wx - n.fx) < 9 && wy > n.fy - 24 && wy < n.fy + 3);
    if (npc) { for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) { const tx = npc.x + dx, ty = npc.y + dy; if (M.inb(tx, ty) && !M.block[M.at(tx, ty)]) { walkTo(tx, ty); return; } } }
    walkTo(Math.floor(wx / T), Math.floor(wy / T));
  });
  enterBtn.addEventListener("click", () => near && enter(near));

  // ---------- ลูป ----------
  let raf = 0, last = performance.now(), visible = true;
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; }); io.observe(view);
  // เครื่องช้า: ถ้าเฟรมเรตต่ำในช่วงแรก ให้ปิดเบลอ tilt-shift (กินแรงที่สุด) อัตโนมัติ
  let perfN = 0, perfT = 0;
  const loop = (now) => { raf = requestAnimationFrame(loop); if (!visible || document.hidden) { last = now; return; } const raw = (now - last) / 1000, dt = Math.min(0.05, raw); last = now;
    if (perfN < 120) { if (perfN > 20) perfT += raw; if (++perfN === 120 && perfT / 99 > 1 / 38) host.classList.add("w-lite"); }
    update(dt); render(now); };
  raf = requestAnimationFrame(loop);
  return {
    places: PLACES,
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); view.remove(); ui.remove(); },
    // สำหรับทดสอบ: ตรวจว่าทุกบ้านเดินไปถึงได้
    reachable() { const [sx, sy] = tileAt(hero.x, hero.y - 1); return PLACES.map((p) => ({ id: p.id, ok: !!findPath(M, sx, sy, p.ex, p.ey) || (sx === p.ex && sy === p.ey) })); },
    _hero: hero,
    _npcs: npcs,
    walkToPlace(id) { const p = PLACES.find((x) => x.id === id); if (p) walkTo(p.ex, p.ey, p); },
  };
}
