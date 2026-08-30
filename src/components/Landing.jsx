import React, { useState } from "react";
import { Plus, ChevronRight, Trash2 } from "lucide-react";
import { C, FONT_BODY, FONT_DISPLAY, CURRENCIES } from "../lib/helpers";
import { Card, Btn, Modal, Field } from "./ui";
import { HorizonBanner } from "./ui";

export default function Landing({ myTrips, onCreate, onJoin, onResume, onRemoveTrip, busy, err, setErr, initialJoinCode }) {
  const [mode, setMode] = useState(initialJoinCode ? "join" : "create");
  const [tripName, setTripName] = useState("");
  const [baseCurrency, setBaseCurrency] = useState("TWD");
  const [startDate, setStartDate] = useState("");
  const [dayCount, setDayCount] = useState(5);
  const [myName, setMyName] = useState("");
  const [joinCode, setJoinCode] = useState(initialJoinCode || "");
  const [joinName, setJoinName] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [showEntryModal, setShowEntryModal] = useState(Boolean(initialJoinCode));

  const sorted = [...myTrips].reverse();

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: FONT_BODY, paddingBottom: 40 }}>
      <HorizonBanner />
      <div style={{ padding: "0 20px", marginTop: -36, position: "relative" }}>
        {sorted.length > 0 ? (
          <div style={{ maxWidth: 460, margin: "88px auto 14px" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, position: "relative", top: -20, marginBottom: 10, textAlign: "center" }}>旅程口袋清單</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, position: "relative", top: -20 }}>
              {sorted.map((t) => (
                <Card key={t.code} style={{ padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div onClick={() => onResume(t.code, t.meId)} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                    <div style={{ fontSize: 11.5, color: C.textSoft, marginTop: 2 }}>代碼 {t.code}{t.startDate ? ` · ${t.startDate}` : ""}</div>
                  </div>
                  <button onClick={() => onResume(t.code, t.meId)} style={{ background: "none", border: "none", cursor: "pointer", color: C.primary, flexShrink: 0, display: "flex" }}>
                    <ChevronRight size={18} />
                  </button>
                  <button onClick={() => setConfirmRemove(t)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textSoft, flexShrink: 0, display: "flex" }}>
                    <Trash2 size={15} />
                  </button>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 460, margin: "56px auto 0", textAlign: "center" }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 23, color: C.text, letterSpacing: 0.5 }}>唯旅誌｜WIT JOURNAL</div>
            <div style={{ fontSize: 11.5, color: C.textSoft, marginTop: 6, letterSpacing: 1, fontStyle: "italic" }}>Little Trips, Slow Living.</div>
            <div style={{ fontSize: 13, color: C.textSoft, marginTop: 14 }}>多幣別 · 拍照記錄 · 分帳結算 · 即時同步</div>
            <div style={{ fontSize: 13, color: C.textSoft, marginTop: 24 }}>還沒有旅程，點左下角「＋」建立或加入一趟旅程吧</div>
          </div>
        )}
        <div style={{ textAlign: "center", fontSize: 12, color: C.textSoft, marginTop: 14, maxWidth: 420, margin: "14px auto 0" }}>
          把這個網頁連結和旅程代碼分享給旅伴，大家就能一起即時記帳
        </div>
        {initialJoinCode && !myTrips.some((t) => t.code === initialJoinCode) && (
          <div style={{ textAlign: "center", fontSize: 12.5, color: C.primary, marginTop: 10, fontWeight: 600 }}>
            偵測到旅程代碼 {initialJoinCode}，請輸入你的名字加入
          </div>
        )}
      </div>

      <button onClick={() => { setErr(""); setShowEntryModal(true); }} style={{
        position: "fixed", bottom: 24, right: 20, width: 56, height: 56, borderRadius: "50%",
        background: C.accent, border: "none", boxShadow: "0 6px 18px rgba(63,184,196,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 30,
      }}>
        <Plus size={26} color="#fff" />
      </button>

      {showEntryModal && (
        <Modal title="唯旅誌｜WIT JOURNAL" onClose={() => setShowEntryModal(false)}>
          <div style={{ display: "flex", background: C.surfaceAlt, borderRadius: 14, padding: 4, marginBottom: 18 }}>
            {[["create", "建立新旅程"], ["join", "加入旅程"]].map(([k, label]) => (
              <button key={k} onClick={() => { setMode(k); setErr(""); }} style={{
                flex: 1, padding: "9px 0", borderRadius: 10, border: "none", cursor: "pointer",
                fontWeight: 600, fontSize: 13.5, fontFamily: FONT_BODY,
                background: mode === k ? C.surface : "transparent",
                color: mode === k ? C.primary : C.textSoft,
                boxShadow: mode === k ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
              }}>{label}</button>
            ))}
          </div>

          {mode === "create" ? (
            <>
              <Field label="旅程名稱">
                <input className="tl-input" placeholder="例如：東京五日遊" value={tripName} onChange={(e) => setTripName(e.target.value)} />
              </Field>
              <Field label="主要幣別（花費將統一換算成此幣別顯示）">
                <select className="tl-input" value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value)}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 3 }}>
                  <Field label="出發日期（選填）">
                    <input className="tl-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </Field>
                </div>
                <div style={{ flex: 2 }}>
                  <Field label="旅程天數">
                    <input className="tl-input" type="number" min="0" value={dayCount} onChange={(e) => setDayCount(e.target.value)} />
                  </Field>
                </div>
              </div>
              <div style={{ fontSize: 11.5, color: C.textSoft, marginTop: -8, marginBottom: 14 }}>
                將自動產生「行前 / DAY1…DAY{dayCount || "N"} / 回國」分頁，方便依天數記帳
              </div>
              <Field label="你的名字">
                <input className="tl-input" placeholder="讓同行夥伴認出你" value={myName} onChange={(e) => setMyName(e.target.value)} />
              </Field>
              {err && <div style={{ color: C.danger, fontSize: 13, marginBottom: 10 }}>{err}</div>}
              <Btn full disabled={busy} onClick={() => onCreate({ tripName, baseCurrency, startDate, dayCount, myName })}>
                {busy ? "建立中…" : "建立旅程"}
              </Btn>
            </>
          ) : (
            <>
              <Field label="旅程代碼">
                <input className="tl-input" style={{ letterSpacing: 3, textTransform: "uppercase" }} placeholder="向旅伴索取 6 碼代碼" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} />
              </Field>
              <Field label="你的名字">
                <input className="tl-input" placeholder="讓同行夥伴認出你" value={joinName} onChange={(e) => setJoinName(e.target.value)} />
              </Field>
              {err && <div style={{ color: C.danger, fontSize: 13, marginBottom: 10 }}>{err}</div>}
              <Btn full disabled={busy} onClick={() => onJoin({ joinCode, joinName })}>
                {busy ? "加入中…" : "加入旅程"}
              </Btn>
            </>
          )}
        </Modal>
      )}

      {confirmRemove && (
        <Modal title="移除這趟旅程的紀錄？" onClose={() => setConfirmRemove(null)}>
          <div style={{ fontSize: 13.5, color: C.text, lineHeight: 1.7, marginBottom: 16 }}>
            只會清除這台裝置對「<b>{confirmRemove.name}</b>」的本機記憶，旅程本身、花費紀錄都還在雲端。之後可以用旅程代碼＋原本的名字重新加入。
          </div>
          <Btn full variant="danger" onClick={() => { onRemoveTrip(confirmRemove.code); setConfirmRemove(null); }}>確認移除</Btn>
        </Modal>
      )}
    </div>
  );
}
