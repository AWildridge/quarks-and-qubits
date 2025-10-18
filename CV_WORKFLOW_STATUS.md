# CV Workflow - Current Status

## ✅ What's Working

### Content Generation (`pnpm cv:generate`)

- ✅ Reads `src/data/cv.json`
- ✅ Generates publication MDX files in `src/content/publications/`
- ✅ Generates talk MDX files in `src/content/talks/`
- ✅ Auto-generates tags based on keywords
- ✅ Creates URL-friendly slugs
- ✅ Skips existing files (no duplicates)
- ✅ Proper YAML frontmatter formatting

### Build Process

- ✅ Site builds successfully (28 pages)
- ✅ `@astrojs/check` installed for type checking
- ✅ `pnpm build` - fast build without type checking
- ✅ `pnpm build:check` - build with TypeScript checking
- ✅ All generated publications and talks render correctly
- ✅ LaTeX math notation works

## ⚠️ Current Limitations

### CV Extraction (`pnpm cv:extract`)

- ⚠️ **Currently disabled** - DOCX parsing had syntax errors
- ⚠️ The script now just preserves existing `cv.json` data
- ⚠️ You need to **manually edit** `src/data/cv.json` to add publications/talks

### Why Extraction is Disabled

The DOCX parsing logic had complex issues:

1. Syntax errors in the JavaScript code
2. Incomplete parsing logic for publications and talks
3. Was overwriting manually-curated data
4. The DOCX format parsing was unreliable

## 🎯 Current Workflow

### To Add Publications or Talks:

1. **Edit `src/data/cv.json` directly**

   Add a publication:

   ```json
   {
     "title": "Your Publication Title",
     "authors": ["A. Wildridge", "Co-Author"],
     "venue": "Journal Name",
     "year": 2024,
     "doi": "10.xxxx/xxxxx",
     "url": "",
     "abstract": "",
     "citations": 0
   }
   ```

   Add a talk:

   ```json
   {
     "title": "Your Talk Title",
     "event": "Conference Name",
     "venue": "",
     "location": "City, State",
     "date": "2024-06-10",
     "year": 2024,
     "month": 6,
     "slides": "",
     "video": "",
     "abstract": ""
   }
   ```

2. **Generate MDX files**

   ```bash
   pnpm cv:generate
   ```

3. **Review and edit** the generated MDX files
   - Add abstracts
   - Add LaTeX equations
   - Add links to slides/videos
   - Refine tags

4. **Build and preview**
   ```bash
   pnpm build
   pnpm preview
   ```

### Full Sync Command

```bash
pnpm cv:sync
```

This runs:

1. `pnpm cv:extract` - Currently just preserves cv.json (no-op)
2. `pnpm cv:generate` - Creates MDX files from cv.json

## 📝 Files Generated

Example outputs from current test data:

**Publications:**

- `machine-learning-approaches-to-top-quark-spin-corr-2023.mdx`
- `quantum-algorithms-for-lattice-gauge-theory-2024.mdx`

**Talks:**

- `machine-learning-in-high-energy-physics-2024.mdx`
- `quantum-computing-for-lattice-gauge-theories-2024.mdx`

## 🔧 Future Improvements

To fully automate CV extraction from DOCX, we would need to:

1. Fix the DOCX parsing logic in `scripts/extract-cv-from-docx.js`
2. Add robust publication citation parsing
3. Add structured talk information extraction
4. Handle various DOCX formatting styles
5. Add validation and error handling
6. Test with real CV DOCX files

For now, manually editing `cv.json` is **more reliable** and gives you **full control** over the data.

## 📦 Package Status

Installed packages:

- ✅ `@astrojs/check@0.9.4` - TypeScript type checking
- ✅ `typescript` - TypeScript compiler
- ✅ `mammoth@1.11.0` - DOCX parsing (for future use)
- ✅ `remark-math@6.0.0` - LaTeX math in MDX
- ✅ `rehype-katex@7.0.1` - Math rendering

## 🎓 Summary

**Current Best Practice:**

1. Maintain your publications and talks data in `src/data/cv.json`
2. Run `pnpm cv:generate` to create MDX files
3. Manually edit MDX files to add rich content (abstracts, LaTeX, etc.)
4. Build and deploy

The generation script saves time by:

- Creating proper frontmatter automatically
- Generating slugs and filenames
- Auto-tagging content
- Skipping duplicates

But you still have full control over the source data and final output.
