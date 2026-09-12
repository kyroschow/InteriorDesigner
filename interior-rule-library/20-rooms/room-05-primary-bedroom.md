# Primary Bedroom — Function, Layout, Bed-Wall Selection & Generation
<!-- library-file: v1 | system(s): modernism.functionalism, ergonomics.task_zones, ergonomics.anthropometrics, ergonomics.posture, sleep_science.environment, chronobiology.circadian, circulation.desire_lines, circulation.space_syntax, zoning.public_private, psych.territoriality, psych.proxemics, behavior.habit_design, acoustics.privacy, safety.child, product.parameter, product.ux | rule-id-prefixes: RM-BEDP | author-agent: room-05-primary-bedroom -->

## Scope

This file is the **functional / practical / design layer** for `bedroom_primary` (the "master"
bedroom) and its two attached programs: the **ensuite** (`ensuite`) and the **dressing area**
(`walk_in_closet`, `dressing_room`, or an in-room wardrobe wall).

It owns:

- What a primary bedroom is *for*, and the minimum program it must deliver.
- Bed **size selection** from measured room dimensions, with the clearance arithmetic, and the
  honest "your bed is too big for this room" verdict most apps refuse to give.
- The **bed-wall selection algorithm**: a ranked candidate-wall scorer over solid-wall run,
  opening conflicts, services, acoustics, thermal, ceiling height and sightlines.
- Bedside provision per sleeper, bed-making and walk-past clearance, wardrobe/chest/dressing,
  the full-length mirror, the laundry basket and the universally under-designed
  **worn-but-not-dirty clothes** problem.
- The contested occupants: TV, desk, exercise kit, seating, pets, plants, a baby.
- Light, thermal and noise control **as they bear on bed position** — including the
  high-value **room-reassignment recommendation** when the primary bedroom is the noisiest
  room in the home.
- The **couple-negotiation feature set**: two sleepers with different light, temperature,
  noise, schedule and tidiness preferences, treated as a first-class product capability.
- `LAYOUT_ARCHETYPES` (13 parametric templates) and a deterministic `GENERATION_RECIPE`
  with a documented relaxation ladder.

It does **not** own and must not re-derive: feng shui bedroom doctrine and command position
(`FS-ROOM-*`, `FS-CMD-*`, `FS-BAG-*`), vastu (`VS-ROOM-*`), the ergonomic clearance tables
themselves (`ERG-CLR-*`), lighting photometrics (`LGT-*`), acoustic construction and
absorption (`ACU-*`), colour (`CLR-*`), circulation primitives (`CIR-*`) or safety
(`SAFE-*`). Where those layers apply, this file **applies** them: it states which rule
family fires in this room, with which parameter values, and at what priority. See
`## CROSS_REFERENCES`.

**Units.** Every dimension is given in metres (authoritative) and inches/feet (prose).
Mattress sizes are given for the three dominant markets (US, UK, EU/continental) because
"queen" is 152 × 203 cm in the US and does not exist in the UK.

## Rule count: 61

## Rules

### RM-BEDP-001 — Primary bedroom program manifest: what the room must deliver

```yaml
id: RM-BEDP-001
title: Primary bedroom program manifest
system: modernism.functionalism
group: program
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, guest_suite, adu_in_law_suite]
  objects: []
  requires_features: []
scope: room_composition
severity: high
confidence: expert_consensus
evidence_class: mixed
belief_gated: false
predicate: |
  let sleepers = countOf(person, room.assigned_occupants)
  # Tier 1 — mandatory. A room missing any of these is not a functioning primary bedroom.
  require exists(sleep.bed.*, room)
  forEach s in room.assigned_occupants:
    require exists(bedside_station(s))            # see RM-BEDP-019
  require room.light_control_capability >= p.min_light_control_class
  require exists(storage.wardrobe.* | storage.closet.* | walk_in_closet adjacency(room)) 
  require dressingZoneExists(room, p.dress_zone_w_m, p.dress_zone_d_m)
  require exists(laundry.basket.*, room) or exists(laundry.basket.*, adjacency(room, ensuite))
  # Tier 2 — expected. Absence is a medium finding, not a failure.
  prefer exists(decor.mirror.full_length, room) or exists(decor.mirror.full_length, adjacency(room))
  prefer valetProvision(room) >= sleepers          # see RM-BEDP-034
  prefer exists(seating.*, room) if room.area_m2 >= p.seating_area_threshold_m2
  prefer garmentCapacityLinear(room) >= sum(hangingDemand(s) for s in room.assigned_occupants)
  # Tier 3 — optional, and each carries its own trade-off rule.
  # tv (RM-BEDP-037), desk (RM-BEDP-038), exercise (RM-BEDP-040), crib (RM-BEDP-041)
params:
  - key: min_light_control_class
    default: 2
    range: [1, 3]
    unit: class
    user_editable: false
    rationale: "1 = any covering; 2 = can reach <5 lux at the pillow at night (RM-BEDP-043); 3 = full blackout with leak sealing."
  - key: dress_zone_w_m
    default: 0.9
    range: [0.7, 1.4]
    unit: m
    user_editable: true
    rationale: Standing footprint needed to pull trousers on without hopping into furniture; 0.9 m = 36 in.
  - key: dress_zone_d_m
    default: 0.9
    range: [0.7, 1.4]
    unit: m
    user_editable: true
    rationale: Matching depth so the zone is a usable square rather than a slot.
  - key: seating_area_threshold_m2
    default: 13.0
    range: [9.0, 25.0]
    unit: m2
    user_editable: true
    rationale: Below roughly 13 m2 (140 sq ft) a chair reliably becomes the clothes pile, not a seat.
score:
  weight: 10
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: report_program_gap
    target: room
    transform: {emit: missing_tier1_list, block_generation: true}
    cost: free
    effort: none
    reversible: true
    copy: This room is missing something a bedroom needs to work. We have listed exactly what, and we will not propose a layout that pretends otherwise.
  - rank: 2
    action: add_object
    add: [tables.nightstand.*, lighting.table_lamp.bedside, storage.wardrobe.freestanding, laundry.basket.standard]
    transform: {place_by: GENERATION_RECIPE}
    cost: low
    effort: low
    reversible: true
    copy: Add the missing pieces. We have put them where they will actually get used.
  - rank: 3
    action: relocate_program
    target: [storage.wardrobe.*, laundry.basket.*]
    transform: {to_room: nearest(walk_in_closet | reach_in_closet | ensuite | hallway_corridor)}
    cost: free
    effort: medium
    reversible: true
    copy: If the room is genuinely too small, we can push storage or laundry just outside the door instead of cramming it in.
conflicts_with: []
supersedes: []
requires_rules: []
tags: [program, manifest, bedroom, signature_rule, generation_gate]
localization_notes: "In markets where built-in closets are standard (US), the wardrobe requirement is usually satisfied by architecture; in the UK/EU freestanding wardrobes are the norm and consume floor area, which changes bed sizing (RM-BEDP-003)."
```

#### Why — tradition
No traditional doctrine governs the program list as a list. Modernist functionalism — the
Existenzminimum studies of 1920s European housing and the post-war space standards that grew
out of them (the UK Parker Morris standards, and the later nationally described space
standard) — is the lineage that treats a bedroom as a set of measurable activities
(sleeping, dressing, storing clothes, getting to a light in the dark) rather than a
furnishable void. Feng shui and vastu both treat the bedroom as the most private and
restorative room of the house and therefore agree with the *spirit* of a minimum program,
but neither enumerates one; see `FS-ROOM-BED-*` and `VS-ROOM-BED-*`.

#### Why — psychology / physiology
Two independent mechanisms. First, sleep-onset research on **stimulus control** (Bootzin's
procedure, now a core component of CBT-I and recommended in clinical practice guidelines)
shows sleep quality depends on the bed being reliably associated with sleep — which requires
the room to absorb the *other* activities (dressing, storing, dumping clothes) somewhere
that is not the bed. Second, environmental-psychology work on **territoriality** and
personal control (Altman) predicts that an occupant who cannot control light, storage and a
private surface of their own experiences the room as unsettled; each Tier 1 item is a locus
of control. The specific threshold values here are ergonomic and expert-consensus, not
experimentally derived.

#### Customer insight
A bedroom is not just a room with a bed in it. It has to let you sleep, get dressed, put
your clothes somewhere, find a light in the dark, and drop today's laundry — and if any of
those has nowhere to happen, it happens on the bed. We check for all of them before we
suggest a single piece of furniture.

#### Failure modes / when to skip
Do not fire Tier 1 storage or dressing requirements when the room is part of a
`guest_suite` used under 30 nights a year (guests bring a suitcase), or when an adjacent
`dressing_room` / `walk_in_closet` already carries the wardrobe and dressing program — check
`adjacency()` before flagging. In `studio_apartment` the whole-dwelling program supersedes
this rule; defer to the studio file. Never block generation on Tier 2 or Tier 3 items.

### RM-BEDP-002 — Minimum viable primary bedroom: area and shortest dimension

```yaml
id: RM-BEDP-002
title: Minimum viable primary bedroom area and shortest dimension
system: ergonomics.anthropometrics
group: room_envelope
version: 1
status: active
applies_to:
  rooms: [bedroom_primary]
  objects: []
  requires_features: []
scope: room_composition
severity: high
confidence: code_mandated
evidence_class: ergonomic
belief_gated: false
predicate: |
  let shortest = min(room.bbox.w, room.bbox.d)
  # Habitable-room legal floor: named code family, varies by jurisdiction.
  assert room.area_m2 >= p.code_min_habitable_area_m2
  assert shortest >= p.code_min_horizontal_dim_m
  assert room.ceiling_height_m >= p.code_min_ceiling_h_m
  # Functional floor for a TWO-sleeper primary with two-side access and two nightstands.
  let need_w = p.mattress_w_m + 2 * p.side_aisle_m
  prefer shortest >= need_w
  penalize(shortest < need_w, weight=8)
  # Absolute functional floor for a two-sleeper room at all.
  assert room.area_m2 >= p.functional_min_two_sleeper_m2 or room.declared_single_side_access == true
params:
  - key: code_min_habitable_area_m2
    default: 6.503
    range: [4.5, 11.0]
    unit: m2
    user_editable: false
    jurisdiction_varies: true
    rationale: "IRC R304 sets a minimum habitable room area of 70 sq ft (6.503 m2). Many jurisdictions amend this; UK/EU room-size rules differ and some use bed-space counts instead. Never present as universal."
  - key: code_min_horizontal_dim_m
    default: 2.134
    range: [1.8, 3.0]
    unit: m
    user_editable: false
    jurisdiction_varies: true
    rationale: "IRC R304 minimum horizontal dimension for a habitable room is 7 ft (2.134 m). Jurisdiction-dependent."
  - key: code_min_ceiling_h_m
    default: 2.134
    range: [2.0, 2.6]
    unit: m
    user_editable: false
    jurisdiction_varies: true
    rationale: "IRC R305 minimum ceiling height for habitable rooms is 7 ft (2.134 m); sloped-ceiling rooms have a partial-area allowance (see RM-BEDP-011). Other code families set 2.3-2.5 m."
  - key: mattress_w_m
    default: 1.530
    range: [0.900, 1.930]
    unit: m
    user_editable: true
    rationale: Defaults to a US queen / EU 150-160 cm bed as the modal couple's bed; engine overwrites from the chosen bed.
  - key: side_aisle_m
    default: 0.600
    range: [0.450, 0.900]
    unit: m
    user_editable: true
    rationale: 0.60 m (24 in) is the shoulder-width-plus-clothing aisle a person can walk and make a bed from; see ERG-CLR for the derivation.
  - key: functional_min_two_sleeper_m2
    default: 8.5
    range: [7.0, 12.0]
    unit: m2
    user_editable: true
    rationale: Below roughly 8.5 m2 (92 sq ft) a double bed with two-side access plus any wardrobe cannot be fitted; the room must go single-side-access.
score:
  weight: 7
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: reassign_room
    target: room
    transform: {swap_with: largest_bedroom_in(home), preserve: ensuite_adjacency_if_possible}
    cost: free
    effort: high_physical
    reversible: true
    copy: Another bedroom in this home is bigger. Swapping which room is the main bedroom costs nothing but a weekend, and it is the single biggest improvement available here.
  - rank: 2
    action: downsize_object
    target: sleep.bed.*
    transform: {to_size: next_smaller_standard}
    cost: medium
    effort: medium
    reversible: false
    copy: A smaller bed buys back the walking space this room does not have. We will show you exactly how much.
  - rank: 3
    action: set_flag
    target: room
    transform: {declared_single_side_access: true, apply_rule: RM-BEDP-023}
    cost: free
    effort: none
    reversible: true
    copy: We will plan this as a one-side-access bedroom, which is a real and workable layout with a few specific fixes.
conflicts_with: [SAFE-EGR-001]
supersedes: []
requires_rules: [RM-BEDP-001]
tags: [envelope, code, minimum, area, jurisdiction_varies]
localization_notes: "Do not display the IRC figure to users outside jurisdictions that adopt the IRC. Show the functional minimum (the aisle arithmetic) everywhere — it is jurisdiction-free."
```

#### Why — tradition
No traditional doctrine. This is a code-and-ergonomics rule. Historic space standards
(Parker Morris in the UK, the German Existenzminimum work, US FHA minimum property
standards) all converged on a similar functional floor by the same method used here: add up
the bed, the aisle and the wardrobe. Vastu prescribes proportional relationships for room
plan ratios rather than absolute minima (`VS-ROOM-PROP-*`).

#### Why — physiology / psychology
Crowding research (Stokols; Evans) distinguishes density from the *experience* of crowding,
which is driven by loss of behavioural freedom — exactly what a sub-0.45 m aisle produces:
you cannot pass your partner, you cannot make the bed from the side, you shuffle sideways.
The specific area thresholds are arithmetic, not empirical: they are derived by summing
anthropometric clearances, which is why they are stated as arithmetic and not as findings.

#### Customer insight
Before we place anything, we check the room can physically hold a bedroom. If it can't, we
say so plainly and give you the two real options: a smaller bed, or a different room.

#### Failure modes / when to skip
Do not fire the code assertions when `site.jurisdiction` is unknown — downgrade to advisory
and show the functional arithmetic only. Legally non-conforming rooms exist in enormous
numbers (converted attics, subdivided flats); flagging them as illegal is alarming and
often wrong, so phrase as "may not meet local minimums; check locally". Skip the two-sleeper
floor entirely for a single-occupant primary bedroom.

### RM-BEDP-003 — Bed size selection from measured room dimensions (the clearance arithmetic)

```yaml
id: RM-BEDP-003
title: Bed size selection from measured room dimensions
system: ergonomics.task_zones
group: bed_sizing
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, bedroom_guest, guest_suite]
  objects: [sleep.bed.*]
  requires_features: []
  min_room_area_m2: 5.0
scope: object_placement
severity: high
confidence: expert_consensus
evidence_class: ergonomic
belief_gated: false
predicate: |
  # Candidate bed sizes, market-dependent. Mattress dimensions only; frame added by RM-BEDP-005.
  let market = user.market            # us | uk | eu
  let candidates = bedSizeTable(market)
  let wall = chosenBedWall(room)      # from RM-BEDP-007
  let along = wallLengthAvailable(wall)                # clear run the headboard sits in
  let depth = perpendicularRunFrom(wall)               # wall to opposite obstruction
  forEach c in candidates:
    let bw = c.mattress_w_m + frameAllowance(c, room.bed_frame_style)
    let bd = c.mattress_d_m + frameAllowance_depth(c, room.bed_frame_style)
    # ACCESS MODE A — two-side access (default for 2 sleepers)
    let needs_along_A = bw + 2 * p.side_aisle_m
    # ACCESS MODE B — one-side access (single sleeper, or declared)
    let needs_along_B = bw + p.side_aisle_m + p.dead_side_gap_m
    let needs_depth   = bd + p.foot_clearance_m
    c.fits_A = (along >= needs_along_A) and (depth >= needs_depth)
    c.fits_B = (along >= needs_along_B) and (depth >= needs_depth)
    # NIGHTSTAND MODE — two-side access PLUS a nightstand each (the target)
    c.fits_A_plus_ns = along >= bw + 2 * (p.nightstand_w_m + p.side_aisle_m)
  let best = largest(c in candidates where c.fits_A_plus_ns)
             else largest(c where c.fits_A)
             else largest(c where c.fits_B)
             else null
  require best != null
  assert selectedBed(room).size_id == best.size_id or user.overrode_bed_size == true
params:
  - key: side_aisle_m
    default: 0.600
    range: [0.450, 0.900]
    unit: m
    user_editable: true
    rationale: "Walk-and-make aisle beside the bed. 0.60 m = 24 in is the working minimum; 0.75 m (30 in) is the widely taught designer target; 0.90 m (36 in) is generous and matches accessible-route width."
  - key: dead_side_gap_m
    default: 0.080
    range: [0.000, 0.200]
    unit: m
    user_editable: true
    rationale: Gap left on a wall-side of a bed so bedding can be tucked and the mattress does not chafe the wall; 0 only for a true built-in alcove bed.
  - key: foot_clearance_m
    default: 0.750
    range: [0.600, 1.200]
    unit: m
    user_editable: true
    rationale: "0.75 m (30 in) lets a person pass the foot of the bed and open a drawer chest there; 0.60 m (24 in) passes but does not open drawers; see RM-BEDP-025."
  - key: nightstand_w_m
    default: 0.450
    range: [0.300, 0.700]
    unit: m
    user_editable: true
    rationale: A 45 cm (18 in) nightstand is the smallest that carries lamp, phone, water and a book; see RM-BEDP-020.
  - key: prefer_target_aisle_m
    default: 0.750
    range: [0.600, 1.000]
    unit: m
    user_editable: true
    rationale: Soft target used to break ties between two bed sizes that both fit.
score:
  weight: 9
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: set_object_size
    target: sleep.bed.*
    transform: {size_id: best.size_id, show_arithmetic: true}
    cost: free
    effort: none
    reversible: true
    copy: Here is the biggest bed this room can take while still letting you walk round it and reach a bedside table. We show you the sums so you can argue with them.
  - rank: 2
    action: relax_param
    target: p.side_aisle_m
    transform: {to: 0.550, then: 0.500, floor: 0.450, log: relaxation_ladder}
    cost: free
    effort: none
    reversible: true
    copy: If you want the bigger bed, we can tighten the walkway to 55 or 50 cm (22 or 20 in). It works, but making the bed gets annoying.
  - rank: 3
    action: change_object
    target: sleep.bed.*
    transform: {to_variant: platform_low_profile | divan_no_overhang, reason: reclaims_frame_allowance}
    cost: medium
    effort: medium
    reversible: false
    copy: A frame with no overhanging rails gives you back up to 15 cm (6 in) of width for the same mattress.
conflicts_with: [FS-CMD-001]
supersedes: []
requires_rules: [RM-BEDP-005, RM-BEDP-007]
tags: [bed, sizing, arithmetic, signature_rule, generation_step]
localization_notes: "Bed nomenclature is market-specific and must not be machine-translated. A UK 'king' (150 x 200 cm) is narrower than a US king (193 x 203 cm) and closer to a US queen. Always show cm and the local name together."
```

**Reference mattress table** (nominal manufacturing sizes; tolerance typically ±2 cm / ¾ in).
The engine must treat this as data, not truth — read actual product dimensions when known.

| Market | Name | Width | Depth |
|---|---|---|---|
| US | Twin | 0.965 m (38 in) | 1.905 m (75 in) |
| US | Twin XL | 0.965 m (38 in) | 2.032 m (80 in) |
| US | Full / Double | 1.372 m (54 in) | 1.905 m (75 in) |
| US | Queen | 1.524 m (60 in) | 2.032 m (80 in) |
| US | King | 1.930 m (76 in) | 2.032 m (80 in) |
| US | California King | 1.829 m (72 in) | 2.134 m (84 in) |
| UK | Single | 0.900 m (3 ft 0 in) | 1.900 m (6 ft 3 in) |
| UK | Small double | 1.200 m (4 ft 0 in) | 1.900 m (6 ft 3 in) |
| UK | Double | 1.350 m (4 ft 6 in) | 1.900 m (6 ft 3 in) |
| UK | King | 1.500 m (5 ft 0 in) | 2.000 m (6 ft 6 in) |
| UK | Super king | 1.800 m (6 ft 0 in) | 2.000 m (6 ft 6 in) |
| EU | 90 / 140 / 160 / 180 | 0.900 / 1.400 / 1.600 / 1.800 m | 2.000 m (some 1.900 or 2.100 m) |

**Worked example the app should show.** Room 3.00 m × 3.40 m (9 ft 10 in × 11 ft 2 in), bed
on the 3.00 m wall. A US queen mattress is 1.524 m; a typical upholstered frame adds about
0.10 m total, so 1.62 m. Two 0.60 m aisles need 1.20 m. 1.62 + 1.20 = 2.82 m — fits in
3.00 m with 0.18 m spare, so the aisles become 0.69 m each. Add two 0.45 m nightstands and
you need 1.62 + 0.90 + 1.20 = 3.72 m — it does not fit. Verdict: queen with two-side access
and **one** nightstand plus a wall-mounted shelf on the other side, or a 1.35 m UK double /
1.372 m US full with two nightstands. That is the real choice, and the app should present it
as a choice rather than silently picking.

#### Why — tradition
No traditional doctrine sizes a bed to a room. Classical proportion systems
(`classical.proportion`) size *rooms* to harmonic ratios, which is the inverse operation.
Feng shui's contribution is indirect but real: doctrine that the bed should have "breathing
room" on three sides and should not be jammed against two walls (see `FS-ROOM-BED-*`)
pushes toward the same two-side-access conclusion this arithmetic reaches independently.

#### Why — psychology / physiology
The clearance numbers derive from anthropometry: a 95th-percentile adult's shoulder breadth
plus clothing is about 0.55 m, so 0.60 m is the smallest aisle that allows forward walking
without turning sideways, and bed-making requires a torso-bend envelope of roughly 0.70 m.
There is no clinical literature showing that a 0.60 m aisle harms sleep; the mechanism is
daily friction and the behavioural consequence — a bed you cannot make from the side stops
getting made, and a bed that stops getting made degrades the room's association with sleep
(stimulus-control logic, see RM-BEDP-038). `No direct empirical support` for the aisle-width
thresholds specifically; they are ergonomic derivations and design consensus.

#### Customer insight
Everyone wants the biggest bed that fits. The catch is that "fits" has to include the space
to walk past it and make it. We do the arithmetic and tell you the honest answer, including
when it is "your bed is one size too big for this room".

#### Failure modes / when to skip
Skip when the user has already bought the bed and will not change it — switch to
RM-BEDP-004 (consequence disclosure) instead of a sizing recommendation, and do not nag.
Skip in built-in alcove/box-bed conditions (Scottish box bed, Japanese `oshiire` alcove,
built-in bunk niches) where the bed is architecture. Do not apply to adjustable/hospital
beds — those need side transfer space governed by `accessibility.universal_design`
(`ERG-CLR-ACC-*`), which is wider and wins.

### RM-BEDP-004 — The honest too-big-bed verdict and the downsize disclosure

```yaml
id: RM-BEDP-004
title: Honest too-big-bed verdict and downsize disclosure
system: product.ux
group: bed_sizing
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, bedroom_guest]
  objects: [sleep.bed.*]
  requires_features: []
scope: object_placement
severity: high
confidence: expert_consensus
evidence_class: ergonomic
belief_gated: false
predicate: |
  let bed = target
  let aisles = [clearance(bed,'left'), clearance(bed,'right'), clearance(bed,'front')]
  let violations = count(a in aisles where a > 0 and a < p.hard_min_aisle_m)
  let blocked = countOf(opening | storage.wardrobe.* where swingSweep(x) overlaps bed)
  let ns_lost = p.sleepers - countOf(tables.nightstand.*, room)
  assert violations == 0 and blocked == 0
  # When it fails, the finding MUST quantify the exact gain from downsizing.
  on_fail emit {
    verdict: "bed_oversized",
    current_size: bed.size_id,
    next_smaller: nextSmaller(bed.size_id, user.market),
    width_reclaimed_m: bed.footprint.w - nextSmaller(bed.size_id).width_with_frame,
    resulting_aisles_m: recomputeAisles(nextSmaller(bed.size_id)),
    sleep_surface_lost_per_person_m: perPersonWidthDelta(bed.size_id, nextSmaller(bed.size_id)),
    consequences_if_kept: [ "cannot make bed from side", "nightstand omitted",
                            "wardrobe door fouls bed", "cannot pass partner" ]
  }
params:
  - key: hard_min_aisle_m
    default: 0.450
    range: [0.350, 0.600]
    unit: m
    user_editable: true
    rationale: "0.45 m (18 in) is a sideways-shuffle gap. Below this the aisle is decorative; we call it a failure, not a tight fit."
  - key: sleepers
    default: 2
    range: [1, 2]
    unit: count
    user_editable: true
    rationale: Drives how many nightstands are owed; a lost nightstand is one of the named consequences.
  - key: show_downsize_by_default
    default: true
    range: [true, false]
    unit: bool
    user_editable: true
    rationale: Users who have just spent money on a king may want this suppressed; it stays available in the report.
score:
  weight: 8
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: downsize_object
    target: sleep.bed.*
    transform: {to_size: next_smaller_standard, show: {aisle_before_after: true, per_person_width_delta: true}}
    cost: medium
    effort: medium
    reversible: false
    copy: "Dropping from a king to a queen here gives each of you 20 cm (8 in) less shoulder room but turns two 35 cm gaps into two 55 cm walkways. Most people who make this swap do not regret it."
  - rank: 2
    action: change_object
    target: sleep.bed.*
    transform: {to_variant: platform_flush_rail | divan_base, keep_mattress: true}
    cost: medium
    effort: medium
    reversible: false
    copy: Keep the mattress, change the frame. Flush-sided bases can give back 10-15 cm (4-6 in) of total width.
  - rank: 3
    action: accept_with_disclosure
    target: room
    transform: {record: user_accepted_tight_fit, suppress_repeat_nag: true, keep_in_report: true}
    cost: free
    effort: none
    reversible: true
    copy: You can keep the bed. We will stop asking, but we will leave the note in the report so you know what you traded.
conflicts_with: []
supersedes: []
requires_rules: [RM-BEDP-003]
tags: [bed, sizing, honesty, product_capability, signature_rule]
localization_notes: "Per-person width deltas matter more than total: a US king (1.93 m) gives each of two sleepers 0.965 m, the same as a UK single; a queen gives 0.762 m. Say it that way — it is the number people can feel."
```

#### Why — tradition
No traditional doctrine. There is, however, a genuine convergence worth telling the user:
feng shui's insistence on clear space on both long sides of the bed (`FS-ROOM-BED-*`) and
this arithmetic reach the same verdict about an oversized bed for entirely different stated
reasons. Where a belief layer and the tape measure agree, the app should say so — it is the
strongest content in the product.

#### Why — psychology / physiology
The honesty mechanism is behavioural, not physiological. Research on advice-taking shows
recommendations are more likely to be followed when the cost side is disclosed alongside
the benefit; a tool that only ever says "yes, that fits" is quickly discounted. The
downstream sleep mechanism is indirect: lost nightstands mean phones charge on the floor or
in the bed, and a bed that cannot be made from the side gets made less often — both nudge
against the stimulus-control conditions that support easy sleep onset.
`No direct empirical support` for a dose-response between aisle width and sleep quality.

#### Customer insight
Big beds are lovely and a too-big bed ruins a bedroom. If yours is one size too large for
the room, we will tell you exactly what you would gain by going down a size and exactly
what you would lose, in centimetres per person. Then it is your call.

#### Failure modes / when to skip
Do not fire on a bed the user has flagged as medically required (adjustable, bariatric,
pressure-relieving) — those are governed by accessibility rules and are never "too big".
Do not fire more than once per session on the same bed once `accept_with_disclosure` is
recorded. Suppress the downsize remedy for rental staging or short-let scenarios where the
bed is the landlord's.

### RM-BEDP-005 — Frame, base and headboard footprint allowance over the mattress

```yaml
id: RM-BEDP-005
title: Frame, base and headboard footprint allowance over the mattress
system: ergonomics.anthropometrics
group: bed_sizing
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, bedroom_guest, bedroom_child, bedroom_teen]
  objects: [sleep.bed.*]
  requires_features: []
scope: object_placement
severity: medium
confidence: expert_consensus
evidence_class: ergonomic
belief_gated: false
predicate: |
  let bed = target
  # The engine must never plan against mattress dimensions alone.
  assert bed.footprint.w >= bed.mattress.w + frameAllowance(bed.frame_style).w
  assert bed.footprint.d >= bed.mattress.d + frameAllowance(bed.frame_style).d
                                           + headboardAllowance(bed.headboard_style)
  forbid layoutComputedFrom(bed.mattress) without frameAllowance
params:
  - key: allow_divan_m
    default: 0.020
    range: [0.000, 0.040]
    unit: m
    user_editable: false
    rationale: Divan/box bases are effectively flush; allow 1 cm per side for upholstery.
  - key: allow_platform_flush_m
    default: 0.040
    range: [0.000, 0.080]
    unit: m
    user_editable: false
    rationale: Flush-rail platform frames add roughly 2 cm per side.
  - key: allow_metal_rail_m
    default: 0.080
    range: [0.040, 0.140]
    unit: m
    user_editable: false
    rationale: Metal side rails plus finials typically add 3-7 cm per side.
  - key: allow_wood_rail_m
    default: 0.120
    range: [0.060, 0.200]
    unit: m
    user_editable: false
    rationale: Timber rails and posts commonly add 5-10 cm per side.
  - key: allow_upholstered_m
    default: 0.160
    range: [0.080, 0.280]
    unit: m
    user_editable: false
    rationale: Upholstered and winged frames are the worst offenders — up to 14 cm per side.
  - key: allow_headboard_depth_m
    default: 0.100
    range: [0.030, 0.300]
    unit: m
    user_editable: true
    rationale: "A thin panel is 3-5 cm; a buttoned upholstered headboard 10-15 cm; a bookcase headboard 25-30 cm, which eats the room's length."
  - key: allow_footboard_depth_m
    default: 0.060
    range: [0.000, 0.250]
    unit: m
    user_editable: true
    rationale: Footboards add length and, more importantly, block the foot-of-bed pass; set 0 when absent.
score:
  weight: 5
  curve: linear
  partial_credit: true
remedies:
  - rank: 1
    action: recompute_layout
    target: room
    transform: {use: bed.footprint_with_frame, invalidate: mattress_based_plan}
    cost: free
    effort: none
    reversible: true
    copy: We have re-run the plan using the real outside size of your bed, not the mattress size. That is usually 8-16 cm (3-6 in) wider than people expect.
  - rank: 2
    action: change_object
    target: sleep.bed.*
    transform: {to_variant: divan_base | platform_flush_rail}
    cost: medium
    effort: medium
    reversible: false
    copy: If the room is tight, a flush-sided base fits the same mattress in noticeably less floor space.
  - rank: 3
    action: change_object
    target: sleep.bed.headboard
    transform: {to_variant: wall_mounted_panel, depth_m: 0.040}
    cost: low
    effort: medium
    reversible: true
    copy: A wall-mounted headboard panel gives you the look without stealing 10-15 cm (4-6 in) of room length.
conflicts_with: []
supersedes: []
requires_rules: [RM-BEDP-003]
tags: [bed, frame, footprint, measurement_discipline]
localization_notes: "UK divans dominate and are flush, so UK rooms plan tighter than US rooms for the same mattress; US upholstered frames are the common case and the worst for footprint."
```

#### Why — tradition
No traditional doctrine. This is a measurement-discipline rule. It exists because almost
every published "will a king fit?" guide quotes mattress dimensions, and almost every real
bed is 8-16 cm wider than its mattress.

#### Why — psychology / physiology
No psychological mechanism; this is a source of systematic error in layout planning. The
relevant human factor is the planning fallacy applied to dimensions: people measure the
thing they can name (the mattress) and are surprised by the thing they cannot (the rails).
`No direct empirical support; mechanism is plausible but untested.`

#### Customer insight
Your bed is bigger than your mattress — usually by 8 to 16 cm (3 to 6 inches) in total
width, and more if it is upholstered. We plan with the real outside size, which is why our
numbers sometimes differ from the shop's.

#### Failure modes / when to skip
When actual product dimensions are known from a catalogue match or a user measurement, use
them and ignore the allowance table. Do not apply headboard depth twice when the headboard
is already inside the frame's quoted length. For beds against a wall, headboard depth
reduces usable room length; for freestanding beds it does not — check `backsToWall`.

### RM-BEDP-006 — The split-bed option for couples (two singles, one bed)

```yaml
id: RM-BEDP-006
title: Split-bed option for couples — two singles made as one bed
system: product.parameter
group: bed_sizing
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, guest_suite, adu_in_law_suite]
  objects: [sleep.bed.*, softgoods.duvet.*]
  requires_features: []
scope: object_pair
severity: low
confidence: expert_consensus
evidence_class: mixed
belief_gated: false
predicate: |
  let sleepers = room.assigned_occupants
  if count(sleepers) == 2 and preferenceConflict(sleepers[0], sleepers[1], any_of:
        ['firmness','temperature','schedule','movement_sensitivity']) >= p.conflict_trigger:
    prefer offerOption(split_bed) == true
  # Geometry check: two singles must not be planned as wider than the equivalent single unit.
  let split_w = 2 * bedSizeTable(user.market).single.width + p.split_gap_m
  assert split_w <= roomBedWallAvailable(room) - 2 * p.side_aisle_m or option_marked_infeasible
  # Two singles need a bridging plan or the crack is a defect, not a feature.
  if selectedBed(room).is_split == true:
    require exists(softgoods.mattress_bridge.*) or p.gap_accepted == true
    require countOf(softgoods.duvet.*, room) >= 2
params:
  - key: conflict_trigger
    default: 0.5
    range: [0.2, 0.9]
    unit: ratio
    user_editable: true
    rationale: How divergent two sleepers' stated preferences must be before the app volunteers a split bed.
  - key: split_gap_m
    default: 0.000
    range: [0.000, 0.120]
    unit: m
    user_editable: true
    rationale: Deliberate gap between the two mattresses; 0 with a bridge, up to 12 cm when the couple want separation.
  - key: gap_accepted
    default: false
    range: [true, false]
    unit: bool
    user_editable: true
    rationale: Some couples want the ridge; most do not and need a bridge or a mattress topper spanning both.
score:
  weight: 4
  curve: step
  partial_credit: true
remedies:
  - rank: 1
    action: change_object
    target: sleep.bed.*
    transform: {to: [sleep.bed.single, sleep.bed.single], arrangement: adjacent, bases: independent}
    cost: high
    effort: high_physical
    reversible: false
    copy: "Two single beds pushed together make a bed the same width as a super king (1.8 m / 6 ft), but each of you gets your own mattress firmness and no one feels the other move."
  - rank: 2
    action: add_object
    add: softgoods.duvet.single
    transform: {count: 2, replace: softgoods.duvet.shared}
    cost: low
    effort: low
    reversible: true
    copy: "Two separate duvets on one bed is the cheapest fix in this whole app for cold feet, overheating and duvet theft. It costs one duvet and changes nothing else."
  - rank: 3
    action: add_object
    add: softgoods.mattress_bridge.foam
    transform: {position: centerline_between_mattresses, under: mattress_protector}
    cost: low
    effort: low
    reversible: true
    copy: A foam bridge and a single fitted topper across both mattresses makes two singles feel like one bed.
conflicts_with: []
supersedes: []
requires_rules: [RM-BEDP-051, RM-BEDP-052]
tags: [bed, couple, split, duvet, scandinavian, product_capability]
localization_notes: "Two separate duvets on a shared bed is the default in Scandinavia, Germany, Austria and the Netherlands and is unfamiliar in the UK, US, France and much of Asia. Present it as normal practice elsewhere, not as a fringe idea. Two UK singles = 1.80 m = exactly a super king; two US twin XL = 1.93 m = exactly a US king, which is why US 'split king' adjustable beds exist."
```

#### Why — tradition
Not a doctrine rule, but it has a strong vernacular tradition: separate duvets on a shared
bed is standard practice across German-speaking and Nordic Europe and is sold in the
English-speaking market as the "Scandinavian sleep method". The split-king adjustable base
is the US furniture industry's version of the same idea. Feng shui doctrine is the one place
this collides: some schools object to a visible seam or gap under a couple's bed as
"dividing" the relationship (see `FS-ROOM-BED-*`), and users with that belief enabled must
be told the conflict rather than have it resolved silently.

#### Why — psychology / physiology
Two real mechanisms. **Thermal**: humans differ substantially in thermoneutral zone and in
overnight core-temperature trajectory, and a shared duvet forces one shared insulation
value — two duvets let each sleeper self-regulate, which is the standard sleep-hygiene
answer to "one of us is always too hot". **Mechanical**: partner movement transmits through
a shared mattress and is a documented cause of arousals; independent mattresses eliminate
the transmission path entirely, which is also why motion-isolating foam is marketed on this
basis. Effect sizes for sleep-quality improvement from bed-sharing changes are not well
established, so `evidence_moderate` at best — treat as mechanism, not proof.

#### Customer insight
If one of you runs hot, one of you steals the duvet, or one of you is woken every time the
other turns over, you do not need a bigger bed — you need two duvets, and possibly two
mattresses pushed together. It is completely normal in half of Europe and it is the cheapest
thing in this app that actually changes how you sleep.

#### Failure modes / when to skip
Do not volunteer this to a couple who have expressed no conflict — it can read as a
comment on their relationship. Suppress entirely if `user.relationship_sensitivity` is set.
Do not propose when the existing bed is new, and never as the *first* suggestion: offer two
duvets (cheap, reversible) before two mattresses (expensive, irreversible). Flag the feng
shui conflict when that layer is enabled.

### RM-BEDP-007 — Bed-wall selection: ranked candidate-wall scoring

```yaml
id: RM-BEDP-007
title: Bed-wall selection by ranked candidate scoring
system: circulation.space_syntax
group: bed_wall
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, bedroom_guest, bedroom_child, bedroom_teen, guest_suite, studio_apartment]
  objects: [sleep.bed.*]
  requires_features: []
scope: object_placement
severity: high
confidence: expert_consensus
evidence_class: mixed
belief_gated: false
predicate: |
  # Build the candidate set: every wall segment with a clear run long enough to take the bed.
  let bed_w = selectedBed(room).footprint.w
  let candidates = [ seg for seg in solidRuns(room.walls)
                     where openingFreeRun(seg) >= bed_w + 2 * p.min_side_gap_m ]
  # HARD GATES — a wall failing any gate is removed from the set, not merely penalised.
  forEach seg in candidates:
    require not egressOpeningBlocked_if_bed_on(seg)             # SAFE-EGR-002 owns the test
    require headroomAboveMattress(seg, at_pillow) >= p.min_headroom_at_pillow_m
    require not (isUnder(seg, low_header) and clearance < p.min_headroom_at_pillow_m)
    require doorSwingClear_all(room) when bed_on(seg)
  # SCORE — weighted sum, 0..1, computed per candidate. Weights are params.
  forEach seg in candidates:
    seg.score =
        p.w_solid   * solidRunFactor(seg, bed_w)                # full-contact solid masonry/stud wall
      + p.w_length  * min(1, openingFreeRun(seg) / (bed_w + 2*p.target_side_gap_m))
      + p.w_nostack * (serviceWall(seg) ? 0 : 1)                # RM-BEDP-012
      + p.w_noparty * (partyWall(seg) ? 0 : 1)                  # RM-BEDP-013
      + p.w_nowin   * windowPenaltyFactor(seg)                  # RM-BEDP-009
      + p.w_nothermal * thermalPenaltyFactor(seg)               # RM-BEDP-010, RM-BEDP-047
      + p.w_path    * (throughPathOverlaps(bedZone(seg)) ? 0 : 1)  # RM-BEDP-016
      + p.w_view    * (lineOfSight(pillowSeatedEye(seg), room.primaryDoor.centroid) ? 1 : 0)
      + p.w_nsroom  * nightstandRoomFactor(seg)                 # can both sides take a nightstand?
      + p.w_belief  * beliefLayerFactor(seg)                    # 0 unless a belief layer is enabled
  let ranked = sortDesc(candidates, .score)
  require count(ranked) >= 1
  assert bedWallOf(room) == ranked[0].id or user.overrode_bed_wall == true
  # The app must be able to explain the ranking, not just the winner.
  emit {ranking: ranked, per_factor_breakdown: true, runner_up_delta: ranked[0].score - ranked[1].score}
params:
  - key: min_side_gap_m
    default: 0.080
    range: [0.000, 0.300]
    unit: m
    user_editable: false
    rationale: Minimum breathing gap each side of the bed for a wall to be considered at all.
  - key: target_side_gap_m
    default: 0.600
    range: [0.450, 0.900]
    unit: m
    user_editable: true
    rationale: The aisle width the length factor scores against.
  - key: min_headroom_at_pillow_m
    default: 0.900
    range: [0.750, 1.200]
    unit: m
    user_editable: true
    rationale: "Clear height above the mattress top at the pillow line so an adult can sit up in bed; 0.90 m = 36 in. See RM-BEDP-011."
  - key: w_solid
    default: 0.16
    range: [0.0, 0.4]
    unit: weight
    user_editable: false
    rationale: Full headboard contact with a solid wall is the single most load-bearing factor.
  - key: w_length
    default: 0.12
    range: [0.0, 0.3]
    unit: weight
    user_editable: false
    rationale: Rewards walls long enough for bed plus two real aisles.
  - key: w_nostack
    default: 0.12
    range: [0.0, 0.3]
    unit: weight
    user_editable: true
    rationale: Avoiding the plumbing/soil-stack wall; raise for light sleepers.
  - key: w_noparty
    default: 0.08
    range: [0.0, 0.3]
    unit: weight
    user_editable: true
    rationale: Avoiding a shared wall with a neighbouring dwelling.
  - key: w_nowin
    default: 0.10
    range: [0.0, 0.3]
    unit: weight
    user_editable: true
    rationale: Window-behind-the-bed penalty (draught, light, blackout difficulty, no headboard).
  - key: w_nothermal
    default: 0.08
    range: [0.0, 0.3]
    unit: weight
    user_editable: true
    rationale: Radiator, heat emitter or AC discharge behind or above the pillow.
  - key: w_path
    default: 0.12
    range: [0.0, 0.3]
    unit: weight
    user_editable: false
    rationale: Keeps the bed out of the room's through-route.
  - key: w_view
    default: 0.06
    range: [0.0, 0.3]
    unit: weight
    user_editable: true
    rationale: "Sightline from pillow to the door. This is the functional half of the feng shui command position and is scored here even with belief layers off."
  - key: w_nsroom
    default: 0.10
    range: [0.0, 0.3]
    unit: weight
    user_editable: false
    rationale: A wall that cannot take a nightstand on each side forfeits a Tier 1 program item.
  - key: w_belief
    default: 0.06
    range: [0.0, 0.5]
    unit: weight
    user_editable: true
    rationale: "Contribution from any enabled belief layer (FS-CMD-*, VS-ROOM-*). Zero when none is enabled. The user can raise this to make their tradition decisive."
score:
  weight: 10
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: sleep.bed.*
    transform: {to_wall: ranked[0].id, align: center_on_clear_run, headboard: full_contact}
    cost: free
    effort: high_physical
    reversible: true
    copy: "This is the best wall for your bed, and here is why — we score every wall in the room on nine things and show you the table."
  - rank: 2
    action: report_ranking
    target: room
    transform: {show: top_3_with_factor_breakdown, allow: user_override}
    cost: free
    effort: none
    reversible: true
    copy: Two walls scored almost the same here. We will show you both and let you pick on the things only you know about.
  - rank: 3
    action: modify_feature
    target: nearestFeature(ranked[0], radiator | low_header)
    transform: {action: relocate | box_in, unlocks: ranked[0]}
    cost: high
    effort: trade_required
    reversible: false
    copy: The best wall in this room is spoiled by one fixture. Moving it is a real job, but it unlocks a much better bedroom.
conflicts_with: [FS-CMD-001, VS-ROOM-BED-001, SAFE-EGR-002]
supersedes: []
requires_rules: [RM-BEDP-003, RM-BEDP-008]
tags: [bed, wall_selection, scoring, signature_rule, generation_step, explainable]
localization_notes: "w_belief must default to 0 and rise only on explicit opt-in. Directional belief factors (FS 8-mansions, vastu head-direction) are hemisphere-invariant and must not be flipped for southern-hemisphere sites; only daylight factors flip (see site.hemisphere)."
```

#### Why — tradition
Every major tradition has a bed-wall doctrine and they do not fully agree, which is exactly
why this rule is a *scorer* rather than a ruler. Feng shui form school requires a solid wall
behind the headboard and a diagonal, door-visible position (`FS-CMD-001`); classical
compass feng shui and eight-mansions add personal-direction constraints
(`FS-BAG-*`, `FS-EM-*`); vastu prescribes sleeping with the head to the south or east and
places the master bedroom in the south-west (`VS-ROOM-BED-*`). This rule's job is to
compute the *physically defensible* candidate set and hand it to whichever belief layer the
user enabled, with `w_belief` as the coupling. It never invents doctrine and never overrides
a hard gate with one.

#### Why — psychology / physiology
The `w_view` and `w_path` factors have independent grounding. Prospect-refuge theory
(Appleton) and its environmental-psychology descendants predict preference for resting
positions with a protected back and an open view of the approach, and threat-monitoring
accounts of sleep onset hold that an unmonitored entry imposes a vigilance load that
competes with de-arousal. The `w_solid` factor has a physical basis too: a headboard against
a solid wall reduces the sensation of movement and draught at the head, and the wall is the
acoustic and thermal boundary the sleeper's head is closest to all night. Effect sizes for
bed orientation on sleep outcomes are not established — `confidence: expert_consensus` and
`evidence_class: mixed` are deliberate.

#### Customer insight
Choosing which wall the bed goes against is the one decision that sets everything else in
the room. We score every wall on nine practical things — how solid it is, whether pipes run
through it, whether a window or radiator is behind your head, whether you can see the door,
whether both of you get a bedside table — and we show you the scoreboard, not just the
answer.

#### Failure modes / when to skip
When the candidate set is empty, do not fail: escalate to the relaxation ladder in
`GENERATION_RECIPE` step 5, then to RM-BEDP-059 (no solid wall) and RM-BEDP-015 (door in
the only good wall). In rooms under about 8 m² there is often exactly one geometrically
possible wall — report that honestly as "one option" rather than presenting a fake ranking.
Never let `w_belief` at any value override a hard gate; if a user's tradition points at a
wall that fails a gate, RM-BEDP-061 governs.

### RM-BEDP-008 — Headboard must have continuous solid-wall backing

```yaml
id: RM-BEDP-008
title: Headboard must have continuous solid-wall backing
system: modernism.functionalism
group: bed_wall
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, bedroom_guest, bedroom_child, bedroom_teen, guest_suite]
  objects: [sleep.bed.*]
  requires_features: []
scope: object_placement
severity: high
confidence: expert_consensus
evidence_class: mixed
belief_gated: false
predicate: |
  let bed = target
  let hb_wall = wallBehind(bed)
  assert backsToWall(bed, min_contact_pct=p.min_contact_pct)
  assert distanceToWall(bed, hb_wall) <= p.max_gap_m
  # The backing must be real wall, not an opening, a half-height divider or a glazed panel.
  forbid overlaps(headboardRect(bed), unionOf(room.openings where kind in
          [window, door, doorway, arch, pass_through, sliding, french, bifold]))
  penalize(hb_wall.is_half_height == true, weight=6)
  penalize(hb_wall.construction == 'glazed' or hb_wall.construction == 'curtain', weight=8)
  # Free-standing (island) beds must substitute a physical back — see RM-BEDP-018 and A12.
  if isFloating(bed):
    require exists(sleep.bed.headboard, bed) and headboardHeightAboveMattress(bed) >= p.min_floating_hb_h_m
    require exists(storage.console.behind_bed) or exists(decor.screen.*) or p.island_accepted == true
params:
  - key: min_contact_pct
    default: 85
    range: [50, 100]
    unit: pct
    user_editable: true
    rationale: Percentage of headboard width that must sit against solid wall. Below 85% the bed reads as adrift and bedding slips into the gap.
  - key: max_gap_m
    default: 0.050
    range: [0.000, 0.150]
    unit: m
    user_editable: true
    rationale: "Gap between headboard and wall. Over 5 cm (2 in) pillows fall behind the bed nightly — a small, real, daily annoyance."
  - key: min_floating_hb_h_m
    default: 0.500
    range: [0.350, 0.900]
    unit: m
    user_editable: true
    rationale: Height above mattress top a headboard must reach to function as a back when there is no wall; 0.50 m = 20 in.
  - key: island_accepted
    default: false
    range: [true, false]
    unit: bool
    user_editable: true
    rationale: Lets a user keep a deliberately floating bed in a large room without repeat nagging.
score:
  weight: 8
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: sleep.bed.*
    transform: {to: flush_against(wallBehind), gap_m: 0.020}
    cost: free
    effort: low
    reversible: true
    copy: Push the bed back against the wall. A 10 cm gap behind the headboard is where pillows go to die.
  - rank: 2
    action: add_object
    add: sleep.bed.headboard.wall_mounted
    transform: {width: ">= bed.footprint.w", height_above_mattress_m: 0.600, fixing: wall_anchored}
    cost: low
    effort: medium
    reversible: true
    copy: A wall-mounted headboard panel gives your head something solid behind it without taking floor space.
  - rank: 3
    action: add_object
    add: storage.console.behind_bed
    transform: {position: back_of_bed, height_m: 0.900, depth_m: 0.300}
    cost: medium
    effort: medium
    reversible: true
    copy: If the bed has to float in the room, put a slim console behind it. It gives the bed a back, and gives you a surface.
conflicts_with: [FS-CMD-001]
supersedes: []
requires_rules: [RM-BEDP-007]
tags: [bed, headboard, wall, refuge, generation_step]
localization_notes: "Where interior walls are lightweight partition or plasterboard on studs, 'solid' means continuous and full height, not necessarily masonry. Acoustic performance of the backing wall is ACU-PRIV-*, not this rule."
```

#### Why — tradition
This is the strongest point of agreement in the whole file. Feng shui form school treats a
solid wall behind the headboard as near-inviolable — the "mountain" behind the sleeper —
and both classical and BTB Western schools concur (`FS-CMD-001`, `FS-ROOM-BED-*`). Vastu
likewise wants the head against a wall, with a directional preference this file does not
adjudicate (`VS-ROOM-BED-*`). Western classical practice arrives at the same place through
composition: the bed is the room's dominant mass and needs a plane to sit against.

#### Why — psychology / physiology
Prospect-refuge theory predicts a preference for a protected back with an open outlook, and
the pattern is consistent across seating and resting-place preference studies. There is a
straightforward physical mechanism as well: the wall damps air movement at the head, cuts
the sense of exposure, and stops bedding migration. What is *not* established is that bed
backing improves measured sleep architecture — no clinical literature supports that, and the
rule is honest about resting on convergent tradition plus plausible mechanism.

#### Customer insight
Your head wants something solid behind it. A bed pushed tight to a full-height wall feels
settled in a way a bed floating in the middle of a room does not — and practically, it stops
pillows disappearing down the back every night.

#### Failure modes / when to skip
Skip when the bed is deliberately island-placed in a large room (over about 20 m²) and the
user has accepted it — but still require a tall headboard and preferably a console behind.
Skip for alcove/built-in beds where three walls already provide backing. When the only
available wall is a window wall, this rule loses to RM-BEDP-009's remedies rather than
forcing an unsafe or unusable position. Do not treat a chimney breast face as failing
contact — it is solid, just shallow (see RM-BEDP-017).
