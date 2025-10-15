/**
 * BibTeX export utilities for publications
 */

export interface PublicationRecord {
  slug: string;
  title: string;
  authors: string[];
  year: number;
  venue?: string;
  doi?: string;
  url?: string;
  tags: string[];
}

/**
 * Sanitize a string for BibTeX (escape special characters)
 */
function sanitizeBibTeX(str: string): string {
  return str.replace(/[%$#_]/g, (match) => `\\${match}`);
}

/**
 * Generate a BibTeX citation key from publication data
 */
export function generateCiteKey(pub: PublicationRecord): string {
  const firstAuthor = pub.authors[0]?.split(' ').pop() || 'Unknown';
  const year = pub.year;
  const titleWords = pub.title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 2);

  return `${firstAuthor}${year}${titleWords.join('')}`;
}

/**
 * Convert a publication record to BibTeX format
 */
export function toBibTeX(pub: PublicationRecord): string {
  const citeKey = generateCiteKey(pub);
  const lines: string[] = [`@article{${citeKey},`];

  // Required fields
  lines.push(`  title = {${sanitizeBibTeX(pub.title)}},`);
  lines.push(`  author = {${pub.authors.map(sanitizeBibTeX).join(' and ')}},`);
  lines.push(`  year = {${pub.year}},`);

  // Optional fields
  if (pub.venue) {
    lines.push(`  journal = {${sanitizeBibTeX(pub.venue)}},`);
  }
  if (pub.doi) {
    lines.push(`  doi = {${pub.doi}},`);
  }
  if (pub.url) {
    lines.push(`  url = {${pub.url}},`);
  }

  lines.push('}');
  return lines.join('\n');
}

/**
 * Export multiple publications to a single BibTeX file
 */
export function exportBibTeX(publications: PublicationRecord[]): string {
  const entries = publications.map(toBibTeX);
  return entries.join('\n\n') + '\n';
}

/**
 * Validate BibTeX format (basic check)
 */
export function validateBibTeX(bibtex: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for basic structure
  const entryPattern = /@\w+\{[^,]+,[\s\S]*?\n\}/g;
  const entries = bibtex.match(entryPattern) || [];

  if (entries.length === 0) {
    errors.push('No valid BibTeX entries found');
  }

  // Check for required fields
  entries.forEach((entry, idx) => {
    if (!/title\s*=/.test(entry)) {
      errors.push(`Entry ${idx + 1}: Missing title field`);
    }
    if (!/author\s*=/.test(entry)) {
      errors.push(`Entry ${idx + 1}: Missing author field`);
    }
    if (!/year\s*=/.test(entry)) {
      errors.push(`Entry ${idx + 1}: Missing year field`);
    }

    // Check for balanced braces
    const openBraces = (entry.match(/\{/g) || []).length;
    const closeBraces = (entry.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push(`Entry ${idx + 1}: Unbalanced braces`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
