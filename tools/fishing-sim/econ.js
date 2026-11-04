const { trial, D, Q } = require('./quizsim.js');
const cfg = { rules: D.STAR_RULES, timeFor: (q, s) => D.questionTime(q, s), pen: (s) => D.QUIZ_BAL.pen[s], gain: () => D.QUIZ_BAL.gain };
const UP = [{ rod: 0, line: 0, book: 0, hp: 0, storage: 0 }, { rod: 1, line: 1, book: 0, hp: 1, storage: 1 }, { rod: 2, line: 1, book: 1, hp: 2, storage: 2 }, { rod: 3, line: 2, book: 1, hp: 3, storage: 4 }, { rod: 3, line: 3, book: 2, hp: 4, storage: 5 }];
const cells = (f) => f.shape.join('').replace(/\./g, '').length;
const sum = (a) => a.reduce((x, y) => x + y, 0);
const costTo = (lv, id) => sum(D.UPGRADES.find((u) => u.id === id).cost.slice(0, lv));
console.log('ทะเล | อัตราจับได้รวม | เงินต่อปลาที่จับได้ | ช่องต่อตัว | ปลาต่อรอบ | เงินต่อรอบ | เงินต่อนาที | ค่าอัปเกรดจนถึงทะเลถัดไป | จำนวนรอบที่ต้องเล่น');
let prevSpend = 0;
for (let z = 0; z < 5; z++) {
  const Z = D.ZONES[z], up = UP[z], w = Z.starW, tot = sum(w);
  let ev = 0, pOk = 0, cellAvg = 0, qTime = 0;
  for (let s = 1; s <= 5; s++) { if (!w[s - 1]) continue; const pw = w[s - 1] / tot;
    let pool = D.FISH.filter((f) => f.star === s && f.z[0] <= z && f.z[1] >= z); if (!pool.length) pool = D.FISH.filter((f) => f.star === s);
    let ok = 0; const N = 1500; for (let i = 0; i < N; i++) ok += trial(s, z, cfg, up); const ps = ok / N;
    const val = sum(pool.map((f) => f.val)) / pool.length * Z.mul, c = sum(pool.map(cells)) / pool.length;
    ev += pw * ps * val; pOk += pw * ps; cellAvg += pw * ps * c;
    const n = s >= 3 ? Math.max(Math.ceil(D.STAR_RULES[s].n / 2), D.STAR_RULES[s].n - up.book) : D.STAR_RULES[s].n; qTime += pw * n * 11; }
  const perCatch = ev / pOk, cellPer = cellAvg / pOk;
  const cycle = 10 + qTime, hpPerCast = (Z.drain + 0.25 * Z.dmg) * 10 + Z.drain * D.QUIZ_BAL.seaDrainDuringQuiz * qTime; // วินาทีต่อการเหวี่ยง 1 ครั้ง (เหวี่ยง รอ ดึง จัดกระเป๋า + ตอบคำถาม)
  const hp = 100 + 25 * up.hp, drain = Z.drain * (1 - 0) + 0.25 * Z.dmg; // + ความเสียหายเฉลี่ยจากอีเวนต์ (มีไอเท็มบางส่วน)
  const slots = D.STORAGE[up.storage] * 0.85; // จัดกระเป๋าไม่เต็ม 100%
  const fishBag = slots / cellPer, castsHP = (hp * 0.8 + 30 * (z + 1)) / hpPerCast, casts = Math.min(fishBag / pOk, castsHP);
  const trip = casts * ev, perMin = ev / cycle * 60;
  const next = UP[Math.min(4, z + 1)]; const spendNext = costTo(z + 1 <= 4 ? z + 1 : 4, 'boat') + ['hp', 'storage', 'rod', 'line', 'book'].reduce((a, id) => a + costTo(next[id], id), 0);
  const need = Math.max(0, spendNext - prevSpend); prevSpend = spendNext;
  console.log(`${z + 1} ${Z.name.padEnd(14)} | ${Math.round(pOk * 100)}% | ${Math.round(perCatch)} | ${cellPer.toFixed(1)} | ${Math.round(casts * pOk)} (${casts === castsHP ? 'เลือดหมดก่อน' : 'กระเป๋าเต็ม'}) | ${Math.round(trip)} | ${Math.round(perMin)} | ${z < 4 ? need : '-'} | ${z < 4 ? (need / trip).toFixed(1) : '-'}`);
}
