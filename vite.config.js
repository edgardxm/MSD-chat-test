import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // O site do GitHub Pages fica em https://<usuario>.github.io/MSD-chat-test/
  // Se o repositório tiver outro nome, ajuste o base para "/<nome-do-repo>/".
  base: '/MSD-chat-test/',
  plugins: [react()],
})
