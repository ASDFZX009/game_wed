-- EduPlay เวอร์ชันเล่นบนเว็บ: ตารางเก็บความคืบหน้าผู้เล่น (1 แถวต่อ 1 บัญชี)
-- วิธีใช้: Supabase → SQL Editor → New query → วางทั้งไฟล์นี้ → Run (รันซ้ำได้ ไม่พัง)

create table if not exists public.progress (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  state        jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now()
);

-- กันข้อมูลใหญ่ผิดปกติ (ความคืบหน้าปกติไม่เกิน ~100 KB)
alter table public.progress drop constraint if exists progress_state_size;
alter table public.progress add constraint progress_state_size check (pg_column_size(state) < 512000);

-- Row Level Security: แต่ละคนอ่าน/เขียนได้เฉพาะแถวของตัวเอง
alter table public.progress enable row level security;
drop policy if exists "progress: read own"   on public.progress;
drop policy if exists "progress: insert own" on public.progress;
drop policy if exists "progress: update own" on public.progress;
drop policy if exists "progress: delete own" on public.progress;
create policy "progress: read own"   on public.progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "progress: insert own" on public.progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "progress: update own" on public.progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "progress: delete own" on public.progress for delete to authenticated using ((select auth.uid()) = user_id);

-- ให้ผู้ใช้ลบบัญชีตัวเองได้จากหน้าตั้งค่า (ลบความคืบหน้าตามไปด้วยผ่าน on delete cascade)
create or replace function public.delete_my_account()
returns void language sql security definer set search_path = '' as $$
  delete from auth.users where id = (select auth.uid());
$$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
