# Request schemas, inventory selection and room notes

> **Superseded in part** by [simplified scope](simplified-scope.md): room notes are soft AI preferences (no structured interpretation), object types are a flat list of eleven, and rule selection fields were removed from the schemas.

Draft contract; no backend handlers or frontend components are implemented here. This document extends [the workspace draft](interior-workspace-draft.md). The existing `inventory/*.json` files replace the fictional catalog proposed in that first draft.

## Request body schemas

[request-bodies.schema.json](schemas/request-bodies.schema.json) contains JSON Schema 2020-12 definitions. Validate the relevant `$defs` definition, not the root (which deliberately rejects all instances). For example, use a reference to `request-bodies.schema.json#/$defs/CreateProjectRequest`. [request-examples.json](schemas/request-examples.json) contains JSON request examples keyed by definition name.

| Endpoint under `/api/v1` | Request definition |
| --- | --- |
| `POST /projects` | `CreateProjectRequest` |
| `POST /projects/:projectId/floor-plan` | `UploadFloorPlanRequest` — multipart, not a JSON payload |
| `PATCH /projects/:projectId` | `UpdateProjectRequest` |
| `PUT /projects/:projectId/rooms` | `ReplaceRoomsRequest` |
| `PUT /projects/:projectId/configuration` | `ReplaceConfigurationRequest` |
| `PATCH /projects/:projectId/rooms/:roomId/note` | `UpdateRoomNoteRequest` |
| `POST /projects/:projectId/generations` | `CreateGenerationRequest` |

All existing GET endpoints have no request body; catalog/rule filters are query parameters. IDs in paths and `Idempotency-Key` remain outside these body schemas. Use `Content-Type: application/json` except upload. Upload accepts exactly one binary `file` and one decimal `expectedRevision` text part, coerced to an integer by the multipart handler before revision validation; enforce PNG/JPEG/WebP/PDF and a 20 MiB limit in that handler. JSON Schema's `format: binary` is documentation metadata, not file validation.

Objects reject unknown properties. Revisions are positive integers, prices integer USD cents, quantity 0–100, notes/prompts up to 4,000 characters, and dimensions positive meters. Empty note clears it. Empty colors means unrestricted color; nonempty values are normalized catalog color-family IDs. No server-derived area, ceiling height, walls, objects, price, or configuration revision can be supplied in these requests.

Room PUT accepts only room IDs, labels, canonical categories, four-vertex local rectangular polygons and corresponding translations. For this four-room MVP, IDs must equal the current room set. The server reconstructs the canonical scene and maintains the fixed 2.7 m height, fixtures and openings. Reject edits that make those fixed elements invalid; do not silently move them. Notes survive geometry saves because they are owned by configuration, not the room-edit DTO.

Semantic validation beyond JSON Schema:

- IDs must exist in the project; room/requirement IDs must be unique. Transform and instruction arrays must have exactly one entry per room. Four rooms does not require four different categories.
- Polygon vertices must form a nondegenerate axis-aligned rectangle in room-local space with minimum X/Y zero; transformed partitions must exactly tile the fixed shell without overlaps. Enforce three-decimal meter precision at the boundary.
- The requirement type must exist in the normalized type registry; no wildcard requests. Reject duplicate/overlapping quantities, room-type mismatches and unknown colors/rules. Zero excludes a type in scope. A global requirement and overlapping room requirement for that type must not double count.
- Budget and max dimensions are hard constraints. Whole-project budget counts retained placements during room-only generation. Existing fixtures are excluded from purchase totals.
- Configuration replacement requires all four `roomInstructions`, even empty notes. Revisions are assigned by the server. A note PATCH updates that same configuration entry atomically, increments both configuration and project revisions, and returns the updated Project. It is not a second copy of the note.
- Validate `expectedRevision` atomically for every write; stale writes return `409`. Generation also checks `configurationRevision`, snapshots notes and their interpretation, and cannot activate a stale result.

## Existing furniture JSON inventory

Inspected local snapshot: eight arrays, ten records each (80 total). Fields include `name`, `category`, `url`, `imageUrls`, `priceCents`, `dimsMm`, `colorHex`, `colorName`, `materials`, `styleTags`, and `featureTags`. Beds additionally include `itemNo`, `typeName`, and `description`. No stock quantities or currency field are supplied. Prices are local catalog values, not verified live offers; configure the source currency explicitly as USD.

| File | Proposed type/room mapping | Records missing one or more dimensions |
| --- | --- | --- |
| `beds.json` | `sleep.bed.<size>` → bedroom; size must come from verified description/override | 2 |
| `sofa.json` | `seating.sofa` / reviewed subtype → living room | 1 |
| `nightstand.json` | `tables.nightstand` → bedroom | 0 |
| `dresser.json` | `storage.dresser` → bedroom; other rooms require explicit eligibility mapping | 0 |
| `tvstand.json` | `storage.tv_stand` → living room or bedroom | 0 |
| `dining.json` | Dining bundles → reviewed table/chair components, kitchen or suitable living area | 9 |
| `cabinets.json` | Kitchen cabinet subtypes → kitchen; installation/fixed placement constraints | 6 |
| `sinks.json` | Bathroom vanity/sink bundles → bathroom; plumbing/installation constraints | 0 |

These dot-paths are proposed normalization mappings to reconcile with the library object namespace. File names alone do not determine a specific subtype: a loveseat is not automatically a three-seat sofa, and a Full bed is not a Queen. Generic `seating.sofa` requests match reviewed descendant types; explicit subtype requests match only that subtype. Expand this relationship through a registry, not arbitrary string guessing.

## Catalog ingestion and normalization plan

1. Load every source file once at startup/build time and compute a version hash over source bytes plus mapping/override versions. Keep raw files unchanged. Normalize into a backend-owned catalog index; no vector database is needed for 80 items.
2. Derive stable `catalogItemId` from explicit `itemNo`, otherwise the terminal product number in the canonical product URL, with a retailer prefix. If neither is reliable, require a curated ID override. Do not use name or array index. Dedupe identical variants; conflicting records with the same ID need review.
3. Preserve source filename, URL, original values and image references. Map `priceCents → priceMinor`, `dimsMm / 1000 → footprint {w,d,h}`. Keep missing values null, never zero or guessed. Store dimensions as integer millimeters internally if useful for exact comparison.
4. Add a reviewed mapping/override file for `objectType`, `allowedRoomTypes`, canonical color families, installation mode, front direction, dimension provenance, geometric shape, required connections and bundle components. Map “Vissle dark gray” to `gray` while retaining its original finish label. Color hex can support soft similarity, but must not override an explicit color-family constraint.
5. Keep raw materials/style/features for ranking. A material appearing somewhere in a product is not proof that it is the primary material. Any future hard “solid wood” filter needs verified metadata; do not infer it from `materials: [wood, ...]`.
6. Record `selectionStatus: eligible | needs_review | unsupported` with reasons. Missing or unverified overall dimensions exclude automatic placement; records can remain browsable with a reason. Complete numeric fields alone do not establish quality: several sofa heights may be seat heights, chaise dimensions need an overall envelope, and dining-set dimensions may describe only a table. Review these before marking eligible.
7. Treat bundles explicitly. Dining tables/chairs need component dimensions, counts and clearance envelopes; charge bundle price once while placing all components. Exclude unresolved bundles from MVP auto-generation. Sink/cabinet products remain browsable but are excluded from movable-furniture generation until installation support exists. Existing demo fixtures remain fixed and do not create new purchases.

Normalized record fields: `catalogItemId`, `name`, `objectType`, `allowedRoomTypes`, `priceMinor`, `currency`, `footprint`, `colorFamilies`, `colorName`, `colorHex`, `materials`, `styleTags`, `featureTags`, `installationMode`, `components`, `selectionStatus`, `reviewReasons`, `source`, `catalogVersion`. The furniture endpoint should include eligibility/review reasons so users understand why a visible product cannot be generated. Expose only eligible types in the furniture requirement picker; unsupported categories show an explanation.

## Constraint-based furniture selection

1. **Build room context.** Load the scene, saved quantities, structured filters, whole-home prompt, selected library rules and each target room's note. Parse note instructions as described below; bind them to that room only.
2. **Compute candidate sets.** For each requirement and eligible target room, intersect reviewed type matches, room eligibility, color families, maximum W/D/H, ceiling height, note prohibitions and installation support. A prefilter checks whether at least one allowed orientation fits the available room bounds; exact collision/clearance validation happens later. Product maximum dimensions apply to canonical W/D/H, while placement rotation swaps plan extents.
3. **Check aggregate budget.** Subtract retained-room costs first. Compute a lower bound from the cheapest eligible candidate for each required instance; if this already exceeds the remaining budget, fail with per-requirement costs. Do not compare each item's price to the whole budget and assume the combination fits. Missing price/currency excludes selection under a hard budget. Stock is unknown: quantity means requested instances, not confirmed retailer availability.
4. **Rank feasible candidates.** Score matches to styleTags, featureTags, reviewed materials and prompt/note preferences; prefer compatible dimensions and room context. Give the agent compact records with immutable IDs, prices, dimensions and tags. Start with a configurable top-K per requirement (e.g. 10), retaining cheapest candidates; widen to the complete feasible set if placement fails so shortlisting does not manufacture infeasibility.
5. **Select jointly and place.** The agent proposes `{requirementId, instanceId, catalogItemId, roomId, pose}` for every instance. Search/repair across product alternatives and room assignments under the shared budget. A cheaper but smaller bed cannot replace an explicitly requested Queen. Agent output is an untrusted proposal: validate all IDs, quantities and poses against the snapshot.
6. **Validate deterministically.** Recompute costs from catalog IDs, check exact counts, hard filters, room notes with supported predicates, collisions, openings and rule precedence. Rank soft preferences only after hard constraints pass. Retry alternatives within a bounded job budget; never relax explicit requirements silently.
7. **Explain and persist.** Save source catalog version, variant IDs, instance assignments, price/dimension snapshots, agent rationale and validator findings. If no candidates exist, return rejected counts by reason and affected requirement/room IDs (e.g. unknown dimensions versus budget). Suggest constraint changes without applying them automatically.

Concrete local-data example: `SLATTUM` (`70571256`) is described as Queen, with recorded `priceCents: 14900` and dimensions `1.559 × 2.080 × 0.851 m`. After dimension/type review it is a candidate for one gray Queen bed with maximum dimensions `1.8 × 2.2 × 1.3 m` and item allocation of 20,000 cents. The Full `TARVA` is excluded by size even if it fits geometrically. This demonstrates filtering of the local snapshot, not a product recommendation or a live-price claim.

## Room note section and individual rules

Each room has a **Room notes & rules** textarea. Examples: “No TV in this bedroom,” “Keep 0.8 m clear in front of the bed,” and “Prefer light wood.” The saved source is `configuration.roomInstructions[{roomId, note}]`; GET Project also exposes its server-derived interpretation. Empty notes are valid. Add `RoomNotesEditor.tsx` to the room configuration panel, with character count, save/pending/error state and interpreted-rule findings. The overview room list can show a note indicator.

Notes do define individual rules, not merely text appended to the global prompt. On configuration save/note PATCH, a backend note interpreter produces structured records such as:

```json
{
  "roomId": "room-3",
  "sourceText": "Keep at least 0.8 m clear in front of the bed.",
  "kind": "minimum_clearance",
  "targetObjectType": "sleep.bed",
  "side": "front",
  "valueM": 0.8,
  "strength": "hard",
  "status": "supported"
}
```

The initial allowlisted interpretations are object-type prohibition, minimum side clearance with explicit units, allowed color families, and style/material preferences. Use the same type/color registry as inventory selection. Statements using “must,” “no,” or explicit minimums become hard only when meaning and target are unambiguous; “prefer” becomes soft. A note that asks for a quantity/budget change conflicts with the saved structured setting until the user edits that setting. Never execute note text as code or let it change system instructions, catalog facts or other rooms.

Persist raw note plus interpreted clauses, source spans, parser version, strength and `supported | ambiguous | unsupported | conflict` status as server-owned metadata. Show “Will apply” and “Needs clarification” beneath the editor. Saving an unresolved note is allowed, but Apply returns `422 ROOM_NOTE_UNRESOLVED` for unresolved hard instructions rather than pretending they were enforced. Unsupported soft preferences may proceed with a visible unmet-preference finding. Structured clause editing is later work; users can resolve ambiguity by editing the note.

Baseline safety/geometry constraints cannot be relaxed by a note. Hard notes and explicit quantity/color/budget fields are conjunctive constraints; contradiction yields `ROOM_NOTE_CONFLICT`, not an automatic override. Supported hard notes outrank optional aesthetic/library preferences; mandatory rules still prevail. Room-specific soft preferences take precedence over global soft style preferences within that room. Report any resulting rule conflict in findings.

A note save invalidates the room's previous result and increments configuration revision. Global budget and unbound assignments can couple rooms, so conservatively mark the whole-home active layout stale and reevaluate combined constraints. Job snapshots include all notes and interpretation versions. Room-only generation must not move furniture in other rooms to satisfy a new note.

## Implementation and verification plan

Implement request validation first, then catalog normalization/review, note interpretation, candidate filtering, agent selection and deterministic placement validation. Add schema validation at HTTP boundaries; these schema artifacts are not yet wired to a server.

Verify valid/invalid bodies, unknown fields, missing room notes, duplicate IDs and revision conflicts. Verify missing dimensions never become zero, variants keep stable IDs across source reordering, bed sizes remain distinct, bundles are not double charged, and aggregate budgets include retained rooms. Exercise note persistence on refresh and geometry save, empty-note clearing, room scoping, ambiguous units, contradiction with quantity settings, unsupported hard notes and stale generation results.
