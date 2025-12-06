import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          strategies: 'injectManifest',
          srcDir: 'public',
          filename: 'alarm-sw.js',
          injectManifest: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          },
          includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
          manifest: {
            name: 'Class Timetable',
            short_name: 'Timetable',
            description: 'Class Timetable App',
            theme_color: '#2563eb',
            background_color: '#ffffff',
            display: 'standalone',
            start_url: '/',
            icons: [
              {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: 'maskable-icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              }
            ]
          },
          icon: {
            source: './public/icon.svg',
            sizes: [192, 512],
            destination: '.',
            purpose: 'any'
          },
          maskableIcon: {
            source: './public/icon-maskable.svg',
            sizes: [512],
            destination: '.',
            purpose: 'maskable'
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/docs\.google\.com\/spreadsheets\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'google-sheets-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 // 24 hours
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /^https:\/\/cdn-icons-png\.flaticon\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'icon-cache',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                  }
                }
              }
            ],
            // Force update check on every page load
            skipWaiting: true,
            clientsClaim: true,
            // Don't cache the service worker itself
            navigateFallback: null,
            navigateFallbackDenylist: [/^\/_/]
          },
          devOptions: {
            enabled: false // Disable in dev to avoid issues
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Ensure unique filenames for cache busting
        rollupOptions: {
          output: {
            entryFileNames: 'assets/[name].[hash].js',
            chunkFileNames: 'assets/[name].[hash].js',
            assetFileNames: 'assets/[name].[hash].[ext]',
            // Preserve module structure to avoid initialization issues
            format: 'es',
            manualChunks: undefined
          }
        },
        // Increase chunk size warning limit
        chunkSizeWarningLimit: 1000,
        // Use source maps for better debugging
        sourcemap: false
      }
    };
});
