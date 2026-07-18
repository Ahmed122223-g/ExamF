import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // إذا كان البناء لـ GitHub Pages، نستخدم اسم المستودع كـ base path
  base: process.env.NODE_ENV === 'production' ? '/ExamF/' : '/',
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
