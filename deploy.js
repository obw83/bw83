const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const SITE_DIR = path.join(__dirname, "_site");
const PUBLIC_REPO = "git@github.com:username/bw83.git"; // Public リポジトリ SSH URL
const BRANCH = "main"; // 公開ブランチ
const PATH_PREFIX = "/bw83"; // GitHub Pages 用

// ------------------------------
// 1. URL 書き換え関数
// ------------------------------
function getHtmlFiles(dir) {
  let results = [];
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(getHtmlFiles(filePath));
    } else if (file.endsWith(".html")) {
      results.push(filePath);
    }
  });
  return results;
}

function addUrlFilterToFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  // {{ ... | url }} の変換
  content = content.replace(
    /\{\{\s*['"](.+?)['"]\s*\|\s*url\s*\}\}/g,
    (_, url) => `${PATH_PREFIX}${url}`
  );

  // /assets/... の変換
  content = content.replace(
    /(\s(?:src|href|srcset)=["'])(\/assets\/.+?)["']/g,
    (_, prefix, url) => `${prefix}${PATH_PREFIX}${url.slice(1)}"`
  );

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`Updated: ${filePath}`);
}

function updateUrls() {
  const files = getHtmlFiles(SITE_DIR);
  files.forEach(addUrlFilterToFile);
  console.log("All HTML files updated with pathPrefix.");
}

// ------------------------------
// 2. Public リポジトリへ push
// ------------------------------
function deploy() {
  const publicDir = path.join(__dirname, "_site_public");

  // 既存ディレクトリがあれば削除
  if (fs.existsSync(publicDir)) {
    fs.rmSync(publicDir, { recursive: true, force: true });
  }

  // clone Public リポジトリ
  execSync(`git clone -b ${BRANCH} ${PUBLIC_REPO} ${publicDir}`, {
    stdio: "inherit",
  });

  // _site の中身をコピー
  execSync(`cp -r ${SITE_DIR}/* ${publicDir}/`, { stdio: "inherit" });

  // Public リポジトリ内で commit & push
  execSync(`cd ${publicDir} && git add .`, { stdio: "inherit" });
  execSync(
    `cd ${publicDir} && git commit -m "Deploy site" || echo "Nothing to commit"`,
    { stdio: "inherit" }
  );
  execSync(`cd ${publicDir} && git push origin ${BRANCH}`, {
    stdio: "inherit",
  });

  console.log("Deployment complete!");
}

// ------------------------------
// 3. 実行フロー
// ------------------------------
updateUrls();
deploy();
