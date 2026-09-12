# Drafted (drafted.ai) — Screen Forensics, Batch 02

**Source:** 12 sequential screenshots of one user session, `/home/dell/Pictures/Screenshots/Screenshot from 2026-09-12 15-00-51.png` … `15-03-29.png` (1920×1200, Firefox on Linux/GNOME).

**Scope of this batch:** the entire batch sits on **Wizard Step 1 — "Create Room List"**, route `…/room-list`, with **Tutorial Step 1** overlay active the whole time. Steps 2 and 3 are never entered. What this batch recovers in depth is the *Room Catalog → 3D room preview → My Rooms → capacity/summary → Continue* loop, the S/M/L size model, and the auto-included-room model.

---

## 0. Global chrome (identical in all 12 shots)

### Browser context
- Address bar (verbatim, all 12): `www.drafted.ai/app/studio/projects/114312/create/01M2B203CPTDZ0S2DVMTQF8AVC/room-list`
  - Firefox highlights `www.drafted.ai` in white and the path `/app/studio/projects/114312/create/01M2B203CPTDZ0S2DVMTQF8AVC/room-list` in grey.
  - Route shape: `/app/studio/projects/{numericProjectId}/create/{ULID}/{stepSlug}`. Project id `114312` is a plain integer; the second id `01M2B203CPTDZ0S2DVMTQF8AVC` is a 26-char ULID (a "design run" / generation id). Step slug here is `room-list`.
  - In shots 1, 6, 7, 8, 9, 10, 11, 12 a GNOME "Screenshot captured / You can paste the image from the clipboard." toast covers the left half of the URL bar; only `…Z0S2DVMTQF8AVC/room-list` is legible there. Shots 2, 3, 4, 5 show the full URL.
- Browser tabs: `New tab`, `Local Model Chat`, `Local Model Chat`, **`Drafted - Design your d…`** (active; favicon is a square "D" mark), `Free 3D House Design …`.

### App top navigation (left → right)
1. **"Drafted" wordmark** — high-contrast didone / fat-face serif (Playfair-Display-Black / Bodoni family). Distinctive detail: the `D` has a long swash that overlaps the following letters and the terminal `d` descender crosses under the word. Pure black on the warm-grey app bar.
2. **🏠 My Studio** — small outline house icon + label, set in the *same bold serif* as the wordmark. This is the "back to project list" link.
3. Thin vertical divider rule.
4. **‹ Back** — chevron-left icon + "Back", set in the UI sans (Inter-like), medium weight.
5. **Wizard stepper** (horizontally centred):
   - `①` filled-black circle, white numeral **1** + **"Create Room List"** in bold black → ACTIVE in all 12 shots.
   - long em-dash connector `—` in light grey
   - `②` grey circle, **2** + "Place Rooms & Shape" in grey → inactive
   - long em-dash connector
   - `③` grey circle, **3** + "Results" in grey → inactive
6. **Top-right cluster** — *never fully readable in this batch*: the Tutorial Step 1 card (which is anchored top-right, x≈1575→1895, y≈170→330) covers it. Only the top ~20 px of the controls peek above the card:
   - a **small rounded-pill button** ≈78 px wide (x≈1657–1735) — position/size consistent with a **"Learn"** button
   - a **wider rounded-pill button** ≈118 px wide (x≈1745–1863) — position/size consistent with the **credits pill ("N left")**
   - a **dark filled circle** ≈26 px (x≈1875–1900) — the **user avatar**
   (Labels are unrecoverable from this batch — see Open Questions.)

### Tutorial overlay (identical in all 12 shots)
A white rounded card, ~320×160 px, top-right, with a soft drop shadow. Everything on the page *except the Room Catalog card* is covered by a translucent dark scrim (measured: app background renders at ≈`rgb(169,167,163)`, the right "My Rooms" panel at ≈`rgb(186,186,185)`, i.e. roughly a 25–27 % black scrim). The Room Catalog card is the **spotlight cut-out** and renders at full brightness with a pale halo around its rounded rectangle.

Card contents:
- Eyebrow: `TUTORIAL STEP 1` — uppercase, letter-spaced, small, grey sans.
- Title: **"Build your dream room list"** — bold serif (same face as the wordmark), ~20 px.
- Body paragraph 1: "More complete room lists give better direction for our AI to meet your needs."
- Body paragraph 2: "Click Continue when you're done."
- Bottom: a **progress bar** — black filled segment occupying ≈6 % of a light-grey full-width track (i.e. step 1 of roughly 16 tour steps, or simply "very early in the tour").
- No visible Next/Skip buttons — the tour advances by doing the action.

### Page layout (three zones under the nav)
| Zone | x-range | Contents |
|---|---|---|
| Main card ("Room Catalog") | ≈487 → 1440 | White rounded card, ~940 px wide, y ≈ 220 → 1170 |
| Right rail ("My Rooms") | ≈1455 → 1782 | Panel, y ≈ 240 → 1045 |
| Right rail footer | ≈1450 → 1790 | Floating white summary + Continue card, y ≈ 1053 → 1170 |

- Bottom-right corner: a circular **Intercom-style chat launcher** (dark rounded square with speech-bubble glyph) at ≈(1867, 1147).

### The "Room Catalog" card in detail
Header row: a small **3D wireframe cube/box outline icon** + **"Room Catalog"** (bold sans). Far right of the header: **"Clear All"** — outlined rounded-pill button with a trash-can icon. A 1 px hairline rule separates header from body.

Body is two columns:

**Left column (x ≈ 515 → 795): the scrollable room catalog list.**
- Custom scrollbar at x ≈ 793: a rounded grey thumb plus **small triangular ▲ / ▼ arrow buttons** at the very top and bottom of the track.
- Sections, each with a **`≡` grip/drag icon** then a grey uppercase-ish section label.
- Each room row: a **vertical rounded accent bar** on the far left (shared/continuous across a contiguous *family* of rows, not per row), then a **room-type line icon**, then the room name, then the count control on the right.
- Count control has two states:
  - **count = 0** → a single circular **`⊕` add button** on the right; row background white; label in regular weight.
  - **count ≥ 1** → `⊖` circular decrement, the numeric count, `⊕` circular increment; row background gets a very light tint of the family accent colour; label goes **bold**.
- Rows can carry a **subtitle** in small grey text (used for auto-included rooms).
- Selected / hovered row gets a **1.5 px dark rounded outline ring** around the whole row; the `⊕`/`⊖` under the cursor additionally gets a light circular halo.

**Right column (x ≈ 800 → 1435): the 3D room preview.**
- A large monochrome **isometric line-art cut-away render** of the currently selected room type at the currently previewed size, drawn as thin black outlines on white with light-grey shading and a pale wash on the floor (blue wash for bathrooms, salmon/peach wash for bedrooms, none for storage). Renders are furniture-accurate (beds, nightstands, sofas, vanities, tubs, glass showers, toilets, washer/dryer, boxes).
- Below the render, a **floating room chip preview** (a rounded square, coloured by room family, sized *proportionally to the room's area*), containing the bold room name and, under it, `"{S|M|L} - {n} ft²"`.
  - When the selected room auto-includes another room, **two chips** are shown side by side (e.g. Primary Bedroom + Primary Closet), each proportionally sized.
- Footer row of the card: **room-type icon + room name** (bold) on the left, and on the right a **three-segment S / M / L size selector**.

**S / M / L size selector semantics (recovered exactly):**
- The **selected** size is a **black filled rounded square with white letter**.
- A **hovered** size gets a **white pill with a thin grey outline** (no fill change to the selected one).
- **The canvas render, the floating chip, and the chip's `"X - n ft²"` label all follow the HOVERED size**, falling back to the selected size when nothing is hovered. This is a live hover preview.
- Immediately after a click the selected button also shows a **light focus ring** (visible in shot 3).
- The selection is **global / sticky across room types**: it was `M` in shots 1–2, the user clicked `S` in shot 3, and every subsequent room type (Bathroom, Primary Bathroom) opened with `S` still selected.

### The "My Rooms" right rail
- Header: a small **"group of people/rooms" icon** + **"My Rooms"** in bold. (Anything to the right of the title is hidden under the tutorial card.)
- Hairline rule under the header.
- Body: a **wrapping flow of room chips**, in catalog order, each chip a **rounded square whose side length is proportional to that room instance's area**, filled with the room family's colour, containing bold room name (wrapping to 2 lines) and, beneath, `"{S|M|L} {n} ft²"` (note: **no dash here**, unlike the preview chip which uses `"{S} - {n} ft²"`).
- Colour convention: the **"Primary …" variant of a family is rendered in a deeper, more saturated shade** than the non-primary variant (Primary Bedroom deeper salmon than Bedroom; Primary Bathroom deeper blue than Bathroom; Primary Closet deeper tan than Bed Closet).
- Footer of the rail, above a hairline rule:
  - **"Room List Capacity"** (bold) + a circular **ⓘ info button** (tooltip trigger)
  - right-aligned: **"NN% Filled"**, an optional **"+3%"** delta in bold, and a **solid green status dot**
  - beneath: a **progress bar** — rounded green fill on a light-grey track. When a `+3%` preview is active, a **darker green segment is appended** at the end of the fill to show the prospective increase.

### Floating summary + Continue card (bottom right)
- White rounded card with subtle border/shadow.
- Line 1, three stats separated by thin vertical rules: **`Total NNN ft²` | `Heated NNN ft²` | `N Story`** (labels in regular grey, values in bold black).
- Line 2: full-width **black pill CTA** — a small 2×2 grid/squares icon on the left, the label **"Continue with only N rooms"** in bold white, and a **`›` chevron** on the right.
  - The phrasing "with **only** N rooms" is a nudge — it appears at every count observed (4, 5, 8, 9), so it is likely shown below some completeness threshold.

---

## 1. `Screenshot from 2026-09-12 15-00-51.png`

**URL:** obscured by the GNOME screenshot toast; visible tail `…Z0S2DVMTQF8AVC/room-list`.
**Stepper:** 1 Create Room List (active). **Tutorial:** Step 1, "Build your dream room list".

**Catalog scroll position:** bottom of the list. Visible sections & rows (all count 0 here):

- *(Living Spaces, tail end)*
  - **Living** — sofa icon — `⊕` — amber accent
  - **UPGRADE SUBSCRIPTION** inset block (cream `#FBF8EE` background, gold `#E9C360` border, gold pill badge reading `UPGRADE SUBSCRIPTION` in dark letter-spaced caps, and a **black "View" pill button** top-right). Locked rows inside, each with a **circular padlock badge** instead of `⊕`:
    - **Den** (door/armchair icon) 🔒
    - **Family Room** (sofa + side tables icon) 🔒
    - **Sunroom** (potted fern icon) 🔒
  - **Foyer** — double-door icon — `⊕` — amber accent
- **Outdoor Spaces** (≡ grip + label) — mint-green accent `#DAF7DA`
  - **Front Porch** — porch/railing icon — `⊕`
  - **Outdoor Living** — outdoor sofa / grill icon — `⊕`
- **Specialty Spaces** (≡ grip) — pink accent `#FEDBEA`
  - **Office** — desk + chair icon — `⊕`
- **Garage & Utility** (≡ grip)
  - **Garage** — car icon — `⊕` — lilac accent `#F1E7EC`
  - **Laundry** — washer icon — `⊕` — teal accent `#DCFAF2`
  - **Mudroom** — bench/locker icon — `⊕` — grey accent `#E9E9E9`
  - **Utility Closet** — ironing-board icon — `⊕` — grey accent
  - **Storage** — boxes/bottles icon — `⊕` — grey accent — **row has the dark selection ring** (this is the currently previewed room)

**Preview canvas:** isometric cut-away of a **Storage** room: open shelving on the left wall, stacked cardboard boxes on the floor, and a decorated Christmas tree in the centre (Drafted's storage-room art asset).
**Floating chip:** grey rounded square — **"Storage / M - 99 ft²"**.
**Card footer:** storage icon + **"Storage"** · size selector `S [M] L` — **M selected (black), nothing hovered**.

**My Rooms (5 chips):**
| Chip | Size/Area | Colour family |
|---|---|---|
| Primary Bedroom | M 225 ft² | deep salmon |
| Bedroom | M 152 ft² | muted salmon |
| Primary Closet | M 62 ft² | deep tan/orange |
| Bed Closet | M 23 ft² | muted tan |
| Hallway | M 23 ft² | khaki / olive-yellow |

**Capacity:** `Room List Capacity ⓘ` — **13% Filled  +3%** ● green; bar green with an appended darker-green +3 % preview segment.
**Summary:** `Total 508 ft² | Heated 508 ft² | 1 Story`
**CTA:** **"Continue with only 4 rooms"** (Hallway is not counted as a room.)

---

## 2. `Screenshot from 2026-09-12 15-01-18.png`

**URL (fully legible):** `www.drafted.ai/app/studio/projects/114312/create/01M2B203CPTDZ0S2DVMTQF8AVC/room-list`
**Stepper:** 1 active. **Tutorial:** Step 1.

**Transition from shot 1:** the user **scrolled the catalog back to the top** and **clicked `⊕` on the "Bathroom" row** (count 0 → 1). Room count 4 → 5, total 508 → 575 ft², capacity 13 % → 16 %, Hallway auto-grew 23 → 26 ft².

**Catalog (scrolled to top) — complete listing:**

**Beds & Baths** (≡ grip)
| Row | Icon | Count control | State |
|---|---|---|---|
| **Primary Bed** | bed w/ headboard | `⊖` **1** `⊕` — the `⊖` is **greyed/disabled** (minimum 1) | bold, pale-salmon row tint |
| **Bedroom** | side-view bed | `⊖` **1** `⊕` (both enabled) | bold, pale-salmon row tint |
| Primary Bath | bathtub | `⊕` only | count 0, white row |
| **Bathroom** | shower/tile | `⊖` **1** `⊕` | bold, pale-blue row tint, **dark selection ring**, `⊕` has hover halo |
| **Primary Closet**<br><small>"Auto-included wit…"</small> | closet w/ shelves | `⊖`(greyed) **1** `⊕` | bold, pale-peach row tint |
| **Bed Closet**<br><small>"Auto-included with Bed…"</small> | clothes hanger | **1** `⊕`(greyed) — **no `⊖` at all** | bold, pale-peach row tint; fully auto-controlled |

Accent bars group the family: one continuous salmon bar spans Primary Bed + Bedroom; one blue bar spans Primary Bath + Bathroom; one peach bar spans Primary Closet + Bed Closet.

**Living Spaces** (≡ grip) — amber accent bars
- **Kitchen** (range/counter icon) `⊕`
- **Dining** (table + chairs icon) `⊕`
- **Breakfast Nook** (small table grid icon) `⊕`
- **Pantry** (shelf/cabinet icon) `⊕`  *(own accent bar segment)*
- **Living** (sofa icon) `⊕`  *(own accent bar segment)*
- **UPGRADE SUBSCRIPTION** block → **Den** 🔒, **Family Room** 🔒, **Sunroom** 🔒, with **View** button
- **Foyer** (double doors) `⊕`

**Preview canvas:** isometric **Bathroom (M)** — double vanity with two mirrors on the left wall, a glass-partition shower, a bathtub, a toilet, blue floor wash.
**Floating chip:** blue — **"Bathroom / M - 61 ft²"**.
**Card footer:** bathroom icon + **"Bathroom"** · `S [M] L` — **M selected, nothing hovered**.

**My Rooms (6 chips):** Primary Bedroom **M 225 ft²**, Bedroom **M 152 ft²**, Bathroom **M 61 ft²**, Primary Closet **M 62 ft²**, Bed Closet **M 23 ft²**, Hallway **M 26 ft²**.
**Capacity:** **16% Filled  +3%** ● green (bar + darker preview segment).
**Summary:** `Total 575 ft² | Heated 575 ft² | 1 Story` · CTA **"Continue with only 5 rooms"**.

---

## 3. `Screenshot from 2026-09-12 15-02-02.png`

**URL:** full, unchanged. **Stepper:** 1. **Tutorial:** Step 1.

**Transition from shot 2:** the user **clicked the "Primary Bed" row** (making it the previewed room) and then **clicked `S` in the size selector**. Note the size button carries a **focus ring**, i.e. it was just activated by click.

**Catalog:** identical counts to shot 2 (Primary Bed 1, Bedroom 1, Primary Bath 0, Bathroom 1, Primary Closet 1, Bed Closet 1). The Bathroom row keeps its blue tint but **loses the selection ring** (selection moved to Primary Bed).

**Preview canvas:** isometric **Primary Bedroom (S)** — a bed with two nightstands and lamps against the right wall, a mullioned window on the left wall, a dresser, a salmon floor rug/wash.
**Floating chips — TWO, because Primary Closet is auto-included:**
- **"Primary Bedroom / S - 146 ft²"** (larger salmon chip)
- **"Primary Closet / S - 27 ft²"** (smaller peach chip)

**Card footer:** bed icon + **"Primary Bedroom"** · `[S] M L` — **S selected + focus ring**.

**My Rooms:** unchanged (Primary Bedroom M 225, Bedroom M 152, Bathroom M 61, Primary Closet M 62, Bed Closet M 23, Hallway M 26). **Existing room instances were NOT resized by changing the S/M/L selector.**
**Capacity:** **16% Filled** (no `+3%` — nothing addable is hovered) ● green.
**Summary:** `Total 575 ft² | Heated 575 ft² | 1 Story` · CTA **"Continue with only 5 rooms"**.

---

## 4. `Screenshot from 2026-09-12 15-02-07.png`

**URL:** full, unchanged. **Stepper:** 1. **Tutorial:** Step 1.

**Transition from shot 3:** the user **hovered the `L` size button** (did not click). `S` is still black/selected; `L` shows the white outlined hover pill.

**Preview canvas:** isometric **Primary Bedroom (L)** — a much larger room: bed with nightstands on the right, plus a seating area with sofa and round coffee table, an armchair, a desk/console with a potted palm on the left, two large windows, a bench at the foot of the bed, salmon floor wash.
**Floating chips:**
- **"Primary Bedroom / L - 304 ft²"**
- **"Primary Closet / L - 96 ft²"**

**Card footer:** bed icon + **"Primary Bedroom"** · `[S] M ⟨L⟩` — **S selected (black), L hovered (outlined)**.

**My Rooms / capacity / summary:** all unchanged from shot 3 — 16 % Filled, Total 575 ft², Heated 575 ft², 1 Story, **"Continue with only 5 rooms"**. This confirms hover is pure preview and commits nothing.

**Size ladder recovered so far:** Primary Bedroom **S 146 / L 304 ft²**; Primary Closet **S 27 / L 96 ft²**.

---

## 5. `Screenshot from 2026-09-12 15-02-36.png`

**URL:** full, unchanged. **Stepper:** 1. **Tutorial:** Step 1.

**Transition from shot 4 (~29 s of interaction, multiple clicks):**
- **Bedroom** count 1 → **2** (new instance added at the current size **S**).
- **Bed Closet** count auto-followed 1 → **2** (new Bed Closet added at **S**).
- **Primary Bath** count 0 → **1** (added at **S**, appears in My Rooms as **"Primary Bathroom"**).
- Selection moved back to **Bathroom**.
- Room count 5 → 8, total 575 → 759 ft², capacity 16 % → 25 %, Hallway auto-grew 26 → **35 ft²**.

**Catalog (Beds & Baths) counts now:**
- Primary Bed `⊖(disabled)` **1** `⊕`
- Bedroom `⊖` **2** `⊕`
- **Primary Bath** `⊖` **1** `⊕` — now tinted blue and bold (was count 0)
- Bathroom `⊖` **1** `⊕`
- Primary Closet `⊖(disabled)` **1** `⊕` — "Auto-included wit…"
- Bed Closet **2** `⊕(disabled)` — "Auto-included with Bed…"

**Preview canvas:** isometric **Bathroom (S)** — compact: single vanity + mirror, toilet, a tub against the back wall, blue floor wash.
**Floating chip:** **"Bathroom / S - 33 ft²"**.
**Card footer:** bathroom icon + **"Bathroom"** · `[S] M L` — **S selected, nothing hovered**.

**My Rooms (9 chips) — note per-instance sizes now diverge:**
| Chip | Size/Area |
|---|---|
| Primary Bedroom | M 225 ft² |
| Bedroom | M 152 ft² |
| Bedroom | **S 104 ft²** |
| Primary Bathroom | **S 52 ft²** |
| Bathroom | M 61 ft² |
| Primary Closet | M 62 ft² |
| Bed Closet | M 23 ft² |
| Bed Closet | **S 11 ft²** |
| Hallway | M 35 ft² |

The auto-included **Bed Closet mirrors the size of the Bedroom it belongs to** (M 152 → M 23; S 104 → S 11).

**Capacity:** **25% Filled** ● green (no `+3%`).
**Summary:** `Total 759 ft² | Heated 759 ft² | 1 Story` · CTA **"Continue with only 8 rooms"**.

---

## 6. `Screenshot from 2026-09-12 15-02-39.png`

**URL:** obscured by screenshot toast (`…/room-list` visible). **Stepper:** 1. **Tutorial:** Step 1.

**Transition from shot 5:** the user **hovered the `M` size button** on the Bathroom preview.

**Preview canvas:** isometric **Bathroom (M)** — identical asset to shot 2: double vanity, glass-partition shower, tub, toilet.
**Floating chip:** **"Bathroom / M - 61 ft²"**.
**Card footer:** `[S] ⟨M⟩ L` — **S selected (black), M hovered (outlined)**.

**Catalog, My Rooms, capacity, summary:** all identical to shot 5 (25 % Filled, 759 ft², 8 rooms).

---

## 7. `Screenshot from 2026-09-12 15-02-43.png`

**URL:** obscured by toast. **Stepper:** 1. **Tutorial:** Step 1.

**Transition from shot 6:** hover moved from `M` to **`L`**.

**Preview canvas:** isometric **Bathroom (L)** — a large walk-in glass shower enclosure on the left, a long double vanity with two mirrors on the right wall, toilet in the corner, blue floor wash.
**Floating chip:** **"Bathroom / L - 92 ft²"**.
**Card footer:** `[S] M ⟨L⟩` — S selected, L hovered.

**Everything else unchanged:** 25 % Filled, `Total 759 ft² | Heated 759 ft² | 1 Story`, **"Continue with only 8 rooms"**.

**Bathroom size ladder recovered:** **S 33 / M 61 / L 92 ft²**.

---

## 8. `Screenshot from 2026-09-12 15-03-01.png`

**URL:** full, unchanged. **Stepper:** 1. **Tutorial:** Step 1.

**Transition from shot 7:** the user **clicked the "Primary Bath" row** — that row now carries the **dark selection ring**, and its `⊖` shows a hover halo (cursor is sitting on the decrement). Selection moved away from Bathroom.

**Preview canvas:** isometric **Primary Bathroom (S)** — vanity with mirror and cabinets on the left, toilet, glass shower on the right, blue floor wash.
**Floating chip:** **"Primary Bathroom / S - 52 ft²"**.
**Card footer:** bathtub icon + **"Primary Bathroom"** · `[S] M L` — S selected, nothing hovered.

**Catalog counts, My Rooms, capacity, summary:** unchanged — 25 % Filled, `759 ft²`, **"Continue with only 8 rooms"**.

---

## 9. `Screenshot from 2026-09-12 15-03-03.png`

**URL:** obscured by toast. **Stepper:** 1. **Tutorial:** Step 1.

**Transition from shot 8:** the user **hovered `M`** on the Primary Bathroom preview.

**Preview canvas:** isometric **Primary Bathroom (M)** — separate WC compartment on the left behind a partition wall, a longer vanity run on the right with a window, blue floor wash.
**Floating chip:** **"Primary Bathroom / M - 88 ft²"**.
**Card footer:** `[S] ⟨M⟩ L`.

**Everything else unchanged:** 25 % Filled, 759 ft², 8 rooms.

---

## 10. `Screenshot from 2026-09-12 15-03-07.png`

**URL:** obscured by toast. **Stepper:** 1. **Tutorial:** Step 1.

**Transition from shot 9:** hover moved to **`L`**.

**Preview canvas:** isometric **Primary Bathroom (L)** — double vanity with two mirrors on the left, a **freestanding soaking tub** centre-front, a large glass shower enclosure on the right, blue floor wash.
**Floating chip:** **"Primary Bathroom / L - 137 ft²"**.
**Card footer:** `[S] M ⟨L⟩`.

**Everything else unchanged:** 25 % Filled, `Total 759 ft² | Heated 759 ft² | 1 Story`, **"Continue with only 8 rooms"**.

**Primary Bathroom size ladder recovered:** **S 52 / M 88 / L 137 ft²**.

---

## 11. `Screenshot from 2026-09-12 15-03-26.png`

**URL:** full, unchanged. **Stepper:** 1. **Tutorial:** Step 1.

**Transition from shot 10 (~19 s):** the **Bathroom** count went **1 → 2**, and *both* Bathroom instances are now **S 33 ft²** (the previously existing **M 61 ft²** instance is gone). Net room count 8 → 9. Most likely interaction: the user decremented Bathroom to 0 and then incremented twice while `S` was the selected size (a plain `+1` would have left the M instance intact, as happened with Bedroom in shot 5) — see Open Questions.

**Catalog (Beds & Baths):** Primary Bed 1 · Bedroom 2 · Primary Bath 1 · **Bathroom `⊖` 2 `⊕`** (row has the selection ring and the `⊕` has a hover halo) · Primary Closet 1 · Bed Closet 2.

**Preview canvas:** isometric **Bathroom (L)** (same asset as shot 7).
**Floating chip:** **"Bathroom / L - 92 ft²"**.
**Card footer:** bathroom icon + **"Bathroom"** · `[S] M ⟨L⟩` — S selected, L hovered.

**My Rooms (10 chips):**
| Chip | Size/Area |
|---|---|
| Primary Bedroom | M 225 ft² |
| Bedroom | M 152 ft² |
| Bedroom | S 104 ft² |
| Primary Bathroom | S 52 ft² |
| Bathroom | **S 33 ft²** |
| Bathroom | **S 33 ft²** |
| Primary Closet | M 62 ft² |
| Bed Closet | M 23 ft² |
| Bed Closet | S 11 ft² |
| Hallway | M 35 ft² |

**Capacity:** **28% Filled** ● green.
**Summary:** `Total 765 ft² | Heated 765 ft² | 1 Story` · CTA **"Continue with only 9 rooms"**.

---

## 12. `Screenshot from 2026-09-12 15-03-29.png`

**URL:** obscured by toast. **Stepper:** 1. **Tutorial:** Step 1.

**Transition from shot 11:** hover moved from `L` to **`M`** on the Bathroom preview.

**Preview canvas:** isometric **Bathroom (M)** (same asset as shots 2 & 6).
**Floating chip:** **"Bathroom / M - 61 ft²"**.
**Card footer:** `[S] ⟨M⟩ L`.

**Catalog, My Rooms, capacity, summary:** identical to shot 11 — Bathroom count 2, both instances **S 33 ft²**, **28% Filled**, `Total 765 ft² | Heated 765 ft² | 1 Story`, **"Continue with only 9 rooms"**. Final confirmation that hovering a size never mutates the room list.

---

# Synthesis

## A. Route / information architecture
- `/app/studio` — "My Studio" (project list) — linked from the nav, not visited here.
- `/app/studio/projects/{projectId}` — a project (`114312`).
- `/app/studio/projects/{projectId}/create/{ULID}` — a *creation run*; a 26-char ULID.
- `/app/studio/projects/{projectId}/create/{ULID}/room-list` — **wizard step 1**.
- Implied siblings for steps 2 and 3 (not observed in this batch): the stepper labels are **"Place Rooms & Shape"** and **"Results"**.

## B. Complete room catalog recovered from this batch
> 23 room types visible across the two scroll positions (plus 3 locked upsell types). Section order top→bottom is fixed.

**Beds & Baths** — 6 types
1. Primary Bed *(min 1; `⊖` disabled at 1)* — salmon accent `#FEDFD6`
2. Bedroom — salmon accent
3. Primary Bath — blue accent `#D1E5F7`
4. Bathroom — blue accent
5. Primary Closet — *auto-included with Primary Bed*, subtitle "Auto-included wit…" — peach accent `#FDDBC1`
6. Bed Closet — *auto-included with Bedroom*, subtitle "Auto-included with Bed…", **no decrement control, increment disabled** — peach accent

**Living Spaces** — 6 unlocked + 3 locked — amber accent `#FDE08F`
7. Kitchen
8. Dining
9. Breakfast Nook
10. Pantry
11. Living
   - 🔒 **Den** (UPGRADE SUBSCRIPTION)
   - 🔒 **Family Room** (UPGRADE SUBSCRIPTION)
   - 🔒 **Sunroom** (UPGRADE SUBSCRIPTION)
12. Foyer

**Outdoor Spaces** — mint accent `#DAF7DA`
13. Front Porch
14. Outdoor Living

**Specialty Spaces** — pink accent `#FEDBEA`
15. Office

**Garage & Utility**
16. Garage — lilac accent `#F1E7EC`
17. Laundry — teal accent `#DCFAF2`
18. Mudroom — grey accent `#E9E9E9`
19. Utility Closet — grey accent
20. Storage — grey accent

**Not in the catalog but auto-generated into My Rooms:**
21. **Hallway** — khaki/olive chip; grows automatically with the house (23 → 26 → 35 ft² observed); **excluded from the "N rooms" count** but included in Total/Heated area.

## C. Size model (S / M / L), measured
| Room type | S | M | L |
|---|---|---|---|
| Primary Bedroom | 146 ft² | **225 ft²** *(from an existing instance)* | 304 ft² |
| Primary Closet | 27 ft² | **62 ft²** *(existing instance)* | 96 ft² |
| Bedroom | **104 ft²** | **152 ft²** | — |
| Bed Closet | **11 ft²** | **23 ft²** | — |
| Bathroom | 33 ft² | 61 ft² | 92 ft² |
| Primary Bathroom | 52 ft² | 88 ft² | 137 ft² |
| Storage | — | 99 ft² | — |
| Hallway (auto) | — | 23 / 26 / 35 ft² (derived) | — |

Rules recovered:
- The S/M/L control is **one global sticky preference**, not per-room-type.
- **Hover previews** the size (canvas render + chip + area label all change); **click commits** it as the new default for rooms added afterwards.
- Committing a new size **does not retro-resize existing instances** (Primary Bedroom stayed M 225 after S was clicked; Bedroom M 152 survived the addition of a Bedroom S 104).
- Auto-included children inherit the size of their parent instance (Bedroom S 104 → Bed Closet S 11).

## D. Derived arithmetic (verified against all 12 shots)
- **Room count** = number of My Rooms chips **minus the Hallway chip**. (5 chips→"4 rooms"; 6→5; 9→8; 10→9.)
- **Room List Capacity %** ≈ `roomCount / 32`, rounded: 4→13 %, 5→16 %, 8→25 %, 9→28 %. Each additional room is the **"+3%"** shown on hover.
- **Total ft²** ≈ `Σ(all chip areas) + hallwayArea` — i.e. the hallway/circulation allowance is effectively counted twice (485 + 23 = 508; 549 + 26 = 575; 725 + 35 ≈ 759; 730 + 35 = 765). Equivalently there is a circulation/wall uplift numerically equal to the hallway chip.
- **Heated ft² == Total ft²** in every shot (no unheated rooms — garage/porch — were added).
- **Story count** stayed **1 Story** throughout.

## E. Visual design system
- **Typography:** two families. (1) A high-contrast **didone/fat-face serif** for the "Drafted" wordmark, "My Studio", and tutorial-card headings. (2) A geometric/neo-grotesque **UI sans** (Inter-like) for everything else; bold for values and room names, regular grey for labels and secondary text.
- **Surfaces:** warm light-grey page background; pure-white rounded cards (≈16 px radius) with hairline borders and soft shadows; the right rail is a slightly toned panel.
- **Primary action colour is black** (Continue CTA pill, selected stepper circle, selected size chip, the upsell "View" button). No brand accent colour is used for actions.
- **Room colour families** (thin accent bars use the pale tint; My Rooms/preview chips use a 2-step-stronger tint of the same hue, with "Primary X" a further step deeper than the plain variant):
  | Family | Accent bar | Chip |
  |---|---|---|
  | Beds/Bedrooms | `#FEDFD6` | salmon (Primary deeper) |
  | Baths | `#D1E5F7` | steel blue (Primary deeper) |
  | Closets | `#FDDBC1` | tan/orange (Primary deeper) |
  | Living Spaces | `#FDE08F` | amber |
  | Outdoor Spaces | `#DAF7DA` | mint |
  | Specialty Spaces | `#FEDBEA` | pink |
  | Garage | `#F1E7EC` | lilac |
  | Laundry | `#DCFAF2` | teal |
  | Mudroom / Utility Closet / Storage | `#E9E9E9` | grey |
  | Hallway (auto) | — | khaki/olive |
- **Upsell treatment:** cream card `#FBF8EE` + gold border `#E9C360`, a gold `UPGRADE SUBSCRIPTION` badge pill, a black **View** pill, and circular **padlock** badges in place of `⊕` on each locked row.
- **Room-list chips are area-proportional squares** — the single most distinctive visual in the product; it lets the user "feel" relative room sizes at a glance.
- **Illustration style:** monochrome isometric cut-away line drawings, thin black strokes on white, light grey shading, one pale tinted floor wash per room family, richly furnished.
- **Tutorial spotlight:** dark scrim (~26 % black) over the entire app with a cut-out around the target card, plus an anchored white callout with an eyebrow, serif title, body copy and a thin linear progress bar.

## F. Interaction model recovered
1. **Hover a catalog row's `⊕`** → the capacity readout shows a `+3%` delta and the progress bar appends a darker-green preview segment.
2. **Click a catalog row** → it becomes the *selected/previewed* room (dark ring), the 3D canvas renders it, the card footer shows its icon/name, and the floating chip(s) show its area.
3. **Click `⊕` / `⊖`** → increments/decrements the count; commits the room at the currently selected S/M/L; recomputes My Rooms, capacity, Total/Heated, Hallway, and the CTA label.
4. **Hover `S`/`M`/`L`** → live preview (render + chip + area) without committing.
5. **Click `S`/`M`/`L`** → commits the size preference (sticky globally for subsequent additions).
6. **Auto-inclusion:** adding a Primary Bed auto-adds a Primary Closet; adding a Bedroom auto-adds a Bed Closet; the child's count and size follow the parent and its own controls are disabled.
7. **Auto-circulation:** a Hallway room is synthesised and resized as the plan grows; it is area-bearing but not room-counted.
8. **Clear All** wipes the room list.
9. **Continue with only N rooms** advances to step 2 ("Place Rooms & Shape").

---

# Open questions / not recoverable from this batch
1. **Top-right nav labels** — the Learn button, credits pill ("N left") and avatar are covered by the tutorial card in all 12 frames. Only geometry is recoverable (78 px pill, 118 px pill, 26 px circle).
2. **Anything to the right of the "My Rooms" title** (a count badge? a sort/clear control?) is also under the tutorial card.
3. **Tutorial step count** — the progress bar reads ≈6 % filled at step 1, implying ~16 tour steps, but no explicit "1 of N".
4. **Why both Bathroom instances became S 33** between shots 10 and 11, when the Bedroom addition in shot 5 left the pre-existing M 152 instance intact. Two candidate models: (a) the user decremented to 0 then incremented twice; (b) changing the count re-normalises all instances of that type to the current size, and the Bedroom case is an exception. Needs a controlled repro.
5. **`Room List Capacity ⓘ` tooltip copy** — never opened.
6. **What the "Total vs Heated" split shows** once an unheated room (Garage, Front Porch, Outdoor Living) is added — never exercised.
7. **Multi-story behaviour** — the readout stayed "1 Story"; no story control was visible on this step.
8. **Steps 2 and 3** — "Place Rooms & Shape" and "Results" (design variants A–E, version N/5, canvas dimension labels, materials/pricing) are entirely unobserved in this batch.
9. **Locked-room upsell target** — the black "View" button's destination/plan names and prices were never opened.
10. **Section `≡` grips** — likely drag handles for reordering sections (or collapse toggles); no drag was performed.
