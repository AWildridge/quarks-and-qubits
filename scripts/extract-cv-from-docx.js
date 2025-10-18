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
    posters: [],
    professionalDevelopment: [],
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

  // Helpers for de-duplication
  const seenTalks = new Set();
  const addTalk = (t) => {
    const norm = (s) =>
      (s || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
    // Use title + year only to avoid duplicates across venues/listings
    const key = `${norm(t.title || t.event)}|${t.year || ''}`;
    if (!seenTalks.has(key)) {
      seenTalks.add(key);
      cv.talks.push(t);
    }
  };

  // Parse publications
  if (pubStart >= 0) {
    const pubEnd = talksStart >= 0 ? talksStart : postersStart >= 0 ? postersStart : lines.length;
    for (let i = pubStart + 1; i < pubEnd; i++) {
      const line = lines[i];
      if (line.length < 30) continue;

      // Skip header lines
      if (line.match(/for professional conferences\/events/i)) continue;

      // Check if this is an organizer/panelist entry
      const isOrganizer = line.match(/^organizer[,:\s]/i);
      const isPanelist = line.match(/^panelist[,:\s]/i);
      const isSessionChair = line.match(/^session chair[,:\s]/i);

      if (isOrganizer || isSessionChair) {
        // Extract as professional development
        const profDev = {
          role: isOrganizer ? 'Organizer' : 'Session Chair',
          event: '',
          year: 0,
          description: '',
          url: '',
        };

        // Extract year
        const yearMatch = line.match(/\b(20\d{2})\b/);
        if (yearMatch) profDev.year = parseInt(yearMatch[1]);

        // Extract URL
        const urlMatch = line.match(/https?:\/\/[^\s,]+/);
        if (urlMatch) profDev.url = urlMatch[0];

        // Extract event name (text after first comma/colon, before year)
        const afterRole = line.substring(line.indexOf(',') + 1).trim();
        const parts = afterRole.split(',').map((p) => p.trim());
        if (parts.length > 0) {
          profDev.event = parts[0];
        }
        profDev.description = line;

        cv.professionalDevelopment.push(profDev);
        continue;
      }

      if (isPanelist) {
        // Extract as talk
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
          tags: ['panel'],
        };

        // Extract year
        const yearMatch = line.match(/\b(20\d{2})\b/);
        if (yearMatch) talk.year = parseInt(yearMatch[1]);

        // Extract URL
        const urlMatch = line.match(/https?:\/\/[^\s,]+/);
        if (urlMatch) talk.slides = urlMatch[0];

        // Extract title in quotes (supports straight and smart quotes)
        const titleMatch = line.match(/["”“]([^"”“]+)["”“]/) || line.match(/"([^"]+)"/);
        if (titleMatch) {
          talk.title = titleMatch[1].trim();
        } else {
          talk.title = 'Panel Discussion';
        }

        // Extract event/conference (text after first comma)
        const afterPanelist = line.substring(line.indexOf(',') + 1).trim();
        const parts = afterPanelist
          .split(',')
          .map((p) => p.trim())
          .filter((p) => p && !p.match(/^\d{4}$/));
        if (parts.length > 0) {
          talk.event = parts[0].replace(/[""].*[""]/, '').trim();
          if (parts.length > 1) {
            talk.venue = parts[1];
          }
        }

        if (talk.year > 0) {
          if (process.env.DEBUG_TALKS === '1') {
            console.log(`[debug] panelist->talk: ${talk.year} | ${talk.title} | ${talk.event}`);
          }
          addTalk(talk);
        }
        continue;
      }

      // Regular publication

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

      // Extract title in quotes (supports straight and smart quotes)
      const titleMatch = line.match(/["”“]([^"”“]+)["”“]/) || line.match(/"([^"]+)"/);
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

      if (talk.title.length > 5 && talk.year > 0) {
        if (process.env.DEBUG_TALKS === '1') {
          console.log(`[debug] talk: ${talk.year} | ${talk.title} | ${talk.event}`);
        }
        addTalk(talk);
      } else if (process.env.DEBUG_TALKS === '1') {
        console.log(`[debug] skipped talk line: ${line}`);
      }
    }
  }

  // Parse posters
  if (postersStart >= 0) {
    const postersEnd = lines.length;
    for (let i = postersStart + 1; i < postersEnd; i++) {
      const line = lines[i];
      if (line.length < 15) continue;

      const poster = {
        title: '',
        event: '',
        venue: '',
        location: '',
        date: '',
        year: 0,
        month: 0,
        link: '',
        tags: ['poster'],
      };

      // Extract URL/link if present
      const urlMatch = line.match(/https?:\/\/[^\s,]+/);
      if (urlMatch) poster.link = urlMatch[0];

      // Extract year
      const yearMatch = line.match(/\b(20\d{2})\b/);
      if (yearMatch) poster.year = parseInt(yearMatch[1]);

      // Extract title in quotes or before first comma
      const titleMatch = line.match(/["”]([^"”]+)["”]/) || line.match(/"([^"]+)"/);
      if (titleMatch) {
        poster.title = titleMatch[1].trim();
      } else {
        poster.title = line.split(',')[0].trim();
      }

      // Extract event (text after title, before year)
      if (poster.title) {
        const afterTitleIdx = line.indexOf(poster.title) + poster.title.length;
        const afterTitle = line.substring(afterTitleIdx);
        const parts = afterTitle
          .split(',')
          .map((p) => p.trim())
          .filter((p) => p && !p.match(/^\d{4}$/));
        if (parts.length > 0) {
          poster.event = parts[0].replace(/["",.\s]+$/, '').trim();
          if (parts.length > 1) poster.venue = parts[1];
        }
      }

      if (poster.title && poster.title.length > 3) {
        cv.posters.push(poster);
      }
    }
  }

  // Remove talks that duplicate posters (same title+year)
  if (cv.posters.length > 0 && cv.talks.length > 0) {
    const norm = (s) =>
      (s || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
    const posterKeys = new Set(
      cv.posters.map((p) => `${norm(p.title || p.event)}|${p.year || ''}`),
    );
    cv.talks = cv.talks.filter(
      (t) => !posterKeys.has(`${norm(t.title || t.event)}|${t.year || ''}`),
    );
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
  console.log(`   - Posters: ${cvData.posters.length}`);
  console.log(`   - Professional Development: ${cvData.professionalDevelopment.length}`);

  await fs.writeFile(JSON_PATH, JSON.stringify(cvData, null, 2));
  console.log(`✓ Wrote to ${JSON_PATH}`);
  console.log('✅ Done!');
}

main().catch(console.error);
