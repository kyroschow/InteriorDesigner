# Interior workspace: backend API and frontend component draft

Status: proposed implementation contract, based on the current source. No endpoints or components below are implemented by this document.

See [request schemas, inventory selection and room notes](request-contracts-and-selection.md) for the expanded contract and machine-readable request schemas. That extension uses the existing `inventory/*.json` catalogs and supersedes the illustrative furniture fixtures below.

## Current frontend

| Existing file | Actual behavior | Required change |
| --- | --- | --- |
| `src/App.tsx` | Routes `/`, `/setup`, `/project` | Add project-ID workspace and preview routes. |
| `src/screens/UnitsScreen.tsx` | Chooses imperial/metric | Reuse; persist preference on the project. |
| `src/screens/CreateScreen.tsx` | Selects scratch/upload; accepts PNG, JPEG, WebP, PDF; navigates directly to placeholder | Retain the actual `File`, submit project/upload requests, show errors and pending state, navigate after success. |
| `src/screens/ProjectStub.tsx` | Displays onboarding choices | Replace with workspace. No project is actually created today. |
| `src/components/StepHeader.tsx` | Shared onboarding heading | Reuse for room-definition flow. |
| `src/components/OptionCard.tsx` | Radio-style choice | Reuse for mutually exclusive options; use checkboxes for rules. |
| `src/main.tsx` | React root, strict mode, browser router | Existing entry point can remain. |
| `src/store/onboardingStore.ts` | Persists only unit preference; upload contains name and object URL | Add transient file state; keep server project state separate. |
| `src/lib/geometry.ts`, `src/lib/units.ts` | Geometry in inches, Y down; formatting currently imperial | Add API coordinate adapter and metric display formatting. |

The README describes a much larger application than the TSX currently implements. This draft uses the source as the baseline. The upload URL cleanup effect captures the initial file and does not reliably clean up subsequent URLs; manage URL ownership with file replacement/unmount cleanup when implementing upload.

## Proposed user flow and MVP assumptions

1. Choose units and upload a floor plan. Store the original file, but load a named, deterministic demo layout. Show “Demo layout — uploaded plan is not analyzed yet.” Scratch mode may load the same demo, with matching copy.
2. Confirm/edit room boundaries and categories, with a fixed ceiling height of **2.7 m**. Start with four rectangular rooms; support shared partition dragging or numeric partition inputs, keeping the outer footprint fixed.
3. Open the apartment/house overview. Show every room label, area, and configuration status. Selecting a room opens its settings; configured rooms show any saved furniture placements.
4. Configure furniture types and exact quantities, prompt, budget, allowed colors, maximum dimensions, and selected library rules. Requirements may target a room or let the agent choose an appropriate room across the home.
5. Apply saves the brief and starts generation. Show progress, then validated placements or an actionable explanation of why the requirements cannot be met.
6. Preview the entire home or one room using the same SVG renderer, showing simple furniture footprints and orientation. Configuration alone does not fabricate furniture: until generation succeeds, show “Configured — awaiting generation.”

MVP scope: one floor, four categories, fixed demo shell/openings, JSON inventory, editable room partitions and labels, asynchronous furniture generation, 2D preview. Automatic plan extraction, arbitrary wall drawing, 3D, photorealistic rendering, inventory administration, and user-authored rule parameters are later work.

## Data and coordinate contract

Use the rule library's canonical `Floor`, `Room`, and `Object` scene records from `interior-rule-library/00-foundation/SPEC-CONTRACT.md`. Project/configuration/job records are application envelopes around that scene, not replacement engine types.

| Record | Proposed fields |
| --- | --- |
| Project | `id`, `name`, `unitSystem`, `revision`, `layoutSource: demo`, `demoLayoutId`, `floorPlanAssetId`, `floor`, `roomTransforms`, `configuration`, `activeLayoutId`, timestamps |
| Asset | `id`, `name`, `mimeType`, `sizeBytes`, `downloadUrl` |
| Room | Canonical room fields including `id`, `type`, `polygon`, `ceiling_height_m`, walls/openings/features/objects; app metadata adds `label` |
| Configuration | `revision`, `prompt`, `budget`, `requirements[]`, `selectedRuleIds[]`, `enabledBeliefSystems[]`, `roomInstructions[{roomId, note}]` |
| Requirement | `id`, `objectType`, `quantity`, `roomId: string or null`, `allowedColors[]`, optional `maxDimensionsM: {w,d,h}` |
| Generation | `id`, `projectId`, input project/configuration revisions, catalog/rule versions, `status`, `stage`, `layoutId`, `issues[]` |
| Layout | `id`, input revisions, canonical scene with placed objects, `requirementAssignments[]`, `totalPriceMinor`, `currency`, `findings[]`, `explanations[]` |

Canonical room types map UI categories as follows:

| UI category | Engine `Room.type` |
| --- | --- |
| Living room | `living_room` |
| Bedroom | `bedroom_primary` (MVP default; secondary/guest subtypes later) |
| Kitchen | `kitchen` |
| Bathroom | `bathroom_full` |

API geometry uses meters to three decimals, room-local Y up, Z up. Define the otherwise ambiguous object pose origin as the footprint center, with `z` at its base. `rot` is clockwise from canonical front +Y, as in the library contract. Room transforms place local geometry in floor space; MVP transforms are translation only. Do not infer true compass north from drawing orientation.

For the existing frontend helper convention, convert floor points with `xIn = xM / 0.0254`, `yIn = (floorHeightM - yM) / 0.0254`; invert this at the API boundary, rounding only on submission. Transform room-local coordinates into floor space first. Reflect all polygon points, door swings, furniture corners and facing vectors consistently. Do not pass a Y-up rotation directly to a Y-down SVG without transforming its canonical front. Unit preference changes labels, never stored geometry.

Demo fixture: floor 10 m × 8 m, height 2.7 m; living room origin `(0,0)` size `6 × 4`, kitchen `(6,0)` size `4 × 4`, bedroom `(0,4)` size `6 × 4`, bathroom `(6,4)` size `4 × 4`. Each room polygon starts at local `(0,0)`. Add explicit demo doors/windows and fixed kitchen/bath fixtures; record their demo provenance. Shared partition edits must update both neighboring rooms and keep openings on valid walls.

## Backend endpoints

Base path: `/api/v1`. JSON unless specified. `projectId`, `generationId`, etc. are opaque IDs. The MVP can be single-user locally; ownership checks are required before exposing stored uploads/projects to multiple users.

| Method and path | Request | Response / purpose |
| --- | --- | --- |
| `POST /projects` | `{name, unitSystem, mode: "upload" or "scratch", demoLayoutId: "four-room-v1"}` | `201` full Project, revision 1 and initialized demo floor. |
| `POST /projects/:projectId/floor-plan` | Multipart `file`, `expectedRevision` | `201` Asset; attach original file and increment project revision. Demo geometry stays explicitly identified as demo data. |
| `GET /projects/:projectId` | — | `200` full Project, including scene, saved configuration, current layout reference and per-room derived status. Supports refresh/deep linking. |
| `PATCH /projects/:projectId` | `{expectedRevision, name?, unitSystem?}` | `200` updated Project; metadata only. |
| `PUT /projects/:projectId/rooms` | `{expectedRevision, rooms, roomTransforms}` | `200` updated Project. Atomically replace/edit room geometry/categories, validate partitions, and invalidate affected layouts. |
| `PATCH /projects/:projectId/rooms/:roomId/note` | `{expectedRevision, note}` | `200` updated Project; save a room-specific note into configuration and invalidate stale results. |
| `GET /furniture` | Optional `roomType`, `objectType`, `color`, `maxPriceMinor`, `maxWidthM`, `maxDepthM`, `maxHeightM` | `200 {version, currency, items[]}`. Return all matches for the small MVP catalog. |
| `GET /rules` | Optional `roomType` | `200 {version, items[]}` with applicability and availability; drives rule multi-select. |
| `PUT /projects/:projectId/configuration` | `{expectedRevision, configuration}` | `200` updated Project, normalized configuration and validation findings. Complete replacement; empty arrays clear selections. |
| `POST /projects/:projectId/generations` | `{expectedRevision, configurationRevision, scope: {kind: "home"} or {kind: "room", roomId}}`; `Idempotency-Key` header | `202 {generationId, status: "queued", statusUrl}`. Snapshot saved geometry, configuration, catalog and rules. |
| `GET /projects/:projectId/generations/:generationId` | — | `200` Generation with stage, findings and resulting layout ID. Poll until terminal state. |
| `GET /projects/:projectId/layouts/:layoutId` | — | `200` immutable full Layout; serves whole-home and individual-room preview. |

No separate image-render endpoint is needed: React renders the scene as SVG. A room preview filters the same layout by room ID. PDF/image export can be added later.

Uploads: accept the four existing MIME types, enforce a proposed 20 MB limit, validate content server-side, and return `413` for too large or `415` for unsupported content. If upload fails after project creation, retain the project ID and retry upload without creating another project. Keep the file available until upload succeeds; browser object URLs are never backend asset identifiers.

Writes use `expectedRevision`; return `409` when stale so the frontend can reload before retrying. `POST /generations` returns the original job for an identical idempotency key/payload; conflicting reuse returns `409`. Unknown IDs return `404`. Validation errors return `422`:

```json
{
  "error": {
    "code": "INVALID_CONFIGURATION",
    "message": "A bed cannot be assigned to the kitchen.",
    "details": [
      {"path": "requirements[0].roomId", "code": "ROOM_TYPE_MISMATCH", "requirementId": "req-bed"}
    ]
  }
}
```

Example configuration (inside the configuration PUT request):

```json
{
  "expectedRevision": 3,
  "configuration": {
    "prompt": "A calm home with light wood and neutral upholstery.",
    "budget": {"amountMinor": 300000, "currency": "USD"},
    "requirements": [
      {"id": "req-bed", "objectType": "sleep.bed.queen", "quantity": 1, "roomId": null, "allowedColors": ["natural"], "maxDimensionsM": {"w": 1.7, "d": 2.2, "h": 1.3}},
      {"id": "req-sofa", "objectType": "seating.sofa.three_seat", "quantity": 1, "roomId": "room-living", "allowedColors": ["beige"]}
    ],
    "selectedRuleIds": [],
    "enabledBeliefSystems": [],
    "roomInstructions": [
      {"roomId": "room-living", "note": "Prefer light wood."},
      {"roomId": "room-kitchen", "note": ""},
      {"roomId": "room-bedroom", "note": "No TV in this room."},
      {"roomId": "room-bathroom", "note": ""}
    ]
  }
}
```

An empty rule selection still enforces baseline geometry and requirement validation. A zero quantity excludes that type in the stated scope; reject overlapping/conflicting requirements. For MVP, the agent may only add requested types, in exact quantities. `roomId: null` permits room assignment; it does not permit changing the requested quantity. Colors and dimension limits are hard filters when supplied; free-text style is a preference. Budget is a hard whole-project cap on movable catalog items, in integer minor currency units, excluding taxes/shipping and existing fixed fixtures.

## Furniture inventory draft

Historical illustrative fixture only: use the existing eight `inventory/*.json` files and the normalization plan in the extension for implementation. Prices below are fictional demo values, not live product listings. Add enough variants and types for all four room categories before generation integration.

```json
{
  "version": "demo-v1",
  "currency": "USD",
  "items": [
    {"id": "bed-queen-natural", "name": "Natural queen bed", "objectType": "sleep.bed.queen", "allowedRoomTypes": ["bedroom_primary"], "footprint": {"w": 1.6, "d": 2.1, "h": 1.1}, "priceMinor": 65000, "colors": ["natural"], "materials": ["wood"], "renderShape": "rectangle"},
    {"id": "sofa-beige", "name": "Beige sofa", "objectType": "seating.sofa.three_seat", "allowedRoomTypes": ["living_room"], "footprint": {"w": 2.1, "d": 0.9, "h": 0.85}, "priceMinor": 80000, "colors": ["beige"], "materials": ["fabric"], "renderShape": "rectangle"},
    {"id": "kitchen-cart-natural", "name": "Kitchen cart", "objectType": "storage.cart.kitchen", "allowedRoomTypes": ["kitchen"], "footprint": {"w": 0.8, "d": 0.5, "h": 0.9}, "priceMinor": 15000, "colors": ["natural"], "materials": ["wood"], "renderShape": "rectangle"},
    {"id": "bath-cabinet-white", "name": "Bathroom cabinet", "objectType": "storage.cabinet.bathroom", "allowedRoomTypes": ["bathroom_full"], "footprint": {"w": 0.6, "d": 0.35, "h": 1.2}, "priceMinor": 12000, "colors": ["white"], "materials": ["laminate"], "renderShape": "rectangle"}
  ]
}
```

Catalog metadata is converted to canonical `Object` records when placed. Reconcile proposed cart/cabinet dot-paths with rule references during catalog indexing. Do not move sinks, toilets, stoves or other fixed fixtures as ordinary furniture. Selected variants must exist in the catalog snapshot; the agent cannot invent products, prices, colors or dimensions.

## Rule-library integration and generation

The library contains Markdown with structured YAML records and pseudo-DSL predicates, not an executable engine. Build an indexed registry preserving `id`, `title`, `system`, `version`, `applies_to`, `severity`, `confidence`, `belief_gated`, `requires_rules`, `conflicts_with`, default parameters, and source path. Add implementation metadata: `availability: supported | unsupported | missing_inputs`, `reason`, and `requiredInputs[]`.

Only selectable rules with implemented evaluators and available dependencies can be applied. Show unsupported rules disabled with an explanation. The checked-in room files include kitchen and bedroom topics but no dedicated living-room or bathroom file; use applicable supported system rules and baseline validators, without claiming complete category coverage. Cross-referenced files/rules may be absent: index unresolved dependencies explicitly. Compass, occupancy, lighting and other missing inputs must never be fabricated.

Multi-select submits rule IDs, with fixed default parameters. Explicit selection of a belief-gated rule also requires its system to be enabled in configuration. Resolve dependencies and report automatically included IDs. Respect the foundation contract's precedence ladder and explain conflicts; aesthetic/traditional preferences cannot override blocking constraints. Preserve tradition/evidence distinctions in displayed explanations.

Generation pipeline:

1. Validate saved boundaries, categories, openings and configuration; freeze input revisions and catalog/rule versions.
2. Filter catalog variants by hard requirements, budget, dimensions, colors and room eligibility. Report an empty candidate set against the specific requirement.
3. Agent assigns unbound requirements to suitable rooms, chooses candidate variants, and proposes poses using room context and selected rules.
4. Deterministic validators check quantities, eligibility, total cost, transformed footprints, room containment, collisions, fixed objects, openings and supported clearances/rules. For MVP rectangles, exact rectangle checks suffice; do not rely on `rectInPolygon` sampling for future concave rooms.
5. Repair within a bounded attempt/time budget. Persist and activate only a valid result. A bounded search failure means “No valid layout found,” not proof that no solution exists.

Statuses: `queued → running → succeeded | failed | stale`. Stages: `selecting`, `placing`, `validating`. Failures distinguish `NO_CATALOG_MATCH`, `BUDGET_EXCEEDED`, `NO_VALID_LAYOUT_FOUND`, and `ENGINE_ERROR`; include affected room/requirement/rule IDs and suggested changes. Preserve the previous successful preview after a failure.

Room generation replaces only that room's placements and retains all others in the resulting full-home snapshot. Validate the combined budget and global quantities, accounting for retained assignments. Unbound requirements that cannot be fulfilled within the selected room require a whole-home run or an explicit room assignment; never silently rearrange other rooms.

Activate a result only if input revisions still match the current project; otherwise mark the job stale and preserve its snapshot for inspection. Geometry/category/configuration changes mark affected placements stale immediately. The overview can show stale placements with a visible badge, but must not imply that they meet the latest requirements.

## Frontend screens and components to create

| Proposed file | Responsibility and data/API connection |
| --- | --- |
| `src/screens/ProjectScreen.tsx` | Replace ProjectStub; fetch project, coordinate tabs and selected room, handle missing project/loading/retry. Route `/projects/:projectId`. |
| `src/screens/PreviewScreen.tsx` | Whole-home or room preview using an immutable layout; route `/projects/:projectId/preview?roomId=...&layoutId=...`. |
| `src/components/upload/FloorPlanUpload.tsx` | Extract file selection/drop UI; retain File, show preview, type/size errors, progress and retry. |
| `src/components/workspace/RoomBoundaryEditor.tsx` | Render demo polygons and editable shared partitions; validate numeric/drag edits before rooms PUT; show fixed height. |
| `src/components/workspace/RoomDetailsPanel.tsx` | Edit label/category, show dimensions/area, save/discard boundary/category draft. |
| `src/components/workspace/RoomNotesEditor.tsx` | Per-room note textarea, save/clear, interpreted rules, ambiguity/conflict findings; uses note PATCH. |
| `src/components/workspace/ApartmentOverview.tsx` | Compose interactive floor canvas and room list; room selection opens configuration; preview action opens whole-home preview. |
| `src/components/workspace/RoomList.tsx` | Accessible room selection with label, category and status: unconfigured/configured/generating/furnished/stale/error. |
| `src/components/plan/FloorPlanCanvas.tsx` | Shared SVG renderer for overview/editor/preview; rooms, labels, openings, fixed objects, furniture; pan, zoom, fit-to-home/room. Props: scene, transforms, selectedRoomId, onSelectRoom, interactive. |
| `src/components/plan/FurnitureFootprint.tsx` | Oriented rectangle/simple outline from object dimensions and pose; accessible item name and quantity-instance identity. |
| `src/components/furniture/FurnitureConfigurationPanel.tsx` | Home/room scope, requirement draft, prompt, rules, Apply; configuration PUT then generation POST. |
| `src/components/furniture/FurnitureRequirementRow.tsx` | Type inclusion, exact quantity, room/automatic assignment, allowed colors and size caps; inline errors. |
| `src/components/furniture/DesignConstraintsForm.tsx` | Prompt and whole-project budget/currency; display remaining budget for a room run. |
| `src/components/furniture/FurnitureCatalogPanel.tsx` | Browse/filter JSON inventory via furniture GET; show suitability, dimensions, price and available colors. MVP is read-only. |
| `src/components/rules/RuleMultiSelect.tsx` | Search/group checkboxes by system, applicability, availability, selected count and dependency notices. |
| `src/components/rules/RuleDetails.tsx` | Explain a rule, source, severity, confidence, fixed defaults and conflicts. |
| `src/components/generation/GenerationStatus.tsx` | Poll job, show stage and terminal errors; disable duplicate Apply, retain job ID across navigation. |
| `src/components/generation/GenerationFindings.tsx` | Render unmet requirements, skipped/conflicting rules and agent explanations beside validated findings. |
| `src/components/preview/PreviewToolbar.tsx` | Home/room selector, furniture/labels toggles, zoom and fit controls. |

Supporting modules: `src/types/interior.ts` (API contracts), `src/lib/api.ts` (requests/errors), `src/lib/sceneCoordinates.ts` (coordinate conversion), `src/hooks/useProject.ts`, `src/hooks/useGeneration.ts`, and `src/store/projectUiStore.ts` (selection, camera, unsaved edits only). Persist project/configuration/layout data on the backend; do not put raw Files or blob URLs into persisted Zustand state.

The main workspace can use a room list on the left, the shared canvas in the center, and the selected room/configuration panel on the right. On small screens, use tabs for Plan, Rooms and Configure. Ensure polygon selection has an equivalent keyboard-operable room-list control and partition dragging has numeric inputs.

## Implementation order and acceptance checks

1. Define shared contracts, demo floor and catalog fixtures; implement project creation/upload/read. Verify refresh restores a project and upload is clearly labeled as a demo-backed plan.
2. Replace placeholder with boundaries and overview. Verify all four labels, unit conversion, valid shared partition edits and fixed height; reject overlapping/out-of-floor rooms and invalid openings.
3. Add inventory, requirements and supported rule selection. Verify persistence, quantity exclusions, budget/color/size errors and disabled unsupported rules.
4. Implement generation job/agent/validators and result persistence. Verify a bed cannot enter the kitchen, required quantities and budget are enforced, blocked openings/collisions are rejected, and agent failure preserves the last valid layout.
5. Add full-home/room preview. Verify both views use identical placements and rotations, retained rooms survive a room run, stale jobs cannot overwrite newer work, and repeated Apply does not create duplicate jobs.

Use geometry/validator tests and API integration tests for those invariants; manually exercise the upload → room definition → overview → configuration → Apply → preview path, including reload and failure/retry. These checks are proposed for implementation; no runtime code is changed by this draft.
