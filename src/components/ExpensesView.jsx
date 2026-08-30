import React, { useState, useMemo } from "react";
import { LayoutGrid, Pencil, Trash2 } from "lucide-react";
import { C, fmt } from "../lib/helpers";
import { CATEGORIES, catMeta } from "../lib/categories";
import { Card, Avatar } from "./ui";

export default function ExpensesView({ trip, members, expenses, onDelete, onEdit, selectedDayId, onSelectDay, days }) {
  const [filterCat, setFilterCat] = useState("all");
  const [viewPhoto, setViewPhoto] = useState(null);
  const memberName = (id) => members.find((m) => m.id === id)?.name || "已離開的旅伴";
  const memberIdx = (id) => members.findIndex((m) => m.id === id);

  const dayTotal = (dayId) => expenses.filter((e) => (e.day_id || "pre") === dayId).reduce((s, e) => s + Number(e.amount_base), 0);

  const byDay = selectedDayId === "all" ? expenses : expenses.filter((e) => (e.day_id || "pre") === selectedDayId);
  const filtered = filterCat === "all" ? byDay : byDay.filter((e) => e.category === filterCat);
  const sorted = useMemo(() => [...filtered].sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at)), [filtered]);

  return (
    <div>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10 }}>
        <button onClick={() => onSelectDay("all")} style={{
          padding: "7px 13px", borderRadius: 12, whiteSpace: "nowrap", fontSize: 12.5, cursor: "pointer",
          border: selectedDayId === "all" ? `1.5px solid ${C.accent}` : `1px solid ${C.line}`,
          background: selectedDayId === "all" ? `${C.accent}18` : "#fff", color: selectedDayId === "all" ? C.accent : C.textSoft, fontWeight: 700,
        }}>全部行程</button>
        {days.map((d) => {
          const active = selectedDayId === d.id;
          const total = dayTotal(d.id);
          return (
            <button key={d.id} onClick={() => onSelectDay(d.id)} style={{
              padding: "7px 13px", borderRadius: 12, whiteSpace: "nowrap", cursor: "pointer",
              border: active ? `1.5px solid ${C.accent}` : `1px solid ${C.line}`,
              background: active ? `${C.accent}18` : "#fff", color: active ? C.accent : C.textSoft,
              display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.3,
            }}>
              <span style={{ fontSize: 12.5, fontWeight: 700 }}>{d.label}</span>
              <span style={{ fontSize: 9.5, opacity: 0.8 }}>{d.date ? d.date.slice(5) : (total > 0 ? fmt(total, trip.base_currency) : "")}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${CATEGORIES.length + 1}, 1fr)`, gap: 6, marginBottom: 10 }}>
        <button onClick={() => setFilterCat("all")} title="全部" style={{
          display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 0", borderRadius: 12,
          border: filterCat === "all" ? `1.5px solid ${C.accent}` : `1px solid ${C.line}`,
          background: filterCat === "all" ? `${C.accent}18` : "#fff", cursor: "pointer",
          color: filterCat === "all" ? C.accent : C.textSoft,
        }}>
          <LayoutGrid size={18} strokeWidth={filterCat === "all" ? 2.4 : 1.8} />
        </button>
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          const active = filterCat === c.id;
          return (
            <button key={c.id} onClick={() => setFilterCat(c.id)} title={c.label} style={{
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

      {sorted.length === 0 ? (
        <div style={{ textAlign: "center", color: C.textSoft, fontSize: 13.5, padding: "40px 0" }}>還沒有花費紀錄，點右下角「＋」新增第一筆吧</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sorted.map((e) => {
            const meta = catMeta(e.category);
            const Icon = meta.icon;
            return (
              <Card key={e.id} style={{ padding: 12 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  {e.photo_url ? (
                    <img src={e.photo_url} onClick={() => setViewPhoto(e.photo_url)} alt="" style={{ width: 52, height: 52, borderRadius: 12, objectFit: "cover", cursor: "pointer", flexShrink: 0 }} />
                  ) : (
                    <div onClick={() => onEdit(e)} style={{ width: 52, height: 52, borderRadius: 12, background: `${meta.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                      <Icon size={22} color={meta.color} />
                    </div>
                  )}
                  <div onClick={() => onEdit(e)} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: C.text }}>{e.title}</div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 14.5, fontWeight: 700, color: C.text }}>{fmt(e.amount, e.currency)} {e.currency}</div>
                        {e.currency !== trip.base_currency && (
                          <div style={{ fontSize: 11, color: C.textSoft }}>≈ {fmt(e.amount_base, trip.base_currency)} {trip.base_currency}</div>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: C.textSoft, marginTop: 3 }}>
                      {memberName(e.payer_id)} 先付 · {new Date(e.occurred_at).toLocaleDateString("zh-TW")} · 由 {(e.participants || []).length} 人分攤
                    </div>
                    {e.note && (
                      <div style={{ fontSize: 11.5, color: C.textSoft, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        備註：{e.note.replace(/\n/g, "　")}
                      </div>
                    )}
                    <div style={{ display: "flex", marginTop: 6 }}>
                      {(e.participants || []).map((p) => (
                        <div key={p.memberId} style={{ marginLeft: -6 }}>
                          <Avatar name={memberName(p.memberId)} idx={memberIdx(p.memberId)} size={20} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
                    <button onClick={() => onEdit(e)} style={{ background: "none", border: "none", cursor: "pointer", color: C.primary }}>
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => onDelete(e.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textSoft }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {viewPhoto && (
        <div onClick={() => setViewPhoto(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 20 }}>
          <img src={viewPhoto} alt="收據" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 12 }} />
        </div>
      )}
    </div>
  );
}
