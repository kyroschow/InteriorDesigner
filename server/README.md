# InteriorDesigner backend

Node 24 + TypeScript API for the interior workspace: projects on a demo four-room floor, floor-plan uploads, room edits, furniture configuration, a code safety rules engine, and AI layout generation with the local `qwen3.6-35b-a3b-fp8:latest` model. Design: [`docs/design/simplified-scope.md`](../docs/design/simplified-scope.md).

## Run

Node 24 lives under nvm on this machine:

```bash
export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"
```

```bash
npm --prefix server install
```

```bash
npm run dev:server
```

The API listens on `http://127.0.0.1:3001/api/v1`; the Vite dev server proxies `/api` there. Data (SQLite `app.db`, uploads) goes to `server/data/`. Configuration is via environment variables; see [`.env.example`](.env.example).

## Layout model

`LLM_PROVIDER` selects how the model is reached:

- `openclaw` (default): a dedicated OpenClaw gateway's OpenAI-compatible `/v1/chat/completions`, agent `openclaw/interior`. The token comes from `OPENCLAW_GATEWAY_TOKEN` or `~/.openclaw-interior/openclaw.json`.
- `ollama`: Ollama `/api/chat` directly.
- `none`: API only; generation requests return `503 LLM_UNAVAILABLE`.

The OpenClaw gateway runs under its own profile so the main OpenClaw setup is untouched: `~/.openclaw-interior`, port 18989, a locked-down `interior` agent (minimal tools, thinking off) and Tool Search disabled. Tool Search otherwise hides the backend's client tools from local models and the agent loops until its context overflows. Create or repair it with:

```bash
./scripts/setup-openclaw.sh
```

Check connectivity with one tool call per provider:

```bash
npm --prefix server run smoke:llm
```

## API (`/api/v1`)

| Method and path | Purpose |
| --- | --- |
| `POST /projects` | Create a project on the `four-room-v1` demo floor. |
| `GET /projects/:id`, `PATCH /projects/:id` | Read (scene, configuration, room statuses, active layout) or rename/change units. |
| `POST /projects/:id/floor-plan` | Multipart `file` + `expectedRevision`; PNG/JPEG/WebP/PDF sniffed, 20 MiB max. |
| `GET /projects/:id/assets/:assetId` | Download an uploaded file. |
| `PUT /projects/:id/rooms` | Replace room rectangles/categories; must tile the shell and keep doors on walls. |
| `PATCH /projects/:id/rooms/:roomId/note` | Save a room note (soft preference for the AI). |
| `PUT /projects/:id/configuration` | Prompt, optional budget, furniture requirements, room notes. |
| `GET /furniture` | Catalog, filterable by `roomType`, `objectType`, `color`, `maxPriceMinor`, `maxWidthM`, `maxDepthM`, `maxHeightM`. |
| `GET /rules` | The safety rules and their parameters. |
| `POST /projects/:id/generations` | Start generation (`scope` home or room; optional `Idempotency-Key`); `202` with `statusUrl`. |
| `GET /projects/:id/generations/:gid` | Status, stage, per-turn progress, issues. |
| `GET /projects/:id/layouts/:lid` | Immutable layout: scene with placements, total price, rules report, AI rationale. |
| `GET /health` | Catalog version and model connectivity. |

Writes take `expectedRevision` and return `409` when stale. Request bodies are validated against [`docs/design/schemas/request-bodies.schema.json`](../docs/design/schemas/request-bodies.schema.json) (`422` with `{error: {code, message, details}}`).

## How generation works

The job prepares candidate items per requirement, then runs a tool loop: the model proposes placements with relational anchors (`wall`, `beside`, `facing`, `free`), calls `check_layout` to run the safety rules engine, reads violations and hints, fixes them, and calls `submit_layout`. Only a submit that passes every rule is saved and activated. Code: `src/generation/`, `src/rules/engine.ts`.

## Tests

```bash
npm --prefix server test
```

```bash
LLM_PROVIDER=ollama npm --prefix server run smoke:e2e
```

`smoke:e2e` creates a project, configures a bedroom and bathroom (`SMOKE_SIZE=full` for the whole home), generates with the real model and prints each agent turn.
