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
    '/projects/example/': '/demos/spin-explorer/',
    '/projects/model-card-demo/': '/research/#tools',
    '/projects/quantum-annealing-vertexing/': '/research/#quantum-heading',
    '/projects/bumblebee-foundation-model/': '/research/#ml-heading',
    '/research/spin-correlation-explorer/': '/demos/spin-explorer/',
    '/research/model-card-demo/': '/research/#tools',
    '/research/quantum-annealing-vertexing/': '/research/#quantum-heading',
    '/research/bumblebee-foundation-model/': '/research/#ml-heading',
    '/demos/pegasus-embedder/': '/demos/cpcg-embedding/',
  },
  markdown: { processor: unified() },
  compressHTML: true,
  prefetch: true,
  vite: {
    build: { target: 'es2022', assetsInlineLimit: 0 },
  },
});
