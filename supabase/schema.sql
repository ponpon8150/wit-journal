-- 唯旅誌｜WIT JOURNAL — Supabase 資料庫結構
-- 使用方式：登入 https://supabase.com/dashboard → 開你的專案 → 左側選單「SQL Editor」
-- → New query → 貼上整份檔案 → Run。只需要執行一次。

-- ------------------------------------------------------------------
-- 資料表
-- ------------------------------------------------------------------

create table if not exists trips (
  code text primary key,
  name text not null,
  base_currency text not null default 'TWD',
  start_date date,
  day_count int not null default 0,
  rates jsonb not null default '{}'::jsonb,
  rate_updated_at jsonb not null default '{}'::jsonb,
  last_currency text,
  final_settlement jsonb,
  created_at timestamptz not null default now()
);

-- 注意：id / payer_id / created_by / from_member / to_member 都用 text 而不是 uuid。
-- 這些 id 一律由瀏覽器端的 uid() 產生（見 src/lib/helpers.js）：現代瀏覽器會用
-- crypto.randomUUID()，但少數舊瀏覽器（例如較舊的 Android WebView、非 HTTPS
-- 環境）不支援，會退回用時間戳記+亂數組成的字串。如果欄位型別是 uuid，遇到
-- 這種退回格式的 id 就會整筆寫入失敗，所以這裡統一用 text，兼容兩種格式。
create table if not exists members (
  id text primary key,
  trip_code text not null references trips(code) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id text primary key,
  trip_code text not null references trips(code) on delete cascade,
  title text not null,
  category text not null default 'other',
  currency text not null,
  amount numeric not null,
  rate numeric not null default 1,
  amount_base numeric not null,
  payer_id text not null,
  split_type text not null default 'equal',
  participants jsonb not null default '[]'::jsonb,
  photo_url text,
  note text,
  day_id text not null default 'pre',
  occurred_at timestamptz not null default now(),
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists settlements (
  id text primary key,
  trip_code text not null references trips(code) on delete cascade,
  from_member text not null,
  to_member text not null,
  amount numeric not null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_members_trip on members(trip_code);
create index if not exists idx_expenses_trip on expenses(trip_code);
create index if not exists idx_settlements_trip on settlements(trip_code);

-- ------------------------------------------------------------------
-- 權限模型說明
-- 這個 App 沒有帳號登入機制：只要知道「旅程代碼」就能讀寫該旅程的資料
-- （跟原本設計一致）。以下設定讓瀏覽器可以用 anon key 直接讀寫，
-- 但 App 本身只會用代碼查詢，不會、也無法列出「所有旅程」。
-- 如果之後想要更嚴謹的隱私控制，可以再加上 Supabase Auth。
-- ------------------------------------------------------------------

alter table trips enable row level security;
alter table members enable row level security;
alter table expenses enable row level security;
alter table settlements enable row level security;

drop policy if exists "anon full access" on trips;
create policy "anon full access" on trips for all using (true) with check (true);

drop policy if exists "anon full access" on members;
create policy "anon full access" on members for all using (true) with check (true);

drop policy if exists "anon full access" on expenses;
create policy "anon full access" on expenses for all using (true) with check (true);

drop policy if exists "anon full access" on settlements;
create policy "anon full access" on settlements for all using (true) with check (true);

-- ------------------------------------------------------------------
-- 即時同步：讓其他裝置能即時收到新增/修改/刪除
-- ------------------------------------------------------------------
alter publication supabase_realtime add table trips, members, expenses, settlements;

-- ------------------------------------------------------------------
-- 收據照片儲存空間（Storage bucket）
-- ------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

drop policy if exists "anon manage receipts" on storage.objects;
create policy "anon manage receipts" on storage.objects for all
  using (bucket_id = 'receipts') with check (bucket_id = 'receipts');
