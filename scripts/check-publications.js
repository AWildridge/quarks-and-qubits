import { readFileSync, readdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout } from 'node:timers/promises';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { format } from 'prettier';
import { changedFields, fetchText, parseArxiv, fetchCds } from './publication-records.js';

const sourcePath = 'src/data/publication-sources.json';
const directory = 'src/content/publications';
const metadataFields = ['title', 'authors', 'year', 'date', 'venue', 'doi', 'url'];

export function readPublications() {
  return readdirSync(directory)
    .filter((file) => file.endsWith('.mdx'))
    .sort()
    .map((file) => {
      const raw = readFileSync(`${directory}/${file}`, 'utf8');
      const match = /^---\r?\n([\s\S]*?)\r?\n---\s*([\s\S]*)$/.exec(raw);
      if (!match) throw new Error(`Missing publication frontmatter: ${file}`);
      return { file, slug: file.slice(0, -4), data: parseYaml(match[1]), body: match[2].trim() };
    })
    .filter((entry) => !entry.data.draft);
}

export function citationFor(data, source) {
  const type = data.citationType || 'article';
  const safe = (value) => String(value).replace(/(?<!\\)[%#&]/g, '\\$&');
  const fields = {
    title: source.title,
    author: source.authors
      .map((name) => (/Collaboration/.test(name) ? `{${name}}` : name))
      .join(' and '),
    year: source.year,
    ...(type === 'techreport' && source.source.kind === 'cds'
      ? { institution: 'CERN', number: source.venue }
      : { [type === 'inproceedings' ? 'booktitle' : 'journal']: source.venue }),
    ...(source.doi && { doi: source.doi }),
    url: source.versionUrl || source.url,
    ...(source.source.kind === 'arxiv' && { eprint: source.source.id, archivePrefix: 'arXiv' }),
  };
  return (
    `@${type}{${data.bibtexKey},\n` +
    Object.entries(fields)
      .map(([key, value]) => `  ${key} = {${safe(value)}},`)
      .join('\n') +
    '\n}'
  );
}

export function checkLocal(entries, sources) {
  const errors = [];
  for (const entry of entries) {
    const source = sources[entry.slug];
    if (!source?.abstract || !source.source || !source.url) {
      errors.push(`${entry.file}: missing official publication source/abstract`);
      continue;
    }
    if (entry.body)
      errors.push(
        `${entry.file}: abstracts must come from the official source cache, not an MDX paraphrase`,
      );
    for (const field of metadataFields) {
      if (JSON.stringify(entry.data[field]) !== JSON.stringify(source[field]))
        errors.push(`${entry.file}: ${field} differs from the official source`);
    }
  }
  return errors;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const refresh = process.argv.includes('--refresh');
  const publishing = JSON.parse(readFileSync('deployment/config.json', 'utf8')).mode === 'full';
  const remote =
    refresh ||
    process.argv.includes('--remote') ||
    (publishing && process.argv.includes('--before-publish'));
  const sources = JSON.parse(readFileSync(sourcePath, 'utf8'));
  const entries = readPublications();
  const findings = [];
  const failures = [];
  const changes = [];
  if (remote) {
    for (const entry of entries) {
      const previous = sources[entry.slug];
      try {
        if (!previous) throw new Error('No source registered for this publication');
        const source = previous.source;
        let latest;
        if (source.kind === 'arxiv') {
          latest = parseArxiv(await fetchText(`https://arxiv.org/abs/${source.id}`), source.id);
        } else if (source.kind === 'cds') {
          latest = await fetchCds(source.id, source.dateSource);
        } else throw new Error(`Unsupported official source: ${source.kind}`);
        const fields = changedFields(previous, latest);
        if (fields.length) {
          changes.push(
            `${entry.slug}: changed ${fields.join(', ')} (${previous.version || 'saved record'} → ${latest.version || 'current record'})`,
          );
          sources[entry.slug] = { source, ...latest };
        } else findings.push(`${entry.slug}: matches ${latest.version || 'official record'}`);
      } catch (error) {
        failures.push(`${entry.slug}: verification unavailable — ${error.message}`);
      }
      await setTimeout(3100);
    }
    // A failed or partial fetch must never replace a reviewed source snapshot.
    if (refresh && !failures.length) {
      writeFileSync(sourcePath, await format(JSON.stringify(sources), { parser: 'json' }));
    }
  }
  if (apply && (!refresh || !failures.length)) {
    for (const entry of entries) {
      const source = sources[entry.slug];
      if (!source) throw new Error(`Missing official source for ${entry.slug}`);
      for (const field of metadataFields) {
        if (source[field] === undefined) delete entry.data[field];
        else entry.data[field] = source[field];
      }
      entry.body = '';
      const mdx = `---\n${stringifyYaml(entry.data)}---\n`;
      writeFileSync(
        `${directory}/${entry.file}`,
        await format(mdx, { parser: 'mdx', printWidth: 100, singleQuote: true }),
      );
    }
    const cv = JSON.parse(readFileSync('src/data/cv.json', 'utf8'));
    cv.publications = entries.map((entry) => ({ ...entry.data }));
    writeFileSync('src/data/cv.json', JSON.stringify(cv, null, 2) + '\n');
    writeFileSync(
      'public/bibliography.bib',
      entries.map((entry) => citationFor(entry.data, sources[entry.slug])).join('\n\n') + '\n',
    );
  }
  const saved = JSON.parse(readFileSync(sourcePath, 'utf8'));
  const localErrors = checkLocal(readPublications(), saved);
  const bibliography =
    entries
      .map((entry) => saved[entry.slug] && citationFor(entry.data, saved[entry.slug]))
      .join('\n\n') + '\n';
  if (readFileSync('public/bibliography.bib', 'utf8') !== bibliography)
    localErrors.push('BibTeX differs from official source snapshots; run pnpm publications:apply');
  const report = [
    ...findings,
    ...changes.map((line) => `CHANGED: ${line}`),
    ...failures.map((line) => `UNVERIFIED: ${line}`),
    ...localErrors.map((line) => `ERROR: ${line}`),
  ];
  report.push(
    `Checked ${entries.length} publications (${remote ? 'live sources and local consistency' : 'local consistency'}).`,
  );
  const output = report.join('\n') + '\n';
  console.log(output);
  if (remote) writeFileSync('publication-check.txt', output);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      '### Publication source check\n\n```text\n' + output + '```\n',
    );
  if (localErrors.length || failures.length || (changes.length && !refresh)) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  await main();
