import React, { useEffect, useMemo, useState } from "react";
import { Gift } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { C, FONT_DISPLAY, fmt, memberColor, flagFor, fetchLiveRate } from "../lib/helpers";
import { CATEGORIES } from "../lib/categories";
import { Card, Avatar, Tag } from "./ui";

export default function DashboardView({ trip, members, expenses, balances, meId, daigouItems = [], onUpdateRate }) {
  const totalBase = expenses.reduce((s, e) => s + Number(e.amount_base), 0);
  const myPaid = expenses.filter((e) => e.payer_id === meId).reduce((s, e) => s + Number(e.amount_base), 0);
  const myShare = expenses.reduce((s, e) => s + Number((e.participants || []).find((p) => p.memberId === meId)?.shareBase || 0), 0);

  // 旅遊幣別：可在總覽頁點國旗切換「旅程總花費」卡片顯示的幣別
  const travelCurrency = trip.travel_currency && trip.travel_currency !== trip.base_currency ? trip.travel_currency : null;
  const [displayCurrency, setDisplayCurrency] = useState(trip.base_currency);

  useEffect(() => {
    setDisplayCurrency(trip.base_currency);
  }, [trip.code, trip.base_currency]);

  // 如果旅遊幣別還沒有匯率，自動查一次即時匯率（跟新增花費時的邏輯一致）
  useEffect(() => {
    if (!travelCurrency || trip.rates?.[travelCurrency] != null || !onUpdateRate) return;
    let cancelled = false;
    fetchLiveRate(travelCurrency, trip.base_currency)
      .then(({ rate }) => {
        if (!cancelled) onUpdateRate(travelCurrency, Math.round(rate * 10000) / 10000);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [travelCurrency, trip.base_currency, trip.rates, onUpdateRate]);

  const travelRate = travelCurrency ? trip.rates?.[travelCurrency] : null;
  const convert = (amountBase) => {
    if (displayCurrency === trip.base_currency) return amountBase;
    if (!travelRate) return null;
    return amountBase / travelRate;
  };
  const flagBtnStyle = (active) => ({
    width: 32, height: 32, borderRadius: "50%", padding: 0, cursor: "pointer", fontSize: 15,
    lineHeight: 1, fontWeight: 700, boxSizing: "border-box", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    border: active ? "2px solid #fff" : "2px solid rgba(255,255,255,0.35)",
    background: active ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.1)",
  });

  const daigouTotal = daigouItems.reduce((s, it) => s + (it.purchase?.amountBase || 0), 0);
  const daigouCollected = daigouItems.reduce((s, it) => s + (it.purchase?.collected ? it.purchase.amountBase : 0), 0);
  const daigouPending = daigouTotal - daigouCollected;
  const daigouBoughtCount = daigouItems.filter((it) => it.bought).length;

  const byCategory = useMemo(() => {
    const m = {};
    expenses.forEach((e) => { m[e.category] = (m[e.category] || 0) + Number(e.amount_base); });
    return CATEGORIES.map((c) => ({ name: c.label, value: m[c.id] || 0, color: c.color })).filter((d) => d.value > 0);
  }, [expenses]);

  const byMember = members.map((m, idx) => ({
    name: m.name,
    paid: expenses.filter((e) => e.payer_id === m.id).reduce((s, e) => s + Number(e.amount_base), 0),
    color: memberColor(idx),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card style={{ background: `linear-gradient(155deg, ${C.primary} 45%, #52C2CC 100%)`, color: "#fff" }}>
        <div style={{ fontSize: 13, opacity: 0.85, paddingLeft: 20 }}>旅程總花費</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: travelCurrency ? "space-between" : "flex-end", marginTop: 2, paddingLeft: 20, paddingRight: 26 }}>
          {travelCurrency && (
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setDisplayCurrency(trip.base_currency)} title={`顯示為 ${trip.base_currency}`} style={flagBtnStyle(displayCurrency === trip.base_currency)}>
                {flagFor(trip.base_currency)}
              </button>
              <button onClick={() => setDisplayCurrency(travelCurrency)} title={`顯示為 ${travelCurrency}`} style={flagBtnStyle(displayCurrency === travelCurrency)}>
                {flagFor(travelCurrency)}
              </button>
            </div>
          )}
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 34 }}>
            {convert(totalBase) == null ? (
              <span style={{ fontSize: 15, opacity: 0.85 }}>查詢匯率中…</span>
            ) : (
              <>{fmt(convert(totalBase), displayCurrency)} <span style={{ fontSize: 16 }}>{displayCurrency}</span></>
            )}
          </div>
        </div>
        <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2, textAlign: "right", paddingRight: 26 }}>共 {expenses.length} 筆紀錄 · {members.length} 位旅伴</div>
        {meId && (
          <div style={{ display: "flex", marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.28)" }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 11, opacity: 0.85 }}>我先墊付了</div>
              <div style={{ fontSize: 17, fontWeight: 600, marginTop: 2 }}>{convert(myPaid) == null ? "—" : fmt(convert(myPaid), displayCurrency)}</div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.28)", margin: "0 14px" }} />
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 11, opacity: 0.85 }}>我的總花費</div>
              <div style={{ fontSize: 17, fontWeight: 600, marginTop: 2 }}>{convert(myShare) == null ? "—" : fmt(convert(myShare), displayCurrency)}</div>
            </div>
          </div>
        )}
      </Card>

      {daigouItems.length > 0 && (
        <Card style={{ background: "linear-gradient(135deg, #8AB89E, #A9D0BC)", color: "#fff" }}>
          <div style={{ fontSize: 13, opacity: 0.9, display: "flex", alignItems: "center", gap: 6 }}>
            <Gift size={14} /> 代購總花費
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: travelCurrency ? "space-between" : "flex-end", marginTop: 4, paddingRight: 26 }}>
            {travelCurrency && (
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setDisplayCurrency(trip.base_currency)} title={`顯示為 ${trip.base_currency}`} style={flagBtnStyle(displayCurrency === trip.base_currency)}>
                  {flagFor(trip.base_currency)}
                </button>
                <button onClick={() => setDisplayCurrency(travelCurrency)} title={`顯示為 ${travelCurrency}`} style={flagBtnStyle(displayCurrency === travelCurrency)}>
                  {flagFor(travelCurrency)}
                </button>
              </div>
            )}
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 30 }}>
              {convert(daigouTotal) == null ? (
                <span style={{ fontSize: 13, opacity: 0.85 }}>查詢匯率中…</span>
              ) : (
                <>{fmt(convert(daigouTotal), displayCurrency)} <span style={{ fontSize: 14 }}>{displayCurrency}</span></>
              )}
            </div>
          </div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4, textAlign: "right", paddingRight: 26 }}>共 {daigouItems.length} 項清單 · {daigouBoughtCount} 項已購買</div>
          {daigouTotal > 0 && (
            <div style={{ display: "flex", marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.28)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, opacity: 0.85 }}>已收款</div>
                <div style={{ fontSize: 17, fontWeight: 600, marginTop: 2 }}>{convert(daigouCollected) == null ? "—" : fmt(convert(daigouCollected), displayCurrency)}</div>
              </div>
              <div style={{ width: 1, background: "rgba(255,255,255,0.28)", margin: "0 14px" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, opacity: 0.85 }}>未收款</div>
                <div style={{ fontSize: 17, fontWeight: 600, marginTop: 2 }}>{convert(daigouPending) == null ? "—" : fmt(convert(daigouPending), displayCurrency)}</div>
              </div>
            </div>
          )}
        </Card>
      )}

      {byCategory.length > 0 && (
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: C.text }}>花費分類</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ position: "relative", width: 118, height: 118, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={38} outerRadius={57} paddingAngle={2}>
                    {byCategory.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${fmt(v, trip.base_currency)} ${trip.base_currency}`} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <div style={{ fontSize: 10, color: C.textSoft }}>合計</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{fmt(totalBase, trip.base_currency)}</div>
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
              {byCategory.map((d) => {
                const pct = totalBase > 0 ? (d.value / totalBase) * 100 : 0;
                return (
                  <div key={d.name} style={{ display: "grid", gridTemplateColumns: "52px 1fr auto", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, color: C.textSoft, overflow: "hidden", whiteSpace: "nowrap" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: d.color, display: "inline-block", flexShrink: 0 }} />{d.name}
                    </span>
                    <div style={{ height: 6, background: C.bg, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: d.color, borderRadius: 4 }} />
                    </div>
                    <span style={{ color: C.text, fontWeight: 600, textAlign: "right", whiteSpace: "nowrap" }}>
                      {fmt(d.value, trip.base_currency)} <span style={{ color: C.textSoft, fontWeight: 500 }}>({Math.round(pct)}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: C.text }}>墊付金額</div>
        <div style={{ width: "100%", height: Math.max(120, byMember.length * 40) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byMember} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} horizontal={false} />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 12, fill: C.text }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => `${fmt(v, trip.base_currency)} ${trip.base_currency}`} />
              <Bar dataKey="paid" radius={[0, 8, 8, 0]}>
                {byMember.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: C.text }}>目前淨結餘</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {members.map((m, idx) => {
            const b = balances[m.id] || 0;
            return (
              <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar name={m.name} idx={idx} />
                  <span style={{ fontSize: 14 }}>{m.name}</span>
                  {m.id === meId && <Tag label="我" color={C.primary} />}
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: b > 0.01 ? C.success : b < -0.01 ? C.warn : C.textSoft }}>
                  {b > 0.01 ? `+${fmt(b, trip.base_currency)}` : b < -0.01 ? fmt(b, trip.base_currency) : "已結清"}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
