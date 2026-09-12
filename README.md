# Zenlayout

Furnishing a room is either expensive (hire a designer) or exhausting (measure everything
yourself, browse a dozen furniture sites, guess what fits, build a shopping list by hand).
Zenlayout closes that gap: give it a floor plan, say what furniture you want per room, and an AI
planner lays it out under hard safety rules, with every item matched to a real, purchasable
product and price, plus an exportable plan and shopping list.

See [`PLAN.md`](PLAN.md) for the project plan and
[`docs/design/simplified-scope.md`](docs/design/simplified-scope.md) for the current scope, safety
rules and AI loop.

> **Status:** early prototype. Floor-plan upload is real (the file is stored and downloadable),
> but every project uses the same `four-room-v1` demo layout rather than parsing the upload.

## Running it

The frontend needs the backend in [`server/`](server/) (Node 24; see its README for the model
setup).

```bash
npm install
npm run dev:server   # API on http://127.0.0.1:3001/api/v1
npm run dev          # app on http://127.0.0.1:5273
```

The Vite dev server proxies `/api` to `API_PROXY_TARGET` (default `http://127.0.0.1:3001`). To use a
backend on another machine, put it in `.env.local` (git-ignored) and restart Vite:

```dotenv
API_PROXY_TARGET=http://10.50.14.226:3001
```

The backend sends no CORS headers, so keep `VITE_API_BASE_URL` blank and go through the proxy.
See [`.env.example`](.env.example) and
[`docs/design/frontend-api-integration.md`](docs/design/frontend-api-integration.md).

```bash
npm run typecheck   # tsc -b
npm run build       # production build
```

## Current flow

1. **Units** (`/new`): imperial or metric, for display only.
2. **Create** (`/setup`): name the project, start from scratch or upload a floor plan
   (PNG/JPEG/WebP/PDF, 20 MB).
3. **Furnish** (`/projects/:id`): exact quantities of the eleven furniture types per room (or
   "anywhere"), and per-room notes for colors, sizes and style. The four rooms and their walls are
   fixed by the demo layout.
4. **Brief & apply** (`/projects/:id/rules`): style prompt, optional budget, the safety rules, and
   Apply for the whole home or one room. Progress is polled while the AI planner works.
5. **Results** (`/projects/:id/export`): the saved layout with its safety check, the shopping list
   with real alternatives, and PNG/SVG/PDF export. **Preview** shows the whole home or one room.

## Layout

```
src/
  api/          typed client for /api/v1
  types/        API contracts (mirror server/ and docs/design/schemas)
  hooks/        project loading and generation polling
  lib/          geometry, units, scene → SVG coordinates, plan export
  store/        zustand stores: onboarding draft, recent projects
  components/   floor-plan SVG renderer, requirement rows, notes, findings, shared UI
  screens/      onboarding, the project workspace and its steps, preview
server/         Node + TypeScript API, SQLite, safety rules engine, AI layout loop
inventory/      real product data (name, price, images, dims) per furniture category
interior-rule-library/  design-rule reference docs (not used by the backend)
docs/design/    API contract, request schemas, simplified scope
docs/research/  measured visual tokens that inspired the visual style
```

## Notes and deviations

- Vite + React + TypeScript, Tailwind v4, Zustand. Project data lives on the backend; the browser
  keeps only the unit preference and the recent-projects list.
- Rooms, walls and room names come from the fixed demo layout; the UI doesn't edit them.
- Furniture colors and sizes aren't form fields: describe them in the room notes, which the AI
  planner reads as preferences.
- Layout responses include the scene but not room positions, so the frontend pairs a layout with the
  project's `roomTransforms`. That's safe because the demo shell's rooms never move.
