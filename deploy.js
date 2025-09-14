const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// ----- 設定 -----
const pathPrefix = "/bw83/"; // GitHub Pages pathPrefix
const siteDir = "_site"; // Eleventy 出力先
const publicDir = "_site_public"; // デプロイ用ディレクトリ
const gitHost = "github-ohmori"; // SSH 設定で ohmori キーを使う
const gitRepo = "obw83/bw83.git"; // リポジトリ
const gitBranch = "main";

// ----- HTML/CSS 内リンク書き換え -----
function updateLinks(dir) {
  console.log("Running: update HTML/CSS links with pathPrefix...");

  const walk = (dir) => {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) walk(fullPath);
      else if (fullPath.endsWith(".html") || fullPath.endsWith(".css")) {
        let content = fs.readFileSync(fullPath, "utf8");
        // ここで /assets/ → pathPrefix + assets/ に書き換え
        content = content.replace(
          /(["'(])\/assets\//g,
          `$1${pathPrefix}assets/`
        );
        fs.writeFileSync(fullPath, content);
      }
    });
  };

  walk(dir);
  console.log("HTML/CSS links updated!");
}

// ----- Git デプロイ -----
function deploy() {
  updateLinks(siteDir);

  if (!fs.existsSync(publicDir)) {
    console.log(`'_site_public' does not exist, cloning repo...`);
    execSync(
      `git clone -b ${gitBranch} git@${gitHost}:${gitRepo} ${publicDir}`,
      { stdio: "inherit" }
    );
  } else {
    console.log(`'_site_public' already exists, pulling latest...`);
    execSync(`git -C ${publicDir} pull ${gitHost} ${gitBranch}`, {
      stdio: "inherit",
    });
  }

  console.log(`Copying ${siteDir} → ${publicDir}`);
  execSync(`rsync -a --delete ${siteDir}/ ${publicDir}/`, { stdio: "inherit" });

  console.log("Staging changes...");
  execSync(`git -C ${publicDir} add .`, { stdio: "inherit" });

  try {
    execSync(`git -C ${publicDir} commit -m "Deploy site"`, {
      stdio: "inherit",
    });
  } catch (e) {
    console.log("No changes to commit.");
  }

  console.log(`Pushing to ${gitHost}...`);
  execSync(`git -C ${publicDir} push ${gitHost} ${gitBranch}`, {
    stdio: "inherit",
  });

  console.log("Deployment complete!");
}

// ----- 実行 -----
deploy();
