# Entry / Foyer / Mudroom / Porch Entry — Functional & Design Layer
<!-- library-file: v1 | system(s): modernism.functionalism, pattern_language.alexander, circulation.space_syntax, circulation.desire_lines, ergonomics.task_zones, ergonomics.anthropometrics, behavior.habit_design, psych.cognitive_load, psych.proxemics, zoning.public_private, safety.security_cpted, accessibility.universal_design, accessibility.ada, materials.tactility, product.parameter | rule-id-prefixes: RM-ENT | author-agent: room-01-entry -->

## Scope

This file owns the **functional / practical / design** layer for the arrival threshold of a dwelling:

- `entry_foyer` — a room or bay whose primary job is arrival and departure.
- `mudroom` — a servant entry with a dirty-to-clean gradient, usually secondary/back/garage door.
- `porch_entry` — the covered outside half of the threshold (mat, parcel, lock, light, shelter).
- The **no-hall condition**: an apartment or studio front door that opens directly into a living
  space, where the entry must be *fabricated* rather than occupied (`studio_apartment`,
  `open_plan_combined`, `hallway_corridor` used as entry).
- The **apartment shared-corridor context**: what may and may not live outside the door.

What this file covers: the drop-zone inventory and where each item lives; capacity formulas
(hooks, coat rail, shoe pairs, cubby bays) as editable parameters; arrival/departure
choreography for hands-full, rain, child-carrying, shopping, wheelchair and walker arrivals;
guest-versus-family channels; seating and the perch-height rule; the landing surface beside the
door; mirror placement as a practical device; the first-three-seconds view; threshold and
transition design; the water-and-grit zone, floor material and the two-mat system; door swing
versus furniture; radiator/service conflicts; pram, bike, parcel and returns staging; the
mudroom dirty-to-clean sequence and its laundry adjacency; pet stations; security sightlines and
privacy from an open door; and friction design for the entry clutter hot-spot.

What this file does **not** own, and deliberately defers to (see `## CROSS_REFERENCES`): feng shui
doctrine for the entry mouth-of-qi, the bagua overlay and command position (`FS-ROOM-*`,
`FS-BAG-*`, `FS-CMD-*`); vastu directional zoning of the entrance (`VS-ROOM-*`); the
authoritative anthropometric clearance tables (`ERG-CLR-*`); photometric targets and luminaire
selection (`LGT-*`); acoustics (`ACU-*`); colour (`CLR-*`); whole-home circulation graph
(`CIR-*`); egress, fire, trip, tip-over, child, senior-fall and security hardware rules
(`SAFE-*`). Where those layers apply to this room, the rules below **apply** them with explicit
parameter values and a priority order instead of re-deriving them.

Two closing blocks specific to this file — `## LAYOUT_ARCHETYPES` and `## GENERATION_RECIPE` —
give the engine parametric templates and a deterministic furnishing algorithm for this room.

## Rule count: 50

## Rules

### RM-ENT-001 — Every entrance must have a declared arrival zone

```yaml
id: RM-ENT-001
title: Every entrance must have a declared arrival zone
system: pattern_language.alexander
group: room_program
version: 1
status: active
applies_to:
  rooms: [entry_foyer, mudroom, porch_entry, hallway_corridor, studio_apartment, open_plan_combined]
  objects: []
  requires_features: []
scope: room_composition
severity: high
confidence: expert_consensus
evidence_class: mixed
belief_gated: false
predicate: |
  forEach door in site.exteriorDoors where door.is_egress or door.usage_rank <= p.rank_considered
    let zone = arrivalZone(door)                 # explicit room, or fabricated bay
    assert zone != null
    assert footprintArea(zone) >= p.min_zone_area_m2
    assert minDimension(zone) >= p.min_zone_depth_m
    assert pathWidth(door.centroid, zone.centroid, p.min_through_width_m) >= p.min_through_width_m
    prefer transitionCues(zone, adjacentRoom(zone)) >= 2
params:
  - key: min_zone_area_m2
    default: 1.30
    range: [0.80, 6.00]
    unit: m2
    user_editable: true
    rationale: >
      Floor area needed for one adult to stand, set a bag down and turn 90 degrees without
      stepping back into the door swing. 1.30 m2 is roughly 1.1 x 1.2 m (43 x 47 in).
  - key: min_zone_depth_m
    default: 1.100
    range: [0.800, 2.400]
    unit: m
    user_editable: true
    rationale: >
      Depth from the closed door face into the home. 1.10 m (43 in) lets the door open and a
      person stand clear of the leaf. Below 0.80 m (31 in) the zone is a doorway, not an entry.
  - key: min_through_width_m
    default: 0.900
    range: [0.760, 1.500]
    unit: m
    user_editable: true
    rationale: >
      Clear walking width out of the arrival zone. 0.900 m (36 in) matches the IRC minimum
      hallway width and the ADA accessible-route clear width, so it is the safe default.
    jurisdiction_varies: true
    code_family: IRC R311.6 / ADA 403.5
  - key: rank_considered
    default: 2
    range: [1, 4]
    unit: count
    user_editable: false
    rationale: >
      How many doors get an arrival zone. 1 = front door only; 2 = front plus the everyday
      secondary door (garage/back), which is where the real mess lands.
score:
  weight: 9
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: declare_zone
    target: room.entryZone
    transform: {method: fabricate_from_rug_and_console, anchor: latch_side_wall}
    cost: low
    effort: low
    reversible: true
    copy: Mark out an arrival zone with a washable rug and a narrow shelf, even if there is no hall.
  - rank: 2
    action: move_object
    target: any
    transform: {clear: arrivalZone, min_area_m2: 1.30}
    cost: free
    effort: medium_physical
    reversible: true
    copy: Clear about 1.1 x 1.2 m (4 ft x 4 ft) of floor just inside the door and keep it furniture-free.
  - rank: 3
    action: add_object
    add: softgoods.rug.washable
    transform: {position: inside_door, size_min_m: [0.90, 1.20]}
    cost: low
    effort: low
    reversible: true
    copy: A washable rug the width of the doorway is the cheapest way to say "this is the entry".
conflicts_with: []
supersedes: []
requires_rules: []
tags: [entry, program, threshold, signature_rule, no_hall]
localization_notes: >
  In climates with a genuine winter, regional practice is a full vestibule or mudroom; in warm
  climates a shelf-and-rug bay is normal and sufficient. The minimum area is climate-invariant.
```

#### Why — tradition
*A Pattern Language* treats arrival as a designed sequence rather than a door: **Main Entrance**
(pattern 110) asks that the entrance be visible from the approach, **Entrance Transition**
(pattern 112) asks for a marked change of light, level, surface or view between street and
house, and **Entrance Room** (pattern 130) argues for a real place to arrive in rather than a
corridor. Classical planning agrees for different reasons — the vestibule existed to separate
outside from inside, to hold servants, mud and weather. Feng shui also treats the entry as the
single most important room in the home (the mouth of qi); that doctrine is owned by `FS-ROOM-*`
and is not re-derived here, but note the convergence: three unrelated traditions all say "give
the entrance its own room".

#### Why — psychology / physiology
Two independent mechanisms. First, **event boundaries**: crossing a doorway is a documented
context shift that flushes working memory (the "doorway effect" / location-updating effect
described by Radvansky and colleagues) — a marked transition helps you stop being at work and
start being home, and it is also why you forget what you came for. Second, **cognitive load and
habit formation**: an undefined arrival zone gives dropped items no cue-bound home, so items
land on the nearest horizontal surface; habit research (Wendy Wood and others on context-cued
behaviour) shows stable behaviour follows stable location cues. No effect size is claimed here;
the direction of the effect is well supported, the magnitude in homes is not measured.

#### Customer insight
Your front door needs a *place*, not just a doorway — somewhere to stand, put things down and
turn around. Even a metre of floor with a rug, a shelf and a light of its own will stop the
"everything lands on the stairs" problem, because things only stay tidy when they have a home
within one step of where you drop them.

#### Failure modes / when to skip
Do not fire on a door that is genuinely never used (a sealed second front door, a French door
onto a balcony treated as a window) — the engine must check `usage_rank`. In a very small studio
(<25 m²) the 1.30 m² zone may have to overlap the main circulation route; that is acceptable and
the rule should relax to `min_zone_area_m2: 0.80` rather than fail. Never satisfy this rule by
placing the zone inside a door swing or an egress path — `SAFE-EGR-*` wins.

---

### RM-ENT-002 — The drop-zone inventory: five functions must all be housed

```yaml
id: RM-ENT-002
title: The drop-zone inventory - five functions must all be housed
system: modernism.functionalism
group: drop_zone
version: 1
status: active
applies_to:
  rooms: [entry_foyer, mudroom, hallway_corridor, studio_apartment, open_plan_combined, porch_entry]
  objects: []
  requires_features: []
scope: room_composition
severity: high
confidence: expert_consensus
evidence_class: ergonomic
belief_gated: false
predicate: |
  let z = arrivalZone(room.primaryDoor)
  # the five non-negotiable functions
  assert landingSurface(room.primaryDoor, p.landing_reach_m, 0.70, 1.15) >= p.min_landing_area_m2
  assert hookCapacity(z) + railLength(z) / p.rail_per_garment_m >= requiredOuterwearSlots(user.household)
  assert shoeCapacity(z) >= requiredShoePairs(user.household)
  assert exists(o in z.objects where o.type matches "storage.tray.*|storage.bowl.*|storage.key_rail.*")
  assert exists(o in z.objects where o.type matches "seating.*|storage.bench.*") or exists(leanPoint(z))
  # anything the household actually owns that is missing gets reported, not silently dropped
  forEach item in user.dropZoneInventory
    penalize(homeFor(item) == null, weight=p.missing_item_penalty)
params:
  - key: landing_reach_m
    default: 0.700
    range: [0.400, 1.400]
    unit: m
    user_editable: true
    rationale: >
      How far from the door latch a set-down surface still counts as "at the door". 0.70 m
      (28 in) is roughly one arm's length plus a quarter turn.
  - key: min_landing_area_m2
    default: 0.090
    range: [0.045, 0.400]
    unit: m2
    user_editable: true
    rationale: >
      0.09 m2 is about 300 x 300 mm (12 x 12 in) - enough for a phone, keys, a coffee cup and
      a set of post. Below 0.045 m2 people stop using it.
  - key: rail_per_garment_m
    default: 0.075
    range: [0.045, 0.120]
    unit: m
    user_editable: true
    rationale: >
      Linear rail consumed by one hung garment. 45 mm (1.8 in) for slim shirts, 75 mm (3 in)
      for a normal coat, 100-120 mm (4-4.7 in) for a bulky parka or ski jacket.
  - key: missing_item_penalty
    default: 2
    range: [0, 6]
    unit: points
    user_editable: false
    rationale: Score cost per declared belonging with nowhere to live.
score:
  weight: 9
  curve: linear
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: storage.bench.entry
    transform: {position: on_wall(longest_free_wall), with: [storage.hook_rail.wall above, storage.shoe_rack.open under]}
    cost: medium
    effort: medium
    reversible: true
    copy: One bench with hooks above and open shoe storage underneath covers four of the five jobs in 1 m of wall.
  - rank: 2
    action: add_object
    add: worksurface.ledge.wall_mounted
    transform: {position: latch_side_of_door, height_m: 1.000, depth_m: 0.250}
    cost: low
    effort: low
    reversible: true
    copy: A 250 mm (10 in) deep ledge beside the door gives you somewhere to put things down while you get your key out.
  - rank: 3
    action: add_object
    add: storage.tray.catchall
    transform: {position: on(landingSurface), max_count: 1}
    cost: low
    effort: low
    reversible: true
    copy: Add exactly one tray for keys, cards and sunglasses - one, so there is no argument about where they go.
conflicts_with: [RM-ENT-046]
supersedes: []
requires_rules: [RM-ENT-001]
tags: [drop_zone, inventory, capacity, signature_rule]
localization_notes: >
  Shoe-removal cultures (Japan, Korea, Nordics, much of South and East Asia, most of Canada)
  push the footwear requirement from "nice" to "mandatory" and add a genkan level change; set
  `culture.shoes_off = true` and RM-ENT-011/RM-ENT-041 tighten automatically.
```

#### Why — tradition
No single doctrine specifies this list; it is the functional distillation of how entries have
always been built — the Japanese *genkan* (level change, shoe store, step-down for grit), the
Anglo-American hall stand (mirror, hooks, umbrella well, card tray, seat) and the farmhouse back
kitchen (boots, coats, wet dog, laundry) are the same five functions in different materials.
State this as functional design, not doctrine.

#### Why — psychology / physiology
The mechanism is **serial task interference**. Arrival is a multi-step motor task performed with
occupied hands: unlock, enter, release load, remove outerwear, store footwear, store carried
items. Each function without a home forces an improvised sub-decision at the moment of highest
load, and the improvisation defaults to the floor or the nearest flat surface. Providing a
dedicated home for each step removes the decision. This is choice-architecture / friction
reasoning (Thaler and Sunstein's nudge framing); it is well established in principle,
and there is no home-specific measured effect size to quote.

#### Customer insight
An entry only works if five jobs are covered: somewhere to put things down, somewhere for coats,
somewhere for shoes, somewhere for keys and small stuff, and something to sit or lean on while
you deal with your feet. Miss one and it becomes the pile you apologise for.

#### Failure modes / when to skip
If the household genuinely stores coats and shoes elsewhere (a walk-in by the garage, a bedroom
wardrobe immediately adjacent, a warm climate where nobody wears outerwear), reduce the
requirement rather than forcing furniture into a 1 m² space — set
`requiredOuterwearSlots` from the user's declared behaviour, not from household size. Do not fire
the seating requirement in an entry narrower than `p.min_through_width_m + 0.35 m`; use a
lean-point instead (see RM-ENT-027).

---

### RM-ENT-003 — A landing surface within arm's reach of the door

```yaml
id: RM-ENT-003
title: A landing surface within arm's reach of the door
system: ergonomics.task_zones
group: drop_zone
version: 1
status: active
applies_to:
  rooms: [entry_foyer, mudroom, hallway_corridor, studio_apartment, open_plan_combined, porch_entry]
  objects: [tables.console.narrow, worksurface.ledge.wall_mounted, storage.console.entry, storage.bench.entry]
  requires_features: []
scope: object_placement
severity: high
confidence: ergonomic
evidence_class: ergonomic
belief_gated: false
predicate: |
  let door = room.primaryDoor
  let surfaces = objects(z) where topSurfaceHeight(o) between p.min_height_m and p.max_height_m
                                and usableTopArea(o) >= p.min_area_m2
  assert count(surfaces) >= 1
  let s = nearest(surfaces, door.latchPoint)
  assert distance(s.nearEdge, door.latchPoint) <= p.max_reach_m
  assert stepsFrom(door.insideStandPoint, s) <= p.max_steps
  assert not overlaps(bbox(s), swingSweep(door, 90))
  prefer sameSideAsLatch(s, door) == true
  prefer usableTopArea(s) >= p.comfort_area_m2
params:
  - key: min_height_m
    default: 0.700
    range: [0.600, 1.150]
    unit: m
    user_editable: true
    rationale: >
      Lower bound for a surface you can set a bag on without bending. 700 mm (28 in) is table
      height; anything lower reads as a footstool and gets used as a shoe shelf.
  - key: max_height_m
    default: 1.150
    range: [0.900, 1.350]
    unit: m
    user_editable: true
    rationale: >
      Upper bound: above about 1.15 m (45 in) you cannot see the surface to retrieve small
      objects, and children cannot reach it at all.
  - key: max_reach_m
    default: 0.700
    range: [0.350, 1.400]
    unit: m
    user_editable: true
    rationale: One arm's length from the latch hand, so you can put the bag down before you let go of the door.
  - key: max_steps
    default: 1
    range: [0, 3]
    unit: steps
    user_editable: true
    rationale: Steps measured at 0.70 m (28 in) stride. Two or more steps and the floor wins.
  - key: min_area_m2
    default: 0.060
    range: [0.030, 0.250]
    unit: m2
    user_editable: true
    rationale: 0.06 m2 is about 250 x 240 mm (10 x 9.5 in) - keys, phone, post.
  - key: comfort_area_m2
    default: 0.150
    range: [0.060, 0.600]
    unit: m2
    user_editable: true
    rationale: 0.15 m2 (about 500 x 300 mm / 20 x 12 in) also takes a bag of shopping or a parcel.
score:
  weight: 7
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: worksurface.ledge.wall_mounted
    transform: {wall: latch_side_return, height_m: 1.000, depth_m: 0.250, length_m: 0.600}
    cost: low
    effort: low
    reversible: true
    copy: A slim 250 mm (10 in) shelf on the latch side of the door - it only needs to hold a phone and a parcel.
  - rank: 2
    action: add_object
    add: tables.console.narrow
    transform: {depth_max_m: 0.300, against: nearest_free_wall, clear_of: swingSweep(door, 90)}
    cost: medium
    effort: low
    reversible: true
    copy: A console no deeper than 300 mm (12 in) keeps the walkway open while giving you a surface.
  - rank: 3
    action: add_object
    add: storage.shelf.floating
    transform: {above: storage.hook_rail.wall, height_m: 1.100}
    cost: low
    effort: low
    reversible: true
    copy: If the floor is full, put the shelf above the hooks - keys and post go up, coats hang below.
conflicts_with: [RM-ENT-034, RM-ENT-046]
supersedes: []
requires_rules: [RM-ENT-002]
tags: [landing_space, hands_full, shelf, ergonomics]
localization_notes: None.
```

#### Why — tradition
The Victorian and Edwardian hall stand always carried a marble or wooden slab at about
1.0 m — a card tray, a letter rack and a place for a hat. The Japanese *genkan* provides the
*shikidai* step and a shelf for the same purpose. This is a recurrent vernacular device rather
than a doctrinal rule, so it is presented as functional practice, not as a tradition with
authority.

#### Why — psychology / physiology
Arrival is nearly always **bi-manually loaded**: one hand holds a key or a phone, the other
holds bags, a child, an umbrella or a dog lead. Without a set-down surface inside reach the
load-shedding sequence must complete on the floor, in the door swing, which is exactly where the
trip hazard and the door-blocked failure occur. This is a straightforward reach-envelope and
sequencing argument from occupational ergonomics; no specific study is claimed.

#### Customer insight
You need somewhere to put things down *before* you have a free hand — within one arm's length of
the door, at about waist-to-chest height. A 250 mm (10 in) deep shelf beside the door solves more
daily friction than any other single piece of entry furniture.

#### Failure modes / when to skip
In an entry narrower than 900 mm, a floor-standing console will violate `CIR-*` and `SAFE-EGR-*`;
use a wall-mounted ledge or a shelf above the hooks instead — never allow a console to reduce the
through-path below `p.min_through_width_m`. Skip the surface requirement entirely where the door
opens onto a stair landing with no wall return; in that case relocate to the first available wall
inside and accept `max_steps: 2`.

---

### RM-ENT-004 — Key home: one step from the door, above small-child reach

```yaml
id: RM-ENT-004
title: Key home - one step from the door, above small-child reach
system: behavior.habit_design
group: drop_zone
version: 1
status: active
applies_to:
  rooms: [entry_foyer, mudroom, hallway_corridor, studio_apartment, open_plan_combined]
  objects: [storage.key_rail.wall, storage.bowl.small, storage.tray.catchall]
  requires_features: []
scope: object_placement
severity: medium
confidence: expert_consensus
evidence_class: mixed
belief_gated: false
predicate: |
  let door = room.primaryDoor
  let keys = objects(room) where o.function == "key_home"
  assert count(keys) >= 1
  assert count(keys) <= p.max_key_homes
  let k = keys[0]
  assert distance(k, door.insideStandPoint) <= p.max_distance_m
  assert graspHeight(k) >= p.min_height_m
  assert graspHeight(k) <= p.max_height_m
  assert lineOfSight(door.insideStandPoint, centroid(k)) == true
  forbid isVisibleFromOutside(k, door.openLeaf) and p.hide_from_open_door
  if any(person in user.household where person.age_band in [toddler, child])
    assert graspHeight(k) > childReachHeight(toddler) + p.child_margin_m
params:
  - key: max_key_homes
    default: 1
    range: [1, 2]
    unit: count
    user_editable: true
    rationale: >
      Two key locations means keys are in neither. Allow 2 only for households with separate
      entrances or a declared spare-key box.
  - key: max_distance_m
    default: 1.000
    range: [0.400, 2.000]
    unit: m
    user_editable: true
    rationale: Within about one step and a reach of the standing point just inside the door.
  - key: min_height_m
    default: 1.100
    range: [0.900, 1.400]
    unit: m
    user_editable: true
    rationale: >
      1.10 m (43 in) clears the overhead reach of most two- to three-year-olds, keeping keys
      out of toddler hands and off the floor.
  - key: max_height_m
    default: 1.550
    range: [1.200, 1.800]
    unit: m
    user_editable: true
    rationale: >
      1.55 m (61 in) stays inside a comfortable reach for a 5th-percentile adult female
      standing; higher and shorter household members stop using it.
  - key: child_margin_m
    default: 0.150
    range: [0.000, 0.400]
    unit: m
    user_editable: true
    rationale: Margin above a child's reach so a stretch or a small jump does not succeed.
  - key: hide_from_open_door
    default: true
    range: [true, false]
    unit: bool
    user_editable: true
    rationale: >
      Keys visible through an opened door are an invitation for a through-the-letterbox or
      reach-in theft. Set false only where the door has no glazing or letterplate.
score:
  weight: 6
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: add_object
    add: storage.key_rail.wall
    transform: {wall: latch_side, height_m: 1.400, clear_of: swingSweep(door, 90)}
    cost: low
    effort: low
    reversible: true
    copy: Put a small hook rail for keys at about 1.4 m (55 in) beside the door - high enough that little hands miss it.
  - rank: 2
    action: move_object
    target: storage.bowl.small
    transform: {to: landingSurface, set_back_from_door_m: 0.600}
    cost: free
    effort: low
    reversible: true
    copy: Move the key bowl onto the shelf by the door and set it back from any glazing or letterbox.
  - rank: 3
    action: add_object
    add: storage.cabinet.key_lockable
    transform: {wall: latch_side, height_m: 1.400}
    cost: low
    effort: low
    reversible: true
    copy: A small closed key cabinet keeps car keys out of sight of the door entirely.
conflicts_with: []
supersedes: []
requires_rules: [RM-ENT-002]
tags: [keys, habit, child_safety, security, drop_zone]
localization_notes: >
  In the UK and Ireland, letterplate-in-door is common and relay car-key theft is a known
  pattern; `hide_from_open_door` should stay true and a signal-blocking pouch is a sensible
  add-on. Cross-reference SAFE-SEC-* for the hardware side.
```

#### Why — tradition
No traditional doctrine governs where keys live; this is a functional and behavioural rule. The
nearest historical precedent is the hall-stand card tray, which existed for the same reason:
small objects that travel with you need a home at the boundary.

#### Why — psychology / physiology
This is textbook **context-cued habit design**: a behaviour repeats when the cue (walking
through the door), the location, and the action are stable. A single, fixed, visible key home
within reach of the entry point makes "put keys away" a one-step action performed at the moment
of arrival; two competing homes destroy the cue and reinstate search behaviour. The child-height
component is a straightforward reach-envelope safety measure. Habit-by-context is well supported
in behavioural science generally; no home-entry-specific measurement is claimed.

#### Customer insight
Keys need exactly one home, within a step of the door and at about chest height — high enough
that toddlers cannot reach them, low enough that you can hang them without looking. Two key
bowls is the same as none.

#### Failure modes / when to skip
Skip the child-height clause if the household has no children and no child visitors, since a
lower position is easier for wheelchair users (`isReachableFrom(k, wheelchair)` needs
380–1220 mm / 15–48 in per ADA reach ranges — when a wheelchair user is present, that constraint
outranks the child-height preference and the answer is a *lidded* box inside reach instead).
Do not fire in a home that uses keyless entry only, but do keep the rule for car keys and fobs.

---

### RM-ENT-005 — Charging point at the entry (and the "not in the bedroom" option)

```yaml
id: RM-ENT-005
title: Charging point at the entry (and the "not in the bedroom" option)
system: behavior.habit_design
group: drop_zone
version: 1
status: active
applies_to:
  rooms: [entry_foyer, mudroom, hallway_corridor, studio_apartment, open_plan_combined]
  objects: [electronics.charger.multi_port, worksurface.ledge.wall_mounted, storage.console.entry]
  requires_features: [electrical_outlet]
scope: object_placement
severity: low
confidence: expert_consensus
evidence_class: mixed
belief_gated: false
predicate: |
  let z = arrivalZone(room.primaryDoor)
  let charge = objects(z) where o.type matches "electronics.charger.*" or o.function == "charge_station"
  if user.preferences.phones_charge_outside_bedroom == true
    assert count(charge) >= 1
    let c = charge[0]
    assert distance(c, nearestFeature(c, electrical_outlet)) <= p.max_cord_run_m
    assert graspHeight(c) >= p.min_height_m
    assert deviceChargePoints(z) >= p.ports_per_person * countPersons(user.household, min_age_band=child)
    forbid isUnder(c, feature.kind == vent_supply)
    forbid distanceToHeatSource(c) < p.min_heat_distance_m
    prefer cableManaged(c) == true
    prefer not inIsovist(c, arrivalIsovist(room.primaryDoor, p.isovist_standoff_m))
params:
  - key: ports_per_person
    default: 1.5
    range: [0.5, 3.0]
    unit: count
    user_editable: true
    rationale: A phone plus, for half the household, a watch, earbuds or a tablet.
  - key: max_cord_run_m
    default: 1.200
    range: [0.300, 3.000]
    unit: m
    user_editable: true
    rationale: >
      Keeps cables off the walking surface. Beyond about 1.2 m (47 in) a cord crosses the floor
      and becomes a trip hazard - see SAFE-TRP-*.
  - key: min_height_m
    default: 0.750
    range: [0.300, 1.200]
    unit: m
    user_editable: true
    rationale: >
      Charging at surface height rather than floor level: no crouching, no cable underfoot, and
      the phone is visible so it actually gets collected on the way out.
  - key: min_heat_distance_m
    default: 0.500
    range: [0.200, 1.500]
    unit: m
    user_editable: true
    rationale: >
      Lithium cells and their chargers should not sit on or beside a radiator or heat vent.
      Battery safety detail belongs to SAFE-FIR-*; this is the layout clearance.
  - key: isovist_standoff_m
    default: 0.600
    range: [0.300, 1.500]
    unit: m
    user_editable: true
    rationale: Where a person stands when the door is opened, for the "what a visitor sees" test.
score:
  weight: 4
  curve: step
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: electronics.charger.multi_port
    transform: {on: landingSurface, near: electrical_outlet, cable_route: behind_surface}
    cost: low
    effort: low
    reversible: true
    copy: A small multi-port charger on the entry shelf means phones charge here, not on your bedside table.
  - rank: 2
    action: add_object
    add: storage.drawer.charging_insert
    transform: {in: storage.console.entry, grommet: rear}
    cost: medium
    effort: medium
    reversible: true
    copy: A charging drawer hides the cables and the clutter - close it and the entry looks clean again.
  - rank: 3
    action: add_feature_request
    add: electrical_outlet
    transform: {wall: latch_side, height_m: 1.050, count: 1}
    cost: medium
    effort: trade_required
    reversible: false
    copy: If there is no socket at the entry, adding one at shelf height is a small electrician job with a big payoff.
conflicts_with: [RM-ENT-046]
supersedes: []
requires_rules: [RM-ENT-003]
tags: [charging, phones, sleep_hygiene, cables, drop_zone]
localization_notes: Socket heights and types vary; the height parameter is a target, not a code figure.
```

#### Why — tradition
No traditional doctrine; this is a contemporary functional rule. Where a household has adopted
the "phones sleep outside the bedroom" practice, the entry is the natural docking station
because it is on the path of both arrival and departure.

#### Why — psychology / physiology
Two mechanisms, of different strengths. The **departure-cue** mechanism is habit design: a phone
on the entry shelf is picked up on the way out, so nothing is forgotten — plausible and
consistent with context-cued behaviour, not separately measured. The **sleep** mechanism is
better supported: evening light exposure and device-driven arousal delay sleep onset, and
removing the device from the bedroom removes both the light and the check-it impulse; this is
consistent with the circadian and sleep-hygiene literature (`chronobiology.circadian`,
`sleep_science.environment` own the detail). No specific study or effect size is claimed here.

#### Customer insight
If you want phones out of bedrooms, the entry is the place they should land — a small charger on
the shelf by the door means they charge where you will pick them up on the way out.

#### Failure modes / when to skip
Do not fire unless the user asked for it; an entry charging station is a preference, not a
requirement, and in a shared-corridor apartment a visible phone by a glazed door is a theft
risk (that is why the isovist preference exists). Skip in entries with no socket and no appetite
for electrical work — the fallback is the kitchen counter, not a floor-run extension lead.

---

### RM-ENT-006 — Incoming post triage with a one-way exit

```yaml
id: RM-ENT-006
title: Incoming post triage with a one-way exit
system: behavior.habit_design
group: drop_zone
version: 1
status: active
applies_to:
  rooms: [entry_foyer, mudroom, hallway_corridor, studio_apartment, open_plan_combined]
  objects: [storage.mail_sorter.wall, storage.tray.catchall, storage.bin.paper_recycling]
  requires_features: []
scope: room_composition
severity: medium
confidence: expert_consensus
evidence_class: mixed
belief_gated: false
predicate: |
  let z = arrivalZone(room.primaryDoor)
  if user.dropZoneInventory contains "post"
    let inTray = objects(z) where o.function == "mail_in"
    assert count(inTray) == 1
    assert usableTopArea(inTray[0]) <= p.max_tray_area_m2       # deliberately small: a cap, not a store
    assert distance(inTray[0], room.mailEntryPoint) <= p.max_distance_m
    # the exit path is what stops the pile
    assert exists(o in z.objects where o.function in ["paper_recycling", "shredder"])
           or pathLength(inTray[0], nearestOf("paper_recycling", floor)) <= p.max_disposal_walk_m
    prefer graspHeight(inTray[0]) between 0.900 and 1.300
    penalize count(objects(z) where o.function == "mail_in") > 1, weight=3
params:
  - key: max_tray_area_m2
    default: 0.075
    range: [0.030, 0.200]
    unit: m2
    user_editable: true
    rationale: >
      About A4/letter plus a margin (roughly 300 x 250 mm / 12 x 10 in). A small tray fills
      visibly and forces a decision; a big basket becomes a six-month archive.
  - key: max_distance_m
    default: 1.500
    range: [0.500, 3.000]
    unit: m
    user_editable: true
    rationale: From the letterplate, post box or the door where post is carried in.
  - key: max_disposal_walk_m
    default: 4.000
    range: [1.000, 10.000]
    unit: m
    user_editable: true
    rationale: >
      If the recycling is more than a few steps away, junk mail stops on the nearest surface
      instead. Under 4 m (13 ft) the disposal happens in the same motion as the sort.
score:
  weight: 5
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: storage.bin.paper_recycling
    transform: {position: within_m(1.000, "mail_in"), volume_l: 10, concealed: preferred}
    cost: low
    effort: low
    reversible: true
    copy: Put a small paper recycling bin right under the post tray - most of what arrives should never travel further than this.
  - rank: 2
    action: add_object
    add: storage.mail_sorter.wall
    transform: {wall: entry_wall, height_m: 1.150, slots: 2}
    cost: low
    effort: low
    reversible: true
    copy: A shallow two-slot wall sorter - "needs action" and "for someone else" - keeps post off the surfaces.
  - rank: 3
    action: set_schedule
    target: post
    transform: {cadence: weekly, trigger: tray_full}
    cost: free
    effort: low
    reversible: true
    copy: Let the tray be the timer: when it is full, it gets dealt with. That is why it should be small.
conflicts_with: [RM-ENT-046]
supersedes: []
requires_rules: [RM-ENT-003]
tags: [post, mail, paper, clutter, friction, habit]
localization_notes: >
  Where post is collected from a lobby box or a kerbside mailbox rather than a letterplate,
  `room.mailEntryPoint` is the entry door itself. In shared-corridor apartments the lobby box is
  the first triage point and a lobby recycling bin (if present) does most of this work.
```

#### Why — tradition
The letter rack on the hall stand is the historical device, and it was always small. There is no
belief-system doctrine about post; treat this as functional rule plus behaviour design.

#### Why — psychology / physiology
Two real mechanisms. First, **completion friction**: paper accumulates where the cost of the
next action (shred, recycle, file) is higher than the cost of putting it down; shortening the
distance to disposal inverts that ratio. Second, **capacity as a commitment device**: a container
sized to overflow weekly creates a visible, self-enforcing deadline — the same logic as a small
plate for portion control. Both are standard choice-architecture arguments; neither has a
home-specific measured effect size, and none is claimed.

#### Customer insight
Keep the post tray deliberately small and put the recycling bin directly beneath it. Most of
what comes through the door should never travel further than the doormat — the pile only forms
when the bin is in another room.

#### Failure modes / when to skip
Do not fire for households that have gone fully paperless (`user.dropZoneInventory` will not list
post). In tiny entries the paper bin may have to live in the kitchen; then raise
`max_disposal_walk_m` and accept the weaker arrangement rather than blocking the walkway with a
bin. A shredder is a noisy, sizeable appliance and belongs in the home office, not the entry,
unless the entry is a mudroom with worktop space.

---

### RM-ENT-007 — Outbound staging: the "leaves tomorrow" zone

```yaml
id: RM-ENT-007
title: Outbound staging - the "leaves tomorrow" zone
system: behavior.habit_design
group: drop_zone
version: 1
status: active
applies_to:
  rooms: [entry_foyer, mudroom, porch_entry, hallway_corridor, studio_apartment, open_plan_combined]
  objects: [storage.crate.outbound, storage.basket.woven, storage.shelf.floating, storage.hook.single]
  requires_features: []
scope: room_composition
severity: medium
confidence: expert_consensus
evidence_class: ergonomic
belief_gated: false
predicate: |
  let z = arrivalZone(room.primaryDoor)
  let out = objects(z) where o.function == "outbound_staging"
  assert count(out) >= 1
  assert count(out) <= p.max_stations
  let s = out[0]
  assert containerVolume(s) >= p.min_volume_l
  assert containerVolume(s) <= p.max_volume_l
  assert distance(s, room.primaryDoor.insideStandPoint) <= p.max_distance_m
  assert not overlaps(bbox(s), swingSweep(room.primaryDoor, 90))
  assert not crossesPath(s, throughPath(room))
  assert footprintOnFloor(s) == false or clearance(s, front) >= p.min_front_clear_m
  prefer visibleFrom(room.primaryDoor.insideStandPoint, s) == true    # you must see it to take it
  prefer isEnclosed(s) == true                                        # but not see into it
params:
  - key: min_volume_l
    default: 25
    range: [10, 120]
    unit: l
    user_editable: true
    rationale: >
      About one parcel to return plus a library book and a bag for the charity shop. 25 l is a
      small crate, roughly 400 x 300 x 220 mm (16 x 12 x 9 in).
  - key: max_volume_l
    default: 80
    range: [20, 200]
    unit: l
    user_editable: true
    rationale: >
      A cap, on purpose. Oversized outbound storage becomes permanent storage; the pile is
      supposed to leave.
  - key: max_distance_m
    default: 1.200
    range: [0.400, 2.500]
    unit: m
    user_editable: true
    rationale: Close enough that you trip over the reminder, not so close that you trip over the crate.
  - key: min_front_clear_m
    default: 0.450
    range: [0.300, 0.900]
    unit: m
    user_editable: true
    rationale: Room to crouch and lift a box out without stepping into the door swing.
  - key: max_stations
    default: 1
    range: [1, 3]
    unit: count
    user_editable: true
    rationale: >
      One outbound station per door. Two stations at the same door split the pile and neither
      empties. Allow more only for a mudroom that serves a large household.
score:
  weight: 5
  curve: step
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: storage.crate.outbound
    transform: {position: beside_door_opposite_latch, volume_l: 40, lid: optional}
    cost: low
    effort: low
    reversible: true
    copy: One crate by the door for everything that needs to leave - returns, library books, the thing you keep forgetting.
  - rank: 2
    action: add_object
    add: storage.hook.single
    transform: {wall: door_return, height_m: 1.500, label: "goes out"}
    cost: low
    effort: low
    reversible: true
    copy: A single dedicated hook at eye level for bags that must leave tomorrow works better than a pile on the floor.
  - rank: 3
    action: add_object
    add: storage.shelf.floating
    transform: {above: storage.hook_rail.wall, depth_m: 0.250, reserved_for: outbound}
    cost: low
    effort: low
    reversible: true
    copy: Reserve one shelf - not a whole cupboard - for outbound items, so it is obvious when it is overdue.
conflicts_with: [RM-ENT-008, RM-ENT-046, RM-ENT-048]
supersedes: []
requires_rules: [RM-ENT-002]
tags: [outbound, returns, recycling, library, friction, habit]
localization_notes: >
  Kerbside recycling and bin-day rhythms vary enormously; treat "recycling out" as a scheduled
  outbound item with its own staging point outside the door where a porch or balcony exists.
```

#### Why — tradition
No doctrinal basis. The functional precedent is the tradesman's shelf and the milk step —
vernacular entries have always had a small outbound ledge.

#### Why — psychology / physiology
This is **implementation-intention** and **prospective-memory** support: an intention ("return
this parcel") is far more likely to be executed when it is tied to a specific cue in the path of
the action — the object physically sits between you and the door. Naming the container "outbound"
and capping its size also prevents the well-known failure where a staging area silently becomes
storage. Gollwitzer's implementation-intention work supports the cue-binding principle; the
size-cap claim is design judgement, not measured.

#### Customer insight
Give the things that need to *leave* their own crate by the door — returns, library books, the
coat for the charity shop. Keep it small: a big box turns into storage, a small one nags you
until it is empty.

#### Failure modes / when to skip
Never place the outbound crate in the door swing or the through-path, however convenient — this
is the single commonest cause of the "cannot open the door fully" failure (RM-ENT-034). In
entries under 1.5 m² use a hook or a reserved shelf instead of a floor crate. If the household
already has a parcel-return habit tied to a car boot, the staging point is the garage, not the
entry.

---

### RM-ENT-008 — Parcel and delivery staging that does not block the door

```yaml
id: RM-ENT-008
title: Parcel and delivery staging that does not block the door
system: circulation.desire_lines
group: drop_zone
version: 1
status: active
applies_to:
  rooms: [entry_foyer, porch_entry, mudroom, hallway_corridor, studio_apartment, open_plan_combined]
  objects: [storage.parcel_box.lockable, outdoor.parcel_box.lockable, storage.crate.outbound]
  requires_features: []
scope: room_composition
severity: medium
confidence: expert_consensus
evidence_class: ergonomic
belief_gated: false
predicate: |
  let door = room.primaryDoor
  let stage = zone(room) where z.function == "parcel_staging"
  if user.dropZoneInventory contains "parcels" and user.deliveries_per_week >= p.min_deliveries_trigger
    assert stage != null
    assert footprintArea(stage) >= p.min_area_m2
    assert not overlaps(stage, swingSweep(door, p.swing_protect_deg))
    assert not overlaps(stage, throughPath(room, p.min_through_width_m))
    assert minDimension(stage) >= p.min_dimension_m
    prefer distance(stage.centroid, door.insideStandPoint) <= p.max_distance_m
    prefer adjacency(room, nextRoomOnPath(room, "kitchen")) == true   # groceries land and move on
  if site.hasSheltered(porch) and user.deliveries_unattended == true
    prefer exists(o in porchObjects where o.type matches "outdoor.parcel_box.lockable")
params:
  - key: min_area_m2
    default: 0.420
    range: [0.200, 1.500]
    unit: m2
    user_editable: true
    rationale: >
      0.42 m2 is about 0.60 x 0.70 m (24 x 28 in) - two medium cartons or four bags of
      shopping set down side by side.
  - key: min_dimension_m
    default: 0.550
    range: [0.400, 1.000]
    unit: m
    user_editable: true
    rationale: A large carton is commonly 500 mm (20 in) on its longest side; the bay must take one flat.
  - key: swing_protect_deg
    default: 100
    range: [90, 180]
    unit: deg
    user_editable: true
    rationale: >
      Protect slightly more than the 90-degree swing so a wide-open door for carrying goods in
      is still possible. 180 where the door should be able to lie against the wall.
  - key: min_through_width_m
    default: 0.900
    range: [0.760, 1.200]
    unit: m
    user_editable: true
    rationale: The walking route past the staging bay, matching the accessible-route width.
  - key: max_distance_m
    default: 1.500
    range: [0.500, 3.000]
    unit: m
    user_editable: true
    rationale: Close enough to set a heavy box down immediately on entry.
  - key: min_deliveries_trigger
    default: 1
    range: [0, 10]
    unit: count_per_week
    user_editable: true
    rationale: Households that receive at least one delivery a week need a bay; below that, the floor copes.
score:
  weight: 5
  curve: step
  partial_credit: true
remedies:
  - rank: 1
    action: declare_zone
    target: room.parcelStaging
    transform: {position: wall_opposite_hinge, area_m2: 0.42, keep_clear: true}
    cost: free
    effort: low
    reversible: true
    copy: Keep a box-sized patch of floor clear on the hinge-free side of the door, so parcels never land in the doorway.
  - rank: 2
    action: add_object
    add: outdoor.parcel_box.lockable
    transform: {position: porch, clear_of: swingSweep(door, 100), anchored: true}
    cost: medium
    effort: trade_required
    reversible: false
    copy: A lockable parcel box outside keeps deliveries dry and out of the hall - and off the doorstep for passers-by to see.
  - rank: 3
    action: add_object
    add: storage.shelf.floating
    transform: {height_m: 0.900, depth_m: 0.350, reserved_for: parcel_staging}
    cost: low
    effort: low
    reversible: true
    copy: A sturdy shelf at hip height is better than the floor: you can set a box down without bending and see it on the way out.
conflicts_with: [RM-ENT-034, RM-ENT-048]
supersedes: []
requires_rules: [RM-ENT-001]
tags: [parcels, deliveries, groceries, door_swing, staging]
localization_notes: >
  In shared-corridor apartments, parcels are frequently left in a lobby or with a concierge and
  the inside staging bay is still needed for the carry-in. Leaving a parcel box in a shared
  corridor is usually prohibited by fire regulations - see RM-ENT-049.
```

#### Why — tradition
None. This is a modern functional rule created by the volume of home delivery; state it as such.

#### Why — psychology / physiology
The mechanism is **load-shedding geometry**, not belief. A carried box is put down at the first
opportunity, which without a designated bay is the doorway itself — the exact spot that must stay
clear for the door, for egress and for the next person arriving. Designating a bay just outside
the swing redirects the same reflex one metre sideways. There is no empirical literature specific
to parcel staging; the mechanism is a direct consequence of reach and effort minimisation.

#### Customer insight
Parcels always get put down exactly where they are most in the way. Decide now where they go — a
clear patch of floor to the side of the door, or better a shelf at hip height — and the hallway
stops being an obstacle course on delivery days.

#### Failure modes / when to skip
Do not create a staging bay by stealing the door swing, the through-path or a wheelchair turning
circle; if the room cannot provide 0.42 m² outside all of those, downgrade to a shelf and report
the constraint. Do not recommend an outdoor parcel box where there is no shelter, no anchoring
surface, or where a shared-corridor or leasehold restriction applies.

---
