import { supabase } from "./supabase";

/* ---------------------------------- 色系 / 字型 token ---------------------------------- */
export const C = {
  primary: "#5B8FA8",
  accent: "#3FB8C4",
  secondary: "#C4A876",
  bg: "#F3EFE8",
  surface: "#FFFFFF",
  surfaceAlt: "#EAE3D6",
  text: "#2E3B3E",
  textSoft: "#6B7A7C",
  success: "#6FA98A",
  warn: "#D98B5F",
  danger: "#B5563F",
  line: "#E1D9C9",
};
export const FONT_DISPLAY = '"Microsoft JhengHei", "微軟正黑體", "PingFang TC", "Heiti TC", sans-serif';
export const FONT_BODY = FONT_DISPLAY;

export const MEMBER_COLORS = ["#5B8FA8", "#3FB8C4", "#C4A876", "#6FA98A", "#D98B5F", "#8E7CC3", "#A8677D"];
export const memberColor = (idx) => MEMBER_COLORS[((idx % MEMBER_COLORS.length) + MEMBER_COLORS.length) % MEMBER_COLORS.length];

export const CURRENCIES = ["TWD", "USD", "JPY", "EUR", "KRW", "CNY", "HKD", "THB", "GBP", "VND", "SGD"];
const ZERO_DECIMAL_CURRENCIES = ["JPY", "KRW", "VND", "TWD"];

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10));

export function genTripCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export const decimalsFor = (currency) => (ZERO_DECIMAL_CURRENCIES.includes(currency) ? 0 : 2);
export const roundToCurrency = (n, currency) => {
  const d = decimalsFor(currency);
  const p = Math.pow(10, d);
  return Math.round((n + Number.EPSILON) * p) / p;
};
export const fmt = (n, currency) => {
  const d = currency ? decimalsFor(currency) : 2;
  const rounded = roundToCurrency(n || 0, currency);
  return rounded.toLocaleString("zh-TW", { minimumFractionDigits: d, maximumFractionDigits: d });
};

/* ---------------------------------- 照片：壓縮 + 上傳到 Supabase Storage ---------------------------------- */
export function compressImage(file, maxW = 1000, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 代購清單只存在本機瀏覽器，不需要上傳到雲端，直接壓成 dataURL 存進 localStorage 即可
export function compressImageToDataUrl(file, maxW = 700, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadReceiptPhoto(tripCode, file) {
  if (!supabase) return null;
  const blob = await compressImage(file);
  const path = `${tripCode}/${uid()}.jpg`;
  const { error } = await supabase.storage.from("receipts").upload(path, blob, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("receipts").getPublicUrl(path);
  return data.publicUrl;
}

/* ---------------------------------- 天數 / 日期 ---------------------------------- */
export function buildDays(startDate, dayCount) {
  const days = [{ id: "pre", label: "行前", date: null }];
  const n = parseInt(dayCount) || 0;
  if (startDate && n > 0) {
    const start = new Date(startDate + "T00:00:00");
    for (let i = 0; i < n; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push({ id: `day${i + 1}`, label: `DAY${i + 1}`, date: d.toISOString().slice(0, 10) });
    }
  } else {
    for (let i = 0; i < n; i++) days.push({ id: `day${i + 1}`, label: `DAY${i + 1}`, date: null });
  }
  days.push({ id: "post", label: "回國", date: null });
  return days;
}

export function defaultDayFor(trip) {
  const days = buildDays(trip.start_date, trip.day_count);
  const today = new Date().toISOString().slice(0, 10);
  const match = days.find((d) => d.date === today);
  if (match) return match.id;
  if (trip.start_date) {
    if (today < trip.start_date) return "pre";
    const last = days[days.length - 2];
    if (last?.date && today > last.date) return "post";
  }
  return "pre";
}

/* ---------------------------------- 分帳計算 ---------------------------------- */
export function computeBalances(members, expenses, settlements) {
  const bal = {};
  members.forEach((m) => (bal[m.id] = 0));
  expenses.forEach((e) => {
    if (bal[e.payer_id] === undefined) bal[e.payer_id] = 0;
    bal[e.payer_id] += Number(e.amount_base);
    (e.participants || []).forEach((p) => {
      if (bal[p.memberId] === undefined) bal[p.memberId] = 0;
      bal[p.memberId] -= Number(p.shareBase);
    });
  });
  settlements.forEach((s) => {
    if (bal[s.from_member] === undefined) bal[s.from_member] = 0;
    if (bal[s.to_member] === undefined) bal[s.to_member] = 0;
    bal[s.from_member] += Number(s.amount);
    bal[s.to_member] -= Number(s.amount);
  });
  return bal;
}

export function simplifyDebts(bal) {
  const creditors = Object.entries(bal).filter(([, v]) => v > 0.01).map(([id, v]) => ({ id, amt: v }));
  const debtors = Object.entries(bal).filter(([, v]) => v < -0.01).map(([id, v]) => ({ id, amt: -v }));
  creditors.sort((a, b) => b.amt - a.amt);
  debtors.sort((a, b) => b.amt - a.amt);
  const res = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt);
    if (pay > 0.01) res.push({ from: debtors[i].id, to: creditors[j].id, amount: pay });
    debtors[i].amt -= pay;
    creditors[j].amt -= pay;
    if (debtors[i].amt < 0.01) i++;
    if (creditors[j].amt < 0.01) j++;
  }
  return res;
}

/**
 * 查詢即時匯率（市場參考中間價，來源 open.er-api.com，每日更新，免金鑰）。
 * 這個網頁沒有 Artifact 的網路限制，可以直接在瀏覽器呼叫公開 API；
 * 僅供快速估算，正式金額仍建議對照銀行公告匯率。
 */
export async function fetchLiveRate(fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return { rate: 1 };
  const resp = await fetch(`https://open.er-api.com/v6/latest/${fromCurrency}`);
  const data = await resp.json();
  if (data.result !== "success" || !data.rates || data.rates[toCurrency] == null) {
    throw new Error("rate not found");
  }
  return { rate: data.rates[toCurrency] };
}

export function safeJSON(str, fallback) {
  try {
    const v = JSON.parse(str);
    return v == null ? fallback : v;
  } catch (e) {
    return fallback;
  }
}

/* ---------------------------------- 本機（此裝置）儲存 ---------------------------------- */
const LS_MY_TRIPS = "tl_my_trips_v1";
const LS_DAIGOU_PREFIX = "tl_daigou_v1_";

export function loadMyTrips() {
  return safeJSON(localStorage.getItem(LS_MY_TRIPS), []);
}
export function saveMyTrips(list) {
  try {
    localStorage.setItem(LS_MY_TRIPS, JSON.stringify(list));
  } catch (e) {}
}
export function loadDaigou(code) {
  return safeJSON(localStorage.getItem(LS_DAIGOU_PREFIX + code), []);
}
export function saveDaigouLocal(code, items) {
  try {
    localStorage.setItem(LS_DAIGOU_PREFIX + code, JSON.stringify(items));
  } catch (e) {}
}

export const CATEGORY_IDS = ["transport", "stay", "food", "shopping", "pharmacy", "fun", "other"];
