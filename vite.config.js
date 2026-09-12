import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        twoPointFourGhz: resolve(__dirname, '2.4ghz.html'),
        en: resolve(__dirname, 'en/index.html'),
        blog: resolve(__dirname, 'blog/index.html'),
        rfFaq: resolve(__dirname, 'rf-faq/index.html'),
      },
    },
  },
});

