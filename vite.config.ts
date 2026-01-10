import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    {
      name: 'handle-trailing-slash',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Handle /fire-calculator?params by rewriting to /fire-calculator/?params
          // Only process exact /fire-calculator or /fire-calculator? paths
          if (req.url === '/fire-calculator') {
            req.url = '/fire-calculator/';
          } else if (req.url?.startsWith('/fire-calculator?')) {
            req.url = '/fire-calculator/' + req.url.slice('/fire-calculator'.length);
          }
          next();
        });
      },
    },
  ],
  base: mode === 'production' ? '/fire-tools/' : '/',
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.d.ts', 'src/main.tsx'],
    },
  },
}))
