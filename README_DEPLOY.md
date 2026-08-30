# 唯旅誌｜WIT JOURNAL — 部署教學

這份文件教你把「唯旅誌｜WIT JOURNAL」變成一個真正的網頁，讓你和旅伴不管用什麼裝置、
是不是同一個 Claude 帳號，只要有這個連結和旅程代碼，就能一起即時記帳。

整體架構：
- **資料庫**：Supabase（免費方案即可）— 存放旅程、旅伴、花費、還款紀錄，並負責「即時同步」。
- **網頁**：Vercel（免費方案即可）— host 這個 React 網頁，任何人都能用瀏覽器打開。

你不需要會寫程式，跟著下面步驟一步一步做就可以。全程不用花錢（兩個服務的免費額度對朋友出遊記帳來說非常夠用）。

---

## 第一步：建立 Supabase 專案

1. 前往 [supabase.com](https://supabase.com)，用 Google 或 Email 註冊/登入。
2. 點「New project」，填：
   - **Name**：例如 `travel-ledger`
   - **Database Password**：設一組密碼並記下來（之後用不太到，但要保存好）
   - **Region**：選離你最近的（例如 Singapore 或 Tokyo）
3. 等待約 1-2 分鐘，專案建立完成。

### 建立資料表

1. 專案建立好後，左側選單點 **SQL Editor**。
2. 點 **New query**。
3. 打開這個專案裡的 `supabase/schema.sql` 檔案，全選複製，貼到編輯器裡。
4. 點右下角 **Run**（或按 Ctrl/Cmd + Enter）。
5. 看到「Success. No rows returned」就代表資料表、權限規則、即時同步、照片儲存空間都設定好了。

> 這份 SQL 只需要執行一次。如果你之後想清空重來，可以重新執行同一份（`create table if not exists` 不會重複建立）。

### 取得連線金鑰

1. 左側選單點 **Project Settings**（齒輪圖示）→ **API**。
2. 記下這兩個值，等一下設定網頁時會用到：
   - **Project URL**（長得像 `https://xxxxxxxxxxxx.supabase.co`）
   - **anon public** key（一長串英數字，在 "Project API keys" 底下）

---

## 第二步：把程式碼放到 GitHub（Vercel 部署需要）

如果你還沒有 GitHub 帳號，先到 [github.com](https://github.com) 免費註冊一個。

1. 建立一個新的 repository（例如叫 `travel-ledger`），設為 Private 或 Public 都可以。
2. 把這個專案資料夾上傳上去。最簡單的方式：
   - 打開 GitHub Desktop（[desktop.github.com](https://desktop.github.com)，有圖形介面不用打指令），選「Add local repository」指到這個資料夾，然後 Publish。
   - 或者如果你熟悉命令列：
     ```bash
     cd travel-ledger-web
     git init
     git add .
     git commit -m "唯旅誌 WIT JOURNAL"
     git branch -M main
     git remote add origin https://github.com/你的帳號/travel-ledger.git
     git push -u origin main
     ```

> 專案裡的 `.gitignore` 已經排除了 `.env`（裡面是你的 Supabase 金鑰，不會被上傳，這樣比較安全）和 `node_modules`。

---

## 第三步：部署到 Vercel

1. 前往 [vercel.com](https://vercel.com)，用 GitHub 帳號登入（一鍵串接，最方便）。
2. 點 **Add New** → **Project**，選你剛剛上傳的 `travel-ledger` repository → **Import**。
3. Vercel 會自動偵測到這是一個 Vite 專案，Build 設定不用改。
4. 在 **Environment Variables** 區塊，新增兩筆：

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | 你在第一步記下的 Project URL |
   | `VITE_SUPABASE_ANON_KEY` | 你在第一步記下的 anon public key |

5. 點 **Deploy**。等待約 1 分鐘，完成後會給你一個網址，例如：
   `https://travel-ledger-xxxx.vercel.app`

這個網址就是你要分享給旅伴的連結。之後任何人打開這個網址：
- 想開新旅程 → 點右下角「＋」建立
- 想加入你的旅程 → 點「＋」→「加入旅程」，輸入你給他的旅程代碼＋自己的名字

在「旅伴」分頁裡有「複製連結」按鈕，會把目前這趟旅程的網址（已經帶著旅程代碼）複製起來，傳給朋友，他們打開後選「加入旅程」、輸入代碼跟名字，就能馬上一起記帳、即時同步。

---

## 之後想手機桌面加圖示使用（PWA）

不需要額外設定，這個網頁本身就支援「加到主畫面」：
- **iPhone（Safari）**：打開網址 → 下方分享圖示 → 「加入主畫面」
- **Android（Chrome）**：打開網址 → 右上角選單 → 「新增至主畫面」

加入後會像一個 App 一樣有獨立圖示，全螢幕開啟，不會看到瀏覽器網址列。

---

## 之後想更新程式碼怎麼辦

以後如果想調整功能、修 bug：
1. 修改本機的程式碼
2. `git add . && git commit -m "說明改了什麼" && git push`
3. Vercel 偵測到 GitHub 有新的 commit，會自動重新部署，通常 1 分鐘內就上線，不需要手動操作。

---

## 想在自己電腦上先跑起來看看（選用）

如果你的電腦有安裝 [Node.js](https://nodejs.org)（18 以上版本）：

```bash
cd travel-ledger-web
cp .env.example .env
# 打開 .env，填入你的 Supabase URL 跟 anon key
npm install
npm run dev
```

接著打開終端機顯示的網址（通常是 `http://localhost:5173`）就能在本機測試。

---

## 目前設計上你該知道的事

- **沒有帳號登入機制**：任何知道「旅程代碼」的人都能讀寫這趟旅程的資料，就跟原本 Google 試算表共編的邏輯一樣——代碼給誰，誰就能一起記帳。請不要把代碼公開分享到公開社群。
- **代購清單是私人的**：每個人的「代購清單」分頁只存在自己這台裝置的瀏覽器裡（localStorage），不會上傳、不會跟旅伴同步，符合原本「私人代購筆記」的設計。清掉瀏覽器資料或換裝置就會不見，請留意。
- **即時匯率查詢**：使用免費、不需金鑰的 `open.er-api.com` 做參考匯率，正式金額仍建議對照銀行公告匯率。
- **收據照片**：存在 Supabase Storage 的公開 bucket（`receipts`），旅伴都看得到；代購清單的照片則是本機 base64，不會上傳。
- 目前沒有做「OCR 收據自動辨識」（原本 Claude Artifact 版本這部分被 CSP 網路限制擋住而移除）。這個新架構理論上可以透過 Supabase Edge Function 呼叫 Anthropic API 重新加回去，如果之後想要這個功能可以再提出來。
