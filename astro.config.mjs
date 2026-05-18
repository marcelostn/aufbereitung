// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';
import vercel from '@astrojs/vercel';

export default defineConfig({
  adapter: vercel(),
  site: 'https://autoaufbereitung-cloppenburg.de', // TODO: echte Domain eintragen
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [react(), keystatic(), sitemap()],
});
