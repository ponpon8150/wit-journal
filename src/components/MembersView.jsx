import React, { useState } from "react";
import { Plus, Trash2, Copy } from "lucide-react";
import { C, FONT_DISPLAY } from "../lib/helpers";
import { Card, Avatar, Tag, Btn, Modal, Field } from "./ui";
import RateManagerCard from "./RateManagerCard";

export default function MembersView({ trip, members, onAddMember, onLeave, onUpdateTripInfo, onUpdateRate, onDeleteMember, meId }) {
  const [name, setName] = useState(trip.name);
  const [startDate, setStartDate] = useState(trip.start_date || "");
  const [dayCount, setDayCount] = useState(trip.day_count || 0);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [copied, setCopied] = useState(false);
  const dirty = name.trim() !== trip.name || startDate !== (trip.start_date || "") || String(dayCount) !== String(trip.day_count || 0);
  const memberIdx = (id) => members.findIndex((m) => m.id === id);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (e) {}
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: C.text }}>旅程設定</div>
        <Field label="旅程名稱">
          <input className="tl-input" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 3 }}>
            <Field label="出發日期"><input className="tl-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
          </div>
          <div style={{ flex: 2 }}>
            <Field label="旅程天數"><input className="tl-input" type="number" min="0" value={dayCount} onChange={(e) => setDayCount(e.target.value)} /></Field>
          </div>
        </div>
        <div style={{ fontSize: 11.5, color: C.textSoft, marginTop: -8, marginBottom: dirty ? 10 : 0 }}>
          記帳時會依此產生「行前 / DAY1…DAY{dayCount || "N"} / 回國」分頁
        </div>
        {dirty && <Btn full onClick={() => onUpdateTripInfo(name.trim() || trip.name, startDate, parseInt(dayCount) || 0)}>儲存旅程設定</Btn>}
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>旅伴（{members.length}）</div>
          <button onClick={onAddMember} style={{ background: "none", border: "none", cursor: "pointer", color: C.primary, display: "flex", alignItems: "center", gap: 4, fontSize: 12.5 }}>
            <Plus size={14} /> 新增
          </button>
        </div>
        {members.length === 0 ? (
          <div style={{ fontSize: 12.5, color: C.textSoft }}>還沒有旅伴，點右上角新增</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {members.map((m) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar name={m.name} idx={memberIdx(m.id)} size={32} />
                  <span style={{ fontSize: 14 }}>{m.name}</span>
                  {m.id === meId && <Tag label="我" color={C.primary} />}
                </div>
                {m.id !== meId && (
                  <button onClick={() => setConfirmDelete(m)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textSoft, display: "flex", padding: 4 }}>
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <RateManagerCard trip={trip} onUpdateRate={onUpdateRate} />

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>旅程代碼</div>
          <button onClick={copyLink} style={{ background: "none", border: "none", cursor: "pointer", color: C.primary, display: "flex", alignItems: "center", gap: 4, fontSize: 12.5 }}>
            <Copy size={13} /> {copied ? "已複製" : "複製連結"}
          </button>
        </div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, letterSpacing: 6, color: C.primary }}>{trip.code}</div>
        <div style={{ fontSize: 12, color: C.textSoft, marginTop: 4 }}>把網址分享給旅伴，對方打開後選「加入旅程」，輸入這組代碼與自己的名字即可一起記帳，會即時同步。</div>
      </Card>

      <Btn variant="ghost" full onClick={onLeave}>返回旅程列表</Btn>

      {confirmDelete && (
        <Modal title="移除這位旅伴？" onClose={() => setConfirmDelete(null)}>
          <div style={{ fontSize: 13.5, color: C.text, lineHeight: 1.7, marginBottom: 16 }}>
            確定要移除 <b>{confirmDelete.name}</b> 嗎？已產生的花費紀錄不會被刪除，但之後不會再出現在分攤名單裡。
          </div>
          <Btn full variant="danger" onClick={() => { onDeleteMember(confirmDelete.id); setConfirmDelete(null); }}>確認移除</Btn>
        </Modal>
      )}
    </div>
  );
}
