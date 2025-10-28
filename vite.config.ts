import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const useMock = (process.env.VITE_USE_MOCK || '').toString().toLowerCase() === 'true';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Analytics Dashboard',
        short_name: 'Analytics',
        description: 'Advanced analytics dashboard with real-time data visualization',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        sourcemap: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // Disable PWA in development
        type: 'module',
        navigateFallback: 'index.html',
      },
    }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  define: {
    'process.env': process.env,
  },
  server: {
    proxy: useMock
      ? undefined
      : {
          // Derive proxy target from VITE_API_BASE (e.g., http://localhost:4000/api)
          // Fallback to http://127.0.0.1:4000 when not provided
          '/socket.io': {
            target: (process.env.VITE_API_BASE || 'http://127.0.0.1:4000/api').replace(/\/api\/?$/, ''),
            ws: true,
            changeOrigin: true,
          },
          '/api': {
            target: (process.env.VITE_API_BASE || 'http://127.0.0.1:4000/api').replace(/\/api\/?$/, ''),
            changeOrigin: true,
          },
        },
  },
  // Add base path for production builds
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          chartjs: ['chart.js', 'react-chartjs-2'],
          d3: ['d3'],
        },
      },
    },
  },
});
