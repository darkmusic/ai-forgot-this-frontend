# Copilot instructions for ai-forgot-this-frontend

This repo is a Vite + React 19 + React Router v7 TypeScript app that talks to a Spring/Tomcat backend with session auth and CSRF. Follow these conventions to be productive and avoid breaking auth/routing.

## Architecture & key files
- Routing/data loaders: `src/constants/router/router.tsx`
  - Exposes `router`, a `rootLoader()` to prime CSRF and optionally fetch the current user, `requireAuthLoader()` for route protection, and `loginAction()` for the login form POST + redirect.
- API wrapper (CSRF/session aware): `src/lib/api.ts`
  - `primeCsrf()` fetches `{ token, headerName }` from `/api/csrf` and caches it.
  - `apiFetch()` injects the CSRF header for unsafe methods and retries once on 403 (token rotation).
  - `getJson<T>()`, `postJson<T>()`, `login()`, `logout()` convenience helpers.
- Auth hook: `src/components/Shared/Authentication.ts`
  - `useCurrentUser()` hydrates the full `User` by first calling `/api/current-user`, then `/api/user/username/:username`.
- Shared types: `src/constants/data/data.ts` (User, Deck, Card, Tag, Theme, etc.). Use these interfaces.
- Styles: SCSS in `src/scss/*.scss` compiled to `src/css/*.css`; imported in `src/main.tsx`.
  - Dev note: ensure CSS targets exist (`src/css/index.css`, `src/css/themes.css`). If missing, run Sass build or adjust imports.

## Networking & auth conventions
- Prefer the centralized API wrapper in `src/lib/api.ts` for all HTTP calls. Do not call `fetch()` directly in new code.
  - Safe methods (GET/HEAD/OPTIONS/TRACE): no CSRF header.
  - Unsafe (POST/PUT/PATCH/DELETE): `apiFetch()` adds the CSRF header and retries on 403.
- Same-origin vs cross-origin:
  - Prefer relative paths (e.g., `/api/deck`) everywhere in app code. `apiFetch()` automatically prefixes `VITE_TOMCAT_SERVER_URL` when set, and always sets `credentials: 'include'` so session cookies flow.
  - If the backend is same-origin, `VITE_TOMCAT_SERVER_URL` can be unset; calls remain relative.
- Env: define `VITE_TOMCAT_SERVER_URL` in `.env` for dev against a separate backend origin, e.g. `VITE_TOMCAT_SERVER_URL=http://localhost:8080`.

## Routing & data loaders
- Define routes in `src/constants/router/router.tsx` using the data APIs (`createBrowserRouter` + loaders/actions).
- Protect views by adding `loader: requireAuthLoader` on the route config.
- For forms, use an `action` to POST, then `redirect()` on success. Example: see `loginAction()`.
- Pass complex objects between views via `useNavigate(path, { state: { ... }})` as done in card/deck flows.

## Build, run, lint
- Dev: `npm run dev`
- Build: `npm run build` (TypeScript build + Vite build; source maps enabled)
- Preview: `npm run preview`
- Lint: `npm run lint` (typescript-eslint + react-hooks + react-refresh rules)

Note: `just deploy` uses a PowerShell-based `justfile` (Windows-centric) and assumes `sass` is available. On Linux/macOS, either install Dart Sass and run `sass src/scss:src/css` before build, or adapt the Justfile if you use it.

Optional dev proxy: you can set `VITE_PROXY_TARGET=http://localhost:8080` in `.env` to proxy `/api/*` to the backend during `npm run dev`. If you also set `VITE_TOMCAT_SERVER_URL`, the API wrapper will prefix it—prefer using only one of these in dev (proxy or base URL), not both.

Dev env:
- Copy `.env.example` to `.env` and set `VITE_TOMCAT_SERVER_URL` when your backend runs on a different origin.

## Patterns to follow (with examples)
- HTTP example (POST JSON):
  - Add in code: `await postJson<Deck>('/api/deck', deckData)`; avoid inlining `fetch()`.
  - Update calls for PUT/DELETE similarly with `putJson()` / `deleteOk()`.
- Route protection:
  - Route config: `{ path: '/admin', element: <Admin/>, loader: requireAuthLoader }`
- CSRF prime on app load is already handled by `rootLoader()`; don’t duplicate it in components.
- Types: import from `src/constants/data/data.ts` (e.g., `Deck`, `Card`) instead of redefining shapes.

## Gotchas
- Some older components used `TOMCAT_SERVER_URL` + raw `fetch`. New code should use the centralized API wrapper and relative `/api/*` paths to keep CSRF/credentials logic consistent.
- If you introduce new unsafe endpoints, ensure they go through `apiFetch()` so CSRF headers are attached.
- React Router v7 data APIs are used; import UI from `react-router-dom` and router primitives from `react-router` as shown in `src/main.tsx` and the router file.

If anything above is unclear (e.g., proxying in dev, SCSS pipeline, or unifying API calls), call it out and I’ll refine these instructions.
