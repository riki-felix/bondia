import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import tailwindcss from "@tailwindcss/vite";
import react from '@astrojs/react';

export default defineConfig({
  output: 'server',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ['.netlify.app'],
      hmr: {
        // Ensure HMR works correctly behind the Netlify dev proxy
        clientPort: 4321,
        port: 4321,
      },
    },
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  },
  adapter: netlify()
});

