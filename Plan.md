# Software Development Plan — AJ Personal Research Website (v1.0)

> Scope: Implement a fast, accessible academic portfolio site with one flagship interactive demo at launch, then iterate to add teaching/talks, RSS, and additional demos. Content-first architecture with islanded interactivity.

---

## 0) Document Control

* **Owner:** AJ Wildridge
* **Repo:** `aj-wildridge-site` (public)
* **Methodology:** Milestone-based delivery with CI gates
* **Environments:** Local dev → Preview/PR builds → Production (CERN web area)
* **Definition of Done (project):** See §8

---

## 1) Architecture & Tech Stack

* **Primary stack:** **Astro + MDX + Tailwind** (content-first; near‑zero JS by default).
* **Islands:** React components for interactive elements (e.g., Spin Correlation Explorer).
* **Optional sub‑app (Phase 3+):** Next.js at `/apps/*` for heavier multi-view tools.
* **Tooling:** TypeScript, ESLint/Prettier, Playwright (a11y + smoke), GitHub Actions CI, KaTeX for math, Remark/Rehype for MDX, pnpm + Turborepo (if monorepo with sub‑app).
* **Data model:** MDX Content Collections for Projects, Publications, Talks, Posts; small JSON caches under `/data` for repo stats and scholar/inspire metadata.
* **Hosting/Deploy:** Build static artifacts; deploy via GitHub Actions to CERN web area (AFS/EOS). Immutable caching for hashed assets; short TTL for HTML. Uptime monitor + Plausible analytics.
* **Security/Privacy:** Strict CSP, no third‑party trackers beyond Plausible/Umami; GDPR‑friendly (no cookies or essential only).

---

## 2) Release Plan (Phased)

* **Release 1 (MUST):** Home, Research hubs, Projects (index/detail), Publications, CV, Contact; Spin Correlation Explorer (MVP). Baseline SEO/a11y/performance and CI gates.
* **Release 2 (SHOULD):** Talks & Teaching, RSS, dark/light mode, structured data across types, content audit automations.
* **Release 3 (COULD):** Quantum Minor‑Embedding Visualizer; ML Model Card Viewer; Blog/Notes with KaTeX and project metrics auto-refresh.

---

## 3) Milestones with Acceptance Criteria

### M0 — Repo, Tooling, and CI Scaffold

**Goal:** Stand up repository, lint/test/preview pipelines, and shared design tokens.

**Key Tasks**

* Initialize Astro site with MDX content collections and Tailwind.
* Configure TypeScript, ESLint/Prettier, and Playwright (smoke + a11y checks).
* Add GitHub Actions: build, unit/smoke, link check, Lighthouse, axe, dead‑image check.
* Configure CSP headers and security headers in deploy step.

**Acceptance Criteria**

* CI pipeline runs on PRs and `main`, failing on link/a11y/Lighthouse regressions.
* Preview environment auto‑deployed per PR; production job is manual, gated by green CI.
* Repo includes `README` (local dev, content model, contribution guide).

---

### M1 — Global Layout, Navigation & Design System

**Goal:** Implement responsive layout, header/footer, routing, and accessible components.

**Key Tasks**

* Top‑level nav: Home, Research, Projects, Publications, CV, Contact.
* Footer with copyright year, ORCID/Scholar/GitHub/LinkedIn, RSS link.
* Design tokens (color scale, typography), base components (buttons, cards, tag chips, accordions, tabs, filter pills), figure with caption, code blocks with copy.

**Acceptance Criteria**

* **Smoke:** All routes load on mobile/desktop; keyboard‑only navigation reaches all interactive controls; focus order is logical.
* **A11y:** WCAG 2.2 AA; visible focus; skip‑to‑content; semantic landmarks; prefers‑reduced‑motion honored.
* **Perf:** Home page Lighthouse ≥95; JS budget on Home ≤200KB (post‑gzip).

---

### M2 — Content Types & Collections

**Goal:** Authoring pipeline for Projects, Publications, Talks, Posts, and Bio/Person.

**Key Tasks**

* Implement type‑safe MDX collections with front‑matter schemas for each content type.
* Seed examples for each type.
* Build a `/data` cache scaffold (e.g., `projects.json`, `pubs.json`).

**Acceptance Criteria**

* Content collections validate at build time; example pages render.
* Site build passes with zero type errors and zero broken links.

---

### M3 — Projects: Index & Detail

**Goal:** Filterable project gallery and rich project detail pages.

**Key Tasks**

* Card grid with filters (topic/year/language) + search.
* Detail pages with abstract, architecture diagram, metrics/badges, demo and repo links, citations, and “Reproduce” section.

**Acceptance Criteria**

* Filters are keyboard accessible and operable by screen readers.
* Detail pages include a clearly labeled “Reproduce” section linking data/code.
* Progressive loading or pagination implemented without CLS.

---

### M4 — Publications: Index (and Optional Detail)

**Goal:** Publications listing with filters and export.

**Key Tasks**

* Index with year/venue/title/tags; quick filters.
* BibTeX export for selection/all; verify .bib validity.
* Optional detail view (abstract, PDF/arXiv/DOI/slides, figures, media coverage).

**Acceptance Criteria**

* BibTeX export produces a valid .bib file; all links pass link‑check CI.
* Structured data validates for Person/SoftwareSourceCode/ScholarlyArticle.

---

### M5 — CV Page & Contact / Media Kit

**Goal:** Single source of truth for CV that generates HTML+PDF; accessible contact options.

**Key Tasks**

* Implement JSON/YAML source that renders on‑site CV and a downloadable PDF.
* Contact page with public email, social links, and press kit (headshots, short bio, logos). No CAPTCHAs; use obfuscated mailto or rate‑limited form handler.

**Acceptance Criteria**

* The same data renders both HTML and PDF outputs.
* Contact options function on mobile; press assets downloadable.

---

### M6 — Spin Correlation Explorer (MVP)

**Goal:** Ship the flagship interactive demo as a React island.

**Key Tasks**

* UI: basis selector (helicity/beam/off‑diag), production mode (gg/q\bar{q}), energy preset, θ/φ sliders. Views: C_ij heatmap, spin‑axis vector plot. Export PNG/SVG and current params as JSON.
* Data path: precomputed JSON grids; in‑browser TS math for basic operations. (Optional beta: Qiskit Live Mode via Pyodide; off by default; Web Worker; robust fallback.)
* A11y: full keyboard operation; textual output of current C_ij.

**Acceptance Criteria**

* 60 fps rendering on a mid‑range laptop under default grid size.
* All controls operable by keyboard; screen reader announces current values.
* Exported SVG/PNG are crisp (no raster blurring) and JSON includes all parameters.

---

### M7 — Non‑Functional Gates: Perf, A11y, SEO, Security

**Goal:** Meet performance, accessibility, metadata, and security targets.

**Key Tasks**

* Perf budgets: LCP ≤2.5s; CLS ≤0.1; TBT ≤200ms; JS ≤350KB on demo pages (code‑split).
* A11y audits: axe violations = 0 critical; color contrast AA; reduced‑motion checked.
* SEO/metadata: titles/descriptions per page; Open Graph/Twitter; sitemap.xml; robots.txt; schema.org for Person/Software/Dataset/ScholarlyArticle.
* Security/Privacy: strict CSP; headers set; analytics script allow‑listed.

**Acceptance Criteria**

* Lighthouse: Home ≥95, demo pages ≥90.
* All SEO checks pass; structured data validates; no mixed‑content or CSP violations.
* CI gates green; deploy is atomic with rollback available.

---

### M8 — Release 2 (SHOULD): Talks & Teaching, RSS, Dark/Light, Structured Data Everywhere

**Goal:** Round out content sections and syndication.

**Key Tasks**

* Talks & Teaching index with filters; slide/video links; mobile embeds.
* RSS/Atom feeds for blog/notes and site‑wide “Latest”.
* Theming: dark/light with system preference; animation respects reduce‑motion.
* Structured data across all content types.

**Acceptance Criteria**

* Slides embed or download work on mobile.
* RSS validates; code blocks have copy buttons.
* Color contrast passes in both themes; prefers‑reduced‑motion respected.

---

### M9 — Release 3 (COULD): Additional Demos & Blog

**Goal:** Add secondary interactive tools and publish notes/blog.

**Key Tasks**

* Quantum Minor‑Embedding Visualizer (Pegasus): inputs (K_m×K_n, P_16, chain strength/seed/deterministic), overlays, chain-length histogram, export JSON mapping.
* ML Model Card + Confusion Matrix Viewer: load sample data, thresholds, metrics, misclassified gallery.
* Blog/Notes with KaTeX; “notes” short‑form category; project metrics auto‑refresh.

**Acceptance Criteria**

* Embedding tool interaction under 100ms for moderate sizes; mapping export matches schema.
* Model Card works offline with bundled data; color contrast meets WCAG.

---

## 4) Risks & Mitigations

* **Interactive compute too heavy:** Precompute grids; WASM or lower resolution; always provide data downloads.
* **Link rot:** CI link checker; mirror key PDFs where license allows.
* **Scope creep:** Enforce MoSCoW; keep MUST in Release 1; push extras to Releases 2–3.

---

## 5) Environments & Deployment

* **Preview per PR:** Auto‑build and share URL for reviewers.
* **Production deploy:** Manual approval when CI is green; atomic. Rollbacks enabled.
* **Caching:** Hashed assets immutable; HTML short TTL; image pipeline standardizes sizes and AVIF/WEBP.

---

## 6) Test Strategy

* **Smoke (per release):** All nav routes; keyboard traversal; alt text + captions; JS‑disabled fallbacks on demos; link health (200/302).
* **Performance:** Bundle analyzer confirms budgets; Lighthouse thresholds met.
* **Accessibility:** axe CI (0 critical); APCA/AA contrast; manual keyboard audit.

---

## 7) Content Governance

* **Ownership:** AJ; issues/PRs manage backlog.
* **Cadence:** Quarterly audit of publications/talks; optional nightly JSON refresh via CI for scholar/inspire caches.
* **Style:** Active voice; short abstracts (≤120 words); lay‑summary boxes for broad audience; alt text policy and media placeholders tracked in `media/PLACEHOLDERS.md`.

---

## 8) Project Definition of Done

A release is **Done** when:

1. All milestones in scope have met their acceptance criteria and passed CI gates.
2. The project‑level non‑functionals (perf/a11y/SEO/security) meet targets.
3. `README` documents dev setup, content model, and contribution guidelines.
4. Accessibility statement and privacy note are published.

---

## 9) Backlog (Initial)

* Auto‑refresh repo stars/last‑commit cache nightly.
* Add `/thesis` with milestones/committee and public materials.
* Trackers page with date‑stamped summaries (Neutrinos, Dark Matter, Cosmology).
* Qiskit Live Mode (beta) for the Spin Explorer via Pyodide; opt‑in and cached.

---

## 10) RACI (lightweight)

* **Product/Content:** AJ (R/A)
* **Engineering:** AJ (R), collaborators (C)
* **Review:** Trusted peers (C), AJ (A)
* **Approval for deploy:** AJ (A)

---

*End of plan — ready to execute.*
