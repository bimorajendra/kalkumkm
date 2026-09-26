import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const analyticsUrl = process.env.VITE_UMAMI_SCRIPT_URL;
const analyticsWebsiteId = process.env.VITE_UMAMI_WEBSITE_ID;
const analytics = (() => {
  if (!analyticsUrl || !analyticsWebsiteId) return '';
  const url = new URL(analyticsUrl);
  if (
    url.origin !== 'https://cloud.umami.is' ||
    !/^[\w.-]{1,128}$/.test(analyticsWebsiteId)
  ) {
    throw new Error('Konfigurasi Umami app tidak valid.');
  }
  return `<script defer src="${url.href}" data-website-id="${analyticsWebsiteId}"></script>`;
})();

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icon.svg', 'theme-init.js'],
      manifest: {
        name: 'Takaran',
        short_name: 'Takaran',
        description: 'Kalkulator HPP untuk usaha rumahan.',
        display: 'standalone',
        start_url: '/',
        theme_color: '#fbf6f1',
        background_color: '#fbf6f1',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,woff2,webmanifest}'] },
      devOptions: { enabled: true, type: 'module' },
    }),
    {
      name: 'takaran-analytics-script',
      transformIndexHtml(html) {
        return html.replace('</head>', `${analytics}</head>`);
      },
    },
  ],
});
