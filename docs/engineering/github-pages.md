# GitHub Pages deploy

The public site is deployed by [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml)
from the generated `dist/` directory:

- `dist/index.html` is the landing page.
- `dist/demo/` is the Vite web demo.
- `dist/docs/` is the rendered documentation.
- `dist/api/` is the OpenAPI viewer.

The demo uses stable entry and chunk filenames (`assets/index.js`,
`assets/index.css`, and stable chunk names) instead of Vite's default hashed
filenames. GitHub Pages caches HTML for a short time; during a deploy, a browser
can briefly hold an older `demo/index.html`. Stable asset paths keep that stale
HTML loading the app instead of requesting deleted `index-*.js` or
`index-*.css` files and rendering a blank page.

Run `npm run build` before opening a Pages deploy PR. The generated
`dist/demo/index.html` should reference `/app/demo/assets/index.js` and
`/app/demo/assets/index.css` for the production repository.
