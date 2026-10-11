import React from "react";

/* ------------------------------------------------------------------
   熱門旅遊景點頭圖預設
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

   以「國家」為單位呈現的熱門旅遊景點，共 7 個（台灣排最前面，泰國排倒數第二）：
   台灣、日本、韓國、港澳、新馬、泰國、越南。
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
  japan: (
    <Scene id="japan" sky={["#F7CBDA", "#FDEDE3"]} sun="#FFC9D6" water={["#3FB8C4", "#2C7A8C"]}>
      <path d="M230 182 L320 68 L345 100 L410 182 Z" fill="#9FB3CE" opacity="0.85" />
      <path d="M300 92 L320 68 L340 94 L326 102 L320 86 L314 100 Z" fill="#fff" opacity="0.95" />
      <rect x="585" y="140" width="6" height="42" fill="#B5563F" />
      <rect x="635" y="140" width="6" height="42" fill="#B5563F" />
      <rect x="578" y="128" width="70" height="7" fill="#B5563F" />
      <rect x="583" y="142" width="60" height="6" fill="#B5563F" />
    </Scene>
  ),
  korea: (
    <Scene id="korea" sky={["#D3E5EE", "#EFE7D9"]} sun="#EAD9B8" water={["#4F93AC", "#2F6A80"]}>
      <path d="M160 182 L260 120 L360 182 Z" fill="#AEBBC4" opacity="0.7" />
      <rect x="552" y="148" width="68" height="34" fill="#6B4A36" />
      <rect x="572" y="160" width="28" height="22" fill="#3F2E22" />
      <path d="M532 148 Q540 126 586 122 Q632 126 640 148 Z" fill="#45545C" />
    </Scene>
  ),
  thailand: (
    <Scene id="thailand" sky={["#F7DE9E", "#F4E9C9"]} sun="#FFE2A0" water={["#4FA3A0", "#2E6E6B"]}>
      <rect x="552" y="150" width="68" height="32" fill="#C8553D" />
      <polygon points="540,150 586,120 632,150" fill="#D9A648" />
      <polygon points="586,60 598,120 574,120" fill="#D9A648" />
      <polygon points="586,60 592,100 580,100" fill="#F2C76B" />
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
  singapore: (
    <Scene id="singapore" sky={["#F4C9A8", "#F8E2CE"]} sun="#FFD9AE" water={["#2FA6AE", "#1E7580"]}>
      <rect x="520" y="130" width="18" height="52" fill="#4A5A62" />
      <rect x="546" y="110" width="18" height="72" fill="#4A5A62" />
      <rect x="572" y="130" width="18" height="52" fill="#4A5A62" />
      <path d="M514 110 L596 110 L588 122 L522 122 Z" fill="#C4A876" />
    </Scene>
  ),
  vietnam: (
    <Scene id="vietnam" sky={["#BFE0D8", "#F2EBD4"]} sun="#FCEBB0" water={["#2E9C9E", "#1F6E70"]}>
      <path d="M520 182 C520 150 548 148 552 168 C558 144 584 146 584 182 Z" fill="#4A6B5E" opacity="0.85" />
      <path d="M598 182 C598 158 618 156 622 172 C626 154 648 156 648 182 Z" fill="#3F5B4E" opacity="0.8" />
      <polygon points="470,168 486,150 502,168" fill="#E8DCC0" />
      <line x1="486" y1="150" x2="486" y2="176" stroke="#8C7A5A" strokeWidth="2" />
      <polygon points="460,182 512,182 500,176 472,176" fill="#6B4A33" />
    </Scene>
  ),
  taiwan: (
    <Scene id="taiwan" sky={["#BFE3DD", "#EAF2E8"]} sun="#CDEDE0" water={["#3FB8C4", "#2C7A8C"]}>
      <path d="M470 182 L540 110 L585 182 Z" fill="#8FAE9B" opacity="0.8" />
      <rect x="590" y="70" width="26" height="112" fill="#2E3B3E" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x="586" y={76 + i * 17} width="34" height="3" fill="#C4A876" />
      ))}
      <polygon points="590,70 603,52 616,70" fill="#2E3B3E" />
    </Scene>
  ),
};

/* 旅程名稱關鍵字 → 預設插畫 id（不分大小寫、支援中英文子字串比對） */
const PRESET_KEYWORDS = [
  { id: "japan", keywords: ["東京", "大阪", "沖繩", "日本", "京都", "北海道", "富士", "TOKYO", "OSAKA", "OKINAWA", "JAPAN", "KYOTO", "FUJI"] },
  { id: "korea", keywords: ["首爾", "釜山", "韓國", "SEOUL", "BUSAN", "KOREA"] },
  { id: "thailand", keywords: ["曼谷", "清邁", "泰國", "BANGKOK", "THAILAND"] },
  { id: "hongkong", keywords: ["香港", "澳門", "HONGKONG", "HONG KONG", "MACAU", "MACAO"] },
  { id: "singapore", keywords: ["新加坡", "馬來西亞", "吉隆坡", "沙巴", "檳城", "SINGAPORE", "MALAYSIA", "KUALA LUMPUR", "SABAH", "PENANG"] },
  { id: "vietnam", keywords: ["越南", "河內", "胡志明", "峴港", "VIETNAM", "HANOI", "DANANG"] },
  { id: "taiwan", keywords: ["台灣", "臺灣", "台北", "臺北", "台中", "高雄", "TAIWAN", "TAIPEI"] },
];

export function matchCoverPreset(tripName) {
  if (!tripName) return null;
  const name = String(tripName).toUpperCase();
  for (const { id, keywords } of PRESET_KEYWORDS) {
    if (keywords.some((k) => name.includes(k.toUpperCase()))) return id;
  }
  return null;
}

// 舊版（以城市分類）的插畫 id 對照到新版（以國家分類）的 id，
// 避免之前已經手動選過舊插畫的旅程，升級後顯示不出來、掉回預設圖。
const LEGACY_ID_ALIASES = {
  tokyo: "japan",
  osaka: "japan",
  okinawa: "japan",
  seoul: "korea",
  bangkok: "thailand",
  paris: "france",
  taipei: "taiwan",
};

export function CoverPresetArt({ id }) {
  const resolvedId = LEGACY_ID_ALIASES[id] || id;
  return PRESET_ART[resolvedId] || PRESET_ART.default;
}

/* 給「選擇頭圖」清單用：預設風景圖 + 7 個熱門旅遊景點，依序排列（台灣排最前面） */
export const COVER_PRESET_LIST = [
  { id: "default", label: "預設" },
  { id: "taiwan", label: "台灣" },
  { id: "japan", label: "日本" },
  { id: "korea", label: "韓國" },
  { id: "hongkong", label: "港澳" },
  { id: "singapore", label: "新馬" },
  { id: "thailand", label: "泰國" },
  { id: "vietnam", label: "越南" },
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
