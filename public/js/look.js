// 🎨 ตัวละครของผู้เล่น (แต่งเองที่หน้าเริ่มเกม) — เก็บในเครื่อง ใช้ในหมู่บ้าน ร้านค้า และกระดานภารกิจ
const KEY = "qo:look";

export const OPT = {
  skin: [["โทนอ่อน", "#f6d6b8"], ["โทนกลาง", "#f2c49a"], ["โทนน้ำผึ้ง", "#d9a074"], ["โทนแทน", "#a8704a"], ["โทนเข้ม", "#6e4630"]],
  style: [["ผมสั้น", "short"], ["ผมยาว", "long"]],
  hair: [["ดำ", "#1e1a18"], ["น้ำตาลเข้ม", "#3a2a20"], ["น้ำตาลทอง", "#8a5a2a"], ["บลอนด์", "#e0b860"], ["แดงอิฐ", "#b0402a"], ["ชมพู", "#e870a0"], ["ฟ้า", "#4a8ad8"], ["เงิน", "#d8d4cc"]],
  head: [["ไม่ใส่", "none"], ["หมวกปีกกว้าง", "hat"], ["หมวกแก๊ป", "cap"]],
  headColor: [["ฟางข้าว", "#e0bc66"], ["น้ำตาล", "#7a4a2a"], ["กรมท่า", "#2e4a6a"], ["แดง", "#b8382c"], ["ม่วง", "#5a3a9a"], ["เขียวป่า", "#3c7a34"]],
  outfit: [["เสื้อ + กางเกง", "pants"], ["ชุดกระโปรง", "dress"], ["ผ้ากันเปื้อน", "apron"]],
  shirt: [["ม่วงคราม", "#5b3df5"], ["แดง", "#c8402e"], ["ส้ม", "#e0a030"], ["เขียวใบไม้", "#5f8f3a"], ["ฟ้า", "#3a7ab8"], ["ชมพู", "#f0a6c0"], ["ม่วง", "#7d5a9a"], ["ขาวครีม", "#efe2c4"], ["ดำ", "#33333c"]],
  pants: [["กรมท่า", "#2a3550"], ["น้ำตาล", "#6a4a2a"], ["เทาเข้ม", "#3a3a48"], ["เขียวมะกอก", "#4a5a2a"], ["ชมพูกุหลาบ", "#d8608a"], ["ฟ้าคราม", "#2a5a8a"]],
  beard: [["ไม่มี", "no"], ["มีเครา", "yes"]],
};
export const ROWS = [["skin", "สีผิว"], ["style", "ทรงผม"], ["hair", "สีผม"], ["head", "หมวก"], ["headColor", "สีหมวก"], ["outfit", "ชุด"], ["shirt", "สีเสื้อ"], ["pants", "สีกางเกง/กระโปรง"], ["beard", "เครา"]];
export const DEFAULT = { skin: 1, style: 0, hair: 1, head: 0, headColor: 0, outfit: 0, shirt: 0, pants: 0, beard: 0 };

// แปลงตัวเลือก → look ที่ charFrame เข้าใจ
export function toLook(p) {
  const v = (k) => OPT[k][((p[k] ?? DEFAULT[k]) + OPT[k].length) % OPT[k].length][1];
  const L = { skin: v("skin"), hair: v("hair"), shirt: v("shirt"), pants: v("pants") };
  if (v("style") === "long") L.long = true;
  if (v("head") === "hat") { L.hat = v("headColor"); L.band = "#a03a30"; } else if (v("head") === "cap") L.cap = v("headColor");
  if (v("outfit") === "dress") L.dress = v("pants"); else if (v("outfit") === "apron") L.apron = "#f2ead6";
  if (v("beard") === "yes") L.beard = v("hair");
  return L;
}
export function loadProfile() { try { const o = JSON.parse(localStorage.getItem(KEY)); return o && o.parts ? o : null; } catch { return null; } }
export function saveProfile(name, parts) { try { localStorage.setItem(KEY, JSON.stringify({ name: String(name || "").trim().slice(0, 16), parts })); } catch { /* ignore */ } }
export function myLook(fallbackShirt) { const p = loadProfile(); return p ? toLook(p.parts) : { shirt: fallbackShirt || "#5b3df5", pants: "#2a3550", hair: "#3a2a20" }; }
export function randomParts() { const o = {}; for (const [k] of ROWS) o[k] = Math.floor(Math.random() * OPT[k].length); if (Math.random() < 0.75) o.beard = 0; return o; }
