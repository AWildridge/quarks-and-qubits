/**
 * BibTeX export utilities for publications
 */

export interface PublicationRecord {
  slug: string;
  title: string;
  authors: string[];
  year: number;
  date?: Date | string;
  venue?: string;
  doi?: string;
  url?: string;
  tags: string[];
  bibtexKey?: string;
  bibtex?: string;
}

export function formatAuthors(authors: string[], limit = 8): string {
  return authors.length > limit ? `${authors.slice(0, 3).join(', ')}, et al.` : authors.join(', ');
}

export function publicationDateValue(pub: { year: number; date?: Date | string }): number {
  if (pub.date) {
    const date = pub.date instanceof Date ? pub.date : new Date(pub.date);
    const value = date.valueOf();
    if (!Number.isNaN(value)) return value;
  }

  return new Date(pub.year, 0, 1).valueOf();
}

export function sortPublicationsByDate<T extends { data: { year: number; date?: Date | string } }>(
  publications: T[],
): T[] {
  return publications.sort(
    (a, b) =>
      publicationDateValue({ year: b.data.year, date: b.data.date }) -
      publicationDateValue({ year: a.data.year, date: a.data.date }),
  );
}

export function parseBibTeXEntries(bibliography: string): Map<string, string> {
  const entries = new Map<string, string>();
  const starts = [...bibliography.matchAll(/^@\w+\{([^,]+),/gm)];

  starts.forEach((match, index) => {
    const start = match.index || 0;
    const end =
      index + 1 < starts.length
        ? starts[index + 1].index || bibliography.length
        : bibliography.length;
    entries.set(match[1], bibliography.slice(start, end).trim());
  });

  return entries;
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
  if (pub.bibtex) return pub.bibtex;

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
