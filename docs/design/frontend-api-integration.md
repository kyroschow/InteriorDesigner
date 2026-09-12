# Frontend API integration

Status: implemented against an in-browser mock of `/api/v1`. It follows [the workspace draft](interior-workspace-draft.md) and [the request contracts](request-contracts-and-selection.md). No real backend exists yet.

## How it fits together

- Screens call only `src/api/client.ts`. They never import mock data or check which mode they are in.
- Request types in `src/types/interior.ts` mirror `schemas/request-bodies.schema.json`, field for field.
- Response types follow the draft's Project, Asset, Room, Configuration, Generation and Layout records.
- `src/api/mock/server.ts` is a fetch-compatible transport. It handles the same URLs, methods, JSON and multipart bodies, status codes and error envelope, and returns real `Response` objects.
- The mock is lazy-loaded, in its own build chunk. Live mode never executes it.
- Mock request bodies are validated against the design JSON schema file itself (`src/api/mock/schema.ts`). Changing the schema changes what the mock accepts.
- Mock state lives in `localStorage` under `interior-api-mock-v2`. Delete that key to reset. Uploaded files keep metadata only, so `Asset.downloadUrl` is `null`.
- Mock calls don't appear in the browser Network tab; live calls do.

### Switching to a real backend

Copy `.env.example` to `.env.local`, set the values below, then restart Vite:

```dotenv
VITE_API_MODE=live
VITE_API_BASE_URL=http://localhost:8000   # origin only; the client appends /api/v1
```

Live mode uses native `fetch`, with no fallback to mock data. The backend must allow the frontend origin (CORS). Authentication is out of scope for this MVP.

## Screens and endpoints

| Screen / action | Calls |
| --- | --- |
| Units `/new` | None. Local preference, sent with project creation. |
| Create `/setup` | `POST /projects`, then multipart `POST /projects/:id/floor-plan` when uploading. A failed upload keeps the project, and Retry reuses it. |
| Workspace load `/projects/:id/*` | `GET /projects/:id`, `GET /furniture`, `GET /rules`, and `GET /projects/:id/layouts/:layoutId` when `activeLayoutId` is set |
| Header: rename, unit toggle | `PATCH /projects/:id` |
| Rooms tab: labels, categories, wall positions | `PUT /projects/:id/rooms` |
| Furnish tab: quantities, colors, max size | Kept in a client draft; saved with `PUT /projects/:id/configuration` on Next or Apply |
| Room notes: save or clear | `PATCH /projects/:id/rooms/:roomId/note` |
| Rules tab: prompt, budget, traditions, rules | Same draft and `PUT` as above |
| Apply | `PUT /configuration` if the draft is dirty, then `POST /projects/:id/generations` with `Idempotency-Key` |
| Generation progress, including after a refresh | Poll `GET /projects/:id/generations/:generationId` for `latestGenerationId`, then re-read the project |
| Results tab | Active layout, plus the catalog for read-only alternatives |
| Preview `/projects/:id/preview?layoutId=&roomId=` | `GET /projects/:id`, `GET /projects/:id/layouts/:layoutId` |
| My Projects `/projects` | `GET /projects/:id` for each project this device has opened (the contract has no list endpoint) |

Writes use `expectedRevision`:

- **Our own writes** run one at a time. Each uses the revision returned by the previous write, so, for example, a rename committed on blur followed by Save doesn't 409 against itself.
- **A 409 caused by another tab or client** shows a "Reload latest" action. Unsaved drafts are kept.
- **422 responses** show their `details` next to the relevant control.

Geometry travels in meters with Y up. `src/lib/sceneCoordinates.ts` converts it once to the renderer's inches with Y down, following the draft's formula. The unit setting changes labels only.

## Response fields beyond the draft

These were needed to build the UI. The backend should implement them or propose alternatives.

- **`Project`:**
  - `noteInterpretations[]`: the server-derived note interpretation the request contracts ask GET Project to expose
  - `configurationFindings[]`: rule auto-includes, conflicts, and requirements invalidated by room edits
  - `roomStatuses[]`: `unconfigured | configured | generating | furnished | stale | error`
  - `footprintM`, `floorPlanAsset`, `latestGenerationId`, `mode`
- **`GET /furniture`:** adds `types[]`, the requirement picker's type registry with eligibility and reasons, and `colorFamilies[]`.
- **`GET /rules`:** adds `beliefSystems[]`. Each rule also carries `beliefSystem`.
- **`Layout`:** adds `lines[]`, the purchase lines with price and image snapshots, and `footprintM`.
- **`POST /generations`** without an `Idempotency-Key` returns `400 IDEMPOTENCY_KEY_REQUIRED`.

## Mock simplifications (not backend behavior)

- **Scene.** `four-room-v1` is a 10 × 8 m shell with 2.7 m ceilings, four doors/doorways, four windows, and fixed kitchen and bath fixtures.
  - Wall edits must still tile the shell exactly.
  - Every opening must stay on a wall of its rooms, and every fixture inside its room. Otherwise the edit is rejected, never moved.
- **Catalog.** Normalized from the eight `inventory/*.json` files.
  - Missing dimensions stay `null` and mark the product `needs_review`.
  - Bed size comes only from the description.
  - Chaise and sectional sofas need review.
  - Dining bundles, cabinets and vanities can be browsed but are `unsupported` for generation.
  - Complete dimensions are treated as demo values.
- **Rules.** `npm run rules:index` builds the index from the real library (175 records).
  - Only `FS-CMD-026` has an evaluator: a door-swing check only, not traffic routes.
  - `RM-BEDP-001` is `missing_inputs`.
  - Every other rule is shown disabled with a reason.
- **Notes.** An allowlisted parser covers:
  - object-type prohibitions
  - clearance with an explicit unit and side
  - "only <color>" constraints
  - style/material preferences

  Ambiguous hard statements return `422 ROOM_NOTE_UNRESOLVED` on Apply. Notes that contradict quantities or colors return `ROOM_NOTE_CONFLICT`. It is not a natural-language interpreter.
- **Generation.** A deterministic heuristic stands in for the agent:
  1. Filter candidates by the hard constraints.
  2. Check an aggregate budget lower bound, including rooms a room-only run keeps.
  3. Rank by prompt and note keywords, then by price.
  4. Place against walls, clear of fixtures, door zones, windows (tall pieces) and required clearances.
  5. Re-validate everything.

  It never shrinks furniture or relaxes a requirement. A bounded search failure is reported as `NO_VALID_LAYOUT_FOUND`.

  Jobs move through `queued → selecting → placing → validating` over about 3 seconds. A result activates only if the project's revisions still match and no newer job exists; otherwise the job is `stale` and its layout is kept for inspection.

## Verification

- `npm run typecheck`
- `npm run test:api` runs 13 contract tests: validation, revisions, upload limits, room tiling and fixed elements, configuration semantics, note gating, generation counts/budget/eligibility, idempotency, stale jobs, room-only retention, catalog normalization and rule availability. It uses the esbuild bundled with Vite and adds no dependencies.
- End to end, run by hand: create with upload, move a wall, furnish, add a note, select a rule, Apply, check results, reload, edit a note (the room turns stale), preview one room.
