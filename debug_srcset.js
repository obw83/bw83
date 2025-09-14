#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const siteDir = path.resolve(__dirname, "_site");

console.log("🔍 === SRCSET DEBUG SCRIPT ===");
console.log(`Searching in: ${siteDir}`);

function findSrcsetFiles(dir) {
  let foundFiles = [];

  function walk(currentDir) {
    try {
      for (const item of fs.readdirSync(currentDir)) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith(".")) {
          walk(fullPath);
        } else if (path.extname(item) === ".html") {
          const content = fs.readFileSync(fullPath, "utf8");

          // srcsetを含む行を検索
          const lines = content.split("\n");
          lines.forEach((line, index) => {
            if (line.includes("srcset=")) {
              foundFiles.push({
                file: path.relative(siteDir, fullPath),
                line: index + 1,
                content: line.trim(),
              });
            }
          });
        }
      }
    } catch (e) {
      console.log(`⚠️  Error reading directory ${currentDir}: ${e.message}`);
    }
  }

  walk(dir);
  return foundFiles;
}

if (!fs.existsSync(siteDir)) {
  console.error(`❌ Directory ${siteDir} does not exist!`);
  console.error("Please run your build command first (e.g., npm run build)");
  process.exit(1);
}

const srcsetFiles = findSrcsetFiles(siteDir);

console.log(`\n📊 Found ${srcsetFiles.length} lines with srcset:`);
console.log("=".repeat(60));

srcsetFiles.forEach((item, index) => {
  console.log(`${index + 1}. File: ${item.file}`);
  console.log(`   Line: ${item.line}`);
  console.log(`   Content: ${item.content}`);

  // 変換されるべきかどうかをチェック
  if (
    item.content.includes('srcset="/') &&
    !item.content.includes('srcset="/bw83/')
  ) {
    console.log(`   ❌ NEEDS CONVERSION`);
  } else if (item.content.includes('srcset="/bw83/')) {
    console.log(`   ✅ Already converted`);
  } else {
    console.log(`   ℹ️  External or relative URL`);
  }

  console.log();
});

// 具体的な置換テスト
console.log("🧪 === REPLACEMENT TEST ===");
const testCases = [
  '<source srcset="/assets/images/head-pc-1.png" media="(min-width: 768px)">',
  'srcset="/assets/images/test.jpg"',
  '<img srcset="/path/to/image.png" />',
];

const replacements = [
  { from: '<source srcset="/', to: '<source srcset="/bw83/' },
  { from: 'srcset="/', to: 'srcset="/bw83/' },
];

testCases.forEach((test, i) => {
  console.log(`Test ${i + 1}: ${test}`);

  let result = test;
  replacements.forEach((replacement, j) => {
    const before = result;
    result = result.replace(replacement.from, replacement.to);
    if (before !== result) {
      console.log(
        `  ✅ Applied replacement ${j + 1}: ${replacement.from} → ${
          replacement.to
        }`
      );
    }
  });

  console.log(`  Result: ${result}`);
  console.log();
});

console.log("🎯 === RECOMMENDATIONS ===");
if (srcsetFiles.length === 0) {
  console.log("❌ No srcset attributes found! Check if:");
  console.log("  1. Build was completed successfully");
  console.log("  2. HTML files exist in _site directory");
  console.log("  3. srcset is written differently (e.g., single quotes)");
} else {
  const needsConversion = srcsetFiles.filter(
    (item) =>
      item.content.includes('srcset="/') &&
      !item.content.includes('srcset="/bw83/')
  );

  if (needsConversion.length > 0) {
    console.log(
      `⚠️  Found ${needsConversion.length} srcset attributes that need conversion`
    );
    console.log(
      "Try running the deploy script and check if these are being processed"
    );
  } else {
    console.log("✅ All srcset attributes appear to be converted already");
  }
}
