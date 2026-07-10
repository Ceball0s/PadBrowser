import { defineConfig } from 'astro/config'

export default defineConfig({
  outDir: './out/pages',
  build: {
    format: 'file'
  }
})
