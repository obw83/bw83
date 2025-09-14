// deploy.js
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const siteDir = path.join(__dirname, "_site");
const publicDir = path.join(__dirname, "_site_public");

// PathPrefix 更新用（必要であれば）
function updateLinks() {
  console.log("Updating HTML/CSS links with pathPrefix...");
  try {
    execSync("node add-url-filter.js", { stdio: "inherit" });
    console.log("HTML and CSS links updated successfully!");
  } catch (err) {
    console.error("Error updating links:", err);
  }
}

// _site_public の初期化とリモート設定
function setupPublicRepo() {
  if (!fs.existsSync(path.join(publicDir, ".git"))) {
    console.log("_site_public is not a git repo, initializing...");
    execSync(`git -C "${publicDir}" init`, { stdio: "inherit" });
  }

  // public リポジトリに origin を設定
  execSync(`git -C "${publicDir}" remote remove origin || true`, {
    stdio: "inherit",
  });
  execSync(
    `git -C "${publicDir}" remote add origin git@github-ohmori:obw83/bw83.git`,
    { stdio: "inherit" }
  );

  // リセットして clean
  console.log("Resetting _site_public to latest origin/main...");
  try {
    execSync(`git -C "${publicDir}" fetch origin main`, { stdio: "inherit" });
    execSync(`git -C "${publicDir}" reset --hard origin/main`, {
      stdio: "inherit",
    });
  } catch (err) {
    console.log("Branch main may not exist yet, continue.");
  }
  execSync(`git -C "${publicDir}" clean -fd`, { stdio: "inherit" });
}

// _site → _site_public コピー
function copySite() {
  console.log(`Copying ${siteDir} → ${publicDir}`);
  execSync(`rsync -a --delete "${siteDir}/" "${publicDir}/"`, {
    stdio: "inherit",
  });
}

// git commit & push
function commitAndPush() {
  console.log("Staging files...");
  execSync(`git -C "${publicDir}" add -A`, { stdio: "inherit" });

  console.log("Committing changes...");
  try {
    execSync(`git -C "${publicDir}" commit -m "Deploy site"`, {
      stdio: "inherit",
    });
  } catch (err) {
    console.log("Nothing to commit, continuing...");
  }

  // ブランチ作成（初回 push 用）
  try {
    execSync(`git -C "${publicDir}" branch -M main`, { stdio: "inherit" });
  } catch (err) {
    // すでに main なら無視
  }

  console.log("Pushing to GitHub Pages repository...");
  execSync(`git -C "${publicDir}" push origin main --force`, {
    stdio: "inherit",
  });
}

function main() {
  updateLinks();
  setupPublicRepo();
  copySite();
  commitAndPush();
  console.log("Deployment complete!");
}

main();
