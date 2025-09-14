const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const fse = require("fs-extra");

const siteDir = path.resolve("./_site");
const publicDir = path.resolve("./_site_public");
const pathPrefix = "/assets"; // 必要に応じて変更

// --------------------
// HTML/CSSリンク更新
// --------------------
function updateLinks() {
  console.log("Running: update HTML/CSS links with pathPrefix...");

  const files = [];
  function walk(dir) {
    fs.readdirSync(dir).forEach((f) => {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (/\.(html|css)$/.test(f)) files.push(full);
    });
  }
  walk(siteDir);

  files.forEach((file) => {
    let content = fs.readFileSync(file, "utf8");

    // 例: /assets → pathPrefix付きに置換
    content = content.replace(/(href|src)=["']\/assets/g, `$1="${pathPrefix}`);
    fs.writeFileSync(file, content);
  });

  console.log("HTML and CSS links updated successfully!");
}

// --------------------
// コピー _site → _site_public
// --------------------
function copySite() {
  if (fs.existsSync(publicDir)) {
    console.log(`'_site_public' already exists, resetting local changes...`);
    try {
      execSync(`git -C ${publicDir} reset --hard`, { stdio: "inherit" });
      execSync(`git -C ${publicDir} clean -fd`, { stdio: "inherit" });
      execSync(
        `git -C ${publicDir} pull git@github-ohmori:obw83/bw83.git main`,
        { stdio: "inherit" }
      );
    } catch (err) {
      console.error("Error pulling latest changes:", err.message);
    }
  } else {
    console.log(`'_site_public' does not exist, cloning...`);
    execSync(
      `git clone -b main git@github-ohmori:obw83/bw83.git ${publicDir}`,
      { stdio: "inherit" }
    );
  }

  console.log(`Copying ${siteDir} → ${publicDir}`);
  fse.copySync(siteDir, publicDir, { overwrite: true });
}

// --------------------
// git add → commit → push
// --------------------
function deployGit() {
  console.log("Staging changes...");
  try {
    // .gitignore 無視して add
    execSync(`git -C ${publicDir} add -A`, { stdio: "inherit" });

    // commit
    const status = execSync(`git -C ${publicDir} status --porcelain`)
      .toString()
      .trim();
    if (status) {
      execSync(`git -C ${publicDir} commit -m "Deploy site"`, {
        stdio: "inherit",
      });
      console.log("Pushing to main...");
      execSync(
        `git -C ${publicDir} push git@github-ohmori:obw83/bw83.git main`,
        { stdio: "inherit" }
      );
      console.log("Deployment completed successfully!");
    } else {
      console.log("No changes to commit.");
    }
  } catch (err) {
    console.error(err);
    console.error("Deployment failed.");
    process.exit(1);
  }
}

// --------------------
// 実行
// --------------------
function main() {
  updateLinks();
  copySite();
  deployGit();
}

main();
