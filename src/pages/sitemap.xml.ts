import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

const SITE_URL = 'https://aj-wildridge.web.cern.ch';

export const GET: APIRoute = async () => {
  // Get all content collections
  const projects = await getCollection('projects');
  const publications = await getCollection('publications');
  const talks = await getCollection('talks');
  const posts = await getCollection('posts');

  // Define static pages
  const staticPages = [
    { url: '', priority: 1.0, changefreq: 'weekly' },
    { url: 'research', priority: 0.9, changefreq: 'monthly' },
    { url: 'projects', priority: 0.9, changefreq: 'weekly' },
    { url: 'publications', priority: 0.9, changefreq: 'monthly' },
    { url: 'talks', priority: 0.8, changefreq: 'monthly' },
    { url: 'posts', priority: 0.7, changefreq: 'weekly' },
    { url: 'cv', priority: 0.8, changefreq: 'monthly' },
    { url: 'contact', priority: 0.7, changefreq: 'yearly' },
    { url: 'demos/spin-explorer', priority: 0.8, changefreq: 'monthly' },
  ];

  // Build sitemap URLs
  const sitemapEntries = [
    ...staticPages.map((page) => ({
      url: `${SITE_URL}/${page.url}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: page.changefreq,
      priority: page.priority,
    })),
    ...projects.map((project) => ({
      url: `${SITE_URL}/projects/${project.slug}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: 0.7,
    })),
    ...publications.map((pub) => ({
      url: `${SITE_URL}/publications/${pub.slug}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'yearly',
      priority: 0.8,
    })),
    ...talks.map((talk) => ({
      url: `${SITE_URL}/talks/${talk.slug}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'yearly',
      priority: 0.6,
    })),
    ...posts.map((post) => ({
      url: `${SITE_URL}/posts/${post.slug}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: 0.6,
    })),
  ];

  // Generate XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries
  .map(
    (entry) => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
