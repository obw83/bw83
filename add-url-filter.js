const fs = require("fs");
const path = require("path");

const pathPrefix = "/bw83/";

function updateLinks(filePath) {
  let content = fs.readFileSync(filePath, "utf-8");

  // 例: href と src の書き換え
  content = content.replace(
    /href="\/(.*?)"/g,
    (m, p1) => `href="${pathPrefix}${p1}"`
  );
  content = content.replace(
    /src="\/(.*?)"/g,
    (m, p1) => `src="${pathPrefix}${p1}"`
  );

  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`Updated: ${filePath}`);
}

// _site 内の HTML ファイルすべてに適用
function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith(".html")) {
      updateLinks(fullPath);
    }
  }
}

walk("_site");
console.log("HTML links already updated via add-url-filter.js");
