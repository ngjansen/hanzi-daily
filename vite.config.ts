import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      // TTS proxy — must come before the general /api rule
      '/api/tts': {
        target: 'https://translate.google.com',
        changeOrigin: true,
        configure: (proxy: any) => {
          proxy.on('proxyReq', (proxyReq: any, req: any) => {
            const url = new URL(req.url, 'http://localhost');
            const q = url.searchParams.get('q') ?? '';
            proxyReq.path = `/translate_tts?ie=UTF-8&q=${encodeURIComponent(q)}&tl=zh-CN&client=tw-ob`;
            proxyReq.setHeader('Referer', 'https://translate.google.com/');
          });
        },
      },
      '/api': 'http://localhost:3002',
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
      },
      manifest: {
        name: '每日一词',
        short_name: 'HanziDaily',
        description: 'One Chinese word a day — deep cultural context for the diaspora',
        theme_color: '#C8473A',
        background_color: '#FAF8F5',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
