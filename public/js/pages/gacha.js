// ✨ ประตูอัญเชิญ: หน้าอัญเชิญ (gacha/index.html) แสดงในกรอบ ส่วนการสุ่มจริงทำที่เกมหลัก (API) แล้วส่งผลไปให้กรอบเล่นเอฟเฟกต์
import { api, html, state, toast } from "../core.js";
import { onLeave, refreshMe, go } from "../app.js";
import { gachaBase, myGacha, needsStarter } from "../gacha-client.js";
import { pickStarter, gachaTips } from "../tutorial.js";

export async function gachaPage({ main, query }) {
  if (!myGacha()) {
    main.innerHTML = html`<div class="card center narrow" style="padding:30px"><div style="font-size:3rem">✨</div><h1>ประตูอัญเชิญ</h1>
      <p class="muted">ระบบอัญเชิญตัวละครมีในเวอร์ชันเล่นบนเว็บ</p><a class="btn" href="/">กลับหน้าแรก</a></div>`.s;
    return;
  }
  document.body.classList.add("immersive");
  main.innerHTML = html`<section class="gc" aria-labelledby="gc-title"><h1 id="gc-title" class="sr-only">ประตูอัญเชิญ</h1>
    <iframe class="gc-frame" id="gcFrame" src="${gachaBase()}index.html" title="ประตูอัญเชิญตัวละคร" allow="autoplay"></iframe></section>`.s;
  const frame = main.querySelector("#gcFrame");
  let alive = true;
  const send = (m) => { try { frame.contentWindow?.postMessage({ qo: "gacha", ...m }, "*"); } catch { /* ignore */ } };
  const sendState = () => send({ type: "state", g: myGacha() });
  let hello = false;
  async function onMsg(e) {
    const m = e.data; if (!alive || !m || m.qo !== "gacha" || e.source !== frame.contentWindow) return;
    const reply = (data) => send({ rid: m.rid, ...data });
    try {
      if (m.type === "hello") {
        sendState();
        if (!hello) { hello = true;
          if (needsStarter()) { await pickStarter(); sendState(); }
          await gachaTips({ force: query?.get("tips") === "1" }); frame.focus(); }
      } else if (m.type === "pull") {
        const r = await api("/api/gacha/pull", { method: "POST", body: { n: m.n === 10 ? 10 : 1, ticket: !!m.ticket } });
        reply({ type: "pulled", res: r.res, g: r.gacha }); refreshMe().catch(() => {});
      } else if (m.type === "party") {
        const g = await api("/api/gacha/party", { method: "POST", body: { id: m.id } });
        reply({ type: "ok", g }); refreshMe().catch(() => {});
      } else if (m.type === "earn") go("/");
      else if (m.type === "help") { await gachaTips({ force: true }); frame.focus(); }
      else if (m.type === "closed") refreshMe().catch(() => {});
    } catch (err) { if (m.rid) reply({ type: "error", error: err.message }); else toast(err.message, "bad"); }
  }
  addEventListener("message", onMsg);
  onLeave(() => { alive = false; removeEventListener("message", onMsg); document.body.classList.remove("immersive"); });
}
