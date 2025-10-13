import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    summary: z.string().optional(),
    repo: z.string().url().optional(),
  }),
});

const publications = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    authors: z.array(z.string()),
    year: z.number().int().min(1900).max(3000),
    venue: z.string().optional(),
    doi: z.string().optional(),
    url: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

const talks = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    event: z.string(),
    location: z.string().optional(),
    slides: z.string().url().optional(),
    video: z.string().url().optional(),
  }),
});

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    summary: z.string().optional(),
  }),
});

const people = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    role: z.string().optional(),
    email: z.string().email().optional(),
    location: z.string().optional(),
  }),
});

export const collections = {
  projects,
  publications,
  talks,
  posts,
  people,
};
