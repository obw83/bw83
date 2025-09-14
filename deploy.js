const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const SITE_DIR = path.join(__dirname, "_site");
const PUBLIC_REPO = "https://github.com/obw83/bw83.git";
const COMMIT_MESSAGE = "Deploy Eleventy site";

// HTML ファイルを再帰的に取得
function getHtmlFiles(dir) {
  let results = [];
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) results = results.concat(getHtmlFiles(filePath));
    else if (file.endsWith(".html")) results.push(filePath);
  });
  return results;
}

// | url フィルターを HTML に追加（すでに pathPrefix が反映されるので簡単）
function addUrlFilterToFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  content = content.replace(
    /<link\s+rel=["']stylesheet["']\s+href=["'](\/[^"']+)["']>/g,
    (_, href) => `<link rel="stylesheet" href="{{ '${href}' | url }}">`
  );
  content = content.replace(
    /<script\s+src=["'](\/[^"']+)["'](\s+defer)?>/g,
    (_, src, defer) => `<script src="{{ '${src}' | url }}"${defer || ""}>`
  );
  fs.writeFileSync(filePath, content, "utf8");
}

// 1️⃣ Eleventy ビルド
console.log("Building Eleventy site...");
execSync("npx eleventy", { stdio: "inherit" });

// 2️⃣ URL フィルター適用
console.log("Applying URL filter to HTML files...");
getHtmlFiles(SITE_DIR).forEach(addUrlFilterToFile);

// 3️⃣ Publicリポジトリに push
console.log("Deploying to Public repository...");
if (!fs.existsSync(path.join(SITE_DIR, ".git"))) {
  execSync("git init", { cwd: SITE_DIR });
  execSync(`git remote add origin ${PUBLIC_REPO}`, { cwd: SITE_DIR });
}
execSync("git add .", { cwd: SITE_DIR });

// 変更があれば commit
const status = execSync("git status --porcelain", { cwd: SITE_DIR }).toString();
if (status.trim() !== "") {
  execSync(`git commit -m "${COMMIT_MESSAGE}"`, { cwd: SITE_DIR });
  console.log("Committed changes.");
} else {
  console.log("No changes to commit.");
}

// Force push
execSync("git push origin main --force", { cwd: SITE_DIR, stdio: "inherit" });
console.log("✅ Deployment complete!");
