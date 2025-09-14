// deploy.js
const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

// 設定
const publicDir = "_site_public"; // デプロイ先ディレクトリ
const gitHost = "github-ohmori"; // SSH config の alias
const gitRepo = "obw83/bw83.git"; // リポジトリ名
const gitBranch = "main"; // デプロイ先ブランチ

// HTML/CSS の pathPrefix 更新用スクリプト
console.log("Running: update HTML/CSS links with pathPrefix...");
execSync("node add-url-filter.js", { stdio: "inherit" });
console.log("HTML/CSS links updated!");

// Git URL 作成
const gitUrl = `git@${gitHost}:${gitRepo}`;

function run() {
  // clone または pull
  if (!fs.existsSync(publicDir)) {
    console.log(`'_site_public' does not exist, cloning repo...`);
    execSync(`git clone -b ${gitBranch} ${gitUrl} ${publicDir}`, {
      stdio: "inherit",
    });
  } else {
    console.log(`'_site_public' already exists, pulling latest...`);
    execSync(`git -C ${publicDir} pull ${gitUrl} ${gitBranch}`, {
      stdio: "inherit",
    });
  }

  // _site → _site_public にコピー
  console.log(`Copying _site → ${publicDir}`);
  execSync(`rsync -av --delete _site/ ${publicDir}/`, { stdio: "inherit" });

  // Git add / commit / push
  try {
    execSync(`git -C ${publicDir} add .`, { stdio: "inherit" });
    execSync(`git -C ${publicDir} commit -m "Deploy site"`, {
      stdio: "inherit",
    });
  } catch (e) {
    console.log("Nothing to commit, all files up-to-date.");
  }

  console.log(`Pushing to ${gitBranch}...`);
  execSync(`git -C ${publicDir} push ${gitUrl} ${gitBranch}`, {
    stdio: "inherit",
  });

  console.log("Deployment complete!");
}

run();
