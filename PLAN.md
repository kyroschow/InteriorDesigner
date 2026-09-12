# InteriorDesigner — Project Plan

An offline-first interior design tool in the spirit of [drafted.ai](https://drafted.ai), narrowed to a
tractable scope: **three pre-loaded floor plans**, per-room **AI furniture layout generation**,
**shoppable furniture matching** (IKEA and similar), and **photorealistic renders** of individual
rooms and the whole home. A **virtual walkthrough** is a stretch goal.

All AI inference runs locally on a **Dell Pro Max with GB10** (NVIDIA Grace Blackwell, 128 GB unified
memory). No third-party inference APIs in the critical path.

> **Update:** the backend is implemented in `server/` with Node + TypeScript and SQLite, not the FastAPI/MongoDB
> stack below. The scope is simplified to four room types, eleven furniture types and a code safety rules
> engine; `interior-rule-library/` is reference material only. See `docs/design/simplified-scope.md`.

---

## Table of contents

1. [Scope and non-goals](#1-scope-and-non-goals)
2. [System architecture](#2-system-architecture)
3. [Core data model (MongoDB)](#3-core-data-model-mongodb)
4. [The three floor plans](#4-the-three-floor-plans)
5. [Layout generation pipeline](#5-layout-generation-pipeline)
6. [Render pipeline](#6-render-pipeline)
7. [Furniture sourcing and shopping](#7-furniture-sourcing-and-shopping)
8. [Virtual tour (stretch goal)](#8-virtual-tour-stretch-goal)
9. [Frontend (web UI)](#9-frontend-web-ui)
10. [Backend API](#10-backend-api)
11. [Local AI stack on the GB10](#11-local-ai-stack-on-the-gb10)
12. [Repository layout](#12-repository-layout)
13. [Milestones](#13-milestones)
14. [Risks and mitigations](#14-risks-and-mitigations)
15. [Open questions](#15-open-questions)

---

## 1. Scope and non-goals

### In scope

| # | Feature | Priority |
|---|---------|----------|
| F1 | Browse 3 pre-loaded floor plans; inspect rooms and their types | P0 |
| F2 | Select a room, pick a style/budget, generate a furniture layout (2D plan + 3D scene) | P0 |
| F3 | Manually nudge/rotate/delete/add furniture after generation | P0 |
| F4 | Photorealistic render of an individual room from a chosen camera | P0 |
| F5 | Shopping list: match each placed item to real purchasable products with price + link | P0 |
| F6 | Whole-home view: all rooms laid out, top-down "dollhouse" render, combined shopping list | P1 |
| F7 | Style consistency across rooms in one project | P1 |
| F8 | Regenerate a single item ("give me a different sofa") without redoing the room | P1 |
| F9 | Virtual tour: 360° panorama per room with doorway hotspots | P2 (stretch) |

### Explicitly out of scope

- Uploading or tracing your own floor plan (only the three curated plans; the schema is generic
  enough to add a fourth later, but no import UI).
- Structural editing — moving walls, doors, windows.
- Multi-user collaboration, sharing links, real-time co-editing.
- Real checkout / cart integration. We produce deep links, not orders.
- Mobile-native apps. Responsive web only.

### Guiding constraints

- **One machine.** Everything (Mongo, API, workers, models) runs on the GB10 box. Design for a single
  GPU with a resident model set, not for horizontal scale.
- **Deterministic fallbacks everywhere.** Every AI step has a rule-based baseline that produces a
  usable (if boring) result. Demos must not depend on a model being in a good mood.
- **Geometry is code, aesthetics are the model.** Spatial correctness comes from a deterministic
  validator; the model contributes taste, variety, and search. Never trust an LLM with collision
  detection.

---

## 2. System architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│  Browser — Next.js 15 (App Router) + React + TS                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌───────────────┐  │
│  │ 2D plan (SVG)│ │ 3D view (r3f)│ │ Shopping list│ │ Tour (PSV)    │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └───────────────┘  │
└───────────────┬────────────────────────────────────────────────────────┘
                │ REST + SSE (job progress)
┌───────────────▼────────────────────────────────────────────────────────┐
│  API — FastAPI (Python 3.12), uvicorn                                  │
│  auth · projects · layouts · renders · catalog search · job dispatch    │
└──────┬──────────────────────────┬──────────────────────┬───────────────┘
       │                          │                      │
┌──────▼──────┐        ┌──────────▼─────────┐   ┌────────▼──────────┐
│  MongoDB 8  │        │  Redis (job queue) │   │ Object store      │
│  documents  │        │  + pub/sub for SSE │   │ (MinIO or FS)     │
└─────────────┘        └──────────┬─────────┘   │ renders, panos,   │
                                  │             │ glTF assets       │
        ┌─────────────────────────┼───────────┐ └───────────────────┘
        │                         │           │
┌───────▼────────┐   ┌────────────▼──────┐  ┌─▼──────────────────┐
│ layout-worker  │   │  render-worker    │  │ catalog-worker     │
│ agent loop     │   │  ComfyUI client   │  │ scrape + embed     │
└───────┬────────┘   └────────┬──────────┘  └─────────┬──────────┘
        │                     │                       │
┌───────▼─────────────────────▼───────────────────────▼──────────┐
│  GB10 model services (resident, long-lived)                     │
│  • LLM server (OpenAI-compatible, JSON-constrained decoding)    │
│  • ComfyUI (SDXL/FLUX + ControlNet, depth→image)                │
│  • Embedding server (SigLIP image + BGE text)                   │
└─────────────────────────────────────────────────────────────────┘
```

### Why this shape

- **FastAPI over Node for the API.** The whole model stack is Python; keeping one language for API and
  workers avoids a second serialization boundary. The frontend is TS, and that's fine — the contract
  between them is OpenAPI-generated types.
- **Workers separate from the API.** Layout generation takes seconds, rendering takes tens of seconds.
  These must not occupy a request thread. Redis + [ARQ](https://arq-docs.helpmanual.io/) (async,
  lightweight) rather than Celery, which is heavier than we need.
- **Model services are long-lived and separate from workers.** Loading FLUX takes ~30 s. Workers are
  thin clients to always-on inference servers, so they can be restarted freely during development.
- **One render worker, concurrency 1.** The GPU is a single resource. Serialize image generation
  explicitly rather than discovering it through OOM.

---

## 3. Core data model (MongoDB)

### Conventions (decide once, enforce everywhere)

- **Units: millimetres, integers.** No floats for geometry. Avoids accumulated error and the
  cm-vs-inch bug class.
- **Plan coordinates:** origin at the floor plan's bottom-left bounding-box corner, `+x` right,
  `+y` up (i.e. standard math orientation, *not* screen orientation). SVG rendering flips `y`.
- **3D coordinates:** three.js is Y-up, so plan `(x, y)` → world `(x, z)` and height is `y`.
  One conversion function, `planToWorld()`, used by both the viewer and the render worker.
- **Rotation:** degrees, counter-clockwise, 0° = the object's "front" faces `+y` in plan space.

### Collections

**`floorplans`** — seeded, read-only at runtime.

```jsonc
{
  _id: "apt_studio_01",
  name: "Cedar Studio",
  description: "38 m² studio, single aspect",
  totalAreaMm2: 38_000_000,
  ceilingHeightMm: 2700,
  bounds: { widthMm: 7200, heightMm: 5400 },
  rooms: [{
    id: "r_main",
    name: "Living / Sleeping",
    type: "living_room",            // enum, see below
    polygon: [[0,0],[7200,0],[7200,4200],[0,4200]],  // CCW, closed implicitly
    areaMm2: 30_240_000,
    floorMaterial: "oak_light",
    walls: [{
      id: "w1", from: [0,0], to: [7200,0], thicknessMm: 120, interior: false,
      openings: [
        { id: "win1", kind: "window", offsetMm: 2400, widthMm: 1800,
          sillMm: 900, headMm: 2200 },
        { id: "d1", kind: "door", offsetMm: 300, widthMm: 900, headMm: 2050,
          swing: "in_left", connectsTo: "r_hall" }
      ]
    }],
    fixtures: [   // immutable built-ins: toilet, sink, stove, bath, counters
      { id: "fx1", type: "kitchen_counter", footprint: [[0,3000],[2400,3000],[2400,3600],[0,3600]],
        heightMm: 900 }
    ],
    focalPoints: [ { kind: "window", ref: "win1" } ]
  }]
}
```

Room type enum: `living_room | bedroom | kitchen | bathroom | dining_room | hallway |
home_office | balcony | utility`. The four the brief names are P0; the rest exist so plan 3 can be
a realistic home.

**`projects`** — one per user design session.

```jsonc
{
  _id: ObjectId, ownerId, floorplanId: "apt_studio_01",
  name: "My studio, Scandi",
  style: { preset: "scandinavian", palette: ["#F4EFE8","#2E3A34"], notes: "lots of plants" },
  budget: { currencyCode: "CAD", totalCents: 450000, perRoomCents: {...} },
  householdHints: { occupants: 2, wfh: true, pets: false },
  activeLayoutByRoom: { r_main: ObjectId("...") },   // pointer to chosen variant
  createdAt, updatedAt
}
```

**`layouts`** — one document per *generated variant*. Never overwritten; the user can flip between
variants and undo is free.

```jsonc
{
  _id, projectId, roomId, variantIndex: 0,
  generator: { model: "qwen3-30b-a3b", promptVersion: "v4", seed: 88123,
               validatorVersion: "1.2", iterations: 2 },
  items: [{
    id: "it_1",
    slotId: "sofa_primary",          // semantic role, stable across regenerations
    category: "sofa_3seat",
    assetId: "3dfuture_0a12...",     // 3D model for the viewport
    footprintMm: { w: 2100, d: 900 },
    heightMm: 820,
    position: [1800, 2600],           // centroid, plan coords
    rotationDeg: 180,
    againstWall: "w3",
    color: "#8C8073",
    productMatchId: ObjectId | null   // filled by the shopping step
  }],
  metrics: {                          // from the validator, surfaced in the UI
    overlapCount: 0, circulationScore: 0.91, wallAlignmentScore: 0.87,
    blockedOpenings: 0, totalScore: 0.89
  },
  status: "ready" | "generating" | "failed",
  createdAt
}
```

**`products`** — the shoppable catalog.

```jsonc
{
  _id, source: "ikea", sourceSku: "80540902", name: "KIVIK",
  category: "sofa_3seat", url: "https://...", imageUrls: [...],
  priceCents: 89900, currencyCode: "CAD", availability: "in_stock",
  dimsMm: { w: 2280, d: 950, h: 830 },
  colorHex: "#9AA0A6", colorName: "Tibbleby beige-grey",
  materials: ["polyester","wood"], styleTags: ["modern","casual"],
  textEmbedding: [0.02, ...],    // 1024-d, BGE-M3
  imageEmbedding: [0.11, ...],   // 768-d, SigLIP
  scrapedAt, checksum
}
```

**`assets`** — 3D models available to the layout generator (decoupled from products; a product may
have no 3D model and vice versa).

```jsonc
{ _id, name, category, glbPath, thumbPath, dimsMm, license: "CC-BY|research-only",
  source: "3D-FUTURE", imageEmbedding: [...] }
```

**`renders`** — `{ _id, projectId, roomId, layoutId, kind: "room"|"dollhouse"|"panorama",
camera: {...}, conditionMaps: {depth, seg}, imagePath, thumbPath, params: {model, steps, cfg, seed},
status, durationMs }`

**`jobs`** — `{ _id, type, payload, status, progress, stage, error, resultRef, startedAt, finishedAt }`

**`shopping_lists`** — `{ _id, projectId, lines: [{ layoutItemId, productId, qty, priceCentsAtMatch,
matchScore, alternatives: [productId] }], totalCents, generatedAt }`

### Indexes

```js
db.products.createIndex({ category: 1, priceCents: 1 })
db.products.createIndex({ name: "text", materials: "text", styleTags: "text" })
db.products.createIndex({ source: 1, sourceSku: 1 }, { unique: true })
db.layouts.createIndex({ projectId: 1, roomId: 1, createdAt: -1 })
db.jobs.createIndex({ status: 1, type: 1 })
db.renders.createIndex({ projectId: 1, roomId: 1 })
```

**On vector search:** MongoDB's `$vectorSearch` is an Atlas feature, not available in a plain local
`mongod`. Two viable paths: (a) run the Atlas CLI local deployment (`atlas deployments setup`, which
brings up `mongod` + `mongot` in containers) or (b) — recommended for our catalog size — keep
embeddings in Mongo and do brute-force cosine similarity in NumPy inside `catalog-worker`, over a
cached matrix. At <50 k products a full scan is ~10 ms. Ship (b); revisit only if the catalog grows
by 100×.

---

## 4. The three floor plans

Chosen to cover distinct layout challenges rather than to look impressive.

| Plan | Description | Rooms | Why this one |
|------|-------------|-------|--------------|
| **A. Cedar Studio** | 38 m² single-aspect studio | 1 open room + bathroom | Tests *zoning* — one space must read as living, sleeping, and dining at once. Hardest layout problem, smallest geometry. |
| **B. Birch Two-Bed** | 78 m² apartment | living, kitchen (open to living), 2 bedrooms, bathroom, hall | The bread-and-butter case. Covers all four named room types cleanly. |
| **C. Maple House** | 125 m², two storeys | living, dining, kitchen, 3 bedrooms, 2 bathrooms, office, stairs | Tests whole-home style consistency, the dollhouse render, and the tour graph across floors. |

Each is authored by hand as a JSON file in `data/floorplans/*.json`, validated against a JSON Schema
in CI, and loaded by `scripts/seed.py`. Authoring a plan takes ~2 hours; do all three in week 1 so the
pipeline is never blocked on content. Draw them on paper first with real dimensions — plausible door
widths (810–910 mm), window sills (900 mm), counter depths (600 mm).

---

## 5. Layout generation pipeline

This is the heart of the project and the part most likely to be judged. The design principle:
**the agent proposes, the validator disposes.** The model searches the space of layouts; a
deterministic geometry engine decides what is legal. The model is never asked whether a layout is
valid, and the validator is never asked what would look good.

```
Room geometry + type + style + budget + user requirements
        │
        ▼
[1] Program synthesis      → what furniture belongs here, and why
        │   (LLM skill, JSON-constrained)
        ▼
[2] Asset binding          → each slot → a concrete asset with real dimensions
        │   (catalog query + embedding rerank)
        ▼
╔══ AGENT LOOP ═══════════════════════════════════════════════╗
║                                                             ║
║  [3] Placement proposal   agent: place_furniture(room, …)   ║
║           │                                          ▲      ║
║           ▼                                          │      ║
║  [4] Validation           validate_layout()          │      ║
║           │                                          │      ║
║           ├── invalid ──▶ violations[] + hints ──────┘      ║
║           │               (max 4 iterations,                ║
║           │                then template fallback)          ║
╚═══════════╪═════════════════════════════════════════════════╝
            │ valid
            ▼
[5] Commit                 commit_layout() → layouts doc + metrics
```

Steps [3] and [4] form the **agent loop** — the core of the ReAct cycle and the thing that makes this
an agent rather than a pipeline. Everything else is a tool it calls.

### [1] Program synthesis

The LLM receives room type, area, dimensions, opening positions, ceiling height, style preset,
budget, and household hints. It emits a **furniture program**:

```jsonc
{ "slots": [
  { "id": "bed_primary", "category": "bed_queen", "importance": "required",
    "rationale": "primary sleeping surface", "budgetShareCents": 120000 },
  { "id": "nightstand_l", "category": "nightstand", "importance": "recommended",
    "relatesTo": "bed_primary", "relation": "flanks_left" },
  { "id": "rug", "category": "rug", "importance": "optional" }
]}
```

Enforced with **constrained decoding against a JSON Schema** (xgrammar/outlines via the inference
server's `guided_json`), so parse failures are structurally impossible. Category values are drawn
from a closed enum — a model that invents `"pouffe_ottoman_thing"` breaks asset binding.

A **template baseline** exists per room type (`services/layout/templates/bedroom.yaml`) listing the
canonical slot set. Build this first; it makes the rest of the pipeline testable early and is the
fallback when the loop fails to converge.

### [2] Asset binding

For each slot: query `assets` by category, filter by "fits in room" (footprint vs. free area), rank by
style-embedding similarity to the project style, sample from the top-k with the layout seed. Binding
before placement matters — the validator needs **real dimensions**, not the model's guess at what a
sofa measures.

### [3] Placement proposal — the agent turn

The agent calls `place_furniture(roomId, items[])`. Placements are **relational, not metric**:

```jsonc
{ "placements": [
  { "slot": "bed_primary", "anchor": { "type": "against_wall", "wallId": "w2",
    "align": "center" }, "facing": "into_room" },
  { "slot": "nightstand_l", "anchor": { "type": "beside", "ref": "bed_primary",
    "side": "left", "gapMm": 50 } },
  { "slot": "wardrobe", "anchor": { "type": "against_wall", "wallId": "w4",
    "align": "end_far_from", "ref": "d1" } }
]}
```

Asking for relations rather than coordinates plays to the model's strength (spatial *semantics*) and
avoids its weakness (arithmetic). A deterministic **relation expander** — not an optimizer — resolves
anchors to exact millimetre coordinates. Relations are also directly explainable in the UI:
*"Bed centred on the long wall, away from the door."*

### [4] Validator (`services/layout/validator/`)

**No optimizer.** The validator only answers "is this layout legal, and if not, why." The agent
performs the search; this component performs the verification. That split removes the simulated
annealer, its scoring weights, and its tuning burden from the critical path — what remains is
geometry predicates over `shapely`, which are fast, deterministic, and genuinely unit-testable.

**Hard constraints** (any violation = invalid):

- No item–item footprint overlap; no item–fixture overlap; all items inside the room polygon.
- Door swing arcs clear; a 900 mm clear path from every door to every other door in the room.
- No item blocking a window below sill height, except explicitly `low_profile` categories.
- Fire egress routes kept clear at full required width.
- Category-specific clearances: 700 mm at least one side of a bed, 900 mm in front of a wardrobe,
  600 mm in front of a toilet and 530 mm side-to-side, 1000 mm between kitchen counter runs,
  450 mm between sofa and coffee table.

**Soft objectives** — scored 0–1 and *returned to the agent as advice*, never enforced:

- Wall alignment for wall-seeking categories; orthogonality to the dominant room axis.
- Circulation: straight-line corridor width between every door pair. (A 100 mm raster flood-fill is
  more rigorous and is the upgrade path, but the corridor test is a fraction of the work and
  sufficient to catch the failures that matter.)
- Focal orientation: seating faces the focal point (window/TV/fireplace); bed headboard not under a
  window.
- Balance: centroid of furniture mass near the room centroid; avoid one empty half.
- Kitchen work triangle (sink–stove–fridge legs each 1.2–2.7 m, perimeter < 8 m) when applicable.

#### Violations must be actionable

This is the highest-leverage detail in the whole loop. A violation that merely names the problem
forces a blind retry; one that names the remedy produces a directed one. Budget real time on the
message formatter — it is worth more than any model upgrade.

```jsonc
{ "valid": false, "violations": [
  { "severity": "hard", "rule": "door_swing_blocked",
    "items": ["wardrobe"],
    "detail": "wardrobe (1200×600) at (3400,2100) overlaps the swing arc of door d1",
    "hint": "wall w4 has a 2800 mm clear span starting at (400,3000)" }
]}
```

Rules for the response envelope:

- **Sort by severity, cap at 5.** An uncapped list lets the agent fix trivia while ignoring the
  blocker, and burns context.
- **Always include a `hint`** naming free space, an alternative wall, or the minimum displacement
  that would clear the violation.
- **Report soft scores alongside**, so a valid-but-poor layout can still be improved if iterations
  remain.

### [5] The loop — convergence and guards

The agent iterates `place → validate → adjust` until valid, then calls `commit_layout()`.

- **Cap at 4 iterations.** On exhaustion, fall back to the template layout for that room. The demo
  must never produce nothing.
- **Pass full attempt history** into each turn. Without it the agent oscillates — moving the wardrobe
  to clear violation A, creating violation B, then moving it back. Seeing what it already tried is
  the cheapest fix for this.
- **Log every attempt** to `jobs.stages`: proposal, violations, and the agent's stated reasoning.
  This is both the debugging record and the demo material — the iteration trace rendered over the
  floor plan (3 violations → 1 → clean) is far more legible to an audience than a chat transcript.
- **Watch latency.** Each iteration is an LLM call, and the GB10 is bandwidth-bound; four iterations
  on a dense large model is a dead demo. This is the argument for the MoE choice in §11.

### User requirements

Users state placement requirements in natural language; the agent parses them into structured
constraints that join the validator's rule set for that room.

```
"the desk should face the window"  →  { type: "faces", item: "desk", target: "win1" }
"keep 1.5 m clear by the door"     →  { type: "clearance", target: "d1", minMm: 1500 }
"seat 12 people"                   →  { type: "capacity", category: "desk", minCount: 12 }
```

Constraints are tiered:

| Tier | Source | Behaviour |
|------|--------|-----------|
| `hard` | Physics, building code, fire egress | Non-negotiable; never relaxed |
| `user_hard` | User said "must" | Enforced; conflict is reported, not silently dropped |
| `soft` | Preferences, style, aesthetics | Scored, not enforced |

**Conflict reporting is the feature.** When `user_hard` constraints cannot be satisfied against
`hard` ones, the agent must surface the trade-off rather than quietly discarding one:

> *"A 6-person meeting table and a desk facing the window don't both fit in 12 m² with code
> clearances. Drop to 4 seats, or move the desk to the side wall?"*

This is what distinguishes an agent reasoning about a problem from a generator producing an artifact,
and it is the behaviour to build the demo around.

### Evaluation

Build this in week 4, not week 11 — it's what turns "looks fine" into a defensible result.

- **Automated:** hard-violation rate, mean circulation score, % of rooms solved within budget,
  wall-alignment score, p50/p95 generation latency. Run over a fixed grid of (room × style × seed) =
  ~120 cases nightly; store to `evals` and chart the trend.
- **Human:** 5-point Likert on realism/usability from 5–8 raters over 20 layouts, ours vs. the
  template baseline vs. (if time) a commercial tool's output. Small n, but it's the honest comparison.

---

## 6. Render pipeline

**Depth-conditioned diffusion.** We already have exact 3D geometry, so we never ask a model to invent
a room — we ask it to *paint* a room whose structure we specify. This is what makes the render match
the layout, which is the whole point.

```
layout + camera
   │
   ▼
[1] Build three.js scene (walls, floor, openings, bound glTF assets)
   │
   ▼
[2] Offscreen render → depth map + normal map + segmentation map (by category)
   │
   ▼
[3] Prompt assembly: style preset + material palette + per-item descriptions + camera framing
   │
   ▼
[4] ComfyUI: SDXL (or FLUX) + ControlNet-depth (+ ControlNet-seg) → 1024×1024
   │
   ▼
[5] Upscale ×2 (4x-UltraSharp or SDXL refiner img2img at low denoise) → 2048×2048
   │
   ▼
renders document + PNG in object store
```

### Where the depth map comes from — two stages

- **MVP (weeks 5–6): client-side capture.** The browser already holds the scene in react-three-fiber.
  Render a depth pass to an offscreen target, read back the pixels, POST as a PNG. Zero server-side
  graphics stack — no EGL, no headless GL on ARM64, no Blender. Ships fast and de-risks the hardest
  environment problem.
- **Final (weeks 8–9): server-side.** Needed for batch rendering (dollhouse, all rooms, panoramas)
  without an open browser. Use `trimesh` + `pyrender` with the EGL backend, or Blender headless if an
  ARM64 build proves usable. **Validate this on day 1 of the hardware setup** — it is the single most
  likely environment blocker in the project (see §14).

### Camera presets

Auto-derive 3 cameras per room rather than making the user fly around: (1) corner view at 1600 mm eye
height, 60° FOV, positioned at the room corner furthest from the main furniture cluster;
(2) doorway view, from just inside the main door; (3) focal view, looking at the focal point. The user
can fine-tune in the 3D viewport and re-render.

### Dollhouse / whole-home render

Orthographic top-down camera, walls clipped at 1200 mm, all rooms' layouts composited. Rendered as a
single large depth-conditioned image (tiled if needed) so the style is consistent across rooms.

### Prompt construction

Templated, not free-form:

```
interior photograph of a {room_type}, {style_preset} style,
{material_palette}, {item_descriptions}, {time_of_day} light from {window_direction},
architectural photography, 35mm, natural light, high detail
Negative: cluttered, distorted furniture, text, watermark, fisheye, people
```

Keep prompt templates versioned in `services/render/prompts/` with the version recorded on each
render, so a regression is traceable to a prompt change.

### Performance targets (single GB10)

| Job | Model | Target |
|-----|-------|--------|
| Room render 1024² | SDXL + ControlNet, 30 steps | 10–20 s |
| Room render 1024² | FLUX.1-dev fp8 + ControlNet, 28 steps | 40–70 s |
| Upscale to 2048² | 4x-UltraSharp + light img2img | 8–15 s |
| Dollhouse 1536² | SDXL + ControlNet | 25–40 s |
| Panorama 4096×2048 | SDXL, 4 tiles + seam blend | 60–120 s |

Measure these in week 5 and put the real numbers back in this table. If FLUX is too slow for
interactive use, offer it as a "high quality" option that queues, with SDXL as the default.

---

## 7. Furniture sourcing and shopping

### Provider abstraction

```python
class FurnitureProvider(Protocol):
    name: str
    def search(self, q: SearchQuery) -> list[RawProduct]: ...
    def fetch(self, sku: str) -> RawProduct | None: ...
```

Implementations: `IkeaProvider`, `WayfairProvider` (if time), and `SeedProvider` — a checked-in JSON
snapshot of ~400 curated products spanning every category we place. **The seed provider is the one
the demo depends on.** Live providers enrich it; they never gate it.

### On IKEA specifically

IKEA publishes no public product API. Practical options, in order of preference:

1. **A curated, cached snapshot** committed to `data/catalog/ikea_seed.json` — gathered once, manually
   verified, with correct dimensions, prices, and product URLs. Stable, fast, demo-safe, and honest
   about what it is.
2. **A community client** such as the `ikea-api-client` package, which wraps IKEA's internal endpoints.
   Useful for refreshing prices/availability. Treat as best-effort: it can break without notice.
3. **Targeted scraping** of product pages. If used: respect `robots.txt`, rate-limit to ≤1 req/s,
   identify the agent honestly, cache aggressively, and **read the site's terms first**. Do not build
   anything whose value depends on redistributing scraped data.

Prices and availability go stale — always display `scrapedAt` next to a price and label it
"last checked". Never imply live stock.

### Matching a placed item to a product

Hybrid scoring against `products`, filtered to the item's category:

```
score = 0.40 · dimension_fit      # penalize > ±15% on any axis; hard-reject > ±30%
      + 0.25 · style_similarity   # cosine(product.imageEmbedding, style reference embedding)
      + 0.20 · color_similarity   # ΔE2000 between product color and the layout item's color
      + 0.15 · budget_fit         # distance to the slot's budgetShareCents
```

Return the best match plus 4 alternatives per item, so the UI can offer a swap. A swap that changes
dimensions re-enters the layout loop for *that room only*, seeded with the existing placement so it
converges in one iteration rather than starting over.

### Budget reconciliation

After matching, the total will overshoot. Reconcile by walking items in ascending `importance` and
swapping to cheaper alternatives until under budget, reporting what was downgraded. Show the user the
trade-off; don't silently pick cheap furniture.

---

## 8. Virtual tour (stretch goal)

**Do not start this before F1–F6 are complete and demo-stable.** Scoped so it can be cut at any point
without leaving debris.

**Approach:** per-room 360° panoramas plus a navigation graph.

1. For each room, place a camera at the centroid of the free-floor area, 1600 mm high.
2. Render a cubemap in three.js (`CubeCamera`), convert to equirectangular 4096×2048.
3. Optionally refine through the diffusion pipeline, tiled with overlap and seam-blended, with the
   left and right edges wrapped so the seam closes. (Naive tiling produces a visible seam — budget
   time for this or skip the refinement and ship the raw 3D panorama.)
4. Build a tour graph: nodes = rooms, edges = shared doors. Hotspot position on the panorama is
   derived from the door's bearing from the camera.
5. View with [Photo Sphere Viewer](https://photo-sphere-viewer.js.org/) + its markers/virtual-tour
   plugins. No custom viewer code.

**Cheaper fallback** if time is short: first-person WASD navigation of the existing three.js scene
with collision against the wall polygons. Perhaps two days of work, and it demos well even though it
isn't photorealistic. Decide at the week-10 checkpoint.

---

## 9. Frontend (web UI)

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind + shadcn/ui · react-three-fiber + drei ·
TanStack Query (server state) · Zustand (viewport/editor state) · Photo Sphere Viewer (tour) ·
`openapi-typescript` to generate API types from the backend's OpenAPI schema (single source of truth
for the contract — never hand-write request/response types).

### Screens

1. **Home / plan picker** — three cards, each a plan thumbnail with room count and area. Pick one →
   create a project. Style preset and budget chosen here, editable later.
2. **Project workspace** — the main screen, three panes:
   - *Left:* room list with per-room status (empty / generating / laid out / rendered) and a progress
     indicator driven by SSE.
   - *Centre:* tabbed viewport — **2D Plan** (SVG, furniture as top-down footprints, drag to move,
     rotate handle, snap-to-wall, live collision highlighting) / **3D** (r3f, orbit + walk modes) /
     **Render** (the generated image, with a "regenerate" control and camera picker).
   - *Right:* inspector — selected item's properties, its matched product with price and link,
     alternatives carousel, "regenerate this item" button.
3. **Generate dialog** — room type (pre-filled), style, budget, "variants: 1–3", advanced (seed, model).
   Shows live stage progress: *program → assets → placement → solving → done*.
4. **Shopping list** — grouped by room, with per-room and total cost, retailer badges, quantity,
   "swap" per line, CSV export, and a prominent "prices last checked {date}" notice.
5. **Whole-home view** — dollhouse render, per-room thumbnails, one-click "render all remaining".
6. **Tour** (P2) — full-screen panorama viewer with doorway hotspots and a minimap.

### Interaction principles

- **Optimistic 2D, authoritative server.** Dragging furniture updates locally at 60 fps and validates
  client-side against the same constraint rules (share the rule definitions as a JSON spec consumed by
  both TS and Python). PATCH on drop; server is the arbiter.
- **Every long operation is a job with visible stages.** A 60-second render with no feedback reads as
  a hang. SSE stream per job, with per-stage labels.
- **Variants, not overwrites.** Generation produces new `layouts` docs; the UI offers A/B/C. Nothing
  the user did is ever destroyed by a regeneration.
- **Explain the AI's reasoning.** Surface the `rationale` from the program synthesis step in the
  inspector. It costs nothing to store and it's the difference between a toy and a tool.
- **Accessibility:** keyboard-operable 2D editor (arrow keys nudge 10 mm, shift+arrows 100 mm),
  focus-visible on all controls, and never encode information in colour alone in the plan view.

---

## 10. Backend API

FastAPI, `/api/v1`, OpenAPI schema published at `/api/v1/openapi.json` and consumed by the frontend
codegen. Long operations return `202 Accepted` with a job id.

```
GET    /floorplans                              → list (3 items, cached)
GET    /floorplans/{id}                         → full geometry

POST   /projects                                → {floorplanId, name, style, budget}
GET    /projects/{id}
PATCH  /projects/{id}                           → style, budget, activeLayoutByRoom
DELETE /projects/{id}

POST   /projects/{id}/rooms/{roomId}/layouts    → 202 {jobId}   (body: {variants, seed?, style?})
GET    /projects/{id}/rooms/{roomId}/layouts    → variants, newest first
GET    /layouts/{layoutId}
PATCH  /layouts/{layoutId}/items/{itemId}       → move/rotate/delete; re-validates, returns metrics
POST   /layouts/{layoutId}/items                → add an item from the asset catalog
POST   /layouts/{layoutId}/items/{itemId}/reroll→ 202 {jobId}  (swap one item, keep the rest)

POST   /layouts/{layoutId}/renders              → 202 {jobId}  (body: {camera, quality, depthMap?})
GET    /renders/{renderId}
POST   /projects/{id}/renders/dollhouse         → 202 {jobId}

POST   /projects/{id}/shopping-list             → 202 {jobId}  (match all placed items)
GET    /projects/{id}/shopping-list
POST   /shopping-list/{id}/lines/{lineId}/swap  → {productId}; may re-solve the room
GET    /products?category=&q=&maxPriceCents=&limit=

POST   /projects/{id}/tour                      → 202 {jobId}   (P2)
GET    /projects/{id}/tour

GET    /jobs/{jobId}                            → status snapshot
GET    /jobs/{jobId}/events                     → SSE: {stage, progress, message, result?}
GET    /healthz                                 → API + Mongo + Redis + model services
```

**Auth:** JWT bearer, with a `SINGLE_USER_MODE=true` env flag that mints a fixed dev identity. Auth is
not the interesting part of this project; make it correct, small, and forgettable.

**Validation:** Pydantic v2 models for every request and response, shared with the worker payloads.
Geometry types (`PointMm`, `Polygon`, `RoomSpec`) live in a `packages/schemas` directory generated to
both Pydantic and TypeScript, so the floor plan schema is defined exactly once.

---

## 11. Local AI stack on the GB10

### Hardware

Dell Pro Max with GB10 — NVIDIA GB10 Grace Blackwell Superchip: 20-core Arm CPU
(10 × Cortex-X925 + 10 × Cortex-A725), Blackwell GPU with 5th-gen Tensor Cores and FP4 support,
**128 GB unified LPDDR5X** shared between CPU and GPU, ConnectX-7 networking, DGX OS (Ubuntu-based).
*Confirm exact memory bandwidth and driver/CUDA versions on the actual unit and record them here.*

Two consequences shape every model choice:

- **Capacity is abundant, bandwidth is not.** 128 GB means very large models *fit*; the LPDDR5X
  bandwidth (~273 GB/s, roughly an order of magnitude below an H100) means dense large models
  *generate slowly*. Token throughput for a dense model is bandwidth-bound at roughly
  `bandwidth / active_bytes_per_token`.
- **Therefore: prefer Mixture-of-Experts.** An MoE with 3–6 B active parameters reads a fraction of
  its weights per token, turning a bandwidth problem into a capacity problem — which is exactly the
  resource this machine has in surplus. This is the single most important model-selection insight for
  this hardware.
- **It is ARM64 (aarch64), not x86.** Every container image, wheel, and binary must have an arm64
  build. Prefer NVIDIA's NGC containers, which are built for the platform.

### Model selection

| Role | Recommendation | Fallback | Approx. footprint |
|------|---------------|----------|-------------------|
| Layout reasoning (steps 1 & 3) | **Qwen3-30B-A3B** (MoE, ~3 B active), 4-bit | Qwen2.5-14B-Instruct | ~18 GB |
| Layout reasoning, quality tier | **gpt-oss-120b** (MoE, ~5 B active), MXFP4 | — | ~60 GB |
| Room render | **SDXL + ControlNet-depth** | — | ~10 GB |
| Render, quality tier | **FLUX.1-dev** fp8 + ControlNet | SDXL refiner | ~14 GB |
| Upscale | 4x-UltraSharp ESRGAN | Lanczos | <1 GB |
| Text embeddings | BGE-M3 (1024-d) | all-MiniLM-L6 | ~2 GB |
| Image embeddings | SigLIP-so400m (768-d) | CLIP ViT-L/14 | ~2 GB |

Total resident footprint with the default tier: **~35 GB of 128 GB** — everything stays loaded
simultaneously, so there is no model-swap latency between pipeline stages. That headroom is the real
advantage of this box; use it by keeping *all* services warm rather than by running one enormous model.

### Serving

- **LLM:** `vLLM` if an aarch64 build works (gives `guided_json` constrained decoding via xgrammar —
  strongly preferred). Otherwise `llama.cpp` server with GBNF grammars, which also gives schema
  enforcement and has excellent ARM + CUDA support. Ollama is the quickest thing to get running on
  day 1; treat it as a bring-up tool, not the final answer.
- **Diffusion:** **ComfyUI** in API mode. Workflows are authored in the GUI, exported as API JSON to
  `services/render/workflows/`, and submitted over `POST /prompt`. This avoids writing and maintaining
  a bespoke diffusers pipeline, and ControlNet/upscaler/tiling nodes already exist and work together.
- **Embeddings:** a small FastAPI wrapper over `sentence-transformers` + `open_clip`, batch endpoint,
  loaded once.
- Everything behind `docker compose`, with a `models/` volume mounted from the host so image rebuilds
  don't re-download 60 GB of weights.

### Fine-tuning (optional, only if the baseline underperforms)

If prompting plus the validator produces weak *programs* (wrong furniture for a room), a LoRA on the
layout LLM is the targeted fix. Training data: **3D-FRONT** — ~19 k professionally designed indoor
scenes furnished with **3D-FUTURE** models — converted into (room geometry → furniture program)
pairs. 3D-FRONT/3D-FUTURE is also the recommended source for the `assets` collection; note its
license is research/non-commercial, which suits a course project but must be stated in the report.
A LoRA on ~5 k examples is a few hours on this hardware. **Budget this only if week-6 evaluation shows
the prompted baseline failing** — it is the classic way to lose three weeks.

### Day-1 environment validation checklist

Run this before writing application code; each line is a known ARM64 risk:

```
[ ] nvidia-smi reports the GPU, driver, and CUDA version
[ ] PyTorch aarch64 + CUDA wheel imports and runs a matmul on device
[ ] ComfyUI starts, loads SDXL, generates a 1024² image; record the time
[ ] ControlNet-depth node produces a depth-conditioned image
[ ] LLM server starts, serves an OpenAI-compatible completion, honours a JSON schema
[ ] MongoDB 8 arm64 starts and accepts writes
[ ] Offscreen GL: pyrender/EGL renders a depth map headlessly   ← highest-risk item
[ ] docker compose brings the whole stack up from cold
```

---

## 12. Repository layout

```
InteriorDesigner/
├── PLAN.md
├── README.md
├── docker-compose.yml
├── Makefile                       # make dev / seed / eval / test
├── data/
│   ├── floorplans/                # 3 hand-authored plans + JSON Schema
│   ├── catalog/ikea_seed.json     # demo-safe product snapshot
│   └── assets/                    # glTF furniture + thumbnails (git-lfs)
├── packages/
│   └── schemas/                   # single source of truth → Pydantic + TS
├── apps/
│   └── web/                       # Next.js frontend
│       ├── app/ components/ lib/
│       └── components/viewport/   # SVG plan editor, r3f scene, depth capture
├── services/
│   ├── api/                       # FastAPI: routers, models, db, auth, jobs
│   ├── layout/
│   │   ├── program.py             # step [1]
│   │   ├── binding.py             # step [2]
│   │   ├── placement.py           # step [3]: relation expander (no optimizer)
│   │   ├── validator/             # step [4]: predicates, scoring, violation formatter
│   │   ├── loop.py                # step [5]: iteration, history, convergence guards
│   │   ├── templates/             # per-room-type baselines
│   │   └── prompts/               # versioned
│   ├── render/
│   │   ├── scene.py               # layout → 3D scene → condition maps
│   │   ├── comfy.py               # ComfyUI API client
│   │   ├── workflows/             # exported ComfyUI API JSON
│   │   └── prompts/
│   ├── catalog/
│   │   ├── providers/             # ikea.py, seed.py, base.py
│   │   ├── matcher.py             # hybrid scoring
│   │   └── embed.py
│   └── worker/                    # ARQ entrypoints, one queue per model
├── scripts/                       # seed.py, download_models.sh, export_assets.py
├── eval/                          # harness, fixture cases, report generator
└── tests/                         # unit (validator!), integration, e2e (Playwright)
```

**Test emphasis:** the validator gets real unit tests with hand-computed expected geometry — it's
deterministic, it's the correctness core, and it's the one component where a bug is invisible in a
screenshot. A validator that wrongly reports *valid* is the worst failure in the system: the loop
terminates happily on a broken layout. Aim for meaningful coverage there and smoke tests elsewhere.

---

## 13. Milestones

Twelve weeks, phrased as outcomes rather than tasks. Each phase ends with something demonstrable.

### Phase 0 — Foundations (week 1)
Repo scaffolded; docker-compose with Mongo + Redis + API + web; day-1 GB10 validation checklist
green; all three floor plans authored, schema-validated, and seeded; 2D SVG plan renders the seeded
geometry in the browser.
**Done when:** you can click a plan on the home page and see its rooms drawn to scale.

### Phase 1 — Deterministic layouts (weeks 2–3)
Template layouts per room type; the full validator with hard constraints, soft scoring, and the
actionable violation formatter; relation expander; 2D editor with drag/rotate/snap and live collision
feedback; layouts persisted as variants.
**Done when:** every room in all three plans gets a valid, violation-free furnished layout with zero
AI involved. *This is the project's safety net — nothing later is allowed to regress it.*

### Phase 2 — AI layout generation (weeks 4–5)
LLM program synthesis and coarse placement with constrained decoding; asset binding from the catalog;
validation/repair loop; variants and seeds; evaluation harness with the ~120-case grid and a nightly
report.
**Done when:** AI layouts beat the template baseline on circulation score and human preference, with
numbers to show for it.

### Phase 3 — Rendering (weeks 6–7)
Client-side depth capture; ComfyUI SDXL + ControlNet-depth pipeline; auto camera presets; render
gallery in the UI; job progress over SSE.
**Done when:** any room renders photorealistically and the render visibly matches its layout.

### Phase 4 — Shopping (week 8)
Seed catalog ingested and embedded; hybrid matcher; shopping list UI with swaps, alternatives, budget
reconciliation, and CSV export; IKEA live provider as best-effort enrichment.
**Done when:** a furnished room produces a shopping list you could actually buy from.

### Phase 5 — Whole home (weeks 9–10)
Server-side headless rendering; dollhouse render; render-all-rooms batch; cross-room style
consistency; combined shopping list and budget across the home.
**Done when:** plan C (Maple House) is fully furnished, rendered, and costed end to end in one run.

### Phase 6 — Polish, then tour if it fits (weeks 11–12)
Performance pass, error states, empty states, loading skeletons, full demo rehearsal, README, final
report, recorded walkthrough. **Only then**, and only if the schedule holds, the panorama tour —
with the WASD walkthrough as the cheaper substitute.
**Done when:** a stranger can use the app without narration.

**Checkpoints:** end of week 6 — go/no-go on LoRA fine-tuning. End of week 10 — go/no-go on the
panorama tour vs. the WASD fallback vs. cutting F9 entirely.

---

## 14. Risks and mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| **ARM64 toolchain gaps** (no wheel, no arm64 image, headless GL) | High | High | Day-1 validation checklist; prefer NGC containers; client-side depth capture removes the headless-GL dependency for the MVP |
| Headless offscreen rendering won't work on the box | Medium | Medium | Client-side capture for single renders; if server-side never works, batch jobs drive a headless Chromium instead |
| LLM emits spatially nonsensical placements | Medium | High | Relational (not metric) output; validator is authoritative; agent loop re-proposes against actionable violations; template fallback |
| Agent loop oscillates or fails to converge | Medium | Medium | Full attempt history in context; 4-iteration cap; template fallback; violation `hint` field makes retries directed rather than blind |
| Renders don't match the layout | High | Medium | Depth + segmentation conditioning, not text-only; ControlNet strength tuned per room type; visual regression fixtures |
| IKEA data access breaks or is disallowed | Medium | High | Committed seed catalog is the demo path; live providers are strictly enrichment; review terms before scraping |
| Too few quality 3D assets | Medium | Medium | 3D-FUTURE as the primary source; parametric box proxies with correct dimensions as a floor — a correct grey box beats a beautiful wrong-sized chair |
| Generation too slow to feel interactive | Medium | Medium | MoE model choice; keep all services resident; SDXL default with FLUX as a queued quality tier; stage-level progress so waiting is legible |
| Scope creep into the virtual tour | High | High | Hard gate: F9 cannot start before F1–F6 are demo-stable; documented cheap fallback |
| Single machine is a single point of failure | High | Low | Nightly `mongodump` + asset rsync to another host; CPU-only dev mode with stubbed model responses so frontend work continues if the box is down |

---

## 15. Open questions

1. **Team size and split.** The phases assume 2–3 people (frontend / layout+AI / render+catalog). Solo
   changes the plan: cut plan C to a single storey and drop F6's dollhouse.
2. **Region and currency for pricing** — affects which IKEA catalog to snapshot. Default: CAD / Canada.
3. **Is the GB10 box shared or dedicated?** A shared machine breaks the "keep everything resident"
   assumption and changes model choices.
4. **Deliverable format** — is there a required report, poster, or demo video? Phase 6's budget
   depends on it.
5. **Metric vs. imperial in the UI.** Storage is mm regardless; display is a toggle. Confirm the
   expected default.
6. **Does the evaluation need a human study with ethics approval?** If so, start that paperwork in
   week 2, not week 10.
