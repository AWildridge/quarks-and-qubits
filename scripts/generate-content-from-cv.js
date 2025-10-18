#!/usr/bin/env node

/**
 * Generate publication and talk MDX files from CV JSON
 *
 * This script reads cv.json and generates MDX files in:
 * - src/content/publications/
 * - src/content/talks/
 *
 * Usage: node scripts/generate-content-from-cv.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CV_JSON_PATH = path.join(__dirname, '../src/data/cv.json');
const PUBLICATIONS_DIR = path.join(__dirname, '../src/content/publications');
const TALKS_DIR = path.join(__dirname, '../src/content/talks');
const PROF_DEV_DIR = path.join(__dirname, '../src/content/professional-development');
const POSTERS_DIR = path.join(__dirname, '../src/content/posters');

/**
 * Convert a title to a slug (filename-safe)
 */
function titleToSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .substring(0, 50); // Limit length
}

/**
 * Extract tags from publication title, venue, and authors
 */
function extractPublicationTags(pub) {
  const tags = new Set();

  const title = pub.title.toLowerCase();
  const venue = (pub.venue || '').toLowerCase();

  // Common physics/ML keywords
  const keywords = [
    'machine learning',
    'ml',
    'neural network',
    'deep learning',
    'quantum',
    'qis',
    'qubit',
    'quantum computing',
    'top quark',
    'top quarks',
    'ttbar',
    'entanglement',
    'spin correlation',
    'hep',
    'particle physics',
    'collider',
    'cms',
    'atlas',
    'lhc',
    'cern',
    'transformer',
    'bert',
    'foundation model',
    'anomaly detection',
    'classification',
    'monte carlo',
    'simulation',
    'jet',
    'vertexing',
    'tracking',
  ];

  keywords.forEach((keyword) => {
    if (title.includes(keyword) || venue.includes(keyword)) {
      tags.add(keyword.replace(/\s+/g, '-'));
    }
  });

  // Add venue-based tags
  if (venue.includes('neurips')) tags.add('neurips');
  if (venue.includes('arxiv')) tags.add('preprint');
  if (venue.includes('phys') || venue.includes('physics')) tags.add('hep-ph');
  if (venue.includes('cms')) tags.add('cms');

  return Array.from(tags).slice(0, 8); // Limit to 8 tags
}

/**
 * Generate a publication MDX file
 */
function generatePublicationMDX(pub, index) {
  const slug = titleToSlug(pub.title) + `-${pub.year || index}`;
  const tags = pub.tags || extractPublicationTags(pub);
  const authors = pub.authors || [];

  // Escape quotes in strings
  const escapeQuotes = (str) => str.replace(/"/g, '\\"');

  const frontmatter = {
    title: pub.title,
    authors: authors,
    year: pub.year || new Date().getFullYear(),
    venue: pub.venue || 'Unknown Venue',
    doi: pub.doi || undefined,
    url: pub.url || undefined,
    tags: tags,
  };

  // Generate YAML frontmatter with proper quoting
  let yaml = '---\n';
  yaml += `title: "${escapeQuotes(frontmatter.title)}"\n`;
  yaml += `authors: [${authors.map((a) => `"${escapeQuotes(a)}"`).join(', ')}]\n`;
  yaml += `year: ${frontmatter.year}\n`;
  if (frontmatter.venue) yaml += `venue: "${escapeQuotes(frontmatter.venue)}"\n`;
  if (frontmatter.doi) yaml += `doi: "${frontmatter.doi}"\n`;
  if (frontmatter.url) yaml += `url: "${frontmatter.url}"\n`;
  yaml += `tags: [${tags.map((t) => `"${t}"`).join(', ')}]\n`;
  yaml += '---\n\n';

  // Generate content (extract abstract or description if available)
  let content = pub.abstract || pub.description || pub.summary || '';

  if (!content && pub.title) {
    // Generate a placeholder description
    content = `Publication in ${frontmatter.venue || 'conference proceedings'}.`;
  }

  return {
    slug,
    filename: `${slug}.mdx`,
    content: yaml + content + '\n',
  };
}

/**
 * Generate a poster MDX file
 */
function generatePosterMDX(poster, index) {
  const base = poster.title || `poster-${index}`;
  const slug = titleToSlug(base) + `-${poster.year || index}`;

  // Parse/construct date
  let date = poster.date;
  if (!date && poster.year) {
    const month = poster.month || '01';
    const day = poster.day || '01';
    date = `${poster.year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

  const frontmatter = {
    title: poster.title || 'Poster',
    date: date || new Date().toISOString().split('T')[0],
    event: poster.event || 'Conference Poster',
    venue: poster.venue || undefined,
    location: poster.location || undefined,
    link: poster.link || undefined,
    tags: poster.tags || ['poster'],
  };

  let yaml = '---\n';
  yaml += `title: "${(frontmatter.title || '').replace(/"/g, '\\"')}"\n`;
  yaml += `date: ${frontmatter.date}\n`;
  yaml += `event: "${(frontmatter.event || '').replace(/"/g, '\\"')}"\n`;
  if (frontmatter.venue) yaml += `venue: "${frontmatter.venue}"\n`;
  if (frontmatter.location) yaml += `location: "${frontmatter.location}"\n`;
  if (frontmatter.link) yaml += `link: "${frontmatter.link}"\n`;
  if (frontmatter.tags?.length)
    yaml += `tags: [${frontmatter.tags.map((t) => `"${t}"`).join(', ')}]\n`;
  yaml += '---\n\n';

  const content = `Poster presented at ${frontmatter.event}.`;

  return { slug, filename: `${slug}.mdx`, content: yaml + content + '\n' };
}

/**
 * Generate a talk MDX file
 */
function generateTalkMDX(talk, index) {
  const slug = titleToSlug(talk.title) + `-${talk.year || index}`;

  // Parse date from talk
  let date = talk.date;
  if (!date && talk.year) {
    // Try to construct a date from year/month if available
    const month = talk.month || '01';
    const day = talk.day || '01';
    date = `${talk.year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

  const frontmatter = {
    title: talk.title,
    date: date || new Date().toISOString().split('T')[0],
    event: talk.event || 'Conference Talk',
    venue: talk.venue || undefined,
    location: talk.location || undefined,
    slides: talk.slides || undefined,
    video: talk.video || undefined,
    tags: talk.tags || [],
  };

  // Generate YAML frontmatter
  let yaml = '---\n';
  yaml += `title: "${frontmatter.title.replace(/"/g, '\\"')}"\n`;
  yaml += `date: ${frontmatter.date}\n`;
  yaml += `event: "${frontmatter.event.replace(/"/g, '\\"')}"\n`;
  if (frontmatter.venue) yaml += `venue: "${frontmatter.venue}"\n`;
  if (frontmatter.location) yaml += `location: "${frontmatter.location}"\n`;
  if (frontmatter.slides) yaml += `slides: "${frontmatter.slides}"\n`;
  if (frontmatter.video) yaml += `video: "${frontmatter.video}"\n`;
  if (frontmatter.tags.length > 0) {
    yaml += `tags: [${frontmatter.tags.map((t) => `"${t}"`).join(', ')}]\n`;
  }
  yaml += '---\n\n';

  // Generate content
  let content = talk.abstract || talk.description || talk.summary || '';

  if (!content && talk.title) {
    content = `Presentation at ${frontmatter.event}.`;
  }

  return {
    slug,
    filename: `${slug}.mdx`,
    content: yaml + content + '\n',
  };
}

/**
 * Generate professional development MDX file
 */
function generateProfessionalDevelopmentMDX(profDev, index) {
  const slug = titleToSlug(profDev.event || `entry-${index}`) + `-${profDev.year || index}`;

  // Generate frontmatter
  const frontmatter = {
    role: profDev.role || 'Organizer',
    event: profDev.event || '',
    year: profDev.year || new Date().getFullYear(),
    url: profDev.url || '',
    description: profDev.description || '',
  };

  let yaml = '---\n';
  yaml += `role: "${frontmatter.role}"\n`;
  yaml += `event: "${frontmatter.event.replace(/"/g, '\\"')}"\n`;
  yaml += `year: ${frontmatter.year}\n`;
  if (frontmatter.url) yaml += `url: "${frontmatter.url}"\n`;
  yaml += '---\n\n';

  // Generate content
  let content = frontmatter.description || '';

  if (!content) {
    content = `${frontmatter.role} for ${frontmatter.event}.`;
  }

  return {
    slug,
    filename: `${slug}.mdx`,
    content: yaml + content + '\n',
  };
}

/**
 * Read CV JSON and generate MDX files
 */
async function main() {
  console.log('📝 Generating publication and talk MDX files from CV...\n');

  try {
    // Read CV JSON
    const cvData = JSON.parse(await fs.readFile(CV_JSON_PATH, 'utf-8'));

    // Ensure output directories exist
    await fs.mkdir(PUBLICATIONS_DIR, { recursive: true });
    await fs.mkdir(TALKS_DIR, { recursive: true });
    await fs.mkdir(PROF_DEV_DIR, { recursive: true });
    await fs.mkdir(POSTERS_DIR, { recursive: true });

    // Generate publication MDX files
    const publications = cvData.publications || [];
    console.log(`📚 Processing ${publications.length} publications...`);

    let pubCount = 0;
    for (let i = 0; i < publications.length; i++) {
      const pub = publications[i];
      const mdx = generatePublicationMDX(pub, i);

      const filePath = path.join(PUBLICATIONS_DIR, mdx.filename);

      // Check if file already exists
      try {
        await fs.access(filePath);
        console.log(`   ⏭️  Skipping existing: ${mdx.filename}`);
      } catch {
        // File doesn't exist, create it
        await fs.writeFile(filePath, mdx.content, 'utf-8');
        console.log(`   ✓ Created: ${mdx.filename}`);
        pubCount++;
      }
    }

    console.log(
      `\n✅ Created ${pubCount} new publication(s) (${publications.length - pubCount} already existed)\n`,
    );

    // Generate talk MDX files
    const talks = cvData.talks || [];
    console.log(`🎤 Processing ${talks.length} talks...`);

    let talkCount = 0;
    for (let i = 0; i < talks.length; i++) {
      const talk = talks[i];
      const mdx = generateTalkMDX(talk, i);

      const filePath = path.join(TALKS_DIR, mdx.filename);

      // Check if file already exists
      try {
        await fs.access(filePath);
        console.log(`   ⏭️  Skipping existing: ${mdx.filename}`);
      } catch {
        // File doesn't exist, create it
        await fs.writeFile(filePath, mdx.content, 'utf-8');
        console.log(`   ✓ Created: ${mdx.filename}`);
        talkCount++;
      }
    }

    console.log(
      `\n✅ Created ${talkCount} new talk(s) (${talks.length - talkCount} already existed)\n`,
    );

    // Generate professional development MDX files
    const profDevs = cvData.professionalDevelopment || [];
    console.log(`👔 Processing ${profDevs.length} professional development entries...`);

    let profDevCount = 0;
    for (let i = 0; i < profDevs.length; i++) {
      const profDev = profDevs[i];
      const mdx = generateProfessionalDevelopmentMDX(profDev, i);

      const filePath = path.join(PROF_DEV_DIR, mdx.filename);

      // Check if file already exists
      try {
        await fs.access(filePath);
        console.log(`   ⏭️  Skipping existing: ${mdx.filename}`);
      } catch {
        // File doesn't exist, create it
        await fs.writeFile(filePath, mdx.content, 'utf-8');
        console.log(`   ✓ Created: ${mdx.filename}`);
        profDevCount++;
      }
    }

    console.log(
      `\n✅ Created ${profDevCount} new professional development entry(ies) (${profDevs.length - profDevCount} already existed)\n`,
    );

    console.log('🎉 Content generation complete!');

    // Posters at the end to keep logs grouped
    const posters = cvData.posters || [];
    console.log(`🖼️  Processing ${posters.length} posters...`);

    let posterCount = 0;
    for (let i = 0; i < posters.length; i++) {
      const poster = posters[i];
      const mdx = generatePosterMDX(poster, i);

      const filePath = path.join(POSTERS_DIR, mdx.filename);
      try {
        await fs.access(filePath);
        console.log(`   ⏭️  Skipping existing: ${mdx.filename}`);
      } catch {
        await fs.writeFile(filePath, mdx.content, 'utf-8');
        console.log(`   ✓ Created: ${mdx.filename}`);
        posterCount++;
      }
    }

    console.log(
      `\n✅ Created ${posterCount} new poster(s) (${posters.length - posterCount} already existed)\n`,
    );

    console.log('🎉 Content generation complete!');
    console.log('\n💡 Tips:');
    console.log('   - Review generated files and add abstracts/descriptions');
    console.log('   - Add slides/video URLs to talk frontmatter');
    console.log('   - Verify tags are appropriate');
    console.log('   - Run `pnpm build` to see the new content');
  } catch (error) {
    console.error('❌ Error generating content:', error);
    process.exit(1);
  }
}

main();
