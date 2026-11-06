import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// During development the React app runs on :5173 and forwards every /api
// request to the Express backend on :3000. Because the browser only ever talks
// to :5173, the backend's HTTP-only "token" cookie works without any CORS setup.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
