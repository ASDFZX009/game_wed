-- ตั้งบัญชีเป็นผู้ดูแลระบบ (แอดมิน)
-- 1) รัน supabase/schema.sql ให้เรียบร้อยก่อน (รันซ้ำได้)
-- 2) สมัครบัญชีบนเว็บด้วยอีเมลที่ต้องการให้เป็นแอดมิน
-- 3) เปลี่ยนอีเมลด้านล่างเป็นอีเมลนั้น แล้วกด Run ใน Supabase → SQL Editor
insert into public.admins (user_id)
select id from auth.users where lower(email) = lower('ใส่อีเมลที่สมัครไว้ที่นี่')
on conflict (user_id) do nothing;

-- ตรวจผล: ต้องเห็นอีเมลของคุณ 1 แถว
select u.email, a.created_at as admin_since from public.admins a join auth.users u on u.id = a.user_id;

-- ถอดสิทธิ์แอดมิน (ถ้าต้องการ):
-- delete from public.admins where user_id = (select id from auth.users where lower(email) = lower('อีเมล'));
