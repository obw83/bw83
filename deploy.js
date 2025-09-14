// deploy.js
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const SITE_DIR = path.resolve(__dirname, "_site");
const PUBLIC_DIR = path.resolve(__dirname, "_site_public");

// --- helper ---
function run(cmd, options = {}) {
  console.log(`Running: ${cmd}`);
  try {
    execSync(cmd, { stdio: "inherit", ...options });
  } catch (err) {
    console.error("Command failed:", err.message);
    process.exit(1);
  }
}

// --- HTML/CSSリンク更新 ---
console.log("Running: update HTML/CSS links with pathPrefix...");
run("node add-url-filter.js");

// --- コピー ---
console.log(`Copying ${SITE_DIR} → ${PUBLIC_DIR}`);
run(`rsync -a --delete ${SITE_DIR}/ ${PUBLIC_DIR}/`);

// --- Git デプロイ ---
function deployGit() {
  if (!fs.existsSync(path.join(PUBLIC_DIR, ".git"))) {
    console.log("_site_public is not a git repo, initializing...");
    run(`git -C ${PUBLIC_DIR} init`);
  }

  // リモート設定
  run(`git -C ${PUBLIC_DIR} remote remove origin || true`);
  run(
    `git -C ${PUBLIC_DIR} remote add origin git@github-ohmori:obw83/bw83.git`
  );

  console.log("'_site_public' resetting local changes...");
  run(`git -C ${PUBLIC_DIR} reset --hard`);
  run(`git -C ${PUBLIC_DIR} clean -fd`);

  // Git にファイルを追加
  console.log("Staging files...");
  run(`git -C ${PUBLIC_DIR} add .`);

  // commit
  try {
    run(`git -C ${PUBLIC_DIR} commit -m "Deploy site"`);
  } catch {
    console.log("No changes to commit.");
  }

  // main ブランチが存在するか確認
  let branchExists = true;
  try {
    execSync(`git -C ${PUBLIC_DIR} rev-parse --verify main`, {
      stdio: "ignore",
    });
  } catch {
    branchExists = false;
  }

  // push
  if (branchExists) {
    run(`git -C ${PUBLIC_DIR} push origin main`);
  } else {
    console.log("Creating main branch and pushing...");
    run(`git -C ${PUBLIC_DIR} branch -M main`);
    run(`git -C ${PUBLIC_DIR} push -u origin main`);
  }
}

deployGit();

console.log("Deployment finished successfully!");
