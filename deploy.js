const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// ビルド済み出力先
const SITE_DIR = path.join(__dirname, "_site");
// Public リポジトリ URL
const PUBLIC_REPO = "https://github.com/obw83/bw83.git";
const COMMIT_MESSAGE = "Deploy Eleventy site";

try {
  // 1️⃣ Eleventy ビルド
  console.log("Building Eleventy site...");
  execSync("npx eleventy", { stdio: "inherit" });

  // 2️⃣ Publicリポジトリが git 初期化済みか確認
  if (!fs.existsSync(path.join(SITE_DIR, ".git"))) {
    console.log("Initializing git in _site...");
    execSync("git init", { cwd: SITE_DIR });
    execSync(`git remote add origin ${PUBLIC_REPO}`, { cwd: SITE_DIR });
  }

  // 3️⃣ 全ファイルステージング
  execSync("git add .", { cwd: SITE_DIR });

  // 4️⃣ 変更があれば commit
  const status = execSync("git status --porcelain", {
    cwd: SITE_DIR,
  }).toString();
  if (status.trim() !== "") {
    execSync(`git commit -m "${COMMIT_MESSAGE}"`, { cwd: SITE_DIR });
    console.log("Committed changes.");
  } else {
    console.log("No changes to commit.");
  }

  // 5️⃣ 強制 push（Public リポジトリ main ブランチに）
  console.log("Pushing to Public repository...");
  execSync("git push origin main --force", { cwd: SITE_DIR, stdio: "inherit" });

  console.log("✅ Deployment complete!");
} catch (err) {
  console.error("❌ Deployment failed:", err);
}
