import { supabase } from "./supabase";
import { uid } from "./helpers";

/* ==================================================================
   Supabase 資料存取層
   所有函式都用「旅程代碼」當作存取範圍；沒有帳號登入機制，
   跟原本設計一致（見 schema.sql 開頭的權限模型說明）。
   ================================================================== */

export async function fetchTrip(code) {
  const { data, error } = await supabase.from("trips").select("*").eq("code", code).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchMembers(code) {
  const { data, error } = await supabase.from("members").select("*").eq("trip_code", code).order("created_at");
  if (error) throw error;
  return data || [];
}

export async function fetchExpenses(code) {
  const { data, error } = await supabase.from("expenses").select("*").eq("trip_code", code).order("occurred_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchSettlements(code) {
  const { data, error } = await supabase.from("settlements").select("*").eq("trip_code", code).order("occurred_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createTrip({ tripName, baseCurrency, startDate, dayCount, myName }) {
  let code;
  let tripErr;
  for (let attempt = 0; attempt < 5; attempt++) {
    code = genCodeCandidate();
    const res = await supabase.from("trips").insert({
      code,
      name: tripName,
      base_currency: baseCurrency,
      start_date: startDate || null,
      day_count: parseInt(dayCount) || 0,
      rates: { [baseCurrency]: 1 },
      rate_updated_at: {},
      last_currency: baseCurrency,
    });
    tripErr = res.error;
    if (!tripErr) break;
    if (tripErr.code !== "23505") throw tripErr; // 非「代碼重複」的錯誤直接拋出
  }
  if (tripErr) throw tripErr;
  const meId = uid();
  const { error: memErr } = await supabase.from("members").insert({ id: meId, trip_code: code, name: myName });
  if (memErr) throw memErr;
  return { code, meId };
}

function genCodeCandidate() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function joinTrip({ code, myName }) {
  const trip = await fetchTrip(code);
  if (!trip) return { notFound: true };
  const members = await fetchMembers(code);
  let member = members.find((m) => m.name.toLowerCase() === myName.trim().toLowerCase());
  if (!member) {
    const meId = uid();
    const { error } = await supabase.from("members").insert({ id: meId, trip_code: code, name: myName.trim() });
    if (error) throw error;
    member = { id: meId, name: myName.trim() };
  }
  return { trip, meId: member.id };
}

export async function addMember(code, name) {
  const { error } = await supabase.from("members").insert({ id: uid(), trip_code: code, name });
  if (error) throw error;
}

export async function deleteMember(memberId) {
  const { error } = await supabase.from("members").delete().eq("id", memberId);
  if (error) throw error;
}

export async function updateTripInfo(code, { name, startDate, dayCount }) {
  const { error } = await supabase.from("trips").update({ name, start_date: startDate || null, day_count: dayCount }).eq("code", code);
  if (error) throw error;
}

export async function updateRate(code, currency, rateValue) {
  const trip = await fetchTrip(code);
  const rates = { ...(trip.rates || {}), [currency]: rateValue };
  const rateUpdatedAt = { ...(trip.rate_updated_at || {}), [currency]: new Date().toISOString() };
  const { error } = await supabase.from("trips").update({ rates, rate_updated_at: rateUpdatedAt }).eq("code", code);
  if (error) throw error;
}

export async function updateLastCurrency(code, currency) {
  const { error } = await supabase.from("trips").update({ last_currency: currency }).eq("code", code);
  if (error) throw error;
}

export async function saveExpense(code, expense, rateUpdate) {
  if (rateUpdate) await updateRate(code, rateUpdate.currency, rateUpdate.rate);
  const row = {
    id: expense.id,
    trip_code: code,
    title: expense.title,
    category: expense.category,
    currency: expense.currency,
    amount: expense.amount,
    rate: expense.rate,
    amount_base: expense.amountBase,
    payer_id: expense.payerId,
    split_type: expense.splitType,
    participants: expense.participants,
    photo_url: expense.photoUrl || null,
    note: expense.note || "",
    day_id: expense.dayId,
    occurred_at: expense.occurredAt || new Date().toISOString(),
    created_by: expense.createdBy,
  };
  const { error } = await supabase.from("expenses").upsert(row);
  if (error) throw error;
}

export async function deleteExpense(id) {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}

export async function addSettlement(code, s) {
  const { error } = await supabase.from("settlements").insert({
    id: uid(),
    trip_code: code,
    from_member: s.from,
    to_member: s.to,
    amount: s.amount,
    occurred_at: s.date || new Date().toISOString(),
  });
  if (error) throw error;
}

export async function finalizeSettlement(code, suggestions) {
  const lines = suggestions.map((s) => ({ id: uid(), from: s.from, to: s.to, amount: s.amount }));
  const { error } = await supabase.from("trips").update({ final_settlement: { frozenAt: new Date().toISOString(), lines } }).eq("code", code);
  if (error) throw error;
}

export async function unfreezeSettlement(code) {
  const { error } = await supabase.from("trips").update({ final_settlement: null }).eq("code", code);
  if (error) throw error;
}

/* ---------------------------------- 即時同步 ---------------------------------- */
export function subscribeTrip(code, onChange) {
  const channel = supabase
    .channel(`trip-${code}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "trips", filter: `code=eq.${code}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "members", filter: `trip_code=eq.${code}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "expenses", filter: `trip_code=eq.${code}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "settlements", filter: `trip_code=eq.${code}` }, onChange)
    .subscribe();
  return () => supabase.removeChannel(channel);
}
