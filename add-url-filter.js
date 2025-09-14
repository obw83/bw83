const fs = require("fs");
const path = require("path");

// _site のパス
const SITE_DIR = path.join(__dirname, "_site");

// 再帰的にディレクトリ内HTMLファイルを取得
function getHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
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

// HTML内のリンク・スクリプトを書き換え
function addUrlFilterToFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  // link タグ
  content = content.replace(
    /<link\s+rel=["']stylesheet["']\s+href=["'](\/[^"']+)["']>/g,
    (_, href) => `<link rel="stylesheet" href="{{ '${href}' | url }}">`
  );

  // script タグ
  content = content.replace(
    /<script\s+src=["'](\/[^"']+)["'](\s+defer)?>/g,
    (_, src, defer) => `<script src="{{ '${src}' | url }}"${defer || ""}>`
  );

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`Updated: ${filePath}`);
}

// 実行
const htmlFiles = getHtmlFiles(SITE_DIR);
htmlFiles.forEach(addUrlFilterToFile);

console.log("All HTML files updated with | url filter.");
