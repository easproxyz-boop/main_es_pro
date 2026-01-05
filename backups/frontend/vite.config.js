import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: './',      // your project root
  base: './',      // base path
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // optional, only if you use a src folder
    },
  },
  server: {
    port: 3000,        // dev server port
    open: true,        // open browser automatically
    strictPort: true,  // fail if port is in use
  },
  // You can omit the build section entirely since you don't want to build
});
