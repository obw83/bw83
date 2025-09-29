#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const siteDir = path.resolve(__dirname, "_site");
const publicDir = path.resolve(__dirname, "_site_public");
const repoUrl = "git@github.com:obw83/bw83.git";
const branch = "main";

// --- 実行ヘルパー ---
function run(cmd, opts = {}) {
  console.log(`🚀 Running: ${cmd}`);
  try {
    return execSync(cmd, { stdio: "pipe", encoding: "utf8", ...opts });
  } catch (e) {
    console.error(`❌ Command failed: ${cmd}`);
    console.error(`❌ Error: ${e.message}`);
    process.exit(1);
  }
}

// --- 安全な文字列置換（正規表現を使わない） ---
function updateLinksWithStringReplace(dir) {
  console.log("🔄 Updating links with safe string replacement...");
  let totalFilesChanged = 0;

  // よくあるパターンをリストアップ
  const replacements = [
    // HTML属性（クォート付き）
    { from: 'href="/', to: 'href="/' },
    { from: "href='/", to: "href='/" },
    { from: 'src="/', to: 'src="/' },
    { from: "src='/", to: "src='/" },
    { from: 'action="/', to: 'action="/' },
    { from: "action='/", to: "action='/" },

    // CSS url()
    { from: "url(/", to: "url(/" },
    { from: 'url("/', to: 'url("/' },
    { from: "url('/", to: "url('/" },
    { from: "url( /", to: "url( /" },
    { from: 'url( "/', to: 'url( "/' },
    { from: "url( '/", to: "url( '/" },

    // JavaScript文字列
    { from: '"/', to: '"/' },
    { from: "'/", to: "'/" },
    { from: "`/", to: "`/" },
  ];

  // 重複を避けるためのチェック用パターン
  const skipPatterns = [
    "https://",
    "http://",
    "mailto:",
    "tel:",
    "data:",
    "//",
    'href="#',
    'src="#',
    'srcset="#',
  ];

  function shouldSkipReplacement(content, fromIndex, replacement) {
    const beforeContext = content.substring(
      Math.max(0, fromIndex - 20),
      fromIndex + replacement.from.length + 20
    );

    // 既にprefixがついているかチェック
    for (const pattern of skipPatterns) {
      if (beforeContext.includes(pattern)) {
        return true;
      }
    }
    return false;
  }

  function processFile(filePath) {
    let content = fs.readFileSync(filePath, "utf8");
    const originalContent = content;
    const ext = path.extname(filePath);

    // ファイルタイプに応じて使用する置換パターンを選択
    let applicableReplacements = [];

    if (ext === ".html") {
      applicableReplacements = replacements.filter(
        (r) =>
          r.from.includes("href=") ||
          r.from.includes("src=") ||
          r.from.includes("action=")
      );
    } else if (ext === ".css") {
      applicableReplacements = replacements.filter((r) =>
        r.from.includes("url(")
      );
    } else if (ext === ".js") {
      applicableReplacements = replacements.filter(
        (r) => r.from === '"/' || r.from === "'/" || r.from === "`/"
      );
    }

    // 安全な置換実行
    for (const replacement of applicableReplacements) {
      let searchIndex = 0;
      while (true) {
        const foundIndex = content.indexOf(replacement.from, searchIndex);
        if (foundIndex === -1) break;

        // コンテキストチェックでスキップ
        if (!shouldSkipReplacement(content, foundIndex, replacement)) {
          // 置換実行
          content =
            content.substring(0, foundIndex) +
            replacement.to +
            content.substring(foundIndex + replacement.from.length);

          searchIndex = foundIndex + replacement.to.length;
        } else {
          searchIndex = foundIndex + replacement.from.length;
        }
      }
    }

    // 変更があった場合のみファイル書き込み
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, "utf8");
      totalFilesChanged++;
      console.log(`✏️  Updated: ${path.relative(dir, filePath)}`);

      // デバッグ: 変更内容の一部を表示
      const diff = content.length - originalContent.length;
      console.log(`    Size change: ${diff > 0 ? "+" : ""}${diff} chars`);
    }
  }

  function walk(currentDir) {
    for (const item of fs.readdirSync(currentDir)) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith(".")) {
        walk(fullPath);
      } else if ([".html", ".css", ".js"].includes(path.extname(item))) {
        processFile(fullPath);
      }
    }
  }

  walk(dir);
  console.log(
    `✅ Safe string replacement complete! ${totalFilesChanged} files modified.`
  );
  return totalFilesChanged;
}

// --- 修正確認用の検証関数 ---
function validateChanges(dir) {
  console.log("🔍 Validating changes...");
  let issuesFound = 0;

  function checkFile(filePath) {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      // 問題のあるパターンをチェック
      if (
        line.includes('="=""') ||
        line.includes("=''''") ||
        line.includes('href=""')
      ) {
        console.log(
          `❌ Issue found in ${path.relative(dir, filePath)}:${index + 1}`
        );
        console.log(`    ${line.trim()}`);
        issuesFound++;
      }
    });
  }

  function walk(currentDir) {
    for (const item of fs.readdirSync(currentDir)) {
      const fullPath = path.join(currentDir, item);
      if (fs.statSync(fullPath).isDirectory() && !item.startsWith(".")) {
        walk(fullPath);
      } else if ([".html", ".css", ".js"].includes(path.extname(item))) {
        checkFile(fullPath);
      }
    }
  }

  walk(dir);

  if (issuesFound === 0) {
    console.log("✅ No issues found in generated files");
  } else {
    console.log(`⚠️  Found ${issuesFound} potential issues`);
  }

  return issuesFound;
}

// --- タイムスタンプファイル追加 ---
function addTimestamp(dir) {
  const timestampFile = path.join(dir, ".last-deploy");
  const timestamp = new Date().toISOString();
  fs.writeFileSync(
    timestampFile,
    `Last deployment: ${timestamp}\nBuild: ${Date.now()}`
  );
  console.log(`📅 Added timestamp: ${timestamp}`);
}

// --- メイン処理 ---
(async () => {
  console.log("🚀 === SAFE REPLACEMENT DEPLOY SCRIPT ===");

  if (!fs.existsSync(siteDir)) {
    console.error(`❌ Source directory '${siteDir}' not found`);
    console.error("Please run your build command first (e.g., npm run build)");
    process.exit(1);
  }

  // 1. 元のファイルをバックアップしながら一時処理
  const tempDir = path.resolve(__dirname, "_site_temp");
  if (fs.existsSync(tempDir)) {
    run(`rm -rf ${tempDir}`);
  }
  run(`cp -r ${siteDir} ${tempDir}`);

  // 2. 安全な文字列置換でリンク変換
  console.log("Starting safe link replacement...");
  const filesChanged = updateLinksWithStringReplace(tempDir);

  // 3. 変更内容の検証
  const issues = validateChanges(tempDir);
  if (issues > 0) {
    console.log("⚠️  Issues detected, but continuing with deployment...");
  }

  // 4. タイムスタンプ追加
  addTimestamp(tempDir);

  // 5. 公開ディレクトリにコピー
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  run(`rsync -a --delete --exclude='.git' ${tempDir}/ ${publicDir}/`);

  // 6. Git設定
  if (!fs.existsSync(path.join(publicDir, ".git"))) {
    console.log("🔧 Setting up git repository...");
    run(`git -C ${publicDir} init`);
    run(`git -C ${publicDir} branch -M ${branch}`);
    run(`git -C ${publicDir} remote add origin ${repoUrl}`);
  }

  // 7. コミットとプッシュ
  run(`git -C ${publicDir} add -A`);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const commitMsg = `Safe deploy - ${timestamp} (${filesChanged} files, ${issues} issues)`;

  try {
    run(`git -C ${publicDir} commit -m "${commitMsg}"`);
  } catch (e) {
    run(`git -C ${publicDir} commit --allow-empty -m "${commitMsg}"`);
  }

  console.log("🚀 Pushing to GitHub...");
  try {
    run(`git -C ${publicDir} push origin ${branch}`);
  } catch (e) {
    console.log("Using force push...");
    run(`git -C ${publicDir} push origin ${branch} --force`);
  }

  // 8. クリーンアップ
  run(`rm -rf ${tempDir}`);

  console.log("\n✅ === SAFE DEPLOYMENT COMPLETE ===");
  console.log(`🌍 Site URL: https://aizomeya-miocasalo.com/`);
  console.log(`📊 Files updated: ${filesChanged}`);
  console.log(`🔍 Issues found: ${issues}`);
  console.log(`⏰ Deployed at: ${timestamp}`);
})().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});
