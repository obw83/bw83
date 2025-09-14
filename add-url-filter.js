#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

// Eleventy の pathPrefix に合わせる
const pathPrefix = "/bw83/";

// 対象ディレクトリ
const SITE_DIR = "_site";

// 再帰的にディレクトリ内の HTML ファイルを取得
function getHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
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

// HTML 内のリンクを書き換える
function updateLinks(filePath) {
  let html = fs.readFileSync(filePath, "utf-8");
  const $ = cheerio.load(html);

  // <a href>
  $("a").each((i, el) => {
    const href = $(el).attr("href");
    if (href && !href.startsWith("http") && !href.startsWith("#")) {
      $(el).attr("href", pathPrefix + href.replace(/^\/?/, ""));
    }
  });

  // <script src>
  $("script").each((i, el) => {
    const src = $(el).attr("src");
    if (src && !src.startsWith("http")) {
      $(el).attr("src", pathPrefix + src.replace(/^\/?/, ""));
    }
  });

  // <link href>
  $("link").each((i, el) => {
    const href = $(el).attr("href");
    if (href && !href.startsWith("http")) {
      $(el).attr("href", pathPrefix + href.replace(/^\/?/, ""));
    }
  });

  fs.writeFileSync(filePath, $.html(), "utf-8");
  console.log("Updated:", filePath);
}

// 実行
const htmlFiles = getHtmlFiles(SITE_DIR);
htmlFiles.forEach(updateLinks);

console.log("HTML links already updated via add-url-filter.js");
