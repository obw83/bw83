const { execSync } = require("child_process");
const fs = require("fs-extra");

const siteDir = "_site";
const deployDir = "_site_public";
const gitHost = "github-ohmori"; // SSH 設定済みホスト

function run(cmd) {
  console.log("Running:", cmd);
  execSync(cmd, { stdio: "inherit" });
}

function main() {
  // HTML 内リンク書き換え
  run("node add-url-filter.js");

  // _site_public がなければクローン
  if (!fs.existsSync(deployDir)) {
    run(`git clone -b main ${gitHost}:obw83/bw83.git ${deployDir}`);
  } else {
    // pull 最新
    run(`git -C ${deployDir} pull origin main`);
  }

  // _site → _site_public へコピー（全 assets 含む）
  fs.copySync(siteDir, deployDir, { overwrite: true });

  // commit & push
  run(`git -C ${deployDir} add .`);
  run(
    `git -C ${deployDir} commit -m "Deploy site" || echo "Nothing to commit"`
  );
  run(`git -C ${deployDir} push origin main`);
  console.log("Deployment complete!");
}

main();
