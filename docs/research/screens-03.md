# Drafted (drafted.ai) — Forensic Screen Analysis, Batch 03

**Source:** 12 sequential screenshots of one user session, `/home/dell/Pictures/Screenshots/Screenshot from 2026-09-12 15-03-32.png` … `15-07-04.png` (1920×1200, Firefox on Linux).

**Scope of this batch:** the entire batch sits on **Wizard Step 1 — "Create Room List"**, on a single route, with **Tutorial Step 1** coach-mark permanently visible. The 12 frames capture (a) the +/− room counter interaction, (b) the S/M/L size segmented control with hover-preview, (c) the live 3D room illustration, (d) the area-proportional "My Rooms" bubble panel, (e) the running Total/Heated/Story summary and Continue CTA, (f) the paywalled room types.

---

## 0. Constant chrome present in all 12 frames

### 0.1 Browser (not part of the product, recorded for completeness)
- Firefox, dark title bar. Tab strip: `New tab`, `Local Model Chat`, `Local Model Chat`, **`Drafted - Design your d…`** (active, red/dark "D" favicon), `Free 3D House Design…`, `+`.
- Toolbar: back / forward / reload, then the address bar.
- In 8 of 12 frames a GNOME "Screenshot captured / You can paste the image from the clipboard" toast overlays the URL bar (x≈745–1240, y≈38–140), hiding the left half of the URL. The 4 unobscured frames (`15-06-45`, `15-06-55`, `15-07-01`, plus partially `15-06-47`) reveal the full URL.

### 0.2 URL (verbatim, identical in all 12 frames)
```
www.drafted.ai/app/studio/projects/114312/create/01M2B203CPTDZ0S2DVMTQF8AVC/room-list
```
Route shape: `/app/studio/projects/{projectId:numeric}/create/{ulid}/{stepSlug}`
- `projectId` = `114312` (plain integer)
- create-session id = `01M2B203CPTDZ0S2DVMTQF8AVC` (26-char ULID, Crockford base32)
- step slug = `room-list` (step 1 of the wizard)
- Firefox renders `www.drafted.ai` in white and the path in grey — i.e. no `https://` shown, domain highlighted.

### 0.3 Product top nav (fixed bar, y ≈ 150–197, background `#F4F1EB`-ish warm grey)
Left → right:
1. **`Drafted`** wordmark — high-contrast **serif** (Playfair/Recoleta-like), black, with a swash/ligature tail on the terminal "d". x ≈ 378–448.
2. **`⌂ My Studio`** — small outline house icon + bold sans label. Acts as the back-to-dashboard link. x ≈ 470–560.
3. Thin vertical divider `|` at x ≈ 578.
4. **`‹ Back`** — chevron-left + "Back", medium-grey sans. x ≈ 590–640.
5. **Centred wizard stepper** (x ≈ 925–1350):
   - **`①  Create Room List`** — filled **black** circle with white "1"; label bold near-black. **ACTIVE in all 12 frames.**
   - `—` em-dash connector (grey)
   - `②  Place Rooms & Shape` — grey filled circle with white "2"; label medium grey (inactive)
   - `—` connector
   - `③  Results` — grey circle "3"; grey label (inactive)
6. **Right cluster (obscured by the tutorial popup in every frame)** — only the top 8 px of the controls peek above the popup:
   - a **pill button #1**, rounded-rect, x ≈ 1658–1735 (≈77 px wide)
   - a **pill button #2**, rounded-rect, x ≈ 1744–1856 (≈112 px wide)
   - a **dark circular avatar**, centre x ≈ 1888, r ≈ 18 px (only the top-left arc of the black ring is visible past the popup's rounded corner)
   > These correspond to the documented `Learn` button + `N left` credits pill + user avatar; their labels cannot be read in this batch.

### 0.4 Page background
Warm light grey/greige `#F4F1EB` (measured `#B7B5B0` under the tutorial scrim — see §0.6).

### 0.5 Tutorial coach-mark (identical in all 12 frames)
Floating white rounded card, **x 1577–1892, y 163–332** (316 × 170 px), radius ≈ 14, soft drop shadow. Anchored top-right, overlapping the top nav.

| Element | Value |
| --- | --- |
| Eyebrow | `TUTORIAL STEP 1` — 11 px, uppercase, letter-spaced ≈ 0.06em, grey `#6B6560`, semibold sans |
| Headline | **`Build your dream room list`** — ~20 px **serif** bold, near-black |
| Body ¶1 | `More complete room lists give better direction for our AI to meet your needs.` |
| Body ¶2 | `Click Continue when you're done.` |
| Body style | ~14.5 px sans, `#44403C`, line-height ≈ 1.45 |
| Progress bar | 285 px track `#E7E5E4`, 4 px tall, fully rounded; **black fill 18 px = 6.3 %** → suggests step 1 of ≈ 16 tour steps (or a timed auto-advance) |
| Buttons | **none** — no Next / Skip / Got-it. The card is dismissed by acting on the highlighted UI. |

### 0.6 Tutorial spotlight scrim
A ~25 % black scrim (measured: rendered pixels ≈ 0.752 × true colour) covers the whole viewport **except** three "lit" regions:
1. the centred white **Room Catalog + 3D preview card**,
2. the bottom-right **summary + Continue** floating bar,
3. the tutorial popup itself.

The **My Rooms** right panel is therefore visibly dimmed in every frame of this batch. All colours quoted below as "true" have been divided by 0.752 to undo the scrim.

### 0.7 Main content layout (three columns + one floating bar)
```
x:  487 ───────────────── 1440    1450 ────────── 1790
    ┌───────────────────────────┐ ┌───────────────────┐
    │  Room Catalog card        │ │  My Rooms panel   │   y 218 → 1168
    │  ┌─────────┬────────────┐ │ │  (proportional    │
    │  │ catalog │ 3D preview │ │ │   bubble grid)    │
    │  │ list    │  canvas    │ │ │                   │
    │  │ 505-800 │  800-1440  │ │ │  Room List        │
    │  └─────────┴────────────┘ │ │  Capacity footer  │
    └───────────────────────────┘ └───────────────────┘
                                  ┌───────────────────┐
                                  │ Total / Heated /  │   y 1060 → 1160
                                  │ Continue CTA      │  (floating card)
                                  └───────────────────┘
```

### 0.8 Room Catalog card (white, radius ≈ 12, 1 px `#E7E5E4` border, x 487–1440, y 218–1168)
- **Header row** (spans full card width, y ≈ 240–285): left = small **outline cube/box icon** + **`Room Catalog`** (bold sans ~16 px). Right = **`🗑 Clear All`** outlined pill button (trash icon + label, 1 px grey border, radius full, x ≈ 1330–1416).
- 1 px horizontal divider below the header.
- Below: two panes side by side — the scrollable category list (left, native Firefox scrollbar with stepper arrows at x ≈ 787–797) and the 3D preview canvas (right).

### 0.9 Bottom-right floating summary bar (white card, radius ≈ 14, shadow; x 1452–1790, y 1062–1160)
- **Summary line** (centred, ~14 px): `Total <N> ft²  |  Heated <N> ft²  |  <N> Story` — the numbers in **bold black**, the labels in grey, separated by thin vertical rules.
- **Primary CTA**: full-width **black pill button**, radius ≈ 10, white bold text ~17 px:
  - left icon: **2×2 grid of white squares**
  - label: `Continue with only N rooms` (N < 11) / `Continue with N rooms` (N ≥ 11)
  - right icon: `›` chevron-right

---

## 1. `Screenshot from 2026-09-12 15-03-32.png` — Bathroom ×2 just added

- **URL:** `www.drafted.ai/app/studio/projects/114312/create/01M2B203CPTDZ0S2DVMTQF8AVC/room-list` (left portion masked by the OS toast, recovered from later frames)
- **Wizard step:** 1 — Create Room List. **Tutorial step 1** visible.

### Room Catalog list (left pane, x 505–800)
Group header **`≡ Beds & Baths`** — a 3-line hamburger **drag handle** icon + grey uppercase-ish bold label ~14 px. (Groups are re-orderable.)

Rows (each row = 44 px tall, radius 10; a 4 px vertical **family accent bar** sits at x ≈ 529–535 spanning the whole family cluster):

| # | Icon | Label | Sub-label | Counter | Row bg | Accent bar |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | bed w/ headboard | **Primary Bed** | — | `⊖ 1 ⊕` — **⊖ disabled/greyed** (min = 1) | `#FEF2EE` | `#FEDFD6` (bed family, salmon) |
| 2 | low bed (side) | **Bedroom** | — | `⊖ 2 ⊕` | `#FEF2EE` | same bar as row 1 |
| 3 | bathtub | **Primary Bath** | — | `⊖ 1 ⊕` | `#F4F9FD` | `#D1E5F7` (bath family, blue) |
| 4 | shower head | **Bathroom** | — | `⊖ 2 ⊕` — **⊕ has a focus ring** (just clicked) | `#F4F9FD` | same bar as row 3 |
| 5 | wardrobe/dresser | **Primary Closet** | `Auto-included wit…` (truncated) | `⊖ 1 ⊕` — **⊖ disabled/greyed** | `#FEF2E8` | `#FDDBC1` (closet family, peach) |
| 6 | clothes hanger | **Bed Closet** | `Auto-included with Bed…` (truncated) | `2` with **⊕ disabled/greyed**, no ⊖ at all | `#FFF7F1` | same bar as row 5 |

Group header **`≡ Living Spaces`** then:

| Icon | Label | Control | Row bg | Accent bar |
| --- | --- | --- | --- | --- |
| stove/counter | Kitchen | `⊕` only (count 0) | white | `#FDE08F` spans Kitchen+Dining+Breakfast Nook |
| dining table ("HTH" glyph) | Dining | `⊕` | white | ″ |
| banquette/booth | Breakfast Nook | `⊕` | white | ″ |
| shelving/jars | Pantry | `⊕` | white | `#FDE08F` (own short bar) |
| sofa | Living | `⊕` | white | `#FDE08F` spans Living + the upgrade card |

**Upgrade/paywall card** (inset, bg `#FBF8EE`, 1 px `#E3D9A8` border, radius 10, x ≈ 543–778, y ≈ 955–1112):
- Badge pill `UPGRADE SUBSCRIPTION` — uppercase, 10 px, letter-spaced, olive text on a soft-yellow pill with a darker yellow border.
- **`View`** — black pill button, white bold text, top-right of the card.
- Locked rows, each with a **circled padlock** icon on the right instead of `⊕`:
  - lamp icon — **Den** 🔒
  - sofa+tv icon — **Family Room** 🔒
  - plant icon — **Sunroom** 🔒

Below the card, partially visible: door icon — **Foyer** with `⊕`, accent bar `#FDE08F`. List continues below the fold (native scrollbar thumb at ~55 % height).

### 3D preview canvas (right pane of the card)
- Hand-drawn **isometric line-art** room, black ink strokes, white/pale-grey walls, soft cast shadow, small `+` tick marks at wall corners (dimension extension marks).
- Content: **a bathroom** — vanity with mirror & toiletries, toilet, bathtub/shower with glass panel and shower head; the **floor is tinted pale blue** (the bath family colour).
- **Proportional swatch chip** floating above the footer, centred x ≈ 1118, y ≈ 995–1055: rounded square filled `#D1E5F7`, containing `Bathroom` (bold 11 px) over `S - 33 ft²` (11 px grey). **Chip side length scales with √area.**
- **Footer row** (y ≈ 1085–1118): left = shower-head icon + **`Bathroom`** (bold 15 px). Right = **S / M / L segmented control**: `S` is a **black filled rounded square (32×32)** with white bold letter; `M` and `L` are plain grey letters with no chrome.

### My Rooms panel (right column, dimmed)
Header: small **3-circles/people icon** + **`My Rooms`** bold ~16 px; 1 px divider beneath.

Area-proportional **bubble grid** — every room is a rounded square whose side ≈ 7 × √(area ft²), clamped to a ~54 px minimum, **bottom-aligned per row**, wrapping left-to-right in catalog order:

| Card | Label | Sub-label | Measured px | True colour |
| --- | --- | --- | --- | --- |
| 1 | **Primary Bedroom** | `M 225 ft²` | 105×105 | `#F6C3B4` |
| 2 | **Bedroom** | `M 152 ft²` | 82×82 | `#F6DACF` |
| 3 | **Bedroom** | `S 104 ft²` | 67×67 | `#F6DACF` |
| 4 | **Primary Bathroom** | `S 52 ft²` | 54×54 | `#B1D1EB` |
| 5 | **Bathroom** | `S 33 ft²` | 54×54 | `#CDDFEE` |
| 6 | **Bathroom** | `S 33 ft²` | 54×54 | `#CDDFEE` |
| 7 | **Primary Closet** | `M 62 ft²` | 58×58 | `#F5C39A` |
| 8 | **Bed Closet** | `M 23 ft²` | 54×54 | `#F6D6BD` |
| 9 | **Bed Closet** | `S 11 ft²` | 54×54 | `#F6D6BD` |
| 10 | **Hallway** | `M 35 ft²` | 54×54 | `#F6E3AE` |

Panel footer (above a 1 px divider): **`Room List Capacity ⓘ`** on the left (bold, with a circled-i info icon), **`28 % Filled ●`** on the right (grey text + solid **green** dot `#22C55E`). Below: a full-width 6 px rounded track `#D6D3D1` with a **green fill at ≈ 28 %**.

### Bottom bar
`Total 765 ft²  |  Heated 765 ft²  |  1 Story` · **`▦ Continue with only 9 rooms ›`**

---

## 2. `15-03-38.png` — Primary Closet incremented 1 → 2

**Transition from #1:** user clicked the **`⊕` on the Primary Closet row**. (The Bathroom row's focus ring is gone; Primary Closet count changed 1 → 2 and its `⊖` became enabled.)

Changes only:
- Catalog: **Primary Closet `⊖ 2 ⊕`** (⊖ no longer greyed).
- 3D canvas now shows a **Primary Closet**: isometric walk-in closet — two facing runs of hanging rails/shelving, peach-tinted floor.
- Footer label: closet icon + **`Primary Closet`**; segmented control `S` black, `M`/`L` plain.
- Chip: `#FDDBC1`-family peach square, `Primary Closet` / `S - 27 ft²` (small chip).
- My Rooms grid re-flows to **11 cards**:
  - Row 1: Primary Bedroom M 225, Bedroom M 152
  - Row 2: Bedroom S 104, Primary Bathroom S 52, Bathroom S 33, Bathroom S 33
  - Row 3: **Primary Closet M 62**, **Primary Closet S 27** *(new)*, Bed Closet M 23, Bed Closet S 11
  - Row 4: **Hallway M 36** (was 35 — hallway auto-resizes with the house)
- Capacity: **32 % Filled**, green.
- Bottom bar: `Total 794 ft²  |  Heated 794 ft²  |  1 Story` · `Continue with only 10 rooms ›`

---

## 3. `15-03-41.png` — hovering **M** on the size control

**Transition from #2:** pointer moved onto the **`M`** segment. No click committed.

- Segmented control: `S` still **black-filled (selected)**; **`M` now rendered as a white rounded square with a 1 px grey border** = hover/preview state.
- 3D canvas redraws a **larger** Primary Closet (more shelving runs, deeper room).
- Chip grows and now reads `Primary Closet` / **`M - 62 ft²`**.
- **Nothing else changes**: My Rooms still shows Primary Closet M 62 + S 27, Total still `794 ft²`, still `Continue with only 10 rooms`, capacity still 32 %.
  → **Confirms the S/M/L control previews on hover without mutating the room list.**

---

## 4. `15-03-44.png` — hovering **L**

**Transition from #3:** pointer moved from `M` to `L`.
- `S` black-filled; **`L` outlined** (hover); `M` back to plain.
- 3D canvas: the largest Primary Closet variant — island/bench in the middle, three walls of shelving.
- Chip: `Primary Closet` / **`L - 96 ft²`** (largest chip).
- All totals, capacity (32 %), room list and CTA unchanged.

**Recovered size ladder for Primary Closet: S = 27 ft², M = 62 ft², L = 96 ft².**

---

## 5. `15-03-50.png` — preview switched to **Bed Closet** (S)

**Transition from #4:** the user hovered/selected the **Bed Closet** catalog row (no counter change — Bed Closet is auto-managed and its `⊕` is disabled at 2).
- Catalog unchanged (Primary Closet 2, Bed Closet 2 with greyed `⊕`).
- 3D canvas: a **reach-in Bed Closet** — two narrow sliding/bifold door panels, peach floor.
- Footer: hanger icon + **`Bed Closet`**; `S` black, `M`/`L` plain.
- Chip: `Bed Closet` / `S - 11 ft²` (smallest chip).
- My Rooms, capacity 32 %, `Total 794 ft²`, `Continue with only 10 rooms` — all unchanged.

---

## 6. `15-03-52.png` — hovering **M** on Bed Closet

- `S` black-filled, **`M` outlined** (hover).
- 3D canvas: a slightly deeper open closet with an angled hanging rail; peach floor.
- Chip: `Bed Closet` / **`M - 23 ft²`**.
- Everything else identical (Total 794, 32 %, 10 rooms).

---

## 7. `15-03-54.png` — hovering **L** on Bed Closet

- `S` black-filled, **`L` outlined** (hover); `M` plain.
- 3D canvas: widest Bed Closet, full-width hanging rail with hangers, shelf above.
- Chip: `Bed Closet` / **`L - 38 ft²`**.
- Totals/capacity unchanged.

**Recovered size ladder for Bed Closet: S = 11 ft², M = 23 ft², L = 38 ft².**

---

## 8. `15-06-45.png` — Kitchen added (URL fully visible)

**Transition from #7 (≈ 2 min 51 s gap):** user clicked **`⊕` on the Kitchen row**.

- **URL bar unobscured** → `www.drafted.ai/app/studio/projects/114312/create/01M2B203CPTDZ0S2DVMTQF8AVC/room-list`. Tab title `Drafted - Design your d…`.
- Catalog: Kitchen row becomes **active** — bg `#FFF8E5`, bold label, and its control is now **`⊖ 1 [MAX]`**: the `⊕` is replaced by a dark-grey (`#78716B`) pill badge reading **`MAX`** in white 10 px caps → **Kitchen is capped at 1**.
- 3D canvas: a **galley kitchen** — single run of base + wall cabinets, tall fridge/pantry column, range with hood; yellow-tinted floor.
- Footer: stove icon + **`Kitchen`**; `S` black.
- Chip: `#FDE08F` square, `Kitchen` / `S - 106 ft²`.
- My Rooms adds **`Kitchen S 106 ft²`** (`#F6DA8E`) and **Hallway grows to `M 41 ft²`**. Grid: row 3 = Primary Closet M 62, Primary Closet S 27, Bed Closet M 23, Bed Closet S 11; row 4 = Kitchen S 106, Hallway M 41.
- Capacity: **35 % Filled**, green.
- Bottom bar: `Total 911 ft²  |  Heated 911 ft²  |  1 Story` · **`Continue with 11 rooms ›`** — note the word **"only" disappears at 11 rooms**.

---

## 9. `15-06-47.png` — hovering **M** on Kitchen

- `S` black-filled, **`M` outlined** (hover).
- 3D canvas: L-shaped kitchen with a **peninsula/island + 4 bar stools**, upper cabinets on two walls.
- Chip grows: `Kitchen` / **`M - 189 ft²`**.
- My Rooms still `Kitchen S 106 ft²`; Total still 911; capacity 35 %; CTA `Continue with 11 rooms`.

---

## 10. `15-06-55.png` — hovering **L** on Kitchen

- `S` black-filled, **`L` outlined**.
- 3D canvas: the largest kitchen — full U of cabinetry, integrated fridge wall, range + hood, **large island with 4 stools and a sink**, doorway on the right wall; yellow floor.
- Chip: `Kitchen` / **`L - 272 ft²`** (largest chip in the batch, ≈ 115 px).
- Totals/room list/capacity unchanged (911 ft², 35 %, 11 rooms).

**Recovered size ladder for Kitchen: S = 106 ft², M = 189 ft², L = 272 ft².**

---

## 11. `15-07-01.png` — Dining added

**Transition from #10:** user clicked **`⊕` on the Dining row**.

- Catalog: Dining row becomes active (bg `#FFF8E5`, bold) with **`⊖ 1 ⊕`** (Dining is *not* capped — it keeps a live `⊕`, unlike Kitchen).
- 3D canvas: a **dining room** — two tall windows on the back walls, a rectangular table with 6 chairs, a round chandelier above; yellow floor.
- Footer: dining-table icon + **`Dining`**; `S` black-filled, `M`/`L` plain.
- Chip: `Dining` / `S - 95 ft²`.
- My Rooms row 4 becomes **Kitchen S 106**, **Dining S 95** *(new)*, **Hallway M 46** (up from 41).
- Capacity: **39 % Filled**, green.
- Bottom bar: `Total 1,015 ft²  |  Heated 1,015 ft²  |  1 Story` · `Continue with 12 rooms ›` (note the thousands comma).

---

## 12. `15-07-04.png` — **M clicked** (committed selection) on Dining

**Transition from #11:** the user **clicked** `M` (not just hovered).

- Segmented control: **`M` is now the black-filled square** *and* carries the focus/hover outline; **`S` reverts to a plain grey letter**. This is the only frame in the batch where the black fill has moved off `S`.
- 3D canvas: a **larger dining room** — longer table with 8 chairs, three windows, chandelier.
- Chip: `Dining` / **`M - 167 ft²`**.
- **However**: My Rooms still shows `Dining S 95 ft²`, `Total 1,015 ft²`, `39 % Filled`, `Continue with 12 rooms`. → the committed size had not yet propagated to the room list at capture time (see Open Questions).

**Recovered size ladder for Dining: S = 95 ft², M = 167 ft², L = (not observed).**

---

## 13. Synthesis

### 13.1 Route model
| Route | Meaning |
| --- | --- |
| `/app/studio/projects/{projectId}/create/{ulid}/room-list` | Wizard step 1 (this batch) |
| `/app/studio` (via **My Studio**) | Studio / project dashboard |
| implied step 2 | `Place Rooms & Shape` |
| implied step 3 | `Results` |

`projectId` is a short integer; the per-generation run is a ULID; the step is a trailing slug. The wizard stepper is *display-only* in this batch (steps 2 and 3 are not clickable-looking).

### 13.2 Domain model recovered
```
Project { id: 114312 }
 └─ CreateSession { ulid: 01M2B203CPTDZ0S2DVMTQF8AVC, step: "room-list" }
     ├─ RoomCatalog
     │    └─ Group { name, dragHandle }           // "Beds & Baths", "Living Spaces"
     │         └─ Family { accentColor }          // beds / baths / closets / kitchen-dining / …
     │              └─ RoomType {
     │                    name, icon, count, min, max,
     │                    autoIncluded: bool, autoIncludedNote: string,
     │                    locked: bool,           // requires subscription upgrade
     │                    sizes: { S: ft², M: ft², L: ft² },
     │                    preview3dBySize
     │                 }
     └─ RoomList
          ├─ RoomInstance { type, size: S|M|L, areaFt2 }
          ├─ auto: Hallway (circulation, recomputed on every change)
          └─ summary { totalFt2, heatedFt2, stories, roomCount, capacityPct }
```

### 13.3 Room type catalogue observed (with grouping + colour family)
**Group "Beds & Baths"** (drag handle `≡`)
- *Bed family* (accent `#FEDFD6`): **Primary Bed** (min 1), **Bedroom**
- *Bath family* (accent `#D1E5F7`): **Primary Bath**, **Bathroom**
- *Closet family* (accent `#FDDBC1`): **Primary Closet** (`Auto-included wit…`, min 1), **Bed Closet** (`Auto-included with Bed…`, count is derived — `⊕` permanently disabled, no `⊖`)

**Group "Living Spaces"** (accent `#FDE08F` throughout, split into sub-clusters by bar)
- cluster A: **Kitchen** (max 1 → `MAX` badge), **Dining**, **Breakfast Nook**
- cluster B: **Pantry**
- cluster C: **Living**, then the paywall card: **Den** 🔒, **Family Room** 🔒, **Sunroom** 🔒
- cluster D: **Foyer** (list continues below the fold)

**Auto-generated (not in the catalog):** **Hallway** — appears in My Rooms, always size `M`, area recomputed on every list change (35 → 36 → 41 → 46 ft²), and **excluded from the room count**.

### 13.4 Room-size ladders recovered (ft²)
| Room type | S | M | L |
| --- | --- | --- | --- |
| Primary Closet | 27 | 62 | 96 |
| Bed Closet | 11 | 23 | 38 |
| Kitchen | 106 | 189 | 272 |
| Dining | 95 | 167 | — |
| Bathroom | 33 | — | — |
| Primary Bathroom | 52 | — | — |
| Bedroom | 104 | 152 | — |
| Primary Bedroom | — | 225 | — |
| Hallway (auto) | — | 35 / 36 / 41 / 46 | — |

### 13.5 Totals arithmetic (verified across 4 states)
| Frame | Rooms | Σ room areas incl. hallway | Total shown | ratio |
| --- | --- | --- | --- | --- |
| 15-03-32 | 9 | 730 | **765** | 1.048 |
| 15-03-38 | 10 | 758 | **794** | 1.047 |
| 15-06-45 | 11 | 869 | **911** | 1.048 |
| 15-07-01 | 12 | 969 | **1,015** | 1.047 |

→ **`Total ft² = round(Σ room areas × ≈1.047)`** — a constant ~4.7 % gross-up (walls / structure). **`Heated ft² == Total ft²`** in every frame (no unheated spaces like a garage present). **`1 Story`** constant.

**Room count** = Σ of catalog counters exactly (9 / 10 / 11 / 12); the Hallway card is *not* counted.

**Capacity**: 9→28 %, 10→32 %, 11→35 %, 12→39 %. Roughly linear in room count against a ceiling of ≈ 31 rooms (or ≈ 2,600 ft²); the indicator is green at all four values.

### 13.6 Interaction model recovered
1. `⊕` / `⊖` on a catalog row mutates the count → a new `RoomInstance` at the **default size S** is appended, Hallway is recomputed, totals + capacity + CTA copy all update live.
2. Adding/incrementing a room also **loads that room type into the 3D preview** and sets the footer label + chip.
3. **Hover** over `M` or `L` → white outlined chip; the 3D model, the swatch chip and its `SIZE - N ft²` caption re-render **as a preview only**; the room list, totals and capacity do **not** change.
4. **Click** on `M` → the black fill moves to `M` (committed selection); the preview stays at M.
5. A row at its ceiling shows a **`MAX`** badge in place of `⊕` (Kitchen).
6. A row at its floor shows a **greyed `⊖`** (Primary Bed at 1, Primary Closet at 1).
7. A derived row shows **no `⊖` and a greyed `⊕`** (Bed Closet, count driven by Bedroom count).
8. Locked rows show a **circled padlock** and sit inside an `UPGRADE SUBSCRIPTION` card with a black **`View`** CTA.
9. `Clear All` (trash icon) resets the whole list.
10. Group headers carry a **drag handle**, implying group reordering.
11. CTA copy is nudge-y below a threshold: **"Continue with only N rooms"** for N ≤ 10, **"Continue with N rooms"** for N ≥ 11.

### 13.7 Visual design system
- **Wordmark**: `Drafted` in a high-contrast serif with a swashed terminal `d`. The tutorial headline uses the **same serif**; everything else is a geometric/neo-grotesque **sans** (Inter/Figtree-like) with bold labels and grey secondary text.
- **Neutrals**: page `#F4F1EB` (warm greige), cards `#FFFFFF`, borders `#E7E5E4`, body text `#1C1917`, secondary `#78716B`.
- **Black** is the single "primary" colour: filled CTA pill, selected segmented item, `View` upgrade button, active stepper dot.
- **Room colour system** — each family has a light *accent/chip* tint and a deeper *bubble* tint; "Primary ___" variants are a **more saturated** version of the family colour:

| Family | Accent bar / canvas chip | Bubble (standard) | Bubble (Primary variant) |
| --- | --- | --- | --- |
| Beds | `#FEDFD6` | `#F6DACF` | `#F6C3B4` |
| Baths | `#D1E5F7` | `#CDDFEE` | `#B1D1EB` |
| Closets | `#FDDBC1` | `#F6D6BD` | `#F5C39A` |
| Kitchen / Dining | `#FDE08F` | `#F6DA8E` | — |
| Circulation (Hallway) | — | `#F6E3AE` | — |

- **Active catalog rows** get the palest family tint (`#FEF2EE` beds, `#F4F9FD` baths, `#FEF2E8` / `#FFF7F1` closets, `#FFF8E5` living) plus bold text; inactive rows are pure white with grey text.
- **Status colour**: a single green (`#22C55E`) for the capacity dot and bar fill.
- **3D previews**: monochrome **hand-drawn isometric line art** (sketchy ink strokes, slightly wobbly), white/pale-grey surfaces, soft grey shadow, corner `+` dimension ticks, and the **floor flood-filled in the room's accent colour**.
- **Radii**: rows/cards 10–14 px, bubbles ~12 px, pills fully rounded.

---

## 14. Open questions / not resolvable from this batch
1. The two nav pill buttons and the avatar are **completely hidden** by the tutorial popup — labels (`Learn`, `N left` credits) cannot be confirmed here.
2. Whether clicking `M` (frame 12) eventually rewrites the room list entry from `S 95` to `M 167` — the capture shows the list unchanged. It may apply only to the *next* room added of that type, or the list may update on a later tick.
3. No design variants (A/B/C/D/E), version pagination (1/5, 5/5), canvas dimension labels (e.g. "52 ft 4 in"), material names or plan/price text appear anywhere in this batch — those belong to steps 2/3.
4. The catalog list scrolls below `Foyer`; additional groups/room types (e.g. Utility, Garage, Outdoor) are not visible.
5. Tutorial steps 2…N are not shown; the 6.3 % progress fill hints at ≈ 16 total steps.
6. The `ⓘ` next to "Room List Capacity" was never hovered, so its tooltip copy is unknown.
7. The exact formula behind `% Filled` (room-count-based vs area-based) is not determinable from 4 samples.
