# Feng Shui — Five Elements (Wu Xing): Materials, Colours and Shapes
<!-- library-file: v1 | system(s): feng_shui.five_elements, feng_shui.compass.bagua, feng_shui.four_pillars_personal, materials.tactility, psych.color, lighting.photometric | rule-id-prefixes: FS-ELEM, FS-MAT, FS-COLR, FS-SHAPE | author-agent: fs-06-five-elements -->

## Scope

This file is the engine's **five-element (Wu Xing) layer**. It does four jobs:

1. **Publishes the relation matrix.** The generating (相生 *sheng*), controlling/overcoming
   (相克 *ke*), weakening/draining (洩 *xie*) and insulting/rebellion (相侮 *xiang wu*)
   relations as machine-readable constant tables (`FS-ELEM-001`).
2. **Classifies real stuff into elements.** Every material class, colour family (with hue
   ranges so a hex value can be classified), shape family and lighting colour temperature
   the app can encounter (`FS-MAT-*`, `FS-COLR-*`, `FS-SHAPE-*`, `FS-ELEM-022`).
3. **Scores element balance for a room** from coverage percentages plus object counts, and
   detects dominance, deficiency, clashes in adjacency, sector conflicts and stacking
   conflicts (`FS-ELEM-003` … `FS-ELEM-021`).
4. **Prescribes remedies** in the traditionally-preferred order (drain before you clash),
   plus personal (Four Pillars) and seasonal modulation (`FS-ELEM-023`, `FS-ELEM-024`).

**Three honesty notes that apply to the whole file.**

- *The element assignments are doctrine, not measurement.* Wu Xing is a correspondence
  system from Warring States–period Chinese natural philosophy, elaborated through
  *Huangdi Neijing*–lineage medicine and the *Yijing*/*bagua* tradition. Nothing in it was
  derived from, or has been validated by, experiment. Every rule here is
  `confidence: tradition` unless a genuinely independent mechanism exists, in which case
  the rule says exactly which part is evidence-backed and which part is tradition.
- *The numeric thresholds are an app design choice.* Classical texts give no coverage
  percentages. "An element counts as dominant above 35% of weighted visual coverage" is
  **our** operationalisation, chosen so that at most two elements can be dominant at once.
  Every such number is a `param` with `app_design_choice: true` in its rationale. Do not
  present these figures to users as doctrine. Practitioners genuinely disagree about what
  a good elemental balance even looks like; the engine must not pretend otherwise.
- *Material→element assignment is contested for several classes* (glass, mirror, plastic,
  leather, silk, terracotta). `FS-MAT-002` handles this explicitly: contested classes carry
  a primary assignment, an alternate assignment, and a user-visible override.

**Conventions used in `applies_to`.** `ANY_ROOM` = every RoomType in the contract's §3 enum.
`ANY_OBJECT` = every ObjectType in the §4 namespace. `ANY_SECTOR` = all eight octants plus
`center`. These are expansion tokens, not new enum members.

**Hemisphere.** Per contract §1, element/compass logic is hemisphere-invariant. A south-facing
wall in Sydney is still the Li/fire sector. Only daylight and CCT-derived rules
(`FS-ELEM-022`, `FS-COLR-010`) consult `site.hemisphere`, and only for the *daylight* term.

## Rule count: 56

## Rules

### FS-ELEM-001 — Canonical five-element taxonomy and relation matrix

```yaml
id: FS-ELEM-001
title: Canonical five-element taxonomy and relation matrix
system: feng_shui.five_elements
group: element_core
version: 1
status: active
applies_to:
  rooms: [ANY_ROOM]
  objects: [ANY_OBJECT]
  requires_features: []
scope: room_composition
severity: advisory
confidence: tradition
evidence_class: traditional
belief_gated: false
predicate: |
  # Constant-table rule. Publishes the matrix every other rule in this file reads.
  # Makes no assertion about the scene; it exists so the tables live in exactly one place.
  let ELEMENTS = [wood, fire, earth, metal, water]

  # 相生 sheng — "A generates B" (mother -> child)
  let SHENG = {wood: fire, fire: earth, earth: metal, metal: water, water: wood}

  # 相克 ke — "A controls / overcomes B"
  let KE    = {wood: earth, earth: water, water: fire, fire: metal, metal: wood}

  # Derived inverses
  let PARENT_OF     = invert(SHENG)   # {fire: wood, earth: fire, metal: earth, water: metal, wood: water}
  let CONTROLLER_OF = invert(KE)      # {earth: wood, water: earth, fire: water, metal: fire, wood: metal}

  # 洩 xie — weakening/draining: a child drains its mother.
  # DRAINS[a] = the element that a depletes by being generated from it.
  let DRAINS = PARENT_OF              # wood drains water, fire drains wood, etc.

  # For any ordered pair (a,b), a != b, exactly one of four relations holds:
  #   generates       b == SHENG[a]
  #   generated_by    a == SHENG[b]        (a drains b  -> the xie relation)
  #   controls        b == KE[a]
  #   controlled_by   a == KE[b]
  assert forEach(a in ELEMENTS, forEach(b in ELEMENTS,
    (a == b) or (elementRelationFull(a,b) in [generates, generated_by, controls, controlled_by])))

  # 相侮 xiang wu — insulting/rebellion is NOT a static relation. It is the dynamic state
  # where the controlled element overwhelms its controller. See FS-ELEM-026.

  # Trigram / octant element assignment (Later Heaven bagua, 後天八卦)
  let SECTOR_ELEMENT = {N: water,  NE: earth, E: wood,  SE: wood,
                        S: fire,   SW: earth, W: metal, NW: metal, center: earth}
  let SECTOR_TRIGRAM = {N: kan, NE: gen, E: zhen, SE: xun,
                        S: li,  SW: kun, W: dui,  NW: qian}

  # Yin/yang polarity of each element's usual expression. Used for tie-breaks only.
  let POLARITY = {fire: yang, wood: yang, earth: neutral, metal: yin_or_yang, water: yin}

  # Seasonal rulership (see FS-ELEM-024)
  let SEASON_ELEMENT = {spring: wood, summer: fire, late_summer: earth,
                        autumn: metal, winter: water}
params:
  - key: sector_element_school
    default: later_heaven
    range: [later_heaven, early_heaven]
    unit: enum
    user_editable: false
    rationale: >
      Feng shui uses the Later Heaven (Hou Tian) bagua for spatial/directional work; the
      Early Heaven arrangement is used for divination and time. Exposed only so the table
      is auditable. Changing it would invalidate every sector rule in this library.
  - key: expose_relation_names_in_ui
    default: true
    range: [true, false]
    unit: bool
    user_editable: true
    rationale: >
      Whether the app shows the Chinese relation names (sheng/ke/xie) alongside the plain
      English. Belief-motivated users ask for them; first-time designers find them noise.
score:
  weight: 1
  curve: step
  partial_credit: false
remedies: []
conflicts_with: []
supersedes: []
requires_rules: []
tags: [five_elements, wu_xing, foundation, constant_table, signature_rule]
localization_notes: >
  Relation names should ship romanised (sheng/ke) with the Chinese characters available, not
  translated away. "Ke" is variously rendered controlling, overcoming, destroying or
  conquering in English sources; the library standardises on "controls" for the static
  relation and "overwhelms" for the pathological excess described in FS-ELEM-026.
```

#### Why — tradition
Wu Xing (五行, "five phases") is the correspondence system underlying almost all of classical
feng shui: Form School reads landforms as elemental shapes, Compass School assigns an element
to each of the eight trigrams of the Later Heaven bagua, Eight Mansions and Flying Stars both
resolve auspiciousness partly through element relations, and Four Pillars applies the same
matrix to a person. The generating cycle (wood feeds fire, fire makes ash which is earth,
earth yields metal, metal carries/condenses water, water nourishes wood) and the controlling
cycle (wood breaks earth, earth dams water, water quenches fire, fire melts metal, metal cuts
wood) are stated consistently across the Chinese-medicine and feng shui literatures — there is
no school-level disagreement about the matrix itself. The two secondary cycles come from the
medical tradition: *xie* (draining, a child depleting its mother) and *xiang wu* (insulting,
where the controlled phase rebels against an enfeebled controller). Modern BTB/Western feng
shui keeps the same matrix but applies it to a fixed room-entry bagua rather than a compass.

#### Why — psychology / physiology
No direct empirical support; the matrix is a classificatory scheme, not a causal model, and
nothing in it makes a falsifiable prediction about human response. Its plausible mechanism is
purely cognitive: a five-category system with explicit pairwise relations is a *design
heuristic generator*. It forces a designer to audit a room along five orthogonal-ish axes
(vertical/growthful, hot/luminous, heavy/horizontal, hard/cool/precise, dark/fluid/reflective)
and it supplies a rule for what to do when one axis saturates. That is functionally similar to
what a contemporary designer means by "this room needs more contrast in material temperature."
The system's value in this app is as a *structured checklist with good coverage*, and several
of its downstream prescriptions do coincide with evidence-backed ones — those coincidences are
flagged rule by rule.

#### Customer insight
Feng shui sorts everything in your home into five families — Wood, Fire, Earth, Metal and
Water — and it has clear ideas about which families feed each other and which fight. We use
that map to spot rooms that have gone lopsided, like an all-grey-and-glass living room with
nothing warm or growing in it. It's a tradition, not a measurement, but it's a genuinely good
checklist for noticing what a room is missing.

#### Failure modes / when to skip
This rule never fires as a finding and never scores; it is a table. If the user has no belief
system enabled, downstream rules are gated off but the tables still load, because
`FS-MAT-014` (touch temperature) and the composition rules consume the material
classification independently of belief. Do not surface the matrix as an onboarding screen for
the "new homeowner" persona — it reads as homework. Surface it only on demand, or inline as
the explanation of a specific finding.

### FS-ELEM-002 — Element derivation precedence for any object or surface

```yaml
id: FS-ELEM-002
title: Element derivation precedence for any object or surface
system: feng_shui.five_elements
group: element_core
version: 1
status: active
applies_to:
  rooms: [ANY_ROOM]
  objects: [ANY_OBJECT]
  requires_features: []
scope: room_composition
severity: advisory
confidence: tradition
evidence_class: traditional
belief_gated: false
predicate: |
  # Resolves Object.five_element deterministically. MUST be stable: the same object in the
  # same room always resolves to the same element vector, independent of evaluation order.
  let o = target

  # Every object resolves to a WEIGHTED VECTOR over the five elements, not a single element.
  # A brass-framed glass coffee table is genuinely part metal, part water.
  let v = zeroVector(ELEMENTS)

  # Tier 1 — explicit authored/user override wins outright.
  if defined(o.five_element_override):
      let v = unitVector(o.five_element_override)
  else if defined(o.five_element):                         # catalogue-authored
      let v = unitVector(o.five_element)
  else:
      # Tier 2 — material, weighted by that material's share of visible surface.
      forEach(m in o.materials,
        let v = v + scale(elementOfMaterial(m.class), p.w_material * m.share))
      # Tier 3 — colour, weighted by declared coverage_pct.
      forEach(c in o.colors,
        let v = v + scale(elementOfColorHex(c.hex), p.w_color * (c.coverage_pct / 100)))
      # Tier 4 — silhouette/shape.
      let v = v + scale(elementOfShape(o), p.w_shape)
      # Tier 5 — functional/archetypal element from ObjectType (candles=fire, aquarium=water).
      let v = v + scale(elementOfObjectType(o.type), p.w_function)
      # Tier 6 — emissions are strong functional signals, applied last and hardest.
      if (heat in o.emits) or (smoke in o.emits): let v = v + scale(unitVector(fire), p.w_emits)
      if (water in o.emits) or (steam in o.emits): let v = v + scale(unitVector(water), p.w_emits)
      if (light in o.emits): let v = v + scale(elementOfCCT(ccdAt(centroid(o))), p.w_emits * 0.5)

  let v = normalise(v)
  # An object's "primary element" is only reported when one component clearly leads.
  assert (max(v) >= p.primary_element_min_share) implies (primaryElementOf(o) == argmax(v))
  prefer max(v) >= p.primary_element_min_share      # otherwise object is reported as "mixed"
params:
  - key: w_material
    default: 1.0
    range: [0.0, 2.0]
    unit: weight
    user_editable: false
    rationale: >
      Material is the strongest signal in traditional practice — an oak table is Wood whatever
      colour it is painted. Reference weight; all other tier weights are relative to this.
  - key: w_color
    default: 0.55
    range: [0.0, 2.0]
    unit: weight
    user_editable: true
    rationale: >
      Colour is a real but weaker signal than substance. App design choice, not doctrine;
      practitioners who work primarily with colour (much of BTB/Western practice) would raise
      this toward 1.0.
  - key: w_shape
    default: 0.35
    range: [0.0, 2.0]
    unit: weight
    user_editable: true
    rationale: App design choice. Form School weights shape heavily for buildings, less for furniture.
  - key: w_function
    default: 0.8
    range: [0.0, 2.0]
    unit: weight
    user_editable: false
    rationale: >
      Archetypal/functional element (a stove is Fire regardless of its stainless steel body).
      High because traditional sources reason about function first for fixtures.
  - key: w_emits
    default: 1.2
    range: [0.0, 3.0]
    unit: weight
    user_editable: false
    rationale: >
      Actual heat, flame, steam or running water is the least ambiguous elemental signal
      available and dominates the stainless-steel-kettle problem.
  - key: primary_element_min_share
    default: 0.40
    range: [0.25, 0.80]
    unit: fraction
    user_editable: true
    rationale: >
      Below this the object is reported as "mixed" rather than labelled. App design choice
      chosen so a two-material object with a 60/40 split still gets a label but a
      genuinely four-material object does not.
score:
  weight: 1
  curve: step
  partial_credit: false
remedies: []
conflicts_with: []
supersedes: []
requires_rules: [FS-ELEM-001]
tags: [five_elements, derivation, determinism, foundation]
localization_notes: >
  The word "mixed" in UI copy should not be translated as "unbalanced" or "impure" — in some
  markets those read as a fault. Prefer "a bit of everything".
```

#### Why — tradition
Classical practice reads an object's element from what it *is* and what it *does* before what
colour it is: a hearth is Fire, a mirror is a water-surface, a stone bench is Earth. Colour is
a secondary correspondence (the *wu zheng se*, the five correct colours), and shape a third,
inherited from Form School's reading of mountains and building silhouettes. Practitioners do
not agree on a fixed hierarchy — this precedence order is our reconstruction of the most
common reasoning pattern, and it is the engine's convention rather than a quoted doctrine.
Modern BTB/Western schools lean much harder on colour than classical ones, which is why
`w_color` is user-editable.

#### Why — psychology / physiology
No direct empirical support for the precedence order as such. There is, however, a real
perceptual reason material should outrank colour: material identity is carried by specular
highlight structure, micro-texture and inferred thermal properties, which observers use to
recognise substance rapidly and fairly independently of hue, whereas painted colour is
recognised as a surface coating and attributed to the coat rather than the object. The
practical consequence — that a white-painted oak chair still reads as a wooden chair — is
uncontroversial in material perception research even though the feng shui framing is not.

#### Customer insight
We work out a piece's element from what it's actually made of first, then its colour, then its
shape. That's why your white-painted oak sideboard still counts as Wood: paint changes the
look, not the substance. You can always overrule us on any single piece.

#### Failure modes / when to skip
Objects with no `materials` array and no catalogue element (user-drawn boxes, imported
third-party models) will resolve on colour and shape alone and can be badly wrong — such
objects must be tagged `element_low_confidence` and excluded from dominance findings unless
they exceed `p.primary_element_min_share` by a clear margin. Do not run this on structural
`Feature` records; features use `FS-MAT-008` finish logic instead. Very large mixed-material
objects (a fitted kitchen, a modular wall system) should be decomposed before derivation, or
they will single-handedly swing a room's coverage vector.

### FS-ELEM-003 — Room element coverage vector and dominance threshold

```yaml
id: FS-ELEM-003
title: Room element coverage vector and dominance threshold
system: feng_shui.five_elements
group: element_balance
version: 1
status: active
applies_to:
  rooms: [ANY_ROOM]
  objects: [ANY_OBJECT]
  requires_features: []
  min_room_area_m2: 2.0
scope: room_composition
severity: medium
confidence: tradition
evidence_class: traditional
belief_gated: true
predicate: |
  let r = room
  # Weighted coverage. Surfaces dominate because they are what the eye actually sees.
  let surf = 0
  forEach(s in [floor, wall, ceiling],
    let surf = surf + finishArea(r, s) * p.w_surface[s])

  let cov = zeroVector(ELEMENTS)
  # 1. Architectural finishes
  forEach(s in [floor, wall, ceiling],
    let cov = cov + scale(elementOfMaterial(r.finishes[s].material),
                          finishArea(r,s) * p.w_surface[s] / surf * p.share_finishes)
              + scale(elementOfColorHex(r.finishes[s].color_hex),
                          finishArea(r,s) * p.w_surface[s] / surf * p.share_finishes * p.w_finish_color))
  # 2. Objects, weighted by visible surface area (not footprint: a tall wardrobe reads big)
  let objArea = sum(forEach(o in r.objects, visibleSurfaceArea(o)))
  forEach(o in r.objects,
    let cov = cov + scale(elementVectorOf(o), visibleSurfaceArea(o) / objArea * p.share_objects))
  # 3. Object COUNT term — five candles read as more Fire than their surface area implies
  forEach(e in ELEMENTS,
    let cov = cov + scale(unitVector(e),
                          min(1.0, countOf(objectsWithPrimaryElement(e), r) / p.count_saturation_n)
                          * p.share_counts))
  # 4. Artificial light colour temperature
  let cov = cov + scale(elementOfCCT(ccdAt(centroid(r))), p.share_lighting)

  let cov = normalise(cov)
  assert abs(sum(cov) - 1.0) <= 0.001                      # determinism check

  let dominant = forEach(e in ELEMENTS, e where cov[e] >= p.dominance_pct / 100)
  # A single element above the hard cap is always a finding.
  assert forEach(e in ELEMENTS, cov[e] <= p.hard_dominance_pct / 100)
  # Two or more elements above the dominance threshold is acceptable; three is not,
  # because the threshold is calibrated so that cannot happen without a scoring bug.
  assert count(dominant) <= 2
  penalize(max(cov) - p.dominance_pct / 100, weight = p.dominance_penalty_weight)
params:
  - key: dominance_pct
    default: 35
    range: [20, 60]
    unit: percent
    user_editable: true
    rationale: >
      APP DESIGN CHOICE, NOT DOCTRINE. No classical source gives a percentage. 35% is chosen
      because with five elements the even share is 20%, so 35% is a clear 1.75x over-share,
      and because at most two elements can exceed it simultaneously. Strict practitioners
      would lower it; "reorienter" users on a budget should raise it to reduce nagging.
  - key: hard_dominance_pct
    default: 55
    range: [40, 85]
    unit: percent
    user_editable: true
    rationale: >
      APP DESIGN CHOICE. The level above which a room is called single-element regardless of
      user strictness. Deliberately above the 45% wood coverage that Tsunetsugu, Miyazaki &
      Sato (J Wood Sci 53:11-16, 2007) found most subjectively comfortable, so the engine
      does not flag the one coverage figure with an empirical comfort optimum behind it.
  - key: share_finishes
    default: 0.45
    range: [0.2, 0.7]
    unit: fraction
    user_editable: false
    rationale: Floor, wall and ceiling finishes are the largest visible areas in nearly every room.
  - key: share_objects
    default: 0.33
    range: [0.15, 0.6]
    unit: fraction
    user_editable: false
    rationale: Furniture and decor surface area.
  - key: share_counts
    default: 0.12
    range: [0.0, 0.3]
    unit: fraction
    user_editable: false
    rationale: >
      Captures the traditional habit of counting element-bearing items (three candles, a pair
      of metal lamps) rather than measuring them.
  - key: share_lighting
    default: 0.10
    range: [0.0, 0.25]
    unit: fraction
    user_editable: true
    rationale: >
      Lamp colour temperature as an element contribution. A modern extension with no classical
      basis (classical sources predate electric light) — see FS-ELEM-022.
  - key: count_saturation_n
    default: 6
    range: [2, 20]
    unit: count
    user_editable: false
    rationale: Item count at which the count term saturates, so 40 books do not make a room 100% Wood.
  - key: w_surface
    default: {floor: 1.0, wall: 1.0, ceiling: 0.6}
    range: [0.0, 1.5]
    unit: weight
    user_editable: false
    rationale: >
      Ceilings are discounted because occupants spend far less gaze time on them; floors and
      walls carry the room's read. App design choice.
  - key: w_finish_color
    default: 0.6
    range: [0.0, 1.5]
    unit: weight
    user_editable: true
    rationale: Colour contribution of a finish relative to its material contribution.
  - key: dominance_penalty_weight
    default: 6
    range: [0, 10]
    unit: weight
    user_editable: false
    rationale: Slope of the score penalty once an element passes the dominance threshold.
score:
  weight: 7
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: recolor_surface
    target: room.finishes.wall
    transform: {to_element: leastPresentElement(room), keep_lrv_within: 0.15}
    cost: low
    effort: medium
    reversible: true
    copy: Repaint one wall in a colour from the family this room is missing — it is the cheapest way to move the balance.
  - rank: 2
    action: swap_material
    target: softgoods.rug.*
    transform: {to_element: leastPresentElement(room)}
    cost: medium
    effort: low
    reversible: true
    copy: Change the rug. A rug is typically 8-15% of a room's visible surface, so swapping one moves the balance more than any other single object.
  - rank: 3
    action: add_object
    add: decor.accessory.set
    transform: {element: leastPresentElement(room), count: 3, distribute: across_sectors}
    cost: low
    effort: low
    reversible: true
    copy: Add three small pieces from the missing family, spread around the room rather than clustered on one shelf.
conflicts_with: [COMP-BAL-004, COLOR-HARM-002]
supersedes: []
requires_rules: [FS-ELEM-001, FS-ELEM-002]
tags: [five_elements, coverage, balance, scoring, signature_rule]
localization_notes: >
  Report coverage as percentages in all locales; do not convert to fractions or ratios.
  Imperial/metric is irrelevant here but the per-surface areas quoted in explanation copy must
  follow contract 1 (m2 with ft2 in prose).
```

#### Why — tradition
Classical practice does not compute percentages — a practitioner walks a room and pronounces
it "too much Metal" from the overall impression, sometimes counting element-bearing objects.
Quantifying that impression as weighted visual coverage is our engineering translation, and we
label it as such. What *is* traditional is the underlying claim: a room in which one of the
five phases overwhelms the others is out of balance and the occupants' experience will tilt
toward that phase's qualities. Both classical Compass/Form schools and modern BTB practice
share that claim; neither supplies a number, and practitioners openly disagree about what a
good balance looks like.

#### Why — psychology / physiology
No direct empirical support for the five-element coverage model. One adjacent finding is worth
stating precisely because it is the only coverage-percentage result with real data behind it:
Tsunetsugu, Miyazaki & Sato (*Journal of Wood Science* 53:11–16, 2007) exposed participants to
full-size model rooms with wood covering 0%, 45% and 90% of ceiling, walls and floor; the 45%
room tended to score highest on subjective comfort, while the 90% room produced large blood
pressure drops but also a rapid fall in measured brain activity. A systematic review of
randomised trials on visual wood exposure (Lipovac & Burnard, *Indoor and Built Environment*,
2021) covered nine studies and concluded that benefits to stress indicators are plausible but
the evidence base is limited. That supports a general "moderate coverage beats saturation"
intuition for one material. It does not validate the five-element scheme.

#### Customer insight
We measure roughly how much of what you see belongs to each of the five families, then flag it
when one takes over more than about a third of the room. Interestingly, the one material
that's actually been studied — wood — tested best at around 45% coverage rather than
wall-to-wall, which fits the tradition's instinct that saturation is not the goal.

#### Failure modes / when to skip
Skip on rooms under 2 m² (22 ft²) and on `reach_in_closet`, `linen_closet`,
`utility_mechanical` and `basement_unfinished`, where a single finish legitimately dominates
and a finding is noise. Skip on `workshop_garage` and `garage_parking` unless the user
explicitly opted those rooms in. In `open_plan_combined` and `studio_apartment`, compute per
functional zone as well as per room and report the zone result, or a large open plan will
always look averaged-out and balanced. Rooms whose objects are mostly `element_low_confidence`
(see `FS-ELEM-002`) must report a confidence caveat rather than a score.

### FS-ELEM-004 — Deficient or absent element detection

```yaml
id: FS-ELEM-004
title: Deficient or absent element detection
system: feng_shui.five_elements
group: element_balance
version: 1
status: active
applies_to:
  rooms: [ANY_ROOM]
  objects: [ANY_OBJECT]
  requires_features: []
  min_room_area_m2: 4.0
scope: room_composition
severity: medium
confidence: tradition
evidence_class: traditional
belief_gated: true
predicate: |
  let cov = elementCoverageVector(room)
  let absent    = forEach(e in ELEMENTS, e where cov[e] < p.absent_pct / 100)
  let deficient = forEach(e in ELEMENTS, e where cov[e] < p.deficient_pct / 100
                                            and cov[e] >= p.absent_pct / 100)
  # Water is the element most often genuinely missing in real homes; it gets its own check
  # because the usual remedy (an actual water feature) is high-maintenance and the engine
  # should prefer surrogates.
  assert count(absent) == 0
  penalize(count(absent) * p.absent_penalty + count(deficient) * p.deficient_penalty, weight = 5)
  # Do not report an element as missing if the room's FUNCTION target says it should be low.
  forbid reportFinding(e) where roomFunctionElementTarget(room.type)[e].max_pct < p.deficient_pct
params:
  - key: deficient_pct
    default: 7
    range: [2, 18]
    unit: percent
    user_editable: true
    rationale: >
      APP DESIGN CHOICE. Below roughly a third of the even 20% share, an element reads as
      token rather than present. Strict practitioners raise this toward 12-15%.
  - key: absent_pct
    default: 2
    range: [0, 6]
    unit: percent
    user_editable: true
    rationale: >
      APP DESIGN CHOICE. Effectively "nothing of this family in the room". Kept low so a
      single deliberate accent object counts as presence.
  - key: absent_penalty
    default: 1.0
    range: [0.0, 2.0]
    unit: multiplier
    user_editable: false
    rationale: Score cost per wholly absent element.
  - key: deficient_penalty
    default: 0.4
    range: [0.0, 2.0]
    unit: multiplier
    user_editable: false
    rationale: Score cost per merely thin element.
  - key: allow_deliberate_omission
    default: true
    range: [true, false]
    unit: bool
    user_editable: true
    rationale: >
      Lets the user mark an element as intentionally excluded from a room (common for Water in
      bedrooms and Fire in nurseries) and suppresses the finding permanently for that room.
score:
  weight: 6
  curve: linear
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: plants.plant.potted_medium
    transform: {when: missing == wood, position: near_daylight, min_daylight: 0.35}
    cost: low
    effort: low
    reversible: true
    copy: A living plant near the window is the simplest way to bring in the Wood family — and it is the one remedy with real evidence behind it for mood and perceived air quality.
  - rank: 2
    action: add_object
    add: decor.mirror.wall
    transform: {when: missing == water, avoid: facing_bed, avoid: facing_entry_door}
    cost: low
    effort: low
    reversible: true
    copy: For the Water family, a mirror or a piece of glass stands in for actual water in most modern practice — far less upkeep than a fountain.
  - rank: 3
    action: add_object
    add: decor.bowl.stone
    transform: {when: missing == earth, position: low_surface}
    cost: low
    effort: low
    reversible: true
    copy: A stone or ceramic bowl on a low surface covers the Earth family and needs nothing from you.
  - rank: 4
    action: swap_material
    target: lighting.lamp.table
    transform: {when: missing == metal, to_material: brass_or_steel}
    cost: medium
    effort: low
    reversible: true
    copy: Swap one lamp for a metal one. Metal is usually the easiest family to add without changing the look of the room.
  - rank: 5
    action: add_object
    add: lighting.candle.pillar_set
    transform: {when: missing == fire, count: 3, min_distance_to_combustible_m: 0.3}
    cost: low
    effort: low
    reversible: true
    copy: Candles are the traditional Fire fix. If open flame is not an option, warm-toned lamplight or one genuinely red object does the same job in most practitioners' books.
conflicts_with: [SAFE-FIRE-011, SAFE-CHILD-022]
supersedes: []
requires_rules: [FS-ELEM-001, FS-ELEM-003, FS-ELEM-019]
tags: [five_elements, deficiency, remedies, water_element]
localization_notes: >
  "Missing" is the wrong word in several markets where it implies a defect; prefer
  "not represented yet". Candle remedies must be suppressed in jurisdictions/tenancies where
  open flame is prohibited — see SAFE-FIRE-011.
```

#### Why — tradition
The complement of excess in Wu Xing reasoning is depletion: a cycle with a broken link cannot
circulate, so a room with no Water has nothing to nourish its Wood and nothing to temper its
Fire. Classical remediation is additive and specific — the *xiang sheng* logic says you supply
the missing phase directly or, better, supply *its* mother so it regenerates on its own (see
`FS-ELEM-011`). Water is the element most commonly absent in contemporary homes, and both
classical practitioners and modern BTB schools accept surrogates for it: glass, mirror, black
or deep-blue surfaces, and undulating forms, rather than literal moving water.

#### Why — psychology / physiology
No direct empirical support for element deficiency as a construct. One of the standard
remedies does have independent support: indoor plants. Reviews of indoor-plant studies report
small positive effects on mood, perceived air quality and attention restoration, though effect
sizes are modest and the literature has well-known publication-bias and blinding problems, so
this should be described as suggestive rather than settled. Attention Restoration Theory
(Kaplan & Kaplan) and Ulrich's stress-recovery work give a plausible mechanism for why natural
elements in view help. So the Wood remedy is defensible on its own terms; the Metal and Fire
remedies are not, and are offered as tradition.

#### Customer insight
Feng shui treats a family that's completely absent as a gap in the circle, not just a missing
colour. The good news is gaps are cheap to close: one plant, one mirror, one stone bowl. If
you're leaving a family out on purpose, tell us and we'll stop mentioning it.

#### Failure modes / when to skip
Do not report Fire as missing in `nursery`, `bedroom_child` or `bedroom_teen` — the function
target for those rooms caps Fire, and an "add candles" prompt in a child's room is a safety
liability that must be suppressed by `SAFE-CHILD-022` and `SAFE-FIRE-011`. Do not report Water
as missing in `basement_finished`, `basement_unfinished`, `bathroom_*` or `wet_room`; those
already carry humidity load and adding water symbolism there conflicts with moisture
management. Skip entirely in rooms under 4 m² (43 ft²) and in circulation spaces
(`hallway_corridor`, `stair_core`) where five-element completeness is not a meaningful goal.

### FS-ELEM-005 — Composite five-element balance score

```yaml
id: FS-ELEM-005
title: Composite five-element balance score
system: feng_shui.five_elements
group: element_balance
version: 1
status: active
applies_to:
  rooms: [ANY_ROOM]
  objects: [ANY_OBJECT]
  requires_features: []
  min_room_area_m2: 4.0
scope: room_composition
severity: medium
confidence: tradition
evidence_class: traditional
belief_gated: true
predicate: |
  let cov = elementCoverageVector(room)
  let tgt = roomFunctionElementTarget(room.type)          # see FS-ELEM-019

  # 1. Evenness term: normalised Shannon evenness over the five components.
  #    1.0 = perfectly even, 0.0 = single element.
  let evenness = shannonEvenness(cov, n = 5)

  # 2. Function-fit term: distance from the room's target profile, not from flat 20/20/20/20/20.
  let fit = 1.0 - (sum(forEach(e in ELEMENTS, abs(cov[e] - tgt[e].ideal_pct / 100))) / 2.0)

  # 3. Cycle-integrity term: does the generating cycle close? (see FS-ELEM-025)
  let cycle = cycleIntegrity(cov, min_link_pct = p.cycle_link_pct)

  # 4. Clash term: penalty for element pairs in a controlling relation at close range.
  let clash = clashLoad(room)                             # 0..1, from FS-ELEM-012/019/020

  let balance = p.w_evenness * evenness
              + p.w_fit      * fit
              + p.w_cycle    * cycle
              - p.w_clash    * clash
  assert balance >= p.min_acceptable_balance
  penalize(p.min_acceptable_balance - balance, weight = 7)
  # Report the single largest contributor to the shortfall, never all four at once.
  prefer reportOnly(argmaxShortfall([evenness, fit, cycle, clash]))
params:
  - key: w_evenness
    default: 0.30
    range: [0.0, 1.0]
    unit: weight
    user_editable: true
    rationale: >
      How much the engine values all five families being represented, independent of what the
      room is for. APP DESIGN CHOICE; the four weights should sum to about 1.0.
  - key: w_fit
    default: 0.40
    range: [0.0, 1.0]
    unit: weight
    user_editable: true
    rationale: >
      How much the engine values matching the room's functional element profile. Highest
      weight by default because a kitchen genuinely should not be balanced like a bedroom.
  - key: w_cycle
    default: 0.20
    range: [0.0, 1.0]
    unit: weight
    user_editable: true
    rationale: Weight on the generating cycle closing. Belief-motivated users often raise this.
  - key: w_clash
    default: 0.35
    range: [0.0, 1.0]
    unit: weight
    user_editable: true
    rationale: Penalty weight for controlling-relation clashes at close range.
  - key: min_acceptable_balance
    default: 0.62
    range: [0.35, 0.90]
    unit: score
    user_editable: true
    rationale: >
      APP DESIGN CHOICE. Threshold below which the room gets an element-balance finding.
      Calibrate against a reference set of published interiors before shipping; 0.62 is a
      provisional value, not a doctrine-derived one.
  - key: cycle_link_pct
    default: 5
    range: [1, 15]
    unit: percent
    user_editable: false
    rationale: Minimum coverage for an element to count as a live link in the generating cycle.
  - key: strictness_preset
    default: balanced
    range: [relaxed, balanced, strict, purist]
    unit: enum
    user_editable: true
    rationale: >
      Single user-facing dial that sets dominance_pct, deficient_pct and
      min_acceptable_balance together, so users never have to see four sliders.
      relaxed -> 45/4/0.50, balanced -> 35/7/0.62, strict -> 28/10/0.72, purist -> 24/13/0.80.
score:
  weight: 8
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: report_only
    target: room
    transform: {explain: argmaxShortfall, show: coverage_bar_chart}
    cost: free
    effort: none
    reversible: true
    copy: Here is how the five families currently split up in this room, and which single change moves it most.
  - rank: 2
    action: apply_rule_remedies
    target: room
    transform: {from_rule: dominantElementRule(room), max_remedies: 2}
    cost: varies
    effort: varies
    reversible: true
    copy: Start with the one family that has taken over, not with the ones that are thin — subtracting usually beats adding.
conflicts_with: [COMP-BAL-004, STYLE-MINIMAL-003]
supersedes: []
requires_rules: [FS-ELEM-003, FS-ELEM-004, FS-ELEM-019, FS-ELEM-025]
tags: [five_elements, scoring, composite, strictness, signature_rule]
localization_notes: Present the score as a 0-100 integer in UI; never as a percentage of "correctness".
```

#### Why — tradition
Wu Xing balance is not flatness. Traditional practice wants the right phase emphasised for the
purpose of the space — a kitchen is properly Fire-led, a study properly Water-and-Wood-led —
while keeping the cycle intact and keeping clashing pairs apart. This rule encodes that as four
terms rather than one, because collapsing it to "all five equal" produces bland, functionless
rooms that no practitioner of any school would endorse. The four-term decomposition is our
construction; the four concerns are drawn from standard practice.

#### Why — psychology / physiology
No direct empirical support for the composite score. Two of its terms are independently
defensible on non-feng-shui grounds. The evenness term is close to what composition theory
calls material and tonal variety, and the very-low-variety end of the range corresponds to
environments described in environmental-psychology literature as low in complexity, which is
associated with reduced preference ratings in the Kaplan preference-matrix tradition. The
function-fit term is essentially "does this room's material palette suit its task", which is
ordinary design competence. The cycle-integrity and clash terms have no independent basis at
all and exist because the tradition requires them.

#### Customer insight
We give each room a single balance number so you can see progress, but the number is built
from four things: whether all five families show up, whether the mix suits what the room is
for, whether the circle closes, and whether anything is fighting at close range. Tap it and
we'll tell you which one is dragging it down.

#### Failure modes / when to skip
The threshold is uncalibrated at v1 and will produce false positives on deliberately
monochrome or single-material designs — a wabi-sabi or hardcore minimalist scheme will always
score badly here and the engine must not nag a user who has chosen that style; when a style
pack asserting material restraint is active, drop this rule's weight rather than firing it
(`STYLE-MINIMAL-003`). Never let this score override a safety, accessibility or ergonomic
finding (contract §8 ladder). Do not compute for rooms with fewer than three placed objects —
an empty room is not unbalanced, it is empty, and the generation path should be used instead.

### FS-ELEM-006 — Excess Fire in a room

```yaml
id: FS-ELEM-006
title: Excess Fire in a room
system: feng_shui.five_elements
group: element_excess
version: 1
status: active
applies_to:
  rooms: [ANY_ROOM]
  objects: [ANY_OBJECT]
  requires_features: []
  min_room_area_m2: 4.0
scope: room_composition
severity: medium
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let cov = elementCoverageVector(room)
  let fireCap = roomFunctionElementTarget(room.type)[fire].max_pct / 100
  assert cov[fire] <= fireCap
  # Fire is the element the engine treats most strictly in sleeping and children's rooms.
  if room.type in [bedroom_primary, bedroom_secondary, bedroom_guest, bedroom_child,
                   bedroom_teen, nursery, bedroom_shared_siblings, yoga_meditation_room]:
      assert cov[fire] <= p.fire_cap_restful_pct / 100
  # Corroborating signals that make the finding more confident (and the copy more concrete)
  let signals = count([
    cov[fire] > fireCap,
    countOf(objectsWithPrimaryElement(fire), room) >= p.fire_object_count_cap,
    colorCoverageOfRoom(room, fire) > p.fire_color_cap_pct / 100,
    countOf(pointedForms(room), room) >= p.pointed_form_cap,
    ccdAt(centroid(room)) <= p.fire_cct_k ])
  penalize((cov[fire] - fireCap) * signals, weight = p.fire_penalty_weight)
params:
  - key: fire_cap_restful_pct
    default: 12
    range: [5, 30]
    unit: percent
    user_editable: true
    rationale: >
      APP DESIGN CHOICE. Tighter Fire ceiling for rooms whose job is rest. Chosen well below
      the general dominance threshold so a red accent wall in a bedroom is flagged.
  - key: fire_object_count_cap
    default: 5
    range: [2, 12]
    unit: count
    user_editable: true
    rationale: Number of distinctly Fire objects (candles, red items, pointed forms, heaters) above which the room reads hot.
  - key: fire_color_cap_pct
    default: 15
    range: [5, 40]
    unit: percent
    user_editable: true
    rationale: Red/orange/hot-pink colour coverage ceiling; see FS-COLR-004.
  - key: pointed_form_cap
    default: 4
    range: [1, 10]
    unit: count
    user_editable: true
    rationale: Count of triangular/apexed/sharp-cornered forms above which Fire reads as excessive by shape alone.
  - key: fire_cct_k
    default: 2400
    range: [1800, 3000]
    unit: K
    user_editable: true
    rationale: >
      Below this correlated colour temperature the ambient light itself is counted as a Fire
      signal. A modern extension, not doctrine.
  - key: fire_penalty_weight
    default: 5
    range: [0, 10]
    unit: weight
    user_editable: false
    rationale: Score slope for Fire over-share.
score:
  weight: 7
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: recolor_surface
    target: room.finishes.wall
    transform: {from_element: fire, to_element: earth, keep_lrv_within: 0.20}
    cost: low
    effort: medium
    reversible: true
    copy: Move the strongest red or orange surface toward a warm sand, ochre or clay tone. In the tradition Fire feeds Earth, so this drains the heat rather than fighting it — and it barely changes the room's warmth.
  - rank: 2
    action: remove_object
    target: objectsWithPrimaryElement(fire)
    transform: {reduce_count_to: p.fire_object_count_cap - 1, prefer_removing: lowest_utility}
    cost: free
    effort: low
    reversible: true
    copy: Take out one or two of the hottest pieces. Reducing usually works better than adding something cool.
  - rank: 3
    action: add_object
    add: decor.vessel.ceramic_large
    transform: {element: earth, position: floor_or_low_surface, min_visible_area_m2: 0.15}
    cost: low
    effort: low
    reversible: true
    copy: Add one substantial earthy piece — a big ceramic pot, a stone-topped side table — to absorb the heat.
  - rank: 4
    action: change_lighting
    target: lighting.*
    transform: {raise_cct_to_k: 2900, keep_dim_to_warm: true}
    cost: low
    effort: low
    reversible: true
    copy: Nudge the bulbs a little less amber. Around 2700-3000K still reads cosy but stops the whole room glowing hot.
  - rank: 5
    action: add_object
    add: decor.bowl.water_shallow
    transform: {element: water, min_distance_to_fire_object_m: p.clash_radius_m}
    cost: low
    effort: low
    reversible: true
    copy: Only if the other fixes are not available: a water piece will cool the room, but keep it well away from the hot pieces — the tradition treats Fire and Water meeting head-on as its own problem.
conflicts_with: [FS-ELEM-015, CIRC-EVE-004, STYLE-MAXIMAL-002]
supersedes: []
requires_rules: [FS-ELEM-003, FS-ELEM-012, FS-ELEM-019]
tags: [five_elements, fire, excess, bedroom, colour, remedies]
localization_notes: >
  Red carries strongly positive festive/prosperity associations in Chinese and several South
  Asian markets. Copy must never imply red is a mistake — frame it as quantity, and mention
  that red used deliberately and sparingly is exactly what the tradition prescribes.
```

#### Why — tradition
Fire (火, Li trigram, South) governs visibility, reputation, activity and heat. Excess Fire is
described across both classical and modern schools as producing agitation, short tempers,
restlessness and difficulty settling, and it is the excess most often diagnosed in
contemporary homes because of red accent walls, open kitchens, large screens and very warm LED
lighting. The prescribed correction is order-dependent and this is one of feng shui's genuinely
interesting technical points: you drain Fire into Earth (the *xie* route, since Fire generates
Earth) in preference to attacking it with Water (the *ke* route), because a direct Water–Fire
confrontation is itself treated as a clash. That is why the Earth remedy is rank 1 and the
Water remedy rank 5.

#### Why — psychology / physiology
Partly supported, with important limits. Elliot & Maier's review of colour and psychological
functioning (*Annual Review of Psychology* 65:95–120, 2014) sets out colour-in-context theory
and documents that perceiving red shifts behaviour in achievement and attraction contexts — but
the effects are context-dependent, generally small, and several individual findings in that
literature have proved hard to replicate, so "red makes people agitated" overstates it. The
lighting half is better supported: light is the dominant entrainment signal for the circadian
system via intrinsically photosensitive retinal ganglion cells (Berson, Dunn & Takao, *Science*
295:1070–1073, 2002), and bright evening light delays sleep timing. But note the direction —
that argues for *dim* evening light, not for avoiding warm hues; in fact low-CCT amber light is
the *better* evening choice. The much-reproduced Kruithof curve, which claims warm light is
preferred at low illuminance, has repeatedly failed replication (e.g. Boyce & Cuttle 1990;
Davis & Ginthner 1990) and should not be cited as evidence for anything. So: treat the
"too much red" half as tradition with weak supporting colour literature, and treat the
"too much warm light" half as tradition that happens to run *against* the circadian evidence.

#### Customer insight
This room is running hot — lots of red, orange, pointed shapes or very amber light. Feng shui
would say it will feel energetic but hard to settle in. The tradition's own preferred fix is
elegant: instead of cooling it down with water tones, you soak the heat up with earthy ones,
like clay, sand and stone. Try that before you reach for anything blue.

#### Failure modes / when to skip
Do not fire in `kitchen`, `eat_in_kitchen`, `home_gym`, `game_room` or `prayer_altar_room`,
whose function targets set Fire high by design. Suppress in `media_room` and `home_theater`
where dark warm schemes are functional. If a style pack with a hot palette is active
(`STYLE-MAXIMAL-002`, Moroccan, Mexican folk, some maximalist packs), reduce weight rather
than firing. The "remove object" remedy must never target a heating appliance the occupant
depends on — check `primary_user in [senior, infant]` and route to advisory instead. Any
remedy that moves a heater, candle or appliance defers to `SAFE-FIRE-*` clearances, and the
engine must tell the user when it does.

### FS-ELEM-007 — Excess Water in a room

```yaml
id: FS-ELEM-007
title: Excess Water in a room
system: feng_shui.five_elements
group: element_excess
version: 1
status: active
applies_to:
  rooms: [ANY_ROOM]
  objects: [ANY_OBJECT]
  requires_features: []
  min_room_area_m2: 4.0
scope: room_composition
severity: medium
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let cov = elementCoverageVector(room)
  let cap = roomFunctionElementTarget(room.type)[water].max_pct / 100
  assert cov[water] <= cap
  let signals = count([
    colorCoverageOfRoom(room, water) > p.water_color_cap_pct / 100,
    reflectiveSurfaceFraction(room) > p.reflective_cap_pct / 100,
    countOf(decor.mirror.*, room) >= p.mirror_count_cap,
    meanLightnessOfFinishes(room) < p.dark_finish_lrv,
    daylightAccess(centroid(room)) < p.low_daylight ])
  penalize((cov[water] - cap) * max(1, signals), weight = 5)
  # Cold-and-dark compounding: Water excess plus low daylight is the case users actually feel.
  prefer not (cov[water] > cap and daylightAccess(centroid(room)) < p.low_daylight)
params:
  - key: water_color_cap_pct
    default: 30
    range: [10, 55]
    unit: percent
    user_editable: true
    rationale: Blue/navy/black/charcoal colour coverage ceiling. APP DESIGN CHOICE.
  - key: reflective_cap_pct
    default: 22
    range: [5, 50]
    unit: percent
    user_editable: true
    rationale: >
      Share of visible surface that is mirror, glass or high-gloss. Doubles as a glare-risk
      proxy, which is why it is not purely a belief threshold.
  - key: mirror_count_cap
    default: 3
    range: [1, 8]
    unit: count
    user_editable: true
    rationale: Mirrors above this count in one room read as Water excess in most practitioners' accounts.
  - key: dark_finish_lrv
    default: 0.30
    range: [0.10, 0.55]
    unit: LRV_fraction
    user_editable: true
    rationale: >
      Mean light reflectance value of the room's finishes below which the room reads dark.
      Also feeds the lighting rules, so keep aligned with LIGHT-REFL-*.
  - key: low_daylight
    default: 0.30
    range: [0.0, 0.6]
    unit: fraction
    user_editable: false
    rationale: daylightAccess value below which the room is treated as daylight-poor.
score:
  weight: 6
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: plants.plant.potted_large
    transform: {element: wood, count: 2, position: near_daylight}
    cost: low
    effort: low
    reversible: true
    copy: Bring in two decent-sized plants. In the tradition Water feeds Wood, so plants drink the excess down instead of fighting it — and they lift a dark room in a way nothing else does.
  - rank: 2
    action: recolor_surface
    target: room.finishes.wall
    transform: {from_element: water, to_element: wood, min_lrv: 0.45}
    cost: low
    effort: medium
    reversible: true
    copy: Take one navy or charcoal wall toward a soft green. Same depth of colour, much less chill.
  - rank: 3
    action: remove_object
    target: decor.mirror.*
    transform: {reduce_count_to: p.mirror_count_cap - 1}
    cost: free
    effort: low
    reversible: true
    copy: Thin out the mirrors. One well-placed mirror does more than three competing ones.
  - rank: 4
    action: add_object
    add: softgoods.rug.wool
    transform: {element: earth, min_area_m2: 2.0}
    cost: medium
    effort: low
    reversible: true
    copy: A thick wool rug adds the Earth family, which the tradition says contains Water — and it warms the room underfoot and quiets the echo.
  - rank: 5
    action: change_lighting
    target: lighting.*
    transform: {lower_cct_to_k: 2700, raise_illuminance_lux: 150}
    cost: low
    effort: low
    reversible: true
    copy: Warmer, brighter lamps. Dark rooms need more light layers, not more fittings on one switch.
conflicts_with: [FS-ELEM-016, STYLE-DARKACADEMIA-002]
supersedes: []
requires_rules: [FS-ELEM-003, FS-ELEM-012, FS-ELEM-019]
tags: [five_elements, water, excess, mirrors, dark_rooms, remedies]
localization_notes: >
  In several East Asian contexts large amounts of white and black together read as funerary;
  copy discussing black finishes should stay neutral and avoid celebratory framing.
```

#### Why — tradition
Water (水, Kan trigram, North) governs flow, depth, wisdom, career and communication. Excess
Water is described as producing drift, melancholy, poor boundaries and a sense of being
overwhelmed or unable to settle — the classic diagnosis for a basement flat with charcoal walls,
a wall of mirrors and little daylight. Classical remediation drains Water into Wood (*xie*)
first, and reaches for Earth (the *ke* controller, "earth dams water") second. Modern practice
adds mirrors and glass to the Water tally, which classical texts do not do explicitly; that
extension is what makes Water excess common in contemporary open-plan homes.

#### Why — psychology / physiology
The element framing has no empirical support, but two of its components do. First, daylight and
illuminance: low daylight access is robustly associated with poorer mood outcomes, and seasonal
affective symptoms respond to bright-light exposure — so "dark room feels heavy" is real, and
the engine's compounding check on `daylightAccess` is the empirically strongest part of this
rule. Second, reflective surface fraction is a genuine glare and visual-discomfort variable,
independent of any tradition. The specifically *elemental* claims — that mirrors carry Water,
that blue paint produces drift — are tradition. Note also that the common belief blue rooms
feel colder rests on the hue-heat hypothesis, and recent work using controlled thermal
environments has found the effect much weaker than assumed, so do not present it as fact.

#### Customer insight
A lot of deep blue, charcoal, glass and mirror with not much daylight — feng shui reads that as
too much Water, and it tends to feel a bit adrift. The traditional fix is nice and practical:
add plants, because Water feeds Wood. A couple of big plants and warmer lamplight will do more
than repainting.

#### Failure modes / when to skip
Do not fire in `bathroom_full`, `bathroom_three_quarter`, `powder_room`, `wet_room`,
`laundry_room` or `wine_cellar`, where the function target sets Water high. Suppress when a
deliberately dark style pack is active. Never recommend removing a mirror that is serving a
`FS-CMD-*` commanding-position remedy or a `SAFE-SEC-*` sightline function — cross-check before
offering remedy rank 3. In genuinely daylight-poor rooms the lighting remedy should be
promoted to rank 1, because it addresses the physiological problem rather than the symbolic one.

### FS-ELEM-008 — Excess Earth in a room

```yaml
id: FS-ELEM-008
title: Excess Earth in a room
system: feng_shui.five_elements
group: element_excess
version: 1
status: active
applies_to:
  rooms: [ANY_ROOM]
  objects: [ANY_OBJECT]
  requires_features: []
  min_room_area_m2: 4.0
scope: room_composition
severity: low
confidence: tradition
evidence_class: traditional
belief_gated: true
predicate: |
  let cov = elementCoverageVector(room)
  let cap = roomFunctionElementTarget(room.type)[earth].max_pct / 100
  assert cov[earth] <= cap
  let signals = count([
    heavyMassFraction(room) > p.heavy_mass_cap_pct / 100,       # stone/concrete/brick/tile
    meanObjectHeightRatio(room) < p.low_profile_ratio,          # everything is squat
    colorCoverageOfRoom(room, earth) > p.earth_color_cap_pct / 100,
    occupancyRatio(room) > p.occupancy_cap,
    countOf(verticalForms(room), room) <= p.min_vertical_forms ])
  penalize((cov[earth] - cap) * max(1, signals), weight = 4)
params:
  - key: heavy_mass_cap_pct
    default: 40
    range: [20, 70]
    unit: percent
    user_editable: true
    rationale: >
      Share of visible surface in the masonry/mineral family (stone, concrete, brick, tile,
      terracotta, plaster). APP DESIGN CHOICE. Also a proxy for acoustic hardness.
  - key: low_profile_ratio
    default: 0.55
    range: [0.3, 1.0]
    unit: ratio
    user_editable: true
    rationale: >
      Mean object height divided by the room's characteristic width below which the furniture
      reads uniformly squat. Earth excess is as much about proportion as material.
  - key: earth_color_cap_pct
    default: 45
    range: [20, 70]
    unit: percent
    user_editable: true
    rationale: Beige/ochre/brown/terracotta colour coverage ceiling. Generous, because these are common neutrals.
  - key: occupancy_cap
    default: 0.55
    range: [0.3, 0.8]
    unit: fraction
    user_editable: true
    rationale: >
      Floor-area occupancy above which the room reads heavy. Overlaps with the circulation
      rules; keep aligned with CIRC-OCC-*.
  - key: min_vertical_forms
    default: 1
    range: [0, 5]
    unit: count
    user_editable: true
    rationale: At or below this count of tall/columnar forms, the room has nothing lifting the eye.
score:
  weight: 5
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: plants.tree.potted_large
    transform: {element: wood, min_height_m: 1.4, position: corner_with_daylight}
    cost: medium
    effort: low
    reversible: true
    copy: One tall plant or a slim floor lamp breaks up all that weight. The tradition puts Wood over Earth for exactly this — something growing and upright in a room full of mass.
  - rank: 2
    action: add_object
    add: decor.art.vertical_framed
    transform: {orientation: portrait, aspect_min: 1.4, hang_height_center_m: 1.45}
    cost: low
    effort: low
    reversible: true
    copy: Hang something tall and narrow. Vertical lines do the same job as a tall plant and take no floor space.
  - rank: 3
    action: swap_material
    target: tables.coffee_table.*
    transform: {from_material: stone, to_material: wood_or_glass}
    cost: medium
    effort: medium
    reversible: true
    copy: If one big stone piece is doing most of the work, swapping it for wood or glass changes the whole room.
  - rank: 4
    action: add_object
    add: decor.object.metal_set
    transform: {element: metal, count: 3}
    cost: low
    effort: low
    reversible: true
    copy: A few crisp metal pieces sharpen a heavy room — in the tradition Earth produces Metal, so this draws the excess off gently.
conflicts_with: [FS-ELEM-014, ACOU-RT60-003]
supersedes: []
requires_rules: [FS-ELEM-003, FS-ELEM-012, FS-ELEM-019]
tags: [five_elements, earth, excess, proportion, verticality]
localization_notes: Earth-toned neutrals dominate mass-market interiors in most markets; keep the tone non-judgemental.
```

#### Why — tradition
Earth (土, Kun and Gen trigrams, SW and NE plus the centre) governs stability, nourishment,
boundaries and care. Excess Earth is described as stagnation, heaviness, inertia, "stuck"
feelings and difficulty starting things. The classical corrections are Wood to break it up
(*ke*, "wood roots split earth") and Metal to draw it off (*xie*, since Earth generates Metal).
Note that Earth excess is the one excess where Form School's *shape* reading matters as much as
material: a room of low, square, squat forms reads Earth even in pale wood, which is why this
rule tests proportion as well as coverage.

#### Why — psychology / physiology
No direct empirical support for Earth excess as a construct. Two plausible independent
mechanisms sit underneath it. First, a room in which every form is low and horizontal offers
very little vertical visual interest, and compositional variety in the vertical dimension is a
standard predictor of preference in aesthetics research on complexity; a uniformly squat room
reads as monotonous. Second, high hard-mineral surface fraction directly raises reverberation
time, and long reverberation in living spaces degrades speech intelligibility and is reported as
fatiguing — so the acoustic consequence of Earth excess is real even though the elemental
framing is not. If the room's reverberation is high, cite that instead; it is the stronger claim.

#### Customer insight
Lots of stone, tile, concrete and beige, with nothing tall in the room — feng shui calls that
too much Earth, and it tends to feel a bit stuck. The traditional answer is something growing
and upright: a tall plant, a slim lamp, a tall narrow picture. It also usually helps the echo.

#### Failure modes / when to skip
Do not fire in `wine_cellar`, `basement_unfinished`, `utility_mechanical`, `garage_parking`,
`workshop_garage` or `safe_room`, where mass is the point. Mediterranean, adobe, Southwestern
and brutalist style packs deliberately maximise this element — reduce weight rather than
firing. Do not recommend swapping out a heavy piece that is providing tip-over stability for a
`SAFE-TIP-*` finding, or a stone hearth surround serving `SAFE-FIRE-*`. The "add tall plant"
remedy must respect ceiling height: in rooms under 2.3 m (7 ft 7 in) a 1.4 m plant plus pot can
crowd the head zone.

### FS-ELEM-009 — Excess Metal in a room

```yaml
id: FS-ELEM-009
title: Excess Metal in a room
system: feng_shui.five_elements
group: element_excess
version: 1
status: active
applies_to:
  rooms: [ANY_ROOM]
  objects: [ANY_OBJECT]
  requires_features: []
  min_room_area_m2: 4.0
scope: room_composition
severity: medium
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let cov = elementCoverageVector(room)
  let cap = roomFunctionElementTarget(room.type)[metal].max_pct / 100
  assert cov[metal] <= cap
  let signals = count([
    colorCoverageOfRoom(room, metal) > p.metal_color_cap_pct / 100,   # white/grey/silver
    softMaterialFraction(room) < p.min_soft_fraction,                 # nothing upholstered
    ccdAt(centroid(room)) >= p.metal_cct_k,
    reverbTime(room) > p.reverb_flag_s,
    countOf(curvedForms(room), room) / max(1, countOf(ANY_OBJECT, room)) > p.round_form_share ])
  penalize((cov[metal] - cap) * max(1, signals), weight = 5)
  # The "clinical" compound: pale, hard, cool-lit and echoey all at once.
  assert not (colorCoverageOfRoom(room, metal) > p.metal_color_cap_pct / 100
              and softMaterialFraction(room) < p.min_soft_fraction
              and ccdAt(centroid(room)) >= p.metal_cct_k)
params:
  - key: metal_color_cap_pct
    default: 50
    range: [25, 75]
    unit: percent
    user_editable: true
    rationale: >
      White/off-white/grey/silver coverage ceiling. Set high because white walls are the
      default in most housing stock and flagging every white room would be useless.
  - key: min_soft_fraction
    default: 0.12
    range: [0.0, 0.4]
    unit: fraction
    user_editable: true
    rationale: >
      Minimum share of visible surface that is soft/upholstered/textile. Doubles as an
      acoustic absorption proxy, so this threshold is not purely belief-driven.
  - key: metal_cct_k
    default: 4600
    range: [3500, 6500]
    unit: K
    user_editable: true
    rationale: CCT at or above which ambient light itself is counted as a Metal signal.
  - key: reverb_flag_s
    default: 0.7
    range: [0.3, 1.5]
    unit: s
    user_editable: true
    rationale: >
      Mid-frequency reverberation time above which a furnished living space reads hard and
      echoey. Keep aligned with ACOU-RT60-*; this is an acoustics threshold, not doctrine.
  - key: round_form_share
    default: 0.45
    range: [0.2, 0.8]
    unit: fraction
    user_editable: true
    rationale: Share of objects with round/oval/domed silhouettes above which Metal reads dominant by shape.
score:
  weight: 6
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: softgoods.textile.set
    transform: {element: wood_or_earth, add: [curtains, cushions, throw], min_added_area_m2: 3.0}
    cost: low
    effort: low
    reversible: true
    copy: Soften it with textiles — curtains, cushions, a throw. It warms the room, kills the echo, and in the tradition it is the gentlest way to take the edge off Metal.
  - rank: 2
    action: swap_material
    target: room.finishes.floor
    transform: {from_material: tile_or_polished_concrete, to_material: wood_or_wool}
    cost: high
    effort: high_physical
    reversible: false
    copy: If you are changing the floor anyway, wood or wool here changes the room more than anything else on this list.
  - rank: 3
    action: add_object
    add: plants.plant.potted_medium
    transform: {element: wood, count: 3}
    cost: low
    effort: low
    reversible: true
    copy: Plants break up all the hard pale surfaces. Three medium ones spread out beats one big one in a corner.
  - rank: 4
    action: change_lighting
    target: lighting.*
    transform: {lower_cct_to_k: 3000, add_layers_min: 3}
    cost: low
    effort: low
    reversible: true
    copy: Warmer bulbs and more than one light source. Cool overhead light on pale hard surfaces is what makes a room feel clinical.
  - rank: 5
    action: recolor_surface
    target: room.finishes.wall
    transform: {from_element: metal, to_element: earth, keep_lrv_within: 0.10}
    cost: low
    effort: medium
    reversible: true
    copy: A warm off-white or clay tone instead of a cool grey-white. Barely reads as a colour change but the room feels different.
conflicts_with: [STYLE-MINIMAL-003, STYLE-INDUSTRIAL-002]
supersedes: []
requires_rules: [FS-ELEM-003, FS-ELEM-012, FS-ELEM-019]
tags: [five_elements, metal, excess, clinical, acoustics, textiles]
localization_notes: >
  White dominance is a strong aesthetic preference in Nordic and Japanese markets; the copy
  must not read as a criticism of a white scheme, only of a white-AND-hard-AND-cool-lit one.
```

#### Why — tradition
Metal (金, Qian and Dui trigrams, NW and W) governs precision, clarity, structure, discipline
and completion. Excess Metal is described as coldness, over-criticism, sharpness, sterility and
difficulty relaxing — the diagnosis for the all-white, all-chrome, all-glass interior. The
classical corrections are Fire to soften it (*ke*, "fire melts metal") and Water to draw it off
(*xie*, since Metal generates Water). In practice most practitioners reach first for textiles
and warmth rather than for symbolic Fire, which is what this rule's remedy order reflects.

#### Why — psychology / physiology
The elemental claim is tradition, but this is one of the rules where feng shui and evidence
converge on the same fix for different reasons, which makes it strong app content. A room with
very little soft material has high mid-frequency reverberation, which measurably degrades
speech intelligibility and is consistently reported as effortful; adding curtains, rugs and
upholstery is the standard acoustic treatment. Separately, cool-CCT ambient light at high
illuminance on high-reflectance surfaces raises perceived brightness and is commonly rated less
pleasant in residential settings — though note that the famous Kruithof curve which formalised
that intuition has repeatedly failed replication (Boyce & Cuttle 1990; Davis & Ginthner 1990),
so the honest statement is that illuminance matters more than CCT for preference. The belief
that cool colours feel physically colder (hue-heat) has weak and inconsistent support and
should not be asserted.

#### Customer insight
Lots of white, grey, chrome and glass with nothing soft — feng shui calls this too much Metal
and would say it feels sharp and a little cold. Here the tradition and the acoustics agree:
curtains, a rug and some cushions fix both the feeling and the echo, and cost less than
repainting.

#### Failure modes / when to skip
Do not fire in `bathroom_*`, `laundry_room`, `kitchen`, `home_gym`, `workshop_garage` or
`utility_mechanical`, where hard cleanable surfaces are required and the function target sets
Metal high. Minimalist, industrial and clinical-modern style packs deliberately maximise this
element — reduce weight rather than firing. Flooring swaps must be suppressed for renters
(`user.tenure == rental`) and in wet rooms. Do not recommend removing metal grab bars, rails or
other accessibility hardware under any circumstances; `accessibility.*` outranks this rule
absolutely.

### FS-ELEM-010 — Excess Wood in a room

```yaml
id: FS-ELEM-010
title: Excess Wood in a room
system: feng_shui.five_elements
group: element_excess
version: 1
status: active
applies_to:
  rooms: [ANY_ROOM]
  objects: [ANY_OBJECT]
  requires_features: []
  min_room_area_m2: 4.0
scope: room_composition
severity: low
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let cov = elementCoverageVector(room)
  let cap = roomFunctionElementTarget(room.type)[wood].max_pct / 100
  assert cov[wood] <= cap
  # Wood is the one element with an empirical coverage reference point, so it gets a
  # separate, evidence-anchored soft check on MATERIAL coverage specifically.
  let woodSurface = materialCoveragePct(room, wood_family)
  prefer woodSurface <= p.wood_surface_comfort_pct / 100
  let signals = count([
    woodSurface > p.wood_surface_comfort_pct / 100,
    colorCoverageOfRoom(room, wood) > p.green_color_cap_pct / 100,
    countOf(plants.*, room) >= p.plant_count_cap,
    toneVariance(room) < p.min_tone_variance ])
  penalize((cov[wood] - cap) * max(1, signals), weight = 4)
params:
  - key: wood_surface_comfort_pct
    default: 60
    range: [35, 90]
    unit: percent
    user_editable: true
    rationale: >
      Wood MATERIAL coverage of ceiling+walls+floor above which the engine raises a soft
      preference. Anchored to Tsunetsugu, Miyazaki & Sato (J Wood Sci 53:11-16, 2007), where
      45% coverage tended to score highest on subjective comfort and 90% produced a rapid
      fall in measured brain activity; 60% sits between the two tested points, so it is an
      interpolation, not a measured optimum. Say so in any tooltip.
  - key: green_color_cap_pct
    default: 35
    range: [15, 60]
    unit: percent
    user_editable: true
    rationale: Green colour coverage ceiling. APP DESIGN CHOICE.
  - key: plant_count_cap
    default: 12
    range: [4, 40]
    unit: count
    user_editable: true
    rationale: >
      Plant count above which Wood reads dominant. Deliberately high; plant-lovers should not
      be nagged, and the plant-related evidence is favourable.
  - key: min_tone_variance
    default: 0.08
    range: [0.0, 0.3]
    unit: variance
    user_editable: false
    rationale: >
      Variance in surface lightness. An all-mid-oak room is flagged for monotony, not for
      wood as such — this is the term that distinguishes "lots of wood" from "sauna".
score:
  weight: 4
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: decor.object.metal_set
    transform: {element: metal, count: 3, prefer_finish: brushed_or_matte}
    cost: low
    effort: low
    reversible: true
    copy: A few metal pieces cut through it. In the tradition Metal trims Wood — and visually, one crisp edge stops a wood-heavy room reading like a sauna.
  - rank: 2
    action: recolor_surface
    target: room.finishes.wall
    transform: {from_element: wood, to_element: metal, min_lrv: 0.62}
    cost: low
    effort: medium
    reversible: true
    copy: Paint one wall or the ceiling a soft white. Breaking the run of timber tone is usually all it needs.
  - rank: 3
    action: swap_material
    target: softgoods.rug.*
    transform: {to_element: earth_or_metal, contrast_lrv_min: 0.2}
    cost: medium
    effort: low
    reversible: true
    copy: A rug in a contrasting tone gives the eye somewhere to rest.
  - rank: 4
    action: report_only
    target: room
    transform: {explain: tone_monotony}
    cost: free
    effort: none
    reversible: true
    copy: The issue here is less the amount of wood than the sameness of the tone — mixing two or three wood tones reads better than one everywhere.
conflicts_with: [STYLE-SCANDI-002, STYLE-JAPANDI-002, BIO-14P-005]
supersedes: []
requires_rules: [FS-ELEM-003, FS-ELEM-012, FS-ELEM-019]
tags: [five_elements, wood, excess, tone_monotony, evidence_convergence]
localization_notes: >
  Timber-clad interiors are normative in Nordic, Alpine and Japanese housing; the finding must
  be framed as tone variety, never as "too much wood", in those locales.
```

#### Why — tradition
Wood (木, Zhen and Xun trigrams, E and SE) governs growth, expansion, flexibility, vision and
new beginnings. Excess Wood is described as over-extension, restlessness, too many projects at
once and a room that feels crowded with intention. The classical corrections are Metal to prune
it (*ke*, "metal cuts wood") and Fire to consume it (*xie*, since Wood generates Fire). Wood
excess is the rarest diagnosis in contemporary Western homes and the least severe, which is why
this rule carries `severity: low`.

#### Why — psychology / physiology
This is the element where the traditional caution and the empirical picture line up unusually
well, and the app should say so carefully. Tsunetsugu, Miyazaki & Sato (*Journal of Wood
Science* 53:11–16, 2007) tested wood covering 0%, 45% and 90% of a full-size room's surfaces:
45% tended to rate highest on subjective comfort, while the 90% room produced large blood
pressure decreases alongside a rapid decline in measured brain activity — a pattern the authors
did not read as straightforwardly beneficial. Lipovac & Burnard's systematic review of
randomised trials (*Indoor and Built Environment*, 2021, nine studies) concluded that visual
wood exposure may improve some stress indicators but that the evidence base is limited. So:
wood is good, saturation is not clearly better than moderation, and "too much of a good thing"
has at least one real data point behind it. The separate monotony term rests on ordinary
compositional variety, not on the element system.

#### Customer insight
A lot of timber, green and plants — feng shui would call this Wood-heavy and suggest one crisp
metal note to balance it. This is also the one family where there's real research: in a study
using full-size rooms, wood covering about 45% of the surfaces rated most comfortable, more so
than wall-to-wall. Mixing two or three wood tones usually reads better than one everywhere.

#### Failure modes / when to skip
Do not fire when a Scandinavian, Japandi, Alpine chalet, mid-century or biophilic style pack is
active — those packs deliberately maximise Wood and `BIO-14P-005` (material connection with
nature) actively rewards it. Do not count plants toward excess in `sunroom_conservatory`,
`balcony`, `patio_deck`, `roof_terrace` or `garden_yard`. Never recommend removing plants that
are serving a biophilia or air-quality remedy. Suppress in rooms where timber is structural and
exposed by design (`loft`, `attic_finished`, timber-frame cottages).

### FS-ELEM-011 — Deficiency remedy: supply the generating parent before the element itself

```yaml
id: FS-ELEM-011
title: Deficiency remedy — supply the generating parent before the element itself
system: feng_shui.five_elements
group: element_remedy
version: 1
status: active
applies_to:
  rooms: [ANY_ROOM]
  objects: [ANY_OBJECT]
  requires_features: []
scope: room_composition
severity: low
confidence: tradition
evidence_class: traditional
belief_gated: true
predicate: |
  # Remedy-selection rule. Fires only when FS-ELEM-004 has reported a deficiency.
  let need = deficientElements(room, p.deficient_pct)
  forEach(e in need,
    let parent = PARENT_OF[e]
    # Strategy A (preferred): strengthen the parent so the child regenerates.
    # Strategy B: add the element directly.
    # Strategy C (last): remove whatever is controlling it.
    prefer remedyStrategy(e) == strengthen_parent
           when elementCoverage(room, parent) < p.parent_headroom_pct / 100
    prefer remedyStrategy(e) == add_directly
           when elementCoverage(room, parent) >= p.parent_headroom_pct / 100
    prefer remedyStrategy(e) == reduce_controller
           when elementCoverage(room, CONTROLLER_OF[e]) > p.controller_excess_pct / 100)
  # Never propose a remedy that creates a new excess: check the post-remedy vector.
  forbid remedy where max(projectedCoverage(room, remedy)) > p.dominance_pct / 100
params:
  - key: parent_headroom_pct
    default: 30
    range: [15, 50]
    unit: percent
    user_editable: false
    rationale: >
      If the parent element is already above this coverage, strengthening it further would
      create a new excess, so the engine adds the deficient element directly instead.
  - key: controller_excess_pct
    default: 38
    range: [25, 60]
    unit: percent
    user_editable: false
    rationale: >
      If the element that controls the deficient one is itself in excess, the tradition treats
      the deficiency as suppression rather than absence, and the fix is subtraction.
  - key: prefer_subtraction_over_addition
    default: true
    range: [true, false]
    unit: bool
    user_editable: true
    rationale: >
      Product default for the "reorienter" persona, who wants minimal spend. When true, a
      remove/relocate remedy of equal effectiveness always outranks a buy-something remedy.
score:
  weight: 3
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: apply_rule_remedies
    target: room
    transform: {strategy: strengthen_parent, element: PARENT_OF[need]}
    cost: low
    effort: low
    reversible: true
    copy: Rather than adding the missing family directly, we add the one that feeds it — the tradition says the gap then fills itself, and it usually looks less forced.
  - rank: 2
    action: apply_rule_remedies
    target: room
    transform: {strategy: add_directly, element: need}
    cost: low
    effort: low
    reversible: true
    copy: Add the missing family directly, in two or three small pieces rather than one large statement.
  - rank: 3
    action: remove_object
    target: objectsWithPrimaryElement(CONTROLLER_OF[need])
    transform: {reduce_count_by: 1}
    cost: free
    effort: low
    reversible: true
    copy: Something in the room may be crowding this family out. Taking one of those pieces away can be enough.
conflicts_with: []
supersedes: []
requires_rules: [FS-ELEM-001, FS-ELEM-004]
tags: [five_elements, remedy_strategy, sheng_cycle, subtraction_first]
localization_notes: Copy should avoid the words "mother" and "child" for the sheng relation in UI; use "feeds".
```

#### Why — tradition
This is one of the few genuinely procedural pieces of Wu Xing doctrine and it is consistent
across the medical and feng shui lineages: to strengthen a deficient phase you tonify its
mother (虛則補其母, "if deficient, supplement the mother"). Applied to a room, if Wood is thin
you add Water, because Water nourishes Wood; adding Wood directly works but is treated as the
cruder move. The third strategy — remove the controller — comes from the recognition that a
phase can be absent because something is suppressing it, not because nothing supplies it. The
ordering matters to practitioners and the engine should respect it rather than always reaching
for the obvious addition.

#### Why — psychology / physiology
No direct empirical support; this is an internal rule of a symbolic system. The plausible design
mechanism is real though: the indirect remedy tends to produce better-looking rooms. Asked to add
"Water" to a Wood-thin room, a designer adds glass, a mirror, a dark reflective tray — small,
low-commitment, generally flattering moves. Asked to add "Wood" directly they may add a large
green object that fights the existing palette. Recommending the upstream element is effectively
a constraint that pushes toward subtler interventions, which is why it also pairs well with the
`prefer_subtraction_over_addition` product default.

#### Customer insight
When a family is thin, we usually add the one that feeds it instead of the one that's missing —
that's how the tradition does it, and it tends to look less like you followed a checklist. And
if something already in the room is crowding that family out, we'll tell you to move that
instead of buying anything.

#### Failure modes / when to skip
Do not run when the deficiency was flagged as deliberate by the user. The projected-coverage
guard is essential: without it this rule cheerfully creates the excess that `FS-ELEM-006`…`010`
will then flag, producing a remedy loop. Skip the reduce-controller strategy when the
controlling objects are fixed, structural, safety-relevant or accessibility hardware. In rooms
with fewer than three objects, prefer the generation path over remediation entirely.

### FS-ELEM-012 — Excess remedy: drain before you clash, and cap the remedy count

```yaml
id: FS-ELEM-012
title: Excess remedy — drain before you clash, and cap the remedy count
system: feng_shui.five_elements
group: element_remedy
version: 1
status: active
applies_to:
  rooms: [ANY_ROOM]
  objects: [ANY_OBJECT]
  requires_features: []
scope: room_composition
severity: medium
confidence: tradition
evidence_class: traditional
belief_gated: true
predicate: |
  let over = dominantElements(room, p.dominance_pct)
  forEach(e in over,
    let child      = SHENG[e]              # e generates child -> child DRAINS e (xie route)
    let controller = CONTROLLER_OF[e]      # controller overcomes e (ke route)
    # 1. Drain route strongly preferred.
    prefer remedyElement(e) == child
    # 2. Control route allowed only when the drain route has no headroom.
    prefer remedyElement(e) == controller
           when elementCoverage(room, child) >= p.child_headroom_pct / 100
    # 3. CLASH GUARD: a controlling remedy must not be placed inside the clash radius of the
    #    object it is meant to control, or the engine has created FS-ELEM-019/020 problems.
    forEach(o in objectsWithPrimaryElement(e),
      forbid placeRemedy(controller) where distance(centroid(remedy), centroid(o)) < p.clash_radius_m)
    # 4. A controlling remedy must not be smaller than the thing it controls by more than
    #    this ratio, or it reads as the insulting cycle (FS-ELEM-026) rather than control.
    forbid placeRemedy(controller)
      where visibleSurfaceArea(remedy) / visibleSurfaceArea(largestObjectOfElement(room, e))
            < p.min_controller_size_ratio)
  # 5. REMEDY BUDGET. Element remedies stack badly: five symbolic objects added to "fix"
  #    a room produce clutter, which every other subsystem then penalises.
  assert elementRemedyCount(room) <= p.max_element_remedies_per_room
  assert elementRemedyCount(home) <= p.max_element_remedies_per_home
params:
  - key: child_headroom_pct
    default: 32
    range: [18, 50]
    unit: percent
    user_editable: false
    rationale: >
      If the draining element is itself already near dominance, draining further would just
      move the problem, so the engine falls back to the controlling route.
  - key: clash_radius_m
    default: 1.2
    range: [0.3, 3.0]
    unit: m
    user_editable: true
    rationale: >
      Centre-to-centre distance (1.2 m is about 3 ft 11 in) within which two objects in a
      controlling relation are treated as clashing rather than balancing. APP DESIGN CHOICE,
      derived from Hall's social-distance band rather than from any feng shui text: within
      roughly personal/near-social distance two objects read as a single composed group.
  - key: min_controller_size_ratio
    default: 0.25
    range: [0.05, 1.0]
    unit: ratio
    user_editable: true
    rationale: >
      A thimble of water does not control a bonfire. Below this visible-area ratio the engine
      refuses the remedy as token. APP DESIGN CHOICE.
  - key: max_element_remedies_per_room
    default: 3
    range: [1, 8]
    unit: count
    user_editable: true
    rationale: >
      Hard cap on symbolic additions per room. Protects against the failure mode where a
      belief-motivated user ends up with a shelf of cures. Product decision.
  - key: max_element_remedies_per_home
    default: 12
    range: [3, 40]
    unit: count
    user_editable: true
    rationale: Whole-home cap, for the same reason.
score:
  weight: 6
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: apply_rule_remedies
    target: room
    transform: {strategy: drain_to_child, element: SHENG[excess]}
    cost: low
    effort: low
    reversible: true
    copy: We soak up the excess with the family it naturally feeds, rather than fighting it head-on. Fire goes into Earth, Water into Wood, Wood into Fire, and so on.
  - rank: 2
    action: apply_rule_remedies
    target: room
    transform: {strategy: control, element: CONTROLLER_OF[excess], min_distance_m: p.clash_radius_m}
    cost: low
    effort: low
    reversible: true
    copy: If draining is not an option, we use the family that keeps this one in check — but placed across the room, not right beside it.
  - rank: 3
    action: remove_object
    target: objectsWithPrimaryElement(excess)
    transform: {reduce_count_by: 1, prefer_removing: lowest_utility}
    cost: free
    effort: low
    reversible: true
    copy: Simplest of all: take one piece out. We will always offer this before suggesting you buy anything.
conflicts_with: [FS-ELEM-019, FS-ELEM-020, PROD-CLUTTER-002]
supersedes: []
requires_rules: [FS-ELEM-001, FS-ELEM-003]
tags: [five_elements, remedy_strategy, xie_cycle, clash_guard, remedy_budget, signature_rule]
localization_notes: >
  "Drain" has negative connotations in English UI copy; prefer "soak up" or "carry away".
```

#### Why — tradition
The preference for draining over controlling is a real and frequently-stated principle: 實則洩其子,
"if excessive, drain via the child". It is why a Fire-heavy room is corrected with earth tones
rather than with water, and it is the piece of Wu Xing doctrine most often lost in popular
feng shui writing, which tends to jump straight to the opposing element. The clash guard follows
from the same logic that generates the stove-and-sink problem (`FS-ELEM-019`): two elements in a
controlling relation placed in immediate proximity are read as fighting, not as balancing, so a
"cure" placed next to the thing it cures is a new fault. The size-ratio condition reflects the
practitioner's insistence that a remedy be proportionate to what it addresses; the insulting
cycle (`FS-ELEM-026`) is what an undersized controller produces.

#### Why — psychology / physiology
No direct empirical support for the drain-versus-control preference. The remedy budget, however,
is a plain product and cognitive-load decision with independent justification: object count and
surface clutter degrade visual search performance and are consistently associated with lower
perceived order in environmental preference work, so an engine that resolves every symbolic
deficit by adding an object will make rooms measurably worse on the dimensions users actually
notice. Capping remedies also protects against a documented failure pattern in commercial feng
shui, where cures accumulate indefinitely because nothing in the system tells you to stop.

#### Customer insight
When something's taken over a room, we try to soak it up rather than fight it — that's what the
tradition actually prescribes, and it looks better than pairing a red wall with a blue vase. We
also cap ourselves at three of these fixes per room. A shelf of cures is its own problem.

#### Failure modes / when to skip
The clash guard can make a small room unremediable: in rooms whose longest dimension is under
2.4 m (7 ft 10 in) no two objects can be 1.2 m apart in a meaningful sense, so in those rooms
fall back to the drain route only and suppress controlling remedies entirely. The remedy budget
must count remedies proposed by every FS-* file, not just this one, or the caps leak. Do not
count functional objects that happen to carry an element (a kettle, a radiator) against the
remedy budget — only additions made *for* elemental reasons.

### FS-ELEM-013 — Object element clashing with its bagua sector

```yaml
id: FS-ELEM-013
title: Object element clashing with its bagua sector
system: feng_shui.compass.bagua
group: element_sector
version: 1
status: active
applies_to:
  rooms: [ANY_ROOM]
  objects: [ANY_OBJECT]
  requires_features: []
  min_room_area_m2: 6.0
scope: object_placement
severity: medium
confidence: tradition
evidence_class: traditional
belief_gated: true
predicate: |
  let o   = target
  let sec = baguaSector(centroid(o), room, p.bagua_method)
  let se  = SECTOR_ELEMENT[sec]
  let oe  = primaryElementOf(o)

  # A clash is EITHER direction of the controlling relation between object and sector.
  let rel = elementRelationFull(oe, se)
  let isClash = (rel == controls) or (rel == controlled_by)

  # Only large or otherwise salient objects count. A coaster does not afflict a sector.
  let salient = (visibleSurfaceArea(o) >= p.min_salient_area_m2)
             or (footprintArea(o) >= p.min_salient_footprint_m2)
             or (o.is_fixed == true)
             or (fire in o.emits) or (water in o.emits)

  assert not (isClash and salient and confidenceOfElement(o) >= p.min_element_confidence)
  penalize(clashMagnitude(oe, se) * saliencyOf(o), weight = p.sector_clash_weight)
  # Severity escalates when the object is fixed (plumbing, hearth) rather than movable.
  prefer (isClash and o.is_fixed) implies severityOverride(high)
params:
  - key: bagua_method
    default: compass
    range: [compass, bbb_form]
    unit: enum
    user_editable: true
    rationale: >
      Classical schools use the magnetic compass sector; BTB/Western practice overlays a fixed
      bagua keyed to the room's entry wall. The two disagree constantly and the app must let
      the user pick one and stay consistent. See FS-BAG-001.
  - key: min_salient_area_m2
    default: 0.35
    range: [0.05, 2.0]
    unit: m2
    user_editable: true
    rationale: >
      Visible surface area (0.35 m2 is about 3.8 ft2) below which an object is too small to
      register as an element in a sector. APP DESIGN CHOICE.
  - key: min_salient_footprint_m2
    default: 0.20
    range: [0.02, 1.5]
    unit: m2
    user_editable: true
    rationale: Alternative saliency test for low but wide objects such as rugs and trays.
  - key: min_element_confidence
    default: 0.5
    range: [0.0, 1.0]
    unit: fraction
    user_editable: false
    rationale: >
      Do not raise sector-clash findings on objects whose element was guessed from colour
      alone (see FS-ELEM-002). False positives here are especially annoying to users.
  - key: sector_clash_weight
    default: 5
    range: [0, 10]
    unit: weight
    user_editable: false
    rationale: Score slope per unit of sector clash.
  - key: count_controlled_by_as_clash
    default: true
    range: [true, false]
    unit: bool
    user_editable: true
    rationale: >
      Some practitioners treat only "object controls sector" as harmful and see
      "sector controls object" as merely weakening the object. Exposed because the schools
      differ and the engine should not pick a winner silently.
score:
  weight: 6
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: target
    transform: {to_sector: nearestSectorWhere(elementRelationFull(oe, SECTOR_ELEMENT[s]) in [generates, generated_by, same])}
    cost: free
    effort: medium
    reversible: true
    copy: Move this piece to a part of the room where its family and the area's family get along. We will show you the nearest spot that works.
  - rank: 2
    action: add_object
    add: decor.object.mediating
    transform: {element: mediatingElement(oe, se), position: between, max_distance_m: 1.0}
    cost: low
    effort: low
    reversible: true
    copy: If it cannot move, add a small piece from the family that sits between the two in the cycle — the tradition treats that as a bridge rather than a fight.
  - rank: 3
    action: swap_material
    target: target
    transform: {to_element: SECTOR_ELEMENT[sec]}
    cost: medium
    effort: medium
    reversible: true
    copy: Alternatively, change the finish on this piece so it belongs to the same family as the area it sits in.
  - rank: 4
    action: report_only
    target: target
    transform: {explain: fixed_object_cannot_move}
    cost: free
    effort: none
    reversible: true
    copy: This one is plumbed or built in, so it is not going anywhere. Here is what practitioners usually do instead.
conflicts_with: [FS-BAG-004, FS-8M-006, ERG-TSK-009]
supersedes: []
requires_rules: [FS-ELEM-001, FS-ELEM-002]
tags: [five_elements, bagua, sector, clash, placement]
localization_notes: >
  Sector names should be given as compass directions plus the trigram name for users who want
  it (e.g. "North / Kan"). Do not translate trigram names.
```

#### Why — tradition
The Later Heaven bagua assigns an element to each of the eight directions: Kan/North is Water,
Gen/Northeast Earth, Zhen/East Wood, Xun/Southeast Wood, Li/South Fire, Kun/Southwest Earth,
Dui/West Metal, Qian/Northwest Metal, with the centre treated as Earth. Compass School practice
then evaluates each sector's contents against that sector's element, flagging objects whose
element stands in a controlling relation to the sector — the canonical examples being a stove in
the North, a water feature in the South and heavy metal in the East. BTB/Western practice runs
the same test against a fixed bagua keyed to the entry rather than to magnetic north, which is
why the method is a parameter. Schools differ on whether both directions of the controlling
relation count as harmful, hence `count_controlled_by_as_clash`.

#### Why — psychology / physiology
No direct empirical support. There is no known mechanism by which the compass orientation of a
piece of furniture relative to a symbolic element map affects an occupant. The one physical
correlate worth noting is incidental: sector rules that discourage heat sources on southern
walls and encourage cool schemes there happen to align with solar gain in the northern
hemisphere, but the doctrine is hemisphere-invariant and makes the same call in Melbourne as in
Manchester, so this cannot be presented as a physical rationale. Treat it as a placement
discipline that users have opted into.

#### Customer insight
Feng shui gives each part of a room a family of its own, based on direction. When a piece's
family clashes with the area it's sitting in, practitioners suggest moving it a little, or
adding one small bridging piece. We'll always show you the nearest spot that works before
suggesting you change anything.

#### Failure modes / when to skip
Never override ergonomics or function to satisfy a sector: a desk that has to face the window
for glare reasons, or a bed that has to sit where the room allows, wins (contract §8, tier 3 and
5 beat tier 6). Skip in rooms under 6 m² (65 ft²), where sectors are too small to be
meaningful. Skip for all fixed plumbing and structural features except to report them. Do not
fire when `bagua_method` has not been chosen by the user — ask first, because the two methods
give contradictory findings and silently picking one destroys trust. Objects that straddle two
sectors should be assigned to the sector containing the larger share of their footprint, and
straddling objects with a near-even split should be skipped.

### FS-ELEM-014 — Sector element reinforcement preference

```yaml
id: FS-ELEM-014
title: Sector element reinforcement preference
system: feng_shui.compass.bagua
group: element_sector
version: 1
status: active
applies_to:
  rooms: [ANY_ROOM]
  objects: [ANY_OBJECT]
  requires_features: []
  min_room_area_m2: 6.0
scope: object_placement
severity: low
confidence: tradition
evidence_class: traditional
belief_gated: true
predicate: |
  let o   = target
  let sec = baguaSector(centroid(o), room, p.bagua_method)
  let se  = SECTOR_ELEMENT[sec]
  let oe  = primaryElementOf(o)
  let rel = elementRelationFull(oe, se)
  # Ranked preference, best to worst:
  #   same        -> reinforces the sector outright
  #   generates   -> object feeds the sector (the classical ideal: support, not saturation)
  #   generated_by-> sector feeds object (fine, but drains the sector)
  #   controls / controlled_by -> clash, handled by FS-ELEM-013
  prefer rel == generates       weight = 1.00
  prefer rel == same            weight = 0.85
  prefer rel == generated_by    weight = 0.45
  # Soft cap: a sector saturated with its own element is treated as excess, not strength.
  assert sectorElementCoverage(room, sec, se) <= p.sector_saturation_pct / 100
  # Whole-room preference: at least this many of the eight sectors should be non-clashing.
  prefer countOf(nonClashingSectors(room), room) >= p.min_harmonious_sectors
params:
  - key: sector_saturation_pct
    default: 65
    range: [40, 90]
    unit: percent
    user_editable: true
    rationale: >
      Coverage of a sector by its own element above which the sector is treated as saturated
      rather than supported. APP DESIGN CHOICE; classical sources say "support the sector"
      without quantifying it.
  - key: min_harmonious_sectors
    default: 6
    range: [3, 8]
    unit: count
    user_editable: true
    rationale: >
      Of the eight octants, how many must be clash-free for the room to pass. Six of eight is
      a deliberately achievable bar for real homes. APP DESIGN CHOICE.
  - key: prefer_feeding_over_matching
    default: true
    range: [true, false]
    unit: bool
    user_editable: true
    rationale: >
      Whether "object feeds sector" ranks above "object matches sector". Most classical
      remediation prefers feeding, since matching risks saturation; some practitioners prefer
      matching for clarity. Exposed rather than decided.
score:
  weight: 4
  curve: linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: target
    transform: {to_sector: bestFeedingSector(primaryElementOf(target))}
    cost: free
    effort: medium
    reversible: true
    copy: This piece would do more good a little further round the room, in the area whose family it naturally feeds.
  - rank: 2
    action: add_object
    add: decor.object.small
    transform: {element: PARENT_OF[SECTOR_ELEMENT[sec]], position: in_sector(sec)}
    cost: low
    effort: low
    reversible: true
    copy: To strengthen this corner the tradition adds the family that feeds it, not the family it already is.
  - rank: 3
    action: report_only
    target: room
    transform: {show: sector_element_overlay}
    cost: free
    effort: none
    reversible: true
    copy: Here is the element map for this room, corner by corner, so you can see what belongs where.
conflicts_with: [FS-ELEM-013, FS-BAG-004, FS-FS-007]
supersedes: []
requires_rules: [FS-ELEM-001, FS-ELEM-013]
tags: [five_elements, bagua, sector, reinforcement, placement]
localization_notes: Use compass words, not "top-left of your plan", which depends on drawing orientation.
```

#### Why — tradition
Compass School remediation does not merely avoid clashes; it actively strengthens a sector by
placing there either its own element or, preferably, the element that generates it — wood or
water in the East, metal or earth in the West, and so on. The preference for the feeding
relation over the matching one follows the same "tonify the mother" logic as `FS-ELEM-011` and
is the standard move in Eight Mansions and Flying Stars remediation, where a sector's star or
mansion element is supported rather than duplicated. The saturation cap is our addition: classical
sources warn against excess in general terms without giving a figure, so the number is ours.

#### Why — psychology / physiology
No direct empirical support. The only defensible independent effect is that a rule which
distributes material and colour families around a room's perimeter rather than clustering them
tends to produce better visual balance — which is a composition principle
(`composition.balance`) that would be worth applying on its own merits. The compass-specific
part has no mechanism.

#### Customer insight
Each corner of a room has its own family in feng shui, and you can strengthen a corner by adding
the family that feeds it — water or glass in the east where things grow, earth tones in the west
where metal belongs. It's a nice way to decide where a piece goes when you have no other reason.

#### Failure modes / when to skip
This rule is a soft preference and must never generate a blocking or high finding, nor move an
object that any higher-tier rule has positioned. Do not fire in rooms under 6 m² (65 ft²) or in
circulation spaces. Suppress in `open_plan_combined` unless the user has drawn functional zones,
since the eight sectors of a 60 m² open plan are each larger than a bedroom and the advice
becomes meaningless. When both this rule and `FS-ELEM-013` could fire on the same object, the
clash rule wins and this one stays silent.

### FS-ELEM-015 — Fire element in the North (Kan / Water) sector

```yaml
id: FS-ELEM-015
title: Fire element in the North (Kan / Water) sector
system: feng_shui.compass.bagua
group: element_sector
version: 1
status: active
applies_to:
  rooms: [ANY_ROOM]
  objects: [ANY_OBJECT, kitchen.range.*, lighting.candle.*, appliance.heater.*, decor.art.*]
  requires_features: []
  min_room_area_m2: 6.0
scope: object_placement
severity: medium
confidence: tradition
evidence_class: traditional
belief_gated: true
predicate: |
  let o = target
  let sec = baguaSector(centroid(o), room, p.bagua_method)
  assert not (sec == N
              and primaryElementOf(o) == fire
              and (visibleSurfaceArea(o) >= p.min_salient_area_m2 or (heat in o.emits)))
  # Colour-only case: a red north wall, the example most often cited in popular practice.
  let northWallArea = sum(forEach(w in wallsInSector(room, N), wallArea(w)))
  assert colorElementCoverageOnWalls(room, N, fire) <= p.north_fire_color_cap_pct / 100
  # Hard case: an actual heat or flame source in the north.
  assert not (sec == N and ((heat in o.emits) or (smoke in o.emits)) and o.is_fixed)
  penalize(fireLoadInSector(room, N), weight = p.north_fire_weight)
params:
  - key: north_fire_color_cap_pct
    default: 20
    range: [5, 50]
    unit: percent
    user_editable: true
    rationale: >
      Share of the northern walls that may carry fire-family colour before the engine flags
      it. APP DESIGN CHOICE. Set loose enough that a red painting is fine and a red feature
      wall is not.
  - key: north_fire_weight
    default: 4
    range: [0, 10]
    unit: weight
    user_editable: false
    rationale: Score slope for fire load in the north sector.
  - key: treat_career_sector_strictly
    default: false
    range: [true, false]
    unit: bool
    user_editable: true
    rationale: >
      BTB practice associates the north/Kan position with career and often treats afflictions
      there as more serious. Off by default because the stricter reading produces a lot of
      findings in small flats where the only free wall is the north one.
score:
  weight: 5
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: target
    transform: {to_sector: [S, SW, NE, E, SE], keep_function: true}
    cost: free
    effort: medium
    reversible: true
    copy: Shift this piece out of the northern part of the room if you can — south, east or the earthy corners all suit it better.
  - rank: 2
    action: recolor_surface
    target: wallsInSector(room, N)
    transform: {to_element: water_or_metal, from_element: fire}
    cost: low
    effort: medium
    reversible: true
    copy: If it is the wall colour, the north wall wants deep blue, charcoal, soft white or a metallic — those are the families the tradition puts there.
  - rank: 3
    action: add_object
    add: decor.object.earthen
    transform: {element: earth, position: in_sector(N), min_visible_area_m2: 0.2}
    cost: low
    effort: low
    reversible: true
    copy: When the hot piece cannot move, practitioners put something earthy beside it — earth sits between fire and water in the cycle, so it mediates rather than fights.
  - rank: 4
    action: report_only
    target: target
    transform: {explain: fixed_heat_source_in_north}
    cost: free
    effort: none
    reversible: true
    copy: A built-in heater or hob here is not something you would move for this reason alone. We are flagging it so you know why the score reads as it does.
conflicts_with: [FS-ELEM-013, SAFE-FIRE-004, HVAC-PLACE-002]
supersedes: []
requires_rules: [FS-ELEM-013]
tags: [five_elements, fire, north, kan, sector, colour, signature_rule]
localization_notes: >
  Hemisphere-invariant: north means compass north in both hemispheres (contract 1). Do NOT
  mirror this rule for southern-hemisphere users, however intuitive that seems.
```

#### Why — tradition
North is the Kan trigram, Water, associated in classical practice with career and life path and
in the annual cycle with winter. Placing Fire there sets Water against Fire in the *ke* relation
in its most cited form, and the sector is regarded as weakened rather than energised. The
specific cases practitioners raise are a red-painted north wall, a hob or heater on a northern
wall, and prominent red art in the north. The remedy convention is also standard: because Earth
sits between Fire and Water in the generating cycle, an earthen object placed between them is
treated as a mediator, and this "use the intervening element" move recurs throughout Compass
School remediation.

#### Why — psychology / physiology
No direct empirical support. There is no mechanism connecting compass orientation to the
psychological effect of a red wall; the colour's effect, such as it is, is the same on every
wall of the house. Note explicitly for users that the *tradition* is directional while the
*colour literature* is not: Elliot & Maier's review (*Annual Review of Psychology* 65:95–120,
2014) frames colour effects as context-dependent, and none of that context is compass bearing.

#### Customer insight
Red or fiery colours on a north-facing wall is one of the clashes feng shui mentions most often —
north belongs to the Water family, and the two are treated as opposites. Deep blue, charcoal,
soft white or a metallic finish are the traditional choices there. If the hot thing is built in,
practitioners put something stone or ceramic beside it as a buffer.

#### Failure modes / when to skip
Never move a heater, hob, flue or radiator for this reason: `SAFE-FIRE-*` and `HVAC-PLACE-*`
outrank it and the engine must say so in the finding. Skip when `bagua_method` is unset. Skip
in rooms under 6 m² (65 ft²). In bathrooms and utility spaces the north wall is frequently the
only plumbed wall, and the finding should be downgraded to advisory. Do not fire on small red
objects — the saliency test exists precisely so a red kettle in the north does not generate a
finding.

### FS-ELEM-016 — Water element in the South (Li / Fire) sector

```yaml
id: FS-ELEM-016
title: Water element in the South (Li / Fire) sector
system: feng_shui.compass.bagua
group: element_sector
version: 1
status: active
applies_to:
  rooms: [ANY_ROOM]
  objects: [decor.fountain.*, decor.aquarium.*, decor.mirror.wall, bath.*, kitchen.sink.*, ANY_OBJECT]
  requires_features: []
  min_room_area_m2: 6.0
scope: object_placement
severity: medium
confidence: tradition
evidence_class: traditional
belief_gated: true
predicate: |
  let o = target
  let sec = baguaSector(centroid(o), room, p.bagua_method)
  # Real, moving or contained water in the south is the strongest form of this finding.
  assert not (sec == S and ((water in o.emits) or isWaterFixture(o)))
  # Large mirrors and glass count as water surrogates in most modern practice.
  assert not (sec == S and o.reflective == true
              and visibleSurfaceArea(o) >= p.mirror_salient_area_m2
              and p.count_mirror_as_water == true)
  # Colour case: a deep blue or black south wall.
  assert colorElementCoverageOnWalls(room, S, water) <= p.south_water_color_cap_pct / 100
  penalize(waterLoadInSector(room, S), weight = 4)
params:
  - key: south_water_color_cap_pct
    default: 25
    range: [5, 55]
    unit: percent
    user_editable: true
    rationale: Share of southern walls that may carry water-family colour. APP DESIGN CHOICE.
  - key: mirror_salient_area_m2
    default: 0.30
    range: [0.05, 2.0]
    unit: m2
    user_editable: true
    rationale: >
      Mirror/glass area (0.30 m2 is about 3.2 ft2) above which a reflective object counts as a
      water presence.
  - key: count_mirror_as_water
    default: true
    range: [true, false]
    unit: bool
    user_editable: true
    rationale: >
      Modern practice counts mirrors and glass as Water; some classical readings treat them as
      Metal or as neutral. Exposed because the two readings give opposite findings in the
      south and the west. See FS-MAT-010.
  - key: allow_small_water_features
    default: true
    range: [true, false]
    unit: bool
    user_editable: true
    rationale: >
      Whether a table-top fountain under the saliency threshold is exempt. Strict
      practitioners would set this false.
score:
  weight: 5
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: target
    transform: {to_sector: [N, E, SE], keep_function: true}
    cost: free
    effort: medium
    reversible: true
    copy: Water pieces are happiest in the north, east or south-east. Moving a fountain or a big mirror round to one of those is the straightforward fix.
  - rank: 2
    action: add_object
    add: plants.plant.potted_medium
    transform: {element: wood, position: between(target, sectorCenter(S)), max_distance_m: 1.0}
    cost: low
    effort: low
    reversible: true
    copy: If it stays, put a plant between the water and the south of the room. Wood sits between water and fire in the cycle, so it acts as a buffer.
  - rank: 3
    action: swap_object
    target: decor.fountain.*
    transform: {to: decor.sculpture.stone, keep_scale: true}
    cost: medium
    effort: low
    reversible: true
    copy: A stone piece of similar size keeps the look and sidesteps the clash entirely.
  - rank: 4
    action: report_only
    target: target
    transform: {explain: plumbed_fixture_cannot_move}
    cost: free
    effort: none
    reversible: true
    copy: This is plumbed in, so moving it is a renovation, not a rearrangement. Worth knowing, not worth acting on for this alone.
conflicts_with: [FS-ELEM-013, PLUMB-FIX-001, SAFE-WTR-003]
supersedes: []
requires_rules: [FS-ELEM-013]
tags: [five_elements, water, south, li, sector, mirror, water_feature]
localization_notes: Hemisphere-invariant. South is compass south everywhere.
```

#### Why — tradition
South is the Li trigram, Fire, associated with recognition, clarity and reputation, and with
summer. Water placed there quenches the sector's own element in the most direct *ke* relation in
the system, and popular practice treats it as specifically damaging to reputation and
visibility. The most-cited instances are an aquarium or fountain on a southern wall and, in
modern practice, a large mirror there. Whether mirrors count as Water is genuinely contested —
most contemporary practitioners say yes, some classical readings treat polished surfaces as
Metal — which is why the engine exposes it as a switch rather than deciding. The Wood mediator
remedy again uses the intervening element in the generating cycle.

#### Why — psychology / physiology
No direct empirical support. One physical note that is *not* a justification but is worth giving
users honestly: in the northern hemisphere a southern wall receives the most direct solar gain,
so a large mirror there can create real glare and a fountain there will evaporate faster — but
those are consequences of sun, not of the Li trigram, and in the southern hemisphere the sun
argument reverses while the feng shui rule does not. Separately, a large mirror opposite strong
daylight is a genuine visual-discomfort problem handled by the glare rules.

#### Customer insight
Fountains, aquariums and big mirrors on a south-facing wall are one of the classic feng shui
clashes — south belongs to the Fire family, and water puts it out. North, east or south-east
suit water pieces much better. If it can't move, a plant in between is the traditional buffer.

#### Failure modes / when to skip
Plumbed fixtures are report-only; the engine must never suggest relocating a sink or bath for an
elemental reason, and `PLUMB-FIX-*` plus `SAFE-WTR-*` outrank this rule. Skip when
`bagua_method` is unset or in rooms under 6 m² (65 ft²). Never suggest removing a mirror that a
`FS-CMD-*` remedy placed for sightline reasons, or that `ACC-*` placed for wheelchair sightlines.
In `bathroom_*` and `wet_room` this rule should be suppressed entirely: the whole room is Water
by function and flagging its southern half is useless.

### FS-ELEM-017 — Metal in the Wood sectors, and Wood in the Earth sectors

```yaml
id: FS-ELEM-017
title: Metal in the Wood sectors, and Wood in the Earth sectors
system: feng_shui.compass.bagua
group: element_sector
version: 1
status: active
applies_to:
  rooms: [ANY_ROOM]
  objects: [ANY_OBJECT]
  requires_features: []
  min_room_area_m2: 6.0
scope: object_placement
severity: low
confidence: tradition
evidence_class: traditional
belief_gated: true
predicate: |
  let o = target
  let sec = baguaSector(centroid(o), room, p.bagua_method)
  let oe = primaryElementOf(o)
  # Case A: metal in East (Zhen) or South-East (Xun) - "metal cuts wood"
  assert not (sec in [E, SE] and oe == metal
              and metalLoadInSector(room, sec) > p.metal_in_wood_cap_pct / 100)
  # Case B: wood in South-West (Kun) or North-East (Gen) - "wood roots split earth"
  assert not (sec in [SW, NE] and oe == wood
              and woodLoadInSector(room, sec) > p.wood_in_earth_cap_pct / 100)
  # Case C (completes the set, lower weight): earth in North (Kan) - "earth dams water"
  #         and water in South already handled by FS-ELEM-016; fire in West (Dui) - "fire melts metal"
  assert not (sec == N and oe == earth and earthLoadInSector(room, N) > p.earth_in_water_cap_pct / 100)
  assert not (sec in [W, NW] and oe == fire and fireLoadInSector(room, sec) > p.fire_in_metal_cap_pct / 100)
  # Sharp-edged metal is the case practitioners single out, so it is weighted harder.
  penalize(metalLoadInSector(room, sec) * (1 + p.sharp_metal_multiplier * sharpEdgeFraction(o)),
           weight = 3)
params:
  - key: metal_in_wood_cap_pct
    default: 30
    range: [10, 60]
    unit: percent
    user_editable: true
    rationale: >
      Metal coverage within an east/south-east sector above which the clash is reported.
      APP DESIGN CHOICE, set loose because radiators, window frames and door furniture are
      metal and unavoidable.
  - key: wood_in_earth_cap_pct
    default: 45
    range: [20, 75]
    unit: percent
    user_editable: true
    rationale: >
      Wood coverage in south-west/north-east above which the clash is reported. Very loose;
      wooden furniture in the south-west corner of a living room is universal and flagging it
      would be absurd.
  - key: earth_in_water_cap_pct
    default: 45
    range: [20, 75]
    unit: percent
    user_editable: true
    rationale: Earth coverage in the north above which the clash is reported. APP DESIGN CHOICE.
  - key: fire_in_metal_cap_pct
    default: 28
    range: [10, 55]
    unit: percent
    user_editable: true
    rationale: Fire coverage in west/north-west above which the clash is reported. APP DESIGN CHOICE.
  - key: sharp_metal_multiplier
    default: 0.6
    range: [0.0, 2.0]
    unit: multiplier
    user_editable: true
    rationale: >
      Extra weight for metal with exposed sharp edges or blades in a wood sector, which is the
      specific configuration practitioners name.
score:
  weight: 3
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: target
    transform: {to_sector: nonClashingSectorFor(primaryElementOf(target))}
    cost: free
    effort: low
    reversible: true
    copy: Easiest fix: this piece belongs in a different part of the room. We will show you where.
  - rank: 2
    action: add_object
    add: decor.object.mediating
    transform: {element: mediatingElement(oe, SECTOR_ELEMENT[sec]), position: in_sector(sec)}
    cost: low
    effort: low
    reversible: true
    copy: Add one piece from the family that sits between these two in the cycle — water between metal and wood, fire between wood and earth.
  - rank: 3
    action: add_object
    add: plants.plant.potted_small
    transform: {when: sec in [E, SE], element: wood, count: 2}
    cost: low
    effort: low
    reversible: true
    copy: In the east and south-east, simply adding more of the growing family outweighs the metal that is already there.
  - rank: 4
    action: report_only
    target: target
    transform: {explain: unavoidable_metal, examples: [radiator, window_frame, door_hardware]}
    cost: free
    effort: none
    reversible: true
    copy: Radiators, window frames and handles are metal and they are not moving. Practitioners generally ignore fixed building metal and look at the loose pieces instead.
conflicts_with: [FS-ELEM-013, HVAC-PLACE-002]
supersedes: []
requires_rules: [FS-ELEM-013]
tags: [five_elements, sector, metal, wood, earth, completeness, boring_cases]
localization_notes: None specific.
```

#### Why — tradition
This rule exists to complete the sector-clash set rather than to introduce a new idea: once the
Later Heaven element map and the *ke* cycle are accepted, every controlling pair generates a
directional caution, and practitioners do in fact name them — metal in the east and south-east
("metal cuts wood", often cited against large metal filing cabinets or sharp-edged metal
furniture in the east), wood in the south-west and north-east ("wood roots split earth", cited
against tall plants in the earth corners), earth in the north, and fire in the west and
north-west. These are consistently treated as the milder clashes compared with fire-in-north and
water-in-south, which is why the severity and thresholds here are looser. Note that the wood-in-
earth caution sits awkwardly with the near-universal advice to put plants almost anywhere, and
practitioners tend to waive it for small plants.

#### Why — psychology / physiology
No direct empirical support; no mechanism. The only genuinely useful side effect is that the
sharp-edge term overlaps with a real concern — exposed sharp edges and corners at body height
are a recognised minor injury source and a `SAFE-CHILD-*` / `SAFE-SENIOR-*` consideration — so
where the two coincide the engine should lead with the safety framing, which is both true and
more actionable.

#### Customer insight
These are the quieter element clashes: lots of metal in the east where things grow, big plants
in the earthy south-west corner, and so on. They are worth knowing about but nobody moves a
radiator over them. If a fix is easy, we'll suggest it; otherwise we'll just note it.

#### Failure modes / when to skip
Fixed building metal — radiators, window frames, door hardware, electrical plates, ductwork —
must be excluded from the metal load entirely or this rule fires in every room of every home.
Do not flag small plants anywhere; the wood-in-earth caution should require a plant over roughly
1 m (3 ft 3 in) tall or a substantial timber mass. Skip in kitchens (metal everywhere by
function) and in `utility_mechanical`. When a sharp-edge safety finding also applies, suppress
this rule and let the safety rule speak.

### FS-ELEM-018 — Room-function element target profile

```yaml
id: FS-ELEM-018
title: Room-function element target profile
system: feng_shui.five_elements
group: element_function
version: 1
status: active
applies_to:
  rooms: [ANY_ROOM]
  objects: [ANY_OBJECT]
  requires_features: []
scope: room_composition
severity: medium
confidence: tradition
evidence_class: traditional
belief_gated: true
predicate: |
  # Constant table + assertion. Percentages are IDEAL and MAX values for elementCoverageVector.
  # Rows sum to 100 on `ideal`. These are APP DESIGN CHOICES informed by which element each
  # room type is traditionally associated with; they are not quoted from any text.
  let TARGETS = {
    #                        wood fire earth metal water   (ideal %)        | caps (max %)
    kitchen:               {wood: 15, fire: 30, earth: 25, metal: 20, water: 10}, # fire-led
    eat_in_kitchen:        {wood: 18, fire: 27, earth: 25, metal: 18, water: 12},
    breakfast_nook:        {wood: 25, fire: 20, earth: 25, metal: 15, water: 15},
    formal_dining:         {wood: 20, fire: 25, earth: 30, metal: 15, water: 10}, # nourishment
    pantry_walk_in:        {wood: 20, fire: 10, earth: 35, metal: 25, water: 10},
    butlers_pantry:        {wood: 15, fire: 10, earth: 30, metal: 35, water: 10},
    living_room:           {wood: 22, fire: 20, earth: 22, metal: 18, water: 18}, # balanced
    family_room:           {wood: 25, fire: 22, earth: 23, metal: 15, water: 15},
    great_room:            {wood: 22, fire: 20, earth: 23, metal: 18, water: 17},
    open_plan_combined:    {wood: 22, fire: 20, earth: 22, metal: 18, water: 18},
    bedroom_primary:       {wood: 22, fire: 10, earth: 38, metal: 15, water: 15}, # earth-led
    bedroom_secondary:     {wood: 24, fire: 10, earth: 36, metal: 15, water: 15},
    bedroom_guest:         {wood: 22, fire: 10, earth: 38, metal: 15, water: 15},
    bedroom_child:         {wood: 30, fire:  8, earth: 34, metal: 14, water: 14},
    bedroom_teen:          {wood: 30, fire: 12, earth: 30, metal: 16, water: 12},
    nursery:               {wood: 28, fire:  5, earth: 42, metal: 13, water: 12},
    bedroom_shared_siblings:{wood: 30, fire: 8, earth: 34, metal: 14, water: 14},
    dorm_room:             {wood: 26, fire: 12, earth: 30, metal: 18, water: 14},
    studio_apartment:      {wood: 24, fire: 16, earth: 26, metal: 18, water: 16},
    bathroom_full:         {wood: 20, fire:  8, earth: 22, metal: 20, water: 30}, # water-led
    bathroom_three_quarter:{wood: 20, fire:  8, earth: 22, metal: 20, water: 30},
    powder_room:           {wood: 18, fire: 10, earth: 22, metal: 22, water: 28},
    ensuite:               {wood: 20, fire:  8, earth: 24, metal: 20, water: 28},
    jack_and_jill_bath:    {wood: 20, fire:  8, earth: 22, metal: 20, water: 30},
    wet_room:              {wood: 18, fire:  6, earth: 22, metal: 22, water: 32},
    laundry_room:          {wood: 14, fire: 10, earth: 20, metal: 30, water: 26},
    laundry_closet:        {wood: 12, fire: 10, earth: 20, metal: 32, water: 26},
    home_office:           {wood: 28, fire: 14, earth: 20, metal: 24, water: 14}, # wood+metal
    home_office_shared:    {wood: 28, fire: 14, earth: 20, metal: 24, water: 14},
    study_library:         {wood: 32, fire: 10, earth: 20, metal: 16, water: 22}, # water feeds wood
    homework_nook:         {wood: 32, fire: 10, earth: 20, metal: 16, water: 22},
    media_room:            {wood: 16, fire: 26, earth: 30, metal: 14, water: 14}, # yin + fire
    home_theater:          {wood: 14, fire: 28, earth: 32, metal: 12, water: 14},
    game_room:             {wood: 20, fire: 30, earth: 22, metal: 16, water: 12},
    home_gym:              {wood: 24, fire: 30, earth: 20, metal: 18, water:  8}, # fire+wood
    yoga_meditation_room:  {wood: 22, fire:  8, earth: 38, metal: 12, water: 20}, # earth+water
    music_room:            {wood: 30, fire: 16, earth: 20, metal: 22, water: 12},
    craft_hobby_room:      {wood: 26, fire: 18, earth: 22, metal: 22, water: 12},
    workshop_garage:       {wood: 18, fire: 14, earth: 26, metal: 34, water:  8}, # metal-led
    garage_parking:        {wood: 12, fire: 10, earth: 30, metal: 38, water: 10},
    entry_foyer:           {wood: 24, fire: 16, earth: 22, metal: 18, water: 20}, # flow
    mudroom:               {wood: 20, fire: 10, earth: 30, metal: 24, water: 16},
    porch_entry:           {wood: 26, fire: 14, earth: 26, metal: 16, water: 18},
    hallway_corridor:      {wood: 24, fire: 14, earth: 24, metal: 20, water: 18},
    stair_core:            {wood: 24, fire: 14, earth: 26, metal: 20, water: 16},
    basement_finished:     {wood: 26, fire: 20, earth: 26, metal: 16, water: 12}, # lift the yin
    basement_unfinished:   {wood: 22, fire: 18, earth: 32, metal: 18, water: 10},
    attic_finished:        {wood: 24, fire: 16, earth: 30, metal: 16, water: 14},
    attic_storage:         {wood: 20, fire: 12, earth: 34, metal: 20, water: 14},
    walk_in_closet:        {wood: 22, fire: 10, earth: 26, metal: 28, water: 14},
    reach_in_closet:       {wood: 22, fire: 10, earth: 26, metal: 28, water: 14},
    dressing_room:         {wood: 22, fire: 14, earth: 24, metal: 26, water: 14},
    linen_closet:          {wood: 22, fire:  8, earth: 28, metal: 28, water: 14},
    utility_mechanical:    {wood: 12, fire: 14, earth: 26, metal: 36, water: 12},
    sunroom_conservatory:  {wood: 34, fire: 16, earth: 20, metal: 14, water: 16},
    balcony:               {wood: 34, fire: 14, earth: 22, metal: 14, water: 16},
    patio_deck:            {wood: 32, fire: 16, earth: 24, metal: 12, water: 16},
    roof_terrace:          {wood: 30, fire: 16, earth: 24, metal: 14, water: 16},
    garden_yard:           {wood: 36, fire: 12, earth: 24, metal: 10, water: 18},
    prayer_altar_room:     {wood: 18, fire: 26, earth: 34, metal: 12, water: 10}, # earth+fire
    home_altar_nook:       {wood: 18, fire: 26, earth: 34, metal: 12, water: 10},
    wine_cellar:           {wood: 16, fire:  6, earth: 40, metal: 14, water: 24},
    safe_room:             {wood: 14, fire:  8, earth: 42, metal: 26, water: 10},
    pet_room:              {wood: 26, fire: 12, earth: 30, metal: 16, water: 16},
    storage_room:          {wood: 20, fire: 10, earth: 32, metal: 24, water: 14},
    loft:                  {wood: 26, fire: 18, earth: 24, metal: 18, water: 14},
    guest_suite:           {wood: 22, fire: 12, earth: 34, metal: 16, water: 16},
    adu_in_law_suite:      {wood: 22, fire: 14, earth: 32, metal: 16, water: 16},
    multigen_wing:         {wood: 22, fire: 14, earth: 32, metal: 16, water: 16},
    elevator_lift_lobby:   {wood: 20, fire: 14, earth: 26, metal: 26, water: 14}
  }
  # max_pct defaults to ideal * p.max_multiplier, floored at p.min_cap_pct,
  # with named exceptions applied afterwards (see params).
  let tgt = TARGETS[room.type]
  forEach(e in ELEMENTS,
    let cap = max(p.min_cap_pct, tgt[e] * p.max_multiplier)
    assert elementCoverageVector(room)[e] <= cap / 100)
  penalize(profileDistance(elementCoverageVector(room), tgt), weight = 5)
params:
  - key: max_multiplier
    default: 1.7
    range: [1.2, 3.0]
    unit: multiplier
    user_editable: true
    rationale: >
      How far above its ideal an element may go before the cap trips. APP DESIGN CHOICE. At
      1.7 a kitchen may run to 51% Fire before being flagged, which matches the intuition
      that kitchens are allowed to be hot.
  - key: min_cap_pct
    default: 22
    range: [12, 40]
    unit: percent
    user_editable: false
    rationale: >
      Floor under every cap, so an element with a low ideal (Fire in a nursery at 5%) is not
      flagged at 9% coverage, which would be unusably strict.
  - key: restful_room_fire_cap_pct
    default: 12
    range: [5, 30]
    unit: percent
    user_editable: true
    rationale: >
      Named exception overriding the computed cap for sleeping and meditation rooms, where the
      tradition is much firmer about Fire. Applied after max_multiplier.
  - key: use_function_targets
    default: true
    range: [true, false]
    unit: bool
    user_editable: true
    rationale: >
      Off switches the engine to flat 20/20/20/20/20 evenness, which some users prefer for
      simplicity and which makes findings easier to explain.
score:
  weight: 6
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: report_only
    target: room
    transform: {show: target_vs_actual_bars}
    cost: free
    effort: none
    reversible: true
    copy: Here is the mix this kind of room usually wants, next to what it has now.
  - rank: 2
    action: apply_rule_remedies
    target: room
    transform: {from_rule: largestGapRule(room), max_remedies: 2}
    cost: varies
    effort: varies
    reversible: true
    copy: Two changes get this room closest to the mix its job calls for.
conflicts_with: [FS-ELEM-003, FS-ELEM-004]
supersedes: []
requires_rules: [FS-ELEM-001, FS-ELEM-003]
tags: [five_elements, room_function, target_profile, constant_table, signature_rule]
localization_notes: >
  Room type names must be localised from the contract enum, not from this table's keys.
```

#### Why — tradition
Feng shui has always read rooms by function as well as by direction: the hearth room is Fire, the
bathroom is Water, the storeroom and the bedroom are Earth-leaning and yin, the study is
supported by Water feeding Wood (water as wisdom nourishing growth), the workshop is Metal. These
associations are stated qualitatively across classical and modern sources and they are widely
agreed. What no source provides is a percentage split, so every number in this table is our
construction — a defensible encoding of "kitchens are fire-led, bedrooms are earth-led" into a
form the engine can score against. Two design commitments are worth naming: bedrooms are
earth-led rather than water-led because the tradition wants stability and containment in sleep,
and studies are wood-led with high water because the *sheng* relation Water→Wood is the standard
reading of scholarship and growth.

#### Why — psychology / physiology
No direct empirical support for the profiles. Several rows nevertheless encode preferences that
ordinary design and building science would also produce: hard cleanable surfaces (our Metal and
Earth) in kitchens, bathrooms and utility rooms; soft absorptive surfaces and low arousal
(low Fire) in bedrooms; high daylight and planting (Wood) in sunrooms. Where a row happens to
agree with a functional requirement, the engine should cite the functional reason, which is
independently true, rather than the elemental one.

#### Customer insight
Different rooms want different mixes. A kitchen is meant to run hot; a bedroom is meant to feel
grounded and settled; a bathroom is water's own territory. We compare your room against the mix
its job usually calls for, rather than against a flat five-way split — which is why we won't
tell you your kitchen has too much Fire.

#### Failure modes / when to skip
The table is opinionated and will disagree with some practitioners, especially on bedrooms
(some schools prefer Wood-led) and studies. Expose `use_function_targets` so a user who
disagrees can fall back to flat evenness. Rooms with a user-declared purpose different from
their type (a bedroom used as an office) must use the declared purpose's profile, or every
finding will be wrong. For `open_plan_combined`, compute per declared zone and blend by area.
Never let a profile gap outrank a safety, accessibility or ergonomic finding.

### FS-ELEM-019 — Fire and Water fixtures too close within a room (the stove-and-sink case)

```yaml
id: FS-ELEM-019
title: Fire and Water fixtures too close within a room (the stove-and-sink case)
system: feng_shui.five_elements
group: element_clash
version: 1
status: active
applies_to:
  rooms: [kitchen, eat_in_kitchen, butlers_pantry, laundry_room, studio_apartment, open_plan_combined, adu_in_law_suite]
  objects: [kitchen.range.*, kitchen.cooktop.*, kitchen.oven.*, kitchen.sink.*, kitchen.dishwasher.*, kitchen.refrigerator.*, appliance.*]
  requires_features: []
scope: object_pair
severity: medium
confidence: tradition
evidence_class: traditional
belief_gated: true
predicate: |
  let fires  = objectsWhere(isFireFixture(o))      # range, cooktop, oven, hob
  let waters = objectsWhere(isWaterFixture(o))     # sink, dishwasher, washing machine, fridge

  forEach(f in fires, forEach(w in waters,
    # 1. Side-by-side case: measured edge to edge along the run, not centre to centre,
    #    because what practitioners actually ask for is worktop between them.
    assert edgeGap(f, w) >= p.min_fire_water_gap_m

    # 2. Directly-opposite case: facing each other across a galley or island.
    assert not (alignedWithin(f.frontAxis, w.frontAxis, tol_deg = p.opposition_tol_deg)
                and facingEachOther(f, w)
                and distance(centroid(f), centroid(w)) < p.min_fire_water_opposite_m)

    # 3. Shared-cabinet case: fire and water in the same run with no cabinet between them.
    prefer countOf(cabinetsBetween(f, w), room) >= 1))

  # 4. The refrigerator case is treated separately and more leniently: a fridge is Water by
  #    function in most readings but is not an open water surface.
  forEach(f in fires,
    prefer edgeGap(f, nearest(kitchen.refrigerator.*)) >= p.min_fire_fridge_gap_m)

  penalize(sum(forEach(pair, max(0, p.min_fire_water_gap_m - edgeGap(pair)))), weight = 5)
params:
  - key: min_fire_water_gap_m
    default: 0.600
    range: [0.300, 1.500]
    unit: m
    user_editable: true
    rationale: >
      Minimum clear worktop between hob and sink: 0.600 m is about 24 in / 2 ft. This figure is
      the one most commonly given in contemporary feng shui guidance for the water-fire clash
      (shui huo bu rong), and it also happens to match the landing-and-prep zone that kitchen
      design practice wants beside a hob for entirely practical reasons. Some practitioners ask
      for 0.9-1.5 m (3-5 ft); raise the parameter for a stricter reading.
  - key: min_fire_water_opposite_m
    default: 1.200
    range: [0.900, 2.400]
    unit: m
    user_editable: true
    rationale: >
      Minimum separation when hob and sink face each other across a galley or island: 1.200 m
      is about 47 in. Note the collision with ergonomics - a working aisle narrower than about
      1.0 m (39 in) is a separate problem owned by the kitchen ergonomics rules, and where the
      two disagree ergonomics wins.
  - key: min_fire_fridge_gap_m
    default: 0.450
    range: [0.150, 1.200]
    unit: m
    user_editable: true
    rationale: >
      Hob-to-fridge gap, 0.450 m is about 18 in. Looser than the sink figure because the
      tradition treats a closed appliance as a weaker water presence. Appliance manufacturers
      also specify minimum clearances for heat reasons; where a manufacturer figure exists it
      is larger and it wins.
  - key: opposition_tol_deg
    default: 25
    range: [5, 45]
    unit: deg
    user_editable: false
    rationale: Angular tolerance within which two fixtures count as directly facing each other.
  - key: strict_no_shared_run
    default: false
    range: [true, false]
    unit: bool
    user_editable: true
    rationable: Placeholder key retained for schema stability; see rationale.
    rationale: >
      When true, hob and sink may not share a single counter run at all, regardless of gap.
      Off by default because it makes most real small kitchens unfixable.
score:
  weight: 6
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: report_only
    target: [kitchen.range.*, kitchen.sink.*]
    transform: {explain: fixed_services_note}
    cost: free
    effort: none
    reversible: true
    copy: Hob and sink are both plumbed or wired in, so this is a renovation note rather than a weekend job. Worth knowing if you are planning a kitchen.
  - rank: 2
    action: add_object
    add: decor.object.wooden_board
    transform: {element: wood, position: between(fire, water), min_width_m: 0.25}
    cost: low
    effort: low
    reversible: true
    copy: The usual quick remedy is something wooden between the two — a board, a chopping block, a wooden utensil pot. Wood sits between water and fire in the cycle, so tradition treats it as a buffer rather than a barrier.
  - rank: 3
    action: add_object
    add: plants.plant.potted_small
    transform: {element: wood, position: between(fire, water), max_height_m: 0.35, min_distance_to_heat_m: 0.3}
    cost: low
    effort: low
    reversible: true
    copy: A small herb pot between them does the same job and earns its keep.
  - rank: 4
    action: move_object
    target: kitchen.refrigerator.*
    transform: {min_gap_from: kitchen.range.*, gap_m: p.min_fire_fridge_gap_m}
    cost: free
    effort: high_physical
    reversible: true
    copy: The fridge is the one piece here that can actually move. Sliding it away from the hob satisfies both the tradition and the appliance manual.
  - rank: 5
    action: relocate_service
    target: kitchen.sink.*
    transform: {min_gap_from: kitchen.range.*, gap_m: p.min_fire_water_gap_m}
    cost: high
    effort: high_physical
    reversible: false
    copy: If the kitchen is being redone, putting a run of worktop between hob and sink is the fix — and it is what kitchen designers want anyway, for chopping space.
conflicts_with: [ERG-KIT-004, ERG-KIT-007, SAFE-FIRE-006, PLUMB-FIX-001]
supersedes: []
requires_rules: [FS-ELEM-001]
tags: [five_elements, kitchen, fire_water_clash, stove, sink, object_pair, signature_rule]
localization_notes: >
  Always give both metric and imperial in the finding copy: "at least 60 cm (about 2 ft) of
  worktop". The Chinese term shui huo bu rong may be shown to users who have asked for
  traditional terminology.
```

#### Why — tradition
The water–fire clash (水火不容, *shui huo bu rong*) is the single most frequently cited elemental
conflict in domestic feng shui, and the kitchen is where it lives: Water controls Fire in the
*ke* cycle, so hob and sink adjacent or directly opposed is read as continuous low-grade
household friction, classically associated with arguments and with money leaking away. The
remedy convention is unusually consistent across sources — put worktop between them, and if you
cannot, put something wooden between them, Wood being the element that sits between Water and
Fire in the generating cycle. The commonly quoted minimum of about 60 cm (2 ft) appears widely in
contemporary guidance; stricter practitioners ask for 90–150 cm (3–5 ft). No classical text
gives a measurement, so treat the number as modern practitioner convention, which is why it is
a parameter with a wide range.

#### Why — psychology / physiology
No empirical support for the elemental claim. But this is the best example in the whole file of
tradition landing on a good answer for the wrong reason, and the app should say so plainly:
kitchen design practice independently wants clear worktop immediately beside a hob — a landing
zone for hot pans and a prep zone — and putting the sink hard against the hob eliminates it.
Splashing water into hot oil is a genuine hazard, steam from the sink fouls the hob surround,
and reaching across a live burner to the tap is a burn risk. So the fix the tradition prescribes
is the fix a kitchen designer and a safety assessor would both prescribe. Where the two
disagree on the *number*, the ergonomic and manufacturer figures win.

#### Customer insight
Hob right next to the sink is the clash feng shui talks about most — fire and water in each
other's faces, traditionally linked to friction in the household. Happily, kitchen designers
want the same thing for practical reasons: about 60 cm (2 ft) of worktop beside the hob to land
hot pans and chop on. If a refit isn't on the cards, the traditional quick fix is something
wooden in between, and a chopping board counts.

#### Failure modes / when to skip
Never propose relocating plumbing or gas as a first-line remedy; rank it last and mark it a
renovation. `ERG-KIT-*` working-aisle minimums and `SAFE-FIRE-*` clearances both outrank this
rule and the engine must tell the user when they do. In galley kitchens under 2.4 m (7 ft 10 in)
wide the opposition test will always fail and should be suppressed with an explanatory note
rather than reported as a fault. Do not fire on bar sinks, prep sinks or instant-hot taps under
`p.min_salient` size unless the user has selected a strict preset. Suppress in
`laundry_closet` and `utility_mechanical`, where co-located water and heat are the entire point.

### FS-ELEM-020 — Water feature and fire feature in direct confrontation

```yaml
id: FS-ELEM-020
title: Water feature and fire feature in direct confrontation
system: feng_shui.five_elements
group: element_clash
version: 1
status: active
applies_to:
  rooms: [living_room, family_room, great_room, formal_dining, entry_foyer, bedroom_primary, sunroom_conservatory, open_plan_combined, yoga_meditation_room, media_room]
  objects: [decor.fountain.*, decor.aquarium.*, decor.art.water_scene, decor.mirror.wall, lighting.candle.*, decor.fire_bowl.*]
  requires_features: [fireplace, chimney_breast]
scope: object_pair
severity: medium
confidence: tradition
evidence_class: traditional
belief_gated: true
predicate: |
  let hearth = nearestFeature(room, fireplace)
  let waters = objectsWhere((water in o.emits) or isWaterFixture(o)
                            or (o.type in [decor.fountain.*, decor.aquarium.*, decor.art.water_scene]))

  forEach(w in waters,
    # 1. ABOVE the hearth - the single most-cited configuration: water art or a mirror on the
    #    chimney breast above a working fireplace.
    assert not (isAbove(w, hearth) and horizontalOverlap(w, hearth) > p.overlap_frac
                and verticalGap(w, hearth) < p.min_vertical_gap_m)
    # 2. BELOW / in front of the hearth.
    assert not (isUnder(w, hearth) or distance(centroid(w), centroid(hearth)) < p.min_hearth_gap_m)
    # 3. Water art depicting water counts, per modern practice, at reduced weight.
    prefer not (w.type == decor.art.water_scene and distance(centroid(w), centroid(hearth)) < p.min_hearth_gap_m))

  # 4. Candles standing in or on a water feature, and the reverse.
  forEach(c in objectsOfType(lighting.candle.*),
    assert not exists(w in waters where distance(centroid(c), centroid(w)) < p.min_candle_water_m))
  penalize(hearthWaterClashLoad(room), weight = 4)
params:
  - key: min_vertical_gap_m
    default: 0.900
    range: [0.300, 2.000]
    unit: m
    user_editable: true
    rationale: >
      Clear vertical distance (0.900 m is about 35 in) between the top of a firebox opening and
      the bottom of a water-associated object above it. APP DESIGN CHOICE for the elemental
      part; note that the *thermal* clearance above a firebox is set by the appliance listing
      and local code and is often larger, in which case it governs.
  - key: min_hearth_gap_m
    default: 1.200
    range: [0.600, 3.000]
    unit: m
    user_editable: true
    rationale: Horizontal separation (1.200 m is about 47 in) between a water feature and a hearth.
  - key: min_candle_water_m
    default: 0.200
    range: [0.050, 0.600]
    unit: m
    user_editable: true
    rationale: >
      Candle-to-water separation, 0.200 m is about 8 in. Deliberately small: floating candles
      are a popular decorative form and flagging every one would be silly, so this only
      catches a candle actually standing in a fountain or bowl.
  - key: overlap_frac
    default: 0.30
    range: [0.0, 1.0]
    unit: fraction
    user_editable: false
    rationale: Horizontal footprint overlap above which an object counts as being directly over the hearth.
  - key: count_water_imagery
    default: true
    range: [true, false]
    unit: bool
    user_editable: true
    rationale: >
      Whether pictures of water (seascapes, lake scenes) count as a water presence. Modern
      practice generally says yes, classical sources do not address imagery. Exposed, because
      this is the difference between flagging and not flagging a very common decorating choice.
score:
  weight: 5
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: swap_object
    target: decor.art.water_scene
    transform: {to: decor.art.landscape_earth_or_wood, keep_frame: true, keep_position: true}
    cost: low
    effort: low
    reversible: true
    copy: Over a fireplace, practitioners swap a seascape for a landscape, a forest scene or something earthy — same spot, same frame, no clash.
  - rank: 2
    action: move_object
    target: [decor.fountain.*, decor.aquarium.*]
    transform: {min_distance_from: fireplace, distance_m: p.min_hearth_gap_m, prefer_sector: [N, E, SE]}
    cost: free
    effort: medium
    reversible: true
    copy: Move the fountain or tank across the room — north, east or south-east are the traditional homes for water pieces.
  - rank: 3
    action: add_object
    add: decor.object.wooden
    transform: {element: wood, position: between(water, fireplace)}
    cost: low
    effort: low
    reversible: true
    copy: If neither can move, something wooden in between is the standard buffer.
  - rank: 4
    action: swap_object
    target: decor.mirror.wall
    transform: {to: decor.art.framed, when: isAbove(target, fireplace)}
    cost: low
    effort: low
    reversible: true
    copy: A mirror over the fireplace is a very common arrangement, and one that modern feng shui reads as water over fire. Art instead of a mirror settles it — and avoids the glare a mirror throws from firelight and downlights.
conflicts_with: [SAFE-FIRE-002, SAFE-FIRE-009, COMP-FOCAL-003, FS-ELEM-016]
supersedes: []
requires_rules: [FS-ELEM-001, FS-ELEM-019]
tags: [five_elements, fireplace, water_feature, mirror, fire_water_clash, object_pair]
localization_notes: >
  A mirror over the mantel is a strong convention in British, French and North American
  interiors. Copy must not imply the user has made a mistake; frame it as a tradition-specific
  observation with an easy swap.
```

#### Why — tradition
The same *ke* relation as the kitchen case, applied to the other place it shows up in a home: the
hearth. Water above Fire is regarded as the more serious orientation, because the controlling
element sits over the thing it controls — hence the specific and often-repeated caution against
hanging a mirror, a seascape or an aquarium above a working fireplace. Whether *depictions* of
water count is a modern extension; classical texts address physical water, while contemporary
practice, especially BTB, treats imagery as carrying the element. The Wood buffer is again the
intervening-element move.

#### Why — psychology / physiology
No empirical support for the elemental claim. Two independent reasons do support the specific
mirror-over-mantel remedy, and they are the better thing to say: a mirror above a fireplace sits
at exactly the height to reflect ceiling downlights and firelight into a seated occupant's eyes,
which is a straightforward glare problem, and the surface is subject to heat and soot deposition
that shortens its life. Also worth noting for honesty: the composition tradition is squarely
*against* this rule — a mirror over the mantel is a centuries-old device for doubling light and
emphasising the room's focal point, and `COMP-FOCAL-*` will actively recommend a large object
there.

#### Customer insight
A mirror or a seascape above the fireplace is a lovely, very common arrangement — and it's one
feng shui reads as water sitting on top of fire. Swapping to a landscape or a piece of art in
the same frame settles it, and it also stops the mirror bouncing downlight and firelight into
your eyes from the sofa.

#### Failure modes / when to skip
Requires a `fireplace` or `chimney_breast` feature; do not infer a hearth from a TV or a
radiator. Clearances above a firebox are set by the appliance listing and local code
(`SAFE-FIRE-002`, `SAFE-FIRE-009`) and always govern over the elemental figure. Suppress
entirely in rooms with a decorative, sealed or non-working fireplace unless the user says it is
used — a blocked Victorian hearth is not Fire in any practical sense, though strict
practitioners disagree, so expose it as a room-level flag. Do not fire on candle-and-water
proximity for floating-candle bowls, which are a single object. When `COMP-FOCAL-*` has placed
a mirror above the hearth deliberately, present both views rather than a one-sided finding.

### FS-ELEM-021 — Element clash between adjacent and vertically stacked rooms

```yaml
id: FS-ELEM-021
title: Element clash between adjacent and vertically stacked rooms
system: feng_shui.five_elements
group: element_clash
version: 1
status: active
applies_to:
  rooms: [ANY_ROOM]
  objects: []
  requires_features: []
scope: room_adjacency
severity: low
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let a = room
  forEach(b in adjacentRooms(a),
    let ea = dominantFunctionalElement(a)      # from FS-ELEM-018 profile, not from finishes
    let eb = dominantFunctionalElement(b)
    let rel = elementRelationFull(ea, eb)

    # 1. HORIZONTAL: a shared wall between rooms whose functional elements control each other.
    if sharedWall(a, b):
      let sw = sharedWallOf(a, b)
      # Severity scales with how much of the wall is shared and whether the clashing
      # fixtures are actually ON that wall.
      let load = sharedWallFraction(a, b)
                 * fixtureLoadOnWall(a, sw, ea) * fixtureLoadOnWall(b, sw, eb)
      assert not (rel in [controls, controlled_by] and load > p.shared_wall_clash_threshold)
      # The named case: kitchen (fire) sharing a wall with a bathroom (water).
      prefer not (a.type in [kitchen, eat_in_kitchen]
                  and b.type in [bathroom_full, bathroom_three_quarter, powder_room, ensuite, wet_room]
                  and backToBackFixtures(a, b, max_offset_m = p.back_to_back_offset_m))
      # Second named case: bathroom sharing a wall with the head of a bed.
      prefer not (b.type in [bathroom_full, ensuite, wet_room]
                  and exists(bed in a.objects where isOnWall(bed, sw) and bed.type in [sleep.bed.*]))

    # 2. VERTICAL: stacked rooms.
    if verticallyStacked(a, b):
      # Wet room directly over a kitchen or hearth is the case practitioners name.
      prefer not (upperRoom(a,b).type in [bathroom_full, bathroom_three_quarter, ensuite, wet_room, laundry_room]
                  and lowerRoom(a,b).type in [kitchen, eat_in_kitchen]
                  and footprintOverlapFraction(a, b) > p.stack_overlap_threshold)
      # And the reverse: a hearth or hob directly under a bath or WC.
      prefer not (exists(f in lowerRoom(a,b).features where f.kind == fireplace)
                  and exists(x in upperRoom(a,b).objects where isWaterFixture(x)
                             and horizontalOverlap(x, f) > p.overlap_frac)))
  penalize(interRoomClashLoad(a), weight = 3)
params:
  - key: shared_wall_clash_threshold
    default: 0.25
    range: [0.05, 0.8]
    unit: fraction
    user_editable: true
    rationale: >
      Composite of shared-wall fraction and fixture load above which a horizontal clash is
      reported. APP DESIGN CHOICE. Set well above zero because nearly every flat has a
      kitchen next to a bathroom and an unconditional finding would be useless.
  - key: back_to_back_offset_m
    default: 0.900
    range: [0.300, 2.000]
    unit: m
    user_editable: true
    rationale: >
      Lateral offset (0.900 m is about 35 in) within which fixtures on opposite faces of a
      shared wall count as back-to-back. Plumbing is commonly grouped this way deliberately,
      for cost reasons, so this finding must stay gentle.
  - key: stack_overlap_threshold
    default: 0.35
    range: [0.10, 0.90]
    unit: fraction
    user_editable: true
    rationale: Footprint overlap fraction above which two stacked rooms count as stacked for this rule.
  - key: overlap_frac
    default: 0.30
    range: [0.0, 1.0]
    unit: fraction
    user_editable: false
    rationale: Point-fixture overlap fraction, shared with FS-ELEM-020.
  - key: report_whole_home_clashes
    default: false
    range: [true, false]
    unit: bool
    user_editable: true
    rationale: >
      Whether to surface these at all in the default report. Off by default because almost
      nothing can be done about them without a renovation, and unactionable findings erode
      trust. Turn on for users planning a build or remodel.
score:
  weight: 3
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: report_only
    target: [room, adjacentRoom]
    transform: {explain: renovation_scope_finding, audience: planning_remodel}
    cost: free
    effort: none
    reversible: true
    copy: This one is about how the rooms are arranged rather than how they are furnished, so it matters if you are planning building work and not much otherwise.
  - rank: 2
    action: move_object
    target: sleep.bed.*
    transform: {off_wall: sharedWallWith(bathroom), to_wall: nextBestSolidWall}
    cost: free
    effort: high_physical
    reversible: true
    copy: Where a bed's headboard is against a bathroom wall, moving it to another solid wall handles both the tradition's objection and the plumbing noise.
  - rank: 3
    action: add_material
    target: sharedWall
    transform: {add: acoustic_insulation_or_bookcase, min_thickness_m: 0.05}
    cost: medium
    effort: medium
    reversible: true
    copy: A bookcase or an insulated panel on the shared wall is the practical version of this fix. It muffles the pipes, which is the part you actually notice.
  - rank: 4
    action: add_object
    add: plants.plant.potted_medium
    transform: {element: wood, position: against(sharedWall)}
    cost: low
    effort: low
    reversible: true
    copy: On a kitchen-bathroom wall the traditional buffer is Wood, so a plant or a wooden shelf unit against that wall is the low-effort version.
conflicts_with: [PLUMB-STACK-002, ACOU-PRIV-004, SAFE-WTR-005]
supersedes: []
requires_rules: [FS-ELEM-001, FS-ELEM-018]
tags: [five_elements, room_adjacency, stacking, kitchen_bathroom, renovation_scope]
localization_notes: >
  Stacked-plumbing layouts are near-universal in apartment construction worldwide; the copy
  must not imply the building is badly designed.
```

#### Why — tradition
Once each room carries a functional element, the same controlling relations apply between rooms.
Practitioners routinely comment on a kitchen sharing a wall with a bathroom (Fire against Water),
on a bathroom directly above a kitchen, and on a bed whose headboard backs onto a bathroom wall —
the last of these being one of the most commonly repeated cautions in domestic feng shui, usually
framed in terms of the WC and pipework rather than the element system as such. Classical texts
address the placement of the hearth and the latrine within the house plan in similar terms. The
remedy vocabulary is the familiar one: Wood as the mediator between Fire and Water, or physical
mass on the shared wall.

#### Why — psychology / physiology
Mixed, and this rule is more defensible than most in the file because the traditional objection
tracks a real nuisance. A bed headboard against a bathroom wall means the sleeper's head is next
to a soil stack and a flushing cistern; intermittent nocturnal noise events are a recognised
cause of sleep fragmentation and arousals even at moderate levels, and a bookcase or insulated
panel on that wall is the standard mitigation. Back-to-back wet walls between a kitchen and a
bathroom can also carry odour and moisture transfer where sealing is imperfect. So the app can
say honestly: the tradition names the right walls, for the wrong reason, and the fix is the same.

#### Customer insight
Feng shui doesn't like a kitchen backing onto a bathroom, or a bed with the bathroom wall behind
the headboard. That second one is worth acting on whatever you believe — that wall carries the
pipework, and a bookcase against it or the bed on a different wall will get you quieter nights.
The rest is really a note for if you are ever doing building work.

#### Failure modes / when to skip
Off by default (`report_whole_home_clashes: false`) because these findings are usually
unactionable and stacked plumbing is a deliberate, sensible construction economy —
`PLUMB-STACK-*` will actively recommend it. Never suggest relocating plumbing. Require both
rooms to be fully modelled with fixtures placed; do not fire on room-type adjacency alone, or
every apartment gets the finding. Suppress in `studio_apartment` and `dorm_room`, where
everything is adjacent to everything. When the bed-against-bathroom-wall case fires, lead with
the acoustic framing, which is true and actionable, and mention the tradition second.
