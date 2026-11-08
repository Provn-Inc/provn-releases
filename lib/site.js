export const categories = Object.freeze({
  new: "New",
  improved: "Improved",
  fixed: "Fixed",
});

export function normalizePathPrefix(value = "/") {
  const path = value.trim().replace(/^\/+|\/+$/g, "");
  if (!path) return "/";
  if (!/^[a-zA-Z0-9._~!$&'()+,;=@%/-]+$/.test(path) ||
      path.split("/").some(segment => segment === "." || segment === ".." || !segment)) {
    throw new Error("PATH_PREFIX must be a URL path, for example /provn-releases/.");
  }
  return `/${path}/`;
}

export function siteOrigin(value = "https://releases.provn.co") {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("SITE_URL must be an origin without a path, for example https://releases.provn.co.");
  }
  return url.origin;
}

export function absoluteUrl(path, origin, prefix) {
  return new URL(`${prefix}${String(path).replace(/^\/+/, "")}`, origin).href;
}

export function releaseDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (value === undefined || value === null || Number.isNaN(date.getTime())) {
    throw new Error("Each release needs a valid date in its front matter.");
  }
  return date;
}
