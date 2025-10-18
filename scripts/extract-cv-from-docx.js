#!/usr/bin/env node
import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOCX_PATH = path.join(__dirname, '../src/data/Andrew_Wildridge_CV.docx');
const JSON_PATH = path.join(__dirname, '../src/data/cv.json');

async function extractTextFromDocx() {
  const result = await mammoth.extractRawText({ path: DOCX_PATH });
  return result.value;
}

async function parseCV(text) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Load existing to preserve manual sections
  let existingCV = {};
  try {
    const data = await fs.readFile(JSON_PATH, 'utf-8');
    existingCV = JSON.parse(data);
  } catch {
    // File doesn't exist, use empty object
  }

  const cv = {
    name: '',
    title: '',
    email: '',
    website: '',
    location: '',
    summary: '',
    education: [],
    experience: [],
    publications: [],
    talks: [],
    skills: existingCV.skills || {},
    awards: existingCV.awards || [],
    teaching: existingCV.teaching || [],
    service: existingCV.service || [],
    languages: existingCV.languages || [],
  };

  // Extract basic info from first few lines
  if (lines.length > 0) cv.name = lines[0];
  if (lines.length > 1 && !lines[1].includes('@') && !lines[1].match(/address|phone|email/i)) {
    cv.title = lines[1];
  }

  // Find email
  for (const line of lines) {
    if (line.toLowerCase().includes('e-mail') || line.includes('@')) {
      const m = line.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (m) {
        cv.email = m[0];
        break;
      }
    }
  }

  // Find publications section
  const pubStart = lines.findIndex((l) => l.match(/^publications$/i));
  const talksStart = lines.findIndex((l) => l.match(/^talks$/i));
  const postersStart = lines.findIndex((l) => l.match(/^posters$/i));

  // Parse publications
  if (pubStart >= 0) {
    const pubEnd = talksStart >= 0 ? talksStart : postersStart >= 0 ? postersStart : lines.length;
    for (let i = pubStart + 1; i < pubEnd; i++) {
      const line = lines[i];
      if (line.length < 30) continue;
      if (line.match(/^(organizer|panelist|session chair)/i)) continue;

      const pub = {
        title: '',
        authors: [],
        venue: '',
        year: 0,
        doi: '',
        url: '',
        abstract: '',
        citations: 0,
      };

      // Extract URLs
      const urlMatch = line.match(/https?:\/\/[^\s,]+/);
      if (urlMatch) pub.url = urlMatch[0];

      // Extract DOI
      const doiMatch = line.match(/doi:\s*(10\.\d+\/[^\s,]+)|arXiv:(\d+\.\d+)/);
      if (doiMatch) pub.doi = doiMatch[0];

      // Extract arXiv
      const arxivMatch = line.match(/arXiv:(\d+\.\d+)/);
      if (arxivMatch && !pub.url) pub.url = `https://arxiv.org/abs/${arxivMatch[1]}`;

      // Extract year
      const yearMatch = line.match(/\b(20\d{2})\b/);
      if (yearMatch) pub.year = parseInt(yearMatch[1]);

      // Extract title (text in quotes or after "Collaboration.")
      let titleMatch = line.match(/[""]([^"""]+)[""]/) || line.match(/"([^"]+)"/);
      if (titleMatch) {
        pub.title = titleMatch[1].trim();
      } else {
        // Try after "Collaboration."
        const collabIdx = line.indexOf('Collaboration.');
        if (collabIdx > 0) {
          const afterCollab = line
            .substring(collabIdx + 14)
            .split(/\.|,/)[0]
            .trim();
          pub.title = afterCollab;
        } else {
          // Take longest segment
          const segments = line.split(/\.\s+/);
          pub.title = segments.sort((a, b) => b.length - a.length)[0].trim();
        }
      }

      // Extract authors (text before title or before first period)
      if (line.includes('Collaboration')) {
        pub.authors = [line.split('.')[0].trim()];
      } else {
        const titleIdx = pub.title ? line.indexOf(pub.title) : -1;
        if (titleIdx > 10) {
          const authorText = line.substring(0, titleIdx).trim();
          pub.authors = authorText
            .split(/,\s*(?:and\s+)?|;\s*|\set\.?\s*al\.?/)
            .map((a) => a.trim().replace(/\.$/, ''))
            .filter((a) => a.length > 0 && a.length < 50);
        }
      }

      // Extract venue (between title and year/doi)
      if (pub.title && pub.year) {
        const afterTitle = line.substring(line.indexOf(pub.title) + pub.title.length);
        const yearIdx = afterTitle.indexOf(String(pub.year));
        if (yearIdx > 0) {
          pub.venue = afterTitle
            .substring(0, yearIdx)
            .replace(/^[,.\s]+|[,.\s]+$/g, '')
            .trim();
        }
      }

      if (pub.title && pub.title.length > 10) {
        cv.publications.push(pub);
      }
    }
  }

  // Parse talks
  if (talksStart >= 0) {
    const talksEnd = postersStart >= 0 ? postersStart : lines.length;
    for (let i = talksStart + 1; i < talksEnd; i++) {
      const line = lines[i];
      if (line.length < 20) continue;

      const talk = {
        title: '',
        event: '',
        venue: '',
        location: '',
        date: '',
        year: 0,
        month: 0,
        slides: '',
        video: '',
        abstract: '',
      };

      // Extract year
      const yearMatch = line.match(/\b(20\d{2})\b/);
      if (yearMatch) talk.year = parseInt(yearMatch[1]);

      // Extract title in quotes
      const titleMatch = line.match(/[""]([^"""]+)[""]/) || line.match(/"([^"]+)"/);
      if (titleMatch) {
        talk.title = titleMatch[1].trim();
      } else {
        talk.title = line.split(',')[0].trim();
      }

      // Extract event/conference (text after title, before year)
      if (talk.title) {
        const afterTitle = line.substring(line.indexOf(talk.title) + talk.title.length);
        const parts = afterTitle
          .split(',')
          .map((p) => p.trim())
          .filter((p) => p && !p.match(/^\d{4}$/));
        if (parts.length > 0) {
          talk.event = parts[0].replace(/["",.\s]+$/, '').trim();
        }
      }

      if (talk.title.length > 5) {
        cv.talks.push(talk);
      }
    }
  }

  return cv;
}

async function main() {
  console.log('📄 Extracting CV from DOCX...');

  try {
    await fs.access(DOCX_PATH);
  } catch {
    console.log('❌ DOCX file not found');
    return;
  }

  const text = await extractTextFromDocx();
  console.log(`✓ Extracted ${text.length} characters`);

  const cvData = await parseCV(text);
  console.log(`✓ Parsed:`);
  console.log(`   - Name: ${cvData.name}`);
  console.log(`   - Email: ${cvData.email}`);
  console.log(`   - Publications: ${cvData.publications.length}`);
  console.log(`   - Talks: ${cvData.talks.length}`);

  await fs.writeFile(JSON_PATH, JSON.stringify(cvData, null, 2));
  console.log(`✓ Wrote to ${JSON_PATH}`);
  console.log('✅ Done!');
}

main().catch(console.error);
