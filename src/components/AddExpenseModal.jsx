import React, { useState, useEffect, useRef } from "react";
import { Camera, X, Check, RefreshCw } from "lucide-react";
import { C, CURRENCIES, decimalsFor, roundToCurrency, fmt, uid, uploadReceiptPhoto, fetchLiveRate } from "../lib/helpers";
import { CATEGORIES, catMeta } from "../lib/categories";
import { Modal, Field, Btn, Avatar } from "./ui";

export default function AddExpenseModal({ trip, members, onClose, onSave, meId, defaultDayId, editingExpense, days }) {
  const travelers = members;
  const [dayId, setDayId] = useState(editingExpense?.day_id || defaultDayId || "pre");
  const [title, setTitle] = useState(editingExpense?.title || "");
  const [amount, setAmount] = useState(editingExpense ? String(editingExpense.amount) : "");
  const initialCurrency = editingExpense?.currency || trip.last_currency || trip.base_currency;
  const initialCentralRate = trip.rates?.[initialCurrency];
  const initialHasCentralRate = initialCurrency === trip.base_currency || (typeof initialCentralRate === "number" && initialCentralRate > 0);
  const [currency, setCurrency] = useState(initialCurrency);
  const [rate, setRate] = useState(editingExpense?.rate ?? (initialHasCentralRate ? (initialCentralRate ?? 1) : ""));
  const [rateOverrideOpen, setRateOverrideOpen] = useState(
    editingExpense ? (editingExpense.currency || trip.base_currency) !== trip.base_currency : !initialHasCentralRate
  );
  const [category, setCategory] = useState(editingExpense?.category || "food");
  const [payerId, setPayerId] = useState(editingExpense?.payer_id || meId);
  const [splitType, setSplitType] = useState(editingExpense?.split_type || "equal");
  const [participantIds, setParticipantIds] = useState(
    editingExpense ? (editingExpense.participants || []).map((p) => p.memberId) : travelers.map((m) => m.id)
  );
  const [customShares, setCustomShares] = useState(
    editingExpense && editingExpense.split_type === "custom"
      ? Object.fromEntries((editingExpense.participants || []).map((p) => [p.memberId, String(p.shareLocal)]))
      : {}
  );
  const [photoUrl, setPhotoUrl] = useState(editingExpense?.photo_url || null);
  const [zoomPhoto, setZoomPhoto] = useState(false);
  const [note, setNote] = useState(editingExpense?.note || "");
  const [uploading, setUploading] = useState(false);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateNote, setRateNote] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const isFirstRender = useRef(true);

  const handleFetchRate = async () => {
    setRateLoading(true); setRateNote("");
    try {
      const { rate: r } = await fetchLiveRate(currency, trip.base_currency);
      setRate(String(Math.round(r * 10000) / 10000));
      setRateNote("已帶入市場參考匯率，如需精確金額請對照銀行公告匯率調整");
    } catch (e) {
      setRateNote("查詢失敗，請手動輸入匯率");
    }
    setRateLoading(false);
  };

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const central = trip.rates?.[currency];
    const hasCentral = currency === trip.base_currency || (typeof central === "number" && central > 0);
    setRateOverrideOpen(!hasCentral);
    setRate(hasCentral ? String(central ?? 1) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency]);

  useEffect(() => {
    if (splitType === "self") setParticipantIds([payerId]);
  }, [splitType, payerId]);

  const centralRate = trip.rates?.[currency];
  const hasCentralRate = currency === trip.base_currency || (typeof centralRate === "number" && centralRate > 0);
  const rateUpdatedAtDisplay = trip.rate_updated_at?.[currency] ? new Date(trip.rate_updated_at[currency]).toLocaleDateString("zh-TW") : null;

  const openRateOverride = () => {
    if (!rateOverrideOpen && (rate === "" || rate == null)) setRate(String(centralRate ?? ""));
    setRateOverrideOpen(true);
  };
  const useCentralRate = () => setRateOverrideOpen(false);

  const total = parseFloat(amount) || 0;
  const equalShare = participantIds.length ? total / participantIds.length : 0;
  const customSum = participantIds.reduce((s, id) => s + (parseFloat(customShares[id]) || 0), 0);

  const toggleParticipant = (id) => {
    setParticipantIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadReceiptPhoto(trip.code, file);
      setPhotoUrl(url);
    } catch (e2) {
      setErr("照片上傳失敗，請確認網路連線或稍後再試");
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!title.trim()) return setErr("請輸入項目名稱");
    if (!total || total <= 0) return setErr("請輸入正確金額");
    const r = currency === trip.base_currency ? 1 : (hasCentralRate && !rateOverrideOpen ? centralRate : parseFloat(rate));
    if (!r || r <= 0) return setErr("請輸入正確匯率");
    if (!participantIds.length) return setErr("請至少選擇一位分攤者");
    if (splitType === "custom" && Math.abs(customSum - total) > 0.5) {
      return setErr(`自訂金額總和（${fmt(customSum, currency)}）需等於總金額（${fmt(total, currency)}）`);
    }
    const participants = participantIds.map((id) => {
      const shareLocal = splitType === "custom" ? (parseFloat(customShares[id]) || 0) : equalShare;
      return { memberId: id, shareLocal, shareBase: roundToCurrency(shareLocal * r, trip.base_currency) };
    });
    const amountBase = roundToCurrency(total * r, trip.base_currency);
    const expense = {
      id: editingExpense?.id || uid(), title: title.trim(), category, currency, amount: roundToCurrency(total, currency), rate: r,
      amountBase, payerId, splitType, participants, photoUrl, note: note.trim(),
      occurredAt: editingExpense?.occurred_at || new Date().toISOString(),
      createdBy: editingExpense?.created_by || meId, dayId,
    };
    setSaving(true);
    const establishesCentralRate = currency !== trip.base_currency && !hasCentralRate;
    const rateUpdate = establishesCentralRate ? { currency, rate: r } : null;
    try {
      await onSave(expense, rateUpdate, currency);
    } catch (e2) {
      setErr("儲存失敗，請檢查網路連線再試一次");
      setSaving(false);
    }
  };

  return (
    <>
    <Modal title={editingExpense ? "編輯花費" : "新增花費"} onClose={onClose} wide>
      <Field label="所屬天數">
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
          {days.map((d) => {
            const active = dayId === d.id;
            return (
              <button key={d.id} onClick={() => setDayId(d.id)} style={{
                padding: "7px 12px", borderRadius: 10, whiteSpace: "nowrap", fontSize: 12.5, cursor: "pointer",
                border: active ? `1.5px solid ${C.primary}` : `1px solid ${C.line}`,
                background: active ? `${C.primary}18` : "#fff", color: active ? C.primary : C.textSoft, fontWeight: active ? 700 : 500,
              }}>
                {d.label}{d.date ? ` ${d.date.slice(5)}` : ""}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="項目名稱">
        <input className="tl-input" placeholder="例如：晚餐、車票、飯店" value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>

      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 2 }}>
          <Field label="金額">
            <input className="tl-input" type="number" step={decimalsFor(currency) === 0 ? "1" : "0.01"} placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="幣別">
            <select className="tl-input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {currency !== trip.base_currency && (
        <Field label="匯率">
          {hasCentralRate && !rateOverrideOpen ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.bg, borderRadius: 12, padding: "10px 12px" }}>
              <div>
                <div style={{ fontSize: 13, color: C.text }}>1 {currency} = {centralRate} {trip.base_currency}</div>
                <div style={{ fontSize: 11, color: C.textSoft, marginTop: 2 }}>
                  套用旅程設定匯率{rateUpdatedAtDisplay ? ` · 更新於 ${rateUpdatedAtDisplay}` : ""}
                </div>
              </div>
              <button onClick={openRateOverride} style={{ background: "none", border: "none", color: C.primary, fontSize: 12.5, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
                調整這筆匯率
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="tl-input" style={{ flex: 1 }} type="number" step="0.0001" value={rate} onChange={(e) => { setRate(e.target.value); setRateNote(""); }} placeholder={`1 ${currency} = ? ${trip.base_currency}`} />
                <Btn variant="subtle" onClick={handleFetchRate} disabled={rateLoading} style={{ whiteSpace: "nowrap", padding: "0 14px" }}>
                  <RefreshCw size={14} className={rateLoading ? "tl-spin" : ""} /> 即時匯率
                </Btn>
              </div>
              {rateNote && <div style={{ fontSize: 11.5, color: rateNote.includes("失敗") ? C.warn : C.textSoft, marginTop: 4 }}>{rateNote}</div>}
              {hasCentralRate ? (
                <button onClick={useCentralRate} style={{ background: "none", border: "none", color: C.textSoft, fontSize: 11.5, cursor: "pointer", marginTop: 6, textDecoration: "underline" }}>
                  改用旅程設定匯率（1 {currency} = {centralRate}）
                </button>
              ) : (
                <div style={{ fontSize: 11.5, color: C.textSoft, marginTop: 6 }}>
                  此幣別尚未設定匯率，儲存後會加入「旅伴頁 → 幣別匯率」方便下次自動套用
                </div>
              )}
              {total > 0 && rate > 0 && (
                <div style={{ fontSize: 12, color: C.textSoft, marginTop: 5 }}>
                  約等於 {fmt(total * (parseFloat(rate) || 0), trip.base_currency)} {trip.base_currency}
                </div>
              )}
            </>
          )}
        </Field>
      )}

      <Field label="分類">
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${CATEGORIES.length}, 1fr)`, gap: 6 }}>
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = category === c.id;
            return (
              <button key={c.id} onClick={() => setCategory(c.id)} title={c.label} aria-label={c.label}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 0", borderRadius: 12,
                  border: active ? `1.5px solid ${c.color}` : `1px solid ${C.line}`,
                  background: active ? `${c.color}18` : "#fff", cursor: "pointer",
                  color: active ? c.color : C.textSoft,
                }}>
                <Icon size={18} strokeWidth={active ? 2.4 : 1.8} />
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 11.5, color: catMeta(category).color, marginTop: 6, fontWeight: 600 }}>已選擇：{catMeta(category).label}</div>
      </Field>

      <Field label="分攤方式">
        {splitType !== "self" && (
          <div style={{ fontSize: 11.5, color: C.textSoft, marginTop: -4, marginBottom: 8 }}>取消勾選代表該旅伴這筆花費不需分擔</div>
        )}
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {[["self", "自己出錢"], ["equal", "平均分攤"], ["custom", "自訂金額"]].map(([k, l]) => (
            <button key={k} onClick={() => setSplitType(k)}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600,
                border: splitType === k ? `1.5px solid ${C.primary}` : `1px solid ${C.line}`,
                background: splitType === k ? `${C.primary}14` : "#fff", color: splitType === k ? C.primary : C.textSoft,
              }}>{l}</button>
          ))}
        </div>
        {splitType === "self" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.bg, borderRadius: 12, padding: "10px 12px" }}>
            <Avatar name={travelers.find((m) => m.id === payerId)?.name} idx={members.findIndex((mm) => mm.id === payerId)} size={26} />
            <span style={{ fontSize: 13, color: C.text }}>
              這筆由 <b>{travelers.find((m) => m.id === payerId)?.name || "先付人"}</b> 自己負擔全額，不分攤給其他人
            </span>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {travelers.map((m) => {
                const idx = members.findIndex((mm) => mm.id === m.id);
                const checked = participantIds.includes(m.id);
                return (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, opacity: checked ? 1 : 0.45 }}>
                    <div onClick={() => toggleParticipant(m.id)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${C.primary}`,
                        background: checked ? C.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {checked && <Check size={13} color="#fff" />}
                      </div>
                      <Avatar name={m.name} idx={idx} size={22} />
                      <span style={{ fontSize: 14 }}>{m.name}</span>
                    </div>
                    {checked && splitType === "equal" && (
                      <span style={{ fontSize: 12.5, color: C.textSoft }}>{fmt(equalShare, currency)} {currency}</span>
                    )}
                    {checked && splitType === "custom" && (
                      <input className="tl-input" style={{ width: 90, height: 36 }} type="number" placeholder="0"
                        value={customShares[m.id] || ""} onChange={(e) => setCustomShares((s) => ({ ...s, [m.id]: e.target.value }))} />
                    )}
                  </div>
                );
              })}
            </div>
            {splitType === "custom" && total > 0 && (
              <div style={{ fontSize: 12, color: Math.abs(customSum - total) > 0.5 ? C.danger : C.success, marginTop: 8 }}>
                已分配 {fmt(customSum, currency)} / {fmt(total, currency)} {currency}
              </div>
            )}
          </>
        )}
      </Field>

      <Field label="由誰先付">
        <select className="tl-input" value={payerId} onChange={(e) => setPayerId(e.target.value)}>
          {travelers.map((m) => <option key={m.id} value={m.id}>{m.name}{m.id === meId ? "（我）" : ""}</option>)}
        </select>
      </Field>

      <Field label="拍照記錄與備註（選填）">
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          {photoUrl ? (
            <div style={{ position: "relative", width: 110, flexShrink: 0 }}>
              <img src={photoUrl} alt="收據" onClick={() => setZoomPhoto(true)} style={{ width: 110, height: 110, objectFit: "cover", borderRadius: 12, cursor: "pointer" }} />
              <button onClick={() => setPhotoUrl(null)} style={{ position: "absolute", top: -6, right: -6, background: "#fff", borderRadius: "50%", border: `1px solid ${C.line}`, width: 22, height: 22, cursor: "pointer" }}>
                <X size={12} />
              </button>
            </div>
          ) : (
            <label style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              width: 110, height: 110, borderRadius: 12, border: `1.5px dashed ${C.line}`, cursor: "pointer", color: C.textSoft, flexShrink: 0,
            }}>
              <Camera size={22} className={uploading ? "tl-spin" : ""} />
              <span style={{ fontSize: 11, marginTop: 4 }}>{uploading ? "上傳中…" : "拍照 / 上傳"}</span>
              <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePhoto} />
            </label>
          )}
          <textarea
            className="tl-textarea" style={{ flex: 1, minHeight: 110 }}
            placeholder="輸入細節或特別備註…" value={note} onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </Field>

      {err && <div style={{ color: C.danger, fontSize: 13, marginBottom: 10 }}>{err}</div>}
      <Btn full onClick={handleSave} disabled={saving || uploading}>{saving ? "處理中…" : editingExpense ? "更新花費" : "儲存花費"}</Btn>
    </Modal>

    {zoomPhoto && photoUrl && (
      <div onClick={() => setZoomPhoto(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70, padding: 20 }}>
        <img src={photoUrl} alt="收據放大檢視" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 12 }} />
      </div>
    )}
    </>
  );
}
