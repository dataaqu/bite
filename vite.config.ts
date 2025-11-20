import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'prompt',
          devOptions: {
            enabled: true
          },
          includeAssets: ['favicon.png', 'assets/*.png'],
          manifest: {
            name: 'Bite - Food Tracker',
            short_name: 'Bite',
            description: 'AI-powered food tracking app for Georgian users',
            theme_color: '#f27141',
            background_color: '#ffffff',
            display: 'standalone',
            orientation: 'portrait',
            scope: '/',
            start_url: '/',
            lang: 'ka',
            icons: [
              {
                src: 'assets/bite.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'assets/bite.png',
                sizes: '512x512',
                type: 'image/png'
              }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg}']
          }
        })
      ],
      define: {
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
