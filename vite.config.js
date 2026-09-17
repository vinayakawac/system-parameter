import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    host: '127.0.0.1', port: 4173, strictPort: true,
    fs: { deny: ['**/npmrc', '**/.npmrc', '**/.env*', '**/rxd-design-system/**', '**/.git/**'] },
  },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
});
