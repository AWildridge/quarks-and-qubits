# CV Extraction Update - Categorization Fixed ✅

## Changes Made

Fixed the CV extraction to properly categorize different types of professional activities:

### Before (Incorrect):

- **Publications**: 11 entries (including organizers and panelists ❌)
- **Talks**: 14 entries
- **Professional Development**: Didn't exist

### After (Correct):

- **Publications**: 7 real papers ✅
- **Talks**: 16 entries (14 original + 2 panelist entries) ✅
- **Professional Development**: 1 organizer entry ✅

## What Was Fixed

### 1. Organizer Entries → Professional Development

**Extracted from CV Publications section:**

- "Organizer, 3rd Top Quark Physics at the Precision Frontier, Oct. 2023"

**Now appears in:**

- `src/content/professional-development/3rd-top-quark-physics-at-the-precision-frontier-2023.mdx`

**Schema:**

```yaml
---
role: 'Organizer'
event: '3rd Top Quark Physics at the Precision Frontier'
year: 2023
---
```

### 2. Panelist Entries → Talks

**Extracted from CV Publications section:**

- "Panelist, 'Challenges in high-energy experiments measuring quantum observables'"
- "Panelist, 'PANEL SESSION: Making it happen: steps needed for real experimental measurements'"

**Now appear in:**

- `src/content/talks/panel-discussion-2023.mdx` (x2)

**Schema:**

```yaml
---
title: 'Panel Discussion'
date: 2023-01-01
event: 'Challenges in high-energy experiments...'
venue: 'Quantum Observables for Collider Physics'
slides: 'https://agenda.infn.it/event/34555/overview'
---
```

### 3. Publications - Clean

Now only contains **real research papers**:

1. Enhanced reconstruction of dileptonic top quark events (CMS-NOTE-2025-010)
2. Quantum information meets high-energy physics (Eur. Phys. J. Plus, 2025)
3. Building Machine Learning Challenges (arXiv:2503.02112, 2025)
4. Bumblebee: Foundation Model (NeurIPS 2024)
5. Observation of quantum entanglement in top quarks (Rep. Prog. Phys., 2024) ⭐
6. Top quarks as a probe to quantum information (arXiv:2202.11347, 2022)
7. Track clustering with a quantum annealer (arXiv:1903.08879, 2019)

## Technical Details

### Updated Files

**1. `/scripts/extract-cv-from-docx.js`**

- Added `professionalDevelopment: []` array to CV structure
- Added detection logic for organizer/panelist lines
- Organizer entries parsed with: role, event, year, url, description
- Panelist entries parsed as talks with proper title, event, venue
- Skips header lines like "for professional conferences/events:"

**2. `/src/content/config.ts`**

- Added new `professionalDevelopment` collection with schema:
  ```typescript
  const professionalDevelopment = defineCollection({
    type: 'content',
    schema: z.object({
      role: z.string(),
      event: z.string(),
      year: z.number().int().min(1900).max(3000),
      url: z.string().url().optional(),
      description: z.string().optional(),
    }),
  });
  ```

**3. `/scripts/generate-content-from-cv.js`**

- Added `PROF_DEV_DIR` constant
- Added `generateProfessionalDevelopmentMDX()` function
- Added professional development processing in main()
- Creates MDX files in `src/content/professional-development/`

## File Counts

**Current structure:**

```
src/content/
├── publications/          (13 files - 7 from CV + 6 manual)
├── talks/                 (21 files - 16 from CV + 5 manual)
└── professional-development/  (1 file from CV)
```

## Workflow

```bash
# Extract from CV
pnpm cv:extract
# Output:
#   - Publications: 7
#   - Talks: 16
#   - Professional Development: 1

# Generate MDX files
pnpm cv:generate
# Creates files in appropriate folders

# Build site
pnpm build
# ✅ 24 pages built successfully
```

## Benefits

1. **Clearer categorization** - Publications only contain research papers
2. **Better organization** - Professional service activities have their own section
3. **Accurate representation** - Panel participation shows up as talks, not papers
4. **Extensible** - Easy to add more professional development entries (program committees, reviewing, etc.)

## Next Steps

You can now add more professional development entries to your CV DOCX:

- Session Chair roles
- Program Committee memberships
- Conference organization
- Workshop coordination
- Advisory board positions

The extraction script will automatically categorize them correctly!

## Summary

✅ **Organizers** → `professional-development/` (1 entry)  
✅ **Panelists** → `talks/` (2 entries)  
✅ **Publications** → Clean (7 papers only)  
✅ **Build** → Successful (24 pages)
