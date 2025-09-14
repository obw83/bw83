// deploy.js
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const SITE_DIR = path.resolve(__dirname, "_site");
const PUBLIC_DIR = path.resolve(__dirname, "_site_public");

const REMOTE = "github-ohmori"; // SSH config の Host 名
const REPO = "obw83/bw83.git";
const BRANCH = "main";

// --- ヘルパー関数 ---
function run(cmd, desc) {
  console.log(`Running: ${desc || cmd}`);
  try {
    execSync(cmd, { stdio: "inherit" });
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

// --- HTML/CSS のリンク更新 ---
function updateLinks() {
  console.log("Updating HTML/CSS links...");
  // 既存 add-url-filter.js を使う場合
  const addUrlFilter = path.join(__dirname, "add-url-filter.js");
  if (fs.existsSync(addUrlFilter)) {
    run(`node ${addUrlFilter}`, "update HTML/CSS links with pathPrefix");
  } else {
    console.log("add-url-filter.js not found, skipping link update.");
  }
  console.log("HTML/CSS links updated successfully!");
}

// --- _site → _site_public コピー ---
function copySite() {
  console.log(`Copying ${SITE_DIR} → ${PUBLIC_DIR} ...`);
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR);
  run(
    `rsync -a --delete ${SITE_DIR}/ ${PUBLIC_DIR}/`,
    "Copy _site to _site_public"
  );
}

// --- git 操作 ---
function git(cmd) {
  return execSync(`git -C ${PUBLIC_DIR} ${cmd}`, { stdio: "inherit" });
}

function deploy() {
  updateLinks();

  if (!fs.existsSync(PUBLIC_DIR)) {
    console.log(`_site_public not found, initializing...`);
    fs.mkdirSync(PUBLIC_DIR);
    run(`git -C ${PUBLIC_DIR} init`);
    git(`remote add origin ${REMOTE}:${REPO}`);
    git(`fetch origin ${BRANCH}`);
    git(`checkout -b ${BRANCH} origin/${BRANCH}`);
  } else {
    console.log(`'_site_public' already exists, resetting local changes...`);
    git("reset --hard");
    git(`pull ${REMOTE}:${REPO} ${BRANCH}`);
  }

  copySite();

  console.log("Staging changes...");
  try {
    git(`add -f .`); // -f で .gitignore に入ってても強制 add
  } catch (err) {
    console.error("Git add failed:", err.message);
    process.exit(1);
  }

  try {
    git(`commit -m "Deploy site"`);
  } catch (err) {
    console.log("No changes to commit.");
  }

  console.log("Pushing to remote...");
  git(`push ${REMOTE}:${REPO} ${BRANCH}`);
  console.log("Deployment finished!");
}

// --- 実行 ---
deploy();
