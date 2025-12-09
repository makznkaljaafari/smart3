
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react'],
          'vendor-utils': ['@tanstack/react-query', 'zustand', 'marked'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-heavy': ['jspdf', 'html2canvas'],
          'vendor-ai': ['@google/genai']
        }
      }
    }
  },
  server: {
    host: true,
  }
});
