// บัญชีผู้ใช้จริงสำหรับเวอร์ชันเล่นบนเว็บ ผ่าน Supabase (Auth + ตาราง progress)
// ตั้งค่าที่ไฟล์ cloud-config.json ข้าง index.html: { "supabaseUrl": "...", "supabaseAnonKey": "..." }
// anon key เป็นกุญแจสาธารณะโดยออกแบบ ความปลอดภัยอยู่ที่ Row Level Security (ดู supabase/schema.sql)

const SKEY = "eduplay-web:session";
let CFG = null;
let session = null; // { access_token, refresh_token, expires_at (วินาที), user }
let refreshing = null;
const listeners = new Set();

const MSG = {
  invalid_credentials: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  email_not_confirmed: "ยังไม่ได้ยืนยันอีเมล — เปิดลิงก์ในอีเมลที่เราส่งให้ก่อน (ดูในโฟลเดอร์สแปมด้วย)",
  user_already_exists: "อีเมลนี้สมัครไว้แล้ว — ลองเข้าสู่ระบบ หรือกด “ลืมรหัสผ่าน”",
  email_exists: "อีเมลนี้สมัครไว้แล้ว — ลองเข้าสู่ระบบ หรือกด “ลืมรหัสผ่าน”",
  weak_password: "รหัสผ่านง่ายเกินไป ลองให้ยาวขึ้นหรือผสมตัวเลข/ตัวอักษร",
  same_password: "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสเดิม",
  over_email_send_rate_limit: "ส่งอีเมลบ่อยเกินไป รอสักครู่แล้วลองใหม่",
  over_request_rate_limit: "ลองบ่อยเกินไป รอสักครู่แล้วลองใหม่",
  email_address_invalid: "อีเมลไม่ถูกต้อง",
  validation_failed: "ข้อมูลไม่ถูกต้อง ตรวจอีเมลและรหัสผ่านอีกครั้ง",
  signup_disabled: "ปิดรับสมัครสมาชิกใหม่อยู่",
  otp_expired: "ลิงก์ในอีเมลหมดอายุหรือถูกใช้ไปแล้ว ขอลิงก์ใหม่ได้เลย",
};
function cloudError(status, data) {
  const code = data?.error_code || data?.code || data?.error || "";
  const raw = data?.msg || data?.message || data?.error_description || "";
  let message = MSG[code];
  if (!message && /invalid login credentials/i.test(raw)) message = MSG.invalid_credentials;
  if (!message && /already registered/i.test(raw)) message = MSG.user_already_exists;
  if (!message && /email not confirmed/i.test(raw)) message = MSG.email_not_confirmed;
  if (!message && /password should be/i.test(raw)) message = MSG.weak_password;
  if (!message && status === 429) message = MSG.over_request_rate_limit;
  return Object.assign(new Error(message || `เซิร์ฟเวอร์บัญชีตอบกลับผิดพลาด (${status}${raw ? ": " + raw : ""})`), { status, code: typeof code === "string" ? code : "" });
}

function persist() { try { session ? localStorage.setItem(SKEY, JSON.stringify(session)) : localStorage.removeItem(SKEY); } catch { /* ignore */ } }
function setSession(s) {
  session = s && s.access_token ? { access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at || Math.floor(Date.now() / 1000) + (+s.expires_in || 3600), user: s.user || session?.user || null } : null;
  persist();
  listeners.forEach((fn) => { try { fn(session?.user || null); } catch { /* ignore */ } });
}
export const onAuthChange = (fn) => listeners.add(fn);
export const cloudEnabled = () => !!CFG;
// สำหรับ Realtime (เจอผู้เล่นในหมู่บ้าน): ใช้ publishable key เดียวกัน + โทเค็นผู้ใช้ถ้าเข้าสู่ระบบ
export const realtimeInfo = () => (CFG ? { url: CFG.url, key: CFG.key, token: () => session?.access_token || null } : null);
export const currentUser = () => session?.user || null;
export const displayNameOf = (u) => u?.user_metadata?.display_name || (u?.email || "").split("@")[0] || "ผู้เล่น";
export const redirectUrl = () => location.origin + location.pathname;

async function call(path, { method = "GET", body, auth = false, headers = {} } = {}) {
  if (!CFG) throw new Error("ยังไม่ได้ตั้งค่าระบบบัญชี");
  if (auth) await ensureFresh();
  const h = { apikey: CFG.key, "Content-Type": "application/json", ...headers };
  if (auth && session) h.Authorization = "Bearer " + session.access_token; // ไม่ส่ง key เป็น Bearer: ใช้ได้ทั้ง anon key แบบเดิมและ publishable key แบบใหม่
  let r;
  try { r = await fetch(CFG.url + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) }); }
  catch { throw Object.assign(new Error("เชื่อมต่อเซิร์ฟเวอร์บัญชีไม่ได้ ตรวจอินเทอร์เน็ตแล้วลองใหม่"), { status: 0, network: true }); }
  const text = await r.text();
  let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = { message: text }; }
  if (!r.ok) {
    if (auth && r.status === 401) { setSession(null); throw Object.assign(new Error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่"), { status: 401, expired: true }); }
    throw cloudError(r.status, data);
  }
  return data;
}

async function ensureFresh() {
  if (!session) throw Object.assign(new Error("กรุณาเข้าสู่ระบบ"), { status: 401 });
  if (session.expires_at - Date.now() / 1000 > 60) return;
  refreshing = refreshing || (async () => {
    try { setSession(await call("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: session.refresh_token } })); }
    catch (e) { if (!e.network) setSession(null); throw e; }
    finally { refreshing = null; }
  })();
  return refreshing;
}

/** โหลดการตั้งค่า + รับโทเคนที่แนบมากับลิงก์ในอีเมล (ยืนยันอีเมล / ตั้งรหัสผ่านใหม่) */
export async function initCloud() {
  try {
    const c = window.__CLOUD_CONFIG || await fetch("./cloud-config.json", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null));
    if (c?.supabaseUrl && c?.supabaseAnonKey && /^(https:\/\/|http:\/\/(localhost|127\.0\.0\.1)[:/])/.test(c.supabaseUrl)) CFG = { url: c.supabaseUrl.replace(/\/+$/, ""), key: c.supabaseAnonKey };
  } catch { /* ไม่มีไฟล์ตั้งค่า = โหมดเล่นในเครื่องอย่างเดียว */ }
  if (!CFG) return { enabled: false };
  try { session = JSON.parse(localStorage.getItem(SKEY) || "null"); } catch { session = null; }

  // ลิงก์จากอีเมล: #access_token=...&refresh_token=...&type=signup|recovery|magiclink  หรือ  #error=...&error_code=...
  const h = location.hash.slice(1);
  if (/(^|&)(access_token|error)=/.test(h)) {
    const q = new URLSearchParams(h);
    let result;
    if (q.get("error")) result = { error: MSG[q.get("error_code")] || q.get("error_description") || "ลิงก์ไม่ถูกต้อง" };
    else {
      setSession({ access_token: q.get("access_token"), refresh_token: q.get("refresh_token"), expires_at: +q.get("expires_at") || undefined, expires_in: q.get("expires_in") });
      try { session.user = await call("/auth/v1/user", { auth: true }); persist(); } catch { /* ใช้ต่อได้ */ }
      result = { type: q.get("type") || "signup" };
    }
    history.replaceState(null, "", location.pathname + location.search); // ไม่ให้โทเคนค้างในแถบที่อยู่/ประวัติ
    return { enabled: true, link: result };
  }
  if (session) { try { await ensureFresh(); } catch { /* ออฟไลน์: ใช้เซสชันเดิมไปก่อน */ } }
  return { enabled: true };
}

export async function signUp({ email, password, displayName }) {
  const r = await call(`/auth/v1/signup?redirect_to=${encodeURIComponent(redirectUrl())}`, { method: "POST", body: { email, password, data: { display_name: displayName } } });
  if (r?.access_token) { setSession(r); return { session: true }; }
  // ต้องยืนยันอีเมลก่อน (ถ้าอีเมลซ้ำ Supabase จะตอบแบบเดียวกันเพื่อไม่ให้เดาได้ว่ามีบัญชีหรือไม่)
  return { session: false, confirm: true };
}
export async function signIn({ email, password }) {
  setSession(await call("/auth/v1/token?grant_type=password", { method: "POST", body: { email, password } }));
}
export async function signOut() {
  try { if (session) await call("/auth/v1/logout", { method: "POST", auth: true }); } catch { /* ออกจากเครื่องนี้อยู่ดี */ }
  setSession(null);
}
export const resendConfirm = (email) => call(`/auth/v1/resend?redirect_to=${encodeURIComponent(redirectUrl())}`, { method: "POST", body: { type: "signup", email } });
export const sendReset = (email) => call(`/auth/v1/recover?redirect_to=${encodeURIComponent(redirectUrl())}`, { method: "POST", body: { email } });
export async function updatePassword(password) { const u = await call("/auth/v1/user", { method: "PUT", auth: true, body: { password } }); if (u?.id) { session.user = u; persist(); } }
export async function updateDisplayName(name) { const u = await call("/auth/v1/user", { method: "PUT", auth: true, body: { data: { display_name: name } } }); if (u?.id) { session.user = u; persist(); } }
export async function deleteAccount() { await call("/rest/v1/rpc/delete_my_account", { method: "POST", auth: true, body: {} }); setSession(null); }

// ---------- ความคืบหน้า (ตาราง progress หนึ่งแถวต่อผู้ใช้) ----------
export async function loadProgress() {
  const id = session?.user?.id;
  const rows = await call(`/rest/v1/progress?user_id=eq.${encodeURIComponent(id)}&select=state,updated_at`, { auth: true });
  return rows?.[0]?.state || null;
}
export async function saveProgress(state) {
  const u = session?.user;
  if (!u) return;
  await call("/rest/v1/progress?on_conflict=user_id", { method: "POST", auth: true, headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: { user_id: u.id, display_name: state.name, state, updated_at: new Date().toISOString() } });
}

// ---------- ผู้ดูแลระบบ (ต้องรัน supabase/schema.sql ส่วนแอดมินก่อน) ----------
export async function checkAdmin() {
  if (!session) return false;
  try { return (await call("/rest/v1/rpc/is_admin", { method: "POST", auth: true, body: {} })) === true; } catch { return false; } // ยังไม่ได้รัน SQL ส่วนแอดมิน = ไม่ใช่แอดมิน
}
export const adminListPlayers = () => call("/rest/v1/rpc/admin_list_players", { method: "POST", auth: true, body: {} });
export const adminGrant = (target, item, note) => call("/rest/v1/rpc/admin_grant_item", { method: "POST", auth: true, body: { target, item, note: note || null } });
// ของขวัญที่ยังไม่ได้รับของตัวเอง → รับแล้วทำเครื่องหมาย
export async function pendingGrants() {
  if (!session) return [];
  try { return (await call("/rest/v1/item_grants?claimed_at=is.null&select=id,item_id,note,created_at&order=id", { auth: true })) || []; } catch { return []; }
}
export async function claimGrants(ids) {
  if (!ids.length) return;
  await call(`/rest/v1/item_grants?id=in.(${ids.map(Number).join(",")})`, { method: "PATCH", auth: true, headers: { Prefer: "return=minimal" }, body: { claimed_at: new Date().toISOString() } });
}
