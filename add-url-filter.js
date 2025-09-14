const fs = require("fs");
const path = require("path");

const pathPrefix = "/bw83/"; // GitHub Pages の場合
const siteDir = "_site";

function updateLinks(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      updateLinks(fullPath);
    } else if (file.endsWith(".html")) {
      let content = fs.readFileSync(fullPath, "utf-8");

      // href と src を pathPrefix付きに書き換え
      content = content.replace(
        /(?:href|src)=["'](\/[^"']+)["']/g,
        (match, p1) => {
          return match.replace(p1, `${pathPrefix}${p1.replace(/^\//, "")}`);
        }
      );

      fs.writeFileSync(fullPath, content);
      console.log("Updated:", fullPath);
    }
  });
}

updateLinks(siteDir);
console.log("HTML links already updated via add-url-filter.js");
