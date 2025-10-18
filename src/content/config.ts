import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    language: z.string().optional(),
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
    draft: z.boolean().default(false),
  }),
});

const talks = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    event: z.string(),
    venue: z.string().optional(),
    location: z.string().optional(),
    slides: z.string().url().optional(),
    video: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

const posters = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    event: z.string(),
    venue: z.string().optional(),
    location: z.string().optional(),
    link: z.string().url().optional(),
    tags: z.array(z.string()).default(['poster']),
  }),
});

const teaching = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    term: z.string(), // e.g., "Fall 2023"
    institution: z.string(),
    level: z.enum(['undergraduate', 'graduate', 'workshop']).optional(),
    role: z.string().optional(), // e.g., "Instructor", "TA"
    materials: z.string().url().optional(),
    syllabus: z.string().url().optional(),
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

const professionalDevelopment = defineCollection({
  type: 'content',
  schema: z.object({
    role: z.string(), // e.g., "Organizer", "Session Chair", "Program Committee"
    event: z.string(),
    year: z.number().int().min(1900).max(3000),
    url: z.string().url().optional(),
    description: z.string().optional(),
  }),
});

export const collections = {
  projects,
  publications,
  talks,
  posters,
  teaching,
  posts,
  people,
  professionalDevelopment,
};
