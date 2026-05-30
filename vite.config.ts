import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync, statSync, createReadStream } from 'node:fs'
import { join, resolve } from 'node:path'

// Lightweight static handler used in `npm run dev:all` to serve the pre-built
// landing page (at /), OpenAPI viewer (at /api) and docs (at /docs) from a
// sibling dir under their production paths. SPA stays at /demo. Only mounted
// when DEV_PAGES_DIR is set.
function devPagesPlugin() {
  const pagesDir = process.env.DEV_PAGES_DIR
    ? resolve(process.cwd(), process.env.DEV_PAGES_DIR)
    : null;
  // Paths that Vite (or our SPA at /demo) must handle — never intercept these.
  const reservedPrefixes = ['/demo', '/@', '/src/', '/node_modules/', '/api/yahoo'];
  return {
    name: 'serve-dev-pages',
    configureServer(server: { middlewares: { use: (fn: (req: { url?: string }, res: { setHeader: (k: string, v: string) => void; statusCode: number; end: (b?: string) => void }, next: () => void) => void) => void } }) {
      if (!pagesDir) return;
      // Explicit mounts always handled here (under their prefixes).
      const explicitMounts = ['/api', '/docs'];
      const mime: Record<string, string> = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.mjs': 'application/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.yaml': 'text/yaml; charset=utf-8',
        '.yml': 'text/yaml; charset=utf-8',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.ico': 'image/x-icon',
      };
      const serveFile = (filePath: string, res: Parameters<Parameters<typeof server.middlewares.use>[0]>[1]) => {
        const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase();
        res.setHeader('content-type', mime[ext] || 'application/octet-stream');
        res.setHeader('cache-control', 'no-store');
        res.statusCode = 200;
        const stream = createReadStream(filePath);
        stream.on('error', () => { res.statusCode = 500; res.end('read error'); });
        stream.pipe(res as unknown as NodeJS.WritableStream);
      };
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        const pathname = url.split('?')[0];
        if (reservedPrefixes.some((p) => pathname === p || pathname.startsWith(p === '/api/yahoo' ? p : p.endsWith('/') ? p : p + '/'))) {
          next();
          return;
        }
        const isExplicit = explicitMounts.some((m) => pathname === m || pathname.startsWith(m + '/'));
        // Landing root: serve pagesDir/index.html when hitting /.
        if (pathname === '/') {
          const indexPath = join(pagesDir, 'index.html');
          if (existsSync(indexPath)) {
            serveFile(indexPath, res);
            return;
          }
          next();
          return;
        }
        // For explicit mounts (/api, /docs) and landing-relative assets at root,
        // resolve against pagesDir; fall through otherwise so Vite can handle it.
        let filePath = join(pagesDir, pathname);
        if (existsSync(filePath) && statSync(filePath).isDirectory()) {
          filePath = join(filePath, 'index.html');
        } else if (!existsSync(filePath) && existsSync(filePath + '/index.html')) {
          filePath = filePath + '/index.html';
        }
        if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
          if (isExplicit) {
            // No match under /api or /docs — 404 is fine, but defer to Vite.
            next();
            return;
          }
          next();
          return;
        }
        serveFile(filePath, res);
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    devPagesPlugin(),
    {
      name: 'handle-trailing-slash',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // SPA lives under /demo in web builds. Normalise the calculator route
          // so URLs like /demo/fire-calculator?params resolve to /demo/fire-calculator/?params.
          if (req.url === '/demo/fire-calculator') {
            req.url = '/demo/fire-calculator/';
          } else if (req.url?.startsWith('/demo/fire-calculator?')) {
            req.url = '/demo/fire-calculator/' + req.url.slice('/demo/fire-calculator'.length);
          }
          // For plain `npm run dev` (no DEV_PAGES_DIR landing), redirect / -> /demo/
          // so opening localhost:5173 lands the developer inside the SPA.
          if (req.url === '/' && !process.env.DEV_PAGES_DIR) {
            res.statusCode = 302;
            res.setHeader('location', '/demo/');
            res.end();
            return;
          }
          next();
        });
      },
    },
  ],
  // Electron loads index.html via file://, so it needs a relative base.
  // Web builds: landing sits at the site root; SPA lives under /demo so the
  // landing page can market the project. Production = GitHub Pages.
  base: mode === 'electron' ? './' : mode === 'production' ? '/fire-tools/demo/' : '/demo/',
  build: {
    outDir: mode === 'electron' ? 'dist-electron' : 'dist/demo',
  },
  server: {
    proxy: {
      '/api/yahoo': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api\/yahoo/, ''),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; fire-tools/1.0)',
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/main.tsx'],
    },
  },
}))
