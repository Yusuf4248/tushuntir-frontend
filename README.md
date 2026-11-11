# Tushuntir — student web app

The student panel of Tushuntir, an AI learning platform for school students (grades 5–11) in
Uzbekistan. All interface text is Uzbek (Latin), kept in `src/lib/strings.uz.ts`.

React 19 + Vite + TypeScript (strict), Tailwind CSS v4, shadcn/ui-style components on Radix,
React Router, TanStack Query, lucide-react.

## Run locally

```bash
npm install
cp .env.example .env   # then set the values below
npm run dev            # http://localhost:5173
```

The backend (NestJS, `../backend`) must be running; its API contract is
`../backend/docs/openapi.json`.

## Environment variables

| Variable         | Required | Example                     | What it does                                                                                                                               |
| ---------------- | -------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `VITE_API_URL`   | yes      | `http://localhost:4004/api` | Backend base URL **including** the `/api` prefix. Audio links (`/uploads/...`) are resolved against its origin.                            |
| `VITE_DEMO_MODE` | no       | `true`                      | Shows demo helpers such as "Darsni tugatish (demo)" on Home. The backend must also run with `DEMO_MODE=true`. Leave `false` in production. |

Vite reads these at **build time**: changing them needs a new build / deploy.

## Scripts

| Script                            | What it does                                                         |
| --------------------------------- | -------------------------------------------------------------------- |
| `npm run dev`                     | Dev server with hot reload                                           |
| `npm run build`                   | Type-check and build to `dist/`                                      |
| `npm run preview`                 | Serve the built `dist/` locally                                      |
| `npm run lint`                    | ESLint                                                               |
| `npm run format` / `format:check` | Prettier                                                             |
| `npm run api:types`               | Regenerate `src/api/schema.d.ts` from `../backend/docs/openapi.json` |

## Deploy (Vercel)

- Framework preset: Vite; build command `npm run build`; output directory `dist`.
- Set `VITE_API_URL` (and `VITE_DEMO_MODE` if wanted) in the project's environment variables.
- `vercel.json` rewrites every path to `index.html`, so deep links such as `/topics/8` or
  `/checkpoint/8` work on reload, and caches the hashed files in `/assets`.
- The backend must allow the deployed origin in CORS. Voice answers need HTTPS
  (browsers only give microphone access on secure origins or `localhost`).

## Structure

```
src/api/        fetch client (token refresh, Uzbek errors), endpoints, generated types
src/components/ design system (ui/), layouts, shared states
src/features/   auth, home, topics (reader), quiz, chat, checkpoint, profile
src/lib/        strings, time, theme, helpers
src/routes/     router, guards, 404 and error screens
```
