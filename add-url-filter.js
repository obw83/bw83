const fs = require("fs");
const path = require("path");

const SITE_DIR = "_site";
const PATH_PREFIX = "/bw83/";

// 再帰的に HTML ファイルを取得
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (filePath.endsWith(".html")) {
      results.push(filePath);
    }
  });
  return results;
}

// URL 書き換え処理
function replaceUrls(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  // a, link, script, img タグの href/src を pathPrefix 付きに変更
  content = content.replace(
    /(?:href|src)=["'](\/(?!bw83)[^"']+)["']/g,
    (match, p1) => {
      return match.replace(p1, `${PATH_PREFIX}${p1.slice(1)}`);
    }
  );

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`Updated: ${filePath}`);
}

// 全 HTML ファイルを処理
const htmlFiles = walk(SITE_DIR);
htmlFiles.forEach(replaceUrls);
