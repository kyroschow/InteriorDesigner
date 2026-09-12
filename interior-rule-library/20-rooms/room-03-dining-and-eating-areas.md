# Dining & Eating Areas — Functional / Practical / Design Layer
<!-- library-file: v1 | system(s): modernism.functionalism, ergonomics.anthropometrics, ergonomics.task_zones, circulation.desire_lines, circulation.space_syntax, composition.balance, composition.focal_point, composition.scale_proportion, classical.axiality, psych.proxemics, psych.prospect_refuge, psych.cognitive_load, behavior.habit_design, lighting.layers, acoustics.room, accessibility.ada, accessibility.universal_design, product.parameter | rule-id-prefixes: RM-DIN | author-agent: room-03-dining-functional -->

## Scope

This file is the **functional, practical and design** layer for every place in a home where
people sit down and eat. It covers:

- `formal_dining` — a dedicated room, door(s), usually one table, used between 4 and 365 times a year.
- `breakfast_nook` — a small built-in or semi-built-in eating spot, usually glazed, usually a bench.
- `eat_in_kitchen` — a table inside the working kitchen envelope.
- open-plan dining (`open_plan_combined`, `great_room`, `loft`) — a dining *zone* with no walls of its own.
- dining inside a `living_room` / `family_room` — the dual-use table.
- bar- and counter-height eating at an island, peninsula or wall counter (`kitchen`, `eat_in_kitchen`).
- homes with **no** dining room at all (`studio_apartment`, small flats) — convertible and wall-hung tables.
- outdoor eating adjacency (`patio_deck`, `balcony`, `roof_terrace`, `sunroom_conservatory`) as it affects the indoor serve-through path.

**What this file owns:** what the room is for; what must be in it; table size/shape selection maths;
seat-count-versus-room-size; clearance rings and chair envelopes; centring of table and fixture;
banquette geometry; serving path and landing; storage; the real-life behaviour of dining tables
(homework, laptops, post, the dumping ground); rugs; the functional face of lighting and acoustics;
what diners look at; accessibility at the table; counter eating; the honest formal-dining-underuse
audit and the multipurpose conversions; and the two generation blocks
(`LAYOUT_ARCHETYPES`, `GENERATION_RECIPE`) the engine needs to furnish these rooms from empty.

**What this file does NOT own** (referenced, applied, never re-derived here):
feng shui dining doctrine `FS-ROOM-*`, command position `FS-CMD-*`, bagua `FS-BAG-*`,
five elements `FS-ELEM-*`; vastu `VS-ROOM-*`; ergonomic clearance tables `ERG-CLR-*`;
lighting `LGT-*`; acoustics `ACU-*`; colour `CLR-*`; circulation `CIR-*`; safety `SAFE-*`.
Where those layers matter to dining, the rule here says **which** of their rules applies, **with what
parameter values**, and **in what priority** — see each rule's `requires_rules` and the
`## CROSS_REFERENCES` block.

**Honesty note for this file.** Dining layout is one of the most code-free areas of the home: in most
jurisdictions there is no building-code clearance for a dining table. Almost every number below is
therefore *ergonomic* (derived from body dimensions) or *industry planning guideline* (the figures
reproduced in kitchen/dining planning practice), not code. Where a number **is** code-derived it is
ADA / ANSI A117.1 accessibility geometry and is marked `jurisdiction_varies: true`, with the
reminder that ADA regulates public accommodation and **not** private single-family dwellings — we use
it as the best-available design target for a household that needs it, not as a legal requirement.

## Rule count: 50

## Rules
