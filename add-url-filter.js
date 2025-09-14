const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

// GitHub Pages 用 pathPrefix
const PATH_PREFIX = "/bw83/";

// 対象ディレクトリ
const SITE_DIR = "_site";

// 再帰的に HTML ファイルを取得
function getHtmlFiles(dir) {
  let results = [];
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getHtmlFiles(fullPath));
    } else if (file.endsWith(".html")) {
      results.push(fullPath);
    }
  });
  return results;
}

// URL 書き換え
function rewriteUrls(filePath) {
  let content = fs.readFileSync(filePath, "utf-8");
  const $ = cheerio.load(content);

  // a[href]
  $("a").each((_, el) => {
    const href = $(el).attr("href");
    if (href && !href.startsWith("http") && !href.startsWith("#")) {
      $(el).attr("href", PATH_PREFIX + href.replace(/^\/+/, ""));
    }
  });

  // link[href]（CSS）
  $("link").each((_, el) => {
    const href = $(el).attr("href");
    if (href && !href.startsWith("http")) {
      $(el).attr("href", PATH_PREFIX + href.replace(/^\/+/, ""));
    }
  });

  // script[src]（JS）
  $("script").each((_, el) => {
    const src = $(el).attr("src");
    if (src && !src.startsWith("http")) {
      $(el).attr("src", PATH_PREFIX + src.replace(/^\/+/, ""));
    }
  });

  // img[src]
  $("img").each((_, el) => {
    const src = $(el).attr("src");
    if (src && !src.startsWith("http")) {
      $(el).attr("src", PATH_PREFIX + src.replace(/^\/+/, ""));
    }
  });

  fs.writeFileSync(filePath, $.html());
  console.log(`Updated: ${filePath}`);
}

// メイン処理
const htmlFiles = getHtmlFiles(SITE_DIR);
htmlFiles.forEach((file) => rewriteUrls(file));

console.log("HTML links already updated via add-url-filter.js");
