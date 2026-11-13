# WriteSpace

WriteSpace is a static, browser-local writing demo. This slice provides identity and navigation; landing, blog, and admin content is being built in later slices.

## Run locally

Requires Node.js 20 or newer. From `frontend/`:

```sh
npm install --no-bin-links --no-audit --no-fund
node node_modules/vite/bin/vite.js
```

Build with `npm run build`. Run unit/component tests with `npm test`. The Playwright suite can be run with `npm run e2e` after installing Chromium with `node node_modules/@playwright/test/cli.js install chromium`.

For Vercel, set the project root directory to `frontend`; its rewrite sends direct client routes to the SPA. For a container, build `frontend/Dockerfile` with `frontend` as the build context. The nginx configuration provides the same route fallback. No environment variables are required.

## Important security and storage limitations

This is **not secure authentication**. The built-in account is `admin` / `admin`; account passwords are saved as plaintext in localStorage, and client-side role checks can be modified or bypassed. Never enter real credentials or sensitive data. Each browser and origin has independent data: there is no server, synchronization, confidentiality, backup, or trustworthy authorization. Clearing site data removes local accounts and sessions. If browser storage is unavailable, corrupted, or full, reads fall back safely and writes report a failure; persistence cannot be guaranteed. If registration saves an account but fails to save its session, log in after restoring storage access.
