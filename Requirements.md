# AJ Personal Research Website — Requirements (v0.1)

> Scope: A fast, accessible, academic‑portfolio website highlighting research and projects in **Top‑Quark Spin Correlations**, **Quantum Computing**, and **Machine Learning**, with interactive demos and tight GitHub integration.

---

## 1) Vision & Goals

**Vision.** Present a credible, citable, and engaging hub for your scholarship, with clear paths for collaborators, recruiters, students, and media to discover your work.

**Primary goals.**

* G1. Showcase flagship research projects with short, comprehensible summaries and deep technical detail on demand.
* G2. Provide interactive, in‑browser visualizations/demos for: top‑quark spin correlations, quantum annealing embeddings, and ML model behavior.
* G3. Offer a clean CV, publications list, talks, and teaching materials with permanent links.
* G4. Bridge to GitHub repos (stars, latest release, docs, demo links) and Google Scholar/InspireHEP/ORCID.
* G5. Rank well on academic queries (SEO) while preserving privacy (no invasive tracking).

**Non‑goals.**

* NG1. Host heavy server‑side compute; all demos should be client‑side or precomputed.
* NG2. Replace full paper repositories; link out to arXiv/Inspire/DOI instead.

---

## 2) Audiences & Use Cases

**Personas**

* P1: **Research collaborator/PI** — wants concise topic summaries, publications, and contact.
* P2: **Recruiter/industry scientist** — wants quick credibility signals, top projects, impact metrics.
* P3: **Student/mentee** — wants slides, course notes, demo explainers.
* P4: **Journalist/outreach** — wants one‑paragraph bio, headshots, lay summaries.

**Representative user stories**

* U1 (P1): “I need a one‑pager on top‑quark spin correlations with key plots and a link to the code.”
* U2 (P2): “I want to scan 3 flagship projects in 90 seconds, then open the repos.”
* U3 (P3): “I want to manipulate a spin‑correlation heatmap and see how (C_{ij}) changes with angles.”
* U4 (P3): “I want to see a quantum minor‑embedding visual for Pegasus and export a screenshot.”
* U5 (P4): “I need a 100‑word bio, high‑res headshot, and recent press/research highlights.”

**Success criteria (measurable)**

* S1. Time‑to‑first‑meaningful‑content < 2s on median connections; Lighthouse perf ≥ 95.
* S2. Each flagship project page includes: abstract, architecture/diagram, key results, repo/demo links, and citation.
* S3. At least two interactive demos ship with keyboard and touch support + instructions.
* S4. Publications are filterable by topic/year and exportable as BibTeX.
* S5. Structured data (schema.org) validates for Person, SoftwareSourceCode, and ScholarlyArticle.

---

## 3) Information Architecture

**Top‑level navigation (desktop & mobile):**

1. **Home** — hero, research areas, top projects, recent highlights.
2. **Research** — topic hubs: Top‑Quark, Quantum, ML (each with a lay summary + deep dive).
3. **Projects** — filterable gallery (topic, year, method, language); cards link to detail pages.
4. **Publications** — list with filters + BibTeX/DOI/arXiv/Slides links.
5. **Talks & Teaching** — talks, posters, slides, course notes; filter by venue/year.
6. **Blog/Notes** *(optional)* — short essays, experiment logs, explainers.
7. **CV** — on‑site HTML view + downloadable PDF.
8. **Contact** — email, social, office, media kit.

**Footer:** copyright, last updated, ORCID, Google Scholar, GitHub, LinkedIn, RSS.

---

## 4) Content Inventory & Models

**Content types**

* **Project** — title, summary, role, collaborators, tags (top‑quark/quantum/ML), status, highlights, architecture image, metrics (stars, citations), repo link, demo link, dataset link(s), arXiv/DOI, badges (license, language), thumbnail.
* **Publication** — title, venue, year, authors, abstract, arXiv, DOI, Inspire/Scholar, PDF, slides, code, BibTeX.
* **Talk** — title, event, date, location, slides, recording, abstract.
* **Post** — title, date, tags, summary, content, images.
* **Person/Bio** — name, affiliations, email, short bio, long bio, headshots.

**Front‑matter schema (YAML/JSON) — Project**

```yaml
slug: "spin-correlation-explorer"
title: "Interactive Spin Correlation Explorer"
summary: "Explore C_{ij} vs angles with LO/NNLO presets and exportable plots."
tags: [top-quark, visualization, physics]
role: "Lead"
collaborators: ["..."]
year: 2025
status: "active"
repo_url: "https://github.com/..."
demo_url: "/demos/spin-corr"
arxiv: "2501.01234"
doi: null
license: "MIT"
tech: [TypeScript, WebGL, WASM]
images: ["/img/spin-corr-hero.png"]
highlights:
  - "Heatmap and 3D vector views"
  - "Keyboard accessible controls"
```

**Front‑matter schema — Publication**

```yaml
slug: "spin-density-matrix-run2"
title: "Multi-differential Spin-Density Matrix in t\bar{t} (Run 2)"
authors: ["Your Name", "..."]
venue: "Journal / Conf"
year: 2025
arxiv: "2503.04567"
doi: "10.xxxx/xxxxx"
pdf_url: "/pubs/spin-density.pdf"
code_url: "https://github.com/..."
slides_url: "/talks/spin-density-slides.pdf"
bibtex: "@article{...}"
tags: [top-quark]
```

---

## 5) Page Templates & Key Requirements

### 5.1 Home

* Hero: name, concise tagline, CTA buttons (Download CV, GitHub, Scholar/ORCID).
* Three research area cards with lay summaries and “Learn more”.
* “Featured Projects” (3) with live repo stats (stars, last updated) and badges.
* “Recent” list (latest pub/talk/post).
  **Acceptance**: Mobile ≤ 1 scroll for core CTAs; Lighthouse a11y ≥ 95.

### 5.2 Research (Topic Hub)

* Overview (lay summary + key figures).
* “How this fits the field” section (context, impact).
* Links to projects, publications, talks tagged for the topic.
  **Acceptance**: Each topic hub has ≥1 figure with alt text and a non‑expert synopsis (≤ 150 words).

### 5.3 Projects (Index & Detail)

* Index: card grid; filters (topic/year/language); search; pagination or progressive load.
* Detail: abstract, architecture diagram, metrics, demo link, repo, citations, contributors, badges.
  **Acceptance**: Filters are keyboard accessible; detail pages include a “Reproduce” section linking to data/code.

### 5.4 Publications

* Index: table/list with venue, year, title, tags; quick filters; export BibTeX for selection/all.
* Detail *(optional)*: abstract, links (PDF/arXiv/DOI/slides), figures, media coverage.
  **Acceptance**: BibTeX export yields a valid .bib; all links pass link‑check CI.

### 5.5 Talks & Teaching

* Index: filters by year/venue; card per talk with slide and recording links if available.
  **Acceptance**: Slides embed or download works on mobile.

### 5.6 Blog/Notes *(optional)*

* Markdown/MDX posts with math (KaTeX), code, and figure captions.
  **Acceptance**: RSS feed valid; code blocks have copy buttons.

### 5.7 CV

* On‑site HTML view; Download PDF (same content); structured data for Person.
  **Acceptance**: Single source of truth (JSON/YAML) generates both HTML and PDF.

### 5.8 Contact / Media Kit

* Secure contact options; social links; public email; short bio; press kit (headshots, bio, logos).
  **Acceptance**: No CAPTCHA walls; uses rate‑limited form handler or mailto with obfuscation.

---

## 6) Interactive Demos (Functional Requirements)

### 6.1 Spin Correlation Explorer (Physics)

* Inputs: production mode (gg/q\bar{q}), energy preset, angles (θ, φ), basis (helicity/beam/off‑diagonal), LO/approx NNLO presets.
* Views: heatmap of (C_{ij}), vector plot for spin axes, export PNG/SVG, download current parameters (JSON).
* Data: either WASM math or precomputed JSON grids; visible equation/tooltips; link to paper/code.
* A11y: keyboard control for sliders; textual output of current (C_{ij}) values.
  **Acceptance**: Rendering at 60fps on mid‑range laptop; all controls operable by keyboard; export produces crisp SVG.

### 6.2 Quantum Minor‑Embedding Visualizer (Pegasus)

* Inputs: K_m×K_n graph sizes, target Pegasus size (e.g., P_16), chain strength; random seed; deterministic option.
* Views: overlay logical vs physical qubits; chain length histogram; export JSON mapping.
* Data: in‑browser D3/WebGL; no server calls; “Copy mapping” button.
  **Acceptance**: For moderate sizes, interaction under 100ms latency; mapping export matches expected schema.

### 6.3 ML Model Card + Confusion Matrix Viewer

* Inputs: select model/version/dataset; toggle thresholds; show metrics (accuracy, F1, ROC, PR).
* Views: confusion matrix with hover details; misclassified examples gallery; “Model Card” section with limitations.
  **Acceptance**: Works offline with bundled sample data; meets WCAG for color contrast.

---

## 7) Integration Requirements

* GitHub: show repo badges (stars, last commit), release badges, CI status; deep links to README/docs.
* Scholar/ORCID/InspireHEP: author links on publications; optional automatic nightly metadata refresh (static JSON refresh via CI).
* arXiv/DOI: badges and canonical links on publication pages.
* RSS/Atom: for Blog/Notes and site‑wide “Latest”.

---

## 8) Non‑Functional Requirements

**Performance**

* LCP ≤ 2.5s; CLS ≤ 0.1; TBT ≤ 200ms; JS budget: ≤200KB on Home (post‑gzip), ≤350KB on demo pages (code‑split).
* Image policy: responsive images, AVIF/WEBP, lazy‑loading, width/height set, preconnect for fonts.

**Accessibility**

* WCAG 2.2 AA: focus states, skip‑to‑content, semantic landmarks, alt text, captioned media, keyboard operation.
* Testing: axe CI, manual keyboard audit, color‑contrast checks (APCA/AA).

**SEO & Metadata**

* Title/description per page; Open Graph/Twitter cards; canonical URLs; sitemap.xml, robots.txt.
* schema.org: Person, Organization (lab), SoftwareSourceCode, Dataset, ScholarlyArticle.

**Security & Privacy**

* Strict Content‑Security‑Policy (no `unsafe-inline`); security headers; no third‑party trackers; Plausible/Umami for analytics.
* GDPR‑friendly: no cookies or only essential; transparent privacy note.

**Reliability & Maintainability**

* Static site generation preferred; CI for build, link check, spell check, and Lighthouse.
* Automated dependency updates; pinned versions; reproducible builds.

---

## 9) Technical Stack (Recommendation)

**Option A (content‑first, very fast)**: **Astro + MDX + Tailwind**

* Pros: tiny JS by default, MDX content, easy code‑splitting, drop‑in React/Vue/Svelte islands for demos.
* Cons: extra step to wire complex React libraries.

**Option B (app‑first, interactive)**: **Next.js (App Router) + MDX + Tailwind**

* Pros: rich React ecosystem, easy client components, ISR, API routes if ever needed.
* Cons: higher JS budget by default; must discipline bundle size.

**Baseline tooling (both options)**: TypeScript, ESLint/Prettier, Playwright (a11y + smoke), GitHub Actions CI, Remark/rehype for MDX, KaTeX for math.

---

## 10) Design System

* **Brand**: minimal academic; dark/light mode; accent derived from physics/quantum palette.
* **Typography**: Sans (e.g., Inter/IBM Plex Sans) + Mono for code; system fallbacks.
* **Components**: buttons, cards, tag chips, tabs, accordions, filter pills, code blocks with copy, figure with caption.
* **Charts**: D3/Canvas/WebGL; provide data table fallback for screen readers.
* **Icons**: simple line icons; accessible labels.

**Acceptance**: Color contrast AA; prefers‑reduced‑motion respected.

---

## 11) Data & File Organization

```
/content
  /projects/*.mdx
  /publications/*.mdx
  /talks/*.mdx
  /posts/*.mdx
/data
  projects.json  # repo stats cache
  pubs.json      # scholar/inspire cache
  demos/
    spin_corr/*.json
    pegasus/*.json
/public
  /img
  /demo-assets
```

---

## 12) Build, Deploy, and CI/CD

* Repo: GitHub (public).
* CI: build, unit + smoke tests, link check, Lighthouse, a11y checks (axe), dead‑image check.
* Deployment: Vercel or Netlify or GitHub Pages (SSG). Custom domain with HSTS and automatic SSL.
* Monitoring: simple uptime check; analytics via Plausible/Umami.

**Acceptance**: Green CI gates required before deploy; atomic deploys; rollbacks available.

---

## 13) Content Governance

* Ownership: you own all content; repo issues manage backlog.
* Update cadence: quarterly audit of publications/talks; auto‑refresh scholar/inspire caches via CI.
* Style guide: active voice; short abstracts (≤120 words); add lay summary boxes for broad audience.

---

## 14) Testing & Acceptance Plan

**Smoke tests (manual & CI)**

* T1. All nav routes load on mobile and desktop.
* T2. Keyboard‑only navigation reaches all interactive controls; focus order logical.
* T3. Images have alt text; figures have captions.
* T4. Publications export valid BibTeX; links resolve (HTTP 200/302).
* T5. Demos render with JS disabled fallback messages and data download links.

**Performance tests**

* P1. Lighthouse perf ≥ 95 Home, ≥ 90 demo pages.
* P2. Bundle analyzer shows Home < 200KB JS.

**A11y tests**

* A1. axe violations = 0 critical; color contrast AA passes; reduced‑motion tested.

---

## 15) Roadmap & MoSCoW Priorities

**MUST (M)**

* M1. Home, Research hubs, Projects index/detail, Publications, CV, Contact.
* M2. GitHub + Scholar/ORCID links; basic SEO; analytics (privacy‑friendly).
* M3. One interactive demo (Spin Correlation Explorer) with keyboard support.

**SHOULD (S)**

* S1. Talks & Teaching; RSS; dark/light mode; structured data across types.
* S2. BibTeX export and filters; repo badges; “Reproduce” sections.

**COULD (C)**

* C1. Quantum minor‑embedding visualizer; ML model card viewer.
* C2. Blog/Notes with KaTeX; project metrics auto‑refresh.

**WON’T (W) [for now]**

* W1. Server‑rendered notebooks; heavy back‑end services.

---

## 16) Risks & Mitigations

* R1. **Interactive compute too heavy** → precompute grids, WASM, or reduce resolution; provide data download.
* R2. **Link rot** → link checker in CI; mirror key PDFs.
* R3. **Scope creep** → MoSCoW discipline; phased milestones.

---

## 17) Definition of Done (project)

* Site passes acceptance tests (Section 14).
* All MUST items shipped (Section 15).
* README includes: local dev instructions, content model, and contribution guidelines.
* A11y statement & privacy note published.

---

## 18) Appendices

**A. Structured Data examples** (schema.org JSON‑LD snippets to implement during build).
**B. BibTeX export format** (UTF‑8, normalized author names, safe keys).
**C. Demo data schemas** (spin correlation grids; Pegasus mapping JSON).

---

### 9A) Astro vs Next.js — Deep Comparison

**TL;DR**

* **Choose Astro** if this is a content‑first academic site with a few isolated, high‑performance demos and you want the smallest JS payloads by default.
* **Choose Next.js** if you expect lots of app‑like interactivity, authenticated sections, dashboards/APIs, or you want Vercel’s first‑class features (ISR, Edge Functions) out‑of‑the‑box.
* **Hybrid**: keep the main site in Astro, host heavier demos as a small Next app at `/apps/*` or `demos.yourdomain`, sharing a design system in a monorepo.

---

#### Rendering, Performance & JS Budget

* **Astro**: MPA with **islands/partial hydration** → zero JS by default; only interactive components hydrate. Excellent for Lighthouse scores and academic SEO. SSR exists via adapters but SSG is the sweet spot.
* **Next.js**: SPA/MPA hybrid via **React Server Components (App Router)**. Great DX, but client bundle can grow if many client components are used. **ISR/revalidation** enables fresh content without full rebuilds.

**Implication for AJ**: For text‑heavy pages (Publications, Talks, CV), Astro yields smaller bundles automatically. If you’ll add app‑like sections (model explorers, dataset browsers, user prefs), Next eases state and routing complexity.

#### Interactivity Model

* **Astro**: Drop in React/Vue/Svelte components as islands. Cross‑island global state is possible (e.g., Zustand) but orchestration across many islands can get tricky.
* **Next.js**: Unified React app; context, routing, and state management are straightforward for complex interactions.

#### Data & Content

* **Astro**: Content Collections (type‑safe MD/MDX) are excellent for publications, projects, talks. Data changes usually require a rebuild (good for stability; less good for high‑frequency updates).
* **Next.js**: RSC data‑fetching + **ISR**/on‑demand revalidation suits content that must update often (e.g., repo stats, “Latest” feeds) without a full site rebuild.

#### Images & Media

* **Next.js**: `next/image` with smart optimization/CDN integration.
* **Astro**: `@astrojs/image` is capable and SSG‑friendly, but Next’s integration with Vercel’s optimizer is more turnkey.

#### SEO & Metadata

Both are excellent. Astro naturally ships less JS, often yielding marginally higher Core Web Vitals out‑of‑the‑box. Next has mature patterns for OpenGraph/Twitter cards and dynamic metadata.

#### APIs, Edge, and Backend Needs

* **Next.js**: Built‑in API routes, Middleware, Edge Functions, and cron jobs (Vercel) — ideal if you later add contact forms with logic, signed downloads, or server‑side transforms.
* **Astro**: Typically pair with serverless functions (Netlify/Vercel) or a tiny Cloudflare Worker; not as integrated but perfectly viable.

#### i18n, Routing & Auth

* **Next.js**: Mature routing and middleware; i18n and auth (NextAuth, Clerk) are well‑trodden.
* **Astro**: i18n available via community plugins; auth requires wiring a backend or using third‑party drop‑ins.

#### Build Times & Scale

* **Astro**: Very fast builds for lots of static pages (great for publication catalogs).
* **Next.js**: Large static sites can build slower, but **ISR** reduces the need to prebuild everything.

#### Ecosystem & DX

* **Next.js**: The largest React ecosystem; first‑class Vercel features, many examples for dashboards, docs, and apps.
* **Astro**: Rapidly growing; excels at “content site + a sprinkle of interactivity.” Simpler mental model for content teams.

#### Demos, WASM, WebGL

Both handle WebGL/Three.js/D3/WASM. In Next, mark such components as **client**; in Astro, mount them as islands. For multiple tightly‑coupled interactive views, Next’s unified React tree can be simpler.

#### Privacy & Analytics

Both work seamlessly with Plausible/Umami. Astro’s lower JS budget helps privacy by default (fewer scripts).

#### Accessibility

Parity: success depends on your components and testing (axe/Playwright) rather than the framework.

---

### Decision Guide (Quick Checks)

* **Mostly content + a few demos?** → **Astro**.
* **Frequent data refresh without rebuilds?** → **Next.js (ISR)**.
* **Need auth, user settings, dashboards, or API endpoints?** → **Next.js**.
* **Hard requirement to keep JS < 200KB on all pages?** → **Astro** makes this easier.
* **Multiple interactive views sharing global state?** → **Next.js**.

---

### Hybrid Architecture (Recommended for AJ)

* **Astro main site**: Home, Research hubs, Projects, Publications, Talks, CV, Contact (near‑zero JS).
* **Next.js sub‑app**: Heavy interactive tools (e.g., Quantum Minor‑Embedding Visualizer, ML Model Card Explorer) at `/apps/*` or `demos.example.com`.
* **Monorepo** (pnpm + Turborepo): shared Tailwind config, shadcn/ui components, icons, ESLint/Prettier, and theme tokens.
* **CI**: Separate pipelines; Astro site deploys on content changes, Next app deploys on tool updates.

---

### Gotchas & Mitigations

* **Next.js RSC vs client libs**: Some chart libs need `"use client"`. Isolate heavy UI in client components; keep data/markdown in server components.
* **Astro islands over‑hydration**: Avoid mounting many small islands; group related UI into one island to reduce hydration cost.
* **Image pipelines**: Standardize image sizes and formats (AVIF/WEBP).
* **Math typesetting**: Use KaTeX via remark/rehype in both stacks; pre‑render where possible.
* **Link rot**: CI link‑checker regardless of stack.

---

### Recommendation for this project

1. Start with **Astro** for the main academic site to hit performance/a11y goals effortlessly.
2. Ship **Spin Correlation Explorer** as a React island.
3. If/when tools evolve into multi‑view apps (datasets, user prefs, notebooks), spin up a **Next.js** sub‑app and link from Projects.

## 19) Discovery & Content Intake (Answer Here)

Use this checklist to lock decisions quickly. If you skip an item, I’ll apply the **Default**.

### A. Identity & Branding

* **Display name & titles** (Default: full legal name as you prefer on papers) → `...`
* **Affiliations** (department, institute, lab) → `...`
* **Pronouns** (for bio, optional) → `...`
* **Short bio (≤120 words)** and **long bio (≤300 words)** → `...`
* **Headshot(s)** (license/attribution, cropping preferences) → `...`
* **Theme**: light/dark with auto‑switch? (Default: both with system preference) → `...`

### B. Domain, Hosting, & Contact

* **Primary domain** (e.g., `firstname-lastname.com`) → `...`
* **Subdomain for future apps** (Default: `apps.<domain>`) → `...`
* **Email for contact** + preference: mailto vs form (Default: mailto with obfuscation) → `...`
* **Social links** (GitHub, Scholar, ORCID, LinkedIn, InspireHEP, X/Bluesky, YouTube) → `...`

### C. Home Page Hero

* **Tagline** (≤100 chars). Example defaults:

  * “Top‑quark spin correlations • Quantum computing • Machine learning”
  * “Particle physics + quantum algorithms + ML”
* **Primary CTAs** (Default: Download CV, GitHub, Google Scholar, Email) → `...`
* **Featured highlights** (3 items: project/paper/talk) → `...`

### D. Research Areas & Summaries

Provide a 80–150 word lay summary and 1 key figure (optional) for each:

* **Top‑Quark Spin Correlations** → `...`
* **Quantum Computing** → `...`
* **Machine Learning** → `...`

### E. Projects (Initial Set for Launch)

For each 3–6 featured projects: title, 2–3 sentence summary, role, year, repo URL(s), demo URL (if any), key image, tags.
Defaults: badges for license/language; GitHub stars & last‑updated shown.

### F. Publications

* **Source of truth** (Default: curated MDX + JSON cache). Options: Google Scholar ID, InspireHEP author ID, ORCID. → `...`
* **Show BibTeX export?** (Default: Yes) → `...`
* **Mirror PDFs on site?** (Default: Key PDFs mirrored with proper citation) → `...`

### G. Talks & Teaching

* Upload slides/recordings? (Default: link out if hosted; mirror with permission) → `...`
* Fields per talk: title, venue, date, location, abstract, slide link, video link.

### H. Interactive Demos (MVP)

1. **Spin Correlation Explorer**

   * **Priority** (Default: Launch) → `...`
   * **Computation**: precomputed grids vs WASM math (Default: precomputed). → `...`
   * **Angle ranges & resolution** (Default: θ∈[0,π], φ∈[0,2π], 181×181 grid). → `...`
   * **Presets**: gg/qar{q}; basis (helicity/beam/off‑diag); LO ± knobs. → `...`
   * **Export**: PNG/SVG + JSON params (Default: Yes). → `...`

2. **Quantum Minor‑Embedding Visualizer** *(Could)

   * Defer to phase 2? (Default: Yes). → `...`

3. **ML Model Card + Confusion Matrix** *(Could)

   * Provide sample JSON (Default: bundle small dataset). → `...`

### I. Accessibility & UX

* **Keyboard‑only navigation requirements** (Default: full support + visible focus). → `...`
* **Reduce‑motion preference honored?** (Default: Yes). → `...`
* **Color contrast** (Default: WCAG 2.2 AA). → `...`

### J. Analytics, Privacy, & SEO

* **Analytics** (Default: Plausible, EU server, no cookies) → `...`
* **Privacy note** (Default: simple, no trackers beyond analytics) → `...`
* **OpenGraph image style** (Default: simple card with name, title, accent color) → `...`
* **Sitemap/robots** (Default: Yes) → `...`

### K. CI/CD & Maintenance

* **GitHub org/repo name** (Default: public repo under personal account) → `...`
* **CI gates** (Default: build + link‑check + Lighthouse + axe). → `...`
* **Update cadence** (Default: quarterly content audit + nightly metadata refresh). → `...`

### L. Legal & Licensing

* **Site content license** (Default: © with “All rights reserved”) → `...`
* **Code samples** (Default: MIT) → `...`
* **Figure permissions** for paper images (confirm allowable reuse). → `...`

### M. Timeline & Milestones

* **Target launch date** → `...`
* **Must‑have pages at launch** (Default: Home, Research, Projects, Publications, CV, Contact). → `...`

---

*When you answer in chat, I’ll copy the decisions into this section and proceed to scaffolding.*

## 19A) Decisions (2025-09-03)

**Identity & Branding**

* **Name/Titles/Affiliations:** Andrew (AJ) James Wildridge — PhD Student, Purdue University; CTO, Quantum Research Sciences (QRS).
* **Pronouns:** (TBD)
* **Bios/Headshots:** (Awaiting assets)

**Domain & Contact**

* **Primary domain:** [https://aj-wildridge.web.cern.ch/](https://aj-wildridge.web.cern.ch/) (CERN hosting).
* **Sub-apps domain:** apps.aj-wildridge.web.cern.ch (optional later).
* **Contact:** [andrew.james.wildridge@cern.ch](mailto:andrew.james.wildridge@cern.ch) (mailto link, obfuscated on page).
* **Analytics:** Plausible (no cookies).

**Home Hero**

* **Primary CTAs:** Download CV, GitHub, Thesis.
* **Tagline (chosen):** **Quarks · Qubits · Machine Learning**

**Featured Projects (launch set)**

1. **Quantum Information of Top Quarks** — Exploring quantum correlations in pair-produced top quarks at the LHC; originated with the discovery of entangled top quarks (PhD thesis).
2. **Quantum Computing** — Applications in HEP and deterministic minor embeddings on quantum annealers.
3. **Bumblebee: A Path to Foundation Models for Particle Physics Discoveries** — Status and progress toward a foundation model for HEP.
4. **Top Quark ML Reconstruction** — Improving dileptonic ttbar reconstruction with ML to enable more precise quantum-correlation measurements.
5. **Toponium** — Goals for characterizing the recently observed pseudoscalar excess at the LHC.

**Publications**

* **Source of truth:** Manual/curated (to avoid default CMS list).
* **BibTeX export:** Yes.
* **PDF mirroring:** Mirror key PDFs where license allows.

**Blog & Trackers**

* **Blog:** Include for essays/notes.
* **Live trackers (curated):** Neutrino masses, dark matter searches, cosmology tensions/dark energy. (Manual updates initially; automation optional later.)

**Interactive Demos**

* **Spin Correlation Explorer:** Launch in v1.

  * **Scope add-ons:** Demonstrate non-classicality via quantum discord and EPR steering visuals in addition to C_ij.
  * **Compute path:** Prefer **in-browser Qiskit** (see Section 21), with a progressive fallback to precomputed grids for C_ij and in-browser linear algebra for discord/steering.
* **Other demos:** Quantum Minor-Embedding Visualizer and ML Model Card Viewer → Phase 2.

**Pages (v1 must-have)**

* Home, Research, Projects, Publications, Blog, CV, Contact, Thesis page.

---

## 19B) Tagline Options (archived)

(Chosen: **Quarks · Qubits · Machine Learning**)

---

## 20) MVP Content Plan Based on Decisions

### 20.1 Information Architecture Adjustments

* Add: `/thesis` (abstract, progress milestones, committee, public materials).
* Add: `/trackers` (Neutrinos, Dark Matter, Cosmology) — curated summaries with date-stamped updates and links to primary sources.
* Blog: `/blog` with RSS; math via KaTeX; short “notes” category.

### 20.2 Spin Correlation Explorer — Expanded Requirements

* **Panels**: (A) C_ij heatmap and basis selector; (B) Discord gauge with tooltip summarizing definition; (C) Steering panel showing conditional Bloch vectors when measuring one qubit; (D) “Classical vs QM” toggle with side-by-side outcomes.
* **Inputs**: production mode (gg/qqbar), basis (helicity/beam/off-diagonal), theta, phi, energy preset; optional noise/misalignment sliders.
* **Output**: export SVG/PNG and JSON of parameters/results; link to Qiskit notebook reproducing current state (if user chooses external run).
* **Performance**: Aim 60 fps; progressive enhancement when enabling Qiskit mode.

### 20.3 Blog & Trackers — Update Workflow

* **Manual first**: MDX articles with front-matter `last_reviewed:` and `sources:`.
* **Automation later**: GitHub Actions job to refresh small JSON factsheets (e.g., current limits) from trusted sources; changes appear via rebuild.
* **Editorial policy**: Each tracker section begins with a 100-word lay summary plus “What changed this month?”.

### 20.4 Hosting/Deploy (CERN)

* **Build**: Astro SSG → static assets.
* **Deploy**: GitHub Actions to rsync/scp to CERN web area (AFS/EOS) or CERN GitLab CI if preferred.
* **Cache**: set immutable cache for hashed assets; short TTL for HTML.
* **Analytics**: Plausible via script tag with CSP allowlist.

---

## 21) Browser-Based Qiskit Plan (Technical)

**Goal**: Allow users to enable “Qiskit Live Mode” to compute discord/steering and simple circuit simulations entirely in-browser, with no server calls.

**Approach A — Pyodide (CPython→WASM)**

* **Stack**: Pyodide runtime + micropip to install minimal Qiskit components (Terra core where feasible).
* **Simulator**: Use Qiskit’s reference Python simulator (no Aer) due to native extensions in Aer.
* **Bundle strategy**: Lazy-load on demand (user clicks “Enable Qiskit Live Mode”). Cache via Service Worker.
* **Tradeoffs**: Initial download size ~30–70 MB; first-run warmup ~5–15s depending on device. Some Qiskit packages may be unavailable or slow under WASM; we’ll restrict to the subset required for 1–2 qubits and density-matrix ops.
* **Fallback**: If load fails, fall back to precomputed C_ij + in-browser TS linear algebra.

**Approach B — JS/TS Simulator (Qiskit-like API)**

* **Stack**: Lightweight TS simulator for 1–4 qubits (statevector + simple noise) exposing a tiny Qiskit-like interface for the demo.
* **Pro**: <200 KB, instant, fully offline.
* **Con**: Not “real” Qiskit; used only for the demo path.
* **Note**: We can still provide full Qiskit notebooks to reproduce results 1:1 outside the browser.

**UI/UX**

* Toggle button: “Enable Qiskit Live Mode (beta)” with size/time estimate.
* Status panel: loader with progress + cached indicator for subsequent visits.
* A11y: announce status to screen readers; offer cancel and fallback.

**Security/Perf**

* Run heavy work in a Web Worker; cap memory; catch runaway computations.
* CSP updated to allow WASM and worker scripts from same origin.

**Docs & Honesty**

* A note on limitations and reproducibility: exact Python/SDK versions; link to external notebook.

---

## 22) Placeholder Media Policy

* Use aspect‑ratio boxes for hero/topic figures with descriptive captions (e.g., “Placeholder — Top‑quark spin correlation figure”).
* Include alt text placeholders to be replaced when assets arrive.
* Add a `media/PLACEHOLDERS.md` checklist to track swaps.

---

Next step: proceed to Astro scaffold reflecting these decisions (see Section 23 to be added with directory layout and initial files) and wire the Spin Correlation Explorer shell with the Qiskit toggle and placeholders.

*End v0.1 — ready for review and iteration.*
