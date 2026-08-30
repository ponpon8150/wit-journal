import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseReady = Boolean(url && anonKey);

if (!supabaseReady) {
  // eslint-disable-next-line no-console
  console.warn(
    "尚未設定 Supabase 連線資訊：請建立 .env（可參考 .env.example）並填入 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY，然後重新啟動。"
  );
}

export const supabase = supabaseReady
  ? createClient(url, anonKey, { realtime: { params: { eventsPerSecond: 5 } } })
  : null;
