# Zenlayout

Furnishing a room is either expensive (hire a designer) or exhausting (measure everything
yourself, browse a dozen furniture sites, guess what fits, build a shopping list by hand).
Zenlayout closes that gap: give it a floor plan, say what furniture you want per room, and it
generates a laid-out plan that follows real arrangement conventions — chairs surround the dining
table, seating faces the TV, nightstands flank the bed — with every item matched to a real,
purchasable product and price, plus an exportable plan and shopping list.

See [`PLAN.md`](PLAN.md) for the full project plan (scope, architecture, the eventual local-AI
generation pipeline) and [`docs/design/interior-workspace-draft.md`](docs/design/interior-workspace-draft.md)
for the current backend/API contract draft.

> **Status:** this is an early prototype. Floor-plan upload is real (the file is kept and shown),
> but every project currently loads the same hardcoded demo plan (Birch Two-Bed) rather than
> actually parsing the upload — see PLAN.md and the design draft for what's MVP vs. later work.
> Furniture placement is a deterministic rule-based packer today, not the AI agent PLAN.md
> describes; see `src/lib/furniturePlacement.ts` for exactly which relationships it currently
> encodes (and doesn't).

## Running it

```bash
npm install
npm run dev
```

The app serves at <http://127.0.0.1:5273>. Everything runs in the browser — no server, no cloud,
no API keys yet. The unit-system preference persists to `localStorage`; nothing else does.

```bash
npm run typecheck   # tsc -b
npm run build        # production build
```

## Current flow

1. **Units** (`/new`) — imperial or metric, sets display across the project.
2. **Create** (`/setup`) — start from scratch or upload a floor plan (PNG/JPEG/WebP/PDF accepted
   and previewed); uploads also ask which way the front door faces, to orient the compass on the
   plan. Either path loads the same demo layout today.
3. **Workspace** (`/project`) — per room, pick furniture types and quantities from the real
   catalog, plus a freeform note (captured, not yet read by anything).
4. **Design rules** (`/project/rules`) — Safety / Feng Shui, captured but not yet applied to
   placement.
5. **Generate → Export** (`/project/export`) — the deterministic packer lays out the furniture,
   matches items to real inventory products where the catalog covers them, and shows a shopping
   list (price, image, buy link) alongside a PNG-exportable plan.

## Layout

```
src/
  lib/          geometry, units, the floor-plan model, the furniture packer, PNG export
  data/         the one hardcoded floor plan, the furniture catalog, the real IKEA inventory
  store/        zustand stores — onboarding choices, furniture quantities/notes/product picks
  components/   floor-plan SVG renderer, shared UI (cards, steppers, staged-loading overlay)
  screens/      the wizard steps + the project workspace and its steps
inventory/      real product data (name, price, images, dims) per furniture category
interior-rule-library/  the design-rule source docs (feng shui, vastu, style packs, per-room)
docs/design/    current backend/API contract drafts, ahead of implementation
docs/research/  measured visual tokens from drafted.ai — this project's visual style is inspired
                by it (fonts, palette approach), but the generation logic is not a clone of it
```

## Notes and deviations

- **Vite + React + TypeScript**, Tailwind v4, Zustand — no backend yet; PLAN.md's FastAPI +
  worker + local-model architecture is the target, not the current state.
- Visual language borrows from `docs/research/` (measured from drafted.ai screenshots) for
  typography/token approach only — this app does not reimplement drafted.ai's room-list wizard,
  footprint sculpting, or geometric floor-plan solver, and has no plan to.
- Room-appropriateness and a few placement relationships (table/chairs, seating/TV,
  nightstands/bed) are hand-coded rules today, not agent reasoning — see the module doc comment
  in `src/lib/furniturePlacement.ts` for the honest boundary of what that does and doesn't cover.
