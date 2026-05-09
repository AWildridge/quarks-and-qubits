# Milestone Audit Tracker

Last audit: 2026-05-09

Use this document as the working checklist for milestone audit issues. When an item is fixed, move it from **Unresolved Issues** to **Resolved Issues** with the date, PR/commit if available, and the verification command that proved it.

## Status Summary

| Milestone                                      | Status          | Notes                                                                                                                                   |
| ---------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| M0 - Repo, Tooling, and CI Scaffold            | Complete        | CI, production deploy, rollback, and PR preview deployment workflows are present.                                                       |
| M1 - Global Layout, Navigation & Design System | Mostly complete | Layout, nav, components, theme, focus states, and axe coverage are present.                                                             |
| M2 - Content Types & Collections               | Complete        | Content collections validate at build time.                                                                                             |
| M3 - Projects: Index & Detail                  | Complete        | Filters, detail pages, reproduce sections, and Playwright coverage are present.                                                         |
| M4 - Publications: Index & Export              | Complete        | BibTeX export, detail pages, and Lighthouse accessibility coverage pass.                                                                |
| M5 - CV Page & Contact / Media Kit             | Complete        | JSON data, HTML CV, PDF generation, contact page, and press kit are present.                                                            |
| M6 - Spin Correlation Explorer                 | Complete        | React island, grid data, keyboard operation, exports, and Playwright coverage are present.                                              |
| M7 - Non-Functional Gates                      | Complete        | Build, Playwright, link check, Lighthouse, and security-header validation pass; deploy workflow validates live headers when configured. |
| M8 - Talks & Teaching, RSS, Theme              | Complete        | Talks/teaching/theme exist, and RSS post links resolve to generated post detail routes.                                                 |
| M9 - Extra Demos & Blog                        | Complete        | Model Card, Pegasus/minor-embedding visualizer, post details, and notes workflow are present with Playwright coverage.                  |

## Unresolved Issues

No unresolved milestone audit issues remain as of 2026-05-09. New regressions should be added here with the same status/severity/source/evidence format.

## Resolved Issues

### 2026-05-09: Publications Export Button Accessible Name

- Resolved from: issue 1, M7/M4 Lighthouse fails on publications export button
- Change: `#export-bibtex` now uses its visible button text as the accessible name, removing the `label-content-name-mismatch` failure.
- Evidence: Lighthouse completed against `/publications/` with only warning-level performance assertions; no accessibility assertion failures.
- Verified with:

```bash
LIGHTHOUSE_BASE_URL=http://127.0.0.1:4321 pnpm lighthouse
```

### 2026-05-09: RSS Post Links Resolve

- Resolved from: issue 2, M8 RSS emits post detail links without matching routes
- Change: Added generated post detail routes at `src/pages/posts/[slug].astro`; RSS links like `/posts/hello-world/` now resolve.
- Evidence: `pnpm build:check` generated `/posts/hello-world/index.html`; linkinator scanned 57 links successfully.
- Verified with:

```bash
pnpm build:check
npx linkinator http://127.0.0.1:4321 --recurse --timeout 30000 --skip "https://aj-wildridge.web.cern.ch.*"
```

### 2026-05-09: Pegasus Minor-Embedding Visualizer

- Resolved from: issue 3, M9 Pegasus / minor-embedding visualizer missing
- Change: Added `/demos/pegasus-embedder/` with controls, SVG overlay, chain-length histogram, JSON export schema, and Playwright coverage.
- Evidence: `pnpm build:check` generated `/demos/pegasus-embedder/index.html`; Playwright verified mapping JSON export.
- Verified with:

```bash
pnpm build:check
pnpm exec playwright test
```

### 2026-05-09: Blog Detail And Notes Workflow

- Resolved from: issue 4, M9 blog detail / notes workflow missing
- Change: Added post detail pages backed by the `posts` collection, including `kind: note` content rendered at stable detail URLs.
- Evidence: Playwright verified `/posts/hello-world/` renders the note body; RSS link check passed.
- Verified with:

```bash
pnpm build:check
pnpm exec playwright test
```

### 2026-05-09: PR Preview Deployment Workflow

- Resolved from: issue 5, M0 PR preview deployment not confirmed
- Change: Added `.github/workflows/preview.yml` to build, validate, deploy per-PR preview output, and upload preview artifacts.
- Evidence: Workflow triggers on `pull_request` and deploys to `previews/pr-$PR_NUMBER`.
- Verified with:

```bash
rg -n "pull_request|preview|deploy" .github/workflows
```

### 2026-05-09: Live Security Header Deployment Check

- Resolved from: issue 6, M7 live security headers not verified in local preview
- Change: `scripts/validate-security-headers.js` accepts a deployed URL, and `.github/workflows/deploy.yml` runs it against `CERN_WEB_URL` after production deploy when configured.
- Evidence: Local `_headers` validation passed; local Astro preview still omits production host headers by design.
- Verified with:

```bash
node scripts/validate-security-headers.js
curl -I http://127.0.0.1:4321/
```

## Verification Log

### 2026-05-09 Follow-Up Verification

Passed:

```bash
pnpm build:check
pnpm exec playwright test
node scripts/validate-security-headers.js
LIGHTHOUSE_BASE_URL=http://127.0.0.1:4321 pnpm lighthouse
npx linkinator http://127.0.0.1:4321 --recurse --timeout 30000 --skip "https://aj-wildridge.web.cern.ch.*"
rg -n "pull_request|preview|deploy" .github/workflows
```

Notes:

- Playwright passed 22 tests, including post detail rendering and Pegasus JSON export.
- Linkinator scanned 57 links successfully.
- Lighthouse exited successfully across 9 URLs and 27 runs. It still reports warning-level performance assertions for render-blocking and unused CSS, but no blocking accessibility failures remain.
- `curl -I http://127.0.0.1:4321/` confirms Astro preview does not emit production host security headers locally; live response validation is handled by the deploy workflow via `CERN_WEB_URL`.

### 2026-05-09 Audit Baseline

Passed:

```bash
pnpm build:check
pnpm exec playwright test
pnpm format:check
pnpm lint
pnpm cspell
pnpm html:validate
node scripts/validate-bibtex.js
node scripts/validate-sitemap.js
node scripts/validate-security-headers.js
node scripts/run-axe-scan.js
npx linkinator http://127.0.0.1:4321 --recurse --timeout 30000 --skip "https://aj-wildridge.web.cern.ch.*"
```

Failed:

```bash
LIGHTHOUSE_BASE_URL=http://127.0.0.1:4321 pnpm lighthouse
```

Failure summary:

- `label-content-name-mismatch` on `/publications/` for `#export-bibtex`.
- Lighthouse warning-level assertions also reported render-blocking and unused CSS warnings across scanned pages, but the blocking error was the publications accessible-name mismatch.

Category score note:

- Lighthouse category scores for scanned pages were high: performance was 0.99-1.00 and accessibility was 1.00 in the generated reports, but LHCI still exits non-zero because individual assertions fail.
