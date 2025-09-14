// deploy.js
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// ====== 設定 ======
const SITE_DIR = "_site"; // ビルド済みサイト
const PUBLIC_DIR = "_site_public"; // 公開用リポジトリ
const REMOTE = "github-ohmori"; // SSH config の Host 名
const BRANCH = "main";
const PATH_PREFIX = "/"; // 必要なら pathPrefix をここで設定

// ====== HTML/CSS リンク更新 ======
function updateLinks() {
  console.log("Running: update HTML/CSS links with pathPrefix...");
  const walkDir = (dir) => {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (
        entry.isFile() &&
        (fullPath.endsWith(".html") || fullPath.endsWith(".css"))
      ) {
        let content = fs.readFileSync(fullPath, "utf-8");
        // 簡易的に /assets/ を pathPrefix に置換
        content = content.replace(
          /(href|src)=["']\/assets\//g,
          `$1="${PATH_PREFIX}assets/`
        );
        fs.writeFileSync(fullPath, content, "utf-8");
      }
    });
  };
  walkDir(SITE_DIR);
  console.log("HTML and CSS links updated successfully!");
}

// ====== ディレクトリコピー ======
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src, { withFileTypes: true }).forEach((entry) => {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// ====== Git 操作 ======
function git(cmd, options = "") {
  return execSync(`git -C ${PUBLIC_DIR} ${cmd} ${options}`, {
    stdio: "inherit",
  });
}

// ====== メイン処理 ======
function deploy() {
  updateLinks();

  // _site_public がなければ clone する
  if (!fs.existsSync(PUBLIC_DIR)) {
    console.log(`'_site_public' not found, cloning repository...`);
    execSync(`git clone -b ${BRANCH} ${REMOTE}:obw83/bw83.git ${PUBLIC_DIR}`, {
      stdio: "inherit",
    });
  } else {
    console.log(`'_site_public' already exists, resetting local changes...`);
    git("reset --hard");
    git(`pull ${REMOTE} ${BRANCH}`);
  }

  // _site → _site_public コピー
  console.log(`Copying ${SITE_DIR} → ${PUBLIC_DIR}`);
  copyDir(SITE_DIR, PUBLIC_DIR);

  // Git add/commit/push
  try {
    console.log("Staging changes...");
    // -f で .gitignore に無視されているファイルも追加
    git("add . -f");
    try {
      git(`commit -m "Deploy site"`);
    } catch {
      console.log("No changes to commit.");
    }
    console.log("Pushing to remote...");
    git(`push ${REMOTE} ${BRANCH}`);
    console.log("Deployment completed successfully!");
  } catch (err) {
    console.error("Deployment failed.", err);
  }
}

// ====== 実行 ======
deploy();
