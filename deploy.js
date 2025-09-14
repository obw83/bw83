#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const SITE_DIR = path.join(__dirname, "_site");
const PUBLIC_REPO = "https://github.com/obw83/bw83.git"; // PublicリポジトリURL
const COMMIT_MSG = "Deploy Eleventy site";

// ---- 1. Eleventy ビルド ----
console.log("Building Eleventy site...");
execSync("npx eleventy", { stdio: "inherit" });

// ---- 2. _site 内HTMLをURLフィルターに書き換え ----
function getHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
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

  // link タグ
  content = content.replace(
    /<link\s+rel=["']stylesheet["']\s+href=["'](\/[^"']+)["']>/g,
    (_, href) => `<link rel="stylesheet" href="{{ '${href}' | url }}">`
  );

  // script タグ
  content = content.replace(
    /<script\s+src=["'](\/[^"']+)["'](\s+defer)?>/g,
    (_, src, defer) => `<script src="{{ '${src}' | url }}"${defer || ""}>`
  );

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`Updated: ${filePath}`);
}

console.log("Applying URL filter to HTML files...");
const htmlFiles = getHtmlFiles(SITE_DIR);
htmlFiles.forEach(addUrlFilterToFile);

// ---- 3. _site を Public リポジトリにPush ----
console.log("Pushing to Public repository...");

try {
  execSync("git init", { cwd: SITE_DIR, stdio: "inherit" });
  execSync(`git remote remove origin || true`, {
    cwd: SITE_DIR,
    stdio: "inherit",
  });
  execSync(`git remote add origin ${PUBLIC_REPO}`, {
    cwd: SITE_DIR,
    stdio: "inherit",
  });
  execSync("git add .", { cwd: SITE_DIR, stdio: "inherit" });
  execSync(`git commit -m "${COMMIT_MSG}"`, {
    cwd: SITE_DIR,
    stdio: "inherit",
  });
  execSync("git push -u origin main --force", {
    cwd: SITE_DIR,
    stdio: "inherit",
  });
  console.log("✅ Deployment complete!");
} catch (e) {
  console.error("❌ Deployment failed:", e.message);
  process.exit(1);
}
