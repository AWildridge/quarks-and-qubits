import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: 'https://aj-wildridge.web.cern.ch',
  integrations: [
    mdx({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
    react(),
  ],
  output: 'static',
  markdown: { processor: unified() },
  compressHTML: true,
  prefetch: true,
  vite: {
    build: { target: 'es2022', assetsInlineLimit: 0 },
  },
});
