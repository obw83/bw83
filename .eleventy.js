const { DateTime } = require("luxon");

const pathPrefix = "/bw83/"; // GitHub Pages の場合

module.exports = function (eleventyConfig) {
  // posts collection
  eleventyConfig.addCollection("posts", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/posts/*.md")
      .sort((a, b) => b.date - a.date);
  });

  // date フィルター追加
  eleventyConfig.addFilter("date", (dateObj, format = "yyyy-MM-dd") => {
    return DateTime.fromJSDate(dateObj).toFormat(format);
  });

  // assets をコピー（CSS/JS/画像）
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  // URL 書き換え用フィルター（テンプレートで使用可）
  eleventyConfig.addFilter("absUrl", (url) => `${pathPrefix}${url}`);

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
