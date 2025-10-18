#!/usr/bin/env node
/**
 * Fetch BibTeX entries for publications from InspireHEP (preferred) or DOI.org (fallback)
 * - Reads frontmatter from src/content/publications/*.mdx
 * - For each entry, tries:
 *    1) InspireHEP by DOI (size=1, most recent)
 *    2) InspireHEP by arXiv id (if DOI is an arXiv DOI)
 *    3) InspireHEP by exact title
 *    4) DOI.org with Accept: application/x-bibtex
 * - Writes combined file to public/bibliography.bib
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const PUB_DIR = path.join(ROOT, 'src', 'content', 'publications');
const OUT_FILE = path.join(ROOT, 'public', 'bibliography.bib');

function parseFrontmatter(raw) {
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return {};
  const fm = fmMatch[1];
  const data = {};
  // Very small YAML subset parser: key: value, arrays in [..], strings in quotes
  for (const line of fm.split(/\r?\n/)) {
    const m = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      // Array, parse as JSON after ensuring double quotes (JSON-like)
      try {
        const jsonLike = val.replace(/'/g, '"');
        data[key] = JSON.parse(jsonLike);
      } catch {
        data[key] = [];
      }
    } else if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      data[key] = val.slice(1, -1);
    } else if (/^\d{4}$/.test(val)) {
      data[key] = Number(val);
    } else if (val === 'true' || val === 'false') {
      data[key] = val === 'true';
    } else {
      data[key] = val;
    }
  }
  return data;
}

async function readPublications() {
  const files = await fs.readdir(PUB_DIR);
  const mdxFiles = files.filter((f) => f.endsWith('.mdx'));
  const pubs = [];
  for (const file of mdxFiles) {
    const full = path.join(PUB_DIR, file);
    const raw = await fs.readFile(full, 'utf8');
    const data = parseFrontmatter(raw);
    if (data.draft === true) continue; // skip drafts
    const slug = file.replace(/\.mdx$/, '');
    pubs.push({ slug, ...data });
  }
  return pubs;
}

function extractArxivIdFromDOI(doi) {
  // 10.48550/arXiv.2412.07867 -> 2412.07867
  const m = /^10\.48550\/arXiv\.(.+)$/.exec(doi || '');
  return m ? m[1] : null;
}

async function fetchInspireBy(query) {
  const url = `https://inspirehep.net/api/literature?size=1&sort=mostrecent&q=${encodeURIComponent(
    query,
  )}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/x-bibtex' },
  });
  if (!res.ok) return null;
  const text = await res.text();
  // Inspire returns empty body if nothing matched
  return text && text.trim().length > 0 ? text.trim() : null;
}

async function fetchBibTeXViaDoi(doi) {
  if (!doi) return null;
  const url = `https://doi.org/${encodeURIComponent(doi)}`;
  const res = await fetch(url, { headers: { Accept: 'application/x-bibtex' } });
  if (!res.ok) return null;
  const text = await res.text();
  return text && text.trim().length > 0 ? text.trim() : null;
}

async function fetchCdsBibTeX(cdsUrl) {
  if (!cdsUrl || !/cds\.cern\.ch\/record\//.test(cdsUrl)) return null;
  try {
    // Construct a BibTeX export URL via CDS UI pattern
    // Many CDS records support /export?ln=en&format=bibtex or /export/bibtex
    const exportUrls = [
      `${cdsUrl.replace(/\/$/, '')}/export?ln=en&format=bibtex`,
      `${cdsUrl.replace(/\/$/, '')}/export/bibtex`,
    ];
    for (const u of exportUrls) {
      const res = await fetch(u, { headers: { Accept: 'text/plain' } });
      if (res.ok) {
        const text = (await res.text()).trim();
        if (text) return text;
      }
    }
  } catch {
    return null;
  }
  return null;
}

function normalizeBibtexEntry(entry, slug) {
  // Ensure each entry ends with a single newline and has the cite key present
  let e = entry.trim();
  if (!e.endsWith('}')) {
    e = e + '\n}';
  }
  // Optionally, adjust cite key to include slug if missing
  // e.g., @article{SomeKey,
  e = e.replace(/^@(\w+)\{\s*,/m, (_m, type) => `@${type}{${slug},`);
  return e + '\n';
}

async function main() {
  console.log('🔎 Reading publications...');
  const pubs = await readPublications();
  console.log(`• Found ${pubs.length} publication files`);

  const entries = [];
  for (const pub of pubs) {
    const { slug, title, doi, url } = pub;
    let bib = null;
    let tried = [];
    try {
      // 0) CERN CDS for CMS Notes, if URL is a CDS record
      if (!bib && url && /cds\.cern\.ch\/record\//.test(url)) {
        tried.push('cds');
        bib = await fetchCdsBibTeX(url);
      }
      if (doi) {
        tried.push('inspire:doi');
        bib = await fetchInspireBy(`doi:${doi}`);
      }
      if (!bib) {
        const arxivId = extractArxivIdFromDOI(doi);
        if (arxivId) {
          tried.push('inspire:arxiv');
          bib = await fetchInspireBy(`arxiv:${arxivId}`);
        }
      }
      if (!bib && title) {
        tried.push('inspire:title');
        // Use quoted title for exact title search
        bib = await fetchInspireBy(`title:"${title}"`);
      }
      if (!bib && doi) {
        tried.push('doi.org');
        bib = await fetchBibTeXViaDoi(doi);
      }

      if (bib) {
        const normalized = normalizeBibtexEntry(bib, slug);
        entries.push(normalized);
        console.log(`✓ ${slug}: fetched via ${tried[tried.length - 1]}`);
      } else {
        console.warn(`⚠️  ${slug}: no BibTeX found (tried ${tried.join(', ')})`);
      }
    } catch (err) {
      console.warn(`⚠️  ${slug}: error during fetch (${tried.join(', ')}):`, err.message);
    }
  }

  const combined = entries.join('\n');
  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
  await fs.writeFile(OUT_FILE, combined, 'utf8');

  console.log(
    `\n📝 Wrote ${entries.length} BibTeX ${entries.length === 1 ? 'entry' : 'entries'} to ${path.relative(ROOT, OUT_FILE)}`,
  );
  if (entries.length < pubs.length) {
    console.log(
      `ℹ️  Missing ${pubs.length - entries.length} ${pubs.length - entries.length === 1 ? 'entry' : 'entries'} (see warnings above).`,
    );
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  // Do not hard fail builds if this is used in CI; exit non-zero for local visibility
  process.exit(1);
});
