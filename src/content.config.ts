import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const publications = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/publications' }),
  schema: z.object({
    title: z.string(),
    authors: z.array(z.string()),
    year: z.number().int().min(1900).max(3000),
    date: z.coerce.date().optional(),
    venue: z.string().optional(),
    doi: z.string().optional(),
    url: z.url().optional(),
    tags: z.array(z.string()).default([]),
    bibtexKey: z.string().optional(),
    citationType: z.enum(['article', 'inproceedings', 'techreport']).optional(),
    resultsUrl: z.url().optional(),
    draft: z.boolean().default(false),
  }),
});

const talks = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/talks' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    displayDate: z.string().optional(),
    event: z.string(),
    venue: z.string().optional(),
    location: z.string().optional(),
    slides: z.url().optional(),
    video: z.url().optional(),
    transcript: z.url().optional(),
    source: z.url().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

const posters = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posters' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    event: z.string(),
    venue: z.string().optional(),
    location: z.string().optional(),
    link: z.url().optional(),
    tags: z.array(z.string()).default(['poster']),
  }),
});

const teaching = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/teaching' }),
  schema: z.object({
    title: z.string(),
    term: z.string(), // e.g., "Fall 2023"
    institution: z.string(),
    level: z.enum(['undergraduate', 'graduate', 'workshop']).optional(),
    role: z.string().optional(), // e.g., "Instructor", "TA"
    materials: z.url().optional(),
    syllabus: z.url().optional(),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    kind: z.enum(['post', 'note']).default('post'),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    summary: z.string().optional(),
  }),
});

const people = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/people' }),
  schema: z.object({
    name: z.string(),
    role: z.string().optional(),
    email: z.email().optional(),
    location: z.string().optional(),
  }),
});

const professionalDevelopment = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/professional-development' }),
  schema: z.object({
    role: z.string(), // e.g., "Organizer", "Session Chair", "Program Committee"
    event: z.string(),
    year: z.number().int().min(1900).max(3000),
    url: z.url().optional(),
    description: z.string().optional(),
  }),
});

export const collections = {
  publications,
  talks,
  posters,
  teaching,
  posts,
  people,
  professionalDevelopment,
};
