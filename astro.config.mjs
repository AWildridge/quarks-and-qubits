import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: 'https://aj-wildridge.web.cern.ch',
  integrations: [
    tailwind(),
    mdx({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
    react(),
  ],
  output: 'static',
  prefetch: true,
  vite: {
    build: { target: 'es2022' },
  },
});
