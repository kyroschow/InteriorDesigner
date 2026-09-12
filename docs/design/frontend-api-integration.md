# Frontend API integration

Status: the UI talks to the backend in `server/` through `/api/v1`, following [the simplified scope](simplified-scope.md) and the request schemas. There is no mock.

## How it fits together

- Screens call only `src/api/client.ts`.
- `src/types/interior.ts` mirrors the request schema (`schemas/request-bodies.schema.json`) and the server's response shapes: `projects/service.ts` `present`, the `db/store.ts` records and the `rules/engine.ts` report.
- In development, requests go to the same origin and Vite forwards `/api` to `API_PROXY_TARGET` (default `http://127.0.0.1:3001`). The server sends no CORS headers, so a cross-origin `VITE_API_BASE_URL` only works once CORS is added to the server.
- To point at another machine, set `API_PROXY_TARGET` in `.env.local` and restart Vite.

## Screens and endpoints

| Screen / action | Calls |
| --- | --- |
| Create `/setup` | `POST /projects`, then multipart `POST /projects/:id/floor-plan` when uploading. A failed upload keeps the project; Retry reuses it. |
| Workspace load `/projects/:id/*` | `GET /projects/:id`, `GET /furniture`, `GET /rules`, and `GET /projects/:id/layouts/:layoutId` when `activeLayoutId` is set |
| Header: rename, unit toggle | `PATCH /projects/:id` |
| Header: uploaded plan link | `GET /projects/:id/assets/:assetId` (the asset's `downloadUrl`) |
| Rooms: names, categories, wall positions | `PUT /projects/:id/rooms` |
| Furnish: quantities, colors, max size | Client draft, saved with `PUT /projects/:id/configuration` on Next or Apply |
| Room notes: save or clear | `PATCH /projects/:id/rooms/:roomId/note` |
| Brief & apply: prompt, optional budget | Same draft and `PUT` |
| Apply | `PUT /configuration` if the draft is dirty, then `POST /projects/:id/generations` with `Idempotency-Key` |
| Progress, including after a refresh | Poll `GET /projects/:id/generations/:id` for `latestGeneration.id`, then re-read the project |
| Results and Preview | Active layout (`scene`, `placements`, `engineReport`, `rationale`) plus the catalog for images, links and alternatives |
| My Projects `/projects` | `GET /projects/:id` for each project this browser has opened (there is no list endpoint) |

Writes use `expectedRevision`:

- **Our own writes** run one at a time, each using the revision returned by the previous write. A rename committed on blur followed by Save therefore doesn't conflict with itself.
- **A 409 caused by another tab or client** shows "Reload latest" and keeps unsaved drafts.
- **422 responses** show their `details` next to the relevant control.

Geometry is in meters with Y up. `src/lib/sceneCoordinates.ts` converts it once to the renderer's inches with Y down; the unit setting changes labels only.

## Frontend-only behavior

- **Door-facing compass.** Asked on upload (and editable on Rooms), kept per project in `localStorage`. It rotates the drawing under a fixed N/E/S/W compass and never changes stored geometry.
- **Locked walls.** The Rooms screen locks any wall that has a door or doorway on it, because the server rejects moving fixed openings (`OPENING_INVALID`). In `four-room-v1` every interior wall has one, so only names and categories are editable.
- **Alternatives.** Results lists other inventory products of the same type for the room, read-only. The planner owns product choice; to change it, adjust colors, size limits or budget and apply again.

## Gaps worth closing in the API

- **Layout has no `roomTransforms`.** The frontend pairs a layout's `scene` with the project's current transforms. That only works while rooms can't move.
- **No CORS headers.** Browsers must go through a same-origin proxy.
- **No project list endpoint.** "My Projects" is a per-browser list of ids.
