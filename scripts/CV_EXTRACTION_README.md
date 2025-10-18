# CV Extraction from DOCX

This directory contains a script that automatically extracts structured data from `Andrew_Wildridge_CV.docx` and converts it to `cv.json` for use by the website.

## How It Works

The `extract-cv-from-docx.js` script:

1. Reads `src/data/Andrew_Wildridge_CV.docx` using the `mammoth` library
2. Extracts plain text content
3. Parses the text using heuristics to identify sections (Education, Experience, Publications, etc.)
4. Outputs structured JSON to `src/data/cv.json`

## Usage

### Automatic Extraction (During Build)

The extraction runs automatically before every build:

```bash
pnpm build        # Extracts CV, then builds the site
```

### Manual Extraction

To extract the CV without building:

```bash
pnpm cv:extract   # node scripts/extract-cv-from-docx.js
```

### Updating Your CV

1. Edit `src/data/Andrew_Wildridge_CV.docx` in Microsoft Word or LibreOffice
2. Save the file
3. Run `pnpm cv:extract` to regenerate `cv.json`
4. Build and deploy: `pnpm build`

## DOCX Format Requirements

For best results, structure your CV DOCX with clear section headers:

### Recommended Structure

```
Your Name
Your Title/Position

Email: your@email.com
Website: https://yourwebsite.com

EDUCATION
--------
Ph.D.: Field of Study                    2020-2024
University Name - City, State
Thesis: Your thesis title
Advisor: Prof. Name

Bachelor of Science: Major                2016-2020
University Name - City, State

EXPERIENCE
----------
Job Title                                 2023-present
Organization Name - City, State
• First accomplishment or responsibility
• Second accomplishment or responsibility
• Third accomplishment or responsibility

Previous Job Title                        2020-2023
Previous Organization - City, State
• Responsibility one
• Responsibility two

PUBLICATIONS
------------
Author Name, et al. "Paper Title". Journal Name. Year. DOI

SKILLS
------
Programming: Python, C++, JavaScript, Julia
Frameworks: PyTorch, TensorFlow, React
Tools: Git, Docker, Kubernetes

AWARDS
------
Award Name, Year
Award Name, Year

LANGUAGES
---------
English (Native)
Spanish (Fluent)
```

### Tips for Better Parsing

1. **Section Headers**: Use standard headers like "EDUCATION", "EXPERIENCE", "PUBLICATIONS", "SKILLS", "AWARDS"
2. **Dates**: Format as "YYYY-YYYY" or "YYYY-present" or "Month YYYY - Month YYYY"
3. **Bullet Points**: Use • (bullet), - (dash), or \* (asterisk) for lists
4. **Education**: Start degree lines with "PhD", "Ph.D.", "MSc", "M.Sc.", "BSc", "B.Sc.", "Bachelor", "Master", or "Doctor"
5. **Job Titles**: Put job titles on their own line, followed by organization and dates
6. **Contact Info**: Include email and website URL on separate lines near the top

## Parsed JSON Structure

The script generates a JSON file with this structure:

```json
{
  "name": "Your Name",
  "title": "Your Professional Title",
  "email": "your@email.com",
  "website": "https://yourwebsite.com",
  "location": "City, State",
  "summary": "Brief professional summary...",
  "education": [
    {
      "degree": "Ph.D.: Field",
      "institution": "University Name",
      "location": "City, State",
      "startDate": "2020",
      "endDate": "2024",
      "thesis": "Thesis title",
      "advisor": "Prof. Name",
      "distinction": "Honor or distinction"
    }
  ],
  "experience": [
    {
      "title": "Job Title",
      "organization": "Organization Name",
      "location": "City, State",
      "startDate": "2023-01",
      "endDate": "present",
      "highlights": ["Accomplishment 1", "Accomplishment 2"]
    }
  ],
  "publications": [
    {
      "title": "Paper Title",
      "authors": ["Author 1", "Author 2"],
      "venue": "Journal Name",
      "year": "2024",
      "doi": "10.1234/doi"
    }
  ],
  "skills": {
    "programming": ["Python", "C++"],
    "frameworks": ["PyTorch", "TensorFlow"]
  },
  "awards": ["Award 1", "Award 2"],
  "languages": ["English (Native)", "Spanish (Fluent)"]
}
```

## Manual Overrides

If the automatic extraction doesn't parse everything correctly, you can:

1. Run `pnpm cv:extract` to get the base extraction
2. Manually edit `src/data/cv.json` to fix any issues
3. Keep `Andrew_Wildridge_CV.docx` as the source of truth
4. Re-run extraction when you add new content

## Troubleshooting

### Some sections are empty or incomplete

- Check that your DOCX uses standard section headers (EDUCATION, EXPERIENCE, etc.)
- Ensure dates are in recognizable formats (YYYY-YYYY or YYYY-present)
- Use bullet points (•, -, \*) for lists of accomplishments

### Experience entries not parsing

- Put job titles on their own line
- Follow with organization name on the next line
- Include dates in format "YYYY-MM - YYYY-MM" or "YYYY-present"
- Use bullet points for highlights/responsibilities

### Publications showing as empty

- Publications parsing is challenging due to varied formats
- Consider manually structuring the publications section in cv.json
- Or use a consistent citation format in the DOCX (Author names. "Title". Journal. Year. DOI)

### Want to customize parsing logic

Edit `scripts/extract-cv-from-docx.js` and modify the `parseCV()` function to match your CV's specific format.

## Integration with Build Process

The script is integrated into the build process via the `prebuild` npm script:

```json
{
  "scripts": {
    "prebuild": "node scripts/extract-cv-from-docx.js",
    "build": "astro build"
  }
}
```

This ensures the CV is always up-to-date when you deploy the website.
