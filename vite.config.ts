import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const useMock = (process.env.VITE_USE_MOCK || '').toString().toLowerCase() === 'true';

export default defineConfig({
  plugins: [react()],
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
});
