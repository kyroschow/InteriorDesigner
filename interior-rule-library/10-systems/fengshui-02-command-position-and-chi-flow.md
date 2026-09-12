# Feng Shui — Command Position & Chi Circulation
<!-- library-file: v1 | system(s): feng_shui.form_school, feng_shui.btb_western, feng_shui.yin_yang, psych.prospect_refuge, circulation.space_syntax, safety.fire, product.ux | rule-id-prefixes: FS-CMD, FS-CHI, FS-DOOR, FS-STAIR | author-agent: fengshui-02 -->

## Scope

This file owns the two signature mechanics of the product: **command position** (where a body
sits, sleeps, cooks or works relative to the way in) and **chi circulation** (how movement,
sightline and air run through a plan, where they race, and where they stall).

In scope:
- The commanding-position doctrine and its exact geometry for bed, desk/office chair,
  cooktop, sofa, armchair, dining seat and toilet — door-line avoidance, diagonal-most
  placement, sightline to the entry, solid support behind, and the overhead conditions
  (beam, soffit, sloped ceiling, overhead storage, stair run above) that void it.
- Bed-specific afflictions: coffin/feet-out-the-door, bed under or against a window,
  mirror facing the bed, headboard sharing a wall with a toilet or a cooktop, headboard
  floating off the wall.
- The front door as *qì kǒu* (气口, "mouth of qi"), the entry buffer, and door pathology:
  front-to-back alignment (*chuān táng shà*, 穿堂煞), three-or-more collinear openings,
  clashing swings, a door onto a near blank wall, a door onto a toilet or a mirror,
  misaligned opposed doors, a secondary entry out-competing the main one.
- Chi rushing (*shā qì*, 煞氣) along long straight runs and the meander remedies; chi
  stagnation in dead corners, behind door leaves, in unused rooms and in cluttered
  transitions; the central palace (中宫 *zhōng gōng*) kept open; columns and protruding
  corners; low headers; open-plan homes with no thresholds; split-levels.
- Staircases: facing the front door, in the centre, on the splitting axis, landing onto a
  toilet/bedroom/kitchen door, open-riser, spiral, and under-stair use.
- The studio apartment where one room does everything, and the explicit resolution when
  command position conflicts with egress or another safety rule.

Out of scope (owned elsewhere, see `## CROSS_REFERENCES`): compass/bagua sector assignment,
Eight Mansions personal directions, Flying Stars, five-element colour and material mapping,
site and exterior form, clutter psychology as a standalone system, bathroom and kitchen
room-level rules, and every `blocking` safety rule. Where a rule here touches those, it
defers.

**Schools.** This file is explicit about lineage, because the schools genuinely disagree.
*Form school* (形勢派 *xíngshì pài*, landform) supplies the support-and-outlook logic via the
Four Symbols of Chinese cosmology — Black Turtle 玄武 behind, Azure Dragon 青龍 on the left,
White Tiger 白虎 on the right, Vermilion Bird 朱雀 in front — read as an "armchair" around an
occupied spot. *BTB / Black Sect Tantric Buddhism* (introduced to the United States in the
late 1970s by Grandmaster Professor Thomas Lin Yun) supplies the front-door-anchored reading
and most of the English-language "commanding position" teaching now common in the West.
The English term **"commanding position" is not a classical Chinese term**; it is a
20th-century Western/BTB label for a simplification of form-school support logic. Classical
compass practitioners generally rank *personal direction* (Eight Mansions, Flying Stars)
above the door-sightline geometry that BTB foregrounds. Every rule below names which side
it is on, and the engine must never present the Western framing as the classical one.

## Rule count: 65

## Rules

### FS-CMD-001 — The armchair support formation for any occupied position

```yaml
id: FS-CMD-001
title: Armchair (Four Symbols) support formation for any primary occupied position
system: feng_shui.form_school
group: command_position
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, bedroom_guest, bedroom_child, bedroom_teen,
          living_room, family_room, great_room, home_office, home_office_shared, study_library,
          formal_dining, eat_in_kitchen, kitchen, studio_apartment, open_plan_combined, loft,
          dorm_room, media_room]
  objects: [sleep.bed.*, seating.sofa.*, seating.armchair.*, seating.desk_chair.*,
            seating.dining_chair.*, worksurface.desk.*, kitchen.range.*, kitchen.cooktop.*]
  requires_features: []
  min_room_area_m2: 4.5
scope: object_placement
severity: high
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  # Parent doctrine. Scores the four "animals" around one occupied position.
  let obj  = target
  let eye  = obj.occupantEyePoint          # seated/reclined eye anchor
  let door = room.primaryDoor

  # 玄武 Black Turtle — solid mass behind
  let back_support = backsToWall(obj, min_contact_pct=p.back_contact_pct)
                     or exists(others(storage.*)) where isBehind(o, obj)
                        and o.footprint.h >= p.surrogate_back_height_m
                        and distance(o, obj) <= p.surrogate_back_gap_m
  assert back_support == true

  # 朱雀 Vermilion Bird — open outlook in front
  assert isovistArea(eye) >= p.min_front_isovist_m2
  assert clearance(obj, front) >= p.min_front_clearance_m

  # 青龍 / 白虎 Dragon & Tiger — flanking mass both sides
  let L = flankMassHeight(obj, left)
  let R = flankMassHeight(obj, right)
  prefer L > 0 and R > 0
  prefer L >= R                            # dragon side equal or taller
  penalize(abs(L - R) > p.flank_asymmetry_tol_m, weight=2)
params:
  - key: back_contact_pct
    default: 70
    range: [30, 100]
    unit: pct
    user_editable: true
    rationale: Share of the object's back edge that must touch a wall to count as supported.
  - key: surrogate_back_height_m
    default: 1.100
    range: [0.700, 2.400]
    unit: m
    user_editable: true
    rationale: Height at which a case good behind a seated occupant reads as a wall substitute.
  - key: surrogate_back_gap_m
    default: 0.300
    range: [0.000, 0.900]
    unit: m
    user_editable: true
    rationale: Maximum gap before a surrogate stops reading as attached support.
  - key: min_front_isovist_m2
    default: 6.0
    range: [2.0, 40.0]
    unit: m2
    user_editable: true
    rationale: Visible floor area ahead that satisfies the open-outlook condition.
  - key: min_front_clearance_m
    default: 0.900
    range: [0.450, 3.000]
    unit: m
    user_editable: true
    rationale: Breathing room ahead of the position; below this the outlook is symbolically blocked.
  - key: flank_asymmetry_tol_m
    default: 0.400
    range: [0.000, 1.500]
    unit: m
    user_editable: true
    rationale: Permitted height difference between left and right flanking mass.
score:
  weight: 9
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: self
    transform: {to_zone: commanding_zone, keep: backsToWall(min_contact_pct=70)}
    cost: free
    effort: high_physical
    reversible: true
    copy: Slide this piece back against a solid wall so there is mass behind you and open floor in front.
  - rank: 2
    action: add_object
    add: storage.console.low
    transform: {position: behind_object, gap_m: 0.150, min_height_m: 1.100}
    cost: medium
    effort: low
    reversible: true
    copy: If the piece has to float, put a tall console or bookcase directly behind it to stand in for the wall.
  - rank: 3
    action: add_object
    add: softgoods.screen.folding
    transform: {position: behind_object, min_height_m: 1.500}
    cost: low
    effort: low
    reversible: true
    copy: A folding screen behind the seat is the cheapest way to close the open back.
  - rank: 4
    action: add_object
    add: plants.tree.potted_large
    transform: {position: flank_deficient_side}
    cost: low
    effort: low
    reversible: true
    copy: Add height on whichever side feels empty — a tall plant or floor lamp balances the two flanks.
conflicts_with: [SAFE-EGR-003, ERG-CLR-012]
supersedes: []
requires_rules: []
tags: [command_position, four_symbols, prospect_refuge, signature_rule, parent_doctrine]
localization_notes: >
  Left and right are read from the occupant looking outward, not from an observer facing the
  piece. This rule is hemisphere-invariant; feng shui directional logic never flips with
  hemisphere (see FS-COMPASS-000). Do not translate "dragon side" into product copy.
```

#### Why — tradition
Landform feng shui (形勢派 *xíngshì pài*) reads an auspicious site as an armchair: the Black
Turtle 玄武 as rising ground behind, the Azure Dragon 青龍 and White Tiger 白虎 as lower ridges
left and right, and the Vermilion Bird 朱雀 as open, bright foreground. The Four Symbols are
guardians of the four directions in Chinese cosmology, borrowed by geomancers as a shape
grammar for terrain and then, by extension, for rooms and furniture. Classical practice
applies this to the *building on its land* first and to furniture second; the furniture-scale
reading is where form school and the Western "commanding position" teaching overlap most
cleanly. The dragon side is conventionally held equal to or slightly higher than the tiger
side, a refinement most Western sources drop.

#### Why — psychology / physiology
This maps closely onto prospect–refuge theory (Jay Appleton, *The Experience of Landscape*,
1975), which predicts preference for positions at the interface of an open prospect and a
protected refuge — mass at your back, visual command ahead. The "open outlook" term is
computable as an isovist, the set of points visible from a vantage (Michael Benedikt, "To
Take Hold of Space: Isovists and Isovist Fields", *Environment and Planning B*, 6(1), 1979).
There is real evidence that enclosure at the back matters for comfort in workplaces: Kim and
de Dear found enclosed private offices outperformed open-plan layouts on most indoor
environmental quality dimensions, with privacy and proxemics penalties outweighing the
interaction benefit (*Journal of Environmental Psychology*, 36, 2013, 18–26). What is *not*
established is the flanking-symmetry refinement or any outcome beyond comfort and
preference. Treat the back-support and outlook halves as evidence-supported comfort
heuristics and the dragon/tiger balance as tradition.

#### Customer insight
The most comfortable seat in any room has something solid behind it and open space in front —
that is why you instinctively take the booth, not the stool in the middle of the floor. Feng
shui calls this the armchair shape and asks for a little height on both sides too. Get those
three things and the piece will simply feel better to sit in.

#### Failure modes / when to skip
Skip in rooms under 4.5 m² (48 ft²), where every position touches a wall and the rule is
trivially satisfied. Skip for deliberately floated conversation groups in large rooms where a
sofa table already provides back mass — the surrogate branch should catch this, but verify
before flagging. Do not fire on built-in banquettes, window seats designed as window seats,
or on a bed a wheelchair user needs three-sided access to. Never let the flank-balance
penalty push a piece into a circulation path; FS-CMD-026 and the ergonomics clearance
minimums win.

---

### FS-CMD-002 — Bed in the commanding position

```yaml
id: FS-CMD-002
title: Bed in the commanding position
system: feng_shui.btb_western
group: command_position
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, bedroom_guest, bedroom_child, bedroom_teen,
          ensuite, guest_suite, studio_apartment, dorm_room, adu_in_law_suite, loft]
  objects: [sleep.bed.*, sleep.daybed.*, sleep.sofa_bed.*]
  requires_features: []
  min_room_area_m2: 6.0
scope: object_placement
severity: high
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let bed  = target
  let door = room.primaryDoor
  let eye  = bed.headboardSeatedEye         # eye point of an occupant sitting up in bed

  # (a) not standing in the door's line of fire
  assert not alignedWithin(bed.centerAxis, door.openingAxis, tol_deg=p.door_axis_tol_deg)

  # (b) the entry is visible from the pillow, directly or by a placed mirror
  assert lineOfSight(eye, door.centroid) == true
       or lineOfSightViaReflection(eye, door.centroid) != null

  # (c) far from the door, and in the diagonal-most supported candidate band
  assert distance(bed.centroid, door.centroid) >= p.min_door_distance_m
  let cands = candidatePositions(bed, room) where backsToWall(bed, p.back_contact_pct)
  prefer inTopQuantileByDistance(bed, cands, door.centroid, q=p.diagonal_quantile)

  # (d) support behind the head
  assert backsToWall(bed, min_contact_pct=p.back_contact_pct)
params:
  - key: door_axis_tol_deg
    default: 15
    range: [0, 45]
    unit: deg
    user_editable: true
    rationale: Angular tolerance before the bed counts as sitting in the doorway's axis.
  - key: min_door_distance_m
    default: 1.500
    range: [0.800, 4.000]
    unit: m
    user_editable: true
    rationale: Distance at which someone sitting up has time to register an entrant before they arrive.
  - key: back_contact_pct
    default: 80
    range: [40, 100]
    unit: pct
    user_editable: true
    rationale: Share of the headboard width that must contact a wall.
  - key: diagonal_quantile
    default: 0.70
    range: [0.30, 1.00]
    unit: ratio
    user_editable: true
    rationale: How strictly "diagonal-most" is enforced; 1.0 accepts only the single farthest supported spot.
  - key: allow_mirror_surrogate
    default: true
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: Whether a placed mirror may satisfy the sightline condition when the bed cannot move.
score:
  weight: 10
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: sleep.bed.*
    transform: {to_zone: diagonal_from_door, keep: headboard_against_solid_wall}
    cost: free
    effort: high_physical
    reversible: true
    copy: Move the bed so the headboard sits against the solid wall diagonally across from the door.
  - rank: 2
    action: rotate_object
    target: sleep.bed.*
    transform: {rot_delta_deg: 90, keep: backsToWall(min_contact_pct=80)}
    cost: free
    effort: high_physical
    reversible: true
    copy: Turning the bed a quarter turn onto the adjacent wall often fixes the door line without losing the headboard wall.
  - rank: 3
    action: add_object
    add: decor.mirror.wall
    transform: {position: so_that lineOfSightViaReflection(bed.headboardSeatedEye, door.centroid) != null,
                forbid: mirrorFacesObject(self, bed)}
    cost: low
    effort: low
    reversible: true
    copy: If the bed truly cannot move, hang a mirror where it shows you the doorway from the pillow — but never one that faces the bed head-on.
  - rank: 4
    action: add_object
    add: decor.mirror.standing_small
    transform: {position: nightstand_top, aim: door.centroid}
    cost: low
    effort: low
    reversible: true
    copy: A small angled mirror on the nightstand does the same job in a rental where you cannot drill.
conflicts_with: [SAFE-EGR-003, SAFE-EGR-007, ERG-CLR-012, ACC-BED-004]
supersedes: []
requires_rules: [FS-CMD-001]
tags: [bed, sleep, security, sightline, signature_rule, btb]
localization_notes: >
  Hemisphere-invariant. This is the BTB/Western formulation; classical compass practitioners
  would first set the sleeping direction from the occupant's Eight Mansions kua or the
  Flying Star chart and only then optimise the door geometry — see FS-BAZ-* and FS-STAR-*.
```

#### Why — tradition
"Commanding position" is a Western English label popularised by BTB-lineage teaching from the
late 1970s onward; it does not appear under that name in the classical Chinese canon. What it
compresses is form-school support logic (FS-CMD-001) plus BTB's habit of reading a room from
its door rather than from a compass. The operative test in BTB practice is: from the pillow
you can see whoever comes in, you are not lying in the door's straight line, and your head
has a wall behind it. Classical San He and San Yuan practitioners often regard this as a
useful but secondary consideration, ranking the sleeper's personal auspicious direction or
the annual star chart above it — an honest disagreement the app should surface rather than
paper over.

#### Why — psychology / physiology
The mechanism here is the best-supported in the whole feng shui corpus. Sleep in an
unfamiliar or poorly monitored environment recruits residual vigilance: Tamaki, Bang,
Watanabe and Sasaki showed that during first-night sleep one hemisphere's default-mode
network stays comparatively more vigilant, acting as a "night watch" that wakes the sleeper
to deviant sounds (*Current Biology*, 26(9), 2016, 1190–1194). A position that lets you
resolve the entry visually on waking removes the need to sit up, orient and check —
Sokolov's orienting reflex is cheap when the answer is already in view and expensive when it
is not. Prospect–refuge (Appleton, 1975) predicts the same preference. What is *not*
demonstrated is that the geometry improves sleep architecture for a habituated sleeper in
their own bedroom; the effect is most plausible for light sleepers, hypervigilant sleepers,
shared housing, and the first weeks in a new home.

#### Customer insight
From your pillow you should be able to see the bedroom door without lifting your head — but
not be lying straight in line with it. Think of the diagonal corner furthest from the door,
headboard flat against the wall. People consistently sleep better when they are not
half-listening for the doorway, and this is the single change most likely to make the room
feel calm.

#### Failure modes / when to skip
In rooms below about 6 m² (65 ft²), or where the only wall long enough for the bed faces the
door, the geometry is unobtainable — drop to the mirror remedy and say so. Do not fire when
the bed placement is fixed by a medical need (hospital bed, hoist, oxygen line), by an
accessible-transfer side, or by the only outlet for a CPAP. An egress or emergency-escape
requirement always wins: if the commanding spot blocks the escape window or the door's clear
path, FS-CMD-024 governs and the engine must tell the user that safety overrode the
tradition. In a studio, FS-CMD-023 replaces this rule.

---

### FS-CMD-003 — Coffin position: feet pointing straight out the door

```yaml
id: FS-CMD-003
title: Coffin position — feet pointing straight out of the bedroom door
system: feng_shui.form_school
group: command_position
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, bedroom_guest, bedroom_child, bedroom_teen,
          ensuite, guest_suite, studio_apartment, dorm_room, nursery, bedroom_shared_siblings]
  objects: [sleep.bed.*, sleep.daybed.*, sleep.crib.*]
  requires_features: []
  min_room_area_m2: 5.0
scope: object_placement
severity: high
confidence: tradition
evidence_class: traditional
belief_gated: true
predicate: |
  let bed  = target
  forEach d in room.openings where d.kind in [door, doorway, arch, pocket, sliding]
    let feetToDoor = alignedWithin(bed.footAxis, d.openingAxis, tol_deg=p.axis_tol_deg)
    let facingOut  = angleBetween(bed.footVector, d.inwardNormal) >= p.facing_out_min_deg
    forbid feetToDoor and facingOut
          and distance(bed.footCenter, d.centroid) <= p.max_affected_distance_m
          and (d.leads_to_room_id != null or d.leads_to == exterior)
params:
  - key: axis_tol_deg
    default: 12
    range: [0, 40]
    unit: deg
    user_editable: true
    rationale: How closely the foot-to-door line must align before the position is called coffin.
  - key: facing_out_min_deg
    default: 150
    range: [90, 180]
    unit: deg
    user_editable: true
    rationale: Angle between the bed's foot vector and the door's inward normal; 180 is dead-on out the door.
  - key: max_affected_distance_m
    default: 6.000
    range: [1.500, 15.000]
    unit: m
    user_editable: true
    rationale: Beyond this distance the alignment is treated as visually irrelevant.
  - key: include_ensuite_and_closet_doors
    default: true
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: Whether internal ensuite and closet doors count, or only the room's entry door.
score:
  weight: 8
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: move_object
    target: sleep.bed.*
    transform: {offset: perpendicular_to_door_axis, min_offset_m: 0.600}
    cost: free
    effort: high_physical
    reversible: true
    copy: Shift the bed sideways so your feet are no longer pointing straight out of the doorway.
  - rank: 2
    action: rotate_object
    target: sleep.bed.*
    transform: {rot_delta_deg: 90, keep: backsToWall(min_contact_pct=80)}
    cost: free
    effort: high_physical
    reversible: true
    copy: Turn the bed onto the side wall — a quarter turn usually clears the door line entirely.
  - rank: 3
    action: add_object
    add: storage.bench.end_of_bed
    transform: {position: foot_of_bed, min_height_m: 0.500}
    cost: medium
    effort: low
    reversible: true
    copy: If the bed cannot move, a solid bench or blanket chest at the foot puts something between you and the door.
  - rank: 4
    action: add_object
    add: softgoods.screen.folding
    transform: {position: between(bed.footCenter, door.centroid), min_height_m: 1.500}
    cost: low
    effort: low
    reversible: true
    copy: A screen or a tall plant between the foot of the bed and the door breaks the line.
conflicts_with: [SAFE-EGR-003, ERG-CLR-012]
supersedes: []
requires_rules: [FS-CMD-002]
tags: [bed, coffin_position, death_position, taboo, cultural_symbolism]
localization_notes: >
  The taboo derives from Han Chinese funeral custom and is strongest for users of Chinese,
  Taiwanese, Hong Kong, Singaporean, Malaysian-Chinese and Vietnamese background. Consider
  suppressing the "coffin"/"death" wording in product copy for users who have not opted into
  feng shui, and never use the word "death" in a nursery context.
```

#### Why — tradition
Called the coffin or death position in English-language feng shui, and avoided across Chinese
folk practice because the deceased were traditionally carried out of the home feet first — so
lying with your feet aimed out the doorway rehearses the funeral posture. This is cultural
symbolism and death-avoidance etiquette rather than a *qi* mechanic; form-school writers
usually fold it into the door-line argument, and BTB teachers treat it as a strong prohibition
in its own right. The same avoidance shows up independently in Japanese practice (*kita-makura*
taboos) and in several South and Southeast Asian traditions, which is why it survives
translation so well. Classical compass schools have no doctrine that specifically forbids it.

#### Why — psychology / physiology
No direct empirical support; mechanism is plausible but untested. Two plausible strands: the
foot-to-door axis is also the room's main movement and light channel, so a bed there sits in
the path of corridor light, door sound and passing traffic — a real sleep-quality nuisance
independent of symbolism; and for users who hold the belief, the symbolic reading itself is a
nightly intrusive-thought cue, which is a genuine mechanism even though the geometry is not.
The app should be careful to present the first strand as the physical reason and the second as
belief, and never to imply a health outcome.

#### Customer insight
In many Chinese households a bed is never placed with the feet pointing straight out of the
door, because that is the way a body is carried from a home. Practically, you are also lying
in the room's main path for light, sound and foot traffic. Nudging the bed sideways by half a
metre usually solves both.

#### Failure modes / when to skip
Skip in rooms where no other bed position exists — a narrow box room, a bed alcove, a dorm
room with a fixed frame. Skip for cribs where the safest position (away from windows, blind
cords and radiators) conflicts; child safety wins. Suppress entirely if the user has feng shui
enabled but has flagged that death imagery is distressing, and in hospice or palliative
contexts. Do not fire on a daybed used as seating during the day and only occasionally slept in
unless the user marks it as a primary bed.

---

### FS-CMD-004 — Headboard in full contact with a solid wall

```yaml
id: FS-CMD-004
title: Headboard in full contact with a solid wall
system: feng_shui.form_school
group: command_position
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, bedroom_guest, bedroom_child, bedroom_teen,
          ensuite, guest_suite, studio_apartment, dorm_room, nursery, loft]
  objects: [sleep.bed.*, sleep.daybed.*]
  requires_features: []
  min_room_area_m2: 5.0
scope: object_placement
severity: high
confidence: mixed
evidence_class: mixed
belief_gated: true
predicate: |
  let bed = target
  let w   = nearestWallBehind(bed)
  assert w != null
  assert backsToWall(bed, min_contact_pct=p.contact_pct)
  assert distanceToWall(bed, w) <= p.max_gap_m
  assert wallSegmentSolid(w, bed.backSpanStart, bed.backSpanEnd) == true
  prefer bed.hasHeadboard == true
  prefer bed.headboardHeightAboveMattress_m >= p.min_headboard_height_m
  penalize(isFloating(bed), weight=4)
params:
  - key: contact_pct
    default: 80
    range: [40, 100]
    unit: pct
    user_editable: true
    rationale: Share of headboard width that must sit against the wall.
  - key: max_gap_m
    default: 0.050
    range: [0.000, 0.300]
    unit: m
    user_editable: true
    rationale: Gap above which the head is read as unsupported; also the gap where bedding and objects fall.
  - key: min_headboard_height_m
    default: 0.350
    range: [0.150, 1.200]
    unit: m
    user_editable: true
    rationale: Headboard height above the mattress that reads as a mountain behind the sleeper.
  - key: require_solid_segment
    default: true
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: Turn off to allow a headboard to span a window or door reveal when nothing else fits.
score:
  weight: 8
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: sleep.bed.*
    transform: {snap_to_wall: nearestWallBehind, gap_m: 0.020}
    cost: free
    effort: medium_physical
    reversible: true
    copy: Push the bed back until the headboard actually touches the wall — a few centimetres of gap is enough to undo the effect.
  - rank: 2
    action: add_object
    add: sleep.headboard.upholstered
    transform: {position: bed.backEdge, min_height_m: 0.500}
    cost: medium
    effort: low
    reversible: true
    copy: Add a tall upholstered headboard so there is a defined mass behind your head.
  - rank: 3
    action: add_object
    add: softgoods.wall_hanging.textile
    transform: {position: wall_behind_bed, min_height_m: 1.000}
    cost: low
    effort: low
    reversible: true
    copy: In a rental, a heavy textile hung on the wall behind the bed gives the same sense of backing.
conflicts_with: [SAFE-SEIS-006]
supersedes: []
requires_rules: [FS-CMD-001]
tags: [bed, headboard, support, black_turtle, thermal_comfort]
localization_notes: Hemisphere-invariant. In seismic zones the headboard must be anchored; see SAFE-SEIS-006.
```

#### Why — tradition
The wall behind the head is the Black Turtle 玄武 of the sleeping position — the mountain at
your back. Form school and BTB agree on this one almost without qualification: a headboard
against a solid wall is the most consistently repeated bedroom instruction in the entire
popular literature, and a floating bed head is treated as the sleeper having no backing in
life. Classical practice adds that the wall should be a real structural wall rather than a
thin partition or a sliding panel, and that a gap between headboard and wall leaves the
support "broken".

#### Why — psychology / physiology
Two real mechanisms and one traditional one. Physiologically, an open head-end exposes the
sleeper to the room's air movement and to the radiant asymmetry of a cold surface, both of
which degrade sleep comfort; a headboard buffers both. Behaviourally, a defined enclosure at
the head reduces the number of directions from which surprise can arrive, which is the refuge
half of prospect–refuge (Appleton, 1975). The "no backing in life" reading has no empirical
support; mechanism is plausible as a symbolic-cue effect but untested. Note that headboard
contact also has a mundane benefit the app can state plainly: pillows stop falling into the gap.

#### Customer insight
Your headboard should be touching the wall, not hovering a hand's width from it. A solid,
reasonably tall headboard against a real wall is what makes a bed feel anchored rather than
adrift — and it keeps draughts and cold wall surfaces off the back of your head.

#### Failure modes / when to skip
Skip for beds deliberately floated in large primary suites where a full-height upholstered
panel or joinery wall already sits behind the head; the solid-segment test should pass. Skip
for platform beds in a bed alcove with three enclosing surfaces. Do not fire on hospital beds
or adjustable frames that require clearance behind for articulation, or where an accessible
transfer or hoist needs head-end space. In seismic regions, do not recommend a heavy
unanchored headboard.

---

### FS-CMD-005 — No window immediately behind the headboard

```yaml
id: FS-CMD-005
title: No window immediately behind the headboard
system: feng_shui.form_school
group: command_position
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, bedroom_guest, bedroom_child, bedroom_teen,
          ensuite, guest_suite, studio_apartment, dorm_room, nursery, loft, attic_finished]
  objects: [sleep.bed.*, sleep.daybed.*, sleep.crib.*]
  requires_features: []
  min_room_area_m2: 5.0
scope: object_placement
severity: high
confidence: mixed
evidence_class: mixed
belief_gated: true
predicate: |
  let bed = target
  let w   = nearestWallBehind(bed)
  let win = exists(w.openings) where o.kind in [window, sliding, french, skylight]
            and overlapsSpan(o, bed.backSpanStart, bed.backSpanEnd, min_overlap_pct=p.overlap_pct)
  forbid win and w.is_exterior
        and o.sill_m <= bed.pillowTopHeight_m + p.sill_grace_m
  penalize(win, weight=3)                          # any overlap penalised even if sill is high
params:
  - key: overlap_pct
    default: 25
    range: [5, 100]
    unit: pct
    user_editable: true
    rationale: How much of the headboard span must sit in front of glazing before the rule fires.
  - key: sill_grace_m
    default: 0.300
    range: [0.000, 1.000]
    unit: m
    user_editable: true
    rationale: How far above the pillow a sill must be before the glazing stops counting as behind the head.
  - key: treat_skylight_as_window
    default: true
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: Whether a sloped-ceiling skylight over the head counts under this rule or under FS-CMD-008.
score:
  weight: 7
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: sleep.bed.*
    transform: {to_wall: solid_wall_with_span >= bed.footprint.w, keep: commanding_zone}
    cost: free
    effort: high_physical
    reversible: true
    copy: Move the bed to a solid wall — the window wall is the one wall a headboard should not lean on.
  - rank: 2
    action: add_object
    add: sleep.headboard.tall_upholstered
    transform: {position: bed.backEdge, min_height_m: 1.200, span: full_window_width}
    cost: medium
    effort: medium_physical
    reversible: true
    copy: If the window wall is the only option, a tall headboard that covers the glazing behind you rebuilds the wall.
  - rank: 3
    action: add_object
    add: softgoods.curtain.blackout_lined
    transform: {position: window_behind_bed, mount: ceiling_track, overlap_m: 0.200}
    cost: medium
    effort: medium_physical
    reversible: true
    copy: Heavy floor-length curtains across the window behind the bed cut draught, street light and noise at once.
conflicts_with: [SAFE-EGR-011, DAY-BED-002]
supersedes: []
requires_rules: [FS-CMD-004]
tags: [bed, window, headboard, draught, thermal_asymmetry, noise]
localization_notes: >
  Hemisphere-invariant as a feng shui rule. The thermal and daylight arguments do vary with
  hemisphere and climate zone; those belong to DAY-* and HVAC-* rules and must not be
  re-derived here.
```

#### Why — tradition
A window behind the head is the classic broken Black Turtle: glass is read as empty, moving,
unsupportive substance where a mountain should be. Form school treats it as a hole in the
mountain behind the site; BTB teaching repeats it almost universally as the second bedroom
rule after the door sightline. Classical practitioners will add that an *openable* window
behind the head is worse than a fixed one, because the *qi* is not merely thin but actively
moving. There is no school that recommends it.

#### Why — psychology / physiology
Here tradition and building physics converge, which makes it strong app content. A window
behind a sleeper's head delivers three measurable insults: convective draught from the cold
glass surface and any infiltration at the frame; radiant thermal asymmetry against the head
and neck, which is among the more subjectively intrusive forms of local discomfort; and
higher noise ingress and light spill at the exact position of the ears and closed eyelids.
All three are well-established in thermal comfort and sleep-environment practice. The
symbolic "no support" reading has no empirical support on its own, but the physical case is
solid enough that the rule does not need it.

#### Customer insight
The window wall is the one wall your headboard should not lean against. Sleeping with glass
behind your head means cold draughts, street light and traffic noise arriving right at your
ears. If the layout leaves you no choice, a tall headboard and heavy lined curtains will do
most of the work.

#### Failure modes / when to skip
Skip where the "window" is a small high transom well above the pillow line and the sill-grace
test passes. Skip in rooms where the only wall long enough for the bed is glazed — for example
a converted sunroom or a corner apartment with two window walls — and go straight to the tall
headboard remedy. Never move a bed into a position that obstructs an emergency escape window
(SAFE-EGR-011). Do not fire on a crib under this rule; crib-near-window hazards are governed
by the child-safety file, which is stricter and wins.

---
### FS-CMD-006 — Bed not under or against a window below the pillow line

```yaml
id: FS-CMD-006
title: Bed not placed under a window (side-on, below sill)
system: feng_shui.form_school
group: command_position
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, bedroom_guest, bedroom_child, bedroom_teen,
          ensuite, guest_suite, studio_apartment, dorm_room, nursery, attic_finished, loft]
  objects: [sleep.bed.*, sleep.daybed.*, sleep.crib.*, sleep.bunk.*]
  requires_features: []
  min_room_area_m2: 5.0
scope: object_placement
severity: medium
confidence: mixed
evidence_class: mixed
belief_gated: true
predicate: |
  let bed = target
  forEach w in room.walls where w.is_exterior
    forEach o in w.openings where o.kind in [window, sliding, french]
      let under = isOnWall(bed, w)
                  and overlapsSpan(o, bed.longSideSpanStart, bed.longSideSpanEnd,
                                   min_overlap_pct=p.overlap_pct)
      penalize(under and o.sill_m <= bed.mattressTopHeight_m + p.sill_clear_m, weight=3)
      forbid under and o.is_egress == true and p.block_egress_window == false
params:
  - key: overlap_pct
    default: 30
    range: [5, 100]
    unit: pct
    user_editable: true
    rationale: Fraction of the bed's long side that must sit under glazing before the rule fires.
  - key: sill_clear_m
    default: 0.250
    range: [0.000, 1.200]
    unit: m
    user_editable: true
    rationale: Height the sill must clear above the mattress before the window stops reading as "over" the bed.
  - key: block_egress_window
    default: false
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: Hard guard — a bed must never be allowed to obstruct an emergency escape opening.
score:
  weight: 5
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: sleep.bed.*
    transform: {to_wall: interior_solid_wall, keep: commanding_zone}
    cost: free
    effort: high_physical
    reversible: true
    copy: Pull the bed off the window wall onto a solid interior wall.
  - rank: 2
    action: add_object
    add: softgoods.curtain.thermal_lined
    transform: {position: window_over_bed, mount: ceiling_track}
    cost: medium
    effort: medium_physical
    reversible: true
    copy: Thermal-lined curtains over the window turn a cold, draughty edge into a soft one.
  - rank: 3
    action: add_object
    add: decor.window_film.privacy
    transform: {position: window_over_bed}
    cost: low
    effort: low
    reversible: true
    copy: Frosted film keeps the daylight but removes the exposed-to-the-street feeling.
conflicts_with: [SAFE-EGR-011, SAFE-CHILD-021, DAY-BED-002]
supersedes: []
requires_rules: [FS-CMD-001]
tags: [bed, window, draught, exposure, egress]
localization_notes: Hemisphere-invariant as tradition; the thermal severity is climate-zone dependent (see HVAC-*).
```

#### Why — tradition
Glazing below the sleeping plane is read as a breach in the enclosure: *qi* leaks out along
the sleeper's flank and the bed is "unhoused". Form school treats low glass beside a bed the
same way it treats a site with a collapsing side ridge. This is a softer prohibition than a
window behind the head (FS-CMD-005) in both classical and BTB teaching — most practitioners
will accept it with heavy curtains rather than insist on a move.

#### Why — psychology / physiology
The physical case is the same as FS-CMD-005 but attenuated because the exposure is along the
torso rather than at the head: convective draught off cold glazing, radiant asymmetry, noise
ingress and light spill. There is also a real safety dimension the feng shui reading
accidentally tracks — a bed under a window puts a sleeper, especially a child, adjacent to
falling hazards, blind cords and a fall risk from an openable sash. No direct empirical
support exists for the *qi*-leakage framing; the comfort mechanism is standard building
physics.

#### Customer insight
A bed tucked under a window looks charming and feels chilly. If you love the spot, keep it and
add lined curtains — but if there is a solid wall free, your bed will feel steadier and warmer
there.

#### Failure modes / when to skip
Skip in attic and dormer bedrooms where the knee wall forces the bed under the low window.
Skip for a deliberate window-seat daybed. Never propose a move that obstructs an emergency
escape window. For children's rooms, the child-safety file's window and blind-cord rules are
stricter and supersede this one.

---

### FS-CMD-007 — Bed not under a beam, soffit or bulkhead

```yaml
id: FS-CMD-007
title: Bed not under a beam, soffit or bulkhead (héngliáng yādǐng)
system: feng_shui.form_school
group: overhead_oppression
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, bedroom_guest, bedroom_child, bedroom_teen,
          ensuite, guest_suite, studio_apartment, dorm_room, loft, basement_finished,
          attic_finished, nursery]
  objects: [sleep.bed.*, sleep.daybed.*, sleep.crib.*, sleep.bunk.*]
  requires_features: [beam, soffit, bulkhead]
  min_room_area_m2: 5.0
scope: object_placement
severity: high
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let bed = target
  forEach f in room.features where f.kind in [beam, soffit, bulkhead, exposed_pipe]
    let shadow = projectToFloor(f)
    let hitsHead  = overlaps(shadow, bed.headZone)
    let hitsTorso = overlaps(shadow, bed.torsoZone)
    let hitsFeet  = overlaps(shadow, bed.footZone)
    let drop_m    = room.ceiling_height_m - headroomAt(centroid(shadow))
    forbid hitsHead and drop_m >= p.significant_drop_m
    penalize(hitsTorso and drop_m >= p.significant_drop_m, weight=3)
    penalize(hitsFeet  and drop_m >= p.significant_drop_m, weight=1)
    # a beam running lengthwise down the bed's centreline is called out separately
    penalize(alignedWithin(f.axis, bed.centerAxis, tol_deg=p.lengthwise_tol_deg)
             and overlaps(shadow, bed.torsoZone), weight=2)
params:
  - key: significant_drop_m
    default: 0.150
    range: [0.050, 0.600]
    unit: m
    user_editable: true
    rationale: Depth a downstand must project below the ceiling before it registers as oppressive.
  - key: lengthwise_tol_deg
    default: 20
    range: [0, 45]
    unit: deg
    user_editable: true
    rationale: Tolerance for calling a beam "running down the middle" of the bed rather than across it.
  - key: min_head_clearance_m
    default: 2.100
    range: [1.800, 2.700]
    unit: m
    user_editable: true
    rationale: Absolute headroom under a downstand above the pillow, below which the rule escalates.
  - key: count_exposed_pipes
    default: true
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: Whether exposed services count as beams — relevant in loft and basement conversions.
score:
  weight: 8
  curve: step
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: sleep.bed.*
    transform: {offset: out_of_feature_shadow, min_offset_m: 0.300, keep: commanding_zone}
    cost: free
    effort: high_physical
    reversible: true
    copy: Slide the bed clear of the beam — even 30 cm (12 in) is enough to get your head out from under it.
  - rank: 2
    action: add_object
    add: softgoods.canopy.four_poster
    transform: {position: over_bed, forbid: overlaps(self, feature.shadow) == false}
    cost: high
    effort: medium_physical
    reversible: true
    copy: A canopy or four-poster gives the bed its own ceiling, which is the traditional cure when the beam cannot be avoided.
  - rank: 3
    action: modify_feature
    target: beam
    transform: {finish: box_in_flush, or: paint_to_match_ceiling}
    cost: high
    effort: contractor
    reversible: false
    copy: Boxing the beam into a flat ceiling, or painting it out in the ceiling colour, removes the visual weight.
  - rank: 4
    action: add_object
    add: softgoods.fabric_swag
    transform: {position: under_beam_face}
    cost: low
    effort: low
    reversible: true
    copy: Softening the underside of the beam with fabric is the low-cost version of the same idea.
conflicts_with: []
supersedes: []
requires_rules: [FS-CMD-002]
tags: [bed, beam, soffit, overhead, oppression, sha_qi, signature_rule]
localization_notes: >
  Some traditional cures for this affliction are ritual objects (paired bamboo flutes hung
  angled on the beam, faceted crystal spheres). The engine may surface these only as
  clearly-labelled traditional cures under an explicit "traditional remedies" toggle, never as
  a design recommendation.
```

#### Why — tradition
横梁压顶 (*héngliáng yādǐng*, "cross-beam pressing the crown") is one of the most cited
afflictions in Chinese domestic feng shui, and form school and BTB agree on it without
reservation. A downstand over the sleeping body is said to compress the *qi* of whatever part
of the body lies beneath it — over the head, worst; over the torso, next; over the feet,
mildest. The ranked remedies in popular practice run: move the bed, then give the bed its own
ceiling (canopy or four-poster), then hide the beam (false ceiling or box-in), then soften it
(fabric, or the ritual flute and crystal cures). Nothing in the classical compass schools
addresses beams, which are a form/shape concern.

#### Why — psychology / physiology
No direct empirical support for a *qi* mechanism, but the adjacent finding is real and worth
citing: Meyers-Levy and Zhu showed that ceiling height primes concepts of freedom versus
confinement and shifts the kind of processing people do (*Journal of Consumer Research*,
34(2), 2007, 174–186). A localised downstand directly above a supine head is a
confinement cue in the visual field you stare at while falling asleep, and it is also a real
head-strike hazard when sitting up. Beyond that, plausible but untested: a heavy overhead mass
is a canonical looming stimulus, and looming cues reliably attract attention. Treat the
severity ranking by body part as pure tradition.

#### Customer insight
Sleeping under a beam or a boxed-in duct is the classic feng shui complaint, and it has an
everyday version too: an overhead edge you look up at every night reads as pressure, and you
can crack your head on it sitting up. Move the bed out from under it if you can; if not, a
canopy gives the bed a ceiling of its own.

#### Failure modes / when to skip
Suppress in rooms where beams are continuous and regularly spaced across the whole ceiling
(exposed-joist lofts, timber-frame barns) — the rule would flag every possible position, so
report it once as a room-level condition and offer the canopy or false-ceiling remedy rather
than a move. Skip where the downstand is shallower than the drop threshold, or is above the
head-clearance parameter and visually flush. Do not fire on a coffered ceiling with shallow
symmetrical ribs; that is a composition feature, not an affliction.

---

### FS-CMD-008 — Bed not under a sloped ceiling or low headroom at the head

```yaml
id: FS-CMD-008
title: Bed head not under a sloped ceiling, skylight well or low headroom
system: feng_shui.form_school
group: overhead_oppression
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, bedroom_guest, bedroom_child, bedroom_teen,
          attic_finished, loft, basement_finished, studio_apartment, dorm_room, guest_suite]
  objects: [sleep.bed.*, sleep.daybed.*, sleep.bunk.*]
  requires_features: []
  min_room_area_m2: 5.0
scope: object_placement
severity: medium
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let bed = target
  let hz  = bed.headZone
  assert headroomAt(centroid(hz)) >= p.min_head_headroom_m
  penalize(ceilingSlopeAt(centroid(hz)) >= p.max_slope_deg, weight=3)
  penalize(room.ceiling_type == sloped
           and headroomAt(centroid(hz)) < headroomAt(centroid(bed.footZone)), weight=2)
  forEach f in room.features where f.kind in [skylight_well, skylight]
    penalize(overlaps(projectToFloor(f), hz), weight=2)
  prefer headroomAt(centroid(hz)) >= headroomAt(centroid(bed.footZone))
params:
  - key: min_head_headroom_m
    default: 1.700
    range: [1.200, 2.400]
    unit: m
    user_editable: true
    rationale: Clear height above the pillow below which the head position is called oppressed.
  - key: max_slope_deg
    default: 15
    range: [0, 45]
    unit: deg
    user_editable: true
    rationale: Ceiling pitch above the head above which the slope reads as a wedge closing down on the sleeper.
  - key: prefer_head_under_high_side
    default: true
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: When on, the generator always puts the pillow under the higher part of a pitched ceiling.
score:
  weight: 5
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: rotate_object
    target: sleep.bed.*
    transform: {swap_ends: true, keep: backsToWall(min_contact_pct=60)}
    cost: free
    effort: medium_physical
    reversible: true
    copy: Turn the bed end-for-end so your head is under the high side of the roof and your feet under the low side.
  - rank: 2
    action: move_object
    target: sleep.bed.*
    transform: {to_zone: max_headroom_band, keep: commanding_zone}
    cost: free
    effort: high_physical
    reversible: true
    copy: Move the bed towards the ridge where the ceiling is tallest.
  - rank: 3
    action: add_object
    add: lighting.uplight.floor
    transform: {position: under_low_slope}
    cost: low
    effort: low
    reversible: true
    copy: Washing the sloped ceiling with light from below lifts it visually when the bed cannot move.
  - rank: 4
    action: add_object
    add: softgoods.blind.blackout_skylight
    transform: {position: skylight_over_head}
    cost: medium
    effort: low
    reversible: true
    copy: A blackout blind on a skylight above the pillow stops both the early light and the exposed feeling.
conflicts_with: [SAFE-STRUCT-002]
supersedes: []
requires_rules: [FS-CMD-007]
tags: [bed, sloped_ceiling, attic, headroom, skylight, oppression]
localization_notes: >
  Habitable-room ceiling height minimums and the treatment of sloped ceilings are set by code
  (IRC family in the US) and vary by jurisdiction; this rule does not assert a code dimension.
  See SAFE-STRUCT-002 and the room-level attic rules.
```

#### Why — tradition
A sloping or pinching ceiling over the head is treated as the same affliction as a beam —
downward pressure on the sleeper — and popular practice prescribes the same remedy ladder.
Form school reads a wedge closing over the body as unstable enclosure; where the roof pitch
cannot be changed, the traditional instruction is to place the head under the high side and
the feet under the low side, or to give the bed its own flat plane with a canopy. BTB adds
uplighting the slope as a modern cure. Classical compass practice is silent on ceiling pitch.

#### Why — psychology / physiology
Meyers-Levy and Zhu's ceiling-height priming result (*Journal of Consumer Research*, 34(2),
2007, 174–186) is the nearest real evidence: low ceilings prime confinement. Beyond that,
there are two mundane mechanisms: real head-strike risk on sitting up, and — for a skylight
directly over the pillow — uncontrolled dawn light at the eyes, which matters for sleep timing
and is well supported in the circadian literature. No empirical support exists for the
symbolic pressure claim itself.

#### Customer insight
In a loft or attic room, put your pillow where the ceiling is tallest and your feet where it
slopes down. It stops the roof feeling like it is leaning on you, and it saves you banging
your head every time you sit up.

#### Failure modes / when to skip
Skip where the room is entirely under pitch and no position has more headroom than another.
Skip where the low-side placement is the only one that clears a dormer window used for egress.
Do not fire on vaulted ceilings that rise away from the bed. If the room's headroom is below
the habitable minimum in the local code, that is a structural/code finding owned by the safety
file, not a feng shui finding.

---

### FS-CMD-009 — No overhead storage or heavy hanging object above the head

```yaml
id: FS-CMD-009
title: No overhead storage, shelf or heavy hanging object above the sleeping head
system: feng_shui.form_school
group: overhead_oppression
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, bedroom_guest, bedroom_child, bedroom_teen,
          nursery, studio_apartment, dorm_room, guest_suite, loft]
  objects: [sleep.bed.*, sleep.crib.*, sleep.bunk.*]
  requires_features: []
  min_room_area_m2: 4.0
scope: object_pair
severity: high
confidence: mixed
evidence_class: mixed
belief_gated: false
predicate: |
  let bed = target
  forEach o in others(*) where o.pose.z >= p.min_overhead_z_m
    let shadow = projectToFloor(o)
    let over_head  = overlaps(shadow, bed.headZone)
    let over_torso = overlaps(shadow, bed.torsoZone)
    forbid over_head and o.type in [storage.shelf.*, storage.cabinet.wall, storage.overbed.*]
    forbid over_head and o.mass_kg >= p.heavy_mass_kg
    penalize(over_head, weight=3)
    penalize(over_torso and o.mass_kg >= p.heavy_mass_kg, weight=2)
  forEach f in room.features where f.kind in [light_point, ceiling_fan]
    penalize(overlaps(projectToFloor(f), bed.headZone), weight=2)
    forbid f.kind == ceiling_fan and overlaps(projectToFloor(f), bed.headZone)
           and headroomAt(centroid(bed.headZone)) < p.min_fan_clearance_m
params:
  - key: min_overhead_z_m
    default: 1.200
    range: [0.600, 2.400]
    unit: m
    user_editable: true
    rationale: Height above floor at which an object counts as overhead relative to a bed.
  - key: heavy_mass_kg
    default: 5.0
    range: [0.5, 30.0]
    unit: kg
    user_editable: true
    rationale: Mass above which a falling object is treated as an injury hazard, not just a visual weight.
  - key: min_fan_clearance_m
    default: 2.100
    range: [1.800, 2.700]
    unit: m
    user_editable: true
    rationale: Clear height to fan blades above a bed; below this the fan is flagged for relocation.
score:
  weight: 7
  curve: step
  partial_credit: true
remedies:
  - rank: 1
    action: remove_object
    target: storage.shelf.*
    transform: {from: wall_above_bed_head}
    cost: free
    effort: low
    reversible: true
    copy: Take the shelf down from above the bed head and rehang it on a wall you do not sleep under.
  - rank: 2
    action: move_object
    target: decor.art.framed_heavy
    transform: {to: wall_opposite_bed, or: lower_to_z < 1.200}
    cost: free
    effort: low
    reversible: true
    copy: Move heavy framed art to a wall you look at rather than one you sleep beneath.
  - rank: 3
    action: replace_object
    target: decor.art.framed_heavy
    add: softgoods.wall_hanging.textile
    transform: {position: wall_above_bed_head}
    cost: low
    effort: low
    reversible: true
    copy: If you want something above the bed, choose a light textile or an unframed canvas instead of glass and heavy timber.
conflicts_with: []
supersedes: []
requires_rules: [FS-CMD-007]
tags: [bed, overhead, storage, tipover, falling_object, child_safety]
localization_notes: >
  belief_gated is false because the falling-object hazard stands on its own. In seismic zones
  the threshold should drop; see SAFE-SEIS-006 and SAFE-TIP-*.
```

#### Why — tradition
Any suspended mass above the sleeper falls under the same overhead-oppression family as beams:
shelving, wall cabinets, heavy mirrors and framed art above the head are all read as pressing
down on the sleeper's *qi*. Popular BTB and form-school advice is uniform — nothing heavy above
the head of the bed. The tradition also dislikes glass above a sleeping body specifically,
which happens to align with the hazard reading.

#### Why — psychology / physiology
This is one place where the traditional rule is straightforwardly a safety rule, which is why
it is not belief-gated. Objects mounted above a bed are a documented injury pathway in
earthquakes and in ordinary fastener failure, and the exposed body part is the head. There is
also a plausible but untested attentional mechanism: an object in the upward visual field at
the moment of sleep onset is a looming-shaped stimulus. Note that the app should lead with the
hazard, not the symbolism, for users who have not enabled feng shui.

#### Customer insight
Keep the wall above your pillow clear of shelves, cabinets and heavy framed pieces. It is the
one spot in the house where something coming loose lands on a sleeping head — and most people
find they sleep more easily once it is empty.

#### Failure modes / when to skip
Skip for purpose-built, mechanically fixed over-bed joinery in small apartments where storage
is genuinely unavailable, but still require positive fixing and mark it. Skip for lightweight
bunk-bed integral shelving within the frame. Do not fire on a properly mounted low-mass
reading light. Where the room is a nursery, the child-safety file's stricter version
supersedes this rule.

---

### FS-CMD-010 — Mirror not facing the bed

```yaml
id: FS-CMD-010
title: Mirror not facing the bed
system: feng_shui.btb_western
group: command_position
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, bedroom_guest, bedroom_child, bedroom_teen,
          ensuite, guest_suite, studio_apartment, dorm_room, dressing_room, loft]
  objects: [decor.mirror.wall, decor.mirror.full_length, decor.mirror.leaning,
            storage.wardrobe.mirrored, decor.tv.wall]
  requires_features: []
  min_room_area_m2: 4.0
scope: object_pair
severity: medium
confidence: tradition
evidence_class: traditional
belief_gated: true
predicate: |
  let m   = target
  let bed = exists(others(sleep.bed.*))
  assert bed != null
  let reflects_sleeper = reflectionVisibleFrom(m, bed.pillowCenter) == true
                         or reflectionVisibleFrom(m, bed.torsoCenter) == true
  forbid reflects_sleeper and angleBetween(m.normal, bed.centerAxis) >= p.facing_min_deg
        and distance(m.centroid, bed.centroid) <= p.max_distance_m
  penalize(reflects_sleeper, weight=3)
  # side mirrors and mirrored wardrobe doors are the common real-world case
  penalize(m.type == storage.wardrobe.mirrored and reflects_sleeper, weight=2)
  # dark reflective screens count when off
  penalize(m.type == decor.tv.wall and m.reflective == true and reflects_sleeper, weight=1)
params:
  - key: facing_min_deg
    default: 140
    range: [90, 180]
    unit: deg
    user_editable: true
    rationale: How head-on the mirror must be to the bed axis before it counts as facing it.
  - key: max_distance_m
    default: 6.000
    range: [1.000, 12.000]
    unit: m
    user_editable: true
    rationale: Beyond this the reflection is too small to register on waking.
  - key: include_pillow_only
    default: false
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: Strict mode — only a reflection of the head/pillow counts, not the whole body.
  - key: include_dark_screens
    default: true
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: Whether a switched-off TV or glossy panel is treated as a mirror.
score:
  weight: 5
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: move_object
    target: decor.mirror.*
    transform: {to_wall: wall_containing(bed) or wall_perpendicular_to(bed.centerAxis),
                forbid: reflectionVisibleFrom(self, bed.pillowCenter)}
    cost: free
    effort: low
    reversible: true
    copy: Rehang the mirror on the same wall as the headboard, or on a side wall where it no longer shows the bed.
  - rank: 2
    action: add_object
    add: softgoods.curtain.panel
    transform: {position: over_mirror, mount: rod, usage: night}
    cost: low
    effort: low
    reversible: true
    copy: A fabric panel or a folding screen you close at night covers the reflection without losing the mirror.
  - rank: 3
    action: replace_object
    target: storage.wardrobe.mirrored
    add: storage.wardrobe.plain_front
    transform: {position: same}
    cost: high
    effort: medium_physical
    reversible: false
    copy: Swapping mirrored wardrobe doors for plain fronts is the permanent fix if the reflection bothers you.
  - rank: 4
    action: move_object
    target: decor.mirror.full_length
    transform: {to_room: dressing_room or walk_in_closet}
    cost: free
    effort: low
    reversible: true
    copy: Move the full-length mirror into the closet or dressing area where you actually use it.
conflicts_with: [ERG-DRESS-003, DAY-REFL-005]
supersedes: []
requires_rules: []
tags: [bed, mirror, reflection, sleep, taboo, btb]
localization_notes: >
  The strength of this taboo varies sharply by culture and is near-universal in Chinese folk
  practice. Some lineages give a marriage/third-party interpretation; do not reproduce that
  reading in product copy, which should stay on the sleep-disturbance framing.
```

#### Why — tradition
A mirror that reflects the bed is one of the most widely repeated bedroom prohibitions in both
BTB and Chinese folk practice: the reflection is said to double and agitate the *qi* of the
sleeping body, and various lineages attach specific readings to it — disturbed sleep, or in
some folk interpretations a third party entering a marriage. Classical compass schools have no
such rule; some classical practitioners explicitly dismiss it as folk belief, and the app
should say so. What every school does agree on is that a mirror is a strong reflective element
and that bedrooms are meant to be the most *yin*, settled room in the home.

#### Why — psychology / physiology
No direct empirical support; mechanism is plausible but untested. The most defensible
mechanism is nocturnal misperception: a mirror in a dark room returns moving, dimly-lit
human-shaped imagery, and a partially-woken brain is a poor discriminator — this is the same
class of stimulus ambiguity that makes people startle at coat racks at night. A large mirror
also multiplies any light source in the room, including standby LEDs and street light. Neither
claim has a study behind it, and the app must not imply one. It is worth noting that many
users report the effect subjectively, which is a preference finding, not evidence of a
mechanism.

#### Customer insight
A mirror that shows you your own bed is the one piece of feng shui advice almost everyone has
heard, and there is a simple everyday reason to take it seriously: half-awake at 3am, a dim
moving reflection is exactly the kind of thing that jolts you properly awake. Move it to the
headboard wall, or hang a panel you close at night.

#### Failure modes / when to skip
Skip in studio apartments and small rentals where the only full-length mirror must live on the
one free wall — offer the night-cover remedy instead. Skip mirrored wardrobe doors in a room
under about 8 m² (86 ft²) where the mirror is doing real spatial work; downgrade to advisory.
Never remove a mirror that FS-CMD-002 placed as the entry-sightline surrogate — instead
reposition it so it shows the door without showing the pillow. Do not fire if the user has
explicitly disabled this rule; it is the most commonly overridden rule in the file.

---

### FS-CMD-011 — Headboard wall not shared with a toilet or plumbing stack

```yaml
id: FS-CMD-011
title: Headboard wall not shared with a toilet, cistern or plumbing stack
system: feng_shui.form_school
group: command_position
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, bedroom_guest, bedroom_child, bedroom_teen,
          ensuite, guest_suite, studio_apartment, nursery, loft]
  objects: [sleep.bed.*]
  requires_features: []
  min_room_area_m2: 5.0
scope: room_adjacency
severity: medium
confidence: mixed
evidence_class: mixed
belief_gated: true
predicate: |
  let bed = target
  let w   = nearestWallBehind(bed)
  let nbr = adjacentRoomAcross(w)
  penalize(nbr != null and nbr.type in [bathroom_full, bathroom_three_quarter, powder_room,
                                        ensuite, jack_and_jill_bath, wet_room, laundry_room], weight=3)
  forbid objectOnOppositeFaceOf(w, bath.toilet.*, within_m=p.fixture_span_m)
        and overlapsSpan(projectOnto(w, bath.toilet.*), bed.backSpanStart, bed.backSpanEnd,
                         min_overlap_pct=p.overlap_pct)
  penalize(exists(w.features) where f.kind in [plumbing_stack, water_supply, floor_drain]
           and overlapsSpan(f, bed.backSpanStart, bed.backSpanEnd, min_overlap_pct=p.overlap_pct),
           weight=2)
params:
  - key: fixture_span_m
    default: 0.900
    range: [0.300, 2.000]
    unit: m
    user_editable: true
    rationale: Lateral span on the far side of the wall treated as "behind the head".
  - key: overlap_pct
    default: 20
    range: [5, 100]
    unit: pct
    user_editable: true
    rationale: Overlap between the fixture's wall footprint and the headboard span before firing.
  - key: acoustic_escalate_stc
    default: 45
    range: [30, 60]
    unit: STC
    user_editable: true
    rationale: Party-wall rating below which the finding is escalated on acoustic grounds as well.
score:
  weight: 5
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: sleep.bed.*
    transform: {to_wall: wall_without_wet_neighbour, keep: commanding_zone}
    cost: free
    effort: high_physical
    reversible: true
    copy: Move the bed to a wall that does not have a bathroom on the other side.
  - rank: 2
    action: add_object
    add: storage.bookcase.tall
    transform: {position: wall_behind_bed_adjacent, span: fixture_span}
    cost: medium
    effort: medium_physical
    reversible: true
    copy: A full bookcase against that wall adds mass and mutes the plumbing.
  - rank: 3
    action: modify_finish
    target: wall_behind_bed
    transform: {add_layer: resilient_channel_plus_gypsum}
    cost: high
    effort: contractor
    reversible: false
    copy: If you are renovating, an extra insulated layer on that wall is the real fix for pipe noise.
conflicts_with: []
supersedes: []
requires_rules: [FS-CMD-004]
tags: [bed, toilet, plumbing, acoustics, adjacency, wet_room]
localization_notes: Hemisphere-invariant. In apartments the wall may be a party wall; acoustic escalation applies.
```

#### Why — tradition
A toilet on the far side of the headboard wall is a standard affliction in Chinese practice:
the bathroom is *yin*, draining, and dirty *qi* (*huì qì*) and the head of the bed is the most
protected point in the home, so the two should not share a plane. Form school frames it as
contaminated backing; BTB frames it as draining the sleeper's support. Classical compass
schools handle bathrooms by sector rather than by adjacency, so they would not raise this as an
adjacency issue at all — another honest school disagreement.

#### Why — psychology / physiology
The real mechanism is acoustic. A soil stack, a cistern refill and a flush are impulsive
low-frequency events at exactly the wall plane closest to the sleeper's ears, and sudden
intermittent noise is among the better-supported disruptors of sleep continuity. Partition
walls in dwellings frequently carry plumbing with little or no acoustic isolation. The *qi*
contamination framing has no empirical support; the noise mechanism needs none.

#### Customer insight
If there is a bathroom directly behind your headboard, you are sleeping with the cistern and
the soil pipe next to your ear. Feng shui has always disliked this arrangement; acoustics
agrees. Moving the bed to another wall, or standing a full bookcase against that one, makes a
noticeable difference.

#### Failure modes / when to skip
Skip in compact apartments where every bedroom wall is a wet wall. Skip where the wall is a
thick masonry party wall with a known high acoustic rating. Do not fire when the "toilet" on
the far side is more than the fixture-span parameter away laterally from the headboard. Do not
recommend a move that breaks FS-CMD-002; if both cannot be satisfied, report the trade-off and
let the user choose.

---

### FS-CMD-012 — Headboard wall not shared with a cooktop or oven

```yaml
id: FS-CMD-012
title: Headboard wall not shared with a cooktop, oven or boiler
system: feng_shui.five_elements
group: command_position
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, bedroom_guest, bedroom_child, bedroom_teen,
          studio_apartment, guest_suite, adu_in_law_suite, dorm_room, loft]
  objects: [sleep.bed.*]
  requires_features: []
  min_room_area_m2: 5.0
scope: room_adjacency
severity: medium
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let bed = target
  let w   = nearestWallBehind(bed)
  forEach o in objectsOnOppositeFaceOf(w) where o.type in [kitchen.range.*, kitchen.cooktop.*,
                                                           kitchen.oven.*, appliance.boiler.*,
                                                           appliance.water_heater.*]
    forbid overlapsSpan(projectOnto(w, o), bed.backSpanStart, bed.backSpanEnd,
                        min_overlap_pct=p.overlap_pct)
  forEach f in room.features where f.kind in [water_heater, panel]
    penalize(isOnWall(f, w) and overlapsSpan(f, bed.backSpanStart, bed.backSpanEnd,
                                             min_overlap_pct=p.overlap_pct), weight=2)
  penalize(distanceToHeatSource(bed.pillowCenter) <= p.min_heat_distance_m, weight=2)
params:
  - key: overlap_pct
    default: 20
    range: [5, 100]
    unit: pct
    user_editable: true
    rationale: Overlap between the appliance's wall footprint and the headboard span.
  - key: min_heat_distance_m
    default: 1.200
    range: [0.300, 3.000]
    unit: m
    user_editable: true
    rationale: Straight-line distance from pillow to a heat-emitting appliance below which comfort degrades.
score:
  weight: 5
  curve: step
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: sleep.bed.*
    transform: {to_wall: wall_without_appliance_neighbour, keep: commanding_zone}
    cost: free
    effort: high_physical
    reversible: true
    copy: Move the bed to a wall with nothing hot on the other side.
  - rank: 2
    action: add_object
    add: storage.wardrobe.freestanding
    transform: {position: wall_behind_bed_adjacent}
    cost: high
    effort: medium_physical
    reversible: true
    copy: A deep wardrobe on that wall puts distance and mass between your head and the kitchen.
  - rank: 3
    action: rotate_object
    target: sleep.bed.*
    transform: {rot_delta_deg: 90}
    cost: free
    effort: high_physical
    reversible: true
    copy: In a studio, turning the bed so the hot wall is at your side rather than your head is usually enough.
conflicts_with: [SAFE-FIRE-014]
supersedes: []
requires_rules: [FS-CMD-004]
tags: [bed, stove, fire_element, studio, heat, adjacency]
localization_notes: >
  Most relevant in studio apartments, ADUs and converted flats where a kitchenette shares a
  partition with a sleeping area. See SAFE-FIRE-* for the combustion and CO rules, which are
  blocking and take precedence.
```

#### Why — tradition
Sleeping with the *fire* element directly behind the head is treated as agitating the
sleeper: the stove is the strongest fire position in a home in Chinese practice, the bed the
most *yin*, and having fire at your back voids the stabilising function of the Black Turtle
wall. Both form school and five-element reasoning support the prohibition. Classical
practitioners would also object on stove-orientation grounds, which is a separate doctrine
owned by the kitchen rules.

#### Why — psychology / physiology
Real mechanisms: radiant and conducted heat through the partition raises local surface
temperature at the head, and elevated skin and ambient temperature near sleep onset is well
established as detrimental; cooking noise and odour transfer through a shared partition are
also genuine sleep disruptors in studio layouts. There is a safety dimension too — combustion
appliances and sleeping areas have code-governed separation and CO-alarm requirements which the
safety file owns and which are blocking. The five-element framing itself has no empirical
support.

#### Customer insight
Try not to sleep with the cooker on the other side of your headboard wall. Heat, smells and
the clatter of cooking all travel straight through a partition to the back of your head. In a
studio, turning the bed 90 degrees so the kitchen is beside you rather than behind you is
usually enough.

#### Failure modes / when to skip
Skip where the shared wall is a thick fire-rated separating wall. Skip in micro-studios below
about 20 m² (215 ft²) where no alternative wall exists — offer the rotation remedy. Always
defer to SAFE-FIRE-* separation and CO-alarm requirements; if those conflict, safety wins and
the engine must say so.

---

### FS-CMD-013 — No occupied position under a stair run from the floor above

```yaml
id: FS-CMD-013
title: No bed, desk or primary seat directly beneath a stair run
system: feng_shui.form_school
group: overhead_oppression
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, bedroom_guest, bedroom_child, home_office,
          home_office_shared, study_library, living_room, family_room, basement_finished,
          studio_apartment, loft, open_plan_combined]
  objects: [sleep.bed.*, worksurface.desk.*, seating.sofa.*, seating.armchair.*, ritual.altar.*]
  requires_features: [stair_opening]
  min_room_area_m2: 4.0
scope: object_placement
severity: high
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let obj = target
  let above = room.above_room_id
  forEach s in floorsAbove(room).stairs
    let shadow = stairRunFootprint(s)
    forbid overlaps(shadow, obj.occupantZone) and verticallyStacked(room, s.room)
    penalize(overlaps(shadow, bbox(obj)), weight=3)
  forEach f in room.features where f.kind == stair_opening
    penalize(overlaps(projectToFloor(f), obj.occupantZone), weight=2)
  # sloping underside of a stair is also an overhead-oppression case
  penalize(ceilingSlopeAt(centroid(obj.occupantZone)) >= p.max_underside_slope_deg
           and isUnderStairRun(obj) == true, weight=2)
params:
  - key: max_underside_slope_deg
    default: 20
    range: [0, 45]
    unit: deg
    user_editable: true
    rationale: Pitch of a stair soffit above an occupant before it registers as a closing wedge.
  - key: occupant_zone_margin_m
    default: 0.200
    range: [0.000, 0.800]
    unit: m
    user_editable: true
    rationale: Margin added around the occupant's body zone when testing overlap with the stair shadow.
score:
  weight: 7
  curve: step
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: self
    transform: {offset: out_of_stair_shadow, min_offset_m: 0.400, keep: commanding_zone}
    cost: free
    effort: high_physical
    reversible: true
    copy: Move the piece out from under the staircase above — even a short shift clears the run.
  - rank: 2
    action: reassign_use
    target: under_stair_zone
    transform: {to_use: storage or display}
    cost: free
    effort: low
    reversible: true
    copy: Under-stair space works beautifully for storage or display, and badly for sleeping or working.
  - rank: 3
    action: modify_finish
    target: stair_soffit
    transform: {add_layer: acoustic_underlay_plus_gypsum}
    cost: high
    effort: contractor
    reversible: false
    copy: If someone has to sit there, lining the underside of the stair cuts the footfall noise.
conflicts_with: []
supersedes: []
requires_rules: [FS-CMD-007]
tags: [bed, desk, understair, footfall, overhead, oppression]
localization_notes: Hemisphere-invariant. See FS-STAIR-010 for the wider under-stair use rule and its fire requirements.
```

#### Why — tradition
An occupied position under a flight of stairs collects the same objection as a beam, amplified:
the mass is heavy, the underside slopes, and people tread over the occupant's head all day. In
Chinese practice the under-stair void is *the* canonical storage or non-use zone, and placing a
bed, a desk or an altar there is considered a clear fault. Form school and BTB agree; classical
compass schools are silent because this is a form concern.

#### Why — psychology / physiology
Structure-borne footfall noise from a stair above is impulsive, unpredictable, and transmits
through the soffit with little attenuation in typical timber construction; unpredictable
intermittent noise is a stronger disruptor of sleep and of concentrated work than steady noise
of the same level. The sloping soffit also cuts headroom asymmetrically, which is a real
head-strike and confinement condition (cf. Meyers-Levy & Zhu, 2007, on ceiling-height
priming). The traditional reading of "people walking over you" is symbolic, but the acoustic
version of it is literal.

#### Customer insight
Nobody rests well under a staircase — you get every footstep through the ceiling, and the
sloping underside means you cannot sit up straight. Keep that space for storage or a display
nook, and put the bed or desk somewhere with a flat ceiling.

#### Failure modes / when to skip
Skip where the stair above is a concrete flight in a masonry building with a flat plastered
soffit and the headroom test passes; the acoustic argument largely disappears. Skip for a
purpose-designed under-stair reading nook that the user has flagged as intentional and
occasional. Do not fire on storage, laundry, a WC the user has already accepted, or a pet
crate.

---

### FS-CMD-014 — Bilateral bed access with paired flanking support

```yaml
id: FS-CMD-014
title: Bilateral bed access with paired flanking support
system: feng_shui.form_school
group: command_position
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_guest, ensuite, guest_suite, studio_apartment, loft]
  objects: [sleep.bed.double, sleep.bed.queen, sleep.bed.king, sleep.bed.super_king]
  requires_features: []
  min_room_area_m2: 9.0
scope: object_placement
severity: medium
confidence: mixed
evidence_class: mixed
belief_gated: true
predicate: |
  let bed = target
  assert clearance(bed, left)  >= p.min_side_clearance_m
  assert clearance(bed, right) >= p.min_side_clearance_m
  prefer exists(others(tables.nightstand.*)) where isBeside(o, bed, side=left)
  prefer exists(others(tables.nightstand.*)) where isBeside(o, bed, side=right)
  penalize(countOf(tables.nightstand.*, scope=beside(bed)) == 1, weight=2)
  penalize(isOnWall(bed, w) and bed.footprint.w >= p.shared_bed_min_width_m
           and (clearance(bed, left) < p.min_side_clearance_m
                or clearance(bed, right) < p.min_side_clearance_m), weight=3)
  prefer abs(flankMassHeight(bed, left) - flankMassHeight(bed, right)) <= p.flank_tol_m
params:
  - key: min_side_clearance_m
    default: 0.600
    range: [0.450, 1.200]
    unit: m
    user_editable: true
    rationale: Walking clearance each side of a shared bed; the ergonomics file owns the hard minimum.
  - key: shared_bed_min_width_m
    default: 1.300
    range: [0.900, 2.200]
    unit: m
    user_editable: true
    rationale: Width above which a bed is presumed to be shared and needs two-sided access.
  - key: flank_tol_m
    default: 0.150
    range: [0.000, 0.600]
    unit: m
    user_editable: true
    rationale: Permitted height difference between the two nightstands or flanking pieces.
  - key: require_matched_pair
    default: false
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: Strict mode requiring a matched pair rather than merely two pieces of similar height.
score:
  weight: 6
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: sleep.bed.*
    transform: {offset: centre_on_wall, achieve: clearance(left) >= 0.600 and clearance(right) >= 0.600}
    cost: free
    effort: high_physical
    reversible: true
    copy: Centre the bed on its wall so both people can get in and out without climbing over.
  - rank: 2
    action: add_object
    add: tables.nightstand.small
    transform: {position: deficient_side, match_height_to: existing_nightstand}
    cost: medium
    effort: low
    reversible: true
    copy: Add a second nightstand of similar height so both sides of the bed are equally served.
  - rank: 3
    action: replace_object
    target: sleep.bed.king
    add: sleep.bed.queen
    transform: {position: same}
    cost: high
    effort: high_physical
    reversible: false
    copy: If the bed is simply too wide for the room, dropping one size buys you access on both sides.
conflicts_with: [ERG-CLR-012, ACC-BED-004]
supersedes: []
requires_rules: [FS-CMD-001]
tags: [bed, nightstand, symmetry, dragon_tiger, partnership, access]
localization_notes: >
  In traditional readings the dragon (left, from the occupant looking out) should be equal or
  taller; product copy should say "similar height" and never explain the dragon/tiger reading
  unless the user has opened the tradition detail panel.
```

#### Why — tradition
The paired nightstand is the Azure Dragon and White Tiger of the bedroom — flanking support
either side of the sleeping position. A bed shoved against a side wall so that one occupant
must climb over the other is read as unequal support, and in relationship-focused BTB practice
it is explicitly tied to imbalance between partners. Form school's landform version simply
wants mass on both flanks, with the dragon side (the occupant's left, looking out) equal or
slightly higher.

#### Why — psychology / physiology
The access half is ergonomic and not in dispute: a shared bed with one blocked side forces
night-time climbing over a sleeping partner, which is a documented source of sleep
fragmentation for couples and a fall risk for older adults. The symmetry half is compositional
rather than empirical — symmetrical flanking reads as stable and is a standard classical
proportion device — and the dragon/tiger asymmetry refinement has no empirical support;
mechanism is plausible as an aesthetic preference but untested.

#### Customer insight
If two people share the bed, both should be able to get out of it without climbing over anyone.
A matching pair of bedside tables is the small move that makes the room read as settled and
gives each side its own lamp and landing spot.

#### Failure modes / when to skip
Skip for single beds, bunks, daybeds and children's rooms where a bed against a wall is the
point. Skip in rooms under 9 m² (97 ft²) where two-sided access would leave no floor. If a
wheelchair transfer side needs a larger clearance on one side only, accessibility wins and the
symmetry preference is suppressed. Never let the pairing preference push a nightstand into a
door swing.

---
### FS-CMD-015 — Desk and chair in the commanding position

```yaml
id: FS-CMD-015
title: Desk and chair in the commanding position
system: feng_shui.btb_western
group: command_position
version: 1
status: active
applies_to:
  rooms: [home_office, home_office_shared, study_library, homework_nook, bedroom_teen,
          bedroom_secondary, studio_apartment, dorm_room, loft, open_plan_combined,
          basement_finished, attic_finished]
  objects: [worksurface.desk.*, seating.desk_chair.*]
  requires_features: []
  min_room_area_m2: 4.0
scope: object_placement
severity: high
confidence: mixed
evidence_class: mixed
belief_gated: true
predicate: |
  let desk = target
  let seat = desk.primarySeat
  let eye  = seat.seatedEyePoint
  let door = room.primaryDoor

  assert lineOfSight(eye, door.centroid) == true
       or lineOfSightViaReflection(eye, door.centroid) != null
  assert not alignedWithin(seat.faceAxis, door.openingAxis, tol_deg=p.door_axis_tol_deg)
  assert backsToWall(seat, min_contact_pct=0) == false or true   # seat back need not touch
  assert distanceToWall(seat.backPoint, nearestWallBehind(seat)) <= p.max_back_gap_m
       or exists(others(storage.bookcase.*, storage.credenza.*)) where isBehind(o, seat)
          and o.footprint.h >= p.surrogate_back_height_m
  assert distance(desk.centroid, door.centroid) >= p.min_door_distance_m
  prefer isovistArea(eye) >= p.min_front_isovist_m2
  penalize(angleBetween(seat.faceAxis, nearestWall(seat).normal) <= p.wall_stare_tol_deg
           and distanceToWall(desk.frontEdge, nearestWall(desk)) <= p.wall_stare_distance_m,
           weight=2)
params:
  - key: door_axis_tol_deg
    default: 15
    range: [0, 45]
    unit: deg
    user_editable: true
    rationale: Angular tolerance before the seat counts as sitting in the doorway's axis.
  - key: min_door_distance_m
    default: 1.200
    range: [0.600, 4.000]
    unit: m
    user_editable: true
    rationale: Distance from door at which an entrant is noticed with time to respond.
  - key: max_back_gap_m
    default: 0.900
    range: [0.000, 3.000]
    unit: m
    user_editable: true
    rationale: Gap behind the chair beyond which the back is read as exposed.
  - key: surrogate_back_height_m
    default: 1.200
    range: [0.700, 2.400]
    unit: m
    user_editable: true
    rationale: Height of a bookcase or credenza that substitutes for the wall behind the chair.
  - key: min_front_isovist_m2
    default: 8.0
    range: [2.0, 60.0]
    unit: m2
    user_editable: true
    rationale: Visible floor area ahead of the seated worker.
  - key: wall_stare_tol_deg
    default: 20
    range: [0, 45]
    unit: deg
    user_editable: true
    rationale: How square-on to a near wall the worker must face before "facing a blank wall" fires.
  - key: wall_stare_distance_m
    default: 0.800
    range: [0.200, 2.000]
    unit: m
    user_editable: true
    rationale: Distance to that wall below which the outlook counts as blocked.
score:
  weight: 9
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: rotate_object
    target: worksurface.desk.*
    transform: {to_pose: back_to_solid_wall, face: into_room, achieve: lineOfSight(seat.seatedEyePoint, door.centroid)}
    cost: free
    effort: medium_physical
    reversible: true
    copy: Turn the desk so you sit with a wall behind you and the doorway in your field of view.
  - rank: 2
    action: move_object
    target: worksurface.desk.*
    transform: {to_zone: diagonal_from_door, keep: daylight_from_side}
    cost: free
    effort: medium_physical
    reversible: true
    copy: Float the desk in the diagonal corner facing back into the room — the classic "power desk" position.
  - rank: 3
    action: add_object
    add: storage.bookcase.tall
    transform: {position: behind_seat, min_height_m: 1.400}
    cost: medium
    effort: medium_physical
    reversible: true
    copy: If the desk must face a wall, a tall bookcase behind your chair closes the open back.
  - rank: 4
    action: add_object
    add: decor.mirror.desk_small
    transform: {position: desk_top, aim: door.centroid, forbid: glareRisk(seat, self) > 0.3}
    cost: low
    effort: low
    reversible: true
    copy: In a built-in desk you cannot move, a small angled mirror lets you see the door without turning round.
conflicts_with: [ERG-DESK-008, DAY-GLARE-004, SAFE-EGR-003]
supersedes: []
requires_rules: [FS-CMD-001]
tags: [desk, office, chair, sightline, back_exposure, signature_rule, btb]
localization_notes: >
  Hemisphere-invariant as tradition. The daylight-from-the-side preference in remedy 2 is
  hemisphere- and orientation-dependent and is owned by DAY-* rules; do not hard-code a
  compass direction here.
```

#### Why — tradition
The desk version of the commanding position is the most emphasised non-bedroom instruction in
BTB-lineage practice: the worker should sit with support behind, the door in view, and open
floor ahead, and should not be in the door's straight line. Form school reads the same
armchair shape. Classical compass practitioners approach a workstation primarily through the
occupant's auspicious sitting direction from their Eight Mansions *kua*, which can place the
desk somewhere the door sightline is imperfect — a real conflict the app must present as a
school disagreement, not as one school being wrong.

#### Why — psychology / physiology
The strongest evidence in this file for a non-bedroom rule. Kim and de Dear found enclosed
offices outperformed open-plan on most indoor-environment dimensions, with privacy and
proxemics penalties dominating the interaction benefit (*Journal of Environmental Psychology*,
36, 2013, 18–26) — the "exposed back" condition is essentially an open-plan condition at
furniture scale. Prospect–refuge (Appleton, 1975) and isovist analysis (Benedikt, 1979) give a
computable account of why a seat with rear enclosure and forward visibility is preferred. The
mechanism for the interruption cost is mundane and real: a worker who cannot see the entry
either turns to check repeatedly or is startled by arrivals, and both are task-switching costs.
The specific *qi* framing is tradition.

#### Customer insight
Sit with a wall behind you and the door where you can see it without turning round. If you
work with your back to an open room or a doorway, part of your attention stays on the entrance
all day — most people notice the difference within a week of turning the desk around.

#### Failure modes / when to skip
Skip for built-in or plumbed workstations, wall-mounted fold-down desks and galley home
offices under about 4 m² (43 ft²); use the mirror remedy. Skip where the only commanding
position puts a window directly in front of a monitor and creates severe glare — FS-CMD-017
and the daylight rules take precedence. Do not fire in a shared home office where two desks
cannot both command; flag the primary user's desk only. If the commanding position blocks the
room's only exit path, FS-CMD-024 governs.

---

### FS-CMD-016 — Worker's back not to the door or to an open room volume

```yaml
id: FS-CMD-016
title: Worker's back not to the door or to an open room volume
system: psych.prospect_refuge
group: command_position
version: 1
status: active
applies_to:
  rooms: [home_office, home_office_shared, study_library, homework_nook, bedroom_teen,
          studio_apartment, dorm_room, open_plan_combined, great_room, loft, media_room]
  objects: [seating.desk_chair.*, worksurface.desk.*, seating.dining_chair.work]
  requires_features: []
  min_room_area_m2: 4.0
scope: object_placement
severity: high
confidence: evidence_moderate
evidence_class: empirical
belief_gated: false
predicate: |
  let seat = target.primarySeat or target
  let eye  = seat.seatedEyePoint
  let back = seat.rearHemisphere            # 180° behind the seated occupant

  let exposed_openings = count(room.openings) where o.kind in [door, doorway, arch, pass_through]
                         and inRegion(o.centroid, back)
                         and distance(seat.centroid, o.centroid) <= p.max_relevant_distance_m
  penalize(exposed_openings >= 1, weight=4)
  penalize(isovistArea(projectPoint(seat.centroid, seat.rearAxis, 0.5)) >= p.open_back_isovist_m2,
           weight=3)
  assert exposed_openings == 0
       or exists(others(*)) where inRegion(o.centroid, back)
          and o.footprint.h >= p.screen_height_m
          and subtendsAngle(o, seat.centroid) >= p.screen_coverage_deg
params:
  - key: max_relevant_distance_m
    default: 6.000
    range: [1.000, 15.000]
    unit: m
    user_editable: true
    rationale: Beyond this a rear opening stops driving the exposure feeling.
  - key: open_back_isovist_m2
    default: 12.0
    range: [3.0, 80.0]
    unit: m2
    user_editable: true
    rationale: Visible area behind the seat above which the back counts as an open volume.
  - key: screen_height_m
    default: 1.300
    range: [0.700, 2.400]
    unit: m
    user_editable: true
    rationale: Height of a rear screen or case good that restores the sense of enclosure.
  - key: screen_coverage_deg
    default: 90
    range: [30, 180]
    unit: deg
    user_editable: true
    rationale: Angular share of the rear hemisphere the screen must cover.
score:
  weight: 8
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: rotate_object
    target: seating.desk_chair.*
    transform: {to_pose: rear_to_wall, keep: lineOfSight(seat.seatedEyePoint, room.primaryDoor.centroid)}
    cost: free
    effort: low
    reversible: true
    copy: Swing the desk round so the open part of the room is in front of you, not behind.
  - rank: 2
    action: add_object
    add: softgoods.screen.acoustic
    transform: {position: behind_seat, min_height_m: 1.400, coverage_deg: 120}
    cost: medium
    effort: low
    reversible: true
    copy: An acoustic screen behind your chair gives you a back wall where the architecture does not.
  - rank: 3
    action: add_object
    add: storage.bookcase.open_back
    transform: {position: behind_seat, min_height_m: 1.500}
    cost: medium
    effort: medium_physical
    reversible: true
    copy: An open-backed bookcase works as a room divider and still lets light through.
  - rank: 4
    action: add_object
    add: plants.tree.potted_large
    transform: {position: behind_seat_flank}
    cost: low
    effort: low
    reversible: true
    copy: Two tall plants behind the chair are the softest way to define the edge of your workspace.
conflicts_with: [ERG-DESK-008, ACOU-OFF-006]
supersedes: []
requires_rules: []
tags: [desk, back_exposure, open_plan, prospect_refuge, evidence_backed]
localization_notes: >
  This rule is deliberately not belief-gated: it fires for every user because the mechanism is
  independent of feng shui. The feng shui framing is added to the explanation only when the
  belief system is enabled.
```

#### Why — tradition
Feng shui's objection to an exposed back is the missing Black Turtle 玄武 of FS-CMD-001, and
BTB teaching treats "back to the door" as the cardinal desk error. This rule exists separately
from FS-CMD-015 because the evidence supports it on its own terms, so the engine can fire it
for users who have not enabled feng shui — the tradition here is the *label*, not the reason.

#### Why — psychology / physiology
Kim and de Dear's open-plan analysis (*Journal of Environmental Psychology*, 36, 2013, 18–26)
found privacy and proxemics penalties outweighing the collaboration benefits of open layouts,
and rear exposure at a workstation reproduces that condition in miniature. Prospect–refuge
theory (Appleton, 1975) predicts the preference directly; Benedikt's isovists (1979) make the
"open volume behind" condition measurable. The interruption mechanism is concrete: with no
rear visibility the occupant either monitors, turns, or is startled, and each of those is a
cost to sustained attention. This is one of the few rules in this file where the
evidence-backed version and the traditional version prescribe the same geometry, which is the
strongest content the app has.

#### Customer insight
Working with your back to a doorway or to the open part of the room keeps a small part of you
on alert all day. Turn the desk so the room is in front of you — or, if it cannot move, put a
screen, a bookcase or a couple of tall plants behind your chair.

#### Failure modes / when to skip
Skip where the exposed-back condition is unavoidable and the room is a shared workspace whose
layout is not the user's to change. Skip where the rear "opening" is a closet door in a room
the occupant is alone in. Do not fire on a dining chair used for occasional laptop work unless
the user has marked the spot as their workstation. Any screen recommendation must not reduce
the room's egress path below the ergonomics minimum.

---

### FS-CMD-017 — Desk not directly facing or backing a window

```yaml
id: FS-CMD-017
title: Desk not directly facing or backing a window
system: feng_shui.form_school
group: command_position
version: 1
status: active
applies_to:
  rooms: [home_office, home_office_shared, study_library, homework_nook, bedroom_teen,
          studio_apartment, dorm_room, loft, sunroom_conservatory, attic_finished]
  objects: [worksurface.desk.*, electronics.monitor.*]
  requires_features: []
  min_room_area_m2: 4.0
scope: object_placement
severity: medium
confidence: mixed
evidence_class: mixed
belief_gated: false
predicate: |
  let desk = target
  let seat = desk.primarySeat
  forEach o in room.openings where o.kind in [window, sliding, french, skylight]
    # facing a window head-on: glare and no refuge
    penalize(alignedWithin(seat.faceAxis, o.openingAxis, tol_deg=p.face_tol_deg)
             and glareRisk(seat, o) >= p.max_glare_risk, weight=3)
    # backing a window: no support behind, plus screen reflections
    penalize(inRegion(o.centroid, seat.rearHemisphere)
             and distance(seat.centroid, o.centroid) <= p.rear_window_distance_m, weight=3)
  prefer angleBetween(seat.faceAxis, nearestWindow(desk).openingAxis) between [60, 120]
  prefer viewToOutside(seat.seatedEyePoint) == true
  assert glareRisk(seat, nearestWindow(desk)) <= p.max_glare_risk
params:
  - key: face_tol_deg
    default: 25
    range: [0, 60]
    unit: deg
    user_editable: true
    rationale: Tolerance for calling the worker "facing the window head-on".
  - key: max_glare_risk
    default: 0.35
    range: [0.00, 1.00]
    unit: ratio
    user_editable: true
    rationale: Glare index above which the position is unacceptable regardless of tradition.
  - key: rear_window_distance_m
    default: 2.000
    range: [0.500, 6.000]
    unit: m
    user_editable: true
    rationale: Distance behind the seat within which glazing counts as an unsupported back.
  - key: prefer_side_daylight
    default: true
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: When on, the generator places daylight to the side of the worker rather than front or rear.
score:
  weight: 6
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: rotate_object
    target: worksurface.desk.*
    transform: {to_pose: window_to_side, keep: lineOfSight(seat.seatedEyePoint, room.primaryDoor.centroid)}
    cost: free
    effort: low
    reversible: true
    copy: Turn the desk so daylight comes from the side — you keep the view and lose the glare.
  - rank: 2
    action: add_object
    add: softgoods.blind.light_filtering
    transform: {position: window_in_view, type: top_down_bottom_up}
    cost: medium
    effort: low
    reversible: true
    copy: A light-filtering blind keeps the outlook while taking the hard edge off the brightness.
  - rank: 3
    action: add_object
    add: storage.credenza.low
    transform: {position: between(seat, window), min_height_m: 0.750}
    cost: medium
    effort: medium_physical
    reversible: true
    copy: A low credenza under the window behind you gives your chair something solid to back onto.
conflicts_with: [DAY-GLARE-004, BIO-VIEW-002, ERG-MON-003]
supersedes: []
requires_rules: [FS-CMD-015]
tags: [desk, window, glare, daylight, back_exposure, biophilia]
localization_notes: >
  Glare severity depends on window orientation, latitude, hemisphere and climate zone; those
  are DAY-* concerns. Feng shui's objection is orientation-independent.
```

#### Why — tradition
Form school treats glass behind a working position exactly as it treats glass behind a bed —
a hole where the mountain should be. Facing a window head-on is a softer and more contested
objection: some BTB teachers actively encourage a desk facing a garden view as nourishing
*qi*, while others hold that the worker should face into the room to command it. The app
should present this as a genuine internal disagreement within the Western literature and let
the glare test arbitrate.

#### Why — psychology / physiology
This one is settled by ergonomics, not tradition. Standard display-ergonomics guidance is to
orient a screen and a worker so that windows fall to the side rather than directly in front of
or behind the worker: a window in front produces veiling glare and a very high luminance ratio
against the task; a window behind produces specular reflections on the display. Both degrade
visual performance and are associated with eye strain and posture compensation. Against that,
access to a view is one of the better-supported restorative features of a workspace, so the
correct answer is daylight and view to the *side*, which also happens to satisfy the
traditional back-support requirement.

#### Customer insight
Put the window beside you rather than in front of or behind you. Facing it means squinting
into the brightness all afternoon; backing it means reflections across your screen. From the
side you get the light and the view with neither problem.

#### Failure modes / when to skip
Skip in rooms with a single glazed wall and no alternative — go to the blind remedy. Skip for
north-facing glazing in the northern hemisphere (or south-facing in the southern) with a low
measured glare risk, where facing the window is genuinely pleasant; the glare assert handles
this automatically. Do not fire on a laptop used occasionally at a window seat. Where the user
has a strong biophilic-view preference, let BIO-VIEW-002 win and surface the glare mitigation
instead.

---

### FS-CMD-018 — Cooktop in the commanding position

```yaml
id: FS-CMD-018
title: Cooktop in the commanding position (cook not backing the entry)
system: feng_shui.form_school
group: command_position
version: 1
status: active
applies_to:
  rooms: [kitchen, eat_in_kitchen, open_plan_combined, great_room, studio_apartment,
          butlers_pantry, adu_in_law_suite, loft]
  objects: [kitchen.range.*, kitchen.cooktop.*]
  requires_features: []
  min_room_area_m2: 5.0
scope: object_placement
severity: high
confidence: mixed
evidence_class: mixed
belief_gated: true
predicate: |
  let hob  = target
  let cook = hob.cookStandPoint            # standing position in front of the hob
  let eye  = cook.standingEyePoint
  let door = room.primaryDoor

  assert lineOfSight(eye, door.centroid) == true
       or lineOfSightViaReflection(eye, door.centroid) != null
  assert not alignedWithin(hob.faceAxis, door.openingAxis, tol_deg=p.door_axis_tol_deg)
  assert distance(hob.centroid, door.centroid) >= p.min_door_distance_m
  # fire and water should not be adjacent (five-element clash)
  forEach o in others(kitchen.sink.*, appliance.fridge.*, appliance.dishwasher.*)
    penalize(distance(hob.centroid, o.centroid) <= p.min_fire_water_distance_m
             and isOnSameRun(hob, o), weight=3)
  # hob not directly under a window, and not directly below an upper-floor toilet
  penalize(exists(nearestWallBehind(hob).openings) where o.kind in [window, sliding], weight=2)
  penalize(roomAbove(room) != null and roomAbove(room).type in
           [bathroom_full, bathroom_three_quarter, powder_room, ensuite]
           and overlaps(projectUp(hob), toiletFootprintIn(roomAbove(room))), weight=2)
params:
  - key: door_axis_tol_deg
    default: 15
    range: [0, 45]
    unit: deg
    user_editable: true
    rationale: Tolerance before the hob is read as sitting in the door's axis.
  - key: min_door_distance_m
    default: 1.200
    range: [0.600, 4.000]
    unit: m
    user_editable: true
    rationale: Distance from the entry to the hob; also a spill and collision buffer.
  - key: min_fire_water_distance_m
    default: 0.600
    range: [0.300, 1.500]
    unit: m
    user_editable: true
    rationale: Separation between hob and sink/fridge; also the standard hob-to-wet-zone working buffer.
  - key: allow_mirror_surrogate
    default: false
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: Whether a reflective splashback may satisfy the sightline; off by default because of grease and glare.
score:
  weight: 8
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: kitchen.cooktop.*
    transform: {to_run: island_or_peninsula, achieve: lineOfSight(cook.standingEyePoint, door.centroid)}
    cost: high
    effort: contractor
    reversible: false
    copy: Moving the hob to the island turns the cook to face the room — the textbook commanding kitchen.
  - rank: 2
    action: add_object
    add: decor.splashback.polished_steel
    transform: {position: wall_behind_hob, achieve: lineOfSightViaReflection(cook.standingEyePoint, door.centroid)}
    cost: medium
    effort: medium_physical
    reversible: true
    copy: A polished splashback behind the hob lets you see the doorway behind you while you cook.
  - rank: 3
    action: add_object
    add: decor.mirror.small_angled
    transform: {position: above_hob_side, aim: door.centroid}
    cost: low
    effort: low
    reversible: true
    copy: A small angled mirror to the side of the hob is the rental-friendly version of the same fix.
conflicts_with: [SAFE-FIRE-009, SAFE-CHILD-014, ERG-KIT-005]
supersedes: []
requires_rules: [FS-CMD-001]
tags: [stove, hob, kitchen, cook, sightline, fire_element, signature_rule]
localization_notes: >
  Classical practice also assigns an auspicious *facing* to the stove's fire mouth (the gas
  inlet or the appliance rear), which is a compass matter owned by FS-COMPASS-* / FS-BAZ-*.
  This rule handles only the form-school sightline and the fire/water adjacency.
```

#### Why — tradition
The stove is one of the three most important placements in a Chinese home, alongside the front
door and the bed, and both form school and BTB hold that the cook should not stand with their
back to the entry. Classical practice adds a compass layer this rule does not touch: the
"fire mouth" of the stove has an auspicious facing derived from the house's chart, and in
strict classical work that takes priority over the sightline. Fire and water adjacency — hob
next to sink or fridge — is a five-element clash (*shuǐ huǒ bù xiāng róng*) that both classical
and modern schools cite.

#### Why — psychology / physiology
The sightline has a straightforward ergonomic reading: someone working at a hot, spitting
appliance with their back to the room's traffic cannot see a child, a pet or a person
approaching, and turning with a hot pan is exactly the moment collisions happen. The fire/water
separation has an independent functional basis too — a wet zone immediately beside a hob mixes
splashing water with hot oil and leaves no dry landing space for pans, which is why kitchen
work-triangle guidance has always wanted a buffer between them. The *qi* framing has no
empirical support; the collision and splash mechanisms need none.

#### Customer insight
A cook should be able to see who is coming into the kitchen without turning round — it is a
feng shui principle and also plain sense when you are holding a hot pan. If the hob has to
stay on the back wall, a reflective splashback or a small angled mirror gives you the view.

#### Failure modes / when to skip
Skip in galley and single-run kitchens under about 6 m² (65 ft²) where the hob position is
fixed by the extract duct and the gas line; go to the reflective remedy. Never propose a hob
move that breaches the fire clearances, the extract requirements or the child-safety guard
rules — those are blocking and owned by the safety file. Do not propose a reflective splashback
where it would put glare into the cook's eyes from a window or downlight.

---

### FS-CMD-019 — Sofa in the commanding position

```yaml
id: FS-CMD-019
title: Sofa in the commanding position
system: feng_shui.form_school
group: command_position
version: 1
status: active
applies_to:
  rooms: [living_room, family_room, great_room, media_room, studio_apartment,
          open_plan_combined, basement_finished, loft, guest_suite, dorm_room]
  objects: [seating.sofa.*, seating.sectional.*]
  requires_features: []
  min_room_area_m2: 8.0
scope: object_placement
severity: high
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let sofa = target
  let eye  = sofa.centreSeatEyePoint
  let door = room.primaryDoor

  assert backsToWall(sofa, min_contact_pct=p.back_contact_pct)
       or exists(others(tables.console.*, storage.credenza.*, storage.bookcase.*))
          where isBehind(o, sofa) and o.footprint.h >= p.surrogate_back_height_m
          and distance(o, sofa) <= p.surrogate_back_gap_m
  assert lineOfSight(eye, door.centroid) == true
  assert not alignedWithin(sofa.centerAxis, door.openingAxis, tol_deg=p.door_axis_tol_deg)
  forbid pathCrossesSeatingZone(door, room.mainRoute, sofa.legZone) == true
        and pathWidth(door, room.farSide) < p.min_bypass_width_m
  prefer clearance(sofa, front) >= p.min_front_clearance_m
  prefer isovistArea(eye) >= p.min_front_isovist_m2
  penalize(exists(nearestWallBehind(sofa).openings) where o.kind in [window, sliding, french]
           and o.sill_m <= sofa.backHeight_m, weight=2)
params:
  - key: back_contact_pct
    default: 60
    range: [20, 100]
    unit: pct
    user_editable: true
    rationale: Share of the sofa's back that must touch a wall to count as supported.
  - key: surrogate_back_height_m
    default: 0.750
    range: [0.400, 2.000]
    unit: m
    user_editable: true
    rationale: Height of a console behind a floated sofa that reads as backing.
  - key: surrogate_back_gap_m
    default: 0.250
    range: [0.000, 0.600]
    unit: m
    user_editable: true
    rationale: Gap before the console stops reading as attached.
  - key: door_axis_tol_deg
    default: 20
    range: [0, 45]
    unit: deg
    user_editable: true
    rationale: Tolerance before the sofa sits in the door's axis.
  - key: min_front_clearance_m
    default: 0.900
    range: [0.400, 2.500]
    unit: m
    user_editable: true
    rationale: Open floor in front of the sofa; the ergonomics file owns the hard minimum.
  - key: min_bypass_width_m
    default: 0.900
    range: [0.600, 1.500]
    unit: m
    user_editable: true
    rationale: Width of the route that lets traffic pass without crossing the seating group.
  - key: min_front_isovist_m2
    default: 10.0
    range: [3.0, 80.0]
    unit: m2
    user_editable: true
    rationale: Visible floor area in front of the main seat.
score:
  weight: 8
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: seating.sofa.*
    transform: {to_wall: longest_solid_wall, achieve: lineOfSight(sofa.centreSeatEyePoint, door.centroid)}
    cost: free
    effort: high_physical
    reversible: true
    copy: Put the sofa's back to the longest solid wall, angled so you can see the doorway from the middle seat.
  - rank: 2
    action: add_object
    add: tables.console.sofa_back
    transform: {position: behind_sofa, gap_m: 0.050, min_height_m: 0.750}
    cost: medium
    effort: low
    reversible: true
    copy: If the sofa floats in the room, a console table behind it acts as the wall and tidies the back view.
  - rank: 3
    action: rotate_object
    target: seating.sofa.*
    transform: {rot_delta_deg: 90, keep: viewingAngle(seat, display) <= 30}
    cost: free
    effort: high_physical
    reversible: true
    copy: A quarter turn often gets the sofa off the door line without spoiling the view of the television.
conflicts_with: [ERG-CLR-020, MEDIA-VIEW-003]
supersedes: []
requires_rules: [FS-CMD-001]
tags: [sofa, living_room, sightline, back_support, traffic]
localization_notes: Hemisphere-invariant.
```

#### Why — tradition
The main sofa is the room's seat of authority, so it receives the armchair treatment: solid
wall behind, open floor in front, and a view of the way in. Both form school and BTB apply the
commanding-position test to the principal seating group, and both dislike a sofa with its back
to a door or floating with an open void behind. Classical practice adds sector-based
preferences for which wall the sofa should occupy, which belongs to the bagua rules rather than
here.

#### Why — psychology / physiology
Rear enclosure and forward visibility are the prospect–refuge conditions (Appleton, 1975), and
the same isovist logic applies as at a desk. There is a separate and quite practical
circulation mechanism: a sofa placed so the route from the door crosses in front of it forces
every passer-by through the conversation zone and the sightline to the television, which is a
well-known cause of low-grade irritation in shared living rooms and is addressed in
pattern-language and space-syntax terms (Hillier and Hanson, *The Social Logic of Space*,
Cambridge University Press, 1984). No empirical support exists for a *qi* mechanism.

#### Customer insight
Give the sofa a solid wall behind it and keep the walkway from the door behind or beside it
rather than across the front. You will notice it most when people come and go: nobody has to
step through the middle of the conversation.

#### Failure modes / when to skip
Skip in open-plan rooms where the sofa is deliberately used as the room divider and a console
already backs it. Skip in rooms under 8 m² (86 ft²) where any sofa position touches a wall.
Do not fire when the television wall and the only solid wall are the same wall and the sofa
must face it. Media-room viewing geometry (screen distance and angle) outranks this rule in
`home_theater` and `media_room`.

---

### FS-CMD-020 — Primary armchair as the seat of honour

```yaml
id: FS-CMD-020
title: Primary armchair as the seat of honour
system: feng_shui.form_school
group: command_position
version: 1
status: active
applies_to:
  rooms: [living_room, family_room, great_room, study_library, home_office, media_room,
          sunroom_conservatory, bedroom_primary, loft]
  objects: [seating.armchair.*, seating.recliner.*, seating.wingback.*]
  requires_features: []
  min_room_area_m2: 7.0
scope: object_placement
severity: medium
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let ch  = target
  let eye = ch.seatedEyePoint
  let door = room.primaryDoor
  assert ch.isPrimarySeat == true
  prefer lineOfSight(eye, door.centroid) == true
  prefer distanceFromCorner(ch) <= p.max_corner_distance_m       # tucked, not marooned
  prefer backsToWall(ch, min_contact_pct=p.back_contact_pct)
       or flankMassHeight(ch, left) > 0 and flankMassHeight(ch, right) > 0
  prefer viewToOutside(eye) == true
  prefer isovistArea(eye) >= p.min_isovist_m2
  penalize(inRegion(door.centroid, ch.rearHemisphere), weight=3)
  penalize(isFloating(ch) and flankMassHeight(ch, left) == 0
           and flankMassHeight(ch, right) == 0, weight=2)
  # wing/high-back chairs supply their own refuge
  prefer ch.backHeight_m >= p.refuge_back_height_m when isFloating(ch)
params:
  - key: max_corner_distance_m
    default: 1.200
    range: [0.300, 3.000]
    unit: m
    user_editable: true
    rationale: How close the chair sits to a corner; corners supply two-sided enclosure.
  - key: back_contact_pct
    default: 40
    range: [0, 100]
    unit: pct
    user_editable: true
    rationale: Wall contact behind the chair; lower than a sofa because armchairs are often angled.
  - key: min_isovist_m2
    default: 8.0
    range: [2.0, 60.0]
    unit: m2
    user_editable: true
    rationale: Visible floor area from the seat.
  - key: refuge_back_height_m
    default: 1.050
    range: [0.700, 1.500]
    unit: m
    user_editable: true
    rationale: Back height at which a chair provides its own enclosure and may float.
score:
  weight: 5
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: seating.armchair.*
    transform: {to_zone: corner_with_outlook, achieve: lineOfSight(eye, door.centroid) and viewToOutside(eye)}
    cost: free
    effort: low
    reversible: true
    copy: Angle the chair into a corner where you can see both the doorway and the window.
  - rank: 2
    action: add_object
    add: lighting.floor_lamp.arc
    transform: {position: chair_flank_deficient_side}
    cost: low
    effort: low
    reversible: true
    copy: A floor lamp on the open side gives the chair its second arm and makes it a real reading spot.
  - rank: 3
    action: replace_object
    target: seating.armchair.low_back
    add: seating.wingback.*
    transform: {position: same}
    cost: high
    effort: low
    reversible: false
    copy: A high-backed or wing chair carries its own shelter, which is why it works floating in a room.
conflicts_with: [ERG-CLR-020]
supersedes: []
requires_rules: [FS-CMD-001]
tags: [armchair, seat_of_honour, refuge, reading_nook, dragon_tiger]
localization_notes: >
  The "seat of honour" convention (the seat facing the entrance, furthest from it) is shared
  between Chinese banquet etiquette and Western dining convention; it is cultural, not
  physical, and product copy should not moralise about it.
```

#### Why — tradition
The best chair in the room is the *zhǔ wèi*, the host or honour seat: furthest from the
entrance, facing it, with support behind and a good outlook. This is etiquette as much as
geomancy — Chinese banquet and reception seating has long placed the senior person in exactly
the position form school describes as commanding — and the two reinforce each other. Wing
chairs and high-backed chairs are the Western furniture answer to the same requirement; a
high back supplies the Black Turtle where the architecture does not.

#### Why — psychology / physiology
This is the purest prospect–refuge case in the file (Appleton, 1975): a corner seat with a
high back, one open side, an outward view and the entry in sight sits precisely at the
prospect/refuge interface Appleton predicted people would prefer. Isovist measures make the
prospect half computable (Benedikt, 1979). Proxemic and territorial work — Hall's *The Hidden
Dimension* (1966) and Sommer's *Personal Space* (1969) — describes the same preference for
defensible, bounded personal positions, though neither supplies an effect size for furniture
geometry. No empirical support for the honour-seat convention having any effect beyond social
signalling.

#### Customer insight
Every room has one seat people gravitate to: high back, corner position, a window on one side
and a clear view of the door. Set one chair up that way deliberately and it becomes the chair
everyone fights over.

#### Failure modes / when to skip
Only fires on the chair marked as primary; skip for secondary or occasional chairs, dining
chairs pulled into a room, and stacking seating. Skip where the chair is part of a symmetrical
pair flanking a fireplace — that is a composition rule and outranks this one. Do not push the
chair into a corner where the reading light or the outlet cannot reach.

---

### FS-CMD-021 — Dining seat of honour and no seat backing the entry

```yaml
id: FS-CMD-021
title: Dining seat of honour; no diner backing the entry
system: feng_shui.form_school
group: command_position
version: 1
status: active
applies_to:
  rooms: [formal_dining, eat_in_kitchen, breakfast_nook, great_room, open_plan_combined,
          studio_apartment, loft, kitchen]
  objects: [seating.dining_chair.*, tables.dining.*, seating.banquette.*]
  requires_features: []
  min_room_area_m2: 6.0
scope: object_placement
severity: medium
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let tbl = target
  let door = room.primaryDoor
  let seats = seatsAround(tbl)

  # at least one seat must be a true honour seat
  assert exists(seats) where lineOfSight(s.seatedEyePoint, door.centroid)
        and backsToWall(s, min_contact_pct=p.back_contact_pct)
        and distance(s.centroid, door.centroid) >= p.honour_min_door_distance_m

  # penalise every seat whose back is to a door or to a stair opening
  forEach s in seats
    penalize(inRegion(door.centroid, s.rearHemisphere)
             and distance(s.centroid, door.centroid) <= p.rear_door_distance_m, weight=2)
    penalize(exists(room.features) where f.kind == stair_opening
             and inRegion(centroid(f), s.rearHemisphere), weight=1)
  # table not straddling the through-route between two doors
  penalize(straightRunLength(door.centroid, oppositeOpening(door).centroid) > 0
           and overlaps(bbox(tbl), runCorridor(door, oppositeOpening(door), width_m=p.run_width_m)),
           weight=3)
  prefer countOf(seating.dining_chair.*, scope=around(tbl)) % 2 == 0
params:
  - key: back_contact_pct
    default: 30
    range: [0, 100]
    unit: pct
    user_editable: true
    rationale: Wall backing required of the honour seat.
  - key: honour_min_door_distance_m
    default: 1.500
    range: [0.600, 6.000]
    unit: m
    user_editable: true
    rationale: Minimum distance from the entry for a seat to count as the honour seat.
  - key: rear_door_distance_m
    default: 3.000
    range: [1.000, 8.000]
    unit: m
    user_editable: true
    rationale: Distance within which a door behind a diner counts against the seat.
  - key: run_width_m
    default: 1.000
    range: [0.600, 2.000]
    unit: m
    user_editable: true
    rationale: Width of the notional through-route corridor tested against the table footprint.
  - key: prefer_even_seat_count
    default: true
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: Even numbers are considered auspicious and balanced in Chinese practice; purely traditional.
score:
  weight: 5
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: tables.dining.*
    transform: {offset: off_through_route, min_offset_m: 0.500}
    cost: free
    effort: medium_physical
    reversible: true
    copy: Shift the table off the walking line between the two doorways so nobody is squeezing past a chair.
  - rank: 2
    action: rearrange_seats
    target: seating.dining_chair.*
    transform: {assign: honour_seat_to primary_user, remove_seats_backing: door}
    cost: free
    effort: low
    reversible: true
    copy: Take the chairs off the side that backs the doorway and seat people along the wall side instead.
  - rank: 3
    action: add_object
    add: seating.banquette.*
    transform: {position: wall_side_of_table}
    cost: high
    effort: contractor
    reversible: false
    copy: A built-in banquette on the wall side gives everyone a solid back and frees the traffic side.
  - rank: 4
    action: add_object
    add: decor.mirror.wall
    transform: {position: wall_facing_honour_seat, forbid: reflects(room.toilet_door)}
    cost: medium
    effort: low
    reversible: true
    copy: A mirror on the far wall is the traditional dining-room addition — it doubles the table and lets the wall-side diners see the room.
conflicts_with: [ERG-DIN-004]
supersedes: []
requires_rules: [FS-CMD-001]
tags: [dining, seat_of_honour, banquette, traffic, etiquette]
localization_notes: >
  The mirror-in-the-dining-room recommendation is a specifically Chinese practice (doubling the
  food on the table); it must never be offered in a position that reflects a toilet, a stove or
  the front door. Even seat counts are a Chinese preference, not a universal one.
```

#### Why — tradition
Chinese practice treats the dining table as a wealth and family-harmony centre and applies both
banquet etiquette and form-school geometry to it: the honour seat faces the entrance from the
furthest side with a wall behind, no diner should sit with their back to the door, and the
table should not sit in a through-route. The dining-room mirror that "doubles the food" is one
of the few positively-prescribed placements in popular feng shui, and BTB in particular
recommends it. Even numbers of seats are conventionally preferred. Classical compass schools
add sector preferences for the dining area, handled elsewhere.

#### Why — psychology / physiology
The circulation part is real and measurable: a table that straddles the route between two
openings puts diners' chair backs in the traffic path, which produces repeated interruptions
and chair-shuffling. The back-to-door discomfort is prospect–refuge again (Appleton, 1975) plus
proxemics — Hall (1966) and Sommer (1969) both describe the preference for bounded, defensible
seating positions, and restaurant designers have exploited it with banquettes and booths for a
century. No empirical support for the mirror doubling anything, or for even seat counts
mattering; both are tradition and should be labelled as such.

#### Customer insight
Nobody enjoys the dinner seat with its back to the doorway — you spend the meal half-turning.
Put the chairs along the wall side, keep the walking route clear of chair backs, and give the
best seat the view of the room.

#### Failure modes / when to skip
Skip in breakfast nooks and banquettes where the geometry is fixed by joinery. Skip round
tables in the centre of a dedicated dining room where no seat has a wall — the honour-seat
assert should be relaxed by dropping `back_contact_pct` to 0. Do not fire the even-seat
preference for users who have not enabled feng shui; it is pure tradition. Never place the
dining mirror where it reflects a toilet door, a hob or the front door.

---

### FS-CMD-022 — Toilet not aligned with, or facing, the bathroom door

```yaml
id: FS-CMD-022
title: Toilet not aligned with, or directly facing, the bathroom door
system: feng_shui.form_school
group: command_position
version: 1
status: active
applies_to:
  rooms: [bathroom_full, bathroom_three_quarter, powder_room, ensuite, jack_and_jill_bath,
          wet_room]
  objects: [bath.toilet.*, bath.bidet.*]
  requires_features: []
  min_room_area_m2: 1.5
scope: object_placement
severity: medium
confidence: mixed
evidence_class: mixed
belief_gated: true
predicate: |
  let wc   = target
  let door = room.primaryDoor
  penalize(alignedWithin(wc.faceAxis, door.openingAxis, tol_deg=p.axis_tol_deg), weight=3)
  penalize(lineOfSight(door.outsideApproachPoint, wc.centroid) == true, weight=3)
  prefer sightlineBlockedBy(door.outsideApproachPoint, wc.centroid) != null
  prefer distance(wc.centroid, door.centroid) >= p.min_door_distance_m
  # and the corridor version: a toilet visible from a bedroom door or the front door
  forEach d in home.openings where d.kind == door and d.leads_to_room_id == room.id
    penalize(lineOfSight(d.outsideApproachPoint, wc.centroid), weight=2)
params:
  - key: axis_tol_deg
    default: 20
    range: [0, 45]
    unit: deg
    user_editable: true
    rationale: Tolerance for calling the toilet "in line with" the door.
  - key: min_door_distance_m
    default: 0.900
    range: [0.300, 3.000]
    unit: m
    user_editable: true
    rationale: Distance from door to pan; in tiny WCs this is unobtainable.
  - key: require_visual_screen
    default: false
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: Strict mode requiring something (vanity, half wall, door leaf) to interrupt the sightline.
score:
  weight: 4
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: bath.toilet.*
    transform: {to_wall: wall_perpendicular_to_door, keep: needs(drain)}
    cost: high
    effort: contractor
    reversible: false
    copy: In a refit, put the pan on a side wall so it is not the first thing you see through the door.
  - rank: 2
    action: reverse_swing
    target: room.primaryDoor
    transform: {swing: to_screen_toilet}
    cost: low
    effort: medium_physical
    reversible: true
    copy: Rehanging the door so the open leaf screens the toilet is a cheap and surprisingly effective fix.
  - rank: 3
    action: add_object
    add: bath.vanity.*
    transform: {position: between(door, toilet)}
    cost: high
    effort: contractor
    reversible: false
    copy: A vanity or half-height wall between the door and the pan interrupts the view.
  - rank: 4
    action: behavior_rule
    target: room.primaryDoor
    transform: {habit: keep_door_closed, and: keep_lid_down}
    cost: free
    effort: low
    reversible: true
    copy: Keeping the door shut and the lid down is the zero-cost version, and it is the traditional instruction anyway.
conflicts_with: [ERG-BATH-003, ACC-BATH-011]
supersedes: []
requires_rules: []
tags: [toilet, bathroom, privacy, sightline, huì_qì]
localization_notes: >
  Bathroom privacy zoning is culturally variable and strongly emphasised in Islamic privacy
  practice (see islamic.privacy_zoning rules) and in South Asian vastu. The feng shui reading
  here is about draining *qi*; the privacy reading is independent and often more persuasive.
```

#### Why — tradition
A pan in direct line with the door is treated as exposing the home's most *yin*, draining
fixture to the circulating *qi*, and the standard instructions are to screen it, to keep the
door closed and to keep the lid down. Form school and BTB agree. Classical compass practice
handles bathrooms almost entirely by sector — which of the house's nine palaces or twenty-four
mountains the room occupies — and would not usually raise the door-alignment question at all.
The commanding-position framing does not really apply to a toilet: no school asks the user to
"command" the room from the pan; the doctrine here is concealment, and the app should say so
rather than stretch the command-position metaphor.

#### Why — psychology / physiology
The privacy mechanism is real and does not need tradition: a pan in direct sightline of an
opened door means partial exposure every time someone else opens it, and in shared and
multigenerational households that is a genuine source of friction. Odour and aerosol dispersal
on flushing is also a documented reason to keep the lid down and the door closed, which is
independently why the behavioural remedy is worth offering. No empirical support for a *qi*
drainage mechanism.

#### Customer insight
The toilet should not be the first thing you see when the bathroom door opens. Rehanging the
door so it screens the pan, or simply keeping the door shut and the lid down, handles it —
which is exactly what the tradition asks for anyway.

#### Failure modes / when to skip
Skip in powder rooms and WCs under about 1.5 m² (16 ft²) where the pan is necessarily opposite
the door. Skip where moving the pan would breach the accessible transfer clearance or the
mandated clear floor space — accessibility wins. Do not recommend a door-swing reversal that
makes the door open into a circulation path or reduces the clear opening width. This rule is
never more than `medium`; the bathroom room file owns the privacy zoning.

---

### FS-CMD-023 — Commanding position in a studio or one-room home

```yaml
id: FS-CMD-023
title: Commanding position in a studio or one-room home
system: feng_shui.btb_western
group: command_position
version: 1
status: active
applies_to:
  rooms: [studio_apartment, dorm_room, loft, adu_in_law_suite, guest_suite, bedroom_shared_siblings]
  objects: [sleep.bed.*, worksurface.desk.*, seating.sofa.*, kitchen.cooktop.*]
  requires_features: []
  min_room_area_m2: 0.0
scope: room_composition
severity: high
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  # One room does everything, so command position must be rationed, not repeated.
  let door = room.primaryDoor
  let claims = [sleep.bed.*, worksurface.desk.*, seating.sofa.*, kitchen.cooktop.*]
  let present = claims where exists(room.objects of that type)

  # 1. exactly one object holds the commanding zone, chosen by the user's priority
  let holder = user.commandPriority or sleep.bed.*
  assert commandScore(holder, door) >= p.min_holder_command_score
  forEach o in present where o != holder
    prefer commandScore(o, door) >= p.min_other_command_score

  # 2. every remaining occupied position must at least not back a door and not sit in its axis
  forEach o in present
    assert not alignedWithin(o.centerAxis, door.openingAxis, tol_deg=p.door_axis_tol_deg)
    prefer not inRegion(door.centroid, o.occupantRearHemisphere)

  # 3. zones must be separated by something, since there are no walls
  assert countOf(divider_like, scope=room) >= p.min_dividers
       or exists(room.objects) where o.type in [storage.bookcase.open_back, softgoods.screen.folding,
                                                softgoods.curtain.room_divider, plants.screen.*]

  # 4. the bed should not be the first thing seen from the entry
  prefer sightlineBlockedBy(door.insideApproachPoint, bedOf(room).pillowCenter) != null
params:
  - key: min_holder_command_score
    default: 0.70
    range: [0.30, 1.00]
    unit: ratio
    user_editable: true
    rationale: How well the priority piece must satisfy the commanding-position composite.
  - key: min_other_command_score
    default: 0.35
    range: [0.00, 1.00]
    unit: ratio
    user_editable: true
    rationale: Floor for the pieces that lose the contest; below this they are actively bad, not merely compromised.
  - key: door_axis_tol_deg
    default: 15
    range: [0, 45]
    unit: deg
    user_editable: true
    rationale: Tolerance before a piece counts as sitting in the entry axis.
  - key: min_dividers
    default: 1
    range: [0, 4]
    unit: count
    user_editable: true
    rationale: Number of zone-defining elements required in a one-room home.
  - key: command_priority
    default: bed
    range: [bed, desk, sofa, cooktop]
    unit: enum
    user_editable: true
    rationale: Which function gets the single commanding position; this is the key user choice in a studio.
score:
  weight: 9
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: assign_zone
    target: user.commandPriority
    transform: {to_zone: commanding_zone}
    cost: free
    effort: high_physical
    reversible: true
    copy: In a studio only one thing can hold the best spot. Pick what matters most — for most people that is the bed — and give it the diagonal corner.
  - rank: 2
    action: add_object
    add: storage.bookcase.open_back
    transform: {position: between(sleep_zone, living_zone), min_height_m: 1.500}
    cost: medium
    effort: medium_physical
    reversible: true
    copy: An open-backed shelf unit between the bed and the living area gives you two rooms without blocking the light.
  - rank: 3
    action: add_object
    add: softgoods.curtain.room_divider
    transform: {position: ceiling_track_across_sleep_zone}
    cost: low
    effort: medium_physical
    reversible: true
    copy: A ceiling-track curtain you draw at night is the cheapest way to make the sleeping corner its own room.
  - rank: 4
    action: replace_object
    target: sleep.bed.*
    add: sleep.sofa_bed.*
    transform: {position: living_zone}
    cost: high
    effort: low
    reversible: false
    copy: If the studio is genuinely too small to zone, a good sofa bed lets the room be one thing at a time instead of two things at once.
conflicts_with: [SAFE-EGR-003, ERG-CLR-012]
supersedes: [FS-CMD-002, FS-CMD-015, FS-CMD-019]
requires_rules: [FS-CMD-001]
tags: [studio, small_space, zoning, command_position, rationing, signature_rule]
localization_notes: >
  This rule supersedes the individual commanding-position rules inside studio-type rooms so
  the engine does not report four unsatisfiable findings for one room. It must explain the
  trade-off to the user rather than silently downgrade.
```

#### Why — tradition
Classical feng shui assumes a multi-room courtyard dwelling, so it has nothing direct to say
about a one-room flat; the studio problem is a modern Western practice question, and BTB-derived
practitioners answer it by ranking functions and giving the commanding position to the most
important one — almost always the bed, on the grounds that sleep is when a person is most
vulnerable. The second traditional instruction is to *define* the zones: because there are no
walls, screens, curtains, rugs and open shelving are asked to do the walls' symbolic work of
separating *yin* sleeping from *yang* activity. Concealing the bed from the entry is the third.

#### Why — psychology / physiology
Zoning a one-room dwelling has real behavioural support in the habit and sleep-hygiene
literature: distinct spatial cues for sleeping and for waking activity support stimulus
control, and the general finding that the bed should be associated with sleep rather than with
work is standard clinical sleep-hygiene advice. Space-syntax reasoning (Hillier and Hanson,
1984) explains why a single undivided convex space offers no privacy gradient at all — every
point sees every other point — and why a partial divider changes the room's social behaviour
disproportionately to its size. The ranking of bed over desk over sofa is a value judgement,
not a finding.

#### Customer insight
In a studio, only one thing can have the best spot in the room, so choose deliberately —
usually the bed. Then give the sleeping corner an edge of its own with an open shelf unit, a
curtain or even a rug, so the room stops being one space doing four jobs at once.

#### Failure modes / when to skip
Never fire in multi-room homes. Suppress the divider requirement in micro-studios under about
16 m² (172 ft²) where a divider would make the room unusable, and in rentals where ceiling
tracks cannot be fitted — fall back to the rug-and-orientation version. This rule must not
generate a divider that crosses the egress path or blocks the only window. If the user has
flagged the studio as temporary, drop severity to `low`.

---

### FS-CMD-024 — When command position conflicts with egress or safety

```yaml
id: FS-CMD-024
title: Resolution when command position conflicts with egress, accessibility or safety
system: product.ux
group: conflict_resolution
version: 1
status: active
applies_to:
  rooms: []
  objects: []
  requires_features: []
scope: whole_home
severity: high
confidence: expert_consensus
evidence_class: mixed
belief_gated: false
predicate: |
  # Meta-rule. Runs after all FS-CMD/FS-CHI/FS-DOOR/FS-STAIR findings are generated.
  forEach f in findings where f.rule.id startsWith "FS-"
    let blockers = findings where f2.severity == blocking
                   and f2.system startsWith "safety."
                   or (f2.system == "accessibility.ada" and user.needsAccessibleRoute)
                   and overlapsProposal(f.remedy, f2.constraint)
    require count(blockers) == 0 or suppress(f.remedy)
    require count(blockers) == 0 or emit(explanation, template=p.explanation_template)

  # never let a feng shui remedy do any of these
  forbid remedyReduces(pathWidth(room, egressDoor), below=p.min_egress_path_width_m)
  forbid remedyObstructs(opening) where opening.is_egress == true
  forbid remedyBlocks(feature) where feature.kind in [smoke_alarm, co_alarm, sprinkler_head, panel]
  forbid remedyReduces(doorSwingClear(opening), below=p.min_usable_swing_pct)
  forbid remedyReduces(turningCircle(room, p.wheelchair_turning_m), below=1.0)
        when user.needsAccessibleRoute == true
params:
  - key: min_egress_path_width_m
    default: 0.900
    range: [0.800, 1.500]
    unit: m
    user_editable: false
    jurisdiction_varies: true
    rationale: >
      Clear route width to an exit door. The IRC family sets a residential hallway width of not
      less than 3 ft (914 mm) (IRC R311.6); other code families differ, so this is a parameter,
      not an assertion.
  - key: min_usable_swing_pct
    default: 90
    range: [60, 100]
    unit: pct
    user_editable: false
    jurisdiction_varies: true
    rationale: >
      Share of a door's swing that must remain unobstructed. The IRC family requires the egress
      door to give a clear width of not less than 32 in (813 mm) at 90 degrees open
      (IRC R311.2); this parameter approximates that at layout scale.
  - key: wheelchair_turning_m
    default: 1.525
    range: [1.400, 1.800]
    unit: m
    user_editable: false
    jurisdiction_varies: true
    rationale: Turning-circle diameter used by accessible-design guidance; the accessibility file owns the authoritative value.
  - key: explanation_template
    default: safety_overrode_tradition
    range: [safety_overrode_tradition, silent, technical]
    unit: enum
    user_editable: true
    rationale: How the override is communicated; silent mode is available for designer tooling only.
score:
  weight: 1
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: emit_explanation
    target: user
    transform: {template: safety_overrode_tradition, name_rule: both}
    cost: free
    effort: low
    reversible: true
    copy: We could not put the bed in the ideal feng shui position here, because that spot would block your escape route. Safety comes first — here is the best position that keeps the route clear.
  - rank: 2
    action: propose_next_best
    target: blocked_object
    transform: {to_zone: second_best_command_zone, keep: egress_clear}
    cost: free
    effort: high_physical
    reversible: true
    copy: This is the next-best spot: you still see the door from the bed, and the way out stays clear.
  - rank: 3
    action: add_object
    add: decor.mirror.wall
    transform: {position: so_that lineOfSightViaReflection(occupantEye, door.centroid) != null}
    cost: low
    effort: low
    reversible: true
    copy: A well-placed mirror gets you most of the benefit without moving anything into the escape path.
conflicts_with: []
supersedes: []
requires_rules: []
tags: [conflict_resolution, precedence, egress, accessibility, product_requirement, meta_rule]
localization_notes: >
  Code dimensions vary by jurisdiction. Only the IRC-family figures actually cited above are
  asserted; every other value is a tunable default and must be verified against the local code
  family (IRC / IBC / ADA / NFPA / Eurocode / AS-NZS / NBC-India) before being presented as a
  requirement.
```

#### Why — tradition
Feng shui itself does not rank safety against auspiciousness, because the classical corpus
predates codified egress. Reputable modern practitioners of every school — classical and BTB
alike — do rank them, and will refuse a placement that traps an occupant. The honest statement
to the user is therefore that the tradition was silent, the product is not, and the product
chooses safety.

#### Why — psychology / physiology
Not a psychological rule but a product-integrity one. Users who hold a belief system need to
know *when* and *why* their belief lost, or they lose trust in the whole engine and disable it.
Stating the conflict explicitly also teaches the user the underlying geometry, which is the app's
educational job. Silently degrading a belief rule is the failure mode that produces the review
"it ignored feng shui"; saying "the commanding corner would block your escape window" produces
the review "it explained why".

#### Customer insight
Sometimes the best feng shui spot is the one place we cannot use — because it blocks a doorway,
an escape window or a smoke alarm. When that happens we will tell you plainly, and give you the
next-best position, usually with a mirror to make up the difference.

#### Failure modes / when to skip
This rule never fires on its own and never contributes to the score; it only suppresses and
explains. It must not be used to suppress a *medium* or *low* safety finding — only `blocking`
safety findings and, where the user has flagged a need, `accessibility.ada` findings outrank a
belief rule. Do not let it swallow ordinary trade-offs between two feng shui rules; those are
reported as trade-offs, not overrides.

---

### FS-CMD-025 — Sharp corner or column aimed at an occupied position

```yaml
id: FS-CMD-025
title: Sharp corner, column edge or shelf end aimed at an occupied position
system: feng_shui.form_school
group: poison_arrow
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, bedroom_guest, bedroom_child, bedroom_teen,
          living_room, family_room, great_room, home_office, home_office_shared, study_library,
          formal_dining, eat_in_kitchen, studio_apartment, loft, open_plan_combined,
          basement_finished, media_room]
  objects: [sleep.bed.*, worksurface.desk.*, seating.sofa.*, seating.armchair.*,
            seating.dining_chair.*, kitchen.cooktop.*]
  requires_features: []
  min_room_area_m2: 4.0
scope: object_pair
severity: medium
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let obj = target
  let z   = obj.occupantZone

  # architectural corners and columns
  forEach c in protrudingCorners(room)
    penalize(alignedWithin(cornerAimVector(c), directionTo(c, centroid(z)),
                           tol_deg=p.aim_tol_deg)
             and distance(c.point, centroid(z)) <= p.max_aim_distance_m
             and c.interiorAngle_deg <= p.max_corner_angle_deg, weight=3)
  forEach f in room.features where f.kind == column
    penalize(alignedWithin(cornerAimVector(nearestEdgeOf(f)), directionTo(f, centroid(z)),
                           tol_deg=p.aim_tol_deg)
             and distance(centroid(f), centroid(z)) <= p.max_aim_distance_m, weight=2)

  # furniture edges: open shelf ends, cabinet corners, console corners
  forEach o in others(storage.*, tables.*) where o.hasSharpEdge == true
    penalize(alignedWithin(edgeAimVector(o), directionTo(o, centroid(z)), tol_deg=p.aim_tol_deg)
             and distance(o.centroid, centroid(z)) <= p.furniture_aim_distance_m
             and heightOverlaps(o, obj.occupantBodyHeightBand), weight=2)
params:
  - key: aim_tol_deg
    default: 15
    range: [0, 45]
    unit: deg
    user_editable: true
    rationale: How precisely the corner's bisector must point at the occupant before it counts as aimed.
  - key: max_aim_distance_m
    default: 4.000
    range: [0.500, 10.000]
    unit: m
    user_editable: true
    rationale: Range beyond which an architectural corner stops registering.
  - key: furniture_aim_distance_m
    default: 1.500
    range: [0.200, 4.000]
    unit: m
    user_editable: true
    rationale: Range for furniture edges, which matter mainly when close enough to strike.
  - key: max_corner_angle_deg
    default: 100
    range: [45, 170]
    unit: deg
    user_editable: true
    rationale: Interior angle at or below which a corner reads as sharp; obtuse corners are exempt.
score:
  weight: 5
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: self
    transform: {offset: out_of_corner_aim_cone, min_offset_m: 0.400}
    cost: free
    effort: medium_physical
    reversible: true
    copy: Shift the bed or chair a little so the corner is no longer pointing straight at you.
  - rank: 2
    action: add_object
    add: plants.floor.soft_leaved
    transform: {position: at_corner_apex}
    cost: low
    effort: low
    reversible: true
    copy: A soft-leaved plant at the corner is the traditional cure — it rounds off the edge visually.
  - rank: 3
    action: add_object
    add: softgoods.curtain.corner_drape
    transform: {position: over_corner_apex}
    cost: low
    effort: low
    reversible: true
    copy: Draping fabric down the corner does the same job in a room with no floor space.
  - rank: 4
    action: modify_feature
    target: protruding_corner
    transform: {profile: bullnose_or_chamfer}
    cost: high
    effort: contractor
    reversible: false
    copy: If you are renovating, rounding the corner bead removes the problem permanently — and stops people bruising their hips on it.
conflicts_with: []
supersedes: []
requires_rules: []
tags: [poison_arrow, secret_arrow, corner, column, sha_qi, impact_hazard]
localization_notes: Hemisphere-invariant. Cross-reference the child-safety corner-guard rules for households with toddlers.
```

#### Why — tradition
A right-angled corner, a column edge or the end of a run of shelving aimed at a person is a
*secret arrow* or *poison arrow* — the most widely known form of *shā qì* (煞氣), in which
sharp lines and edges are said to shoot harsh energy along their bisector. Form school owns
this doctrine and applies it at every scale, from a neighbouring roof ridge pointing at a front
door down to a bookshelf corner aimed at a pillow. BTB retains it and supplies the standard
soft cures: a plant, a fabric drape, a rounded object, or simply moving out of the line.
Classical compass schools do not use the concept.

#### Why — psychology / physiology
No direct empirical support for a *qi* mechanism; the plausible-but-untested account is that a
converging pair of edges creates a strong perceptual vector that repeatedly draws the eye —
edge and corner detection is among the earliest stages of visual processing, so a sharp
convergence in the visual field is genuinely salient. There is, however, a completely real and
non-mystical reason to act on it: a protruding corner at hip or head height beside a bed, a
desk or a walking line is an impact hazard, and rounding or padding it is standard practice in
homes with children and older adults. The app should lead with that for non-believing users.

#### Customer insight
If a wall corner or the end of a bookcase points straight at where you sleep or sit, feng shui
calls it a poison arrow. Whatever you make of that, it is also the corner you will eventually
walk into. A plant, a drape of fabric or a small shift of the furniture softens it either way.

#### Failure modes / when to skip
Skip for corners further away than the distance parameter, and for obtuse corners. Skip where
the "corner" is a chimney breast return that the room's composition depends on. Do not stack
this finding with FS-CHI-010 and FS-CHI-011 for the same corner — report once, at the highest
applicable severity. Do not recommend a plant where the user has flagged allergies, pets that
chew plants, or no daylight for one.

---

### FS-CMD-026 — Occupied position clear of the door swing and the main route

```yaml
id: FS-CMD-026
title: Occupied position clear of the door swing arc and the main traffic route
system: circulation.desire_lines
group: command_position
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, bedroom_guest, bedroom_child, bedroom_teen,
          living_room, family_room, great_room, home_office, home_office_shared,
          formal_dining, eat_in_kitchen, studio_apartment, hallway_corridor, loft,
          open_plan_combined, media_room, nursery]
  objects: [sleep.bed.*, worksurface.desk.*, seating.sofa.*, seating.armchair.*,
            seating.dining_chair.*, tables.dining.*]
  requires_features: []
  min_room_area_m2: 4.0
scope: object_placement
severity: high
confidence: ergonomic
evidence_class: ergonomic
belief_gated: false
predicate: |
  let obj = target
  forEach o in room.openings where o.kind in [door, french, bifold] and o.swing != slide
    forbid overlaps(swingArc(o), bbox(obj))
    assert usableSwingPct(o) >= p.min_usable_swing_pct
  forEach route in room.mainRoutes
    penalize(crossesPath(obj, route) and pathWidth(route.from, route.to) < p.min_route_width_m,
             weight=4)
    penalize(overlaps(obj.occupantZone, routeCorridor(route, width_m=p.route_corridor_m)), weight=3)
  assert pathExists(room.primaryDoor.centroid, obj.primaryApproachPoint,
                    min_width_m=p.min_approach_width_m)
params:
  - key: min_usable_swing_pct
    default: 90
    range: [60, 100]
    unit: pct
    user_editable: false
    jurisdiction_varies: true
    rationale: Share of the door's swing that must remain free; the safety and ergonomics files own the hard floor.
  - key: min_route_width_m
    default: 0.750
    range: [0.600, 1.200]
    unit: m
    user_editable: true
    rationale: Width below which a route pinched by furniture becomes a squeeze.
  - key: route_corridor_m
    default: 0.900
    range: [0.600, 1.500]
    unit: m
    user_editable: true
    rationale: Notional corridor width around a desire line, tested against occupant zones.
  - key: min_approach_width_m
    default: 0.600
    range: [0.450, 1.200]
    unit: m
    user_editable: true
    rationale: Width of the approach to the piece itself — getting into bed, sitting at the desk.
score:
  weight: 8
  curve: step
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: self
    transform: {offset: out_of_swing_and_route, min_offset_m: 0.200}
    cost: free
    effort: medium_physical
    reversible: true
    copy: Move the piece clear of the door's swing so the door opens fully and nobody has to sidestep.
  - rank: 2
    action: replace_opening
    target: room.primaryDoor
    add: opening.pocket
    transform: {position: same}
    cost: high
    effort: contractor
    reversible: false
    copy: A pocket or sliding door removes the swing entirely and buys back a square metre of usable room.
  - rank: 3
    action: reverse_swing
    target: room.primaryDoor
    transform: {swing: outward_or_opposite_hand}
    cost: low
    effort: medium_physical
    reversible: true
    copy: Rehanging the door on the other hand often clears the furniture without any other change.
conflicts_with: []
supersedes: []
requires_rules: []
tags: [door_swing, circulation, desire_lines, clearance, evidence_backed]
localization_notes: >
  Not belief-gated: this is circulation, not tradition. Door clear-width and egress
  requirements are code matters and vary by jurisdiction; the values here are layout-scale
  defaults, and the safety file owns the authoritative minimums.
```

#### Why — tradition
Feng shui's version of this is the instruction that *qi* entering a room must be able to reach
the whole room without being blocked at the threshold, and that furniture must never impede a
door. It is a weak traditional rule that happens to coincide exactly with a strong practical
one, which is why the app runs it for everybody and mentions the tradition only as colour.

#### Why — psychology / physiology
Straight ergonomics and circulation. A door that cannot open through its full arc is a daily
friction and an egress problem; a piece of furniture sitting on a desire line gets knocked,
scuffed and shuffled, and the occupant of a seat on a desire line is interrupted by everyone
passing. Space-syntax analysis (Hillier and Hanson, 1984) formalises why traffic follows the
shortest topologically-available route regardless of intent, which is why designing against a
desire line reliably fails. No tradition is needed for any part of this.

#### Customer insight
Check that every door in the room can swing all the way open, and that the path people
actually walk does not pass through where someone is sitting or sleeping. These are the two
snags you stop noticing but never stop bumping into.

#### Failure modes / when to skip
The hard door-clearance minimums belong to the ergonomics and safety files; this rule must not
assert a stricter figure than those. Skip for sliding, pocket and bifold doors on the swing
test. Skip the desire-line penalty in circulation rooms whose whole purpose is passage. In
rooms below about 6 m² (65 ft²) a partial swing overlap with a low object such as a bed foot may
be unavoidable — report it once at reduced severity rather than blocking the layout.

---
