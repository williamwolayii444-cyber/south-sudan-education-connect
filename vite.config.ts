import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwind from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';

export default defineConfig({
  plugins: [TanStackRouterVite({ autoCodeSplitting: true }), react(), tsconfigPaths(), tailwind()],
  server: {
    port: 5173,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
});
