import React, { useState, useMemo } from "react";
import { Gift, Plus, Check, Pencil, Trash2 } from "lucide-react";
import { C, FONT_DISPLAY, fmt } from "../lib/helpers";
import { Card, Avatar } from "./ui";

export default function DaigouListView({ trip, daigouItems, onEdit, onDelete, onOpenPurchase, onUnmarkBought, onToggleCollected, onAddForTarget }) {
  const [zoomPhoto, setZoomPhoto] = useState(null);

  const groups = useMemo(() => {
    const byTarget = {};
    daigouItems.forEach((it) => {
      if (!byTarget[it.targetName]) byTarget[it.targetName] = [];
      byTarget[it.targetName].push(it);
    });
    return Object.entries(byTarget).map(([targetName, items]) => ({ targetName, items })).sort((a, b) => a.targetName.localeCompare(b.targetName, "zh-Hant"));
  }, [daigouItems]);

  const myTotal = daigouItems.reduce((s, it) => s + (it.purchase?.amountBase || 0), 0);
  const collectedTotal = daigouItems.reduce((s, it) => s + (it.purchase?.collected ? it.purchase.amountBase : 0), 0);
  const pendingTotal = myTotal - collectedTotal;
  const boughtTotalCount = daigouItems.filter((it) => it.bought).length;

  return (
    <div>
      <Card style={{ background: `linear-gradient(135deg, #8AB89E, #A9D0BC)`, color: "#fff", marginBottom: 14 }}>
        <div style={{ fontSize: 13, opacity: 0.9, display: "flex", alignItems: "center", gap: 6 }}>
          <Gift size={14} /> 我的代購總花費
        </div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 30, marginTop: 4 }}>{fmt(myTotal, trip.base_currency)} <span style={{ fontSize: 14 }}>{trip.base_currency}</span></div>
        <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>共 {daigouItems.length} 項清單 · {boughtTotalCount} 項已購買</div>
        {myTotal > 0 && (
          <div style={{ display: "flex", marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.28)" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, opacity: 0.85 }}>已收款</div>
              <div style={{ fontSize: 17, fontWeight: 700, marginTop: 2 }}>{fmt(collectedTotal, trip.base_currency)}</div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.28)", margin: "0 14px" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, opacity: 0.85 }}>未收款</div>
              <div style={{ fontSize: 17, fontWeight: 700, marginTop: 2 }}>{fmt(pendingTotal, trip.base_currency)}</div>
            </div>
          </div>
        )}
      </Card>

      <div style={{ fontSize: 12, color: C.textSoft, marginBottom: 12 }}>私人清單，只存在你這台裝置；勾選「已購買」直接記錄花了多少</div>
      {groups.length === 0 ? (
        <div style={{ textAlign: "center", color: C.textSoft, fontSize: 13.5, padding: "40px 0" }}>還沒有代購清單，點右下角「＋」新增第一項吧</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {groups.map((g) => {
            const boughtCount = g.items.filter((it) => it.bought).length;
            const groupTotal = g.items.reduce((s, it) => s + (it.purchase?.amountBase || 0), 0);
            return (
              <Card key={g.targetName}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Avatar name={g.targetName} idx={g.targetName.charCodeAt(0)} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{g.targetName}</span>
                    <button onClick={() => onAddForTarget(g.targetName)} style={{ background: "none", border: "none", cursor: "pointer", color: "#5F9179", display: "flex", alignItems: "center", padding: 2 }}>
                      <Plus size={15} />
                    </button>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11.5, color: C.textSoft }}>{boughtCount}/{g.items.length} 已購買</div>
                    {groupTotal > 0 && <div style={{ fontSize: 12, color: "#5F9179", fontWeight: 700 }}>{fmt(groupTotal, trip.base_currency)} {trip.base_currency}</div>}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {g.items.map((it) => {
                    const displayPhoto = it.purchase?.receiptPhoto || it.photo;
                    return (
                      <div key={it.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <button onClick={() => (it.bought ? onUnmarkBought(it.id) : onOpenPurchase(it))} style={{
                          width: 22, height: 22, borderRadius: "50%", border: `1.5px solid ${it.bought ? C.success : C.line}`,
                          background: it.bought ? C.success : "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", flexShrink: 0, marginTop: 2,
                        }}>
                          {it.bought && <Check size={13} color="#fff" />}
                        </button>
                        {displayPhoto && (
                          <img src={displayPhoto} onClick={() => setZoomPhoto(displayPhoto)} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover", cursor: "pointer", flexShrink: 0 }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div onClick={() => onEdit(it)} style={{ cursor: "pointer" }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, textDecoration: it.bought ? "line-through" : "none" }}>
                              {it.name}{it.qty ? ` · ${it.qty}` : ""}
                            </div>
                            {it.note && <div style={{ fontSize: 12, color: C.textSoft, marginTop: 1 }}>{it.note}</div>}
                          </div>
                          {it.purchase && (
                            <div style={{ marginTop: 4 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 11.5, color: C.success, fontWeight: 600 }}>
                                  已花費 {fmt(it.purchase.amount, it.purchase.currency)} {it.purchase.currency}
                                  {it.purchase.currency !== trip.base_currency && ` (≈ ${fmt(it.purchase.amountBase, trip.base_currency)} ${trip.base_currency})`}
                                </span>
                                <button onClick={() => onOpenPurchase(it)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textSoft, display: "flex", padding: 0 }} title="編輯金額／幣別／匯率">
                                  <Pencil size={12} />
                                </button>
                                <button onClick={() => onToggleCollected(it.id)} style={{
                                  fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6, cursor: "pointer", border: "none",
                                  color: it.purchase.collected ? C.success : C.warn,
                                  background: it.purchase.collected ? `${C.success}18` : `${C.warn}18`,
                                }}>
                                  {it.purchase.collected ? "已收款 ✓" : "未收款"}
                                </button>
                              </div>
                              {it.purchase.receiptNote && (
                                <div style={{ fontSize: 11, color: C.textSoft, marginTop: 4, whiteSpace: "pre-line", background: C.bg, borderRadius: 8, padding: "6px 8px" }}>
                                  {it.purchase.receiptNote}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <button onClick={() => onDelete(it.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textSoft, flexShrink: 0 }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {zoomPhoto && (
        <div onClick={() => setZoomPhoto(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 20 }}>
          <img src={zoomPhoto} alt="照片放大" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 12 }} />
        </div>
      )}
    </div>
  );
}
