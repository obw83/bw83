const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const siteDir = "_site";
const pathPrefix = "/bw83/";

// フォルダ内 HTML を再帰的に取得
function getHtmlFiles(dir) {
  let results = [];
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getHtmlFiles(fullPath));
    } else if (fullPath.endsWith(".html")) {
      results.push(fullPath);
    }
  });
  return results;
}

// HTML のリンクを書き換え
const htmlFiles = getHtmlFiles(siteDir);
htmlFiles.forEach((file) => {
  const content = fs.readFileSync(file, "utf-8");
  const $ = cheerio.load(content);

  $("a[href], link[href], script[src], img[src]").each((_, el) => {
    const attr = el.name === "script" || el.name === "img" ? "src" : "href";
    const val = $(el).attr(attr);
    if (val && val.startsWith("/") && !val.startsWith(pathPrefix)) {
      $(el).attr(attr, `${pathPrefix}${val.slice(1)}`);
    }
  });

  fs.writeFileSync(file, $.html());
  console.log(`Updated: ${file}`);
});

console.log("HTML links already updated via add-url-filter.js");
