# Drafted (drafted.ai) — Screen Forensics, Batch 06

Source: 12 sequential 1920×1200 screenshots of a single authenticated session,
`/home/dell/Pictures/Screenshots/Screenshot from 2026-09-12 15-11-59.png` →
`… 15-13-14.png`. Chronological. Session covers the **tail of Step 2 (Place Rooms
& Shape)**, the **Create → generation → Results (Step 3)** flow, design-slot
switching, and the **Furnish & Render → Choose Palette** modal.

Browser chrome is constant across all 12 frames (Zen/Firefox-style): tabs
`New tab`, `Local Model Chat`, `Local Model Chat`, **`Drafted - Design your d…`**
(active, favicon "D"), `Free 3D House Design`. Address bar shows
`www.drafted.ai` in black + path in grey.

---

## Global chrome (identical in every frame)

### Top app bar (height ≈ 44 px, bg `#FAF9F2`, 1 px bottom hairline)
Left → right:

1. **Wordmark** `Drafted` — high-contrast serif (Playfair/Didone-like), with a
   decorative swash under/through the final `d`. Near-black `#1C1917`.
2. **Home icon + `My Studio`** — small outline house glyph, bold serif label.
   Acts as the "back to studio" link.
3. **Vertical divider** `|`
4. **Back control**: `‹` chevron + contextual label —
   `Create Room List` (frame 1) / `Place Rooms & Shape` (frames 2–12).
   The label is the *previous* wizard step, i.e. "go back to X".
5. **Centered stepper** — three numbered pills joined by em-dash rules:
   - `(1) Create Room List` — grey circle `#C8C6C2`, grey label
   - `(2) Place Rooms & Shape`
   - `(3) Results`
   Active step = solid black circle `#1C1917` with white numeral + bold
   near-black label; inactive = grey circle + grey label. Connector dashes are
   dark between completed steps, light before future steps.
6. **Right cluster (obscured in every frame by the tutorial card)** — two
   rounded-rect pill buttons and one circular avatar are visible only as the
   top 8 px of their outlines at x≈1655–1850 plus an avatar disc at x≈1885.
   By elimination these are the `Learn` button, the credits pill, and the user
   avatar. The credits pill is seen unobstructed inside the palette modal:
   gold 4-point **sparkle icon** + a grey pill-shaped meter bar + **`1 left`**.

### Tutorial coach-mark card (top-right overlay, `#FFFFFF`, ~312×140 px, radius ≈ 14 px, soft drop shadow)
Structure, top → bottom:
- Eyebrow: `TUTORIAL STEP N` — all-caps, letterspaced, small, grey `#78716C`.
- Title: serif, ~20 px, near-black.
- Body: 2 lines, ~14 px sans, grey.
- **Progress bar** pinned to the bottom edge, full card width, 3 px tall,
  dark fill `#1C1917` on light track.

Measured fill fraction per step: step 8 = 47 %, step 10 = 58 %, step 12 = 70 %,
step 13 = 76 %, step 14 = 82 %. This is linear at **≈ 5.88 % per step ⇒ the
product tour is 17 steps long** (14 / 17 = 82.4 %). Steps are *not* 1:1 with
screens — steps 9 and 11 elapse between frames without a captured screen.

### Persistent floating widgets
- **Intercom-style chat launcher** — dark circular button, bottom-right
  (x≈1866, y≈1147).
- OS screenshot toast (`Screenshot captured / You can paste the image from the
  clipboard.`) appears in frames 7, 9, 10, 11, 12 — OS artifact, not app UI.

---

## Screenshot 1 — `15-11-59.png`

**URL**
```
www.drafted.ai/app/studio/projects/114312/create/01M2B203CPTDZ0S2DVMTQF8AVC/editor
```
**Wizard step:** 2 — *Place Rooms & Shape* (active). Back link = `Create Room List`.

**Tutorial:** `TUTORIAL STEP 8` — **“Create the design”** —
*“Hit Create to generate five design options.”* (progress 47 %)

### Left panel — "My Rooms" (x 395–715, full height, bg `#E2E0DE`, radius ≈ 12)
Entire panel is **dimmed / non-interactive** (tutorial spotlight is on the
Create button), with a small white tooltip overlaying it:
> **“You can place more rooms after the tutorial is completed.”**

Panel contents:

- **Header row** — group-of-people icon + `My Rooms` (serif, ~18 px), and a
  white pill button **`+ Add Rooms`** on the right.
- **“AI-Create Mix” slider block**
  - Label left: `AI-Create Mix`; label right: `Best Balance` with a small
    downward caret **▾ marker sitting on the track** at ≈ 88 % position.
  - A single horizontal **slider / track** (rounded, grey), filled ≈ 88 %.
  - Footer stats, left: ⚡ `88% AI-Create` · right: ✋(hand) `12% Placed by You`.
  - ⇒ one continuous slider that trades AI-placed vs. user-placed rooms, with a
    named preset label ("Best Balance") for the current position.
- **Section: “Placed by You”** — hand icon + title, right-aligned count
  `2 Rooms`. Below, a mini schematic showing the two manually placed rooms as
  outlined rectangles drawn to relative scale:
  - `Bathroom` / `Placed` (small tall rectangle)
  - `Garage` / `Placed` (large square)
- **Section (partially covered by the tooltip)** — ⚡ lightning icon + title;
  right-side count text is clipped, only the tail `…ns` is legible. This is the
  AI-suggested / auto-placed room bucket. It renders as a **masonry grid of
  room chips**, each chip sized proportionally to its area, showing
  `Name` + `Size-code Area`:

  | Room chip | Size code | Area |
  |---|---|---|
  | Primary Bedroom | M | 225 ft² |
  | Bedroom | M | 152 ft² |
  | Bedroom | S | 104 ft² |
  | Primary Bathroom | S | 52 ft² |
  | Bathroom | S | 33 ft² |
  | Primary Closet | M | 62 ft² |
  | Bed Closet | M | 23 ft² |
  | Bed Closet | S | 11 ft² |
  | Kitchen | L | 272 ft² |
  | Dining | L | 241 ft² |

  Chips are grouped into visual rows by type (bedrooms row, baths row, closets
  row, living row). A **vertical scrollbar** with a down-caret ▾ at the bottom
  indicates more chips below the fold. Size codes **S / M / L** prefix the area.

### Canvas toolbar (centered, y ≈ 218–252) — four pill groups
1. **Mode/tool group** (white pill, 4 icon buttons):
   - map-pin-in-shape icon (site / lot?)
   - irregular-polygon “footprint” icon
   - **`Rooms`** — *active*, amber/gold outline + amber tint `#F5F0DF`, icon is
     a square with corner handles
   - outline house icon (roof/exterior)
2. **Zoom group**: magnifier−, magnifier+, circular-arrow reset-view.
3. **History group** (all disabled/greyed): undo ↶, redo ↷,
   eraser icon + **`Reset`** + `˅` chevron (split/dropdown button).
4. **`Snap`** — mint-tinted pill `#81A396` link/magnet icon + label, **on**.

### Canvas
- Background: soft sage grid `#DEE2D6` with 1 px dotted minor grid and solid
  major gridlines; a darker crosshair axis pair marks origin.
- **Orientation labels** around the plot: `Back` (top center), `Left` (left
  edge), `R…`/`Right` (right edge, clipped by the 3D panel).
- **Building footprint**: thick black outline, irregular stepped polygon, filled
  with a warm yellow/amber "heat" gradient `#F3E3BF` (denser at the core),
  with a **dashed inset offset line** running inside the whole perimeter.
- **Placed room: Garage** — white/lilac `#F1E7EB` rect with a **teal-green
  selection border**, car icon, bold label `Garage`, sublabel `M | 441 ft²`.
- **Placed room: Bathroom** — small pale-blue rect near the top edge with teal
  border and a shower-head icon (no visible label at this zoom).
- Curved door-swing arcs are drawn where doors attach.
- A **dashed leader line** runs from the bottom of the footprint down to the
  Create button (the tutorial spotlight pointer).

### Bottom action bar (centered, white rounded card)
- Stats row: `Total 2,494 ft²` | `Heated 2,494 ft²` | `1 Story`
- **`⚡ Create`** — full-width dark button `#292524`, white bold label, gold
  lightning icon, wrapped in an animated **dashed spotlight ring**.

### 3D preview card (bottom-right, x 1530–1890, y 515–875, white, radius 12)
- Massing/roof model of the current footprint (hip roof, cream planes, grey
  walls) rendered isometrically.
- Small black ▲ under the model = camera/orientation marker.
- Bottom-left: outline **home icon** button (reset camera / front view).
- Bottom-right: roof-profile icon + **`Hip`** + `˅` → **roof-style dropdown**.

---

## Screenshot 2 — `15-12-08.png`

**Transition:** user clicked **`⚡ Create`**. App navigated from `/editor` to
`/review` and jumped the stepper to **3 Results**.

**URL**
```
www.drafted.ai/app/studio/projects/114312/create/01M2B203CPTDZ0S2DVMTQF8AVC/review?spread=01M2B2SW8C79DMQBB68ARGFKK2
```
⇒ route `/review`, query param **`spread=<ULID>`** identifying the batch of 5
designs.

**Wizard step:** 3 — *Results* (active, black). Back link now reads
`Place Rooms & Shape`.

**Tutorial:** `TUTORIAL STEP 10` — **“Your designs are on the way”** —
*“Five designs are on the way — they’ll land in the slots below as they
finish.”* (58 %)

### New left rail: version / spread history (replaces My Rooms)
- **`New design` tile** (top): dashed-bordered square with a large white
  circular **`+`** button, caption `New design`.
- **Current spread card** (below): rounded card showing a mini footprint on the
  sage grid, with:
  - top-left badge **`Latest`**
  - top-right counter badge **`0/5`** (designs finished in this spread)
  - centered spinner + **`Generating`** overlay (card greyed out)
  - footer metrics: `Total 2,498 ft²` | `Heated 2,013 ft²` | `15 Rooms`
- **Vertical carousel arrows** to the right of the card: circular **`^`** and
  **`v`** buttons (previous/next spread version).

### Canvas (results mode)
- Toolbar reduced to **zoom−, zoom+, reset-view** only (no Rooms/Snap/undo).
- Canvas shows the **outline-only footprint** (black stroke, no fill) plus the
  two user-placed rooms as flat colour blocks (lilac garage, blue bath).
- Center pill: spinner + **`Generating`** + **`0 of 5 ready`**.
- Bottom stats bar: `Total 2,430 ft²` `Heated --` `-- Rooms` (placeholders).
- Bottom action row: **`✎ Edit manually`** (disabled/greyed) and
  **`✨ Furnish & Render`** (dark pill, enabled).

### Right 3D card
- Badge **`A`** top-left (black disc, white letter).
- Spinner + **`Generating scheme A…`** and
  *“3D preview will start after the floor plan is ready.”*
- Bottom-left **diagonal expand arrows** icon (fullscreen the 3D view).
- A scale-ruler tick graphic sits on the canvas just left of the card.

### Bottom design-slot strip (5 cards, centered)
`A` `B` `C` `D` `E` — white rounded cards, each with a black circular letter
badge top-left; all five show spinners. Card **A** is selected (dark 2 px ring).

---

## Screenshot 3 — `15-12-13.png`

**Transition:** slot A's floor plan finished rendering (~5 s later). Same URL,
same tutorial step 10.

**Changes:**
- Canvas now shows the **fully rendered, coloured Design A floor plan** with
  walls, doors (with swing arcs), windows (white breaks in wall), per-room fills
  and typeset labels.
- Right card: spinner + **`Building 3D model…`** (text changed from
  "Generating scheme A…").
- Slot A thumbnail now shows a colour mini-plan; B–E still spinners.
- Spread card still `0/5`, still `Generating`.
- Bottom stats: `Total 2,430 ft²` `Heated --` `-- Rooms`.

### Design A — complete room schedule read off the canvas
| Room | Dimensions | Fill colour family |
|---|---|---|
| Bedroom | 10'9" × 13'4" | pink `#FEDFD6` |
| Bathroom | 5'6" × 7'2" | blue `#D1E5F7` |
| Bedroom | 11'8" × 13'4" | pink |
| Bathroom | 3'10" × 4'6" | blue |
| Kitchen | 22'9" × 13'4" | amber `#FEEAB2` |
| Pantry | 3'1" × 3'4" | amber (lighter) |
| Primary Bath | 9' × 8'8" | blue |
| Primary Closet | 6' × 5'5" | orange `#FCC79C` |
| Primary Bed | 20'9" × 12'4" | salmon `#FDC7B7` |
| Living | 28'7" × 14'4" | amber |
| Dining | 15'6" × 14'4" | amber |
| Laundry | 21'4" × 5'7" (label rotated 90°) | mint `#DCFAF2` |
| Garage | 20'10" × 21'4" | lilac `#F1E7EC` |

Labels are set in the **serif** face: bold name on line 1, lighter
`W'W" x L'L"` dimension string on line 2; rotated 90° for narrow rooms.

---

## Screenshot 4 — `15-12-19.png`

**Transition:** the 3D model for scheme A finished.

- Right card now renders a **watercolour-style 3D elevation**: single-storey
  white house, hip roof, grid-pane windows, green lawn strip, white sky.
- Spread counter badge flips **`0/5` → `1/5`**; card still says `Generating`.
- Bottom stats resolve: `Total 2,430 ft²` | `Heated 2,009 ft²` | `18 Rooms`.
- Slots B–E still spinning. Tutorial still step 10.

*(Note: the left spread card's own footer stats — `Total 2,498 ft² / Heated
2,013 ft² / 15 Rooms` — belong to the **input room list**, and differ from the
per-design stats shown at canvas bottom. Two distinct metric readouts.)*

---

## Screenshot 5 — `15-12-28.png`

**Transition:** all five designs finished.

**Tutorial advanced:** `TUTORIAL STEP 12` — **“Pick a design”** —
*“Click one of the slots below to preview that design on the canvas.”* (70 %)

**Changes:**
- Spread card badge **`5/5`**; the `Generating` overlay is replaced by a white
  pill button **`✎ Edit plan`** centred on the card; card is no longer dimmed
  and now renders the plan schematic (lilac garage + blue bath + white body).
- Bottom slot strip: **all five thumbnails A–E show distinct colour mini-plans**
  and the whole strip is wrapped in the **dashed spotlight ring** (tutorial
  target). A remains selected.
- Canvas still shows design A; bottom stats `Total 2,430 ft²` |
  `Heated 2,009 ft²` | `18 Rooms`.
- Confirms the five designs are genuinely different footprints/layouts.

---

## Screenshot 6 — `15-12-38.png`

**Transition:** user clicked slot **C**.

**URL gains a slot param**
```
…/review?spread=01M2B2SW8C79DMQBB68ARGFKK2&slot=C
```
**Tutorial advanced:** `TUTORIAL STEP 13` — **“Furnish & Render”** —
*“Open the material picker for the selected design.”* (76 %)

**Changes:**
- Canvas swaps to **Design C** (different layout: garage on the far left with a
  large lilac block, laundry/pantry top-left, living/dining/kitchen band).
- Right 3D card badge changes **`A` → `C`**; renders C's elevation.
- Slot **C** card now has the dark selection ring; A deselected.
- Bottom stats: `Total 2,431 ft²` | `Heated 1,962 ft²` | `18 Rooms`.
- **`✨ Furnish & Render`** is now wrapped in the dashed spotlight ring, with a
  dashed curved arrow + loading-arc drawn from the lower right pointing at it.
- `✎ Edit manually` remains greyed.

### Design C — room schedule
| Room | Dimensions |
|---|---|
| Laundry | 10'7" × 6'10" |
| Bathroom | 3' × 6'10" |
| Bedroom | 12'10" × 11'6" |
| Bedroom | 13'11" × 11'6" |
| Bathroom | 5' × 7'6" |
| Closet | 2'3" × 5'10" |
| Garage | 20'11" × 21'4" |
| Pantry | 6'3" × 4'5" |
| Kitchen | 12'1" × 16'2" |
| Dining | 16' × 16'4" |
| Living | 23'7" × 16'2" |
| Primary Bath | 8'5" × 8'8" |
| Primary Closet | 5'10" × 8'8" |
| Primary Bed | 20'11" × 12'4" |

---

## Screenshot 7 — `15-12-42.png`

**Transition:** user clicked slot **E**.

**URL:** `…&slot=E`

**Tutorial:** still `TUTORIAL STEP 13` (Furnish & Render, 76 %).

**Changes:**
- Canvas swaps to **Design E**: garage lower-left, a very long `Living`
  (34'9" × 14'4") running the width, bedrooms top-left, primary suite top-right,
  laundry + kitchen bottom-right.
- 3D card badge → **`E`**; its elevation now clearly shows a **garage door**
  on the left bay — the 3D updates per design.
- Slot E selected (ring); slot C deselected.
- Bottom stats: `Total 2,489 ft²` | `Heated 2,053 ft²` | `19 Rooms`.
- Furnish & Render still spotlighted with the dashed arrow.

### Design E — room schedule
| Room | Dimensions |
|---|---|
| Bedroom | 10'5" × 13'4" |
| Bathroom | 5'6" × 7'8" |
| Bedroom | 11'8" × 13'4" |
| Closet | 5'9" × 2'5" |
| Garage | 23'11" × 21'3" |
| Living | 34'9" × 14'4" |
| Primary Bath | 5'10" × 4' |
| Bathroom | 5'6" × 5'2" |
| Primary Bed | 12'4" × 13'4" |
| Primary Closet | 5'10" × 8'8" |
| Pantry | 5'4" × 5'4" |
| Dining | 16'10" × 14'6" |
| Bathroom | 5'2" × 9' |
| Laundry | 9'10" × 9' |
| Kitchen | 20'11" × 12' |

---

## Screenshot 8 — `15-12-55.png`

Identical app state to screenshot 7 (slot E, step 13) — the OS screenshot toast
has dismissed. No app change. Useful only as confirmation that the dashed
spotlight ring + curved arrow on **Furnish & Render** persists while the user
hesitates.

---

## Screenshot 9 — `15-12-59.png`

**Transition:** user clicked **`✨ Furnish & Render`** → the **Choose Palette**
modal opened. URL unchanged (`…&slot=E`) — the modal does **not** push a route.

**Tutorial advanced:** `TUTORIAL STEP 14` — **“Choose a palette”** —
*“Pick a palette to stage this design with exterior materials.”* (82 %)

### Choose Palette modal
- Full-screen dimmed scrim (dark, ≈ 55 % opacity) over the results canvas.
- Modal sheet: x ≈ 550–1725, y ≈ 285–1045, bg `#FAF8F2`, radius ≈ 18,
  large soft shadow.
- **Header bar** (with hairline underline):
  - Left: white square **`‹` back button** + title **`Choose Palette`** (serif).
  - Center: **two tabs** —
    `🎨 Default Palettes` (active: near-black bold + 2 px underline) and
    `🔖 My Palettes` (grey / inactive, bookmark icon).
  - Right: **credits pill** — gold sparkle icon + grey meter bar + **`1 left`**.
- **Body: horizontal carousel** of palette cards, 3 visible at a time, with
  circular **`‹`** (left) and **`›`** (right) arrow buttons floating over the
  content edges.
- Each palette card = a **painterly watercolour house render** (≈ 330×180) above
  a row of **5 material swatch chips**, with the palette name centred beneath.
- Swatch chip semantics (read from *Bright Stucco*): 1) primary wall/stucco
  colour blob, 2) secondary siding/board texture, 3) roof material (dark
  diagonal shingle/standing-seam), 4) window (black-framed multi-pane sash),
  5) entry door (wood with sidelights). All are torn-edge painted textures,
  not flat squares.

**Visible palettes (page 1):** `Bright Stucco`, `Timber Slate`, `White Brick`.

---

## Screenshot 10 — `15-13-06.png`

**Transition:** user clicked the **`‹` left carousel arrow** — the carousel
scrolled back to the start of the list.

**Changes:**
- First cell is now a **`Start fresh`** tile: dashed-outline square with a large
  circular grey **`+`**, caption `Start fresh` (grey). ⇒ create a custom palette
  from scratch (likely the entry point into *My Palettes*).
- Then `Bright Stucco`, then `Timber Slate` (partially visible).
- Only the **`›`** right arrow is now rendered (left arrow hidden at list start)
  — confirming arrow visibility is bounded by scroll position.

**Tutorial:** still step 14.

---

## Screenshot 11 — `15-13-10.png`

**Transition:** user clicked **`›`** (paged forward, past the first frame).

**Visible palettes:** `White Brick`, `Navy Classic`, `Brick Classic`.
Both `‹` and `›` arrows present (mid-list).

Swatch reading:
- **White Brick** — white brick, white brick (2nd variant), warm tan brick, white
  window, wood door.
- **Navy Classic** — navy body paint, grey shingle siding, tan/wood shake roof,
  white window, wood door.
- **Brick Classic** — red brick, off-white trim, charcoal roof, white window,
  white/black door.

---

## Screenshot 12 — `15-13-14.png`

**Transition:** user clicked **`›`** again.

**Visible palettes:** `Spanish Tiles`, `Prairie Stone`, `Classic Gray`.

Swatch reading:
- **Spanish Tiles** — cream stucco, cream stucco, terracotta barrel tile roof,
  black window, wood garage/entry door. Render shows a warm tan house with an
  orange tile roof and two wood garage doors.
- **Prairie Stone** — tan horizontal lap siding, stone veneer, charcoal roof,
  white window, black door. Render: tan house, dark garage door.
- **Classic Gray** — grey lap siding, mixed grey stone, charcoal roof, black
  window, (5th chip clipped). Render: grey/white modern ranch with white garage
  door.

**Full default-palette catalogue observed across frames 9–12 (ordered):**
`Start fresh` (create), `Bright Stucco`, `Timber Slate`, `White Brick`,
`Navy Classic`, `Brick Classic`, `Spanish Tiles`, `Prairie Stone`,
`Classic Gray` — 8 real palettes + the create tile. The `›` arrow remains
enabled after Classic Gray, so **the list may extend further** (unverified).

---

## Interaction model recovered

```
Step 2 /editor
  ├─ toolbar: Site | Footprint | Rooms | Exterior   (Rooms active)
  ├─ zoom−/zoom+/reset-view
  ├─ undo/redo/Reset ˅  (all disabled with empty history)
  ├─ Snap toggle (on)
  ├─ left panel: My Rooms → + Add Rooms, AI-Create Mix slider,
  │              "Placed by You" list, AI chip grid (drag onto canvas)
  ├─ 3D massing card → Hip ˅ roof picker + home/reset-camera + (expand)
  └─ bottom: Total/Heated/Stories + ⚡ Create
                 │
                 ▼  POST → creates a "spread" (ULID) of 5 designs
Step 3 /review?spread=<ULID>
  ├─ left rail: New design (+) | spread cards (Latest badge, n/5 counter,
  │             Edit plan, Total/Heated/Rooms) | ^ v version carousel
  ├─ streaming fill: "Generating  k of 5 ready", per-slot spinner →
  │                  2D plan → "Building 3D model…" → 3D elevation
  ├─ slot strip A B C D E  → click ⇒ ?slot=X, canvas + 3D + stats swap
  ├─ bottom: Total / Heated / N Rooms
  ├─ ✎ Edit manually (disabled during tutorial)
  └─ ✨ Furnish & Render  ⇒ Choose Palette modal (no route change)
                 │
                 ▼
Choose Palette modal
  ├─ ‹ back | tabs: Default Palettes / My Palettes | credits "1 left"
  ├─ carousel ‹ ›  of palette cards (render + 5 material chips + name)
  └─ "Start fresh" tile to author a custom palette
```

### Tutorial step map (from this batch)
| Step | Title | Body | Anchor |
|---|---|---|---|
| 8 | Create the design | Hit Create to generate five design options. | Create button (dashed ring) |
| 10 | Your designs are on the way | Five designs are on the way — they'll land in the slots below as they finish. | Slot strip / canvas |
| 12 | Pick a design | Click one of the slots below to preview that design on the canvas. | Slot strip (dashed ring) |
| 13 | Furnish & Render | Open the material picker for the selected design. | Furnish & Render button (dashed ring + arrow) |
| 14 | Choose a palette | Pick a palette to stage this design with exterior materials. | Palette modal |
| — | (inline tooltip, not numbered) | You can place more rooms after the tutorial is completed. | My Rooms panel |

Tour length inferred = **17 steps** (progress is linear, step/17).

---

## Visual design notes

**Typography**
- Display/serif (wordmark, panel titles, modal title, tutorial titles, floor-plan
  room labels): a high-contrast transitional serif — Playfair Display / Libre
  Baskerville family. Wordmark has a custom swash tail on the `d`.
- UI sans (buttons, stats, tutorial body, chips): a geometric-humanist sans
  (Inter/DM Sans-like), 13–15 px, medium-to-bold weights for numbers.
- Numbers in stats are bold; their labels ("Total", "Heated") are regular grey.

**Palette (sampled)**
| Token | Hex |
|---|---|
| App/page background | `#FAF8F2` |
| Top bar background | `#FAF9F2` |
| Ink / primary button | `#1C1917` → `#292524` |
| Panel (My Rooms) bg | `#E2E0DE` |
| Canvas grid (sage) | `#DEE2D6` |
| Footprint heat fill | `#F3E3BF` |
| Active tool tint (amber) | `#F5F0DF` + gold border |
| Snap chip (mint/green) | `#81A396` |
| Selection border (rooms) | teal-green |
| Modal scrim | dark `#555752` @ ~55 % |

**Floor-plan room colour system**
| Room family | Fill |
|---|---|
| Bedroom | `#FEDFD6` (pink) |
| Primary Bed | `#FDC7B7` (deeper salmon) |
| Bathroom / Primary Bath | `#D1E5F7` (blue) |
| Kitchen / Dining / Living / Pantry / circulation | `#FEEAB2` (amber) |
| Closet / Primary Closet | `#FCC79C` (orange) |
| Laundry | `#DCFAF2` (mint) |
| Garage | `#F1E7EC` (lilac / unheated) |

Walls are drawn as thick grey `#818181` poché with a drop shadow; windows are
white gaps with double lines; doors are a leaf line + dashed quarter-arc swing.

**Layout proportions (1920 wide)**
- Top bar 44 px. Left panel/rail ≈ 320 px wide with 35 px gutter.
- Canvas fills the remainder; 3D preview card is a 360×360 floating card pinned
  bottom-right with 30 px inset.
- Bottom action bar is a centred floating white card, ~300 px wide in editor,
  ~300 px (two buttons) in review; slot strip is a centred 5-card row ~460 px.

---

## Synthesis — features & controls this batch reveals

1. Three-step wizard stepper with clickable/labelled states and a contextual
   "back to previous step" link in the app bar.
2. Route structure: `/app/studio/projects/{projectId}/create/{ulid}/editor`
   and `/app/studio/projects/{projectId}/create/{ulid}/review?spread={ulid}&slot={A–E}`.
3. Credit metering surfaced as a pill (`sparkle + meter + "N left"`), visible in
   the app bar and repeated inside the palette modal; `1 left` at capture time.
4. A 17-step guided product tour with numbered coach-marks, a linear progress
   bar, dashed spotlight rings around the target control, and curved dashed
   leader arrows; plus un-numbered inline tooltips that explain temporarily
   disabled UI.
5. "My Rooms" program editor: add rooms, see user-placed vs AI-placed split,
   drag proportionally-sized room chips, S/M/L size codes and per-room ft².
6. "AI-Create Mix" slider blending AI-generated vs. user-placed rooms, with a
   named preset readout ("Best Balance") and a live % split.
7. Editor canvas with tool modes (site, footprint, Rooms, exterior), zoom,
   reset view, undo/redo, a Reset dropdown, and a Snap toggle.
8. Live 3D massing preview with a roof-type dropdown (`Hip`), reset-camera and
   expand controls.
9. Single `Create` action that generates a **spread of five schemes** and
   streams them in with an `n of 5 ready` counter.
10. Version/spread history rail with `Latest` badge, per-version metrics,
    up/down navigation, an `Edit plan` re-entry, and a `New design` tile.
11. Design slots A–E with letter badges, live thumbnails, selection ring and a
    URL-addressable `slot` param; selecting one swaps canvas, 3D and stats.
12. Per-design metrics: Total ft², Heated ft², room count (and `1 Story` in the
    editor) — distinct from the input program's own totals.
13. `Edit manually` (locked during tutorial) and `Furnish & Render` actions on a
    generated design.
14. Palette picker modal with Default/My Palettes tabs, a paged carousel,
    painterly per-palette renders, five-material swatch sets, a `Start fresh`
    custom-palette tile, and credit gating.

---

## Open questions / not visible in this batch

- Exact labels of the three right-hand app-bar controls (Learn, credits, avatar)
  — obscured by the tutorial card in all 12 frames.
- The clipped section header in the My Rooms panel (tail `…ns` only) and its
  right-hand count.
- Tutorial steps 1–7, 9, 11, 15–17.
- What `My Palettes` shows when empty, and whether `Start fresh` opens an editor.
- Whether the palette carousel continues past `Classic Gray`.
- What consumes the credit: the Furnish & Render render, or the Create spread.
- Contents of the `Reset ˅` dropdown and the `Hip ˅` roof dropdown.
