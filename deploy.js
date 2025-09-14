#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// 設定
const siteDir = path.resolve(__dirname, "_site");
const publicDir = path.resolve(__dirname, "_site_public");
const remoteRepo = "git@github.com:obw83/bw83.git"; // public repo
const branch = "main";

// 1. HTML/CSS リンク更新（pathPrefix 用）
console.log("Updating HTML/CSS links with pathPrefix...");
try {
  execSync("node add-url-filter.js", { stdio: "inherit" });
} catch (e) {
  console.error("Error running add-url-filter.js", e);
  process.exit(1);
}
console.log("HTML and CSS links updated successfully!");

// 2. _site_public が存在するか確認
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
  console.log(`Created _site_public at ${publicDir}`);
}

// 3. Git 初期化・remote 設定
try {
  execSync(`git -C ${publicDir} init`, { stdio: "inherit" });
  execSync(`git -C ${publicDir} remote remove origin || true`, {
    stdio: "inherit",
  });
  execSync(`git -C ${publicDir} remote add origin ${remoteRepo}`, {
    stdio: "inherit",
  });
} catch (e) {
  console.error("Error initializing git repo", e);
  process.exit(1);
}

// 4. リモートブランチ取得 & リセット
try {
  execSync(`git -C ${publicDir} fetch origin ${branch} || true`, {
    stdio: "inherit",
  });
  execSync(`git -C ${publicDir} reset --hard origin/${branch} || true`, {
    stdio: "inherit",
  });
  execSync(`git -C ${publicDir} clean -fd`, { stdio: "inherit" });
  console.log("Reset _site_public to origin/main");
} catch (e) {
  console.log("No remote branch yet, continuing...");
}

// 5. _site → _site_public にコピー
try {
  execSync(`rsync -a --delete ${siteDir}/ ${publicDir}/`, { stdio: "inherit" });
  console.log("Copied files from _site → _site_public");
} catch (e) {
  console.error("Error copying files", e);
  process.exit(1);
}

// 6. Git add / commit
try {
  execSync(`git -C ${publicDir} add -A`, { stdio: "inherit" });
  const status = execSync(`git -C ${publicDir} status --porcelain`)
    .toString()
    .trim();
  if (status) {
    execSync(`git -C ${publicDir} commit -m "Deploy site"`, {
      stdio: "inherit",
    });
    console.log("Committed changes");
  } else {
    console.log("Nothing to commit");
  }
} catch (e) {
  console.error("Error committing changes", e);
  process.exit(1);
}

// 7. Git push
try {
  execSync(`git -C ${publicDir} branch -M ${branch}`, { stdio: "inherit" });
  execSync(`git -C ${publicDir} push origin ${branch} --force`, {
    stdio: "inherit",
  });
  console.log("Deployment complete!");
} catch (e) {
  console.error("Error pushing to remote", e);
  console.error(
    "Make sure your SSH key has write access to the repo:",
    remoteRepo
  );
  process.exit(1);
}
