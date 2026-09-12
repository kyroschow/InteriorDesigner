import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  // The backend sends no CORS headers, so the browser stays same-origin and the
  // dev server forwards /api. Point it at a remote backend with API_PROXY_TARGET
  // in .env.local.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': path.resolve(__dirname, 'src') },
    },
    server: {
      host: '127.0.0.1',
      port: 5273,
      strictPort: false,
      proxy: { '/api': { target: env.API_PROXY_TARGET || 'http://127.0.0.1:3001', changeOrigin: true } },
    },
  }
})
