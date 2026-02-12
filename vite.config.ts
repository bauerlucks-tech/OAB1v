import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    fs: {
      strict: false
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'index.js': ['react', 'react-dom', 'react-konva']
          }
        }
      }
    }
  }
})
