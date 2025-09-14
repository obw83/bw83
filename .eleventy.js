const { DateTime } = require("luxon");

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

  // 静的ファイルをコピー
  eleventyConfig.addPassthroughCopy({
    "node_modules/normalize.css/normalize.css": "assets/css/normalize.css",
  });
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

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
    pathPrefix: "/bw83/", // ← ここ重要
  };
};
