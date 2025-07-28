import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // ⚠️ o Electron procura esse diretório
  },
  base: './' // <- muito importante para funcionar no Electron
});
