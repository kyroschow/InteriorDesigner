# Vastu Shastra — Rooms, Object Placement, Remedies & Cross-System Conflicts

<!-- library-file: v1 | system(s): vastu.mandala, vastu.directional, vastu.remedial, product.ux | rule-id-prefixes: VS-ROOM, VS-REM, VS-CONF | author-agent: vastu-rooms-remedies-02 -->

## Scope

This file covers the **applied** half of Vastu Shastra: which room goes in which directional zone,
where fixtures and small objects sit inside those rooms, the classical **Vastu Dosha remedy**
catalogue (pyramids, metals, mirrors, colour, salt, plants, yantras, symbolic and structural
corrections), and the **conflict matrix** for cases where Vastu, feng shui, Western functional
planning and ergonomics give opposite answers.

It deliberately does **not** re-author: the Vastu Purusha Mandala grid mathematics, plot/site
selection, plot shape and extension/cut (*vriddhi/kshaya*) doctrine, proportioning (*ayadi*),
or compass acquisition — those belong to `vastu-01-*` (see `## CROSS_REFERENCES`).

### Conventions used by every rule in this file

- **Zones are absolute.** `vastuZone()` is computed from **true** north after correcting the
  device compass by `site.magnetic_declination_deg`. Vastu zones do **not** mirror in the
  southern hemisphere (see `VS-CONF-005`).
- **Default grid** is the 9-part `3x3` *padavinyasa*: `N NE E SE S SW W NW CENTER`, where
  `CENTER` is the *Brahmasthan*. Rules that need finer resolution declare
  `vastuZone(point, home, grid=16|32|81)`; the main entrance uses the **32-pada ring**
  (32 x 11.25° arcs, 8 per cardinal direction).
- **Every rule here is `belief_gated: true`.** Nothing fires unless the user has switched
  Vastu on. Strictness is globally scaled by `user.vastu_strictness` (see
  `MODIFIABLE_PARAMETERS`).
- **No rule in this file is `blocking`.** Vastu sits at tier 6 of the precedence ladder.
  Where a Vastu rule loses to safety, accessibility or ergonomics, the engine must say so
  in words (`VS-CONF-*` supplies that copy).
- **Doctrine is not unanimous.** Vastu is a living tradition transmitted through several
  textual lineages (Varāhamihira's *Bṛhat Saṃhitā*, ~6th c. CE; *Mayamata*, ~10th c.;
  *Samarāṅgaṇa Sūtradhāra*, 11th c., attributed to King Bhoja of Dhār; *Mānasāra*,
  ~11th–15th c.; plus regional *Rājavallabha*, *Aparājitapṛcchā* and guild practice) and
  through modern schools that differ sharply from each other. Where lineages disagree, the
  rule says so and exposes a `lineage` parameter rather than pretending consensus.
- **Honesty.** Several rules in this file have **no** empirical support and say so in the
  `Why — psychology / physiology` section. Some have strong *convergent* support from
  building science or hygiene, and those are the app's best content. We never dress
  tradition up as proof, and we never sneer at it either.

## Rule count: 51

---

## Rules

### VS-ROOM-001 — Main entrance placed in an auspicious pada

```yaml
id: VS-ROOM-001
title: Main entrance placed in an auspicious pada
system: vastu.mandala
group: entrance_placement
version: 1
status: active
applies_to:
  rooms: [entry_foyer, porch_entry, mudroom]
  objects: []
  requires_features: []
scope: whole_home
severity: high
confidence: tradition
evidence_class: traditional
belief_gated: true
predicate: |
  let door = home.primaryEntranceOpening
  let pada = vastuPada(centroid(door), home)            # 32-pada ring, 11.25 deg arcs
  assert padaAuspiciousness(pada, p.lineage) != "inauspicious"
  prefer padaAuspiciousness(pada, p.lineage) == "auspicious"
  penalize(padaAuspiciousness(pada, p.lineage) == "neutral", weight=2)
params:
  - key: lineage
    default: north_indian_32_pada
    range: [north_indian_32_pada, south_indian_manasara, generic_8_direction]
    unit: enum
    user_editable: true
    rationale: Which textual lineage's pada table to score against; the tables genuinely differ.
  - key: auspicious_padas
    default: [N3_MUKHYA, N4_BHALLAT, N5_SOMA, E3_JAYANTA, E4_INDRA, S3_VITHATHA, S4_GRUHAKSHAT, W3_SUGREEV, W4_PUSHPADANTA, W5_VARUNA]
    range: any_subset_of_32_padas
    unit: enum_list
    user_editable: true
    rationale: The commonly cited "best" entrance padas. Exposed because practitioners disagree.
  - key: pada_tolerance_deg
    default: 2.0
    range: [0.0, 5.6]
    unit: deg
    user_editable: true
    rationale: Compass and survey error near a pada boundary; half a pada is 5.625 deg.
score:
  weight: 9
  curve: step
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: opening.door.entry
    transform: {to_pada: nearest_auspicious, keep: wall_id}
    cost: high
    effort: contractor
    reversible: false
    copy: Shifting the front door along the same wall into the next favourable band is often only 0.6–1.2 m (2–4 ft) of movement.
  - rank: 2
    action: reassign_entrance
    target: home.primaryEntranceOpening
    transform: {promote: alternate_opening_in_auspicious_pada}
    cost: low
    effort: low
    reversible: true
    copy: If another existing door sits in a favourable band, make that the everyday front door and use the current one as a secondary.
  - rank: 3
    action: add_object
    add: decor.threshold.marker
    transform: {position: at_door_sill, materials: [brass, stone]}
    cost: low
    effort: low
    reversible: true
    copy: When the door cannot move, tradition marks the threshold instead — a brass strip or stone sill, kept clean.
conflicts_with: [SAFE-EGR-001, VS-CONF-007]
supersedes: []
requires_rules: [VS-GRID-001, VS-COMPASS-001]
tags: [entrance, pada, signature_rule, whole_home]
localization_notes: Pada names are Sanskrit; transliteration varies (Bhallat/Bhallata, Gruhakshat/Gṛhakṣata). Show the local spelling the user's region uses.
```

#### Why — tradition

The 32-pada ring of the Vastu Purusha Mandala assigns each 11.25° arc of the boundary to one of
the 32 outer deities (*padadevatas*), and the entrance is read as the mouth through which the
house takes in the world. The most widely cited favourable entrances are N3 *Mukhya*, N4
*Bhallāṭa* and N5 *Soma* on the north; E3 *Jayanta* and E4 *Indra* on the east; S4 *Gṛhakṣata*
on the south; W4 *Puṣpadanta* and W5 *Varuṇa* on the west. Note honestly that the north and
east faces carry the greatest number of favourable padas in most modern tables, and that pada
naming and which arcs count as favourable differ between north-Indian practice and
*Mānasāra*-derived south-Indian practice — this is a real disagreement inside the tradition,
not a detail we can resolve for the user.

#### Why — psychology / physiology

No direct empirical support; there is no mechanism by which an 11.25° arc of door position
affects an occupant. What *is* real is the convergent consequence of the north/east preference
at Indian latitudes (roughly 8–34°N): a north or east entrance keeps the approach and the
entrance hall out of the harsh late-afternoon west sun, so the threshold stays cooler and
glare-free at the hour people come home. Entrance legibility itself is well studied in
wayfinding research — an entrance that reads unambiguously from the street reduces search time
and hesitation — but that is about visibility, not compass bearing.

#### Customer insight

In Vastu, the front door is where the home draws in everything that comes to it, and the
tradition divides the boundary into 32 narrow bands — some considered lucky, some not. Yours
sits in one of them, and moving the door even 2–3 ft along the same wall can change which band
it lands in. We will tell you exactly which band you have and what it is called.

#### Failure modes / when to skip

Skip for apartments where the entrance is fixed by the building core, for any home where the
door is the only legal means of egress and cannot be narrowed or relocated, and whenever the
compass reading is flagged low-confidence (a reading taken beside a steel door frame can be
off by more than a full pada). Never recommend blocking or narrowing an egress door to
"correct" a pada — `SAFE-EGR-001` wins and the app must say so.

---

### VS-ROOM-002 — Main entrance approach, threshold and head-on obstructions

```yaml
id: VS-ROOM-002
title: Main entrance approach, threshold and head-on obstructions
system: vastu.directional
group: entrance_placement
version: 1
status: active
applies_to:
  rooms: [entry_foyer, porch_entry, mudroom, hallway_corridor]
  objects: [storage.shoe_rack.*, storage.bin.waste, decor.mirror.wall]
  requires_features: []
scope: room_composition
severity: medium
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let door = home.primaryEntranceOpening
  let approach = pathFromExterior(door, length_m=p.approach_clear_m)
  assert pathWidth(approach) >= p.approach_min_width_m
  forbid exists(obj in room.objects where
        obj.type in [storage.shoe_rack.*, storage.bin.waste, storage.bin.recycling]
        and distance(centroid(obj), centroid(door)) < p.clutter_exclusion_m
        and lineOfSight(door.innerFace, centroid(obj)) == true)
  forbid exists(m in room.objects where m.reflective == true
        and alignedWithin(m.faceNormal, door.openingAxis, tol_deg=p.head_on_tol_deg))
  forbid exists(o in home.openings where o.kind == door
        and o.leads_to_room_id.type in [bathroom_full, bathroom_three_quarter, powder_room]
        and alignedWithin(o.openingAxis, door.openingAxis, tol_deg=p.head_on_tol_deg))
  forbid isUnder(nearestFeature(door, floor_drain), door.sillPolygon)
  prefer stepCount(door.approachSteps) % 2 == 1
params:
  - key: approach_clear_m
    default: 2.400
    range: [1.000, 6.000]
    unit: m
    user_editable: true
    rationale: Depth of approach (about 8 ft) the tradition wants free of obstruction.
  - key: approach_min_width_m
    default: 0.900
    range: [0.800, 1.800]
    unit: m
    user_editable: false
    jurisdiction_varies: true
    rationale: Clear approach width; IRC/NBC-India egress families set the hard floor, this is the Vastu comfort figure.
  - key: clutter_exclusion_m
    default: 1.200
    range: [0.300, 3.000]
    unit: m
    user_editable: true
    rationale: Radius (about 4 ft) inside which shoe racks and bins should not be visible from the open door.
  - key: head_on_tol_deg
    default: 15.0
    range: [5.0, 35.0]
    unit: deg
    user_editable: true
    rationale: How closely something must align with the door axis to count as "directly facing" it.
  - key: prefer_odd_steps
    default: true
    range: [true, false]
    unit: bool
    user_editable: true
    rationale: The odd-step-count preference is folklore; let users switch it off without losing the rest of the rule.
score:
  weight: 6
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: storage.shoe_rack.*
    transform: {to: outside_lineOfSight(door.innerFace), or: enclosed_cabinet}
    cost: free
    effort: low
    reversible: true
    copy: Move the shoe rack out of the door's sightline, or swap it for a closed cabinet — this is the single cheapest entrance fix there is.
  - rank: 2
    action: add_object
    add: softgoods.rug.entry
    transform: {position: inside_sill, span: door.width_m}
    cost: low
    effort: low
    reversible: true
    copy: A mat inside and outside the door gives the threshold the definition tradition asks for, and catches what shoes bring in.
  - rank: 3
    action: add_object
    add: storage.partition.screen
    transform: {position: between door.openingAxis and offending_object, height_m: 1.500}
    cost: medium
    effort: low
    reversible: true
    copy: A low screen or console breaks the straight line from the door to whatever should not be facing it.
conflicts_with: [SAFE-EGR-002, ERG-CLR-004, ACC-UD-003]
supersedes: []
requires_rules: [VS-ROOM-001]
tags: [entrance, clutter, sightline, threshold, mirror]
localization_notes: In much of South and East Asia footwear is removed at the door, so a rack is functionally required; treat concealment, not removal, as the fix.
```

#### Why — tradition

Vastu treats the entrance as a *dvāra* — a controlled aperture — and asks that the path to it be
unobstructed, that the threshold be physically marked, and that nothing inauspicious sit in the
line of the opening. Practitioner texts and modern manuals converge on three specific
prohibitions: no drain or sewer line running beneath the entrance steps; no toilet door directly
opposite the front door; and no mirror directly facing it, since a mirror is held to reflect
arriving energy back out. The odd number of entrance steps (1, 3, 5, 7) is a widespread modern
convention rather than a clearly attested classical rule, and we label it as such.

#### Why — psychology / physiology

Two of these have genuine independent support and two do not. Real: footwear tracks outdoor
contaminants — lead, pesticide residues and faecal bacteria — into the home, so a concealed rack
plus a mat at the threshold is measurably useful, and an obstructed entry path is a documented
fall and trip risk, especially for older occupants. Also real: an entrance you can read at a
glance shortens the hesitation on approach, which is basic wayfinding. Not supported: the odd
step count, and the claim that a mirror facing a door repels anything. `No direct empirical
support` for those two; the mirror's only measurable effect is optical — it will bounce
headlights and porch light back at you.

#### Customer insight

Your front door works best when the first thing you see stepping in is not the shoe pile. Tuck
the rack and bin out of the door's line of sight, put a mat inside and out, and keep the
approach clear — Vastu asks for exactly this, and it also means nobody trips in the dark.

#### Failure modes / when to skip

Do not fire the clutter clause in a `mudroom` whose entire purpose is footwear storage — score
concealment instead. Skip the approach-width clause in corridor-access apartments where the
landing is common property. If moving a bin would put it where a wheelchair user cannot reach
it, `ACC-UD-003` wins outright.

---

### VS-ROOM-003 — Living room in the north, north-east or east; heavy mass to the south and west

```yaml
id: VS-ROOM-003
title: Living room in the north, north-east or east; heavy mass to the south and west
system: vastu.directional
group: room_zoning
version: 1
status: active
applies_to:
  rooms: [living_room, family_room, great_room, open_plan_combined]
  objects: [seating.sofa.*, storage.cabinet.*, storage.bookcase.*, electronics.tv.*]
  requires_features: []
  min_room_area_m2: 9.0
scope: room_composition
severity: medium
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let z = vastuZone(centroid(room), home)
  prefer z in p.preferred_zones
  penalize(z in p.discouraged_zones, weight=3)
  forEach obj in room.objects where obj.mass_kg >= p.heavy_mass_kg:
    prefer vastuZone(centroid(obj), room) in [S, SW, W]
  let southwestMass = heavyMassInZone(room, SW) + heavyMassInZone(room, S) + heavyMassInZone(room, W)
  let northeastMass = heavyMassInZone(room, NE) + heavyMassInZone(room, N) + heavyMassInZone(room, E)
  prefer southwestMass >= northeastMass * p.mass_ratio_min
  prefer zoneOpenness(room, NE) >= p.ne_openness_min
params:
  - key: preferred_zones
    default: [N, NE, E]
    range: any_subset_of_9_zones
    unit: enum_list
    user_editable: true
    rationale: Lineages also accept NW for a living room in a north-facing plot; expose it.
  - key: discouraged_zones
    default: [SW, S]
    range: any_subset_of_9_zones
    unit: enum_list
    user_editable: true
    rationale: SW is reserved for the primary bedroom and heavy storage in most schools.
  - key: heavy_mass_kg
    default: 40.0
    range: [15.0, 150.0]
    unit: kg
    user_editable: true
    rationale: Threshold above which an object counts as "heavy" for zone-mass balancing.
  - key: mass_ratio_min
    default: 1.5
    range: [1.0, 4.0]
    unit: ratio
    user_editable: true
    rationale: How much heavier the south-west half should be than the north-east half.
  - key: ne_openness_min
    default: 0.60
    range: [0.30, 0.95]
    unit: fraction
    user_editable: true
    rationale: Fraction of the north-east zone that should stay free of bulky objects.
score:
  weight: 6
  curve: linear
  partial_credit: true
remedies:
  - rank: 1
    action: swap_objects
    target: [storage.cabinet.*, seating.armchair.*]
    transform: {swap: heaviest_object_in_NE with lightest_object_in_SW}
    cost: free
    effort: medium_physical
    reversible: true
    copy: Trade places between the bulkiest thing in your north-east corner and the lightest thing in the south-west.
  - rank: 2
    action: move_object
    target: storage.bookcase.*
    transform: {to_zone: SW, keep: backsToWall(min_contact_pct=80)}
    cost: free
    effort: high_physical
    reversible: true
    copy: Tall bookcases and media units belong on the south or west wall — heavy things anchored where the tradition wants weight.
  - rank: 3
    action: remove_object
    target: any_object_in_zone(NE)
    transform: {relocate_to: SW, if: footprintArea(obj) > 0.6}
    cost: free
    effort: medium_physical
    reversible: true
    copy: Clear the north-east corner. Keeping it open and light is one of the most emphasised ideas in Vastu.
conflicts_with: [ERG-CONV-002, COMP-BAL-005, FS-CMD-004]
supersedes: []
requires_rules: [VS-GRID-001]
tags: [living_room, zoning, mass_balance, northeast]
localization_notes: In apartments the "zone" is measured within the unit, not the building; state which the engine used.
```

#### Why — tradition

The mandala reads the south-west (*Nairṛtya*) as the zone of weight, earth and stability, and the
north-east (*Īśānya*) as the zone of light, water and the sacred. From that follows a general
massing instruction repeated across lineages: put weight and enclosure in the south and west,
keep the north and east lower, lighter and more open. A living room is treated as a semi-public
receiving space and is therefore preferred in the north, north-east or east, with its own
furniture obeying the same internal gradient — sofas and media walls against the south and west,
the north-east corner kept clear.

#### Why — psychology / physiology

The massing gradient has a real, non-mystical justification at the latitudes where Vastu
developed. In the northern hemisphere between roughly 8° and 34°N, west and south-west walls take
the highest late-afternoon irradiance and drive the peak cooling load, while north and north-east
walls receive only low-intensity morning and diffuse light. Putting thick, occupied-less mass
(storage, stairs, service) on the hot faces and glazing the cool faces is straightforward passive
solar design and predates any need for a metaphysical explanation. The furniture-level version of
the rule has no empirical support on its own, though grouping visual weight on one side of a room
is a standard compositional device.

#### Customer insight

Vastu wants the north and east of your home to feel light and open, and the south and west to
carry the weight — so bookcases, media units and big storage go on the south or west wall, and
the north-east corner stays clear. It happens to be good sense in a hot climate too: the heavy
stuff ends up on the walls that cook in the afternoon sun.

#### Failure modes / when to skip

Skip the mass-ratio clause in rooms under 9 m² (about 97 ft²) where a single sofa dominates, and
in studio apartments where one room is every room. If the only window is in the south-west, do
not stack storage against it — daylight access for the primary seating group outranks the massing
preference. Where the TV must face away from a window to avoid glare, `ERG-CONV-002` and the
glare rules win; say so.

---

### VS-ROOM-004 — Brahmasthan (centre) kept open and unloaded

```yaml
id: VS-ROOM-004
title: Brahmasthan (centre) kept open and unloaded
system: vastu.mandala
group: brahmasthan
version: 1
status: active
applies_to:
  rooms: [open_plan_combined, great_room, hallway_corridor, living_room, stair_core]
  objects: []
  requires_features: []
scope: whole_home
severity: high
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let bs = brahmasthanPolygon(home, fraction=p.brahmasthan_fraction)
  forbid exists(s in home.stairs where overlaps(bbox(s), bs))
  forbid exists(r in home.rooms where r.type in p.forbidden_room_types and overlaps(r.polygon, bs))
  forbid exists(f in home.features where f.kind in [plumbing_stack, water_heater, sump, floor_drain]
        and contains(bs, centroid(f)))
  forEach obj in objectsIntersecting(bs):
    penalize(obj.mass_kg >= p.heavy_mass_kg and obj.is_fixed == true, weight=4)
    prefer obj.footprint.h <= p.max_center_object_height_m
  prefer occupancyRatio(bs) <= p.max_center_occupancy
params:
  - key: brahmasthan_fraction
    default: 0.111
    range: [0.040, 0.250]
    unit: fraction_of_plan_area
    user_editable: true
    rationale: One of nine cells in the 3x3 padavinyasa. The 81-pada grid gives a smaller central 9/81 = 0.111 too; strict lineages use a tighter core.
  - key: forbidden_room_types
    default: [bathroom_full, bathroom_three_quarter, powder_room, kitchen, utility_mechanical, storage_room]
    range: any_subset_of_room_types
    unit: enum_list
    user_editable: true
    rationale: Which uses the tradition refuses to place in the centre.
  - key: heavy_mass_kg
    default: 40.0
    range: [15.0, 150.0]
    unit: kg
    user_editable: true
    rationale: Mass above which a central object counts as loading the Brahmasthan.
  - key: max_center_object_height_m
    default: 0.900
    range: [0.400, 2.100]
    unit: m
    user_editable: true
    rationale: Height (about 3 ft) below which a central object still reads as "open".
  - key: max_center_occupancy
    default: 0.25
    range: [0.00, 0.60]
    unit: fraction
    user_editable: true
    rationale: Plan-area fraction of the centre that may be occupied before the rule penalises.
score:
  weight: 9
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: remove_object
    target: any_fixed_object_in(brahmasthanPolygon)
    transform: {relocate_to: nearest_non_center_zone}
    cost: free
    effort: medium_physical
    reversible: true
    copy: Clear the centre of your home — even just pulling the console or the ottoman out of the middle counts.
  - rank: 2
    action: replace_object
    target: tables.island.kitchen
    transform: {replace_with: tables.island.mobile, or: reduce_height_to(0.900)}
    cost: high
    effort: contractor
    reversible: false
    copy: If a fixed island sits dead centre, a lighter, movable or lower one keeps the middle of the home feeling open.
  - rank: 3
    action: add_object
    add: lighting.pendant.center
    transform: {position: centroid(brahmasthanPolygon), z: ceiling}
    cost: low
    effort: low
    reversible: true
    copy: When the centre cannot be emptied, tradition asks that it at least be well lit and never used for storage or waste.
conflicts_with: [ERG-KIT-001, SAFE-STR-002, CIRC-SYN-004]
supersedes: []
requires_rules: [VS-GRID-001]
tags: [brahmasthan, center, signature_rule, whole_home, open_plan]
localization_notes: In Indian practice a courtyard in the Brahmasthan is the ideal expression of this rule; in apartments the realistic target is an empty circulation void.
```

#### Why — tradition

The *Brahmasthan* is the navel of the Vastu Purusha Mandala, the seat of Brahma in the 81- or
64-pada grid, and it is the one zone on which every lineage agrees: it must stay void. The
classical expression is the open courtyard (*aṅgaṇa*, *nālukeṭṭu*, *chowk*) at the centre of the
plan. Concretely the tradition forbids the centre to a staircase, a toilet, a kitchen, a heavy
column of storage, a waste point or a plumbing stack, and older practice treats building over the
centre as a serious *dosha* rather than a minor one.

#### Why — psychology / physiology

There is a real convergence here, arguably the strongest in the whole system. A central open
void is the courtyard typology, and courtyards do measurable work in hot climates: stack-effect
ventilation, night-sky radiative cooling of the floor, and daylight delivered to the deep plan
that a single-aspect layout cannot reach. In circulation terms a clear centre also maximises
integration in the space-syntax sense — from the middle you can see and reach the most of the
house, which is what makes a plan feel navigable. None of that validates the deity; it does mean
the instruction produces good plans for reasons we can measure.

#### Customer insight

Vastu treats the exact centre of your home as its still point and asks you to leave it empty —
traditionally an open courtyard. In a flat, the practical version is simply this: keep the middle
of the plan as clear walking space, not storage, not a bin, not a bulky island.

#### Failure modes / when to skip

Never move a structural column or a plumbing stack to satisfy this rule — flag it as an
uncorrectable *dosha* and go straight to the remedy ladder (`VS-REM-011`). In small flats under
about 45 m² (485 ft²) the geometric centre is often inside a corridor and already empty; score it
and move on. If clearing the centre would eliminate the only accessible turning circle, the
accessibility rule wins.

---

### VS-ROOM-005 — Primary bedroom in the south-west

```yaml
id: VS-ROOM-005
title: Primary bedroom in the south-west
system: vastu.directional
group: bedroom_zoning
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, ensuite, guest_suite]
  objects: [sleep.bed.*]
  requires_features: []
  min_room_area_m2: 7.0
scope: room_adjacency
severity: high
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let z = dominantVastuZone(room, home)                 # area-weighted over the 9-zone grid
  assert z not in p.forbidden_zones
  prefer z == SW
  prefer vastuZoneShare(room, SW, home) >= p.sw_share_min
  penalize(z in p.weak_zones, weight=2)
  if home.storeys > 1: prefer room.floor.level == home.topOccupiedLevel
params:
  - key: forbidden_zones
    default: [NE, SE]
    range: any_subset_of_9_zones
    unit: enum_list
    user_editable: true
    rationale: NE is reserved for prayer/water, SE is the fire zone; both are held unsuitable for the household heads.
  - key: weak_zones
    default: [N, CENTER]
    range: any_subset_of_9_zones
    unit: enum_list
    user_editable: true
    rationale: Tolerated but not preferred in most modern practice.
  - key: sw_share_min
    default: 0.50
    range: [0.25, 1.00]
    unit: fraction
    user_editable: true
    rationale: How much of the room's footprint must fall inside the SW cell to count as "in the SW".
  - key: strict_top_floor
    default: false
    range: [true, false]
    unit: bool
    user_editable: true
    rationale: Some lineages want the head of household on the uppermost occupied floor; off by default.
score:
  weight: 8
  curve: step
  partial_credit: true
remedies:
  - rank: 1
    action: reassign_room
    target: bedroom_primary
    transform: {swap_use_with: nearest_bedroom_in_zone(SW)}
    cost: free
    effort: high_physical
    reversible: true
    copy: The simplest fix is to swap rooms — make the south-west bedroom the main one, even if it is slightly smaller.
  - rank: 2
    action: move_object
    target: sleep.bed.*
    transform: {to_zone: SW, within: room}
    cost: free
    effort: medium_physical
    reversible: true
    copy: If the room cannot change, move the bed itself into the south-west corner of the room you have.
  - rank: 3
    action: add_object
    add: storage.wardrobe.freestanding
    transform: {to_zone: SW, mass_kg: ">= 60"}
    cost: medium
    effort: medium_physical
    reversible: true
    copy: Adding weight in the south-west — a solid wardrobe or chest — is the standard stand-in when the room is in the wrong zone.
conflicts_with: [DAY-ORI-003, ACOU-PRIV-002, VS-CONF-007]
supersedes: []
requires_rules: [VS-GRID-001]
tags: [bedroom, primary, southwest, signature_rule]
localization_notes: Zone is computed within the dwelling unit. For a multigenerational compound, ask which dwelling the user means.
```

#### Why — tradition

The south-west quarter belongs to *Nairṛti* and carries the mandala's densest, most grounded
quality: earth, weight, stability, retention. Vastu therefore assigns it to the heads of the
household, on the reasoning that the people who hold the family together should sleep in the zone
of holding. The two firm exclusions are the north-east, which is reserved for water and worship,
and the south-east, the fire zone of *Agni*, which is held to make sleep restless and tempers
short. Modern practitioners commonly add a preference for the topmost occupied floor; this is not
uniformly attested and we leave it off by default.

#### Why — psychology / physiology

No direct empirical support for the directional assignment itself. The physically real part is
thermal: a south-west room in the northern hemisphere absorbs the afternoon and evening solar
load and releases it into the night, which in a hot climate makes it the *worst* room to sleep in
unless the envelope is heavy or the room is conditioned — sleep onset and slow-wave sleep are
genuinely temperature-sensitive, and bedroom temperature is one of the few environmental
variables with solid sleep-science backing. So this rule and sleep science point in opposite
directions in hot climates and in the same direction in cold ones. The app should say that
plainly rather than pick a side silently.

#### Customer insight

Vastu puts the main bedroom in the south-west corner — the zone it associates with weight,
steadiness and the people who anchor a household. One practical caveat from us: in a hot climate
that room also takes the afternoon sun, so plan for shading or cooling if you move into it.

#### Failure modes / when to skip

Skip in studios, single-bedroom flats and any home with only one bedroom — there is nothing to
swap. Skip when the south-west room is the only one with step-free access and an occupant has a
mobility need. Do not recommend the swap when it would put a child or an older adult in a room
without a second means of escape.

---

### VS-ROOM-006 — Secondary bedrooms: children, teens and guests by zone

```yaml
id: VS-ROOM-006
title: Secondary bedrooms - children, teens and guests by zone
system: vastu.directional
group: bedroom_zoning
version: 1
status: active
applies_to:
  rooms: [bedroom_secondary, bedroom_child, bedroom_teen, bedroom_shared_siblings, nursery, bedroom_guest]
  objects: [sleep.bed.*]
  requires_features: []
  min_room_area_m2: 6.0
scope: room_adjacency
severity: medium
confidence: tradition
evidence_class: traditional
belief_gated: true
predicate: |
  let z = dominantVastuZone(room, home)
  let table = p.zone_table                              # room.type -> {preferred[], forbidden[]}
  assert z not in table[room.type].forbidden
  prefer z in table[room.type].preferred
  if room.type in [bedroom_child, bedroom_teen, bedroom_shared_siblings]:
    penalize(z == SW, weight=3)                         # SW is reserved for the household heads
  if room.type == bedroom_guest:
    prefer z == NW
    penalize(adjacency(room, home.roomOfType(bedroom_primary)) == true, weight=1)
params:
  - key: zone_table
    default:
      bedroom_child:            {preferred: [W, NW, E],  forbidden: [SE]}
      bedroom_teen:             {preferred: [E, N, W],   forbidden: [SE]}
      bedroom_shared_siblings:  {preferred: [W, NW],     forbidden: [SE]}
      nursery:                  {preferred: [E, N, NW],  forbidden: [SE, SW]}
      bedroom_secondary:        {preferred: [W, NW, S],  forbidden: [NE]}
      bedroom_guest:            {preferred: [NW],        forbidden: [NE, SW]}
    range: editable_mapping
    unit: enum_mapping
    user_editable: true
    rationale: Lineages differ most on children's rooms (west vs east); make the whole table editable.
  - key: guest_stay_bias
    default: short
    range: [short, long]
    unit: enum
    user_editable: true
    rationale: NW is associated with movement and short stays; long-stay guests are often placed elsewhere.
score:
  weight: 5
  curve: step
  partial_credit: true
remedies:
  - rank: 1
    action: reassign_room
    target: room
    transform: {swap_use_with: sibling_bedroom_in_preferred_zone}
    cost: free
    effort: high_physical
    reversible: true
    copy: Swapping which child sleeps in which room costs nothing and is usually the whole fix.
  - rank: 2
    action: move_object
    target: sleep.bed.*
    transform: {to_zone: preferred_sub_zone_within_room}
    cost: free
    effort: medium_physical
    reversible: true
    copy: Keeping the room, move the bed into the corner of it that matches the favoured direction.
  - rank: 3
    action: note_only
    target: room
    transform: {}
    cost: free
    effort: none
    reversible: true
    copy: If neither is possible, this is a low-impact point in Vastu terms - we will not keep nagging you about it.
conflicts_with: [SAFE-CHLD-004, ACOU-PRIV-003]
supersedes: []
requires_rules: [VS-ROOM-005]
tags: [bedroom, children, guest, zoning]
localization_notes: In joint-family homes the "guest" room is often a married son's room; ask before applying the NW short-stay logic.
```

#### Why — tradition

Once the south-west is given to the household heads, the remaining bedrooms are distributed by
the qualities the mandala assigns to each zone. The north-west belongs to *Vāyu*, wind and
movement, which is why it is the standard guest room — the zone of things that come and go — and
also a common choice for unmarried daughters in traditional practice. Children are usually placed
in the west or north-west, with the east favoured for a studying child because the east is the
zone of *Indra* and the rising sun. The one broad exclusion is the south-east fire zone, held
unsuitable for sleep generally, and the south-west, which is not given to children because it is
the seat of the household's authority.

#### Why — psychology / physiology

`No direct empirical support; mechanism is plausible but untested.` The zone assignments are
symbolic and there is no measurable effect of a bedroom's compass position on a child. Two
adjacent real considerations do exist and should carry the actual decision: an east-facing
children's bedroom receives bright early-morning light, which advances the circadian phase and
makes early waking easier — useful for school-age children and a nuisance for teenagers, whose
phase is naturally delayed; and a guest room placed away from the primary bedroom improves
acoustic privacy for both parties, which is measurable in dB.

#### Customer insight

Vastu gives each direction a character — the north-west is the zone of movement, so it is the
traditional guest room, and the east is favoured for a child who studies. If you can simply swap
who sleeps where, that is the whole fix and it is free. Worth knowing: an east room gets strong
morning light, which suits early risers and annoys teenagers.

#### Failure modes / when to skip

Skip entirely in one- and two-bedroom homes where rooms cannot be reassigned. Never move an
infant or a child with a medical need out of the room adjacent to a caregiver to satisfy a zone
preference — `SAFE-CHLD-004` wins. Do not apply the teen/east preference against a documented
sleep-phase problem; morning light in a delayed-phase teenager's room is a real intervention and
should not be applied as decoration.

---

### VS-ROOM-007 — Sleeping head direction: south first, east second, never north

```yaml
id: VS-ROOM-007
title: Sleeping head direction - south first, east second, never north
system: vastu.directional
group: sleep_direction
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, bedroom_guest, bedroom_child, bedroom_teen, bedroom_shared_siblings, nursery, studio_apartment, guest_suite, dorm_room]
  objects: [sleep.bed.*, sleep.mattress.floor, sleep.futon.*]
  requires_features: []
scope: object_placement
severity: high
confidence: contested
evidence_class: traditional
belief_gated: true
predicate: |
  let bed = target
  let h = headBearing(bed)                              # compass bearing the crown of the head points toward
  let oct = compassOctant(h)
  forbid oct in p.forbidden_head_octants
  prefer oct == p.primary_head_octant
  penalize(oct in p.tolerated_head_octants, weight=2)
  if room.type in [bedroom_child, bedroom_teen] and p.student_east_preference == true:
    prefer oct == E
  assert alignedWithin(bearingOf(oct), bearingOf(p.primary_head_octant), tol_deg=p.head_tol_deg)
        or oct in p.tolerated_head_octants
params:
  - key: primary_head_octant
    default: S
    range: [S, E]
    unit: enum
    user_editable: true
    rationale: Head to the south is the near-universal first choice; head to the east is the usual second.
  - key: tolerated_head_octants
    default: [E, W]
    range: any_subset_of_octants
    unit: enum_list
    user_editable: true
    rationale: West is generally treated as neutral rather than harmful.
  - key: forbidden_head_octants
    default: [N]
    range: any_subset_of_octants
    unit: enum_list
    user_editable: true
    rationale: Head to the north is the one orientation the tradition actively warns against.
  - key: head_tol_deg
    default: 22.5
    range: [10.0, 45.0]
    unit: deg
    user_editable: true
    rationale: Octant half-width. Tighten it for strict practitioners, loosen it for rooms that are not square to north.
  - key: student_east_preference
    default: true
    range: [true, false]
    unit: bool
    user_editable: true
    rationale: The east-for-students convention; switchable because it collides with teenage sleep phase.
score:
  weight: 9
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: rotate_object
    target: sleep.bed.*
    transform: {set: headBearing -> p.primary_head_octant, keep: backsToWall(min_contact_pct=70)}
    cost: free
    effort: high_physical
    reversible: true
    copy: Turn the bed so your head points south. It is free, it takes twenty minutes, and it is the single most requested Vastu change there is.
  - rank: 2
    action: rotate_object
    target: sleep.bed.*
    transform: {set: headBearing -> E}
    cost: free
    effort: high_physical
    reversible: true
    copy: If south will not work with the room, head to the east is the accepted second choice - and the one traditionally suggested for students.
  - rank: 3
    action: note_only
    target: sleep.bed.*
    transform: {}
    cost: free
    effort: none
    reversible: true
    copy: If the walls leave you only one workable spot, tradition accepts west. North is the one it asks you to avoid.
conflicts_with: [FS-CMD-001, FS-EM-004, SLEEP-ENV-002, VS-CONF-001]
supersedes: []
requires_rules: []
tags: [bed, sleep, direction, signature_rule, contested]
localization_notes: Does NOT mirror in the southern hemisphere. Vastu directions are absolute; see VS-CONF-005 for the policy and the copy.
```

#### Why — tradition

This is the most widely known Vastu instruction in the world and the one users ask about first.
Head to the south is the primary recommendation; head to the east is the accepted alternative and
is specifically associated with study, memory and concentration; west is treated as neutral; and
head to the north is the orientation the tradition explicitly warns against. The reason offered
inside the tradition is magnetic: the body is described as polarised with the head as its
positive pole, the earth's magnetic north as another positive pole, and north-facing sleep as the
resulting repulsion or disturbed flow. The doctrine is stable across lineages, which is unusual;
the *explanation* is a modern scientific-sounding gloss rather than a classical one.

#### Why — psychology / physiology

The magnetic mechanism is not supported and is contradicted by known physics. The geomagnetic
field is roughly 25–65 microtesla; clinical MRI exposes patients to 1.5–3 tesla — tens of
thousands of times stronger — with no effect on blood pressure or circulation of the kind
claimed. The iron in haemoglobin is not ferromagnetic (oxyhaemoglobin is diamagnetic,
deoxyhaemoglobin paramagnetic — the basis of BOLD fMRI contrast), so the "body as bar magnet"
picture is wrong. Biogenic magnetite *has* been documented in human brain tissue (Kirschvink,
Kobayashi-Kirschvink and Woodford, *PNAS* 89(16), 1992), but nothing links it to sleep
orientation. Several websites cite a "12-week clinical study" of sleep direction and cortisol; we
could not verify that such a study exists, so we do not cite it. What *is* well supported about
bedroom orientation is indirect: the head end should be away from a bright window, away from a
noise source, and against a solid wall, because light at the eye, noise ingress and temperature
are the environmental variables with real effects on sleep.

#### Customer insight

This is the Vastu rule almost everyone has heard: sleep with your head to the south, or to the
east if south will not fit, and avoid pointing your head north. We will be straight with you —
the magnetic explanation you may have read does not hold up scientifically, and we have not found
a reliable study showing sleep direction affects health. It is free to do, it matters a great deal
to many families, and turning the bed also lets us put the headboard against a solid wall away
from the window, which genuinely does help sleep.

#### Failure modes / when to skip

Skip when no orientation of the bed leaves the required bedside clearance or a clear path to the
door, when a wheelchair transfer side is fixed by the room, or when rotating the bed would put the
head end under a window that cannot be blacked out. In shared-siblings rooms with bunk beds the
rule applies to the bunk unit as a whole, not to each mattress. When this rule and an Eight
Mansions personal-direction rule both fire and disagree, `VS-CONF-001` decides and the app must
show both answers.

---

### VS-ROOM-008 — Bed position within the bedroom

```yaml
id: VS-ROOM-008
title: Bed position within the bedroom
system: vastu.directional
group: sleep_direction
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, bedroom_guest, bedroom_child, bedroom_teen, nursery, studio_apartment, guest_suite]
  objects: [sleep.bed.*]
  requires_features: []
scope: object_placement
severity: medium
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let bed = target
  prefer vastuZone(centroid(bed), room) in p.preferred_bed_zones
  assert backsToWall(bed, min_contact_pct=p.headboard_contact_pct)
  forbid isUnder(bed.headThirdPolygon, nearestFeature(bed, beam))
  forbid isUnder(bed.headThirdPolygon, nearestFeature(bed, soffit))
  forbid alignedWithin(bed.footAxis, room.primaryDoor.openingAxis, tol_deg=p.foot_to_door_tol_deg)
  assert clearance(bed, left) >= p.min_side_clearance_m or clearance(bed, right) >= p.min_side_clearance_m
  prefer distanceToWall(bed.headboard, wall) <= p.headboard_gap_max_m
  penalize(isUnder(bed.polygon, nearestFeature(bed, skylight)), weight=2)
  penalize(sharedWall(room, home.roomOfType(bathroom_full)) and isOnWall(bed.headboard, thatSharedWall), weight=3)
params:
  - key: preferred_bed_zones
    default: [SW, S, W]
    range: any_subset_of_9_zones
    unit: enum_list
    user_editable: true
    rationale: Within the room, the bed repeats the whole-home massing logic and sits in the SW quadrant.
  - key: headboard_contact_pct
    default: 70
    range: [40, 100]
    unit: percent
    user_editable: true
    rationale: How much of the headboard width must touch a solid wall.
  - key: foot_to_door_tol_deg
    default: 15.0
    range: [5.0, 30.0]
    unit: deg
    user_editable: true
    rationale: Alignment tolerance for the "feet pointing straight out of the door" position both Vastu and feng shui dislike.
  - key: min_side_clearance_m
    default: 0.600
    range: [0.450, 1.200]
    unit: m
    user_editable: false
    jurisdiction_varies: false
    rationale: About 24 in - the ergonomic minimum to make a bed and get in and out; this is a hard floor, not a Vastu figure.
  - key: headboard_gap_max_m
    default: 0.050
    range: [0.000, 0.300]
    unit: m
    user_editable: true
    rationale: Tradition wants the head end supported, not floating; 50 mm (2 in) allows for skirting.
score:
  weight: 7
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: sleep.bed.*
    transform: {to_zone: SW, keep: [headBearing, backsToWall]}
    cost: free
    effort: high_physical
    reversible: true
    copy: Slide the bed into the south-west part of the room with the headboard flat against the wall.
  - rank: 2
    action: add_object
    add: softgoods.canopy.fabric
    transform: {position: above bed.headThird, if: beam_cannot_be_avoided}
    cost: low
    effort: low
    reversible: true
    copy: When a beam crosses over the head of the bed and the bed cannot move, a fabric canopy or a boxed-in ceiling is the traditional cover.
  - rank: 3
    action: add_object
    add: sleep.headboard.upholstered
    transform: {attach_to: bed, min_height_m: 0.900}
    cost: medium
    effort: low
    reversible: true
    copy: A tall solid headboard gives the head end the backing tradition asks for, even on a wall you cannot use fully.
conflicts_with: [ERG-CLR-011, SAFE-EGR-004, FS-CMD-001]
supersedes: []
requires_rules: [VS-ROOM-007]
tags: [bed, beam, headboard, sightline, sleep]
localization_notes: The Hindi/Marathi term users search for is the "beam over bed" dosha; mirror that phrasing in Indian locales.
```

#### Why — tradition

Vastu repeats the whole-home massing gradient inside each room, so the bed — the heaviest object
in a bedroom — belongs in the south-west quadrant, pushed into the corner rather than floating.
Three specific prohibitions recur: no beam, soffit or bulkhead directly over the sleeper's head
and chest, because an overhead edge is held to press down on the occupant; the feet should not
point straight out through the door, a position traditional practice associates with the dead
being carried out; and the headboard should not share a wall with a toilet. Classical feng shui
arrives at two of these three independently, which is worth telling the user.

#### Why — psychology / physiology

The "beam over bed" prohibition has a partial real basis: an exposed structural edge overhead
reduces perceived headroom and there is genuine evidence that lowered or visually compressed
ceilings above a resting position increase reported discomfort. It is also, prosaically, a head
strike hazard when sitting up. The headboard-against-solid-wall preference converges with
prospect–refuge reasoning (Appleton) and with the very well-documented fact that the head of the
bed should be away from noise: a shared wall with a toilet means flush and pump noise arriving at
the sleeper's ear, and noise-induced arousals during sleep are thoroughly established. The
feet-toward-door prohibition itself has `no direct empirical support`; its only functional cousin
is that a bed aligned with a door tends to sit in the traffic path.

#### Customer insight

Push the bed into the south-west part of the room, headboard flat against a solid wall, and keep
the head end out from under any beam or bulkhead. Avoid pointing your feet straight out through
the doorway — tradition is firm about that one. Leave at least 24 in on one side so you can
actually make the bed.

#### Failure modes / when to skip

The 600 mm side clearance is an ergonomic hard minimum and outranks the zone preference — if the
south-west position kills it, the position loses. Skip the beam clause for decorative,
non-structural coffering. Skip the whole rule for floor mattresses in `japanese.*` layouts, for
hospital-type beds whose position is set by transfer and equipment access, and for cots whose
placement is set by `SAFE-CHLD-*`.

---

### VS-ROOM-009 — No mirror reflecting the bed

```yaml
id: VS-ROOM-009
title: No mirror reflecting the bed
system: vastu.directional
group: mirrors
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, bedroom_guest, bedroom_child, bedroom_teen, nursery, studio_apartment, dressing_room, guest_suite]
  objects: [decor.mirror.wall, decor.mirror.full_length, storage.wardrobe.mirrored, electronics.tv.wall]
  requires_features: []
scope: object_pair
severity: high
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let bed = room.objectOfType(sleep.bed.*)
  forEach m in room.objects where m.reflective == true and footprintArea(m) >= p.min_mirror_area_m2:
    forbid reflectsPolygon(m, bed.sleeperVolume, tol_deg=p.reflection_tol_deg)
    if p.include_screens == true:
      forbid (m.type in [electronics.tv.*] and m.power_state == "off"
              and reflectsPolygon(m, bed.sleeperVolume, tol_deg=p.reflection_tol_deg))
  prefer countOf(decor.mirror.*, room) <= p.max_bedroom_mirrors
params:
  - key: min_mirror_area_m2
    default: 0.120
    range: [0.020, 1.000]
    unit: m2
    user_editable: true
    rationale: Below about 0.12 m2 (roughly 12 x 16 in) a mirror is treated as decorative, not reflective of the whole sleeper.
  - key: reflection_tol_deg
    default: 10.0
    range: [3.0, 25.0]
    unit: deg
    user_editable: true
    rationale: Angular tolerance for judging whether the sleeper appears in the mirror.
  - key: include_screens
    default: true
    range: [true, false]
    unit: bool
    user_editable: true
    rationale: A dark TV panel behaves as a mirror; strict practitioners include it, others do not.
  - key: max_bedroom_mirrors
    default: 1
    range: [0, 4]
    unit: count
    user_editable: true
    rationale: Some lineages want no mirror in a bedroom at all; others allow one on a wardrobe door.
score:
  weight: 8
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: move_object
    target: decor.mirror.*
    transform: {to_wall: wall_containing(bed.headboard), or: inside_wardrobe_door}
    cost: free
    effort: low
    reversible: true
    copy: Move the mirror to the wall behind the bed, or put it inside the wardrobe door - out of sight when you are lying down.
  - rank: 2
    action: add_object
    add: softgoods.curtain.mirror_cover
    transform: {cover: mirror.face, operable: true}
    cost: low
    effort: low
    reversible: true
    copy: A cloth or a sliding panel you draw across the mirror at night is the traditional compromise, and it works.
  - rank: 3
    action: rotate_object
    target: storage.wardrobe.mirrored
    transform: {reposition: so_that not reflectsPolygon(mirror, bed.sleeperVolume)}
    cost: free
    effort: medium_physical
    reversible: true
    copy: Turning a mirrored wardrobe so it faces along the bed rather than across it usually solves it in one move.
conflicts_with: [FS-MIR-002, VS-ROOM-024, VS-CONF-004]
supersedes: []
requires_rules: []
tags: [mirror, bedroom, sleep, signature_rule]
localization_notes: This is one of the few points where Vastu and nearly every feng shui school agree; say so, users find it reassuring.
```

#### Why — tradition

Vastu treats a mirror that shows the sleeping body as draining — the sleeper's energy is described
as being doubled out of the room rather than retained — and the same prohibition appears in
classical and modern feng shui, where a bed-facing mirror is among the most consistently cited
bedroom faults. Practitioners extend it to mirrored wardrobe fronts, dressing-table mirrors angled
at the bed, and in stricter readings to any dark reflective panel including a switched-off
television. Where the mirror cannot move, covering it at night is an accepted remedy in both
traditions rather than a fudge.

#### Why — psychology / physiology

There is a plausible and partly supported mechanism, distinct from the traditional one. A mirror
facing the bed multiplies point light sources — streetlight through a gap, a standby LED, a
passing headlight — and light at the eye during sleep is one of the best-evidenced disruptors of
sleep quality and melatonin. Separately, movement glimpsed on waking in a dark room can trigger
an orienting and startle response; that specific claim about mirrors is untested, though the
underlying reflex is well characterised. Net: `the light-amplification mechanism is real; the
"movement in a dark mirror" mechanism is plausible but untested`, and the traditional
energy-drain explanation has no empirical support.

#### Customer insight

Both Vastu and feng shui ask you not to sleep where a mirror can see you, and this one has a
practical side too: a mirror facing the bed bounces every stray light in the room back at you.
Move it behind the bed, put it inside the wardrobe door, or just cover it at night.

#### Failure modes / when to skip

Skip in `dressing_room` and in a studio where a single full-length mirror is genuinely necessary
and the bed occupies most of the floor — offer the cover remedy instead. Do not ask a user to
remove a mirror needed for a medical or mobility reason. In rentals, never suggest removing a
fixed mirrored wardrobe front; go to remedy rank 2.

---

### VS-ROOM-010 — Heavy storage mass in the south and west, openings to the north and east

```yaml
id: VS-ROOM-010
title: Heavy storage mass in the south and west, openings to the north and east
system: vastu.directional
group: storage_zoning
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, bedroom_child, bedroom_teen, walk_in_closet, dressing_room, storage_room, reach_in_closet, living_room, study_library]
  objects: [storage.wardrobe.*, storage.almirah.*, storage.cabinet.tall, storage.bookcase.*, storage.chest.*]
  requires_features: []
scope: object_placement
severity: medium
confidence: tradition
evidence_class: traditional
belief_gated: true
predicate: |
  forEach s in room.objects where s.type in [storage.wardrobe.*, storage.almirah.*, storage.cabinet.tall, storage.bookcase.*]:
    prefer isOnWall(s, wallInZone(room, S)) or isOnWall(s, wallInZone(room, W)) or isOnWall(s, wallInZone(room, SW))
    penalize(vastuZone(centroid(s), room) in [NE, N, E] and s.footprint.h >= p.tall_storage_h_m, weight=3)
    prefer compassOctant(objectBearing(s)) in p.preferred_opening_octants
    assert clearance(s, front) >= p.min_door_swing_clear_m
    forbid overlaps(s.doorSwingPolygon, room.primaryDoor.swingPolygon)
params:
  - key: tall_storage_h_m
    default: 1.500
    range: [0.900, 2.400]
    unit: m
    user_editable: true
    rationale: Height (about 5 ft) above which storage counts as blocking light and mass in the NE.
  - key: preferred_opening_octants
    default: [N, E, NE]
    range: any_subset_of_octants
    unit: enum_list
    user_editable: true
    rationale: The tradition asks that storage doors open toward the north or east.
  - key: min_door_swing_clear_m
    default: 0.750
    range: [0.600, 1.200]
    unit: m
    user_editable: false
    rationale: Ergonomic clearance in front of a wardrobe door, about 30 in. Hard minimum.
score:
  weight: 5
  curve: linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: storage.wardrobe.*
    transform: {to_wall: wallInZone(room, S) or wallInZone(room, W), keep: backsToWall(min_contact_pct=90)}
    cost: free
    effort: high_physical
    reversible: true
    copy: Put the wardrobe against the south or west wall so it opens back toward the north or east.
  - rank: 2
    action: reorder_objects
    target: [storage.chest.*, storage.bookcase.*]
    transform: {sort_by: mass_kg, place: heaviest_toward_SW}
    cost: free
    effort: medium_physical
    reversible: true
    copy: Where several pieces line the walls, order them heaviest toward the south-west and lightest toward the north-east.
  - rank: 3
    action: note_only
    target: storage.wardrobe.built_in
    transform: {}
    cost: free
    effort: none
    reversible: true
    copy: Built-in wardrobes cannot move. We will note it and stop asking.
conflicts_with: [DAY-ACC-002, ACC-UD-006, SAFE-TIP-001]
supersedes: []
requires_rules: [VS-ROOM-003]
tags: [storage, wardrobe, almirah, mass_balance, southwest]
localization_notes: "Almirah" is the standard Indian-English term for a freestanding wardrobe or steel cupboard; use it in Indian locales.
```

#### Why — tradition

The gradient that governs whole-home massing governs furniture too: weight to the south and
west, lightness and openness to the north and east. Practically that means tall wardrobes,
*almirahs*, steel cupboards, bookcases and chests should stand against the south or west wall,
which automatically makes their doors open toward the north or east — the direction the tradition
wants storage to open. Modern practitioners add that a mirrored front should not be on a
south-west *almirah*, which is a corollary of the reflective-surface rules rather than a separate
doctrine.

#### Why — psychology / physiology

`No direct empirical support; mechanism is plausible but untested.` The one physically real
consequence is about light rather than energy: tall storage on a north or east wall in the
northern hemisphere blocks exactly the low-angle, low-glare daylight those walls receive, so the
traditional instruction protects the best daylight in the room. Separately, the requirement that
storage back fully onto a wall is a genuine safety convergence — anchoring tall furniture to a
wall is the single most effective measure against furniture tip-over, which injures and kills
children every year.

#### Customer insight

Tall wardrobes and cupboards belong on your south or west walls — that way they open back toward
the north and east, as Vastu asks, and they stop shading your best daylight. While you are moving
one, anchor it to the wall; tall furniture tipping over is a real hazard with small children.

#### Failure modes / when to skip

Skip for built-in and fitted storage. Skip when the south or west wall holds the room's only
window. If a wheelchair user needs the wardrobe on a particular side for reach, `ACC-UD-006`
wins. Never place storage where its door swing fouls the room door or the egress path.

---

### VS-ROOM-011 — Safe or locker on a south or west wall, opening north

```yaml
id: VS-ROOM-011
title: Safe or locker on a south or west wall, opening north
system: vastu.directional
group: wealth_zone
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, study_library, home_office, safe_room, storage_room, walk_in_closet]
  objects: [safety.safe.*, storage.almirah.locker, storage.cashbox.*]
  requires_features: []
scope: object_placement
severity: medium
confidence: tradition
evidence_class: traditional
belief_gated: true
predicate: |
  let s = target
  assert compassOctant(objectBearing(s)) == p.locker_opening_octant
  prefer isOnWall(s, wallInZone(room, S)) or isOnWall(s, wallInZone(room, W))
  prefer dominantVastuZone(room, home) in p.locker_room_zones
  forbid vastuZone(centroid(s), room) == p.forbidden_locker_zone
  forbid exists(m in room.objects where m.reflective and reflectsPolygon(m, s.doorFace))
  assert anchored(s) == true
  forbid lineOfSight(exteriorPoint(nearestOpening(room, window)), centroid(s))
params:
  - key: locker_opening_octant
    default: N
    range: [N, E, NE]
    unit: enum
    user_editable: true
    rationale: North is Kubera's direction; most practitioners insist the door face north when opened.
  - key: locker_room_zones
    default: [SW, S, W, N]
    range: any_subset_of_9_zones
    unit: enum_list
    user_editable: true
    rationale: Lineages split between "locker in the SW room" and "locker in the N (Kubera) room"; both are attested in modern practice.
  - key: forbidden_locker_zone
    default: SE
    range: any_of_9_zones
    unit: enum
    user_editable: true
    rationale: The fire zone is held unsuitable for stored wealth.
  - key: require_anchoring
    default: true
    range: [true, false]
    unit: bool
    user_editable: false
    rationale: Security requirement, not a Vastu one; an unanchored safe is carried away.
score:
  weight: 5
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: rotate_object
    target: safety.safe.*
    transform: {set: objectBearing -> N, keep: backsToWall}
    cost: free
    effort: medium_physical
    reversible: true
    copy: Stand the safe against the south or west wall so that when you open it, the door swings toward the north.
  - rank: 2
    action: move_object
    target: storage.almirah.locker
    transform: {to_room: roomInZone(home, N), keep: objectBearing == N}
    cost: free
    effort: high_physical
    reversible: true
    copy: Some practitioners prefer the locker in the north room of the home - the direction Vastu associates with wealth.
  - rank: 3
    action: add_object
    add: decor.symbol.kubera_yantra
    transform: {position: inside safe, or: on_wall_behind(safe)}
    cost: low
    effort: low
    reversible: true
    copy: Where the safe is bolted in place, the traditional stand-in is a small Kubera symbol placed inside it or on the wall behind.
conflicts_with: [SAFE-SEC-003]
supersedes: []
requires_rules: []
tags: [safe, locker, kubera, wealth, north]
localization_notes: In Indian practice this is the "tijori" or locker rule and it is asked about constantly; use the local word.
```

#### Why — tradition

North is *Kubera's* direction, the treasury of the mandala, so Vastu asks that the door of a safe,
locker or *tijori* open toward the north — which in practice means standing it against a south or
west wall. Practitioners split on the room: one camp keeps valuables in the south-west, the zone
of retention, with the door still facing north; the other places the locker in the north room
itself. Two consistent secondary points: nothing reflective should face the locker door, and the
fire zone in the south-east is refused.

#### Why — psychology / physiology

`No direct empirical support; there is no mechanism by which a safe's bearing affects finances.`
The genuinely useful adjacent facts are security ones, and they mostly agree with the traditional
placement by accident: a safe should be anchored to structure (an unbolted domestic safe is
simply carried out), sited out of sightline from windows and the front door, and placed in a
low-traffic room rather than an obvious one. Placing it against a solid interior wall in the
household heads' room satisfies all three.

#### Customer insight

Vastu links the north with Kubera, the keeper of wealth, so it asks that your safe open toward
the north — stand it against the south or west wall. Practical note from us while you are at it:
bolt it down and keep it out of view from the window. That part is not tradition, it is theft
prevention.

#### Failure modes / when to skip

Skip where the safe is a built-in wall unit or a floor safe whose orientation is fixed. Security
outranks direction: if the only north-opening position puts the safe in view of a window or on a
route a stranger walks, `SAFE-SEC-003` wins. Never publish or store the safe's location in a
shared or exported layout file — flag it as private in the scene graph.

---

### VS-ROOM-012 — Kitchen in the south-east (Agni), north-west as alternate

```yaml
id: VS-ROOM-012
title: Kitchen in the south-east (Agni), north-west as alternate
system: vastu.directional
group: kitchen_zoning
version: 1
status: active
applies_to:
  rooms: [kitchen, eat_in_kitchen, butlers_pantry]
  objects: []
  requires_features: []
scope: room_adjacency
severity: high
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let z = dominantVastuZone(room, home)
  assert z not in p.forbidden_kitchen_zones
  prefer z == SE
  penalize(z == NW, weight=1)                            # accepted alternate, mild penalty only
  penalize(z in p.discouraged_kitchen_zones, weight=3)
  forbid alignedWithin(room.primaryDoor.openingAxis, home.primaryEntranceOpening.openingAxis, tol_deg=p.head_on_tol_deg)
        if distance(centroid(room.primaryDoor), centroid(home.primaryEntranceOpening)) <= p.entrance_sightline_m
params:
  - key: forbidden_kitchen_zones
    default: [NE, CENTER]
    range: any_subset_of_9_zones
    unit: enum_list
    user_editable: true
    rationale: NE is the water/prayer zone and the centre is the Brahmasthan; both refuse fire in every lineage.
  - key: discouraged_kitchen_zones
    default: [SW, N]
    range: any_subset_of_9_zones
    unit: enum_list
    user_editable: true
    rationale: Tolerated with remedies in modern practice but not preferred.
  - key: head_on_tol_deg
    default: 15.0
    range: [5.0, 30.0]
    unit: deg
    user_editable: true
    rationale: Whether the kitchen door counts as "directly facing" the front door.
  - key: entrance_sightline_m
    default: 6.000
    range: [2.000, 15.000]
    unit: m
    user_editable: true
    rationale: Distance (about 20 ft) within which the kitchen door being visible from the entrance is scored.
score:
  weight: 8
  curve: step
  partial_credit: true
remedies:
  - rank: 1
    action: reassign_room
    target: kitchen
    transform: {relocate_to_zone: SE}
    cost: high
    effort: contractor
    reversible: false
    copy: Relocating a kitchen means moving gas, water and drainage - real money. We will only suggest it if you are already renovating.
  - rank: 2
    action: move_object
    target: kitchen.range.*
    transform: {to_zone: SE, within: room}
    cost: medium
    effort: contractor
    reversible: false
    copy: When the room cannot move, moving the hob into the south-east corner of the kitchen you have is the accepted correction.
  - rank: 3
    action: apply_finish
    target: room.finishes.wall
    transform: {palette: p.zone_palette[SE]}
    cost: low
    effort: low
    reversible: true
    copy: Colour is the low-cost traditional stand-in - warm reds, oranges and terracotta for the fire zone.
conflicts_with: [ERG-KIT-002, DAY-ORI-005, VS-CONF-002]
supersedes: []
requires_rules: [VS-GRID-001]
tags: [kitchen, agni, southeast, signature_rule]
localization_notes: Gas-cylinder kitchens (LPG) are common in India; the SE placement also affects cylinder storage - see VS-ROOM-014.
```

#### Why — tradition

The south-east is *Āgneya*, the quarter of *Agni*, and the kitchen is the household's fire, so the
assignment is one of the most stable in the system. The north-west, the zone of *Vāyu*, is the
accepted second choice because wind supports fire. The absolute refusals are the north-east — the
water and prayer quarter — and the Brahmasthan. A widely repeated secondary rule holds that the
kitchen should not be the first thing visible from the main entrance, on the reasoning that the
household's nourishment should not be exposed to every arrival.

#### Why — psychology / physiology

The thermal logic is real and specific to the latitudes where Vastu developed. A kitchen generates
heat and steam; placing it on the south-east face means it takes morning sun and is shaded during
the afternoon peak, so the room's own gains do not add to the worst solar hour, and morning sun
dries and ventilates a space that in pre-refrigeration households needed exactly that. Placing a
kitchen on the west or south-west stacks the day's hottest solar load on top of cooking load —
which is why the tradition discourages it and why building physics agrees. The prohibition on the
kitchen facing the entrance has no empirical basis, though there is a real functional point: a
kitchen door on the entry axis puts cooking smells and noise in the arrival sequence.

#### Customer insight

Vastu puts the kitchen in the south-east, the corner it associates with fire — and in a hot
climate that also keeps the hottest room out of the afternoon sun. If the kitchen cannot move,
tradition accepts moving just the hob into the south-east corner instead, which is far cheaper.

#### Failure modes / when to skip

Never propose relocating a kitchen unless the user has flagged a renovation; surface the cost band
honestly. Skip in studio apartments and any home with a single-wall kitchenette. Where gas supply,
the flue route or the drainage fall make the south-east physically impossible, say so and go to
remedy rank 2 or 3 rather than repeating the finding.

---

### VS-ROOM-013 — Hob in the south-east of the kitchen; the cook faces east

```yaml
id: VS-ROOM-013
title: Hob in the south-east of the kitchen; the cook faces east
system: vastu.directional
group: kitchen_zoning
version: 1
status: active
applies_to:
  rooms: [kitchen, eat_in_kitchen]
  objects: [kitchen.range.gas, kitchen.range.electric, kitchen.cooktop.*, kitchen.stove.portable]
  requires_features: []
scope: object_placement
severity: high
confidence: tradition
evidence_class: traditional
belief_gated: true
predicate: |
  let hob = target
  let cookStation = occupantStation(hob, side=front)
  prefer vastuZone(centroid(hob), room) == SE
  penalize(vastuZone(centroid(hob), room) in [NE, N], weight=4)
  assert compassOctant(occupantFacingBearing(cookStation)) in p.cook_facing_octants
  prefer compassOctant(occupantFacingBearing(cookStation)) == E
  forbid isUnder(hob, nearestOpening(room, window))
  assert clearance(hob, left) >= p.landing_left_m and clearance(hob, right) >= p.landing_right_m
  prefer lineOfSight(cookStation.eyePoint, room.primaryDoor.centroid) == true
params:
  - key: cook_facing_octants
    default: [E, NE, N]
    range: any_subset_of_octants
    unit: enum_list
    user_editable: true
    rationale: East is the doctrine; north is accepted by several practitioners when east is impossible.
  - key: landing_left_m
    default: 0.300
    range: [0.230, 0.600]
    unit: m
    user_editable: false
    jurisdiction_varies: true
    rationale: NKBA recommends 12 in of landing on one side of a cooking surface; hard ergonomic minimum, not Vastu.
  - key: landing_right_m
    default: 0.380
    range: [0.300, 0.750]
    unit: m
    user_editable: false
    jurisdiction_varies: true
    rationale: NKBA recommends 15 in on the other side; hard ergonomic minimum.
  - key: allow_cook_back_to_door
    default: true
    range: [true, false]
    unit: bool
    user_editable: true
    rationale: Set false to force the feng-shui-compatible resolution where the cook can see the door; see VS-CONF-002.
score:
  weight: 8
  curve: step
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: kitchen.cooktop.*
    transform: {to_zone: SE, set: occupantFacingBearing -> E}
    cost: high
    effort: contractor
    reversible: false
    copy: Moving the hob to the south-east so you cook facing east means moving the gas point and the extractor - get a quote first.
  - rank: 2
    action: add_object
    add: kitchen.stove.portable
    transform: {position: counter_in_zone(SE), set: occupantFacingBearing -> E}
    cost: low
    effort: low
    reversible: true
    copy: Many families keep a single portable burner in the south-east facing east for daily cooking and leave the built-in hob where it is.
  - rank: 3
    action: add_object
    add: decor.mirror.small
    transform: {position: wall_in_front_of(cookStation), so_that: lineOfSight(cookStation.eyePoint, door.centroid) via_reflection}
    cost: low
    effort: low
    reversible: true
    copy: If cooking facing east puts your back to the door, a small mirror or a reflective splashback lets you see who comes in.
conflicts_with: [FS-CMD-006, ERG-KIT-003, SAFE-FIRE-004, VS-CONF-002]
supersedes: []
requires_rules: [VS-ROOM-012]
tags: [kitchen, hob, cook_facing, agni, signature_rule, conflict_prone]
localization_notes: In Indian kitchens the hob is often on a platform in the SE with the cook facing east by default; in Western galley kitchens this frequently cannot be satisfied.
```

#### Why — tradition

Two instructions combine here and they are usually stated together: the cooking fire belongs in
the south-east of the kitchen, and the cook should face east while cooking. The first follows from
*Agni's* quarter; the second from the east as *Indra's* direction and the direction of the rising
sun, and from the older practice of offering the first food eastward. Because the cook stands in
front of the hob, "hob in the south-east" and "cook faces east" together fix the hob against the
kitchen's west-facing surface within the south-east cell, which is why Indian kitchen platforms
are so often laid out exactly that way.

#### Why — psychology / physiology

`No direct empirical support for the facing direction.` What the geometry does do, unavoidably, is
determine where the cook's back is — and the things that genuinely matter at a hob are all
measurable: landing space either side (NKBA recommends 12 in on one side and 15 in on the other),
not siting a hob under an openable window where curtains and draughts meet flame, extraction
directly over the burners, and being able to see the room behind you if children are in it. The
tradition's east-facing instruction sometimes delivers that supervision and sometimes destroys it,
depending on where the kitchen door is. That is a real conflict, handled in `VS-CONF-002`.

#### Customer insight

Vastu asks you to cook facing east, with the hob in the south-east of the kitchen — which is how
most traditional Indian kitchen platforms are built. If your hob cannot move, a lot of families
keep a single portable burner in that corner for everyday cooking. One thing we will insist on
regardless: 12–15 in of clear worktop either side of the flame, and never a hob under an opening
window.

#### Failure modes / when to skip

Skip for induction-only kitchens where the user does not consider the appliance a "fire" — ask.
Skip single-wall and galley kitchens where the hob position is dictated by the extract duct route.
The landing clearances and the no-hob-under-window rule are ergonomic and fire-safety minimums and
override the direction outright. If the east-facing position puts the cook's back to a door with
toddlers present, `SAFE-CHLD-*` wins and the app must say which rule it chose and why.

---
