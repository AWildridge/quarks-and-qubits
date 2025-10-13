# quarks-and-qubits
My personal website.
## Quarks and Qubits

Astro + MDX + Tailwind site scaffold with CI gates for build, lint, spellcheck, link-check, axe, Lighthouse, and a Playwright smoke test.

### Local development

1. Ensure Node >= 20 and pnpm >= 8.
2. Install deps: `pnpm install`.
3. Start dev server: `pnpm dev`.

### Content model

MDX pages under `src/pages`. Collections can be added later via Astro Content Collections.

### Checks

- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint`
- Format check: `pnpm format:check`
- Spellcheck: `pnpm cspell`
- Build: `pnpm build`
- E2E smoke: `pnpm test`
