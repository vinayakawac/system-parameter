import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '127.0.0.1', port: 4173, strictPort: true,
    fs: { deny: ['**/npmrc', '**/.npmrc', '**/.env*', '**/rxd-design-system/**', '**/.git/**'] },
  },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
});
