// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';
import node from '@astrojs/node';

export default defineConfig({
  // 'static' = alle Seiten bleiben statisch; /keystatic-Routen haben prerender=false (SSR)
  // Adapter nur für `npm run build` nötig; für Vercel/Netlify später den Adapter tauschen
  adapter: node({ mode: 'standalone' }),
  site: 'https://autoaufbereitung-cloppenburg.de', // TODO: echte Domain eintragen
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [react(), keystatic(), sitemap()],
});
