const { execSync } = require("child_process");
const fs = require("fs-extra");
const path = require("path");

const SITE_DIR = "_site";
const PUBLIC_DIR = "_site_public";
const REPO_URL = "git@github.com:obw83/bw83.git"; // 自分のリポジトリURL
const BRANCH = "main";

function run(cmd, options = {}) {
  console.log(`Running: ${cmd}`);
  return execSync(cmd, { stdio: "inherit", ...options });
}

// 1. HTMLリンク書き換え
run("node add-url-filter.js");

// 2. _site_public がなければ clone
if (!fs.existsSync(PUBLIC_DIR)) {
  run(`git clone -b ${BRANCH} ${REPO_URL} ${PUBLIC_DIR}`);
} else {
  // pull 最新
  run(`git -C ${PUBLIC_DIR} pull origin ${BRANCH}`);
}

// 3. _site → _site_public に上書きコピー
fs.copySync(SITE_DIR, PUBLIC_DIR, { overwrite: true });
console.log(`Copied ${SITE_DIR} → ${PUBLIC_DIR}`);

// 4. _site_public 内で Git commit & push
run(`git -C ${PUBLIC_DIR} add .`);
try {
  run(`git -C ${PUBLIC_DIR} commit -m "Deploy site"`);
} catch (e) {
  console.log("Nothing to commit, working tree clean");
}
run(`git -C ${PUBLIC_DIR} push origin ${BRANCH}`);

console.log("Deployment complete!");
