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

-- 「旅遊幣別」：本國幣別（base_currency）以外，用來在總覽頁切換顯示的第二種幣別。
-- 用 add column if not exists，重複執行這份 SQL 或是舊資料庫升級都不會出錯。
alter table trips add column if not exists travel_currency text;

-- 「最後編輯者」：花費卡片上顯示「XX 新增/編輯此費用」用。
-- updated_by / updated_at 只在被編輯過後才會有值；一直沒被編輯過就維持 null，
-- 畫面上就會改顯示 created_by（建立者）。
alter table expenses add column if not exists updated_by text;
alter table expenses add column if not exists updated_at timestamptz;

-- 花費的完整編輯歷史紀錄：每次新增或編輯都會加一筆，用來在卡片上點開「查看紀錄」。
create table if not exists expense_edits (
  id text primary key,
  trip_code text not null references trips(code) on delete cascade,
  expense_id text not null references expenses(id) on delete cascade,
  member_id text not null,
  action text not null default 'edited', -- 'created' 或 'edited'
  occurred_at timestamptz not null default now()
);

create index if not exists idx_members_trip on members(trip_code);
create index if not exists idx_expenses_trip on expenses(trip_code);
create index if not exists idx_settlements_trip on settlements(trip_code);
create index if not exists idx_expense_edits_expense on expense_edits(expense_id);

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
alter table expense_edits enable row level security;

drop policy if exists "anon full access" on trips;
create policy "anon full access" on trips for all using (true) with check (true);

drop policy if exists "anon full access" on members;
create policy "anon full access" on members for all using (true) with check (true);

drop policy if exists "anon full access" on expenses;
create policy "anon full access" on expenses for all using (true) with check (true);

drop policy if exists "anon full access" on settlements;
create policy "anon full access" on settlements for all using (true) with check (true);

drop policy if exists "anon full access" on expense_edits;
create policy "anon full access" on expense_edits for all using (true) with check (true);

-- ------------------------------------------------------------------
-- 即時同步：讓其他裝置能即時收到新增/修改/刪除
-- 用 DO 區塊逐一檢查再加入，這樣重複執行這份 SQL、或是 Supabase 新專案
-- 預設就已經把某些表加進 supabase_realtime 發佈清單時，都不會噴錯。
-- ------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['trips', 'members', 'expenses', 'settlements'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table %I', t);
    end if;
  end loop;
end $$;

-- ------------------------------------------------------------------
-- 收據照片儲存空間（Storage bucket）
-- ------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

drop policy if exists "anon manage receipts" on storage.objects;
create policy "anon manage receipts" on storage.objects for all
  using (bucket_id = 'receipts') with check (bucket_id = 'receipts');
