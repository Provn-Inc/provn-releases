import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";
import { absoluteUrl, normalizePathPrefix, releaseDate, siteOrigin } from "../lib/site.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const run = promisify(execFile);

async function build(t, { entries = {}, prefix = "/", origin = "https://releases.provn.co" } = {}) {
  const fixture = await mkdtemp(path.join(tmpdir(), "provn-releases-test-"));
  t.after(() => rm(fixture, { recursive: true, force: true }));
  await cp(path.join(root, "src"), path.join(fixture, "src"), {
    recursive: true,
    // Keep real release notes out of isolated test fixtures.
    filter: source => !(source.startsWith(path.join(root, "src", "entries") + path.sep) && source.endsWith(".md")),
  });
  await writeFile(path.join(fixture, "package.json"), '{"type":"module"}');
  for (const [filename, content] of Object.entries(entries)) {
    const file = path.join(fixture, "src", "entries", filename);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, content);
  }
  await run(process.execPath, [
    path.join(root, "node_modules", "@11ty", "eleventy", "cmd.cjs"),
    "--config", path.join(root, "eleventy.config.js"),
  ], {
    cwd: fixture,
    env: { ...process.env, PATH_PREFIX: prefix, SITE_URL: origin, TZ: "America/Los_Angeles" },
  });
  return {
    read: relative => readFile(path.join(fixture, "_site", relative), "utf8"),
  };
}

function release({ title, date, category = "new", draft = false, description = "A test-only release." }, body = "Test content.") {
  return `---\ntitle: '${title}'\n${date ? `date: ${date}\n` : ""}category: ${category}\ndescription: '${description}'\ndraft: ${draft}\n---\n${body}\n`;
}

test("normalizes root and project prefixes, rejecting URLs and path traversal", () => {
  assert.equal(normalizePathPrefix(), "/");
  assert.equal(normalizePathPrefix("provn-releases"), "/provn-releases/");
  assert.equal(normalizePathPrefix("/provn-releases/"), "/provn-releases/");
  assert.throws(() => normalizePathPrefix("https://example.com"));
  assert.throws(() => normalizePathPrefix("/../secret"));
  assert.throws(() => normalizePathPrefix("/one//two"));
});

test("constructs canonical origins and absolute URLs", () => {
  assert.equal(siteOrigin("https://example.com/"), "https://example.com");
  assert.throws(() => siteOrigin("https://example.com/project/"));
  assert.equal(absoluteUrl("/updates/first/", "https://example.com", "/project/"), "https://example.com/project/updates/first/");
  assert.throws(() => releaseDate(undefined));
  assert.throws(() => releaseDate("not-a-date"));
});

test("empty site has an honest empty state and valid empty RSS feed", async t => {
  const site = await build(t);
  const html = await site.read("index.html");
  assert.match(html, /0 updates/);
  assert.match(html, /Good things are on the way/);
  assert.doesNotMatch(html, /class="release-item"/);
  assert.match(html, /href="#main-content"/);
  assert.match(html, /href="https:\/\/releases.provn.co\/"/);
  assert.match(await site.read("404.html"), /Page not found/);
  const rss = await site.read("feed.xml");
  assert.match(rss, /^<\?xml version="1.0"/);
  assert.match(rss, /<channel>/);
  assert.doesNotMatch(rss, /<item>/);
});

test("published Markdown entries have newest-first listing, individual pages, RSS and escaped metadata", async t => {
  const site = await build(t, {
    entries: {
      "old-test.md": release({ title: "Older test update", date: "2026-01-01", category: "fixed" }),
      "new-test.md": release({ title: "New & improved test update", date: "2026-02-01", category: "improved", description: 'Test "quoted" & safe metadata.' }, "## Test heading\n\nA **test-only** body.\n\n[Home](/)\n\n![Test](/assets/favicon.svg)"),
      "draft-test.md": release({ title: "Unpublished test update", date: "2026-03-01", draft: true }),
    },
  });
  const html = await site.read("index.html");
  assert.match(html, /2 updates/);
  assert(html.indexOf("New &amp; improved test update") < html.indexOf("Older test update"));
  assert.match(html, /February 1, 2026/);
  assert.match(html, /<h2>Test heading<\/h2>/);
  assert.match(html, /<strong>test-only<\/strong>/);
  assert.doesNotMatch(html, /Unpublished test update/);
  const page = await site.read("updates/new-test/index.html");
  assert.match(page, /<h2>Test heading<\/h2>/);
  assert.match(page, /<strong>test-only<\/strong>/);
  assert.match(page, /Test &quot;quoted&quot; &amp; safe metadata/);
  assert.match(page, /datetime="2026-02-01"/);
  assert.match(page, /property="og:type" content="article"/);
  await assert.rejects(site.read("updates/draft-test/index.html"), { code: "ENOENT" });
  const rss = await site.read("feed.xml");
  assert.equal((rss.match(/<item>/g) || []).length, 2);
  assert.match(rss, /New &amp; improved test update/);
  assert.doesNotMatch(rss, /Unpublished/);
});

test("project Pages prefixes all navigation, assets, canonical URLs and Markdown links", async t => {
  const site = await build(t, {
    prefix: "/provn-releases/",
    origin: "https://provn-inc.github.io",
    entries: {
      "prefix-test.md": release({ title: "Prefix test", date: "2026-01-01" }, "[Home](/)\n\n![Test](/assets/favicon.svg)"),
    },
  });
  const html = await site.read("index.html");
  assert.match(html, /href="\/provn-releases\/assets\/style.css"/);
  assert.match(html, /src="\/provn-releases\/assets\/provn-logo.png"/);
  assert.match(html, /<a href="\/provn-releases\/">Home<\/a>/);
  assert.match(html, /src="\/provn-releases\/assets\/favicon.svg"/);
  assert.match(html, /href="\/provn-releases\/feed.xml"/);
  assert.match(html, /href="https:\/\/provn-inc.github.io\/provn-releases\/"/);
  assert.match(html, /href="https:\/\/provn.co"/);
  const page = await site.read("updates/prefix-test/index.html");
  assert.match(page, /<a href="\/provn-releases\/">Home<\/a>/);
  assert.match(page, /src="\/provn-releases\/assets\/favicon.svg"/);
  assert.match(await site.read("404.html"), /href="\/provn-releases\/assets\/style.css"/);
  assert.match(await site.read("feed.xml"), /https:\/\/provn-inc.github.io\/provn-releases\/updates\/prefix-test\//);
  assert.doesNotMatch(html, /provn-releases\/provn-releases/);
});

test("missing title, missing date, and unknown categories fail the build with useful errors", async t => {
  for (const [values, message] of [
    [{ title: "", date: "2026-01-01" }, /nonempty title is required/],
    [{ title: "Missing date" }, /valid date/],
    [{ title: "Unknown category", date: "2026-01-01", category: "unknown" }, /category must be/],
  ]) {
    await assert.rejects(build(t, {
      entries: { "invalid-test.md": release(values) },
    }), error => {
      assert.match(`${error.stdout}\n${error.stderr}`, message);
      return true;
    });
  }
});
