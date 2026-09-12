# Style Packs — Interior Styles as Machine-Applicable Modifier Packs

<!-- library-file: v1 | system(s): style.* , composition.balance, composition.scale_proportion, color.harmony, materials.tactility, lighting.layers, product.parameter | rule-id-prefixes: STY | author-agent: style-packs-agent -->

## Scope

This file defines **40 style packs** plus **5 style-coherence rules**. A style pack is not mood-board
prose. It is a **parameter modifier pack**: a named bundle of (a) target values for composition,
colour, material, pattern, lighting and layering measures, and (b) explicit *overrides* it requests
against other rule families in this library.

### Where style packs sit in the precedence ladder

Per SPEC-CONTRACT §8, `style pack preferences` is **tier 9 — the lowest tier**. Therefore:

- A pack may **set** the parameters of tier-8 rules (composition/aesthetics) and of its own tier-9 rules.
- A pack may **request** but never force a change to tiers 1–7.
- A pack may **never** relax `safety.*`, `accessibility.ada`, `ergonomics` hard minimums, egress/code
  rules, or minimum circulation widths. Every pack states this in `never_relaxes`, verbatim, with no
  exceptions. The engine must treat a pack that appears to relax those as a **data error**, not as a
  user preference.
- When a pack loses to a higher tier, the engine must say so in plain language (product requirement,
  see `60-product`).

### Gating

Style packs are **style-gated, not belief-gated**. Every pack predicate opens with
`require stylePackActive("<id>")`. `belief_gated` is therefore `false` on all packs: selecting a
visual style is not the same act as opting into a divination or metaphysical system. Two packs whose
source tradition *is* spiritual (`wabi_sabi`, `zen_meditative`) still ship as aesthetic packs and say
so in their prose.

### Declared conventions used throughout this file

**Room macro.** To avoid repeating sixty room ids forty times, `applies_to.rooms` uses macros whose
expansion is fixed here:

```yaml
ROOMS_ALL_INTERIOR: [entry_foyer, mudroom, hallway_corridor, stair_core, living_room, family_room,
  great_room, formal_dining, eat_in_kitchen, kitchen, pantry_walk_in, butlers_pantry, breakfast_nook,
  bedroom_primary, bedroom_secondary, bedroom_guest, bedroom_child, bedroom_teen, nursery,
  bedroom_shared_siblings, dorm_room, studio_apartment, bathroom_full, bathroom_three_quarter,
  powder_room, ensuite, jack_and_jill_bath, wet_room, laundry_room, home_office, home_office_shared,
  study_library, homework_nook, media_room, home_theater, game_room, home_gym, yoga_meditation_room,
  music_room, craft_hobby_room, basement_finished, attic_finished, walk_in_closet, dressing_room,
  sunroom_conservatory, loft, guest_suite, adu_in_law_suite, multigen_wing, open_plan_combined,
  prayer_altar_room, home_altar_nook, wine_cellar, pet_room]
ROOMS_SOCIAL: [living_room, family_room, great_room, formal_dining, eat_in_kitchen, breakfast_nook,
  studio_apartment, open_plan_combined, loft, sunroom_conservatory, media_room, game_room]
ROOMS_SLEEP: [bedroom_primary, bedroom_secondary, bedroom_guest, bedroom_child, bedroom_teen,
  nursery, bedroom_shared_siblings, dorm_room, ensuite, guest_suite]
ROOMS_WET: [kitchen, eat_in_kitchen, bathroom_full, bathroom_three_quarter, powder_room, ensuite,
  jack_and_jill_bath, wet_room, laundry_room, laundry_closet, mudroom]
ROOMS_WORK_FOCUS: [home_office, home_office_shared, study_library, homework_nook, game_room,
  media_room, craft_hobby_room, music_room]
```

**Extension blocks.** The mandated YAML key order in §5 is preserved exactly. The style-pack payload
is appended *after* `localization_notes` as four additive blocks, in this order every time:
`style_pack`, `param_overrides`, `may_relax`, `never_relaxes`. Nothing in the canonical key set is
reordered, renamed, or omitted.

**Override channels.** `param_overrides` does not name other agents' param keys directly (they are
authored in parallel and not yet reconciled). It names a fixed set of **override channels** which the
index builder binds to the owning rule's param. The channel vocabulary:

```
comp.occupancy_ratio_target      comp.occupancy_ratio_max        comp.surface_fill_max
comp.negative_space_min_pct      comp.symmetry_target            comp.symmetry_strictness
comp.pattern_mix_max             comp.pattern_scale_spread_min   comp.pattern_density_max
comp.color_family_max            comp.wood_tone_max              comp.metal_finish_max
comp.focal_point_max             comp.visual_weight_tolerance    comp.decor_items_per_m2_max
comp.art_wall_coverage_target    comp.rug_coverage_min           comp.era_spread_max_years
mat.sheen_max_gu                 mat.forbidden_add               mat.texture_variety_min
light.cct_min_K                  light.cct_max_K                 light.layer_count_min
light.exposed_lamp_allowed       light.cri_min                   light.max_fixture_lumens_visible
soft.textile_layer_min           soft.textile_weight_class       plants.count_min
plants.canopy_ratio_min          plants.species_max
```

**Remedy action vocabulary** used in `remedies[].action` (all are room-local, reversible transforms
unless marked): `set_param`, `repaint_surface`, `swap_finish`, `swap_material`, `swap_object`,
`add_object`, `remove_object`, `move_object`, `regroup_decor`, `restyle_shelf`, `add_textile`,
`relight`, `retire_to_storage`, `stage_convergence`, `show_disclosure`.

**Honesty note on the whole file.** Style attribution is design-history, not science. `confidence` is
`expert_consensus` for styles with a documented historical lineage, `tradition` for packs rooted in a
living cultural practice, and `contested` for trend-coined labels (Japandi, modern organic,
transitional, cottagecore, dark academia, Y2K retro-futurist) where the trade itself does not agree on
boundaries. `evidence_class` is `aesthetic` unless a pack carries a real physiological mechanism
(biophilic, hygge, zen, minimalist, tech/gamer), in which case it is `mixed` and the mechanism is
named. Numeric palette/LRV/CCT/gloss bands are **design conventions calibrated to real measurement
scales**, not findings: LRV is a 0–100 reflectance scale derived from CIELAB L\* (practical interior
paints run roughly LRV 3 to 92); gloss units (GU) are specular-gloss readings of the kind
standardised by the ASTM D523 test-method family, and manufacturer band names vary; CCT is in kelvin.
None of these bands is claimed to be empirically optimal.

## Rule count: 45

## Rules

### STY-PACK-001 — Japandi style pack

```yaml
id: STY-PACK-001
title: Japandi style pack
system: style.japandi
group: pack
version: 1
status: active
applies_to:
  rooms: [ROOMS_ALL_INTERIOR]
  objects: [seating.*, tables.*, sleep.*, storage.*, softgoods.*, decor.*, lighting.*, plants.*]
  requires_features: []
scope: room_composition
severity: low
confidence: contested
evidence_class: aesthetic
belief_gated: false
predicate: |
  require stylePackActive("japandi")
  assert colorCount(room, delta_e_merge=12) <= p.japandi_color_family_max
  assert occupancyRatio(room) <= p.japandi_occupancy_max
  assert visibleFloorRatio(room) >= p.japandi_visible_floor_min
  assert patternCount(room) <= p.japandi_pattern_mix_max
  assert woodToneCount(room) <= p.japandi_wood_tone_max
  assert max(sheenOf(s) forEach s in room.surfaces.walls) <= p.japandi_wall_sheen_max_gu
  assert cctRangeOfFixtures(room).max_K <= p.japandi_cct_max_K
  assert layerCount(room) >= p.japandi_light_layers_min
  prefer symmetryScore(room, axis=primary) between [0.35, 0.70]
  penalize forbiddenMaterialPresent(room, pack.materials_forbidden), weight=2
  penalize decorDensity(room) > p.japandi_decor_per_m2_max, weight=2
params:
  - key: japandi_color_family_max
    default: 4
    range: [3, 6]
    unit: count
    user_editable: true
    rationale: Japandi reads as one quiet field; more than four distinct colour families breaks the read.
  - key: japandi_occupancy_max
    default: 0.38
    range: [0.25, 0.50]
    unit: ratio
    user_editable: true
    rationale: Floor-area fraction under furniture footprints; the pack's restraint lives in this number.
  - key: japandi_visible_floor_min
    default: 0.55
    range: [0.40, 0.75]
    unit: ratio
    user_editable: true
    rationale: Legs-up furniture plus uncluttered floor is the pack's signature silhouette move.
  - key: japandi_pattern_mix_max
    default: 2
    range: [1, 4]
    unit: count
    user_editable: true
    rationale: Texture, not pattern, carries interest here.
  - key: japandi_wood_tone_max
    default: 2
    range: [1, 4]
    unit: count
    user_editable: true
    rationale: One pale wood plus one dark accent wood is the canonical pairing.
  - key: japandi_wall_sheen_max_gu
    default: 6
    range: [2, 20]
    unit: GU_60deg
    user_editable: true
    rationale: Matte walls; gloss reads Scandinavian-mid-century, not Japandi.
  - key: japandi_cct_max_K
    default: 3000
    range: [2400, 3500]
    unit: K
    user_editable: true
    rationale: Warm light keeps pale neutrals from going clinical.
  - key: japandi_light_layers_min
    default: 3
    range: [2, 5]
    unit: count
    user_editable: true
    rationale: Ambient, task and low-level floor/paper lantern layer.
  - key: japandi_decor_per_m2_max
    default: 0.35
    range: [0.15, 0.80]
    unit: items_per_m2
    user_editable: true
    rationale: Decor budget; the pack fails by accumulation more than by any single wrong object.
score:
  weight: 3
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: retire_to_storage
    target: decor.*
    transform: {select: lowest_styleAffiliationOf_match, until: decorDensity(room) <= p.japandi_decor_per_m2_max}
    cost: free
    effort: low
    reversible: true
    copy: Box up the decor pieces that fit least, until each surface has one or two things on it and room to breathe.
  - rank: 2
    action: swap_finish
    target: room.surfaces.walls
    transform: {to_sheen_gu: 5, keep_hue: true}
    cost: low
    effort: medium
    reversible: false
    copy: Repaint the walls in the same colour but a flat, chalky finish — the light will sit softer on them.
  - rank: 3
    action: relight
    transform: {set_cct_K: 2700, add_layer: lighting.floor.paper_lantern, add_dimming: true}
    cost: low
    effort: low
    reversible: true
    copy: Swap to warm 2700K bulbs and add one low paper-shade lamp, so evenings get a second, softer light level.
  - rank: 4
    action: swap_object
    target: seating.sofa.*
    transform: {to_variant: raised_on_tapered_legs, silhouette: rectilinear_low}
    cost: high
    effort: high_physical
    reversible: true
    copy: If you replace the sofa, choose a low one that stands on slim visible legs — seeing floor under furniture is most of this look.
conflicts_with: [COMP-FILL-004, STY-PACK-019, STY-PACK-033]
supersedes: []
requires_rules: [STY-COH-041]
tags: [style_pack, japandi, minimal, warm_neutral, wood, signature_rule]
localization_notes: Uses "Japandi" as a market label only; Japanese-language design discourse does not use it.
style_pack:
  id: japandi
  aliases: [japanordic, japanese_scandinavian]
  lineage: "Trade and retail hybrid label that emerged in the 2010s, pairing Japanese restraint (wabi-sabi, ma) with Scandinavian functionalism. No documented originator; boundaries are set by retailers, not by a school."
  palette_60: {role: walls_ceiling_large_planes, hues: [warm_neutral, achromatic], lrv: [55, 78], examples_hex: ["#EDE7DE", "#DED5C8", "#CFC6B8"]}
  palette_30: {role: floor_and_large_furniture, hues: [brown, warm_neutral], lrv: [22, 52], examples_hex: ["#A98F6F", "#8A6F52", "#6B5642"]}
  palette_10: {role: accent_textile_ceramic_metal, hues: [black, green, brown], lrv: [5, 28], examples_hex: ["#1E1C1A", "#4F5B4A", "#3A2F26"]}
  color_family_max: 4
  materials_required: [solid_wood_pale, solid_wood_dark, linen, paper, ceramic_unglazed, rattan_cane]
  materials_signature: [oak, ash, shou_sugi_ban_cedar, washi_paper, raw_linen, matte_stoneware, blackened_steel]
  materials_forbidden: [high_gloss_lacquer, chrome_polished, mirrored_furniture, velvet_crushed, faux_marble_print, vinyl_wood_print_high_gloss]
  sheen: {walls_gu: [2, 6], joinery_gu: [5, 20], metal: matte_or_blackened, ceramic: unglazed_to_satin}
  pattern: {max_distinct: 2, scale_mix: [none, small], density_max: 0.20, motifs_allowed: [weave_texture, grain, subtle_stripe, kasuri_ikat_faint], motifs_forbidden: [large_floral, damask, animal_print, geometric_high_contrast]}
  furniture: {silhouette: [rectilinear_low, slim], leg_base: [tapered_round, tapered_square, thin_plinth_recessed], seat_height_mm: [380, 430], visible_floor_ratio_min: 0.55, arms: low_or_none, skirted_upholstery: false}
  occupancy: {ratio_target: 0.32, ratio_range: [0.25, 0.42], surface_fill_max: 0.30}
  symmetry: {preference: near_symmetry_with_deliberate_offset, target: 0.55, strictness: loose}
  layering: {textile_layers: [2, 3], textile_weight: [light, medium], rug_coverage_min: 0.30, rug_type: [flatweave_wool, jute, tatami_mat]}
  plants: {count: [1, 3], species_max: 2, forms: [sculptural_branch, single_specimen_tree, bonsai_or_moss], pots: [unglazed_terracotta, matte_stoneware, woven_basket]}
  art_decor: {art_wall_coverage_pct: [3, 8], decor_items_per_m2: [0.10, 0.35], grouping: odd_numbers_asymmetric, negative_space_min_pct: 60}
  lighting: {cct_K: [2500, 3000], layers_min: 3, fixture_types: [paper_lantern, linen_drum_pendant, slim_arc_floor, concealed_cove], exposed_lamp: false, cri_min: 90, dimming: required}
  ceiling_trim: {ceiling: [flat_painted_matte, exposed_pale_beam, timber_slat_partial], trim: [flush_shadow_gap, simple_square_edge], trim_contrast: low}
  floor: {materials: [wide_plank_oak_matte, tatami, honed_limestone, micro_cement], tone: [pale_to_mid_warm], gloss_max_gu: 15}
param_overrides:
  - {channel: comp.occupancy_ratio_max, value: 0.42}
  - {channel: comp.surface_fill_max, value: 0.30}
  - {channel: comp.negative_space_min_pct, value: 60}
  - {channel: comp.pattern_mix_max, value: 2}
  - {channel: comp.color_family_max, value: 4}
  - {channel: comp.wood_tone_max, value: 2}
  - {channel: comp.symmetry_target, value: 0.55}
  - {channel: comp.symmetry_strictness, value: loose}
  - {channel: mat.sheen_max_gu, value: 6}
  - {channel: light.cct_max_K, value: 3000}
  - {channel: light.cri_min, value: 90}
  - {channel: light.exposed_lamp_allowed, value: false}
  - {channel: plants.count_min, value: 1}
may_relax: [COMP-SYM-* strict-symmetry targets, COMP-ART-* gallery-wall density minimums, COLOR-ACC-* accent-saturation minimums]
never_relaxes: [safety.* at any severity, accessibility.ada when the user has flagged a need, ergonomics hard minimums, egress and code rules, minimum circulation path widths]
```

#### Why — tradition
Japandi is a market label, not a school. It borrows two real lineages: the Japanese aesthetic
vocabulary of *ma* (the charged interval of empty space) and wabi-sabi restraint, and Scandinavian
functionalism's pale woods, light-hungry surfaces and honest joinery. Neither parent tradition
recognises the hybrid — Japanese design writing does not use the word — so the pack is best treated as
a contemporary retail consensus about a look, with the underlying doctrine inherited from its parents.

#### Why — psychology / physiology
Two mechanisms are real and independent of the label. Low-clutter, low-colour-count scenes are easier
to process, and processing-fluency accounts of aesthetic pleasure (Reber, Schwarz and Winkielman's
work on fluency and liking) predict that easier-to-parse scenes are liked more, all else equal. Matte
wall finishes measurably reduce specular glare, which matters most in rooms with a single large
window. The specific numbers here (LRV bands, 0.38 occupancy) are design conventions, not findings.

#### Customer insight
Japandi is a recent mash-up of two older ideas: Japanese calm and Scandinavian practicality. In your
room it mostly means fewer things, warmer light, pale walls with a flat finish, and furniture that
stands on visible legs so you can see the floor underneath. Start by clearing surfaces — that is free
and does about half the work.

#### Failure modes / when to skip
Do not fire in rooms under about 7 m² (75 ft²), where a 0.38 occupancy ceiling makes the room
unusable; raise `japandi_occupancy_max` instead. Skip the visible-floor target in rooms with a
declared storage deficit, and in households with young children where floor-level storage baskets are
a function, not clutter. If the user needs high task illuminance (low vision, detailed hobby work),
`light.cct_max_K` yields to the lighting-ergonomics rules.

---

### STY-PACK-002 — Wabi-sabi style pack

```yaml
id: STY-PACK-002
title: Wabi-sabi style pack
system: style.wabi_sabi
group: pack
version: 1
status: active
applies_to:
  rooms: [ROOMS_ALL_INTERIOR]
  objects: [seating.*, tables.*, sleep.*, storage.*, softgoods.*, decor.*, lighting.*, plants.*, ritual.*]
  requires_features: []
scope: room_composition
severity: low
confidence: tradition
evidence_class: mixed
belief_gated: false
predicate: |
  require stylePackActive("wabi_sabi")
  assert symmetryScore(room, axis=primary) <= p.wabisabi_symmetry_max
  assert colorCount(room, delta_e_merge=12) <= p.wabisabi_color_family_max
  assert max(sheenOf(s) forEach s in room.surfaces) <= p.wabisabi_sheen_max_gu
  assert countOf(decor.handmade_or_patinated, room) >= p.wabisabi_handmade_min
  assert occupancyRatio(room) <= p.wabisabi_occupancy_max
  assert countOf(decor.matched_pair, room) <= p.wabisabi_matched_pair_max
  prefer materialVarietyScore(room) >= p.wabisabi_texture_variety_min
  penalize forbiddenMaterialPresent(room, pack.materials_forbidden), weight=3
  penalize countOf(decor.mass_produced_identical, room) > 2, weight=2
params:
  - key: wabisabi_symmetry_max
    default: 0.45
    range: [0.20, 0.65]
    unit: score_0_1
    user_editable: true
    rationale: This pack deliberately INVERTS the usual symmetry preference; fukinsei (asymmetry) is doctrine here.
  - key: wabisabi_color_family_max
    default: 3
    range: [2, 5]
    unit: count
    user_editable: true
    rationale: Earth, ash and one muted vegetal note is the whole palette.
  - key: wabisabi_sheen_max_gu
    default: 8
    range: [2, 20]
    unit: GU_60deg
    user_editable: true
    rationale: Gloss reads as new and perfect, which is the opposite of the intent.
  - key: wabisabi_handmade_min
    default: 3
    range: [1, 10]
    unit: count
    user_editable: true
    rationale: The pack is carried by objects that show a maker's hand or age, not by layout alone.
  - key: wabisabi_occupancy_max
    default: 0.40
    range: [0.25, 0.55]
    unit: ratio
    user_editable: true
    rationale: Sparse but not austere; emptier than traditional, fuller than hard minimalism.
  - key: wabisabi_matched_pair_max
    default: 1
    range: [0, 3]
    unit: count
    user_editable: true
    rationale: Matched pairs signal catalogue completeness; the aesthetic prizes the odd and the incomplete.
  - key: wabisabi_texture_variety_min
    default: 5
    range: [3, 9]
    unit: count
    user_editable: true
    rationale: With colour and pattern suppressed, tactile variety is the only remaining interest channel.
score:
  weight: 3
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: decor.matched_pair
    transform: {split_pair: true, offset_from_axis_m: 0.25}
    cost: free
    effort: low
    reversible: true
    copy: Break up the matching pairs — move one lamp, vase or chair off-centre. Perfect symmetry is what this look avoids.
  - rank: 2
    action: add_object
    add: decor.vessel.handbuilt_ceramic
    transform: {position: on_largest_open_horizontal, count: 1, prefer: visible_repair_or_patina}
    cost: low
    effort: low
    reversible: true
    copy: Add one handmade piece with a visible mark of age or repair. A single honest object does more here than three new ones.
  - rank: 3
    action: swap_finish
    target: room.surfaces.walls
    transform: {to: limewash_or_clay_plaster, mottle: true, to_sheen_gu: 4}
    cost: medium
    effort: medium
    reversible: false
    copy: A limewash or clay-plaster wall gives the soft, uneven surface this style is built on.
  - rank: 4
    action: remove_object
    target: decor.mass_produced_identical
    transform: {keep_max: 2}
    cost: free
    effort: low
    reversible: true
    copy: Thin out the identical, obviously new pieces; keep the ones that have a story.
conflicts_with: [COMP-SYM-001, COMP-SYM-002, STY-PACK-010, STY-PACK-021, STY-PACK-038]
supersedes: []
requires_rules: [STY-COH-041, STY-COH-045]
tags: [style_pack, wabi_sabi, asymmetry, patina, handmade, inverts_symmetry, signature_rule]
localization_notes: Japanese aesthetic terms retained untranslated with glosses; do not render fukinsei as "imbalance" in UI copy.
style_pack:
  id: wabi_sabi
  aliases: [wabisabi, imperfect_minimal]
  lineage: "Japanese aesthetic rooted in the wabi-cha tea tradition (Murata Jukō, Sen no Rikyū) and Zen art criticism; introduced to non-Japanese design audiences chiefly by Leonard Koren's 1994 book 'Wabi-Sabi: for Artists, Designers, Poets & Philosophers' (Stone Bridge Press), which characterised it as the beauty of things imperfect, impermanent and incomplete. The asymmetry principle is fukinsei, one of the aesthetic terms conventionally drawn from Zen art writing."
  palette_60: {role: walls_and_large_planes, hues: [warm_neutral, brown, achromatic], lrv: [40, 70], examples_hex: ["#D9D0C2", "#C4B8A6", "#AFA391"]}
  palette_30: {role: floor_wood_stone, hues: [brown, grey_warm], lrv: [15, 42], examples_hex: ["#7B6A56", "#5E5348", "#8E8274"]}
  palette_10: {role: accent, hues: [green_muted, rust_muted, indigo_faded, black], lrv: [5, 25], examples_hex: ["#5A5B48", "#7A4A38", "#2E3640"]}
  color_family_max: 3
  materials_required: [clay_plaster_or_limewash, unfinished_wood, handbuilt_ceramic, raw_linen_or_hemp, stone_rough]
  materials_signature: [kintsugi_repaired_ceramic, weathered_elm, paper, iron_with_patina, undyed_wool, river_stone, dried_branch]
  materials_forbidden: [high_gloss_lacquer, chrome_polished, mirrored_furniture, acrylic_clear, printed_faux_texture, matched_veneer_sets, led_rgb]
  sheen: {walls_gu: [2, 6], wood_gu: [0, 10], metal: patinated_only, ceramic: unglazed_or_crawled_glaze}
  pattern: {max_distinct: 1, scale_mix: [none], density_max: 0.10, motifs_allowed: [natural_grain, slub_weave, crackle, water_stain], motifs_forbidden: [any_repeating_print, geometric, floral_printed, stripe_regular]}
  furniture: {silhouette: [low, irregular, chunky_handhewn], leg_base: [block, thick_plinth, hand_cut_taper, none_floor_sitting], seat_height_mm: [300, 420], visible_floor_ratio_min: 0.50, arms: none_or_irregular, skirted_upholstery: false}
  occupancy: {ratio_target: 0.32, ratio_range: [0.22, 0.45], surface_fill_max: 0.25}
  symmetry: {preference: INVERTED_asymmetry_required, target: 0.30, strictness: enforced_as_ceiling}
  layering: {textile_layers: [2, 3], textile_weight: [light, medium], rug_coverage_min: 0.20, rug_type: [undyed_wool, hemp, tatami, none_bare_floor]}
  plants: {count: [1, 3], species_max: 2, forms: [single_branch_in_vessel, moss, weathered_bonsai, seasonal_cutting], pots: [unglazed, repaired, found_vessel]}
  art_decor: {art_wall_coverage_pct: [1, 5], decor_items_per_m2: [0.08, 0.30], grouping: single_object_with_void, negative_space_min_pct: 65, alcove_display: preferred}
  lighting: {cct_K: [2200, 2700], layers_min: 2, fixture_types: [paper_shade, candle_or_flame_effect, single_low_floor_lamp, washed_wall_uplight], exposed_lamp: false, cri_min: 90, dimming: required}
  ceiling_trim: {ceiling: [flat_matte, exposed_dark_beam, plaster_uneven], trim: [none, minimal_unpainted_timber], trim_contrast: none}
  floor: {materials: [aged_wood_wide_plank, tatami, tamped_earth_effect, rough_stone], tone: [mid_to_dark_warm], gloss_max_gu: 8}
param_overrides:
  - {channel: comp.symmetry_target, value: 0.30}
  - {channel: comp.symmetry_strictness, value: ceiling_not_floor}
  - {channel: comp.color_family_max, value: 3}
  - {channel: comp.pattern_mix_max, value: 1}
  - {channel: comp.occupancy_ratio_max, value: 0.45}
  - {channel: comp.negative_space_min_pct, value: 65}
  - {channel: comp.era_spread_max_years, value: 400}
  - {channel: mat.sheen_max_gu, value: 8}
  - {channel: mat.texture_variety_min, value: 5}
  - {channel: light.cct_max_K, value: 2700}
  - {channel: light.exposed_lamp_allowed, value: false}
may_relax: [COMP-SYM-* symmetry FLOOR targets (inverted to a ceiling by this pack), COMP-PAIR-* matched-pair preferences, COMP-CONDITION-* "replace worn items" recommendations, COLOR-SAT-* minimum-saturation guidance]
never_relaxes: [safety.* at any severity, accessibility.ada when the user has flagged a need, ergonomics hard minimums, egress and code rules, minimum circulation path widths]
```

#### Why — tradition
Wabi-sabi comes out of the Japanese tea tradition — the *wabi-cha* lineage associated with Murata Jukō
and Sen no Rikyū — and the Zen art criticism that prizes *fukinsei* (asymmetry), *kanso* (simplicity)
and *shizen* (naturalness, without pretence). Leonard Koren's 1994 book, published by Stone Bridge
Press, is what put the term in front of Western designers, and it defined the aesthetic as the beauty
of things imperfect, impermanent and incomplete. This is the one pack in the library that *inverts* a
default composition rule: where most systems reward symmetry, this one caps it.

#### Why — psychology / physiology
No direct empirical support for the specific claim that asymmetric, patinated interiors improve
wellbeing; the mechanism is plausible but untested. What is defensible: very low colour and pattern
counts reduce visual load, and tactile variety substitutes for visual variety as the interest channel,
which is consistent with Berlyne-style accounts where preference peaks at moderate rather than maximal
stimulation. Treat "an object with a visible repair feels more valuable" as an aesthetic claim, not a
finding.

#### Customer insight
Wabi-sabi is a Japanese idea about finding beauty in things that are worn, handmade or a little
uneven. Practically, it means fewer objects, nothing shiny, and breaking up anything that matches too
perfectly — move one of that pair of lamps off-centre. The chipped bowl you kept is the right
instinct.

#### Failure modes / when to skip
Skip the symmetry ceiling in rooms where a symmetrical arrangement is functionally required — a bed
between two nightstands both occupants need, a TV wall with paired speakers, a wheelchair transfer
zone that must exist on both sides. Do not use the patina preference to justify keeping genuinely
unsafe items (wobbly tables, frayed cords, lead-paint-era finishes): `safety.*` wins and the engine
must say so. In rentals, skip the limewash remedy.

---

### STY-PACK-003 — Minimalist style pack

```yaml
id: STY-PACK-003
title: Minimalist style pack
system: style.minimalist
group: pack
version: 1
status: active
applies_to:
  rooms: [ROOMS_ALL_INTERIOR]
  objects: [seating.*, tables.*, sleep.*, storage.*, softgoods.*, decor.*, lighting.*, electronics.*]
  requires_features: []
scope: room_composition
severity: low
confidence: expert_consensus
evidence_class: mixed
belief_gated: false
predicate: |
  require stylePackActive("minimalist")
  assert occupancyRatio(room) <= p.min_occupancy_max
  assert surfaceFillRatio(room) <= p.min_surface_fill_max
  assert colorCount(room, delta_e_merge=10) <= p.min_color_family_max
  assert patternCount(room) <= p.min_pattern_mix_max
  assert countOf(decor.*, room) <= p.min_decor_count_max
  assert visibleCableLength(room) <= p.min_visible_cable_max_m
  assert closedStorageRatio(room) >= p.min_closed_storage_ratio
  prefer visibleFloorRatio(room) >= 0.60
  penalize openShelfItemCount(room) > p.min_open_shelf_items_max, weight=3
  penalize colorContrastRange(room) > p.min_contrast_range_max, weight=1
params:
  - key: min_occupancy_max
    default: 0.35
    range: [0.20, 0.48]
    unit: ratio
    user_editable: true
    rationale: The defining number of the pack; everything else follows from how empty the floor is.
  - key: min_surface_fill_max
    default: 0.15
    range: [0.05, 0.35]
    unit: ratio
    user_editable: true
    rationale: Fraction of horizontal surface area permitted to carry objects. This is the pack's strictest lever.
  - key: min_color_family_max
    default: 3
    range: [2, 4]
    unit: count
    user_editable: true
    rationale: Typically one neutral field, one wood or stone, one accent.
  - key: min_pattern_mix_max
    default: 1
    range: [0, 2]
    unit: count
    user_editable: true
    rationale: Pattern is close to prohibited; texture carries what little variation there is.
  - key: min_decor_count_max
    default: 6
    range: [2, 15]
    unit: count
    user_editable: true
    rationale: Absolute decor object budget per room, independent of room size.
  - key: min_visible_cable_max_m
    default: 0.5
    range: [0.0, 3.0]
    unit: m
    user_editable: true
    rationale: Visible cabling is the most common reason a technically minimal room still looks untidy.
  - key: min_closed_storage_ratio
    default: 0.80
    range: [0.50, 1.00]
    unit: ratio
    user_editable: true
    rationale: Share of storage volume behind doors or drawers rather than on open shelves.
  - key: min_open_shelf_items_max
    default: 3
    range: [0, 10]
    unit: items_per_shelf
    user_editable: true
    rationale: Per-shelf budget; minimalism fails shelf by shelf.
  - key: min_contrast_range_max
    default: 55
    range: [25, 85]
    unit: LRV_points
    user_editable: true
    rationale: Spread between lightest and darkest large plane; wide spread reads graphic/Bauhaus instead.
score:
  weight: 3
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: restyle_shelf
    target: storage.shelf.open
    transform: {items_per_shelf_max: 3, align: left_or_centre_consistent, remove_rest: true}
    cost: free
    effort: low
    reversible: true
    copy: Leave no more than three things on each open shelf and line them up the same way. This is the fastest visible change you can make.
  - rank: 2
    action: add_object
    add: storage.cabinet.closed
    transform: {replace: storage.shelf.open, match_wall_color: true}
    cost: medium
    effort: medium
    reversible: true
    copy: Swap an open shelf for a closed cabinet in the wall colour, so storage disappears instead of being displayed.
  - rank: 3
    action: regroup_decor
    target: decor.*
    transform: {consolidate_to: one_tray_or_one_surface, count_max: p.min_decor_count_max}
    cost: free
    effort: low
    reversible: true
    copy: Gather the small objects onto a single tray. One deliberate group reads calmer than six scattered pieces.
  - rank: 4
    action: add_object
    add: decor.cable_management.channel
    transform: {route: along_baseboard_or_behind_furniture}
    cost: low
    effort: low
    reversible: true
    copy: Hide the cables. Nothing undoes a spare room faster than a visible tangle behind the desk.
conflicts_with: [STY-PACK-019, STY-PACK-020, STY-PACK-035, COMP-LAYER-002]
supersedes: []
requires_rules: [STY-COH-041]
tags: [style_pack, minimalist, low_stimulus, closed_storage, signature_rule]
localization_notes: None.
style_pack:
  id: minimalist
  aliases: [minimal, reductive, less_is_more]
  lineage: "Descends from architectural modernism's reductive wing (the 'less is more' formulation associated with Mies van der Rohe) and from 1960s-70s Minimal art; in interiors it is codified mainly by practice and publishing rather than by a single manifesto."
  palette_60: {role: walls_ceiling_floor_field, hues: [achromatic, cool_neutral, warm_neutral], lrv: [62, 88], examples_hex: ["#F4F3F0", "#E8E8E6", "#DCDCD8"]}
  palette_30: {role: large_furniture, hues: [achromatic, grey, brown_pale], lrv: [30, 62], examples_hex: ["#9A9A98", "#6E6E6C", "#B29C82"]}
  palette_10: {role: single_accent, hues: [black, one_chosen_hue], lrv: [4, 30], examples_hex: ["#1A1A1A", "#2B2B2B"]}
  color_family_max: 3
  materials_required: [painted_plaster_or_drywall, one_wood_or_stone, one_metal]
  materials_signature: [micro_cement, honed_stone, matte_lacquer_joinery, powder_coated_steel, wool_boucle_plain, glass_clear]
  materials_forbidden: [ornate_carving, gilding, tassels_fringe, printed_florals, distressed_faux_finish, mixed_metal_more_than_two]
  sheen: {walls_gu: [2, 12], joinery_gu: [5, 30], metal: matte_or_brushed, stone: honed}
  pattern: {max_distinct: 1, scale_mix: [none], density_max: 0.10, motifs_allowed: [plain_weave_texture, stone_veining_subtle], motifs_forbidden: [floral, damask, ikat, animal, geometric_bold, stripe_high_contrast]}
  furniture: {silhouette: [rectilinear, slim, single_gesture_curve], leg_base: [recessed_plinth, thin_metal_taper, cantilever], seat_height_mm: [400, 450], visible_floor_ratio_min: 0.60, arms: low_or_none, skirted_upholstery: false}
  occupancy: {ratio_target: 0.28, ratio_range: [0.20, 0.40], surface_fill_max: 0.15}
  symmetry: {preference: axial_or_grid_alignment, target: 0.70, strictness: moderate}
  layering: {textile_layers: [1, 2], textile_weight: [light, medium], rug_coverage_min: 0.25, rug_type: [flatweave_plain, low_pile_solid, none]}
  plants: {count: [0, 2], species_max: 1, forms: [single_architectural_specimen], pots: [monochrome_cylinder, concrete, matching_wall_color]}
  art_decor: {art_wall_coverage_pct: [0, 6], decor_items_per_m2: [0.03, 0.20], grouping: single_large_piece_preferred, negative_space_min_pct: 70}
  lighting: {cct_K: [2700, 3500], layers_min: 3, fixture_types: [recessed_downlight, linear_cove, concealed_strip, single_sculptural_pendant], exposed_lamp: false, cri_min: 90, dimming: required}
  ceiling_trim: {ceiling: [flat_painted, flush_plaster], trim: [none, shadow_gap, flush_square], trim_contrast: none_same_as_wall}
  floor: {materials: [large_format_porcelain, micro_cement, pale_engineered_oak, poured_resin], tone: [pale_to_mid], gloss_max_gu: 20, pattern: none}
param_overrides:
  - {channel: comp.occupancy_ratio_max, value: 0.40}
  - {channel: comp.occupancy_ratio_target, value: 0.28}
  - {channel: comp.surface_fill_max, value: 0.15}
  - {channel: comp.negative_space_min_pct, value: 70}
  - {channel: comp.pattern_mix_max, value: 1}
  - {channel: comp.color_family_max, value: 3}
  - {channel: comp.decor_items_per_m2_max, value: 0.20}
  - {channel: comp.symmetry_target, value: 0.70}
  - {channel: comp.wood_tone_max, value: 1}
  - {channel: comp.metal_finish_max, value: 2}
  - {channel: light.layer_count_min, value: 3}
  - {channel: light.exposed_lamp_allowed, value: false}
  - {channel: soft.textile_layer_min, value: 1}
  - {channel: plants.count_min, value: 0}
may_relax: [COMP-LAYER-* minimum layering counts, COMP-ART-* gallery density minimums, soft.textile_layer_min floors, plants.count_min floors, COLOR-ACC-* accent-count minimums]
never_relaxes: [safety.* at any severity, accessibility.ada when the user has flagged a need, ergonomics hard minimums, egress and code rules, minimum circulation path widths]
```

#### Why — tradition
The interior version of minimalism descends from modernism's reductive wing — the "less is more"
formulation attached to Mies van der Rohe — crossed with 1960s–70s Minimal art's interest in the
single unornamented object. Unlike Bauhaus or Shaker, it has no institution or rulebook: in interiors
it is codified by practice and publishing. Its one hard doctrine is that emptiness is the composition,
not the absence of one.

#### Why — psychology / physiology
Two mechanisms with real support. First, visual clutter competes for attention; reducing the number of
competing objects reduces search and attentional load, which is why fluency-based accounts of
aesthetic pleasure (Reber, Schwarz and Winkielman) predict that spare scenes are liked more at equal
familiarity. Second, closed storage removes visual reminders of undone tasks, which is a plausible
route to lower perceived disorder — though the size of that effect in homes is not well established.
Note the countervailing evidence direction: extreme sensory reduction is *not* better for everyone,
and under-stimulating rooms are a documented complaint in sensory-seeking neurodivergent profiles.

#### Customer insight
Minimalist rooms are not empty rooms — they are rooms where every surface has room to spare. The
cheapest version: keep three things per shelf, put the rest away, and hide the cables. If bare walls
feel cold to you rather than calm, this probably is not your pack, and that is useful information.

#### Failure modes / when to skip
Never fire in rooms with a declared storage shortfall until storage has been added — a minimalist score
achieved by stuffing a wardrobe is a false pass. Skip or loosen heavily for sensory-seeking users and
for `bedroom_child` / `nursery` / `craft_hobby_room`, where accessible open storage is a function.
In `dorm_room` and `studio_apartment` the occupancy ceiling is usually unreachable; raise it to 0.48
rather than reporting failure.

---

### STY-PACK-004 — Scandinavian style pack

```yaml
id: STY-PACK-004
title: Scandinavian style pack
system: style.scandinavian
group: pack
version: 1
status: active
applies_to:
  rooms: [ROOMS_ALL_INTERIOR]
  objects: [seating.*, tables.*, sleep.*, storage.*, softgoods.*, decor.*, lighting.*, plants.*]
  requires_features: []
scope: room_composition
severity: low
confidence: expert_consensus
evidence_class: mixed
belief_gated: false
predicate: |
  require stylePackActive("scandinavian")
  assert lrvOf(room.surfaces.walls) >= p.scandi_wall_lrv_min
  assert woodToneCount(room) <= p.scandi_wood_tone_max
  assert avg(lrvOf(w) forEach w in room.objects where materialOf(w) == wood) >= p.scandi_wood_lrv_min
  assert layerCount(room) >= p.scandi_light_layers_min
  assert cctRangeOfFixtures(room).max_K <= p.scandi_cct_max_K
  assert occupancyRatio(room) <= p.scandi_occupancy_max
  assert countOf(plants.*, room) >= p.scandi_plant_min
  prefer daylightAccess(room.primarySeat) >= p.scandi_daylight_min
  prefer raisedOnLegs(obj) forEach obj in room.objects where type in [seating.sofa.*, storage.sideboard.*, tables.side.*]
  penalize forbiddenMaterialPresent(room, pack.materials_forbidden), weight=2
params:
  - key: scandi_wall_lrv_min
    default: 72
    range: [55, 90]
    unit: LRV
    user_editable: true
    rationale: High-latitude practice pushes walls near-white to bounce scarce winter daylight; this is the pack's defining number.
  - key: scandi_wood_tone_max
    default: 2
    range: [1, 3]
    unit: count
    user_editable: true
    rationale: Pale wood consistency is what separates this from mid-century and from rustic.
  - key: scandi_wood_lrv_min
    default: 45
    range: [30, 70]
    unit: LRV
    user_editable: true
    rationale: Distinguishes blond birch/ash/pine from walnut-toned mid-century woods.
  - key: scandi_light_layers_min
    default: 4
    range: [2, 6]
    unit: count
    user_editable: true
    rationale: Many small warm sources rather than one ceiling fixture is a genuine Nordic practice.
  - key: scandi_cct_max_K
    default: 3000
    range: [2400, 3500]
    unit: K
    user_editable: true
    rationale: Warm light against cool-white walls; cool bulbs make the palette read institutional.
  - key: scandi_occupancy_max
    default: 0.45
    range: [0.30, 0.58]
    unit: ratio
    user_editable: true
    rationale: Looser than minimalism — this pack allows comfort objects.
  - key: scandi_plant_min
    default: 2
    range: [0, 6]
    unit: count
    user_editable: true
    rationale: Greenery against pale neutrals is the pack's main colour accent.
  - key: scandi_daylight_min
    default: 0.5
    range: [0.2, 0.9]
    unit: ratio_0_1
    user_editable: true
    rationale: Seating placed to catch available daylight; window treatments stay minimal.
score:
  weight: 3
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: relight
    transform: {add_layer: lighting.table.lamp, count: 2, set_cct_K: 2700, dimming: true, prefer_low_mounting: true}
    cost: low
    effort: low
    reversible: true
    copy: Add two or three warm table and floor lamps at different heights and turn the ceiling light off. Pools of low light is the whole trick.
  - rank: 2
    action: repaint_surface
    target: room.surfaces.walls
    transform: {to_lrv_min: 78, hue: warm_white_or_soft_grey, sheen_gu: 8}
    cost: low
    effort: medium
    reversible: false
    copy: Go lighter on the walls — near-white bounces what daylight you get further into the room.
  - rank: 3
    action: swap_object
    target: softgoods.curtain.heavy
    transform: {to: softgoods.curtain.sheer_linen, or: none}
    cost: low
    effort: low
    reversible: true
    copy: Trade heavy curtains for sheer linen or nothing at all, so the window does more work.
  - rank: 4
    action: add_object
    add: plants.foliage.potted_medium
    transform: {count: 2, position: near_window, pot: neutral_ceramic_or_basket}
    cost: low
    effort: low
    reversible: true
    copy: Two green plants near the window give the room its colour without adding another paint decision.
conflicts_with: [STY-PACK-036, STY-PACK-032, LIGHT-CCT-003]
supersedes: []
requires_rules: [STY-COH-041]
tags: [style_pack, scandinavian, pale_wood, high_lrv, daylight, lamp_layers]
localization_notes: The high-LRV wall target is a high-latitude adaptation; in low-latitude, high-insolation sites it can cause glare — see failure modes and MED/DESERT packs.
style_pack:
  id: scandinavian
  aliases: [nordic, scandi]
  lineage: "Nordic modern design of the mid-twentieth century — Danish, Swedish, Finnish and Norwegian furniture and glass — promoted internationally by mid-1950s touring exhibitions and design prizes. Emphasis on affordable, light, democratic domestic objects; closely related to but distinct from the lagom/hygge behavioural concepts."
  palette_60: {role: walls_ceiling, hues: [achromatic, cool_neutral, warm_white], lrv: [72, 90], examples_hex: ["#F7F6F3", "#F0EFEB", "#E6E7E4"]}
  palette_30: {role: pale_wood_and_floor, hues: [yellow_pale, warm_neutral], lrv: [45, 72], examples_hex: ["#D8C4A2", "#C6AE8A", "#E0D3BC"]}
  palette_10: {role: accent_textile_and_plants, hues: [black, green, dusty_blue, mustard], lrv: [8, 45], examples_hex: ["#1F1F1F", "#556B4F", "#7C93A6"]}
  color_family_max: 5
  materials_required: [pale_wood, wool, linen_or_cotton, painted_plaster, one_matte_metal]
  materials_signature: [birch, ash, pale_oak, sheepskin, chunky_knit_wool, enamelled_steel_pendant, clear_glass, paper_shade]
  materials_forbidden: [dark_ornate_carving, gilding, heavy_velvet_draping, faux_marble_print, glossy_black_lacquer_large_planes]
  sheen: {walls_gu: [4, 12], joinery_gu: [10, 35], metal: powder_coat_matte, wood: oiled_low_sheen}
  pattern: {max_distinct: 3, scale_mix: [small, medium], density_max: 0.30, motifs_allowed: [simple_geometric, stripe, folk_floral_stylised, check], motifs_forbidden: [damask, baroque_scroll, tropical_leaf_large, animal_print]}
  furniture: {silhouette: [slim, tapered, gently_curved], leg_base: [tapered_round_splayed, thin_dowel, hairpin_pale], seat_height_mm: [400, 450], visible_floor_ratio_min: 0.50, arms: slim_wood_or_none, skirted_upholstery: false}
  occupancy: {ratio_target: 0.38, ratio_range: [0.28, 0.50], surface_fill_max: 0.35}
  symmetry: {preference: relaxed_balance, target: 0.55, strictness: loose}
  layering: {textile_layers: [3, 4], textile_weight: [light, medium, one_heavy_throw], rug_coverage_min: 0.30, rug_type: [flatweave_wool, sheepskin_layered, low_pile_geometric]}
  plants: {count: [2, 5], species_max: 3, forms: [trailing, leafy_medium, cut_branch_in_glass], pots: [white_ceramic, woven_basket, terracotta]}
  art_decor: {art_wall_coverage_pct: [5, 14], decor_items_per_m2: [0.20, 0.50], grouping: gallery_row_or_picture_ledge, negative_space_min_pct: 50}
  lighting: {cct_K: [2500, 3000], layers_min: 4, fixture_types: [enamel_dome_pendant_low, paper_shade, table_lamp, candle, wall_sconce], exposed_lamp: sometimes_decorative, cri_min: 90, dimming: required}
  ceiling_trim: {ceiling: [flat_white_matte, tongue_and_groove_painted_white], trim: [simple_square, painted_same_as_wall], trim_contrast: low}
  floor: {materials: [pale_engineered_oak, whitewashed_pine, light_vinyl_plank], tone: [pale], gloss_max_gu: 15}
param_overrides:
  - {channel: comp.occupancy_ratio_max, value: 0.50}
  - {channel: comp.color_family_max, value: 5}
  - {channel: comp.pattern_mix_max, value: 3}
  - {channel: comp.wood_tone_max, value: 2}
  - {channel: comp.symmetry_target, value: 0.55}
  - {channel: comp.rug_coverage_min, value: 0.30}
  - {channel: light.layer_count_min, value: 4}
  - {channel: light.cct_max_K, value: 3000}
  - {channel: light.cri_min, value: 90}
  - {channel: soft.textile_layer_min, value: 3}
  - {channel: plants.count_min, value: 2}
may_relax: [COLOR-DARK-* minimum-dark-anchor recommendations, COMP-ART-* dense gallery-wall targets, WINDOW-DRESS-* minimum window-covering opacity where privacy and glare rules allow]
never_relaxes: [safety.* at any severity, accessibility.ada when the user has flagged a need, ergonomics hard minimums, egress and code rules, minimum circulation path widths]
```

#### Why — tradition
The pack draws on Nordic modern design of the mid-twentieth century — Danish, Swedish, Finnish and
Norwegian furniture, glass and lighting — which reached international audiences through touring
exhibitions and design prizes in the mid-1950s. Its doctrine is democratic: well-made, affordable,
light-coloured objects for ordinary homes. The near-white walls and many-small-lamps habit are
high-latitude adaptations to short winter days, not universal rules, and the pack should be read as
climate-specific in origin.

#### Why — psychology / physiology
The daylight logic is physically real: higher-reflectance surfaces increase interreflected light, so
pale walls genuinely raise interior illuminance for a given window. The many-warm-lamps habit aligns
with circadian guidance — the expert-consensus recommendations published by Brown and colleagues in
*PLOS Biology* (2022) call for low melanopic light in the three hours before bed (below about 10 lux
melanopic EDI) and very low light during sleep — and low-mounted warm lamps make that easier to hit
than a single bright ceiling fixture. That the *look* improves mood is not established.

#### Customer insight
Scandinavian rooms are built around getting the most out of the light you have: very pale walls,
blond wood, thin or no curtains, and several small warm lamps instead of one big ceiling light. Turn
the overhead off tonight and switch on two lamps at different heights — you will see the difference
immediately.

#### Failure modes / when to skip
The high wall-LRV target is a high-latitude move. In hot, high-insolation climates it can worsen glare
and heat gain; the Mediterranean, Spanish/Southwestern and Desert Modern packs override it, and
`LIGHT-GLARE-*` rules win outright. Skip the sheer-curtain remedy where privacy zoning or blackout
for shift-work sleep is required. Do not enforce pale wood in rentals with fixed dark floors —
re-target the wood rule to movable objects only.

---

### STY-PACK-005 — Hygge style pack

```yaml
id: STY-PACK-005
title: Hygge style pack
system: style.hygge
group: pack
version: 1
status: active
applies_to:
  rooms: [ROOMS_SOCIAL, ROOMS_SLEEP, study_library, sunroom_conservatory, attic_finished, basement_finished]
  objects: [seating.*, softgoods.*, lighting.*, decor.*, tables.*, plants.*]
  requires_features: []
scope: room_composition
severity: low
confidence: contested
evidence_class: mixed
belief_gated: false
predicate: |
  require stylePackActive("hygge")
  assert textileLayerCount(room) >= p.hygge_textile_layers_min
  assert cctRangeOfFixtures(room).max_K <= p.hygge_cct_max_K
  assert countOf(lighting.low_level, room) >= p.hygge_low_lamp_min
  assert illuminanceAt(room.primarySeat) <= p.hygge_evening_lux_max when schedule == evening
  assert exists seat in room.seats where clearance(seat, front) >= 0.4 and distanceToHeatSource(seat) <= p.hygge_warmth_radius_m
  assert countOf(softgoods.throw.*, room) >= p.hygge_throw_min
  prefer countOf(seating.*, room) >= p.hygge_seat_min
  prefer symmetryScore(room, axis=primary) <= 0.65
  penalize cctRangeOfFixtures(room).max_K > 3000, weight=3
  penalize max(sheenOf(s) forEach s in room.surfaces) > p.hygge_sheen_max_gu, weight=1
params:
  - key: hygge_textile_layers_min
    default: 4
    range: [2, 7]
    unit: count
    user_editable: true
    rationale: Layered soft goods are the pack's physical substance: rug, cushions, throw, curtain.
  - key: hygge_cct_max_K
    default: 2700
    range: [2200, 3000]
    unit: K
    user_editable: true
    rationale: Candle-adjacent warmth; this pack is defined by light temperature more than by colour.
  - key: hygge_low_lamp_min
    default: 3
    range: [1, 6]
    unit: count
    user_editable: true
    rationale: Sources below roughly 1.5 m so light pools rather than floods.
  - key: hygge_evening_lux_max
    default: 80
    range: [30, 200]
    unit: lux
    user_editable: true
    rationale: Evening horizontal illuminance ceiling at the main seat; keeps the room from going bright.
  - key: hygge_warmth_radius_m
    default: 3.0
    range: [1.0, 6.0]
    unit: m
    user_editable: true
    rationale: At least one seat near a real or perceived warmth source (fireplace, radiator, sunny window).
  - key: hygge_throw_min
    default: 2
    range: [1, 5]
    unit: count
    user_editable: true
    rationale: Reachable blankets are the single most literal expression of the concept.
  - key: hygge_seat_min
    default: 3
    range: [2, 8]
    unit: count
    user_editable: true
    rationale: Hygge is social; seating for company is part of the spec.
  - key: hygge_sheen_max_gu
    default: 15
    range: [5, 35]
    unit: GU_60deg
    user_editable: true
    rationale: Matte surfaces absorb rather than bounce the low light this pack relies on.
score:
  weight: 3
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: relight
    transform: {set_cct_K: 2700, add_layer: lighting.table.lamp, count: 2, mount_height_max_m: 1.5, add_dimming: true}
    cost: low
    effort: low
    reversible: true
    copy: Put the light low and warm — two or three lamps at chair height on a dimmer, ceiling light off. This costs the least and changes the most.
  - rank: 2
    action: add_textile
    add: softgoods.throw.wool
    transform: {count: 2, position: within_reach_of_primary_seats}
    cost: low
    effort: low
    reversible: true
    copy: Keep a couple of blankets where you actually sit, not folded decoratively across the room.
  - rank: 3
    action: move_object
    target: seating.armchair.*
    transform: {to: within p.hygge_warmth_radius_m of nearestFeature(fireplace|radiator) or daylight_pool}
    cost: free
    effort: low_physical
    reversible: true
    copy: Pull one armchair closer to the warm corner of the room — near the fire, the radiator or the sunny window.
  - rank: 4
    action: add_object
    add: decor.candle.group
    transform: {count: 3, position: on_stable_non_combustible_surface, clearance_m: 0.3}
    cost: low
    effort: low
    reversible: true
    copy: A small group of candles is the most Danish move there is — keep them on a stable surface, clear of curtains and out of reach of children and pets.
conflicts_with: [SAFE-FIRE-002, SAFE-FIRE-011, LIGHT-TASK-004, STY-PACK-003]
supersedes: []
requires_rules: [STY-COH-041, STY-PACK-004]
tags: [style_pack, hygge, warmth, low_light, textile_layering, evening_mode]
localization_notes: Danish/Norwegian term; keep untranslated but gloss as "cosy togetherness" on first UI use. Lagom (Swedish, "just the right amount") is a related but distinct concept handled as a modifier, not a pack.
style_pack:
  id: hygge
  aliases: [cosy_nordic, danish_cosy]
  lineage: "Danish and Norwegian everyday concept of cosy, low-key togetherness, not historically a decorating style; it entered English-language design publishing around 2016, notably via Meik Wiking's popular book on the subject. Treated here as a behavioural/atmospheric modifier layered over the Scandinavian pack."
  palette_60: {role: walls_and_large_planes, hues: [warm_neutral, warm_white, soft_grey], lrv: [55, 80], examples_hex: ["#EFE8DE", "#E2DAD0", "#D3CCC2"]}
  palette_30: {role: upholstery_and_wood, hues: [brown, oatmeal, moss], lrv: [25, 55], examples_hex: ["#A89478", "#8C7A64", "#6E7361"]}
  palette_10: {role: accent_and_flame, hues: [amber, rust, deep_green, black], lrv: [8, 35], examples_hex: ["#B5763F", "#8A4A32", "#37453A"]}
  color_family_max: 5
  materials_required: [wool, sheepskin_or_faux, wood, ceramic, beeswax_or_led_candle]
  materials_signature: [chunky_knit, brushed_wool_throw, sheepskin, linen_slipcover, stoneware_mug, cast_iron, oiled_pine]
  materials_forbidden: [chrome_polished_large, glass_tabletop_frameless_large, high_gloss_white_lacquer, cool_white_led_fixed, plastic_mesh_task_seating_as_primary]
  sheen: {walls_gu: [4, 12], joinery_gu: [5, 25], metal: matte_or_aged, textile: napped_preferred}
  pattern: {max_distinct: 3, scale_mix: [small, medium], density_max: 0.35, motifs_allowed: [cable_knit, check, stripe, folk_geometric, faded_floral], motifs_forbidden: [high_contrast_op_art, neon_graphic, tropical_large]}
  furniture: {silhouette: [soft, rounded, deep_seat], leg_base: [tapered_wood, low_block, castor], seat_height_mm: [380, 440], seat_depth_mm: [560, 680], visible_floor_ratio_min: 0.40, arms: padded_generous, skirted_upholstery: optional}
  occupancy: {ratio_target: 0.48, ratio_range: [0.36, 0.58], surface_fill_max: 0.45}
  symmetry: {preference: informal_clustered, target: 0.45, strictness: loose}
  layering: {textile_layers: [4, 6], textile_weight: [medium, heavy], rug_coverage_min: 0.40, rug_type: [wool_pile, sheepskin_layered, rag_rug]}
  plants: {count: [1, 4], species_max: 3, forms: [leafy, trailing, seasonal_branches, dried], pots: [terracotta, basket, glazed_stoneware]}
  art_decor: {art_wall_coverage_pct: [6, 16], decor_items_per_m2: [0.30, 0.70], grouping: informal_clusters, negative_space_min_pct: 40, books_visible: encouraged}
  lighting: {cct_K: [2200, 2700], layers_min: 4, fixture_types: [table_lamp, floor_lamp_low, candle, string_light_warm, fireplace], exposed_lamp: false, cri_min: 90, dimming: required, evening_lux_target: [40, 80]}
  ceiling_trim: {ceiling: [flat_matte, painted_plank, exposed_pale_beam], trim: [simple, painted_wall_colour], trim_contrast: low}
  floor: {materials: [oiled_wood, wool_carpet, cork], tone: [mid_warm], gloss_max_gu: 12}
param_overrides:
  - {channel: light.cct_max_K, value: 2700}
  - {channel: light.layer_count_min, value: 4}
  - {channel: light.exposed_lamp_allowed, value: false}
  - {channel: soft.textile_layer_min, value: 4}
  - {channel: soft.textile_weight_class, value: medium_to_heavy}
  - {channel: comp.rug_coverage_min, value: 0.40}
  - {channel: comp.occupancy_ratio_target, value: 0.48}
  - {channel: comp.symmetry_target, value: 0.45}
  - {channel: mat.sheen_max_gu, value: 15}
  - {channel: comp.decor_items_per_m2_max, value: 0.70}
may_relax: [COMP-EMPTY-* negative-space minimums, LIGHT-AMBIENT-* evening ambient-illuminance floors in non-task rooms, COMP-SYM-* symmetry targets]
never_relaxes: [safety.* at any severity — in particular open-flame clearance, smoke-alarm and combustible-textile rules — accessibility.ada when the user has flagged a need, ergonomics hard minimums, egress and code rules, minimum circulation path widths]
```

#### Why — tradition
Hygge is a Danish and Norwegian everyday word for low-key, warm togetherness — not historically a
decorating style at all. It entered English-language design publishing around 2016 and was rapidly
repackaged as an interiors look. Honest framing: this pack encodes an *atmosphere* (low warm light,
reachable blankets, seating that faces inward) layered on top of the Scandinavian pack, and Danes
would reasonably say it is about company and candles rather than about furniture.

#### Why — psychology / physiology
The lighting half has real backing. Expert-consensus recommendations published by Brown and colleagues
in *PLOS Biology* (2022) call for keeping evening light low — under roughly 10 lux melanopic EDI in the
three hours before bed — and low-mounted 2200–2700 K lamps on dimmers make that achievable in a way
overhead lighting does not. Warmth and soft enclosure also map onto prospect–refuge accounts of
preference for sheltered vantage points. That "hygge décor" raises happiness is a marketing claim with
no direct empirical support.

#### Customer insight
Hygge is a Danish word for the cosy, unhurried feeling of being warm and together — candles, blankets,
low lamps, no rush. The most effective change is free: turn the ceiling light off, switch on two lamps
at sitting height, and keep a blanket where you actually sit. Warm, dim light in the evening also
happens to be easier on your sleep.

#### Failure modes / when to skip
Candle and fireplace remedies are subordinate to `safety.fire.*` without exception — clearance to
textiles, smoke and CO alarm presence, and child/pet reach all win, and the app must say so rather
than quietly dropping the suggestion. Do not apply the evening illuminance ceiling in rooms with an
active task requirement (reading for a low-vision user, homework, food prep) or where a falls-risk
senior needs higher light levels; `safety.senior_falls` and `ergonomics.task_zones` win. Skip in
`home_office` during work hours.

---

### STY-PACK-006 — Mid-century modern style pack

```yaml
id: STY-PACK-006
title: Mid-century modern style pack
system: style.mid_century_modern
group: pack
version: 1
status: active
applies_to:
  rooms: [ROOMS_ALL_INTERIOR]
  objects: [seating.*, tables.*, sleep.*, storage.*, softgoods.*, decor.*, lighting.*, plants.*]
  requires_features: []
scope: room_composition
severity: low
confidence: expert_consensus
evidence_class: aesthetic
belief_gated: false
predicate: |
  require stylePackActive("mid_century_modern")
  assert count(obj in room.objects where legStyleOf(obj) in [tapered_round, tapered_square, hairpin, splayed_dowel]) >= p.mcm_tapered_leg_min_count
  assert visibleFloorRatio(room) >= p.mcm_visible_floor_min
  assert woodToneCount(room) <= p.mcm_wood_tone_max
  assert avg(lrvOf(w) forEach w in room.objects where materialOf(w) == wood) between p.mcm_wood_lrv_band
  assert countOf(decor.accent_saturated, room) >= p.mcm_saturated_accent_min
  assert max(seatHeightOf(s) forEach s in room.seats) <= p.mcm_seat_height_max_mm
  prefer countOf(silhouetteOf == organic_curve, room) >= 1
  penalize countOf(obj where legStyleOf(obj) in [turned, cabriole, skirted]) > p.mcm_wrong_leg_max, weight=3
  penalize forbiddenMaterialPresent(room, pack.materials_forbidden), weight=2
params:
  - key: mcm_tapered_leg_min_count
    default: 3
    range: [1, 8]
    unit: count
    user_editable: true
    rationale: The tapered or splayed leg is the single most diagnostic feature of the style.
  - key: mcm_visible_floor_min
    default: 0.52
    range: [0.35, 0.70]
    unit: ratio
    user_editable: true
    rationale: Furniture that floats on legs is what makes these rooms read light despite dark wood.
  - key: mcm_wood_tone_max
    default: 2
    range: [1, 3]
    unit: count
    user_editable: true
    rationale: One mid-to-dark wood (walnut/teak) plus at most one pale secondary.
  - key: mcm_wood_lrv_band
    default: [18, 45]
    range: [8, 60]
    unit: LRV
    user_editable: true
    rationale: Walnut and teak sit far darker than Scandinavian birch; this band is what separates the two packs.
  - key: mcm_saturated_accent_min
    default: 2
    range: [0, 6]
    unit: count
    user_editable: true
    rationale: Mustard, teal, burnt orange and olive accents against neutral fields.
  - key: mcm_seat_height_max_mm
    default: 440
    range: [380, 480]
    unit: mm
    user_editable: true
    rationale: Low seating is characteristic; capped so it does not collide with senior/mobility seat-height rules.
  - key: mcm_wrong_leg_max
    default: 1
    range: [0, 4]
    unit: count
    user_editable: true
    rationale: Turned, cabriole and skirted bases pull the room toward traditional and break the read.
score:
  weight: 3
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: swap_object
    target: storage.sideboard.*
    transform: {to_variant: raised_on_tapered_legs, wood_lrv_band: p.mcm_wood_lrv_band}
    cost: high
    effort: medium
    reversible: true
    copy: One credenza on splayed legs sets the tone for the whole room — it is the piece worth spending on.
  - rank: 2
    action: add_object
    add: lighting.floor.arc_or_tripod
    transform: {position: beside_primary_seat, shade: cone_or_globe}
    cost: medium
    effort: low
    reversible: true
    copy: A cone- or globe-shaded lamp on thin legs is an instant mid-century cue and costs far less than new furniture.
  - rank: 3
    action: add_textile
    add: softgoods.cushion.saturated
    transform: {hues: [mustard, teal, burnt_orange, olive], count: 3}
    cost: low
    effort: low
    reversible: true
    copy: Add two or three cushions in mustard, teal or burnt orange. Those colours do most of the era's work.
  - rank: 4
    action: remove_object
    target: obj where legStyleOf(obj) in [turned, cabriole, skirted]
    transform: {keep_max: p.mcm_wrong_leg_max}
    cost: free
    effort: low_physical
    reversible: true
    copy: Move out the pieces with turned or skirted bases — they read as a different era and muddy the look.
conflicts_with: [STY-PACK-010, STY-PACK-011, ERG-SEAT-SENIOR-002]
supersedes: []
requires_rules: [STY-COH-041]
tags: [style_pack, mid_century_modern, tapered_leg, walnut, saturated_accent, signature_rule]
localization_notes: The term is retrospective; do not present it as a period label used at the time.
style_pack:
  id: mid_century_modern
  aliases: [mcm, midcentury, danish_modern_adjacent]
  lineage: "Furniture and interiors of roughly the 1940s-60s in the US and Northern Europe. The label itself is retrospective: it appeared sporadically in print from the early 1950s but only entered general design vocabulary after Cara Greenberg's 1984 book 'Mid-Century Modern: Furniture of the 1950s'."
  palette_60: {role: walls_and_large_planes, hues: [warm_neutral, white, soft_grey], lrv: [58, 82], examples_hex: ["#EDE8DE", "#E0DCD2", "#CFCBC2"]}
  palette_30: {role: walnut_teak_and_upholstery, hues: [brown_mid_dark, olive, charcoal], lrv: [18, 45], examples_hex: ["#5C4433", "#7A5B3E", "#4A4A42"]}
  palette_10: {role: saturated_accent, hues: [mustard, teal, burnt_orange, avocado], lrv: [12, 45], examples_hex: ["#C8922A", "#2F7A76", "#B4562A", "#6E7A34"]}
  color_family_max: 5
  materials_required: [walnut_or_teak, wool_upholstery, one_metal, glass]
  materials_signature: [walnut, teak, rosewood_vintage, moulded_plywood, fibreglass_shell, brass_thin, tweed_wool, cork, ceramic_lamp_base]
  materials_forbidden: [ornate_carving, distressed_shabby_paint, faux_stone_veneer, heavy_fringe, chintz_floral, barn_door_hardware]
  sheen: {walls_gu: [5, 20], wood_gu: [15, 40], metal: brushed_brass_or_black, glass: clear_or_smoked}
  pattern: {max_distinct: 3, scale_mix: [small, medium, one_large_graphic], density_max: 0.35, motifs_allowed: [atomic_geometric, starburst, abstract_organic, barkcloth_botanical, stripe], motifs_forbidden: [damask, toile, chintz, animal_print]}
  furniture: {silhouette: [slim_rectilinear, organic_curve, moulded_shell], leg_base: [tapered_round, tapered_square, hairpin, splayed_dowel, thin_metal_sled], seat_height_mm: [380, 440], visible_floor_ratio_min: 0.52, arms: slim_wood_or_shell, skirted_upholstery: false}
  occupancy: {ratio_target: 0.42, ratio_range: [0.32, 0.52], surface_fill_max: 0.35}
  symmetry: {preference: asymmetric_balance_with_axial_anchor, target: 0.50, strictness: loose}
  layering: {textile_layers: [2, 3], textile_weight: [light, medium], rug_coverage_min: 0.30, rug_type: [shag_low, flatweave_geometric, wool_loop]}
  plants: {count: [1, 4], species_max: 3, forms: [rubber_plant, monstera, snake_plant, trailing_philodendron], pots: [ceramic_on_tripod_stand, glazed_cylinder]}
  art_decor: {art_wall_coverage_pct: [6, 14], decor_items_per_m2: [0.25, 0.55], grouping: asymmetric_with_one_large_graphic, negative_space_min_pct: 48, starburst_clock: signature_optional}
  lighting: {cct_K: [2700, 3000], layers_min: 3, fixture_types: [globe_pendant, cone_shade, arc_floor_lamp, tripod_lamp, sputnik], exposed_lamp: decorative_globe_allowed, cri_min: 85, dimming: preferred}
  ceiling_trim: {ceiling: [flat_white, exposed_beam_painted, tongue_and_groove], trim: [minimal_square, none], trim_contrast: low}
  floor: {materials: [mid_oak_or_walnut_plank, terrazzo, cork, vct_pattern], tone: [mid_warm], gloss_max_gu: 25}
param_overrides:
  - {channel: comp.occupancy_ratio_target, value: 0.42}
  - {channel: comp.color_family_max, value: 5}
  - {channel: comp.pattern_mix_max, value: 3}
  - {channel: comp.wood_tone_max, value: 2}
  - {channel: comp.symmetry_target, value: 0.50}
  - {channel: comp.focal_point_max, value: 2}
  - {channel: light.exposed_lamp_allowed, value: true}
  - {channel: light.cct_max_K, value: 3000}
  - {channel: mat.sheen_max_gu, value: 20}
may_relax: [COMP-SYM-* strict symmetry, COLOR-NEUTRAL-* accent-saturation ceilings, COMP-LEG-* skirted-base preferences]
never_relaxes: [safety.* at any severity, accessibility.ada when the user has flagged a need, ergonomics hard minimums — in particular minimum seat heights for senior or mobility-limited users, which override the low-seat preference — egress and code rules, minimum circulation path widths]
```

#### Why — tradition
This is the furniture and interior language of roughly the 1940s to 1960s in the United States and
Northern Europe: moulded plywood and fibreglass shells, walnut and teak case goods, thin splayed legs,
and saturated accent colours against neutral fields. The label is retrospective — it appeared
sporadically in print from the early 1950s but only became standard design vocabulary after Cara
Greenberg's 1984 book *Mid-Century Modern: Furniture of the 1950s*. Nobody in 1955 said they were
decorating "mid-century modern".

#### Why — psychology / physiology
No direct empirical support for a wellbeing effect specific to this style; the mechanism is plausible
but untested. One real perceptual effect: furniture raised on visible legs increases the amount of
uninterrupted floor plane in view, and larger visible floor area is a straightforward cue to perceived
room size. The low seat heights are a genuine functional tradeoff — comfortable for most adults,
harder for users with hip, knee or balance limitations.

#### Customer insight
Mid-century modern is the 1950s-60s look: warm walnut, slim tapered legs, and a few strong colours
like mustard or teal. The cheapest way in is legs and lamps — one piece that stands on thin splayed
legs, plus a cone or globe shade, reads more "mid-century" than a whole room of new furniture.

#### Failure modes / when to skip
The low-seat preference must yield whenever a senior or mobility-limited user is present: seat-height
ergonomics is a higher tier and the app should say the style preference lost. Skip the visible-floor
target in small rooms needing under-furniture storage. Do not fire the "remove turned-leg pieces"
remedy on inherited or sentimental items without offering the keep-and-reframe option from
STY-COH-043.

---

### STY-PACK-007 — Modern / contemporary style pack

```yaml
id: STY-PACK-007
title: Modern / contemporary style pack
system: style.modern_contemporary
group: pack
version: 1
status: active
applies_to:
  rooms: [ROOMS_ALL_INTERIOR]
  objects: [seating.*, tables.*, sleep.*, storage.*, softgoods.*, decor.*, lighting.*, electronics.*]
  requires_features: []
scope: room_composition
severity: low
confidence: contested
evidence_class: aesthetic
belief_gated: false
predicate: |
  require stylePackActive("modern_contemporary")
  assert colorCount(room, delta_e_merge=10) <= p.mod_color_family_max
  assert contrastRange(room) >= p.mod_contrast_range_min
  assert count(obj in room.objects where silhouetteOf(obj) == rectilinear) / countOf(*, room) >= p.mod_rectilinear_share_min
  assert metalFinishCount(room) <= p.mod_metal_finish_max
  assert occupancyRatio(room) <= p.mod_occupancy_max
  assert layerCount(room) >= p.mod_light_layers_min
  prefer alignedWithin(edgeAxisOf(obj), room.dominantGridAxis, tol_deg=p.mod_grid_tol_deg) forEach obj in room.largeObjects
  penalize countOf(motif.ornamental_historicist, room) > 0, weight=3
  penalize woodToneCount(room) > p.mod_wood_tone_max, weight=1
params:
  - key: mod_color_family_max
    default: 4
    range: [2, 6]
    unit: count
    user_editable: true
    rationale: Contemporary rooms are usually neutral fields with one or two decisive accents.
  - key: mod_contrast_range_min
    default: 45
    range: [20, 80]
    unit: LRV_points
    user_editable: true
    rationale: Unlike minimalism, this pack REQUIRES a graphic light-to-dark spread; flat mid-tones read builder-grade.
  - key: mod_rectilinear_share_min
    default: 0.6
    range: [0.3, 0.9]
    unit: ratio
    user_editable: true
    rationale: Clean orthogonal geometry is the pack's structural signature.
  - key: mod_metal_finish_max
    default: 2
    range: [1, 3]
    unit: count
    user_editable: true
    rationale: Mixing more than two metal finishes reads eclectic, not contemporary.
  - key: mod_occupancy_max
    default: 0.46
    range: [0.30, 0.58]
    unit: ratio
    user_editable: true
    rationale: Roomier than minimalism, tighter than traditional.
  - key: mod_light_layers_min
    default: 3
    range: [2, 5]
    unit: count
    user_editable: true
    rationale: Recessed ambient, task, and one sculptural feature fixture.
  - key: mod_grid_tol_deg
    default: 5
    range: [0, 20]
    unit: deg
    user_editable: true
    rationale: How strictly large pieces must align to the room grid; angled furniture reads transitional.
  - key: mod_wood_tone_max
    default: 2
    range: [1, 3]
    unit: count
    user_editable: true
    rationale: Wood is an accent here, not the theme.
score:
  weight: 3
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: room.largeObjects
    transform: {rotate_to: room.dominantGridAxis, tol_deg: 3}
    cost: free
    effort: low_physical
    reversible: true
    copy: Square everything up to the walls. Contemporary rooms get most of their crispness from things being genuinely parallel.
  - rank: 2
    action: repaint_surface
    target: room.surfaces.accentWall
    transform: {to_lrv_max: 20, hue: charcoal_or_deep_neutral}
    cost: low
    effort: medium
    reversible: false
    copy: One dark wall or dark joinery run gives the room the light-to-dark contrast that makes it look designed rather than default.
  - rank: 3
    action: swap_finish
    target: obj where materialOf(obj) == metal
    transform: {unify_to: max_two_finishes}
    cost: low
    effort: medium
    reversible: true
    copy: Pick two metal finishes and stick to them — handles, lamps, legs and frames all in the same two.
  - rank: 4
    action: remove_object
    target: motif.ornamental_historicist
    transform: {keep_max: 0, offer_relocation: true}
    cost: free
    effort: low
    reversible: true
    copy: Period-style ornament fights this look. If a carved or scrolled piece matters to you, give it a room of its own instead.
conflicts_with: [STY-PACK-010, STY-PACK-020, STY-PACK-021]
supersedes: []
requires_rules: [STY-COH-041]
tags: [style_pack, contemporary, rectilinear, high_contrast, grid_alignment]
localization_notes: "Contemporary" is a moving target by definition; the pack is versioned so the engine can pin a vintage.
style_pack:
  id: modern_contemporary
  aliases: [contemporary, modern, current]
  lineage: "Trade shorthand for the prevailing present-day look rather than a historical movement: neutral fields, orthogonal geometry, large-format surfaces, minimal applied ornament. Because 'contemporary' is defined by the current market, the pack is explicitly versioned and will drift."
  palette_60: {role: walls_ceiling, hues: [achromatic, cool_neutral, greige], lrv: [60, 85], examples_hex: ["#F2F1EE", "#E3E2DF", "#D2D1CC"]}
  palette_30: {role: large_furniture_and_joinery, hues: [charcoal, grey, taupe], lrv: [15, 45], examples_hex: ["#4A4A4C", "#6B6B6E", "#8B8378"]}
  palette_10: {role: accent, hues: [black, one_saturated_hue, brass], lrv: [4, 30], examples_hex: ["#141414", "#1F4E5F", "#8C6B34"]}
  color_family_max: 4
  materials_required: [painted_plaster, engineered_stone_or_porcelain, one_metal, glass]
  materials_signature: [large_format_porcelain, quartz_composite, matte_lacquer, blackened_steel, low_iron_glass, boucle, micro_cement]
  materials_forbidden: [carved_historicist_ornament, gilded_gesso, chintz, lace, distressed_shabby_paint, tassel_trim]
  sheen: {walls_gu: [3, 15], joinery_gu: [5, 35], metal: matte_black_or_brushed_brass, stone: honed_or_polished}
  pattern: {max_distinct: 2, scale_mix: [large], density_max: 0.20, motifs_allowed: [bold_stone_veining, abstract_large_scale, plain_texture], motifs_forbidden: [small_repeating_floral, toile, damask, folk_geometric]}
  furniture: {silhouette: [rectilinear, low_slung, one_bold_curve], leg_base: [recessed_plinth, thin_metal, cantilever, floating_wall_mount], seat_height_mm: [400, 450], visible_floor_ratio_min: 0.48, arms: squared, skirted_upholstery: false}
  occupancy: {ratio_target: 0.40, ratio_range: [0.30, 0.50], surface_fill_max: 0.28}
  symmetry: {preference: grid_aligned_balance, target: 0.65, strictness: moderate}
  layering: {textile_layers: [2, 3], textile_weight: [light, medium], rug_coverage_min: 0.35, rug_type: [large_low_pile_solid, abstract_large_scale]}
  plants: {count: [1, 3], species_max: 2, forms: [architectural_specimen, olive_or_fiddle_leaf, sculptural_branch], pots: [matte_monochrome_large]}
  art_decor: {art_wall_coverage_pct: [6, 15], decor_items_per_m2: [0.12, 0.35], grouping: one_oversized_piece, negative_space_min_pct: 55}
  lighting: {cct_K: [2700, 3500], layers_min: 3, fixture_types: [recessed_downlight, linear_pendant, concealed_cove, sculptural_statement_pendant], exposed_lamp: false, cri_min: 90, dimming: required}
  ceiling_trim: {ceiling: [flat_painted, dropped_plane_with_cove], trim: [shadow_gap, flush, slim_square], trim_contrast: none_or_high_deliberate}
  floor: {materials: [large_format_porcelain, wide_plank_engineered, micro_cement, polished_concrete], tone: [pale_or_charcoal], gloss_max_gu: 30}
param_overrides:
  - {channel: comp.occupancy_ratio_max, value: 0.50}
  - {channel: comp.color_family_max, value: 4}
  - {channel: comp.pattern_mix_max, value: 2}
  - {channel: comp.metal_finish_max, value: 2}
  - {channel: comp.symmetry_target, value: 0.65}
  - {channel: comp.art_wall_coverage_target, value: 0.10}
  - {channel: light.layer_count_min, value: 3}
  - {channel: light.cri_min, value: 90}
may_relax: [COMP-ORNAMENT-* minimum-ornament or "add warmth" recommendations, COMP-ART-* multi-piece gallery targets, COLOR-WARMTH-* warm-tone minimums]
never_relaxes: [safety.* at any severity, accessibility.ada when the user has flagged a need, ergonomics hard minimums, egress and code rules, minimum circulation path widths]
```

#### Why — tradition
"Contemporary" is trade shorthand for the prevailing present-day look, not a historical movement, and
the trade does not agree on its edges. What is consistent in practice: neutral fields, orthogonal
geometry, large-format surfaces, restrained ornament, and a deliberate light-to-dark contrast. Because
it is defined by the current market rather than by a lineage, this pack is explicitly versioned so the
engine can pin which vintage of "contemporary" a user chose.

#### Why — psychology / physiology
No direct empirical support for a wellbeing effect; the mechanism is plausible but untested. One real
perceptual point: alignment. Objects that share an axis are grouped by the visual system under
classical grouping principles, so squaring furniture to the room grid genuinely reduces the number of
perceived elements without removing any objects. That is why the free "square everything up" remedy
often outperforms expensive swaps.

#### Customer insight
Contemporary is the current mainstream look: neutral walls, clean squared-off furniture, one or two
metals, and a deliberate dark note so the room is not all mid-beige. Before buying anything, try
squaring every large piece to the walls — parallel lines are most of what makes a room look finished.

#### Failure modes / when to skip
Skip the grid-alignment rule in rooms with non-orthogonal walls (attic conversions, bay windows,
angled open plans) where alignment to a single axis creates dead corners. The contrast requirement can
conflict with low-vision guidance in either direction — high contrast at edges helps, high contrast
across floor planes can read as a step — so `accessibility.*` wins. Do not fire in rooms the user
labelled as a period-feature room.

---

### STY-PACK-008 — Modern organic style pack

```yaml
id: STY-PACK-008
title: Modern organic style pack
system: style.modern_organic
group: pack
version: 1
status: active
applies_to:
  rooms: [ROOMS_ALL_INTERIOR]
  objects: [seating.*, tables.*, sleep.*, storage.*, softgoods.*, decor.*, lighting.*, plants.*]
  requires_features: []
scope: room_composition
severity: low
confidence: contested
evidence_class: mixed
belief_gated: false
predicate: |
  require stylePackActive("modern_organic")
  assert count(obj in room.objects where silhouetteOf(obj) in [organic_curve, rounded, irregular]) >= p.orgmod_curved_min_count
  assert materialVarietyScore(room) >= p.orgmod_texture_variety_min
  assert colorCount(room, delta_e_merge=12) <= p.orgmod_color_family_max
  assert max(chromaOf(c) forEach c in room.colors) <= p.orgmod_chroma_max
  assert countOf(plants.*, room) >= p.orgmod_plant_min
  assert max(sheenOf(s) forEach s in room.surfaces) <= p.orgmod_sheen_max_gu
  prefer countOf(materials.natural_unprocessed, room) / countOf(*, room) >= p.orgmod_natural_share_min
  penalize countOf(obj where silhouetteOf(obj) == rectilinear) / countOf(*, room) > 0.7, weight=2
  penalize forbiddenMaterialPresent(room, pack.materials_forbidden), weight=2
params:
  - key: orgmod_curved_min_count
    default: 3
    range: [1, 8]
    unit: count
    user_editable: true
    rationale: Curved and irregular silhouettes are the pack's diagnostic; without them it collapses into contemporary.
  - key: orgmod_texture_variety_min
    default: 6
    range: [3, 10]
    unit: count
    user_editable: true
    rationale: With colour suppressed, distinct tactile materials carry all the interest.
  - key: orgmod_color_family_max
    default: 4
    range: [3, 6]
    unit: count
    user_editable: true
    rationale: Bone, oat, clay, sand, charcoal — a tight natural range.
  - key: orgmod_chroma_max
    default: 35
    range: [15, 60]
    unit: chroma_C_star
    user_editable: true
    rationale: Caps saturation so accents stay earth-derived rather than pigment-bright.
  - key: orgmod_plant_min
    default: 2
    range: [0, 8]
    unit: count
    user_editable: true
    rationale: Live material is part of the spec, not decoration.
  - key: orgmod_sheen_max_gu
    default: 12
    range: [3, 30]
    unit: GU_60deg
    user_editable: true
    rationale: Matte and honed throughout; polish reads as a different pack.
  - key: orgmod_natural_share_min
    default: 0.5
    range: [0.25, 0.85]
    unit: ratio
    user_editable: true
    rationale: Share of visible material that is minimally processed natural stock.
score:
  weight: 3
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: decor.vessel.large_organic
    transform: {count: 2, forms: [asymmetric_ceramic, burl_wood_bowl, travertine_plinth]}
    cost: low
    effort: low
    reversible: true
    copy: Add one or two big, softly shaped objects — a rounded ceramic vessel, a chunk of travertine. Shape does the work here, not colour.
  - rank: 2
    action: swap_object
    target: tables.coffee.rectangular
    transform: {to_variant: round_or_kidney, material: [travertine, burl, plaster]}
    cost: high
    effort: medium
    reversible: true
    copy: A round or kidney-shaped coffee table softens the whole seating group and improves the walk-around at the same time.
  - rank: 3
    action: add_textile
    add: softgoods.cushion.textured
    transform: {materials: [boucle, raw_linen, undyed_wool], count: 3}
    cost: low
    effort: low
    reversible: true
    copy: Bouclé, raw linen and undyed wool in the same colour family give you variety you can feel rather than see.
  - rank: 4
    action: add_object
    add: plants.tree.potted_large
    transform: {count: 1, pot: [unglazed_terracotta, plaster_finish], position: near_daylight}
    cost: medium
    effort: low
    reversible: true
    copy: One large plant in an unglazed pot anchors the room and keeps the palette from feeling flat.
conflicts_with: [STY-PACK-038, STY-PACK-032, STY-PACK-033]
supersedes: []
requires_rules: [STY-COH-041]
tags: [style_pack, modern_organic, curves, natural_material, low_chroma]
localization_notes: Distinct from "organic modernism" as an architectural term (Aalto, Saarinen); this pack is the 2020s interiors usage.
style_pack:
  id: modern_organic
  aliases: [organic_modern, soft_minimal, warm_minimal]
  lineage: "2020s interiors label, not a historical school. It reworks mid-century organic modernism's curved forms (Aalto, Saarinen) through a low-chroma natural-material palette. Trade usage is unsettled and overlaps Japandi and warm minimalism."
  palette_60: {role: walls_ceiling, hues: [warm_neutral, bone, oat], lrv: [60, 82], examples_hex: ["#EFE9DF", "#E3DACB", "#D6CCBC"]}
  palette_30: {role: large_furniture_stone_wood, hues: [sand, clay, pale_brown], lrv: [35, 62], examples_hex: ["#C9B79E", "#B49B80", "#A08A72"]}
  palette_10: {role: accent, hues: [charcoal, terracotta_muted, olive], lrv: [8, 35], examples_hex: ["#3B3733", "#9A6247", "#6B6B4C"]}
  color_family_max: 4
  materials_required: [travertine_or_limestone, plaster, undyed_textile, wood, live_plant]
  materials_signature: [travertine, limewash, lime_plaster, burl_wood, boucle, rattan, raw_linen, unglazed_ceramic, paper_mache_form]
  materials_forbidden: [chrome_polished, mirrored_furniture, neon, high_gloss_lacquer, printed_faux_stone, rgb_lighting]
  sheen: {walls_gu: [2, 10], stone: honed_or_tumbled, wood_gu: [5, 20], metal: aged_bronze_or_matte_black}
  pattern: {max_distinct: 2, scale_mix: [large, none], density_max: 0.18, motifs_allowed: [stone_veining, wood_burl, plaster_mottle, slub_weave], motifs_forbidden: [printed_geometric, stripe_regular, floral_printed]}
  furniture: {silhouette: [organic_curve, rounded, chunky_soft, irregular_edge], leg_base: [thick_plinth, rounded_block, sculpted_pedestal, low_wide], seat_height_mm: [390, 450], visible_floor_ratio_min: 0.42, arms: rolled_soft, skirted_upholstery: optional}
  occupancy: {ratio_target: 0.42, ratio_range: [0.32, 0.52], surface_fill_max: 0.32}
  symmetry: {preference: soft_asymmetry, target: 0.48, strictness: loose}
  layering: {textile_layers: [3, 4], textile_weight: [medium], rug_coverage_min: 0.35, rug_type: [wool_boucle, jute_thick, undyed_pile]}
  plants: {count: [2, 6], species_max: 3, forms: [olive, fiddle_leaf, sculptural_branch, dried_grass], pots: [unglazed, plaster, stone_trough]}
  art_decor: {art_wall_coverage_pct: [4, 12], decor_items_per_m2: [0.18, 0.42], grouping: sculptural_objects_in_threes, negative_space_min_pct: 52}
  lighting: {cct_K: [2400, 3000], layers_min: 3, fixture_types: [plaster_sconce, linen_shade, alabaster_pendant, paper_form], exposed_lamp: false, cri_min: 90, dimming: required}
  ceiling_trim: {ceiling: [lime_plaster, flat_matte, arched_soffit], trim: [rounded_reveal, none, plaster_return], trim_contrast: none}
  floor: {materials: [honed_limestone, wide_plank_pale_oak, micro_cement, terracotta_tile_matte], tone: [pale_warm], gloss_max_gu: 12}
param_overrides:
  - {channel: comp.occupancy_ratio_target, value: 0.42}
  - {channel: comp.color_family_max, value: 4}
  - {channel: comp.pattern_mix_max, value: 2}
  - {channel: comp.symmetry_target, value: 0.48}
  - {channel: mat.sheen_max_gu, value: 12}
  - {channel: mat.texture_variety_min, value: 6}
  - {channel: light.cct_max_K, value: 3000}
  - {channel: plants.count_min, value: 2}
  - {channel: plants.canopy_ratio_min, value: 0.04}
may_relax: [COMP-GRID-* orthogonal-alignment requirements, COLOR-ACC-* saturated-accent minimums, COMP-SYM-* symmetry targets]
never_relaxes: [safety.* at any severity, accessibility.ada when the user has flagged a need, ergonomics hard minimums, egress and code rules, minimum circulation path widths]
```

#### Why — tradition
Modern organic is a 2020s interiors label rather than a school. It borrows the curved, non-orthogonal
forms of mid-century organic modernism — Aalto's bent plywood, Saarinen's pedestal shapes — and puts
them into a low-chroma natural-material palette: travertine, lime plaster, bouclé, unglazed ceramic.
Trade usage is unsettled and overlaps heavily with Japandi and "warm minimalism", which is why
confidence is set to contested.

#### Why — psychology / physiology
Two real threads. Curvature preference is a genuine finding in visual perception research: people
tend to prefer curved over sharply angular contours, other things equal, although the effect is modest
and context-dependent. And the natural-material and live-plant components connect to biophilic design
research — the Terrapin Bright Green *14 Patterns of Biophilic Design* report (Browning, Ryan and
Clancy, 2014) codifies "material connection with nature" and "presence of water/plants" as design
patterns. The specific palette bands here carry no evidence.

#### Customer insight
Modern organic keeps things calm and pale, but swaps hard edges for soft ones: rounded tables, curvy
ceramics, plaster and stone you want to touch. Instead of adding colour, add texture — bouclé, raw
linen and unglazed pottery in the same sandy family. One big plant finishes it.

#### Failure modes / when to skip
Rounded and irregular pieces waste corner space; in rooms under about 9 m² (100 ft²) or with tight
circulation, the curved-silhouette count should drop rather than force an oversized round table. Honed
stone floors can be slippery when wet — in `ROOMS_WET` the `safety.water` slip rules override the
finish spec. Very low-chroma schemes can be hard to navigate for low-vision users; contrast
requirements from `accessibility.*` win.

---

### STY-PACK-009 — Transitional style pack

```yaml
id: STY-PACK-009
title: Transitional style pack
system: style.transitional
group: pack
version: 1
status: active
applies_to:
  rooms: [ROOMS_ALL_INTERIOR]
  objects: [seating.*, tables.*, sleep.*, storage.*, softgoods.*, decor.*, lighting.*]
  requires_features: []
scope: room_composition
severity: low
confidence: contested
evidence_class: aesthetic
belief_gated: false
predicate: |
  require stylePackActive("transitional")
  let trad = count(obj in room.objects where "traditional" in styleAffiliationOf(obj))
  let mod  = count(obj in room.objects where "contemporary" in styleAffiliationOf(obj))
  assert min(trad, mod) / max(trad, mod, 1) >= p.trans_blend_balance_min
  assert colorCount(room, delta_e_merge=10) <= p.trans_color_family_max
  assert symmetryScore(room, axis=primary) >= p.trans_symmetry_min
  assert patternCount(room) <= p.trans_pattern_mix_max
  assert max(chromaOf(c) forEach c in room.colors where coverageOf(c) > 0.15) <= p.trans_field_chroma_max
  prefer countOf(trim.profiled, room) >= 1
  penalize countOf(motif.high_period_specific, room) > p.trans_period_motif_max, weight=2
params:
  - key: trans_blend_balance_min
    default: 0.45
    range: [0.25, 0.80]
    unit: ratio
    user_editable: true
    rationale: The whole definition of the pack: neither the traditional nor the modern side may dominate beyond this ratio.
  - key: trans_color_family_max
    default: 4
    range: [3, 6]
    unit: count
    user_editable: true
    rationale: Blending eras only works if the palette holds still.
  - key: trans_symmetry_min
    default: 0.60
    range: [0.40, 0.85]
    unit: score_0_1
    user_editable: true
    rationale: Inherits traditional symmetry discipline; this is what keeps the blend from reading accidental.
  - key: trans_pattern_mix_max
    default: 3
    range: [2, 5]
    unit: count
    user_editable: true
    rationale: More pattern than contemporary, less than traditional.
  - key: trans_field_chroma_max
    default: 30
    range: [15, 55]
    unit: chroma_C_star
    user_editable: true
    rationale: Large planes stay quiet so the era-mixing is the only thing happening.
  - key: trans_period_motif_max
    default: 2
    range: [0, 5]
    unit: count
    user_editable: true
    rationale: Strongly period-specific motifs (toile, damask, Deco sunburst) must stay occasional.
score:
  weight: 3
  curve: gaussian
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: seating.armchair.classic_silhouette
    transform: {position: opposite_contemporary_sofa, upholstery: plain_neutral}
    cost: high
    effort: medium
    reversible: true
    copy: Put one classically shaped armchair opposite your modern sofa, in a plain fabric. The contrast between shapes is the point.
  - rank: 2
    action: swap_object
    target: lighting.pendant.*
    transform: {to_variant: classic_form_in_modern_finish}
    cost: medium
    effort: medium
    reversible: true
    copy: A traditional lantern shape in a matte-black or brass finish bridges both halves in one object.
  - rank: 3
    action: set_param
    target: COMP-SYM-*
    transform: {symmetry_target: 0.65}
    cost: free
    effort: low
    reversible: true
    copy: Keep the layout fairly symmetrical — matching lamps, a centred sofa. Symmetry is what stops mixed eras looking like a mistake.
  - rank: 4
    action: regroup_decor
    target: decor.*
    transform: {reduce_period_motifs_to: p.trans_period_motif_max}
    cost: free
    effort: low
    reversible: true
    copy: Pull back to two strongly "period" pieces. Any more and the room tips fully traditional.
conflicts_with: [STY-COH-041, STY-PACK-003]
supersedes: []
requires_rules: [STY-COH-041]
tags: [style_pack, transitional, blend, bridge_pack, symmetry]
localization_notes: Primarily a North American trade term; less used in UK/EU practice.
style_pack:
  id: transitional
  aliases: [updated_classic, modern_traditional]
  lineage: "North American design-trade and real-estate term for a deliberate blend of traditional silhouettes with contemporary restraint. No lineage, no theorist, no period: it is defined operationally as a controlled mix, which is exactly how it is encoded here."
  palette_60: {role: walls_ceiling, hues: [greige, warm_white, soft_grey], lrv: [58, 80], examples_hex: ["#EDE9E2", "#DEDAD2", "#CDCAC3"]}
  palette_30: {role: upholstery_and_wood, hues: [taupe, mid_brown, navy_muted], lrv: [22, 50], examples_hex: ["#8F8577", "#6B5A48", "#3C4759"]}
  palette_10: {role: accent, hues: [black, brass, one_muted_hue], lrv: [6, 32], examples_hex: ["#1C1C1C", "#8C6B34", "#5A6E63"]}
  color_family_max: 4
  materials_required: [painted_millwork, one_wood, one_metal, woven_textile]
  materials_signature: [painted_shaker_panel, linen_slipcover, honed_marble, oil_rubbed_bronze, seagrass, nailhead_trim_sparing]
  materials_forbidden: [gilded_gesso_heavy, neon, rgb_lighting, plastic_laminate_bright, faux_distressed_shabby]
  sheen: {walls_gu: [5, 15], millwork_gu: [20, 40], metal: oil_rubbed_or_satin_brass, stone: honed}
  pattern: {max_distinct: 3, scale_mix: [small, medium, large], density_max: 0.32, motifs_allowed: [stripe, check, geometric_trellis, subtle_damask, plain_texture], motifs_forbidden: [neon_graphic, memphis_squiggle, tropical_oversized]}
  furniture: {silhouette: [classic_form_simplified, squared_with_soft_edge], leg_base: [tapered, turned_simple, skirted_tailored, block], seat_height_mm: [420, 470], visible_floor_ratio_min: 0.42, arms: track_or_rolled, skirted_upholstery: optional}
  occupancy: {ratio_target: 0.48, ratio_range: [0.38, 0.58]}
  symmetry: {preference: symmetrical_with_one_break, target: 0.68, strictness: moderate}
  layering: {textile_layers: [3, 4], textile_weight: [medium], rug_coverage_min: 0.40, rug_type: [muted_persian, wool_solid_bordered, sisal_bound]}
  plants: {count: [1, 3], species_max: 2, forms: [topiary, orchid, leafy_medium], pots: [glazed_ceramic, cachepot]}
  art_decor: {art_wall_coverage_pct: [8, 16], decor_items_per_m2: [0.25, 0.50], grouping: paired_and_centred, negative_space_min_pct: 45}
  lighting: {cct_K: [2700, 3000], layers_min: 4, fixture_types: [classic_lantern_matte, drum_shade_pendant, paired_table_lamps, picture_light], exposed_lamp: false, cri_min: 90, dimming: required}
  ceiling_trim: {ceiling: [flat_painted, simple_coffer, beam_painted], trim: [profiled_but_simple, chair_rail_optional, crown_modest], trim_contrast: low_white_on_soft}
  floor: {materials: [mid_oak_plank, honed_stone, wool_broadloom], tone: [mid], gloss_max_gu: 20}
param_overrides:
  - {channel: comp.symmetry_target, value: 0.68}
  - {channel: comp.color_family_max, value: 4}
  - {channel: comp.pattern_mix_max, value: 3}
  - {channel: comp.era_spread_max_years, value: 150}
  - {channel: comp.occupancy_ratio_target, value: 0.48}
  - {channel: comp.rug_coverage_min, value: 0.40}
  - {channel: light.layer_count_min, value: 4}
may_relax: [STY-COH-041 single-dominant-style requirement (this pack is a sanctioned two-cluster blend), COMP-ERA-* era-consistency penalties within 150 years]
never_relaxes: [safety.* at any severity, accessibility.ada when the user has flagged a need, ergonomics hard minimums, egress and code rules, minimum circulation path widths]
```

#### Why — tradition
Transitional is a North American design-trade and real-estate term for a deliberate blend of
traditional silhouettes with contemporary restraint. It has no lineage, no theorist and no period. That
is not a criticism — it means the honest way to encode it is *operationally*, as a controlled mix
ratio between a traditional cluster and a contemporary cluster, with the palette held still and
symmetry kept high so the mix reads as a decision.

#### Why — psychology / physiology
No direct empirical support; the mechanism is plausible but untested. The plausible account is that
mixing eras raises scene complexity, and symmetry plus a narrow palette restore the coherence that
complexity spends — which matches the general shape of Kaplan and Kaplan's preference framework, where
coherence and complexity both contribute to liking. This pack is also the library's main
conflict-avoidance tool: it is the sanctioned exception to the single-dominant-style rule.

#### Customer insight
Transitional is the safe middle: classic shapes, modern calm. One traditionally shaped armchair facing
a simple modern sofa, quiet walls, and a fairly symmetrical layout. It is the most forgiving pack if
you own a mix of things and do not want to start over.

#### Failure modes / when to skip
If the blend ratio sits below about 0.25 the room is not transitional, it is one style with strays —
the engine should offer to converge rather than score against this pack. Do not use this pack as a
dumping ground for incoherent rooms: STY-COH-041 must still report the second cluster. The symmetry
floor yields to accessibility and circulation.

---

### STY-PACK-010 — Traditional / classic style pack

```yaml
id: STY-PACK-010
title: Traditional / classic style pack
system: style.traditional_classic
group: pack
version: 1
status: active
applies_to:
  rooms: [ROOMS_ALL_INTERIOR]
  objects: [seating.*, tables.*, sleep.*, storage.*, softgoods.*, decor.*, lighting.*]
  requires_features: []
scope: room_composition
severity: low
confidence: expert_consensus
evidence_class: aesthetic
belief_gated: false
predicate: |
  require stylePackActive("traditional_classic")
  assert symmetryScore(room, axis=primary) >= p.trad_symmetry_min
  assert countOf(decor.matched_pair, room) >= p.trad_matched_pair_min
  assert exists f in room.focalCandidates where focalWeight(f) >= p.trad_focal_dominance_min
  assert trimTreatmentOf(room) in [profiled, paneled, crown_and_base, chair_rail]
  assert occupancyRatio(room) >= p.trad_occupancy_min
  assert patternCount(room) >= p.trad_pattern_min and patternCount(room) <= p.trad_pattern_max
  assert dadoHeightRatio(room) between p.trad_dado_ratio_band when trimTreatmentOf(room) == chair_rail
  prefer alignedWithin(centroid(room.primarySofa), room.focalAxis, tol_deg=8)
  penalize countOf(obj where legStyleOf(obj) == hairpin, room) > 0, weight=2
params:
  - key: trad_symmetry_min
    default: 0.72
    range: [0.55, 0.92]
    unit: score_0_1
    user_editable: true
    rationale: Axial symmetry is the governing principle inherited from classical composition.
  - key: trad_matched_pair_min
    default: 2
    range: [0, 6]
    unit: count
    user_editable: true
    rationale: Paired lamps, paired chairs, paired sconces — pairing is how traditional rooms state symmetry.
  - key: trad_focal_dominance_min
    default: 0.35
    range: [0.20, 0.60]
    unit: ratio
    user_editable: true
    rationale: One clearly dominant focal point (fireplace, bed, chimney breast) must exist and win.
  - key: trad_occupancy_min
    default: 0.42
    range: [0.30, 0.60]
    unit: ratio
    user_editable: true
    rationale: Traditional rooms are furnished rooms; under-filling reads as unfinished, not restrained.
  - key: trad_pattern_min
    default: 2
    range: [0, 4]
    unit: count
    user_editable: true
    rationale: Pattern is expected here, unlike the modern packs.
  - key: trad_pattern_max
    default: 4
    range: [2, 7]
    unit: count
    user_editable: true
    rationale: Ceiling before the room reads English country or grandmillennial.
  - key: trad_dado_ratio_band
    default: [0.28, 0.36]
    range: [0.20, 0.45]
    unit: ratio_of_wall_height
    user_editable: true
    rationale: Chair-rail height as a fraction of wall height; classical practice puts it near the lower third.
score:
  weight: 3
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: room.seatingGroup
    transform: {align_to: room.focalAxis, symmetrize: true, tol_deg: 5}
    cost: free
    effort: low_physical
    reversible: true
    copy: Centre the seating on the fireplace or window and match what sits either side. Symmetry is the backbone of this look and it is free.
  - rank: 2
    action: add_object
    add: lighting.table.lamp_pair
    transform: {count: 2, position: flanking_primary_seat_or_bed, identical: true}
    cost: medium
    effort: low
    reversible: true
    copy: Add a matching pair of lamps either side of the sofa or bed. Pairs are the quickest way to make a room read classic.
  - rank: 3
    action: add_object
    add: decor.trim.crown_and_base
    transform: {profile: simple_classical, paint: white_semi_gloss}
    cost: medium
    effort: high_physical
    reversible: false
    copy: Proper cornice and skirting give the walls the frame this style depends on — more effect per pound than new furniture.
  - rank: 4
    action: add_textile
    add: softgoods.curtain.pinch_pleat_lined
    transform: {length: to_floor_with_break, mount: above_opening_min_m: 0.15}
    cost: medium
    effort: medium
    reversible: true
    copy: Full-length lined curtains hung above the window frame make the room look taller and properly dressed.
conflicts_with: [STY-PACK-002, STY-PACK-003, STY-PACK-016, STY-PACK-032]
supersedes: []
requires_rules: [STY-COH-041]
tags: [style_pack, traditional, symmetry, matched_pairs, millwork, focal_point]
localization_notes: Classical proportion conventions here are European-derived; equivalent non-European classical systems are handled in their own packs.
style_pack:
  id: traditional_classic
  aliases: [classic, formal_traditional, georgian_adjacent]
  lineage: "European classical decorating convention descending from Renaissance and Georgian practice via nineteenth- and twentieth-century revivals: axial symmetry, a hierarchy of mouldings (base, dado, cornice), matched pairs, one dominant focal point. Codified by pattern books and trade practice rather than one text."
  palette_60: {role: walls, hues: [cream, soft_gold, sage, dusty_blue, greige], lrv: [45, 72], examples_hex: ["#E6DFCB", "#DCD6C2", "#C6CCC0"]}
  palette_30: {role: wood_and_upholstery, hues: [mahogany, walnut, deep_green, navy], lrv: [10, 38], examples_hex: ["#52302A", "#4A3728", "#2F4034"]}
  palette_10: {role: accent, hues: [gilt, crimson, black], lrv: [8, 40], examples_hex: ["#A5803A", "#7A2B2B", "#1A1A1A"]}
  color_family_max: 5
  materials_required: [painted_millwork, dark_hardwood, woven_or_printed_textile, one_polished_metal]
  materials_signature: [mahogany, walnut, brass_polished, damask, needlepoint, marble_mantel, gilt_frame, wool_persian_rug, crystal]
  materials_forbidden: [exposed_conduit, scaffold_board, neon, rgb_lighting, plastic_laminate_bright, raw_concrete_large_planes]
  sheen: {walls_gu: [8, 25], millwork_gu: [35, 70], metal: polished_brass_or_bronze, stone: polished_marble}
  pattern: {max_distinct: 4, scale_mix: [small, medium, large], density_max: 0.45, motifs_allowed: [damask, stripe, plaid, floral_traditional, needlepoint, acanthus], motifs_forbidden: [memphis_squiggle, neon_graphic, tropical_oversized_modern]}
  furniture: {silhouette: [curved_classical, rolled, wingback, pedestal], leg_base: [turned, cabriole, reeded, skirted, bun_foot], seat_height_mm: [430, 480], visible_floor_ratio_min: 0.35, arms: rolled_or_scrolled, skirted_upholstery: encouraged}
  occupancy: {ratio_target: 0.52, ratio_range: [0.42, 0.62], surface_fill_max: 0.55}
  symmetry: {preference: axial_symmetry_required, target: 0.80, strictness: strict}
  layering: {textile_layers: [4, 6], textile_weight: [medium, heavy], rug_coverage_min: 0.55, rug_type: [persian, aubusson, wool_bordered]}
  plants: {count: [1, 3], species_max: 2, forms: [topiary_clipped, orchid, cut_flowers_in_urn], pots: [cachepot, urn, jardiniere]}
  art_decor: {art_wall_coverage_pct: [12, 25], decor_items_per_m2: [0.40, 0.80], grouping: symmetrical_pairs_around_focal, negative_space_min_pct: 30, art_hang: centred_with_picture_light}
  lighting: {cct_K: [2400, 2900], layers_min: 5, fixture_types: [chandelier, wall_sconce_pair, table_lamp_pair, picture_light, candle], exposed_lamp: candle_bulb_allowed, cri_min: 90, dimming: required}
  ceiling_trim: {ceiling: [coffered, ceiling_rose, flat_with_crown], trim: [crown_and_base, paneled_dado, chair_rail, architrave], trim_contrast: high_white_or_deeper_tone}
  floor: {materials: [dark_hardwood_parquet, marble_tile, wool_broadloom], tone: [mid_to_dark], gloss_max_gu: 40}
param_overrides:
  - {channel: comp.symmetry_target, value: 0.80}
  - {channel: comp.symmetry_strictness, value: strict}
  - {channel: comp.occupancy_ratio_target, value: 0.52}
  - {channel: comp.surface_fill_max, value: 0.55}
  - {channel: comp.pattern_mix_max, value: 4}
  - {channel: comp.color_family_max, value: 5}
  - {channel: comp.focal_point_max, value: 1}
  - {channel: comp.rug_coverage_min, value: 0.55}
  - {channel: comp.art_wall_coverage_target, value: 0.18}
  - {channel: light.layer_count_min, value: 5}
  - {channel: soft.textile_layer_min, value: 4}
  - {channel: mat.sheen_max_gu, value: 70}
may_relax: [COMP-EMPTY-* negative-space minimums, COMP-FILL-* surface-fill ceilings, MAT-SHEEN-* gloss ceilings on millwork, COMP-PATTERN-* pattern-count ceilings]
never_relaxes: [safety.* at any severity, accessibility.ada when the user has flagged a need, ergonomics hard minimums, egress and code rules, minimum circulation path widths — in particular, the higher occupancy target may never push a walkway below its minimum clear width]
```

#### Why — tradition
This pack encodes the European classical decorating convention that descends from Renaissance and
Georgian practice through the nineteenth- and twentieth-century revivals: axial symmetry, a hierarchy
of mouldings (skirting, dado, cornice), matched pairs flanking a single dominant focal point, and
pattern used confidently. It was codified by pattern books and trade practice rather than one text,
which is why the doctrine is stated here as measurable proportions rather than as a citation.

#### Why — psychology / physiology
Bilateral symmetry detection is fast and pre-attentive in human vision, and symmetric arrangements are
reliably rated as more ordered — that part is well supported. Whether symmetric rooms are *better to
live in* is not established, and the specific chair-rail proportion band is convention, not evidence.
There is a real functional cost to note: the higher occupancy target pushes toward narrower walkways,
which is exactly where this pack must lose to circulation and falls-risk rules.

#### Customer insight
Traditional rooms are built on symmetry and pairs: seating centred on the fireplace, matching lamps
either side, proper skirting and cornice framing the walls. The free move is to centre and pair what
you already own — most rooms improve immediately. Fuller is correct here; empty reads unfinished.

#### Failure modes / when to skip
The occupancy minimum must never be met by narrowing a circulation route below its minimum clear
width; circulation and `safety.senior_falls` win and the engine must say so. Skip the strict-symmetry
target in non-rectangular rooms and in rooms whose only focal point is a television. Heavy layered
textiles raise dust load — for users who flagged respiratory sensitivity, `safety.air_quality` caps
the layering count.

---
