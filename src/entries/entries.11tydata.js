export default {
  layout: "layouts/release.njk",
  isRelease: true,
  eleventyComputed: {
    permalink: data => data.draft ? false : `/updates/${data.page.fileSlug}/`,
  },
};
