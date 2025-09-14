const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const SITE_DIR = "_site";
const PUBLIC_DIR = "_site_public";
const REPO_URL = "git@github.com:obw83/bw83.git"; // SSH URL
const BRANCH = "main";

try {
  // HTML 内のリンク書き換え
  console.log("HTML links already updated via add-url-filter.js");
  execSync("node add-url-filter.js", { stdio: "inherit" });

  // _site_public がなければ clone
  if (!fs.existsSync(PUBLIC_DIR)) {
    console.log(`${PUBLIC_DIR} does not exist, cloning...`);
    execSync(`git clone -b ${BRANCH} ${REPO_URL} ${PUBLIC_DIR}`, {
      stdio: "inherit",
    });
  }

  // 最新を pull して rebase
  console.log(`${PUBLIC_DIR} already exists, pulling latest...`);
  execSync(`cd ${PUBLIC_DIR} && git pull origin ${BRANCH} --rebase`, {
    stdio: "inherit",
  });

  // _site の内容を _site_public にコピー
  execSync(`rsync -a --delete ${SITE_DIR}/ ${PUBLIC_DIR}/`, {
    stdio: "inherit",
  });

  // commit & push
  execSync(
    `cd ${PUBLIC_DIR} && git add . && git commit -m "Deploy site" || echo "Nothing to commit"`,
    { stdio: "inherit" }
  );
  execSync(`cd ${PUBLIC_DIR} && git push origin ${BRANCH}`, {
    stdio: "inherit",
  });

  console.log("Deployment complete!");
} catch (err) {
  console.error(err);
  process.exit(1);
}
