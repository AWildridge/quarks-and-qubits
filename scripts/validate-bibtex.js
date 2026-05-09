#!/usr/bin/env node
/**
 * Validate the generated bibliography used by the site.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const BIB_FILE = path.join(ROOT, 'public', 'bibliography.bib');
const PUB_DIR = path.join(ROOT, 'src', 'content', 'publications');

function validateBibTeX(bibtex) {
  const errors = [];
  const starts = [...bibtex.matchAll(/^@\w+\{[^,]+,/gm)].map((match) => match.index || 0);
  const entries = starts.map((start, index) => {
    const end = index + 1 < starts.length ? starts[index + 1] : bibtex.length;
    return bibtex.slice(start, end).trim();
  });

  if (entries.length === 0) {
    errors.push('No valid BibTeX entries found');
  }
  if (bibtex.trimStart() && !bibtex.trimStart().startsWith('@')) {
    errors.push('Bibliography contains non-BibTeX content before the first entry');
  }

  entries.forEach((entry, idx) => {
    if (!/title\s*=/.test(entry)) errors.push(`Entry ${idx + 1}: missing title field`);
    if (!/author\s*=/.test(entry)) errors.push(`Entry ${idx + 1}: missing author field`);
    if (!/year\s*=/.test(entry)) errors.push(`Entry ${idx + 1}: missing year field`);

    if (!entry.endsWith('}')) errors.push(`Entry ${idx + 1}: does not end with a closing brace`);
  });

  return { entries, errors };
}

async function publicationCount() {
  const files = await fs.readdir(PUB_DIR);
  let count = 0;
  for (const file of files.filter((name) => name.endsWith('.mdx'))) {
    const raw = await fs.readFile(path.join(PUB_DIR, file), 'utf8');
    if (!/^draft:\s*true\s*$/m.test(raw)) count++;
  }
  return count;
}

async function main() {
  const [bibtex, expectedCount] = await Promise.all([
    fs.readFile(BIB_FILE, 'utf8'),
    publicationCount(),
  ]);
  const { entries, errors } = validateBibTeX(bibtex);

  if (entries.length !== expectedCount) {
    errors.push(
      `Expected ${expectedCount} bibliography entries from publication content, found ${entries.length}`,
    );
  }

  if (errors.length > 0) {
    console.error('BibTeX validation failed:');
    errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  console.log(`BibTeX validation passed: ${entries.length} entries`);
}

main().catch((error) => {
  console.error('BibTeX validation failed:', error.message);
  process.exit(1);
});
