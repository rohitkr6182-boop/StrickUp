import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return undefined;
          if (id.includes('/@supabase/')) return 'supabase';
          if (id.includes('/react-router')) return 'router-vendor';
          if (id.includes('/react-dom/') || id.includes('/scheduler/') || id.includes('/react/')) return 'react-vendor';
          if (id.includes('/date-fns/')) return 'date-vendor';
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test-setup.js',
    clearMocks: true,
  },
});
