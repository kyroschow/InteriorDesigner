# Feng Shui — Remedies & Cures Catalog

<!-- library-file: v1 | system(s): feng_shui.form_school, feng_shui.btb_western, feng_shui.five_elements, feng_shui.compass.flying_stars, psych.*, safety.*, product.parameter | rule-id-prefixes: FS-CURE | author-agent: fs-remedies-catalog -->

## Scope

This file is the **action library** the engine proposes from. Every other feng shui file in
`10-systems/` *diagnoses*; this file *prescribes*. It defines (a) the remedy record contract —
cost tier, effort, reversibility, rental safety — (b) the gating rules that decide **when the
engine may propose a given cure at all**, and (c) one rule per classical and modern cure
family: mirrors, crystals, metal and sound, plants, water, light, colour, shape and material,
screens and textiles, hardware and maintenance, stabilising weights, beam cures, poison-arrow
softening, scent, and symbolic/talismanic objects.

Three commitments run through the whole file:

1. **A cure is only ever proposed against a diagnosed finding.** The app is not a shop.
2. **Symbolic cures are presented as optional cultural practice, never as mechanism.** The only
   empirically supported pathway for a symbolic cure is the *agency / ritual / perceived-control*
   pathway documented in `FS-CURE-007`, and that pathway is honest about being about the person,
   not about the object.
3. **Safety wins.** Several classical cures (mirrors, salt-water jars, spiky plants, water
   features, heavy stabilising objects, bed canopies) carry real physical hazards. Where a cure
   collides with a `safety.*` blocking rule, the cure is suppressed and the user is told why.

### Conventions used in this file (extensions to SPEC-CONTRACT v1.0)

- `applies_to.rooms: [any]` — the token `any` means *all* RoomType values in §3 of the contract.
  Used only for framework rules that govern remedy emission itself.
- `cost:` uses the four product cost tiers the catalog is ranked by, rather than the contract's
  loose `free|low|...`: **`free`** (no spend), **`under_50`** (≤ USD 50 / ≈ EUR 45),
  **`under_250`** (≤ USD 250), **`renovation`** (trade labour, paint, plumbing, joinery, or
  > USD 250). Mapping to the contract enum: `free→free`, `under_50→low`, `under_250→medium`,
  `renovation→high`. Flagged in `OPEN_QUESTIONS`.
- `effort:` `none | low | moderate | high_physical | pro_trade`.
- Each remedy carries two extra keys beyond the contract shape: **`rental_safe:`** (bool — true
  only if the remedy requires no drilling, no paint, no plumbing, no electrical alteration and
  no permanent adhesive) and **`undo_cost:`** (`free | under_50 | under_250 | renovation` — what
  it costs to put the room back). `FS-CURE-002` makes both mandatory.
- `p.<key>` in predicates refers to that rule's own `params` block.

## Rule count: 65

## Rules

### Remedy emission requires a diagnosed cause

```yaml
id: FS-CURE-001
title: No cure without a diagnosed cause
system: product.parameter
group: remedy_framework
version: 1
status: active
applies_to:
  rooms: [any]
  objects: []
  requires_features: []
scope: room_composition
severity: high
confidence: expert_consensus
evidence_class: mixed
belief_gated: false
predicate: |
  forEach rem in proposedRemedies(room):
    let causes = rem.answers_rules
    assert causes != []
    assert exists f in findings(room) where f.rule_id in causes and f.severity != "none"
    assert f.confidence != "folklore" or p.allow_folklore_driven_cures == true
    forbid rem.origin == "catalog_browse" and p.allow_unprompted_offers == false
params:
  - key: allow_unprompted_offers
    default: false
    range: [false, true]
    unit: bool
    user_editable: false
    rationale: "Blocks the engine from surfacing a purchasable cure that no finding asked for. Product-integrity switch, not a user preference."
  - key: allow_folklore_driven_cures
    default: false
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: "Some users explicitly want folklore-tier practice. Off by default so the default experience only acts on tradition-tier or better findings."
  - key: max_cures_per_finding
    default: 3
    range: [1, 6]
    unit: count
    user_editable: true
    rationale: "Caps the alternatives shown per problem so the user chooses rather than shops."
score:
  weight: 6
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: suppress_remedy
    target: any
    transform: {drop_if: "answers_rules == [] or no_matching_finding"}
    cost: free
    effort: none
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "We only suggest a change when we have actually found something in your room that it fixes."
conflicts_with: []
supersedes: []
requires_rules: []
tags: [framework, product_integrity, remedy_gating, signature_rule]
localization_notes: Applies in all locales; cost tiers need per-market currency conversion.
```

#### Why — tradition

Classical feng shui practice is diagnostic before it is prescriptive: a `luo pan` reading, a
form-school survey of the surroundings, and a facing/sitting determination all precede any
`hua sha` (transforming the harmful) prescription. Both classical lineages (San He, San Yuan)
and the modern BTB (Black Sect Tantric Buddhism) school teach that a cure applied without a
diagnosis is at best inert and at worst introduces a new imbalance — the frequently repeated
practitioner warning against "cure clutter." Nothing in the tradition supports buying objects
speculatively.

#### Why — psychology / physiology

There is no study of "cure clutter" as such, so: `No direct empirical support; mechanism is
plausible but untested.` The plausible mechanism is twofold. First, accumulating objects that
each demand interpretation raises visual and cognitive load in a space the occupant cannot
easily edit. Second, an app that recommends purchases without a stated cause trains users to
attribute outcomes to objects rather than to their own choices — which undercuts exactly the
perceived-control pathway that `FS-CURE-007` shows is the one documented benefit here.

#### Customer insight

You will never see us suggest something to buy just because it exists. Every idea in your plan
points back to a specific thing we noticed in your room, and you can tap it to see what that
was.

#### Failure modes / when to skip

Skip in "explore/learn" mode, where the user has explicitly asked to browse the cure catalog for
education — but in that mode the engine must not write remedies into the user's plan or cart.
Also skip for the maintenance cures (`FS-CURE-054`, `FS-CURE-055`, `FS-CURE-056`), which are
always allowed to fire because they are repairs, not additions.

---

### Every remedy declares cost, effort, reversibility and rental safety

```yaml
id: FS-CURE-002
title: Remedy record must declare cost tier, effort, reversibility and rental safety
system: product.parameter
group: remedy_framework
version: 1
status: active
applies_to:
  rooms: [any]
  objects: []
  requires_features: []
scope: room_composition
severity: blocking
confidence: code_mandated
evidence_class: aesthetic
belief_gated: false
predicate: |
  forEach rem in allRemedies(library):
    assert rem.cost in ["free","under_50","under_250","renovation"]
    assert rem.effort in ["none","low","moderate","high_physical","pro_trade"]
    assert typeOf(rem.reversible) == bool
    assert typeOf(rem.rental_safe) == bool
    assert rem.undo_cost in ["free","under_50","under_250","renovation"]
    assert rem.copy != null and wordCount(rem.copy) <= p.max_copy_words
    assert rem.rental_safe == false or (not rem.requires_drilling and not rem.requires_paint and not rem.requires_plumbing and not rem.requires_electrical)
params:
  - key: max_copy_words
    default: 40
    range: [15, 70]
    unit: count
    user_editable: false
    rationale: "Keeps in-app remedy copy scannable on a phone card."
  - key: cost_tier_currency
    default: USD
    range: [USD, EUR, GBP, INR, AUD, CAD, JPY, CNY, BRL, ZAR]
    unit: iso4217
    user_editable: true
    rationale: "Tier boundaries are absolute amounts and must be localised, not naively converted."
  - key: tier_under_50_ceiling
    default: 50
    range: [20, 120]
    unit: currency
    user_editable: true
    rationale: "Impulse-purchase ceiling; varies strongly by market."
  - key: tier_under_250_ceiling
    default: 250
    range: [100, 600]
    unit: currency
    user_editable: true
    rationale: "Considered-purchase ceiling above which the app should ask before proposing."
score:
  weight: 1
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: reject_remedy_record
    target: any
    transform: {fail_build: true}
    cost: free
    effort: none
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "Internal — a cure with missing cost, effort or rental-safety metadata must not ship."
conflicts_with: []
supersedes: []
requires_rules: [FS-CURE-001]
tags: [framework, schema, cost, rental, build_time_check]
localization_notes: Tier ceilings must be set per market at build time, not converted at runtime.
```

#### Why — tradition

Traditional practice already ranks cures by weight: a practitioner will reach for relocation
and removal before "hanging" cures, and for hanging cures before structural work. The classical
distinction between `hua` (transforming/dissolving with a light touch), `dang` (blocking), and
`gai` (altering the building) is essentially a cost-and-permanence ladder. This rule just makes
that ladder machine-readable.

#### Why — psychology / physiology

Choice architecture research consistently finds that people accept a recommendation more readily
when its cost and reversibility are stated up front, and that irreversibility raises decision
anxiety. `No direct empirical support` for this exact schema, but the mechanism — reducing
perceived risk so the user will actually act — is the same one that makes the agency pathway in
`FS-CURE-007` work. Hidden cost is the fastest way to make a user abandon a plan.

#### Customer insight

Every suggestion tells you what it costs, how hard it is, whether you can undo it, and whether
it is safe to do in a rental. No surprises after you have already moved the sofa.

#### Failure modes / when to skip

Never skipped — this is a build-time validation, not a runtime scoring rule. Cost tiers are
approximations and must be labelled as such in the UI; a mirror can be free (already owned) or
a renovation (mirrored wall), so the tier belongs to the *remedy*, not to the object type.

---

### Rental-safe filtering

```yaml
id: FS-CURE-003
title: Suppress drilling, paint and plumbing cures for renters
system: product.parameter
group: remedy_framework
version: 1
status: active
applies_to:
  rooms: [any]
  objects: []
  requires_features: []
scope: room_composition
severity: high
confidence: expert_consensus
evidence_class: aesthetic
belief_gated: false
predicate: |
  let tenure = tenancyClass(user)
  forEach rem in proposedRemedies(room):
    if tenure in ["rental","short_term","dorm","student_housing"]:
      assert rem.rental_safe == true or p.renter_strictness == "permissive"
      if rem.rental_safe == false and p.renter_strictness == "warn":
        prefer alternativeOf(rem, requires: {rental_safe: true})
    if tenure == "short_term":
      assert rem.cost in ["free","under_50"]
      assert rem.reversible == true
params:
  - key: renter_strictness
    default: strict
    range: [strict, warn, permissive]
    unit: enum
    user_editable: true
    rationale: "Some renters have landlord permission to paint or drill; let them opt up."
  - key: allow_command_strip_mounting
    default: true
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: "Removable adhesive hangers make many wall cures rental-safe, but they have low weight limits and can pull paint."
  - key: adhesive_mount_max_kg
    default: 3.5
    range: [0.5, 7.0]
    unit: kg
    user_editable: true
    rationale: "Above this, adhesive hangers fail. Mirrors and shelves must then be floor-standing or leaning-and-strapped."
score:
  weight: 7
  curve: step
  partial_credit: true
remedies:
  - rank: 1
    action: substitute_remedy
    target: any
    transform: {prefer_variant: rental_safe, examples: [leaning_mirror, tension_rod_curtain, freestanding_screen, plug_in_lamp, area_rug, peel_and_stick_removable]}
    cost: free
    effort: none
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "Because you are renting, we swapped this for a version that needs no drilling, paint or plumbing."
  - rank: 2
    action: annotate_remedy
    target: any
    transform: {badge: "landlord permission needed", show_undo_cost: true}
    cost: free
    effort: none
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "This one needs your landlord's okay. Here is what it would cost to put back."
conflicts_with: []
supersedes: []
requires_rules: [FS-CURE-002]
tags: [framework, rental, renter, reversibility, signature_rule]
localization_notes: Tenancy norms vary widely; in some markets minor drilling is normal and paint is expected to be restored.
```

#### Why — tradition

Feng shui is unusually well-suited to renters because most of its canonical cures are additive
and portable — a mirror, a plant, a chime, a screen, a rug, a lamp. Practitioners across both
classical and BTB schools routinely prescribe for apartments precisely by choosing the light-touch
`hua` cures over building alteration. The tradition itself therefore supports a rental-safe
default rather than resisting it.

#### Why — psychology / physiology

`No direct empirical support` for a renter-specific effect, but the relevant documented mechanism
is the one in `FS-CURE-007`: the benefit of environmental intervention runs through perceived
control, and a recommendation the user cannot legally execute produces the opposite — a reminder
of constraint. Knight and Haslam (2010, *Journal of Experimental Psychology: Applied*) found the
wellbeing and productivity gains came specifically from people being allowed to arrange their own
space, not from the decorations themselves.

#### Customer insight

Renting? We keep to fixes you can do with no drill, no paint and no plumber, and that come with
you when you move.

#### Failure modes / when to skip

Skip when the user has set `renter_strictness: permissive` or recorded landlord consent. Do not
apply to safety-blocking remediation: if a `safety.*` blocking rule requires anchoring a dresser
to a wall stud, renting is not a reason to suppress it — surface the landlord conversation
instead (see `FS-CURE-057`).

---

### Remedy ladder — subtract, relocate, reorient, then add

```yaml
id: FS-CURE-004
title: Remedy ladder prefers removal and relocation over purchase
system: product.parameter
group: remedy_framework
version: 1
status: active
applies_to:
  rooms: [any]
  objects: []
  requires_features: []
scope: room_composition
severity: medium
confidence: expert_consensus
evidence_class: aesthetic
belief_gated: false
predicate: |
  forEach f in findings(room):
    let cures = remediesFor(f)
    assert sortedBy(cures, key: ladderRank) == cures
    assert ladderRank(cures[0]) <= p.max_first_offer_rank
  where ladderRank(rem) =
     1 if rem.action in ["remove_object","declutter","repair_object"]
     2 if rem.action in ["move_object","rotate_object","swap_objects"]
     3 if rem.action in ["reassign_room_function","change_primary_door"]
     4 if rem.action in ["add_object"] and userOwns(rem.add)
     5 if rem.action in ["add_object"] and rem.cost in ["under_50"]
     6 if rem.action in ["add_object"] and rem.cost in ["under_250"]
     7 if rem.action in ["change_finish","add_feature","structural_change"]
params:
  - key: max_first_offer_rank
    default: 4
    range: [1, 7]
    unit: rank
    user_editable: true
    rationale: "The first thing we show must be free or use something the user already owns, unless they relax this."
  - key: assume_user_owns_inventory
    default: true
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: "If the user has catalogued their existing objects, prefer re-using them over buying an equivalent."
  - key: show_paid_alternative_always
    default: true
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: "Some users want the shortcut; keep the paid option visible but never first."
score:
  weight: 5
  curve: linear
  partial_credit: true
remedies:
  - rank: 1
    action: reorder_remedies
    target: any
    transform: {sort_by: ladderRank, tiebreak: [reversible_desc, effort_asc]}
    cost: free
    effort: none
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "We show you the free fix first, then the cheap one, then the one that needs a trade."
conflicts_with: []
supersedes: []
requires_rules: [FS-CURE-002]
tags: [framework, ordering, cost, reuse]
localization_notes: none
```

#### Why — tradition

The oldest and most consistently taught feng shui cure is subtraction: clear the blockage, open
the path, remove the broken thing. Practitioners in both classical and BTB lineages describe
moving an object as preferable to adding one, because an added cure introduces its own element,
shape and mass into the room and must itself be reasoned about. The "hang a crystal" reflex is a
modern retail phenomenon, not a classical first resort.

#### Why — psychology / physiology

`No direct empirical support` for the ladder itself. The plausible mechanism is behavioural: the
probability a user completes a recommendation falls sharply with its cost, effort and delay, so a
free, immediate action has a far higher expected effect than a better cure that never happens.
This is the standard friction argument in behaviour-change design, and it is why the engine
optimises for *executed* remedies rather than ideal ones.

#### Customer insight

The best fix is usually free. We start with things you can move, clear or repair today, and only
suggest buying something when moving things genuinely will not solve it.

#### Failure modes / when to skip

Skip the ladder when a higher-tier remedy is the only one that satisfies a `blocking` safety rule
— safety does not wait for the cheap option. Also relax for users in "new build / empty room"
mode, where there is nothing to subtract and `add_object` legitimately ranks first.

---

### Cure-count cap per room

```yaml
id: FS-CURE-005
title: Cap simultaneous cures per room to avoid cure clutter
system: product.ux
group: remedy_framework
version: 1
status: active
applies_to:
  rooms: [any]
  objects: []
  requires_features: []
scope: room_composition
severity: medium
confidence: expert_consensus
evidence_class: mixed
belief_gated: true
predicate: |
  let active = countOf(objects where isCureObject(target) == true, room)
  let proposed = countOf(proposedRemedies(room) where action == "add_object")
  assert active + proposed <= p.max_cure_objects_per_room
  assert proposed <= p.max_new_cures_per_session
  assert occupancyRatio(room) + addedFootprintRatio(proposedRemedies(room)) <= p.max_occupancy_after_cures
  prefer distinct(elementOf(each cure)) over repeated(elementOf(each cure))
params:
  - key: max_cure_objects_per_room
    default: 5
    range: [2, 12]
    unit: count
    user_editable: true
    rationale: "Beyond roughly five deliberate cure objects a room reads as a shrine rather than a home, and each new object dilutes attention."
  - key: max_new_cures_per_session
    default: 3
    range: [1, 8]
    unit: count
    user_editable: true
    rationale: "Keeps a session's task list finishable, which raises completion rates."
  - key: max_occupancy_after_cures
    default: 0.55
    range: [0.35, 0.75]
    unit: ratio
    user_editable: true
    rationale: "Floor-area occupancy ceiling so cures never make a room feel crowded."
score:
  weight: 5
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: defer_remedy
    target: any
    transform: {move_to: "next_phase", keep_top_n: 3, rank_by: severity_desc}
    cost: free
    effort: none
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "We are holding the rest of the list for later. Three changes at a time is plenty."
  - rank: 2
    action: remove_object
    target: decor.*
    transform: {select: lowest_severity_cure_object}
    cost: free
    effort: low
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "You already have several fix-it objects here. Retiring the one doing the least will make the others count more."
conflicts_with: []
supersedes: []
requires_rules: [FS-CURE-001, FS-CURE-004]
tags: [framework, clutter, ux, restraint, signature_rule]
localization_notes: none
```

#### Why — tradition

Experienced practitioners in both classical and BTB lineages warn against stacking cures: a room
crowded with crystals, coins, chimes and figurines is described as noisy or "over-cured," and the
recommended response is to remove most of them and keep the one that addresses the actual
diagnosis. The doctrine of `qi` flow is itself an argument against obstruction, and cure objects
are objects.

#### Why — psychology / physiology

There is genuine evidence that visual clutter degrades attention and raises perceived stress —
the broader clutter literature links household clutter to lower subjective wellbeing and to
reduced ability to focus, though effect sizes are modest and mostly correlational. `No direct
empirical support` for a specific threshold of five. The honest mechanism is competition for
visual attention plus the fact that a room full of remedies is a room full of reminders of the
problem.

#### Customer insight

More cures is not more feng shui. A few well-chosen changes do far more than a shelf full of
objects — and they leave your room looking like yours.

#### Failure modes / when to skip

Skip the cap for collectors and for `prayer_altar_room` / `home_altar_nook`, where a dense
arrangement of symbolic objects is the room's declared purpose. Also relax for large
`great_room` and `open_plan_combined` spaces, where the cap should scale with area rather than
be a flat count.

---

### Safety and accessibility precedence over any cure

```yaml
id: FS-CURE-006
title: No cure may violate a blocking safety or accessibility rule
system: safety.egress
group: remedy_framework
version: 1
status: active
applies_to:
  rooms: [any]
  objects: []
  requires_features: []
scope: room_composition
severity: blocking
confidence: code_mandated
evidence_class: empirical
belief_gated: false
predicate: |
  forEach rem in proposedRemedies(room):
    let after = applyHypothetically(rem, room)
    forbid exists v in violations(after) where v.severity == "blocking"
    forbid pathWidth(after.egressPath) < p.min_egress_path_m
    forbid doorSwingClear(after.primaryDoor) == false
    if accessibilityNeeded(user):
      forbid turningCircle(after.clearFloor, p.turning_circle_m) == false
    assert explainSuppression(rem) == true
params:
  - key: min_egress_path_m
    default: 0.900
    range: [0.750, 1.200]
    unit: m
    user_editable: false
    jurisdiction_varies: true
    rationale: "Clear circulation width retained after a cure is placed. Names no code number; IRC/IBC and NBC-India differ, and local authority governs."
  - key: turning_circle_m
    default: 1.500
    range: [1.220, 1.700]
    unit: m
    user_editable: false
    jurisdiction_varies: true
    rationale: "Wheelchair turning space preserved after a cure. ADA and ISO 21542 family values differ; verify locally."
  - key: always_explain_suppression
    default: true
    range: [false, true]
    unit: bool
    user_editable: false
    rationale: "Product requirement — when a belief rule loses to a safety rule the user must be told."
score:
  weight: 10
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: suppress_remedy
    target: any
    transform: {reason: blocking_safety_conflict, surface_message: true}
    cost: free
    effort: none
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "We skipped a traditional fix here because it would have narrowed your way out of the room. Safety comes first, and we would rather tell you than quietly drop it."
  - rank: 2
    action: substitute_remedy
    target: any
    transform: {prefer_variant: wall_mounted_or_zero_footprint}
    cost: under_50
    effort: low
    reversible: true
    rental_safe: false
    undo_cost: under_50
    copy: "Here is a version that hangs on the wall instead of standing on the floor, so your path stays clear."
conflicts_with: []
supersedes: []
requires_rules: []
tags: [framework, safety, precedence, egress, accessibility, signature_rule]
localization_notes: Clearance minimums are jurisdiction-dependent; never hard-code a code citation.
```

#### Why — tradition

Feng shui's own logic aligns here more often than it conflicts: blocked doorways, obstructed
paths and cramped circulation are exactly what the tradition calls stagnant or constricted `qi`.
A cure that narrows a corridor to place a floor-standing object is, on the tradition's own terms,
a net loss. Where the tradition genuinely does conflict — a bagua mirror on an egress door, a
water feature in a fire-exit path — the tradition yields.

#### Why — psychology / physiology

This is the strongest evidence tier in the whole file. Egress width, door swing clearance and
turning space are grounded in evacuation research and injury epidemiology, not aesthetics.
Obstructed paths increase evacuation time and trip risk, and reduced clear floor space directly
removes function for wheelchair users. No traditional claim in this file has evidence of
comparable quality.

#### Customer insight

If a traditional fix would block a doorway or make a walkway too tight, we will not suggest it —
and we will say so rather than leave you wondering.

#### Failure modes / when to skip

Never skipped. If the user overrides, the engine must keep the finding visible and must not
score the override as compliant. The one nuance: "blocking" is defined by the `safety.*` and
`accessibility.ada` files, not here — this rule only enforces their precedence.

---

### Agency, ritual and perceived control — the honest mechanism

```yaml
id: FS-CURE-007
title: Frame every cure through agency and intentional action, not through the object
system: psych.territoriality
group: remedy_framework
version: 1
status: active
applies_to:
  rooms: [any]
  objects: []
  requires_features: []
scope: room_composition
severity: advisory
confidence: evidence_moderate
evidence_class: empirical
belief_gated: false
predicate: |
  forEach rem in proposedRemedies(room):
    assert rem.copy_frame in ["you_chose","you_made","you_arranged","you_maintained"]
    forbid rem.copy asserts causalClaim(object -> outcome) where outcome in ["wealth","health","fertility","romance","career","luck"]
    assert rem.rationale_shown includes tradition_face and psychology_face
    prefer rem.user_performs == true over rem.contractor_performs == true
params:
  - key: agency_framing_enabled
    default: true
    range: [false, true]
    unit: bool
    user_editable: false
    rationale: "Core honesty setting. Copy always attributes the benefit to the user's action, never to the object's power."
  - key: prefer_user_executed_remedies
    default: true
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: "Doing it yourself is the part with documented benefit; outsourcing removes the mechanism even when the result looks identical."
  - key: show_evidence_tier_badge
    default: true
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: "Users are entitled to see whether a suggestion is evidence-backed, expert consensus, tradition or folklore."
score:
  weight: 3
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: annotate_remedy
    target: any
    transform: {add_frame: agency, add_badge: evidence_tier, add_checkbox: "I did this"}
    cost: free
    effort: none
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "You are the active ingredient here. Choosing a change and carrying it out is the part with real, measured benefit."
conflicts_with: []
supersedes: []
requires_rules: []
tags: [framework, honesty, agency, placebo, ritual, signature_rule]
localization_notes: Agency framing translates well, but avoid phrasings that read as denying the tradition in cultures where it is lived practice.
```

#### Why — tradition

Every feng shui lineage treats intention (`yi`) as part of the cure; BTB in particular pairs each
physical placement with a stated intention and, in its own religious frame, a blessing. Classical
schools are more materialist about `qi` but still teach that a cure applied carelessly is weak.
The tradition and the evidence therefore converge on an unusual point: *the person doing it
matters*. The app can honour that without endorsing the metaphysics.

#### Why — psychology / physiology

This is the one mechanism in the file with real support. Langer and Rodin (1976, *Journal of
Personality and Social Psychology*) gave nursing-home residents responsibility for decisions and
for caring for a plant; the enhanced-responsibility group was rated as more alert and active, and
the effects persisted at follow-up. Knight and Haslam (2010, *Journal of Experimental Psychology:
Applied*) found workers who were allowed to arrange their own workspace reported higher wellbeing
and performed better than those given an identically decorated space arranged for them. Norton and
Gino (2014, *Journal of Experimental Psychology: General*) found that performing rituals reduced
grief, with increased feelings of control mediating the effect, and Brooks and colleagues (2016,
*Organizational Behavior and Human Decision Processes*) found ritual reduced performance anxiety.
Hobson and colleagues (2018, *Personality and Social Psychology Review*) review this literature.
None of this validates any specific cure; it validates deliberate, self-directed action on your
own environment.

#### Customer insight

Here is the honest version: the strongest evidence is not that a particular object changes your
luck, but that deciding what your home should be like and then actually changing it reliably makes
people feel more in control and more settled. That is yours to keep whichever tradition you follow.

#### Failure modes / when to skip

Never suppress the agency framing, but do soften it for users who have declared the tradition as
religious practice — telling someone their practice "works because of perceived control" can read
as dismissive. In that case show the tradition face first and keep the evidence badge available
rather than prominent.

---

### Symbolic cures labelled as optional cultural practice

```yaml
id: FS-CURE-008
title: Symbolic and talismanic cures must be labelled optional cultural practice
system: product.ux
group: remedy_framework
version: 1
status: active
applies_to:
  rooms: [any]
  objects: [ritual.*, decor.figurine.*, decor.symbol.*, decor.coin.*, decor.amulet.*]
  requires_features: []
scope: room_composition
severity: high
confidence: folklore
evidence_class: traditional
belief_gated: true
predicate: |
  forEach rem in proposedRemedies(room) where symbolSemantics(rem.add) != []:
    assert rem.confidence in ["tradition","folklore"]
    assert rem.badge includes "optional cultural practice"
    assert rem.badge includes "no known physical mechanism"
    forbid rem.severity in ["blocking","high"]
    forbid rem.copy contains claim in ["will bring","guarantees","protects you from","cures","attracts money"]
    assert rem.score_contribution == 0 or p.symbolic_affects_score == true
params:
  - key: symbolic_affects_score
    default: false
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: "By default symbolic cures are advisory and do not move the numeric score, so a user who declines them is not penalised."
  - key: symbolic_cures_visible
    default: true
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: "Users who want only the spatial/ergonomic layer can hide symbolic cures entirely."
  - key: require_explicit_optin
    default: true
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: "Symbolic content appears only after the user has enabled the feng shui belief layer and acknowledged the framing."
score:
  weight: 2
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: annotate_remedy
    target: ritual.*
    transform: {badge: ["optional cultural practice", "no known physical mechanism"], score_weight: 0}
    cost: free
    effort: none
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "This one is tradition and symbolism rather than anything measurable. Lovely if it means something to you, entirely skippable if not."
conflicts_with: []
supersedes: []
requires_rules: [FS-CURE-007]
tags: [framework, honesty, symbolic, folklore, labelling, signature_rule]
localization_notes: In Greater China, Singapore and Malaysia these objects are ordinary domestic culture; the label should read as respectful, not debunking.
```

#### Why — tradition

Symbolic cures — coins, gourds, guardian figures, the three-legged toad, Pi Xiu, the Eight
Auspicious Symbols — come from several different bodies of practice layered onto feng shui over
centuries: Chinese folk religion, Taoist talismanic practice, and (for the Ashtamangala) Tibetan
Buddhism, which entered Western feng shui mainly through the BTB school founded by Thomas Lin
Yun. Classical San He and San Yuan practitioners often regard these objects as folk accretion
rather than feng shui proper. Saying so is more respectful of the tradition than flattening it.

#### Why — psychology / physiology

`No direct empirical support` for any symbolic object producing any outcome by any physical
mechanism, and it is important that the app never implies otherwise. The documented pathway is
the ritual/agency one in `FS-CURE-007`: Norton and Gino (2014) and Brooks and colleagues (2016)
show that performing a ritual can reduce grief and anxiety, with perceived control as the
mediator. That benefit is real and belongs to the practice, not to the object.

#### Customer insight

Some of these are symbols rather than solutions. We will show you where tradition places them and
what they are said to mean, and we will never pretend an ornament changes your finances.

#### Failure modes / when to skip

Hide entirely when `symbolic_cures_visible: false`. Never allow a symbolic remedy to be the only
answer to a `high` or `blocking` finding — if the only cure offered for a diagnosed problem is a
figurine, the diagnosis was not actionable and should be re-examined.

---

### Cultural attribution and the no-talisman-commerce guardrail

```yaml
id: FS-CURE-009
title: Attribute lineage and do not monetise talismans
system: product.ux
group: remedy_framework
version: 1
status: active
applies_to:
  rooms: [any]
  objects: [ritual.*, decor.symbol.*, decor.figurine.*]
  requires_features: []
scope: room_composition
severity: high
confidence: expert_consensus
evidence_class: traditional
belief_gated: false
predicate: |
  forEach rem in proposedRemedies(room) where symbolSemantics(rem.add) != [] or religiousIconClass(rem.add) != "none":
    assert rem.lineage_attribution != null
    assert rem.lineage_attribution names school in ["san_he","san_yuan","xuan_kong","btb","folk_practice","tibetan_buddhist","chinese_folk_religion","modern_western_eclectic"]
    forbid rem.commerce_link == true and p.allow_talisman_commerce == false
    forbid religiousIconClass(rem.add) != "none" and rem.commerce_link == true
    assert rem.copy avoids terms in ["ancient secret","oriental","exotic","mystical east"]
params:
  - key: allow_talisman_commerce
    default: false
    range: [false, true]
    unit: bool
    user_editable: false
    rationale: "The app must not sell or take affiliate revenue on protective or luck objects. Selling a talisman against a fear the app itself surfaced is a straightforward harm."
  - key: show_lineage_notes
    default: true
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: "Naming which school teaches a cure is both honest and genuinely interesting to users."
  - key: religious_icon_commerce
    default: false
    range: [false, true]
    unit: bool
    user_editable: false
    rationale: "Hard off. Devotional imagery is never a product recommendation in this app."
score:
  weight: 2
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: annotate_remedy
    target: ritual.*
    transform: {add_lineage_note: true, strip_commerce_link: true}
    cost: free
    effort: none
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "This comes from a specific school of practice, and we will tell you which one. We do not sell it."
conflicts_with: []
supersedes: []
requires_rules: [FS-CURE-008]
tags: [framework, ethics, cultural_appropriation, commerce, honesty, product_note]
localization_notes: Attribution matters most in markets where feng shui is a living tradition with contested lineages.
```

#### Why — tradition

Feng shui is not one system. San He, San Yuan and Xuan Kong Fei Xing differ on method; BTB
differs on both method and metaphysics and is openly a twentieth-century Western-facing lineage
with Tibetan Buddhist framing. Presenting a mixed bag of cures as "ancient Chinese wisdom"
erases those distinctions and misrepresents all of them. Naming the school is the minimum
scholarly courtesy, and practitioners notice when an app does not.

#### Why — psychology / physiology

Not a psychological rule but a product-ethics one. `No direct empirical support` is the wrong
frame here; the relevant point is a harm model. The app raises a concern ("your bed faces the
door," "the Five Yellow is in your bedroom this year") and then has an opportunity to sell an
object that resolves the concern it created. That structure is the mechanics of fear-based
selling regardless of intent, and the only robust mitigation is to refuse the revenue.

#### Customer insight

We tell you which tradition a suggestion comes from, in its own words. And we do not sell charms
or take a cut if you buy one — if a suggestion is about meaning rather than measurement, you
should hear that from us for free.

#### Failure modes / when to skip

Never skipped. If a partner integration wants to fulfil a cure object, it may be shown for
furniture, lighting, plants, rugs and mirrors, but the object classes matched by
`symbolSemantics` and `religiousIconClass` are permanently excluded from commerce.

---

### Budget envelope and cumulative spend ceiling

```yaml
id: FS-CURE-010
title: Respect the declared budget across the whole cure plan
system: product.parameter
group: remedy_framework
version: 1
status: active
applies_to:
  rooms: [any]
  objects: []
  requires_features: []
scope: whole_home
severity: medium
confidence: expert_consensus
evidence_class: aesthetic
belief_gated: false
predicate: |
  let plan = acceptedRemedies(site) + proposedRemedies(site)
  assert estimatedCost(plan) <= p.plan_budget_ceiling
  assert countOf(plan where cost == "renovation") <= p.max_renovation_items
  if p.plan_budget_ceiling == 0:
    forEach rem in plan: assert rem.cost == "free"
  prefer maximise(sum(severityAddressed(rem)) / estimatedCost(rem))
params:
  - key: plan_budget_ceiling
    default: 150
    range: [0, 10000]
    unit: currency
    user_editable: true
    rationale: "Total spend the engine may propose across the plan. Zero is a valid and well-supported mode — most high-severity feng shui findings have a free remedy."
  - key: max_renovation_items
    default: 0
    range: [0, 6]
    unit: count
    user_editable: true
    rationale: "Renovation-tier cures are hidden by default and only appear when the user opts into a remodel."
  - key: optimise_for
    default: severity_per_currency
    range: [severity_per_currency, severity_only, effort_only, fastest_wins]
    unit: enum
    user_editable: true
    rationale: "Different users want the biggest fix, the cheapest fix, or the quickest list."
score:
  weight: 4
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: reorder_remedies
    target: any
    transform: {knapsack: true, objective: severity_per_currency, constraint: plan_budget_ceiling}
    cost: free
    effort: none
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "We fitted your plan to your budget and put the changes that do the most first."
  - rank: 2
    action: annotate_remedy
    target: any
    transform: {badge: "over budget", collapse: true}
    cost: free
    effort: none
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "Tucked away below budget: a few bigger changes, for whenever."
conflicts_with: []
supersedes: []
requires_rules: [FS-CURE-002, FS-CURE-004]
tags: [framework, budget, cost, planning]
localization_notes: Currency and tier ceilings per market; see FS-CURE-002 params.
```

#### Why — tradition

Traditional practice is emphatically not dependent on spend. The most-repeated cures across every
lineage are free: move the bed, clear the entry, repair what is broken, open the curtains, remove
the dead plant. Practitioners who charge for consultations still prescribe mostly free actions,
which is a useful corrective to the retail version of feng shui.

#### Why — psychology / physiology

`No direct empirical support` for a budget-optimisation effect, but the mechanism is the same
completion-probability argument as `FS-CURE-004`, plus a fairness one: a plan the user cannot
afford converts a hopeful moment into an exclusion. Given that the documented benefit runs through
perceived control (`FS-CURE-007`), a plan that puts control behind a paywall removes the benefit.

#### Customer insight

Tell us your budget, even if it is zero. Most of the biggest improvements in your home cost
nothing but an afternoon.

#### Failure modes / when to skip

Skip the ceiling for `blocking` safety remediation — a missing anchor strap or a tempered-glass
replacement is not a budget decision, and the engine should say so plainly. Also skip in
"wishlist" mode where the user is deliberately planning a renovation.

---
### Mirror as a commanding-position sightline cure

```yaml
id: FS-CURE-011
title: Mirror placed to restore a view of the door from bed or desk
system: feng_shui.form_school
group: mirrors
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, bedroom_guest, bedroom_child, bedroom_teen, studio_apartment, home_office, home_office_shared, study_library, dorm_room]
  objects: [decor.mirror.wall, decor.mirror.leaning, decor.mirror.freestanding]
  requires_features: []
  min_room_area_m2: 5.0
scope: object_pair
severity: medium
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let anchor = firstOf([bedOf(room), deskOf(room)])
  let door = room.primaryDoor
  require lineOfSight(anchor.seatedEye, door.centroid) == false
  assert exists m in others(decor.mirror.*) where
      reflectionPath(m, anchor.seatedEye, door.centroid) == true
      and distance(m, anchor.seatedEye) >= p.min_mirror_view_distance_m
      and reflects(m, bedOf(room)) == false
      and glareRisk(anchor.seatedEye, m) <= p.max_glare_from_mirror
      and mirrorSubtendedAngle(m, anchor.seatedEye) >= p.min_subtended_angle_deg
  forbid reflects(m, nearestFeature(room, light_point)) == true and illuminanceAt(anchor.seatedEye) > p.max_reflected_lux
params:
  - key: min_mirror_view_distance_m
    default: 1.200
    range: [0.600, 4.000]
    unit: m
    user_editable: true
    rationale: "A mirror closer than this fills the field of view and becomes the dominant object rather than a discreet sightline aid."
  - key: max_glare_from_mirror
    default: 0.30
    range: [0.10, 0.60]
    unit: ratio
    user_editable: true
    rationale: "A mirror that bounces a window or lamp into the eye line makes the cure worse than the problem."
  - key: min_subtended_angle_deg
    default: 6.0
    range: [3.0, 20.0]
    unit: deg
    user_editable: true
    rationale: "Below roughly six degrees of visual angle the reflected doorway is too small to be usefully monitored in peripheral vision."
  - key: max_reflected_lux
    default: 50
    range: [10, 200]
    unit: lux
    user_editable: true
    rationale: "Caps reflected light at the pillow or the seated eye at night."
score:
  weight: 6
  curve: step
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: sleep.bed.*|worksurface.desk.*
    transform: {to_zone: has_direct_door_view, keep: backsToWall(min_contact_pct=60)}
    cost: free
    effort: high_physical
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "If the bed or desk can move so you can see the door directly, do that first. A mirror is the workaround, not the ideal."
  - rank: 2
    action: add_object
    add: decor.mirror.leaning
    transform: {position: so_that reflectionPath(mirror, anchor.seatedEye, door.centroid), lean_against: solid_wall, strap: required}
    cost: under_250
    effort: low
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "A large leaning mirror angled so the doorway shows in it gives you the view back with no drilling. Strap it to the wall so it cannot tip."
  - rank: 3
    action: add_object
    add: decor.mirror.wall
    transform: {position: so_that reflectionPath(mirror, anchor.seatedEye, door.centroid), mount: stud_or_anchor}
    cost: under_250
    effort: moderate
    reversible: false
    rental_safe: false
    undo_cost: under_50
    copy: "Hung on the wall opposite your line of sight, a mirror lets you see who is coming in without turning around."
conflicts_with: [FS-CURE-012, FS-CURE-013]
supersedes: []
requires_rules: [FS-CMD-001]
tags: [mirror, sightline, command_position, bed, desk, signature_rule]
localization_notes: Hemisphere-invariant. Mirror-in-bedroom aversion is much stronger in some Chinese and Southeast Asian households; check user preference before offering rank 2 or 3 in a bedroom.
```

#### Why — tradition

The form-school "commanding position" (`zuo shan guan shui`, sitting with support and an open
view) asks that a bed or desk let its occupant see the entrance. Where architecture makes that
impossible, both classical practitioners and BTB teach the mirror as the standard substitute —
in BTB it is one of the named "transcendental" cures. Note the internal tension: the same
tradition that recommends a mirror to see the door generally does not want a mirror reflecting
the bed, so in bedrooms the mirror must show the doorway without showing the sleeper
(`FS-CURE-012`).

#### Why — psychology / physiology

Prospect–refuge theory (Appleton) and the broader environmental-preference literature give a
genuine mechanism: people prefer positions that combine a protected back with an open outlook,
and an unmonitored entry behind you leaves an orienting response unresolved. There is no
controlled study showing that adding a mirror to a bedroom improves sleep, so treat the specific
mirror cure as `tradition` with a plausible underlying mechanism rather than as demonstrated.
For desks the ergonomic and security-design literature is somewhat friendlier — visual control of
an approach reduces startle interruptions.

#### Customer insight

Your bed's headboard is against the only wall that works, and the door is behind you. A mirror
placed so the doorway shows in it gives you that reassuring glance without rearranging the room.

#### Failure modes / when to skip

Skip in rooms under about 5 m² (54 sq ft), where any mirror large enough to be useful dominates.
Skip if the user has told us mirrors in bedrooms are unwelcome. Skip if the only geometry that
works would also reflect the bed, a toilet or the stove — those prohibitions win. In children's
rooms prefer moving the bed; a night-time reflection is a common source of fear.

---

### No mirror reflecting the bed

```yaml
id: FS-CURE-012
title: A mirror must not reflect the bed or the sleeping occupant
system: feng_shui.form_school
group: mirrors
version: 1
status: active
applies_to:
  rooms: [bedroom_primary, bedroom_secondary, bedroom_guest, bedroom_child, bedroom_teen, nursery, bedroom_shared_siblings, dorm_room, studio_apartment, guest_suite]
  objects: [decor.mirror.*, storage.wardrobe.mirrored, decor.art.glass_framed]
  requires_features: []
scope: object_pair
severity: medium
confidence: tradition
evidence_class: traditional
belief_gated: true
predicate: |
  let bed = bedOf(room)
  forEach m in objects where reflective(m) == true and reflectiveArea(m) >= p.min_reflective_area_m2:
    forbid reflects(m, bed.mattressSurface) == true
    forbid reflectionPath(m, bed.pillowEye, bed.pillowEye) == true
    if p.strictness == "strict":
      forbid reflects(m, bed.footprintExpanded(p.bed_halo_m)) == true
params:
  - key: min_reflective_area_m2
    default: 0.100
    range: [0.020, 0.500]
    unit: m2
    user_editable: true
    rationale: "Below roughly 0.1 m² (about 1 sq ft) a reflective surface such as a picture frame or a phone screen is not treated as a mirror."
  - key: strictness
    default: standard
    range: [lenient, standard, strict]
    unit: enum
    user_editable: true
    rationale: "Lenient only flags a mirror reflecting the sleeper's head; strict flags any reflection of the bed or its surround."
  - key: bed_halo_m
    default: 0.300
    range: [0.000, 0.900]
    unit: m
    user_editable: true
    rationale: "Buffer around the bed footprint used in strict mode."
  - key: treat_mirrored_wardrobe_as_mirror
    default: true
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: "Mirrored wardrobe doors are the single most common accidental violation and the hardest to move."
score:
  weight: 6
  curve: step
  partial_credit: true
remedies:
  - rank: 1
    action: rotate_object
    target: decor.mirror.*
    transform: {reorient_until: "reflects(mirror, bed) == false", prefer_axis: parallel_to_bed_long_axis}
    cost: free
    effort: low
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "Turning the mirror so it looks along the bed rather than across it usually solves this in one move."
  - rank: 2
    action: move_object
    target: decor.mirror.*
    transform: {to_wall: same_wall_as_headboard_or_behind_door}
    cost: free
    effort: low
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "A mirror on the wall your headboard sits against, or behind the door, cannot see the bed at all."
  - rank: 3
    action: add_object
    add: softgoods.curtain.panel
    transform: {cover: mirrored_wardrobe_doors, mount: tension_rod_or_adhesive_track, open_by_day: true}
    cost: under_50
    effort: low
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "For built-in mirrored wardrobe doors, a light curtain on a tension rod you draw at night is the renter-friendly answer."
  - rank: 4
    action: change_finish
    target: storage.wardrobe.mirrored
    transform: {apply: removable_frosted_film, coverage_pct: 100}
    cost: under_50
    effort: moderate
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "Removable frosted film keeps the light and loses the reflection. It peels off cleanly when you move."
conflicts_with: [FS-CURE-011]
supersedes: []
requires_rules: []
tags: [mirror, bedroom, sleep, prohibition, signature_rule]
localization_notes: One of the most widely known feng shui rules across all markets; expect high user recognition and low tolerance for an app that ignores it.
```

#### Why — tradition

The prohibition on a mirror facing the bed is close to universal across schools, though the stated
reason differs. Classical explanations centre on the mirror's reflective `qi` disturbing the yin,
restorative nature of the sleeping area; some lineages add that it "doubles" the occupants and is
therefore inauspicious for a couple. BTB and most Western practitioners repeat the rule and often
extend it to any reflective surface, including televisions and mirrored wardrobe doors. It is one
of the few cure-related prohibitions on which the schools essentially agree.

#### Why — psychology / physiology

`No direct empirical support; mechanism is plausible but untested.` No controlled study shows that
a mirror facing a bed affects sleep. Two mechanisms are plausible and worth stating honestly to
users. First, a large mirror can redirect light — streetlight, a hallway lamp, a standby LED —
onto the pillow, and light at the sleeping surface does have well-established effects on sleep
and circadian timing. Second, an unexpected movement in the periphery on waking can trigger an
orienting or startle response; this is the likely basis of the very common report that mirrors
facing the bed are unsettling, particularly for children.

#### Customer insight

Most feng shui schools agree on this one: nothing reflective aimed at the bed. Beyond tradition,
there is a practical reason — a big mirror can bounce hallway or street light onto your pillow,
and a flicker of movement at night is startling.

#### Failure modes / when to skip

Do not fire for small reflective objects (framed photographs, glass-fronted art under the
`min_reflective_area_m2` threshold) — that produces absurd findings. In a `studio_apartment`
where the bed shares the only room with the only mirror, offer the curtain or film remedy rather
than asking the user to remove their only mirror. If `FS-CURE-011` and this rule collide, this
rule wins in bedrooms and `FS-CURE-011` should fall back to moving the bed.

---

### No mirror directly facing the entry door

```yaml
id: FS-CURE-013
title: A mirror must not sit directly opposite the front door
system: feng_shui.form_school
group: mirrors
version: 1
status: active
applies_to:
  rooms: [entry_foyer, mudroom, hallway_corridor, porch_entry, studio_apartment, open_plan_combined]
  objects: [decor.mirror.*]
  requires_features: []
scope: object_placement
severity: medium
confidence: tradition
evidence_class: traditional
belief_gated: true
predicate: |
  let entry = site.primaryEntryOpening
  forEach m in objects where reflective(m) == true and reflectiveArea(m) >= p.min_reflective_area_m2:
    forbid alignedWithin(m.normalAxis, entry.openingAxis, p.axis_tolerance_deg) == true
       and distance(m.centroid, entry.centroid) <= p.face_off_distance_m
       and reflects(m, entry.leafPlane) == true
    prefer isOnWall(m, wallPerpendicularTo(entry)) == true
params:
  - key: min_reflective_area_m2
    default: 0.100
    range: [0.020, 0.500]
    unit: m2
    user_editable: true
    rationale: "Same small-object exclusion as FS-CURE-012."
  - key: axis_tolerance_deg
    default: 20.0
    range: [5.0, 45.0]
    unit: deg
    user_editable: true
    rationale: "How close to square-on counts as facing the door. Classical practice is strict; twenty degrees is a workable default."
  - key: face_off_distance_m
    default: 4.000
    range: [1.000, 10.000]
    unit: m
    user_editable: true
    rationale: "Beyond this the mirror is no longer read as facing the entrance."
  - key: allow_side_wall_mirror
    default: true
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: "A mirror on a side wall of the entry is the standard permitted alternative and is actively recommended by many practitioners."
score:
  weight: 5
  curve: step
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: decor.mirror.*
    transform: {to_wall: perpendicular_to_entry, keep_height: eye_level_band}
    cost: free
    effort: low
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "Move the mirror to a side wall of the entry instead of straight ahead. You still get the light and the last-look-before-leaving, without it facing the door."
  - rank: 2
    action: add_object
    add: decor.art.framed
    transform: {position: wall_opposite_entry, replace: mirror}
    cost: under_250
    effort: low
    reversible: true
    rental_safe: false
    undo_cost: under_50
    copy: "Artwork opposite the front door gives you the welcoming focal point a mirror was doing, without the reflection."
conflicts_with: []
supersedes: []
requires_rules: []
tags: [mirror, entry, front_door, prohibition]
localization_notes: Some Western practitioners actively recommend an entry mirror on a side wall to enlarge a small foyer; keep that permitted variant visible.
```

#### Why — tradition

The front door is the "mouth of `qi`" (`qi kou`) in every school. A mirror squarely facing it is
said to reflect incoming `qi` straight back out, so the home never receives it — a rule taught
identically by classical practitioners and by BTB. The same schools generally *approve* a mirror
on the side wall of an entry, where it widens a cramped foyer without opposing the door. So this
is a placement rule, not a ban on entry mirrors.

#### Why — psychology / physiology

`No direct empirical support; mechanism is plausible but untested.` There is no evidence about
`qi` reflection. A modest real consideration exists: a full-height mirror directly opposite an
entrance produces a sudden self-confrontation and, for arriving guests, a brief moment of
misreading depth — the reason mirrors opposite doors in gyms and lobbies are usually offset. Mirror
exposure reliably increases self-focused attention (objective self-awareness theory, Duval and
Wicklund, 1972), which is welcome at a dressing mirror and less welcome at the threshold of home.

#### Customer insight

Tradition says a mirror straight ahead of the front door sends the good energy back out. Either
way, moving it to a side wall keeps the bright, larger-feeling entrance and loses the
walk-in-and-meet-yourself moment.

#### Failure modes / when to skip

Skip when the "mirror" is a small decorative piece under the area threshold, or when the entry is
a single-wall vestibule with no perpendicular wall available — then offer the artwork swap or
accept it and mark advisory. Does not apply to interior room doors; those are covered by
`FS-CURE-050`.

---

### No mirror reflecting the stove or cooking fire

```yaml
id: FS-CURE-014
title: A mirror must not reflect the stove, hob or open flame
system: feng_shui.five_elements
group: mirrors
version: 1
status: active
applies_to:
  rooms: [kitchen, eat_in_kitchen, butlers_pantry, studio_apartment, open_plan_combined]
  objects: [decor.mirror.*, kitchen.backsplash.mirrored, decor.art.glass_framed]
  requires_features: [gas_line]
scope: object_pair
severity: medium
confidence: tradition
evidence_class: traditional
belief_gated: true
predicate: |
  let hob = firstOf(objects where type matches "kitchen.range.*|kitchen.cooktop.*")
  forEach m in objects where reflective(m) == true and reflectiveArea(m) >= p.min_reflective_area_m2:
    forbid reflects(m, hob.burnerPlane) == true
    forbid distance(m, hob) <= p.min_distance_from_hob_m and reflective(m) == true
  forbid materialOf(wallBehind(hob)) == "mirror" or finishOf(wallBehind(hob)).reflective == true
params:
  - key: min_reflective_area_m2
    default: 0.060
    range: [0.020, 0.400]
    unit: m2
    user_editable: true
    rationale: "Lower than the bedroom threshold because a mirrored splashback tile field aggregates."
  - key: min_distance_from_hob_m
    default: 0.600
    range: [0.300, 1.500]
    unit: m
    user_editable: true
    rationale: "Also a real heat and cleaning consideration for any mirrored surface near a burner."
  - key: include_mirrored_splashback
    default: true
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: "Mirrored splashbacks are fashionable and are the usual way this rule gets violated."
score:
  weight: 4
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: move_object
    target: decor.mirror.*
    transform: {to_wall: out_of_reflection_cone(hob)}
    cost: free
    effort: low
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "Relocate the mirror so the burners do not show in it."
  - rank: 2
    action: change_finish
    target: kitchen.backsplash.mirrored
    transform: {replace_with: [tile.matte, glass.back_painted, stone.honed], coverage_pct: 100}
    cost: renovation
    effort: pro_trade
    reversible: false
    rental_safe: false
    undo_cost: renovation
    copy: "A matte or back-painted splashback behind the hob replaces a mirrored one. Easier to keep clean, too."
conflicts_with: []
supersedes: []
requires_rules: [FS-ELEM-001]
tags: [mirror, kitchen, stove, fire_element, prohibition]
localization_notes: The doubling-of-fire reasoning assumes a visible flame or element; induction hobs weaken the traditional rationale but practitioners still apply it.
```

#### Why — tradition

In five-element reasoning the stove is the household's Fire, and a mirror is said to double what
it reflects. Doubling Fire is read as excess — classically associated with arguments and
accidents, and specifically discouraged in both San He/San Yuan practice and BTB. The stove is
also one of the three "most important" placements in classical domestic feng shui alongside the
bed and the front door, so it attracts strict handling.

#### Why — psychology / physiology

`No direct empirical support; mechanism is plausible but untested.` There is one real,
non-traditional reason to avoid reflective surfaces immediately behind a hob: glare from a mirrored
splashback in the cook's eye line while working over heat is a genuine visual nuisance, and such
surfaces are harder to keep clean of grease film. Neither justifies the tradition's reasoning, and
we should not imply it does.

#### Customer insight

Feng shui treats the stove as the fire of the house and mirrors as doublers, so it avoids putting
one where the burners reflect. Practically, a mirrored surface right behind a hob also throws
glare and shows every splash.

#### Failure modes / when to skip

Skip when the reflective surface is stainless-steel appliance panelling — treat those as `metal`,
not `mirror`, or the rule fires in every kitchen. Skip for induction hobs if the user sets
`include_mirrored_splashback: false`. The renovation-tier remedy should be hidden unless the user
is already remodelling (`FS-CURE-010`).

---

### No mirror reflecting a toilet, bathroom door, bin or clutter

```yaml
id: FS-CURE-015
title: A mirror must not reflect a toilet, a bathroom door, a bin or a clutter zone
system: feng_shui.form_school
group: mirrors
version: 1
status: active
applies_to:
  rooms: [any]
  objects: [decor.mirror.*]
  requires_features: []
scope: object_pair
severity: low
confidence: tradition
evidence_class: traditional
belief_gated: true
predicate: |
  forEach m in objects where reflective(m) == true and reflectiveArea(m) >= p.min_reflective_area_m2:
    forbid reflects(m, firstOf(objects where type matches "bath.toilet.*")) == true
    forbid reflects(m, openingsWhere(leads_to_room_type in ["bathroom_full","bathroom_three_quarter","powder_room","wet_room","ensuite"])) == true
       and p.include_bathroom_door == true
    forbid reflects(m, objects where type matches "storage.bin.*|kitchen.bin.*") == true
    penalize(reflects(m, clutterZones(room)) == true, weight: p.clutter_reflection_weight)
    prefer reflects(m, firstOf([viewToOutside(m.viewpoint), objects where type matches "plants.*", objects where type matches "decor.art.*"])) == true
params:
  - key: min_reflective_area_m2
    default: 0.100
    range: [0.020, 0.500]
    unit: m2
    user_editable: true
    rationale: "Small-object exclusion, consistent with FS-CURE-012."
  - key: include_bathroom_door
    default: true
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: "Some schools object only to reflecting the toilet itself, others to the bathroom door as well."
  - key: clutter_reflection_weight
    default: 3
    range: [0, 8]
    unit: weight
    user_editable: true
    rationale: "How hard to penalise a mirror that doubles a visually busy zone."
  - key: reward_good_reflection
    default: true
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: "Turns the rule positive: credit a mirror that reflects greenery, art or a window."
score:
  weight: 3
  curve: linear
  partial_credit: true
remedies:
  - rank: 1
    action: rotate_object
    target: decor.mirror.*
    transform: {reorient_until: "reflects(mirror, undesirable_set) == false", then_prefer: reflects_window_or_plant}
    cost: free
    effort: low
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "Angle or move the mirror so it picks up the window or a plant instead of the bathroom door."
  - rank: 2
    action: add_object
    add: softgoods.curtain.door_panel
    transform: {position: bathroom_doorway, keep_closed_default: true}
    cost: under_50
    effort: low
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "A light panel over the bathroom doorway takes it out of the reflection and out of the sightline."
  - rank: 3
    action: move_object
    target: storage.bin.*
    transform: {to_zone: out_of_reflection_cone, prefer: under_counter_or_cabinet}
    cost: free
    effort: low
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "Tuck the bin out of the mirror's view, or into a cupboard."
conflicts_with: []
supersedes: []
requires_rules: []
tags: [mirror, bathroom, toilet, clutter, doubling]
localization_notes: none
```

#### Why — tradition

The "mirrors double what they reflect" principle cuts both ways: practitioners across schools
recommend siting a mirror to double a garden view, a plant or a dining table, and to avoid
doubling a toilet, a rubbish bin, a pile of laundry or a bathroom door. The dining-room mirror
that "doubles the food on the table" is the classic positive case, taught in both classical and
BTB practice as an abundance cure.

#### Why — psychology / physiology

`No direct empirical support` for `qi` doubling, but there is a straightforward and honest visual
argument: a mirror duplicates the visual weight of whatever it faces, so pointing one at the
messiest part of the room makes the room measurably busier and removes half the mirror's benefit.
This is composition, not metaphysics, and it is worth saying that way. Attention-restoration
research (Kaplan) supports the positive half — extending a view of greenery or sky into a room is
a real if modest benefit.

#### Customer insight

Mirrors double whatever they face. Point yours at the window, a plant or your favourite corner —
not at the bathroom door or the bin. It is the cheapest upgrade in this whole plan.

#### Failure modes / when to skip

Inside a bathroom, the vanity mirror will often unavoidably catch the toilet in a small
`powder_room`; drop to advisory rather than demanding a remedy in rooms under about 3 m² (32 sq ft).
Do not fire on the bathroom's own mirror if `include_bathroom_door` is the only trigger.

---

### Mirror sizing and hanging height — never crop the head

```yaml
id: FS-CURE-016
title: A mirror must show the whole head of the tallest regular occupant
system: feng_shui.btb_western
group: mirrors
version: 1
status: active
applies_to:
  rooms: [entry_foyer, mudroom, hallway_corridor, bedroom_primary, bedroom_secondary, dressing_room, walk_in_closet, bathroom_full, bathroom_three_quarter, powder_room, ensuite, formal_dining, living_room]
  objects: [decor.mirror.*]
  requires_features: []
scope: object_placement
severity: medium
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  let h = max(person.height_cm for person in room.regularOccupants) / 100
  let eye = h * p.eye_height_ratio
  forEach m in objects where type matches "decor.mirror.*" and mirrorUse(m) in ["grooming","full_length","entry"]:
    assert (m.pose.z + bbox(m).h) >= h + p.headroom_above_crown_m
    assert m.pose.z <= eye - p.min_below_eye_m
    if mirrorUse(m) == "full_length":
      assert bbox(m).h >= h * p.full_length_min_ratio
      assert m.pose.z <= p.full_length_max_sill_m
    assert bbox(m).w >= p.min_grooming_width_m
params:
  - key: eye_height_ratio
    default: 0.935
    range: [0.900, 0.960]
    unit: ratio
    user_editable: false
    rationale: "Standing eye height as a fraction of stature, a standard anthropometric approximation."
  - key: headroom_above_crown_m
    default: 0.100
    range: [0.000, 0.300]
    unit: m
    user_editable: true
    rationale: "Clearance of mirror top edge above the crown of the head, about 4 in, so the reflection is not clipped."
  - key: min_below_eye_m
    default: 0.250
    range: [0.100, 0.600]
    unit: m
    user_editable: true
    rationale: "Ensures the mirror extends well below eye level so the face is centred, not at the top edge."
  - key: full_length_min_ratio
    default: 0.560
    range: [0.450, 0.750]
    unit: ratio
    user_editable: true
    rationale: "A mirror slightly over half your height, correctly hung, shows your full body by geometry."
  - key: full_length_max_sill_m
    default: 0.500
    range: [0.200, 0.900]
    unit: m
    user_editable: true
    rationale: "Bottom edge height above floor for a full-length mirror, about 20 in or lower."
  - key: min_grooming_width_m
    default: 0.400
    range: [0.250, 0.900]
    unit: m
    user_editable: true
    rationale: "Narrower than about 16 in and shoulders fall outside the reflection."
score:
  weight: 4
  curve: clamped_linear
  partial_credit: true
remedies:
  - rank: 1
    action: move_object
    target: decor.mirror.*
    transform: {raise_to: "top_edge >= tallest_stature + headroom_above_crown_m"}
    cost: free
    effort: low
    reversible: true
    rental_safe: false
    undo_cost: free
    copy: "Raise the mirror so the top edge clears the tallest person's head by a hand's width. One new hook, five minutes."
  - rank: 2
    action: swap_objects
    target: decor.mirror.*
    transform: {replace_with: decor.mirror.full_length, min_height_m: 1.100}
    cost: under_250
    effort: low
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "A taller mirror, or a leaning floor mirror, fixes this permanently and makes the room feel larger."
conflicts_with: []
supersedes: []
requires_rules: []
tags: [mirror, sizing, height, anthropometrics, grooming]
localization_notes: Stature distributions differ markedly by population; drive this from the household's actual recorded heights where available rather than a regional average.
```

#### Why — tradition

BTB and most modern Western feng shui writing teach explicitly that a mirror should not "cut off
the head" of the person using it, and extend the idea to a mirror hung so low it decapitates the
reflection or so high it shows only the crown. The underlying image — an incomplete reflection
implying an incomplete self — is symbolic and belongs to the modern layer of practice rather than
to classical texts. Classical sources say much less about mirror sizing than modern practice does.

#### Why — psychology / physiology

The traditional claim has `No direct empirical support`. But there is a real ergonomic rule here
and it happens to produce the same answer: a plane mirror shows a person a little over half their
own height, so a mirror roughly 56 percent of stature, hung with its centre near eye level, gives a
full-body view. Mirror exposure increases self-focused attention (Duval and Wicklund, 1972) and
body-checking behaviour, which argues for placing grooming mirrors deliberately rather than
everywhere — an honest reason to be thoughtful about mirrors that is independent of tradition.

#### Customer insight

Hang it so the top edge clears the tallest head in the house by about four inches. Tradition
dislikes a reflection that cuts off the head, and practically, a correctly hung mirror is the
difference between a useful one and a frustrating one.

#### Failure modes / when to skip

Skip for decorative mirrors that are not used for grooming — a small round mirror as wall art is
not subject to this. In `bedroom_child` and `nursery`, size to the child, not to the adult. In
accessible bathrooms a seated-user mirror has a different geometry entirely and
`accessibility.universal_design` rules take precedence.

---

### Single unbroken pane — no cracked, tiled or heavily antiqued face mirror

```yaml
id: FS-CURE-017
title: Face and full-length mirrors must be a single unbroken, undistorted pane
system: feng_shui.form_school
group: mirrors
version: 1
status: active
applies_to:
  rooms: [any]
  objects: [decor.mirror.*, storage.wardrobe.mirrored]
  requires_features: []
scope: material_finish
severity: medium
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  forEach m in objects where type matches "decor.mirror.*" and mirrorUse(m) in ["grooming","full_length","entry"]:
    forbid isCracked(m) == true
    forbid paneIsSingle(m) == false and p.allow_tiled_mirror == false
    forbid antiqueDistortionIndex(m) > p.max_distortion_index
    forbid mullionCount(m) > p.max_mullions
params:
  - key: allow_tiled_mirror
    default: false
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: "Tiled or panelled mirror walls break the reflection into fragments; some users like the look and can allow it."
  - key: max_distortion_index
    default: 0.25
    range: [0.00, 0.80]
    unit: ratio
    user_editable: true
    rationale: "Antiqued, smoked and foxed mirrors are fine as decor but poor as face mirrors."
  - key: max_mullions
    default: 0
    range: [0, 6]
    unit: count
    user_editable: true
    rationale: "Number of dividing bars permitted across a grooming mirror."
  - key: cracked_is_blocking
    default: true
    range: [false, true]
    unit: bool
    user_editable: false
    rationale: "A cracked mirror is a laceration hazard independent of any tradition, so removal is non-negotiable."
score:
  weight: 4
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: remove_object
    target: decor.mirror.*
    transform: {when: isCracked, dispose: wrapped_glass_disposal}
    cost: free
    effort: low
    reversible: false
    rental_safe: true
    undo_cost: under_250
    copy: "A cracked mirror should go, for the simple reason that broken glass in a home is a cut waiting to happen. Tradition agrees, for its own reasons."
  - rank: 2
    action: swap_objects
    target: decor.mirror.*
    transform: {replace_with: decor.mirror.single_pane, keep_frame: if_possible}
    cost: under_250
    effort: moderate
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "Reglazing the frame with one clear pane keeps the piece you like and gives you a mirror you can actually use."
  - rank: 3
    action: reassign_room_function
    target: decor.mirror.antiqued
    transform: {redesignate: decorative_only, move_out_of: [grooming_zone, entry_sightline]}
    cost: free
    effort: low
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "Keep the antiqued mirror as artwork and put a plain one where you actually check your reflection."
conflicts_with: []
supersedes: []
requires_rules: []
tags: [mirror, condition, maintenance, safety, glass]
localization_notes: none
```

#### Why — tradition

A broken or fragmented mirror is treated as inauspicious in Chinese domestic practice as it is in
European folklore, and feng shui practitioners of every school will tell a client to replace a
cracked mirror before anything else. The specific reasoning — a fractured reflection fragmenting
the person or the household's `qi` — is symbolic. The advice to use a single clear pane for any
mirror you actually look into is shared by classical and modern practitioners.

#### Why — psychology / physiology

The symbolic claim has `No direct empirical support`. The safety claim is concrete: cracked
silvered glass sheds shards and edges, and a cracked mirror in a bathroom or bedroom is a real
laceration risk, which is why the `cracked_is_blocking` param is not user-editable. On the
aesthetic side, a fragmented or distorted reflection genuinely interferes with grooming tasks —
that is a function argument, and the app should make it rather than a mystical one.

#### Customer insight

Replace anything cracked, and keep one plain, unbroken mirror where you actually get ready.
Antiqued and panelled mirrors are beautiful on a wall and useless for checking your collar.

#### Failure modes / when to skip

Do not fire on decorative mirror mosaics, disco-style mirror art, or intentionally distressed
mirrors used as wall art — that is a style choice covered by `style.*` rules. Only mirrors whose
`mirrorUse` is grooming, full-length or entry are in scope.

---

### Bagua mirror — exterior only, never aimed at a neighbour

```yaml
id: FS-CURE-018
title: Bagua mirror is an exterior cure, is never hung indoors, and is never aimed at a neighbour
system: feng_shui.compass.bagua
group: mirrors
version: 1
status: experimental
applies_to:
  rooms: [porch_entry, balcony, patio_deck, roof_terrace, garden_yard]
  objects: [decor.mirror.bagua, decor.mirror.bagua_convex, decor.mirror.bagua_concave, decor.mirror.bagua_flat]
  requires_features: []
scope: site
severity: high
confidence: tradition
evidence_class: traditional
belief_gated: true
predicate: |
  forEach m in objects where type matches "decor.mirror.bagua*":
    require p.bagua_mirror_enabled == true
    assert m.location == "exterior"
    forbid contains(anyRoom(interior), m) == true
    assert isAbove(m, site.primaryEntryOpening) == true and m.pose.z >= p.min_mount_height_m
    assert m.facing == "outward"
    forEach o in neighbourOpenings(site, p.neighbour_scan_radius_m):
      forbid aimedAt(m, o) == true and angleBetween(m.normalAxis, bearingTo(o)) <= p.neighbour_exclusion_cone_deg
    forEach n in neighbourDwellings(site, p.neighbour_scan_radius_m):
      forbid aimedAt(m, n.primaryEntry) == true
    assert userAcknowledged("bagua_mirror_is_an_aggressive_cure") == true
params:
  - key: bagua_mirror_enabled
    default: false
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: "Off by default. This is the one cure in the catalog the engine should not propose unprompted, because practitioners describe it as aggressive and because it has a social cost."
  - key: min_mount_height_m
    default: 2.000
    range: [1.800, 3.500]
    unit: m
    user_editable: true
    rationale: "Above the door head, out of reach, and out of the arrival sightline."
  - key: neighbour_scan_radius_m
    default: 30.0
    range: [5.0, 100.0]
    unit: m
    user_editable: true
    rationale: "Radius within which neighbouring doors and windows are checked before the mirror may be aimed."
  - key: neighbour_exclusion_cone_deg
    default: 25.0
    range: [10.0, 60.0]
    unit: deg
    user_editable: true
    rationale: "Angular exclusion around any neighbouring opening."
  - key: require_practitioner_referral
    default: true
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: "Practitioners consistently say do not place one of these without a consultation. The app should say the same rather than pretend to competence it does not have."
score:
  weight: 3
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: substitute_remedy
    target: decor.mirror.bagua*
    transform: {replace_with: [plants.hedge.screening, decor.screen.exterior, softgoods.blind.exterior], purpose: block_rather_than_deflect}
    cost: under_250
    effort: moderate
    reversible: true
    rental_safe: false
    undo_cost: under_50
    copy: "Before reaching for a bagua mirror, try simply blocking the view — a hedge, a screen or a blind does the same job without pointing anything at anyone."
  - rank: 2
    action: move_object
    target: decor.mirror.bagua*
    transform: {to_location: exterior_above_entry, facing: outward, reaim_away_from: neighbour_openings}
    cost: free
    effort: low
    reversible: true
    rental_safe: false
    undo_cost: free
    copy: "If you do use one, it belongs outside above the entrance, facing out, and angled so it is not pointed at anybody's door or window."
  - rank: 3
    action: remove_object
    target: decor.mirror.bagua*
    transform: {when: "location == interior"}
    cost: free
    effort: low
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "A bagua mirror indoors is the one placement every school warns against. Take it down, or move it outside above the front door."
conflicts_with: [FS-CURE-009]
supersedes: []
requires_rules: [FS-CURE-008, FS-CURE-019]
tags: [mirror, bagua, exterior, aggressive_cure, neighbour_relations, product_note, signature_rule]
localization_notes: In dense Chinese-speaking urban markets bagua mirrors are visible and socially legible; aiming one at a neighbour is understood as hostile. In markets where they are unfamiliar they mainly read as odd. Neither is a reason to recommend one.
```

#### Why — tradition

The bagua mirror (`bagua jing`) is a protective, deflecting cure — an octagonal frame carrying the
eight trigrams around a flat, convex or concave mirror — hung on the *outside* of a building above
the entrance, facing outward, to turn away `sha qi` from a hostile external form: a road pointing
at the door, a sharp roofline, a pole, a cemetery view. Practitioner guidance is consistent on two
points: it is an exterior cure and should not be hung indoors, where it is said to disturb the
home's own `qi`; and it should never be aimed at a neighbour's door, window or living space, which
is described as an aggressive act and a reliable way to start a "feng shui war." Many practitioners
add that it should not be placed without a consultation at all. Classical lineages use it sparingly;
it is not a decorative object.

#### Why — psychology / physiology

`No direct empirical support; mechanism is plausible but untested.` There is no evidence for
deflection of anything. There is, however, a real and documented-in-kind social mechanism worth
naming: a visible object your neighbour reads as directed at them is a genuine source of
neighbour conflict, and the tradition's own etiquette rule — never aim it at a person — exists for
that reason. A physical screen or planting achieves the intended result, has an actual mechanism
(it blocks the sightline), and offends nobody.

#### Customer insight

This is the one traditional cure we will not suggest on our own. If something outside your door
genuinely bothers you, a hedge, a screen or a blind fixes the view for real. If you do want a bagua
mirror, it goes outside above the door, facing out, and never pointed at anyone's home — in the
tradition itself that is considered a hostile act.

#### Failure modes / when to skip

Disabled by default; only reachable if the user turns it on. Never fires for interior rooms except
to flag an existing indoor bagua mirror for relocation. Suppress entirely for
`tenancyClass == rental` unless the mirror already exists, since mounting one above a shared
entrance affects other residents. Where local rules or an HOA govern exterior appearance, defer to
them.

---

### Curved mirrors — convex to deflect, concave restricted

```yaml
id: FS-CURE-019
title: Convex mirror for wide-angle deflection; concave mirrors are restricted
system: feng_shui.form_school
group: mirrors
version: 1
status: active
applies_to:
  rooms: [entry_foyer, hallway_corridor, stair_core, porch_entry, balcony, garage_parking, elevator_lift_lobby]
  objects: [decor.mirror.convex, decor.mirror.concave]
  requires_features: []
scope: object_placement
severity: low
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  forEach m in objects where type == "decor.mirror.convex":
    prefer isovistArea(m.viewpoint) >= isovistArea(flatEquivalent(m).viewpoint) * p.min_isovist_gain
    assert mirrorCurvature(m).radius_m >= p.min_convex_radius_m
    forbid mirrorUse(m) == "grooming"
    forbid reflects(m, bedOf(room)) == true
  forEach m in objects where type == "decor.mirror.concave":
    require p.allow_concave == true
    forbid contains(anyRoom(type in ["bedroom_primary","bedroom_secondary","nursery","bedroom_child"]), m)
    assert focusedSunlightRisk(m) <= p.max_focus_risk
params:
  - key: min_convex_radius_m
    default: 0.150
    range: [0.050, 1.000]
    unit: m
    user_editable: true
    rationale: "Tighter curvature than this produces a reflection too distorted to read, which defeats the safety-sightline use."
  - key: min_isovist_gain
    default: 1.30
    range: [1.00, 3.00]
    unit: ratio
    user_editable: true
    rationale: "A convex mirror must actually widen what you can see, or it is just an ornament."
  - key: allow_concave
    default: false
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: "Concave mirrors invert and magnify, are rarely prescribed, and can concentrate sunlight. Off by default."
  - key: max_focus_risk
    default: 0.15
    range: [0.00, 0.50]
    unit: ratio
    user_editable: false
    rationale: "Concave and magnifying mirrors in direct sun can concentrate enough energy to scorch fabric. Real, documented fire-cause category for magnifying cosmetic mirrors."
score:
  weight: 3
  curve: linear
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: decor.mirror.convex
    transform: {position: blind_corner_or_stair_landing, height_m: 1.700, aim: approach_path}
    cost: under_50
    effort: low
    reversible: true
    rental_safe: false
    undo_cost: free
    copy: "A small convex mirror at a blind corner or stair landing lets you see round it. Cheap, genuinely useful, and traditional practice likes it for the same spot."
  - rank: 2
    action: remove_object
    target: decor.mirror.concave
    transform: {relocate_out_of: direct_sun_path}
    cost: free
    effort: low
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "Magnifying and concave mirrors can concentrate sunlight enough to scorch. Keep them out of a sunbeam."
conflicts_with: []
supersedes: []
requires_rules: [FS-CURE-018]
tags: [mirror, convex, concave, deflection, sightline, blind_corner]
localization_notes: none
```

#### Why — tradition

Form-school practice distinguishes the three mirror geometries. A flat mirror reflects and is the
general-purpose cure. A convex mirror is said to scatter and disperse `sha qi` and is the usual
choice against a "poison arrow" aimed at the home, which is why the outdoor bagua mirror is most
often convex. A concave mirror is said to absorb and invert, is prescribed rarely and by specific
lineages, and is the one geometry practitioners most often warn amateurs away from. Classical and
BTB usage broadly agree on the convex/concave distinction.

#### Why — psychology / physiology

Here the optics are real even where the doctrine is not. A convex mirror genuinely widens the field
of view — that is why they are standard at blind corners in car parks, stairwells and shop
interiors, and the safety benefit of seeing an approach is well established in circulation and
crime-prevention design. A concave or magnifying mirror genuinely concentrates light, and
magnifying cosmetic mirrors left in direct sun are a recognised ignition source. The traditional
`qi` reasoning has `No direct empirical support`; the optical reasoning needs none.

#### Customer insight

A small convex mirror is a genuinely handy thing at a blind corner or the turn of a stair — you can
see who is coming. Concave and magnifying mirrors are a different matter, and they should never sit
in a sunbeam, because they can focus enough heat to scorch.

#### Failure modes / when to skip

Never propose a convex mirror for grooming or as the commanding-position cure in `FS-CURE-011`; the
distortion makes it useless there. Concave remains off unless the user enables it, and even then
never in a sleeping room. If the convex mirror would be the object protruding into a corridor,
`ergonomics` clearance rules win.

---

### Mirrored wall and mirror-facing-mirror

```yaml
id: FS-CURE-020
title: Mirrored walls are permitted only to extend a good view, and never face another mirror
system: feng_shui.form_school
group: mirrors
version: 1
status: active
applies_to:
  rooms: [living_room, formal_dining, hallway_corridor, entry_foyer, home_gym, yoga_meditation_room, dressing_room, walk_in_closet, game_room]
  objects: [decor.mirror.wall_full, finishes.wall.mirrored]
  requires_features: []
scope: material_finish
severity: medium
confidence: tradition
evidence_class: mixed
belief_gated: true
predicate: |
  forEach w in walls where finishOf(w).reflective == true and reflectiveArea(w) >= p.mirrored_wall_min_m2:
    forbid room.type in ["bedroom_primary","bedroom_secondary","bedroom_guest","bedroom_child","bedroom_teen","nursery","bedroom_shared_siblings"]
    forbid reflects(w, firstOf(objects where type matches "kitchen.range.*|kitchen.cooktop.*")) == true
    forbid exists w2 in walls where finishOf(w2).reflective == true and facingPair(w, w2) == true and angleBetween(w.normal, w2.normal) >= p.opposed_angle_deg
    forbid exists m in objects where reflective(m) and facingPair(w, m) and reflectiveArea(m) >= p.opposed_mirror_min_m2
    assert reflects(w, firstOf([room.windowsWithOutsideView, objects where type matches "plants.*"])) == true or p.require_good_reflection == false
    assert glazingSafetyClass(w) in ["tempered","laminated","safety_backed_film"]
params:
  - key: mirrored_wall_min_m2
    default: 1.500
    range: [0.500, 6.000]
    unit: m2
    user_editable: true
    rationale: "Area above which a reflective wall finish is treated as a mirrored wall rather than a hung mirror."
  - key: opposed_angle_deg
    default: 150.0
    range: [120.0, 180.0]
    unit: deg
    user_editable: true
    rationale: "How near to directly opposed two reflective surfaces must be to produce the repeating-tunnel effect."
  - key: opposed_mirror_min_m2
    default: 0.300
    range: [0.100, 2.000]
    unit: m2
    user_editable: true
    rationale: "Small opposed mirrors do not create a meaningful infinite reflection."
  - key: require_good_reflection
    default: true
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: "Mirrored walls earn their keep by extending a view or daylight; without that they are just a large reflective surface."
score:
  weight: 5
  curve: step
  partial_credit: true
remedies:
  - rank: 1
    action: change_finish
    target: finishes.wall.mirrored
    transform: {reduce_coverage_to: partial_panel, keep_pct: 40, remainder: matte_paint}
    cost: renovation
    effort: pro_trade
    reversible: false
    rental_safe: false
    undo_cost: renovation
    copy: "Cutting a mirrored wall back to a single panel keeps the light and loses the hall-of-mirrors effect."
  - rank: 2
    action: add_object
    add: softgoods.curtain.full_height
    transform: {cover: mirrored_wall, track: ceiling_or_tension, coverage_pct: 100}
    cost: under_250
    effort: moderate
    reversible: true
    rental_safe: false
    undo_cost: under_50
    copy: "Full-height curtains over a mirrored wall are the reversible answer, and they help the room's acoustics too."
  - rank: 3
    action: remove_object
    target: decor.mirror.*
    transform: {select: the_opposed_one, keep: the_one_reflecting_the_window}
    cost: free
    effort: low
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "Two mirrors facing each other make that endless-tunnel reflection. Keep the one that catches the window and move the other."
conflicts_with: []
supersedes: []
requires_rules: [FS-CURE-012, FS-CURE-014]
tags: [mirror, mirrored_wall, infinite_reflection, glazing_safety, renovation]
localization_notes: Mirrored walls read as period-specific (1970s-80s) in many Western markets, which affects resale perception more than any feng shui consideration.
```

#### Why — tradition

Practitioners generally treat a mirrored wall as a very large version of the ordinary mirror cure:
acceptable, sometimes actively good, where it extends a garden view or brings daylight deeper into
a room; and problematic in bedrooms, behind a stove, or where it faces another mirror. The
mirror-facing-mirror case is objected to across schools as `qi` bouncing endlessly with nowhere to
settle — a symbolic reading of an effect that is, in fact, simply visible.

#### Why — psychology / physiology

The `qi` account has `No direct empirical support`. Two real effects exist. Opposed mirrors
produce an unbounded regress that most people find disorienting and that removes the depth cues
the room relies on — a perceptual fact, not a mystical one. Large reflective planes also degrade
room acoustics by adding hard specular surface, raising reverberation time, which is a measurable
effect that the curtain remedy genuinely improves. Separately, large glass in a habitable area
should be tempered, laminated or safety-film-backed; that is an ordinary glazing-safety
requirement and varies by jurisdiction.

#### Customer insight

One mirrored wall that catches a window can make a dark room feel twice its size. Two mirrors
facing each other just make a tunnel. And any big mirror in a living space should be safety glass
or backed with safety film.

#### Failure modes / when to skip

`home_gym`, `yoga_meditation_room` and `dressing_room` are legitimate exceptions where a large
mirror is functional; there the rule should only enforce the opposed-mirror and safety-glazing
clauses. Never propose the renovation-tier remedy unless the user is remodelling. In rentals only
the curtain and the remove-one-mirror remedies are available.

---

### Mirror mounting and anti-tip safety

```yaml
id: FS-CURE-021
title: Any mirror added as a cure must be mounted or restrained safely
system: safety.tipover
group: mirrors
version: 1
status: active
applies_to:
  rooms: [any]
  objects: [decor.mirror.*]
  requires_features: []
scope: object_placement
severity: blocking
confidence: evidence_strong
evidence_class: empirical
belief_gated: false
predicate: |
  forEach m in objects where type matches "decor.mirror.*":
    if m.mounting == "leaning":
      assert anchoredToStructure(m) == true or mass_kg(m) <= p.unrestrained_lean_max_kg
      assert bbox(m).h <= p.max_unrestrained_lean_height_m or anchoredToStructure(m) == true
      forbid exists c in room.regularOccupants where c.age_band in ["infant","toddler","child"] and anchoredToStructure(m) == false
      assert leanAngleFromVertical(m) >= p.min_lean_angle_deg
    if m.mounting == "wall":
      assert fixingRatedLoad(m) >= mass_kg(m) * p.fixing_safety_factor
      forbid isAbove(m, sleep.bed.*) == true and p.allow_mirror_above_bed == false
      forbid isAbove(m, seating.sofa.*) == true and glazingSafetyClass(m) == "annealed"
    assert glazingSafetyClass(m) in ["tempered","laminated","safety_backed_film"] or reflectiveArea(m) < p.small_mirror_exempt_m2
params:
  - key: unrestrained_lean_max_kg
    default: 5.0
    range: [1.0, 12.0]
    unit: kg
    user_editable: false
    rationale: "Above this a leaning mirror that topples can cause serious crush and laceration injury, so restraint is required rather than advised."
  - key: max_unrestrained_lean_height_m
    default: 0.900
    range: [0.400, 1.400]
    unit: m
    user_editable: false
    rationale: "Tall leaning mirrors are a recognised tip-over hazard for young children."
  - key: min_lean_angle_deg
    default: 5.0
    range: [2.0, 15.0]
    unit: deg
    user_editable: true
    rationale: "Too near vertical and a leaning mirror has no stable rest position."
  - key: fixing_safety_factor
    default: 4.0
    range: [2.0, 8.0]
    unit: ratio
    user_editable: false
    rationale: "Conventional design margin for overhead and wall-hung loads."
  - key: allow_mirror_above_bed
    default: false
    range: [false, true]
    unit: bool
    user_editable: true
    rationale: "Glass directly over a sleeping head is both a traditional objection and a real seismic and fixing-failure risk."
  - key: small_mirror_exempt_m2
    default: 0.100
    range: [0.020, 0.300]
    unit: m2
    user_editable: false
    rationale: "Small decorative mirrors are outside the safety-glazing requirement."
score:
  weight: 10
  curve: step
  partial_credit: false
remedies:
  - rank: 1
    action: add_object
    add: safety.anchor.strap_kit
    transform: {attach: leaning_mirror_to_wall, fixing: stud_or_heavy_duty_anchor}
    cost: under_50
    effort: low
    reversible: true
    rental_safe: false
    undo_cost: under_50
    copy: "Strap a leaning mirror to the wall. It is a two-screw job and it is the difference between furniture and a falling sheet of glass."
  - rank: 2
    action: swap_objects
    target: decor.mirror.*
    transform: {replace_with: decor.mirror.acrylic_or_safety_backed, when: "children_present and drilling_not_permitted"}
    cost: under_250
    effort: low
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "If you cannot drill, a shatter-resistant or safety-backed mirror is the safe version of the same idea."
  - rank: 3
    action: move_object
    target: decor.mirror.*
    transform: {off_wall_above: [sleep.bed.*, seating.sofa.*, kids.*]}
    cost: free
    effort: low
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "Move glass out from directly above where people sleep or sit."
conflicts_with: [FS-CURE-011, FS-CURE-020]
supersedes: []
requires_rules: [FS-CURE-006]
tags: [mirror, safety, tipover, glazing, child_safety, blocking]
localization_notes: Seismic regions should treat overhead glass more strictly; AS-NZS and Japanese practice add restraint requirements for wall-hung objects over beds.
```

#### Why — tradition

Nothing in feng shui addresses fixings. What the tradition does say is relevant in the same
direction: glass or heavy objects over a bed or a seat are widely discouraged as "overhead
pressure" (`ya`), the same reasoning applied to beams. Where tradition and engineering point the
same way, the app should lead with the engineering.

#### Why — physiology / psychology

This is empirical, not traditional. Furniture, television and appliance tip-overs are a
well-documented injury category: the US Consumer Product Safety Commission reports that nearly
80 percent of tip-over fatalities involve children five and under, and the STURDY Act (enacted
December 2022) led CPSC to adopt ASTM F2057-23 as a mandatory stability standard for clothing
storage units, effective September 2023. Tall leaning mirrors are in the same hazard class as
unanchored dressers: high, front-heavy, climbable, and made of glass. Anchoring is the
intervention.

#### Customer insight

If we suggest a big leaning mirror, we will also tell you to strap it to the wall. With kids or
pets in the house that is not optional — a sheet of glass that size is heavy and it does not fail
gently.

#### Failure modes / when to skip

Never skipped for mirrors above the size and mass thresholds. In a rental where drilling is
forbidden and children are present, the correct output is the acrylic/safety-backed swap or "do
not add this mirror at all" — not an unrestrained tall mirror. This rule outranks every mirror
cure in this file.

---

### Mirror for daylight bounce in a dark room or narrow corridor

```yaml
id: FS-CURE-022
title: Mirror positioned to bounce daylight into a dark room or long corridor
system: lighting.daylight
group: mirrors
version: 1
status: active
applies_to:
  rooms: [hallway_corridor, entry_foyer, stair_core, bathroom_full, powder_room, home_office, living_room, basement_finished, reach_in_closet, breakfast_nook, laundry_room]
  objects: [decor.mirror.wall, decor.mirror.leaning]
  requires_features: []
scope: lighting
severity: low
confidence: evidence_moderate
evidence_class: mixed
belief_gated: false
predicate: |
  require daylightAccess(room.centroid) <= p.dark_room_threshold
  let win = brightestOpening(room) or brightestOpening(adjacentRoom(room))
  assert exists m in objects where type matches "decor.mirror.*"
      and angleBetween(m.normalAxis, bearingTo(win)) <= p.bounce_angle_deg
      and illuminanceGain(room, m) >= p.min_illuminance_gain_pct
      and glareRisk(primarySeat(room), m) <= p.max_glare
      and reflects(m, bedOf(room)) == false
  prefer isOnWall(m, wallPerpendicularTo(win)) == true
  prefer straightRunLength(room.longAxis) >= p.corridor_min_run_m and isOnWall(m, room.endWall) == false
params:
  - key: dark_room_threshold
    default: 0.25
    range: [0.05, 0.60]
    unit: ratio
    user_editable: true
    rationale: "Daylight-access score below which a room is treated as daylight-poor and worth a bounce cure."
  - key: bounce_angle_deg
    default: 60.0
    range: [20.0, 85.0]
    unit: deg
    user_editable: true
    rationale: "Angular window relative to the mirror normal within which usable daylight is redirected."
  - key: min_illuminance_gain_pct
    default: 8.0
    range: [2.0, 30.0]
    unit: pct
    user_editable: true
    rationale: "A mirror must produce a real measurable gain to be proposed as a daylight cure rather than as decor."
  - key: max_glare
    default: 0.35
    range: [0.10, 0.60]
    unit: ratio
    user_editable: true
    rationale: "Direct sun bounced into a seat is worse than the original gloom."
  - key: corridor_min_run_m
    default: 4.000
    range: [2.500, 12.000]
    unit: m
    user_editable: true
    rationale: "Length at which a corridor reads as a tunnel and benefits from a side-wall mirror."
score:
  weight: 4
  curve: linear
  partial_credit: true
remedies:
  - rank: 1
    action: add_object
    add: decor.mirror.wall
    transform: {position: wall_perpendicular_to_brightest_opening, height_band: eye_level, avoid: end_wall_of_corridor}
    cost: under_250
    effort: low
    reversible: false
    rental_safe: false
    undo_cost: under_50
    copy: "A mirror on the wall beside the window, rather than opposite it, throws daylight down the room and makes a dim space feel open."
  - rank: 2
    action: add_object
    add: decor.mirror.leaning
    transform: {lean_against: side_wall, strap: required}
    cost: under_250
    effort: low
    reversible: true
    rental_safe: true
    undo_cost: free
    copy: "A leaning mirror does the same job with no drilling. Strap it so it cannot tip."
  - rank: 3
    action: change_finish
    target: finishes.wall
    transform: {increase_reflectance_to: 0.75, colour_family: warm_white}
    cost: under_250
    effort: moderate
    reversible: true
    rental_safe: false
    undo_cost: under_250
    copy: "Lighter wall paint does more for a dark corridor than any single mirror. Worth doing first if you can paint."
conflicts_with: [FS-CURE-013]
supersedes: []
requires_rules: []
tags: [mirror, daylight, corridor, dark_room, evidence_backed]
localization_notes: Bounce geometry depends on sun path and therefore on hemisphere and latitude; drive from the site's solar model, not from compass octant alone.
```

#### Why — tradition

Modern feng shui writing routinely recommends a mirror to "open up" a cramped hallway or a dark
room, and treats a long dark corridor as a place where `qi` stagnates. Classical practice says less
about corridors as such but agrees that dim, airless spaces are inauspicious. Note that this use
does conflict with `FS-CURE-013` if the mirror lands opposite the front door, so side-wall
placement is doing double duty here.

#### Why — psychology / physiology

This is one of the better-supported cures in the file. Daylight availability has documented
relationships with mood, alertness and circadian entrainment, and surface reflectance is a standard
lever in daylighting practice — a mirror is simply a specular high-reflectance surface. The gain
from a single mirror is modest compared with raising overall wall reflectance, which is why the
paint remedy ranks alongside it. The traditional `qi` framing needs no evidence because the
daylight framing has some.

#### Customer insight

Your hallway has no window of its own. A mirror on the side wall near the nearest window pushes
real daylight along it — and lighter paint on the walls does even more.

#### Failure modes / when to skip

Skip in bedrooms, where `FS-CURE-012` wins. Skip where the bounce would put direct sun into a
seated eye line or a screen. Never place at the far end of a corridor facing back along it if that
line ends at the front door (`FS-CURE-013`) or at a bathroom door (`FS-CURE-015`).

---
