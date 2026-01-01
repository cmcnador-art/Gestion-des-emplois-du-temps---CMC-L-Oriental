
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Remplacez 'nom-du-depot' par le nom de votre repo sur GitHub
// ex: https://github.com/votre-nom/cmc-oriental -> base: '/cmc-oriental/'
export default defineConfig({
  plugins: [react()],
  base: './', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});
