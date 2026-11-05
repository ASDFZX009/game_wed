// หมู่บ้านแห่งการเรียนรู้: แผนที่พิกเซลอาร์ต 2.5D ความละเอียดสูงแนว HD-2D (แดดเย็นสีทอง เงาทอดยาว เบลอใกล้-ไกล)
// วาดด้วยโค้ดทั้งหมด (ไม่มีไฟล์ภาพ) · คีย์บอร์ด: ลูกศร/WASD เดิน, Shift วิ่ง, E/Enter เข้าบ้าน · เมาส์/นิ้ว: แตะที่บ้านหรือพื้นเพื่อเดินไป
// ชั้นภาพ: พื้น + เงานิ่ง (วาดครั้งเดียว) → เงาตัวละคร → วัตถุเรียงตามความลึก → แสง/ประกาย → (CSS) ลำแสง หมอกอุ่น เบลอ tilt-shift → ป้ายตัวหนังสือคมชัด
import { T, rng, hash, fbm, canvas, css } from "../world/art.js";
import { groundTypes, groundBaker } from "../world/ground.js";
import { windmill, windmillSails, gazebo, greatTree, ruinArch, scarecrow, hayBale, stoneLantern } from "../world/landmarks.js";
import { broadTree, pineTree, bush, flowerPatch, lavender, plateau, fence, PROP, HOUSE, house, dockSign, pillar, crystal } from "../world/sprites.js";
import { subjectSign, drawSignFx, SIGN_FX } from "../world/signs.js";
import { charFrame, foxFrame, silhouette } from "../world/chars.js";

const MW = 80, MH = 58; // ขนาดแผนที่ (ช่อง) — หมู่บ้านเดิมอยู่กลาง ล้อมด้วยทุ่ง ป่า ทะเลสาบ และซากโบราณ
const OX = 16, OY = 11; // ตำแหน่งหมู่บ้านเดิมในแผนที่ใหม่
const POS_KEY = "eduplay:worldPos";
const SUN = { kx: 0.78, ky: 0.36 }; // ทิศเงา: ยืดไปทางขวาบน

const PLACES = [
  { id: "math", name: "คณิตศาสตร์", ic: "🔢", x: 8, y: 4, roof: "#3f5f9e", href: "/games?category=math" },
  { id: "science", name: "วิทยาศาสตร์", ic: "🔬", x: 21, y: 3, roof: "#2f7a6a", href: "/games?category=science" },
  { id: "thai", name: "ภาษาไทย", ic: "📖", x: 34, y: 4, roof: "#a8352a", href: "/games?category=thai", thai: true },
  { id: "english", name: "ภาษาอังกฤษ", ic: "🔤", x: 4, y: 13, roof: "#634a92", href: "/games?category=english" },
  { id: "social", name: "สังคมศึกษา", ic: "🌏", x: 39, y: 13, roof: "#b8602a", href: "/games?category=social" },
  { id: "health", name: "สุขศึกษา", ic: "💪", x: 5, y: 23, roof: "#3c7a34", href: "/games?category=health" },
  { id: "early", name: "เด็กปฐมวัย", ic: "🧸", x: 13, y: 26, roof: "#c25a7e", href: "/games?category=early" },
  { id: "brain", name: "ฝึกสมอง", ic: "🧠", x: 29, y: 26, roof: "#8a3a66", href: "/games?category=brain" },
  { id: "general", name: "ความรู้ทั่วไป", ic: "💡", x: 37, y: 22, roof: "#b88a2a", href: "/games?category=general" },
  { id: "shop", name: "ร้านค้า", ic: "🛒", x: 21, y: 26, roof: "#a83030", href: "/shop", shop: true },
  { id: "dock", name: "ท่าเรือ · เกมตอบคำถาม", ic: "🎣", dock: true, x: 43, y: 26, href: "/quiz-game" },
];
for (const p of PLACES) { p.x += OX; p.y += OY; }
const PLAZA = { x: 24 + OX, y: 15.5 + OY };
// ทะเลสาบ: บ่อเดิมข้างท่าเรือ + ทะเลสาบใหญ่ฝั่งตะวันออก มีเกาะศาลาและสะพาน
const LAKES = [{ x: 44.5 + OX, y: 31 + OY, rx: 5.6, ry: 3.6 }, { x: 71, y: 40, rx: 8.6, ry: 7.4 }];
const ISLAND = { x: 72.5, y: 41, r: 2.7 }, BRIDGE = { x: 72, y0: 32, y1: 38 };
// จุดชมวิว (ช่องที่วาง + ช่องที่กันไว้ไม่ให้มีต้นไม้/ของรก)
const SPOTS = {
  farm: { x: 2, y: 22, w: 11, h: 12 }, mill: { x: 5, y: 14, w: 3, h: 3 },
  grove: { x: 47.5, y: 9.5, r: 5.2 }, tree: { x: 46, y: 9, w: 3, h: 2 },
  ruins: { x: 28, y: 48, w: 17, h: 7 }, arch: { x: 35, y: 50 },
};
const LANDMARKS = [
  { id: "mill", name: "🌾 ทุ่งดอกไม้และกังหันลม", x: 6.5, y: 10.2 },
  { id: "tree", name: "🌳 ต้นไม้ยักษ์พันปี", x: 47.5, y: 2.2 },
  { id: "gazebo", name: "🏮 ศาลากลางทะเลสาบ", x: 72.5, y: 36.6 },
  { id: "ruins", name: "🏛️ ซุ้มประตูโบราณ", x: 36.5, y: 46.6 },
];

// ชาวบ้าน: ยืนข้างทาง มีฟอง "…" เดินเข้าใกล้แล้วจะพูด
export const VILLAGERS = [
  { at: [17, 9], look: { shirt: "#5f8f3a", pants: "#6a4a2a", hat: "#e0bc66", band: "#b0453a", hair: "#5a3a20" }, tip: "บ้านคณิตศาสตร์กับวิทยาศาสตร์อยู่ทางทิศเหนือ ลองแวะไปดูสิ" },
  { at: [31, 18], look: { shirt: "#b8382c", hair: "#7a3a1a", apron: "#f2ead6", pants: "#4a3a2a" }, tip: "ร้านค้ามีกล่องสุ่มรูปโปรไฟล์ด้วยนะ ได้อะไรมาไปดูในกระเป๋าได้เลย" },
  { at: [40, 24], look: { shirt: "#3a7ab8", cap: "#2e4a6a", pants: "#3a3a48", hair: "#2a2020" }, tip: "ที่ท่าเรือมีเกมตกปลาตอบคำถาม ยิ่งออกทะเลลึก คำถามยิ่งยาก!" },
  { at: [19, 21], look: { shirt: "#7d5a9a", hair: "#d8d4cc", beard: "#e8e4dc", pants: "#4a4058" }, tip: "แต่ละบ้านมีหลายบทเรียน เลือกระดับง่ายมากถึงยากมาก และจำนวนข้อได้เองนะ" },
  { at: [10, 18], look: { shirt: "#e0a030", hair: "#1e1a18", pants: "#2a5a8a" }, tip: "เล่นเกมจบแล้วได้เหรียญ เอาไปซื้อของแต่งตัวในร้านค้าได้นะ" },
  { at: [33, 11], look: { dress: "#d8608a", shirt: "#f0a6c0", hair: "#6a2e1a", long: true }, tip: "แต่ละบทเรียนมีชุดคำถาม 4 ชุด ลองเล่นให้ครบทุกชุดดูสิ" },
];

for (const v of VILLAGERS) { v.at = [v.at[0] + OX, v.at[1] + OY]; }
VILLAGERS.push(
  { at: [11, 19], look: { shirt: "#c88a3a", pants: "#4a5a2a", hat: "#e0c060", band: "#5a8a3a", hair: "#3a2a1a" }, tip: "ทุ่งดอกไม้นี้ปลูกเรียงตามสีรุ้ง ลมพัดกังหันทั้งวัน ลองเดินชมรอบ ๆ ได้เลย" },
  { at: [50, 12], look: { shirt: "#5a7a4a", hair: "#e8e4dc", beard: "#e8e4dc", pants: "#3a3a2a" }, tip: "ต้นไม้ยักษ์ต้นนี้อายุนับพันปี ผ้าสามสีที่พันไว้คือคำอธิษฐานของคนในหมู่บ้าน" },
  { at: [74, 31], look: { shirt: "#3a8ab8", cap: "#e8e0d0", pants: "#2a3a5a", hair: "#2a2020" }, tip: "เดินข้ามสะพานไปศาลากลางทะเลสาบสิ ตอนเย็นโคมไฟสวยมาก" },
  { at: [32, 47], look: { shirt: "#8a6a4a", hat: "#a87a40", band: "#5a3a20", pants: "#4a3a2a", hair: "#4a2a1a" }, tip: "ซุ้มประตูหินนี้เป็นของเมืองโบราณ คริสตัลบนเสายังเรืองแสงอยู่เลยนะ" },
);

// ---------- สร้างแผนที่ ----------
// พื้น: 0 หญ้า 1 ทางดิน 2 น้ำ 3 ท่าไม้ · block: เดินผ่านไม่ได้
function buildMap() {
  const ground = new Uint8Array(MW * MH), block = new Uint8Array(MW * MH);
  const at = (x, y) => y * MW + x, inb = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) for (const L of LAKES) { const dx = (x - L.x) / L.rx, dy = (y - L.y) / L.ry; if (dx * dx + dy * dy < 1 + (hash(x, y, 3) - 0.5) * 0.25) { ground[at(x, y)] = 2; block[at(x, y)] = 1; } }
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (Math.hypot(x + 0.5 - ISLAND.x, (y + 0.5 - ISLAND.y) * 1.2) < ISLAND.r) { ground[at(x, y)] = 0; block[at(x, y)] = 0; }
  for (let y = BRIDGE.y0; y <= BRIDGE.y1; y++) for (let x = BRIDGE.x; x < BRIDGE.x + 2; x++) if (ground[at(x, y)] === 2) { ground[at(x, y)] = 3; block[at(x, y)] = 0; }
  // พื้นที่พิเศษ: ไร่ดอกไม้ (4) ลานหินโบราณ (5)
  const reserved = new Uint8Array(MW * MH), resv = (x0, y0, w, h) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (inb(x, y)) reserved[at(x, y)] = 1; };
  { const F = SPOTS.farm; for (let y = F.y; y < F.y + F.h; y++) for (let x = F.x; x < F.x + F.w; x++) ground[at(x, y)] = 4; resv(F.x - 1, F.y - 1, F.w + 2, F.h + 2); resv(SPOTS.mill.x - 2, SPOTS.mill.y - 1, 9, 6); }
  { const R2 = SPOTS.ruins; for (let y = R2.y; y < R2.y + R2.h; y++) for (let x = R2.x; x < R2.x + R2.w; x++) if (Math.hypot((x + 0.5 - R2.x - R2.w / 2) / (R2.w / 2), (y + 0.5 - R2.y - R2.h / 2) / (R2.h / 2)) < 1.05) ground[at(x, y)] = 5; resv(R2.x - 1, R2.y - 1, R2.w + 2, R2.h + 2); }
  { const G2 = SPOTS.grove; for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (Math.hypot(x + 0.5 - G2.x, (y + 0.5 - G2.y) * 1.1) < G2.r) reserved[at(x, y)] = 1; }
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (Math.hypot(x + 0.5 - ISLAND.x, (y + 0.5 - ISLAND.y) * 1.2) < ISLAND.r + 0.5) reserved[at(x, y)] = 1;
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const d = Math.hypot(x + 0.5 - PLAZA.x, (y + 0.5 - PLAZA.y) * 1.15); if (d > 3.4 && d < 4.9) ground[at(x, y)] = 1; }
  const house = new Uint8Array(MW * MH);
  for (const p of PLACES) { p.ex = p.dock ? p.x + 1 : p.x + 2; p.ey = p.dock ? p.y : p.y + 4;
    if (!p.dock) for (let y = p.y - 1; y < p.y + 4; y++) for (let x = p.x - 1; x < p.x + 6; x++) if (inb(x, y)) house[at(x, y)] = 1; }
  const ringMask = ground.slice(), ring = (k) => ringMask[k] === 1;
  const paint = (x, y) => { if (inb(x, y) && !house[at(x, y)] && (ground[at(x, y)] === 0 || ground[at(x, y)] === 1)) ground[at(x, y)] = 1; };
  const carve = (sx, sy, goal) => {
    const prev = new Int32Array(MW * MH).fill(-1), q = [at(sx, sy)]; prev[q[0]] = q[0]; let end = -1;
    for (let h = 0; h < q.length; h++) { const k = q[h]; if (goal(k)) { end = k; break; } const x = k % MW, y = (k / MW) | 0;
      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) { const nx = x + dx, ny = y + dy; if (!inb(nx, ny)) continue; const nk = at(nx, ny);
        if (prev[nk] !== -1 || house[nk] || ground[nk] >= 2 || block[nk]) continue; prev[nk] = k; q.push(nk); } }
    for (let k = end; k >= 0 && k !== prev[k]; k = prev[k]) { const x = k % MW, y = (k / MW) | 0; if (ground[k] === 0) ground[k] = 1; paint(x + 1, y); paint(x, y + 1); paint(x + 1, y + 1); }
    ground[at(sx, sy)] = 1;
  };
  for (const p of PLACES) carve(p.ex, p.ey, ring);
  const net = (k) => ground[k] === 1;
  carve(36, SPOTS.ruins.y - 1, net); carve(47, SPOTS.tree.y + SPOTS.tree.h + 1, net); carve(BRIDGE.x, BRIDGE.y0 - 1, net); carve(BRIDGE.x + 1, BRIDGE.y0 - 1, net);
  carve(SPOTS.mill.x + 1, SPOTS.mill.y + SPOTS.mill.h, net); carve(SPOTS.farm.x + SPOTS.farm.w, SPOTS.farm.y + 5, net);
  for (const p of PLACES) { if (p.dock) continue; for (let y = p.y; y < p.y + 4; y++) for (let x = p.x; x < p.x + 5; x++) { block[at(x, y)] = 1; ground[at(x, y)] = 0; } }
  const blk = (x0, y0, w, h) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (inb(x, y)) block[at(x, y)] = 1; };
  blk(SPOTS.mill.x, SPOTS.mill.y, SPOTS.mill.w, SPOTS.mill.h); blk(SPOTS.tree.x, SPOTS.tree.y, SPOTS.tree.w, SPOTS.tree.h); blk(71, 40, 3, 2);
  blk(SPOTS.arch.x, SPOTS.arch.y + 1, 1, 1); blk(SPOTS.arch.x + 3, SPOTS.arch.y + 1, 1, 1);
  const d = PLACES.find((p) => p.dock);
  for (let y = d.y + 1; y < d.y + 6; y++) for (let x = d.x + 1; x < d.x + 3; x++) if (inb(x, y)) { ground[at(x, y)] = 3; block[at(x, y)] = 0; }
  const stones = [];
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2 + 0.11; const sx = Math.round(PLAZA.x - 0.5 + Math.cos(a) * 6.1), sy = Math.round(PLAZA.y - 0.5 + Math.sin(a) * 5.3);
    if (!inb(sx, sy) || ground[at(sx, sy)] === 1) continue; stones.push({ x: sx, y: sy, h: 36 + Math.round(hash(sx, sy, 9) * 24), owl: i === 9 }); block[at(sx, sy)] = 1; }
  const mono = { x: Math.floor(PLAZA.x) - 1, y: Math.floor(PLAZA.y) };
  block[at(mono.x, mono.y)] = 1; block[at(mono.x + 1, mono.y)] = 1;

  // ---------- ของประกอบฉาก (วางบนหญ้าเท่านั้น จึงไม่ทับทางเดิน) ----------
  const props = [], plats = [], fences = [], npcs = [];
  const grassFree = (x, y) => inb(x, y) && ground[at(x, y)] === 0 && !block[at(x, y)] && !reserved[at(x, y)];
  const nearPath = (x, y) => [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => inb(x + dx, y + dy) && ground[at(x + dx, y + dy)] === 1);
  const plazaD = (x, y) => Math.hypot(x + 0.5 - PLAZA.x, (y + 0.5 - PLAZA.y) * 1.15);
  const rectFree = (x, y, w, h) => { for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) { const X = x + i, Y = y + j, core = i >= 0 && j >= 0 && i < w && j < h;
    if (!inb(X, Y)) { if (core) return false; continue; } const k = at(X, Y); if (block[k]) return false; if (core && ground[k] !== 0) return false; } return true; };
  const mark = (x, y, w, h) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) block[at(x + i, y + j)] = 1; };
  const put = (kind, x, y, w = 1, h = 1, extra = {}) => { mark(x, y, w, h); props.push({ kind, x, y, w, h, v: hash(x, y, 70), ...extra }); };
  const spot = (x0, y0, ok) => { for (let r = 0; r < 6; r++) { let best = null, bd = 1e9;
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { if (Math.max(Math.abs(i), Math.abs(j)) !== r) continue; const x = x0 + i, y = y0 + j; if (!ok(x, y)) continue; const dd = i * i + j * j; if (dd < bd) { bd = dd; best = [x, y]; } }
    if (best) return best; } return null; };
  const SETS = [["barrel", "crate"], ["pot", "lamp"], ["crate", "barrel"], ["lamp", "pot"], ["barrel", "pot"]];
  PLACES.forEach((p, i) => { if (p.dock) return; const [a, b] = SETS[i % SETS.length];
    if (grassFree(p.x - 1, p.y + 3)) put(a, p.x - 1, p.y + 3);
    if (grassFree(p.x + 5, p.y + 3)) put(b, p.x + 5, p.y + 3);
    if (i % 2 === 0 && grassFree(p.x + 5, p.y + 2)) put("crate", p.x + 5, p.y + 2);
    if (i % 2 === 1 && grassFree(p.x - 1, p.y + 2)) put("flowers", p.x - 1, p.y + 2, 1, 1, { color: ["#d83a3a", "#f08a3a", "#e870a0"][i % 3] });
  });
  for (const a of [0.42, 2.72, 3.62, 5.86, 1.62]) { const tx = Math.round(PLAZA.x - 1 + Math.cos(a) * 9.2), ty = Math.round(PLAZA.y - 1 + Math.sin(a) * 7.4); if (rectFree(tx, ty, 2, 2)) put("tent", tx, ty, 2, 2); }
  for (const a of [0.95, 2.2, 4.05, 5.35]) { const s = spot(Math.round(PLAZA.x - 0.5 + Math.cos(a) * 7.4), Math.round(PLAZA.y - 0.5 + Math.sin(a) * 6.4), (x, y) => grassFree(x, y) && nearPath(x, y) && plazaD(x, y) > 6.6); if (s) put("lamp", s[0], s[1]); }
  { const s = spot(26, 23, (x, y) => grassFree(x, y) && nearPath(x, y)); if (s) put("sign", s[0], s[1]); }
  const hr = rng(77);
  // เนินหญ้ายกสูงหน้าผาหิน
  for (let n = 0, tries = 0; n < 16 && tries < 2400; tries++) {
    const w = [2, 3, 3, 4, 5][Math.floor(hr() * 5)], h = 2, x = 3 + Math.floor(hr() * (MW - 6 - w)), y = 3 + Math.floor(hr() * (MH - 6 - h));
    if (plazaD(x + w / 2, y + h / 2) < 8.5 || LAKES.some((L) => Math.hypot((x + w / 2 - L.x) / (L.rx + 2), (y + h / 2 - L.y) / (L.ry + 2)) < 1) || !rectFree(x, y, w, h) || reserved[at(x, y)] || reserved[at(x + w - 1, y + h - 1)]) continue;
    mark(x, y, w, h); plats.push({ x, y, w, h, seed: n + 1 }); n++;
  }
  // รั้วไม้ตามขอบทาง
  for (let n = 0, tries = 0; n < 14 && tries < 3000; tries++) {
    const len = 2 + Math.floor(hr() * 3), x = 2 + Math.floor(hr() * (MW - 4 - len)), y = 2 + Math.floor(hr() * (MH - 4));
    if (plazaD(x + len / 2, y) < 8) continue; let ok = true, path = 0;
    for (let i = 0; i < len; i++) { if (!grassFree(x + i, y)) { ok = false; break; } if (nearPath(x + i, y)) path++; }
    if (!ok || path < len - 1 || !rectFree(x, y, len, 1)) continue;
    mark(x, y, len, 1); fences.push({ x, y, len }); n++;
  }
  // พุ่มไม้ กอดอกไม้ ลาเวนเดอร์ เรียงข้างทาง
  const FL = ["#d83a3a", "#e8603a", "#e870a0", "#f2c040", "#f4f0ea"];
  for (let n = 0, tries = 0; n < 80 && tries < 5000; tries++) { const x = 2 + Math.floor(hr() * (MW - 4)), y = 2 + Math.floor(hr() * (MH - 4));
    if (!(grassFree(x, y) && nearPath(x, y) && plazaD(x, y) > 7 && rectFree(x, y, 1, 1))) continue;
    const k = hr(); put(k < 0.38 ? "bush" : k < 0.78 ? "flowers" : "lavender", x, y, 1, 1, { color: FL[Math.floor(hr() * FL.length)] }); n++; }
  // ของประกอบจุดชมวิว
  const extras = { lanterns: [], pillars: [], scare: [], hay: [] };
  { const F = SPOTS.farm; for (let x = F.x; x < F.x + F.w; x += 4) { const len = Math.min(3, F.x + F.w - x); fences.push({ x, y: F.y - 1, len }); fences.push({ x, y: F.y + F.h, len }); }
    extras.scare.push([F.x + 5, F.y + 5]); block[at(F.x + 5, F.y + 5)] = 1;
    for (const [x, y] of [[SPOTS.mill.x + 4, SPOTS.mill.y + 1], [SPOTS.mill.x + 4, SPOTS.mill.y + 2], [SPOTS.mill.x - 2, SPOTS.mill.y + 2]]) if (inb(x, y) && !block[at(x, y)] && ground[at(x, y)] === 0) { extras.hay.push([x, y]); block[at(x, y)] = 1; } }
  for (const [x, y] of [[SPOTS.tree.x - 2, SPOTS.tree.y + 2], [SPOTS.tree.x + SPOTS.tree.w + 1, SPOTS.tree.y + 2], [ISLAND.x - 3, ISLAND.y + 1], [ISLAND.x + 2, ISLAND.y + 1]]) { const X = Math.floor(x), Y = Math.floor(y); if (inb(X, Y) && ground[at(X, Y)] === 0 && !block[at(X, Y)]) { extras.lanterns.push([X, Y]); block[at(X, Y)] = 1; } }
  { const R2 = SPOTS.ruins; for (const [x, y, h] of [[R2.x + 1, R2.y + 1, 40], [R2.x + R2.w - 2, R2.y + 1, 52], [R2.x + 3, R2.y + R2.h - 2, 30], [R2.x + R2.w - 4, R2.y + R2.h - 2, 46]]) { extras.pillars.push({ x, y, h }); block[at(x, y)] = 1; } }
  for (const v of VILLAGERS) { const s = spot(v.at[0], v.at[1], (x, y) => grassFree(x, y) && nearPath(x, y) && rectFree(x, y, 1, 1)); if (s) { mark(s[0], s[1], 1, 1); npcs.push({ ...v, x: s[0], y: s[1], dir: 0 }); } }
  // ต้นไม้: ขอบป่า + กลุ่มต้นไม้
  const trees = [], free = (x, y, m) => { for (let j = -m; j <= m; j++) for (let i = -m; i <= m; i++) { if (!inb(x + i, y + j)) continue; const k = at(x + i, y + j); if (block[k] || ground[k]) return false; } return true; };
  const r = rng(20261105);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const edge = Math.min(x, y, MW - 1 - x, MH - 1 - y);
    const clump = fbm(x / 7, y / 7, 41), north = y < 11 ? 0.42 : 0;
    const pPlace = edge < 2 ? 0.86 : edge < 3 ? 0.5 : Math.max(north, clump > 0.6 ? 0.42 : 0.04);
    if (r() < pPlace && !reserved[at(x, y)] && free(x, y, edge < 2 ? 0 : 1) && plazaD(x, y) > 7.5) {
      const k = r(); trees.push({ x, y, kind: north && k < 0.7 ? "pine" : k < 0.36 ? "pine" : k < 0.56 ? "apple" : k < 0.86 ? "green" : "autumn", v: 1 + Math.floor(r() * 3) }); block[at(x, y)] = 1; }
  }
  // ระยะจากตลิ่ง (ช่อง) ใช้ไล่สีน้ำตื้น-ลึก
  const wdist = new Float32Array(MW * MH).fill(99), q = [];
  for (let k = 0; k < MW * MH; k++) if (ground[k] !== 2) { wdist[k] = 0; q.push(k); }
  for (let h = 0; h < q.length; h++) { const k = q[h], x = k % MW, y = (k / MW) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (!inb(nx, ny)) continue; const nk = at(nx, ny); if (wdist[nk] > wdist[k] + 1) { wdist[nk] = wdist[k] + 1; q.push(nk); } } }
  // ช่องที่มีของทับ (ท่าเรือ สะพาน) ไม่ต้องคำนวณขอบน้ำรายพิกเซล
  const block2 = new Uint8Array(MW * MH); for (let k = 0; k < MW * MH; k++) if (ground[k] === 3 || ground[k] === 1) block2[k] = 1;
  const R2 = SPOTS.ruins, shapes = { lakes: LAKES, island: ISLAND, flag: { x: R2.x + R2.w / 2, y: R2.y + R2.h / 2, rx: R2.w / 2, ry: R2.h / 2 } };
  return { ground, block, stones, mono, trees, props, plats, fences, npcs, at, inb, MW, MH, wdist, extras, shapes, block2 };
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
// ตัดบรรทัดภาษาไทย: ไม่แยกสระ/วรรณยุกต์ออกจากพยัญชนะ
export function wrapText(ctx, text, maxW) {
  const lines = []; let cur = "";
  for (const ch of text) { const comb = /[ัิ-ฺ็-๎]/.test(ch);
    if (!comb && cur && ctx.measureText(cur + ch).width > maxW) { const sp = cur.lastIndexOf(" "); if (sp > cur.length * 0.5) { lines.push(cur.slice(0, sp)); cur = cur.slice(sp + 1); } else { lines.push(cur); cur = ""; } }
    cur += ch; }
  if (cur) lines.push(cur); return lines;
}
// วาดเงาของสไปรต์ลงพื้น: แบบ "เฉือน" สำหรับวัตถุตั้งตรง หรือ "เลื่อน" สำหรับวัตถุทรงกล่อง/เนิน
function castShadow(x, sil, dx, dy, footY, mode, lift, ox = 0, oy = 0) {
  if (mode === "shift") { x.setTransform(1, 0, 0, 1, lift * SUN.kx - ox, -lift * SUN.ky - oy); x.drawImage(sil, dx, dy); }
  else { x.setTransform(1, 0, -SUN.kx, SUN.ky, SUN.kx * footY - ox, footY * (1 - SUN.ky) - oy); x.drawImage(sil, dx, dy); }
  x.setTransform(1, 0, 0, 1, 0, 0);
}
const SHADOW = "#16163a", SHADOW_A = 0.55;

// ---------- ติดตั้งบนหน้า ----------
export function mountWorld(host, { go, playerName = "นักผจญภัย", shirt = "#5b3df5", look = null, reduced = false, fill = false }) {
  const M = buildMap();
  const cache = new Map(), spr = (key, make) => cache.get(key) || (cache.set(key, make()), cache.get(key));
  const silCache = new Map(), sil = (s) => silCache.get(s.c) || (silCache.set(s.c, tint(silhouette(s.c))), silCache.get(s.c));
  function tint(c) { const x = c.getContext("2d"); x.globalCompositeOperation = "source-in"; x.fillStyle = SHADOW; x.fillRect(0, 0, c.width, c.height); return c; }
  const objects = [], shadows = [];
  // วัตถุนิ่ง: เก็บไว้วาดเงาครั้งเดียว + เรียงลำดับความลึกตอนวาด
  const add = (s, bx, by, ysort, extra, shadow = "shear", lift = 0) => { const dx = Math.round(bx - s.ax), dy = Math.round(by - s.ay);
    objects.push({ y: ysort ?? by, x0: dx, x1: dx + s.c.width, top: dy, bot: dy + s.c.height, draw: (x, now) => { x.drawImage(s.c, dx, dy); if (extra) extra(x, now); } });
    if (shadow) shadows.push({ s, dx, dy, foot: by, mode: shadow, lift }); };
  for (const t of M.trees) { const bx = t.x * T + 16, by = t.y * T + 28;
    add(t.kind === "pine" ? spr("pine" + t.v, () => pineTree(t.v * 31)) : spr(t.kind + t.v, () => broadTree(t.kind, t.v * 17 + t.kind.length)), bx, by); }
  for (const p of PLACES) {
    if (p.dock) { add(spr("dock", dockSign), (p.x - 1) * T + 16, p.y * T + T - 2, p.y * T + T); continue; }
    // บ้านวิชา: ป้ายประจำวิชา (ไอคอน + ป้ายไม้ + วงแสงหมุน) ติดบนหลังคาแทนตราเดิม
    const sx = p.x * T - HOUSE.ax + HOUSE.emblem[0], sy = (p.y + 4) * T - HOUSE.ay + HOUSE.emblem[1];
    const sign = !p.shop && SIGN_FX[p.id] ? (x, now) => { const sg = spr("sign" + p.id, () => subjectSign(p.id)), tt = reduced ? 1.3 : now / 1000, bob = reduced ? 0 : Math.round(Math.sin(tt * 1.8 + p.x) * 1.2);
      x.drawImage(sg.c, Math.round(sx - sg.ax), Math.round(sy + 36 - sg.ay + bob)); drawSignFx(x, p.id, sx, sy - 6 + bob, tt, near === p, reduced); } : null;
    add(spr("h" + p.id, () => house(p)), p.x * T, (p.y + 4) * T, (p.y + 4) * T, sign, "shift", 64);
  }
  for (const h of M.plats) add(spr(`plat${h.w}x${h.h}s${h.seed}`, () => plateau(h.w, h.h, h.seed)), h.x * T, (h.y + h.h) * T, (h.y + h.h) * T, null, "shift", 26);
  for (const f of M.fences) add(spr("fence" + f.len, () => fence(f.len)), f.x * T, f.y * T + 30, f.y * T + 30);
  // ---------- จุดชมวิว ----------
  const lamps = [], glows = []; // [x, y, r, สี, เฟส] แสงเรืองที่วาดซ้อนตอนท้าย
  { const MI = spr("mill", windmill), sails = windmillSails(8), mx = (SPOTS.mill.x + 1.5) * T, my = (SPOTS.mill.y + SPOTS.mill.h) * T - 2;
    add(MI.s, mx, my, my, (x, now) => { const f = sails[reduced ? 0 : Math.floor(now / 140) % sails.length], hx = mx - MI.s.ax + MI.hub[0], hy = my - MI.s.ay + MI.hub[1]; x.drawImage(f.c, hx - f.ax, hy - f.ay); }); }
  { const TR = spr("gtree", greatTree), tx = (SPOTS.tree.x + 1.5) * T, ty = (SPOTS.tree.y + SPOTS.tree.h) * T - 2;
    add(TR.s, tx, ty, ty, null, "shear"); for (const [gx, gy] of TR.glow) glows.push([tx - TR.s.ax + gx, ty - TR.s.ay + gy, 18, "255,240,170", gx]); }
  { const GZ = spr("gazebo", gazebo), gx = ISLAND.x * T, gy = 42 * T - 2;
    add(GZ.s, gx, gy, gy, null, "shift", 40); for (const [lx, ly] of GZ.lamps) glows.push([gx - GZ.s.ax + lx, gy - GZ.s.ay + ly, 26, "255,170,80", lx]); }
  { const AR = spr("arch", ruinArch), ax = (SPOTS.arch.x + 2) * T, ay = (SPOTS.arch.y + 2) * T - 2;
    add(AR.s, ax, ay, ay, null, "shear"); glows.push([ax - AR.s.ax + AR.rune[0], ay - AR.s.ay + AR.rune[1], 22, "120,230,255", 3]); }
  for (const [x0, y0] of M.extras.lanterns) { const L = spr("slan", stoneLantern), bx2 = x0 * T + 16, by2 = y0 * T + 28; add(L.s, bx2, by2); lamps.push([bx2 - L.s.ax + L.light[0], by2 - L.s.ay + L.light[1]]); }
  for (const [x0, y0] of M.extras.scare) add(spr("scare", scarecrow), x0 * T + 16, y0 * T + 28);
  for (const [x0, y0] of M.extras.hay) add(spr("hay", hayBale), x0 * T + 16, y0 * T + 28);
  for (const p of M.props) {
    const key = p.kind + (p.kind === "flowers" ? p.color : p.kind === "bush" ? (p.v < 0.5 ? p.color : "plain") + (p.v * 9 | 0) % 3 : p.v < 0.5 ? 0 : 1);
    const make = () => p.kind === "bush" ? bush((p.v * 9 | 0) % 3, p.v < 0.5 ? p.color : null) : p.kind === "flowers" ? flowerPatch(Math.floor(p.v * 9), p.color) : p.kind === "lavender" ? lavender(3) : PROP[p.kind](p.v);
    const s = spr(key, make);
    if (p.kind === "tent") add(s, (p.x + 1) * T, (p.y + 2) * T - 4);
    else { add(s, p.x * T + 16, p.y * T + 28, null, null, ["flowers", "lavender"].includes(p.kind) ? "shear" : "shear"); if (p.kind === "lamp") lamps.push([p.x * T + 16, p.y * T + 28 - 52]); }
  }
  // เสาหินพันเถาวัลย์ + คริสตัล (เสาใหญ่กลางลานมีวงเวทย์ใบไม้หมุนรอบ)
  const pillars = [], bobY = (P, now) => (reduced ? 0 : Math.round(Math.sin(now / 520 + P.i) * 3));
  const crystalAt = (P, now) => [P.bx, P.by - P.H - (P.big ? 34 : 22) + bobY(P, now)];
  const addPillar = (P) => { pillars.push(P);
    add(spr(`pl${P.W}x${P.H}s${P.seed}`, () => pillar(P.W, P.H, P.seed, P.big)), P.bx, P.by, P.by, (x, now) => {
      if (P.owl) { const ox = P.bx - 10, oy = P.by - P.H - 16; x.fillStyle = "#2a2030"; x.fillRect(ox - 2, oy - 2, 22, 22); x.fillStyle = "#7a5434"; x.fillRect(ox, oy, 18, 18); x.fillStyle = "#a87a4e"; x.fillRect(ox + 2, oy + 6, 14, 12);
        const blink = Math.floor(now / 1000) % 5 === 0 && now % 1000 < 140; x.fillStyle = "#f6c040"; x.fillRect(ox + 2, oy + 4, 6, blink ? 2 : 6); x.fillRect(ox + 10, oy + 4, 6, blink ? 2 : 6); x.fillStyle = "#1a1010"; if (!blink) { x.fillRect(ox + 4, oy + 6, 2, 3); x.fillRect(ox + 12, oy + 6, 2, 3); }
        x.fillStyle = "#e08a2a"; x.fillRect(ox + 8, oy + 10, 2, 4); x.fillStyle = "#7a5434"; x.fillRect(ox, oy - 2, 4, 4); x.fillRect(ox + 14, oy - 2, 4, 4); return; }
      if (P.big) { x.globalAlpha = 0.45 + 0.4 * Math.sin(now / (reduced ? 1e9 : 600)); x.fillStyle = "#b8ff7a"; const X = P.bx - 2, Y0 = P.by - P.H + 28;
        for (let k = 0; k < 4; k++) { const cy = Y0 + k * 18; for (let d = 0; d < 5; d++) { x.fillRect(X - 5 + d, cy + d, 2, 2); x.fillRect(X + 5 - d, cy + d, 2, 2); } } x.globalAlpha = 1; }
      const cs = spr("cry" + (P.big ? 13 : 7), () => crystal(P.big ? 13 : 7)), [qx, qy] = crystalAt(P, now); x.drawImage(cs.c, qx - cs.ax, qy - cs.ay); }); };
  M.stones.forEach((s, i) => addPillar({ bx: s.x * T + 16, by: s.y * T + T - 2, W: 30, H: s.h + 20, seed: (s.x * 7 + s.y) % 5, big: false, owl: s.owl, i }));
  addPillar({ bx: M.mono.x * T + 32, by: M.mono.y * T + T - 4, W: 50, H: 130, seed: 3, big: true, i: 99 });
  const bigP = pillars[pillars.length - 1];
  M.extras.pillars.forEach((q, i) => addPillar({ bx: q.x * T + 16, by: q.y * T + T - 2, W: 30, H: q.h + 20, seed: (q.x + q.y) % 5, big: false, i: 60 + i }));

  // ---------- พื้น + เงานิ่ง (วาดครั้งเดียว) ----------
  // พื้นแบ่งเป็นชิ้น 256×256 อบเมื่อใกล้จะเห็น (ทีละนิดต่อเฟรม ไม่กระตุก) — แผนที่ใหญ่ขึ้นแต่โหลดเร็วเท่าเดิม
  const G = groundTypes(M, PLAZA), CH = 256, NCX = Math.ceil(G.W / CH), NCY = Math.ceil(G.H / CH), chunks = new Map(), pending = new Map();
  for (const o of shadows) { const w = o.s.c.width, h = o.s.c.height; o.bb = o.mode === "shift" ? [o.dx - 4, o.dy - o.lift * SUN.ky - 4, o.dx + w + o.lift * SUN.kx + 4, o.dy + h + 4] : [o.dx - h * SUN.kx - 12, o.foot - h * SUN.ky - 12, o.dx + w + 12, o.foot + 14]; }
  function finishChunk(cx2, cy2, B) {
    const X0 = cx2 * CH, Y0 = cy2 * CH, [c, g] = canvas(B.w, B.h); g.putImageData(B.img, 0, 0);
    const M2 = 4, [sl, sx] = canvas(B.w + M2 * 2, B.h + M2 * 2), ox = X0 - M2, oy = Y0 - M2;
    const hit = shadows.filter((o) => o.bb[2] > ox && o.bb[0] < ox + B.w + M2 * 2 && o.bb[3] > oy && o.bb[1] < oy + B.h + M2 * 2);
    for (const o of hit) castShadow(sx, sil(o.s), o.dx, o.dy, o.foot, o.mode, o.lift, ox, oy);
    sx.fillStyle = SHADOW; sx.globalAlpha = 0.5; for (const o of hit) { const w = o.s.c.width * (o.mode === "shift" ? 0.9 : 0.5); sx.beginPath(); sx.ellipse(o.dx + o.s.ax - ox, o.foot - 2 - oy, w / 2, Math.min(10, w / 6), 0, 0, 7); sx.fill(); } sx.globalAlpha = 1;
    g.globalAlpha = SHADOW_A; if ("filter" in g) g.filter = "blur(1px)"; g.drawImage(sl, -M2, -M2); g.filter = "none"; g.globalAlpha = 1;
    chunks.set(cy2 * NCX + cx2, c); pending.delete(cy2 * NCX + cx2);
  }
  function chunkJob(cx2, cy2) { const k = cy2 * NCX + cx2; if (chunks.has(k)) return null; let B = pending.get(k);
    if (!B) { const X0 = cx2 * CH, Y0 = cy2 * CH; B = groundBaker(M, PLAZA, G, X0, Y0, Math.min(CH, G.W - X0), Math.min(CH, G.H - Y0)); pending.set(k, B); } return B; }
  // อบชิ้นที่มองเห็นให้เสร็จทันที แล้วค่อยอบชิ้นรอบ ๆ ทีละนิด
  function bakeAround(cx, cy, w, h, budget) {
    const a0 = Math.max(0, Math.floor(cx / CH)), a1 = Math.min(NCX - 1, Math.floor((cx + w) / CH)), b0 = Math.max(0, Math.floor(cy / CH)), b1 = Math.min(NCY - 1, Math.floor((cy + h) / CH));
    for (let b = b0; b <= b1; b++) for (let a = a0; a <= a1; a++) { const B = chunkJob(a, b); if (B) { B.step(); finishChunk(a, b, B); } }
    if (budget <= 0) return; const t0 = performance.now();
    for (let ring = 1; ring <= 1 && performance.now() - t0 < budget; ring++) for (let b = b0 - ring; b <= b1 + ring; b++) for (let a = a0 - ring; a <= a1 + ring; a++) {
      if (a < 0 || b < 0 || a >= NCX || b >= NCY) continue; const B = chunkJob(a, b); if (!B) continue; const left = budget - (performance.now() - t0); if (left <= 0) return;
      if (B.step(left)) finishChunk(a, b, B); else return; }
  }

  // ---------- ตัวละคร ----------
  const saved = (() => { try { return sessionStorage.getItem(POS_KEY); } catch { return null; } })();
  const start = PLACES.find((p) => p.id === saved);
  const home = (() => { let b = [24 + OX, 20 + OY], bd = 1e9; for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const k = M.at(x, y); if (M.ground[k] !== 1 || M.block[k]) continue; const d = Math.hypot(x - 26.5 - OX, y - 22.5 - OY); if (d < bd) { bd = d; b = [x, y]; } } return b; })();
  const hero = { x: (start ? start.ex : home[0]) * T + 16, y: ((start ? start.ey : home[1]) + 0.6) * T, dir: 0, step: 0, stepT: 0, path: null, target: null };
  const fox = { x: (PLAZA.x + 2) * T, y: (PLAZA.y + 2) * T, tx: 0, ty: 0, face: 1, step: 0, wait: 1 };
  const heroLook = look ? { ...look } : { shirt, pants: "#2a3550", hair: "#3a2a20" };
  const frames = (key, look) => (dir, step) => spr(`${key}${dir}${step}`, () => charFrame(dir, step, look));
  const heroF = frames("hero", heroLook);
  const npcs = M.npcs.map((n, i) => ({ ...n, fx: n.x * T + 16, fy: n.y * T + 26, F: frames("npc" + i, n.look), phase: i * 0.7 }));
  const keys = new Set();
  const [buf, bx] = canvas(10, 10);
  const view = document.createElement("canvas");
  view.className = "world-canvas"; view.tabIndex = 0;
  view.setAttribute("role", "application");
  view.setAttribute("aria-label", "หมู่บ้านแห่งการเรียนรู้ ใช้ปุ่มลูกศรเดิน กด E เพื่อเข้าบ้าน หรือใช้ปุ่มลัดด้านล่างแผนที่");
  host.appendChild(view);
  const ui = document.createElement("div"); ui.className = "world-ui"; host.appendChild(ui);
  ui.innerHTML = `<div class="w-fx w-tilt top"></div><div class="w-fx w-tilt bot"></div><canvas class="world-labels" aria-hidden="true"></canvas>`
    + `<div class="world-hint"><span class="wh-long">⌨️ ลูกศร / WASD เดิน · Shift วิ่ง · E เข้าบ้าน · 👆 แตะที่บ้านเพื่อเดินไปเข้า</span><span class="wh-short">👆 แตะพื้นเพื่อเดิน · แตะบ้านเพื่อเข้า</span></div><button type="button" class="world-enter" hidden></button><div class="world-fade"></div>`;
  const enterBtn = ui.querySelector(".world-enter"), fade = ui.querySelector(".world-fade"), labels = ui.querySelector(".world-labels");
  let S = 2, vw = 0, vh = 0, dpr = 1, cam = { x: 0, y: 0 }, near = null, talk = null, leaving = false, smooth = false;

  function resize() {
    const w = host.clientWidth; dpr = Math.min(2, window.devicePixelRatio || 1);
    let h = w < 640 ? Math.min(Math.round(window.innerHeight * 0.62), 560) : Math.min(640, Math.max(420, Math.round(w * 0.56)));
    if (fill) { const top = host.getBoundingClientRect().top + window.scrollY, pad = parseFloat(getComputedStyle(document.body).paddingBottom) || 0;
      h = Math.max(320, Math.round(window.innerHeight - top - pad)); host.style.height = h + "px"; }
    // ขนาดพิกเซล: ให้ (S × dpr) เป็นจำนวนเต็มเมื่อทำได้ ภาพจะคม
    S = w >= 2300 ? 2.5 : w >= 1700 ? 2 : w >= 1100 ? (dpr >= 2 ? 1.5 : 2) : w >= 700 ? (dpr >= 2 ? 1.5 : 1) : 1;
    smooth = Math.abs(S * dpr - Math.round(S * dpr)) > 0.01;
    vw = Math.ceil(w / S); vh = Math.ceil(h / S);
    buf.width = vw; buf.height = vh; bx.imageSmoothingEnabled = false;
    makeGrade();
    for (const c of [view, labels]) { c.style.width = w + "px"; c.style.height = h + "px"; c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
  }
  // ปรับสีภาพแบบ HD-2D บนบัฟเฟอร์ขนาดเล็ก (ถูกกว่าใช้ CSS blend ทั้งจอ): แสงอุ่น หมอกด้านบน ลำแสงเฉียง ขอบมืด
  let GR = null;
  function makeGrade() {
    const w = vw, h = vh, mk = (fn) => { const [c, g] = canvas(w, h); fn(g); return c; };
    const warm = mk((g) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "rgba(255,190,110,.75)"); gr.addColorStop(0.45, "rgba(255,226,170,.25)"); gr.addColorStop(1, "rgba(60,80,150,.4)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    const haze = mk((g) => { const gr = g.createLinearGradient(0, 0, 0, h * 0.5); gr.addColorStop(0, "rgba(255,226,180,.30)"); gr.addColorStop(1, "rgba(255,226,180,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    const vig = mk((g) => { const r = Math.hypot(w, h) / 2, gr = g.createRadialGradient(w / 2, h * 0.48, r * 0.45, w / 2, h * 0.48, r); gr.addColorStop(0, "rgba(18,12,4,0)"); gr.addColorStop(1, "rgba(18,12,4,.5)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    const P = 210, [rays, rg] = canvas(w + P * 2, h); rg.save(); rg.translate(0, 0); rg.transform(1, 0, -0.55, 1, 0, 0);
    for (let x0 = 0; x0 < w + P * 2 + h; x0 += P) { const gr = rg.createLinearGradient(x0, 0, x0 + 90, 0); gr.addColorStop(0, "rgba(255,230,170,0)"); gr.addColorStop(0.5, "rgba(255,230,170,.16)"); gr.addColorStop(1, "rgba(255,230,170,0)"); rg.fillStyle = gr; rg.fillRect(x0, 0, 90, h); }
    rg.restore(); rg.globalCompositeOperation = "destination-in"; const m = rg.createLinearGradient(0, 0, w * 0.7, h); m.addColorStop(0, "#000"); m.addColorStop(1, "rgba(0,0,0,0)"); rg.fillStyle = m; rg.fillRect(0, 0, w + P * 2, h);
    GR = { warm, haze, vig, rays, P };
  }
  function grade(x, now) {
    if (!GR) return;
    x.globalCompositeOperation = "soft-light"; x.drawImage(GR.warm, 0, 0);
    x.globalCompositeOperation = "screen"; x.drawImage(GR.haze, 0, 0); x.drawImage(GR.rays, -GR.P + (reduced ? 0 : (now / 60) % GR.P), 0);
    x.globalCompositeOperation = "source-over"; x.drawImage(GR.vig, 0, 0);
  }
  let lastW = 0, lastH = 0;
  const onResize = () => { if (host.clientWidth === lastW && window.innerHeight === lastH) return; lastW = host.clientWidth; lastH = window.innerHeight; resize(); };
  const ro = new ResizeObserver(onResize); ro.observe(host); window.addEventListener("resize", onResize); resize();

  const tileAt = (px, py) => [Math.floor(px / T), Math.floor(py / T)];
  const blocked = (px, py) => { const [tx, ty] = tileAt(px, py); return !M.inb(tx, ty) || M.block[M.at(tx, ty)]; };
  const solid = (x, y) => blocked(x - 8, y - 4) || blocked(x + 8, y - 4) || blocked(x - 8, y) || blocked(x + 8, y);
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
    const speed = keys.has("Shift") ? 220 : 140;
    if (mx || my) hero.path = null, hero.target = null;
    else if (hero.path && hero.path.length) { const [tx, ty] = hero.path[0], gx2 = tx * T + 16, gy2 = ty * T + 20; const dx = gx2 - hero.x, dy = gy2 - hero.y, d = Math.hypot(dx, dy);
      if (d < 3) { hero.path.shift(); if (!hero.path.length) { hero.path = null; if (hero.target) { const t = hero.target; hero.target = null; hero.dir = 3; enter(t); } } } else { mx = dx / d; my = dy / d; } }
    const moving = !!(mx || my);
    if (moving) { const l = Math.hypot(mx, my) || 1, vx = mx / l * speed * dt, vy = my / l * speed * dt;
      if (!solid(hero.x + vx, hero.y)) hero.x += vx; if (!solid(hero.x, hero.y + vy)) hero.y += vy;
      hero.dir = Math.abs(mx) > Math.abs(my) ? (mx < 0 ? 1 : 2) : my < 0 ? 3 : 0;
      hero.stepT += dt; if (hero.stepT > 0.13) { hero.stepT = 0; hero.step = (hero.step + 1) % 4; } } else hero.step = 0;
    const [htx, hty] = tileAt(hero.x, hero.y - 1);
    const n = PLACES.find((p) => (htx === p.ex || htx === p.ex + (p.dock ? 1 : 0)) && (hty === p.ey || (p.dock && hty === p.ey + 1)));
    if (n !== near) { near = n; enterBtn.hidden = !n; if (n) enterBtn.textContent = `${n.ic} เข้า${n.dock ? "" : "บ้าน"}${n.name}`; }
    talk = null; let best = 68;
    for (const v of npcs) { const dx = hero.x - v.fx, dy = hero.y - v.fy, d = Math.hypot(dx, dy * 1.3);
      if (d < 92) v.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy < 0 ? 3 : 0; else v.dir = 0;
      if (d < best && !near) { best = d; talk = v; } }
    fox.wait -= dt;
    if (fox.wait <= 0 && !fox.tx) { const a = Math.random() * Math.PI * 2, r = 2.5 + Math.random() * 1.6; fox.tx = (PLAZA.x + Math.cos(a) * r) * T; fox.ty = (PLAZA.y + Math.sin(a) * r * 0.85) * T + 16; }
    if (fox.tx) { const dx = fox.tx - fox.x, dy = fox.ty - fox.y, d = Math.hypot(dx, dy); if (d < 3) { fox.tx = 0; fox.wait = 1.5 + Math.random() * 3; } else { fox.x += dx / d * 52 * dt; fox.y += dy / d * 52 * dt; fox.face = dx < 0 ? -1 : 1; fox.stepT = (fox.stepT || 0) + dt; if (fox.stepT > 0.16) { fox.stepT = 0; fox.step++; } } }
    cam.x = Math.max(0, Math.min(MW * T - vw, hero.x - vw / 2)); cam.y = Math.max(0, Math.min(MH * T - vh, hero.y - vh / 2 - 16));
    if (MW * T < vw) cam.x = (MW * T - vw) / 2; if (MH * T < vh) cam.y = (MH * T - vh) / 2;
  }

  // ---------- เวทมนตร์รอบเสาใหญ่ ----------
  const LIME = "#c4ff78", A = (x, a) => { x.globalAlpha = a < 0 ? 0 : a > 1 ? 1 : a; };
  const GLOW = (() => { const [c, g] = canvas(64, 64), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,220,.9)"); gr.addColorStop(0.18, "rgba(210,255,140,.55)"); gr.addColorStop(0.5, "rgba(170,255,100,.18)"); gr.addColorStop(1, "rgba(150,255,90,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c; })();
  const LAMPGLOW = (() => { const [c, g] = canvas(64, 64), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,230,160,.8)"); gr.addColorStop(0.3, "rgba(255,190,90,.35)"); gr.addColorStop(1, "rgba(255,170,60,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c; })();
  function swirl(x, t, front) {
    const P = bigP;
    for (const [ry0, rx, ry, sp, n] of [[16, 52, 16, 1.6, 3], [70, 38, 12, -2.1, 2]]) for (let k = 0; k < n; k++) { const a0 = t * sp + (k * Math.PI * 2) / n;
      for (let i = 0; i < 30; i++) { const a = a0 + (sp > 0 ? -1 : 1) * i * 0.045, sn = Math.sin(a); if ((sn >= 0) !== front) continue;
        const px = P.bx + Math.cos(a) * rx, py = P.by - ry0 + sn * ry, al = (1 - i / 30) * (front ? 1 : 0.55);
        A(x, al); x.fillRect(Math.round(px), Math.round(py), i < 10 ? 5 : 3, i < 8 ? 3 : 2); if (i < 6) { x.fillStyle = "#f0ffc8"; x.fillRect(Math.round(px), Math.round(py), 2, 1); x.fillStyle = LIME; } } }
  }
  function leaves(x, t, front) {
    const P = bigP;
    for (let i = 0; i < 10; i++) { const a = t * 0.9 + (i * Math.PI * 2) / 10, sn = Math.sin(a); if ((sn >= 0) !== front) continue;
      const h = ((t * 18 + i * 26) % 120), px = Math.round(P.bx + Math.cos(a) * (48 - h * 0.24)), py = Math.round(P.by - 12 - h + sn * 14), fl = Math.floor(t * 4 + i) % 2;
      x.globalAlpha = Math.min(1, (120 - h) / 30) * (front ? 1 : 0.7);
      x.fillStyle = "#1e4a16"; x.fillRect(px - 1, py - 1, 7, 6); x.fillStyle = fl ? "#7cd44a" : "#5ab83a"; x.fillRect(px, py, 5, 4); x.fillStyle = "#d4ff98"; x.fillRect(px + (fl ? 0 : 3), py, 2, 2); }
    x.globalAlpha = 1;
  }
  function magicBack(x, t) {
    const P = bigP, cx = P.bx, cy = P.by - 4;
    x.globalCompositeOperation = "lighter"; x.fillStyle = LIME;
    for (let i = 0; i < 96; i++) { const a = (i / 96) * Math.PI * 2, px = cx + Math.cos(a) * 62, py = cy + Math.sin(a) * 20; A(x, 0.3 + 0.2 * Math.sin(t * 2 + i * 0.5)); x.fillRect(Math.round(px), Math.round(py), 3, 2); }
    for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2 - t * 0.6, px = cx + Math.cos(a) * 42, py = cy + Math.sin(a) * 13; if (i % 5 === 0) continue; A(x, 0.34); x.fillRect(Math.round(px), Math.round(py), 2, 2); }
    swirl(x, t, false); x.globalAlpha = 1; x.globalCompositeOperation = "source-over"; leaves(x, t, false);
  }
  const spark = (x, X, Y, k) => { if (k < 0.12) return; X = Math.round(X); Y = Math.round(Y); A(x, k); x.fillStyle = "#ffffe6"; x.fillRect(X, Y, 2, 2); x.fillStyle = LIME;
    const Ln = k > 0.75 ? 5 : k > 0.4 ? 3 : 2; for (let i = 2; i <= Ln + 1; i++) { A(x, k * (1 - i / (Ln + 2))); x.fillRect(X - i, Y, 1, 2); x.fillRect(X + 1 + i, Y, 1, 2); x.fillRect(X, Y - i, 2, 1); x.fillRect(X, Y + 1 + i, 2, 1); } };
  function magicFront(x, t, v) {
    x.globalCompositeOperation = "lighter"; x.fillStyle = LIME;
    for (const P of pillars) { if (P.owl || P.bx < v[0] - 80 || P.bx > v[1] + 80 || P.by < v[2] - 40 || P.by - P.H - 80 > v[3]) continue;
      const [qx, qy] = crystalAt(P, t * 1000), pulse = 0.75 + 0.25 * Math.sin(t * 2.4 + P.i), r = P.big ? 1.8 : 1;
      A(x, 0.6 * pulse); const gs = 64 * r; x.drawImage(GLOW, qx - gs / 2, qy - gs / 2, gs, gs); x.fillStyle = LIME;
      for (let i = 0; i < (P.big ? 8 : 3); i++) { const a = hash(i, P.i, 81) * 6.28, d = (12 + hash(i, P.i, 82) * 20) * r; spark(x, qx + Math.cos(a) * d, qy + Math.sin(a) * d * 0.8 - 4, Math.max(0, Math.sin(t * (1.6 + hash(i, P.i, 83)) + i * 2.3))); }
    }
    const P = bigP;
    if (P.bx > v[0] - 120 && P.bx < v[1] + 120 && P.by > v[2] - 40 && P.by - P.H - 120 < v[3]) {
      for (let i = 0; i < 6; i++) { const lx = P.bx - 30 + i * 12 + Math.round(Math.sin(t + i) * 2), h = 36 + ((i * 23) % 28) + Math.sin(t * 3 + i * 1.7) * 12, al = 0.2 + 0.12 * Math.sin(t * 2.5 + i);
        for (let k = 0; k < h; k += 2) { A(x, al * (1 - k / h)); x.fillRect(lx, P.by - 6 - k, 2, 2); } }
      for (let i = 0; i < 14; i++) { const ph = (t * 0.35 + hash(i, 1, 84)) % 1, mx = P.bx + (hash(i, 2, 84) - 0.5) * 100, my = P.by - 8 - ph * 140; spark(x, mx + Math.sin(t * 2 + i) * 4, my, (1 - ph) * 0.9 * Math.abs(Math.sin(t * 3 + i))); }
      swirl(x, t, true);
    }
    x.globalAlpha = 1; x.globalCompositeOperation = "source-over"; leaves(x, t, true);
  }

  // ---------- วาดแต่ละเฟรม ----------
  function dynShadow(x, s, fx, fy, cx, cy) { castShadow(x, sil(s), Math.round(fx) - s.ax, Math.round(fy) - s.ay, Math.round(fy), "shear", 0, cx, cy); }
  function render(now) {
    const x = bx, cx = Math.round(cam.x), cy = Math.round(cam.y), t = reduced ? 1.3 : now / 1000;
    x.fillStyle = "#1c2a12"; x.fillRect(0, 0, vw, vh);
    bakeAround(cx, cy, vw, vh, 3);
    { const a0 = Math.floor(cx / CH), a1 = Math.floor((cx + vw) / CH), b0 = Math.floor(cy / CH), b1 = Math.floor((cy + vh) / CH);
      for (let b = b0; b <= b1; b++) for (let a = a0; a <= a1; a++) { const c = chunks.get(b * NCX + a); if (c) x.drawImage(c, a * CH - cx, b * CH - cy); } }
    // เงาตัวละคร (ยืดตามแดด)
    x.globalAlpha = SHADOW_A;
    const hf = heroF(hero.dir, hero.step), ff = spr(`fox${fox.face}${fox.step % 2}`, () => foxFrame(fox.face, fox.step % 2));
    dynShadow(x, hf, hero.x, hero.y, cx, cy); dynShadow(x, ff, fox.x, fox.y, cx, cy);
    for (const n of npcs) if (n.fx > cx - 80 && n.fx < cx + vw + 80 && n.fy > cy - 20 && n.fy < cy + vh + 80) dynShadow(x, n.F(n.dir, 0), n.fx, n.fy, cx, cy);
    x.globalAlpha = 1;
    x.save(); x.translate(-cx, -cy);
    if (!reduced) for (let i = 0; i < 90; i++) { const wx = 54 * T + ((i * 53) % (26 * T)), wy = 32 * T + ((i * 37) % (17 * T)) + Math.sin(now / 600 + i) * 3; const [tx, ty] = tileAt(wx, wy);
      if (M.inb(tx, ty) && M.ground[M.at(tx, ty)] === 2) { x.globalAlpha = 0.35 + 0.35 * Math.sin(now / 400 + i * 1.7); x.fillStyle = "#f0f8ff"; x.fillRect(Math.round(wx), Math.round(wy), 4 + (i % 4) * 2, 2); } }
    x.globalAlpha = 1;
    const vb = [cx, cx + vw, cy, cy + vh];
    if (bigP.bx > cx - 160 && bigP.bx < cx + vw + 160 && bigP.by > cy - 80 && bigP.by - 240 < cy + vh) magicBack(x, t);
    const list = objects.filter((o) => o.x1 >= cx && o.x0 <= cx + vw && o.bot >= cy && o.top <= cy + vh);
    list.push({ y: fox.y, draw: (c) => c.drawImage(ff.c, Math.round(fox.x) - ff.ax, Math.round(fox.y) - ff.ay) });
    list.push({ y: hero.y, draw: (c) => c.drawImage(hf.c, Math.round(hero.x) - hf.ax, Math.round(hero.y) - hf.ay) });
    for (const n of npcs) list.push({ y: n.fy, draw: (c) => { const f = n.F(n.dir, 0), b = !reduced && Math.sin(now / 700 + n.phase) > 0.6 ? 1 : 0; c.drawImage(f.c, n.fx - f.ax, n.fy - f.ay + b); } });
    list.sort((a, b) => a.y - b.y);
    for (const o of list) o.draw(x, now);
    magicFront(x, t, vb);
    x.globalCompositeOperation = "lighter";
    for (const [lx, ly] of lamps) { if (lx < cx - 60 || lx > cx + vw + 60 || ly < cy - 60 || ly > cy + vh + 60) continue; x.globalAlpha = reduced ? 0.5 : 0.42 + 0.08 * Math.sin(now / 300 + lx); x.drawImage(LAMPGLOW, lx - 40, ly - 40, 80, 80); }
    for (const [gx2, gy2, r, col, ph] of glows) { if (gx2 < cx - 60 || gx2 > cx + vw + 60 || gy2 < cy - 60 || gy2 > cy + vh + 60) continue;
      x.globalAlpha = reduced ? 0.45 : 0.35 + 0.2 * Math.sin(now / 420 + ph); x.drawImage(LAMPGLOW, gx2 - r, gy2 - r, r * 2, r * 2);
      if (!reduced) { x.fillStyle = `rgba(${col},.9)`; for (let i = 0; i < 3; i++) { const t2 = now / 1000 + i * 2.1 + ph, fx = gx2 + Math.sin(t2 * 0.9 + i) * 22, fy = gy2 + Math.cos(t2 * 0.7 + i * 2) * 14; x.globalAlpha = 0.5 + 0.5 * Math.sin(t2 * 3); x.fillRect(Math.round(fx), Math.round(fy), 2, 2); } } }
    x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
    if (!reduced) {
      x.fillStyle = "rgba(16,24,60,.10)"; // เงาเมฆเคลื่อนผ่าน
      for (let i = 0; i < 3; i++) { const ox = ((now / 45 + i * 660) % (MW * T + 800)) - 400, oy = (i * 380 + 160) % (MH * T);
        x.beginPath(); x.ellipse(ox, oy, 240, 104, 0, 0, 7); x.ellipse(ox + 140, oy + 40, 160, 80, 0, 0, 7); x.fill(); }
      for (let i = 0; i < 46; i++) { const tt = now / 1000, px = cx + ((i * 97 + tt * (12 + (i % 4) * 6)) % (vw + 20)) - 10, py = cy + ((i * 61 + Math.sin(tt * 0.8 + i) * 24 + tt * 6) % (vh + 10)) - 5;
        x.globalAlpha = 0.3 + 0.45 * Math.abs(Math.sin(tt * 1.3 + i)); x.fillStyle = i % 3 ? "#fff2c8" : "#eaffd0"; x.fillRect(Math.round(px), Math.round(py), 2, 2); }
      x.globalAlpha = 1;
    }
    x.restore();
    grade(x, now);
    const v = view.getContext("2d"); v.imageSmoothingEnabled = smooth; if (smooth) v.imageSmoothingQuality = "low";
    v.setTransform(1, 0, 0, 1, 0, 0); v.drawImage(buf, 0, 0, vw * S * dpr, vh * S * dpr);
    drawLabels(now, cx, cy);
  }
  // ป้ายตัวหนังสือ: วาดบนชั้นบนสุด จึงคมชัดแม้อยู่ในโซนเบลอ
  function drawLabels(now, cx, cy) {
    const g = labels.getContext("2d"); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, labels.width, labels.height);
    const k = S * dpr, fs = Math.round((S >= 2 ? 13 : 12) * dpr), F = `700 ${fs}px "Noto Sans Thai", system-ui, sans-serif`;
    g.font = F; g.textAlign = "center"; g.textBaseline = "middle";
    const sx = (wx) => (wx - cx) * k, sy = (wy) => (wy - cy) * k;
    const tag = (label, wx, wy, bg, fg = "#fff") => { const X = sx(wx), Y = sy(wy); if (X < -200 || Y < -40 || X > labels.width + 200 || Y > labels.height + 40) return;
      const w = g.measureText(label).width + 14 * dpr, h = fs + 9 * dpr; g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(Math.round(X - w / 2), Math.round(Y - h / 2 + 2 * dpr), Math.round(w), Math.round(h));
      g.fillStyle = bg; g.fillRect(Math.round(X - w / 2), Math.round(Y - h / 2), Math.round(w), Math.round(h)); g.fillStyle = fg; g.fillText(label, X, Y + dpr); };
    for (const p of PLACES) {
      if (p.dock) { tag(`${p.ic} ${p.name}`, p.x * T, p.y * T - 70, near === p ? "#ffcf3a" : "rgba(20,40,24,.88)", near === p ? "#1a1420" : "#fff"); continue; }
      const ex = p.x * T - HOUSE.ax + HOUSE.emblem[0], ey = (p.y + 4) * T - HOUSE.ay + HOUSE.emblem[1];
      if (p.shop || !SIGN_FX[p.id]) { if (p.shop) { g.font = `${Math.round(18 * k)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`; g.fillText(p.ic, sx(ex), sy(ey + 1)); g.font = F; }
        tag(p.name, p.x * T + 80, (p.y + 4) * T - HOUSE.ay - 10, near === p ? "#ffcf3a" : "rgba(24,18,30,.82)", near === p ? "#1a1420" : "#fff"); continue; }
      // ชื่อบ้านเขียนลงบนแผ่นป้ายไม้ (ตามตำแหน่งป้ายที่ลอยขึ้นลง)
      const bob = reduced ? 0 : Math.round(Math.sin((now / 1000) * 1.8 + p.x) * 1.2), PX = sx(ex), PY = sy(ey + 21 + bob);
      if (PX < -120 || PY < -40 || PX > labels.width + 120 || PY > labels.height + 40) continue;
      let size = Math.max(10.5 * k, 11 * dpr); g.font = `700 ${size}px "Chakra Petch", "Kanit", "Noto Sans Thai", system-ui, sans-serif`;
      const maxW = 66 * k, tw = g.measureText(p.name).width; if (tw > maxW) { size *= maxW / tw; g.font = `700 ${size}px "Chakra Petch", "Kanit", "Noto Sans Thai", system-ui, sans-serif`; }
      g.lineJoin = "round"; g.lineWidth = Math.max(2, size * 0.24); g.strokeStyle = "#2a1406"; g.fillStyle = "rgba(0,0,0,.35)"; g.fillText(p.name, PX + dpr, PY + 2 * dpr);
      g.strokeText(p.name, PX, PY + dpr); g.fillStyle = near === p ? "#ffe066" : "#fff3d6"; g.fillText(p.name, PX, PY + dpr); g.font = F;
    }
    for (const L of LANDMARKS) tag(L.name, L.x * T, L.y * T, "rgba(20,40,24,.82)", "#fff6dc");
    const bubble = (X, Y, lines) => { const pad = 8 * dpr, lh = fs * 1.4, w = Math.max(...lines.map((l) => g.measureText(l).width)) + pad * 2, h = lines.length * lh + pad * 1.4, Lx = Math.round(X - w / 2), Tp = Math.round(Y - h - 8 * dpr);
      g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(Lx + 3 * dpr, Tp + 3 * dpr, w, h); g.fillStyle = "#1a1420"; g.fillRect(Lx - 2 * dpr, Tp - 2 * dpr, w + 4 * dpr, h + 4 * dpr); g.fillStyle = "#fffdf6"; g.fillRect(Lx, Tp, w, h);
      g.beginPath(); g.moveTo(X - 6 * dpr, Tp + h); g.lineTo(X, Tp + h + 8 * dpr); g.lineTo(X + 6 * dpr, Tp + h); g.fill();
      g.fillStyle = "#1a1420"; lines.forEach((l, i) => g.fillText(l, X, Tp + pad * 0.7 + lh * (i + 0.5))); };
    for (const n of npcs) { const X = sx(n.fx), Y = sy(n.fy - 50); if (X < -60 || Y < -40 || X > labels.width + 60 || Y > labels.height + 60) continue;
      if (n === talk) { g.font = `600 ${fs}px "Noto Sans Thai", system-ui, sans-serif`; bubble(X, Y, wrapText(g, n.tip, Math.min(240 * dpr, labels.width * 0.6))); g.font = F; }
      else { const lit = reduced ? 3 : 1 + (Math.floor(now / 400 + n.phase * 3) % 3), b = 2 * dpr, w = 28 * dpr, h = 15 * dpr, Lx = Math.round(X - w / 2), Tp = Math.round(Y - h - 6 * dpr - (reduced ? 0 : Math.sin(now / 500 + n.phase) * 2 * dpr));
        g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(Lx + b, Tp + b, w, h); g.fillStyle = "#1a1420"; g.fillRect(Lx - b, Tp - b, w + 2 * b, h + 2 * b); g.fillStyle = "#fffdf6"; g.fillRect(Lx, Tp, w, h);
        g.beginPath(); g.moveTo(X - 4 * dpr, Tp + h); g.lineTo(X, Tp + h + 5 * dpr); g.lineTo(X + 4 * dpr, Tp + h); g.fill();
        for (let d = 0; d < 3; d++) { g.fillStyle = d < lit ? "#1a1420" : "#c8c0c8"; g.fillRect(Math.round(Lx + 6 * dpr + d * 6.5 * dpr), Math.round(Tp + 6 * dpr), Math.round(3.5 * dpr), Math.round(3.5 * dpr)); } } }
    if (!talk) tag(playerName, hero.x, hero.y - 58, "rgba(91,61,245,.92)");
    if (near) tag(`กด E หรือแตะปุ่มด้านล่าง เพื่อเข้า`, near.dock ? near.x * T + 32 : near.x * T + 80, (near.dock ? near.y * T - 100 : (near.y + 4) * T - HOUSE.ay - 36), "rgba(255,255,255,.95)", "#1a1420");
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
    const house2 = PLACES.find((p) => p.dock ? wx >= p.x * T - 8 && wx < p.x * T + 80 && wy >= p.y * T - 70 && wy < (p.y + 6) * T : wx >= p.x * T && wx < (p.x + 5) * T && wy >= p.y * T - 50 && wy < (p.y + 4) * T);
    if (house2) { if (near === house2) enter(house2); else walkTo(house2.ex, house2.ey, house2); return; }
    const npc = npcs.find((n) => Math.abs(wx - n.fx) < 16 && wy > n.fy - 48 && wy < n.fy + 4);
    if (npc) { for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) { const tx = npc.x + dx, ty = npc.y + dy; if (M.inb(tx, ty) && !M.block[M.at(tx, ty)]) { walkTo(tx, ty); return; } } }
    walkTo(Math.floor(wx / T), Math.floor(wy / T));
  });
  enterBtn.addEventListener("click", () => near && enter(near));

  // ---------- ลูป ----------
  let raf = 0, last = performance.now(), visible = true;
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; }); io.observe(view);
  let perfN = 0, perfT = 0;
  const loop = (now) => { raf = requestAnimationFrame(loop); if (!visible || document.hidden) { last = now; return; } const raw = Math.max(0, (now - last) / 1000), dt = Math.min(0.05, raw); last = now;
    if (perfN < 120) { if (perfN > 20) perfT += raw; if (++perfN === 120 && perfT / 99 > 1 / 38) host.classList.add("w-lite"); }
    update(dt); render(now); };
  raf = requestAnimationFrame(loop);
  return {
    places: PLACES,
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener("resize", onResize); io.disconnect(); view.remove(); ui.remove(); },
    reachable() { const [sx, sy] = tileAt(hero.x, hero.y - 1); return PLACES.map((p) => ({ id: p.id, ok: !!findPath(M, sx, sy, p.ex, p.ey) || (sx === p.ex && sy === p.ey) })); },
    _hero: hero,
    _npcs: npcs,
    setLook(l, name) { for (const k of Object.keys(heroLook)) delete heroLook[k]; Object.assign(heroLook, l); for (const k of [...cache.keys()]) if (k.startsWith("hero")) cache.delete(k); if (name) playerName = name; },
    _walk(tx, ty) { walkTo(tx, ty); },
    walkToPlace(id) { const p = PLACES.find((x) => x.id === id); if (p) walkTo(p.ex, p.ey, p); },
  };
}
