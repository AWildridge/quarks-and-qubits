import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { publicationDateValue } from '../lib/bibtex';

export async function GET(context: APIContext) {
  const [posts, publications, talks] = await Promise.all([
    getCollection('posts'),
    getCollection('publications'),
    getCollection('talks'),
  ]);

  const postItems = posts
    .filter((post) => !post.data.draft)
    .map((post) => ({
      title: post.data.title,
      description: post.data.summary || '',
      pubDate: post.data.date,
      link: `/posts/${post.slug}/`,
      categories: [post.data.kind, ...post.data.tags],
    }));

  const publicationItems = publications
    .filter((publication) => !publication.data.draft)
    .map((publication) => ({
      title: `Publication: ${publication.data.title}`,
      description: [publication.data.venue, String(publication.data.year)]
        .filter(Boolean)
        .join(', '),
      pubDate: new Date(publicationDateValue(publication.data)),
      link: `/publications/${publication.slug}/`,
      categories: ['publication', ...publication.data.tags],
    }));

  const talkItems = talks.map((talk) => ({
    title: `Talk: ${talk.data.title}`,
    description: [talk.data.event, talk.data.venue, talk.data.location].filter(Boolean).join(', '),
    pubDate: talk.data.date,
    link: '/talks/',
    categories: ['talk', ...talk.data.tags],
  }));

  const items = [...postItems, ...publicationItems, ...talkItems].sort(
    (a, b) => b.pubDate.getTime() - a.pubDate.getTime(),
  );

  return rss({
    title: 'Quarks & Qubits Latest',
    description:
      'Latest posts, publications, and talks from AJ Wildridge on quantum computing, machine learning, and particle physics.',
    site: context.site || 'https://aj-wildridge.web.cern.ch',
    items,
    customData: '<language>en-us</language>',
  });
}
