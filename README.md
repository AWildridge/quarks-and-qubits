# quarks-and-qubits

Astro + MDX + Tailwind site with strict CI gates (build, lint/format, spellcheck, link-check, axe, Lighthouse, Playwright smoke). TypeScript strict, minimal JS by default.

## Stack

- Astro 4, TypeScript, MDX, Tailwind CSS
- Islands: React via `@astrojs/react` (only where needed)
- CI: GitHub Actions (Node 20 + pnpm)
- Gates: ESLint (flat config), Prettier, cspell, linkinator, @axe-core/cli, Lighthouse, Playwright

## Prereqs

- Node >= 20, pnpm >= 8
- Recommended (no sudo): install with nvm + Corepack

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"
nvm install 20 && nvm use 20 && nvm alias default 20
corepack enable && corepack prepare pnpm@9.12.0 --activate
```

## Quick start

```bash
pnpm install
pnpm dev
```

## Common scripts

```bash
# Quality
pnpm typecheck
pnpm lint
pnpm format:check
pnpm cspell

# Build & preview
pnpm build
pnpm preview

# E2E smoke
pnpm exec playwright install chromium
pnpm test
```

## CI gates (what runs on PR/main)

- Typecheck, ESLint, Prettier check, cspell
- Build + HTML validate
- Serve preview, crawl with linkinator
- Axe scan (fails on critical violations)
- Lighthouse (Desktop): perf ≥ 0.95 and accessibility = 1.00
- Playwright smoke: page loads and `<h1>` exists on home

Workflow file: `.github/workflows/ci.yml`

## Project structure

- `src/layouts/BaseLayout.astro` — global frame with skip link, header/nav, footer
- `src/pages/` — home, research, projects, publications, talks, demos, CV, contact, RSS, and sitemap routes
- `src/components/` — Button, Card, Tag, Tabs (accessible), FigureWithCaption
- `src/styles/global.css` — Tailwind layers + base colors
- `src/styles/theme.css` — tokens and base typography/focus styles
- `astro.config.mjs` — Tailwind, MDX, React integrations
- `eslint.config.mjs` — ESLint v9 flat config (Astro + TS)
- `lighthouserc.json` — perf thresholds
- `public/_headers` — production security headers for static hosting
- `public/data/` — static JSON cache scaffold for project, publication, and demo consumers

## Content model

Astro Content Collections live in `src/content/` with zod schemas in `src/content/config.ts`.
Current collections cover projects, publications, talks, posters, teaching, posts, people, and
professional development. Build-time validation fails on invalid frontmatter.

## Troubleshooting

- Playwright needs browsers: `pnpm exec playwright install chromium`
- Axe CLI needs Chrome in CI; locally it can fail without system Chrome — rely on CI or install a browser.
- ESLint v9 uses flat config; generated Astro types are ignored in `eslint.config.mjs`.
- Husky Prettier errors parsing `.astro` files? Optionally install the Astro Prettier plugin:

```bash
pnpm add -D prettier-plugin-astro
```

## Pick up where you left off (cheat sheet)

```bash
pnpm install
pnpm check
pnpm build
pnpm preview
pnpm exec playwright install chromium
pnpm test
```

## Current milestone surface

- Research landing page with topic figures and links into publications, talks, and demos
- Three-plus project records with detail pages, metrics, reproduce steps, architecture diagrams, and schema
- Publications index/detail pages with filters, BibTeX export, BibTeX validation, and ScholarlyArticle schema
- Talks index, RSS, sitemap, contact, CV HTML/PDF generation, press kit, and two interactive demos
- The teaching page is parked under `src/_disabled_pages/teaching/` so it can be restored later without exposing it in the site navigation.
- CI validates formatting, linting, spelling, build, HTML, BibTeX, Playwright, links, axe, Lighthouse, sitemap, headers, and mixed content
