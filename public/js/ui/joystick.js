// 🕹️ จอยเดินแบบลอย (มือถือ/แท็บเล็ต): ไม่มีปุ่มค้างบนจอ — แตะค้างตรงไหนก็ได้ จอยจะโผล่ใต้นิ้ว
// ลากนิ้วเพื่อเดิน (ลากไกลแรงขึ้น) ยกนิ้วแล้วจอยหายไป · แตะสั้น ๆ ไม่ลาก = แตะปกติ (เช่น แตะบ้านเพื่อเดินไปเข้า)
// ใช้กับนิ้ว/ปากกาเท่านั้น เมาส์ยังคลิกเดินแบบเดิม
const R = 54; // ระยะที่ปุ่มกลางเลื่อนได้ (px)
const DEAD = 0.18; // ลากน้อยกว่านี้ยังไม่เดิน กันตัวละครขยับเองตอนแค่แตะ

export function attachJoystick(target, { layer = target.parentElement, enabled = () => true, onTap = null } = {}) {
  const st = { x: 0, y: 0, on: false, touch: false };
  const el = document.createElement("div");
  el.className = "joy"; el.hidden = true; el.setAttribute("aria-hidden", "true");
  el.innerHTML = '<i class="joy-k"></i>';
  layer.appendChild(el);
  const knob = el.firstChild;
  let id = null, bx = 0, by = 0, t0 = 0, moved = false, sx = 0, sy = 0;
  const local = (e) => { const r = layer.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const place = () => { el.style.transform = `translate(${bx - R - 10}px, ${by - R - 10}px)`; };
  const reset = () => { id = null; st.x = st.y = 0; st.on = false; el.hidden = true; el.classList.remove("go"); knob.style.transform = ""; };

  const down = (e) => {
    if (e.pointerType === "mouse") { st.touch = false; return; }
    st.touch = true;
    if (id !== null || !enabled()) return;
    id = e.pointerId; t0 = performance.now(); moved = false; sx = e.clientX; sy = e.clientY;
    [bx, by] = local(e); place(); el.hidden = false;
    try { target.setPointerCapture(id); } catch { /* ignore */ }
    e.preventDefault();
  };
  const move = (e) => {
    if (e.pointerId !== id) return;
    if (!enabled()) { reset(); return; }
    const [x, y] = local(e); let dx = x - bx, dy = y - by, d = Math.hypot(dx, dy);
    if (Math.hypot(e.clientX - sx, e.clientY - sy) > 10) moved = true;
    // ลากเลยขอบ: ฐานจอยเลื่อนตามนิ้ว (ไม่ต้องยกนิ้วมาตั้งใหม่)
    if (d > R * 1.35) { const k = (d - R * 1.35) / d; bx += dx * k; by += dy * k; place(); dx = x - bx; dy = y - by; d = Math.hypot(dx, dy); }
    const c = Math.min(d, R), nx = d ? (dx / d) * c : 0, ny = d ? (dy / d) * c : 0;
    knob.style.transform = `translate(${nx}px, ${ny}px)`;
    const m = c / R; st.on = m > DEAD; st.x = st.on ? nx / R : 0; st.y = st.on ? ny / R : 0;
    el.classList.toggle("go", st.on);
    e.preventDefault();
  };
  const up = (e) => {
    if (e.pointerId !== id) return;
    const tap = !moved && performance.now() - t0 < 350;
    reset();
    if (tap && e.type === "pointerup") onTap?.(e);
  };
  target.addEventListener("pointerdown", down);
  target.addEventListener("pointermove", move);
  target.addEventListener("pointerup", up);
  target.addEventListener("pointercancel", up);
  target.addEventListener("lostpointercapture", up);
  return {
    state: st,
    reset,
    destroy() { reset(); el.remove(); target.removeEventListener("pointerdown", down); target.removeEventListener("pointermove", move); target.removeEventListener("pointerup", up); target.removeEventListener("pointercancel", up); target.removeEventListener("lostpointercapture", up); },
  };
}
