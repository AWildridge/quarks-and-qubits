# Universal Wrapper (use for every milestone)

**SYSTEM / ORCHESTRATOR**

- You are a senior full-stack engineer. Follow the milestone prompt exactly. Never skip acceptance tests. Prefer Astro + MDX + Tailwind, TypeScript, and minimal JS by default. Use pnpm.
- When choices are needed, pick the simplest option that meets acceptance criteria.
- Produce a final summary containing: (1) file diffs or new files, (2) commands run, (3) how acceptance was verified, (4) next steps.

**TOOLS**

- Node ≥ 20, pnpm ≥ 8, git, GitHub Actions, Playwright, Lighthouse CI, axe, HTMLProofer (or similar), cspell.
- Optional: turborepo, rehype/remark plugins, KaTeX, Plausible.

---

## M0 — Repo, Tooling, and CI Scaffold

**USER / TASK**
Create repo `quarks-and-qubits` and scaffold an Astro+MDX site with TypeScript, Tailwind, and CI gates (build, link-check, axe, Lighthouse, Playwright smoke). Enforce formatting (Prettier), linting (ESLint), and commit hooks.

**CONSTRAINTS**

- Package manager: pnpm
- CI: GitHub Actions with required checks on PR + main
- No failing warnings in TypeScript build

**DELIVERABLES**

- `README.md` (local dev, content model, how to run checks)
- `.github/workflows/ci.yml` (build + lint + test + axe + lighthouse + links)
- `astro` app with MDX enabled; Tailwind configured
- `playwright` smoke test: open `/` and assert h1 exists
- `cspell.json`, `.editorconfig`, `.prettier*`, `.eslintrc.*`

**ACCEPTANCE TESTS**

- `pnpm build` passes with 0 TS errors
- CI: all jobs pass on PR; failing gates block merge
- Lighthouse (in CI): Home page performance ≥95

**COMMAND HINTS**

```bash
pnpm create astro@latest aj-wildridge-site -- --template basics --typescript --strict
cd aj-wildridge-site
pnpm add -D @types/node tailwindcss postcss autoprefixer @playwright/test lighthouse @axe-core/cli cspell html-validate
pnpm astro add tailwind mdx
```

---

## M1 — Global Layout, Navigation & Design System

**USER / TASK**
Implement responsive layout (header, footer, skip link), primary nav (Home, Research, Projects, Publications, CV, Contact), and core components (Button, Card, Tag, FigureWithCaption, Tabs).

**CONSTRAINTS**

- WCAG 2.2 AA, visible focus states, `prefers-reduced-motion`
- JS budget on Home ≤ 200KB gzipped

**DELIVERABLES**

- `/src/layouts/BaseLayout.astro`
- `/src/components/*` (Button.tsx, Card.tsx, Tag.tsx, FigureWithCaption.astro, Tabs.tsx)
- `src/styles/theme.css` with tokens (spacing, radii, typography scale)
- Navigation integration in `src/pages/index.astro`

**ACCEPTANCE TESTS**

- Keyboard-only nav reaches all links and controls, logical order
- Axe CI: 0 critical violations
- Lighthouse perf ≥95, a11y ≥100 on Home

---

## M2 — Content Types & Collections

**USER / TASK**
Create MDX content collections for Projects, Publications, Talks, Posts, and a Person/Bio record. Add schema validation and example content.

**CONSTRAINTS**

- Type-safe frontmatter schemas using Astro Content Collections
- Build-time validation; fail build on schema errors

**DELIVERABLES**

- `src/content/config.ts` (collections + zod schemas)
- Example MDX: `src/content/projects/example.mdx`, etc.
- Build script verifies content and emits type defs

**ACCEPTANCE TESTS**

- `pnpm build` fails on invalid frontmatter (prove with a bad commit, then fix)
- Pages for each collection render with example items
- Zero broken internal links (link-check CI)

---

## M3 — Projects: Index & Detail

**USER / TASK**
Ship a filterable Projects index (by topic/year/language) with search, and a Project detail template with “Reproduce” section (data/code links), badges, and architecture figure placeholder.

**CONSTRAINTS**

- Accessible filters (labels, roles, SR text)
- Pagination or progressive loading without CLS

**DELIVERABLES**

- `src/pages/projects/index.astro` (filter UI + grid)
- `src/pages/projects/[slug].astro` (detail)
- `src/lib/search.ts` (client-side minimal search; or server-side filtering)
- Copy-to-clipboard for repo URL; FigureWithCaption used

**ACCEPTANCE TESTS**

- Filters operable via keyboard and screen reader
- No layout shift when filters are toggled
- Playwright test: apply a filter and see results change

---

## M4 — Publications: Index (+ optional Detail)

**USER / TASK**
Build Publications list with filters (year/venue/tags), BibTeX export (selected or all), and structured data for ScholarlyArticle.

**CONSTRAINTS**

- BibTeX export must be valid; run a BibTeX linter in CI

**DELIVERABLES**

- `src/pages/publications/index.astro`
- `src/lib/bibtex.ts` (exporter)
- Optional `src/pages/publications/[slug].astro` with abstract, links (arXiv/DOI/PDF)

**ACCEPTANCE TESTS**

- Exported `.bib` validates in CI
- All external links pass link-checker
- Structured data passes rich results test (schema.org)

---

## M5 — CV & Contact / Media Kit

**USER / TASK**
Create a single data source (YAML/JSON) that renders an HTML CV and a downloadable PDF. Add Contact page with public email and a mini press kit.

**CONSTRAINTS**

- Avoid CAPTCHAs; obfuscate `mailto:` or use a simple serverless handler
- Same data drives both HTML and PDF

**DELIVERABLES**

- `src/data/cv.json` (or `.yaml`)
- `src/pages/cv.astro` + PDF generation script (e.g., `@sparticuz/chromium` in a node script or `puppeteer`)
- `src/pages/contact.astro` with obfuscated email and links
- `/public/press/*` (headshots, logos, bio.txt)

**ACCEPTANCE TESTS**

- `pnpm run cv:pdf` creates `/dist/AJ_Wildridge_CV.pdf`
- Press assets downloadable; links work on mobile
- Keyboard + SR can reach and activate all contact options

---

## M6 — Spin Correlation Explorer (MVP)

**USER / TASK**
Implement a React-island interactive demo: basis selector (helicity/beam/off-diag), production mode (gg/q\bar{q}), energy presets, θ/φ sliders. Views: C_ij heatmap + spin-axis vector plot. Export PNG/SVG and current params as JSON.

**CONSTRAINTS**

- Precomputed JSON grids for performance; computation in TS only for small ops
- Full keyboard operation + textual output of current C_ij
- 60 fps target on mid-range laptop at default grid size

**DELIVERABLES**

- `src/components/spin/Explorer.tsx` (+ Worker if needed)
- `public/data/spin-grids/*.json` (sample grids)
- `src/lib/export.ts` (SVG/PNG + JSON param export)
- `src/pages/demos/spin-explorer.astro`

**ACCEPTANCE TESTS**

- Playwright: change basis & sliders → canvas updates and JSON export downloaded
- Axe: 0 criticals; SR can read the currently focused slider value and the selected cell C_ij
- Manual perf check: 60 fps in default mode; fall back to lower resolution if needed

---

## M7 — Non-Functional Gates: Perf, A11y, SEO, Security

**USER / TASK**
Enforce performance budgets (LCP ≤ 2.5s, CLS ≤ 0.1, TBT ≤ 200ms; Home JS ≤ 200KB, demo pages ≤ 350KB), zero critical axe issues, complete metadata/structured data, strict CSP headers.

**CONSTRAINTS**

- Add CI thresholds that fail on regressions
- CSP must allow only required origins (self + analytics)

**DELIVERABLES**

- `lighthouserc.json` with thresholds
- `axe` CI step (0 critical)
- `security-headers.config` or adapter-level headers
- `robots.txt`, `sitemap.xml`, OpenGraph/Twitter tags, schema.org across entities

**ACCEPTANCE TESTS**

- CI fails if budgets are exceeded
- No mixed content or CSP violations in console during e2e run
- Rich results test passes

---

## M8 — Talks & Teaching, RSS, Theme

**USER / TASK**
Add Talks & Teaching index with filters and slide/video embeds; site-wide RSS/Atom for blog/notes; dark/light theme with system preference.

**CONSTRAINTS**

- Color contrast AA in both themes
- Respects `prefers-reduced-motion`

**DELIVERABLES**

- `src/pages/talks/index.astro`, `src/pages/teaching/index.astro`
- `src/pages/rss.xml.ts` (Astro feed)
- Theme toggle component; persisted with `localStorage` (no FOUC)

**ACCEPTANCE TESTS**

- RSS validates
- Embeds are keyboard accessible; work on mobile
- Contrast checks pass in both themes

---

## M9 — Extra Demos & Blog

**USER / TASK**
Add: (1) Quantum Minor-Embedding Visualizer (Pegasus P_16) with K_m×K_n inputs and JSON mapping export. (2) Model Card & Confusion Matrix viewer with sample data. (3) Blog/Notes with KaTeX and short “notes” type.

**CONSTRAINTS**

- Embedding tool interactions <100ms for moderate sizes
- Export mapping schema documented

**DELIVERABLES**

- `src/pages/demos/pegasus-embedder.astro` + `src/components/pegasus/*`
- `src/pages/demos/model-card.astro` + `src/components/model/*`
- Blog/Notes routes, KaTeX configured

**ACCEPTANCE TESTS**

- JSON mapping round-trips (import → visualize → export) unchanged
- Model card loads offline (bundled sample)
- Axe criticals = 0

---

# Optional: One-Click Backlog Prompts

### Content Governance Job (nightly)

Create a GitHub Action `content-audit.yml` that: (1) checks stale links, (2) validates frontmatter, (3) lints BibTeX, (4) fails on missing alt text. Post a summary comment on the PR or push a `CONTENT_AUDIT.md` artifact for main.

### Scholar/INSPIRE Cache Refresh

Add a CI workflow to pull updated metadata (if you have an API key or pre-saved JSON), diff changes, and open a PR with updated `src/data/pubs.json`.

---

# Final “Bundle into Issues” Prompt

**USER / TASK**
Generate GitHub issues for M0–M9, each with: title, description, checklist (tasks), acceptance criteria, labels (`milestone:Mx`, `type:feature`, `a11y`, `perf`, etc.), and estimated points. Output valid JSON for GitHub’s issue importer and a Markdown version for manual paste.

**DELIVERABLES**

- `/project/Issues-M0-M9.json`
- `/project/Issues-M0-M9.md`

**ACCEPTANCE TESTS**

- JSON validates with GitHub issue importer
- Each issue has at least one testable acceptance criterion tied to CI
