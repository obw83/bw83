#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const SITE_DIR = "_site";
const PUBLIC_DIR = "_site_public";

// ここに GitHub リポジトリ URL を指定
// SSH 例: git@github.com:obw83/bw83.git
// HTTPS 例: https://github.com/obw83/bw83.git
const REMOTE_REPO = process.env.DEPLOY_REPO || "git@github.com:obw83/bw83.git";
const BRANCH = "main";

function run(cmd, options = {}) {
  console.log("Running:", cmd);
  try {
    const output = execSync(cmd, { stdio: "inherit", ...options });
    return output;
  } catch (err) {
    throw err;
  }
}

// 1. HTML 内リンク書き換え
console.log("Running: node add-url-filter.js");
run("node add-url-filter.js");

// 2. _site_public の準備
if (!fs.existsSync(PUBLIC_DIR)) {
  console.log(`${PUBLIC_DIR} does not exist, cloning...`);
  run(`git clone -b ${BRANCH} ${REMOTE_REPO} ${PUBLIC_DIR}`);
} else {
  console.log(`'${PUBLIC_DIR}' already exists, pulling latest...`);
  run(`git -C ${PUBLIC_DIR} pull origin ${BRANCH}`);
}

// 3. _site → _site_public にコピー
console.log(`Copying ${SITE_DIR} → ${PUBLIC_DIR}`);
function copyDir(src, dest) {
  if (!fs.existsSync(src)) throw new Error(`${src} does not exist`);
  run(`rsync -a --delete ${src}/ ${dest}/`);
}
copyDir(SITE_DIR, PUBLIC_DIR);

// 4. GitHub へ push
try {
  run(`git -C ${PUBLIC_DIR} add .`);
  run(`git -C ${PUBLIC_DIR} commit -m "Deploy site"`);
} catch (err) {
  console.log("Nothing to commit, continuing...");
}

try {
  run(`git -C ${PUBLIC_DIR} push origin ${BRANCH}`);
  console.log("Deployment complete!");
} catch (err) {
  console.error(
    "Push failed. Check your SSH/HTTPS credentials and repository access."
  );
  process.exit(1);
}
