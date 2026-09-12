# Closets, Wardrobes, Dressing Rooms & Whole-Home Storage — Functional / Practical / Design Layer
<!-- library-file: v1 | system(s): modernism.functionalism, ergonomics.task_zones, ergonomics.anthropometrics, behavior.habit_design, product.parameter, product.ux, safety.fire, safety.chemical, safety.child, psych.cognitive_load, circulation.space_syntax, lighting.photometric | rule-id-prefixes: RM-STO | author-agent: room-15-storage-functional -->

## Scope

This file is the **functional layer** for every storage room type and every storage object in the
home: `walk_in_closet`, `reach_in_closet`, `dressing_room`, `linen_closet`, `storage_room`,
`pantry_walk_in` (storage geometry only — food zoning belongs to the kitchen files),
`attic_storage`, `basement_unfinished`, `garage_parking` and `loft` **used as bulk store**, plus
wardrobes and storage furniture wherever they stand (bedrooms, hallways, entries, offices).

It also owns one **whole-home** feature that no single-room file could own: the
**storage audit**. The audit computes how much hanging, shelf, drawer and bulk capacity a
specific household actually needs, measures what the dwelling actually provides, and reports the
gap. This matters because the overwhelming majority of "I'm so disorganised" complaints are a
**capacity deficit**, not a behavioural failure, and saying that out loud to a user is both true
and kind. Every decluttering feature in the product is gated behind this audit.

**What this file does NOT do** (apply, don't re-derive):
- Feng shui doctrine on closets, mirrors, under-bed storage, clutter and the bedroom → `FS-ROOM-*`, `FS-CMD-*`, `FS-BAG-*`
- Vastu storage-direction doctrine (heavy in SW, wardrobes on S/W walls, safes facing N) → `VS-ROOM-*`
- Numeric clearance tables, reach envelopes, doorway and aisle minimums → `ERG-CLR-*`
- Luminaire selection, layer counts, photometric targets → `LGT-*`
- Acoustic isolation of a closet used as a buffer → `ACU-*`
- Colour and finish specification → `CLR-*`
- Corridor and route hierarchy → `CIR-*`
- Tipover, fire, chemical, child and egress safety enforcement → `SAFE-*`

Where one of those layers applies to a storage room, this file states **which rule, with what
parameter value, at what priority** — see `## CROSS_REFERENCES`.

**Honesty posture for this file.** Almost nothing here is code-mandated and almost nothing here
has a randomised trial behind it. The capacity model in RM-STO-002 … RM-STO-006 is an explicit,
transparent, fully user-editable **house model** built from garment and container geometry, not a
published dataset. It is labelled that way in every rule. Where a real external standard exists
(NEC closet luminaire clearances, ADA reach ranges, EPA humidity guidance, UC IPM clothes-moth
treatment temperatures, the NIOSH lifting equation's vertical multiplier) it is named and used.
Where it does not, the rule says `No direct empirical support` and explains the mechanism anyway.

## Rule count: 55

## Rules

### RM-STO-001 — The whole-home storage audit runs before any storage advice

```yaml
id: RM-STO-001
title: The whole-home storage audit runs before any storage advice
system: product.ux
group: storage_audit
version: 1
status: active
applies_to:
  rooms: [walk_in_closet, reach_in_closet, dressing_room, linen_closet, storage_room, attic_storage, basement_unfinished, basement_finished, garage_parking, loft, bedroom_primary, bedroom_secondary, bedroom_child, bedroom_teen, bedroom_shared_siblings, mudroom, entry_foyer, utility_mechanical, studio_apartment, open_plan_combined]
  objects: [storage.*]
  requires_features: []
scope: whole_home
severity: high
confidence: expert_consensus
evidence_class: mixed
belief_gated: false
predicate: |
  # Gate: the engine must not emit any decluttering, "reduce", or "too much stuff"
  # content until the audit has produced a deficit report for the whole dwelling.
  let audit = home.storageAudit
  require audit.status == "complete" before any advice.tagged("reduce_possessions")
  # An audit is complete only when all four unit families have a required and a provided figure.
  forEach unit in [hang_m, shelf_m, drawer_m3, bulk_m3]:
    assert requiredStorage(home.household, unit) != null
    assert providedStorage(home, unit) != null
  # If the audit shows a deficit in any unit, capacity advice must be ranked ABOVE
  # behavioural advice in the report ordering.
  let d = storageDeficit(home, any_unit)
  assert if d > p.deficit_headline_threshold_pct then
           advice.orderOf("add_capacity") < advice.orderOf("reduce_possessions")
  # Never present a deficit as a user failing.
  forbid advice.tone == "corrective" when d > 0
params:
  - key: deficit_headline_threshold_pct
    default: 10.0
    range: [0.0, 50.0]
    unit: pct
    user_editable: false
    rationale: Above a 10% shortfall in any unit the honest primary finding is missing capacity, not habit.
  - key: audit_required_before_declutter
    default: true
    range: [true, false]
    unit: bool
    user_editable: false
    rationale: Product guardrail. Advising reduction before measuring capacity is both unkind and usually wrong.
  - key: audit_granularity
    default: per_person_per_category
    range: [household_total, per_person, per_person_per_category]
    unit: enum
    user_editable: true
    rationale: Per-person-per-category is the only granularity that can locate where the shortfall actually is.
score:
  weight: 9
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: run_analysis
    target: home
    transform: {run: storage_audit, emit: deficit_report, order: capacity_before_behaviour}
    cost: free
    effort: low
    reversible: true
    copy: Before we say a word about tidying, let's measure. We'll work out how much hanging, shelf, drawer and bulk storage your household actually needs, compare it with what your home gives you, and show you the gap.
  - rank: 2
    action: request_input
    target: user
    transform: {ask: [household_composition, hung_garment_count_band, shoe_pairs_band, declared_hobbies, bulk_categories_owned]}
    cost: free
    effort: low
    reversible: true
    copy: Five quick questions and we can size your storage properly — no photographing your whole wardrobe required.
conflicts_with: []
supersedes: []
requires_rules: []
tags: [audit, capacity, whole_home, signature_rule, dignity, product_guardrail]
localization_notes: Capacity norms differ by culture and climate (heavy winter outerwear, sari/hanfu/abaya storage, futon rather than bed linen). All coefficients are parameters; ship regional coefficient packs rather than hard-coding one wardrobe culture.
```

#### Why — tradition
No traditional doctrine prescribes a storage audit; this is a functional rule. The nearest
traditional relatives are the Japanese *oshiire* and *kura* planning habit of sizing a dedicated
storage volume as part of the plan rather than as a leftover, and the Shaker practice of building
peg rail and built-in cupboard capacity into the room's fabric. Feng shui and vastu both treat
clutter as an energetic problem (see `FS-ROOM-*`), but neither offers a capacity calculation — so
this layer supplies the arithmetic those layers assume.

#### Why — psychology / physiology
No direct empirical support for the specific thresholds; the mechanism is well-established in
adjacent literature. Putting an item away is a short behaviour chain, and each additional step
(move a box, unstack, find space) raises the effort cost until the behaviour stops — the standard
friction/behaviour-cost account used in habit design. When capacity is genuinely short, no amount
of motivation closes the gap, and repeated failure at an impossible task is a reliable route to
self-blame. Naming the structural cause first removes an attribution error the user has usually
already made about themselves.

#### Customer insight
Most people who tell us they're "hopeless at tidying" turn out to live in a home that is simply
short of storage — often by a quarter or more. We'd rather measure than lecture. Answer a few
questions and we'll tell you honestly whether your home has room for your life.

#### Failure modes / when to skip
Skip the full audit when the user has come in for one specific task ("where do I put this
bookcase?") — run a single-category mini-audit instead. Do not force the audit on a user who has
explicitly declined it; instead mark all reduction advice as unavailable and say why in one
sentence. Do not run the audit on a short-term rental or staging project where the household
composition isn't the user's own.

---

### RM-STO-002 — Required hanging capacity: linear metres of rod per person

```yaml
id: RM-STO-002
title: Required hanging capacity — linear metres of rod per person
system: product.parameter
group: storage_audit
version: 1
status: active
applies_to:
  rooms: [walk_in_closet, reach_in_closet, dressing_room, bedroom_primary, bedroom_secondary, bedroom_guest, bedroom_child, bedroom_teen, bedroom_shared_siblings, studio_apartment, dorm_room, mudroom, entry_foyer, storage_room]
  objects: [storage.closet_system.rod, storage.closet_system.rod_double, storage.closet_system.rod_long_hang, storage.wardrobe.*, storage.garment_rail.freestanding]
  requires_features: []
scope: whole_home
severity: high
confidence: expert_consensus
evidence_class: ergonomic
belief_gated: false
predicate: |
  # Required rod length = sum over people of (garment count x mean linear width) / packing factor
  let req_m = 0
  forEach person in home.household:
    let band  = person.hung_garment_band            # compact | typical | extensive | declared
    let n     = garmentCount(person, band)          # declared overrides band
    let w     = meanGarmentWidth(person.age_band)   # m per garment, see data block
    req_m = req_m + (n * w) / p.rod_packing_factor
  assert requiredStorage(home.household, hang_m) == req_m
  # Split the requirement into the three hang classes so internals can be proportioned.
  assert sumOf(req_long_m, req_short_m, req_outer_m) == req_m
  assert req_long_m  >= req_m * p.long_hang_share
  assert req_short_m >= req_m * p.short_hang_share
  # Outerwear is required capacity but is NOT required to be in the bedroom.
  prefer locationOf(req_outer_m) in [entry_foyer, mudroom, hallway_corridor]
params:
  - key: rod_packing_factor
    default: 0.80
    range: [0.60, 0.95]
    unit: ratio
    user_editable: true
    rationale: A rod packed beyond about 80% of its nominal garment count stops being browsable — you cannot slide garments to see them. 0.80 is the usable fraction.
  - key: adult_band_compact_count
    default: 35
    range: [10, 80]
    unit: garments
    user_editable: true
    rationale: Lower preset for a capsule or uniform-based wardrobe.
  - key: adult_band_typical_count
    default: 65
    range: [30, 140]
    unit: garments
    user_editable: true
    rationale: Default preset. Chosen so a 3.6 m (12 ft) rod allowance falls out, which matches the capacity of one generous fitted double wardrobe.
  - key: adult_band_extensive_count
    default: 120
    range: [80, 400]
    unit: garments
    user_editable: true
    rationale: Upper preset. Never treated as excessive by the product — it is simply a larger capacity requirement.
  - key: long_hang_share
    default: 0.20
    range: [0.00, 0.60]
    unit: ratio
    user_editable: true
    rationale: Share of rod that must be full-height (dresses, coats, long robes, saris on hangers, kaftans, gowns).
  - key: short_hang_share
    default: 0.65
    range: [0.30, 1.00]
    unit: ratio
    user_editable: true
    rationale: Share of rod that can be double-hung — shirts, blouses, jackets, folded trousers.
  - key: outer_hang_share
    default: 0.15
    range: [0.00, 0.40]
    unit: ratio
    user_editable: true
    rationale: Coats and heavy outerwear. Climate-dependent; raise in cold climates, drop to near zero in tropical ones.
  - key: child_linear_width_factor
    default: 0.62
    range: [0.40, 0.90]
    unit: ratio
    user_editable: true
    rationale: A child's garment occupies roughly 60% of the rod width of an adult's equivalent.
score:
  weight: 9
  curve: linear
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: storage.closet_system.rod_double
    transform: {convert: single_hang_run, to: double_hang, gain_m: run_length, constraint: hangClearHeight >= 1.00}
    cost: low
    effort: medium
    reversible: true
    copy: Your shirts and jackets only need about a metre (40 in) of hanging height, so a second rod under the first doubles that run's capacity for the price of a rail and two brackets.
  - rank: 2
    action: add_object
    add: storage.wardrobe.fitted
    transform: {position: longest_unobstructed_wall, depth_m: 0.60}
    cost: high
    effort: high
    reversible: false
    copy: You're short of hanging space by a real amount, not a fudgeable one. A fitted run on your longest clear wall is the cheapest way to close it per metre gained.
  - rank: 3
    action: relocate_category
    target: garment.outerwear
    transform: {to_room: [entry_foyer, mudroom], free_m: outer_hang_m}
    cost: free
    effort: low
    reversible: true
    copy: Coats take up more rod per garment than anything else you own. Moving them to the entrance frees roughly a fifth of your bedroom hanging space and puts them where you put them on.
conflicts_with: []
supersedes: []
requires_rules: [RM-STO-001]
tags: [capacity, hanging, audit, formula, wardrobe]
localization_notes: Garment-width coefficients assume Western tailoring. Add regional packs: folded-and-shelved garment cultures (kimono/tatoushi, sari in shelf-folds) shift requirement from hang_m to shelf_m; heavy-outerwear climates raise outer_hang_share to 0.30.
```

#### Why — tradition
No traditional doctrine, this is a functional rule derived from garment geometry. Historically the
question did not arise: pre-industrial wardrobes were small enough to live in a chest, and the
hanging wardrobe as a dominant storage type is roughly a twentieth-century development. The
closest thing to a tradition is the trade rule of thumb used by fitted-wardrobe fitters — "a metre
of rod per twelve to fifteen mixed garments" — which this model reproduces from first principles
rather than inheriting.

#### Why — physiology / ergonomics
The coefficients are geometric, not psychological: a garment on a hanger occupies a measurable
width across the rod, and a rod loaded beyond roughly 80% of that geometric count can no longer be
browsed because there is no finger space to slide garments apart. The browsability threshold is
the ergonomically important one — an over-packed rod converts a one-motion retrieval (slide and
lift) into a two-handed extraction, which is exactly the friction that makes people stop putting
clothes away. No published dataset supports the specific 0.80 figure; it is a practitioner
consensus value and is exposed as a parameter.

#### Customer insight
We work out your hanging need from the shape of real clothes: a shirt takes about 4 cm (1.5 in) of
rail, a suit about 10 cm (4 in), a winter coat about 12 cm (5 in) — and we leave a fifth of the
rail empty so you can actually see what's there. A typical adult wardrobe comes out around 3.6 m
(12 ft) of rail. Most bedrooms provide about 2.4 m (8 ft).

#### Failure modes / when to skip
Do not apply adult coefficients to infants — a baby's clothing is overwhelmingly a drawer
requirement, not a hanging one (see RM-STO-004). Do not use the model where the user has already
measured their own rail need; a declared figure always wins. Skip the outerwear split in tropical
climate zones. For shared sibling rooms compute per child and sum, then check the result against
`ERG-CLR-*` before assuming it fits.

#### Data — hanging coefficients (engine constants, all user-editable)

```yaml
mean_linear_width_m:           # width occupied across the rod, per garment
  shirt_blouse_slim_hanger:    0.040   # 1.6 in  -> 25 per metre nominal
  shirt_blouse_std_hanger:     0.055   # 2.2 in  -> 18 per metre
  knitwear_hung:               0.065   # 2.6 in  -> 15 per metre
  trousers_over_bar:           0.045   # 1.8 in  -> 22 per metre
  dress:                       0.060   # 2.4 in  -> 16 per metre
  jacket_blazer:               0.080   # 3.1 in  -> 12 per metre
  suit_paired:                 0.100   # 3.9 in  -> 10 per metre
  coat_winter:                 0.120   # 4.7 in  ->  8 per metre
  mixed_default_adult:         0.055   # the figure used when no inventory is given
  mixed_default_child:         0.034
per_adult_default_rod_m:
  compact:    2.1    #  6 ft 11 in
  typical:    3.6    # 11 ft 10 in   <- audit default
  extensive:  6.6    # 21 ft 8 in
per_child_default_rod_m:       # by age band
  age_0_2:    0.4    # 16 in  — mostly a drawer requirement
  age_3_5:    0.7    # 28 in
  age_6_10:   1.1    # 43 in
  age_11_14:  1.8    # 71 in
  age_15_18:  2.8    # 9 ft 2 in  — teens frequently exceed adults; do not cap
```

---

### RM-STO-003 — Required folded-shelf capacity: linear metres of shelf per person

```yaml
id: RM-STO-003
title: Required folded-shelf capacity — linear metres of shelf per person
system: product.parameter
group: storage_audit
version: 1
status: active
applies_to:
  rooms: [walk_in_closet, reach_in_closet, dressing_room, linen_closet, bedroom_primary, bedroom_secondary, bedroom_child, bedroom_teen, bedroom_shared_siblings, studio_apartment, dorm_room, storage_room]
  objects: [storage.closet_system.shelf, storage.closet_system.shelf_adjustable, storage.shelving_unit.*, storage.cube_unit]
  requires_features: []
scope: whole_home
severity: medium
confidence: expert_consensus
evidence_class: ergonomic
belief_gated: false
predicate: |
  # Folded capacity is measured in linear metres of shelf at a usable depth and pitch.
  let req_m = 0
  forEach person in home.household:
    req_m = req_m + shelfAllowance(person.age_band, person.folded_band)
  assert requiredStorage(home.household, shelf_m) == req_m
  # A shelf only counts toward the requirement if its geometry is usable.
  forEach shelf in home.objects.ofType(storage.closet_system.shelf):
    assert shelf.depth_m >= p.min_folded_shelf_depth_m
    assert shelf.depth_m <= p.max_folded_shelf_depth_m
    assert shelf.clear_pitch_m >= p.min_folded_shelf_pitch_m
    assert isOneDeep(shelf) == true
  # Stack-height cap: below this the bottom item stays retrievable.
  forEach stack in shelf.contents:
    assert stack.height_m <= p.max_folded_stack_height_m
params:
  - key: min_folded_shelf_depth_m
    default: 0.350
    range: [0.250, 0.500]
    unit: m
    user_editable: true
    rationale: 350 mm (14 in) is the shallowest depth that holds a folded adult jumper without overhang.
  - key: max_folded_shelf_depth_m
    default: 0.450
    range: [0.350, 0.700]
    unit: m
    user_editable: true
    rationale: Beyond 450 mm (18 in) a shelf becomes two-deep in practice and the back row is lost. Deeper shelves must be fitted with pull-outs to count.
  - key: min_folded_shelf_pitch_m
    default: 0.300
    range: [0.220, 0.450]
    unit: m
    user_editable: true
    rationale: 300 mm (12 in) clear between shelves fits a stack of about eight folded jumpers plus the hand needed to lift them.
  - key: max_folded_stack_height_m
    default: 0.300
    range: [0.150, 0.400]
    unit: m
    user_editable: true
    rationale: Taller stacks topple and the bottom garment becomes effectively unretrievable, so the capacity is notional.
  - key: adult_folded_shelf_m
    default: 2.4
    range: [0.6, 8.0]
    unit: m
    user_editable: true
    rationale: Default per adult, roughly 60 to 85 folded items at the default pitch and depth.
score:
  weight: 6
  curve: linear
  partial_credit: true
remedies:
  - rank: 1
    action: modify_object
    target: storage.closet_system.shelf
    transform: {reduce_pitch_to_m: 0.300, add_shelves: fill_run}
    cost: low
    effort: low
    reversible: true
    copy: Your shelves are set further apart than folded clothes need. Dropping to a 30 cm (12 in) gap usually adds one or two extra shelves per run — free capacity you already own.
  - rank: 2
    action: add_object
    add: storage.closet_system.shelf_adjustable
    transform: {position: above_short_hang, depth_m: 0.400}
    cost: low
    effort: medium
    reversible: true
    copy: The dead band above a short hanging rail is the cheapest shelf space in the house.
  - rank: 3
    action: add_object
    add: storage.closet_system.drawer_bank
    transform: {convert: lowest_shelves, to: drawers}
    cost: medium
    effort: medium
    reversible: true
    copy: Below about knee height, shelves are hard to see into. Drawers there give you the same volume without the crouching.
conflicts_with: []
supersedes: []
requires_rules: [RM-STO-001, RM-STO-021]
tags: [capacity, shelf, folded, audit, formula]
localization_notes: Folded-garment cultures (much of East and South Asia, and any household that folds rather than hangs knitwear and trousers) shift 30 to 60% of the hang_m requirement into shelf_m. Offer a "we fold more than we hang" toggle that rebalances RM-STO-002 and this rule together.
```

#### Why — tradition
No traditional doctrine; functional rule. The Japanese *oshiire* — a deep, shelved, sliding-door
closet sized for folded bedding and clothing — is the clearest traditional precedent for treating
folded storage, not hanging storage, as the primary wardrobe type, and it is a useful corrective
to the Western assumption that a wardrobe means a rail.

#### Why — psychology / physiology
The binding constraint is retrieval, not volume. A folded stack is a last-in-first-out structure:
taking the third jumper from a stack of eight costs a lift, a set-down and a restack, so the
effective capacity of a tall stack is the top two or three items. Capping stack height at 300 mm
converts the stack back into something you can see the side of and pull from. This is an
ergonomic/behavioural claim with no published effect size; the mechanism is retrieval cost, not
preference.

#### Customer insight
Shelves are only as useful as your ability to see into them. We plan them at about a 30 cm (12 in)
gap and 35 to 45 cm (14 to 18 in) deep, and we keep stacks to three or four items so the jumper
you want isn't buried under the four you don't.

#### Failure modes / when to skip
Do not apply the depth cap to linen shelves (RM-STO-038 allows 450 mm for duvets) or to bulk
storage racking (RM-STO-045 allows 600 mm). Skip the pitch rule where the shelf is a display shelf
rather than a clothing shelf. In a very small closet, accept a single deep shelf over no shelf, but
flag it as a two-deep compromise rather than silently counting the full depth as capacity.

---

### RM-STO-004 — Required drawer volume per person

```yaml
id: RM-STO-004
title: Required drawer volume per person
system: product.parameter
group: storage_audit
version: 1
status: active
applies_to:
  rooms: [walk_in_closet, reach_in_closet, dressing_room, bedroom_primary, bedroom_secondary, bedroom_child, bedroom_teen, bedroom_shared_siblings, nursery, studio_apartment, dorm_room]
  objects: [storage.closet_system.drawer_bank, storage.chest_of_drawers, storage.tallboy, storage.dresser, storage.closet_island]
  requires_features: []
scope: whole_home
severity: medium
confidence: expert_consensus
evidence_class: ergonomic
belief_gated: false
predicate: |
  let req_v = 0
  forEach person in home.household:
    req_v = req_v + drawerAllowance(person.age_band)      # m3 usable
  assert requiredStorage(home.household, drawer_m3) == req_v
  # Provided volume is GROSS box volume derated.
  forEach d in home.objects.ofType(storage.*drawer*):
    let usable = d.w * d.d * min(d.clear_h, d.front_h) * p.drawer_usable_fraction
    assert d.usable_m3 == usable
    # A drawer is only usable if it opens fully into a real clearance.
    assert clearance(d, front) >= d.travel_m + p.body_depth_at_drawer_m
    assert d.travel_m >= d.d * p.min_drawer_extension_ratio
  # Deep drawers must be divided or the contents stratify and the bottom layer is lost.
  forEach d where d.clear_h > p.divider_required_above_h_m:
    assert hasDividers(d) or hasInnerTray(d)
params:
  - key: drawer_usable_fraction
    default: 0.78
    range: [0.60, 0.90]
    unit: ratio
    user_editable: true
    rationale: Runners, box sides and the rule that you must not fill above the drawer front together cost about 22% of gross box volume.
  - key: min_drawer_extension_ratio
    default: 0.90
    range: [0.60, 1.00]
    unit: ratio
    user_editable: true
    rationale: A drawer on three-quarter runners hides its back quarter permanently. Full extension is the difference between real and notional capacity.
  - key: body_depth_at_drawer_m
    default: 0.550
    range: [0.450, 0.700]
    unit: m
    user_editable: true
    rationale: Standing body depth plus a working margin, needed in front of a fully open drawer.
  - key: divider_required_above_h_m
    default: 0.200
    range: [0.120, 0.350]
    unit: m
    user_editable: true
    rationale: Above 200 mm (8 in) internal height small garments sink and the lower layer is never seen again.
  - key: adult_drawer_m3
    default: 0.300
    range: [0.080, 1.200]
    unit: m3
    user_editable: true
    rationale: Default usable drawer volume per adult, about four 900 mm (36 in) drawers at 150 to 200 mm internal height.
score:
  weight: 6
  curve: linear
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: storage.closet_system.drawer_bank
    transform: {position: under_short_hang, width_m: 0.600, drawer_count: 4}
    cost: medium
    effort: medium
    reversible: true
    copy: A 60 cm (24 in) drawer bank under a short hanging rail is the highest-value square metre in a wardrobe — it holds everything that has nowhere else to go.
  - rank: 2
    action: add_object
    add: storage.bin.lidded
    transform: {position: on_shelf, subdivide: true, note: soft_substitute_for_drawer}
    cost: low
    effort: low
    reversible: true
    copy: Boxes on a shelf do most of a drawer's job for a tenth of the price — as long as each one has a label and only one kind of thing in it.
  - rank: 3
    action: modify_object
    target: storage.chest_of_drawers
    transform: {add: internal_dividers, fit: full_extension_runners}
    cost: low
    effort: medium
    reversible: true
    copy: Dividers stop a deep drawer turning into a pit, and full-extension runners give you back the back quarter you've been ignoring.
conflicts_with: [ERG-CLR-012]
supersedes: []
requires_rules: [RM-STO-001]
tags: [capacity, drawer, audit, formula]
localization_notes: None specific; drawer geometry is culture-neutral. Note that in homes using floor-level bedding, drawer requirement rises because there is no under-bed frame volume.
```

#### Why — tradition
No traditional doctrine; functional rule. The drawer is the oldest of the three storage
primitives — the chest, then the chest of drawers — and the reason it persists is retrieval:
unlike a shelf, a drawer brings its contents out to you, and unlike a rail it stores soft small
items at density.

#### Why — psychology / physiology
Drawers win for small, soft, high-frequency items because they turn a reach-and-search into a
look-down-and-see. The divider threshold is the important ergonomic point: vertical stratification
in a deep drawer makes the lower layer invisible, and invisible storage is not storage — the same
retrieval-cost mechanism as folded stacks. No direct empirical support for the 200 mm figure; it is
the depth at which folded adult garments stop being viewable from above.

#### Customer insight
Drawers earn their cost because they bring things to you instead of making you reach in. Two
things ruin them: runners that only pull out three quarters of the way, so the back is wasted, and
drawers so deep that everything sinks. Both are fixable.

#### Failure modes / when to skip
Do not require full extension on a drawer that cannot open fully because of a door swing or a
narrow walkway — reduce the drawer depth instead and say so. In a walk-in under 2.25 m wide,
drawers opening into the walkway conflict with RM-STO-032; that rule wins. Skip the divider rule
for a drawer used for bulky single items (one duvet, one bag).

#### Data — drawer allowances (m³ usable)

```yaml
per_adult_m3:
  underwear_socks:      0.06
  sleepwear:            0.04
  tees_base_layers:     0.08
  gym_sports:           0.05
  accessories:          0.05     # belts, scarves, gloves, hats
  jewellery_watches:    0.02
  total_default:        0.30     # 10.6 cu ft
per_child_m3:
  age_0_2:  0.18   # highest drawer need of any age band: sleepsuits, vests, spares, nappies
  age_3_5:  0.20
  age_6_10: 0.20
  age_11_14:0.24
  age_15_18:0.26
reference_drawer:
  external_w_m: 0.900   # 36 in
  internal_d_m: 0.500   # 20 in
  internal_h_m: 0.200   # 8 in
  gross_m3:     0.090
  usable_m3:    0.070
```

---

### RM-STO-005 — Required shoe capacity, and where shoes actually belong

```yaml
id: RM-STO-005
title: Required shoe capacity, and where shoes actually belong
system: product.parameter
group: storage_audit
version: 1
status: active
applies_to:
  rooms: [walk_in_closet, reach_in_closet, dressing_room, mudroom, entry_foyer, hallway_corridor, bedroom_primary, bedroom_secondary, bedroom_child, bedroom_teen, storage_room, garage_parking]
  objects: [storage.closet_system.shoe_shelf, storage.closet_system.shoe_rack_tiered, storage.bench_storage, storage.bin.lidded]
  requires_features: []
scope: whole_home
severity: medium
confidence: expert_consensus
evidence_class: ergonomic
belief_gated: false
predicate: |
  let pairs = sumOf(person.shoe_pairs for person in home.household)   # declared, never inferred
  let shelf_m = (pairs * p.pair_width_m) / p.shoe_packing_factor
  assert requiredStorage(home.household, shoe_shelf_m) == shelf_m
  # Split by frequency: the daily rotation belongs at the door, the rest in the wardrobe.
  let daily = min(pairs, p.daily_rotation_pairs_per_person * countOf(person, home))
  prefer locationOf(daily) in [entry_foyer, mudroom, porch_entry]
  prefer pathLength(entryDoor, shoeStore(daily)) <= p.daily_shoe_path_m
  # Geometry per class.
  forEach shelf in shoeStores(home):
    assert shelf.depth_m >= p.shoe_shelf_depth_m
    assert shelf.clear_pitch_m >= pitchFor(shelf.shoe_class)     # see data block
    assert isOneDeep(shelf) == true
  # Boots need a tall slot, not a shelf.
  assert if countOf(shoe.boot_tall, home) > 0 then
           exists slot where slot.clear_h >= p.tall_boot_clear_h_m
params:
  - key: pair_width_m
    default: 0.280
    range: [0.200, 0.360]
    unit: m
    user_editable: true
    rationale: Width of one adult pair placed side by side on a shelf. Children's pairs about 0.200 m.
  - key: shoe_packing_factor
    default: 0.90
    range: [0.70, 1.00]
    unit: ratio
    user_editable: true
    rationale: Shoes tolerate tighter packing than garments because you lift rather than slide them out.
  - key: shoe_shelf_depth_m
    default: 0.330
    range: [0.280, 0.400]
    unit: m
    user_editable: true
    rationale: A UK 9 / US 10 shoe is about 300 mm long; 330 mm (13 in) of shelf holds it square with no toe overhang.
  - key: tall_boot_clear_h_m
    default: 0.500
    range: [0.380, 0.650]
    unit: m
    user_editable: true
    rationale: Knee boots stand at 400 to 500 mm (16 to 20 in); stored folded they crease permanently at the ankle.
  - key: daily_rotation_pairs_per_person
    default: 3
    range: [1, 8]
    unit: pairs
    user_editable: true
    rationale: The pairs actually worn in a given week, which are the pairs that should live at the door.
  - key: daily_shoe_path_m
    default: 2.0
    range: [0.5, 6.0]
    unit: m
    user_editable: true
    rationale: If the daily shoes are more than a couple of metres from the door they end up on the floor by the door anyway.
  - key: default_pairs_per_adult
    default: 12
    range: [1, 120]
    unit: pairs
    user_editable: true
    rationale: A neutral starting assumption only. Always overridden by the user's own count, and never characterised as too many.
score:
  weight: 6
  curve: linear
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: storage.bench_storage
    transform: {position: at_entry, within_m: 2.0, of: entryDoor, seat_h_m: 0.450, shoe_bays: 6}
    cost: low
    effort: low
    reversible: true
    copy: A bench with shoe bays under it at the door does three jobs: somewhere to sit to put shoes on, somewhere to put them, and an end to the pile in the hall.
  - rank: 2
    action: add_object
    add: storage.closet_system.shoe_shelf
    transform: {position: below_short_hang, tilt_deg: 15, pitch_m: 0.190}
    cost: low
    effort: medium
    reversible: true
    copy: Tilting shoe shelves by about 15 degrees lets you see the whole shoe instead of just the toes, and fits more pairs per shelf.
  - rank: 3
    action: relocate_category
    target: shoe.occasion
    transform: {to: bulk_store, container: storage.bin.lidded, label: photo_of_contents}
    cost: free
    effort: low
    reversible: true
    copy: Shoes you wear a few times a year can go in labelled boxes higher up or further away — with a photo on the end so you never have to open two to find one.
conflicts_with: []
supersedes: []
requires_rules: [RM-STO-001, RM-STO-011]
tags: [capacity, shoes, entry, audit, formula]
localization_notes: In shoes-off households (much of East Asia, Scandinavia, many Muslim and South Asian homes) the entry shoe requirement rises sharply and must include guest capacity — add 4 to 8 guest pairs and a genkan-style level change or mat zone. Cross-ref the entry-room file.
```

#### Why — tradition
No traditional doctrine on capacity, but a strong traditional precedent on location: the Japanese
*genkan* and its *getabako* shoe cupboard formalise the rule that shoes are stored at the
threshold, not in the bedroom, and Scandinavian and many South Asian and Middle Eastern homes do
the same by custom. That tradition and the functional analysis agree, which is worth saying.

#### Why — psychology / physiology
Shoe storage fails on desire lines, not on volume. Shoes are removed within a metre or two of the
entry door, so any store further away loses to the floor — the standard desire-line argument from
space syntax and circulation analysis. The tilted shelf is a visual-search point: a shoe seen in
profile is identifiable at a glance, a shoe seen toe-on is not. No published effect sizes; the
mechanisms are desire lines and visual search.

#### Customer insight
Shoes go where you take them off, which is by the door — not in the bedroom, however tidy that
sounds. Keep the three or four pairs you're actually wearing at the entrance, and give the rest a
shelf you can see along. We'll never tell you that you own too many.

#### Failure modes / when to skip
Skip the entry-location preference where the entry is a shared apartment lobby, where a fire route
cannot be obstructed (`SAFE-EGR-*` wins outright), or where the user has a specific reason to keep
shoes out of the entry (allergies, pets, a very small hall). In damp climates do not store leather
shoes in an unventilated closed entry cupboard — see RM-STO-040.

#### Data — shoe shelf pitches

```yaml
clear_pitch_m_by_class:
  flat_sneaker:      0.170   #  6.7 in
  dress_shoe:        0.170
  heel:              0.190   #  7.5 in  (0.150 on a 15 deg tilted shelf)
  ankle_boot:        0.250   # 10 in
  tall_boot_upright: 0.500   # 20 in
  boot_ski_walking:  0.300   # 12 in, plus 0.400 m depth
pairs_per_linear_metre:
  adult_single_row:  3.5
  child_single_row:  5.0
```

---

### RM-STO-006 — Required bulk volume by category

```yaml
id: RM-STO-006
title: Required bulk volume by category
system: product.parameter
group: storage_audit
version: 1
status: active
applies_to:
  rooms: [storage_room, attic_storage, basement_unfinished, basement_finished, garage_parking, loft, utility_mechanical, walk_in_closet, linen_closet, hallway_corridor, stair_core, balcony, patio_deck]
  objects: [storage.box.archive, storage.bin.lidded, storage.shelving_unit.*, storage.racking.utility, storage.understair_unit, storage.loft_boarding]
  requires_features: []
scope: whole_home
severity: high
confidence: expert_consensus
evidence_class: mixed
belief_gated: false
predicate: |
  let req_v = 0
  forEach cat in p.bulk_categories:
    req_v = req_v + bulkAllowance(cat, home.household, home.site.climate_zone, home.tenure)
  assert requiredStorage(home, bulk_m3) == req_v
  # Bulk items that are not volumes but envelopes get a floor-area requirement instead.
  forEach cat in [bike, pushchair, wheelchair, ladder, surfboard, kayak, artificial_tree]:
    assert requiredStorage(home, bulk_floor_m2) includes envelopeOf(cat)
  # Two categories are never auto-reduced by the engine.
  forbid engine.reduce(cat) for cat in [sentimental, documents_archive]
  # Some categories demand a TALL void, not shelf volume; shelf volume does not substitute.
  forEach cat in [vacuum, ironing_board, broom_mop, folding_chair, gift_wrap_rolls, ladder]:
    assert exists void where void.clear_h >= tallVoidHeight(cat) and void.floor_area_m2 >= tallVoidFootprint(cat)
params:
  - key: bulk_categories
    default: [luggage, seasonal_decoration, spare_bedding, off_season_clothing, fans_heaters, tools_diy, paint_chemicals, cleaning_kit, vacuum, ironing_board, sports_camping, bikes, documents_archive, sentimental, children_outgrown, gift_wrap, medicines, batteries_bulbs, cables_tech, hobby_supplies, pet_supplies, emergency_supplies]
    range: [list]
    unit: enum_list
    user_editable: true
    rationale: The categories that are most often homeless in a real home. Users may add their own.
  - key: sentimental_m3_per_person
    default: 0.15
    range: [0.00, 2.00]
    unit: m3
    user_editable: true
    rationale: Explicit, generous and never reduced by the engine. See RM-STO-055.
  - key: luggage_m3_per_adult
    default: 0.25
    range: [0.00, 1.50]
    unit: m3
    user_editable: true
    rationale: A 75 L checked case is about 0.11 m3; two cases plus a cabin bag per adult, partly nested.
  - key: tools_m3_by_tenure
    default: {renter: 0.25, owner: 0.60, active_diy: 1.20}
    range: [map]
    unit: m3
    user_editable: true
    rationale: Tool holdings scale with responsibility for the building, not with interest in tools.
  - key: bulk_reserve_ratio
    default: 1.15
    range: [1.00, 1.50]
    unit: ratio
    user_editable: true
    rationale: A bulk store planned to exactly its contents cannot absorb the next thing that arrives, so it silts up at the door instead.
score:
  weight: 8
  curve: linear
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: storage.shelving_unit.open
    transform: {room: [garage_parking, basement_unfinished, storage_room], depth_m: 0.450, bay_w_m: 0.900, tiers: 5, anchor: wall}
    cost: low
    effort: medium
    reversible: true
    copy: Bulk storage is cheap if you go upward. Five tiers of 45 cm (18 in) shelving along one garage wall is roughly two and a half cubic metres — about half a typical household's bulk need.
  - rank: 2
    action: add_object
    add: storage.loft_boarding
    transform: {area_m2: 8.0, use: loft_legs_over_insulation, plus: storage.loft_ladder}
    cost: medium
    effort: high
    reversible: true
    copy: A boarded loft is usually the single biggest storage win available — but board it on raised legs so you don't squash the insulation and create a damp problem.
  - rank: 3
    action: add_object
    add: storage.understair_unit
    transform: {room: stair_core, use: tall_void_categories}
    cost: medium
    effort: high
    reversible: false
    copy: The space under the stairs is the natural home for the vacuum, the ironing board and the mop — the awkward tall things that have nowhere else to stand.
conflicts_with: [SAFE-FIR-*]
supersedes: []
requires_rules: [RM-STO-001, RM-STO-012]
tags: [capacity, bulk, audit, formula, homeless_categories]
localization_notes: Climate drives several categories hard — fans and portable air conditioners in hot zones, snow gear, sleds and studded tyres in cold ones, hurricane and earthquake emergency supplies where relevant. Ship climate-zone coefficient packs keyed to site.climate_zone.
```

#### Why — tradition
No traditional doctrine. Vernacular building traditions did size bulk storage deliberately —
the loft, the cellar, the outhouse, the *hörðr* and the *kura* were planned volumes, not
leftovers — and the modern apartment's near-total absence of bulk storage is a historical anomaly
rather than a norm. That observation is worth giving users, because it reframes their situation as
a building failure rather than a personal one.

#### Why — psychology / physiology
No direct empirical support for the coefficients. The mechanism is that bulk categories are
low-frequency and high-volume, so they compete for the same square metres as daily storage and
always lose the argument in the moment — which is how suitcases end up on wardrobe floors
occupying prime hanging space. Giving each category a named home converts an open-ended decision
into a lookup, which is the general cognitive-load argument for assignment tables.

#### Customer insight
Suitcases, Christmas decorations, spare duvets, the vacuum, the paint tins, the tent — none of
them have a natural home, so they colonise the best storage you've got. We size them all up front:
a typical family of four needs about four to five cubic metres (140 to 175 cu ft) of bulk storage.
Most flats provide almost none, and that isn't your fault.

#### Failure modes / when to skip
Never present the bulk requirement as a reason the user owns too much. Do not include categories
the user does not own — ask, don't assume (a household with no car needs no car kit; a household
that doesn't celebrate a decorating holiday needs no decoration volume). Where a flat has no loft,
garage, basement or outdoor store, say plainly that the dwelling cannot hold a normal household's
bulk and move to the found-volume rules (RM-STO-046 to RM-STO-048) and off-site options rather
than to reduction advice.

#### Data — bulk volume allowances

```yaml
volume_m3:
  luggage:                 0.25 per_adult   # min 0.50 per household
  seasonal_decoration:     0.30 baseline    # 0.60 if a decorating-heavy holiday; +0.20 artificial tree
  spare_bedding:           0.12 per_bed     # duvet 0.15 loose / 0.06 vacuum-compressed
  off_season_clothing:     0.20 per_adult   # only in 4-season climates
  fans_heaters:            0.15 per_household
  tools_diy:               see tools_m3_by_tenure
  paint_chemicals:         0.10 per_household
  cleaning_kit:            0.10 per_household
  vacuum:                  TALL VOID 0.40 x 0.45 m footprint x 1.30 m clear
  ironing_board:           TALL VOID 0.20 x 0.45 m footprint x 1.50 m clear
  sports_camping:          0.20 per_active_participant
  bikes:                   FLOOR 0.60 m2 each, or wall/ceiling hook 1.80 x 0.50 m wall zone
  documents_archive:       0.06 per_adult   # one archive box = 0.040 m3
  sentimental:             0.15 per_person   # NEVER auto-reduced
  children_outgrown:       0.10 per_child_per_kept_decision
  gift_wrap:               0.05, but needs a 1.00 m tall slot for rolls
  medicines:               0.02, lockable, conditioned
  batteries_bulbs:         0.03
  cables_tech:             0.06
  hobby_supplies:          0.20 per_declared_hobby
  pet_supplies:            0.15 per_pet
  emergency_supplies:      0.20 per_household  # climate/region dependent
worked_example_2_adults_2_children_aged_7_and_13:
  hang_m:        10.1     # 33 ft
  shelf_m:       10.0     # 33 ft
  shoe_shelf_m:  10.9     # 36 ft, or 2.7 m of 4-tier rack
  drawer_m3:      1.06    # 37 cu ft
  bulk_m3:        4.85    # 171 cu ft, plus 1.2 m2 of bike floor
  typical_3_bed_provision_hang_m: 7.8   # two 1.5 m reach-ins plus one 2.4 m double-hung primary
  typical_deficit_hang: -2.3 m (-23%)
```

---

### RM-STO-007 — Provision accounting: convert the existing home into audit units

```yaml
id: RM-STO-007
title: Provision accounting — convert the existing home into audit units
system: product.parameter
group: storage_audit
version: 1
status: active
applies_to:
  rooms: [walk_in_closet, reach_in_closet, dressing_room, linen_closet, storage_room, attic_storage, basement_unfinished, basement_finished, garage_parking, loft, utility_mechanical, bedroom_primary, bedroom_secondary, bedroom_child, bedroom_teen, bedroom_guest, hallway_corridor, stair_core, mudroom, entry_foyer, studio_apartment, open_plan_combined]
  objects: [storage.*]
  requires_features: []
scope: whole_home
severity: medium
confidence: expert_consensus
evidence_class: ergonomic
belief_gated: false
predicate: |
  # Every storage object contributes to provision ONLY through its usable geometry.
  let hang = 0; let shelf = 0; let drawer = 0; let bulk = 0
  forEach o in home.objects.ofType(storage.*):
    forEach rod in o.rods:
      # A rod counts only if it has the clear height its garment class needs and real depth.
      assert rod.clear_h >= minClearHeight(rod.hang_class)
      assert o.internal_depth_m >= p.min_hang_depth_m
      hang = hang + rod.length_m * accessFraction(o.opening, rod)
    forEach s in o.shelves:
      if usableAsFolded(s) then shelf = shelf + s.length_m * accessFraction(o.opening, s)
      else bulk = bulk + s.length_m * s.depth_m * s.clear_pitch_m * accessFraction(o.opening, s)
    forEach d in o.drawers:
      drawer = drawer + d.usable_m3
  # Derate anything in a band the household cannot reach without a step.
  forEach element where element.z > p.step_access_z_m:
    element.contribution = element.contribution * p.step_access_derate
  # Derate anything behind a fixed panel (sliding doors) or a half-swing.
  # accessFraction does this; see RM-STO-031.
  assert providedStorage(home, hang_m) == hang
  assert providedStorage(home, shelf_m) == shelf
  assert providedStorage(home, drawer_m3) == drawer
  assert providedStorage(home, bulk_m3) == bulk
params:
  - key: min_hang_depth_m
    default: 0.560
    range: [0.500, 0.700]
    unit: m
    user_editable: false
    rationale: Below 560 mm (22 in) internal depth a garment on a standard hanger touches the door or the back and the rod does not count as hanging capacity. See RM-STO-030.
  - key: step_access_z_m
    default: 2.050
    range: [1.800, 2.400]
    unit: m
    user_editable: true
    rationale: Above roughly 2.05 m (81 in) a median adult needs a step, so the capacity is real but only for annual-frequency items.
  - key: step_access_derate
    default: 0.60
    range: [0.20, 1.00]
    unit: ratio
    user_editable: true
    rationale: Step-access capacity is genuine but cannot absorb daily or weekly items, so it is worth less than prime-band capacity in the audit.
  - key: count_remote_stores
    default: true
    range: [true, false]
    unit: bool
    user_editable: true
    rationale: Loft, garage, basement and outbuilding volume is real capacity but only for climate-appropriate, low-frequency items. Report it as a separate line, never merged into wardrobe provision.
score:
  weight: 5
  curve: linear
  partial_credit: true
remedies:
  - rank: 1
    action: run_analysis
    target: home
    transform: {measure: all_storage_objects, emit: provision_by_unit_by_room}
    cost: free
    effort: low
    reversible: true
    copy: We'll total up what you've actually got — rail by rail, shelf by shelf — so the comparison is real rather than a feeling.
  - rank: 2
    action: flag
    target: storage.*
    transform: {flag: notional_capacity, reason: [too_shallow, behind_fixed_panel, above_step_band, no_clear_height]}
    cost: free
    effort: low
    reversible: true
    copy: Some of your storage looks like capacity but isn't — a rail in a cupboard too shallow for a hanger, or a shelf permanently behind a sliding door. We'll show you which.
conflicts_with: []
supersedes: []
requires_rules: [RM-STO-001]
tags: [audit, provision, measurement, notional_capacity]
localization_notes: None.
```

#### Why — tradition
No traditional doctrine, this is a functional rule. It exists because the alternative — asking the
user how much storage they have — reliably over-counts, since people count wardrobe frontage
rather than usable rail.

#### Why — psychology / physiology
No direct empirical support; the mechanism is measurement bias. People estimate storage by visible
frontage, which ignores depth, access fraction and reach band — the three things that determine
whether the volume is usable. Sliding-door wardrobes are the clearest case: half the interior is
permanently behind a panel, yet the frontage reads as full capacity.

#### Customer insight
We measure what you can actually use, not what's technically there. A rail in a cupboard too
shallow for a coat hanger, a shelf you can only reach with a chair, or the half of a sliding
wardrobe that's always behind a door — these look like storage and don't behave like it.

#### Failure modes / when to skip
Where the user cannot or will not measure, fall back to typology defaults (a "standard double
wardrobe" = 1.0 m rail + 1.0 m top shelf) and label the audit as estimated. Do not derate for
step access in a household whose members are all comfortable using a step and who have said so.

---

### RM-STO-008 — The deficit report and its honest headline

```yaml
id: RM-STO-008
title: The deficit report and its honest headline
system: product.ux
group: storage_audit
version: 1
status: active
applies_to:
  rooms: [walk_in_closet, reach_in_closet, dressing_room, linen_closet, storage_room, bedroom_primary, bedroom_secondary, bedroom_child, bedroom_teen, studio_apartment, open_plan_combined, attic_storage, garage_parking, basement_unfinished, loft]
  objects: [storage.*]
  requires_features: []
scope: whole_home
severity: high
confidence: expert_consensus
evidence_class: mixed
belief_gated: false
predicate: |
  forEach unit in [hang_m, shelf_m, shoe_shelf_m, drawer_m3, bulk_m3, bulk_floor_m2]:
    let req = requiredStorage(home.household, unit)
    let prov = providedStorage(home, unit)
    let deficit_pct = (req - prov) / req * 100
    emit report.line(unit, req, prov, deficit_pct)
  # Headline selection is deterministic.
  let worst = argmax(deficit_pct over units)
  assert report.headline.subject == worst
  assert if max(deficit_pct) >= p.structural_deficit_pct then
           report.headline.frame == "capacity_shortfall"
         else if max(deficit_pct) >= p.marginal_deficit_pct then
           report.headline.frame == "tight_but_workable"
         else
           report.headline.frame == "capacity_adequate_check_placement"
  # Also report the misplacement share, because it is usually large and free to fix.
  let misplaced = share of stored items whose room != assignedRoom(category)   # RM-STO-011
  emit report.line(misplacement_pct, misplaced)
  # Honesty constraints on the report itself.
  forbid report.contains(item_count_as_negative)
  forbid report.attributes(deficit, to: user_behaviour) when max(deficit_pct) >= p.marginal_deficit_pct
  assert report.states_units_in(metric) and report.states_units_in(imperial)
params:
  - key: structural_deficit_pct
    default: 20.0
    range: [5.0, 60.0]
    unit: pct
    user_editable: false
    rationale: At a fifth short, no reasonable behaviour change closes the gap — the honest headline is that the home is too small for the household's storage, in that unit.
  - key: marginal_deficit_pct
    default: 5.0
    range: [0.0, 25.0]
    unit: pct
    user_editable: false
    rationale: Below 5% the system is workable and the likely problem is placement, not capacity.
  - key: report_shows_worked_arithmetic
    default: true
    range: [true, false]
    unit: bool
    user_editable: true
    rationale: Showing the sum makes the finding arguable, which is what a trustworthy estimate should be.
  - key: report_includes_no_deficit_praise
    default: false
    range: [true, false]
    unit: bool
    user_editable: false
    rationale: Do not congratulate or scold. State the number.
score:
  weight: 8
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: emit_report
    target: user
    transform: {frame: capacity_first, order: [add_capacity, relocate_category, consolidate, optional_reduce], show_arithmetic: true}
    cost: free
    effort: low
    reversible: true
    copy: Here's the honest picture. You need about 10 m (33 ft) of hanging rail and you have 7.8 m (26 ft) — you're roughly a quarter short. That's a storage problem, not a tidiness problem, and it has physical fixes.
  - rank: 2
    action: emit_report
    target: user
    transform: {frame: misplacement, show: category_to_room_mismatch}
    cost: free
    effort: low
    reversible: true
    copy: A surprising share of what looks like overflow is simply stored in the wrong room. We found some of yours — moving it costs nothing.
conflicts_with: []
supersedes: []
requires_rules: [RM-STO-001, RM-STO-002, RM-STO-003, RM-STO-004, RM-STO-005, RM-STO-006, RM-STO-007]
tags: [audit, report, honesty, dignity, signature_rule]
localization_notes: Always show both metric and imperial. Regional expectations of normal storage differ enormously; do not benchmark the user against a national average without saying which one.
```

#### Why — tradition
No traditional doctrine; this is a product-honesty rule. It is the point where this library's
functional layer explicitly refuses the conventional decluttering-industry framing, in which every
storage problem is a character problem.

#### Why — psychology / physiology
No direct empirical support for the thresholds. The mechanism is attributional: people default to
dispositional explanations for their own repeated failures, and a numeric structural explanation
displaces that. There is also a straightforward information argument — a user who knows they are
2.3 m of rail short can buy 2.3 m of rail, whereas a user who believes they are disorganised
cannot buy anything that helps.

#### Customer insight
We'll give you a number, not a verdict. If your home is short of hanging space by a quarter, we'll
say so — and we'll show the sum so you can argue with it. If your capacity is actually fine and
things are just in the wrong rooms, we'll say that instead, because it's a much easier fix.

#### Failure modes / when to skip
Never show the report as a score out of ten against other households. If the user has flagged
sensitivity around possessions (see RM-STO-055), show the capacity lines and suppress every
reduction pathway unless asked. Where provision is estimated rather than measured, label the
deficit as approximate and give a range, not a point value.

---

### RM-STO-009 — Fill to 85 to 90 per cent: the headroom reserve that keeps a system working

```yaml
id: RM-STO-009
title: Fill to 85 to 90 per cent — the headroom reserve that keeps a system working
system: behavior.habit_design
group: storage_audit
version: 1
status: active
applies_to:
  rooms: [walk_in_closet, reach_in_closet, dressing_room, linen_closet, storage_room, pantry_walk_in, bedroom_primary, bedroom_secondary, bedroom_child, bedroom_teen, attic_storage, garage_parking, basement_unfinished, loft, utility_mechanical]
  objects: [storage.*]
  requires_features: []
scope: room_composition
severity: medium
confidence: expert_consensus
evidence_class: mixed
belief_gated: false
predicate: |
  forEach container in home.storageContainers:
    let f = fillRatio(container)
    prefer f <= p.target_fill_ratio
    penalize(f > p.motion_tax_fill_ratio, weight: 4)
    # Report under-use too — it is reclaimable capacity, not a virtue.
    flag(f < p.underused_fill_ratio, as: reclaimable_capacity)
  # At the level of a whole unit family, the same reserve applies.
  forEach unit in [hang_m, shelf_m, drawer_m3, bulk_m3]:
    let system_fill = usedStorage(home, unit) / providedStorage(home, unit)
    prefer system_fill <= p.target_fill_ratio
    assert if system_fill > p.motion_tax_fill_ratio then
             report.explains("one-motion put-away is no longer possible in this unit")
params:
  - key: target_fill_ratio
    default: 0.85
    range: [0.60, 0.95]
    unit: ratio
    user_editable: true
    rationale: At 85% full, putting an item away is one motion — open, place, close. That is the threshold at which the system maintains itself.
  - key: motion_tax_fill_ratio
    default: 0.95
    range: [0.80, 1.00]
    unit: ratio
    user_editable: true
    rationale: Above 95% almost every put-away requires first moving something else, which is the point at which people stop.
  - key: underused_fill_ratio
    default: 0.50
    range: [0.20, 0.80]
    unit: ratio
    user_editable: true
    rationale: A container under half full in a home with a deficit elsewhere is capacity in the wrong place.
score:
  weight: 5
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: relocate_category
    target: lowest_frequency_category_in(container)
    transform: {to: bulk_store, restore_fill_to: 0.85}
    cost: free
    effort: low
    reversible: true
    copy: This cupboard is jammed to the point where you have to unpack it to use it. Move the least-used things out to the bulk store and you get a cupboard that works again.
  - rank: 2
    action: add_object
    add: storage.closet_system.shelf_adjustable
    transform: {add_capacity_pct: 20}
    cost: low
    effort: low
    reversible: true
    copy: Adding about a fifth more shelf here would take the pressure off everything else in the room.
  - rank: 3
    action: flag
    target: container
    transform: {flag: reclaimable, suggest: reassign_to_deficit_unit}
    cost: free
    effort: low
    reversible: true
    copy: This one's half empty while something else is bursting. Worth swapping what lives where.
conflicts_with: []
supersedes: []
requires_rules: [RM-STO-001]
tags: [fill_ratio, behaviour, friction, maintenance]
localization_notes: None.
```

#### Why — tradition
No traditional doctrine; functional rule. The nearest relative is the industrial-engineering habit
of designing buffers with slack, and the Japanese aesthetic preference for visible empty space in
storage (*ma*) — which arrives at a similar operating point from an entirely different direction,
and is worth mentioning to users who find the arithmetic unpersuasive.

#### Why — psychology / physiology
No direct empirical support for the specific ratios. The mechanism is behaviour cost: a put-away
that requires first relocating another item is a two-step chain with an unbounded second step, and
chains like that are abandoned. Over-filling also destroys visual search — items at 95% density
cannot be scanned, only excavated. Both mechanisms are well described in applied behaviour and
human-factors work; the numbers here are practitioner values, not measured thresholds.

#### Customer insight
A cupboard that's completely full stops being a cupboard — every time you use it you have to
unpack it first, and after a while you stop bothering. Aim for about 85 per cent full and leave
yourself a bit of air. It isn't waste; it's what makes the system keep working.

#### Failure modes / when to skip
Do not apply to a deliberate long-term archive box, a vacuum-compressed bedding bag, or a
sealed seasonal container — these are meant to be full. Do not use the fill rule as a back-door
route to reduction advice when the audit shows a genuine deficit: in that case the honest remedy
is capacity, and this rule simply explains why the current system feels so hard.
