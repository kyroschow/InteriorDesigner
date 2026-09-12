# Room 12 — Home Gym, Yoga / Meditation Room & Home Wellness
<!-- library-file: v1 | system(s): modernism.functionalism, ergonomics.task_zones, ergonomics.anthropometrics, safety.structural, safety.child, safety.egress, acoustics.privacy, behavior.habit_design, lighting.layers, psych.cognitive_load, neurodiversity.sensory, product.parameter | rule-id-prefixes: RM-GYM | author-agent: room-12-functional-design-layer -->

## Scope

The **functional / practical / design layer** for rooms and zones whose primary purpose is
physical training, movement practice, or bodily recovery:

- `home_gym` — a dedicated or semi-dedicated strength/cardio room.
- `yoga_meditation_room` — a movement-and-stillness practice room.
- `workshop_garage` / `garage_parking` used as a gym (the single most common real-world home gym).
- `basement_finished` / `basement_unfinished` / `attic_finished` gyms.
- A **workout corner** inside `bedroom_primary`, `bedroom_secondary`, `living_room`,
  `family_room`, `home_office`, `guest_suite`, `loft`, `open_plan_combined`, `studio_apartment`.
- A **sauna or cold plunge** where present (`sauna_room` — declared below; plunge tubs also
  occur in `wet_room`, `bathroom_full`, `patio_deck`, `garden_yard`).

This file owns: activity clear-volume geometry, equipment footprints and their motion envelopes,
structural floor loading and impact, floor build-up, noise-transmission consequences for layout,
ventilation/thermal usability, mirrors, screens and audio, storage and habit friction, the
yoga/meditation sensory brief, multi-use and pack-away layouts, gym-specific safety, hygiene, and
the two generative blocks (`LAYOUT_ARCHETYPES`, `GENERATION_RECIPE`).

This file does **not** own and must not re-derive: feng shui room doctrine (`FS-ROOM-*`),
command position (`FS-CMD-*`), bagua sectoring (`FS-BAG-*`), five-element assignment (`FS-ELEM-*`),
vastu zoning (`VS-ROOM-*`), the generic ergonomic clearance tables (`ERG-CLR-*`), photometric
lighting design (`LGT-*`), room acoustics and absorption (`ACU-*`), colour (`CLR-*`),
circulation network rules (`CIR-*`), or the general safety library (`SAFE-*`). Those are
**applied** here with room-specific parameter values and priorities — see `## CROSS_REFERENCES`.

**Honesty posture for this room.** Almost nothing in this file is traditional doctrine. Training
geometry is derived from implement dimensions, human reach envelopes, and equipment-standard
safety areas; floor loading is structural engineering; noise is building physics. Where a rule has
no traditional face, it says so plainly rather than inventing doctrine. The one genuinely
tradition-bearing area is the yoga/meditation focal point and altar (RM-GYM-036), which is handled
with an explicit cultural-respect note and is belief-gated.

## Rule count: 45

## Rules

### RM-GYM-001 — Declare the activity programme before placing anything

```yaml
id: RM-GYM-001
title: Declare the activity programme before placing anything
system: modernism.functionalism
group: programme
version: 1
status: active
applies_to:
  rooms: [home_gym, yoga_meditation_room, workshop_garage, garage_parking, basement_finished, basement_unfinished, attic_finished, loft, guest_suite, bedroom_primary, bedroom_secondary, living_room, family_room, home_office, open_plan_combined, studio_apartment, sauna_room]
  objects: [exercise.*]
  requires_features: []
scope: room_composition
severity: high
confidence: expert_consensus
evidence_class: ergonomic
belief_gated: false
predicate: |
  # A gym is a volume of reserved air, not a set of objects. The programme is the input.
  let declared = room.activity_programme          # [pose_id] chosen by the user or inferred
  require count(declared) >= 1
  # Every declared activity must own a clear zone that actually exists in the room.
  forEach a in declared:
    assert activityEnabled(a) == true
    assert exists activityZone(a)
    assert clearVolume(activityZone(a), z_min=0.0, z_max=zoneHeightRequired(a)) == true
  # Equipment that serves no declared activity is flagged as programme drift.
  forEach obj in room.objects where obj.type matches exercise.*:
    prefer any(a in declared: servesActivity(obj, a))
  # Guard against over-programming: total reserved zone area cannot exceed usable floor.
  assert sumZoneArea(declared) <= room.area_m2 * p.max_zone_packing_ratio
params:
  - key: max_zone_packing_ratio
    default: 0.72
    range: [0.45, 0.90]
    unit: ratio
    user_editable: false
    rationale: Zones may overlap in time but not in space; the remainder is circulation, storage and equipment footprint.
  - key: min_declared_activities
    default: 1
    range: [1, 8]
    unit: count
    user_editable: false
    rationale: A room with no declared activity cannot be scored or generated.
  - key: warn_on_unserved_equipment
    default: true
    range: [true, false]
    unit: bool
    user_editable: true
    rationale: Some users keep equipment for future or seasonal activities and do not want the nag.
score:
  weight: 9
  curve: step
  partial_credit: true
remedies:
  - rank: 1
    action: prompt_user
    target: room
    transform: {ask: activity_programme, options: [mat_floor_work, yoga_asana, seated_meditation, standing_dumbbell, barbell_squat, barbell_bench, barbell_deadlift, overhead_press, kettlebell_swing, pullup, jump_rope, boxing_bag, treadmill_run, bike_ride, row_erg, cable_work, plyometrics, vr_dance, stretching_mobility, sauna, cold_plunge]}
    cost: free
    effort: none
    reversible: true
    copy: Tell us what you actually do in here. We size the room around the movements, not the machines.
  - rank: 2
    action: infer
    target: room
    transform: {from: room.objects, map: object_type_to_activity}
    cost: free
    effort: none
    reversible: true
    copy: We have guessed your activities from the equipment you already own — correct us if we are wrong.
  - rank: 3
    action: remove_object
    target: exercise.*
    transform: {where: not servesActivity(obj, declared), to: storage_room}
    cost: free
    effort: medium_physical
    reversible: true
    copy: This piece is not serving anything on your list. Moving it out buys back floor you will actually use.
conflicts_with: []
supersedes: []
requires_rules: []
tags: [programme, brief, signature_rule, generation_input, gym]
localization_notes: Activity vocabulary is culture-neutral; sauna and cold plunge are strongly regionally weighted (Nordic, Baltic, Russian, Japanese, North American recovery culture) and should be surfaced first in those markets.
```

#### Why — tradition
No traditional doctrine. This is a functional rule and the direct descendant of the modernist
programme brief — Louis Sullivan's "form follows function" and, more usefully, the mid-century
practice of writing a room's activity schedule before drawing a plan. Feng shui and vastu both have
a great deal to say about *where* a gym should sit within a home and about the yang/rajasic quality
of vigorous movement, but neither tradition contains a doctrine of exercise clear-volume, because
household strength training with loaded implements is a twentieth-century phenomenon.

#### Why — psychology / physiology
Home training equipment has a well-known abandonment problem; the mechanism with the best support
is not motivational but frictional — practice stops when the space required to perform it is not
reliably available. Declaring the activity set first converts the design problem from "where does
the treadmill go" (an object problem, which permits a room full of objects and no room to move) to
"what volume of air must stay clear" (a volume problem, which cannot be quietly violated).
No direct empirical support for the specific 0.72 packing ratio; it is a product heuristic derived
from typical equipment footprints plus a 0.9 m circulation band.

#### Customer insight
Before we move a single thing, tell us what you do in here — floor work, lifting, running, yoga, or
all of it. Home gyms fail when they fill up with kit and run out of space to move, so we design the
empty space first and fit the equipment around it.

#### Failure modes / when to skip
Skip the packing check in rooms under 4 m² (43 sq ft), where a single activity will exceed the ratio
by definition — instead fall to the micro-gym archetypes (GYM-A08, GYM-A12) and warn honestly.
Do not fire `warn_on_unserved_equipment` for rehabilitation equipment, seasonal kit, or anything
flagged `primary_user: senior` or `accessibility.*`, which may be present for episodic need.

### RM-GYM-002 — The primary clear training rectangle and the room size bands

```yaml
id: RM-GYM-002
title: The primary clear training rectangle and the room size bands
system: ergonomics.task_zones
group: clear_volume
version: 1
status: active
applies_to:
  rooms: [home_gym, yoga_meditation_room, workshop_garage, garage_parking, basement_finished, basement_unfinished, attic_finished, loft, guest_suite, open_plan_combined, studio_apartment]
  objects: []
  requires_features: []
  min_room_area_m2: 2.5
scope: room_composition
severity: high
confidence: expert_consensus
evidence_class: ergonomic
belief_gated: false
predicate: |
  # Exactly one contiguous, rectangular, obstruction-free floor area is the room's backbone.
  let band = sizeBand(room.area_m2)     # micro | compact | standard | generous | hall
  let need = p.primary_rect_by_band[band]
  let rect = largestFreeRect(room, z_min=0.0, z_max=p.rect_clear_height_m)
  assert rect.w >= need.w and rect.d >= need.d
  # It must be a real rectangle, not an L or a corridor of leftovers.
  assert rect.w / rect.d <= p.max_rect_aspect
  # It must not be crossed by the main walking route between two openings.
  forEach pair in openingPairs(room):
    penalize(crossesPath(rect, desireLine(pair)), weight=4)
  # Door leaves must not sweep into it.
  forEach o in room.openings where o.kind in [door, french, bifold]:
    assert overlaps(doorSwingClear(o), rect) == false
  # Nothing may live inside it permanently except deployable flooring.
  forEach obj in room.objects where obj.is_fixed == true:
    assert overlaps(bbox(obj), rect) == false
params:
  - key: primary_rect_by_band
    default: {micro: {w: 1.20, d: 2.10}, compact: {w: 1.80, d: 2.10}, standard: {w: 2.40, d: 2.70}, generous: {w: 3.00, d: 3.60}, hall: {w: 3.60, d: 4.50}}
    range: [{w: 0.90, d: 1.80}, {w: 6.00, d: 8.00}]
    unit: m
    user_editable: true
    rationale: micro 1.2x2.1 m (47x83 in) holds one mat plus a kneeling arm span; standard 2.4x2.7 m (94x106 in) holds a mat plus standing dumbbell work; generous 3.0x3.6 m (118x142 in) holds a barbell lane.
  - key: size_band_breaks_m2
    default: [4.5, 9.0, 14.0, 22.0]
    range: [[3.0, 6.0, 10.0, 16.0], [6.0, 12.0, 20.0, 32.0]]
    unit: m2
    user_editable: false
    rationale: Breaks at ~48, 97, 151 and 237 sq ft separate micro/compact/standard/generous/hall.
  - key: rect_clear_height_m
    default: 2.10
    range: [1.90, 2.60]
    unit: m
    user_editable: true
    rationale: 2.10 m (6 ft 11 in) is the height below which a standing adult with raised forearms is obstructed; raise it where overhead work is declared.
  - key: max_rect_aspect
    default: 3.0
    range: [1.5, 5.0]
    unit: ratio
    user_editable: true
    rationale: Beyond 3:1 the space reads and behaves as a corridor and lateral movement is blocked.
score:
  weight: 10
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: storage.*|seating.*|exercise.*
    transform: {to_zone: room_perimeter, keep: rect_contiguous, order_by: footprintArea_desc}
    cost: free
    effort: medium_physical
    reversible: true
    copy: Push the bulky pieces to the walls. One clear rectangle in the middle is worth more than three half-usable corners.
  - rank: 2
    action: swap_object
    target: exercise.rack.power
    transform: {to: exercise.rack.wall_mounted_folding}
    cost: medium
    effort: high_physical
    reversible: false
    copy: A folding wall rack gives the same lifts back and hands you the floor when you are done.
  - rank: 3
    action: change_opening
    target: door
    transform: {swing: out, or_kind: pocket}
    cost: low
    effort: trades
    reversible: false
    copy: Rehanging the door to swing outward, or swapping it for a sliding door, releases about a square metre of training floor.
  - rank: 4
    action: reassign_room
    target: room
    transform: {suggest_alternative_room: true, rank_by: largestFreeRect}
    cost: free
    effort: none
    reversible: true
    copy: Honestly, another room in your home gives you more clear floor. Want to see the comparison?
conflicts_with: [SAFE-EGR-001, CIR-PATH-002]
supersedes: []
requires_rules: [RM-GYM-001]
tags: [clear_volume, size_band, signature_rule, generation_input]
localization_notes: Metric-first; imperial equivalents appear in copy. Japanese and Hong Kong apartment stock will frequently land in the micro band — do not treat that as failure.
```

#### Why — tradition
No traditional doctrine. There is a loose resonance with the Japanese concept of *ma* — the
inhabited interval, space as the active ingredient rather than the leftover — and the tatami module
(roughly 0.91 x 1.82 m / 3 x 6 ft) is a useful cultural yardstick, since one tatami is almost
exactly one yoga mat. But no classical system prescribes exercise clear floor.

#### Why — psychology / physiology
Two independent mechanisms. Physiologically, movement amplitude is bounded by the smallest
dimension of the available volume; a lunge, a burpee or an overhead press that has to be
shortened to fit the room trains a shorter range and raises the chance of striking something.
Behaviourally, habit-formation research consistently identifies *response cost* — the effort
between intention and first repetition — as a strong predictor of whether a behaviour recurs; a
room where clearing space is a precondition inserts that cost every single session. Preserving a
contiguous rectangle rather than equivalent scattered area matters because the exercise itself is
contiguous. No direct empirical support for the specific dimensions; they are derived from
implement and reach geometry.

#### Customer insight
Every good home gym has one clear rectangle you can step into and move without thinking. We find
the biggest one your room can give, keep the door swing and the walking route out of it, and then
place everything else around its edges.

#### Failure modes / when to skip
In `garage_parking` with a vehicle present, evaluate the rectangle against the *vehicle-out* state
and report both (see RM-GYM-025). In L-shaped rooms the largest rectangle may sit in the short leg
and orphan the long leg — prefer the leg that holds the room's best light and the fewest openings,
and report the orphaned area honestly rather than pretending it is training space. If an
`accessibility.*` turning circle (`ERG-CLR-*`) and the rectangle compete for the same floor, the
turning circle wins.

### RM-GYM-003 — Mat-based floor work: the mat plus arm-span clear zone

```yaml
id: RM-GYM-003
title: Mat-based floor work — the mat plus arm-span clear zone
system: ergonomics.anthropometrics
group: clear_volume
version: 1
status: active
applies_to:
  rooms: [home_gym, yoga_meditation_room, bedroom_primary, bedroom_secondary, living_room, family_room, home_office, guest_suite, basement_finished, attic_finished, loft, open_plan_combined, studio_apartment, workshop_garage]
  objects: [exercise.mat.yoga, exercise.mat.exercise_large, softgoods.rug.low_pile]
  requires_features: []
scope: object_placement
severity: high
confidence: ergonomic
evidence_class: ergonomic
belief_gated: false
predicate: |
  let mat = target
  let user = tallestUser(room)
  # 1. The mat itself must fit, with its long axis on the room's long free axis.
  assert mat.footprint.d >= p.mat_length_m and mat.footprint.w >= p.mat_width_m
  # 2. Supine/prone reach: a lying adult sweeping arms and legs needs a halo around the mat.
  let halo = inflate(bbox(mat), sides={front: p.halo_head_m, back: p.halo_foot_m, left: p.halo_side_m, right: p.halo_side_m})
  assert clearVolume(halo, z_min=0.0, z_max=p.halo_clear_height_m) == true
  # 3. Standing-to-kneeling transitions and inversions need real height over the mat.
  if activityEnabled(yoga_asana):
    assert headroom(centroid(mat)) >= max(p.min_headroom_asana_m, standingReach(user) * p.inversion_reach_factor)
  # 4. Nothing hard, hot, glazed or sharp within the halo.
  forEach f in room.features where f.kind in [radiator, exposed_pipe, low_header, fireplace, column, electrical_outlet]:
    assert overlaps(halo, bbox(f)) == false or distance(centroid(mat), centroid(f)) >= p.hard_edge_standoff_m
  forEach obj in others(*) where obj.materials contains glass or obj.reflective == true:
    assert distance(bbox(mat), bbox(obj)) >= p.glass_standoff_m
  # 5. The mat's long axis should not point at a door that can open into the halo.
  forEach o in room.openings where o.kind in [door, french, bifold] and o.swing != none:
    prefer not alignedWithin(mat.longAxis, o.openingAxis, tol_deg=25)
params:
  - key: mat_length_m
    default: 1.730
    range: [1.520, 2.000]
    unit: m
    user_editable: true
    rationale: Standard yoga mat 173 x 61 cm (68 x 24 in); long mats 183 cm (72 in); tall users should set 1.83-2.00 m.
  - key: mat_width_m
    default: 0.610
    range: [0.560, 0.910]
    unit: m
    user_editable: true
    rationale: Standard 61 cm (24 in); wide mats 66-91 cm (26-36 in) for broader frames and for kneeling work.
  - key: halo_side_m
    default: 0.750
    range: [0.400, 1.200]
    unit: m
    user_editable: true
    rationale: A lying adult's lateral arm sweep extends roughly to half the arm span beyond the mat edge; arm span approximates stature, so 0.75 m suits users to about 1.80 m.
  - key: halo_head_m
    default: 0.600
    range: [0.300, 1.200]
    unit: m
    user_editable: true
    rationale: Overhead arm extension in supine position and space for the crown in inversions and shoulder stands.
  - key: halo_foot_m
    default: 0.450
    range: [0.200, 1.000]
    unit: m
    user_editable: true
    rationale: Leg extension, bridge and plank travel beyond the mat's foot end.
  - key: halo_clear_height_m
    default: 1.20
    range: [0.90, 2.10]
    unit: m
    user_editable: false
    rationale: Floor work rarely exceeds kneeling-with-raised-arms height within the halo band; full standing height is checked separately.
  - key: min_headroom_asana_m
    default: 2.30
    range: [2.00, 3.00]
    unit: m
    user_editable: true
    rationale: Raised-arm standing poses need roughly stature plus 0.5 m; 2.30 m (7 ft 7 in) suits users to about 1.80 m.
  - key: inversion_reach_factor
    default: 1.08
    range: [1.00, 1.25]
    unit: ratio
    user_editable: true
    rationale: Headstand and handstand raise the feet above standing reach; 1.08 x standing reach gives a workable margin. Set 1.00 if inversions are not practised.
  - key: hard_edge_standoff_m
    default: 0.300
    range: [0.150, 0.600]
    unit: m
    user_editable: true
    rationale: Minimum gap from a radiator fin, pipe, hearth edge or outlet plate to the mat halo.
  - key: glass_standoff_m
    default: 0.450
    range: [0.200, 1.000]
    unit: m
    user_editable: true
    rationale: Keeps an outswept limb from reaching glazed doors, mirrors, coffee-table glass and picture frames.
score:
  weight: 9
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: exercise.mat.*
    transform: {to: largestFreeRect(room), align: longAxis_to_rect_longAxis}
    cost: free
    effort: low
    reversible: true
    copy: Lay the mat along the room's long clear stretch so your arms and legs never meet a wall.
  - rank: 2
    action: move_object
    target: tables.coffee.*|tables.side.*|seating.ottoman.*
    transform: {clear_region: halo, to_zone: room_perimeter}
    cost: free
    effort: low
    reversible: true
    copy: Shift the coffee table out of the halo around your mat — that is the space your arms sweep through.
  - rank: 3
    action: add_object
    add: decor.wall_guard.pad
    transform: {position: at hard_edge within halo}
    cost: low
    effort: low
    reversible: true
    copy: If the radiator cannot move, a slim pad over it removes the one hard edge in reach.
  - rank: 4
    action: rotate_object
    target: exercise.mat.*
    transform: {rot_delta: 45, note: diagonal_placement_in_square_rooms}
    cost: free
    effort: none
    reversible: true
    copy: In a tight square room, laying the mat on the diagonal often buys the extra 30 cm you need.
conflicts_with: [ERG-CLR-001]
supersedes: []
requires_rules: [RM-GYM-002]
tags: [mat, yoga, floor_work, clear_volume, arm_span]
localization_notes: Mat sizes are globally standardised; Indian practice often uses a cotton mat or dhurrie of similar footprint. One tatami (0.91 x 1.82 m) is a good local yardstick in Japan.
```

#### Why — tradition
Hatha yoga's own literature specifies the practice surface — a clean, level, firm place, classically
a folded cloth or animal skin on the ground — and both the Hatha Yoga Pradipika and later manuals
insist on an unobstructed, undisturbed spot. What the tradition prescribes is the *quality* and
*stability* of the place, not a dimension. The arm-span halo is a modern ergonomic derivation, not
doctrine, and should be presented that way.

#### Why — physiology
Arm span approximates stature in adults, so the lateral sweep of a supine adult is close to their
own height — which is why a 61 cm mat in a 90 cm gap between a sofa and a wall fails despite the
mat "fitting". Striking a hand or foot on a radiator, hearth or glazed table during a fast floor
sequence is one of the more common home-exercise injuries reported anecdotally by instructors; the
hazard is greatest in prone and supine positions because the limb is moving toward an object the
practitioner cannot see. No direct empirical support for the specific halo values; they are
computed from standard anthropometric reach envelopes.

#### Customer insight
Your mat is 61 cm wide but your arms are not. We keep a clear border all the way around it — about
75 cm at the sides and a bit more past your head — so a stretch or a roll never finds the coffee
table. If the room is tight, the diagonal is your friend.

#### Failure modes / when to skip
Chair-based and seated adaptive practice needs a different envelope — defer to `ERG-CLR-*` for the
chair-transfer zone and skip the supine halo. In a `bedroom_*` workout corner the halo may
legitimately overlap the bed footprint if the bed is the object the limb would strike and it is
soft — allow overlap with `soft: true` objects at half the standoff. Skip the inversion headroom
check unless inversions are declared; it will otherwise fail most basements and attics unnecessarily.

### RM-GYM-004 — Standing free-weight work: the dumbbell clear volume

```yaml
id: RM-GYM-004
title: Standing free-weight work — the dumbbell clear volume
system: ergonomics.anthropometrics
group: clear_volume
version: 1
status: active
applies_to:
  rooms: [home_gym, workshop_garage, garage_parking, basement_finished, basement_unfinished, attic_finished, guest_suite, loft, bedroom_primary, home_office, open_plan_combined]
  objects: [exercise.dumbbell.pair_adjustable, exercise.dumbbell.pair_fixed, exercise.kettlebell.single, exercise.bench.adjustable, exercise.bench.flat]
  requires_features: []
scope: object_placement
severity: high
confidence: ergonomic
evidence_class: ergonomic
belief_gated: false
predicate: |
  let user = tallestUser(room)
  let zone = activityZone(standing_dumbbell)
  # Lateral raises and wide rows: arm span plus an implement at each hand.
  let need_w = p.armspan_factor * user.height_cm/100 + 2 * p.implement_hand_extra_m
  assert zone.w >= need_w
  assert zone.d >= p.dumbbell_depth_m
  # Full standing height plus overhead if pressing is declared (see RM-GYM-005).
  assert clearVolume(zone, z_min=0.0, z_max=p.standing_clear_height_m) == true
  # A bench, if present, must sit inside the zone with its own working border.
  forEach b in room.objects where b.type matches exercise.bench.*:
    assert contains(zone, bbox(b)) or distance(bbox(b), zone) <= 0.05
    assert clearance(b, left) >= p.bench_side_m and clearance(b, right) >= p.bench_side_m
    assert clearance(b, front) >= p.bench_end_m and clearance(b, back) >= p.bench_end_m
    # Lying on a bench, the head end must not be under a hard low feature.
    assert isUnder(headEnd(b), feature=low_header) == false
    assert isUnder(headEnd(b), feature=beam) == false
  # Dumbbells must be stored within one step of the zone, not inside it.
  forEach d in room.objects where d.type matches exercise.dumbbell.*|exercise.kettlebell.*:
    assert overlaps(bbox(d), zone) == false
    assert reachableWithinSteps(centroid(zone), d, max_steps=p.max_steps_to_weights)
params:
  - key: armspan_factor
    default: 1.02
    range: [0.95, 1.10]
    unit: ratio
    user_editable: false
    rationale: Adult arm span is close to stature; 1.02 is a common working approximation across populations.
  - key: implement_hand_extra_m
    default: 0.250
    range: [0.150, 0.450]
    unit: m
    user_editable: true
    rationale: A dumbbell adds roughly 20-25 cm beyond the fist at each end of a lateral raise; a long kettlebell or plate adds more.
  - key: dumbbell_depth_m
    default: 1.500
    range: [1.100, 2.400]
    unit: m
    user_editable: true
    rationale: Front-to-back travel for a lunge step, a hinge with the hips travelling back, and a row.
  - key: standing_clear_height_m
    default: 2.10
    range: [1.95, 2.60]
    unit: m
    user_editable: true
    rationale: Standing plus raised forearm without a press; overhead lockout is checked by RM-GYM-005.
  - key: bench_side_m
    default: 0.700
    range: [0.500, 1.200]
    unit: m
    user_editable: true
    rationale: Room to sit, straddle, place a dumbbell down beside the bench and pass with a weight in hand.
  - key: bench_end_m
    default: 0.600
    range: [0.400, 1.200]
    unit: m
    user_editable: true
    rationale: Head-end space for a spotter's feet or a dumbbell set-down, and foot-end space for step-ups and decline setup.
  - key: max_steps_to_weights
    default: 2
    range: [1, 4]
    unit: count
    user_editable: true
    rationale: Behavioural friction: weights more than two steps away get skipped or left on the floor.
score:
  weight: 8
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: rotate_object
    target: exercise.bench.*
    transform: {align: longAxis_to_room_longAxis}
    cost: free
    effort: low
    reversible: true
    copy: Turn the bench to run with the room's long dimension so you have room at both ends.
  - rank: 2
    action: move_object
    target: exercise.dumbbell.rack|exercise.rack.dumbbell_tree
    transform: {to: adjacent_to zone, side: nearest_wall, keep_out_of: zone}
    cost: free
    effort: medium_physical
    reversible: true
    copy: Put the dumbbell rack against the nearest wall, one step from where you stand. Close enough to grab, far enough not to bark your shin.
  - rank: 3
    action: swap_object
    target: exercise.dumbbell.pair_fixed
    transform: {to: exercise.dumbbell.pair_adjustable}
    cost: high
    effort: low
    reversible: false
    copy: One pair of adjustable dumbbells replaces a whole rack and hands back about half a square metre.
  - rank: 4
    action: swap_object
    target: exercise.bench.flat
    transform: {to: exercise.bench.folding_upright_store}
    cost: medium
    effort: low
    reversible: false
    copy: A folding bench stands against the wall between sessions, which matters a lot in a small room.
conflicts_with: [ERG-CLR-012]
supersedes: []
requires_rules: [RM-GYM-002]
tags: [dumbbell, bench, clear_volume, free_weights]
localization_notes: None. Implement dimensions are globally consistent; only nominal weights differ (kg vs lb plates).
```

#### Why — tradition
No traditional doctrine; this is a functional rule derived from implement geometry and reach
envelopes. Say so to the user rather than dressing it up.

#### Why — physiology
A lateral raise is the widest common gym movement: the hands travel to roughly the span of the
arms, and each dumbbell extends the effective span by a further 20-25 cm. Clipping a wall
mid-repetition causes the trainee to shorten the range or twist, which is precisely the loading
pattern that provokes shoulder complaints. The two-step storage limit is a friction rule: where
returning a weight requires walking, weights stay on the floor, which then compromises the clear
rectangle (RM-GYM-002) and creates a trip hazard (RM-GYM-042). No direct empirical support for the
two-step figure; it is a product heuristic drawn from the same response-cost logic as RM-GYM-002.

#### Customer insight
Stretch your arms out sideways and add a dumbbell in each hand — that is how wide this corner of
the room needs to be, usually about 2.1 m (7 ft). We also leave elbow room at both ends of the
bench, and we park the weights one step away so they end up back on the rack instead of on the floor.

#### Failure modes / when to skip
Skip the arm-span width test where only unilateral work is declared (single-arm rows, suitcase
carries), which halves the requirement. In a `bedroom_primary` corner, a bench that doubles as a
bedroom bench is legitimate — check the bench-side clearance against the bed side clearance owned
by `ERG-CLR-*` and let the bedroom rule win. Where a wall-mounted rack (RM-GYM-007) already defines
the zone, this rule's zone should be inherited rather than located independently.

### RM-GYM-005 — Overhead work and the ceiling-height requirement

```yaml
id: RM-GYM-005
title: Overhead work and the ceiling-height requirement
system: ergonomics.anthropometrics
group: clear_volume
version: 1
status: active
applies_to:
  rooms: [home_gym, workshop_garage, garage_parking, basement_finished, basement_unfinished, attic_finished, loft, guest_suite, yoga_meditation_room, open_plan_combined]
  objects: [exercise.barbell.olympic, exercise.barbell.standard, exercise.dumbbell.pair_adjustable, exercise.kettlebell.single, exercise.medicine_ball, exercise.jump_rope, exercise.pullup_bar.*]
  requires_features: []
scope: object_placement
severity: high
confidence: ergonomic
evidence_class: ergonomic
belief_gated: false
predicate: |
  let user = tallestUser(room)
  let reach = standingReach(user)                       # m, AFF, fingertips
  let zone = activityZone(overhead_press)
  # Lockout height of the implement plus a genuine miss margin.
  let need = lockoutHeight(user, implement=declaredOverheadImplement(room)) + p.overhead_margin_m
  assert headroom(zone) >= need
  # Ceiling obstructions inside the zone are treated as the effective ceiling.
  let obstructions = ceilingObstructionsIn(zone)        # beams, soffits, ducts, lights, sprinklers, fans
  forEach f in obstructions:
    assert (f.pose.z - f.footprint.h) >= need
  # A ceiling fan is disqualifying inside the overhead zone at any height below need + blade dip.
  forEach f in room.features where f.kind == ceiling_fan:
    forbid overlaps(bbox(f), zone)
  # Sloped ceilings: the whole zone must clear, measured at its lowest point.
  if room.ceiling_type == sloped:
    assert minHeadroom(zone) >= need
  # If it cannot clear, the engine must substitute, not silently allow.
  if headroom(zone) < need:
    require substituteActivity(overhead_press, with=p.overhead_substitutes)
params:
  - key: overhead_margin_m
    default: 0.150
    range: [0.080, 0.400]
    unit: m
    user_editable: true
    rationale: Distance between a locked-out implement and the ceiling that still allows a wobble, a press-out and a bail without contact.
  - key: lockout_factor_stature
    default: 1.28
    range: [1.20, 1.36]
    unit: ratio
    user_editable: false
    rationale: Approximate barbell height at overhead lockout as a multiple of stature; 1.80 m user gives about 2.30 m (7 ft 7 in). Verify against the user's measured reach when available.
  - key: jump_add_m
    default: 0.300
    range: [0.150, 0.600]
    unit: m
    user_editable: true
    rationale: Added height for jumping variants — jerks, snatch from a jump, wall-ball throws, jump rope.
  - key: platform_add_m
    default: 0.100
    range: [0.000, 0.200]
    unit: m
    user_editable: true
    rationale: A lifting platform or 50 mm drop pad raises the athlete and must be subtracted from headroom.
  - key: overhead_substitutes
    default: [seated_overhead_press, landmine_press, incline_press, half_kneeling_press]
    range: null
    unit: list
    user_editable: true
    rationale: Where the ceiling genuinely cannot take a standing press, these give a similar training effect within the available height.
  - key: min_habitable_ceiling_m
    default: 2.134
    range: [1.900, 2.400]
    unit: m
    user_editable: false
    jurisdiction_varies: true
    rationale: The IRC family sets a minimum ceiling height for habitable rooms of about 2.13 m (7 ft), with a lower allowance for beam and duct projections and for some basements; the exact figure and the projection allowance vary by jurisdiction and must be confirmed locally. Treat as an informational floor, not as a training adequacy threshold.
score:
  weight: 9
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: move_object
    target: activityZone(overhead_press)
    transform: {to: region with maxHeadroom(room), avoid: [beam, soffit, bulkhead, duct, ceiling_fan, sprinkler_head, light_point]}
    cost: free
    effort: low
    reversible: true
    copy: Move your pressing spot to the highest part of the ceiling and away from the beam — often a metre sideways is all it takes.
  - rank: 2
    action: swap_object
    target: lighting.ceiling.pendant|lighting.ceiling.surface_dome
    transform: {to: lighting.ceiling.recessed_flat}
    cost: low
    effort: trades
    reversible: false
    copy: A flush or recessed light instead of a hanging one gives you back 15-30 cm of pressing height.
  - rank: 3
    action: remove_object
    target: hvac.fan.ceiling
    transform: {relocate_to: outside activityZone(overhead_press)}
    cost: low
    effort: trades
    reversible: false
    copy: A ceiling fan and an overhead press cannot share a spot. Move the fan, or use a floor fan instead — we would rather you kept the press.
  - rank: 4
    action: substitute_activity
    target: overhead_press
    transform: {to: p.overhead_substitutes}
    cost: free
    effort: none
    reversible: true
    copy: Your ceiling is too low for a standing press. Seated and half-kneeling presses, or a landmine press, give you the same shoulders without the drywall repair.
conflicts_with: []
supersedes: []
requires_rules: [RM-GYM-001]
tags: [ceiling_height, overhead, press, headroom, signature_rule]
localization_notes: Minimum habitable ceiling heights differ materially (IRC ~2.13 m; many European codes 2.40-2.50 m for new habitable rooms; older UK and Japanese stock frequently lower). Always present the user's measured height, never a code figure, as the governing number.
```

#### Why — tradition
No traditional doctrine. Vastu and feng shui both prefer generous ceilings for vigorous or
"yang" activity, and low beams over an occupant's head are a well-known feng shui concern
(see `FS-ROOM-*` and the beam rules), but neither tradition derives a number from implement
lockout. The number here is anthropometric.

#### Why — physiology
Overhead lockout height is a simple function of standing reach: roughly 1.28 times stature puts the
bar at the ceiling for a 1.80 m lifter in a 2.30 m room, which is why standard 2.40 m (8 ft) rooms
are marginal and 2.13 m (7 ft) basements are not viable for a standing press. The failure is not
merely cosmetic — a lifter who anticipates ceiling contact truncates the lockout, shifts load
forward, and loses the overhead position that makes the lift safe. Jump variants and a raised
platform both eat the margin, which is why they are separate additive parameters. No direct
empirical support for the 0.15 m margin; it is a practitioner-consensus figure.

#### Customer insight
Reach straight up. Add about 15 cm. That is the ceiling height a standing overhead press needs —
commonly 2.3 m (7 ft 7 in) for a 1.8 m person, and more if you jump or stand on a platform. If your
ceiling cannot do it, we will swap in seated and kneeling presses rather than let you punch a light
fitting.

#### Failure modes / when to skip
Skip entirely if no overhead activity is declared. In sloped-ceiling attics the rule must be
evaluated at the zone's lowest point, not the ridge — otherwise it passes and the user hits the
rafter. Do not use the code minimum ceiling height as a pass threshold; a room can be perfectly
legal and completely unsuitable for pressing, and the app must say so. Where a garage has an
open-truss or exposed-joist ceiling, measure to the underside of the lowest member, including the
sectional door track and any open door panel (RM-GYM-025).

### RM-GYM-006 — Barbell lane: bar length, loading space and the bail-out zone

```yaml
id: RM-GYM-006
title: Barbell lane — bar length, loading space and the bail-out zone
system: ergonomics.task_zones
group: clear_volume
version: 1
status: active
applies_to:
  rooms: [home_gym, workshop_garage, garage_parking, basement_finished, basement_unfinished, guest_suite, loft]
  objects: [exercise.barbell.olympic, exercise.barbell.standard, exercise.plate.bumper, exercise.plate.iron, exercise.platform.lifting]
  requires_features: []
  min_room_area_m2: 9.0
scope: object_placement
severity: high
confidence: expert_consensus
evidence_class: ergonomic
belief_gated: false
predicate: |
  let bar = target
  let L = p.bar_length_m[bar.variant_id] ?? p.bar_length_m.default
  # 1. Lateral: bar length plus end clearance so sleeves never touch a wall or a rack upright.
  assert laneWidth(bar) >= L + 2 * p.bar_end_clearance_m
  # 2. Loading: you must be able to stand beside each sleeve and slide a plate on.
  assert clearance(bar, left) >= p.plate_loading_m and clearance(bar, right) >= p.plate_loading_m
  # 3. Longitudinal: the lifter's stance, walk-out and hinge travel.
  assert laneDepth(bar) >= p.lane_depth_m
  # 4. Bail-out: a failed squat or press is dumped forward or backward; that floor must be empty.
  let bail = bailZone(bar, direction=p.bail_direction, depth=p.bail_depth_m, width=L + 2*p.bar_end_clearance_m)
  assert clearVolume(bail, z_min=0.0, z_max=p.bail_clear_height_m) == true
  forbid exists obj in room.objects where overlaps(bbox(obj), bail) and obj.type not matches exercise.flooring.*|exercise.platform.*
  forbid exists f in room.features where f.kind in [radiator, exposed_pipe, plumbing_stack, panel, water_heater, sump] and overlaps(bail, bbox(f))
  forbid exists o in room.openings where o.kind in [window, french, sliding] and distance(bail, o) < p.glazing_standoff_m
  # 5. Mirrors and glass are never inside the lane or the bail zone.
  forEach m in room.objects where m.reflective == true:
    assert overlaps(bbox(m), union(lane(bar), bail)) == false
    assert distance(bbox(m), lane(bar)) >= p.mirror_standoff_m
  # 6. Plate storage flanks the lane, within reach, outside it.
  forEach pl in room.objects where pl.type matches exercise.plate.*:
    assert overlaps(bbox(pl), union(lane(bar), bail)) == false
    assert distance(bbox(pl), centroid(lane(bar))) <= p.plate_reach_m
params:
  - key: bar_length_m
    default: {default: 2.200, olympic_mens: 2.200, olympic_womens: 2.010, powerlifting: 2.200, short_olympic: 1.700, standard_1inch: 1.520, safety_squat: 2.200, trap_bar: 1.400}
    range: [1.200, 2.400]
    unit: m
    user_editable: true
    rationale: A men's Olympic bar is 2.20 m (7 ft 2.5 in), a women's bar 2.01 m (6 ft 7 in); short bars exist for small rooms.
  - key: bar_end_clearance_m
    default: 0.300
    range: [0.150, 0.600]
    unit: m
    user_editable: true
    rationale: Prevents sleeve-to-wall contact on rack-in, rack-out and a drifting bar path. 0.30 m (12 in) each side means a men's bar needs a 2.80 m (9 ft 2 in) lane.
  - key: plate_loading_m
    default: 0.650
    range: [0.450, 1.000]
    unit: m
    user_editable: true
    rationale: Standing sideways with a 450 mm (17.7 in) bumper plate held at the hip and sliding it onto the sleeve.
  - key: lane_depth_m
    default: 2.400
    range: [1.800, 3.600]
    unit: m
    user_editable: true
    rationale: Stance plus a two-step walk-out plus a deadlift hinge with the hips travelling back.
  - key: bail_direction
    default: both
    range: [forward, backward, both]
    unit: enum
    user_editable: true
    rationale: A failed squat is usually dumped backward off the shoulders; a failed press goes forward. Default reserves both.
  - key: bail_depth_m
    default: 1.200
    range: [0.800, 2.000]
    unit: m
    user_editable: true
    rationale: A dumped loaded bar rolls; 1.2 m (4 ft) of empty floor absorbs the roll before it reaches anything.
  - key: bail_clear_height_m
    default: 1.00
    range: [0.60, 2.10]
    unit: m
    user_editable: false
    rationale: The bail zone is a floor-level volume; head height is governed by RM-GYM-005.
  - key: mirror_standoff_m
    default: 0.900
    range: [0.450, 2.000]
    unit: m
    user_editable: true
    rationale: A dropped or dumped bar sends plates sideways; 0.9 m (3 ft) keeps glass out of range. See RM-GYM-027.
  - key: glazing_standoff_m
    default: 1.000
    range: [0.500, 2.500]
    unit: m
    user_editable: true
    rationale: Windows, patio doors and sidelites inside a bail zone are a serious laceration risk.
  - key: plate_reach_m
    default: 1.800
    range: [1.000, 3.000]
    unit: m
    user_editable: true
    rationale: Plates should be reachable from beside the bar without crossing the lane.
score:
  weight: 9
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: rotate_object
    target: exercise.rack.power|exercise.barbell.*
    transform: {align: lane_to_room_longAxis, recompute: bailZone}
    cost: free
    effort: high_physical
    reversible: true
    copy: Turn the lifting lane to run the long way down the room. A 2.2 m bar needs a 2.8 m clear span end to end.
  - rank: 2
    action: swap_object
    target: exercise.barbell.olympic
    transform: {to: exercise.barbell.short_olympic, or: exercise.barbell.trap_bar}
    cost: medium
    effort: low
    reversible: false
    copy: A 1.7 m short bar or a trap bar fits rooms a full-length bar cannot, and still lets you squat, press and pull.
  - rank: 3
    action: move_object
    target: exercise.plate.*|storage.shelving.open_unit|decor.mirror.*
    transform: {clear_region: bailZone, to_zone: lane_flank}
    cost: free
    effort: medium_physical
    reversible: true
    copy: Clear the floor behind you. If a squat goes wrong the bar gets dumped there, and you want nothing in its way.
  - rank: 4
    action: add_object
    add: exercise.rack.safety_arms
    transform: {position: inside exercise.rack.power, height: below_sticking_point}
    cost: low
    effort: low
    reversible: true
    copy: Spotter arms let the rack catch a failed lift so the floor behind you matters less. See the solo-lifting rule.
  - rank: 5
    action: substitute_activity
    target: barbell_squat
    transform: {to: [goblet_squat, split_squat_dumbbell, belt_squat, landmine_squat]}
    cost: free
    effort: none
    reversible: true
    copy: This room genuinely cannot hold a barbell lane. Loaded dumbbell and landmine variations get you most of the way.
conflicts_with: [SAFE-EGR-001]
supersedes: []
requires_rules: [RM-GYM-002, RM-GYM-005]
tags: [barbell, squat, deadlift, bail_out, clear_volume, signature_rule]
localization_notes: Bar and plate dimensions are IWF/IPF-standardised worldwide. Plate weights differ (kg vs lb) but diameters do not for competition bumpers (450 mm).
```

#### Why — tradition
No traditional doctrine. Barbell geometry is standardised equipment dimension; the bail-out zone is
a coaching-practice safety convention from competitive weightlifting and powerlifting platforms,
where a defined empty platform surrounds the lifter for exactly this reason.

#### Why — physiology
A loaded barbell is a 2.2 m rigid object weighing 20 kg empty and commonly 60-150 kg loaded, moved
by a person whose position is unstable at the two moments of highest risk: the walk-out and the
failure. Failure is not rare or exotic; every trainee who progresses will occasionally miss a lift,
and the disposal of a missed lift is a rehearsed reflex — dump it and step away. If the disposal
floor is occupied, the reflex becomes an injury or a broken object. The lateral clearance rule has a
simpler mechanism: sleeve-to-wall contact at the start of a lift destabilises the bar path and
produces asymmetric loading.

#### Customer insight
A standard bar is 2.2 m (7 ft 2 in) long, so the lifting lane needs roughly 2.8 m (9 ft 2 in) of
clear wall-to-wall width, space at each end to slide plates on, and — the bit most people forget —
empty floor behind you for the day a lift does not go up. We keep glass, windows and shelving well
out of that zone.

#### Failure modes / when to skip
If a full power rack with spotter arms is fitted and correctly set (RM-GYM-040), the rear bail zone
may be reduced to `p.bail_depth_m * 0.5` because the rack, not the floor, catches the bar. Do not
reduce it for a half rack without rear supports. Skip the rule entirely in rooms where no barbell is
declared; do not silently downgrade it to advisory when the room is small — the correct answer for a
small room is a substituted activity, not a compromised lane. Where the bail zone must overlap the
door's egress path, `SAFE-EGR-*` wins and the lane must rotate.
