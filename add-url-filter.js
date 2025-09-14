const fs = require("fs");
const path = require("path");

const SITE_DIR = path.join(__dirname, "_site");
const pathPrefix = "/bw83/"; // GitHub Pages 用

// HTML ファイルを再帰的に取得
function getHtmlFiles(dir) {
  let results = [];
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getHtmlFiles(filePath));
    } else if (file.endsWith(".html")) {
      results.push(filePath);
    }
  });
  return results;
}

// HTML 内の {{ ... | url }} や /assets/... を pathPrefix 付きに変換
function addUrlFilterToFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  // {{ ... | url }} の変換
  content = content.replace(
    /\{\{\s*['"](.+?)['"]\s*\|\s*url\s*\}\}/g,
    (_, url) => `${pathPrefix}${url}`
  );

  // /assets/... の変換
  content = content.replace(
    /(\s(?:src|href|srcset)=["'])(\/assets\/.+?)["']/g,
    (_, prefix, url) => `${prefix}${pathPrefix}${url.slice(1)}"` // 先頭の / を除去して pathPrefix 追加
  );

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`Updated: ${filePath}`);
}

// 実行
getHtmlFiles(SITE_DIR).forEach(addUrlFilterToFile);
console.log("All HTML files updated with pathPrefix.");
