import React, { useState } from "react";
import { Modal, Field, Btn } from "./ui";

export default function AddMemberModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  return (
    <Modal title="新增旅伴" onClose={onClose}>
      <Field label="旅伴名字">
        <input className="tl-input" placeholder="例如：小美（不需要她本人使用連結）" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Btn full onClick={() => name.trim() && onSave(name.trim())}>新增</Btn>
    </Modal>
  );
}
