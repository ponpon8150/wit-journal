import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import { C, CURRENCIES, fetchLiveRate } from "../lib/helpers";
import { Card, Btn } from "./ui";

export default function RateManagerCard({ trip, onUpdateRate }) {
  const [drafts, setDrafts] = useState({});
  const [loadingCur, setLoadingCur] = useState(null);
  const [newCurrency, setNewCurrency] = useState("");
  const [notes, setNotes] = useState({});
  const rates = trip.rates || {};
  const currencies = Object.keys(rates).filter((c) => c !== trip.base_currency);
  const availableToAdd = CURRENCIES.filter((c) => c !== trip.base_currency && !currencies.includes(c));

  const valueFor = (cur) => (drafts[cur] !== undefined ? drafts[cur] : String(rates[cur] ?? ""));
  const commit = (cur) => {
    const v = parseFloat(drafts[cur]);
    if (drafts[cur] !== undefined) {
      if (!isNaN(v) && v > 0) onUpdateRate(cur, v);
      setDrafts((d) => { const n = { ...d }; delete n[cur]; return n; });
      setNotes((n) => ({ ...n, [cur]: null }));
    }
  };
  const lookup = async (cur) => {
    setLoadingCur(cur);
    setNotes((n) => ({ ...n, [cur]: null }));
    try {
      const { rate } = await fetchLiveRate(cur, trip.base_currency);
      const rounded = Math.round(rate * 10000) / 10000;
      onUpdateRate(cur, rounded);
      setNotes((n) => ({ ...n, [cur]: { text: `已更新為 ${rounded}`, error: false } }));
    } catch (e) {
      setNotes((n) => ({ ...n, [cur]: { text: "查詢失敗，請手動輸入匯率", error: true } }));
    }
    setLoadingCur(null);
  };
  const handleAddCurrency = async () => {
    if (!newCurrency) return;
    const cur = newCurrency;
    setNewCurrency("");
    setLoadingCur(cur);
    try {
      const { rate } = await fetchLiveRate(cur, trip.base_currency);
      const rounded = Math.round(rate * 10000) / 10000;
      onUpdateRate(cur, rounded);
      setNotes((n) => ({ ...n, [cur]: { text: `已查到匯率 ${rounded}`, error: false } }));
    } catch (e) {
      onUpdateRate(cur, 1);
      setNotes((n) => ({ ...n, [cur]: { text: "查詢失敗，請在下方手動輸入正確匯率", error: true } }));
    }
    setLoadingCur(null);
  };

  return (
    <Card>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: C.text }}>幣別匯率</div>
      <div style={{ fontSize: 11.5, color: C.textSoft, marginBottom: 12 }}>
        設定一次，記帳時自動套用；主幣別 {trip.base_currency} 不需設定
      </div>
      {currencies.length === 0 ? (
        <div style={{ fontSize: 12.5, color: C.textSoft }}>尚未使用其他幣別，記帳時會自動加入這裡</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {currencies.map((cur) => (
            <div key={cur}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 46, fontSize: 13, fontWeight: 700, color: C.text, flexShrink: 0 }}>{cur}</div>
                <span style={{ fontSize: 12, color: C.textSoft, flexShrink: 0 }}>=</span>
                <input
                  className="tl-input" style={{ flex: 1 }} type="number" step="0.0001"
                  value={valueFor(cur)}
                  onChange={(e) => { setDrafts((d) => ({ ...d, [cur]: e.target.value })); setNotes((n) => ({ ...n, [cur]: null })); }}
                  onBlur={() => commit(cur)}
                />
                <span style={{ fontSize: 12, color: C.textSoft, flexShrink: 0 }}>{trip.base_currency}</span>
                <button onClick={() => lookup(cur)} disabled={loadingCur === cur} style={{ background: "none", border: "none", cursor: "pointer", color: C.primary, flexShrink: 0 }} title="查詢即時匯率">
                  <RefreshCw size={15} className={loadingCur === cur ? "tl-spin" : ""} />
                </button>
              </div>
              {notes[cur] ? (
                <div style={{ fontSize: 10.5, color: notes[cur].error ? C.warn : C.success, marginLeft: 54, marginTop: 2 }}>
                  {notes[cur].text}
                </div>
              ) : trip.rate_updated_at?.[cur] ? (
                <div style={{ fontSize: 10.5, color: C.textSoft, marginLeft: 54, marginTop: 2 }}>
                  更新於 {new Date(trip.rate_updated_at[cur]).toLocaleDateString("zh-TW")}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
      {availableToAdd.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <select className="tl-input" style={{ flex: 1 }} value={newCurrency} onChange={(e) => setNewCurrency(e.target.value)}>
            <option value="">+ 新增幣別</option>
            {availableToAdd.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <Btn variant="subtle" onClick={handleAddCurrency} disabled={!newCurrency}>新增</Btn>
        </div>
      )}
    </Card>
  );
}
