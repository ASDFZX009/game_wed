// 👥 เจอผู้เล่นคนอื่นในหมู่บ้าน — ผ่าน Supabase Realtime (ช่อง broadcast สาธารณะ ไม่เก็บอะไรลงฐานข้อมูล)
// ส่งเฉพาะ: ชื่อที่แสดง (≤16 ตัว) · ชุดตัวละคร (เลขดัชนีตัวเลือก) · ตำแหน่ง/ทิศ · อีโมตจากรายการสำเร็จรูป
// ไม่มีแชตพิมพ์อิสระ (ปลอดภัยสำหรับเด็ก) · ไม่ส่งอีเมล/ไอดีบัญชี — ใช้ไอดีสุ่มต่อแท็บ
export const EMOTES = [
  ["👋", "สวัสดี!"], ["😄", "ยินดีที่ได้รู้จัก"], ["⭐", "เก่งมาก!"], ["🤝", "ไปผจญภัยด้วยกันไหม?"],
  ["⚔️", "ไปปราบบอสกัน!"], ["🎉", "เย้!"], ["👍", "โอเค!"], ["👀", "ตามมาทางนี้"],
];
const TOPIC = "realtime:qo-village-v1";
const clean = (s) => String(s || "").replace(/[\u0000-\u001f\u007f<>]/g, "").trim().slice(0, 16) || "นักผจญภัย";
const okNum = (v, lo, hi) => typeof v === "number" && isFinite(v) && v >= lo && v <= hi;

export function myNetId() {
  try { let id = sessionStorage.getItem("qo:mpid"); if (!id) { id = Math.random().toString(36).slice(2, 10); sessionStorage.setItem("qo:mpid", id); } return id; }
  catch { return Math.random().toString(36).slice(2, 10); }
}

/**
 * เชื่อมต่อหมู่บ้านออนไลน์
 * @param {{url:string,key:string,token?:()=>string|null}} rt  ค่าจาก cloud-config
 * @param {{me:()=>{x:number,y:number,dir:number,moving:boolean}, profile:()=>{name:string,parts:object|null}, onPeers:(m:Map)=>void, onEmote:(id:string,e:number)=>void, onStatus:(s:string)=>void, bounds:{w:number,h:number}}} o
 */
export function joinVillage(rt, o) {
  const id = myNetId(), peers = new Map();
  let ws = null, ref = 0, joinRef = null, hb = 0, tick = 0, alive = true, backoff = 1000, joined = false, lastSent = null, lastSentAt = 0, status = "";
  const setStatus = (s) => { if (s !== status) { status = s; o.onStatus?.(s); } };
  const send = (topic, event, payload) => { if (ws?.readyState !== 1) return; ws.send(JSON.stringify({ topic, event, payload, ref: String(++ref), join_ref: topic === TOPIC ? joinRef : undefined })); };
  const cast = (event, payload) => joined && send(TOPIC, "broadcast", { type: "broadcast", event, payload });

  function hello(kind = "s") {
    const m = o.me(), p = o.profile();
    cast("p", { i: id, k: kind, n: clean(p.name), l: p.parts || null, x: Math.round(m.x), y: Math.round(m.y), d: m.dir | 0, m: m.moving ? 1 : 0 });
    lastSent = { x: m.x, y: m.y, d: m.dir, mv: m.moving }; lastSentAt = performance.now();
  }
  function onMsg(ev) {
    let m; try { m = JSON.parse(ev.data); } catch { return; }
    if (m.topic !== TOPIC) return;
    if (m.event === "phx_reply" && m.ref === joinRef) {
      if (m.payload?.status === "ok") { joined = true; backoff = 1000; setStatus("online"); hello("j"); } else setStatus("error");
      return;
    }
    if (m.event !== "broadcast" || !m.payload) return;
    const ev2 = m.payload.event, d = m.payload.payload || {};
    if (typeof d.i !== "string" || d.i.length > 12 || d.i === id) return;
    if (ev2 === "bye") { if (peers.delete(d.i)) o.onPeers?.(peers); return; }
    if (ev2 === "e") { if (peers.has(d.i) && Number.isInteger(d.e) && d.e >= 0 && d.e < EMOTES.length) o.onEmote?.(d.i, d.e); return; }
    if (ev2 !== "p" || !okNum(d.x, 0, o.bounds.w) || !okNum(d.y, 0, o.bounds.h)) return;
    let p = peers.get(d.i); const isNew = !p;
    if (!p) { if (peers.size >= 40) return; p = { id: d.i, x: d.x, y: d.y, rx: d.x, ry: d.y }; peers.set(d.i, p); }
    Object.assign(p, { name: clean(d.n), parts: d.l && typeof d.l === "object" ? d.l : null, tx: d.x, ty: d.y, dir: okNum(d.d, 0, 3) ? d.d : 0, moving: !!d.m, seen: performance.now() });
    if (Math.hypot(p.rx - d.x, p.ry - d.y) > 400) { p.rx = d.x; p.ry = d.y; } // ไกลเกิน (วาร์ป) → ย้ายทันที
    if (isNew) { o.onPeers?.(peers); if (d.k === "j") hello("s"); } // คนใหม่เข้ามา → ตอบให้เห็นเราทันที
  }
  function connect() {
    if (!alive) return; setStatus("connecting");
    const u = rt.url.replace(/^http/, "ws").replace(/\/$/, "") + `/realtime/v1/websocket?apikey=${encodeURIComponent(rt.key)}&vsn=1.0.0`;
    try { ws = new WebSocket(u); } catch { return retry(); }
    ws.onopen = () => { joinRef = String(++ref); const token = rt.token?.();
      ws.send(JSON.stringify({ topic: TOPIC, event: "phx_join", ref: joinRef, join_ref: joinRef, payload: { config: { broadcast: { self: false, ack: false }, presence: { key: "" }, postgres_changes: [], private: false }, ...(token ? { access_token: token } : {}) } }));
      clearInterval(hb); hb = setInterval(() => send("phoenix", "heartbeat", {}), 25000); };
    ws.onmessage = onMsg;
    ws.onclose = () => { joined = false; clearInterval(hb); if (alive) retry(); };
    ws.onerror = () => {};
  }
  function retry() { setStatus("offline"); setTimeout(connect, backoff); backoff = Math.min(30000, backoff * 2); }

  // ส่งตำแหน่ง: ขณะเดิน ≤ 5 ครั้ง/วินาที · หยุดแล้วส่งทุก 4 วินาทีเพื่อบอกว่ายังอยู่ · ไล่คนที่เงียบเกิน 10 วินาทีออก
  tick = setInterval(() => {
    if (!joined || document.hidden) return; const m = o.me(), now = performance.now(); // แท็บถูกซ่อน = พักการส่ง (คนอื่นจะไม่เห็นเราจนกว่าจะกลับมา)
    const changed = !lastSent || Math.hypot(m.x - lastSent.x, m.y - lastSent.y) > 3 || m.dir !== lastSent.d || m.moving !== lastSent.mv;
    if ((changed && now - lastSentAt > 200) || now - lastSentAt > 4000) hello("s");
    let gone = false; for (const [k, p] of peers) if (now - p.seen > 10000) { peers.delete(k); gone = true; }
    if (gone) o.onPeers?.(peers);
  }, 100);
  // ขยับตัวละครของคนอื่นแบบนุ่มนวล (เรียกทุกเฟรม)
  function step(dt) { const k = 1 - Math.pow(0.0005, dt); for (const p of peers.values()) { p.rx += (p.tx - p.rx) * k; p.ry += (p.ty - p.ry) * k; p.walking = Math.hypot(p.tx - p.rx, p.ty - p.ry) > 1.5 || p.moving; } }
  const onHide = () => { if (document.hidden) cast("bye", { i: id }); else if (joined) hello("j"); };
  document.addEventListener("visibilitychange", onHide);
  connect();
  return {
    peers, step, id,
    emote(e) { cast("e", { i: id, e }); },
    get status() { return status; },
    close() { alive = false; document.removeEventListener("visibilitychange", onHide); try { cast("bye", { i: id }); send(TOPIC, "phx_leave", {}); } catch { /* ignore */ } clearInterval(tick); clearInterval(hb); setTimeout(() => ws?.close(), 50); },
  };
}
