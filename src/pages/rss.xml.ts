import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('posts');

  // Filter out drafts and sort by date descending
  const publishedPosts = posts
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: 'Quarks & Qubits',
    description:
      'Insights on quantum computing, machine learning, and particle physics from AJ Wildridge',
    site: context.site || 'https://aj-wildridge.web.cern.ch',
    items: publishedPosts.map((post) => ({
      title: post.data.title,
      description: post.data.summary || '',
      pubDate: post.data.date,
      link: `/posts/${post.slug}/`,
      categories: post.data.tags,
    })),
    customData: `<language>en-us</language>`,
    stylesheet: '/rss-styles.xsl',
  });
}
