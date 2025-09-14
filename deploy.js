const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const siteDir = path.resolve("./_site");
const publicDir = path.resolve("./_site_public");
const remoteRepo = "git@github-ohmori:obw83/bw83.git";
const branch = "main";

function run(cmd, options = {}) {
  console.log(`Running: ${cmd}`);
  return execSync(cmd, { stdio: "inherit", ...options });
}

function updateLinks() {
  console.log("Running: node add-url-filter.js");
  run("node add-url-filter.js");
  console.log("HTML and CSS links updated successfully!");
}

function preparePublicDir() {
  if (!fs.existsSync(publicDir)) {
    console.log(`'_site_public' does not exist, cloning from remote...`);
    run(`git clone -b ${branch} ${remoteRepo} ${publicDir}`);
  } else {
    console.log(`'_site_public' exists, resetting local changes...`);
    try {
      run(`git -C ${publicDir} fetch origin ${branch}`);
      run(`git -C ${publicDir} reset --hard origin/${branch}`);
      run(`git -C ${publicDir} clean -fd`);
    } catch (e) {
      console.log("Failed to reset, removing and recloning...");
      fs.rmSync(publicDir, { recursive: true, force: true });
      run(`git clone -b ${branch} ${remoteRepo} ${publicDir}`);
    }
  }
}

function copySite() {
  console.log(`Copying ${siteDir} → ${publicDir}`);
  run(`rsync -a --delete ${siteDir}/ ${publicDir}/`);
}

function deploy() {
  updateLinks();
  preparePublicDir();
  copySite();

  console.log("Staging files...");
  run(`git -C ${publicDir} add -A`);
  try {
    run(`git -C ${publicDir} commit -m "Deploy site"`);
  } catch (e) {
    console.log("Nothing to commit, continuing...");
  }

  console.log(`Pushing to ${branch}...`);
  try {
    run(`git -C ${publicDir} push origin ${branch} --force`);
  } catch (e) {
    console.error("Deployment failed.");
    process.exit(1);
  }

  console.log("Deployment complete!");
}

deploy();
