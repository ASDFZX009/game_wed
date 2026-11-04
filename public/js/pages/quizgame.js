// 🎣 เกมตอบคำถาม: AWS Fishing (โดย NAViK3069) แสดงในกรอบใต้แถบเมนูของ EduPlay
import { html, state } from "../core.js";
import { onLeave } from "../app.js";

export function quizGame({ main }) {
  const src = state.config?.local ? "fishing/index.html" : "/fishing/index.html";
  document.body.classList.add("immersive");
  main.innerHTML = html`<section class="qg" aria-labelledby="qg-title">
    <div class="qg-bar">
      <span class="qg-ic" aria-hidden="true">🎣</span>
      <div class="qg-t"><h1 id="qg-title">EduFishing</h1><span>ตกปลา · ตอบคำถาม 9 วิชา ป.1–ม.6 · ยิ่งออกทะเลไกล คำถามยิ่งยาก</span></div>
      <button class="qg-btn" id="qgFull" type="button">⛶ เต็มจอ</button>
      <a class="qg-btn ghost" href="${src}" target="_blank" rel="noopener">เปิดในแท็บใหม่ ↗</a>
    </div>
    <iframe class="qg-frame" id="qgFrame" src="${src}" title="เกม EduFishing ตกปลาตอบคำถาม" allow="fullscreen; autoplay" allowfullscreen></iframe>
    <p class="qg-credit">ดัดแปลงจาก <a href="https://github.com/NAViK3069/Aws_fishing" target="_blank" rel="noopener">AWS Fishing</a> โดย NAViK3069 · ความคืบหน้าในเกมนี้บันทึกแยกในเบราว์เซอร์ของคุณ</p>
  </section>`.s;
  const frame = main.querySelector("#qgFrame");
  frame.addEventListener("load", () => { try { frame.contentWindow.focus(); } catch { /* ignore */ } });
  main.querySelector("#qgFull").onclick = async () => {
    try { await frame.requestFullscreen(); }
    catch { window.open(src, "_blank", "noopener"); }
  };
  onLeave(() => document.body.classList.remove("immersive"));
}
