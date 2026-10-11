// 離線語法檢查：因為這個沙盒環境沒有 npm registry / cdnjs 的網路權限，
// 無法在此驗證真正的 Vite build，所以退而求其次，用 TypeScript 的
// transpileModule 對每個 .jsx/.js 檔案做語法檢查（能抓出括號不對稱、
// JSX 標籤沒對好、多餘逗號等語法層級的錯誤，但抓不出 import 路徑打錯、
// prop 名稱對不上等「跨檔案」問題——那些已經用人工比對過一次）。
const ts = require("typescript");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "src");
const API_ROOT = path.join(__dirname, "..", "api");

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) walk(p, out);
    else if (/\.(jsx?|tsx?)$/.test(name)) out.push(p);
  }
}

const files = [];
walk(ROOT, files);
if (fs.existsSync(API_ROOT)) walk(API_ROOT, files);

// 專門抓一種 TS 檢查測不出來、但真正上線 build 會失敗的狀況：
// .js 檔案裡面寫了 JSX 語法（例如 <svg>、<MyComponent />）。
// 原因：Vite 實際 build 用的 esbuild，預設只有 .jsx / .tsx 檔案會啟用 JSX
// 解析，純 .js 檔案遇到 JSX 語法會直接噴錯；但這裡用的 TypeScript
// transpileModule 不分檔名、只要開了 jsx 選項就一律當作可以解析，
// 所以光用 TS 檢查「看不出來」，上線後才會發現 build 失敗。
// 這裡用簡單的標籤樣式比對（不是真的 parse），足以抓出這種情況。
const JSX_TAG_PATTERN = /<\/?[A-Za-z][\w.]*(\s[^<>]*)?\/?>/;

let hasError = false;
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");

  if (/\.js$/.test(file) && JSX_TAG_PATTERN.test(src)) {
    hasError = true;
    console.log(`\n✗ ${path.relative(ROOT, file)}`);
    console.log(`  這個檔案是 .js，但內容看起來含有 JSX 標籤（例如 <svg>、<div> 之類）。`);
    console.log(`  Vite 實際 build 時 .js 檔案不會啟用 JSX 解析，上線會失敗。請把檔名改成 .jsx。`);
    continue;
  }

  const result = ts.transpileModule(src, {
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
      allowJs: true,
    },
    reportDiagnostics: true,
    fileName: file,
  });
  const diags = (result.diagnostics || []).filter((d) => {
    // 忽略「找不到模組」之類跟型別/解析有關的訊息，我們只在意語法錯誤
    const msg = ts.flattenDiagnosticMessageText(d.messageText, "\n");
    return d.category === ts.DiagnosticCategory.Error;
  });
  if (diags.length) {
    hasError = true;
    console.log(`\n✗ ${path.relative(ROOT, file)}`);
    for (const d of diags) {
      const msg = ts.flattenDiagnosticMessageText(d.messageText, "\n");
      if (d.file && d.start != null) {
        const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
        console.log(`  L${line + 1}:${character + 1}  ${msg}`);
      } else {
        console.log(`  ${msg}`);
      }
    }
  }
}

if (!hasError) {
  console.log(`語法檢查通過：共檢查 ${files.length} 個檔案，沒有發現語法錯誤。`);
  process.exit(0);
} else {
  process.exit(1);
}
