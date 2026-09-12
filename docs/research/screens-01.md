# Drafted (drafted.ai) — Screen Forensics, Batch 01

**Source:** 12 sequential screenshots, `/home/dell/Pictures/Screenshots/Screenshot from 2026-09-12 15-00-02.png` → `…15-00-48.png`, 1920×1200 each.
**Session window:** 15:00:02 → 15:00:48 (46 s of one continuous session).
**Scope of this batch:** Wizard **Step 1 — Create Room List** only. All 12 frames are the same route, the same tutorial step, and the same project; the only things that change are catalog scroll position, which catalog row is hovered, and the resulting right-hand preview + capacity delta.

> **Capture caveats.** (a) A GNOME "Screenshot captured / You can paste the image from the clipboard" toast covers the middle of the browser address bar in all 12 frames, so only the URL tail is legible. (b) The tutorial callout card covers the top-right of the app nav in all 12 frames, so the Learn button / credits pill / avatar are only inferable from the two pill outlines and one circle outline peeking above it. Both regions need a re-capture.

---

## 0. Global chrome present in every frame

### Browser / OS chrome (not part of the product)
- Linux desktop, top bar `Sep 12 15:00`, Zen/Firefox-style browser window.
- Left OS dock + a Claude-Code-like side panel (`models / Hackathon AI model setup`, `resume / kyros-mba-local-tidy-pnueli`, `Other / Next suggested steps`, footer `W Wonyoung · Max`).
- Browser tab strip: `New tab`, `Local Model Chat`, `Local Model Chat` (2nd).
- Address bar right-side icons: open-in-new, pencil (edit), cursor/select, reader/sidebar toggle.
- **App viewport** is x≈363→1911, y≈150→1200 → **~1548 × ~1050 CSS px**.

### Product top navigation bar (full-bleed, ~48 px tall, y≈150–198)
Left → right:
1. **`Drafted` wordmark** — high-contrast serif (Didone/Playfair-like), with two decorative swashes: a flourish off the shoulder of the `D` and a long curved tail sweeping left-under the final `d`. Near-black on the app's warm-grey ground.
2. **Home icon + `My Studio`** — outline house glyph, bold sans label. (Route home / project list.)
3. **Thin vertical divider `|`**
4. **`‹ Back`** — left chevron + regular-weight label.
5. **Centered stepper** (3 steps, em-dash connectors):
   - `①  Create Room List` — **active**: solid near-black filled circle, white numeral, bold near-black label.
   - `—`
   - `②  Place Rooms & Shape` — inactive: mid-grey filled circle, white numeral, grey label.
   - `—`
   - `③  Results` — inactive, same treatment.
6. **Top-right cluster (obscured by the tutorial card):** two rounded-rectangle "pill" button outlines side-by-side (≈ x1655–1745 and ≈ x1755–1855), then a **circular avatar** outline at ≈ x1880. By product convention these are the **Learn** button, the **credits pill ("N left")**, and the **user avatar**. Exact labels not readable in this batch.

### Floating support widget
- Bottom-right, ~44 px dark rounded-square with a speech-bubble/messenger glyph at ≈ (1866, 1147) — Intercom-style chat launcher, floats above everything.

### Tutorial overlay (active in all 12 frames)
- The whole page is dimmed by a **black scrim at ≈27 % opacity** (measured: white `#FFFFFF` renders as `#BABAB9`). The **Room Catalog card and the bottom summary card are NOT dimmed** (they read pure `#FFFFFF`), i.e. they are the spotlighted targets; the My Rooms panel, top nav and page background *are* dimmed.
- **Callout card**: white, ~22 px radius, heavy soft shadow, anchored top-right at ≈ x1578–1890, y172–330, with a small pointer nub toward the top-right nav.
  - Eyebrow: **`TUTORIAL STEP 1`** — uppercase, letter-spaced, ~11 px, grey `#6b6b6b`, bold.
  - Title: **`Build your dream room list`** — serif (same family as the wordmark), ~22 px, near-black.
  - Body ¶1: `More complete room lists give better direction for our AI to meet your needs.`
  - Body ¶2: `Click Continue when you're done.`
  - **Progress bar** at the card foot: 2 px rail, light-grey track `#E8E8E8`, black fill. Fill measures **18 px of a 287 px track = 6.3 %** → the tour is **~15–16 steps long**.
  - No visible Next/Skip buttons inside the card in this batch — progression is driven by the primary CTA in the page ("Continue …").

---

## 1. Page layout — Step 1 "Create Room List"

Three regions inside the app viewport:

| Region | x-range (px) | Notes |
|---|---|---|
| Page gutter (left) | 363 → 485 | warm grey ground `#B7B5B0` (dimmed value) |
| **Room Catalog card** | 485 → 1443 (≈958 px, ~62 %) | white, ~16 px radius, 1 px hairline border, subtle shadow |
| gutter | 1443 → 1450 | |
| **My Rooms panel** | 1450 → 1782 (≈332 px, ~21 %) | white card, y 240 → ~1040 |
| Page gutter (right) | 1782 → 1911 | |

Inside the Room Catalog card:
- **Left column = the catalog list**, x 501 → 789, with a **vertical scrollbar track at x≈789–798** (light thumb) plus **tiny triangle scroll affordances**: ▲ at (793, 299) and ▼ at (793, 1147).
- **Right column = the 3D room preview stage**, x 798 → 1437.

Floating over the bottom-right, partially covering the My Rooms panel:
- **Summary + CTA card**, x 1450 → 1790, y ≈1050 → 1170, white, ~18 px radius, strong shadow.

---

## 2. The Room Catalog — complete inventory

### Card header (y 240–292)
- Left: a **geometric 3D-cube/faceted-box outline icon** + **`Room Catalog`** (bold sans, ~17 px).
- Right: **`🗑 Clear All`** — pill/outline button, 1 px grey border, white fill, trash-can icon + bold label.
- Hairline divider below the header spanning the card width.

### List structure
Each **category group** = a drag-handle icon (`≡`, three short grey bars) + a grey, medium-weight group label. Groups are visually re-orderable (the handle implies drag-to-reorder of the whole category).

Each **room row** (≈48 px tall, ~14 px radius):
- **Left colour rail** — an 8 px-wide, fully-rounded vertical bar at x≈527–535, inset from the row, colour-coded by *sub-family* (not by group — Beds/Baths/Closets each get their own rail colour inside "Beds & Baths").
- **Room icon** — thin monoline pictogram (bed, bathtub, wardrobe, sofa, door, car, washing machine, …).
- **Room name** — bold sans, ~15 px.
- **Right control**, one of:
  - `⊕` circular outline **add** button (count = 0),
  - **stepper** `⊖ N ⊕` (count ≥ 1),
  - **stepper with disabled `⊕`** and no `⊖` (auto-included rooms, e.g. Bed Closet),
  - `🔒` circular outline **lock** button (paywalled rooms).
- **Sub-label** (optional, small grey, truncated with `…`): e.g. `Auto-included wit…`, `Auto-included with Bed…`.

### Full catalog, in document order

**Group: `Beds & Baths`** *(drag handle ≡)*
| Room | Rail colour | Control state in this session |
|---|---|---|
| Primary Bed | `#FEDFD6` (blush pink) | `⊖ 1 ⊕`, row tinted `#FEF2EE` |
| Bedroom | `#FEDFD6` | `⊖ 1 ⊕`, row tinted `#FEF2EE` |
| Primary Bath | `#D1E5F7` (pale blue) | `⊕` only (count 0) |
| Bathroom | `#D1E5F7` | `⊕` only (count 0) |
| Primary Closet | `#FDDBC1` (apricot) | `⊖ 1 ⊕`, sub-label `Auto-included wit…`, row tinted `#FEF2E8` |
| Bed Closet | `#FDDBC1` | count `1`, **`⊕` greyed/disabled, no `⊖`**, sub-label `Auto-included with Bed…`, row tinted `#FFF7F1` |

**Group: `Living Spaces`** *(drag handle ≡)* — rail `#FDE08F` (warm yellow) for all members
| Room | Control |
|---|---|
| Kitchen | `⊕` |
| Dining | `⊕` |
| Breakfast Nook | `⊕` |
| Pantry | `⊕` |
| Living | `⊕` |
| **— nested paywall sub-card —** | see below |
| Den | 🔒 |
| Family Room | 🔒 |
| Sunroom | 🔒 |
| **— end sub-card —** | |
| Foyer | `⊕` |

> **Paywall sub-card** (nested *inside* the Living Spaces group, between `Living` and `Foyer`): a rounded ~14 px container, cream fill `#FBF8EE`, 1 px gold/tan border, with its own header row:
> - **`UPGRADE SUBSCRIPTION`** pill — uppercase, letter-spaced ~10 px bold, gold text `#C58B2C` on a pale-gold fill `#F7EDCB` with a gold border.
> - **`View`** button — solid black rounded-rect (~8 px radius), white bold label. (Opens plans/pricing.)
> - Then the three locked rows, each with a **circular outline padlock** button on the right instead of `⊕`. Locked rows are still hoverable and still drive the 3D preview.

**Group: `Outdoor Spaces`** *(drag handle ≡)* — rail `#DAF7DA` (mint green)
| Room | Control |
|---|---|
| Front Porch | `⊕` |
| Outdoor Living | `⊕` |

**Group: `Specialty Spaces`** *(drag handle ≡)* — rail `#FEDBEA` (pink)
| Room | Control |
|---|---|
| Office | `⊕` |

**Group: `Garage & Utility`** *(drag handle ≡)* — per-room rails
| Room | Rail colour | Control |
|---|---|---|
| Garage | `#F1E7EC` (pale mauve) | `⊕` |
| Laundry | `#DCFAF2` (pale aqua) | `⊕` |
| Mudroom | `#E9E9E9` (grey) | `⊕` |
| Utility Closet | `#E9E9E9` | `⊕` |
| Storage | `#E9E9E9` | `⊕` |

`Storage` is the last row in the scroller (scroll thumb bottoms out and the ▼ affordance sits just beneath it).

**Not in the catalog but present in My Rooms:** `Hallway` — an auto-generated circulation space (yellow / Living-Spaces colour, `M 23 ft²`). It has no catalog row and no stepper.

---

## 3. The 3D preview stage (right side of the catalog card)

- Large **isometric line-drawing render** of the hovered/selected room, ~350–420 px tall, centred at ≈ (1115, 620).
- Pure white background, thin black/dark-grey line work, light grey wall shading, soft cast shadow.
- **Dimension tick marks** (architectural extension lines with short cross-ticks) run along the two visible floor edges and up the wall corners. **No numeric dimension labels are rendered at this step** (numeric dimensions like `52 ft 4 in` appear later, on the Place Rooms & Shape canvas).
- **The floor plane is tinted with the room's colour**, which is how the render is colour-coded to the catalog: Living/Foyer/Den/Family Room/Sunroom floors are yellow `#FEEAB2`; Front Porch / Outdoor Living floors are mint `#DAF7DA`; Office floor is pink `#FEDBEA`; Garage floor is mauve; Laundry floor is aqua; Utility Closet floor renders apricot `#FDDBC1` (closet family).
- Renders are furnished and room-specific — e.g. Living = sofa group + fireplace + wall of windows; Foyer = empty entry with chandelier + double doors; Den = full-height bookcase wall + armchairs; Family Room = sofas + shelving + plant; Sunroom = glass on two walls + plants; Front Porch = columns, rocking chairs, front steps; Outdoor Living = covered patio with sofa, dining table + chairs, steps; Office = shelving wall + desks; Garage = garage door + car; Laundry = washer/dryer pair + counter; Mudroom = lockers/bench + coat hooks + door; Utility Closet = tiny empty closet with a shelf and hanging rail.

**Floating size swatch** (bottom-centre of the stage, ≈ x1050–1190, y900–1060):
- A **rounded square whose side length is proportional to the room's area**, filled with the room's colour, ~12 px radius, faint shadow.
- Two centred lines: **room name** (bold, ~12 px) and **`{size} - {area} ft²`** (regular grey, e.g. `M - 309 ft²`). Small rooms wrap to `M - 74` / `ft²` on two lines.

**Stage footer row** (y ≈1085–1120):
- Left: the room's **monoline icon + room name** in bold, ~16 px.
- Right: **`S` `M` `L` segmented size selector** — three ~34 px square targets; the active one (`M` in every frame) is a **solid black rounded-square (~10 px radius) with white bold letter**; inactive letters are grey on transparent. This selector changes the previewed area (and therefore the swatch size and capacity delta).

---

## 4. My Rooms panel (right column)

- Header: **two-person / group outline icon + `My Rooms`** (bold, ~17 px), hairline divider below.
- Body: an **area-proportional tile mosaic** of the rooms already on the list. Tiles are rounded squares (~10 px radius), sized in proportion to their `ft²`, laid out in flowing rows, each labelled with the room name (bold, wrapping) and `{size} {area} ft²` below.
- Tiles present in every frame (unchanged across the batch):

| Tile | Label | Approx. tile size | Fill (dimmed → true) |
|---|---|---|---|
| Primary Bedroom | `M 225 ft²` | largest | `#B99387` → **≈`#FECAB9`** (deep blush) |
| Bedroom | `M 152 ft²` | medium | `#B19D96` → **≈`#F3D7CE`** (light blush) |
| Primary Closet | `M 62 ft²` | small | `#B79273` → **≈`#FBC89E`** (apricot, deeper) |
| Bed Closet | `M 23 ft²` | smallest | `#B9A18E` → **≈`#FDDBC1`** (apricot, lighter) |
| Hallway | `M 23 ft²` | smallest | `#B9AB83` → **≈`#FEEAB2`** (Living-Spaces yellow) |

  Note the "Primary X" variant of a family always takes the **deeper** shade of that family's colour and the plain variant the lighter shade.
- Panel footer (pinned to the bottom of the panel, above a hairline rule):
  - **`Room List Capacity`** (bold, ~14 px) + a small **circled `i` info icon** (tooltip trigger).
  - Right-aligned: **`13% Filled`** (grey) + an optional bold **delta badge `+N%`** (black) + a **solid green status dot** `#08943D`.
  - **Capacity meter** — 6 px fully-rounded bar, track `#B3B3B1` (dimmed; true ≈`#E4E4E2`), ~273 px wide:
    - base fill in light green `#6AAE7E`, 35 px ≈ **13 %**;
    - when a row is hovered, an **additional darker-green segment is appended**, sized exactly to the delta (verified: `+3 %` = 8 px, `+4 %` = 11 px, `+5 %` = 14 px, `+6 %` = 16 px against a 273 px track). This is a **live "what this room would add" preview**, not a committed value — `13% Filled` never changes across the batch.

---

## 5. Bottom summary + CTA card

- **`Total 508 ft²`  `|`  `Heated 508 ft²`  `|`  `1 Story`** — numbers bold, labels regular, thin vertical pipe separators. Identical in all 12 frames.
- **Primary CTA**: full-width **black pill/rounded-rect button (~12 px radius)**, white bold ~17 px label:
  **`⊞  Continue with only 4 rooms  ›`** — a 2×2-grid glyph on the left, a right chevron on the right. The label is *dynamic and nagging*: it interpolates the current room count and the word "only" pressures the user to add more before advancing.
- Note the discrepancy worth replicating deliberately: **5 tiles in My Rooms but "4 rooms" in the CTA** — auto-included/derived spaces (Hallway, and/or Bed Closet) are excluded from the CTA's count.

---

## 6. Per-screenshot log

> URL is identical in all 12 frames. Visible tail (the rest is under the OS toast):
> **`…0Z0S2DVMTQF8AVC/room-list`**
> Consistent with the expected shape `…/app/studio/projects/{projectId}/create/{ULID}/room-list` — the readable tail `0Z0S2DVMTQF8AVC` is the last 15 chars of a 26-char Crockford-base32 ULID, and `room-list` is the Step-1 sub-route segment.

Constant in all 12: stepper on **① Create Room List**; **TUTORIAL STEP 1 "Build your dream room list"**; size selector on **M**; `Total 508 ft² | Heated 508 ft² | 1 Story`; `Continue with only 4 rooms`; `Room List Capacity … 13% Filled`; My Rooms = the same 5 tiles.

### 6.1 — `15-00-02.png`
- **Scroll:** list at the very top (`Beds & Baths` header visible; ▲ affordance shown).
- **Hovered row:** **`Living`** — 2 px dark rounded outline, row fill `#FEF5D8` (≈50 % tint of the yellow rail), `⊕` emphasised.
- **Preview:** Living room — sofa suite, coffee table, fireplace/TV wall, three tall windows. Swatch **`Living / M - 309 ft²`** (yellow, large). Footer icon = sofa, label `Living`.
- **Capacity:** `13% Filled` **`+3%`** ● ; meter shows base 13 % + a dark 3 % segment.
- Visible below the fold: the paywall sub-card with `UPGRADE SUBSCRIPTION` / `View` / Den 🔒 / Family Room 🔒 / Sunroom 🔒, then `Foyer`.

### 6.2 — `15-00-10.png`  *(Δ: user scrolled the catalog down ~120 px)*
- **Scroll:** `Bedroom` is clipped at the top; group headers `Living Spaces` and `Outdoor Spaces` now both visible; `Front Porch` peeking at the bottom.
- **Hovered row:** **`Foyer`** — dark outline, fill `#FEF5D8`.
- **Preview:** empty foyer — double doors with sidelights, chandelier, bare yellow floor. Swatch **`Foyer / M - 142 ft²`**. Footer icon = open door, label `Foyer`.
- **Capacity:** `13% Filled` **`+5%`** ●.

### 6.3 — `15-00-15.png`  *(Δ: pointer moved up into the paywall sub-card)*
- **Scroll:** unchanged from 6.2.
- **Hovered row:** **`Den`** (locked). Highlight is *softer* — fill `#FCF2D0`, **no dark outline** (locked rows get a muted hover), padlock button unchanged.
- **Preview:** den — full-height bookcase wall, two armchairs, round table, sofa. Swatch **`Den / M - 202 ft²`**.
- **Capacity:** `13% Filled` — **no `+N%` badge, no dark meter segment**. → *Locked rooms do not produce a capacity-delta preview.*

### 6.4 — `15-00-18.png`
- **Hovered row:** **`Family Room`** (locked), fill `#FCF2D0`, no outline.
- **Preview:** family room — sectional + armchairs, shelving/bookcase wall, tall plant, windows. Swatch **`Family Room / M - 297 ft²`**.
- **Capacity:** `13% Filled`, **no delta**.

### 6.5 — `15-00-22.png`
- **Hovered row:** **`Sunroom`** (locked), fill `#FCF2D0`, no outline.
- **Preview:** sunroom — two full glass walls, sectional, round coffee table, armchair, two potted palms. Swatch **`Sunroom / M - 270 ft²`**.
- **Capacity:** `13% Filled`, **no delta**.

### 6.6 — `15-00-29.png`  *(Δ: user scrolled down further, ~220 px)*
- **Scroll:** `Living` now the top row; whole bottom of the catalog visible through `Storage`; ▼ affordance at the bottom.
- **Hovered row:** **`Front Porch`** — dark outline, fill `#ECFBEC` (mint tint).
- **Preview:** covered front porch — four columns, two rocking chairs, windows, front steps, mint floor. Swatch **`Front Porch / M - 229 ft²`** (green).
- **Capacity:** `13% Filled` **`+6%`** ● (largest delta seen).

### 6.7 — `15-00-33.png`
- **Hovered row:** **`Outdoor Living`** — dark outline, mint fill.
- **Preview:** covered outdoor living — sofa, lounge chairs, dining table + 4 chairs, columns, wide steps. Swatch **`Outdoor Living / M - 775 ft²`** (largest swatch in the batch).
- **Capacity:** `13% Filled` **`+4%`** ●.

### 6.8 — `15-00-36.png`
- **Hovered row:** **`Office`** (Specialty Spaces) — dark outline, fill `#FEEDF5` (pink tint).
- **Preview:** office — grid shelving wall, two trestle desks, plant, window; **pink floor** `#FEDBEA`. Swatch **`Office / M - 163 ft²`** (pink).
- **Capacity:** `13% Filled` **`+4%`** ●.

### 6.9 — `15-00-39.png`
- **Hovered row:** **`Garage`** — dark outline, fill `#F8F3F6`.
- **Preview:** garage — sectional garage door, low-poly car, mauve floor. Swatch **`Garage / M - 372 ft²`** (mauve `#F1E7EC`).
- **Capacity:** `13% Filled` **`+3%`** ●.

### 6.10 — `15-00-43.png`
- **Hovered row:** **`Laundry`** — dark outline, fill `#EEFCF8`.
- **Preview:** laundry — washer + dryer pair, folding counter with sink, aqua floor patch. Swatch **`Laundry / M - 74 ft²`** (aqua `#DCFAF2`, small, label wraps to `M - 74 / ft²`).
- **Capacity:** `13% Filled` **`+3%`** ●.
- *(An OS bell/notification glyph appears in the desktop top bar from this frame on — not product UI.)*

### 6.11 — `15-00-45.png`
- **Hovered row:** **`Mudroom`** — dark outline, fill `#F9F9F9`.
- **Preview:** mudroom — bench with cubbies, coat hooks, tall cabinets, door; grey floor. Swatch **`Mudroom / M - 74 ft²`** (grey `#F3F3F3`, label wraps).
- **Capacity:** `13% Filled` **`+4%`** ●.

### 6.12 — `15-00-48.png`
- **Hovered row:** **`Utility Closet`** — dark outline, fill `#F4F4F4`.
- **Preview:** a bare narrow closet — two walls, a shelf and a hanging rail; **apricot floor** `#FDDBC1` (closet family). Swatch **`Utility Closet / M - 23 ft²`** (grey `#E9E9E9`, smallest swatch, label wraps to three lines).
- **Capacity:** `13% Filled` **`+4%`** ●.

---

## 7. Interaction model recovered from this batch

1. **Hover-to-preview.** Hovering any catalog row (locked ones included) instantly drives three things: the isometric 3D render, the proportional colour swatch + `{S|M|L} - {area} ft²` caption, and the footer icon/name. Nothing is committed.
2. **Hover-to-forecast.** Hovering an *unlocked* row also appends a darker-green "would-add" segment to the Room List Capacity meter and shows a `+N%` badge. Hovering a *locked* row suppresses both.
3. **Add / remove.** `⊕` adds one instance (row gains a tinted background and converts to `⊖ N ⊕`); `⊖` decrements. Adding a Primary Bed auto-adds a Primary Closet; adding a Bedroom auto-adds a Bed Closet ("Auto-included with Bed…"), and the auto-included child's `⊕` is disabled with no `⊖` (cardinality is slaved to the parent). Adding bedrooms also spawns a `Hallway` tile that never appears in the catalog.
4. **Size scope.** The `S / M / L` segmented control at the stage footer sets the size class used for the preview area (and, by implication, the size a room is added at). All 12 frames sit on `M`.
5. **Reordering.** Every category group carries a `≡` drag handle → categories are re-orderable.
6. **Reset.** `Clear All` (trash icon) wipes the room list.
7. **Paywall.** Three Living-Spaces rooms (Den, Family Room, Sunroom) are gated behind an inline `UPGRADE SUBSCRIPTION` sub-card with a black `View` CTA and per-row padlock buttons. They remain browsable/previewable but not addable.
8. **Advance.** The black CTA reads `Continue with only 4 rooms ›` — count-interpolated, with a guilt-tripping "only" to encourage a fuller list; it is the same control the tutorial refers to ("Click Continue when you're done").
9. **Tour.** A 15–16-step guided tour dims the page, spotlights the active panel, and shows `TUTORIAL STEP N` + serif title + body + a thin progress bar.

---

## 8. Visual design notes

- **Typography.** Serif display face (Didone/Playfair-ish) for the `Drafted` wordmark and tutorial titles; a neutral geometric/grotesque sans (Inter/Söhne-ish) for all UI text. Room names bold ~15 px; group headers medium grey ~14 px; micro-labels ~11 px grey.
- **Ground.** Warm neutral page background (dimmed reading `#B7B5B0`; true value is a warm off-white/greige, roughly `#FAF8F3`–`#F2EFE9`). Cards are pure white with hairline borders, 14–18 px radii and soft low-spread shadows.
- **Accent.** Near-black (`#111`) is the single action colour — filled CTA, active stepper dot, active S/M/L chip, `View` button. Gold `#C58B2C` is the paywall accent. Green `#08943D` / `#6AAE7E` is the capacity/health accent.
- **Room colour system.** Every room type maps to a pastel family; the same hue is used for (a) the row's left rail, (b) the row hover/added tint (a 25–50 % tint of it over white), (c) the 3D render's floor plane, (d) the preview swatch, and (e) the My Rooms tile.

| Family | Hex | Members |
|---|---|---|
| Beds | `#FEDFD6` | Primary Bed, Bedroom |
| Baths | `#D1E5F7` | Primary Bath, Bathroom |
| Closets | `#FDDBC1` | Primary Closet, Bed Closet, Utility Closet (render floor) |
| Living Spaces | `#FDE08F` rail / `#FEEAB2` fill | Kitchen, Dining, Breakfast Nook, Pantry, Living, Den, Family Room, Sunroom, Foyer, Hallway |
| Outdoor | `#DAF7DA` | Front Porch, Outdoor Living |
| Specialty | `#FEDBEA` | Office |
| Garage | `#F1E7EC` | Garage |
| Laundry | `#DCFAF2` | Laundry |
| Utility/Grey | `#E9E9E9` / `#F3F3F3` | Mudroom, Utility Closet, Storage |

- **Illustration style.** Hand-drafted architectural isometric: 1 px dark line work, no fills except a light grey wall wash and the coloured floor plane, plus architectural dimension extension lines with cross-ticks at the room extents.

---

## 9. Open questions / gaps this batch cannot answer

- The full URL (host, `/app/studio/projects/{id}/create/{ulid}/` prefix) — obscured by the OS toast.
- The top-right nav contents: **Learn** button label, the **credits pill** text (`N left`), avatar menu.
- What the Room List Capacity `i` tooltip says, and what 100 % capacity is measured against (the `+N%` deltas are demonstrably **not** linear in ft²: 309 ft²→+3 %, 142 ft²→+5 %, 229 ft²→+6 %, 775 ft²→+4 %, 74 ft²→+3 % and +4 %, 23 ft²→+4 %; it behaves like a curated per-room-type "completeness weight", not an area ratio).
- Exact S and L areas for each room type (only `M` was exercised).
- Why the CTA says "4 rooms" while My Rooms shows 5 tiles (which spaces are excluded from the count).
- Everything in Step 2 (Place Rooms & Shape) and Step 3 (Results): canvas dimension labels, design variants A–E, version `1/5`–`5/5`, materials, pricing/plan screens, the `View`/upgrade modal, `My Studio` project list.
- The remaining ~14 tutorial steps.
