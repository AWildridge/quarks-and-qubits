#!/usr/bin/env node
/**
 * Validate BibTeX exports from publications
 */

// Simple inline BibTeX validation and export functions
function sanitizeBibTeX(str) {
  return str.replace(/[%$#_]/g, (match) => `\\${match}`);
}

function toBibTeX(pub) {
  const firstAuthor = pub.authors[0]?.split(' ').pop() || 'Unknown';
  const citeKey = `${firstAuthor}${pub.year}`;
  const lines = [`@article{${citeKey},`];

  lines.push(`  title = {${sanitizeBibTeX(pub.title)}},`);
  lines.push(`  author = {${pub.authors.map(sanitizeBibTeX).join(' and ')}},`);
  lines.push(`  year = {${pub.year}},`);

  if (pub.venue) {
    lines.push(`  journal = {${sanitizeBibTeX(pub.venue)}},`);
  }
  if (pub.doi) {
    lines.push(`  doi = {${pub.doi}},`);
  }

  lines.push('}');
  return lines.join('\n');
}

function exportBibTeX(publications) {
  return publications.map(toBibTeX).join('\n\n') + '\n';
}

function validateBibTeX(bibtex) {
  const errors = [];
  const entryPattern = /@\w+\{[^,]+,[\s\S]*?\n\}/g;
  const entries = bibtex.match(entryPattern) || [];

  if (entries.length === 0) {
    errors.push('No valid BibTeX entries found');
  }

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

    const openBraces = (entry.match(/\{/g) || []).length;
    const closeBraces = (entry.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push(`Entry ${idx + 1}: Unbalanced braces (${openBraces} open, ${closeBraces} close)`);
    }
  });

  return { valid: errors.length === 0, errors };
}

// Test with sample data
const testPubs = [
  {
    slug: 'test1',
    title: 'Measurement of Top Quark Spin Correlations',
    authors: ['A. Wildridge', 'B. Physicist'],
    year: 2024,
    venue: 'JHEP',
    doi: '10.1234/jhep.2024.123',
  },
  {
    slug: 'test2',
    title: 'Quantum Algorithms for Lattice Problems',
    authors: ['A. Wildridge', 'C. Researcher'],
    year: 2023,
    venue: 'Physical Review Letters',
    doi: '10.1103/PhysRevLett.123.456789',
  },
];

const bibtex = exportBibTeX(testPubs);
const result = validateBibTeX(bibtex);

if (!result.valid) {
  console.error('❌ BibTeX validation failed:');
  result.errors.forEach((err) => console.error(`  - ${err}`));
  process.exit(1);
}

console.log('✅ BibTeX validation passed');
console.log('\nGenerated BibTeX:');
console.log('─'.repeat(60));
console.log(bibtex);
console.log('─'.repeat(60));
console.log(`\n✓ ${testPubs.length} entries validated successfully`);
