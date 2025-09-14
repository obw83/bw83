// deploy.js
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const SITE_DIR = path.resolve("./_site");
const PUBLIC_DIR = path.resolve("./_site_public");

function run(cmd) {
  console.log("Running:", cmd);
  return execSync(cmd, { stdio: "inherit" });
}

// HTML/CSS のリンク更新（既存処理）
console.log("Running: update HTML/CSS links with pathPrefix...");
// ここに add-url-filter.js の呼び出しを入れる
run("node add-url-filter.js");

// コピー
console.log(`Copying ${SITE_DIR} → ${PUBLIC_DIR}`);
run(`rsync -a --delete ${SITE_DIR}/ ${PUBLIC_DIR}/`);

// Git リポジトリ初期化
if (!fs.existsSync(path.join(PUBLIC_DIR, ".git"))) {
  console.log(`${PUBLIC_DIR} is not a git repo, initializing...`);
  run(`git -C ${PUBLIC_DIR} init`);
}

// リモート設定
run(`git -C ${PUBLIC_DIR} remote remove origin || true`);
run(`git -C ${PUBLIC_DIR} remote add origin git@github-ohmori:obw83/bw83.git`);

// ローカル変更リセット
console.log(`'_site_public' resetting local changes...`);
run(`git -C ${PUBLIC_DIR} reset --hard`);
run(`git -C ${PUBLIC_DIR} clean -fd`);

// ファイル追加（強制追加で .gitignore 無視）
console.log("Staging files...");
run(`git -C ${PUBLIC_DIR} add -f .`);

// コミット
try {
  run(`git -C ${PUBLIC_DIR} commit -m "Deploy site"`);
} catch {
  console.log("No changes to commit.");
}

// main ブランチ確認
let branchExists = true;
try {
  execSync(`git -C ${PUBLIC_DIR} rev-parse --verify main`, { stdio: "ignore" });
} catch {
  branchExists = false;
}

// プッシュ
if (branchExists) {
  run(`git -C ${PUBLIC_DIR} pull origin main --rebase`);
  run(`git -C ${PUBLIC_DIR} push origin main`);
} else {
  console.log("Creating main branch and pushing...");
  run(`git -C ${PUBLIC_DIR} branch -M main`);
  run(`git -C ${PUBLIC_DIR} push -u origin main`);
}

console.log("Deployment completed!");
