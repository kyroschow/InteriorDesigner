# Home Office, Shared Home Office & Study/Library — Functional & Design Layer
<!-- library-file: v1 | system(s): modernism.functionalism, ergonomics.*, psych.*, circulation.*, lighting.layers, behavior.habit_design, composition.*, safety.* (applied only) | rule-id-prefixes: RM-OFF | author-agent: room-10-home-office-study -->

## Scope

This file owns the **functional, practical and design** layer for every place in a home where
paid or serious work happens:

- `home_office` — a dedicated room, door, one worker.
- `home_office_shared` — two or more workers, the hardest and fastest-growing case.
- `study_library` — a reading/thinking room; book storage is the primary programme.
- `homework_nook` — a child or teen study station.
- **Non-room workspaces**, which are the majority of real installations: a desk in a bedroom,
  a desk in a living room or open-plan corner, kitchen- or dining-table working, and the
  closet office ("cloffice") and other sub-3 m² (sub-32 ft²) workspaces.

It covers: desk placement as a solved optimisation (window angle, door sightline, backing wall,
wall-facing vs floating); shared-desk geometries and the simultaneous-call problem; the
video-call frame as a first-class design requirement; applied screen and seating ergonomics;
lighting for screen work; the acoustic and interruption envelope; power, data, cable, printer
and equipment logistics; work storage and the paper reality; the thinking wall; the work–life
boundary as the central psychological problem of home working; the study/library as a reading
room including book capacity and structural loading; the client-facing home office; and the
awkward-geometry cases.

It does **not** own and must not re-derive: feng shui room doctrine (`FS-ROOM-*`), command
position doctrine (`FS-CMD-*`), bagua sectoring (`FS-BAG-*`), vastu (`VS-ROOM-*`), the
clearance dimension tables (`ERG-CLR-*`), photometric lighting design (`LGT-*`), acoustic
treatment design (`ACU-*`), colour (`CLR-*`), circulation network design (`CIR-*`) or safety
(`SAFE-*`). Where those layers apply to a workspace, this file names the rule family, the
parameter values a workspace needs, and the priority — see `## CROSS_REFERENCES`.

Every dimension is given in metric and imperial. Every code-derived number names its code
family and is flagged `jurisdiction_varies`. Where a claim has no empirical support it says so.

## Rule count: 60

## Rules

### RM-OFF-001 — Workspace tier: a separate room beats every other option, and the ladder is explicit

```yaml
id: RM-OFF-001
title: Workspace tier — prefer a separate closable room, then a separate zone, then a shared surface
system: zoning.public_private
group: programme
version: 1
status: active
applies_to:
  rooms: [home_office, home_office_shared, study_library, homework_nook, bedroom_primary, bedroom_secondary, bedroom_teen, living_room, open_plan_combined, studio_apartment, reach_in_closet, loft, attic_finished, basement_finished, guest_suite, adu_in_law_suite]
  objects: [worksurface.desk.*]
  requires_features: []
scope: whole_home
severity: high
confidence: evidence_moderate
evidence_class: mixed
belief_gated: false
predicate: |
  # Assign every proposed workstation a tier, then require the best AVAILABLE tier.
  let ws = target                                  # a desk + task chair pair
  let host = room
  let tier =
    if host.type in [home_office, home_office_shared, study_library] and countOf(opening.kind==door, host) >= 1
       and any(host.openings, o => o.kind == door and o.swing != none) then 1
    else if host.type in [home_office, study_library] and countOf(opening.kind==door, host) == 0 then 2
    else if host.type in [bedroom_primary, bedroom_secondary, bedroom_teen, guest_suite] then 3
    else if host.type in [living_room, open_plan_combined, loft, studio_apartment] then 4
    else if host.type in [reach_in_closet, walk_in_closet] then 4
    else if host.type in [eat_in_kitchen, formal_dining, breakfast_nook] then 5
    else 5
  let bestAvailable = min(tierOfCandidateRooms(user.workspace_candidates))
  assert tier <= bestAvailable + p.tier_tolerance
  prefer tier == 1
  penalize(tier >= 4 and user.work_hours_per_week >= p.fulltime_hours_threshold, weight=6)
  # A full-time worker in a tier 4/5 workspace MUST carry the closure and boundary rules.
  require if tier >= 4 and user.work_hours_per_week >= p.fulltime_hours_threshold then
    satisfied(RM-OFF-051) and satisfied(RM-OFF-053)
params:
  - key: tier_tolerance
    default: 0
    range: [0, 2]
    unit: tier
    user_editable: true
    rationale: How far below the best available tier the engine may place a workstation before flagging. 0 = always use the best room available.
  - key: fulltime_hours_threshold
    default: 25
    range: [5, 60]
    unit: hours_per_week
    user_editable: true
    rationale: Weekly paid-work hours above which an unclosable workspace is treated as a significant problem rather than a minor one.
  - key: allow_guest_room_conversion
    default: true
    range: [true, false]
    unit: bool
    user_editable: true
    rationale: Whether a spare/guest bedroom may be reclassified as a home office. Most households under-use a guest room and over-use a kitchen table.
score:
  weight: 9
  curve: step
  partial_credit: true
remedies:
  - rank: 1
    action: reassign_room
    target: home_office
    transform: {from_room: any_tier_4_or_5, to_room: best_available_tier_1_candidate, keep: work_hours}
    cost: free
    effort: high_physical
    reversible: true
    copy: You have a spare room that is mostly storing air. Move the desk there and give your work a door it can close.
  - rank: 2
    action: convert_room
    target: bedroom_guest
    transform: {add: worksurface.desk.rectangular, add: sleep.bed.sofa_convertible, remove: sleep.bed.queen}
    cost: medium
    effort: high_physical
    reversible: true
    copy: A sofa bed or wall bed turns the guest room into an office that still sleeps visitors twice a year.
  - rank: 3
    action: add_object
    add: decor.screen.folding_room_divider
    transform: {position: enclose_workstation_on_open_sides, min_height_m: 1.5}
    cost: low
    effort: low
    reversible: true
    copy: If the desk has to live in a shared space, give it edges — a folding screen or a tall bookcase behind you makes it a room within a room.
conflicts_with: []
supersedes: []
requires_rules: []
tags: [programme, zoning, boundary, signature_rule, tier]
localization_notes: Housing stock drives this hard. In compact Japanese, Hong Kong and urban European apartments tier 1 is often genuinely unavailable; the engine must not nag when the ladder's top rung does not exist in the plan.
```

#### Why — tradition
No single doctrine owns this, but it is the oldest idea in the file: Alexander's *A Pattern Language*
treats a workplace as needing its own defined territory with a degree of enclosure and a view out,
and classical house planning from the Renaissance *studiolo* onward gave serious work a separate,
closable cell. Feng shui doctrine converges: the practice tradition strongly prefers a dedicated
office room and treats a bedroom desk as mixing yang (activity) into a yin (rest) room — see
`FS-ROOM-OFFICE-*` and `FS-ROOM-BED-*`.

#### Why — psychology / physiology
Two independent mechanisms. First, *boundary work*: sociologist Christena Nippert-Eng's research on
home and work described how people use physical and temporal boundaries to keep roles separate, and
a closable door is the cheapest boundary marker available. Second, interruption cost: research by
Gloria Mark and colleagues on workplace interruption found substantial delays in returning to an
interrupted task, and a room with a door reduces interruption frequency at source rather than
managing it after the fact. Both effects are well-described in the literature; the specific
*tier ladder* here is a design heuristic, not a measured finding.

#### Customer insight
If there is any room in your home with a door that you could give to your work, give it that room —
it will do more for how you feel at 6pm than any single piece of furniture you could buy. A guest
room that hosts visitors four nights a year is the most under-used space in most homes.

#### Failure modes / when to skip
Skip the nag when no tier 1–3 candidate exists in the plan (studios, one-bed flats, shared houses
where only a bedroom is yours). Do not fire against occasional or hobby use under the hours
threshold — a kitchen table is a perfectly good place to pay bills for two hours a week. Never
recommend converting a room a household member sleeps in. If the user has flagged a mobility need
served by the current room's location (ground floor, near a bathroom), that overrides the tier.

---

### RM-OFF-002 — Choosing which room to convert: score candidates on daylight, quiet, adjacency and route

```yaml
id: RM-OFF-002
title: Room-selection scoring for a new home office
system: circulation.space_syntax
group: programme
version: 1
status: active
applies_to:
  rooms: [home_office, home_office_shared, study_library, bedroom_guest, bedroom_secondary, loft, attic_finished, basement_finished, sunroom_conservatory, guest_suite, adu_in_law_suite, storage_room]
  objects: []
  requires_features: []
  min_room_area_m2: 4.0
scope: room_adjacency
severity: medium
confidence: expert_consensus
evidence_class: mixed
belief_gated: false
predicate: |
  # Run over every candidate room; return a ranked list. Higher is better.
  forEach(candidate in user.workspace_candidates) {
    let daylight = max(daylightAccess(p => centroid(candidate)), 0)          # 0..1
    let quiet    = 1 - clamp(noiseIngress(candidate) / p.noise_ref_db, 0, 1)
    let hasDoor  = countOf(opening.kind==door, candidate) >= 1 ? 1 : 0
    let notThoroughfare = countOf(opening.kind in [door, doorway, arch, pass_through], candidate) <= 2 ? 1 : 0
    let depth    = spaceSyntaxDepth(candidate, site.entry) / p.depth_ref     # deeper = more private
    let badNeighbour = any(adjacency(candidate, r) and r.type in [laundry_room, bathroom_full, media_room, game_room, home_gym, garage_parking, utility_mechanical]) ? 1 : 0
    let aboveBelowBad = any(verticallyStacked(candidate, r) and r.type in [media_room, laundry_room, game_room, home_gym]) ? 1 : 0
    let servesRoute = crossesPath(candidate, site.primary_desire_line) ? 1 : 0
    let wcNear = pathLength(centroid(candidate), nearestRoom(candidate, [bathroom_full, powder_room, bathroom_three_quarter])) <= p.max_wc_path_m ? 1 : 0
    let kitchenNotTooNear = pathLength(centroid(candidate), nearestRoom(candidate, [kitchen, eat_in_kitchen])) >= p.min_kitchen_path_m ? 1 : 0
    let score = p.w_daylight*daylight + p.w_quiet*quiet + p.w_door*hasDoor
              + p.w_nonthoroughfare*notThoroughfare + p.w_depth*clamp(depth,0,1)
              + p.w_wc*wcNear + p.w_kitchen_distance*kitchenNotTooNear
              - p.w_bad_neighbour*badNeighbour - p.w_stack*aboveBelowBad - p.w_route*servesRoute
  }
  assert chosenRoom == argmax(score) or userOverrodeExplicitly == true
params:
  - key: noise_ref_db
    default: 45
    range: [30, 65]
    unit: dB
    user_editable: false
    rationale: Reference daytime background level at which a room scores zero for quiet. Around 45 dB(A) intruding noise, speech on a call starts to need effort.
  - key: depth_ref
    default: 4
    range: [2, 8]
    unit: steps
    user_editable: false
    rationale: Topological steps from the front door at which a room counts as fully private.
  - key: max_wc_path_m
    default: 15.0
    range: [5.0, 40.0]
    unit: m
    user_editable: true
    rationale: Walking distance to a toilet beyond which the workday accumulates friction (49 ft).
  - key: min_kitchen_path_m
    default: 4.0
    range: [0.0, 20.0]
    unit: m
    user_editable: true
    rationale: Minimum distance from the kitchen. Too close and snacking, kettle traffic and family congregation break concentration (13 ft).
  - key: w_daylight
    default: 2.5
    range: [0.0, 5.0]
    unit: weight
    user_editable: true
    rationale: How much a daylit room matters relative to other factors.
  - key: w_quiet
    default: 2.5
    range: [0.0, 5.0]
    unit: weight
    user_editable: true
    rationale: How much acoustic quiet matters. Raise it for a user who is on calls most of the day.
  - key: w_door
    default: 2.0
    range: [0.0, 5.0]
    unit: weight
    user_editable: true
    rationale: Value of a closable door.
  - key: w_nonthoroughfare
    default: 1.5
    range: [0.0, 5.0]
    unit: weight
    user_editable: true
    rationale: Value of not being a pass-through room.
  - key: w_depth
    default: 1.0
    range: [0.0, 5.0]
    unit: weight
    user_editable: true
    rationale: Value of topological privacy from the front door.
  - key: w_wc
    default: 0.5
    range: [0.0, 3.0]
    unit: weight
    user_editable: true
    rationale: Value of a nearby toilet.
  - key: w_kitchen_distance
    default: 0.5
    range: [0.0, 3.0]
    unit: weight
    user_editable: true
    rationale: Value of distance from the kitchen.
  - key: w_bad_neighbour
    default: 2.0
    range: [0.0, 5.0]
    unit: weight
    user_editable: true
    rationale: Penalty for sharing a wall with a noisy room.
  - key: w_stack
    default: 1.5
    range: [0.0, 5.0]
    unit: weight
    user_editable: true
    rationale: Penalty for sitting directly above or below a noisy room. Impact noise through a floor is harder to fix than airborne noise through a wall.
  - key: w_route
    default: 2.0
    range: [0.0, 5.0]
    unit: weight
    user_editable: true
    rationale: Penalty for a room the household must walk through.
score:
  weight: 6
  curve: linear
  partial_credit: true
remedies:
  - rank: 1
    action: reassign_room
    target: home_office
    transform: {to_room: argmax_candidate_score}
    cost: free
    effort: high_physical
    reversible: true
    copy: Of the rooms you could use, this one wins on daylight, quiet and privacy. Here is how the others scored and why.
  - rank: 2
    action: annotate
    target: room
    transform: {report: candidate_score_table}
    cost: free
    effort: none
    reversible: true
    copy: We ranked your options rather than guessing — you can reweight what matters most to you.
conflicts_with: []
supersedes: []
requires_rules: [RM-OFF-001]
tags: [programme, room_selection, adjacency, noise, daylight]
localization_notes: The kitchen-distance penalty is culturally variable; in households where the kitchen is the social heart (much of southern Europe, South Asia) raise min_kitchen_path_m or reweight. Hemisphere affects only the daylight sub-score via LGT-DL-*.
```

#### Why — tradition
Space-syntax analysis of houses (Hillier and Hanson's work on the social logic of space) formalised
what house planners have always done by eye: rooms differ in *depth* from the entrance, and deep,
non-through rooms are the private ones. Vastu and feng shui both also express opinions about which
compass sector should hold a study — those live in `VS-ROOM-OFFICE-*` and `FS-ROOM-OFFICE-*` and are
applied *after* this functional ranking, inside whatever freedom it leaves.

#### Why — psychology / physiology
Two solid mechanisms. Intruding speech from an adjacent room degrades performance on reading and
memory tasks — the *irrelevant speech effect*, a well-replicated laboratory finding — so wall and
floor adjacency to noisy rooms is a real performance variable, not a preference. And access to
daylight and a window view supports both circadian entrainment and short-term attention recovery
(attention restoration theory, Rachel and Stephen Kaplan). The specific weights in this rule are
product decisions, not measured coefficients.

#### Customer insight
Before you buy anything, pick the right room. We ranked every room you could use on daylight, noise,
privacy and whether the family has to walk through it — a good desk in the wrong room still makes
for a bad workday.

#### Failure modes / when to skip
Skip entirely when the user has only one candidate. Do not down-rank a basement or attic purely on
depth if the user actually values the isolation — expose the weights. Do not recommend a room without
heating, a room with a damp/humidity class flag, or an unfinished attic without a compliant floor,
stair and egress (defer to `SAFE-EGR-*` and `SAFE-STRUCT-*`, which win). Do not recommend the room a
household member sleeps in.

---

### RM-OFF-003 — Minimum viable workstation footprint (ergonomic hard floor)

```yaml
id: RM-OFF-003
title: Minimum workstation footprint and chair-zone depth
system: ergonomics.anthropometrics
group: dimensions
version: 1
status: active
applies_to:
  rooms: [home_office, home_office_shared, study_library, homework_nook, bedroom_primary, bedroom_secondary, bedroom_teen, living_room, open_plan_combined, studio_apartment, reach_in_closet, walk_in_closet, loft, attic_finished, basement_finished]
  objects: [worksurface.desk.*]
  requires_features: []
scope: object_placement
severity: blocking
confidence: ergonomic
evidence_class: ergonomic
belief_gated: false
predicate: |
  let desk = target
  let chair = nearestObject(desk, seating.task_chair.*) or nearestObject(desk, seating.*)
  # 1. Usable writing/typing surface
  assert desk.footprint.w >= p.min_desk_width_m
  assert deskUsableDepth(desk) >= p.min_desk_depth_m
  # 2. Knee space under the surface
  assert kneeClearanceWidth(desk) >= p.min_knee_width_m
  assert kneeClearanceHeight(desk) >= p.min_knee_height_m
  assert kneeClearanceDepth(desk) >= p.min_knee_depth_m
  # 3. Chair zone: seat back-off + rising room, measured from the desk front edge
  assert clearance(desk, front) >= p.min_chair_zone_m
  # 4. Access: you must be able to get into the seat
  assert pathExists(room.primaryDoor.centroid, chair.seatPoint, min_width_m=p.min_access_width_m)
  # 5. Total dedicated area
  assert footprintArea(workstationZone(desk)) >= p.min_workstation_area_m2
  # Wheelchair override
  require if user.mobility == wheelchair then
    kneeClearanceHeight(desk) >= p.wc_knee_height_m and
    kneeClearanceWidth(desk) >= p.wc_knee_width_m and
    kneeClearanceDepth(desk) >= p.wc_knee_depth_m and
    turningCircle(chair.seatPoint, diameter_m = p.wc_turning_diameter_m)
params:
  - key: min_desk_width_m
    default: 1.000
    range: [0.700, 2.400]
    unit: m
    user_editable: true
    rationale: 1.00 m (39 in) is the narrowest surface that holds a laptop or monitor plus a notebook beside it. 0.70 m (28 in) is a laptop-only absolute floor for a cloffice.
  - key: min_desk_depth_m
    default: 0.600
    range: [0.450, 0.900]
    unit: m
    user_editable: true
    rationale: 0.60 m (24 in) clear depth is the usual working minimum; a 27 in or larger monitor needs 0.700-0.760 m (28-30 in) to sit at a comfortable viewing distance.
  - key: min_knee_width_m
    default: 0.600
    range: [0.510, 1.000]
    unit: m
    user_editable: true
    rationale: Clear width between pedestals/legs for the knees and a little lateral movement (24 in).
  - key: min_knee_height_m
    default: 0.650
    range: [0.600, 0.760]
    unit: m
    user_editable: true
    rationale: Underside of the surface or apron above the floor (26 in). Below this, thighs hit the desk.
  - key: min_knee_depth_m
    default: 0.450
    range: [0.380, 0.650]
    unit: m
    user_editable: true
    rationale: Unobstructed depth under the desk at knee level (18 in); drawer units and CPU towers commonly steal this.
  - key: min_chair_zone_m
    default: 0.900
    range: [0.760, 1.400]
    unit: m
    user_editable: true
    rationale: Desk edge to the nearest obstruction behind the seat. 0.90 m (36 in) lets a person push back and stand; 0.76 m (30 in) is the hard floor and feels tight.
  - key: min_access_width_m
    default: 0.600
    range: [0.560, 1.200]
    unit: m
    user_editable: true
    rationale: Squeeze width to reach the seat (24 in). Circulation routes needing more are owned by CIR-*.
  - key: min_workstation_area_m2
    default: 1.800
    range: [1.200, 6.000]
    unit: m2
    user_editable: true
    rationale: Desk footprint plus chair zone, roughly 1.2 m x 1.5 m (19 ft2). Below 1.2 m2 you are designing a shelf, not a workstation.
  - key: wc_knee_height_m
    default: 0.685
    range: [0.685, 0.800]
    unit: m
    user_editable: false
    jurisdiction_varies: true
    rationale: Knee clearance height for a forward approach under a work surface in the ADA/ANSI A117.1 family (27 in). Private homes are not regulated, but the dimension is the right target for a wheelchair user.
  - key: wc_knee_width_m
    default: 0.760
    range: [0.760, 1.200]
    unit: m
    user_editable: false
    jurisdiction_varies: true
    rationale: Clear width for a forward approach in the ADA/ANSI A117.1 family (30 in).
  - key: wc_knee_depth_m
    default: 0.485
    range: [0.430, 0.635]
    unit: m
    user_editable: false
    jurisdiction_varies: true
    rationale: Clear depth under the surface for a forward approach (19 in) in the ADA/ANSI A117.1 family.
  - key: wc_turning_diameter_m
    default: 1.525
    range: [1.500, 1.700]
    unit: m
    user_editable: false
    jurisdiction_varies: true
    rationale: 60 in turning circle for a manual wheelchair, ADA/ANSI A117.1 family. Larger powerchairs need more; confirm with the user.
score:
  weight: 10
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: swap_object
    target: worksurface.desk.*
    transform: {to_variant: narrower_but_deeper, keep: deskUsableDepth >= p.min_desk_depth_m}
    cost: medium
    effort: medium
    reversible: true
    copy: This desk is too shallow to sit a monitor at a healthy distance. A slightly narrower but deeper desk fits the same wall and works far better.
  - rank: 2
    action: remove_object
    target: storage.drawer_unit.under_desk
    transform: {relocate_to: adjacent_wall}
    cost: free
    effort: low
    reversible: true
    copy: The drawer unit under your desk is eating your legroom. Move it out from under the desk and your knees get their space back.
  - rank: 3
    action: add_object
    add: worksurface.monitor_arm
    transform: {mount: desk_rear_edge_clamp}
    cost: low
    effort: low
    reversible: true
    copy: A monitor arm pushes the screen back over the desk edge and buys you 10-15 cm (4-6 in) of usable depth on a shallow desk.
  - rank: 4
    action: relocate_workstation
    target: workstationZone
    transform: {to_zone: any_zone_meeting_min_workstation_area_m2}
    cost: free
    effort: high_physical
    reversible: true
    copy: There is not enough floor here to sit down and work properly. We found a spot that does have room.
conflicts_with: [CIR-PATH-002]
supersedes: []
requires_rules: []
tags: [dimensions, ergonomics, hard_minimum, blocking, accessibility]
localization_notes: Anthropometric minima vary by population; the engine should scale min_knee_height_m and desk height with user.height_cm via ERG-ANTH-*. The ADA-family numbers are US; EN 17210 and AS 1428 give comparable but not identical figures — jurisdiction_varies.
```

#### Why — tradition
No traditional doctrine; this is a pure functional and anthropometric rule. Say so plainly to the
user rather than dressing it in doctrine. The nearest historical analogue is the Renaissance
*studiolo*, which was tiny by choice — but it held a book, not a 27-inch monitor.

#### Why — physiology
These are dimensional consequences of human body size, not preferences. Insufficient knee height
forces the sitter to slide forward off the seat pan, removing back support; insufficient desk depth
forces the screen closer than the resting point of accommodation (around 80 cm / 31 in for many
people), which sustains accommodative and convergence effort and is a recognised contributor to
digital eye strain; insufficient chair-zone depth makes rising a twisting manoeuvre. The specific
figures come from standard occupational ergonomic guidance (e.g. the Canadian Centre for
Occupational Health and Safety recommends a 40–74 cm / 16–29 in monitor viewing distance), and the
accessible-approach numbers come from the ADA/ANSI A117.1 dimensional family.

#### Customer insight
There is a floor below which a desk stops being a desk. You need about 1 m wide by 60 cm deep of
surface (39 x 24 in), 65 cm (26 in) of clear height for your knees, and 90 cm (36 in) behind the
desk edge so you can push back and stand up. We will not generate a layout that breaks those.

#### Failure modes / when to skip
A standing-only workstation has no chair zone — set `min_chair_zone_m` to the standing clearance
instead (0.60 m / 24 in). A fold-down secretary desk or wall-mounted drop leaf legitimately breaks
the width minimum while closed; test it deployed. A child's homework station scales down with the
child (`RM-OFF-021`). This rule is `blocking` for *generation* but should be reported, not refused,
when auditing an existing layout the user cannot change — a rental with one alcove still deserves
the best available advice plus an honest note about what is compromised.

---

### RM-OFF-004 — Programme completeness: the mandatory object set for a working office

```yaml
id: RM-OFF-004
title: Programme completeness check by workspace tier
system: modernism.functionalism
group: programme
version: 1
status: active
applies_to:
  rooms: [home_office, home_office_shared, study_library, homework_nook]
  objects: []
  requires_features: []
scope: room_composition
severity: high
confidence: expert_consensus
evidence_class: ergonomic
belief_gated: false
predicate: |
  # Tier A = full-time dedicated office. Tier B = part-time. Tier C = study/library.
  let t = workspaceTier(room, user.work_hours_per_week)
  # Always required
  assert countOf(worksurface.desk.*, room) >= 1
  assert countOf(seating.task_chair.*, room) >= 1 or countOf(seating.stool.perch, room) >= 1
  assert countOf(lighting.task.*, room) >= 1
  assert layerCount(room) >= p.min_light_layers
  assert countOf(feature.electrical_outlet, within_m(desk, p.max_outlet_distance_m)) >= p.min_outlets_at_desk
  assert countOf(storage.*, room) >= 1
  # Tier A adds
  require if t == A then countOf(storage.filing_cabinet.* or storage.cabinet.credenza or storage.box.archive, room) >= 1
  require if t == A then countOf(electronics.monitor.*, room) >= 1
  require if t == A and user.calls_per_week >= p.call_threshold then
    countOf(softgoods.acoustic_panel.* or storage.bookcase.tall or softgoods.curtain.*, room) >= 1
  require if t == A then countOf(decor.whiteboard.wall or decor.pinboard.cork, room) >= 1
  # Tier C (study/library) adds
  require if t == C then countOf(seating.armchair.reading, room) >= 1
  require if t == C then shelfLinearMetres(room) >= p.min_library_shelf_m
  require if t == C then countOf(lighting.task.floor_reading, within_m(seating.armchair.reading, 1.2)) >= 1
  # Universally preferred
  prefer countOf(plants.*, room) >= 1
  prefer viewToOutside(chair.seatedEyePoint) == true
  prefer countOf(softgoods.*, room) >= p.min_soft_items
params:
  - key: min_light_layers
    default: 2
    range: [1, 4]
    unit: count
    user_editable: true
    rationale: Ambient plus task is the minimum for screen work; a third (bias or accent) layer is better. See LGT-LAY-*.
  - key: min_outlets_at_desk
    default: 2
    range: [1, 6]
    unit: count
    user_editable: true
    rationale: A laptop, a monitor, a lamp, a dock, a phone and a headset. Two wall outlets plus a surge strip is the practical minimum.
  - key: max_outlet_distance_m
    default: 1.500
    range: [0.500, 3.000]
    unit: m
    user_editable: true
    rationale: Distance from the desk within which an outlet counts as "at the desk" (59 in) without running a cable across a walkway.
  - key: call_threshold
    default: 3
    range: [0, 40]
    unit: calls_per_week
    user_editable: true
    rationale: Weekly video/voice calls above which acoustic softening becomes part of the required programme rather than a nice-to-have.
  - key: min_library_shelf_m
    default: 6.000
    range: [2.000, 60.000]
    unit: m
    user_editable: true
    rationale: Linear metres of shelving below which a room is a study but not a library (20 linear ft ~ 200-250 books).
  - key: min_soft_items
    default: 2
    range: [0, 8]
    unit: count
    user_editable: true
    rationale: Rug, curtain, upholstered chair, fabric panel. Two soft items is the practical floor for a room that will not ring on a call.
score:
  weight: 7
  curve: linear
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: lighting.task.desk_lamp_articulated
    transform: {position: non_writing_hand_side, height_m: 0.45}
    cost: low
    effort: low
    reversible: true
    copy: You have a ceiling light and a screen and nothing in between. One adjustable desk lamp is the single cheapest upgrade to how this room feels after dark.
  - rank: 2
    action: add_object
    add: storage.filing_cabinet.two_drawer
    transform: {position: within_reach_seated_or_one_step, side: non_dominant}
    cost: low
    effort: low
    reversible: true
    copy: Paper always arrives, even in a paperless job. Two drawers beside the desk keeps it off the surface.
  - rank: 3
    action: add_object
    add: plants.floor.potted_large
    transform: {position: within_view_from_seat, not_in_camera_hotspot: false}
    cost: low
    effort: low
    reversible: true
    copy: One real plant you can see from your chair. It gives your eyes somewhere to rest and it looks good on camera.
conflicts_with: []
supersedes: []
requires_rules: [RM-OFF-003]
tags: [programme, completeness, checklist]
localization_notes: Outlet counts and types vary by region (UK 13 A twin sockets, EU Schuko, US duplex). Express the requirement as "powered positions", not socket count, in non-US locales.
```

#### Why — tradition
Functionalist programme-first planning: list what the room must do, then give every activity a
place. No belief system prescribes an office object list, and the file says so rather than inventing
a lineage.

#### Why — psychology / physiology
Missing programme shows up as behavioural leakage — paper on the floor because there is no filing,
work eaten at the desk because there is no break place, a screen glowing in a dark room because
there is no task light. Each of those has a separate mechanism documented in its own rule here; the
completeness check exists because the engine can detect the *absence* of a thing far more reliably
than it can detect the resulting bad habit. No direct empirical support for the checklist as a
whole; mechanism is plausible but untested.

#### Customer insight
A working office is more than a desk and a chair. Here is what is missing from yours, in the order
that will make the biggest difference — most of it is inexpensive.

#### Failure modes / when to skip
Do not require a whiteboard for a user whose work is not visual/planning-heavy; expose it as
optional. Do not require acoustic items for a user with no calls. In rentals, wall-fixed items
(whiteboard, wall shelving, sconces) must degrade to freestanding or leaning equivalents — see
`RM-OFF-050` and the rental context file. Suppress the plant recommendation for users who have
flagged allergies, a pet that eats plants, or a very low-light room.

---

### RM-OFF-005 — Desk–window angle: work side-on to daylight

```yaml
id: RM-OFF-005
title: Screen normal perpendicular to the window wall — side-on daylight
system: lighting.daylight
group: window_relationship
version: 1
status: active
applies_to:
  rooms: [home_office, home_office_shared, study_library, homework_nook, bedroom_primary, bedroom_secondary, bedroom_teen, living_room, open_plan_combined, studio_apartment, loft, attic_finished, sunroom_conservatory]
  objects: [worksurface.desk.*, electronics.monitor.*, electronics.laptop]
  requires_features: []
scope: object_placement
severity: high
confidence: ergonomic
evidence_class: physiological
belief_gated: false
predicate: |
  let screen = target                              # monitor or laptop display
  let eye = seatedEyePoint(nearestObject(screen, seating.*))
  forEach(w in room.openings where w.kind in [window, sliding, french, bifold, skylight] and w.leads_to == exterior) {
    let a = angleBetween(screenNormal(screen), wallNormal(w.wall_id))     # 0 = screen faces the window
    # Ideal: screen normal roughly parallel to the window wall => a near 90 deg
    prefer abs(a - 90) <= p.ideal_band_deg
    assert abs(a - 90) <= p.hard_band_deg or occluded(w) or glareRisk(eye, w) <= p.max_glare_risk
    # Daylight should arrive from the side, and preferably from the non-writing-hand side
    prefer sideOfArrival(w, screen) == nonWritingHandSide(user)
  }
  # Keep the desk close enough to benefit from the daylight it is side-on to
  prefer distanceToWall(target, nearestWindowWall(room)) <= p.max_window_setback_m
  assert daylightAccess(seatedEyePoint) >= p.min_daylight_access or countOf(opening.kind==window, room) == 0
params:
  - key: ideal_band_deg
    default: 15
    range: [5, 40]
    unit: deg
    user_editable: true
    rationale: Tolerance around a true 90 deg (screen edge-on to the glass) that still counts as ideal side-on daylight.
  - key: hard_band_deg
    default: 45
    range: [20, 70]
    unit: deg
    user_editable: true
    rationale: Beyond 45 deg off side-on, the window is materially either in front of or behind the screen and a separate rule fires.
  - key: max_glare_risk
    default: 0.30
    range: [0.00, 0.70]
    unit: ratio
    user_editable: false
    rationale: Escape hatch: if blinds, a deep reveal, a tree or an overhang already kill the glare, the geometry rule can relax.
  - key: max_window_setback_m
    default: 3.000
    range: [1.000, 8.000]
    unit: m
    user_editable: true
    rationale: Daylight falls off fast; beyond about 3 m (10 ft) from the glass a desk gets little useful daylight and needs task light all day.
  - key: min_daylight_access
    default: 0.25
    range: [0.00, 1.00]
    unit: ratio
    user_editable: true
    rationale: Minimum modelled daylight availability at the seated eye. Zero is only acceptable in a windowless room.
score:
  weight: 8
  curve: gaussian
  partial_credit: true
remedies:
  - rank: 1
    action: rotate_object
    target: worksurface.desk.*
    transform: {rot_to: screen_normal_parallel_to_window_wall, keep: backsToWall(chair_side)}
    cost: free
    effort: medium
    reversible: true
    copy: Turn the desk a quarter turn so the window is beside you rather than in front of or behind you. Daylight on your page, none on your screen.
  - rank: 2
    action: add_object
    add: softgoods.blind.roller_light_filtering
    transform: {mount: window_reveal, openness_pct: 3}
    cost: low
    effort: low
    reversible: true
    copy: A light-filtering roller blind keeps the daylight and removes the glare — better than a blackout blind, which makes you choose between the two.
  - rank: 3
    action: add_object
    add: softgoods.blind.venetian
    transform: {slat_orientation: horizontal, tilt: upward_bounce}
    cost: low
    effort: low
    reversible: true
    copy: Venetian slats tilted up throw daylight onto the ceiling, which lights the room without hitting your screen.
  - rank: 4
    action: move_object
    target: electronics.monitor.*
    transform: {to: opposite_end_of_desk, keep: screenNormal perpendicular_to_window}
    cost: free
    effort: low
    reversible: true
    copy: If the desk cannot turn, slide the screen along it — even 60 cm (2 ft) can take the window out of your screen's reflection.
conflicts_with: [FS-CMD-001, RM-OFF-008]
supersedes: []
requires_rules: []
tags: [window, daylight, glare, desk_geometry, signature_rule]
localization_notes: Which orientation is harshest depends on hemisphere and latitude — south-facing glass in the northern hemisphere, north-facing in the southern. The 90 deg geometry rule itself is hemisphere-invariant; the glare severity multiplier is not. See LGT-DL-* and site.hemisphere.
```

#### Why — tradition
Pre-electric design solved this by default: the schoolroom, the drawing office and the Victorian
study all put the desk broadside to the window, and the convention of daylight over the
non-writing hand (left, for the right-handed majority) predates electricity by centuries because a
hand casts a shadow on its own work. Feng shui doctrine is largely silent on window *angle* and
concerns itself with the desk's relationship to the door — which is why this rule and
`FS-CMD-*` are separate and sometimes compete.

#### Why — physiology
A window in your field of view behind the screen creates a luminance ratio the eye cannot
simultaneously accommodate: the pupil constricts to the bright window and the screen becomes a
murky grey. A window in front of you reflects off the screen surface as veiling glare, reducing
contrast on the task. Occupational guidance is explicit about the fix — the Canadian Centre for
Occupational Health and Safety recommends positioning the workstation so that windows and linear
luminaires run **parallel to the worker's line of sight**, which is exactly the 90-degree geometry
here.

#### Customer insight
The best place for a window is beside you. Put it in front and it reflects off your screen; put it
behind and your screen looks grey all day and you look like a silhouette on calls. A quarter turn of
the desk usually fixes it and costs nothing.

#### Failure modes / when to skip
Windowless rooms: skip. Rooms with a window on every wall: there is no compliant angle, so this rule
downgrades to advisory and the layout switches to `OFF-ARCH-05` (island desk) plus blinds on the two
worst walls. A desk deliberately placed at the window for the view (`RM-OFF-013`) accepts the glare
penalty knowingly — offer it as an explicit trade the user can choose. North-facing glass (northern
hemisphere) with no direct sun is much more forgiving; allow a wider band. If this rule and
`FS-CMD-001` cannot both be satisfied, follow the precedence ladder: function and physiology outrank
belief-system geometry, but the engine must show the user both options and let them choose.

---

### RM-OFF-006 — The screen must not face a bright window

```yaml
id: RM-OFF-006
title: No bright window in front of the screen (veiling reflection)
system: lighting.photometric
group: window_relationship
version: 1
status: active
applies_to:
  rooms: [home_office, home_office_shared, study_library, homework_nook, bedroom_primary, bedroom_secondary, bedroom_teen, living_room, open_plan_combined, studio_apartment, loft, attic_finished, sunroom_conservatory, basement_finished]
  objects: [electronics.monitor.*, electronics.laptop]
  requires_features: []
scope: object_placement
severity: high
confidence: physiological
evidence_class: physiological
belief_gated: false
predicate: |
  let screen = target
  forEach(w in room.openings where w.kind in [window, sliding, french, bifold] and w.leads_to == exterior) {
    # "Faces the window" = the screen's outward normal points at the glass
    let facing = angleBetween(screenNormal(screen), vectorTo(centroid(screen), centroid(w))) <= p.facing_cone_deg
    # The window is then in the screen's specular reflection cone as seen from the eye
    let inCone = inReflectionCone(w, screen, seatedEyePoint(nearestObject(screen, seating.*)))
    forbid facing and inCone and not occluded(w) and w.glazing.vt >= p.min_vt_to_matter
  }
  # Matte/anti-glare screens and deep reveals reduce but do not remove the problem
  penalize(facing and screen.finish == glossy, weight=3)
params:
  - key: facing_cone_deg
    default: 50
    range: [20, 90]
    unit: deg
    user_editable: false
    rationale: Half-angle within which a window counts as being in front of the screen. Screens reflect over a wide cone, not just dead ahead.
  - key: min_vt_to_matter
    default: 0.20
    range: [0.05, 0.90]
    unit: ratio
    user_editable: false
    rationale: Visible transmittance below which the glazing is dark enough (heavily tinted, obscured, glass block) to stop mattering.
score:
  weight: 8
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: rotate_object
    target: worksurface.desk.*
    transform: {rot_to: screen_normal_parallel_to_window_wall}
    cost: free
    effort: medium
    reversible: true
    copy: Your screen is looking straight at the window, so the window is looking straight back at you out of the screen. Turn the desk so the glass is to one side.
  - rank: 2
    action: add_object
    add: softgoods.blind.roller_light_filtering
    transform: {mount: window_reveal}
    cost: low
    effort: low
    reversible: true
    copy: A light-filtering blind knocks the window's brightness down without turning the room into a cave.
  - rank: 3
    action: swap_object
    target: electronics.monitor.*
    transform: {to_variant: matte_antiglare_panel}
    cost: medium
    effort: low
    reversible: true
    copy: If the desk genuinely cannot move, a matte screen instead of a glossy one removes most of the mirror effect.
conflicts_with: [RM-OFF-013]
supersedes: []
requires_rules: [RM-OFF-005]
tags: [window, glare, screen, reflection]
localization_notes: Severity should scale with solarExposure(wall) and latitude; a north-facing window at 55 deg N is far less of a problem than a west-facing one at 33 deg N. Hemisphere-flipped for southern sites.
```

#### Why — tradition
Purely technical; there is no traditional doctrine about screen reflections because screens are
sixty years old. Tell the user that honestly.

#### Why — physiology
A display is a partial mirror. A bright source in front of it produces a *veiling reflection* — a
luminance added uniformly across the dark parts of the image, which lowers task contrast and forces
the visual system to work harder for the same information. It is one of the standard, well-documented
causes of visual fatigue at screens and is the reason ergonomic guidance treats screen orientation
relative to windows and luminaires as a primary variable rather than a detail.

#### Customer insight
If you can see the window reflected in your screen, your screen has lost half its contrast — you are
reading through a layer of sky. Turning the desk a quarter turn fixes it for free.

#### Failure modes / when to skip
Do not fire against a window that is permanently obscured (frosted, behind a dense hedge, a light
well). Do not fire on a deliberate window desk where the user has accepted the trade — see
`RM-OFF-013` — but keep the finding visible as advisory. At night this rule is irrelevant; if the
user works only after dark, downgrade to low. A very dim, small or high-sill window may not reach
the threshold at all.

---

### RM-OFF-007 — The screen (and the worker) must not back a bright window

```yaml
id: RM-OFF-007
title: No bright window behind the screen or behind the worker's head
system: lighting.photometric
group: window_relationship
version: 1
status: active
applies_to:
  rooms: [home_office, home_office_shared, study_library, homework_nook, bedroom_primary, bedroom_secondary, bedroom_teen, living_room, open_plan_combined, studio_apartment, loft, attic_finished, sunroom_conservatory]
  objects: [electronics.monitor.*, electronics.laptop, worksurface.desk.*]
  requires_features: []
scope: object_placement
severity: high
confidence: physiological
evidence_class: physiological
belief_gated: false
predicate: |
  let screen = target
  let seat = nearestObject(screen, seating.*)
  let eye = seatedEyePoint(seat)
  forEach(w in room.openings where w.kind in [window, sliding, french, bifold] and w.leads_to == exterior) {
    # Case A: window behind the SCREEN => screen silhouetted against sky, eye adapts to the window
    let behindScreen = angleBetween(vectorTo(eye, centroid(w)), vectorTo(eye, centroid(screen))) <= p.behind_screen_cone_deg
    let ratio = luminanceRatio(w, screen)
    assert not (behindScreen and ratio >= p.max_surround_ratio and not occluded(w))
    # Case B: window behind the WORKER's head => camera backlight (see RM-OFF-023) and screen wash
    let behindHead = angleBetween(vectorTo(eye, centroid(w)), negate(viewVector(eye, screen))) <= p.behind_head_cone_deg
    penalize(behindHead and not occluded(w), weight=4)
  }
params:
  - key: behind_screen_cone_deg
    default: 35
    range: [15, 60]
    unit: deg
    user_editable: false
    rationale: Half-angle of the near visual field around the screen inside which a bright source competes for the eye's adaptation state.
  - key: max_surround_ratio
    default: 10.0
    range: [3.0, 40.0]
    unit: ratio
    user_editable: true
    rationale: Luminance ratio between the screen and a source in the far surround. Standard ergonomic guidance aims for about 3:1 to the immediate surround and about 10:1 to the remote surround; a daylit window commonly exceeds 50:1.
  - key: behind_head_cone_deg
    default: 40
    range: [20, 70]
    unit: deg
    user_editable: false
    rationale: Cone behind the seated head inside which a window will backlight the face on camera and wash the screen from behind.
score:
  weight: 8
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: rotate_object
    target: worksurface.desk.*
    transform: {rot_by_deg: 90, keep: screen_normal_parallel_to_window_wall}
    cost: free
    effort: medium
    reversible: true
    copy: Right now you are staring into a bright window with your screen in front of it — your eyes adjust to the sky and the screen goes flat. Turn the desk so the window is beside you.
  - rank: 2
    action: add_object
    add: softgoods.curtain.sheer
    transform: {mount: window_track, coverage: full_width}
    cost: low
    effort: low
    reversible: true
    copy: A sheer curtain turns the window from a hard bright rectangle into a soft glowing one. You keep the light and the view, and your screen comes back.
  - rank: 3
    action: move_object
    target: worksurface.desk.*
    transform: {to_zone: wall_adjacent_to_window_wall, keep: clearance(front) >= 0.9}
    cost: free
    effort: high_physical
    reversible: true
    copy: Moving the desk to the next wall along puts the window at your shoulder instead of in your face.
  - rank: 4
    action: add_object
    add: lighting.bias.monitor_backlight_strip
    transform: {mount: monitor_rear, cct_k: 4000, output_pct: 25}
    cost: low
    effort: low
    reversible: true
    copy: A soft light behind the monitor closes the gap between screen brightness and the wall behind it. It is the cheapest fix if nothing can move.
conflicts_with: [RM-OFF-010, FS-CMD-001]
supersedes: []
requires_rules: [RM-OFF-005]
tags: [window, glare, adaptation, video_call, signature_rule]
localization_notes: Hemisphere-dependent severity via solarExposure(wall). In high-latitude winter the low sun makes this dramatically worse for several hours a day even on a modest window.
```

#### Why — tradition
Feng shui's form-school preference for a solid wall behind the seated worker (see `FS-CMD-*`)
happens to exclude the worst version of this problem, because a solid wall is not a window. That is
a genuine convergence but a partial one: the doctrine's reason is symbolic support and security, not
luminance adaptation, and the doctrine does not object to a window *behind the screen*, which is the
version that ruins your eyesight. Name the convergence honestly and keep the two rules separate.

#### Why — physiology
The retina adapts to the brightest thing in the field of view. A daylit window can be tens to
hundreds of times brighter than a screen, so the eye's adaptation level is set by the sky and the
screen falls below comfortable contrast; the user then raises screen brightness, which is
uncomfortable after dark. Standard ergonomic practice keeps the immediate surround within roughly
3:1 of the task and the remote surround within roughly 10:1 — a bare window behind the monitor
routinely breaks both by an order of magnitude. The camera consequence (a silhouetted face) is the
same physics applied to the webcam's automatic exposure.

#### Customer insight
A window behind your screen makes your screen look grey and makes you look like a witness in
protection on video calls. Move the desk so the window is at your side — or if it truly cannot move,
a sheer curtain and a small light behind the monitor will do most of the work.

#### Failure modes / when to skip
Skip for windowless rooms and for windows permanently obscured. Downgrade heavily for a small
high-sill window, a north-facing window at high latitude, or a user who works only after dark. Note
the collision with `RM-OFF-010` and `FS-CMD-001`: in a room where the only solid wall is opposite the
window, backing the solid wall means facing the window and vice versa. The documented resolution is
in the relaxation ladder of `## GENERATION_RECIPE` — treat the glare first, restore the sense of
backing with a tall bookcase or a high-backed chair.

---

### RM-OFF-008 — Desk sightline to the door: prospect–refuge and the honest feng shui convergence

```yaml
id: RM-OFF-008
title: Seated worker can see the primary door without turning the torso
system: psych.prospect_refuge
group: door_relationship
version: 1
status: active
applies_to:
  rooms: [home_office, home_office_shared, study_library, homework_nook, bedroom_primary, bedroom_secondary, bedroom_teen, living_room, open_plan_combined, studio_apartment, loft, attic_finished, basement_finished, guest_suite]
  objects: [worksurface.desk.*, seating.task_chair.*]
  requires_features: []
scope: object_placement
severity: high
confidence: evidence_moderate
evidence_class: mixed
belief_gated: false
predicate: |
  let seat = target                                  # the task chair at the primary desk
  let eye  = seatedEyePoint(seat)
  let door = room.primaryDoor
  # 1. You can see the entry without standing or swivelling more than a head turn
  assert lineOfSight(eye, centroid(door)) == true
      or lineOfSight(eye, centroid(door)) via_reflection(decor.mirror.wall) == true
  assert abs(angleBetween(viewVector(eye, screen), vectorTo(eye, centroid(door)))) <= p.max_head_turn_deg
  # 2. The door is not directly behind the seated head
  forbid angleBetween(vectorTo(eye, centroid(door)), negate(viewVector(eye, screen))) <= p.rear_blind_cone_deg
  # 3. Broad awareness of the room: the seat commands most of the floor
  prefer isovistArea(eye) / room.area_m2 >= p.min_isovist_fraction
  # 4. But not so exposed that the worker is on display from a circulation route
  penalize(lineOfSight(eye, centroid(o)) and o.kind in [doorway, arch, pass_through] and countOf(such openings) >= 2, weight=2)
  # 5. Secondary doors matter less but still count
  forEach(d in room.openings where d.kind == door and d.id != door.id) {
    prefer lineOfSight(eye, centroid(d)) == true
  }
params:
  - key: max_head_turn_deg
    default: 120
    range: [60, 180]
    unit: deg
    user_editable: true
    rationale: Angle off the screen axis within which the door can be checked with a head turn rather than a whole-body turn. Comfortable head rotation is roughly 60 deg each way; 120 deg allows a small chair swivel.
  - key: rear_blind_cone_deg
    default: 60
    range: [30, 100]
    unit: deg
    user_editable: true
    rationale: Cone behind the head inside which an entrant is genuinely unseen until they speak. This is the geometry that produces the startle.
  - key: min_isovist_fraction
    default: 0.60
    range: [0.20, 1.00]
    unit: ratio
    user_editable: true
    rationale: Fraction of the room's floor visible from the seated eye. Below about 0.6 the worker cannot tell who is in the room with them.
score:
  weight: 8
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: worksurface.desk.*
    transform: {to_zone: diagonal_from_door, keep: backsToWall(chair_side, min_contact_pct=60), keep: screen_normal_parallel_to_window_wall}
    cost: free
    effort: high_physical
    reversible: true
    copy: Put the desk on the diagonal from the door, with a wall behind you. You see who comes in, nobody reads your screen over your shoulder, and the window stays at your side.
  - rank: 2
    action: rotate_object
    target: seating.task_chair.*
    transform: {rot_to: door_within_max_head_turn_deg}
    cost: free
    effort: low
    reversible: true
    copy: Sometimes you only need to turn your chair and monitor 45 degrees to bring the doorway into the corner of your eye.
  - rank: 3
    action: add_object
    add: decor.mirror.wall
    transform: {position: so_that lineOfSight(eye, door.centroid) via_reflection, tilt_deg: 0, min_width_m: 0.4}
    cost: low
    effort: low
    reversible: true
    copy: If the desk truly cannot turn, a small mirror placed so you can see the doorway in it gives you back the awareness. It is a real fix, not a superstition — you can see the door.
  - rank: 4
    action: add_object
    add: electronics.convex_desk_mirror
    transform: {mount: monitor_top_or_bezel}
    cost: low
    effort: low
    reversible: true
    copy: A tiny convex mirror clipped to the monitor does the same job in a space too tight for a wall mirror.
conflicts_with: [RM-OFF-007, RM-OFF-005, CIR-PATH-004]
supersedes: []
requires_rules: []
tags: [door, sightline, prospect_refuge, command_position, convergence, signature_rule]
localization_notes: Hemisphere-invariant. The compass-direction layer of command position (which way the worker should face) is FS-CMD/FS-EM-* and is applied after this geometric rule.
```

#### Why — tradition
Feng shui's form school calls this the *commanding position*: the desk placed so the seated occupant
faces into the room, sees the door, and is not in the door's direct line. Classical and Black Sect
(BTB) schools agree on the geometry even where they differ on compass direction, and the mirror
remedy is a standard traditional fix. The doctrinal reason is that qi enters with the door and the
occupant should meet opportunity from a position of support — the doctrine layer itself is
`FS-CMD-*`, not this file.

#### Why — psychology / physiology
There is an independent mechanism, and it converges on almost the same geometry — this is one of the
strongest honest-convergence stories in the library. Jay Appleton's *prospect–refuge* theory (1975)
holds that people prefer positions that offer an outward view (prospect) while protecting the back
(refuge); the seated diagonal-from-door position with a wall behind is close to a textbook instance.
Separately, an entrant appearing inside the rear blind cone triggers an orienting/startle response,
and research on workplace interruption (Gloria Mark and colleagues) documents the cost of resuming
an interrupted task. **Be honest about the limits:** prospect–refuge is a well-known theory with
mixed empirical support in interiors, the interruption research measures interruption cost rather
than desk geometry, and no study establishes that the commanding position improves work output.
What can be said is that the geometry independently reduces unseen approach and increases
situational awareness, which most people report as feeling calmer.

#### Customer insight
Sit where you can see the door. Feng shui calls it the commanding position; you will notice it as
simply not being startled when someone walks in behind you. When both traditions and plain comfort
point at the same corner of the room, that corner is usually right.

#### Failure modes / when to skip
A solo occupant in a locked flat with no one else at home gains far less from this; downgrade to
medium. In a tiny room the geometry may be impossible — then the mirror remedy is the answer and
should be presented without apology. If satisfying this rule forces the screen to face a bright
window, the physiological rules (`RM-OFF-006`, `RM-OFF-007`) win on the precedence ladder and the
engine must tell the user that a belief rule lost and why. Never place the desk so it blocks the
door swing or narrows an egress route — `SAFE-EGR-*` and `CIR-PATH-*` outrank this.

---

### RM-OFF-009 — Desk clear of the door swing, the push-path and long straight runs

```yaml
id: RM-OFF-009
title: Desk out of the door swing, the entry push-path and any long straight approach
system: circulation.desire_lines
group: door_relationship
version: 1
status: active
applies_to:
  rooms: [home_office, home_office_shared, study_library, homework_nook, bedroom_primary, bedroom_secondary, bedroom_teen, living_room, open_plan_combined, studio_apartment, loft, attic_finished, basement_finished]
  objects: [worksurface.desk.*, seating.task_chair.*, storage.bookcase.tall, storage.filing_cabinet.*]
  requires_features: []
scope: object_placement
severity: high
confidence: expert_consensus
evidence_class: ergonomic
belief_gated: false
predicate: |
  let obj = target
  forEach(d in room.openings where d.kind in [door, doorway, arch, pocket, sliding, bifold]) {
    # 1. Hard: nothing in the leaf's swept arc
    forbid overlaps(obj, doorSwingArc(d))
    assert doorSwingClear(d) == true
    # 2. The landing zone immediately inside the door stays clear
    forbid overlaps(obj, entryLandingZone(d, depth_m = p.landing_depth_m, width_m = d.width_m + p.landing_side_margin_m))
    # 3. Drawer/door fronts must be openable without fouling the entry
    forbid overlaps(drawerSweep(obj), entryLandingZone(d, p.landing_depth_m, d.width_m))
    # 4. Do not sit at the end of a long straight approach aimed at your back
    let run = straightRunLength(centroid(d), seatedEyePoint(nearestObject(obj, seating.*)))
    penalize(run >= p.max_straight_run_m and alignedWithin(d.openingAxis, vectorTo(centroid(d), seatPoint), tol_deg=20), weight=3)
    # 5. Two facing doors: never put the desk on the through-line
    let pairs = facingOpeningPairs(room, tol_deg = p.facing_pair_tol_deg)
    forEach(pr in pairs) { forbid overlaps(obj, corridorBetween(pr.a, pr.b, width_m = p.through_line_width_m)) }
  }
  assert pathWidth(room.primaryDoor.centroid, farthestCorner(room)) >= p.min_room_path_width_m
params:
  - key: landing_depth_m
    default: 0.900
    range: [0.600, 1.500]
    unit: m
    user_editable: true
    rationale: Clear depth just inside a door for a person to enter, stop and close the door behind them (36 in).
  - key: landing_side_margin_m
    default: 0.150
    range: [0.000, 0.600]
    unit: m
    user_editable: true
    rationale: Extra width each side of the leaf so a shoulder or a carried box clears the frame (6 in).
  - key: max_straight_run_m
    default: 4.500
    range: [2.500, 12.000]
    unit: m
    user_editable: true
    rationale: Length of unbroken straight approach beyond which an entrant arrives at speed and the seated worker has no reaction time (15 ft). Also the feng shui "rushing qi" geometry — see FS-QI-*.
  - key: facing_pair_tol_deg
    default: 25
    range: [5, 45]
    unit: deg
    user_editable: false
    rationale: Angular tolerance for treating two openings as facing each other and generating a through-route.
  - key: through_line_width_m
    default: 0.900
    range: [0.700, 1.500]
    unit: m
    user_editable: true
    rationale: Width of the reserved corridor between two facing openings (36 in). Wider in a family thoroughfare.
  - key: min_room_path_width_m
    default: 0.760
    range: [0.600, 1.200]
    unit: m
    user_editable: true
    rationale: Minimum walkable width anywhere in the office (30 in). CIR-PATH-* owns the general network; this is the local floor.
score:
  weight: 8
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: move_object
    target: worksurface.desk.*
    transform: {offset_from: door_landing_zone, min_m: 0.9}
    cost: free
    effort: medium
    reversible: true
    copy: The desk is standing in the doorway's landing space. Slide it clear so you can walk in, put a box down, and shut the door behind you.
  - rank: 2
    action: change_opening
    target: opening.door
    transform: {swing: reverse_to_out, or: convert_to_pocket}
    cost: medium
    effort: medium
    reversible: false
    copy: Rehanging the door to open the other way, or swapping it for a sliding door, can release most of a square metre in a small office.
  - rank: 3
    action: add_object
    add: storage.bookcase.tall
    transform: {position: interrupt_straight_run, min_height_m: 1.5, keep: pathWidth >= p.min_room_path_width_m}
    cost: low
    effort: medium
    reversible: true
    copy: A bookcase part-way along a long approach breaks the run, so people arrive at your desk rather than arriving at your back.
conflicts_with: [RM-OFF-008]
supersedes: []
requires_rules: [RM-OFF-003]
tags: [door, swing, circulation, entry, hard_constraint]
localization_notes: Door swings are a code matter for egress doors — see SAFE-EGR-*. Pocket and sliding conversions may be restricted in rentals and in fire-rated walls; flag rather than recommend where wall.structural or fire rating is unknown.
```

#### Why — tradition
Feng shui treats a long unbroken approach — especially between two facing doors — as *sha qi*,
"rushing" energy, and advises interrupting it with furniture or a screen. The doctrine is
`FS-QI-*`; this rule reuses the geometry for a functional reason and does not claim the doctrinal
one. Traditional room planning independently reserves a threshold or vestibule zone inside every
entrance.

#### Why — psychology / physiology
Two mechanisms, both mundane and real. The landing zone is pure ergonomics: a person entering needs
somewhere to be while they turn and close the door, and a desk corner in that space produces
repeated hip bruises and door dings. The straight-run penalty is about reaction time and startle —
an entrant crossing 5 m of clear floor toward an unseeing back arrives faster than the seated
person's orienting response can accommodate. No direct empirical support for the specific 4.5 m
threshold; it is a design heuristic.

#### Customer insight
Leave the doorway its own square metre. It is the space you need to walk in holding a coffee and a
laptop and close the door behind you — and if your desk is in it, you will find out by bruising your
hip on it twice a week.

#### Failure modes / when to skip
Tiny rooms and cloffices cannot always give a full landing zone; reduce `landing_depth_m` toward
0.60 m (24 in) before failing the layout, and report the compromise. Doors that are always open
(a doorway with no leaf) still need the landing zone but no swing arc. A desk whose only possible
position is on a through-line between two openings is a real case — switch to `OFF-ARCH-05` with
the desk turned so the route passes behind the worker's monitor rather than through their chair
zone. This rule never overrides `SAFE-EGR-*`.

---
