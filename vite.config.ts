import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/kreuzwortraetsel-generator/',
  server: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        play: resolve(__dirname, 'play.html'),
      },
    },
  },
})
