// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://tarshar4242.github.io',
  base: '/learn-ai-with-tarshar/',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
});
