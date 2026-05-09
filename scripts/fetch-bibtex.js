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
        if (/^@\w+\{/.test(text)) return text;
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

function sanitizeBibTeX(str = '') {
  return String(str).replace(/[{}%$#_&]/g, (match) => `\\${match}`);
}

function normalizeIdentifier(value = '') {
  const raw = String(value).trim();
  if (!raw) return {};
  const arxiv = raw.match(/(?:arXiv:|10\.48550\/arXiv\.)(\d{4}\.\d{4,5}(?:v\d+)?)/i);
  if (arxiv) {
    return {
      eprint: arxiv[1],
      archivePrefix: 'arXiv',
      url: `https://arxiv.org/abs/${arxiv[1]}`,
    };
  }
  const doi = raw.replace(/^doi:\s*/i, '');
  return { doi };
}

function citeKeyFor(pub) {
  const firstAuthor = Array.isArray(pub.authors)
    ? pub.authors[0]
    : typeof pub.authors === 'string'
      ? pub.authors
      : 'Wildridge';
  const authorKey =
    String(firstAuthor)
      .split(/\s+/)
      .filter(Boolean)
      .pop()
      ?.replace(/[^A-Za-z0-9]/g, '') || 'Wildridge';
  const titleKey = String(pub.title || pub.slug || 'publication')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 2)
    .join('');
  return `${authorKey}${pub.year || '0000'}${titleKey}`;
}

function localBibTeX(pub) {
  const authors = Array.isArray(pub.authors)
    ? pub.authors
    : typeof pub.authors === 'string'
      ? [pub.authors]
      : ['Andrew J. Wildridge'];
  const identifier = normalizeIdentifier(pub.doi);
  const url = pub.url || identifier.url;
  const lines = [`@article{${citeKeyFor(pub)},`];
  lines.push(`  title = {${sanitizeBibTeX(pub.title || pub.slug)}},`);
  lines.push(`  author = {${authors.map(sanitizeBibTeX).join(' and ')}},`);
  lines.push(`  year = {${pub.year || 'n.d.'}},`);
  if (pub.venue) lines.push(`  journal = {${sanitizeBibTeX(pub.venue)}},`);
  if (identifier.doi) lines.push(`  doi = {${sanitizeBibTeX(identifier.doi)}},`);
  if (identifier.eprint) {
    lines.push(`  eprint = {${sanitizeBibTeX(identifier.eprint)}},`);
    lines.push(`  archivePrefix = {${identifier.archivePrefix}},`);
  }
  if (url) lines.push(`  url = {${sanitizeBibTeX(url)}},`);
  lines.push('}');
  return `${lines.join('\n')}\n`;
}

async function main() {
  console.log('🔎 Reading publications...');
  const pubs = await readPublications();
  console.log(`• Found ${pubs.length} publication files`);

  const entries = [];
  let fetchedCount = 0;
  let fallbackCount = 0;
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
        fetchedCount++;
        console.log(`✓ ${slug}: fetched via ${tried[tried.length - 1]}`);
      } else {
        entries.push(localBibTeX(pub));
        fallbackCount++;
        console.warn(
          `⚠️  ${slug}: no BibTeX found (tried ${tried.join(', ')}); used local frontmatter fallback`,
        );
      }
    } catch (err) {
      entries.push(localBibTeX(pub));
      fallbackCount++;
      console.warn(
        `⚠️  ${slug}: error during fetch (${tried.join(', ')}); used local frontmatter fallback:`,
        err.message,
      );
    }
  }

  const combined = entries.join('\n');
  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
  await fs.writeFile(OUT_FILE, combined, 'utf8');

  console.log(
    `\n📝 Wrote ${entries.length} BibTeX ${entries.length === 1 ? 'entry' : 'entries'} to ${path.relative(ROOT, OUT_FILE)}`,
  );
  console.log(`✓ ${fetchedCount} fetched, ${fallbackCount} generated from local frontmatter`);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  // Do not hard fail builds if this is used in CI; exit non-zero for local visibility
  process.exit(1);
});
