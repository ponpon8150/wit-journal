import React, { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChevronDown } from "lucide-react";
import { C, FONT_DISPLAY, fmt, memberColor, flagFor, fetchLiveRate, daigouCollectedBase } from "../lib/helpers";
import { CATEGORIES } from "../lib/categories";
import { DAIGOU_CATEGORIES } from "../lib/daigouCategories";
import { Card, Avatar, Tag } from "./ui";

export default function DashboardView({ trip, members, expenses, balances, meId, daigouItems = [], onUpdateRate }) {
  const totalBase = expenses.reduce((s, e) => s + Number(e.amount_base), 0);
  const myPaid = expenses.filter((e) => e.payer_id === meId).reduce((s, e) => s + Number(e.amount_base), 0);
  const myShare = expenses.reduce((s, e) => s + Number((e.participants || []).find((p) => p.memberId === meId)?.shareBase || 0), 0);

  // 旅遊幣別：可在總覽頁點國旗切換顯示的幣別。
  // 「花費」那一組卡片（旅程總花費/花費分類/墊付金額/目前淨結餘）共用 feeCurrency，
  // 「代購」那一組卡片（代購總花費/代購分類）則用自己獨立的 daigouCurrency，
  // 兩組切換互不影響。
  const travelCurrency = trip.travel_currency && trip.travel_currency !== trip.base_currency ? trip.travel_currency : null;
  const [feeCurrency, setFeeCurrency] = useState(trip.base_currency);
  const [daigouCurrency, setDaigouCurrency] = useState(trip.base_currency);
  // 花費分類／墊付金額／目前淨結餘這三張卡片，收合在「旅程總花費」卡片下，一鍵開合全部。
  const [feeDetailsOpen, setFeeDetailsOpen] = useState(false);
  // 代購分類收合在「代購總花費」卡片下。
  const [daigouDetailsOpen, setDaigouDetailsOpen] = useState(false);

  useEffect(() => {
    setFeeCurrency(trip.base_currency);
    setDaigouCurrency(trip.base_currency);
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
  const convert = (amountBase, displayCurrency) => {
    if (displayCurrency === trip.base_currency) return amountBase;
    if (!travelRate) return null;
    return amountBase / travelRate;
  };
  const flagBtnStyle = (active) => ({
    width: 32, height: 32, borderRadius: "50%", padding: "0 0 3px", cursor: "pointer", fontSize: 15,
    lineHeight: 1, fontWeight: 700, boxSizing: "border-box", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    border: active ? "2px solid #fff" : "2px solid rgba(255,255,255,0.35)",
    background: active ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.1)",
  });

  const daigouTotal = daigouItems.reduce((s, it) => s + (it.purchase?.amountBase || 0), 0);
  const daigouCollected = daigouItems.reduce((s, it) => s + daigouCollectedBase(it.purchase), 0);
  const daigouPending = daigouTotal - daigouCollected;
  const daigouBoughtCount = daigouItems.filter((it) => it.bought).length;

  const byCategory = useMemo(() => {
    const m = {};
    expenses.forEach((e) => { m[e.category] = (m[e.category] || 0) + Number(e.amount_base); });
    return CATEGORIES.map((c) => ({ name: c.label, value: m[c.id] || 0, color: c.color })).filter((d) => d.value > 0);
  }, [expenses]);

  const byDaigouCategory = useMemo(() => {
    const m = {};
    daigouItems.forEach((it) => { m[it.category] = (m[it.category] || 0) + (it.purchase?.amountBase || 0); });
    return DAIGOU_CATEGORIES.map((c) => ({ name: c.label, value: m[c.id] || 0, color: c.color })).filter((d) => d.value > 0);
  }, [daigouItems]);

  const byMember = members.map((m, idx) => ({
    name: m.name,
    paid: expenses.filter((e) => e.payer_id === m.id).reduce((s, e) => s + Number(e.amount_base), 0),
    color: memberColor(idx),
  }));

  // 圓餅圖/長條圖的比例（角度、長度）用原始金額算，不受幣別切換影響；
  // 只有「顯示給人看的數字」才套用 convert()，這樣切換幣別時版面不會跳動。
  const feeTotalDisplay = convert(totalBase, feeCurrency);
  const daigouTotalDisplay = convert(daigouTotal, daigouCurrency);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card style={{ background: `linear-gradient(155deg, ${C.primary} 45%, #52C2CC 100%)`, color: "#fff" }}>
        <div style={{ fontSize: 16, fontWeight: 700, opacity: 0.95, paddingLeft: 20 }}>旅程總花費</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: travelCurrency ? "space-between" : "flex-end", marginTop: 2, paddingLeft: 20, paddingRight: 26 }}>
          {travelCurrency && (
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setFeeCurrency(trip.base_currency)} title={`顯示為 ${trip.base_currency}`} style={flagBtnStyle(feeCurrency === trip.base_currency)}>
                {flagFor(trip.base_currency)}
              </button>
              <button onClick={() => setFeeCurrency(travelCurrency)} title={`顯示為 ${travelCurrency}`} style={flagBtnStyle(feeCurrency === travelCurrency)}>
                {flagFor(travelCurrency)}
              </button>
            </div>
          )}
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 34 }}>
            {feeTotalDisplay == null ? (
              <span style={{ fontSize: 15, opacity: 0.85 }}>查詢匯率中…</span>
            ) : (
              <>{fmt(feeTotalDisplay, feeCurrency)} <span style={{ fontSize: 16 }}>{feeCurrency}</span></>
            )}
          </div>
        </div>
        <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2, textAlign: "right", paddingRight: 26 }}>共 {expenses.length} 筆紀錄 · {members.length} 位旅伴</div>
        {meId && (
          <div style={{ display: "flex", marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.28)" }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 11, opacity: 0.85 }}>我先墊付了</div>
              <div style={{ fontSize: 17, fontWeight: 600, marginTop: 2 }}>{convert(myPaid, feeCurrency) == null ? "—" : fmt(convert(myPaid, feeCurrency), feeCurrency)}</div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.28)", margin: "0 14px" }} />
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 11, opacity: 0.85 }}>我的總花費</div>
              <div style={{ fontSize: 17, fontWeight: 600, marginTop: 2 }}>{convert(myShare, feeCurrency) == null ? "—" : fmt(convert(myShare, feeCurrency), feeCurrency)}</div>
            </div>
          </div>
        )}
        <button
          onClick={() => setFeeDetailsOpen((v) => !v)}
          style={{
            width: "100%", background: "none", border: "none", cursor: "pointer", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.28)", fontSize: 12.5, opacity: 0.9,
          }}
        >
          {feeDetailsOpen ? "收合花費明細" : "展開花費明細"}
          <ChevronDown size={14} style={{ transform: feeDetailsOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
        </button>
      </Card>

      {feeDetailsOpen && (
        <>
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
                      <Tooltip formatter={(v) => { const c = convert(v, feeCurrency); return c == null ? "查詢匯率中…" : `${fmt(c, feeCurrency)} ${feeCurrency}`; }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                    <div style={{ fontSize: 10, color: C.textSoft }}>合計</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{feeTotalDisplay == null ? "—" : fmt(feeTotalDisplay, feeCurrency)}</div>
                  </div>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
                  {byCategory.map((d) => {
                    const pct = totalBase > 0 ? (d.value / totalBase) * 100 : 0;
                    const display = convert(d.value, feeCurrency);
                    return (
                      <div key={d.name} style={{ display: "grid", gridTemplateColumns: "52px 1fr auto", alignItems: "center", gap: 8, fontSize: 12 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 5, color: C.textSoft, overflow: "hidden", whiteSpace: "nowrap" }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: d.color, display: "inline-block", flexShrink: 0 }} />{d.name}
                        </span>
                        <div style={{ height: 6, background: C.bg, borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: d.color, borderRadius: 4 }} />
                        </div>
                        <span style={{ color: C.text, fontWeight: 600, textAlign: "right", whiteSpace: "nowrap" }}>
                          {display == null ? "—" : fmt(display, feeCurrency)} <span style={{ color: C.textSoft, fontWeight: 500 }}>({Math.round(pct)}%)</span>
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
                  <Tooltip formatter={(v) => { const c = convert(v, feeCurrency); return c == null ? "查詢匯率中…" : `${fmt(c, feeCurrency)} ${feeCurrency}`; }} />
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
                const display = convert(b, feeCurrency);
                return (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Avatar name={m.name} idx={idx} />
                      <span style={{ fontSize: 14 }}>{m.name}</span>
                      {m.id === meId && <Tag label="我" color={C.primary} />}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: b > 0.01 ? C.success : b < -0.01 ? C.warn : C.textSoft }}>
                      {display == null ? "查詢匯率中…" : b > 0.01 ? `+${fmt(display, feeCurrency)}` : b < -0.01 ? fmt(display, feeCurrency) : "已結清"}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}

      {(daigouItems.length > 0 || byDaigouCategory.length > 0) && (
      <div style={{ marginTop: 10, paddingTop: 24, borderTop: `1px solid ${C.line}`, display: "flex", flexDirection: "column", gap: 14 }}>

      {daigouItems.length > 0 && (
        <Card style={{ background: "linear-gradient(135deg, #8AB89E, #A9D0BC)", color: "#fff" }}>
          <div style={{ fontSize: 16, fontWeight: 700, opacity: 0.95, paddingLeft: 20 }}>代購總花費</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: travelCurrency ? "space-between" : "flex-end", marginTop: 4, paddingLeft: 20, paddingRight: 26 }}>
            {travelCurrency && (
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setDaigouCurrency(trip.base_currency)} title={`顯示為 ${trip.base_currency}`} style={flagBtnStyle(daigouCurrency === trip.base_currency)}>
                  {flagFor(trip.base_currency)}
                </button>
                <button onClick={() => setDaigouCurrency(travelCurrency)} title={`顯示為 ${travelCurrency}`} style={flagBtnStyle(daigouCurrency === travelCurrency)}>
                  {flagFor(travelCurrency)}
                </button>
              </div>
            )}
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 30 }}>
              {daigouTotalDisplay == null ? (
                <span style={{ fontSize: 13, opacity: 0.85 }}>查詢匯率中…</span>
              ) : (
                <>{fmt(daigouTotalDisplay, daigouCurrency)} <span style={{ fontSize: 14 }}>{daigouCurrency}</span></>
              )}
            </div>
          </div>
          <div style={{ fontSize: 12.5, opacity: 0.85, marginTop: 4, textAlign: "right", paddingRight: 26 }}>共 {daigouItems.length} 項清單 · {daigouBoughtCount} 項已購買</div>
          {daigouTotal > 0 && (
            <div style={{ display: "flex", marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.28)" }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 11, opacity: 0.85 }}>已收款</div>
                <div style={{ fontSize: 17, fontWeight: 600, marginTop: 2 }}>{convert(daigouCollected, daigouCurrency) == null ? "—" : fmt(convert(daigouCollected, daigouCurrency), daigouCurrency)}</div>
              </div>
              <div style={{ width: 1, background: "rgba(255,255,255,0.28)", margin: "0 14px" }} />
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 11, opacity: 0.85 }}>未收款</div>
                <div style={{ fontSize: 17, fontWeight: 600, marginTop: 2 }}>{convert(daigouPending, daigouCurrency) == null ? "—" : fmt(convert(daigouPending, daigouCurrency), daigouCurrency)}</div>
              </div>
            </div>
          )}
          {byDaigouCategory.length > 0 && (
            <button
              onClick={() => setDaigouDetailsOpen((v) => !v)}
              style={{
                width: "100%", background: "none", border: "none", cursor: "pointer", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                marginTop: 14, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.28)", fontSize: 12.5, opacity: 0.9,
              }}
            >
              {daigouDetailsOpen ? "收合代購明細" : "展開代購明細"}
              <ChevronDown size={14} style={{ transform: daigouDetailsOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
            </button>
          )}
        </Card>
      )}

      {daigouDetailsOpen && byDaigouCategory.length > 0 && (
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: C.text }}>代購分類</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ position: "relative", width: 118, height: 118, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byDaigouCategory} dataKey="value" nameKey="name" innerRadius={38} outerRadius={57} paddingAngle={2}>
                    {byDaigouCategory.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => { const c = convert(v, daigouCurrency); return c == null ? "查詢匯率中…" : `${fmt(c, daigouCurrency)} ${daigouCurrency}`; }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <div style={{ fontSize: 10, color: C.textSoft }}>合計</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{daigouTotalDisplay == null ? "—" : fmt(daigouTotalDisplay, daigouCurrency)}</div>
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
              {byDaigouCategory.map((d) => {
                const pct = daigouTotal > 0 ? (d.value / daigouTotal) * 100 : 0;
                const display = convert(d.value, daigouCurrency);
                return (
                  <div key={d.name} style={{ display: "grid", gridTemplateColumns: "60px 1fr auto", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, color: C.textSoft, overflow: "hidden", whiteSpace: "nowrap" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: d.color, display: "inline-block", flexShrink: 0 }} />{d.name}
                    </span>
                    <div style={{ height: 6, background: C.bg, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: d.color, borderRadius: 4 }} />
                    </div>
                    <span style={{ color: C.text, fontWeight: 600, textAlign: "right", whiteSpace: "nowrap" }}>
                      {display == null ? "—" : fmt(display, daigouCurrency)} <span style={{ color: C.textSoft, fontWeight: 500 }}>({Math.round(pct)}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {daigouTotal > 0 && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.line}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.textSoft, marginBottom: 6 }}>
                <span>已收款 {Math.round((daigouCollected / daigouTotal) * 100)}%</span>
                <span>未收款 {Math.round((daigouPending / daigouTotal) * 100)}%</span>
              </div>
              <div style={{ display: "flex", height: 6, borderRadius: 4, overflow: "hidden", background: C.bg }}>
                {daigouCollected > 0 && <div style={{ width: `${(daigouCollected / daigouTotal) * 100}%`, background: C.success }} />}
                {daigouPending > 0 && <div style={{ width: `${(daigouPending / daigouTotal) * 100}%`, background: C.warn }} />}
              </div>
            </div>
          )}
        </Card>
      )}

      </div>
      )}
    </div>
  );
}
