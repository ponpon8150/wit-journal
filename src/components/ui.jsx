import React, { useRef } from "react";
import { X, Camera, Loader2 } from "lucide-react";
import { C, FONT_BODY, FONT_DISPLAY, memberColor } from "../lib/helpers";
import { CoverPresetArt } from "../lib/coverPresets";

export function Avatar({ name, idx, size = 28 }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%", background: memberColor(idx),
        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.4, fontWeight: 600, flexShrink: 0,
      }}
    >
      {name?.[0] || "?"}
    </div>
  );
}

export function Tag({ label, color }) {
  return (
    <span style={{ fontSize: 10, color, background: `${color}18`, padding: "2px 6px", borderRadius: 6, fontWeight: 700, flexShrink: 0 }}>
      {label}
    </span>
  );
}

export function Btn({ children, onClick, variant = "primary", style, disabled, full, type = "button" }) {
  const base = {
    padding: "10px 18px", borderRadius: 14, fontSize: 14, fontWeight: 600,
    border: "none", cursor: disabled ? "not-allowed" : "pointer", display: "inline-flex",
    alignItems: "center", justifyContent: "center", gap: 6, transition: "opacity .15s",
    opacity: disabled ? 0.5 : 1, width: full ? "100%" : "auto", fontFamily: FONT_BODY,
  };
  const variants = {
    primary: { background: C.primary, color: "#fff" },
    accent: { background: C.accent, color: "#fff" },
    ghost: { background: "transparent", color: C.primary, border: `1px solid ${C.primary}` },
    subtle: { background: C.surfaceAlt, color: C.text },
    danger: { background: "transparent", color: C.danger },
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

export function Card({ children, style }) {
  return (
    <div style={{ background: C.surface, borderRadius: 20, padding: 16, boxShadow: "0 2px 14px rgba(46,59,62,0.06)", ...style }}>
      {children}
    </div>
  );
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(46,59,62,0.35)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }}>
      <div style={{
        background: C.bg, width: "100%", maxWidth: wide ? "min(94vw, 640px)" : "min(94vw, 480px)",
        maxHeight: "88vh", overflowY: "auto", borderRadius: "24px 24px 0 0", fontFamily: FONT_BODY,
      }}>
        <div style={{
          position: "sticky", top: 0, zIndex: 5, background: C.bg,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "20px 20px 14px", borderRadius: "24px 24px 0 0",
        }}>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: C.text, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: C.surfaceAlt, border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <X size={16} color={C.text} />
          </button>
        </div>
        <div style={{ padding: "0 20px 20px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 13, color: C.textSoft, marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {children}
    </div>
  );
}

export function Toast({ text, tone }) {
  if (!text) return null;
  const bg = tone === "error" ? "#B5563F" : tone === "warn" ? "#D98B5F" : "#2E3B3E";
  return (
    <div className="tl-toast" style={{
      position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: 100, zIndex: 90,
      background: bg, color: "#fff", padding: "10px 18px", borderRadius: 14, fontSize: 13,
      boxShadow: "0 6px 18px rgba(0,0,0,0.25)", maxWidth: "90%", textAlign: "center",
    }}>
      {text}
    </div>
  );
}

export function HorizonBanner({ compact, height, photoUrl, presetId }) {
  const h = height || (compact ? 120 : 220);
  return (
    <div style={{ position: "relative", width: "100%", height: h, overflow: "hidden" }}>
      {photoUrl ? (
        <img src={photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : (
        <CoverPresetArt id={presetId || "default"} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   頭圖選擇清單：給「旅伴」分頁的「旅程設定」卡片用。
   不把按鈕直接放在頭圖上面（避免遮到照片），改成在設定裡點「更換頭圖」
   跳出這個清單：可以上傳自己的照片，或是從內建插畫裡挑一張。
   ------------------------------------------------------------------ */
export function CoverPickerModal({ onClose, onSelectPreset, onUploadFile, uploading, presetList }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ""; // 清空，確保下次選同一張照片也會觸發 onChange
    if (file && onUploadFile) onUploadFile(file);
  };

  return (
    <Modal title="更換頭圖" onClose={onClose}>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
      <Btn full onClick={() => fileInputRef.current && fileInputRef.current.click()} disabled={uploading} style={{ marginBottom: 16 }}>
        {uploading ? <Loader2 size={16} className="tl-spin" /> : <Camera size={16} />}
        {uploading ? "上傳中…" : "上傳自己的照片"}
      </Btn>
      <div style={{ fontSize: 13, color: C.textSoft, marginBottom: 10 }}>或從內建插畫挑一張：</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {presetList.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelectPreset(p.id)}
            disabled={uploading}
            style={{
              border: "none", padding: 0, borderRadius: 12, overflow: "hidden", cursor: uploading ? "not-allowed" : "pointer",
              background: C.surfaceAlt, textAlign: "left",
            }}
          >
            <div style={{ width: "100%", height: 54, overflow: "hidden" }}>
              <CoverPresetArt id={p.id} />
            </div>
            <div style={{ fontSize: 12, color: C.text, padding: "6px 8px", fontWeight: 600 }}>{p.label}</div>
          </button>
        ))}
      </div>
    </Modal>
  );
}
