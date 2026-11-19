import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  changedFields,
  fetchCds,
  parseArxiv,
  parseCds,
  parseCmsDate,
} from '../scripts/publication-records.js';
import { checkLocal } from '../scripts/check-publications.js';

const abstract =
  'We measure spin-$1/2$ correlations & compare the quantum states of a particle pair. The complete official wording must survive unchanged.';
const arxiv = `<html><head>
  <meta name="citation_arxiv_id" content="2608.30037">
  <meta name="citation_title" content="Quantum states &amp; correlations">
  <meta name="citation_date" content="2026/08/30">
  </head><body>
  <div class="authors"><a>A. Researcher</a><a>B. Scientist</a></div>
  <blockquote class="abstract mathjax"><span class="descriptor">Abstract:</span>${abstract.replace('&', '&amp;')}</blockquote>
  <div class="dateline">Submitted 30 Aug 2026, last revised 1 Nov 2026</div>
  <div class="submission-history">[v1] original [v2] revised</div>
  <table><tr><td>Report number:</td><td class="tablecell jref">REPORT-1</td></tr>
  <tr><td>Journal&nbsp;reference:</td><td class="tablecell jref">Journal 42 (2026)</td></tr></table>
  </body></html>`;

test('official arXiv parsing preserves wording, math, authors, and the correct journal row', () => {
  const record = parseArxiv(arxiv, '2608.30037');
  assert.equal(record.abstract, abstract);
  assert.equal(record.title, 'Quantum states & correlations');
  assert.deepEqual(record.authors, ['A. Researcher', 'B. Scientist']);
  assert.equal(record.venue, 'Journal 42 (2026)');
  assert.equal(record.version, 'v2');
  assert.equal(record.updated, '2026-11-01');
  assert.equal(record.versionUrl, 'https://arxiv.org/abs/2608.30037v2');
});

test('new versions and removed metadata are detected even when the abstract is unchanged', () => {
  const original = parseArxiv(arxiv, '2608.30037');
  const latest = { ...original, version: 'v3' };
  delete latest.doi;
  assert.deepEqual(changedFields(original, latest), ['doi', 'version']);
});

test('wrong records, incomplete responses, and bot challenge HTML cannot replace an abstract', () => {
  assert.throws(() => parseArxiv(arxiv, '2504.00086'), /Wrong or unavailable/);
  assert.throws(
    () => parseArxiv('<html>Making sure you are not a bot</html>', '2608.30037'),
    /Wrong or unavailable/,
  );
  assert.throws(() => parseCds({}, '2944724'), /Wrong or unavailable/);
  assert.throws(
    () => parseArxiv(arxiv.replace('class="abstract mathjax"', ''), '2608.30037'),
    /Incomplete/,
  );
});

test('CERN metadata preserves the abstract, record revision, and file versions', () => {
  const json = [
    {
      recid: 2944724,
      title: { title: 'Official note title' },
      abstract: { summary: abstract },
      corporate_name: [{ collaboration: 'CMS Collaboration' }],
      prepublication: { date: '13 Sep 2025' },
      version_id: '2026-10-14T16:14:12',
      primary_report_number: 'CMS-NOTE-2025-010',
      files: [
        { full_name: 'note.pdf', version: 1, size: 12345, url: 'http://cds.cern.ch/note.pdf' },
      ],
    },
  ];
  const record = parseCds(json, '2944724');
  assert.equal(record.abstract, abstract);
  assert.equal(record.recordModified, '2026-10-14T16:14:12');
  assert.deepEqual(record.authors, ['CMS Collaboration']);
  assert.equal(record.date, '2025-09-13');
  assert.equal(record.files[0].url, 'https://cds.cern.ch/note.pdf');
  assert.ok(
    changedFields(record, { ...record, files: [{ ...record.files[0], version: 2 }] }).includes(
      'files',
    ),
  );
});

const cdsId = '2944724';
const pdfUrl = `https://cds.cern.ch/record/${cdsId}/files/note.pdf`;
const reviewed = {
  recordModified: '2026-10-14T16:14:12',
  files: [{ name: 'note.pdf', size: 1024, url: pdfUrl, version: 2 }],
};
const marc = `<OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/"><GetRecord><record>
  <header><identifier>oai:cds.cern.ch:2944724</identifier></header>
  <metadata><marc:record xmlns:marc="http://www.loc.gov/MARC21/slim">
    <marc:controlfield tag="001">2944724</marc:controlfield>
    <marc:controlfield tag="005">20261014161412.0</marc:controlfield>
    <marc:datafield tag="037"><marc:subfield code="a">CMS-NOTE</marc:subfield></marc:datafield>
    <marc:datafield tag="245"><marc:subfield code="a">Official title</marc:subfield></marc:datafield>
    <marc:datafield tag="520"><marc:subfield code="a">${abstract.replace('&', '&amp;')}</marc:subfield></marc:datafield>
    <marc:datafield tag="710"><marc:subfield code="g">CMS Collaboration</marc:subfield></marc:datafield>
    <marc:datafield tag="856"><marc:subfield code="s">1024</marc:subfield><marc:subfield code="u">${pdfUrl}</marc:subfield></marc:datafield>
  </marc:record></metadata></record></GetRecord></OAI-PMH>`;

test('the public CERN feed verifies the paper when the detailed export returns a webpage', async () => {
  const dateSource = 'https://cms-results.web.cern.ch/result';
  const cms = '<title>CMS-NOTE</title><div class="dateline">2026-10-06</div>';
  const urls = [];
  const read = async (url) => {
    urls.push(url);
    if (url === dateSource) return cms;
    return url.includes('/oai2d?') ? marc : '<html>Browser check</html>';
  };
  const record = await fetchCds(cdsId, dateSource, reviewed, read);
  assert.equal(record.title, 'Official title');
  assert.equal(record.abstract, abstract);
  assert.equal(record.date, '2026-10-06');
  assert.deepEqual(record.authors, ['CMS Collaboration']);
  assert.deepEqual(record.files, [{ name: 'note.pdf', version: 2, size: 1024, url: pdfUrl }]);
  assert.deepEqual(urls, [
    `https://cds.cern.ch/record/${cdsId}?of=recjson`,
    `https://cds.cern.ch/oai2d?verb=GetRecord&identifier=oai:cds.cern.ch:${cdsId}&metadataPrefix=marcxml`,
    dateSource,
  ]);
});

test('unavailable exports cannot validate a different record, revision, or attachment', async () => {
  for (const [response, message] of [
    ['<html>Browser check</html>', /Wrong or unavailable/],
    [marc.replace('oai:cds.cern.ch:2944724', 'oai:cds.cern.ch:42'), /Wrong or unavailable/],
    [marc.replace('<header>', '<header status="deleted">'), /Wrong or unavailable/],
    [marc.replace('20261014161412.0', '20261015161412.0'), /revision .* needs a full JSON export/],
    [marc.replace('>1024<', '>2048<'), /changed attachment/],
    [marc.replace(pdfUrl, pdfUrl.replace('note.pdf', 'other.pdf')), /changed attachment/],
    [marc.replace('tag="856"', 'tag="999"'), /changed attachment list/],
  ]) {
    await assert.rejects(
      fetchCds(cdsId, undefined, reviewed, async (url) =>
        url.includes('/oai2d?') ? response : Promise.reject(new Error('HTTP 503')),
      ),
      message,
    );
  }
});

test('local consistency check rejects paraphrases, changed metadata, and missing sources', () => {
  const source = { source: { kind: 'arxiv' }, ...parseArxiv(arxiv, '2608.30037') };
  const entry = { file: 'paper.mdx', slug: 'paper', data: source, body: '' };
  assert.deepEqual(checkLocal([entry], { paper: source }), []);
  assert.match(
    checkLocal([{ ...entry, body: 'A shorter summary.' }], { paper: source }).join(),
    /paraphrase/,
  );
  assert.match(
    checkLocal([{ ...entry, data: { ...source, title: 'Another title' } }], {
      paper: source,
    }).join(),
    /title differs/,
  );
  assert.match(checkLocal([entry], {}).join(), /missing official/);
});

test('CMS release dates fill missing CDS day/month without inventing a date', () => {
  const html =
    '<title>CMS-PAS-TOP-23-006</title><div class="dateline">CMS Collaboration</div><div class="dateline">2026-10-06</div>';
  assert.equal(parseCmsDate(html, 'CMS-PAS-TOP-23-006'), '2026-10-06');
  assert.throws(() => parseCmsDate(html, 'CMS-PAS-TOP-23-001'), /Wrong or unavailable/);
  assert.throws(
    () => parseCmsDate(html.replace('2026-10-06', '2026'), 'CMS-PAS-TOP-23-006'),
    /Missing official/,
  );
});
