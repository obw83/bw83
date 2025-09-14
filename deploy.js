const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const SITE_DIR = path.join(__dirname, "_site");
const PUBLIC_DIR = path.join(__dirname, "_site_public");

// 実行コマンドのラッパー
function git(cmd, options = {}) {
  try {
    console.log(`Running: git ${cmd}`);
    const result = execSync(`git ${cmd}`, { stdio: "inherit", ...options });
    return result;
  } catch (err) {
    console.error(`Git command failed: git ${cmd}`);
    throw err;
  }
}

// HTML/CSSリンク更新用（例として pathPrefix 付与）
function updateLinks() {
  console.log("Running: update HTML/CSS links with pathPrefix...");
  // ここに add-url-filter.js の処理を統合してもよい
  execSync("node add-url-filter.js", { stdio: "inherit" });
  console.log("HTML and CSS links updated successfully!");
}

// _site → _site_public コピー
function copySite() {
  console.log(`Copying ${SITE_DIR} → ${PUBLIC_DIR}`);
  execSync(`rsync -a --delete ${SITE_DIR}/ ${PUBLIC_DIR}/`, {
    stdio: "inherit",
  });

  // 不要ファイル削除（READMEなど）
  const readmePath = path.join(PUBLIC_DIR, "README.md");
  if (fs.existsSync(readmePath)) {
    console.log("Removing README.md from _site_public");
    fs.unlinkSync(readmePath);
  }
}

// デプロイ用 git 処理
function deployGit() {
  console.log("'_site_public' already exists, resetting local changes...");
  git(`-C ${PUBLIC_DIR} reset --hard`);
  git(`-C ${PUBLIC_DIR} clean -fd`);

  console.log("Pulling latest changes...");
  git(`-C ${PUBLIC_DIR} pull github-ohmori main`);

  console.log("Staging changes...");
  git(`-C ${PUBLIC_DIR} add .`);

  console.log("Committing changes...");
  try {
    git(`-C ${PUBLIC_DIR} commit -m "Deploy site"`);
  } catch (e) {
    console.log("No changes to commit.");
  }

  console.log("Pushing to main...");
  git(`-C ${PUBLIC_DIR} push github-ohmori main`);
}

// メイン
function main() {
  try {
    updateLinks();
    copySite();
    deployGit();
    console.log("Deployment completed successfully!");
  } catch (err) {
    console.error("Deployment failed.");
    process.exit(1);
  }
}

main();
