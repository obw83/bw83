const fs = require("fs");
const path = require("path");

const targetDir = "_site";

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(file));
    } else if (file.endsWith(".html")) {
      results.push(file);
    }
  });
  return results;
}

const htmlFiles = walkDir(targetDir);

htmlFiles.forEach((file) => {
  let content = fs.readFileSync(file, "utf8");

  // {{ url }} 書き換え
  content = content.replace(/{{\s*'([^']+)'\s*\|\s*url\s*}}/g, "/bw83/$1");

  fs.writeFileSync(file, content, "utf8");
  console.log("Updated:", file);
});

console.log("HTML links already updated via add-url-filter.js");
