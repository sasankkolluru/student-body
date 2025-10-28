import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';

const useMock = (process.env.VITE_USE_MOCK || '').toLowerCase() === 'true';
const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  plugins: [
    react({
      fastRefresh: !isProduction,
      jsxRuntime: 'automatic',
      jsxImportSource: isProduction ? undefined : '@emotion/react',
    }),
    
    // Visualize bundle size in development
    !isProduction && visualizer({
      open: true,
      filename: 'bundle-analyzer.html',
      gzipSize: true,
      brotliSize: true,
    }),
    
    // Compression for production
    isProduction && viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
    }),
    isProduction && viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    
    // PWA support for better caching
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Student Body Platform',
        short_name: 'StudentBody',
        description: 'College Student Council Platform',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-query',
      'date-fns',
    ],
    exclude: ['lucide-react'],
    esbuildOptions: {
      treeShaking: isProduction,
      target: 'es2020',
      minify: isProduction,
    },
  },

  // Build configuration
  build: {
    target: 'es2020',
    minify: isProduction ? 'esbuild' : false,
    sourcemap: !isProduction,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ...(isProduction ? {
            'react-vendor': ['react', 'react-dom', 'react-router-dom', 'react-query'],
            'ui-vendor': ['@chakra-ui/react', '@emotion/react', 'framer-motion'],
          } : {}),
        },
      },
    },
    brotliSize: isProduction,
    chunkSizeWarningLimit: 1000,
  },

  // Development server configuration
  server: {
    port: 3000,
    strictPort: true,
    open: true,
    proxy: useMock ? undefined : {
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

  // Preview configuration
  preview: {
    port: 3000,
    strictPort: true,
  },

  // CSS configuration
  css: {
    devSourcemap: !isProduction,
    modules: {
      generateScopedName: isProduction
        ? '[hash:base64:5]'
        : '[name]__[local]__[hash:base64:5]',
    },
  },

  // Environment variables
  define: {
    'process.env': process.env,
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
});
