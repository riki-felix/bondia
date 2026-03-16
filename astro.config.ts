import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import tailwindcss from "@tailwindcss/vite";
import react from '@astrojs/react';
import { execSync } from 'node:child_process';

const commitHash = (process.env.COMMIT_REF ||
  (() => { try { return execSync('git rev-parse --short HEAD').toString().trim(); } catch { return 'dev'; } })()
).slice(0, 7);

export default defineConfig({
  output: 'server',
  integrations: [react()],
  vite: {
    define: {
      __APP_VERSION__: JSON.stringify(commitHash),
    },
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

