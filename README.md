# Drafted — local clone

A local, offline reimplementation of **[drafted.ai](https://www.drafted.ai)**, the AI house-plan
generator: build a room list, pick and sculpt a house footprint, then generate complete furnished
floor plans with a 3D massing model.

Reverse-engineered from 108 screenshots of a real session plus public research. See
[`docs/research/`](docs/research/) for the full spec, the forensic screen-by-screen analysis, and
the measured design tokens.

> **On the original:** drafted.ai is **not** open source — it is a closed-source commercial product
> (its GitHub org `drafted-ai` exists but has zero public repositories). Nothing here is derived
> from its source code; everything is reimplemented from observed behaviour. See
> [`docs/research/web-opensource.md`](docs/research/web-opensource.md).

## Running it

Node 22 is required. If it isn't on your `PATH`:

```bash
export PATH="$HOME/.local/node/bin:$PATH"
```

Then:

```bash
npm install
```

```bash
npm run dev
```

The app serves at <http://127.0.0.1:5273>. Everything runs in the browser — no server, no cloud, no
API keys. State persists to `localStorage`.

```bash
npm run build
```

## What it does

The product is a three-step wizard, mirroring the original:

1. **Create Room List** — pick room types from a grouped catalog, set counts and an S/M/L size for
   each, watch the running total area and "Room List Capacity" fill up.
2. **Place Rooms & Shape** — choose a house footprint from a preset library or sculpt one on the
   grid canvas (drag vertices and edges, live dimension labels, snap, mirror, recenter, undo/redo),
   pick a roof shape, and optionally hand-place individual rooms.
3. **Results** — five design variants (A–E) generate independently; review the floor plan, inspect
   the 3D model, choose exterior materials, then "Furnish & Render".

Plus the surrounding app: a studio of projects, a project dashboard with a design library, and a
per-design detail page with a room schedule, area breakdown and file export.

## How the generation works

No cloud model is involved — the plans are produced by a **deterministic geometric solver**:

- The rectilinear footprint is decomposed into rectangles, then recursively subdivided by a
  **slicing tree** whose cuts allocate area in proportion to each room's target size.
- Rooms are assigned to leaves honouring **adjacency preferences** (kitchen beside dining, primary
  bath and closet off the primary bedroom, garage on an exterior wall) and daylight requirements.
- A **scoring function** (area error, aspect ratio, adjacency satisfaction, exterior access,
  circulation) drives a short annealing pass with random restarts.
- Doors, windows and a hallway spine are placed by rule, at real residential dimensions.

Every step is seeded, so variant "C" of a given room list and footprint is always identical.
`Math.random()` is banned in generation code.

## Layout

```
src/
  lib/          units, geometry, seeded RNG, the plan generator, furnishing
  data/         room catalog, shape presets, materials, tutorial script
  state/        zustand store, persistence, selectors
  components/   ui kit, plan renderer (SVG), 3D massing, editor, screens' parts
  screens/      studio, project, the three wizard steps, draft detail
docs/research/  the spec, build plan, forensic screenshot analysis, measured tokens
```

## Notes and deviations

- **Vite + React** rather than the original's Next.js — the clone is browser-only, so a build step
  and a static bundle are all it needs.
- **SVG** for the floor plan rather than the original's Canvas2D (Konva), which gives crisp text at
  any zoom and makes "Download Files" a real `.svg` export for free.
- Fonts are **self-hosted** from npm; there is no Google Fonts request, so the app builds and runs
  air-gapped.
- The original's "Furnish & Render" calls a cloud image model. Here it runs a deterministic
  furnishing pass and draws a furnished plan plus a shaded 3D view. The upgrade/subscription flow
  is a non-functional demo and never collects payment details.
