# Electron — Fire Tools desktop wrapper

Wraps the existing React SPA so it ships as a signed binary on macOS,
Windows and Linux. Tracks issue
[#132](https://github.com/mbianchidev/fire-tools/issues/132).

> **Scope of this scaffold.** Wrapper only. The renderer is the same
> client-side React app (cookie-encrypted storage) that runs on the web.
> Bundling the local backend (#129/#195) inside the same binary is a
> follow-up; for now, Electron users either run with cookies only or
> point the bundled web app at a self-hosted backend.

## Run in dev

Two terminals:

```sh
# 1. Vite dev server (relative-base build for Electron)
ELECTRON_RENDERER_URL=http://localhost:5173 npm run dev

# 2. Electron, pointed at the Vite dev server
ELECTRON_RENDERER_URL=http://localhost:5173 npm run electron:dev
```

Or one-liner with concurrent processes (your shell of choice — we
intentionally don't pull in `concurrently` to keep deps lean).

## Build a distributable

```sh
npm run electron:build   # produces dist-electron/ from Vite
npm run electron:dist    # runs electron-builder per electron-builder.yml
```

Artifacts land in `release/<version>/`. Defaults: `.dmg` (macOS),
`.exe` NSIS installer (Windows), `.AppImage` (Linux).

## Signing & notarization

Env vars (set in CI secrets — never commit):

| Var                          | Purpose                                    |
|------------------------------|--------------------------------------------|
| `CSC_LINK`                   | Path/URL to `.p12` macOS signing cert      |
| `CSC_KEY_PASSWORD`           | Password for the `.p12`                    |
| `APPLE_ID`                   | Apple ID for notarization                  |
| `APPLE_APP_SPECIFIC_PASSWORD`| App-specific password                      |
| `APPLE_TEAM_ID`              | Apple Developer team id                    |
| `WINDOWS_CERTIFICATE_LINK`   | Path/URL to Windows code-signing cert      |
| `WINDOWS_CERTIFICATE_PASSWORD` | Password for the Windows cert            |

Set `notarize: true` in [`../electron-builder.yml`](../electron-builder.yml)
once macOS notarization credentials are wired into CI.

## Security posture

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
- Renderer cannot reach Node directly; the preload exposes a tiny
  read-only surface (`window.fireTools`).
- External links open in the OS browser via `shell.openExternal`.
- `will-navigate` is blocked except for the dev server and `file://`.
