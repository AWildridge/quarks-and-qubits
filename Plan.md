# Integration Plan (Plan.md)
_For AJ Wildridge — Astro site, CERN deploy, Qiskit Live Mode_

## 0) Goal & Scope
Stand up the Astro site locally, connect CI/CD to CERN web hosting, and ship v1 with placeholders. Then progressively add Qiskit Live Mode (Pyodide) for the Spin Correlation Explorer, a curated Publications list, and the Blog/Trackers.

---

## 1) Prereqs
- **Node** ≥ 18 (20 recommended): `node -v`
- **GitHub repo** ready (public or private)
- **CERN web area** (AFS/EOS path) and SSH access
- **Secrets** (GitHub → Settings → Secrets and variables → Actions):
  - `SSH_PRIVATE_KEY` — key with access to your web area
  - `CERN_HOST` — e.g., `lxplus.cern.ch` (or your gateway)
  - `CERN_USER` — your CERN login
  - `CERN_PATH` — e.g., `/eos/user/a/ajwildri/www/`
  - `SSH_KNOWN_HOSTS` (optional) — `ssh-keyscan -H $CERN_HOST`

---

## 2) Local Setup
1. **Download/extract** the scaffold zip.  
2. Install deps and run dev:
   ```bash
   npm i
   npm run dev
   # open http://localhost:4321
   ```
3. Verify routes exist: `/`, `/research`, `/projects`, `/publications`, `/blog`, `/thesis`, `/contact`.

**Deliverable:** Dev server renders hero, nav, and placeholder sections.

---

## 3) Repository & Branch Strategy
- Default branch: **`main`**
- Optional: **`develop`** for daily work; merge to `main` for deploys
- Protect `main`: require status checks (build) before merging

**Deliverable:** Repo created; branch rules set.

---

## 4) CI/CD to CERN (GitHub Actions)
1. Push repo to GitHub.
2. Add the **secrets** listed in §1.
3. Ensure `.github/workflows/deploy-cern.yml` is present (from the scaffold).
4. Trigger deploy:
   - Push to `main` (auto) **or**
   - Manual: Actions → Deploy to CERN Web → Run workflow
5. Validate remote:
   - Visit `https://aj-wildridge.web.cern.ch/` and confirm the new build
   - Check timestamps or add a footer “Deployed at …” to verify

**Deliverable:** CI run succeeds; site visible from CERN domain.

---

## 5) Content Intake (MVP)
- Update **Home** hero:
  - `src/pages/index.astro`: tagline, CV link, correct GitHub URL
- **Thesis** page: add abstract/outline/committee/milestones
- **Projects**:
  - Fill out Spin Correlation Explorer intro (`/projects/spin-corr`)
  - Add Bumblebee overview (`/projects/bumblebee`)
- **Publications**:
  - Start with curated manual entries (MDX or JSON)
- **Blog/Trackers**:
  - Create 1 “Hello” post to smoke test RSS later
  - Draft `/trackers` page (Neutrinos, Dark Matter, Cosmology)

**Deliverable:** MVP content merged, builds on CI.

---

## 6) Visuals & Accessibility
- Replace placeholder images in `public/img/` as they arrive
- Add **alt text** and **captions** for figures
- Run local checks:
  ```bash
  # Lighthouse (Chrome) for perf/a11y
  # axe DevTools or pa11y for automated a11y checks
  ```
- Respect `prefers-reduced-motion`; ensure focus rings and skip links

**Deliverable:** A11y baseline passing; color-contrast AA.

---

## 7) Spin Correlation Explorer — Qiskit Live Mode
### 7.1 Phase A — Static + TS math
- Implement `C_ij` heatmap using precomputed grids (JSON in `public/demo-assets`)
- Provide TS utilities for 2×2/4×4 density-matrix ops (discord/steering basics)
- Ensure **export** (SVG/PNG) + **JSON params** download
- Ship keyboard support and textual readouts

### 7.2 Phase B — Qiskit in-browser (Pyodide)
- Add a **toggle** in `QiskitToggle.tsx`: “Enable Qiskit Live Mode (beta)”
- Load **Pyodide** lazily in a **Web Worker**:
  - Cache via Service Worker
  - Import minimal **Qiskit Terra** subset (package availability may vary)
  - Expose functions for statevector/density-matrix ops (1–2 qubits)
- Update UI panels to call worker APIs when live mode is on
- Fallback to Phase A if load fails

**Deliverables:**
- Phase A: explorer functional without network
- Phase B: toggle works; first-run warmup acceptable on laptop/desktop

**Notes:** Keep WASM and large files off the initial route; only load after the user opts in.

---

## 8) Analytics & Privacy
- Plausible script is pre-wired in the layout
- Configure domain in Plausible dashboard
- Confirm **no cookies** and CSP compatibility

**Deliverable:** Basic pageview analytics; privacy note added.

---

## 9) SEO & Metadata
- Add per-page `<title>` and descriptions
- Generate `sitemap.xml` and `robots.txt`
- Add OpenGraph/Twitter image templates
- Add JSON‑LD for Person, SoftwareSourceCode, ScholarlyArticle (as pages mature)

**Deliverable:** Core metadata present; Lighthouse SEO ≥ 95.

---

## 10) Build & Deploy Verification
- Local: `npm run build` → verify `dist/`
- CI: review artifact logs
- Remote: confirm cache headers on hashed assets; HTML short TTL

**Deliverable:** Reliable build & publish cycle.

---

## 11) Staging (Optional but Recommended)
- Add a **staging** workflow:
  - Branch `staging` → deploy to `${CERN_PATH}/staging/`
  - Protect `staging` with basic auth (if available) or keep link private
- PR previews: use a distinct subfolder `${CERN_PATH}/previews/${{ github.sha }}/`

**Deliverable:** Safe area for testing before `main` goes live.

---

## 12) Operational Playbook
- **Content updates**: open PRs; CI must be green (build, link-check, a11y)
- **Link rot**: add a link-check step to CI later
- **Accessibility**: quarterly audit; handle issues via GitHub Issues
- **Dependencies**: monthly updates; pin versions for reproducibility
- **Backups**: artifacts exist in GitHub; remote is static, mirror with rsync if needed

**Deliverable:** Basic maintenance cadence documented.

---

## 13) Timeline (Suggestion)
- **Week 0**: Repo + CI + domain → live placeholder
- **Week 1**: Content pass (Home/Projects/Thesis); a11y baseline
- **Week 2**: Spin Corr Explorer Phase A (TS math + export)
- **Week 3–4**: Qiskit Live Mode (Pyodide) beta; Blog/Trackers seed content

---

## 14) Checklists

### Deploy checklist
- [ ] Secrets set (`SSH_PRIVATE_KEY`, `CERN_*`)
- [ ] `npm run build` passes locally
- [ ] CI green on `main`
- [ ] Site loads at CERN domain
- [ ] Cache headers OK

### Content checklist
- [ ] Hero tagline/CTAs verified
- [ ] Thesis page populated
- [ ] 3–5 featured projects live
- [ ] Publications (≥3) added
- [ ] Blog has first post
- [ ] Trackers page scaffolded

### Explorer checklist
- [ ] C_ij heatmap renders
- [ ] Discord/steering text outputs present
- [ ] Export PNG/SVG/JSON works
- [ ] Keyboard navigation complete
- [ ] Qiskit Live Mode toggle loads worker
- [ ] Fallback path functions

---

## 15) File Map (where to edit)
- `src/pages/index.astro` — hero/CTAs
- `src/pages/projects/spin-corr/index.astro` — Explorer shell
- `src/components/QiskitToggle.tsx` — toggle + worker wiring
- `public/demo-assets/` — precomputed grids (add)
- `src/pages/thesis.astro` — thesis details
- `src/pages/publications.astro` (or `/content/publications`) — curated list
- `src/pages/blog/` — posts
- `Requirements.md` & `Plan.md` — living docs

---

## 16) Risks & Mitigations
- **Pyodide bundle size** → gate behind toggle; cache; messaging
- **Package availability in WASM** → keep a TS simulator fallback
- **CERN path permissions** → verify SSH key and directory ownership
- **Link rot** → CI link-check; mirror key PDFs

---

## 17) Definition of Done (v1)
- Site live on CERN domain with MVP content
- Explorer Phase A complete; Phase B behind toggle (beta)
- CI deploy stable; analytics gathered; a11y checks pass
- `Requirements.md` + `Plan.md` updated to reflect reality
