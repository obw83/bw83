// deploy.js
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const site = path.resolve("./_site");
const sitePublic = path.resolve("./_site_public");

function run(cmd) {
  console.log("Running:", cmd);
  try {
    const output = execSync(cmd, { stdio: "inherit" });
    return output;
  } catch (err) {
    throw err;
  }
}

function deploy() {
  console.log("Running: update HTML/CSS links with pathPrefix...");
  run("node add-url-filter.js");

  // コピー
  console.log(`Copying ${site} → ${sitePublic}`);
  run(`rsync -a --delete ${site}/ ${sitePublic}/`);

  // _site_public が Git repo でなければ初期化
  if (!fs.existsSync(path.join(sitePublic, ".git"))) {
    console.log(`${sitePublic} is not a git repo, initializing...`);
    run(`git -C ${sitePublic} init`);
    run(
      `git -C ${sitePublic} remote add origin git@github-ohmori:obw83/bw83.git`
    );
  }

  // ローカル変更をリセット
  console.log(`'_site_public' resetting local changes...`);
  run(`git -C ${sitePublic} reset --hard || true`);
  run(`git -C ${sitePublic} clean -fd || true`);

  // main ブランチ作成
  run(`git -C ${sitePublic} checkout -B main`);

  // ファイルをステージング（.gitignore 無視して強制追加）
  console.log("Staging files...");
  run(`git -C ${sitePublic} add -A`);

  // コミット（何もなければスキップ）
  try {
    run(`git -C ${sitePublic} commit -m "Deploy site"`);
  } catch (e) {
    console.log("Nothing to commit, skipping commit...");
  }

  // push
  console.log("Pushing to main...");
  run(`git -C ${sitePublic} push -u origin main --force`);
  console.log("Deployment finished successfully!");
}

deploy();
