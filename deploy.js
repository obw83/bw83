const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ================================
// 設定
// ================================
const SITE_DIR = path.join(__dirname, "_site"); // ビルド済みサイト
const PUBLIC_DIR = path.join(__dirname, "_site_public"); // clone 先
const PUBLIC_REPO = "git@github-obw83:obw83/bw83.git"; // obw83 用リポジトリ
const BRANCH = "main";

// ================================
// HTML 内リンクを書き換え（既に add-url-filter.js で実行済みならスキップ可能）
console.log("HTML links already updated via add-url-filter.js");

// ================================
// Public リポジトリの clone / 初期化
if (!fs.existsSync(PUBLIC_DIR)) {
  console.log(`Cloning ${PUBLIC_REPO} into ${PUBLIC_DIR}...`);
  execSync(`git clone -b ${BRANCH} ${PUBLIC_REPO} ${PUBLIC_DIR}`, {
    stdio: "inherit",
  });
} else {
  console.log(`${PUBLIC_DIR} already exists, pulling latest...`);
  execSync(`cd ${PUBLIC_DIR} && git pull origin ${BRANCH}`, {
    stdio: "inherit",
  });
}

// ================================
// _site 内のファイルをコピー
console.log("Copying _site files to _site_public...");
execSync(`rsync -av --delete ${SITE_DIR}/ ${PUBLIC_DIR}/`, {
  stdio: "inherit",
});

// ================================
// commit & push
console.log("Adding, committing, and pushing changes...");
execSync(`cd ${PUBLIC_DIR} && git config user.name "obw83"`, {
  stdio: "inherit",
});
execSync(
  `cd ${PUBLIC_DIR} && git config user.email "あなたの obw83 メールアドレス"`,
  { stdio: "inherit" }
);
execSync(`cd ${PUBLIC_DIR} && git add .`, { stdio: "inherit" });
execSync(
  `cd ${PUBLIC_DIR} && git commit -m "Deploy site from obw83" || echo "Nothing to commit"`,
  { stdio: "inherit" }
);
execSync(`cd ${PUBLIC_DIR} && git push origin ${BRANCH}`, { stdio: "inherit" });

console.log("Deployment complete!");
