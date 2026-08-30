import React, { useState, useMemo } from "react";
import { Check, ArrowRight } from "lucide-react";
import { C, fmt, simplifyDebts } from "../lib/helpers";
import { Card, Avatar, Tag, Btn, Modal } from "./ui";

export default function SettlementView({ trip, members, balances, settlements, onOpenRecord, meId, onFinalize, onUnfreeze }) {
  const suggestions = useMemo(() => simplifyDebts(balances), [balances]);
  const memberName = (id) => members.find((m) => m.id === id)?.name || "已離開的旅伴";
  const memberIdx = (id) => members.findIndex((m) => m.id === id);
  const [confirmFinalize, setConfirmFinalize] = useState(false);

  const frozen = trip.final_settlement;
  const frozenLines = useMemo(() => {
    if (!frozen) return [];
    return frozen.lines.map((line) => {
      const paid = settlements
        .filter((s) => s.from_member === line.from && s.to_member === line.to && new Date(s.occurred_at) > new Date(frozen.frozenAt))
        .reduce((sum, s) => sum + Number(s.amount), 0);
      return { ...line, paid, remaining: Math.max(0, line.amount - paid) };
    });
  }, [frozen, settlements]);
  const allSettled = frozen && frozenLines.every((l) => l.remaining < 0.01);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {frozen ? (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>總結算清單</div>
            <button onClick={onUnfreeze} style={{ background: "none", border: "none", cursor: "pointer", color: C.textSoft, fontSize: 11.5, whiteSpace: "nowrap" }}>解除總結算</button>
          </div>
          <div style={{ fontSize: 12, color: C.textSoft, marginBottom: 12 }}>
            已於 {new Date(frozen.frozenAt).toLocaleString("zh-TW")} 凍結金額，之後的還款只會扣減這張清單，不會重新配對對象
          </div>
          {allSettled ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.success, fontSize: 14, padding: "10px 0" }}>
              <Check size={18} /> 太好了，本次旅程已全部結清！
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {frozenLines.map((line) => {
                const settled = line.remaining < 0.01;
                return (
                  <div key={line.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", background: C.bg, borderRadius: 14,
                    padding: "10px 12px", opacity: settled ? 0.55 : 1,
                  }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, flexWrap: "wrap" }}>
                        <Avatar name={memberName(line.from)} idx={memberIdx(line.from)} size={24} />
                        <span style={{ fontWeight: 700, textDecoration: settled ? "line-through" : "none" }}>{memberName(line.from)}</span>
                        {line.from === meId && <Tag label="我" color={C.primary} />}
                        <ArrowRight size={13} color={C.textSoft} />
                        <Avatar name={memberName(line.to)} idx={memberIdx(line.to)} size={24} />
                        <span style={{ fontWeight: 700, textDecoration: settled ? "line-through" : "none" }}>{memberName(line.to)}</span>
                        {line.to === meId && <Tag label="我" color={C.primary} />}
                      </div>
                      {line.paid > 0 && !settled && (
                        <div style={{ fontSize: 11, color: C.textSoft }}>原欠 {fmt(line.amount, trip.base_currency)}，已還 {fmt(line.paid, trip.base_currency)}</div>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                      {settled ? (
                        <Check size={18} color={C.success} />
                      ) : (
                        <>
                          <span style={{ fontWeight: 700, color: C.warn }}>{fmt(line.remaining, trip.base_currency)} {trip.base_currency}</span>
                          <Btn variant="subtle" onClick={() => onOpenRecord({ from: line.from, to: line.to, amount: line.remaining })}>還款</Btn>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: C.text }}>結算建議</div>
          <div style={{ fontSize: 12, color: C.textSoft, marginBottom: 12 }}>已自動扣除先前登記的還款，只顯示尚未結清的部分</div>
          {suggestions.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.success, fontSize: 14, padding: "10px 0" }}>
              <Check size={18} /> 太好了，目前所有人都已結清！
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {suggestions.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.bg, borderRadius: 14, padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, flexWrap: "wrap" }}>
                    <Avatar name={memberName(s.from)} idx={memberIdx(s.from)} size={24} />
                    <span style={{ fontWeight: 700 }}>{memberName(s.from)}</span>
                    {s.from === meId && <Tag label="我" color={C.primary} />}
                    <ArrowRight size={13} color={C.textSoft} />
                    <Avatar name={memberName(s.to)} idx={memberIdx(s.to)} size={24} />
                    <span style={{ fontWeight: 700 }}>{memberName(s.to)}</span>
                    {s.to === meId && <Tag label="我" color={C.primary} />}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontWeight: 700, color: C.warn }}>{fmt(s.amount, trip.base_currency)} {trip.base_currency}</span>
                    <Btn variant="subtle" onClick={() => onOpenRecord(s)}>還款</Btn>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.line}` }}>
            <div style={{ fontSize: 11.5, color: C.textSoft, marginBottom: 8 }}>回國正式結清了嗎？按下去把金額凍結，之後就找他/她討錢囉</div>
            <Btn variant="ghost" full onClick={() => setConfirmFinalize(true)}>旅程總結算</Btn>
          </div>
        </Card>
      )}

      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: C.text }}>還款紀錄</div>
        {settlements.length === 0 ? (
          <div style={{ fontSize: 13, color: C.textSoft }}>尚無還款紀錄</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[...settlements].sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at)).map((s) => (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: C.text }}><b>{memberName(s.from_member)}</b> 還給 <b>{memberName(s.to_member)}</b></span>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: C.success, fontWeight: 700 }}>{fmt(s.amount, trip.base_currency)} {trip.base_currency}</span>
                  <span style={{ color: C.textSoft, fontSize: 11 }}>{new Date(s.occurred_at).toLocaleDateString("zh-TW")}</span>
                </span>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 12 }}>
          <Btn variant="ghost" full onClick={() => onOpenRecord(null)}>手動登記</Btn>
        </div>
      </Card>

      {confirmFinalize && (
        <Modal title="旅程總結算？" onClose={() => setConfirmFinalize(false)}>
          <div style={{ fontSize: 13.5, color: C.text, lineHeight: 1.7, marginBottom: 16 }}>
            將凍結目前 {suggestions.length} 筆結算建議，之後還款只扣減對應金額，不再重新配對。可隨時「解除總結算」復原。
          </div>
          <Btn full onClick={() => { onFinalize(suggestions); setConfirmFinalize(false); }}>確認凍結，完成總結算</Btn>
        </Modal>
      )}
    </div>
  );
}
