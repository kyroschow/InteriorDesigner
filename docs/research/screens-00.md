# Drafted (drafted.ai) — Screen Forensics, Batch 00

Source: 12 sequential 1920×1200 desktop screen captures of one user session,
`/home/dell/Pictures/Screenshots/Screenshot from 2026-09-12 14-58-33.png` → `… 14-59-59.png`.

All 12 frames are in **Wizard Step 1 — Create Room List**, route `…/room-list`.
The batch captures: (a) the tutorial gate modal, (b) TUTORIAL STEP 1 spotlight, and
(c) a hover-sweep down the Room Catalog that reveals the per-room 3D preview, per-room
area at size M, and the live capacity-delta behaviour.

---

## 0. Constants that hold across ALL 12 frames

### 0.1 Browser chrome (not part of the app)
- Browser: Firefox-style chrome inside a desktop shell (left OS/app dock + a "Claude"
  sidebar). Tab strip: `New tab`, `Local Model Chat`, `Local Model Chat`,
  **`Drafted - Design your d…`** (active, has a "D" favicon), `Free 3D House Design`.
- Address bar shows the app URL (see below). A GNOME "Screenshot captured / You can paste
  the image from the clipboard." toast overlays the top-centre in frames 4–11 — OS noise,
  not app UI.
- App viewport origin ≈ x=364, y=148; app viewport ≈ **1544 × 1044 CSS px**.

### 0.2 URL (verbatim, identical in all 12 frames)

```
www.drafted.ai/app/studio/projects/114312/create/01M2B203CPTDZ0S2DVMTQF8AVC/room-list
```

Route grammar recovered:

```
/app/studio/projects/{projectId:numeric}/create/{designUlid:ULID-26}/{wizardStep}
```

- `projectId` = `114312` (numeric, DB id)
- `designUlid` = `01M2B203CPTDZ0S2DVMTQF8AVC` (26-char ULID — a *design run* inside a project)
- `wizardStep` = `room-list` (step 1 slug)

### 0.3 Top navigation bar (y ≈ 148–199, ~51 px tall, borderless except a 1 px bottom rule)

Left → right:
1. **`Drafted`** wordmark — high-contrast serif / Didone (Playfair-Display-like), ~22 px,
   near-black `#0C0A09`. Home link.
2. 🏠 outline house icon + **`My Studio`** — *also set in the serif face*, bold. Link to studio/dashboard.
3. Thin vertical divider `|`.
4. `‹` chevron-left + **`Back`** — sans-serif, medium grey. Goes back one step / to studio.
5. **Centre stepper** (3 numbered steps joined by long em-dash rules):
   - `①` filled black circle, white numeral + **`Create Room List`** in bold near-black = ACTIVE
   - `—`
   - `②` grey filled circle, white numeral + `Place Rooms & Shape` in grey = inactive
   - `—`
   - `③` grey filled circle + `Results` in grey = inactive
6. **`Learn`** — outlined pill button, ~1 px grey border, radius ~999 px, open-book icon + label.
7. **Credits pill** — outlined pill: gold/bronze ✨ sparkles icon, a short grey capsule
   (a credit meter/progress track, rendered empty-grey here), then **`5 left`** in bold.
8. **Avatar** — 36 px solid black circle, white bold initials **`NA`**.

### 0.4 Three-column page layout (step 1)

| Region | x-range | y-range | Notes |
|---|---|---|---|
| Room Catalog panel (card) | 499 → 1437 | 233 → 1157 | white `#FFF`, radius ~16, 1 px `#A4A4A4` border |
| ├ Catalog list column | 501 → 789 | 291 → 1157 | scrollable |
| ├ Custom scrollbar | 789 → 798 | 310 → 800 (thumb) | plus ▲ chevron at (793, 299) and ▼ chevron at (793, 1146) |
| ├ 3D preview canvas | 798 → 1437 | 291 → 1080 | isometric line-art render of the hovered room |
| └ Preview footer bar | 798 → 1437 | 1085 → 1120 | room icon + room name (left) · **S / M / L** segmented control (right) |
| My Rooms panel | 1457 → 1773 | 233 → 1047 | right column |
| Summary + Continue card | 1457 → 1773 | 1065 → 1157 | right column, below My Rooms |

Column gap ≈ 20 px. Page background is a warm off-white (≈ `#F9F6F1`); under the
tutorial scrim it measures `rgb(183,181,176)`, i.e. the scrim is ~`rgba(0,0,0,0.27)`.

### 0.5 Room Catalog panel internals

- **Header row** (y 250–275): a 3D-cube/box outline icon + **`Room Catalog`** (bold sans,
  near-black) on the left; **`Clear All`** outlined pill with a trash-can icon on the right.
  A 1 px hairline divider runs under the header at y ≈ 289.
- **Group headers**: a ☰ 3-bar "drag/reorder" glyph + group name in medium grey, e.g.
  `Beds & Baths` (y 318), `Living Spaces` (y 687).
- **Rows**: 48 px pitch for single-line rows; ~60 px for rows carrying a subtitle.
  Each row = `[family accent bar] [room icon] [room name] … [(−) count (+)] or [(+)]`.
- **Family accent bars**: 4 px-wide rounded vertical rules at x ≈ 531, spanning a
  *contiguous family* of rows (not the whole category):

| Family (rows spanned) | y-span | Accent hex |
|---|---|---|
| Primary Bed + Bedroom | 347–431 | `#FEDFD6` blush pink |
| Primary Bath + Bathroom | 443–527 | `#D1E5F7` pale blue |
| Primary Closet + Bed Closet | 539–647 | `#FDDBC1` pale orange |
| Kitchen + Dining + Breakfast Nook | 715–847 | `#FDE08F` warm yellow |
| Pantry | 859–895 | `#FDE08F` |
| Living (+ the locked Den/Family Room/Sunroom upsell block) | 907–1113 | `#FDE08F` |
| Foyer | 1125–1157 | `#FDE08F` |

- **Row states**
  - *Neutral / count 0*: white background, outline `(+)` circle button only.
  - *Added / count ≥ 1*: row background gets a very light family tint
    (`#FEF2EE` for beds, `#FEF2E8` for closets) and the control becomes a
    **stepper**: outlined `(−)` circle, numeral, outlined `(+)` circle.
    When count = 1 the `(−)` is rendered grey/disabled-looking.
  - *Hover / focused (the row whose preview is showing)*: family tint **plus** a
    ~1.5 px near-black rounded ring (radius ~10 px) drawn around the whole row.
  - *Auto-included & locked*: `Bed Closet` shows a subtitle and a **greyed-out `(+)`**
    (cannot be incremented independently) while still showing its derived count.

### 0.6 Full visible catalog contents (identical scroll position in all 12 frames)

**Group `Beds & Baths`**
| # | Row label | Icon | Subtitle | Control |
|---|---|---|---|---|
| 1 | `Primary Bed` | double bed (headboard) | — | `(−) 1 (+)` |
| 2 | `Bedroom` | single bed, side view | — | `(+)` → becomes `(−) 1 (+)` from frame 4 |
| 3 | `Primary Bath` | claw-foot bathtub | — | `(+)` |
| 4 | `Bathroom` | shower head / shower stall | — | `(+)` |
| 5 | `Primary Closet` | shelving unit | `Auto-included wit…` (truncated) | `(−) 1 (+)` |
| 6 | `Bed Closet` | coat hanger | `Auto-included with Bedroom` (frame 1) → `Auto-included with Bed…` (frames 4+) | count `1` + **disabled** `(+)` |

**Group `Living Spaces`**
| # | Row label | Icon | Control |
|---|---|---|---|
| 7 | `Kitchen` | counter + upper cabinet | `(+)` |
| 8 | `Dining` | table with legs/chairs | `(+)` |
| 9 | `Breakfast Nook` | small table grid | `(+)` |
| 10 | `Pantry` | shelving / cans | `(+)` |
| 11 | `Living` | sofa | `(+)` |
| — | **Upsell block** (see 0.7) | | |
| 12 | `Foyer` | open door | `(+)` |

(list continues below the fold; ▼ chevron indicates more rows)

### 0.7 "Upgrade Subscription" upsell block (inside the Living family)

A nested card, background `#FBF8EE` (pale cream), 1 px gold/olive border, radius ~12:
- **Badge pill** top-left: `UPGRADE SUBSCRIPTION` — uppercase, letter-spaced, ~10 px bold,
  dark-olive text on a pale-gold fill with a gold border.
- **`View`** — solid black pill button, white bold label, top-right of the card.
- Three **locked rows**, each `[icon] [name] [🔒 lock-in-circle button]`:
  - `Den` (floor-lamp icon)
  - `Family Room` (sofa + TV icon)
  - `Sunroom` (potted plant icon)
  Lock button = outlined circle with a padlock glyph; rows are greyed/non-interactive.

### 0.8 My Rooms panel (right column)

Header: [4-circle cluster icon] **`My Rooms`** · `N Rooms` (grey) · `|` divider ·
**`1 Story`** outlined pill button with a pencil-in-square (edit) icon — i.e. the
story count is editable.

Below a hairline rule: a **flow/wrap grid of room chips**. Each chip is a
rounded square (radius ~12) filled with the room's swatch colour, containing
bold room name (wrapping to 2 lines) and, under it, `M {n} ft²` — i.e. the
**size code + area**. Chip *size is proportional to the room area* (Primary
Bedroom 225 ft² renders ~2× the edge of Bed Closet 23 ft²).

Footer of the panel:
- **`Room List Capacity`** + an ⓘ info icon, right-aligned `N% Filled` and a green status dot.
  On hover of a catalog row, a bold **`+N%`** delta appears between the percentage and the dot.
- A horizontal progress bar: solid green fill for current capacity, plus a **lighter
  green preview segment** appended showing the hovered room's contribution.

### 0.9 Summary + Continue card (right column, bottom)

- Stat line: `Total {n} ft²` `|` `Heated {n} ft²` `|` `{n} Story` — labels in grey,
  values in bold black, separated by thin vertical rules.
- **Primary CTA**: full-width solid black pill button, white bold label,
  a 2×2 grid/blueprint icon on the left and a `›` chevron on the right.
  Label is dynamic and *nags*: **`Continue with only 2 rooms`** → **`Continue with only 4 rooms`**.

### 0.10 3D preview render style (centre canvas)

Hand-drawn/technical isometric cutaway: thin black line art, white walls with
soft grey shading and a cast-light gradient, furniture drawn in outline,
and a **floor plane tinted with that room type's swatch colour**. Small tick /
extension marks at the floor corners imply dimension witness lines. Two walls
shown (back-left and back-right), open toward the viewer.

### 0.11 Colour system recovered (exact sampled hex)

| Token | Hex | Used for |
|---|---|---|
| Bed family accent | `#FEDFD6` | accent bar, Bedroom chip |
| Primary Bedroom chip | `#FDC7B7` | salmon |
| Bath family accent | `#D1E5F7` | accent bar, Bathroom chip |
| Primary Bathroom chip | `#B3D5F3` | mid blue |
| Closet family accent | `#FDDBC1` | accent bar, Bed Closet chip |
| Primary Closet chip | `#FCC79C` | orange |
| Living/kitchen accent | `#FDE08F` | accent bar, Kitchen / Dining / Nook chips |
| Pantry chip | `#EFDAAF` | muted tan-yellow |
| Hallway chip | ≈ `#FCE9B2` (measured `#B9AB83` under 0.735 scrim) | pale yellow |
| Added-row tint (beds) | `#FEF2EE` | row bg |
| Added-row tint (closets) | `#FEF2E8` | row bg |
| Hover-row tint (beds) | `#FFF8F6` | row bg |
| Upsell card bg | `#FBF8EE` | cream |
| Upsell badge text/border | ≈ `#B9AD76` | olive-gold |
| Panel white | `#FFFFFF` | cards |
| Page bg (est.) | ≈ `#F9F6F1` | warm off-white |
| Primary button | `#0C0A09` near-black | CTA, Start Tutorial, View |
| Capacity green | `#4CAF50`-ish solid + `#7DC98A`-ish preview | progress bar |

Typography: **serif display** (Didone/Playfair-like) for the `Drafted` wordmark,
`My Studio`, and tutorial headings; **geometric/neo-grotesque sans** (Inter-like)
for everything else. Bold 600–700 for room names, values, and buttons; regular grey
for labels and subtitles.

---

## 1. `Screenshot from 2026-09-12 14-58-33.png` — Tutorial gate modal

- **URL**: `www.drafted.ai/app/studio/projects/114312/create/01M2B203CPTDZ0S2DVMTQF8AVC/room-list`
- **Step**: ① `Create Room List` active.
- **Sub-state**: **Pre-tutorial modal**. The *entire page* is dimmed by a dark scrim;
  a centred white dialog (radius ~20, soft shadow, ~350×180) sits over the canvas:
  - Title (serif, bold): **`This is the Tutorial`**
  - Body: `You will have full freedom after the tutorial to use the product however you want.`
  - **`Start Tutorial`** — full-width solid black pill button, white bold label.
  - No close ✕ / no "Skip" is visible — the modal appears mandatory-looking.
- **Top nav fully visible here** (only frame where it is not occluded): `Drafted`,
  `🏠 My Studio`, `| ‹ Back`, stepper ①②③, `Learn`, credits pill `✨ ▭ 5 left`, avatar `NA`.
- **My Rooms**: header `My Rooms  2 Rooms | ✎ 1 Story`. Two chips:
  - `Primary Bedroom` `M 225 ft²` (large salmon chip)
  - `Primary Closet` `M 62 ft²` (small orange chip)
- **Room List Capacity**: `8% Filled` ● green; bar ~8% filled, no delta segment.
- **Summary**: `Total 316 ft²  |  Heated 316 ft²  |  1 Story`
- **CTA**: `Continue with only 2 rooms` (dimmed by the scrim).
- **Centre canvas**: a partially-visible isometric room render (bedroom) behind the modal.
- **Catalog**: Primary Bed `(−) 1 (+)`; Primary Closet `(−) 1 (+)`; Bed Closet shows
  `Auto-included with Bedroom` with a greyed `(+)` and **no count**.

---

## 2. `… 14-58-54.png` — TUTORIAL STEP 1 spotlight on the Room Catalog

- **URL**: unchanged.
- **Step**: ① active.
- **Transition from #1**: user clicked **`Start Tutorial`**. The centre modal is gone.
- **New UI — tutorial coach-mark** (top-right, ~320×160, white card, radius ~16, shadow,
  anchored over the `Learn`/credits area):
  - Eyebrow: **`TUTORIAL STEP 1`** — uppercase, letter-spaced, grey, ~11 px
  - Title (serif bold, ~20 px): **`Build your dream room list`**
  - Body ¶1: `More complete room lists give better direction for our AI to meet your needs.`
  - Body ¶2: `Click Continue when you're done.`
  - Footer: a thin **tutorial progress bar** — a short black segment at ~8 % of a pale grey
    track (implies ~8–12 tutorial steps total).
- **Spotlight mechanics**: the scrim now dims the top nav, the My Rooms panel and the page
  background, while the **Room Catalog panel** *and* the **Summary/Continue card** are
  raised above the scrim at full brightness. The Room Catalog card also grows slightly
  (x 487→1452) — a "lifted" spotlight transform.
- **Centre canvas** now fully readable: isometric **Primary Bedroom** — two walls with
  3 tall windows, king bed with headboard + 2 nightstands, a bench at the foot, an
  armchair + round side table, a chest; salmon-tinted floor.
- **Preview chips on the canvas** (bottom-left of the canvas area):
  `Primary Bedroom  M - 225 ft²` (salmon `#FDC7B7`) and `Primary Closet  M - 62 ft²` (orange).
- **Preview footer**: bed icon + **`Primary Bedroom`**, right-aligned **`S  [M]  L`**
  segmented control with **M** selected (black rounded-square chip, white glyph).
- **CTA** now bright: black `Continue with only 2 rooms`.
- Catalog hover target: `Primary Bed` row (tinted `#FEF2EE`).

---

## 3. `… 14-59-25.png` — identical state (31 s later)

- **URL / step / panels**: byte-identical to #2 except the OS clock (`14:58`→`14:59`) and a
  few pixels of the 3D illustration (idle micro-animation). No user interaction occurred.
- Confirms the tutorial coach-mark is **persistent**, not a timed toast.

---

## 4. `… 14-59-29.png` — user added a `Bedroom`; hover shows Bedroom preview

- **URL**: unchanged.
- **Transition from #3**: user clicked the **`(+)`** on the `Bedroom` row.
- **Catalog changes**:
  - `Bedroom` row now `(−) 1 (+)` with a dark hover/active ring and a pink tint.
  - `Bed Closet` row now reads count **`1`** (auto-derived) with a still-disabled `(+)`;
    its subtitle truncates to `Auto-included with Bed…`.
- **My Rooms** grows from 2 chips to **5 chips** (in a wrapping flow, size ∝ area):
  - Row 1: `Primary Bedroom  M 225 ft²` · `Bedroom  M 152 ft²` · `Primary Closet  M 62 ft²`
  - Row 2: `Bed Closet  M 23 ft²` · **`Hallway  M 23 ft²`** ← *auto-generated circulation room*
- **Room List Capacity**: `13% Filled` **`+5%`** ● — the `+5%` is the *hover delta* for the
  Bedroom row; the bar shows a solid base segment plus a lighter green preview segment.
- **Summary**: `Total 508 ft²  |  Heated 508 ft²  |  1 Story`
- **CTA**: **`Continue with only 4 rooms`** — note the count says **4** while 5 chips are
  shown ⇒ auto-generated circulation (`Hallway`) is **not** counted as a "room".
- **Centre canvas**: isometric **Bedroom** — one window, queen bed, dresser, nightstand,
  pink floor.
- **Preview chips**: `Bedroom  M - 152 ft²` (pink `#FEDFD6`) and `Closet  M - 23 ft²`
  (orange `#FDDBC1`) — note the label shortens to `Closet` on the canvas chip.
- **Preview footer**: bed icon + `Bedroom`, `S [M] L` with M selected.

---

## 5. `… 14-59-33.png` — hover `Primary Bath`

- **URL / step**: unchanged. My Rooms / totals unchanged (no click, hover only).
- **Transition from #4**: pointer moved to the `Primary Bath` row (count still 0).
- **Catalog**: `Primary Bath` row gets a pale-blue tint + dark ring; `(+)` only (no stepper).
- **Capacity**: `13% Filled` **`+4%`** ●.
- **Centre canvas**: isometric **Primary Bathroom** — blue floor, partition walls,
  water closet, double vanity with mirrors, glass shower enclosure.
- **Preview chip**: `Primary Bathroom  M - 88 ft²` (blue `#B3D5F3`).
- **Preview footer**: bathtub icon + **`Primary Bathroom`** (full name, vs the catalog's
  abbreviated `Primary Bath`), `S [M] L`.

---

## 6. `… 14-59-36.png` — hover `Bathroom`

- Same route/step/state; hover moved down one row.
- **Catalog**: `Bathroom` row tinted pale blue + dark ring.
- **Capacity**: `13% Filled` **`+3%`** ●.
- **Centre canvas**: isometric **Bathroom** — long narrow room, blue floor, double vanity
  with two mirrors and sconces, bathtub/shower combo, toilet.
- **Preview chip**: `Bathroom  M - 61 ft²` (`#D1E5F7`).
- **Preview footer**: shower icon + `Bathroom`, `S [M] L`.

---

## 7. `… 14-59-40.png` — hover `Primary Closet`

- **Catalog**: `Primary Closet` row (already count 1) tinted orange + dark ring;
  stepper `(−) 1 (+)` visible; subtitle `Auto-included wit…`.
- **Capacity**: `13% Filled` **`+4%`** ● — so the delta is shown even for rooms already in
  the list (it previews adding *another* one).
- **Centre canvas**: isometric **Primary Closet** — walk-in closet, hanging rails on three
  walls, shelf above, peach/orange floor, no windows.
- **Preview chip**: `Primary Closet  M - 62 ft²` (`#FCC79C`).
- **Preview footer**: shelving icon + `Primary Closet`, `S [M] L`.

---

## 8. `… 14-59-45.png` — hover `Bed Closet` (auto-included, locked)

- **Catalog**: `Bed Closet` row tinted + dark ring, showing count `1` and a **disabled** `(+)`.
- **Capacity**: `13% Filled` ● with **no `+N%` delta** and **no preview segment** on the bar —
  because the row cannot be incremented. This is the tell that delta-preview is bound to
  "can this row be added?".
- **Centre canvas**: isometric **Bed Closet** — a small reach-in corner closet, single
  hanging rail + shelf, peach floor.
- **Preview chip**: `Bed Closet  M - 23 ft²` (`#FDDBC1`).
- **Preview footer**: hanger icon + `Bed Closet`, `S [M] L`.

---

## 9. `… 14-59-49.png` — hover `Kitchen` (Living Spaces group)

- **Transition**: pointer jumped from the Beds & Baths group down to `Kitchen`.
- **Catalog**: `Kitchen` row tinted warm yellow + dark ring, `(+)` only.
- **Capacity**: `13% Filled` **`+3%`** ●.
- **Centre canvas**: isometric **Kitchen** — yellow floor, run of base + wall cabinets,
  range with hood, tall fridge/pantry column, large island with **4 bar stools**.
- **Preview chip**: `Kitchen  M - 189 ft²` (`#FDE08F`) — the largest preview chip so far.
- **Preview footer**: counter/stove icon + `Kitchen`, `S [M] L`.

---

## 10. `… 14-59-52.png` — hover `Dining`

- Note: the OS screenshot toast has cleared, so the **URL bar is fully legible again** and
  confirms the route verbatim.
- **Catalog**: `Dining` row tinted yellow + dark ring.
- **Capacity**: `13% Filled` **`+3%`** ●.
- **Centre canvas**: isometric **Dining** — yellow floor, 3 tall windows, long rectangular
  table with **8 chairs**, a ring chandelier above.
- **Preview chip**: `Dining  M - 167 ft²` (`#FDE08F`).
- **Preview footer**: table icon + `Dining`, `S [M] L`.

---

## 11. `… 14-59-56.png` — hover `Breakfast Nook`

- **Catalog**: `Breakfast Nook` row tinted yellow + dark ring.
- **Capacity**: `13% Filled` **`+3%`** ●.
- **Centre canvas**: isometric **Nook** — yellow floor, 2 windows, round pedestal table with
  **4 chairs**, a potted palm in the corner.
- **Preview chip**: **`Nook`** `M - 124 ft²` (`#FDE08F`) — canvas chip uses the short name
  while the catalog row says `Breakfast Nook`.
- **Preview footer**: grid-table icon + **`Nook`**, `S [M] L`.

---

## 12. `… 14-59-59.png` — hover `Pantry`

- **Catalog**: `Pantry` row tinted beige `#F6EBD8` + dark ring; its accent bar is a
  **separate segment** from the Kitchen/Dining/Nook bar above it.
- **Capacity**: `13% Filled` **`+4%`** ●.
- **Centre canvas**: isometric **Pantry** — a small closet-like room, floor-to-ceiling
  wire/wood shelving on all three walls loaded with jars and boxes, tan floor.
- **Preview chip**: `Pantry  M - 41 ft²` (`#EFDAAF` — a visibly *muted* yellow, distinct
  from the kitchen-family `#FDE08F`).
- **Preview footer**: shelves icon + `Pantry`, `S [M] L`.

---

## 13. State-transition map recovered from this batch

```
[Tutorial gate modal]  --click "Start Tutorial"-->  [TUTORIAL STEP 1 coach-mark + spotlight]
            (frame 1)                                             (frames 2–3)

[coach-mark]  --click (+) on "Bedroom"-->  room list mutates      (frame 4)
      rooms 2 -> 4 (+ 1 auto Hallway = 5 chips)
      Total/Heated 316 ft² -> 508 ft²
      capacity 8% -> 13%
      CTA label "Continue with only 2 rooms" -> "Continue with only 4 rooms"
      Bed Closet auto-count 0 -> 1

[coach-mark]  --hover any catalog row-->  centre canvas swaps to that room's isometric
      render + area chip(s); footer name + S/M/L updates; capacity shows "+N%" delta
      and a light-green preview segment on the bar.
      (frames 5–12: Primary Bath, Bathroom, Primary Closet, Bed Closet, Kitchen,
       Dining, Breakfast Nook, Pantry)

[hover a row that cannot be added (Bed Closet)] --> no "+N%", no preview segment
```

### Derived rules
1. **Auto-inclusion**: `Primary Closet` is auto-included with `Primary Bed`;
   `Bed Closet` is auto-included with `Bedroom`. Auto-included rows show a subtitle
   `Auto-included with {parent}` and a disabled `(+)`.
2. **Auto-circulation**: a `Hallway` chip (23 ft²) is generated by the system once the
   room list warrants it (appeared when Bedroom #2 was added). It is shown in *My Rooms*
   but is **excluded from the "N rooms" count** in the CTA.
3. **Room count vs chips**: `N Rooms` / `Continue with only N rooms` counts only
   user-selectable rooms (Primary Bed + Bedroom + Primary Closet + Bed Closet = 4).
4. **Area model**: each room type has S/M/L presets; every chip is labelled
   `{sizeCode} {area} ft²`. Defaults observed are all **M**.
5. **Totals gross-up**: `Total`/`Heated` exceed the naive chip sum
   (287 → 316, 485 → 508), implying a wall-thickness / circulation gross-up factor
   (~1.05–1.10) applied on top of net room areas.
6. **Capacity** is a soft budget indicator (`% Filled` + green/amber/red dot), with a
   live hover delta.

### Observed literal area table (all at size **M**)

| Room type | Area (M) | Chip colour | Hover Δ capacity |
|---|---|---|---|
| Primary Bedroom | 225 ft² | `#FDC7B7` | — |
| Bedroom | 152 ft² | `#FEDFD6` | +5 % |
| Primary Bathroom | 88 ft² | `#B3D5F3` | +4 % |
| Bathroom | 61 ft² | `#D1E5F7` | +3 % |
| Primary Closet | 62 ft² | `#FCC79C` | +4 % |
| Bed Closet | 23 ft² | `#FDDBC1` | (none — locked) |
| Hallway (auto) | 23 ft² | ≈ `#FCE9B2` | n/a |
| Kitchen | 189 ft² | `#FDE08F` | +3 % |
| Dining | 167 ft² | `#FDE08F` | +3 % |
| Nook (Breakfast Nook) | 124 ft² | `#FDE08F` | +3 % |
| Pantry | 41 ft² | `#EFDAAF` | +4 % |

---

## 14. Feature / control inventory revealed by this batch

**Navigation & shell**
1. Serif `Drafted` wordmark → home.
2. `My Studio` link with house icon.
3. `Back` link with chevron.
4. 3-step wizard stepper: `1 Create Room List` / `2 Place Rooms & Shape` / `3 Results`
   with numbered circles (active = black, inactive = grey) joined by rules.
5. `Learn` outlined pill button (book icon) — help/docs.
6. Credits pill: sparkles icon + meter + `5 left` (generation credit balance).
7. Avatar circle with initials (`NA`) — account menu.

**Onboarding / tutorial**
8. Blocking tutorial gate modal `This is the Tutorial` with `Start Tutorial` CTA.
9. Step-numbered coach-mark popover (`TUTORIAL STEP 1`, serif title, 2-paragraph body)
   with a step progress bar at ~8 %.
10. Spotlight scrim that dims everything except the relevant panel(s).

**Room catalog (step 1 left column)**
11. `Room Catalog` panel with cube icon.
12. `Clear All` destructive pill button (trash icon) — empties the room list.
13. Collapsible/reorderable groups with ☰ handle: `Beds & Baths`, `Living Spaces`, …
14. Family accent bars colour-coding bed / bath / closet / living families.
15. `(+)` add button on every unselected room row.
16. `(−) count (+)` quantity stepper on every selected room row.
17. Disabled `(+)` and derived count for auto-included rooms.
18. Subtitle `Auto-included with {parent}` with ellipsis truncation.
19. Custom scrollbar with ▲/▼ chevron buttons at the list ends.
20. Locked premium rooms (`Den`, `Family Room`, `Sunroom`) with padlock buttons.
21. `UPGRADE SUBSCRIPTION` badge + `View` black pill inside the paywall card.

**3D preview (step 1 centre)**
22. Isometric line-art room render that swaps on row hover.
23. Floor plane tinted with the room family colour.
24. Area chip(s) overlaid on the canvas: `{RoomName}  {size} - {area} ft²`.
25. Companion chip rendering for auto-included children (e.g. `Closet M - 23 ft²`
    alongside `Bedroom M - 152 ft²`).
26. Preview footer showing room icon + full room name.
27. **`S` / `M` / `L` segmented size selector** (active = black rounded square, white glyph).

**My Rooms (step 1 right column)**
28. `My Rooms` panel with `N Rooms` count.
29. `1 Story` outlined pill with edit (pencil) icon — story-count editor.
30. Area-proportional room chips in a wrapping flow, labelled `{size} {area} ft²`.
31. Auto-generated circulation chips (`Hallway`) shown but excluded from the room count.
32. `Room List Capacity` meter with ⓘ tooltip trigger, `N% Filled`, status dot,
    and a hover `+N%` delta with a two-tone progress bar.

**Summary & progression**
33. Stat strip `Total {n} ft² | Heated {n} ft² | {n} Story`.
34. Dynamic, nagging primary CTA `Continue with only {n} rooms` (blueprint icon + chevron)
    that advances to wizard step 2.

---

## 15. Open questions for later batches

- What does step 2 `Place Rooms & Shape` look like; what is its route slug?
- What does step 3 `Results` show (design variants A/B/C/D/E, version `1/5`…`5/5`,
  dimension labels such as `52 ft 4 in`) — none of that appears in this batch.
- Full catalog below the fold (rows after `Foyer`) and the remaining groups.
- The `Learn` panel, the `View` upgrade/pricing modal, and the `NA` avatar menu.
- The ⓘ tooltip copy for `Room List Capacity`, and what turns the dot amber/red.
- How `1 Story` editing works (dropdown? stepper? modal?).
- What happens on `S`/`L` selection — does it change the chip area and the stored room size?
- Exact total tutorial step count (progress bar ≈ 8 %, so likely 8–12 steps).
- The exact gross-up formula behind `Total`/`Heated` vs the sum of chip areas.
