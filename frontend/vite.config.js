import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'; // Required for Tailwind v4
import { BACKEND_URL } from './src/config/api.js';

export default defineConfig({
  plugins: [
    [react()],
    tailwindcss(),
  ], server: {
    allowedHosts: [
      'diminish-waving-shore.ngrok-free.dev'
    ],
    proxy: {
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: BACKEND_URL,
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});