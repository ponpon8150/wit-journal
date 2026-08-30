import React from "react";
import { X } from "lucide-react";
import { C, FONT_BODY, FONT_DISPLAY, memberColor } from "../lib/helpers";

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
      <div style={{ background: C.bg, width: "100%", maxWidth: wide ? 560 : 440, maxHeight: "88vh", overflowY: "auto", borderRadius: "24px 24px 0 0", padding: 20, fontFamily: FONT_BODY }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 19, color: C.text, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: C.surfaceAlt, border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={16} color={C.text} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12.5, color: C.textSoft, marginBottom: 6, fontWeight: 600 }}>{label}</div>
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

export function HorizonBanner({ compact }) {
  const h = compact ? 120 : 220;
  return (
    <div style={{ position: "relative", width: "100%", height: h, overflow: "hidden" }}>
      <svg viewBox="0 0 800 300" preserveAspectRatio="none" width="100%" height="100%">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#BFD9E3" /><stop offset="100%" stopColor="#EDE7DA" />
          </linearGradient>
          <radialGradient id="sun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFDF6" /><stop offset="60%" stopColor="#FFF7E0" stopOpacity="0.9" /><stop offset="100%" stopColor="#FFF7E0" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3FB8C4" /><stop offset="100%" stopColor="#2C7A8C" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="800" height="180" fill="url(#sky)" />
        <circle cx="430" cy="120" r="70" fill="url(#sun)" />
        <circle cx="430" cy="120" r="26" fill="#FFFDF6" />
        <path d="M0 150 L120 90 L260 130 L400 100 L560 150 L800 130 L800 180 L0 180 Z" fill="#DCE7D8" opacity="0.9" />
        <path d="M0 160 L110 130 L250 155 L420 138 L600 165 L800 150 L800 180 L0 180 Z" fill="#C7D6C2" opacity="0.7" />
        <rect x="0" y="180" width="800" height="120" fill="url(#water)" />
        <path d="M550 300 Q620 250 700 270 T800 260 L800 300 Z" fill="#C4A876" opacity="0.55" />
      </svg>
    </div>
  );
}
