const fs = require("fs-extra");
const { execSync } = require("child_process");

function run(cmd) {
  console.log(`Running: ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

// 1. HTML 内リンク更新
run("node add-url-filter.js");

// 2. _site_public の git リポ確認
if (!fs.existsSync("_site_public")) {
  run("git clone -b main git@github-obw83:obw83/bw83.git _site_public");
} else {
  run("git -C _site_public pull git@github-obw83:obw83/bw83.git main");
}

// 3. _site → _site_public にコピー
fs.copySync("_site", "_site_public", { overwrite: true });
console.log("Copied _site → _site_public");

// 4. git commit & push
run("git -C _site_public add .");

try {
  run('git -C _site_public commit -m "Deploy site"');
} catch (e) {
  console.log("No changes to commit.");
}

run("git -C _site_public push git@github-obw83:obw83/bw83.git main");

console.log("Deployment complete!");
