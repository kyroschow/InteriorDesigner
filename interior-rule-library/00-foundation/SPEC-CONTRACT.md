# SPEC CONTRACT v1.0 — Authoring Rules for the Interior Arrangement Rule Library
# READ THIS FILE COMPLETELY BEFORE WRITING ANYTHING.
# Every rule authored by every agent MUST conform to this contract. An AI coding agent
# will consume these files directly to implement a room-layout scoring & generation engine.

## 0. Product context (read once)

The app: user captures/draws a room (or whole home), places furniture, and the engine
(a) scores the current layout, (b) explains every finding in plain language with the
*reason behind it* (tradition + psychology), (c) proposes concrete moves, and
(d) can auto-generate a compliant layout. Two audiences:
  - "Reorienters": existing home, want targeted fixes, minimal spend, often belief-motivated.
  - "New homeowners / first-time designers": empty rooms, need generation + education.

Therefore EVERY rule needs three faces:
  1. MACHINE face  — deterministic, testable predicate over a geometric scene graph.
  2. WHY face      — theoretical basis (feng shui / vastu / classical / etc.) AND the
                     independent psychological / physiological / evidentiary basis where one exists.
                     If there is NO empirical basis, say so explicitly. Never fake evidence.
  3. ACTION face   — remedies ranked by cost/effort, expressed as concrete transforms.

## 1. Units, axes, conventions

- Length: metres (float, 3dp). ALWAYS also give imperial in prose/copy fields (in/ft).
- Angles: degrees, 0–360, measured clockwise. `bearing` = compass bearing, 0 = true North.
- Room coordinate system: right-handed 2D, origin at room's min-x/min-y corner,
  +x East-ish in room-local space, +y "up" in plan. `z` = height above finished floor (AFF).
- Object pose: `{x, y, z, rot}` where rot = degrees clockwise, 0 = object's canonical
  "front/face" vector pointing +y. A sofa at rot=0 faces +y; its back is at -y.
- `footprint`: axis-aligned bbox in object-local space `{w, d, h}` (width across front,
  depth front-to-back, height). Optional `polygon` for L-shapes.
- Clearance sides named relative to object front: `front | back | left | right | above`.
- Compass: `N NE E SE S SW W NW` as 45° octants (±22.5°). Also support 24-direction
  Chinese mountain system (`24mtn`) for advanced feng shui: e.g. `S2`, `GUI`, `REN`.
- Hemisphere flag exists: `site.hemisphere = north|south` (affects sun/daylight rules ONLY,
  never feng shui compass rules — see FS system notes).

## 2. Canonical scene graph (the engine's input) — DO NOT INVENT NEW TOP-LEVEL TYPES

```jsonc
Site {
  id, address?, hemisphere, climate_zone,        // ASHRAE/Köppen string
  magnetic_declination_deg,                      // for compass correction
  facing_bearing_deg,                            // the home's "facing" (see FS-FACING rules)
  sitting_bearing_deg,                            // = facing + 180
  build_year?, storeys, has_basement, lot_polygon?,
  surroundings: [ {type: road|river|hill|tower|pole|cemetery|temple|park|other,
                   bearing_deg, distance_m, height_m?, relation: front|back|left|right} ]
}
Floor { id, level:int, height_m, rooms:[Room], stairs:[Stair] }
Room {
  id, type: <RoomType>, polygon:[{x,y}], ceiling_height_m, ceiling_type: flat|sloped|vaulted|coffered|dropped,
  area_m2, walls:[Wall], openings:[Opening], features:[Feature], objects:[Object],
  finishes: {floor, wall, ceiling}, bagua_map?, compass_rotation_deg, above_room_id?, below_room_id?
}
Wall { id, a:{x,y}, b:{x,y}, thickness_m, is_exterior:bool, bearing_deg, openings:[id], structural:bool }
Opening { id, kind: door|window|doorway|arch|pass_through|skylight|sliding|french|bifold|pocket|garage,
          wall_id, offset_m, width_m, height_m, sill_m, swing: in_left|in_right|out_left|out_right|slide|none,
          leads_to_room_id?|exterior, is_egress:bool, glazing?: {u_value, shgc, vt} }
Feature {  // immovable architecture
  id, kind: column|beam|soffit|bulkhead|niche|fireplace|chimney_breast|radiator|vent_supply|vent_return|
        electrical_outlet|switch|light_point|ceiling_fan|data_port|tv_point|thermostat|plumbing_stack|
        floor_drain|water_supply|gas_line|sprinkler_head|smoke_alarm|co_alarm|panel|water_heater|
        stair_opening|attic_hatch|sump|crawl_access|skylight_well|exposed_pipe|low_header,
  pose, footprint?, bearing_deg?, capacity?, notes
}
Object {  // anything movable/placeable — furniture, fixtures, decor, plants, appliances
  id, type: <ObjectType>, variant_id?, pose, footprint, mass_kg?, cg_height_m?,
  materials:[Material], colors:[{hex, coverage_pct}], anchored:bool, is_fixed:bool,
  soft: bool,            // upholstered/textile → acoustics & five-element mapping
  reflective: bool,      // mirror/glass/polished → feng shui + glare rules
  emits: [light|heat|sound|water|smoke|steam|scent]?,
  power_draw_w?, needs: [outlet|water_supply|drain|gas|vent|data]?,
  five_element?: wood|fire|earth|metal|water,   // may be derived, see FS-ELEM
  primary_user?: adult|child|toddler|infant|senior|pet|wheelchair_user
}
Person { id, age_band, mobility, height_cm?, birth_year?, gua_number?, zodiac?, sensory_profile? }
```

## 3. Canonical RoomType enum (use these exact ids; if you need a new one, declare it under `NEW_ROOM_TYPES` at the bottom of your file and justify it)

entry_foyer, mudroom, hallway_corridor, stair_core, living_room, family_room, great_room,
formal_dining, eat_in_kitchen, kitchen, pantry_walk_in, butlers_pantry, breakfast_nook,
bedroom_primary, bedroom_secondary, bedroom_guest, bedroom_child, bedroom_teen, nursery,
bedroom_shared_siblings, dorm_room, studio_apartment, bathroom_full, bathroom_three_quarter,
powder_room, ensuite, jack_and_jill_bath, wet_room, laundry_room, laundry_closet,
home_office, home_office_shared, study_library, homework_nook, media_room, home_theater,
game_room, home_gym, yoga_meditation_room, music_room, craft_hobby_room, workshop_garage,
garage_parking, basement_finished, basement_unfinished, attic_finished, attic_storage,
walk_in_closet, reach_in_closet, dressing_room, linen_closet, utility_mechanical,
sunroom_conservatory, balcony, patio_deck, porch_entry, roof_terrace, garden_yard,
prayer_altar_room, home_altar_nook, wine_cellar, safe_room, pet_room, storage_room,
open_plan_combined, loft, guest_suite, adu_in_law_suite, multigen_wing, elevator_lift_lobby

## 4. Canonical ObjectType namespace

Use dot-paths: `category.item[.subtype]`. Authoritative category list:
seating, tables, sleep, storage, worksurface, kitchen, bath, laundry, lighting, softgoods,
decor, plants, electronics, appliance, hvac, exercise, kids, pet, accessibility, outdoor,
safety, ritual, instrument, hobby.
Examples: `seating.sofa.three_seat`, `sleep.bed.queen`, `storage.wardrobe.freestanding`,
`kitchen.range.gas`, `decor.mirror.wall`, `plants.tree.potted_large`, `ritual.altar.table`.
The furniture-catalog files are the authority for the full item list; when you reference an
object in a rule, use a plausible dot-path and list it in your file's `OBJECTS_REFERENCED` block
so the index builder can reconcile.

## 5. THE RULE RECORD — mandatory shape

Author each rule as a markdown `###` heading followed by ONE fenced ```yaml block, then
the prose "why" sections. Exactly this order. YAML keys in this order:

```yaml
id: FS-CMD-001                 # <SYSTEM>-<GROUP>-<NNN>, uppercase, unique globally
title: Bed in the commanding position
system: feng_shui.form_school  # dotted system path, see §7
group: command_position
version: 1
status: active                 # active | experimental | deprecated
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, bedroom_guest, studio_apartment]
  objects: [sleep.bed.*]
  requires_features: []        # e.g. [beam] if rule only fires when feature present
  min_room_area_m2: 6.0        # omit if none
scope: object_placement        # object_placement | object_pair | room_composition | room_adjacency |
                               # whole_home | site | material_finish | lighting | schedule_behavior
severity: high                 # blocking | high | medium | low | advisory   (see §8)
confidence: tradition          # code_mandated | evidence_strong | evidence_moderate |
                               # expert_consensus | tradition | contested | folklore
evidence_class: mixed          # empirical | physiological | ergonomic | traditional | aesthetic | mixed
belief_gated: true             # true = only fires when user enabled this belief system
predicate: |                   # pseudo-DSL, see §6. MUST be deterministic & side-effect free.
  let door = room.primaryDoor
  let bed  = target
  assert not alignedWithin(bed.centerAxis, door.openingAxis, tol_deg=15)
  assert lineOfSight(bed.headboardSeatedEye, door.centroid) == true
  assert distance(bed.centroid, door.centroid) >= p.min_door_distance_m
params:
  - key: min_door_distance_m
    default: 1.5
    range: [0.8, 4.0]
    unit: m
    user_editable: true
    rationale: Distance at which a seated occupant can react before an entrant reaches the bed.
score:
  weight: 8                    # 1–10 contribution to its category subscore
  curve: step                  # step | linear | gaussian | clamped_linear
  partial_credit: true
remedies:                      # ordered best→fallback. Each is a machine-applicable transform.
  - rank: 1
    action: move_object
    target: sleep.bed.*
    transform: {to_zone: diagonal_from_door, keep: headboard_against_solid_wall}
    cost: free
    effort: high_physical
    reversible: true
    copy: Move the bed so its headboard sits against the solid wall diagonally across from the door.
  - rank: 2
    action: add_object
    add: decor.mirror.wall
    transform: {position: so_that lineOfSight(bed.headboardSeatedEye, door.centroid) via_reflection}
    cost: low
    effort: low
    reversible: true
    copy: If the bed cannot move, hang a mirror that reflects the doorway so the entry is visible from bed.
conflicts_with: [SAFE-EGR-003, ERG-CLR-012]
supersedes: []
requires_rules: [FS-CMD-000]
tags: [bed, sleep, security, sightline, signature_rule]
localization_notes: Directional logic is hemisphere-invariant; see FS-COMPASS-000.
```

Then, immediately after the YAML block, these prose sections (all mandatory, `####` headings):

#### Why — tradition
2–6 sentences. Name the school/text/lineage. Be precise about WHICH tradition says it and
whether classical and modern (BTB) schools agree. No hand-waving.

#### Why — psychology / physiology
2–6 sentences. The independent mechanism if one exists: prospect–refuge theory, startle
response & hypervigilance, orienting reflex, threat-monitoring load on sleep onset, etc.
Name the theory/researcher where real. If there is no empirical support, write:
`No direct empirical support; mechanism is plausible but untested.` — and still explain the
plausible mechanism. NEVER invent studies, authors, years, or effect sizes.

#### Customer insight
1–3 sentences written for the END USER (the app shows this). Second person, warm, concrete,
no jargon, no mysticism-as-fact. Frame tradition as tradition. This is the copy that sells the fix.

#### Failure modes / when to skip
When the rule should NOT fire or would produce a bad layout (tiny rooms, studio apartments,
rentals, accessibility overrides, conflicting safety rule wins).

## 6. Predicate DSL — the vocabulary you may use (the implementing agent builds these)

Use ONLY these primitives, or declare new ones in a `NEW_PREDICATES` block at the end of your
file with signature + plain-English semantics. Keep predicates declarative.

GEOMETRY
  distance(a,b) -> m ; distanceToWall(obj, wall) ; clearance(obj, side) -> m
  overlaps(a,b) ; contains(container, obj) ; footprintArea(obj) ; occupancyRatio(room)
  alignedWithin(axisA, axisB, tol_deg) ; angleBetween(a,b) -> deg
  isOnWall(obj, wall) ; backsToWall(obj, min_contact_pct) ; isFloating(obj)
  isUnder(obj, feature) ; isAbove(obj, feature) ; headroom(obj) -> m
  centroid(x) ; bbox(x) ; nearestFeature(obj, kind) ; countOf(type, scope)
  symmetryScore(room, axis) -> 0..1 ; visualWeightBalance(room, axis) -> -1..1
  spansAxis(obj, room) ; distanceFromCorner(obj) ; wallLengthAvailable(wall)
SIGHT & PATH
  lineOfSight(fromPoint, toPoint) -> bool ; isovistArea(point) -> m2
  sightlineBlockedBy(from, to) -> obj|null ; viewToOutside(seatPoint) -> bool
  viewingDistance(seat, display) -> m ; viewingAngle(seat, display) -> deg
  pathExists(from, to, min_width_m) ; pathWidth(from, to) -> m ; pathLength(from,to) -> m
  doorSwingClear(opening) ; turningCircle(point, diameter_m) ; crossesPath(obj, path)
  straightRunLength(from, to) -> m   // for "chi rushing"/sha qi & for sprint hazards
COMPASS & TRADITION
  compassOctant(bearing) -> N..NW ; mountain24(bearing) -> id
  baguaSector(point, room|home, method) -> sector   // method: compass|bbb_form
  inSector(obj, sector) ; sectorOf(obj) ; elementOf(obj|color|material) -> element
  elementRelation(a,b) -> generates|controls|weakens|neutral
  kuaNumber(birth_year, sex) -> 1..9 ; isAuspiciousDirection(kua, bearing) -> bool
  flyingStar(year, sector) -> star ; annualAffliction(year) -> sector[]
  vastuZone(point, home) -> zone ; brahmasthanDistance(point) -> m
ENVIRONMENT
  daylightAccess(obj) -> 0..1 ; glareRisk(seat, window) -> 0..1 ; solarExposure(wall) -> kWh
  illuminanceAt(point) -> lux ; ccdAt(point) -> K ; layerCount(room) -> int
  reverbTime(room) -> s ; absorptionArea(room) -> m2sabin ; noiseIngress(room) -> dB
  sharedWall(roomA, roomB) ; verticallyStacked(roomA, roomB) ; adjacency(roomA, roomB)
  airflowPath(openingA, openingB) ; distanceToHeatSource(obj) -> m ; humidityClass(room)
HUMAN
  reachEnvelope(person, pose) ; seatHeightFit(person, seat) -> 0..1
  anthroPercentile(dim, p) -> m ; isReachableSeated(obj) ; isReachableFrom(obj, wheelchair)
  toddlerReachHeight() -> m ; tipoverMoment(obj) -> Nm ; graspHeight(obj) -> m
Operators: assert, prefer (soft), penalize(expr, weight), require, forbid, count, any, all,
  exists, forEach, let, p.<param>, target, room, site, user, others(type).

## 7. System namespace (the `system:` field)

feng_shui.form_school            feng_shui.compass.bagua
feng_shui.compass.eight_mansions feng_shui.compass.flying_stars
feng_shui.five_elements          feng_shui.yin_yang
feng_shui.btb_western            feng_shui.four_pillars_personal
vastu.mandala                    vastu.directional                vastu.remedial
classical.proportion             classical.axiality               pattern_language.alexander
modernism.functionalism          japanese.wabi_sabi                japanese.ma_spatial
scandinavian.hygge_lagom         islamic.privacy_zoning            mediterranean.climate
psych.prospect_refuge            psych.attention_restoration       psych.stress_recovery
psych.proxemics                  psych.territoriality              psych.cognitive_load
psych.color                      psych.place_attachment            psych.crowding
biophilia.14_patterns            chronobiology.circadian           sleep_science.environment
ergonomics.anthropometrics       ergonomics.task_zones             ergonomics.posture
circulation.space_syntax         circulation.desire_lines          zoning.public_private
lighting.layers                  lighting.photometric              lighting.daylight
acoustics.room                   acoustics.privacy                 color.harmony
materials.tactility              composition.balance               composition.focal_point
composition.scale_proportion     composition.rhythm_repetition     style.<style_id>
safety.egress                    safety.fire                       safety.electrical
safety.water                     safety.child                      safety.senior_falls
safety.tipover                   safety.air_quality                safety.structural
safety.seismic                   safety.security_cpted             safety.pet
safety.chemical                  accessibility.ada                 accessibility.universal_design
wellbeing.well_standard          neurodiversity.sensory            behavior.habit_design
product.parameter                product.ux

## 8. Severity semantics — CRITICAL, the engine branches on this

- `blocking`  — Layout is unsafe or code-illegal. Engine MUST refuse to generate it and MUST
                flag existing layouts. Overrides every aesthetic/traditional rule. Only
                `safety.*`, `accessibility.ada`, and `ergonomics` hard-minimums may be blocking.
- `high`      — Strongly degrades function or violates a signature principle of an enabled system.
- `medium`    — Noticeable improvement available.
- `low`       — Refinement.
- `advisory`  — Informational/educational only, never affects the numeric score.

HARD PRECEDENCE LADDER (the engine resolves conflicts in this order):
  1. safety.* blocking  →  2. accessibility.ada (if user flagged need)  →
  3. ergonomics hard minimums  →  4. code/egress non-blocking  →
  5. function & circulation  →  6. user's explicitly enabled belief system(s)  →
  7. evidence-backed psychology  →  8. composition/aesthetics  →  9. style pack preferences.
A lower tier may NEVER silently override a higher tier. When a belief rule loses to a safety
rule, the engine must SAY SO to the user (this is a product requirement — see 60-product).

## 9. Honesty requirements (non-negotiable)

- Never present tradition as empirically proven. Use `confidence:` truthfully.
- Never fabricate citations, study names, authors, years, journals, or statistics.
  If you are not certain a source exists, write the claim without a citation and set
  `confidence: expert_consensus` or `tradition`.
- Where feng shui and evidence AGREE, say so and explain the convergent mechanism — this is
  the app's strongest content. Where feng shui is unsupported or contradicted, mark
  `confidence: tradition` or `contested` and still author the rule (users opt in) but note it.
- Codes vary by jurisdiction. Any dimension drawn from building code must name the code family
  (IRC / IBC / ADA / NFPA / Eurocode / AS-NZS / NBC-India) and be marked
  `jurisdiction_varies: true` in params. Never state a code number you are unsure of.

## 10. File conventions

- One markdown file per assigned topic, at the exact path you are told.
- File header must be:
  ```
  # <Title>
  <!-- library-file: v1 | system(s): <list> | rule-id-prefixes: <list> | author-agent: <label> -->
  ## Scope
  ## Rule count: <n>
  ```
- Then `## Rules` with all rule records.
- Then these closing blocks (empty is fine, but the headings must exist):
  `## OBJECTS_REFERENCED`, `## NEW_PREDICATES`, `## NEW_ROOM_TYPES`,
  `## MODIFIABLE_PARAMETERS` (every param you exposed, one line each: key | default | range | who edits it | what it changes),
  `## OPEN_QUESTIONS`, `## CROSS_REFERENCES` (rule ids in other files this interacts with).
- Target density: 25–60 fully-formed rules per file unless told otherwise. Quality of the
  predicate and the two "why" sections matters more than raw count — but be generous and
  exhaustive; this library is meant to be the most complete of its kind.
- Do not duplicate a rule that belongs to another agent's assigned scope; instead add it to
  `## CROSS_REFERENCES`.
