-- ตั้งบัญชีผู้ดูแลระบบ (แอดมิน) ของ QUIZ ODYSSEY
--
-- แนะนำ: ใช้บัญชีแอดมินแยกจากบัญชีเล่นปกติ
--   1) รัน supabase/schema.sql ให้เรียบร้อยก่อน (รันซ้ำได้)
--   2) สร้างบัญชีแอดมิน: Supabase → Authentication → Users → Add user → Create new user
--        Email:    อีเมลสำหรับแอดมิน (เช่น อีเมลจริงของคุณที่ยังไม่เคยสมัคร หรือ admin@quizodyssey.app)
--        Password: ตั้งรหัสผ่านยาว ๆ ที่เดายาก
--        ติ๊ก "Auto Confirm User" ไว้ (จะได้เข้าสู่ระบบได้ทันทีโดยไม่ต้องยืนยันอีเมล)
--   3) เปลี่ยนอีเมลด้านล่างให้ตรงกับข้อ 2 แล้วกด Run ใน SQL Editor
--   4) เข้าสู่ระบบบนเว็บด้วยอีเมล/รหัสผ่านนั้น จะเห็นเมนู 🛡️ แอดมิน
--
-- หมายเหตุ: ถ้าใช้อีเมลที่ไม่มีอยู่จริง จะกด "ลืมรหัสผ่าน" ไม่ได้ ต้องเปลี่ยนรหัสผ่านเองใน Authentication → Users

insert into public.admins (user_id)
select id from auth.users where lower(email) = lower('ใส่อีเมลบัญชีแอดมินที่นี่')
on conflict (user_id) do nothing;

-- ตรวจผล: ต้องเห็นอีเมลบัญชีแอดมิน
select u.email, a.created_at as admin_since from public.admins a join auth.users u on u.id = a.user_id;

-- ถอดสิทธิ์แอดมิน (ถ้าต้องการ):
-- delete from public.admins where user_id = (select id from auth.users where lower(email) = lower('อีเมล'));
