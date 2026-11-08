import { HtmlBasePlugin } from "@11ty/eleventy";
import { absoluteUrl, categories, normalizePathPrefix, releaseDate, siteOrigin } from "./lib/site.js";

export default function (eleventyConfig) {
  const pathPrefix = normalizePathPrefix(process.env.PATH_PREFIX || "/");
  const origin = siteOrigin(process.env.SITE_URL);

  // Prefix template AND Markdown links/assets, including release-body images.
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.setNunjucksEnvironmentOptions({ autoescape: true });
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addGlobalData("site", {
    name: "provn",
    title: "Release Notes",
    description: "New features, thoughtful improvements, and fixes. Follow what’s changing at provn.",
    origin,
    pathPrefix,
    year: new Date().getUTCFullYear(),
    categories,
  });

  eleventyConfig.addFilter("absoluteUrl", path => absoluteUrl(path, origin, pathPrefix));
  eleventyConfig.addFilter("dateISO", value => releaseDate(value).toISOString().slice(0, 10));
  eleventyConfig.addFilter("dateDisplay", value =>
    new Intl.DateTimeFormat("en-US", {
      year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
    }).format(releaseDate(value))
  );
  eleventyConfig.addFilter("dateRSS", value => releaseDate(value).toUTCString());
  eleventyConfig.addFilter("categoryLabel", category => categories[category]);

  eleventyConfig.addCollection("releases", collectionApi => {
    return collectionApi.getFilteredByGlob("./src/entries/**/*.md")
      .filter(entry => !entry.data.draft)
      .map(entry => {
        const { title, category, date } = entry.data;
        if (typeof title !== "string" || !title.trim()) {
          throw new Error(`${entry.inputPath}: a nonempty title is required.`);
        }
        if (!Object.hasOwn(categories, category)) {
          throw new Error(`${entry.inputPath}: category must be new, improved, or fixed.`);
        }
        try {
          releaseDate(date);
        } catch (error) {
          throw new Error(`${entry.inputPath}: ${error.message}`);
        }
        return entry;
      })
      .sort((a, b) =>
        releaseDate(b.data.date) - releaseDate(a.data.date) ||
        a.inputPath.localeCompare(b.inputPath)
      );
  });

  return {
    pathPrefix,
    dir: { input: "src", output: "_site", includes: "_includes" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["md", "njk"],
  };
}
