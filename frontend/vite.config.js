import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for CivicConnect Frontend
// Using @vitejs/plugin-react for fast refresh and JSX transformation
// Configuring vitest for E2E / Component testing with jsdom
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
    host: true
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js'
  }
});
