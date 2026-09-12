# Feng Shui — Form School (Xing Shi / Luan Tou), Landform and the Exterior Site Layer

<!-- library-file: v1 | system(s): feng_shui.form_school, feng_shui.yin_yang, product.parameter | rule-id-prefixes: FS-FORM, FS-SITE, FS-SHA | author-agent: fengshui-form-school-01 -->

## Scope

This file covers **Form School** feng shui — in Chinese either *Luan Tou Pai* (巒頭派, "mountain-top
school") or *Xing Shi Pai* (形勢派, "form and configuration school") — together with the whole
exterior/site layer that Form School reasons about, and the interior analogues that let the same
doctrine be applied to a single room or an apartment.

Covered here:

- The **Four Celestial Animals** armchair model (black tortoise / *xuan wu* behind, red phoenix /
  *zhu que* open in front, green dragon / *qing long* left, white tiger / *bai hu* right), evaluated
  both for a real lot and as a room-scale analogue.
- The **bright hall** (*ming tang*, 明堂) before the entry; mountain support versus an exposed back.
- **Water**: placement, visibility, embracing versus reverse-bow form, and direction of flow.
- **Site slope**, relative height versus neighbours, ground level at the entry.
- **Roads**: T-junctions and road-rush (*lu chong*), reverse bow (*fan gong sha*), scissors forks,
  cul-de-sacs and dead ends, driveway and approach-path shape, gates.
- **Sha qi** (煞氣) / "poison arrows" / "secret arrows": sharp corners of neighbouring buildings,
  heaven-cutting gaps (*tian zhan sha*), poles and masts and tree trunks before the door, blank walls,
  external staircases, facing doors across a narrow street, overhanging external structures, and a
  general window-view audit.
- **Neighbourhood land use**: cemeteries and crematoria, hospitals, temples, police and fire stations,
  refuse areas, fuel stations, transmission towers and pylons, flyovers, major roads.
- The **lonely-yang** (*gu yang*) isolated or over-topping dwelling.
- **Lot shape**: triangular, knife/cleaver-shaped, missing corners, taper direction, and remedies.
- **Facing versus sitting** determination, the common errors that wreck it, the apartment effective
  facing problem, and the **compass data-quality** rules (magnetic declination and smartphone
  magnetometer error) that fire on the *input* and warn the user before any directional rule runs.
- **Balcony and roof-terrace** rules, treated as the modern apartment's bright hall.

### Conventions this file establishes (read before implementing any rule here)

1. **Classical Form School is qualitative.** The classics — the *Zangshu* / *Zangjing* (葬書, Book of
   Burial, traditionally attributed to Guo Pu, 276–324, the first text to use the term *feng shui*),
   and the Tang-dynasty landform tradition associated with Yang Yunsong (834–900) in mountainous
   Jiangxi — describe *configurations*, not measurements. They say the dragon should "embrace" and the
   bright hall should be "open and level"; they do not give metres. **Every numeric threshold in this
   file is an app operationalization, not doctrine.** That is why almost every threshold is exposed as
   a tunable param with a wide range, and why `confidence` is `tradition` unless an independent
   evidence base exists.

2. **Flank perspective.** `left` and `right` (dragon and tiger) are taken from the perspective of an
   observer standing at the building's facing side **looking out** — the observer's left hand is the
   dragon flank. This is the dominant convention in classical practice, but it is not universal, so it
   is exposed as the param `flank_perspective` (`looking_out` | `looking_in`), default `looking_out`.
   The engine must derive `surroundings[].relation` from `site.facing_bearing_deg` using this param and
   must never accept a hand-entered `relation` that contradicts the bearings.

3. **Animal frame.** In Form School the four animals are **positional relative to the site's facing**,
   not absolutely North/South/East/West. The familiar tortoise=North / phoenix=South / dragon=East /
   tiger=West mapping comes from the ideal south-facing orientation of classical Chinese siting; it is
   a special case, not the general rule. Param `animal_frame` (`relative_to_facing` |
   `absolute_compass`), default `relative_to_facing`. Compass-school directional rules live in the
   compass files, not here.

4. **Hemisphere.** Per SPEC-CONTRACT §1, `site.hemisphere` affects sun/daylight rules only. No rule in
   this file mirrors its geometry for the southern hemisphere. Some Western practitioners do mirror;
   classical practitioners do not. See `OPEN_QUESTIONS`.

5. **Bearing frame.** A *luopan* is a magnetic compass, so classical readings are **magnetic**
   bearings. The engine must therefore carry an explicit bearing frame on every stored bearing and must
   never silently mix a magnetic phone reading with a true-north bearing scaled off a satellite map.
   FS-SITE-001 and FS-SITE-002 enforce this and are the gate for every directional rule in the library.

6. **Surroundings model.** Site-scope rules read `site.surroundings[]`. The contract's `type` enum is
   too narrow for this layer; a proposed enum extension is declared at the bottom of this file under
   `NEW_PREDICATES`. No new top-level scene-graph type is introduced.

7. **Severity ceiling.** Nothing in this file is `blocking`. Per SPEC-CONTRACT §8 only `safety.*`,
   `accessibility.ada` and ergonomics hard-minimums may block. Where a Form School rule points at a
   real hazard (steep slope, landslide, traffic pollution, fuel storage), this file raises the finding
   and **cross-references** the safety file that owns the blocking rule.

## Rule count: 60

## Rules

### FS-FORM-001 — Four Celestial Animals: composite armchair configuration

```yaml
id: FS-FORM-001
title: Four Celestial Animals composite armchair configuration
system: feng_shui.form_school
group: four_animals
version: 1
status: active
applies_to:
  rooms: []                      # site-scope: not room-gated
  objects: []
  requires_features: []
scope: site
severity: high
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let f = site.facing_bearing_deg
  require bearingProvenance(site) != unknown          # FS-SITE-001 gate
  let back  = supportMass(relation="back",  arc_deg=p.rear_arc_deg)
  let left  = supportMass(relation="left",  arc_deg=p.flank_arc_deg)
  let right = supportMass(relation="right", arc_deg=p.flank_arc_deg)
  let front = openSkyArc(relation="front", arc_deg=p.front_arc_deg)
  let s_back  = clamp(back.subtended_deg  / p.rear_target_subtended_deg,  0, 1)
  let s_left  = clamp(left.subtended_deg  / p.flank_target_subtended_deg, 0, 1)
  let s_right = clamp(right.subtended_deg / p.flank_target_subtended_deg, 0, 1)
  let s_front = clamp(front / p.front_target_open_deg, 0, 1)
  let armchair = p.w_back*s_back + p.w_left*s_left + p.w_right*s_right + p.w_front*s_front
  prefer armchair >= p.min_armchair_score
  penalize (s_back < p.rear_min_score), weight=4
  penalize (s_front < p.front_min_score), weight=3
params:
  - key: rear_arc_deg
    default: 120
    range: [60, 180]
    unit: deg
    user_editable: false
    rationale: Angular window behind the sitting side inside which mass counts as tortoise support.
  - key: flank_arc_deg
    default: 90
    range: [45, 150]
    unit: deg
    user_editable: false
    rationale: Angular window to each side inside which mass counts as a dragon or tiger flank.
  - key: front_arc_deg
    default: 120
    range: [60, 180]
    unit: deg
    user_editable: false
    rationale: Angular window ahead of facing that must stay open for the phoenix.
  - key: rear_target_subtended_deg
    default: 12
    range: [3, 45]
    unit: deg
    user_editable: true
    rationale: Vertical angle the rear mass should subtend from the entry to read as real support. App operationalization of a qualitative classic.
  - key: flank_target_subtended_deg
    default: 8
    range: [2, 30]
    unit: deg
    user_editable: true
    rationale: Vertical angle a flank should subtend to read as an armrest.
  - key: front_target_open_deg
    default: 90
    range: [30, 180]
    unit: deg
    user_editable: true
    rationale: Horizontal sweep of open sky ahead that scores a full phoenix.
  - key: w_back
    default: 0.40
    range: [0.1, 0.7]
    unit: ratio
    user_editable: true
    rationale: Classical practice weights the tortoise most heavily; adjustable for designers who weight the bright hall first.
  - key: w_front
    default: 0.30
    range: [0.1, 0.7]
    unit: ratio
    user_editable: true
    rationale: Weight of the bright hall in the composite.
  - key: w_left
    default: 0.15
    range: [0.0, 0.4]
    unit: ratio
    user_editable: true
    rationale: Weight of the dragon flank.
  - key: w_right
    default: 0.15
    range: [0.0, 0.4]
    unit: ratio
    user_editable: true
    rationale: Weight of the tiger flank.
  - key: min_armchair_score
    default: 0.60
    range: [0.2, 0.95]
    unit: ratio
    user_editable: true
    rationale: Pass mark for the composite. Raise for strict classical assessment, lower for dense urban sites where no lot would ever pass.
  - key: rear_min_score
    default: 0.35
    range: [0.0, 0.9]
    unit: ratio
    user_editable: true
    rationale: Floor below which the back counts as exposed regardless of the composite.
  - key: front_min_score
    default: 0.35
    range: [0.0, 0.9]
    unit: ratio
    user_editable: true
    rationale: Floor below which the bright hall counts as closed regardless of the composite.
  - key: flank_perspective
    default: looking_out
    range: [looking_out, looking_in]
    unit: enum
    user_editable: true
    rationale: Whether dragon/tiger are assigned from an observer looking out of the building (dominant convention) or looking at it.
  - key: animal_frame
    default: relative_to_facing
    range: [relative_to_facing, absolute_compass]
    unit: enum
    user_editable: true
    rationale: Form School reads the animals relative to facing; the N/S/E/W mapping is a special case of an ideal south-facing site.
score:
  weight: 10
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: annotate_site
    target: site
    transform: {emit: armchair_diagram, highlight: weakest_flank}
    cost: free
    effort: none
    reversible: true
    copy: Here is your home read as an armchair — what sits behind you, what opens in front, and what holds each side. The weakest side is highlighted first.
  - rank: 2
    action: add_object
    add: plants.hedge.evergreen_row
    transform: {position: along_boundary(relation=weakest_flank), min_height_m: 1.8}
    cost: medium
    effort: medium
    reversible: true
    copy: Plant a dense evergreen hedge along the weak side to give that flank some body.
  - rank: 3
    action: add_object
    add: outdoor.fence.solid_panel
    transform: {position: along_boundary(relation="back"), min_height_m: 1.8}
    cost: medium
    effort: medium
    reversible: true
    copy: A solid fence or wall along the back boundary is the cheapest way to manufacture a back to the chair.
conflicts_with: []
supersedes: []
requires_rules: [FS-SITE-001]
tags: [site, four_animals, armchair, signature_rule, composite]
localization_notes: Geometry is relative to facing and is never mirrored by hemisphere. Absolute-compass mode exists for practitioners who insist on the N/S/E/W animal mapping.
```

#### Why — tradition

Form School reads a site as a seat. The classical image is the *taishi yi* (太師椅), the high-backed
official's armchair: a solid back (black tortoise, *xuan wu*), two lower embracing arms (green dragon
on the left, white tiger on the right), and an open, level, bright forecourt in front (red phoenix,
*zhu que*). The *Zangshu* grounds this in the behaviour of qi — qi rides the wind and scatters, and is
held when it meets water — so the ideal site is one that is sheltered from wind at the back and sides
while still collecting qi in front. Both the classical Jiangxi landform lineage and modern
Black-Hat/BTB practice use this armchair image; they differ mainly in whether the animals are keyed to
the compass or to the building's own facing, and this file defaults to facing.

#### Why — psychology / physiology

The armchair is a close match to Jay Appleton's prospect–refuge theory (*The Experience of Landscape*,
1975): humans reliably prefer settings that combine an unobstructed outlook with a protected back and
flanks. Gordon Orians' savanna hypothesis and the Kaplans' preference work (Rachel and Stephen Kaplan,
*The Experience of Nature*, 1989) point the same way — coherent, legible, partly enclosed settings are
preferred and are experienced as restorative. There is a genuine convergence here: the configuration
Form School calls an armchair is roughly the configuration environmental psychology finds people
prefer. What is *not* supported is the causal claim that the configuration changes health, wealth or
relationships; the evidence covers preference and perceived restorativeness, not outcomes.

#### Customer insight

Think of your home as a chair. You want something solid behind it, something gentle holding each side,
and a clear open view in front. Feng shui has described the ideal site this way for over a thousand
years — and it happens to be the shape of place most people say feels safest. We'll show you which
side of your chair is missing a leg.

#### Failure modes / when to skip

Do not fire on dense urban sites where the composite is structurally unachievable — if
`builtContextCount(radius_m=50) > p.urban_density_skip` the engine should switch to the apartment
pathway (FS-FORM-010, FS-SITE-024) rather than scoring an unwinnable lot. Skip entirely when
`site.surroundings` is empty or was never surveyed; an absent survey is not an absent armchair. Never
present this composite before FS-SITE-001/002 have confirmed the bearing, because every `relation`
here is derived from facing.

---

### FS-FORM-002 — Black tortoise: solid support behind the sitting side

```yaml
id: FS-FORM-002
title: Solid support behind the sitting side (black tortoise)
system: feng_shui.form_school
group: four_animals
version: 1
status: active
applies_to:
  rooms: []
  objects: []
  requires_features: []
scope: site
severity: high
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  require bearingProvenance(site) != unknown
  let back = supportMass(relation="back", arc_deg=p.rear_arc_deg)
  assert back != null
  assert back.subtended_deg >= p.min_rear_subtended_deg
  assert back.distance_m <= p.max_rear_distance_m
  prefer back.continuity >= p.min_rear_continuity
params:
  - key: rear_arc_deg
    default: 120
    range: [60, 180]
    unit: deg
    user_editable: false
    rationale: Arc behind the sitting side searched for supporting mass.
  - key: min_rear_subtended_deg
    default: 6
    range: [2, 30]
    unit: deg
    user_editable: true
    rationale: Minimum vertical angle the rear mass must subtend from the entry to register as support rather than scenery.
  - key: max_rear_distance_m
    default: 400
    range: [20, 5000]
    unit: m
    user_editable: true
    rationale: Beyond this distance a hill reads as landscape, not as the back of the chair. Classical texts give no number.
  - key: min_rear_continuity
    default: 0.5
    range: [0.0, 1.0]
    unit: ratio
    user_editable: true
    rationale: Fraction of the rear arc actually filled by mass; a gap-toothed ridge supports less than a continuous one.
score:
  weight: 9
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: plants.hedge.evergreen_row
    transform: {position: along_boundary(relation="back"), min_height_m: 2.0, depth_m: 0.8}
    cost: medium
    effort: medium
    reversible: true
    copy: A deep evergreen hedge along the rear boundary is the traditional way to build a back where the land gives none.
  - rank: 2
    action: add_object
    add: outdoor.fence.solid_panel
    transform: {position: along_boundary(relation="back"), min_height_m: 1.8, opacity: solid}
    cost: medium
    effort: medium
    reversible: true
    copy: A solid (not slatted) fence or masonry wall behind the house reads as support and cuts the wind at the same time.
  - rank: 3
    action: relocate_function
    target: room_program
    transform: {move: [bedroom_primary, home_office], to: rooms_on_sitting_side}
    cost: free
    effort: high_physical
    reversible: true
    copy: If the back of the plot can't be built up, put the rooms where you rest and concentrate on the sheltered side of the house instead.
  - rank: 4
    action: annotate_site
    target: site
    transform: {emit: advisory_no_remedy}
    cost: free
    effort: none
    reversible: true
    copy: Some sites simply have an open back. We'll compensate room by room rather than pretend the landform changed.
conflicts_with: []
supersedes: []
requires_rules: [FS-SITE-001]
tags: [site, tortoise, support, wind, signature_rule]
localization_notes: Never mirrored by hemisphere. Rear mass is defined relative to facing, not to North.
```

#### Why — tradition

*Kao shan* (靠山, "leaning mountain") is the single most emphasised element in Form School. The
sitting side — the side opposite facing — should have rising, continuous ground: the black tortoise.
The *Zangshu*'s logic is mechanical rather than mystical: qi disperses on the wind, so the site must be
enclosed on the windward/rear side for qi to accumulate. A site with nothing behind it is described as
"backless" and is held to produce instability and lack of backing in the occupants' affairs. Classical
and modern schools agree on this one; BTB practice tends to accept smaller-scale substitutes (a wall, a
row of trees, a taller building) more readily than strict landform practitioners do.

#### Why — psychology / physiology

Two independent mechanisms are real. First, refuge: an enclosed back reliably raises environmental
preference and lowers vigilance (Appleton, 1975; extensive later preference research). Second, and more
concretely, a solid mass or dense planting on the prevailing-wind side genuinely reduces wind speed,
wind-driven rain and infiltration heat loss at the building envelope — windbreak effects are
well-established in agricultural and building-energy literature. So the "qi scatters on the wind"
reading maps onto a measurable physical effect. The claimed link between a backless site and the
occupants' careers or finances has no empirical support.

#### Customer insight

Whatever sits behind your home — a hill, a mature hedge, a solid wall, even a taller building — is
what feng shui calls your support. An open, exposed back is the thing traditional practitioners flag
first, and it is also the cheapest thing to fix: two metres of dense hedge does most of the work.

#### Failure modes / when to skip

Skip where the rear boundary is a legally protected view corridor, a required fire-service access, or
where local covenants cap boundary height — surface the constraint instead of the remedy. Do not
recommend a solid rear fence where it would block the only egress path from a rear yard (defer to
`safety.egress`) or where it would shade a food garden or solar array on the sitting side. On a
sloping site where the rear is *downhill*, this rule fails by definition and FS-SITE-003 owns the
finding; suppress the duplicate.

---

### FS-FORM-003 — Rear support scale: support without oppression

```yaml
id: FS-FORM-003
title: Rear support must support, not oppress
system: feng_shui.form_school
group: four_animals
version: 1
status: active
applies_to:
  rooms: []
  objects: []
  requires_features: []
scope: site
severity: medium
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let back = supportMass(relation="back", arc_deg=p.rear_arc_deg)
  require back != null
  assert back.subtended_deg <= p.max_rear_subtended_deg
  assert back.distance_m >= p.min_rear_standoff_m
  penalize (back.height_m / max(back.distance_m, 0.1)) > p.max_rear_height_to_distance, weight=3
params:
  - key: rear_arc_deg
    default: 120
    range: [60, 180]
    unit: deg
    user_editable: false
    rationale: Arc searched behind the sitting side.
  - key: max_rear_subtended_deg
    default: 45
    range: [20, 80]
    unit: deg
    user_editable: true
    rationale: Above this vertical angle the rear mass reads as looming rather than supporting. App operationalization.
  - key: min_rear_standoff_m
    default: 3.0
    range: [1.0, 30.0]
    unit: m
    user_editable: true
    rationale: Minimum gap between the building and a cut face, retaining wall or cliff behind it, for daylight, drainage and perceived pressure.
  - key: max_rear_height_to_distance
    default: 1.0
    range: [0.3, 3.0]
    unit: ratio
    user_editable: true
    rationale: Rear mass taller than its distance away subtends more than 45 degrees and begins to feel like a wall closing in.
score:
  weight: 5
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: plants.shrub.layered_planting
    transform: {position: between(building_rear, rear_mass), tier_heights_m: [0.6, 1.2, 2.0]}
    cost: low
    effort: medium
    reversible: true
    copy: Stepping the planting up in tiers between the house and the bank softens a looming backdrop into a graded slope.
  - rank: 2
    action: modify_finish
    target: rear_retaining_wall
    transform: {finish: light_reflective, add: climbing_greenery}
    cost: low
    effort: low
    reversible: true
    copy: Lighten the wall behind the house and let greenery climb it — it stops reading as a cliff face.
  - rank: 3
    action: relocate_function
    target: room_program
    transform: {avoid: [bedroom_primary, home_office], in: rooms_adjacent_to_rear_cut}
    cost: free
    effort: high_physical
    reversible: true
    copy: Keep bedrooms and desks out of the rooms pressed hardest against the bank; use those for storage or utility.
conflicts_with: [FS-FORM-002]
supersedes: []
requires_rules: [FS-FORM-002]
tags: [site, tortoise, oppression, proportion]
localization_notes: none
```

#### Why — tradition

Form School is explicit that the tortoise should *embrace*, not *press*. A mountain so close and steep
that it towers over the dwelling is described as oppressive (a common practitioner term is
*ya* / pressing qi), and a house wedged tight against a cut face or cliff is treated as a defect rather
than as well-supported. The ideal is a mass that rises *behind and slightly away* — high enough to be
felt, far enough to leave the bright hall's counterpart, a breathing gap, at the rear. This nuance is
consistent across classical landform texts and is where naive "taller is better" readings of the
tortoise go wrong.

#### Why — psychology / physiology

Two real mechanisms. Perceptually, enclosure that exceeds roughly a 45° vertical angle crosses from
"enclosing" to "confining" in the environmental-preference and urban-enclosure literature, and the
same ratio family (building height to street width) is used in urban design precisely because
perceived pressure rises sharply past it. Physically, a steep mass immediately behind a dwelling
reduces rear daylight and sky view, concentrates surface-water runoff against the rear wall, and — on
unstable ground — is a genuine slope-failure exposure. The specific 45° figure here is an app default,
not a measured threshold.

#### Customer insight

Support behind your home is good; a wall of hillside two steps from the back door is not. Traditional
practice wants the land behind you to rise *and* stand back a little. If it doesn't, tiered planting
and a lighter wall finish stop it feeling like it's leaning on the house.

#### Failure modes / when to skip

Suppress on terraced, cut-and-fill and hillside-vernacular housing where a retaining wall close behind
is the normal building type — otherwise the rule fires on every home in the neighbourhood. Never
present the remedy list for a rear cut face showing signs of movement, seepage or undermining: escalate
to the structural/slope safety rules, which outrank this one. Skip for basements and for dwellings
where the rear is fully below grade by design.

---

### FS-FORM-004 — Red phoenix: bright hall depth before the entry

```yaml
id: FS-FORM-004
title: Bright hall (ming tang) open space before the entry
system: feng_shui.form_school
group: ming_tang
version: 1
status: active
applies_to:
  rooms: [porch_entry, entry_foyer, garden_yard, patio_deck]
  objects: []
  requires_features: []
scope: site
severity: high
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let entry = site.facingEntry
  let mt = mingTang(entry)
  assert mt.depth_m >= p.ming_tang_min_depth_m
  assert mt.depth_m >= p.ming_tang_depth_to_frontage_ratio * site.facingFrontageWidth_m
  assert mt.open_sky_arc_deg >= p.ming_tang_min_open_arc_deg
  prefer mt.area_m2 >= p.ming_tang_min_area_m2
params:
  - key: ming_tang_min_depth_m
    default: 3.0
    range: [1.0, 20.0]
    unit: m
    user_editable: true
    rationale: Absolute floor for usable open depth in front of the entry (about 10 ft). App operationalization; the classics give no number.
  - key: ming_tang_depth_to_frontage_ratio
    default: 0.5
    range: [0.2, 2.0]
    unit: ratio
    user_editable: true
    rationale: Scales the bright hall to the size of the house, so a wide frontage is asked for a deeper forecourt.
  - key: ming_tang_min_open_arc_deg
    default: 60
    range: [20, 180]
    unit: deg
    user_editable: true
    rationale: Horizontal sweep ahead of the entry that must be free of close obstruction.
  - key: ming_tang_min_area_m2
    default: 12.0
    range: [2.0, 200.0]
    unit: m2
    user_editable: true
    rationale: Preferred open floor area of the forecourt (about 130 sq ft).
score:
  weight: 8
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: remove_object
    target: [storage.bin.wheelie, outdoor.equipment.*, plants.shrub.overgrown]
    transform: {from_zone: ming_tang}
    cost: free
    effort: low
    reversible: true
    copy: Clear the strip in front of your door — bins, bikes, stacked pots. The open space itself is the feature.
  - rank: 2
    action: modify_object
    target: plants.shrub.*
    transform: {prune_to_max_height_m: 0.9, in_zone: ming_tang}
    cost: low
    effort: low
    reversible: true
    copy: Cut planting in the forecourt down below waist height so the view from the door opens up again.
  - rank: 3
    action: relocate_object
    target: outdoor.vehicle.parked
    transform: {to_zone: side_or_rear_of_lot}
    cost: free
    effort: low
    reversible: true
    copy: Park to the side rather than nose-in to the front door if the drive allows it.
  - rank: 4
    action: add_object
    add: lighting.exterior.path_wash
    transform: {position: ming_tang_perimeter, ccd_k: 2700, illuminance_lux: 20}
    cost: low
    effort: low
    reversible: true
    copy: Where the forecourt can't get bigger, make it brighter — low warm light across the space reads as a bright hall even at night.
conflicts_with: []
supersedes: []
requires_rules: [FS-FORM-009]
tags: [site, ming_tang, phoenix, entry, signature_rule]
localization_notes: Depth ratio may need lowering for row/terrace housing and for zero-lot-line urban typologies.
```

#### Why — tradition

The *ming tang* (明堂, "bright hall") is the open, level, well-lit space immediately before the
entry, and in Form School it is where qi gathers before entering the building. The term is borrowed
from the imperial ceremonial hall, and the function is transitional: the bright hall slows and collects
the qi arriving from the outside world so it enters the dwelling gently rather than in a rush. A site
with no bright hall — door opening straight onto a wall, a slope, a fence or a parked car — is treated
as having nowhere for qi to accumulate. Classical and modern schools agree; BTB practice extends the
same idea to the interior foyer (see FS-FORM-016).

#### Why — psychology / physiology

The bright hall is a well-described transition zone, and the mechanism is real. Christopher Alexander's
*A Pattern Language* (1977) argues independently for a graded entrance sequence rather than a door
straight onto the street, and CPTED practice treats a legible, visible, defensible forecourt as a
deterrent and a wayfinding aid. Perceptually, an open foreground gives prospect and lets an arriving
occupant scan before committing to the threshold — the same prospect mechanism as the armchair.
Functionally it is also where deliveries, buggies, wet coats and sightlines to arriving visitors all
have to happen. No study links forecourt depth to occupant fortune.

#### Customer insight

The few metres in front of your door do real work: they let you and your visitors arrive rather than
just appear. Feng shui calls this the bright hall and treats it as the most valuable empty space on the
property. Most homes fail it not for lack of room but because the bins live there.

#### Failure modes / when to skip

Skip for terraced, row, zero-lot-line and apartment entries where no forecourt exists to have — route
those to FS-FORM-016 (interior bright hall) and FS-SITE-024 (balcony). Do not ask for clearance that
would breach required parking, an accessible approach route, or a snow-storage easement. Do not fire
where the "obstruction" is a code-required guardrail, a ramp, or a handrail: accessibility outranks
this rule and the engine must say so.

---

### FS-FORM-005 — Bright hall quality: level, clear, bright, and not a dumping ground

```yaml
id: FS-FORM-005
title: Bright hall quality — level, clear and bright
system: feng_shui.form_school
group: ming_tang
version: 1
status: active
applies_to:
  rooms: [porch_entry, garden_yard, patio_deck, balcony]
  objects: []
  requires_features: []
scope: site
severity: medium
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let mt = mingTang(site.facingEntry)
  assert abs(slopeGrade(mt.surface)) <= p.max_ming_tang_grade_pct
  assert mt.clutter_coverage_pct <= p.max_clutter_coverage_pct
  assert mt.standing_water == false
  assert illuminanceAt(mt.centroid, condition="night") >= p.min_night_illuminance_lux
  prefer daylightAccess(mt.centroid) >= p.min_daylight_access
params:
  - key: max_ming_tang_grade_pct
    default: 5.0
    range: [1.0, 15.0]
    unit: pct
    user_editable: true
    rationale: A bright hall should read as level. 5 percent is also a common accessible-route cross-fall ceiling; jurisdiction varies.
    jurisdiction_varies: true
  - key: max_clutter_coverage_pct
    default: 20.0
    range: [0.0, 60.0]
    unit: pct
    user_editable: true
    rationale: Fraction of the forecourt floor occupied by stored objects before it stops reading as open.
  - key: min_night_illuminance_lux
    default: 10.0
    range: [1.0, 100.0]
    unit: lux
    user_editable: true
    rationale: App default for a forecourt that reads as bright after dark without glare. Not a code value.
  - key: min_daylight_access
    default: 0.35
    range: [0.0, 1.0]
    unit: ratio
    user_editable: true
    rationale: Normalised daylight availability in the forecourt; a permanently shadowed entry court is a dark hall, not a bright one.
score:
  weight: 5
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: remove_object
    target: [storage.bin.wheelie, storage.box.*, hobby.equipment.*]
    transform: {from_zone: ming_tang, to: side_yard_or_store}
    cost: free
    effort: low
    reversible: true
    copy: Give the bins and boxes a home out of the sightline from your door.
  - rank: 2
    action: repair_surface
    target: ming_tang.surface
    transform: {regrade_to_max_grade_pct: 2.0, add: positive_drainage_away_from_building}
    cost: high
    effort: high_physical
    reversible: false
    copy: If water pools in front of the door, regrade so it drains away from the house — this is a maintenance fix as much as a feng shui one.
  - rank: 3
    action: add_object
    add: lighting.exterior.wall_downlight
    transform: {position: flanking_entry, ccd_k: 2700, shielding: full_cutoff}
    cost: low
    effort: low
    reversible: true
    copy: Two shielded warm lights either side of the door light the space without dazzling anyone walking up.
  - rank: 4
    action: modify_finish
    target: ming_tang.surface
    transform: {reflectance: raise_to_min_0_35}
    cost: medium
    effort: medium
    reversible: true
    copy: A lighter paving or gravel colour bounces more light into the entry court.
conflicts_with: []
supersedes: []
requires_rules: [FS-FORM-004]
tags: [site, ming_tang, maintenance, lighting, drainage]
localization_notes: Night illuminance default assumes a residential street with some spill light; raise for rural sites with no ambient light.
```

#### Why — tradition

The classics describe the bright hall as *ming* — bright, open, level, clear. Practitioner literature
is consistent that a bright hall which is dark, waterlogged, steeply pitched or used for storage
inverts its function: instead of collecting good qi it collects stagnation. Standing water in front of
the entry is singled out, because water in Form School is auspicious only when it is clean, moving and
correctly placed (see FS-FORM-019 to FS-FORM-022); stagnant water at the door is the opposite case.

#### Why — psychology / physiology

Several real mechanisms stack. Entrance lighting and visibility are core CPTED variables and are
associated with reduced fear of crime; a clear, lit approach also cuts trip risk, which matters
disproportionately for older occupants (falls on entry steps and paths are a well-documented injury
category). Visual clutter at a threshold measurably raises search time and cognitive load for arriving
visitors. Standing water is a genuine mosquito-breeding and building-moisture problem. What is not
supported is any claim that a tidy forecourt changes fortune; the effects are on safety, legibility and
maintenance.

#### Customer insight

A bright hall is supposed to be *bright*. If the space in front of your door is dark, puddled or
stacked with stuff, tradition says the good energy never gets in — and more practically, neither do
you, comfortably, with your arms full. Clearing and lighting it is the highest-value hour you'll spend
outside.

#### Failure modes / when to skip

Skip the grade assertion on sites where the approach is necessarily sloped and a compliant ramp or
stepped approach already exists — do not ask for regrading that would break an accessible route. Do not
fire the clutter assertion on functional, weather-driven storage (firewood stacks in cold climates,
storm shutters) unless it blocks the door swing or the egress path. Suppress the illuminance assertion
where a dark-sky ordinance or a wildlife lighting restriction applies; recommend shielded low-level
lighting instead and say why.

---

### FS-FORM-006 — Green dragon: left flank support

```yaml
id: FS-FORM-006
title: Green dragon left flank support present
system: feng_shui.form_school
group: four_animals
version: 1
status: active
applies_to:
  rooms: []
  objects: []
  requires_features: []
scope: site
severity: medium
confidence: tradition
evidence_class: traditional
belief_gated: true
predicate: |
  require bearingProvenance(site) != unknown
  let left = supportMass(relation="left", arc_deg=p.flank_arc_deg, perspective=p.flank_perspective)
  assert left != null
  assert left.subtended_deg >= p.min_flank_subtended_deg
  prefer left.continuity >= p.min_flank_continuity
  prefer left.distance_m <= p.max_flank_distance_m
params:
  - key: flank_arc_deg
    default: 90
    range: [45, 150]
    unit: deg
    user_editable: false
    rationale: Arc to the dragon side searched for flanking mass.
  - key: min_flank_subtended_deg
    default: 4
    range: [1, 25]
    unit: deg
    user_editable: true
    rationale: Minimum vertical angle for a flank to read as an armrest rather than a kerb. Flanks should be lower than the tortoise.
  - key: min_flank_continuity
    default: 0.4
    range: [0.0, 1.0]
    unit: ratio
    user_editable: true
    rationale: Fraction of the flank arc filled by mass; an embracing arm is continuous, a single tree is not.
  - key: max_flank_distance_m
    default: 60
    range: [5, 500]
    unit: m
    user_editable: true
    rationale: Flanks act at the scale of the plot and its immediate neighbours, not the horizon.
  - key: flank_perspective
    default: looking_out
    range: [looking_out, looking_in]
    unit: enum
    user_editable: true
    rationale: Which hand the dragon sits on. Dominant classical convention is the observer looking out from the building.
score:
  weight: 4
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: plants.hedge.evergreen_row
    transform: {position: along_boundary(relation="left"), min_height_m: 1.5, max_height_m: 2.4}
    cost: medium
    effort: medium
    reversible: true
    copy: A hedge along the left boundary — kept lower than whatever backs the house — gives that side an arm to rest on.
  - rank: 2
    action: add_object
    add: plants.tree.columnar
    transform: {position: along_boundary(relation="left"), spacing_m: 2.5}
    cost: medium
    effort: medium
    reversible: true
    copy: A run of narrow upright trees does the same job on a tight boundary.
  - rank: 3
    action: add_object
    add: outdoor.trellis.planted
    transform: {position: along_boundary(relation="left"), height_m: 1.8}
    cost: low
    effort: low
    reversible: true
    copy: On a rented or paved plot, a planted trellis gives the side some body without groundwork.
conflicts_with: []
supersedes: []
requires_rules: [FS-FORM-001]
tags: [site, dragon, flank]
localization_notes: Never mirrored by hemisphere. Left is defined by facing plus flank_perspective, not by compass East.
```

#### Why — tradition

The green dragon (*qing long*, 青龍) is the left-hand embracing arm of the armchair, traditionally
read as slightly higher and longer than the right. In landform practice the dragon and tiger are the
*sha* (砂) — the subsidiary ridges that flank the site and hold the qi collected in the bright hall.
Classical texts treat the dragon side as the active, yang, "male" flank and prefer it to be the
stronger of the two; BTB practice keeps the left/right hierarchy but is much looser about landform
scale, accepting a fence line or neighbouring building as the flank.

#### Why — psychology / physiology

`No direct empirical support; mechanism is plausible but untested.` The plausible mechanism is the
lateral-enclosure half of prospect–refuge: partial flanking enclosure narrows the field over which an
occupant must monitor for approach while leaving the front open, which is the configuration people
prefer in landscape-preference studies. There is no evidence at all for the left/right *asymmetry* —
no study has tested whether enclosure on one specific hand differs from the other, and the asymmetry is
best read as a cultural convention inherited from imperial court orientation.

#### Customer insight

Feng shui wants both sides of your home held, with the left side (standing at your door looking out)
the slightly stronger of the two. A hedge, a fence or a neighbouring wall all count. It is the easiest
part of the armchair to build.

#### Failure modes / when to skip

Skip on semi-detached and terraced houses where the party wall already provides one flank — score it as
satisfied rather than asking for planting against a shared wall. Do not recommend boundary planting
that would shade a neighbour's window, breach a height covenant, or block a sightline required at a
driveway exit. Suppress the left/right hierarchy assertion (FS-FORM-007) when the user has set
`strictness: relaxed`, because the asymmetry is the least defensible part of the doctrine.

---

### FS-FORM-007 — Dragon–tiger balance: the right flank must not overtop the left

```yaml
id: FS-FORM-007
title: Dragon and tiger balance — tiger should not exceed dragon
system: feng_shui.form_school
group: four_animals
version: 1
status: active
applies_to:
  rooms: []
  objects: []
  requires_features: []
scope: site
severity: low
confidence: tradition
evidence_class: traditional
belief_gated: true
predicate: |
  let left  = supportMass(relation="left",  arc_deg=p.flank_arc_deg, perspective=p.flank_perspective)
  let right = supportMass(relation="right", arc_deg=p.flank_arc_deg, perspective=p.flank_perspective)
  require left != null and right != null
  prefer left.height_m >= right.height_m - p.flank_height_tolerance_m
  penalize right.height_m > left.height_m * p.tiger_dominance_ratio, weight=3
  prefer max(left.height_m, right.height_m) <= p.flank_to_rear_height_ratio * supportMass(relation="back").height_m
params:
  - key: flank_arc_deg
    default: 90
    range: [45, 150]
    unit: deg
    user_editable: false
    rationale: Arc searched on each side.
  - key: flank_height_tolerance_m
    default: 0.5
    range: [0.0, 3.0]
    unit: m
    user_editable: true
    rationale: Height difference treated as equal rather than as tiger dominance (about 20 in).
  - key: tiger_dominance_ratio
    default: 1.3
    range: [1.0, 3.0]
    unit: ratio
    user_editable: true
    rationale: How much taller the right flank must be before classical practice calls the tiger dominant.
  - key: flank_to_rear_height_ratio
    default: 0.8
    range: [0.3, 1.2]
    unit: ratio
    user_editable: true
    rationale: Flanks should stay below the tortoise so the armchair keeps its shape.
  - key: flank_perspective
    default: looking_out
    range: [looking_out, looking_in]
    unit: enum
    user_editable: true
    rationale: Which hand the dragon sits on.
score:
  weight: 3
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: plants.tree.columnar
    transform: {position: along_boundary(relation="left"), target_height_m: match_right_plus_0_5}
    cost: medium
    effort: medium
    reversible: true
    copy: Rather than cutting the right side down, build the left side up until it reads as the stronger arm.
  - rank: 2
    action: modify_object
    target: plants.hedge.*
    transform: {prune: {relation: "right", to_height_m: left_height_minus_0_3}}
    cost: free
    effort: low
    reversible: true
    copy: If the planting on the right has run away with itself, trimming it back below the left restores the balance traditional practice looks for.
  - rank: 3
    action: annotate_site
    target: site
    transform: {emit: advisory_unmodifiable_neighbour}
    cost: free
    effort: none
    reversible: true
    copy: When the tall side is a neighbour's building, there is nothing to fix — we'll note it and strengthen your own left boundary instead.
conflicts_with: [FS-FORM-006]
supersedes: []
requires_rules: [FS-FORM-006]
tags: [site, dragon, tiger, asymmetry, contested_doctrine]
localization_notes: Explicitly not mirrored for the southern hemisphere; see OPEN_QUESTIONS.
```

#### Why — tradition

Classical landform practice holds that the dragon (left) should be somewhat higher, longer and more
vigorous than the white tiger (*bai hu*, 白虎) on the right, and that a tiger which overtops the
dragon lets the tiger "rise" — an inauspicious configuration associated in practitioner literature with
conflict, injury and the household losing control of its own affairs. Both flanks should nonetheless
stay lower than the tortoise, preserving the chair silhouette. This is one of the more rigid
asymmetries in Form School and one where practitioners differ most in how strictly they apply it.

#### Why — psychology / physiology

`No direct empirical support; mechanism is plausible but untested.` No research distinguishes the
psychological effect of enclosure on an occupant's left versus right hand in the built environment.
Lateralised perceptual asymmetries exist in the laboratory (for instance leftward attentional bias in
scene viewing) but nothing in that literature supports a preference for taller mass on one side of a
building, and it would be dishonest to borrow it as a mechanism. The only defensible general claim is
the one FS-FORM-006 already makes: some lateral enclosure beats none.

#### Customer insight

Tradition likes the left side of your home (facing out from the door) to be a little stronger than the
right. It's a convention rather than something anyone has measured, so we score it gently — and where
the tall side is your neighbour's roof, we just note it and build up your own side instead.

#### Failure modes / when to skip

Skip whenever the dominant right-hand mass is off-plot and unmodifiable; emitting a remedy the user
cannot perform is worse than staying quiet. Never recommend removing or topping a protected, preserved
or boundary-shared tree to satisfy this rule. Auto-suppress at `strictness: relaxed` and in the
generation path, where enforcing this asymmetry would distort otherwise good layouts for the weakest
doctrine in the file.

---

### FS-FORM-008 — White tiger opens its mouth: large opening on the tiger flank

```yaml
id: FS-FORM-008
title: Large vehicular or gaping opening on the tiger (right) flank
system: feng_shui.form_school
group: four_animals
version: 1
status: active
applies_to:
  rooms: [garage_parking, workshop_garage]
  objects: []
  requires_features: []
scope: whole_home
severity: low
confidence: folklore
evidence_class: traditional
belief_gated: true
predicate: |
  let openings = site.facadeOpenings(relation="right", perspective=p.flank_perspective)
  forEach o in openings:
    penalize (o.width_m >= p.tiger_mouth_min_width_m
              and o.kind in [garage, sliding, gate]
              and distance(o.centroid, site.facingEntry.centroid) <= p.tiger_mouth_radius_m), weight=2
  prefer countOf(kind=garage, scope=site.facadeOpenings(relation="right")) == 0
params:
  - key: tiger_mouth_min_width_m
    default: 2.4
    range: [1.2, 6.0]
    unit: m
    user_editable: true
    rationale: Width at which an opening reads as a "mouth" rather than a window. 2.4 m is a single garage door (about 8 ft).
  - key: tiger_mouth_radius_m
    default: 12.0
    range: [3.0, 40.0]
    unit: m
    user_editable: true
    rationale: How close to the main entry the opening must be to be read as part of the same facade composition.
  - key: flank_perspective
    default: looking_out
    range: [looking_out, looking_in]
    unit: enum
    user_editable: true
    rationale: Which hand the tiger sits on.
score:
  weight: 2
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: modify_object
    target: outdoor.door.garage
    transform: {keep_closed_when_unused: true}
    cost: free
    effort: low
    reversible: true
    copy: The simplest traditional answer is to keep the garage door shut when you are not using it, so the "mouth" is closed.
  - rank: 2
    action: add_object
    add: plants.shrub.screening
    transform: {position: between(garage_opening, entry_path), min_height_m: 1.0}
    cost: low
    effort: low
    reversible: true
    copy: A low planted break between the garage and the front path separates the two entrances visually.
  - rank: 3
    action: modify_finish
    target: outdoor.door.garage
    transform: {color: recede_to_match_facade}
    cost: low
    effort: medium
    reversible: true
    copy: Painting the garage door to blend with the wall makes it stop dominating the front of the house.
  - rank: 4
    action: annotate_site
    target: site
    transform: {emit: advisory_low_confidence}
    cost: free
    effort: none
    reversible: true
    copy: This one is a folk reading rather than core doctrine — we flag it but we won't push you to spend money on it.
conflicts_with: []
supersedes: []
requires_rules: [FS-FORM-007]
tags: [site, tiger, garage, folklore, low_confidence]
localization_notes: Strongly associated with Cantonese and Southeast Asian practitioner vernacular; less prominent in mainland landform texts.
```

#### Why — tradition

"White tiger opens its mouth" (*bai hu kai kou*) is a practitioner formula, widespread in Hong Kong,
Taiwan and Southeast Asian vernacular feng shui, holding that a large gaping opening on the tiger
flank — most often a garage door, but also a wide side gate or a full-height sliding opening — lets
the tiger bite. It is folk elaboration on the dragon–tiger hierarchy rather than a doctrine found in
the classical landform canon, which is why this rule is marked `folklore` and weighted very low. Many
serious classical practitioners do not use it at all.

#### Why — psychology / physiology

`No direct empirical support; mechanism is plausible but untested.` The only real, and quite separate,
effect in the vicinity is compositional: a garage door wider than the front door and placed beside it
becomes the visual entrance, which measurably degrades entry legibility for first-time visitors and is
a standard criticism in residential-facade design (the "snout house" critique). That is an aesthetic
and wayfinding argument, not the traditional one, and the app should not conflate them.

#### Customer insight

Some practitioners say a wide garage door on the right of your front door is a mouth that shouldn't be
left open. This is folklore rather than core feng shui, so our advice is cheap: shut the garage when
you're not using it, and don't let it out-shout your actual front door.

#### Failure modes / when to skip

Off by default when the user's strictness is `classical_only`, since the rule is not classical. Never
fires on detached garages beyond `tiger_mouth_radius_m`. Do not recommend keeping a garage door closed
where the garage is a required means of egress, houses a heat pump or generator needing ventilation, or
is a habitable conversion.

---

### FS-FORM-009 — Facing determination: the most-yang facade method

```yaml
id: FS-FORM-009
title: Determine facing from the most yang facade
system: feng_shui.form_school
group: facing_sitting
version: 1
status: active
applies_to:
  rooms: []
  objects: []
  requires_features: []
scope: whole_home
severity: high
confidence: expert_consensus
evidence_class: traditional
belief_gated: true
predicate: |
  require bearingProvenance(site) != unknown
  let cands = site.candidateFacades()
  forEach c in cands:
    let y = yangScore(c)          # weighted: openArcAhead, glazingRatio, streetActivity,
                                  # daylightAccess, pedestrianApproach, viewOpenness
    store c.yang = y
  let best   = argmax(cands, c => c.yang)
  let second = secondMax(cands, c => c.yang)
  assert site.facing_bearing_deg == bearingOf(best) within p.facing_bearing_tol_deg
  assert (best.yang - second.yang) >= p.yang_margin_required
  require site.sitting_bearing_deg == (site.facing_bearing_deg + 180) mod 360 within p.facing_bearing_tol_deg
params:
  - key: facing_bearing_tol_deg
    default: 7.5
    range: [1.0, 22.5]
    unit: deg
    user_editable: true
    rationale: Half a 24-mountain span (15 deg). A stored facing must agree with the geometry to within half a mountain or the sector assignment is unsafe.
  - key: yang_margin_required
    default: 0.12
    range: [0.0, 0.5]
    unit: ratio
    user_editable: true
    rationale: How clearly the winning facade must beat the runner-up before facing is treated as determined; below this, FS-FORM-013 fires instead.
  - key: w_open_arc
    default: 0.30
    range: [0.0, 1.0]
    unit: ratio
    user_editable: true
    rationale: Weight of open space and sky ahead of the facade in the yang score. Openness is the most-cited yang indicator.
  - key: w_glazing
    default: 0.20
    range: [0.0, 1.0]
    unit: ratio
    user_editable: true
    rationale: Weight of glazed area ratio. Modern apartments put their yang side behind the glass.
  - key: w_street_activity
    default: 0.25
    range: [0.0, 1.0]
    unit: ratio
    user_editable: true
    rationale: Weight of adjacent vehicle and pedestrian movement, the classical marker of active yang qi.
  - key: w_daylight
    default: 0.15
    range: [0.0, 1.0]
    unit: ratio
    user_editable: true
    rationale: Weight of daylight availability. Kept low deliberately: the sunniest side is NOT by itself the facing side.
  - key: w_approach
    default: 0.10
    range: [0.0, 1.0]
    unit: ratio
    user_editable: true
    rationale: Weight of the pedestrian arrival route.
score:
  weight: 10
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: request_user_input
    target: site.facing_bearing_deg
    transform: {prompt: confirm_facing, show: yang_score_breakdown_per_facade}
    cost: free
    effort: none
    reversible: true
    copy: Before anything else, let's agree which side of your home is its "front". We think it is the side shown — here is why.
  - rank: 2
    action: recompute
    target: [bagua_map, compass_rotation_deg, all_directional_findings]
    transform: {on_change: facing_bearing_deg}
    cost: free
    effort: none
    reversible: true
    copy: Change the facing and every direction-based suggestion updates with it.
conflicts_with: []
supersedes: []
requires_rules: [FS-SITE-001, FS-SITE-002]
tags: [facing, sitting, whole_home, gate_rule, signature_rule]
localization_notes: Method is orientation-neutral and hemisphere-neutral. The yang-score weights are the honest operationalization of a judgement call practitioners make by eye.
```

#### Why — tradition

Every compass-based feng shui method — Eight Mansions, Flying Stars, San He water methods — depends on
one number: the facing (*xiang*, 向), with the sitting (*zuo*, 坐) directly opposite. Classical practice
determines facing as the **most yang** side: the side that is most open, brightest, most active, most
exposed to movement and the public world, with the sitting side being the quiet yin side. This is a
*judgement*, and practitioners are candid that it is where most amateur analyses go wrong. Note that
Form School genuinely disagrees with itself at the margins: some lineages weight the architectural
front and the original builder's intent, others weight observed yang activity, and the two can point
at different walls.

#### Why — psychology / physiology

There is no psychological mechanism for facing itself — it is a measurement convention. What is real is
the error-propagation argument for taking it seriously: a mis-set facing rotates every downstream
directional finding by up to 180°, so the app would confidently give reversed advice. Treating facing
as a gated, user-confirmed input with an explicit confidence value is a data-quality decision, and the
honest statement to the user is that this is the app's largest single source of possible error.

#### Customer insight

One decision shapes every direction-based tip we give you: which side of your home counts as the front.
Tradition says it is the most open, active, "awake" side — which is not always where your door is. We
show our reasoning and let you correct us, because getting this wrong flips everything else.

#### Failure modes / when to skip

If `yang_margin_required` is not met, do not guess: hand off to FS-FORM-013 and run both candidates.
For apartments, FS-FORM-010 overrides this rule's candidate set. Never derive facing from the sunniest
wall alone (that is the error FS-FORM-012 catches), and never store a facing with
`bearingProvenance == unknown`. On single-aspect units with only one exterior wall, facing is forced and
the margin test is vacuous — mark it `determined_trivially` rather than `high_confidence`.

---

### FS-FORM-010 — Apartment effective facing: unit versus building

```yaml
id: FS-FORM-010
title: Apartment effective facing — unit facing versus building facing
system: feng_shui.form_school
group: facing_sitting
version: 1
status: active
applies_to:
  rooms: [studio_apartment, open_plan_combined, balcony]
  objects: []
  requires_features: []
scope: whole_home
severity: high
confidence: contested
evidence_class: traditional
belief_gated: true
predicate: |
  require site.dwelling_kind == apartment
  let bldg = buildingFacing(site)
  let unit = argmax(site.unitFacades(), f => yangScore(f))
  store site.building_facing_bearing_deg = bearingOf(bldg)
  store site.unit_facing_bearing_deg     = bearingOf(unit)
  if angleBetween(bearingOf(bldg), bearingOf(unit)) > p.unit_building_divergence_tol_deg:
      emit finding(kind="facing_ambiguous_apartment",
                   scenarios=[bearingOf(bldg), bearingOf(unit)])
      assert facingConfidence(site) <= p.max_confidence_when_divergent
  assert site.facing_bearing_deg in [bearingOf(bldg), bearingOf(unit)] within p.facing_bearing_tol_deg
  forbid facingDerivedFrom(site) == corridor_door_only
params:
  - key: unit_building_divergence_tol_deg
    default: 22.5
    range: [7.5, 90.0]
    unit: deg
    user_editable: true
    rationale: One 45-degree octant half-width. Beyond this the unit and building facings land in different trigram sectors and the choice matters.
  - key: max_confidence_when_divergent
    default: 0.55
    range: [0.0, 0.9]
    unit: ratio
    user_editable: true
    rationale: Caps how confident the app may present directional advice when the two defensible facings disagree.
  - key: facing_bearing_tol_deg
    default: 7.5
    range: [1.0, 22.5]
    unit: deg
    user_editable: true
    rationale: Half a 24-mountain span.
  - key: default_apartment_method
    default: unit_yang_face
    range: [unit_yang_face, building_facing, run_both]
    unit: enum
    user_editable: true
    rationale: Which school's convention to apply by default. Practitioners genuinely disagree; run_both is the honest setting for advanced users.
score:
  weight: 9
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: request_user_input
    target: site.facing_bearing_deg
    transform: {prompt: choose_apartment_facing_method, show: [building_facade_photo_hint, unit_balcony_hint]}
    cost: free
    effort: none
    reversible: true
    copy: Apartments have two reasonable "fronts": the building's and your own. Practitioners disagree about which wins, so we'll ask you once and be consistent afterwards.
  - rank: 2
    action: run_dual_analysis
    target: all_directional_rules
    transform: {scenarios: [building_facing, unit_facing], report: agreements_first}
    cost: free
    effort: none
    reversible: true
    copy: We can run both readings and lead with the advice they agree on — that part is safe either way.
conflicts_with: [FS-FORM-009]
supersedes: []
requires_rules: [FS-SITE-001]
tags: [facing, apartment, contested_doctrine, gate_rule]
localization_notes: High-rise apartment facing is a genuinely unsettled question in classical practice; the app must not present a single answer as settled.
```

#### Why — tradition

Classical texts describe houses, not towers, so applying facing to an apartment is an extension rather
than a transmission. Two conventions are in wide use. One takes the **building's** facing — the tower
has one front, determined as for a house, and every unit inherits it. The other takes the **unit's own
most-yang face**, which in practice is usually the balcony or main glazed wall, on the reasoning that
this is where light, air and qi actually enter the dwelling. Practitioners on both sides are emphatic,
and there is no classical authority to settle it; what nearly all of them agree on is the *negative*
rule — the door onto an internal corridor is not, by itself, the facing.

#### Why — psychology / physiology

`No direct empirical support; mechanism is plausible but untested.` There is no mechanism to test: this
is a definitional dispute inside a tradition. The one real consideration is epistemic honesty about
uncertainty — presenting an unsettled convention as settled, then generating confident directional
advice from it, is the failure mode most likely to make the app wrong in a way users can eventually
detect.

#### Customer insight

In an apartment there are two fair answers to "which way does my home face" — the building's front, or
your own balcony and main windows. Feng shui practitioners genuinely disagree, so we'll show you both
and lead with the advice that holds either way.

#### Failure modes / when to skip

Never silently pick a method: if the two facings diverge past the tolerance and the user has not
chosen, cap confidence and say so on every directional card. Do not use the corridor door as facing
even when it is the only opening the user thinks of as the front. For single-aspect units the two
methods usually coincide and this rule should resolve quietly. Suppress in the generation path — the
generator must take facing as given, never infer it mid-run.

---

### FS-FORM-011 — Facing and sitting antipodal consistency and bearing provenance

```yaml
id: FS-FORM-011
title: Facing and sitting must be antipodal and carry a declared bearing frame
system: feng_shui.form_school
group: facing_sitting
version: 1
status: active
applies_to:
  rooms: []
  objects: []
  requires_features: []
scope: whole_home
severity: high
confidence: expert_consensus
evidence_class: traditional
belief_gated: true
predicate: |
  require exists site.facing_bearing_deg
  assert abs(angleBetween(site.facing_bearing_deg, site.sitting_bearing_deg) - 180)
         <= p.antipodal_tol_deg
  assert bearingProvenance(site) in [magnetic, true]
  assert bearingFrame(site.facing_bearing_deg) == bearingFrame(room.compass_rotation_deg)
  forEach r in site.rooms:
    assert bearingFrame(r.compass_rotation_deg) == site.bearing_frame
  assert exists site.magnetic_declination_deg
  penalize (bearingProvenance(site) == true and site.directional_method_family == luopan_magnetic), weight=5
params:
  - key: antipodal_tol_deg
    default: 1.0
    range: [0.0, 5.0]
    unit: deg
    user_editable: false
    rationale: Sitting is defined as facing plus 180. Any larger discrepancy is a data-entry bug, not a judgement.
  - key: mixed_frame_policy
    default: block_directional_rules
    range: [block_directional_rules, warn_only, auto_convert]
    unit: enum
    user_editable: true
    rationale: What to do when magnetic and true bearings are mixed. Auto-convert is offered but is unsafe without provenance on every field.
score:
  weight: 8
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: recompute
    target: site.sitting_bearing_deg
    transform: {set: (facing_bearing_deg + 180) mod 360}
    cost: free
    effort: none
    reversible: true
    copy: Your sitting direction is always the exact opposite of your facing direction — we've corrected it.
  - rank: 2
    action: request_user_input
    target: site.bearing_frame
    transform: {prompt: declare_magnetic_or_true}
    cost: free
    effort: none
    reversible: true
    copy: Was this reading taken with a compass (magnetic) or read off a map or satellite view (true north)? They differ, sometimes by more than a whole sector.
  - rank: 3
    action: block_rules
    target: system_family(feng_shui.compass.*)
    transform: {until: bearing_frame_declared}
    cost: free
    effort: none
    reversible: true
    copy: We'll hold back the direction-based advice until we know which north your reading used — better silent than confidently wrong.
conflicts_with: []
supersedes: []
requires_rules: [FS-SITE-001]
tags: [facing, sitting, data_quality, gate_rule]
localization_notes: The magnetic-versus-true question is global but its size is local; near the agonic lines declination is near zero and the distinction is moot.
```

#### Why — tradition

Sitting is *defined* as facing plus 180° in every classical school; there is no lineage in which they
are independently measured. The live traditional issue is which north the reading uses. A *luopan* is a
magnetic compass, so the entire 24-mountain apparatus and the sector boundaries inherited with it were
built on magnetic bearings, and most classical practitioners take their reading magnetically and use it
directly without applying declination. That makes mixing a phone's magnetic heading with a bearing
scaled off a satellite image a doctrinal as well as an arithmetic error.

#### Why — psychology / physiology

Not applicable as a human mechanism; this is data integrity. The measurable consequence is real and
worth stating: the 24-mountain system divides the circle into 15° spans, so a magnetic-versus-true
mismatch of more than 7.5° can move a site into the adjacent mountain, and a mismatch above 22.5° can
move it into the adjacent trigram sector and change every derived recommendation.

#### Customer insight

Compass readings come in two flavours — the one your phone's compass gives and the one a map gives —
and in some places they differ by more than a whole feng shui sector. We keep track of which one you
used so your directions don't quietly shift by one notch.

#### Failure modes / when to skip

This rule must run before every compass-family rule in the library and must not be belief-gated away
while any directional system is enabled. Do not auto-convert between frames unless provenance is
recorded on every bearing field, including per-room `compass_rotation_deg`. Near the agonic line
(declination ≈ 0) the mixed-frame penalty is harmless and may be downgraded to advisory.

---

### FS-FORM-012 — Rejected facing heuristics

```yaml
id: FS-FORM-012
title: Reject the common wrong ways of determining facing
system: feng_shui.form_school
group: facing_sitting
version: 1
status: active
applies_to:
  rooms: []
  objects: []
  requires_features: []
scope: whole_home
severity: medium
confidence: expert_consensus
evidence_class: traditional
belief_gated: true
predicate: |
  let m = facingDerivedFrom(site)
  forbid m == most_used_door
  forbid m == postal_address_street
  forbid m == mailbox_position
  forbid m == sunniest_wall
  forbid m == driveway_direction_only
  forbid m == corridor_door_only
  forbid m == front_door_swing_direction
  if m in p.soft_reject_methods:
      emit finding(kind="facing_method_weak", method=m)
      assert facingConfidence(site) <= p.max_confidence_weak_method
params:
  - key: soft_reject_methods
    default: [driveway_direction_only, garage_door_direction, largest_window_only]
    range: [any_subset_of_facing_methods]
    unit: enum_list
    user_editable: true
    rationale: Methods that are indicative but not sufficient; they lower confidence rather than being rejected outright.
  - key: max_confidence_weak_method
    default: 0.5
    range: [0.0, 0.9]
    unit: ratio
    user_editable: true
    rationale: Confidence ceiling when facing rests on a weak indicator alone.
score:
  weight: 6
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: recompute
    target: site.facing_bearing_deg
    transform: {method: most_yang_facade}
    cost: free
    effort: none
    reversible: true
    copy: We re-derived your facing from the openness and activity around each side of the house rather than from which door you use.
  - rank: 2
    action: request_user_input
    target: site.facing_bearing_deg
    transform: {prompt: confirm_facing, show: rejected_method_explainer}
    cost: free
    effort: none
    reversible: true
    copy: Quick check: the door you use most often, your street address and your sunniest wall are all common shortcuts — and all three can point at the wrong side.
conflicts_with: []
supersedes: []
requires_rules: [FS-FORM-009]
tags: [facing, data_quality, education, common_error]
localization_notes: The address-based error is especially common on corner plots and for units addressed from a rear lane.
```

#### Why — tradition

Practitioner literature is unusually unified about the errors. The door you use most (often a garage or
kitchen door) is not facing. The street in your postal address is not facing, particularly on corner
lots and rear-lane addressed units. The sunniest wall is not facing — brightness is one yang indicator
among several, and in the southern hemisphere it systematically misleads. An internal corridor door in
an apartment is not facing. The correct determination weighs openness, activity, exposure and the
building's own intended front together, which is what FS-FORM-009 does.

#### Why — psychology / physiology

Not a human mechanism — this is a taxonomy of user error, and it exists because each rejected heuristic
is *available* and *plausible*, which is exactly the profile of a heuristic that produces confident
wrong answers. The product consequence is what matters: these shortcuts are what an untrained user will
reach for, so the app should catch them explicitly and explain the correction rather than silently
overriding it.

#### Customer insight

Four shortcuts trip almost everyone up: using the door you actually walk through, using your street
address, using the sunniest wall, or using your apartment's hallway door. Any of them can point at the
wrong side of your home. We check, and we show you the difference.

#### Failure modes / when to skip

Some of these shortcuts land on the right answer — a house whose most-used door *is* the open, active
front is fine, and this rule should then confirm rather than complain. The `forbid` clauses are
therefore about the *stored method provenance*, not about the resulting bearing: if the yang method
independently agrees, record the agreement and pass. Do not fire on single-aspect units where facing is
forced.

---

### FS-FORM-013 — Facing ambiguity: dual-scenario analysis

```yaml
id: FS-FORM-013
title: Ambiguous facing triggers dual-scenario analysis, not a guess
system: feng_shui.form_school
group: facing_sitting
version: 1
status: active
applies_to:
  rooms: []
  objects: []
  requires_features: []
scope: whole_home
severity: medium
confidence: expert_consensus
evidence_class: traditional
belief_gated: true
predicate: |
  let cands = topN(site.candidateFacades(), n=2, key=yangScore)
  if (cands[0].yang - cands[1].yang) < p.yang_margin_required
     or site.corner_plot == true
     or angleBetween(bearingOf(cands[0]), bearingOf(cands[1])) > p.divergence_matters_deg:
     require analysisMode(site) == dual_scenario
     assert facingConfidence(site) <= p.max_confidence_ambiguous
     forbid presentSingleAnswer(system_family=feng_shui.compass.*)
params:
  - key: yang_margin_required
    default: 0.12
    range: [0.0, 0.5]
    unit: ratio
    user_editable: true
    rationale: Same margin as FS-FORM-009; below it, facing is not determined.
  - key: divergence_matters_deg
    default: 22.5
    range: [7.5, 90.0]
    unit: deg
    user_editable: true
    rationale: If the two candidates fall in the same 45-degree octant the ambiguity rarely changes advice; beyond it, it does.
  - key: max_confidence_ambiguous
    default: 0.5
    range: [0.0, 0.9]
    unit: ratio
    user_editable: true
    rationale: Confidence ceiling while facing remains undetermined.
  - key: show_agreement_first
    default: true
    range: [true, false]
    unit: bool
    user_editable: true
    rationale: Lead with the findings both scenarios share, which are robust to the ambiguity.
score:
  weight: 6
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: run_dual_analysis
    target: all_directional_rules
    transform: {scenarios: [candidate_a, candidate_b], report: agreements_first}
    cost: free
    effort: none
    reversible: true
    copy: Your home has two defensible fronts, so we ran both. Start with the suggestions that came out the same either way — those are safe.
  - rank: 2
    action: request_user_input
    target: site.facing_bearing_deg
    transform: {prompt: tiebreak_facing, show: [photo_prompt_each_facade, activity_question]}
    cost: free
    effort: none
    reversible: true
    copy: Two questions will settle it: which side feels busier and more public, and which side was designed as the front?
  - rank: 3
    action: escalate_to_human
    target: consult_flow
    transform: {reason: facing_undetermined}
    cost: high
    effort: low
    reversible: true
    copy: If you want the direction-based readings to be exact, this is the one thing worth a consultant's eye on site.
conflicts_with: []
supersedes: []
requires_rules: [FS-FORM-009]
tags: [facing, uncertainty, corner_plot, product_honesty]
localization_notes: Corner plots and dual-frontage units are the dominant trigger in dense urban markets.
```

#### Why — tradition

Corner plots, dual-frontage units, houses on a through-block and buildings remodelled so the original
front is now the back all produce genuine ambiguity, and experienced practitioners handle it by
analysing both readings and looking for convergence — not by picking one and asserting it. Some
lineages add tiebreakers (the builder's intended front, the road hierarchy, where the address was
historically taken from), but they are tiebreakers, not proofs.

#### Why — psychology / physiology

No human mechanism. The relevant principle is calibration: a system that reports confident directional
advice from an undetermined input will be wrong roughly half the time on exactly the cases where users
are most likely to notice. Reporting the intersection of two scenarios is strictly more defensible than
reporting one scenario's full output.

#### Customer insight

Corner homes and apartments with two open sides often have two fair "fronts". Rather than pick one and
sound certain, we run both readings and put the advice they agree on at the top.

#### Failure modes / when to skip

Never let dual-scenario mode leak into the layout generator — the generator needs one facing, so if the
user has not tie-broken, generate with the higher-yang candidate and label the output accordingly. Skip
when only one facade is exterior. Do not run dual analysis when the two candidates share a 45° octant;
the extra reporting adds noise without changing advice.

---

### FS-FORM-014 — Interior support wall determination: which wall counts as a mountain

```yaml
id: FS-FORM-014
title: Determine which wall of a room counts as support (the interior mountain)
system: feng_shui.form_school
group: interior_analogue
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, bedroom_guest, bedroom_child, bedroom_teen, home_office, home_office_shared, study_library, living_room, family_room, great_room, studio_apartment, dorm_room]
  objects: []
  requires_features: []
scope: room_composition
severity: medium
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  forEach w in room.walls:
    let solid_pct = 1 - (sumOf(w.openings, o => o.width_m * o.height_m) / (wallLength(w) * room.ceiling_height_m))
    let s = p.w_solid * solid_pct
          + p.w_structural * (w.structural ? 1 : 0)
          + p.w_length * clamp(wallLength(w) / p.support_wall_reference_length_m, 0, 1)
          + p.w_no_traffic * (crossesPath(w.innerZone, room.primaryCirculation) ? 0 : 1)
          - p.w_penalty_party * (isPartyWallToNoisyRoom(w) ? 1 : 0)
    store w.support_score = s
  let best = argmax(room.walls, w => w.support_score)
  assert best.support_score >= p.min_support_wall_score
  store room.support_wall_id = best.id
params:
  - key: support_wall_reference_length_m
    default: 3.6
    range: [1.5, 8.0]
    unit: m
    user_editable: false
    rationale: Wall length at which length stops adding to support quality (about 12 ft).
  - key: min_support_wall_score
    default: 0.45
    range: [0.1, 0.9]
    unit: ratio
    user_editable: true
    rationale: Below this no wall in the room qualifies as a mountain and FS-FORM-015 (fabricate support) fires.
  - key: w_solid
    default: 0.40
    range: [0.0, 1.0]
    unit: ratio
    user_editable: true
    rationale: Unbroken wall area is the primary support criterion; a wall that is mostly glazing is not a mountain.
  - key: w_structural
    default: 0.20
    range: [0.0, 1.0]
    unit: ratio
    user_editable: true
    rationale: Practitioners distinguish a load-bearing wall from a stud partition; the app can read this from the model.
  - key: w_length
    default: 0.20
    range: [0.0, 1.0]
    unit: ratio
    user_editable: true
    rationale: A longer wall gives more flanking coverage to whatever backs onto it.
  - key: w_no_traffic
    default: 0.20
    range: [0.0, 1.0]
    unit: ratio
    user_editable: true
    rationale: A wall with the room's main path running along it cannot function as a quiet back.
  - key: w_penalty_party
    default: 0.25
    range: [0.0, 1.0]
    unit: ratio
    user_editable: true
    rationale: Penalty when the wall is shared with a bathroom, stair, lift shaft, kitchen or neighbour's living space.
  - key: min_exterior_glazing_exempt_pct
    default: 40.0
    range: [10.0, 90.0]
    unit: pct
    user_editable: true
    rationale: Glazing fraction above which an exterior wall is disqualified as support regardless of its other scores.
score:
  weight: 6
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: annotate_room
    target: room
    transform: {emit: support_wall_overlay}
    cost: free
    effort: none
    reversible: true
    copy: This is the wall your bed, desk or sofa should have behind it — the solid, quiet one.
  - rank: 2
    action: move_object
    target: [sleep.bed.*, worksurface.desk.*, seating.sofa.*]
    transform: {backsToWall: room.support_wall_id, min_contact_pct: 0.7}
    cost: free
    effort: high_physical
    reversible: true
    copy: Turn the main piece of furniture so its back is against that wall.
  - rank: 3
    action: emit_rule_trigger
    target: FS-FORM-015
    transform: {when: min_support_wall_score_not_met}
    cost: free
    effort: none
    reversible: true
    copy: No wall here really qualifies, so we'll build you one instead.
conflicts_with: [ERG-CLR-012]
supersedes: []
requires_rules: []
tags: [interior, support, definitional, tortoise, signature_rule]
localization_notes: Structural flag availability varies by capture method; when unknown, set w_structural contribution to 0 rather than guessing.
```

#### Why — tradition

Form School's interior application treats the room as a miniature site: something must play the
tortoise. Practitioner consensus is that the support wall is the solid, structural, quiet one — not a
window wall, not a wall the door path runs along, and preferably not one shared with a bathroom, stair
or lift shaft, which are read as unstable or draining. This is the doctrinal basis for the near-universal
instruction to put a headboard, desk or sofa back against a solid wall, and it is where Form School and
the Compass School's command-position rules meet.

#### Why — psychology / physiology

The underlying mechanism is real and is refuge, not tradition: a solid back removes the need to monitor
a rear approach, which is measurably reflected in seat-choice behaviour (people preferentially occupy
seats with backs to walls and views of entrances in cafés, libraries and waiting rooms). The
bathroom/stair exclusion has an independent, mundane basis — plumbing stacks and stair cores are
genuine sources of intermittent noise and low-frequency structure-borne sound, which is a documented
sleep-disruption pathway. The claim that a stud partition supports less qi than a masonry wall has no
empirical basis.

#### Customer insight

Every room has one wall that works as a back: solid, structural, and out of the traffic. We find it for
you, and then almost every other suggestion in the room follows from it.

#### Failure modes / when to skip

When the only solid wall is unusable for reasons of clearance, radiator position or required door
swing, the ergonomic and safety rules win and FS-FORM-015 should fabricate support elsewhere. Skip in
rooms with fewer than three walls (open-plan zones) and route them to FS-FORM-015 directly. Do not
disqualify an exterior wall as support in cold climates purely on the shared-wall penalty; thermal
comfort at a bed head is owned by the comfort rules and may override.

---

### FS-FORM-015 — Fabricating support where the architecture denies it

```yaml
id: FS-FORM-015
title: Fabricate support when no wall qualifies as a mountain
system: feng_shui.form_school
group: interior_analogue
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, bedroom_guest, bedroom_child, home_office, home_office_shared, studio_apartment, loft, open_plan_combined, dorm_room, living_room, great_room]
  objects: [sleep.bed.*, worksurface.desk.*, seating.sofa.*, seating.armchair.*]
  requires_features: []
scope: object_placement
severity: medium
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let t = target
  if not backsToWall(t, min_contact_pct=p.min_wall_contact_pct):
     assert exists s in room.objects where
              isBehind(s, t)
              and distance(s, t) <= p.support_gap_max_m
              and s.height_m >= p.min_fabricated_support_height_m
              and s.width_m >= t.footprint.w * p.support_width_coverage_ratio
              and s.opacity >= p.min_support_opacity
              and s.anchored == true
     assert tipoverMoment(s) >= p.min_tipover_moment_nm
     forbid s.type in p.disallowed_support_types
params:
  - key: min_wall_contact_pct
    default: 0.6
    range: [0.2, 1.0]
    unit: ratio
    user_editable: true
    rationale: Fraction of the object's back that must touch a wall before it counts as wall-supported.
  - key: support_gap_max_m
    default: 0.30
    range: [0.0, 1.2]
    unit: m
    user_editable: true
    rationale: Gap between the furniture back and the fabricated support before the support stops reading as a back (about 12 in).
  - key: min_fabricated_support_height_m
    default: 1.10
    range: [0.6, 2.4]
    unit: m
    user_editable: true
    rationale: Height needed to sit above a seated shoulder line and above a lying occupant, roughly 43 in. Raise toward 1.4 m for a standing-height screen.
  - key: support_width_coverage_ratio
    default: 0.9
    range: [0.5, 1.5]
    unit: ratio
    user_editable: true
    rationale: How much of the furniture's width the support must span; a narrow panel behind a wide bed does not read as a mountain.
  - key: min_support_opacity
    default: 0.7
    range: [0.0, 1.0]
    unit: ratio
    user_editable: true
    rationale: Openwork shelving or a cane screen supports less than a solid back; below this the support is only partial credit.
  - key: min_tipover_moment_nm
    default: 200
    range: [50, 1000]
    unit: Nm
    user_editable: false
    rationale: Stability floor for anything placed at the head of a bed or behind a seat. Defers to the tip-over safety rules, which own the real values.
  - key: disallowed_support_types
    default: [storage.shelf.open_tall_unanchored, decor.mirror.freestanding, plants.tree.potted_large]
    range: [any_subset_of_object_types]
    unit: enum_list
    user_editable: true
    rationale: Items that look like support but are unstable, reflective at head height, or drop debris.
score:
  weight: 7
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: sleep.headboard.upholstered_tall
    transform: {attach_to: sleep.bed.*, height_m: 1.2, width: match_bed_plus_0_05}
    cost: medium
    effort: low
    reversible: true
    copy: A tall solid headboard is the single best substitute for a wall behind a bed.
  - rank: 2
    action: add_object
    add: storage.console.low_back
    transform: {position: behind(target), anchored: true, height_m: 1.1}
    cost: medium
    effort: low
    reversible: true
    copy: A console or low bookcase behind a floating sofa or desk gives it a back and a surface at the same time.
  - rank: 3
    action: add_object
    add: softgoods.screen.folding_solid
    transform: {position: behind(target), height_m: 1.5, anchored: true}
    cost: low
    effort: low
    reversible: true
    copy: A folding screen is the renter's version — no fixings, fully reversible, and it works.
  - rank: 4
    action: add_object
    add: softgoods.curtain.floor_to_ceiling
    transform: {position: behind(target), track: ceiling_mounted, opacity: blackout}
    cost: low
    effort: medium
    reversible: true
    copy: A heavy floor-to-ceiling curtain behind the bed reads as a soft wall and helps with sound too.
conflicts_with: [SAFE-TIP-001, SAFE-EGR-003]
supersedes: []
requires_rules: [FS-FORM-014]
tags: [interior, support, remedy_rule, renter_friendly, signature_rule]
localization_notes: none
```

#### Why — tradition

Form School's remedial logic accepts substitution: if the landform does not provide a tortoise, you
build one. At room scale this is the doctrinal source of the headboard, the console behind a floating
sofa, the bookcase behind a desk and the screen behind a bed in a studio. Practitioners are consistent
that the substitute must be *solid, stable and at least shoulder-high when seated* — an open-frame
shelving unit or a low rail is held to be insufficient, and a mirror used as a back is considered
actively wrong because it returns rather than holds.

#### Why — psychology / physiology

The refuge mechanism transfers cleanly and is the strongest evidence-adjacent content in this file: a
physical back removes rear-approach monitoring, and seat-selection studies consistently show people
choose backed, wall-adjacent positions. A tall upholstered headboard or heavy curtain additionally adds
real absorption at the head of the bed, lowering mid-frequency reverberation and speech intelligibility
from adjacent space — a modest but genuine sleep-environment improvement. What has no support is any
dose–response claim, such as a specific height being the threshold at which the benefit appears.

#### Customer insight

If your bed, desk or sofa has to float in the room, give it a back you can build: a tall headboard, a
console, a bookcase, or even a heavy curtain on a ceiling track. It's the cheapest change in this whole
app that people actually feel.

#### Failure modes / when to skip

Anything placed behind a bed or a seat must satisfy the tip-over and anchoring safety rules first; those
are `blocking` and this rule is not. Never fabricate support across an egress path or in front of a
required window opening. In very small rooms a fabricated back may eat the clearance the ergonomic
minimums require — then the ergonomic minimum wins and this rule should report as unachievable rather
than propose a squeeze. Skip for cribs and toddler beds, where nothing tall, soft or tippable belongs at
the head.

---

### FS-FORM-016 — Interior bright hall: clear floor immediately inside the entry

```yaml
id: FS-FORM-016
title: Interior bright hall — clear, lit floor just inside the front door
system: feng_shui.form_school
group: ming_tang
version: 1
status: active
applies_to:
  rooms: [entry_foyer, mudroom, porch_entry, hallway_corridor, studio_apartment, open_plan_combined]
  objects: []
  requires_features: []
  min_room_area_m2: 1.5
scope: room_composition
severity: high
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let d = room.primaryEntryDoor
  let z = zoneInFrontOf(d, depth_m=p.inner_ming_tang_depth_m, width=d.width_m * p.inner_ming_tang_width_ratio)
  assert occupancyRatio(z) <= p.max_inner_ming_tang_occupancy
  assert doorSwingClear(d) == true
  assert pathWidth(d.centroid, room.onwardExit) >= p.min_onward_path_width_m
  assert illuminanceAt(z.centroid) >= p.min_inner_illuminance_lux
  assert isovistArea(pointInFrontOf(d, 1.0)) >= p.min_entry_isovist_m2
  forbid exists o in room.objects where overlaps(o, z) and o.height_m >= p.blocking_height_m
params:
  - key: inner_ming_tang_depth_m
    default: 1.5
    range: [0.6, 4.0]
    unit: m
    user_editable: true
    rationale: Depth of clear floor inside the door (about 5 ft), enough to stand, turn and set a bag down.
  - key: inner_ming_tang_width_ratio
    default: 1.6
    range: [1.0, 3.0]
    unit: ratio
    user_editable: true
    rationale: Clear zone is wider than the door leaf so two people can pass at the threshold.
  - key: max_inner_ming_tang_occupancy
    default: 0.15
    range: [0.0, 0.5]
    unit: ratio
    user_editable: true
    rationale: Fraction of the inner bright hall floor that may be occupied by furniture before it stops reading as open.
  - key: min_onward_path_width_m
    default: 0.9
    range: [0.7, 1.5]
    unit: m
    user_editable: true
    rationale: Clear onward route from the door. Defers to egress and accessibility minimums, which vary by jurisdiction.
    jurisdiction_varies: true
  - key: min_inner_illuminance_lux
    default: 100
    range: [30, 300]
    unit: lux
    user_editable: true
    rationale: App default for an entry that reads as bright and supports key-finding and face recognition. Not a code value.
  - key: min_entry_isovist_m2
    default: 6.0
    range: [2.0, 40.0]
    unit: m2
    user_editable: true
    rationale: Visible floor area from a step inside the door; a wall a metre away gives almost none.
  - key: blocking_height_m
    default: 1.2
    range: [0.6, 2.1]
    unit: m
    user_editable: true
    rationale: Height above which an object inside the door blocks the view rather than furnishing the space.
score:
  weight: 8
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: remove_object
    target: [storage.shoe_rack.*, storage.box.*, softgoods.laundry_basket.*]
    transform: {from_zone: inner_ming_tang}
    cost: free
    effort: low
    reversible: true
    copy: Clear the metre and a half just inside the door. It is the one piece of floor in the house that earns its keep by staying empty.
  - rank: 2
    action: move_object
    target: storage.*
    transform: {to: wall_adjacent_outside_zone, max_depth_m: 0.35}
    cost: free
    effort: low
    reversible: true
    copy: Shift storage to a shallow run against the side wall so the middle of the entry stays open.
  - rank: 3
    action: add_object
    add: lighting.ceiling.flush_mount
    transform: {position: above(inner_ming_tang), ccd_k: 2700, illuminance_lux: 120}
    cost: low
    effort: medium
    reversible: true
    copy: One good warm light over the entry makes a small hallway read as a bright hall.
  - rank: 4
    action: add_object
    add: decor.mirror.wall
    transform: {position: side_wall_not_facing_door, avoid: direct_opposite_of_door}
    cost: low
    effort: low
    reversible: true
    copy: A mirror on a side wall widens a narrow entry — just not directly facing the door, which tradition says bounces arriving energy straight back out.
conflicts_with: [SAFE-EGR-003]
supersedes: []
requires_rules: []
tags: [interior, ming_tang, entry, circulation, signature_rule]
localization_notes: Mudroom-driven storage loads in cold and wet climates make the occupancy target hard; raise max_inner_ming_tang_occupancy rather than nagging.
```

#### Why — tradition

BTB and modern classical practice both extend the bright hall inward: the *nei ming tang* (inner bright
hall) is the open floor immediately inside the front door, and it is treated as the reservoir where
arriving qi settles before distributing through the home. An entry that opens straight onto a wall, a
stair, a bathroom door or a wall of storage is the most frequently cited interior defect in popular
feng shui, and the remedy vocabulary (clear the floor, light it, widen it with a mirror on a *side*
wall) is standard. The caution about a mirror directly opposite the door is classical: it is held to
reflect incoming qi back out.

#### Why — psychology / physiology

Real and well-described. The entry is a transition zone in Alexander's pattern language sense, and a
threshold with adequate depth, light and onward visibility measurably supports arrival behaviour —
putting things down, orienting, and recognising who else is there. Isovist area at a threshold is a
space-syntax measure that correlates with perceived spaciousness and ease of wayfinding. Entry
illuminance also has an unglamorous safety role: the transition from bright outdoors to a dark hallway
takes the eye time to adapt, and entry-level falls are a recognised injury pattern for older adults.

#### Customer insight

The first metre and a half inside your door does a lot of work — it's where you land, put things down
and see who's home. Feng shui calls it the inner bright hall and asks you to keep it open and lit. In
practice that usually means the shoe pile moves sideways.

#### Failure modes / when to skip

Egress and accessibility clearances outrank this rule and must be reported as the winner when they
conflict. Do not fire the occupancy assertion in dedicated mudrooms, whose whole function is storage —
apply it to the walking line only. In micro-apartments where the door opens directly into the living
space, reduce `inner_ming_tang_depth_m` rather than reporting a failure the user cannot fix.

---

### FS-FORM-017 — Room-scale four animals for the primary seat

```yaml
id: FS-FORM-017
title: Room-scale four animals around the primary seat or bed
system: feng_shui.form_school
group: interior_analogue
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, home_office, home_office_shared, study_library, living_room, family_room, great_room, studio_apartment, media_room, dorm_room]
  objects: [sleep.bed.*, worksurface.desk.*, seating.sofa.*, seating.armchair.*, seating.desk_chair.*]
  requires_features: []
scope: object_placement
severity: medium
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let t = target
  let back  = rearSupportQuality(t)        # 0..1 from wall contact, headboard, or fabricated support
  let front = clamp(isovistArea(t.seatedEyePoint) / p.front_isovist_target_m2, 0, 1)
  let left  = clamp(flankEnclosure(t, side="left")  / p.flank_enclosure_target, 0, 1)
  let right = clamp(flankEnclosure(t, side="right") / p.flank_enclosure_target, 0, 1)
  let seat_armchair = p.w_back*back + p.w_front*front + p.w_left*left + p.w_right*right
  prefer seat_armchair >= p.min_seat_armchair_score
  assert back >= p.min_rear_support_quality
  prefer lineOfSight(t.seatedEyePoint, room.primaryDoor.centroid) == true
params:
  - key: front_isovist_target_m2
    default: 12.0
    range: [3.0, 60.0]
    unit: m2
    user_editable: true
    rationale: Visible floor area ahead of the seat that scores a full phoenix at room scale.
  - key: flank_enclosure_target
    default: 0.5
    range: [0.1, 1.0]
    unit: ratio
    user_editable: true
    rationale: Normalised lateral enclosure (walls, furniture, planting within reach-plus) that scores a full armrest.
  - key: min_seat_armchair_score
    default: 0.55
    range: [0.2, 0.95]
    unit: ratio
    user_editable: true
    rationale: Pass mark for the room-scale composite.
  - key: min_rear_support_quality
    default: 0.4
    range: [0.0, 1.0]
    unit: ratio
    user_editable: true
    rationale: Hard floor on rear support; the tortoise is not tradeable against the other three.
  - key: w_back
    default: 0.45
    range: [0.1, 0.8]
    unit: ratio
    user_editable: true
    rationale: Rear support dominates at room scale even more than at site scale.
  - key: w_front
    default: 0.30
    range: [0.1, 0.7]
    unit: ratio
    user_editable: true
    rationale: Open outlook from the seat.
  - key: w_left
    default: 0.125
    range: [0.0, 0.4]
    unit: ratio
    user_editable: true
    rationale: Left flank enclosure.
  - key: w_right
    default: 0.125
    range: [0.0, 0.4]
    unit: ratio
    user_editable: true
    rationale: Right flank enclosure.
score:
  weight: 7
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: target
    transform: {to_zone: rear_supported_with_open_outlook, keep: lineOfSight_to_door}
    cost: free
    effort: high_physical
    reversible: true
    copy: Move the seat so it has something solid behind it and the open part of the room in front.
  - rank: 2
    action: add_object
    add: storage.bookcase.low
    transform: {position: beside(target, weakest_flank), height_m: 0.9, anchored: true}
    cost: medium
    effort: low
    reversible: true
    copy: A low bookcase or cabinet on the open side gives the seat an armrest without closing the room in.
  - rank: 3
    action: add_object
    add: plants.tree.potted_large
    transform: {position: beside(target, weakest_flank), height_m: 1.4}
    cost: low
    effort: low
    reversible: true
    copy: A tall plant works as a soft armrest on the exposed side.
  - rank: 4
    action: remove_object
    target: storage.*
    transform: {from_zone: front_of(target, depth_m: 2.0)}
    cost: free
    effort: low
    reversible: true
    copy: Clear the floor in front of the seat — the outlook is half of what makes the position feel settled.
conflicts_with: [ERG-CLR-012, SAFE-EGR-003]
supersedes: []
requires_rules: [FS-FORM-014]
tags: [interior, four_animals, seat, composite, prospect_refuge]
localization_notes: none
```

#### Why — tradition

The armchair is applied recursively in practice: what is true of the site is true of the room and of the
chair. Practitioners routinely assess a bed or desk for a solid back, an open front, and something
steadying to each side, and the classical *taishi yi* armchair is literally the physical model. This
rule is the Form School half of what the Compass School files handle as command position: Form School
supplies the enclosure geometry, command position supplies the door sightline and diagonal-from-door
requirement.

#### Why — psychology / physiology

This is the best-supported traditional configuration in the library. Prospect–refuge (Appleton, 1975)
predicts exactly this combination, and seat-choice field observation consistently finds people taking
backed, laterally sheltered positions with a view of the entrance. Lateral enclosure also has a
concrete territoriality function (Altman's work on privacy regulation and personal space) — a defined
edge marks the seat as someone's. The limits of the evidence should be stated: it covers preference,
seat choice and perceived comfort, not productivity or health outcomes.

#### Customer insight

Your bed or your desk wants to feel like a good armchair: something solid behind, something steady at
each elbow, and open space in front. It is the arrangement most people pick instinctively in a café —
we just make it deliberate at home.

#### Failure modes / when to skip

Never at the cost of the ergonomic clearance minimums or an egress path. In rooms below about 7 m² the
composite is usually unachievable and the engine should fall back to FS-FORM-015 (rear support only).
Skip for media rooms and home theatres where the display position, not enclosure, governs seating — and
for wheelchair users, where turning-circle requirements outrank flank enclosure entirely.

---

### FS-FORM-018 — Interior dragon–tiger flanking at the primary seat

```yaml
id: FS-FORM-018
title: Flanking objects beside the primary seat (interior dragon and tiger)
system: feng_shui.form_school
group: interior_analogue
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, bedroom_guest, home_office, living_room, family_room, studio_apartment]
  objects: [sleep.bed.*, worksurface.desk.*, seating.sofa.*]
  requires_features: []
scope: object_placement
severity: low
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let t = target
  let L = nearestFlankObject(t, side="left",  max_distance_m=p.flank_reach_m)
  let R = nearestFlankObject(t, side="right", max_distance_m=p.flank_reach_m)
  prefer L != null and R != null
  penalize (L == null) != (R == null), weight=2            # one side flanked, one bare
  if L != null and R != null:
     prefer abs(L.height_m - R.height_m) <= p.flank_height_delta_max_m
     prefer L.height_m <= rearSupportHeight(t) * p.flank_to_back_ratio
     prefer R.height_m <= rearSupportHeight(t) * p.flank_to_back_ratio
  forbid exists f in [L, R] where f.type in p.disallowed_flank_types
params:
  - key: flank_reach_m
    default: 0.9
    range: [0.3, 2.0]
    unit: m
    user_editable: true
    rationale: How far to each side an object still reads as an armrest (about 3 ft).
  - key: flank_height_delta_max_m
    default: 0.25
    range: [0.0, 1.0]
    unit: m
    user_editable: true
    rationale: Height mismatch tolerated between the two flanking objects before the pair reads as lopsided (about 10 in).
  - key: flank_to_back_ratio
    default: 0.8
    range: [0.3, 1.2]
    unit: ratio
    user_editable: true
    rationale: Flanks stay below the back so the armchair silhouette holds.
  - key: require_matched_pair
    default: false
    range: [true, false]
    unit: bool
    user_editable: true
    rationale: Strict practitioners want a matched pair of nightstands; many designers do not. Off by default.
  - key: disallowed_flank_types
    default: [decor.mirror.freestanding, storage.shelf.open_tall_unanchored, electronics.speaker.tower]
    range: [any_subset_of_object_types]
    unit: enum_list
    user_editable: true
    rationale: Items that are reflective at head height, unstable, or acoustically aggressive next to a sleeper's ear.
score:
  weight: 3
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: tables.nightstand.pair
    transform: {position: flanking(target), height_m: match_mattress_top_plus_0_05}
    cost: medium
    effort: low
    reversible: true
    copy: A nightstand on each side balances the bed — and gives both occupants somewhere to put a glass of water.
  - rank: 2
    action: add_object
    add: storage.cabinet.low
    transform: {position: bare_side_of(target), height_m: match_opposite_flank}
    cost: medium
    effort: low
    reversible: true
    copy: Where one side is against a wall, a slim cabinet or shelf on the open side still evens things up.
  - rank: 3
    action: move_object
    target: target
    transform: {offset: centre_between_flanks}
    cost: free
    effort: medium
    reversible: true
    copy: Centring the bed between its two sides is often all this needs.
conflicts_with: [ERG-CLR-012, ACC-ADA-004]
supersedes: []
requires_rules: [FS-FORM-017]
tags: [interior, dragon, tiger, symmetry, bedroom]
localization_notes: none
```

#### Why — tradition

The flanking requirement at room scale is the origin of one of the most recognisable feng shui
instructions: a matched pair of nightstands either side of the bed. The doctrinal reading is that the
bed is the site, the headboard wall is the tortoise, and the two nightstands are dragon and tiger,
holding the position and — in relationship-focused practice — giving each partner equal standing. A bed
pushed against a side wall with a nightstand on only one side is treated as unbalanced. This is widely
taught in both BTB and classical-derived popular practice.

#### Why — psychology / physiology

The symmetry argument has a genuine compositional basis (bilateral symmetry about a dominant object is
a reliable preference effect in visual composition research), and the *practical* argument is stronger
still: two-sided access means both occupants can reach a light switch, a glass and a phone without
climbing over anyone, which is a real sleep-continuity factor for couples with mismatched schedules.
The relationship-equity interpretation has no empirical support; treat it as a metaphor the tradition
finds meaningful rather than a mechanism.

#### Customer insight

Feng shui likes both sides of the bed to be held — classically with a matching pair of nightstands. The
practical version is simpler: if you share the bed, you should each be able to reach a lamp and a glass
of water without climbing over anyone.

#### Failure modes / when to skip

Do not fire in rooms too narrow for two-sided bed access; the ergonomic minimum clearance wins and a
one-sided bed is the correct answer. Suppress entirely for wheelchair users, where transfer-side
clearance governs. Never recommend a matched pair where it would block a radiator, an outlet the user
needs, or a required door swing. Off by default for children's rooms, where bed-against-wall is often
the safer arrangement.

---

### FS-FORM-019 — Water in the bright hall: visible water ahead of facing

```yaml
id: FS-FORM-019
title: Water visible in front of the facing side
system: feng_shui.form_school
group: water
version: 1
status: active
applies_to:
  rooms: [garden_yard, patio_deck, balcony, roof_terrace]
  objects: [outdoor.water_feature.*]
  requires_features: []
scope: site
severity: low
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let w = nearestSurrounding(class=water, relation="front")
  prefer w != null
  if w != null:
     prefer w.distance_m >= p.min_water_standoff_m
     prefer w.distance_m <= p.max_water_relevance_m
     prefer waterVisibleFrom(site.facingEntry.eyePoint) == true
     prefer w.condition in [clean, flowing]
     penalize w.condition == stagnant, weight=3
     penalize (w.class == water and relationOf(w.bearing_deg, site) == "back"), weight=2   # see FS-FORM-021
params:
  - key: min_water_standoff_m
    default: 3.0
    range: [0.5, 30.0]
    unit: m
    user_editable: true
    rationale: Minimum distance from the building. Water immediately against a wall is a damp and mosquito problem, not an auspicious feature.
  - key: max_water_relevance_m
    default: 500
    range: [20, 5000]
    unit: m
    user_editable: true
    rationale: Beyond this the water no longer reads as part of the site's bright hall.
  - key: substitute_water_allowed
    default: true
    range: [true, false]
    unit: bool
    user_editable: true
    rationale: Whether a pond, bowl, fountain or reflecting pool may substitute for natural water. Most practitioners accept substitutes; strict landform readers do not.
  - key: min_feature_water_volume_l
    default: 20
    range: [2, 2000]
    unit: l
    user_editable: true
    rationale: Below this a water feature reads as an ornament rather than as water. App default.
score:
  weight: 3
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: outdoor.water_feature.recirculating_bowl
    transform: {position: in_zone(ming_tang), distance_m: 3.0, flow: toward_building}
    cost: medium
    effort: medium
    reversible: true
    copy: A small recirculating bowl or fountain in the forecourt is the usual stand-in where there is no natural water, with the flow angled gently toward the house.
  - rank: 2
    action: maintain_object
    target: outdoor.water_feature.*
    transform: {require: [circulation_on, debris_clear, no_standing_stagnation]}
    cost: low
    effort: low
    reversible: true
    copy: Water only counts if it is clean and moving — a green, still feature is worse than none in traditional terms.
  - rank: 3
    action: annotate_site
    target: site
    transform: {emit: advisory_no_water_available}
    cost: free
    effort: none
    reversible: true
    copy: No water nearby and nowhere sensible to put any? That is common and not a problem we'll keep nagging you about.
conflicts_with: [SAFE-CHILD-007, SAFE-WATER-002]
supersedes: []
requires_rules: [FS-FORM-004]
tags: [site, water, ming_tang, feature]
localization_notes: In water-scarce and drought-restricted regions, recommend a dry water analogue (gravel stream, reflective glass) rather than an evaporating feature; note the substitution honestly.
```

#### Why — tradition

Water is half the name. The *Zangshu* states that qi rides the wind and scatters but is held where it
meets water, which makes water the collector of qi and places it, ideally, in front — in or beyond the
bright hall, visible from the entry, clean and gently moving. San He water methods develop this into a
detailed system of incoming and outgoing water directions. All schools agree on the negative case:
stagnant, foul or hidden water in front of a dwelling is a defect, not an asset, and water hard against
the building is not "water in the bright hall" at all.

#### Why — psychology / physiology

There is real evidence for water views, and it should be stated at its actual strength. Blue-space
research consistently finds visible water raises scenic preference and self-reported restoration, and
Ulrich's 1984 *Science* study showing faster recovery in patients with a natural window view is the
classic demonstration that view content can matter clinically. What the evidence does not show is that
water in a particular *direction* matters, or that a small ornamental feature delivers blue-space
benefits. Stagnant water, on the other hand, has an unambiguous negative basis: mosquito breeding
habitat and, for some features, Legionella risk.

#### Customer insight

Feng shui puts water in front of the home — clean, moving, and visible from the door. Modern research
does back one part of this: people find visible water calming and restorative. A small recirculating
bowl is the usual stand-in, as long as you actually keep it clean.

#### Failure modes / when to skip

Child-drowning safety owns any open water on a property with young children and outranks this rule
absolutely; never propose an unfenced feature where `Person.age_band` includes toddler or infant. Skip
in drought-restricted jurisdictions and propose a dry analogue instead. Do not recommend water within
`min_water_standoff_m` of a foundation, below-grade wall or timber structure.

---

### FS-FORM-020 — Water form: embracing jade belt versus reverse bow

```yaml
id: FS-FORM-020
title: Embracing water or road (jade belt) versus reverse bow
system: feng_shui.form_school
group: water
version: 1
status: active
applies_to:
  rooms: []
  objects: []
  requires_features: []
scope: site
severity: medium
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  forEach c in site.surroundings where c.class in [water, road] and c.curved == true:
    let side = curveSideOf(site, c)      # inner | outer
    if side == inner and c.distance_m <= p.curve_relevance_m:
        prefer true                       # yu dai shui: jade belt embracing
    if side == outer and c.distance_m <= p.curve_relevance_m
       and curveRadius(c) <= p.max_reverse_bow_radius_m
       and subtendedArc(c, from=site.facingEntry) >= p.min_reverse_bow_arc_deg:
        penalize true, weight=(c.class == road ? p.w_reverse_bow_road : p.w_reverse_bow_water)
params:
  - key: curve_relevance_m
    default: 60
    range: [5, 500]
    unit: m
    user_editable: true
    rationale: Distance within which a curve's geometry is read as acting on the site.
  - key: max_reverse_bow_radius_m
    default: 200
    range: [20, 2000]
    unit: m
    user_editable: true
    rationale: Above this radius the curve is too gentle to read as a bow. App operationalization.
  - key: min_reverse_bow_arc_deg
    default: 30
    range: [10, 120]
    unit: deg
    user_editable: true
    rationale: How much of the bow must be presented to the site before the formation counts.
  - key: w_reverse_bow_road
    default: 4
    range: [0, 10]
    unit: weight
    user_editable: true
    rationale: Penalty weight for a road on the outer curve, which also carries a real run-off-road and headlight-sweep exposure.
  - key: w_reverse_bow_water
    default: 3
    range: [0, 10]
    unit: weight
    user_editable: true
    rationale: Penalty weight for a watercourse on the outer curve, which is the bank that erodes.
score:
  weight: 5
  curve: step
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: plants.hedge.dense_curved
    transform: {position: along_boundary(facing_the_bow), min_height_m: 1.8, form: convex_toward_bow}
    cost: medium
    effort: medium
    reversible: true
    copy: A dense curved hedge or berm along the boundary facing the bend is the standard remedy — it also happens to be a real barrier.
  - rank: 2
    action: add_object
    add: outdoor.wall.low_masonry
    transform: {position: along_boundary(facing_the_bow), height_m: 0.9}
    cost: high
    effort: high_physical
    reversible: false
    copy: On a fast bend, a low masonry wall behind the planting is worth the money for reasons that have nothing to do with feng shui.
  - rank: 3
    action: relocate_function
    target: room_program
    transform: {avoid: [bedroom_child, bedroom_primary], in: rooms_facing_the_bow}
    cost: free
    effort: high_physical
    reversible: true
    copy: Keep bedrooms off the side that faces the bend, and put storage or a utility room there instead.
  - rank: 4
    action: modify_object
    target: softgoods.curtain.*
    transform: {in: rooms_facing_the_bow, opacity: blackout}
    cost: low
    effort: low
    reversible: true
    copy: Blackout curtains on that side deal with the headlights that sweep across the glass every time a car takes the bend.
conflicts_with: []
supersedes: []
requires_rules: []
tags: [site, water, road, reverse_bow, fan_gong_sha, sha_qi]
localization_notes: none
```

#### Why — tradition

A watercourse or road that curves *around* the site, so the site sits on the inside of the bend, is the
auspicious *yu dai shui* (玉帶水, "jade belt water") — the water embraces and holds qi. The same curve
with the site on the *outside* of the bend is *fan gong sha* (反弓煞, "reverse bow"), described in
practitioner literature as a drawn bow aimed at the dwelling, and treated as one of the more serious
exterior afflictions. The reading transfers directly from watercourses to roads in modern practice,
since a road is read as a water channel carrying movement and qi.

#### Why — psychology / physiology

Both halves have independent physical support, which makes this one of the better tradition/evidence
convergences in the file. On the outside of a river bend, flow velocity and shear are highest — that is
the *cut bank*, where erosion concentrates; the inside of the bend is the depositional point bar. So
building on the outer curve of a watercourse genuinely is the eroding side. On the outside of a road
bend, vehicles that lose control depart tangentially toward the outer verge, and headlight beams sweep
across the outer-curve frontage rather than along it — a real glare and sleep-disruption pathway. The
traditional language of a "bow aimed at the house" describes a real vector.

#### Customer insight

If the road or river bends around your home, you are on the good side — tradition calls it a jade belt.
If it bends away, you are on the outside of the curve, which is the side a river erodes and the side a
car leaves the road on. A dense hedge or a low wall along that boundary is the fix, and it is worth
doing for both reasons.

#### Failure modes / when to skip

Skip for gentle curves above `max_reverse_bow_radius_m`, which describe most suburban streets and would
otherwise flood the report. Do not treat a canal, culvert or drainage swale as "water" for the
auspicious case — route those to the nuisance rules. Where real flood or erosion risk exists, the
finding belongs to the water-safety rules and this rule should defer and say so.

---

### FS-FORM-021 — Water at the sitting side: pool or tank behind the house

```yaml
id: FS-FORM-021
title: Water on the sitting side (behind the dwelling)
system: feng_shui.form_school
group: water
version: 1
status: active
applies_to:
  rooms: [garden_yard, patio_deck]
  objects: [outdoor.pool.*, outdoor.water_feature.*, outdoor.tank.water]
  requires_features: []
scope: site
severity: low
confidence: contested
evidence_class: traditional
belief_gated: true
predicate: |
  forEach w in site.surroundings where w.class == water and relationOf(w.bearing_deg, site) == "back":
    if w.distance_m <= p.rear_water_relevance_m and w.area_m2 >= p.min_rear_water_area_m2:
       penalize true, weight=p.w_rear_water
       if supportMass(relation="back") == null:
          penalize true, weight=p.w_rear_water_no_support   # water replaces the mountain entirely
params:
  - key: rear_water_relevance_m
    default: 30
    range: [2, 300]
    unit: m
    user_editable: true
    rationale: Distance within which rear water is read as replacing the tortoise.
  - key: min_rear_water_area_m2
    default: 4.0
    range: [0.5, 500.0]
    unit: m2
    user_editable: true
    rationale: Below this the water is an ornament and the doctrine is not usually applied.
  - key: w_rear_water
    default: 2
    range: [0, 8]
    unit: weight
    user_editable: true
    rationale: Base penalty for water on the sitting side.
  - key: w_rear_water_no_support
    default: 3
    range: [0, 8]
    unit: weight
    user_editable: true
    rationale: Additional penalty when there is no other rear mass, so the water is the only thing behind the house.
  - key: allow_rear_water_with_screen
    default: true
    range: [true, false]
    unit: bool
    user_editable: true
    rationale: Whether a solid screen or planting between house and rear water is accepted as a remedy. Practitioners differ.
score:
  weight: 3
  curve: step
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: plants.hedge.evergreen_row
    transform: {position: between(building_rear, rear_water), min_height_m: 1.8}
    cost: medium
    effort: medium
    reversible: true
    copy: A hedge between the house and the pool restores something solid behind the building while keeping the water.
  - rank: 2
    action: add_object
    add: outdoor.pergola.solid_roof
    transform: {position: building_rear_elevation, depth_m: 2.4}
    cost: high
    effort: high_physical
    reversible: false
    copy: A solid-roofed structure across the back gives the house a built edge between it and the water.
  - rank: 3
    action: annotate_site
    target: site
    transform: {emit: advisory_contested_doctrine}
    cost: free
    effort: none
    reversible: true
    copy: Practitioners disagree about pools behind the house — some schools read water behind as unstable footing, others as fine if the house is well backed otherwise. We'll flag it, not alarm you.
conflicts_with: [FS-FORM-019]
supersedes: []
requires_rules: [FS-FORM-002]
tags: [site, water, pool, contested_doctrine, sitting_side]
localization_notes: Rear pools are the norm in many suburban markets; presentation must be measured rather than alarming.
```

#### Why — tradition

Classical Form School wants **mountain behind, water in front** — *shan* at the sitting side, *shui*
at the facing side. Water directly behind the dwelling therefore substitutes fluid for solid where the
tortoise should be, and a common practitioner reading is of unstable footing and no backing. This is
genuinely contested: San He water practitioners will accept and even seek certain rear water
configurations depending on the water's direction of entry and exit, and many modern practitioners
treat a rear pool as neutral where the house is otherwise well backed. Marked `contested` for that
reason.

#### Why — psychology / physiology

`No direct empirical support; mechanism is plausible but untested.` No research bears on water behind a
dwelling as such. The only real adjacent effects are unromantic and cut both ways: a rear pool is a
drowning hazard requiring compliant fencing, a source of reflected light and noise into rear rooms, and
a humidity and chlorine-exposure source near the rear envelope — while also being the single most
valued recreational feature on many properties.

#### Customer insight

Tradition prefers something solid behind the house and water in front, so a pool directly behind gets a
gentle flag rather than a red one — schools disagree about it, and nobody is suggesting you fill in your
pool. A hedge or pergola between house and water satisfies most readings.

#### Failure modes / when to skip

Pool-fencing and drowning-prevention rules outrank everything here. Never suggest removing or relocating
a pool — cost and reversibility make it a non-remedy. Suppress when the property's rear mass score
already passes FS-FORM-002, since the doctrine's concern is then already answered. Off by default when
the user's strictness is `relaxed`.

---

### FS-FORM-022 — Direction of flow: incoming water visible, outgoing concealed

```yaml
id: FS-FORM-022
title: Direction of water flow — incoming in view, outgoing out of sight
system: feng_shui.form_school
group: water
version: 1
status: active
applies_to:
  rooms: []
  objects: [outdoor.water_feature.*, outdoor.pool.*]
  requires_features: []
scope: site
severity: low
confidence: tradition
evidence_class: traditional
belief_gated: true
predicate: |
  forEach w in site.surroundings where w.class == water and w.flowing == true
                                   and w.distance_m <= p.flow_relevance_m:
    let inflow  = flowEntryPoint(w)
    let outflow = flowExitPoint(w)
    prefer lineOfSight(site.facingEntry.eyePoint, inflow) == true
    prefer lineOfSight(site.facingEntry.eyePoint, outflow) == false
    penalize (alignedWithin(flowBearing(w), bearingTo(site.facingEntry, outflow), tol_deg=p.flow_aim_tol_deg)
              and lineOfSight(site.facingEntry.eyePoint, outflow)), weight=2
  forEach f in site.objects where f.type matches outdoor.water_feature.*:
    prefer alignedWithin(f.flow_bearing_deg, bearingTo(f, site.facingEntry), tol_deg=p.feature_flow_tol_deg)
params:
  - key: flow_relevance_m
    default: 200
    range: [10, 2000]
    unit: m
    user_editable: true
    rationale: Distance within which a watercourse's flow direction is assessed.
  - key: flow_aim_tol_deg
    default: 20
    range: [5, 60]
    unit: deg
    user_editable: true
    rationale: Angular tolerance for judging that water is visibly flowing away from the entry.
  - key: feature_flow_tol_deg
    default: 45
    range: [10, 90]
    unit: deg
    user_editable: true
    rationale: Tolerance for a garden feature's flow being "toward the house". Practitioner guidance is directional, not precise.
score:
  weight: 2
  curve: step
  partial_credit: true
remedies:
  - rank: 1
    action: modify_object
    target: outdoor.water_feature.*
    transform: {set_flow: toward(site.facingEntry)}
    cost: free
    effort: low
    reversible: true
    copy: Turn a fountain or spill feature so the water runs toward the house rather than away from it — a two-minute change that most traditional readings care about.
  - rank: 2
    action: add_object
    add: plants.shrub.screening
    transform: {position: at(outflow_sightline), min_height_m: 1.2}
    cost: low
    effort: low
    reversible: true
    copy: Screening the point where water leaves the property is the classical remedy: incoming in view, outgoing out of sight.
  - rank: 3
    action: annotate_site
    target: site
    transform: {emit: advisory_unmodifiable_watercourse}
    cost: free
    effort: none
    reversible: true
    copy: You cannot redirect a river. Where the flow is fixed, we note it and move on.
conflicts_with: []
supersedes: []
requires_rules: [FS-FORM-019]
tags: [site, water, flow, san_he, advisory_leaning]
localization_notes: Detailed water-direction formulas belong to the San He / water-method compass files; this rule only covers the Form School visibility principle.
```

#### Why — tradition

Form School reads flowing water as carrying qi and, by extension, wealth: water arriving in view brings
qi to the bright hall, and water seen draining away is read as wealth visibly leaving. The practical
formula practitioners use is "see the water come, do not see it go" — the inflow should be visible from
the entry, the outflow screened. Garden features are then oriented so the spill runs toward the
building. The elaborate directional water formulas (which mountain the water should enter and exit on)
belong to San He and Xuan Kong compass methods, not to Form School, and are deliberately out of scope
here.

#### Why — psychology / physiology

`No direct empirical support; mechanism is plausible but untested.` There is no mechanism by which flow
direction relative to a dwelling would affect occupants. The honest framing for the user is that this
is symbolic reasoning — water as wealth — and the reason it is worth including is that it costs nothing
to satisfy: rotating a fountain is free, and users who hold the belief get the benefit of acting on it.

#### Customer insight

Traditional practice likes to see water arriving and not see it leaving — so garden fountains get
pointed toward the house. This is symbolism rather than physics, but it takes two minutes and it costs
nothing, so we mention it.

#### Failure modes / when to skip

Never propose modifying a public watercourse, culvert or drainage system. Do not let this rule override
drainage design: positive fall away from the building is a building-performance requirement and always
wins over a symbolic inflow direction. Mark advisory when the only water present is a drainage channel
rather than a feature.

---

### FS-FORM-023 — Front obstruction closing the bright hall

```yaml
id: FS-FORM-023
title: Obstruction directly ahead closing the bright hall
system: feng_shui.form_school
group: ming_tang
version: 1
status: active
applies_to:
  rooms: []
  objects: []
  requires_features: []
scope: site
severity: high
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let e = site.facingEntry
  forEach o in site.surroundings where relationOf(o.bearing_deg, site) == "front":
    let elev = elevationAngle(e.eyePoint, o)
    if o.distance_m <= p.front_obstruction_relevance_m and elev >= p.max_front_elevation_deg:
       penalize true, weight=p.w_front_obstruction
       if alignedWithin(o.bearing_deg, site.facing_bearing_deg, tol_deg=p.front_aim_tol_deg):
          penalize true, weight=p.w_front_obstruction_axial
  assert openSkyArc(relation="front", arc_deg=120) >= p.min_front_open_arc_deg
params:
  - key: front_obstruction_relevance_m
    default: 40
    range: [3, 300]
    unit: m
    user_editable: true
    rationale: Distance within which mass ahead of the entry is read as closing the bright hall.
  - key: max_front_elevation_deg
    default: 25
    range: [10, 60]
    unit: deg
    user_editable: true
    rationale: Obstruction angle above which daylight to the facade is materially reduced. Chosen to match the 25-degree obstruction-angle rule of thumb in BRE daylight guidance; that guidance is UK practice and jurisdiction varies.
    jurisdiction_varies: true
  - key: front_aim_tol_deg
    default: 15
    range: [5, 45]
    unit: deg
    user_editable: true
    rationale: How closely the obstruction must sit on the facing axis to count as axial rather than peripheral.
  - key: min_front_open_arc_deg
    default: 40
    range: [10, 150]
    unit: deg
    user_editable: true
    rationale: Minimum unobstructed horizontal sweep ahead before the bright hall is treated as closed.
  - key: w_front_obstruction
    default: 3
    range: [0, 10]
    unit: weight
    user_editable: true
    rationale: Base penalty weight.
  - key: w_front_obstruction_axial
    default: 3
    range: [0, 10]
    unit: weight
    user_editable: true
    rationale: Extra weight when the obstruction sits squarely on the facing axis.
score:
  weight: 7
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: reassign_facing
    target: site.facing_bearing_deg
    transform: {evaluate: alternative_facade, require: FS-FORM-009_rerun}
    cost: free
    effort: none
    reversible: true
    copy: When the front is walled in and another side is genuinely open and active, it is worth re-checking which side is really your home's front.
  - rank: 2
    action: relocate_function
    target: room_program
    transform: {move: [living_room, home_office], to: rooms_on_open_side}
    cost: free
    effort: high_physical
    reversible: true
    copy: Put the rooms you live in on the side with the view and the light, whatever the front door does.
  - rank: 3
    action: add_object
    add: lighting.exterior.wall_wash
    transform: {position: facing_facade, ccd_k: 2700}
    cost: low
    effort: medium
    reversible: true
    copy: Lighting the forecourt and the facade itself pushes back against a dark, closed-in entry.
  - rank: 4
    action: modify_finish
    target: obstructing_boundary_wall
    transform: {finish: light_reflective, add: climbing_greenery, add: trellis_depth_illusion}
    cost: low
    effort: medium
    reversible: true
    copy: If the obstruction is your own boundary wall, lightening it and greening it reduces how much it closes the space down.
conflicts_with: []
supersedes: []
requires_rules: [FS-FORM-004]
tags: [site, ming_tang, obstruction, daylight, overshadowing]
localization_notes: In dense urban markets nearly every site fails the axial test; calibrate by neighbourhood rather than reporting a uniform failure.
```

#### Why — tradition

A bright hall that is closed by mass directly ahead — a hill, a high boundary wall, a neighbouring
building, an embankment — is read as blocking qi from reaching the entry, and practitioner literature
treats a large obstruction squarely on the facing axis as a significant defect. Where classical
practice is careful is in distinguishing the *phoenix* case (something open and low in front, good) from
the *facing mountain* case (a distant, modest rise ahead, traditionally acceptable and sometimes
desirable as an *an shan* or table mountain) from the *blocked* case (something high and close). The
discriminator is elevation angle and distance, which is what this rule encodes.

#### Why — psychology / physiology

Here the evidence is unusually good. Obstruction angle is the standard planning measure for daylight
loss: UK BRE guidance (*Site layout planning for daylight and sunlight*) uses a 25° obstruction angle
from the centre of a window as the rule of thumb below which conventional window design will usually
give reasonable daylight, with a 27% vertical sky component as the associated target. So a high, close
obstruction ahead of a facade produces a measurable reduction in daylight and sky view, and reduced
daylight is in turn associated with poorer mood and sleep timing in circadian research. The
qi-blocking language and the daylight measurement point at the same geometry.

#### Customer insight

Something big and close directly in front of your home doesn't just block the view — at more than about
25 degrees up from your door it measurably cuts the daylight reaching that side. Tradition and building
science agree here. If another side of your home is genuinely more open, it may be worth treating that
as the front.

#### Failure modes / when to skip

Do not fire on distant low rises, which classical practice actually favours as a table mountain — the
elevation-angle test exists to separate the two cases. Calibrate against local density before reporting:
in a dense urban block a uniform failure is noise. The obstruction-angle default is drawn from UK
planning practice and must not be presented as a code requirement elsewhere. Where the obstruction is a
neighbour's building, skip remedies 1 and 4 and present relocation of function instead.

---
