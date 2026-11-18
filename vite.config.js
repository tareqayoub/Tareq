import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 4173,
    host: true,
    watch: {
      // مجلدات الجوال والملفات الحساسة لا تحتاج مراقبة HMR، وقد تُقفل من Android Studio
      ignored: ['**/android/**', '**/ios/**', '**/google-services.json', '**/GoogleService-Info.plist'],
    },
  },
})
