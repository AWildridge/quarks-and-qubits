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
  redirects: {
    '/projects/': '/research/',
    '/projects/example/': '/research/spin-correlation-explorer/',
    '/projects/model-card-demo/': '/research/model-card-demo/',
    '/projects/quantum-annealing-vertexing/': '/research/quantum-annealing-vertexing/',
    '/projects/bumblebee-foundation-model/': '/research/bumblebee-foundation-model/',
  },
  markdown: { processor: unified() },
  compressHTML: true,
  prefetch: true,
  vite: {
    build: { target: 'es2022', assetsInlineLimit: 0 },
  },
});
