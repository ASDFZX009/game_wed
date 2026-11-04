const { trial, OLD, D } = require('./quizsim.js');
const UP = [{ rod: 0, line: 0, book: 0 }, { rod: 1, line: 1, book: 0 }, { rod: 2, line: 1, book: 1 }, { rod: 3, line: 2, book: 1 }, { rod: 3, line: 3, book: 2 }];
const NONE = { rod: 0, line: 0, book: 0 };
const est = (q) => (q.tf !== undefined ? 5 : 7) + (q.q.length + (q.c ? q.c.join('').length : 6)) * 0.09; // เวลาที่เกมให้ต่อข้อ (ประมาณจากความยาว)
function make(P) { return { rules: D.STAR_RULES, timeFor: (q, s) => est(q) * P.tm[s], pen: (s) => P.pen[s], gain: () => P.gain }; }
function table(cfg, label, N = 3000) {
  console.log(`\n=== ${label} ===`);
  for (const [name, upf] of [['ไม่อัปเกรด', () => NONE], ['อัปเกรดตามปกติของทะเลนั้น', (z) => UP[z]]]) {
    console.log(' ' + name);
    for (let z = 0; z < 5; z++) { const row = []; for (let s = 1; s <= 5; s++) { let ok = 0; for (let i = 0; i < N; i++) ok += trial(s, z, cfg, upf(z)); row.push(`${s}★ ${String(Math.round(ok / N * 100)).padStart(3)}%`); } console.log(`  ทะเล ${z + 1}: ${row.join('  ')}`); }
  }
}
const P = JSON.parse(process.argv[2] || '{"tm":{"1":1.0,"2":1.0,"3":0.95,"4":0.9,"5":0.85},"pen":{"1":0.3,"2":0.3,"3":0.3,"4":0.3,"5":0.3},"gain":0.12}');
if (process.argv[3] === 'old') table(OLD, 'ระบบเดิม'); 
table(make(P), 'ระบบใหม่ ' + JSON.stringify(P));
