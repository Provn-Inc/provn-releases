# provn release notes

A static [Eleventy](https://www.11ty.dev/) site for product updates, intended for `releases.provn.co`.

## Develop

Use Node 22, then run `npm ci` and `npm run dev`. Run `npm test` and `npm run build` to verify changes; the generated site is in `_site/`.

## Publish an update

Add a Markdown file to `src/entries/`:

```md
---
title: A clearer applicant view
date: 2026-11-07
category: improved
description: A short summary of what changed.
---

- Describe the change and why it matters.
```

Categories are `new`, `improved`, and `fixed`. Add `draft: true` to hide an unfinished entry. Entries appear newest first; their filenames determine their permanent URLs, so avoid renaming published files. Store images in `src/assets/` and reference them as `/assets/filename.png`. Review updates for confidential or internal details before publishing.

## Deploy

The GitHub Actions workflow builds pull requests and deploys `main` to GitHub Pages. In repository **Settings → Pages**, select **GitHub Actions**, then configure the `releases.provn.co` custom domain and its DNS record. Enable HTTPS when available. The workflow derives the origin and base path from Pages; for local builds, override them with `SITE_URL` and `PATH_PREFIX` if needed.
