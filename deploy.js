/**
 * 完全版 deploy.js
 * - add-url-filter 統合
 * - HTML/CSS 内のリンク更新に加え、
 *   <source srcset> や background-image も pathPrefix 適用
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const SITE_DIR = path.join(__dirname, "_site");
const PUBLIC_DIR = path.join(__dirname, "_site_public");

// --- 1. HTML/CSS 内のリンク更新 ---
function updateLinks() {
  console.log("Running: update HTML/CSS links with pathPrefix...");

  const walk = (dir) => {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        walk(fullPath);
      } else if (file.endsWith(".html") || file.endsWith(".css")) {
        let content = fs.readFileSync(fullPath, "utf8");

        // ① href/src の /assets/ 先頭置換
        content = content.replace(/(href|src)=["']\/assets\//g, `$1="/assets/`);

        // ② <source srcset="..."> の /assets/ 置換
        content = content.replace(
          /(<source[^>]+srcset=["'])\/assets\//g,
          `$1/assets/`
        );

        // ③ CSS 内の background-image の url(/assets/...) 置換
        content = content.replace(/url\(["']?\/assets\//g, 'url("/assets/');

        fs.writeFileSync(fullPath, content, "utf8");
      }
    });
  };

  walk(SITE_DIR);
  console.log("HTML and CSS links updated successfully!");
}

// --- 2. _site → _site_public コピー ---
function copySite() {
  console.log(`Copying ${SITE_DIR} → ${PUBLIC_DIR}`);
  execSync(`rsync -a --delete ${SITE_DIR}/ ${PUBLIC_DIR}/`, {
    stdio: "inherit",
  });

  // 不要ファイル削除（例: README.md）
  const readmePath = path.join(PUBLIC_DIR, "README.md");
  if (fs.existsSync(readmePath)) fs.unlinkSync(readmePath);
}

// --- 3. Git デプロイ ---
function deployGit() {
  if (!fs.existsSync(path.join(PUBLIC_DIR, ".git"))) {
    console.log("_site_public is not a git repo, initializing...");
    execSync(`git -C ${PUBLIC_DIR} init`, { stdio: "inherit" });
  }

  // リモート設定
  execSync(`git -C ${PUBLIC_DIR} remote remove origin || true`, {
    stdio: "inherit",
  });
  execSync(
    `git -C ${PUBLIC_DIR} remote add origin git@github-ohmori:obw83/bw83.git`,
    { stdio: "inherit" }
  );

  console.log("'_site_public' resetting local changes...");
  execSync(`git -C ${PUBLIC_DIR} reset --hard`, { stdio: "inherit" });
  execSync(`git -C ${PUBLIC_DIR} clean -fd`, { stdio: "inherit" });

  // ブランチ確認
  let branchExists = true;
  try {
    execSync(`git -C ${PUBLIC_DIR} rev-parse --verify main`, {
      stdio: "ignore",
    });
  } catch {
    branchExists = false;
  }

  if (branchExists) {
    console.log("Pulling latest changes...");
    execSync(`git -C ${PUBLIC_DIR} pull origin main --rebase`, {
      stdio: "inherit",
    });
  } else {
    console.log("Branch main does not exist locally, skipping pull.");
  }

  console.log("Staging changes...");
  execSync(`git -C ${PUBLIC_DIR} add .`, { stdio: "inherit" });

  console.log("Committing changes...");
  try {
    execSync(`git -C ${PUBLIC_DIR} commit -m "Deploy site"`, {
      stdio: "inherit",
    });
  } catch {
    console.log("No changes to commit.");
  }

  console.log("Pushing to main...");
  if (branchExists) {
    execSync(`git -C ${PUBLIC_DIR} push origin main`, { stdio: "inherit" });
  } else {
    execSync(`git -C ${PUBLIC_DIR} push -u origin main`, { stdio: "inherit" });
  }
}

// --- メイン ---
function main() {
  try {
    updateLinks();
    copySite();
    deployGit();
    console.log("Deployment completed successfully!");
  } catch (err) {
    console.error("Deployment failed.");
    console.error(err.message);
    process.exit(1);
  }
}

main();
