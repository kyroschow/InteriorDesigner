# Kitchen, Pantry, Butler's Pantry & Kitchenette — Functional / Practical / Design Layer
<!-- library-file: v1 | system(s): modernism.functionalism, ergonomics.task_zones, ergonomics.anthropometrics, circulation.desire_lines, circulation.space_syntax, pattern_language.alexander, zoning.public_private, behavior.habit_design, psych.cognitive_load, product.parameter | rule-id-prefixes: RM-KIT | author-agent: room-04-kitchen-functional -->

## Scope

This file owns the **functional, practical and design** layer for every cooking space: the
fitted kitchen in all canonical layouts (single-wall, galley, L, U, G/peninsula, single island,
double island, broken-plan), the eat-in kitchen, the open-plan kitchen corner, the apartment
galley and kitchenette, the walk-in pantry, the larder/tall-unit pantry, and the butler's
pantry / serving pantry.

It answers: what the room is *for*, what must be *in* it, how the pieces are *laid out*
relative to one another, what makes a kitchen work, and the specific, boring, repeatable ways
kitchens fail — the 300 mm of counter that isn't there beside the hob, the dishwasher door that
blocks the only route to the bin, the beautiful island nobody can walk round, the fridge whose
door opens the wrong way, the guest who leans exactly where the cook needs to be.

It also carries the two generation blocks the engine needs to furnish an empty kitchen from
scratch: `## LAYOUT_ARCHETYPES` (13 parametric templates including the awkward variants) and
`## GENERATION_RECIPE` (a deterministic ordered algorithm with a documented relaxation ladder).

**What this file does NOT own.** It does not re-derive doctrine owned by other agents. It
*applies* them, naming the parameter values and priority the kitchen needs:

| Layer | Owner prefix | How this file applies it |
|---|---|---|
| Feng shui kitchen doctrine (fire/water separation, hob not facing door, cook's back to entry) | `FS-ROOM-*` | Applied in step 7 of the generation recipe, *after* function and circulation are satisfied, within remaining freedom only. Kitchen doctrine gets sector priority over decor doctrine. |
| Command position for the cook | `FS-CMD-*` | Applied as a soft preference on hob orientation and on island-cook facing; never at the cost of `RM-KIT-034` (hob side clearance) or extraction. |
| Bagua sector reading | `FS-BAG-*` | Consulted for which *end* of a viable run carries the hob/sink when both ends are functionally equal. |
| Vastu kitchen zone (SE Agni, cook facing east) | `VS-ROOM-*` | Same precedence as feng shui: tie-breaker within functional freedom. |
| Ergonomic clearance tables | `ERG-CLR-*` | This file states kitchen-specific *minimums*; `ERG-CLR-*` is authoritative on anthropometric derivation. Where they differ, `ERG-CLR-*` hard minimums win (precedence tier 3). |
| Lighting design | `LGT-*` | This file states *where* kitchen light must land (counter edge, hob, sink, inside cabinets) and the failure mode; `LGT-*` owns lux, CCT, CRI, driver and layer counts. |
| Acoustics | `ACU-*` | Hard-surface kitchen reverb and appliance noise in open plan. |
| Colour & finish palette | `CLR-*` | This file owns cleanability and slip resistance only. |
| Circulation network | `CIR-*` | This file owns the *work* aisles; `CIR-*` owns the household route network they plug into. |
| Safety — fire, child, water, air quality, tip-over | `SAFE-*` | All `blocking` kitchen safety findings belong to `SAFE-*`. This file flags the geometry that creates the hazard and defers the verdict. |

## Rule count: 74

---

## Rules

### RM-KIT-001 — A kitchen is not a kitchen until all five functional primitives are present

```yaml
id: RM-KIT-001
title: Kitchen functional completeness — five primitives
system: modernism.functionalism
group: program_completeness
version: 1
status: active
applies_to:
  rooms: [kitchen, eat_in_kitchen, kitchenette, studio_apartment, open_plan_combined, great_room, adu_in_law_suite, loft]
  objects: []
  requires_features: []
scope: room_composition
severity: high
confidence: expert_consensus
evidence_class: mixed
belief_gated: false
predicate: |
  # A cooking space must provide cold storage, water, heat, a prep surface and dry storage.
  let hasCold  = countOf(appliance.refrigerator.*, room) >= 1
  let hasWet   = countOf(kitchen.sink.*, room) >= 1
  let hasHeat  = (countOf(kitchen.hob.*, room) + countOf(kitchen.range.*, room)) >= 1
  let prepRuns = continuousCounterRun(room, min_depth_m = p.min_prep_depth_m)
  let hasPrep  = exists r in prepRuns where r.length_m >= p.min_prep_length_m
  let dryStore = storageFrontage(room, kind = enclosed) >= p.min_dry_store_frontage_m
  require hasCold and hasWet and hasHeat and hasPrep and dryStore
  # An oven is required for a full kitchen but not for a declared kitchenette.
  require (room.type == kitchenette) or (countOf(kitchen.oven.*, room) + countOf(kitchen.range.*, room) >= 1)
params:
  - key: min_prep_length_m
    default: 0.600
    range: [0.400, 1.200]
    unit: m
    user_editable: false
    rationale: Absolute floor for a usable board surface; 600 mm (24 in) fits a large board plus a bowl.
  - key: min_prep_depth_m
    default: 0.560
    range: [0.450, 0.700]
    unit: m
    user_editable: false
    rationale: Clear depth in front of the splashback on a 600 mm (24 in) deep base unit.
  - key: min_dry_store_frontage_m
    default: 1.200
    range: [0.600, 4.000]
    unit: m
    user_editable: true
    rationale: Roughly two 600 mm (24 in) enclosed units — the minimum that holds food plus crockery.
score:
  weight: 10
  curve: step
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: kitchen.sink.single_bowl
    transform: {position: nearest_point_to(nearestFeature(room, plumbing_stack)), min_landing: both_sides}
    cost: high
    effort: trade_required
    reversible: false
    copy: This space is missing a sink. Nothing else in a kitchen works without one, so it has to come first.
  - rank: 2
    action: add_object
    add: kitchen.counter.run
    transform: {position: between(kitchen.sink.*, kitchen.hob.*), min_length_m: 0.900}
    cost: medium
    effort: trade_required
    reversible: false
    copy: There is no real worktop. Add a continuous run between the sink and the hob before adding anything else.
  - rank: 3
    action: add_object
    add: storage.tall_cabinet.larder
    transform: {position: outside_work_triangle, against: solid_wall}
    cost: medium
    effort: moderate
    reversible: true
    copy: Add an enclosed food cupboard. Open shelves alone leave you with nowhere to put the boring things.
conflicts_with: []
supersedes: []
requires_rules: []
tags: [program, completeness, gate, signature_rule]
localization_notes: >
  In many Japanese, Korean and Southeast Asian apartments a built-in oven is genuinely absent by
  norm and a combi-microwave or fish grill substitutes; treat the oven clause as satisfied by
  kitchen.microwave.built_in with grill function when site locale is in p.no_oven_locales.
```

#### Why — tradition
No feng shui or vastu doctrine sets a program list; both traditions assume a cooking hearth and
a water point already exist and concern themselves with *where* they go. The lineage here is
modernist functional planning — Christine Frederick's early-20th-century household-efficiency
writing, Margarete Schütte-Lihotzky's 1926 Frankfurt Kitchen, and Christopher Alexander's
*A Pattern Language* patterns 139 (Farmhouse Kitchen) and 184 (Cooking Layout), all of which
treat store–wash–prep–cook as an irreducible chain rather than a set of optional features.

#### Why — psychology / physiology
Missing a primitive does not merely slow cooking; it displaces the task onto a surface not
designed for it, which is where hygiene and burn risk concentrate. The mechanism is simple
substitution behaviour: with no prep counter people chop on the hob lid, the drainer or the
dining table, and cross-contamination and clutter follow. No direct empirical support for a
specific length threshold; the thresholds here are derived from equipment dimensions, not studies.

#### Customer insight
Before you think about finishes, check the five basics: somewhere cold, a sink, a heat source,
a real stretch of worktop, and a cupboard that closes. If one is missing, everything you add
afterwards will be working around the gap.

#### Failure modes / when to skip
Skip for `pantry_walk_in`, `butlers_pantry` and `laundry_room` — those are served spaces, not
kitchens. Skip the oven clause for a declared kitchenette, a hotel-style `adu_in_law_suite`
kitchenette, or a locale where built-in ovens are not the norm. Do not fire during a staged
renovation where the user has flagged `phase: shell`.

---

### RM-KIT-002 — Classify the layout typology from geometry, openings and service points before placing anything

```yaml
id: RM-KIT-002
title: Layout typology classification and selection
system: modernism.functionalism
group: typology
version: 1
status: active
applies_to:
  rooms: [kitchen, eat_in_kitchen, kitchenette, studio_apartment, open_plan_combined, great_room, loft, adu_in_law_suite]
  objects: []
  requires_features: []
scope: room_composition
severity: high
confidence: expert_consensus
evidence_class: mixed
belief_gated: false
predicate: |
  # Compute the usable-wall inventory, then admit only typologies the geometry can carry.
  let walls = forEach w in room.walls: {id: w.id, usable_m: usableWallLength(w, min_run_m = p.min_run_m)}
  let usable = filter walls where usable_m >= p.min_run_m
  let W = room.bbox.short_side_m
  let L = room.bbox.long_side_m
  let doors = filter room.openings where kind in [door, doorway, arch, sliding, bifold, french]
  let admissible = []
  if countOf(usable) >= 1                        : admissible += [single_wall]
  if countOf(usable) >= 2 and hasOpposingPair(usable) and W >= (2*p.base_depth_m + p.aisle_one_cook_m) : admissible += [galley]
  if countOf(usable) >= 2 and hasAdjacentPair(usable) : admissible += [l_shape]
  if countOf(usable) >= 3 and hasUShapeSet(usable) and W >= (2*p.base_depth_m + p.u_interior_min_m) : admissible += [u_shape]
  if in admissible(l_shape) and W >= (p.base_depth_m + p.island_depth_m + 2*p.aisle_one_cook_m) and L >= p.island_min_length_m + 2*p.aisle_one_cook_m : admissible += [l_island, single_wall_island]
  if in admissible(u_shape) and room.area_m2 >= p.g_shape_min_area_m2 : admissible += [g_peninsula]
  if room.area_m2 >= p.double_island_min_area_m2 and W >= (p.base_depth_m + 2*p.island_depth_m + 3*p.aisle_two_cook_m) : admissible += [double_island]
  if room.type in [open_plan_combined, great_room, studio_apartment, loft] : admissible += [broken_plan]
  require countOf(admissible) >= 1
  assert room.meta.layout_typology in admissible
  # Prefer the typology that maximises counter frontage per unit floor area, then service economy.
  prefer argmax over admissible of (
      p.w_frontage   * normalisedFrontage(t)
    - p.w_service    * normalisedServiceMoveCost(t)
    - p.w_traffic    * normalisedTrafficConflict(t, doors)
  )
params:
  - key: min_run_m
    default: 1.200
    range: [0.600, 2.400]
    unit: m
    user_editable: false
    rationale: Shortest wall stretch that carries a useful run (two 600 mm / 24 in units).
  - key: base_depth_m
    default: 0.600
    range: [0.550, 0.700]
    unit: m
    user_editable: true
    rationale: Standard base-unit carcass depth; 600 mm (24 in) in both metric and US practice.
  - key: aisle_one_cook_m
    default: 1.067
    range: [0.900, 1.500]
    unit: m
    user_editable: true
    rationale: 1067 mm (42 in) — the long-standing NKBA work-aisle recommendation for one cook.
  - key: aisle_two_cook_m
    default: 1.220
    range: [1.067, 1.800]
    unit: m
    user_editable: true
    rationale: 1220 mm (48 in) — NKBA work aisle where two people cook simultaneously.
  - key: u_interior_min_m
    default: 1.500
    range: [1.220, 2.400]
    unit: m
    user_editable: true
    rationale: Clear dimension inside a U so two opposing doors/drawers can be open at once.
  - key: island_depth_m
    default: 0.900
    range: [0.600, 1.400]
    unit: m
    user_editable: true
    rationale: Working island depth; 900 mm (36 in) gives a real prep face plus service spine.
  - key: island_min_length_m
    default: 1.200
    range: [1.000, 4.500]
    unit: m
    user_editable: true
    rationale: Below 1200 mm (48 in) an island is a table pretending to be an island.
  - key: g_shape_min_area_m2
    default: 13.0
    range: [10.0, 30.0]
    unit: m2
    user_editable: true
    rationale: A G-shape encloses the cook; under ~13 m2 (140 sq ft) it becomes a trap.
  - key: double_island_min_area_m2
    default: 30.0
    range: [24.0, 80.0]
    unit: m2
    user_editable: true
    rationale: Two islands plus three aisles need roughly 30 m2 (325 sq ft) before they stop reading as a corridor.
  - key: w_frontage
    default: 1.0
    range: [0.0, 2.0]
    unit: weight
    user_editable: false
    rationale: How hard the selector pushes for counter and storage frontage.
  - key: w_service
    default: 0.8
    range: [0.0, 3.0]
    unit: weight
    user_editable: true
    rationale: Penalty for typologies that require moving drain, gas or duct. Raise for tight budgets.
  - key: w_traffic
    default: 1.2
    range: [0.0, 3.0]
    unit: weight
    user_editable: false
    rationale: Penalty for typologies that put a through-route inside the work zone.
score:
  weight: 9
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: set_property
    target: room
    transform: {layout_typology: argmax_admissible}
    cost: free
    effort: none
    reversible: true
    copy: Given this room's shape, doors and pipework, the layout that earns its space best is shown below. The others were ruled out, and we'll tell you why.
  - rank: 2
    action: annotate
    target: room
    transform: {note: list_rejected_typologies_with_reason}
    cost: free
    effort: none
    reversible: true
    copy: An island was ruled out here because the room is not wide enough to walk round it. That's a measurement, not an opinion.
conflicts_with: []
supersedes: []
requires_rules: [RM-KIT-001]
tags: [typology, generation, gate, signature_rule]
localization_notes: >
  European fitted-kitchen practice coordinates on 600 mm modules (DIN 68935 family of kitchen
  furniture dimensions); US practice on nominal 3 in cabinet increments. Set p.base_depth_m and
  the module grid from site locale before running the selector.
```

#### Why — tradition
Typology selection has no doctrinal basis in feng shui or vastu — both traditions take the layout
as given and then site the hearth and water within it. The typology vocabulary itself comes from
mid-century planning literature: the University of Illinois Small Homes Council's post-war kitchen
studies named and drew the one-wall, corridor, L and U plans, and the island and peninsula plans
entered the canon with open-plan suburban housing. Treat the names as engineering shorthand, not
style.

#### Why — psychology / physiology
Choosing the typology first is a cognitive-load argument as much as a geometric one: every later
decision (where the bin goes, which way the fridge opens) is cheap once the typology is fixed and
expensive if it is not. Sequencing constraint satisfaction from most-binding to least is standard
practice in layout optimisation. No empirical support exists for a specific typology being
"better" in general — the evidence is that fit to geometry and to household routine dominates.

#### Customer insight
There are only about eight kitchen layouts, and your room has already voted. We measure the walls,
the doors and where the drain is, and tell you which layouts are genuinely possible here — then
you choose on taste between the ones that work, instead of falling in love with one that doesn't fit.

#### Failure modes / when to skip
Do not re-run the selector on an existing kitchen the user has flagged `keep_layout: true` — in
that case the typology is an input, not an output. In a room with four glazed walls, all wall-run
typologies may be inadmissible; hand off to archetype `KIT-ARCH-11`. In a heritage or listed
interior, service-move cost may be effectively infinite; set `w_service` to its maximum.

---

### RM-KIT-003 — Single-wall kitchens are valid only inside a narrow length band

```yaml
id: RM-KIT-003
title: Single-wall layout validity band
system: modernism.functionalism
group: typology
version: 1
status: active
applies_to:
  rooms: [kitchen, kitchenette, studio_apartment, open_plan_combined, loft, adu_in_law_suite]
  objects: [kitchen.counter.run]
  min_room_area_m2: 2.5
scope: room_composition
severity: medium
confidence: expert_consensus
evidence_class: ergonomic
belief_gated: false
predicate: |
  require room.meta.layout_typology == single_wall
  let run = primaryCounterRun(room)
  # Too short and the primitives will not fit; too long and every task becomes a walk.
  assert run.length_m >= p.min_single_wall_m
  penalize(run.length_m > p.max_single_wall_m, weight = p.long_run_penalty)
  # A single wall has no triangle, so enforce sequence instead (RM-KIT-016).
  assert sequenceAlongRun(run) matches one of [
      [cold, prep, wet, prep, heat],
      [cold, prep, heat, prep, wet],
      [wet, prep, heat, cold],
      [cold, prep, wet, heat]
  ]
  # A tall unit at one end must not be the piece that breaks the prep run.
  forbid exists u in storage.tall_cabinet.* where isBetween(u, kitchen.sink.*, kitchen.hob.*) on run
params:
  - key: min_single_wall_m
    default: 2.400
    range: [1.800, 3.000]
    unit: m
    user_editable: false
    rationale: 2400 mm (7 ft 10 in) fits fridge + 600 mm prep + sink + 600 mm prep + hob at 600 mm modules with nothing to spare.
  - key: max_single_wall_m
    default: 4.200
    range: [3.600, 6.000]
    unit: m
    user_editable: true
    rationale: Beyond ~4200 mm (13 ft 9 in) the store-to-cook walk exceeds a comfortable two-pace reach chain.
  - key: long_run_penalty
    default: 4
    range: [0, 10]
    unit: weight
    user_editable: false
    rationale: Soft penalty; a long single wall still works, it is just tiring.
score:
  weight: 6
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: kitchen.counter.island
    transform: {position: parallel_to(primaryCounterRun), offset_m: p.aisle_one_cook_m, job: prep}
    cost: medium
    effort: trade_required
    reversible: false
    copy: Your run is long enough that you're walking rather than turning. A parallel island or a small table opposite turns the walk into a pivot.
  - rank: 2
    action: move_object
    target: appliance.refrigerator.*
    transform: {to: run_end_nearest(room.primaryDoor), keep: landing_space}
    cost: free
    effort: high_physical
    reversible: true
    copy: Put the fridge at the end nearest the door. People raiding it then never have to walk past the cook.
  - rank: 3
    action: annotate
    target: room
    transform: {note: single_wall_sequence_diagram}
    cost: free
    effort: none
    reversible: true
    copy: On one wall, order is everything: cold, board, sink, board, heat. Get that sequence right and a one-wall kitchen cooks beautifully.
conflicts_with: []
supersedes: []
requires_rules: [RM-KIT-002, RM-KIT-016]
tags: [single_wall, small_space, sequence]
localization_notes: Common and fully accepted in UK/EU studio flats and Japanese 1K apartments; treat as a first-class typology, not a compromise.
```

#### Why — tradition
No traditional doctrine; this is a functional rule. Feng shui's kitchen concerns (hob not directly
visible from the entry door, hob and sink not immediately adjacent) apply *within* the run and are
owned by `FS-ROOM-*`; on a single wall they are often unsatisfiable and the doctrine layer should
be told to report the conflict rather than force it (see precedence ladder tier 5 over tier 6).

#### Why — psychology / physiology
The single-wall kitchen replaces rotation with translation: instead of pivoting between three
stations the cook walks. Walking carries a load (a tray, a hot pan) and each metre of carry is a
spill and burn opportunity, which is why the length cap is a safety-adjacent ergonomic limit rather
than a comfort preference. No empirical support for the specific 4200 mm figure; it is derived from
reach-chain geometry, not measured.

#### Customer insight
A one-wall kitchen isn't a bad kitchen — it's a kitchen with one rule: cold, chop, wash, chop, cook,
in that order along the wall. Where it goes wrong is when the run gets so long that making dinner
becomes a commute.

#### Failure modes / when to skip
Skip where the user has declared the space a kitchenette with no ambition to cook full meals.
Do not fire the long-run penalty in a genuinely wide open-plan room where the run is deliberately
stretched for visual composition and an island carries the actual work — in that case the typology
is `single_wall_island`, not `single_wall`.

---

### RM-KIT-004 — Galley aisle width, and what happens at the ends

```yaml
id: RM-KIT-004
title: Galley aisle width and opposing-run geometry
system: ergonomics.task_zones
group: typology
version: 1
status: active
applies_to:
  rooms: [kitchen, kitchenette, eat_in_kitchen, studio_apartment, adu_in_law_suite]
  objects: [kitchen.counter.run]
scope: room_composition
severity: high
confidence: expert_consensus
evidence_class: ergonomic
belief_gated: false
predicate: |
  require room.meta.layout_typology == galley
  let runs = opposingCounterRuns(room)
  let aisle = aisleWidth(runs.a, runs.b)
  let cooks = user.household.simultaneous_cooks ?? 1
  let needed = cooks >= 2 ? p.aisle_two_cook_m : p.aisle_one_cook_m
  assert aisle >= needed
  forbid aisle < p.aisle_absolute_min_m           # hard floor: a bending adult must not be trapped
  # Facing appliance doors must not collide when both are open.
  forEach pair (a, b) in opposingAppliancePairs(room):
    assert (applianceDoorSweep(a).depth_m + applianceDoorSweep(b).depth_m) <= aisle - p.body_squeeze_m
  # A closed (single-entry) galley must not put the heat source at the closed end.
  if galleyEntryCount(room) == 1:
    forbid nearestRunEnd(kitchen.hob.*) == closedEnd(room)
  # A through galley (two entries) must keep the through-route out of the triangle: see RM-KIT-052.
  if galleyEntryCount(room) == 2:
    assert crossesWorkTriangle(throughRoute(room)) == false or room.meta.accepted_conflict contains RM-KIT-052
params:
  - key: aisle_one_cook_m
    default: 1.067
    range: [0.900, 1.500]
    unit: m
    user_editable: true
    rationale: 1067 mm (42 in), the standard one-cook work aisle in NKBA planning guidance.
  - key: aisle_two_cook_m
    default: 1.220
    range: [1.067, 1.800]
    unit: m
    user_editable: true
    rationale: 1220 mm (48 in) so one person can pass behind another who is bending at an open oven.
  - key: aisle_absolute_min_m
    default: 0.900
    range: [0.800, 1.067]
    unit: m
    user_editable: false
    rationale: 900 mm (35 in) lets an adult crouch at a base unit with a body's width still behind them. Below this the aisle is a hazard, not a tight fit.
  - key: body_squeeze_m
    default: 0.150
    range: [0.000, 0.300]
    unit: m
    user_editable: false
    rationale: Residual gap so two open doors do not touch and a hand can still reach between them.
score:
  weight: 9
  curve: step
  partial_credit: true
remedies:
  - rank: 1
    action: set_property
    target: storage.base_cabinet.*
    transform: {on_wall: shallow_side, depth_m: 0.400}
    cost: medium
    effort: trade_required
    reversible: false
    copy: If the aisle is tight, make one side shallower — 400 mm instead of 600 mm base units on the non-working wall buys you 200 mm of aisle and you barely notice the lost depth.
  - rank: 2
    action: set_property
    target: [appliance.dishwasher.*, kitchen.oven.*]
    transform: {door_type: slide_and_hide_or_side_opening}
    cost: high
    effort: trade_required
    reversible: false
    copy: In a narrow galley, a side-opening oven and a slim dishwasher stop the aisle being blocked every time you open something.
  - rank: 3
    action: move_object
    target: kitchen.hob.*
    transform: {to: run_end_nearest_entry, keep: [p.hob_side_clearance_m, hood_route]}
    cost: high
    effort: trade_required
    reversible: false
    copy: Cooking at the dead end of a galley means the only way out is past the pans. Move the hob toward the open end.
conflicts_with: [SAFE-EGR-*, ERG-CLR-*]
supersedes: []
requires_rules: [RM-KIT-002]
tags: [galley, aisle, clearance, two_cook, small_space]
localization_notes: >
  The 1067 mm / 1220 mm pair are North American design guidelines, not code. UK and EU practice
  commonly accepts 1000 mm; Australian practice similar. Treat as user-editable regional defaults.
```

#### Why — tradition
No traditional doctrine governs aisle width. Feng shui does care about the galley's *straightness*
— a long unobstructed corridor kitchen with a door at each end is read as a channel for rushing
qi and `FS-ROOM-*` will want it interrupted — which is a rare case of doctrine and circulation
analysis reaching the same conclusion from opposite premises.

#### Why — psychology / physiology
Two numbers drive the aisle: the depth a bending adult occupies when loading a low drawer or oven
(roughly 750–850 mm from the cabinet face) and the shoulder width of a person passing behind them.
Below about 900 mm one of those two has nowhere to go, and passing becomes a contact event —
relevant because the passer is often carrying something hot. This is straightforward
anthropometrics; see `ERG-CLR-*` for the percentile derivation.

#### Customer insight
The single number that decides whether a galley feels generous or grim is the gap down the middle.
Aim for about 1.05–1.2 m (42–48 in): enough that someone can crouch at the dishwasher while
someone else walks past with a pan. Under 900 mm it will always feel like a squeeze, whatever you
spend on the doors.

#### Failure modes / when to skip
In an apartment galley where the walls cannot move and the aisle is genuinely 800 mm, the rule
cannot be satisfied — report it as an accepted constraint and switch remedies to the
shallow-one-side and side-opening-door strategies rather than repeatedly flagging an unfixable
finding. Where a wheelchair user cooks, `accessibility.*` minimums (a 1525 mm / 60 in turning
circle in a U, 1015 mm / 40 in between opposing faces in a pass-through) supersede these numbers
entirely — see `RM-KIT-068`.

---

### RM-KIT-005 — L-shape leg minimums and the corner you will lose

```yaml
id: RM-KIT-005
title: L-shape leg minimums and corner treatment
system: ergonomics.task_zones
group: typology
version: 1
status: active
applies_to:
  rooms: [kitchen, eat_in_kitchen, open_plan_combined, great_room, studio_apartment, loft]
  objects: [kitchen.counter.run]
scope: room_composition
severity: medium
confidence: expert_consensus
evidence_class: ergonomic
belief_gated: false
predicate: |
  require room.meta.layout_typology in [l_shape, l_island]
  let legs = counterRunLegs(room)
  assert countOf(legs) == 2 and angleBetween(legs[0].axis, legs[1].axis) within [85, 95]
  assert legs[0].length_m >= p.min_leg_m and legs[1].length_m >= p.min_leg_m
  assert (legs[0].length_m + legs[1].length_m) >= p.min_total_leg_m
  # Do not put two of the three primitives in the corner module.
  let cornerZone = cornerModule(legs[0], legs[1], span_m = p.corner_span_m)
  assert countOf(primitivesWithin(cornerZone)) <= 1
  # A sink or hob in the corner needs side clearance to the return wall.
  forEach o in [kitchen.sink.*, kitchen.hob.*]:
    if within(o, cornerZone): assert distanceToWall(o, returnWall) >= p.corner_appliance_offset_m
  # The corner base unit must be a declared corner solution, not a blind void.
  assert cornerBaseUnit(room).type in [storage.base_cabinet.corner_carousel,
                                       storage.base_cabinet.corner_lemans,
                                       storage.base_cabinet.blind_corner_pullout,
                                       storage.base_cabinet.diagonal_door]
params:
  - key: min_leg_m
    default: 1.500
    range: [1.200, 2.400]
    unit: m
    user_editable: true
    rationale: A leg shorter than 1500 mm (59 in) carries the corner unit plus one 600 mm module and nothing useful.
  - key: min_total_leg_m
    default: 3.600
    range: [3.000, 8.000]
    unit: m
    user_editable: true
    rationale: 3600 mm (11 ft 10 in) of total run is the practical floor for fitting all five zones in an L.
  - key: corner_span_m
    default: 0.900
    range: [0.600, 1.200]
    unit: m
    user_editable: false
    rationale: Length along each leg that the corner module effectively consumes.
  - key: corner_appliance_offset_m
    default: 0.300
    range: [0.230, 0.450]
    unit: m
    user_editable: true
    rationale: 300 mm (12 in) of counter between an appliance edge and the return wall so a pan handle and an elbow both fit.
score:
  weight: 6
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: replace_object
    target: storage.base_cabinet.door
    add: storage.base_cabinet.corner_lemans
    transform: {position: corner_module}
    cost: medium
    effort: moderate
    reversible: true
    copy: The corner cupboard is where cookware goes to die. A pull-out or carousel brings the back of it to you instead of you crawling to it.
  - rank: 2
    action: move_object
    target: kitchen.sink.*
    transform: {offset_from_corner_m: 0.300, keep: [landing_left, landing_right]}
    cost: high
    effort: trade_required
    reversible: false
    copy: A sink jammed into the corner means one elbow in the wall. Shift it 300 mm along and washing up stops being a contortion.
  - rank: 3
    action: annotate
    target: cornerModule
    transform: {note: assign_to_zone(non_consumables_low_frequency)}
    cost: free
    effort: none
    reversible: true
    copy: If the corner can't be improved, give it the things you use least — the roasting tin, the big stockpot — not the everyday pans.
conflicts_with: []
supersedes: []
requires_rules: [RM-KIT-002, RM-KIT-056]
tags: [l_shape, corner, storage, clearance]
localization_notes: Corner mechanisms (carousel, Le Mans, magic corner) are catalogue items with real footprints; the furniture catalog is authoritative on their swing envelopes.
```

#### Why — tradition
No traditional doctrine; this is a functional rule. The L-shape's corner problem is a pure artefact
of rectilinear carcass construction: two 600 mm-deep boxes meeting at 90° create a 600 × 600 mm
volume whose far reaches are behind the door aperture of both. Vastu will have an opinion about
*which* leg carries the hob (`VS-ROOM-*`); it has none about the carcass.

#### Why — psychology / physiology
Reach into a blind corner requires trunk flexion plus shoulder abduction beyond the comfortable
envelope, which is why people simply stop using the back of it — the classic "out of sight, out of
use" storage failure. Declaring the corner's contents low-frequency is therefore not a defeat but
a correct frequency-of-use allocation, the same principle behind the golden-zone concept in
`ERG-CLR-*`.

#### Customer insight
An L-shaped kitchen is the most forgiving layout there is, with one catch: the corner. Decide now
whether you're buying a mechanism to make it work or accepting that it's where the Christmas
roasting tin lives. Both are fine. Pretending it's normal storage is not.

#### Failure modes / when to skip
Skip the corner-solution assertion in a rental or a no-change budget; downgrade to advisory. Skip
the leg minimums where the L is deliberately asymmetric because an island carries the prep work
(typology `l_island`) — in that case the short leg may legitimately be a tall-unit bank only.

---

### RM-KIT-006 — U-shape interior clear width, and the trap at the closed end

```yaml
id: RM-KIT-006
title: U-shape interior clear width and opening
system: ergonomics.task_zones
group: typology
version: 1
status: active
applies_to:
  rooms: [kitchen, eat_in_kitchen, studio_apartment, adu_in_law_suite]
  objects: [kitchen.counter.run]
scope: room_composition
severity: high
confidence: expert_consensus
evidence_class: ergonomic
belief_gated: false
predicate: |
  require room.meta.layout_typology in [u_shape, g_peninsula]
  let inner = uInteriorPolygon(room)
  assert inner.min_width_m >= p.u_interior_min_m
  assert turningCircle(centroid(inner), diameter_m = p.u_turn_circle_m) == true
  # Facing runs inside the U must satisfy the galley aisle rule too.
  forEach pair (a,b) in opposingRunPairs(inner): assert aisleWidth(a,b) >= p.aisle_one_cook_m
  # Exactly one opening into the U; the cook must never be behind an appliance door to get out.
  assert uEntryCount(room) >= 1
  forEach d in appliancesWithin(inner):
    assert openDoorBlocks(d, escapeRoute(centroid(inner), uEntry(room)), min_width_m = p.escape_width_m) == false
  # The base of the U is the deepest point: put the least-trafficked primitive there.
  prefer primitiveAt(uBase(room)) in [wet, heat] and primitiveAt(uArmNearEntry(room)) == cold
params:
  - key: u_interior_min_m
    default: 1.500
    range: [1.220, 2.600]
    unit: m
    user_editable: true
    rationale: 1500 mm (59 in) clear between opposing fronts so two people and two open drawers coexist.
  - key: u_turn_circle_m
    default: 1.200
    range: [0.900, 1.525]
    unit: m
    user_editable: true
    rationale: Ambulant pivot circle. Raise to 1525 mm (60 in) when a wheelchair user cooks — see RM-KIT-068.
  - key: aisle_one_cook_m
    default: 1.067
    range: [0.900, 1.500]
    unit: m
    user_editable: true
    rationale: As RM-KIT-004.
  - key: escape_width_m
    default: 0.600
    range: [0.450, 0.900]
    unit: m
    user_editable: false
    rationale: Residual width to leave the U past a fully open appliance door while carrying nothing.
score:
  weight: 8
  curve: step
  partial_credit: true
remedies:
  - rank: 1
    action: remove_object
    target: storage.base_cabinet.door
    transform: {from: shallowest_arm, replace_with: open_leg_or_shallow_400}
    cost: medium
    effort: trade_required
    reversible: false
    copy: A U under about 1.5 m across the middle feels like standing in a box. Taking one arm down to a shallower depth — or losing it altogether — is usually worth more than the storage it holds.
  - rank: 2
    action: move_object
    target: appliance.refrigerator.*
    transform: {to: u_arm_nearest(uEntry), keep: hinge_rule}
    cost: free
    effort: high_physical
    reversible: true
    copy: Put the fridge on the arm nearest the way in, so everyone else can grab a drink without stepping into your cooking space.
  - rank: 3
    action: set_property
    target: kitchen.oven.*
    transform: {door_type: side_opening}
    cost: high
    effort: trade_required
    reversible: false
    copy: In a tight U, a side-opening oven door is the difference between a blocked exit and a clear one.
conflicts_with: [SAFE-EGR-*, ERG-CLR-*]
supersedes: []
requires_rules: [RM-KIT-002, RM-KIT-004]
tags: [u_shape, aisle, clearance, escape]
localization_notes: ADA/ICC A117.1 require 1525 mm (60 in) clear within a U-shaped accessible kitchen; that figure supersedes p.u_interior_min_m when accessibility is flagged.
```

#### Why — tradition
No traditional doctrine on the U's dimensions. Feng shui does read the U favourably in one respect
— the cook is enclosed and supported on three sides, which `FS-ROOM-*` treats as a form of
"mountain behind" — and unfavourably in another, because a single-entry U can put the cook's back
to the only door, which the command-position layer (`FS-CMD-*`) dislikes. Expect that tension and
let the doctrine layer resolve it with a mirror or a reflective splashback rather than by moving
the hob.

#### Why — psychology / physiology
The U is the most efficient layout by pure pivot geometry — three stations reachable with minimal
translation — and simultaneously the most claustrophobic and the most escape-constrained, because
there is one way out and appliance doors open into it. That single-exit property is the reason the
escape-route clause exists: in a pan fire the cook's route out must not require closing an oven
door first. `SAFE-*` owns the verdict; this rule owns the geometry.

#### Customer insight
A U-shaped kitchen is the best one-cook layout going: everything is a half-turn away. Two things
to get right — keep at least 1.5 m across the middle so it doesn't feel like a cubicle, and make
sure you can walk out of it with an oven door open.

#### Failure modes / when to skip
Skip in rooms under about 7 m2 (75 sq ft), where a U will always fail the interior width test and
the correct answer is a galley or L. Do not fire the "cold on the arm nearest the entry"
preference where the fridge is integrated into a tall bank that architecturally must stay put.

---

### RM-KIT-007 — G-shape and peninsula: keep the gap you enter through

```yaml
id: RM-KIT-007
title: G-shape / peninsula entry gap and end conditions
system: circulation.desire_lines
group: typology
version: 1
status: active
applies_to:
  rooms: [kitchen, eat_in_kitchen, open_plan_combined, great_room]
  objects: [kitchen.counter.peninsula]
scope: room_composition
severity: medium
confidence: expert_consensus
evidence_class: ergonomic
belief_gated: false
predicate: |
  require room.meta.layout_typology == g_peninsula
  let gap = peninsulaEntryGap(room)
  assert gap >= p.entry_gap_min_m
  # The peninsula must have a declared job, like an island (RM-KIT-043).
  assert kitchen.counter.peninsula.meta.job in [prep, seating, serving, storage, cook, wet]
  # Do not terminate a peninsula in a sharp corner in the walking line.
  assert peninsulaFreeEnd(room).corner_treatment in [radius_min_50mm, chamfer, rounded_worktop]
  # Seating on a peninsula must sit on the outside face, not inside the work zone.
  forEach s in seating.stool.* where servedBy(s) == kitchen.counter.peninsula:
    assert faceOf(s) == outerFace(kitchen.counter.peninsula)
  # A peninsula must not create a dead-end longer than one body-length inside the G.
  assert deadEndDepth(uInteriorPolygon(room)) <= p.max_dead_end_m
params:
  - key: entry_gap_min_m
    default: 0.900
    range: [0.760, 1.220]
    unit: m
    user_editable: true
    rationale: 900 mm (36 in) is the standard walkway width; the G's single entry gap should not be tighter.
  - key: max_dead_end_m
    default: 2.400
    range: [1.500, 4.000]
    unit: m
    user_editable: true
    rationale: Beyond ~2400 mm (8 ft) of dead end, being at the far side while someone works at the entry feels like being penned in.
score:
  weight: 5
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: set_property
    target: kitchen.counter.peninsula
    transform: {length_m: reduce_until(entryGap >= p.entry_gap_min_m)}
    cost: medium
    effort: trade_required
    reversible: false
    copy: Shortening the peninsula by even 200 mm can turn a squeeze into a proper doorway. You will not miss the worktop; you will notice the gap.
  - rank: 2
    action: set_property
    target: kitchen.counter.peninsula
    transform: {free_end: radius_100mm}
    cost: low
    effort: moderate
    reversible: false
    copy: Round off the open end of the peninsula. It is exactly hip height and exactly in the walking line — a sharp corner there will find you.
conflicts_with: [CIR-*]
supersedes: []
requires_rules: [RM-KIT-002, RM-KIT-043]
tags: [g_shape, peninsula, circulation, corner_safety]
localization_notes: None.
```

#### Why — tradition
No traditional doctrine; this is a functional rule. The peninsula's real doctrinal exposure is
that it often carries either the hob or the sink, at which point `FS-ROOM-*` fire/water rules and
the island rules in `RM-KIT-048` both engage.

#### Why — psychology / physiology
A G-shape converts a U into a near-enclosure with one gap, and the gap is doing two jobs: entry
and escape. Narrow it and the space reads as a pen — the crowding literature (`psych.crowding`)
associates single-exit enclosure with perceived loss of control more strongly than with raw
density. The rounded-corner clause is mundane injury prevention: a worktop corner sits at adult
hip and child head height in a walking line.

#### Customer insight
A peninsula gives you an extra stretch of worktop and somewhere to perch — but it also half-closes
the room. Keep the way in at least 900 mm wide, and round off the open end, because that corner
sits exactly where hips and small heads travel.

#### Failure modes / when to skip
Skip where the "peninsula" is actually a full-height tall-unit return, which is a wall, not a
peninsula. Do not fire the dead-end rule where the far side of the G opens to a second doorway —
that is a through-galley, not a G.

---

### RM-KIT-008 — The island feasibility gate: can this room actually take one?

```yaml
id: RM-KIT-008
title: Island feasibility gate
system: ergonomics.task_zones
group: typology
version: 1
status: active
applies_to:
  rooms: [kitchen, eat_in_kitchen, open_plan_combined, great_room, loft]
  objects: [kitchen.counter.island]
scope: room_composition
severity: high
confidence: expert_consensus
evidence_class: ergonomic
belief_gated: false
predicate: |
  # Width maths, run first, before any island is drawn.
  let runsDepth = sumOf(depth_m) over perimeterRuns(room) facing the island line
  let need = runsDepth + p.island_depth_min_m + (numberOfAislesAround(island) * p.aisle_one_cook_m)
  require room.bbox.short_side_m >= need
  require room.bbox.long_side_m  >= p.island_length_min_m + 2 * p.end_aisle_min_m
  require room.area_m2 >= p.island_min_room_area_m2
  # Nothing above the island may be lower than head height.
  assert headroomOver(footprint(kitchen.counter.island)) >= p.island_headroom_m
  # If the island carries services, a route for them must exist.
  if island.meta.job in [wet, cook]:
    require serviceRouteFeasible(island, kinds = island.needs) == true
params:
  - key: island_depth_min_m
    default: 0.900
    range: [0.600, 1.400]
    unit: m
    user_editable: true
    rationale: 900 mm (36 in) minimum working depth; under 600 mm (24 in) it is a console, not an island.
  - key: island_length_min_m
    default: 1.200
    range: [1.000, 4.500]
    unit: m
    user_editable: true
    rationale: 1200 mm (48 in) is the shortest island that holds a real prep face.
  - key: aisle_one_cook_m
    default: 1.067
    range: [0.900, 1.500]
    unit: m
    user_editable: true
    rationale: As RM-KIT-004.
  - key: end_aisle_min_m
    default: 0.900
    range: [0.760, 1.220]
    unit: m
    user_editable: true
    rationale: 900 mm (36 in) at the island ends where no work happens, purely to walk round.
  - key: island_min_room_area_m2
    default: 14.0
    range: [11.0, 40.0]
    unit: m2
    user_editable: true
    rationale: Below roughly 14 m2 (150 sq ft) an island eats the room it sits in.
  - key: island_headroom_m
    default: 2.000
    range: [1.900, 2.400]
    unit: m
    user_editable: false
    rationale: Standing headroom over a working surface; pendants and hoods are excluded and handled by RM-KIT-038 and LGT-*.
score:
  weight: 9
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: replace_object
    target: kitchen.counter.island
    add: kitchen.counter.peninsula
    transform: {attach_to: nearest_run_end}
    cost: medium
    effort: trade_required
    reversible: false
    copy: There isn't room to walk all the way round an island here. A peninsula attached at one end gives you the same worktop and keeps the floor open.
  - rank: 2
    action: replace_object
    target: kitchen.counter.island
    add: tables.dining.rectangular
    transform: {position: parallel_to_run, offset_m: p.aisle_one_cook_m, movable: true}
    cost: low
    effort: low
    reversible: true
    copy: A narrow table on castors does most of what an island does and can be pushed aside when you need the floor.
  - rank: 3
    action: annotate
    target: room
    transform: {note: island_rejected_with_measurements}
    cost: free
    effort: none
    reversible: true
    copy: We'd love to give you the island. The room is 2.9 m across and the maths needs 3.1 m — here's exactly where the shortfall is.
conflicts_with: [CIR-*]
supersedes: []
requires_rules: [RM-KIT-002, RM-KIT-045]
tags: [island, gate, generation, signature_rule]
localization_notes: None.
```

#### Why — tradition
No traditional doctrine on island feasibility. Once an island exists, doctrine engages hard:
`FS-ROOM-*` has strong views on a hob on an island (fire unsupported, cook exposed) and on a sink
opposite a hob (water attacking fire), and `FS-CMD-*` likes the island hob because the cook faces
the room. Those views apply after this gate passes, not before.

#### Why — psychology / physiology
This is arithmetic, not psychology: an island consumes its own depth plus an aisle on every side
that is used, and aisles do not overlap. The reason it deserves a hard gate is behavioural — the
island is the single most-requested kitchen feature and the most common cause of an unusable
kitchen, because clients specify it before the room is measured. Refusing it with the measurement
shown is the honest move.

#### Customer insight
Islands are wonderful and they are also the most common way a kitchen goes wrong. The test is
simple: your worktop depth, plus the island, plus a real gap on every side you'll walk down. If
the room is narrower than that total, an island will make the kitchen worse — and a peninsula will
make it better.

#### Failure modes / when to skip
Where only three sides of the island are ever used (one end against a wall or a bank of tall
units), count three aisles, not four. In a very long narrow open-plan room the island may pass the
area test but create a 12 m corridor; hand off to `CIR-*` for the route check. Skip entirely for
`kitchenette`.

---

### RM-KIT-009 — Two islands need three aisles and two different jobs

```yaml
id: RM-KIT-009
title: Double-island validity
system: ergonomics.task_zones
group: typology
version: 1
status: active
applies_to:
  rooms: [kitchen, eat_in_kitchen, open_plan_combined, great_room]
  objects: [kitchen.counter.island]
  min_room_area_m2: 24.0
scope: room_composition
severity: medium
confidence: expert_consensus
evidence_class: ergonomic
belief_gated: false
predicate: |
  require countOf(kitchen.counter.island, room) == 2
  let A = islands[0], B = islands[1]
  # Distinct declared jobs — two prep islands is one island with a gap in it.
  assert A.meta.job != B.meta.job
  assert setOf(A.meta.job, B.meta.job) in p.valid_job_pairs
  # Three aisles: run-to-A, A-to-B, B-to-far-side.
  assert aisleWidth(perimeterRun(room), A) >= p.work_aisle_m
  assert aisleWidth(A, B) >= p.between_islands_m
  assert clearance(B, farSide) >= p.walkway_m
  # The working island must be the one nearer the hob and sink.
  assert distance(workingIsland(room), kitchen.hob.*) <= distance(socialIsland(room), kitchen.hob.*)
  # Seating belongs on the social island's outer face only.
  forbid exists s in seating.stool.* where servedBy(s) == workingIsland(room)
params:
  - key: valid_job_pairs
    default: [[prep, seating], [wet, seating], [cook, seating], [prep, serving], [wet, prep]]
    range: null
    unit: enum_set
    user_editable: false
    rationale: A second island is only justified when it takes a whole function off the first.
  - key: work_aisle_m
    default: 1.067
    range: [0.900, 1.500]
    unit: m
    user_editable: true
    rationale: As RM-KIT-004, between the perimeter run and the working island.
  - key: between_islands_m
    default: 1.220
    range: [1.067, 2.000]
    unit: m
    user_editable: true
    rationale: The between-islands aisle carries two-way traffic plus a seated person's chair pull-back on one side.
  - key: walkway_m
    default: 0.900
    range: [0.760, 1.220]
    unit: m
    user_editable: true
    rationale: 900 mm (36 in) simple walkway behind the social island.
score:
  weight: 5
  curve: step
  partial_credit: true
remedies:
  - rank: 1
    action: replace_object
    target: [island_b]
    add: tables.dining.rectangular
    transform: {position: inline_with(island_a), gap_m: 0.900}
    cost: medium
    effort: trade_required
    reversible: false
    copy: Two islands only earn their keep when they do different jobs. If the second one is really where people sit and eat, a table there will be more comfortable and cost less.
  - rank: 2
    action: set_property
    target: [island_a]
    transform: {job: prep_and_cook, seating: none}
    cost: free
    effort: none
    reversible: true
    copy: Give the island nearest the cooker the messy jobs and keep it seat-free, so the second island can be the place people gather.
conflicts_with: [CIR-*]
supersedes: []
requires_rules: [RM-KIT-008, RM-KIT-043]
tags: [double_island, island, large_kitchen, job_declaration]
localization_notes: None.
```

#### Why — tradition
No traditional doctrine. Note that a double island often resolves a feng shui problem rather than
creating one: it lets the hob sit on a supported perimeter wall (which `FS-ROOM-*` prefers) while
the social island takes the guests out of the cook's space, so the doctrine layer will usually
score a well-jobbed double island *higher* than a single hob-island.

#### Why — psychology / physiology
The functional case for two islands is territorial, not spatial: it gives the cook a surface no
one leans on and gives guests a surface they are invited to occupy. That separation is the same
mechanism behind `RM-KIT-049` — declared territory reduces negotiation. Without distinct jobs the
second island is just a wider island with a walkway cut through it, and the walkway invites
through-traffic into the work zone.

#### Customer insight
Two islands can be brilliant, but only if they're doing different things — one for chopping and
cooking, one for sitting, drinks and homework. Two prep islands is just one island with a corridor
down the middle, and you'll trip over that corridor every day.

#### Failure modes / when to skip
Skip below the area gate. Do not fire where the second "island" is a freestanding butcher's block
under 900 mm long — that is furniture. Where the household genuinely has two simultaneous cooks
working on different dishes, `[prep, prep]` may be a legitimate pair; allow it when
`user.household.simultaneous_cooks >= 2` and both islands have their own water or heat.

---

### RM-KIT-010 — In open plan, the kitchen must have a declared, legible boundary

```yaml
id: RM-KIT-010
title: Broken-plan / open-plan-corner kitchen boundary
system: zoning.public_private
group: typology
version: 1
status: active
applies_to:
  rooms: [open_plan_combined, great_room, studio_apartment, loft, eat_in_kitchen]
  objects: []
scope: room_composition
severity: medium
confidence: evidence_moderate
evidence_class: mixed
belief_gated: false
predicate: |
  require room.type in [open_plan_combined, great_room, studio_apartment, loft]
  let k = kitchenZonePolygon(room)
  require k != null and k.area_m2 >= p.min_kitchen_zone_m2
  # The boundary must be readable by at least two of these devices.
  let devices = count of true in [
    exists o in [kitchen.counter.island, kitchen.counter.peninsula] where boundsZone(o, k),
    floorFinishChanges(k.boundary),
    ceilingPlaneChanges(k.boundary),                 # soffit, drop, coffer, beam
    lightingSceneSeparate(k),                        # owned by LGT-*
    levelChange(k.boundary) or partialScreen(k.boundary),
    cabinetryRunTerminatesWithEndPanel(k.boundary)
  ]
  assert devices >= p.min_boundary_devices
  # Through-traffic between the other zones must not pass through the kitchen zone.
  forEach route in majorRoutes(room):
    assert overlapLength(route, k) <= p.max_route_intrusion_m
  # The cook must be able to see and be seen — open plan's whole point.
  assert lineOfSight(cookStandPoint(room), socialFocalPoint(room)) == true
params:
  - key: min_kitchen_zone_m2
    default: 5.0
    range: [3.0, 20.0]
    unit: m2
    user_editable: true
    rationale: Floor area of the working zone itself, excluding shared circulation.
  - key: min_boundary_devices
    default: 2
    range: [1, 4]
    unit: count
    user_editable: true
    rationale: One device reads as accidental; two read as intentional and make the zone legible.
  - key: max_route_intrusion_m
    default: 1.000
    range: [0.000, 3.000]
    unit: m
    user_editable: true
    rationale: A route may clip the corner of the kitchen zone but must not run through it.
score:
  weight: 6
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: kitchen.counter.island
    transform: {position: on(k.boundary), orientation: long_axis_parallel_to_boundary, job: prep_and_seating}
    cost: high
    effort: trade_required
    reversible: false
    copy: An island along the edge of the kitchen does the job of a wall without blocking the light: it tells people where the kitchen stops and where they're welcome to lean.
  - rank: 2
    action: set_property
    target: room.finishes.ceiling
    transform: {add: dropped_soffit_over(k), depth_m: 0.200}
    cost: high
    effort: trade_required
    reversible: false
    copy: Dropping the ceiling slightly over the kitchen makes it feel like a room of its own from inside, and tidies the extract duct and downlights at the same time.
  - rank: 3
    action: set_property
    target: room.finishes.floor
    transform: {change_material_at: k.boundary}
    cost: medium
    effort: trade_required
    reversible: false
    copy: Changing the floor at the kitchen edge is the cheapest way to draw the line — and it lets you use something properly wipeable where the spills happen.
  - rank: 4
    action: add_object
    add: lighting.pendant.island
    transform: {count: derived, over: k, circuit: separate}
    cost: low
    effort: moderate
    reversible: true
    copy: Put the kitchen lights on their own switch. Being able to turn the working end down when you sit down changes the whole room.
conflicts_with: [ACU-*, CIR-*]
supersedes: []
requires_rules: [RM-KIT-002]
tags: [open_plan, broken_plan, zoning, boundary, sightline]
localization_notes: >
  Some jurisdictions restrict fully open kitchens adjacent to means of egress or require a fire
  separation between kitchen and stair enclosure; jurisdiction_varies and SAFE-* governs.
```

#### Why — tradition
Feng shui doctrine is genuinely hostile to a fully open kitchen — the hearth visible from the
entry and from the dining table is a classic objection, and `FS-ROOM-*` will propose exactly these
screening devices. Vastu is similarly concerned with the cooking fire being on view. The
functional argument for a boundary arrived independently through the "broken plan" movement in
contemporary residential design, which retreated from total openness on acoustic and visual-noise
grounds.

#### Why — psychology / physiology
Zone legibility reduces negotiation cost: when people can see where the kitchen ends they position
themselves without being asked to move. This is territoriality (`psych.territoriality`) plus the
space-syntax observation that movement follows visually continuous floor. There is reasonable
evidence that open-plan living raises noise and visual-clutter exposure; the specific benefit of
two-versus-one boundary devices is a design heuristic, not a measured effect.

#### Customer insight
Open plan works best when the kitchen is still clearly *a kitchen*. Two quiet signals do it — an
island along the edge and a change of floor, say — and suddenly people know where to stand,
noise feels more contained, and you can dim the working end when you sit down to eat.

#### Failure modes / when to skip
Skip in a genuine studio under about 25 m2 where every device you add subdivides an already tiny
space; there, prefer a single strong device (the run itself with end panels). Do not require a
soffit where ceiling height is under 2.4 m. Where the user's stated goal is maximum openness and
they have declined screening, downgrade to advisory and shift effort to `RM-KIT-053` (sightline to
the mess) instead.

---
