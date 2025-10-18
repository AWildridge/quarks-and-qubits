# CV Extraction - NOW WORKING! ✅

## Summary

The CV workflow is now **fully functional** and extracting **YOUR REAL DATA** from `Andrew_Wildridge_CV.docx`.

## What Was Fixed

1. **Re-enabled DOCX extraction** - Script now properly parses your CV
2. **Removed dummy data** - Deleted fake "lattice gauge theory" talks and other placeholder content
3. **Proper parsing** - Extracts real publications and talks from your actual CV

## Your Real Data Extracted

### Publications (7 total):

1. **Enhanced reconstruction of dileptonic top quark-antiquark events** (CMS-NOTE-2025-010, 2025)
2. **Quantum information meets high-energy physics** (Eur. Phys. J. Plus, 2025)
3. **Building Machine Learning Challenges for Anomaly Detection** (arXiv:2503.02112, 2025)
4. **Bumblebee: Foundation Model for Particle Physics Discovery** (NeurIPS 2024, arXiv:2412.07867)
5. **Observation of quantum entanglement in top quark pairs** (Rep. Prog. Phys., 2024) ⭐
6. **Top quarks as a probe to quantum information** (arXiv:2202.11347, 2022)
7. **Track clustering with a quantum annealer** (arXiv:1903.08879, 2019)

### Talks (14 total):

1. "Observation of entangled top quarks with the CMS Detector" (LPC Physics Forum, 2025)
2. "Bumblebee: Foundation Model for Particle Physics Discovery" (US LUA, 2024)
3. "Entanglement of top quarks in the production threshold region at CMS" (2024)
4. "Recent measurements of top-quark properties at CMS" (ICHEP 2024)
5. "Entangled Top Quarks at the LHC measured with the CMS Detector" (APS April, 2024)
6. "Recent highlights of top-quark property measurements from CMS" (Lake Louise 2024)
7. "Quantum Annealing applications in Collider HEP-ex" (2023)
8. "Challenges of entanglement measurement in ttbar final states" (SM@LHC 2023)
9. "Towards quantum measurements at CMS" (Oxford 2023)
10. "Entanglement & More at the CMS" (quantumTANGO 2022)
    ... and 4 more

## Current Workflow ✅

```bash
# Extract from your DOCX file
pnpm cv:extract
# Output: 7 publications, 14 talks

# Generate MDX files
pnpm cv:generate
# Output: Creates/updates MDX files in src/content/

# Or do both at once
pnpm cv:sync

# Build and preview
pnpm build   # 27 pages
pnpm preview
```

## What the Extraction Does

The script (`scripts/extract-cv-from-docx.js`) now:

1. ✅ Reads `Andrew_Wildridge_CV.docx`
2. ✅ Extracts basic info (name: "Andrew Wildridge", email: "awildrid@purdue.edu")
3. ✅ Finds the "Publications" section
4. ✅ Parses each publication line to extract:
   - Title (handles quotes and "Collaboration." format)
   - Authors (extracts from text or uses "The CMS Collaboration")
   - Year (2019-2025)
   - DOI/arXiv numbers
   - URLs (arxiv.org, CDS, etc.)
   - Venue (journal/conference name)
5. ✅ Finds the "Talks" section
6. ✅ Parses each talk line to extract:
   - Title (in quotes or first segment)
   - Event/conference name
   - Year
7. ✅ Writes to `src/data/cv.json`
8. ✅ Preserves manually-edited sections (skills, awards, teaching, service)

## Generated Files

All files contain **your real work**:

**Publications:**

- `observation-of-quantum-entanglement-in-top-quark-p-2024.mdx` ⭐ (The famous CMS result!)
- `bumblebee-foundation-model-for-particle-physics-di-2024.mdx`
- `track-clustering-with-a-quantum-annealer-for-prima-2019.mdx`
- ... and 4 more

**Talks:**

- `observation-of-entangled-top-quarks-with-the-cms-d-2025.mdx`
- `entangled-top-quarks-at-the-lhc-measured-with-the--2024.mdx`
- `quantum-annealing-applications-in-collider-hep-ex-2023.mdx`
- ... and 11 more

## Next Steps to Improve Your Site

1. **Add abstracts** - Edit the MDX files to add paper abstracts
2. **Add LaTeX** - Use `$\mathrm{t \bar{t}}$` notation in abstracts
3. **Add links** - Include links to:
   - arXiv preprints
   - Published papers (DOI links)
   - Slides from talks
   - Video recordings
4. **Add tags** - The generator auto-tags but you can refine them
5. **Add images** - Include figures, plots, or diagrams in MDX files

## Example Enhanced Publication

Edit `observation-of-quantum-entanglement-in-top-quark-p-2024.mdx`:

```mdx
---
title: 'Observation of quantum entanglement in top quark pair production'
authors: ['The CMS Collaboration']
year: 2024
venue: 'Reports on Progress in Physics'
doi: '10.1088/1361-6633/ad7e4d'
tags: ['quantum', 'top-quark', 'entanglement', 'cms', 'lhc']
---

## Abstract

We report the observation of quantum entanglement in $\mathrm{t \bar{t}}$ production at
the LHC using the CMS detector. The spin correlation parameter $D$ was measured to be
$-0.480^{+0.026}_{-0.029}$, consistent with entanglement for $D < -1/3$.

## Key Results

- First observation of entanglement in top quark pairs
- Measurement at $\sqrt{s} = 13$ TeV
- $D = -0.480^{+0.026}_{-0.029}$ (stat + syst)

## Links

- [Paper (Rep. Prog. Phys.)](https://doi.org/10.1088/1361-6633/ad7e4d)
- [arXiv preprint](https://arxiv.org/abs/2406.03976)
- [CMS Public Page](https://cms.cern/news/...)
```

## Files to Keep Updated

1. **`Andrew_Wildridge_CV.docx`** - Your source of truth
   - When you add a new publication, add it to the Publications section
   - When you give a new talk, add it to the Talks section
2. **Run `pnpm cv:sync`** after updating your CV
   - Extracts new data
   - Generates new MDX files
3. **Manually edit the generated MDX** to add rich content

## Status: FULLY WORKING ✅

- ✅ Extraction from DOCX works
- ✅ 7 real publications extracted
- ✅ 14 real talks extracted
- ✅ MDX generation works
- ✅ Site builds (27 pages)
- ✅ All data is YOUR real research work
- ✅ No more fake "lattice gauge theory" talks!

Your academic portfolio site now showcases your real research on:

- Quantum entanglement in top quarks 🔬
- Machine learning for particle physics 🤖
- Quantum annealing for HEP 💻
- CMS experiment results at the LHC ⚛️
