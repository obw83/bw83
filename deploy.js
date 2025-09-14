const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const site = path.resolve(__dirname, "_site");
const sitePublic = path.resolve(__dirname, "_site_public");

function run(cmd) {
  console.log(`Running: ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

// HTML/CSS リンク更新
console.log("Running: update HTML/CSS links with pathPrefix...");
// ここに add-url-filter.js を呼ぶ場合
if (fs.existsSync(path.join(__dirname, "add-url-filter.js"))) {
  run(`node add-url-filter.js`);
}
console.log("HTML and CSS links updated successfully!");

// コピー
console.log(`Copying ${site} → ${sitePublic}`);
run(`rsync -a --delete ${site}/ ${sitePublic}/`);

// Git 初期化
if (!fs.existsSync(path.join(sitePublic, ".git"))) {
  console.log(`${sitePublic} is not a git repo, initializing...`);
  run(`git -C ${sitePublic} init`);
}

// リモート設定
run(`git -C ${sitePublic} remote remove origin || true`);
run(`git -C ${sitePublic} remote add origin git@github-ohmori:obw83/bw83.git`);

// ローカルの変更リセット
console.log(`'_site_public' resetting local changes...`);
run(`git -C ${sitePublic} reset --hard`);
run(`git -C ${sitePublic} clean -fd`);

// リモートブランチ確認
let remoteBranch = "main";
try {
  const output = execSync(
    `git ls-remote --heads git@github-ohmori:obw83/bw83.git`,
    { encoding: "utf8" }
  );
  if (!output.includes("refs/heads/main")) {
    if (output.includes("refs/heads/master")) {
      remoteBranch = "master";
    } else {
      // リモートにブランチなしの場合は main を使う
      remoteBranch = "main";
    }
  }
} catch (e) {
  console.warn("リモートブランチ確認失敗、main を使用");
}

// ローカルブランチ作成
run(`git -C ${sitePublic} checkout -B ${remoteBranch}`);

// ファイルステージング & コミット
console.log("Staging files...");
run(`git -C ${sitePublic} add -f .`);

try {
  run(`git -C ${sitePublic} commit -m "Deploy site"`);
} catch (e) {
  console.log("No changes to commit.");
}

// Push --force
console.log(`Pushing to ${remoteBranch}...`);
run(`git -C ${sitePublic} push -u origin ${remoteBranch} --force`);

console.log("Deployment completed successfully!");
