import path from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts')) return 'charts'
          if (id.includes('node_modules/@tanstack/react-query')) return 'query'
          if (id.includes('node_modules/react-hook-form')) return 'forms'
          if (id.includes('node_modules/@hookform/resolvers')) return 'forms'
          if (id.includes('node_modules/zod')) return 'forms'
          if (id.includes('node_modules/framer-motion')) return 'motion'
          if (id.includes('node_modules/react-router-dom')) return 'react'
          if (id.includes('node_modules/react-dom')) return 'react'
          if (id.includes('node_modules/react')) return 'react'
          if (id.includes('node_modules/axios')) return 'vendor'
          if (id.includes('node_modules/zustand')) return 'vendor'
          if (id.includes('node_modules/sonner')) return 'vendor'
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
