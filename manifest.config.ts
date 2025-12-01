import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  description: 'Monitor and anonymize email in ChatGPT prompts',
  version: pkg.version,
  icons: {
    48: 'public/logo.png',
  },
  action: {
    default_icon: {
      48: 'public/logo.png',
    },
    default_popup: 'src/popup/index.html',
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  permissions: ['storage', 'activeTab'],
  host_permissions: ['https://chatgpt.com/*', 'https://chat.openai.com/*'],
  content_scripts: [
    {
      js: ['src/content/main.tsx'],
      matches: ['https://chatgpt.com/*', 'https://chat.openai.com/*'],
      run_at: 'document_start',
    },
  ],
  web_accessible_resources: [
    {
      resources: ['inject.js'],
      matches: ['https://chatgpt.com/*', 'https://chat.openai.com/*'],
    },
  ],
});

