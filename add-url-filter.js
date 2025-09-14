// add-url-filter.js
const fs = require("fs");
const path = require("path");

const SITE_DIR = path.join(__dirname, "_site");

// 再帰的に HTML ファイルを取得
function getHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(getHtmlFiles(filePath));
    } else if (file.endsWith(".html")) {
      results.push(filePath);
    }
  });
  return results;
}

// HTML 内のリンク・スクリプト・aタグを書き換え
function addUrlFilterToFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  // CSS リンク
  content = content.replace(
    /<link\s+rel=["']stylesheet["']\s+href=["'](\/[^"']+)["']>/g,
    (_, href) => `<link rel="stylesheet" href="{{ '${href}' | url }}">`
  );

  // JS スクリプト
  content = content.replace(
    /<script\s+src=["'](\/[^"']+)["'](\s+defer)?\s*>/g,
    (_, src, defer) =>
      `<script src="{{ '${src}' | url }}"${defer || ""}></script>`
  );

  // a タグ href
  content = content.replace(
    /<a\s+([^>]*?)href=["'](\/[^"']+)["'](.*?)>/g,
    (_, before, href, after) =>
      `<a ${before}href="{{ '${href}' | url }}"${after}>`
  );

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`Updated: ${filePath}`);
}

// 実行
const htmlFiles = getHtmlFiles(SITE_DIR);
htmlFiles.forEach(addUrlFilterToFile);

console.log("All HTML files updated with | url filter.");
