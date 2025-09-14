const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const SITE_DIR = path.join(__dirname, "_site");
const PUBLIC_DIR = path.join(__dirname, "_site_public");

// 実行コマンドのラッパー
function run(cmd, options = {}) {
  console.log(`Running: ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...options });
}

// HTML/CSSリンク更新
function updateLinks() {
  console.log("Running: update HTML/CSS links with pathPrefix...");
  run("node add-url-filter.js");
  console.log("HTML and CSS links updated successfully!");
}

// _site → _site_public コピー
function copySite() {
  console.log(`Copying ${SITE_DIR} → ${PUBLIC_DIR}`);
  run(`rsync -a --delete ${SITE_DIR}/ ${PUBLIC_DIR}/`);

  // 不要ファイル削除
  const readmePath = path.join(PUBLIC_DIR, "README.md");
  if (fs.existsSync(readmePath)) {
    console.log("Removing README.md from _site_public");
    fs.unlinkSync(readmePath);
  }
}

// デプロイ用 git 処理
function deployGit() {
  if (!fs.existsSync(path.join(PUBLIC_DIR, ".git"))) {
    console.log("_site_public is not a git repo, initializing...");
    run(`git -C ${PUBLIC_DIR} init`);
  }

  // リモートを正しい URL に設定
  run(`git -C ${PUBLIC_DIR} remote remove origin || true`);
  run(
    `git -C ${PUBLIC_DIR} remote add origin git@github-ohmori:obw83/bw83.git`
  );

  console.log("'_site_public' resetting local changes...");
  run(`git -C ${PUBLIC_DIR} reset --hard`);
  run(`git -C ${PUBLIC_DIR} clean -fd`);

  console.log("Pulling latest changes...");
  run(`git -C ${PUBLIC_DIR} pull origin main --rebase`);

  console.log("Staging changes...");
  run(`git -C ${PUBLIC_DIR} add .`);

  console.log("Committing changes...");
  try {
    run(`git -C ${PUBLIC_DIR} commit -m "Deploy site"`);
  } catch (e) {
    console.log("No changes to commit.");
  }

  console.log("Pushing to main...");
  run(`git -C ${PUBLIC_DIR} push origin main`);
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
