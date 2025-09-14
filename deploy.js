const { execSync } = require("child_process");
const fs = require("fs-extra");
const path = require("path");

// GitHub SSH 設定
const SSH_REMOTE = "git@github-obw83:bw83/bw83.git"; // ~/.ssh/config の Host github-obw83 に対応
const BRANCH = "main";

const SITE_DIR = "_site";
const PUBLIC_DIR = "_site_public";

function run(cmd) {
  console.log(`Running: ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

async function main() {
  // 1. HTMLリンク書き換え
  run("node add-url-filter.js");

  // 2. _site_public が存在するか
  if (!fs.existsSync(PUBLIC_DIR)) {
    // 初回は clone
    run(`git clone -b ${BRANCH} ${SSH_REMOTE} ${PUBLIC_DIR}`);
  } else {
    // 存在する場合は pull
    run(`git -C ${PUBLIC_DIR} pull ${SSH_REMOTE} ${BRANCH}`);
  }

  // 3. _site の内容を _site_public にコピー
  fs.copySync(SITE_DIR, PUBLIC_DIR, { overwrite: true });
  console.log(`Copied ${SITE_DIR} → ${PUBLIC_DIR}`);

  // 4. Git add / commit / push
  run(`git -C ${PUBLIC_DIR} add .`);

  try {
    run(`git -C ${PUBLIC_DIR} commit -m "Deploy site"`);
  } catch (err) {
    console.log("Nothing to commit, continuing...");
  }

  run(`git -C ${PUBLIC_DIR} push ${SSH_REMOTE} ${BRANCH}`);

  console.log("Deployment complete!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
