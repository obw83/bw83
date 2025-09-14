const fs = require("fs");
const { execSync } = require("child_process");

const publicDir = "_site_public";
const gitHost = "github-ohmori";
const gitRepo = "obw83/bw83.git";
const gitBranch = "main";
const gitUrl = `git@${gitHost}:${gitRepo}`;

console.log("Running: update HTML/CSS links with pathPrefix...");
execSync("node add-url-filter.js", { stdio: "inherit" });
console.log("HTML/CSS links updated!");

function run() {
  if (!fs.existsSync(publicDir)) {
    console.log(`'_site_public' does not exist, cloning repo...`);
    execSync(`git clone -b ${gitBranch} ${gitUrl} ${publicDir}`, {
      stdio: "inherit",
    });
  } else {
    console.log(`'_site_public' already exists, resetting local changes...`);
    execSync(`git -C ${publicDir} fetch ${gitUrl} ${gitBranch}`, {
      stdio: "inherit",
    });
    execSync(`git -C ${publicDir} reset --hard ${gitBranch}`, {
      stdio: "inherit",
    });
  }

  console.log(`Copying _site → ${publicDir}`);
  execSync(`rsync -av --delete _site/ ${publicDir}/`, { stdio: "inherit" });

  execSync(`git -C ${publicDir} add .`, { stdio: "inherit" });

  try {
    execSync(`git -C ${publicDir} commit -m "Deploy site"`, {
      stdio: "inherit",
    });
  } catch (e) {
    console.log("Nothing to commit, all files up-to-date.");
  }

  console.log(`Force pushing to ${gitBranch}...`);
  execSync(`git -C ${publicDir} push -f ${gitUrl} ${gitBranch}`, {
    stdio: "inherit",
  });

  console.log("Deployment complete!");
}

run();
