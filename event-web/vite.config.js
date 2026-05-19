import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const PORT = 3001; // event-web (Vendor)
const BACKEND_PORT = 5000;

export default defineConfig({
  plugins: [react()],
  server: {
    port: PORT,
    host: true,
    proxy: {
      '/api': {
        target: `http://localhost:${BACKEND_PORT}`,
        changeOrigin: true,
      },
      '/uploads': {
        target: `http://localhost:${BACKEND_PORT}`,
        changeOrigin: true,
      },
    },
  },
});
