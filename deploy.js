const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const siteDir = path.resolve("./_site");
const publicDir = path.resolve("./_site_public");

// HTML/CSS 内のリンク更新（add-url-filter.js 実行）
console.log("Running: update HTML/CSS links with pathPrefix...");
try {
  execSync("node add-url-filter.js", { stdio: "inherit" });
  console.log("HTML and CSS links updated successfully!");
} catch (err) {
  console.error(err);
  process.exit(1);
}

// _site_public の存在チェック
if (!fs.existsSync(publicDir)) {
  console.log(`'_site_public' does not exist, cloning...`);
  try {
    execSync(
      `git clone -b main git@github-ohmori:obw83/bw83.git ${publicDir}`,
      { stdio: "inherit" }
    );
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
} else {
  console.log(`'_site_public' already exists, resetting local changes...`);
  try {
    // 1. リセットして古い変更を破棄
    execSync(`git -C ${publicDir} reset --hard`, { stdio: "inherit" });
    execSync(`git -C ${publicDir} clean -fd`, { stdio: "inherit" });

    // 2. 最新を取得
    execSync(`git -C ${publicDir} pull origin main`, { stdio: "inherit" });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

// _site の中身を _site_public にコピー
console.log("Copying _site → _site_public");
try {
  execSync(`rsync -av --delete ${siteDir}/ ${publicDir}/`, {
    stdio: "inherit",
  });
} catch (err) {
  console.error(err);
  process.exit(1);
}

// git add → commit → push
console.log("Staging changes...");
try {
  execSync(`git -C ${publicDir} add .`, { stdio: "inherit" });
  execSync(`git -C ${publicDir} commit -m "Deploy site"`, { stdio: "inherit" });
  console.log("Pushing to main...");
  execSync(`git -C ${publicDir} push git@github-ohmori:obw83/bw83.git main`, {
    stdio: "inherit",
  });
  console.log("Deployment completed successfully!");
} catch (err) {
  console.error(err);
  console.error("Deployment failed.");
  process.exit(1);
}
