// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';
import vercel from '@astrojs/vercel';

export default defineConfig({
  adapter: vercel(),
  site: 'https://glanzwerk-cloppenburg.de',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [react(), keystatic(), sitemap()],
});
