// 離線語法檢查：因為這個沙盒環境沒有 npm registry / cdnjs 的網路權限，
// 無法在此驗證真正的 Vite build，所以退而求其次，用 TypeScript 的
// transpileModule 對每個 .jsx/.js 檔案做語法檢查（能抓出括號不對稱、
// JSX 標籤沒對好、多餘逗號等語法層級的錯誤，但抓不出 import 路徑打錯、
// prop 名稱對不上等「跨檔案」問題——那些已經用人工比對過一次）。
const ts = require("typescript");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "src");

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

let hasError = false;
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
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
