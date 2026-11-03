// Flat ESLint configuration
import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import astroPlugin from 'eslint-plugin-astro';
import * as astroParser from 'astro-eslint-parser';
import globals from 'globals';

export default [
  {
    ignores: [
      'dist/**',
      'dist-deploy/**',
      'node_modules/**',
      'playwright-report/**',
      '.astro/**',
      'src/env.d.ts',
      'test-results/**',
      '.lighthouseci/**',
    ],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node, React: 'readonly' },
    },
    plugins: { '@typescript-eslint': ts },
    rules: {
      ...js.configs.recommended.rules,
      ...ts.configs['recommended'].rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.astro'],
    languageOptions: {
      parser: astroParser,
      parserOptions: { parser: tsParser, extraFileExtensions: ['.astro'] },
      globals: { ...globals.browser },
    },
    plugins: { astro: astroPlugin },
    rules: { ...astroPlugin.configs.recommended.rules },
  },
];
