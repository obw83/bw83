const { execSync } = require("child_process");
const fs = require("fs-extra");
const path = require("path");

const SITE_DIR = "_site";
const PUBLIC_DIR = "_site_public";
const REPO_SSH = "git@github-obw83:obw83/bw83.git"; // SSH config の Host 名使用

function run(cmd) {
  console.log("Running:", cmd);
  execSync(cmd, { stdio: "inherit" });
}

// 1. HTML 内リンクを書き換え
run("node add-url-filter.js");

// 2. _site_public を clone or pull
if (!fs.existsSync(PUBLIC_DIR)) {
  run(`git clone -b main ${REPO_SSH} ${PUBLIC_DIR}`);
} else {
  run(`git -C ${PUBLIC_DIR} pull origin main`);
}

// 3. _site → _site_public にコピー
fs.copySync(SITE_DIR, PUBLIC_DIR, { overwrite: true });
console.log(`Copied ${SITE_DIR} → ${PUBLIC_DIR}`);

// 4. git 操作
run(`git -C ${PUBLIC_DIR} add .`);

try {
  run(`git -C ${PUBLIC_DIR} commit -m "Deploy site"`);
} catch (e) {
  console.log("Nothing to commit");
}

run(`git -C ${PUBLIC_DIR} push origin main`);

console.log("Deployment complete!");
