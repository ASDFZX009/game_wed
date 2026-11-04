// จำลองการตอบคำถามตอนปลาติดเบ็ด: ผู้เล่น ม.2 ทั่วไป
global.window = {}; const base = require('path').join(__dirname, '../../public/fishing/js/') + '/';
require(base + 'questions.js'); require(base + 'data.js'); require(base + 'fish-extra.js');
const Q = window.QUESTIONS, D = window.DATA;
const ACC = { 1: .95, 2: .88, 3: .78, 4: .62, 5: .48 };            // ความแม่นตามระดับคำถาม (4 ตัวเลือก)
const accOf = (q) => q.tf !== undefined ? Math.min(.98, .5 + ACC[q.lv] * .5 + .05) : ACC[q.lv];
const chars = (q) => q.q.length + (q.c ? q.c.join('').length : 6);
const thinkTime = (q) => (q.tf !== undefined ? 3.5 : 5) + chars(q) * 0.085; // วินาทีที่ใช้อ่านและคิด (คนอ่านไทยทั่วไป)
const rnd = (a, b) => a + Math.random() * (b - a);
function pick(star, zone) {
  const rule = D.STAR_RULES[star]; const tf = rule.type === 'tf' ? true : rule.type === 'mix' ? Math.random() < .5 : false;
  const zl = zone + 1, lv = (zl > 1 && star <= 2 && Math.random() < .25) ? zl - 1 : zl;
  let pool = Q.filter((q) => q.lv === lv && (tf ? q.tf !== undefined : !!q.c)); if (!pool.length) pool = Q.filter((q) => q.lv <= zl && (tf ? q.tf !== undefined : !!q.c));
  return pool[Math.floor(Math.random() * pool.length)];
}
// cfg: {timeFor(q,star,n), pen(star), gain(star,n), rules}
function trial(star, zone, cfg, up = { rod: 0, line: 0, book: 0 }) {
  const rule = cfg.rules[star]; let n = rule.n; if (star >= 3) n = Math.max(Math.ceil(rule.n / 2), rule.n - up.book);
  let g = 1, got = 0;
  while (got < n) {
    const q = pick(star, zone); const T = cfg.timeFor(q, star, n, rule) / (1 - 0.12 * up.rod); // วินาทีกว่าเกจจะหมด 1 ข้อ (สัดส่วน 1/n ของเกจ)
    const t = thinkTime(q) * rnd(.75, 1.35);
    g -= t / (T * n);                     // เกจลดระหว่างคิด
    if (g <= 0) return false;
    if (Math.random() < accOf(q)) { got++; g = Math.min(1, g + cfg.gain(star, n)); } else g -= cfg.pen(star, rule) * (1 - 0.15 * up.line);
    if (g <= 0) return false;
  }
  return true;
}
const OLD = { rules: D.STAR_RULES, timeFor: (q, s, n, r) => r.sec / n, pen: (s, r) => r.pen, gain: () => 0.12 };
module.exports = { trial, OLD, D, Q, thinkTime, chars };
if (require.main === module) {
  const N = 4000;
  for (const up of [{ rod: 0, line: 0, book: 0 }, { rod: 2, line: 2, book: 1 }]) {
    console.log(`\n=== ระบบเดิม · อัปเกรด คันเบ็ด ${up.rod} สายเบ็ด ${up.line} ตำรา ${up.book} ===`);
    for (let z = 0; z < 5; z++) { const row = []; for (let s = 1; s <= 5; s++) { let ok = 0; for (let i = 0; i < N; i++) ok += trial(s, z, OLD, up); row.push(`${s}★ ${Math.round(ok / N * 100)}%`); }
      console.log(`ทะเล ${z + 1}: ${row.join('  ')}`); }
  }
}
