import path from 'node:path';
import { crx } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig, build as viteBuild } from 'vite';
import zip from 'vite-plugin-zip-pack';
import manifest from './manifest.config.js';
import { name, version } from './package.json';
import tailwindcss from '@tailwindcss/vite';

// Custom plugin to build inject script as IIFE
function injectScriptPlugin() {
  return {
    name: 'inject-script-builder',
    async buildStart() {
      // Build inject script to public folder so crx plugin can find it
      await viteBuild({
        configFile: false,
        build: {
          emptyOutDir: false,
          outDir: 'public',
          lib: {
            entry: 'src/inject/index.ts',
            name: 'InjectScript',
            formats: ['iife'],
            fileName: () => 'inject.js',
          },
          rollupOptions: {
            output: {
              extend: true,
            },
          },
        },
      });
    },
  };
}

export default defineConfig({
  resolve: {
    alias: {
      '@': `${path.resolve(__dirname, 'src')}`,
    },
  },
  plugins: [
    react(),
    crx({ manifest }),
    injectScriptPlugin(),
    zip({ outDir: 'release', outFileName: `crx-${name}-${version}.zip` }),
    tailwindcss(),
  ],
  server: {
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },
});

