# Drafted (drafted.ai) — Authoritative Clone Specification

**Status:** single source of truth for building the clone. Supersedes `screens-00..08.md`,
`web-site.md`, `web-stack.md`, `web-algorithms.md`, `web-opensource.md`.
**Compiled:** 2026‑09‑12 from 108 desktop screenshots (1920×1200, one continuous session),
9 forensic screen reports, 4 web-research reports, and the product's own public JS bundles.
**Author:** lead architect merge pass. Every claim below carries a confidence marker.

---

## 0. How to read this document

| Marker | Meaning |
|---|---|
| **[SHOT]** | Read directly off a screenshot in `/home/dell/Pictures/Screenshots/`. Highest confidence. Conflicts are resolved in favour of this. |
| **[CODE]** | Literal string / data structure read out of drafted.ai's own shipped JS bundle. Authoritative for catalogs (rooms, materials, roof shapes, tiers, tutorial copy). |
| **[PAGE]** | Verbatim from a public drafted.ai marketing/learn page. |
| **[DERIVED]** | Computed from [SHOT] data and verified against ≥3 independent observations. Treat as fact. |
| **[INFERRED]** | My reasoning. A chosen default. Implement it, but it is a decision, not an observation. |
| **[GAP]** | Genuinely unknown. §10 lists every one with the chosen default. |

Units: the product is **imperial-first**. All geometry is stored in **feet** (floats) or
**inches** (integers); all areas are **square feet**; all dimension strings render as
`38 ft 0 in` (panel/chips) or `12'6"` (on-plan labels). Metric is a display toggle only. **[CODE]**

---

## 1. Product overview

### 1.1 What it is

Drafted is an **AI residential floor-plan generator driven by structured inputs, not a text
prompt**. **[PAGE]** The user declares *what rooms they want* and *what shape the house is*;
the system synthesises complete single-storey floor plans — walls, doors, windows, room
labels, dimension strings — plus a live 3D massing model, then renders a painterly exterior
and exports CAD/BIM files.

> "Drafted's AI floor plan generator does not use a free-form text prompt; it generates plans
> from structured inputs including a room list, lot size, house shape, and optional room
> placements on a canvas." **[PAGE]** — /learn/faq

Hard product constraint: **single storey only**. Multi-storey/basement is a waitlist. **[CODE]**
Ceiling height is a fixed **10 ft 0 in**. **[SHOT]** **[CODE]**

### 1.2 The mental model (this is what the clone must make legible)

```
PROJECT  ("Morgan's Dreamhome")          ← persistent container: cover photo, team, designs
  └── CREATE RUN  (a ULID)               ← one pass through the 3-step wizard
        ├── 1. ROOM LIST   → a *program*: room types × counts × S/M/L size classes
        ├── 2. EDITOR      → a *footprint* (orthogonal polygon) + optional hand-placed rooms
        └── 3. RESULTS     → a *spread* of 5 variants A–E; pick one; choose materials; render
                                   └── DESIGN (numeric id) → DRAFT page (numeric id)
```

Four nouns the UI keeps in the user's head at all times:

1. **Rooms** — always shown as **area-proportional coloured tiles**, never as a plain list.
   The single most distinctive visual in the product: you *feel* relative room sizes.
2. **Area** — `Total ft² | Heated ft² | N Story` is pinned to the bottom of every wizard step
   and updates on every mutation.
3. **Capacity** — a meter warning that the AI has a hard ceiling on room-list complexity.
4. **Credits** — a `N left` pill in the nav; `Create` spends one.

### 1.3 The three-step wizard

Route slug → label map, literal from the bundle **[CODE]**:

```js
{ "room-list": "Create Room List", editor: "Place Rooms & Shape", review: "Results" }
```

| Step | Slug | What the user does | Primary CTA |
|---|---|---|---|
| 1 | `room-list` | Add room types with `+`/`−`, pick S/M/L, watch capacity & totals | `Continue with {only }N rooms ›` |
| 2 | `editor` | Choose/sculpt the house footprint, pick a roof, optionally drag rooms onto the canvas | `⚡ Create` (spends 1 credit) |
| 3 | `review` | Compare 5 variants A–E, edit doors/windows, pick exterior materials | `✨ Furnish & Render` (spends 1 render unit) |

The stepper is **navigable** — the user jumped from `/editor` straight to `3 Results` via the
stepper chip (focus ring visible). **[SHOT 15‑22‑01]**

---

## 2. Complete route map

Host: `www.drafted.ai`. Everything below `/app` is authenticated. **[SHOT]** **[CODE]**

### 2.1 App routes

| Route | Renders |
|---|---|
| `/app/studio` | **My Studio** — project list. Target of the nav house-icon link. **[GAP]** never opened. |
| `/app/studio/projects/{projectId}` | **Project hub**. `projectId` is a plain integer (`114312`). |
| `/app/studio/projects/{projectId}?materializingDesign={designId}&optimisticMaterializing=1&optimisticMaterializingStartedAt={epochMs}` | Project hub in optimistic "render in flight" state. Params are **stripped** by the client once the design resolves. |
| `/app/studio/projects/{projectId}/create/{runUlid}/room-list` | **Wizard step 1**. |
| `/app/studio/projects/{projectId}/create/{runUlid}/editor` | **Wizard step 2**. Shape modal, roof dropdown, tool switching, validation — all client state, **no route change**. |
| `/app/studio/projects/{projectId}/create/{runUlid}/review` | **Wizard step 3**, default/most-recent spread. |
| `/app/studio/projects/{projectId}/create/{runUlid}/review?spread={spreadUlid}` | Step 3 pinned to one generation batch. |
| `/app/studio/projects/{projectId}/create/{runUlid}/review?spread={spreadUlid}&slot={A\|B\|C\|D\|E}` | Step 3 with a variant selected. Selecting a slot **pushes** the param. |
| `/app/drafts/{draftId}` | **Draft detail page** — public-facing design page. Document title is SEO-shaped (`Free 3BR 4BA House Plan`). |
| `/app/drafts/{draftId}?origin=project&returnTo={urlencoded}` | Draft page entered from a project; the back-chevron label becomes the project name. |
| `/app/subscriptions` | Plans page. Target of the paywall `View` button. **[CODE]** **[GAP]** never opened. |
| `/app/checkout/*` | Stripe checkout. **[CODE]** (robots.txt) |
| `/app/create`, `/app/drafts/all`, `/admin/*`, `/auth`, `/sso-callback` | Other app surfaces named in robots.txt. **[CODE]** |

**`returnTo` chaining.** Any route may carry a `returnTo` that is itself a URL-encoded route
carrying its own encoded `returnTo` (double-encoded). Observed 3 levels deep:

```
/app/studio/projects/114312/create/{ULID}/editor
  ?returnTo=%2Fapp%2Fdrafts%2F142980%3Forigin%3Dproject%26returnTo%3D%252Fapp%252Fstudio%252Fprojects%252F114312
```
This is what makes the draft page's **Customize** button able to deep-link into the step‑2
editor and then bounce the user all the way back. **[SHOT 15‑16‑30]**

### 2.2 ID conventions

| Entity | Form | Example |
|---|---|---|
| Project | integer | `114312` |
| Create run ("timelineKey") | 26-char Crockford ULID | `01M2B203CPTDZ0S2DVMTQF8AVC` |
| Spread (one batch of 5) | 26-char ULID | `01M2B2SW8C79DMQBB68ARGFKK2`, `01M2B389GZ4YAE7QN878Y1906B` |
| Design | integer | `85440`, `85454` |
| Draft | integer | `142980` |
| Variant slot | single letter | `A`–`E` |

### 2.3 Public / marketing routes (out of clone scope, listed for completeness) **[PAGE]**

`/` · `/house-plans` (gallery, 85,000+ plans, filters Bedrooms/Bathrooms/Heated Area/Character/Shape)
· `/revit` · `/onboarding` (persona picker) · `/learn` + ~25 learn articles · `/learn/faq`.
`/pricing`, `/about`, `/terms`, `/privacy` **do not exist** (404).

### 2.4 Backend endpoints named in the bundle **[CODE]**

`/api/explore-plan-count` (returns `{"totalCount":140474}`) · `/api/outage-message` ·
`/api/house-shapes-v2/current-manifest` · `/api/community-drafts` · `/api/aura/room-location` ·
`/api/collab-session-end` · `/api/creator-profile` · `/api/explore-click` ·
`/api/explore-impressions` · `/api/subscriptions-v2/{checkout,checkout/prepare,country-context,pricing-quote,usage-overage-checkout}` ·
`/api/subscriptions-v2/export-bundles/{checkout,prepare}`.

---

## 3. Screen-by-screen specification

### 3.0 The application shell (present on every `/app` route)

**Top navigation bar.** Height **≈ 48–56 px**, background `#FAF9F2`, 1 px bottom hairline,
full-bleed. **[SHOT]**

Left cluster, in order:
1. **`Drafted` wordmark** — DM Serif Display 400, ~22 px, near-black `#1C1917`, with a
   decorative swash sweeping under `-ed`. Links to app root.
2. **🏠 `My Studio`** — outline house icon + label, set in the **serif** face. Underlined when
   the studio/project section is the active route.
3. Thin vertical divider `|`.
4. **Contextual back control.** Label is route-dependent:
   - `‹ Back` — on `/editor` when entered fresh, and on step 1.
   - `‹ Create Room List` — on `/editor` (names the *previous* wizard step).
   - `‹ Place Rooms & Shape` — on `/review`.
   - `‹ Morgan's Dreamhome` — on `/app/drafts/{id}` (names the parent project).
   - On the **project hub** this slot is instead a two-line **project switcher**: tiny
     uppercase grey `PROJECT` over bold serif `Morgan's Dreamhome ⌄`.

Centre: **3-step stepper**, horizontally centred, three numbered circle chips joined by
em-dash rules.
- Active: solid `#1C1917` circle, white numeral, **bold** near-black label.
- Inactive: grey `#C8C6C2` circle, white numeral, grey label.
- Chips are clickable; a focus ring renders on keyboard/click activation. **[SHOT]**

Right cluster:
5. **`Learn`** — outlined pill, open-book icon + label. Opens the product tour / help. **[GAP]**
6. **Credits pill** — outlined pill: gold four-point sparkle + a short horizontal meter track
   + `{n} left`. Observed `5 left`, `4 left`. The track fills with a gold segment as credits
   are spent. It is a **button** that opens a `Monthly usage` popover (§7.1).
   `aria-label = "Open monthly usage, {n} left for Plans and 3D"`. **[CODE]**
7. **Avatar** — 36 px solid black circle, white bold initials (`NA`). Account menu. **[GAP]**

On the project hub, once scrolled, the nav collapses into a **sticky variant** that promotes
`My Designs (N)` + the `+ ✨ New Design` button into the bar. **[SHOT 15‑23‑20]**

**Floating support launcher.** Intercom-style dark circular button, fixed bottom-right
(≈ 30 px inset), above all content. Hidden on touch screens < 768 px. **[CODE]** **[SHOT]**

---

### 3.1 Wizard Step 1 — Create Room List  (`/room-list`)

#### Layout (at 1548 × 1050 CSS viewport) **[SHOT]**

```
┌─ nav ───────────────────────────────────────────────────────────────────────┐
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──── Room Catalog card ─────────────────────────┐  ┌── My Rooms panel ──┐ │
│  │ header: ▣ Room Catalog          [🗑 Clear All] │  │ 👥 My Rooms  N Rooms│ │
│  │────────────────────────────────────────────────│  │            [✎ 1 Story]│
│  │ ┌ catalog list ┐│┌──── 3D preview stage ─────┐ │  │─────────────────────│ │
│  │ │ scrollable   │││   isometric line render   │ │  │  area-proportional  │ │
│  │ │ ~300 px      │││   + proportional chip(s)  │ │  │  tile mosaic        │ │
│  │ │              │││                           │ │  │  (wraps, bottom-    │ │
│  │ └──────────────┘│└───────────────────────────┘ │  │   aligned per row)  │ │
│  │ footer: [icon] Room Name            S [M] L    │  │─────────────────────│ │
│  └────────────────────────────────────────────────┘  │ Room List Capacity ⓘ│ │
│      ≈ 62 % of viewport width                        │  N% Filled  ●  ▓▓░░ │ │
│                                                      └─────────────────────┘ │
│                                                      ┌─ summary + CTA ─────┐ │
│                                                      │ Total N | Heated N  │ │
│                                                      │        | 1 Story    │ │
│                                                      │ [▦ Continue with…›] │ │
└──────────────────────────────────────────────────────└─────────────────────┘─┘
                                                          ≈ 21 % of width
```

Measured: Room Catalog card `x 485→1443` (958 px, ~62 %), My Rooms panel `x 1450→1782`
(332 px, ~21 %), summary card `x 1450→1790, y 1050→1170` (floats over the bottom of the
panel). Catalog list column `x 501→789`; preview stage `x 798→1437`. **[SHOT]**

#### 3.1.1 Room Catalog card

**Header** (y ≈ 240–292): faceted 3D-cube outline icon + **`Room Catalog`** (bold sans, 17 px)
on the left; **`🗑 Clear All`** outlined pill (1 px grey border, white fill, trash icon + bold
label) on the right. 1 px hairline divider beneath. **[SHOT]**

`Clear All` empties the entire room list. **[GAP]** confirmation dialog unknown → **default:
show a small confirm popover** ("Clear all rooms? This can't be undone." / Cancel / Clear All).

**Catalog list.** Native vertical scroll with a custom scrollbar at `x ≈ 789–798`, plus small
triangular **▲ / ▼ scroll-affordance buttons** at the top and bottom of the track. **[SHOT]**

**Category group header** = a `≡` three-bar grip glyph + a grey medium-weight label.
Five groups, fixed order: **[SHOT]** **[CODE]**

1. `Beds & Baths`
2. `Living Spaces`
3. `Outdoor Spaces`
4. `Specialty Spaces`
5. `Garage & Utility`

**[GAP]** The `≡` grip's behaviour (drag-to-reorder vs collapse) was never exercised →
**default: drag-to-reorder groups**, persisted per project, with a collapse-on-click fallback
disabled. Low value; ship it non-functional (decorative) behind a flag if time is short.

**Family accent rail.** A **4 px wide, fully rounded vertical bar** at `x ≈ 529–535`, inset
from the row, spanning a *contiguous run of same-family rows* — **not** the whole category.
Example inside `Beds & Baths`: one salmon rail spans Primary Bed + Bedroom, one blue rail
spans Primary Bath + Bathroom, one peach rail spans Primary Closet + Bed Closet. **[SHOT]**

**Room row.** 48 px pitch (single line) / ~60 px (with sub-label), radius ~10 px.

```
[family rail] [monoline room icon] [Room Name]            [count control]
                                    [grey truncated sub-label]
```

Count control states:

| State | Control | Row treatment |
|---|---|---|
| count = 0 | single circular outline **`⊕`** | white bg, regular-weight label |
| count ≥ 1 | **`⊖  N  ⊕`** stepper (24 px outline circles) | family-tinted bg, **bold** label |
| at minimum (`Primary Bed` = 1, `Primary Closet` = 1) | `⊖` greyed/disabled | as above |
| at per-type max | `⊖  N  [MAX]` — a **dark-grey `#78716B` pill, white uppercase letter-spaced `MAX`** replaces `⊕` | as above |
| auto-derived (`Bed Closet`) | **no `⊖` at all**, count shown, `⊕` ghosted/disabled | as above |
| premium-locked (`Den`, `Family Room`, `Sunroom`) | circular outline **padlock** button | inside the upsell sub-card |

Sub-label (small grey, 11 px, ellipsis-truncated): `Auto-included wit…` (Primary Closet),
`Auto-included with Bed…` (Bed Closet). Full text is `Auto-included with Primary Bed` /
`Auto-included with Bedroom`. **[CODE]** Truncation is a real CSS truncation of the full
string — reproduce it (and add a `title` tooltip).

Row interaction states:
- **Hover (unlocked)**: ~50 % tint of the family colour + a **2 px near-black rounded ring**
  around the whole row. Observed hover tints: Living `#FEF5D8`, Front Porch `#ECFBEC`,
  Office `#FEEDF5`, Garage `#F8F3F6`, Laundry `#EEFCF8`, Mudroom `#F9F9F9`, Utility Closet
  `#F4F4F4`. **[SHOT]**
- **Hover (locked)**: pale tint only (`#FCF2D0`), **no dark ring**. **[SHOT]**
- **Selected** (the row currently driving the preview): dark rounded ring, persists after the
  pointer leaves and **even after that row's count returns to 0**. **[SHOT]**
- Circular `⊕`/`⊖` under the cursor get their own light circular halo.

**Inline paywall sub-card.** Nested *inside* the `Living Spaces` group, between `Living` and
`Foyer`. Cream fill `#FBF8EE`, 1 px gold border `#E9C360`, radius ~12. **[SHOT]** **[CODE]**
- Top-left: **`UPGRADE SUBSCRIPTION`** pill — uppercase, letter-spaced ~10 px bold,
  text `#695719` on fill `#F3E5AC` with border `#D2B96C`. **[CODE]**
- Top-right: **`View`** — solid black rounded-rect button → `router.push("/app/subscriptions")`.
- Then the three locked rows, each `[icon] [name] … [🔒]`.
- Locked rows remain **fully hoverable and previewable** (3D render + size ladder) but
  produce **no capacity delta** and cannot be added.
- Each locked row's `aria-label` = `View plans to add {displayName}`. **[CODE]**

#### 3.1.2 3D room preview stage

- Large **isometric hand-drafted line-art cut-away**, ~350–420 px tall, centred. Thin black
  strokes on white, light-grey wall shading, soft cast shadow, architectural **dimension
  extension ticks** along the two visible floor edges (no numeric labels at this step).
- **The floor plane is flood-filled with the room family's colour** — this is the colour
  coding thread that ties catalog ↔ preview ↔ My Rooms ↔ generated plan.
- Renders are distinct **per (room type × size class)** — larger sizes gain furniture and
  windows, they are not scaled copies. Verified across Dining S/M/L (4→6→8 seats + sideboard),
  Kitchen S/M/L (galley → island+4 stools → full U + island + sink), Living S/M/L,
  Primary Bathroom S/M/L (adds a freestanding tub at L). **[SHOT]**
- **Floating proportional chip(s)** overlaid low-centre: a rounded square whose **side length
  is proportional to √area** (measured constant **≈ 6.83 px per √ft²**), filled with the room
  family colour, containing bold room name over `{S|M|L} - {n} ft²` in grey. Small rooms wrap
  to 2–3 lines. **[SHOT]**
- **Companion chip**: when the previewed room auto-includes a child, a second smaller
  proportional chip renders beside it (Primary Bedroom + Primary Closet; Bedroom + `Closet`).
- Canvas chips use the **short/display** name where the catalog uses the long one:
  `Primary Bed` → `Primary Bedroom`, `Primary Bath` → `Primary Bathroom`,
  `Breakfast Nook` → `Nook`, `Bed Closet` → `Closet` (in companion position).

**Stage footer bar** (y ≈ 1085–1120): room icon + bold room name on the left; **`S` `M` `L`**
segmented size selector on the right (three ~32 px cells).

| Selector state | Rendering |
|---|---|
| selected | solid black rounded square (~8 px radius), white bold letter |
| hovered | white rounded square with a 1 px grey border (rendered **independently** of the black selected cell) |
| focused (just clicked) | selected fill + a light focus ring |
| idle | plain grey bold letter, no chrome |

**Semantics of S/M/L — resolved, and this matters.** **[SHOT × 9 frames]**
- **Hover** live-previews: the 3D render, the chip size and the `{SIZE} - {n} ft²` caption all
  follow the *hovered* cell. Nothing commits.
- **Click** moves the black fill. It does **not** resize any already-added instance and does
  **not** change My Rooms, totals or capacity — verified three separate times (Dining, Pantry,
  Living) where flipping S→M→L left every downstream number byte-identical.
- The selection is a **single global sticky preference**, carried across room types
  (`M` → user clicked `S` on Primary Bed → Bathroom and Primary Bathroom both opened on `S`).
- **[GAP]** Whether the committed selection governs the size of the *next* added room is
  ambiguous: rooms added while `S` was selected landed on `L` in one batch and on `S` in
  another. **Chosen default:** the S/M/L control is **preview-only**; the size of a newly
  added instance is chosen by an **auto-sizing heuristic** (§3.1.3).

#### 3.1.3 My Rooms panel

Header: a 4-circle / group outline icon + **`My Rooms`** (bold), then a grey live count
**`N Rooms`**, a `|` divider, and an outlined pill **`✎ 1 Story`**. **[SHOT 14‑58‑33]**

The `1 Story` pill: `aria-label = "Story count: 1. Learn about multi-story homes"`,
`title = "Story count"`. Clicking it fires `trackMultistoryWaitlistOpened(...)` and opens the
**Multistory Waitlist modal**: *"Join waitlist to get early access to multi-story and basement
designs."* / "Join Waitlist" / "You're on the waitlist." / "We only support single-story homes
for now." **[CODE]** It is **not** a story-count editor.

**Tile mosaic.** Each room *instance* is a rounded square (radius ~10 px) whose **side length
is proportional to √area**, clamped to a **~54 px minimum**, filled with the room family
colour, laid out in **wrapping rows in catalog order** and **bottom-aligned within each row**.
Measured: 225 ft² → 105 px, 152 → 82, 104 → 67, 62 → 58, everything ≤ 52 ft² → 54 px floor.
Same √-scale constant as the preview chip. **[SHOT]**

Tile label: bold room name (wraps to 2 lines) over `{S|M|L} {n} ft²` in grey.
**Note the punctuation difference:** My Rooms tiles use `M 225 ft²` (no dash); preview chips
use `M - 225 ft²` (with dash). Reproduce it. **[SHOT]**

"Primary X" variants render in a **deeper, more saturated** shade of the family colour than
the plain variant.

**Auto-generated `Hallway` tile.** Appears once the program warrants circulation, always
size `M`, area recomputed on **every** list mutation (observed 23 → 26 → 35 → 36 → 39 → 41 →
45 → 46 → 58 ft²), has **no catalog row**, and is **excluded from the room count**. **[SHOT]**
Internally `circulation`, display `Hallway`, count AI-managed and bounded by
`MAX_MANAGED_HALLWAYS`. **[CODE]**

**Room List Capacity footer** (pinned above a hairline at the panel bottom):
```
Room List Capacity ⓘ                 28% Filled  [+3%]  ●
▓▓▓▓▓▓▓▓▓▒▒░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```
- Label bold 14 px + a 16 px circled-`i` tooltip trigger.
- Tooltip copy, verbatim: **"Our AI has a limit on how many rooms it can process currently."** **[CODE]**
- Readout `{n}% Filled` in grey, an optional bold black **`+N%`** delta, and a solid status dot.
- Status dot / bar colour: **green** normally, **yellow at ≤ 15 % remaining**, **red at ≤ 0 %
  or over limit**. **[CODE]** Green sampled `#22C55E` (dot `#08943D`, fill `#6AAE7E`). **[SHOT]**
- Bar: 6 px fully-rounded, track `#E4E4E2`, ~273 px wide.
- **Hover forecast:** hovering an *addable* catalog row appends a **darker-green segment sized
  exactly to the delta** and shows the `+N%` badge. Pixel-verified: +3 % = 8 px, +4 % = 11 px,
  +5 % = 14 px, +6 % = 16 px of a 273 px track. Hovering a locked or auto-derived row
  suppresses both. **[SHOT]**
- A second render variant showing `{n}% Remaining` exists in the code; the `% Filled` variant
  is the one shipped in every observed frame. **[CODE]**

#### 3.1.4 Summary + Continue card

```
Total 1,015 ft²  |  Heated 1,015 ft²  |  1 Story
[▦  Continue with 12 rooms                              › ]
```
- Three metrics, grey labels + **bold black** values, separated by thin vertical rules.
  Comma thousands separator, true superscript `²`.
- CTA: full-width black pill (radius ~10–12 px), white bold ~17 px label, a **2×2 grid glyph**
  on the left and a `›` chevron on the right.
- **Copy is nag-ware and count-interpolated**: `Continue with only {n} rooms` for
  n ≤ 10, `Continue with {n} rooms` for n ≥ 11. Threshold verified at the 10→11 boundary
  (11 rooms → "only" disappears; then 11 again later → "only" reappears… see §10). **[SHOT]**
  **[DERIVED]** Implement the threshold as `n < 11 → "only"`.
- **Guard modal** when the list is too thin: *"Please create a full room list."* /
  *"Partial room lists will generate incorrect results."*; other strings:
  *"A complete room list helps us create better designs."*, *"Add rooms to continue"*,
  *"Add a closet"*. **[CODE]**
- The card **auto-hides** while a modal owns the step. **[SHOT]**

#### 3.1.5 Step-1 arithmetic — all verified

| Quantity | Rule | Evidence |
|---|---|---|
| **Room count** | Σ of catalog counters. **Excludes** the auto Hallway. Includes auto-included children (Primary Closet, Bed Closet). | 5 tiles → "4 rooms"; 6 → 5; 9 → 8; 10 → 9; 13 → 12 **[SHOT]** |
| **Total ft²** | `round(Σ(all instance areas incl. Hallway) × 1.047)` | 730→765, 758→794, 869→911, 969→1015 — ratio 1.047–1.048 across 4 states **[DERIVED]** |
| — equivalent reading | `Σ(visible tiles) + hallwayArea` matches every frame exactly | both readings fit; the ×1.047 gross-up is the one to implement (it generalises) |
| **Heated ft²** | `Total − Σ(area of unheated rooms)`. Unheated = Garage, Front Porch, Outdoor Living, Pool. Equal to Total in every step-1 frame because none were added. | Step 2 showed `Total 2,694 / Heated 2,013` (Δ 681 = the garage). **[SHOT]** |
| **Story** | always `1`. | **[SHOT]** **[CODE]** |
| **Capacity %** | a weighted token budget, **not** linear in area and **not** purely count-based. See §7.2. | deltas 309 ft²→+3 %, 142→+5 %, 229→+6 %, 775→+4 % **[SHOT]** |
| **Hallway area** | recomputed on every mutation; grows and shrinks with the program. | 39→45→46→58 ft² **[SHOT]** |
| **Auto-included child size** | inherits the **parent instance's** size class (Bedroom S 104 → Bed Closet S 11; Bedroom M 152 → Bed Closet M 23). | **[SHOT]** |
| **Duplicate sizing** | two instances of the same type get **different** auto sizes (2 Bedrooms = M + S; 2 Primary Closets = M + S; 2 Bed Closets = M + S). | **[SHOT]** |

**[INFERRED] Auto-sizing heuristic for a newly added instance** (chosen default, matches all
observations): the *first* instance of a type gets `M`; the *second* gets `S`; the third gets
`L`; then cycle `M, S, L`. For types with a `max` of 1 (Kitchen, Living, Pantry, Nook) the
single instance may be added at `L` when the target area budget has headroom, otherwise `M`.

#### 3.1.6 Step-1 states

| State | Rendering |
|---|---|
| **Empty** (0 rooms) | My Rooms mosaic empty; capacity 0 %; Total/Heated `0 ft²`; CTA `Continue with only 0 rooms` (disabled → opens the "Please create a full room list" guard). |
| **Populated** | as above. |
| **Capacity warning** (≤ 15 % remaining) | dot + bar go **amber**; addable `⊕` still enabled. |
| **Capacity full** (0 % remaining) | dot + bar **red**; every `⊕` disabled with tooltip reason key `overTokenBudget`; generic guard "All supported room types are already at their limit." **[CODE]** |
| **Loading** | **[GAP]** never observed → **default:** skeleton rows in the catalog, spinner in the preview stage, `—` in every metric. |
| **Error** | **[GAP]** → **default:** an inline amber card above the CTA with a Retry button. |

---

### 3.2 Wizard Step 2 — Place Rooms & Shape  (`/editor`)

#### Layout **[SHOT]**

```
┌─ nav ────────────────────────────────────────────────────────────────────────┐
│        ┌──────── floating canvas toolbar (4 pill groups) ────────┐           │
│ ┌─ left panel ─┐          Back                                                │
│ │ My Rooms     │   ┌──────── sage grid canvas (≈740×740 square) ─────┐       │
│ │   OR         │ L │                                                 │  R    │
│ │ My House     │ e │      footprint polygon / placed room blocks     │  i    │
│ │ Shape        │ f │                                                 │  g    │
│ │ ≈316 px      │ t │                                                 │  h    │
│ └──────────────┘   └─────────────────────────────────────────────────┘  t    │
│                             Front                  ┌── 3D massing card ──┐   │
│                    ┌─ Total|Heated|Story ─┐        │  ≈360×360, bottom-  │   │
│                    │     [⚡ Create]      │        │  right, 30 px inset │   │
│                    └──────────────────────┘        └─────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

**The left panel is tool-dependent:** `Rooms` tool → **My Rooms**; `Shape` tool → **My House
Shape**. The panel swaps, the route does not change. **[SHOT]**

#### 3.2.1 Canvas toolbar — four pill groups, centred at `y ≈ 218–252`

| Group | Contents |
|---|---|
| **1. Tool mode** (one rounded container, 4 buttons) | ① map-pin-in-square = **Site / Lot** · ② polygon/footprint = **Shape** · ③ box-with-corner-nodes = **Rooms** · ④ outline house = **House / Roof** |
| **2. View** | zoom-out (magnifier−) · zoom-in (magnifier+) · reset view (circular ccw arrow) |
| **3. History** | undo `↶` · redo `↷` · **`◇ Reset ⌄`** split/dropdown with an eraser icon |
| **4. Snap** | **`🧲 Snap`** toggle pill — mint fill `#81A396`-family + dark-green icon+label when ON (default ON) |

Rules:
- Only the **active** tool renders its text label; the other three are icon-only. Active tool
  gets a **gold outline + cream/amber tinted fill** (`#F5F0DF` + gold border). **[SHOT]**
- The **Roof/House tool only appears once a house shape exists** — 3 buttons before, 4 after.
  **[SHOT 15‑10‑05 vs 15‑10‑42]**
- Undo/Redo are disabled with empty history; undo lights up after the first edit. **[SHOT]**
- Editor-mode labels in the code: `Constrain Lot` / `Constrain Footprint` / `Constrain Rooms`
  / `Edit Roof`. **[CODE]**
- **[GAP]** `Reset ⌄` menu contents → **default:** `Reset view`, `Clear rooms from canvas`,
  `Reset shape`, `Reset everything`. Code strings that exist: *"Reset Canvas"*, *"Clear Rooms
  from Canvas"*, *"Starting over?"*. **[CODE]**
- **[GAP]** The Site/Lot tool panel was never opened → **default:** a `Buildable Area` panel
  with `Width` / `Depth` numeric fields and a `Target Home Size` knob in **250 sq ft
  increments** plus a type-exact field — all of which are real code strings. **[CODE]**
  Validation strings for it: *"Buildable Area is too small for your house."*, *"Home Size is
  too large for this Buildable Area"*, *"Home Size is nearing this Buildable Area's
  capacity"*, *"Home Size is at this Buildable Area's capacity"*, *"Can't shrink further,
  unless you reduce your rooms."*, help text *"The usable area available for the home, if
  known."* / *"The usable area inside setbacks. Keep this separate from the overall lot
  size."* **[CODE]**

#### 3.2.2 The canvas

- **Ground:** sage/olive tint `#DEE2D6`, a fixed-aspect **square** viewport ≈ 740 × 740 px.
- **Grid:** two-level — fine dotted minor grid + heavier dashed major gridlines every ~5 minor
  cells — plus a solid darker **centre cross-hair** (one vertical, one horizontal).
- **Orientation labels** printed *outside* the canvas in grey sans: `Back` (top centre),
  `Left` (left middle), `Right` (right middle), `Front` (bottom centre). The 3D card
  overlaps and clips the `Right` label. **[SHOT]**
- **Empty state:** a soft blurred radial pink/lavender/peach **heat wash** over the centre —
  a density hint of where the AI intends to put mass. **[SHOT 15‑10‑05]**

#### 3.2.3 My Rooms panel (Rooms tool)

- Header: group icon + **`My Rooms`** + outlined **`＋ Add Rooms`** pill (returns to step 1).
- **`AI-Create Mix`** block:
  - Row: bold `AI-Create Mix` left; gold/ochre preset label **`Best Balance`** right, with a
    small gold tick-bar and a **▼ marker** on the track at the recommended position (~88 %).
  - A single horizontal **slider track**, rounded, filled with a left-to-right gradient. The
    gradient hue *shifts with the value*: pink→lavender→periwinkle→pale-blue at 100 %,
    lavender→pale-blue→mint at 94 %. **[SHOT]**
  - Legend row: **`⚡ {n}% AI-Create`** (gold, lightning) · **`✋ {n}% Placed by You`** (grey,
    palm). Observed 100/0, 94/6, 88/12, 0/100.
  - **[DERIVED]** The mix is **computed from how many rooms the user has placed**, and the
    slider is the control that trades them off. 1 of 17 placed → 94/6; 2 of 17 → 88/12;
    19 of 19 → 0/100. So `placedPct = round(placedRooms / totalRooms × 100)`.
  - **[GAP]** What dragging the slider *does* (auto-place rooms? bias the generator?) →
    **default:** it sets a target; raising `% Placed by You` auto-places the highest-priority
    unplaced rooms at AI-suggested positions, lowering it un-places the most recently placed.
  - **[GAP]** Other preset labels besides `Best Balance` → **default:** `All AI`, `Mostly AI`,
    `Best Balance`, `Mostly You`, `All You`.
- **`✋ Placed by You`** section header + right-aligned count (`0 Rooms` / `1 Room` / `19 Rooms`).
  - **Empty state:** a pale sage rounded panel with centred italic grey copy:
    *"Place rooms on canvas to control their specific location and shape."*
  - **Populated:** each placed room renders as a **scaled outline of its actual polygon**
    filled with its category colour, with the bold room name and the status word **`Placed`**
    (no ft² in this bucket). Hovering a card reveals a floating **red-outlined `🗑 Delete`
    pill** overlapping its right edge. **[SHOT 15‑17‑10]**
- **`⚡ AI-Create`** section header + right-aligned count (`17 Rooms` → `16 Rooms` as rooms move
  buckets). Renders the same **area-proportional chip grid** as step 1 (`Name` over
  `{S|M|L} {n} ft²`), wrapping, sorted largest-first, grouped visually by family.
- The list region scrolls with a visible scrollbar and a down-caret affordance.
- **Drag a chip onto the canvas** to place it (§3.2.4).

#### 3.2.4 Room placement on the canvas

While dragging: **[SHOT 15‑11‑49]**
1. The footprint interior fills with a soft pink/peach **placement heat map**.
2. **Dashed organic blob outlines** (amoeba-shaped, grey dashed stroke) mark the
   **AI-suggested placement zones** for the room being dragged — typically 2 blobs.
3. During the tutorial, a **dashed black leader arrow** is drawn from the source chip into
   the footprint.

A placed room renders on the canvas as a filled rectilinear block with:
- a **teal/green stroke** (= placed by you; also the selection colour),
- a category glyph (car = Garage, shower head = Bathroom, sofa = Living, …),
- bold room name,
- caption `{S|M|L} | {n} ft²` (e.g. `Living  L | 504 ft²`, `Garage  M | 441 ft²`).
Small rooms (baths, closets, pantry, hallway connectors) render **icon-only**, no label.
Hallway connectors carry a bow-tie `⋈` glyph. **[SHOT]**

**Placed rooms are auto-resized when the footprint changes** (Garage 487 ft² → 441 ft² when a
new shape was applied). **[SHOT]** Door swing arcs are drawn on the editor canvas where doors
attach.

#### 3.2.5 Bottom summary + Create

`Total {n} ft² | Heated {n} ft² | {n} Story` over a full-width black **`⚡ Create`** button
(gold lightning glyph; a **gold 2 px ring** when it is the tutorial target or the primary
next action). Pressing it **spends one generation credit** (`5 left` → `4 left`, and a gold
dot appears in the pill track) and navigates to `/review?spread={newUlid}`. **[SHOT]**

#### 3.2.6 Validation — two severity tiers (this replaces the Create button)

**Tier 1 — blocking (red).** **[SHOT 15‑18‑48]**
```
┌──────────────────────────────────────────┐
│ ⚠ Fix 13 issues before creating          │  ← red header strip, white text
├──────────────────────────────────────────┤
│ ISSUE 1 OF 13                            │  ← uppercase grey eyebrow
│ Move Bathroom, Bedroom, and 11 more      │
│ inside the house shape                   │
│ [ ◎ Show issue ]                         │  ← full-width outlined button
└──────────────────────────────────────────┘
```
- Offending geometry on canvas: **red diagonal-hatch fill + red stroke**, retaining a ghost of
  the room's own colour; each carries a **red circular `!` badge with a downward pointer**.
- `Show issue` locates/zooms to the offending geometry and advances the issue queue.
- The `⚡ Create` button is **replaced**, not merely disabled.

**Tier 2 — advisory (amber).** **[SHOT 15‑21‑23]**
```
⚠ Increase shape or decrease rooms.
[⚡]  [ ⌂ Choose Different Shape ]
```
Cream/amber card with a gold border. The small dark rounded-square **⚡ button is an AI
auto-fix** (resize the shape / trim the program). The Create CTA is again replaced.

**[INFERRED] Validation rule set to implement:**
1. Every placed room must lie entirely inside the footprint. (blocking)
2. Σ(program area) must fit the footprint with circulation allowance. (advisory)
3. No placed room may overlap another. (blocking)
4. Footprint must be a simple, non-self-intersecting orthogonal polygon. (blocking)
5. Footprint must satisfy min area for the program. (advisory)

---

### 3.3 The House-Shape sub-flow (Step 2, Shape tool) — full spec in §5.

### 3.4 Wizard Step 3 — Results  (`/review`)

#### Layout **[SHOT 15‑12‑08 … 15‑12‑42]**

```
┌─ nav ────────────────────────────────────────────────────────────────────────┐
│                        [ zoom− zoom+ reset ]                                  │
│  ┌ New design ┐                                                               │
│  │    ( + )   │        ┌──── generated floor plan on the sage grid ────┐      │
│  └────────────┘        │                                               │      │
│  ┌ spread card ┐  ⌃    │                                               │  ┌───┴───┐
│  │[Latest][5/5]│  ⌄    │                                               │  │3D card│
│  │  thumbnail  │       └───────────────────────────────────────────────┘  │ badge │
│  │ [✎ Edit plan]│                                                          │  A    │
│  └─────────────┘                                                           └───────┘
│   Total … | Heated … | 15 Rooms                                                │
│                    Total 2,430 ft² | Heated 2,009 ft² | 18 Rooms               │
│                  [✎ Edit manually] [✨ Furnish & Render]                       │
│                     [A] [B] [C] [D] [E]                                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 3.4.1 Version / spread filmstrip (left rail)

- **`New design`** tile at the top: dashed-bordered square with a large white circular **`+`**
  and the caption `New design`. Starts another generation.
- **Spread cards**, newest first. Each carries:
  - top-left chip: **`Latest`** on the newest, otherwise a **date chip** (`Sep 12`);
  - top-right chip: **`{k}/5`** — designs finished in this spread (`0/5` → `1/5` → `5/5`);
  - body: a mini schematic of the footprint on the sage grid;
  - while generating: a dark scrim + spinner + **`◌ Generating`**, card dimmed;
  - when finished: a white pill button **`✎ Edit plan`** centred on the card;
  - footer caption: `Total 2,498 ft² | Heated 2,013 ft² | 15 Rooms` — **these are the input
    program's numbers**, distinct from the per-design numbers on the canvas bottom bar.
- Circular **`⌃` / `⌄`** buttons on the rail's right edge page between spread versions.

#### 3.4.2 Generation streaming states

| Phase | Canvas | Per-slot tile | 3D card | Bottom stats |
|---|---|---|---|---|
| kick-off | footprint outline only + centre pill `◌ Generating  0 of 5 ready` | all five spinners | badge `A`, spinner, **`Generating scheme A…`**, sub-line *"3D preview will start after the floor plan is ready."* | `Total 2,430 ft²  Heated --  -- Rooms` |
| plan A ready | full coloured plan renders | A shows a colour mini-plan | spinner + **`Building 3D model…`** | still `--` |
| 3D A ready | — | — | painterly/line elevation render | resolves: `Total 2,430 | Heated 2,009 | 18 Rooms` |
| all done | — | five distinct mini-plans | — | — |

The counter pill reads `{k} of 5 ready` and the spread badge tracks `{k}/5`.

#### 3.4.3 Variant slot strip (A–E)

Five square cards in a centred row, each with a **black circular letter badge** top-left.
Pending slots show a grey spinner; finished slots show a colour mini floor plan. The selected
slot gets a **2 px black border** and a slight lift. Clicking one:
- pushes `&slot={X}` onto the URL,
- swaps the canvas plan, the 3D render (badge letter changes) and the bottom stats.

Per-design stats genuinely differ between variants — e.g. A `2,430/2,009/18 Rooms`,
C `2,431/1,962/18 Rooms`, E `2,489/2,053/19 Rooms`. **[SHOT]**

#### 3.4.4 The generated floor plan renderer

This is the visual centrepiece. Required fidelity: **[SHOT]**
- **Walls** drawn as thick grey poché (`#818181`-ish) with a subtle drop shadow; double-line
  hatched walls at higher zoom.
- **Windows**: white gaps in the wall with two/three parallel lines across the break.
- **Doors**: a leaf line plus a **dashed quarter-circle swing arc**. Garage doors get a dashed
  travel path.
- **Room fills** by family (§9.4), matching the catalog colour system exactly.
- **Room labels**: two lines, centred, set in the **serif** face — bold room name over a
  lighter imperial dimension string `12'6" x 10'8"`. Rotated 90° in narrow rooms.
- Every room is labelled; rooms too small to fit a label fall back to name-only.

**Second render mode** (draft page): a **dimensioned schematic** — pastel room fills, no
furniture, wall poché, external **dimension strings** with chips like `12'6"`, `5'8"`, `4'8"`,
`14'6"`, `7'8"`, `5'10"`. **[SHOT 15‑16‑22]**

**Third render mode** (draft page + design cards): a **furnished colour plan raster** — the
same plan with furniture, fixtures, cars in the garage, and drop shadows. **[SHOT]**

#### 3.4.5 3D preview card (bottom-right, ≈ 360 × 360)

| Element | Detail |
|---|---|
| Badge | black disc + white variant letter (`A`…`E`), top-left |
| Model | isometric massing (editor) or a rendered exterior elevation (results) |
| `▲` marker | small solid black triangle beneath the model = front-of-house / orientation |
| ⌂ icon button | bottom-left — reset camera / home view |
| `⌂ Edit Roof` | replaces the ⌂ icon in the Shape tool — enters roof editing |
| `↻ Reset camera` | appears at the **top** of the card only after the user orbits |
| `⤢` expand | bottom-left in results — fullscreen the 3D view |
| Roof dropdown | bottom-right; collapsed `◇ Hip ⌄`, expanded `Roof Shape  ◇ Hip  ⌃` |
| ruler tab | a small scale-ruler/legend tick graphic on the card's left edge (results) |

#### 3.4.6 Openings editing mode

Entered from the results canvas. The toolbar becomes: **[SHOT 15‑20‑29]**

```
[zoom−][zoom+][reset] │ [🚪 Door] [▭ Window] [≣ Opening] │ [↶][↷]
```
Door / Window / Opening are **labelled insert tools**. Clicking an existing opening selects it
(blue selection rectangle + two round endpoint handles) and opens a context popover, ~270 px:

| Row | Controls |
|---|---|
| **Type** | 4 icon buttons: single-leaf swing · double/paired swing · double-hung/casement (**selected state = light-blue tinted tile**) · sliding/fixed (triple line) |
| **Flip** | flip-horizontal · flip-vertical |
| **Width** | `−` │ `5 ft 0 in` │ `+` (stepper; `−` greys at minimum) |
| **Move** | `«` │ `»` nudge along the wall (greys at travel limits) |
| **Align** | align-left-in-wall · centre-in-wall · align-right-in-wall |
| — | hairline divider |
| **Delete** | red `🗑 Delete` |

Bottom action bar becomes a single white pill containing **`✕ Cancel`** · **`✓ Apply`** ·
**`✨ Furnish & Render`**. The version filmstrip and the A–E strip are hidden in this mode.

#### 3.4.7 Results action bar

- **`✎ Edit manually`** — greyed while generating and **locked during the tutorial**.
  **[GAP]** its target UI → **default:** it enters the openings/wall editing mode described above.
- **`✨ Furnish & Render`** — black pill, always enabled once a slot is selected. Opens the
  **Choose Palette** modal (§6.5). No route change.

#### 3.4.8 Failure state **[CODE]**

> **"Generation Failed"** / *"Something went wrong while generating this draft. This can happen
> if the constraints were too difficult to satisfy."*

Render this per-slot (the slot tile shows a small red warning glyph) **and** as a canvas-level
card when all five fail, with a `Try again` button that re-runs without spending a credit.
**[INFERRED]** the no-recharge rule.

---

### 3.5 Choose Palette modal

Opened by `✨ Furnish & Render`. Full-screen dark scrim (~55 %), sheet `x 550→1725,
y 285→1045`, bg `#FAF8F2`, radius ~18, large soft shadow. **No route change.** **[SHOT]**

**Header** (hairline underline): white square **`‹` back button** + serif title
**`Choose Palette`**; centred tabs **`🎨 Default Palettes`** (active: near-black bold + 2 px
underline) and **`🔖 My Palettes`** (grey, bookmark icon); right: the **credits pill** repeated
(`✨ ▭ 1 left`).

**Body:** a horizontal **carousel**, 3 cards visible, with circular **`‹`** / **`›`** arrow
buttons floating over the content edges. **Arrow visibility is bounded by scroll position** —
`‹` hides at the start of the list. **[SHOT]**

**Palette card** = a **painterly watercolour house render** (~330 × 180) above a row of **five
material swatch chips** above the palette name (centred). The five chips are, in order:
primary wall/cladding · secondary siding · roof · window · door. They are **torn-edge painted
textures**, not flat squares.

**`Start fresh` tile** — first cell of the list: dashed-outline square with a large circular
grey `+`, grey caption. Authors a custom palette.

**Default palettes, in observed order** (8 + the create tile): **[SHOT]**
`Start fresh` · **Bright Stucco** · **Timber Slate** · **White Brick** · **Navy Classic** ·
**Brick Classic** · **Spanish Tiles** · **Prairie Stone** · **Classic Gray**.
The `›` arrow remains enabled after `Classic Gray` → the list probably continues. **[GAP]**

Swatch readings **[SHOT]**: *White Brick* = white brick / white brick variant / warm tan brick
/ white window / wood door. *Navy Classic* = navy paint / grey shingle siding / tan shake roof
/ white window / wood door. *Brick Classic* = red brick / off-white trim / charcoal roof /
white window / white-black door. *Spanish Tiles* = cream stucco ×2 / terracotta barrel tile /
black window / wood door. *Prairie Stone* = tan lap siding / stone veneer / charcoal roof /
white window / black door. *Classic Gray* = grey lap siding / mixed grey stone / charcoal roof
/ black window / (5th clipped).

---

### 3.6 Choose Materials modal

Reached by the `‹` back button from Choose Palette — i.e. **Palette is the shortcut, Materials
is the detail view**. **[SHOT 15‑13‑25]**

**Header:** `‹` back + serif **`Choose Materials`**; right: credits pill `1 left` and an
outlined **`⌷ Save Palette`** button (bookmark icon).

**Body, centred:**
- Serif heading **`Choose Exterior Materials`**
- Grey sub-line **`Complete all 5 categories to render.`**
- A row of **5 material tiles**, each a torn-paper/watercolour swatch with a **black circular
  ✓ badge** top-right when chosen, then the **category name** (bold) over the **selected
  material name** (grey):

| # | Category | Observed selection |
|---|---|---|
| 1 | **Cladding** | Beige / Sand |
| 2 | **Foundation** | Fieldstone |
| 3 | **Roofing** | Onyx Black |
| 4 | **Windows & Trim** | Putty / Almond |
| 5 | **Front Door** | Black |

- Primary CTA: **`✧ Furnish & Render`** — black pill, sparkle icon, centred. Disabled until
  all five categories carry a ✓.

Clicking a tile opens that slot's picker (**[GAP]**, never opened) → **default:** a grid of
swatches with the slot's category tabs along the top (§6.6), a back chevron, and per-step
subtitles: *"Choose your primary exterior material"*, *"Select your foundation material"*,
*"Select your roof material"*, *"Choose your window and trim package"*, *"Pick your front
door"*. **[CODE]**

**`Save Palette`** writes the current 5-slot combination to **My Palettes**; **`Load Palette`**
(on the draft page) reads from it. **[SHOT]** **[CODE]**

---

### 3.7 Render kick-off + project hub

**Blocking full-screen loader.** Pressing `Furnish & Render` replaces the entire app chrome
(nav, stepper, canvas) with a blank cream full-bleed surface holding a centred card: a
circular-arc spinner, serif **`Starting your render`**, grey sub-line
**`Thinking through your constraints.`** No controls. **[SHOT 15‑13‑35]**

Then the app **navigates out of the wizard** to
`/app/studio/projects/{id}?materializingDesign={designId}&optimisticMaterializing=1&optimisticMaterializingStartedAt={epochMs}`.

#### 3.7.1 Project hub layout — 3 columns **[SHOT 15‑14‑30, 15‑22‑29, 15‑23‑20]**

| Column | Width | Contents |
|---|---|---|
| Left | ≈ 280 px | Project card · Project Team card · My Designs nav card |
| Centre | fluid | `My Designs (N)` header + `+ ✨ New Design` · achievement banner · `New (n)` section · `Shortlisted (n)` · `Design Library (n)` |
| Right | ≈ 260 px | `Inspiration (n)` |

**Project card**
- **`Add Cover Photo`** dropzone: image icon, bold label, sub-label
  **`Click or drop image to upload`**. Click **or** drag-and-drop.
- Serif project title + a small outlined **✎ pencil** rename button.
- Headline stat: **`2,009 ft²`** (large) over caption `Heated Area`.
- Split stat row: 🛏 **`3`** `Beds` │ 🚿 **`3`** `Baths`.
- Footer strip: `Buildable Area` … **`Flexible`**. **[GAP]** what it opens → **default:** the
  Site/Lot buildable-area editor (§3.2.1).

**Project Team card** — header `Project Team` + outlined **`+ Invite`**; member rows:
avatar · name (`Nagrom A.`) · role (`Homeowner`) · an activity-count pill · green dot +
**`Now`** presence.

**My Designs nav card** — three selectable rows, selected = black fill / white text / trailing
`›`:
`✨ New (n)` · `🔖 Shortlisted (n)` · `▦ Design Library (n)`.

**Achievement / progress banner** (cream, gold hairline border) — a **gamified milestone
strip**: serif headline, a **progress dot chain** (`✓` gold done — `◌` gold ring in-progress —
`🔒` grey locked), themed illustration cards, and a **gold circular progress ring** on the
right. Banner catalogue **[CODE]**:

| Headline | Goal | Metric |
|---|---|---|
| "Design and render your first home in minutes." | 1 | Rendered Design |
| "Explore three different design directions." | 3 | Rendered Designs |
| "Remix your favorite house designs." | 1 | Remixes |
| "Shortlist your two favorite designs." | 2 | Shortlisted Designs |

Observed rings: `0/1` → `1/3` → `2/3`. Idea cards labelled `✨ Idea 1/2/3`. **[SHOT]**

**Design row card — materializing state**
- Header: serif name · avatar · author · amber pill **`Materializing`** · `· just now` ·
  optional `· 1 remix`.
- Body: faded skeleton + spinner + **`Preparing render`**, plus a floating progress card
  **`Preparing render`** with a determinate bar and a percentage (`11%`, `18%`).
- A faint colour plan thumbnail may already be visible behind the skeleton.

**Design row card — complete**
- Header: 🔖 bookmark (shortlist toggle) · serif **`Design 1`** · avatar · author ·
  relative time · `· 1 remix`; right: 🗑 delete icon **or** `⚡ Remix` + `⭳ Download Files`.
- Body, two panes: **left** = painterly watercolour exterior render with a small **gold ✨
  sparkle badge** top-left (AI-generated marker); **right** = the furnished colour floor plan
  raster.
- Metric strip, 4–5 columns, each icon + bold value over grey caption:
  `⌂ 2,053 ft² Heated Area` · `⬚ 2,489 ft² Total Area` ·
  `◈ 97 ft 10 in x 32 ft 0 in Width x Depth` · `🛏 3 Bed` · `🛁 4 Bath`.
- Actions: **`◎ View Design ›`** (outlined) and **`🔒 Public`** (gold outline, gold text,
  padlock) — a visibility badge/toggle.

**Empty states** **[SHOT]**
- `Shortlisted (0)` → a row reading 🔖 **`Shortlist your favorite designs.`**
- `Design Library (0)` → empty; when non-empty it is a **2-column card grid** whose cards show
  serif title, byline (avatar · author · `8m ago` · `1 remix`), the render, the furnished
  plan, and a footer chip cluster: `⌂ 2,053 ft²` · `⬚ 2,489 ft²` · `97 ft 10 in W x 32 ft 0 in D`
  · `3 bd` · `4 ba`. The grid ends with a **`Start New Design`** card (large grey circular `+`).
- `Inspiration (0)` → a large dashed placeholder card with a circular `+` and serif
  **`Explore Other Designs`** over a faint watercolour mid-century house illustration.

---

### 3.8 Draft detail page  (`/app/drafts/{id}`)

Document title is SEO-shaped: `Free 3BR 4BA House Plan`. **[SHOT]**

**Header**
- 🔖 bookmark icon + serif **H1** `3 Bed House Plan`
- Meta line: `Created by {avatar} {author} on 9/12/2026 · Pinned 0 times`
- Action row, right: **`🔒 Public`** (gold outline) · **`⚡ Remix`** (black) ·
  **`📄 Download Files`** (black) · **`⇪ Share`** (white outline)
- On scroll these **collapse into the sticky nav**. **[SHOT 15‑15‑03]**

**Hero** — full-width painterly exterior render.

**Right rail — `Materials` card**
- Header: serif `Materials` + outlined **`🎨 Load Palette`** + a bookmark icon button.
- Five rows, each: swatch thumbnail · bold material name · grey category · **✎ per-slot edit
  pencil**. Order matches `SLOT_ORDER`: Cladding, Foundation, Roofing, Windows & Trim, Front Door.
- Footer italic note: *"This design has 1 material palette options."* — reproduce the
  pluralisation bug or fix it; noting it so it isn't "discovered" later.

**Left column (stacked)**
1. **`About This Design`** — serif heading + an auto-generated prose description:
   > "This 3-bedroom, 4-bathroom ai-generated home spans 2,053 heated square feet in a
   > single-story layout. The open-concept floor plan features a living, a kitchen, and a
   > dining. The primary suite includes a … closet and an ensuite … 2 additional bedrooms …
   > Practical … include a laundry room … a garage. The home … approximately 98 feet … 32
   > feet deep."
   Implement as a template with slots for bed/bath counts, heated area, story count, the
   public-room list, primary-suite features, secondary bedroom count, service rooms, garage,
   and overall dimensions.
2. **`Rooms`** card — header `Rooms` + right-aligned count `19 rooms`. Rows: a **colour-coded
   rounded-square icon tile** + bold room name + `34 ft 4 in × 14 ft 4 in` dimensions, and a
   small **circle button on the right** (locate/highlight that room on the plan). Truncated
   at 13 rows with a **`⌄ 6 more rooms`** disclosure. **[SHOT]**

**Centre — plan viewer card**
- Toolbar: **zoom-out**, **zoom-in**, **`◌ Reset`** (disabled until zoomed/panned), and
  top-right **`⇩ Customize`** (outlined; fills black on hover).
- Content: the furnished colour plan, or the dimensioned schematic, depending on mode.
- While the plan is still generating: a **`◔ Preparing plan`** pill.
- Pressing `Customize` shows a centred **`◌ Opening creator…`** toast over the plan, flips the
  button to **`⇧ Overview`**, and deep-links to
  `/app/studio/projects/{pid}/create/{runUlid}/editor?returnTo={this page, encoded}`.

**Right rail — `Design Details`**
- A grey **3-D massing/line-art elevation thumbnail** on a green ground plane.
- `⬚ 2,489` **`ft² Total Area`** (large).
- **Area Breakdown**: `⌂ Heated Area 2,053 ft²` · `❄ Unheated Area 436 ft²` ·
  *(indented, grey)* `Garage 436 ft²`.
- **Dimensions**: `📏 Dimensions 98 ft 0 in × 32 ft 0 in` · `⌸ Ceiling Height 10 ft 0 in` ·
  `▤ Stories 1`.
- **Rooms**: `🛏 Bedrooms` · `🛁 Bathrooms` counts.

**Share / Invite modal** (from `⇪ Share`) **[SHOT 15‑15‑38]**
- `✕` close top-right. Circular dark two-people icon, serif **`Invite collaborators`**,
  sub-line **`Invite people to {projectName}.`**
- Field label **`Email address`**, input placeholder **`name@example.com`**, an adjacent gold
  **`🔒 PRO`** badge, and a black **`➤ Send invite`** button.
- **`Current team`** header + a right-aligned underlined **`Manage team`** link; member rows.
- Inset panel **`Share this design instead`**: outlined **`🔗 Copy link`** + 5 circular social
  buttons — Facebook, X, LinkedIn, Pinterest, Email.
- Footer: outlined **`Done`** bottom-right.

---

## 4. The complete room catalog

### 4.1 How the size ladder works — solved

The catalog ships **S / M / L / XL** tiers as `[lo, hi]` sqft **ranges** per room type. **[CODE]**
The number the UI shows is **the rounded midpoint of the tier's range**:

```
area(type, tier) = round((lo + hi) / 2)      // .5 rounds up
```

Verified against 24 independently-observed screenshot values with **zero** mismatches —
Primary Bedroom 146/225/304, Bathroom 33/61/92, Primary Bathroom 52/88/137, Kitchen
106/189/272, Dining 95/167/241, Living 176/309/442, Pantry 16/41/65, Den 102/202, Sunroom 270,
Family Room 297, Garage 372, Outdoor Living 775. **[DERIVED — high confidence]**

The room-list picker renders **`["S","M","L"]`** only. **XL exists in the data** and is gated
by the flag `ENABLE_XL_ROOM_SIZES`; `clampRoomSizeValueForXLFlag` downgrades `XL → L` when the
flag is off. **[CODE]** Ship S/M/L; keep XL in the data model.

Each tier also carries a marketing `user_name` (e.g. Kitchen M = *"Single Wall Kitchen w.
Island"*, Garage M = *"2-Car"*, Pantry L = *"Butler's Pantry"*) and an internal `prompt_name`
(Den: Hideaway/Hollow/Parlor/Retreat; Sunroom: Garden/Solarium/Atrium/Orangery; Kitchen:
Compact/Galley/Island/Chef's) fed to the generator. **[CODE]**

### 4.2 The catalog table

Columns: **key** = internal id · **S/M/L/XL** = ft² (bold = observed on a screenshot;
plain = computed from the [CODE] range; *italic* = **[INFERRED]**) · **auto** = auto-included
with · **max** = per-type cap · **htd** = counts as heated area · **ext** = exterior space ·
**rail** = family accent bar hex · **tile** = My Rooms / plan fill hex.

#### Group 1 — `Beds & Baths`

| key | UI label | S | M | L | XL | auto | max | htd | rail | tile |
|---|---|---|---|---|---|---|---|---|---|---|
| `primary_bedroom` | **Primary Bed** *(displays "Primary Bedroom")* | **146** | **225** | **304** | 383 | — | *1* | ✓ | `#FEDFD6` | `#FDC7B7` |
| `bedroom` | **Bedroom** | **104** | **152** | 199 | 247 | — | *6* | ✓ | `#FEDFD6` | `#FEDFD6` |
| `primary_bathroom` | **Primary Bath** *("Primary Bathroom")* | **52** | **88** | **137** | 187 | — | *2* | ✓ | `#D1E5F7` | `#B3D5F3` |
| `bathroom` | **Bathroom** | **33** | **61** | **92** | 124 | — | *6* | ✓ | `#D1E5F7` | `#D1E5F7` |
| `primary_closet` | **Primary Closet** | **27** | **62** | **96** | *132* | Primary Bed | — | ✓ | `#FDDBC1` | `#FCC79C` |
| `closet` | **Bed Closet** *(also "Utility Closet"/"Closet")* | **11** | **23** | **38** | *53* | Bedroom | — | ✓ | `#FDDBC1` | `#FDDBC1` |

Notes: `Primary Bed` has **min 1** (its `⊖` is disabled at 1). `Primary Closet` is
auto-included **but still exposes `⊖`/`⊕`** (semi-auto; min 1). `Bed Closet` is **fully
derived** — no `⊖`, ghosted `⊕`, count slaved to `Bedroom`. **[SHOT]**

#### Group 2 — `Living Spaces` (rail `#FDE08F` for the whole group)

| key | UI label | S | M | L | XL | max | htd | tile |
|---|---|---|---|---|---|---|---|---|
| `kitchen` | **Kitchen** | **106** | **189** | **272** | 355 | **1** | ✓ | `#FDE08F` |
| `dining` | **Dining** | **95** | **167** | **241** | 315 | *2* | ✓ | `#FDE08F` |
| `nook` | **Breakfast Nook** *(displays "Nook")* | *68* | **124** | **180** | *236* | **1** | ✓ | `#FDE08F` |
| `pantry` | **Pantry** | **16** | **41** | **65** | 89 | **1** | ✓ | `#EFDAAF` |
| `living` | **Living** | **176** | **309** | **442** | 575 | **1** | ✓ | `#FEEAB2` |
| `den` 🔒 | **Den** | **102** | **202** | 302 | 403 | *1* | ✓ | `#FEEAB2` |
| `family_room` 🔒 | **Family Room** | 171 | **297** | 423 | 549 | *1* | ✓ | `#FEEAB2` |
| `sunroom` 🔒 | **Sunroom** | 131 | **270** | 409 | 548 | *1* | ✓ | `#FEEAB2` |
| `foyer` | **Foyer** | *80* | **142** | *204* | *266* | *1* | ✓ | `#FEEAB2` |

🔒 = **premium**. The locked set is **exactly** `["den","family_room","sunroom"]` —
`isPremiumRoomKind` / `is_premium: true` in the catalog JSON. Nothing else is gated. **[CODE]**
`foyer` carries `auxiliary_role: circulation`. **[CODE]**

#### Group 3 — `Outdoor Spaces` (rail `#DAF7DA`)

| key | UI label | S | M | L | XL | max | htd | ext | tile |
|---|---|---|---|---|---|---|---|---|---|
| `front_porch` | **Front Porch** | *128* | **229** | *330* | *431* | *1* | ✗ | ✓ | `#DAF7DA` |
| `outdoor_living` | **Outdoor Living** | 277 | **775** | 1274 | 1772 | *1* | ✗ | ✓ | `#DAF7DA` |

#### Group 4 — `Specialty Spaces` (rail `#FEDBEA`)

| key | UI label | S | M | L | XL | max | htd | tile |
|---|---|---|---|---|---|---|---|---|
| `office` | **Office** | *91* | **163** | *235* | *307* | *2* | ✓ | `#FEDBEA` |

#### Group 5 — `Garage & Utility`

| key | UI label | S | M | L | XL | max | htd | rail | tile |
|---|---|---|---|---|---|---|---|---|---|
| `garage` | **Garage** | 244 | **372** | 619 | 866 | *1* | ✗ | `#F1E7EC` | `#F1E7EC` |
| `laundry` | **Laundry** | *41* | **74** | *107* | *140* | *1* | ✓ | `#DCFAF2` | `#DCFAF2` |
| `mudroom` | **Mudroom** | *41* | **74** | *107* | *140* | *1* | ✓ | `#E9E9E9` | `#E9E9E9` |
| `closet` (utility) | **Utility Closet** | *13* | **23** | *33* | *43* | *2* | ✓ | `#E9E9E9` | `#E9E9E9` |
| `storage` | **Storage** | *55* | **99** | *143* | *187* | *2* | ✓ | `#E9E9E9` | `#E9E9E9` |

Garage tier names: S = *1-Car* (240–248), M = *2-Car* (248–495), L = *3-Car* (495–742),
XL = *4-Car* (742–989). **[CODE]**

#### Auto-generated / internal types (never user-addable)

| key | display | Notes |
|---|---|---|
| `circulation` | **Hallway** | AI-managed count bounded by `MAX_MANAGED_HALLWAYS`; always size `M`; excluded from the room count; area recomputed on every mutation; fill `#FEEAB2` / tile `#F6E3AE`. **[CODE]** **[SHOT]** |
| `deadspace`, `fireplace`, `windows`, `doors`, `window`, `door`, `yeet` | — | internal geometry types. **[CODE]** |

#### In the catalog data but NOT in the Step-1 sidebar **[CODE]**

`bar` (Bar) · `rec_room` (Rec Room) · `theater` (Theater, S 52–404 … XL 1110–1462) ·
`gym` (Gym) · `pool` (Pool, S 254–840 *Plunge* … XL 2012–2598 *Lagoon*; unheated + exterior).
They appear in the public SEO taxonomy and get remix icons. **[INFERRED]** they are reachable
from project setup or remix, or are flag-gated. **Clone decision:** ship them in the data with
`hiddenFromCatalog: true`.

**Remix whitelist** `SANCTIONED_REMIX_ROOM_TYPES` (22): primary_bedroom, bedroom,
primary_bathroom, bathroom, primary_closet, closet, kitchen, dining, nook, pantry, living,
family_room, den, sunroom, foyer, front_porch, outdoor_living, office, garage, laundry,
mudroom, storage. **[CODE]**

**Deprecated-type migration:** *"This design uses room types that are no longer available in
Create. Choose a replacement for each room before continuing."* via
`DEFAULT_DEPRECATED_ROOM_REPLACEMENTS`. **[CODE]**

### 4.3 Per-type geometry constraints (for the generator) **[INFERRED from §5 of web-algorithms]**

| type | minDim (ft) | AR_max | needs daylight |
|---|---|---|---|
| primary_bedroom | 11.0 | 1.6 | yes |
| bedroom | 9.0 | 1.6 | yes |
| primary_bathroom | 6.0 | 2.0 | optional |
| bathroom | 5.0 | 2.2 | optional |
| primary_closet | 4.0 | 2.5 | no |
| closet | 2.0 | 4.0 | no |
| kitchen | 8.0 | 1.9 | yes |
| dining | 10.0 | 1.7 | yes |
| nook | 7.0 | 1.8 | yes |
| pantry | 3.0 | 2.5 | no |
| living / family_room | 12.0 | 1.6 | yes |
| den | 9.0 | 1.7 | yes |
| sunroom | 9.0 | 1.9 | yes |
| foyer | 5.0 | 2.0 | optional |
| office | 8.0 | 1.7 | yes |
| garage | 20.0 (2-car) | 1.5 | no |
| laundry | 5.0 | 2.5 | no |
| mudroom | 5.0 | 2.2 | no |
| storage | 4.0 | 2.5 | no |
| circulation (hallway) | 3.0 (3'-6" preferred) | ∞ | no |

Hard IRC floors to validate against, never violate: habitable room ≥ **70 ft²** and ≥ **7'-0"**
in any direction (kitchen exempt from the area rule); hallway ≥ **3'-0"** wide; glazing ≥ 8 %
of floor area and openable ≥ 4 % for habitable rooms; every sleeping room needs an egress
opening ≥ 5.7 ft² net clear, ≥ 24" high, ≥ 20" wide, sill ≤ 44"; at least one 3‑0 × 6‑8
side-hinged exterior egress door.

---

## 5. The house-shape editor

### 5.1 Entry points

1. **`Add Shape` card** on the canvas when no shape exists — a black rounded-square thumbnail
   with a white cruciform house glyph, title **`Add Shape`**, body *"Browse, edit or create the
   shape of your home."* **[SHOT]**
2. **`⌂ Choose Different Shape`** — full-width outlined button in the committed `My House Shape`
   panel.
3. The **Shape** tool in the canvas toolbar.

### 5.2 `My House Shape` modal (shape not yet committed)

White sheet `x 396→746, y 232→1150` on a slightly larger light backing plate. **[SHOT]**

- Header: outline house icon + **`My House Shape`** (bold) + **`×`** close.
- **Area readout**, label left / bold value right:
  - `Main House Area` + a circled **ⓘ** info trigger — **`2,694 ft²`**
  - `Outdoor Area` — **`0 ft²`**
  - `Total Target Area` — **`2,694 ft²`**
  - **[GAP]** the ⓘ copy → **default:** *"The conditioned footprint your rooms must fit inside.
    Outdoor rooms are counted separately."*
- Hairline, then **two tabs**: **`⤓ Choose Shape`** (active, bold black) · **`🔖 My Shapes`**
  (grey, bookmark icon).
- **Shape library grid** — 2 columns, vertically scrolling, dozens of entries. Each cell:
  - a thumbnail: an **orthogonal polygon**, cream/off-white fill, ~2 px dark-charcoal outline,
    with **one sub-rectangle tinted pale mauve** = the pre-assigned **garage bay**;
  - a thin divider;
  - a truncated caption **`{W ft in} W x {D ft in} …`**.
- First cell is **`Start my own`** — a grey circular **`+`** in place of a thumbnail. Entry
  point for drawing a custom footprint. Related copy: *"Custom Shape"*. **[CODE]**
- **Hover a cell** → the cell raises to a white bordered card **and the canvas live-previews
  that footprint**, with a centred black **`Add to canvas`** tooltip pill.
- **Click a cell** → thick black rounded selection border; footer status flips from
  **`No shape selected`** to **`{W} W x {D} D selected`**; areas recompute; the modal collapses
  into the compact panel.
- Footer: status line + a full-width outlined **`Cancel`**.

Observed library entries (a sample of ~40; all are `W x D` in ft-in): 63'0"×59'2", 39'8"×70'4",
47'8"×57'8", 45'8"×63'2", 52'8"×78'8", 30'8"×101'…, 67'4"×61'0", 107'10"×31'…, 56'8"×53'1…,
51'0"×66'0", 44'0"×81'0", 41'4"×61'2", 54'8"×65'0", 71'8"×47'8", 51'2"×59'4", 56'8"×68'8",
101'6"×33'…, 69'0"×43'1…, 98'10"×38'…, 55'4"×63'0", 69'0"×55'4", 42'0"×78'8", 39'4"×66'6",
69'0"×48'2", 58'8"×54'4", 90'0"×35'8", **95'4"×32'6"**, 37'8"×79'8", 65'8"×62'8",
68'2"×53'4" (H-shaped), 56'0"×65'4", 56'4"×74'6", 39'8"×67'8", 53'10"×51'…, 80'0"×39'8".
**[SHOT]** Backed by a versioned manifest at `/api/house-shapes-v2/current-manifest`. **[CODE]**

**[GAP]** The `My Shapes` tab was never opened → **default:** the same 2-column grid of the
user's pinned shapes, with an empty state *"Pin a shape to save it here."* Deletion confirm
copy exists: *"Delete this pinned shape?"* **[CODE]**

### 5.3 `My House Shape` compact panel (shape committed)

**[SHOT 15‑10‑56, 15‑18‑48, 15‑21‑23]**
```
⌂ My House Shape
Main House Area ⓘ            2,494 ft²
Outdoor Area                     0 ft²
Total Target Area            2,494 ft²
────────────────────────────────────────
◉ Current Shape                      📌
      [ footprint thumbnail with
        the garage bay in mauve ]
      95 ft 4 in W x 32 ft 6 in D
────────────────────────────────────────
[      ⌂ Choose Different Shape       ]
```
- **`📌` pin** icon button saves the current shape into **My Shapes**.
- The caption is the shape's **bounding box**, not its area — it does **not** change when the
  polygon is edited within the same bounding box. **[SHOT 15‑21‑34 vs 15‑21‑46]**
- Applying a shape **overrides the target area**: all three readouts dropped 2,694 → 2,494 the
  moment the 95'4"×32'6" shape was committed. **[SHOT]**

### 5.4 Canvas shape editing

**Handles** **[SHOT]**
- **Corner handles**: small rounded L-bracket / rounded-square handles at **every vertex**.
- **Edge handles**: **pill-shaped** drag handles along every edge — a **larger pill at the edge
  midpoint** and **smaller pills at the quarter points**. Dragging a midpoint pill moves the
  whole edge; dragging a quarter pill splits/extrudes it.
- Handles that are actively grabbed render as **dark filled pills**.

**Dimension chips** — light-grey rounded chips on **every segment**, showing live feet+inches,
**rotated to run along vertical edges**. Observed on a stepped polygon: `11 ft 11 in`,
`11 ft 1 in`, `11 ft 11 in`, `6 ft 7 in`, `56 ft 6 in`, `17 ft 0 in`, `11 ft 11 in`,
`7 ft 10 in`, `21 ft 11 in`, `7 ft 10 in`, `40 ft 5 in`. They are **editable**. **[SHOT]**

**Floating selection context toolbar**, directly above the selected shape, three pill buttons:

| Button | Glyph | Enable rule |
|---|---|---|
| **`◇ Remove`** | eraser | disabled when the shape is the only/committed base shape; enabled after user edits |
| **`⋈ Mirror`** | flip | mirrors the footprint horizontally |
| **`◎ Recenter`** | crosshair | **auto-disables (greys) when the shape is already centred on the origin**; black filled when it is the only enabled action |

**Deselect:** a circular **`×`** button on the canvas exits shape-edit mode; the handles and
all dimension chips clear, the left panel flips back to **My Rooms**, and the active tool flips
back to **Rooms**. **[SHOT 15‑11‑44 → 15‑11‑49]**

**Snap** is a global toggle (mint when ON) that snaps handles to the grid and to collinear
neighbours.

### 5.5 Area accounting

| Readout | Definition |
|---|---|
| **Main House Area** | area of the committed conditioned footprint polygon |
| **Outdoor Area** | Σ area of exterior-space rooms (Front Porch, Outdoor Living, Pool) |
| **Total Target Area** | Main House + Outdoor — the target the generator aims at |
| **Total ft²** (bottom bar) | the whole envelope incl. garage |
| **Heated ft²** (bottom bar) | Total − unheated (garage, porch, outdoor living, pool) |

Observed sequence: pre-shape `Total 2,694 / Heated 2,013` (Δ 681 = the garage program);
post-shape `Total 2,494 / Heated 2,494`. **[SHOT]** **[INFERRED]** Once a footprint is
committed, the garage that sits *inside* the committed envelope stops being subtracted from
Heated in the editor's live readout — the split reappears in the finished design
(`2,489 total / 2,053 heated / 436 unheated / Garage 436`). **Clone decision:** always compute
`Heated = Total − Σ(unheated room areas)` and *do not* reproduce the editor's temporary
collapse; it reads as a bug.

### 5.6 Roof

**Roof Shape dropdown**, in the 3D card. Collapsed trigger: `◇ Hip ⌄`. Expanded trigger:
`Roof Shape  ◇ Hip  ⌃` plus a **2 × 2 popover grid** (white, radius ~16). **[SHOT]**

| Option | Internal key | State rendering |
|---|---|---|
| **Hip** | `hip` | selected = **solid black tile, white icon + white label** |
| **Gable** | `gable` | unselected = white tile, dark outline glyph, grey label |
| **Flat with Overhangs** | `flat-overhang` | — |
| **Flat with Parapets** | `flat-parapet` | — |
| *(Shed Roof)* | `shed` | **rendered only when the feature flag `roof-edit-shed-flat` is on** **[CODE]** |

Literal label map **[CODE]**:
```js
ROOF_SHAPE_SELECTION_LABELS = { hip:"Hip", gable:"Gable", shed:"Shed Roof",
  "flat-overhang":"Flat with Overhangs", "flat-parapet":"Flat with Parapets" }
```
Both flat variants collapse to `roofFormKind === "flat"`, distinguished by flat style
`"slab"` (overhang) vs `"parapet"`; an unspecified flat roof defaults to **parapet**. **[CODE]**

Selecting an option **live re-renders the 3D massing**. Roof editing is **per roof section** —
*"Change any roof section from hipped to gabled with a click."* **[PAGE]** The `⌂ Edit Roof`
button in the 3D card enters that mode. Roof pitch/material note in the code:
*"Not used for flat roofs."* Data model carries `roofPipelineVersion`, `RoofDesignV2Schema`,
`roofBuildSnapshot`, `roofDesignBaselineHash`. **[CODE]**

**[GAP]** In one frame `Flat with Parapets` was selected and the control read `Hip` again two
frames later, after the tutorial step completed. **Clone decision:** roof selection **persists**;
treat the observation as a tutorial-demo reset and do not reproduce it.

**Geometry to implement** (see `web-algorithms.md` §7 for the full derivation):
offset the footprint outward by the eave overhang (**18"** default), compute the
**straight skeleton**, lift each skeleton point to `z = t · tan θ` with a default pitch of
**6:12** (`tan θ = 0.5`). Gable = project the triangular end faces onto the façade plane.
Flat+overhang = extruded slab with fascia + soffit. Flat+parapet = boundary extrusion,
parapet height 18–24".

---

## 6. Results / review specification

### 6.1 Spread model

`⚡ Create` POSTs the program + footprint + placements and creates a **spread** (a ULID)
containing **exactly 5 variants** labelled **A B C D E**. They stream in independently; the UI
shows `{k} of 5 ready`. Variants are genuinely different layouts (different room counts and
areas — 18, 18, 19 rooms across A, C, E). **[SHOT]**

**[INFERRED] How to produce 5 genuinely distinct variants** (from `web-algorithms.md` §3.5):
five fixed seeds plus a per-variant *strategy* delta, then a centroid-signature diversity
filter (reject if L2 distance < 0.12, bump the seed, retry ≤ 8×):

| Variant | Seed | Strategy |
|---|---|---|
| A | `0xA5A5` | circulation spine along the long axis, ρ = 0.50, private wing at the rear |
| B | `0xB6B6` | spine along the long axis, ρ = 0.38, private wing left |
| C | `0xC7C7` | spine along the **short** axis (cross-plan) |
| D | `0xD8D8` | open-concept: kitchen+dining+living merged, shortened spine |
| E | `0xE9E9` | L-shaped circulation with a central hub instead of a linear corridor |

### 6.2 Per-slot lifecycle

```
pending ──► plan-ready ──► model-building ──► complete
   │            │                                 │
   └────────────┴──────────► failed  ("Generation Failed")
```
Slot tile: spinner → colour mini-plan. 3D card: `Generating scheme {X}…` → `Building 3D model…`
→ rendered elevation. Bottom stats: `--` until the plan resolves.

### 6.3 Version history

Spreads accumulate in the left filmstrip. Each card: `Latest` or date chip, `{k}/5` counter,
`◌ Generating` scrim while in flight, `✎ Edit plan` when done, and a stats caption of the
**input program**. Paging via circular `⌃`/`⌄`. A **`New design +`** tile starts a fresh spread.

Marketing framing of re-rolls **[PAGE]**: *"Keep the same brief and press Generate again.
Nothing changes on the input side, so you get a fresh batch against requirements you already
know are right."* And targeted regeneration: *"Click rooms to regenerate them… What you kept is
preserved, and the next batch is designed around it."* — implement region-locking as a
post-v1 feature.

### 6.4 Furnish & Render pipeline

```
[Furnish & Render] → Choose Palette modal
                        ├─ pick a default palette   ─┐
                        ├─ "Start fresh"            ─┤
                        └─ ‹ back → Choose Materials ┘
                                    │ (all 5 categories ✓)
                                    ▼
                        [✧ Furnish & Render]  ← spends 1 render unit
                                    ▼
                  full-screen "Starting your render / Thinking through your constraints."
                                    ▼
                  redirect to project hub with optimistic params
                                    ▼
                  "Materializing" chip → "Preparing render {n}%" → finished design card
```

### 6.5 Material slots — the complete catalog **[CODE]**

```js
SLOT_ORDER  = ["cladding","foundation","roof","windows","door"]
SLOT_LABELS = { cladding:"Cladding", foundation:"Foundation", roof:"Roofing",
                windows:"Windows & Trim", door:"Front Door" }
```
**119 swatches total.** Each has `id`, `name`, `type`, a hex `color`, a PNG at
`/material-swatches-nobg/{slot}/{id}.png`, a `category`, and a `promptDesc` fed to the render
model.

**Cladding — 44**, category tabs *Lap · Board & Batten · Wood · Brick · Stone · Stucco · Metal*
- **Lap (7)**: White (Fiber Cement) · Dove Gray (FC) · Charcoal (FC) · **Beige / Sand (Vinyl)** · Sage Green (FC) · Navy (FC) · Shake / Scallop (FC)
- **Board & Batten (5)**: White · Black · Blue · Green · Red
- **Wood (7)**: Natural Cedar · Shou Sugi Ban · Pine (Horizontal) · Pine (Vertical) · Weathered Gray · Reclaimed Barnwood · Whitewashed
- **Brick (6)**: Red Brick · White / Painted · Tan / Buff · Brown Brick · Gray Brick · Clinker / Dark Blend
- **Stone (6)**: Fieldstone · Limestone · Ledgestone · River Rock · Slate · Cultured Stone
- **Stucco (6)**: White Stucco · Sand / Beige · Gray Stucco · Terracotta · Smooth White · Smooth Gray
- **Metal (7)**: Corten Steel · Standing Seam Black · Standing Seam Gray · Standing Seam Green · Corrugated Galvanized · Zinc Panel · Copper Panel

**Foundation — 31**, tabs *Stone · Brick · Board & Batten · Stucco · Concrete · Match*
- **Stone (8)**: **Fieldstone** · Ledgestone · Cultured Stone · Limestone · River Rock · Dry Stack · Slate Veneer · Cobblestone
- **Brick (5)**: Red Brick · Tan / Buff · Brown Brick · Gray Brick · Painted White
- **Board & Batten (7)**: White · Black · Blue · Green · Red · Gray · Natural Wood
- **Stucco (5)**: White Stucco · Sand / Beige · Gray Stucco · Smooth White · Smooth Gray
- **Concrete (5)**: Parged Concrete · Exposed Aggregate · Smooth Gray · Stamped Concrete · Board-Formed
- **Match (1)**: **Match Primary** (`match-primary`) — resolved through `resolveFoundationForMatch` (every metal cladding → `fdn-smooth-grey`; default `fdn-smooth-white`)

**Roofing — 18**, tabs *Asphalt Shingle · Metal · Other*
- **Asphalt Shingle (6)**: **Onyx Black** · Charcoal Shingle · Weathered Wood · Brown / Autumn Blend · Dual-Tone Gray · Desert Tan
- **Metal (7)**: Standing Seam Black · Standing Seam Bronze · Galvanized · Green · Red / Barn Red · Copper · Zinc
- **Other (5)**: Terracotta Tile · Natural Slate · Cedar Shake · Spanish Clay Tile · Green / Living Roof

**Windows & Trim — 5**, *no category tabs*: White (Vinyl) · Black (Aluminum) ·
Dark Bronze (Aluminum) · Natural Wood (Wood) · **Putty / Almond (Vinyl)**

**Front Door — 21**, tabs *Mostly Solid · Half Glass · Full Glass* — 7 options each:
- Mostly Solid: **Black** · White · Bold Red · Blue · Hunter Green · Charcoal (Painted) + Natural Oak (Wood)
- Half Glass: Black · White · Red · Blue · Charcoal · Gray (Painted) + Natural Oak (Wood)
- Full Glass: Black · White · Red · Blue · Green · Charcoal (Painted) + Natural Oak (Wood)

**Render key composition** — materials are combinatorially conditioned on cladding **[CODE]**:
```
cladding__{c} | foundation__{f}__{c} | windows__{w}__{c}__{f} | roof__{r}__{c} | door__{d}__{c}__{f}
```

**Architectural style vocabulary** (separate from materials) **[CODE]**:
`modern_farmhouse` "Modern Farmhouse" · `hill_country` "Hill Country" ·
`modern_mountain` "Modern Mountain" · `mediterranean` "Mediterranean" ·
`transitional_european` "Transitional European" · `craftsman` "Craftsman" ·
`contemporary` "Contemporary" · `custom` "Custom".

Render disclaimer to surface: *"These renders establish a visual direction; they are not
construction details or physical product specifications."* **[PAGE]**

### 6.6 Exports — 8 targets **[CODE]**

Modal title is **"Free Design Downloads"** on the free path, otherwise **"Download Files"**.

| id | Name | format | What's included (verbatim) |
|---|---|---|---|
| `pdf` | PDF | pdf | "High-resolution PDF file with floor plan and 4 elevations." |
| `autocad` | AutoCAD | **dxf** | "Floor plan with polylines and block-based doors/windows." · "4 elevation assembled into a single sheet." · "All files bundled in a single ZIP download." |
| `ifc` | IFC | ifc | "IFC 4 model with walls, doors, windows, roofs, and slabs." · "Supported by many BIM viewers and coordination tools." |
| `glb` | GLB | glb | "Binary glTF model of the full building." · "Compatible with Three.js, model-viewer, Blender, Sketchfab…" |
| `glb-editable` | Blender | glb-editable | "Individually selectable building elements organized in a scene hierarchy." · "Semantic names and metadata…" |
| `revit` | Revit | revit-link | "Drafted add-in package for native editable walls, floors, doors—including garage doors—windows, porch posts…" · "IFC4 reference model for Revit's Link IFC workflow." |
| `sketchup` | SketchUp | **dxf** | "DXF floor plan importable via File > Import in SketchUp." · "Layered polylines…" |
| `softplan` | SoftPlan | dxf (`selectedByDefault: false`) | "Exterior, interior, and minor wall centerlines on separate SP-* mapping layers." |

**There is no DWG.** CAD handoff is DXF. Export constraints: **desktop only**
(*"CAD and BIM exports are available on desktop — open this design on your computer…"*);
email delivery via **`Send Design Files`**; button states `Download Files` / `Generate Files` /
a **priced** state showing an amount + *"Estimated cost. Actual pricing confirmed at checkout"*;
quota race guard *"Your included download was just used. Review the updated price, then click
Download Files again."* Export slot reservation lifecycle:
`not_reserved | reserved | committed | released`; entitlement `included | paid`. **[CODE]**

---

## 7. Cross-cutting systems

### 7.1 Credits / quota

The nav pill is the component `SubscriptionsV2UsageTopNav`. **[CODE]**

```js
{ headingId:"top-nav-monthly-usage-title", resourceKey:"generation_credits",
  resourceLabel:"Plans and 3D" }
label = `${allowance.capacity.remainingUnits} left`
usedPercent = (capacityUnits - remainingUnits) / capacityUnits * 100
```

- It tracks **`generation_credits`** by default — the *Plans & 3D* resource.
- Renders `Unlimited` when the allowance is unlimited, `— left` when unconfigured.
- Clicking opens a **`Monthly usage`** popover (sparkle icon, `Resets {date}` on the right)
  listing three metered resources:

| Row | resourceKey | Extra |
|---|---|---|
| **Plans & 3D** | `generation_credits` | shows `{n} in progress` for reserved units |
| **Renders** | `render_units` | shows `{n} in progress` |
| **File Downloads** | `included_export_bundles` | — |

Below: **`Additional this cycle`** with a currency total, and a **`Subscriptions →`** button.

**What spends what** **[SHOT]** **[DERIVED]**
- `⚡ Create` (step 2) → **1 `generation_credit`**. Verified: nav pill `5 left` → `4 left` with
  a gold dot appearing in the track, immediately after pressing Create.
- `✨ Furnish & Render` → **1 `render_unit`**. The credits pill *inside* the palette/materials
  modal reads **`1 left`** while the nav pill reads `5 left` — they are **two different
  counters**. Reproduce that: the modal pill is scoped to `render_units`.
- Download → **1 `included_export_bundle`**, or a priced overage.

Only `generation_credits` and `render_units` accrue overages; export bundles are priced per
bundle at download time. **[CODE]**

### 7.2 Room List Capacity — the model

Tooltip: **"Our AI has a limit on how many rooms it can process currently."** **[CODE]**
Implementation note left in the shipped code, verbatim:

> *"Precomputed GPT-2 BPE token costs. Estimate = areaBase + digits(sqft) + Σ(roomCost) −
> roomCount × mergeOverheadPerLine."*

So it is a **prompt-length budget**, identical for all tiers, unrelated to credits. **[CODE]**
It is demonstrably **not** linear in area (309 ft² → +3 %, 142 → +5 %, 229 → +6 %, 775 → +4 %)
and **not** purely count-based (2 rooms → 8 %, 12 rooms → 39 %). **[SHOT]**

**Clone model.** Give every room type an integer **capacity weight** and a budget of
**100 units**, with `percentFilled = clamp(round(Σ weights / BUDGET × 100), 0, 100)`.
Observed per-add deltas → weights: **[DERIVED from hover previews]**

| weight | types |
|---|---|
| **3** | Bathroom, Kitchen, Dining, Breakfast Nook, Living, Garage, Laundry |
| **4** | Primary Bath, Primary Closet, Pantry, Outdoor Living, Office, Mudroom, Utility Closet |
| **5** | Bedroom, Foyer |
| **6** | Front Porch |
| **4** | Primary Bed *(inferred; never hovered at count 0)* |
| **0** | Bed Closet, Hallway, and any auto-derived room (no delta shown) |

Base offset: the observed 2-room state (Primary Bed + Primary Closet, weights 4+4 = 8) reads
**8 % Filled** — so `areaBase ≈ 0` and the mapping is simply `Σweights → %`. Every later state
fits within ±1 pp. **[DERIVED]**

States: **green** normally · **yellow at ≤ 15 % remaining** · **red at ≤ 0 % / over limit**.
Over-budget blocking reason key: `overTokenBudget`; guard copy *"All supported room types are
already at their limit."* **[CODE]**

Related readouts that exist in code but were never seen: **`Room List Total`** (`~{sqft}`) vs
**`Buildable Area`**. **[CODE]**

### 7.3 Subscription gating

Five Stripe-backed tiers. Internal keys → labels **[CODE]**:
```js
{ explorer:"Dreamer", free:"Free", professional:"Pro", professional_scale:"Pro Scale" }
```
Plans page heading: **"Unlock Access & Usage"**. Five cards (Free, Dreamer, Pro, Pro Scale,
Enterprise); one badged `RECOMMENDED`, the user's own badged `CURRENT`; monthly/annual toggle
with the monthly×12 list price struck through on annual.

| Tier | Features (verbatim) |
|---|---|
| **Free** | "Core home planning" |
| **Dreamer** | "Special room types" · "Private designs" · "Remix public designs" |
| **Pro** | "Everything in Dreamer" · "Create multiple projects" · "Project archiving" · "Collaboration" · "Revit Plug-in" |
| **Pro Scale** | "Everything in Pro" · "On your website experience" |
| **Enterprise** | price "Custom" · "Everything in Pro Scale" · "API access" · "Custom AI model" · CTA "Contact Us" |

**Gate map** **[CODE]**

| Gate | Mechanism |
|---|---|
| Den / Family Room / Sunroom | `isPremiumRoomKind` → `PremiumRoomCatalogGroup`; requires `features.specialRoomTypes` |
| Private designs | `features.privateDesigns`; downgrade warning: *"Private designs require a subscription. Downgrading will make all of your private designs public."* |
| Remixing public designs | Dreamer+; separate gate for remixes containing locked room types: *"This remix includes locked room types that require a subscription. Upgrade to unlock these rooms and continue your remix."* |
| Multiple projects | Free & Dreamer capped: *"{Free\|Dreamer} plan limit reached"* → *"Create 1 project and join 1 project."* → CTA "View Pro" |
| Project archiving | Pro — *"Upgrade to Pro to archive this project. It will stay active until then."* |
| Collaboration / invite-by-email | Pro — gold **`🔒 PRO`** badge on the invite field **[SHOT]** |
| Revit plug-in | Pro |
| API access, custom model | Enterprise |
| Monthly volume | metered allowances + overage on every tier |

Also present: a **"Free 1 Day Trial"** string, a **student verification** (`.edu`) flow, an
admin **Tier Override** (Off / Free / Dreamer / Pro / Pro Scale), a **Pro waitlist**
(*"Join the waitlist and we'll email you when subscriptions become available."*), and a
**referral**: *"Give 50% off their first month. Get 50% off your next month."* **[CODE]**

> ⚠ **Contradiction to be aware of.** The public FAQ says *"Drafted is completely free."*
> while the shipped app contains the full five-tier paywall above. The paywall appears to be
> **mid-rollout** (`subscriptionsV2` namespace, `useSubscriptionsV2RolloutState`, a
> `subscriptionsEnabled` toggle, and the Pro waitlist all coexist). **Clone decision:** build
> the gating machinery, default every flag to "subscriptions enabled" so the UI matches the
> screenshots (which show the locked rooms and the credit pill).

### 7.4 The tutorial / onboarding system

**Mechanics** **[SHOT]**
- A **blocking gate modal** on first entry to step 1.
- Then a persistent **coach-mark card** anchored top-right (~316 × 145–170 px, white, radius
  ~14, soft shadow), structured: uppercase letter-spaced grey eyebrow **`TUTORIAL STEP N`** →
  **serif title** (~20 px) → 1–3 grey sans body lines → a **thin linear progress bar** pinned
  to the card's bottom edge (black fill on a light track).
- A **page-wide scrim at ≈ 25–27 % black** dims everything except the spotlit targets. In step
  1 the spotlight covers the **Room Catalog card + the Continue bar**; the My Rooms panel stays
  dimmed.
- From step 2 onward the spotlight is a **punched-through cut-out with an animated dashed
  black "marching-ants" outline**, often with a **hand-drawn curved dashed leader arrow**.
- Some steps carry an explicit **black `I'm done` pill** below the spotlight to advance;
  others advance when the taught action is performed. There is **no Next/Skip** in the card.
- Gated controls show a **lock tooltip**: grey card, circular grey padlock badge, title
  **`Available after the tutorial`**, body *"You are almost done learning the basics of the
  product."*
- Un-numbered inline tooltips explain temporarily disabled UI, e.g.
  *"You can place more rooms after the tutorial is completed."*

**Length.** The progress bar is exactly linear. Step 1 = 6.3 %, steps 2–7 = 14/20/26/32/38/44 %,
steps 8/10/12/13/14 = 47/58/70/76/82 %, step 15 ≈ 95 %, step 16 = 100 %.
Two fits exist: +6 %/step ⇒ 16 steps, and +5.88 %/step ⇒ 17 steps. The step‑15 ≈ 95 % and
step‑16 = 100 % observations settle it: **the tour is 16 steps** and step 16 has **two
sub-states sharing one number**. **[DERIVED]**

**Every recovered tutorial step — verbatim.** **[SHOT]** **[CODE]**

| # | Title | Body | Anchor |
|---|---|---|---|
| — | **This is the Tutorial** | "You will have full freedom after the tutorial to use the product however you want." + button **`Start Tutorial`** | blocking modal, step 1 |
| **1** | **Build your dream room list** | "More complete room lists give better direction for our AI to meet your needs." / "Click Continue when you're done." | Room Catalog + Continue bar |
| **2** | **Add a house shape** | "Open the shape picker to choose your home's outline." | `Add Shape` card |
| **3** | **Pick a shape** | "Pick a shape that feels close — you can tune it later." | shape library grid |
| **4** | **Place the house shape** | "Apply the shape to set your floor plan's boundary." | canvas |
| **5** | **Choose a roof shape you like** | "After the tutorial, you can sculpt your house in detail, defining roof slopes, overhangs, fascias, etc." | 3D card / `Hip ⌄` — advances via **`I'm done`** |
| **6** | **Click outside of shape to see room list** | "Your room list will return so you can begin placing rooms." | the circular `×` deselect button |
| **7** | **Place a Room That Matters** | "Drag it into your home, then fine-tune its size, shape, and position." | the `Primary Bedroom` chip → canvas |
| **8** | **Create the design** | "Hit Create to generate five design options." | `⚡ Create` |
| **9** | **[GAP]** | — | between Create and the results landing |
| **10** | **Your designs are on the way** | "Five designs are on the way — they'll land in the slots below as they finish." | slot strip / canvas |
| **11** | **[GAP]** | — | while generating |
| **12** | **Pick a design** | "Click one of the slots below to preview that design on the canvas." | A–E strip |
| **13** | **Furnish & Render** | "Open the material picker for the selected design." | `✨ Furnish & Render` |
| **14** | **Choose a palette** | "Pick a palette to stage this design with exterior materials." | Choose Palette modal |
| **15** | **Start the render** | "Click Furnish & Render to start the render." | Choose Materials modal CTA |
| **16a** | **◔ Your house is rendering** | "Hang tight, this usually takes a minute or two. The highlighted card is where your house will appear." | the materializing design card |
| **16b** | **Open your house** | "Your render is ready — click the design card to open your new house." | the finished design card |
| — | **Tutorial complete** | "Your first house, from room list to rendered design." + 100 % bar + a line-art house with a green ✓ + **full-viewport multicolour confetti** + outlined **`Done`** button | modal on the draft page |
| — | *(inline, un-numbered)* | "You can place more rooms after the tutorial is completed." | My Rooms panel |
| — | *(lock tooltip)* | **Available after the tutorial** / "You are almost done learning the basics of the product." | any gated canvas control |

**Three separate flows exist in the bundle**, keyed by id **[CODE]**:

| flow id | Step copy found |
|---|---|
| `room-list-editor` | "This is the Tutorial" · **"Start from your beds and baths"** — *"Prefilled from your project. Adjust for this design if you'd like."* · **"Create your dream room list"** — *"List every room you'd like included. This helps our AI understand your vision."* · *"Click continue when you're ready"* |
| `canvas-editor` | **"Welcome to your canvas"** — *"This is where you shape your home, place key rooms, and let AI do the rest."* · **"Start from adding a shape"** — *"Sculpt your home in 3D, and our AI will create layouts to fit."* · **"Place Rooms That Matter Most"** — *"Drag rooms from My Rooms onto the canvas, then fine-tune their location, size, and shape."* · **"Ready to Create?"** — *"Add as much or as little as you like to progress your design."* |
| `house-shape-editor` | **"Choose A House Shape"** — *"Pick one from the library or create your own. Hover to preview it in 3D."* · **"Shape It Your Way"** — *"Select and adjust your home's shape and watch it update live in 3D."* |

These are **variant copies** of the same lessons — the screenshots show one A/B arm, the bundle
holds another. Implement the screenshot copy as canonical and keep the bundle copy as the
alternate strings.

### 7.5 The `Learn` button

An outlined pill with an open-book icon, always present in the nav. **[GAP]** never opened.
**Chosen default:** it opens a right-hand **Learn drawer** containing (a) *Replay tutorial*
for each of the three flows, (b) links to the `/learn` article hub, (c) a "What's new" list,
and (d) the support contact found in the bundle: **"Text or Call: (510) 361-0508"**. **[CODE]**

### 7.6 Persistence, autosave, collaboration

- Every mutation in steps 1 and 2 is **immediately reflected in all panels** with no explicit
  save affordance anywhere in 108 screenshots ⇒ **autosave is continuous**. **[DERIVED]**
- Client architecture **[CODE]**: Zustand 5.0.14 (with `persist` + `devtools` middleware) for
  editor/UI state; TanStack Query for server state, **persisted to IndexedDB**
  (`indexedDB.open("drafted-query-cache", 1)`, debounced writes via `requestIdleCallback(…,
  {timeout:3000})`); **Dexie** for a second, richer IndexedDB store.
- **Optimistic UI:** the render flow navigates with `materializingDesign`,
  `optimisticMaterializing=1`, `optimisticMaterializingStartedAt={epochMs}` and clears them on
  completion. Clone this pattern.
- **Collaboration:** `/api/collab-session-end` implies live multi-user sessions; presence is
  surfaced as a green dot + `Now` on team member rows. **[CODE]** **[SHOT]**
- **Project archiving** (Pro), **public/private toggle**, **Remix** (fork a public design into
  your own project; surfaced as `⚡ Remix` and a `1 remix` counter).

### 7.7 Disclaimers to surface **[CODE]** **[PAGE]**

> "Drafted does not check building codes. Generated plans are starting points for design
> development and must be reviewed by a qualified design professional."

Plus: schematic design phase only; renders are not product specifications; desktop-only
creation (*"Creating and editing designs is built for larger screens."* / *"Create on
Desktop"*).

---

## 8. Data model

TypeScript interfaces for the clone. Geometry is in **feet** throughout; render code converts.

```ts
// ─────────────────────────────── units & primitives ──────────────────────────
type Ft = number;                    // feet, float
type Inches = number;                // integer inches (preferred internal storage)
type Sqft = number;
type Ulid = string;                  // 26-char Crockford base32
type SizeClass = 'S' | 'M' | 'L' | 'XL';
type SlotLetter = 'A' | 'B' | 'C' | 'D' | 'E';

interface Point { x: Ft; y: Ft }
interface Rect  { x: Ft; y: Ft; w: Ft; h: Ft }

// ─────────────────────────────── room catalog ────────────────────────────────
type RoomGroup =
  | 'beds_and_baths' | 'living_spaces' | 'outdoor_spaces'
  | 'specialty_spaces' | 'garage_and_utility';

/** contiguous colour-rail family inside a group */
type RoomFamily =
  | 'bedroom' | 'bathroom' | 'closet' | 'eating' | 'living'
  | 'outdoor' | 'specialty' | 'garage' | 'laundry' | 'back_of_house' | 'circulation';

interface RoomSizeTier {
  size: SizeClass;
  minSqft: Sqft;               // the catalog range [lo, hi)
  maxSqft: Sqft;
  /** what the UI shows: round((min+max)/2) */
  areaSqft: Sqft;
  userName?: string;           // "Queen/King Bedroom", "2-Car", "Butler's Pantry"
  promptName?: string;         // internal, fed to the generator: "Solarium", "Galley"
}

interface RoomCatalogEntry {
  key: string;                       // 'primary_bedroom'
  /** label in the Step-1 catalog list */
  catalogLabel: string;              // 'Primary Bed'
  /** label on tiles, chips, plans and the rooms list */
  displayName: string;               // 'Primary Bedroom'
  /** even shorter label used on preview chips, when different */
  shortName?: string;                // 'Nook', 'Closet'
  group: RoomGroup;
  family: RoomFamily;
  /** index within the group; drives both list order and rail grouping */
  order: number;

  icon: string;                      // monoline icon id
  sizes: Record<SizeClass, RoomSizeTier>;

  minCount: number;                  // 0, or 1 for primary_bedroom / primary_closet
  maxCount: number | null;           // null = uncapped; 1 ⇒ MAX badge
  /** parent key; the child's count and size follow the parent */
  autoIncludedWith?: string;         // 'primary_bedroom' | 'bedroom'
  /** true ⇒ no ⊖ at all and a disabled ⊕ (Bed Closet) */
  countFullyDerived: boolean;

  isPremium: boolean;                // den | family_room | sunroom
  hiddenFromCatalog: boolean;        // bar | rec_room | theater | gym | pool
  isHeated: boolean;
  isExterior: boolean;
  auxiliaryRole?: 'circulation';

  /** capacity meter weight; 0 for derived rooms */
  capacityWeight: number;

  // generator constraints
  minDimFt: Ft;
  maxAspectRatio: number;
  needsDaylight: boolean;

  // colour system
  railColor: string;                 // '#FEDFD6'
  tileColor: string;                 // '#FDC7B7' — deeper for "Primary X"
  rowTint: string;                   // '#FEF2EE' — added-row background
  hoverTint: string;                 // '#FFF8F6'
}

// ─────────────────────────────── the program (step 1) ────────────────────────
interface RoomListItem {
  id: string;                        // stable instance id
  typeKey: string;                   // → RoomCatalogEntry.key
  size: SizeClass;
  areaSqft: Sqft;                    // denormalised from the tier
  /** set when this instance exists only because of a parent */
  derivedFromInstanceId?: string;
  /** true for the synthesized Hallway; excluded from roomCount */
  isAutoGenerated: boolean;
}

interface RoomList {
  items: RoomListItem[];
  /** the sticky global S/M/L preview preference */
  previewSize: SizeClass;
  /** the room type currently driving the 3D preview */
  previewTypeKey: string | null;
}

interface ProgramTotals {
  roomCount: number;                 // Σ catalog counters, excl. auto-generated
  netSqft: Sqft;                     // Σ instance areas incl. hallway
  totalSqft: Sqft;                   // round(netSqft * 1.047)
  heatedSqft: Sqft;                  // totalSqft − Σ unheated
  stories: 1;
  capacityPercent: number;           // 0..100
  capacityState: 'green' | 'yellow' | 'red';
}

// ─────────────────────────────── house shape (step 2) ────────────────────────
interface ShapeVertex { id: string; x: Ft; y: Ft }

interface ShapeEdge {
  id: string;
  fromVertexId: string;
  toVertexId: string;
  lengthFt: Ft;                      // derived; displayed as "38 ft 0 in"
  orientation: 'h' | 'v';
  /** midpoint pill + two quarter pills */
  handles: { t: number; kind: 'mid' | 'quarter' }[];
  locked?: boolean;
}

interface HouseShape {
  id: string;
  /** library preset id, or null for a custom / edited shape */
  presetId: string | null;
  /** closed orthogonal polygon, CCW, in feet */
  vertices: ShapeVertex[];
  edges: ShapeEdge[];
  /** pre-assigned garage bay inside the footprint (rendered mauve) */
  garageBay?: Rect;
  boundingBox: { widthFt: Ft; depthFt: Ft };   // → "95 ft 4 in W x 32 ft 6 in D"
  mainHouseAreaSqft: Sqft;
  outdoorAreaSqft: Sqft;
  totalTargetAreaSqft: Sqft;
  isPinned: boolean;                 // saved into "My Shapes"
  centeredOnOrigin: boolean;         // drives the Recenter enable state
}

type RoofShape = 'hip' | 'gable' | 'flat-overhang' | 'flat-parapet' | 'shed';

interface RoofDesign {
  shape: RoofShape;
  pitch: { rise: number; run: 12 };  // default 6:12
  overhangIn: Inches;                // default 18
  parapetHeightIn?: Inches;          // flat-parapet only, default 21
  /** per-face overrides, keyed by footprint edge id */
  perSectionShape?: Record<string, RoofShape>;
}

// ─────────────────────────────── placement (step 2) ──────────────────────────
interface PlacedRoom {
  instanceId: string;                // → RoomListItem.id
  /** the room's actual polygon on the canvas, not just a rect */
  polygon: Point[];
  boundsFt: Rect;
  status: 'placed';
  /** auto-resized when the shape changes */
  areaSqft: Sqft;
  selected: boolean;
}

interface EditorState {
  tool: 'site' | 'shape' | 'rooms' | 'roof';
  snapEnabled: boolean;
  zoom: number;
  pan: Point;
  undoStack: unknown[];
  redoStack: unknown[];
  shape: HouseShape | null;
  roof: RoofDesign;
  placed: PlacedRoom[];
  /** 0..100; placedPct = round(placed / totalRooms * 100) */
  aiCreateMixPercent: number;
  aiCreateMixLabel: string;          // 'Best Balance'
  issues: ValidationIssue[];
}

interface ValidationIssue {
  id: string;
  severity: 'blocking' | 'advisory';
  /** "Move Bathroom, Bedroom, and 11 more inside the house shape" */
  message: string;
  affectedInstanceIds: string[];
  /** what `Show issue` zooms to */
  focusBounds: Rect;
}

// ─────────────────────────────── the generated plan ──────────────────────────
interface PlanRoom {
  id: string;
  typeKey: string;
  displayName: string;
  /** rectangle in the common case; polygon for L/T shapes */
  rect: Rect;
  polygon?: Point[];
  areaSqft: Sqft;
  /** label line 2, e.g. `12'6" x 10'8"` */
  dimensionLabel: string;
  fillColor: string;
  labelRotationDeg: 0 | 90;
}

interface Wall {
  id: string;
  a: Point;
  b: Point;                          // centerline
  thicknessFt: Ft;                   // 0.542 (6.5") exterior, 0.375 (4.5") interior
  kind: 'exterior' | 'interior';
  openingIds: string[];
}

type OpeningKind = 'door' | 'window' | 'opening';
type DoorType = 'single-swing' | 'double-swing' | 'casement' | 'sliding';

interface Opening {
  id: string;
  kind: OpeningKind;
  wallId: string;
  /** distance along the wall from vertex a, to the opening's centre */
  offsetFt: Ft;
  widthFt: Ft;                       // door 2.5–3.0; window per unit; garage 16.0
  /** doors/windows only */
  type?: DoorType;
  hingeSide?: 'start' | 'end';
  swingInto?: string;                // PlanRoom id
  flippedH?: boolean;
  flippedV?: boolean;
  sillFt?: Ft;                       // windows: 2.67 typical, 4.5 bath, 3.5 kitchen
  headFt: Ft;                        // always 6.667 (6'-8")
  connects: [string, string];        // the two PlanRoom ids (or 'exterior')
}

interface FloorPlan {
  id: string;
  slot: SlotLetter;
  rooms: PlanRoom[];
  walls: Wall[];
  openings: Opening[];
  footprint: Point[];
  totalSqft: Sqft;
  heatedSqft: Sqft;
  unheatedSqft: Sqft;
  roomCount: number;
  widthFt: Ft;
  depthFt: Ft;
  ceilingHeightFt: 10;
  stories: 1;
  bedrooms: number;
  bathrooms: number;
}

// ─────────────────────────────── variants & spreads ──────────────────────────
type VariantStatus = 'pending' | 'plan-ready' | 'model-building' | 'complete' | 'failed';

interface DesignVariant {
  slot: SlotLetter;
  status: VariantStatus;
  seed: number;
  strategy: string;                  // 'spine-long-rear' | 'cross-plan' | 'open-concept' | …
  plan?: FloorPlan;
  thumbnailUrl?: string;             // colour mini-plan
  elevationUrl?: string;             // 3D elevation render
  errorMessage?: string;
}

interface Spread {
  id: Ulid;
  createdAt: string;                 // ISO
  isLatest: boolean;
  variants: DesignVariant[];         // exactly 5, A..E
  readyCount: number;                // 0..5
  /** the *input program's* numbers, shown on the filmstrip card */
  inputTotals: { totalSqft: Sqft; heatedSqft: Sqft; roomCount: number };
}

// ─────────────────────────────── materials & renders ─────────────────────────
type MaterialSlot = 'cladding' | 'foundation' | 'roof' | 'windows' | 'door';

interface MaterialSwatch {
  id: string;                        // 'fdn-smooth-white'
  name: string;                      // 'Beige / Sand'
  slot: MaterialSlot;
  category: string;                  // 'Lap', 'Stone', 'Asphalt Shingle', …
  type: string;                      // 'Vinyl', 'Fiber Cement', 'Clay Tile'
  color: string;                     // hex
  imageUrl: string;                  // /material-swatches-nobg/{slot}/{id}.png
  promptDesc: string;                // fed to the render model
}

interface MaterialPalette {
  id: string;
  name: string;                      // 'Bright Stucco'
  isDefault: boolean;                // Default Palettes vs My Palettes
  previewRenderUrl: string;          // painterly house render
  selections: Record<MaterialSlot, string>;   // slot → swatch id
}

type RenderStatus = 'queued' | 'running' | 'succeeded' | 'failed';

interface Render {
  id: number;
  designId: number;
  status: RenderStatus;
  progressPercent: number;           // drives "Preparing render 18%"
  paletteId?: string;
  selections: Record<MaterialSlot, string>;
  exteriorRenderUrl?: string;        // painterly watercolour
  furnishedPlanUrl?: string;         // furnished colour plan raster
  schematicPlanUrl?: string;         // dimensioned pastel schematic
  massingThumbUrl?: string;          // grey 3D massing
  startedAt: number;                 // epoch ms
  errorMessage?: string;
}

// ─────────────────────────────── designs & projects ──────────────────────────
interface Design {
  id: number;
  draftId?: number;
  projectId: number;
  runUlid: Ulid;
  spreadId: Ulid;
  slot: SlotLetter;
  name: string;                      // 'Design 1'
  authorId: string;
  createdAt: string;
  isPublic: boolean;
  isShortlisted: boolean;
  remixCount: number;
  remixedFromDesignId?: number;
  pinnedCount: number;               // "Pinned 0 times"
  plan: FloorPlan;
  render?: Render;
  palette: MaterialPalette;
  description: string;               // the "About This Design" prose
}

interface ProjectMember {
  userId: string;
  displayName: string;               // 'Nagrom A.'
  initials: string;                  // 'NA'
  role: 'Homeowner' | 'Architect' | 'Builder' | 'Viewer';
  isOnline: boolean;
  activityCount: number;
}

interface CreateRun {
  ulid: Ulid;
  projectId: number;
  step: 'room-list' | 'editor' | 'review';
  roomList: RoomList;
  editor: EditorState;
  spreads: Spread[];
  updatedAt: string;
}

interface Project {
  id: number;
  name: string;                      // "Morgan's Dreamhome"
  coverPhotoUrl: string | null;
  heatedAreaSqft: Sqft;              // headline stat
  bedrooms: number;
  bathrooms: number;
  buildableArea: { widthFt: Ft; depthFt: Ft } | 'Flexible';
  targetHomeSizeSqft?: Sqft;         // knob in 250 sqft increments
  unitSystem: 'imperial' | 'metric';
  team: ProjectMember[];
  runs: CreateRun[];
  designs: Design[];
  /** bucket membership is derived, not stored */
  archivedAt?: string;
  createdAt: string;
}

// ─────────────────────────────── quota ───────────────────────────────────────
interface Allowance {
  resourceKey: 'generation_credits' | 'render_units' | 'included_export_bundles';
  resourceLabel: 'Plans and 3D' | 'Renders' | 'File Downloads';
  capacityUnits: number | 'unlimited';
  remainingUnits: number | 'unlimited';
  inProgressUnits: number;
  resetsAt: string;
}
```

---

## 9. Design system

### 9.1 Typography **[CODE, byte-level verified]**

| Role | Family | Weights | Notes |
|---|---|---|---|
| Display / wordmark / page H1 / card titles / modal titles / tutorial titles / **floor-plan room labels** | **DM Serif Display** | 400 only | `--font-dm-serif-display`; metric-matched fallback `local(Times New Roman)` with `ascent-override:94.37% descent-override:30.51% size-adjust:109.78%` |
| All UI text | **Inter** (variable) | 100–900 | `--font-inter`; fallback `local(Arial)` `ascent-override:90.44% descent-override:22.52% size-adjust:107.12%` |
| Mono | system stack | — | `ui-monospace, SFMono-Regular, Menlo, …` — **no webfont loaded** |

The `Drafted` wordmark is DM Serif Display with a **custom swash** sweeping under `-ed`; treat
it as an SVG asset, not live text.

Scale in use (measured): nav labels 14–15 px · panel titles 16–17 px · room names 15 px bold ·
group headers 14 px medium grey · sub-labels & micro-copy 11 px grey · tutorial eyebrow 11 px
uppercase letter-spaced 0.06em · tutorial title ~20 px serif · CTA label 17 px bold ·
metric values bold with a true superscript `²` and comma thousands separators.

**Offline note:** use `@fontsource-variable/inter` + `@fontsource/dm-serif-display`, **not**
`next/font/google` (which fetches at *build* time).

### 9.2 Colour tokens

**Ground & surface**

| Token | Hex | Role |
|---|---|---|
| `--color-paper` | `#FAF8F2` | page ground — set **inline on `<body>`** in the original |
| `--color-paper-rise` | `#FDFCF9` | raised surface |
| `--color-nav` | `#FAF9F2` | top bar |
| card | `#FFFFFF` | all cards/panels/modals |
| panel-muted | `#E2E0DE` | the dimmed My Rooms panel in the editor |
| border | `#E7E5E4` → `#D6D3D1` | hairlines (stone-200/300) |
| warm tint | `#F9F4E4`, `#FFF8E1`, `#FFF7DC` | highlight washes |

**Ink** — warm `stone`, not cool `neutral`:
`--foreground: #1C1917` (stone-900) · secondary `#78716C` (stone-500) · muted `#A8A29E`
(stone-400) · primary button `#171717`/`#1C1917`, hover `#292524`.

**Accents**

| Token | Hex | Role |
|---|---|---|
| `--color-brass` | `#B49F60` | dominant brand gold — credits, PRO, progress rings, active tool |
| brass-lite | `#D2B96C` | gold borders |
| brass-deep | `#D6A900`, `#B7902E` | gold icon fills |
| upsell badge fill / border / text | `#F3E5AC` / `#D2B96C` / `#695719` | `UPGRADE SUBSCRIPTION` pill |
| upsell card bg | `#FBF8EE` | the paywall sub-card |
| `--color-sage` | `#B4BCA5` | secondary accent |
| sage-lite / canvas grid | `#DEE2D6` | the editor canvas ground |
| snap-on mint | `#81A396` | active Snap toggle |
| capacity green | `#22C55E` (dot `#08943D`, bar `#6AAE7E`) | capacity meter |
| selection teal | teal-green stroke | placed rooms on canvas |
| MAX badge | `#78716B` + white text | per-type cap badge |
| destructive | `#E40014` | blocking errors, Delete |
| warning amber | `#F5B301` | advisory validation |
| footprint heat fill | `#F3E3BF` | the amber wash inside the footprint |
| modal scrim | black @ 25–27 % (tutorial), ~55 % (palette modal) | |

**Room family palette — the single most important table in the design system.**
Five parallel usages of the same hue: (a) catalog row rail, (b) added-row tint,
(c) 3D render floor plane, (d) preview chip, (e) My Rooms tile / plan fill.

| Family | Rail | Row tint (added) | Row tint (hover) | Tile — standard | Tile — "Primary" |
|---|---|---|---|---|---|
| Beds | `#FEDFD6` | `#FEF2EE` | `#FFF8F6` | `#FEDFD6` / `#F6DACF` | `#FDC7B7` / `#F6C3B4` |
| Baths | `#D1E5F7` | `#F4F9FD` / `#EEF5FC` | — | `#D1E5F7` / `#CDDFEE` | `#B3D5F3` / `#B1D1EB` |
| Closets | `#FDDBC1` | `#FEF2E8` / `#FFF7F1` | — | `#FDDBC1` / `#F6D6BD` | `#FCC79C` / `#F5C39A` |
| Kitchen / Dining / Nook | `#FDE08F` | `#FFF8E5` | `#FEF5D8` | `#FDE08F` / `#F6DA8E` | — |
| Living / Den / Family / Sunroom / Foyer | `#FDE08F` | `#FFF8E5` | `#FCF2D0` (locked) | `#FEEAB2` | — |
| Pantry | `#FDE08F` | — | — | `#EFDAAF` | — |
| Circulation (Hallway) | — | — | — | `#FEEAB2` / `#F6E3AE` | — |
| Outdoor | `#DAF7DA` | — | `#ECFBEC` | `#DAF7DA` | — |
| Specialty (Office) | `#FEDBEA` | — | `#FEEDF5` | `#FEDBEA` | — |
| Garage | `#F1E7EC` | — | `#F8F3F6` | `#F1E7EC` | — |
| Laundry | `#DCFAF2` | — | `#EEFCF8` | `#DCFAF2` | — |
| Mudroom / Utility Closet / Storage | `#E9E9E9` | — | `#F9F9F9` / `#F4F4F4` | `#E9E9E9` / `#F3F3F3` | — |

Rules: **"Primary X" is always a more saturated step of its family.** The 3D render's floor
plane always takes the *rail* hue. The generated plan uses the *tile* hue.

### 9.3 Shape, spacing, elevation

| Element | Value |
|---|---|
| `--radius` | `0.625rem` = **10 px** (the shadcn base) |
| Cards / panels / modals | 12–18 px radius |
| Catalog rows, room tiles, segmented cells | 8–10 px |
| Pills (buttons, badges, toggles) | fully rounded (999 px) |
| Circular icon buttons (`⊕ ⊖ 🔒 ⓘ`) | 24 px outline circles |
| Avatar | 36 px solid circle |
| Hairline | 1 px `#E7E5E4` |
| Card shadow | soft, low-spread, low-opacity (`0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)`) |
| Floating card shadow (summary, tutorial, 3D) | stronger: `0 12px 32px rgba(0,0,0,.12)` |
| Catalog row pitch | 48 px (single line) / ~60 px (with sub-label) |
| Column gutter | 20 px |
| Left panel width (editor) | ≈ 316–320 px |
| 3D preview card | ≈ 360 × 360, 30 px inset from bottom-right |
| Canvas | fixed-aspect square, ≈ 740 × 740 at 1920 |
| Top bar height | 48–56 px |
| Overlay z-index | extreme (`z-[100000000002]`) to clear the Intercom widget |

### 9.4 Button variants

| Variant | Spec | Used for |
|---|---|---|
| **Primary** | solid `#1C1917`, white bold label, full-width pill or rounded-rect | `Continue…`, `⚡ Create`, `✨ Furnish & Render`, `View`, `Start Tutorial`, `Send invite` |
| **Primary + gold ring** | primary plus a 2 px `#B49F60` ring | `⚡ Create` when it is the next action |
| **Outlined** | white fill, 1 px `#D6D3D1`, dark label | `Clear All`, `Learn`, `+ Add Rooms`, `Choose Different Shape`, `View Design`, `Cancel`, `Done` |
| **Gold-outlined** | 1 px gold, gold label | `🔒 Public` |
| **Ghost** | no fill, no border | `✕ Cancel` in the openings bar |
| **Destructive** | red 1 px outline, red label, trash icon | per-room `🗑 Delete` |
| **Toggle-on** | mint fill + dark green icon/label | `🧲 Snap` |
| **Tool-active** | cream `#F5F0DF` fill + gold border + gold label | active canvas tool |
| **Segmented selected** | solid black rounded square, white letter | `S/M/L`, roof options |
| **Segmented hover** | white square, 1 px grey border | `S/M/L` |
| **Badge — MAX** | `#78716B` pill, white uppercase letter-spaced 10 px | per-type cap |
| **Badge — upsell** | `#F3E5AC` fill, `#D2B96C` border, `#695719` uppercase text | `UPGRADE SUBSCRIPTION` |
| **Badge — status** | amber pill | `Materializing` |
| **Disabled** | `opacity: .5`, `pointer-events: none` | undo/redo, `Edit manually` |

### 9.5 Iconography

Thin-stroke 1.5–2 px **outline** icons (Lucide-family) for all UI chrome: house, book, sparkle,
magnet, magnifier±, circular arrow, undo/redo, eraser, bookmark, pin, crosshair, padlock,
info-circle, trash, pencil, chevrons, plus/minus circles, expand arrows.
**Room glyphs are filled/solid pictograms**: bed, low bed, bathtub, shower head, wardrobe,
hanger, stove/counter, dining table, banquette, pantry shelves, sofa, sofa+TV, floor lamp,
potted plant, door, porch columns, desk, car, washer, lockers, boxes.

Material swatches and palette renders are **painterly / torn-paper watercolour** assets — not
flat colour. This is a signature of the brand; budget for illustration assets or generate them.

### 9.6 Illustration style

- **3D room previews (step 1):** hand-drafted isometric cut-away line art — 1 px slightly
  wobbly dark ink, white surfaces with a light-grey wall wash, one **family-tinted floor
  plane**, a soft ground shadow, and architectural extension ticks with cross-serifs at the
  room extents. One asset per (room type × size class) — that is **~25 types × 3 sizes ≈ 75
  illustrations**. Budget for it, or generate them procedurally from the room's fixture list.
- **Exterior renders:** loose painterly watercolour with visible brush strokes, foliage masses,
  a lawn strip and a white sky.
- **3D massing (editor):** flat cream roof planes with grey fascia bands and grey wall bands,
  isometric, no textures.

### 9.7 Recommended implementation stack (clone)

Matches the original where it matters, deviates only where the original is cloud-bound:

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16, App Router, `output: "standalone"`** | same structure as the original; runs on bare Node |
| 2D canvas | **`konva` + `react-konva`** | the original is Konva/Canvas2D — first-party perf marks `"konva ready"`, `"konva stage committed"` prove it. Store geometry in **feet**; convert to px only at render |
| 3D | **`three` + `@react-three/fiber` + `drei`**, client-side | the original bakes 3D server-side; a local clone must extrude in the browser. Build walls as **opening-aware axis-aligned sub-boxes — no CSG** |
| State | **Zustand 5** (+`persist`) for editor/UI; TanStack Query only if an HTTP layer exists | matches the original |
| Undo/redo | **immer `produceWithPatches`** + a command stack (or `zundo`) | snapshotting a whole scene graph per drag will not scale |
| Styling | **Tailwind v4 + shadcn/ui + Radix** — but **tokenise the brand** into `@theme` instead of `bg-[#B49F60]` arbitrary values | the original scattered hex across hundreds of class strings; do not copy that |
| Persistence | **Dexie** in the browser + **SQLite (`node:sqlite`)** on a local server | mirrors the original's two-tier IndexedDB + backend shape |
| Exports | **`dxf-writer`** (pure JS) for DXF, **`pdf-lib`** for PDF, `GLTFExporter` for GLB. Descope IFC to a later milestone | avoid native/CAD kernels |
| Generation | **seeded simulated annealing over a normalized Polish expression (slicing tree)** with a reserved circulation spine, then an LP dimensioning pass | a dissection guarantees no gaps/overlaps — mandatory for houses. See `web-algorithms.md` |
| Drop entirely | Clerk, Stripe, PostHog, Intercom, gtag, Turnstile, Rive-from-unpkg, and the stray `mcp.figma.com/html-to-design/capture.js` script the original ships by accident | none work offline; the Figma one is a leak |

---

## 10. Gap list — what we could not determine, and the chosen default

Each row is a decision the clone must make. **Implement the default; flag it in code with
`// SPEC-GAP-nn`.**

| # | Gap | Chosen default |
|---|---|---|
| 01 | `/app/studio` — the My Studio project list — was never opened | A card grid of projects: cover photo, serif name, heated-area stat, design count, last-updated; plus a `+ New Project` card. Sticky header with search. |
| 02 | Avatar (`NA`) account menu contents | Menu: *Profile* · *Subscriptions* · *Settings* · *Units: Imperial/Metric* · *Sign out*. |
| 03 | `Learn` button destination | A right-hand drawer: replay each of the 3 tutorial flows, link to `/learn`, "What's new", support phone `(510) 361-0508`. |
| 04 | `View` (paywall) destination content | `/app/subscriptions`: 5 tier cards (Free/Dreamer/Pro/Pro Scale/Enterprise) with the verbatim feature lists in §7.3, monthly/annual toggle, `RECOMMENDED`/`CURRENT` badges, an `Overage Pricing:` line. **Prices unknown** — render from a server `allowances`/`pricing-quote` payload; use placeholders `$0 / $12 / $39 / $99 / Custom` per month. |
| 05 | Exact per-tier credit allowances | Free 5 plans & 3D / 1 render / 1 download per month. (The `5 left` and `1 left` observed on a free account are the evidence.) |
| 06 | `Clear All` confirmation | Show a confirm popover: "Clear all rooms? This can't be undone." / Cancel / Clear All. |
| 07 | Category `≡` grip semantics | Drag-to-reorder groups, persisted per project. Ship it non-functional behind a flag if time-boxed. |
| 08 | Whether the committed S/M/L governs the next add | **No.** S/M/L is preview-only; new instances are auto-sized `M, S, L, M, S, L…` per type. |
| 09 | Why both Bathrooms became `S 33` at once | Treat as the user having decremented to 0 and re-added. **Do not** implement "re-normalise all instances of a type". |
| 10 | `Room List Capacity` exact formula | Per-type integer weights against a 100-unit budget (§7.2). |
| 11 | Where the `% Remaining` variant of the meter is used | Not used. Ship `% Filled` only. |
| 12 | Whether My Rooms tiles are clickable / draggable / removable in step 1 | **Yes:** clicking a tile selects that type in the catalog and previews it; hovering reveals a small `×` that decrements that instance. (Consistent with the editor's hover-to-delete.) |
| 13 | Whether the user can delete the auto Hallway | **No.** It is AI-managed. Expose only an indirect effect via the AI-Create Mix. |
| 14 | Tutorial steps 9 and 11 copy | 9 = **"Hang tight"** / *"We're sending your brief to the model."*; 11 = **"Watch them land"** / *"Each slot fills in as its floor plan finishes."* Clearly marked as invented. |
| 15 | Total tutorial length | **16 steps**, with step 16 having two sub-states (`Your house is rendering` → `Open your house`). |
| 16 | `Reset ⌄` dropdown contents | `Reset view` · `Clear rooms from canvas` · `Reset shape` · `Reset everything` (the last two confirm). |
| 17 | Site/Lot tool panel | `Buildable Area` (Width / Depth fields + ⓘ) and `Target Home Size` (250 sqft-increment knob + exact entry), with the verbatim validation strings in §3.2.1. |
| 18 | `Main House Area` ⓘ copy | "The conditioned footprint your rooms must fit inside. Outdoor rooms are counted separately." |
| 19 | `My Shapes` tab empty state | Same 2-column grid; empty state "Pin a shape to save it here." |
| 20 | Whether the roof choice persists | **Yes, it persists.** The one frame showing a revert is a tutorial-step reset; don't reproduce it. |
| 21 | What the AI-Create Mix slider does when dragged | Raising `% Placed by You` auto-places the highest-priority unplaced rooms at AI-suggested positions; lowering un-places the most recent. Preset labels: `All AI`, `Mostly AI`, `Best Balance`, `Mostly You`, `All You`. |
| 22 | Whether `Edit manually` and `Edit plan` lead to the same UI | **Yes** — both enter the results openings/wall editing mode. |
| 23 | Whether the palette carousel extends past `Classic Gray` | Ship the 8 observed palettes + `Start fresh`. Design the carousel for N. |
| 24 | Per-category material picker UI | A grid of swatches with category tabs along the top (§6.5 lists every tab and option), a `‹` back chevron, and the verbatim per-slot subtitles. |
| 25 | `Buildable Area: Flexible` destination | Opens the Site/Lot buildable-area editor. `Flexible` = no constraint set. |
| 26 | Bookmark icon vs `Shortlisted` vs "Pinned N times" | The 🔖 icon **is** the shortlist toggle (moves the design into `Shortlisted`). "Pinned N times" is a **public** counter of how many *other* users pinned it. |
| 27 | Why editor totals (2,556) ≠ finished design (2,489/2,053) | The editor totals are the **program target** incl. the 1.047 gross-up; the design totals are the **as-built** plan. Show both, labelled: `Target` in the editor, `Total/Heated` on the design. |
| 28 | `97 ft 10 in` (design card) vs `98 ft 0 in` (details) width | Card rounds to the nearest inch of the wall centerline; details round to the nearest 2 inches of the outside face. **Clone decision: use one number everywhere** — outside face, rounded to the nearest inch. |
| 29 | `Remix` flow destination | Forks the design into a **new create run** in the user's own project, seeded with that design's program and footprint, landing on step 1. |
| 30 | `Download Files` UI | The 8-format modal in §6.6, with format previews on the right and per-format `whatsIncluded` bullets. |
| 31 | Loading / error states for step 1 | Skeleton catalog rows + spinner in the preview; errors as an inline amber card with Retry. |
| 32 | Generation failure handling & credit refund | Show `Generation Failed` per slot and a canvas-level retry. **A retry after a total failure does not spend another credit.** |
| 33 | The `Inspiration` / `Explore Other Designs` panel when non-empty | A grid of public community designs (render + plan thumbnails, author, heated/total ft², bd/ba) filterable by Bedrooms / Bathrooms / Heated Area / Character / Shape (the 8 Character values: Bold, Bright, Classic, Dark, Earthy, Industrial, Natural, Rustic). |
| 34 | The catalog's hidden types (Bar, Rec Room, Theater, Gym, Pool) | Ship in data with `hiddenFromCatalog: true`; expose behind a `enable-extra-room-types` flag. |
| 35 | Whether XL sizes are ever user-selectable | No — render `S/M/L` only; keep XL in the data behind `ENABLE_XL_ROOM_SIZES`. |
| 36 | The step-1 search/filter field | None exists. Do not add one (it would change the panel proportions). |
| 37 | Mobile / tablet behaviour | Creation is **desktop-only** in the original. Show a full-screen "Create on Desktop" interstitial below 1024 px; keep the draft page and project hub responsive. |

---

## Appendix A — literal copy inventory (for i18n / exact reproduction)

```
Drafted · My Studio · Back · PROJECT · Learn · {n} left
1 Create Room List · 2 Place Rooms & Shape · 3 Results
Room Catalog · Clear All · My Rooms · {n} Rooms · 1 Story · + Add Rooms
Beds & Baths · Living Spaces · Outdoor Spaces · Specialty Spaces · Garage & Utility
Auto-included with Primary Bed · Auto-included with Bedroom · MAX · UPGRADE SUBSCRIPTION · View
Room List Capacity · {n}% Filled · Our AI has a limit on how many rooms it can process currently.
Total {n} ft² · Heated {n} ft² · {n} Story
Continue with only {n} rooms · Continue with {n} rooms
Please create a full room list. · Partial room lists will generate incorrect results.
A complete room list helps us create better designs. · Add rooms to continue · Add a closet
All supported room types are already at their limit.
Story count: {n}. Learn about multi-story homes
Join waitlist to get early access to multi-story and basement designs. · Join Waitlist
You're on the waitlist. · We only support single-story homes for now.

Add Shape · Browse, edit or create the shape of your home.
My House Shape · Main House Area · Outdoor Area · Total Target Area
Choose Shape · My Shapes · Start my own · Custom Shape · No shape selected
{W} W x {D} D selected · Cancel · Add to canvas
Current Shape · Choose Different Shape · Delete this pinned shape?
Remove · Mirror · Recenter · Snap · Reset
AI-Create Mix · Best Balance · {n}% AI-Create · {n}% Placed by You
Placed by You · Place rooms on canvas to control their specific location and shape. · Placed
AI-Create · {n} Rooms · Delete
Buildable Area · Width · Depth · Target Home Size · Ceiling Height
Buildable Area is too small for your house. · Home Size is too large for this Buildable Area
Home Size is nearing this Buildable Area's capacity · Home Size is at this Buildable Area's capacity
Can't shrink further, unless you reduce your rooms.
Fix {n} issues before creating · ISSUE {i} OF {n} · Show issue
Move {A}, {B}, and {n} more inside the house shape
Increase shape or decrease rooms.
Roof Shape · Hip · Gable · Flat with Overhangs · Flat with Parapets · Shed Roof · Edit Roof
Reset camera · Create

New design · Latest · {k}/5 · Generating · {k} of 5 ready · Edit plan
Generating scheme {X}… · 3D preview will start after the floor plan is ready. · Building 3D model…
Edit manually · Furnish & Render · Door · Window · Opening
Type · Flip · Width · Move · Align · Delete · Cancel · Apply
Generation Failed · Something went wrong while generating this draft. This can happen if the
constraints were too difficult to satisfy.

Choose Palette · Default Palettes · My Palettes · Start fresh
Choose Materials · Choose Exterior Materials · Complete all 5 categories to render.
Cladding · Foundation · Roofing · Windows & Trim · Front Door · Save Palette · Load Palette
Choose your primary exterior material · Select your foundation material · Select your roof material
Choose your window and trim package · Pick your front door
Starting your render · Thinking through your constraints.

Add Cover Photo · Click or drop image to upload · Heated Area · Beds · Baths
Buildable Area · Flexible · Project Team · + Invite · Homeowner · Now
My Designs ({n}) · New ({n}) · Shortlisted ({n}) · Design Library ({n}) · Inspiration ({n})
+ New Design · Start New Design · Explore Other Designs · Shortlist your favorite designs.
Materializing · Preparing render · {n}% · just now · {n}m ago · {n} remix
View Design · Public · Remix · Download Files · Share
Heated Area · Total Area · Width x Depth · Bed · Bath
Design and render your first home in minutes. · Explore three different design directions.
Remix your favorite house designs. · Shortlist your two favorite designs.

Created by {author} on {date} · Pinned {n} times
Materials · This design has {n} material palette options.
About This Design · Rooms · {n} rooms · {n} more rooms · Preparing plan · Customize · Overview
Opening creator… · Reset
Design Details · Total Area · Area Breakdown · Heated Area · Unheated Area · Garage
Dimensions · Ceiling Height · Stories · Bedrooms · Bathrooms
Invite collaborators · Invite people to {project}. · Email address · name@example.com
PRO · Send invite · Current team · Manage team · Share this design instead · Copy link · Done

This is the Tutorial · Start Tutorial · TUTORIAL STEP {n} · I'm done
Available after the tutorial · You are almost done learning the basics of the product.
You can place more rooms after the tutorial is completed.
Tutorial complete · Your first house, from room list to rendered design. · Done

Monthly usage · Resets {date} · Plans & 3D · Renders · File Downloads
Additional this cycle · Subscriptions → · Unlimited · — left
Unlock Access & Usage · Free · Dreamer · Pro · Pro Scale · Enterprise · RECOMMENDED · CURRENT
Drafted does not check building codes. Generated plans are starting points for design
development and must be reviewed by a qualified design professional.
CAD and BIM exports are available on desktop — open this design on your computer to choose
from the formats currently available to you.
Creating and editing designs is built for larger screens. · Create on Desktop · Export on Desktop
```

## Appendix B — verified arithmetic constants

| Constant | Value | Source |
|---|---|---|
| Area gross-up (program → Total ft²) | **× 1.047** | 4 states, ratio 1.047–1.048 **[DERIVED]** |
| Proportional-chip scale | **≈ 6.83 px per √ft²** | measured on 6 chips **[SHOT]** |
| My Rooms tile scale | **≈ 7 px per √ft²**, floor **54 px** | 225→105, 152→82, 104→67, 62→58 **[SHOT]** |
| Capacity budget | **100 weight units**; per-type weights in §7.2 | hover deltas **[DERIVED]** |
| Capacity thresholds | green > 15 % remaining · yellow ≤ 15 % · red ≤ 0 % | **[CODE]** |
| Room size = | `round((tierMin + tierMax) / 2)` | 24/24 exact matches **[DERIVED]** |
| Tutorial progress | `≈ 6.25 % × stepNumber`, 16 steps | linear fit **[DERIVED]** |
| CTA "only" threshold | `roomCount < 11` | **[SHOT]** |
| Ceiling height | **10 ft 0 in**, fixed | **[SHOT]** **[CODE]** |
| Stories | **1**, fixed | **[SHOT]** **[CODE]** |
| Exterior wall thickness | 6.5" (draw); interior 4.5" | **[INFERRED]** |
| Default roof pitch / overhang | 6:12 / 18" | **[INFERRED]** |
| Variants per spread | **exactly 5** (A–E) | **[SHOT]** |
| Material slots | **exactly 5**, fixed order | **[CODE]** |
| Total material swatches | **119** | **[CODE]** |
| Export targets | **8** | **[CODE]** |
