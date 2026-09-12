# Drafted (drafted.ai) — Forensic Screen Study, Batch 05

**Source:** 12 sequential 1920×1200 screenshots of one continuous session, `/home/dell/Pictures/Screenshots/Screenshot from 2026-09-12 15-10-05.png` → `…15-11-49.png`.

**What this batch covers:** the entirety of **Wizard Step 2 — "Place Rooms & Shape"**, specifically the *house-shape* half of that step: opening the shape picker, browsing the shape library, applying a shape, editing its outline, picking a roof shape in the 3D preview, then dismissing the shape editor to return to the room list and begin placing rooms.

**Tutorial steps captured:** TUTORIAL STEP 2 → TUTORIAL STEP 7 (six of an inferred ~16 total — see §Tutorial Progress Model).

> Note on the browser chrome: every shot is Firefox (a Zen/Firefox variant with a left vertical sidebar showing an unrelated local Claude Code session). Tabs open: `New tab`, `Local Model Chat` ×2, **`Drafted - Design your d…`** (active), `Free 3D House Design`. This is host OS chrome, not part of the product.

---

## Global chrome, constant across all 12 shots

### URL (identical, verbatim, in all 12)
```
www.drafted.ai/app/studio/projects/114312/create/01M2B203CPTDZ0S2DVMTQF8AVC/editor
```
Route shape: `/app/studio/projects/{numericProjectId}/create/{ULID}/editor`
- `114312` — numeric project id.
- `01M2B203CPTDZ0S2DVMTQF8AVC` — 26-char ULID = the *design run / create-session* id.
- `editor` — the leaf segment for Step 2. (Compare the known sibling leaf `…/create/{ulid}/room-list` for Step 1.) The URL **does not change** while the shape modal opens/closes, while the roof dropdown opens, or as the tutorial advances — all of this is client-side state inside `…/editor`.
- Firefox renders `www.drafted.ai` in full black and the path in grey (standard domain-highlighting), so the registrable domain is confirmed as `drafted.ai` with a `www` host.

### Top navigation bar (single row, ~52 px tall, background `#C9C8C2`-ish warm grey that is dimmed by the tutorial scrim)
Left → right:
1. **`Drafted`** wordmark — high-contrast **serif** (Playfair/Prata-like), with a distinctive swash/pointed terminal on the leading `D`. Black on the light bar. This is the home/brand link.
2. **`⌂ My Studio`** — outline "house" icon + label. Navigates back to the studio/dashboard.
3. Thin vertical divider `|`.
4. **`‹ Create Room List`** — a back affordance: left chevron + label naming the *previous* wizard step. Goes back to Step 1.
5. **Centered stepper** (three numbered pills joined by short em-dash rules):
   - `①  Create Room List` — grey filled circle, grey label (completed/inactive)
   - `—`
   - `②  Place Rooms & Shape` — **black filled circle with white "2", bold black label (ACTIVE in all 12 shots)**
   - `—`
   - `③  Results` — grey circle, grey label (locked/future)
6. **Top-right cluster (OCCLUDED IN ALL 12 SHOTS by the tutorial card).** What is still visible above/behind the card: two rounded-rectangle pill buttons (~90 px and ~115 px wide) and, at the far right edge, the top-left arc of a **circular avatar** rendered with a black stroke. These correspond to the known `Learn` button, the credits pill (`N left`), and the user avatar — but **no text of them is legible in this batch**. Flagged as an open question.

### Canvas frame (present in all 12)
- Full-bleed work area below the nav, warm light-grey page background `#C3C3BD`-ish.
- The plan canvas itself is a **sage/olive-green tinted square** (`#C9CFBE`-ish) spanning roughly x 767→1507, y 325→1065 (a square ~740 px, i.e. a fixed-aspect "lot" viewport).
- **Grid:** two-level grid — fine dotted minor grid plus dashed major grid lines every ~5 minor cells. A solid darker **centre cross-hair** (one vertical, one horizontal) marks lot centre.
- **Orientation labels** in grey sans, outside the canvas on all four sides: **`Back`** (top centre), **`Left`** (left middle), **`Right`** (right middle), **`Front`** (bottom centre). When the 3D preview panel is open it covers the right label so only `R` is visible.

### Floating canvas toolbar (top-centre, ~y 215–255, four pill-shaped grouped segments with 8 px gaps)
| Group | Contents | Notes |
|---|---|---|
| **Tools** | ① map-pin-inside-rounded-square icon (Site / Lot) · ② puzzle-piece-ish polygon icon (**Shape**) · ③ bounding-box-with-corner-handles icon (**Rooms**) · ④ small outline house icon (**Roof**) | Only the **active** tool shows its text label; inactive tools are icon-only. Active tool gets a **gold/tan rounded outline + gold-tinted fill**. Group ④ (Roof) is **absent in shot 1** and appears from shot 5 onward — i.e. the roof tool is only enabled once a house shape exists. |
| **View** | magnifier-minus (**Zoom out**) · magnifier-plus (**Zoom in**) · counter-clockwise circular arrow (**Reset view / re-fit**) | Always enabled. |
| **History** | curved-left arrow (**Undo**) · curved-right arrow (**Redo**) · eraser icon + text **`Reset`** + down-chevron | **Disabled/greyed in all 12 shots.** `Reset` is a split/dropdown button (chevron ⌄ implies a menu of reset scopes). |
| **Snap** | green "magnet/linked-loops" icon + **`Snap`** in green, on a pale-green pill | A toggle, shown ON (green) throughout. |

### Bottom summary + primary CTA (floating card, bottom-centre, ~x 980–1292)
- Single metrics line, pipe-separated, grey labels + bold black values:
  `Total 2,694 ft²  |  Heated 2,013 ft²  |  1 Story` (shot 1)
  `Total 2,494 ft²  |  Heated 2,494 ft²  |  1 Story` (shots 6–12)
- Below it a **full-width black pill button: `⚡ Create`** — gold lightning-bolt glyph + white "Create" text. This is the generate action that produces Step-3 results.
- **The summary card is hidden** while the shape-picker modal is open (shots 2–5) and re-appears once the modal closes.

### Tutorial overlay system (present in all 12)
- A **dimming scrim** over the whole app; only the element being taught is punched through at full brightness with a **dashed black "marching-ants" outline** and, in several shots, a hand-drawn **curved arrow** pointing at it.
- **Tutorial card**, top-right, white, ~316×~145 px, rounded ~12 px, soft shadow:
  - Eyebrow: `TUTORIAL STEP N` — small, uppercase, letterspaced, grey-brown, bold.
  - Title: **serif**, ~20 px, black (matching the `Drafted` wordmark family).
  - Body: 2–3 lines of grey sans.
  - **Progress bar** at the bottom: thin full-width track (light grey) with a black fill.
- One shot also shows a **black `I'm done` pill button** below the highlighted element (shot 10) — the per-step advance/acknowledge control.
- A **lock tooltip** appears for gated controls: grey rounded card, circular grey badge with **padlock** glyph, title **`Available after the tutorial`**, body `You are almost done learning the basics of the product.`

### Intercom-style round chat launcher
Fixed bottom-right (~1868, 1147): dark circular button with a speech-bubble glyph. Present in all 12.

---

## Screenshot 01 — `15-10-05.png`

**URL:** `www.drafted.ai/app/studio/projects/114312/create/01M2B203CPTDZ0S2DVMTQF8AVC/editor`
**Stepper:** ② Place Rooms & Shape (active). **Active tool:** `Rooms` (3 tools in the tools group — no Roof tool yet).
**Tutorial:** `TUTORIAL STEP 2` · **"Add a house shape"** · *"Open the shape picker to choose your home's outline."* · progress ≈ **14 %**.

### Left panel — "My Rooms" (~x 397–712, y 236–1160, white rounded card)
- Header row: two-person "group" icon + **`My Rooms`** (bold sans) · right-aligned outlined pill **`+ Add Rooms`**.
- Horizontal rule.
- **`AI-Create Mix`** block:
  - Label `AI-Create Mix` (bold) left, **`Best Balance`** in gold/ochre right.
  - Below the gold label: a short gold gradient tick-bar ending in a small **▼ marker** at ~88 % of the track width — i.e. the *recommended* mix position.
  - **Meter bar** full width, ~18 px tall, rounded, filled with a left-to-right gradient **pink → lavender → periwinkle → pale blue**. In this shot it is filled to 100 %.
  - Footer row: `⚡ 100% AI-Create` (gold, with lightning bolt) · `✋ 0% Placed by You` (grey, with an open-hand/palm icon).
- Divider, then a **scrollable list region** (visible scrollbar track on the right edge).
- **`✋ Placed by You`** section header + right-aligned count **`0 Rooms`**. Empty state: a pale sage rounded rectangle with centred italic grey text over two lines: *"Place rooms on canvas to control their specific location and shape."*
- Divider.
- **`⚡ AI-Create`** section header + right-aligned count **`17 Rooms`**.
- **Room chips** — rounded-square tiles whose **physical size on screen is proportional to the room's ft²**, laid out in wrapping rows sorted largest-first. Each chip shows the room name (bold, 1–2 lines) and, under it, `{S|M|L} {area} ft²`. Colour encodes room family. Visible chips (in order):

  | Row | Chip | Size code | Area | Swatch colour family |
  |---|---|---|---|---|
  | 1 | **Primary Bedroom** | M | 225 ft² | salmon / coral (saturated) |
  | 1 | **Bedroom** | M | 152 ft² | salmon (lighter tint) |
  | 2 | **Bedroom** | S | 104 ft² | salmon (lightest tint) |
  | 2 | **Primary Bathroom** | S | 52 ft² | blue (saturated) |
  | 2 | **Bathroom** | S | 33 ft² | blue (light) |
  | 3 | **Bathroom** | S | 33 ft² | blue (light) |
  | 3 | **Primary Closet** | M | 62 ft² | orange / peach (saturated) |
  | 3 | **Bed Closet** | M | 23 ft² | peach (light) |
  | 3 | **Bed Closet** | S | 11 ft² | peach (light) |
  | 4 | **Kitchen** | L | 272 ft² | golden yellow |
  | 4 | **Dining** | L | 241 ft² | golden yellow |
  | 5 | *(cut off below the fold — a blue-ish chip's top edge is visible)* | | | |

  17 rooms exist in the AI-Create bucket; 11 are visible above the fold.

### Canvas
- Empty (no house shape yet). A soft, blurred **radial "heat" wash** in pink/lavender/peach sits over the middle of the lot — a density hint of where the AI intends to put mass.
- Orientation labels `Back` / `Left` / `Right` / `Front`.

### Tutorial highlight
A large punched-through **`Add Shape` card** on the right (~x 1685–1897, y 583–808), dashed black outline:
- Big black rounded-square thumbnail containing a white plus-shaped/cruciform **house-footprint glyph**.
- Title **`Add Shape`** (bold).
- Body over two lines: *"Browse, edit or create the shape of your home."*
This is the entry point the user is being told to click.

### Bottom summary
`Total 2,694 ft²  |  Heated 2,013 ft²  |  1 Story` + `⚡ Create`.
(Note: Total > Heated by 681 ft² — the difference is unheated space such as the garage.)

---

## Screenshot 02 — `15-10-17.png`

**Transition from 01:** user clicked the **`Add Shape`** card. The `My Rooms` panel is replaced by the **`My House Shape`** modal, the active tool switched from `Rooms` → **`Shape`**, and the tutorial advanced 2 → 3.

**Stepper:** ② active. **Active tool:** `Shape` (gold outline). Tools group still has 3 items.
**Tutorial:** `TUTORIAL STEP 3` · **"Pick a shape"** · *"Pick a shape that feels close — you can tune it later."* · progress ≈ **20 %**.

### Modal — "My House Shape" (white, rounded, ~x 396–746, y 232–1150; sits on a slightly larger light backing plate ~x 381–760, y 220–1170)
- Header: outline house icon + **`My House Shape`** (bold) · **`×`** close button top-right.
- **Area readout** (label left, bold value right):
  - `Main House Area` + a circled **ⓘ** info icon · **`2,694 ft²`**
  - `Outdoor Area` · **`0 ft²`**
  - `Total Target Area` · **`2,694 ft²`**
- Horizontal rule.
- **Two-tab / two-action row:**
  - **`⤓ Choose Shape`** (download-into-tray icon, bold black = active tab)
  - **`🔖 My Shapes`** (bookmark icon, grey = inactive tab — the user's saved shapes)
- **Shape library grid** — 2 columns, vertically scrollable (visible scrollbar thumb on the right at the very top → we are at the top of the list). Each cell = a shape thumbnail above a thin divider line above a **truncated dimension caption** `{W} W x {D} …`.
- Cells visible (reading order):
  1. **`Start my own`** — a grey circular **`+`** button instead of a thumbnail. (Custom-shape drawing entry point.)
  2. `63 ft 0 in W x 59 ft 2 …`
  3. `39 ft 8 in W x 70 ft 4 …`
  4. `47 ft 8 in W x 57 ft 8 …`
  5. `45 ft 8 in W x 63 ft 2 …`
  6. `52 ft 8 in W x 78 ft 8 …`
  7. `30 ft 8 in W x 101 ft …`
  8. `67 ft 4 in W x 61 ft 0 …`
  (a 9th row is clipped at the fold)
- **Thumbnail rendering:** each is an orthogonal polygon drawn as a cream/off-white fill with a ~2 px dark-charcoal outline, with **one sub-rectangle tinted pale mauve/pink** — the pre-assigned garage bay within that footprint.
- **Modal footer:** status line **`No shape selected`** (grey), then a full-width outlined pill **`Cancel`**.

### Canvas
Still empty; the pink heat wash from shot 1 is gone (the canvas now shows a clean green grid). `Back` / `Left` / `Right` / `Front` labels present. No bottom summary card (hidden behind/replaced by the modal flow).

---

## Screenshot 03 — `15-10-25.png`

**Transition from 02:** user **scrolled the shape library** (the scrollbar thumb has moved down ~20 %). Nothing else changed — same tutorial step, same modal, same header numbers.

**Tutorial:** `TUTORIAL STEP 3` · "Pick a shape" (unchanged, ≈ 20 %).
**Modal header:** `Main House Area 2,694 ft²` / `Outdoor Area 0 ft²` / `Total Target Area 2,694 ft²`. Tabs: `⤓ Choose Shape` (active) · `🔖 My Shapes`.

### Shape cells visible
1. `107 ft 10 in W x 31 f…` — a long, shallow, wide footprint
2. `56 ft 8 in W x 53 ft 1…` — squarish with two notches
3. `51 ft 0 in W x 66 ft 0 …`
4. `44 ft 0 in W x 81 ft 0 …`
5. `41 ft 4 in W x 61 ft 2 …`
6. `54 ft 8 in W x 65 ft 0 …`
7. `71 ft 8 in W x 47 ft 8 …`
8. `51 ft 2 in W x 59 ft 4 …`
(next row clipped)

Footer still `No shape selected` + `Cancel`.

---

## Screenshot 04 — `15-10-37.png`

**Transition from 03:** further scroll down the library. Same step 3, same modal state.

### Shape cells visible
1. `56 ft 8 in W x 68 ft 8 …`
2. `101 ft 6 in W x 33 ft …` — very wide/shallow with a scalloped front
3. `69 ft 0 in W x 43 ft 1…`
4. `98 ft 10 in W x 38 ft …`
5. `55 ft 4 in W x 63 ft 0 …`
6. `69 ft 0 in W x 55 ft 4 …`
7. `42 ft 0 in W x 78 ft 8 …`
8. `39 ft 4 in W x 66 ft 6 …`
(next row clipped)

Footer `No shape selected` + `Cancel`. Canvas still empty.

---

## Screenshot 05 — `15-10-42.png`

**Transition from 04:** the user has **hovered a shape tile** (cell `56 ft 0 in W x 65 ft 4 …`) — it now renders as a white raised card with a rounded border, and the canvas shows a **live preview** of that shape plus an **`Add to canvas`** black tooltip pill at the canvas centre. A **Roof tool (house icon) has appeared** as the 4th item in the tools group, and a 3D preview panel is now visible at the right.

> A transient OS notification overlays the browser top: `📷 Screenshot · Just now / Screenshot captured / You can paste the image from the clipboard.` — host OS chrome, not product UI.

**Tutorial:** `TUTORIAL STEP 3` · "Pick a shape" (still ≈ 20 %).
**Toolbar tools group:** `⊙pin` · **`Shape`** (active, gold) · `rooms box` · `⌂ roof` — **four** items now.

### Shape cells visible
1. `90 ft 0 in W x 35 ft 8 …` (thumbnail clipped at top)
2. `95 ft 4 in W x 32 ft 6 …` (thumbnail clipped at top)
3. `37 ft 8 in W x 79 ft 8 …`
4. `65 ft 8 in W x 62 ft 8 …`
5. `68 ft 2 in W x 53 ft 4 …` — an **H-shaped** footprint
6. **`56 ft 0 in W x 65 ft 4 …`** ← **HOVERED / focused** (white card, rounded border)
7. `56 ft 4 in W x 74 ft 6 …`
8. `39 ft 8 in W x 67 ft 8 …`
9. `53 ft 10 in W x 51 ft …` (label clipped)
10. `80 ft 0 in W x 39 ft 8…` (label clipped)

Footer: `No shape selected` + `Cancel`.

### Canvas — preview state
- A grey house outline is drawn on the lot (the hovered candidate shape), rendered in flat grey with a charcoal stroke (not yet committed).
- A **placed room already exists**: a lavender/mauve rectangle, top-centre, extending *above* the outline, with a **car icon**, label **`Garage`**, sub-label **`M | 487 ft²`**. Its border is charcoal. This confirms rooms placed by the user persist through shape changes and are **auto-resized** when the shape changes (compare 441 ft² later).
- Centred black tooltip pill: **`Add to canvas`**.

### 3D preview panel (right, ~x 1532–1890, y 517–878, light rounded card)
- A **3D isometric massing model** of the house with a **hip roof** — beige/tan roof planes with visible ridges, hips, and eave overhangs; grey wall bands below.
- Bottom-left: small **outline house icon** button (view/model toggle or "reset to home view").
- Bottom-centre: a small solid **black triangle ▲** pointing up — the *front-of-house / north* orientation marker.
- Bottom-right: **`◇ Hip ⌄`** — the roof-shape dropdown trigger (diamond/hip-roof glyph + current value + chevron).

---

## Screenshot 06 — `15-10-51.png`

**Transition from 05:** the user scrolled a little and then **selected the tile `95 ft 4 in W x 32 ft 6 in D`** (it now carries a **thick black rounded selection border**). The shape has been applied to the canvas — the canvas shape changed to a wide/shallow footprint and the whole canvas is now punched out of the tutorial scrim (highlighted), with the `Add to canvas` pill still shown at the drop point. Tutorial advanced 3 → 4.

**Tutorial:** `TUTORIAL STEP 4` · **"Place the house shape"** · *"Apply the shape to set your floor plan's boundary."* · progress ≈ **26 %**.

### Shape cells visible
1. `55 ft 4 in W x 63 ft 0 …`
2. `69 ft 0 in W x 55 ft 4 …`
3. `42 ft 0 in W x 78 ft 8 …`
4. `39 ft 4 in W x 66 ft 6 …`
5. `69 ft 0 in W x 48 ft 2 …`
6. `58 ft 8 in W x 54 ft 4 …`
7. `90 ft 0 in W x 35 ft 8 …`
8. **`95 ft 4 in W x 32 ft 6 …`** ← **SELECTED** (thick black border)
9. + 10. two more thumbnails clipped at the bottom.

**Modal footer now reads:** **`95 ft 4 in W x 32 ft 6 in D selected`** and the `Cancel` button is dimmed (the modal is dismissing).

### Canvas
- The applied wide footprint is drawn in cream with a charcoal outline, spanning most of the lot width, with a notch/step at the front-right.
- The **Garage** chip has moved to the **left** end of the footprint and resized: **`Garage · M | 441 ft²`** (was 487 ft² under the previous candidate shape). Its box has a subtle charcoal border and lavender fill.
- Black **`Add to canvas`** tooltip pill still rendered at centre with a dashed highlight ring.

### 3D preview panel
Now shows the **new** wide/shallow massing with a hip roof. Same bottom-left house icon, ▲ marker, and `◇ Hip ⌄` dropdown.

---

## Screenshot 07 — `15-10-56.png`

**Transition from 06:** the shape modal has **closed/collapsed** into a compact **`My House Shape` side panel**, the shape is committed, the shape-edit handles are now live on the canvas, and the bottom summary card is back with updated numbers. Tutorial advanced 4 → 5, and the highlight has moved to the **3D preview panel**.

**Tutorial:** `TUTORIAL STEP 5` · **"Choose a roof shape you like"** · *"After the tutorial, you can sculpt your house in detail, defining roof slopes, overhangs, fascias, etc."* · progress ≈ **32 %**.

### Left side panel — "My House Shape" (compact, ~x 397–713, y 432–962)
- Header: outline house icon + **`My House Shape`**.
- Areas: `Main House Area ⓘ` **`2,494 ft²`** · `Outdoor Area` **`0 ft²`** · `Total Target Area` **`2,494 ft²`**.
  (All three dropped from 2,694 → 2,494 when the shape was applied — the committed shape's area overrides the target.)
- Rule.
- Sub-header row: a dashed-circle / "shape" icon + **`Current Shape`** (bold), with a **📌 pin icon button** on the right (pin/save this shape to *My Shapes*).
- **Shape preview**: the committed footprint drawn large in flat grey with a charcoal outline; the **garage bay is tinted mauve** at the left end.
- Caption, centred, bold-ish grey: **`95 ft 4 in W x 32 ft 6 in D`**.
- Rule.
- Full-width outlined pill button: **`⌂ Choose Different Shape`**.

### Canvas — shape editing mode
- The committed outline is now an **editable polygon** with:
  - **Corner handles**: small rounded-square/L-bracket handles at every vertex.
  - **Edge handles**: pill-shaped drag handles along each edge — a *larger* pill at the edge midpoint and *smaller* pills at the quarter points (so an edge can be dragged as a whole or split/extruded).
  - The garage bay is shown as a mauve-filled rectangle at the left end of the footprint.
- **Dimension labels** (light grey rounded chips, rotated to run along vertical edges):
  - Top edge: **`52 ft 4 in`**
  - Bottom edge: **`52 ft 4 in`**
  - Four `21 ft 6 in` labels (upper-left, upper-right, lower-left, lower-right wings)
  - Two `10 ft 0 in` labels (the vertical step risers, rotated)
  - Two `22 ft 6 in` labels (the far-left and far-right end walls, rotated)
- **Floating selection context toolbar** directly above the shape (~y 508–545), three pill buttons:
  - **`◇ Remove`** (eraser glyph) — **greyed/disabled**
  - **`▷|◁ Mirror`** (mirror/flip glyph) — **greyed/disabled**
  - **`◎ Recenter`** (crosshair/target glyph) — **enabled, black filled pill with white text** (the only active one)

### 3D preview panel — highlighted by the tutorial
Punched through the scrim with a dashed outline around the **`◇ Hip ⌄`** control specifically. Model = hip-roofed wide massing. Bottom-left house icon, ▲ marker present.

### Bottom summary
`Total 2,494 ft²  |  Heated 2,494 ft²  |  1 Story` + `⚡ Create`.
(Heated now equals Total — with the shape applied, the garage is inside the heated envelope / counted differently.)

---

## Screenshot 08 — `15-11-04.png`

**Transition from 07:** user **clicked the `Hip ⌄` control** — it expanded into a labelled pill **`Roof Shape  ◇ Hip  ^`** and a **4-option popover menu** opened below it. A hand-drawn curved tutorial arrow now points from the model down to the control.

**Tutorial:** `TUTORIAL STEP 5` (unchanged, ≈ 32 %).
**Side panel / canvas / summary:** unchanged from shot 07 (2,494 ft², same dimension labels, same Remove/Mirror/Recenter toolbar with Recenter active).

### Roof Shape popover (white, rounded ~16 px, ~x 1602–1880, y 872–1105) — **2 × 2 grid of options**
| Option | Glyph | State |
|---|---|---|
| **Hip** | pyramid/hip roof wireframe | **SELECTED** — black filled rounded tile, white icon + white label |
| **Gable** | single-ridge sloped plane | unselected (white tile, dark outline glyph, grey label) |
| **Flat with Overhangs** | thin flat slab with eaves | unselected |
| **Flat with Parapets** | flat slab with raised rim | unselected |

Trigger pill reads **`Roof Shape  ◇ Hip  ^`** (chevron flipped up while open) inside the dashed tutorial highlight.

---

## Screenshot 09 — `15-11-20.png`

**Transition from 08:** user **selected `Flat with Overhangs`**. Consequences:
1. The trigger now reads **`Roof Shape  ◇ Flat with Overhangs  ^`**.
2. In the popover, **`Flat with Overhangs`** is the black filled/selected tile and **`Hip`** is now the white outlined tile (it retains a light border as the previously-selected item).
3. The **3D model re-rendered**: the roof is now a **flat slab with overhanging eaves** — no ridges/hips, a single cream top plane with a thin grey fascia band.
4. A **`↻ Reset camera`** button appeared at the **top-centre of the 3D panel** (circular-arrow icon + label, outlined pill) — it materialises after the user has orbited/interacted with the 3D view.
5. A **lock tooltip** appeared over the canvas centre (~x 975–1300, y 625–710): grey rounded card, circular grey **padlock** badge, title **`Available after the tutorial`**, body *"You are almost done learning the basics of the product."* — i.e. the user tried to interact with a gated canvas control.

**Tutorial:** `TUTORIAL STEP 5` (unchanged, ≈ 32 %).
Everything else (side panel 2,494 ft², dimension chips, Remove/Mirror/Recenter, bottom summary) is unchanged.

---

## Screenshot 10 — `15-11-26.png`

**Transition from 09:** user **selected `Flat with Parapets`**. The trigger now reads **`Roof Shape  ◇ Flat with Parapets  ⌄`** (chevron back down — popover closed), and the **3D model re-rendered with a parapet**: the flat roof plane is now recessed inside a raised perimeter wall/rim, drawn as a thicker dark band around the top edge with a stepped lower wing.

**New control:** a **black pill button `I'm done`** (~x 1655–1767, y 890–927) sits directly below the highlighted 3D panel — the tutorial's explicit "advance" button for this step.

**Tutorial:** `TUTORIAL STEP 5` (still ≈ 32 %) — confirming the step does not auto-advance on roof selection; it requires `I'm done`.
Side panel, canvas handles, dimension chips, Remove/Mirror/Recenter, and `Total 2,494 ft² | Heated 2,494 ft² | 1 Story | ⚡ Create` are all unchanged.

---

## Screenshot 11 — `15-11-44.png`

**Transition from 10:** user clicked **`I'm done`**. The tutorial advanced 5 → 6. The shape-edit handles and all dimension chips have been **cleared from the canvas** (the polygon is now drawn plain), and the roof reverted in the 3D panel to **`◇ Hip ⌄`** (the parapet choice was a tutorial demo and was not persisted — or the roof was reset when the step completed). The `Reset camera` button is gone.

**Tutorial:** `TUTORIAL STEP 6` · **"Click outside of shape to see room list"** · *"Your room list will return so you can begin placing rooms."* · progress ≈ **38 %**. (Title wraps to two lines.)

### Tutorial highlight
A punched-through **circular `×` button** on the canvas (~x 1103–1172, y 512–580): a pale rounded-square backing, a white circle with a bold black **×** glyph, wrapped in an **animated dashed ring**, with a hand-drawn curved arrow pointing at it from the lower-right. This is the **deselect / exit-shape-edit** control.

### Left side panel
Still **`My House Shape`**, unchanged: `Main House Area ⓘ 2,494 ft²`, `Outdoor Area 0 ft²`, `Total Target Area 2,494 ft²`, `Current Shape` + 📌, shape thumbnail with mauve garage bay, caption `95 ft 4 in W x 32 ft 6 in D`, `⌂ Choose Different Shape`.

### Canvas
Plain committed footprint, no handles, no dimension chips. Garage bay visible as a mauve block at the left end. `Back` / `Left` / `Front` labels.

### 3D panel
Hip-roofed massing, bottom-left house icon, ▲ marker, **`◇ Hip ⌄`**.

### Bottom summary
`Total 2,494 ft²  |  Heated 2,494 ft²  |  1 Story` + `⚡ Create`.

---

## Screenshot 12 — `15-11-49.png`

**Transition from 11:** user clicked the `×`. The **`My House Shape` panel is replaced by the `My Rooms` panel** again, the active tool flipped from `Shape` → **`Rooms`**, and the tutorial advanced 6 → 7 into the room-placement lesson.

**Tutorial:** `TUTORIAL STEP 7` · **"Place a Room That Matters"** · *"Drag it into your home, then fine-tune its size, shape, and position."* · progress ≈ **44 %**.
**Toolbar tools group:** `⊙pin` · `shape` · **`Rooms`** (active, gold) · `⌂ roof` — four items, `Rooms` labelled.

### Left panel — "My Rooms" (updated state)
- Header: `👥 My Rooms` + **`+ Add Rooms`** pill.
- **`AI-Create Mix`** · **`Best Balance`** (gold) with the ▼ target marker at ~88 %.
- Meter bar now filled to **~94 %**, gradient now reading **lavender → pale blue → mint green** (the gradient hue shifts as the mix changes) with a small unfilled white tail at the right.
- Footer: **`⚡ 94% AI-Create`** (gold) · **`✋ 6% Placed by You`** (grey).
- **`✋ Placed by You`** · **`1 Room`**
  - Inside a pale sage container: a **Garage** tile drawn as a *proportional rectangle* (pale pink/lavender fill, grey border) with name **`Garage`** (bold) and status sub-label **`Placed`** (grey). This is the "placed" representation — no ft² shown here, just `Placed`.
- **`⚡ AI-Create`** · **`16 Rooms`** (was 17 — the Garage moved buckets).
- Room chips:

  | Chip | Size | Area | Colour | State |
  |---|---|---|---|---|
  | **Primary Bedroom** | M | 225 ft² | saturated salmon/coral | **HIGHLIGHTED** — wrapped in a dashed black tutorial ring |
  | **Bedroom** | M | 152 ft² | light salmon | |
  | **Bedroom** | S | 104 ft² | lightest salmon | |
  | **Primary Bathroom** | S | 52 ft² | saturated blue | |
  | **Bathroom** | S | 33 ft² | light blue | |
  | **Bathroom** | S | 33 ft² | light blue | |
  | **Primary Closet** | M | 62 ft² | saturated peach/orange | |
  | **Bed Closet** | M | 23 ft² | light peach | |
  | **Bed Closet** | S | 11 ft² | light peach | |
  | **Kitchen** | L | 272 ft² | golden yellow | |
  | **Dining** | L | 241 ft² | golden yellow | |
  | *(more below fold)* | | | | |

### Canvas — drop-target / drag affordance
- A **dashed black arrow** is drawn from the highlighted `Primary Bedroom` chip in the panel, across the gutter, into the house footprint, terminating with an arrowhead in the left-centre of the plan — the tutorial's "drag this here" gesture.
- The house footprint interior is washed in a soft pink/peach **placement heat map**.
- Two **dashed, organic blob outlines** (amoeba-shaped, grey dashed stroke) sit inside the footprint over the hottest pink regions — these are the **AI-suggested placement zones** for the room being dragged: one blob left-of-centre, one larger multi-lobed blob at the right.
- The placed **Garage** now renders with a **teal/green selection border** (`Garage · M | 441 ft²`, car icon) at the left end, half-overlapping the footprint edge — teal = currently-selected placed room.

### 3D panel
Hip-roofed massing, house icon bottom-left, ▲ marker, `◇ Hip ⌄` bottom-right.

### Bottom summary
`Total 2,494 ft²  |  Heated 2,494 ft²  |  1 Story` + `⚡ Create`.

---

# Synthesis

## Interaction model recovered from this batch

```
Step 2 "Place Rooms & Shape"  (route: …/create/{ulid}/editor — never changes)
│
├─ Tool: Rooms (default)        → left panel = "My Rooms"
│    └─ click "Add Shape" card  → Tool: Shape, left panel = "My House Shape" modal
│
├─ Tool: Shape
│    ├─ tab "Choose Shape"  → paginated/scrolling 2-col shape library
│    │    ├─ cell "Start my own" (+)         → custom shape drawing
│    │    ├─ hover cell  → canvas live-preview + "Add to canvas" tooltip
│    │    └─ click cell  → shape committed; footer "…selected";
│    │                      areas recompute; placed rooms auto-resize;
│    │                      modal collapses to compact "My House Shape" panel
│    ├─ tab "My Shapes"     → user's saved/pinned shapes
│    ├─ 📌 pin              → save Current Shape to My Shapes
│    ├─ "Choose Different Shape" → reopens the library
│    ├─ canvas polygon editing: vertex handles, edge midpoint + quarter pills,
│    │                          live per-edge dimension chips
│    ├─ selection toolbar: Remove | Mirror | Recenter
│    └─ canvas "×" button   → deselect shape → back to Tool: Rooms / My Rooms panel
│
└─ Tool: Roof (appears only once a shape exists)
     └─ 3D preview panel: orbit (spawns "Reset camera"), ▲ front marker,
        "Roof Shape" dropdown → {Hip, Gable, Flat with Overhangs, Flat with Parapets}
```

## Tutorial progress model
Measured black-fill fraction of the tutorial progress bar:

| Step | Title | Fill |
|---|---|---|
| 2 | Add a house shape | 14 % |
| 3 | Pick a shape | 20 % |
| 4 | Place the house shape | 26 % |
| 5 | Choose a roof shape you like | 32 % |
| 6 | Click outside of shape to see room list | 38 % |
| 7 | Place a Room That Matters | 44 % |

Fill is perfectly linear at **+6 % per step**, fitting `fill ≈ 6·N + 2`. That implies a **~16-step product tour** total (step 16 → 98 %). Steps 1 and 8–16 are outside this batch.

## Colour system (room swatches)
| Family | Rooms | Hue |
|---|---|---|
| Sleeping | Primary Bedroom, Bedroom | salmon / coral — saturation encodes "primary" vs secondary vs small |
| Wet | Primary Bathroom, Bathroom | blue — saturated for primary, light for secondary |
| Storage | Primary Closet, Bed Closet | orange / peach |
| Social & service | Kitchen, Dining | golden yellow |
| Vehicle / unheated | Garage | mauve / pale lavender-pink (also the tint used for the garage bay inside every shape thumbnail) |
| Selection | any placed room, when selected | teal/green stroke |

Chip **area on screen ∝ room area in ft²**; chips wrap into rows sorted largest-first; every chip shows `{S|M|L} {n} ft²`.

## Typography & visual language
- **Serif** (Playfair/Prata-like, high-contrast, swashed `D`) for the `Drafted` wordmark **and** for tutorial card titles — used as the "editorial voice".
- **Geometric/humanist sans** (Inter-ish) for all UI: bold for labels and values, regular grey for secondary text, small letterspaced uppercase for the `TUTORIAL STEP N` eyebrow.
- Surfaces: warm light grey app background, **white** cards/panels/modals, ~12–16 px corner radii, soft low-opacity shadows, 1 px hairline rules between sections.
- Accents: **gold/ochre** = AI (lightning bolt, `Best Balance`, active-tool outline, the `Create` bolt); **green** = Snap; **teal** = selection; **black** = primary buttons and the current selection in option grids.
- Canvas: sage/olive green ground, dual-density grid (dotted minor + dashed major), centre cross-hair, four cardinal labels.
- Icon style: 1.5–2 px stroke outline icons throughout (house, hand/palm, people, lightning, magnet, magnifier, eraser, bookmark, pin, car, padlock, crosshair).
- Layout proportions at 1920 px: left panel ≈ 316 px wide; canvas square ≈ 740 × 740 centred; 3D preview panel ≈ 358 × 361 anchored bottom-right; tutorial card ≈ 316 px wide anchored top-right; bottom summary card ≈ 312 px centred.

## Open questions / not legible in this batch
- The **top-right nav cluster** (Learn button, credits pill "N left", avatar) is occluded by the tutorial card in all 12 frames — exact labels/counts unknown.
- The **room list below the fold** (rooms 12–17 of the AI-Create bucket) was never scrolled into view.
- What the **`Reset ⌄`** dropdown contains (it stayed disabled).
- Whether **`My Shapes`** tab has content; it was never opened.
- What the **site/lot pin tool** (first toolbar icon) does; never activated.
- What the **ⓘ** next to `Main House Area` reveals.
- Whether the roof choice made during the tutorial persists (it showed `Hip` again in shot 11 after `Flat with Parapets` was chosen in shot 10).
- Design variants (A/B/C/D/E), version pagination (1/5, 5/5), capacity %, materials, and pricing/plan text — **none appear in this batch**; those belong to Step 3 Results.
