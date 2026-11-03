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

Push to `main` or run **Deploy to CERN EOS** manually. Set the following repository Actions secrets (Settings → Secrets and variables → Actions), or override them in the `production` environment. The URL variable is optional; the workflow defaults to the URL below.

| Setting         | Kind     | Purpose                                                                                                     |
| --------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `CERN_USER`     | Secret   | CERN transfer account                                                                                       |
| `CERN_PASSWORD` | Secret   | Transfer credential for `CERN_USER`; the selected CERN endpoint must accept its authentication method       |
| `EOS_PATH`      | Secret   | Exact website directory under `/eos/user/<initial>/<account>/www` or `/eos/project/<initial>/<project>/www` |
| `CERN_WEB_URL`  | Variable | `https://aj-wildridge.web.cern.ch`                                                                          |

The workflow reruns all CI gates. Transfers use rclone with CERNBox’s [documented external WebDAV route](https://cernbox.docs.cern.ch/desktop/other-access-methods/webdav/) at `https://cernbox.cern.ch/cernbox/webdav<EOS_PATH>/`. This route accepted the configured credentials and returned readable directory metadata; the alternate `/remote.php/dav/files/` route rejected the same credentials with HTTP 401. The transfer client checks directory access, then uploads a harmless probe to verify that CERN’s Apache server actually applies the generated headers **before updating the website**. It snapshots the previous site, publishes the verified artifact, and checks headers on HTML and PDF responses. Failed promotion triggers restoration; a failed update also preserves a rollback artifact. Transfer credentials stay in the environment, not command arguments or logs. The website directory must contain only this site; mirror deletion is confined to that directory, and the staging directory is excluded from publication and restoration.

For an authentication failure, run **Diagnose CERN EOS access** from the Actions tab. This manual workflow uses the same secrets and makes read-only `PROPFIND` requests to the current external WebDAV route, the alternate DAV files route, and the [CERN-network API route](https://cernbox.docs.cern.ch/for_developers/api_access/#protected-shares). It reports HTTP status codes or connection failures in the run summary without printing credentials, directory paths, or server response bodies. It does not build or publish the website. HTTP 207 with a successful DAV property response establishes metadata access, not upload or deletion permission. A 401 can indicate a credential or authentication-policy mismatch; it does not by itself establish an expired password. If only the internal API route works from lxplus, a runner within CERN or another supported transfer method is needed; changing the hostname on a GitHub-hosted runner is insufficient.

The diagnostic can also be run locally with the three secret values already set in the environment: `python3 scripts/diagnose-cern.py`. Do not put passwords in shell command arguments or commit them to a file. Validate the diagnostic itself with `python3 -m unittest discover -s tests -p 'cern_diagnostics_test.py'`.

## Security controls and limits

All pages are static; there is no login, upload handler, or application database. CSP permits same-origin scripts and explicit hashes, blocks inline event handlers and evaluation, and limits external connections to the existing INSPIRE citation feature. Additional headers restrict framing, MIME sniffing, browser capabilities, and referrer disclosure. No analytics is loaded. The preview server applies the generated policy so browser tests catch blocked scripts and styles.

Apache must allow `.htaccess` header directives (`FileInfo`), `Options`, and `DirectoryIndex`. Static Astro middleware cannot set headers on the production server; configuration files alone are not evidence that the host enforces them. A deployment fails if the live checks cannot verify the policy. HSTS is scoped to this host without requesting preload or changing subdomain policy.

The dependency overrides pin compatible APIs for transitive security fixes in minimatch, glob, basic-ftp, and KaTeX until upstream consumers update. Build, lint, export, and browser checks cover these paths. Dependency auditing is a point-in-time check, not a security guarantee. Server accounts, CERN access policy, and remote configuration still require the hosting administrator’s controls.
