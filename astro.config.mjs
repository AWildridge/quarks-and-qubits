import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://aj-wildridge.web.cern.ch',
  integrations: [tailwind(), mdx(), react()],
  output: 'static',
  prefetch: true,
  vite: {
    build: { target: 'es2022' },
  },
});
