const { execSync } = require("child_process");
const fs = require("fs-extra");

const repoSSH = "git@github-obw83:bw83/bw83.git"; // SSH HostName は ~/.ssh/config に合わせる
const deployDir = "_site_public";

// URL 書き換え
console.log("Running: node add-url-filter.js");
execSync("node add-url-filter.js", { stdio: "inherit" });

// clone か pull
if (!fs.existsSync(deployDir)) {
  console.log(`Cloning into '${deployDir}'...`);
  execSync(`git clone -b main ${repoSSH} ${deployDir}`, { stdio: "inherit" });
} else {
  console.log(`'${deployDir}' already exists, pulling latest...`);
  execSync(`git -C ${deployDir} pull origin main`, { stdio: "inherit" });
}

// _site の中身をコピー
fs.copySync("_site", deployDir, { overwrite: true });
console.log(`Copied _site → ${deployDir}`);

// git add/commit/push
try {
  execSync(`git -C ${deployDir} add .`, { stdio: "inherit" });
  execSync(`git -C ${deployDir} commit -m "Deploy site"`, { stdio: "inherit" });
} catch (e) {
  console.log("Nothing to commit");
}

console.log(`Running: git -C ${deployDir} push origin main`);
execSync(`git -C ${deployDir} push origin main`, { stdio: "inherit" });

console.log("Deployment complete!");
