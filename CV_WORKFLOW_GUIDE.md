# CV Workflow Guide

This guide explains the automated workflow for extracting data from your CV and generating publication and talk pages.

## Overview

The workflow consists of three main steps:

1. **Edit your CV** in `Andrew_Wildridge_CV.docx` (Word format)
2. **Extract data** from the DOCX to JSON format
3. **Generate MDX files** for publications and talks

## Quick Start

```bash
# Full workflow: extract CV data and generate content
pnpm cv:sync

# Or run steps individually:
pnpm cv:extract    # Extract CV data from DOCX to JSON
pnpm cv:generate   # Generate MDX files from JSON

# Build and preview
pnpm build
pnpm preview
```

## Step 1: Edit Your CV

Edit `Andrew_Wildridge_CV.docx` following these formatting guidelines:

### Publications Section

Format publications as:

```
PUBLICATIONS

Authors. "Title". Venue. Year. DOI/URL

Examples:
- A. Wildridge, J. Smith. "Machine Learning for Top Quarks". JHEP. 2023. 10.1007/JHEP01(2023)001
- The CMS Collaboration. "Observation of Entanglement". Phys. Rev. Lett. 2024. https://arxiv.org/abs/2401.12345
```

**Tips:**

- Put titles in quotes for best parsing
- Include DOI (format: `10.xxxx/...`) or arXiv URL
- Year should be a 4-digit number
- Authors can be separated by commas, "and", "&", or "et al."

### Talks Section

Format talks as:

```
TALKS

"Talk Title", Event Name, Date, Location

Examples:
- "Entangled Top Quarks at the LHC", APS April Meeting, April 15, 2024, Sacramento, CA
- "Quantum Annealing for Particle Physics", CERN Colloquium, June 2023, Geneva
```

**Tips:**

- Put talk titles in quotes
- Include event/conference name
- Date can be "Month Day, Year" or just "Year"
- Add slides/video URLs on a new line starting with https://

### Other Sections

The extraction script also parses:

- **EDUCATION**: Degree, Institution, Location, Dates
- **EXPERIENCE**: Title, Organization, Dates, Bullet points
- **SKILLS**: Programming languages, frameworks, tools
- **AWARDS**: Award name, Organization, Year

## Step 2: Extract CV Data

The extraction script (`scripts/extract-cv-from-docx.js`) runs automatically before each build.

Manual extraction:

```bash
pnpm cv:extract
```

This creates/updates `src/data/cv.json` with structured data:

```json
{
  "name": "AJ Wildridge",
  "publications": [
    {
      "title": "...",
      "authors": ["A. Wildridge", "..."],
      "venue": "JHEP",
      "year": 2023,
      "doi": "10.1007/...",
      "url": "https://..."
    }
  ],
  "talks": [
    {
      "title": "...",
      "event": "APS April Meeting",
      "date": "2024-04-15",
      "location": "Sacramento, CA",
      "slides": "https://..."
    }
  ]
}
```

## Step 3: Generate Content

The generation script (`scripts/generate-content-from-cv.js`) creates MDX files from the JSON data.

```bash
pnpm cv:generate
```

This creates files in:

- `src/content/publications/` - Publication pages with metadata
- `src/content/talks/` - Talk pages with event details

**Features:**

- **Smart slugs**: Converts titles to URL-friendly filenames
- **Auto-tagging**: Adds relevant tags based on content (machine-learning, quantum, cms, etc.)
- **Duplicate detection**: Skips files that already exist
- **Proper formatting**: YAML frontmatter with quoted strings

**Example output:**

```
📚 Processing 11 publications...
   ✓ Created: observation-of-quantum-entanglement-in-top-quark-p-2024.mdx
   ✓ Created: machine-learning-approaches-to-top-quark-spin-2023.mdx

✅ Created 11 new publication(s) (0 already existed)
```

## Generated File Format

### Publication MDX

```mdx
---
title: 'Machine Learning Approaches to Top Quark Spin'
authors: ['A. Wildridge', 'J. Smith']
year: 2023
venue: 'Journal of High Energy Physics'
doi: '10.1007/JHEP01(2023)001'
tags: ['machine-learning', 'top-quark', 'hep-ex']
---

Publication in Journal of High Energy Physics.

<!-- You can add more details here -->
```

### Talk MDX

```mdx
---
title: 'Entangled Top Quarks at the LHC'
date: 2024-04-15
event: 'APS April Meeting'
venue: 'Sacramento Convention Center'
location: 'Sacramento, CA'
slides: 'https://example.com/slides.pdf'
tags: ['quantum', 'top-quark', 'experimental']
---

Presentation at APS April Meeting.

<!-- Add abstract, additional notes here -->
```

## Customization

### Adding Abstracts

After generation, you can edit the MDX files to add:

- Abstract/description
- Additional context
- LaTeX equations using `$...$` or `$$...$$`
- Images, figures, charts
- Links to related work

Example:

```mdx
---
title: '...'
authors: [...]
---

## Abstract

This work presents a novel approach to measuring quantum entanglement in top quark pairs...

## Key Results

- Observed spin correlation $D = -0.48^{+0.03}_{-0.03}$
- First evidence of entanglement in $\mathrm{t \bar{t}}$ production
- Used machine learning classifier with 95% accuracy

## References

- [Preprint on arXiv](https://arxiv.org/abs/...)
- [DOI Link](https://doi.org/...)
```

### Manual Tagging

Auto-generated tags are based on keywords. You can edit tags in the frontmatter:

```yaml
tags: ['machine-learning', 'cms', 'top-quark', 'quantum', 'hep-ex']
```

Available tag suggestions:

- Physics: `hep-ex`, `hep-ph`, `hep-th`, `quantum`, `lattice`, `top-quark`, `higgs`
- Methods: `machine-learning`, `deep-learning`, `quantum-computing`, `optimization`
- Experiments: `cms`, `atlas`, `lhc`, `cern`
- Techniques: `neural-networks`, `transformers`, `qcd`, `entanglement`

## Workflow Tips

### Iterative Updates

1. Add a new publication to your CV DOCX
2. Run `pnpm cv:sync`
3. Review the generated MDX file
4. Add abstract and additional details
5. Build and preview

### Batch Updates

When adding multiple publications/talks:

1. Update your CV with all new entries
2. Run `pnpm cv:sync` once
3. Review all new files together
4. Make edits as needed
5. Commit changes

### Rebuilding Content

If you need to regenerate a file:

1. Delete the existing MDX file
2. Run `pnpm cv:generate`
3. The file will be recreated from the JSON data

### LaTeX Support

Use LaTeX notation for math/physics symbols:

- Particles: `$\mathrm{t \bar{t}}$` → $\mathrm{t \bar{t}}$
- Measurements: `$\sqrt{s} = 13$ TeV` → $\sqrt{s} = 13$ TeV
- Uncertainties: `$-0.48^{+0.03}_{-0.03}$` → $-0.48^{+0.03}_{-0.03}$
- Operators: `$D < -1/3$` → $D < -1/3$

## Troubleshooting

### Publications Not Extracted

**Problem:** `cv.json` has empty or incomplete publication entries

**Solutions:**

- Check that publication section is titled "PUBLICATIONS" (case-insensitive)
- Ensure publications follow the format: `Authors. "Title". Venue. Year. DOI`
- Put titles in quotes for better parsing
- Include a 4-digit year

### Talks Not Generated

**Problem:** No talk MDX files created

**Solutions:**

- Check that talks section exists in DOCX with header "TALKS"
- Format as: `"Title", Event, Date, Location`
- Include at least title and event name

### Missing Metadata

**Problem:** Generated files are missing DOI, venue, or other fields

**Solutions:**

- Add missing info to the DOCX (DOIs, URLs, full venue names)
- Re-run `pnpm cv:sync`
- Or manually edit the generated MDX frontmatter

### Build Errors

**Problem:** Build fails after generating new content

**Solutions:**

1. Check for YAML syntax errors in frontmatter
2. Ensure all quotes are properly escaped
3. Run `pnpm astro check` to see specific errors
4. Verify all required fields are present (title, authors, year for publications)

### Duplicate Files

**Problem:** Multiple files for the same publication/talk

**Solutions:**

- The script uses slugs + year for filenames
- If you have two items with similar titles and same year, they may collide
- Manually rename one file or add distinguishing info to the title

## Advanced Usage

### Custom Parsing

Edit `scripts/extract-cv-from-docx.js` to customize parsing:

```javascript
// Add custom DOI extraction pattern
const doiMatch = line.match(/your-custom-pattern/);

// Add custom author parsing
const authors = line.split(/your-separator/).map(clean);
```

### Custom Tags

Edit `scripts/generate-content-from-cv.js` to add custom tagging logic:

```javascript
function extractPublicationTags(pub) {
  const tags = [];

  // Add your custom tag logic
  if (pub.title.toLowerCase().includes('your-keyword')) {
    tags.push('your-tag');
  }

  return tags;
}
```

### Integration with Prebuild

The extraction runs automatically before builds via `package.json`:

```json
{
  "scripts": {
    "prebuild": "node scripts/extract-cv-from-docx.js && node scripts/validate-bibtex.js"
  }
}
```

To also auto-generate content before builds:

```json
{
  "scripts": {
    "prebuild": "pnpm cv:sync && node scripts/validate-bibtex.js"
  }
}
```

**Note:** This will regenerate all content on every build. Consider doing this manually instead to preserve custom edits to MDX files.

## File Structure

```
quarks-and-qubits/
├── Andrew_Wildridge_CV.docx     # Source CV document
├── scripts/
│   ├── extract-cv-from-docx.js  # DOCX → JSON extraction
│   └── generate-content-from-cv.js  # JSON → MDX generation
├── src/
│   ├── data/
│   │   └── cv.json              # Extracted CV data
│   └── content/
│       ├── publications/         # Generated publication pages
│       │   ├── example-2023.mdx
│       │   └── ...
│       └── talks/                # Generated talk pages
│           ├── example-2024.mdx
│           └── ...
└── package.json                 # Scripts configuration
```

## Summary

1. **Edit** `Andrew_Wildridge_CV.docx` with new publications/talks
2. **Extract** data with `pnpm cv:extract` (creates `cv.json`)
3. **Generate** MDX files with `pnpm cv:generate`
4. **Review** and edit generated files (add abstracts, etc.)
5. **Build** with `pnpm build`
6. **Deploy** your updated site

This workflow ensures your website stays in sync with your CV with minimal manual work!
