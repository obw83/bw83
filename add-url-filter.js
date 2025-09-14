const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const pathPrefix = "/bw83/";
const siteDir = "_site";

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

// HTML 内リンク書き換え
function updateLinks(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const $ = cheerio.load(content);

  $("a[href], link[href], script[src], img[src]").each((_, el) => {
    const attr = el.name === "script" || el.name === "img" ? "src" : "href";
    let val = $(el).attr(attr);
    if (!val) return;
    if (!val.startsWith("http") && !val.startsWith(pathPrefix)) {
      val = val.replace(/^\.?\//, "");
      $(el).attr(attr, pathPrefix + val);
    }
  });

  fs.writeFileSync(filePath, $.html());
  console.log("Updated:", filePath);
}

// 実行
getHtmlFiles(siteDir).forEach(updateLinks);
console.log("HTML links already updated via add-url-filter.js");
