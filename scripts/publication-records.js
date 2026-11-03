import { parse } from 'parse5';
import { setTimeout } from 'node:timers/promises';

export const normalizeText = (value) => value.replace(/\s+/g, ' ').trim();
const attr = (node, name) => node.attrs?.find((item) => item.name === name)?.value;
function nodes(node) {
  return [node, ...(node.childNodes || []).flatMap(nodes)];
}
function text(node) {
  return node.nodeName === '#text' ? node.value : (node.childNodes || []).map(text).join('');
}

export function parseArxiv(html, id) {
  if (!/^\d{4}\.\d{4,5}$/.test(id)) throw new Error('Invalid arXiv identifier');
  const all = nodes(parse(html));
  const meta = (name) =>
    all
      .filter((node) => node.tagName === 'meta' && attr(node, 'name') === name)
      .map((node) => attr(node, 'content'));
  const withClass = (name) => all.find((node) => attr(node, 'class')?.split(/\s+/).includes(name));
  if (meta('citation_arxiv_id')[0] !== id)
    throw new Error(`Wrong or unavailable arXiv record: ${id}`);
  const title = meta('citation_title')[0];
  const abstractNode = withClass('abstract');
  const abstract =
    abstractNode && normalizeText(text(abstractNode).replace(/^\s*Abstract:\s*/, ''));
  const authorsNode = withClass('authors');
  const authors =
    authorsNode &&
    nodes(authorsNode)
      .filter((node) => node.tagName === 'a')
      .map((node) => normalizeText(text(node)));
  const date = meta('citation_date')[0]?.replaceAll('/', '-');
  const history = withClass('submission-history');
  const versions = history
    ? [...text(history).matchAll(/\[v(\d+)\]/g)].map((m) => Number(m[1]))
    : [];
  const version = Math.max(0, ...versions);
  const dateline = withClass('dateline');
  const revised = dateline && text(dateline).match(/last revised\s+(\d+ \w+ \d{4})/i)?.[1];
  const updated = revised ? new Date(`${revised} 00:00:00 UTC`).toISOString().slice(0, 10) : date;
  const journalRow = all.find(
    (node) => node.tagName === 'tr' && /^Journal\s+reference:/i.test(normalizeText(text(node))),
  );
  const journal =
    journalRow &&
    nodes(journalRow).find((node) => attr(node, 'class')?.split(/\s+/).includes('jref'));
  const journalRef = journal ? normalizeText(text(journal)) : '';
  const doiNode = withClass('doi');
  const doiLink = doiNode && nodes(doiNode).find((node) => node.tagName === 'a');
  const doi =
    meta('citation_doi')[0] ||
    (doiLink && attr(doiLink, 'href')?.replace(/^https?:\/\/(?:dx\.)?doi.org\//, '')) ||
    `10.48550/arXiv.${id}`;
  if (
    !title ||
    !abstract ||
    abstract.length < 80 ||
    !authors?.length ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date || '') ||
    !version
  ) {
    throw new Error(`Incomplete official arXiv metadata: ${id}`);
  }
  return {
    title: normalizeText(title),
    authors,
    date,
    year: Number(date.slice(0, 4)),
    venue: journalRef || `arXiv:${id}`,
    doi,
    url: `https://arxiv.org/abs/${id}`,
    abstract,
    version: `v${version}`,
    updated,
    versionUrl: `https://arxiv.org/abs/${id}v${version}`,
  };
}

export function parseCds(json, id, officialDate) {
  const record = json.find?.((item) => String(item.recid) === id);
  if (!record) throw new Error(`Wrong or unavailable CERN CDS record: ${id}`);
  const title = record.title?.title;
  const abstract = record.abstract?.summary;
  const people = (record.authors || []).map((author) => author.full_name).filter(Boolean);
  const collaborations = (record.corporate_name || [])
    .map((author) => author.collaboration)
    .filter(Boolean);
  const authors = collaborations.length ? collaborations : people;
  const dateText = record.prepublication?.date || officialDate;
  const timestamp =
    dateText &&
    Date.parse(
      /^\d{4}-\d{2}-\d{2}$/.test(dateText) ? `${dateText}T00:00:00Z` : `${dateText} 00:00:00 UTC`,
    );
  if (
    !title ||
    !abstract ||
    abstract.length < 80 ||
    !authors.length ||
    !timestamp ||
    !record.version_id ||
    !record.primary_report_number
  ) {
    throw new Error(`Incomplete official CERN CDS metadata: ${id}`);
  }
  const date = new Date(timestamp).toISOString().slice(0, 10);
  const files = (record.files || [])
    .filter((file) => file.type === 'Main' || !file.type)
    .map((file) => ({
      name: file.full_name,
      version: file.version,
      size: file.size,
      url: file.url.replace(/^http:/, 'https:'),
    }));
  return {
    title: normalizeText(title),
    authors,
    abstract: normalizeText(abstract),
    date,
    year: Number(date.slice(0, 4)),
    venue: record.primary_report_number,
    url: `https://cds.cern.ch/record/${id}`,
    version: `CDS record ${record.version_id}`,
    updated: record.version_id.slice(0, 10),
    recordModified: record.version_id,
    files,
  };
}

export async function fetchCdsJson(id) {
  if (!/^\d+$/.test(id)) throw new Error('Invalid CERN CDS identifier');
  const url = `https://cds.cern.ch/record/${id}?of=recjson`;
  const body = await fetchText(url);
  if (body.trimStart().startsWith('[')) return JSON.parse(body);
  // Some CERN networks receive a JavaScript browser check before public exports.
  // Open the normal public page, let it load, and reuse that browser session.
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`https://cds.cern.ch/record/${id}`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
    await page.waitForFunction(
      () => document.title.includes('CERN Document Server'),
      {},
      { timeout: 60000 },
    );
    const response = await page.request.get(url, { timeout: 30000 });
    if (!response.ok()) throw new Error(`CERN CDS HTTP ${response.status()}`);
    return await response.json();
  } finally {
    await browser.close();
  }
}

export function parseCmsDate(html, report) {
  const all = nodes(parse(html));
  const title = normalizeText(text(all.find((node) => node.tagName === 'title') || {}));
  if (title !== report) throw new Error(`Wrong or unavailable CMS result: ${report}`);
  const date = all
    .filter((node) => attr(node, 'class') === 'dateline')
    .map((node) => normalizeText(text(node)))
    .find((value) => /^\d{4}-\d{2}-\d{2}$/.test(value));
  if (!date) throw new Error(`Missing official CMS release date: ${report}`);
  return date;
}

export async function fetchCds(id, dateSource) {
  const json = await fetchCdsJson(id);
  const officialDate = dateSource
    ? parseCmsDate(await fetchText(dateSource), json[0]?.primary_report_number)
    : undefined;
  return parseCds(json, id, officialDate);
}

export async function fetchText(url, fetcher = fetch) {
  let failure;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetcher(url, {
        headers: {
          'User-Agent': 'QuarksAndQubits-PublicationCheck/1.0 (mailto:anwildri@fnal.gov)',
        },
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      failure = error;
      if (attempt < 2) await setTimeout(3000 * (attempt + 1));
    }
  }
  throw new Error(`Cannot verify ${url}: ${failure.message}`);
}

export function changedFields(previous, latest) {
  const fields = [
    'title',
    'authors',
    'date',
    'year',
    'venue',
    'doi',
    'url',
    'abstract',
    'version',
    'updated',
    'versionUrl',
    'recordModified',
    'files',
  ];
  return fields.filter((key) => JSON.stringify(previous[key]) !== JSON.stringify(latest[key]));
}
