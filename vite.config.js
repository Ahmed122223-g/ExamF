import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // استخدم /ExamF/ فقط لـ GitHub Pages، وإلا / للمنصات الأخرى
  base: process.env.VITE_GITHUB_PAGES === 'true' ? '/ExamF/' : '/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
