# Landing page

Static landing page for `fire-tools`. Hand-rolled HTML + CSS — no build
step, no framework. Tracks issue
[#138](https://github.com/mbianchidev/fire-tools/issues/138).

## Where it lives in production

`npm run build:landing` copies the contents of `website/` to `dist/`
(the site root) so it ships at the GitHub Pages root. The SPA lives
under `dist/demo/`. The live URLs are:

- `https://mbianchidev.github.io/fire-tools/` — this landing page
- `https://mbianchidev.github.io/fire-tools/demo/` — the read-only demo app

## Local preview

```sh
cd website
python3 -m http.server 4000
# open http://localhost:4000
```
