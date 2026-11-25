# Release notes guidance

## Choose what belongs

- Treat merged changes in `Provn-Inc/provn-monorepo` as the source of truth. Review the PR description and changed areas before writing a note; do not announce work that is only proposed, previewed, or otherwise unreleased.
- Include changes that matter to candidates, employers, or visitors to the public site. Exclude internal Provn HQ administration, moderation/review tooling, analytics, developer workflows, and infrastructure-only changes.
- Distinguish customer organization features from HQ-only features. Organization-facing applicant review, notes, and job administration can be public release notes; HQ-only controls and workflows cannot.
- Group closely related customer-facing changes when that makes the update clearer. Use the date the change became available, not an assumed date; use the merged date only when it reliably reflects release.

## Write for people, not implementers

- Lead with the benefit or task users can now accomplish. Use short, familiar language and explain product terms when needed.
- Avoid internal project names, PR numbers, code paths, implementation details, and technical edge cases. Rephrase those as user-visible outcomes or omit them when they do not matter to customers.
- Do not publish confidential operational details, personal data, secrets, vulnerability specifics, or instructions that could aid abuse.
- Security and privacy improvements that users need to know about—such as signing out of other devices or controlling public profile content—may be described as features. Do not expose the underlying security design or imply a security guarantee.
- Be precise with privacy language. Say “personal” or “organization-level” when that is what is verified; do not promise that information is private, confidential, or visible only to particular people unless the product’s current access rules support that exact claim.
- For candidate notes, attachments, exports, and other sensitive data features, verify the audience and access behavior before describing who can see or use them. Announce the customer capability without exposing internal HQ handling.
- Avoid naming browser privacy tools, extensions, or other implementation-specific edge cases. Describe the visible result instead (for example, “Applicant labels display more consistently.”).
- Keep descriptions and bullets accurate, concise, and free of unsupported claims. A release note is not a privacy policy, security advisory, or complete feature specification.

## Publish and verify

- Add one dated Markdown file under `src/entries/`, using the existing front matter fields and an appropriate `new`, `improved`, or `fixed` category. Do not rename published entries; filenames define their URLs.
- Review the complete public-facing copy for privacy, security, internal-only information, and human readability before publishing.
- Run `npm test` and `npm run build`. Push approved updates to `main`; GitHub Actions builds and deploys the site. Verify the deployed page and any changed asset paths after deployment.
