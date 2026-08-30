import React, { useState } from "react";
import { C, decimalsFor, roundToCurrency, fmt, uid } from "../lib/helpers";
import { Modal, Field, Btn } from "./ui";

export default function RecordSettlementModal({ trip, members, suggestion, onClose, onSave, meId }) {
  const [from, setFrom] = useState(suggestion?.from || members[0]?.id);
  const [to, setTo] = useState(suggestion?.to || members[1]?.id);
  const [amount, setAmount] = useState(suggestion ? fmt(suggestion.amount, trip.base_currency) : "");
  const [err, setErr] = useState("");
  const labelFor = (m) => `${m.name}${m.id === meId ? "（我）" : ""}`;
  return (
    <Modal title="登記還款" onClose={onClose}>
      <Field label="付款人（還錢的人）">
        <select className="tl-input" value={from} onChange={(e) => setFrom(e.target.value)}>
          {members.map((m) => <option key={m.id} value={m.id}>{labelFor(m)}</option>)}
        </select>
      </Field>
      <Field label="收款人">
        <select className="tl-input" value={to} onChange={(e) => setTo(e.target.value)}>
          {members.map((m) => <option key={m.id} value={m.id}>{labelFor(m)}</option>)}
        </select>
      </Field>
      <Field label={`金額（${trip.base_currency}）`}>
        <input className="tl-input" type="number" step={decimalsFor(trip.base_currency) === 0 ? "1" : "0.01"} value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>
      {err && <div style={{ color: C.danger, fontSize: 13, marginBottom: 10 }}>{err}</div>}
      <Btn full onClick={() => {
        if (from === to) return setErr("付款人與收款人不能相同");
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) return setErr("請輸入正確金額");
        onSave({ id: uid(), from, to, amount: roundToCurrency(amt, trip.base_currency), date: new Date().toISOString() });
      }}>確認登記</Btn>
    </Modal>
  );
}
