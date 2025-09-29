// add-url-filter.js (完全版)
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const siteDir = "_site_public"; // Eleventy 出力ディレクトリ
const pathPrefix = "/bw83"; // GitHub Pages 用 prefix

// -------- HTML 処理 --------
function updateHtmlLinks(filePath) {
  const html = fs.readFileSync(filePath, "utf-8");
  const $ = cheerio.load(html);

  // <a> と <img>
  $("a, img").each((i, el) => {
    const attr = el.name === "a" ? "href" : "src";
    const val = $(el).attr(attr);
    if (val && val.startsWith("/")) {
      $(el).attr(attr, `${pathPrefix}${val}`);
    }
  });

  // <source srcset>
  $("source").each((i, el) => {
    const srcset = $(el).attr("srcset");
    if (srcset && srcset.startsWith("/")) {
      $(el).attr("srcset", `${pathPrefix}${srcset}`);
    }
  });

  fs.writeFileSync(filePath, $.html(), "utf-8");
}

// -------- CSS 処理 --------
function updateCssUrls(filePath) {
  let css = fs.readFileSync(filePath, "utf-8");
  css = css.replace(/url\(["']?(\/[^"')]+)["']?\)/g, (match, p1) => {
    return `url(${pathPrefix}${p1})`;
  });
  fs.writeFileSync(filePath, css, "utf-8");
}

// -------- ディレクトリ再帰処理 --------
function walkHtml(dir) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkHtml(fullPath);
    } else if (file.endsWith(".html")) {
      updateHtmlLinks(fullPath);
    } else if (file.endsWith(".css")) {
      updateCssUrls(fullPath);
    }
  });
}

// -------- 実行 --------
walkHtml(siteDir);

console.log("HTML and CSS links updated successfully!");
