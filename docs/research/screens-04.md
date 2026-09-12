# Drafted (drafted.ai) — Screen Forensics, Batch 04

**Source:** 12 sequential screenshots, `/home/dell/Pictures/Screenshots/Screenshot from 2026-09-12 15-07-09.png` → `… 15-08-40.png`
**Session window:** 15:07:09 → 15:08:40 (91 seconds of one continuous session)
**Viewport:** 1920×1200 (Firefox, Linux). Page content begins at y≈150 (below browser chrome).
**Wizard step for ALL 12 frames:** Step **1 — Create Room List**. No step change occurs in this batch.
**Tutorial state for ALL 12 frames:** **TUTORIAL STEP 1** coach-mark card is open, top-right, and never dismissed.

> All 12 frames are the *same screen* in different sub-states. The batch is essentially a deep forensic pass on the **Room List builder** (step 1 of 3) and, specifically, on the **room size preview (S/M/L)** interaction.

---

## 0. Constant chrome (identical in all 12 frames)

### 0.1 Browser / environment (not app UI, but useful to disambiguate)
- Firefox with tabs: `New tab`, `Local Model Chat`, `Local Model Chat`, **`Drafted - Design your d…`** (active, favicon = black rounded square with white "D"), `Free 3D House Design …` (competitor tab), `+`.
- OS notification toast overlays the top-center in 8 of 12 frames: "**Screenshot** · Just now / Screenshot captured / You can paste the image from the clipboard." — this toast covers the left half of the URL bar in those frames.
- Intercom-style **round chat launcher** at bottom-right of the viewport (≈1866, 1147) — dark rounded square with a white speech-bubble glyph. Present in every frame (app-level support widget).

### 0.2 URL (verbatim, from the frames where the toast is not covering it)
```
www.drafted.ai/app/studio/projects/114312/create/01M2B203CPTDZ0S2DVMTQF8AVC/room-list
```
Route structure decoded:
- host `www.drafted.ai`
- `/app` — authenticated app shell
- `/studio` — the "My Studio" area
- `/projects/114312` — numeric project id
- `/create/01M2B203CPTDZ0S2DVMTQF8AVC` — a **ULID** (26 chars, Crockford base32) identifying one *design run / creation session* inside the project
- `/room-list` — the step-1 slug (implies sibling slugs for step 2 and step 3)

In the toast-covered frames the visible tail is `…Z0S2DVMTQF8AVC/room-list`, i.e. identical — **the URL never changes across the 12 frames**.

### 0.3 Top app bar (y ≈ 150–196, ~46 px tall, background = warm light gray)
Left → right:
1. **`Drafted` wordmark** (x≈378). High-contrast **serif / didone display face**, all lowercase-height except the cap D, with a distinctive **swash tail descending from the final `d`** that sweeps back left under the word. Pure black.
2. **🏠 `My Studio`** (x≈470) — outline house icon + bold serif-ish label. Navigates back to the studio/project list.
3. Thin vertical divider `|`.
4. **`‹ Back`** (x≈593) — chevron-left + gray label.
5. **Wizard stepper**, horizontally centered (x≈925–1350):
   - `①` **filled black circle, white "1"** + **bold black** label `Create Room List` ← ACTIVE
   - em-dash connector `—`
   - `②` mid-gray filled circle, white "2" + medium-gray label `Place Rooms & Shape`
   - em-dash connector `—`
   - `③` light-gray filled circle, white "3" + light-gray label `Results`
6. **Right cluster (x≈1655–1900) is occluded by the tutorial card in every frame.** Only the top ~18 px of the controls is visible: **two pill-shaped buttons** (rounded ~18 px radius, light bg, side by side, ≈95 px and ≈110 px wide) and, at the far right edge, the top arc of a **circular avatar** (dark stroke). From the rest of the product these are: `Learn` button, credits pill ("N left"), user avatar. *Their labels cannot be read in this batch — the tutorial card hides them.*

### 0.4 Page background
Warm neutral gray `#B7B5B0` as sampled — but note this is the **dimmed value**: the tutorial coach-mark applies a **black scrim at ≈27 % opacity** over everything except the spotlit elements. Un-dimmed equivalents are ≈ `observed ÷ 0.73`. Spotlit (full brightness) elements are the **Room Catalog / preview card** and the **bottom summary bar**; the **My Rooms** right rail is dimmed.

### 0.5 Main layout (three zones)
| Zone | x-range | Notes |
|---|---|---|
| **Room Catalog + Room Preview card** | 487 → 1443 (956 px) | ONE white rounded card (radius ≈16 px, soft shadow), y 220 → 1165 |
| ├─ Room Catalog list | 510 → 795 (≈300 px) | own vertical scrollbar at x≈793 with ▲ (y≈299) / ▼ (y≈1147) chevron affordances |
| └─ Room Preview pane | 800 → 1440 | 3-D isometric room render + footprint chip + S/M/L control |
| **My Rooms rail** | 1450 → 1790 (340 px) | gray translucent panel, y 240 → ~1050 |
| **Summary / Continue bar** | 1440 → 1800 | cream outer card y 1050 → 1165 |

---

## 1. Panel-by-panel anatomy (constant across the batch)

### 1.1 "Room Catalog" panel
**Header** (y≈262): 3-D cube/box outline icon + bold black `Room Catalog`; right-aligned **`🗑 Clear All`** outlined pill button (white fill, 1 px gray border, trash icon + bold label).

**Body** = scrollable list of **category sections**. Each section header = a **3-bar "hamburger" grip icon** (drag-handle / collapse affordance) + gray bold label. Observed categories in order:

1. **Beds & Baths**
2. **Living Spaces**
3. **Outdoor Spaces**
4. **Specialty Spaces** (partially revealed — first row `Office` clipped at the fold)

Within a section, rows are grouped into **sub-groups marked by a colored vertical rail** on the far left (4 px wide, rounded, spanning all rows of that sub-group). Rail colors (sampled exactly, undimmed):

| Sub-group | Rail hex |
|---|---|
| Beds (Primary Bed, Bedroom) | `#FEDFD6` (pale rose) |
| Baths (Primary Bath, Bathroom) | `#D1E5F7` (pale blue) |
| Closets (Primary Closet, Bed Closet) | `#FDDBC1` (pale peach) |
| Living Spaces (all four sub-rails) | `#FDE08F` (gold) |
| Outdoor Spaces | `#DAF7DA` (mint) |
| Specialty Spaces | `#FEDBEA` (pink) |

**Row anatomy:** `[glyph icon] [Room name] [optional gray sub-label] ……… [⊖] [count] [⊕]`
- Rows with **count 0**: no `⊖`, no number — only a circled `⊕` on the right; row background transparent/white.
- Rows with **count ≥ 1**: tinted row background matching the family (`#FEF2EE` rose / `#EEF5FC` blue / `#FEF2E8` peach / `#FFF8E5` gold), name in bold black, `⊖` circled minus, the integer, `⊕` circled plus.
- Rows **at their maximum**: the `⊕` is replaced by a **`MAX` badge** — dark gray pill `#78716B`, white uppercase letter-spaced text.
- Rows that are **auto-derived and locked**: `⊖` is omitted entirely and `⊕` is rendered **disabled/ghosted** (Bed Closet).
- **Sub-label** (gray, 11 px, truncated with ellipsis): `Auto-included wit…` (Primary Closet), `Auto-included with Bed…` (Bed Closet).

**Complete catalog inventory observed in this batch**

*Beds & Baths*
| Room | Icon | Count in session | Controls |
|---|---|---|---|
| Primary Bed | bed (headboard, front view) | 1 | ⊖ 1 ⊕ |
| Bedroom | bed (side view, simplified) | 2 | ⊖ 2 ⊕ |
| Primary Bath | clawfoot bathtub | 1 | ⊖ 1 ⊕ |
| Bathroom | tiled shower / stall | 2 | ⊖ 2 ⊕ |
| Primary Closet | shelving grid | 2 | ⊖ 2 ⊕ + sub-label `Auto-included wit…` |
| Bed Closet | clothes hanger | 2 | **no ⊖**, ghosted ⊕ + `Auto-included with Bed…` |

*Living Spaces*
| Room | Icon | States seen |
|---|---|---|
| Kitchen | stove + counter units | `1 MAX` (frame 1) → `0 / ⊕` (frames 2-12) |
| Dining | dining table with chairs (plan view) | `1` (frame 1) → `0 / ⊕` |
| Breakfast Nook | small square table grid | `0 / ⊕` → `1 MAX` (frames 2-4) → `0 / ⊕` |
| Pantry | shelving unit | `0 / ⊕` → `1 MAX` (frames 5-7) → `0 / ⊕` |
| Living | sofa | `0 / ⊕` → `1 MAX` (frames 8-12) |
| **[UPGRADE BLOCK]** | — | see below |
| Foyer | open double door | always `0 / ⊕` |

*Living Spaces — locked upgrade block* (a bordered sub-card, gold-tinted `#FBF8EE`, 1 px gold border, nested inside the Living sub-group rail, sitting directly beneath the `Living` row):
- Header: **`UPGRADE SUBSCRIPTION`** pill — gold fill `#F2E5AC`, gold border, uppercase, letter-spaced, small bold — and a black **`View`** button (rounded rect, white bold label) on the right.
- Locked rows, each `[icon] [name] …… [🔒 circled padlock]`:
  - `Den` (floor-lamp icon)
  - `Family Room` (sofa + TV icon)
  - `Sunroom` (potted plant / leaves icon)

*Outdoor Spaces* (mint rail)
- `Front Porch` (porch railing/columns icon) — `0 / ⊕`
- `Outdoor Living` (outdoor sofa icon) — `0 / ⊕`

*Specialty Spaces* (pink rail)
- `Office` (desk icon) — clipped at the bottom fold; `⊕` visible. More rows exist below the fold (not scrolled into view in this batch).

### 1.2 Room Preview pane (right side of the white card)
- **Large isometric 3-D line-art render** of the currently-focused room type at the currently-highlighted size. Style: white/very-light-gray walls and furniture, thin black line work, **soft yellow-tinted floor plane**, drop shadow, exterior dimension tick-marks drawn along the two visible floor edges (architectural extension lines with end serifs — no numeric dimension text at this step).
- Renders are **distinct per (room type × size)** — larger sizes are not just scaled, they gain content:
  - *Dining S* → small square room, 1 window bank, 4-seat table.
  - *Dining M* → wider room, 2 window banks, chandelier, 6-seat table.
  - *Dining L* → widest room, 2 window banks + chandelier + **sideboard/credenza**, 8-seat long table.
  - *Pantry S* → narrow corner of shelving.
  - *Pantry M / L* → full walk-in with multiple shelf runs.
  - *Living S → M → L* → sofa only → sofa + fireplace + TV wall → sofa + sectional + armchair + fireplace + larger window wall.
  - *Den S → M* → single armchair + bookcase wall → armchair pair + round table + full-height bookcase wall.
- **Footprint chip** (lower area of the pane, roughly centered at x≈1119): a **yellow rounded square whose side length is proportional to √area** (measured constant ≈ **6.83 px per √ft²**, e.g. 241 ft² → 107 px, 167 ft² → 88 px, 95 ft² → 66 px, 442 ft² → 136 px, 202 ft² → 97 px). It contains the **room name (bold, black)** and, on the line below, `"<SIZE> - <N> ft²"` in gray. The chip is a true-scale footprint swatch, so the user can visually compare sizes.
  - Chip fill colors are per room family: Dining `#FDE08F`, Living `#FEEAB2`, Den `#FEEAB2`, Pantry `#EFDAAF`.
- **Bottom control strip** (y≈1100, spanning the full pane width):
  - Left: the **room's icon + bold room name** (e.g. `▥ Dining`, `▥ Pantry`, `▤ Living`, `▤ Den`).
  - Right: **S / M / L segmented control** — three ~32 px rounded-square cells. The **highlighted cell is solid black with white bold letter**; the other two are plain (transparent bg, medium-gray bold letter). A **light-gray 2 px rounded outline ring** additionally appears on the cell under the pointer / with focus (in frame 2 the ring is on `S` while `L` is the black/selected one — proving ring = hover/focus, black fill = active).

### 1.3 "My Rooms" rail (right)
- **Header:** four-small-circles icon + bold black `My Rooms` (y≈262).
- **Body:** a **proportional tile mosaic** (not a list). Each room is a rounded square **whose area is proportional to the room's ft²**, laid out in wrapped rows and **grouped/ordered by family**: bedrooms row → bathrooms row → closets row → living/kitchen row. Tiles are bottom-aligned within their row.
- **Tile content:** room name (bold black, wraps to 2 lines) + `"<S|M|L> <N> ft²"` in gray below.
- **Tile colors** (values below are the dimmed samples ÷0.73 ⇒ true color estimate):
  | Family / room | Approx. true hex | Note |
  |---|---|---|
  | Primary Bedroom | `#FDC9B9` | most saturated rose — "primary" variants are darker |
  | Bedroom | `#FDE1D6` | lighter rose |
  | Primary Bathroom | `#B6D7F2` | saturated blue |
  | Bathroom | `#D3E6F5` | lighter blue |
  | Primary Closet | `#FCC99F` | saturated peach |
  | Bed Closet | `#FDDDC3` | lighter peach |
  | Kitchen, Dining, Breakfast Nook | `#FDE08F` | gold |
  | Living, Den, **Hallway** | `#FEEAB2` | pale gold |
  | Pantry | `#EFDAAF` | tan |
- **Footer (still inside the rail, above a hairline rule):** `Room List Capacity` (bold black) + circled **ⓘ info icon** ………… `39% Filled` / `36% Filled` (gray) + a **solid green status dot**. Below it a full-width **green progress bar** (rounded, track light gray, fill `#5CB878`-ish green) whose fill matches the percentage.
  - **Derived rule:** capacity tracks **room count**, not area. 12 rooms → 39 %, 11 rooms → 36 % — and 36 % is unchanged while total area goes 992 → 866 → 1280 ft². ⇒ `pct = rooms / ~31` (12/31 = 38.7 %, 11/31 = 35.5 %). A tier-based max room count of ≈31.

### 1.4 Summary / Continue bar (bottom-right, below the rail)
Outer cream rounded container (`#F7F4EE`) wrapping a **white rounded card** containing:
1. **Metrics row**, three items separated by thin vertical rules:
   `Total <N> ft²` | `Heated <N> ft²` | `<N> Story`
   (labels regular gray, numbers **bold black**; `ft²` uses a real superscript 2; thousands separator comma).
2. **Primary CTA**: full-width **black pill button** — left: 2×2 grid-of-squares icon; center: bold white label; right: chevron-right `›`.
   - Label is dynamic and **copy changes with room count**: `Continue with 12 rooms` vs `Continue with only 11 rooms`. The word **"only"** appears at 11 (a nudge that the list is under-specified — consistent with the tutorial copy "More complete room lists give better direction").

### 1.5 Tutorial coach-mark (top-right, x≈1578–1892, y≈168–330)
White rounded card with shadow. Content:
- Eyebrow: `TUTORIAL STEP 1` — uppercase, letter-spaced, small, gray.
- Headline: **`Build your dream room list`** — **serif** display face, black, ~22 px.
- Body paragraph 1: `More complete room lists give better direction for our AI to meet your needs.`
- Body paragraph 2: `Click Continue when you're done.`
- Footer: a **thin progress bar** — light-gray track full width, **black fill ≈6 % of the width** ⇒ step 1 of roughly **16** tutorial steps.
- No visible Next/Skip/× button inside the card in these frames (advance is presumably driven by completing the highlighted action).

---

## 2. Frame-by-frame

### Frame 01 — `Screenshot from 2026-09-12 15-07-09.png`
- **URL:** tail visible `…Z0S2DVMTQF8AVC/room-list` (toast covers the head). Same route.
- **Step:** 1 Create Room List. **Tutorial step 1** open.
- **Catalog counts:** Primary Bed **1**, Bedroom **2**, Primary Bath **1**, Bathroom **2**, Primary Closet **2**, Bed Closet **2** (locked), Kitchen **1 · MAX**, Dining **1**, Breakfast Nook 0, Pantry 0, Living 0, Foyer 0. Upgrade block (Den / Family Room / Sunroom) locked.
- **Preview pane:** `Dining`, size **L** selected (black). Render = large dining room, 2 window banks, chandelier, long 8-seat table, sideboard. Footprint chip: **`Dining` / `L - 241 ft²`**, 107 px square, `#FDE08F`.
- **My Rooms (13 tiles):**
  `Primary Bedroom M 225 ft²` · `Bedroom M 152 ft²` · `Bedroom S 104 ft²` · `Primary Bathroom S 52 ft²` · `Bathroom S 33 ft²` · `Bathroom S 33 ft²` · `Primary Closet M 62 ft²` · `Primary Closet S 27 ft²` · `Bed Closet M 23 ft²` · `Bed Closet S 11 ft²` · `Kitchen S 106 ft²` · `Dining S 95 ft²` · `Hallway M 46 ft²`
- **Capacity:** `39% Filled`, green.
- **Summary:** `Total 1,015 ft²` | `Heated 1,015 ft²` | `1 Story`; CTA **`Continue with 12 rooms ›`**.
- **Arithmetic note:** the 13 tiles sum to 969 ft²; Total shows 1,015 — a delta of exactly 46 = the Hallway value. (Same pattern in every frame: `Total = Σ tiles + Hallway`, i.e. an unlisted circulation/walls allowance equal to the hallway figure.)
- **Room count note:** 12 = sum of catalog counts (1+2+1+2+2+2+1+1); **Hallway is auto-generated and NOT counted.**

### Frame 02 — `… 15-07-20.png`
- **URL fully visible:** `www.drafted.ai/app/studio/projects/114312/create/01M2B203CPTDZ0S2DVMTQF8AVC/room-list`.
- **Transition from 01:** user **removed Kitchen (1→0)** and **removed Dining (1→0)**, and **added Breakfast Nook (0→1, now MAX)**.
- **Catalog:** Kitchen `0 / ⊕`, Dining `0 / ⊕`, **Breakfast Nook `1 · MAX`** (gold row tint).
- **Preview pane:** still `Dining` (the pane keeps the last-touched room). **`L` is black/active**, but a **gray focus ring sits on `S`** and the chip reads **`Dining` / `S - 95 ft²`** (66 px square) — i.e. **hovering a size cell live-previews that size's area and render**.
- **My Rooms (12 tiles):** beds/baths/closets unchanged; living row becomes `Nook L 180 ft²` · `Hallway M 45 ft²`. (Note the tile is labeled **`Nook`**, a short form of "Breakfast Nook".)
- **Capacity:** `36% Filled`.
- **Summary:** `Total 992 ft²` | `Heated 992 ft²` | `1 Story`; CTA **`Continue with only 11 rooms ›`**.
- **Key inferences:** (a) removing Kitchen+Dining and adding Nook recomputes the **Hallway automatically 46 → 45 ft²**; (b) the CTA copy gains the word **"only"** when the list drops below 12.

### Frame 03 — `… 15-07-23.png`
- **Transition:** user clicked **`M`** in the size segmented control.
- **Preview pane:** `Dining`, **M black/active** (ring also on M). Render = medium dining room, chandelier, 6-seat table, 2 window banks.
- **Chip:** `Dining` / **`M - 167 ft²`** (88 px).
- **Everything else identical to frame 02** — My Rooms still shows `Nook L 180`, `Hallway M 45`; Total **992 ft²**; `36% Filled`; CTA `Continue with only 11 rooms`.
- **Critical finding:** cycling S/M/L in the preview pane **does not mutate the room list, the totals, or the capacity** for a room that is not currently in the list. It is a **browse/compare affordance**.

### Frame 04 — `… 15-07-27.png`
- **Transition:** user clicked **`L`**.
- **Preview:** `Dining`, **L active**; render = large dining room w/ sideboard; chip `Dining` / **`L - 241 ft²`** (107 px).
- All list/summary values unchanged (992 ft², 36 %, 11 rooms).
- ⇒ Completes an S → M → L comparison loop for **Dining**: **95 / 167 / 241 ft²**.

### Frame 05 — `… 15-07-36.png`
- **Transition:** user **removed Breakfast Nook (1→0)** and **added Pantry (0→1, MAX)**; then focused the Pantry preview at **S**.
- **Catalog:** Breakfast Nook `0 / ⊕`, **Pantry `1 · MAX`**, Kitchen/Dining still 0.
- **Preview:** `Pantry`, **S active** (black, ring). Render = tall narrow corner of shelving, 5 shelves.
- **Chip:** `Pantry` / **`S - 16 ft²`**, fill `#EFDAAF` (tan, distinct from the Dining gold).
- **My Rooms (12 tiles):** living row = `Pantry L 65 ft²` · `Hallway M 39 ft²`.
- **Capacity:** `36% Filled` (unchanged — count still 11).
- **Summary:** `Total 866 ft²` | `Heated 866 ft²` | `1 Story`; CTA `Continue with only 11 rooms ›`.
- **Confirms:** the room was auto-added at **size L**, while the preview control is independently parked on **S** — the preview control does not write back to the list. Also confirms Hallway recomputes downward (45 → 39) as the house shrinks.

### Frame 06 — `… 15-07-41.png`
- **Transition:** clicked **`M`**.
- **Preview:** `Pantry`, **M active**; render = wider walk-in pantry, shelving on two runs.
- **Chip:** `Pantry` / **`M - 41 ft²`**.
- List/summary unchanged: 866 ft², 36 %, 11 rooms, `Pantry L 65 ft²`, `Hallway M 39 ft²`.

### Frame 07 — `… 15-07-45.png`
- **Transition:** clicked **`L`**.
- **Preview:** `Pantry`, **L active**; render = full walk-in pantry with counter + upper cabinets + multiple shelf runs.
- **Chip:** `Pantry` / **`L - 65 ft²`**.
- List/summary unchanged (866 ft², 36 %).
- ⇒ **Pantry size ladder: 16 / 41 / 65 ft².**

### Frame 08 — `… 15-07-53.png`
- **Transition:** user **removed Pantry (1→0)** and **added Living (0→1, MAX)**; preview focused on Living at **S**.
- **Catalog:** Pantry `0 / ⊕`, **Living `1 · MAX`** (gold row tint), upgrade block still directly under Living.
- **Preview:** `Living`, **S active**; render = small living room, tall window bank at left, fireplace + TV niche, 2 sofas.
- **Chip:** `Living` / **`S - 176 ft²`** (91 px), fill `#FEEAB2`.
- **My Rooms (12 tiles):** living row = **`Living L 442 ft²`** (a very large tile, ~2× the width of Primary Bedroom) · `Hallway M 58 ft²`.
- **Capacity:** `36% Filled`.
- **Summary:** `Total 1,280 ft²` | `Heated 1,280 ft²` | `1 Story`; CTA `Continue with only 11 rooms ›`.
- Hallway recomputes upward 39 → **58 ft²**.

### Frame 09 — `… 15-07-56.png`
- **Transition:** clicked **`M`**.
- **Preview:** `Living`, **M active**; render = wider room, 3 window bays, fireplace, sectional + coffee table + side chairs.
- **Chip:** `Living` / **`M - 309 ft²`** (121 px).
- All list/summary values unchanged (1,280 ft², 36 %, 11 rooms).

### Frame 10 — `… 15-08-01.png`
- **Transition:** clicked **`L`**.
- **Preview:** `Living`, **L active**; render = largest living room — full window wall, fireplace, large sectional, armchair, extra seating.
- **Chip:** `Living` / **`L - 442 ft²`** (136 px) — matches the `Living L 442 ft²` tile in My Rooms.
- All list/summary unchanged.
- ⇒ **Living size ladder: 176 / 309 / 442 ft².**

### Frame 11 — `… 15-08-37.png`
- **Transition (36 s gap — the longest in the batch):** the user **scrolled the Room Catalog down** and then **focused the locked `Den` row** (the preview pane will render a locked/upgrade room even though it cannot be added).
- **Catalog is scrolled:** top of the list now shows `Primary Closet 2` / `Bed Closet 2` (Beds & Baths tail), then the full **Living Spaces** section, then **`Outdoor Spaces`** (`Front Porch ⊕`, `Outdoor Living ⊕`, mint rail) and the header **`Specialty Spaces`** with the first row `Office` clipped by the fold.
- **Living is still `1 · MAX`.** Upgrade block visible with `UPGRADE SUBSCRIPTION` pill + `View` button + `Den 🔒`, `Family Room 🔒`, `Sunroom 🔒`.
- **Preview:** **`Den`**, **S active**; render = small study — picture frame on wall, one armchair, round side table, tall bookcase run.
- **Chip:** `Den` / **`S - 102 ft²`** (69 px), fill `#FEEAB2`.
- **My Rooms / summary unchanged:** `Living L 442 ft²`, `Hallway M 58 ft²`, Total **1,280 ft²**, 36 %, `Continue with only 11 rooms`.
- **Key finding:** **locked (paywalled) rooms are still fully previewable** — you can inspect their 3-D render and size/area ladder, you just cannot add them (padlock instead of ⊕).

### Frame 12 — `… 15-08-40.png`
- **Transition:** clicked **`M`** on the Den preview.
- **Preview:** `Den`, **M active**; render = larger study — two armchairs, round table, full wall of bookcases, framed art.
- **Chip:** `Den` / **`M - 202 ft²`** (97 px).
- Everything else identical to frame 11.
- ⇒ **Den size ladder (partial): 102 / 202 / — ft²** (L not sampled in this batch).

---

## 3. Interaction model recovered from this batch

1. **The Room Catalog `⊕` / `⊖` steppers are the only writes to the room list.** Adding a room:
   - inserts a tile into **My Rooms** at an **auto-chosen size** (all four added rooms landed on **L**),
   - increments the room count in the CTA,
   - recomputes the auto **Hallway** room,
   - recomputes `Total` / `Heated` ft² and `Room List Capacity %`.
2. **The S/M/L segmented control in the preview pane is read-only comparison UI** — proven three times over (Dining, Pantry, Living): flipping S→M→L changed the render + chip + chip size but left tiles, totals, capacity, and CTA byte-identical.
3. **Hover vs. selection in the segmented control** are visually distinct: black fill = selected; light-gray outline ring = hover/focus (frame 02 shows ring on `S` while `L` stays black).
4. **The preview pane follows the last-touched catalog row**, and it persists after that row's count returns to 0 (frames 02-04 keep showing Dining after Dining was removed).
5. **Auto-derived rooms**: `Bed Closet` (locked, "Auto-included with Bed…") and `Hallway` (never appears in the catalog at all, only as a My Rooms tile, and is excluded from the room count).
6. **`Primary Closet` is semi-auto** — it has the "Auto-included wit…" sub-label but still exposes ⊖/⊕.
7. **Max-count enforcement** is per room type (`MAX` badge replaces ⊕): Kitchen, Breakfast Nook, Pantry, Living all cap at **1**.
8. **Paywall model**: a subscription tier gates specific room types (`Den`, `Family Room`, `Sunroom` in Living Spaces) via an inline bordered upsell block with an `UPGRADE SUBSCRIPTION` pill and a `View` CTA; locked rooms show a padlock and remain previewable.
9. **Capacity meter** is a room-count gauge (`rooms / ≈31`), green-state at 36–39 %, with an ⓘ explainer affordance.
10. **CTA copy is state-dependent** (`Continue with N rooms` vs `Continue with only N rooms`), nudging toward a fuller list.
11. **`Total` exceeds the sum of the visible tiles by exactly the Hallway figure** in every frame — implying an additional hidden circulation/wall allowance in the total.

### Room size ladders measured (ft²)
| Room | S | M | L |
|---|---|---|---|
| Dining | 95 | 167 | 241 |
| Pantry | 16 | 41 | 65 |
| Living | 176 | 309 | 442 |
| Den (locked) | 102 | 202 | n/a in batch |
| Breakfast Nook | — | — | 180 (as added) |

### Auto-assigned sizes observed in My Rooms
`Primary Bedroom M 225` · `Bedroom M 152` · `Bedroom S 104` · `Primary Bathroom S 52` · `Bathroom S 33` ×2 · `Primary Closet M 62` · `Primary Closet S 27` · `Bed Closet M 23` · `Bed Closet S 11` · `Kitchen S 106` · `Dining S 95` · `Nook L 180` · `Pantry L 65` · `Living L 442` · `Hallway M 39 / 45 / 46 / 58`
⇒ Duplicates of the same room type get **different** auto sizes (two Bedrooms = M + S; two Primary Closets = M + S; two Bed Closets = M + S), i.e. a variety/hierarchy heuristic, not uniform sizing.

---

## 4. Visual design notes

- **Typography:** a high-contrast **serif** for the `Drafted` wordmark, the `My Studio` label and tutorial headlines; a geometric/neo-grotesque **sans** (Inter-like) for everything else. Numbers in the summary bar are bold; unit `ft²` with true superscript. Uppercase letter-spaced micro-labels for badges (`MAX`, `UPGRADE SUBSCRIPTION`, `TUTORIAL STEP 1`).
- **Shape language:** heavy use of **rounded rectangles** — cards r≈16 px, rows r≈10 px, tiles r≈8 px, pills fully rounded, segmented cells r≈8 px. Circled icon-buttons (⊖/⊕/🔒/ⓘ) are 24 px outline circles.
- **Palette:** neutral warm grays for chrome; a **pastel family-coded palette** for rooms (rose = sleeping, blue = bathing, peach = storage, gold = living/cooking, mint = outdoor, pink = specialty). "Primary" variants use the saturated end of their family, standard variants the tinted end.
- **Black is the only strong accent** — active stepper dot, selected S/M/L cell, `View` button, primary `Continue` CTA. Green is reserved for the capacity meter.
- **Illustration style:** consistent isometric line-art with white surfaces, thin black strokes, warm-yellow floor plane, architectural dimension ticks along the floor edges, soft ground shadow.
- **Density:** left catalog column ≈300 px, generous 48 px row pitch; My Rooms rail 340 px; the preview pane gets the largest share of the canvas (≈640 px).
- **Tutorial treatment:** a ~27 % black scrim dims the page, spotlighting the Room Catalog card and the Continue bar; the coach-mark floats top-right with its own step-progress bar.

---

## 5. Features / controls this batch reveals (implementation checklist)

**Navigation & shell**
1. Serif `Drafted` wordmark, links to marketing/app root.
2. `My Studio` nav item with house icon → studio/project list.
3. `‹ Back` secondary nav item.
4. 3-step wizard stepper (`1 Create Room List`, `2 Place Rooms & Shape`, `3 Results`) with active/inactive circle + label styling.
5. Two right-side pill controls + circular user avatar (occluded — presumed `Learn`, credits pill, account menu).
6. Route: `/app/studio/projects/{numericId}/create/{ULID}/room-list`.
7. Floating support/chat launcher (bottom-right).

**Room Catalog**
8. `Room Catalog` panel with cube icon header.
9. `Clear All` outlined button with trash icon (resets the whole room list).
10. Scrollable catalog with custom scroll-affordance chevrons (▲/▼).
11. Category sections with a 3-bar grip icon (`Beds & Baths`, `Living Spaces`, `Outdoor Spaces`, `Specialty Spaces`).
12. Colored vertical rails grouping consecutive rows into sub-families.
13. Per-room row: glyph icon + name + optional gray truncated sub-label.
14. `⊕` add / `⊖` remove circular steppers with integer count between them.
15. Zero-state rows render only `⊕` (no count, no `⊖`).
16. Non-zero rows get a family-tinted row background and bold name.
17. `MAX` gray pill badge replacing `⊕` when a room type hits its per-type cap (cap = 1 for Kitchen, Breakfast Nook, Pantry, Living).
18. Locked auto-derived rows with no `⊖` and a ghosted/disabled `⊕` (Bed Closet).
19. Auto-inclusion sub-labels (`Auto-included wit…`, `Auto-included with Bed…`) with ellipsis truncation (implies a tooltip on hover).
20. Inline paywall block nested under `Living`: gold-bordered card, `UPGRADE SUBSCRIPTION` pill, black `View` button.
21. Locked room rows with circled padlock in place of `⊕` (`Den`, `Family Room`, `Sunroom`).
22. Locked rooms remain selectable for preview (render + size ladder visible) but not addable.

**Room Preview pane**
23. Isometric 3-D line-art render per (room type × size), swapped live.
24. Preview follows the last-interacted catalog row and persists after removal.
25. Scaled yellow **footprint chip** whose side = k·√area (k ≈ 6.83 px/√ft²) showing `name` + `"<SIZE> - <N> ft²"`.
26. Footprint chip fill colored by room family.
27. `S` / `M` / `L` segmented size control (black = selected, gray outline ring = hover/focus).
28. Size control is preview-only — it must NOT mutate the room list, totals, or capacity.
29. Room name + icon label at the left of the size strip.
30. Per-room-type size→area lookup table (Dining 95/167/241, Pantry 16/41/65, Living 176/309/442, Den 102/202/…).

**My Rooms rail**
31. `My Rooms` panel header with 4-dot icon.
32. Area-proportional tile mosaic, wrapped rows, grouped by family, bottom-aligned.
33. Tile shows room name + `"<S|M|L> <N> ft²"`.
34. Family color coding with saturated "primary" variants vs tinted standard variants.
35. Auto-generated `Hallway` tile that recomputes on every list change (39/45/46/58 ft² observed) and is excluded from the room count.
36. Auto size assignment on add (observed default L) and size diversification across duplicates (M + S for pairs).
37. `Room List Capacity` label with circled ⓘ info affordance.
38. `N% Filled` readout + colored status dot (green) + green progress bar; percentage derived from **room count / ≈31**.

**Summary bar**
39. `Total <N> ft²` metric.
40. `Heated <N> ft²` metric (equal to Total in a 1-story, all-conditioned plan).
41. `<N> Story` metric.
42. Thin vertical dividers between the three metrics; comma thousands separators; superscript `ft²`.
43. Primary black pill CTA with grid icon + chevron: `Continue with {n} rooms`, switching to `Continue with only {n} rooms` below the recommended threshold (observed threshold between 11 and 12).

**Onboarding**
44. Coach-mark card with `TUTORIAL STEP {n}` eyebrow, serif headline, 1–2 body paragraphs, and a step-progress bar (step 1 ≈ 6 % ⇒ ~16 total steps).
45. Tutorial step 1 content: **"Build your dream room list" / "More complete room lists give better direction for our AI to meet your needs." / "Click Continue when you're done."**
46. Page-wide ~27 % black scrim spotlighting the Room Catalog card and the Continue bar during the tutorial.

---

## 6. Open questions this batch cannot answer

- Exact labels of the two top-right pill buttons and the credits count (occluded by the tutorial card in all 12 frames).
- Full contents of `Specialty Spaces` and any categories below it (only `Office` partially visible).
- Whether the `S/M/L` control becomes a *write* control elsewhere (e.g. via a tile click in My Rooms), and how a room's size is actually changed after it has been added.
- The `Den` **L** area, and the size ladders for rooms never previewed here (Kitchen, Bedroom, Bathroom, Foyer, Front Porch, Outdoor Living, Office).
- What the ⓘ next to `Room List Capacity` explains, and the exact max-room number (inferred ≈31).
- The precise reason `Total` exceeds the tile sum by the Hallway figure (hidden second circulation entry vs. wall-thickness allowance).
- What screen the `View` button in the upgrade block opens (pricing/plan modal presumably — no plan names or prices are visible in this batch).
- Behaviour of the category `≡` grip icons (drag-to-reorder vs collapse).
