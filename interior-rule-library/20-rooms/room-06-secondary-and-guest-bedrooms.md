# Secondary Bedrooms, Guest Bedrooms & the Multi-Use Spare Room — Functional / Practical / Design Layer
<!-- library-file: v1 | system(s): modernism.functionalism, pattern_language.alexander, zoning.public_private, circulation.space_syntax, ergonomics.task_zones, psych.territoriality, psych.proxemics, behavior.habit_design, product.parameter, accessibility.universal_design | rule-id-prefixes: RM-BEDS | author-agent: room-06-secondary-guest-bedrooms -->

## Scope

This file owns the **functional, practical and design** layer for every bedroom that is not the
primary bedroom and not a dedicated child's room: `bedroom_secondary`, `bedroom_guest`,
`guest_suite`, the box room, the spare room, and the honest real-world case — the room that is
simultaneously a guest room, a home office, a store, a laundry-airing room and a gift-wrapping
bench.

It covers:

- **Use-stack resolution.** Declaring a primary and a secondary use, capping the stack, the
  time-sharing rules, and the mode-reset budget.
- **The convertible-furniture decision tree.** Permanent bed vs. sofa bed vs. murphy/wall bed vs.
  daybed vs. futon vs. air bed, with honest comfort, cost, floor-area and effort trade-offs, and
  the deployment-envelope geometry each one demands.
- **Guest hospitality provision as a placed checklist.** Bedside surface + light + power on every
  occupied side, empty hanging space and an empty drawer, hangers, a real luggage landing zone,
  a mirror, a bin, water, blackout, a lock or privacy indicator, towels, house/wifi information,
  somewhere to sit to put shoes on, and phone charging at the pillow.
- **Guest circulation.** The night route to the bathroom, night lighting on that route, the
  sightline into family areas, and shared-bathroom etiquette layout.
- **Acoustics and the thin-wall reality** (applied, not re-derived).
- **The guest-room-as-office** that must hide the work at the end of the day.
- **Box rooms, single-bed-only rooms, sloped-ceiling rooms** and their minimum viability gates.
- **Life-stage variants.** Future-proofing for a nursery or child room, the teen or adult child
  returning home, the long-stay guest, the visiting parent, the separate-sleeping couple, and the
  lodger or rented spare room with its lock, storage and privacy rules.
- **The honest reassignment recommendation** — when a space-constrained home should be told, kindly
  and with numbers, to stop keeping a guest room.

It deliberately does **not** re-derive: feng shui room doctrine (`FS-ROOM-*`), commanding position
(`FS-CMD-*`), bagua sectors (`FS-BAG-*`), vastu (`VS-ROOM-*`), ergonomic clearance tables
(`ERG-CLR-*`), lighting photometrics (`LGT-*`), acoustics (`ACU-*`), colour (`CLR-*`), circulation
(`CIR-*`) or safety (`SAFE-*`). Where those layers apply to this room, the rules below **apply**
them with named parameter values and a stated priority. See `## CROSS_REFERENCES`.

It also does not own the primary bedroom (`RM-BEDP-*`), the dedicated child's room or nursery as a
*current* use (`RM-BEDC-*` / `RM-NURS-*`), or the dedicated home office (`RM-OFF-*`). This file owns
the *transition into and out of* those uses.

## Rule count: 45

---

## Rules

### RM-BEDS-001 — Declare a primary and a secondary use before laying out a spare room

```yaml
id: RM-BEDS-001
title: Declare a primary and a secondary use before laying out a spare room
system: modernism.functionalism
group: use_stack
version: 1
status: active
applies_to:
  rooms: [bedroom_secondary, bedroom_guest, guest_suite, storage_room, home_office, loft, attic_finished, basement_finished]
  objects: []
  requires_features: []
scope: room_composition
severity: high
confidence: expert_consensus
evidence_class: mixed
belief_gated: false
predicate: |
  # A spare room cannot be generated or scored until its use stack is declared and ranked.
  let stack = useStack(room)
  assert count(stack) >= 1
  assert exists(primaryUse(room))
  require primaryUse(room) != secondaryUse(room)
  # Every declared use must own at least one object in the room, or it is a fiction.
  forEach u in stack:
    assert count(objectsServingUse(room, u)) >= 1
  # Ranked, not tied: the engine needs a tie-break authority for every contested decision.
  forEach a, b in pairs(stack):
    assert usePriority(room, a) != usePriority(room, b)
params:
  - key: require_use_declaration
    default: true
    range: [true, false]
    unit: bool
    user_editable: false
    rationale: The generator has no defensible tie-break for bed-vs-desk conflicts without a ranked use stack.
  - key: max_declared_uses
    default: 4
    range: [1, 6]
    unit: count
    user_editable: true
    rationale: Above four declared uses the room's objects begin to serve no use adequately; see RM-BEDS-002.
score:
  weight: 9
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: prompt_user
    target: room
    transform: {ask: rank_uses, options: [guest_sleeping, home_office, storage, laundry_airing, hobby_craft, child_future, lodger_let, separate_sleeping, exercise, music], require_ranked: true}
    cost: free
    effort: none
    reversible: true
    copy: Before we furnish this room, tell us what it is really for — and which job wins when two jobs want the same corner. Most spare rooms do three things; that is normal, and we plan for it.
  - rank: 2
    action: set_param
    target: room
    transform: {infer_primary_use_from: [existing_objects, guest_nights_per_year, household_size], mark: inferred}
    cost: free
    effort: none
    reversible: true
    copy: We have guessed from what is already in here. Correct us if we got it wrong.
conflicts_with: []
supersedes: []
requires_rules: []
tags: [spare_room, use_stack, multi_use, signature_rule, onboarding]
localization_notes: Use labels must be localised; the ranking mechanic is culture-invariant. In markets where lodging a paying tenant is common (UK lodger, Indian paying-guest, Japanese share house), surface `lodger_let` prominently in the picker.
```

#### Why — tradition

No traditional doctrine governs this; it is a functional rule and we say so plainly. The closest
lineage is modernist functionalism — Sullivan's and later the Bauhaus's insistence that form follows
a named purpose — and Christopher Alexander's *A Pattern Language*, which repeatedly argues that a
room without a clear social purpose becomes dead space. Feng shui and vastu both assume a room has
one dominant function before they assign directional or elemental treatment, so a declared primary
use is a *precondition* for the `FS-ROOM-*` and `VS-ROOM-*` layers rather than a competitor to them.

#### Why — psychology / physiology

Ambiguous-purpose rooms accumulate objects because no single owner has authority to refuse an
object entry — a territoriality failure in Irwin Altman's sense, where no one holds primary
territory over the space. Behaviour-design work on implementation intentions (Gollwitzer's line of
research) shows that naming a specific situation-action pair markedly improves follow-through, which
is the mechanism this rule leans on: a named primary use gives every future "where should this go?"
decision a default answer. No direct empirical support exists for the specific claim that declaring
a use improves measured room satisfaction; the mechanism is plausible and consistent with the
territoriality and habit literature but has not been tested on spare rooms.

#### Customer insight

Spare rooms go wrong because nobody ever decided what they are for. Tell us the main job and the
runner-up, and we will make sure the main job always wins the good wall — and the runner-up still
gets somewhere real to live instead of a pile in the corner.

#### Failure modes / when to skip

Skip for rooms with a single unambiguous use already recorded (a fully committed `bedroom_guest`
in a home with four bedrooms and two occupants). Do not force a declaration during a quick-scan
scoring pass of an existing home — infer, mark `inferred`, and score the room's function findings
as `advisory` until the user confirms. Never block a safety finding (`SAFE-*`) behind an
undeclared use stack.

---

### RM-BEDS-002 — Cap the use stack against room area; a fifth job means something must leave

```yaml
id: RM-BEDS-002
title: Cap the use stack against room area; a fifth job means something must leave
system: psych.crowding
group: use_stack
version: 1
status: active
applies_to:
  rooms: [bedroom_secondary, bedroom_guest, guest_suite, loft, attic_finished, basement_finished]
  objects: []
  requires_features: []
scope: room_composition
severity: medium
confidence: expert_consensus
evidence_class: mixed
belief_gated: false
predicate: |
  let uses     = count(activeUses(room))
  let budget   = floor(room.area_m2 / p.m2_per_use) + p.free_uses
  let occupied = occupancyRatio(room)
  assert uses <= min(budget, p.hard_use_cap)
  # Crowding gate: whatever the use count, the room must not be more than this full.
  assert occupied <= p.max_occupancy_ratio
  # Dormant uses (sealed, labelled, stacked storage) count at a discount.
  let dormant = count(dormantUses(room))
  penalize(uses + (dormant * p.dormant_use_weight) - budget, weight=6)
params:
  - key: m2_per_use
    default: 4.5
    range: [3.0, 8.0]
    unit: m2
    user_editable: true
    rationale: Approximate floor area a secondary use needs to own before it stops colonising the primary use's space — one desk plus its chair pull-out, or one drying rack in use, is roughly this.
  - key: free_uses
    default: 1
    range: [0, 2]
    unit: count
    user_editable: false
    rationale: Every room gets its primary use for free regardless of size.
  - key: hard_use_cap
    default: 4
    range: [2, 6]
    unit: count
    user_editable: true
    rationale: Beyond four the reset cost (RM-BEDS-003) exceeds what households reliably sustain.
  - key: max_occupancy_ratio
    default: 0.55
    range: [0.35, 0.75]
    unit: ratio
    user_editable: true
    rationale: Footprint-to-floor ratio above which a bedroom reads as a storeroom and circulation validation begins to fail.
  - key: dormant_use_weight
    default: 0.4
    range: [0.0, 1.0]
    unit: ratio
    user_editable: true
    rationale: Boxed, labelled, stacked storage that is never opened costs far less than an active use, but it is not free.
score:
  weight: 6
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: reassign_use
    target: room
    transform: {move_use_to: other_room, prefer_use: [storage, laundry_airing, hobby_craft], prefer_target_room: [storage_room, utility_mechanical, laundry_room, garage_parking, attic_storage, basement_unfinished]}
    cost: free
    effort: medium_physical
    reversible: true
    copy: This room is doing too many jobs for its size. Moving just the storage out — to the loft, garage or utility — buys back enough floor for the other jobs to work properly.
  - rank: 2
    action: consolidate_objects
    target: storage.*
    transform: {into: storage.cabinet.closed_front, or: storage.under_bed_box, rule: one_container_per_dormant_use}
    cost: low
    effort: medium_physical
    reversible: true
    copy: Give each leftover job a single closed container instead of a zone. Gift wrap in one rolling caddy beats gift wrap spread across a chair, a shelf and the floor.
  - rank: 3
    action: relabel_room
    target: room
    transform: {to: storage_room, drop_use: guest_sleeping, condition: guestNightsPerYear(room) < 4}
    cost: free
    effort: none
    reversible: true
    copy: Honestly? This is a storeroom with a bed in it. If guests come less than a handful of nights a year, see our note on giving the room back to daily life.
conflicts_with: []
supersedes: []
requires_rules: [RM-BEDS-001]
tags: [spare_room, use_stack, crowding, storage, honesty]
localization_notes: The area-per-use budget is not culturally neutral in practice — in high-density markets (Hong Kong, Tokyo, Mumbai) households routinely and successfully run four uses in 7–9 m². Offer a `density_tolerant` preset that raises `max_occupancy_ratio` to 0.70 and lowers `m2_per_use` to 3.0 rather than repeatedly failing those rooms.
```

#### Why — tradition

No traditional doctrine; functional rule. Feng shui doctrine on clutter (`FS-ROOM-*`, and the BTB
school's emphasis on unblocked qi flow) converges on the same recommendation from a different
premise, and vastu's treatment of the north-east zone as one to keep light and uncluttered
(`VS-ROOM-*`) does likewise — but the arithmetic here is ours, not theirs.

#### Why — psychology / physiology

Crowding research (Stokols' distinction between density and the *experience* of crowding) holds
that perceived crowding rises with thwarted goals, not with density alone — which is exactly what a
five-use room produces, because every use blocks another. Cognitive-load accounts of visual clutter
suggest that competing task cues in view impose a switching cost; a guest trying to sleep in a room
displaying someone's unfinished tax filing is receiving task cues they cannot act on. No direct
empirical support links a specific use-count threshold to any measured outcome; the four-use cap is
a product judgement calibrated to observed reset behaviour, not a finding.

#### Customer insight

There is a point where a spare room stops being flexible and starts being useless — usually the
fourth or fifth job. We will tell you which job to evict, and where it can go instead.

#### Failure modes / when to skip

Do not fire on `guest_suite` or rooms over roughly 20 m² where four uses genuinely fit. Do not fire
in the first 30 days after a house move, when every room is temporarily a storeroom. Suppress
entirely when the user has set `context.life_event` to `moving_in`, `renovating`, `new_baby` or
`bereavement_clearance` — this is not the moment to be told off about boxes.

---

### RM-BEDS-003 — Every multi-use spare room needs a reset action inside a stated time budget

```yaml
id: RM-BEDS-003
title: Every multi-use spare room needs a reset action inside a stated time budget
system: behavior.habit_design
group: mode_switching
version: 1
status: active
applies_to:
  rooms: [bedroom_secondary, bedroom_guest, home_office_shared, loft, attic_finished, basement_finished]
  objects: []
  requires_features: []
scope: schedule_behavior
severity: high
confidence: expert_consensus
evidence_class: mixed
belief_gated: false
predicate: |
  # If the room has more than one active use, the mode change must be cheap enough to actually happen.
  require count(activeUses(room)) >= 2
  let t_guest  = resetTimeEstimate(room, from_mode="daily", to_mode="guest")
  let t_return = resetTimeEstimate(room, from_mode="guest", to_mode="daily")
  assert t_guest  <= p.max_reset_minutes
  assert t_return <= p.max_reset_minutes * p.return_slack
  # Every object that must move during a reset needs a named destination inside the home.
  forEach o in objectsRequiringRelocationOnModeChange(room):
    assert exists(parkingLocationOf(o))
    assert pathExists(centroid(o), parkingLocationOf(o), min_width_m=p.reset_path_width_m)
  # No reset step may require two people or a tool.
  forEach s in resetSteps(room):
    assert s.persons_required <= p.max_persons_per_step
    assert s.requires_tool == false
params:
  - key: max_reset_minutes
    default: 15
    range: [5, 45]
    unit: min
    user_editable: true
    rationale: Time budget households reliably sustain for a guest-mode changeover; longer resets get skipped and the guest sleeps among the office.
  - key: return_slack
    default: 1.5
    range: [1.0, 3.0]
    unit: ratio
    user_editable: true
    rationale: Returning to daily mode is chronically deferred, so it is allowed to be slower — but not unbounded.
  - key: reset_path_width_m
    default: 0.75
    range: [0.6, 1.0]
    unit: m
    user_editable: true
    rationale: Width needed to carry a boxed load or a folded drying rack out of the room without turning sideways; about 30 in.
  - key: max_persons_per_step
    default: 1
    range: [1, 2]
    unit: count
    user_editable: true
    rationale: A reset that needs a second pair of hands only happens when both people are home and willing, which is rarely when the guest is due.
score:
  weight: 8
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: storage.cabinet.closed_front
    transform: {position: on_wall opposite_to bed_head, sized_to: sum(volumeOf(objectsRequiringRelocationOnModeChange(room))), door_type: hinged_or_sliding}
    cost: medium
    effort: medium
    reversible: true
    copy: The fastest guest-room reset is a cupboard that swallows the working day in one armful. Buy the cupboard before you buy the sofa bed.
  - rank: 2
    action: swap_object
    target: worksurface.desk.*
    transform: {to: worksurface.desk.wall_mounted_fold_down, keep_position: true}
    cost: medium
    effort: medium
    reversible: false
    copy: A fold-down desk turns a ten-minute tidy into a two-second flip.
  - rank: 3
    action: add_object
    add: hobby.craft_cart.rolling
    transform: {assign_uses: [hobby_craft, gift_wrap, laundry_sorting], park_at: parkingLocationOf(self)}
    cost: low
    effort: low
    reversible: true
    copy: Put the wrapping paper, the craft bits and the odd jobs on wheels. Then guest mode is one push down the hall.
  - rank: 4
    action: annotate
    target: room
    transform: {generate: reset_checklist, ordered: true, estimate_minutes: true, printable: true}
    cost: free
    effort: none
    reversible: true
    copy: Here is your changeover list, in order, with a realistic time against it. Stick it inside the wardrobe door.
conflicts_with: []
supersedes: []
requires_rules: [RM-BEDS-001, RM-BEDS-002]
tags: [spare_room, multi_use, mode_switch, reset, guest, signature_rule]
localization_notes: None. Reset economics are universal; only the objects differ.
```

#### Why — tradition

No traditional doctrine; this is a functional rule. The nearest tradition is Japanese `ma` and the
historical Japanese room (`japanese.ma_spatial`), where futon and low table are stowed daily so one
room serves sleeping, eating and working — a genuine cultural precedent for designing the *stow*
first and the *layout* second. Western design tradition has no equivalent discipline, which is part
of why Western spare rooms fail at this.

#### Why — physiology / psychology

Behavioural economics of effort — the "friction" literature behind nudge design — holds that small
increases in the cost of an action produce large falls in its frequency. A guest-mode reset is a
low-reward, high-friction, deadline-driven task, the exact profile most vulnerable to procrastination.
Designing the reset down to a single armful and a single destination removes the decision points
where the task stalls. No direct empirical support for the specific 15-minute threshold; it is a
product judgement, and the mechanism (friction reduction raising completion rates) is well supported
in general but untested on room changeovers.

#### Customer insight

The test of a spare room is not how it looks — it is how long it takes to make it guest-ready when
someone calls at lunchtime and arrives at six. If that is more than a quarter of an hour, the room
is badly designed, not you.

#### Failure modes / when to skip

Skip for single-use rooms and for `guest_suite` with permanent bed and no secondary use. Do not
fire if the household reports zero guest nights and no intention of any — that is
RM-BEDS-008's territory instead. Where the user has mobility limitations recorded, drop
`max_persons_per_step` handling in favour of `accessibility.*` guidance: the correct answer may be a
layout that needs no reset at all, not a faster reset.

---

### RM-BEDS-004 — Choose the sleep surface from the guest-night count, not from the furniture showroom

```yaml
id: RM-BEDS-004
title: Choose the sleep surface from the guest-night count, not from the furniture showroom
system: modernism.functionalism
group: sleep_surface_selection
version: 1
status: active
applies_to:
  rooms: [bedroom_secondary, bedroom_guest, guest_suite, home_office_shared, studio_apartment, loft, basement_finished, attic_finished]
  objects: [sleep.bed.*, sleep.sofa_bed.*, sleep.murphy_bed.*, sleep.daybed.*, sleep.futon.*, sleep.air_bed.*]
  requires_features: []
scope: room_composition
severity: high
confidence: expert_consensus
evidence_class: mixed
belief_gated: false
predicate: |
  let n     = guestNightsPerYear(room)              # nights per year the surface is slept on
  let longest = longestSingleStayNights(room)       # nights in the longest expected single stay
  let A     = usableFloorArea(room, min_headroom_m=1.9)
  let other = count(activeUses(room)) - 1
  let class = sleepSurfaceClassOf(target)           # permanent | murphy | sofa_bed | daybed | futon | air_bed

  # Comfort floor: any surface slept on for a long stay must clear the comfort band.
  require longest >= p.long_stay_nights implies comfortClassOf(target) >= p.min_comfort_class_long_stay

  # The selection matrix. Exactly one class should be recommended; the engine asserts the chosen
  # class is within one rank of the recommendation so the user keeps agency.
  let rec =
    if n >= p.permanent_bed_nights and A >= p.permanent_bed_min_area_m2 then "permanent"
    else if n >= p.permanent_bed_nights and other >= 1 and A >= p.murphy_min_area_m2 then "murphy"
    else if n >= p.regular_use_nights and other >= 1 and A <  p.murphy_min_area_m2 then "sofa_bed"
    else if n >= p.regular_use_nights and A <  p.permanent_bed_min_area_m2 and longest <= p.daybed_max_stay then "daybed"
    else if n >= p.occasional_nights then "sofa_bed"
    else if n >  0 then "air_bed"
    else "none"
  prefer class == rec
  penalize(abs(classRank(class) - classRank(rec)) - 1, weight=7)

  # Hard geometry gates per class — a class that cannot physically deploy is never recommended.
  require class == "murphy"   implies clearance(target, "front") >= murphyProjection(target) + p.murphy_standing_clearance_m
  require class == "sofa_bed" implies clearance(target, "front") >= sofaBedExtension(target) + p.convertible_side_clearance_m
  require class == "air_bed"  implies exists(deflatedStorageLocation(target))
params:
  - key: permanent_bed_nights
    default: 25
    range: [6, 120]
    unit: nights_per_year
    user_editable: true
    rationale: Above roughly two guest nights a month a permanent bed is worth the floor it costs; below it the floor is worth more than the bed.
  - key: regular_use_nights
    default: 8
    range: [2, 40]
    unit: nights_per_year
    user_editable: true
    rationale: Threshold at which the nightly effort of inflating or unrolling becomes a genuine irritation.
  - key: occasional_nights
    default: 2
    range: [1, 10]
    unit: nights_per_year
    user_editable: true
    rationale: Below this an air bed in a cupboard is the honest answer and nothing permanent is justified.
  - key: permanent_bed_min_area_m2
    default: 9.5
    range: [6.5, 14.0]
    unit: m2
    user_editable: true
    rationale: Floor area below which a permanent double plus one secondary use stops fitting with legal and workable clearances.
  - key: murphy_min_area_m2
    default: 8.0
    range: [6.0, 12.0]
    unit: m2
    user_editable: true
    rationale: A wall bed needs its full open projection plus standing room, so it saves area only above this size; below it the bed open fills the room anyway.
  - key: long_stay_nights
    default: 5
    range: [2, 21]
    unit: nights
    user_editable: true
    rationale: Point at which a poor sleep surface stops being an anecdote and starts being a problem for the guest's back and your relationship.
  - key: min_comfort_class_long_stay
    default: 3
    range: [1, 5]
    unit: rank
    user_editable: true
    rationale: On a 1–5 comfort scale (1 = air bed on the floor, 5 = proper sprung mattress), the floor for stays of several nights.
  - key: daybed_max_stay
    default: 3
    range: [1, 10]
    unit: nights
    user_editable: true
    rationale: Single-width daybeds suit short solo stays; a couple or a week-long stay breaks them.
  - key: murphy_standing_clearance_m
    default: 0.60
    range: [0.45, 0.90]
    unit: m
    user_editable: true
    rationale: Standing room at the foot of an open wall bed so the person who lowered it can get out past it; about 24 in.
  - key: convertible_side_clearance_m
    default: 0.45
    range: [0.35, 0.75]
    unit: m
    user_editable: true
    rationale: Room to walk round a deployed sofa bed to tuck a sheet; about 18 in. Not a substitute for the ERG-CLR bedside minimums.
score:
  weight: 9
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: prompt_user
    target: room
    transform: {ask: guest_nights_per_year, ask_also: [longest_expected_stay_nights, who_sleeps_here, budget_band], then: rerun_selection}
    cost: free
    effort: none
    reversible: true
    copy: Roughly how many nights a year does someone sleep in here, and what is the longest single visit? Those two numbers decide the bed — everything else is decoration.
  - rank: 2
    action: swap_object
    target: sleep.*
    transform: {to: recommendedClass(room), size: largestFittingSize(room), keep_wall: anchorWallOf(room)}
    cost: high
    effort: medium
    reversible: false
    copy: Here is the surface your actual usage justifies, with the honest trade-offs written out so you can disagree with us on purpose rather than by accident.
  - rank: 3
    action: add_object
    add: sleep.mattress.topper
    transform: {thickness_m: 0.06, store_at: parkingLocationOf(self)}
    cost: low
    effort: low
    reversible: true
    copy: Not ready to change the bed? A good topper lifts a sofa bed or futon by roughly one comfort grade for a fraction of the cost. Keep it rolled in the wardrobe.
conflicts_with: [RM-BEDS-002]
supersedes: []
requires_rules: [RM-BEDS-001]
tags: [convertible, sofa_bed, murphy_bed, daybed, futon, air_bed, decision_tree, signature_rule, honesty]
localization_notes: Futons carry different meanings by market — a Japanese shikibuton on tatami is a culturally normal adult sleep surface with its own daily airing ritual, whereas a Western sprung "futon sofa" is a low-comfort convertible. Keep the two as distinct object types and do not transfer the comfort rank between them.
```

#### Why — tradition

No traditional doctrine ranks convertible beds; this is a functional rule. Japanese practice
(`japanese.ma_spatial`) is the one real tradition of daily bed stowage and it is worth telling the
user about, because it reframes a murphy bed as a long-standing way of living rather than a
compromise. Feng shui doctrine is largely silent on convertibles but its command-position and
solid-headboard principles (`FS-CMD-*`) constrain *where* the deployed surface may land, which is
why this rule outputs a class and leaves placement to the archetypes.

#### Why — psychology / physiology

Sleep-surface quality has a real physiological floor: sleep-medicine consensus treats an adequate,
supportive surface and a stable thermal environment as basic sleep-hygiene conditions, and thin
convertible mattresses over a metal folding frame commonly produce a palpable bar under the lumbar
spine. Effort-discounting again drives the behavioural half: a bed that takes ten minutes and a
second person to make will be offered less often, which quietly reduces how much you see the people
you love. No direct empirical support for the specific night-count thresholds; they are product
judgements. We do not claim any measured sleep-quality difference between surface classes — we
report the mechanical difference (mattress thickness, frame bar, edge support) honestly instead.

#### Customer insight

Here is the honest league table. A **permanent bed** is the most comfortable and the least effort,
and it costs you the whole room. A **wall bed** is nearly as comfortable, costs the most money, needs
a real wall and about 2.1 m (7 ft) of floor in front of it when open, and gives the room back every
morning. A **sofa bed** gives you daytime seating, is the most useful compromise, and is one comfort
grade down — mind the bar. A **daybed** is lovely, seats people, sleeps one adult well and two badly.
A **futon** is cheap and fine for a night or two. An **air bed** is the right answer for two nights a
year and the wrong answer for two nights a month.

#### Failure modes / when to skip

Skip when the user has already bought the surface and is not replacing it — switch to the
placement and topper remedies only. Do not recommend an air bed where a guest is recorded as
`senior`, has a mobility limitation, or is pregnant: getting off a floor-level surface is the
problem, and RM-BEDS-042 overrides here. Do not recommend a murphy bed in a rental without checking
`context.tenure` — most need wall fixing. Do not recommend any convertible as the *only* sleep
surface in a home where a member has a recorded back condition and this is their fallback bed.

---

### RM-BEDS-005 — Keep the convertible's deployment envelope permanently clear

```yaml
id: RM-BEDS-005
title: Keep the convertible's deployment envelope permanently clear
system: ergonomics.task_zones
group: convertible_geometry
version: 1
status: active
applies_to:
  rooms: [bedroom_secondary, bedroom_guest, home_office_shared, studio_apartment, loft, basement_finished, media_room, study_library]
  objects: [sleep.sofa_bed.*, sleep.murphy_bed.*, sleep.daybed.trundle, sleep.futon.frame, sleep.bed.trundle]
  requires_features: []
scope: object_placement
severity: high
confidence: ergonomic
evidence_class: ergonomic
belief_gated: false
predicate: |
  let env = deploymentEnvelope(target)        # swept polygon from stowed to fully open, plus the open footprint
  # Nothing permanent may sit inside the envelope.
  forEach o in others(*) where o.is_fixed == true or o.anchored == true:
    forbid overlaps(bbox(o), env)
  # Movable objects inside the envelope must each have a parking location and be listed in the reset.
  forEach o in others(*) where overlaps(bbox(o), env):
    assert exists(parkingLocationOf(o))
    assert massOf(o) <= p.max_moved_mass_kg
  # Architecture: no feature may foul the sweep, and the open bed must not block a door or an EERO.
  forEach f in room.features where f.kind in [radiator, column, chimney_breast, exposed_pipe, floor_drain, electrical_outlet]:
    penalize(overlaps(bbox(f), env) ? 1 : 0, weight=5)
  forEach d in room.openings where d.kind in [door, doorway, sliding, pocket, bifold]:
    assert not overlaps(doorSwingArea(d), openFootprint(target))
  forEach w in room.openings where w.is_egress == true:
    assert not overlaps(bbox(w) projectedToFloor(reach_m=p.egress_reach_m), openFootprint(target))
  # Rugs are the commonest snag on a wall bed leg.
  forEach r in others(softgoods.rug.*):
    penalize(overlaps(bbox(r), legLandingZone(target)) and r.pile_m > p.max_rug_pile_under_legs_m ? 1 : 0, weight=3)
params:
  - key: max_moved_mass_kg
    default: 12.0
    range: [5.0, 25.0]
    unit: kg
    user_editable: true
    rationale: Mass one adult can shift repeatedly without help or injury; heavier items must live outside the envelope permanently.
  - key: egress_reach_m
    default: 0.90
    range: [0.60, 1.20]
    unit: m
    user_editable: true
    rationale: Floor depth in front of an escape window that must stay clear so it can be reached and climbed through. Jurisdictions differ on whether any clear floor is mandated.
    jurisdiction_varies: true
  - key: max_rug_pile_under_legs_m
    default: 0.015
    range: [0.005, 0.030]
    unit: m
    user_editable: true
    rationale: Pile depth above which a wall-bed or sofa-bed leg catches or rocks; roughly 5/8 in.
score:
  weight: 8
  curve: step
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: blockingObjectsIn(deploymentEnvelope(target))
    transform: {to: nearestFreeZoneOutside(deploymentEnvelope(target)), keep_use_adjacency: true}
    cost: free
    effort: medium_physical
    reversible: true
    copy: The bed cannot open with these in the way. We have found each of them a spot that still suits how you use them.
  - rank: 2
    action: swap_object
    target: sleep.murphy_bed.vertical_*
    transform: {to: sleep.murphy_bed.horizontal_*, condition: wallLengthAvailable(anchorWall) >= openLength(target) and clearance_depth_short}
    cost: high
    effort: high
    reversible: false
    copy: A side-opening wall bed projects roughly a metre less into the room than an end-opening one. In a shallow room that is the difference between working and not.
  - rank: 3
    action: annotate
    target: room
    transform: {overlay: deployment_envelope, label: "keep clear", persist: true}
    cost: free
    effort: none
    reversible: true
    copy: We have marked the floor the bed needs when it opens. Treat it as furniture that happens to be invisible.
conflicts_with: [SAFE-EGR-001, SAFE-EGR-003]
supersedes: []
requires_rules: [RM-BEDS-004]
tags: [convertible, murphy_bed, sofa_bed, clearance, envelope, egress]
localization_notes: None geometric. The egress-clearance parameter is jurisdiction-dependent; see SAFE-EGR-*.
```

#### Why — tradition

No traditional doctrine; functional rule. Note for the copy: a deployed wall bed still has to satisfy
the enabled belief layer in its *open* state — feng shui's commanding position and solid-headboard
rules (`FS-CMD-*`) are evaluated against the open pose, not the cabinet.

#### Why — psychology / physiology

Purely mechanical: a bed that cannot be opened without moving three objects will be opened less
often, and the objects will be moved carelessly and in the dark. There is also a real injury path —
wall-bed mechanisms store significant spring or piston energy and a leg that lands on a rug edge or
a trailing cable can drop or rock unpredictably. No direct empirical support for the specific mass
and pile thresholds; they are ergonomic judgements consistent with general manual-handling guidance.

#### Customer insight

A sofa bed needs about 2 m (6 ft 6 in) of floor in front of it to become a bed, and a wall bed needs
about 2.1 m (7 ft). That floor is not spare — it is part of the bed. We keep it clear on the plan so
you are not dragging a laundry basket across the hall at midnight.

#### Failure modes / when to skip

Do not fire on non-convertible surfaces. In a `studio_apartment` the envelope will necessarily
overlap living circulation — there, relax to "clear within the reset, not permanently", and validate
circulation in both modes (RM-BEDS-037) instead. Safety egress rules always win: if the only open
position blocks the escape window, the surface class must change, not the clearance parameter.

---

### RM-BEDS-006 — One adult must be able to deploy and make the bed alone

```yaml
id: RM-BEDS-006
title: One adult must be able to deploy and make the bed alone
system: ergonomics.posture
group: convertible_geometry
version: 1
status: active
applies_to:
  rooms: [bedroom_secondary, bedroom_guest, guest_suite, home_office_shared, studio_apartment, loft]
  objects: [sleep.sofa_bed.*, sleep.murphy_bed.*, sleep.futon.*, sleep.air_bed.*, sleep.bed.trundle, sleep.daybed.trundle]
  requires_features: []
scope: object_placement
severity: medium
confidence: ergonomic
evidence_class: ergonomic
belief_gated: false
predicate: |
  # Operating position: somewhere to stand while pulling or lowering.
  assert clearance(target, "front") >= p.operating_stand_depth_m
  # Sheet-tucking access: at least this much on the long sides once open, on at least one side,
  # and on both sides if the surface is wider than a single.
  let sides = openSideClearances(target)     # {left, right, foot}
  assert max(sides.left, sides.right) >= p.tuck_clearance_m
  require openWidth(target) > p.single_width_m implies min(sides.left, sides.right) >= p.tuck_clearance_min_second_side_m
  assert sides.foot >= p.foot_clearance_m
  # Force and reach: mechanism handle must be grippable from a standing posture without a stool.
  assert graspHeight(deploymentHandle(target)) <= p.max_handle_height_m
  assert deploymentForce(target) <= p.max_deployment_force_n
  # Bedding must be stored within this distance of the bed or it will not get changed.
  assert distance(centroid(target), beddingStoreLocation(room)) <= p.bedding_store_distance_m
params:
  - key: operating_stand_depth_m
    default: 0.75
    range: [0.60, 1.10]
    unit: m
    user_editable: true
    rationale: Depth to stand and pull or lower a mechanism with a braced stance; about 30 in.
  - key: tuck_clearance_m
    default: 0.55
    range: [0.45, 0.90]
    unit: m
    user_editable: true
    rationale: Side clearance to kneel or lean and tuck a fitted sheet; about 22 in. Below this the bed gets made badly or dragged out and shoved back.
  - key: tuck_clearance_min_second_side_m
    default: 0.35
    range: [0.25, 0.60]
    unit: m
    user_editable: true
    rationale: Minimum on the tighter second side of a double-width surface; about 14 in, enough to reach in sideways.
  - key: foot_clearance_m
    default: 0.45
    range: [0.30, 0.75]
    unit: m
    user_editable: true
    rationale: Room to pass the foot of the open bed; about 18 in. Not a circulation route width — see CIR-*.
  - key: max_handle_height_m
    default: 1.70
    range: [1.40, 1.95]
    unit: m
    user_editable: true
    rationale: Grasp height reachable by a short adult standing flat; roughly the 5th-percentile female overhead functional grip.
  - key: max_deployment_force_n
    default: 100.0
    range: [50.0, 200.0]
    unit: N
    user_editable: true
    rationale: Pull force one unassisted adult can apply safely in a stooped-to-standing arc. Manufacturer piston specification governs where known.
  - key: bedding_store_distance_m
    default: 8.0
    range: [2.0, 25.0]
    unit: m
    user_editable: true
    rationale: Walking distance from bed to spare bedding beyond which bedding changes get deferred.
  - key: single_width_m
    default: 1.00
    range: [0.90, 1.10]
    unit: m
    user_editable: false
    rationale: Nominal single-bed width used as the one-side-access cut-off; UK single mattress is 91 cm (36 in), US twin 98 cm (38.5 in).
score:
  weight: 6
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: self
    transform: {slide_along_wall: to_maximise min(openSideClearances(self).left, openSideClearances(self).right)}
    cost: free
    effort: medium_physical
    reversible: true
    copy: Sliding the bed along its wall by a few centimetres often buys the one side you need to tuck a sheet in without wrestling.
  - rank: 2
    action: add_object
    add: softgoods.bedding.spare_set
    transform: {store_in: nearestClosedStorage(room), quantity: 2, include: [sleep.mattress_protector, softgoods.pillow.spare]}
    cost: low
    effort: low
    reversible: true
    copy: Keep the guest bedding in this room, not the airing cupboard two floors down. Two sets, so one is always clean.
  - rank: 3
    action: swap_object
    target: sleep.*
    transform: {to: classWithLowerDeploymentForce(self), prefer: [sleep.daybed.*, sleep.bed.single]}
    cost: high
    effort: medium
    reversible: false
    copy: If the mechanism is a fight every time, the honest fix is a different bed rather than a better technique.
conflicts_with: [ERG-CLR-012]
supersedes: []
requires_rules: [RM-BEDS-005]
tags: [convertible, ergonomics, bed_making, effort, guest]
localization_notes: Anthropometric parameters should switch with `site.anthro_population` where the engine supports it; the defaults are Western-adult 5th-percentile-female reach.
```

#### Why — tradition

No traditional doctrine; functional rule. Worth noting in copy that Japanese futon practice
(`japanese.ma_spatial`) solved this by making the bedding itself the light, foldable component
rather than the frame.

#### Why — psychology / physiology

Manual-handling ergonomics: a stooped pull with a twisting component is the classic low-back-injury
posture, and the arc of a sofa-bed frame pull recruits exactly that. Reach data (standard
anthropometric tables such as those consolidated in *Humanscale* and in Panero & Zelnik's
*Human Dimension & Interior Space*) set the handle-height ceiling. The bedding-distance parameter is
a friction rule, not an ergonomic one — no direct empirical support; mechanism is plausible but
untested.

#### Customer insight

Whoever makes up the bed is usually doing it alone, often in a hurry, often already tired. If you
cannot get a fitted sheet on without dragging the bed out from the wall, the room will quietly stop
being offered to guests.

#### Failure modes / when to skip

Suppress the second-side clearance requirement in rooms below roughly 8 m² where one-side access is
the only viable layout (see RM-BEDS-013) — flag it as an accepted trade-off rather than a failure.
Where a household member has a recorded upper-limb or back limitation, treat
`max_deployment_force_n` as a hard gate and escalate severity to `high`; the correct remedy is a
different bed class, not a technique tip.

---

### RM-BEDS-007 — Match the sleep-surface footprint to the room's largest fitting size, not to the largest size sold

```yaml
id: RM-BEDS-007
title: Match the sleep-surface footprint to the room's largest fitting size, not to the largest size sold
system: ergonomics.anthropometrics
group: sleep_surface_selection
version: 1
status: active
applies_to:
  rooms: [bedroom_secondary, bedroom_guest, guest_suite, loft, attic_finished, basement_finished]
  objects: [sleep.bed.*, sleep.sofa_bed.*, sleep.murphy_bed.*, sleep.daybed.*]
  requires_features: []
scope: object_placement
severity: high
confidence: ergonomic
evidence_class: ergonomic
belief_gated: false
predicate: |
  let A   = usableFloorArea(room, min_headroom_m=1.9)
  let W   = shortestUsableSpan(room)
  # Area-banded size ceiling. Oversizing the bed is the single commonest spare-room mistake.
  let ceiling =
    if A <  p.band_single_max_m2 then "single"
    else if A <  p.band_small_double_max_m2 then "small_double"
    else if A <  p.band_double_max_m2 then "double"
    else if A <  p.band_king_max_m2 then "king"
    else "super_king"
  assert sizeRank(target) <= sizeRank(ceiling)
  # Span gate: bed width plus the required clearances must fit across the room.
  assert footprint(target).w + requiredSideClearanceTotal(target) <= W
  # Length gate including headboard and any footboard.
  assert footprint(target).d + p.headboard_allowance_m + p.footboard_allowance_m <= longestUsableSpan(room)
  # Occupancy sanity: the bed alone must not eat the room.
  assert footprintArea(target) / A <= p.max_bed_area_fraction
params:
  - key: band_single_max_m2
    default: 8.5
    range: [6.5, 10.5]
    unit: m2
    user_editable: true
    rationale: Below roughly 8.5 m² usable, anything wider than a single leaves no workable access or storage. UK box rooms typically land 6.5–8.5 m².
  - key: band_small_double_max_m2
    default: 10.5
    range: [8.5, 12.5]
    unit: m2
    user_editable: true
    rationale: A 120 cm (4 ft) small double fits this band where a 135 cm double would not.
  - key: band_double_max_m2
    default: 14.0
    range: [11.0, 18.0]
    unit: m2
    user_editable: true
    rationale: Comfortable band for a 135–152 cm (4 ft 6 in – 5 ft) bed plus two nightstands and a wardrobe.
  - key: band_king_max_m2
    default: 20.0
    range: [15.0, 26.0]
    unit: m2
    user_editable: true
    rationale: Above this a super king is defensible in a guest room; below it it is showing off at the guest's expense.
  - key: headboard_allowance_m
    default: 0.10
    range: [0.03, 0.25]
    unit: m
    user_editable: true
    rationale: Depth a headboard adds beyond the mattress; upholstered and buttoned styles run to 0.20 m.
  - key: footboard_allowance_m
    default: 0.00
    range: [0.00, 0.20]
    unit: m
    user_editable: true
    rationale: Zero unless a footboard or ottoman is specified; sleigh frames add up to 0.20 m.
  - key: max_bed_area_fraction
    default: 0.42
    range: [0.28, 0.60]
    unit: ratio
    user_editable: true
    rationale: Above this fraction the room reads as a mattress in a box and no secondary use survives.
score:
  weight: 8
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: swap_object
    target: sleep.*
    transform: {to_size: sizeCeiling(room), keep_class: true, keep_wall: anchorWallOf(room)}
    cost: high
    effort: medium
    reversible: false
    copy: Going one size down on the bed usually buys you a bedside table, a chair and the ability to walk round it. Guests notice those more than the extra 15 cm of mattress.
  - rank: 2
    action: swap_object
    target: sleep.bed.double
    transform: {to: [sleep.bed.twin, sleep.bed.twin], arrangement: pair_with_shared_nightstand}
    cost: high
    effort: medium
    reversible: true
    copy: Two singles with a table between them fit where one double does not, sleep two friends or siblings properly, and push together for a couple.
  - rank: 3
    action: resize_object
    target: sleep.bed.*
    transform: {remove: footboard, slim: headboard}
    cost: low
    effort: low
    reversible: true
    copy: Losing a bulky footboard or a deep padded headboard can reclaim 20–30 cm (8–12 in) of length — sometimes exactly the amount you are short.
conflicts_with: []
supersedes: []
requires_rules: [RM-BEDS-004]
tags: [bed_size, footprint, box_room, sizing, honesty]
localization_notes: Size names and dimensions are market-specific. UK: single 91 × 191 cm, small double 122 × 191, double 137 × 191, king 152 × 198, super king 183 × 198. US: twin 38.5 × 74.5 in, twin XL 38.5 × 79.5, full 53.5 × 74.5, queen 60 × 79.5, king 76 × 79.5, California king 72 × 83.5. Map `sizeRank` per market; never show a UK user a "queen".
```

#### Why — tradition

No traditional doctrine sets bed size against room size; this is a functional rule. Classical
proportion systems (`classical.proportion`) would argue for a dominant object sized to the room's
module, and Alexander's *A Pattern Language* argues for "alcoves" that fit their contents — both
converge on restraint, but the numbers here come from clearance arithmetic, not from tradition.

#### Why — psychology / physiology

The mechanism is clearance and crowding rather than anything about sleep itself: an oversized bed
consumes the circulation and the provision (bedside surface, luggage landing, hanging space) that
determine whether a guest can actually live in the room. Perceived-crowding research indicates the
experience tracks thwarted movement and goals more than raw density, which is why a guest in a
small room with a single and a chair usually reports a better stay than a guest in the same room
with a king and nowhere to stand. No direct empirical support for the specific area bands; they are
derived arithmetically from the clearance minimums in `ERG-CLR-*`.

#### Customer insight

The most common spare-room mistake is a bed one size too big. It looks generous on the floor plan
and feels mean in real life, because it takes away the bedside table, the chair and the space to open
a suitcase. Guests remember having somewhere to put their glasses.

#### Failure modes / when to skip

Skip where the bed is already owned and cannot be replaced — fall back to remedy 3 and to the
one-side-access allowance (RM-BEDS-013). Do not apply the size ceiling in a `guest_suite` explicitly
designed as a hospitality showpiece, or where the room is a couple's regular
separate-sleeping bedroom (RM-BEDS-045) and comfort outranks provision. Override for a recorded
occupant over roughly 190 cm (6 ft 3 in) tall: length beats every other consideration, and a UK
191 cm mattress is genuinely too short for them.

---

### RM-BEDS-008 — Tell the truth about an unused guest room in a space-constrained home

```yaml
id: RM-BEDS-008
title: Tell the truth about an unused guest room in a space-constrained home
system: product.ux
group: room_reassignment
version: 1
status: active
applies_to:
  rooms: [bedroom_guest, bedroom_secondary]
  objects: []
  requires_features: []
scope: whole_home
severity: medium
confidence: expert_consensus
evidence_class: mixed
belief_gated: false
predicate: |
  # All of these must hold before the engine is allowed to suggest giving up the guest room.
  let n        = guestNightsPerYear(room)
  let idle     = roomUnassignedDays(room, window_days=365)
  let pressure = unmetRoomDemand(home)          # list of uses the household wants and has nowhere for
  let area     = room.area_m2
  let per_head = habitableAreaPerOccupant(home)

  require n <= p.max_guest_nights_for_reassignment
  require idle >= p.min_idle_days
  require count(pressure) >= 1
  require per_head <= p.crowded_area_per_person_m2
  require area >= p.min_reassignable_area_m2
  # Do not suggest it if the room is genuinely reserved for a named person's regular stay.
  forbid exists(reservedFor(room)) and reservedNightsPerYear(room) > p.max_guest_nights_for_reassignment
  # And never as a hard finding — always as an offered conversation.
  assert findingModeOf(self) == "advisory_with_alternative"
params:
  - key: max_guest_nights_for_reassignment
    default: 10
    range: [0, 40]
    unit: nights_per_year
    user_editable: true
    rationale: Ten nights a year is under 3% occupancy; below this the room is costing more than it returns in a crowded home.
  - key: min_idle_days
    default: 300
    range: [180, 365]
    unit: days
    user_editable: true
    rationale: Days in the year the room served no declared active use at all.
  - key: crowded_area_per_person_m2
    default: 30.0
    range: [15.0, 60.0]
    unit: m2
    user_editable: true
    rationale: Habitable area per occupant below which the household is plausibly space-constrained. Set high by default so the suggestion fires rarely and fairly.
  - key: min_reassignable_area_m2
    default: 6.5
    range: [4.0, 12.0]
    unit: m2
    user_editable: true
    rationale: Below this the room cannot usefully become anything else either, so the suggestion is pointless. 6.5 m² also matches the England HMO single-occupancy sleeping-room minimum.
  - key: offer_hybrid_first
    default: true
    range: [true, false]
    unit: bool
    user_editable: true
    rationale: Most users want the guest capability kept; a convertible-plus-real-use hybrid should always be offered before outright reassignment.
score:
  weight: 0
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: reassign_room
    target: room
    transform: {to: highestUnmetDemand(home), retain_guest_capability_via: [sleep.murphy_bed.*, sleep.sofa_bed.*, sleep.air_bed.*], keep: [softgoods.bedding.spare_set]}
    cost: medium
    effort: high
    reversible: true
    copy: This room sleeps a guest about {n} nights a year and sits empty the rest. You have told us you have nowhere to work / exercise / let a teenager be. You can have both — give the room its real job and keep a wall bed or a good sofa bed for visitors.
  - rank: 2
    action: reassign_room
    target: room
    transform: {to: highestUnmetDemand(home), guest_fallback: sleep.air_bed.double, fallback_location: living_room}
    cost: low
    effort: medium
    reversible: true
    copy: For a couple of nights a year, a good air bed in the living room is a perfectly decent way to host — and it gives you back a whole room for the other 363 days.
  - rank: 3
    action: annotate
    target: room
    transform: {show: guest_room_cost_summary, fields: [nights_per_year, m2_idle, notional_rent_equivalent, unmet_uses]}
    cost: free
    effort: none
    reversible: true
    copy: Here is what the guest room costs you and what it gives back, in plain numbers. No pressure — some people keep it for the once-a-year visit and that is a fine reason.
conflicts_with: []
supersedes: []
requires_rules: [RM-BEDS-001, RM-BEDS-004]
tags: [honesty, reassignment, spare_room, advisory, signature_rule]
localization_notes: In cultures with strong extended-family hosting obligations (much of South Asia, the Middle East, southern Europe, many diaspora households), a kept guest room is a social duty rather than an inefficiency. Gate this rule behind `user.hosting_culture != obligated` or raise `max_guest_nights_for_reassignment` toward zero in those markets, and never phrase it as waste.
```

#### Why — tradition

No traditional doctrine; this is a product-honesty rule. It runs *against* a real tradition —
keeping a room ready for guests is a hospitality norm in many cultures, and vastu and feng shui both
treat the guest room as a real programmatic room deserving good placement (`VS-ROOM-*`,
`FS-ROOM-*`). The rule therefore never asserts the guest room is wrong; it puts the numbers on the
table and offers a hybrid first.

#### Why — psychology / physiology

Two effects in tension. Sunk-cost and endowment effects make an existing furnished room hard to
reassign even when it serves no one, which is why an explicit cost summary helps. Against that,
place attachment and anticipated hospitality have genuine value — the room's function includes "I
am the kind of household that can take someone in", and that is not irrational. No direct empirical
support for the thresholds; they are deliberately conservative so the suggestion is rare.

#### Customer insight

We will only say this once, and gently: if someone sleeps here five nights a year and you have
nowhere to work, exercise or be alone, the room is not earning its keep. A wall bed or a good sofa
bed keeps you able to host and gives you back a room you use every week.

#### Failure modes / when to skip

Never fire in a home with generous area per person, never fire when the room is reserved for a named
regular visitor (an elderly parent, a child at university, a co-parenting schedule), never fire
within 12 months of a recorded bereavement or family change, and never fire more than once per
household per year. Suppress entirely if the user has set the guest room's use as locked. This rule
must never affect the numeric score (`weight: 0`) — it is a conversation, not a penalty.

---

### RM-BEDS-009 — A room may only be labelled a sleeping room if it passes the habitable-sleeping gate

```yaml
id: RM-BEDS-009
title: A room may only be labelled a sleeping room if it passes the habitable-sleeping gate
system: zoning.public_private
group: minimum_viability
version: 1
status: active
applies_to:
  rooms: [bedroom_secondary, bedroom_guest, guest_suite, storage_room, loft, attic_finished, basement_finished, home_office]
  objects: [sleep.bed.*, sleep.sofa_bed.*, sleep.murphy_bed.*, sleep.daybed.*, sleep.futon.*, sleep.air_bed.*]
  requires_features: []
scope: room_composition
severity: high
confidence: code_mandated
evidence_class: mixed
belief_gated: false
predicate: |
  # Fires whenever a sleep surface is placed in a room not already typed as a bedroom.
  require count(objectsOfClass(room, "sleep_surface")) >= 1

  let A_code = usableFloorArea(room, min_headroom_m=p.min_counted_ceiling_m)
  let W      = shortestUsableSpan(room)

  # Dimensional gate (IRC family; jurisdiction varies).
  assert A_code >= p.min_habitable_area_m2
  assert W      >= p.min_horizontal_dimension_m
  assert ceilingHeightAt(bedCentroid(room)) >= p.min_ceiling_height_m

  # Escape gate — delegated to the safety layer, applied here as a labelling precondition.
  assert satisfies(SAFE-EGR-101, room)      # emergency escape / rescue opening present & usable
  assert satisfies(SAFE-FIR-140, room)      # smoke alarm coverage for a sleeping room

  # Occupancy gate where a licensing regime applies (let rooms, HMOs, lodgers).
  require context.tenure in [let, hmo, lodger, paying_guest] implies
    A_code >= (occupantsOver10(room) >= 2 ? p.hmo_two_person_m2
              : occupantsOver10(room) == 1 ? p.hmo_one_adult_m2
              : p.hmo_one_child_m2)

  # If any gate fails, the room is not a bedroom — it is a room with a bed in it. Label it honestly.
  forbid room.type in [bedroom_secondary, bedroom_guest, guest_suite] and not allGatesPass(self)
params:
  - key: min_habitable_area_m2
    default: 6.5
    range: [4.5, 11.5]
    unit: m2
    user_editable: false
    rationale: IRC R304.1 requires habitable rooms to have a floor area of not less than 70 sq ft (6.5 m²). England's Nationally Described Space Standard sets a higher design target of 7.5 m² for a single bedroom and 11.5 m² for a double or twin.
    jurisdiction_varies: true
  - key: min_horizontal_dimension_m
    default: 2.134
    range: [1.80, 2.75]
    unit: m
    user_editable: false
    rationale: IRC R304.2 requires habitable rooms to be not less than 7 ft (2134 mm) in any horizontal dimension. England's NDSS separately requires a single bedroom to be at least 2.15 m wide and a double or twin at least 2.55 m (2.75 m for the first one).
    jurisdiction_varies: true
  - key: min_ceiling_height_m
    default: 2.134
    range: [1.90, 2.50]
    unit: m
    user_editable: false
    rationale: IRC R305 sets a minimum ceiling height of 7 ft (2134 mm) for habitable spaces, with defined allowances for sloped ceilings and beams. Confirm the local adopted code and amendments.
    jurisdiction_varies: true
  - key: min_counted_ceiling_m
    default: 1.50
    range: [1.40, 2.134]
    unit: m
    user_editable: false
    rationale: The England HMO licensing regulations exclude from the counted floor area any part of a room where the ceiling height is less than 1.5 m. Useful as a general "usable floor" convention for sloped rooms even outside that regime.
    jurisdiction_varies: true
  - key: hmo_one_adult_m2
    default: 6.51
    range: [6.51, 10.0]
    unit: m2
    user_editable: false
    rationale: England's Licensing of Houses in Multiple Occupation (Mandatory Conditions of Licences) Regulations 2018 set a minimum of 6.51 m² of sleeping-room floor area for one person over 10 years old.
    jurisdiction_varies: true
  - key: hmo_two_person_m2
    default: 10.22
    range: [10.22, 15.0]
    unit: m2
    user_editable: false
    rationale: Same regulations: not less than 10.22 m² for two persons over 10 years old.
    jurisdiction_varies: true
  - key: hmo_one_child_m2
    default: 4.64
    range: [4.64, 8.0]
    unit: m2
    user_editable: false
    rationale: Same regulations: not less than 4.64 m² for one person under 10 years old.
    jurisdiction_varies: true
score:
  weight: 9
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: relabel_room
    target: room
    transform: {to: study_library_or_storage_room, note: not_a_legal_bedroom, keep_sleep_surface: occasional_use_only}
    cost: free
    effort: none
    reversible: true
    copy: This room is too small, too low or too enclosed to count as a bedroom where you live. You can still put a bed in it for the odd night — but do not market it, let it, or plan a child into it as one.
  - rank: 2
    action: add_feature
    add: window_enlargement
    transform: {to_meet: SAFE-EGR-101, target_opening: {min_net_clear_m2: 0.530, min_clear_h_m: 0.610, min_clear_w_m: 0.508, max_sill_m: 1.118}}
    cost: high
    effort: professional
    reversible: false
    copy: The window is the blocker. Making an escape-sized opening is builder's work, but it is what turns this into a room someone may legally sleep in.
  - rank: 3
    action: annotate
    target: room
    transform: {show: jurisdiction_notice, fields: [code_family, local_authority_lookup_link]}
    cost: free
    effort: none
    reversible: true
    copy: Bedroom rules genuinely differ between countries, states and even councils. We have used the common baseline — check yours before you rely on it.
conflicts_with: []
supersedes: []
requires_rules: [SAFE-EGR-101, SAFE-FIR-140]
tags: [code, box_room, minimum_viability, egress, jurisdiction_varies, honesty]
localization_notes: >
  Numbers cited: IRC R304.1 (70 sq ft / 6.5 m² minimum habitable floor area), R304.2 (7 ft / 2134 mm
  minimum horizontal dimension), R305 (7 ft / 2134 mm ceiling height), R310 (every sleeping room
  requires an emergency escape and rescue opening; net clear opening not less than 5.7 sq ft /
  0.530 m², or 5 sq ft / 0.465 m² at grade floor, with net clear height not less than 24 in /
  610 mm, net clear width not less than 20 in / 508 mm, and sill not more than 44 in / 1118 mm above
  the floor). England: Licensing of Houses in Multiple Occupation (Mandatory Conditions of Licences)
  (England) Regulations 2018 (4.64 / 6.51 / 10.22 m²; floor under 1.5 m ceiling not counted);
  Technical housing standards – nationally described space standard, 2015 (single bedroom 7.5 m²
  and 2.15 m wide; double or twin 11.5 m², first one 2.75 m wide, others 2.55 m). Scotland, Wales,
  Northern Ireland, Canada (NBC), Australia/New Zealand (AS/NZS, BCA) and India (NBC-India) differ —
  substitute the local adopted values before relying on this rule commercially.
```

#### Why — tradition

No traditional doctrine; this is code and definition. Both feng shui and vastu have their own views
on which rooms should hold beds, but neither speaks to statutory minimum areas, so this rule sits
above them in the precedence ladder as a code/labelling gate.

#### Why — psychology / physiology

The escape requirement is the physiological one: sleeping occupants are the population least able to
detect and respond to fire, which is why codes single out sleeping rooms for both escape openings
and alarm coverage. The area and dimension minimums are historically rooted in overcrowding and
public-health legislation rather than in a measured comfort threshold, and we should not pretend
otherwise. No direct empirical support for a comfort effect at exactly 6.5 m²; the number is legal,
not experiential.

#### Customer insight

Some rooms just are not bedrooms, however much you want them to be — usually because of the window
rather than the floor. We will tell you which side of the line yours falls on, and what it would take
to move it.

#### Failure modes / when to skip

Do not apply the licensing occupancy figures to owner-occupied households — they exist for let and
multi-occupancy housing and firing them on a family's own box room is both wrong and alarming. Do
not hard-fail an existing bedroom in an old house for ceiling height alone; most pre-war and
converted attic rooms are legally grandfathered. Where the jurisdiction is unknown, report the
requirement in words and mark it unverified rather than asserting a number.

---

### RM-BEDS-010 — Give a bed under a slope its head in the headroom, not its face in it

```yaml
id: RM-BEDS-010
title: Give a bed under a slope its head in the headroom, not its face in it
system: ergonomics.anthropometrics
group: awkward_geometry
version: 1
status: active
applies_to:
  rooms: [bedroom_secondary, bedroom_guest, loft, attic_finished, bedroom_teen, bedroom_child]
  objects: [sleep.bed.*, sleep.daybed.*, sleep.futon.*]
  requires_features: []
  min_room_area_m2: 5.0
scope: object_placement
severity: medium
confidence: ergonomic
evidence_class: ergonomic
belief_gated: false
predicate: |
  require room.ceiling_type in [sloped, vaulted] or exists(nearestFeature(target, low_header))
  # Sitting-up headroom above the pillow line is the governing dimension.
  assert ceilingHeightAt(pillowLine(target)) >= p.min_sit_up_headroom_m
  # Standing headroom on at least one long side, so the bed can be made and got into.
  assert exists(side in [left, right] where ceilingHeightAt(sideAccessLine(target, side)) >= p.min_standing_headroom_m)
  # The low end of the slope is for the foot of the bed, and even there a minimum.
  assert ceilingHeightAt(footLine(target)) >= p.min_foot_headroom_m
  # Head-strike protection where the slope crosses a sitting or standing zone.
  forEach z in [pillowLine(target), sideAccessLine(target, "left"), sideAccessLine(target, "right")]:
    penalize(ceilingHeightAt(z) < p.head_strike_warning_m ? 1 : 0, weight=4)
  # Do not put the bed head against the slope's lowest wall if an alternative exists.
  prefer headboardWallHeight(target) >= p.preferred_headboard_wall_height_m
params:
  - key: min_sit_up_headroom_m
    default: 1.25
    range: [1.05, 1.60]
    unit: m
    user_editable: true
    rationale: Seated-in-bed height for a tall adult: mattress top around 0.55 m plus seated head height around 0.92 m gives roughly 1.45 m; 1.25 m is the tolerable floor for a low-mattress guest bed. About 4 ft 1 in.
  - key: min_standing_headroom_m
    default: 1.90
    range: [1.75, 2.10]
    unit: m
    user_editable: true
    rationale: Height to stand and make the bed without stooping; about 6 ft 3 in. Below this the bed gets made on knees.
  - key: min_foot_headroom_m
    default: 0.85
    range: [0.60, 1.20]
    unit: m
    user_editable: true
    rationale: Clearance above the duvet at the foot so bedding and feet are not compressed; about 2 ft 9 in.
  - key: head_strike_warning_m
    default: 1.80
    range: [1.60, 2.00]
    unit: m
    user_editable: true
    rationale: Height below which a standing adult in that zone will eventually hit their head; about 5 ft 11 in.
  - key: preferred_headboard_wall_height_m
    default: 1.40
    range: [1.00, 2.134]
    unit: m
    user_editable: true
    rationale: Wall height at the headboard preferred so a sitting guest has a real wall behind them rather than a sloping ceiling.
score:
  weight: 6
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: rotate_object
    target: sleep.*
    transform: {to: foot_toward_lowest_eave, head_toward_ridge_or_full_height_wall}
    cost: free
    effort: medium_physical
    reversible: true
    copy: Turn the bed so your feet go into the low part and your head sits under the tall part. You only need height where you sit up.
  - rank: 2
    action: swap_object
    target: sleep.bed.*
    transform: {to_low_profile: true, max_mattress_top_m: 0.45, remove: bed_base_drawers}
    cost: high
    effort: medium
    reversible: false
    copy: A low platform bed buys back 15–20 cm (6–8 in) of headroom under a slope — often the difference between sitting up comfortably and banging your head.
  - rank: 3
    action: add_object
    add: storage.under_eaves_unit
    transform: {position: in_zone where ceilingHeightAt < p.min_standing_headroom_m, max_h: ceilingHeightAt(position) - 0.05}
    cost: medium
    effort: medium
    reversible: true
    copy: The space too low to stand in is perfect for low drawers or shoe storage. Use it for things, not for people.
  - rank: 4
    action: add_object
    add: softgoods.headboard.padded_wall_panel
    transform: {mount_on: sloped_surface_above_pillow, thickness_m: 0.05}
    cost: low
    effort: low
    reversible: true
    copy: If the slope really is over the pillow, a padded panel on it turns a head-bump into a lean-back.
conflicts_with: []
supersedes: []
requires_rules: [RM-BEDS-009]
tags: [loft, attic, sloped_ceiling, headroom, awkward, box_room]
localization_notes: The England HMO convention of not counting floor under 1.5 m of ceiling height is a useful default for `usableFloorArea` in sloped rooms even outside England.
```

#### Why — tradition

No traditional doctrine on slopes as such; functional rule. Feng shui does have relevant doctrine on
sleeping under a sloping ceiling or an exposed beam ("oppressive" or cutting qi) and that belongs to
`FS-ROOM-*` / `FS-BEAM-*` — it happens to recommend the same move (get the head out from under the
low or cutting element), which is worth telling the user, because convergence is the app's strongest
content.

#### Why — psychology / physiology

Two real mechanisms. Mechanically, seated head height plus mattress height sets a hard geometric
floor; standard anthropometric tables put seated head height for a tall adult male near 0.95 m above
the seat surface. Perceptually, a low overhead plane close to the head produces reliable reports of
oppressiveness and is an established variable in environmental-psychology work on ceiling height and
perceived spaciousness. No direct empirical support for the specific 1.25 m sit-up threshold; it is
an ergonomic derivation.

#### Customer insight

Under a sloping ceiling, put your feet in the low bit. You need full height where you sit up and
where you stand to make the bed — nowhere else. The part you cannot stand in is excellent storage.

#### Failure modes / when to skip

Skip in flat-ceilinged rooms with no low header. Do not fire where the slope is above a window seat
or a dormer that already provides the standing zone. Where the low side is the only wall long enough
for the bed, accept the compromise, apply the padded-panel remedy, and say plainly that this room
suits a shorter guest or a child better than a tall adult.

---
