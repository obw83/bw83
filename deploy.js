// deploy.js
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const siteDir = "_site";
const publicDir = "_site_public";
const pathPrefix = "/bw83";

// ----------------- HTML/CSS リンク書き換え -----------------
function updateHtmlLinks(filePath) {
  const html = fs.readFileSync(filePath, "utf-8");
  const $ = cheerio.load(html);

  $("a, img").each((i, el) => {
    const attr = el.name === "a" ? "href" : "src";
    const val = $(el).attr(attr);
    if (val && val.startsWith("/") && !val.startsWith(pathPrefix + "/")) {
      $(el).attr(attr, `${pathPrefix}${val}`);
    }
  });

  $("source").each((i, el) => {
    const srcset = $(el).attr("srcset");
    if (
      srcset &&
      srcset.startsWith("/") &&
      !srcset.startsWith(pathPrefix + "/")
    ) {
      $(el).attr("srcset", `${pathPrefix}${srcset}`);
    }
  });

  fs.writeFileSync(filePath, $.html(), "utf-8");
}

function updateCssUrls(filePath) {
  let css = fs.readFileSync(filePath, "utf-8");
  css = css.replace(
    /url\((["']?)(\/(?!bw83\/)[^"')]+)\1\)/g,
    (match, quote, url) => {
      return `url(${quote}${pathPrefix}${url}${quote})`;
    }
  );
  fs.writeFileSync(filePath, css, "utf-8");
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith(".html")) {
      updateHtmlLinks(fullPath);
    } else if (file.endsWith(".css")) {
      updateCssUrls(fullPath);
    }
  });
}

// ----------------- デプロイ -----------------
function deploy() {
  console.log("Running: update HTML/CSS links with pathPrefix...");
  walkDir(siteDir);
  console.log("HTML/CSS links updated!");

  if (!fs.existsSync(publicDir)) {
    console.log(`'${publicDir}' does not exist, cloning repository...`);
    execSync(
      `git clone -b main git@github-ohmori:obw83/bw83.git ${publicDir}`,
      { stdio: "inherit" }
    );
  } else {
    console.log(`'${publicDir}' already exists, pulling latest...`);
    execSync(`git -C ${publicDir} pull origin main`, { stdio: "inherit" });
  }

  console.log(`Copying ${siteDir} → ${publicDir}`);
  execSync(`rsync -av --delete ${siteDir}/ ${publicDir}/`, {
    stdio: "inherit",
  });

  console.log("Adding changes...");
  execSync(`git -C ${publicDir} add .`, { stdio: "inherit" });

  console.log("Committing changes...");
  try {
    execSync(`git -C ${publicDir} commit -m "Deploy site"`, {
      stdio: "inherit",
    });
  } catch (e) {
    console.log("Nothing to commit, working tree clean.");
  }

  console.log("Pushing to GitHub...");
  execSync(`git -C ${publicDir} push origin main`, { stdio: "inherit" });

  console.log("Deployment complete!");
}

// ----------------- 実行 -----------------
deploy();
