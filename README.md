# Quarks & Qubits

AJ Wildridge’s research website: particle physics, quantum information, and machine learning. Built as a static site with Astro 7, MDX, React islands, and Tailwind 3. Production hosting is CERN WebEOS.

## Develop and verify

Use Node 24 (`.nvmrc`) and the exact pnpm version in `package.json`.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm exec playwright install --with-deps chromium
pnpm dev
```

```bash
pnpm check       # formatting, lint, spelling, unit tests, types, build, HTML, links and headers
pnpm test        # browser regressions under the generated production CSP
pnpm a11y        # accessibility checks in both themes; missing pages fail the run
pnpm lighthouse  # three desktop runs per route; reports stay local
pnpm audit --audit-level=moderate
pnpm preview    # built site at http://127.0.0.1:4321 with security headers
```

`pnpm build` is deterministic and does not fetch bibliographic data or overwrite the CV. It produces `dist/`, the styled `AJ_Wildridge_CV.pdf`, a hashed Content Security Policy, Apache `.htaccess`, and `_headers` for compatible static hosts. Browser installation is explicit, not a side effect of running tests.

## Content and CV

- `src/content/publications/` and `src/content/talks/` are the curated source for both the website and the CV.
- `src/data/cv.json` holds personal details and other CV sections.
- `src/data/Andrew_Wildridge_CV.docx` is the editable Word CV; it includes the three new 2026 entries. Import with `pnpm cv:extract`, review the result, then use `pnpm cv:generate` to add missing records. Existing curated records are preserved by title and year, even when their filenames differ.
- `pnpm bib:fetch` is an explicit network refresh. Review the bibliography diff before committing it.
- The PDF is rendered over a local HTTP server so root-relative styles and fonts load correctly.

The 2026 entries were checked against [the steering preprint](https://arxiv.org/abs/2608.30037), [SM@LHC slides](https://agenda.infn.it/event/48435/contributions/289837/attachments/148229/226494/SMLHC2026_ttbar_spin_overview.pdf), and [the TOP2026 timetable](https://indico.cern.ch/event/1643686/timetable/?view=standard).

## CI and publication

CI uses a frozen lockfile, read-only repository permissions, and actions pinned to verified release commits. It runs the same checks listed above and packages **the tested build**, including hidden Apache configuration, as `site-dist.tar.gz` inside the `verified-site-<commit>` workflow artifact. PRs have no deployment secrets. Dependabot proposes dependency and action updates.

Publishing runs after pushes to `main` and can also be started manually on `main`. CERN EOS/WebDAV is the only deployment route. The credential-bearing job downloads the tested artifact and does not rebuild it.

### CERN EOS

Push to `main` or run **Deploy to CERN EOS** manually. Configure the `production` environment:

| Setting         | Kind     | Purpose                                                                                                     |
| --------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `CERN_USER`     | Secret   | CERN transfer account                                                                                       |
| `CERN_PASSWORD` | Secret   | A CERNBox app credential with write access to the website directory                                         |
| `EOS_PATH`      | Secret   | Exact website directory under `/eos/user/<initial>/<account>/www` or `/eos/project/<initial>/<project>/www` |
| `CERN_WEB_URL`  | Variable | `https://aj-wildridge.web.cern.ch`                                                                          |

The workflow reruns all CI gates. Transfers use CERNBox’s HTTPS WebDAV endpoint at `https://cernbox.cern.ch/remote.php/dav/files/<CERN_USER><EOS_PATH>/`, which maps to the existing EOS website directory ([CERNBox protocol documentation](https://github.com/cernbox/cernbox-cli/blob/main/docs/design.md)). The transfer client explicitly enables WebDAV directory operations. It checks directory access, then uploads a harmless probe to verify that CERN’s Apache server actually applies the generated headers **before updating the website**. It snapshots the previous site, publishes the verified artifact, and checks headers on HTML and PDF responses. Failed promotion triggers restoration; a failed update also preserves a rollback artifact. Transfer credentials stay in the environment, not command arguments or logs. The website directory must contain only this site; mirror deletion is confined to that directory.

## Security controls and limits

All pages are static; there is no login, upload handler, or application database. CSP permits same-origin scripts and explicit hashes, blocks inline event handlers and evaluation, and limits external connections to the existing INSPIRE citation feature. Additional headers restrict framing, MIME sniffing, browser capabilities, and referrer disclosure. No analytics is loaded. The preview server applies the generated policy so browser tests catch blocked scripts and styles.

Apache must allow `.htaccess` header directives (`FileInfo`), `Options`, and `DirectoryIndex`. Static Astro middleware cannot set headers on the production server; configuration files alone are not evidence that the host enforces them. A deployment fails if the live checks cannot verify the policy. HSTS is scoped to this host without requesting preload or changing subdomain policy.

The dependency overrides pin compatible APIs for transitive security fixes in minimatch, glob, basic-ftp, and KaTeX until upstream consumers update. Build, lint, export, and browser checks cover these paths. Dependency auditing is a point-in-time check, not a security guarantee. Server accounts, CERN access policy, and remote configuration still require the hosting administrator’s controls.
