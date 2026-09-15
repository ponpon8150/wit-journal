import React, { useState, useRef, useEffect } from "react";
import { Camera, X } from "lucide-react";
import { C, CURRENCIES, decimalsFor, roundToCurrency, fmt, uid, compressImageToDataUrl, recognizeReceiptText, daigouCollectedBase } from "../lib/helpers";
import { DAIGOU_CATEGORIES, daigouCatMeta } from "../lib/daigouCategories";
import { Modal, Field, Btn } from "./ui";

export function AddDaigouItemModal({ editingItem, presetTargetName, previousTargets, onClose, onSave }) {
  const [targetName, setTargetName] = useState(editingItem?.targetName || presetTargetName || "");
  const [name, setName] = useState(editingItem?.name || "");
  const [category, setCategory] = useState(editingItem?.category || "other");
  const [qty, setQty] = useState(editingItem?.qty || "");
  const [note, setNote] = useState(editingItem?.note || "");
  const [photo, setPhoto] = useState(editingItem?.photo || null);
  const [zoomPhoto, setZoomPhoto] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState("");
  const [err, setErr] = useState("");

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setOcrError("");
    let dataUrl = null;
    try {
      dataUrl = await compressImageToDataUrl(file);
      setPhoto(dataUrl);
    } catch {
      setErr("照片處理失敗");
    }
    setUploading(false);

    if (dataUrl) {
      setOcrLoading(true);
      try {
        const text = await recognizeReceiptText(dataUrl, "eng");
        setNote((prev) => (prev.trim() ? `${prev.trim()}\n${text}` : text));
      } catch (e3) {
        setOcrError(e3.message === "尚未設定 OCR API 金鑰" ? "尚未設定辨識功能，請手動輸入備註" : "辨識失敗，請手動輸入備註");
      }
      setOcrLoading(false);
    }
  };

  const handleSave = () => {
    if (!targetName.trim()) return setErr("請輸入代購對象");
    if (!name.trim()) return setErr("請輸入品項名稱");
    onSave({
      id: editingItem?.id || uid(), targetName: targetName.trim(), name: name.trim(), category, qty: qty.trim(),
      note: note.trim(), photo, bought: editingItem?.bought || false, purchase: editingItem?.purchase || null,
      createdAt: editingItem?.createdAt || new Date().toISOString(),
    });
  };

  return (
    <>
    <Modal title={editingItem ? "編輯代購項目" : "新增代購項目"} onClose={onClose}>
      <Field label="代購對象">
        <input className="tl-input" list="daigou-target-suggestions" placeholder="輸入名字，例如：媽媽、公司同事" value={targetName} onChange={(e) => setTargetName(e.target.value)} />
        {previousTargets.length > 0 && (
          <datalist id="daigou-target-suggestions">{previousTargets.map((t) => <option key={t} value={t} />)}</datalist>
        )}
        <div style={{ fontSize: 11, color: C.textSoft, marginTop: 6 }}>⚠️ 僅存在這台裝置，不會跟旅伴同步</div>
      </Field>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 3 }}>
          <Field label="品項名稱"><input className="tl-input" placeholder="例如：面膜、防曬乳" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        </div>
        <div style={{ flex: 2 }}>
          <Field label="數量／規格"><input className="tl-input" placeholder="例如：2盒" value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
        </div>
      </div>
      <Field label="分類">
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${DAIGOU_CATEGORIES.length}, 1fr)`, gap: 6 }}>
          {DAIGOU_CATEGORIES.map((c) => {
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
        <div style={{ fontSize: 12, color: daigouCatMeta(category).color, marginTop: 6, fontWeight: 600 }}>已選擇：{daigouCatMeta(category).label}</div>
      </Field>
      <Field label="拍照記錄與備註（選填，拍照後會自動辨識文字帶入備註）">
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          {photo ? (
            <div style={{ position: "relative", width: 110, flexShrink: 0 }}>
              <img src={photo} alt="商品參考" onClick={() => setZoomPhoto(true)} style={{ width: 110, height: 110, objectFit: "cover", borderRadius: 12, cursor: "pointer" }} />
              <button onClick={() => setPhoto(null)} style={{ position: "absolute", top: -6, right: -6, background: "#fff", borderRadius: "50%", border: `1px solid ${C.line}`, width: 22, height: 22, cursor: "pointer" }}>
                <X size={12} />
              </button>
            </div>
          ) : (
            <label style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              width: 110, height: 110, borderRadius: 12, border: `1.5px dashed ${C.line}`, cursor: "pointer", color: C.textSoft, flexShrink: 0,
            }}>
              <Camera size={22} />
              <span style={{ fontSize: 11, marginTop: 4 }}>{uploading ? "處理中…" : "拍照 / 上傳"}</span>
              <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePhoto} />
            </label>
          )}
          <div style={{ flex: 1 }}>
            <textarea className="tl-textarea" style={{ width: "100%", minHeight: 110 }}
              placeholder="輸入細節或特別備註…（拍照後會自動帶入辨識到的文字）" value={note} onChange={(e) => setNote(e.target.value)} />
            {ocrLoading && <div style={{ fontSize: 12, color: C.textSoft, marginTop: 6 }}>辨識中，將自動帶入文字…</div>}
            {ocrError && <div style={{ fontSize: 12, color: C.warn, marginTop: 6 }}>{ocrError}</div>}
          </div>
        </div>
      </Field>
      {err && <div style={{ color: C.danger, fontSize: 13, marginBottom: 10 }}>{err}</div>}
      <Btn full onClick={handleSave}>儲存</Btn>
    </Modal>
    {zoomPhoto && photo && (
      <div onClick={() => setZoomPhoto(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70, padding: 20 }}>
        <img src={photo} alt="商品參考放大" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 12 }} />
      </div>
    )}
    </>
  );
}

export function DaigouPurchaseModal({ trip, item, onClose, onSave }) {
  const [amount, setAmount] = useState(item.purchase ? String(item.purchase.amount) : "");
  const [currency, setCurrency] = useState(item.purchase?.currency || trip.travel_currency || trip.base_currency);
  const [rate, setRate] = useState(item.purchase?.rate ?? (trip.rates?.[currency] || 1));
  const [purchaseDate, setPurchaseDate] = useState(item.purchase?.date || new Date().toISOString());
  const [photo, setPhoto] = useState(item.purchase?.receiptPhoto || item.photo || null);
  const [zoomPhoto, setZoomPhoto] = useState(false);
  const [note, setNote] = useState(item.purchase?.receiptNote || "");
  const [uploading, setUploading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState("");
  const existingCollectedBase = daigouCollectedBase(item.purchase);
  const [addPayment, setAddPayment] = useState("");
  const [err, setErr] = useState("");
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setRate(trip.rates?.[currency] ?? (currency === trip.base_currency ? 1 : ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency]);

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setOcrError("");
    let dataUrl = null;
    try {
      dataUrl = await compressImageToDataUrl(file);
      setPhoto(dataUrl);
    } catch {
      setErr("照片處理失敗");
    }
    setUploading(false);

    if (dataUrl) {
      setOcrLoading(true);
      try {
        const text = await recognizeReceiptText(dataUrl, currency);
        setNote((prev) => (prev.trim() ? `${prev.trim()}\n${text}` : text));
      } catch (e3) {
        setOcrError(e3.message === "尚未設定 OCR API 金鑰" ? "尚未設定辨識功能，請手動輸入備註" : "辨識失敗，請手動輸入備註");
      }
      setOcrLoading(false);
    }
  };

  const handleSave = () => {
    const total = parseFloat(amount) || 0;
    if (!total || total <= 0) return setErr("請輸入正確金額");
    const r = parseFloat(rate);
    if (!r || r <= 0) return setErr("請輸入正確匯率");
    const amountBase = roundToCurrency(total * r, trip.base_currency);
    // 「這次收到」金額：以目前選擇的幣別輸入，換算成本幣後累加到已收總額，並自動封頂於總花費
    const addLocal = parseFloat(addPayment) || 0;
    const addBase = addLocal > 0 ? roundToCurrency(addLocal * r, trip.base_currency) : 0;
    const collectedAmount = Math.max(0, Math.min(amountBase, roundToCurrency(existingCollectedBase + addBase, trip.base_currency)));
    const collected = amountBase > 0 && collectedAmount >= amountBase;
    onSave({
      amount: roundToCurrency(total, currency), currency, rate: r,
      amountBase,
      receiptPhoto: photo, receiptNote: note.trim(), collectedAmount, collected, date: purchaseDate,
    });
  };

  return (
    <>
    <Modal title="記錄購買金額" onClose={onClose}>
      <div style={{ fontSize: 13, color: C.text, marginBottom: 14 }}>
        <b>{item.targetName}</b> · {item.name}{item.qty ? ` · ${item.qty}` : ""}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 2 }}>
          <Field label="金額"><input className="tl-input" type="number" step={decimalsFor(currency) === 0 ? "1" : "0.01"} placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
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
        <Field label={`匯率（1 ${currency} = ? ${trip.base_currency}）`}>
          <input className="tl-input" type="number" step="0.0001" value={rate} onChange={(e) => setRate(e.target.value)} />
          {parseFloat(amount) > 0 && rate > 0 && (
            <div style={{ fontSize: 12, color: C.textSoft, marginTop: 5 }}>約等於 {fmt(parseFloat(amount) * (parseFloat(rate) || 0), trip.base_currency)} {trip.base_currency}</div>
          )}
        </Field>
      )}
      <Field label="拍照記錄與備註（選填，拍照後會自動辨識文字帶入備註）">
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          {photo ? (
            <div style={{ position: "relative", width: 110, flexShrink: 0 }}>
              <img src={photo} alt="收據" onClick={() => setZoomPhoto(true)} style={{ width: 110, height: 110, objectFit: "cover", borderRadius: 12, cursor: "pointer" }} />
              <button onClick={() => setPhoto(null)} style={{ position: "absolute", top: -6, right: -6, background: "#fff", borderRadius: "50%", border: `1px solid ${C.line}`, width: 22, height: 22, cursor: "pointer" }}>
                <X size={12} />
              </button>
            </div>
          ) : (
            <label style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              width: 110, height: 110, borderRadius: 12, border: `1.5px dashed ${C.line}`, cursor: "pointer", color: C.textSoft, flexShrink: 0,
            }}>
              <Camera size={22} />
              <span style={{ fontSize: 11, marginTop: 4 }}>{uploading ? "處理中…" : "拍照 / 上傳"}</span>
              <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePhoto} />
            </label>
          )}
          <div style={{ flex: 1 }}>
            <textarea className="tl-textarea" style={{ width: "100%", minHeight: 110 }}
              placeholder="輸入細節或特別備註…（拍照後會自動帶入辨識到的文字）" value={note} onChange={(e) => setNote(e.target.value)} />
            {ocrLoading && <div style={{ fontSize: 12, color: C.textSoft, marginTop: 6 }}>辨識中，將自動帶入文字…</div>}
            {ocrError && <div style={{ fontSize: 12, color: C.warn, marginTop: 6 }}>{ocrError}</div>}
          </div>
        </div>
      </Field>
      <Field label="收款狀態">
        {(() => {
          const previewAmountBase = (parseFloat(amount) || 0) > 0 && (parseFloat(rate) || 0) > 0
            ? roundToCurrency(parseFloat(amount) * parseFloat(rate), trip.base_currency) : 0;
          const remaining = Math.max(0, roundToCurrency(previewAmountBase - existingCollectedBase, trip.base_currency));
          const fullyCollected = previewAmountBase > 0 && existingCollectedBase >= previewAmountBase;
          return (
            <div style={{ background: C.bg, borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: C.textSoft }}>
                <span>已收 {fmt(existingCollectedBase, trip.base_currency)} {trip.base_currency}</span>
                <span style={{ color: fullyCollected ? C.success : C.warn, fontWeight: 600 }}>
                  {fullyCollected ? "已收款 ✓" : `還差 ${fmt(remaining, trip.base_currency)} ${trip.base_currency}`}
                </span>
              </div>
            </div>
          );
        })()}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div style={{ flex: 2 }}>
            <Field label={`這次收到多少（${currency}）`}>
              <input className="tl-input" type="number" step={decimalsFor(currency) === 0 ? "1" : "0.01"} placeholder="0" value={addPayment} onChange={(e) => setAddPayment(e.target.value)} />
            </Field>
          </div>
        </div>
        <div style={{ fontSize: 11.5, color: C.textSoft, marginTop: 2 }}>朋友分次付款時，每次在這裡輸入這次收到的金額，系統會自動加總，收滿總額後自動標記「已收款 ✓」</div>
      </Field>
      {err && <div style={{ color: C.danger, fontSize: 13, marginBottom: 10 }}>{err}</div>}
      <Btn full onClick={handleSave}>儲存並標記已購買</Btn>
    </Modal>
    {zoomPhoto && photo && (
      <div onClick={() => setZoomPhoto(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70, padding: 20 }}>
        <img src={photo} alt="收據放大檢視" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 12 }} />
      </div>
    )}
    </>
  );
}
