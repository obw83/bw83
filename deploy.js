// deploy.js (github-ohmori 用完全版)
const { execSync } = require("child_process");
const fs = require("fs-extra");

const siteDir = "_site";
const deployDir = "_site_public";
const gitHost = "github-ohmori"; // SSH config の Host 名
const repoName = "obw83/bw83.git"; // デプロイ先リポジトリ

function run(cmd) {
  console.log("Running:", cmd);
  execSync(cmd, { stdio: "inherit" });
}

function main() {
  // HTML 内リンク書き換え
  run("node add-url-filter.js");

  // _site_public がなければクローン、あれば pull
  if (!fs.existsSync(deployDir)) {
    run(`git clone -b main ${gitHost}:${repoName} ${deployDir}`);
  } else {
    run(`git -C ${deployDir} pull ${gitHost}:${repoName} main`);
  }

  // _site → _site_public にコピー
  fs.copySync(siteDir, deployDir, { overwrite: true });

  // commit & push
  run(`git -C ${deployDir} add .`);
  try {
    run(`git -C ${deployDir} commit -m "Deploy site"`);
  } catch (e) {
    console.log("Nothing to commit");
  }
  run(`git -C ${deployDir} push ${gitHost}:${repoName} main`);

  console.log("Deployment complete!");
}

main();
