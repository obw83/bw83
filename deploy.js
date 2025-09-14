const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const SITE_DIR = path.join(__dirname, "_site");
const PUBLIC_REPO = "https://github.com/obw83/bw83.git";
const COMMIT_MESSAGE = "Deploy Eleventy site";

// 再帰的に HTML ファイルを取得
function getHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
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

// HTML 内のリンク・スクリプト・画像を書き換え
function applyUrlFilter(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  // 既に | url が付いていればスキップ
  const hasUrlFilter = /\|\s*url\s*\}/.test(content);
  if (hasUrlFilter) return;

  // link タグ
  content = content.replace(
    /<link\s+rel=["']stylesheet["']\s+href=["'](\/[^"']+)["']>/g,
    (_, href) => `<link rel="stylesheet" href="{{ '${href}' | url }}">`
  );

  // script タグ
  content = content.replace(
    /<script\s+src=["'](\/[^"']+)["'](\s+defer)?>/g,
    (_, src, defer) => `<script src="{{ '${src}' | url }}"${defer || ""}>`
  );

  // img タグ
  content = content.replace(
    /<img\s+([^>]*?)src=["'](\/[^"']+)["']([^>]*?)>/g,
    (_, before, src, after) =>
      `<img ${before}src="{{ '${src}' | url }}"${after}>`
  );

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`Updated: ${filePath}`);
}

// --- 実行 ---
try {
  // 1️⃣ Eleventy ビルド
  console.log("Building Eleventy site...");
  execSync("npx eleventy", { stdio: "inherit" });

  // 2️⃣ HTML ファイルに URL フィルター適用
  console.log("Applying URL filter to HTML files...");
  const htmlFiles = getHtmlFiles(SITE_DIR);
  htmlFiles.forEach(applyUrlFilter);

  // 3️⃣ Publicリポジトリの git 初期化
  if (!fs.existsSync(path.join(SITE_DIR, ".git"))) {
    console.log("Initializing git in _site...");
    execSync("git init", { cwd: SITE_DIR });
    execSync(`git remote add origin ${PUBLIC_REPO}`, { cwd: SITE_DIR });
  }

  // 4️⃣ 全ファイルステージング
  execSync("git add .", { cwd: SITE_DIR });

  // 5️⃣ 変更があれば commit
  const status = execSync("git status --porcelain", {
    cwd: SITE_DIR,
  }).toString();
  if (status.trim() !== "") {
    execSync(`git commit -m "${COMMIT_MESSAGE}"`, { cwd: SITE_DIR });
    console.log("Committed changes.");
  } else {
    console.log("No changes to commit.");
  }

  // 6️⃣ Public に強制 push
  console.log("Pushing to Public repository...");
  execSync("git push origin main --force", { cwd: SITE_DIR, stdio: "inherit" });

  console.log("✅ Deployment complete!");
} catch (err) {
  console.error("❌ Deployment failed:", err);
}
