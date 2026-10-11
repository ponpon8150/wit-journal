import React from "react";

/* ------------------------------------------------------------------
   熱門城市頭圖預設
   --------------------------------------------------------------
   說明：這裡提供的是跟首頁預設 Banner 風格一致的「手繪插畫」，
   不是真實照片。原因是：
   1. 嵌入真實風景照需要外部圖庫授權 + 穩定連線，網站載入時容易因為
      圖片來源失效而壞掉；
   2. 這些插畫完全是程式畫出來的（SVG），不需要額外下載圖片、
      不會拖慢網站、也不會有版權問題。
   如果想要「真實照片」當頭圖，請到「旅伴」分頁的「旅程設定」卡片裡
   點「更換頭圖」，就可以選擇上傳自己拍的照片——這裡的插畫只是在使用者
   還沒自己選擇之前，依旅程名稱猜一張風格相符的插畫先頂著用。
   ------------------------------------------------------------------ */

function Scene({ id, sky, sun, water, children }) {
  return (
    <svg viewBox="0 0 800 300" preserveAspectRatio="none" width="100%" height="100%">
      <defs>
        <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={sky[0]} />
          <stop offset="100%" stopColor={sky[1]} />
        </linearGradient>
        <radialGradient id={`sun-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFDF6" />
          <stop offset="60%" stopColor={sun} stopOpacity="0.9" />
          <stop offset="100%" stopColor={sun} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`water-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={water[0]} />
          <stop offset="100%" stopColor={water[1]} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="800" height="180" fill={`url(#sky-${id})`} />
      <circle cx="430" cy="110" r="58" fill={`url(#sun-${id})`} />
      <circle cx="430" cy="110" r="20" fill="#FFFDF6" opacity="0.9" />
      {children}
      <rect x="0" y="180" width="800" height="120" fill={`url(#water-${id})`} />
    </svg>
  );
}

const PRESET_ART = {
  default: (
    <svg viewBox="0 0 800 300" preserveAspectRatio="none" width="100%" height="100%">
      <defs>
        <linearGradient id="sky-default" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#BFD9E3" /><stop offset="100%" stopColor="#EDE7DA" />
        </linearGradient>
        <radialGradient id="sun-default" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFDF6" /><stop offset="60%" stopColor="#FFF7E0" stopOpacity="0.9" /><stop offset="100%" stopColor="#FFF7E0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="water-default" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3FB8C4" /><stop offset="100%" stopColor="#2C7A8C" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="800" height="180" fill="url(#sky-default)" />
      <circle cx="430" cy="120" r="70" fill="url(#sun-default)" />
      <circle cx="430" cy="120" r="26" fill="#FFFDF6" />
      <path d="M0 150 L120 90 L260 130 L400 100 L560 150 L800 130 L800 180 L0 180 Z" fill="#DCE7D8" opacity="0.9" />
      <path d="M0 160 L110 130 L250 155 L420 138 L600 165 L800 150 L800 180 L0 180 Z" fill="#C7D6C2" opacity="0.7" />
      <rect x="0" y="180" width="800" height="120" fill="url(#water-default)" />
      <path d="M550 300 Q620 250 700 270 T800 260 L800 300 Z" fill="#C4A876" opacity="0.55" />
    </svg>
  ),
  tokyo: (
    <Scene id="tokyo" sky={["#F7CBDA", "#FDEDE3"]} sun="#FFC9D6" water={["#3FB8C4", "#2C7A8C"]}>
      <path d="M230 182 L320 68 L345 100 L410 182 Z" fill="#9FB3CE" opacity="0.85" />
      <path d="M300 92 L320 68 L340 94 L326 102 L320 86 L314 100 Z" fill="#fff" opacity="0.95" />
      <rect x="585" y="140" width="6" height="42" fill="#B5563F" />
      <rect x="635" y="140" width="6" height="42" fill="#B5563F" />
      <rect x="578" y="128" width="70" height="7" fill="#B5563F" />
      <rect x="583" y="142" width="60" height="6" fill="#B5563F" />
    </Scene>
  ),
  osaka: (
    <Scene id="osaka" sky={["#F6CD95", "#F8E7C6"]} sun="#FFD9A0" water={["#3FA6A8", "#2C7577"]}>
      <rect x="560" y="140" width="64" height="42" fill="#5B7C6B" />
      <polygon points="552,140 592,112 632,140" fill="#3F5B4E" />
      <rect x="578" y="118" width="28" height="24" fill="#5B7C6B" />
      <polygon points="572,118 592,100 612,118" fill="#3F5B4E" />
      <rect x="586" y="94" width="12" height="12" fill="#C4A876" />
    </Scene>
  ),
  seoul: (
    <Scene id="seoul" sky={["#D3E5EE", "#EFE7D9"]} sun="#EAD9B8" water={["#4F93AC", "#2F6A80"]}>
      <path d="M160 182 L260 120 L360 182 Z" fill="#AEBBC4" opacity="0.7" />
      <path d="M520 150 Q592 108 664 150 L664 182 L520 182 Z" fill="#2E3B3E" />
      <rect x="548" y="150" width="88" height="8" fill="#B5563F" />
      <rect x="560" y="158" width="64" height="24" fill="#8C5A42" />
    </Scene>
  ),
  bangkok: (
    <Scene id="bangkok" sky={["#F7DE9E", "#F4E9C9"]} sun="#FFE2A0" water={["#4FA3A0", "#2E6E6B"]}>
      <polygon points="586,60 598,110 574,110" fill="#D9A648" />
      <polygon points="586,60 592,96 580,96" fill="#F2C76B" />
      <rect x="558" y="110" width="56" height="18" fill="#C8553D" />
      <polygon points="548,110 586,88 624,110" fill="#D9A648" />
    </Scene>
  ),
  okinawa: (
    <Scene id="okinawa" sky={["#AEE4E0", "#FDF6E2"]} sun="#FFF2C2" water={["#2FB8C0", "#1F8690"]}>
      <path d="M520 182 C520 150 560 150 560 130 C560 150 596 150 596 182 Z" fill="#5B8F5E" />
      <path d="M556 130 Q540 108 512 112" stroke="#3F6B42" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M560 128 Q576 104 606 110" stroke="#3F6B42" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M558 130 Q558 104 558 86" stroke="#6B4A33" strokeWidth="8" fill="none" />
    </Scene>
  ),
  hongkong: (
    <Scene id="hongkong" sky={["#C9D4DC", "#ECECE4"]} sun="#E4E7E2" water={["#5B8FA8", "#355D70"]}>
      <rect x="520" y="120" width="22" height="62" fill="#5B6B72" />
      <rect x="548" y="100" width="26" height="82" fill="#3F4E54" />
      <rect x="580" y="130" width="20" height="52" fill="#5B6B72" />
      <rect x="606" y="90" width="24" height="92" fill="#2E3B3E" />
      <rect x="636" y="116" width="20" height="66" fill="#5B6B72" />
    </Scene>
  ),
};

/* 旅程名稱關鍵字 → 預設插畫 id（不分大小寫、支援中英文子字串比對） */
const PRESET_KEYWORDS = [
  { id: "tokyo", keywords: ["東京", "日本", "富士", "TOKYO", "JAPAN", "FUJI"] },
  { id: "osaka", keywords: ["大阪", "OSAKA"] },
  { id: "seoul", keywords: ["首爾", "韓國", "SEOUL", "KOREA"] },
  { id: "bangkok", keywords: ["曼谷", "泰國", "BANGKOK", "THAILAND"] },
  { id: "okinawa", keywords: ["沖繩", "OKINAWA"] },
  { id: "hongkong", keywords: ["香港", "HONGKONG", "HONG KONG"] },
];

export function matchCoverPreset(tripName) {
  if (!tripName) return null;
  const name = String(tripName).toUpperCase();
  for (const { id, keywords } of PRESET_KEYWORDS) {
    if (keywords.some((k) => name.includes(k.toUpperCase()))) return id;
  }
  return null;
}

export function CoverPresetArt({ id }) {
  return PRESET_ART[id] || PRESET_ART.default;
}

/* 給「選擇頭圖」清單用：預設風景圖 + 7 個城市插畫，依序排列 */
export const COVER_PRESET_LIST = [
  { id: "default", label: "預設風景圖" },
  { id: "tokyo", label: "東京" },
  { id: "osaka", label: "大阪" },
  { id: "seoul", label: "首爾" },
  { id: "bangkok", label: "曼谷" },
  { id: "okinawa", label: "沖繩" },
  { id: "hongkong", label: "香港" },
];

/* 把資料庫裡的 trips.cover_url 解析成畫面要用的 { photoUrl, presetId }：
   - 以 "preset:xxx" 開頭 → 使用者自己手動選的插畫（包含手動選回「預設風景圖」）
   - 其他非空字串 → 使用者上傳的真實照片網址
   - 空值 → 還沒設定過，依旅程名稱關鍵字自動猜一張插畫，猜不到就用預設風景圖 */
export function resolveTripCover(trip) {
  const cv = trip && trip.cover_url;
  if (cv && cv.startsWith("preset:")) {
    return { photoUrl: null, presetId: cv.slice(7) || "default" };
  }
  if (cv) {
    return { photoUrl: cv, presetId: null };
  }
  return { photoUrl: null, presetId: matchCoverPreset(trip && trip.name) || "default" };
}
