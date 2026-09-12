# Simplified scope: safety rules engine and AI layout loop

Status: implemented in `server/`. This document supersedes the rule-library, belief-system, room-note-interpretation and fictional-catalog parts of [the workspace draft](interior-workspace-draft.md) and [request contracts](request-contracts-and-selection.md). Projects, uploads, rooms, revisions, generations and layouts from those documents remain in force.

## Scope

- Four room types: `living_room`, `bedroom`, `kitchen`, `bathroom`.
- Eleven furniture types: `bed`, `dresser`, `nightstand`, `tv_stand`, `sofa`, `dining_table`, `dining_chair`, `kitchen_counter`, `sink`, `shower`, `toilet`.
- The markdown `interior-rule-library/` is reference material only. The backend does not parse it; its rules are replaced by a small safety rules engine written in code.
- Room notes are free text passed to the AI as soft preferences. There is no structured note interpretation.
- Budget and colors are optional.

| Room | Allowed types |
| --- | --- |
| bedroom | bed, dresser, nightstand, tv_stand, dining_table, dining_chair |
| living_room | sofa, tv_stand, dining_table, dining_chair |
| kitchen | kitchen_counter, sink, dining_table, dining_chair |
| bathroom | sink, shower, toilet |

A requirement with `roomId: null` lets the AI choose among eligible rooms.

## Catalog

`server/src/catalog/types.json` defines each type: allowed rooms, whether it stands against a wall, its access space, and its inventory source. Items come from `inventory/*.json` where every dimension is known (records with missing dimensions are skipped, never guessed). Types or rooms with no usable product get one standard-size generic item with `source: "default"` and no price: kitchen sink, shower and toilet. Dining tables come from `table.json` and dining chairs from `chairs.json`; kitchen counters from base cabinets; bathroom sinks from vanities.

## Safety rules (`GET /api/v1/rules`)

All rules are hard; a layout is saved only when every rule passes.

| Rule | Check |
| --- | --- |
| `SAFE-CONTAIN` | Footprint inside its room. |
| `SAFE-OVERLAP` | No overlapping footprints (touching is fine); a dining chair may tuck up to 0.3 m under a dining table. |
| `SAFE-DOOR-SWING` | Nothing where a door leaf swings into the room. |
| `SAFE-DOOR-APPROACH` | A door-wide zone 0.9 m deep stays clear on the room side of every door or doorway. |
| `SAFE-PATHWAY` | All doors of a room are connected by a walkway at least 0.9 m wide. |
| `SAFE-ACCESS` | Use-side clearance is inside the room, free of items and reachable by the walkway: bed 0.6 m on one long side, dresser front 0.9 m, TV stand and sofa front 0.6 m, dining chair back 0.6 m, counter front 1.0 m, sink front 0.7 m, toilet and shower front 0.6 m. |
| `SAFE-WALL` | Bed, dresser, TV stand, counter, sink, toilet and shower stand with their back on a wall, not across a door opening. |
| `SAFE-WINDOW` | Items taller than a window sill are not placed directly in front of it. |
| `SAFE-ELIGIBLE`, `SAFE-QUANTITY`, `SAFE-BUDGET` | Right room type, exact instance counts, total within budget. |

Walkways are analyzed on a 50 mm grid: each cell's clearance to walls and furniture, then a widest-path search from the room's first door. The engine also reports metrics used to maximize open space: walkable floor percentage, narrowest path width, and a 0–100 score. Every violation includes a concrete hint (zones to keep clear, free wall spans, distances to move).

## AI loop

Generation runs as an asynchronous job, one at a time:

1. Snapshot rooms and configuration; expand requirements into instances (`req-bed#1`); filter candidate items; check the cheapest possible total against the budget.
2. Send the model a compact JSON context: rooms with walls, free spans, doors, windows and door clear zones; requirements with candidate items; rules; style prompt and room notes.
3. The model works through two tools:
   - `check_layout` runs the rules engine on draft placements and returns violations, hints, resolved positions and metrics;
   - `submit_layout` is re-checked and accepted only if everything passes.
4. Placements use relational anchors resolved deterministically: `wall` (back against a wall at a position along it), `beside`, `facing` and `free`.
5. The loop ends on an accepted submit, after 12 model turns, or when the time budget runs out. Failures return `NO_VALID_LAYOUT_FOUND` with the last violations; the previous layout stays active.

The model is the local `qwen3.6-35b-a3b-fp8:latest`, reached through a dedicated OpenClaw gateway (`LLM_PROVIDER=openclaw`, profile `interior` on port 18989, set up by `scripts/setup-openclaw.sh`) or Ollama directly (`LLM_PROVIDER=ollama`). Submitting by `checkId` reuses the exact placements of a passing check, because the model is unreliable at retyping them.

## Contract changes

`schemas/request-bodies.schema.json`: `RoomType` and `ObjectType` enums as above; `Requirement.allowedColors` and `maxDimensionsM` optional; `Configuration.budget` optional or null; `selectedRuleIds` and `enabledBeliefSystems` removed.
