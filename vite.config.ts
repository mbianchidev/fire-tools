import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'handle-trailing-slash',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Handle /fire-calculator?params by rewriting to /fire-calculator/?params
          if (req.url) {
            // Only process exact /fire-calculator or /fire-calculator? paths
            if (req.url === '/fire-calculator' || req.url.startsWith('/fire-calculator?')) {
              // Rewrite to add trailing slash
              if (req.url === '/fire-calculator') {
                req.url = '/fire-calculator/';
              } else if (req.url.startsWith('/fire-calculator?')) {
                req.url = req.url.replace('/fire-calculator?', '/fire-calculator/?');
              }
            }
          }
          next();
        });
      },
    },
  ],
  base: '/fire-calculator/',
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
