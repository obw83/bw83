// deploy.js (完全版)
const { execSync } = require("child_process");
const fs = require("fs-extra");

const siteDir = "_site"; // Eleventy 出力ディレクトリ
const deployDir = "_site_public"; // デプロイ用リポジトリ
const gitHost = "github-ohmori"; // SSH 設定済みホスト
const repoName = "obw83/bw83.git";

function run(cmd) {
  console.log("Running:", cmd);
  execSync(cmd, { stdio: "inherit" });
}

function main() {
  // HTML 内リンク書き換え
  run("node add-url-filter.js");

  // _site_public が存在しなければクローン、あれば pull
  if (!fs.existsSync(deployDir)) {
    run(`git clone -b main ${gitHost}:${repoName} ${deployDir}`);
  } else {
    run(`git -C ${deployDir} pull ${gitHost} main`);
  }

  // _site → _site_public に全コピー
  fs.copySync(siteDir, deployDir, { overwrite: true });

  // commit & push
  run(`git -C ${deployDir} add .`);
  try {
    run(`git -C ${deployDir} commit -m "Deploy site"`);
  } catch (e) {
    console.log("Nothing to commit");
  }
  run(`git -C ${deployDir} push ${gitHost} main`);

  console.log("Deployment complete!");
}

main();
