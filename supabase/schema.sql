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

-- สิทธิ์ผ่าน Data API: ให้ชัดเจนเอง (ใช้ได้แม้ปิด "Automatically expose new tables")
revoke all on public.progress from anon;
grant select, insert, update, delete on public.progress to authenticated;

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

-- ============================================================
-- ผู้ดูแลระบบ (แอดมิน) — รันซ้ำได้
-- ตั้งบัญชีตัวเองเป็นแอดมิน: ดูไฟล์ supabase/make-admin.sql
-- ============================================================
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated; -- แก้ไขได้จาก SQL Editor เท่านั้น

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- รายชื่อผู้เล่นทั้งหมด (เฉพาะแอดมิน)
drop function if exists public.admin_list_players();
create or replace function public.admin_list_players()
returns table (user_id uuid, email text, display_name text, xp int, coins int, items int, plays int, updated_at timestamptz, created_at timestamptz, is_admin boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'ต้องเป็นผู้ดูแลระบบ' using errcode = '42501'; end if;
  return query
    select u.id, u.email::text, coalesce(p.display_name, u.raw_user_meta_data->>'display_name'),
      coalesce((p.state->>'xp')::int, 0), coalesce((p.state->>'coins')::int, 0),
      (select count(*)::int from jsonb_object_keys(case when jsonb_typeof(p.state->'items') = 'object' then p.state->'items' else '{}'::jsonb end)),
      coalesce(case when jsonb_typeof(p.state->'plays') = 'array' then jsonb_array_length(p.state->'plays') end, 0),
      p.updated_at, u.created_at, exists (select 1 from public.admins a where a.user_id = u.id)
    from auth.users u left join public.progress p on p.user_id = u.id
    order by p.updated_at desc nulls last, u.created_at desc;
end $$;
revoke execute on function public.admin_list_players() from public, anon;
grant execute on function public.admin_list_players() to authenticated;

-- ของขวัญจากแอดมิน: แอดมินส่งผ่านฟังก์ชัน ผู้เล่นรับเองตอนเปิดเว็บครั้งถัดไป (ไม่ทับความคืบหน้าที่กำลังเล่นอยู่)
create table if not exists public.item_grants (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  item_id    text not null check (item_id ~ '^[a-z0-9-]{2,40}$'),
  note       text check (char_length(note) <= 120),
  granted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  claimed_at timestamptz
);
alter table public.item_grants enable row level security;
revoke all on public.item_grants from anon, authenticated;
grant select on public.item_grants to authenticated;
grant update (claimed_at) on public.item_grants to authenticated; -- ผู้เล่นแก้ได้แค่ "รับแล้ว"
drop policy if exists "grants: read own"  on public.item_grants;
drop policy if exists "grants: claim own" on public.item_grants;
create policy "grants: read own"  on public.item_grants for select to authenticated using ((select auth.uid()) = user_id);
create policy "grants: claim own" on public.item_grants for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.admin_grant_item(target uuid, item text, note text default null)
returns bigint language plpgsql security definer set search_path = '' as $$
declare gid bigint;
begin
  if not public.is_admin() then raise exception 'ต้องเป็นผู้ดูแลระบบ' using errcode = '42501'; end if;
  insert into public.item_grants (user_id, item_id, note, granted_by) values (target, item, nullif(trim(note), ''), (select auth.uid())) returning id into gid;
  return gid;
end $$;
revoke execute on function public.admin_grant_item(uuid, text, text) from public, anon;
grant execute on function public.admin_grant_item(uuid, text, text) to authenticated;
