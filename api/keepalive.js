// 這個檔案會變成 Vercel 的「排程任務」，每天由 Vercel 自動呼叫一次（不需要任何人手動點開網站）。
// 用途：對 Supabase 資料庫發出一個很小的查詢，製造「有在使用」的紀錄，
// 這樣 Supabase 免費方案就不會因為「超過約一週沒人用」而自動把專案暫停（休眠）。
// 不會寫入或修改任何資料，只是讀取一筆最小的資訊。
export default async function handler(req, res) {
  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    res.status(500).json({ ok: false, error: "尚未設定 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 環境變數" });
    return;
  }

  try {
    const r = await fetch(`${url}/rest/v1/trips?select=code&limit=1`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });
    res.status(200).json({
      ok: true,
      supabaseStatus: r.status,
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
}
