// deploy.js
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const siteDir = path.resolve(__dirname, "_site");
const publicDir = path.resolve(__dirname, "_site_public");
const remoteRepo = "git@github.com:obw83/bw83.git";
const branch = "main";

// -----------------------------
// 1. HTML/CSS 内リンクを書き換え
// -----------------------------
function updateLinks(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      updateLinks(fullPath);
    } else if (file.endsWith(".html") || file.endsWith(".css")) {
      let content = fs.readFileSync(fullPath, "utf8");

      // 例: 全リンクに /prefix を付与する
      // 実際のルールに合わせて正規表現を調整してください
      content = content.replace(
        /(href|src)=["'](?!http)([^"']+)["']/g,
        '$1="/prefix/$2"'
      );

      fs.writeFileSync(fullPath, content, "utf8");
    }
  });
}
console.log("Updating HTML/CSS links with pathPrefix...");
updateLinks(siteDir);
console.log("HTML and CSS links updated successfully!");

// -----------------------------
// 2. _site → _site_public にコピー
// -----------------------------
const rsyncCmd = `rsync -a --delete "${siteDir}/" "${publicDir}/"`;
console.log(`Copying ${siteDir} → ${publicDir}`);
execSync(rsyncCmd, { stdio: "inherit" });

// -----------------------------
// 3. Git デプロイ処理
// -----------------------------
function git(cmd) {
  return execSync(`git -C "${publicDir}" ${cmd}`, { stdio: "inherit" });
}

if (!fs.existsSync(path.join(publicDir, ".git"))) {
  console.log("_site_public is not a git repo, initializing...");
  git("init");
  git(`remote add origin ${remoteRepo}`);
}

// 最新状態でリセット
console.log("_site_public exists, resetting local changes...");
try {
  git(`fetch origin ${branch}`);
} catch (e) {}
try {
  git(`reset --hard origin/${branch}`);
} catch (e) {}
git("clean -fd");

// 再コピー（上書き）
execSync(rsyncCmd, { stdio: "inherit" });

// コミット & push
console.log("Staging files...");
git("add -A");

try {
  git(`commit -m "Deploy site"`);
} catch (e) {
  console.log("Nothing to commit, continuing...");
}

// ブランチ作成 or 移動
git(`branch -M ${branch}`);

// 強制 push
console.log(`Pushing to ${branch}...`);
git(`push origin ${branch} --force`);

console.log("Deployment complete!");
