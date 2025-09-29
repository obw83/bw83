const { DateTime } = require("luxon");

// 環境変数で切り替え
const pathPrefix = process.env.ELEVENTY_ENV === "production" ? "/bw83/" : "";

module.exports = function (eleventyConfig) {
  // posts collection
  eleventyConfig.addCollection("posts", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/posts/*.md")
      .sort((a, b) => b.date - a.date);
  });

  // 日付フィルター
  eleventyConfig.addFilter("date", (dateObj, format = "yyyy-MM-dd") => {
    return DateTime.fromJSDate(dateObj).toFormat(format);
  });

  // assets をコピー（CSS / JS / 画像）
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  // URL 書き換え用フィルター（テンプレートで使用可）
  eleventyConfig.addFilter(
    "absUrl",
    (url) => `${pathPrefix}${url.replace(/^\.?\//, "")}`
  );

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "includes",
      layouts: "includes/layouts",
    },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    passthroughFileCopy: true,
    pathPrefix: pathPrefix,
  };
};
