import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // In dev, forward /api to the Express server so the frontend always calls a relative /api
    proxy: { '/api': 'http://localhost:5000' },
  },
});
